import React, { useState } from 'react';
import { Gathering, LocationPosition, POI } from '../types';
import { useAuth } from '../context/AuthContext';
import { X, MapPin, Crosshair, Sparkles } from 'lucide-react';

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
  const { currentUser, currentRole } = useAuth();

  const [title, setTitle] = useState('');
  const [dateTime, setDateTime] = useState('2026-09-19T14:00');
  const [locationName, setLocationName] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [selectedPoiId, setSelectedPoiId] = useState('');
  const [currentPosition, setCurrentPosition] = useState<LocationPosition | null>(pickedLocation);
  const [description, setDescription] = useState('');
  const [budgetEstimate, setBudgetEstimate] = useState<number | undefined>(15000);
  const [preparationNotes, setPreparationNotes] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  // POI 선택 시 좌표 및 이름 자동 완성
  const handlePoiChange = (poiId: string) => {
    setSelectedPoiId(poiId);
    const poi = pois.find((p) => p.id === poiId);
    if (poi) {
      setLocationName(poi.name);
      setCurrentPosition(poi.position);
    }
  };

  // 폼 제출
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !locationName.trim() || !currentPosition) {
      alert('모임 제목, 장소 및 지도 위치는 필수 항목입니다.');
      return;
    }

    const isProposal = currentRole === 'MEMBER';

    await onCreate({
      title: title.trim(),
      status: isProposal ? 'PROPOSED' : 'RECRUITING',
      dateTime: new Date(dateTime).toISOString(),
      locationName: locationName.trim(),
      locationDetail: locationDetail.trim() || undefined,
      position: currentPosition,
      proposal: {
        description: description.trim() || '모임 상세 내용이 곧 업데이트됩니다.',
        budgetEstimate: budgetEstimate || undefined,
        preparationNotes: preparationNotes.trim() || undefined,
      },
      videoUrls: videoUrl.trim() ? [videoUrl.trim()] : [],
      createdBy: currentUser?.uid || 'guest_user',
      createdByName: currentUser?.displayName || '익명 회원',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* 헤더 */}
        <div className="p-5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-ocean-500/20 text-ocean-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white">
                {currentRole === 'ADMIN' ? '새 모임 개설 (공식)' : '모임 제안하기 (정회원)'}
              </h2>
              <p className="text-xs text-slate-400">
                거제도 지도 위 장소를 지정하고 모임 일정을 공유하세요
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 폼 본문 */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300">
          {/* 모임 제목 */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1">모임 제목 *</label>
            <input
              type="text"
              required
              placeholder="예: 제13회 거제 바람의언덕 단체 출사 & 피크닉"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>

          {/* 일시 */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1">모임 일시 *</label>
            <input
              type="datetime-local"
              required
              value={dateTime}
              onChange={(e) => setDateTime(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>

          {/* 장소 선택 (추천 POI or 지도 핀 찍기) */}
          <div className="space-y-2">
            <label className="block font-semibold text-slate-200">장소 및 위치 지정 *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={selectedPoiId}
                onChange={(e) => handlePoiChange(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-ocean-500 cursor-pointer"
              >
                <option value="">📍 추천 명소에서 선택</option>
                {pois.map((poi) => (
                  <option key={poi.id} value={poi.id}>
                    {poi.name} ({poi.category})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={onStartPickingLocation}
                className="flex items-center justify-center gap-1.5 p-2.5 rounded-lg bg-ocean-600/30 hover:bg-ocean-600/50 text-ocean-300 border border-ocean-500/40 font-semibold transition"
              >
                <Crosshair className="w-4 h-4" /> 지도에서 직접 핀 찍기
              </button>
            </div>

            {/* 선택된 좌표 상태 표시 */}
            {currentPosition && (
              <div className="p-2.5 rounded-lg bg-slate-800/60 border border-slate-700 flex items-center justify-between text-[11px] text-ocean-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  좌표 지정 완료: {currentPosition.lat.toFixed(5)}°N, {currentPosition.lng.toFixed(5)}°E
                </span>
                <span className="text-slate-400">
                  ({currentPosition.x_pct.toFixed(1)}%, {currentPosition.y_pct.toFixed(1)}%)
                </span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                required
                placeholder="장소명 (예: 구조라해수욕장)"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
              <input
                type="text"
                placeholder="상세 집결 장소 (예: 선착장 정자 앞)"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                className="bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
            </div>
          </div>

          {/* 기획 의도 및 내용 */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1">기획 내용 및 제안서 *</label>
            <textarea
              rows={3}
              required
              placeholder="모임의 취지, 코스, 대략적인 시간 계획 등을 작성해주세요."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>

          {/* 회비 & 준비물 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block font-semibold text-slate-200 mb-1">예상 회비 (원)</label>
              <input
                type="number"
                step="1000"
                placeholder="15000"
                value={budgetEstimate || ''}
                onChange={(e) => setBudgetEstimate(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-200 mb-1">준비물 및 안내</label>
              <input
                type="text"
                placeholder="예: 편한 운동화, 개인 텀블러"
                value={preparationNotes}
                onChange={(e) => setPreparationNotes(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              />
            </div>
          </div>

          {/* YouTube 비디오 링크 */}
          <div>
            <label className="block font-semibold text-slate-200 mb-1">동영상 링크 (YouTube 등)</label>
            <input
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-ocean-500"
            />
          </div>

          {/* 하단 액션 버튼 */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              취소
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-ocean-600 hover:bg-ocean-500 text-white font-semibold transition shadow-lg shadow-ocean-600/30"
            >
              {currentRole === 'ADMIN' ? '모임 개설하기' : '제안서 등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
