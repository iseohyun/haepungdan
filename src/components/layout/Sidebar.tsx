import React, { useState, useRef } from 'react';
import { Gathering, POI } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportDatabaseToJson, importDatabaseFromJson } from '../../services/backup';
import { APP_VERSION, RELEASE_TAG } from '../../constants/version';
import {
  X,
  PlusCircle,
  Calendar as CalendarIcon,
  MapPin,
  Layers,
  Download,
  Upload,
  Search,
  Sparkles,
  Shield,
  UserCheck,
  User,
  Eye,
  ChevronRight,
  Compass,
  RotateCcw,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  gatherings: Gathering[];
  pois: POI[];
  selectedGatheringId: string | null;
  onSelectGathering: (gathering: Gathering) => void;
  onSelectPoi: (poi: POI) => void;
  onFocusCoordinate: (x_pct: number, y_pct: number) => void;
  onResetMapView: () => void;
  onOpenCreateModal: () => void;
  isCalendarOpen: boolean;
  onToggleCalendar: () => void;
  showPois: boolean;
  onTogglePois: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  gatherings,
  pois,
  selectedGatheringId,
  onSelectGathering,
  onSelectPoi,
  onFocusCoordinate,
  onResetMapView,
  onOpenCreateModal,
  isCalendarOpen,
  onToggleCalendar,
  showPois,
  onTogglePois,
}) => {
  const { currentUser, currentRole, canCreateGathering, canProposeGathering, loginAs } = useAuth();
  const [activeTab, setActiveTab] = useState<'gatherings' | 'pois' | 'tools'>('gatherings');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const logoSrc = `${import.meta.env.BASE_URL}Haepungdan-main.png`;

  // 모임 필터링 및 검색
  const filteredGatherings = gatherings
    .filter((g) => !g.isDeleted)
    .filter((g) => {
      if (statusFilter === 'ALL') return true;
      return g.status === statusFilter;
    })
    .filter((g) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        g.title.toLowerCase().includes(q) ||
        g.locationName.toLowerCase().includes(q) ||
        g.createdByName.toLowerCase().includes(q)
      );
    });

  // POI 검색 필터링
  const filteredPois = pois.filter((poi) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return poi.name.toLowerCase().includes(q) || poi.metadata?.description?.toLowerCase().includes(q);
  });

  const handleExport = async () => {
    try {
      await exportDatabaseToJson();
    } catch {
      alert('백업 파일 내보내기에 실패했습니다.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('백업 파일을 복구하면 현재 데이터가 덮어씌워집니다. 계속하시겠습니까?')) {
      const result = await importDatabaseFromJson(file);
      alert(result.message);
      if (result.success) {
        window.location.reload();
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const getStatusBadge = (status: Gathering['status']) => {
    switch (status) {
      case 'RECRUITING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">모집중</span>;
      case 'PROPOSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">제안</span>;
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">확정</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 text-slate-300 border border-slate-600">완료</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">취소</span>;
    }
  };

  return (
    <>
      {/* 모바일 딤 오버레이 (클릭 시 사이드바 닫힘) */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* 사이드바 본체: 모바일에서는 너비 95vw 차지 */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 w-[95vw] sm:w-[85vw] md:w-96 glass-panel border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out select-none shadow-2xl ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 1. 상단 브랜드 헤더 (로고 & 타이틀 & 닫기 버튼) */}
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-ocean-500/60 shadow-lg shadow-ocean-500/20 shrink-0 bg-slate-950 flex items-center justify-center">
              <img
                src={logoSrc}
                alt="해풍단 로고"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
              <Compass className="w-6 h-6 text-ocean-400 absolute pointer-events-none opacity-20" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">해풍단 (海風團)</h2>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-ocean-950 text-ocean-300 border border-ocean-800">
                  거제
                </span>
              </div>
              <p className="text-xs text-slate-400">소모임 활동 &amp; 지도 아카이브</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            aria-label="사이드바 닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. 퀵 액션 바 (새 모임 개설 / 달력 토글 / POI 토글 / 지도 리셋) */}
        <div className="p-3 bg-slate-900/50 border-b border-slate-800/80 space-y-2">
          {(canCreateGathering || canProposeGathering) && (
            <button
              onClick={() => {
                onOpenCreateModal();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-ocean-600 to-cyan-500 hover:from-ocean-500 hover:to-cyan-400 text-white font-bold text-xs shadow-lg shadow-ocean-600/30 transition active:scale-98"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{canCreateGathering ? '새 모임 개설하기 (공식)' : '모임 제안하기 (정회원)'}</span>
            </button>
          )}

          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              onClick={onToggleCalendar}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition ${
                isCalendarOpen
                  ? 'bg-ocean-600/25 border-ocean-500/50 text-ocean-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>달력 {isCalendarOpen ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onTogglePois}
              className={`p-2 rounded-xl border flex items-center justify-center gap-1.5 font-medium transition ${
                showPois
                  ? 'bg-ocean-600/25 border-ocean-500/50 text-ocean-300'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>명소 {showPois ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={() => {
                onResetMapView();
                if (window.innerWidth < 768) onClose();
              }}
              className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 font-medium transition"
              title="지도 위치 초기화"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>맵 리셋</span>
            </button>
          </div>
        </div>

        {/* 3. 탭 네비게이션 */}
        <div className="flex border-b border-slate-800 bg-slate-900/70 px-3">
          <button
            onClick={() => setActiveTab('gatherings')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'gatherings'
                ? 'border-ocean-500 text-ocean-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> 모임 ({gatherings.filter((g) => !g.isDeleted).length})
          </button>
          <button
            onClick={() => setActiveTab('pois')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'pois'
                ? 'border-ocean-500 text-ocean-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" /> 거제 명소 ({pois.length})
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'tools'
                ? 'border-ocean-500 text-ocean-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Download className="w-3.5 h-3.5" /> 데이터 백업
          </button>
        </div>

        {/* 4. 검색창 */}
        <div className="p-3 bg-slate-900/40 border-b border-slate-800/60">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeTab === 'gatherings' ? '모임명, 장소, 작성자 검색...' : '명소 이름 검색...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>
        </div>

        {/* 5. 탭 본문 리스트 (스크롤 영역) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {/* TAB 1: 모임 목록 */}
          {activeTab === 'gatherings' && (
            <div className="space-y-2">
              {/* 상태 필터 태그 */}
              <div className="flex gap-1 overflow-x-auto pb-1 text-[11px]">
                {['ALL', 'RECRUITING', 'PROPOSED', 'CONFIRMED', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded-lg font-medium whitespace-nowrap transition ${
                      statusFilter === st
                        ? 'bg-ocean-600 text-white font-bold shadow-sm'
                        : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st === 'ALL'
                      ? '전체'
                      : st === 'RECRUITING'
                      ? '모집중'
                      : st === 'PROPOSED'
                      ? '제안'
                      : st === 'CONFIRMED'
                      ? '확정'
                      : '완료'}
                  </button>
                ))}
              </div>

              {/* 목록 카드들 */}
              {filteredGatherings.length > 0 ? (
                filteredGatherings.map((g) => {
                  const isSelected = g.id === selectedGatheringId;
                  const gDate = new Date(g.dateTime);
                  const formattedDate = `${gDate.getMonth() + 1}/${gDate.getDate()} (${['일','월','화','수','목','금','토'][gDate.getDay()]}) ${gDate.getHours()}:${String(gDate.getMinutes()).padStart(2, '0')}`;

                  return (
                    <div
                      key={g.id}
                      onClick={() => {
                        onSelectGathering(g);
                        onFocusCoordinate(g.position.x_pct, g.position.y_pct);
                        if (window.innerWidth < 768) onClose();
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-ocean-600/25 border-ocean-400 ring-1 ring-ocean-400/50 text-white'
                          : 'glass-card text-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-bold text-xs leading-snug line-clamp-2 text-slate-100">
                          {g.title}
                        </h4>
                        {getStatusBadge(g.status)}
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-ocean-400" />
                          <strong className="text-slate-300">{g.locationName}</strong>
                        </span>
                        <span>{formattedDate}</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800">
                        <span>작성: {g.createdByName}</span>
                        <span className="text-ocean-400 flex items-center gap-0.5">
                          지도 포커스 <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-slate-500">
                  조건에 일치하는 모임이 없습니다.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 거제 명소(POI) 목록 */}
          {activeTab === 'pois' && (
            <div className="space-y-2">
              {filteredPois.map((poi) => (
                <div
                  key={poi.id}
                  onClick={() => {
                    onSelectPoi(poi);
                    onFocusCoordinate(poi.position.x_pct, poi.position.y_pct);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className="p-3 rounded-xl glass-card cursor-pointer space-y-1 hover:border-sky-400 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-sky-300 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> {poi.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      {poi.category}
                    </span>
                  </div>
                  {poi.metadata?.description && (
                    <p className="text-[11px] text-slate-400 line-clamp-2">
                      {poi.metadata.description}
                    </p>
                  )}
                  <div className="text-[10px] text-slate-500 font-mono">
                    {poi.position.lat.toFixed(5)}°N, {poi.position.lng.toFixed(5)}°E
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB 3: 데이터 백업 및 관리 도구 */}
          {activeTab === 'tools' && (
            <div className="space-y-4 p-1">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-ocean-400" /> 로컬 JSON 백업 / 내보내기
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  현재 브라우저(IndexedDB)에 저장된 모든 모임, 후기, POI 데이터를 하나의 JSON 파일로 안전하게 백업합니다.
                </p>
                <button
                  onClick={handleExport}
                  className="w-full py-2 px-3 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white font-semibold text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> JSON 파일 다운로드
                </button>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3 text-xs">
                <h4 className="font-bold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-emerald-400" /> JSON 백업 파일 복원
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  이전에 내보낸 JSON 백업 파일을 불러와 현재 브라우저의 데이터베이스를 복구합니다.
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> 백업 파일 선택하여 복원
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* 6. 하단 사용자 프로필 & 권한 스위처 */}
        <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                {currentRole === 'ADMIN' ? (
                  <Shield className="w-4 h-4 text-amber-400" />
                ) : currentRole === 'MEMBER' ? (
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                ) : currentRole === 'GUEST' ? (
                  <User className="w-4 h-4 text-blue-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div>
                <span className="font-bold text-xs text-white block leading-tight">
                  {currentUser ? currentUser.displayName : '비로그인 방문자'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {currentRole === 'ADMIN'
                    ? '관리자 (전체 권한)'
                    : currentRole === 'MEMBER'
                    ? '정회원 (제안/RSVP/후기)'
                    : currentRole === 'GUEST'
                    ? '게스트 (승인 대기)'
                    : '열람 전용 모드'}
                </span>
              </div>
            </div>
          </div>

          {/* 권한 스위처 선택창 */}
          <select
            value={
              currentUser
                ? currentRole === 'ADMIN'
                  ? 'admin'
                  : currentRole === 'MEMBER'
                  ? 'member'
                  : 'guest'
                : 'unauth'
            }
            onChange={(e) => loginAs(e.target.value as 'unauth' | 'guest' | 'member' | 'admin')}
            className="w-full bg-slate-950 border border-slate-700/80 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ocean-500 cursor-pointer"
          >
            <option value="unauth">🔓 비로그인 (열람 전용)</option>
            <option value="guest">⏳ 게스트 (박초보 / 승인대기)</option>
            <option value="member">👤 정회원 (김바다 / 활동가능)</option>
            <option value="admin">👑 관리자 (이서현 / 모임관리)</option>
          </select>

          {/* 버전 표시 */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 font-mono">
            <span>해풍단 {APP_VERSION}</span>
            <span>{RELEASE_TAG}</span>
          </div>
        </div>
      </aside>
    </>
  );
};
