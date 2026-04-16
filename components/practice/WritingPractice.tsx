'use client';

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { PracticeInput } from '@/lib/practice';
import { getEmojiForWord } from '@/lib/wordEmoji';

const STROKE_HINTS: Record<string, { arrows: string; desc: string }> = {
  a: { arrows: '↺↓', desc: '둥글게 후 내려' },
  b: { arrows: '↓↻', desc: '내려서 둥글게' },
  c: { arrows: '↺', desc: '둥글게' },
  d: { arrows: '↺↑↓', desc: '둥글게 후 올려서 내려' },
  e: { arrows: '→↺', desc: '가로 후 둥글게' },
  f: { arrows: '↺↓→', desc: '꺾어 내려, 가로' },
  g: { arrows: '↺↓', desc: '둥글게 후 아래로' },
  h: { arrows: '↓↻', desc: '내려서 넘겨' },
  i: { arrows: '↓ ·', desc: '내려, 점' },
  j: { arrows: '↓↺ ·', desc: '내려 꺾어, 점' },
  k: { arrows: '↓↙↘', desc: '내려, 꺾어 내려' },
  l: { arrows: '↓', desc: '내려' },
  m: { arrows: '↓↗↓↗↓', desc: '내려 올려 내려 올려 내려' },
  n: { arrows: '↓↗↓', desc: '내려 올려 내려' },
  o: { arrows: '↺', desc: '둥글게' },
  p: { arrows: '↓↻', desc: '내려서 둥글게' },
  q: { arrows: '↺↓', desc: '둥글게 후 내려' },
  r: { arrows: '↓↗', desc: '내려, 살짝 올려' },
  s: { arrows: '↺↻', desc: 'S자 곡선' },
  t: { arrows: '↓→', desc: '내려, 가로' },
  u: { arrows: '↓↗↓', desc: '내려 올려 내려' },
  v: { arrows: '↘↗', desc: '비스듬히 내려 올려' },
  w: { arrows: '↘↗↘↗', desc: '지그재그' },
  x: { arrows: '↘ ↗', desc: '엑스' },
  y: { arrows: '↘↙', desc: '비스듬히 내려, 꺾어' },
  z: { arrows: '→↙→', desc: '가로, 비스듬히, 가로' },
};

type Props = {
  input: PracticeInput;
  onFinish: (info: { bonus: boolean; averageCoverage: number }) => void;
};

const BONUS_THRESHOLD = 0.7;

export default function WritingPractice({ input, onFinish }: Props) {
  const [wordIdx, setWordIdx] = useState(0);
  const word = input.words[wordIdx];
  const isLast = wordIdx === input.words.length - 1;
  const boardRef = useRef<TraceBoardHandle>(null);
  const scoresRef = useRef<number[]>(Array(input.words.length).fill(0));
  const [livePct, setLivePct] = useState(0);
  const [overallPct, setOverallPct] = useState(0);

  const recompute = () => {
    const rows = boardRef.current?.getRowCoverages() ?? [];
    const best = rows.length ? Math.max(...rows) : 0;
    scoresRef.current[wordIdx] = Math.max(scoresRef.current[wordIdx], best);
    setLivePct(Math.min(1, best));
    const sum = scoresRef.current.reduce((a, b) => a + b, 0);
    setOverallPct(Math.min(1, sum / input.words.length));
  };

  const captureCurrent = () => recompute();
  const refreshLive = () => recompute();

  useEffect(() => {
    setLivePct(0);
  }, [wordIdx]);

  const next = () => {
    captureCurrent();
    if (!isLast) setWordIdx(wordIdx + 1);
  };
  const prev = () => {
    captureCurrent();
    if (wordIdx > 0) setWordIdx(wordIdx - 1);
  };
  const finish = () => {
    captureCurrent();
    const totals = scoresRef.current;
    const avg = totals.reduce((a, b) => a + b, 0) / totals.length;
    onFinish({ bonus: avg >= BONUS_THRESHOLD, averageCoverage: avg });
  };

  const wordPctLabel = Math.round(livePct * 100);
  const overallPctLabel = Math.round(overallPct * 100);
  const overallPass = overallPct >= BONUS_THRESHOLD;

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-3xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          {wordIdx + 1} / {input.words.length}
        </div>
        <button
          onClick={finish}
          className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm"
        >
          ← 나가기
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="text-5xl sm:text-6xl">{getEmojiForWord(word.text)}</div>
        <div className="flex-1 min-w-0">
          <div className="text-xs sm:text-sm text-gray-500">따라 쓰세요</div>
          <div className="text-3xl sm:text-4xl font-bold truncate">{word.text}</div>
        </div>
        <div className="flex flex-col gap-1 shrink-0">
          <CoverageBadge label="단어" pct={wordPctLabel} pass={false} tone="word" />
          <CoverageBadge label="전체" pct={overallPctLabel} pass={overallPass} tone="overall" />
        </div>
      </div>

      <StrokeGuide word={word.text} />
      <TraceBoard ref={boardRef} key={word.text} word={word.text} onChange={refreshLive} />

      <div className="flex gap-3 justify-between pt-1">
        <button
          onClick={prev}
          disabled={wordIdx === 0}
          className="px-5 py-3 bg-white border font-semibold rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ◀ 이전
        </button>
        {!isLast ? (
          <button
            onClick={next}
            className="px-7 py-3 bg-gradient-to-br from-green-400 to-green-600 text-white font-bold rounded-lg hover:shadow-lg"
          >
            다음 ▶
          </button>
        ) : (
          <button
            onClick={finish}
            className="px-7 py-3 bg-gradient-to-br from-purple-400 to-purple-600 text-white font-bold rounded-lg hover:shadow-lg"
          >
            🎉 끝!
          </button>
        )}
      </div>
    </div>
  );
}

