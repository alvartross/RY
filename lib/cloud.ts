import { getSupabase } from './supabase';
import type { Lesson, LessonMap } from './types';

const LESSONS_KEY = 'english-kids:lessons';

async function getUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const { data } = await sb.auth.getSession();
  return data.session?.user.id ?? null;
}

export async function pushLesson(lesson: Lesson): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId) return false;
  const { error } = await sb.from('lessons').upsert(
    {
      user_id: userId,
      date: lesson.date,
      data: lesson,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,date' }
  );
  if (error) console.warn('[cloud] pushLesson error', error.message);
  return !error;
}

export async function deleteLessonCloud(date: string): Promise<boolean> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId) return false;
  const { error } = await sb.from('lessons').delete().eq('user_id', userId).eq('date', date);
  if (error) console.warn('[cloud] deleteLessonCloud error', error.message);
  return !error;
}

type LessonRow = { date: string; data: Lesson; updated_at: string };

export async function pullLessons(): Promise<LessonMap | null> {
  const sb = getSupabase();
  const userId = await getUserId();
  if (!sb || !userId) return null;
  const { data, error } = await sb.from('lessons').select('date, data, updated_at');
  if (error || !data) {
    if (error) console.warn('[cloud] pullLessons error', error.message);
    return null;
  }
  const map: LessonMap = {};
  for (const row of data as LessonRow[]) {
    const lessonData = row.data;
    map[row.date] = {
      ...lessonData,
      date: row.date,
      updatedAt: new Date(row.updated_at).getTime(),
    };
  }
  return map;
}

export async function syncLessonsFromCloud(): Promise<{ count: number; merged: boolean } | null> {
  const cloudMap = await pullLessons();
  if (!cloudMap) return null;
  if (typeof window === 'undefined') return { count: Object.keys(cloudMap).length, merged: false };

  let localMap: LessonMap = {};
  const raw = window.localStorage.getItem(LESSONS_KEY);
  if (raw) {
    try {
      localMap = JSON.parse(raw) as LessonMap;
    } catch {
      localMap = {};
    }
  }

  const cloudCount = Object.keys(cloudMap).length;
  const localCount = Object.keys(localMap).length;

  // 클라우드가 비어있으면 로컬을 보존 (덮어쓰지 않음)
  if (cloudCount === 0) {
    return { count: localCount, merged: false };
  }

  // 둘 다 데이터 있으면 updated_at 기준으로 병합 (최신 우선)
  const merged: LessonMap = { ...localMap };
  for (const date of Object.keys(cloudMap)) {
    const cloud = cloudMap[date];
    const local = merged[date];
    if (!local || (cloud.updatedAt ?? 0) >= (local.updatedAt ?? 0)) {
      merged[date] = cloud;
    }
  }
  window.localStorage.setItem(LESSONS_KEY, JSON.stringify(merged));
  return { count: Object.keys(merged).length, merged: true };
}

export async function uploadLocalLessonsToCloud(): Promise<{ uploaded: number; total: number }> {
  if (typeof window === 'undefined') return { uploaded: 0, total: 0 };
  const raw = window.localStorage.getItem(LESSONS_KEY);
  if (!raw) return { uploaded: 0, total: 0 };
  let map: LessonMap;
  try {
    map = JSON.parse(raw) as LessonMap;
  } catch {
    return { uploaded: 0, total: 0 };
  }
  const dates = Object.keys(map);
  let n = 0;
  for (const date of dates) {
    const ok = await pushLesson(map[date]);
    if (ok) n++;
  }
  return { uploaded: n, total: dates.length };
}

export async function isAuthenticated(): Promise<boolean> {
  return (await getUserId()) !== null;
}
