import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const Logo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <div className={cn("inline-flex items-center gap-2 select-none", className)}>
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center text-white font-black text-xs shadow-md border border-emerald-500/30">
        MF
      </div>
      <div className="flex flex-col">
        <span className="font-black text-sm text-slate-900 tracking-tight leading-none">MzansiFlow</span>
        <span className="text-[8.5px] font-extrabold text-emerald-700 uppercase tracking-widest leading-tight mt-0.5">Municipal PMS</span>
      </div>
    </div>
  );
};
