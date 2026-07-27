import React from 'react';
import { FileCode, Database, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { RiskHeatmapDashboard } from './RiskHeatmapDashboard';

export function CRSAEngineTab() {
  const mockRisks = [
    { residual_impact: 5, residual_likelihood: 4 },
    { residual_impact: 4, residual_likelihood: 4 },
    { residual_impact: 5, residual_likelihood: 3 },
    { residual_impact: 3, residual_likelihood: 5 },
    { residual_impact: 2, residual_likelihood: 2 },
    { residual_impact: 1, residual_likelihood: 1 },
    { residual_impact: 4, residual_likelihood: 2 },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Cpu className="w-7 h-7 text-cyan-600" />
              CRSA Algorithmic Engine & Blueprints
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
              Production-ready data schemas and automation scripts for the Control and Risk Self-Assessment (CRSA) module. This aligns directly with MFMA risk parameters and Council-approved appetite thresholds.
            </p>
          </div>
          <div className="shrink-0">
            <span className="bg-cyan-100 text-cyan-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-cyan-200">
              System Architecture
            </span>
          </div>
        </div>

        {/* Heatmap Matrix */}
        <RiskHeatmapDashboard risks={mockRisks} />

      </div>
    </div>
  );
}
