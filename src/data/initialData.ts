import { Gathering, POI, UserProfile } from '../types';
import { createLocationFromGps } from '../utils/coordinates';

// 거제 주요 8개 POI (소모임 단골 장소)
export const INITIAL_POIS: POI[] = [
  {
    id: 'poi_gujora',
    name: '구조라해수욕장',
    category: 'beach',
    position: createLocationFromGps(34.78523, 128.67094),
    metadata: {
      description: '모래가 곱고 수심이 완만한 해변, 샛바람소릿길과 유람선 선착장이 인접해 있습니다.',
      safety_info: '여름철 안전요원 상주, 샤워장 완비',
      recommended_activities: ['해변 피크닉', '트레킹', '패들보드'],
    },
  },
  {
    id: 'poi_windy_hill',
    name: '바람의언덕 & 신선대',
    category: 'attraction',
    position: createLocationFromGps(34.74955, 128.64731),
    metadata: {
      description: '거제 대표 랜드마크 풍차와 탁 트인 남해 바다 뷰를 감상할 수 있는 명소입니다.',
      safety_info: '바람이 강할 수 있으니 모자 및 소지품 주의',
      recommended_activities: ['풍경 사진 촬영', '바람의 핫도그 시식'],
    },
  },
  {
    id: 'poi_hakdong',
    name: '학동흑진주몽돌해변',
    category: 'beach',
    position: createLocationFromGps(34.77095, 128.64731),
    metadata: {
      description: '흑진주 같은 검은 몽돌과 맑은 파도 소리가 매력적인 해변입니다.',
      safety_info: '몽돌 반출 금지, 경사가 급하므로 물놀이 시 주의',
      recommended_activities: ['몽돌 파도 소리 ASMR', '야간 힐링 산책'],
    },
  },
  {
    id: 'poi_maemi',
    name: '매미성',
    category: 'attraction',
    position: createLocationFromGps(34.98187, 128.71832),
    metadata: {
      description: '태풍 매미 이후 홀로 쌓아 올린 웅장한 화강암 해안 성벽입니다.',
      safety_info: '성벽 계단 보행 시 낙상 주의',
      recommended_activities: ['인생샷 포토존', '오션뷰 카페 투어'],
    },
  },
  {
    id: 'poi_gonggoji',
    name: '공곶이 (수선화 군락)',
    category: 'nature',
    position: createLocationFromGps(34.80211, 128.72912),
    metadata: {
      description: '동백나무 터널과 봄철 노란 수선화가 바다와 어우러지는 비밀 정원입니다.',
      safety_info: '가파른 돌계단 코스, 운동화 필수',
      recommended_activities: ['동백 숲길 걷기', '내도 조망'],
    },
  },
  {
    id: 'poi_jungledome',
    name: '거제 식물원 (정글돔)',
    category: 'nature',
    position: createLocationFromGps(34.86981, 128.58312),
    metadata: {
      description: '국내 최대 규모의 유리온실 정글돔으로 열대 식물과 새둥지 포토존이 있습니다.',
      safety_info: '실내 고온다습, 수분 섭취 권장',
      recommended_activities: ['온실 포토존', '식물 관람'],
    },
  },
  {
    id: 'poi_gohyeon_terminal',
    name: '고현 버스터미널 (집결지)',
    category: 'transport',
    position: createLocationFromGps(34.88725, 128.62341),
    metadata: {
      description: '거제 시내 중심 교통 허브로 카풀 및 단체 집결지로 자주 활용됩니다.',
      safety_info: '주변 공영주차장 이용 권장',
      recommended_activities: ['회원 카풀 합승', '모임 전 장보기'],
    },
  },
  {
    id: 'poi_okpo_park',
    name: '옥포중앙공원',
    category: 'nature',
    position: createLocationFromGps(34.89531, 128.69421),
    metadata: {
      description: '옥포만이 내려다보이는 도심 속 휴식 공원으로 밤 풍경이 아름답습니다.',
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
    description: '초가을 바람을 맞으며 구조라 샛바람소릿길을 함께 걷고 모래사장에서 가벼운 피크닉을 즐깁니다.\n\n준비물: 개인 텀블러, 편한 신발, 돗자리 지참 환영',
    fee: 15000,
    maxParticipants: 15,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
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
    description: '매미성 성벽에서 단체 인생샷을 남기고 인근 카페에서 담소를 나눕니다.\n\n준비물: 카메라 or 스마트폰 완충',
    fee: 10000,
    maxParticipants: 8,
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
    description: '한여름 노을과 몽돌 파도 소리를 들으며 상반기 활동을 돌아봅니다.\n\n준비물: 시원한 음료 및 야간 겉옷',
    fee: 20000,
    maxParticipants: 12,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
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
    email: 'iseohyun@hanmail.net',
    displayName: '모임장 이서현',
    role: 'ADMIN',
    approvedAt: '2026-01-01T00:00:00Z',
    createdAt: '2026-01-01T00:00:00Z',
  },
  member: {
    uid: 'member_kim',
    email: 'kim_bada@geoje.com',
    displayName: '김바다 (정회원)',
    role: 'MEMBER',
    approvedAt: '2026-02-15T00:00:00Z',
    createdAt: '2026-02-10T00:00:00Z',
  },
  guest: {
    uid: 'guest_park',
    email: 'park_new@naver.com',
    displayName: '박초보 (게스트)',
    role: 'GUEST',
    createdAt: '2026-08-18T00:00:00Z',
  },
};
