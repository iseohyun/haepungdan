import React, { useState } from 'react';
import { Gathering } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Minimize2, Maximize2, X } from 'lucide-react';

interface CalendarWidgetProps {
  isOpen: boolean;
  onClose: () => void;
  gatherings: Gathering[];
  selectedGatheringId: string | null;
  onSelectGathering: (gathering: Gathering) => void;
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
  const [currentDate, setCurrentDate] = useState(new Date('2026-09-01'));
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!isOpen) return null;

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const gatheringsInMonth = gatherings.filter((g) => {
    if (g.isDeleted) return false;
    const gDate = new Date(g.dateTime);
    return gDate.getFullYear() === year && gDate.getMonth() === month;
  });

  const gatheringsByDay: Record<number, Gathering[]> = {};
  gatheringsInMonth.forEach((g) => {
    const day = new Date(g.dateTime).getDate();
    if (!gatheringsByDay[day]) gatheringsByDay[day] = [];
    gatheringsByDay[day].push(g);
  });

  const getStatusDotColor = (status: Gathering['status']) => {
    switch (status) {
      case 'RECRUITING':
        return 'bg-emerald-400';
      case 'PROPOSED':
        return 'bg-amber-400';
      case 'CONFIRMED':
        return 'bg-sky-400';
      case 'COMPLETED':
        return 'bg-slate-400';
      default:
        return 'bg-rose-400';
    }
  };

  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  return (
    <div className="absolute top-16 left-3 md:left-4 z-30 w-72 sm:w-80 glass-panel rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95">
      {/* 헤더 */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-ocean-500/20 text-ocean-400">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white">
              {year}년 {month + 1}월
            </h3>
            <p className="text-[10px] text-ocean-300 font-medium">
              모임 {gatheringsInMonth.length}건
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handlePrevMonth}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            title="이전 달"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleNextMonth}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
            title="다음 달"
          >
            <ChevronRight className="w-3.5 h-3.5" />
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
                      ? 'bg-ocean-600 text-white font-bold ring-2 ring-ocean-400'
                      : hasMeeting
                      ? 'bg-slate-800 hover:bg-slate-700 text-white font-semibold cursor-pointer'
                      : 'text-slate-400 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{day}</span>
                  {hasMeeting && (
                    <div className="flex gap-0.5 mt-0.5">
                      {meetings.slice(0, 3).map((m) => (
                        <span
                          key={m.id}
                          className={`w-1 h-1 rounded-full ${getStatusDotColor(m.status)}`}
                        />
                      ))}
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
                        ? 'bg-ocean-600/30 border border-ocean-500/50 text-white'
                        : 'bg-slate-800/40 hover:bg-slate-800 text-slate-300 border border-transparent'
                    }`}
                  >
                    <div className="truncate mr-1.5">
                      <div className="font-medium text-[11px] truncate">{g.title}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-ocean-400" />
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
