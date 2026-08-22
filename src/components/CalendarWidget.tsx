import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Gathering } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Minimize2, Maximize2, X, Play, Pause } from 'lucide-react';
import { gpsToPercent } from '../utils/coordinates';

interface CalendarWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  gatherings: Gathering[];
  selectedGatheringId: string | null;
  onSelectGathering: (gathering: Gathering, openModal?: boolean) => void;
  onFocusCoordinate?: (x_pct: number, y_pct: number) => void;
}

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  isOpen,
  onClose,
  gatherings,
  selectedGatheringId,
  onSelectGathering,
  onFocusCoordinate,
}) => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  // 달력 기본 접기(축소) 상태
  const [isCollapsed, setIsCollapsed] = useState(true);

  // 자동 애니메이션 간격 설정 ("1초" -> "2초"(기본) -> "3초" -> "0초" -> "1초")
  const [autoInterval, setAutoInterval] = useState<number>(2); // 2초 기본

  // 활성 모임 정렬 목록 (회차순 오름차순: 번개(0) -> 1차 -> 2차 -> ... -> 10차)
  const activeGatherings = useMemo(() => {
    return gatherings
      .filter((g) => !g.isDeleted)
      .sort((a, b) => {
        const ra = a.roundNumber ?? -1;
        const rb = b.roundNumber ?? -1;
        if (ra !== rb) return ra - rb;
        return new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime();
      });
  }, [gatherings]);

  // 최신 상태를 ref로 보관하여 stale closure 방지
  const activeGatheringsRef = useRef(activeGatherings);
  activeGatheringsRef.current = activeGatherings;

  const selectedGatheringIdRef = useRef(selectedGatheringId);
  selectedGatheringIdRef.current = selectedGatheringId;

  const onSelectGatheringRef = useRef(onSelectGathering);
  onSelectGatheringRef.current = onSelectGathering;

  const onFocusCoordinateRef = useRef(onFocusCoordinate);
  onFocusCoordinateRef.current = onFocusCoordinate;

  // 현재 선택된 모임
  const selectedGathering = useMemo(() => {
    return activeGatherings.find((g) => g.id === selectedGatheringId) ?? null;
  }, [activeGatherings, selectedGatheringId]);

  // 현재 선택된 이벤트의 일자(Day)
  const selectedDay = useMemo(() => {
    if (!selectedGathering) return null;
    const d = new Date(selectedGathering.dateTime);
    return isNaN(d.getTime()) ? null : d.getDate();
  }, [selectedGathering]);

  // 선택된 모임이 바뀌면 해당 모임의 연/월로 달력 자동 이동
  useEffect(() => {
    if (selectedGathering) {
      const gDate = new Date(selectedGathering.dateTime);
      if (!isNaN(gDate.getTime())) {
        setCurrentDate(new Date(gDate.getFullYear(), gDate.getMonth(), 1));
      }
    }
  }, [selectedGathering]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 이전 모임으로 이동 (모달 팝업 없이 선택/포커스만 이동)
  const handlePrevMeeting = useCallback(() => {
    const list = activeGatheringsRef.current;
    if (list.length === 0) return;
    const curId = selectedGatheringIdRef.current;
    const curIdx = list.findIndex((g) => g.id === curId);
    let targetIndex = curIdx - 1;
    if (targetIndex < 0) {
      targetIndex = list.length - 1; // 순환
    }
    const target = list[targetIndex];
    if (target) {
      onSelectGatheringRef.current(target, false);
      const pos = gpsToPercent(target.position.lat, target.position.lng);
      if (onFocusCoordinateRef.current) {
        onFocusCoordinateRef.current(pos.x_pct, pos.y_pct);
      }
    }
  }, []);

  // 다음 모임으로 이동 (모달 팝업 없이 선택/포커스만 이동)
  const handleNextMeeting = useCallback(() => {
    const list = activeGatheringsRef.current;
    if (list.length === 0) return;
    const curId = selectedGatheringIdRef.current;
    const curIdx = list.findIndex((g) => g.id === curId);
    let targetIndex = curIdx + 1;
    if (targetIndex >= list.length || targetIndex < 0) {
      targetIndex = 0; // 순환
    }
    const target = list[targetIndex];
    if (target) {
      console.log(
        `▶ [자동 회차 순환] 이동 -> [${target.roundNumber !== undefined ? (target.roundNumber === 0 ? '번개' : `${target.roundNumber}차`) : '모임'}] ${target.locationName} (${targetIndex + 1}/${list.length})`
      );
      onSelectGatheringRef.current(target, false);
      const pos = gpsToPercent(target.position.lat, target.position.lng);
      if (onFocusCoordinateRef.current) {
        onFocusCoordinateRef.current(pos.x_pct, pos.y_pct);
      }
    }
  }, []);

  // 자동 회차 넘김 애니메이션 타이머
  useEffect(() => {
    if (autoInterval <= 0) return;

    const timer = setInterval(() => {
      handleNextMeeting();
    }, autoInterval * 1000);

    return () => clearInterval(timer);
  }, [autoInterval, handleNextMeeting]);

  // 자동 넘김 간격 순환 토글: 2초(기본) -> 3초 -> 0초(정지) -> 1초 -> 2초
  const handleCycleInterval = () => {
    setAutoInterval((prev) => {
      if (prev === 2) return 3;
      if (prev === 3) return 0;
      if (prev === 0) return 1;
      return 2; // prev === 1 -> 2
    });
  };

  if (!isOpen) return null;

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const gatheringsInMonth = activeGatherings.filter((g) => {
    const gDate = new Date(g.dateTime);
    return gDate.getFullYear() === year && gDate.getMonth() === month;
  });

  const gatheringsByDay: Record<number, Gathering[]> = {};
  gatheringsInMonth.forEach((g) => {
    const day = new Date(g.dateTime).getDate();
    if (!gatheringsByDay[day]) gatheringsByDay[day] = [];
    gatheringsByDay[day].push(g);
  });

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 현재 표시할 회차 라벨 (N차 대신 N만 표기)
  const currentRoundText = selectedGathering?.roundNumber !== undefined
    ? (selectedGathering.roundNumber === 0 ? '번개' : `${selectedGathering.roundNumber}`)
    : (activeGatherings.length > 0 ? '•' : '-');

  return (
    <div className="absolute top-3 left-[68px] md:left-[78px] z-30 w-72 sm:w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 select-none">
      {/* 헤더 */}
      <div className="px-3 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <div className="p-1 rounded-lg bg-pink-500/20 text-pink-400 shrink-0">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <h3 className="text-xs font-black font-mono text-white tracking-tight truncate" title={`${year}.${month + 1}${selectedDay !== null ? `.${selectedDay}` : ''}`}>
              {year}.{month + 1}{selectedDay !== null ? `.${selectedDay}` : ''}
            </h3>
          </div>
        </div>

        {/* 이전 모임 (왼쪽 화살표) / 회차 (N만, 붉은색) / 다음 모임 (오른쪽 화살표) / 자동 넘김 토글 */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={handlePrevMeeting}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            title="이전 모임"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* 중간 모임 회차 숫자 (N만, 붉은 색) */}
          <div className="px-1.5 py-0.5 rounded bg-red-500/20 shadow-inner flex items-center justify-center min-w-[28px]">
            <span className="text-xs font-black font-mono text-red-500 tracking-tight">
              {currentRoundText}
            </span>
          </div>

          <button
            onClick={handleNextMeeting}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            title="다음 모임"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {/* 자동 넘김 애니메이션 간격 순환 토글 버튼 ("1초" -> "2초"(기본) -> "3초" -> "0초" -> "1초") */}
          <button
            onClick={handleCycleInterval}
            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition flex items-center gap-0.5 ${
              autoInterval === 0
                ? 'bg-slate-800/80 text-slate-400 hover:text-white border border-slate-700/80'
                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
            }`}
            title={`자동 회차 넘김: ${autoInterval === 0 ? '정지 (클릭 시 1초)' : `${autoInterval}초 (클릭 시 변경)`}`}
          >
            {autoInterval > 0 ? (
              <Play className="w-2.5 h-2.5 fill-current" />
            ) : (
              <Pause className="w-2.5 h-2.5" />
            )}
            <span>{autoInterval}초</span>
          </button>

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition ml-0.5"
            title={isCollapsed ? '펼치기' : '접기'}
          >
            {isCollapsed ? <Maximize2 className="w-3 h-3" /> : <Minimize2 className="w-3 h-3" />}
          </button>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            title="달력 닫기"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 달력 내용 */}
      {!isCollapsed && (
        <div className="p-3">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {dayNames.map((name, i) => (
              <span
                key={name}
                className={`text-[10px] font-medium py-0.5 ${
                  i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : 'text-slate-400'
                }`}
              >
                {name}
              </span>
            ))}
          </div>

          {/* 일자 그리드 */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-7" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const meetings = gatheringsByDay[day] || [];
              const hasMeeting = meetings.length > 0;
              const isSelected = meetings.some((m) => m.id === selectedGatheringId);

              return (
                <button
                  key={day}
                  onClick={() => {
                    if (hasMeeting) {
                      onSelectGathering(meetings[0]);
                      if (onFocusCoordinate) {
                        onFocusCoordinate(meetings[0].position.x_pct, meetings[0].position.y_pct);
                      }
                    }
                  }}
                  className={`h-7 rounded-lg flex flex-col items-center justify-center relative text-[11px] transition ${
                    isSelected
                      ? 'bg-pink-600 text-white font-black ring-2 ring-pink-300 shadow-md shadow-pink-500/50'
                      : hasMeeting
                      ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 font-bold hover:bg-pink-500/30 cursor-pointer shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{day}</span>
                  {hasMeeting && (
                    <div className="flex gap-0.5 mt-0.5">
                      {meetings.slice(0, 3).map((m) => {
                        const isThisSelected = m.id === selectedGatheringId;
                        return (
                          <span
                            key={m.id}
                            className={`w-1 h-1 rounded-full ${
                              isThisSelected ? 'bg-white' : 'bg-pink-400'
                            }`}
                          />
                        );
                      })}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
