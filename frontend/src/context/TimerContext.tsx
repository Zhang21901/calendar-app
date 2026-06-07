import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import * as api from '../api';

interface ActiveTimer {
  taskId: number;
  recordId: number;
  startTime: number;
  taskTitle: string;
}

interface TimerState {
  activeTimer: ActiveTimer | null;
  elapsedSeconds: number;
  startTimer: (taskId: number, taskTitle: string) => Promise<void>;
  stopTimer: () => Promise<number>;
}

const TimerContext = createContext<TimerState | null>(null);

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(() => {
    const saved = localStorage.getItem('active_timer');
    return saved ? JSON.parse(saved) : null;
  });
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Recover timer on mount
  useEffect(() => {
    if (activeTimer) {
      const elapsed = Math.floor((Date.now() - activeTimer.startTime) / 1000);
      setElapsedSeconds(elapsed);
      intervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const startTimer = useCallback(async (taskId: number, taskTitle: string) => {
    if (activeTimer) {
      await stopTimerInternal();
    }
    const record = await api.startTimer(taskId, todayStr());
    const timer: ActiveTimer = {
      taskId,
      recordId: record.id,
      startTime: Date.now(),
      taskTitle,
    };
    setActiveTimer(timer);
    setElapsedSeconds(0);
    localStorage.setItem('active_timer', JSON.stringify(timer));
    intervalRef.current = setInterval(() => {
      setElapsedSeconds(prev => prev + 1);
    }, 1000);
  }, [activeTimer]);

  const stopTimerInternal = useCallback(async (): Promise<number> => {
    if (!activeTimer) return 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    const record = await api.stopTimer(activeTimer.recordId);
    localStorage.removeItem('active_timer');
    setActiveTimer(null);
    setElapsedSeconds(0);
    return record.duration_minutes;
  }, [activeTimer]);

  const stopTimer = useCallback(async () => {
    return stopTimerInternal();
  }, [stopTimerInternal]);

  const value: TimerState = { activeTimer, elapsedSeconds, startTimer, stopTimer };

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const ctx = useContext(TimerContext);
  if (!ctx) throw new Error('useTimer must be used within TimerProvider');
  return ctx;
}
