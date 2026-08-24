import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDuration, formatDateRange } from '../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const minutes = payload[0].payload.minutes;
  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl px-4 py-2.5 border border-gray-100 dark:border-gray-700">
      <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-gray-50">{formatDuration(minutes)}</p>
    </div>
  );
};

export default function WeeklyChart({ data, offset, onOffsetChange }) {
  const shortDayLabel = (day) => day.slice(0, 3);
  if (!data) return null;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100">Weekly Hours</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => onOffsetChange(offset - 1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Previous week">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-300 min-w-[130px] text-center">
            {formatDateRange(data.weekStart, data.weekEnd)}
          </span>
          <button onClick={() => onOffsetChange(offset + 1)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors" aria-label="Next week">
            <ChevronRight className="w-4 h-4" />
          </button>
          {offset !== 0 && (
            <button onClick={() => onOffsetChange(0)} className="text-xs text-brand-600 dark:text-brand-400 font-medium ml-1 hover:underline">
              Current Week
            </button>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-800" />
          <XAxis dataKey="day" tickFormatter={shortDayLabel} tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(58,102,245,0.06)' }} />
          <ReferenceLine y={data.referenceLineHours} stroke="#f97316" strokeDasharray="4 4" label={{ value: 'Daily average needed', position: 'insideTopRight', fontSize: 11, fill: '#f97316' }} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.chartData.map((entry, index) => (
              <Cell key={index} fill={entry.hours > 0 ? '#3a66f5' : '#e5e7eb'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Weekly Total: <span className="font-semibold text-gray-800 dark:text-gray-100">{formatDuration(data.totalMinutes)}</span>
        </span>
        <span className="text-gray-500 dark:text-gray-400">
          Average/day: <span className="font-semibold text-gray-800 dark:text-gray-100">{formatDuration(data.averageMinutesPerDay)}</span>
        </span>
      </div>
    </div>
  );
}
