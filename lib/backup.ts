const KEYS = [
  'english-kids:lessons',
  'english-kids:profile',
  'english-kids:totalPoints',
  'english-kids:dailyPoints',
  'english-kids:pointHistory',
  'english-kids:wordStagePoints',
  'english-kids:visits',
];

type BackupPayload = {
  version: 1;
  exportedAt: string;
  data: Record<string, unknown>;
};

function readAll(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const k of KEYS) {
    const raw = window.localStorage.getItem(k);
    if (raw == null) continue;
    try {
      out[k] = JSON.parse(raw);
    } catch {
      out[k] = raw;
    }
  }
  return out;
}

export function buildBackup(): BackupPayload {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    data: readAll(),
  };
}

export function downloadBackup(): void {
  const payload = buildBackup();
  const text = JSON.stringify(payload, null, 2);
  const blob = new Blob([text], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const today = new Date().toISOString().slice(0, 10);
  a.download = `english-kids-backup-${today}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importFromFile(file: File): Promise<BackupPayload> {
  const text = await file.text();
  const parsed = JSON.parse(text) as BackupPayload;
  if (parsed.version !== 1 || !parsed.data) {
    throw new Error('지원하지 않는 파일 형식이에요');
  }
  for (const k of Object.keys(parsed.data)) {
    if (!KEYS.includes(k)) continue;
    window.localStorage.setItem(k, JSON.stringify(parsed.data[k]));
  }
  return parsed;
}

export function summarizeBackup(payload: BackupPayload): {
  lessonCount: number;
  totalPoints: number;
  wordStagesCleared: number;
} {
  const d = payload.data as Record<string, unknown>;
  const lessons = (d['english-kids:lessons'] ?? {}) as Record<string, unknown>;
  const total = Number(d['english-kids:totalPoints'] ?? 0);
  const stages = (d['english-kids:wordStagePoints'] ?? {}) as Record<string, unknown>;
  return {
    lessonCount: Object.keys(lessons).length,
    totalPoints: total,
    wordStagesCleared: Object.keys(stages).length,
  };
}
