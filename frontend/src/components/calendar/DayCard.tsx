import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { useApp, useTasks } from '../../context';
import { isToday } from '../../utils/dateUtils';
import { Star, Plus } from 'lucide-react';
import { TaskForm } from '../sidebar/TaskForm';
import { CalendarTaskChip } from './CalendarTaskChip';
import type { SpecialDay } from '../../types';

interface Props {
  dateStr: string;
  isOtherMonth?: boolean;
  isWeekView?: boolean;
  specialDay?: SpecialDay | null;
  onMarkSpecial?: () => void;
}

export function DayCard({ dateStr, isOtherMonth, isWeekView, specialDay, onMarkSpecial }: Props) {
  const { setViewMode, setFocusedDate } = useApp();
  const { getTasksForDate, categories } = useTasks();
  const { setNodeRef, isOver } = useDroppable({ id: `day:${dateStr}` });
  const [showForm, setShowForm] = useState(false);

  const tasks = getTasksForDate(dateStr);
  const today = isToday(dateStr);
  const d = new Date(dateStr);
  const dayNum = d.getDate();

  const handleClick = () => {
    setFocusedDate(dateStr);
    setViewMode('dayDetail');
  };

  const completionPct = tasks.length > 0
    ? Math.round(tasks.filter(t => t.is_completed).length / tasks.length * 100)
    : 0;

  const maxTasks = isWeekView ? 8 : 3;

  return (
    <>
      <div
        ref={setNodeRef}
        onClick={handleClick}
        className={`
          sticky-note cursor-pointer p-1.5 min-h-[80px] relative group
          ${isWeekView ? 'min-h-[120px] p-3' : ''}
          ${isOver ? 'drop-target-active' : ''}
          ${isOtherMonth ? 'opacity-40' : ''}
          ${today ? 'ring-2' : ''}
        `}
        style={{
          ...(today ? { ringColor: 'var(--color-accent)' } : {}),
          ...(specialDay ? {
            boxShadow: `0 0 12px ${specialDay.color}4d, 2px 2px 6px var(--color-paper-shadow)`,
          } as React.CSSProperties : {}),
        }}
      >
        {/* Day number + actions */}
        <div className="flex items-center justify-between mb-1">
          <span
            className={`text-xs font-bold ${today ? 'px-1.5 py-0.5 rounded-full text-white' : ''}`}
            style={today ? { background: 'var(--color-accent)' } : { color: 'var(--color-text-secondary)' }}
          >
            {dayNum}
          </span>
          <div className="flex items-center gap-0.5">
            {specialDay?.icon && <span className="text-xs">{specialDay.icon}</span>}
            {/* Quick-add button */}
            <button
              onClick={e => { e.stopPropagation(); setShowForm(true); }}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
              title="添加任务到这一天"
            >
              <Plus size={11} style={{ color: 'var(--color-accent)' }} />
            </button>
            {onMarkSpecial && (
              <button
                onClick={e => { e.stopPropagation(); onMarkSpecial(); }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
                title="标记为特殊日"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Star size={10} />
              </button>
            )}
          </div>
        </div>

        {/* Special day label */}
        {specialDay?.label && (
          <div
            className="text-[10px] px-1 py-0.5 rounded mb-1 truncate text-white"
            style={{ background: specialDay.color }}
          >
            {specialDay.label}
          </div>
        )}

        {/* Tasks (draggable chips) */}
        <div className="space-y-0.5">
          {tasks.slice(0, maxTasks).map(task => (
            <CalendarTaskChip key={task.id} task={task} dateStr={dateStr} />
          ))}
          {tasks.length > maxTasks && (
            <div className="text-[10px] px-1" style={{ color: 'var(--color-text-secondary)' }}>
              +{tasks.length - maxTasks} 更多
            </div>
          )}
        </div>

        {/* Completion indicator */}
        {tasks.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1.5 rounded-b-lg overflow-hidden flex">
            <div
              className="h-full transition-all"
              style={{
                width: `${completionPct}%`,
                background: completionPct === 100 ? 'var(--color-success)' : completionPct >= 50 ? 'var(--color-warning)' : 'var(--color-danger)',
              }}
            />
            <div className="h-full flex-1" style={{ background: 'var(--color-border)' }} />
          </div>
        )}
      </div>

      {showForm && <TaskForm onClose={() => setShowForm(false)} categories={categories} initialDate={dateStr} />}
    </>
  );
}
