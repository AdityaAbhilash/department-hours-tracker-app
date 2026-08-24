import { useState, useEffect } from 'react';
import { Download, Clock, TrendingUp, Zap, CalendarDays, ListChecks, Target, Award } from 'lucide-react';
import { getStatistics } from '../store/computations';
import { getAllSessions } from '../store/db';
import { formatDuration, formatDate } from '../utils/formatters';
import StatCard from '../components/StatCard';

function downloadCsv(sessions) {
  const escapeCsv = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`;
    return str;
  };

  const rows = [['Date', 'Sign In', 'Sign Out', 'Duration', 'Notes']];
  [...sessions]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .forEach((s) => {
      const dateStr = new Date(s.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
      const signInStr = s.isHoliday ? 'Holiday' : s.signInTime ? new Date(s.signInTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '';
      const signOutStr = s.isHoliday ? '-' : s.signOutTime ? new Date(s.signOutTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Active';
      const mins = s.durationMinutes || 0;
      rows.push([dateStr, signInStr, signOutStr, `${Math.floor(mins / 60)}h ${mins % 60}m`, s.notes || '']);
    });

  const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'department-hours-export.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function Statistics() {
  const [stats, setStats] = useState(getStatistics());

  useEffect(() => {
    setStats(getStatistics());
  }, []);

  const handleExport = () => downloadCsv(getAllSessions());

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-10">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Statistics</h1>
        <button onClick={handleExport} className="btn-secondary flex items-center gap-2 text-sm">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      {!stats.hasData ? (
        <div className="card p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400 font-medium">No attendance data yet.</p>
          <p className="text-sm text-gray-400 mt-1">Start your first session to begin tracking your department hours.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={Clock} label="Total Hours" value={formatDuration(stats.totalMinutes)} accent="brand" />
            <StatCard icon={TrendingUp} label="Avg Hours / Day" value={formatDuration(stats.averageMinutesPerDay)} accent="green" />
            <StatCard icon={CalendarDays} label="Avg Hours / Week" value={formatDuration(stats.averageMinutesPerWeek)} accent="orange" />
            <StatCard icon={ListChecks} label="Number of Sessions" value={stats.numberOfSessions} />
            <StatCard icon={Zap} label="Longest Session" value={stats.longestSession ? formatDuration(stats.longestSession.minutes) : '--'} subValue={stats.longestSession ? formatDate(stats.longestSession.date) : ''} />
            <StatCard icon={Award} label="Longest Day" value={formatDuration(stats.longestDay?.minutes)} subValue={stats.longestDay ? formatDate(stats.longestDay.date) : ''} />
            <StatCard icon={Target} label="Shortest Day" value={formatDuration(stats.shortestDay?.minutes)} subValue={stats.shortestDay ? formatDate(stats.shortestDay.date) : ''} />
            <StatCard icon={CalendarDays} label="Days Attended" value={stats.daysAttended} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Weekly Target Completion</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{stats.weeklyCompletionRate}%</span>
                <span className="text-sm text-gray-400 mb-1">of weeks hit {stats.weeklyTarget}h target</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-3">
                <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${stats.weeklyCompletionRate}%` }} />
              </div>
            </div>
            <div className="card p-5">
              <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">Monthly Target Completion</h3>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">{stats.monthlyCompletionRate}%</span>
                <span className="text-sm text-gray-400 mb-1">of months hit {stats.monthlyTarget}h target</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden mt-3">
                <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${stats.monthlyCompletionRate}%` }} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
