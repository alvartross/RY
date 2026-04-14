'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { getProfile, saveProfile, type Profile } from '@/lib/profile';
import { useAdmin } from '@/lib/admin';

const EMOJI_CHOICES = ['🧒', '👧', '👦', '🐻', '🐱', '🦁', '🐶', '🦊', '🐰', '🐼', '🦄', '🌟'];

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile>({ name: '꼬마 영어쟁이', emoji: '🧒' });
  const [nameDraft, setNameDraft] = useState('');
  const [saved, setSaved] = useState(false);
  const { isAdmin } = useAdmin();

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

  return (
    <>
      <TopBar />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-24 space-y-6">
        <div className="bg-white rounded-2xl shadow p-6 flex items-center gap-4">
          <div className="text-6xl">{profile.emoji}</div>
          <div>
            <div className="text-xs text-gray-500">프로필</div>
            <div className="text-2xl font-bold">{profile.name}</div>
          </div>
        </div>

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

            <div className="bg-white rounded-2xl shadow p-5 space-y-3">
              <div className="text-sm font-semibold text-gray-700">아이콘</div>
              <div className="grid grid-cols-6 gap-2">
                {EMOJI_CHOICES.map((e) => (
                  <button
                    key={e}
                    onClick={() => commit({ ...profile, emoji: e })}
                    className={[
                      'aspect-square text-3xl rounded-xl transition-all',
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
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow p-5 text-sm text-gray-500 text-center">
            프로필 수정은 <strong>관리자 모드</strong>에서 가능해요 (상단 🔒 아이콘)
          </div>
        )}
      </main>
    </>
  );
}
