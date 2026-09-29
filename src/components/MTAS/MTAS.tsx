import React from 'react';
import { Activity } from 'lucide-react';

export function MTAS(props: any) {
  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center m-6">
      <Activity className="w-12 h-12 text-blue-600 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 uppercase">Municipal Turnaround Strategy (MTAS)</h3>
      <p className="text-xs text-slate-500 mt-1">Service delivery acceleration and operational diagnostic framework</p>
    </div>
  );
}
