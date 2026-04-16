'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import { getTree, setupTree, resetTree, addSticker, type StickerTree } from '@/lib/stickerTree';
import { useAdmin } from '@/lib/admin';
import { todayKey } from '@/lib/date';

const LEAF_EMOJIS = ['🌿', '🍃', '🌸', '🍀', '🌺', '🌻', '🌷', '💚', '🌱', '🍂'];
const EMPTY_LEAF = '⚪';

export default function StickerTreePage() {
  const [tree, setTree] = useState<StickerTree | null>(null);
  const [goalDraft, setGoalDraft] = useState(10);
  const [rewardDraft, setRewardDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const { isAdmin } = useAdmin();

  useEffect(() => {
    setTree(getTree());
  }, []);

  if (!tree) return null;

  const hasGoal = tree.goal > 0 && tree.reward.length > 0;
  const filled = tree.stickers.length;
  const goal = tree.goal;
  const completed = !!tree.completedAt;

  const onSetup = () => {
    if (goalDraft < 1 || !rewardDraft.trim()) return;
    const t = setupTree(goalDraft, rewardDraft.trim());
    setTree(t);
  };

  const onReset = () => {
    if (!confirm('나무를 초기화하고 새로 시작할까요? 기존 스티커가 사라집니다.')) return;
    setTree(resetTree());
  };

  const onManualSticker = () => {
    const reason = prompt('스티커를 주는 이유를 적어주세요 (예: 착하게 행동함)');
    if (!reason) return;
    const { added, tree: updated } = addSticker(reason, '⭐', todayKey());
    if (added) {
      setTree(updated);
      setToast('⭐ 스티커 1개 추가!');
    } else {
      setToast('이미 목표를 달성했어요!');
    }
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <>
      <TopBar />
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-24 space-y-5">
        <header className="text-center">
          <h1 className="text-3xl font-bold">🌳 칭찬 스티커 나무</h1>
          <p className="text-sm text-gray-600 mt-1">
            {hasGoal
              ? `목표: ${tree.reward} (${filled} / ${goal})`
              : '목표를 설정하고 나무를 키워보세요!'}
          </p>
        </header>

        {!hasGoal && isAdmin ? (
          <div className="bg-white rounded-2xl shadow p-6 space-y-4">
            <h2 className="font-bold text-lg">🎯 목표 설정</h2>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">스티커 목표 개수</span>
              <div className="flex gap-2 mt-1">
                {[10, 15, 20, 30].map((n) => (
                  <button
                    key={n}
                    onClick={() => setGoalDraft(n)}
                    className={`px-4 py-2 rounded-lg font-bold ${
                      goalDraft === n
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {n}개
                  </button>
                ))}
              </div>
            </label>
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">
                달성하면 받을 보상 / 소원
              </span>
              <input
                value={rewardDraft}
                onChange={(e) => setRewardDraft(e.target.value)}
                placeholder="예: 놀이공원 가기, 원하는 장난감"
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
              />
            </label>
            <button
              onClick={onSetup}
              disabled={!rewardDraft.trim()}
              className="w-full py-3 bg-gradient-to-br from-green-400 to-emerald-600 text-white font-bold rounded-xl disabled:opacity-40"
            >
              🌳 나무 심기
            </button>
          </div>
        ) : !hasGoal ? (
          <div className="bg-white rounded-2xl shadow p-6 text-center text-gray-500">
            관리자 모드에서 목표를 설정해주세요 (상단 🔒)
          </div>
        ) : (
          <>
            {completed && (
              <div className="bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400 rounded-2xl p-6 text-center text-white space-y-2 shadow-lg">
                <div className="text-6xl">🎉🏆🎉</div>
                <h2 className="text-2xl font-black">목표 달성!</h2>
                <p className="text-lg font-bold">
                  &ldquo;{tree.reward}&rdquo;
                </p>
                <p className="text-sm opacity-90">
                  스티커 {goal}개를 모두 모았어요! 약속한 보상을 받아요!
                </p>
              </div>
            )}

            <div className="bg-white rounded-2xl shadow p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-gray-800">🎯 {tree.reward}</div>
                  <div className="text-xs text-gray-500">
                    {filled} / {goal} 스티커
                  </div>
                </div>
                <div className="text-sm font-bold text-emerald-600">
                  {Math.round((filled / goal) * 100)}%
                </div>
              </div>

              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 transition-all"
                  style={{ width: `${Math.min(100, (filled / goal) * 100)}%` }}
                />
              </div>

              <TreeVisual goal={goal} filled={filled} stickers={tree.stickers} />
            </div>

            {tree.stickers.length > 0 && (
              <div className="bg-white rounded-2xl shadow p-4">
                <h3 className="font-bold text-gray-800 text-sm mb-2">최근 스티커</h3>
                <ul className="space-y-1 max-h-40 overflow-y-auto">
                  {[...tree.stickers]
                    .reverse()
                    .slice(0, 10)
                    .map((s, i) => (
                      <li
                        key={`${s.at}-${i}`}
                        className="flex items-center gap-2 text-xs text-gray-700"
                      >
                        <span>{s.emoji}</span>
                        <span className="flex-1 truncate">{s.reason}</span>
                        <span className="text-gray-400">{s.date}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}

            {isAdmin && (
              <div className="flex gap-2">
                <button
                  onClick={onManualSticker}
                  className="flex-1 py-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold rounded-xl active:scale-95"
                >
                  ⭐ 스티커 주기
                </button>
                <button
                  onClick={onReset}
                  className="px-4 py-3 bg-gray-200 text-gray-700 font-semibold rounded-xl"
                >
                  초기화
                </button>
              </div>
            )}
          </>
        )}

        {toast && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white px-5 py-2.5 rounded-full font-semibold shadow-lg">
            {toast}
          </div>
        )}
      </main>
    </>
  );
}

function TreeVisual({
  goal,
  filled,
  stickers,
}: {
  goal: number;
  filled: number;
  stickers: StickerTree['stickers'];
}) {
  const rows: number[] = [];
  let remaining = goal;
  let width = 1;
  while (remaining > 0) {
    const count = Math.min(width, remaining);
    rows.push(count);
    remaining -= count;
    if (width < 7) width += 2;
  }

  let stickerIdx = 0;

  return (
    <div className="flex flex-col items-center gap-1 py-3">
      {rows.map((count, rowIdx) => (
        <div key={rowIdx} className="flex gap-1 justify-center">
          {Array.from({ length: count }).map((_, colIdx) => {
            const idx = stickerIdx++;
            const isFilled = idx < filled;
            const sticker = isFilled ? stickers[idx] : null;
            const emoji = isFilled
              ? sticker?.emoji ?? LEAF_EMOJIS[idx % LEAF_EMOJIS.length]
              : EMPTY_LEAF;
            return (
              <div
                key={colIdx}
                title={sticker?.reason}
                className={[
                  'w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-xl sm:text-2xl transition-all',
                  isFilled
                    ? 'bg-green-100 shadow-sm scale-100'
                    : 'bg-gray-50 scale-90 opacity-60',
                ].join(' ')}
              >
                {emoji}
              </div>
            );
          })}
        </div>
      ))}
      <div className="flex flex-col items-center mt-1">
        <div className="w-4 h-6 bg-amber-700 rounded-sm" />
        <div className="w-8 h-2 bg-amber-800 rounded-full" />
      </div>
    </div>
  );
}
