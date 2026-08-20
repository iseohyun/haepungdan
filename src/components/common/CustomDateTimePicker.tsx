import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Check, Clock } from 'lucide-react';

interface CustomDateTimePickerProps {
  date: string; // "YYYY-MM-DD"
  time: string; // "HH:mm" (예: "06:00")
  onChangeDate: (date: string) => void;
  onChangeTime: (time: string) => void;
  /** false로 설정하면 내부 "일시" 라벨을 숨깁니다 (외부에서 라벨을 직접 렌더링할 때) */
  showLabel?: boolean;
}

export const CustomDateTimePicker: React.FC<CustomDateTimePickerProps> = ({
  date,
  time,
  onChangeDate,
  onChangeTime,
  showLabel = true,
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // 달력 내부 탐색 년/월 상태
  const initialDateObj = date ? new Date(date) : new Date();
  const [viewYear, setViewYear] = useState(initialDateObj.getFullYear() || 2026);
  const [viewMonth, setViewMonth] = useState(initialDateObj.getMonth() || 8); // 0-indexed
  const [tempSelectedDate, setTempSelectedDate] = useState(date || '2026-09-12');

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 요일 이름
  const dayNames = ['일', '월', '화', '수', '목', '금', '토'];

  // 현재 달의 일수 및 첫째 날 요일
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  // 이전 달/다음 달 이동
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);

    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  // 날짜 클릭 시 임시 선택
  const handleSelectDay = (day: number) => {
    const monthStr = String(viewMonth + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    setTempSelectedDate(`${viewYear}-${monthStr}-${dayStr}`);
  };

  // "선택" 버튼 클릭 시 최종 반영
  const handleConfirmDate = () => {
    onChangeDate(tempSelectedDate);
    setIsCalendarOpen(false);
  };

  // 시간 10분 단위 증가/감소 핸들러
  const handleStepTime = (minutesDelta: number) => {
    const [hStr, mStr] = (time || '06:00').split(':');
    let totalMinutes = parseInt(hStr, 10) * 60 + parseInt(mStr, 10) + minutesDelta;

    // 24시간 범위 순환 (0 ~ 1439)
    if (totalMinutes < 0) totalMinutes += 1440;
    totalMinutes = totalMinutes % 1440;

    const newH = Math.floor(totalMinutes / 60);
    const newM = totalMinutes % 60;

    const formattedH = String(newH).padStart(2, '0');
    const formattedM = String(newM).padStart(2, '0');
    onChangeTime(`${formattedH}:${formattedM}`);
  };

  // 현재 설정된 날짜의 요일
  const getDayLabel = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '';
    return dayNames[d.getDay()];
  };

  // 시간 표기 포맷 (오전/오후)
  const formatAmPm = (timeStr: string) => {
    const [h, m] = (timeStr || '06:00').split(':').map(Number);
    const period = h < 12 ? '오전' : '오후';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${period} ${displayH}:${String(m).padStart(2, '0')}`;
  };

  return (
    <div ref={containerRef} className="relative space-y-1.5">
      {showLabel && (
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
            <CalendarIcon className="w-3.5 h-3.5 text-ocean-400" />
            일시 <span className="text-rose-400">*</span>
          </label>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* 날짜 선택 버튼 (클릭 시 달력 팝업) */}
        <button
          type="button"
          onClick={() => setIsCalendarOpen(!isCalendarOpen)}
          className="flex-1 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 flex items-center justify-between transition"
        >
          <span className="font-semibold">{date || '날짜 선택'} ({getDayLabel(date)})</span>
          <CalendarIcon className="w-4 h-4 text-ocean-400" />
        </button>

        {/* 10분 단위 조절 시간 스텝 컨트롤 (기본 오전 6:00) */}
        <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs font-mono font-bold text-slate-100 min-w-[68px] text-center">
              {formatAmPm(time)}
            </span>
          </div>

          <div className="flex flex-col border-l border-slate-800 pl-1.5 py-0.5">
            <button
              type="button"
              onClick={() => handleStepTime(10)}
              className="p-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title="+10분 이동"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => handleStepTime(-10)}
              className="p-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
              title="-10분 이동"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 달력 팝업 오버레이 */}
      {isCalendarOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 bg-slate-900 border border-slate-700/90 rounded-2xl p-4 shadow-2xl w-72 animate-scaleIn text-slate-100">
          {/* 달력 상단 년/월 이동 */}
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-800">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-white">
              {viewYear}년 {viewMonth + 1}월
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400 mb-1.5">
            {dayNames.map((d, i) => (
              <span key={d} className={i === 0 ? 'text-rose-400' : i === 6 ? 'text-sky-400' : ''}>
                {d}
              </span>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {/* 첫째 주 빈칸 */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <span key={`empty_${i}`} className="p-1.5" />
            ))}

            {/* 일자 셀 */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dayStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const isSelected = tempSelectedDate === dayStr;
              const dayOfWeek = (firstDayOfWeek + i) % 7;

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => handleSelectDay(dayNum)}
                  className={`p-1.5 rounded-xl font-medium transition text-xs ${
                    isSelected
                      ? 'bg-ocean-600 text-white font-bold ring-2 ring-ocean-400/50 shadow-md'
                      : 'hover:bg-slate-800 text-slate-200'
                  } ${dayOfWeek === 0 && !isSelected ? 'text-rose-400' : ''} ${
                    dayOfWeek === 6 && !isSelected ? 'text-sky-400' : ''
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>

          {/* 하단 "선택" 확정 버튼 */}
          <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between">
            <span className="text-[11px] font-mono text-ocean-300 font-bold">
              {tempSelectedDate} ({getDayLabel(tempSelectedDate)})
            </span>
            <button
              type="button"
              onClick={handleConfirmDate}
              className="px-3.5 py-1.5 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold transition flex items-center gap-1 shadow-md shadow-ocean-600/30"
            >
              <Check className="w-3.5 h-3.5" />
              <span>선택</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
