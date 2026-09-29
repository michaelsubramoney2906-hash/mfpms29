import React from 'react';
import { BarChart3 } from 'lucide-react';

export function GraphLab(props: any) {
  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center m-6">
      <BarChart3 className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 uppercase">GraphLab Analytics Studio</h3>
      <p className="text-xs text-slate-500 mt-1">Interactive Data Visualization and KPI Trajectory Modeling</p>
    </div>
  );
}
