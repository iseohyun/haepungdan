import React, { useState, useRef } from 'react';
import { Gathering, GatheringRSVP, GatheringReview, RSVPStatus, GatheringStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { getKakaoMapUrl, getNaverMapUrl, getTMapUrl } from '../utils/coordinates';
import { compressImageToWebP } from '../utils/imageCompressor';
import { VideoPlayerEmbed } from './media/VideoPlayerEmbed';
import { MediaGallery } from './media/MediaGallery';
import {
  X,
  Calendar,
  MapPin,
  Users,
  Navigation,
  DollarSign,
  FileText,
  Video,
  MessageSquare,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  Sparkles,
  Trash2,
  Star,
  Upload,
  Image as ImageIcon,
  Loader2,
  ShieldAlert,
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
  onUpdateStatus?: (gatheringId: string, newStatus: GatheringStatus) => Promise<void>;
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
  onUpdateStatus,
}) => {
  const { currentUser, canRSVP, canWriteReview, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'rsvp' | 'reviews'>('info');

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

  // 길찾기 링크들
  const kakaoUrl = getKakaoMapUrl(gathering.position.lat, gathering.position.lng, gathering.locationName);
  const naverUrl = getNaverMapUrl(gathering.position.lat, gathering.position.lng, gathering.locationName);
  const tmapUrl = getTMapUrl(gathering.position.lat, gathering.position.lng, gathering.locationName);

  // RSVP 투표 핸들러
  const handleRsvpClick = async (status: RSVPStatus) => {
    if (!canRSVP) {
      alert('정회원(Member) 이상만 참여 응답이 가능합니다. (좌측 하단에서 [정회원]으로 전환해보세요)');
      return;
    }
    try {
      setIsSubmittingRsvp(true);
      await onUpdateRsvp(gathering.id, status, rsvpComment.trim() || myRsvp?.comment || '');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // 사진 업로드 및 WebP 고속 압축 핸들러
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsCompressingImages(true);
    const newImages: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setCompressionProgress(`${i + 1}/${files.length} 사진 WebP 고속 압축 중... (${file.name})`);

        const result = await compressImageToWebP(file, 1600, 1600, 0.82);
        newImages.push(result.dataUrl);
      }
      setReviewImages((prev) => [...prev, ...newImages]);
    } catch (err) {
      console.error('Image compression failed:', err);
      alert('사진 압축 중 오류가 발생했습니다.');
    } finally {
      setIsCompressingImages(false);
      setCompressionProgress(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // 후기 제출 핸들러
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim() || !onAddReview) return;
    if (!canWriteReview) {
      alert('정회원(Member) 이상만 후기 작성이 가능합니다. (좌측 하단에서 [정회원]으로 전환해보세요)');
      return;
    }

    try {
      setIsSubmittingReview(true);
      await onAddReview(gathering.id, reviewContent.trim(), reviewRating, reviewImages);
      setReviewContent('');
      setReviewRating(5);
      setReviewImages([]);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStatusBadge = (status: GatheringStatus) => {
    switch (status) {
      case 'PROPOSED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">💡 제안됨</span>;
      case 'RECRUITING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse">🔥 모집중</span>;
      case 'CONFIRMED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40">✨ 일정확정</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/20 text-slate-300 border border-slate-500/40">🎉 모임완료</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">❌ 취소됨</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn select-none">
      <div className="relative w-full max-w-2xl max-h-[92vh] glass-panel rounded-3xl shadow-2xl border border-slate-700/80 flex flex-col overflow-hidden text-slate-100 animate-scaleIn">
        
        {/* 상단 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-900/60 shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {getStatusBadge(gathering.status)}
              <span className="text-xs text-slate-400 font-mono">ID: {gathering.id.slice(0, 10)}</span>
              {gathering.maxParticipants && (
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" />
                  정원 {gathering.maxParticipants}명
                </span>
              )}
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-white leading-snug break-words">
              {gathering.title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex items-center px-4 sm:px-6 border-b border-slate-800 bg-slate-950/40 text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-ocean-400 text-ocean-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>모임 정보</span>
          </button>

          <button
            onClick={() => setActiveTab('rsvp')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'rsvp'
                ? 'border-ocean-400 text-ocean-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>참여 응답 (RSVP)</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
              {attendingList.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-3 sm:px-4 border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-ocean-400 text-ocean-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>후기 & 갤러리</span>
            <span className="px-1.5 py-0.2 rounded-full bg-sky-500/20 text-sky-300 text-[10px]">
              {reviews.length}
            </span>
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          
          {/* TAB 1: 모임 상세 정보 */}
          {activeTab === 'info' && (
            <div className="space-y-6">
              
              {/* 관리자/작성자 전용 상태 전이 툴바 */}
              {canManageGathering && onUpdateStatus && (
                <div className="p-3.5 rounded-2xl glass-card border border-ocean-500/30 bg-ocean-950/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ocean-400" />
                    <span className="text-xs font-bold text-ocean-200">
                      {isAdmin ? '관리자 모임 제어' : '작성자 모임 제어'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                    {(['PROPOSED', 'RECRUITING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as GatheringStatus[]).map(
                      (st) => (
                        <button
                          key={st}
                          onClick={() => onUpdateStatus(gathering.id, st)}
                          disabled={gathering.status === st}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold transition ${
                            gathering.status === st
                              ? 'bg-ocean-500 text-white shadow-md'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {st === 'PROPOSED'
                            ? '제안'
                            : st === 'RECRUITING'
                            ? '모집'
                            : st === 'CONFIRMED'
                            ? '확정'
                            : st === 'COMPLETED'
                            ? '완료'
                            : '취소'}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* 핵심 메타데이터 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl glass-card border border-slate-800/80 flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-ocean-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">일시</span>
                    <strong className="text-xs text-slate-100">{formattedDate}</strong>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl glass-card border border-slate-800/80 flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-ocean-400 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[11px] text-slate-400 font-medium block">모임 장소</span>
                    <strong className="text-xs text-slate-100 truncate block">{gathering.locationName}</strong>
                    <span className="text-[10px] text-slate-500 font-mono">
                      ({gathering.position.lat.toFixed(4)}, {gathering.position.lng.toFixed(4)})
                    </span>
                  </div>
                </div>

                {gathering.fee !== undefined && (
                  <div className="p-3.5 rounded-2xl glass-card border border-slate-800/80 flex items-start gap-3">
                    <DollarSign className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    <div>
                      <span className="text-[11px] text-slate-400 font-medium block">참가 회비</span>
                      <strong className="text-xs text-slate-100">
                        {gathering.fee === 0 ? '무료' : `${gathering.fee.toLocaleString()}원`}
                      </strong>
                    </div>
                  </div>
                )}

                <div className="p-3.5 rounded-2xl glass-card border border-slate-800/80 flex items-start gap-3">
                  <Clock className="w-4 h-4 text-sky-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-[11px] text-slate-400 font-medium block">개설자</span>
                    <strong className="text-xs text-slate-100">{gathering.createdByName}</strong>
                  </div>
                </div>
              </div>

              {/* 내비게이션 바로가기 버튼군 */}
              <div className="p-4 rounded-2xl glass-card border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
                  <Navigation className="w-4 h-4 text-ocean-400" />
                  <span>내비게이션 길찾기</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <a
                    href={kakaoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                  >
                    <span>카카오맵</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={naverUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-emerald-400/10 hover:bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                  >
                    <span>네이버지도</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href={tmapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-rose-400/10 hover:bg-rose-400/20 text-rose-300 border border-rose-400/30 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                  >
                    <span>T-Map</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 모임 제안서 본문 */}
              <div className="p-4 rounded-2xl glass-card border border-slate-800/80 space-y-2">
                <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-ocean-400" />
                  모임 안내 및 준비물
                </h3>
                <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {gathering.description}
                </div>
              </div>

              {/* 동영상 임베드 (링크가 등록되어 있을 경우) */}
              {gathering.videoUrl && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-red-400" />
                    관련 영상
                  </h3>
                  <VideoPlayerEmbed url={gathering.videoUrl} title={gathering.title} />
                </div>
              )}

              {/* 모임 갤러리 썸네일 */}
              {allGatheringPhotos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-sky-400" />
                      모임 사진 ({allGatheringPhotos.length}장)
                    </h3>
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

              {/* 삭제 버튼 (작성자 또는 관리자 전용) */}
              {canManageGathering && onDeleteGathering && (
                <div className="pt-4 border-t border-slate-800 flex justify-end">
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
                    <span>모임 삭제하기</span>
                  </button>
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
                    <span className="text-[11px] text-ocean-300 font-semibold">
                      현재: {myRsvp.status === 'ATTENDING' ? '참석' : myRsvp.status === 'ABSENT' ? '불참' : '미정'}
                    </span>
                  )}
                </div>

                {!canRSVP ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>정회원(Member) 이상만 참여 투표를 할 수 있습니다. (비로그인/게스트 상태)</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 sm:gap-3">
                      <button
                        onClick={() => handleRsvpClick('ATTENDING')}
                        disabled={isSubmittingRsvp}
                        className={`py-3 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                          myRsvp?.status === 'ATTENDING'
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/30 ring-2 ring-emerald-400/50'
                            : 'glass-card border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        <span>참석 ({attendingList.length})</span>
                      </button>

                      <button
                        onClick={() => handleRsvpClick('ABSENT')}
                        disabled={isSubmittingRsvp}
                        className={`py-3 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                          myRsvp?.status === 'ABSENT'
                            ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30 ring-2 ring-rose-400/50'
                            : 'glass-card border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <XCircle className="w-5 h-5 text-rose-400" />
                        <span>불참 ({absentList.length})</span>
                      </button>

                      <button
                        onClick={() => handleRsvpClick('UNDECIDED')}
                        disabled={isSubmittingRsvp}
                        className={`py-3 px-2 rounded-2xl border font-bold text-xs flex flex-col items-center gap-1.5 transition ${
                          myRsvp?.status === 'UNDECIDED'
                            ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/30 ring-2 ring-amber-400/50'
                            : 'glass-card border-slate-700 text-slate-300 hover:bg-slate-800'
                        }`}
                      >
                        <HelpCircle className="w-5 h-5 text-amber-400" />
                        <span>미정 ({undecidedList.length})</span>
                      </button>
                    </div>

                    {/* 코멘트 입력창 */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="한 줄 코멘트 (예: 차 가져갑니다, 장비 챙길게요)"
                        value={rsvpComment}
                        onChange={(e) => setRsvpComment(e.target.value)}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                      />
                      <button
                        onClick={() => handleRsvpClick(myRsvp?.status || 'ATTENDING')}
                        disabled={isSubmittingRsvp || !rsvpComment.trim()}
                        className="px-3 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-semibold disabled:opacity-50 transition"
                      >
                        저장
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* 실시간 참석자 명단 */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    참석자 명단 ({attendingList.length}명)
                  </h4>
                  {attendingList.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {attendingList.map((r) => (
                        <div key={r.id} className="p-2.5 rounded-xl glass-card border border-emerald-500/20 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                              {r.userName[0]}
                            </div>
                            <span className="text-xs font-semibold text-slate-200">{r.userName}</span>
                          </div>
                          {r.comment && (
                            <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                              "{r.comment}"
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-2">아직 참석자가 없습니다.</p>
                  )}
                </div>

                {/* 불참 및 미정 목록 */}
                {absentList.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <XCircle className="w-4 h-4" />
                      불참 ({absentList.length}명)
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {absentList.map((r) => (
                        <span key={r.id} className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
                          {r.userName} {r.comment ? `(${r.comment})` : ''}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 후기 작성 & 사진 갤러리 */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              
              {/* 후기 작성 폼 */}
              <div className="p-4 sm:p-5 rounded-2xl glass-card border border-slate-700/80 bg-slate-900/60 space-y-3">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Star className="w-4 h-4 text-amber-400" />
                  모임 후기 & 사진 등록
                </h3>

                {!canWriteReview ? (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    <span>정회원(Member) 이상만 후기를 작성할 수 있습니다.</span>
                  </div>
                ) : (
                  <form onSubmit={handleReviewSubmit} className="space-y-3">
                    {/* 별점 선택 */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">평점:</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => setReviewRating(star)}
                            className="p-1 text-amber-400 hover:scale-125 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 후기 텍스트 입력창 */}
                    <textarea
                      rows={3}
                      placeholder="모임 후기나 소감을 작성해주세요!"
                      value={reviewContent}
                      onChange={(e) => setReviewContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                    />

                    {/* 첨부된 사진 미리보기 */}
                    {reviewImages.length > 0 && (
                      <div className="flex items-center gap-2 overflow-x-auto py-1">
                        {reviewImages.map((img, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-700">
                            <img src={img} alt="첨부 사진" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setReviewImages((prev) => prev.filter((_, i) => i !== idx))}
                              className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 압축 진행 상태 알림 */}
                    {compressionProgress && (
                      <div className="flex items-center gap-2 text-xs text-ocean-300 animate-pulse">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{compressionProgress}</span>
                      </div>
                    )}

                    {/* 파일 업로드 버튼 및 등록 버튼 */}
                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handlePhotoUpload}
                          multiple
                          accept="image/*"
                          className="hidden"
                          id="photo-upload-input"
                        />
                        <label
                          htmlFor="photo-upload-input"
                          className={`px-3 py-2 rounded-xl glass-card border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1.5 transition ${
                            isCompressingImages ? 'opacity-50 pointer-events-none' : ''
                          }`}
                        >
                          <Upload className="w-3.5 h-3.5 text-ocean-400" />
                          <span>사진 추가 (WebP 자동 압축)</span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingReview || !reviewContent.trim() || isCompressingImages}
                        className="px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold disabled:opacity-50 transition shadow-lg"
                      >
                        {isSubmittingReview ? '등록 중...' : '후기 등록'}
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 등록된 후기 목록 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-300">등록된 후기 ({reviews.length}개)</h4>
                {reviews.length > 0 ? (
                  reviews.map((rev) => {
                    const canDeleteThisReview = isAdmin || (currentUser && rev.userId === currentUser.uid);

                    return (
                      <div key={rev.id} className="p-4 rounded-2xl glass-card border border-slate-800/80 space-y-2.5">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-ocean-600/30 text-ocean-300 border border-ocean-500/40 flex items-center justify-center text-xs font-bold">
                              {rev.userName[0]}
                            </div>
                            <div>
                              <strong className="text-xs text-slate-200 block">{rev.userName}</strong>
                              <span className="text-[10px] text-slate-500">
                                {new Date(rev.createdAt).toLocaleDateString('ko-KR')}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3.5 h-3.5 ${
                                    i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                                  }`}
                                />
                              ))}
                            </div>
                            {canDeleteThisReview && onDeleteReview && (
                              <button
                                onClick={() => {
                                  if (confirm('이 후기를 삭제하시겠습니까?')) {
                                    onDeleteReview(rev.id, gathering.id);
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

                        <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">{rev.content}</p>

                        {/* 후기 사진 그리드 */}
                        {rev.images && rev.images.length > 0 && (
                          <div className="pt-1">
                            <MediaGallery images={rev.images} title={`${rev.userName}님의 후기 사진`} columns={3} />
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-xs text-slate-500 py-4 text-center">아직 등록된 후기가 없습니다. 첫 후기를 작성해보세요!</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 하단 닫기 바 */}
        <div className="p-3 px-4 sm:px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-slate-500 font-mono">
            {gathering.locationName} • {formattedDate}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
