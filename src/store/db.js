/**
 * Local-storage data layer. Replaces the API/backend entirely — the app is
 * fully offline-first. Every "table" is a JSON array/object stored under its
 * own localStorage key. All reads/writes go through the functions below so
 * there's a single place to change storage strategy later if ever needed.
 */
import { generateId } from '../utils/id';

const KEYS = {
  SETTINGS: 'dht_settings',
  SESSIONS: 'dht_sessions',
  EXAMS: 'dht_exams',
  TIMETABLE: 'dht_timetable',
  LINKS: 'dht_links',
  DEADLINES: 'dht_deadlines',
  CAPTURE: 'dht_capture'
};

const DEFAULT_SETTINGS = {
  name: 'Student',
  studentId: '',
  department: '',
  weeklyTargetHours: 50,
  monthlyTargetHours: 200,
  holidayHours: 8,
  theme: 'light'
};

// Seeded from the user's uploaded timetable PDF (M.Tech ESE, IISc — Aug-Dec 2026).
// Fully editable/removable from the Timetable page — this is only a starting point.
const DEFAULT_TIMETABLE = [
  { id: generateId(), day: 'Monday', startTime: '10:00', endTime: '11:30', courseCode: 'E3 257', courseName: 'Embedded System Design', type: 'Lecture', room: 'CR 137', instructor: '' },
  { id: generateId(), day: 'Monday', startTime: '11:30', endTime: '13:00', courseCode: 'E3 229', courseName: 'Principles of Microelectronic Devices', type: 'Lecture', room: 'CR 134', instructor: '' },
  { id: generateId(), day: 'Monday', startTime: '14:00', endTime: '17:00', courseCode: 'E0 284', courseName: 'Digital VLSI Circuits', type: 'Lab', room: '', instructor: 'Akshay P, Ramakrishna' },

  { id: generateId(), day: 'Tuesday', startTime: '08:30', endTime: '10:00', courseCode: 'E2 240', courseName: 'Introduction to Machine Learning', type: 'Lecture', room: 'CR 137', instructor: '' },
  { id: generateId(), day: 'Tuesday', startTime: '10:00', endTime: '11:30', courseCode: 'E0 284', courseName: 'Digital VLSI Circuits', type: 'Lecture', room: 'CR 137', instructor: '' },
  { id: generateId(), day: 'Tuesday', startTime: '14:00', endTime: '17:00', courseCode: 'E3 257', courseName: 'Embedded System Design', type: 'Tutorial/Lab', room: '', instructor: 'T.R. Asuthosh, Pooja A' },

  { id: generateId(), day: 'Wednesday', startTime: '10:00', endTime: '11:30', courseCode: 'E3 257', courseName: 'Embedded System Design', type: 'Lecture', room: 'CR 137', instructor: '' },
  { id: generateId(), day: 'Wednesday', startTime: '11:30', endTime: '13:00', courseCode: 'E3 229', courseName: 'Principles of Microelectronic Devices', type: 'Lecture', room: 'CR 134', instructor: '' },
  { id: generateId(), day: 'Wednesday', startTime: '14:00', endTime: '15:30', courseCode: 'E3 238', courseName: 'Analog VLSI Circuits', type: 'Lab', room: '', instructor: 'Akshay P, Pooja A' },
  { id: generateId(), day: 'Wednesday', startTime: '15:30', endTime: '16:30', courseCode: 'E3 238', courseName: 'Analog VLSI Circuits', type: 'Lecture', room: 'CR 137', instructor: '' },

  { id: generateId(), day: 'Thursday', startTime: '08:30', endTime: '10:00', courseCode: 'E2 240', courseName: 'Introduction to Machine Learning', type: 'Lecture', room: 'CR 137', instructor: '' },
  { id: generateId(), day: 'Thursday', startTime: '10:00', endTime: '11:30', courseCode: 'E0 284', courseName: 'Digital VLSI Circuits', type: 'Lecture', room: 'CR 137', instructor: '' },

  { id: generateId(), day: 'Friday', startTime: '09:00', endTime: '10:30', courseCode: 'E3 238', courseName: 'Analog VLSI Circuits', type: 'Lecture', room: 'CR 137', instructor: '' }
];

