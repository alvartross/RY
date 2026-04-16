'use client';

import { useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import Tetris from '@/components/tetris/Tetris';
import MemoryCard from '@/components/games/MemoryCard';
import IceCreamStack from '@/components/games/IceCreamStack';
import SpotDifference from '@/components/games/SpotDifference';
import CarDodge from '@/components/games/CarDodge';
import BalloonPop from '@/components/games/BalloonPop';

type Game = null | 'tetris' | 'memory' | 'icecream' | 'spot' | 'car' | 'balloon';

const GAMES: { key: Game; label: string; emoji: string; desc: string; color: string }[] = [
  { key: 'memory', label: '기억력 카드', emoji: '🃏', desc: '같은 그림 짝 맞추기', color: 'from-pink-400 to-rose-500' },
  { key: 'icecream', label: '아이스크림 쌓기', emoji: '🍦', desc: '떨어지는 아이스크림 받기', color: 'from-sky-400 to-blue-500' },
  { key: 'spot', label: '숨은그림찾기', emoji: '🔍', desc: '다른 그림 찾기', color: 'from-emerald-400 to-teal-500' },
  { key: 'car', label: '자동차 레이싱', emoji: '🚗', desc: '⭐ 모으며 장애물 피하기', color: 'from-orange-400 to-red-500' },
  { key: 'balloon', label: '풍선 터뜨리기', emoji: '🎈', desc: '날아가는 풍선 탭!', color: 'from-fuchsia-400 to-pink-500' },
  { key: 'tetris', label: '테트리스', emoji: '🧱', desc: '블록 쌓기', color: 'from-violet-400 to-purple-500' },
];

export default function GamePage() {
  const [game, setGame] = useState<Game>(null);

  if (game) {
    return (
      <>
        <TopBar />
        <main className="max-w-3xl mx-auto px-4 pt-4 pb-24">
          {game === 'tetris' && <Tetris />}
          {game === 'memory' && <MemoryCard onBack={() => setGame(null)} />}
          {game === 'icecream' && <IceCreamStack onBack={() => setGame(null)} />}
          {game === 'spot' && <SpotDifference onBack={() => setGame(null)} />}
          {game === 'car' && <CarDodge onBack={() => setGame(null)} />}
          {game === 'balloon' && <BalloonPop onBack={() => setGame(null)} />}
          {game === 'tetris' && (
            <div className="mt-4 text-center">
              <button
                onClick={() => setGame(null)}
                className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-semibold"
                style={{ color: 'var(--text-secondary)' }}
              >
                ← 게임 목록으로
              </button>
            </div>
          )}
        </main>
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-24 space-y-5">
        <header className="text-center">
          <h1 className="text-3xl font-bold">🎮 게임</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            공부하다 쉬어가요!
          </p>
        </header>

        <div className="grid grid-cols-2 gap-3">
          {GAMES.map((g) => (
            <button
              key={g.key}
              onClick={() => setGame(g.key)}
              className={`bg-gradient-to-br ${g.color} text-white rounded-2xl p-5 shadow-lg hover:shadow-xl active:scale-95 transition-all text-left`}
            >
              <div className="text-4xl">{g.emoji}</div>
              <div className="font-bold mt-2">{g.label}</div>
              <div className="text-xs opacity-90">{g.desc}</div>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}
