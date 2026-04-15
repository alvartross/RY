export type Word = {
  text: string;
  emoji?: string;
};

export type LessonSection = {
  topic?: string;
  words: Word[];
  sentences?: string[];
  sentencePattern?: string;
};

export type Lesson = {
  date: string;
  circle?: LessonSection;
  phonics?: LessonSection;
  journeys?: LessonSection;
  riseReaders?: LessonSection;
  memo?: string;
  updatedAt: number;
};

export type LessonMap = Record<string, Lesson>;
