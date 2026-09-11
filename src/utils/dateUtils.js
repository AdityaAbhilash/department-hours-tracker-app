/**
 * Date utility functions — mirrors the logic used server-side in the web version,
 * now running entirely in the browser.
 *
 * "Weeks" are NOT calendar (Mon–Sun) weeks — they're fixed buckets within a
 * calendar month: Week 1 = days 1–7, Week 2 = 8–14, Week 3 = 15–21,
 * Week 4 = 22–28, Week 5 = whatever's left (29–30/31, or just day 29 in a
 * leap-year February).
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

// Returns every Date from start to end inclusive (both truncated to their
// own day — time-of-day is ignored).
export function getDateRangeDays(start, end) {
  const days = [];
  let d = startOfDay(start);
  const endD = startOfDay(end);
  while (d <= endD) {
    days.push(new Date(d));
    d = addDays(d, 1);
  }
  return days;
}

// The month-relative week bucket (1–5) that `date` falls into, plus the
// start/end of that bucket and how many such buckets the month has.
export function getMonthWeekRange(date = new Date()) {
  const dayOfMonth = date.getDate();
  const weekIndex = Math.ceil(dayOfMonth / 7);
  const daysInMonth = getMonthEnd(date).getDate();
  const startDay = (weekIndex - 1) * 7 + 1;
  const endDay = Math.min(weekIndex * 7, daysInMonth);
  const start = new Date(date.getFullYear(), date.getMonth(), startDay, 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), endDay, 23, 59, 59, 999);
  const weekCount = Math.ceil(daysInMonth / 7);
  return { start, end, weekIndex, weekCount };
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

