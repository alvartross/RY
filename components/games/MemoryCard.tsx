'use client';

import { useEffect, useMemo, useState } from 'react';

type Props = { onBack: () => void };

const CARD_EMOJIS = ['🌸', '🦋', '🌈', '🍦', '🎀', '🐰', '🌟', '💎'];

function shuffle<T>(arr: T[]): T[] {
  const c = [...arr];
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [c[i], c[j]] = [c[j], c[i]];
  }
  return c;
}

export default function MemoryCard({ onBack }: Props) {
  const cards = useMemo(() => shuffle([...CARD_EMOJIS, ...CARD_EMOJIS]), []);
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matched, setMatched] = useState<Set<number>>(new Set());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);

  const allMatched = matched.size === cards.length;

  const flip = (idx: number) => {
    if (locked || flipped.includes(idx) || matched.has(idx)) return;
    const next = [...flipped, idx];
    setFlipped(next);
    if (next.length === 2) {
      setMoves((m) => m + 1);
      setLocked(true);
      if (cards[next[0]] === cards[next[1]]) {
        setMatched((prev) => new Set([...prev, next[0], next[1]]));
        setFlipped([]);
        setLocked(false);
      } else {
        setTimeout(() => {
          setFlipped([]);
          setLocked(false);
        }, 800);
      }
    }
  };

  const restart = () => {
    setFlipped([]);
    setMatched(new Set());
    setMoves(0);
    setLocked(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto">
      <div className="flex items-center justify-between w-full">
        <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200">
          🎮 게임목록
        </button>
        <div className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
          시도: {moves}회
        </div>
      </div>

      {allMatched ? (
        <div className="text-center space-y-3 py-8">
          <div className="text-6xl">🎉</div>
          <div className="text-2xl font-bold">짝을 다 찾았어요!</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{moves}번 만에 성공</div>
          <button
            onClick={restart}
            className="px-6 py-3 bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold rounded-xl"
          >
            다시 하기
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 w-full mx-auto" style={{ maxWidth: 'min(95vw, 500px)' }}>
          {cards.map((emoji, idx) => {
            const isFlipped = flipped.includes(idx) || matched.has(idx);
            return (
              <button
                key={idx}
                onClick={() => flip(idx)}
                className={[
                  'aspect-square rounded-2xl text-6xl sm:text-7xl flex items-center justify-center transition-all active:scale-95 shadow-lg',
                  isFlipped
                    ? 'bg-white'
                    : 'bg-gradient-to-br from-pink-300 to-purple-400',
                  matched.has(idx) ? 'ring-3 ring-green-400 bg-green-50' : '',
                ].join(' ')}
              >
                {isFlipped ? emoji : '❓'}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
