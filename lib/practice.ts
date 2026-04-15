import type { Lesson, Word } from './types';
import type { Category } from './points';

export type PracticeInput = {
  words: Word[];
  sentencePattern?: string;
  title?: string;
};

function mergeReadingSections(lesson: Lesson): Word[] {
  return [
    ...(lesson.circle?.words ?? []),
    ...(lesson.journeys?.words ?? []),
    ...(lesson.riseReaders?.words ?? []),
  ];
}

function firstReadingPattern(lesson: Lesson): string | undefined {
  return (
    lesson.circle?.sentencePattern ||
    lesson.journeys?.sentencePattern ||
    lesson.riseReaders?.sentencePattern
  );
}

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
  // listening / writing: Circle + Journeys + RiseReaders (Phonics 제외)
  const words = mergeReadingSections(lesson);
  if (words.length === 0) return null;
  if (category === 'listening') {
    return { words, sentencePattern: firstReadingPattern(lesson) };
  }
  return { words };
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
