import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { ViewMode, ThemeName } from '../types';

interface AppState {
  viewMode: ViewMode;
  focusedDate: string;
  theme: ThemeName;
  darkMode: boolean;
  dashboardOpen: boolean;
  setViewMode: (m: ViewMode) => void;
  setFocusedDate: (d: string) => void;
  setTheme: (t: ThemeName) => void;
  toggleDarkMode: () => void;
  toggleDashboard: () => void;
  navigateMonth: (dir: -1 | 1) => void;
  navigateWeek: (dir: -1 | 1) => void;
}

const AppContext = createContext<AppState | null>(null);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [focusedDate, setFocusedDate] = useState(todayStr());
  const [theme, setTheme] = useState<ThemeName>(() =>
    (localStorage.getItem('theme') as ThemeName) || 'blueWhite'
  );
  const [darkMode, setDarkMode] = useState(() =>
    localStorage.getItem('darkMode') === 'true'
  );
  const [dashboardOpen, setDashboardOpen] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', String(next));
      return next;
    });
  }, []);

  const toggleDashboard = useCallback(() => setDashboardOpen(prev => !prev), []);

  const navigateMonth = useCallback((dir: -1 | 1) => {
    setFocusedDate(prev => {
      const d = new Date(prev);
      d.setMonth(d.getMonth() + dir);
      return d.toISOString().slice(0, 10);
    });
  }, []);

  const navigateWeek = useCallback((dir: -1 | 1) => {
    setFocusedDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir * 7);
      return d.toISOString().slice(0, 10);
    });
  }, []);

  // Apply theme + dark mode to document
  const applyTheme = useCallback((t: ThemeName, dark: boolean) => {
    document.documentElement.setAttribute('data-theme', t);
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', t);
  }, []);

  const handleSetTheme = useCallback((t: ThemeName) => {
    setTheme(t);
    applyTheme(t, darkMode);
  }, [darkMode, applyTheme]);

  // Apply on mount and on change
  useState(() => { applyTheme(theme, darkMode); });

  const value: AppState = {
    viewMode, focusedDate, theme, darkMode, dashboardOpen,
    setViewMode, setFocusedDate, setTheme: handleSetTheme, toggleDarkMode,
    toggleDashboard, navigateMonth, navigateWeek,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
