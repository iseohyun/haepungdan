import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types';
import { MOCK_USERS } from '../data/initialData';

interface AuthContextType {
  currentUser: UserProfile | null;
  currentRole: UserRole;
  isLoggedIn: boolean;
  canCreateGathering: boolean;   // 관리자만
  canProposeGathering: boolean;  // 정회원 이상
  canRSVP: boolean;              // 정회원 이상
  canWriteReview: boolean;       // 정회원 이상
  canManageUsers: boolean;       // 관리자만
  loginAs: (roleKey: 'unauth' | 'guest' | 'member' | 'admin') => void;
  logout: () => void;
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

  const canCreateGathering = currentRole === 'ADMIN';
  const canProposeGathering = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canRSVP = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canWriteReview = currentRole === 'MEMBER' || currentRole === 'ADMIN';
  const canManageUsers = currentRole === 'ADMIN';

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

  const logout = () => {
    loginAs('unauth');
  };

  useEffect(() => {
    // initial check
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentRole,
        isLoggedIn,
        canCreateGathering,
        canProposeGathering,
        canRSVP,
        canWriteReview,
        canManageUsers,
        loginAs,
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
