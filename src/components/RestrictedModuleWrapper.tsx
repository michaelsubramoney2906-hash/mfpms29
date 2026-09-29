import React from 'react';
import { Archive, Scale, Clock, FileText } from 'lucide-react';
import { LegalRegisterDashboard } from './LegalRegisterDashboard';

export function LegalRegisterTab() {
  const mockComplianceItems = [
    {
      id: '1',
      act_reference: 'MFMA Section 71',
      directorate: 'Finance_Budget_and_Treasury',
      deadline: '2026-08-14',
      status: 'Overdue_Submission',
      days_overdue: 12
    },
    {
      id: '2',
      act_reference: 'MFMA Section 52(d)',
      directorate: 'Office_of_the_Municipal_Manager',
      deadline: '2026-09-30',
      status: 'Partially_Compliant',
      days_overdue: 0
    },
    {
      id: '3',
      act_reference: 'MSA Section 46',
      directorate: 'Corporate_Services',
      deadline: '2026-08-31',
      status: 'Compliant',
      days_overdue: -4
    }
  ];

  return (
    <div className="p-6 md:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 bg-white min-h-full">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Archive className="w-7 h-7 text-rose-600" />
              Legal Register & Compliance Tracking
            </h2>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl leading-relaxed">
              Full functionality blueprints for tracking core MFMA statutory deadlines, governance committee schedules, and automated countdown mechanisms to prevent non-compliance.
            </p>
          </div>
          <div className="shrink-0">
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-rose-200">
              Compliance Architecture
            </span>
          </div>
        </div>

        {/* Dashboard */}
        <LegalRegisterDashboard complianceItems={mockComplianceItems} />

      </div>
    </div>
  );
}
