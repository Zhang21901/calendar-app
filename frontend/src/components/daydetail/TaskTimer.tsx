import { useTimer } from '../../context';
import { formatTimer } from '../../utils/dateUtils';
import { Play, Square } from 'lucide-react';

interface Props {
  taskId: number;
  taskTitle: string;
}

export function TaskTimer({ taskId, taskTitle }: Props) {
  const { activeTimer, elapsedSeconds, startTimer, stopTimer } = useTimer();
  const isActive = activeTimer?.taskId === taskId;

  const handleToggle = async () => {
    if (isActive) {
      await stopTimer();
      window.location.reload(); // Refresh to show updated actual_minutes
    } else {
      await startTimer(taskId, taskTitle);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        className={`p-1.5 rounded-full transition-colors ${
          isActive ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white'
        }`}
        title={isActive ? '停止计时' : '开始计时'}
      >
        {isActive ? <Square size={12} /> : <Play size={12} />}
      </button>
      {isActive && (
        <span className="text-sm font-mono tabular-nums" style={{ color: 'var(--color-accent)' }}>
          {formatTimer(elapsedSeconds)}
        </span>
      )}
    </div>
  );
}
