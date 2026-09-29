import React from 'react';

interface FinancialIncident {
  id: string;
  reference: string;
  directorate: string;
  type: string;
  amount: number;
  root_cause: string;
  workflow_stage: string;
}

interface UIFWTrackerDashboardProps {
  financialIncidents: FinancialIncident[];
}

export function UIFWTrackerDashboard({ financialIncidents }: UIFWTrackerDashboardProps) {
  // Aggregate total values dynamically
  const totalIrregular = financialIncidents
    .filter(i => i.type === 'Irregular')
    .reduce((sum, item) => sum + item.amount, 0);

  const totalUnauthorised = financialIncidents
    .filter(i => i.type === 'Unauthorised')
    .reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="p-6 bg-slate-50 rounded-xl border border-slate-200">
      <h2 className="text-xl font-bold text-slate-900 mb-1">UIF&W Fiscal Consequence Dashboard</h2>
      <p className="text-xs text-slate-500 mb-6">MFMA Chapter 15 Financial Misconduct Monitoring</p>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white rounded-lg border border-red-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Irregular Expenditure</span>
          <span className="text-2xl font-black text-red-600">R {totalIrregular.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="p-4 bg-white rounded-lg border border-amber-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">Total Unauthorised Expenditure</span>
          <span className="text-2xl font-black text-amber-600">R {totalUnauthorised.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Incident Progression Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-700">Active MPAC Investigations</h3>
        {financialIncidents.map(incident => (
          <div key={incident.id} className="p-4 bg-white rounded-lg border border-slate-200 flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">{incident.reference}</span>
                <span className="text-xs text-slate-400">| {incident.directorate.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-xs text-slate-600 mt-1"><span className="font-semibold">Root Cause:</span> {incident.root_cause}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold block text-slate-900">R {incident.amount.toFixed(2)}</span>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 mt-1">
                Stage: {incident.workflow_stage.replace(/_/g, ' ')}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
