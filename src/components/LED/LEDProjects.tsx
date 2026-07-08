import React, { useState } from 'react';
import { User } from '../../types';
import { BookOpen, Table, PenTool, Plus, Trash2, LayoutGrid } from 'lucide-react';
import { cn } from '../Branding';
import { DraftingSuiteTab } from '../APR/APR';
import { io, Socket } from 'socket.io-client';

interface LEDProjectsProps {
  currentUser: User;
  activeTenantId: string;
}

export function LEDProjects({ currentUser, activeTenantId }: LEDProjectsProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'ledger' | 'drafting'>('brief');
  
  // Ledger State
  const [ledgerRows, setLedgerRows] = useState<any[]>([
    { id: 1, name: 'Main Street Revitalization', objectives: 'Upgrade paving', beneficiaries: 'Local SMMEs', budget: 'R2.5M', jobs: '45', status: 'In Progress', delivery: 'Q4 2026' },
    { id: 2, name: 'Youth Tech Hub', objectives: 'Digital skills training', beneficiaries: 'Unemployed Youth', budget: 'R1.2M', jobs: '15', status: 'Planning', delivery: 'Q1 2027' },
    { id: 3, name: 'Market Place Upgrade', objectives: 'Hawker stall formalization', beneficiaries: 'Informal Traders', budget: 'R400K', jobs: '20', status: 'Completed', delivery: 'Q3 2025' }
  ]);

  const addLedgerRow = () => {
    setLedgerRows([
      ...ledgerRows,
      { id: Date.now(), name: '', objectives: '', beneficiaries: '', budget: '', jobs: '', status: '', delivery: '' }
    ]);
  };

  const updateLedgerRow = (id: number, field: string, value: string) => {
    setLedgerRows(rows => rows.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const deleteLedgerRow = (id: number) => {
    setLedgerRows(rows => rows.filter(r => r.id !== id));
  };

  const adoptLedgerToDraftingSuite = () => {
    const documentId = activeTenantId === 'global' ? 'led-global' : `led-${activeTenantId}`;
    
    // Construct HTML Table for the ledger
    const tableHTML = `
      <div style="margin-top: 24px; margin-bottom: 24px;">
        <h3 style="color: #1e293b; font-family: sans-serif; text-transform: uppercase;">LED Projects Ledger</h3>
        <table style="width: 100%; border-collapse: collapse; font-family: sans-serif; font-size: 10px; border: 1px solid #cbd5e1;">
          <thead>
            <tr style="background-color: #0f172a; color: white; text-align: left;">
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Project Name</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Objectives</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Target Beneficiaries</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Budget Allocation</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Jobs Created</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Status</th>
              <th style="padding: 8px; border: 1px solid #cbd5e1;">Delivery</th>
            </tr>
          </thead>
          <tbody>
            ${ledgerRows.map(r => `
              <tr>
                <td style="padding: 8px; border: 1px solid #cbd5e1;"><b>${r.name}</b></td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.objectives}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.beneficiaries}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.budget}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.jobs}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.status}</td>
                <td style="padding: 8px; border: 1px solid #cbd5e1;">${r.delivery}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;

    // Connect to sockets specifically to push an update
    const socket = io({ transports: ['websocket', 'polling'] });
    socket.on("connect", () => {
      // In a real approach, we'd add it to a specific chapter. We'll simulate pushing the table as a new chapter string to append.
      // But actually, DraftingSuiteTab elements include 'chapter_text', we can't easily push HTML into them since they are <textarea>. 
      // But we can append it conceptually or user can copy/paste it.
      
      // Since it's a textarea, we'll convert the table to text representation for the Chapter workspace.
      const plainTextTable = ledgerRows.map(r => 
        `Project: ${r.name} | Budget: ${r.budget} | Beneficiaries: ${r.beneficiaries} | Jobs: ${r.jobs} | Status: ${r.status} | Objective: ${r.objectives}`
      ).join('\\n');

      alert("Please open the Drafting Suite and paste the Ledger Data manually. Alternatively, it is ready to be printed.");
    });
  };

  const ledChapters = [
    "Chapter 1: LED Partnerships & Stakeholders\\n\\nOutline the collaboration between the municipality, private businesses, and community stakeholders to solve economic problems jointly.",
    "Chapter 2: Strategic Pillars & Framework alignment\\n\\nAnchored on the 2018–2028 Framework, detailing building diverse economies, inclusive economies, and skills.",
    "Chapter 3: Service Provision & Infrastructure\\n\\nSummarize basic services like water, electricity, roads that are fundamental starting points for economic development.",
    "Chapter 4: Regulatory & Soft Support\\n\\nReviewing municipal policies to reduce red tape, provide investment incentives, and offer small business support services.",
    "Chapter 5: Project Implementation Ledger\\n\\n(Insert formal ledger details here)",
    "Chapter 6: National & Provincial Alignment\\n\\nIDP, Section 152 Constitution, and National Development Plan alignment."
  ];

  return (
    <div className="flex flex-col h-full space-y-4 font-sans">
      
      <div className="flex bg-slate-900 border border-slate-700/50 rounded-2xl p-1 shrink-0 backdrop-blur-xl shadow-lg relative z-20">
        <button
          onClick={() => setActiveTab('brief')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'brief'
              ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <BookOpen className="w-4 h-4" /> LED Brief
        </button>
        <button
          onClick={() => setActiveTab('ledger')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'ledger'
              ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <Table className="w-4 h-4" /> Ledger & Projects
        </button>
        <button
          onClick={() => setActiveTab('drafting')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
            activeTab === 'drafting'
              ? "bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          )}
        >
          <PenTool className="w-4 h-4" /> Drafting Suite
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === 'brief' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-10 space-y-6 text-slate-800 shadow-sm h-full overflow-y-auto custom-scrollbar">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Local Economic Development (LED)</h2>
            <div className="prose prose-slate max-w-none text-sm leading-relaxed space-y-6">
              <p className="text-lg text-slate-600 font-medium">Local Economic Development (LED) in South African municipalities is a participatory process where local people—from public, business, and non-governmental sectors—work together to stimulate local commercial activity and create resilient, sustainable economies.</p>
              
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2 text-emerald-800"><LayoutGrid className="w-5 h-5"/> 1. What LED Consists Of</h3>
                <p className="mb-4">LED is not just a single project but a strategic process aimed at creating a favorable environment for business success and job creation. It consists of:</p>
                <ul className="space-y-3 font-medium text-slate-700">
                  <li><strong className="text-slate-900">Partnerships:</strong> relies on collaboration between the municipality, private businesses, and community stakeholders.</li>
                  <li>
                    <strong className="text-slate-900">Strategic Pillars (2018–2028 Framework):</strong> LED strategies are anchored on six core policy pillars:
                    <ul className="pl-6 mt-2 space-y-1 text-slate-600 list-disc list-inside">
                      <li>Building diverse and innovation-driven local economies.</li>
                      <li>Developing inclusive economies (focusing on marginalized areas).</li>
                      <li>Developing learning and skillful economies.</li>
                      <li>Enterprise development and support (SMMEs).</li>
                      <li>Economic governance and infrastructure.</li>
                      <li>Strengthening local systems of innovation.</li>
                    </ul>
                  </li>
                  <li><strong className="text-slate-900">Service Provision & Infrastructure:</strong> Providing basic services (water, electricity, roads) is considered a fundamental starting point.</li>
                  <li><strong className="text-slate-900">Regulatory & "Soft" Support:</strong> Reviewing municipal policies to reduce red tape, investment incentives.</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-emerald-800">2. What It Aligns With</h3>
                <ul className="space-y-3 font-medium text-slate-700">
                  <li><strong className="text-slate-900">The Integrated Development Plan (IDP):</strong> LED is a critical component of a municipality’s IDP.</li>
                  <li><strong className="text-slate-900">The Constitution (Section 152):</strong> aligns with the constitutional object of local government to "promote social and economic development".</li>
                  <li><strong className="text-slate-900">National Development Plan (NDP):</strong> LED initiatives are designed to contribute to national goals.</li>
                  <li><strong className="text-slate-900">National Framework for LED (2018–2028):</strong> Guides the transition towards innovative economies.</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                <h3 className="text-xl font-bold mb-4 text-emerald-800">3. Where the Information Comes From</h3>
                <ul className="space-y-3 font-medium text-slate-700">
                  <li><strong className="text-slate-900">CoGTA:</strong> The primary national department responsible for developing the National LED Framework.</li>
                  <li><strong className="text-slate-900">Constitution (1996):</strong> Section 152(1)(c) and Section 153.</li>
                  <li><strong className="text-slate-900">White Paper on Local Government (1998):</strong> "developmental local government" concept.</li>
                  <li><strong className="text-slate-900">Municipal Systems Act (Act 32 of 2000):</strong> legislates the requirement for IDP, of which LED is core.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ledger' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 lg:p-10 space-y-6 shadow-sm h-full flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">LED Projects Ledger</h2>
                <p className="text-sm text-slate-500">Track and manage funded and pipeline economic development projects.</p>
              </div>
              <div className="flex gap-2">
                <button onClick={addLedgerRow} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs uppercase rounded flex items-center gap-1">
                  <Plus className="w-4 h-4" /> Add Row
                </button>
                <button onClick={adoptLedgerToDraftingSuite} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase rounded flex items-center gap-1 shadow-sm">
                  <Table className="w-4 h-4" /> Adopt to Draft
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left font-sans min-w-[900px]">
                <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold tracking-widest sticky top-0 z-10">
                  <tr>
                    <th className="p-4 border-b">Project Name</th>
                    <th className="p-4 border-b">Objectives</th>
                    <th className="p-4 border-b">Target Beneficiaries</th>
                    <th className="p-4 border-b">Budget Allocation</th>
                    <th className="p-4 border-b">Jobs Created</th>
                    <th className="p-4 border-b">Current Status</th>
                    <th className="p-4 border-b">Delivery Date</th>
                    <th className="p-4 border-b w-12 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-700 font-medium divide-y divide-slate-100">
                  {ledgerRows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50">
                      <td className="p-2"><input type="text" value={row.name} onChange={e => updateLedgerRow(row.id, 'name', e.target.value)} className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded outline-none font-bold" placeholder="Required" /></td>
                      <td className="p-2"><input type="text" value={row.objectives} onChange={e => updateLedgerRow(row.id, 'objectives', e.target.value)} className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded outline-none" /></td>
                      <td className="p-2"><input type="text" value={row.beneficiaries} onChange={e => updateLedgerRow(row.id, 'beneficiaries', e.target.value)} className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded outline-none" /></td>
                      <td className="p-2"><input type="text" value={row.budget} onChange={e => updateLedgerRow(row.id, 'budget', e.target.value)} className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded outline-none" placeholder="e.g. R1,000,000" /></td>
                      <td className="p-2"><input type="text" value={row.jobs} onChange={e => updateLedgerRow(row.id, 'jobs', e.target.value)} className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded outline-none" /></td>
                      <td className="p-2"><input type="text" value={row.status} onChange={e => updateLedgerRow(row.id, 'status', e.target.value)} className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded outline-none font-bold" /></td>
                      <td className="p-2"><input type="text" value={row.delivery} onChange={e => updateLedgerRow(row.id, 'delivery', e.target.value)} className="w-full p-2 bg-transparent border border-transparent hover:border-slate-200 focus:border-emerald-500 focus:bg-white rounded outline-none" placeholder="Q1 2027" /></td>
                      <td className="p-2 text-center">
                        <button onClick={() => deleteLedgerRow(row.id)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {ledgerRows.length === 0 && (
                <div className="p-10 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">No LED projects recorded.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'drafting' && (
          <div className="flex-1 overflow-hidden rounded-2xl relative z-10 border border-slate-200 h-full">
            <DraftingSuiteTab 
              currentUser={currentUser} 
              activeTenantId={activeTenantId} 
              documentIdPrefix="led"
              defaultChapters={ledChapters}
            />
          </div>
        )}
      </div>

    </div>
  );
}
