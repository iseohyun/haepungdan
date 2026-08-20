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
  getDocs,
  query,
  where,
  Firestore,
  writeBatch,
} from 'firebase/firestore';
import { db } from './db';
import { Gathering, GatheringRSVP } from '../types';

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

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
   * 저장소 또는 환경변수로부터 Firebase 초기화
   */
  public initFromStorage(): boolean {
    try {
      let config: FirebaseConfig | null = null;

      // 1. LocalStorage 확인
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
        };
      }

      if (config && config.apiKey && config.projectId) {
        return this.initApp(config);
      }
    } catch (e) {
      console.warn('Firebase auto-init skipped or failed:', e);
    }
    return false;
  }

  /**
   * 설정 객체로 Firebase 수동 초기화
   */
  public initApp(config: FirebaseConfig): boolean {
    try {
      this.app = getApps().length === 0 ? initializeApp(config) : getApp();
      this.auth = getAuth(this.app);
      this.firestore = getFirestore(this.app);
      this.isConfigured = true;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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
  public getConfig(): FirebaseConfig | null {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  }

  /**
   * Google OAuth 팝업 로그인
   */
  public async loginWithGoogle(): Promise<FirebaseUser | null> {
    if (!this.auth) throw new Error('Firebase Auth가 초기화되지 않았습니다.');
    const provider = new GoogleAuthProvider();
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
   * Local-First Delta Sync Engine (IndexedDB <-> Firestore 증분 동기화)
   * 서버 읽기 비용 0원에 근접하도록 변경된 레코드만 타겟 동기화
   * =========================================================================
   */
  public async syncDelta(): Promise<{ pushed: number; pulled: number }> {
    if (!this.firestore) throw new Error('Firestore가 연결되지 않았습니다.');

    const meta = await db.syncMeta.get('lastSyncTimestamp');
    const lastSync = meta ? meta.value : '1970-01-01T00:00:00.000Z';
    const now = new Date().toISOString();

    let pushedCount = 0;
    let pulledCount = 0;

    // 1. PUSH: 로컬에서 lastSync 이후 수정된 모임들을 서버로 전송
    const localUpdatedGatherings = await db.gatherings
      .where('updatedAt')
      .above(lastSync)
      .toArray();

    if (localUpdatedGatherings.length > 0) {
      const batch = writeBatch(this.firestore);
      for (const g of localUpdatedGatherings) {
        const ref = doc(this.firestore, 'gatherings', g.id);
        batch.set(ref, g, { merge: true });
        pushedCount++;
      }
      await batch.commit();
    }

    // 2. PULL: 서버에서 lastSync 이후 변경된 모임들을 가져와 로컬 IndexedDB에 반영
    const gatheringsQuery = query(
      collection(this.firestore, 'gatherings'),
      where('updatedAt', '>', lastSync)
    );
    const serverGatheringsSnap = await getDocs(gatheringsQuery);
    if (!serverGatheringsSnap.empty) {
      const serverGatherings = serverGatheringsSnap.docs.map((d) => d.data() as Gathering);
      await db.gatherings.bulkPut(serverGatherings);
      pulledCount += serverGatherings.length;
    }

    // 3. PUSH: 로컬에서 lastSync 이후 수정된 RSVP 전송
    const localUpdatedRsvps = await db.rsvps
      .where('updatedAt')
      .above(lastSync)
      .toArray();

    if (localUpdatedRsvps.length > 0) {
      const batch = writeBatch(this.firestore);
      for (const r of localUpdatedRsvps) {
        const ref = doc(this.firestore, 'rsvps', r.id);
        batch.set(ref, r, { merge: true });
        pushedCount++;
      }
      await batch.commit();
    }

    // 4. PULL: 서버 RSVP 동기화
    const rsvpsQuery = query(
      collection(this.firestore, 'rsvps'),
      where('updatedAt', '>', lastSync)
    );
    const serverRsvpsSnap = await getDocs(rsvpsQuery);
    if (!serverRsvpsSnap.empty) {
      const serverRsvps = serverRsvpsSnap.docs.map((d) => d.data() as GatheringRSVP);
      await db.rsvps.bulkPut(serverRsvps);
      pulledCount += serverRsvps.length;
    }

    // 5. 동기화 타임스탬프 갱신
    await db.syncMeta.put({
      key: 'lastSyncTimestamp',
      value: now,
    });

    return { pushed: pushedCount, pulled: pulledCount };
  }
}

export const firebaseService = new FirebaseService();
