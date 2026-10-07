import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../context/ThemeContext';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Logo({ className }: { className?: string }) {
  let isDark = true;
  try {
    const themeCtx = useTheme();
    isDark = themeCtx.isDark;
  } catch {
    if (typeof document !== 'undefined') {
      isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark-theme');
    }
  }

  return (
    <div className={cn("inline-flex flex-col items-stretch leading-none select-none", className)}>
      <h1 className="text-5xl font-black font-sans tracking-tighter whitespace-nowrap mb-2">
        <span className={cn("transition-colors duration-200", isDark ? "text-white" : "text-black")}>
          Mzansi
        </span>
        <span className="text-green-600 ml-1.5">Flow</span>
      </h1>
      <div className={cn(
        "text-[11px] font-black uppercase flex justify-between tracking-widest w-full opacity-90 transition-colors duration-200",
        isDark ? "text-white" : "text-gray-600"
      )}>
        {"PERFORMANCE MANAGEMENT SYSTEM".split('').map((char, i) => (
          <span key={i}>{char === ' ' ? '\u00A0' : char}</span>
        ))}
      </div>
    </div>
  );
}
