export * from './task';
export * from './specialDay';

export interface TimeRecord {
  id: number;
  task_id: number;
  date: string;
  start_time: string;
  end_time: string | null;
  duration_minutes: number;
  source: 'timer' | 'manual';
}

export interface DailyMemo {
  id: number;
  date: string;
  content: string;
}

export interface DashboardSummary {
  weekly_completion_rate: number;
  monthly_completion_rate: number;
  total_tasks_week: number;
  completed_tasks_week: number;
  total_tasks_month: number;
  completed_tasks_month: number;
}

export interface DailyHoursItem { date: string; hours: number; }
export interface HeatmapItem { date: string; rate: number; }
export interface MigrationTrendItem { date: string; count: number; }

export type ViewMode = 'month' | 'week' | 'dayDetail';
export type ThemeName = 'blueWhite' | 'warmPaper' | 'greenNature';

export interface DragPayload {
  taskId: number;
  source: 'pool' | 'calendar' | 'timeline';
  sourceDate?: string;
  action: 'move' | 'copy';
}
