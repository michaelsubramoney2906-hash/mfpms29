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
  Info 
} from 'lucide-react';
import type { User } from '../types';
import { FredPerformancePlanExtractor } from './FredPerformancePlanExtractor';
import { FredSDBIPExtractor } from './FredSDBIPExtractor';

export type FredSubModule = 'performance-plan' | 'sdbip';

interface FredSuiteProps {
  currentUser: User;
  activeTenantId: string;
  initialSubModule?: FredSubModule;
  onNavigateToIPMS?: (subModuleId?: string) => void;
  onNavigateToSDBIP?: (tab?: string) => void;
}

export function FredSuite({
  currentUser,
  activeTenantId,
  initialSubModule = 'performance-plan',
  onNavigateToIPMS,
  onNavigateToSDBIP
}: FredSuiteProps) {
  const [activeSubModule, setActiveSubModule] = useState<FredSubModule>(initialSubModule);

  useEffect(() => {
    if (initialSubModule) {
      setActiveSubModule(initialSubModule);
    }
  }, [initialSubModule]);

  return (
    <div id="fred-suite-root" className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* Top Fred Navigation Tab Bar */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-3 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-wide uppercase">Fred</span>
              <span className="text-[10px] text-indigo-400 font-bold ml-1.5 px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-700/50">
                Cognitive Suite
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-800 hidden sm:block" />

          {/* Sub-Module Switcher */}
          <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl shadow-inner">
            <button
              id="tab-fred-performance-plan"
              type="button"
              onClick={() => setActiveSubModule('performance-plan')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubModule === 'performance-plan'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-200" />
              <span>1. Performance Plan Extractor</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950/80 text-indigo-300 font-extrabold border border-indigo-500/30">
                IPMS Profile
              </span>
            </button>

            <button
              id="tab-fred-sdbip"
              type="button"
              onClick={() => setActiveSubModule('sdbip')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                activeSubModule === 'sdbip'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-200" />
              <span>2. SDBIP Extractor</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 font-extrabold border border-emerald-500/30">
                OPMS Top Layer
              </span>
            </button>
          </div>
        </div>

        {/* Isolation Guarantee Badge */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 font-medium hidden md:inline">Engine Isolation:</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-750 text-slate-300 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Zero Cross-Contamination</span>
          </span>
        </div>
      </div>

      {/* Sub-Module Active Body */}
      <div className="flex-1 overflow-hidden">
        {activeSubModule === 'performance-plan' ? (
          <FredPerformancePlanExtractor
            currentUser={currentUser}
            activeTenantId={activeTenantId}
            onNavigateToIPMS={onNavigateToIPMS}
          />
        ) : (
          <FredSDBIPExtractor
            currentUser={currentUser}
            activeTenantId={activeTenantId}
            onNavigateToSDBIP={onNavigateToSDBIP}
          />
        )}
      </div>
    </div>
  );
}
