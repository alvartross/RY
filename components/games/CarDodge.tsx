'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = { onBack: () => void };

const LANES = [60, 150, 240];
const CAR_W = 40;
const CAR_H = 60;
const OBS_EMOJIS = ['🚕', '🚌', '🏍️', '🚜', '🛻'];
const STAR = '⭐';

export default function CarDodge({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const W = 300;
  const H = 500;

  const stateRef = useRef({
    lane: 1,
    obstacles: [] as Array<{ x: number; y: number; type: number }>,
    stars: [] as Array<{ x: number; y: number }>,
    speed: 1.5,
    frame: 0,
    score: 0,
    running: false,
  });

  const start = () => {
    const s = stateRef.current;
    s.lane = 1;
    s.obstacles = [];
    s.stars = [];
    s.speed = 1.5;
    s.frame = 0;
    s.score = 0;
    s.running = true;
    setScore(0);
    setGameOver(false);
    setStarted(true);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = '#555';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 15]);
    ctx.beginPath();
    ctx.moveTo(105, 0); ctx.lineTo(105, H);
    ctx.moveTo(195, 0); ctx.lineTo(195, H);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, 15, H);
    ctx.fillRect(W - 15, 0, 15, H);

    const carX = LANES[s.lane];
    ctx.font = `${CAR_H}px serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🚗', carX, H - 80);

    for (const ob of s.obstacles) {
      ctx.font = '45px serif';
      ctx.fillText(OBS_EMOJIS[ob.type], ob.x, ob.y);
    }

    for (const st of s.stars) {
      ctx.font = '40px serif';
      ctx.fillText(STAR, st.x, st.y);
    }

    ctx.fillStyle = 'white';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    const curLevel = Math.floor(s.score / 5) + 1;
    const nextGoal = curLevel * 5;
    ctx.fillText(`Lv.${curLevel} ⭐ ${s.score}/${nextGoal}`, 20, 25);
  }, []);

  useEffect(() => {
    if (!started || gameOver) return;
    const s = stateRef.current;
    let raf = 0;

    const loop = () => {
      if (!s.running) return;
      s.frame++;

      if (s.frame % 60 === 0) {
        const lane = Math.floor(Math.random() * 3);
        s.obstacles.push({ x: LANES[lane], y: -30, type: Math.floor(Math.random() * OBS_EMOJIS.length) });
      }
      if (s.frame % 45 === 0) {
        const lane = Math.floor(Math.random() * 3);
        s.stars.push({ x: LANES[lane], y: -30 });
      }

      for (const ob of s.obstacles) ob.y += s.speed;
      for (const st of s.stars) st.y += s.speed * 0.8;

      const carX = LANES[s.lane];
      const carY = H - 80;

      for (const ob of s.obstacles) {
        if (Math.abs(ob.x - carX) < CAR_W && Math.abs(ob.y - carY) < CAR_H * 0.7) {
          s.running = false;
          setGameOver(true);
          draw();
          return;
        }
      }

      s.stars = s.stars.filter((st) => {
        if (Math.abs(st.x - carX) < 30 && Math.abs(st.y - carY) < 40) {
          s.score++;
          setScore(s.score);
          return false;
        }
        return st.y < H + 30;
      });

      s.obstacles = s.obstacles.filter((ob) => ob.y < H + 30);
      s.speed = Math.min(4.5, 1.5 + s.score * 0.08);

      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver, draw]);

  const moveLeft = () => { stateRef.current.lane = Math.max(0, stateRef.current.lane - 1); };
  const moveRight = () => { stateRef.current.lane = Math.min(2, stateRef.current.lane + 1); };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') moveLeft();
      else if (e.key === 'ArrowRight') moveRight();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center justify-between w-full max-w-xs">
        <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100">← 뒤로</button>
        <div className="text-sm font-bold">⭐ {score}</div>
      </div>
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl shadow-lg"
        style={{ width: 'min(85vw, 300px)', height: 'auto', aspectRatio: `${W}/${H}` }}
      />
      {!started || gameOver ? (
        <div className="text-center space-y-2">
          {gameOver && <div className="text-xl font-bold">⭐ {score}개!</div>}
          <button onClick={start} className="px-8 py-3 bg-gradient-to-br from-orange-400 to-red-500 text-white font-bold rounded-xl shadow-lg active:scale-95">
            {gameOver ? '🔁 다시' : '▶ 시작'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <button onPointerDown={(e) => { e.preventDefault(); moveLeft(); }} className="py-4 bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black rounded-xl text-2xl active:scale-95 shadow-lg">◀</button>
          <button onPointerDown={(e) => { e.preventDefault(); moveRight(); }} className="py-4 bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black rounded-xl text-2xl active:scale-95 shadow-lg">▶</button>
        </div>
      )}
      <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>⭐을 모으고 다른 차를 피하세요! ◀▶ 이동</p>
    </div>
  );
}
