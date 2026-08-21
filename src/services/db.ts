import Dexie, { Table } from 'dexie';
import { Gathering, GatheringRSVP, GatheringReview, SyncMetadata, UserProfile, GatheringStatus, RSVPStatus, LocationPreset } from '../types';
import { MOCK_USERS } from '../data/initialData';

export class HaepungdanDatabase extends Dexie {
  gatherings!: Table<Gathering, string>;
  rsvps!: Table<GatheringRSVP, string>;
  reviews!: Table<GatheringReview, string>;
  users!: Table<UserProfile, string>;
  syncMeta!: Table<SyncMetadata, string>;
  locationPresets!: Table<LocationPreset, string>;

  constructor() {
    super('haepungdan_db');

    this.version(4).stores({
      gatherings: 'id, roundNumber, status, dateTime, locationName, updatedAt, isDeleted',
      rsvps: 'id, gatheringId, userId, status, updatedAt',
      reviews: 'id, gatheringId, userId, rating, createdAt, updatedAt',
      users: 'uid, email, role',
      syncMeta: 'key',
      locationPresets: 'id, name, detail, address, roadAddress, lat, lng, updatedAt',
    });
  }

  /**
   * 초기 데이터베이스 시딩
   */
  async seedInitialData(): Promise<void> {
    const userCount = await this.users.count();
    if (userCount === 0) {
      await this.users.bulkAdd(Object.values(MOCK_USERS));
    }

    // locationPresets 초기 데이터 마이그레이션 (gatherings에 등록된 위치들 추출)
    const presetCount = await this.locationPresets.count();
    if (presetCount === 0) {
      const allGatherings = await this.gatherings.toArray();
      const presetsToInsert: LocationPreset[] = [];
      const seenKeys = new Set<string>();

      for (const g of allGatherings) {
        if (!g.isDeleted && g.locationName && g.position) {
          const locKey = `loc_${g.locationName.trim()}_${g.position.lat.toFixed(4)}_${g.position.lng.toFixed(4)}`;
          if (!seenKeys.has(locKey)) {
            seenKeys.add(locKey);
            presetsToInsert.push({
              id: locKey,
              name: g.locationName,
              detail: g.locationDetail || '',
              address: g.address || '',
              roadAddress: g.roadAddress || '',
              kakaoAddress: g.kakaoAddress || '',
              naverAddress: g.naverAddress || '',
              tmapAddress: g.tmapAddress || '',
              lat: g.position.lat,
              lng: g.position.lng,
              position: g.position,
              createdAt: g.createdAt || new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
      }

      if (presetsToInsert.length > 0) {
        await this.locationPresets.bulkPut(presetsToInsert);
      }
    }

    const syncMeta = await this.syncMeta.get('lastSyncTimestamp');
    if (!syncMeta) {
      await this.syncMeta.put({
        key: 'lastSyncTimestamp',
        value: '1970-01-01T00:00:00.000Z',
      });
    }
  }

  /**
   * 지정주소(LocationPreset) 저장 및 업데이트
   */
  async upsertLocationPreset(preset: LocationPreset): Promise<void> {
    await this.locationPresets.put({
      ...preset,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * 지정주소(LocationPreset) 삭제
   */
  async deleteLocationPreset(presetId: string): Promise<void> {
    await this.locationPresets.delete(presetId);
  }




  /**
   * 모임 전체 정보 수정
   */
  async updateGathering(gatheringId: string, updates: Partial<Gathering>): Promise<void> {
    await this.gatherings.update(gatheringId, {
      ...updates,
      updatedAt: new Date().toISOString(),
    });
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
  }

  /**
   * 모임 후기 등록
   */
  async addReview(review: Omit<GatheringReview, 'id' | 'createdAt' | 'updatedAt'>): Promise<void> {
    const id = `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const newReview: GatheringReview = {
      ...review,
      id,
      createdAt: now,
      updatedAt: now,
    };

    await this.reviews.add(newReview);
  }

  /**
   * 모임 후기 삭제
   */
  async deleteReview(reviewId: string, _gatheringId: string): Promise<void> {
    await this.reviews.delete(reviewId);
  }
}

export const db = new HaepungdanDatabase();
