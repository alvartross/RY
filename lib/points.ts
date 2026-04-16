import { todayKey } from './date';

const DAILY_KEY = 'english-kids:dailyPoints';
const TOTAL_KEY = 'english-kids:totalPoints';
const HISTORY_KEY = 'english-kids:pointHistory';
const WORD_STAGE_KEY = 'english-kids:wordStagePoints';

export type Category = 'review' | 'phonics' | 'listening' | 'writing' | 'riseReaders';

export const CATEGORY_POINTS: Record<Category, number> = {
  review: 100,
  phonics: 100,
  listening: 100,
  writing: 100,
  riseReaders: 100,
};

export const CATEGORY_LABEL: Record<Category, string> = {
  review: "Today's Review",
  phonics: 'Phonics',
  listening: 'Listening',
  writing: 'Writing',
  riseReaders: 'RiseReaders',
};

type DailyPoints = Record<string, Record<Category, number>>;
type History = Array<{ date: string; category: Category | 'wordgame' | 'shop'; delta: number; note?: string; at: number }>;
type WordStage = Record<string, number>;

function readDaily(): DailyPoints {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(DAILY_KEY) ?? '{}') as DailyPoints;
  } catch {
    return {};
  }
}
function writeDaily(d: DailyPoints) {
  window.localStorage.setItem(DAILY_KEY, JSON.stringify(d));
}

function readHistory(): History {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(HISTORY_KEY) ?? '[]') as History;
  } catch {
    return [];
  }
}
function writeHistory(h: History) {
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(h));
}

export function getTotalPoints(): number {
  if (typeof window === 'undefined') return 0;
  return Number(window.localStorage.getItem(TOTAL_KEY) ?? '0');
}

function setTotalPoints(v: number) {
  window.localStorage.setItem(TOTAL_KEY, String(Math.max(0, v)));
}

export function addPoints(delta: number, note: { date?: string; category: Category | 'wordgame' | 'shop'; desc?: string }): number {
  const total = getTotalPoints() + delta;
  setTotalPoints(total);
  const h = readHistory();
  h.push({
    date: note.date ?? todayKey(),
    category: note.category,
    delta,
    note: note.desc,
    at: Date.now(),
  });
  writeHistory(h);
  return total;
}

export function getDailyScore(date: string): Record<Category, number> {
  const d = readDaily();
  return d[date] ?? { review: 0, phonics: 0, listening: 0, writing: 0, riseReaders: 0 };
}

export function awardCategory(
  category: Category,
  date: string = todayKey(),
  bonus: number = 0
): { awarded: number; alreadyDone: boolean; bonus: number } {
  const d = readDaily();
  const day = d[date] ?? { review: 0, phonics: 0, listening: 0, writing: 0, riseReaders: 0 };
  if (day[category] >= CATEGORY_POINTS[category]) {
    return { awarded: 0, alreadyDone: true, bonus: 0 };
  }
  const base = CATEGORY_POINTS[category] - day[category];
  day[category] = CATEGORY_POINTS[category];
  d[date] = day;
  writeDaily(d);
  addPoints(base, { date, category, desc: CATEGORY_LABEL[category] });
  if (bonus > 0) {
    addPoints(bonus, { date, category, desc: `${CATEGORY_LABEL[category]} 보너스` });
  }
  return { awarded: base + bonus, alreadyDone: false, bonus };
}

export function getAllDailyScores(): DailyPoints {
  return readDaily();
}

export function getHistory(): History {
  return readHistory();
}

function readStages(): WordStage {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(WORD_STAGE_KEY) ?? '{}') as WordStage;
  } catch {
    return {};
  }
}
function writeStages(s: WordStage) {
  window.localStorage.setItem(WORD_STAGE_KEY, JSON.stringify(s));
}

export function awardWordStage(stageId: string, points: number = 100): { awarded: number; alreadyDone: boolean } {
  const s = readStages();
  if (s[stageId]) return { awarded: 0, alreadyDone: true };
  s[stageId] = points;
  writeStages(s);
  addPoints(points, { category: 'wordgame', desc: `단어 게임 스테이지 ${stageId}` });
  return { awarded: points, alreadyDone: false };
}

export function hasClearedStage(stageId: string): boolean {
  return !!readStages()[stageId];
}

export function spendPoints(amount: number, itemName: string): { ok: boolean; total: number } {
  const total = getTotalPoints();
  if (total < amount) return { ok: false, total };
  const newTotal = total - amount;
  setTotalPoints(newTotal);
  const h = readHistory();
  h.push({
    date: todayKey(),
    category: 'shop',
    delta: -amount,
    note: itemName,
    at: Date.now(),
  });
  writeHistory(h);
  return { ok: true, total: newTotal };
}
