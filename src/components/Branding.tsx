import React from 'react';

export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-md">
        NDM
      </div>
      <div className="flex flex-col">
        <span className="font-extrabold text-sm text-slate-900 tracking-tight leading-none uppercase">
          Nkangala
        </span>
        <span className="text-[10px] font-bold text-emerald-700 tracking-wider uppercase leading-tight mt-0.5">
          District Municipality
        </span>
      </div>
    </div>
  );
}
