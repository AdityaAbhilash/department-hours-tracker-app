import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, FileQuestion, MapPin, Clock3, Armchair } from 'lucide-react';
import { getAllExams, addExam, updateExam, deleteExam } from '../store/db';
import { formatDate } from '../utils/formatters';
import ConfirmDialog from '../components/ConfirmDialog';

const emptyForm = { subject: '', date: '', time: '', roomNo: '', seatNo: '', notes: '' };

function ExamFormModal({ exam, onClose, onSave }) {
  const [form, setForm] = useState(exam || emptyForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{exam ? 'Edit Exam' : 'Add Exam'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Subject / Course</label>
            <input required value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input-field" placeholder="E3 257 - Embedded System Design" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Date</label>
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Time</label>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input-field" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Room No.</label>
              <input value={form.roomNo} onChange={(e) => setForm({ ...form, roomNo: e.target.value })} className="input-field" placeholder="CR 137" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Seat No.</label>
              <input value={form.seatNo} onChange={(e) => setForm({ ...form, seatNo: e.target.value })} className="input-field" placeholder="A-14" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="input-field resize-none" placeholder="Bring calculator, open book, etc." />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Exam</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Exams() {
  const [exams, setExams] = useState(getAllExams());
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setExams(getAllExams());
  }, []);

  const handleSave = (form) => {
    if (editingExam) updateExam(editingExam.id, form);
    else addExam(form);
    setExams(getAllExams());
    setModalOpen(false);
    setEditingExam(null);
  };

  const handleDelete = () => {
    deleteExam(deleteTarget.id);
    setExams(getAllExams());
    setDeleteTarget(null);
  };

  const sorted = [...exams].sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));
  const todayStr = new Date().toISOString().slice(0, 10);
  const upcoming = sorted.filter((e) => e.date >= todayStr);
  const past = sorted.filter((e) => e.date < todayStr).reverse();

  const ExamCard = ({ exam, faded }) => (
    <div className={`card p-4 flex items-start justify-between gap-3 ${faded ? 'opacity-60' : ''}`}>
      <div className="min-w-0">
        <p className="font-semibold text-sm truncate">{exam.subject}</p>
        <p className="text-xs text-gray-400 mt-1">{formatDate(exam.date)}</p>
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
          {exam.time && (
            <span className="flex items-center gap-1">
              <Clock3 className="w-3.5 h-3.5" /> {exam.time}
            </span>
          )}
          {exam.roomNo && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {exam.roomNo}
            </span>
          )}
          {exam.seatNo && (
            <span className="flex items-center gap-1">
              <Armchair className="w-3.5 h-3.5" /> Seat {exam.seatNo}
            </span>
          )}
        </div>
        {exam.notes && <p className="text-xs text-gray-400 mt-2">{exam.notes}</p>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => {
            setEditingExam(exam);
            setModalOpen(true);
          }}
          className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => setDeleteTarget(exam)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Exams</h1>
        <button
          onClick={() => {
            setEditingExam(null);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Exam
        </button>
      </div>

      {exams.length === 0 ? (
        <div className="card p-10 text-center">
          <FileQuestion className="w-8 h-8 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">No exams added yet.</p>
          <p className="text-sm text-gray-400 mt-1">Add exam date, room, and seat number so it's all in one place.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {upcoming.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Upcoming ({upcoming.length})</h3>
              {upcoming.map((exam) => (
                <ExamCard key={exam.id} exam={exam} />
              ))}
            </div>
          )}
          {past.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Past ({past.length})</h3>
              {past.map((exam) => (
                <ExamCard key={exam.id} exam={exam} faded />
              ))}
            </div>
          )}
        </div>
      )}

      {modalOpen && (
        <ExamFormModal
          exam={editingExam}
          onClose={() => {
            setModalOpen(false);
            setEditingExam(null);
          }}
          onSave={handleSave}
        />
      )}
      {deleteTarget && <ConfirmDialog title="Delete this exam?" message="This will permanently remove this exam entry." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
