import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser,
  Auth,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  Firestore,
  writeBatch,
} from 'firebase/firestore';
import { db } from './db';
import { Gathering, GatheringRSVP, GatheringReview, LocationPreset, UserProfile } from '../types';



export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
}

// 해풍단 기본 공식 Firebase 설정
export const DEFAULT_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: "AIzaSyDibDuDh-K_lpplBnEOgD-1LxWNQjIF2_c",
  authDomain: "haepungdan.firebaseapp.com",
  projectId: "haepungdan",
  storageBucket: "haepungdan.firebasestorage.app",
  messagingSenderId: "97189054441",
  appId: "1:97189054441:web:940fa95af726c62098ed78",
  measurementId: "G-8V01H8KDTR"
};

class FirebaseService {
  private app: FirebaseApp | null = null;
  public auth: Auth | null = null;
  public firestore: Firestore | null = null;
  public isConfigured = false;

  constructor() {
    this.initFirebase();
  }

  /**
   * 소스코드에 정의된 해풍단 공식 Firebase 설정으로 초기화
   */
  public initFirebase(): boolean {
    try {
      const config: FirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY
        ? {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
            measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
          }
        : DEFAULT_FIREBASE_CONFIG;

      this.app = getApps().length === 0 ? initializeApp(config) : getApp();
      this.auth = getAuth(this.app);
      this.firestore = getFirestore(this.app);
      this.isConfigured = true;
      return true;
    } catch (err) {
      console.error('Firebase init failed:', err);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Google OAuth 팝업 로그인
   */
  public async loginWithGoogle(): Promise<FirebaseUser | null> {
    if (!this.auth) {
      this.initFirebase();
    }
    if (!this.auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    const result = await signInWithPopup(this.auth, provider);
    return result.user;
  }

  /**
   * 로그아웃
   */
  public async logout(): Promise<void> {
    if (this.auth) {
      await fbSignOut(this.auth);
    }
  }

  /**
   * 인증 상태 변경 리스너
   */
  public onAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
    if (!this.auth) return () => {};
    return fbOnAuthStateChanged(this.auth, callback);
  }

  /**
   * =========================================================================
   * 즉시 클라우드 동기화 헬퍼 (Direct Firestore Writes)
   * Firestore는 undefined 필드를 허용하지 않으므로 cleanForFirestore로 정제
   * =========================================================================
   */
  private cleanData<T>(data: T): T {
    return JSON.parse(JSON.stringify(data));
  }

  public async saveGatheringToCloud(gathering: Gathering): Promise<void> {
    if (!this.firestore) return;
    try {
      const ref = doc(this.firestore, 'gatherings', gathering.id);
      await setDoc(ref, this.cleanData(gathering), { merge: true });
    } catch (err) {
      console.warn('Firebase saveGatheringToCloud skipped:', err);
    }
  }

  public async saveRsvpToCloud(rsvp: GatheringRSVP): Promise<void> {
    if (!this.firestore) return;
    try {
      const ref = doc(this.firestore, 'rsvps', rsvp.id);
      await setDoc(ref, this.cleanData(rsvp), { merge: true });
    } catch (err) {
      console.warn('Firebase saveRsvpToCloud skipped:', err);
    }
  }


  public async saveReviewToCloud(review: GatheringReview): Promise<void> {
    if (!this.firestore) return;
    try {
      const ref = doc(this.firestore, 'reviews', review.id);
      await setDoc(ref, this.cleanData(review), { merge: true });
    } catch (err) {
      console.warn('Firebase saveReviewToCloud skipped:', err);
    }
  }

  public async deleteReviewFromCloud(reviewId: string): Promise<void> {
    if (!this.firestore) return;
    try {
      const ref = doc(this.firestore, 'reviews', reviewId);
      await deleteDoc(ref);
    } catch (err) {
      console.warn('Firebase deleteReviewFromCloud skipped:', err);
    }
  }

  public async saveLocationPresetToCloud(preset: LocationPreset): Promise<void> {
    if (!this.firestore) return;
    try {
      const ref = doc(this.firestore, 'locationPresets', preset.id);
      await setDoc(ref, this.cleanData(preset), { merge: true });
    } catch (err) {
      console.warn('Firebase saveLocationPresetToCloud skipped:', err);
    }
  }

  public async deleteLocationPresetFromCloud(presetId: string): Promise<void> {
    if (!this.firestore) return;
    try {
      const ref = doc(this.firestore, 'locationPresets', presetId);
      await deleteDoc(ref);
    } catch (err) {
      console.warn('Firebase deleteLocationPresetFromCloud skipped:', err);
    }
  }

  public async saveUserToCloud(user: UserProfile): Promise<void> {
    if (!this.firestore) return;
    try {
      const ref = doc(this.firestore, 'users', user.uid);
      await setDoc(ref, this.cleanData(user), { merge: true });
    } catch (err) {
      console.warn('Firebase saveUserToCloud skipped:', err);
    }
  }

  public async deleteUserFromCloud(uid: string): Promise<void> {
    if (!this.firestore) return;
    try {
      const ref = doc(this.firestore, 'users', uid);
      await deleteDoc(ref);
    } catch (err) {
      console.warn('Firebase deleteUserFromCloud skipped:', err);
    }
  }

  /**
   * =========================================================================
   * Local-First Delta Sync Engine (IndexedDB <-> Firestore 증분 동기화)
   * 모임, 상세 집결위치(locationPresets), RSVP, 후기(reviews), 회원(users) 전체 증분 동기화
   * =========================================================================
   */
  public async syncDelta(): Promise<{ pushed: number; pulled: number }> {
    if (!this.firestore) throw new Error('Firestore가 연결되지 않았습니다.');

    const now = new Date().toISOString();
    let pushedCount = 0;
    let pulledCount = 0;

    // Helper: ISO 문자열을 밀리초 타임스탬프로 안전 변환
    const parseTime = (iso?: string): number => (iso ? new Date(iso).getTime() : 0);

    // =========================================================================
    // 1. GATHERINGS: Last-Write-Wins (최종 수정 시점 비교 정밀 동기화)
    // =========================================================================
    try {
      const allLocalGatherings = await db.gatherings.toArray();
      const localGatheringsMap = new Map(allLocalGatherings.map((g) => [g.id, g]));

      const serverGatheringsSnap = await getDocs(collection(this.firestore, 'gatherings'));
      const serverGatheringsMap = new Map<string, Gathering>();
      serverGatheringsSnap.forEach((d) => {
        serverGatheringsMap.set(d.id, d.data() as Gathering);
      });

      const gatheringsToPush: Gathering[] = [];
      const gatheringsToPull: Gathering[] = [];

      // 1-1. 로컬 데이터 기준 비교
      for (const [id, localGat] of localGatheringsMap.entries()) {
        const serverGat = serverGatheringsMap.get(id);
        if (!serverGat) {
          // 서버에 없는 신규 모임 (삭제되지 않은 경우 PUSH)
          if (!localGat.isDeleted) {
            gatheringsToPush.push(localGat);
          }
        } else {
          // 둘 다 존재: updatedAt 타임스탬프 비교
          const localTime = parseTime(localGat.updatedAt);
          const serverTime = parseTime(serverGat.updatedAt);

          if (localTime > serverTime) {
            // 로컬이 더 최신 -> 서버로 PUSH
            gatheringsToPush.push(localGat);
          } else if (serverTime > localTime) {
            // 서버가 더 최신 -> 로컬로 PULL
            gatheringsToPull.push(serverGat);
          }
        }
      }

      // 1-2. 서버에만 존재하는 모임 다운로드
      for (const [id, serverGat] of serverGatheringsMap.entries()) {
        if (!localGatheringsMap.has(id)) {
          gatheringsToPull.push(serverGat);
        }
      }

      // PUSH 실행
      if (gatheringsToPush.length > 0) {
        const batch = writeBatch(this.firestore);
        for (const g of gatheringsToPush) {
          const ref = doc(this.firestore, 'gatherings', g.id);
          batch.set(ref, this.cleanData(g), { merge: true });
          pushedCount++;
        }
        await batch.commit();
      }

      // PULL 실행
      if (gatheringsToPull.length > 0) {
        await db.gatherings.bulkPut(gatheringsToPull);
        pulledCount += gatheringsToPull.length;
      }
    } catch (e) {
      console.warn('gatherings LWW sync error:', e);
    }

    // =========================================================================
    // 2. RSVPS: Last-Write-Wins 정밀 동기화
    // =========================================================================
    try {
      const localRsvps = await db.rsvps.toArray();
      const localRsvpsMap = new Map(localRsvps.map((r) => [r.id, r]));

      const serverRsvpsSnap = await getDocs(collection(this.firestore, 'rsvps'));
      const serverRsvpsMap = new Map<string, GatheringRSVP>();
      serverRsvpsSnap.forEach((d) => {
        serverRsvpsMap.set(d.id, d.data() as GatheringRSVP);
      });

      const rsvpsToPush: GatheringRSVP[] = [];
      const rsvpsToPull: GatheringRSVP[] = [];

      for (const [id, localRsvp] of localRsvpsMap.entries()) {
        const serverRsvp = serverRsvpsMap.get(id);
        if (!serverRsvp) {
          rsvpsToPush.push(localRsvp);
        } else {
          const localTime = parseTime(localRsvp.updatedAt);
          const serverTime = parseTime(serverRsvp.updatedAt);
          if (localTime > serverTime) {
            rsvpsToPush.push(localRsvp);
          } else if (serverTime > localTime) {
            rsvpsToPull.push(serverRsvp);
          }
        }
      }

      for (const [id, serverRsvp] of serverRsvpsMap.entries()) {
        if (!localRsvpsMap.has(id)) {
          rsvpsToPull.push(serverRsvp);
        }
      }

      if (rsvpsToPush.length > 0) {
        const batch = writeBatch(this.firestore);
        for (const r of rsvpsToPush) {
          const ref = doc(this.firestore, 'rsvps', r.id);
          batch.set(ref, this.cleanData(r), { merge: true });
          pushedCount++;
        }
        await batch.commit();
      }

      if (rsvpsToPull.length > 0) {
        await db.rsvps.bulkPut(rsvpsToPull);
        pulledCount += rsvpsToPull.length;
      }
    } catch (e) {
      console.warn('rsvps LWW sync error:', e);
    }

    // =========================================================================
    // 3. REVIEWS: Last-Write-Wins 정밀 동기화
    // =========================================================================
    try {
      const localReviews = await db.reviews.toArray();
      const localReviewsMap = new Map(localReviews.map((rev) => [rev.id, rev]));

      const serverReviewsSnap = await getDocs(collection(this.firestore, 'reviews'));
      const serverReviewsMap = new Map<string, GatheringReview>();
      serverReviewsSnap.forEach((d) => {
        serverReviewsMap.set(d.id, d.data() as GatheringReview);
      });

      const reviewsToPush: GatheringReview[] = [];
      const reviewsToPull: GatheringReview[] = [];

      for (const [id, localRev] of localReviewsMap.entries()) {
        const serverRev = serverReviewsMap.get(id);
        if (!serverRev) {
          reviewsToPush.push(localRev);
        } else {
          const localTime = parseTime(localRev.updatedAt);
          const serverTime = parseTime(serverRev.updatedAt);
          if (localTime > serverTime) {
            reviewsToPush.push(localRev);
          } else if (serverTime > localTime) {
            reviewsToPull.push(serverRev);
          }
        }
      }

      for (const [id, serverRev] of serverReviewsMap.entries()) {
        if (!localReviewsMap.has(id)) {
          reviewsToPull.push(serverRev);
        }
      }

      if (reviewsToPush.length > 0) {
        const batch = writeBatch(this.firestore);
        for (const rev of reviewsToPush) {
          const ref = doc(this.firestore, 'reviews', rev.id);
          batch.set(ref, this.cleanData(rev), { merge: true });
          pushedCount++;
        }
        await batch.commit();
      }

      if (reviewsToPull.length > 0) {
        await db.reviews.bulkPut(reviewsToPull);
        pulledCount += reviewsToPull.length;
      }
    } catch (e) {
      console.warn('reviews LWW sync error:', e);
    }

    // =========================================================================
    // 4. LOCATION PRESETS: 활성 모임 참조 프리셋 LWW 동기화 & 고아 프리셋 삭제
    // =========================================================================
    try {
      const allGatherings = await db.gatherings.toArray();
      const activeGatherings = allGatherings.filter((g) => !g.isDeleted);
      const usedPresetIds = new Set<string>();
      const usedPresetNames = new Set<string>();

      for (const g of activeGatherings) {
        if (g.locationPresetId) usedPresetIds.add(g.locationPresetId);
        if (g.locationName) usedPresetNames.add(g.locationName.trim());
      }

      const localPresets = await db.locationPresets.toArray();
      const localPresetsMap = new Map<string, LocationPreset>();

      for (const preset of localPresets) {
        const isUsed = usedPresetIds.has(preset.id) || (preset.name && usedPresetNames.has(preset.name.trim()));
        if (isUsed) {
          localPresetsMap.set(preset.id, preset);
        } else {
          // 미사용 프리셋 로컬 및 서버 삭제
          await db.locationPresets.delete(preset.id);
          const ref = doc(this.firestore, 'locationPresets', preset.id);
          await deleteDoc(ref).catch(() => {});
        }
      }

      const serverPresetsSnap = await getDocs(collection(this.firestore, 'locationPresets'));
      const serverPresetsMap = new Map<string, LocationPreset>();

      for (const d of serverPresetsSnap.docs) {
        const p = d.data() as LocationPreset;
        const isUsed = usedPresetIds.has(p.id) || (p.name && usedPresetNames.has(p.name?.trim() || ''));
        if (isUsed) {
          serverPresetsMap.set(p.id, p);
        } else {
          await deleteDoc(doc(this.firestore, 'locationPresets', p.id)).catch(() => {});
        }
      }

      const presetsToPush: LocationPreset[] = [];
      const presetsToPull: LocationPreset[] = [];

      for (const [id, localPreset] of localPresetsMap.entries()) {
        const serverPreset = serverPresetsMap.get(id);
        if (!serverPreset) {
          presetsToPush.push(localPreset);
        } else {
          const localTime = parseTime(localPreset.updatedAt);
          const serverTime = parseTime(serverPreset.updatedAt);
          if (localTime > serverTime) {
            presetsToPush.push(localPreset);
          } else if (serverTime > localTime) {
            presetsToPull.push(serverPreset);
          }
        }
      }

      for (const [id, serverPreset] of serverPresetsMap.entries()) {
        if (!localPresetsMap.has(id)) {
          presetsToPull.push(serverPreset);
        }
      }

      if (presetsToPush.length > 0) {
        const batch = writeBatch(this.firestore);
        for (const preset of presetsToPush) {
          const ref = doc(this.firestore, 'locationPresets', preset.id);
          batch.set(ref, this.cleanData(preset), { merge: true });
          pushedCount++;
        }
        await batch.commit();
      }

      if (presetsToPull.length > 0) {
        await db.locationPresets.bulkPut(presetsToPull);
        pulledCount += presetsToPull.length;
      }
    } catch (e) {
      console.warn('locationPresets LWW sync error:', e);
    }

    // =========================================================================
    // 5. USERS: 회원 프로필 및 등급(role) Last-Write-Wins 정밀 동기화
    // =========================================================================
    try {
      const localUsers = await db.users.toArray();
      const localUsersMap = new Map(localUsers.map((u) => [u.uid, u]));

      const serverUsersSnap = await getDocs(collection(this.firestore, 'users'));
      const serverUsersMap = new Map<string, UserProfile>();
      serverUsersSnap.forEach((d) => {
        serverUsersMap.set(d.id, d.data() as UserProfile);
      });

      const usersToPush: UserProfile[] = [];
      const usersToPull: UserProfile[] = [];

      for (const [uid, localUser] of localUsersMap.entries()) {
        const serverUser = serverUsersMap.get(uid);
        if (!serverUser) {
          usersToPush.push(localUser);
        } else {
          const localTime = parseTime(localUser.approvedAt || localUser.lastLoginAt || localUser.createdAt);
          const serverTime = parseTime(serverUser.approvedAt || serverUser.lastLoginAt || serverUser.createdAt);
          if (localTime > serverTime) {
            usersToPush.push(localUser);
          } else if (serverTime > localTime) {
            usersToPull.push(serverUser);
          }
        }
      }

      for (const [uid, serverUser] of serverUsersMap.entries()) {
        if (!localUsersMap.has(uid)) {
          usersToPull.push(serverUser);
        }
      }

      if (usersToPush.length > 0) {
        const batch = writeBatch(this.firestore);
        for (const user of usersToPush) {
          const ref = doc(this.firestore, 'users', user.uid);
          batch.set(ref, this.cleanData(user), { merge: true });
          pushedCount++;
        }
        await batch.commit();
      }

      if (usersToPull.length > 0) {
        await db.users.bulkPut(usersToPull);
        pulledCount += usersToPull.length;
      }
    } catch (e) {
      console.warn('users LWW sync error:', e);
    }

    // 6. 더미 데이터(매미성, 바람의 언덕, Mock 회원 등) 자동 정리
    await this.cleanLegacyDummyData();

    // 7. 동기화 타임스탬프 갱신
    await db.syncMeta.put({
      key: 'lastSyncTimestamp',
      value: now,
    });

    return { pushed: pushedCount, pulled: pulledCount };
  }

  /**
   * 과거 테스트용 더미 데이터(매미성, 바람의 언덕, Mock 유저 등) 클라우드 및 로컬 일괄 영구 삭제
   */
  async cleanLegacyDummyData(): Promise<void> {
    const dummyKeywords = ['매미성', '바람의 언덕', '바람의언덕', '도장포'];
    const dummyUserIds = ['admin_user', 'member_kim', 'guest_park'];

    try {
      // 1. locationPresets 정리
      const localPresets = await db.locationPresets.toArray();
      for (const p of localPresets) {
        const isDummy =
          dummyKeywords.some((k) => p.name?.includes(k) || p.detail?.includes(k)) ||
          p.id.includes('maemi') ||
          p.id.includes('wind');

        if (isDummy) {
          await db.locationPresets.delete(p.id);
          if (this.firestore) {
            await deleteDoc(doc(this.firestore, 'locationPresets', p.id)).catch(() => {});
          }
        }
      }

      // 2. gatherings 정리
      const localGatherings = await db.gatherings.toArray();
      for (const g of localGatherings) {
        const isDummyGat = dummyKeywords.some(
          (k) => g.title?.includes(k) || g.locationName?.includes(k) || g.locationDetail?.includes(k)
        );

        if (isDummyGat) {
          await db.gatherings.delete(g.id);
          if (this.firestore) {
            await deleteDoc(doc(this.firestore, 'gatherings', g.id)).catch(() => {});
          }
        }
      }

      // 3. 더미 회원(Mock users) 정리
      for (const dId of dummyUserIds) {
        await db.users.delete(dId);
        if (this.firestore) {
          await deleteDoc(doc(this.firestore, 'users', dId)).catch(() => {});
        }
      }

      const allUsers = await db.users.toArray();
      for (const u of allUsers) {
        if (u.uid.startsWith('user_') && u.displayName?.startsWith('신규가입자_')) {
          await db.users.delete(u.uid);
          if (this.firestore) {
            await deleteDoc(doc(this.firestore, 'users', u.uid)).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.warn('cleanLegacyDummyData error:', err);
    }
  }
}

export const firebaseService = new FirebaseService();

