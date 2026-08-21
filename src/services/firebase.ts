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
import { Gathering, GatheringRSVP, GatheringReview, LocationPreset } from '../types';



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

const STORAGE_KEY = 'haepungdan_firebase_config';

class FirebaseService {
  private app: FirebaseApp | null = null;
  public auth: Auth | null = null;
  public firestore: Firestore | null = null;
  public isConfigured = false;

  constructor() {
    this.initFromStorage();
  }

  /**
   * 저장소, 환경변수 또는 기본 공식 설정으로부터 Firebase 초기화
   */
  public initFromStorage(): boolean {
    try {
      let config: FirebaseConfig | null = null;

      // 1. LocalStorage 확인 (사용자 정의 키 우선)
      const savedConfig = localStorage.getItem(STORAGE_KEY);
      if (savedConfig) {
        config = JSON.parse(savedConfig);
      } else if (import.meta.env.VITE_FIREBASE_API_KEY) {
        // 2. Vite 환경변수 확인
        config = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
          measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
        };
      } else {
        // 3. 해풍단 공식 기본 Firebase 설정 적용
        config = DEFAULT_FIREBASE_CONFIG;
      }

      if (config && config.apiKey && config.projectId) {
        return this.initApp(config, false);
      }
    } catch (e) {
      console.warn('Firebase auto-init skipped or failed:', e);
    }
    return false;
  }

  /**
   * 설정 객체로 Firebase 수동/자동 초기화
   */
  public initApp(config: FirebaseConfig, saveToStorage = true): boolean {
    try {
      this.app = getApps().length === 0 ? initializeApp(config) : getApp();
      this.auth = getAuth(this.app);
      this.firestore = getFirestore(this.app);
      this.isConfigured = true;
      if (saveToStorage) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      }
      return true;
    } catch (err) {
      console.error('Firebase init failed:', err);
      this.isConfigured = false;
      return false;
    }
  }

  /**
   * Firebase 설정 제거 (로컬 모드로 전환)
   */
  public clearConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
    this.app = null;
    this.auth = null;
    this.firestore = null;
    this.isConfigured = false;
  }

  /**
   * 현재 저장된 설정 반환
   */
  public getConfig(): FirebaseConfig {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : DEFAULT_FIREBASE_CONFIG;
  }

  /**
   * Google OAuth 팝업 로그인
   */
  public async loginWithGoogle(): Promise<FirebaseUser | null> {
    if (!this.auth) {
      this.initApp(DEFAULT_FIREBASE_CONFIG);
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

  /**
   * =========================================================================
   * Local-First Delta Sync Engine (IndexedDB <-> Firestore 증분 동기화)
   * 모임, 상세 집결위치(locationPresets), RSVP, 후기(reviews) 전체 증분 동기화
   * =========================================================================
   */
  public async syncDelta(): Promise<{ pushed: number; pulled: number }> {
    if (!this.firestore) throw new Error('Firestore가 연결되지 않았습니다.');

    const now = new Date().toISOString();

    let pushedCount = 0;
    let pulledCount = 0;

    // 1. GATHERINGS: 로컬의 활성 모임(isDeleted가 아닌 것)을 서버로 PUSH
    const allLocalGatherings = await db.gatherings.toArray();
    const activeLocalGatherings = allLocalGatherings.filter((g) => !g.isDeleted);
    if (activeLocalGatherings.length > 0) {
      const batch = writeBatch(this.firestore);
      for (const g of activeLocalGatherings) {
        const ref = doc(this.firestore, 'gatherings', g.id);
        batch.set(ref, this.cleanData(g), { merge: true });
        pushedCount++;
      }
      await batch.commit();
    }

    // 2. GATHERINGS: 서버 -> 로컬 PULL (서버의 실제 모임 목록으로 로컬 IndexedDB 정규화)
    try {
      const serverGatheringsSnap = await getDocs(collection(this.firestore, 'gatherings'));
      const serverGatherings = serverGatheringsSnap.docs.map((d) => d.data() as Gathering);
      const serverIds = new Set(serverGatherings.map((g) => g.id));

      // 서버에 없는 모임 또는 삭제된 더미 모임은 로컬에서도 정리
      for (const lg of allLocalGatherings) {
        if (lg.isDeleted || (!serverIds.has(lg.id) && (lg.id.startsWith('gat_2026_') || lg.id.startsWith('gat_dummy_')))) {
          await db.gatherings.delete(lg.id);
        }
      }

      if (serverGatherings.length > 0) {
        await db.gatherings.bulkPut(serverGatherings);
        pulledCount += serverGatherings.length;
      }
    } catch (e) {
      console.warn('gatherings pull skipped or failed:', e);
    }

    // 3. RSVPS: 로컬 -> 서버 PUSH

    const localRsvps = await db.rsvps.toArray();
    if (localRsvps.length > 0) {
      const batch = writeBatch(this.firestore);
      for (const r of localRsvps) {
        const ref = doc(this.firestore, 'rsvps', r.id);
        batch.set(ref, this.cleanData(r), { merge: true });
        pushedCount++;
      }
      await batch.commit();
    }

    // 6. RSVPS: 서버 -> 로컬 PULL
    try {
      const serverRsvpsSnap = await getDocs(collection(this.firestore, 'rsvps'));
      if (!serverRsvpsSnap.empty) {
        const serverRsvps = serverRsvpsSnap.docs.map((d) => d.data() as GatheringRSVP);
        await db.rsvps.bulkPut(serverRsvps);
        pulledCount += serverRsvps.length;
      }
    } catch (e) {
      console.warn('rsvps pull skipped or failed:', e);
    }

    // 7. REVIEWS: 로컬 -> 서버 PUSH & 서버 -> 로컬 PULL
    const localReviews = await db.reviews.toArray();
    if (localReviews.length > 0) {
      const batch = writeBatch(this.firestore);
      for (const rev of localReviews) {
        const ref = doc(this.firestore, 'reviews', rev.id);
        batch.set(ref, this.cleanData(rev), { merge: true });
        pushedCount++;
      }
      await batch.commit();
    }

    try {
      const serverReviewsSnap = await getDocs(collection(this.firestore, 'reviews'));
      if (!serverReviewsSnap.empty) {
        const serverReviews = serverReviewsSnap.docs.map((d) => d.data() as GatheringReview);
        await db.reviews.bulkPut(serverReviews);
        pulledCount += serverReviews.length;
      }
    } catch (e) {
      console.warn('reviews pull skipped:', e);
    }

    // 8. LOCATION PRESETS: 활성 모임에서 사용 중인 프리셋만 선별 동기화 & 미사용 프리셋 로컬/서버 전면 삭제
    const allGatherings = await db.gatherings.toArray();
    const activeGatherings = allGatherings.filter((g) => !g.isDeleted);
    const usedPresetIds = new Set<string>();
    const usedPresetNames = new Set<string>();

    for (const g of activeGatherings) {
      if (g.locationPresetId) usedPresetIds.add(g.locationPresetId);
      if (g.locationName) usedPresetNames.add(g.locationName.trim());
    }

    const localPresets = await db.locationPresets.toArray();
    const validPresetsToPush: LocationPreset[] = [];

    for (const preset of localPresets) {
      const isUsed = usedPresetIds.has(preset.id) || (preset.name && usedPresetNames.has(preset.name.trim()));
      if (isUsed) {
        validPresetsToPush.push(preset);
      } else {
        // 사용 중이지 않은 프리셋은 로컬 DB에서 삭제하고, 서버에서도 영구 삭제
        await db.locationPresets.delete(preset.id);
        const ref = doc(this.firestore, 'locationPresets', preset.id);
        await deleteDoc(ref).catch(() => {});
      }
    }

    if (validPresetsToPush.length > 0) {
      const batch = writeBatch(this.firestore);
      for (const preset of validPresetsToPush) {
        const ref = doc(this.firestore, 'locationPresets', preset.id);
        batch.set(ref, this.cleanData(preset), { merge: true });
        pushedCount++;
      }
      await batch.commit();
    }

    try {
      const serverPresetsSnap = await getDocs(collection(this.firestore, 'locationPresets'));
      if (!serverPresetsSnap.empty) {
        const serverPresets: LocationPreset[] = [];
        for (const d of serverPresetsSnap.docs) {
          const p = d.data() as LocationPreset;
          const isUsed = usedPresetIds.has(p.id) || (p.name && usedPresetNames.has(p.name?.trim() || ''));
          if (isUsed) {
            serverPresets.push(p);
          } else {
            // 서버에 남아있는 미사용 프리셋도 함께 정리
            await deleteDoc(doc(this.firestore, 'locationPresets', p.id)).catch(() => {});
          }
        }
        if (serverPresets.length > 0) {
          await db.locationPresets.bulkPut(serverPresets);
          pulledCount += serverPresets.length;
        }
      }
    } catch (e) {
      console.warn('locationPresets pull skipped:', e);
    }

    // 9. 더미 데이터(매미성, 바람의 언덕 등) 자동 정리
    await this.cleanLegacyDummyData();

    // 10. 동기화 타임스탬프 갱신
    await db.syncMeta.put({
      key: 'lastSyncTimestamp',
      value: now,
    });

    return { pushed: pushedCount, pulled: pulledCount };
  }

  /**
   * 과거 테스트용 더미 데이터(매미성, 바람의 언덕 등) 클라우드 및 로컬 일괄 영구 삭제
   */
  async cleanLegacyDummyData(): Promise<void> {
    const dummyKeywords = ['매미성', '바람의 언덕', '바람의언덕', '도장포'];

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
    } catch (err) {
      console.warn('cleanLegacyDummyData error:', err);
    }
  }
}

export const firebaseService = new FirebaseService();

