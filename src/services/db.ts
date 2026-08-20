import Dexie, { Table } from 'dexie';
import { Gathering, GatheringRSVP, GatheringReview, POI, SyncMetadata, UserProfile, GatheringStatus, RSVPStatus } from '../types';
import { INITIAL_GATHERINGS, INITIAL_POIS, MOCK_USERS } from '../data/initialData';

export class HaepungdanDatabase extends Dexie {
  pois!: Table<POI, string>;
  gatherings!: Table<Gathering, string>;
  rsvps!: Table<GatheringRSVP, string>;
  reviews!: Table<GatheringReview, string>;
  users!: Table<UserProfile, string>;
  syncMeta!: Table<SyncMetadata, string>;

  constructor() {
    super('haepungdan_db');

    this.version(1).stores({
      pois: 'id, category, name',
      gatherings: 'id, status, dateTime, locationName, updatedAt, isDeleted',
      rsvps: 'id, gatheringId, userId, status, updatedAt',
      reviews: 'id, gatheringId, userId, rating, createdAt, updatedAt',
      users: 'uid, email, role',
      syncMeta: 'key',
    });
  }

  /**
   * 초기 데이터베이스 시딩 (첫 접속 시 네트워크 쿼리 0회로 초기 로딩)
   */
  async seedInitialData(): Promise<void> {
    const poiCount = await this.pois.count();
    if (poiCount === 0) {
      await this.pois.bulkAdd(INITIAL_POIS);
    }

    const gatheringCount = await this.gatherings.count();
    if (gatheringCount === 0) {
      await this.gatherings.bulkAdd(INITIAL_GATHERINGS);
    }

    const userCount = await this.users.count();
    if (userCount === 0) {
      await this.users.bulkAdd(Object.values(MOCK_USERS));
    }

    const syncMeta = await this.syncMeta.get('lastSyncTimestamp');
    if (!syncMeta) {
      await this.syncMeta.put({
        key: 'lastSyncTimestamp',
        value: new Date().toISOString(),
      });
    }
  }

  /**
   * 모임 상태 전이 업데이트
   */
  async updateGatheringStatus(gatheringId: string, newStatus: GatheringStatus): Promise<void> {
    await this.gatherings.update(gatheringId, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 모임 삭제 (Local-First 캐시 동기화를 위한 Soft Delete)
   */
  async softDeleteGathering(gatheringId: string): Promise<void> {
    await this.gatherings.update(gatheringId, {
      isDeleted: true,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * RSVP 참여 응답 제출 또는 갱신
   */
  async submitRsvp(
    gatheringId: string,
    userId: string,
    userName: string,
    userAvatar: string | undefined,
    status: RSVPStatus,
    comment?: string
  ): Promise<void> {
    const existing = await this.rsvps
      .where({ gatheringId, userId })
      .first();

    const now = new Date().toISOString();

    if (existing) {
      await this.rsvps.update(existing.id, {
        status,
        comment: comment !== undefined ? comment : existing.comment,
        userName,
        userAvatar,
        updatedAt: now,
      });
    } else {
      const newRsvp: GatheringRSVP = {
        id: `rsvp_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        gatheringId,
        userId,
        userName,
        userAvatar,
        status,
        comment: comment || '',
        updatedAt: now,
      };
      await this.rsvps.add(newRsvp);
    }

    // 모임의 updatedAt 갱신
    await this.gatherings.update(gatheringId, {
      updatedAt: now,
    });
  }

  /**
   * 모임 후기 등록
   */
  async addReview(reviewData: Omit<GatheringReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<GatheringReview> {
    const now = new Date().toISOString();
    const newReview: GatheringReview = {
      ...reviewData,
      id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      updatedAt: now,
    };

    await this.reviews.add(newReview);

    // 모임의 updatedAt 갱신
    await this.gatherings.update(reviewData.gatheringId, {
      updatedAt: now,
    });

    return newReview;
  }

  /**
   * 모임 후기 삭제
   */
  async deleteReview(reviewId: string, gatheringId: string): Promise<void> {
    await this.reviews.delete(reviewId);
    await this.gatherings.update(gatheringId, {
      updatedAt: new Date().toISOString(),
    });
  }
}

export const db = new HaepungdanDatabase();

// 앱 시작 시 자동 시딩 실행
db.on('ready', async () => {
  await db.seedInitialData();
});
