'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import WordQuiz from '@/components/word-game/WordQuiz';
import { STAGES, type Stage } from '@/lib/wordBank';
import { hasClearedStage } from '@/lib/points';

export default function WordGamePage() {
  const [stage, setStage] = useState<Stage | null>(null);
  const [cleared, setCleared] = useState<Record<string, boolean>>({});
  const [result, setResult] = useState<
    null | { stage: Stage; correct: number; total: number; awarded: number; alreadyDone: boolean }
  >(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const map: Record<string, boolean> = {};
    for (const s of STAGES) map[s.id] = hasClearedStage(s.id);
    setCleared(map);
  }, [refreshKey]);

  if (stage && !result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 via-pink-50 to-blue-50 pt-4 pb-24">
        <div className="max-w-2xl mx-auto px-4 flex justify-center">
          <WordQuiz
            stage={stage}
            onExit={() => setStage(null)}
            onFinish={(r) => setResult({ stage, ...r })}
          />
        </div>
      </div>
    );
  }

  if (result) {
    const perfect = result.correct === result.total;
    return (
      <>
        <TopBar refreshKey={refreshKey} />
        <main className="max-w-xl mx-auto px-4 pt-10 pb-24">
          <div className="bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
            <div className="text-7xl">{perfect ? '🏆' : '👍'}</div>
            <h2 className="text-3xl font-bold">
              {perfect ? '완벽해요!' : '잘 했어요!'}
            </h2>
            <p className="text-gray-600">
              {result.correct} / {result.total} 정답
            </p>
            {result.awarded > 0 && (
              <div className="bg-gradient-to-br from-yellow-300 to-orange-400 text-white font-bold rounded-xl py-3">
                🎉 +{result.awarded}P 획득!
              </div>
            )}
            {result.alreadyDone && result.awarded === 0 && perfect && (
              <div className="bg-gray-100 text-gray-600 rounded-xl py-3 text-sm">
                이 스테이지 보너스는 이미 받았어요
              </div>
            )}
            {!perfect && (
              <div className="bg-blue-50 text-blue-700 rounded-xl py-3 text-sm">
                모두 맞추면 +100P를 받을 수 있어요. 다시 도전!
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setResult(null);
                  setRefreshKey((k) => k + 1);
                }}
                className="flex-1 px-4 py-3 bg-gray-100 font-semibold rounded-xl"
              >
                스테이지 선택
              </button>
              <button
                onClick={() => {
                  setResult(null);
                }}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-xl"
              >
                다시 하기
              </button>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar refreshKey={refreshKey} />
      <main className="max-w-3xl mx-auto px-4 pt-6 pb-24 space-y-4">
        <header className="text-center space-y-1">
          <h1 className="text-3xl font-bold">📝 Word Game</h1>
          <p className="text-gray-600 text-sm">
            스테이지당 단어 20개 · 모두 맞히면 <strong>+100P</strong>
          </p>
        </header>

        <div className="grid gap-3 sm:grid-cols-2">
          {STAGES.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setStage(s)}
              className={`text-left p-5 rounded-2xl shadow-lg active:scale-95 transition-all text-white bg-gradient-to-br ${s.color}`}
            >
              <div className="flex items-center justify-between">
                <div className="text-xs opacity-90">Stage {i + 1}</div>
                {cleared[s.id] && (
                  <span className="text-xs font-bold bg-white/30 backdrop-blur px-2 py-0.5 rounded-full">
                    ✓ 100P 획득
                  </span>
                )}
              </div>
              <div className="mt-2 flex items-center gap-3">
                <div className="text-5xl">{s.emoji}</div>
                <div>
                  <div className="text-2xl font-bold">{s.title}</div>
                  <div className="text-xs opacity-90">{s.subtitle}</div>
                </div>
              </div>
              <div className="mt-3 text-xs opacity-90">단어 {s.words.length}개</div>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
