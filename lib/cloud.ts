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

export async function syncLessonsFromCloud(): Promise<{ count: number } | null> {
  const map = await pullLessons();
  if (!map) return null;
  if (typeof window !== 'undefined') {
    window.localStorage.setItem(LESSONS_KEY, JSON.stringify(map));
  }
  return { count: Object.keys(map).length };
}

export async function uploadLocalLessonsToCloud(): Promise<{ uploaded: number }> {
  if (typeof window === 'undefined') return { uploaded: 0 };
  const raw = window.localStorage.getItem(LESSONS_KEY);
  if (!raw) return { uploaded: 0 };
  let map: LessonMap;
  try {
    map = JSON.parse(raw) as LessonMap;
  } catch {
    return { uploaded: 0 };
  }
  let n = 0;
  for (const date of Object.keys(map)) {
    const ok = await pushLesson(map[date]);
    if (ok) n++;
  }
  return { uploaded: n };
}
