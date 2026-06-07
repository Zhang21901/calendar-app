import { api } from './client';
import type { DashboardSummary, DailyHoursItem, HeatmapItem, MigrationTrendItem } from '../types';

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const { data } = await api.get('/dashboard/summary');
  return data;
}

export async function fetchDailyHours(start_date: string, end_date: string): Promise<DailyHoursItem[]> {
  const { data } = await api.get('/dashboard/daily-hours', { params: { start_date, end_date } });
  return data.data;
}

export async function fetchCompletionHeatmap(start_date: string, end_date: string): Promise<HeatmapItem[]> {
  const { data } = await api.get('/dashboard/completion-heatmap', { params: { start_date, end_date } });
  return data.data;
}

export async function fetchMigrationTrend(start_date: string, end_date: string): Promise<MigrationTrendItem[]> {
  const { data } = await api.get('/dashboard/migration-trend', { params: { start_date, end_date } });
  return data.data;
}
