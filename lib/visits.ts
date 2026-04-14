import { todayKey } from './date';

const KEY = 'english-kids:visits';

export type Visits = {
  previous?: string;
  current: string;
};

function read(): Visits | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Visits) : null;
  } catch {
    return null;
  }
}

function write(v: Visits) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(v));
}

export function recordVisit(): Visits {
  const today = todayKey();
  const existing = read();
  if (!existing) {
    const fresh: Visits = { current: today };
    write(fresh);
    return fresh;
  }
  if (existing.current !== today) {
    const next: Visits = { previous: existing.current, current: today };
    write(next);
    return next;
  }
  return existing;
}

export function getVisits(): Visits {
  return read() ?? { current: todayKey() };
}

export function shortDate(dateKey: string): string {
  const [, m, d] = dateKey.split('-');
  return `${Number(m)}/${Number(d)}`;
}
