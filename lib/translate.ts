const CACHE_KEY = 'english-kids:translateCache';

type Cache = Record<string, string>;

function loadCache(): Cache {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Cache) : {};
  } catch {
    return {};
  }
}

function saveCache(c: Cache) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(c));
}

export function isKorean(s: string): boolean {
  return /[\u3131-\u318E\uAC00-\uD7A3]/.test(s);
}

// 자주 오역되는 단어: 정답으로 강제
const EN_KO_OVERRIDES: Record<string, string> = {
  english: '영어',
  korean: '한국어',
  japanese: '일본어',
  chinese: '중국어',
  spanish: '스페인어',
  french: '프랑스어',
  math: '수학',
  maths: '수학',
  mathematics: '수학',
  science: '과학',
  music: '음악',
  art: '미술',
  history: '역사',
  geography: '지리',
  social: '사회',
  pe: '체육',
  gym: '체육',
  study: '공부',
  homework: '숙제',
  test: '시험',
  exam: '시험',
  teacher: '선생님',
  student: '학생',
  friend: '친구',
  family: '가족',
  mother: '엄마',
  father: '아빠',
  sister: '언니/누나',
  brother: '오빠/형',
  baby: '아기',
  boy: '남자아이',
  girl: '여자아이',
  man: '남자',
  woman: '여자',
  read: '읽다',
  write: '쓰다',
  run: '달리다',
  jump: '뛰다',
  swim: '수영하다',
  sleep: '자다',
  eat: '먹다',
  drink: '마시다',
  play: '놀다',
  sing: '노래하다',
  dance: '춤추다',
  draw: '그리다',
  happy: '행복한',
  sad: '슬픈',
  angry: '화난',
  hungry: '배고픈',
  thirsty: '목마른',
  tired: '피곤한',
  big: '큰',
  small: '작은',
  tall: '키 큰',
  short: '키 작은',
  fast: '빠른',
  slow: '느린',
  hot: '뜨거운',
  cold: '차가운',
  new: '새로운',
  old: '오래된',
  good: '좋은',
  bad: '나쁜',
  clean: '깨끗한',
  dirty: '더러운',
  'wash my hands': '손을 씻다',
  'wash hands': '손을 씻다',
};

const KO_EN_OVERRIDES: Record<string, string> = {};
for (const [en, ko] of Object.entries(EN_KO_OVERRIDES)) {
  if (!KO_EN_OVERRIDES[ko]) KO_EN_OVERRIDES[ko] = en;
}

type MyMemoryResponse = {
  responseData?: { translatedText?: string; match?: number };
};

async function callMyMemory(text: string, langpair: 'en|ko' | 'ko|en'): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langpair}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as MyMemoryResponse;
    const translated = data.responseData?.translatedText?.trim();
    if (!translated || translated.toLowerCase() === text.toLowerCase()) return null;
    return translated;
  } catch {
    return null;
  }
}

export async function translateToKorean(word: string): Promise<string | null> {
  const q = word.trim().toLowerCase();
  if (!q) return null;
  if (EN_KO_OVERRIDES[q]) return EN_KO_OVERRIDES[q];
  const cache = loadCache();
  const key = `en|ko:${q}`;
  if (cache[key]) return cache[key];
  const result = await callMyMemory(q, 'en|ko');
  if (result) {
    cache[key] = result;
    saveCache(cache);
  }
  return result;
}

export async function translateToEnglish(word: string): Promise<string | null> {
  const q = word.trim();
  if (!q) return null;
  if (KO_EN_OVERRIDES[q]) return KO_EN_OVERRIDES[q];
  const cache = loadCache();
  const key = `ko|en:${q}`;
  if (cache[key]) return cache[key];
  const result = await callMyMemory(q, 'ko|en');
  if (result) {
    cache[key] = result;
    saveCache(cache);
  }
  return result;
}

export function getCachedTranslation(word: string): string | null {
  const q = word.trim().toLowerCase();
  if (EN_KO_OVERRIDES[q]) return EN_KO_OVERRIDES[q];
  const cache = loadCache();
  return cache[`en|ko:${q}`] ?? null;
}
