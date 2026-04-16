'use client';

import { useState } from 'react';
import { PRAISE_LIST, givePraise, isPraiseGivenToday } from '@/lib/praise';
import { addSticker, findAvailableTree } from '@/lib/stickerTree';
import { checkPin } from '@/lib/admin';
import { todayKey } from '@/lib/date';

type Props = {
  onPointsChange: () => void;
};

export default function PraisePanel({ onPointsChange }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const [pinTarget, setPinTarget] = useState<(typeof PRAISE_LIST)[number] | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const today = todayKey();

  const tryGive = (item: (typeof PRAISE_LIST)[number]) => {
    if (isPraiseGivenToday(item.id, today)) {
      setToast('오늘은 이미 받았어요');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    setPinTarget(item);
    setPinInput('');
    setPinError(false);
  };

  const confirmPin = () => {
    if (!checkPin(pinInput)) {
      setPinError(true);
      setPinInput('');
      return;
    }
    if (!pinTarget) return;
    const { awarded, alreadyDone } = givePraise(pinTarget.id, today);
    setPinTarget(null);
    if (alreadyDone) {
      setToast('오늘은 이미 받았어요');
    } else {
      const treeIdx = findAvailableTree();
      if (treeIdx !== null) addSticker(`칭찬: ${pinTarget.label}`, pinTarget.emoji, today, treeIdx);
      setToast(`${pinTarget.emoji} +${awarded}P!${treeIdx !== null ? ' 🌿스티커+1' : ''}`);
      onPointsChange();
    }
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <section className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800">⭐ 칭찬 보상</h2>
        <span className="text-[10px] text-gray-400">일일 1회씩 · PIN 확인</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PRAISE_LIST.map((item) => {
          const done = isPraiseGivenToday(item.id, today);
          return (
            <button
              key={item.id}
              onClick={() => tryGive(item)}
              className={[
                'flex flex-col items-center gap-1 p-2 rounded-xl text-center active:scale-95 transition-all',
                done
                  ? 'bg-gray-100 opacity-50'
                  : 'bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-md',
              ].join(' ')}
            >
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-[10px] sm:text-xs font-semibold text-gray-700 leading-tight">
                {item.label}
              </span>
              <span className="text-[9px] text-orange-600 font-bold">
                {done ? '✓ 완료' : `+${item.points}P`}
              </span>
            </button>
          );
        })}
      </div>

      {pinTarget && (
        <div className="fixed inset-0 z-40 bg-black/40 flex items-center justify-center p-4" onClick={() => setPinTarget(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-xs space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-center">
              <div className="text-4xl">{pinTarget.emoji}</div>
              <div className="font-bold mt-1">{pinTarget.label}</div>
              <div className="text-sm text-orange-600">+{pinTarget.points}P</div>
            </div>
            <div className="text-center text-sm text-gray-600">부모님 PIN을 입력해주세요</div>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4));
                setPinError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') confirmPin();
              }}
              placeholder="PIN 4자리"
              autoFocus
              className={[
                'w-full px-4 py-3 text-center text-2xl tracking-[1em] border-2 rounded-xl focus:outline-none',
                pinError ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-blue-400',
              ].join(' ')}
            />
            {pinError && <p className="text-center text-xs text-red-600">PIN이 맞지 않아요</p>}
            <div className="flex gap-2">
              <button
                onClick={() => setPinTarget(null)}
                className="flex-1 py-2.5 bg-gray-100 font-semibold rounded-xl"
              >
                취소
              </button>
              <button
                onClick={confirmPin}
                disabled={pinInput.length !== 4}
                className="flex-1 py-2.5 bg-gradient-to-br from-yellow-400 to-orange-500 text-white font-bold rounded-xl disabled:opacity-40"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="text-center text-sm font-semibold text-green-700 bg-green-50 rounded-lg py-2">
          {toast}
        </div>
      )}
    </section>
  );
}
