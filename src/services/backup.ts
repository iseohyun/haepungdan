import { db } from './db';
import { Gathering, GatheringRSVP, GatheringReview, POI, UserProfile } from '../types';

export interface BackupData {
  version: number;
  exportedAt: string;
  pois: POI[];
  gatherings: Gathering[];
  rsvps: GatheringRSVP[];
  reviews: GatheringReview[];
  users: UserProfile[];
}

/**
 * IndexedDB의 모든 데이터를 JSON 파일로 다운로드 (Export)
 */
export async function exportDatabaseToJson(): Promise<void> {
  const [pois, gatherings, rsvps, reviews, users] = await Promise.all([
    db.pois.toArray(),
    db.gatherings.toArray(),
    db.rsvps.toArray(),
    db.reviews.toArray(),
    db.users.toArray(),
  ]);

  const backupData: BackupData = {
    version: 1,
    exportedAt: new Date().toISOString(),
    pois,
    gatherings,
    rsvps,
    reviews,
    users,
  };

  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  const dateStr = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `haepungdan_backup_${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * JSON 파일로부터 IndexedDB 복구 (Import)
 */
export async function importDatabaseFromJson(file: File): Promise<{ success: boolean; message: string }> {
  try {
    const text = await file.text();
    const data: BackupData = JSON.parse(text);

    if (!data.pois || !data.gatherings) {
      throw new Error('유효하지 않은 해풍단 백업 파일 형식입니다.');
    }

    await db.transaction('rw', [db.pois, db.gatherings, db.rsvps, db.reviews, db.users, db.syncMeta], async () => {
      await db.pois.clear();
      await db.gatherings.clear();
      await db.rsvps.clear();
      await db.reviews.clear();
      await db.users.clear();

      if (data.pois.length > 0) await db.pois.bulkAdd(data.pois);
      if (data.gatherings.length > 0) await db.gatherings.bulkAdd(data.gatherings);
      if (data.rsvps && data.rsvps.length > 0) await db.rsvps.bulkAdd(data.rsvps);
      if (data.reviews && data.reviews.length > 0) await db.reviews.bulkAdd(data.reviews);
      if (data.users && data.users.length > 0) await db.users.bulkAdd(data.users);

      await db.syncMeta.put({
        key: 'lastSyncTimestamp',
        value: data.exportedAt || new Date().toISOString(),
      });
    });

    return { success: true, message: `성공적으로 데이터를 복원했습니다. (모임 ${data.gatherings.length}건, POI ${data.pois.length}건)` };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
    return { success: false, message: `백업 파일 복구 실패: ${message}` };
  }
}
