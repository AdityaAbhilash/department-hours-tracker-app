import { useState, useEffect, useMemo } from 'react';
import { Plus, Pencil, Trash2, X, ClipboardList, CheckCircle2, BellRing, Hash } from 'lucide-react';
import { getAllDeadlines, addDeadline, updateDeadline, deleteDeadline, getTimetable } from '../store/db';
import { scheduleRemindersForDeadline, cancelRemindersForDeadline, REMINDER_OPTIONS } from '../utils/notifications';
import ConfirmDialog from '../components/ConfirmDialog';

const CUSTOM_SUBJECT = '__custom__';

function uniqueSubjectsFromTimetable() {
  const entries = getTimetable();
  const seen = new Map();
  entries.forEach((e) => {
    const label = e.courseCode ? `${e.courseCode} \u2014 ${e.courseName}` : e.courseName;
    if (label && !seen.has(label)) seen.set(label, label);
  });
  return Array.from(seen.values()).sort();
}

function emptyForm(subjectOptions) {
  return {
    subject: subjectOptions[0] || CUSTOM_SUBJECT,
    customSubject: '',
    title: '',
    assignmentNumber: '',
    dueDate: '',
    dueTime: '23:59',
    reminders: [1440, 60],
    notes: ''
  };
}

function timeUntil(dueAt) {
  const diffMs = new Date(dueAt) - new Date();
  if (diffMs <= 0) return { label: 'Overdue', urgent: true };
  const mins = Math.floor(diffMs / 60000);
  const days = Math.floor(mins / 1440);
  const hours = Math.floor((mins % 1440) / 60);
  const remMins = mins % 60;
  if (days > 0) return { label: `${days}d ${hours}h left`, urgent: days === 0 };
  if (hours > 0) return { label: `${hours}h ${remMins}m left`, urgent: hours < 6 };
  return { label: `${remMins}m left`, urgent: true };
}

