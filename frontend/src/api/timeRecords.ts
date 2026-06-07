import { api } from './client';
import type { TimeRecord } from '../types';

export async function startTimer(taskId: number, date: string): Promise<TimeRecord> {
  const { data } = await api.post('/time-records', { task_id: taskId, date });
  return data;
}

export async function stopTimer(recordId: number): Promise<TimeRecord> {
  const { data } = await api.put(`/time-records/${recordId}/stop`);
  return data;
}
