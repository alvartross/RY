'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = { onBack: () => void };

const LANES = [60, 150, 240];
const OBS_EMOJIS = ['🚕', '🚌', '🏍️', '🚜', '🛻'];
const STAR = '⭐';
const MAX_LIVES = 5;

export default function CarDodge({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(MAX_LIVES);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const W = 300;
  const H = 500;

  const stateRef = useRef({
    lane: 1,
    obstacles: [] as Array<{ x: number; y: number; type: number }>,
    stars: [] as Array<{ x: number; y: number }>,
    speed: 0.8,
    frame: 0,
    score: 0,
    lives: MAX_LIVES,
    invincible: 0,
    running: false,
  });

  const start = () => {
    const s = stateRef.current;
    s.lane = 1;
    s.obstacles = [];
    s.stars = [];
    s.speed = 0.8;
    s.frame = 0;
    s.score = 0;
    s.lives = MAX_LIVES;
    s.invincible = 0;
    s.running = true;
    setScore(0);
    setLives(MAX_LIVES);
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
    const blink = s.invincible > 0 && Math.floor(s.invincible / 5) % 2 === 0;
    if (!blink) {
      ctx.font = '32px serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🩷', carX - 8, H - 85);
      ctx.fillText('🚙', carX, H - 80);
    }

    for (const ob of s.obstacles) {
      ctx.font = '35px serif';
      ctx.textAlign = 'center';
      ctx.fillText(OBS_EMOJIS[ob.type], ob.x, ob.y);
    }

    for (const st of s.stars) {
      ctx.font = '40px serif';
      ctx.textAlign = 'center';
      ctx.fillText(STAR, st.x, st.y);
    }

    ctx.fillStyle = 'white';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'left';
    const curLevel = Math.floor(s.score / 5) + 1;
    ctx.fillText(`Lv.${curLevel} ⭐${s.score}`, 20, 22);
    ctx.textAlign = 'right';
    ctx.fillText('❤️'.repeat(Math.max(0, s.lives)), W - 20, 22);
  }, []);

  useEffect(() => {
    if (!started || gameOver) return;
    const s = stateRef.current;
    let raf = 0;

    const loop = () => {
      if (!s.running) return;
      s.frame++;
      if (s.invincible > 0) s.invincible--;

      // 장애물 생성: 80프레임마다 (느리게)
      if (s.frame % 100 === 0) {
        const lane = Math.floor(Math.random() * 3);
        s.obstacles.push({ x: LANES[lane], y: -30, type: Math.floor(Math.random() * OBS_EMOJIS.length) });
      }
      // 별 생성: 50프레임마다 (자주)
      if (s.frame % 50 === 0) {
        const lane = Math.floor(Math.random() * 3);
        s.stars.push({ x: LANES[lane], y: -30 });
      }

      for (const ob of s.obstacles) ob.y += s.speed;
      for (const st of s.stars) st.y += s.speed * 0.8;

      const carX = LANES[s.lane];
      const carY = H - 80;

      // 충돌 체크 (무적 시간이면 무시)
      if (s.invincible <= 0) {
        for (let i = s.obstacles.length - 1; i >= 0; i--) {
          const ob = s.obstacles[i];
          if (Math.abs(ob.x - carX) < 28 && Math.abs(ob.y - carY) < 30) {
            s.obstacles.splice(i, 1);
            s.lives--;
            setLives(s.lives);
            s.invincible = 60; // 1초 무적
            if (s.lives <= 0) {
              s.running = false;
              setGameOver(true);
              draw();
              return;
            }
            break;
          }
        }
      }

      // 별 수집
      s.stars = s.stars.filter((st) => {
        if (Math.abs(st.x - carX) < 35 && Math.abs(st.y - carY) < 45) {
          s.score++;
          setScore(s.score);
          return false;
        }
        return st.y < H + 30;
      });

      s.obstacles = s.obstacles.filter((ob) => ob.y < H + 30);
      s.speed = Math.min(3, 0.8 + s.score * 0.04);

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
        <button onClick={onBack} className="text-sm px-3 py-1.5 rounded-lg bg-gray-100">🎮 게임목록</button>
        <div className="text-sm font-bold">⭐ {score} · {'❤️'.repeat(Math.max(0, lives))}</div>
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
          {!started && <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>⭐을 모으고 다른 차를 피하세요! 5번 부딪히면 끝!</div>}
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
    </div>
  );
}
