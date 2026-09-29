import React from 'react';
import { BarChart3, Database, Workflow, AlertCircle } from 'lucide-react';
import { UIFWTrackerDashboard } from './UIFWTrackerDashboard';

export function UIFWTrackerTab() {
  const mockFinancialIncidents = [
    {
      id: '1',
      reference: 'UIFW-2026-0811',
      directorate: 'Infrastructure_and_Technical_Services',
      type: 'Irregular',
      amount: 450000.00,
      root_cause: 'Split orders to bypass bidding threshold',
      workflow_stage: 'Investigation_MPAC'
    },
    {
      id: '2',
      reference: 'UIFW-2026-0842',
      directorate: 'Corporate_Services',
      type: 'Unauthorised',
      amount: 1250000.00,
      root_cause: 'Budget overspent on software licenses',
      workflow_stage: 'Disciplinary_Board'
    },
    {
      id: '3',
      reference: 'UIFW-2026-0901',
      directorate: 'Office_of_the_Municipal_Manager',
      type: 'Irregular',
      amount: 25000.00,
      root_cause: 'Single-source deviation without MM approval',
      workflow_stage: 'Identification'
    }
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="w-7 h-7 text-teal-600" />
              UIF&W Tracker & Consequence Management
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
              Full functional logic and object models for Financial Risk, Unauthorised, Irregular, Fruitless and Wasteful (UIF&W) expenditure tracking, and automated consequence management workflows mandated by MFMA Chapter 15.
            </p>
          </div>
          <div className="shrink-0">
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-teal-200">
              Financial Risk Module
            </span>
          </div>
        </div>

        {/* Dashboard */}
        <UIFWTrackerDashboard financialIncidents={mockFinancialIncidents} />

      </div>
    </div>
  );
}
