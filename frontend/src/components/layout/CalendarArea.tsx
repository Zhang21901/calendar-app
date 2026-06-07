import { useApp } from '../../context';
import { CalendarHeader } from '../calendar/CalendarHeader';
import { MonthView } from '../calendar/MonthView';
import { WeekView } from '../calendar/WeekView';

export function CalendarArea() {
  const { viewMode } = useApp();

  return (
    <div className="flex flex-col h-full p-3">
      <CalendarHeader />
      <div className="flex-1 overflow-auto mt-2">
        {viewMode === 'month' ? <MonthView /> : <WeekView />}
      </div>
    </div>
  );
}
