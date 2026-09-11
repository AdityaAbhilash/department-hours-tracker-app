import { useState } from 'react';
import { X, Sun } from 'lucide-react';

const toDateInput = (date) => {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Marks a date as a non-working day (holiday). This no longer credits any
 * hours — it just excludes that date from the working-day count used to
 * compute how many hours are needed for the week/month. You can still sign
 * in/out on a marked date and those hours will count as worked as normal.
 * props: defaultDate, onClose, onConfirm({ date, notes })
 */
export default function HolidayModal({ defaultDate, onClose, onConfirm }) {
  const [date, setDate] = useState(toDateInput(defaultDate));
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ date, notes });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <Sun className="w-5 h-5 text-orange-500" /> Mark as Holiday
          </h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          This marks the date as a non-working day, so it won't count toward the hours needed for that week or month. You can still sign in and out on this date if you do work — those hours will still be recorded.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Notes (optional)</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="e.g. Diwali, Public Holiday" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Mark Holiday</button>
          </div>
        </form>
      </div>
    </div>
  );
}
