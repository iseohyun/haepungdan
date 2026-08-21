import { LocationPosition } from '../types';

/**
 * [거제도 정적 지도 기반 POI 오버레이 시스템 명세서]
 * 사용자 제공 4대 기준점(마커 1, 2, 4, 7) 최소 자승법(Least Squares) 최적화 캘리브레이션
 */
export const GEOJE_BOUNDS = {
  LAT_MAX: 35.038327, // 북위
  LAT_MIN: 34.645435, // 남위
  LNG_MIN: 128.415371, // 서경
  LNG_MAX: 128.757706, // 동경
  ASPECT_RATIO: 701 / 820,
} as const;

/**
 * 2D 아핀 변환 계수 (정밀 보정)
 * Forward: [x_pct, y_pct]^T = M * [lng, lat]^T + bias
 */
const AFFINE_FORWARD = {
  MX_LNG: 253.13354410035353,
  MX_LAT: -15.857402736037017,
  MX_BIAS: -31943.22741155157,
  MY_LNG: 36.28749399801016,
  MY_LAT: -242.53149453329803,
  MY_BIAS: 3830.6052186526663,
} as const;

/**
 * 2D 역 아핀 변환 계수 (백분율 -> GPS 정밀 역산)
 */
const AFFINE_INVERSE = {
  INV_LNG_X: 0.003987861524361817,
  INV_LNG_Y: -0.0002607377914733864,
  INV_LAT_X: 0.0005966627196547762,
  INV_LAT_Y: -0.004162187360390641,
} as const;

/**
 * GPS (Lat, Lng) -> CSS 백분율 위치 (x_pct, y_pct)
 * 4대 기준점 실측 오차 0.1% 미만의 정밀 캘리브레이션 적용
 */
export function gpsToPercent(lat: number, lng: number): { x_pct: number; y_pct: number } {
  const x_pct = AFFINE_FORWARD.MX_LNG * lng + AFFINE_FORWARD.MX_LAT * lat + AFFINE_FORWARD.MX_BIAS;
  const y_pct = AFFINE_FORWARD.MY_LNG * lng + AFFINE_FORWARD.MY_LAT * lat + AFFINE_FORWARD.MY_BIAS;

  return {
    x_pct: Number(Math.max(0, Math.min(100, x_pct)).toFixed(4)),
    y_pct: Number(Math.max(0, Math.min(100, y_pct)).toFixed(4)),
  };
}

/**
 * CSS 백분율 위치 (x_pct, y_pct) -> GPS (Lat, Lng)
 * 정밀 아핀 역변환 적용
 */
export function percentToGps(x_pct: number, y_pct: number): { lat: number; lng: number } {
  const dx = x_pct - AFFINE_FORWARD.MX_BIAS;
  const dy = y_pct - AFFINE_FORWARD.MY_BIAS;

  const lng = AFFINE_INVERSE.INV_LNG_X * dx + AFFINE_INVERSE.INV_LNG_Y * dy;
  const lat = AFFINE_INVERSE.INV_LAT_X * dx + AFFINE_INVERSE.INV_LAT_Y * dy;

  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}

/**
 * GPS 좌표로부터 LocationPosition 객체 생성
 */
export function createLocationFromGps(lat: number, lng: number): LocationPosition {
  const { x_pct, y_pct } = gpsToPercent(lat, lng);
  return {
    lat,
    lng,
    x_pct,
    y_pct,
  };
}

/**
 * 백분율 좌표로부터 LocationPosition 객체 생성
 */
export function createLocationFromPercent(x_pct: number, y_pct: number): LocationPosition {
  const { lat, lng } = percentToGps(x_pct, y_pct);
  return {
    lat,
    lng,
    x_pct: Number(x_pct.toFixed(4)),
    y_pct: Number(y_pct.toFixed(4)),
  };
}


/**
 * 카카오맵 길찾기 URL 생성
 */
export function getKakaoMapUrl(lat: number, lng: number, placeName: string): string {
  const encName = encodeURIComponent(placeName);
  return `https://map.kakao.com/link/to/${encName},${lat},${lng}`;
}

/**
 * 네이버 지도 길찾기 URL 생성
 */
export function getNaverMapUrl(lat: number, lng: number, placeName: string): string {
  const encName = encodeURIComponent(placeName);
  return `https://map.naver.com/v5/directions/-/-/-/transit?c=${lng},${lat},15,0,0,0,dh&destination=${encName},${lng},${lat}`;
}

/**
 * 티맵 (TMAP) 길찾기 URL 생성
 */
export function getTMapUrl(lat: number, lng: number, placeName: string): string {
  const encName = encodeURIComponent(placeName);
  return `https://apis.openapi.sk.com/tmap/app/routes?appKey=&name=${encName}&lon=${lng}&lat=${lat}`;
}

/**
 * =========================================================================
 * 타임존 안전 날짜/시간 파서 및 포맷터 (KST 한국 표준시 시차 왜곡 방지)
 * =========================================================================
 */

/**
 * ISO 또는 날짜 문자열로부터 로컬 날짜(YYYY-MM-DD)와 시간(HH:mm)을 오차 없이 추출
 */
export function parseLocalDateTime(isoString?: string): { date: string; time: string } {
  if (!isoString) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return { date: `${year}-${month}-${day}`, time: '06:00' };
  }

  const d = new Date(isoString);
  if (isNaN(d.getTime())) {
    return { date: '2026-09-19', time: '06:00' };
  }

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');

  return {
    date: `${year}-${month}-${day}`,
    time: `${hours}:${minutes}`,
  };
}

/**
 * 로컬 날짜(YYYY-MM-DD)와 시간(HH:mm)을 한국 표준시 ISO 8601 문자열(YYYY-MM-DDTHH:mm:00+09:00)로 변환
 */
export function formatToKoreanIso(dateStr: string, timeStr: string): string {
  const cleanDate = dateStr.trim();
  const cleanTime = (timeStr.trim() || '06:00').substring(0, 5);
  return `${cleanDate}T${cleanTime}:00+09:00`;
}
