import { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Check, Download, Upload, Trash2, BellRing } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useSettings } from '../hooks/useSettings';
import { useTheme } from '../hooks/useTheme';
import { exportAllData, importAllData, clearAllData } from '../store/db';
import { checkExactAlarmStatus, resyncAllReminders } from '../utils/notifications';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Settings() {
  const { settings, update } = useSettings();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: settings.name,
    studentId: settings.studentId,
    department: settings.department,
    weeklyTargetHours: settings.weeklyTargetHours,
    monthlyTargetHours: settings.monthlyTargetHours,
    holidayHours: settings.holidayHours
  });
  const [success, setSuccess] = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [importMessage, setImportMessage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    update({
      name: form.name,
      studentId: form.studentId,
      department: form.department,
      weeklyTargetHours: Number(form.weeklyTargetHours),
      monthlyTargetHours: Number(form.monthlyTargetHours),
      holidayHours: Number(form.holidayHours)
    });
    setSuccess(true);
    setTimeout(() => setSuccess(false), 2500);
  };

  const handleThemeChange = (value) => {
    setTheme(value);
    update({ theme: value });
  };

  const [exporting, setExporting] = useState(false);
  const [exactAlarmStatus, setExactAlarmStatus] = useState('unknown');
  const [resyncing, setResyncing] = useState(false);
  const [resyncMessage, setResyncMessage] = useState('');

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      checkExactAlarmStatus().then(setExactAlarmStatus);
    }
  }, []);

  const handleResync = async () => {
    setResyncing(true);
    setResyncMessage('');
    try {
      await resyncAllReminders();
      setResyncMessage('All upcoming reminders have been re-scheduled.');
    } finally {
      setResyncing(false);
    }
  };

  const handleExportData = async () => {
    const data = exportAllData();
    const json = JSON.stringify(data, null, 2);
    const fileName = `department-hours-backup-${new Date().toISOString().slice(0, 10)}.json`;

    if (Capacitor.isNativePlatform()) {
      // A blob <a download> link (the old approach) silently does nothing
      // inside the Android WebView — there's no browser chrome to catch the
      // download. Instead, write the file to the device and hand it to the
      // native Share sheet so the user can save it to Drive, Files, email
      // it to themselves, etc.
      setExporting(true);
      try {
        const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
        const { Share } = await import('@capacitor/share');
        const written = await Filesystem.writeFile({
          path: fileName,
          data: json,
          directory: Directory.Cache,
          encoding: Encoding.UTF8
        });
        await Share.share({
          title: 'Department Hours backup',
          text: 'Your Department Hours Tracker backup file.',
          url: written.uri
        });
      } catch (err) {
        console.error('Export failed', err);
        alert('Could not create the backup file. Please try again.');
      } finally {
        setExporting(false);
      }
      return;
    }

    // Plain-browser fallback (e.g. `npm run dev`), where the blob-link
    // approach works fine.
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => fileInputRef.current?.click();

  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        importAllData(data);
        setImportMessage('Backup restored successfully. Reload the app to see your data.');
      } catch (err) {
        setImportMessage('That file could not be read. Make sure it\u2019s a backup exported from this app.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleClearAll = () => {
    clearAllData();
    setClearConfirm(false);
    window.location.reload();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Profile</h3>

        {success && (
          <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-2 rounded-xl">
            <Check className="w-4 h-4" /> Settings saved
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Name</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Student ID</label>
            <input value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Department</label>
            <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input-field" />
          </div>
        </div>

        <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Targets</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Weekly target (hours)</label>
              <input type="number" min="1" value={form.weeklyTargetHours} onChange={(e) => setForm({ ...form, weeklyTargetHours: e.target.value })} className="input-field" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Monthly target (hours)</label>
              <input type="number" min="1" value={form.monthlyTargetHours} onChange={(e) => setForm({ ...form, monthlyTargetHours: e.target.value })} className="input-field" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1.5">Holiday hours (auto-credited per holiday)</label>
            <input type="number" min="0" step="0.5" value={form.holidayHours} onChange={(e) => setForm({ ...form, holidayHours: e.target.value })} className="input-field max-w-[160px]" />
            <p className="text-xs text-gray-400 mt-1">Used as the default when you tap "Mark Holiday" on the Dashboard or History page.</p>
          </div>
        </div>

        <button type="submit" className="btn-primary w-full">Save Changes</button>
      </form>

      <div className="card p-6">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Theme</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => handleThemeChange('light')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${theme === 'light' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-gray-100 dark:border-gray-800'}`}
          >
            <Sun className="w-4 h-4" /> Light
          </button>
          <button
            onClick={() => handleThemeChange('dark')}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-colors ${theme === 'dark' ? 'border-brand-500 bg-brand-50 dark:bg-brand-950' : 'border-gray-100 dark:border-gray-800'}`}
          >
            <Moon className="w-4 h-4" /> Dark
          </button>
        </div>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Notifications & Reminders</h3>
          <p className="text-sm text-gray-400 mt-1">
            If reminders set far in advance aren't arriving on time, Android is likely delaying or dropping them in the background.
          </p>
        </div>

        {exactAlarmStatus === 'denied' && (
          <div className="text-sm text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-950 px-3 py-2.5 rounded-xl">
            Exact alarms appear to be off for this app. For reminders to arrive on time, go to <strong>Settings → Apps → Department Hours Tracker → Alarms & reminders</strong> and allow it, and set <strong>Battery → Unrestricted</strong>.
          </div>
        )}

        {resyncMessage && <div className="text-sm text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-3 py-2 rounded-xl">{resyncMessage}</div>}

        <button onClick={handleResync} disabled={resyncing} className="btn-secondary w-full flex items-center justify-center gap-2 text-sm disabled:opacity-60">
          <BellRing className="w-4 h-4" /> {resyncing ? 'Re-syncing...' : 'Re-sync All Reminders'}
        </button>
        <p className="text-xs text-gray-400">
          This re-schedules every upcoming reminder. It runs automatically each time you open the app, but you can also run it manually if a reminder didn't arrive.
        </p>
      </div>

      <div className="card p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-gray-800 dark:text-gray-100">Data & Backup</h3>
          <p className="text-sm text-gray-400 mt-1">
            Everything is stored only on this phone. Back up regularly, especially before reinstalling the app or switching phones.
          </p>
        </div>

        {importMessage && <div className="text-sm text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-3 py-2 rounded-xl">{importMessage}</div>}

        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleExportData} disabled={exporting} className="btn-secondary flex items-center justify-center gap-2 text-sm disabled:opacity-60">
            <Download className="w-4 h-4" /> {exporting ? 'Preparing...' : 'Backup Data'}
          </button>
          <button onClick={handleImportClick} className="btn-secondary flex items-center justify-center gap-2 text-sm">
            <Upload className="w-4 h-4" /> Restore Backup
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImportFile} className="hidden" />

        <button onClick={() => setClearConfirm(true)} className="btn-danger w-full flex items-center justify-center gap-2 text-sm">
          <Trash2 className="w-4 h-4" /> Clear All Data
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 dark:text-gray-600 pt-2">
        Build: {typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'unknown'}
      </p>

      {clearConfirm && (
        <ConfirmDialog
          title="Clear all data?"
          message="This permanently deletes every session, exam, timetable entry, link, and setting stored on this phone. This cannot be undone — back up first if you're unsure."
          confirmLabel="Clear Everything"
          onConfirm={handleClearAll}
          onCancel={() => setClearConfirm(false)}
        />
      )}
    </div>
  );
}
