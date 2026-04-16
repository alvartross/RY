const KEY = 'english-kids:stickerForest';

export type StickerEntry = {
  reason: string;
  emoji: string;
  date: string;
  at: number;
};

export type StickerTree = {
  goal: number;
  reward: string;
  stickers: StickerEntry[];
  completedAt?: number;
};

export type StickerForest = {
  trees: [StickerTree | null, StickerTree | null];
};

export const STICKER_EMOJIS = [
  '⭐', '🌟', '💫', '✨',
  '🌿', '🍃', '🍀', '🌱',
  '🌸', '🌺', '🌻', '🌷',
  '🦋', '🐝', '💎', '❤️',
  '🌈', '🎈', '🏅', '👑',
];

export const GOAL_OPTIONS = [10, 15, 20, 25, 30, 40, 50];

export const PRAISE_PRESETS = [
  { label: '엄마 말 잘 들었어요', emoji: '🙂' },
  { label: '아빠 말 잘 들었어요', emoji: '😊' },
  { label: '할머니 말 잘 들었어요', emoji: '🥰' },
  { label: '할아버지 말 잘 들었어요', emoji: '😄' },
  { label: '아빠랑 잘 놀았어요', emoji: '🤸' },
  { label: '사랑 표현 잘했어요', emoji: '💗' },
  { label: '영어로 표현했어요', emoji: '🇺🇸' },
  { label: '공부 열심히 했어요', emoji: '📖' },
  { label: '약속 잘 지켰어요', emoji: '🤝' },
  { label: '인사 잘했어요', emoji: '👋' },
  { label: '정리정돈 잘했어요', emoji: '🧹' },
  { label: '사이좋게 놀았어요', emoji: '💕' },
  { label: '양치질 잘했어요', emoji: '🪥' },
  { label: '일찍 잤어요', emoji: '😴' },
  { label: '밥 잘 먹었어요', emoji: '🍚' },
  { label: '스크린 절제했어요', emoji: '📵' },
  { label: '숙제 스스로 했어요', emoji: '✏️' },
  { label: '친구에게 친절했어요', emoji: '🫂' },
  { label: '참을성 있게 기다렸어요', emoji: '⏳' },
  { label: '새로운 것을 시도했어요', emoji: '🚀' },
  { label: '감사 인사 했어요', emoji: '🙏' },
  { label: '형/언니 도와줬어요', emoji: '🤗' },
  { label: '운동 열심히 했어요', emoji: '🏃' },
  { label: '책 읽었어요', emoji: '📚' },
  { label: '그림 그렸어요', emoji: '🎨' },
  { label: '스스로 준비했어요', emoji: '🎒' },
];

const DEFAULT: StickerForest = { trees: [null, null] };

function read(): StickerForest {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    if (parsed.trees) return parsed as StickerForest;
    if (parsed.goal != null) return { trees: [parsed as StickerTree, null] };
    return DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function write(forest: StickerForest) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(forest));
}

export function getForest(): StickerForest {
  return read();
}

export function getTree(idx: 0 | 1 = 0): StickerTree | null {
  return read().trees[idx];
}

export function setupTree(idx: 0 | 1, goal: number, reward: string): StickerForest {
  const forest = read();
  forest.trees[idx] = { goal: Math.min(50, Math.max(1, goal)), reward, stickers: [], completedAt: undefined };
  write(forest);
  return forest;
}

export function addSticker(
  reason: string,
  emoji: string,
  date: string,
  treeIdx: 0 | 1 = 0
): { added: boolean; completed: boolean; forest: StickerForest } {
  const forest = read();
  const tree = forest.trees[treeIdx];
  if (!tree) return { added: false, completed: false, forest };
  if (tree.completedAt || tree.stickers.length >= tree.goal) {
    return { added: false, completed: true, forest };
  }
  tree.stickers.push({ reason, emoji, date, at: Date.now() });
  if (tree.stickers.length >= tree.goal) tree.completedAt = Date.now();
  write(forest);
  return { added: true, completed: !!tree.completedAt, forest };
}

export function resetTree(idx: 0 | 1): StickerForest {
  const forest = read();
  forest.trees[idx] = null;
  write(forest);
  return forest;
}

export function getStickerCount(idx: 0 | 1 = 0): number {
  return read().trees[idx]?.stickers.length ?? 0;
}

export function isTreeComplete(idx: 0 | 1 = 0): boolean {
  const tree = read().trees[idx];
  return !!tree?.completedAt;
}

export function findAvailableTree(): 0 | 1 | null {
  const forest = read();
  for (const i of [0, 1] as const) {
    const t = forest.trees[i];
    if (t && !t.completedAt && t.stickers.length < t.goal) return i;
  }
  return null;
}
