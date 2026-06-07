import { api } from './client';
import type { Category } from '../types';

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await api.get('/categories');
  return data;
}
