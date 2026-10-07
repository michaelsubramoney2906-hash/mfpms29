import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className = '', showLabel = false }) => {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer select-none border ${
        isDark
          ? 'bg-slate-900/80 hover:bg-slate-800 text-amber-300 border-slate-700/80 hover:border-amber-400/40 shadow-sm'
          : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 hover:border-slate-300 shadow-xs'
      } ${className}`}
      title={`Current: ${isDark ? 'Dark Mode' : 'Light Mode'} (Click to switch)`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-amber-300 transition-transform duration-200 rotate-0 scale-100" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-amber-500 transition-transform duration-200 rotate-0 scale-100" />
        )}
      </div>

      {showLabel ? (
        <span className="capitalize tracking-wide text-[11px] font-bold">
          {theme} Mode
        </span>
      ) : (
        <span className="hidden md:inline text-[10px] font-bold tracking-wider uppercase text-slate-400 dark:text-slate-400">
          {isDark ? 'Dark' : 'Light'}
        </span>
      )}
    </button>
  );
};
