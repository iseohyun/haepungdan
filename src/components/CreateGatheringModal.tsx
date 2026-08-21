import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { Gathering, LocationPosition, GatheringStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/db';
import { compressImageToWebP } from '../utils/imageCompressor';
import { formatToKoreanIso } from '../utils/coordinates';
import { CustomDateTimePicker } from './common/CustomDateTimePicker';
import { DirectInputModal } from './DirectInputModal';


import {
  X,
  MapPin,
  Sparkles,
  Video,
  FileText,
  Upload,
  Image as ImageIcon,
  Loader2,
  CheckCircle2,
  Hash,
  Calendar,
  Navigation,
  Cloud,
} from 'lucide-react';




// ─────────────────────────────────────────────
// 메인: 새 모임 개설 모달
// ─────────────────────────────────────────────

interface CreateGatheringModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newGathering: Omit<Gathering, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const CreateGatheringModal: React.FC<CreateGatheringModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const { currentUser } = useAuth();

  // 등록된 실제 모임 DB 및 지정주소(locationPresets) DB 조회
  const allGatherings = useLiveQuery(() => db.gatherings.toArray(), []) ?? [];
  const allPresets = useLiveQuery(() => db.locationPresets.toArray(), []) ?? [];

  // 이전까지 등록된 회차 중 가장 큰 회차 + 1 계산 (기본값)
  const defaultNextRound = useMemo(() => {
    const validRounds = allGatherings
      .filter((g) => !g.isDeleted && typeof g.roundNumber === 'number' && g.roundNumber > 0)
      .map((g) => g.roundNumber as number);
    return validRounds.length > 0 ? Math.max(...validRounds) + 1 : 1;
  }, [allGatherings]);

  // 지정주소 마스터 목록을 그대로 집결위치 목록으로 사용
  const availableLocations = allPresets;

  // 직접 입력 모달 표시 여부
  const [showDirectInputModal, setShowDirectInputModal] = useState(false);

  // 폼 상태 (기본 회차는 가장 큰 회차 + 1)
  const [roundNumber, setRoundNumber] = useState<number | undefined>(defaultNextRound);
  const [title, setTitle] = useState('');
  const [selectedDate, setSelectedDate] = useState('2026-09-19');
  const [selectedTime, setSelectedTime] = useState('06:00');
  const [status, setStatus] = useState<GatheringStatus>('CONFIRMED');
  const [locationPresetId, setLocationPresetId] = useState<string | undefined>(undefined);
  const [locationName, setLocationName] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [address, setAddress] = useState('');
  const [roadAddress, setRoadAddress] = useState('');
  const [kakaoAddress, setKakaoAddress] = useState('');
  const [naverAddress, setNaverAddress] = useState('');
  const [tmapAddress, setTmapAddress] = useState('');
  const [currentPosition, setCurrentPosition] = useState<LocationPosition | null>(null);
  const [selectedDetailId, setSelectedDetailId] = useState<string>('');  // '' = 선택 안함, 'direct' = 직접 입력
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [cloudUrl, setCloudUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모달이 열릴 때 자동으로 최신 회차 기본값 세팅
  useEffect(() => {
    if (isOpen) {
      setRoundNumber(defaultNextRound);
      setTitle('');
      setLocationName('');
      setLocationDetail('');
      setCurrentPosition(null);
      setSelectedDetailId('');
      setDescription('');
      setVideoUrl('');
      setCloudUrl('');
      setThumbnailUrl(undefined);
    }
  }, [isOpen, defaultNextRound]);

  // 회차 변경 핸들러 (0 포함)
  const handleRoundChange = (valStr: string) => {
    if (valStr.trim() === '') { setRoundNumber(undefined); return; }
    const cleanStr = valStr.replace(/[^0-9]/g, '');
    setRoundNumber(cleanStr !== '' ? parseInt(cleanStr, 10) : undefined);
  };

  // 상세 집결위치 select 변경
  const handleDetailSelect = (val: string) => {
    setSelectedDetailId(val);
    if (val === 'direct') {
      setLocationPresetId(undefined);
      setShowDirectInputModal(true);
      return;
    }
    if (val === '') {
      setLocationPresetId(undefined);
      setLocationName('');
      setLocationDetail('');
      setAddress('');
      setRoadAddress('');
      setKakaoAddress('');
      setNaverAddress('');
      setTmapAddress('');
      setCurrentPosition(null);
      return;
    }
    // DB에서 선택
    const found = availableLocations.find((loc) => loc.id === val);
    if (found) {
      setLocationPresetId(found.id);
      setLocationName(found.name);
      setLocationDetail(found.detail || '');
      setAddress(found.address || '');
      setRoadAddress(found.roadAddress || '');
      setKakaoAddress(found.kakaoAddress || '');
      setNaverAddress(found.naverAddress || '');
      setTmapAddress(found.tmapAddress || '');
      setCurrentPosition(found.position);
    }
  };

  // 직접 입력 모달 확인
  const handleDirectInputConfirm = (detail: string, position: LocationPosition) => {
    setLocationPresetId(undefined);
    setLocationDetail(detail);
    setCurrentPosition(position);
    setShowDirectInputModal(false);
  };

  // 대표 이미지 업로드 및 WebP 압축
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsCompressing(true);
      const result = await compressImageToWebP(file, 1200, 1200, 0.82);
      setThumbnailUrl(result.dataUrl);
    } catch {
      alert('대표 이미지 압축에 실패했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationName.trim() || !currentPosition) {
      alert('장소명 및 GPS 좌표 정보는 필수 항목입니다.');
      return;
    }

    let finalTitle = title.trim();
    if (roundNumber === 0) {
      if (!finalTitle) finalTitle = '해풍단 바다수영 번개 모임';
    } else if (roundNumber !== undefined && roundNumber > 0) {
      finalTitle = `제${roundNumber}차 해풍단 바다수영 일정`;
    } else {
      if (!finalTitle) finalTitle = `${locationName.trim()} 바다수영 일정`;
    }

    const isoDateTime = formatToKoreanIso(selectedDate, selectedTime);

    await onCreate({
      roundNumber,
      title: finalTitle,
      status,
      dateTime: isoDateTime,
      locationPresetId,
      locationName: locationName.trim(),
      locationDetail: locationDetail.trim() || undefined,
      address: address.trim() || undefined,
      roadAddress: roadAddress.trim() || undefined,
      kakaoAddress: kakaoAddress.trim() || undefined,
      naverAddress: naverAddress.trim() || undefined,
      tmapAddress: tmapAddress.trim() || undefined,
      position: currentPosition,
      description: description.trim() || '모임 상세 내용이 곧 업데이트됩니다.',
      thumbnailUrl,
      videoUrl: videoUrl.trim() || undefined,
      videoUrls: videoUrl.trim() ? [videoUrl.trim()] : [],
      cloudUrl: cloudUrl.trim() || undefined,
      createdBy: currentUser?.uid || 'anonymous_user',
      createdByName: currentUser?.displayName || '익명 회원',
    });

    onClose();
  };

  if (!isOpen) return null;

  // 현재 위치 요약 텍스트
  const locationSummary = currentPosition
    ? `${locationName}${locationDetail ? ` (${locationDetail})` : ''} · ${currentPosition.lat.toFixed(5)}, ${currentPosition.lng.toFixed(5)}`
    : null;

  return (
    <>
      {/* 직접 입력 모달 */}
      {showDirectInputModal && (
        <DirectInputModal
          onConfirm={handleDirectInputConfirm}
          onClose={() => {
            setShowDirectInputModal(false);
            setSelectedDetailId(''); // 취소 시 선택 초기화
          }}
        />
      )}

      <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none">
        <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100">

          {/* 상단 헤더 */}
          <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-2xl bg-ocean-500/20 text-ocean-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white leading-tight">새 모임 개설</h2>
                <p className="text-xs text-slate-400">회차 · 일시 · 장소 · 설명을 입력하세요</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition" title="닫기">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 폼 본문 */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="divide-y divide-slate-800/60">

              {/* ── 1. 회차 ── */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                  <Hash className="w-3.5 h-3.5 text-ocean-400" />
                  회차
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="예: 14"
                  value={roundNumber !== undefined ? roundNumber : ''}
                  onChange={(e) => handleRoundChange(e.target.value)}
                  className="w-28 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-ocean-500 text-center"
                />
                {/* 회차 0일 때만 제목 입력 */}
                {roundNumber === 0 && (
                  <input
                    type="text"
                    placeholder="모임 이름 직접 입력"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500 animate-fadeIn"
                  />
                )}
              </div>

              {/* ── 2. 일시 (날짜 | 시간) ── */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-ocean-400" />
                  일시
                </label>
                <div className="flex-1 min-w-0">
                  <CustomDateTimePicker
                    date={selectedDate}
                    time={selectedTime}
                    onChangeDate={setSelectedDate}
                    onChangeTime={setSelectedTime}
                    showLabel={false}
                  />
                </div>
              </div>

              {/* ── 3. 상태 ── */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-ocean-400" />
                  상태
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as GatheringStatus)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500 font-semibold"
                >
                  <option value="CONFIRMED">✨ 확정</option>
                  <option value="CANCELLED">❌ 취소</option>
                  <option value="RECRUITING">🔥 모집중</option>
                  <option value="PROPOSED">💡 제안됨</option>
                  <option value="COMPLETED">🏁 모임종료</option>
                </select>
              </div>

              {/* ── 4. 장소명 ── */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-ocean-400" />
                  장소명 <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="예: 구조라해수욕장"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                />
              </div>

              {/* ── 5. 상세 집결위치 ── */}
              <div className="flex items-start gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 pt-1.5 flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                  상세 집결위치
                </label>
                <div className="flex-1 space-y-2">
                  <select
                    value={selectedDetailId}
                    onChange={(e) => handleDetailSelect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-ocean-500 font-medium"
                  >
                    <option value="">— 선택하세요 —</option>
                    <option value="direct">✍️ 직접 입력하기...</option>
                    {availableLocations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        📍 {loc.name}{loc.detail ? ` (${loc.detail})` : ''} · [{loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}]
                      </option>
                    ))}
                  </select>

                  {/* 선택된 위치 요약 표시 */}
                  {locationSummary && (
                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono px-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{locationSummary}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 6. YouTube 링크 ── */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-red-400" />
                  YouTube
                </label>
                <input
                  type="url"
                  placeholder="https://youtube.com/watch?v=..."
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                />
              </div>

              {/* ── 7. 클라우드 링크 ── */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                  <Cloud className="w-3.5 h-3.5 text-sky-400" />
                  클라우드
                </label>
                <input
                  type="text"
                  placeholder="예: google.com 또는 drive.google.com/..."
                  value={cloudUrl}
                  onChange={(e) => setCloudUrl(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                />
              </div>

              {/* ── 8. 대표 이미지 ── */}
              <div className="flex items-center gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  대표 이미지
                </label>
                <div className="flex items-center gap-2.5 flex-1">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" id="thumbnail-upload" />
                  <label
                    htmlFor="thumbnail-upload"
                    className="px-3.5 py-1.5 rounded-xl glass-card border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1.5 transition"
                  >
                    <Upload className="w-3.5 h-3.5 text-ocean-400" />
                    <span>이미지 선택</span>
                  </label>

                  {isCompressing && (
                    <div className="flex items-center gap-1 text-xs text-ocean-300">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>변환 중...</span>
                    </div>
                  )}

                  {thumbnailUrl && (
                    <div className="relative w-9 h-9 rounded-lg overflow-hidden border border-emerald-500/50 shrink-0">
                      <img src={thumbnailUrl} alt="썸네일" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setThumbnailUrl(undefined)}
                        className="absolute top-0.5 right-0.5 p-0.5 rounded-full bg-black/70 text-white"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* ── 8. 상세 설명 ── */}
              <div className="flex items-start gap-3 px-5 py-3.5">
                <label className="text-xs font-bold text-slate-400 w-24 shrink-0 pt-1.5 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-ocean-400" />
                  상세 설명
                </label>
                <textarea
                  rows={4}
                  placeholder="활동 계획, 준비물, 주의사항 등을 자유롭게 작성해주세요."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500 resize-none"
                />
              </div>
            </div>

            {/* 하단 버튼 */}
            <div className="px-5 py-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={isCompressing || !locationName.trim() || !currentPosition}
                className="px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold shadow-lg shadow-ocean-600/30 transition disabled:opacity-50"
              >
                모임 등록하기
              </button>
            </div>


          </form>
        </div>
      </div>
    </>
  );
};
