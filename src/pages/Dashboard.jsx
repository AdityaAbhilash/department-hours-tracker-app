import { useState, useEffect, useCallback } from 'react';
import { Sun, CalendarDays, CalendarRange, Flame, TrendingUp, Timer, CalendarCheck2, LogIn, PartyPopper } from 'lucide-react';
import { getTodayData, getWeekData, getMonthData, getInsights } from '../store/computations';
import { addSession, updateSession, getActiveSession } from '../store/db';
import { calculateDuration } from '../utils/durationUtils';
import { useSettings } from '../hooks/useSettings';
import StatCard from '../components/StatCard';
import ProgressCard from '../components/ProgressCard';
import WeeklyChart from '../components/WeeklyChart';
import SessionTimeline from '../components/SessionTimeline';
import LiveTimer from '../components/LiveTimer';
import StatusBadge from '../components/StatusBadge';
import HolidayModal from '../components/HolidayModal';
import { formatDuration, greetingForTime } from '../utils/formatters';

export default function Dashboard() {
  const { settings } = useSettings();
  const [today, setToday] = useState(getTodayData());
  const [week, setWeek] = useState(getWeekData(0));
  const [month, setMonth] = useState(getMonthData(0));
  const [insights, setInsights] = useState(getInsights());
  const [weekOffset, setWeekOffset] = useState(0);
  const [holidayModalOpen, setHolidayModalOpen] = useState(false);

  const refreshAll = useCallback(() => {
    setToday(getTodayData());
    setWeek(getWeekData(weekOffset));
    setMonth(getMonthData(0));
    setInsights(getInsights());
  }, [weekOffset]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Live-refresh the "today" total every 30s while a session is active, so cards stay current
  useEffect(() => {
    if (!today.isCurrentlyIn) return undefined;
    const interval = setInterval(() => {
      setToday(getTodayData());
      setWeek(getWeekData(weekOffset));
    }, 30000);
    return () => clearInterval(interval);
  }, [today.isCurrentlyIn, weekOffset]);

  const handleSignIn = () => {
    const now = new Date();
    addSession({
      date: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
      signInTime: now.toISOString(),
      signOutTime: null,
      notes: '',
      isHoliday: false
    });
    refreshAll();
  };

  const handleSignOut = () => {
    const active = getActiveSession();
    if (!active) return;
    const signOutTime = new Date().toISOString();
    updateSession(active.id, {
      signOutTime,
      durationMinutes: calculateDuration(active.signInTime, signOutTime)
    });
    refreshAll();
  };

  const handleHolidayConfirm = ({ date, hours, notes }) => {
    addSession({ date, signInTime: null, signOutTime: null, durationMinutes: Math.round(hours * 60), notes, isHoliday: true });
    setHolidayModalOpen(false);
    refreshAll();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-10">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greetingForTime()}, {settings.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-sm text-gray-400 mt-1">Here's your department-hours overview.</p>
        </div>
        <button onClick={() => setHolidayModalOpen(true)} className="btn-secondary flex items-center gap-2 text-sm">
          <PartyPopper className="w-4 h-4 text-orange-500" /> Mark Holiday
        </button>
      </div>

      {today.isCurrentlyIn && today.activeSession && <LiveTimer signInTime={today.activeSession.signInTime} onSignOut={handleSignOut} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Sun} label="Today" value={formatDuration(today.totalMinutes)} accent="brand" />
        <StatCard
          icon={CalendarDays}
          label="This Week"
          value={`${formatDuration(week.totalMinutes)} / ${week.targetHours}h`}
          subValue={`${week.percentage}% complete`}
          accent="green"
        />
        <StatCard
          icon={CalendarRange}
          label="This Month"
          value={`${formatDuration(month.totalMinutes)} / ${month.targetHours}h`}
          subValue={`${month.percentage}% complete`}
          accent="orange"
        />
        <div className="card p-5 flex flex-col justify-between gap-3">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Current Status</span>
          <div className="space-y-1">
            <StatusBadge isCurrentlyIn={today.isCurrentlyIn} />
            {!today.isCurrentlyIn && (
              <button onClick={handleSignIn} className="mt-2 w-full btn-primary flex items-center justify-center gap-2 text-sm py-2">
                <LogIn className="w-4 h-4" /> Sign In
              </button>
            )}
          </div>
        </div>
      </div>

      <WeeklyChart data={week} offset={weekOffset} onOffsetChange={setWeekOffset} />

      <div className="grid md:grid-cols-2 gap-6">
        <ProgressCard
          title="Weekly Status"
          completedMinutes={week.totalMinutes}
          targetHours={week.targetHours}
          percentage={week.percentage}
          status={week.status}
          requiredDailyMinutes={week.requiredDailyMinutes}
          remainingDays={week.remainingDays}
        />
        <SessionTimeline sessions={today.sessions} totalMinutes={today.totalMinutes} />
      </div>

      <ProgressCard
        title="Monthly Status"
        completedMinutes={month.totalMinutes}
        targetHours={month.targetHours}
        percentage={month.percentage}
        status={month.totalMinutes >= month.targetHours * 60 ? 'completed' : 'on-track'}
        requiredDailyMinutes={month.requiredDailyMinutes}
        remainingDays={month.remainingDays}
      />

      {insights.hasData && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Quick Insights</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-start gap-2.5">
              <Flame className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Longest day</p>
                <p className="text-sm font-medium">{insights.longestDay.day} &mdash; {formatDuration(insights.longestDay.minutes)}</p>
              </div>
            </div>
            {insights.bestWeek && (
              <div className="flex items-start gap-2.5">
                <TrendingUp className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-gray-400">Best week</p>
                  <p className="text-sm font-medium">{insights.bestWeek.label} &mdash; {formatDuration(insights.bestWeek.minutes)}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2.5">
              <Timer className="w-4 h-4 text-brand-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Average daily time</p>
                <p className="text-sm font-medium">{formatDuration(insights.averageDailyMinutes)}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <CalendarCheck2 className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Days attended this month</p>
                <p className="text-sm font-medium">{insights.daysAttendedThisMonth}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {holidayModalOpen && (
        <HolidayModal
          defaultDate={new Date()}
          holidayHours={settings.holidayHours}
          onClose={() => setHolidayModalOpen(false)}
          onConfirm={handleHolidayConfirm}
        />
      )}
    </div>
  );
}
