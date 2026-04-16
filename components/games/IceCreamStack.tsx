'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = { onBack: () => void };

const SCOOPS = ['🍓', '🍫', '🫐', '🍵', '🍑', '🍋'];
const COLORS = ['#FFB5C2', '#8B5E3C', '#7B68EE', '#90EE90', '#FFDAB9', '#FFFF99'];
const CONE_W = 44;
const SCOOP_SIZE = 58;
const LEVEL_TARGETS = [3, 4, 5, 6, 7, 8, 9, 10, 11];

export default function IceCreamStack({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelClear, setLevelClear] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const stateRef = useRef({
    coneX: 150,
    stack: [] as number[],
    fallingX: 0,
    fallingY: 0,
    fallingType: 0,
    speed: 2,
    running: false,
  });

  const W = 300;
  const H = 500;

  const target = LEVEL_TARGETS[Math.min(level - 1, LEVEL_TARGETS.length - 1)];

  const startLevel = (lvl: number) => {
    const s = stateRef.current;
    s.coneX = W / 2;
    s.stack = [];
    s.fallingType = Math.floor(Math.random() * SCOOPS.length);
    s.fallingX = Math.random() * (W - SCOOP_SIZE) + SCOOP_SIZE / 2;
    s.fallingY = 0;
    s.speed = 1.2 + (lvl - 1) * 0.25;
    s.running = true;
    setScore(0);
    setLevelClear(false);
    setGameOver(false);
    setStarted(true);
  };

  const start = () => {
    setLevel(1);
    startLevel(1);
  };

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const s = stateRef.current;

    ctx.fillStyle = '#87CEEB';
    ctx.fillRect(0, 0, W, H);

    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.arc(50 + i * 120, 40, 30, 0, Math.PI * 2);
      ctx.fill();
    }

    const coneTop = H - 60;
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.moveTo(s.coneX - CONE_W / 2, coneTop);
    ctx.lineTo(s.coneX + CONE_W / 2, coneTop);
    ctx.lineTo(s.coneX, H - 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#C4A26E';
    ctx.lineWidth = 1;
    ctx.stroke();

    s.stack.forEach((type, i) => {
      const y = coneTop - (i + 1) * (SCOOP_SIZE * 0.6);
      ctx.fillStyle = COLORS[type];
      ctx.beginPath();
      ctx.ellipse(s.coneX, y, SCOOP_SIZE / 2, SCOOP_SIZE / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.stroke();
      ctx.font = `${SCOOP_SIZE * 0.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SCOOPS[type], s.coneX, y);
    });

    if (s.running) {
      ctx.fillStyle = COLORS[s.fallingType];
      ctx.beginPath();
      ctx.ellipse(s.fallingX, s.fallingY, SCOOP_SIZE / 2, SCOOP_SIZE / 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${SCOOP_SIZE * 0.5}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SCOOPS[s.fallingType], s.fallingX, s.fallingY);
    }

    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${level} 🍦 ${s.stack.length}/${target}`, 10, 25);
  }, []);

  useEffect(() => {
    if (!started || gameOver) return;
    const s = stateRef.current;
    let raf = 0;

    const loop = () => {
      if (!s.running) return;
      s.fallingY += s.speed;

      const stackTop = (H - 60) - s.stack.length * (SCOOP_SIZE * 0.6);
      const catchZone = stackTop - SCOOP_SIZE * 0.3;

      if (s.fallingY >= catchZone) {
        const dist = Math.abs(s.fallingX - s.coneX);
        if (dist < CONE_W * 0.7) {
          s.stack.push(s.fallingType);
          const count = s.stack.length;
          setScore(count);
          s.fallingType = Math.floor(Math.random() * SCOOPS.length);
          s.fallingX = Math.random() * (W - SCOOP_SIZE) + SCOOP_SIZE / 2;
          s.fallingY = 0;

          if (count >= LEVEL_TARGETS[Math.min(s.stack.length, LEVEL_TARGETS.length) - 1] || stackTop - SCOOP_SIZE < 50) {
            s.running = false;
            if (stackTop - SCOOP_SIZE < 50 && count < LEVEL_TARGETS[0]) {
              setGameOver(true);
            } else {
              setLevelClear(true);
            }
          }
        } else {
          s.running = false;
          setGameOver(true);
        }
      }

      draw();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [started, gameOver, draw]);

  const moveLeft = () => { stateRef.current.coneX = Math.max(CONE_W / 2, stateRef.current.coneX - 25); };
  const moveRight = () => { stateRef.current.coneX = Math.min(W - CONE_W / 2, stateRef.current.coneX + 25); };

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
        <div className="text-sm font-bold">🍦 {score}단 쌓기</div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl shadow-lg"
        style={{ width: 'min(85vw, 300px)', height: 'auto', aspectRatio: `${W}/${H}` }}
      />

      {!started || gameOver || levelClear ? (
        <div className="text-center space-y-2">
          {levelClear && !gameOver && (
            <>
              <div className="text-2xl font-bold">🎉 레벨 {level} 클리어!</div>
              {level < 9 ? (
                <button
                  onClick={() => { const nl = level + 1; setLevel(nl); startLevel(nl); }}
                  className="px-8 py-3 bg-gradient-to-br from-green-400 to-emerald-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
                >
                  레벨 {level + 1} ▶
                </button>
              ) : (
                <div className="text-lg font-bold">🏆 모든 레벨 클리어!</div>
              )}
            </>
          )}
          {gameOver && <div className="text-xl font-bold">🍦 {score}단!</div>}
          <button
            onClick={start}
            className="px-8 py-3 bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
          >
            {started ? '🔁 처음부터' : '▶ 시작'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <button
            onPointerDown={(e) => { e.preventDefault(); moveLeft(); }}
            className="py-4 bg-gradient-to-br from-pink-400 to-pink-600 text-white font-black rounded-xl text-2xl active:scale-95 shadow-lg"
          >
            ◀
          </button>
          <button
            onPointerDown={(e) => { e.preventDefault(); moveRight(); }}
            className="py-4 bg-gradient-to-br from-pink-400 to-pink-600 text-white font-black rounded-xl text-2xl active:scale-95 shadow-lg"
          >
            ▶
          </button>
        </div>
      )}

      <p className="text-[10px] text-center" style={{ color: 'var(--text-muted)' }}>
        떨어지는 아이스크림을 콘 위에 쌓으세요! ◀▶ 또는 키보드 ←→
      </p>
    </div>
  );
}
