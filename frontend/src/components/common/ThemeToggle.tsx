import { useApp } from '../../context';
import type { ThemeName } from '../../types';
import { Sun, Moon } from 'lucide-react';

const THEMES: { key: ThemeName; label: string; color: string }[] = [
  { key: 'blueWhite', label: '蓝白', color: '#6366f1' },
  { key: 'warmPaper', label: '暖黄', color: '#d97706' },
  { key: 'greenNature', label: '绿植', color: '#16a34a' },
];

export function ThemeToggle() {
  const { theme, darkMode, setTheme, toggleDarkMode } = useApp();

  return (
    <div className="flex items-center gap-2 px-2 py-2">
      <div className="flex gap-1">
        {THEMES.map(t => (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            className="w-6 h-6 rounded-full border-2 transition-all"
            style={{
              background: t.color,
              borderColor: theme === t.key ? 'var(--color-text-primary)' : 'transparent',
              transform: theme === t.key ? 'scale(1.15)' : 'scale(1)',
            }}
            title={t.label}
          />
        ))}
      </div>
      <button
        onClick={toggleDarkMode}
        className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title={darkMode ? '切换到亮色模式' : '切换到暗色模式'}
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {darkMode ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </div>
  );
}
