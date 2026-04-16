'use client';

import { getBestScore } from '@/lib/gameScores';

type Props = {
  gameId: string;
  title: string;
  score?: number;
  extra?: React.ReactNode;
  paused?: boolean;
  onBack: () => void;
  onPause?: () => void;
};

export default function GameHeader({ gameId, title, score, extra, paused, onBack, onPause }: Props) {
  const best = getBestScore(gameId);

  return (
    <div className="flex items-center justify-between w-full max-w-sm gap-2">
      <button
        onClick={onBack}
        className="flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold shadow-sm active:scale-95 transition-all"
        style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
      >
        ← 나가기
      </button>

      <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>
        {extra}
        {score != null && <span>{title} {score}</span>}
        {best && <span className="text-[10px] text-yellow-600">🏆{best.score}</span>}
      </div>

      {onPause && (
        <button
          onClick={onPause}
          className="w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm active:scale-95"
          style={{ backgroundColor: 'var(--bg-card)' }}
        >
          {paused ? '▶' : '⏸'}
        </button>
      )}
    </div>
  );
}
