import React, { useState, useEffect } from 'react';
import { 
  Bot, 
  Cpu, 
  Landmark, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Layers, 
  ArrowRight, 
  Info,
  ShieldAlert
} from 'lucide-react';
import type { User } from '../types';
import { FredPerformancePlanExtractor } from './FredPerformancePlanExtractor';
import { FredSDBIPExtractor } from './FredSDBIPExtractor';
import { FredGmPerformancePlanExtractor } from './FredGmPerformancePlanExtractor';

export type FredSubModule = 'performance-plan' | 'gm-extractor' | 'sdbip';

interface Fred2SuiteProps {
  currentUser: User;
  activeTenantId?: string; // Will be locked to 'neda' to isolate NEDA data
  initialSubModule?: FredSubModule;
  onNavigateToIPMS?: (subModuleId?: string) => void;
  onNavigateToSDBIP?: (tab?: string) => void;
}

export function Fred2Suite({
  currentUser,
  activeTenantId = 'neda', // Strict separation for NEDA Fred 2
  initialSubModule = 'performance-plan',
  onNavigateToIPMS,
  onNavigateToSDBIP
}: Fred2SuiteProps) {
  // Always enforce NEDA tenant to avoid cross-contamination
  const nedaTenantId = 'neda';
  const [activeSubModule, setActiveSubModule] = useState<FredSubModule>(initialSubModule);

  useEffect(() => {
    if (initialSubModule) {
      setActiveSubModule(initialSubModule);
    }
  }, [initialSubModule]);

  return (
    <div id="extraction-engine-suite-root" className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden rounded-2xl border border-slate-800">
      
      {/* Top Extraction Engine Navigation Tab Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white tracking-wide uppercase">EXTRACTION ENGINE</span>
                <span className="text-[9px] text-emerald-400 font-extrabold px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800/60 uppercase">
                  NEDA EXCLUSIVE
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium mt-0.5">NEDA Autonomous Cognitive Extractor Suite</p>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Sub-Module Switcher */}
          <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
            <button
              id="tab-engine-performance-plan"
              type="button"
              onClick={() => setActiveSubModule('performance-plan')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubModule === 'performance-plan'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-200" />
              <span>1. Performance Plan Extractor</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 font-extrabold border border-emerald-500/30">
                IPMS Profile
              </span>
            </button>

            <button
              id="tab-engine-gm-extractor"
              type="button"
              onClick={() => setActiveSubModule('gm-extractor')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubModule === 'gm-extractor'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>2. GM Extractor</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 font-extrabold border border-emerald-500/30">
                Sec 56 GM
              </span>
            </button>

            <button
              id="tab-engine-sdbip"
              type="button"
              onClick={() => setActiveSubModule('sdbip')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubModule === 'sdbip'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-200" />
              <span>3. SDBIP Extractor</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 font-extrabold border border-emerald-500/30">
                OPMS Top Layer
              </span>
            </button>
          </div>
        </div>

        {/* Isolation Guarantee Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden md:inline">Data Boundary:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-950/50 border border-emerald-800/40 text-emerald-300 text-[11px] font-extrabold uppercase tracking-wide">
            <ShieldAlert className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>NEDA Isolated Space (neda)</span>
          </span>
        </div>
      </div>

      {/* Strict Isolation & Recipient Policy Banner */}
      <div className="bg-emerald-950/40 border-b border-emerald-800/40 px-6 py-2.5 flex items-center gap-2.5 text-[11px] text-emerald-300 font-semibold select-none shrink-0">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-white uppercase font-black">NEDA Strict Isolation & Recipient Policy:</strong> Extracted KPAs and KPIs can <strong className="text-white uppercase underline">ONLY</strong> go to the following approved users&apos; Performance Agreements: <span className="font-bold text-amber-300">ChaukeNH@nkangaladm.gov.za</span>, <span className="font-bold text-amber-300">SehlakoLS@neda.gov.za</span>, <span className="font-bold text-amber-300">ChaukeKC@neda.gov.za</span>, <span className="font-bold text-amber-300">manganijp@nkangaladm.gov.za</span>. Extracted data never leaves NEDA and is completely isolated from Nkangala.
        </span>
      </div>

      {/* Sub-Module Active Body */}
      <div className="flex-1 overflow-hidden">
        {activeSubModule === 'performance-plan' ? (
          <FredPerformancePlanExtractor
            currentUser={currentUser}
            activeTenantId={nedaTenantId}
            onNavigateToIPMS={onNavigateToIPMS}
          />
        ) : activeSubModule === 'gm-extractor' ? (
          <FredGmPerformancePlanExtractor
            currentUser={currentUser}
            activeTenantId={nedaTenantId}
            onNavigateToIPMS={onNavigateToIPMS}
          />
        ) : (
          <FredSDBIPExtractor
            currentUser={currentUser}
            activeTenantId={nedaTenantId}
            onNavigateToSDBIP={onNavigateToSDBIP}
          />
        )}
      </div>
    </div>
  );
}
