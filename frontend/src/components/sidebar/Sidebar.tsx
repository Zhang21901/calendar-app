import { useState } from 'react';
import { useApp, useTasks } from '../../context';
import { TaskPool } from './TaskPool';
import { TaskForm } from './TaskForm';
import { ThemeToggle } from '../common/ThemeToggle';
import { Plus, BarChart3, Sparkles } from 'lucide-react';
import { NLPInputModal } from '../llm/NLPInputModal';

export function Sidebar() {
  const { toggleDashboard } = useApp();
  const { poolTasks, categories } = useTasks();
  const [showForm, setShowForm] = useState(false);
  const [showNLP, setShowNLP] = useState(false);

  return (
    <aside
      className="flex flex-col h-full border-r"
      style={{
        width: 300,
        minWidth: 300,
        background: 'var(--color-bg-sidebar)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Header */}
      <div className="p-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            📅 日历本
          </h1>
          <div className="flex gap-1">
            <button
              onClick={() => setShowNLP(true)}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="AI 输入"
              style={{ color: 'var(--color-accent)' }}
            >
              <Sparkles size={16} />
            </button>
            <button
              onClick={toggleDashboard}
              className="p-1.5 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              title="数据中心"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <BarChart3 size={16} />
            </button>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-accent)',
            color: '#fff',
          }}
        >
          <Plus size={16} />
          新建任务
        </button>
      </div>

      {/* Stats */}
      <div className="px-3 py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        任务池 · {poolTasks.length} 个待分配
      </div>

      {/* Task Pool */}
      <div className="flex-1 overflow-y-auto px-2">
        <TaskPool />
      </div>

      {/* Theme Toggle at bottom */}
      <div className="border-t" style={{ borderColor: 'var(--color-border)' }}>
        <ThemeToggle />
      </div>

      {/* Modals */}
      {showForm && <TaskForm onClose={() => setShowForm(false)} categories={categories} />}
      {showNLP && <NLPInputModal onClose={() => setShowNLP(false)} />}
    </aside>
  );
}
