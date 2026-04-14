export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function monthDays(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: Date[] = [];
  for (let i = 1; i <= last.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  return days;
}

export function firstWeekdayOffset(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

export function formatKorean(dateKey: string): string {
  const [y, m, d] = dateKey.split('-');
  return `${y}년 ${Number(m)}월 ${Number(d)}일`;
}
