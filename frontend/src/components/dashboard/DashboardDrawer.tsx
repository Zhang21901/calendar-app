import { useState, useEffect } from 'react';
import { useApp } from '../../context';
import { X, TrendingUp, Target, Clock, AlertTriangle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, RadialBarChart, RadialBar,
} from 'recharts';
import * as api from '../../api';
import type { DashboardSummary, DailyHoursItem, HeatmapItem, MigrationTrendItem } from '../../types';

export function DashboardDrawer() {
  const { toggleDashboard, setFocusedDate, setViewMode } = useApp();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [dailyHours, setDailyHours] = useState<DailyHoursItem[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [migration, setMigration] = useState<MigrationTrendItem[]>([]);

  useEffect(() => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().slice(0, 10);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().slice(0, 10);

    Promise.all([
      api.fetchDashboardSummary().then(setSummary),
      api.fetchDailyHours(startOfMonth, endOfMonth).then(setDailyHours),
      api.fetchCompletionHeatmap(startOfMonth, endOfMonth).then(setHeatmap),
      api.fetchMigrationTrend(startOfMonth, endOfMonth).then(setMigration),
    ]).catch(console.error);
  }, []);

  const handleDataClick = (dateStr: string) => {
    setFocusedDate(dateStr);
    setViewMode('month');
    toggleDashboard();
  };

  // Heatmap colors
  const getHeatColor = (rate: number): string => {
    if (rate === 0) return 'var(--color-border)';
    if (rate < 30) return '#fca5a5';
    if (rate < 60) return '#fcd34d';
    if (rate < 90) return '#86efac';
    return '#22c55e';
  };

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="absolute inset-0 bg-black/20" onClick={toggleDashboard} />
      <div
        className="relative w-[460px] h-full shadow-2xl overflow-y-auto"
        style={{ background: 'var(--color-bg-secondary)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-secondary)' }}>
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            📊 数据中心
          </h2>
          <button onClick={toggleDashboard} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Summary Cards */}
          {summary && (
            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-primary)' }}>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <Target size={12} /> 本周完成率
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-accent)' }}>
                  {summary.weekly_completion_rate}%
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {summary.completed_tasks_week}/{summary.total_tasks_week} 任务
                </div>
              </div>
              <div className="p-3 rounded-xl" style={{ background: 'var(--color-bg-primary)' }}>
                <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  <Target size={12} /> 本月完成率
                </div>
                <div className="text-2xl font-bold mt-1" style={{ color: 'var(--color-success)' }}>
                  {summary.monthly_completion_rate}%
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {summary.completed_tasks_month}/{summary.total_tasks_month} 任务
                </div>
              </div>
            </div>
          )}

          {/* Daily Hours Bar Chart */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              <Clock size={14} /> 每日工作时长 (本月)
            </h3>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyHours} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                    tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} unit="h" />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelFormatter={v => `${v}`}
                  />
                  <Bar dataKey="hours" radius={[3, 3, 0, 0]} fill="var(--color-accent)"
                    onClick={(d: any) => d?.date && handleDataClick(d.date)} cursor="pointer" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Completion Heatmap */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              <TrendingUp size={14} /> 每日完成度热力图 (本月)
            </h3>
            <div className="flex flex-wrap gap-1">
              {heatmap.map(item => (
                <div
                  key={item.date}
                  className="w-7 h-7 rounded cursor-pointer transition-transform hover:scale-110"
                  style={{ background: getHeatColor(item.rate) }}
                  title={`${item.date}: ${item.rate}%`}
                  onClick={() => handleDataClick(item.date)}
                />
              ))}
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
              <span>低</span>
              <div className="flex gap-0.5">
                {['var(--color-border)', '#fca5a5', '#fcd34d', '#86efac', '#22c55e'].map((color, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ background: color }} />
                ))}
              </div>
              <span>高</span>
            </div>
          </div>

          {/* Completion Rate Ring */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              📈 周/月完成率对比
            </h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="30%" outerRadius="90%"
                  data={[
                    { name: '本周', value: summary?.weekly_completion_rate || 0, fill: 'var(--color-accent)' },
                    { name: '本月', value: summary?.monthly_completion_rate || 0, fill: 'var(--color-success)' },
                  ]}
                  startAngle={180} endAngle={0}
                >
                  <RadialBar dataKey="value" cornerRadius={10} />
                  <Tooltip />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Migration Trend */}
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              <AlertTriangle size={14} /> 拖延/迁移趋势 (本月)
            </h3>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={migration} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }}
                    tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-secondary)' }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      background: 'var(--color-bg-secondary)',
                      border: '1px solid var(--color-border)',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="var(--color-danger)" strokeWidth={2}
                    dot={{ r: 3, fill: 'var(--color-danger)' }}
                    onClick={(d: any) => d?.date && handleDataClick(d.date)} cursor="pointer" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
