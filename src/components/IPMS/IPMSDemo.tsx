import React, { useState, useEffect } from 'react';
import {
  Sparkles, UserCheck, ShieldCheck, FileText, CheckCircle2,
  AlertCircle, Clock, ArrowRight, ChevronRight, RefreshCw, Send,
  XCircle, AlertTriangle, RotateCcw, ThumbsUp, ThumbsDown, Check,
  Eye, Building2, Award, Scale, Layers, Activity, Flag,
  GraduationCap, User, Mail, History, ExternalLink, MessageSquare,
  Shield, CheckSquare, ChevronDown
} from 'lucide-react';
import type { User as UserType } from '../../types';

interface IPMSDemoProps {
  currentUser: UserType;
  activeTenantId: string;
  onImpersonate?: (user: UserType) => void;
  onNavigateToSubModule?: (subId: string) => void;
}

interface DemoActor {
  id: string;
  email: string;
  fullName: string;
  role: string;
  badge: string;
  department: string;
  jobFunction: string;
  color: string;
  avatarBg: string;
}

const DEMO_ACTORS: DemoActor[] = [
  {
    id: 'user',
    email: 'user@mzansiflow.co.za',
    fullName: 'Demo Standard User',
    role: 'Standard Employee / Submitter',
    badge: 'Submitter',
    department: 'Corporate Services',
    jobFunction: 'Performance Management Specialist',
    color: 'from-blue-600 to-indigo-700',
    avatarBg: 'bg-blue-600'
  },
  {
    id: 'manager',
    email: 'manager@mzansiflow.co.za',
    fullName: 'Demo Line Manager',
    role: 'Line Manager / Approver',
    badge: 'Manager Approval',
    department: 'Corporate Services',
    jobFunction: 'Divisional Manager: Corporate Services',
    color: 'from-amber-600 to-orange-700',
    avatarBg: 'bg-amber-600'
  },
  {
    id: 'audit',
    email: 'audit@mzansiflow.co.za',
    fullName: 'Demo Internal Auditor',
    role: 'Internal Audit Reviewer',
    badge: 'Internal Audit',
    department: 'Internal Audit Services',
    jobFunction: 'Senior Internal Auditor',
    color: 'from-emerald-600 to-teal-700',
    avatarBg: 'bg-emerald-600'
  },
  {
    id: 'dpmc',
    email: 'dpmc@mzansiflow.co.za',
    fullName: 'Demo DPMC Moderator',
    role: 'DPMC Committee Moderator',
    badge: 'DPMC Moderation',
    department: 'Departmental Performance Moderation (DPMC)',
    jobFunction: 'DPMC Committee Moderator',
    color: 'from-purple-600 to-violet-800',
    avatarBg: 'bg-purple-600'
  }
];