function DeadlineFormModal({ deadline, subjectOptions, onClose, onSave }) {
  const initial = deadline
    ? {
        subject: subjectOptions.includes(deadline.subject) ? deadline.subject : CUSTOM_SUBJECT,
        customSubject: subjectOptions.includes(deadline.subject) ? '' : deadline.subject,
        title: deadline.title,
        assignmentNumber: deadline.assignmentNumber || '',
        dueDate: deadline.dueAt.slice(0, 10),
        dueTime: deadline.dueAt.slice(11, 16),
        reminders: deadline.reminders || [],
        notes: deadline.notes || ''
      }
    : emptyForm(subjectOptions);

  const [form, setForm] = useState(initial);

  const toggleReminder = (minutes) => {
    setForm((f) => ({
      ...f,
      reminders: f.reminders.includes(minutes) ? f.reminders.filter((m) => m !== minutes) : [...f.reminders, minutes].sort((a, b) => a - b)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const subject = form.subject === CUSTOM_SUBJECT ? form.customSubject.trim() : form.subject;
    if (!subject) {
      alert('Please select or enter a subject.');
      return;
    }
    if (!form.dueDate) {
      alert('Please pick a due date.');
      return;
    }
    const dueAt = new Date(`${form.dueDate}T${form.dueTime || '23:59'}:00`);
    if (dueAt <= new Date()) {
      alert('Due date/time must be in the future.');
      return;
    }
    onSave({
      subject,
      title: form.title.trim(),
      assignmentNumber: form.assignmentNumber.trim(),
      dueAt: dueAt.toISOString(),
      reminders: form.reminders,
      notes: form.notes.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{deadline ? 'Edit Deadline' : 'Add Deadline'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Subject / Course</label>
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field">
              {subjectOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value={CUSTOM_SUBJECT}>Type manually...</option>
            </select>
            {form.subject === CUSTOM_SUBJECT && (
              <input
                autoFocus
                value={form.customSubject}
                onChange={(e) => setForm({ ...form, customSubject: e.target.value })}
                className="input-field mt-2"
                placeholder="e.g. Independent Study"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Assignment / Project name</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Lab Report 3" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Assignment number (optional)</label>
            <input value={form.assignmentNumber} onChange={(e) => setForm({ ...form, assignmentNumber: e.target.value })} className="input-field" placeholder="e.g. HW-04" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Due date</label>
              <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Due time</label>
              <input type="time" required value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
              <BellRing className="w-3.5 h-3.5" /> Remind me (pick any number)
            </label>
            <div className="grid grid-cols-2 gap-2">
              {REMINDER_OPTIONS.map((opt) => (
                <label
                  key={opt.minutes}
                  className={`flex items-center gap-2 text-xs rounded-xl border px-3 py-2 cursor-pointer ${
                    form.reminders.includes(opt.minutes)
                      ? 'bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800 text-brand-700 dark:text-brand-300'
                      : 'border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  <input type="checkbox" className="hidden" checked={form.reminders.includes(opt.minutes)} onChange={() => toggleReminder(opt.minutes)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Notes (optional)</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input-field resize-none" placeholder="Submission link, format, etc." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Deadline</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Deadlines() {
  const [deadlines, setDeadlines] = useState(getAllDeadlines());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDeadline, setEditingDeadline] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [completeTarget, setCompleteTarget] = useState(null);

  const subjectOptions = useMemo(() => uniqueSubjectsFromTimetable(), []);

  const refresh = () => setDeadlines(getAllDeadlines());

  // Re-check for expired deadlines (auto-cleanup) whenever the page regains
  // focus, and once a minute while it's open, so the list and countdowns
  // stay accurate without needing a manual refresh.
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 60000);
    window.addEventListener('focus', refresh);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', refresh);
    };
  }, []);

  const handleSave = async (form) => {
    if (editingDeadline) {
      await cancelRemindersForDeadline(editingDeadline);
      const updated = updateDeadline(editingDeadline.id, form);
      if (updated) await scheduleRemindersForDeadline(updated);
    } else {
      const created = addDeadline(form);
      await scheduleRemindersForDeadline(created);
    }
    refresh();
    setModalOpen(false);
    setEditingDeadline(null);
  };

  const handleDelete = async () => {
    await cancelRemindersForDeadline(deleteTarget);
    deleteDeadline(deleteTarget.id);
    refresh();
    setDeleteTarget(null);
  };

  const handleComplete = async () => {
    // "Complete" removes it immediately, same as delete, but tracked as its
    // own confirmation so it reads clearly as "done" rather than "discarded".
    await cancelRemindersForDeadline(completeTarget);
    deleteDeadline(completeTarget.id);
    refresh();
    setCompleteTarget(null);
  };

  const sorted = [...deadlines].sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));
  const dueToday = sorted.filter((d) => new Date(d.dueAt) - new Date() < 86400000).length;
  const dueThisWeek = sorted.filter((d) => new Date(d.dueAt) - new Date() < 7 * 86400000).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Deadlines</h1>
          <p className="text-sm text-gray-400 mt-1">Assignments & project submissions. Completed or overdue items are removed automatically.</p>
        </div>
        <button
          onClick={() => {
            setEditingDeadline(null);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Deadline
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold">{sorted.length}</p>
          <p className="text-xs text-gray-400 mt-1">Pending</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-orange-500">{dueToday}</p>
          <p className="text-xs text-gray-400 mt-1">Due in 24h</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold">{dueThisWeek}</p>
          <p className="text-xs text-gray-400 mt-1">Due this week</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-10 text-center">
          <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No pending deadlines.</p>
          <p className="text-sm text-gray-400 mt-1">Add an assignment or project submission to get reminders before it's due.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((d) => {
            const t = timeUntil(d.dueAt);
            return (
              <div key={d.id} className="card p-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-400">{d.subject}</p>
                  <p className="text-sm font-semibold truncate">
                    {d.title}
                    {d.assignmentNumber && <span className="text-gray-400 font-normal"> &middot; {d.assignmentNumber}</span>}
                  </p>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>{new Date(d.dueAt).toLocaleString()}</span>
                    <span className={`font-medium ${t.urgent ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}>{t.label}</span>
                    {d.reminders?.length > 0 && (
                      <span className="flex items-center gap-1">
                        <BellRing className="w-3.5 h-3.5" /> {d.reminders.length} reminder{d.reminders.length > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  {d.notes && <p className="text-xs text-gray-400 mt-2">{d.notes}</p>}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setCompleteTarget(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950" title="Mark complete">
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingDeadline(d);
                      setModalOpen(true);
                    }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(d)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <DeadlineFormModal
          deadline={editingDeadline}
          subjectOptions={subjectOptions}
          onClose={() => {
            setModalOpen(false);
            setEditingDeadline(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && <ConfirmDialog title="Delete this deadline?" message="This will permanently remove it and cancel its reminders." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}

      {completeTarget && (
        <ConfirmDialog
          title="Mark as complete?"
          message="This will remove it from your pending deadlines and cancel its reminders."
          confirmLabel="Complete"
          onConfirm={handleComplete}
          onCancel={() => setCompleteTarget(null)}
        />
      )}
    </div>
  );
}
