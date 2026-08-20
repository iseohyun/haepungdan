import React, { useState } from 'react';
import { Gathering, GatheringRSVP, GatheringReview, RSVPStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { getKakaoMapUrl, getNaverMapUrl, getTMapUrl } from '../utils/coordinates';
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
} from 'lucide-react';

interface GatheringDetailModalProps {
  gathering: Gathering;
  rsvps: GatheringRSVP[];
  reviews: GatheringReview[];
  onClose: () => void;
  onUpdateRsvp: (gatheringId: string, status: RSVPStatus, comment?: string) => Promise<void>;
  onAddReview?: (gatheringId: string, content: string, rating: number) => Promise<void>;
  onDeleteGathering?: (gatheringId: string) => Promise<void>;
  onUpdateStatus?: (gatheringId: string, newStatus: Gathering['status']) => Promise<void>;
}

export const GatheringDetailModal: React.FC<GatheringDetailModalProps> = ({
  gathering,
  rsvps,
  reviews,
  onClose,
  onUpdateRsvp,
  onAddReview,
  onDeleteGathering,
  onUpdateStatus,
}) => {
  const { currentUser, canRSVP, canWriteReview, canCreateGathering } = useAuth();
  const [activeTab, setActiveTab] = useState<'info' | 'rsvp' | 'reviews'>('info');
  const [rsvpComment, setRsvpComment] = useState('');
  const [reviewContent, setReviewContent] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

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

  // 길찾기 링크들
  const kakaoUrl = getKakaoMapUrl(gathering.position.lat, gathering.position.lng, gathering.locationName);
  const naverUrl = getNaverMapUrl(gathering.position.lat, gathering.position.lng, gathering.locationName);
  const tmapUrl = getTMapUrl(gathering.position.lat, gathering.position.lng, gathering.locationName);

  // YouTube 임베드 ID 파싱
  const getYouTubeEmbedUrl = (url: string) => {
    try {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return match && match[2].length === 11
        ? `https://www.youtube.com/embed/${match[2]}`
        : null;
    } catch {
      return null;
    }
  };

  const handleRsvpClick = async (status: RSVPStatus) => {
    if (!canRSVP) {
      alert('정회원(Member) 이상만 참여 응답이 가능합니다. (상단에서 정회원으로 전환해보세요)');
      return;
    }
    await onUpdateRsvp(gathering.id, status, rsvpComment);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewContent.trim() || !onAddReview) return;
    if (!canWriteReview) {
      alert('정회원(Member) 이상만 후기 작성이 가능합니다.');
      return;
    }
    await onAddReview(gathering.id, reviewContent, reviewRating);
    setReviewContent('');
  };

  const handleDelete = async () => {
    if (confirm('정말로 이 모임을 삭제하시겠습니까?') && onDeleteGathering) {
      await onDeleteGathering(gathering.id);
    }
  };

  const getStatusBadge = () => {
    switch (gathering.status) {
      case 'RECRUITING':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 모집중 (참여가능)
          </span>
        );
      case 'PROPOSED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" /> 제안/의견수렴
          </span>
        );
      case 'CONFIRMED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/40 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-sky-400" /> 모임 확정
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-700 text-slate-300 border border-slate-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-400" /> 모임 완료 (아카이브)
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
            취소됨
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 모달 상단 헤더 */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700/80 flex items-start justify-between">
          <div className="space-y-1.5 pr-4">
            <div className="flex items-center gap-2 flex-wrap">
              {getStatusBadge()}
              <span className="text-xs text-slate-400">
                작성자: <strong className="text-slate-300">{gathering.createdByName}</strong>
              </span>
            </div>
            <h2 className="text-lg md:text-xl font-bold text-white leading-snug">
              {gathering.title}
            </h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {canCreateGathering && onDeleteGathering && (
              <button
                onClick={handleDelete}
                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded-lg transition"
                title="모임 삭제 (관리자)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="flex border-b border-slate-800 bg-slate-900/50 px-5">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'info'
                ? 'border-ocean-500 text-ocean-300 bg-ocean-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-4 h-4" /> 모임 안내 &amp; 제안서
          </button>
          <button
            onClick={() => setActiveTab('rsvp')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'rsvp'
                ? 'border-ocean-500 text-ocean-300 bg-ocean-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-4 h-4" /> 참여 현황 ({attendingList.length}명)
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-ocean-500 text-ocean-300 bg-ocean-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> 후기 &amp; 갤러리 ({reviews.length})
          </button>
        </div>

        {/* 탭 본문 영역 */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1 text-slate-300 text-sm">
          {/* TAB 1: 모임 안내 */}
          {activeTab === 'info' && (
            <>
              {/* 일시 & 장소 카드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-ocean-500/20 text-ocean-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">모임 일시</span>
                    <p className="text-white font-semibold mt-0.5">{formattedDate}</p>
                  </div>
                </div>

                <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-xl flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 font-medium">모임 장소</span>
                    <p className="text-white font-semibold mt-0.5">{gathering.locationName}</p>
                    {gathering.locationDetail && (
                      <p className="text-xs text-slate-400">{gathering.locationDetail}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 외부 길찾기 연동 버튼들 */}
              <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Navigation className="w-4 h-4 text-ocean-400" />
                  <span>
                    GPS: <strong>{gathering.position.lat.toFixed(5)}°N, {gathering.position.lng.toFixed(5)}°E</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <a
                    href={kakaoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial text-center px-2.5 py-1.5 rounded-lg bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 text-xs font-semibold transition border border-yellow-500/40"
                  >
                    카카오맵
                  </a>
                  <a
                    href={naverUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial text-center px-2.5 py-1.5 rounded-lg bg-green-500/20 text-green-300 hover:bg-green-500/30 text-xs font-semibold transition border border-green-500/40"
                  >
                    네이버지도
                  </a>
                  <a
                    href={tmapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 sm:flex-initial text-center px-2.5 py-1.5 rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 text-xs font-semibold transition border border-red-500/40"
                  >
                    T맵
                  </a>
                </div>
              </div>

              {/* 제안서 / 상세 기획 내용 */}
              <div className="space-y-2">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-ocean-400" /> 기획 의도 및 내용
                </h3>
                <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl text-slate-200 leading-relaxed whitespace-pre-line">
                  {gathering.proposal.description}
                </div>
              </div>

              {/* 예산 및 준비물 */}
              {(gathering.proposal.budgetEstimate || gathering.proposal.preparationNotes) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {gathering.proposal.budgetEstimate && (
                    <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-amber-400" /> 예상 회비 / 예산
                      </span>
                      <p className="text-sm font-semibold text-white mt-1">
                        1인당 {gathering.proposal.budgetEstimate.toLocaleString()}원
                      </p>
                    </div>
                  )}
                  {gathering.proposal.preparationNotes && (
                    <div className="bg-slate-800/40 border border-slate-800 p-3.5 rounded-xl">
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-sky-400" /> 준비물 및 안내사항
                      </span>
                      <p className="text-xs text-slate-200 mt-1">
                        {gathering.proposal.preparationNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 동영상 임베드 링크 */}
              {gathering.videoUrls && gathering.videoUrls.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-rose-400" /> 관련 영상
                  </h3>
                  <div className="space-y-3">
                    {gathering.videoUrls.map((vUrl, i) => {
                      const embedUrl = getYouTubeEmbedUrl(vUrl);
                      return embedUrl ? (
                        <div key={i} className="aspect-video rounded-xl overflow-hidden border border-slate-800 shadow-lg">
                          <iframe
                            src={embedUrl}
                            title={`Video ${i}`}
                            className="w-full h-full"
                            allowFullScreen
                          />
                        </div>
                      ) : (
                        <a
                          key={i}
                          href={vUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-2 p-3 bg-slate-800/40 border border-slate-800 rounded-xl text-xs text-ocean-400 hover:underline"
                        >
                          <ExternalLink className="w-4 h-4" /> {vUrl}
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 관리자 전용 상태 변경 버튼 */}
              {canCreateGathering && onUpdateStatus && (
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-amber-400 font-semibold">관리자 메뉴: 모임 상태 변경</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => onUpdateStatus(gathering.id, 'RECRUITING')}
                      className="px-2.5 py-1 text-xs rounded bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    >
                      모집중
                    </button>
                    <button
                      onClick={() => onUpdateStatus(gathering.id, 'CONFIRMED')}
                      className="px-2.5 py-1 text-xs rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30"
                    >
                      확정
                    </button>
                    <button
                      onClick={() => onUpdateStatus(gathering.id, 'COMPLETED')}
                      className="px-2.5 py-1 text-xs rounded bg-slate-700 text-slate-300 hover:bg-slate-600"
                    >
                      완료
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* TAB 2: 참여 응답 (RSVP) */}
          {activeTab === 'rsvp' && (
            <div className="space-y-6">
              {/* 내 응답 섹션 */}
              <div className="bg-slate-800/70 border border-slate-700 p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-ocean-400" /> 나의 참여 응답
                  </h4>
                  {myRsvp && (
                    <span className="text-xs text-ocean-300 font-medium">
                      현재 상태:{' '}
                      {myRsvp.status === 'ATTENDING'
                        ? '참석 확정'
                        : myRsvp.status === 'ABSENT'
                        ? '불참'
                        : '미정'}
                    </span>
                  )}
                </div>

                {canRSVP ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => handleRsvpClick('ATTENDING')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          myRsvp?.status === 'ATTENDING'
                            ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 참석
                      </button>
                      <button
                        onClick={() => handleRsvpClick('ABSENT')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          myRsvp?.status === 'ABSENT'
                            ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/40'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                        }`}
                      >
                        <XCircle className="w-4 h-4 text-rose-400" /> 불참
                      </button>
                      <button
                        onClick={() => handleRsvpClick('UNDECIDED')}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          myRsvp?.status === 'UNDECIDED'
                            ? 'bg-amber-600 text-white border-amber-400 ring-2 ring-amber-400/40'
                            : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700'
                        }`}
                      >
                        <HelpCircle className="w-4 h-4 text-amber-400" /> 미정
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="한줄 코멘트 (예: 10분 정도 늦을 수 있어요)"
                        value={rsvpComment}
                        onChange={(e) => setRsvpComment(e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/60 rounded-lg text-xs text-slate-400 flex items-center justify-between">
                    <span>참여 응답은 정회원(Member) 이상 권한이 필요합니다.</span>
                    <span className="text-ocean-400 font-semibold">상단 스위처에서 정회원 전환</span>
                  </div>
                )}
              </div>

              {/* 전체 참석자 목록 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  참석 확정 ({attendingList.length}명)
                </h4>
                {attendingList.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {attendingList.map((r) => (
                      <div
                        key={r.id}
                        className="p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 flex items-center justify-between"
                      >
                        <span className="font-semibold text-white text-xs">{r.userName}</span>
                        {r.comment && <span className="text-[11px] text-slate-400">{r.comment}</span>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">아직 참석 응답자가 없습니다.</p>
                )}
              </div>

              {/* 미정 목록 */}
              {undecidedList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    미정 ({undecidedList.length}명)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {undecidedList.map((r) => (
                      <span key={r.id} className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {r.userName} {r.comment && `(${r.comment})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 불참 목록 */}
              {absentList.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    불참 ({absentList.length}명)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {absentList.map((r) => (
                      <span key={r.id} className="text-xs px-2.5 py-1 rounded bg-slate-800/50 text-slate-400 border border-slate-800">
                        {r.userName} {r.comment && `(${r.comment})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: 후기 & 갤러리 */}
          {activeTab === 'reviews' && (
            <div className="space-y-6">
              {/* 후기 작성 폼 */}
              {canWriteReview ? (
                <form onSubmit={handleReviewSubmit} className="bg-slate-800/60 border border-slate-700 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">참여 후기 남기기</h4>
                    <div className="flex items-center gap-1 text-amber-400">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          type="button"
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`text-sm ${reviewRating >= star ? 'opacity-100' : 'opacity-30'}`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="모임 후기나 소감을 자유롭게 공유해주세요."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-lg bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-semibold transition"
                    >
                      후기 등록
                    </button>
                  </div>
                </form>
              ) : (
                <p className="text-xs text-slate-500 p-3 bg-slate-800/30 rounded-lg">
                  후기 작성은 정회원(Member) 이상만 가능합니다.
                </p>
              )}

              {/* 후기 목록 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  등록된 후기 ({reviews.length}개)
                </h4>
                {reviews.length > 0 ? (
                  reviews.map((rev) => (
                    <div key={rev.id} className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{rev.userName}</span>
                        <div className="flex items-center gap-1 text-amber-400 text-xs">
                          {'★'.repeat(rev.rating || 5)}
                        </div>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {rev.content}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500">아직 등록된 모임 후기가 없습니다.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