export function IPMSDemo({ currentUser, activeTenantId, onImpersonate, onNavigateToSubModule }: IPMSDemoProps) {
  const [activeActorEmail, setActiveActorEmail] = useState<string>('user@mzansiflow.co.za');
  const [activeTab, setActiveTab] = useState<'console' | 'agreement' | 'notifications' | 'history'>('console');
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [demoState, setDemoState] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifFilter, setNotifFilter] = useState<string>('all');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for dialogs & actions
  const [submitNotes, setSubmitNotes] = useState<string>('Submitting 2024/2025 Performance Agreement for line manager review and validation.');
  const [managerActionType, setManagerActionType] = useState<'approve' | 'request_changes' | 'reject'>('approve');
  const [managerComments, setManagerComments] = useState<string>('All KPAs align with departmental strategic priorities. Verified portfolio of evidence (PoE) for all KPIs and personal development goals.');
  const [managerScores, setManagerScores] = useState<Record<string, number>>({
    'kpi-demo-1': 4,
    'kpi-demo-2': 4,
    'kpi-demo-3': 5,
    'kpi-demo-4': 4,
    'kpi-demo-5': 4
  });
  const [managerKpiComments, setManagerKpiComments] = useState<Record<string, string>>({
    'kpi-demo-1': 'Target achieved; PoE verified against municipal quarterly tracker.',
    'kpi-demo-2': 'UIFW audit finding resolved; clear evidence attached.',
    'kpi-demo-3': '100% compliance with statutory SDBIP deadlines verified.',
    'kpi-demo-4': 'Community consultations and public register confirmed.',
    'kpi-demo-5': 'Departmental automation goals fully delivered.'
  });

  const [auditActionType, setAuditActionType] = useState<'approve' | 'request_resubmission' | 'reject'>('approve');
  const [auditComments, setAuditComments] = useState<string>('Audit verification completed. Sample evidence evaluated and statutory Section 57 / SDBIP consistency verified. Granted clean audit clearance for DPMC moderation.');
  const [auditScores, setAuditScores] = useState<Record<string, number>>({
    'kpi-demo-1': 4,
    'kpi-demo-2': 4,
    'kpi-demo-3': 5,
    'kpi-demo-4': 4,
    'kpi-demo-5': 4
  });
  const [auditKpiComments, setAuditKpiComments] = useState<Record<string, string>>({
    'kpi-demo-1': 'PoE authenticated against municipal SDBIP register; fully compliant.',
    'kpi-demo-2': 'Audited against Auditor-General finding resolution file. Clear.',
    'kpi-demo-3': 'Statutory verification passed with zero compliance discrepancies.',
    'kpi-demo-4': 'Public consultation minutes verified in audit sample.',
    'kpi-demo-5': 'System architecture logs and verification sign-off confirmed.'
  });
  const [auditKpiCompliance, setAuditKpiCompliance] = useState<Record<string, string>>({
    'kpi-demo-1': 'Compliant',
    'kpi-demo-2': 'Compliant',
    'kpi-demo-3': 'Compliant',
    'kpi-demo-4': 'Compliant',
    'kpi-demo-5': 'Compliant'
  });

  // DPMC scoring state (defaulting to scores between 4.0 and 5.0)
  const [dpmcScores, setDpmcScores] = useState<Record<string, number>>({
    'kpi-demo-1': 4,
    'kpi-demo-2': 4,
    'kpi-demo-3': 5,
    'kpi-demo-4': 5,
    'kpi-demo-5': 4,
    'jsc-demo-1': 4,
    'jsc-demo-2': 4,
    'jsc-demo-3': 4,
    'jsc-demo-4': 5
  });
  const [dpmcKpiComments, setDpmcKpiComments] = useState<Record<string, string>>({
    'kpi-demo-1': 'Committee concurs with line manager and internal auditor rating.',
    'kpi-demo-2': 'Exceptional turnaround on UIFW reduction verified by committee.',
    'kpi-demo-3': 'Outstanding statutory governance performance endorsed.',
    'kpi-demo-4': 'Community consultation rating confirmed by moderation panel.',
    'kpi-demo-5': 'Digital transformation milestone recognized for incentive calculation.'
  });
  const [dpmcComments, setDpmcComments] = useState<string>('The Departmental Performance Moderation Committee (DPMC) has reviewed the audited performance agreement. Outstanding achievements noted in Good Governance, SDBIP targets, and UIFW reduction. Performance score confirmed and signed off.');

  const fetchDemoData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/demo-workflow?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setDemoState(data);
      }
      
      // Also fetch notifications
      const notifRes = await fetch(`/api/tenant/${activeTenantId}/ipms-notifications?t=${Date.now()}`);
      if (notifRes.ok) {
        const nData = await notifRes.json();
        setNotifications(nData.notifications || []);
      }
    } catch (e: any) {
      console.error('Error fetching demo data:', e);
      setErrorMsg('Failed to load demo data from Supabase: ' + e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDemoData();
    // Auto sync when active actor or tenant changes
  }, [activeTenantId]);

  const handleExecuteAction = async (action: string, payload: any = {}) => {
    setActionLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/demo-workflow/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...payload })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Action failed');
      }
      setDemoState(data.state);
      setSuccessMsg(data.message || 'Action executed and stored in Supabase successfully!');
      await fetchDemoData(true);
    } catch (e: any) {
      setErrorMsg(e.message || 'Execution failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetDemo = async () => {
    if (!window.confirm('Are you sure you want to reset the entire IPMS Demo workflow back to the captured starting state? This will clear test reviews and re-seed Supabase.')) return;
    await handleExecuteAction('reset');
  };

  const handleQuickImpersonate = (actor: DemoActor) => {
    if (onImpersonate) {
      const userObj: UserType = {
        id: `demo-${actor.id}-mzansiflow`,
        email: actor.email,
        fullName: actor.fullName,
        jobFunction: actor.jobFunction,
        department: actor.department,
        role: 'tenant_user',
        systemRole: actor.id === 'user' ? 'Standard User' : (actor.id === 'manager' ? 'Manager' : (actor.id === 'audit' ? 'Internal Auditor' : 'DPMC')),
        tenantId: activeTenantId === 'global' ? 'tenant-229' : activeTenantId
      };
      onImpersonate(userObj);
    } else {
      setActiveActorEmail(actor.email);
    }
  };

  const currentActor = DEMO_ACTORS.find(a => a.email === activeActorEmail) || DEMO_ACTORS[0];
  const workflowStatus = demoState?.status || 'DRAFT_CAPTURED';

  const getStageNumber = () => {
    switch (workflowStatus) {
      case 'DRAFT_CAPTURED': return 1;
      case 'SUBMITTED_TO_MANAGER': return 2;
      case 'MANAGER_CHANGES_REQUESTED': return 1;
      case 'MANAGER_REJECTED': return 1;
      case 'MANAGER_APPROVED': return 3;
      case 'AUDIT_RESUBMISSION_REQUESTED': return 2;
      case 'AUDIT_REJECTED': return 2;
      case 'AUDIT_APPROVED': return 4;
      case 'DPMC_COMPLETED': return 5;
      default: return 1;
    }
  };

  const currentStage = getStageNumber();

  const filteredNotifications = notifications.filter(n => {
    if (notifFilter === 'all') {
      const demoEmails = DEMO_ACTORS.map(a => a.email);
      const sen = (n.senderEmail || '').toLowerCase();
      const rec = (n.recipientEmail || '').toLowerCase();
      return demoEmails.some(de => sen.includes(de) || rec.includes(de)) || rec === 'internal_audit' || rec === 'dpmc';
    }
    const target = notifFilter.toLowerCase();
    const sen = (n.senderEmail || '').toLowerCase();
    const rec = (n.recipientEmail || '').toLowerCase();
    return rec.includes(target) || (target === 'audit' && rec === 'internal_audit') || (target === 'dpmc' && rec === 'dpmc');
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto">
      {/* Top Banner & Header */}
      <div className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 px-6 py-5 shadow-lg shrink-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-md flex items-center justify-center">
              <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold tracking-tight text-white">IPMS End-to-End Workflow Demonstration</h1>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Supabase Live Store
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                  4 Simulated Profiles
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Demonstrates a captured Performance Agreement (<code className="text-indigo-300">user@mzansiflow.co.za</code>) submitted to Manager (<code className="text-amber-300">manager@mzansiflow.co.za</code>) ➔ pushed to Internal Audit (<code className="text-emerald-300">audit@mzansiflow.co.za</code>) ➔ sent to DPMC (<code className="text-purple-300">dpmc@mzansiflow.co.za</code>) for scoring & comments.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={() => fetchDemoData(false)}
              disabled={loading || actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Refresh latest state from Supabase"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync DB
            </button>
            <button
              onClick={handleResetDemo}
              disabled={actionLoading}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-amber-300 hover:text-amber-200 bg-amber-950/40 hover:bg-amber-950/70 border border-amber-600/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset workflow to pristine captured state"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Demo
            </button>
          </div>
        </div>

        {/* Global Notifications or Alerts */}
        {errorMsg && (
          <div className="mt-3 p-3 rounded-lg bg-red-950/60 border border-red-500/30 text-red-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-red-200 text-xs font-bold">Dismiss</button>
          </div>
        )}
        {successMsg && (
          <div className="mt-3 p-3 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="text-emerald-400 hover:text-emerald-200 text-xs font-bold">Dismiss</button>
          </div>
        )}

        {/* 4-Stage Workflow Progress Stepper */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            {/* Step 1 */}
            <div className={`p-3 rounded-xl border transition-all ${
              currentStage === 1
                ? 'bg-blue-950/40 border-blue-500/50 text-white shadow-sm ring-1 ring-blue-500/30'
                : currentStage > 1
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Step 1 • Standard User</span>
                {currentStage > 1 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-100 mt-1">Captured PA & Submission</p>
              <p className="text-[11px] text-slate-400 truncate">user@mzansiflow.co.za</p>
            </div>

            {/* Step 2 */}
            <div className={`p-3 rounded-xl border transition-all ${
              currentStage === 2
                ? 'bg-amber-950/40 border-amber-500/50 text-white shadow-sm ring-1 ring-amber-500/30'
                : currentStage > 2
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">Step 2 • Line Manager</span>
                {currentStage > 2 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : currentStage === 2 ? (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-100 mt-1">Manager Review & Decision</p>
              <p className="text-[11px] text-slate-400 truncate">manager@mzansiflow.co.za</p>
            </div>

            {/* Step 3 */}
            <div className={`p-3 rounded-xl border transition-all ${
              currentStage === 3
                ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-sm ring-1 ring-emerald-500/30'
                : currentStage > 3
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Step 3 • Internal Audit</span>
                {currentStage > 3 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : currentStage === 3 ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-100 mt-1">Audit QA & Dispatch</p>
              <p className="text-[11px] text-slate-400 truncate">audit@mzansiflow.co.za</p>
            </div>

            {/* Step 4 */}
            <div className={`p-3 rounded-xl border transition-all ${
              currentStage === 4
                ? 'bg-purple-950/40 border-purple-500/50 text-white shadow-sm ring-1 ring-purple-500/30'
                : currentStage === 5
                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300'
                : 'bg-slate-900/40 border-slate-800 text-slate-500'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">Step 4 • DPMC Moderation</span>
                {currentStage === 5 ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : currentStage === 4 ? (
                  <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse"></span>
                ) : (
                  <Clock className="w-3.5 h-3.5 text-slate-600" />
                )}
              </div>
              <p className="text-xs font-bold text-slate-100 mt-1">Final Scoring & Comments</p>
              <p className="text-[11px] text-slate-400 truncate">dpmc@mzansiflow.co.za</p>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Demo Users / Personas Strip */}
      <div className="px-6 py-4 bg-slate-900/60 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Interactive Persona Bar</span>
            <span className="text-[11px] text-slate-500">• Select who to act as, or switch session to test across whole system</span>
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span>Current Workflow Status:</span>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-slate-800 text-indigo-300 border border-slate-700">
              {workflowStatus.replace(/_/g, ' ')}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {DEMO_ACTORS.map(actor => {
            const isSelected = activeActorEmail === actor.email;
            const notifCount = notifications.filter(n => {
              const rec = (n.recipientEmail || '').toLowerCase();
              return rec.includes(actor.email) || (actor.id === 'audit' && rec === 'internal_audit') || (actor.id === 'dpmc' && rec === 'dpmc');
            }).length;

            return (
              <div
                key={actor.id}
                onClick={() => setActiveActorEmail(actor.email)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md ring-2 ring-indigo-500/20'
                    : 'bg-slate-900/70 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                {isSelected && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-500 text-white shadow-sm">
                    Active Console Actor
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-lg ${actor.avatarBg} text-white font-black text-xs flex items-center justify-center shadow`}>
                      {actor.id === 'user' ? 'USR' : actor.id === 'manager' ? 'MGR' : actor.id === 'audit' ? 'AUD' : 'DPMC'}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white leading-tight">{actor.fullName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{actor.email}</p>
                    </div>
                  </div>
                  {notifCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {notifCount}
                    </span>
                  )}
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium truncate max-w-[120px]">{actor.badge}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickImpersonate(actor);
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 hover:text-indigo-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                    title="Log into entire app as this user via Impersonation"
                  >
                    <span>Login As</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="border-b border-slate-800 bg-slate-900/40 px-6 shrink-0 flex items-center justify-between">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveTab('console')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'console'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>Interactive Workflow Console</span>
          </button>
          <button
            onClick={() => setActiveTab('agreement')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'agreement'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-blue-400" />
            <span>Performance Agreement Details</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 text-slate-300">5 KPAs / 5 KPIs</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'notifications'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-amber-400" />
            <span>Live Notifications Feed</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] bg-indigo-500/20 text-indigo-300">{notifications.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5 text-emerald-400" />
            <span>Audit & Moderation Trail</span>
          </button>
        </div>

        {onNavigateToSubModule && (
          <div className="hidden md:flex items-center gap-2 text-xs">
            <span className="text-slate-500">Jump to Standard IPMS Submodule:</span>
            <button
              onClick={() => onNavigateToSubModule('ipms-manager-review')}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
            >
              Manager Approval
            </button>
            <button
              onClick={() => onNavigateToSubModule('ipms-internal-audit')}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
            >
              Internal Audit Review
            </button>
            <button
              onClick={() => onNavigateToSubModule('ipms-dpmc')}
              className="text-[11px] px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
            >
              DPMC
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 p-6">
        {/* ========================================================= */}
        {/* TAB 1: WORKFLOW CONSOLE                                   */}
        {/* ========================================================= */}
        {activeTab === 'console' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Active Actor Banner */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl ${currentActor.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow`}>
                  {currentActor.id.toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-slate-400">Currently Acting As:</span>
                    <span className="text-sm font-bold text-white">{currentActor.fullName}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                      {currentActor.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{currentActor.jobFunction} • <span className="font-mono text-slate-300">{currentActor.email}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleQuickImpersonate(currentActor)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <User className="w-3.5 h-3.5" />
                  Impersonate in App
                </button>
              </div>
            </div>

            {/* STAGE 1: SUBMITTER CONSOLE (user@mzansiflow.co.za) */}
            <div className={`p-5 rounded-2xl border transition-all ${
              currentStage === 1
                ? 'bg-slate-900/90 border-blue-500/50 shadow-xl'
                : 'bg-slate-900/40 border-slate-800/80 opacity-90'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold">
                    1
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Standard User Submission (Performance Agreement Captured)</span>
                      {currentStage > 1 && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Submitted & Locked</span>}
                    </h3>
                    <p className="text-xs text-slate-400">Owner: <span className="font-mono text-blue-300">user@mzansiflow.co.za</span> • Captures KPAs, KPIs, JSCs, PDPs, and submits to Line Manager</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  currentStage === 1
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    : 'bg-emerald-500/10 text-emerald-400'
                }`}>
                  {workflowStatus === 'DRAFT_CAPTURED' ? 'Draft Ready' : (workflowStatus === 'MANAGER_CHANGES_REQUESTED' ? 'Changes Requested' : 'Submitted')}
                </span>
              </div>

              {/* Stage 1 Content & Action */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-500 block text-[11px]">KPAs Captured</span>
                    <span className="font-bold text-white">5 Areas (100% Weight)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-500 block text-[11px]">KPIs & Targets</span>
                    <span className="font-bold text-white">5 Measurable KPIs (with PoEs)</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-500 block text-[11px]">JSC Competencies</span>
                    <span className="font-bold text-white">4 Core Competencies</span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                    <span className="text-slate-500 block text-[11px]">PDP Interventions</span>
                    <span className="font-bold text-white">3 Targeted Courses</span>
                  </div>
                </div>

                {workflowStatus === 'DRAFT_CAPTURED' || workflowStatus === 'MANAGER_CHANGES_REQUESTED' || workflowStatus === 'AUDIT_RESUBMISSION_REQUESTED' ? (
                  <div className="space-y-4 bg-blue-950/20 p-4 rounded-xl border border-blue-500/20">
                    <div>
                      <label className="block text-xs font-bold text-blue-300 mb-1">
                        Submission Notes / Subordinate Remarks for Line Manager:
                      </label>
                      <textarea
                        value={submitNotes}
                        onChange={(e) => setSubmitNotes(e.target.value)}
                        rows={2}
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-blue-500"
                        placeholder="Enter submission comments or details for your line manager..."
                      />
                    </div>

                    {/* Individual KPI Submission Quick Bar */}
                    <div className="pt-2 border-t border-blue-500/20">
                      <span className="text-xs font-bold text-slate-300 block mb-2">KPI Self-Evaluation Actions (Redo & Push / Submit to Manager):</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {(demoState?.agreement?.kpis || []).map((kpi: any) => {
                          const isSubmitted = kpi.reviewStatus === 'Submitted for Approval' || workflowStatus === 'SUBMITTED_TO_MANAGER';
                          return (
                            <div key={kpi.id} className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <span className="font-mono text-xs font-bold text-indigo-400 block">{kpi.kpiNo}</span>
                                <span className="text-[11px] text-slate-300 truncate block max-w-[140px]">{kpi.kpi}</span>
                                <span className="text-[10px] text-emerald-400 font-semibold">{kpi.poeStatus} ({kpi.poeDoc})</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleExecuteAction('redo_kpi', { kpiId: kpi.id })}
                                  className="px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 transition cursor-pointer"
                                  title="Unlock this single KPI to redo self-evaluation"
                                >
                                  Redo
                                </button>
                                <button
                                  type="button"
                                  disabled={actionLoading}
                                  onClick={() => handleExecuteAction('submit_kpi', { kpiId: kpi.id, notes: submitNotes })}
                                  className={`px-2 py-1 text-[9.5px] font-bold uppercase tracking-wider rounded transition cursor-pointer ${
                                    isSubmitted
                                      ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                                  }`}
                                  title="Submit / Push this single KPI to Line Manager"
                                >
                                  {isSubmitted ? 'Pushed' : 'Push'}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-blue-500/20">
                      <span className="text-[11px] text-slate-400">
                        Submitting pushes official notification to <strong className="text-amber-300">manager@mzansiflow.co.za</strong> in Supabase.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteAction('user_redo')}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          title="Redo self evaluation for all KPIs"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Redo All KPIs</span>
                        </button>
                        <button
                          onClick={() => handleExecuteAction('submit_to_manager', { notes: submitNotes })}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 flex items-center justify-center gap-1.5 shadow-md transition-colors cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit / Push All to Manager</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Performance Agreement successfully submitted to Line Manager <strong className="text-white">manager@mzansiflow.co.za</strong>.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExecuteAction('user_redo')}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition cursor-pointer self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Redo Self Evaluation</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* STAGE 2: MANAGER CONSOLE (manager@mzansiflow.co.za) */}
            <div className={`p-5 rounded-2xl border transition-all ${
              currentStage === 2
                ? 'bg-slate-900/90 border-amber-500/50 shadow-xl'
                : 'bg-slate-900/40 border-slate-800/80 opacity-90'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
                    2
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Line Manager Review & Approval</span>
                      {currentStage > 2 && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Approved & Dispatched</span>}
                    </h3>
                    <p className="text-xs text-slate-400">Reviewer: <span className="font-mono text-amber-300">manager@mzansiflow.co.za</span> • Approves, rejects, or requests changes. Outcome notified to user; approval dispatches to Internal Audit.</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  currentStage === 2
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : currentStage > 2
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {currentStage === 2 ? 'Action Required' : (currentStage > 2 ? 'Approved' : 'Awaiting Submission')}
                </span>
              </div>

              {/* Stage 2 Content & Action */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                {currentStage === 2 ? (
                  <div className="space-y-4 bg-amber-950/20 p-4 rounded-xl border border-amber-500/20">
                    {/* Submitted KPIs for Review Section */}
                    <div className="space-y-3 bg-slate-900/90 p-4 rounded-xl border border-amber-500/30">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                        <div>
                          <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                            <FileText className="w-4 h-4 text-amber-400" />
                            <span>KPIs Submitted for Manager Review & Approval ({demoState?.agreement?.kpis?.length || 5})</span>
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            Submitted by <span className="font-mono text-indigo-300">user@mzansiflow.co.za</span> (Demo Standard User)
                          </p>
                        </div>

                        {onNavigateToSubModule && (
                          <button
                            type="button"
                            onClick={() => {
                              sessionStorage.setItem('ipms_manager_review_target', JSON.stringify({
                                userId: 'user@mzansiflow.co.za',
                                kpiId: demoState?.lastSubmittedKpiId || 'kpi-demo-1'
                              }));
                              onNavigateToSubModule('ipms-manager-review');
                            }}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition flex items-center gap-1.5 shadow-md cursor-pointer shrink-0"
                          >
                            <span>Open Full Manager Approval Workspace</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        {(demoState?.agreement?.kpis || []).map((kpi: any) => {
                          const isKpiSubmitted = kpi.reviewStatus === 'Submitted for Approval' || workflowStatus === 'SUBMITTED_TO_MANAGER';
                          const currentScore = managerScores[kpi.id] || Number(kpi.managerScore) || 4;
                          const currentComment = managerKpiComments[kpi.id] !== undefined ? managerKpiComments[kpi.id] : (kpi.managerComment || '');

                          return (
                            <div key={kpi.id} className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-3">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2.5">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs text-indigo-400">{kpi.kpiNo}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/20 font-semibold">{kpi.kpa}</span>
                                    {isKpiSubmitted && (
                                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase tracking-wider">
                                        Submitted for Approval
                                      </span>
                                    )}
                                  </div>
                                  <h5 className="text-xs font-bold text-white">{kpi.kpi}</h5>
                                  <p className="text-[11px] text-slate-400">Target: <strong className="text-emerald-400">{kpi.annualTarget}</strong> • Base: {kpi.baseline}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  <div className="text-right px-2.5 py-1 rounded bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] text-slate-400 block">Self-Score</span>
                                    <span className="text-xs font-bold text-blue-400">{kpi.selfScore} / 5.0</span>
                                  </div>

                                  <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/40 px-2.5 py-1.5 rounded-lg border border-indigo-500/20">
                                    <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="text-[11px] font-medium max-w-[130px] truncate">{kpi.poeDoc}</span>
                                    <span className="text-[10px] text-emerald-400 font-bold uppercase shrink-0">Verified</span>
                                  </div>

                                  {onNavigateToSubModule && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        sessionStorage.setItem('ipms_manager_review_target', JSON.stringify({
                                          userId: 'user@mzansiflow.co.za',
                                          kpiId: kpi.id
                                        }));
                                        onNavigateToSubModule('ipms-manager-review');
                                      }}
                                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] font-semibold rounded-lg border border-slate-700 transition flex items-center gap-1 cursor-pointer"
                                      title="Review this specific KPI in standard Manager Approval module"
                                    >
                                      <span>Full Workspace</span>
                                      <ArrowRight className="w-3 h-3 text-indigo-400" />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Manager Scoring & Comment row for this KPI */}
                              <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] font-bold text-amber-300 shrink-0">Manager Score:</label>
                                  <select
                                    value={currentScore}
                                    onChange={(e) => setManagerScores({ ...managerScores, [kpi.id]: Number(e.target.value) })}
                                    className="bg-slate-900 border border-amber-500/40 rounded px-2 py-1 text-amber-300 text-xs font-bold focus:outline-none"
                                  >
                                    <option value={1}>1.0 - Unacceptable</option>
                                    <option value={2}>2.0 - Not Fully Effective</option>
                                    <option value={3}>3.0 - Fully Effective</option>
                                    <option value={4}>4.0 - Superior</option>
                                    <option value={5}>5.0 - Outstanding</option>
                                  </select>
                                </div>

                                <div className="flex-1 flex items-center gap-2">
                                  <label className="text-[11px] font-bold text-slate-400 shrink-0">Manager Remark:</label>
                                  <input
                                    type="text"
                                    value={currentComment}
                                    onChange={(e) => setManagerKpiComments({ ...managerKpiComments, [kpi.id]: e.target.value })}
                                    placeholder="Enter manager verification note for this indicator..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
                                  />
                                </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() => handleExecuteAction('manager_redo', { kpiId: kpi.id })}
                                      disabled={actionLoading}
                                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                      title="Reset manager approval/rejection on this KPI to redo assessment"
                                    >
                                      <RotateCcw className="w-3 h-3" />
                                      <span>Redo</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleExecuteAction('manager_action', {
                                        actionType: 'approve',
                                        comments: currentComment || managerComments,
                                        managerScores: { ...managerScores, [kpi.id]: currentScore },
                                        managerKpiComments: { ...managerKpiComments, [kpi.id]: currentComment }
                                      })}
                                      disabled={actionLoading}
                                      className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 rounded text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                                      title="Approve and push this single KPI to Internal Audit"
                                    >
                                      <Send className="w-3 h-3" />
                                      <span>Push to Audit</span>
                                    </button>
                                  </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-amber-300 mb-1.5">Select Manager Decision:</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setManagerActionType('approve')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            managerActionType === 'approve'
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve & Send to Internal Audit for Review
                        </button>
                        <button
                          type="button"
                          onClick={() => setManagerActionType('request_changes')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            managerActionType === 'request_changes'
                              ? 'bg-amber-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Request Changes / Revision
                        </button>
                        <button
                          type="button"
                          onClick={() => setManagerActionType('reject')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            managerActionType === 'reject'
                              ? 'bg-red-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Manager Overall Review Comments (Forwarded to Subordinate & Internal Audit):
                      </label>
                      <textarea
                        value={managerComments}
                        onChange={(e) => setManagerComments(e.target.value)}
                        rows={2}
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-amber-500"
                        placeholder="Enter manager feedback or requested revision items..."
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-amber-500/20">
                      <span className="text-[11px] text-slate-400">
                        {managerActionType === 'approve'
                          ? 'Notifies user@mzansiflow.co.za AND dispatches full docket to audit@mzansiflow.co.za with all KPIs, KPAs, and PoEs.'
                          : 'Notifies user@mzansiflow.co.za of the outcome with feedback.'}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteAction('manager_redo')}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                          title="Reset manager approval/rejection decisions to redo review"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Redo Approval / Rejection</span>
                        </button>
                        <button
                          onClick={() => handleExecuteAction('manager_action', {
                            actionType: managerActionType,
                            comments: managerComments,
                            managerScores,
                            managerKpiComments
                          })}
                          disabled={actionLoading}
                          className={`px-4 py-2 rounded-lg text-xs font-bold text-white shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 ${
                            managerActionType === 'approve' ? 'bg-emerald-600 hover:bg-emerald-500' : (managerActionType === 'reject' ? 'bg-red-600 hover:bg-red-500' : 'bg-amber-600 hover:bg-amber-500')
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>{managerActionType === 'approve' ? 'Approve & Push to Internal Audit' : 'Execute Manager Decision'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : currentStage > 2 ? (
                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        Line Manager Approved: <em>"{demoState?.managerReview?.comments || 'All KPAs and evidence verified.'}"</em>. Dispatched to Internal Audit.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExecuteAction('manager_redo')}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition cursor-pointer self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Redo Approval / Rejection</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Waiting for standard user to submit their performance agreement...</p>
                )}
              </div>
            </div>

            {/* STAGE 3: INTERNAL AUDIT CONSOLE (audit@mzansiflow.co.za) */}
            <div className={`p-5 rounded-2xl border transition-all ${
              currentStage === 3
                ? 'bg-slate-900/90 border-emerald-500/50 shadow-xl'
                : 'bg-slate-900/40 border-slate-800/80 opacity-90'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
                    3
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>Internal Audit Quality Assurance & Clearance</span>
                      {currentStage > 3 && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Cleared & Sent to DPMC</span>}
                    </h3>
                    <p className="text-xs text-slate-400">Auditor: <span className="font-mono text-emerald-300">audit@mzansiflow.co.za</span> • Audits KPIs, KPAs, PoEs & manager reviews, then sends to DPMC for moderation</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  currentStage === 3
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : currentStage > 3
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {currentStage === 3 ? 'Action Required' : (currentStage > 3 ? 'Cleared' : 'Awaiting Manager')}
                </span>
              </div>

              {/* Stage 3 Content & Action */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                {currentStage === 3 ? (
                  <div className="space-y-4 bg-emerald-950/20 p-4 rounded-xl border border-emerald-500/20">
                    {/* Docket Overview Banner */}
                    <div className="p-3.5 bg-slate-900/90 rounded-xl border border-emerald-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                      <div>
                        <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-400" />
                          <span>Audit Docket: Manager-Approved KPIs, KPAs & Portfolio of Evidence (PoE)</span>
                        </h4>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Line Manager (<strong className="text-white">manager@mzansiflow.co.za</strong>) Assessment: <em>"{demoState?.managerReview?.comments || 'All KPAs align with departmental strategic priorities. Verified portfolio of evidence.'}"</em>
                        </p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold text-[11px] shrink-0">
                        5 KPIs • 5 KPAs • 5 PoEs Attached
                      </span>
                    </div>

                    {/* Audited KPIs Grid */}
                    <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-xl border border-emerald-500/20">
                      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                        <span className="text-xs font-bold text-emerald-300 uppercase tracking-wide">
                          Internal Audit Indicator Verification & Scoring
                        </span>
                        <span className="text-[11px] text-slate-400">
                          Verify statutory alignment, PoE authenticity & assign audit ratings
                        </span>
                      </div>

                      <div className="space-y-3">
                        {(demoState?.agreement?.kpis || []).map((kpi: any) => {
                          const kpiAuditScore = auditScores[kpi.id] || Number(kpi.auditScore) || 4;
                          const kpiAuditComment = auditKpiComments[kpi.id] !== undefined ? auditKpiComments[kpi.id] : (kpi.internalAuditComment || '');
                          const kpiAuditCompliance = auditKpiCompliance[kpi.id] || kpi.internalAuditCompliance || 'Compliant';
                          const mgrScore = kpi.managerScore || managerScores[kpi.id] || '4.0';
                          const mgrComment = kpi.managerComment || managerKpiComments[kpi.id] || 'Verified against portfolio evidence.';

                          return (
                            <div key={kpi.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 hover:border-slate-700 transition space-y-2.5">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs text-indigo-400">{kpi.kpiNo}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/20 font-semibold">{kpi.kpa}</span>
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${
                                      kpiAuditCompliance === 'Compliant'
                                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                        : kpiAuditCompliance === 'Requires Proof'
                                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                                        : 'bg-red-500/10 text-red-300 border-red-500/30'
                                    }`}>
                                      {kpiAuditCompliance}
                                    </span>
                                  </div>
                                  <h5 className="text-xs font-bold text-white">{kpi.kpi}</h5>
                                  <p className="text-[11px] text-slate-400">Target: <strong className="text-emerald-400">{kpi.annualTarget}</strong> • Baseline: {kpi.baseline}</p>
                                </div>

                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  <div className="text-right px-2 py-1 rounded bg-slate-900 border border-slate-800">
                                    <span className="text-[9px] text-slate-400 block">Self</span>
                                    <span className="text-xs font-bold text-blue-400">{kpi.selfScore} / 5</span>
                                  </div>
                                  <div className="text-right px-2 py-1 rounded bg-slate-900 border border-amber-500/30">
                                    <span className="text-[9px] text-amber-400 block">Manager</span>
                                    <span className="text-xs font-bold text-amber-300">{mgrScore} / 5</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-indigo-300 bg-indigo-950/40 px-2 py-1 rounded-lg border border-indigo-500/20">
                                    <FileText className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                                    <span className="text-[11px] font-medium max-w-[120px] truncate">{kpi.poeDoc}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Manager remark display */}
                              <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 flex items-center gap-1.5">
                                <span className="text-amber-400 font-bold shrink-0">Manager Review:</span>
                                <span className="italic truncate">"{mgrComment}"</span>
                              </div>

                              {/* Auditor controls row */}
                              <div className="pt-2 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] font-bold text-emerald-400 shrink-0">Audit Compliance:</label>
                                  <select
                                    value={kpiAuditCompliance}
                                    onChange={(e) => setAuditKpiCompliance({ ...auditKpiCompliance, [kpi.id]: e.target.value })}
                                    className="bg-slate-900 border border-emerald-500/40 rounded px-2 py-1 text-emerald-300 text-xs font-bold focus:outline-none"
                                  >
                                    <option value="Compliant">✅ Compliant</option>
                                    <option value="Requires Proof">⚠️ Requires Proof</option>
                                    <option value="Non-Compliant">❌ Non-Compliant</option>
                                  </select>

                                  <label className="text-[11px] font-bold text-emerald-400 shrink-0 ml-1">Score:</label>
                                  <select
                                    value={kpiAuditScore}
                                    onChange={(e) => setAuditScores({ ...auditScores, [kpi.id]: Number(e.target.value) })}
                                    className="bg-slate-900 border border-emerald-500/40 rounded px-2 py-1 text-emerald-300 text-xs font-bold focus:outline-none"
                                  >
                                    <option value={1}>1.0</option>
                                    <option value={2}>2.0</option>
                                    <option value={3}>3.0</option>
                                    <option value={4}>4.0</option>
                                    <option value={5}>5.0</option>
                                  </select>
                                </div>

                                <div className="flex-1 flex items-center gap-1.5">
                                  <label className="text-[11px] font-bold text-slate-400 shrink-0">Auditor Remark:</label>
                                  <input
                                    type="text"
                                    value={kpiAuditComment}
                                    onChange={(e) => setAuditKpiComments({ ...auditKpiComments, [kpi.id]: e.target.value })}
                                    placeholder="Enter audit verification remark..."
                                    className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                                  />
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteAction('audit_redo', { kpiId: kpi.id })}
                                    disabled={actionLoading}
                                    className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                    title="Reset audit verification on this single KPI to redo assessment"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Redo</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleExecuteAction('audit_push_to_manager', { kpiId: kpi.id, comments: kpiAuditComment || auditComments })}
                                    disabled={actionLoading}
                                    className="px-2 py-1 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                                    title="Push audit findings for this single KPI back to Line Manager"
                                  >
                                    <Send className="w-3 h-3" />
                                    <span>Push to Mgr</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-emerald-300 mb-1.5">Select Audit Determination:</label>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setAuditActionType('approve')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            auditActionType === 'approve'
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Approve Audit Clearance (Send to DPMC)
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditActionType('request_resubmission')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            auditActionType === 'request_resubmission'
                              ? 'bg-amber-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Request Resubmission with Changes
                        </button>
                        <button
                          type="button"
                          onClick={() => setAuditActionType('reject')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer ${
                            auditActionType === 'reject'
                              ? 'bg-red-600 text-white shadow'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Non-Compliant
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Internal Audit Findings & Quality Assurance Opinion (Forwarded to DPMC):
                      </label>
                      <textarea
                        value={auditComments}
                        onChange={(e) => setAuditComments(e.target.value)}
                        rows={2}
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-emerald-500"
                        placeholder="Detail audit clearance findings or queries..."
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-emerald-500/20">
                      <span className="text-[11px] text-slate-400">
                        Approval sends docket directly to <strong className="text-purple-300">dpmc@mzansiflow.co.za</strong> with verified audit ratings.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleExecuteAction('audit_redo')}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer"
                          title="Reset all KPI audit assessments to redo verification"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Redo Achieved & Not Achieved</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleExecuteAction('audit_push_to_manager', { comments: auditComments })}
                          disabled={actionLoading}
                          className="px-3 py-2 rounded-lg text-xs font-bold text-blue-300 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 flex items-center justify-center gap-1.5 transition cursor-pointer"
                          title="Push audit findings back to Line Manager"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Push to Manager</span>
                        </button>
                        <button
                          onClick={() => handleExecuteAction('audit_action', {
                            actionType: auditActionType,
                            comments: auditComments,
                            auditScores,
                            auditKpiComments,
                            auditKpiCompliance
                          })}
                          disabled={actionLoading}
                          className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                        >
                          <Shield className="w-3.5 h-3.5" />
                          <span>Issue Audit Clearance & Send to DPMC</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ) : currentStage > 3 ? (
                  <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-500/20 text-xs text-emerald-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>
                        Internal Audit Cleared: <em>"{demoState?.auditReview?.comments || 'All compliance checks verified.'}"</em>. Docket forwarded to DPMC.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleExecuteAction('audit_redo')}
                      disabled={actionLoading}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1 shadow-sm transition cursor-pointer self-start sm:self-auto"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Redo Achieved & Not Achieved</span>
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Waiting for line manager approval before internal audit QA...</p>
                )}
              </div>
            </div>

            {/* STAGE 4: DPMC CONSOLE (dpmc@mzansiflow.co.za) */}
            <div className={`p-5 rounded-2xl border transition-all ${
              currentStage === 4
                ? 'bg-slate-900/90 border-purple-500/50 shadow-xl'
                : 'bg-slate-900/40 border-slate-800/80 opacity-90'
            }`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400 flex items-center justify-center font-bold">
                    4
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>DPMC Scoring, Moderation & Committee Comments</span>
                      {currentStage === 5 && <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">Moderation Finalized</span>}
                    </h3>
                    <p className="text-xs text-slate-400">Moderator: <span className="font-mono text-purple-300">dpmc@mzansiflow.co.za</span> • Reviews Manager & Audit scores, inputs committee ratings (1-5) and comments per KPI & JSC</p>
                  </div>
                </div>

                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                  currentStage === 4
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : currentStage === 5
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : 'bg-slate-800 text-slate-500'
                }`}>
                  {currentStage === 4 ? 'Action Required' : (currentStage === 5 ? 'Completed' : 'Awaiting Audit')}
                </span>
              </div>

              {/* Stage 4 Content & Action */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                {currentStage === 4 ? (
                  <div className="space-y-4 bg-purple-950/20 p-4 rounded-xl border border-purple-500/20">
                    {/* Multi-Party Sign-off Summary */}
                    <div className="p-3 bg-slate-900/90 rounded-xl border border-purple-500/30 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-purple-300 flex items-center gap-1.5">
                          <Award className="w-4 h-4 text-purple-400" />
                          Audited Performance Docket for Committee Moderation
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">DPMC Session 2024/2025</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800">
                        <div>
                          <span className="text-amber-400 font-bold block">Line Manager Verdict:</span>
                          <span className="text-slate-300 italic truncate block">"{demoState?.managerReview?.comments || 'Verified all KPAs and portfolio evidence.'}"</span>
                        </div>
                        <div>
                          <span className="text-emerald-400 font-bold block">Internal Audit Opinion:</span>
                          <span className="text-slate-300 italic truncate block">"{demoState?.auditReview?.comments || 'Audit clearance granted for DPMC moderation.'}"</span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs font-bold text-purple-300">
                      Input Official DPMC Ratings & Scores (Rating Scale: 1 = Unacceptable, 3 = Fully Effective, 5 = Outstanding):
                    </p>

                    {/* KPI Scoring Grid with Multi-role Comparison */}
                    <div className="space-y-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                        KPI Performance Moderation & Scoring (Review Self, Manager, Audit & Committee)
                      </span>
                      <div className="space-y-3">
                        {(demoState?.agreement?.kpis || []).map((k: any) => {
                          const kpiDpmcScore = dpmcScores[k.id] || Number(k.dpmcScore) || 4;
                          const kpiDpmcComment = dpmcKpiComments[k.id] !== undefined ? dpmcKpiComments[k.id] : (k.dpmcComment || '');
                          const mgrScore = k.managerScore || managerScores[k.id] || '4.0';
                          const auditScore = k.auditScore || auditScores[k.id] || '4.0';
                          const auditRemark = k.internalAuditComment || auditKpiComments[k.id] || 'Audit verified';

                          return (
                            <div key={k.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition space-y-2.5 text-xs">
                              <div className="flex flex-col md:flex-row md:items-start justify-between gap-2">
                                <div className="space-y-1 flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono font-bold text-xs text-purple-400">{k.kpiNo}</span>
                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-300 border border-indigo-500/20 font-semibold">{k.kpa}</span>
                                    <span className="text-[10px] text-slate-400 font-mono">Weight: {k.weighting}%</span>
                                  </div>
                                  <h5 className="font-bold text-white text-xs">{k.kpi}</h5>
                                  <p className="text-[11px] text-slate-400">Target: <strong className="text-emerald-400">{k.annualTarget}</strong> • Base: {k.baseline} • PoE: <span className="font-mono text-indigo-300">{k.poeDoc}</span></p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <div className="text-center px-2 py-1 rounded bg-slate-950 border border-slate-800">
                                    <span className="text-[9px] text-blue-400 block font-bold">Self</span>
                                    <span className="text-xs font-bold text-white">{k.selfScore}</span>
                                  </div>
                                  <div className="text-center px-2 py-1 rounded bg-slate-950 border border-amber-500/30">
                                    <span className="text-[9px] text-amber-400 block font-bold">Manager</span>
                                    <span className="text-xs font-bold text-amber-300">{mgrScore}</span>
                                  </div>
                                  <div className="text-center px-2 py-1 rounded bg-slate-950 border border-emerald-500/30">
                                    <span className="text-[9px] text-emerald-400 block font-bold">Audit</span>
                                    <span className="text-xs font-bold text-emerald-300">{auditScore}</span>
                                  </div>
                                  <div className="text-center px-2.5 py-1 rounded bg-purple-950/60 border border-purple-500/50">
                                    <span className="text-[9px] text-purple-300 block font-bold">DPMC</span>
                                    <select
                                      value={kpiDpmcScore}
                                      onChange={(e) => setDpmcScores({ ...dpmcScores, [k.id]: Number(e.target.value) })}
                                      className="bg-transparent text-purple-200 font-bold text-xs focus:outline-none cursor-pointer"
                                    >
                                      {[1, 2, 3, 4, 5].map(v => (
                                        <option key={v} value={v} className="bg-slate-900 text-white">{v}.0</option>
                                      ))}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Prior remarks display */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px] bg-slate-950/60 p-2 rounded border border-slate-850">
                                <div>
                                  <span className="text-slate-400 font-bold">Manager Note:</span> <span className="text-slate-300 italic">{k.managerComment || managerKpiComments[k.id] || 'Verified'}</span>
                                </div>
                                <div>
                                  <span className="text-emerald-400 font-bold">Auditor Note:</span> <span className="text-slate-300 italic">{auditRemark}</span>
                                </div>
                              </div>

                              {/* DPMC Committee Comment for this KPI */}
                              <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                                <label className="text-[11px] font-bold text-purple-300 shrink-0">DPMC Committee Note:</label>
                                <input
                                  type="text"
                                  value={kpiDpmcComment}
                                  onChange={(e) => setDpmcKpiComments({ ...dpmcKpiComments, [k.id]: e.target.value })}
                                  placeholder="Enter committee moderation reason or confirmation..."
                                  className="w-full bg-slate-950 border border-purple-500/30 rounded px-2.5 py-1 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-purple-500"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* JSC Scoring Grid */}
                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Job Specific Competencies (JSC) Moderation</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {(demoState?.agreement?.jscs || []).map((j: any) => (
                          <div key={j.id} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                            <div className="pr-2 truncate">
                              <span className="font-bold text-white block truncate">{j.jscNo}: {j.competency}</span>
                              <span className="text-[10px] text-slate-400">{j.level} • Self: {j.selfScore}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400">Score:</span>
                              <select
                                value={dpmcScores[j.id] || 4}
                                onChange={(e) => setDpmcScores({ ...dpmcScores, [j.id]: Number(e.target.value) })}
                                className="bg-slate-800 text-purple-300 font-bold text-xs rounded border border-purple-500/40 px-2 py-1"
                              >
                                {[1, 2, 3, 4, 5].map(v => (
                                  <option key={v} value={v}>{v}.0</option>
                                ))}
                              </select>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        DPMC Official Resolution & Committee Comments:
                      </label>
                      <textarea
                        value={dpmcComments}
                        onChange={(e) => setDpmcComments(e.target.value)}
                        rows={2}
                        className="w-full text-xs bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white focus:outline-none focus:border-purple-500"
                        placeholder="Enter committee comments, performance moderation verdict, and recommendation..."
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-purple-500/20">
                      <span className="text-[11px] text-slate-400">
                        Dispatches final notifications to user, manager, and internal audit. Locks agreement in Supabase.
                      </span>
                      <button
                        onClick={() => handleExecuteAction('dpmc_action', {
                          scores: dpmcScores,
                          dpmcKpiComments,
                          comments: dpmcComments
                        })}
                        disabled={actionLoading}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Award className="w-3.5 h-3.5" />
                        <span>Finalize DPMC Moderation & Scores</span>
                      </button>
                    </div>
                  </div>
                ) : currentStage === 5 ? (
                  <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-purple-300 flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-400" />
                        Final DPMC Moderation Certificate
                      </span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Moderation Finalized & Locked
                      </span>
                    </div>
                    <p className="text-slate-200">
                      <strong>Committee Verdict:</strong> <em>"{demoState?.dpmcReview?.comments || dpmcComments}"</em>
                    </p>
                    <div className="pt-2 flex flex-wrap items-center gap-4 text-slate-400 text-[11px]">
                      <span>Moderated by: <strong className="text-white">dpmc@mzansiflow.co.za</strong></span>
                      <span>Average Score: <strong className="text-purple-300">{demoState?.dpmcReview?.averageScore || '4.3'}/5.0 (86%)</strong></span>
                      <span>Outcome: <strong className="text-emerald-300">Performance Incentive & Moderation Approved</strong></span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">Waiting for internal audit clearance before DPMC moderation...</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PERFORMANCE AGREEMENT DETAILS                     */}
        {/* ========================================================= */}
        {activeTab === 'agreement' && (
          <div className="space-y-6 max-w-6xl mx-auto">
            {/* Header info */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <h2 className="text-base font-bold text-white">Annual Individual Performance Agreement (2024/2025)</h2>
                  <p className="text-xs text-slate-400">Captured under South African Local Government Municipal Performance Regulations</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded text-xs font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30">
                    Status: {workflowStatus.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Employee (Subordinate)</span>
                  <span className="font-bold text-white">Demo Standard User</span>
                  <span className="text-[11px] text-indigo-400 block font-mono">user@mzansiflow.co.za</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Line Manager</span>
                  <span className="font-bold text-white">Demo Line Manager</span>
                  <span className="text-[11px] text-amber-400 block font-mono">manager@mzansiflow.co.za</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Department / Directorate</span>
                  <span className="font-bold text-white">Corporate Services</span>
                  <span className="text-[11px] text-slate-400 block">Performance Division</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Internal Auditor & DPMC</span>
                  <span className="font-mono text-emerald-400 block">audit@mzansiflow.co.za</span>
                  <span className="font-mono text-purple-400 block">dpmc@mzansiflow.co.za</span>
                </div>
              </div>
            </div>

            {/* KPAs Table */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Flag className="w-4 h-4 text-blue-400" />
                  Key Performance Areas (KPAs) — 100% Weight Sum
                </h3>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Total Weight: 100%
                </span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-16">No.</th>
                      <th className="p-3">Key Performance Area (KPA) Title</th>
                      <th className="p-3 text-right w-28">Weighting</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {(demoState?.agreement?.kpas || []).map((kpa: any) => (
                      <tr key={kpa.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-indigo-400">{kpa.kpaNo}</td>
                        <td className="p-3 font-medium text-white">{kpa.name}</td>
                        <td className="p-3 text-right font-bold text-emerald-400">{kpa.weight}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* KPIs Table */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-400" />
                  Key Performance Indicators (KPIs) & Target Breakdown
                </h3>
                <span className="text-xs text-slate-400">Includes baseline, quarterly milestones, and attached PoE files</span>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold border-b border-slate-800">
                    <tr>
                      <th className="p-3 w-16">No.</th>
                      <th className="p-3">KPA & Strategic Goal</th>
                      <th className="p-3">KPI Description</th>
                      <th className="p-3">Target (Annual)</th>
                      <th className="p-3 text-center">Q1 - Q4 Breakdown</th>
                      <th className="p-3 text-center">Self</th>
                      <th className="p-3 text-center">Mgr</th>
                      <th className="p-3 text-center">Audit</th>
                      <th className="p-3 text-center">DPMC</th>
                      <th className="p-3">Portfolio of Evidence (PoE)</th>
                      <th className="p-3 text-right">Review Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-200">
                    {(demoState?.agreement?.kpis || []).map((kpi: any) => (
                      <tr key={kpi.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono font-bold text-indigo-400">{kpi.kpiNo}</td>
                        <td className="p-3">
                          <span className="text-[11px] font-bold text-indigo-300 block">{kpi.kpa}</span>
                          <span className="text-[10px] text-slate-400">{kpi.strategicGoal}</span>
                        </td>
                        <td className="p-3 font-medium text-white max-w-xs">{kpi.kpi}</td>
                        <td className="p-3">
                          <span className="font-bold text-emerald-400 block">{kpi.annualTarget}</span>
                          <span className="text-[10px] text-slate-500">Base: {kpi.baseline}</span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1 text-[10px]">
                            <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Q1: {kpi.q1Target}</span>
                            <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Q2: {kpi.q2Target}</span>
                            <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Q3: {kpi.q3Target}</span>
                            <span className="px-1 py-0.5 rounded bg-slate-800 text-slate-300">Q4: {kpi.q4Target}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold text-blue-400">{kpi.selfScore}</td>
                        <td className="p-3 text-center font-bold text-amber-400">{kpi.managerScore || managerScores[kpi.id] || '-'}</td>
                        <td className="p-3 text-center font-bold text-emerald-400">{kpi.auditScore || kpi.internalAuditRating || auditScores[kpi.id] || '-'}</td>
                        <td className="p-3 text-center font-bold text-purple-400">{demoState?.dpmcReview?.scores?.[kpi.id] || kpi.dpmcScore || dpmcScores[kpi.id] || '-'}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5 text-xs text-indigo-300 bg-indigo-950/40 px-2 py-1 rounded border border-indigo-500/20 max-w-xs truncate">
                            <FileText className="w-3 h-3 shrink-0" />
                            <span className="truncate">{kpi.poeDoc}</span>
                            <span className="ml-auto text-[10px] text-emerald-400 font-bold shrink-0">{kpi.poeStatus}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          {currentActor.id === 'user' ? (
                            <button
                              type="button"
                              onClick={() => handleExecuteAction('submit_kpi', { kpiId: kpi.id, notes: submitNotes })}
                              disabled={actionLoading}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-indigo-600 hover:bg-indigo-500 text-white transition cursor-pointer"
                            >
                              {kpi.reviewStatus === 'Submitted for Approval' || workflowStatus === 'SUBMITTED_TO_MANAGER' ? 'Resubmit' : 'Submit KPI'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToSubModule) {
                                  sessionStorage.setItem('ipms_manager_review_target', JSON.stringify({
                                    userId: 'user@mzansiflow.co.za',
                                    kpiId: kpi.id
                                  }));
                                  onNavigateToSubModule('ipms-manager-review');
                                } else {
                                  setActiveTab('console');
                                }
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded bg-amber-600 hover:bg-amber-500 text-white transition flex items-center gap-1 shadow-xs cursor-pointer ml-auto"
                            >
                              <span>Review KPI</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* JSCs & PDPs Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* JSCs */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-purple-400" />
                  Job Specific Competencies (JSC)
                </h3>
                <div className="space-y-2.5">
                  {(demoState?.agreement?.jscs || []).map((jsc: any) => (
                    <div key={jsc.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{jsc.jscNo}: {jsc.competency}</span>
                        <span className="font-bold text-purple-400">Score: {jsc.selfScore}/5</span>
                      </div>
                      <p className="text-[11px] text-slate-400">{jsc.definition}</p>
                      <p className="text-[11px] text-slate-300 italic bg-slate-900/60 p-2 rounded border border-slate-800">
                        "{jsc.motivation}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* PDPs */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-amber-400" />
                  Personal Development Plan (PDP)
                </h3>
                <div className="space-y-2.5">
                  {(demoState?.agreement?.pdps || []).map((pdp: any) => (
                    <div key={pdp.id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{pdp.pdpNo}: {pdp.developmentNeed}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {pdp.progress}
                        </span>
                      </div>
                      <p className="text-[11px] text-indigo-300">Intervention: {pdp.intervention}</p>
                      <p className="text-[11px] text-slate-400">Target Period: {pdp.targetQuarter}</p>
                      <p className="text-[11px] text-emerald-300">Outcome: {pdp.outcome}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: LIVE NOTIFICATIONS FEED                           */}
        {/* ========================================================= */}
        {activeTab === 'notifications' && (
          <div className="space-y-4 max-w-5xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mail className="w-4 h-4 text-indigo-400" />
                  Real-Time Supabase Notifications Feed
                </h3>
                <p className="text-xs text-slate-400">All notifications recorded during submissions, manager approvals, audit dispatches, and DPMC moderation</p>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Filter Recipient:</span>
                <select
                  value={notifFilter}
                  onChange={(e) => setNotifFilter(e.target.value)}
                  className="bg-slate-800 text-white rounded-lg px-2.5 py-1.5 border border-slate-700 text-xs focus:outline-none"
                >
                  <option value="all">All Demo Recipients</option>
                  <option value="user@mzansiflow.co.za">user@mzansiflow.co.za</option>
                  <option value="manager@mzansiflow.co.za">manager@mzansiflow.co.za</option>
                  <option value="audit">audit@mzansiflow.co.za (Internal Audit)</option>
                  <option value="dpmc">dpmc@mzansiflow.co.za (DPMC)</option>
                </select>
              </div>
            </div>

            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center bg-slate-900/40 rounded-xl border border-slate-800">
                <Mail className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">No notifications for this filter yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">Execute workflow steps in Tab 1 to trigger real notifications.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredNotifications.map((notif: any) => (
                  <div key={notif.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all space-y-1.5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{notif.title}</span>
                        {notif.actionType && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-wider">
                            {notif.actionType}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono shrink-0">
                        {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Recent'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed">{notif.message}</p>

                    {notif.actionType === 'submission' && (
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                        <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          <span>Submitted for Line Manager Verification</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActorEmail('manager@mzansiflow.co.za');
                            if (onNavigateToSubModule) {
                              sessionStorage.setItem('ipms_manager_review_target', JSON.stringify({
                                userId: 'user@mzansiflow.co.za',
                                kpiId: notif.kpiId || 'kpi-demo-1'
                              }));
                              onNavigateToSubModule('ipms-manager-review');
                            } else {
                              setActiveTab('console');
                            }
                          }}
                          className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>Go to Submitted KPI & Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {notif.actionType === 'audit_request' && (
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                        <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          <span>Manager Approved — Pending Internal Audit Clearance</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActorEmail('audit@mzansiflow.co.za');
                            setActiveTab('console');
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>Open Internal Audit Console</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {notif.actionType === 'dpmc_docket' && (
                      <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                        <span className="text-[10px] text-purple-400 font-semibold flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>Audit Cleared — Docket Awaiting DPMC Moderation</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveActorEmail('dpmc@mzansiflow.co.za');
                            setActiveTab('console');
                          }}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <span>Open DPMC Moderation Console</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                      <div>
                        <span>From: <strong className="text-slate-200">{notif.senderName || notif.senderEmail}</strong> (<span className="font-mono text-slate-300">{notif.senderEmail}</span>)</span>
                      </div>
                      <div>
                        <span>To: <strong className="text-slate-200">{notif.recipientName || notif.recipientEmail}</strong> (<span className="font-mono text-indigo-300">{notif.recipientEmail}</span>)</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: AUDIT & MODERATION TRAIL                           */}
        {/* ========================================================= */}
        {activeTab === 'history' && (
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Immutable Audit & Moderation Timeline
              </h3>
              <p className="text-xs text-slate-400">Complete historical governance log saved to Supabase</p>
            </div>

            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {(demoState?.workflowHistory || []).map((h: any, idx: number) => (
                <div key={h.id || idx} className="relative group">
                  <div className="absolute -left-[27px] top-1.5 w-4 h-4 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{h.action}</span>
                      <span className="text-[11px] font-mono text-slate-500">
                        {h.timestamp ? new Date(h.timestamp).toLocaleString() : ''}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Actor: <strong className="text-slate-200">{h.actorName || h.actor}</strong> ({h.role || h.actor})
                    </p>
                    {h.notes && (
                      <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850 mt-2">
                        {h.notes}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
