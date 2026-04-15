export type DictMeaning = {
  partOfSpeech: string;
  definitions: string[];
};

export type DictEntry = {
  word: string;
  phonetic?: string;
  audioUrl?: string;
  meanings: DictMeaning[];
};

type DatamuseResult = {
  word: string;
  score?: number;
  defs?: string[];
};

const POS_MAP: Record<string, string> = {
  n: 'noun',
  v: 'verb',
  adj: 'adjective',
  adv: 'adverb',
  u: 'unknown',
};

function expandPos(p: string): string {
  return POS_MAP[p] ?? p;
}

export async function lookupWord(word: string): Promise<DictEntry | null> {
  const q = word.trim().toLowerCase();
  if (!q) return null;
  try {
    const res = await fetch(
      `https://api.datamuse.com/words?sp=${encodeURIComponent(q)}&md=d&max=1`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as DatamuseResult[];
    const entry = data[0];
    if (!entry || !entry.defs || entry.defs.length === 0) return null;

    const byPos = new Map<string, string[]>();
    for (const def of entry.defs.slice(0, 8)) {
      const tabIdx = def.indexOf('\t');
      const posKey = tabIdx >= 0 ? def.slice(0, tabIdx) : 'u';
      const text = tabIdx >= 0 ? def.slice(tabIdx + 1) : def;
      const key = expandPos(posKey);
      const arr = byPos.get(key) ?? [];
      if (arr.length < 2) arr.push(text.trim());
      byPos.set(key, arr);
    }
    const meanings: DictMeaning[] = Array.from(byPos.entries()).map(
      ([partOfSpeech, definitions]) => ({ partOfSpeech, definitions })
    );
    return {
      word: entry.word,
      meanings,
    };
  } catch {
    return null;
  }
}
