'use client';

import { useState } from 'react';
import { lookupWord, type DictEntry } from '@/lib/dictionary';
import { translateToKorean, translateToEnglish, isKorean } from '@/lib/translate';
import { speak } from '@/lib/tts';

type Result = {
  source: string;
  sourceLang: 'en' | 'ko';
  translation: string | null;
  entry: DictEntry | null;
};

export default function DictionaryWidget() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      if (isKorean(q)) {
        const en = await translateToEnglish(q);
        if (!en) {
          setError('영어 번역을 찾지 못했어요.');
        } else {
          const entry = await lookupWord(en);
          setResult({ source: q, sourceLang: 'ko', translation: en, entry });
        }
      } else {
        const [ko, entry] = await Promise.all([translateToKorean(q), lookupWord(q)]);
        if (!ko && !entry) {
          setError('단어를 찾지 못했어요. 철자를 확인해주세요.');
        } else {
          setResult({ source: q, sourceLang: 'en', translation: ko, entry });
        }
      }
    } catch {
      setError('네트워크 오류가 발생했어요.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setQuery('');
    setResult(null);
    setError(null);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full bg-white rounded-2xl shadow p-3 flex items-center gap-2 text-left hover:bg-gray-50 active:scale-[0.99]"
      >
        <span className="text-2xl">📖</span>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-gray-800">영어사전 · 한영/영한</div>
          <div className="text-xs text-gray-500">한글·영어 모두 검색 가능</div>
        </div>
        <span className="text-gray-400">▸</span>
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">📖</span>
          <h3 className="font-bold">영어사전</h3>
        </div>
        <button
          onClick={() => {
            setOpen(false);
            reset();
          }}
          className="text-sm px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200"
        >
          ✕ 닫기
        </button>
      </div>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              search();
            }
          }}
          placeholder="한글 또는 영어 단어 (예: apple / 사과)"
          className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={search}
          disabled={!query.trim() || loading}
          className="px-4 py-2 bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold rounded-lg disabled:opacity-40"
        >
          {loading ? '…' : '🔍 검색'}
        </button>
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</div>
      )}

      {result && <ResultView result={result} />}
    </div>
  );
}

function ResultView({ result }: { result: Result }) {
  const primaryWord = result.sourceLang === 'en' ? result.source : result.translation ?? '';
  const koreanWord = result.sourceLang === 'ko' ? result.source : result.translation ?? '';
  const canSpeak = !!primaryWord && /^[a-zA-Z\s\-']+$/.test(primaryWord);

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 rounded-xl p-3">
        <div className="flex items-start gap-3">
          {canSpeak && (
            <button
              onClick={() => speak(primaryWord)}
              className="text-xl bg-white rounded-full w-10 h-10 flex items-center justify-center shadow active:scale-95 shrink-0"
              aria-label="발음 듣기"
            >
              🔊
            </button>
          )}
          <div className="flex-1 min-w-0 space-y-1">
            <div className="flex items-baseline flex-wrap gap-x-2">
              <span className="text-xl font-bold">{primaryWord || '?'}</span>
              {result.entry?.phonetic && (
                <span className="text-sm text-gray-500 font-mono">{result.entry.phonetic}</span>
              )}
            </div>
            {koreanWord && (
              <div className="text-sm text-blue-800 font-semibold">
                한글 뜻: {koreanWord}
              </div>
            )}
          </div>
        </div>
      </div>

      {result.entry?.meanings.map((m, i) => (
        <div key={i} className="border-l-2 border-gray-200 pl-3">
          <div className="text-xs uppercase font-bold text-gray-500 tracking-wide">
            {m.partOfSpeech}
          </div>
          <ul className="text-sm text-gray-700 mt-1 space-y-1">
            {m.definitions.map((d, j) => (
              <li key={j}>• {d}</li>
            ))}
          </ul>
        </div>
      ))}

      {!result.entry && result.sourceLang === 'en' && (
        <p className="text-xs text-gray-500">영영 정의는 찾지 못했어요.</p>
      )}
    </div>
  );
}
