// 1. 위치 및 GIS 좌표 타입 (백분율 + GPS WGS84)
export interface LocationPosition {
  x_pct: number; // 0.0 ~ 100.0 (map.jpg 이미지 기준 가로 백분율)
  y_pct: number; // 0.0 ~ 100.0 (map.jpg 이미지 기준 세로 백분율)
  lat: number;   // WGS84 위도 (예: 34.78523)
  lng: number;   // WGS84 경도 (예: 128.67094)
}

// 2. 추천 POI (거제 주요 거점)
export interface POI {
  id: string;
  name: string;
  category: 'beach' | 'attraction' | 'nature' | 'transport' | 'food';
  position: LocationPosition;
  metadata?: {
    description?: string;
    safety_info?: string;
    recommended_activities?: string[];
  };
}

// 3. 모임 상태
export type GatheringStatus = 'PROPOSED' | 'RECRUITING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

// 4. 모임 데이터 인터페이스
export interface Gathering {
  id: string;
  title: string;
  status: GatheringStatus;
  dateTime: string;            // ISO 8601 일시 (예: "2026-09-10T14:00:00+09:00")
  locationName: string;        // 장소명 (예: "구조라해수욕장")
  locationDetail?: string;     // 상세 주소 / 집결 장소
  position: LocationPosition;  // 지도 오버레이 및 GPS 위치
  proposal: {
    description: string;       // 기획 내용 / 활동 계획
    budgetEstimate?: number;   // 예상 회비/예산 (원)
    preparationNotes?: string; // 준비물 / 주의사항
  };
  videoUrls: string[];         // YouTube 등 비디오 링크
  createdBy: string;           // 작성자 UID
  createdByName: string;       // 작성자 이름
  createdAt: string;           // 생성 일시
  updatedAt: string;           // 마지막 수정 일시 (증분 동기화 기준)
  isDeleted?: boolean;         // 소프트 삭제 플래그
}

// 5. 참여 응답 (RSVP)
export type RSVPStatus = 'ATTENDING' | 'ABSENT' | 'UNDECIDED';

export interface GatheringRSVP {
  id: string;                  // `${gatheringId}_${userId}`
  gatheringId: string;
  userId: string;
  userName: string;
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
  userPhotoUrl?: string;
  content: string;
  rating?: number;             // 1 ~ 5점
  photos: {
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
  createdAt: string;
}

// 8. 동기화 메타데이터
export interface SyncMetadata {
  key: string;                 // 'lastSyncTimestamp'
  value: string;               // ISO 8601
}
