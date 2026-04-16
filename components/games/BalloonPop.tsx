'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { onBack: () => void };

type Balloon = { id: number; x: number; y: number; color: string; emoji: string; speed: number; size: number };

const BALLOON_TYPES = [
  { color: '#FF69B4', emoji: '🎈' },
  { color: '#87CEEB', emoji: '🩵' },
  { color: '#FFD700', emoji: '💛' },
  { color: '#98FB98', emoji: '💚' },
  { color: '#DDA0DD', emoji: '💜' },
  { color: '#FFA07A', emoji: '🧡' },
];

export default function BalloonPop({ onBack }: Props) {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const nextId = useRef(0);
  const frameRef = useRef(0);
  const areaRef = useRef<HTMLDivElement>(null);

  const AREA_W = 320;
  const AREA_H = 480;
  const MAX_MISS = 5;

  const start = () => {
    setBalloons([]);
    setScore(0);
    setMissed(0);
    setGameOver(false);
    setStarted(true);
    nextId.current = 0;
    frameRef.current = 0;
  };

  useEffect(() => {
    if (!started || gameOver) return;
    let raf = 0;
    let missCount = 0;

    const loop = () => {
      frameRef.current++;
      const spawnRate = Math.max(30, 70 - Math.floor(frameRef.current / 300));

      if (frameRef.current % spawnRate === 0) {
        const type = BALLOON_TYPES[Math.floor(Math.random() * BALLOON_TYPES.length)];
        const size = 55 + Math.random() * 25;
        setBalloons((prev) => [
          ...prev,
          {
            id: nextId.current++,
            x: 20 + Math.random() * (AREA_W - 80),
            y: AREA_H + 10,
            color: type.color,
            emoji: type.emoji,
            speed: 0.6 + Math.random() * 1.0 + frameRef.current / 2000,
            size,
          },
        ]);
      }

      setBalloons((prev) => {
        const next = prev.map((b) => ({ ...b, y: b.y - b.speed }));
        const escaped = next.filter((b) => b.y < -b.size);
        if (escaped.length > 0) {
          missCount += escaped.length;
          setMissed(missCount);
          if (missCount >= MAX_MISS) {
            setGameOver(true);
            return [];
          }
        }
        return next.filter((b) => b.y >= -b.size);
      });

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver]);

  const pop = (id: number) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    setScore((s) => s + 1);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center justify-between w-full max-w-xs">
        <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100">← 뒤로</button>
        <div className="flex gap-3 text-sm font-bold">
          <span className="text-base">🎈 {score}</span>
          <span className="text-base text-red-500">{'❤️'.repeat(MAX_MISS - missed)}{'🤍'.repeat(missed)}</span>
        </div>
      </div>

      {!started || gameOver ? (
        <div className="text-center space-y-3 py-10">
          {gameOver && (
            <>
              <div className="text-5xl">🎈</div>
              <div className="text-2xl font-bold">🎈 {score}개 터뜨렸어요!</div>
            </>
          )}
          <button onClick={start} className="px-8 py-3 bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold rounded-xl shadow-lg active:scale-95">
            {gameOver ? '🔁 다시' : '▶ 시작'}
          </button>
        </div>
      ) : (
        <div
          ref={areaRef}
          className="relative rounded-2xl overflow-hidden shadow-lg"
          style={{
            width: 'min(90vw, 320px)',
            height: `${AREA_H}px`,
            background: 'linear-gradient(180deg, #87CEEB 0%, #E0F7FF 100%)',
          }}
        >
          {balloons.map((b) => (
            <button
              key={b.id}
              onClick={() => pop(b.id)}
              className="absolute transition-none active:scale-75"
              style={{
                left: b.x,
                top: b.y,
                width: b.size,
                height: b.size * 1.2,
                fontSize: b.size * 0.85,
                lineHeight: 1,
              }}
            >
              {b.emoji}
            </button>
          ))}
          <div className="absolute bottom-0 inset-x-0 h-8 bg-gradient-to-t from-green-400 to-transparent" />
        </div>
      )}

      <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
        풍선을 터뜨리세요! {MAX_MISS}개 놓치면 끝!
      </p>
    </div>
  );
}
