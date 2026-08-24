import { formatTime, formatDuration } from '../utils/formatters';
import { Clock, Sun } from 'lucide-react';

export default function SessionTimeline({ sessions, totalMinutes }) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-400" /> Today's Sessions
        </h3>
      </div>

      {sessions.length === 0 ? (
        <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">No sessions yet today. Sign in to start tracking.</div>
      ) : (
        <div className="space-y-4">
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center gap-3">
              <div className="flex flex-col items-center">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    s.isHoliday ? 'bg-orange-400' : s.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-brand-500'
                  }`}
                />
                <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mt-1" />
              </div>
              <div className="flex-1 min-w-0">
                {s.isHoliday ? (
                  <p className="text-sm font-medium flex items-center gap-1.5">
                    <Sun className="w-3.5 h-3.5 text-orange-500" /> Holiday hours credited
                  </p>
                ) : (
                  <p className="text-sm font-medium truncate">
                    {formatTime(s.signInTime)} &rarr; {s.isActive ? 'Now' : formatTime(s.signOutTime)}
                  </p>
                )}
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  {formatDuration(s.durationMinutes)}
                  {s.notes ? ` \u00b7 ${s.notes}` : ''}
                </p>
              </div>
            </div>
          ))}

          <div className="pt-3 mt-2 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
            <span className="font-semibold">{formatDuration(totalMinutes)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
