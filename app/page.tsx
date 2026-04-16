'use client';

import { useEffect, useState } from 'react';
import Calendar from '@/components/Calendar';
import LessonEditor from '@/components/LessonEditor';
import WordReviewPractice from '@/components/practice/WordReviewPractice';
import WritingPractice from '@/components/practice/WritingPractice';
import PicturePractice from '@/components/practice/PicturePractice';
import PhonicsPractice from '@/components/practice/PhonicsPractice';
import TodaysLearnings from '@/components/TodaysLearnings';
import TodayProgress from '@/components/TodayProgress';
import TodaysWords from '@/components/TodaysWords';
import DictionaryWidget from '@/components/DictionaryWidget';
import TopBar from '@/components/layout/TopBar';
import PraisePanel from '@/components/PraisePanel';
import AdminPinModal from '@/components/AdminPinModal';
import Modal from '@/components/Modal';
import type { LessonMap } from '@/lib/types';
import { getAllLessons, saveLesson, deleteLesson } from '@/lib/storage';
import { useAdmin } from '@/lib/admin';
import { todayKey } from '@/lib/date';
import { awardCategory, type Category } from '@/lib/points';
import { inputForCategory, type PracticeInput } from '@/lib/practice';
import { syncLessonsFromCloud } from '@/lib/cloud';
import { useAuth } from '@/lib/useAuth';
import { addSticker } from '@/lib/stickerTree';
import { CATEGORY_LABEL } from '@/lib/points';

type PracticeView =
  | { kind: 'none' }
  | { kind: 'review'; input: PracticeInput }
  | { kind: 'phonics'; input: PracticeInput }
  | { kind: 'listening'; input: PracticeInput }
  | { kind: 'writing'; input: PracticeInput }
  | { kind: 'riseReaders'; input: PracticeInput };

const PRACTICE_LABELS = [
  { key: 'review', label: "Today's\nReview", icon: '📖', sub: '단어 복습', color: 'from-pink-400 to-rose-500', section: 'circle' },
  { key: 'listening', label: 'Listening', icon: '🎧', sub: '듣고 고르기', color: 'from-emerald-400 to-teal-500', section: 'circle' },
  { key: 'writing', label: 'Writing', icon: '✍️', sub: '따라 쓰기', color: 'from-violet-400 to-indigo-500', section: 'circle' },
  { key: 'phonics', label: 'Phonics', icon: '🔤', sub: '소리 읽기', color: 'from-amber-400 to-orange-500', section: 'phonics' },
  { key: 'riseReaders', label: 'Rise\nReaders', icon: '📘', sub: '단어 복습', color: 'from-sky-400 to-blue-500', section: 'riseReaders' },
] as const;

const CATEGORY_EMPTY_MSG: Record<Category, string> = {
  review: 'Circle 수업을 먼저 입력해주세요',
  phonics: 'Phonics 수업을 먼저 입력해주세요',
  listening: 'Circle 수업을 먼저 입력해주세요',
  writing: 'Circle 수업을 먼저 입력해주세요',
  riseReaders: 'RiseReaders 수업을 먼저 입력해주세요',
};

