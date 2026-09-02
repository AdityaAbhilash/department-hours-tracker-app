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
import { getAllDeadlines, getAllCaptureItems } from '../store/db';

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

// The plugin needs a 32-bit integer notification id per reminder. A hash of
// (itemId + offset) is not guaranteed unique — two different items could
// theoretically collide on the same 32-bit id, silently overwriting each
// other's scheduled alarm. To make this actually safe, every (item, offset)
// pair gets a real, persisted, auto-incrementing id instead of a hash.
const ID_MAP_KEY = 'dht_notif_id_map';

function loadIdMap() {
  try {
    return JSON.parse(localStorage.getItem(ID_MAP_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveIdMap(map) {
  try {
    localStorage.setItem(ID_MAP_KEY, JSON.stringify(map));
  } catch (err) {
    console.error('Failed to persist notification id map', err);
  }
}

function notifId(itemId, minutesBefore) {
  const key = `${itemId}:${minutesBefore}`;
  const map = loadIdMap();
  if (map[key] != null) return map[key];
  const nextId = map.__next || 1;
  map[key] = nextId;
  map.__next = nextId + 1;
  saveIdMap(map);
  return nextId;
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

// Android 12+ silently downgrades scheduled notifications to "inexact" —
// batched into occasional maintenance windows, sometimes hours late,
// sometimes dropped entirely — unless the SCHEDULE_EXACT_ALARM permission is
// present AND the user hasn't disabled it in system settings. This is the
// main reason short reminders "usually" arrive (small delay is invisible)
// while long-scheduled ones don't fire when expected. We can't force this
// setting from JS, but we can detect and surface it.
export async function checkExactAlarmStatus() {
  if (!isNative()) return 'unsupported';
  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    if (typeof LocalNotifications.checkExactNotificationSetting !== 'function') return 'unsupported';
    const result = await LocalNotifications.checkExactNotificationSetting();
    const granted = result?.exact_alarm === 'granted' || result?.value === true || result?.display === 'granted';
    return granted ? 'granted' : 'denied';
  } catch (err) {
    console.error('checkExactNotificationSetting failed', err);
    return 'unsupported';
  }
}

export async function scheduleRemindersForDeadline(deadline) {
  if (!isNative()) return false;
  if (!deadline.reminders || deadline.reminders.length === 0) return false;

  const granted = await ensureNotificationPermission();
  if (!granted) {
    console.warn('Notification permission not granted \u2014 reminders not scheduled for', deadline.title);
    return false;
  }

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

  if (notifications.length === 0) return true; // nothing left in the future \u2014 not an error

  try {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    await LocalNotifications.schedule({ notifications });
    return true;
  } catch (err) {
    console.error('Failed to schedule reminders for', deadline.title, err);
    return false;
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

// Android can silently drop scheduled alarms on reboot, after the exact-alarm
// setting is toggled, or (per Capacitor's own docs) after certain OS
// restarts \u2014 and if an earlier schedule attempt failed quietly, the app
// would otherwise have no way to recover. Re-running every future reminder
// through schedule() is safe and idempotent (same id = overwrite, not
// duplicate), so calling this on every app launch and every time the app
// returns to the foreground re-arms anything that may have been lost.
export async function resyncAllReminders() {
  if (!isNative()) return;
  try {
    const deadlines = getAllDeadlines().filter((d) => d.reminders?.length > 0);
    for (const d of deadlines) {
      await scheduleRemindersForDeadline(d);
    }

    const captureItems = getAllCaptureItems().filter((i) => i.status !== 'done' && i.dueAt && i.reminders?.length > 0);
    for (const i of captureItems) {
      await scheduleRemindersForDeadline(i);
    }
  } catch (err) {
    console.error('Failed to resync reminders', err);
  }
}

