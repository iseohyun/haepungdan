import { Gathering, POI, UserProfile } from '../types';
import { createLocationFromGps } from '../utils/coordinates';

// 거제도 대표 추천 POI 8개소
export const INITIAL_POIS: POI[] = [
  {
    id: 'poi_gujora',
    name: '구조라해수욕장',
    category: 'beach',
    position: createLocationFromGps(34.78523, 128.67094),
    metadata: {
      description: '모래가 곱고 수심이 완만하여 물놀이 및 야외 소모임에 최적인 해변',
      safety_info: '여름철 안전요원 상주, 샤워장 완비',
      recommended_activities: ['피크닉', '해변 산책', '모임 사진 촬영'],
    },
  },
  {
    id: 'poi_wind_hill',
    name: '바람의 언덕',
    category: 'attraction',
    position: createLocationFromGps(34.75782, 128.62768),
    metadata: {
      description: '거제의 대표 랜드마크. 도장포 유람선 선착장과 바다 풍차가 한눈에 보이는 명소',
      safety_info: '바람이 강할 수 있으므로 모자 등 소지품 주의',
      recommended_activities: ['풍경 감상', '단체 단체사진', '바람의핫도그'],
    },
  },
  {
    id: 'poi_hakdong',
    name: '학동흑진주몽돌해변',
    category: 'beach',
    position: createLocationFromGps(34.77095, 128.64731),
    metadata: {
      description: '몽돌 굴러가는 파도 소리가 아름다운 흑진주 몽돌 해안',
      safety_info: '몽돌 반출 금지, 몽돌 위 보행 시 미끄럼 주의',
      recommended_activities: ['파도 소리 힐링', '해안로 산책', '카페 모임'],
    },
  },
  {
    id: 'poi_maemi',
    name: '매미성',
    category: 'attraction',
    position: createLocationFromGps(34.98187, 128.71832),
    metadata: {
      description: '태풍 매미 이후 시민이 직접 쌓아 올린 이국적인 석성',
      safety_info: '성벽 난간 추락 주의, 계단 이동 시 주의',
      recommended_activities: ['인생샷 촬영', '인근 오션뷰 카페 탐방'],
    },
  },
  {
    id: 'poi_gonggoji',
    name: '공곶이',
    category: 'nature',
    position: createLocationFromGps(34.77954, 128.70425),
    metadata: {
      description: '동백나무 터널과 수선화가 아름다운 남해 바다의 비밀 정원',
      safety_info: '경사가 다소 있으므로 편한 운동화 필수',
      recommended_activities: ['트레킹', '자연 생태 관찰'],
    },
  },
  {
    id: 'poi_gohyeon_terminal',
    name: '고현버스터미널',
    category: 'transport',
    position: createLocationFromGps(34.88795, 128.62341),
    metadata: {
      description: '거제 시내 중심 교통 허브. 외부 멤버 집결 및 카풀 장소',
      safety_info: '주차장 및 승하차 구역 혼잡 주의',
      recommended_activities: ['모임 1차 집결', '카풀 출발'],
    },
  },
  {
    id: 'poi_jungledome',
    name: '거제식물원 정글돔',
    category: 'nature',
    position: createLocationFromGps(34.84650, 128.58310),
    metadata: {
      description: '국내 최대 돔형 열대 온실. 우천 시에도 쾌적하게 모임 진행 가능',
      safety_info: '내부 온도가 따뜻하므로 가벼운 복장 권장',
      recommended_activities: ['우천 대체 모임', '식물 관람', '포토존'],
    },
  },
  {
    id: 'poi_okpo_park',
    name: '옥포항 수변공원',
    category: 'attraction',
    position: createLocationFromGps(34.89642, 128.69450),
    metadata: {
      description: '야경과 바다 산책로가 조성된 도심형 해변 공원',
      safety_info: '야간 산책로 조명 양호',
      recommended_activities: ['저녁 번개 모임', '러닝 및 산책'],
    },
  },
];

// 초기 샘플 모임 데이터
export const INITIAL_GATHERINGS: Gathering[] = [
  {
    id: 'gat_2026_09_01',
    title: '제12회 해풍단 가을 바다 트레킹 & 피크닉',
    status: 'RECRUITING',
    dateTime: '2026-09-12T10:30:00+09:00',
    locationName: '구조라해수욕장',
    locationDetail: '구조라 유람선 주차장 앞 정자',
    position: createLocationFromGps(34.78523, 128.67094),
    proposal: {
      description: '초가을 바람을 맞으며 구조라 샛바람소릿길을 함께 걷고 모래사장에서 가벼운 피크닉을 즐깁니다.',
      budgetEstimate: 15000,
      preparationNotes: '개인 텀블러, 편한 신발, 돗자리 지참 환영',
    },
    videoUrls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    createdBy: 'admin_user',
    createdByName: '모임장 이서현',
    createdAt: '2026-08-15T09:00:00+09:00',
    updatedAt: '2026-08-18T14:20:00+09:00',
  },
  {
    id: 'gat_2026_09_02',
    title: '매미성 출사 및 오션뷰 카페 번개',
    status: 'PROPOSED',
    dateTime: '2026-09-26T14:00:00+09:00',
    locationName: '매미성',
    locationDetail: '매미성 입구 몽돌해변',
    position: createLocationFromGps(34.98187, 128.71832),
    proposal: {
      description: '매미성 성벽에서 단체 인생샷을 남기고 인근 카페에서 담소를 나눕니다.',
      budgetEstimate: 10000,
      preparationNotes: '카메라 or 스마트폰 완충',
    },
    videoUrls: [],
    createdBy: 'member_kim',
    createdByName: '김바다',
    createdAt: '2026-08-17T11:00:00+09:00',
    updatedAt: '2026-08-17T11:00:00+09:00',
  },
  {
    id: 'gat_2026_08_past',
    title: '제11회 한여름 몽돌 소리 힐링 나이트',
    status: 'COMPLETED',
    dateTime: '2026-08-08T18:30:00+09:00',
    locationName: '학동흑진주몽돌해변',
    locationDetail: '학동 오토캠핑장 인근 해변',
    position: createLocationFromGps(34.77095, 128.64731),
    proposal: {
      description: '한여름 노을과 몽돌 파도 소리를 들으며 상반기 활동을 돌아봅니다.',
      budgetEstimate: 20000,
      preparationNotes: '시원한 음료 및 야간 겉옷',
    },
    videoUrls: ['https://www.youtube.com/watch?v=dQw4w9WgXcQ'],
    createdBy: 'admin_user',
    createdByName: '모임장 이서현',
    createdAt: '2026-07-20T10:00:00+09:00',
    updatedAt: '2026-08-09T10:00:00+09:00',
  },
];

// 기본 Mock 사용자들 (시연 및 개발용)
export const MOCK_USERS: Record<string, UserProfile> = {
  admin: {
    uid: 'admin_user',
    email: 'admin@haepungdan.org',
    displayName: '이서현 (모임장)',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop',
    role: 'ADMIN',
    approvedAt: '2026-01-01T00:00:00+09:00',
    createdAt: '2026-01-01T00:00:00+09:00',
  },
  member: {
    uid: 'member_kim',
    email: 'bada.kim@example.com',
    displayName: '김바다 (정회원)',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    role: 'MEMBER',
    approvedAt: '2026-02-15T12:00:00+09:00',
    createdAt: '2026-02-10T10:00:00+09:00',
  },
  guest: {
    uid: 'guest_park',
    email: 'guest.park@example.com',
    displayName: '박초보 (게스트/대기)',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    role: 'GUEST',
    createdAt: '2026-08-19T08:00:00+09:00',
  },
};
