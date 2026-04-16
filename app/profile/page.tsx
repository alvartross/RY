'use client';

import { useEffect, useRef, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { getProfile, saveProfile, type Profile } from '@/lib/profile';
import { useAdmin, changePin } from '@/lib/admin';
import { downloadBackup, importFromFile, summarizeBackup } from '@/lib/backup';
import { useTheme, type Theme } from '@/lib/theme';
import { uploadLocalLessonsToCloud, syncLessonsFromCloud } from '@/lib/cloud';
import { useAuth, signOut } from '@/lib/useAuth';

const EMOJI_CHOICES = [
  '🧒', '👧', '👦',
  '👸', '🧚‍♀️', '🧜‍♀️', '❄️', '🍎', '🎀', '🪄',
  '🐻', '🐱', '🦁', '🐶', '🦊', '🐰', '🐼', '🦄',
  '🦋', '🌸', '💎', '🌈', '🏰', '⭐', '🌟', '💗',
];

const SVG_AVATARS = [
  { id: 'img:princess', label: '공주', src: '/avatars/princess.svg' },
  { id: 'img:snowqueen', label: '눈의 여왕', src: '/avatars/snowqueen.svg' },
  { id: 'img:mermaid', label: '인어', src: '/avatars/mermaid.svg' },
  { id: 'img:bunny', label: '토끼', src: '/avatars/bunny.svg' },
  { id: 'img:fairy', label: '요정', src: '/avatars/fairy.svg' },
  { id: 'img:knight', label: '기사', src: '/avatars/knight.svg' },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ name: '꼬마 영어쟁이', emoji: '🧒' });
  const [nameDraft, setNameDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const [importStatus, setImportStatus] = useState<
    | null
    | { kind: 'ok'; text: string }
    | { kind: 'err'; text: string }
  >(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isAdmin } = useAdmin();
  const { user } = useAuth();
  const [cloudStatus, setCloudStatus] = useState<
    null | { kind: 'ok' | 'err'; text: string }
  >(null);
  const { theme, set: setAppTheme } = useTheme();
  const [curPin, setCurPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinMsg, setPinMsg] = useState<null | { kind: 'ok' | 'err'; text: string }>(null);

  useEffect(() => {
    const p = getProfile();
    setProfile(p);
    setNameDraft(p.name);
  }, []);

  const commit = (next: Profile) => {
    saveProfile(next);
    setProfile(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
  };

  const onExport = () => {
    try {
      downloadBackup();
      setImportStatus({ kind: 'ok', text: '내보내기 파일이 다운로드됐어요' });
    } catch (e) {
      setImportStatus({ kind: 'err', text: `실패: ${(e as Error).message}` });
    }
    setTimeout(() => setImportStatus(null), 2500);
  };

  const onImportClick = () => {
    fileInputRef.current?.click();
  };

  const onUploadToCloud = async () => {
    setCloudStatus(null);
    const r = await uploadLocalLessonsToCloud();
    setCloudStatus({
      kind: 'ok',
      text: `클라우드에 ${r.uploaded} / ${r.total}개 수업 업로드 완료`,
    });
    setTimeout(() => setCloudStatus(null), 3000);
  };

  const onPullFromCloud = async () => {
    setCloudStatus(null);
    const r = await syncLessonsFromCloud();
    if (!r) {
      setCloudStatus({ kind: 'err', text: '동기화 실패' });
    } else {
      setCloudStatus({
        kind: 'ok',
        text: `클라우드에서 ${r.count}개 수업 받아옴 · 새로고침합니다`,
      });
      setTimeout(() => window.location.reload(), 1200);
    }
  };

  const onChangePin = () => {
    if (newPin !== confirmPin) {
      setPinMsg({ kind: 'err', text: '새 PIN이 서로 일치하지 않아요' });
      setTimeout(() => setPinMsg(null), 2500);
      return;
    }
    const result = changePin(curPin, newPin);
    if (result.ok) {
      setPinMsg({ kind: 'ok', text: 'PIN이 변경됐어요' });
      setCurPin('');
      setNewPin('');
      setConfirmPin('');
    } else {
      setPinMsg({ kind: 'err', text: result.error ?? '실패' });
    }
    setTimeout(() => setPinMsg(null), 2500);
  };

  const onSignOut = async () => {
    if (!confirm('로그아웃하시겠어요?')) return;
    await signOut();
    window.location.href = '/login';
  };

  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm('가져오기를 하면 현재 이 기기의 데이터를 덮어씁니다. 진행할까요?')) {
      e.target.value = '';
      return;
    }
    try {
      const payload = await importFromFile(file);
      const s = summarizeBackup(payload);
      setImportStatus({
        kind: 'ok',
        text: `가져오기 완료 · 수업 ${s.lessonCount}개, ${s.totalPoints}P, 스테이지 ${s.wordStagesCleared}개`,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      setImportStatus({ kind: 'err', text: `실패: ${(err as Error).message}` });
    }
    e.target.value = '';
  };

  return (
    <>
      <TopBar />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-24 space-y-6">
        <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
          <div className="text-6xl">{profile.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-gray-500">프로필</div>
            <div className="text-2xl font-bold truncate">{profile.name}</div>
            {user?.email && (
              <div className="text-xs text-gray-400 truncate mt-0.5">{user.email}</div>
            )}
          </div>
          {user && (
            <button
              onClick={onSignOut}
              className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold"
            >
              로그아웃
            </button>
          )}
        </div>

        <div className="rounded-2xl shadow p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>🎨 테마</div>
          <div className="grid grid-cols-3 gap-2">
            {([
              { key: 'default' as Theme, label: '기본', icon: '🌈', bg: 'bg-gradient-to-br from-yellow-200 via-pink-200 to-blue-200' },
              { key: 'dark' as Theme, label: '다크', icon: '🌙', bg: 'bg-gradient-to-br from-slate-800 to-indigo-900' },
              { key: 'white' as Theme, label: '화이트', icon: '☀️', bg: 'bg-white border border-gray-200' },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setAppTheme(t.key)}
                className={[
                  'rounded-xl p-3 flex flex-col items-center gap-1 transition-all',
                  t.bg,
                  theme === t.key ? 'ring-2 ring-pink-400 scale-105' : 'opacity-80',
                  t.key === 'dark' ? 'text-white' : 'text-gray-800',
                ].join(' ')}
              >
                <span className="text-2xl">{t.icon}</span>
                <span className="text-xs font-bold">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {user && isAdmin && (
          <div className="rounded-2xl shadow p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>☁️ 클라우드 동기화</div>
              <p className="text-xs text-gray-500 mt-1">
                기기 변경 시 클라우드와 데이터 동기화하세요.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onUploadToCloud}
                className="px-4 py-3 bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold rounded-lg active:scale-95 text-sm"
              >
                ⬆ 이 기기 → 클라우드
              </button>
              <button
                onClick={onPullFromCloud}
                className="px-4 py-3 bg-gradient-to-br from-cyan-400 to-blue-600 text-white font-bold rounded-lg active:scale-95 text-sm"
              >
                ⬇ 클라우드 → 이 기기
              </button>
            </div>
            {cloudStatus && (
              <div
                className={[
                  'text-sm text-center rounded-lg px-3 py-2',
                  cloudStatus.kind === 'ok'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700',
                ].join(' ')}
              >
                {cloudStatus.text}
              </div>
            )}
            <p className="text-[11px] text-gray-400">
              ※ 현재 수업(lessons)만 동기화. 포인트·프로필은 단계적으로 추가 예정.
            </p>
          </div>
        )}

        {isAdmin ? (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow p-5 space-y-3">
              <label className="block">
                <span className="text-sm font-semibold text-gray-700">이름</span>
                <input
                  value={nameDraft}
                  onChange={(e) => setNameDraft(e.target.value)}
                  onBlur={() => {
                    if (nameDraft.trim() && nameDraft !== profile.name) {
                      commit({ ...profile, name: nameDraft.trim() });
                    }
                  }}
                  className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                  maxLength={20}
                />
              </label>
            </div>

            <div className="rounded-2xl shadow p-5 space-y-3" style={{ backgroundColor: 'var(--bg-card)' }}>
              <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>캐릭터 아바타</div>
              <div className="grid grid-cols-6 gap-2">
                {SVG_AVATARS.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => commit({ ...profile, emoji: a.id })}
                    className={[
                      'aspect-square rounded-xl transition-all p-1',
                      profile.emoji === a.id
                        ? 'bg-gradient-to-br from-pink-200 to-orange-200 ring-2 ring-pink-400'
                        : 'bg-gray-100 hover:bg-gray-200',
                    ].join(' ')}
                  >
                    <img src={a.src} alt={a.label} className="w-full h-full" />
                  </button>
                ))}
              </div>
              <div className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>이모지 아이콘</div>
              <div className="grid grid-cols-8 gap-1.5">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    onClick={() => commit({ ...profile, emoji: e })}
                    className={[
                      'aspect-square text-2xl rounded-lg transition-all',
                      profile.emoji === e
                        ? 'bg-gradient-to-br from-pink-200 to-orange-200 ring-2 ring-pink-400'
                        : 'bg-gray-100 hover:bg-gray-200',
                    ].join(' ')}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            {saved && <div className="text-center text-sm text-green-600">저장됨</div>}

            <div className="bg-white rounded-2xl shadow p-5 space-y-3">
              <div className="text-sm font-semibold text-gray-700">🔑 PIN 변경</div>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={curPin}
                onChange={(e) => setCurPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                placeholder="현재 PIN"
                className="w-full px-3 py-2 border rounded-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="새 PIN"
                  className="px-3 py-2 border rounded-lg text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={4}
                  value={confirmPin}
                  onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="새 PIN 확인"
                  className={[
                    'px-3 py-2 border rounded-lg text-center tracking-widest focus:outline-none focus:ring-2',
                    confirmPin.length === 4 && newPin !== confirmPin
                      ? 'border-red-300 focus:ring-red-400'
                      : 'focus:ring-blue-400',
                  ].join(' ')}
                />
              </div>
              <button
                onClick={onChangePin}
                disabled={curPin.length !== 4 || newPin.length !== 4 || confirmPin.length !== 4}
                className="w-full py-2 bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-lg disabled:opacity-40"
              >
                PIN 변경
              </button>
              {pinMsg && (
                <div className={`text-sm text-center rounded-lg px-3 py-2 ${pinMsg.kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {pinMsg.text}
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl shadow p-5 space-y-3">
              <div>
                <div className="text-sm font-semibold text-gray-700">데이터 관리</div>
                <p className="text-xs text-gray-500 mt-1">
                  다른 기기에서 이어서 쓰려면 내보내기 후, 그 기기에서 가져오기 하세요.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={onExport}
                  className="px-4 py-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-lg active:scale-95"
                >
                  📤 내보내기
                </button>
                <button
                  onClick={onImportClick}
                  className="px-4 py-3 bg-gradient-to-br from-violet-400 to-violet-600 text-white font-bold rounded-lg active:scale-95"
                >
                  📥 가져오기
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={onFileChosen}
                className="hidden"
              />
              {importStatus && (
                <div
                  className={[
                    'text-sm text-center rounded-lg px-3 py-2',
                    importStatus.kind === 'ok'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-red-50 text-red-700',
                  ].join(' ')}
                >
                  {importStatus.text}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-5 text-sm text-gray-500 text-center">
            프로필 수정과 데이터 관리는 <strong>관리자 모드</strong>에서 가능해요 (상단 🔒 아이콘)
          </div>
        )}
      </main>
    </>
  );
}
