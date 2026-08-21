import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';

interface PhotoLightboxModalProps {
  isOpen: boolean;
  images: string[];
  initialIndex?: number;
  title?: string;
  onClose: () => void;
}

export const PhotoLightboxModal: React.FC<PhotoLightboxModalProps> = ({
  isOpen,
  images,
  initialIndex = 0,
  title = '모임 사진',
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartXRef = useRef<number | null>(null);

  // 모달이 열릴 때 initialIndex로 초기화
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.min(initialIndex, Math.max(0, images.length - 1)));
    }
  }, [isOpen, initialIndex, images.length]);

  // 이전 사진
  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  // 다음 사진
  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  // 키보드 네비게이션 및 ESC 제어
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handlePrev, handleNext]);

  // 모바일 터치 스와이프 제어
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        handlePrev(); // 오른쪽으로 스와이프 -> 이전 사진
      } else {
        handleNext(); // 왼쪽으로 스와이프 -> 다음 사진
      }
    }
    touchStartXRef.current = null;
  };

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-3 sm:p-4 select-none animate-fadeIn"
      onClick={onClose}
    >
      {/* 1. 상단 툴바 */}
      <div
        className="w-full max-w-5xl flex items-center justify-between text-white z-10 px-2 py-1"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-ocean-300 shrink-0">
            {currentIndex + 1} / {images.length}
          </span>
          <span className="text-xs sm:text-sm font-bold text-slate-200 truncate">{title}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={currentImage}
            download={`haepungdan-photo-${currentIndex + 1}.webp`}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
            title="사진 다운로드"
            onClick={(e) => e.stopPropagation()}
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">다운로드</span>
          </a>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700/80 transition"
            title="원래 보기로 돌아가기 (ESC)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. 중앙 이미지 뷰어 */}
      <div
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-2"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          key={currentIndex}
          src={currentImage}
          alt={`${title} ${currentIndex + 1}`}
          className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl animate-scaleIn transition-all duration-300"
        />

        {/* 좌/우 화살표 네비게이션 버튼 (사진이 2장 이상일 때) */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 sm:left-4 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 transition shadow-2xl hover:scale-110"
              title="이전 사진 (←)"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-4 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 transition shadow-2xl hover:scale-110"
              title="다음 사진 (→)"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </>
        )}
      </div>

      {/* 3. 하단 썸네일 스트립 (사진이 2장 이상일 때) */}
      {images.length > 1 && (
        <div
          className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2 z-10 custom-scrollbar"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((thumb, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                idx === currentIndex
                  ? 'border-ocean-400 scale-105 shadow-lg shadow-ocean-500/30 ring-2 ring-ocean-400/40'
                  : 'border-transparent opacity-60 hover:opacity-100 hover:scale-105'
              }`}
            >
              <img src={thumb} alt={`썸네일 ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
