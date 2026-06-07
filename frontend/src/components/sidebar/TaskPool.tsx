import { useDroppable } from '@dnd-kit/core';
import { useTasks } from '../../context';
import { TaskCard } from './TaskCard';

export function TaskPool() {
  const { poolTasks } = useTasks();
  const { setNodeRef, isOver } = useDroppable({ id: 'pool' });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] rounded-lg transition-all p-1 ${
        isOver ? 'drop-target-active' : ''
      }`}
    >
      {poolTasks.length === 0 ? (
        <div className="text-center py-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          任务池为空
          <br />
          点击「新建任务」或拖拽日历中的任务到这里
        </div>
      ) : (
        poolTasks.map(task => (
          <TaskCard key={task.id} task={task} />
        ))
      )}
    </div>
  );
}
