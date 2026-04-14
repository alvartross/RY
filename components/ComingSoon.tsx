'use client';

import TopBar from '@/components/layout/TopBar';

type Props = { title: string; emoji: string; desc?: string };

export default function ComingSoon({ title, emoji, desc }: Props) {
  return (
    <>
      <TopBar />
      <main className="max-w-3xl mx-auto px-4 pt-10 pb-24 flex flex-col items-center justify-center gap-4 text-center">
        <div className="text-7xl">{emoji}</div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-gray-500 max-w-sm">
          {desc ?? '이 기능은 곧 나와요. 조금만 기다려주세요!'}
        </p>
      </main>
    </>
  );
}
