import React from 'react';
import { Calendar, CheckCircle2, ShieldCheck, ArrowRight, AlertTriangle, FileText, Info, Sparkles } from 'lucide-react';
import { useFinancialYear, FinancialYear } from '../context/FinancialYearContext';
import { cn } from './Branding';

export const FinancialYearModal: React.FC = () => {
  const { financialYear, selectYear, showYearModal, setShowYearModal, hasSelectedYear } = useFinancialYear();

  if (!showYearModal) return null;

  const handleSelect = (year: FinancialYear) => {
    selectYear(year);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 md:p-8 bg-slate-950/85 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-800 transition-all transform animate-scale-up my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Header Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-green-950 to-slate-900 px-8 py-6 text-white relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-1/4 -translate-y-1/4 w-64 h-64 bg-green-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-900/30 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-green-500/20 text-green-300 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full border border-green-500/30">
                  Mandatory System Setup
                </span>
                {hasSelectedYear && (
                  <button
                    onClick={() => setShowYearModal(false)}
                    className="ml-auto text-slate-400 hover:text-white text-xs font-bold"
                  >
                    Close ✕
                  </button>
                )}
              </div>
              <h2 className="text-xl font-extrabold tracking-tight text-white mt-1">
                Select Active Financial Year
              </h2>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Please specify the working financial cycle to isolate system data, metrics, and KPI evaluations.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Year Cards Options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Card 1: 2026-2027 (Current Year) */}
            <div
              onClick={() => handleSelect('2026-2027')}
              className={cn(
                "relative group cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between hover:shadow-xl",
                financialYear === '2026-2027'
                  ? "bg-emerald-50/60 border-emerald-600 shadow-lg shadow-emerald-900/10"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              )}
            >
              {financialYear === '2026-2027' && (
                <div className="absolute top-3 right-3 text-emerald-600">
                  <CheckCircle2 className="w-5 h-5 fill-emerald-600 text-white" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-emerald-200">
                    Current Year
                  </span>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  2026 – 2027
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Active operational financial year. Applies to live IPMS performance agreements, quarterly reviews, SDBIP targets, and current IDP metrics.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-emerald-700">
                <span>Active Operating Cycle</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Card 2: 2025-2026 (Prior Year) */}
            <div
              onClick={() => handleSelect('2025-2026')}
              className={cn(
                "relative group cursor-pointer p-5 rounded-2xl border-2 transition-all duration-200 flex flex-col justify-between hover:shadow-xl",
                financialYear === '2025-2026'
                  ? "bg-amber-50/60 border-amber-600 shadow-lg shadow-amber-900/10"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              )}
            >
              {financialYear === '2025-2026' && (
                <div className="absolute top-3 right-3 text-amber-600">
                  <CheckCircle2 className="w-5 h-5 fill-amber-600 text-white" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-amber-100 text-amber-800 font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md border border-amber-200">
                    Prior Year
                  </span>
                  <span className="bg-slate-200 text-slate-700 font-bold text-[10px] px-2 py-0.5 rounded">
                    Audit / Historical
                  </span>
                </div>

                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  2025 – 2026
                </h3>
                <p className="text-xs text-slate-600 font-medium mt-2 leading-relaxed">
                  Prior financial year records, archived KPI evaluations, audit responses, and historical performance benchmarks.
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs font-bold text-amber-700">
                <span>View Historical Records</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

          </div>

          {/* Annual Report Notice Banner */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3 text-slate-700">
            <div className="p-2 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5 shadow-md shadow-blue-600/20">
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-xs leading-relaxed">
              <span className="font-extrabold text-blue-900 block text-[11px] uppercase tracking-wider mb-0.5">
                Statutory Annual Report Look-Back Rule (Section 121 MFMA)
              </span>
              The <strong className="text-slate-900 font-bold">Annual Report</strong> is always compiled in the current year evaluating performance for the <strong className="text-slate-900 font-bold">prior financial year (2025–2026)</strong>. This document automatically references prior year targets regardless of your active session choice.
            </div>
          </div>

          {/* Confirm Button */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2 text-[11px] text-slate-500 font-semibold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Selected Year: <span className="font-bold text-slate-900">{financialYear}</span>
            </div>

            <button
              onClick={() => handleSelect(financialYear)}
              className="px-6 py-3 bg-gradient-to-r from-slate-900 to-green-950 text-white hover:from-slate-800 hover:to-green-900 font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              Confirm & Continue to Workspace
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
