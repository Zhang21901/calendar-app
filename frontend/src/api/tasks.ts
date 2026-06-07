import { api } from './client';
import type { Task, TaskCreate, TaskUpdate } from '../types';

export async function fetchTasks(params?: Record<string, unknown>): Promise<Task[]> {
  const { data } = await api.get('/tasks', { params });
  return data;
}

export async function createTask(task: TaskCreate): Promise<Task> {
  const { data } = await api.post('/tasks', task);
  return data;
}

export async function updateTask(id: number, updates: TaskUpdate): Promise<Task> {
  const { data } = await api.put(`/tasks/${id}`, updates);
  return data;
}

export async function deleteTask(id: number): Promise<void> {
  await api.delete(`/tasks/${id}`);
}

export async function scheduleTask(id: number, scheduled_date: string | null, scheduled_time?: string | null): Promise<Task> {
  const { data } = await api.put(`/tasks/${id}/schedule`, { scheduled_date, scheduled_time });
  return data;
}

export async function updateTaskProgress(id: number, completion_pct?: number, is_completed?: boolean): Promise<Task> {
  const { data } = await api.put(`/tasks/${id}/progress`, { completion_pct, is_completed });
  return data;
}

export async function copyTask(id: number): Promise<Task> {
  const { data } = await api.post(`/tasks/${id}/copy`);
  return data;
}

export async function batchCreateTasks(tasks: TaskCreate[]): Promise<Task[]> {
  const { data } = await api.post('/tasks/batch', { tasks });
  return data;
}
