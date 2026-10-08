import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, BookOpen, Search, FileText, CheckSquare, Activity, 
  Users, Lock, Database, CheckCircle, AlertTriangle, XCircle, ChevronRight, Download, Send, RefreshCw,
  Eye, Paperclip, FileSpreadsheet, Presentation, Image as ImageIcon, Bell, X, ArrowRight
} from 'lucide-react';
import type { User } from '../types';
import { OfficeDocumentViewer, PoeDocument } from './IPMS/OfficeDocumentViewer';
import { 
  SdbipWorkflowNotification, 
  isUserMatch, 
  fetchSdbipNotifications, 
  dispatchSdbipNotification, 
  markSdbipNotificationRead,
  extractKpiPoes 
} from '../utils/sdbipWorkflowHelper';
import { downloadOriginalFile } from '../utils/documentBinaryHelper';

interface InternalAuditProps {
  currentUser: User;
  activeTenantId: string;
}

export function InternalAudit({ currentUser, activeTenantId }: InternalAuditProps) {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'rcm' | 'compliance' | 'iam' | 'modules' | 'workflows' | 'integration' | 'inbox' | 'templates'>('dashboard');
  const [sdbipRows, setSdbipRows] = useState<any[]>([]);
  const [activeScorecard, setActiveScorecard] = useState<'all' | 'top' | 'dept'>('all');
  const [notifications, setNotifications] = useState<SdbipWorkflowNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedAuditKpi, setSelectedAuditKpi] = useState<any | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [success, setSuccess] = useState<string | null>(null);
  const [auditFilter, setAuditFilter] = useState<'ALL' | 'Pending Audit' | 'Submitted' | 'Reviewed' | 'Approved'>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [poes, setPoes] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);

  const loadNotifications = async () => {
    const list = await fetchSdbipNotifications(activeTenantId);
    setNotifications(list);
  };

  const fetchPoes = async () => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`);
      if (res.status === 429) {
        console.warn("HTTP 429: Rate limited while loading POEs. Retrying later.");
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setPoes(data.poes || []);
      }
    } catch (e) {
      console.warn("Error fetching POEs in InternalAudit:", e);
    }
  };

  const saveUpdatedRows = async (updatedRows: any[], targetRow?: any | null) => {
    const rowToTarget = targetRow || selectedAuditKpi;
    const isDept = rowToTarget?._scorecardSource === 'dept' || rowToTarget?.id?.startsWith('sdbip23');
    const endpoint = isDept
      ? `/api/tenant/${activeTenantId}/sdbip23`
      : `/api/tenant/${activeTenantId}/sdbip`;
    
    const itemsForSource = updatedRows.filter(r => isDept 
      ? (r._scorecardSource === 'dept' || r.id?.startsWith('sdbip23'))
      : (r._scorecardSource !== 'dept' && !r.id?.startsWith('sdbip23'))
    );

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: itemsForSource.length > 0 ? itemsForSource : updatedRows })
    });
    if (!res.ok) throw new Error(`Failed to save to ${isDept ? 'Departmental' : 'Top Layer'} scorecard on Supabase`);
    return res;
  };

  const fetchSdbip = (isBackground = false) => {
    if (!isBackground) setLoading(true);
    Promise.all([
      fetch(`/api/tenant/${activeTenantId}/sdbip`),
      fetch(`/api/tenant/${activeTenantId}/sdbip23`)
    ])
      .then(async ([resTop, resDept]) => {
        const topData = resTop.ok ? await resTop.json() : { items: [] };
        const deptData = resDept.ok ? await resDept.json() : { items: [] };

        const topItems = (topData.items || []).map((x: any) => ({ ...x, _scorecardSource: 'top' as const }));
        const deptItems = (deptData.items || []).map((x: any) => ({ ...x, _scorecardSource: 'dept' as const }));

        const mergedList = [...topItems];
        deptItems.forEach((d: any) => {
          const existingIdx = mergedList.findIndex(t => t.id === d.id);
          if (existingIdx >= 0) {
            mergedList[existingIdx] = { ...mergedList[existingIdx], ...d, _scorecardSource: 'dept' };
          } else {
            mergedList.push(d);
          }
        });

        setSdbipRows(mergedList);
        setSelectedAuditKpi(prev => {
          if (!prev) return null;
          return mergedList.find((x: any) => x.id === prev.id) || prev;
        });
      })
      .catch(err => {
        console.warn("Error fetching SDBIP in InternalAudit:", err);
      })
      .finally(() => {
        if (!isBackground) setLoading(false);
      });
  };

  useEffect(() => {
    let lastLoaded = Date.now();
    
    fetchSdbip(false);
    fetchPoes();
    loadNotifications();

    const interval = setInterval(() => {
      // Only poll in the background if the tab is active/visible
      if (document.visibilityState === 'visible') {
        fetchSdbip(true);
        fetchPoes();
        loadNotifications();
        lastLoaded = Date.now();
      }
    }, 30000); // Poll every 30 seconds instead of 4 seconds to avoid HTTP 429 rate limits

    const handleFocus = () => {
      // Throttle window focus fetch to once every 15 seconds
      if (Date.now() - lastLoaded > 15000 && document.visibilityState === 'visible') {
        fetchSdbip(true);
        fetchPoes();
        loadNotifications();
        lastLoaded = Date.now();
      }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTenantId]);

  const handleVerifyAudit = async (rowId: string, isCleared: boolean) => {
    const targetRow = sdbipRows.find(r => r.id === rowId);
    if (!targetRow) return;

    if (!isCleared && !auditNotes.trim()) {
      alert('Please provide Internal Audit findings/comments explaining why the KPI is Not Achieved.');
      return;
    }

    const updatedRows = sdbipRows.map(r => {
      if (r.id === rowId) {
        const workflows = r.workflows || {};
        let updatedAny = false;
        ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
          if (workflows[ph] && (workflows[ph].status === 'pending_audit' || workflows[ph].status === 'reviewed' || workflows[ph].status === 'pending_review')) {
            workflows[ph] = { 
              ...workflows[ph], 
              status: isCleared ? 'approved' : 'draft', 
              auditedBy: currentUser.fullName || currentUser.email,
              auditedAt: new Date().toLocaleDateString(),
              comments: auditNotes || (isCleared ? 'Cleared by Internal Audit' : 'Returned with audit findings')
            };
            updatedAny = true;
          }
        });

        // Fallback: if no quarter was matching, target the first available workflow
        if (!updatedAny) {
          const phs = ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'];
          for (const ph of phs) {
            if (workflows[ph]) {
              workflows[ph] = { 
                ...workflows[ph], 
                status: isCleared ? 'approved' : 'draft', 
                auditedBy: currentUser.fullName || currentUser.email,
                auditedAt: new Date().toLocaleDateString(),
                comments: auditNotes || (isCleared ? 'Cleared by Internal Audit' : 'Returned with audit findings')
              };
              break;
            }
          }
        }

        const currentHistory = r.workflowHistory || [];
        const newHistoryItem = {
          date: new Date().toISOString(),
          action: isCleared ? 'Internal Audit Cleared & Approved' : 'Internal Audit Returned with Findings',
          user: currentUser.fullName || currentUser.email,
          notes: auditNotes || (isCleared ? 'Cleared by Internal Audit Desk' : 'Returned with audit queries')
        };
        return {
          ...r,
          workflowStatus: isCleared ? 'Approved' : 'Returned',
          auditedBy: currentUser.fullName || currentUser.email,
          auditNotes: auditNotes,
          workflows,
          workflowHistory: [...currentHistory, newHistoryItem]
        };
      }
      return r;
    });

    try {
      const res = await saveUpdatedRows(updatedRows, targetRow);
      if (res.ok) {
        setSdbipRows(updatedRows);

        // Dispatch notifications to Submitter, Approver, and Reviewer
        const recipients = [
          targetRow.submitter,
          targetRow.approver,
          targetRow.reviewer
        ].filter(Boolean);

        await dispatchSdbipNotification(activeTenantId, {
          targetUser: recipients,
          senderUser: currentUser.fullName || currentUser.email,
          kpiId: targetRow.id,
          refNum: targetRow.refNum,
          kpiName: targetRow.kpi,
          phase: 'General',
          message: isCleared 
            ? `Internal Audit statutory clearance GRANTED for KPI ${targetRow.refNum}. Officially approved.`
            : `Internal Audit RETURNED KPI ${targetRow.refNum} with audit findings / queries. Resubmission required.`,
          comment: auditNotes,
          actionType: isCleared ? 'cleared' : 'returned'
        });

        await loadNotifications();

        setSuccess(isCleared ? 'KPI Verified and Cleared by Internal Audit!' : 'KPI Returned with Audit Queries.');
        setTimeout(() => setSuccess(null), 4000);
        setSelectedAuditKpi(null);
        setAuditNotes('');
      }
    } catch (e) {
      console.error(e);
    }
  };

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
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <CheckSquare className="w-6 h-6 text-indigo-600" /> Incoming SDBIP KPI Audit Review Desk
              </h2>
              <button 
                onClick={() => fetchSdbip(false)}
                className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-slate-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh SDBIP
              </button>
            </div>

            {success && (
              <div className="p-4 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-2">
                <CheckCircle className="w-5 h-5" />
                {success}
              </div>
            )}

            {/* Real-time Internal Audit Notification Alert Banner */}
            {(() => {
              const auditNotifs = notifications.filter(n => 
                (isUserMatch(n.targetUser, currentUser) || n.actionType === 'pushed_to_audit') && !n.read
              );
              if (auditNotifs.length === 0) return null;
              return (
                <div className="space-y-2">
                  {auditNotifs.map((notif) => (
                    <div 
                      key={notif.id}
                      className="p-4 rounded-xl border border-rose-300 bg-rose-50 text-rose-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md animate-fade-in"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-rose-200 text-rose-800 rounded-lg shrink-0 mt-0.5">
                          <Bell className="w-5 h-5 animate-bounce" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-black bg-rose-200 text-rose-900 px-2 py-0.5 rounded border border-rose-300">{notif.refNum}</span>
                            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-rose-200 text-rose-800 border border-rose-300">
                              Incoming Audit Verification Request
                            </span>
                            <span className="text-[10px] text-rose-600 font-mono">
                              {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs font-bold mt-1 text-rose-950">{notif.message}</p>
                          {notif.comment && (
                            <div className="mt-1.5 p-2 bg-white/80 rounded-lg border border-rose-200 text-[11px] italic text-rose-800">
                              <strong>Reviewer Note:</strong> "{notif.comment}"
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => {
                            const targetRow = sdbipRows.find(r => r.id === notif.kpiId || r.refNum === notif.refNum);
                            if (targetRow) {
                              setSelectedAuditKpi(targetRow);
                              setAuditFilter('ALL');
                            }
                          }}
                          className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-sm flex items-center gap-1.5"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>Audit & Verify KPI</span>
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            const updated = await markSdbipNotificationRead(activeTenantId, notif.id, notifications);
                            setNotifications(updated);
                          }}
                          className="p-1.5 bg-rose-200 hover:bg-rose-300 text-rose-800 rounded-lg transition cursor-pointer"
                          title="Dismiss notification"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xs text-sm text-slate-600 flex flex-col md:flex-row items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-800">Live OPMS SDBIP Top-Layer Reporting Integration</p>
                <p className="text-xs text-slate-500">All KPIs submitted, pushed for review, approved, or directed to Internal Audit appear here in real time.</p>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setActiveScorecard('all')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      activeScorecard === 'all' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Scorecards
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScorecard('top')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      activeScorecard === 'top' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Top Layer
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveScorecard('dept')}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                      activeScorecard === 'dept' 
                        ? 'bg-indigo-600 text-white shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Departmental
                  </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                  {(['ALL', 'Pending Audit', 'Submitted', 'Reviewed', 'Approved'] as const).map((filterOpt) => (
                    <button
                      key={filterOpt}
                      onClick={() => setAuditFilter(filterOpt)}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        auditFilter === filterOpt 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {filterOpt}
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search KPI or auditor..."
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* SDBIP Table */}
              <div className={selectedAuditKpi ? "lg:col-span-7" : "lg:col-span-12"}>
                <div className="bg-white border text-xs border-slate-200 shadow-sm rounded-2xl overflow-hidden overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="p-3">Ref Num</th>
                        <th className="p-3">KPA & Strategic Objective</th>
                        <th className="p-3">KPI Description</th>
                        <th className="p-3">Workflow Status</th>
                        <th className="p-3">Submitted / Reviewer</th>
                        <th className="p-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-700">
                      {(() => {
                        const filteredAuditRows = sdbipRows.filter(row => {
                          const wfStatus = row.workflowStatus || 'Draft';
                          let matchesStatus = true;
                          if (auditFilter === 'Pending Audit') {
                            matchesStatus = wfStatus === 'Pending Audit' || 
                              wfStatus === 'Reviewed' || 
                              wfStatus === 'Submitted' || 
                              row.workflows?.q1?.status === 'pending_audit' || 
                              row.workflows?.q1?.status === 'reviewed' ||
                              row.workflows?.q2?.status === 'pending_audit' || 
                              row.workflows?.q2?.status === 'reviewed' ||
                              row.workflows?.q3?.status === 'pending_audit' || 
                              row.workflows?.q3?.status === 'reviewed' ||
                              row.workflows?.q4?.status === 'pending_audit' ||
                              row.workflows?.q4?.status === 'reviewed';
                          } else if (auditFilter !== 'ALL') {
                            if (auditFilter === 'Reviewed') {
                              matchesStatus = wfStatus === 'Reviewed' || wfStatus === 'Pending Audit' || wfStatus === 'Approved';
                            } else if (auditFilter === 'Submitted') {
                              matchesStatus = wfStatus === 'Submitted' || wfStatus === 'Reviewed' || wfStatus === 'Pending Audit';
                            } else {
                              matchesStatus = wfStatus === auditFilter;
                            }
                          }
                          const matchesSearch = !auditSearchQuery ||
                            (row.refNum && row.refNum.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
                            (row.kpi && row.kpi.toLowerCase().includes(auditSearchQuery.toLowerCase())) ||
                            (row.internalAudit && row.internalAudit.toLowerCase().includes(auditSearchQuery.toLowerCase()));
                          return matchesStatus && matchesSearch;
                        });

                        if (filteredAuditRows.length === 0) {
                          return (
                            <tr>
                              <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                                No SDBIP KPI items match filter "{auditFilter}".
                              </td>
                            </tr>
                          );
                        }

                        return filteredAuditRows.map((row) => {
                          const wfStatus = row.workflowStatus || 'Draft';
                          const isAuditTarget = wfStatus === 'Pending Audit' || row.workflows?.q1?.status === 'pending_audit' || row.workflows?.q2?.status === 'pending_audit' || row.workflows?.q3?.status === 'pending_audit' || row.workflows?.q4?.status === 'pending_audit';

                          return (
                            <tr 
                              key={row.id} 
                              className={`hover:bg-slate-50 transition ${selectedAuditKpi?.id === row.id ? 'bg-indigo-50/60 font-semibold' : ''}`}
                            >
                              <td className="p-3 font-mono font-black text-indigo-600">{row.refNum}</td>
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{row.kpas || 'General'}</div>
                                <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{row.strategicObj}</div>
                              </td>
                              <td className="p-3">
                                <div className="font-semibold text-slate-800 truncate max-w-[220px]">{row.kpi || 'Unnamed KPI'}</div>
                                <div className="text-[10px] text-slate-400">Target: {row.annualTarget || row.q1 || '-'}</div>
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${
                                  wfStatus === 'Approved' ? 'bg-emerald-100 text-emerald-950 border-emerald-500' :
                                  wfStatus === 'Submitted' ? 'bg-amber-100 text-amber-950 border-amber-500' :
                                  wfStatus === 'Reviewed' ? 'bg-violet-100 text-violet-950 border-violet-500' :
                                  wfStatus === 'Pending Audit' ? 'bg-rose-100 text-rose-950 border-rose-500 animate-pulse' :
                                  'bg-slate-100 text-slate-900 border-slate-400'
                                }`}>
                                  {wfStatus}
                                </span>
                              </td>
                              <td className="p-3 text-[11px] text-slate-500">
                                <div>Sub: {row.submitter || row.submittedBy || 'Submitter'}</div>
                                {row.reviewer && <div className="text-[10px] text-slate-400">Rev: {row.reviewer}</div>}
                                {row.internalAudit && <div className="text-[10px] text-rose-600 font-bold">Auditor: {row.internalAudit}</div>}
                              </td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    setSelectedAuditKpi(row);
                                    setAuditNotes(row.auditNotes || '');
                                  }}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-xs cursor-pointer"
                                >
                                  Inspect
                                </button>
                              </td>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Audit Detail Panel */}
              {selectedAuditKpi && (
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-lg space-y-4 flex flex-col">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">Internal Audit Inspection</span>
                      <h3 className="text-sm font-black text-slate-900 font-mono">
                        REF: {selectedAuditKpi.refNum}
                      </h3>
                    </div>
                    <button 
                      onClick={() => setSelectedAuditKpi(null)}
                      className="text-slate-400 hover:text-slate-700 text-xs font-mono px-2 py-1 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <p><strong>KPI:</strong> {selectedAuditKpi.kpi}</p>
                    <p><strong>KPA:</strong> {selectedAuditKpi.kpas}</p>
                    <p><strong>Strategic Objective:</strong> {selectedAuditKpi.strategicObj}</p>
                    <p><strong>Annual Target:</strong> {selectedAuditKpi.annualTarget}</p>
                    <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-[11px]">
                      <div>Q1 Actual: <strong className="text-emerald-600">{selectedAuditKpi.q1Actual || '-'}</strong></div>
                      <div>Q2 Actual: <strong className="text-emerald-600">{selectedAuditKpi.q2Actual || '-'}</strong></div>
                      <div>Q3 Actual: <strong className="text-emerald-600">{selectedAuditKpi.q3Actual || '-'}</strong></div>
                      <div>Q4 Actual: <strong className="text-emerald-600">{selectedAuditKpi.q4Actual || '-'}</strong></div>
                    </div>
                  </div>

                  {/* Portfolio of Evidence Verification */}
                  <div className="space-y-1.5 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                    <label className="text-[10px] font-black uppercase text-indigo-900 flex items-center gap-1.5">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Portfolio of Evidence (PoE) Audit Desk</span>
                    </label>
                    {selectedAuditKpi.poeDesc || selectedAuditKpi.q1PoeDesc ? (
                      <p className="text-xs text-slate-700 italic bg-white p-2 rounded border border-indigo-100">
                        "{selectedAuditKpi.poeDesc || selectedAuditKpi.q1PoeDesc}"
                      </p>
                    ) : null}

                    {(() => {
                      const relevantPoes = extractKpiPoes(selectedAuditKpi, poes);
                      if (relevantPoes.length === 0) {
                        return (
                          <p className="text-[10.5px] text-slate-400 italic">
                            No files attached to this KPI.
                          </p>
                        );
                      }

                      return (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Attached Verification Documents:</span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                              {relevantPoes.length} PoE File(s)
                            </span>
                          </div>
                          <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                            {relevantPoes.map((p) => {
                              const ext = p.name.split('.').pop()?.toLowerCase();
                              return (
                                <div key={p.id} className="flex items-center justify-between p-2 bg-white border border-indigo-100 rounded-lg text-xs">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    {ext === 'xlsx' || ext === 'xls' || ext === 'csv' ? (
                                      <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : ext === 'pptx' || ext === 'ppt' ? (
                                      <Presentation className="w-4 h-4 text-amber-600 shrink-0" />
                                    ) : ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || ext === 'svg' ? (
                                      <ImageIcon className="w-4 h-4 text-rose-600 shrink-0" />
                                    ) : (
                                      <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                                    )}
                                    <div className="truncate min-w-0">
                                      <span className="text-slate-800 font-semibold truncate text-[11px] block">{p.name}</span>
                                      <span className="text-[9px] text-slate-400">{p.quarter} • {p.size || '1.5 MB'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPreviewDoc({
                                          id: p.id,
                                          name: p.name,
                                          mimeType: p.fileType || 'application/octet-stream',
                                          dataUrl: p.dataUrl || p.fileData,
                                          size: p.size,
                                          uploadedAt: p.date,
                                          uploadedBy: 'Submitter',
                                          kpiName: selectedAuditKpi.kpi,
                                          quarter: p.quarter
                                        });
                                      }}
                                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                      title="View Portfolio of Evidence on-system without downloading"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>View</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        downloadOriginalFile(p.name, p.dataUrl || p.fileData, {
                                          kpiName: selectedAuditKpi.kpi,
                                          refNum: selectedAuditKpi.refNum,
                                          quarter: p.quarter,
                                          mimeType: p.fileType
                                        });
                                      }}
                                      className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-xs"
                                      title="Download original file in its exact native binary format"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Previous Stage Workflow Remarks History */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    {(selectedAuditKpi as any).submitterNotes && (
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-xs">
                        <span className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider block">Submitter Remarks:</span>
                        <p className="text-slate-700 italic mt-0.5">"{(selectedAuditKpi as any).submitterNotes}"</p>
                      </div>
                    )}
                    {(selectedAuditKpi as any).approverNotes && (
                      <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-xs">
                        <span className="text-[9.5px] font-bold text-amber-700 uppercase tracking-wider block">Executive Approver Remarks:</span>
                        <p className="text-amber-900 italic mt-0.5">"{(selectedAuditKpi as any).approverNotes}"</p>
                      </div>
                    )}
                    {(selectedAuditKpi as any).reviewerNotes && (
                      <div className="bg-indigo-50 p-2.5 rounded-lg border border-indigo-200 text-xs">
                        <span className="text-[9.5px] font-bold text-indigo-700 uppercase tracking-wider block">PMU Reviewer Remarks:</span>
                        <p className="text-indigo-900 italic mt-0.5">"{(selectedAuditKpi as any).reviewerNotes}"</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500">Internal Audit Verdict & Findings / Queries</label>
                    <textarea
                      value={auditNotes}
                      onChange={(e) => setAuditNotes(e.target.value)}
                      placeholder="Type audit findings, verification notes, or return queries..."
                      className="w-full bg-slate-50 border border-slate-300 rounded p-2.5 text-xs text-slate-900 h-24 focus:outline-none focus:border-indigo-600 resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => handleVerifyAudit(selectedAuditKpi.id, false)}
                      className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <XCircle className="w-4 h-4" />
                      Not Achieved (Return Query)
                    </button>
                    <button
                      onClick={() => handleVerifyAudit(selectedAuditKpi.id, true)}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl py-2.5 font-bold text-xs uppercase tracking-wider transition cursor-pointer flex items-center justify-center gap-1 shadow"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Achieved (Clear Audit Sign-off)
                    </button>
                  </div>
                </div>
              )}
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

      {previewDoc && (
        <OfficeDocumentViewer
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}

