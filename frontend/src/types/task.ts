export interface Category {
  id: number;
  name: string;
  color: string;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  estimated_minutes: number;
  actual_minutes: number;
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  status: 'pending' | 'in_progress' | 'completed';
  completion_pct: number;
  is_completed: boolean;
  hard_deadline: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  pool_only: boolean;
  migration_count: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  categories: Category[];
}

export interface TaskCreate {
  title: string;
  description?: string;
  estimated_minutes?: number;
  priority?: string;
  hard_deadline?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  pool_only?: boolean;
  category_ids?: number[];
}

export interface TaskUpdate {
  title?: string;
  description?: string;
  estimated_minutes?: number;
  actual_minutes?: number;
  priority?: string;
  status?: string;
  completion_pct?: number;
  is_completed?: boolean;
  hard_deadline?: string | null;
  scheduled_date?: string | null;
  scheduled_time?: string | null;
  pool_only?: boolean;
  migration_count?: number;
  sort_order?: number;
  category_ids?: number[];
}

export interface TaskBrief {
  id: number;
  title: string;
  priority: string;
  status: string;
  completion_pct: number;
  is_completed: boolean;
  scheduled_time: string | null;
  categories: Category[];
}
