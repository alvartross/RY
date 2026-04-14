'use client';

import { useEffect, useState } from 'react';
import type { PracticeInput } from '@/lib/practice';
import { getEmojiForWord } from '@/lib/wordEmoji';
import { speak } from '@/lib/tts';

type Props = {
  input: PracticeInput;
  onFinish: () => void;
};

export default function PhonicsPractice({ input, onFinish }: Props) {
  const [idx, setIdx] = useState(0);
  const word = input.words[idx];
  const total = input.words.length;
  const isLast = idx === total - 1;

  useEffect(() => {
    if (word) speak(word.text);
  }, [word]);

  if (!word) return null;

  const emoji = getEmojiForWord(word.text);
  const hasEmoji = emoji !== '❓';

  const next = () => {
    if (isLast) onFinish();
    else setIdx(idx + 1);
  };
  const prev = () => {
    if (idx > 0) setIdx(idx - 1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 w-full max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {idx + 1} / {total}
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
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all"
          style={{ width: `${((idx + 1) / total) * 100}%` }}
        />
      </div>

      <button
        onClick={() => speak(word.text)}
        className="w-full bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl py-10 sm:py-14 text-center active:scale-[0.99] transition-transform"
      >
        {hasEmoji && <div className="text-8xl leading-none">{emoji}</div>}
        <div className={`font-black mt-3 ${hasEmoji ? 'text-5xl sm:text-6xl' : 'text-7xl sm:text-8xl'}`}>
          {word.text}
        </div>
        <div className="mt-2 text-sm text-gray-500">🔊 탭하면 다시 들려요</div>
      </button>

      <div className="flex gap-3 justify-between">
        <button
          onClick={prev}
          disabled={idx === 0}
          className="px-5 py-3 bg-white border font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ◀ 이전
        </button>
        <button
          onClick={() => speak(word.text)}
          className="px-5 py-3 bg-gradient-to-br from-yellow-400 to-orange-400 text-white font-bold rounded-lg"
        >
          🔊 듣기
        </button>
        {!isLast ? (
          <button
            onClick={next}
            className="px-6 py-3 bg-gradient-to-br from-green-400 to-green-600 text-white font-bold rounded-lg"
          >
            다음 ▶
          </button>
        ) : (
          <button
            onClick={onFinish}
            className="px-6 py-3 bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold rounded-lg"
          >
            🎉 끝!
          </button>
        )}
      </div>
    </div>
  );
}
