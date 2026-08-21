import React, { useState, useEffect, useMemo } from 'react';
import { Gathering } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Minimize2, Maximize2, X } from 'lucide-react';

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
  const [isCollapsed, setIsCollapsed] = useState(false);

  // 활성 모임 정렬 목록 (회차순 오름차순)
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

  // 현재 선택된 모임
  const selectedGathering = useMemo(() => {
    return activeGatherings.find((g) => g.id === selectedGatheringId) ?? null;
  }, [activeGatherings, selectedGatheringId]);

  // 현재 선택된 모임의 인덱스
  const currentIndex = useMemo(() => {
    if (!selectedGathering) return -1;
    return activeGatherings.findIndex((g) => g.id === selectedGathering.id);
  }, [activeGatherings, selectedGathering]);

  // 선택된 모임이 바뀌면 해당 모임의 연/월로 달력 자동 이동
  useEffect(() => {
    if (selectedGathering) {
      const gDate = new Date(selectedGathering.dateTime);
      if (!isNaN(gDate.getTime())) {
        setCurrentDate(new Date(gDate.getFullYear(), gDate.getMonth(), 1));
      }
    }
  }, [selectedGathering]);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // 이전 모임으로 이동 (모달 팝업 없이 선택/포커스만 이동)
  const handlePrevMeeting = () => {
    if (activeGatherings.length === 0) return;
    let targetIndex = currentIndex - 1;
    if (targetIndex < 0) {
      targetIndex = activeGatherings.length - 1; // 순환
    }
    const target = activeGatherings[targetIndex];
    if (target) {
      onSelectGathering(target, false);
      if (onFocusCoordinate) {
        onFocusCoordinate(target.position.x_pct, target.position.y_pct);
      }
    }
  };

  // 다음 모임으로 이동 (모달 팝업 없이 선택/포커스만 이동)
  const handleNextMeeting = () => {
    if (activeGatherings.length === 0) return;
    let targetIndex = currentIndex + 1;
    if (targetIndex >= activeGatherings.length) {
      targetIndex = 0; // 순환
    }
    const target = activeGatherings[targetIndex];
    if (target) {
      onSelectGathering(target, false);
      if (onFocusCoordinate) {
        onFocusCoordinate(target.position.x_pct, target.position.y_pct);
      }
    }
  };

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
    <div className="absolute top-16 left-3 md:left-4 z-30 w-64 sm:w-72 glass-panel rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* 헤더 */}
      <div className="px-3 py-2.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-pink-500/20 text-pink-400">
            <CalendarIcon className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-black font-mono text-white tracking-tight">
              {year}.{month + 1}
            </h3>
          </div>
        </div>

        {/* 이전 모임 (왼쪽 화살표) / 회차 (N만, 붉은색) / 다음 모임 (오른쪽 화살표) */}
        <div className="flex items-center gap-1">
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

          {/* 이달의 모임 간략 목록 */}
          {gatheringsInMonth.length > 0 && (
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 space-y-1.5 max-h-32 overflow-y-auto pr-1">
              {gatheringsInMonth.map((g) => {
                const gDate = new Date(g.dateTime);
                const isSelected = g.id === selectedGatheringId;
                const roundText = g.roundNumber !== undefined
                  ? (g.roundNumber === 0 ? '번개' : `${g.roundNumber}차`)
                  : '모임';

                return (
                  <button
                    key={g.id}
                    onClick={() => {
                      onSelectGathering(g);
                      if (onFocusCoordinate) {
                        onFocusCoordinate(g.position.x_pct, g.position.y_pct);
                      }
                    }}
                    className={`w-full text-left p-1.5 rounded-lg text-xs transition flex items-center justify-between ${
                      isSelected
                        ? 'bg-pink-600/30 border border-pink-500/60 text-white ring-1 ring-pink-400/40'
                        : 'bg-slate-800/40 hover:bg-slate-800 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="truncate mr-1.5">
                      <div className="font-medium text-[11px] truncate flex items-center gap-1">
                        <span className={`px-1 py-0.2 text-[9px] font-bold rounded ${isSelected ? 'bg-red-500 text-white' : 'bg-red-500/20 text-red-300'}`}>
                          {roundText}
                        </span>
                        <span className="truncate">{g.title}</span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-pink-400" />
                        <span>{g.locationName}</span> ·{' '}
                        <span>{gDate.getMonth() + 1}/{gDate.getDate()}</span>
                      </div>
                    </div>
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                        g.status === 'RECRUITING'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : g.status === 'PROPOSED'
                          ? 'bg-amber-500/20 text-amber-300'
                          : g.status === 'CONFIRMED'
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'bg-slate-500/20 text-slate-300'
                      }`}
                    >
                      {g.status === 'RECRUITING'
                        ? '모집중'
                        : g.status === 'PROPOSED'
                        ? '제안'
                        : g.status === 'CONFIRMED'
                        ? '확정'
                        : '완료'}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
