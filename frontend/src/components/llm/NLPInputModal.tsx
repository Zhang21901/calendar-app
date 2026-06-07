import { useState } from 'react';
import { X, Sparkles, Zap, RefreshCw } from 'lucide-react';
import { useTasks } from '../../context';
import { runAgent } from '../../api/llm';
import type { AgentResponse } from '../../api/llm';

interface Props {
  onClose: () => void;
}

const ACTION_LABELS: Record<string, string> = {
  list_tasks: '查询',
  create_task: '创建',
  update_task: '更新',
  delete_task: '删除',
  schedule_task: '排期',
  list_categories: '分类',
  create_special_day: '标记',
  delete_special_day: '移除',
  get_dashboard_summary: '统计',
};

export function NLPInputModal({ onClose }: Props) {
  const { refresh } = useTasks();
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResponse | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await runAgent(text);
      setResult(res);
      await refresh();
    } catch {
      setError('AI 执行失败，请检查 API 配置');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div
        className="rounded-xl shadow-2xl w-full max-w-lg p-5 max-h-[80vh] overflow-y-auto"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
            <Sparkles size={18} style={{ color: 'var(--color-accent)' }} />
            AI 助手
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          直接告诉我你想做什么，我会自动执行。
        </p>

        {/* Input */}
        <textarea
          placeholder={
            '创建任务：明天下午3点复习数据结构 2h P1\n' +
            '安排日程：把任务池里所有P0任务排到下周\n' +
            '标记完成：帮我把数据结构作业标成已完成\n' +
            '标记日期：这周五设为期末考试截止日\n' +
            '查询统计：这周完成率怎么样？'
          }
          value={text}
          onChange={e => setText(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm resize-none h-28 mb-3"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
          autoFocus
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />

        {error && (
          <div className="text-red-500 text-sm mb-3 p-2 rounded bg-red-50 dark:bg-red-950">{error}</div>
        )}

        {/* Result */}
        {result && (
          <div className="mb-3">
            <div className="text-sm p-3 rounded-lg mb-2" style={{ background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}>
              {result.message}
            </div>
            {result.actions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {result.actions.map((action, i) => (
                  <span
                    key={i}
                    className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                    style={{ background: 'var(--color-accent)', color: '#fff' }}
                  >
                    {ACTION_LABELS[action.tool] || action.tool}
                    {action.result?.title ? `: ${String(action.result.title).slice(0, 12)}` : ''}
                    {action.result?.deleted ? ' ✓' : ''}
                    {action.result?.created || action.result?.updated ? ' ✓' : ''}
                    {action.result?.scheduled ? ` → ${action.result.date}` : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={loading || !text.trim()}
            className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            style={{ background: 'var(--color-accent)' }}
          >
            {loading ? (
              <><RefreshCw size={14} className="animate-spin" /> 执行中...</>
            ) : (
              <><Zap size={14} /> 发送</>
            )}
          </button>

          {result && (
            <button
              onClick={() => { setResult(null); setText(''); }}
              className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
            >
              继续
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium border transition-colors"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
}
