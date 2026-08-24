export default function StatusBadge({ isCurrentlyIn }) {
  return isCurrentlyIn ? (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-full">
      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      Currently IN
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full">
      <span className="w-2 h-2 rounded-full bg-gray-400" />
      Currently OUT
    </span>
  );
}