function read(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Failed to read ${key} from storage`, err);
    return fallback;
  }
}

function write(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (err) {
    console.error(`Failed to write ${key} to storage`, err);
    return false;
  }
}

// ---------- Settings ----------
export function getSettings() {
  return { ...DEFAULT_SETTINGS, ...read(KEYS.SETTINGS, {}) };
}

export function saveSettings(partial) {
  const updated = { ...getSettings(), ...partial };
  write(KEYS.SETTINGS, updated);
  return updated;
}

// ---------- Sessions (includes holiday entries, flagged with isHoliday) ----------
export function getAllSessions() {
  return read(KEYS.SESSIONS, []);
}

export function saveAllSessions(sessions) {
  write(KEYS.SESSIONS, sessions);
}

export function addSession(session) {
  const sessions = getAllSessions();
  const newSession = { id: generateId(), notes: '', isHoliday: false, ...session };
  sessions.push(newSession);
  saveAllSessions(sessions);
  return newSession;
}

export function updateSession(id, updates) {
  const sessions = getAllSessions();
  const idx = sessions.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  sessions[idx] = { ...sessions[idx], ...updates };
  saveAllSessions(sessions);
  return sessions[idx];
}

export function deleteSession(id) {
  const sessions = getAllSessions().filter((s) => s.id !== id);
  saveAllSessions(sessions);
}

export function getActiveSession() {
  return getAllSessions().find((s) => !s.isHoliday && s.signInTime && !s.signOutTime) || null;
}

// ---------- Exams ----------
export function getAllExams() {
  return read(KEYS.EXAMS, []);
}

export function saveAllExams(exams) {
  write(KEYS.EXAMS, exams);
}

export function addExam(exam) {
  const exams = getAllExams();
  const newExam = { id: generateId(), ...exam };
  exams.push(newExam);
  saveAllExams(exams);
  return newExam;
}

export function updateExam(id, updates) {
  const exams = getAllExams();
  const idx = exams.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  exams[idx] = { ...exams[idx], ...updates };
  saveAllExams(exams);
  return exams[idx];
}

export function deleteExam(id) {
  saveAllExams(getAllExams().filter((e) => e.id !== id));
}

// ---------- Timetable ----------
export function getTimetable() {
  return read(KEYS.TIMETABLE, DEFAULT_TIMETABLE);
}

export function saveTimetable(entries) {
  write(KEYS.TIMETABLE, entries);
}

export function addTimetableEntry(entry) {
  const entries = getTimetable();
  const newEntry = { id: generateId(), ...entry };
  entries.push(newEntry);
  saveTimetable(entries);
  return newEntry;
}

export function updateTimetableEntry(id, updates) {
  const entries = getTimetable();
  const idx = entries.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  entries[idx] = { ...entries[idx], ...updates };
  saveTimetable(entries);
  return entries[idx];
}

export function deleteTimetableEntry(id) {
  saveTimetable(getTimetable().filter((e) => e.id !== id));
}

export function resetTimetableToDefault() {
  saveTimetable(DEFAULT_TIMETABLE.map((e) => ({ ...e, id: generateId() })));
  return getTimetable();
}

// ---------- Links ----------
export function getAllLinks() {
  return read(KEYS.LINKS, []);
}

export function saveAllLinks(links) {
  write(KEYS.LINKS, links);
}

export function addLink(link) {
  const links = getAllLinks();
  const newLink = { id: generateId(), isMajor: false, ...link };
  links.push(newLink);
  saveAllLinks(links);
  return newLink;
}

export function updateLink(id, updates) {
  const links = getAllLinks();
  const idx = links.findIndex((l) => l.id === id);
  if (idx === -1) return null;
  links[idx] = { ...links[idx], ...updates };
  saveAllLinks(links);
  return links[idx];
}

export function deleteLink(id) {
  saveAllLinks(getAllLinks().filter((l) => l.id !== id));
}

// ---------- Deadlines (assignments / project submissions) ----------
// Every read auto-purges entries whose due date/time has already passed, so
// the list (and any status counts derived from it) always self-cleans
// without needing a background timer running somewhere.
function purgeExpiredDeadlines() {
  const all = read(KEYS.DEADLINES, []);
  const now = new Date();
  const kept = all.filter((d) => new Date(d.dueAt) >= now);
  if (kept.length !== all.length) write(KEYS.DEADLINES, kept);
  return kept;
}

export function getAllDeadlines() {
  return purgeExpiredDeadlines();
}

export function saveAllDeadlines(deadlines) {
  write(KEYS.DEADLINES, deadlines);
}

export function addDeadline(deadline) {
  const deadlines = purgeExpiredDeadlines();
  const newDeadline = {
    id: generateId(),
    assignmentNumber: '',
    notes: '',
    reminders: [],
    createdAt: new Date().toISOString(),
    ...deadline
  };
  deadlines.push(newDeadline);
  saveAllDeadlines(deadlines);
  return newDeadline;
}

export function updateDeadline(id, updates) {
  const deadlines = purgeExpiredDeadlines();
  const idx = deadlines.findIndex((d) => d.id === id);
  if (idx === -1) return null;
  deadlines[idx] = { ...deadlines[idx], ...updates };
  saveAllDeadlines(deadlines);
  return deadlines[idx];
}

export function deleteDeadline(id) {
  saveAllDeadlines(purgeExpiredDeadlines().filter((d) => d.id !== id));
}

export function getPendingDeadlineCount() {
  return purgeExpiredDeadlines().length;
}

// ---------- Capture (flexible tasks / notes / questions / ideas) ----------
// Deliberately unopinionated: every field except `title` is optional, so it
// can hold anything from a one-line reminder to a fully broken-down task
// with subtasks, a course, a deadline, and reminders. Nothing here is ever
// auto-deleted (unlike Deadlines) — completed items just move into a
// collapsible "Done" section, since this is meant to be a durable personal
// log, not a self-cleaning queue.
export function getAllCaptureItems() {
  return read(KEYS.CAPTURE, []);
}

export function saveAllCaptureItems(items) {
  write(KEYS.CAPTURE, items);
}

export function addCaptureItem(item) {
  const items = getAllCaptureItems();
  const newItem = {
    id: generateId(),
    type: 'task',
    details: '',
    subject: '',
    priority: '',
    dueAt: null,
    reminders: [],
    subtasks: [],
    status: 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...item
  };
  items.unshift(newItem);
  saveAllCaptureItems(items);
  return newItem;
}

export function updateCaptureItem(id, updates) {
  const items = getAllCaptureItems();
  const idx = items.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() };
  saveAllCaptureItems(items);
  return items[idx];
}

export function deleteCaptureItem(id) {
  saveAllCaptureItems(getAllCaptureItems().filter((i) => i.id !== id));
}

export function getOpenCaptureCount() {
  return getAllCaptureItems().filter((i) => i.status !== 'done').length;
}

// ---------- Export / Import (for backup, since there is no server database) ----------
export function exportAllData() {
  return {
    settings: getSettings(),
    sessions: getAllSessions(),
    exams: getAllExams(),
    timetable: getTimetable(),
    links: getAllLinks(),
    deadlines: getAllDeadlines(),
    capture: getAllCaptureItems(),
    exportedAt: new Date().toISOString()
  };
}

export function importAllData(data) {
  if (data.settings) write(KEYS.SETTINGS, data.settings);
  if (data.sessions) write(KEYS.SESSIONS, data.sessions);
  if (data.exams) write(KEYS.EXAMS, data.exams);
  if (data.timetable) write(KEYS.TIMETABLE, data.timetable);
  if (data.links) write(KEYS.LINKS, data.links);
  if (data.deadlines) write(KEYS.DEADLINES, data.deadlines);
  if (data.capture) write(KEYS.CAPTURE, data.capture);
}

export function clearAllData() {
  Object.values(KEYS).forEach((key) => window.localStorage.removeItem(key));
}
