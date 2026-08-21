import React, { useState, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Gathering, GatheringRSVP, GatheringReview, RSVPStatus, GatheringStatus, LocationPosition } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import {
  getKakaoMapUrl,
  getNaverMapUrl,
  openTMap,
  resolveLocationGuide,
  parseLocalDateTime,
  formatToKoreanIso,
} from '../utils/coordinates';
import { compressImageToWebP } from '../utils/imageCompressor';
import { VideoPlayerEmbed } from './media/VideoPlayerEmbed';
import { MediaGallery } from './media/MediaGallery';
import { CustomDateTimePicker } from './common/CustomDateTimePicker';
import { DirectInputModal } from './DirectInputModal';



import {
  X,
  Calendar,
  MapPin,
  Users,
  Navigation,
  FileText,
  Video,
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Trash2,
  Star,
  Upload,
  Image as ImageIcon,
  Loader2,
  Edit3,
  Hash,
} from 'lucide-react';



interface GatheringDetailModalProps {
  gathering: Gathering;
  rsvps: GatheringRSVP[];
  reviews: GatheringReview[];
  onClose: () => void;
  onUpdateRsvp: (gatheringId: string, status: RSVPStatus, comment?: string) => Promise<void>;
  onAddReview?: (gatheringId: string, content: string, rating: number, images?: string[]) => Promise<void>;
  onDeleteReview?: (reviewId: string, gatheringId: string) => Promise<void>;
  onDeleteGathering?: (gatheringId: string) => Promise<void>;
  onUpdateGathering?: (gatheringId: string, updates: Partial<Gathering>) => Promise<void>;
}

