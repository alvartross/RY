import { getSupabase } from './supabase';
import type { Lesson, LessonMap } from './types';

const LESSONS_KEY = 'english-kids:lessons';
const PROFILE_KEY = 'english-kids:profile';
const TOTAL_KEY = 'english-kids:totalPoints';
const DAILY_KEY = 'english-kids:dailyPoints';
const HISTORY_KEY = 'english-kids:pointHistory';
const STAGE_KEY = 'english-kids:wordStagePoints';
const VISITS_KEY = 'english-kids:visits';
const PRAISE_KEY = 'english-kids:praiseLog';
const STICKER_KEY = 'english-kids:stickerForest';
const THEME_KEY = 'english-kids:theme';
const PIN_KEY = 'english-kids:adminPin';

async function getUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user.id ?? null;
}

// ─── LESSONS ───

type LessonRow = { date: string; data: Lesson; updated_at: string };

export async function pushLesson(lesson: Lesson): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId) return false;
  const { error } = await sb.from('lessons').upsert(
    { user_id: userId, date: lesson.date, data: lesson, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,date' }
  );
  if (error) console.warn('[cloud] pushLesson', error.message);
  return !error;
}

export async function deleteLessonCloud(date: string): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId) return false;
  const { error } = await sb.from('lessons').delete().eq('user_id', userId).eq('date', date);
  return !error;
}

async function pullLessons(): Promise<LessonMap | null> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId) return null;
  const { data, error } = await sb.from('lessons').select('date, data, updated_at');
  if (error || !data) return null;
  const map: LessonMap = {};
  for (const row of data as LessonRow[]) {
    map[row.date] = { ...row.data, date: row.date, updatedAt: new Date(row.updated_at).getTime() };
  }
  return map;
}

export async function syncLessonsFromCloud(): Promise<{ count: number; merged: boolean } | null> {
  const cloudMap = await pullLessons();
  if (!cloudMap) return null;
  if (typeof window === 'undefined') return { count: Object.keys(cloudMap).length, merged: false };
  let localMap: LessonMap = {};
  const raw = window.localStorage.getItem(LESSONS_KEY);
  if (raw) { try { localMap = JSON.parse(raw) as LessonMap; } catch {} }
  const cloudCount = Object.keys(cloudMap).length;
  const localCount = Object.keys(localMap).length;
  if (cloudCount === 0) return { count: localCount, merged: false };
  const merged: LessonMap = { ...localMap };
  for (const date of Object.keys(cloudMap)) {
    const cloud = cloudMap[date];
    const local = merged[date];
    if (!local || (cloud.updatedAt ?? 0) >= (local.updatedAt ?? 0)) merged[date] = cloud;
  }
  window.localStorage.setItem(LESSONS_KEY, JSON.stringify(merged));
  return { count: Object.keys(merged).length, merged: true };
}

export async function uploadLocalLessonsToCloud(): Promise<{ uploaded: number; total: number }> {
  if (typeof window === 'undefined') return { uploaded: 0, total: 0 };
  const raw = window.localStorage.getItem(LESSONS_KEY);
  if (!raw) return { uploaded: 0, total: 0 };
  let map: LessonMap;
  try { map = JSON.parse(raw) as LessonMap; } catch { return { uploaded: 0, total: 0 }; }
  const dates = Object.keys(map);
  let n = 0;
  for (const date of dates) { if (await pushLesson(map[date])) n++; }
  return { uploaded: n, total: dates.length };
}

// ─── PROFILE + POINTS + SETTINGS (모두 profiles 테이블) ───

type ProfileRow = {
  name: string;
  emoji: string;
  total_points: number;
  praise_log: Record<string, string[]> | null;
  sticker_forest: unknown;
  theme: string | null;
  admin_pin: string | null;
};

export async function pushProfile(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const profile = safeJSON(window.localStorage.getItem(PROFILE_KEY), { name: '꼬마 영어쟁이', emoji: '🧒' });
  const totalPoints = Number(window.localStorage.getItem(TOTAL_KEY)) || 0;
  const praiseLog = safeJSON(window.localStorage.getItem(PRAISE_KEY), {});
  const stickerForest = safeJSON(window.localStorage.getItem(STICKER_KEY), { trees: [null, null] });
  const theme = window.localStorage.getItem(THEME_KEY) ?? 'default';
  const pin = window.localStorage.getItem(PIN_KEY) ?? '1234';

  // 먼저 핵심 필드만 업데이트 시도
  const { error: coreError } = await sb.from('profiles').upsert({
    user_id: userId,
    name: profile.name ?? '꼬마 영어쟁이',
    emoji: profile.emoji ?? '🧒',
    total_points: totalPoints,
    updated_at: new Date().toISOString(),
  });
  if (coreError) {
    console.warn('[cloud] pushProfile core failed', coreError.message);
    return false;
  }

  // 확장 필드 업데이트 (마이그레이션 안 됐으면 실패해도 OK)
  await sb.from('profiles').update({
    praise_log: praiseLog,
    sticker_forest: stickerForest,
    theme,
    admin_pin: pin,
  }).eq('user_id', userId).then(({ error }) => {
    if (error) console.warn('[cloud] pushProfile extras skipped', error.message);
  });

  return true;
}

