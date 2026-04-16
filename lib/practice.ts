import type { Lesson, Word } from './types';
import type { Category } from './points';

export type PracticeInput = {
  words: Word[];
  sentencePattern?: string;
  title?: string;
};

export function inputForCategory(lesson: Lesson, category: Category): PracticeInput | null {
  if (category === 'review') {
    const c = lesson.circle;
    if (!c || c.words.length === 0) return null;
    return {
      words: c.words,
      sentencePattern: c.sentencePattern,
      title: c.topic,
    };
  }
  if (category === 'phonics') {
    const p = lesson.phonics;
    if (!p || p.words.length === 0) return null;
    return { words: p.words, sentencePattern: p.sentencePattern };
  }
  if (category === 'riseReaders') {
    const r = lesson.riseReaders;
    if (!r || r.words.length === 0) return null;
    return { words: r.words, sentencePattern: r.sentencePattern, title: r.topic };
  }
  // listening / writing: Circle 단어만 사용
  const c = lesson.circle;
  if (!c || c.words.length === 0) return null;
  if (category === 'listening') {
    return { words: c.words, sentencePattern: c.sentencePattern };
  }
  return { words: c.words };
}

export function sectionSummary(lesson: Lesson): {
  hasCircle: boolean;
  hasPhonics: boolean;
  hasJourneys: boolean;
  hasRiseReaders: boolean;
  totalWords: number;
} {
  return {
    hasCircle: (lesson.circle?.words.length ?? 0) > 0,
    hasPhonics: (lesson.phonics?.words.length ?? 0) > 0,
    hasJourneys: (lesson.journeys?.words.length ?? 0) > 0,
    hasRiseReaders: (lesson.riseReaders?.words.length ?? 0) > 0,
    totalWords:
      (lesson.circle?.words.length ?? 0) +
      (lesson.phonics?.words.length ?? 0) +
      (lesson.journeys?.words.length ?? 0) +
      (lesson.riseReaders?.words.length ?? 0),
  };
}