function CoverageBadge({
  label,
  pct,
  pass,
  tone,
}: {
  label: string;
  pct: number;
  pass: boolean;
  tone: 'word' | 'overall';
}) {
  const base = 'rounded-full px-2.5 py-1 text-xs font-bold flex items-center gap-1 shadow-sm';
  const color =
    tone === 'overall'
      ? pass
        ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white'
        : 'bg-blue-50 text-blue-700'
      : 'bg-gray-100 text-gray-700';
  const icon = tone === 'overall' ? (pass ? '⭐' : '📊') : '✏️';
  return (
    <div className={`${base} ${color}`}>
      <span>{icon}</span>
      <span className="opacity-80">{label}</span>
      <span>{pct}%</span>
    </div>
  );
}

type TraceBoardHandle = {
  getRowCoverages: () => number[];
};

type BoardProps = {
  word: string;
  onChange: () => void;
};

const ROWS = 3;
const ROW_HEIGHT = 110;

const TraceBoard = forwardRef<TraceBoardHandle, BoardProps>(function TraceBoard(
  { word, onChange },
  ref
) {
  const [clearTick, setClearTick] = useState(0);
  const rowRefs = useRef<Array<TraceRowHandle | null>>(Array(ROWS).fill(null));

  useImperativeHandle(ref, () => ({
    getRowCoverages: () => rowRefs.current.map((r) => r?.getCoverage() ?? 0),
  }));

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center">
        <p className="text-xs text-gray-400">
          마우스·손가락으로 흐린 글자 위를 따라 쓰세요
        </p>
        <button
          onClick={() => setClearTick((t) => t + 1)}
          className="text-xs px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full font-semibold"
        >
          🧽 지우기
        </button>
      </div>
      <div className="space-y-2">
        {Array.from({ length: ROWS }).map((_, i) => (
          <TraceRow
            key={i}
            ref={(el) => {
              rowRefs.current[i] = el;
            }}
            word={word}
            clearTick={clearTick}
            onStroke={onChange}
          />
        ))}
      </div>
    </div>
  );
});

type TraceRowHandle = {
  getCoverage: () => number;
};

type RowProps = {
  word: string;
  clearTick: number;
  onStroke: () => void;
};

