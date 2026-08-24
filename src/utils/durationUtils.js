/**
 * Duration/calculation utilities. All durations handled in MINUTES internally.
 */
export function calculateDuration(signInTime, signOutTime) {
  if (!signInTime || !signOutTime) return 0;
  const diffMs = new Date(signOutTime) - new Date(signInTime);
  if (diffMs <= 0) return 0;
  return Math.round(diffMs / 60000);
}

export function calculateLiveDuration(signInTime, now = new Date()) {
  if (!signInTime) return 0;
  const diffMs = new Date(now) - new Date(signInTime);
  return diffMs > 0 ? Math.round(diffMs / 60000) : 0;
}

// Get the "effective" minutes for a session-like record (handles active + holiday entries)
export function getEffectiveMinutes(session, now = new Date()) {
  if (session.isHoliday) return session.durationMinutes || 0;
  if (session.signOutTime) return session.durationMinutes || 0;
  return calculateLiveDuration(session.signInTime, now);
}

export function calculateTotalMinutes(sessions, now = new Date()) {
  return sessions.reduce((total, s) => total + getEffectiveMinutes(s, now), 0);
}

export function formatDuration(totalMinutes) {
  const minutes = Math.max(Math.round(totalMinutes || 0), 0);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function calculateProgress(completedMinutes, targetHours) {
  const targetMinutes = targetHours * 60;
  if (targetMinutes <= 0) return { percentage: 0, rawPercentage: 0 };
  const rawPercentage = (completedMinutes / targetMinutes) * 100;
  const percentage = Math.min(rawPercentage, 100);
  return {
    percentage: Math.round(percentage * 10) / 10,
    rawPercentage: Math.round(rawPercentage * 10) / 10
  };
}

export function calculateRequiredDailyMinutes(completedMinutes, targetHours, daysRemaining) {
  const targetMinutes = targetHours * 60;
  const remainingMinutes = Math.max(targetMinutes - completedMinutes, 0);
  if (daysRemaining <= 0) return 0;
  return Math.round(remainingMinutes / daysRemaining);
}
