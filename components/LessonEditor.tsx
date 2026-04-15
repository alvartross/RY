'use client';

import { useState } from 'react';
import type { Lesson, LessonSection, Word } from '@/lib/types';
import WordIcon from '@/components/WordIcon';
import { formatKorean } from '@/lib/date';

type Props = {
  date: string;
  initial?: Lesson;
  onSave: (lesson: Lesson) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

type Tab = 'circle' | 'phonics' | 'journeys' | 'riseReaders';

const TABS: { key: Tab; label: string; icon: string; color: string }[] = [
  { key: 'circle', label: 'Circle', icon: '🔵', color: 'from-pink-400 to-rose-500' },
  { key: 'phonics', label: 'Phonics', icon: '🔤', color: 'from-amber-400 to-orange-500' },
  { key: 'journeys', label: 'Journeys', icon: '🚗', color: 'from-emerald-400 to-teal-500' },
  { key: 'riseReaders', label: 'RiseReaders', icon: '📘', color: 'from-violet-400 to-purple-500' },
];

const emptySection = (): LessonSection => ({ words: [], sentences: [] });

function sectionFromInitial(s?: LessonSection): LessonSection {
  return s ? { ...s, words: s.words ?? [], sentences: s.sentences ?? [] } : emptySection();
}

function sectionHasContent(s: LessonSection): boolean {
  return (
    (s.words.length ?? 0) > 0 ||
    (s.sentences?.length ?? 0) > 0 ||
    !!s.topic?.trim() ||
    !!s.sentencePattern?.trim()
  );
}

export default function LessonEditor({ date, initial, onSave, onCancel, onDelete }: Props) {
  const [tab, setTab] = useState<Tab>('circle');
  const [currentDate, setCurrentDate] = useState<string>(date);
  const [circle, setCircle] = useState<LessonSection>(sectionFromInitial(initial?.circle));
  const [phonics, setPhonics] = useState<LessonSection>(sectionFromInitial(initial?.phonics));
  const [journeys, setJourneys] = useState<LessonSection>(sectionFromInitial(initial?.journeys));
  const [riseReaders, setRiseReaders] = useState<LessonSection>(
    sectionFromInitial(initial?.riseReaders)
  );
  const [memo, setMemo] = useState(initial?.memo ?? '');

  const hasAny =
    sectionHasContent(circle) ||
    sectionHasContent(phonics) ||
    sectionHasContent(journeys) ||
    sectionHasContent(riseReaders);
  const dateChanged = currentDate !== date;

  const save = () => {
    if (!hasAny || !currentDate) return;
    onSave({
      date: currentDate,
      circle: sectionHasContent(circle) ? normalize(circle) : undefined,
      phonics: sectionHasContent(phonics) ? normalize(phonics) : undefined,
      journeys: sectionHasContent(journeys) ? normalize(journeys) : undefined,
      riseReaders: sectionHasContent(riseReaders) ? normalize(riseReaders) : undefined,
      memo: memo.trim() || undefined,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-5 w-full max-w-2xl space-y-4">
      <header className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="date"
              value={currentDate}
              onChange={(e) => setCurrentDate(e.target.value)}
              className="px-2 py-1 border rounded-lg text-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <span className="text-lg font-bold">수업</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {formatKorean(currentDate)}
            {dateChanged && (
              <span className="ml-2 text-orange-600 font-semibold">
                · 저장 시 이 날짜로 이동
              </span>
            )}
          </p>
        </div>
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm shrink-0"
        >
          ✕ 닫기
        </button>
      </header>

      <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
        {TABS.map((t) => {
          const current = t.key;
          const section =
            current === 'circle' ? circle : current === 'phonics' ? phonics : journeys;
          const filled = sectionHasContent(section);
          const active = tab === current;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1',
                active
                  ? `bg-gradient-to-br ${t.color} text-white shadow`
                  : 'text-gray-600 hover:bg-white',
              ].join(' ')}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {filled && !active && <span className="text-green-500">•</span>}
            </button>
          );
        })}
      </div>

      {tab === 'circle' && (
        <SectionFields
          value={circle}
          onChange={setCircle}
          topicLabel="오늘 배운 내용"
          topicPlaceholder="예: I like..."
        />
      )}
      {tab === 'phonics' && (
        <SectionFields
          value={phonics}
          onChange={setPhonics}
          topicLabel="오늘 배운 내용"
          topicPlaceholder="예: -am, -at 패밀리"
        />
      )}
      {tab === 'journeys' && (
        <SectionFields
          value={journeys}
          onChange={setJourneys}
          topicLabel="오늘 배운 내용"
          topicPlaceholder="예: Unit 3 - My Family"
        />
      )}
      {tab === 'riseReaders' && (
        <SectionFields
          value={riseReaders}
          onChange={setRiseReaders}
          topicLabel="오늘 배운 내용"
          topicPlaceholder="예: Book 5 - The Garden"
        />
      )}

      <label className="block">
        <span className="text-sm font-semibold text-gray-700">메모 (선택)</span>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          placeholder="선생님 설명이나 공통 메모"
          className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>

      <div className="flex gap-2 justify-between pt-1">
        {onDelete && (
          <button
            onClick={onDelete}
            className="px-4 py-3 bg-red-100 text-red-700 font-semibold rounded-lg hover:bg-red-200"
          >
            🗑 삭제
          </button>
        )}
        <div className="flex gap-2 ml-auto">
          <button
            onClick={onCancel}
            className="px-5 py-3 bg-gray-200 font-semibold rounded-lg hover:bg-gray-300"
          >
            취소
          </button>
          <button
            onClick={save}
            disabled={!hasAny}
            className="px-5 py-3 bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold rounded-lg disabled:opacity-40"
          >
            💾 저장
          </button>
        </div>
      </div>
    </div>
  );
}

