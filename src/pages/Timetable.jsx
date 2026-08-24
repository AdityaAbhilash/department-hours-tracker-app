import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, RotateCcw, X, CalendarClock } from 'lucide-react';
import { getTimetable, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry, resetTimetableToDefault } from '../store/db';
import ConfirmDialog from '../components/ConfirmDialog';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const TYPE_COLORS = {
  Lecture: 'bg-brand-50 dark:bg-brand-950 text-brand-700 dark:text-brand-300 border-brand-100 dark:border-brand-900',
  Lab: 'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-100 dark:border-purple-900',
  Tutorial: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-100 dark:border-emerald-900',
  'Tutorial/Lab': 'bg-orange-50 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-100 dark:border-orange-900',
  Other: 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700'
};

const emptyForm = { day: 'Monday', startTime: '09:00', endTime: '10:00', courseCode: '', courseName: '', type: 'Lecture', room: '', instructor: '' };

function EntryFormModal({ entry, onClose, onSave }) {
  const [form, setForm] = useState(entry || emptyForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.endTime <= form.startTime) {
      alert('End time must be after start time.');
      return;
    }
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{entry ? 'Edit Class' : 'Add Class'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Day</label>
            <select value={form.day} onChange={(e) => setForm({ ...form, day: e.target.value })} className="input-field">
              {DAYS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Start time</label>
              <input type="time" required value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">End time</label>
              <input type="time" required value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Course code</label>
              <input value={form.courseCode} onChange={(e) => setForm({ ...form, courseCode: e.target.value })} className="input-field" placeholder="E3 257" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                <option>Lecture</option>
                <option>Lab</option>
                <option>Tutorial</option>
                <option>Tutorial/Lab</option>
                <option>Other</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Course name</label>
            <input required value={form.courseName} onChange={(e) => setForm({ ...form, courseName: e.target.value })} className="input-field" placeholder="Embedded System Design" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Room</label>
              <input value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })} className="input-field" placeholder="CR 137" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Instructor(s)</label>
              <input value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })} className="input-field" placeholder="Optional" />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Class</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Timetable() {
  const [entries, setEntries] = useState(getTimetable());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [resetConfirm, setResetConfirm] = useState(false);

  useEffect(() => {
    setEntries(getTimetable());
  }, []);

  const handleSave = (form) => {
    if (editingEntry) updateTimetableEntry(editingEntry.id, form);
    else addTimetableEntry(form);
    setEntries(getTimetable());
    setModalOpen(false);
    setEditingEntry(null);
  };

  const handleDelete = () => {
    deleteTimetableEntry(deleteTarget.id);
    setEntries(getTimetable());
    setDeleteTarget(null);
  };

  const handleReset = () => {
    setEntries(resetTimetableToDefault());
    setResetConfirm(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Timetable</h1>
          <p className="text-sm text-gray-400 mt-1">Fully editable — add, edit, or remove any class.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setResetConfirm(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <RotateCcw className="w-4 h-4" /> Reset to Default
          </button>
          <button
            onClick={() => {
              setEditingEntry(null);
              setModalOpen(true);
            }}
            className="btn-primary flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> Add Class
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <div className="card p-10 text-center">
          <CalendarClock className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No classes added yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add your first class, or reset to the default sample timetable.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {DAYS.filter((day) => entries.some((e) => e.day === day)).map((day) => {
            const dayEntries = entries.filter((e) => e.day === day).sort((a, b) => a.startTime.localeCompare(b.startTime));
            return (
              <div key={day} className="card p-5">
                <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">{day}</h3>
                <div className="space-y-2">
                  {dayEntries.map((e) => (
                    <div key={e.id} className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 ${TYPE_COLORS[e.type] || TYPE_COLORS.Other}`}>
                      <div className="min-w-0">
                        <p className="text-xs font-medium opacity-70">
                          {e.startTime} &ndash; {e.endTime} {e.room && `\u00b7 ${e.room}`}
                        </p>
                        <p className="text-sm font-semibold truncate">
                          {e.courseCode ? `${e.courseCode} \u2014 ` : ''}
                          {e.courseName}
                        </p>
                        <p className="text-xs opacity-70">
                          {e.type}
                          {e.instructor && ` \u00b7 ${e.instructor}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => {
                            setEditingEntry(e);
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(e)} className="p-1.5 rounded-lg hover:bg-white/60 dark:hover:bg-black/20">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalOpen && (
        <EntryFormModal
          entry={editingEntry}
          onClose={() => {
            setModalOpen(false);
            setEditingEntry(null);
          }}
          onSave={handleSave}
        />
      )}

      {deleteTarget && (
        <ConfirmDialog title="Remove this class?" message="This will remove it from your timetable." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />
      )}

      {resetConfirm && (
        <ConfirmDialog
          title="Reset timetable?"
          message="This replaces your current timetable with the default sample schedule. Any custom edits will be lost."
          confirmLabel="Reset"
          onConfirm={handleReset}
          onCancel={() => setResetConfirm(false)}
        />
      )}
    </div>
  );
}
