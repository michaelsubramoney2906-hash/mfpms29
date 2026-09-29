import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("inline-flex flex-col items-stretch leading-none select-none", className)}>
      <h1 className="text-5xl font-black font-sans tracking-tighter whitespace-nowrap mb-2">
        <span className="text-black">Mzansi</span><span className="text-green-600 ml-1.5">Flow</span>
      </h1>
      <div className="text-[11px] font-black text-gray-800 uppercase flex justify-between tracking-widest w-full opacity-90">
        {"PERFORMANCE MANAGEMENT SYSTEM".split('').map((char, i) => (
          <span key={i}>{char === ' ' ? '\u00A0' : char}</span>
        ))}
      </div>
    </div>
  );
}
