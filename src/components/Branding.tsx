import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
  const isLight = isDashboardMenu || forceTheme === 'light';
  return (
    <div className={cn("inline-flex flex-col items-stretch leading-none select-none", className)}>
      <h1 className="text-5xl font-black font-sans tracking-tighter whitespace-nowrap mb-1">
        <span className={isLight ? "text-black" : "text-white"}>
          Mzansi
        </span>
        <span className="text-[#39FF14] font-black ml-1.5 drop-shadow-[0_0_10px_rgba(57,255,20,0.5)]">Flow</span>
      </h1>
      {!hideSubtitle && (
        <div className={cn(
          "text-[11px] font-black uppercase flex justify-between tracking-widest w-full opacity-90 mt-1",
          isLight ? "text-gray-500 font-extrabold" : "text-slate-100"
        )}>
          {"PERFORMANCE MANAGEMENT SYSTEM".split('').map((char, i) => (
            <span key={i}>{char === ' ' ? '\u00A0' : char}</span>
          ))}
        </div>
      )}
    </div>
  );
}
