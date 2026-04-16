'use client';

import { usePathname, useRouter } from 'next/navigation';

const items = [
  { href: '/', label: 'Main', icon: '🏠' },
  { href: '/record', label: 'Record', icon: '📊' },
  { href: '/shop', label: 'Shop', icon: '🎁' },
  { href: '/word-game', label: 'Word', icon: '📝' },
  { href: '/sticker-tree', label: 'Tree', icon: '🌳' },
  { href: '/tetris', label: 'Tetris', icon: '🎮' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  return (
    <nav className="fixed bottom-0 inset-x-0 backdrop-blur border-t z-30" style={{ backgroundColor: 'var(--nav-bg)', borderColor: 'var(--border)', boxShadow: `0 -6px 20px var(--nav-shadow)` }}>
      <ul className="max-w-3xl mx-auto grid grid-cols-6">
        {items.map((it) => {
          const active = pathname === it.href;
          return (
            <li key={it.href} className="relative">
              <button
                onClick={() => {
                  if (!active) router.replace(it.href);
                }}
                className={[
                  'flex flex-col items-center justify-center gap-1 py-2.5 text-[12px] sm:text-[13px] font-semibold transition-colors w-full',
                  active
                    ? 'text-pink-600'
                    : 'text-gray-500 hover:text-gray-700',
                ].join(' ')}
              >
                <span
                  className={[
                    'text-2xl sm:text-3xl leading-none transition-transform',
                    active ? 'scale-110' : '',
                  ].join(' ')}
                >
                  {it.icon}
                </span>
                <span>{it.label}</span>
                {active && (
                  <span className="absolute -top-0.5 h-1 w-10 bg-gradient-to-r from-pink-400 to-orange-400 rounded-full" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
