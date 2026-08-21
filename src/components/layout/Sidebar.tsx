import React, { useState, useRef } from 'react';
import { Gathering } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { exportDatabaseToJson, importDatabaseFromJson } from '../../services/backup';
import { firebaseService } from '../../services/firebase';
import { APP_VERSION, RELEASE_TAG } from '../../constants/version';
import {
  X,
  PlusCircle,
  MapPin,
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
  Cloud,
  Settings,
  LogOut,
  Navigation,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  gatherings: Gathering[];
  selectedGatheringId: string | null;
  onSelectGathering: (gathering: Gathering) => void;
  onFocusCoordinate: (x_pct: number, y_pct: number) => void;
  onOpenCreateModal: () => void;
  onOpenAdminModal?: () => void;
  onOpenFirebaseConfig?: () => void;
  onOpenLocationPresets?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  gatherings,
  selectedGatheringId,
  onSelectGathering,
  onFocusCoordinate,
  onOpenCreateModal,
  onOpenAdminModal,
  onOpenFirebaseConfig,
  onOpenLocationPresets,
}) => {
  const {
    currentUser,
    currentRole,
    canCreateGathering,
    canProposeGathering,
    loginWithGoogle,
    logout,
    isAdmin,
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'gatherings' | 'tools'>('gatherings');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모임 목록 필터링
  const filteredGatherings = gatherings
    .filter((g) => !g.isDeleted)
    .filter((g) => {
      const matchSearch =
        g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.locationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        g.createdByName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || g.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());

  const getStatusBadge = (status: Gathering['status']) => {
    switch (status) {
      case 'PROPOSED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">제안됨</span>;
      case 'RECRUITING':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">모집중</span>;
      case 'CONFIRMED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">확정</span>;
      case 'COMPLETED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">완료</span>;
      case 'CANCELLED':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">취소</span>;
    }
  };

  const handleExport = async () => {
    try {
      await exportDatabaseToJson();
    } catch (e) {
      alert('백업 파일 생성 중 오류가 발생했습니다.');
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('백업 파일을 복원하면 현재 데이터베이스에 추가/업데이트됩니다. 계속할까요?')) {
      try {
        await importDatabaseFromJson(file);
        alert('성공적으로 데이터가 복구되었습니다!');
      } catch (err) {
        alert('백업 파일 형식이 올바르지 않습니다.');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Google 로그인 버튼 핸들러
  const handleGoogleAuthClick = async () => {
    if (!firebaseService.isConfigured) {
      if (
        confirm(
          'Firebase 클라우드 연동이 아직 설정되지 않았습니다.\nFirebase 설정 모달을 열어 키를 입력하시겠습니까?\n(취소 시 임시 모의 로그인으로 접속됩니다.)'
        )
      ) {
        if (onOpenFirebaseConfig) onOpenFirebaseConfig();
        return;
      }
    }

    try {
      await loginWithGoogle();
    } catch (err: any) {
      alert(`로그인 실패: ${err.message || 'Google 팝업 인증을 확인해주세요.'}`);
    }
  };

  const isCloudConnected = firebaseService.isConfigured;

  return (
    <>
      {/* 모바일 백드롭 오버레이 */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fadeIn"
          aria-hidden="true"
        />
      )}

      {/* 사이드바 본체 */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-40 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800 shadow-2xl flex flex-col transition-all duration-300 ease-out select-none ${
          isOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0 pointer-events-none'
        } w-[95vw] md:w-96 max-w-full`}
      >
        {/* 1. 상단 브랜딩 헤더 */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-950/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-2xl overflow-hidden shadow-lg border border-ocean-500/30 bg-ocean-950/40 flex items-center justify-center">
              <img
                src={`${import.meta.env.BASE_URL}Haepungdan-main.png`}
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

        {/* 2. 모임 개설 상단 버튼 (권한 있을 때) */}
        {(canCreateGathering || canProposeGathering) && (
          <div className="p-3 bg-slate-900/50 border-b border-slate-800/80 shrink-0">
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
          </div>
        )}

        {/* 3. 탭 네비게이션 */}
        <div className="flex border-b border-slate-800 bg-slate-900/70 px-3 shrink-0">
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
            onClick={() => setActiveTab('tools')}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition flex items-center justify-center gap-1.5 ${
              activeTab === 'tools'
                ? 'border-ocean-500 text-ocean-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Settings className="w-3.5 h-3.5" /> 관리 & 설정
          </button>
        </div>

        {/* 4. 검색창 (모임 탭일 때) */}
        {activeTab === 'gatherings' && (
          <div className="p-3 border-b border-slate-800/80 bg-slate-950/40 shrink-0">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="모임명, 장소, 작성자 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-8 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* 5. 탭 본문 목록 (스크롤) */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          
          {/* TAB 1: 모임 목록 */}
          {activeTab === 'gatherings' && (
            <div className="space-y-2.5">
              {/* 상태 필터 칩 */}
              <div className="flex gap-1 overflow-x-auto pb-1 custom-scrollbar text-[11px]">
                {['ALL', 'RECRUITING', 'PROPOSED', 'CONFIRMED', 'COMPLETED'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setStatusFilter(st)}
                    className={`px-2 py-0.5 rounded-lg whitespace-nowrap transition ${
                      statusFilter === st
                        ? 'bg-ocean-600 text-white font-bold'
                        : 'bg-slate-800/60 text-slate-400 hover:text-slate-200'
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
                      className={`p-3 rounded-2xl border transition cursor-pointer flex flex-col gap-1.5 ${
                        isSelected
                          ? 'bg-ocean-600/25 border-ocean-400 ring-1 ring-ocean-400/50 text-white'
                          : 'glass-card text-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                          {g.roundNumber !== undefined && (
                            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-ocean-600 text-white shrink-0">
                              {g.roundNumber === 0 ? '번개' : `${g.roundNumber}차`}
                            </span>
                          )}
                          <h4 className="font-bold text-xs leading-snug line-clamp-2 text-slate-100">
                            {g.title}
                          </h4>
                        </div>
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
                          상세보기 <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  조건에 맞는 모임이 없습니다.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 관리 도구 & 클라우드 설정 */}
          {activeTab === 'tools' && (
            <div className="space-y-3 p-1">
              
              {/* 클라우드 동기화 상태 */}
              <div className={`p-3.5 rounded-2xl border space-y-2 ${
                isCloudConnected ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-slate-950/60 border-slate-800'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Cloud className="w-4 h-4 text-ocean-400" />
                    클라우드 연동 상태
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isCloudConnected ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isCloudConnected ? '🟢 연결됨' : '💻 로컬 모드'}
                  </span>
                </div>

                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {isCloudConnected
                    ? 'Firebase Firestore 증분 동기화(Delta Sync)가 활성화되어 있습니다.'
                    : 'Firebase 키를 입력하면 Google 로그인과 다중 기기 실시간 동기화가 활성화됩니다.'}
                </p>

                {onOpenFirebaseConfig && (
                  <button
                    onClick={() => {
                      onOpenFirebaseConfig();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-ocean-600/30 hover:bg-ocean-600/50 text-ocean-300 border border-ocean-500/40 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Firebase 연동 설정 열기</span>
                  </button>
                )}
              </div>

              {/* 지정주소(집결지) 관리 바로가기 */}
              {onOpenLocationPresets && (
                <div className="p-3.5 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-950/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                    <MapPin className="w-4 h-4 text-emerald-400" />
                    <span>지정주소(집결지) 관리</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    모임 장소별 지정주소(카카오/네이버/티맵), 대표 도로명주소 및 GPS 좌표를 등록, 수정, 삭제합니다.
                  </p>
                  <button
                    onClick={() => {
                      onOpenLocationPresets();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>지정주소 관리 및 수정/삭제 열기</span>
                  </button>
                </div>
              )}

              {/* 관리자 회원 관리 센터 바로가기 (관리자 전용) */}
              {isAdmin && onOpenAdminModal && (
                <div className="p-3.5 rounded-2xl glass-card border border-amber-500/30 bg-amber-950/20 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                    <Shield className="w-4 h-4 text-amber-400" />
                    <span>관리자 센터 (회원 승인제)</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    가입 대기 중인 게스트 회원을 정회원으로 승인하거나 권한을 관리합니다.
                  </p>
                  <button
                    onClick={() => {
                      onOpenAdminModal();
                      if (window.innerWidth < 768) onClose();
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>회원 승인 및 관리 센터 열기</span>
                  </button>
                </div>
              )}

              {/* JSON 백업 다운로드 & 복구 */}
              <div className="p-3.5 rounded-2xl glass-card border border-slate-800 space-y-3">
                <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-400" /> 전체 DB 백업 & 복원
                </h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  현재 IndexedDB에 저장된 모든 모임 및 후기 데이터를 하나의 JSON 파일로 백업하거나 복구합니다.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={handleExport}
                    className="flex-1 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5 text-ocean-400" /> 백업 받기
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-2 px-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition flex items-center justify-center gap-1"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" /> 복원하기
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
            </div>
          )}
        </div>

        {/* 6. 하단 사용자 프로필 및 오른쪽 정렬 Google 로그인 버튼 */}
        <div className="p-3.5 bg-slate-900/95 border-t border-slate-800 space-y-2 shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* 좌측: 현재 사용자 및 권한 정보 */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 overflow-hidden">
                {currentUser?.photoURL ? (
                  <img src={currentUser.photoURL} alt={currentUser.displayName} className="w-full h-full object-cover" />
                ) : currentRole === 'ADMIN' ? (
                  <Shield className="w-4 h-4 text-amber-400" />
                ) : currentRole === 'MEMBER' ? (
                  <UserCheck className="w-4 h-4 text-emerald-400" />
                ) : currentRole === 'GUEST' ? (
                  <User className="w-4 h-4 text-blue-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </div>
              <div className="min-w-0">
                <span className="font-bold text-xs text-white block leading-tight truncate">
                  {currentUser ? currentUser.displayName : '비로그인 방문자'}
                </span>
                <span className="text-[10px] text-slate-400 block truncate">
                  {currentRole === 'ADMIN'
                    ? '👑 관리자 (전체 권한)'
                    : currentRole === 'MEMBER'
                    ? '👤 정회원 (활동 권한)'
                    : currentRole === 'GUEST'
                    ? '⏳ 게스트 (승인 대기)'
                    : '🔓 열람 전용'}
                </span>
              </div>
            </div>

            {/* 우측 정렬 Google 로그인 / 로그아웃 버튼 */}
            <div className="shrink-0">
              {currentUser ? (
                <button
                  onClick={logout}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition border border-slate-700 flex items-center gap-1"
                  title="로그아웃"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>로그아웃</span>
                </button>
              ) : (
                <button
                  onClick={handleGoogleAuthClick}
                  className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 text-xs font-bold transition shadow flex items-center gap-1.5 active:scale-95"
                  title="Google 계정으로 로그인"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"/>
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"/>
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                  </svg>
                  <span>Google 로그인</span>
                </button>
              )}
            </div>
          </div>

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
