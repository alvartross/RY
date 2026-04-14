'use client';

import { useEffect, useState } from 'react';
import { getDailyScore, CATEGORY_POINTS, CATEGORY_LABEL, type Category } from '@/lib/points';
import { todayKey } from '@/lib/date';

const ICONS: Record<Category, string> = {
  review: '📖',
  listening: '🎧',
  writing: '✍️',
  phonics: '🔤',
};

const DISPLAY_ORDER: Category[] = ['review', 'listening', 'writing', 'phonics'];

type Props = { refreshKey?: number };

export default function TodayProgress({ refreshKey }: Props) {
  const [score, setScore] = useState<Record<Category, number>>({
    review: 0,
    phonics: 0,
    listening: 0,
    writing: 0,
  });

  useEffect(() => {
    setScore(getDailyScore(todayKey()));
  }, [refreshKey]);

  const total = Object.values(score).reduce((a, b) => a + b, 0);
  const max = Object.values(CATEGORY_POINTS).reduce((a, b) => a + b, 0);
  const allDone = total >= max;

  return (
    <section className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800">오늘의 학습 현황</h2>
        <div
          className={`text-sm font-bold px-3 py-1 rounded-full ${
            allDone
              ? 'bg-gradient-to-br from-yellow-300 to-orange-400 text-white'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {allDone ? '🏆 완료!' : `${total} / ${max}P`}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {DISPLAY_ORDER.map((k) => {
          const done = score[k] >= CATEGORY_POINTS[k];
          return (
            <div
              key={k}
              className={`rounded-xl p-2 text-center border-2 ${
                done ? 'border-green-400 bg-green-50' : 'border-gray-100 bg-gray-50'
              }`}
            >
              <div className="text-2xl">{ICONS[k]}</div>
              <div className="text-[11px] text-gray-600 font-semibold truncate">
                {CATEGORY_LABEL[k]}
              </div>
              <div className={`text-xs font-bold ${done ? 'text-green-700' : 'text-gray-400'}`}>
                {done ? `✓ ${score[k]}P` : `0 / ${CATEGORY_POINTS[k]}P`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-pink-400 via-orange-400 to-yellow-400 transition-all"
          style={{ width: `${Math.min(100, (total / max) * 100)}%` }}
        />
      </div>
      <p className="text-[11px] text-gray-500 text-center">
        매일 4가지를 다 완료하면 최대 400P를 받아요
      </p>
    </section>
  );
}
