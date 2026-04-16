'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const COLS = 10;
const ROWS = 20;
const TILE = 30;
const NEXT_TILE = 20;
const MAX_TIME_SEC = 600;

type Sfx = {
  playTone: (freq: number, duration: number, type?: OscillatorType, volume?: number) => void;
  playSequence: (notes: Array<{ freq: number; dur: number }>, type?: OscillatorType, volume?: number) => void;
  resume: () => void;
};

function useSfx(): Sfx {
  const ctxRef = useRef<AudioContext | null>(null);
  const ensure = () => {
    if (!ctxRef.current) {
      const C = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!C) return null;
      ctxRef.current = new C();
    }
    return ctxRef.current;
  };
  const playTone = (freq: number, duration: number, type: OscillatorType = 'square', volume = 0.12) => {
    const ctx = ensure();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.value = volume;
    osc.connect(gain);
    gain.connect(ctx.destination);
    const now = ctx.currentTime;
    osc.start(now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.stop(now + duration);
  };
  const playSequence = (notes: Array<{ freq: number; dur: number }>, type: OscillatorType = 'square', volume = 0.12) => {
    const ctx = ensure();
    if (!ctx) return;
    let offset = 0;
    for (const n of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = n.freq;
      gain.gain.value = volume;
      osc.connect(gain);
      gain.connect(ctx.destination);
      const start = ctx.currentTime + offset;
      osc.start(start);
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + n.dur);
      osc.stop(start + n.dur);
      offset += n.dur;
    }
  };
  const resume = () => {
    const ctx = ensure();
    if (ctx && ctx.state === 'suspended') ctx.resume();
  };
  return { playTone, playSequence, resume };
}

function formatTime(s: number): string {
  const mm = String(Math.floor(s / 60)).padStart(1, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

function praiseFor(lines: number): { text: string; color: string } | null {
  if (lines === 1) return { text: 'GOOD!', color: 'from-cyan-300 to-blue-500' };
  if (lines === 2) return { text: 'NICE!', color: 'from-green-300 to-emerald-500' };
  if (lines === 3) return { text: 'GREAT!', color: 'from-yellow-300 to-orange-500' };
  if (lines >= 4) return { text: 'AWESOME!', color: 'from-pink-400 to-violet-600' };
  return null;
}

type Cell = number;
type Board = Cell[][];

type Piece = {
  shape: number[][];
  color: string;
  type: number;
};

const COLORS = [
  'transparent',
  '#22d3ee', // I - cyan
  '#eab308', // O - yellow
  '#a855f7', // T - purple
  '#22c55e', // S - green
  '#ef4444', // Z - red
  '#3b82f6', // J - blue
  '#f97316', // L - orange
];

const SHAPES: number[][][] = [
  [],
  // I
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  // O
  [
    [2, 2],
    [2, 2],
  ],
  // T
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ],
  // S
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ],
  // Z
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ],
  // J
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ],
  // L
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ],
];

function emptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0));
}

function cloneMatrix(m: number[][]): number[][] {
  return m.map((row) => row.slice());
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 7) + 1;
  return {
    type,
    shape: cloneMatrix(SHAPES[type]),
    color: COLORS[type],
  };
}

function rotate(shape: number[][]): number[][] {
  const n = shape.length;
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      out[x][n - 1 - y] = shape[y][x];
    }
  }
  return out;
}

