'use client';

import { useEffect, useRef, useState } from 'react';

type Props = { onBack: () => void };

type Balloon = {
  id: number;
  x: number;
  y: number;
  color: string;
  speed: number;
  size: number;
};

const BALLOON_COLORS = ['#FF6B6B', '#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF', '#DDA0DD', '#87CEEB', '#FFB347', '#FF69B4'];
const MAX_LIVES = 6;
const AREA_W = 320;
const AREA_H = 520;
const LEVEL_TARGETS = [8, 12, 16, 20, 25, 30];

export default function BalloonPop({ onBack }: Props) {
  const [balloons, setBalloons] = useState<Balloon[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelScore, setLevelScore] = useState(0);
  const [missed, setMissed] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [levelClear, setLevelClear] = useState(false);
  const [started, setStarted] = useState(false);
  const nextId = useRef(0);
  const frameRef = useRef(0);
  const missRef = useRef(0);
  const levelScoreRef = useRef(0);

  const target = LEVEL_TARGETS[Math.min(level - 1, LEVEL_TARGETS.length - 1)];
  const speedMult = 1 - 0.5 + (level - 1) * 0.08;

  const startLevel = (lvl: number) => {
    setBalloons([]);
    setLevelScore(0);
    levelScoreRef.current = 0;
    setMissed(0);
    missRef.current = 0;
    setLevelClear(false);
    setGameOver(false);
    setStarted(true);
    nextId.current = 0;
    frameRef.current = 0;
  };

  const start = () => {
    setLevel(1);
    setScore(0);
    startLevel(1);
  };

  useEffect(() => {
    if (!started || gameOver || levelClear) return;
    let raf = 0;

    const loop = () => {
      frameRef.current++;
      const spawnRate = Math.max(45, 80 - level * 5 - Math.floor(frameRef.current / 800));

      if (frameRef.current % spawnRate === 0) {
        setBalloons((prev) => {
          if (prev.length >= 6) return prev;
          const color = BALLOON_COLORS[Math.floor(Math.random() * BALLOON_COLORS.length)];
          const isRed = color === '#FF6B6B';
          const size = isRed ? 75 : 55 + Math.random() * 14;
          const existingXs = prev.filter(b => b.y > AREA_H * 0.5).map(b => b.x);
          let x = 30 + Math.random() * (AREA_W - 80);
          for (let t = 0; t < 5; t++) {
            if (existingXs.every(ex => Math.abs(ex - x) > size * 0.8)) break;
            x = 30 + Math.random() * (AREA_W - 80);
          }
          return [
            ...prev,
            {
              id: nextId.current++,
              x,
              y: AREA_H + 30,
              color,
              speed: 0.8 + Math.random() * 0.6 + (level - 1) * 0.15,
              size,
            },
          ];
        });
      }

      setBalloons((prev) => {
        const next = prev.map((b) => ({ ...b, y: b.y - b.speed }));
        const escaped = next.filter((b) => b.y < -b.size);
        if (escaped.length > 0) {
          missRef.current += escaped.length;
          setMissed(missRef.current);
          if (missRef.current >= MAX_LIVES) {
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
  }, [started, gameOver, levelClear, level]);

  const pop = (id: number) => {
    setBalloons((prev) => prev.filter((b) => b.id !== id));
    const newLS = levelScoreRef.current + 1;
    levelScoreRef.current = newLS;
    setLevelScore(newLS);
    setScore((s) => s + 1);
    if (newLS >= target) {
      setLevelClear(true);
    }
  };

  const lives = MAX_LIVES - missed;

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex items-center justify-between w-full max-w-sm px-1">
        <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100">← 뒤로</button>
        <div className="flex gap-2 items-center text-sm font-bold">
          <span>Lv.{level}</span>
          <span>🎈 {levelScore}/{target}</span>
          <span>{'❤️'.repeat(Math.max(0, lives))}{'🤍'.repeat(Math.max(0, missed))}</span>
        </div>
      </div>

      {levelClear && !gameOver ? (
        <div className="text-center space-y-3 py-8">
          <div className="text-5xl">🎉🎈🎉</div>
          <div className="text-2xl font-bold">레벨 {level} 클리어!</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>총 {score}개 터뜨림</div>
          {level < LEVEL_TARGETS.length ? (
            <button
              onClick={() => { const nl = level + 1; setLevel(nl); startLevel(nl); }}
              className="px-8 py-3 bg-gradient-to-br from-green-400 to-emerald-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
            >
              레벨 {level + 1} ▶
            </button>
          ) : (
            <div className="text-2xl font-bold">🏆 모든 레벨 클리어!</div>
          )}
          <button onClick={start} className="px-6 py-2 bg-gray-200 rounded-lg text-sm font-semibold">처음부터</button>
        </div>
      ) : !started || gameOver ? (
        <div className="text-center space-y-3 py-8">
          {gameOver && (
            <>
              <div className="text-5xl">💥</div>
              <div className="text-2xl font-bold">🎈 총 {score}개!</div>
            </>
          )}
          {!started && (
            <div className="space-y-2">
              <div className="text-5xl">🎈</div>
              <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                올라가는 풍선을 탭해서 터뜨리세요!<br />
                {MAX_LIVES}개 놓치면 끝!
              </div>
            </div>
          )}
          <button onClick={start} className="px-8 py-3 bg-gradient-to-br from-pink-400 to-purple-500 text-white font-bold rounded-xl shadow-lg active:scale-95">
            {gameOver ? '🔁 다시' : '▶ 시작'}
          </button>
        </div>
      ) : (
        <div
          className="relative rounded-2xl overflow-hidden shadow-lg"
          style={{
            width: 'min(92vw, 340px)',
            height: `${AREA_H}px`,
            background: 'linear-gradient(180deg, #87CEEB 0%, #E8F4FD 60%, #C8E6C9 100%)',
          }}
        >
          {balloons.map((b) => (
            <button
              key={b.id}
              onClick={() => pop(b.id)}
              onPointerDown={(e) => { e.preventDefault(); pop(b.id); }}
              className="absolute flex flex-col items-center active:scale-50 transition-transform"
              style={{
                left: b.x - b.size / 2,
                top: b.y - b.size / 2,
                width: b.size,
                touchAction: 'manipulation',
              }}
            >
              {/* 풍선 몸체 */}
              <div
                className="rounded-full shadow-md flex items-center justify-center pointer-events-none"
                style={{
                  width: b.size,
                  height: b.size * 1.15,
                  backgroundColor: b.color,
                  boxShadow: `inset -${b.size * 0.12}px -${b.size * 0.08}px ${b.size * 0.15}px rgba(0,0,0,0.15), inset ${b.size * 0.08}px ${b.size * 0.08}px ${b.size * 0.2}px rgba(255,255,255,0.35)`,
                }}
              >
                <div
                  className="rounded-full bg-white/30 pointer-events-none"
                  style={{ width: b.size * 0.2, height: b.size * 0.15, marginTop: -b.size * 0.18, marginLeft: -b.size * 0.12 }}
                />
              </div>
              {/* 매듭 + 줄 */}
              <div className="pointer-events-none" style={{ width: 0, height: 0, borderLeft: '3px solid transparent', borderRight: '3px solid transparent', borderTop: `5px solid ${b.color}` }} />
              <div className="pointer-events-none" style={{ width: 1, height: b.size * 0.3, backgroundColor: '#aaa', marginTop: -1 }} />
            </button>
          ))}
          <div className="absolute bottom-0 inset-x-0 h-12 bg-gradient-to-t from-green-500/30 to-transparent" />
        </div>
      )}
    </div>
  );
}
