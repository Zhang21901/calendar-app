import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import * as api from '../../api';
import type { SpecialDayType, SpecialDay } from '../../types';

const TYPE_OPTIONS: { value: SpecialDayType; label: string; icon: string; defaultColor: string }[] = [
  { value: 'hard_deadline', label: '硬性截止日', icon: '⚠️', defaultColor: '#ef4444' },
  { value: 'milestone', label: '里程碑', icon: '🚩', defaultColor: '#f59e0b' },
  { value: 'rest_day', label: '休息日', icon: '🏖️', defaultColor: '#8b5cf6' },
  { value: 'custom', label: '自定义', icon: '📌', defaultColor: '#3b82f6' },
];

interface Props {
  date: string;
  onClose: () => void;
  existing?: SpecialDay | null;
}

export function SpecialDayForm({ date, onClose, existing }: Props) {
  const [type, setType] = useState<SpecialDayType>(existing?.type || 'milestone');
  const [label, setLabel] = useState(existing?.label || '');
  const [color, setColor] = useState(existing?.color || '#f59e0b');
  const [icon, setIcon] = useState(existing?.icon || '🚩');
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleTypeChange = (t: SpecialDayType) => {
    setType(t);
    const opt = TYPE_OPTIONS.find(o => o.value === t);
    if (opt) {
      setColor(opt.defaultColor);
      setIcon(opt.icon);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!label.trim()) return;
    setLoading(true);
    try {
      await api.createSpecialDay({ date, type, label: label.trim(), color, icon });
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!existing || !confirm(`确定移除 ${date} 的特殊日标记「${existing.label}」？`)) return;
    setDeleting(true);
    try {
      await api.deleteSpecialDay(existing.id);
      window.location.reload();
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="rounded-xl shadow-2xl w-full max-w-sm p-5" style={{ background: 'var(--color-bg-secondary)' }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
            {existing ? '编辑特殊日' : '标记特殊日'} · {date}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-4 gap-1.5">
            {TYPE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleTypeChange(opt.value)}
                className={`p-2 rounded-lg text-center text-xs border transition-all ${
                  type === opt.value ? 'ring-2' : ''
                }`}
                style={{
                  borderColor: type === opt.value ? opt.defaultColor : 'var(--color-border)',
                  background: type === opt.value ? opt.defaultColor + '15' : 'var(--color-bg-primary)',
                }}
              >
                <div className="text-lg">{opt.icon}</div>
                <div style={{ color: 'var(--color-text-primary)' }}>{opt.label}</div>
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="标签文字"
            value={label}
            onChange={e => setLabel(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
            required
          />
          <div className="flex gap-2">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-10 h-10 rounded cursor-pointer" />
            <input
              type="text"
              placeholder="图标 (emoji)"
              value={icon}
              onChange={e => setIcon(e.target.value)}
              maxLength={2}
              className="flex-1 px-3 py-2 rounded-lg border text-sm"
              style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
              style={{ background: color }}
            >
              {loading ? '保存中...' : existing ? '更新' : '标记特殊日'}
            </button>
            {existing && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors disabled:opacity-50"
                style={{ background: 'var(--color-danger)' }}
                title="移除特殊日标记"
              >
                {deleting ? '...' : <Trash2 size={16} />}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
