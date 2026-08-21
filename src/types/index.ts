// 1. 위치 및 GIS 좌표 타입 (백분율 + GPS WGS84)
export interface LocationPosition {
  x_pct: number; // 0.0 ~ 100.0 (map.jpg 이미지 기준 가로 백분율)
  y_pct: number; // 0.0 ~ 100.0 (map.jpg 이미지 기준 세로 백분율)
  lat: number;   // WGS84 위도 (예: 34.78523)
  lng: number;   // WGS84 경도 (예: 128.67094)
}

// 2. 모임 상태
export type GatheringStatus = 'PROPOSED' | 'RECRUITING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// 3. 모임 데이터 인터페이스
export interface Gathering {
  id: string;
  roundNumber?: number;        // 모임 회차 (숫자만)
  title: string;
  status: GatheringStatus;
  dateTime: string;            // ISO 8601 일시 (예: "2026-09-10T06:00:00+09:00")
  locationPresetId?: string;   // 참조하는 지정주소 마스터 ID (선택 시)
  locationName: string;        // 장소명 (예: "구조라해수욕장")
  locationDetail?: string;     // 상세 주소 / 집결 장소
  address?: string;            // 대표 주소 (도로명 주소 등)
  roadAddress?: string;        // 도로명 주소
  jibunAddress?: string;       // 지번 주소
  kakaoAddress?: string;       // 카카오맵 전용 주소
  naverAddress?: string;       // 네이버 지도 전용 주소
  tmapAddress?: string;        // 티맵 전용 주소
  mapAddress?: { kakao?: string; naver?: string; tmap?: string; [key: string]: string | undefined } | string;
  position: LocationPosition;  // 지도 오버레이 및 GPS 위치
  description: string;         // 모임 설명 및 계획
  fee?: number;                // 참가비 (원, 0=무료)
  maxParticipants?: number;    // 최대 참가 정원
  thumbnailUrl?: string;       // 대표 썸네일 이미지 (WebP Data URL)
  videoUrl?: string;           // YouTube 영상 또는 Shorts 링크
  videoUrls?: string[];        // 추가 비디오 링크들
  cloudUrl?: string;           // 클라우드 자료 링크 (Google Drive, Notion 등)
  createdBy: string;           // 작성자 UID
  createdByName: string;       // 작성자 이름
  createdAt: string;           // 생성 일시
  updatedAt: string;           // 마지막 수정 일시 (증분 동기화 기준)
  labelOffset?: { dx: number; dy: number }; // 지도 위 커스텀 레이블 상대 좌표 오프셋 (웹/PC, px)
  labelOffsetMobile?: { dx: number; dy: number }; // 지도 위 커스텀 레이블 상대 좌표 오프셋 (모바일 전용, px)
  isDeleted?: boolean;         // 소프트 삭제 플래그
}

// 4. 집결위치 및 좌표 프리셋 DB 인터페이스
export interface LocationPreset {
  id: string;
  name: string;                // 장소명 (예: "구조라해수욕장")
  detail?: string;              // 상세 집결위치 (예: "해변 중앙 파라솔 앞")
  address?: string;            // 대표 주소 (도로명 주소 등)
  roadAddress?: string;        // 도로명 주소
  jibunAddress?: string;       // 지번 주소
  kakaoAddress?: string;       // 카카오맵 전용 주소
  naverAddress?: string;       // 네이버 지도 전용 주소
  tmapAddress?: string;        // 티맵 전용 주소
  mapAddress?: { kakao?: string; naver?: string; tmap?: string; [key: string]: string | undefined } | string;
  lat: number;
  lng: number;
  position: LocationPosition;
  createdAt?: string;
  updatedAt?: string;
}

// 5. 참여 응답 (RSVP)
export type RSVPStatus = 'ATTENDING' | 'ABSENT' | 'UNDECIDED';

export interface GatheringRSVP {
  id: string;                  // `${gatheringId}_${userId}`
  gatheringId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userPhotoUrl?: string;
  status: RSVPStatus;
  comment?: string;
  updatedAt: string;
}

// 6. 모임 후기 및 갤러리
export interface GatheringReview {
  id: string;
  gatheringId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userPhotoUrl?: string;
  content: string;
  rating: number;              // 1 ~ 5점
  images?: string[];           // WebP Data URL 배열
  photos?: {
    url: string;
    thumbnailUrl?: string;
    caption?: string;
  }[];
  createdAt: string;
  updatedAt: string;
}

// 7. 사용자 프로필 및 권한
export type UserRole = 'UNAUTHENTICATED' | 'GUEST' | 'MEMBER' | 'ADMIN';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  approvedAt?: string;
  lastLoginAt?: string; // 최근 로그인 일시 (ISO 8601)
  createdAt: string;
}

// 8. 동기화 메타데이터
export interface SyncMetadata {
  key: string;                 // 'lastSyncTimestamp'
  value: string;               // ISO 8601
}
