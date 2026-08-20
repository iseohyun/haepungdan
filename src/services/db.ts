import Dexie, { Table } from 'dexie';
import { Gathering, GatheringRSVP, GatheringReview, POI, SyncMetadata, UserProfile } from '../types';
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
}

export const db = new HaepungdanDatabase();

// 앱 시작 시 자동 시딩 실행
db.on('ready', async () => {
  await db.seedInitialData();
});
