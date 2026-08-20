import React, { useState } from 'react';
import { firebaseService, FirebaseConfig } from '../../services/firebase';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Trash2,
  Key,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface FirebaseConfigModalProps {
  onClose: () => void;
  onConfigChanged: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({
  onClose,
  onConfigChanged,
}) => {
  const currentConfig = firebaseService.getConfig();

  const [apiKey, setApiKey] = useState(currentConfig?.apiKey || '');
  const [authDomain, setAuthDomain] = useState(currentConfig?.authDomain || '');
  const [projectId, setProjectId] = useState(currentConfig?.projectId || '');
  const [storageBucket, setStorageBucket] = useState(currentConfig?.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(currentConfig?.messagingSenderId || '');
  const [appId, setAppId] = useState(currentConfig?.appId || '');

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  const isConnected = firebaseService.isConfigured;

  // 설정 저장 및 연결
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setSyncError(null);
    setSyncStatus(null);

    const config: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim() || undefined,
      messagingSenderId: messagingSenderId.trim() || undefined,
      appId: appId.trim(),
    };

    const success = firebaseService.initApp(config);
    if (success) {
      setSyncStatus('✅ Firebase 클라우드 연결에 성공했습니다!');
      onConfigChanged();
    } else {
      setSyncError('Firebase 초기화에 실패했습니다. 설정 키 값을 확인해주세요.');
    }
  };

  // 설정 초기화 (로컬 모드로 전환)
  const handleClearConfig = () => {
    if (confirm('Firebase 설정을 삭제하고 100% 로컬 IndexedDB 모드로 전환하시겠습니까?')) {
      firebaseService.clearConfig();
      setApiKey('');
      setAuthDomain('');
      setProjectId('');
      setStorageBucket('');
      setMessagingSenderId('');
      setAppId('');
      setSyncStatus('💻 로컬 모드로 전환되었습니다.');
      onConfigChanged();
    }
  };

  // 수동 증분 동기화 실행
  const handleManualSync = async () => {
    if (!firebaseService.isConfigured) {
      alert('먼저 Firebase 설정을 저장하여 클라우드에 연결해주세요.');
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);
      setSyncStatus('클라우드와 증분 동기화(Delta Sync) 진행 중...');

      const result = await firebaseService.syncDelta();
      setSyncStatus(
        `✅ 동기화 완료: 업로드 ${result.pushed}건, 다운로드 ${result.pulled}건 (읽기 비용 0원 유지)`
      );
    } catch (err: any) {
      console.error('Sync failed:', err);
      setSyncError(`동기화 실패: ${err.message || '네트워크 상태를 확인해주세요'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn select-none">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn text-slate-100">
        
        {/* 상단 헤더 */}
        <div className="p-4 sm:p-5 bg-slate-800/90 border-b border-slate-700/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-2xl ${isConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-ocean-500/20 text-ocean-400'}`}>
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Firebase 클라우드 연동 설정
              </h2>
              <p className="text-xs text-slate-400">
                Google 로그인 및 실시간 다중 기기 동기화 (읽기 비용 0원 아키텍처)
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

        {/* 폼 본문 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 custom-scrollbar">
          
          {/* 현재 연결 상태 알림 카드 */}
          <div className={`p-4 rounded-2xl border flex items-start justify-between gap-3 ${
            isConnected
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              : 'bg-slate-950/60 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-start gap-2.5">
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
              )}
              <div>
                <strong className="text-xs font-bold block">
                  {isConnected ? '🟢 Firebase 클라우드 연결 활성화됨' : '💻 로컬 오프라인 전용 모드 (IndexedDB)'}
                </strong>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {isConnected
                    ? 'Firestore 증분 동기화와 Google OAuth 실시간 로그인이 활성화되어 있습니다.'
                    : '키를 입력하지 않아도 브라우저 IndexedDB 로컬 모드로 모든 기능이 100% 정상 작동합니다.'}
                </p>
              </div>
            </div>

            {isConnected && (
              <button
                type="button"
                onClick={handleManualSync}
                disabled={isSyncing}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition shadow shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>즉시 동기화</span>
              </button>
            )}
          </div>

          {/* 알림 메시지 */}
          {syncStatus && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{syncStatus}</span>
            </div>
          )}

          {syncError && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{syncError}</span>
            </div>
          )}

          {/* 설정 입력 폼 */}
          <form onSubmit={handleSaveConfig} className="space-y-3.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300 pb-1 border-b border-slate-800">
              <Key className="w-4 h-4 text-ocean-400" />
              <span>Firebase 웹 앱 키 설정 (Firebase Console 발급)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">apiKey *</label>
                <input
                  type="text"
                  required
                  placeholder="AIzaSy..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">projectId *</label>
                <input
                  type="text"
                  required
                  placeholder="haepungdan-prod"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">authDomain</label>
                <input
                  type="text"
                  placeholder="haepungdan.firebaseapp.com"
                  value={authDomain}
                  onChange={(e) => setAuthDomain(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-400">appId</label>
                <input
                  type="text"
                  placeholder="1:123456789:web:abcdef"
                  value={appId}
                  onChange={(e) => setAppId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-ocean-500"
                />
              </div>
            </div>

            {/* 하단 제어 버튼 */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              {isConnected ? (
                <button
                  type="button"
                  onClick={handleClearConfig}
                  className="px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>설정 해제 (로컬 모드)</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-ocean-600 hover:bg-ocean-500 text-white text-xs font-bold shadow-lg shadow-ocean-600/30 transition flex items-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>설정 저장 및 연결</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
