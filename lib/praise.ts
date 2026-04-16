import { todayKey } from './date';
import { addPoints } from './points';

export type PraiseItem = {
  id: string;
  label: string;
  emoji: string;
  points: number;
};

export const PRAISE_LIST: PraiseItem[] = [
  { id: 'listen-mom', label: '엄마 말 잘 들었어요', emoji: '🙂', points: 50 },
  { id: 'study-hard', label: '공부 열심히 했어요', emoji: '📖', points: 50 },
  { id: 'keep-promise', label: '약속 잘 지켰어요', emoji: '🤝', points: 50 },
  { id: 'greeting', label: '인사 잘했어요', emoji: '👋', points: 50 },
  { id: 'tidy-up', label: '정리정돈 잘했어요', emoji: '🧹', points: 50 },
  { id: 'sibling', label: '사이좋게 놀았어요', emoji: '💕', points: 50 },
  { id: 'brush-teeth', label: '양치질 잘했어요', emoji: '🪥', points: 30 },
  { id: 'sleep-early', label: '일찍 잤어요', emoji: '😴', points: 30 },
  { id: 'eat-well', label: '밥 잘 먹었어요', emoji: '🍚', points: 30 },
  { id: 'no-screen', label: '스크린 절제했어요', emoji: '📵', points: 30 },
];

const LOG_KEY = 'english-kids:praiseLog';

type PraiseLog = Record<string, string[]>;

function readLog(): PraiseLog {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(LOG_KEY) ?? '{}') as PraiseLog;
  } catch {
    return {};
  }
}

function writeLog(log: PraiseLog) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LOG_KEY, JSON.stringify(log));
}

export function isPraiseGivenToday(praiseId: string, date: string = todayKey()): boolean {
  const log = readLog();
  return (log[date] ?? []).includes(praiseId);
}

export function givePraise(praiseId: string, date: string = todayKey()): {
  awarded: number;
  alreadyDone: boolean;
} {
  const item = PRAISE_LIST.find((p) => p.id === praiseId);
  if (!item) return { awarded: 0, alreadyDone: true };
  const log = readLog();
  const dayLog = log[date] ?? [];
  if (dayLog.includes(praiseId)) return { awarded: 0, alreadyDone: true };
  dayLog.push(praiseId);
  log[date] = dayLog;
  writeLog(log);
  addPoints(item.points, { date, category: 'shop', desc: `칭찬: ${item.label}` });
  return { awarded: item.points, alreadyDone: false };
}

export function getTodayPraiseCount(date: string = todayKey()): number {
  return (readLog()[date] ?? []).length;
}
