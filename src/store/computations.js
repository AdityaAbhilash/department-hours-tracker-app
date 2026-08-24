/**
 * Aggregation functions that used to live in the backend's dashboard/statistics
 * controllers — now computed client-side directly from localStorage data.
 */
import { getAllSessions, getSettings } from './db';
import {
  getWeekStart,
  getWeekEnd,
  getMonthStart,
  getMonthEnd,
  getWeekDays,
  addDays,
  daysRemainingInWeek,
  daysRemainingInMonth,
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

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function sessionsInRange(sessions, rangeStart, rangeEnd) {
  return sessions.filter((s) => {
    const d = new Date(s.date);
    return d >= startOfDay(rangeStart) && d <= endOfDay(rangeEnd);
  });
}

export function getTodayData(now = new Date()) {
  const dayKey = toDateKey(now);
  const sessions = getAllSessions()
    .filter((s) => toDateKey(s.date) === dayKey)
    .sort((a, b) => new Date(a.signInTime || a.date) - new Date(b.signInTime || b.date));

  const totalMinutes = calculateTotalMinutes(sessions, now);
  const activeSession = sessions.find((s) => !s.isHoliday && s.signInTime && !s.signOutTime) || null;
  const isHolidayToday = sessions.some((s) => s.isHoliday);

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
  const settings = getSettings();
  const referenceDate = addDays(now, offset * 7);
  const weekStart = getWeekStart(referenceDate);
  const weekEnd = getWeekEnd(referenceDate);
  const weekDays = getWeekDays(referenceDate);

  const sessions = sessionsInRange(getAllSessions(), weekStart, weekEnd);

  const minutesByDay = {};
  weekDays.forEach((d) => (minutesByDay[toDateKey(d)] = 0));
  sessions.forEach((s) => {
    const key = toDateKey(s.date);
    if (minutesByDay[key] === undefined) return;
    minutesByDay[key] += getEffectiveMinutes(s, now);
  });

  const chartData = weekDays.map((d, i) => ({
    day: DAY_NAMES[i],
    date: toDateKey(d),
    hours: Math.round((minutesByDay[toDateKey(d)] / 60) * 100) / 100,
    minutes: minutesByDay[toDateKey(d)]
  }));

  const totalMinutes = Object.values(minutesByDay).reduce((a, b) => a + b, 0);
  const targetHours = settings.weeklyTargetHours || 50;
  const { percentage, rawPercentage } = calculateProgress(totalMinutes, targetHours);

  const isCurrentWeek = offset === 0;
  const remainingDays = isCurrentWeek ? daysRemainingInWeek(now) : 0;
  const remainingMinutes = Math.max(targetHours * 60 - totalMinutes, 0);
  const requiredDailyMinutes = isCurrentWeek ? calculateRequiredDailyMinutes(totalMinutes, targetHours, remainingDays) : 0;

  let status = 'on-track';
  if (totalMinutes >= targetHours * 60) {
    status = 'completed';
  } else if (isCurrentWeek) {
    const flatAveragePace = (targetHours * 60) / 7;
    status = requiredDailyMinutes > flatAveragePace * 1.15 ? 'behind' : 'on-track';
  }

  return {
    weekStart,
    weekEnd,
    offset,
    chartData,
    totalMinutes,
    averageMinutesPerDay: Math.round(totalMinutes / 7),
    targetHours,
    percentage,
    rawPercentage,
    remainingMinutes,
    remainingDays,
    requiredDailyMinutes,
    status,
    referenceLineHours: Math.round((targetHours / 7) * 100) / 100
  };
}

export function getMonthData(offset = 0, now = new Date()) {
  const settings = getSettings();
  const referenceDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const monthStart = getMonthStart(referenceDate);
  const monthEnd = getMonthEnd(referenceDate);

  const sessions = sessionsInRange(getAllSessions(), monthStart, monthEnd);
  const totalMinutes = sessions.reduce((total, s) => total + getEffectiveMinutes(s, now), 0);

  const weeks = [];
  let cursor = getWeekStart(monthStart);
  let weekIndex = 1;
  while (cursor <= monthEnd) {
    const wStart = cursor;
    const wEnd = getWeekEnd(cursor);
    const overlapStart = wStart > monthStart ? wStart : monthStart;
    const overlapEnd = wEnd < monthEnd ? wEnd : monthEnd;

    const weekMinutes = sessions.reduce((total, s) => {
      const sDate = new Date(s.date);
      if (sDate >= startOfDay(overlapStart) && sDate <= endOfDay(overlapEnd)) {
        return total + getEffectiveMinutes(s, now);
      }
      return total;
    }, 0);

    weeks.push({ label: `Week ${weekIndex}`, hours: Math.round((weekMinutes / 60) * 100) / 100, minutes: weekMinutes });
    cursor = addDays(cursor, 7);
    weekIndex += 1;
  }

  const targetHours = settings.monthlyTargetHours || 200;
  const { percentage, rawPercentage } = calculateProgress(totalMinutes, targetHours);

  const isCurrentMonth = offset === 0;
  const remainingDays = isCurrentMonth ? daysRemainingInMonth(now) : 0;
  const remainingMinutes = Math.max(targetHours * 60 - totalMinutes, 0);
  const requiredDailyMinutes = isCurrentMonth ? calculateRequiredDailyMinutes(totalMinutes, targetHours, remainingDays) : 0;

  return {
    monthStart,
    monthEnd,
    offset,
    weeklyBreakdown: weeks,
    totalMinutes,
    targetHours,
    percentage,
    rawPercentage,
    remainingMinutes,
    remainingDays,
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
  const longestDayName = DAY_NAMES[(longestDayDate.getDay() + 6) % 7];

  let cursor = getWeekStart(monthStart);
  let bestWeek = null;
  let weekIdx = 1;
  while (cursor <= monthEnd) {
    const wStart = cursor;
    const wEnd = getWeekEnd(cursor);
    const weekMinutes = dayEntries.reduce((total, [key, mins]) => {
      const d = new Date(key);
      return d >= wStart && d <= wEnd ? total + mins : total;
    }, 0);
    if (!bestWeek || weekMinutes > bestWeek.minutes) bestWeek = { label: `Week ${weekIdx}`, minutes: weekMinutes };
    cursor = addDays(cursor, 7);
    weekIdx += 1;
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
  const settings = getSettings();
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

  const weeklyTarget = settings.weeklyTargetHours || 50;
  const monthlyTarget = settings.monthlyTargetHours || 200;

  const weekBuckets = {};
  dayEntries.forEach(([key, mins]) => {
    const wStart = toDateKey(getWeekStart(new Date(key)));
    weekBuckets[wStart] = (weekBuckets[wStart] || 0) + mins;
  });
  const weekValues = Object.values(weekBuckets);
  const weeksHitTarget = weekValues.filter((m) => m >= weeklyTarget * 60).length;
  const weeklyCompletionRate = weekValues.length > 0 ? Math.round((weeksHitTarget / weekValues.length) * 100) : 0;

  const monthBuckets = {};
  dayEntries.forEach(([key, mins]) => {
    const d = new Date(key);
    const mKey = `${d.getFullYear()}-${d.getMonth()}`;
    monthBuckets[mKey] = (monthBuckets[mKey] || 0) + mins;
  });
  const monthValues = Object.values(monthBuckets);
  const monthsHitTarget = monthValues.filter((m) => m >= monthlyTarget * 60).length;
  const monthlyCompletionRate = monthValues.length > 0 ? Math.round((monthsHitTarget / monthValues.length) * 100) : 0;

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
    monthlyCompletionRate,
    weeklyTarget,
    monthlyTarget
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

  const days = Object.values(grouped)
    .map((d) => ({
      date: d.date,
      firstEntry: d.sessions.find((s) => !s.isHoliday)?.signInTime || null,
      lastExit: [...d.sessions].reverse().find((s) => !s.isHoliday)?.signOutTime || null,
      totalMinutes: d.totalMinutes,
      numberOfSessions: d.sessions.length,
      isHoliday: d.sessions.some((s) => s.isHoliday),
      sessions: d.sessions
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return { monthStart, monthEnd, days };
}
