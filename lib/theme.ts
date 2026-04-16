'use client';

import { useEffect, useState } from 'react';

export type Theme = 'default' | 'dark';

const KEY = 'english-kids:theme';

export function getTheme(): Theme {
  if (typeof window === 'undefined') return 'default';
  const stored = window.localStorage.getItem(KEY);
  if (stored === 'dark') return stored;
  return 'default';
}

export function setTheme(theme: Theme) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('data-theme', theme);
}

export function useTheme(): { theme: Theme; set: (t: Theme) => void } {
  const [theme, setLocal] = useState<Theme>('default');

  useEffect(() => {
    const t = getTheme();
    setLocal(t);
    applyTheme(t);
  }, []);

  const set = (t: Theme) => {
    setLocal(t);
    setTheme(t);
  };

  return { theme, set };
}
