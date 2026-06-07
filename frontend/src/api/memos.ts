import { api } from './client';
import type { DailyMemo } from '../types';

export async function fetchMemos(date: string): Promise<DailyMemo> {
  const { data } = await api.get(`/memos/${date}`);
  return data;
}

export async function upsertMemo(date: string, content: string): Promise<DailyMemo> {
  const { data } = await api.put(`/memos/${date}`, { content });
  return data;
}
