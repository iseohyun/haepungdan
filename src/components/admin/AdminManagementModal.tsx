import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { UserProfile, UserRole } from '../../types';
import { exportDatabaseToJson, importDatabaseFromJson } from '../../services/backup';
import { firebaseService } from '../../services/firebase';
import {
  X,
  Shield,
  UserCheck,
  User,
  Download,
  Upload,
  CheckCircle2,
  Clock,
  Trash2,
} from 'lucide-react';

interface AdminManagementModalProps {
  onClose: () => void;
}

export const AdminManagementModal: React.FC<AdminManagementModalProps> = ({
  onClose,
}) => {
  const users = useLiveQuery(() => db.users.toArray(), []) ?? [];
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 날짜/시간 포맷팅 헬퍼
  const formatUserDate = (isoString?: string) => {
    if (!isoString) return '-';
    try {
      const d = new Date(isoString);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return `${y}.${m}.${day} ${hh}:${mm}`;
    } catch {
      return isoString;
    }
  };

  // 사용자 권한 변경 핸들러
  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    const now = new Date().toISOString();
    const existing = await db.users.get(uid);
    if (!existing) return;

    const updatedUser: UserProfile = {
      ...existing,
      role: newRole,
      approvedAt: newRole === 'MEMBER' || newRole === 'ADMIN' ? now : undefined,
    };

    await db.users.put(updatedUser);
    await firebaseService.saveUserToCloud(updatedUser);

    setFeedbackMessage(`'${existing.displayName}'님의 권한이 '${newRole}'(으)로 변경되었습니다.`);
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  // 사용자 계정 삭제 핸들러
  const handleDeleteUser = async (user: UserProfile) => {
    if (!confirm(`'${user.displayName}' (${user.email || user.uid}) 회원을 삭제하시겠습니까?`)) return;

    try {
      await db.users.delete(user.uid);
      await firebaseService.deleteUserFromCloud(user.uid);
      setFeedbackMessage(`'${user.displayName}' 회원이 삭제되었습니다.`);
      setTimeout(() => setFeedbackMessage(null), 3000);
    } catch (err) {
      alert('회원 삭제 중 오류가 발생했습니다.');
    }
  };

  // 백업 파일 복원 핸들러
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (confirm('백업 파일을 복원하면 현재 데이터베이스에 추가/업데이트됩니다. 계속할까요?')) {
      try {
        await importDatabaseFromJson(file);
        setFeedbackMessage('성공적으로 데이터가 복구되었습니다!');
        setTimeout(() => setFeedbackMessage(null), 3000);
      } catch (err) {
        alert('백업 파일 형식이 올바르지 않습니다.');
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100">
        
        {/* 상단 헤더 */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-amber-500/20 text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                해풍단 관리자 센터 (Admin Hub)
              </h2>
              <p className="text-xs text-slate-400">
                회원 권한(등급) 관리, 최근 로그인 조회 및 데이터베이스 백업/복원
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl transition"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 스크롤 영역 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* 피드백 메시지 알림 */}
          {feedbackMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{feedbackMessage}</span>
            </div>
          )}

          {/* 백업 도구 카드 */}
          <div className="p-4 rounded-2xl glass-card border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <strong className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-emerald-400" />
                전체 DB 백업 & 복원
              </strong>
              <p className="text-[11px] text-slate-400 mt-1">
                IndexedDB 전체 데이터를 JSON 파일로 내보내기/가져오기
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={exportDatabaseToJson}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-ocean-400" />
                <span>백업 받기</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>복원하기</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </div>
          </div>

          {/* 회원 승인 및 권한 관리 테이블 */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                구글 로그인 회원 및 권한 관리 ({users.length}명)
              </h3>
            </div>

            <div className="space-y-2">
              {users.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs glass-card rounded-2xl">
                  아직 로그인한 회원이 없습니다.
                </div>
              ) : (
                users.map((u) => {
                  const isGuest = u.role === 'GUEST';
                  const isMember = u.role === 'MEMBER';
                  const isAdminRole = u.role === 'ADMIN';

                  return (
                    <div
                      key={u.uid}
                      className="p-3.5 sm:p-4 rounded-2xl glass-card border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* 프로필 사진 또는 기본 아이콘 */}
                        {u.photoURL ? (
                          <img
                            src={u.photoURL}
                            alt={u.displayName}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                              isAdminRole
                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                                : isMember
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}
                          >
                            {isAdminRole ? (
                              <Shield className="w-4 h-4" />
                            ) : isMember ? (
                              <UserCheck className="w-4 h-4" />
                            ) : (
                              <User className="w-4 h-4" />
                            )}
                          </div>
                        )}

                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-xs font-bold text-white truncate">{u.displayName}</strong>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isAdminRole
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : isMember
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : isGuest
                                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {isAdminRole ? '👑 관리자' : isMember ? '🏊 정회원' : '🌱 게스트(준회원)'}
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 flex-wrap">
                            <span className="text-slate-300">{u.email || u.uid}</span>
                          </div>

                          <div className="text-[10px] text-slate-500 font-mono flex items-center gap-3 pt-0.5 flex-wrap">
                            <span className="flex items-center gap-1 text-slate-400">
                              <Clock className="w-3 h-3 text-ocean-400" />
                              최근 로그인: {formatUserDate(u.lastLoginAt || u.createdAt)}
                            </span>
                            <span>가입일: {formatUserDate(u.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      {/* 등급 변경 드롭다운 / 버튼 & 삭제 버튼 */}
                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.uid, e.target.value as UserRole)}
                          className={`bg-slate-950 border rounded-xl px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-ocean-500 ${
                            isAdminRole
                              ? 'border-amber-500/50 text-amber-300'
                              : isMember
                              ? 'border-emerald-500/50 text-emerald-300'
                              : 'border-slate-700 text-slate-300'
                          }`}
                        >
                          <option value="GUEST">🌱 게스트</option>
                          <option value="MEMBER">🏊 정회원</option>
                          <option value="ADMIN">👑 관리자</option>
                        </select>

                        <button
                          onClick={() => handleDeleteUser(u)}
                          className="p-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-slate-400 hover:text-rose-400 transition"
                          title="회원 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* 하단 닫기 바 */}
        <div className="p-3.5 px-4 sm:px-6 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