export default function Home() {
  const [lessons, setLessons] = useState<LessonMap>({});
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [editorOpen, setEditorOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [practice, setPractice] = useState<PracticeView>({ kind: 'none' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const { isAdmin, enter } = useAdmin();
  const { user } = useAuth();

  useEffect(() => {
    setLessons(getAllLessons());
  }, []);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    syncLessonsFromCloud().then((res) => {
      if (cancelled || !res) return;
      setLessons(getAllLessons());
      setRefreshKey((k) => k + 1);
    });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const refresh = () => {
    setLessons(getAllLessons());
    setRefreshKey((k) => k + 1);
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const selectedLesson = lessons[selectedDate];

  const startPractice = (category: Category) => {
    if (!selectedLesson) {
      showToast('이 날짜에는 수업이 없어요');
      return;
    }
    const input = inputForCategory(selectedLesson, category);
    if (!input) {
      showToast(CATEGORY_EMPTY_MSG[category]);
      return;
    }
    setPractice({ kind: category, input });
  };

  const finishPractice = (category: Category, extras?: { bonus?: number }) => {
    const bonus = extras?.bonus ?? 0;
    const { awarded, alreadyDone, bonus: gotBonus } = awardCategory(
      category,
      selectedDate,
      bonus
    );
    if (alreadyDone) {
      showToast('오늘은 이미 포인트를 받았어요 😊');
    } else {
      addSticker(`학습: ${CATEGORY_LABEL[category]}`, '📚', selectedDate);
      const extraMsg = gotBonus > 0 ? ` (보너스 +${gotBonus}P)` : '';
      showToast(`+${awarded}P 획득!${extraMsg} 🌿스티커+1`);
      setRefreshKey((k) => k + 1);
    }
    setPractice({ kind: 'none' });
  };

  return (
    <>
      <TopBar onOpenAdmin={() => setPinOpen(true)} refreshKey={refreshKey} />

      <main className="max-w-3xl mx-auto px-4 pt-4 pb-24 flex flex-col gap-4">
        <DictionaryWidget />

        <section className="grid gap-4 sm:grid-cols-2">
          <Calendar
            lessonDates={new Set(Object.keys(lessons))}
            selectedDate={selectedDate}
            onSelectDate={(d) => setSelectedDate(d)}
          />
          <TodaysLearnings
            lesson={selectedLesson}
            selectedDate={selectedDate}
            isAdmin={isAdmin}
            onAddLesson={() => setEditorOpen(true)}
            onOpenAdmin={() => setPinOpen(true)}
          />
        </section>

        <TodaysWords lesson={selectedLesson} />

        <section>
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 px-1">
            학습 메뉴
          </h2>
          <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5">
            {PRACTICE_LABELS.map((p) => {
              const hasContent = selectedLesson
                ? inputForCategory(selectedLesson, p.key) !== null
                : false;
              return (
                <button
                  key={p.key}
                  onClick={() => startPractice(p.key)}
                  className={[
                    'aspect-[3/4] rounded-xl sm:rounded-2xl text-white shadow-lg active:scale-95 transition-all flex flex-col items-center justify-center p-1 sm:p-2 relative',
                    hasContent
                      ? `bg-gradient-to-br ${p.color} hover:shadow-xl`
                      : 'bg-gray-300',
                  ].join(' ')}
                >
                  <span className="text-2xl sm:text-3xl" aria-hidden>{p.icon}</span>
                  <span className="font-bold mt-0.5 text-[10px] sm:text-xs leading-tight text-center whitespace-pre-line">{p.label}</span>
                  <span className="text-[8px] sm:text-[10px] opacity-90">{p.sub}</span>
                  {!hasContent && (
                    <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] sm:text-[10px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold shadow whitespace-nowrap">
                      수업없음
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        <TodayProgress refreshKey={refreshKey} />

        {isAdmin && <PraisePanel onPointsChange={() => setRefreshKey((k) => k + 1)} />}
      </main>

      <AdminPinModal
        open={pinOpen}
        onClose={() => setPinOpen(false)}
        onSuccess={() => enter()}
      />

      <Modal open={editorOpen} onClose={() => setEditorOpen(false)} size="lg">
        <LessonEditor
          date={selectedDate}
          initial={lessons[selectedDate]}
          onSave={(lesson) => {
            const moved = lesson.date !== selectedDate;
            if (moved && lessons[lesson.date]) {
              if (!confirm(`${lesson.date}에 이미 수업이 있어요. 덮어쓸까요?`)) {
                return;
              }
            }
            if (moved) deleteLesson(selectedDate);
            saveLesson(lesson);
            if (moved) setSelectedDate(lesson.date);
            refresh();
            setEditorOpen(false);
            showToast(moved ? '수업 날짜를 옮겼어요' : '수업이 저장됐어요');
          }}
          onCancel={() => setEditorOpen(false)}
          onDelete={
            lessons[selectedDate]
              ? () => {
                  if (confirm('이 수업을 삭제할까요? 되돌릴 수 없어요.')) {
                    deleteLesson(selectedDate);
                    refresh();
                    setEditorOpen(false);
                  }
                }
              : undefined
          }
        />
      </Modal>

      {practice.kind !== 'none' && (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-yellow-100 via-pink-100 to-blue-100 overflow-y-auto p-4 flex items-start justify-center">
          <div className="w-full max-w-2xl">
            {practice.kind === 'review' && (
              <WordReviewPractice
                input={practice.input}
                onFinish={() => finishPractice('review')}
              />
            )}
            {practice.kind === 'listening' && (
              <PicturePractice
                input={practice.input}
                onFinish={() => finishPractice('listening')}
              />
            )}
            {practice.kind === 'writing' && (
              <WritingPractice
                input={practice.input}
                onFinish={(info) =>
                  finishPractice('writing', { bonus: info.bonus ? 50 : 0 })
                }
              />
            )}
            {practice.kind === 'riseReaders' && (
              <WordReviewPractice
                input={practice.input}
                onFinish={() => finishPractice('riseReaders')}
              />
            )}
            {practice.kind === 'phonics' && (
              <PhonicsPractice
                input={practice.input}
                onFinish={() => finishPractice('phonics')}
              />
            )}
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg">
          {toast}
        </div>
      )}
    </>
  );
}

