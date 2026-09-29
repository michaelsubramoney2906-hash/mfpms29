import React, { useState } from 'react';
import { Bot, Cpu, Sparkles, FileText, Layers, CheckCircle2 } from 'lucide-react';
import type { User } from '../types';
import { FredSDBIPExtractor } from './FredSDBIPExtractor';
import { FredGmPerformancePlanExtractor } from './FredGmPerformancePlanExtractor';

interface FredSuiteProps {
  currentUser?: User;
  activeTenantId?: string;
  onNavigateToIPMS?: (subModuleId?: string) => void;
  onNavigateToSDBIP?: (tab?: string) => void;
}

export function FredSuite({
  currentUser,
  activeTenantId,
  onNavigateToIPMS,
  onNavigateToSDBIP
}: FredSuiteProps) {
  const [activeExtractor, setActiveExtractor] = useState<'gm' | 'sdbip'>('gm');

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Fred AI SDBIP & IPMS Extraction Engine</h2>
            <p className="text-xs text-slate-500 font-medium">Automated parsing and cascading of performance indicators from official municipal documents</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveExtractor('gm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase ${
              activeExtractor === 'gm' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            GM & Section 56 Plans
          </button>
          <button
            onClick={() => setActiveExtractor('sdbip')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase ${
              activeExtractor === 'sdbip' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            SDBIP Extraction
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {activeExtractor === 'gm' ? (
          <FredGmPerformancePlanExtractor />
        ) : (
          <FredSDBIPExtractor />
        )}
      </div>
    </div>
  );
}
