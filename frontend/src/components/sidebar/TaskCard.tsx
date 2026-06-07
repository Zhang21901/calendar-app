import { useDraggable } from '@dnd-kit/core';
import type { Task } from '../../types';
import { useTasks } from '../../context';
import { PriorityBadge } from '../common/PriorityBadge';
import { Clock, GripVertical, RotateCcw, Trash2 } from 'lucide-react';

export function TaskCard({ task }: { task: Task }) {
  const { deleteTask } = useTasks();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `task-${task.id}`,
    data: { taskId: task.id, source: 'pool' as const },
  });

  const style = transform ? {
    transform: `translate(${transform.x}px, ${transform.y}px)`,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`确定删除「${task.title}」？`)) {
      await deleteTask(task.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-2 mb-1.5 rounded-lg border hover:shadow-md transition-shadow group"
    >
      <div className="flex items-start gap-1.5">
        <button
          className="mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 rounded hover:bg-black/5 dark:hover:bg-white/10"
          style={{ color: 'var(--color-text-secondary)' }}
          {...attributes}
          {...listeners}
        >
          <GripVertical size={14} />
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <PriorityBadge priority={task.priority} />
            <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>
              {task.title}
            </span>
            <button
              onClick={handleDelete}
              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900 flex-shrink-0"
              style={{ color: 'var(--color-danger)' }}
              title="删除任务"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {task.estimated_minutes > 0 && (
              <span className="flex items-center gap-0.5">
                <Clock size={10} /> {task.estimated_minutes}min
              </span>
            )}
            {task.migration_count > 0 && (
              <span className="flex items-center gap-0.5" style={{ color: 'var(--color-warning)' }}>
                <RotateCcw size={10} /> {task.migration_count}
              </span>
            )}
            {task.categories.map(cat => (
              <span key={cat.id} className="px-1 rounded text-white text-[10px]" style={{ background: cat.color }}>
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
