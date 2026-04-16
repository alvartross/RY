const KEY = 'english-kids:gameScores';

export type GameScore = {
  score: number;
  name: string;
  date: string;
};

type ScoreMap = Record<string, GameScore>;

function read(): ScoreMap {
  if (typeof window === 'undefined') return {};
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as ScoreMap;
  } catch {
    return {};
  }
}

function write(map: ScoreMap) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(KEY, JSON.stringify(map));
}

export function getBestScore(gameId: string): GameScore | null {
  return read()[gameId] ?? null;
}

export function isNewBest(gameId: string, score: number): boolean {
  const best = getBestScore(gameId);
  return !best || score > best.score;
}

export function saveBestScore(gameId: string, score: number, name: string): GameScore {
  const map = read();
  const entry: GameScore = { score, name, date: new Date().toISOString().slice(0, 10) };
  map[gameId] = entry;
  write(map);
  return entry;
}

export function getAllBestScores(): ScoreMap {
  return read();
}