function collide(board: Board, shape: number[][], ox: number, oy: number): boolean {
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (!shape[y][x]) continue;
      const nx = ox + x;
      const ny = oy + y;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function merge(board: Board, shape: number[][], ox: number, oy: number): Board {
  const nb = board.map((r) => r.slice());
  for (let y = 0; y < shape.length; y++) {
    for (let x = 0; x < shape[y].length; x++) {
      if (shape[y][x] && oy + y >= 0) {
        nb[oy + y][ox + x] = shape[y][x];
      }
    }
  }
  return nb;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const kept = board.filter((row) => row.some((c) => c === 0));
  const cleared = ROWS - kept.length;
  const empties = Array.from({ length: cleared }, () => Array(COLS).fill(0));
  return { board: [...empties, ...kept], cleared };
}

const LINE_SCORES = [0, 100, 300, 500, 800];

function dropIntervalFor(level: number): number {
  return Math.max(100, 1000 - (level - 1) * 80);
}

export default function Tetris() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nextRef = useRef<HTMLCanvasElement>(null);
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [current, setCurrent] = useState<Piece | null>(null);
  const [nextPiece, setNextPiece] = useState<Piece | null>(null);
  const [pos, setPos] = useState({ x: 3, y: 0 });
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(MAX_TIME_SEC);
  const [flash, setFlash] = useState<{ text: string; color: string; key: number } | null>(null);
  const sfx = useSfx();

  const boardRef = useRef(board);
  const currentRef = useRef(current);
  const posRef = useRef(pos);
  const runningRef = useRef(running);
  const pausedRef = useRef(paused);
  const levelRef = useRef(level);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { currentRef.current = current; }, [current]);
  useEffect(() => { posRef.current = pos; }, [pos]);
  useEffect(() => { runningRef.current = running; }, [running]);
  useEffect(() => { pausedRef.current = paused; }, [paused]);
  useEffect(() => { levelRef.current = level; }, [level]);

  const spawn = useCallback((nextP: Piece | null) => {
    const piece = nextP ?? randomPiece();
    const nx = randomPiece();
    setCurrent(piece);
    setNextPiece(nx);
    const startX = Math.floor((COLS - piece.shape[0].length) / 2);
    setPos({ x: startX, y: piece.type === 1 ? -1 : 0 });
    if (collide(boardRef.current, piece.shape, startX, 0)) {
      setGameOver(true);
      setRunning(false);
    }
  }, []);

  const start = () => {
    sfx.resume();
    sfx.playSequence(
      [
        { freq: 523.25, dur: 0.1 },
        { freq: 659.25, dur: 0.1 },
        { freq: 783.99, dur: 0.15 },
      ],
      'square'
    );
    setBoard(emptyBoard());
    setScore(0);
    setLines(0);
    setLevel(1);
    setTimeLeft(MAX_TIME_SEC);
    setFlash(null);
    setGameOver(false);
    setPaused(false);
    setRunning(true);
    spawn(null);
  };

  const lockPiece = useCallback(() => {
    const cur = currentRef.current;
    const p = posRef.current;
    if (!cur) return;
    const merged = merge(boardRef.current, cur.shape, p.x, p.y);
    const { board: cleared, cleared: n } = clearLines(merged);
    setBoard(cleared);
    if (n > 0) {
      setScore((s) => s + LINE_SCORES[n] * levelRef.current);
      setLines((l) => {
        const nl = l + n;
        const prevLevel = Math.floor(l / 10) + 1;
        const newLevel = Math.floor(nl / 10) + 1;
        setLevel(newLevel);
        if (newLevel > prevLevel) {
          sfx.playSequence(
            [
              { freq: 523.25, dur: 0.08 },
              { freq: 659.25, dur: 0.08 },
              { freq: 783.99, dur: 0.08 },
              { freq: 1046.5, dur: 0.14 },
            ],
            'square'
          );
        }
        return nl;
      });
      if (n >= 4) {
        sfx.playSequence(
          [
            { freq: 523.25, dur: 0.08 },
            { freq: 659.25, dur: 0.08 },
            { freq: 783.99, dur: 0.08 },
            { freq: 1046.5, dur: 0.08 },
            { freq: 1318.5, dur: 0.12 },
            { freq: 1567.98, dur: 0.2 },
          ],
          'square'
        );
      } else {
        const base = 440 + (n - 1) * 110;
        sfx.playSequence(
          Array.from({ length: n + 1 }, (_, i) => ({ freq: base + i * 110, dur: 0.08 })),
          'square'
        );
      }
      const praise = praiseFor(n);
      if (praise) setFlash({ text: praise.text, color: praise.color, key: Date.now() });
    } else {
      sfx.playTone(140, 0.06, 'sine', 0.18);
    }
    boardRef.current = cleared;
    spawn(nextPiece);
  }, [nextPiece, spawn, sfx]);

  const move = useCallback((dx: number, dy: number): boolean => {
    const cur = currentRef.current;
    const p = posRef.current;
    if (!cur) return false;
    const nx = p.x + dx;
    const ny = p.y + dy;
    if (!collide(boardRef.current, cur.shape, nx, ny)) {
      setPos({ x: nx, y: ny });
      return true;
    }
    return false;
  }, []);

  const softDrop = useCallback(() => {
    if (!move(0, 1)) lockPiece();
  }, [move, lockPiece]);

  const hardDrop = useCallback(() => {
    const cur = currentRef.current;
    if (!cur) return;
    let p = posRef.current;
    let dist = 0;
    while (!collide(boardRef.current, cur.shape, p.x, p.y + 1)) {
      p = { x: p.x, y: p.y + 1 };
      dist++;
    }
    setPos(p);
    posRef.current = p;
    setScore((s) => s + dist * 2);
    sfx.playTone(110, 0.08, 'sine', 0.22);
    lockPiece();
  }, [lockPiece, sfx]);

  const rotatePiece = useCallback(() => {
    const cur = currentRef.current;
    const p = posRef.current;
    if (!cur) return;
    const rotated = rotate(cur.shape);
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collide(boardRef.current, rotated, p.x + kick, p.y)) {
        setCurrent({ ...cur, shape: rotated });
        setPos({ x: p.x + kick, y: p.y });
        sfx.playTone(880, 0.04, 'triangle', 0.08);
        return;
      }
    }
  }, [sfx]);

  const softDropRef = useRef(softDrop);
  useEffect(() => {
    softDropRef.current = softDrop;
  }, [softDrop]);

  useEffect(() => {
    if (!running || paused) return;
    let last = performance.now();
    let acc = 0;
    let raf = 0;
    const loop = (t: number) => {
      if (!runningRef.current || pausedRef.current) {
        raf = requestAnimationFrame(loop);
        return;
      }
      const dt = t - last;
      last = t;
      acc += dt;
      const ival = dropIntervalFor(levelRef.current);
      if (acc > ival) {
        acc = 0;
        softDropRef.current();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, paused]);

  useEffect(() => {
    if (!running || paused) return;
    const id = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(id);
          setRunning(false);
          setGameOver(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, paused]);

  useEffect(() => {
    if (!gameOver) return;
    sfx.playSequence(
      [
        { freq: 349.23, dur: 0.2 },
        { freq: 293.66, dur: 0.2 },
        { freq: 261.63, dur: 0.3 },
        { freq: 196, dur: 0.45 },
      ],
      'triangle',
      0.15
    );
  }, [gameOver, sfx]);

  useEffect(() => {
    if (!flash) return;
    const id = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(id);
  }, [flash]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // grid
    ctx.strokeStyle = 'rgba(148,163,184,0.12)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * TILE + 0.5, 0);
      ctx.lineTo(x * TILE + 0.5, ROWS * TILE);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * TILE + 0.5);
      ctx.lineTo(COLS * TILE, y * TILE + 0.5);
      ctx.stroke();
    }
    const drawCell = (x: number, y: number, type: number) => {
      if (y < 0) return;
      const color = COLORS[type];
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fillRect(x * TILE + 1, y * TILE + 1, TILE - 2, TILE - 2);
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(255,255,255,0.35)';
      ctx.strokeRect(x * TILE + 1.5, y * TILE + 1.5, TILE - 3, TILE - 3);
    };
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (board[y][x]) drawCell(x, y, board[y][x]);
      }
    }
    if (current) {
      let ghostY = pos.y;
      while (!collide(board, current.shape, pos.x, ghostY + 1)) ghostY++;
      ctx.globalAlpha = 0.25;
      for (let y = 0; y < current.shape.length; y++) {
        for (let x = 0; x < current.shape[y].length; x++) {
          if (current.shape[y][x]) drawCell(pos.x + x, ghostY + y, current.type);
        }
      }
      ctx.globalAlpha = 1;
      for (let y = 0; y < current.shape.length; y++) {
        for (let x = 0; x < current.shape[y].length; x++) {
          if (current.shape[y][x]) drawCell(pos.x + x, pos.y + y, current.type);
        }
      }
    }
  }, [board, current, pos]);

  useEffect(() => {
    const canvas = nextRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!nextPiece) return;
    const shape = nextPiece.shape;
    const color = nextPiece.color;
    const size = shape.length;
    const pad = (canvas.width - size * NEXT_TILE) / 2;
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 8;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (shape[y][x]) {
          ctx.fillRect(pad + x * NEXT_TILE + 1, pad + y * NEXT_TILE + 1, NEXT_TILE - 2, NEXT_TILE - 2);
        }
      }
    }
    ctx.shadowBlur = 0;
  }, [nextPiece]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!running || paused) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); move(-1, 0); }
      else if (e.key === 'ArrowRight') { e.preventDefault(); move(1, 0); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); softDrop(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); rotatePiece(); }
      else if (e.key === ' ') { e.preventDefault(); hardDrop(); }
      else if (e.key === 'p' || e.key === 'P') { setPaused((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [running, paused, move, softDrop, rotatePiece, hardDrop]);

  const timerWarn = timeLeft <= 60;
  const swipeRef = useRef<{ x: number; y: number; t: number; lastCellDx: number } | null>(null);
  const SWIPE_CELL_PX = 28;

  const onPlayPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!running || paused) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    swipeRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), lastCellDx: 0 };
  };

  const onPlayPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!swipeRef.current) return;
    const dx = e.clientX - swipeRef.current.x;
    const cellsTotal = Math.trunc(dx / SWIPE_CELL_PX);
    const delta = cellsTotal - swipeRef.current.lastCellDx;
    if (delta !== 0) {
      const dir = Math.sign(delta);
      for (let i = 0; i < Math.abs(delta); i++) {
        move(dir, 0);
      }
      swipeRef.current.lastCellDx = cellsTotal;
    }
  };

  const onPlayPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const swipe = swipeRef.current;
    swipeRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (!swipe) return;
    const dx = e.clientX - swipe.x;
    const dy = e.clientY - swipe.y;
    const dt = Date.now() - swipe.t;
    if (Math.abs(dx) < 10 && Math.abs(dy) < 10 && dt < 280) {
      rotatePiece();
    } else if (dy > 80 && Math.abs(dy) > Math.abs(dx) * 1.5) {
      hardDrop();
    } else if (dy > 30 && Math.abs(dy) > Math.abs(dx)) {
      softDrop();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full">
      <div className="flex items-center gap-1.5 w-full max-w-md justify-center flex-wrap">
        <CompactStat label="TIME" value={formatTime(timeLeft)} warn={timerWarn} />
        <CompactStat label="SCORE" value={score} />
        <CompactStat label="LINES" value={lines} />
        <CompactStat label="LEVEL" value={level} />
        <div className="bg-slate-900 rounded-lg px-2 py-1 flex items-center gap-1.5">
          <span className="text-[10px] text-slate-400 font-bold">NEXT</span>
          <canvas ref={nextRef} width={60} height={60} className="rounded w-9 h-9" />
        </div>
      </div>

      <div
        className="relative touch-none select-none"
        style={{ height: 'min(48vh, 500px)', aspectRatio: `${COLS}/${ROWS}` }}
        onPointerDown={onPlayPointerDown}
        onPointerMove={onPlayPointerMove}
        onPointerUp={onPlayPointerUp}
        onPointerCancel={onPlayPointerUp}
      >
        <canvas
          ref={canvasRef}
          width={COLS * TILE}
          height={ROWS * TILE}
          className="rounded-lg shadow-lg w-full h-full pointer-events-none"
        />
        {flash && (
          <div
            key={flash.key}
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
          >
            <span
              className={`text-5xl sm:text-6xl font-black tracking-wider bg-gradient-to-br ${flash.color} bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(255,255,255,0.6)] animate-[praise_0.9s_ease-out_forwards]`}
            >
              {flash.text}
            </span>
          </div>
        )}
        {paused && running && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-lg pointer-events-none">
            <span className="text-3xl font-black text-white">⏸ PAUSED</span>
          </div>
        )}
        {!running && !gameOver && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center rounded-lg gap-2 pointer-events-none">
            <span className="text-2xl font-bold text-white">▶ 시작 버튼을 누르세요</span>
            <span className="text-xs text-white/80">화면을 탭하면 회전, 좌우 드래그로 이동</span>
          </div>
        )}
        <style jsx>{`
          @keyframes praise {
            0% { transform: scale(0.3); opacity: 0; }
            30% { transform: scale(1.2); opacity: 1; }
            60% { transform: scale(1); opacity: 1; }
            100% { transform: scale(1.1); opacity: 0; }
          }
        `}</style>
      </div>

      <div className="flex gap-2">
        {!running || gameOver ? (
          <button
            onClick={start}
            className="px-6 py-2.5 bg-gradient-to-br from-cyan-400 to-blue-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
          >
            {gameOver ? '🔁 다시 시작' : '▶ 시작'}
          </button>
        ) : (
          <button
            onClick={() => setPaused((p) => !p)}
            className="px-6 py-2.5 bg-gradient-to-br from-violet-400 to-purple-500 text-white font-bold rounded-xl shadow-lg active:scale-95"
          >
            {paused ? '▶ 계속' : '⏸ 일시정지'}
          </button>
        )}
      </div>

      {running && (
        <div className="w-full max-w-sm grid gap-2 mt-1">
          <div className="grid grid-cols-3 gap-2">
            <ControlBtn onPress={() => move(-1, 0)} label="◀" />
            <ControlBtn onPress={rotatePiece} label="↻" highlight />
            <ControlBtn onPress={() => move(1, 0)} label="▶" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <ControlBtn onPress={softDrop} label="▼" />
            <ControlBtn onPress={hardDrop} label="⤓ DROP" hard />
          </div>
        </div>
      )}

      {gameOver && (
        <div className="bg-red-50 rounded-xl p-4 text-center w-full max-w-xs">
          <div className="text-2xl font-bold text-red-600">GAME OVER</div>
          <div className="text-sm text-gray-600 mt-1">최종 점수: {score}</div>
        </div>
      )}

      <p className="text-[11px] text-gray-500 text-center mt-1 px-2 leading-relaxed">
        모바일: 화면 탭=회전 / 좌우 드래그=이동 / 아래 살짝=소프트 / 아래 길게=하드<br />
        키보드: ←→ 이동 / ↑ 회전 / ↓ 소프트 / Space 하드 / P 일시정지
      </p>
    </div>
  );
}