export const GatheringDetailModal: React.FC<GatheringDetailModalProps> = ({
  gathering,
  rsvps,
  reviews,
  onClose,
  onUpdateRsvp,
  onAddReview,
  onDeleteReview,
  onDeleteGathering,
  onUpdateGathering,
}) => {
  const { currentUser, canRSVP, canWriteReview, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'rsvp' | 'reviews'>('info');

  // 등록된 실제 모임 DB 및 지정주소(locationPresets) DB 조회
  const allGatherings = useLiveQuery(() => db.gatherings.toArray(), []) ?? [];
  const allPresets = useLiveQuery(() => db.locationPresets.toArray(), []) ?? [];

  // 등록된 실제 모임 DB + 지정주소(locationPresets) 기반 집결위치 목록 추출
  const availableLocations = useMemo(() => {
    const map = new Map<string, {
      id: string;
      name: string;
      detail?: string;
      address?: string;
      roadAddress?: string;
      kakaoAddress?: string;
      naverAddress?: string;
      tmapAddress?: string;
      lat: number;
      lng: number;
      position: LocationPosition;
    }>();

    // 1. 지정주소 프리셋 우선 등록
    allPresets.forEach((p) => {
      if (p.name && p.position) {
        const key = `preset_${p.id}`;
        map.set(key, {
          id: p.id,
          name: p.name,
          detail: p.detail,
          address: p.address,
          roadAddress: p.roadAddress,
          kakaoAddress: p.kakaoAddress,
          naverAddress: p.naverAddress,
          tmapAddress: p.tmapAddress,
          lat: p.lat,
          lng: p.lng,
          position: p.position,
        });
      }
    });

    // 2. 모임 DB의 집결위치 보강 등록
    allGatherings.forEach((g) => {
      if (!g.isDeleted && g.locationName && g.position) {
        const key = `${g.locationName}___${g.locationDetail || ''}___${g.position.lat.toFixed(5)}___${g.position.lng.toFixed(5)}`;
        if (!map.has(key)) {
          map.set(key, {
            id: `gat_${g.id}`,
            name: g.locationName,
            detail: g.locationDetail,
            address: g.address,
            roadAddress: g.roadAddress,
            kakaoAddress: g.kakaoAddress,
            naverAddress: g.naverAddress,
            tmapAddress: g.tmapAddress,
            lat: g.position.lat,
            lng: g.position.lng,
            position: g.position,
          });
        }
      }
    });

    return Array.from(map.values());
  }, [allPresets, allGatherings]);


  // 모임 정보 수정 모드 상태 (타임존 왜곡 방지 파서 적용)
  const initialDateTime = useMemo(() => parseLocalDateTime(gathering.dateTime), [gathering.dateTime]);
  const [isEditing, setIsEditing] = useState(false);
  const [editRoundNumber, setEditRoundNumber] = useState<number | undefined>(gathering.roundNumber);
  const [editTitle, setEditTitle] = useState(gathering.title);
  const [editDate, setEditDate] = useState(initialDateTime.date);
  const [editTime, setEditTime] = useState(initialDateTime.time);

  const [editStatus, setEditStatus] = useState<GatheringStatus>(gathering.status);
  const [editLocationId, setEditLocationId] = useState<string>('custom');
  const [editLocationName, setEditLocationName] = useState(gathering.locationName);
  const [editLocationDetail, setEditLocationDetail] = useState(gathering.locationDetail || '');
  const [editAddress, setEditAddress] = useState(gathering.address || '');
  const [editRoadAddress, setEditRoadAddress] = useState(gathering.roadAddress || '');
  const [editKakaoAddress, setEditKakaoAddress] = useState(gathering.kakaoAddress || '');
  const [editNaverAddress, setEditNaverAddress] = useState(gathering.naverAddress || '');
  const [editTmapAddress, setEditTmapAddress] = useState(gathering.tmapAddress || '');
  const [editPosition, setEditPosition] = useState<LocationPosition>(gathering.position);
  const [editCoordError, setEditCoordError] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState(gathering.description);
  const [editVideoUrl, setEditVideoUrl] = useState(gathering.videoUrl || '');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState<string | undefined>(gathering.thumbnailUrl);
  const [showEditDirectModal, setShowEditDirectModal] = useState(false);

  const [isCompressingEditThumb, setIsCompressingEditThumb] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // RSVP 입력 상태
  const [rsvpComment, setRsvpComment] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  // 후기 작성 상태
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImages, setReviewImages] = useState<string[]>([]);
  const [isCompressingImages, setIsCompressingImages] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState<string | null>(null);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isCreator = currentUser && gathering.createdBy === currentUser.uid;
  const canManageGathering = isAdmin || isCreator;

  const gatheringDate = new Date(gathering.dateTime);
  const formattedDate = gatheringDate.toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

  // 수정 모드 회차 변경 (0 포함)
  const handleEditRoundChange = (valStr: string) => {
    if (valStr.trim() === '') {
      setEditRoundNumber(undefined);
      return;
    }
    const cleanStr = valStr.replace(/[^0-9]/g, '');
    if (cleanStr !== '') {
      setEditRoundNumber(parseInt(cleanStr, 10));
    } else {
      setEditRoundNumber(undefined);
    }
  };

  // 수정 모드 집결위치 선택 핸들러
  const handleEditLocationSelect = (locId: string) => {
    setEditLocationId(locId);
    if (locId === 'custom') return;
    if (locId === 'direct') {
      setShowEditDirectModal(true);
      return;
    }

    const found = availableLocations.find((loc) => loc.id === locId);
    if (found) {
      setEditLocationName(found.name);
      setEditLocationDetail(found.detail || '');
      setEditAddress(found.address || '');
      setEditRoadAddress(found.roadAddress || '');
      setEditKakaoAddress(found.kakaoAddress || '');
      setEditNaverAddress(found.naverAddress || '');
      setEditTmapAddress(found.tmapAddress || '');
      setEditPosition(found.position);
      setEditCoordError(null);
    }
  };

  // 수정 모드 썸네일 업로드
  const handleEditThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressingEditThumb(true);
      const result = await compressImageToWebP(file, 1200, 1200, 0.82);
      setEditThumbnailUrl(result.dataUrl);
    } catch (err) {
      alert('대표 이미지 압축에 실패했습니다.');
    } finally {
      setIsCompressingEditThumb(false);
    }
  };

  // 수정 저장 제출
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLocationName.trim() || !editPosition) {
      alert('장소명 및 올바른 GPS 좌표 정보는 필수입니다.');
      return;
    }

    try {
      setIsSavingEdit(true);

      // 제목 자동 결정: 숫자일 때 "제N차 해풍단 바다수영 일정"으로 자동 세팅
      let finalTitle = editTitle.trim();
      if (editRoundNumber === 0) {
        if (!finalTitle) finalTitle = '해풍단 바다수영 번개 모임';
      } else if (editRoundNumber !== undefined && editRoundNumber > 0) {
        finalTitle = `제${editRoundNumber}차 해풍단 바다수영 일정`;
      } else {
        if (!finalTitle) finalTitle = gathering.title;
      }

      const isoDateTime = formatToKoreanIso(editDate, editTime);

      if (onUpdateGathering) {
        await onUpdateGathering(gathering.id, {
          roundNumber: editRoundNumber,
          title: finalTitle,
          status: editStatus,
          dateTime: isoDateTime,
          locationName: editLocationName.trim(),
          locationDetail: editLocationDetail.trim() || undefined,
          address: editAddress.trim() || undefined,
          roadAddress: editRoadAddress.trim() || undefined,
          kakaoAddress: editKakaoAddress.trim() || undefined,
          naverAddress: editNaverAddress.trim() || undefined,
          tmapAddress: editTmapAddress.trim() || undefined,
          position: editPosition,
          description: editDescription.trim(),
          videoUrl: editVideoUrl.trim() || undefined,
          videoUrls: editVideoUrl.trim() ? [editVideoUrl.trim()] : [],
          thumbnailUrl: editThumbnailUrl,
        });
      }
      setIsEditing(false);
    } catch (err) {
      alert('모임 정보 수정 중 오류가 발생했습니다.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  // RSVP 집계
  const attendingList = rsvps.filter((r) => r.status === 'ATTENDING');
  const absentList = rsvps.filter((r) => r.status === 'ABSENT');
  const undecidedList = rsvps.filter((r) => r.status === 'UNDECIDED');

  const myRsvp = currentUser ? rsvps.find((r) => r.userId === currentUser.uid) : null;

  // 전체 모임 관련 사진들 모음 (대표 이미지 + 모든 후기 사진)
  const allGatheringPhotos: string[] = [
    ...(gathering.thumbnailUrl ? [gathering.thumbnailUrl] : []),
    ...reviews.flatMap((r) => r.images || []),
  ];

  // 길찾기 및 위치 안내 (1. 해당 지도 주소 -> 2. 대표 주소 -> 3. GPS 정보)
  const locationInput = useMemo(() => {
    // 1. 프리셋 DB에서 매칭되는 지정주소 찾기 (장소명 또는 좌표 기준)
    const matchedPreset = allPresets.find(
      (p) =>
        (p.name && gathering.locationName && p.name.trim() === gathering.locationName.trim()) ||
        (Math.abs(p.lat - gathering.position.lat) < 0.0005 && Math.abs(p.lng - gathering.position.lng) < 0.0005)
    );

    return {
      lat: gathering.position.lat,
      lng: gathering.position.lng,
      locationName: gathering.locationName,
      locationDetail: gathering.locationDetail || matchedPreset?.detail,
      address: gathering.address || matchedPreset?.address,
      roadAddress: gathering.roadAddress || matchedPreset?.roadAddress || matchedPreset?.address,
      jibunAddress: gathering.jibunAddress || matchedPreset?.jibunAddress,
      kakaoAddress: gathering.kakaoAddress || matchedPreset?.kakaoAddress,
      naverAddress: gathering.naverAddress || matchedPreset?.naverAddress,
      tmapAddress: gathering.tmapAddress || matchedPreset?.tmapAddress,
      mapAddress: gathering.mapAddress || matchedPreset?.mapAddress,
    };
  }, [gathering, allPresets]);

  const isMobileDevice = useMemo(
    () => /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
    []
  );

  const generalLocationGuide = useMemo(() => resolveLocationGuide(locationInput), [locationInput]);
  const kakaoUrl = useMemo(() => getKakaoMapUrl(locationInput), [locationInput]);
  const naverUrl = useMemo(() => getNaverMapUrl(locationInput), [locationInput]);

  const getStatusBadge = (status: Gathering['status']) => {
    switch (status) {
      case 'PROPOSED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">💡 제안됨</span>;
      case 'RECRUITING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">🔥 모집중</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">✨ 일정확정</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">🏁 모임종료</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">❌ 취소됨</span>;
    }
  };

  const handleRsvpSubmit = async (status: RSVPStatus) => {
    if (!currentUser || !canRSVP) {
      alert('참석 투표는 정회원 또는 관리자만 참여할 수 있습니다.');
      return;
    }

    try {
      setIsSubmittingRsvp(true);
      await onUpdateRsvp(gathering.id, status, rsvpComment.trim() || undefined);
      setRsvpComment('');
    } catch (e) {
      alert('참석 여부 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // 다중 이미지 WebP 압축 처리
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    if (reviewImages.length + fileList.length > 5) {
      alert('사진은 최대 5장까지만 등록 가능합니다.');
      return;
    }

    setIsCompressingImages(true);
    const newCompressedList: string[] = [];

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      setCompressionProgress(`이미지 ${i + 1}/${fileList.length} 압축 중...`);
      try {
        const result = await compressImageToWebP(file, 1200, 1200, 0.8);
        newCompressedList.push(result.dataUrl);
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }

    setReviewImages((prev) => [...prev, ...newCompressedList]);
    setIsCompressingImages(false);
    setCompressionProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 후기 등록
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !canWriteReview) {
      alert('후기 작성은 정회원 또는 관리자만 가능합니다.');
      return;
    }

    if (!reviewContent.trim()) {
      alert('후기 내용을 입력해주세요.');
      return;
    }

    if (!onAddReview) return;

    try {
      setIsSubmittingReview(true);
      await onAddReview(gathering.id, reviewContent.trim(), reviewRating, reviewImages);
      setReviewContent('');
      setReviewImages([]);
      setReviewRating(5);
    } catch (err) {
      alert('후기 등록 중 오류가 발생했습니다.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <>
      {/* 수정 모드 직접 입력 모달 */}
      {showEditDirectModal && (
        <DirectInputModal
          onConfirm={(detail, position) => {
            setEditLocationDetail(detail);
            setEditPosition(position);
            setEditCoordError(null);
            setShowEditDirectModal(false);
          }}
          onClose={() => {
            setShowEditDirectModal(false);
            setEditLocationId('custom');
          }}
        />
      )}

    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100">
        
        {/* 1. 상단 심플 헤더 (대표 배너 이미지 영역 삭제) */}
        <div className="p-4 sm:p-6 pb-3 border-b border-slate-800 bg-slate-950/80 flex items-start justify-between gap-3 shrink-0">
          <div className="flex flex-col gap-1.5 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {gathering.roundNumber !== undefined && (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-ocean-600 text-white shadow-md">
                  {gathering.roundNumber === 0 ? '번개' : `제 ${gathering.roundNumber}차`}
                </span>
              )}
              {getStatusBadge(gathering.status)}
              <span className="text-xs text-slate-400">
                개설: <strong className="text-slate-200">{gathering.createdByName}</strong>
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug truncate">
              {gathering.title}
            </h2>
          </div>

          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition shrink-0"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. 탭 네비게이션 */}
        {!isEditing && (
          <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 sm:px-6 shrink-0">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'info'
                  ? 'border-ocean-500 text-ocean-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" /> 모임 정보
            </button>
            <button
              onClick={() => setActiveTab('rsvp')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'rsvp'
                  ? 'border-ocean-500 text-ocean-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              참석 투표 ({attendingList.length}명)
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === 'reviews'
                  ? 'border-ocean-500 text-ocean-300'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              후기 & 갤러리 ({reviews.length})
            </button>
          </div>
        )}

        {/* 3. 모달 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          
          {/* ========================================================= */}
          {/* 수정 모드 폼 (isEditing === true) — 새 레이아웃 (한 줄 배치) */}
          {/* ========================================================= */}
          {isEditing ? (
            <form onSubmit={handleSaveEdit} className="flex flex-col">
              {/* 수정 모드 상단 바 */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 bg-slate-950/60 shrink-0">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-ocean-400" />
                  <span>모임 정보 수정</span>
                </h3>
                <button type="button" onClick={() => setIsEditing(false)} className="text-xs text-slate-400 hover:text-slate-200">
                  취소
                </button>
              </div>

              <div className="divide-y divide-slate-800/60 overflow-y-auto flex-1 custom-scrollbar">

                {/* ── 회차 ── */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-ocean-400" />
                    회차
                  </label>
                  <input
                    type="number" min="0" step="1" placeholder="예: 14"
                    value={editRoundNumber !== undefined ? editRoundNumber : ''}
                    onChange={(e) => handleEditRoundChange(e.target.value)}
                    className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-ocean-500 text-center"
                  />
                  {editRoundNumber === 0 && (
                    <input
                      type="text"
                      placeholder="모임 이름 직접 입력"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500 animate-fadeIn"
                    />
                  )}
                </div>

                {/* ── 일시 ── */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-ocean-400" />
                    일시
                  </label>
                  <div className="flex-1 min-w-0">
                    <CustomDateTimePicker
                      date={editDate}
                      time={editTime}
                      onChangeDate={setEditDate}
                      onChangeTime={setEditTime}
                      showLabel={false}
                    />
                  </div>
                </div>

                {/* ── 상태 ── */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-ocean-400" />
                    상태
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as GatheringStatus)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500 font-semibold"
                  >
                    <option value="CONFIRMED">✨ 확정</option>
                    <option value="CANCELLED">❌ 취소</option>
                    <option value="RECRUITING">🔥 모집중</option>
                    <option value="COMPLETED">🏁 모임종료</option>
                    <option value="PROPOSED">💡 제안됨</option>
                  </select>
                </div>

                {/* ── 장소명 ── */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-ocean-400" />
                    장소명 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text" required
                    value={editLocationName}
                    onChange={(e) => setEditLocationName(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                  />
                </div>

                {/* ── 상세 집결위치 (select + 직접입력 모달) ── */}
                <div className="flex items-start gap-3 px-5 py-3.5">
                  <label className="text-xs font-bold text-slate-400 w-24 shrink-0 pt-1.5 flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                    상세 집결위치
                  </label>
                  <div className="flex-1 space-y-2">
                    <select
                      value={editLocationId}
                      onChange={(e) => handleEditLocationSelect(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-ocean-500 font-medium"
                    >
                      <option value="custom">— 선택하세요 / 직접 입력 —</option>
                      <option value="direct">✍️ 직접 입력하기...</option>
                      {availableLocations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          📍 {loc.name}{loc.detail ? ` (${loc.detail})` : ''} · [{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}]
                        </option>
                      ))}
                    </select>
                    {/* 현재 입력된 상세위치 + 좌표 표시 */}
                    {editPosition && !editCoordError && (
                      <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono px-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {editLocationDetail ? `${editLocationDetail} · ` : ''}
                          {editPosition.lat.toFixed(5)}, {editPosition.lng.toFixed(5)}
                        </span>
                      </div>
                    )}
                    {editCoordError && (
                      <p className="text-[10px] text-rose-400 px-1">{editCoordError}</p>
                    )}
                  </div>
                </div>

                {/* ── YouTube 링크 ── */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5 text-red-400" />
                    YouTube
                  </label>
                  <input
                    type="url"
                    value={editVideoUrl}
                    onChange={(e) => setEditVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                  />
                </div>

                {/* ── 대표 이미지 ── */}
                <div className="flex items-center gap-3 px-5 py-3.5">
                  <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                    대표 이미지
                  </label>
                  <div className="flex items-center gap-2.5 flex-1">
                    <input type="file" ref={editFileInputRef} onChange={handleEditThumbnailUpload} accept="image/*" className="hidden" id="edit-thumbnail-upload" />
                    <label
                      htmlFor="edit-thumbnail-upload"
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1.5 transition"
                    >
                      <Upload className="w-3.5 h-3.5 text-ocean-400" />
                      <span>이미지 변경</span>
                    </label>
                    {isCompressingEditThumb && <span className="text-xs text-ocean-300 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 변환 중...</span>}
                    {editThumbnailUrl && (
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-emerald-500/50 shrink-0">
                        <img src={editThumbnailUrl} alt="대표 썸네일" className="w-full h-full object-cover" />
                        <button type="button" onClick={() => setEditThumbnailUrl(undefined)} className="absolute top-0 right-0 p-0.5 bg-black/70 text-white">
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 상세 설명 ── */}
                <div className="flex items-start gap-3 px-5 py-3.5">
                  <label className="text-xs font-bold text-slate-400 w-24 shrink-0 pt-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-ocean-400" />
                    상세 설명
                  </label>
                  <textarea
                    rows={4}
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500 resize-none"
                  />
                </div>
              </div>

              {/* 저장/취소 버튼 */}
              <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button type="button" onClick={() => setIsEditing(false)} className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition">취소</button>
                <button
                  type="submit"
                  disabled={isSavingEdit || isCompressingEditThumb || !editLocationName.trim() || !editPosition}
                  className="px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold shadow-lg shadow-ocean-600/30 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isSavingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>수정 내용 저장</span>
                </button>
              </div>


            </form>
          ) : (
            <>
              {/* TAB 1: 모임 상세 정보 */}
              {activeTab === 'info' && (
                <div className="space-y-6">
                  
                  {/* 일시 & 장소 카드 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-ocean-500/20 text-ocean-400 shrink-0">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[11px] text-slate-400 font-semibold block">일시</span>
                        <span className="text-xs font-bold text-white">{formattedDate}</span>
                      </div>
                    </div>

                    <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-start gap-3">
                      <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="text-[11px] text-slate-400 font-semibold">장소</span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {generalLocationGuide.badgeLabel}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-white truncate block">
                          {gathering.locationName}
                        </span>
                        {/* 1. 지도의 주소 / 2. 대표 주소 / 3. GPS 정보 출력 */}
                        <span className="text-[10px] text-slate-300 block truncate font-medium mt-0.5">
                          📍 {generalLocationGuide.displayAddress}
                        </span>
                        {gathering.locationDetail && gathering.locationDetail !== generalLocationGuide.displayAddress && (
                          <span className="text-[10px] text-slate-400 block truncate">
                            상세: {gathering.locationDetail}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 내비게이션 3사 길찾기 퀵 버튼 */}
                  <div className="p-3.5 rounded-2xl glass-card border border-slate-800 space-y-2">
                    <span className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                      <Navigation className="w-3.5 h-3.5 text-ocean-400" />
                      내비게이션 길찾기 바로가기
                    </span>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={kakaoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <span>카카오맵</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                      <a
                        href={naverUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="py-2 px-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition"
                      >
                        <span>네이버지도</span>
                        <ExternalLink className="w-3 h-3 opacity-70" />
                      </a>
                      {/* 티맵 (모바일 전용: 안드로이드 Intent / iOS Scheme 실행 / PC 비활성화) */}
                      {isMobileDevice ? (
                        <button
                          type="button"
                          onClick={() => openTMap(locationInput)}
                          className="py-2 px-2 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-semibold flex items-center justify-center gap-1 transition cursor-pointer"
                        >
                          <span>티맵(T map)</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled
                          className="py-2 px-2 rounded-xl bg-slate-800/40 text-slate-500 border border-slate-700/50 text-xs font-medium flex items-center justify-center gap-1 cursor-not-allowed opacity-50 select-none pointer-events-none"
                          title="티맵 길찾기는 스마트폰(모바일 기기) 전용입니다."
                        >
                          <span>티맵 (모바일용)</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* YouTube / Shorts 영상 임베드 플레이어 */}
                  {gathering.videoUrl && (
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Video className="w-4 h-4 text-red-400" />
                        관련 활동 영상 (YouTube)
                      </h4>
                      <VideoPlayerEmbed url={gathering.videoUrl} title={gathering.title} />
                    </div>
                  )}

                  {/* 모임 상세 설명 */}
                  <div className="p-4 rounded-2xl glass-card border border-slate-800 space-y-2">
                    <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-ocean-400" />
                      모임 상세 안내
                    </h4>
                    <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {gathering.description}
                    </p>
                  </div>

                  {/* 활동 사진 갤러리 프리뷰 */}
                  {allGatheringPhotos.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                          <ImageIcon className="w-4 h-4 text-sky-400" />
                          활동 사진 갤러리 ({allGatheringPhotos.length}장)
                        </h4>
                        <button
                          onClick={() => setActiveTab('reviews')}
                          className="text-[11px] text-ocean-400 hover:text-ocean-300 font-semibold"
                        >
                          전체보기 / 후기 작성 →
                        </button>
                      </div>
                      <MediaGallery images={allGatheringPhotos} title={gathering.title} columns={3} />
                    </div>
                  )}

                  {/* 수정 및 삭제 버튼 (작성자 또는 관리자 전용) */}
                  {canManageGathering && (
                    <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setIsEditing(true)}
                        className="px-3.5 py-2 rounded-xl bg-ocean-600/20 hover:bg-ocean-600/30 text-ocean-300 border border-ocean-500/40 text-xs font-semibold flex items-center gap-1.5 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>수정</span>
                      </button>

                      {onDeleteGathering && (
                        <button
                          onClick={async () => {
                            if (confirm('정말로 이 모임을 삭제하시겠습니까?')) {
                              await onDeleteGathering(gathering.id);
                              onClose();
                            }
                          }}
                          className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>삭제</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: RSVP 참여 응답 패널 */}
              {activeTab === 'rsvp' && (
                <div className="space-y-6">
                  
                  {/* 내 응답 상태 컨트롤 */}
                  <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-700/80 bg-slate-900/60 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-ocean-400" />
                        나의 참석 여부 선택
                      </h3>
                      {myRsvp && (
                        <span className="text-[11px] text-ocean-300 font-medium">
                          현재: <strong>{myRsvp.status === 'ATTENDING' ? '참석' : myRsvp.status === 'ABSENT' ? '불참' : '미정'}</strong>
                        </span>
                      )}
                    </div>

                    {!currentUser ? (
                      <div className="p-3 rounded-xl bg-slate-800/60 text-xs text-slate-400 text-center">
                        로그인 후 참석 투표에 참여할 수 있습니다.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            disabled={isSubmittingRsvp}
                            onClick={() => handleRsvpSubmit('ATTENDING')}
                            className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              myRsvp?.status === 'ATTENDING'
                                ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40 shadow-lg'
                                : 'bg-slate-800/80 text-emerald-400 border-slate-700 hover:bg-emerald-950/40'
                            }`}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            <span>참석</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmittingRsvp}
                            onClick={() => handleRsvpSubmit('ABSENT')}
                            className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              myRsvp?.status === 'ABSENT'
                                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/40 shadow-lg'
                                : 'bg-slate-800/80 text-rose-400 border-slate-700 hover:bg-rose-950/40'
                            }`}
                          >
                            <XCircle className="w-4 h-4" />
                            <span>불참</span>
                          </button>

                          <button
                            type="button"
                            disabled={isSubmittingRsvp}
                            onClick={() => handleRsvpSubmit('UNDECIDED')}
                            className={`py-2.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                              myRsvp?.status === 'UNDECIDED'
                                ? 'bg-slate-600 text-white border-slate-400 ring-2 ring-slate-400/40 shadow-lg'
                                : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-800'
                            }`}
                          >
                            <HelpCircle className="w-4 h-4" />
                            <span>미정</span>
                          </button>
                        </div>

                        {/* 한줄 코멘트 */}
                        <div className="space-y-1.5">
                          <input
                            type="text"
                            placeholder="참석 관련 한줄 메모 (예: 10분 늦을 것 같습니다)"
                            value={rsvpComment}
                            onChange={(e) => setRsvpComment(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* 참석자 명단 리스트 */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-200 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        참석 확정 인원 ({attendingList.length}명)
                      </span>
                    </h3>

                    {attendingList.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {attendingList.map((rsvp) => (
                          <div
                            key={rsvp.id}
                            className="p-2.5 rounded-xl glass-card border border-slate-800 flex items-center gap-2.5"
                          >
                            <div className="w-8 h-8 rounded-full bg-ocean-900/60 border border-ocean-500/30 flex items-center justify-center text-ocean-300 text-xs font-bold overflow-hidden shrink-0">
                              {rsvp.userAvatar ? (
                                <img src={rsvp.userAvatar} alt={rsvp.userName} className="w-full h-full object-cover" />
                              ) : (
                                rsvp.userName.substring(0, 2)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <span className="text-xs font-bold text-white block truncate">
                                {rsvp.userName}
                              </span>
                              {rsvp.comment && (
                                <span className="text-[11px] text-slate-400 block truncate">
                                  💬 {rsvp.comment}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-500 glass-card rounded-2xl border border-slate-800">
                        아직 참석 확정 인원이 없습니다. 첫 번째로 참석해 보세요!
                      </div>
                    )}

                    {/* 불참 및 미정 접이식 목록 */}
                    {(absentList.length > 0 || undecidedList.length > 0) && (
                      <div className="pt-2 text-xs text-slate-400 flex gap-4">
                        <span>불참: {absentList.length}명</span>
                        <span>미정: {undecidedList.length}명</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: 후기 & 갤러리 패널 */}
              {activeTab === 'reviews' && (
                <div className="space-y-6">
                  
                  {/* 후기 작성 폼 */}
                  {currentUser && canWriteReview ? (
                    <form
                      onSubmit={handleReviewSubmit}
                      className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-700/80 bg-slate-900/60 space-y-3.5"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                          <MessageSquare className="w-4 h-4 text-ocean-400" />
                          모임 후기 & 사진 등록
                        </h3>

                        {/* 별점 선택 */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setReviewRating(star)}
                              className="p-0.5 text-amber-400 hover:scale-110 transition"
                            >
                              <Star
                                className={`w-4 h-4 ${
                                  star <= reviewRating ? 'fill-amber-400' : 'text-slate-600'
                                }`}
                              />
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 후기 본문 입력 */}
                      <textarea
                        rows={3}
                        required
                        placeholder="모임 활동 후기와 생생한 소감을 남겨주세요!"
                        value={reviewContent}
                        onChange={(e) => setReviewContent(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                      />

                      {/* 사진 첨부 (WebP 자동 압축) */}
                      <div className="flex flex-wrap items-center gap-2">
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageFileChange}
                          multiple
                          accept="image/*"
                          className="hidden"
                          id="review-image-upload"
                        />
                        <label
                          htmlFor="review-image-upload"
                          className="px-3 py-1.5 rounded-xl glass-card border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1.5 transition"
                        >
                          <Upload className="w-3.5 h-3.5 text-ocean-400" />
                          <span>사진 첨부 (최대 5장)</span>
                        </label>

                        {isCompressingImages && (
                          <div className="flex items-center gap-1 text-xs text-ocean-300">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>{compressionProgress || 'WebP 변환 중...'}</span>
                          </div>
                        )}

                        {/* 첨부된 사진 썸네일들 */}
                        {reviewImages.map((img, idx) => (
                          <div key={idx} className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-700">
                            <img src={img} alt="첨부 사진" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReviewImages(reviewImages.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* 등록 버튼 */}
                      <div className="flex justify-end pt-1">
                        <button
                          type="submit"
                          disabled={isSubmittingReview || isCompressingImages || !reviewContent.trim()}
                          className="px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white font-bold text-xs shadow-lg shadow-ocean-600/30 transition disabled:opacity-50"
                        >
                          후기 등록하기
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="p-3.5 rounded-2xl glass-card border border-slate-800 text-xs text-slate-400 text-center">
                      정회원 이상 로그인 시 후기를 작성할 수 있습니다.
                    </div>
                  )}

                  {/* 등록된 후기 목록 */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-200">
                      등록된 후기 ({reviews.length}개)
                    </h3>

                    {reviews.length > 0 ? (
                      reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-4 rounded-2xl glass-card border border-slate-800 space-y-2.5"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-ocean-950 border border-ocean-800 flex items-center justify-center text-xs font-bold text-ocean-300 overflow-hidden">
                                {rev.userAvatar ? (
                                  <img src={rev.userAvatar} alt={rev.userName} className="w-full h-full object-cover" />
                                ) : (
                                  rev.userName.substring(0, 2)
                                )}
                              </div>
                              <div>
                                <span className="text-xs font-bold text-white block">
                                  {rev.userName}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  {new Date(rev.createdAt).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* 별점 표시 */}
                              <div className="flex items-center gap-0.5 text-amber-400">
                                {Array.from({ length: rev.rating }).map((_, i) => (
                                  <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                                ))}
                              </div>

                              {/* 후기 삭제 버튼 */}
                              {(isAdmin || (currentUser && rev.userId === currentUser.uid)) && onDeleteReview && (
                                <button
                                  onClick={async () => {
                                    if (confirm('이 후기를 삭제하시겠습니까?')) {
                                      await onDeleteReview(rev.id, gathering.id);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-400 transition"
                                  title="후기 삭제"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
                            {rev.content}
                          </p>

                          {/* 후기에 첨부된 사진 갤러리 */}
                          {rev.images && rev.images.length > 0 && (
                            <MediaGallery images={rev.images} title={`${rev.userName}님의 후기 사진`} columns={4} />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-10 text-center text-xs text-slate-500 glass-card rounded-2xl border border-slate-800">
                        아직 등록된 후기가 없습니다. 첫 번째 후기를 남겨보세요!
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
    </>
  );
};
