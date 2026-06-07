import { api } from './client';

export interface NLPParseResult {
  title: string;
  description: string;
  estimated_minutes: number;
  priority: string;
  hard_deadline: string | null;
  scheduled_date: string | null;
  scheduled_time: string | null;
  category_names: string[];
}

export interface AgentActionResult {
  tool: string;
  args: Record<string, unknown>;
  result: Record<string, unknown>;
}

export interface AgentResponse {
  message: string;
  actions: AgentActionResult[];
}

export async function parseNLP(text: string): Promise<NLPParseResult> {
  const { data } = await api.post('/llm/parse-task', { text });
  return data;
}

export async function runAgent(text: string): Promise<AgentResponse> {
  const { data } = await api.post('/llm/agent', { text });
  return data;
}

export async function suggestPlan(date: string, pool_json: string, scheduled_json: string, special_json: string) {
  const { data } = await api.post('/llm/suggest-plan', {
    date, pool_tasks_json: pool_json, scheduled_tasks_json: scheduled_json, special_day_json: special_json,
  });
  return data;
}

export async function breakdownTask(goal: string, deadline: string | null) {
  const { data } = await api.post('/llm/breakdown', { goal, deadline });
  return data;
}

export async function smartSchedule(poolTaskIds: number[], start_date: string, end_date: string) {
  const { data } = await api.post('/llm/smart-schedule', {
    pool_task_ids: poolTaskIds, start_date, end_date,
  });
  return data;
}

export async function weeklySummary(start_date: string, end_date: string, tasks_json: string) {
  const { data } = await api.post('/llm/weekly-summary', {
    start_date, end_date, tasks_json,
  });
  return data;
}
