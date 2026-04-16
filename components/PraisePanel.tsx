'use client';

import { useState } from 'react';
import { PRAISE_LIST, givePraise, isPraiseGivenToday } from '@/lib/praise';
import { addSticker, getTree } from '@/lib/stickerTree';
import { todayKey } from '@/lib/date';

type Props = {
  onPointsChange: () => void;
};

export default function PraisePanel({ onPointsChange }: Props) {
  const [toast, setToast] = useState<string | null>(null);
  const today = todayKey();

  const onGive = (item: (typeof PRAISE_LIST)[number]) => {
    const { awarded, alreadyDone } = givePraise(item.id, today);
    if (alreadyDone) {
      setToast('오늘은 이미 받았어요');
    } else {
      addSticker(`칭찬: ${item.label}`, item.emoji, today);
      setToast(`${item.emoji} +${awarded}P! 스티커도 1개 추가`);
      onPointsChange();
    }
    setTimeout(() => setToast(null), 2000);
  };

  return (
    <section className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-gray-800">⭐ 칭찬 보상</h2>
        <span className="text-[10px] text-gray-400">관리자 모드 · 일일 1회씩</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {PRAISE_LIST.map((item) => {
          const done = isPraiseGivenToday(item.id, today);
          return (
            <button
              key={item.id}
              onClick={() => onGive(item)}
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
      {toast && (
        <div className="text-center text-sm font-semibold text-green-700 bg-green-50 rounded-lg py-2">
          {toast}
        </div>
      )}
    </section>
  );
}
