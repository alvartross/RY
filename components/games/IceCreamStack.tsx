'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type Props = { onBack: () => void };

const SCOOPS = ['🍓', '🍫', '🫐', '🍵', '🍑', '🍋', '🍇', '🧁'];
const COLORS = ['#FF8FA3', '#8B5E3C', '#7B68EE', '#90EE90', '#FFDAB9', '#FFF176', '#CE93D8', '#F8BBD0'];
const CONE_W = 24;
const SCOOP_SIZE = 55;
const LEVEL_TARGETS = [3, 4, 5, 6, 7, 8, 9, 10, 11];
const W = 300;
const H = 500;

export default function IceCreamStack({ onBack }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [levelClear, setLevelClear] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  const target = LEVEL_TARGETS[Math.min(level - 1, LEVEL_TARGETS.length - 1)];

  const stateRef = useRef({
    coneX: W / 2,
    stack: [] as number[],
    fallingX: 0,
    fallingY: 0,
    fallingType: 0,
    speed: 1,
    running: false,
  });

  const startLevel = (lvl: number) => {
    const s = stateRef.current;
    s.coneX = W / 2;
    s.stack = [];
    s.fallingType = Math.floor(Math.random() * SCOOPS.length);
    s.fallingX = Math.random() * (W - SCOOP_SIZE) + SCOOP_SIZE / 2;
    s.fallingY = -20;
    s.speed = 0.8 + (lvl - 1) * 0.2;
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

    // 배경: 파스텔 하늘
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#87CEEB');
    grad.addColorStop(1, '#FFF8E1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // 구름
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    [30, 150, 250].forEach((cx, i) => {
      ctx.beginPath();
      ctx.arc(cx, 30 + i * 10, 22, 0, Math.PI * 2);
      ctx.arc(cx + 20, 25 + i * 10, 18, 0, Math.PI * 2);
      ctx.fill();
    });

    // 콘
    const coneTop = H - 55;
    ctx.fillStyle = '#DEB887';
    ctx.beginPath();
    ctx.moveTo(s.coneX - CONE_W / 2, coneTop);
    ctx.lineTo(s.coneX + CONE_W / 2, coneTop);
    ctx.lineTo(s.coneX, H - 8);
    ctx.closePath();
    ctx.fill();
    // 와플 무늬
    ctx.strokeStyle = '#C4A26E';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < 4; i++) {
      const y = coneTop + i * 12;
      ctx.beginPath();
      ctx.moveTo(s.coneX - CONE_W / 2 + i * 4, y);
      ctx.lineTo(s.coneX + CONE_W / 2 - i * 4, y);
      ctx.stroke();
    }

    // 쌓인 아이스크림
    s.stack.forEach((type, i) => {
      const y = coneTop - (i + 1) * (SCOOP_SIZE * 0.55);
      // 그림자
      ctx.fillStyle = 'rgba(0,0,0,0.08)';
      ctx.beginPath();
      ctx.ellipse(s.coneX + 2, y + 3, SCOOP_SIZE / 2, SCOOP_SIZE / 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // 아이스크림
      ctx.fillStyle = COLORS[type];
      ctx.beginPath();
      ctx.ellipse(s.coneX, y, SCOOP_SIZE / 2, SCOOP_SIZE / 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      // 하이라이트
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(s.coneX - 8, y - 6, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      // 이모지
      ctx.font = `${SCOOP_SIZE * 0.4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SCOOPS[type], s.coneX, y);
    });

    // 떨어지는 아이스크림
    if (s.running) {
      ctx.fillStyle = 'rgba(0,0,0,0.06)';
      ctx.beginPath();
      ctx.ellipse(s.fallingX + 2, s.fallingY + 3, SCOOP_SIZE / 2, SCOOP_SIZE / 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS[s.fallingType];
      ctx.beginPath();
      ctx.ellipse(s.fallingX, s.fallingY, SCOOP_SIZE / 2, SCOOP_SIZE / 2.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)';
      ctx.beginPath();
      ctx.ellipse(s.fallingX - 8, s.fallingY - 6, 8, 5, -0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = `${SCOOP_SIZE * 0.4}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(SCOOPS[s.fallingType], s.fallingX, s.fallingY);
    }

    // HUD
    ctx.fillStyle = '#333';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Lv.${level} 🍦 ${s.stack.length}/${target}`, 10, 22);
  }, [level, target]);

  useEffect(() => {
    if (!started || gameOver || levelClear) return;
    const s = stateRef.current;
    let raf = 0;

    const loop = () => {
      if (!s.running) return;
      s.fallingY += s.speed;

      const stackTop = (H - 55) - s.stack.length * (SCOOP_SIZE * 0.55);
      const catchZone = stackTop - SCOOP_SIZE * 0.25;

      if (s.fallingY >= catchZone) {
        const dist = Math.abs(s.fallingX - s.coneX);
        if (dist < CONE_W * 0.8 + s.stack.length * 2) {
          s.stack.push(s.fallingType);
          const count = s.stack.length;
          setScore(count);
          s.fallingType = Math.floor(Math.random() * SCOOPS.length);
          s.fallingX = Math.random() * (W - SCOOP_SIZE) + SCOOP_SIZE / 2;
          s.fallingY = -20;

          if (count >= target) {
            s.running = false;
            setLevelClear(true);
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
  }, [started, gameOver, levelClear, draw, target]);

  const moveLeft = () => { stateRef.current.coneX = Math.max(CONE_W, stateRef.current.coneX - 22); };
  const moveRight = () => { stateRef.current.coneX = Math.min(W - CONE_W, stateRef.current.coneX + 22); };

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
        <div className="text-sm font-bold">Lv.{level} 🍦 {score}/{target}</div>
      </div>

      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="rounded-xl shadow-lg"
        style={{ width: 'min(85vw, 300px)', height: 'auto', aspectRatio: `${W}/${H}` }}
      />

      {levelClear && !gameOver ? (
        <div className="text-center space-y-3">
          <div className="text-4xl">🎉🍦🎉</div>
          <div className="text-xl font-bold">레벨 {level} 클리어!</div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>{score}단 아이스크림 완성!</div>
          {level < 9 ? (
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
        <div className="text-center space-y-2">
          {gameOver && <div className="text-xl font-bold">🍦 아이스크림이 떨어졌어요!</div>}
          {!started && <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>떨어지는 아이스크림을 콘 위에 쌓으세요!</div>}
          <button
            onClick={start}
            className="px-8 py-3 bg-gradient-to-br from-pink-400 to-rose-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
          >
            {gameOver ? '🔁 다시' : '▶ 시작'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
          <button onPointerDown={(e) => { e.preventDefault(); moveLeft(); }} className="py-4 bg-gradient-to-br from-pink-400 to-pink-600 text-white font-black rounded-xl text-2xl active:scale-95 shadow-lg">◀</button>
          <button onPointerDown={(e) => { e.preventDefault(); moveRight(); }} className="py-4 bg-gradient-to-br from-pink-400 to-pink-600 text-white font-black rounded-xl text-2xl active:scale-95 shadow-lg">▶</button>
        </div>
      )}
    </div>
  );
}
