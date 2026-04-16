'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import {
  getForest,
  setupTree,
  resetTree,
  addSticker,
  STICKER_EMOJIS,
  GOAL_OPTIONS,
  PRAISE_PRESETS,
  type StickerForest,
  type StickerTree,
} from '@/lib/stickerTree';
import { useAdmin } from '@/lib/admin';
import { todayKey } from '@/lib/date';

const EMPTY_LEAF = '⚪';

export default function StickerTreePage() {
  const [forest, setForest] = useState<StickerForest>({ trees: [null, null] });
  const [toast, setToast] = useState<string | null>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    setForest(getForest());
  }, []);

  const show = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <>
      <TopBar />
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-24 space-y-5">
        <header className="text-center">
          <h1 className="text-3xl font-bold">🌳 칭찬 스티커 나무</h1>
          <p className="text-sm text-gray-600 mt-1">목표를 세우고 스티커를 모아 보상 받기!</p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          {([0, 1] as const).map((idx) => (
            <TreeCard
              key={idx}
              idx={idx}
              tree={forest.trees[idx]}
              isAdmin={isAdmin}
              onUpdate={(f) => setForest(f)}
              onToast={show}
            />
          ))}
        </div>

        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg">
            {toast}
          </div>
        )}
      </main>
    </>
  );
}

