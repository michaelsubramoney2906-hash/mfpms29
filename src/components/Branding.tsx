import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useTheme } from '../context/ThemeContext';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Logo({ 
  className, 
  forceTheme, 
  isDashboardMenu,
  hideSubtitle 
}: { 
  className?: string; 
  forceTheme?: string; 
  isDashboardMenu?: boolean;
  hideSubtitle?: boolean;
}) {
  const { isDark } = useTheme();
  const isLight = forceTheme ? forceTheme === 'light' : !isDark;
  return (
    <div className={cn("inline-flex flex-col items-stretch leading-none select-none antialiased", className)} style={{ textShadow: 'none', filter: 'none' }}>
      <h1 className="text-5xl font-black font-sans tracking-tighter whitespace-nowrap mb-1 antialiased" style={{ textShadow: 'none', filter: 'none' }}>
        <span className={isLight ? "text-black" : "text-white"} style={{ textShadow: 'none', filter: 'none' }}>
          Mzansi
        </span>
        <span className="text-[#00D65B] font-black ml-1.5" style={{ textShadow: 'none', filter: 'none' }}>Flow</span>
      </h1>
      {!hideSubtitle && (
        <div className={cn(
          "text-[11px] font-black uppercase flex justify-between tracking-widest w-full mt-1 antialiased",
          isLight ? "text-neutral-600 font-extrabold" : "text-neutral-300"
        )} style={{ textShadow: 'none', filter: 'none' }}>
          {"PERFORMANCE MANAGEMENT SYSTEM".split('').map((char, i) => (
            <span key={i}>{char === ' ' ? '\u00A0' : char}</span>
          ))}
        </div>
      )}
    </div>
  );
}

