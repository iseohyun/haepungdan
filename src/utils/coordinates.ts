import { LocationPosition } from '../types';

/**
 * [거제도 정적 지도 기반 POI 오버레이 시스템 명세서]
 * Geographic Extent (EPSG:4326 / WGS84)
 *
 * 2026-08-21 관리자 모드 정밀 실측 보정 (ΔX = -6.00px [-0.8559%], ΔY = +8.00px [+0.9756%]):
 *   LNG: LNG_MIN = 128.392944, LNG_MAX = 128.751429
 *   LAT: LAT_MAX = 35.057672, LAT_MIN = 34.680670
 */
export const GEOJE_BOUNDS = {
  LAT_MAX: 35.057672, // 북위 (정밀 보정)
  LAT_MIN: 34.680670, // 남위 (정밀 보정)
  LNG_MIN: 128.392944, // 서경 (정밀 보정)
  LNG_MAX: 128.751429, // 동경 (정밀 보정)
  ASPECT_RATIO: 701 / 820,
} as const;

/**
 * GPS (Lat, Lng) -> CSS 백분율 위치 (x_pct, y_pct)
 * 보정된 GEOJE_BOUNDS 사용
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

export interface NavigationLocationInput {
  lat: number;
  lng: number;
  name?: string;
  locationName?: string;
  detail?: string;
  locationDetail?: string;
  address?: string;
  roadAddress?: string;
  jibunAddress?: string;
  kakaoAddress?: string;
  naverAddress?: string;
  tmapAddress?: string;
  mapAddress?: { kakao?: string; naver?: string; tmap?: string; [key: string]: string | undefined } | string;
}

/**
 * [위치 안내 및 길찾기 3단계 우선순위 해결 함수]
 * 1. 해당 지도의 주소가 있다면, 해당 주소로 안내 (1순위)
 * 2. 대표 주소가 있다면, 대표 주소로 안내 (2순위)
 * 3. 아무것도 없다면 GPS 정보로 안내 (3순위)
 */
export function resolveLocationGuide(
  loc: NavigationLocationInput,
  mapType?: 'kakao' | 'naver' | 'tmap'
): {
  destinationName: string;
  displayAddress: string;
  guideType: 'specific_map_address' | 'primary_address' | 'gps';
  badgeLabel: string;
} {
  const placeName = loc.locationName || loc.name || '집결장소';

  // 1. 해당 지도의 전용 주소 (1순위)
  let specificMapAddress: string | undefined;
  if (mapType === 'kakao') {
    specificMapAddress = loc.kakaoAddress;
  } else if (mapType === 'naver') {
    specificMapAddress = loc.naverAddress;
  } else if (mapType === 'tmap') {
    specificMapAddress = loc.tmapAddress;
  }

  if (!specificMapAddress && loc.mapAddress) {
    if (typeof loc.mapAddress === 'object' && mapType) {
      specificMapAddress = loc.mapAddress[mapType];
    } else if (typeof loc.mapAddress === 'string') {
      specificMapAddress = loc.mapAddress;
    }
  }

  if (specificMapAddress && specificMapAddress.trim()) {
    return {
      destinationName: specificMapAddress.trim(),
      displayAddress: specificMapAddress.trim(),
      guideType: 'specific_map_address',
      badgeLabel: mapType ? `${mapType.toUpperCase()} 지정주소` : '지정주소',
    };
  }

  // 2. 대표 주소 (2순위)
  const primaryAddress =
    loc.roadAddress ||
    loc.address ||
    loc.jibunAddress ||
    (loc.locationDetail && loc.locationDetail.trim().length > 3 ? loc.locationDetail : undefined);

  if (primaryAddress && primaryAddress.trim()) {
    return {
      destinationName: primaryAddress.trim(),
      displayAddress: primaryAddress.trim(),
      guideType: 'primary_address',
      badgeLabel: '대표주소',
    };
  }

  // 3. 아무것도 없다면 GPS 정보 (3순위)
  const gpsCoordText = `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)}`;
  const gpsDisplay = `${loc.lat.toFixed(5)}°N, ${loc.lng.toFixed(5)}°E`;
  return {
    destinationName: placeName !== '집결장소' ? `${placeName} (${gpsCoordText})` : gpsCoordText,
    displayAddress: gpsDisplay,
    guideType: 'gps',
    badgeLabel: 'GPS 좌표',
  };
}

/**
 * 카카오맵 길찾기 URL 생성
 */
export function getKakaoMapUrl(
  latOrLoc: number | NavigationLocationInput,
  lng?: number,
  placeName?: string
): string {
  if (typeof latOrLoc === 'object') {
    const guide = resolveLocationGuide(latOrLoc, 'kakao');
    const encDest = encodeURIComponent(guide.destinationName);
    return `https://map.kakao.com/link/to/${encDest},${latOrLoc.lat},${latOrLoc.lng}`;
  }
  const encName = encodeURIComponent(placeName || '목적지');
  return `https://map.kakao.com/link/to/${encName},${latOrLoc},${lng ?? 0}`;
}

/**
 * 네이버 지도 길찾기/검색 URL 생성
 * 형식: https://map.naver.com/p/search/${encodeURIComponent(주소 또는 명칭)}?c=15.00,0,0,0,dh
 */
export function getNaverMapUrl(
  latOrLoc: number | NavigationLocationInput,
  lng?: number,
  placeName?: string
): string {
  if (typeof latOrLoc === 'object') {
    const guide = resolveLocationGuide(latOrLoc, 'naver');
    const encDest = encodeURIComponent(guide.destinationName);
    return `https://map.naver.com/p/search/${encDest}?c=15.00,0,0,0,dh`;
  }
  const encName = encodeURIComponent(placeName || `${latOrLoc},${lng ?? 0}`);
  return `https://map.naver.com/p/search/${encName}?c=15.00,0,0,0,dh`;
}

/**
 * 티맵 (TMAP) 길찾기 URL 생성 (모바일 앱 스킴 지원)
 */
export function getTMapUrl(
  latOrLoc: number | NavigationLocationInput,
  lng?: number,
  placeName?: string
): string {
  if (typeof latOrLoc === 'object') {
    const guide = resolveLocationGuide(latOrLoc, 'tmap');
    const encDest = encodeURIComponent(guide.destinationName);
    return `tmap://route?goalname=${encDest}&goallon=${latOrLoc.lng}&goallat=${latOrLoc.lat}`;
  }
  const encName = encodeURIComponent(placeName || '목적지');
  return `tmap://route?goalname=${encName}&goallon=${lng ?? 0}&goallat=${latOrLoc}`;
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
