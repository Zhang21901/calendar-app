export function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getMonthDays(year: number, month: number): string[] {
  const first = new Date(year, month - 1, 1);
  const last = new Date(year, month, 0);
  const start = new Date(first);
  start.setDate(start.getDate() - start.getDay() + (start.getDay() === 0 ? -6 : 1)); // Monday start

  const end = new Date(last);
  end.setDate(end.getDate() + (end.getDay() === 0 ? 0 : 7 - end.getDay()));

  const days: string[] = [];
  const current = new Date(start);
  while (current <= end) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export function getWeekDays(referenceDate: string): string[] {
  const d = new Date(referenceDate);
  const day = d.getDay();
  const monday = new Date(d);
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1));

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    days.push(current.toISOString().slice(0, 10));
  }
  return days;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export function formatShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function dayOfWeek(dateStr: string): string {
  const days = ['日', '一', '二', '三', '四', '五', '六'];
  return days[new Date(dateStr).getDay()];
}

export function isToday(dateStr: string): boolean {
  return dateStr === todayStr();
}

export function isCurrentMonth(dateStr: string, refDate: string): boolean {
  const d = new Date(dateStr);
  const ref = new Date(refDate);
  return d.getMonth() === ref.getMonth() && d.getFullYear() === ref.getFullYear();
}

export function formatTimer(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
