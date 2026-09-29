import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Sparkles, RefreshCw, FileText } from 'lucide-react';
import { useFinancialYear, FinancialYear } from '../context/FinancialYearContext';
import { cn } from './Branding';

export const FinancialYearSwitcher: React.FC = () => {
  const { financialYear, setFinancialYear, selectYear, setShowYearModal, isPriorYear } = useFinancialYear();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (year: FinancialYear) => {
    selectYear(year);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Active Year Badge Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm cursor-pointer",
          isPriorYear
            ? "bg-amber-500/10 border-amber-500/40 text-amber-700 hover:bg-amber-500/20"
            : "bg-emerald-500/10 border-emerald-500/40 text-emerald-800 hover:bg-emerald-500/20"
        )}
        title="Click to switch or view Active Financial Year"
      >
        <Calendar className={cn("w-3.5 h-3.5", isPriorYear ? "text-amber-600" : "text-emerald-600")} />
        <span className="hidden sm:inline text-[10px] uppercase tracking-wider text-slate-500 font-extrabold">FY:</span>
        <span className="font-extrabold tracking-tight">{financialYear}</span>
        {isPriorYear && (
          <span className="bg-amber-600 text-white text-[9px] font-black uppercase px-1.5 py-0.2 rounded tracking-wider">
            Prior
          </span>
        )}
        <ChevronDown className={cn("w-3 h-3 opacity-60 transition-transform", isOpen && "rotate-180")} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 z-[999] animate-fade-in text-slate-800">
          <div className="px-3 py-2 border-b border-slate-100 mb-1">
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Financial Year Filter</p>
            <p className="text-xs font-bold text-slate-800">Isolate System Records</p>
          </div>

          <div className="space-y-1">
            {/* Option 2026-2027 */}
            <button
              onClick={() => handleSelect('2026-2027')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer",
                financialYear === '2026-2027'
                  ? "bg-emerald-50 text-emerald-900 font-bold"
                  : "hover:bg-slate-50 text-slate-700"
              )}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black">2026 – 2027</span>
                  <span className="bg-emerald-200 text-emerald-800 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                    Current
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Live operational period</p>
              </div>
              {financialYear === '2026-2027' && <Check className="w-4 h-4 text-emerald-600" />}
            </button>

            {/* Option 2025-2026 */}
            <button
              onClick={() => handleSelect('2025-2026')}
              className={cn(
                "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer",
                financialYear === '2025-2026'
                  ? "bg-amber-50 text-amber-900 font-bold"
                  : "hover:bg-slate-50 text-slate-700"
              )}
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black">2025 – 2026</span>
                  <span className="bg-amber-200 text-amber-900 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                    Prior
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-medium">Historical & AR target year</p>
              </div>
              {financialYear === '2025-2026' && <Check className="w-4 h-4 text-amber-600" />}
            </button>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col gap-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setShowYearModal(true);
              }}
              className="w-full text-center py-2 text-[11px] font-bold text-slate-600 hover:text-emerald-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Open Setup Lightbox
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
