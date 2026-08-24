/**
 * Date utility functions — mirrors the logic used server-side in the web version,
 * now running entirely in the browser. Week is always Monday -> Sunday.
 */
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

export function getWeekStart(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay();
  const diff = day === 0 ? 6 : day - 1;
  d.setDate(d.getDate() - diff);
  return d;
}

export function getWeekEnd(date = new Date()) {
  const start = getWeekStart(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return endOfDay(end);
}

export function getMonthStart(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

export function getMonthEnd(date = new Date()) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

export function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function getWeekDays(date = new Date()) {
  const start = getWeekStart(date);
  const days = [];
  for (let i = 0; i < 7; i++) days.push(addDays(start, i));
  return days;
}

export function daysRemainingInWeek(date = new Date()) {
  const d = startOfDay(date);
  const day = d.getDay();
  const isoDay = day === 0 ? 7 : day;
  return 7 - isoDay + 1;
}

export function daysRemainingInMonth(date = new Date()) {
  const end = getMonthEnd(date);
  const d = startOfDay(date);
  const diffMs = endOfDay(end) - d;
  return Math.max(Math.round(diffMs / 86400000) + 1, 0);
}

export function toDateKey(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