export async function syncProfileFromCloud(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const { data, error } = await sb.from('profiles').select('*').eq('user_id', userId).single();
  if (error || !data) return false;
  const row = data as ProfileRow;
  const cloudTotal = Number(row.total_points) || 0;
  const localTotal = Number(window.localStorage.getItem(TOTAL_KEY)) || 0;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify({ name: row.name ?? '꼬마 영어쟁이', emoji: row.emoji ?? '🧒' }));
  window.localStorage.setItem(TOTAL_KEY, String(Math.max(cloudTotal, localTotal)));
  if (row.praise_log) {
    const localPraise = safeJSON(window.localStorage.getItem(PRAISE_KEY), {});
    const merged = mergeObjectArrays(localPraise, row.praise_log as Record<string, string[]>);
    window.localStorage.setItem(PRAISE_KEY, JSON.stringify(merged));
  }
  if (row.sticker_forest) {
    const localSticker = window.localStorage.getItem(STICKER_KEY);
    if (!localSticker || localSticker === '{"trees":[null,null]}') {
      window.localStorage.setItem(STICKER_KEY, JSON.stringify(row.sticker_forest));
    }
  }
  if (row.theme) window.localStorage.setItem(THEME_KEY, row.theme);
  if (row.admin_pin) window.localStorage.setItem(PIN_KEY, row.admin_pin);
  return true;
}

// ─── DAILY SCORES ───

export async function pushDailyScores(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const daily = safeJSON(window.localStorage.getItem(DAILY_KEY), {}) as Record<string, Record<string, number>>;
  const rows = Object.entries(daily).map(([date, scores]) => ({
    user_id: userId,
    date,
    review: scores.review ?? 0,
    phonics: scores.phonics ?? 0,
    listening: scores.listening ?? 0,
    writing: scores.writing ?? 0,
    riseReaders: scores.riseReaders ?? 0,
    updated_at: new Date().toISOString(),
  }));
  if (rows.length === 0) return true;
  const { error } = await sb.from('daily_scores').upsert(rows, { onConflict: 'user_id,date' });
  if (error) console.warn('[cloud] pushDailyScores', error.message);
  return !error;
}

export async function syncDailyScoresFromCloud(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const { data, error } = await sb.from('daily_scores').select('*');
  if (error || !data) return false;
  const local = safeJSON(window.localStorage.getItem(DAILY_KEY), {}) as Record<string, Record<string, number>>;
  for (const row of data as Array<{ date: string; review: number; phonics: number; listening: number; writing: number; riseReaders?: number }>) {
    const cloud = { review: row.review, phonics: row.phonics, listening: row.listening, writing: row.writing, riseReaders: row.riseReaders ?? 0 };
    const existing = local[row.date];
    if (!existing) { local[row.date] = cloud; continue; }
    for (const k of Object.keys(cloud) as Array<keyof typeof cloud>) {
      existing[k] = Math.max(existing[k] ?? 0, cloud[k]);
    }
  }
  window.localStorage.setItem(DAILY_KEY, JSON.stringify(local));
  return true;
}

// ─── HISTORY ───

export async function pushHistory(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const history = safeJSON(window.localStorage.getItem(HISTORY_KEY), []) as Array<{ date: string; category: string; delta: number; note?: string; at: number }>;
  if (history.length === 0) return true;
  const rows = history.map((e) => ({
    user_id: userId,
    date: e.date,
    category: e.category,
    delta: e.delta,
    note: e.note ?? null,
    at: e.at,
  }));
  const { error } = await sb.from('history').upsert(rows, { ignoreDuplicates: true });
  if (error) console.warn('[cloud] pushHistory', error.message);
  return !error;
}

