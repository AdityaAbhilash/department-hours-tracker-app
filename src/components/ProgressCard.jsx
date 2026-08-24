import { formatDuration } from '../utils/formatters';
import { CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react';

export default function ProgressCard({ title, completedMinutes, targetHours, percentage, status, requiredDailyMinutes, remainingDays }) {
  const targetMinutes = targetHours * 60;
  const overMinutes = completedMinutes - targetMinutes;
  const isCompleted = status === 'completed';
  const isBehind = status === 'behind';
  const barColor = isCompleted ? 'bg-emerald-500' : isBehind ? 'bg-orange-500' : 'bg-brand-500';

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">{title}</h3>
        {isCompleted ? (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Completed
          </span>
        ) : isBehind ? (
          <span className="flex items-center gap-1 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950 px-2.5 py-1 rounded-full">
            <TrendingDown className="w-3.5 h-3.5" /> Behind
          </span>
        ) : (
          <span className="flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950 px-2.5 py-1 rounded-full">
            <TrendingUp className="w-3.5 h-3.5" /> On track
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold tracking-tight">{formatDuration(completedMinutes)}</span>
        <span className="text-gray-400 dark:text-gray-500 text-sm">/ {targetHours}h</span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${barColor}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">{percentage}% complete</span>
        {isCompleted ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">+{formatDuration(overMinutes)}</span>
        ) : (
          remainingDays > 0 && <span className="text-gray-500 dark:text-gray-400">{formatDuration(requiredDailyMinutes)}/day needed</span>
        )}
      </div>
    </div>
  );
}
