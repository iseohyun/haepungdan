import { LocationPosition } from '../types';

/**
 * [거제도 정적 지도 기반 POI 오버레이 시스템 명세서]
 * Geographic Extent (EPSG:4326 / WGS84)
 */
export const GEOJE_BOUNDS = {
  LAT_MAX: 35.045000, // 북위
  LAT_MIN: 34.665000, // 남위
  LNG_MIN: 128.400000, // 서경
  LNG_MAX: 128.755000, // 동경
  ASPECT_RATIO: 701 / 820,
} as const;

/**
 * GPS (Lat, Lng) -> CSS 백분율 위치 (x_pct, y_pct)
 * x_pct = ((Lng - 128.400) / (128.755 - 128.400)) * 100
 * y_pct = ((35.045 - Lat) / (35.045 - 34.665)) * 100
 */
export function gpsToPercent(lat: number, lng: number): { x_pct: number; y_pct: number } {
  const lngSpan = GEOJE_BOUNDS.LNG_MAX - GEOJE_BOUNDS.LNG_MIN;
  const latSpan = GEOJE_BOUNDS.LAT_MAX - GEOJE_BOUNDS.LAT_MIN;

  const x_pct = ((lng - GEOJE_BOUNDS.LNG_MIN) / lngSpan) * 100;
  const y_pct = ((GEOJE_BOUNDS.LAT_MAX - lat) / latSpan) * 100;

  return {
    x_pct: Number(Math.max(0, Math.min(100, x_pct)).toFixed(4)),
    y_pct: Number(Math.max(0, Math.min(100, y_pct)).toFixed(4)),
  };
}

/**
 * CSS 백분율 위치 (x_pct, y_pct) -> GPS (Lat, Lng)
 * Lng = 128.400 + (x_pct / 100) * (128.755 - 128.400)
 * Lat = 35.045 - (y_pct / 100) * (35.045 - 34.665)
 */
export function percentToGps(x_pct: number, y_pct: number): { lat: number; lng: number } {
  const lngSpan = GEOJE_BOUNDS.LNG_MAX - GEOJE_BOUNDS.LNG_MIN;
  const latSpan = GEOJE_BOUNDS.LAT_MAX - GEOJE_BOUNDS.LAT_MIN;

  const lng = GEOJE_BOUNDS.LNG_MIN + (x_pct / 100) * lngSpan;
  const lat = GEOJE_BOUNDS.LAT_MAX - (y_pct / 100) * latSpan;

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
