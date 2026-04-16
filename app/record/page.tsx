'use client';

import { useEffect, useMemo, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import {
  getTotalPoints,
  getAllDailyScores,
  getHistory,
  CATEGORY_POINTS,
  CATEGORY_LABEL,
  type Category,
} from '@/lib/points';
import { todayKey, toDateKey } from '@/lib/date';

type DailyRow = {
  date: string;
  scores: Record<Category, number>;
  total: number;
  isComplete: boolean;
};

const CATEGORY_ICON: Record<Category, string> = {
  review: '📖',
  listening: '🎧',
  writing: '✍️',
  riseReaders: '📘',
  phonics: '🔤',
};

const CATEGORY_ORDER: Category[] = ['review', 'listening', 'writing', 'phonics', 'riseReaders'];

const DAILY_MAX = Object.values(CATEGORY_POINTS).reduce((a, b) => a + b, 0);

function computeStreak(scores: Record<string, Record<Category, number>>): number {
  let streak = 0;
  const d = new Date();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const k = toDateKey(d);
    const s = scores[k];
    const total = s ? Object.values(s).reduce((a, b) => a + b, 0) : 0;
    if (total > 0) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

function sumInLastDays(
  scores: Record<string, Record<Category, number>>,
  days: number
): number {
  let sum = 0;
  const today = new Date();
  for (let i = 0; i < days; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const s = scores[toDateKey(d)];
    if (s) sum += Object.values(s).reduce((a, b) => a + b, 0);
  }
  return sum;
}

function formatRelative(ts: number): string {
  const now = Date.now();
  const diff = Math.floor((now - ts) / 1000);
  if (diff < 60) return '방금';
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function RecordPage() {
  const [total, setTotal] = useState(0);
  const [dailyScores, setDailyScores] = useState<Record<string, Record<Category, number>>>({});
  const [history, setHistory] = useState<ReturnType<typeof getHistory>>([]);

  useEffect(() => {
    setTotal(getTotalPoints());
    setDailyScores(getAllDailyScores());
    setHistory(getHistory());
  }, []);

  const streak = useMemo(() => computeStreak(dailyScores), [dailyScores]);
  const week = useMemo(() => sumInLastDays(dailyScores, 7), [dailyScores]);
  const month = useMemo(() => sumInLastDays(dailyScores, 30), [dailyScores]);

  const dailyRows: DailyRow[] = useMemo(() => {
    const today = todayKey();
    const set = new Set<string>([...Object.keys(dailyScores), today]);
    return Array.from(set)
      .sort((a, b) => (a < b ? 1 : -1))
      .slice(0, 30)
      .map((date) => {
        const scores: Record<Category, number> = dailyScores[date] ?? {
          review: 0,
          phonics: 0,
          listening: 0,
          writing: 0,
          riseReaders: 0,
        };
        const t = Object.values(scores).reduce((a, b) => a + b, 0);
        return { date, scores, total: t, isComplete: t >= DAILY_MAX };
      });
  }, [dailyScores]);

  const recentHistory = useMemo(() => {
    return [...history].sort((a, b) => b.at - a.at).slice(0, 30);
  }, [history]);

  return (
    <>
      <TopBar />
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-24 space-y-5">
        <header className="text-center">
          <h1 className="text-3xl font-bold">📊 Record</h1>
          <p className="text-sm text-gray-600 mt-1">
            학습 기록과 포인트를 한눈에
          </p>
        </header>

        <section className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatCard emoji="⭐" label="총 포인트" value={`${total.toLocaleString()}P`} color="from-yellow-300 to-orange-400" />
          <StatCard emoji="🔥" label="연속 학습" value={`${streak}일`} color="from-red-400 to-pink-500" />
          <StatCard emoji="📅" label="최근 7일" value={`${week.toLocaleString()}P`} color="from-cyan-400 to-blue-500" />
          <StatCard emoji="🗓️" label="최근 30일" value={`${month.toLocaleString()}P`} color="from-emerald-400 to-teal-500" />
        </section>

        <section className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="font-bold text-gray-800">일별 학습 기록</h2>
          {dailyRows.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 기록이 없어요</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {dailyRows.map((row) => (
                <DailyRowView key={row.date} row={row} />
              ))}
            </ul>
          )}
        </section>

        <section className="bg-white rounded-2xl shadow p-4 space-y-3">
          <h2 className="font-bold text-gray-800">활동 내역</h2>
          {recentHistory.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">아직 활동이 없어요</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentHistory.map((e, i) => (
                <li key={`${e.at}-${i}`} className="py-2 flex items-center gap-3">
                  <span className="text-xl">{eventIcon(e.category)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {e.note ?? eventLabel(e.category)}
                    </div>
                    <div className="text-xs text-gray-500">{formatRelative(e.at)}</div>
                  </div>
                  <div
                    className={`text-sm font-bold ${e.delta >= 0 ? 'text-green-600' : 'text-red-500'}`}
                  >
                    {e.delta >= 0 ? '+' : ''}
                    {e.delta}P
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}

function StatCard({
  emoji,
  label,
  value,
  color,
}: {
  emoji: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`rounded-2xl p-3 text-white shadow-lg bg-gradient-to-br ${color}`}>
      <div className="text-2xl">{emoji}</div>
      <div className="text-xs opacity-90 mt-1">{label}</div>
      <div className="text-xl sm:text-2xl font-bold leading-tight">{value}</div>
    </div>
  );
}

function DailyRowView({ row }: { row: DailyRow }) {
  const [y, m, d] = row.date.split('-');
  return (
    <li className="py-2.5 flex items-center gap-3">
      <div className="w-14 shrink-0">
        <div className="text-xs text-gray-400">{y.slice(2)}년</div>
        <div className="font-bold">
          {Number(m)}/{Number(d)}
        </div>
      </div>
      <div className="flex-1 flex items-center gap-1.5">
        {CATEGORY_ORDER.map((c) => {
          const got = row.scores[c] > 0;
          return (
            <span
              key={c}
              title={CATEGORY_LABEL[c]}
              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm transition-colors ${
                got ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-300'
              }`}
            >
              {CATEGORY_ICON[c]}
            </span>
          );
        })}
      </div>
      <div className="text-right">
        <div
          className={`text-sm font-bold ${row.isComplete ? 'text-orange-500' : 'text-gray-700'}`}
        >
          {row.total} / {DAILY_MAX}
        </div>
        {row.isComplete && <div className="text-[10px] text-orange-500">🏆 완료</div>}
      </div>
    </li>
  );
}

function eventIcon(cat: string): string {
  if (cat === 'review') return '📖';
  if (cat === 'listening') return '🎧';
  if (cat === 'writing') return '✍️';
  if (cat === 'riseReaders') return '📘';
  if (cat === 'phonics') return '🔤';
  if (cat === 'wordgame') return '📝';
  if (cat === 'shop') return '🎁';
  return '⭐';
}

function eventLabel(cat: string): string {
  if (cat === 'review') return "Today's Review";
  if (cat === 'listening') return 'Listening';
  if (cat === 'writing') return 'Writing';
  if (cat === 'riseReaders') return 'RiseReaders';
  if (cat === 'phonics') return 'Phonics';
  if (cat === 'wordgame') return 'Word Game';
  if (cat === 'shop') return '상점';
  return cat;
}
