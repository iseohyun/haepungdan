import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { Gathering, LocationPosition, POI } from '../types';
import { percentToGps, createLocationFromPercent } from '../utils/coordinates';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
  Sparkles,
  Layers,
  Crosshair,
} from 'lucide-react';

export interface MapViewerRef {
  focusCoordinate: (x_pct: number, y_pct: number, scale?: number) => void;
  resetView: () => void;
}

interface MapViewerProps {
  pois: POI[];
  gatherings: Gathering[];
  selectedGatheringId: string | null;
  onSelectGathering: (gathering: Gathering) => void;
  onSelectPoi?: (poi: POI) => void;
  isPickingLocation?: boolean;
  onLocationPicked?: (pos: LocationPosition) => void;
  showPois?: boolean;
  onTogglePois?: () => void;
}

export const MapViewer = forwardRef<MapViewerRef, MapViewerProps>(({
  pois,
  gatherings,
  selectedGatheringId,
  onSelectGathering,
  onSelectPoi,
  isPickingLocation = false,
  onLocationPicked,
  showPois = true,
  onTogglePois,
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const panzoomInstanceRef = useRef<PanzoomObject | null>(null);

  const [cursorGps, setCursorGps] = useState<{ lat: number; lng: number; x_pct: number; y_pct: number } | null>(null);

  // 세로축(Height 100vh) 또는 가로축을 여백 없이 100% 꽉 채우는 최적 Fit Scale 계산
  const getFitScale = useCallback(() => {
    if (!containerRef.current) return 1.0;
    const { clientWidth, clientHeight } = containerRef.current;
    if (clientWidth === 0 || clientHeight === 0) return 1.0;

    const scaleX = clientWidth / 701;
    const scaleY = clientHeight / 820;

    return Math.min(scaleX, scaleY);
  }, []);

  // 전체 지도 보기로 리셋 (정중앙 0,0 및 상하 밀착)
  const resetToFit = useCallback(() => {
    if (!panzoomInstanceRef.current) return;
    const fitScale = getFitScale();

    panzoomInstanceRef.current.setOptions({ minScale: fitScale });
    panzoomInstanceRef.current.zoom(fitScale, { animate: true });
    setTimeout(() => {
      panzoomInstanceRef.current?.pan(0, 0, { animate: true });
    }, 50);
  }, [getFitScale]);

  // Panzoom 초기화 및 1:1 마우스 동기화 + 정밀 상하좌우 경계 구속
  useEffect(() => {
    if (!mapElementRef.current || !containerRef.current) return;

    const fitScale = getFitScale();

    const panzoom = Panzoom(mapElementRef.current, {
      maxScale: 5.0,
      minScale: fitScale,
      startScale: fitScale,
      startX: 0,
      startY: 0,
      cursor: isPickingLocation ? 'crosshair' : 'grab',
      canvas: true,
      // 1:1 마우스 드래그 속도 일치 및 정밀 경계 이탈 방지
      setTransform: (elem, { scale, x, y }) => {
        if (!containerRef.current) {
          elem.style.transform = `scale(${scale}) translate(${x}px, ${y}px)`;
          return;
        }

        const containerW = containerRef.current.clientWidth;
        const containerH = containerRef.current.clientHeight;

        // X축 경계 구속 (지도가 화면보다 클 때만 이동 허용, 작으면 0 고정)
        let clampedX = x;
        if (701 * scale > containerW) {
          const maxAllowedX = (701 - containerW / scale) / 2;
          clampedX = Math.max(-maxAllowedX, Math.min(maxAllowedX, x));
        } else {
          clampedX = 0;
        }

        // Y축 경계 구속 (지도가 화면보다 클 때만 이동 허용, 작으면 0 고정)
        let clampedY = y;
        if (820 * scale > containerH) {
          const maxAllowedY = (820 - containerH / scale) / 2;
          clampedY = Math.max(-maxAllowedY, Math.min(maxAllowedY, y));
        } else {
          clampedY = 0;
        }

        elem.style.transform = `scale(${scale}) translate(${clampedX}px, ${clampedY}px)`;
      },
    });

    panzoomInstanceRef.current = panzoom;

    const parent = mapElementRef.current.parentElement;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      panzoom.zoomWithWheel(e);
    };

    parent?.addEventListener('wheel', onWheel, { passive: false });

    // 초기 화면 중앙 맞춤
    const timer = setTimeout(() => {
      resetToFit();
    }, 80);

    // 윈도우 리사이즈 시 화면 맞춤 및 minScale 갱신
    const handleResize = () => {
      if (panzoomInstanceRef.current) {
        const newFit = getFitScale();
        panzoomInstanceRef.current.setOptions({ minScale: newFit });
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearTimeout(timer);
      parent?.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', handleResize);
      panzoom.destroy();
    };
  }, [isPickingLocation, getFitScale, resetToFit]);

  // 외부에서 특정 좌표로 포커스 이동할 수 있도록 ImperativeHandle 제공
  useImperativeHandle(ref, () => ({
    focusCoordinate: (x_pct: number, y_pct: number, targetScale = 2.2) => {
      if (!panzoomInstanceRef.current) return;

      // 중앙(50%, 50%) 기준 오프셋 계산
      const targetX = ((50 - x_pct) / 100) * 701;
      const targetY = ((50 - y_pct) / 100) * 820;

      panzoomInstanceRef.current.zoom(targetScale, { animate: true });
      setTimeout(() => {
        panzoomInstanceRef.current?.pan(targetX, targetY, { animate: true });
      }, 80);
    },
    resetView: () => {
      resetToFit();
    },
  }));

  // 마우스 이동 시 좌표 계산 (Bounding Box 공식 적용)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapElementRef.current) return;
    const rect = mapElementRef.current.getBoundingClientRect();

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const x_pct = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    const y_pct = Math.max(0, Math.min(100, (clientY / rect.height) * 100));

    const { lat, lng } = percentToGps(x_pct, y_pct);
    setCursorGps({ lat, lng, x_pct, y_pct });
  };

  // 지도 클릭 핸들러 (좌표 선택 모드일 때 위치 반환)
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isPickingLocation || !onLocationPicked || !mapElementRef.current) return;
    const rect = mapElementRef.current.getBoundingClientRect();

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const x_pct = Math.max(0, Math.min(100, (clientX / rect.width) * 100));
    const y_pct = Math.max(0, Math.min(100, (clientY / rect.height) * 100));

    const pos = createLocationFromPercent(x_pct, y_pct);
    onLocationPicked(pos);
  };

  const mapSrc = `${import.meta.env.BASE_URL}map.jpg`;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full bg-slate-950 overflow-hidden flex items-center justify-center select-none"
    >
      {/* 지도 캔버스 영역 (Panzoom 기본 transform-origin: 50% 50% 적용) */}
      <div
        ref={mapElementRef}
        onMouseMove={handleMouseMove}
        onClick={handleMapClick}
        className="relative transition-transform shrink-0"
        style={{
          width: '701px',
          height: '820px',
        }}
      >
        {/* 거제 지도 배경 이미지 */}
        <img
          src={mapSrc}
          alt="거제도 지도"
          className="w-full h-full object-contain pointer-events-none shadow-2xl rounded-none block"
          draggable={false}
        />

        {/* POI 마커 레이어 */}
        {showPois &&
          pois.map((poi) => (
            <div
              key={poi.id}
              onClick={(e) => {
                e.stopPropagation();
                if (onSelectPoi) onSelectPoi(poi);
              }}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
              style={{
                left: `${poi.position.x_pct}%`,
                top: `${poi.position.y_pct}%`,
              }}
            >
              <div className="w-5 h-5 rounded-full bg-sky-500/85 border border-white flex items-center justify-center text-white shadow-md group-hover:scale-125 transition-transform">
                <MapPin className="w-3 h-3" />
              </div>

              {/* POI 라벨 툴팁 */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                <div className="bg-slate-900/95 text-sky-300 text-[11px] font-semibold px-2 py-0.5 rounded shadow-lg border border-slate-700 whitespace-nowrap">
                  {poi.name}
                </div>
              </div>
            </div>
          ))}

        {/* 모임 마커 오버레이 레이어 */}
        {gatherings.filter((g) => !g.isDeleted).map((g) => {
          const isSelected = g.id === selectedGatheringId;
          const isRecruiting = g.status === 'RECRUITING';
          const isProposed = g.status === 'PROPOSED';
          const isConfirmed = g.status === 'CONFIRMED';

          return (
            <div
              key={g.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectGathering(g);
              }}
              className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform ${
                isSelected ? 'scale-125 z-30' : 'hover:scale-110'
              }`}
              style={{
                left: `${g.position.x_pct}%`,
                top: `${g.position.y_pct}%`,
              }}
            >
              {/* 마커 핀 본체 */}
              <div
                className={`relative flex items-center justify-center rounded-full border-2 shadow-xl ${
                  isRecruiting
                    ? 'w-8 h-8 bg-emerald-500 border-white text-white animate-recruiting-pulse'
                    : isProposed
                    ? 'w-7 h-7 bg-amber-500 border-white text-white'
                    : isConfirmed
                    ? 'w-7 h-7 bg-sky-500 border-white text-white'
                    : 'w-6 h-6 bg-slate-600 border-slate-300 text-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />

                {/* 선택 표시 링 */}
                {isSelected && (
                  <span className="absolute -inset-1.5 rounded-full border-2 border-ocean-400 animate-ping opacity-75" />
                )}
              </div>

              {/* 모임 제목 플로팅 라벨 */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 flex flex-col items-center pointer-events-none">
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md border ${
                    isSelected
                      ? 'bg-ocean-600 text-white border-ocean-300 ring-2 ring-white/40'
                      : isRecruiting
                      ? 'bg-slate-900/90 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700'
                  }`}
                >
                  {g.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 우측 상단 플로팅 컨트롤 (줌 & 레이어) */}
      <div className="absolute top-4 right-3 md:right-4 z-20 flex flex-col gap-2">
        <div className="glass-panel rounded-2xl p-1 flex flex-col shadow-xl">
          <button
            onClick={() => panzoomInstanceRef.current?.zoomIn()}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="확대 (+)"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => panzoomInstanceRef.current?.zoomOut()}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="축소 (-)"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetToFit}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition border-t border-slate-800 mt-1 pt-1"
            title="전체 지도 보기 (세로 밀착)"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* POI 레이어 토글 */}
        {onTogglePois && (
          <button
            onClick={onTogglePois}
            className={`p-2.5 rounded-2xl border glass-panel shadow-xl transition flex items-center justify-center ${
              showPois
                ? 'bg-ocean-600/30 border-ocean-500/50 text-ocean-300'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={showPois ? '거제 명소(POI) 숨기기' : '거제 명소(POI) 표시'}
          >
            <Layers className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* 좌측 하단 실시간 GIS 좌표 표시창 */}
      <div className="absolute bottom-3 left-3 md:left-4 z-20 glass-panel rounded-xl px-3 py-1.5 text-[11px] text-slate-300 shadow-xl flex items-center gap-2.5">
        <div className="flex items-center gap-1 text-ocean-400">
          <Crosshair className="w-3.5 h-3.5" />
          <span className="font-bold hidden xs:inline">GIS</span>
        </div>
        {cursorGps ? (
          <div className="flex items-center gap-2 font-mono">
            <span>
              <strong className="text-white">{cursorGps.lat.toFixed(5)}°N</strong>
            </span>
            <span>
              <strong className="text-white">{cursorGps.lng.toFixed(5)}°E</strong>
            </span>
            <span className="text-slate-500 hidden sm:inline">
              ({cursorGps.x_pct.toFixed(1)}%, {cursorGps.y_pct.toFixed(1)}%)
            </span>
          </div>
        ) : (
          <span className="text-slate-500">지도 위로 마우스를 이동하세요</span>
        )}
      </div>

      {/* 위치 선택 안내 오버레이 (모임 생성 중일 때) */}
      {isPickingLocation && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 bg-ocean-600 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl animate-bounce flex items-center gap-2 border border-ocean-300">
          <Crosshair className="w-4 h-4" />
          지도에서 모임 장소의 위치를 클릭하세요!
        </div>
      )}
    </div>
  );
});