function CompactStat({
  label,
  value,
  warn,
}: {
  label: string;
  value: number | string;
  warn?: boolean;
}) {
  return (
    <div
      className={`rounded-lg px-2 py-1 flex items-center gap-1.5 ${
        warn ? 'bg-red-900 text-white' : 'bg-slate-900 text-white'
      }`}
    >
      <span
        className={`text-[9px] font-bold tracking-wider ${
          warn ? 'text-red-200' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
      <span className={`text-sm font-bold ${warn ? 'animate-pulse' : ''}`}>{value}</span>
    </div>
  );
}

function ControlBtn({
  onPress,
  label,
  highlight,
  hard,
}: {
  onPress: () => void;
  label: string;
  highlight?: boolean;
  hard?: boolean;
}) {
  const handlers = {
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      onPress();
    },
  };
  const bg = hard
    ? 'from-pink-500 to-rose-600'
    : highlight
      ? 'from-cyan-500 to-blue-600'
      : 'from-slate-700 to-slate-900';
  return (
    <button
      {...handlers}
      className={`py-3 sm:py-4 bg-gradient-to-br ${bg} text-white font-black rounded-xl shadow-lg active:scale-95 active:brightness-110 text-xl sm:text-2xl tracking-wider`}
    >
      {label}
    </button>
  );
}
