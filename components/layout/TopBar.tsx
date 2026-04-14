'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfile, type Profile } from '@/lib/profile';
import { getTotalPoints } from '@/lib/points';
import { useAdmin } from '@/lib/admin';
import { recordVisit, shortDate, type Visits } from '@/lib/visits';

type Props = {
  onOpenAdmin?: () => void;
  refreshKey?: number;
};

export default function TopBar({ onOpenAdmin, refreshKey }: Props) {
  const [profile, setProfile] = useState<Profile>({ name: '꼬마 영어쟁이', emoji: '🧒' });
  const [points, setPoints] = useState(0);
  const [visits, setVisits] = useState<Visits>({ current: '' });
  const { isAdmin, exit } = useAdmin();

  useEffect(() => {
    setProfile(getProfile());
    setPoints(getTotalPoints());
    setVisits(recordVisit());
  }, [refreshKey]);

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="max-w-3xl mx-auto flex items-center justify-between px-4 py-2.5 gap-2">
        <Link
          href="/profile"
          className="flex items-center gap-3 min-w-0 rounded-xl px-1 py-1 hover:bg-gray-100 transition-colors"
          aria-label="프로필 보기"
        >
          <div className="text-3xl shrink-0" aria-hidden>
            {profile.emoji}
          </div>
          <div className="min-w-0">
            <div className="font-bold truncate text-sm sm:text-base">{profile.name}</div>
            <div className="text-[11px] text-gray-500 truncate">
              오늘 {shortDate(visits.current)}
              {visits.previous && <> · 최근 방문 {shortDate(visits.previous)}</>}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 bg-gradient-to-br from-yellow-300 to-orange-400 text-white px-3 py-1.5 rounded-full font-bold shadow text-sm">
            <span>⭐</span>
            <span>{points.toLocaleString()}P</span>
          </div>
          {isAdmin ? (
            <button
              onClick={exit}
              className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700 font-semibold"
            >
              관리자 해제
            </button>
          ) : (
            onOpenAdmin && (
              <button
                onClick={onOpenAdmin}
                className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold"
                aria-label="관리자 모드"
              >
                🔒
              </button>
            )
          )}
        </div>
      </div>
    </header>
  );
}
