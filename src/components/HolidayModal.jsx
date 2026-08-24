import { useState } from 'react';
import { X, Sun } from 'lucide-react';

const toDateInput = (date) => {
  const d = date ? new Date(date) : new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

/**
 * Mark a day as a holiday and credit the configured stipulated hours to it,
 * with no sign-in/sign-out required.
 * props: defaultDate, holidayHours, onClose, onConfirm(date, hours, notes)
 */
export default function HolidayModal({ defaultDate, holidayHours, onClose, onConfirm }) {
  const [date, setDate] = useState(toDateInput(defaultDate));
  const [hours, setHours] = useState(holidayHours);
  const [notes, setNotes] = useState('Holiday');

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({ date, hours: Number(hours), notes });
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
          No sign-in/sign-out needed. The stipulated hours below will be credited to this day automatically.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
            <input type="date" required value={date} onChange={(e) => setDate(e.target.value)} className="input-field" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Hours to credit</label>
            <input type="number" min="0" step="0.5" required value={hours} onChange={(e) => setHours(e.target.value)} className="input-field" />
            <p className="text-xs text-gray-400 mt-1">Default comes from Settings &rarr; Holiday Hours. You can override it here just for this day.</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="input-field" placeholder="e.g. Diwali, Public Holiday" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Credit Hours</button>
          </div>
        </form>
      </div>
    </div>
  );
}
