'use client';

import TopBar from '@/components/layout/TopBar';
import Tetris from '@/components/tetris/Tetris';

export default function TetrisPage() {
  return (
    <>
      <TopBar />
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-24 flex flex-col items-center gap-4">
        <header className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-500 via-violet-500 to-pink-500 bg-clip-text text-transparent">
            🎮 Tetris
          </h1>
          <p className="text-sm text-gray-600 mt-1">공부하다가 쉬어가요!</p>
        </header>
        <Tetris />
      </main>
    </>
  );
}
