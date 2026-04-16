'use client';

import { useMemo, useState } from 'react';

type Props = { onBack: () => void };

const POOL = ['🌸', '🦋', '🌈', '🍦', '🎀', '🐰', '🌟', '💎', '🌻', '🍓', '🐱', '🦄', '🎈', '🍰', '🌷', '🐶', '💗', '🧁', '🎵', '🌙'];

function shuffle<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

function generateLevel(size: number, diffCount: number) {
  const total = size * size;
  const base = shuffle(POOL).slice(0, total);
  const modified = [...base];
  const diffIndices = new Set<number>();
  while (diffIndices.size < diffCount) {
    diffIndices.add(Math.floor(Math.random() * total));
  }
  for (const idx of diffIndices) {
    let replacement: string;
    do {
      replacement = POOL[Math.floor(Math.random() * POOL.length)];
    } while (replacement === base[idx]);
    modified[idx] = replacement;
  }
  return { base, modified, diffIndices, size };
}

export default function SpotDifference({ onBack }: Props) {
  const [level, setLevel] = useState(1);
  const [found, setFound] = useState<Set<number>>(new Set());
  const [wrongFlash, setWrongFlash] = useState<number | null>(null);
  const [cleared, setCleared] = useState(false);

  const size = level <= 3 ? 3 : level <= 6 ? 4 : 5;
  const diffCount = Math.min(3 + Math.floor((level - 1) / 2), 5);

  const puzzle = useMemo(() => generateLevel(size, diffCount), [level, size, diffCount]);

  const tap = (idx: number) => {
    if (cleared) return;
    if (found.has(idx)) return;
    if (puzzle.diffIndices.has(idx)) {
      const next = new Set([...found, idx]);
      setFound(next);
      if (next.size === puzzle.diffIndices.size) {
        setCleared(true);
      }
    } else {
      setWrongFlash(idx);
      setTimeout(() => setWrongFlash(null), 400);
    }
  };

  const nextLevel = () => {
    setLevel((l) => l + 1);
    setFound(new Set());
    setCleared(false);
  };

  const restart = () => {
    setLevel(1);
    setFound(new Set());
    setCleared(false);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-md mx-auto">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100">← 뒤로</button>
        <div className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
          레벨 {level} · 찾기 {found.size}/{puzzle.diffIndices.size}
        </div>
      </div>

      {cleared ? (
        <div className="text-center space-y-3 py-6">
          <div className="text-5xl">🎉</div>
          <div className="text-xl font-bold">레벨 {level} 클리어!</div>
          <div className="flex gap-2 justify-center">
            <button
              onClick={nextLevel}
              className="px-6 py-3 bg-gradient-to-br from-green-400 to-emerald-500 text-white font-bold rounded-xl"
            >
              다음 레벨 ▶
            </button>
            <button
              onClick={restart}
              className="px-6 py-3 bg-gray-200 font-semibold rounded-xl"
            >
              처음부터
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="text-center text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            👆 아래쪽 그림에서 위와 다른 부분을 찾아 탭하세요
          </div>

          <div className="w-full rounded-xl p-2" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-[10px] font-bold text-center mb-1" style={{ color: 'var(--text-muted)' }}>원본</div>
            <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
              {puzzle.base.map((emoji, idx) => (
                <div
                  key={`a-${idx}`}
                  className="aspect-square rounded-lg flex items-center justify-center text-3xl sm:text-4xl bg-yellow-50"
                >
                  {emoji}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center text-lg font-bold" style={{ color: 'var(--text-muted)' }}>⬇ 다른 곳을 찾아봐! ⬇</div>

          <div className="w-full rounded-xl p-2" style={{ backgroundColor: 'var(--bg-card)' }}>
            <div className="text-[10px] font-bold text-center mb-1" style={{ color: 'var(--text-muted)' }}>다른 그림</div>
            <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${puzzle.size}, 1fr)` }}>
              {puzzle.modified.map((emoji, idx) => {
                const isDiff = puzzle.diffIndices.has(idx);
                const isFound = found.has(idx);
                const isWrong = wrongFlash === idx;
                return (
                  <button
                    key={`b-${idx}`}
                    onClick={() => tap(idx)}
                    className={[
                      'aspect-square rounded-lg flex items-center justify-center text-3xl sm:text-4xl transition-all active:scale-90',
                      isFound
                        ? 'bg-green-200 ring-2 ring-green-500'
                        : isWrong
                          ? 'bg-red-200'
                          : 'bg-blue-50 hover:bg-blue-100',
                    ].join(' ')}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
