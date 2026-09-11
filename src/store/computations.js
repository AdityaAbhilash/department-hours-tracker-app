/**
 * Aggregation functions that used to live in the backend's dashboard/statistics
 * controllers — now computed client-side directly from localStorage data.
 *
 * Target hours are no longer a fixed number you set — they're derived:
 * every working day (any day that isn't a Saturday, Sunday, or a date
 * marked as a holiday) is worth HOURS_PER_WORKING_DAY hours. "Weeks" are
 * fixed buckets within a calendar month (1–7, 8–14, 15–21, 22–28, 29–end),
 * not Mon–Sun calendar weeks.
 */
import { getAllSessions, getHolidays } from './db';
import {
  getMonthStart,
  getMonthEnd,
  getMonthWeekRange,
  getWeekBucketRange,
  advanceWeekBucket,
  getDateRangeDays,
  toDateKey,
  startOfDay,
  endOfDay
} from '../utils/dateUtils';
import {
  calculateLiveDuration,
  getEffectiveMinutes,
  calculateTotalMinutes,
  calculateProgress,
  calculateRequiredDailyMinutes
} from '../utils/durationUtils';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const HOURS_PER_WORKING_DAY = 10;

function sessionsInRange(sessions, rangeStart, rangeEnd) {
  return sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= startOfDay(rangeStart) && d <= endOfDay(rangeEnd);
  });
}

function loadHolidaySet() {
  return new Set(getHolidays().map((h) => h.date));
}

function isWorkingDayKey(dateKey, holidaySet) {
  const dow = new Date(dateKey).getDay(); // 0 = Sunday, 6 = Saturday
  if (dow === 0 || dow === 6) return false;
  if (holidaySet.has(dateKey)) return false;
  return true;
}

// Working days in [start, end], inclusive.
function countWorkingDays(start, end, holidaySet) {
  return getDateRangeDays(start, end).filter((d) => isWorkingDayKey(toDateKey(d), holidaySet)).length;
}

export function getTodayData(now = new Date()) {
  const dayKey = toDateKey(now);
  const sessions = getAllSessions()
    .filter((s) => toDateKey(s.date) === dayKey)
    .sort((a, b) => new Date(a.signInTime || a.date) - new Date(b.signInTime || b.date));

  const totalMinutes = calculateTotalMinutes(sessions, now);
  const activeSession = sessions.find((s) => !s.isHoliday && s.signInTime && !s.signOutTime) || null;
  const isHolidayToday = sessions.some((s) => s.isHoliday) || loadHolidaySet().has(dayKey);

  return {
    date: dayKey,
    totalMinutes,
    sessions: sessions.map((s) => ({
      ...s,
      durationMinutes: getEffectiveMinutes(s, now),
      isActive: !s.isHoliday && !!s.signInTime && !s.signOutTime
    })),
    isCurrentlyIn: !!activeSession,
    activeSession: activeSession
      ? { signInTime: activeSession.signInTime, currentDurationMinutes: calculateLiveDuration(activeSession.signInTime, now) }
      : null,
    isHolidayToday
  };
}

