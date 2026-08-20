/**
 * 클라이언트 사이드 고속 WebP 이미지 압축 엔진
 * 스마트폰 고해상도 원본 사진(10MB+)을 브라우저 캔버스를 통해
 * 최대 폭 1600px, 150KB~250KB 내외의 고품질 WebP 데이터로 즉시 압축합니다.
 */

export interface CompressionResult {
  dataUrl: string;
  blob: Blob;
  size: number;
  width: number;
  height: number;
  originalSize: number;
  compressionRatio: string;
}

/**
 * File 객체를 읽어 Image 객체로 로드합니다.
 */
function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (err) => reject(err);
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * 이미지를 WebP 포맷으로 압축하고 리사이즈합니다.
 * @param file 원본 이미지 파일
 * @param maxWidth 최대 가로 폭 (기본 1600px)
 * @param maxHeight 최대 세로 높이 (기본 1600px)
 * @param quality WebP 품질 (0.0 ~ 1.0, 기본 0.82)
 */
export async function compressImageToWebP(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.82
): Promise<CompressionResult> {
  const img = await fileToImage(file);

  let { width, height } = img;

  // 비율 유지 리사이즈 계산
  if (width > maxWidth || height > maxHeight) {
    if (width / height > maxWidth / maxHeight) {
      height = Math.round((height * maxWidth) / width);
      width = maxWidth;
    } else {
      width = Math.round((width * maxHeight) / height);
      height = maxHeight;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context creation failed');
  }

  // 선명도 최적화
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  // WebP 포맷으로 인코딩
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('WebP Blob conversion failed'));
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result as string;
          const ratio = (((file.size - blob.size) / file.size) * 100).toFixed(1);

          resolve({
            dataUrl,
            blob,
            size: blob.size,
            width,
            height,
            originalSize: file.size,
            compressionRatio: `${ratio}%`,
          });
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      },
      'image/webp',
      quality
    );
  });
}

/**
 * 작은 크기의 썸네일(320px) WebP 이미지를 생성합니다.
 */
export async function generateThumbnailWebP(
  file: File,
  maxDim = 320,
  quality = 0.75
): Promise<string> {
  const result = await compressImageToWebP(file, maxDim, maxDim, quality);
  return result.dataUrl;
}

/**
 * 바이트 크기를 사람이 읽기 쉬운 형식(KB, MB)으로 변환합니다.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
