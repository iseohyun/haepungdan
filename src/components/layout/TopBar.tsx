import React from 'react';
import { Menu, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleCalendar: () => void;
  isCalendarOpen: boolean;
  onOpenCreateModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onToggleCalendar,
  isCalendarOpen,
  onOpenCreateModal,
}) => {
  const { canCreateGathering, canProposeGathering } = useAuth();

  return (
    <header className="absolute top-3 left-3 right-3 md:right-auto md:left-4 z-30 pointer-events-none flex items-center justify-between gap-2">
      {/* 좌측: 사이드바 토글 및 달력 토글 */}
      <div className="pointer-events-auto flex items-center gap-2 glass-panel p-1.5 pl-2 pr-2.5 rounded-2xl shadow-xl">
        {/* 사이드바 열기/닫기 */}
        <button
          onClick={onToggleSidebar}
          aria-label="사이드바 메뉴 열기"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-ocean-600/90 hover:bg-ocean-500 text-white text-xs font-bold transition shadow-md shadow-ocean-600/30 active:scale-95"
        >
          <Menu className="w-4 h-4" />
          <span>{isSidebarOpen ? '메뉴 닫기' : '메뉴 열기'}</span>
        </button>

        {/* 달력 ON / OFF 토글 */}
        <button
          onClick={onToggleCalendar}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition border ${
            isCalendarOpen
              ? 'bg-ocean-600/30 text-ocean-300 border-ocean-500/50 shadow-sm'
              : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700'
          }`}
          title="좌상단 달력 위젯 표시 토글"
        >
          <CalendarIcon className="w-3.5 h-3.5 text-ocean-400" />
          <span>달력 {isCalendarOpen ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* 우측 퀵 컨트롤 (모바일 전용 새 모임 개설) */}

      <div className="pointer-events-auto flex items-center gap-1.5 glass-panel p-1.5 rounded-2xl shadow-xl md:hidden">
        {(canCreateGathering || canProposeGathering) && (
          <button
            onClick={onOpenCreateModal}
            className="p-2 rounded-xl bg-emerald-600/90 hover:bg-emerald-500 text-white transition shadow-md"
            title="새 모임 개설/제안"
          >
            <PlusCircle className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