export function getWeekData(offset = 0, now = new Date()) {
  const holidaySet = loadHolidaySet();
  const todayBucket = getMonthWeekRange(now);
  const { year, month, weekIndex } = advanceWeekBucket(now.getFullYear(), now.getMonth(), todayBucket.weekIndex, offset);
  const { start: weekStart, end: weekEnd, weekCount } = getWeekBucketRange(year, month, weekIndex);
  const weekDayDates = getDateRangeDays(weekStart, weekEnd);

  const sessions = sessionsInRange(getAllSessions(), weekStart, weekEnd);

  const minutesByDay = {};
  weekDayDates.forEach((d) => (minutesByDay[toDateKey(d)] = 0));
  sessions.forEach((s) => {
    const key = toDateKey(s.date);
    if (minutesByDay[key] === undefined) return;
    minutesByDay[key] += getEffectiveMinutes(s, now);
  });

  const chartData = weekDayDates.map((d) => {
    const key = toDateKey(d);
    return {
      day: DAY_NAMES[d.getDay()],
      date: key,
      hours: Math.round((minutesByDay[key] / 60) * 100) / 100,
      minutes: minutesByDay[key],
      isWorkingDay: isWorkingDayKey(key, holidaySet)
    };
  });

  const totalMinutes = Object.values(minutesByDay).reduce((a, b) => a + b, 0);
  const workingDays = countWorkingDays(weekStart, weekEnd, holidaySet);
  const targetHours = workingDays * HOURS_PER_WORKING_DAY;
  const { percentage, rawPercentage } = calculateProgress(totalMinutes, targetHours);

  // "Average/day" reflects the pace actually kept so far: hours banked
  // divided by days actually attended (worked at least some time), not by
  // calendar days elapsed.
  const daysAttended = Object.values(minutesByDay).filter((m) => m > 0).length;
  const averageMinutesPerDay = daysAttended > 0 ? Math.round(totalMinutes / daysAttended) : 0;

  const isCurrentWeek = offset === 0;
  // Remaining WORKING days from today through the end of the week, counting
  // today itself.
  const remainingWorkingDays = isCurrentWeek ? countWorkingDays(now, weekEnd, holidaySet) : 0;
  const remainingMinutes = Math.max(targetHours * 60 - totalMinutes, 0);
  const requiredDailyMinutes = isCurrentWeek ? calculateRequiredDailyMinutes(totalMinutes, targetHours, remainingWorkingDays) : 0;

  let status = 'on-track';
  if (totalMinutes >= targetHours * 60) {
    status = 'completed';
  } else if (isCurrentWeek && remainingWorkingDays > 0) {
    const flatAveragePace = workingDays > 0 ? (targetHours * 60) / workingDays : 0;
    status = requiredDailyMinutes > flatAveragePace * 1.15 ? 'behind' : 'on-track';
  }

  return {
    weekStart,
    weekEnd,
    weekIndex,
    weekCount,
    offset,
    chartData,
    totalMinutes,
    averageMinutesPerDay,
    daysAttended,
    workingDays,
    targetHours,
    percentage,
    rawPercentage,
    remainingMinutes,
    remainingDays: remainingWorkingDays,
    requiredDailyMinutes,
    status,
    referenceLineHours: workingDays > 0 ? Math.round((targetHours / workingDays) * 100) / 100 : 0
  };
}

export function getMonthData(offset = 0, now = new Date()) {
  const holidaySet = loadHolidaySet();
  const referenceDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const monthStart = getMonthStart(referenceDate);
  const monthEnd = getMonthEnd(referenceDate);

  const sessions = sessionsInRange(getAllSessions(), monthStart, monthEnd);
  const minutesByDay = {};
  sessions.forEach((s) => {
    const key = toDateKey(s.date);
    minutesByDay[key] = (minutesByDay[key] || 0) + getEffectiveMinutes(s, now);
  });
  const totalMinutes = Object.values(minutesByDay).reduce((a, b) => a + b, 0);

  // Weekly breakdown using the SAME month-relative week buckets (Week 1..5)
  // shown throughout the app — this powers the "hours per week this month" chart.
  const daysInMonth = monthEnd.getDate();
  const weekCount = Math.ceil(daysInMonth / 7);
  const weeks = [];
  for (let w = 1; w <= weekCount; w++) {
    const startDay = (w - 1) * 7 + 1;
    const endDay = Math.min(w * 7, daysInMonth);
    const wStart = new Date(monthStart.getFullYear(), monthStart.getMonth(), startDay, 0, 0, 0, 0);
    const wEnd = new Date(monthStart.getFullYear(), monthStart.getMonth(), endDay, 23, 59, 59, 999);
    let weekMinutes = 0;
    for (let day = startDay; day <= endDay; day++) {
      const key = toDateKey(new Date(monthStart.getFullYear(), monthStart.getMonth(), day));
      weekMinutes += minutesByDay[key] || 0;
    }
    const weekWorkingDays = countWorkingDays(wStart, wEnd, holidaySet);
    weeks.push({
      label: `Week ${w}`,
      hours: Math.round((weekMinutes / 60) * 100) / 100,
      minutes: weekMinutes,
      targetHours: weekWorkingDays * HOURS_PER_WORKING_DAY,
      startDay,
      endDay
    });
  }

  const workingDays = countWorkingDays(monthStart, monthEnd, holidaySet);
  const targetHours = workingDays * HOURS_PER_WORKING_DAY;
  const { percentage, rawPercentage } = calculateProgress(totalMinutes, targetHours);

  const daysAttended = Object.values(minutesByDay).filter((m) => m > 0).length;
  const averageMinutesPerDay = daysAttended > 0 ? Math.round(totalMinutes / daysAttended) : 0;

  const isCurrentMonth = offset === 0;
  const remainingWorkingDays = isCurrentMonth ? countWorkingDays(now, monthEnd, holidaySet) : 0;
  const remainingMinutes = Math.max(targetHours * 60 - totalMinutes, 0);
  const requiredDailyMinutes = isCurrentMonth ? calculateRequiredDailyMinutes(totalMinutes, targetHours, remainingWorkingDays) : 0;

  return {
    monthStart,
    monthEnd,
    offset,
    weeklyBreakdown: weeks,
    totalMinutes,
    averageMinutesPerDay,
    daysAttended,
    workingDays,
    targetHours,
    percentage,
    rawPercentage,
    remainingMinutes,
    remainingDays: remainingWorkingDays,
    requiredDailyMinutes
  };
}

