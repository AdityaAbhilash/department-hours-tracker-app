/**
 * Wraps @capacitor/local-notifications so deadline reminders fire as real
 * Android system notifications, even if the app is closed. This is used
 * instead of SMS: sending SMS would require a paid telecom gateway and a
 * backend server, and doesn't make sense for reminding yourself anyway.
 * Local notifications are free, fully offline, and work the same way.
 *
 * All calls are guarded so the app still works fine in a plain browser
 * (e.g. `npm run dev`), where this native plugin isn't available.
 */
import { Capacitor } from '@capacitor/core';

export const REMINDER_OPTIONS = [
  { minutes: 15, label: '15 minutes before' },
  { minutes: 30, label: '30 minutes before' },
  { minutes: 60, label: '1 hour before' },
  { minutes: 180, label: '3 hours before' },
  { minutes: 720, label: '12 hours before' },
  { minutes: 1440, label: '1 day before' },
  { minutes: 2880, label: '2 days before' },
  { minutes: 10080, label: '1 week before' }
];

export function labelForMinutes(minutes) {
  const found = REMINDER_OPTIONS.find((o) => o.minutes === minutes);
  if (found) return found.label;
  if (minutes < 60) return `${minutes} minutes before`;
  if (minutes < 1440) return `${Math.round(minutes / 60)} hours before`;
  return `${Math.round(minutes / 1440)} days before`;
}

function isNative() {
  return Capacitor.isNativePlatform();
}

// The plugin needs a 32-bit integer notification id. Derive one
// deterministically from the deadline id + reminder offset, so the same
// reminder always maps to the same id and can be reliably cancelled later.
function notifId(deadlineId, minutesBefore) {
  const str = `${deadlineId}-${minutesBefore}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 2147483647;
}

export async function ensureNotificationPermission() {
  if (!isNative()) return false;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const current = await LocalNotifications.checkPermissions();
    if (current.display === 'granted') return true;
    const requested = await LocalNotifications.requestPermissions();
    return requested.display === 'granted';
  } catch (err) {
    console.error('Notification permission check failed', err);
    return false;
  }
}

export async function scheduleRemindersForDeadline(deadline) {
  if (!isNative()) return;
  if (!deadline.reminders || deadline.reminders.length === 0) return;

  const granted = await ensureNotificationPermission();
  if (!granted) return;

  const due = new Date(deadline.dueAt);
  const now = new Date();

  const notifications = deadline.reminders
    .map((minutesBefore) => {
      const fireAt = new Date(due.getTime() - minutesBefore * 60000);
      if (fireAt <= now) return null; // skip reminders that would fire in the past
      return {
        id: notifId(deadline.id, minutesBefore),
        title: `Due soon: ${deadline.title}`,
        body: `${deadline.subject} \u2013 ${labelForMinutes(minutesBefore)} (due ${due.toLocaleString()})`,
        schedule: { at: fireAt, allowWhileIdle: true }
      };
    })
    .filter(Boolean);

  if (notifications.length === 0) return;

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({ notifications });
  } catch (err) {
    console.error('Failed to schedule reminders', err);
  }
}

export async function cancelRemindersForDeadline(deadline) {
  if (!isNative()) return;
  if (!deadline.reminders || deadline.reminders.length === 0) return;
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.cancel({
      notifications: deadline.reminders.map((minutesBefore) => ({ id: notifId(deadline.id, minutesBefore) }))
    });
  } catch (err) {
    console.error('Failed to cancel reminders', err);
  }
}
