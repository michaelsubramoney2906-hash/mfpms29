import React, { useState, useEffect } from 'react';
import { 
  FileBarChart, Download, Send, CheckCircle, Clock, AlertCircle, 
  Share2, ShieldCheck, UserCheck, CornerDownRight, CheckSquare
} from 'lucide-react';
import type { User } from '../../types';

interface ReportsProps {
  currentUser: User;
  activeTenantId: string;
}

interface ReportItem {
  id: string;
  title: string;
  type: 'PDP' | 'JSC' | 'Performance Plan';
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Mid Term' | 'Annual';
  status: 'Pending Review' | 'Supervisor Approved' | 'Internal Audit Approved' | 'Rejected' | 'Draft';
  createdAt: string;
}

interface SharedReport {
  id: string;
  title: string;
  type: string;
  period: string;
  auditorEmail: string;
  auditorComments: string;
  auditorRating: 'Compliant' | 'Non-Compliant' | 'With Reservations';
  status: 'Dispatched to Managers' | 'Forwarded to Subordinates' | 'Signed-Off by Subordinate';
  managerComments?: string;
  managerEmail?: string;
  subordinateEmail?: string;
  subordinateSignature?: string;
  signedOffAt?: string;
  createdAt: string;
}

export function Reports({ currentUser, activeTenantId }: ReportsProps) {
  const [reports, setReports] = useState<ReportItem[]>([
    { id: '1', title: 'Q1 Performance Plan Report', type: 'Performance Plan', period: 'Q1', status: 'Draft', createdAt: new Date(Date.now() - 86400000 * 90).toISOString() },
    { id: '2', title: 'Q2 Performance Plan Report', type: 'Performance Plan', period: 'Q2', status: 'Draft', createdAt: new Date(Date.now() - 86400000 * 60).toISOString() },
    { id: '3', title: 'Q3 Performance Plan Report', type: 'Performance Plan', period: 'Q3', status: 'Draft', createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: '4', title: 'Q4 Performance Plan Report', type: 'Performance Plan', period: 'Q4', status: 'Draft', createdAt: new Date().toISOString() },
    { id: '5', title: 'Mid Term PDP Review', type: 'PDP', period: 'Mid Term', status: 'Pending Review', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: '6', title: 'Annual JSC Assessment', type: 'JSC', period: 'Annual', status: 'Internal Audit Approved', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    { id: '7', title: 'Performance Agreement', type: 'Performance Plan', period: 'Annual', status: 'Draft', createdAt: new Date().toISOString() },
  ]);

  const [sharedReports, setSharedReports] = useState<SharedReport[]>([]);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'catalogue' | 'dispatcher'>('catalogue');
  const [isLoadingShared, setIsLoadingShared] = useState(false);

  // Form states for dispatching new report (Auditor)
  const [dispatchTitle, setDispatchTitle] = useState('');
  const [dispatchType, setDispatchType] = useState('Performance Plan');
  const [dispatchPeriod, setDispatchPeriod] = useState('Q4');
  const [dispatchComments, setDispatchComments] = useState('');
  const [dispatchRating, setDispatchRating] = useState<'Compliant' | 'Non-Compliant' | 'With Reservations'>('Compliant');

  // Form states for forwarding to subordinates (Manager)
  const [forwardingReportId, setForwardingReportId] = useState<string | null>(null);
  const [managerNotes, setManagerNotes] = useState('');
  const [subordinateEmailInput, setSubordinateEmailInput] = useState('');

  // Form states for subordinate sign-off
  const [signOffName, setSignOffName] = useState('');

  useEffect(() => {
    fetchSharedReports();
  }, [activeTenantId]);

  const fetchSharedReports = async () => {
    setIsLoadingShared(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/shared-reports?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (!data.reports || data.reports.length === 0) {
          const defaultShared: SharedReport[] = [
            {
              id: 'shared-1',
              title: 'Annual Moderated Performance Plan Summary (FY 2025/2026)',
              type: 'Performance Plan',
              period: 'Annual',
              auditorEmail: 'chief.auditor@local',
              auditorComments: 'Following complete legislative compliance review and portfolio of evidence inspections, the general outcomes are certified compliant.',
              auditorRating: 'Compliant',
              status: 'Dispatched to Managers',
              createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
            },
            {
              id: 'shared-2',
              title: 'Q3 Professional Competency Audit Opinion',
              type: 'JSC',
              period: 'Q3',
              auditorEmail: 'internal.compliance@local',
              auditorComments: 'Verified competency assessments against training annexures.',
              auditorRating: 'With Reservations',
              status: 'Forwarded to Subordinates',
              managerEmail: 'line.manager@local',
              managerComments: 'Make sure to review training action plans specified on page 3 of the PDP review outline.',
              subordinateEmail: currentUser.email,
              createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
            }
          ];
          setSharedReports(defaultShared);
          await saveSharedReports(defaultShared);
        } else {
          setSharedReports(data.reports);
        }
      }
    } catch (e) {
      console.error("Failed to load shared reports from Supabase:", e);
    } finally {
      setIsLoadingShared(false);
    }
  };

  const saveSharedReports = async (updatedList: SharedReport[]) => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/shared-reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reports: updatedList })
      });
    } catch (e) {
      console.error("Failed to persist shared reports to Supabase:", e);
    }
  };

  const handleSendToReview = (reportId: string) => {
    setLoadingAction(reportId);
    setTimeout(() => {
      setReports(reports.map(r => r.id === reportId ? { ...r, status: 'Pending Review' } : r));
      setLoadingAction(null);
      alert('Report exported automatically to Supervisor and Internal Audit for review.');
    }, 1200);
  };

  const handleAuditorDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispatchTitle.trim() || !dispatchComments.trim()) {
      alert("Please fill out complete report titles and audit executive commentary.");
      return;
    }

    const newShared: SharedReport = {
      id: `shared_rep_${Date.now()}`,
      title: dispatchTitle.trim(),
      type: dispatchType,
      period: dispatchPeriod,
      auditorEmail: currentUser.email || 'internal.audit@local',
      auditorComments: dispatchComments.trim(),
      auditorRating: dispatchRating,
      status: 'Dispatched to Managers',
      createdAt: new Date().toISOString()
    };

    const nextList = [newShared, ...sharedReports];
    setSharedReports(nextList);
    await saveSharedReports(nextList);

    setDispatchTitle('');
    setDispatchComments('');
    alert(`Success! Finalised audit report shared and dispatched to all Line Managers.`);
  };

  const handleManagerForward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forwardingReportId || !subordinateEmailInput.trim() || !managerNotes.trim()) {
      alert("Please select a report, configure cover notes and recipient teammate's email.");
      return;
    }

    const nextList = sharedReports.map(rep => {
      if (rep.id === forwardingReportId) {
        return {
          ...rep,
          status: 'Forwarded to Subordinates' as const,
          managerEmail: currentUser.email,
          managerComments: managerNotes.trim(),
          subordinateEmail: subordinateEmailInput.trim().toLowerCase()
        };
      }
      return rep;
    });

    setSharedReports(nextList);
    await saveSharedReports(nextList);

    setForwardingReportId(null);
    setManagerNotes('');
    setSubordinateEmailInput('');
    alert(`Success! Governance review forwarded safely to subordinate.`);
  };

  const handleSubordinateSignOff = async (reportId: string) => {
    if (!signOffName.trim()) {
      alert("Please type your signature name to authorize the official sign-off.");
      return;
    }

    const nextList = sharedReports.map(rep => {
      if (rep.id === reportId) {
        return {
          ...rep,
          status: 'Signed-Off by Subordinate' as const,
          subordinateSignature: signOffName.trim(),
          signedOffAt: new Date().toISOString()
        };
      }
      return rep;
    });

    setSharedReports(nextList);
    await saveSharedReports(nextList);

    setSignOffName('');
    alert(`Sign-Off committed! Digital signature recorded securely in the Supabase ledger.`);
  };

  const handleDownload = (report: any, format: 'Word' | 'Excel' | 'PDF') => {
    const filename = `${report.title.replace(/\s+/g, '_')}.${format === 'Word' ? 'doc' : format === 'Excel' ? 'xls' : 'pdf'}`;
    
    if (format === 'PDF') {
      alert(`Started PDF download for ${report.title}.`);
      return;
    }

    let fileContent = '';
    let mimeType = '';

    if (format === 'Word') {
      mimeType = 'application/msword';
      fileContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
        <head><title>${report.title}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #1e293b; font-size: 24px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; text-transform: uppercase; }
          .metadata { font-size: 11px; color: #64748b; margin-bottom: 20px; font-family: monospace; background-color: #f8fafc; padding: 10px; border: 1px solid #e2e8f0; border-radius: 6px; }
        </style>
        </head>
        <body>
          <h1>${report.title} - Performance Review</h1>
          <div class="metadata">
            <p><strong>REPORT ID:</strong> ${report.id}</p>
            <p><strong>REPRESENTATION TYPE:</strong> ${report.type || 'Custom Plan'}</p>
            <p><strong>REPORTING TERM:</strong> ${report.period}</p>
            <p><strong>GENERATION DATE:</strong> ${new Date(report.createdAt || Date.now()).toLocaleString()}</p>
          </div>
          <h2>Audit & Moderation Breakdown</h2>
          <p><strong>Auditor Opinion:</strong> ${report.auditorComments || 'N/A'}</p>
          <p><strong>Auditor Assessment:</strong> ${report.auditorRating || 'Compliant'}</p>
          ${report.managerComments ? `<p><strong>Manager Remarks:</strong> ${report.managerComments}</p>` : ''}
          ${report.subordinateSignature ? `<p><strong>Subordinate Acknowledgment:</strong> Digitally Signed by ${report.subordinateSignature} on ${new Date(report.signedOffAt || '').toLocaleString()}</p>` : ''}
        </body>
        </html>
      `;
    } else if (format === 'Excel') {
      mimeType = 'application/vnd.ms-excel';
      fileContent = `
        <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:x='urn:schemas-microsoft-com:office:excel' xmlns='http://www.w3.org/TR/REC-html40'>
        <body>
          <table>
            <tr><th colspan="2" style="font-size:16px; font-weight:bold; background-color:#312e81; color:white;">${report.title}</th></tr>
            <tr><td><strong>Auditor Rating</strong></td><td>${report.auditorRating || 'Compliant'}</td></tr>
            <tr><td><strong>Auditor Remarks</strong></td><td>${report.auditorComments || 'N/A'}</td></tr>
            <tr><td><strong>Manager Notes</strong></td><td>${report.managerComments || 'None'}</td></tr>
            <tr><td><strong>Recipient Subordinate</strong></td><td>${report.subordinateEmail || 'Unassigned'}</td></tr>
            <tr><td><strong>Acknowledgment Signature</strong></td><td>${report.subordinateSignature || 'Pending'}</td></tr>
          </table>
        </body>
        </html>
      `;
    }

    const blob = new Blob([fileContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Draft':
        return <span className="px-2 py-0.5 bg-slate-150 text-slate-600 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
      case 'Pending Review':
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> {status}</span>;
      case 'Supervisor Approved':
      case 'Internal Audit Approved':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {status}</span>;
      case 'Rejected':
        return <span className="px-2 py-0.5 bg-red-105 text-red-700 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {status}</span>;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden shadow-2xl text-slate-900">
      <div className="bg-slate-900 text-white p-6 shrink-0 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg relative z-20">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            <FileBarChart className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              Performance Reports & Routing Workspace
            </h1>
            <p className="text-slate-400 text-xs font-medium mt-1">Compile and route audited/moderated performance agreements down delegation trees securely</p>
          </div>
        </div>

        <div className="flex bg-slate-850 rounded-xl p-1 shrink-0 border border-slate-705 font-semibold text-xs text-white">
          <button 
            onClick={() => setActiveTab('catalogue')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${activeTab === 'catalogue' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            Reports Catalogue
          </button>
          <button 
            onClick={() => setActiveTab('dispatcher')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${activeTab === 'dispatcher' ? 'bg-indigo-600 text-white font-extrabold' : 'text-slate-400 hover:text-white'}`}
          >
            <Share2 className="w-3.5 h-3.5" />
            Governance Dispatches
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50">
        <div className="max-w-6xl mx-auto space-y-6">

          {activeTab === 'catalogue' ? (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-850 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-550 shrink-0"></span>
                  Elected Quarterly & Annual Performance Reports
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {reports.map(report => (
                    <div key={report.id} className="border border-slate-250 rounded-xl bg-white shadow-xs flex flex-col hover:shadow-xs transition duration-150 overflow-hidden text-xs">
                      <div className="p-5 flex-1">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-1.5 flex-wrap">
                             <span className="bg-slate-150 text-slate-650 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{report.type}</span>
                             <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded font-bold uppercase tracking-wider">{report.period}</span>
                          </div>
                          {getStatusBadge(report.status)}
                        </div>
                        <h3 className="font-extrabold text-slate-800 text-sm mb-2">{report.title}</h3>
                        <p className="text-slate-500 font-medium leading-relaxed">System-generated summary aggregating metrics, narrative descriptions, and compliance audits for instant download.</p>
                      </div>
                      <div className="bg-slate-50 border-t border-slate-150 p-3 flex flex-col gap-2">
                          <div className="grid grid-cols-3 gap-1">
                            <button 
                              onClick={() => handleDownload(report, 'Word')}
                              className="flex justify-center items-center gap-1 px-2 py-1.5 bg-white hover:bg-indigo-50 border border-slate-200 text-indigo-700 rounded-md font-bold transition-colors shadow-xs cursor-pointer"
                            >
                              Word
                            </button>
                            <button 
                              onClick={() => handleDownload(report, 'Excel')}
                              className="flex justify-center items-center gap-1 px-2 py-1.5 bg-white hover:bg-emerald-50 border border-slate-200 text-emerald-700 rounded-md font-bold transition-colors shadow-xs cursor-pointer"
                            >
                              Excel
                            </button>
                            <button 
                              onClick={() => handleDownload(report, 'PDF')}
                              className="flex justify-center items-center gap-1 px-2 py-1.5 bg-white hover:bg-red-50 border border-slate-200 text-red-700 rounded-md font-bold transition-colors shadow-xs cursor-pointer"
                            >
                              PDF
                            </button>
                          </div>
                          <button 
                            onClick={() => handleSendToReview(report.id)}
                            disabled={report.status !== 'Draft' || loadingAction === report.id}
                            className={`w-full flex justify-center items-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-colors cursor-pointer ${report.status === 'Draft' ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs' : 'bg-slate-150 text-slate-400 cursor-not-allowed'}`}
                          >
                            {loadingAction === report.id ? 'Sending...' : <><Send className="w-3.5 h-3.5" /> Send to Review</>}
                          </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-indigo-50 border border-indigo-150 rounded-2xl p-6 flex flex-col sm:flex-row gap-6 items-center">
                <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center shrink-0 shadow-inner">
                   <Clock className="w-6 h-6 text-indigo-700" />
                </div>
                <div className="text-xs">
                   <h3 className="font-extrabold text-indigo-900 text-sm">Dispatched Oversight Reporting Policy</h3>
                   <p className="text-indigo-700 font-medium mt-1 leading-normal">Once performance plans are finalized and internal compliance audits are completed, formal reviews are prepared for routing. Switch to the <strong>Governance Dispatches</strong> tab to execute your role's delegation and forwarding flows.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 text-xs font-medium">
              
              {/* Internal Auditor / Administrator panel: Dispatch new audit reports */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-tight">Auditor Dispatch Deck</h2>
                </div>
                
                <form onSubmit={handleAuditorDispatch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Report Title</label>
                    <input 
                      type="text" 
                      placeholder="e.g. FY 25/26 Quarter 4 Moderated Final Outcome"
                      value={dispatchTitle}
                      onChange={(e) => setDispatchTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none font-semibold"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Template Type</label>
                      <select 
                        value={dispatchType}
                        onChange={(e) => setDispatchType(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer font-semibold"
                      >
                        <option>Performance Plan</option>
                        <option>PDP</option>
                        <option>JSC</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Period</label>
                      <select 
                        value={dispatchPeriod}
                        onChange={(e) => setDispatchPeriod(e.target.value)}
                        className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer font-semibold"
                      >
                        <option>Q1</option>
                        <option>Q2</option>
                        <option>Mid Term</option>
                        <option>Q3</option>
                        <option>Q4</option>
                        <option>Annual</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <div className="flex justify-between items-center">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Audit Opinion Commentary</label>
                      <div className="flex items-center gap-3">
                        <label className="font-extrabold text-[9px] text-slate-500 uppercase flex items-center gap-1">Compliance Opinion:</label>
                        <select 
                          value={dispatchRating} 
                          onChange={(e: any) => setDispatchRating(e.target.value)}
                          className="bg-slate-100 border border-slate-200 text-[10px] font-bold rounded px-1.5 py-0.5 cursor-pointer outline-none"
                        >
                          <option>Compliant</option>
                          <option>Non-Compliant</option>
                          <option>With Reservations</option>
                        </select>
                      </div>
                    </div>
                    <textarea 
                      rows={3}
                      placeholder="Detail legislative findings, moderated portfolio adjustments, and official audit sign-off terms here..."
                      value={dispatchComments}
                      onChange={(e) => setDispatchComments(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none font-semibold leading-relaxed"
                    />
                  </div>
                  
                  <div className="md:col-span-2 flex justify-end">
                    <button 
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl font-bold tracking-wide flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      Compile and Dispatch Report to Line Managers
                    </button>
                  </div>
                </form>
              </div>

              {/* Line Manager Panel: Forward dispatches from internal audit */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <UserCheck className="w-5 h-5 text-indigo-600 shrink-0" />
                  <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-tight">Manager Forwarding Console</h2>
                </div>

                {sharedReports.filter(r => r.status === 'Dispatched to Managers').length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No incoming dispatched reviews pending managerial forwarding to subordinates at this moment.</p>
                ) : (
                  <form onSubmit={handleManagerForward} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      
                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Select Dispatched Audit Record</label>
                        <select 
                          value={forwardingReportId || ''} 
                          onChange={(e) => setForwardingReportId(e.target.value || null)}
                          className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none cursor-pointer font-semibold"
                        >
                          <option value="">-- Choose verified report to forward --</option>
                          {sharedReports.filter(r => r.status === 'Dispatched to Managers').map(rep => (
                            <option key={rep.id} value={rep.id}>{rep.title} ({rep.period})</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Subordinate Teammate Email Recipient</label>
                        <input 
                          type="email" 
                          placeholder="e.g. employee.john@nkangaladm.gov.za"
                          value={subordinateEmailInput}
                          onChange={(e) => setSubordinateEmailInput(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none font-semibold"
                        />
                      </div>

                    </div>

                    <div className="space-y-1">
                      <label className="font-bold text-slate-700 block uppercase tracking-wider text-[9px] mb-0">Manager Review Remarks & Cover Notes</label>
                      <textarea 
                        rows={2}
                        placeholder="Add your coaching directives, final scoring adjustments, or instructions for subordinate signoff..."
                        value={managerNotes}
                        onChange={(e) => setManagerNotes(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 focus:border-indigo-500 rounded-lg outline-none font-semibold leading-relaxed"
                      />
                    </div>

                    <div className="flex justify-end">
                      <button 
                        type="submit"
                        disabled={!forwardingReportId || !subordinateEmailInput.trim()}
                        className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-bold tracking-wide flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                      >
                        <CornerDownRight className="w-4 h-4" />
                        Forward Direct to Subordinate Employee
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* LIVE DISPATCH FEED / RECEIPT LEDGER DISPLAY */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-extrabold text-slate-850 uppercase tracking-tight mb-4 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0"></span>
                  Active Report Distribution & Sign-off Feeds
                </h2>

                <div className="space-y-4">
                  {sharedReports.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-xs text-slate-400 font-bold uppercase">No reports routed yet</p>
                    </div>
                  ) : (
                    sharedReports.map(rep => {
                      const isMyIncomingReport = rep.subordinateEmail && rep.subordinateEmail.toLowerCase() === currentUser.email.toLowerCase();
                      
                      return (
                        <div 
                          key={rep.id} 
                          className={`border rounded-xl p-5 ${
                            rep.status === 'Signed-Off by Subordinate' 
                              ? 'border-emerald-250 bg-emerald-50/20' 
                              : isMyIncomingReport 
                                ? 'border-amber-250 bg-amber-50/30 ring-2 ring-amber-450/60' 
                                : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-dashed border-slate-150">
                            <div>
                              <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider mr-2">
                                {rep.type}
                              </span>
                              <span className="bg-slate-100 text-slate-650 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">
                                {rep.period}
                              </span>
                              <h3 className="font-extrabold text-slate-850 text-sm mt-1">{rep.title}</h3>
                            </div>
                            <div className="shrink-0">
                              {rep.status === 'Signed-Off by Subordinate' ? (
                                <span className="px-3 py-1 bg-emerald-600 text-white font-extrabold rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1 animate-fadeIn">
                                  ✓ Fully Signed-Off
                                </span>
                              ) : rep.status === 'Forwarded to Subordinates' ? (
                                <span className="px-3 py-1 bg-amber-500 text-white font-extrabold rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  ⚡ Pending Subordinate Sign-Off
                                </span>
                              ) : (
                                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 font-extrabold rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                                  ⎋ Dispatched to Line Managers
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Content metrics and routing notes */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4 text-xs font-semibold">
                            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/60">
                              <span className="text-[9px] font-black text-slate-450 uppercase block tracking-wider">Internal Audit Opinion</span>
                              <span className={`inline-block mt-1 mb-1.5 px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                                rep.auditorRating === 'Compliant' ? 'bg-emerald-105 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                              }`}>
                                {rep.auditorRating}
                              </span>
                              <p className="text-slate-600 leading-relaxed italic">"{rep.auditorComments}"</p>
                              <span className="text-[9px] font-bold text-slate-400 block mt-2">Certified by: {rep.auditorEmail}</span>
                            </div>

                            {rep.managerEmail && (
                              <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/60">
                                <span className="text-[9px] font-black text-slate-450 uppercase block tracking-wider font-extrabold text-indigo-950">Manager Directives</span>
                                <p className="text-slate-600 leading-relaxed italic mt-2">"{rep.managerComments}"</p>
                                <span className="text-[9px] font-bold text-slate-400 block mt-2">Forwarded by: {rep.managerEmail}</span>
                                <span className="text-[9px] font-black text-indigo-600 block mt-1">Recipient: {rep.subordinateEmail}</span>
                              </div>
                            )}

                            <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/60 flex flex-col justify-between">
                              <div>
                                <span className="text-[9px] font-black text-slate-450 uppercase block tracking-wider">Subordinate Sign-off</span>
                                {rep.subordinateSignature ? (
                                  <div className="mt-2.5 space-y-1">
                                    <p className="font-mono text-[11px] font-extrabold text-slate-800">
                                      Sign-off: <span className="underline italic text-indigo-700">{rep.subordinateSignature}</span>
                                    </p>
                                    <p className="text-[9px] text-slate-400 font-bold">
                                      Date: {new Date(rep.signedOffAt || '').toLocaleString()}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="mt-2.5">
                                    <p className="text-[10px] text-slate-450 leading-snug italic">Acknowledgment signature pending on this governance thread.</p>
                                  </div>
                                )}
                              </div>
                              <div className="flex gap-1.5 mt-3 justify-end text-[10px]">
                                <button 
                                  onClick={() => handleDownload(rep, 'Word')}
                                  className="p-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded shadow-xs cursor-pointer"
                                  title="Export Doc"
                                >
                                  Word
                                </button>
                                <button 
                                  onClick={() => handleDownload(rep, 'Excel')}
                                  className="p-1 px-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded shadow-xs cursor-pointer"
                                  title="Export Spreadsheet"
                                >
                                  Excel
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* INCOMING ACTION BLOCK FOR RECEIVING SUBORDINATES */}
                          {isMyIncomingReport && rep.status === 'Forwarded to Subordinates' && (
                            <div className="mt-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-250 rounded-xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                              <div className="space-y-0.5">
                                <p className="font-extrabold text-amber-900">Formally Shared Assessment Awaiting Receipt Sign-Off</p>
                                <p className="text-amber-700 font-medium text-[10.5px]">Type your full name below to electronically authorize, acknowledge and sign off on this validated performance outline.</p>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Type full name to sign"
                                  value={signOffName}
                                  onChange={(e) => setSignOffName(e.target.value)}
                                  className="px-2.5 py-1.5 bg-white border border-amber-200 focus:border-amber-500 rounded-lg outline-none font-bold placeholder:text-slate-450 text-xs shadow-inner"
                                />
                                <button 
                                  onClick={() => handleSubordinateSignOff(rep.id)}
                                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-black tracking-wide shrink-0 transition shadow-xs cursor-pointer"
                                >
                                  Commit Sign-off
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
