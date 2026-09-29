import React, { useState } from 'react';
import { FileText, Download, Eye, Sparkles, Folder, CheckCircle, ShieldCheck } from 'lucide-react';
import { User } from '../../types';

interface PATemplatesProps {
  currentUser?: User;
  activeTenantId?: string;
}

export function PATemplates({ currentUser, activeTenantId }: PATemplatesProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string>('section57');

  const templates = [
    {
      id: 'section57',
      title: 'Section 57 Senior Manager Performance Agreement Template',
      description: 'Standard statutory annual performance agreement for Section 56/57 municipal senior managers (MFMA & Municipal Systems Act).',
      category: 'Senior Management',
      pages: 18,
      lastUpdated: '2026-07-01'
    },
    {
      id: 'middle_mgmt',
      title: 'Middle Management / Departmental Head Performance Plan',
      description: 'Quarterly reviewable individual scorecard template aligned with institutional SDBIP goals.',
      category: 'Middle Management',
      pages: 12,
      lastUpdated: '2026-07-01'
    },
    {
      id: 'staff_level',
      title: 'Operational Staff & Officer Performance Agreement',
      description: 'Operational level performance agreement incorporating Job Specific Competencies (JSC) and Personal Development Plan (PDP).',
      category: 'Operational Staff',
      pages: 8,
      lastUpdated: '2026-07-01'
    },
    {
      id: 'firefighter',
      title: 'Emergency & Fire Services Standard Performance Agreement',
      description: 'Specialized competency framework tailored for municipal firefighting and disaster response services.',
      category: 'Specialized Services',
      pages: 14,
      lastUpdated: '2026-07-01'
    }
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200">
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Performance Agreement (PA) Templates</h2>
            <p className="text-xs text-slate-500 font-medium">Standardized statutory templates and drafting blueprints</p>
          </div>
        </div>
      </div>

      <div className="p-6 flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {templates.map(tpl => (
            <div
              key={tpl.id}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                selectedTemplate === tpl.id
                  ? 'bg-white border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
              onClick={() => setSelectedTemplate(tpl.id)}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                  {tpl.category}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">{tpl.pages} Pages</span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mb-1">{tpl.title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">{tpl.description}</p>
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
                <span className="text-slate-400 text-[11px]">Updated: {tpl.lastUpdated}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    alert(`Downloading ${tpl.title}...`);
                  }}
                  className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Blueprint</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
