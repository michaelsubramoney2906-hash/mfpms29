import React from 'react';
import { Target } from 'lucide-react';

export function StrategicObjectives(props: any) {
  return (
    <div className="p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center m-6">
      <Target className="w-12 h-12 text-teal-600 mx-auto mb-4" />
      <h3 className="text-lg font-bold text-slate-900 uppercase">Strategic Objectives</h3>
      <p className="text-xs text-slate-500 mt-1">Municipal Key Performance Areas & Strategic Alignment</p>
    </div>
  );
}
