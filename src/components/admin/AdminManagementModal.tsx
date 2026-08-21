import React, { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../services/db';
import { UserProfile, UserRole } from '../../types';
import { exportDatabaseToJson, importDatabaseFromJson } from '../../services/backup';
import {
  X,
  Shield,
  UserCheck,
  User,
  Download,
  Upload,
  CheckCircle2,
  Sparkles,
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

  // 사용자 권한 변경 핸들러
  const handleRoleChange = async (uid: string, newRole: UserRole) => {
    const now = new Date().toISOString();
    await db.users.update(uid, {
      role: newRole,
      approvedAt: newRole === 'MEMBER' || newRole === 'ADMIN' ? now : undefined,
    });
    setFeedbackMessage(`회원 권한이 '${newRole}'(으)로 변경되었습니다.`);
    setTimeout(() => setFeedbackMessage(null), 3000);
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

  // 신규 임의 회원 추가 (테스트용)
  const handleAddMockUser = async () => {
    const randomId = `user_${Date.now().toString().slice(-4)}`;
    const newUser: UserProfile = {
      uid: randomId,
      email: `${randomId}@geoje.com`,
      displayName: `신규가입자_${randomId.slice(-3)}`,
      role: 'GUEST',
      createdAt: new Date().toISOString(),
    };
    await db.users.add(newUser);
    setFeedbackMessage('새로운 가입 대기 회원(GUEST)이 추가되었습니다.');
    setTimeout(() => setFeedbackMessage(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100">
        
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
                회원 권한 승인제 관리 및 데이터베이스 백업/복원
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
                등록 회원 및 권한 관리 ({users.length}명)
              </h3>
              <button
                onClick={handleAddMockUser}
                className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold flex items-center gap-1 transition"
              >
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>+ 테스트 회원 추가</span>
              </button>
            </div>

            <div className="space-y-2">
              {users.map((u) => {
                const isGuest = u.role === 'GUEST';
                const isMember = u.role === 'MEMBER';
                const isAdminRole = u.role === 'ADMIN';

                return (
                  <div
                    key={u.uid}
                    className="p-3.5 rounded-2xl glass-card border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                        isAdminRole
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : isMember
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}>
                        {isAdminRole ? (
                          <Shield className="w-4 h-4" />
                        ) : isMember ? (
                          <UserCheck className="w-4 h-4" />
                        ) : (
                          <User className="w-4 h-4" />
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-xs text-white">{u.displayName}</strong>
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isAdminRole
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : isMember
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : isGuest
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            {isAdminRole ? '관리자' : isMember ? '정회원' : isGuest ? '게스트 (승인대기)' : '비로그인'}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500 font-mono block">
                          {u.email} {u.approvedAt ? `• 승인일: ${new Date(u.approvedAt).toLocaleDateString('ko-KR')}` : ''}
                        </span>
                      </div>
                    </div>

                    {/* 권한 변경 버튼들 */}
                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      {isGuest && (
                        <button
                          onClick={() => handleRoleChange(u.uid, 'MEMBER')}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow"
                        >
                          정회원 승인
                        </button>
                      )}

                      {isMember && (
                        <button
                          onClick={() => handleRoleChange(u.uid, 'ADMIN')}
                          className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[11px] font-semibold transition"
                        >
                          관리자 임명
                        </button>
                      )}

                      {isAdminRole && (
                        <button
                          onClick={() => handleRoleChange(u.uid, 'MEMBER')}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition"
                        >
                          정회원 강등
                        </button>
                      )}

                      {!isGuest && (
                        <button
                          onClick={() => handleRoleChange(u.uid, 'GUEST')}
                          className="px-2.5 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-[11px] transition"
                        >
                          게스트 전환
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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
