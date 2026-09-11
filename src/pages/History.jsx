import { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Sun } from 'lucide-react';
import { getHistoryForMonth } from '../store/computations';
import { addSession, updateSession, deleteSession, addHoliday, removeHoliday } from '../store/db';
import { formatDate, formatTime, formatDuration, formatMonthLabel } from '../utils/formatters';
import SessionFormModal from '../components/SessionFormModal';
import ConfirmDialog from '../components/ConfirmDialog';
import HolidayModal from '../components/HolidayModal';

const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export default function History() {
  const [cursor, setCursor] = useState(new Date());
  const [days, setDays] = useState([]);
  const [expandedDate, setExpandedDate] = useState(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    const data = getHistoryForMonth(monthKey(cursor));
    setDays(data.days);
  }, [cursor]);

  useEffect(() => {
    load();
  }, [load]);

  const changeMonth = (delta) => {
    setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
    setExpandedDate(null);
  };

  const openAdd = () => {
    setEditingSession(null);
    setModalOpen(true);
  };

  const openEdit = (session, date) => {
    setEditingSession({ ...session, date });
    setModalOpen(true);
  };

  const handleSave = (payload) => {
    if (editingSession) updateSession(editingSession.id, payload);
    else addSession(payload);
    setModalOpen(false);
    load();
  };

  const handleHolidayConfirm = ({ date, notes }) => {
    addHoliday(date, notes);
    setHolidayModalOpen(false);
    load();
  };

  const handleRemoveHoliday = (date) => {
    removeHoliday(date);
    load();
  };

  const handleDelete = () => {
    deleteSession(deleteTarget.id);
    setDeleteTarget(null);
    load();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">History</h1>
        <div className="flex gap-2">
          <button onClick={() => setHolidayModalOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
            <Sun className="w-4 h-4 text-orange-500" /> Mark Holiday
          </button>
          <button onClick={openAdd} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Session
          </button>
        </div>
      </div>

      <div className="card p-4 flex items-center justify-between">
        <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="font-medium">{formatMonthLabel(cursor)}</span>
        <button onClick={() => changeMonth(1)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {days.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No attendance data yet.</p>
          <p className="text-sm text-gray-400 mt-1">Start your first session to begin tracking your department hours.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {days.map((day) => (
            <div key={day.date} className="card overflow-hidden">
              <div className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <button onClick={() => setExpandedDate(expandedDate === day.date ? null : day.date)} className="text-left flex-1 min-w-0">
                  <p className="font-medium text-sm flex items-center gap-1.5">
                    {formatDate(day.date)}
                    {day.isHoliday && <Sun className="w-3.5 h-3.5 text-orange-500" />}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {day.isHoliday && !day.firstEntry
                      ? 'Holiday'
                      : `${formatTime(day.firstEntry)} \u2192 ${day.lastExit ? formatTime(day.lastExit) : 'Active'}`}
                  </p>
                </button>
                <button onClick={() => setExpandedDate(expandedDate === day.date ? null : day.date)} className="text-right shrink-0">
                  <p className="font-semibold text-sm">{formatDuration(day.totalMinutes)}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{day.numberOfSessions} entr{day.numberOfSessions !== 1 ? 'ies' : 'y'}</p>
                </button>
                {day.isHoliday && day.numberOfSessions === 0 && (
                  <button
                    onClick={() => handleRemoveHoliday(day.date)}
                    className="ml-2 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 shrink-0"
                    title="Remove holiday mark"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {expandedDate === day.date && (
                <div className="border-t border-gray-100 dark:border-gray-800 p-4 space-y-2 bg-gray-50/50 dark:bg-gray-900/50">
                  {day.sessions.map((s) => (
                    <div key={s.id} className="flex items-center justify-between text-sm py-1.5">
                      <div className="min-w-0">
                        {s.isHoliday ? (
                          <span className="flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5 text-orange-500" /> Holiday hours
                          </span>
                        ) : (
                          <span>
                            {formatTime(s.signInTime)} &rarr; {s.signOutTime ? formatTime(s.signOutTime) : 'Active'}
                          </span>
                        )}
                        <span className="text-gray-400 ml-2">{formatDuration(s.durationMinutes)}</span>
                        {s.notes && <p className="text-xs text-gray-400 truncate">{s.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!s.isHoliday && (
                          <button onClick={() => openEdit(s, day.date)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button onClick={() => setDeleteTarget(s)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {modalOpen && <SessionFormModal session={editingSession} onClose={() => setModalOpen(false)} onSave={handleSave} />}
      {holidayModalOpen && (
        <HolidayModal defaultDate={cursor} onClose={() => setHolidayModalOpen(false)} onConfirm={handleHolidayConfirm} />
      )}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete this entry?"
          message="This will permanently remove this entry and its recorded hours. This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </div>
  );
}