export function getInsights(now = new Date()) {
  const monthStart = getMonthStart(now);
  const monthEnd = getMonthEnd(now);
  const sessions = sessionsInRange(getAllSessions(), monthStart, monthEnd);

  if (sessions.length === 0) return { hasData: false };

  const minutesByDay = {};
  sessions.forEach((s) => {
    const key = toDateKey(s.date);
    minutesByDay[key] = (minutesByDay[key] || 0) + getEffectiveMinutes(s, now);
  });

  const dayEntries = Object.entries(minutesByDay);
  const longestDayEntry = dayEntries.reduce((max, cur) => (cur[1] > max[1] ? cur : max), dayEntries[0]);
  const longestDayDate = new Date(longestDayEntry[0]);
  const longestDayName = DAY_NAMES[longestDayDate.getDay()];

  // Best week using the same month-relative week buckets as everywhere else.
  const daysInMonth = monthEnd.getDate();
  const weekCount = Math.ceil(daysInMonth / 7);
  let bestWeek = null;
  for (let w = 1; w <= weekCount; w++) {
    const startDay = (w - 1) * 7 + 1;
    const endDay = Math.min(w * 7, daysInMonth);
    const weekMinutes = dayEntries.reduce((total, [key, mins]) => {
      const day = new Date(key).getDate();
      return day >= startDay && day <= endDay ? total + mins : total;
    }, 0);
    if (!bestWeek || weekMinutes > bestWeek.minutes) bestWeek = { label: `Week ${w}`, minutes: weekMinutes };
  }

  const totalMinutes = dayEntries.reduce((a, [, m]) => a + m, 0);
  const daysAttended = dayEntries.filter(([, m]) => m > 0).length;
  const avgDailyMinutes = daysAttended > 0 ? Math.round(totalMinutes / daysAttended) : 0;

  return {
    hasData: true,
    longestDay: { day: longestDayName, minutes: longestDayEntry[1] },
    bestWeek,
    averageDailyMinutes: avgDailyMinutes,
    daysAttendedThisMonth: daysAttended
  };
}

