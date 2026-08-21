import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, useCallback } from 'react';
import Panzoom, { PanzoomObject } from '@panzoom/panzoom';
import { Gathering } from '../types';
import { percentToGps } from '../utils/coordinates';
import { useAuth } from '../context/AuthContext';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Lock,
  Unlock,
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
  isControlsOpen?: boolean;
  isGisOverlayOpen?: boolean;
}

export const MapViewer = forwardRef<MapViewerRef, MapViewerProps>(({
  gatherings,
  selectedGatheringId,
  onSelectGathering,
  isControlsOpen = true,
  isGisOverlayOpen = true,
}, ref) => {
  const { isAdmin } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapElementRef = useRef<HTMLDivElement>(null);
  const panzoomInstanceRef = useRef<PanzoomObject | null>(null);

  const [cursorGps, setCursorGps] = useState<{ lat: number; lng: number; x_pct: number; y_pct: number } | null>(null);
  const [currentScale, setCurrentScale] = useState<number>(1.0);

  // 관리자 전용: 마커 보정 (자물쇠 모드)
  const [isCalibrationUnlocked, setIsCalibrationUnlocked] = useState<boolean>(false);
  const [calibrationOffset, setCalibrationOffset] = useState<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const calibDragRef = useRef<{
    startX: number;
    startY: number;
    startOffset: { dx: number; dy: number };
    isDragging: boolean;
  } | null>(null);

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
      excludeClass: 'panzoom-exclude',
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

  // 관리자 전용: 마커 보정 자물쇠 토글 핸들러
  const handleToggleCalibrationLock = () => {
    if (!isCalibrationUnlocked) {
      // 1. 자물쇠 열기 (보정 모드 진입)
      setIsCalibrationUnlocked(true);
      setCalibrationOffset({ dx: 0, dy: 0 });
      panzoomInstanceRef.current?.setOptions({ disablePan: true });
      console.log('[보정 모드] 🔓 자물쇠가 열렸습니다. 지도를 드래그하면 마커들의 이동이 그림자로 표시됩니다.');
    } else {
      // 2. 자물쇠 다시 잠금 (보정 모드 종료 및 변동값 콘솔 출력)
      panzoomInstanceRef.current?.setOptions({ disablePan: false });
      const MAP_W = 701;
      const MAP_H = 820;
      const deltaPxX = calibrationOffset.dx;
      const deltaPxY = calibrationOffset.dy;
      const deltaPctX = (deltaPxX / MAP_W) * 100;
      const deltaPctY = (deltaPxY / MAP_H) * 100;

      console.log('========================================');
      console.log('📍 [지도 마커 보정 변동값 결과]');
      console.log(`- 픽셀 변동량: ΔX = ${deltaPxX.toFixed(2)}px, ΔY = ${deltaPxY.toFixed(2)}px`);
      console.log(`- 백분율 변동량: ΔX% = ${deltaPctX.toFixed(4)}%, ΔY% = ${deltaPctY.toFixed(4)}%`);
      console.log('========================================');

      setIsCalibrationUnlocked(false);
      setCalibrationOffset({ dx: 0, dy: 0 });
    }
  };

  // 전역 마우스/터치 드래그 리스너 (보정 모드 드래그)
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      // 관리자 마커 전체 보정 드래그
      if (calibDragRef.current && calibDragRef.current.isDragging) {
        const dx = (clientX - calibDragRef.current.startX) / currentScale;
        const dy = (clientY - calibDragRef.current.startY) / currentScale;

        setCalibrationOffset({
          dx: Number((calibDragRef.current.startOffset.dx + dx).toFixed(1)),
          dy: Number((calibDragRef.current.startOffset.dy + dy).toFixed(1)),
        });
      }
    };

    const handleGlobalMouseUp = () => {
      // 보정 모드 드래그 종료
      if (calibDragRef.current) {
        calibDragRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchmove', handleGlobalMouseMove, { passive: false });
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchmove', handleGlobalMouseMove);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, [currentScale]);

  // [보정 모드] 자물쇠 풀림 상태에서 방향키로 1px씩 정밀 이동
  useEffect(() => {
    if (!isCalibrationUnlocked) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력창(input/textarea)에 포커스가 있는 경우 키 입력 가로채지 않음
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA' ||
          (document.activeElement as HTMLElement).isContentEditable)
      ) {
        return;
      }

      const step = e.shiftKey ? 10 : 1; // 기본 1px (Shift 누를 시 10px 고속 이동)

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCalibrationOffset((prev) => ({ ...prev, dx: prev.dx - step }));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        setCalibrationOffset((prev) => ({ ...prev, dx: prev.dx + step }));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCalibrationOffset((prev) => ({ ...prev, dy: prev.dy - step }));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setCalibrationOffset((prev) => ({ ...prev, dy: prev.dy + step }));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isCalibrationUnlocked]);

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

  // ── 마커 그룹화 ──────────────────────────────────────────────
  // 위치가 가까운 마커들을 하나의 그룹으로 합침 (1.5% 이내 = 동일 위치)
  const MERGE_THRESHOLD = 1.5; // x_pct / y_pct 기준 거리 임계값(%)

  type MarkerGroup = {
    groupKey: string;
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
        groupKey: `pos_${pos.x_pct.toFixed(2)}_${pos.y_pct.toFixed(2)}`,
        x_pct: pos.x_pct,
        y_pct: pos.y_pct,
        gatherings: [g],
        isSelected: g.id === selectedGatheringId,
        hasRecruiting: g.status === 'RECRUITING',
      });
    }
  }

  // 지도의 줌 배율에 반비례하여 마커 크기를 항상 동일하게 고정 (픽셀 스케일 보정)
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
        onMouseDown={(e) => {
          if (isCalibrationUnlocked && e.button === 0) {
            calibDragRef.current = {
              startX: e.clientX,
              startY: e.clientY,
              startOffset: { ...calibrationOffset },
              isDragging: true,
            };
          }
        }}
        onTouchStart={(e) => {
          if (isCalibrationUnlocked && e.touches.length > 0) {
            calibDragRef.current = {
              startX: e.touches[0].clientX,
              startY: e.touches[0].clientY,
              startOffset: { ...calibrationOffset },
              isDragging: true,
            };
          }
        }}
        className={`relative shadow-2xl shrink-0 ${
          isCalibrationUnlocked ? 'cursor-move' : 'cursor-grab active:cursor-grabbing'
        }`}
        style={{ width: '701px', height: '820px', touchAction: 'none' }}
      >
        {/* 거제도 클린 지도 이미지 */}
        <img
          src={`${import.meta.env.BASE_URL}map.jpg`}
          alt="거제도 지도"
          className="w-full h-full object-fill pointer-events-none rounded-2xl shadow-inner"
          draggable={false}
        />

        {/* 그룹화된 마커 핀 렌더링 (레이블 없는 순수 포인트) */}
        {groups.map((group, idx) => {
          const isSelected = group.isSelected;
          const isRecruiting = group.hasRecruiting;

          // 보정 모드 변위 백분율 (%)
          const calibShiftPctX = (calibrationOffset.dx / 701) * 100;
          const calibShiftPctY = (calibrationOffset.dy / 820) * 100;

          // 현재 마커 렌더링 위치 (보정 오프셋 반영)
          const currentPosX = group.x_pct + calibShiftPctX;
          const currentPosY = group.y_pct + calibShiftPctY;

          return (
            <React.Fragment key={idx}>
              {/* [보정 모드] 원위치 반투명 그림자 마커 (Ghost Marker) */}
              {isCalibrationUnlocked && (
                <div
                  style={{
                    left: `${group.x_pct}%`,
                    top: `${group.y_pct}%`,
                    position: 'absolute',
                    transform: `translate(-50%, -50%) scale(${unscaleFactor})`,
                    transformOrigin: 'center center',
                    pointerEvents: 'none',
                  }}
                  className="z-5 flex flex-col items-center opacity-40"
                >
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-slate-300 bg-slate-500/50 shadow" />
                </div>
              )}

              {/* 실제 이동/보정 중인 마커 핀 */}
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  const sel = group.gatherings.find((g) => g.id === selectedGatheringId);
                  onSelectGathering(sel ?? group.gatherings[0]);
                }}
                style={{
                  left: `${currentPosX}%`,
                  top: `${currentPosY}%`,
                  position: 'absolute',
                  transform: `translate(-50%, -50%) scale(${unscaleFactor})`,
                  transformOrigin: 'center center',
                }}
                className="cursor-pointer z-10 group p-2 -m-2"
                title={group.gatherings.map((g) => `${g.roundNumber !== undefined ? (g.roundNumber === 0 ? '[번개]' : `[${g.roundNumber}차]`) : ''} ${g.title}`).join('\n')}
              >
                {/* 모집 중 펄스 링 */}
                {isRecruiting && (
                  <div className="absolute inset-0 rounded-full bg-emerald-400/40 animate-ping pointer-events-none" />
                )}

                {/* 원형 점 마커 핀 */}
                <div
                  className={`rounded-full border-2 border-white shadow-lg transition-all duration-200 ${
                    isSelected
                      ? 'w-4 h-4 bg-red-500 ring-4 ring-red-400/60 shadow-red-500/80 scale-125'
                      : isRecruiting
                      ? 'w-3.5 h-3.5 bg-emerald-400 ring-2 ring-emerald-200 shadow-emerald-400/50 hover:scale-125'
                      : 'w-3 h-3 bg-red-500/90 shadow-red-500/40 hover:bg-red-400 hover:scale-125'
                  }`}
                />
              </div>
            </React.Fragment>
          );
        })}
      </div>

      {/* 우측 상단 플로팅 컨트롤 (지도 줌 & 리셋 & 관리자 자물쇠) */}
      {isControlsOpen && (
        <div className="absolute top-4 right-3 md:right-4 z-20 flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
          <div className="glass-panel rounded-2xl p-1 flex flex-col shadow-xl">
            {/* 1. 지도 줌 & 리셋 */}
            <button
              onClick={() => panzoomInstanceRef.current?.zoomIn()}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="지도 확대 (+)"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => panzoomInstanceRef.current?.zoomOut()}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="지도 축소 (-)"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={resetToFit}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition"
              title="전체 지도 보기 (세로 밀착)"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* 2. 관리자 전용: 자물쇠 (마커 보정 모드) */}
            {isAdmin && (
              <>
                <div className="h-px bg-slate-600/80 my-1.5 mx-1" />
                <button
                  onClick={handleToggleCalibrationLock}
                  className={`p-2 rounded-xl transition ${
                    isCalibrationUnlocked
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-400/50 shadow-md animate-pulse'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800'
                  }`}
                  title={isCalibrationUnlocked ? '보정 모드 종료 (변동값 콘솔 출력)' : '마커 보정 모드 (자물쇠 열기)'}
                >
                  {isCalibrationUnlocked ? <Unlock className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4" />}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 좌측 하단 실시간 GIS 좌표 표시창 */}
      {isGisOverlayOpen && (
        <div className="absolute bottom-3 left-3 md:left-4 z-20 glass-panel rounded-xl px-3 py-1.5 text-[11px] text-slate-300 shadow-xl flex items-center gap-2.5 animate-in fade-in duration-200">
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
      )}

      {/* [보정 모드] 실시간 변동량 및 방향키 안내 뱃지 */}
      {isCalibrationUnlocked && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-950/90 border border-amber-500/80 text-amber-200 px-3.5 py-1.5 rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-mono animate-in fade-in slide-in-from-top-2 duration-200">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span className="font-bold text-amber-300">보정 모드:</span>
          <span>방향키 (← → ↑ ↓) 1px 정밀 이동</span>
          <span className="bg-amber-900/80 px-2 py-0.5 rounded border border-amber-500/40 text-white font-black">
            ΔX: {calibrationOffset.dx >= 0 ? `+${calibrationOffset.dx}` : calibrationOffset.dx}px, ΔY:{' '}
            {calibrationOffset.dy >= 0 ? `+${calibrationOffset.dy}` : calibrationOffset.dy}px
          </span>
        </div>
      )}
    </div>
  );
});
