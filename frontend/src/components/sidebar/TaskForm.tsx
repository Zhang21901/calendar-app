import { useState } from 'react';
import { useTasks } from '../../context';
import type { Category, Task } from '../../types';
import { X } from 'lucide-react';

interface Props {
  onClose: () => void;
  categories: Category[];
  initialDate?: string;
  task?: Task;
}

export function TaskForm({ onClose, categories, initialDate, task }: Props) {
  const { createTask, updateTask } = useTasks();
  const isEdit = !!task;

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(task?.estimated_minutes || 0);
  const [priority, setPriority] = useState(task?.priority || 'P2');
  const [selectedCats, setSelectedCats] = useState<number[]>(
    task?.categories.map(c => c.id) || []
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEdit) {
      await updateTask(task.id, {
        title: title.trim(),
        description: description.trim(),
        estimated_minutes: estimatedMinutes,
        priority,
        category_ids: selectedCats,
      });
    } else {
      await createTask({
        title: title.trim(),
        description: description.trim(),
        estimated_minutes: estimatedMinutes,
        priority,
        pool_only: !initialDate,
        scheduled_date: initialDate || null,
        category_ids: selectedCats,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className="rounded-xl shadow-2xl w-full max-w-md p-5"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {isEdit ? '编辑任务' : initialDate ? `添加任务到 ${initialDate}` : '新建任务'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            placeholder="任务标题 *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
            autoFocus
            required
          />

          <textarea
            placeholder="描述（可选）"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm resize-none h-20"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
          />

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>预估时间 (分钟)</label>
              <input
                type="number"
                min={0}
                value={estimatedMinutes}
                onChange={e => setEstimatedMinutes(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border text-sm mt-1"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
              />
            </div>
            <div className="flex-1">
              <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>优先级</label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as typeof priority)}
                className="w-full px-3 py-2 rounded-lg border text-sm mt-1"
                style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
              >
                <option value="P0">P0 - 紧急重要</option>
                <option value="P1">P1 - 重要</option>
                <option value="P2">P2 - 常规</option>
                <option value="P3">P3 - 可推迟</option>
              </select>
            </div>
          </div>

          {categories.length > 0 && (
            <div>
              <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>分类标签</label>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCats(prev =>
                      prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                    )}
                    className="px-2 py-1 rounded-full text-xs text-white transition-opacity"
                    style={{ background: cat.color, opacity: selectedCats.includes(cat.id) ? 1 : 0.4 }}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 rounded-lg text-sm font-medium text-white transition-colors"
            style={{ background: 'var(--color-accent)' }}
          >
            {isEdit ? '保存修改' : '创建任务'}
          </button>
        </form>
      </div>
    </div>
  );
}
