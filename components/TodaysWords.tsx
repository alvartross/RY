'use client';

import { useEffect, useMemo, useState } from 'react';
import type { Lesson } from '@/lib/types';
import WordIcon from '@/components/WordIcon';
import { translateToKorean, getCachedTranslation } from '@/lib/translate';
import { speak } from '@/lib/tts';

type Props = { lesson: Lesson | undefined };

export default function TodaysWords({ lesson }: Props) {
  const words = useMemo(() => lesson?.circle?.words ?? [], [lesson]);
  const [meanings, setMeanings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (words.length === 0) {
      setMeanings({});
      return;
    }
    const initial: Record<string, string> = {};
    for (const w of words) {
      const cached = getCachedTranslation(w.text);
      if (cached) initial[w.text] = cached;
    }
    setMeanings(initial);
    const toFetch = words.filter((w) => !initial[w.text]);
    if (toFetch.length === 0) return;

    let cancelled = false;
    setLoading(true);
    Promise.all(
      toFetch.map(async (w) => ({ text: w.text, kor: await translateToKorean(w.text) }))
    )
      .then((results) => {
        if (cancelled) return;
        setMeanings((prev) => {
          const next = { ...prev };
          for (const r of results) if (r.kor) next[r.text] = r.kor;
          return next;
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [words]);

  if (words.length === 0) {
    return (
      <section className="bg-white rounded-2xl shadow p-4">
        <h2 className="font-bold text-gray-800 mb-1">📚 오늘의 단어</h2>
        <p className="text-sm text-gray-400">
          Circle 수업이 입력되면 오늘 배울 단어와 한글 뜻이 여기에 보여요
        </p>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800">📚 오늘의 단어</h2>
        {loading && <span className="text-xs text-gray-400">뜻 불러오는 중…</span>}
      </div>
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {words.map((w, i) => (
          <li key={`${w.text}-${i}`}>
            <button
              onClick={() => speak(w.text)}
              className="w-full flex items-center gap-3 bg-blue-50 hover:bg-blue-100 rounded-xl p-2.5 text-left active:scale-[0.99] transition-colors"
            >
              <WordIcon word={w.text} size="md" />
              <div className="flex-1 min-w-0">
                <div className="font-bold truncate">{w.text}</div>
                <div className="text-xs text-blue-800 truncate">
                  {meanings[w.text] ?? (loading ? '불러오는 중…' : '뜻 없음')}
                </div>
              </div>
              <span className="text-sm text-gray-400 shrink-0">🔊</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-gray-400 text-center">
        단어를 탭하면 발음이 나와요. 뜻은 자동 번역(MyMemory)
      </p>
    </section>
  );
}
