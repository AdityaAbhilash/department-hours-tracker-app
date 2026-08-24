import { useState, useEffect } from 'react';
import { formatClock, formatTime } from '../utils/formatters';
import { LogOut } from 'lucide-react';

export default function LiveTimer({ signInTime, onSignOut }) {
  const [elapsedSeconds, setElapsedSeconds] = useState(() => Math.max(Math.floor((Date.now() - new Date(signInTime).getTime()) / 1000), 0));

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.max(Math.floor((Date.now() - new Date(signInTime).getTime()) / 1000), 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [signInTime]);

  return (
    <div className="card p-5 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-gray-900 border-emerald-100 dark:border-emerald-900">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-1">Currently in department</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Entered at {formatTime(signInTime)}</p>
          <p className="text-3xl font-bold tracking-tight tabular-nums text-gray-900 dark:text-gray-50">{formatClock(elapsedSeconds)}</p>
        </div>
        <button onClick={onSignOut} className="btn-danger flex items-center gap-2">
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