function normalize(s: LessonSection): LessonSection {
  return {
    topic: s.topic?.trim() || undefined,
    words: s.words,
    sentences: s.sentences && s.sentences.length > 0 ? s.sentences : undefined,
    sentencePattern: s.sentencePattern?.trim() || undefined,
  };
}

function SectionFields({
  value,
  onChange,
  topicLabel,
  topicPlaceholder,
}: {
  value: LessonSection;
  onChange: (v: LessonSection) => void;
  topicLabel: string;
  topicPlaceholder: string;
}) {
  return (
    <div className="space-y-3">
      <label className="block">
        <span className="text-sm font-semibold text-gray-700">{topicLabel}</span>
        <input
          value={value.topic ?? ''}
          onChange={(e) => onChange({ ...value, topic: e.target.value })}
          placeholder={topicPlaceholder}
          className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </label>
      <WordEditor
        label="주요단어"
        words={value.words}
        onChange={(words) => onChange({ ...value, words })}
      />
      <PatternField
        value={value.sentencePattern}
        onChange={(sentencePattern) => onChange({ ...value, sentencePattern })}
      />
    </div>
  );
}

function PatternField({
  value,
  onChange,
}: {
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-gray-700">
        문장 패턴 (선택) — 단어 자리는{' '}
        <code className="bg-gray-100 px-1">___</code> 또는{' '}
        <code className="bg-gray-100 px-1">...</code>
      </span>
      <input
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="예: Who has ___? I have ___."
        className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 font-mono"
      />
    </label>
  );
}

function WordEditor({
  label,
  words,
  onChange,
}: {
  label: string;
  words: Word[];
  onChange: (w: Word[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const add = () => {
    const parts = draft
      .split(/[,，、\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    const existing = new Set(words.map((w) => w.text.toLowerCase()));
    const toAdd: Word[] = [];
    for (const t of parts) {
      const key = t.toLowerCase();
      if (existing.has(key)) continue;
      existing.add(key);
      toAdd.push({ text: t });
    }
    if (toAdd.length > 0) onChange([...words, ...toAdd]);
    setDraft('');
  };
  const remove = (idx: number) => onChange(words.filter((_, i) => i !== idx));
  return (
    <div>
      <span className="text-sm font-semibold text-gray-700">
        {label}{' '}
        <span className="text-xs font-normal text-gray-400">
          (쉼표로 구분해 여러 개 한번에 추가)
        </span>
      </span>
      <div className="flex gap-2 mt-1">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              add();
            }
          }}
          placeholder="예: books, pencils, crayons, erasers, scissors"
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={add}
          className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600"
        >
          + 추가
        </button>
      </div>
      {words.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-1.5">
          {words.map((w, i) => (
            <li
              key={`${w.text}-${i}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-100 rounded-full text-sm"
            >
              <WordIcon word={w.text} size="sm" />
              <span className="font-semibold">{w.text}</span>
              <button
                onClick={() => remove(i)}
                className="text-gray-400 hover:text-red-500"
                aria-label={`${w.text} 삭제`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

