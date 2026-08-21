import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { Gathering } from '../types';
import { percentToGps } from '../utils/coordinates';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
} from 'lucide-react';
import { gpsToPercent } from '../utils/coordinates';

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
  const [currentScale, setCurrentScale] = useState<number>(1.0);

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
    setCurrentScale(fitScale);
    setTimeout(() => {
      panzoomInstanceRef.current?.pan(0, 0, { animate: true });
    }, 50);
  }, [getFitScale]);

  // Panzoom 초기화 및 1:1 마우스 동기화 + 정밀 상하좌우 경계 구속
  useEffect(() => {
    if (!mapElementRef.current || !containerRef.current) return;

    const fitScale = getFitScale();
    setCurrentScale(fitScale);

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

    // Panzoom scale 변화 리스너 (줌할 때 실시간 스케일 반영)
    const mapEl = mapElementRef.current;
    const handlePanzoomChange = (e: any) => {
      if (e.detail && typeof e.detail.scale === 'number') {
        setCurrentScale(e.detail.scale);
      }
    };
    mapEl.addEventListener('panzoomchange', handlePanzoomChange);

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
      mapEl.removeEventListener('panzoomchange', handlePanzoomChange);
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
      setCurrentScale(targetScale);
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
  const selectedGathering = activeGatherings.find((g) => g.id === selectedGatheringId) ?? null;

  // ── 마커 그룹화 ──────────────────────────────────────────────
  // 위치가 가까운 마커들을 하나의 그룹으로 합침 (1.5% 이내 = 동일 위치)
  const MERGE_THRESHOLD = 1.5; // x_pct / y_pct 기준 거리 임계값(%)

  type MarkerGroup = {
    x_pct: number;
    y_pct: number;
    gatherings: Gathering[];
    isSelected: boolean;
    hasRecruiting: boolean;
  };

  const groups: MarkerGroup[] = [];
  for (const g of activeGatherings) {
    const pos = gpsToPercent(g.position.lat, g.position.lng);
    const existing = groups.find(
      (gr) =>
        Math.abs(gr.x_pct - pos.x_pct) < MERGE_THRESHOLD &&
        Math.abs(gr.y_pct - pos.y_pct) < MERGE_THRESHOLD
    );
    if (existing) {
      existing.gatherings.push(g);
      if (g.id === selectedGatheringId) existing.isSelected = true;
      if (g.status === 'RECRUITING') existing.hasRecruiting = true;
    } else {
      groups.push({
        x_pct: pos.x_pct,
        y_pct: pos.y_pct,
        gatherings: [g],
        isSelected: g.id === selectedGatheringId,
        hasRecruiting: g.status === 'RECRUITING',
      });
    }
  }

  // ── 레이블 방향 계산 ─────────────────────────────────────────
  // 각 그룹에서 다른 모든 그룹의 중심 방향을 피해 레이블을 배치
  // 레이블 오프셋 (px): 마커 중심에서 레이블 중심까지의 거리
  const LABEL_OFFSET_PX = 24;
  const MAP_W = 701;
  const MAP_H = 820;

  function getLabelOffset(group: MarkerGroup): { dx: number; dy: number } {
    // 다른 그룹들의 상대 방향 벡터 합산
    let sumDx = 0, sumDy = 0;
    for (const other of groups) {
      if (other === group) continue;
      const dx = group.x_pct - other.x_pct;
      const dy = group.y_pct - other.y_pct;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
      // 가까울수록 더 강하게 밀어냄 (역거리 가중)
      sumDx += dx / (dist * dist);
      sumDy += dy / (dist * dist);
    }

    // 벡터가 없으면(유일한 마커) 아래쪽 기본
    if (Math.abs(sumDx) < 0.0001 && Math.abs(sumDy) < 0.0001) {
      return { dx: 0, dy: LABEL_OFFSET_PX };
    }

    // 정규화 후 오프셋 거리 적용
    const mag = Math.sqrt(sumDx * sumDx + sumDy * sumDy);
    const nx = sumDx / mag;
    const ny = sumDy / mag;

    // 지도 경계 밖으로 나가지 않도록 보정
    const markerPxX = (group.x_pct / 100) * MAP_W;
    const markerPxY = (group.y_pct / 100) * MAP_H;
    let dx = nx * LABEL_OFFSET_PX;
    let dy = ny * LABEL_OFFSET_PX;

    if (markerPxX + dx < 20) dx = 20 - markerPxX;
    if (markerPxX + dx > MAP_W - 20) dx = MAP_W - 20 - markerPxX;
    if (markerPxY + dy < 12) dy = 12 - markerPxY;
    if (markerPxY + dy > MAP_H - 12) dy = MAP_H - 12 - markerPxY;

    return { dx, dy };
  }

  // 지도의 줌 배율에 반비례하여 마커/레이블 크기를 항상 동일하게 고정 (픽셀 스케일 보정)
  const unscaleFactor = currentScale > 0 ? 1 / currentScale : 1.0;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-slate-950 select-none flex items-center justify-center"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setCursorGps(null)}
    >
      {/* Panzoom 대상 컨테이너 (고정 크기 701x820) */}
      <div
        ref={mapElementRef}
        className="relative shadow-2xl cursor-grab active:cursor-grabbing shrink-0"
        style={{ width: '701px', height: '820px', touchAction: 'none' }}
      >
        {/* 거제도 클린 지도 이미지 */}
        <img
          src={`${import.meta.env.BASE_URL}map.jpg`}
          alt="거제도 지도"
          className="w-full h-full object-fill pointer-events-none rounded-2xl shadow-inner"
          draggable={false}
        />

        {/* 그룹화된 마커 렌더링 */}
        {groups.map((group, idx) => {
          const { dx, dy } = getLabelOffset(group);
          const isSelected = group.isSelected;
          const isRecruiting = group.hasRecruiting;

          // 회차별 gathering 맵핑 및 정렬
          const roundMap = new Map<number, Gathering>();
          group.gatherings.forEach((g) => {
            if (g.roundNumber !== undefined) {
              roundMap.set(g.roundNumber, g);
            }
          });
          const roundNumbers = Array.from(roundMap.keys()).sort((a, b) => a - b);

          // SVG 선 (마커 중심 0,0 → 레이블 방향)
          const svgMinX = Math.min(0, dx) - 2;
          const svgMinY = Math.min(0, dy) - 2;
          const svgW = Math.abs(dx) + 4;
          const svgH = Math.abs(dy) + 4;
          const svgX1 = 0 - svgMinX;
          const svgY1 = 0 - svgMinY;
          const svgX2 = dx - svgMinX;
          const svgY2 = dy - svgMinY;

          return (
            <div
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                // 그룹 내 선택: 선택된 게 있으면 유지, 없으면 최신 또는 첫 번째 선택
                const sel = group.gatherings.find((g) => g.id === selectedGatheringId);
                onSelectGathering(sel ?? group.gatherings[0]);
              }}
              style={{
                left: `${group.x_pct}%`,
                top: `${group.y_pct}%`,
                position: 'absolute',
                // 확대/축소 시에도 마커와 레이블 크기가 일정하도록 unscale 적용
                transform: `translate(-50%, -50%) scale(${unscaleFactor})`,
                transformOrigin: 'center center',
              }}
              className="cursor-pointer z-10 group"
            >
              {/* 모집 중 펄스 링 */}
              {isRecruiting && (
                <div className="absolute -inset-2 rounded-full bg-emerald-400/30 animate-ping pointer-events-none" />
              )}

              {/* 빨간 점 마커 */}
              <div
                className={`rounded-full border-2 border-white shadow-lg transition-all ${
                  isSelected
                    ? 'w-4 h-4 bg-red-400 ring-4 ring-white/70 shadow-red-400/60'
                    : isRecruiting
                    ? 'w-3.5 h-3.5 bg-emerald-400 ring-2 ring-emerald-200'
                    : 'w-3 h-3 bg-red-500 shadow-red-500/40'
                }`}
              />

              {/* SVG 연결선 (마커 중심 → 레이블) */}
              <svg
                style={{
                  position: 'absolute',
                  left: `${svgMinX}px`,
                  top: `${svgMinY}px`,
                  width: `${svgW}px`,
                  height: `${svgH}px`,
                  pointerEvents: 'none',
                  overflow: 'visible',
                }}
              >
                <line
                  x1={svgX1} y1={svgY1}
                  x2={svgX2} y2={svgY2}
                  stroke={isSelected ? '#f87171' : isRecruiting ? '#34d399' : '#f87171'}
                  strokeWidth="1.2"
                  strokeOpacity="0.8"
                  strokeDasharray="2 2"
                />
              </svg>

              {/* 레이블 (회차 숫자 목록: 선택된 회차만 붉은 배경 하이라이트) */}
              <div
                style={{
                  position: 'absolute',
                  left: `${dx}px`,
                  top: `${dy}px`,
                  transform: 'translate(-50%, -50%)',
                  whiteSpace: 'nowrap',
                }}
                className={`px-1.5 py-0.5 rounded shadow-md border flex items-center gap-0.5 text-[10px] font-mono font-black ${
                  isSelected
                    ? 'bg-slate-900/95 border-red-500 ring-1 ring-red-400/50'
                    : isRecruiting
                    ? 'bg-slate-900/95 border-emerald-500/60'
                    : 'bg-slate-900/90 border-slate-700/80'
                }`}
              >
                {roundNumbers.length > 0 ? (
                  roundNumbers.map((rn, rIdx) => {
                    const isThisSelected = selectedGathering?.roundNumber === rn;
                    const gItem = roundMap.get(rn);
                    return (
                      <React.Fragment key={rn}>
                        {rIdx > 0 && <span className="text-slate-500 font-normal">,</span>}
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (gItem) {
                              onSelectGathering(gItem);
                            }
                          }}
                          className={`px-1 py-0.2 rounded transition-all cursor-pointer ${
                            isThisSelected
                              ? 'bg-red-500 text-white font-black shadow ring-1 ring-red-300'
                              : 'text-red-300 hover:text-white hover:bg-slate-800'
                          }`}
                        >
                          {rn === 0 ? '번개' : rn}
                        </span>
                      </React.Fragment>
                    );
                  })
                ) : (
                  <span className="text-red-300 px-1">•</span>
                )}
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
