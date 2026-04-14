const BLANK_RE = /(_{3,}|\.{3,}|…)/g;

export function fillSentence(pattern: string, word: string): string {
  return pattern.replace(BLANK_RE, word);
}

export function renderSentenceParts(
  pattern: string,
  word: string
): Array<{ text: string; isWord: boolean }> {
  const parts: Array<{ text: string; isWord: boolean }> = [];
  const tokens = pattern.split(BLANK_RE);
  for (const t of tokens) {
    if (!t) continue;
    const isBlank = /^(_{3,}|\.{3,}|…)$/.test(t);
    parts.push({ text: isBlank ? word : t, isWord: isBlank });
  }
  return parts;
}
