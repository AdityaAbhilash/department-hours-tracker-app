export default function StatCard({ icon: Icon, label, value, subValue, accent = 'neutral', children }) {
  const accentClasses = {
    neutral: 'text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800',
    green: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950',
    brand: 'text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950'
  };

  return (
    <div className="card p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-xl ${accentClasses[accent]}`}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight truncate">{value}</div>
      {subValue && <div className="text-xs text-gray-400 dark:text-gray-500">{subValue}</div>}
      {children}
    </div>
  );
}
