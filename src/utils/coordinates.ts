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
 * 카카오맵 길찾기 / 장소 링크 생성
 */
export function getKakaoMapUrl(lat: number, lng: number, name?: string): string {
  const encodedName = encodeURIComponent(name || '목적지');
  return `https://map.kakao.com/link/to/${encodedName},${lat},${lng}`;
}

/**
 * 네이버지도 길찾기 링크 생성
 */
export function getNaverMapUrl(lat: number, lng: number, name?: string): string {
  const encodedName = encodeURIComponent(name || '목적지');
  return `https://map.naver.com/v5/search/${encodedName}?c=${lng},${lat},15,0,0,0,dh`;
}

/**
 * T맵 길찾기 웹 링크 생성
 */
export function getTMapUrl(lat: number, lng: number, name?: string): string {
  const encodedName = encodeURIComponent(name || '목적지');
  return `https://tmap.co.kr/tmap2/mobile/route.jsp?name=${encodedName}&lat=${lat}&lon=${lng}`;
}
