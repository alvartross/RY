'use client';

import { useState } from 'react';
import type { PracticeInput } from '@/lib/practice';
import WordIcon from '@/components/WordIcon';
import { renderSentenceParts, fillSentence } from '@/lib/sentence';
import { speak } from '@/lib/tts';

type Props = {
  input: PracticeInput;
  onFinish: () => void;
};

type Repeat = 3 | 5;

export default function SentencePractice({ input, onFinish }: Props) {
  const [repeat, setRepeat] = useState<Repeat | null>(null);
  const [wordIdx, setWordIdx] = useState(0);
  const [listenCount, setListenCount] = useState(0);

  if (!repeat) {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl text-center space-y-6">
        <h2 className="text-3xl font-bold">몇 번씩 반복할까요?</h2>
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => setRepeat(3)}
            className="px-10 py-6 bg-gradient-to-br from-green-400 to-green-600 text-white text-3xl font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-95"
          >
            3회
          </button>
          <button
            onClick={() => setRepeat(5)}
            className="px-10 py-6 bg-gradient-to-br from-blue-400 to-blue-600 text-white text-3xl font-bold rounded-2xl shadow-lg hover:shadow-xl active:scale-95"
          >
            5회
          </button>
        </div>
        <button onClick={onFinish} className="text-gray-500 underline">
          돌아가기
        </button>
      </div>
    );
  }

  const word = input.words[wordIdx];
  const pattern = input.sentencePattern ?? '___';
  const parts = renderSentenceParts(pattern, word.text);
  const fullSentence = fillSentence(pattern, word.text);
  const totalSteps = input.words.length * repeat;
  const doneSteps = wordIdx * repeat + Math.min(listenCount, repeat);
  const readyForNext = listenCount >= repeat;
  const isLast = wordIdx === input.words.length - 1;

  const onListen = () => {
    speak(fullSentence);
    if (listenCount < repeat) setListenCount(listenCount + 1);
  };

  const onNext = () => {
    if (isLast) {
      onFinish();
    } else {
      setWordIdx(wordIdx + 1);
      setListenCount(0);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-2xl space-y-5">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {wordIdx + 1} / {input.words.length} 단어 · 들은 횟수 {Math.min(listenCount, repeat)} / {repeat}
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
          className="bg-gradient-to-r from-pink-400 to-orange-400 h-full transition-all"
          style={{ width: `${(doneSteps / totalSteps) * 100}%` }}
        />
      </div>

      <div className="py-8 sm:py-10 text-center space-y-5">
        <div className="flex justify-center">
          <WordIcon word={word.text} size="xl" />
        </div>
        <div className="text-2xl sm:text-3xl font-bold leading-relaxed break-words">
          {parts.map((p, i) => (
            <span
              key={i}
              className={p.isWord ? 'text-pink-600 underline decoration-wavy decoration-pink-300' : ''}
            >
              {p.text}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-center gap-1.5">
          {Array.from({ length: repeat }).map((_, i) => (
            <span
              key={i}
              className={[
                'w-3 h-3 rounded-full transition-all',
                i < listenCount ? 'bg-pink-500' : 'bg-gray-200',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onListen}
          className={`flex-1 px-4 py-4 text-white font-bold text-xl rounded-xl shadow-lg active:scale-95 transition-all ${
            readyForNext
              ? 'bg-gradient-to-br from-yellow-300 to-orange-300 opacity-90'
              : 'bg-gradient-to-br from-yellow-400 to-orange-400 hover:shadow-xl'
          }`}
        >
          🔊 듣기
        </button>
        {readyForNext && (
          <button
            onClick={onNext}
            className={`flex-1 px-4 py-4 text-white font-bold text-xl rounded-xl shadow-lg hover:shadow-xl active:scale-95 transition-all bg-gradient-to-br ${
              isLast ? 'from-purple-400 to-purple-600' : 'from-green-400 to-green-600'
            }`}
          >
            {isLast ? '🎉 끝!' : '다음 ▶'}
          </button>
        )}
      </div>

      {!readyForNext && (
        <p className="text-center text-xs text-gray-400">
          {repeat - listenCount}번 더 들으면 다음 단어로 넘어갈 수 있어요
        </p>
      )}
    </div>
  );
}
