import React from 'react';
import { FileBarChart, CheckCircle, Clock, Download } from 'lucide-react';
import type { User } from '../types';

interface OPMSAdminReportsProps {
  currentUser: User;
  activeTenantId: string;
}

export function OPMSAdminReports({ currentUser, activeTenantId }: OPMSAdminReportsProps) {
  const liveDraftReports = [
    { title: 'Annual Performance Report', type: 'Performance', icon: <FileBarChart className="w-5 h-5" /> },
    { title: 'Annual Report', type: 'General', icon: <FileBarChart className="w-5 h-5" /> },
    { title: 'Compliance Tracker', type: 'Compliance', icon: <CheckCircle className="w-5 h-5" /> },
    { title: 'IDP', type: 'Planning', icon: <FileBarChart className="w-5 h-5" /> },
    { title: 'LED', type: 'Economic Dev', icon: <FileBarChart className="w-5 h-5" /> },
    { title: 'SDBIP', type: 'Service Delivery', icon: <FileBarChart className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl">
      <div className="bg-slate-900 text-white p-6 shrink-0 flex items-center justify-between shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileBarChart className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              OPMS Admin Reports
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Live Work In Progress / Real-time Drafts</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Live Work In Progress Draft Reports
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveDraftReports.map((draft, idx) => (
                <div key={idx} className="border border-amber-200 bg-amber-50/30 rounded-xl p-5 flex flex-col cursor-pointer hover:bg-amber-50 transition-colors shadow-sm relative overflow-hidden group">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-amber-500/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  <div className="p-3 bg-white border border-amber-100 rounded-xl w-12 h-12 flex items-center justify-center text-amber-600 mb-4 shadow-sm">
                    {draft.icon}
                  </div>
                  <div className="flex-1">
                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block">{draft.type}</span>
                    <h3 className="font-bold text-slate-800 mb-1">{draft.title}</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Real-time draft automatically compiling data from operational layers.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-amber-100 flex items-center justify-between text-xs font-bold text-amber-700">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Updating Live</span>
                    <button onClick={() => alert('Opening live draft view...')} className="hover:underline flex items-center gap-1">View Draft <Download className="w-3 h-3 ml-1" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
