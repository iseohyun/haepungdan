import React, { useState } from 'react';
import { LocationPosition } from '../types';
import { createLocationFromGps } from '../utils/coordinates';
import { X, MapPin, Navigation, CheckCircle2, AlertCircle, Edit3, HelpCircle } from 'lucide-react';

/**
 * 상세 집결위치 + GPS 좌표 직접 입력 모달
 * CreateGatheringModal 및 GatheringDetailModal (수정 모드) 양쪽에서 공용으로 사용됩니다.
 */
interface DirectInputModalProps {
  /** 확인 버튼 클릭 시 콜백 */
  onConfirm: (detail: string, position: LocationPosition) => void;
  /** 취소 또는 닫기 콜백 */
  onClose: () => void;
  /** 초기 상세 집결위치 값 (수정 모드에서 기존 값 주입) */
  initialDetail?: string;
  /** 초기 GPS 좌표 문자열 (예: "34.799, 128.714") */
  initialCoord?: string;
}

export const DirectInputModal: React.FC<DirectInputModalProps> = ({
  onConfirm,
  onClose,
  initialDetail = '',
  initialCoord = '',
}) => {
  const [detail, setDetail] = useState(initialDetail);
  const [coordInput, setCoordInput] = useState(initialCoord);
  const [position, setPosition] = useState<LocationPosition | null>(null);
  const [coordError, setCoordError] = useState<string | null>(null);
  const [showGpsHelpModal, setShowGpsHelpModal] = useState(false);


  const handleCoordChange = (value: string) => {
    setCoordInput(value);
    setCoordError(null);
    if (!value.trim()) {
      setPosition(null);
      return;
    }

    const match = value.match(/([0-9]+\.[0-9]+)[,\s;]+([0-9]+\.[0-9]+)/);
    if (match) {
      const p1 = parseFloat(match[1]);
      const p2 = parseFloat(match[2]);
      const lat = p1 < p2 ? p1 : p2;
      const lng = p1 > p2 ? p1 : p2;
      if (lat >= 33.0 && lat <= 38.9 && lng >= 124.0 && lng <= 132.0) {
        setPosition(createLocationFromGps(lat, lng));
        return;
      }
    }
    setPosition(null);
    setCoordError('올바른 형식이 아닙니다. 예: 34.7994875, 128.7141719');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!position) {
      alert('올바른 GPS 좌표를 입력해주세요.');
      return;
    }
    onConfirm(detail.trim(), position);
  };

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-scaleIn text-slate-100 overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/60">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Edit3 className="w-4 h-4 text-ocean-400" />
            상세 집결위치 직접 입력
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 상세 집결위치 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-ocean-400" />
              상세 집결위치
            </label>
            <input
              type="text"
              placeholder="예: 해변 중앙 파라솔 앞, 주차장 입구"
              value={detail}
              onChange={(e) => setDetail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-ocean-500"
              autoFocus
            />
          </div>

          {/* GPS 좌표 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                GPS 좌표 (위도, 경도) <span className="text-rose-400 ml-0.5">*</span>
              </label>
              {/* GPS 추출 방법 가이드 모달 트리거 (?) */}
              <button
                type="button"
                onClick={() => setShowGpsHelpModal(true)}
                className="flex items-center gap-1 text-[11px] font-bold text-ocean-400 hover:text-ocean-300 bg-ocean-950/80 hover:bg-ocean-900/80 border border-ocean-800/80 rounded-lg px-2 py-0.5 transition"
                title="GPS 좌표 추출 방법 보기"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>좌표 추출 방법</span>
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="34.7994875, 128.7141719"
              value={coordInput}
              onChange={(e) => handleCoordChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
            {position && (
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>위도 {position.lat.toFixed(6)}, 경도 {position.lng.toFixed(6)}</span>
              </div>
            )}
            {coordError && (
              <div className="flex items-center gap-1.5 text-[11px] text-rose-400">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{coordError}</span>
              </div>
            )}
          </div>

          {/* GPS 추출 방법 안내 서브 모달 */}
          {showGpsHelpModal && (
            <div
              className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
              onClick={(e) => { if (e.target === e.currentTarget) setShowGpsHelpModal(false); }}
            >
              <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-scaleIn text-slate-100 overflow-hidden">
                <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-800/80">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-emerald-400" />
                    GPS 좌표 추출 방법
                  </h4>
                  <button
                    type="button"
                    onClick={() => setShowGpsHelpModal(false)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-5 space-y-3.5 text-xs text-slate-300">
                  <div className="font-bold text-sm text-ocean-300">
                    📍 GPS 추출 방법
                  </div>
                  <ol className="space-y-2 list-decimal list-inside leading-relaxed bg-slate-950/70 p-3.5 rounded-xl border border-slate-800 text-slate-200">
                    <li><span className="font-semibold text-white">구글맵</span>을 켭니다.</li>
                    <li>궁금한 위치에서 <span className="font-semibold text-ocean-400">우클릭</span>합니다.</li>
                    <li><span className="font-semibold text-ocean-400">'이 위치 공유'</span>를 클릭합니다.</li>
                    <li><span className="font-semibold text-ocean-400">'링크 복사'</span>를 클릭합니다.</li>
                    <li>새 창에서 엽니다.</li>
                    <li>해당 URL로 <span className="font-semibold text-emerald-400">LLM(AI)에게 GPS 좌표</span>를 묻습니다.</li>
                  </ol>
                  <p className="text-[11px] text-slate-400">
                    💡 추출된 좌표(예: <span className="font-mono text-emerald-400">34.7994875, 128.7141719</span>)를 복사하여 입력창에 붙여넣으시면 됩니다.
                  </p>
                </div>
                <div className="p-3 border-t border-slate-800 flex justify-end bg-slate-900/90">
                  <button
                    type="button"
                    onClick={() => setShowGpsHelpModal(false)}
                    className="px-4 py-1.5 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold transition"
                  >
                    확인
                  </button>
                </div>
              </div>
            </div>
          )}


          {/* 버튼 */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={!position}
              className="px-4 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              확인
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
