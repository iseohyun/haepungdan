import React from 'react';
import { Menu, Calendar as CalendarIcon, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleCalendar: () => void;
  isCalendarOpen: boolean;
  onOpenCreateModal: () => void;
  gatheringCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onToggleCalendar,
  isCalendarOpen,
  onOpenCreateModal,
  gatheringCount,
}) => {
  const { canCreateGathering, canProposeGathering, currentRole } = useAuth();
  const logoSrc = `${import.meta.env.BASE_URL}Haepungdan-main.png`;

  const getRoleBadge = () => {
    switch (currentRole) {
      case 'ADMIN':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">관리자</span>;
      case 'MEMBER':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">정회원</span>;
      case 'GUEST':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">게스트</span>;
      default:
        return <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">열람</span>;
    }
  };

  return (
    <header className="absolute top-3 left-3 right-3 md:right-auto md:left-4 z-30 pointer-events-none flex items-center justify-between gap-2">
      {/* 좌측: 사이드바 토글 버튼 & 미니 타이틀 (클릭 가능) */}
      <div className="pointer-events-auto flex items-center gap-2 glass-panel p-1.5 pl-2 pr-3 rounded-2xl shadow-xl">
        <button
          onClick={onToggleSidebar}
          aria-label="사이드바 메뉴 열기"
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-ocean-600/90 hover:bg-ocean-500 text-white text-xs font-bold transition shadow-md shadow-ocean-600/30 active:scale-95"
        >
          <Menu className="w-4 h-4" />
          <span>{isSidebarOpen ? '메뉴 닫기' : '메뉴 열기'}</span>
        </button>

        {/* 미니 로고 & 타이틀 */}
        <div className="flex items-center gap-2 pl-1 border-l border-slate-700/60">
          <img
            src={logoSrc}
            alt="해풍단 로고"
            className="w-6 h-6 rounded-full object-cover border border-ocean-400 shadow-sm"
            onError={(e) => {
              // 이미지 로딩 실패 시 아이콘 대체
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />
          <span className="font-bold text-sm text-white tracking-tight hidden xs:inline">
            해풍단
          </span>
          <span className="text-[11px] px-1.5 py-0.2 rounded bg-ocean-950 text-ocean-300 border border-ocean-800">
            {gatheringCount}
          </span>
          {getRoleBadge()}
        </div>
      </div>

      {/* 우측 퀵 컨트롤 (모바일 및 데스크톱) */}
      <div className="pointer-events-auto flex items-center gap-1.5 glass-panel p-1.5 rounded-2xl shadow-xl md:hidden">
        {/* 달력 토글 버튼 */}
        <button
          onClick={onToggleCalendar}
          className={`p-2 rounded-xl transition ${
            isCalendarOpen
              ? 'bg-ocean-600/30 text-ocean-300 border border-ocean-500/50'
              : 'text-slate-400 hover:text-white hover:bg-slate-800'
          }`}
          title="달력 위젯 토글"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>

        {/* 새 모임 개설 버튼 */}
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
