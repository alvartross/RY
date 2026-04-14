'use client';

import { useState } from 'react';
import { toDateKey, todayKey, monthDays, firstWeekdayOffset } from '@/lib/date';

type Props = {
  lessonDates: Set<string>;
  selectedDate?: string;
  onSelectDate: (dateKey: string) => void;
};

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function Calendar({ lessonDates, selectedDate, onSelectDate }: Props) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const today = todayKey();
  const days = monthDays(year, month);
  const offset = firstWeekdayOffset(year, month);

  const goPrev = () => {
    if (month === 0) {
      setYear(year - 1);
      setMonth(11);
    } else {
      setMonth(month - 1);
    }
  };
  const goNext = () => {
    if (month === 11) {
      setYear(year + 1);
      setMonth(0);
    } else {
      setMonth(month + 1);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goPrev}
          className="px-3 py-2 rounded-lg hover:bg-gray-100 text-2xl"
          aria-label="이전 달"
        >
          ◀
        </button>
        <div className="text-2xl font-bold">
          {year}년 {month + 1}월
        </div>
        <button
          onClick={goNext}
          className="px-3 py-2 rounded-lg hover:bg-gray-100 text-2xl"
          aria-label="다음 달"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center font-semibold text-sm text-gray-600 mb-2">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : ''}>
            {w}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: offset }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((d) => {
          const key = toDateKey(d);
          const isToday = key === today;
          const isSelected = key === selectedDate;
          const hasLesson = lessonDates.has(key);
          const weekday = d.getDay();
          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              className={[
                'aspect-square rounded-lg flex flex-col items-center justify-center relative text-lg font-semibold transition-all active:scale-95',
                isToday
                  ? 'bg-gradient-to-br from-pink-400 to-orange-400 text-white shadow-md'
                  : hasLesson
                    ? 'bg-blue-100 text-blue-900 hover:bg-blue-200'
                    : 'hover:bg-gray-100',
                isSelected && !isToday ? 'ring-2 ring-pink-400' : '',
                !isToday && weekday === 0 ? 'text-red-500' : '',
                !isToday && weekday === 6 ? 'text-blue-500' : '',
              ].join(' ')}
            >
              <span>{d.getDate()}</span>
              {hasLesson && <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-pink-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
