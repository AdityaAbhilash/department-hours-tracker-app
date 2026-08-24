import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, X, Link2, ExternalLink, Star } from 'lucide-react';
import { getAllLinks, addLink, updateLink, deleteLink } from '../store/db';
import ConfirmDialog from '../components/ConfirmDialog';

const SEMESTERS = [1, 2, 3, 4];
const emptyForm = { title: '', url: '', semester: 1, category: '', isMajor: false };

function LinkFormModal({ link, onClose, onSave }) {
  const [form, setForm] = useState(link || emptyForm);

  const handleSubmit = (e) => {
    e.preventDefault();
    let url = form.url.trim();
    if (url && !/^https?:\/\//i.test(url)) url = `https://${url}`;
    onSave({ ...form, url, semester: Number(form.semester) });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full md:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl md:rounded-3xl shadow-xl p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-lg">{link ? 'Edit Link' : 'Add Link'}</h3>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Title</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="Embedded Systems - Lecture 3 (YouTube)" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">URL</label>
            <input required value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="input-field" placeholder="https://youtube.com/watch?v=..." />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Semester</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="input-field" disabled={form.isMajor}>
                {SEMESTERS.map((s) => (
                  <option key={s} value={s}>Semester {s}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Category</label>
              <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input-field" placeholder="YouTube, Notes..." />
            </div>
          </div>

          <label className="flex items-center gap-2.5 text-sm">
            <input type="checkbox" checked={form.isMajor} onChange={(e) => setForm({ ...form, isMajor: e.target.checked })} className="w-4 h-4 rounded accent-brand-500" />
            <span>Mark as major / important <span className="text-gray-400">(shown in every semester)</span></span>
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" className="btn-primary flex-1">Save Link</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LinkRow({ link, onEdit, onDelete }) {
  return (
    <div className="card p-4 flex items-center justify-between gap-3">
      <a href={link.url} target="_blank" rel="noopener noreferrer" className="min-w-0 flex-1 flex items-center gap-3 group">
        <div className="p-2 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 shrink-0">
          <ExternalLink className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate group-hover:underline flex items-center gap-1.5">
            {link.isMajor && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0" />}
            {link.title}
          </p>
          <p className="text-xs text-gray-400 truncate">{link.category || link.url}</p>
        </div>
      </a>
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onEdit(link)} className="p-1.5 rounded-lg text-gray-400 hover:text-brand-600 hover:bg-brand-50 dark:hover:bg-brand-950">
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button onClick={() => onDelete(link)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

export default function Links() {
  const [links, setLinks] = useState(getAllLinks());
  const [activeSemester, setActiveSemester] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    setLinks(getAllLinks());
  }, []);

  const handleSave = (form) => {
    if (editingLink) updateLink(editingLink.id, form);
    else addLink(form);
    setLinks(getAllLinks());
    setModalOpen(false);
    setEditingLink(null);
  };

  const handleDelete = () => {
    deleteLink(deleteTarget.id);
    setLinks(getAllLinks());
    setDeleteTarget(null);
  };

  const majorLinks = links.filter((l) => l.isMajor);
  const semesterLinks = links.filter((l) => !l.isMajor && Number(l.semester) === activeSemester);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Links</h1>
          <p className="text-sm text-gray-400 mt-1">Save study links by semester — lecture videos, notes, anything.</p>
        </div>
        <button
          onClick={() => {
            setEditingLink(null);
            setModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2 text-sm"
        >
          <Plus className="w-4 h-4" /> Add Link
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {SEMESTERS.map((s) => (
          <button
            key={s}
            onClick={() => setActiveSemester(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeSemester === s ? 'bg-brand-500 text-white' : 'bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300'
            }`}
          >
            Semester {s}
          </button>
        ))}
      </div>

      {majorLinks.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Major / Important &mdash; shown every semester
          </h3>
          {majorLinks.map((link) => (
            <LinkRow key={link.id} link={link} onEdit={(l) => { setEditingLink(l); setModalOpen(true); }} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Semester {activeSemester}</h3>
        {semesterLinks.length === 0 ? (
          <div className="card p-8 text-center">
            <Link2 className="w-7 h-7 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No links saved for Semester {activeSemester} yet.</p>
          </div>
        ) : (
          semesterLinks.map((link) => (
            <LinkRow key={link.id} link={link} onEdit={(l) => { setEditingLink(l); setModalOpen(true); }} onDelete={setDeleteTarget} />
          ))
        )}
      </div>

      {modalOpen && (
        <LinkFormModal
          link={editingLink || { ...emptyForm, semester: activeSemester }}
          onClose={() => {
            setModalOpen(false);
            setEditingLink(null);
          }}
          onSave={handleSave}
        />
      )}
      {deleteTarget && <ConfirmDialog title="Delete this link?" message="This will permanently remove this saved link." onConfirm={handleDelete} onCancel={() => setDeleteTarget(null)} />}
    </div>
  );
}
