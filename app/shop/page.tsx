'use client';

import { useEffect, useState } from 'react';
import TopBar from '@/components/layout/TopBar';
import Modal from '@/components/Modal';
import { REWARDS, type RewardItem } from '@/lib/rewards';
import { getTotalPoints, getHistory, spendPoints } from '@/lib/points';

type Purchase = { at: number; itemId: string; itemName: string; price: number };

export default function ShopPage() {
  const [points, setPoints] = useState(0);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [buying, setBuying] = useState<RewardItem | null>(null);
  const [justBought, setJustBought] = useState<RewardItem | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const reload = () => {
    setPoints(getTotalPoints());
    const h = getHistory()
      .filter((e) => e.category === 'shop' && e.delta < 0)
      .map<Purchase>((e) => ({
        at: e.at,
        itemId: '',
        itemName: e.note ?? '구매',
        price: -e.delta,
      }))
      .sort((a, b) => b.at - a.at);
    setPurchases(h);
    setRefreshKey((k) => k + 1);
  };

  useEffect(() => {
    reload();
  }, []);

  const confirmBuy = () => {
    if (!buying) return;
    const { ok } = spendPoints(buying.price, buying.name);
    if (ok) {
      setJustBought(buying);
      reload();
    }
    setBuying(null);
  };

  return (
    <>
      <TopBar refreshKey={refreshKey} />
      <main className="max-w-3xl mx-auto px-4 pt-4 pb-24 space-y-5">
        <header className="text-center">
          <h1 className="text-3xl font-bold">🎁 Reward Shop</h1>
          <p className="text-sm text-gray-600 mt-1">
            열심히 모은 포인트로 보상을 받으세요
          </p>
        </header>

        <div className="bg-gradient-to-br from-yellow-300 via-orange-400 to-pink-400 rounded-2xl p-5 shadow-lg text-white text-center">
          <div className="text-sm opacity-90">내 포인트</div>
          <div className="text-4xl font-bold">⭐ {points.toLocaleString()}P</div>
        </div>

        <section>
          <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 px-1">
            보상
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {REWARDS.map((r) => {
              const affordable = points >= r.price;
              return (
                <div
                  key={r.id}
                  className={`rounded-2xl p-4 shadow bg-white flex gap-3 items-center ${
                    affordable ? '' : 'opacity-70'
                  }`}
                >
                  <div className="text-5xl">{r.emoji}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-lg">{r.name}</div>
                    <div className="text-xs text-gray-500">{r.description}</div>
                    <div className="mt-1 text-sm font-bold text-orange-500">
                      {r.price.toLocaleString()}P
                    </div>
                  </div>
                  <button
                    onClick={() => setBuying(r)}
                    disabled={!affordable}
                    className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                      affordable
                        ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow hover:shadow-lg active:scale-95'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {affordable ? '받기' : `${(r.price - points).toLocaleString()}P 부족`}
                  </button>
                </div>
              );
            })}
          </div>
        </section>

        {purchases.length > 0 && (
          <section>
            <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2 px-1">
              최근 구매
            </h2>
            <ul className="bg-white rounded-2xl shadow divide-y">
              {purchases.slice(0, 10).map((p, i) => (
                <li key={`${p.at}-${i}`} className="px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold">{p.itemName}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(p.at).toLocaleString('ko-KR')}
                    </div>
                  </div>
                  <div className="text-sm font-bold text-red-500">
                    -{p.price.toLocaleString()}P
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>

      <Modal open={!!buying} onClose={() => setBuying(null)} size="sm">
        {buying && (
          <div className="bg-white rounded-2xl p-6 text-center space-y-4">
            <div className="text-6xl">{buying.emoji}</div>
            <h3 className="text-xl font-bold">{buying.name}을(를) 받을까요?</h3>
            <p className="text-sm text-gray-500">
              {buying.price.toLocaleString()}P가 차감돼요
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setBuying(null)}
                className="flex-1 px-4 py-3 bg-gray-100 font-semibold rounded-xl"
              >
                취소
              </button>
              <button
                onClick={confirmBuy}
                className="flex-1 px-4 py-3 bg-gradient-to-br from-green-400 to-emerald-600 text-white font-bold rounded-xl"
              >
                네, 받을래요
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!justBought} onClose={() => setJustBought(null)} size="sm">
        {justBought && (
          <div className="bg-white rounded-2xl p-6 text-center space-y-4">
            <div className="text-7xl">🎉</div>
            <h3 className="text-2xl font-bold">{justBought.name} 받았어요!</h3>
            <p className="text-sm text-gray-500">
              부모님께 보여드리고 약속한 보상을 받아요 👨‍👩‍👧
            </p>
            <button
              onClick={() => setJustBought(null)}
              className="w-full px-4 py-3 bg-gradient-to-br from-blue-400 to-blue-600 text-white font-bold rounded-xl"
            >
              확인
            </button>
          </div>
        )}
      </Modal>
    </>
  );
}