export function getStatistics(now = new Date()) {
  const holidaySet = loadHolidaySet();
  const sessions = [...getAllSessions()].sort((a, b) => new Date(a.date) - new Date(b.date));
  if (sessions.length === 0) return { hasData: false };

  let totalMinutes = 0;
  let longestSession = null;
  const minutesByDay = {};

  sessions.forEach((s) => {
    const mins = getEffectiveMinutes(s, now);
    totalMinutes += mins;
    if (!s.isHoliday && (!longestSession || mins > longestSession.minutes)) {
      longestSession = { minutes: mins, date: s.date, signInTime: s.signInTime, signOutTime: s.signOutTime };
    }
    const key = toDateKey(s.date);
    minutesByDay[key] = (minutesByDay[key] || 0) + mins;
  });

  const dayEntries = Object.entries(minutesByDay);
  const daysAttended = dayEntries.length;
  const longestDayEntry = dayEntries.reduce((max, cur) => (cur[1] > max[1] ? cur : max), dayEntries[0]);
  const shortestDayEntry = dayEntries.reduce((min, cur) => (cur[1] < min[1] ? cur : min), dayEntries[0]);

  // Bucket every attended day into its month-relative week, then check that
  // bucket's minutes against ITS OWN target (working days in that specific
  // week × HOURS_PER_WORKING_DAY) — the target isn't a fixed number anymore.
  const weekBuckets = {};
  dayEntries.forEach(([key, mins]) => {
    const d = new Date(key);
    const weekIdx = Math.ceil(d.getDate() / 7);
    const bucketKey = `${d.getFullYear()}-${d.getMonth()}-W${weekIdx}`;
    if (!weekBuckets[bucketKey]) weekBuckets[bucketKey] = { minutes: 0, year: d.getFullYear(), month: d.getMonth(), weekIdx };
    weekBuckets[bucketKey].minutes += mins;
  });
  const weekBucketList = Object.values(weekBuckets);
  const weeksHitTarget = weekBucketList.filter((wb) => {
    const monthEndDate = getMonthEnd(new Date(wb.year, wb.month, 1));
    const wStart = new Date(wb.year, wb.month, (wb.weekIdx - 1) * 7 + 1);
    const wEnd = new Date(wb.year, wb.month, Math.min(wb.weekIdx * 7, monthEndDate.getDate()), 23, 59, 59, 999);
    const wd = countWorkingDays(wStart, wEnd, holidaySet);
    return wb.minutes >= wd * HOURS_PER_WORKING_DAY * 60;
  }).length;
  const weeklyCompletionRate = weekBucketList.length > 0 ? Math.round((weeksHitTarget / weekBucketList.length) * 100) : 0;

  const monthBuckets = {};
  dayEntries.forEach(([key, mins]) => {
    const d = new Date(key);
    const mKey = `${d.getFullYear()}-${d.getMonth()}`;
    monthBuckets[mKey] = (monthBuckets[mKey] || 0) + mins;
  });
  const monthBucketEntries = Object.entries(monthBuckets);
  const monthsHitTarget = monthBucketEntries.filter(([mKey, mins]) => {
    const [y, m] = mKey.split('-').map(Number);
    const mStart = getMonthStart(new Date(y, m, 1));
    const mEnd = getMonthEnd(new Date(y, m, 1));
    const wd = countWorkingDays(mStart, mEnd, holidaySet);
    return mins >= wd * HOURS_PER_WORKING_DAY * 60;
  }).length;
  const monthlyCompletionRate = monthBucketEntries.length > 0 ? Math.round((monthsHitTarget / monthBucketEntries.length) * 100) : 0;

  const firstDate = new Date(dayEntries[0][0]);
  const lastDate = new Date(dayEntries[dayEntries.length - 1][0]);
  const spanDays = Math.max(Math.round((lastDate - firstDate) / 86400000) + 1, 1);
  const spanWeeks = spanDays / 7;

  return {
    hasData: true,
    totalMinutes,
    averageMinutesPerDay: Math.round(totalMinutes / daysAttended),
    averageMinutesPerWeek: Math.round(totalMinutes / Math.max(spanWeeks, 1)),
    longestSession,
    longestDay: { date: longestDayEntry[0], minutes: longestDayEntry[1] },
    shortestDay: { date: shortestDayEntry[0], minutes: shortestDayEntry[1] },
    daysAttended,
    numberOfSessions: sessions.length,
    weeklyCompletionRate,
    monthlyCompletionRate
  };
}

export function getHistoryForMonth(monthStr, now = new Date()) {
  let year = now.getFullYear();
  let month = now.getMonth();
  if (monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    if (y && m) {
      year = y;
      month = m - 1;
    }
  }
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const sessions = sessionsInRange(getAllSessions(), monthStart, monthEnd).sort(
    (a, b) => new Date(a.signInTime || a.date) - new Date(b.signInTime || b.date)
  );

  const grouped = {};
  sessions.forEach((s) => {
    const key = toDateKey(s.date);
    if (!grouped[key]) grouped[key] = { date: key, sessions: [], totalMinutes: 0 };
    grouped[key].sessions.push({ ...s, durationMinutes: getEffectiveMinutes(s, now) });
    grouped[key].totalMinutes += getEffectiveMinutes(s, now);
  });

  const holidaySet = loadHolidaySet();
  // Marked holidays don't need a session to show up in history — a day off
  // with nothing logged should still appear (as 0h, flagged Holiday) rather
  // than silently vanishing from the list.
  getHolidays().forEach((h) => {
    const d = new Date(h.date);
    if (d < monthStart || d > monthEnd) return;
    if (!grouped[h.date]) grouped[h.date] = { date: h.date, sessions: [], totalMinutes: 0 };
  });

  const days = Object.values(grouped)
    .map((d) => ({
      date: d.date,
      firstEntry: d.sessions.find((s) => !s.isHoliday)?.signInTime || null,
      lastExit: [...d.sessions].reverse().find((s) => !s.isHoliday)?.signOutTime || null,
      totalMinutes: d.totalMinutes,
      numberOfSessions: d.sessions.length,
      isHoliday: d.sessions.some((s) => s.isHoliday) || holidaySet.has(d.date),
      sessions: d.sessions
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return { monthStart, monthEnd, days };
}