function TreeCard({
  idx,
  tree,
  isAdmin,
  onUpdate,
  onToast,
}: {
  idx: 0 | 1;
  tree: StickerTree | null;
  isAdmin: boolean;
  onUpdate: (f: StickerForest) => void;
  onToast: (msg: string) => void;
}) {
  const [goalDraft, setGoalDraft] = useState(10);
  const [rewardDraft, setRewardDraft] = useState('');
  const [giving, setGiving] = useState(false);

  if (!tree) {
    if (!isAdmin)
      return (
        <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-400 text-sm">
          🌱 나무 {idx + 1} — 관리자 모드에서 목표를 설정해주세요
        </div>
      );
    return (
      <div className="bg-white rounded-2xl shadow p-5 space-y-3">
        <h3 className="font-bold">🌱 나무 {idx + 1} 심기</h3>
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">스티커 목표 (최대 50)</span>
          <div className="flex gap-1 mt-1 flex-wrap">
            {GOAL_OPTIONS.map((n) => (
              <button
                key={n}
                onClick={() => setGoalDraft(n)}
                className={`px-3 py-1 rounded-lg text-sm font-bold ${goalDraft === n ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
              >
                {n}
              </button>
            ))}
          </div>
        </label>
        <label className="block">
          <span className="text-xs font-semibold text-gray-700">달성 보상/소원</span>
          <input
            value={rewardDraft}
            onChange={(e) => setRewardDraft(e.target.value)}
            placeholder="예: 놀이공원 가기"
            className="mt-1 w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
          />
        </label>
        <button
          onClick={() => {
            if (!rewardDraft.trim()) return;
            onUpdate(setupTree(idx, goalDraft, rewardDraft.trim()));
          }}
          disabled={!rewardDraft.trim()}
          className="w-full py-2 bg-gradient-to-br from-green-400 to-emerald-600 text-white font-bold rounded-xl disabled:opacity-40"
        >
          🌳 심기
        </button>
      </div>
    );
  }

  const { goal, reward, stickers, completedAt } = tree;
  const filled = stickers.length;
  const completed = !!completedAt;

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      {completed && (
        <div className="bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400 rounded-xl p-4 text-center text-white space-y-1">
          <div className="text-4xl">🎉🏆🎉</div>
          <div className="text-lg font-black">목표 달성!</div>
          <div className="font-bold">&ldquo;{reward}&rdquo;</div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-gray-800">🌳 나무 {idx + 1}</div>
          <div className="text-xs text-gray-500">🎯 {reward}</div>
        </div>
        <div className="text-sm font-bold text-emerald-600">{filled}/{goal}</div>
      </div>

      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-400 to-teal-400 transition-all"
          style={{ width: `${Math.min(100, (filled / goal) * 100)}%` }}
        />
      </div>

      <TreeVisual goal={goal} stickers={stickers} />

      {isAdmin && !completed && (
        <>
          {giving ? (
            <GiveStickerPanel
              treeIdx={idx}
              onGive={(f) => {
                onUpdate(f);
                setGiving(false);
                onToast('스티커 추가!');
              }}
              onCancel={() => setGiving(false)}
            />
          ) : (
            <button
              onClick={() => setGiving(true)}
              className="w-full py-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold rounded-xl active:scale-95"
            >
              ⭐ 스티커 주기
            </button>
          )}
        </>
      )}

      {isAdmin && (
        <button
          onClick={() => {
            if (!confirm('이 나무를 초기화할까요?')) return;
            onUpdate(resetTree(idx));
          }}
          className="w-full py-1.5 text-xs text-gray-500 hover:text-red-500"
        >
          초기화
        </button>
      )}
    </div>
  );
}

function GiveStickerPanel({
  treeIdx,
  onGive,
  onCancel,
}: {
  treeIdx: 0 | 1;
  onGive: (f: StickerForest) => void;
  onCancel: () => void;
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [selectedEmoji, setSelectedEmoji] = useState(STICKER_EMOJIS[0]);

  const reason = selectedReason === '__custom__' ? customReason.trim() : selectedReason;
  const canSubmit = reason.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    const { forest } = addSticker(reason, selectedEmoji, todayKey(), treeIdx);
    onGive(forest);
  };

  return (
    <div className="bg-yellow-50 rounded-xl p-3 space-y-3">
      <div className="text-xs font-bold text-gray-700">1. 칭찬 선택</div>
      <div className="grid grid-cols-2 gap-1 max-h-40 overflow-y-auto">
        {PRAISE_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => setSelectedReason(p.label)}
            className={`text-left px-2 py-1.5 rounded-lg text-[11px] flex items-center gap-1 ${
              selectedReason === p.label ? 'bg-green-200 font-bold' : 'bg-white hover:bg-gray-50'
            }`}
          >
            <span>{p.emoji}</span>
            <span className="truncate">{p.label}</span>
          </button>
        ))}
        <button
          onClick={() => setSelectedReason('__custom__')}
          className={`text-left px-2 py-1.5 rounded-lg text-[11px] flex items-center gap-1 ${
            selectedReason === '__custom__' ? 'bg-green-200 font-bold' : 'bg-white hover:bg-gray-50'
          }`}
        >
          <span>✍️</span>
          <span>직접 입력</span>
        </button>
      </div>

      {selectedReason === '__custom__' && (
        <input
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="칭찬 이유를 적어주세요"
          className="w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
        />
      )}

      <div className="text-xs font-bold text-gray-700">2. 스티커 모양 선택</div>
      <div className="flex gap-1 flex-wrap">
        {STICKER_EMOJIS.map((e) => (
          <button
            key={e}
            onClick={() => setSelectedEmoji(e)}
            className={`w-8 h-8 rounded-full text-lg flex items-center justify-center ${
              selectedEmoji === e ? 'bg-green-200 ring-2 ring-green-500' : 'bg-white hover:bg-gray-100'
            }`}
          >
            {e}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2 bg-gray-200 font-semibold rounded-lg text-sm"
        >
          취소
        </button>
        <button
          onClick={submit}
          disabled={!canSubmit}
          className="flex-1 py-2 bg-gradient-to-br from-green-400 to-emerald-600 text-white font-bold rounded-lg text-sm disabled:opacity-40"
        >
          {selectedEmoji} 스티커 붙이기
        </button>
      </div>
    </div>
  );
}

function TreeVisual({ goal, stickers }: { goal: number; stickers: StickerTree['stickers'] }) {
  const rows: number[] = [];
  let remaining = goal;
  let width = 1;
  while (remaining > 0) {
    const count = Math.min(width, remaining);
    rows.push(count);
    remaining -= count;
    if (width < 9) width += 2;
  }

  let stickerIdx = 0;

  return (
    <div className="flex flex-col items-center gap-0.5 py-2">
      {rows.map((count, rowIdx) => (
        <div key={rowIdx} className="flex gap-0.5 justify-center">
          {Array.from({ length: count }).map((_, colIdx) => {
            const idx = stickerIdx++;
            const isFilled = idx < stickers.length;
            const sticker = isFilled ? stickers[idx] : null;
            return (
              <div
                key={colIdx}
                title={sticker?.reason}
                className={[
                  'w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-base sm:text-lg transition-all',
                  isFilled ? 'bg-green-100 shadow-sm' : 'bg-gray-50 opacity-50',
                ].join(' ')}
              >
                {isFilled ? sticker?.emoji ?? '⭐' : EMPTY_LEAF}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex flex-col items-center mt-0.5">
        <div className="w-3 h-5 bg-amber-700 rounded-sm" />
        <div className="w-6 h-1.5 bg-amber-800 rounded-full" />
      </div>
    </div>
  );
}
