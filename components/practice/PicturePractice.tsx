'use client';

import { useEffect, useMemo, useState } from 'react';
import type { PracticeInput } from '@/lib/practice';
import WordIcon from '@/components/WordIcon';
import { fillSentence } from '@/lib/sentence';
import { speak } from '@/lib/tts';

type Props = {
  input: PracticeInput;
  onFinish: () => void;
};

type Status = 'asking' | 'correct' | 'wrong';

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function PicturePractice({ input, onFinish }: Props) {
  const [order, setOrder] = useState<number[]>([]);
  const [round, setRound] = useState(0);
  const [status, setStatus] = useState<Status>('asking');
  const [picked, setPicked] = useState<string | null>(null);

  useEffect(() => {
    setOrder(shuffle(input.words.map((_, i) => i)));
    setRound(0);
    setStatus('asking');
    setPicked(null);
  }, [input]);

  const total = input.words.length;
  const isDone = round >= total;
  const currentIdx = order[round];
  const answer = currentIdx != null ? input.words[currentIdx] : null;

  const options = useMemo(() => {
    if (!answer) return [];
    return shuffle(input.words);
  }, [answer, input.words]);

  if (isDone) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-2xl text-center space-y-6">
        <div className="text-7xl">🎉</div>
        <h2 className="text-3xl font-bold">모두 맞췄어요!</h2>
        <button
          onClick={onFinish}
          className="px-8 py-4 bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold text-xl rounded-xl shadow-lg"
        >
          달력으로 돌아가기
        </button>
      </div>
    );
  }

  if (!answer) return null;

  const advance = () => {
    setStatus('asking');
    setPicked(null);
    setRound((r) => r + 1);
  };

  const pick = (text: string) => {
    if (status !== 'asking') return;
    setPicked(text);
    if (text.toLowerCase() === answer.text.toLowerCase()) {
      setStatus('correct');
      speak(answer.text);
      window.setTimeout(advance, 1800);
    } else {
      setStatus('wrong');
    }
  };

  const retry = () => {
    setStatus('asking');
    setPicked(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {round + 1} / {total}
        </div>
        <button
          onClick={onFinish}
          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
        >
          ← 나가기
        </button>
      </div>

      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className="bg-gradient-to-r from-purple-400 to-pink-400 h-full transition-all"
          style={{ width: `${((round + (status === 'correct' ? 1 : 0)) / total) * 100}%` }}
        />
      </div>

      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl py-12 text-center flex flex-col items-center">
        <WordIcon word={answer.text} size="2xl" />
        <div className="mt-4 text-gray-600">이 그림은 무엇일까요?</div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((o, i) => {
          const isAnswer = o.text.toLowerCase() === answer.text.toLowerCase();
          const isPicked = picked?.toLowerCase() === o.text.toLowerCase();
          const reveal = status !== 'asking';
          const base = 'p-4 rounded-xl font-bold text-xl shadow active:scale-95 transition-all';
          let color = 'bg-white border-2 border-gray-200 hover:border-blue-400';
          if (reveal && isAnswer) color = 'bg-green-100 border-2 border-green-500 text-green-800';
          else if (reveal && isPicked && !isAnswer) color = 'bg-red-100 border-2 border-red-500 text-red-800';
          return (
            <button
              key={`${o.text}-${i}`}
              onClick={() => pick(o.text)}
              disabled={status !== 'asking'}
              className={`${base} ${color} flex items-center justify-center gap-2`}
            >
              <WordIcon word={o.text} size="md" />
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>

      {status === 'correct' && (
        <div className="bg-green-50 rounded-xl p-3 text-center space-y-1 animate-pulse">
          <div className="text-2xl font-bold">✅ 정답!</div>
          <div className="text-lg font-semibold text-gray-700">
            {answer.text}
          </div>
          <div className="text-xs text-gray-500">잠시 후 다음 문제로 넘어가요</div>
        </div>
      )}

      {status === 'wrong' && (
        <div className="bg-red-50 rounded-xl p-4 text-center space-y-3">
          <div className="text-2xl">❌ 다시 해보세요</div>
          <button
            onClick={retry}
            className="px-6 py-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-lg"
          >
            다시 선택
          </button>
        </div>
      )}
    </div>
  );
}
