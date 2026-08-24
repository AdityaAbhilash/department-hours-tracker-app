import { Menu, Sun, Moon } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';

export default function Navbar({ onMenuClick }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-8 py-4 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur border-b border-gray-100 dark:border-gray-900">
      <button onClick={onMenuClick} className="md:hidden p-2 -ml-2 text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
        <Menu className="w-5 h-5" />
      </button>
      <span className="font-semibold md:hidden">Department Hours</span>
      <button
        onClick={toggleTheme}
        className="ml-auto p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </header>
  );
}