const TraceRow = forwardRef<TraceRowHandle, RowProps>(function TraceRow(
  { word, clearTick, onStroke },
  ref
) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLCanvasElement>(null);
  const userRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const lastPt = useRef<{ x: number; y: number } | null>(null);

  const onStrokeRef = useRef(onStroke);
  useEffect(() => {
    onStrokeRef.current = onStroke;
  }, [onStroke]);

  useEffect(() => {
    const wrap = wrapRef.current;
    const guide = guideRef.current;
    const user = userRef.current;
    if (!wrap || !guide || !user) return;

    const resetUserCtx = () => {
      const uctx = user.getContext('2d');
      if (!uctx) return;
      const dpr = window.devicePixelRatio || 1;
      uctx.setTransform(1, 0, 0, 1, 0, 0);
      uctx.scale(dpr, dpr);
      uctx.lineWidth = 10;
      uctx.lineCap = 'round';
      uctx.lineJoin = 'round';
      uctx.strokeStyle = '#1d4ed8';
    };

    const drawGuide = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const gctx = guide.getContext('2d');
      if (!gctx) return;
      gctx.setTransform(1, 0, 0, 1, 0, 0);
      gctx.clearRect(0, 0, guide.width, guide.height);
      gctx.scale(dpr, dpr);
      gctx.fillStyle = '#d1d5db';
      gctx.textBaseline = 'middle';
      gctx.font =
        '72px "Comic Sans MS", "Chalkboard SE", "Apple SD Gothic Neo", system-ui, sans-serif';
      gctx.fillText(word, 16, rect.height / 2);
    };

    const sizeCanvases = () => {
      const rect = wrap.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      if (guide.width === w && guide.height === h) return false;
      [guide, user].forEach((c) => {
        c.width = w;
        c.height = h;
        c.style.width = `${rect.width}px`;
        c.style.height = `${rect.height}px`;
      });
      return true;
    };

    // initial setup
    sizeCanvases();
    drawGuide();
    resetUserCtx();

    // on resize: only redraw if dimensions actually changed
    const ro = new ResizeObserver(() => {
      if (sizeCanvases()) {
        drawGuide();
        resetUserCtx();
      }
    });
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [word]);

  useEffect(() => {
    const user = userRef.current;
    const uctx = user?.getContext('2d');
    if (!user || !uctx || clearTick === 0) return;
    const prev = uctx.getTransform();
    uctx.setTransform(1, 0, 0, 1, 0, 0);
    uctx.clearRect(0, 0, user.width, user.height);
    uctx.setTransform(prev);
    onStrokeRef.current();
  }, [clearTick]);

  useImperativeHandle(ref, () => ({
    getCoverage: () => {
      const guide = guideRef.current;
      const user = userRef.current;
      if (!guide || !user) return 0;
      const gctx = guide.getContext('2d');
      const uctx = user.getContext('2d');
      if (!gctx || !uctx) return 0;
      const w = guide.width;
      const h = guide.height;
      if (w === 0 || h === 0) return 0;
      try {
        const g = gctx.getImageData(0, 0, w, h).data;
        const u = uctx.getImageData(0, 0, w, h).data;
        const dpr = window.devicePixelRatio || 1;
        const r = Math.max(3, Math.round(3 * dpr));
        let target = 0;
        let covered = 0;
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            const gi = (y * w + x) * 4 + 3;
            if (g[gi] <= 40) continue;
            target++;
            let hit = false;
            for (let dy = -r; dy <= r && !hit; dy++) {
              const ny = y + dy;
              if (ny < 0 || ny >= h) continue;
              for (let dx = -r; dx <= r && !hit; dx++) {
                const nx = x + dx;
                if (nx < 0 || nx >= w) continue;
                if (u[(ny * w + nx) * 4 + 3] > 40) hit = true;
              }
            }
            if (hit) covered++;
          }
        }
        return target > 0 ? covered / target : 0;
      } catch {
        return 0;
      }
    },
  }));

  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = userRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const start = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = userRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    drawing.current = true;
    lastPt.current = getPoint(e);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.arc(lastPt.current.x, lastPt.current.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#1d4ed8';
      ctx.fill();
    }
  };

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    e.preventDefault();
    const ctx = userRef.current?.getContext('2d');
    if (!ctx) return;
    const p = getPoint(e);
    const last = lastPt.current;
    if (last) {
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
    lastPt.current = p;
  };

  const end = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = userRef.current;
    if (canvas?.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
    drawing.current = false;
    lastPt.current = null;
    onStroke();
  };

  return (
    <div
      ref={wrapRef}
      className="relative select-none touch-none"
      style={{ height: ROW_HEIGHT }}
    >
      <div className="absolute inset-x-0 top-0 h-px bg-red-400" />
      <div
        className="absolute inset-x-0 top-1/2"
        style={{ borderTop: '1px dashed #93c5fd' }}
      />
      <div className="absolute inset-x-0 bottom-0 h-px bg-red-400" />
      <canvas ref={guideRef} className="absolute inset-0 pointer-events-none" />
      <canvas
        ref={userRef}
        className="absolute inset-0 touch-none cursor-crosshair"
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
        onPointerLeave={end}
      />
    </div>
  );
});

function StrokeGuide({ word }: { word: string }) {
  const [open, setOpen] = useState(true);
  const letters = word.toLowerCase().split('');
  return (
    <div className="bg-indigo-50 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-bold text-indigo-700"
      >
        <span>✏️ 쓰는 순서 가이드</span>
        <span>{open ? '접기 ▲' : '펼치기 ▼'}</span>
      </button>
      {open && (
        <div className="px-3 pb-3 flex gap-1 overflow-x-auto">
          {letters.map((ch, i) => {
            const hint = STROKE_HINTS[ch];
            if (!hint) {
              return (
                <div
                  key={`${ch}-${i}`}
                  className="shrink-0 w-12 h-16 bg-white rounded-lg flex flex-col items-center justify-center shadow-sm"
                >
                  <span className="text-2xl font-bold text-gray-800">{ch}</span>
                </div>
              );
            }
            return (
              <div
                key={`${ch}-${i}`}
                className="shrink-0 w-14 bg-white rounded-lg flex flex-col items-center py-1.5 shadow-sm"
              >
                <span className="text-2xl font-bold text-gray-800">{ch}</span>
                <span className="text-sm text-indigo-600 tracking-wider leading-none mt-0.5">
                  {hint.arrows}
                </span>
                <span className="text-[7px] text-gray-500 mt-0.5 leading-tight text-center px-0.5">
                  {hint.desc}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
