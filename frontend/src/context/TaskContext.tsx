import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { Task, TaskCreate, TaskUpdate, Category } from '../types';
import * as api from '../api';

interface TaskState {
  tasks: Map<number, Task>;
  allTasks: Task[];
  poolTasks: Task[];
  calendarTasks: Map<string, Task[]>;
  categories: Category[];
  loading: boolean;
  refresh: () => Promise<void>;
  createTask: (t: TaskCreate) => Promise<Task>;
  updateTask: (id: number, u: TaskUpdate) => Promise<Task>;
  deleteTask: (id: number) => Promise<void>;
  scheduleTask: (id: number, date: string | null, time?: string | null) => Promise<Task>;
  copyTask: (id: number) => Promise<Task>;
  updateProgress: (id: number, pct?: number, completed?: boolean) => Promise<Task>;
  getTasksForDate: (date: string) => Task[];
}

const TaskContext = createContext<TaskState | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const tasks = new Map(allTasks.map(t => [t.id, t]));

  const poolTasks = allTasks.filter(
    t => t.pool_only || t.scheduled_date === null
  );

  const calendarTasks = new Map<string, Task[]>();
  for (const t of allTasks) {
    if (t.scheduled_date && !t.pool_only) {
      const arr = calendarTasks.get(t.scheduled_date) || [];
      arr.push(t);
      calendarTasks.set(t.scheduled_date, arr);
    }
  }

  const getTasksForDate = useCallback(
    (date: string) => calendarTasks.get(date) || [],
    [calendarTasks]
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [taskData, catData] = await Promise.all([
        api.fetchTasks(),
        api.fetchCategories(),
      ]);
      setAllTasks(taskData);
      setCategories(catData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (t: TaskCreate) => {
    const task = await api.createTask(t);
    setAllTasks(prev => [...prev, task]);
    return task;
  }, []);

  const updateTask = useCallback(async (id: number, u: TaskUpdate) => {
    const task = await api.updateTask(id, u);
    setAllTasks(prev => prev.map(t => t.id === id ? task : t));
    return task;
  }, []);

  const deleteTask = useCallback(async (id: number) => {
    await api.deleteTask(id);
    setAllTasks(prev => prev.filter(t => t.id !== id));
  }, []);

  const scheduleTask = useCallback(async (id: number, date: string | null, time?: string | null) => {
    const task = await api.scheduleTask(id, date, time);
    setAllTasks(prev => prev.map(t => t.id === id ? task : t));
    return task;
  }, []);

  const copyTask = useCallback(async (id: number) => {
    const task = await api.copyTask(id);
    setAllTasks(prev => [...prev, task]);
    return task;
  }, []);

  const updateProgress = useCallback(async (id: number, pct?: number, completed?: boolean) => {
    const task = await api.updateTaskProgress(id, pct, completed);
    setAllTasks(prev => prev.map(t => t.id === id ? task : t));
    return task;
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const value: TaskState = {
    tasks, allTasks, poolTasks, calendarTasks, categories, loading,
    refresh, createTask, updateTask, deleteTask, scheduleTask, copyTask, updateProgress,
    getTasksForDate,
  };

  return <TaskContext.Provider value={value}>{children}</TaskContext.Provider>;
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}
