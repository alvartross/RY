const KEY = 'english-kids:profile';

export type Profile = {
  name: string;
  emoji: string;
};

const DEFAULT: Profile = { name: '꼬마 영어쟁이', emoji: '🧒' };

export function getProfile(): Profile {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as Profile) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function saveProfile(p: Profile): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(p));
}
