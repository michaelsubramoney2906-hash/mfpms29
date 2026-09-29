import React, { useState } from 'react';
import { Folder, FileText, Upload, Download, Search, HardDrive, FileSpreadsheet, Image, Clock, ShieldCheck, ChevronRight } from 'lucide-react';
import { User } from '../types';

interface SharePointProps {
  currentUser?: User;
  activeTenantId?: string;
}

export function SharePoint({ currentUser, activeTenantId }: SharePointProps) {
  const [search, setSearch] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');

  const mockFiles = [
    { name: 'Nkangala_SDBIP_Approved_2025_2026.xlsx', size: '2.4 MB', folder: 'SDBIP Deliverables', date: '2026-06-30', type: 'excel' },
    { name: 'Municipal_Manager_Quarterly_Report_Q3.pdf', size: '4.8 MB', folder: 'Council Oversight', date: '2026-03-31', type: 'pdf' },
    { name: 'Internal_Audit_Charter_Resolution_2026.docx', size: '1.1 MB', folder: 'Audit Committee', date: '2026-02-15', type: 'word' },
    { name: 'IDP_Public_Participation_Consolidated.pdf', size: '8.2 MB', folder: 'Public Participation', date: '2026-05-18', type: 'pdf' },
    { name: 'Corporate_Services_PDP_Consolidated.xlsx', size: '3.1 MB', folder: 'IPMS Profiles', date: '2026-07-10', type: 'excel' },
    { name: 'Annual_Financial_Statements_PreAudit.pdf', size: '12.4 MB', folder: 'Treasury & Finance', date: '2026-08-25', type: 'pdf' }
  ];

  const folders = ['all', 'SDBIP Deliverables', 'Council Oversight', 'Audit Committee', 'Public Participation', 'IPMS Profiles', 'Treasury & Finance'];

  const filteredFiles = mockFiles.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || f.folder === selectedFolder;
    return matchesSearch && matchesFolder;
  });

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden shadow-sm border border-slate-200">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Municipal SharePoint & Document Cloud</h2>
            <p className="text-xs text-slate-500 font-medium">Enterprise Document Management & Archival Repository</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => alert("Document upload initiated. Select file from local device to archive.")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm transition"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col min-h-0 overflow-y-auto">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search SharePoint files..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-500 transition shadow-sm"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {folders.map(f => (
              <button
                key={f}
                onClick={() => setSelectedFolder(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition uppercase tracking-wider shrink-0 cursor-pointer ${
                  selectedFolder === f
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex-1">
          <div className="divide-y divide-slate-100">
            {filteredFiles.map((file, i) => (
              <div key={i} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                    {file.type === 'excel' ? <FileSpreadsheet className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 hover:text-teal-700 transition cursor-pointer">{file.name}</h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1"><Folder className="w-3 h-3 text-slate-400" /> {file.folder}</span>
                      <span>•</span>
                      <span>{file.size}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {file.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => alert(`Downloading ${file.name}`)}
                    className="p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg transition"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
