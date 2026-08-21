import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './services/db';
import { firebaseService } from './services/firebase';
import { Gathering, RSVPStatus } from './types';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { MapViewer, MapViewerRef } from './components/MapViewer';
import { CalendarWidget } from './components/CalendarWidget';
import { GatheringDetailModal } from './components/GatheringDetailModal';
import { CreateGatheringModal } from './components/CreateGatheringModal';
import { AdminManagementModal } from './components/admin/AdminManagementModal';
import { LocationPresetsModal } from './components/admin/LocationPresetsModal';
import { PhotoLightboxModal } from './components/media/PhotoLightboxModal';
import { useAuth } from './context/AuthContext';
import { X } from 'lucide-react';

export const App: React.FC = () => {
  const { currentUser } = useAuth();
  const mapViewerRef = useRef<MapViewerRef>(null);

  // Dexie 실시간 쿼리 (로컬 IndexedDB 자동 구독)
  const gatherings = useLiveQuery(() => db.gatherings.toArray(), []) ?? [];
  const allRsvps = useLiveQuery(() => db.rsvps.toArray(), []) ?? [];
  const allReviews = useLiveQuery(() => db.reviews.toArray(), []) ?? [];

  // 앱 시작 시 Firebase 클라우드와 백그라운드 델타 동기화 (최신 모임 및 상세집결위치 불러오기)
  useEffect(() => {
    const runInitialSync = async () => {
      try {
        if (firebaseService.firestore) {
          await firebaseService.syncDelta();
        }
      } catch (err) {
        console.warn('Initial cloud sync skipped or failed:', err);
      }
    };
    runInitialSync();
  }, []);

  // UI 상태 관리 (기본값: 달력 on, 지도 컨트롤러 off, GIS 위경도 off)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [isMapControlsOpen, setIsMapControlsOpen] = useState(false);
  const [isGisOverlayOpen, setIsGisOverlayOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(
    () => localStorage.getItem('haepungdan_theme') !== 'light'
  );

  // 테마 모드 HTML 클래스 및 로컬스토리지 동기화
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('haepungdan_theme', 'dark');
    } else {
      document.documentElement.classList.add('light');
      document.documentElement.classList.remove('dark');
      localStorage.setItem('haepungdan_theme', 'light');
    }
  }, [isDarkMode]);

  const [selectedGatheringId, setSelectedGatheringId] = useState<string | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isLocationPresetsModalOpen, setIsLocationPresetsModalOpen] = useState(false);
  const [isPhotoLightboxOpen, setIsPhotoLightboxOpen] = useState(false);
  const [isPhotoWidgetDismissed, setIsPhotoWidgetDismissed] = useState(false);

  const hasInitializedRef = useRef(false);

  // 최초 접속 시 제일 마지막 회차(최신 모임) 1회 자동 로딩 (모달은 열지 않고 지도/달력 상태만 로딩)
  useEffect(() => {
    if (!hasInitializedRef.current && gatherings.length > 0) {
      const active = gatherings.filter((g) => !g.isDeleted);
      if (active.length > 0) {
        const latest = [...active].sort((a, b) => {
          if (a.roundNumber !== undefined && b.roundNumber !== undefined) {
            return b.roundNumber - a.roundNumber;
          }
          return new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime();
        })[0];
        if (latest) {
          hasInitializedRef.current = true;
          setSelectedGatheringId(latest.id);
        }
      }
    }
  }, [gatherings]);

  // 현재 선택된 모임 객체
  const selectedGathering = gatherings.find((g) => g.id === selectedGatheringId) ?? null;

  // 선택된 모임의 모든 사진 목록 (대표 썸네일 + 후기 사진들)
  const selectedGatheringPhotos = useMemo(() => {
    if (!selectedGathering) return [];
    const photos: string[] = [];
    if (selectedGathering.thumbnailUrl) photos.push(selectedGathering.thumbnailUrl);
    const relatedReviews = allReviews.filter((r) => r.gatheringId === selectedGathering.id);
    for (const rev of relatedReviews) {
      if (rev.images && rev.images.length > 0) {
        photos.push(...rev.images);
      }
    }
    return Array.from(new Set(photos));
  }, [selectedGathering, allReviews]);

  // 사용자가 모임을 직접 선택/클릭했을 때
  const handleSelectGathering = (gathering: Gathering, openModal: boolean = true) => {
    if (gathering.id !== selectedGatheringId) {
      setIsPhotoWidgetDismissed(false);
    }
    setSelectedGatheringId(gathering.id);
    if (openModal) {
      setIsDetailModalOpen(true);
    }
  };

  // 좌표 포커스 이동
  const handleFocusCoordinate = (x_pct: number, y_pct: number) => {
    mapViewerRef.current?.focusCoordinate(x_pct, y_pct, 2.3);
  };

  // 모임 생성/제안 (로컬 IndexedDB + Firebase Firestore 실시간 저장)
  const handleCreateGathering = async (newGat: Omit<Gathering, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `gat_${Date.now()}`;
    const now = new Date().toISOString();
    const gatheringData: Gathering = {
      ...newGat,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // 1. 로컬 IndexedDB 저장
    await db.gatherings.add(gatheringData);

    // 2. Firebase Firestore 클라우드 즉시 저장
    await firebaseService.saveGatheringToCloud(gatheringData);

    setIsCreateModalOpen(false);
  };

  // 모임 전체 정보 수정 핸들러 (로컬 IndexedDB + Firebase Firestore)
  const handleUpdateGathering = async (gatheringId: string, updates: Partial<Gathering>) => {
    const now = new Date().toISOString();
    await db.updateGathering(gatheringId, updates);

    const existing = await db.gatherings.get(gatheringId);
    if (existing) {
      const fullUpdated = { ...existing, ...updates, updatedAt: now };
      await firebaseService.saveGatheringToCloud(fullUpdated);
    }
  };

  // RSVP 응답 갱신 (로컬 IndexedDB + Firebase Firestore)
  const handleUpdateRsvp = async (gatheringId: string, status: RSVPStatus, comment?: string) => {
    if (!currentUser) return;
    await db.submitRsvp(
      gatheringId,
      currentUser.uid,
      currentUser.displayName,
      currentUser.photoURL,
      status,
      comment
    );

    const updatedRsvp = await db.rsvps.where({ gatheringId, userId: currentUser.uid }).first();
    if (updatedRsvp) {
      await firebaseService.saveRsvpToCloud(updatedRsvp);
    }
  };

  // 후기 등록 (사진 WebP 배열 포함, 로컬 + Firebase Firestore)
  const handleAddReview = async (gatheringId: string, content: string, rating: number, images?: string[]) => {
    if (!currentUser) return;
    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();
    const newReview = {
      id,
      gatheringId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userAvatar: currentUser.photoURL,
      content,
      rating,
      images: images || [],
      createdAt: now,
      updatedAt: now,
    };

    await db.reviews.add(newReview);
    await firebaseService.saveReviewToCloud(newReview);
  };

  // 후기 삭제
  const handleDeleteReview = async (reviewId: string, gatheringId: string) => {
    await db.deleteReview(reviewId, gatheringId);
    await firebaseService.deleteReviewFromCloud(reviewId);
  };

  // 모임 삭제 (Soft Delete, 로컬 + Firebase Firestore)
  const handleDeleteGathering = async (gatheringId: string) => {
    await db.softDeleteGathering(gatheringId);
    const existing = await db.gatherings.get(gatheringId);
    if (existing) {
      await firebaseService.saveGatheringToCloud({ ...existing, isDeleted: true, updatedAt: new Date().toISOString() });
    }
    setSelectedGatheringId(null);
    setIsDetailModalOpen(false);
  };

  // 선택된 모임의 RSVP 및 후기 실시간 필터링
  const selectedGatheringRsvps = selectedGathering
    ? allRsvps.filter((r) => r.gatheringId === selectedGathering.id)
    : [];

  const selectedGatheringReviews = selectedGathering
    ? allReviews.filter((r) => r.gatheringId === selectedGathering.id)
    : [];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-100 dark:bg-slate-950 transition-colors duration-300">
      {/* 1. 상단 플로팅 네비게이션 헤더 */}
      <TopBar
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onToggleCalendar={() => setIsCalendarOpen((prev) => !prev)}
        isCalendarOpen={isCalendarOpen}
        onToggleMapControls={() => setIsMapControlsOpen((prev) => !prev)}
        isMapControlsOpen={isMapControlsOpen}
        onToggleGisOverlay={() => setIsGisOverlayOpen((prev) => !prev)}
        isGisOverlayOpen={isGisOverlayOpen}
        onToggleTheme={() => setIsDarkMode((prev) => !prev)}
        isDarkMode={isDarkMode}
      />

      {/* 2. 좌측 네비게이션 바 (모바일 95vw / 데스크톱 w-96) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        gatherings={gatherings}
        selectedGatheringId={selectedGatheringId}
        onSelectGathering={handleSelectGathering}
        onFocusCoordinate={handleFocusCoordinate}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenLocationPresets={() => setIsLocationPresetsModalOpen(true)}
      />

      {/* 3. 100vh 풀스크린 거제 지도 */}
      <main className="w-full h-full">
        <MapViewer
          ref={mapViewerRef}
          gatherings={gatherings}
          selectedGatheringId={selectedGatheringId}
          onSelectGathering={handleSelectGathering}
          onUpdateGathering={handleUpdateGathering}
          isControlsOpen={isMapControlsOpen}
          isGisOverlayOpen={isGisOverlayOpen}
        />
      </main>

      {/* 4. 좌상단 플로팅 캘린더 위젯 */}
      <CalendarWidget
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        gatherings={gatherings}
        selectedGatheringId={selectedGatheringId}
        onSelectGathering={handleSelectGathering}
        onFocusCoordinate={handleFocusCoordinate}
      />

      {/* 5. 좌하단 선택된 모임 대표 이미지 플로팅 포토 위젯 */}
      {selectedGathering && selectedGathering.thumbnailUrl && !isPhotoWidgetDismissed && (
        <div
          onClick={() => setIsPhotoLightboxOpen(true)}
          className="absolute bottom-12 sm:bottom-14 left-3 md:left-4 z-20 group cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-300 select-none"
          title={`${selectedGathering.title} (클릭하여 사진 크게 보기)`}
        >
          <div className="relative rounded-2xl overflow-hidden glass-panel p-1 border border-slate-700/90 shadow-2xl transition-all duration-300 group-hover:scale-105 group-hover:border-ocean-500/80 bg-slate-900/85 backdrop-blur-md">
            {/* 썸네일 이미지 */}
            <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden relative bg-slate-950">
              <img
                src={selectedGathering.thumbnailUrl}
                alt={selectedGathering.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              
              {/* 상단 뱃지 (회차) */}
              {selectedGathering.roundNumber !== undefined && (
                <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-md bg-ocean-600/90 text-white text-[10px] font-mono font-bold shadow-md backdrop-blur-sm">
                  {selectedGathering.roundNumber === 0 ? '번개' : `제${selectedGathering.roundNumber}차`}
                </div>
              )}

              {/* 우상단 닫기 (X) 버튼 */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsPhotoWidgetDismissed(true);
                }}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/75 hover:bg-rose-600 text-white transition shadow-md z-10"
                title="사진 닫기"
              >
                <X className="w-3 h-3" />
              </button>

              {/* 하단 그라디언트 + 장소명 */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-2 pt-4">
                <span className="text-[11px] font-bold text-white leading-tight truncate block drop-shadow-md">
                  {selectedGathering.locationName}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. 사진 크게 보기 (풀스크린 라이트박스 모달) */}
      <PhotoLightboxModal
        isOpen={isPhotoLightboxOpen}
        images={selectedGatheringPhotos}
        title={selectedGathering?.title}
        onClose={() => setIsPhotoLightboxOpen(false)}
      />

      {/* 7. 모임 상세 모달 */}
      {isDetailModalOpen && selectedGathering && (
        <GatheringDetailModal
          gathering={selectedGathering}
          rsvps={selectedGatheringRsvps}
          reviews={selectedGatheringReviews}
          onClose={() => setIsDetailModalOpen(false)}
          onUpdateRsvp={handleUpdateRsvp}
          onAddReview={handleAddReview}
          onDeleteReview={handleDeleteReview}
          onDeleteGathering={handleDeleteGathering}
          onUpdateGathering={handleUpdateGathering}
        />
      )}

      {/* 8. 새 모임 개설 / 제안 모달 (직접 GPS 좌표 입력 방식) */}
      <CreateGatheringModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateGathering}
      />

      {/* 9. 관리자 센터 (회원 승인 / 권한 관리 / 백업) 모달 */}
      {isAdminModalOpen && (
        <AdminManagementModal
          onClose={() => setIsAdminModalOpen(false)}
        />
      )}

      {/* 10. 지정주소(집결지) 관리 및 수정/삭제 모달 */}
      {isLocationPresetsModalOpen && (
        <LocationPresetsModal
          isOpen={isLocationPresetsModalOpen}
          onClose={() => setIsLocationPresetsModalOpen(false)}
        />
      )}
    </div>
  );
};
