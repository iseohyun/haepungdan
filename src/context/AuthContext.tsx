import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { firebaseService } from '../services/firebase';
import { db } from '../services/db';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  isLoggedIn: boolean;
  isAdmin: boolean;              // 관리자 여부
  canCreateGathering: boolean;   // 관리자만
  canProposeGathering: boolean;  // 정회원 이상
  canRSVP: boolean;              // 정회원 이상
  canWriteReview: boolean;       // 정회원 이상
  canManageUsers: boolean;       // 관리자만
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  const currentRole: UserRole = currentUser ? currentUser.role : 'UNAUTHENTICATED';
  const isLoggedIn = currentUser !== null;
  const isAdmin = currentRole === 'ADMIN';

  const canCreateGathering = currentRole === 'ADMIN';
  const canProposeGathering = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canRSVP = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canWriteReview = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canManageUsers = currentRole === 'ADMIN';

  // Google OAuth 로그인 실행 및 유저 프로필 등록/갱신
  const loginWithGoogle = async () => {
    try {
      const fbUser = await firebaseService.loginWithGoogle();
      if (!fbUser) return;

      const uid = fbUser.uid;
      const email = fbUser.email || '';
      const displayName = fbUser.displayName || 'Google 사용자';
      const photoURL = fbUser.photoURL || undefined;
      const now = new Date().toISOString();

      // 로컬 DB에서 기존 회원 정보 조회
      const existing = await db.users.get(uid);
      const isAdminEmail = email === 'iseohyun@hanmail.net' || email.includes('admin');

      let userProfile: UserProfile;

      if (existing) {
        userProfile = {
          ...existing,
          displayName: displayName || existing.displayName,
          photoURL: photoURL || existing.photoURL,
          lastLoginAt: now,
          role: existing.role || (isAdminEmail ? 'ADMIN' : 'GUEST'),
        };
      } else {
        userProfile = {
          uid,
          email,
          displayName,
          photoURL,
          role: isAdminEmail ? 'ADMIN' : 'GUEST',
          approvedAt: isAdminEmail ? now : undefined,
          lastLoginAt: now,
          createdAt: now,
        };
      }

      // 로컬 IndexedDB 저장 및 Firebase 클라우드 동기화
      await db.users.put(userProfile);
      await firebaseService.saveUserToCloud(userProfile);

      setCurrentUser(userProfile);
    } catch (err: any) {
      console.error('Google login failed:', err);
      throw err;
    }
  };

  // 로그아웃
  const logout = async () => {
    if (firebaseService.isConfigured) {
      await firebaseService.logout();
    }
    setCurrentUser(null);
  };

  useEffect(() => {
    // Firebase 인증 상태 리스너 구독
    if (firebaseService.isConfigured) {
      const unsubscribe = firebaseService.onAuthStateChanged(async (fbUser) => {
        if (fbUser) {
          const user = await db.users.get(fbUser.uid);
          if (user) {
            setCurrentUser(user);
          } else {
            const now = new Date().toISOString();
            const isAdminEmail = fbUser.email === 'iseohyun@hanmail.net' || fbUser.email?.includes('admin');
            const newProfile: UserProfile = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || 'Google 사용자',
              photoURL: fbUser.photoURL || undefined,
              role: isAdminEmail ? 'ADMIN' : 'GUEST',
              approvedAt: isAdminEmail ? now : undefined,
              lastLoginAt: now,
              createdAt: now,
            };
            await db.users.put(newProfile);
            await firebaseService.saveUserToCloud(newProfile);
            setCurrentUser(newProfile);
          }
        } else {
          setCurrentUser(null);
        }
      });
      return () => unsubscribe();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isLoggedIn,
        isAdmin,
        canCreateGathering,
        canProposeGathering,
        canRSVP,
        canWriteReview,
        canManageUsers,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
