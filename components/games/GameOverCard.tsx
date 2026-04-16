'use client';

import { useEffect, useState } from 'react';
import { isNewBest, saveBestScore, getBestScore } from '@/lib/gameScores';

type Props = {
  gameId: string;
  score: number;
  label?: string;
  onRestart: () => void;
  onBack: () => void;
  children?: React.ReactNode;
};

export default function GameOverCard({ gameId, score, label, onRestart, onBack, children }: Props) {
  const [newBest, setNewBest] = useState(false);
  const [name, setName] = useState('');
  const [saved, setSaved] = useState(false);
  const best = getBestScore(gameId);

  useEffect(() => {
    setNewBest(isNewBest(gameId, score));
  }, [gameId, score]);

  const save = () => {
    if (!name.trim()) return;
    saveBestScore(gameId, score, name.trim());
    setSaved(true);
  };

  return (
    <div className="text-center space-y-4 py-4">
      {children}

      <div className="text-3xl font-black">{label ?? `${score}점`}</div>

      {newBest && score > 0 && !saved ? (
        <div className="space-y-2 rounded-xl p-4" style={{ backgroundColor: 'var(--bg-card)' }}>
          <div className="text-lg font-bold text-yellow-600">🏆 새로운 베스트!</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>이름을 남겨주세요</div>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') save(); }}
            placeholder="이름 입력"
            maxLength={10}
            autoFocus
            className="w-full px-3 py-2 border rounded-lg text-center font-bold focus:outline-none focus:ring-2 focus:ring-yellow-400"
          />
          <button
            onClick={save}
            disabled={!name.trim()}
            className="w-full py-2 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold rounded-lg disabled:opacity-40"
          >
            🏆 기록 저장
          </button>
        </div>
      ) : newBest && saved ? (
        <div className="text-lg font-bold text-yellow-600">🏆 {name} — {score}점 기록!</div>
      ) : best ? (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          🏆 베스트: {best.name} — {best.score}점
        </div>
      ) : null}

      <div className="flex gap-2 justify-center pt-2">
        <button
          onClick={onBack}
          className="px-5 py-2.5 rounded-xl font-semibold text-sm"
          style={{ backgroundColor: 'var(--bg-card)', color: 'var(--text-primary)' }}
        >
          게임 목록
        </button>
        <button
          onClick={onRestart}
          className="px-5 py-2.5 bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
        >
          🔁 다시 하기
        </button>
      </div>
    </div>
  );
}
