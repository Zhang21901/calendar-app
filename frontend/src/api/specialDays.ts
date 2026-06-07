import { api } from './client';
import type { SpecialDay, SpecialDayCreate } from '../types';

export async function fetchSpecialDays(start_date: string, end_date: string): Promise<SpecialDay[]> {
  const { data } = await api.get('/special-days', { params: { start_date, end_date } });
  return data;
}

export async function fetchTodaySpecialDay(): Promise<SpecialDay | null> {
  const { data } = await api.get('/special-days/today');
  return data;
}

export async function createSpecialDay(sd: SpecialDayCreate): Promise<SpecialDay> {
  const { data } = await api.post('/special-days', sd);
  return data;
}

export async function deleteSpecialDay(id: number): Promise<void> {
  await api.delete(`/special-days/${id}`);
}
