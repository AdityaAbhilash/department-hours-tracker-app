import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { formatDuration } from '../utils/formatters';

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

export default function MonthlyChart({ data }) {
  if (!data) return null;
  return (
    <div className="card p-5">
      <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4">Monthly Progress</h3>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data.weeklyBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-gray-100 dark:stroke-gray-800" />
          <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} axisLine={false} tickLine={false} label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#9ca3af' }} />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(58,102,245,0.06)' }} />
          <Bar dataKey="hours" radius={[6, 6, 0, 0]} maxBarSize={56} fill="#5c8bff" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
