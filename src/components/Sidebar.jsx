import { NavLink } from 'react-router-dom';
import { LayoutDashboard, History, BarChart3, Settings, X, Clock, CalendarClock, FileQuestion, Link2, ClipboardList } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/history', label: 'History', icon: History },
  { to: '/timetable', label: 'Timetable', icon: CalendarClock },
  { to: '/exams', label: 'Exams', icon: FileQuestion },
  { to: '/deadlines', label: 'Deadlines', icon: ClipboardList },
  { to: '/links', label: 'Links', icon: Link2 },
  { to: '/statistics', label: 'Statistics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings }
];

export default function Sidebar({ mobileOpen, onClose, userName, department }) {
  const content = (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 px-5 py-6">
        <div className="w-9 h-9 rounded-xl bg-brand-500 flex items-center justify-center">
          <Clock className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-sm leading-tight">Department Hours</p>
          <p className="text-xs text-gray-400">Tracker</p>
        </div>
        <button onClick={onClose} className="ml-auto md:hidden p-1 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`
            }
          >
            <Icon className="w-4.5 h-4.5" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-5 pt-3 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900 text-brand-700 dark:text-brand-300 flex items-center justify-center text-sm font-semibold">
            {userName?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">{userName || 'Student'}</p>
            <p className="text-xs text-gray-400 truncate">{department || 'Set up in Settings'}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shrink-0">
        {content}
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-900 shadow-xl">{content}</aside>
        </div>
      )}
    </>
  );
}
