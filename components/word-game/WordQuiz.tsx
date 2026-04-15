'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Stage } from '@/lib/wordBank';
import WordIcon from '@/components/WordIcon';
import { speak } from '@/lib/tts';
import { awardWordStage, hasClearedStage } from '@/lib/points';

type Props = {
  stage: Stage;
  onFinish: (result: { correct: number; total: number; awarded: number; alreadyDone: boolean }) => void;
  onExit: () => void;
};

type QuestionMode = 'emoji-to-word' | 'word-to-emoji';

type Question = {
  answer: string;
  options: string[];
  mode: QuestionMode;
};

function shuffle<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function buildQuestions(words: string[]): Question[] {
  const shuffled = shuffle(words);
  return shuffled.map((answer, idx) => {
    const pool = words.filter((w) => w !== answer);
    const distractors = shuffle(pool).slice(0, 3);
    const options = shuffle([answer, ...distractors]);
    return {
      answer,
      options,
      mode: idx % 2 === 0 ? 'emoji-to-word' : 'word-to-emoji',
    };
  });
}

export default function WordQuiz({ stage, onFinish, onExit }: Props) {
  const questions = useMemo(() => buildQuestions(stage.words), [stage]);
  const [idx, setIdx] = useState(0);
  const [correct, setCorrect] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [status, setStatus] = useState<'asking' | 'right' | 'wrong'>('asking');

  const q = questions[idx];
  const isLast = idx >= questions.length - 1;

  useEffect(() => {
    if (!q) return;
    speak(q.answer);
  }, [q]);

  if (!q) return null;

  const pick = (opt: string) => {
    if (status !== 'asking') return;
    setPicked(opt);
    if (opt === q.answer) {
      setCorrect((n) => n + 1);
      setStatus('right');
      speak(q.answer);
    } else {
      setStatus('wrong');
    }
  };

  const advance = () => {
    if (isLast) {
      const final = status === 'right' ? correct : correct;
      const allRight = final === questions.length;
      if (allRight) {
        const result = awardWordStage(stage.id, 100);
        onFinish({ correct: final, total: questions.length, awarded: result.awarded, alreadyDone: result.alreadyDone });
      } else {
        onFinish({ correct: final, total: questions.length, awarded: 0, alreadyDone: hasClearedStage(stage.id) });
      }
    } else {
      setIdx(idx + 1);
      setPicked(null);
      setStatus('asking');
    }
  };

  const retry = () => {
    setPicked(null);
    setStatus('asking');
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {idx + 1} / {questions.length} · 정답 {correct}
        </div>
        <button
          onClick={onExit}
          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
        >
          ← 나가기
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all bg-gradient-to-r ${stage.color}`}
          style={{ width: `${((idx + (status !== 'asking' ? 1 : 0)) / questions.length) * 100}%` }}
        />
      </div>

      {q.mode === 'emoji-to-word' ? (
        <EmojiPrompt word={q.answer} onSpeak={() => speak(q.answer)} />
      ) : (
        <WordPrompt word={q.answer} onSpeak={() => speak(q.answer)} />
      )}

      <div className="grid grid-cols-2 gap-3">
        {q.options.map((opt) => {
          const isAnswer = opt === q.answer;
          const isPicked = picked === opt;
          const reveal = status !== 'asking';
          let color = 'bg-white border-2 border-gray-200 hover:border-blue-400';
          if (reveal && isAnswer) color = 'bg-green-100 border-2 border-green-500 text-green-800';
          else if (reveal && isPicked && !isAnswer) color = 'bg-red-100 border-2 border-red-500 text-red-800';
          return (
            <button
              key={opt}
              onClick={() => pick(opt)}
              disabled={status !== 'asking'}
              className={`p-4 rounded-xl font-bold text-lg shadow active:scale-95 transition-all flex items-center justify-center gap-2 ${color}`}
            >
              {q.mode === 'emoji-to-word' ? (
                <span>{opt}</span>
              ) : (
                <WordIcon word={opt} size="md" />
              )}
            </button>
          );
        })}
      </div>

      {status === 'right' && (
        <div className="bg-green-50 rounded-xl p-3 flex items-center justify-between">
          <span className="font-bold text-green-700">✅ 정답!</span>
          <button
            onClick={advance}
            className="px-5 py-2 bg-gradient-to-br from-green-400 to-green-600 text-white font-bold rounded-lg"
          >
            {isLast ? '🎉 끝!' : '다음 ▶'}
          </button>
        </div>
      )}
      {status === 'wrong' && (
        <div className="bg-red-50 rounded-xl p-3 flex items-center justify-between">
          <span className="font-bold text-red-700">❌ 다시 해봐요</span>
          <button
            onClick={retry}
            className="px-5 py-2 bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-lg"
          >
            다시 선택
          </button>
        </div>
      )}
    </div>
  );
}

function EmojiPrompt({ word, onSpeak }: { word: string; onSpeak: () => void }) {
  return (
    <button
      onClick={onSpeak}
      className="w-full bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl py-8 flex flex-col items-center active:scale-[0.99]"
    >
      <WordIcon word={word} size="2xl" />
      <div className="mt-4 text-sm text-gray-500">🔊 탭하면 발음 들려요</div>
    </button>
  );
}

function WordPrompt({ word, onSpeak }: { word: string; onSpeak: () => void }) {
  return (
    <button
      onClick={onSpeak}
      className="w-full bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl py-10 text-center active:scale-[0.99]"
    >
      <div className="text-5xl sm:text-6xl font-bold">{word}</div>
      <div className="mt-2 text-sm text-gray-500">🔊 이 단어에 맞는 그림을 고르세요</div>
    </button>
  );
}
