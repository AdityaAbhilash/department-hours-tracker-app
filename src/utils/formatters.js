export function formatDuration(totalMinutes) {
  const minutes = Math.max(Math.round(totalMinutes || 0), 0);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function formatClock(totalSeconds) {
  const s = Math.max(Math.round(totalSeconds || 0), 0);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((v) => String(v).padStart(2, '0')).join(':');
}

export function formatTime(dateInput) {
  if (!dateInput) return '--:--';
  const d = new Date(dateInput);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function formatDate(dateInput) {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateRange(startInput, endInput) {
  const start = new Date(startInput);
  const end = new Date(endInput);
  const startStr = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const endStr = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startStr} \u2013 ${endStr}`;
}

export function formatMonthLabel(dateInput) {
  const d = new Date(dateInput);
  return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function greetingForTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
