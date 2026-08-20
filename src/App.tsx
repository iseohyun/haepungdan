import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './services/db';
import { Gathering, GatheringRSVP, GatheringReview, LocationPosition, POI, RSVPStatus } from './types';
import { TopBar } from './components/layout/TopBar';
import { Sidebar } from './components/layout/Sidebar';
import { MapViewer, MapViewerRef } from './components/MapViewer';
import { CalendarWidget } from './components/CalendarWidget';
import { GatheringDetailModal } from './components/GatheringDetailModal';
import { CreateGatheringModal } from './components/CreateGatheringModal';
import { useAuth } from './context/AuthContext';

export const App: React.FC = () => {
  const { currentUser } = useAuth();
  const mapViewerRef = useRef<MapViewerRef>(null);

  // Dexie 실시간 쿼리 (로컬 IndexedDB 자동 구독)
  const pois = useLiveQuery(() => db.pois.toArray(), []) ?? [];
  const gatherings = useLiveQuery(() => db.gatherings.toArray(), []) ?? [];
  const allRsvps = useLiveQuery(() => db.rsvps.toArray(), []) ?? [];
  const allReviews = useLiveQuery(() => db.reviews.toArray(), []) ?? [];

  // UI 상태 관리
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(true);
  const [showPois, setShowPois] = useState(true);

  const [selectedGathering, setSelectedGathering] = useState<Gathering | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedLocation, setPickedLocation] = useState<LocationPosition | null>(null);

  // 모임 선택 핸들러
  const handleSelectGathering = (gathering: Gathering) => {
    setSelectedGathering(gathering);
  };

  // POI 선택 핸들러
  const handleSelectPoi = (poi: POI) => {
    mapViewerRef.current?.focusCoordinate(poi.position.x_pct, poi.position.y_pct, 2.5);
  };

  // 좌표 포커스 이동
  const handleFocusCoordinate = (x_pct: number, y_pct: number) => {
    mapViewerRef.current?.focusCoordinate(x_pct, y_pct, 2.3);
  };

  // 지도 리셋
  const handleResetMapView = () => {
    mapViewerRef.current?.resetView();
  };

  // 지도에서 직접 좌표 찍기 모드 진입
  const handleStartPickingLocation = () => {
    setIsCreateModalOpen(false);
    setIsPickingLocation(true);
    setIsSidebarOpen(false);
  };

  // 지도 클릭으로 좌표 선택 완료 시
  const handleLocationPicked = (pos: LocationPosition) => {
    setPickedLocation(pos);
    setIsPickingLocation(false);
    setIsCreateModalOpen(true);
  };

  // 모임 생성/제안
  const handleCreateGathering = async (newGat: Omit<Gathering, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = `gat_${Date.now()}`;
    const now = new Date().toISOString();
    const gatheringData: Gathering = {
      ...newGat,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await db.gatherings.add(gatheringData);
    setPickedLocation(null);
  };

  // RSVP 응답 갱신
  const handleUpdateRsvp = async (gatheringId: string, status: RSVPStatus, comment?: string) => {
    if (!currentUser) return;
    const rsvpId = `${gatheringId}_${currentUser.uid}`;
    const now = new Date().toISOString();

    const rsvpData: GatheringRSVP = {
      id: rsvpId,
      gatheringId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userPhotoUrl: currentUser.photoURL,
      status,
      comment: comment || undefined,
      updatedAt: now,
    };

    await db.rsvps.put(rsvpData);
  };

  // 후기 등록
  const handleAddReview = async (gatheringId: string, content: string, rating: number) => {
    if (!currentUser) return;
    const reviewId = `rev_${Date.now()}`;
    const now = new Date().toISOString();

    const reviewData: GatheringReview = {
      id: reviewId,
      gatheringId,
      userId: currentUser.uid,
      userName: currentUser.displayName,
      userPhotoUrl: currentUser.photoURL,
      content,
      rating,
      photos: [],
      createdAt: now,
      updatedAt: now,
    };

    await db.reviews.add(reviewData);
  };

  // 모임 상태 변경 (관리자)
  const handleUpdateStatus = async (gatheringId: string, newStatus: Gathering['status']) => {
    await db.gatherings.update(gatheringId, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    if (selectedGathering && selectedGathering.id === gatheringId) {
      setSelectedGathering({
        ...selectedGathering,
        status: newStatus,
      });
    }
  };

  // 모임 삭제 (관리자)
  const handleDeleteGathering = async (gatheringId: string) => {
    await db.gatherings.update(gatheringId, {
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    });
    setSelectedGathering(null);
  };

  // 선택된 모임의 RSVP 및 후기 필터링
  const selectedGatheringRsvps = selectedGathering
    ? allRsvps.filter((r) => r.gatheringId === selectedGathering.id)
    : [];

  const selectedGatheringReviews = selectedGathering
    ? allReviews.filter((r) => r.gatheringId === selectedGathering.id)
    : [];

  const activeGatherings = gatherings.filter((g) => !g.isDeleted);

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-slate-950">
      {/* 1. 초슬림 상단 툴바 (사이드바 토글 및 미니 헤더) */}
      <TopBar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        onToggleCalendar={() => setIsCalendarOpen(!isCalendarOpen)}
        isCalendarOpen={isCalendarOpen}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        gatheringCount={activeGatherings.length}
      />

      {/* 2. 좌측 네비게이션 바 (모바일 95vw / 데스크톱 w-96) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        gatherings={gatherings}
        pois={pois}
        selectedGatheringId={selectedGathering?.id || null}
        onSelectGathering={handleSelectGathering}
        onSelectPoi={handleSelectPoi}
        onFocusCoordinate={handleFocusCoordinate}
        onResetMapView={handleResetMapView}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        isCalendarOpen={isCalendarOpen}
        onToggleCalendar={() => setIsCalendarOpen(!isCalendarOpen)}
        showPois={showPois}
        onTogglePois={() => setShowPois(!showPois)}
      />

      {/* 3. 100vh 풀스크린 거제 지도 */}
      <main className="w-full h-full">
        <MapViewer
          ref={mapViewerRef}
          pois={pois}
          gatherings={gatherings}
          selectedGatheringId={selectedGathering?.id || null}
          onSelectGathering={handleSelectGathering}
          onSelectPoi={handleSelectPoi}
          isPickingLocation={isPickingLocation}
          onLocationPicked={handleLocationPicked}
          showPois={showPois}
          onTogglePois={() => setShowPois(!showPois)}
        />
      </main>

      {/* 4. 좌상단 플로팅 캘린더 위젯 */}
      <CalendarWidget
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        gatherings={gatherings}
        selectedGatheringId={selectedGathering?.id || null}
        onSelectGathering={handleSelectGathering}
        onFocusCoordinate={handleFocusCoordinate}
      />

      {/* 5. 모임 상세 모달 */}
      {selectedGathering && (
        <GatheringDetailModal
          gathering={selectedGathering}
          rsvps={selectedGatheringRsvps}
          reviews={selectedGatheringReviews}
          onClose={() => setSelectedGathering(null)}
          onUpdateRsvp={handleUpdateRsvp}
          onAddReview={handleAddReview}
          onUpdateStatus={handleUpdateStatus}
          onDeleteGathering={handleDeleteGathering}
        />
      )}

      {/* 6. 새 모임 개설 / 제안 모달 */}
      {isCreateModalOpen && (
        <CreateGatheringModal
          pois={pois}
          pickedLocation={pickedLocation}
          onStartPickingLocation={handleStartPickingLocation}
          onClose={() => setIsCreateModalOpen(false)}
          onCreate={handleCreateGathering}
        />
      )}
    </div>
  );
};
