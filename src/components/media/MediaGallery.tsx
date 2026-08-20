import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  Maximize2,
  Image as ImageIcon,
} from 'lucide-react';

interface MediaGalleryProps {
  images: string[];
  title?: string;
  columns?: 2 | 3 | 4;
}

export const MediaGallery: React.FC<MediaGalleryProps> = ({
  images,
  title = '갤러리 사진',
  columns = 3,
}) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // 이전 사진
  const handlePrev = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! > 0 ? prev! - 1 : images.length - 1));
  }, [lightboxIndex, images.length]);

  // 다음 사진
  const handleNext = useCallback(() => {
    if (lightboxIndex === null) return;
    setLightboxIndex((prev) => (prev! < images.length - 1 ? prev! + 1 : 0));
  }, [lightboxIndex, images.length]);

  // 키보드 방향키 및 ESC 제어
  useEffect(() => {
    if (lightboxIndex === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIndex(null);
      else if (e.key === 'ArrowLeft') handlePrev();
      else if (e.key === 'ArrowRight') handleNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxIndex, handlePrev, handleNext]);

  if (!images || images.length === 0) {
    return (
      <div className="p-8 rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center text-slate-500 gap-2">
        <ImageIcon className="w-8 h-8 stroke-1" />
        <p className="text-xs">등록된 사진이 없습니다.</p>
      </div>
    );
  }

  const gridColsClass =
    columns === 2
      ? 'grid-cols-2'
      : columns === 4
      ? 'grid-cols-2 sm:grid-cols-4'
      : 'grid-cols-2 sm:grid-cols-3';

  return (
    <>
      {/* 썸네일 그리드 */}
      <div className={`grid ${gridColsClass} gap-2.5`}>
        {images.map((imgSrc, idx) => (
          <div
            key={idx}
            onClick={() => setLightboxIndex(idx)}
            className="group relative aspect-square rounded-xl overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer shadow-md"
          >
            <img
              src={imgSrc}
              alt={`${title} ${idx + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {/* 호버 오버레이 */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
              <div className="p-2 rounded-full bg-slate-900/80 backdrop-blur-sm">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 풀스크린 라이트박스 모달 */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-between p-4 select-none animate-fadeIn"
          onClick={() => setLightboxIndex(null)}
        >
          {/* 상단 툴바 */}
          <div
            className="w-full max-w-5xl flex items-center justify-between text-white z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300">
                {lightboxIndex + 1} / {images.length}
              </span>
              <span className="text-sm font-medium text-slate-200 hidden sm:inline">{title}</span>
            </div>

            <div className="flex items-center gap-2">
              <a
                href={images[lightboxIndex]}
                download={`haepungdan-photo-${lightboxIndex + 1}.webp`}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition flex items-center gap-1.5 text-xs font-semibold"
                title="사진 다운로드"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">다운로드</span>
              </a>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition"
                title="닫기 (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* 중앙 이미지 뷰어 */}
          <div
            className="relative flex-1 w-full max-w-5xl flex items-center justify-center overflow-hidden my-2"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[lightboxIndex]}
              alt={`${title} ${lightboxIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl animate-scaleIn"
            />

            {/* 좌/우 네비게이션 버튼 (사진이 2장 이상일 때) */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrev();
                  }}
                  className="absolute left-2 sm:left-4 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 transition shadow-2xl"
                  title="이전 사진 (←)"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNext();
                  }}
                  className="absolute right-2 sm:right-4 p-3 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700/80 transition shadow-2xl"
                  title="다음 사진 (→)"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </>
            )}
          </div>

          {/* 하단 썸네일 스트립 (사진이 여러 장일 때) */}
          {images.length > 1 && (
            <div
              className="w-full max-w-3xl flex items-center justify-center gap-2 overflow-x-auto py-2 z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((thumb, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxIndex(idx)}
                  className={`relative w-12 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition-all ${
                    idx === lightboxIndex
                      ? 'border-ocean-400 scale-105 shadow-lg'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={thumb} alt={`썸네일 ${idx + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
};
