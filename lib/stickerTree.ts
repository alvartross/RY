const KEY = 'english-kids:stickerTree';

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

const DEFAULT: StickerTree = {
  goal: 10,
  reward: '',
  stickers: [],
};

function read(): StickerTree {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...(JSON.parse(raw) as StickerTree) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

function write(tree: StickerTree) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(tree));
}

export function getTree(): StickerTree {
  return read();
}

export function setupTree(goal: number, reward: string): StickerTree {
  const tree: StickerTree = { goal, reward, stickers: [], completedAt: undefined };
  write(tree);
  return tree;
}

export function addSticker(reason: string, emoji: string, date: string): {
  added: boolean;
  completed: boolean;
  tree: StickerTree;
} {
  const tree = read();
  if (tree.completedAt) return { added: false, completed: true, tree };
  if (tree.stickers.length >= tree.goal) return { added: false, completed: true, tree };
  tree.stickers.push({ reason, emoji, date, at: Date.now() });
  if (tree.stickers.length >= tree.goal) {
    tree.completedAt = Date.now();
  }
  write(tree);
  return { added: true, completed: !!tree.completedAt, tree };
}

export function resetTree(): StickerTree {
  const tree = read();
  const fresh: StickerTree = { goal: tree.goal, reward: tree.reward, stickers: [], completedAt: undefined };
  write(fresh);
  return fresh;
}

export function getStickerCount(): number {
  return read().stickers.length;
}

export function isTreeComplete(): boolean {
  const tree = read();
  return !!tree.completedAt || tree.stickers.length >= tree.goal;
}
