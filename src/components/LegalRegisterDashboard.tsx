import React from 'react';

interface ComplianceItem {
  id: string;
  act_reference: string;
  directorate: string;
  deadline: string;
  status: string;
  days_overdue: number;
}

interface LegalRegisterDashboardProps {
  complianceItems: ComplianceItem[];
}

export function LegalRegisterDashboard({ complianceItems }: LegalRegisterDashboardProps) {
  return (
    <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-md">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Statutory Compliance Ledger</h2>
          <p className="text-xs text-slate-500">Tracking MFMA & Municipal Systems Act Deadlines</p>
        </div>
        <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Active Tracker</span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Statute Reference</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Responsible Directorate</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Deadline</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-slate-700">Days Variance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {complianceItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 font-medium text-slate-900">{item.act_reference}</td>
                <td className="px-4 py-3 text-slate-600">{item.directorate.replace(/_/g, ' ')}</td>
                <td className="px-4 py-3 text-slate-600">{item.deadline}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.status === 'Compliant' ? 'bg-green-100 text-green-800' :
                    item.status === 'Overdue_Submission' ? 'bg-red-100 text-red-800 animate-pulse' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </td>
                <td className={`px-4 py-3 font-bold ${item.days_overdue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {item.days_overdue > 0 ? `+${item.days_overdue} Days Overdue` : `${item.days_overdue} Days`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
