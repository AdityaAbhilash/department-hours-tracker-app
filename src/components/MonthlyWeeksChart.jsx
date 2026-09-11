import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatDuration, formatMonthLabel } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const { minutes, targetHours, startDay, endDay } = payload[0].payload;
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl px-4 py-2.5 border border-gray-100 dark:border-gray-700">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label} &middot; days {startDay}&ndash;{endDay}</p>
      <p className="font-semibold text-gray-900 dark:text-gray-50">{formatDuration(minutes)}</p>
      <p className="text-xs text-gray-400 dark:text-gray-500">Target: {targetHours}h</p>
    </div>
  );
};

export default function MonthlyWeeksChart({ monthData }) {
  if (!monthData) return null;
  const { weeklyBreakdown, monthStart } = monthData;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Hours by Week</h3>
        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{formatMonthLabel(monthStart)}</span>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={weeklyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-800" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(58,102,245,0.06)' }} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={56}>
            {weeklyBreakdown.map((entry, index) => (
              <Cell key={index} fill={entry.hours >= entry.targetHours && entry.targetHours > 0 ? '#10b981' : entry.hours > 0 ? '#3a66f5' : '#e5e7eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Month Total: <span className="font-semibold text-gray-800 dark:text-gray-100">{formatDuration(monthData.totalMinutes)}</span>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Target: <span className="font-semibold text-gray-800 dark:text-gray-100">{monthData.targetHours}h</span>
        </span>
      </div>
    </div>
  );
}