export async function syncHistoryFromCloud(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const { data, error } = await sb.from('history').select('date, category, delta, note, at').order('at', { ascending: false }).limit(500);
  if (error || !data) return false;
  const local = safeJSON(window.localStorage.getItem(HISTORY_KEY), []) as Array<{ date: string; category: string; delta: number; note?: string; at: number }>;
  const existing = new Set(local.map((e) => `${e.at}-${e.delta}-${e.category}`));
  for (const row of data) {
    const key = `${row.at}-${row.delta}-${row.category}`;
    if (!existing.has(key)) {
      local.push({ date: row.date, category: row.category, delta: row.delta, note: row.note, at: row.at });
      existing.add(key);
    }
  }
  local.sort((a, b) => a.at - b.at);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(local));
  return true;
}

// ─── WORD STAGES ───

export async function pushWordStages(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const stages = safeJSON(window.localStorage.getItem(STAGE_KEY), {}) as Record<string, number>;
  const rows = Object.entries(stages).map(([stageId, points]) => ({
    user_id: userId,
    stage_id: stageId,
    points,
  }));
  if (rows.length === 0) return true;
  const { error } = await sb.from('word_stages').upsert(rows, { onConflict: 'user_id,stage_id' });
  if (error) console.warn('[cloud] pushWordStages', error.message);
  return !error;
}

export async function syncWordStagesFromCloud(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const { data, error } = await sb.from('word_stages').select('stage_id, points');
  if (error || !data) return false;
  const local = safeJSON(window.localStorage.getItem(STAGE_KEY), {}) as Record<string, number>;
  for (const row of data as Array<{ stage_id: string; points: number }>) {
    if (!local[row.stage_id]) local[row.stage_id] = row.points;
  }
  window.localStorage.setItem(STAGE_KEY, JSON.stringify(local));
  return true;
}

// ─── VISITS ───

export async function pushVisits(): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId || typeof window === 'undefined') return false;
  const visits = safeJSON(window.localStorage.getItem(VISITS_KEY), { current: '', previous: undefined }) as { current: string; previous?: string };
  if (!visits.current) return true;
  const { error } = await sb.from('visits').upsert({
    user_id: userId, previous: visits.previous ?? null, current: visits.current, updated_at: new Date().toISOString(),
  });
  if (error) console.warn('[cloud] pushVisits', error.message);
  return !error;
}

// ─── FULL SYNC ───

export async function uploadAllToCloud(): Promise<{ ok: boolean; details: string }> {
  const userId = await getUserId();
  if (!userId) return { ok: false, details: '로그인 필요' };
  const pt = Number(window?.localStorage.getItem(TOTAL_KEY)) || 0;
  const results = await Promise.all([
    uploadLocalLessonsToCloud().then((r) => `수업 ${r.uploaded}/${r.total}`),
    pushProfile().then((ok) => `프로필(${pt}P) ${ok ? '✓' : '✗'}`),
    pushDailyScores().then((ok) => `일별점수 ${ok ? '✓' : '✗'}`),
    pushHistory().then((ok) => `활동내역 ${ok ? '✓' : '✗'}`),
    pushWordStages().then((ok) => `워드게임 ${ok ? '✓' : '✗'}`),
    pushVisits().then((ok) => `방문기록 ${ok ? '✓' : '✗'}`),
  ]);
  const anyFail = results.some((r) => r.includes('✗'));
  return { ok: !anyFail, details: results.join(' · ') };
}

export async function syncAllFromCloud(): Promise<{ ok: boolean; details: string }> {
  const userId = await getUserId();
  if (!userId) return { ok: false, details: '로그인 필요' };
  const results = await Promise.all([
    syncLessonsFromCloud().then((r) => `수업 ${r ? r.count + '개' : '✗'}`),
    syncProfileFromCloud().then((ok) => `프로필 ${ok ? '✓' : '✗'}`),
    syncDailyScoresFromCloud().then((ok) => `일별점수 ${ok ? '✓' : '✗'}`),
    syncHistoryFromCloud().then((ok) => `활동내역 ${ok ? '✓' : '✗'}`),
    syncWordStagesFromCloud().then((ok) => `워드게임 ${ok ? '✓' : '✗'}`),
  ]);
  return { ok: true, details: results.join(' · ') };
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getUserId()) !== null;
}

export function findAvailableTree(): 0 | 1 | null {
  // re-export from stickerTree
  return null;
}

// ─── UTILS ───

function safeJSON<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

function mergeObjectArrays(
  a: Record<string, string[]>,
  b: Record<string, string[]>
): Record<string, string[]> {
  const merged = { ...a };
  for (const [key, arr] of Object.entries(b)) {
    const existing = new Set(merged[key] ?? []);
    for (const v of arr) existing.add(v);
    merged[key] = Array.from(existing);
  }
  return merged;
}
