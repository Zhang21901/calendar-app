import { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { getMonthDays, isCurrentMonth } from '../../utils/dateUtils';
import { DayCard } from './DayCard';
import { SpecialDayForm } from '../sidebar/SpecialDayForm';
import * as api from '../../api';
import type { SpecialDay } from '../../types';

const WEEKDAYS = ['一', '二', '三', '四', '五', '六', '日'];

export function MonthView() {
  const { focusedDate } = useApp();
  const d = new Date(focusedDate);
  const days = getMonthDays(d.getFullYear(), d.getMonth() + 1);

  const [specialDays, setSpecialDays] = useState<SpecialDay[]>([]);
  const [markingDate, setMarkingDate] = useState<string | null>(null);

  useEffect(() => {
    const first = days[0];
    const last = days[days.length - 1];
    api.fetchSpecialDays(first, last).then(setSpecialDays).catch(console.error);
  }, [focusedDate]);

  const specialMap = new Map(specialDays.map(s => [s.date, s]));

  return (
    <div>
      <div className="grid grid-cols-7 mb-1">
        {WEEKDAYS.map(wd => (
          <div key={wd} className="text-center text-xs font-medium py-1" style={{ color: 'var(--color-text-secondary)' }}>
            {wd}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {days.map(dateStr => (
          <DayCard
            key={dateStr}
            dateStr={dateStr}
            isOtherMonth={!isCurrentMonth(dateStr, focusedDate)}
            specialDay={specialMap.get(dateStr) || null}
            onMarkSpecial={() => setMarkingDate(dateStr)}
          />
        ))}
      </div>
      {markingDate && (
        <SpecialDayForm
          date={markingDate}
          onClose={() => setMarkingDate(null)}
          existing={specialMap.get(markingDate) || null}
        />
      )}
    </div>
  );
}
