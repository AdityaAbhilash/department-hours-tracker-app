import { useState, useMemo } from 'react';
import {
  Plus, X, Pencil, Trash2, CheckSquare, StickyNote, HelpCircle, Lightbulb,
  Circle, CheckCircle2, ChevronDown, ChevronUp, BellRing, Flag, ListPlus, Sparkles
} from 'lucide-react';
import { getAllCaptureItems, addCaptureItem, updateCaptureItem, deleteCaptureItem, getTimetable } from '../store/db';
import { scheduleRemindersForDeadline, cancelRemindersForDeadline, REMINDER_OPTIONS } from '../utils/notifications';
import ConfirmDialog from '../components/ConfirmDialog';

const CUSTOM_SUBJECT = '__custom__';

const TYPES = [
  { id: 'task', label: 'Task', icon: CheckSquare, color: 'text-brand-600 dark:text-brand-400', bg: 'bg-brand-50 dark:bg-brand-950 border-brand-200 dark:border-brand-800' },
  { id: 'note', label: 'Note', icon: StickyNote, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800' },
  { id: 'question', label: 'Question', icon: HelpCircle, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800' },
  { id: 'idea', label: 'Idea', icon: Lightbulb, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800' }
];

const PRIORITIES = [
  { id: '', label: 'None', dot: 'bg-gray-300 dark:bg-gray-700', border: '' },
  { id: 'low', label: 'Low', dot: 'bg-sky-400', border: 'border-l-sky-400' },
  { id: 'medium', label: 'Medium', dot: 'bg-amber-400', border: 'border-l-amber-400' },
  { id: 'high', label: 'High', dot: 'bg-orange-500', border: 'border-l-orange-500' },
  { id: 'urgent', label: 'Urgent', dot: 'bg-red-500', border: 'border-l-red-500' }
];

function typeMeta(id) {
  return TYPES.find((t) => t.id === id) || TYPES[0];
}
function priorityMeta(id) {
  return PRIORITIES.find((p) => p.id === id) || PRIORITIES[0];
}

function uniqueSubjectsFromTimetable() {
  const entries = getTimetable();
  const seen = new Map();
  entries.forEach((e) => {
    const label = e.courseCode ? `${e.courseCode} \u2014 ${e.courseName}` : e.courseName;
    if (label && !seen.has(label)) seen.set(label, label);
  });
  return Array.from(seen.values()).sort();
}

function subtaskProgress(subtasks) {
  if (!subtasks || subtasks.length === 0) return null;
  const done = subtasks.filter((s) => s.done).length;
  return { done, total: subtasks.length, pct: Math.round((done / subtasks.length) * 100) };
}

function emptyForm(subjectOptions, prefillTitle = '') {
  return {
    title: prefillTitle,
    type: 'task',
    priority: '',
    subject: '',
    customSubject: '',
    hasDeadline: false,
    dueDate: '',
    dueTime: '23:59',
    reminders: [],
    subtasks: [],
    details: ''
  };
}

function ItemFormModal({ item, subjectOptions, onClose, onSave }) {
  const initial = item
    ? {
        title: item.title,
        type: item.type,
        priority: item.priority || '',
        subject: item.subject && subjectOptions.includes(item.subject) ? item.subject : item.subject ? CUSTOM_SUBJECT : '',
        customSubject: item.subject && !subjectOptions.includes(item.subject) ? item.subject : '',
        hasDeadline: !!item.dueAt,
        dueDate: item.dueAt ? item.dueAt.slice(0, 10) : '',
        dueTime: item.dueAt ? item.dueAt.slice(11, 16) : '23:59',
        reminders: item.reminders || [],
        subtasks: item.subtasks || [],
        details: item.details || ''
      }
    : emptyForm(subjectOptions);

  const [form, setForm] = useState(initial);
  const [subtaskDraft, setSubtaskDraft] = useState('');

  const toggleReminder = (minutes) => {
    setForm((f) => ({
      ...f,
      reminders: f.reminders.includes(minutes) ? f.reminders.filter((m) => m !== minutes) : [...f.reminders, minutes].sort((a, b) => a - b)
    }));
  };

  const addSubtask = () => {
    const text = subtaskDraft.trim();
    if (!text) return;
    setForm((f) => ({ ...f, subtasks: [...f.subtasks, { id: `${Date.now()}`, text, done: false }] }));
    setSubtaskDraft('');
  };

  const removeSubtask = (id) => setForm((f) => ({ ...f, subtasks: f.subtasks.filter((s) => s.id !== id) }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      alert('Write something first \u2014 that\u2019s the one required field.');
      return;
    }
    let dueAt = null;
    if (form.hasDeadline) {
      if (!form.dueDate) {
        alert('Pick a date, or turn off "Set a deadline".');
        return;
      }
      dueAt = new Date(`${form.dueDate}T${form.dueTime || '23:59'}:00`).toISOString();
    }
    const subject = form.subject === CUSTOM_SUBJECT ? form.customSubject.trim() : form.subject;

    onSave({
      title: form.title.trim(),
      type: form.type,
      priority: form.priority,
      subject,
      dueAt,
      reminders: form.hasDeadline ? form.reminders : [],
      subtasks: form.subtasks,
      details: form.details.trim()
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{item ? 'Edit' : 'Capture something'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <textarea
              autoFocus
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              rows={form.type === 'note' ? 10 : 2}
              className={`input-field text-base whitespace-pre-wrap ${form.type === 'note' ? 'resize-y' : 'resize-none'}`}
              placeholder={
                form.type === 'note'
                  ? "Write your note here \u2014 press Enter for a new line, leave a blank line between paragraphs. As long as you like."
                  : "What's on your mind? A task, a note, a question, an idea..."
              }
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">What kind of thing is this?</label>
            <div className="grid grid-cols-4 gap-2">
              {TYPES.map((t) => {
                const Icon = t.icon;
                const active = form.type === t.id;
                return (
                  <button
                    type="button"
                    key={t.id}
                    onClick={() => setForm({ ...form, type: t.id })}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-xs ${active ? t.bg + ' ' + t.color : 'border-gray-200 dark:border-gray-800 text-gray-400'}`}
                  >
                    <Icon className="w-4 h-4" />
                    {t.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5" /> Priority (optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {PRIORITIES.map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setForm({ ...form, priority: p.id })}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs ${
                    form.priority === p.id ? 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-100' : 'border-gray-200 dark:border-gray-800 text-gray-400'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full ${p.dot}`} />
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Course / subject (optional)</label>
            <select value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field">
              <option value="">Not tied to a course</option>
              {subjectOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value={CUSTOM_SUBJECT}>Type manually...</option>
            </select>
            {form.subject === CUSTOM_SUBJECT && (
              <input value={form.customSubject} onChange={(e) => setForm({ ...form, customSubject: e.target.value })} className="input-field mt-2" placeholder="e.g. Personal" />
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Set a deadline & reminders (optional)</span>
              <input type="checkbox" checked={form.hasDeadline} onChange={(e) => setForm({ ...form, hasDeadline: e.target.checked })} />
            </label>
            {form.hasDeadline && (
              <div className="mt-3 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <input type="date" required value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input-field" />
                  <input type="time" required value={form.dueTime} onChange={(e) => setForm({ ...form, dueTime: e.target.value })} className="input-field" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><BellRing className="w-3.5 h-3.5" /> Remind me</p>
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
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5 flex items-center gap-1.5">
              <ListPlus className="w-3.5 h-3.5" /> Break it into steps (optional)
            </label>
            <div className="space-y-1.5 mb-2">
              {form.subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2 text-sm bg-gray-50 dark:bg-gray-800/60 rounded-lg px-3 py-1.5">
                  <span className="flex-1 truncate">{s.text}</span>
                  <button type="button" onClick={() => removeSubtask(s.id)} className="text-gray-400 hover:text-red-500">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                className="input-field flex-1"
                placeholder="Add a step and press Enter"
              />
              <button type="button" onClick={addSubtask} className="btn-secondary px-3">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Extra details / notes (optional)</label>
            <textarea value={form.details} onChange={(e) => setForm({ ...form, details: e.target.value })} rows={3} className="input-field resize-none" placeholder="Links, context, whatever helps future-you" />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ItemCard({ item, onToggleStatus, onToggleSubtask, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(false);
  const type = typeMeta(item.type);
  const Icon = type.icon;
  const priority = priorityMeta(item.priority);
  const progress = subtaskProgress(item.subtasks);
  const overdue = item.dueAt && new Date(item.dueAt) < new Date() && item.status !== 'done';
  const done = item.status === 'done';
  const isLongNote = item.type === 'note' && (item.title.includes('\n') || item.title.length > 220);

  return (
    <div className={`card p-4 border-l-4 ${priority.border || 'border-l-transparent'} ${done ? 'opacity-60' : ''}`}>
      <div className="flex items-start gap-3">
        <button onClick={() => onToggleStatus(item)} className="mt-0.5 shrink-0 text-gray-300 hover:text-emerald-500">
          {done ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5" />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium ${type.color}`}>
              <Icon className="w-3 h-3" /> {type.label}
            </span>
            {item.subject && <span className="text-[11px] text-gray-400">{item.subject}</span>}
          </div>

          <p
            className={`text-sm font-medium whitespace-pre-wrap break-words ${done ? 'line-through text-gray-400' : ''}`}
            style={isLongNote && !expanded ? { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
          >
            {item.title}
          </p>

          {item.dueAt && (
            <p className={`text-xs mt-1 font-medium ${overdue ? 'text-red-500' : 'text-gray-400'}`}>
              {overdue ? 'Overdue \u2014 ' : 'Due '}{new Date(item.dueAt).toLocaleString()}
            </p>
          )}

          {progress && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-[11px] text-gray-400 mb-1">
                <span>{progress.done}/{progress.total} steps</span>
                <span>{progress.pct}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div className="h-full bg-brand-500 rounded-full transition-all" style={{ width: `${progress.pct}%` }} />
              </div>
            </div>
          )}

          {(item.subtasks?.length > 0 || item.details || isLongNote) && (
            <button onClick={() => setExpanded((e) => !e)} className="mt-2 text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex items-center gap-1">
              {expanded
                ? <><ChevronUp className="w-3.5 h-3.5" /> {isLongNote ? 'Show less' : 'Hide details'}</>
                : <><ChevronDown className="w-3.5 h-3.5" /> {isLongNote ? 'Show full note' : 'Show details'}</>}
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-2">
              {item.subtasks?.length > 0 && (
                <div className="space-y-1">
                  {item.subtasks.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={s.done} onChange={() => onToggleSubtask(item, s.id)} />
                      <span className={s.done ? 'line-through text-gray-400' : ''}>{s.text}</span>
                    </label>
                  ))}
                </div>
              )}
              {item.details && <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{item.details}</p>}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => onEdit(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950">
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => onDelete(item)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Capture() {
  const [items, setItems] = useState(getAllCaptureItems());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [quickText, setQuickText] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showDone, setShowDone] = useState(false);

  const subjectOptions = useMemo(() => uniqueSubjectsFromTimetable(), []);
  const refresh = () => setItems(getAllCaptureItems());

  const handleQuickAdd = (e) => {
    e.preventDefault();
    const title = quickText.trim();
    if (!title) return;
    addCaptureItem({ title, type: 'task' });
    setQuickText('');
    refresh();
  };

  const handleSave = async (form) => {
    if (editingItem) {
      await cancelRemindersForDeadline(editingItem);
      const updated = updateCaptureItem(editingItem.id, form);
      if (updated?.dueAt) await scheduleRemindersForDeadline(updated);
    } else {
      const created = addCaptureItem(form);
      if (created.dueAt) await scheduleRemindersForDeadline(created);
    }
    refresh();
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleToggleStatus = (item) => {
    updateCaptureItem(item.id, { status: item.status === 'done' ? 'open' : 'done' });
    refresh();
  };

  const handleToggleSubtask = (item, subtaskId) => {
    const subtasks = item.subtasks.map((s) => (s.id === subtaskId ? { ...s, done: !s.done } : s));
    updateCaptureItem(item.id, { subtasks });
    refresh();
  };

  const handleDelete = async () => {
    await cancelRemindersForDeadline(deleteTarget);
    deleteCaptureItem(deleteTarget.id);
    refresh();
    setDeleteTarget(null);
  };

  const priorityRank = { urgent: 0, high: 1, medium: 2, low: 3, '': 4 };
  const filtered = items
    .filter((i) => typeFilter === 'all' || i.type === typeFilter)
    .filter((i) => showDone || i.status !== 'done');
  const sorted = [...filtered].sort((a, b) => {
    if ((a.status === 'done') !== (b.status === 'done')) return a.status === 'done' ? 1 : -1;
    if (!!a.dueAt !== !!b.dueAt) return a.dueAt ? -1 : 1;
    if (a.dueAt && b.dueAt) return new Date(a.dueAt) - new Date(b.dueAt);
    if (priorityRank[a.priority] !== priorityRank[b.priority]) return priorityRank[a.priority] - priorityRank[b.priority];
    return new Date(b.createdAt) - new Date(a.createdAt);
  });

  const openItems = items.filter((i) => i.status !== 'done');
  const overdueCount = openItems.filter((i) => i.dueAt && new Date(i.dueAt) < new Date()).length;
  const urgentCount = openItems.filter((i) => i.priority === 'urgent' || i.priority === 'high').length;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-500" /> Capture
        </h1>
        <p className="text-sm text-gray-400 mt-1">Tasks, notes, questions, ideas — anything you don't want to forget. Sort it out later.</p>
      </div>

      <form onSubmit={handleQuickAdd} className="card p-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
        <input
          value={quickText}
          onChange={(e) => setQuickText(e.target.value)}
          className="w-full sm:flex-1 bg-transparent border-none focus:outline-none text-sm px-2 py-1"
          placeholder="Quick capture — type and hit Enter..."
        />
        <div className="flex items-center gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              setEditingItem(null);
              setModalOpen(true);
            }}
            className="btn-secondary text-xs px-3 py-1.5 shrink-0"
          >
            Add details
          </button>
          <button type="submit" className="btn-primary text-xs px-3 py-1.5 shrink-0 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </form>

      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold">{openItems.length}</p>
          <p className="text-xs text-gray-400 mt-1">Open</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-red-500">{overdueCount}</p>
          <p className="text-xs text-gray-400 mt-1">Overdue</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-semibold text-orange-500">{urgentCount}</p>
          <p className="text-xs text-gray-400 mt-1">High / urgent</p>
        </div>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setTypeFilter('all')}
            className={`text-xs px-3 py-1.5 rounded-full border ${typeFilter === 'all' ? 'border-gray-800 dark:border-gray-200 text-gray-800 dark:text-gray-100' : 'border-gray-200 dark:border-gray-800 text-gray-400'}`}
          >
            All
          </button>
          {TYPES.map((t) => (
            <button
              key={t.id}
              onClick={() => setTypeFilter(t.id)}
              className={`text-xs px-3 py-1.5 rounded-full border flex items-center gap-1 ${typeFilter === t.id ? t.bg + ' ' + t.color : 'border-gray-200 dark:border-gray-800 text-gray-400'}`}
            >
              <t.icon className="w-3 h-3" /> {t.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-gray-400 cursor-pointer">
          <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} /> Show completed
        </label>
      </div>

      {sorted.length === 0 ? (
        <div className="card p-10 text-center">
          <Sparkles className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Nothing here yet.</p>
          <p className="text-sm text-gray-400 mt-1">Use the box above to capture a task, note, question, or idea.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sorted.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              onToggleStatus={handleToggleStatus}
              onToggleSubtask={handleToggleSubtask}
              onEdit={(i) => {
                setEditingItem(i);
                setModalOpen(true);
              }}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {modalOpen && (
        <ItemFormModal
          item={editingItem}
          subjectOptions={subjectOptions}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && <ConfirmDialog title="Delete this?" message="This can't be undone." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
