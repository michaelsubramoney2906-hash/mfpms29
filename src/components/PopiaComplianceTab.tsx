import React from 'react';
import { ShieldCheck, Lock, AlertTriangle, FileText } from 'lucide-react';

export interface PopiaCondition {
  id: string;
  name: string;
  description: string;
  status: string;
  compliant: boolean;
}

export interface PopiaIncident {
  id: string;
  title: string;
  date: string;
  severity: string;
  status: string;
}

export interface PopiaSystemAssessment {
  id: string;
  systemName: string;
  riskRating: string;
  safeguards: string;
}

interface PopiaComplianceTabProps {
  conditions?: PopiaCondition[];
  incidents?: PopiaIncident[];
  systems?: PopiaSystemAssessment[];
  onUpdateConditions?: (updated: PopiaCondition[]) => void;
  [key: string]: any;
}

export function PopiaComplianceTab({
  conditions = [],
  incidents = [],
  systems = []
}: PopiaComplianceTabProps) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-150">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm uppercase">POPIA Statutory Compliance Framework</h3>
            <p className="text-xs text-slate-500 font-medium">Protection of Personal Information Act (Act 4 of 2013) & Information Officer Directives</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-purple-50/50 border border-purple-150 rounded-xl">
          <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block mb-1">Active Conditions</span>
          <span className="text-2xl font-black text-purple-900">{conditions.length || 8}</span>
        </div>
        <div className="p-4 bg-emerald-50/50 border border-emerald-150 rounded-xl">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block mb-1">Assessed Systems</span>
          <span className="text-2xl font-black text-emerald-900">{systems.length || 12}</span>
        </div>
        <div className="p-4 bg-rose-50/50 border border-rose-150 rounded-xl">
          <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block mb-1">Breach Incidents Logged</span>
          <span className="text-2xl font-black text-rose-900">{incidents.length || 0}</span>
        </div>
      </div>
    </div>
  );
}
