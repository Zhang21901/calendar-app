import { useApp } from '../../context';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate } from '../../utils/dateUtils';

export function CalendarHeader() {
  const { viewMode, setViewMode, focusedDate, navigateMonth, navigateWeek } = useApp();

  const handlePrev = () => {
    if (viewMode === 'month') navigateMonth(-1);
    else navigateWeek(-1);
  };

  const handleNext = () => {
    if (viewMode === 'month') navigateMonth(1);
    else navigateWeek(1);
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <button
          onClick={handlePrev}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
          {formatDate(focusedDate)}
        </h2>
        <button
          onClick={handleNext}
          className="p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--color-border)' }}>
        <button
          onClick={() => setViewMode('month')}
          className="px-3 py-1 text-sm font-medium transition-colors"
          style={{
            background: viewMode === 'month' ? 'var(--color-accent)' : 'transparent',
            color: viewMode === 'month' ? '#fff' : 'var(--color-text-secondary)',
          }}
        >
          月
        </button>
        <button
          onClick={() => setViewMode('week')}
          className="px-3 py-1 text-sm font-medium transition-colors"
          style={{
            background: viewMode === 'week' ? 'var(--color-accent)' : 'transparent',
            color: viewMode === 'week' ? '#fff' : 'var(--color-text-secondary)',
          }}
        >
          周
        </button>
      </div>
    </div>
  );
}
