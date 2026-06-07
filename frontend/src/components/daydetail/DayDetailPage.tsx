import { useState, useEffect, useCallback } from 'react';
import { useApp, useTasks, useTimer } from '../../context';
import { ArrowLeft, Clock, CheckCircle2, Circle, Trash2, Pencil } from 'lucide-react';
import { formatDate, formatTimer, todayStr } from '../../utils/dateUtils';
import { ProgressSlider } from '../common/ProgressSlider';
import { PriorityBadge } from '../common/PriorityBadge';
import { TaskTimer } from './TaskTimer';
import { TaskForm } from '../sidebar/TaskForm';
import type { Task } from '../../types';
import * as api from '../../api';

export function DayDetailPage() {
  const { focusedDate, setViewMode } = useApp();
  const { getTasksForDate, updateTask, updateProgress, deleteTask, refresh, categories } = useTasks();
  const { activeTimer, elapsedSeconds } = useTimer();

  const tasks = getTasksForDate(focusedDate);
  const [memoContent, setMemoContent] = useState('');
  const [memoLoading, setMemoLoading] = useState(true);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Load memo
  useEffect(() => {
    setMemoLoading(true);
    api.fetchMemos(focusedDate)
      .then(m => setMemoContent(m.content || ''))
      .catch(() => setMemoContent(''))
      .finally(() => setMemoLoading(false));
  }, [focusedDate]);

  // Debounced memo save
  useEffect(() => {
    if (memoLoading) return;
    const timer = setTimeout(() => {
      api.upsertMemo(focusedDate, memoContent).catch(console.error);
    }, 800);
    return () => clearTimeout(timer);
  }, [memoContent, focusedDate, memoLoading]);

  const handleToggleComplete = useCallback(async (taskId: number, current: boolean) => {
    await updateProgress(taskId, current ? 0 : 100, !current);
    await refresh();
  }, [updateProgress, refresh]);

  const handleProgressChange = useCallback(async (taskId: number, pct: number) => {
    await updateProgress(taskId, pct, pct >= 100);
  }, [updateProgress]);

  const totalEst = tasks.reduce((sum, t) => sum + t.estimated_minutes, 0);
  const totalActual = tasks.reduce((sum, t) => sum + t.actual_minutes, 0);
  const completed = tasks.filter(t => t.is_completed).length;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setViewMode('month')}
            className="flex items-center gap-1 text-sm hover:underline"
            style={{ color: 'var(--color-accent)' }}
          >
            <ArrowLeft size={16} /> 返回
          </button>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {formatDate(focusedDate)}
          </h1>
          {focusedDate === todayStr() && (
            <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ background: 'var(--color-accent)' }}>
              今天
            </span>
          )}
        </div>
        <div className="flex items-center gap-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {tasks.length > 0 && (
            <>
              <span>{completed}/{tasks.length} 已完成</span>
              <span className="flex items-center gap-1">
                <Clock size={14} /> {totalActual}min / {totalEst}min
              </span>
            </>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left: Timeline */}
        <div className="w-48 border-r overflow-y-auto p-2" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>时间轴</h3>
          {Array.from({ length: 24 }, (_, i) => {
            const hour = String(i).padStart(2, '0');
            const timeSlot = `${hour}:00`;
            const tasksAtTime = tasks.filter(t => t.scheduled_time?.startsWith(hour));

            return (
              <div key={hour} className="timeline-hour">
                <span className="timeline-hour-label">{hour}:00</span>
                {tasksAtTime.map(task => (
                  <div
                    key={task.id}
                    className="ml-8 p-1 rounded text-xs mb-0.5 truncate"
                    style={{
                      background: task.categories[0]?.color + '30' || 'var(--color-accent)',
                      color: 'var(--color-text-primary)',
                      borderLeft: `3px solid ${task.categories[0]?.color || 'var(--color-accent)'}`,
                    }}
                  >
                    {task.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Center: Task List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
            任务列表
          </h3>

          {tasks.length === 0 ? (
            <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
              <p className="text-lg mb-2">📋</p>
              <p className="text-sm">当天没有安排任务</p>
              <p className="text-xs mt-1">从左侧任务池拖拽任务到日历中</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className={`p-3 rounded-lg border transition-all group ${
                    task.is_completed ? 'opacity-60' : ''
                  }`}
                  style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}
                >
                  <div className="flex items-start gap-2">
                    {/* Complete checkbox */}
                    <button
                      onClick={() => handleToggleComplete(task.id, task.is_completed)}
                      className="mt-0.5 flex-shrink-0"
                    >
                      {task.is_completed ? (
                        <CheckCircle2 size={20} style={{ color: 'var(--color-success)' }} />
                      ) : (
                        <Circle size={20} style={{ color: 'var(--color-text-secondary)' }} />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <PriorityBadge priority={task.priority} />
                        <span
                          className={`font-medium text-sm ${task.is_completed ? 'line-through' : ''}`}
                          style={{ color: 'var(--color-text-primary)' }}
                        >
                          {task.title}
                        </span>
                        {task.migration_count > 0 && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400">
                            拖延 {task.migration_count} 次
                          </span>
                        )}
                        <button
                          onClick={e => { e.stopPropagation(); setEditingTask(task); }}
                          className="ml-auto p-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-700 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          style={{ color: 'var(--color-text-secondary)' }}
                          title="编辑任务"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(`确定删除「${task.title}」？`)) { await deleteTask(task.id); await refresh(); }
                          }}
                          className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-900 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          style={{ color: 'var(--color-danger)' }}
                          title="删除任务"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {task.description && (
                        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {task.scheduled_time && (
                          <span>⏰ {task.scheduled_time.slice(0, 5)}</span>
                        )}
                        <span>预估 {task.estimated_minutes}min</span>
                        <span>实际 {task.actual_minutes}min</span>
                        {task.hard_deadline && (
                          <span style={{ color: 'var(--color-danger)' }}>
                            ⚠️ 截止 {task.hard_deadline}
                          </span>
                        )}
                      </div>

                      {/* Category tags */}
                      <div className="flex gap-1 mt-1.5">
                        {task.categories.map(cat => (
                          <span
                            key={cat.id}
                            className="text-[10px] px-1.5 py-0.5 rounded text-white"
                            style={{ background: cat.color }}
                          >
                            {cat.name}
                          </span>
                        ))}
                      </div>

                      {/* Progress + Timer row */}
                      <div className="flex items-center gap-4 mt-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="flex-1">
                          <ProgressSlider
                            value={task.completion_pct}
                            onChange={pct => handleProgressChange(task.id, pct)}
                          />
                        </div>
                        <TaskTimer taskId={task.id} taskTitle={task.title} />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Memo */}
        <div className="w-56 border-l p-3" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-xs font-semibold mb-2" style={{ color: 'var(--color-text-secondary)' }}>📝 备忘录</h3>
          <textarea
            value={memoContent}
            onChange={e => setMemoContent(e.target.value)}
            placeholder="随手记..."
            className="w-full h-[calc(100%-2rem)] resize-none rounded-lg p-2 text-sm border"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
      </div>

      {/* Floating timer bar */}
      {activeTimer && (
        <div
          className="fixed bottom-4 right-4 px-4 py-2 rounded-full shadow-lg flex items-center gap-3 animate-pulse"
          style={{ background: 'var(--color-danger)', color: '#fff' }}
        >
          <span className="text-sm font-medium">🔴 {activeTimer.taskTitle}</span>
          <span className="text-sm font-mono tabular-nums">{formatTimer(elapsedSeconds)}</span>
        </div>
      )}

      {/* Edit task modal */}
      {editingTask && (
        <TaskForm
          onClose={() => setEditingTask(null)}
          categories={categories}
          task={editingTask}
        />
      )}
    </div>
  );
}
