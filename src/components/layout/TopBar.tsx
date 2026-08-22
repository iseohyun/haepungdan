import React from 'react';
import { Menu, Calendar as CalendarIcon, Image as ImageIcon, Gamepad2, Crosshair, Sun, Moon } from 'lucide-react';

interface TopBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onToggleCalendar: () => void;
  isCalendarOpen: boolean;
  onTogglePhotoWidget?: () => void;
  isPhotoWidgetOpen?: boolean;
  onToggleMapControls?: () => void;
  isMapControlsOpen?: boolean;
  onToggleGisOverlay?: () => void;
  isGisOverlayOpen?: boolean;
  onToggleTheme?: () => void;
  isDarkMode?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  onToggleCalendar,
  isCalendarOpen,
  onTogglePhotoWidget,
  isPhotoWidgetOpen = true,
  onToggleMapControls,
  isMapControlsOpen = true,
  onToggleGisOverlay,
  isGisOverlayOpen = true,
  onToggleTheme,
  isDarkMode = true,
}) => {

  // 통일된 버튼 스타일 클래스 생성기
  const getButtonClass = (isActive: boolean) =>
    `p-2 rounded-xl border transition-all duration-200 flex items-center justify-center ${
      isActive
        ? 'bg-ocean-600/30 text-ocean-300 border-ocean-500/50 shadow-sm ring-1 ring-ocean-400/20'
        : 'bg-slate-800/80 hover:bg-slate-700/80 text-slate-400 border-slate-700/80 hover:text-slate-200'
    }`;

  return (
    <aside className="absolute top-3 left-3 md:left-4 z-40 flex flex-col items-center gap-1.5 glass-panel p-1.5 rounded-2xl shadow-2xl backdrop-blur-md select-none">
      {/* 1. 사이드바 메뉴 열기/닫기 */}
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

      {/* 2.5 사진 위젯 열기 / 닫기 토글 */}
      {onTogglePhotoWidget && (
        <button
          onClick={onTogglePhotoWidget}
          className={getButtonClass(isPhotoWidgetOpen)}
          title={`대표 사진 위젯 ${isPhotoWidgetOpen ? '숨기기' : '표시'}`}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      )}

      {/* 3. 지도 컨트롤러(리모콘) ON / OFF 토글 */}
      {onToggleMapControls && (
        <button
          onClick={onToggleMapControls}
          className={getButtonClass(isMapControlsOpen)}
          title={`리모콘 ${isMapControlsOpen ? '숨기기' : '표시'}`}
        >
          <Gamepad2 className="w-4 h-4" />
        </button>
      )}

      {/* 4. 좌하단 위경도 표시 ON / OFF 토글 */}
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
    </aside>
  );
};
