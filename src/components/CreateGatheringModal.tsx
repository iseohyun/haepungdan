import React, { useState, useRef } from 'react';
import { Gathering, LocationPosition, POI, GatheringStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { compressImageToWebP } from '../utils/imageCompressor';
import {
  X,
  MapPin,
  Crosshair,
  Sparkles,
  Calendar,
  DollarSign,
  Users,
  Video,
  FileText,
  Upload,
  Image as ImageIcon,
  Loader2,
} from 'lucide-react';

interface CreateGatheringModalProps {
  pois: POI[];
  pickedLocation: LocationPosition | null;
  onStartPickingLocation: () => void;
  onClose: () => void;
  onCreate: (newGathering: Omit<Gathering, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
}

export const CreateGatheringModal: React.FC<CreateGatheringModalProps> = ({
  pois,
  pickedLocation,
  onStartPickingLocation,
  onClose,
  onCreate,
}) => {
  const { currentUser, isAdmin } = useAuth();

  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('2026-09-19T14:00');
  const [locationName, setLocationName] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [selectedPoiId, setSelectedPoiId] = useState('');
  const [currentPosition, setCurrentPosition] = useState<LocationPosition | null>(pickedLocation);
  const [description, setDescription] = useState('');
  const [fee, setFee] = useState<number>(0);
  const [maxParticipants, setMaxParticipants] = useState<number | undefined>(10);
  const [videoUrl, setVideoUrl] = useState('');
  const [status, setStatus] = useState<GatheringStatus>(isAdmin ? 'RECRUITING' : 'PROPOSED');

  // 대표 썸네일 이미지 상태
  const [thumbnailUrl, setThumbnailUrl] = useState<string | undefined>();
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // POI 선택 시 좌표 및 이름 자동 완성
  const handlePoiChange = (poiId: string) => {
    setSelectedPoiId(poiId);
    const poi = pois.find((p) => p.id === poiId);
    if (poi) {
      setLocationName(poi.name);
      setCurrentPosition(poi.position);
    }
  };

  // 대표 이미지 업로드 및 WebP 압축
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      const result = await compressImageToWebP(file, 1200, 1200, 0.82);
      setThumbnailUrl(result.dataUrl);
    } catch (err) {
      console.error('Failed to compress thumbnail:', err);
      alert('대표 이미지 압축에 실패했습니다.');
    } finally {
      setIsCompressing(false);
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim() || !currentPosition) {
      alert('모임 제목, 장소 및 지도 위치는 필수 항목입니다.');
      return;
    }

    await onCreate({
      title: title.trim(),
      status: status,
      dateTime: new Date(dateTime).toISOString(),
      locationName: locationName.trim(),
      locationDetail: locationDetail.trim() || undefined,
      position: currentPosition,
      description: description.trim() || '모임 상세 내용이 곧 업데이트됩니다.',
      fee: fee,
      maxParticipants: maxParticipants || undefined,
      thumbnailUrl: thumbnailUrl,
      videoUrl: videoUrl.trim() || undefined,
      videoUrls: videoUrl.trim() ? [videoUrl.trim()] : [],
      createdBy: currentUser?.uid || 'anonymous_user',
      createdByName: currentUser?.displayName || '익명 회원',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100">
        
        {/* 상단 헤더 */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-ocean-500/20 text-ocean-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                {isAdmin ? '새 모임 개설 (관리자)' : '모임 제안하기 (정회원)'}
              </h2>
              <p className="text-xs text-slate-400">
                거제도 지도 위 장소를 지정하고 모임 일정을 등록하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 custom-scrollbar">
          
          {/* 모임 제목 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              모임 제목 <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="예: [정기모임] 구조라해수욕장 패들보드 & 선셋 라이딩"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>

          {/* 일시 & 상태 선택 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-ocean-400" />
                일시 <span className="text-rose-400">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={dateTime}
                onChange={(e) => setDateTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">초기 상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as GatheringStatus)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              >
                <option value="PROPOSED">💡 제안됨 (PROPOSED)</option>
                <option value="RECRUITING">🔥 참가자 모집중 (RECRUITING)</option>
                {isAdmin && <option value="CONFIRMED">✨ 일정 확정 (CONFIRMED)</option>}
              </select>
            </div>
          </div>

          {/* 거제 8대 추천 거점 퀵 선택 */}
          <div className="space-y-1.5 pt-1">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>거제 추천 장소 빠른 선택</span>
              <span className="text-[10px] text-slate-500 font-normal">선택 시 좌표 자동 입력</span>
            </label>
            <div className="flex gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
              {pois.map((poi) => (
                <button
                  type="button"
                  key={poi.id}
                  onClick={() => handlePoiChange(poi.id)}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold whitespace-nowrap transition border ${
                    selectedPoiId === poi.id
                      ? 'bg-ocean-600 text-white border-ocean-400 shadow-md'
                      : 'glass-card border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {poi.name}
                </button>
              ))}
            </div>
          </div>

          {/* 장소명 & 상세 위치 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-ocean-400" />
                장소명 <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="예: 구조라해수욕장"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">상세 집결 위치</label>
              <input
                type="text"
                placeholder="예: 해변 중앙 파라솔 앞"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
            </div>
          </div>

          {/* 지도 핀 좌표 선택 상태 */}
          <div className="p-3.5 rounded-2xl glass-card border border-slate-800 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-ocean-400 shrink-0" />
              <div>
                <span className="text-xs font-bold text-slate-200 block">지도 상 핀 위치</span>
                {currentPosition ? (
                  <span className="text-[10px] text-emerald-400 font-mono">
                    선택 완료: ({currentPosition.lat.toFixed(4)}, {currentPosition.lng.toFixed(4)})
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400">위치가 아직 지정되지 않았습니다</span>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={onStartPickingLocation}
              className="px-3 py-1.5 rounded-xl bg-ocean-600/30 hover:bg-ocean-600/50 text-ocean-300 border border-ocean-500/40 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>지도에서 핀 찍기</span>
            </button>
          </div>

          {/* 회비 & 최대 정원 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                예상 회비 (0원=무료)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={fee}
                onChange={(e) => setFee(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-sky-400" />
                최대 정원 (선택)
              </label>
              <input
                type="number"
                min="1"
                placeholder="제한 없음"
                value={maxParticipants || ''}
                onChange={(e) => setMaxParticipants(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
            </div>
          </div>

          {/* YouTube / Shorts 영상 링크 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <Video className="w-3.5 h-3.5 text-red-400" />
              YouTube / Shorts 영상 링크 (선택)
            </label>
            <input
              type="url"
              placeholder="예: https://www.youtube.com/watch?v=... 또는 https://youtube.com/shorts/..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>

          {/* 대표 썸네일 이미지 등록 (WebP 자동 압축) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
              대표 이미지 (WebP 자동 압축)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
                id="thumbnail-upload"
              />
              <label
                htmlFor="thumbnail-upload"
                className="px-3.5 py-2 rounded-xl glass-card border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 cursor-pointer flex items-center gap-1.5 transition shrink-0"
              >
                <Upload className="w-3.5 h-3.5 text-ocean-400" />
                <span>사진 선택</span>
              </label>

              {isCompressing && (
                <div className="flex items-center gap-1 text-xs text-ocean-300">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>WebP 변환 중...</span>
                </div>
              )}

              {thumbnailUrl && (
                <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-emerald-500/50 shrink-0">
                  <img src={thumbnailUrl} alt="대표 썸네일" className="w-full h-full object-cover" />
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

          {/* 모임 상세 설명 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-ocean-400" />
              모임 상세 설명 및 준비물
            </label>
            <textarea
              rows={4}
              placeholder="활동 계획, 준비물, 주의사항 등을 자유롭게 작성해주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>

          {/* 하단 버튼 */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isCompressing || !title.trim() || !locationName.trim() || !currentPosition}
              className="px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold shadow-lg shadow-ocean-600/30 transition disabled:opacity-50"
            >
              모임 등록하기
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
