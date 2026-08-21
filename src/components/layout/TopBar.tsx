import React from 'react';
import { Menu, Calendar as CalendarIcon, Gamepad2, Crosshair, Sun, Moon, PlusCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleCalendar: () => void;
  isCalendarOpen: boolean;
  onToggleMapControls?: () => void;
  isMapControlsOpen?: boolean;
  onToggleGisOverlay?: () => void;
  isGisOverlayOpen?: boolean;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
  onOpenCreateModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onToggleCalendar,
  isCalendarOpen,
  onToggleMapControls,
  isMapControlsOpen = true,
  onToggleGisOverlay,
  isGisOverlayOpen = true,
  onToggleTheme,
  isDarkMode = true,
  onOpenCreateModal,
}) => {
  const { canCreateGathering, canProposeGathering } = useAuth();

  // 통일된 버튼 스타일 클래스 생성기
  const getButtonClass = (isActive: boolean) =>
    `p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
      isActive
        ? 'bg-ocean-600/30 text-ocean-300 border-ocean-500/50 shadow-sm ring-1 ring-ocean-400/20'
        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
    }`;

  return (
    <header className="absolute top-3 left-3 right-3 md:right-auto md:left-4 z-30 pointer-events-none flex items-center justify-between gap-2">
      {/* 좌측: 사이드바 토글, 달력 토글, 지도 컨트롤러(리모컨) 토글, 좌하단 위경도 토글, 다크/화이트 모드 토글 */}
      <div className="pointer-events-auto flex items-center gap-1.5 glass-panel p-1.5 rounded-2xl shadow-xl">
        {/* 1. 사이드바 열기/닫기 */}
        <button
          onClick={onToggleSidebar}
          aria-label="사이드바 메뉴 열기"
          className={getButtonClass(isSidebarOpen)}
          title={`메뉴 ${isSidebarOpen ? '닫기' : '열기'}`}
        >
          <Menu className="w-4 h-4" />
        </button>

        {/* 2. 달력 ON / OFF 토글 */}
        <button
          onClick={onToggleCalendar}
          className={getButtonClass(isCalendarOpen)}
          title={`달력 ${isCalendarOpen ? '숨기기' : '표시'}`}
        >
          <CalendarIcon className="w-4 h-4" />
        </button>

        {/* 3. 우측상단 지도 컨트롤러 ON / OFF 토글 (리모컨 아이콘) */}
        {onToggleMapControls && (
          <button
            onClick={onToggleMapControls}
            className={getButtonClass(isMapControlsOpen)}
            title={`지도 컨트롤러 ${isMapControlsOpen ? '숨기기' : '표시'}`}
          >
            <Gamepad2 className="w-4 h-4" />
          </button>
        )}

        {/* 4. 좌하단 위경도 표시 ON / OFF 토글 (Crosshair 아이콘) */}
        {onToggleGisOverlay && (
          <button
            onClick={onToggleGisOverlay}
            className={getButtonClass(isGisOverlayOpen)}
            title={`좌하단 위경도 표시 ${isGisOverlayOpen ? '숨기기' : '표시'}`}
          >
            <Crosshair className="w-4 h-4" />
          </button>
        )}

        {/* 5. 다크 모드 / 화이트 모드 토글 */}
        {onToggleTheme && (
          <button
            onClick={onToggleTheme}
            className={getButtonClass(!isDarkMode)}
            title={isDarkMode ? '화이트(라이트) 모드로 전환' : '다크 모드로 전환'}
          >
            {isDarkMode ? <Moon className="w-4 h-4 text-slate-300" /> : <Sun className="w-4 h-4 text-amber-400" />}
          </button>
        )}
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
