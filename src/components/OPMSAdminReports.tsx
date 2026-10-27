import React, { useState } from 'react';
import { FileBarChart, CheckCircle, Clock, Download, X, Eye } from 'lucide-react';
import type { User } from '../types';
import { AnnualReportPDFViewer } from './AR/AnnualReportPDFViewer';

interface OPMSAdminReportsProps {
  currentUser: User;
  activeTenantId: string;
}

export function OPMSAdminReports({ currentUser, activeTenantId }: OPMSAdminReportsProps) {
  const [selectedReportTitle, setSelectedReportTitle] = useState<string | null>(null);

  const liveDraftReports = [
    { title: 'Annual Performance Report', type: 'Performance', icon: <FileBarChart className="w-5 h-5" /> },
    { title: 'Annual Report', type: 'General', icon: <FileBarChart className="w-5 h-5" /> },
    { title: 'Compliance Tracker', type: 'Compliance', icon: <CheckCircle className="w-5 h-5" /> },
    { title: 'IDP', type: 'Planning', icon: <FileBarChart className="w-5 h-5" /> },
    { title: 'LED', type: 'Economic Dev', icon: <FileBarChart className="w-5 h-5" /> },
    { title: 'SDBIP', type: 'Service Delivery', icon: <FileBarChart className="w-5 h-5" /> },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative">
      <div className="bg-slate-900 text-white p-6 shrink-0 flex items-center justify-between shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/20 to-orange-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileBarChart className="w-8 h-8 text-[#00D65B] group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              OPMS Admin Reports
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">Live Work In Progress / Statutory Master Drafts</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 uppercase tracking-tight mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00D65B]"></span>
              Live Statutory Draft Reports & Master Viewer
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {liveDraftReports.map((draft, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedReportTitle(draft.title)}
                  className="border border-slate-200 hover:border-[#00D65B] bg-white hover:bg-emerald-50/20 rounded-2xl p-5 flex flex-col cursor-pointer transition-all shadow-sm relative overflow-hidden group"
                >
                  <div className="absolute right-0 top-0 w-24 h-24 bg-[#00D65B]/10 rounded-bl-full -z-10 group-hover:scale-110 transition-transform"></div>
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl w-12 h-12 flex items-center justify-center text-[#00D65B] mb-4 shadow-sm">
                    {draft.icon}
                  </div>
                  <div className="flex-1">
                    <span className="bg-[#00D65B]/20 text-emerald-950 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-2 inline-block">
                      {draft.type}
                    </span>
                    <h3 className="font-extrabold text-slate-900 mb-1 group-hover:text-[#00D65B] transition">{draft.title}</h3>
                    <p className="text-[10.5px] text-slate-500 font-medium">Real-time statutory report compiling operational data across layers.</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-800">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-[#00D65B]" /> Updating Live</span>
                    <button className="hover:underline flex items-center gap-1 font-black text-[#00D65B]">
                      Open Viewer <Eye className="w-3.5 h-3.5 ml-1" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN MODAL VIEWER FOR ANNUAL REPORT / REPORTS */}
      {selectedReportTitle && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-6 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl w-full max-w-7xl h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="bg-[#00D65B] text-slate-950 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                  OPMS Master
                </span>
                <h3 className="text-sm font-black text-white m-0 uppercase tracking-wider">
                  {selectedReportTitle} • Statutory Master 800-Page Viewer
                </h3>
              </div>
              <button
                onClick={() => setSelectedReportTitle(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden p-2">
              <AnnualReportPDFViewer currentUser={currentUser} activeTenantId={activeTenantId} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

