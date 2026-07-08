import React, { useState } from 'react';
import { 
  ShieldAlert, BookOpen, Search, FileText, CheckSquare, Activity, 
  Users, Lock, Database, CheckCircle, AlertTriangle, XCircle, ChevronRight, Download
} from 'lucide-react';
import type { User } from '../types';

interface InternalAuditProps {
  currentUser: User;
  activeTenantId: string;
}

export function InternalAudit({ currentUser, activeTenantId }: InternalAuditProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rcm' | 'compliance' | 'iam' | 'modules' | 'workflows' | 'integration' | 'inbox' | 'templates'>('dashboard');

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-gray-900 select-none">
      <div className="bg-slate-900 text-white p-6 shrink-0 flex items-center justify-between shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <ShieldAlert className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Municipal Internal Audit Console
            </h1>
            <p className="text-slate-400 text-sm font-medium mt-1">MFMA Sec 165 & Sec 166 Compliance Framework</p>
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 px-6 flex gap-2 shrink-0 overflow-x-auto hide-scrollbar">
        {[
          { id: 'dashboard', label: 'System Dashboard', icon: Activity },
          { id: 'inbox', label: 'Inbox & Reviews', icon: CheckSquare },
          { id: 'templates', label: 'Audit Templates', icon: FileText },
          { id: 'compliance', label: 'Legislative Compliance', icon: BookOpen },
          { id: 'rcm', label: 'RCM Engine', icon: Search },
          { id: 'iam', label: 'IAM & Roles', icon: Users },
          { id: 'integration', label: 'ERP Integrations', icon: Database },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap flex items-center gap-2 ${isActive ? 'border-indigo-600 text-indigo-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
        
        {/* 3. CURRENT STATUS ACCORDING TO THE SYSTEM DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
              <Activity className="w-6 h-6 text-indigo-600" /> Current System Status
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Green */}
              <div className="bg-white rounded-2xl border-2 border-emerald-500 shadow p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><CheckCircle className="w-16 h-16 text-emerald-500" /></div>
                <h3 className="font-bold tracking-tight text-slate-800 mb-1">Financial Ledgers</h3>
                <p className="text-2xl font-black text-emerald-600 mb-2">Clean / Compliant</p>
                <p className="text-xs text-slate-500 font-medium">Reconciliations up to date. Automated daily bank sweep validated.</p>
              </div>

              {/* Yellow */}
              <div className="bg-white rounded-2xl border-2 border-yellow-400 shadow p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-yellow-500" /></div>
                <h3 className="font-bold tracking-tight text-slate-800 mb-1">IDP Performance</h3>
                <p className="text-2xl font-black text-yellow-600 mb-2">Minor Non-Comp.</p>
                <p className="text-xs text-slate-500 font-medium">2 Wards missing quarterly public participation signatures. Resolved in 5 days.</p>
              </div>

              {/* Orange */}
              <div className="bg-white rounded-2xl border-2 border-orange-500 shadow p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><AlertTriangle className="w-16 h-16 text-orange-500" /></div>
                <h3 className="font-bold tracking-tight text-slate-800 mb-1">Asset Management</h3>
                <p className="text-2xl font-black text-orange-600 mb-2">Material Breach</p>
                <p className="text-xs text-slate-500 font-medium">Unverified assets &gt; R5M. High risk of irregular expenditure.</p>
              </div>

              {/* Red */}
              <div className="bg-white rounded-2xl border-2 border-red-500 shadow p-5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10"><XCircle className="w-16 h-16 text-red-500" /></div>
                <h3 className="font-bold tracking-tight text-slate-800 mb-1">SCM Approvals</h3>
                <p className="text-2xl font-black text-red-600 mb-2">Systemic Collapse</p>
                <p className="text-xs text-slate-500 font-medium">Sec 139 Trigger: 30-Day Creditor Payment Rule failed &gt; 45% of invoices.</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800 uppercase">Live Metric Inputs & Thresholds</h3>
              </div>
              <div className="p-6 text-sm text-slate-600 space-y-4">
                <p>The dashboard dynamically calculates operational health based on live data integration:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Financial:</strong> Polling mSCOA GL for Section 65(2)(e) compliance (30-day payments).</li>
                  <li><strong>Performance:</strong> Comparing reported SDBIP KPIs against uploaded digital Evidence POEs.</li>
                  <li><strong>Governance:</strong> Audit finding resolution rates from cross-departmental Review Users via Azure AD Single Sign-On.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 6. MUNICIPAL COMPLIANCE & LEGISLATIVE DEADLINE ENGINE */}
        {activeTab === 'compliance' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
              <BookOpen className="w-6 h-6 text-indigo-600" /> Municipal Compliance Engine
            </h2>
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                   <tr>
                     <th className="p-4">Legislative Mandate</th>
                     <th className="p-4">Description</th>
                     <th className="p-4">Statutory Deadline</th>
                     <th className="p-4">Status / Escalation</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                   <tr className="hover:bg-slate-50">
                     <td className="p-4 font-bold text-slate-800">MFMA Sec 71</td>
                     <td className="p-4">Monthly Budget Statements to Mayor & Provincial Treasury</td>
                     <td className="p-4 font-mono font-medium">Within 10 working days after month-end</td>
                     <td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-bold">Compliant</span></td>
                   </tr>
                   <tr className="hover:bg-slate-50 bg-red-50/10">
                     <td className="p-4 font-bold text-slate-800">MFMA Sec 62</td>
                     <td className="p-4">General financial management duties (Creditor payments)</td>
                     <td className="p-4 font-mono font-medium">30 Days from Invoice</td>
                     <td className="p-4"><span className="px-2 py-1 bg-red-100 text-red-700 rounded font-bold">Material Breach - Esc. MM</span></td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                     <td className="p-4 font-bold text-slate-800">MFMA Sec 126</td>
                     <td className="p-4">Submission of Annual Financial Statements (AFS) to AG</td>
                     <td className="p-4 font-mono font-medium">31 August</td>
                     <td className="p-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-bold">Pending Setup</span></td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                     <td className="p-4 font-bold text-slate-800">MFMA Sec 127</td>
                     <td className="p-4">Tabling of Annual Report to Council</td>
                     <td className="p-4 font-mono font-medium">31 January</td>
                     <td className="p-4"><span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded font-bold">Approaching</span></td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                     <td className="p-4 font-bold text-slate-800">MFMA Sec 16 & 24</td>
                     <td className="p-4">Final Budget & IDP Council Approval Deadlines</td>
                     <td className="p-4 font-mono font-medium">31 May</td>
                     <td className="p-4"><span className="px-2 py-1 bg-slate-100 text-slate-700 rounded font-bold">Upcoming</span></td>
                   </tr>
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {/* 4. AUDIT RISK & CONTROL MATRICES (RCM) */}
        {activeTab === 'rcm' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
              <Search className="w-6 h-6 text-indigo-600" /> Audit Risk & Control Matrix Engine
            </h2>
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm text-sm text-slate-600 mb-6">
              <p>Dynamic mapping of Municipal Strategic Risks directly to Internal Audit Objectives, Inherent Risks, Control Activities, Testing Procedures, and Residual Risk factors.</p>
            </div>

            <div className="bg-white border text-xs border-slate-200 shadow-sm rounded-2xl overflow-hidden overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                   <tr>
                     <th className="p-3 whitespace-nowrap">Audit Objective</th>
                     <th className="p-3">Inherent Risk</th>
                     <th className="p-3">Control Activity</th>
                     <th className="p-3">Testing Procedure</th>
                     <th className="p-3 whitespace-nowrap">Residual Risk</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 text-slate-700">
                   <tr className="hover:bg-slate-50">
                     <td className="p-3 font-semibold border-r border-slate-100">Ensure compliance with MFMA Sec 65(2)(e) (30-Day Creditors)</td>
                     <td className="p-3 border-r border-slate-100">Invoices not processed within 30 days resulting in late payment penalties and service blockades.</td>
                     <td className="p-3 border-r border-slate-100">Automated invoice routing system tracks reception date; weekly exception reports generated for CFO.</td>
                     <td className="p-3 border-r border-slate-100">Extract an SCM log of all invoices paid in Q1. Compare invoice reception date against payment release date.</td>
                     <td className="p-3 font-mono text-orange-600 font-bold bg-orange-50">High (48% Failure)</td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                     <td className="p-3 font-semibold border-r border-slate-100">Prevent Irregular/Unauthorized Expenditure (Cost Containment Circular 82)</td>
                     <td className="p-3 border-r border-slate-100">Procurement bypasses prescribed SCM deviations leading to AG findings and AG material irregularities.</td>
                     <td className="p-3 border-r border-slate-100">All deviations above R200k must be pre-approved by the MM and tabled to Council.</td>
                     <td className="p-3 border-r border-slate-100">Sample 25 deviations. Inspect MM signature on approval memo and Council resolution minutes.</td>
                     <td className="p-3 font-mono text-yellow-600 font-bold bg-yellow-50">Medium</td>
                   </tr>
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {/* 2. INBOX & REVIEW REQUESTS */}
        {activeTab === 'inbox' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
              <CheckSquare className="w-6 h-6 text-indigo-600" /> Incoming Review Requests (Inbox)
            </h2>
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm text-sm text-slate-600 mb-6">
              <p>This space is where Review Users receive automated exception findings from the Internal Audit team via Azure AD integration. Upon action, the system automatically routes the workflow back to the relevant Audit Supervisor.</p>
            </div>

            <div className="bg-white border text-xs border-slate-200 shadow-sm rounded-2xl overflow-hidden overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                   <tr>
                     <th className="p-4">Reference</th>
                     <th className="p-4">Audit Objective</th>
                     <th className="p-4">Assigned To</th>
                     <th className="p-4">Status</th>
                     <th className="p-4">Incoming Date</th>
                     <th className="p-4">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-200 text-slate-700">
                   <tr className="hover:bg-slate-50">
                     <td className="p-4 font-mono font-bold text-indigo-600">AUD-2026-081</td>
                     <td className="p-4 font-semibold">SCM 30-Day Payment Verification</td>
                     <td className="p-4">{currentUser.fullName || currentUser.email || 'You'}</td>
                     <td className="p-4"><span className="px-2 py-1 bg-amber-100 text-amber-700 rounded font-bold">Pending Your Reply</span></td>
                     <td className="p-4">2026-06-05</td>
                     <td className="p-4">
                       <button onClick={() => alert('Routing back to Audit Supervisor...')} className="bg-indigo-600 text-white px-3 py-1.5 rounded font-bold hover:bg-indigo-700 transition-colors">Respond & Route</button>
                     </td>
                   </tr>
                   <tr className="hover:bg-slate-50">
                     <td className="p-4 font-mono font-bold text-indigo-600">AUD-2026-042</td>
                     <td className="p-4 font-semibold">Asset Register Spot Check</td>
                     <td className="p-4">{currentUser.fullName || currentUser.email || 'You'}</td>
                     <td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-bold">Cleared</span></td>
                     <td className="p-4">2026-05-20</td>
                     <td className="p-4 text-slate-400 font-bold">Completed</td>
                   </tr>
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {/* 5. AUDIT TEMPLATES */}
        {activeTab === 'templates' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
              <FileText className="w-6 h-6 text-indigo-600" /> Audit Findings Templates
            </h2>
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm text-sm text-slate-600 mb-6">
              <p>Field Auditors and Supervisors use these pre-approved templates to draft reviews and findings. Submitting a template automatically dispatches it to the relevant user's Inbox.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 p-4 font-bold text-slate-800 uppercase">
                  Exception Finding Template
                </div>
                <div className="p-6 space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Department Manager</label>
                    <select className="w-full border-slate-300 rounded-md text-sm">
                      <option>SCM Director</option>
                      <option>Technical Director</option>
                      <option>CFO</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Finding Description</label>
                    <textarea className="w-full border-slate-300 rounded-md text-sm" rows={3} placeholder="Describe the control failure..."></textarea>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Inherent Risk Mapping</label>
                    <input type="text" className="w-full border-slate-300 rounded-md text-sm" placeholder="e.g. High, Medium, Low" />
                  </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                  <button onClick={() => alert('Finding Drafted. Automatically Routed via Azure AD ping.')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">
                    Draft & Route Finding
                  </button>
                </div>
              </div>

              <div className="bg-white border text-sm border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 p-4 font-bold text-slate-800 uppercase">
                  Management Commendation Template
                </div>
                <div className="p-6 space-y-4 flex-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Department Manager</label>
                    <select className="w-full border-slate-300 rounded-md text-sm">
                      <option>IT Manager</option>
                      <option>HR Director</option>
                      <option>MM Office</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Commendation Highlights</label>
                    <textarea className="w-full border-slate-300 rounded-md text-sm" rows={3} placeholder="Describe the effective control environment..."></textarea>
                  </div>
                </div>
                <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
                  <button onClick={() => alert('Commendation Drafted. Automatically Routed via Azure AD ping.')} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors">
                    Draft & Route Commendation
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* 1. IDENTITY & ACCESS MANAGEMENT */}
        {activeTab === 'iam' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
              <Lock className="w-6 h-6 text-indigo-600" /> Identity & Access Management
            </h2>
            <div className="bg-white p-6 border border-slate-200 rounded-2xl shadow-sm text-sm text-slate-600 space-y-4 mb-6">
              <p>Seamless OAuth2 / OpenID Connect integration utilizing the <strong>@nkangaladm.gov.za</strong> Microsoft Entra ID (Azure AD) framework.</p>
              <p>All core functional mapping utilizes Azure AD security groups mapped directly to granular RBAC capabilities.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-slate-800 text-white p-6 rounded-2xl shadow">
                  <h3 className="font-bold mb-4 uppercase tracking-wider text-xs text-slate-300">Executive / Oversight</h3>
                  <ul className="space-y-3 font-medium">
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-indigo-400" /> Chief Audit Executive</li>
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-indigo-400" /> Accounting Officer (MM)</li>
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-indigo-400" /> Audit Committee Chair</li>
                  </ul>
               </div>

               <div className="bg-slate-800 text-white p-6 rounded-2xl shadow">
                  <h3 className="font-bold mb-4 uppercase tracking-wider text-xs text-slate-300">Operational Executors</h3>
                  <ul className="space-y-3 font-medium">
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-emerald-400" /> Audit Supervisor</li>
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-emerald-400" /> Field Internal Auditor</li>
                    <li className="flex gap-2"><CheckCircle className="w-5 h-5 text-emerald-400" /> Risk Manager</li>
                  </ul>
               </div>

               <div className="bg-slate-800 text-white p-6 rounded-2xl shadow border-2 border-amber-500/30">
                  <h3 className="font-bold mb-4 uppercase tracking-wider text-xs text-slate-300">Cross-Departmental Review</h3>
                  <ul className="space-y-3 font-medium">
                    <li className="flex gap-2 text-sm text-slate-300"><ChevronRight className="w-5 h-5 text-amber-500" /> e.g. SCM Managers, Tech Directors</li>
                    <li className="text-xs text-slate-400 mt-2">Log in via corporate creds strictly to view, respond to, or clear audit findings routed specifically to them.</li>
                  </ul>
               </div>
            </div>
          </div>
        )}

        {/* 7. DATA INTEGRATION POINTS */}
        {activeTab === 'integration' && (
          <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2 mb-4">
              <Database className="w-6 h-6 text-indigo-600" /> ERP & Data Integrations
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                 <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                   <Database className="w-6 h-6 text-blue-600" />
                 </div>
                 <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight mb-2">mSCOA Financial APIs</h3>
                 <p className="text-sm text-slate-600">Integrations into SAP / Munsoft / Sebata ledgers via secure REST APIs for continuous automated testing of Sec 65 payment rules, general ledger journal abnormalities, and budget anomalies.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                 <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                   <FileText className="w-6 h-6 text-emerald-600" />
                 </div>
                 <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight mb-2">Asset Register Scanners</h3>
                 <p className="text-sm text-slate-600">Automated ingestion of fixed asset modifications, additions, and disposals to calculate depreciation rule bypasses and trigger fieldwork physical verifications.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                 <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                   <Users className="w-6 h-6 text-purple-600" />
                 </div>
                 <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight mb-2">HR & Payroll Sync</h3>
                 <p className="text-sm text-slate-600">Matching vendor bank accounts against employee VIP Payroll bank accounts to identify potential conflict of interest and kickback risks before manual audit.</p>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl">
                 <div className="w-12 h-12 bg-white rounded-lg shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                   <Activity className="w-6 h-6 text-amber-600" />
                 </div>
                 <h3 className="font-bold text-slate-800 text-lg uppercase tracking-tight mb-2">Procurement Pipeline Hooks</h3>
                 <p className="text-sm text-slate-600">Listening to tender/bid committee award metadata to track local content compliance percentages and BBBEE points calculations for realtime flagging.</p>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

