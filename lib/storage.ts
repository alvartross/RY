import type { Lesson, LessonMap, Word } from './types';

const STORAGE_KEY = 'english-kids:lessons';

type LegacyLesson = {
  date: string;
  title?: string;
  sentencePattern?: string;
  words?: Word[];
  memo?: string;
  updatedAt?: number;
};

function migrateSection(s: import('./types').LessonSection | undefined): import('./types').LessonSection | undefined {
  if (!s) return s;
  const merged: Word[] = [...s.words];
  const seen = new Set(merged.map((w) => w.text.toLowerCase()));
  const leftover: string[] = [];
  for (const sent of s.sentences ?? []) {
    const parts = sent.split(/[,，、]/).map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => !/\s/.test(p))) {
      for (const p of parts) {
        const key = p.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          merged.push({ text: p });
        }
      }
    } else {
      leftover.push(sent);
    }
  }
  return {
    ...s,
    words: merged,
    sentences: leftover.length > 0 ? leftover : undefined,
  };
}

function migrate(raw: LegacyLesson | Lesson): Lesson {
  const maybe = raw as Partial<Lesson> & LegacyLesson;
  if (maybe.circle || maybe.phonics || maybe.journeys) {
    return {
      date: maybe.date,
      circle: migrateSection(maybe.circle),
      phonics: migrateSection(maybe.phonics),
      journeys: migrateSection(maybe.journeys),
      memo: maybe.memo,
      updatedAt: maybe.updatedAt ?? Date.now(),
    };
  }
  const words = maybe.words ?? [];
  return {
    date: maybe.date,
    circle:
      words.length || maybe.title || maybe.sentencePattern
        ? {
            topic: maybe.title,
            words,
            sentencePattern: maybe.sentencePattern,
          }
        : undefined,
    memo: maybe.memo,
    updatedAt: maybe.updatedAt ?? Date.now(),
  };
}

function read(): LessonMap {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, LegacyLesson | Lesson>;
    const out: LessonMap = {};
    let changed = false;
    for (const date of Object.keys(parsed)) {
      const original = JSON.stringify(parsed[date]);
      const migrated = migrate(parsed[date]);
      out[date] = migrated;
      if (original !== JSON.stringify(migrated)) changed = true;
    }
    if (changed) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(out));
    return out;
  } catch {
    return {};
  }
}

function write(map: LessonMap) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getAllLessons(): LessonMap {
  return read();
}

export function getLesson(date: string): Lesson | undefined {
  return read()[date];
}

export function saveLesson(lesson: Lesson): void {
  const map = read();
  map[lesson.date] = { ...lesson, updatedAt: Date.now() };
  write(map);
}

export function deleteLesson(date: string): void {
  const map = read();
  delete map[date];
  write(map);
}

export function hasLesson(date: string): boolean {
  return !!read()[date];
}
