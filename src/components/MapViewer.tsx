import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { Gathering } from '../types';
import { percentToGps, gpsToPercent } from '../utils/coordinates';

import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
} from 'lucide-react';

export interface MapViewerRef {
  focusCoordinate: (x_pct: number, y_pct: number, scale?: number) => void;
  resetView: () => void;
}

interface MapViewerProps {
  gatherings: Gathering[];
  selectedGatheringId: string | null;
  onSelectGathering: (gathering: Gathering) => void;
}

export const MapViewer = forwardRef<MapViewerRef, MapViewerProps>(({
  gatherings,
  selectedGatheringId,
  onSelectGathering,
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
      cursor: 'grab',
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

    // 휠 줌 바인딩
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      panzoom.zoomWithWheel(e);
    };

    const containerEl = containerRef.current;
    containerEl.addEventListener('wheel', handleWheel, { passive: false });

    // 윈도우 리사이즈 시 fitScale 자동 갱신
    const handleResize = () => {
      const newFitScale = getFitScale();
      panzoom.setOptions({ minScale: newFitScale });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      containerEl.removeEventListener('wheel', handleWheel);
      window.removeEventListener('resize', handleResize);
      panzoom.destroy();
    };
  }, [getFitScale]);

  // 부모 컴포넌트에 focusCoordinate, resetView 함수 노출
  useImperativeHandle(ref, () => ({
    focusCoordinate: (x_pct: number, y_pct: number, targetScale = 2.4) => {
      if (!panzoomInstanceRef.current || !containerRef.current) return;

      const containerW = containerRef.current.clientWidth;
      const containerH = containerRef.current.clientHeight;

      const targetX = ((50 - x_pct) / 100) * 701;
      const targetY = ((50 - y_pct) / 100) * 820;

      let clampedX = targetX;
      if (701 * targetScale > containerW) {
        const maxAllowedX = (701 - containerW / targetScale) / 2;
        clampedX = Math.max(-maxAllowedX, Math.min(maxAllowedX, targetX));
      } else {
        clampedX = 0;
      }

      let clampedY = targetY;
      if (820 * targetScale > containerH) {
        const maxAllowedY = (820 - containerH / targetScale) / 2;
        clampedY = Math.max(-maxAllowedY, Math.min(maxAllowedY, targetY));
      } else {
        clampedY = 0;
      }

      panzoomInstanceRef.current.zoom(targetScale, { animate: true });
      setTimeout(() => {
        panzoomInstanceRef.current?.pan(clampedX, clampedY, { animate: true });
      }, 50);
    },
    resetView: () => {
      resetToFit();
    },
  }));

  // 마우스 이동 시 실시간 GPS 좌표 계산
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!mapElementRef.current) return;
    const rect = mapElementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const x_pct = (x / rect.width) * 100;
    const y_pct = (y / rect.height) * 100;

    if (x_pct >= 0 && x_pct <= 100 && y_pct >= 0 && y_pct <= 100) {
      const gps = percentToGps(x_pct, y_pct);
      setCursorGps({
        lat: gps.lat,
        lng: gps.lng,
        x_pct,
        y_pct,
      });
    }
  };

  const activeGatherings = gatherings.filter((g) => !g.isDeleted);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-slate-950 select-none flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCursorGps(null)}
    >
      {/* Panzoom 대상 컨테이너 (고정 크기 701x820 비율) */}
      <div
        ref={mapElementRef}
        className="relative shadow-2xl cursor-grab active:cursor-grabbing shrink-0"
        style={{
          width: '701px',
          height: '820px',
          touchAction: 'none',
        }}
      >
        {/* 거제도 클린 지도 이미지 */}
        <img
          src={`${import.meta.env.BASE_URL}map.jpg`}
          alt="거제도 지도"
          className="w-full h-full object-fill pointer-events-none rounded-2xl shadow-inner"
          draggable={false}
        />

        {/* 1. 소모임 핀 마커 렌더링 (회차 숫자만 깔끔하게 출력) */}
        {activeGatherings.map((g) => {
          const isSelected = g.id === selectedGatheringId;
          const isRecruiting = g.status === 'RECRUITING';
          const displayNumber = g.roundNumber !== undefined ? g.roundNumber : '•';
          const markerPos = (g.position?.lat && g.position?.lng)
            ? gpsToPercent(g.position.lat, g.position.lng)
            : { x_pct: g.position?.x_pct ?? 50, y_pct: g.position?.y_pct ?? 50 };

          return (
            <div
              key={g.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectGathering(g);
              }}
              style={{
                left: `${markerPos.x_pct}%`,
                top: `${markerPos.y_pct}%`,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-15 group transition-transform duration-200 hover:scale-125"
            >

              {/* 모집 중일 때 펄스 링 */}
              {isRecruiting && (
                <div className="absolute -inset-1.5 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
              )}

              {/* 회차 숫자 마커 핀 (숫자만 표시) */}
              <div
                className={`w-7 h-7 rounded-full shadow-2xl transition-all flex items-center justify-center font-mono font-black text-xs ${
                  isSelected
                    ? 'bg-gradient-to-br from-ocean-500 to-cyan-400 text-white scale-125 ring-4 ring-white/80 shadow-ocean-500/50'
                    : isRecruiting
                    ? 'bg-emerald-500 text-white shadow-emerald-500/40 ring-2 ring-emerald-300 animate-recruiting-pulse'
                    : 'bg-slate-900/95 text-slate-100 border-2 border-slate-600 hover:border-ocean-400 hover:bg-ocean-600 hover:text-white shadow-lg'
                }`}
              >
                {displayNumber}
              </div>

              {/* 호버 시 모임명 툴팁 */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-30">
                <div
                  className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shadow-md border ${
                    isSelected
                      ? 'bg-ocean-600 text-white border-ocean-300 ring-2 ring-white/40'
                      : isRecruiting
                      ? 'bg-slate-900/90 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900/90 text-slate-200 border-slate-700'
                  }`}
                >
                  {g.roundNumber !== undefined ? (g.roundNumber === 0 ? '[번개] ' : `[제 ${g.roundNumber}차] `) : ''}{g.title}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 우측 상단 플로팅 컨트롤 (줌 & 리셋) */}
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
    </div>
  );
});
