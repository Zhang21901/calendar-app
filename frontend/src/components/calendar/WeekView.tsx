import { useApp } from '../../context';
import { getWeekDays, dayOfWeek, formatShort } from '../../utils/dateUtils';
import { DayCard } from './DayCard';

export function WeekView() {
  const { focusedDate } = useApp();
  const days = getWeekDays(focusedDate);

  return (
    <div>
      <div className="grid grid-cols-7 gap-2">
        {days.map(dateStr => (
          <div key={dateStr} className="text-center">
            <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
              {dayOfWeek(dateStr)}
            </div>
            <div className="text-sm font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>
              {formatShort(dateStr)}
            </div>
            <DayCard dateStr={dateStr} isWeekView />
          </div>
        ))}
      </div>
    </div>
  );
}
