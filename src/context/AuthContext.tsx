import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { MOCK_USERS } from '../data/initialData';
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
  loginAs: (roleKey: 'unauth' | 'guest' | 'member' | 'admin') => void;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('haepungdan_mock_role');
    if (saved === 'admin') return MOCK_USERS.admin;
    if (saved === 'member') return MOCK_USERS.member;
    if (saved === 'guest') return MOCK_USERS.guest;
    return null; // 기본: 비로그인
  });

  const currentRole: UserRole = currentUser ? currentUser.role : 'UNAUTHENTICATED';
  const isLoggedIn = currentUser !== null;
  const isAdmin = currentRole === 'ADMIN';

  const canCreateGathering = currentRole === 'ADMIN';
  const canProposeGathering = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canRSVP = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canWriteReview = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canManageUsers = currentRole === 'ADMIN';

  // Mock 역할 스위처 (개발 및 시연용)
  const loginAs = (roleKey: 'unauth' | 'guest' | 'member' | 'admin') => {
    if (roleKey === 'unauth') {
      setCurrentUser(null);
      localStorage.removeItem('haepungdan_mock_role');
    } else {
      const user = MOCK_USERS[roleKey];
      setCurrentUser(user);
      localStorage.setItem('haepungdan_mock_role', roleKey);
    }
  };

  // Google OAuth 로그인 실행
  const loginWithGoogle = async () => {
    if (!firebaseService.isConfigured) {
      // Firebase가 아직 미설정된 경우 모의 로그인(정회원)으로 전환
      loginAs('member');
      return;
    }

    try {
      const fbUser = await firebaseService.loginWithGoogle();
      if (!fbUser) return;

      const uid = fbUser.uid;
      const email = fbUser.email || '';
      const displayName = fbUser.displayName || 'Google 사용자';
      const photoURL = fbUser.photoURL || undefined;

      // 로컬 DB에서 기존 회원 정보 조회
      let user = await db.users.get(uid);
      if (!user) {
        // 첫 로그인 시 기본 'GUEST'로 등록 (관리자 이메일일 경우 ADMIN 자동 부여)
        const isAdminEmail = email.includes('admin') || email === 'iseohyun@hanmail.net';
        const role: UserRole = isAdminEmail ? 'ADMIN' : 'GUEST';
        const now = new Date().toISOString();

        user = {
          uid,
          email,
          displayName,
          photoURL,
          role,
          approvedAt: isAdminEmail ? now : undefined,
          createdAt: now,
        };
        await db.users.put(user);
      }

      setCurrentUser(user);
      localStorage.removeItem('haepungdan_mock_role');
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
    localStorage.removeItem('haepungdan_mock_role');
  };

  useEffect(() => {
    // Firebase 인증 상태 리스너 구독
    if (firebaseService.isConfigured) {
      const unsubscribe = firebaseService.onAuthStateChanged(async (fbUser) => {
        if (fbUser) {
          const user = await db.users.get(fbUser.uid);
          if (user) {
            setCurrentUser(user);
          }
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
        loginAs,
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
