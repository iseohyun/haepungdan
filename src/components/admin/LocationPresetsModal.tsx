import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { LocationPreset } from '../../types';
import { firebaseService } from '../../services/firebase';
import { createLocationFromGps, resolveLocationGuide } from '../../utils/coordinates';
import {
  X,
  MapPin,
  Plus,
  Edit3,
  Trash2,
  Search,
  Clock,
  Waves,
} from 'lucide-react';

interface LocationPresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LocationPresetsModal: React.FC<LocationPresetsModalProps> = ({ isOpen, onClose }) => {
  const presets = useLiveQuery(() => db.locationPresets.toArray(), []) ?? [];
  const allGatherings = useLiveQuery(() => db.gatherings.toArray(), []) ?? [];
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPreset, setEditingPreset] = useState<LocationPreset | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // 각 모임이 정확히 어느 프리셋 1곳에 속하는지 배타적으로 1:1 매칭 (중복 합산 방지)
  const presetUsageMap = useMemo(() => {
    const map = new Map<string, number>();
    const activeGatherings = allGatherings.filter((g) => !g.isDeleted);

    for (const g of activeGatherings) {
      let matchedId: string | undefined;

      if (g.locationPresetId) {
        // 1. 모임에 직접 지정된 ID가 있으면 해당 프리셋에 1:1 매칭
        if (presets.some((p) => p.id === g.locationPresetId)) {
          matchedId = g.locationPresetId;
        }
      }

      if (!matchedId && g.locationName) {
        // 2. ID가 없는 구버전 모임인 경우, 이름과 상세가 가장 일치하는 프리셋 딱 1곳만 찾음
        const exactMatch = presets.find(
          (p) =>
            p.name.trim() === g.locationName.trim() &&
            (g.locationDetail ? p.detail?.trim() === g.locationDetail.trim() : true)
        );
        if (exactMatch) {
          matchedId = exactMatch.id;
        } else {
          const nameMatch = presets.find((p) => p.name.trim() === g.locationName.trim());
          if (nameMatch) matchedId = nameMatch.id;
        }
      }

      if (matchedId) {
        map.set(matchedId, (map.get(matchedId) || 0) + 1);
      }
    }

    return map;
  }, [allGatherings, presets]);

  // 날짜/시간 포맷팅 헬퍼
  const formatPresetDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}.${m}.${day} ${hh}:${mm}`;
    } catch {
      return isoString;
    }
  };

  // 폼 상태
  const [formName, setFormName] = useState('');
  const [formDetail, setFormDetail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formRoadAddress, setFormRoadAddress] = useState('');
  const [formKakaoAddress, setFormKakaoAddress] = useState('');
  const [formNaverAddress, setFormNaverAddress] = useState('');
  const [formTmapAddress, setFormTmapAddress] = useState('');
  const [formLat, setFormLat] = useState<string>('34.81234');
  const [formLng, setFormLng] = useState<string>('128.68123');
  const [formError, setFormError] = useState<string | null>(null);

  if (!isOpen) return null;

  // 검색 필터링
  const filteredPresets = presets.filter((p) => {
    const q = searchQuery.toLowerCase();
    return (
      p.name.toLowerCase().includes(q) ||
      (p.detail && p.detail.toLowerCase().includes(q)) ||
      (p.address && p.address.toLowerCase().includes(q)) ||
      (p.roadAddress && p.roadAddress.toLowerCase().includes(q)) ||
      (p.kakaoAddress && p.kakaoAddress.toLowerCase().includes(q))
    );
  });

  // 신규 등록 폼 열기
  const handleOpenCreate = () => {
    setEditingPreset(null);
    setFormName('');
    setFormDetail('');
    setFormAddress('');
    setFormRoadAddress('');
    setFormKakaoAddress('');
    setFormNaverAddress('');
    setFormTmapAddress('');
    setFormLat('34.81234');
    setFormLng('128.68123');
    setFormError(null);
    setIsCreating(true);
  };

  // 기존 수정 폼 열기
  const handleOpenEdit = (preset: LocationPreset) => {
    setIsCreating(false);
    setEditingPreset(preset);
    setFormName(preset.name);
    setFormDetail(preset.detail || '');
    setFormAddress(preset.address || '');
    setFormRoadAddress(preset.roadAddress || '');
    setFormKakaoAddress(preset.kakaoAddress || '');
    setFormNaverAddress(preset.naverAddress || '');
    setFormTmapAddress(preset.tmapAddress || '');
    setFormLat(preset.lat.toString());
    setFormLng(preset.lng.toString());
    setFormError(null);
  };

  // 폼 취소
  const handleCancelForm = () => {
    setIsCreating(false);
    setEditingPreset(null);
    setFormError(null);
  };

  // 저장 (추가 또는 수정)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('장소명을 입력해주세요.');
      return;
    }

    const latNum = parseFloat(formLat);
    const lngNum = parseFloat(formLng);
    if (isNaN(latNum) || isNaN(lngNum) || latNum < 33 || latNum > 36 || lngNum < 127 || lngNum > 130) {
      setFormError('유효한 거제도 GPS 좌표(위도 34.xx, 경도 128.xx)를 입력해주세요.');
      return;
    }

    const position = createLocationFromGps(latNum, lngNum);
    const now = new Date().toISOString();

    const targetId = editingPreset ? editingPreset.id : `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const newPreset: LocationPreset = {
      id: targetId,
      name: formName.trim(),
      detail: formDetail.trim() || undefined,
      address: formAddress.trim() || undefined,
      roadAddress: formRoadAddress.trim() || undefined,
      kakaoAddress: formKakaoAddress.trim() || undefined,
      naverAddress: formNaverAddress.trim() || undefined,
      tmapAddress: formTmapAddress.trim() || undefined,
      lat: latNum,
      lng: lngNum,
      position,
      createdAt: editingPreset?.createdAt || now,
      updatedAt: now,
    };

    try {
      await db.upsertLocationPreset(newPreset);
      await firebaseService.saveLocationPresetToCloud(newPreset);
      handleCancelForm();
    } catch (err) {
      setFormError('지정주소 저장 중 오류가 발생했습니다.');
    }
  };

  // 삭제
  const handleDelete = async (preset: LocationPreset) => {
    if (!confirm(`'${preset.name}' 지정주소를 삭제하시겠습니까?`)) return;

    try {
      await db.deleteLocationPreset(preset.id);
      await firebaseService.deleteLocationPresetFromCloud(preset.id);
      if (editingPreset?.id === preset.id) {
        handleCancelForm();
      }
    } catch (err) {
      alert('지정주소 삭제에 실패했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100">
        {/* 헤더 */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <span>지정주소(집결지) 관리</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-normal">
                  총 {presets.length}곳
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                지도별 지정주소, 대표 도로명주소 및 GPS 좌표를 등록하고 수정합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5">
          {/* 상단 툴바: 신규 추가 버튼 & 검색창 */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="장소명, 상세집결지, 주소 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {!isCreating && !editingPreset && (
              <button
                onClick={handleOpenCreate}
                className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold text-xs shadow-md transition flex items-center justify-center gap-1.5 shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>새 지정주소 추가</span>
              </button>
            )}
          </div>

          {/* 등록 / 수정 폼 (열려있을 때) */}
          {(isCreating || editingPreset) && (
            <form onSubmit={handleSave} className="p-4 sm:p-5 rounded-2xl glass-panel border border-emerald-500/40 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                <h3 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isCreating ? '새 지정주소 등록' : `'${editingPreset?.name}' 정보 수정`}</span>
                </h3>
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  취소
                </button>
              </div>

              {formError && (
                <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/30 p-2 rounded-xl">
                  {formError}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* 1. 장소명 */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    장소명 <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="예: 구조라해수욕장"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 2. 상세 집결위치 */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">상세 집결위치</label>
                  <input
                    type="text"
                    placeholder="예: 해변 중앙 시계탑 앞"
                    value={formDetail}
                    onChange={(e) => setFormDetail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 3. 대표 주소 */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-slate-300">
                    대표 주소 (도로명 / 지번) <span className="text-[10px] text-emerald-400 font-normal">2순위 안내</span>
                  </label>
                  <input
                    type="text"
                    placeholder="예: 경남 거제시 일운면 구조라로 42"
                    value={formRoadAddress}
                    onChange={(e) => {
                      setFormRoadAddress(e.target.value);
                      setFormAddress(e.target.value);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 4. 카카오맵 지정 주소 */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-amber-400">
                    카카오맵 지정 주소 <span className="text-[10px] text-amber-300/80 font-normal">1순위</span>
                  </label>
                  <input
                    type="text"
                    placeholder="카카오맵에 등록된 명칭/주소"
                    value={formKakaoAddress}
                    onChange={(e) => setFormKakaoAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                {/* 5. 네이버 지도 지정 주소 */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-emerald-400">
                    네이버 지도 지정 주소 <span className="text-[10px] text-emerald-300/80 font-normal">1순위</span>
                  </label>
                  <input
                    type="text"
                    placeholder="네이버 지도에 등록된 명칭/주소"
                    value={formNaverAddress}
                    onChange={(e) => setFormNaverAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                {/* 6. 티맵 지정 주소 */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-sky-400">
                    티맵(T map) 지정 주소 <span className="text-[10px] text-sky-300/80 font-normal">1순위</span>
                  </label>
                  <input
                    type="text"
                    placeholder="티맵에 등록된 명칭/주소"
                    value={formTmapAddress}
                    onChange={(e) => setFormTmapAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  />
                </div>

                {/* 7. GPS 좌표 (위도, 경도) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-300">
                    GPS 위도 / 경도 <span className="text-[10px] text-slate-400 font-normal">3순위 fallback</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="위도 (34.xxxx)"
                      value={formLat}
                      onChange={(e) => setFormLat(e.target.value)}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="경도 (128.xxxx)"
                      value={formLng}
                      onChange={(e) => setFormLng(e.target.value)}
                      className="w-1/2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 저장 및 취소 버튼 */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleCancelForm}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md transition"
                >
                  저장하기
                </button>
              </div>
            </form>
          )}

          {/* 지정주소 목록 리스트 */}
          <div className="space-y-2.5">
            {filteredPresets.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs glass-card rounded-2xl">
                등록된 지정주소가 없습니다.
              </div>
            ) : (
              filteredPresets.map((preset) => {
                const guide = resolveLocationGuide(preset);
                const usageCount = presetUsageMap.get(preset.id) || 0;

                return (
                  <div
                    key={preset.id}
                    className="p-3.5 sm:p-4 rounded-2xl glass-card border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:border-emerald-500/40"
                  >
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-white">{preset.name}</span>
                        {preset.detail && (
                          <span className="text-xs text-slate-400">({preset.detail})</span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {guide.badgeLabel}
                        </span>

                        {/* 모임 사용 횟수 뱃지 */}
                        {usageCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                            <Waves className="w-3 h-3 text-sky-400" />
                            모임 {usageCount}회 사용
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/60">
                            0회 (미사용)
                          </span>
                        )}
                      </div>

                      {/* 안내 주소 및 GPS 좌표 */}
                      <div className="text-xs text-slate-300 flex items-center gap-1.5 flex-wrap font-medium">
                        <span>📍 {guide.displayAddress}</span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          [{preset.lat.toFixed(5)}, {preset.lng.toFixed(5)}]
                        </span>
                      </div>

                      {/* 특정 지도별 등록된 주소 태그 + 최종 수정일자 */}
                      <div className="flex items-center gap-2 pt-0.5 text-[10px] flex-wrap">
                        {preset.kakaoAddress && (
                          <span className="px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            카카오: {preset.kakaoAddress}
                          </span>
                        )}
                        {preset.naverAddress && (
                          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            네이버: {preset.naverAddress}
                          </span>
                        )}
                        {preset.tmapAddress && (
                          <span className="px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            티맵: {preset.tmapAddress}
                          </span>
                        )}

                        {/* 최종 수정일자 */}
                        <div className="inline-flex items-center gap-1 text-[11px] text-slate-400 ml-auto font-mono">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>최종 수정: {formatPresetDate(preset.updatedAt || preset.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 (수정 / 삭제) */}
                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      <button
                        onClick={() => handleOpenEdit(preset)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                        title="수정"
                      >
                        <Edit3 className="w-4 h-4 text-ocean-400" />
                      </button>
                      <button
                        onClick={() => handleDelete(preset)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                        title="삭제"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
