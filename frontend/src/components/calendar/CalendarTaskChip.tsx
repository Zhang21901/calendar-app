import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../../types';

interface Props {
  task: Task;
  dateStr: string;
}

export function CalendarTaskChip({ task, dateStr }: Props) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `cal-task-${task.id}`,
    data: { taskId: task.id, source: 'calendar' as const, sourceDate: dateStr },
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.3 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1 cursor-grab active:cursor-grabbing ${
        task.is_completed ? 'line-through opacity-50' : ''
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
        task.is_completed ? 'bg-green-500' : task.status === 'in_progress' ? 'bg-yellow-500' : 'bg-gray-400'
      }`} />
      {task.title}
    </div>
  );
}
