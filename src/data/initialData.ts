import { Gathering, UserProfile } from '../types';

// 초기 모임 데이터 (실제 데이터는 Firebase Firestore 및 사용자 입력을 통해서만 생성)
export const INITIAL_GATHERINGS: Gathering[] = [];



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
