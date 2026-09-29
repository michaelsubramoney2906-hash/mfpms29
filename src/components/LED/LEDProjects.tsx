import React from 'react';
import { Briefcase } from 'lucide-react';

export function LEDProjects(props: any) {
  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center m-6">
      <Briefcase className="w-12 h-12 text-amber-600 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 uppercase">Local Economic Development (LED) Projects</h3>
      <p className="text-xs text-slate-500 mt-1">Community growth programs and regional economic indicators</p>
    </div>
  );
}
