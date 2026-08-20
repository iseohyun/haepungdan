import React from 'react';
import { Play, ExternalLink, AlertCircle } from 'lucide-react';

interface VideoPlayerEmbedProps {
  url: string;
  title?: string;
  className?: string;
}

/**
 * YouTube 영상 URL에서 Video ID를 추출합니다.
 * (일반 영상, Shorts, 공유 링크, 임베드 링크 모두 지원)
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  // 1. YouTube Shorts: youtube.com/shorts/VIDEO_ID
  const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]+)/i);
  if (shortsMatch && shortsMatch[1]) return shortsMatch[1];

  // 2. youtu.be/VIDEO_ID
  const shortUrlMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/i);
  if (shortUrlMatch && shortUrlMatch[1]) return shortUrlMatch[1];

  // 3. youtube.com/watch?v=VIDEO_ID
  const standardMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/i);
  if (standardMatch && standardMatch[1]) return standardMatch[1];

  // 4. youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]+)/i);
  if (embedMatch && embedMatch[1]) return embedMatch[1];

  return null;
}

export const VideoPlayerEmbed: React.FC<VideoPlayerEmbedProps> = ({
  url,
  title = '모임 영상',
  className = '',
}) => {
  const videoId = extractYouTubeId(url);

  if (!videoId) {
    return (
      <div className={`p-4 rounded-xl glass-card border border-slate-800 flex items-center justify-between text-xs text-slate-400 ${className}`}>
        <div className="flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="truncate">외부 동영상 링크: {url}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-ocean-400 hover:text-ocean-300 font-semibold shrink-0 ml-2"
        >
          <span>열기</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  const embedUrl = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;

  return (
    <div className={`overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl ${className}`}>
      {/* 16:9 반응형 비디오 컨테이너 */}
      <div className="relative w-full pt-[56.25%] bg-black">
        <iframe
          src={embedUrl}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      {/* 비디오 하단 바 */}
      <div className="px-3.5 py-2 bg-slate-900/90 flex items-center justify-between text-xs border-t border-slate-800/80">
        <div className="flex items-center gap-2 text-slate-300">
          <Play className="w-3.5 h-3.5 text-red-500 fill-red-500" />
          <span className="font-medium text-slate-200">{title}</span>
        </div>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] transition"
        >
          <span>YouTube에서 보기</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
