'use client';

import type { Lesson, LessonSection } from '@/lib/types';
import WordIcon from '@/components/WordIcon';
import { formatKorean } from '@/lib/date';

type Props = {
  lesson: Lesson | undefined;
  selectedDate: string;
  onOpenAdmin?: () => void;
  isAdmin: boolean;
  onAddLesson: () => void;
};

const SECTION_META = {
  circle: { label: 'Circle', icon: '🔵', color: 'bg-pink-50 text-pink-700' },
  phonics: { label: 'Phonics', icon: '🔤', color: 'bg-amber-50 text-amber-700' },
  journeys: { label: 'Journeys', icon: '🚗', color: 'bg-emerald-50 text-emerald-700' },
} as const;

export default function TodaysLearnings({
  lesson,
  selectedDate,
  onAddLesson,
  isAdmin,
  onOpenAdmin,
}: Props) {
  const hasAny = !!lesson && (lesson.circle || lesson.phonics || lesson.journeys);

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 w-full">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-gray-800">{formatKorean(selectedDate)}</h3>
        {isAdmin ? (
          <button
            onClick={onAddLesson}
            className="text-xs px-2 py-1 bg-blue-500 text-white font-semibold rounded-full"
          >
            {hasAny ? '✎ 수정' : '+ 입력'}
          </button>
        ) : (
          onOpenAdmin && (
            <button
              onClick={onOpenAdmin}
              className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full"
              title="관리자 모드에서 수업을 추가할 수 있어요"
            >
              🔒
            </button>
          )
        )}
      </div>

      {!hasAny ? (
        <div className="py-6 text-center text-sm text-gray-400">아직 수업이 없어요</div>
      ) : (
        <div className="space-y-2">
          {lesson?.circle && <SectionView kind="circle" section={lesson.circle} />}
          {lesson?.phonics && <SectionView kind="phonics" section={lesson.phonics} />}
          {lesson?.journeys && <SectionView kind="journeys" section={lesson.journeys} />}
          {lesson?.memo && (
            <div className="bg-gray-50 rounded-lg p-2 text-xs text-gray-600">📝 {lesson.memo}</div>
          )}
        </div>
      )}
    </div>
  );
}

function SectionView({
  kind,
  section,
}: {
  kind: keyof typeof SECTION_META;
  section: LessonSection;
}) {
  const meta = SECTION_META[kind];
  return (
    <div className="rounded-lg overflow-hidden border border-gray-100">
      <div className={`${meta.color} px-3 py-1.5 text-xs font-bold flex items-center gap-1.5`}>
        <span>{meta.icon}</span>
        <span>{meta.label}</span>
        {section.topic && <span className="opacity-70 truncate"> · {section.topic}</span>}
      </div>
      <div className="p-2 space-y-1.5">
        {section.words.length > 0 && (
          <ul className="flex flex-wrap gap-1">
            {section.words.map((w, i) => (
              <li
                key={`${w.text}-${i}`}
                className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 rounded-full text-xs font-semibold"
              >
                <WordIcon word={w.text} size="xs" />
                <span>{w.text}</span>
              </li>
            ))}
          </ul>
        )}
        {section.sentences && section.sentences.length > 0 && (
          <ul className="text-xs space-y-0.5">
            {section.sentences.map((s, i) => (
              <li key={`${s}-${i}`} className="text-gray-700">
                · {s}
              </li>
            ))}
          </ul>
        )}
        {section.sentencePattern && (
          <div className="text-xs font-mono bg-yellow-50 rounded p-1.5 text-gray-700">
            {section.sentencePattern}
          </div>
        )}
      </div>
    </div>
  );
}
