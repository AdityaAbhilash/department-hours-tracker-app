import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { calculateDuration } from '../utils/durationUtils';

const toTimeInput = (dateInput) => {
  if (!dateInput) return '';
  const d = new Date(dateInput);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const toDateInput = (dateInput) => {
  const d = dateInput ? new Date(dateInput) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function SessionFormModal({ session, onClose, onSave, error }) {
  const [form, setForm] = useState({
    date: toDateInput(session?.date),
    signInTime: toTimeInput(session?.signInTime) || '09:00',
    signOutTime: toTimeInput(session?.signOutTime),
    notes: session?.notes || ''
  });

  useEffect(() => {
    setForm({
      date: toDateInput(session?.date),
      signInTime: toTimeInput(session?.signInTime) || '09:00',
      signOutTime: toTimeInput(session?.signOutTime),
      notes: session?.notes || ''
    });
  }, [session]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const signInTime = new Date(`${form.date}T${form.signInTime}:00`);
    const signOutTime = form.signOutTime ? new Date(`${form.date}T${form.signOutTime}:00`) : null;
    onSave({
      date: form.date,
      signInTime: signInTime.toISOString(),
      signOutTime: signOutTime ? signOutTime.toISOString() : null,
      durationMinutes: signOutTime ? calculateDuration(signInTime.toISOString(), signOutTime.toISOString()) : null,
      notes: form.notes,
      isHoliday: false
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{session ? 'Edit Session' : 'Add Session'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-xl">{error}</div>}

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sign in</label>
              <input type="time" required value={form.signInTime} onChange={(e) => setForm({ ...form, signInTime: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Sign out</label>
              <input type="time" value={form.signOutTime} onChange={(e) => setForm({ ...form, signOutTime: e.target.value })} className="input-field" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Optional" className="input-field resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Session</button>
          </div>
        </form>
      </div>
    </div>
  );
}
