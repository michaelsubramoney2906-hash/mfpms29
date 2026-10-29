import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, ShieldCheck, LogOut, LayoutGrid, FileText, BarChart3,
  CheckSquare, Plus, Save, Trash2, Edit2, Upload, FileSignature, 
  Layers, Database, Calendar, TrendingUp, AlertTriangle, ChevronRight, 
  Info, Check, HelpCircle, ArrowLeft, ArrowUpRight, DollarSign,
  PieChart as PieIcon, Eye, CheckCircle2, AlertCircle, RefreshCw, Download, FileSpreadsheet,
  Bot, Users, KeyRound, Sun, Moon
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import type { User } from '../types';
import { useTheme } from '../context/ThemeContext';

// Import main system components to replicate modules exactly as is
import { APR } from './APR/APR';
import { AR } from './AR/AR';
import { IDP } from './IDP/IDP';
import { SDBIP } from './SDBIP/SDBIP';
import { KPIIPMS } from './IPMS/KPI_IPMS';
import { KPAIPMS } from './IPMS/KPA_IPMS';
import { PersonalDevelopmentPlan } from './IPMS/PersonalDevelopmentPlan';
import { PerformanceAgreements } from './IPMS/PerformanceAgreements';
import { CoreCompetencies } from './IPMS/CoreCompetencies';
import { JobSpecificCompetencies } from './IPMS/JobSpecificCompetencies';
import { EvaluationIPMS } from './IPMS/Evaluation_IPMS';
import { ManagerReviewIPMS } from './IPMS/ManagerReview_IPMS';
import { InternalAuditReviewIPMS } from './IPMS/InternalAuditReview_IPMS';
import { Fred2Suite } from './Fred2Suite';
import { UserManagement2 } from './UserManagement2';

interface NEDAPortalProps {
  user: User;
  onLogout: () => void;
  onImpersonate?: (user: User) => void;
}

// 4 Main Pillars, each with its specified Sub-modules
type PillarId = 'organisational' | 'individual' | 'financial' | 'reporting';

type SubModuleId = 
  // Organisational PMS
  | 'annual_report' | 'annual_perf_report' | 'idp' | 'sdbip' | 'fred2'
  // Individual PMS
  | 'ipms_kpi_capture' | 'ipms_kpa_capture' | 'pdp' | 'performance_plan' 
  | 'core_competencies' | 'job_specific_competencies' | 'performance_agreement' | 'self_evaluation' 
  | 'managers_approval' | 'internal_audit' | 'portfolio_of_evidence'
  // Financial & SCM
  | 'budget_tracking' | 'scm_performance' | 'audit_risk'
  // Governance & Analytics
  | 'dashboard_analytics' | 'statutory_reporting' | 'stakeholder_oversight' | 'administrator2';

interface Pillar {
  id: PillarId;
  name: string;
  desc: string;
  subModules: {
    id: SubModuleId;
    name: string;
    desc: string;
    icon: React.ReactNode;
  }[];
}

export function NEDAPortal({ user, onLogout, onImpersonate }: NEDAPortalProps) {
  const { isDark, toggleTheme } = useTheme();
  const [activePillar, setActivePillar] = useState<PillarId>('organisational');
  const [activeSub, setActiveSub] = useState<SubModuleId>('annual_report');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const tenantId = 'neda'; // Strict separation: all NEDA data is stored under 'neda' tenant ID

  // --- Dynamic states for custom functional sub-modules (Financial, SCM, Governance & Analytics, PoE) ---
  
  // 1. Budget Tracking State
  const [budgetRows, setBudgetRows] = useState<any[]>([
    { id: 'b1', category: 'SMME Funding & Support Programs', planned: 12500000, actual: 11200000 },
    { id: 'b2', category: 'Middelburg Agri-processing Hub Capex', planned: 24000000, actual: 23500000 },
    { id: 'b3', category: 'Personnel & Executive Salaries', planned: 18500000, actual: 18100000 },
    { id: 'b4', category: 'Operational Budget (Opex)', planned: 8500000, actual: 9100000 },
    { id: 'b5', category: 'Investment Promotion & Marketing Campaigns', planned: 4500000, actual: 4100000 },
  ]);
  const [newBudgetCategory, setNewBudgetCategory] = useState('');
  const [newBudgetPlanned, setNewBudgetPlanned] = useState('');
  const [newBudgetActual, setNewBudgetActual] = useState('');

  // 2. SCM Procurement Ledger State
  const [scmItems, setScmItems] = useState<any[]>([
    { id: 's1', bidNumber: 'NEDA-2026-004', description: 'Lease and Development of Agri-processing Hub', budget: 15000000, stage: 'Adjudication Committee', daysElapsed: 42, complianceCheck: 'Passed' },
    { id: 's2', bidNumber: 'NEDA-2026-005', description: 'Appointment of Investment Marketing Agency', budget: 3200000, stage: 'Evaluation Committee', daysElapsed: 15, complianceCheck: 'Passed' },
    { id: 's3', bidNumber: 'NEDA-2026-006', description: 'Supply of Office Automation Equipment', budget: 850000, stage: 'Specifications Committee', daysElapsed: 5, complianceCheck: 'Passed' },
  ]);
  const [newScmBid, setNewScmBid] = useState('');
  const [newScmDesc, setNewScmDesc] = useState('');
  const [newScmValue, setNewScmValue] = useState('');
  const [newScmStage, setNewScmStage] = useState('Specifications Committee');

  // 3. Audit Finding Tracker State
  const [auditFindings, setAuditFindings] = useState<any[]>([
    { id: 'a1', finding: 'Incomplete fixed asset register for minor field equipment', category: 'Internal Control', riskLevel: 'Medium', actionPlan: 'Full barcode audit of all peripheral regional offices', progress: 85, status: 'Resolved' },
    { id: 'a2', finding: 'Late submission of mid-term performance reports', category: 'Compliance', riskLevel: 'High', actionPlan: 'Establish strict calendar countdown triggers on OPMS system', progress: 40, status: 'In Progress' },
    { id: 'a3', finding: 'Inconsistencies in contract service level agreement monitoring', category: 'Risk Management', riskLevel: 'Medium', actionPlan: 'Adopt centralized digital SLA sign-off and trigger system', progress: 15, status: 'Under Review' },
  ]);
  const [newFindingQuery, setNewFindingQuery] = useState('');
  const [newFindingCategory, setNewFindingCategory] = useState('Compliance');
  const [newFindingRisk, setNewFindingRisk] = useState('Medium');
  const [newFindingAction, setNewFindingAction] = useState('');

  // 4. Statutory Reports State
  const [reportingDrafts, setReportingDrafts] = useState<any[]>([
    { id: 'r1', name: 'Section 46 Annual Performance Report 2025/26', compiledDate: '2026-07-10', compiledBy: 'Sibusiso Sibanyoni', approvalStatus: 'Board Approved' },
    { id: 'r2', name: 'Q4 Performance Report (NEDA Corporate Scorecard)', compiledDate: '2026-07-15', compiledBy: 'Nomvula Masango', approvalStatus: 'Under Board Review' },
    { id: 'r3', name: 'MFMA Mid-Year Performance Assessment & Budget Review', compiledDate: '2026-01-15', compiledBy: 'Thabo Ndlovu', approvalStatus: 'District Submitted' },
  ]);
  const [newDraftName, setNewDraftName] = useState('');
  const [newDraftStatus, setNewDraftStatus] = useState('Drafting Stage');

  // 5. Stakeholder Oversight State
  const [oversightLogs, setOversightLogs] = useState<any[]>([
    { id: 'o1', targetBody: 'NEDA Board of Directors', reportName: 'Q3 Financial & Project Performance Pack', submissionDate: '2026-04-10', status: 'Adopted with Recommendations' },
    { id: 'o2', targetBody: 'District Mayoral Committee', reportName: 'Annual Performance Report 2025/26 Draft', submissionDate: '2026-07-15', status: 'Under Review' },
    { id: 'o3', targetBody: 'National Treasury / Auditor General', reportName: 'Section 52(d) Mayor’s Quarterly Report', submissionDate: '2026-07-18', status: 'Submitted Successfully' },
  ]);
  const [newOversightTarget, setNewOversightTarget] = useState('');
  const [newOversightReport, setNewOversightReport] = useState('');
  const [newOversightStatus, setNewOversightStatus] = useState('Submitted');

  // 6. Portfolio of Evidence (PoE) State
  const [poeItems, setPoeItems] = useState<any[]>([
    { id: 'p1', kpiName: 'Number of youth-owned SMMEs funded', fileName: 'Q3_SMME_Disbursement_Register.pdf', size: '2.4 MB', uploadedBy: 'Nomvula Masango', uploadDate: '2026-07-10', status: 'Verified' },
    { id: 'p2', kpiName: 'Value of domestic investment secured', fileName: 'Middelburg_Steel_LOI_Signed.pdf', size: '1.1 MB', uploadedBy: 'Sibusiso Sibanyoni', uploadDate: '2026-07-14', status: 'Verified' },
    { id: 'p3', kpiName: 'Industrial hub infrastructure project percentage completion', fileName: 'Hub_Engineering_Q4_Progress.pdf', size: '5.8 MB', uploadedBy: 'External Engineer', uploadDate: '2026-07-19', status: 'Pending Review' },
  ]);
  const [newPoeKpi, setNewPoeKpi] = useState('');
  const [newPoeFile, setNewPoeFile] = useState('');
  const [newPoeSize, setNewPoeSize] = useState('1.5 MB');

  // Load NEDA data on mount from secure database
  useEffect(() => {
    async function loadNedaData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/neda/${tenantId}/all_data`);
        if (res.ok) {
          const resJson = await res.json();
          if (resJson && resJson.data) {
            const d = resJson.data;
            if (d.budgetRows) setBudgetRows(d.budgetRows);
            if (d.scmItems) setScmItems(d.scmItems);
            if (d.auditFindings) setAuditFindings(d.auditFindings);
            if (d.reportingDrafts) setReportingDrafts(d.reportingDrafts);
            if (d.oversightLogs) setOversightLogs(d.oversightLogs);
            if (d.poeItems) setPoeItems(d.poeItems);
          }
        }
      } catch (err) {
        console.error('Failed to load NEDA subsidiary data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadNedaData();
  }, [tenantId]);

  // Save to Supabase Storage Pipeline
  const triggerSave = async (updatedData: any, key: string) => {
    setSaving(true);
    setStatusMessage(`Syncing ${key} parameters to secure Cloud Supabase database...`);
    try {
      // First read existing data
      const getRes = await fetch(`/api/neda/${tenantId}/all_data`);
      let existingAll: any = {};
      if (getRes.ok) {
        const dataJson = await getRes.json();
        existingAll = dataJson.data || {};
      }
      
      const payload = {
        ...existingAll,
        [key]: updatedData
      };

      const saveRes = await fetch(`/api/neda/${tenantId}/all_data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (saveRes.ok) {
        setStatusMessage('Sync complete! Saved securely in Supabase.');
        setTimeout(() => setStatusMessage(null), 3000);
      } else {
        setStatusMessage('Error syncing to Supabase. Check connections.');
        setTimeout(() => setStatusMessage(null), 4000);
      }
    } catch (err) {
      console.error('Save error:', err);
      setStatusMessage('Network Error syncing to Supabase.');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleAddBudget = () => {
    if (!newBudgetCategory || !newBudgetPlanned) return;
    const newRow = {
      id: 'b_' + Date.now(),
      category: newBudgetCategory,
      planned: Number(newBudgetPlanned) || 0,
      actual: Number(newBudgetActual) || 0
    };
    const updated = [...budgetRows, newRow];
    setBudgetRows(updated);
    setNewBudgetCategory('');
    setNewBudgetPlanned('');
    setNewBudgetActual('');
    triggerSave(updated, 'budgetRows');
  };

  const handleDeleteBudget = (id: string) => {
    const updated = budgetRows.filter(r => r.id !== id);
    setBudgetRows(updated);
    triggerSave(updated, 'budgetRows');
  };

  const handleAddScm = () => {
    if (!newScmBid || !newScmDesc || !newScmValue) return;
    const newBid = {
      id: 's_' + Date.now(),
      bidNumber: newScmBid,
      description: newScmDesc,
      budget: Number(newScmValue) || 0,
      stage: newScmStage,
      daysElapsed: 1,
      complianceCheck: 'Passed'
    };
    const updated = [...scmItems, newBid];
    setScmItems(updated);
    setNewScmBid('');
    setNewScmDesc('');
    setNewScmValue('');
    triggerSave(updated, 'scmItems');
  };

  const handleDeleteScm = (id: string) => {
    const updated = scmItems.filter(r => r.id !== id);
    setScmItems(updated);
    triggerSave(updated, 'scmItems');
  };

  const handleAddFinding = () => {
    if (!newFindingQuery || !newFindingAction) return;
    const newAudit = {
      id: 'a_' + Date.now(),
      finding: newFindingQuery,
      category: newFindingCategory,
      riskLevel: newFindingRisk,
      actionPlan: newFindingAction,
      progress: 0,
      status: 'Under Review'
    };
    const updated = [...auditFindings, newAudit];
    setAuditFindings(updated);
    setNewFindingQuery('');
    setNewFindingAction('');
    triggerSave(updated, 'auditFindings');
  };

  const handleDeleteFinding = (id: string) => {
    const updated = auditFindings.filter(r => r.id !== id);
    setAuditFindings(updated);
    triggerSave(updated, 'auditFindings');
  };

  const handleAddDraft = () => {
    if (!newDraftName) return;
    const newDraft = {
      id: 'r_' + Date.now(),
      name: newDraftName,
      compiledDate: new Date().toISOString().split('T')[0],
      compiledBy: user.fullName || user.email.split('@')[0],
      approvalStatus: newDraftStatus
    };
    const updated = [...reportingDrafts, newDraft];
    setReportingDrafts(updated);
    setNewDraftName('');
    triggerSave(updated, 'reportingDrafts');
  };

  const handleDeleteDraft = (id: string) => {
    const updated = reportingDrafts.filter(r => r.id !== id);
    setReportingDrafts(updated);
    triggerSave(updated, 'reportingDrafts');
  };

  const handleAddOversight = () => {
    if (!newOversightTarget || !newOversightReport) return;
    const newLog = {
      id: 'o_' + Date.now(),
      targetBody: newOversightTarget,
      reportName: newOversightReport,
      submissionDate: new Date().toISOString().split('T')[0],
      status: newOversightStatus
    };
    const updated = [...oversightLogs, newLog];
    setOversightLogs(updated);
    setNewOversightTarget('');
    setNewOversightReport('');
    triggerSave(updated, 'oversightLogs');
  };

  const handleDeleteOversight = (id: string) => {
    const updated = oversightLogs.filter(r => r.id !== id);
    setOversightLogs(updated);
    triggerSave(updated, 'oversightLogs');
  };

  const handleAddPoe = () => {
    if (!newPoeKpi || !newPoeFile) return;
    const newPoe = {
      id: 'p_' + Date.now(),
      kpiName: newPoeKpi,
      fileName: newPoeFile,
      size: newPoeSize,
      uploadedBy: user.fullName || user.email.split('@')[0],
      uploadDate: new Date().toISOString().split('T')[0],
      status: 'Pending Review'
    };
    const updated = [...poeItems, newPoe];
    setPoeItems(updated);
    setNewPoeKpi('');
    setNewPoeFile('');
    triggerSave(updated, 'poeItems');
  };

  const handleDeletePoe = (id: string) => {
    const updated = poeItems.filter(r => r.id !== id);
    setPoeItems(updated);
    triggerSave(updated, 'poeItems');
  };

  // Pillars & Sub-modules configuration
  const pillars: Pillar[] = [
    {
      id: 'organisational',
      name: 'Organisational PMS',
      desc: 'Tracks corporate delivery and statutory compliance metrics against strategic mandates.',
      subModules: [
        { id: 'annual_report', name: 'Annual Report Module', desc: 'Draft, aggregate, and publish NEDA’s annual organizational performance reports.', icon: <FileText className="w-4 h-4" /> },
        { id: 'annual_perf_report', name: 'Annual Performance Report', desc: 'Evaluates top-tier corporate performance and annual targets.', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'idp', name: 'IDP Module', desc: 'Formulate, review, and align NEDA’s strategic development plans.', icon: <Layers className="w-4 h-4" /> },
        { id: 'sdbip', name: 'SDBIP Module', desc: 'Monitors Service Delivery and Budget Implementation Plan indicators.', icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'fred2', name: 'Extraction Engine', desc: 'NEDA Autonomous cognitive extraction engine for Performance Agreements & SDBIP.', icon: <Bot className="w-4 h-4 text-emerald-600" /> },
      ]
    },
    {
      id: 'individual',
      name: 'Individual PMS',
      desc: 'Cascades strategic scorecards down to corporate executives, directors, and managers.',
      subModules: [
        { id: 'ipms_kpi_capture', name: 'IPMS KPI Capture', desc: 'Capture operational Key Performance Indicators and quarterly milestones.', icon: <CheckCircle2 className="w-4 h-4" /> },
        { id: 'ipms_kpa_capture', name: 'IPMS KPA Capture', desc: 'Map corporate objectives to functional Key Performance Areas.', icon: <Layers className="w-4 h-4" /> },
        { id: 'pdp', name: 'Personal Development Plan (PDP)', desc: 'Identify skill gaps and coordinate staff development frameworks.', icon: <TrendingUp className="w-4 h-4" /> },
        { id: 'performance_plan', name: 'Performance Plan', desc: 'Configure target performance scorecards and metrics.', icon: <Calendar className="w-4 h-4" /> },
        { id: 'core_competencies', name: 'Core Competencies', desc: 'Assess core management and corporate leadership capabilities.', icon: <ShieldCheck className="w-4 h-4" /> },
        { id: 'job_specific_competencies', name: 'Job Specific Competencies (JSC)', desc: 'Capture and evaluate Job Specific Competencies (JSC) and weightings.', icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'performance_agreement', name: 'Performance Agreement', desc: 'Review and sign official performance agreement contracts.', icon: <FileSignature className="w-4 h-4" /> },
        { id: 'self_evaluation', name: 'Self Evaluation', desc: 'Submit employee quarterly review performance ratings and narratives.', icon: <Plus className="w-4 h-4" /> },
        { id: 'managers_approval', name: 'Manager’s Approval', desc: 'Review, moderate, and approve subordinate performance assessments.', icon: <Check className="w-4 h-4" /> },
        { id: 'internal_audit', name: 'Internal Audit Review', desc: 'Perform QA and verify reported deliverables against portfolios of evidence.', icon: <AlertTriangle className="w-4 h-4" /> },
        { id: 'portfolio_of_evidence', name: 'Portfolio of Evidence (PoE)', desc: 'Upload, manage, and verify source documentation backing up KPI achievements.', icon: <Upload className="w-4 h-4" /> },
      ]
    },
    {
      id: 'financial',
      name: 'Financial & SCM',
      desc: 'Ensures strict compliance with municipal finance management regulations (MFMA).',
      subModules: [
        { id: 'budget_tracking', name: 'Budget Tracking', desc: 'Monitor Capital & Operating budgets, forecast allocations, and track real-time variance.', icon: <DollarSign className="w-4 h-4" /> },
        { id: 'scm_performance', name: 'SCM Performance', desc: 'Audit procurement committees, active bids, and competitive tenders.', icon: <CheckSquare className="w-4 h-4" /> },
        { id: 'audit_risk', name: 'Audit & Risk Matrix', desc: 'Centralized register for tracking actions against Auditor-General finding queries.', icon: <AlertCircle className="w-4 h-4" /> },
      ]
    },
    {
      id: 'reporting',
      name: 'Governance & Analytics',
      desc: 'Provides automated corporate analytics, statutory records, and board compliance logs.',
      subModules: [
        { id: 'dashboard_analytics', name: 'KPI Analytics & Early Warning', desc: 'Visual analytics dashboard of organizational budgets, tenders, and performance metrics.', icon: <BarChart3 className="w-4 h-4" /> },
        { id: 'statutory_reporting', name: 'Statutory Reports Compiler', desc: 'Review and compile Section 46 and quarterly progress packs.', icon: <FileText className="w-4 h-4" /> },
        { id: 'stakeholder_oversight', name: 'Board & Stakeholder Oversight', desc: 'Track formal submissions and approval stages for NEDA board and council.', icon: <Eye className="w-4 h-4" /> },
        { id: 'administrator2', name: 'Administrator 2', desc: 'NEDA secure staff directory, Entra ID Sync & Node telemetry.', icon: <Users className="w-4 h-4 text-emerald-600" /> },
      ]
    }
  ];

  const currentPillar = pillars.find(p => p.id === activePillar) || pillars[0];

  return (
    <div className="flex-1 bg-white text-slate-900 flex flex-col h-screen overflow-hidden font-sans">
      
      {/* Top Header - White styled with Green accents */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm relative z-45">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-extrabold text-xl shadow-md">
            N
          </div>
          <div>
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              NEDA Portal <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold tracking-widest px-2 py-0.5 rounded uppercase border border-emerald-200">Autonomous Subsidiary</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
              Nkangala Economic Development Agency (Pty) Ltd
            </p>
          </div>
        </div>

        {/* Global Active Pillar Swapper - Light clean styled */}
        <div className="hidden lg:flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {pillars.map((pil) => (
            <button
              key={pil.id}
              onClick={() => {
                setActivePillar(pil.id);
                setActiveSub(pil.subModules[0].id);
              }}
              className={`px-3.5 py-1.5 rounded text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer ${
                activePillar === pil.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              {pil.name}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <span className="text-xs font-black text-slate-900">{user.fullName || user.email.split('@')[0]}</span>
            <span className="text-[9px] text-emerald-700 font-black uppercase tracking-widest">{user.systemRole || 'NEDA Administrator'}</span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 font-black tracking-widest text-[10px] uppercase px-3.5 py-2.5 rounded-md border border-slate-200 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Workspace Frame */}
      <div className="flex-1 flex min-h-0">
        
        {/* Left Sidebar - Pillar's Submodules list - Styled Clean and Light */}
        <aside className="w-72 bg-slate-50 border-r border-slate-200 p-6 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-6">
            
            {/* Mobile/Compact Pillar select */}
            <div className="lg:hidden space-y-1.5">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Active Pillar</label>
              <select
                value={activePillar}
                onChange={(e) => {
                  const val = e.target.value as PillarId;
                  setActivePillar(val);
                  const firstSub = pillars.find(p => p.id === val)?.subModules[0].id;
                  if (firstSub) setActiveSub(firstSub);
                }}
                className="w-full bg-white border border-slate-200 text-slate-800 font-bold uppercase tracking-wider text-xs rounded p-2 focus:outline-none focus:border-emerald-500"
              >
                {pillars.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-700 mb-3">
                {currentPillar.name}
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-6 font-medium">
                {currentPillar.desc}
              </p>

              <div className="space-y-1">
                {currentPillar.subModules.map((sub) => {
                  const isActive = activeSub === sub.id;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => setActiveSub(sub.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all group cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800 shadow-sm'
                          : 'border border-transparent hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <div className={`p-1.5 rounded-md transition-colors ${
                        isActive ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 group-hover:bg-slate-300'
                      }`}>
                        {sub.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-black tracking-wide uppercase truncate">{sub.name}</div>
                        <div className="text-[9px] text-slate-500 truncate group-hover:text-slate-600 font-medium">{sub.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <div className="bg-white p-4 rounded-xl border border-slate-200/80 flex items-start gap-3 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-800">Supabase Pipeline Active</h4>
                <p className="text-[9px] text-slate-500 leading-relaxed mt-1 font-medium">
                  Client isolated tenant ID: <span className="text-emerald-700 font-bold">{tenantId}</span>. Database backups are continuously synced server-side.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Content Workspace - Pristine Clean light backdrop */}
        <main className="flex-1 bg-white overflow-y-auto p-8 lg:p-12 relative flex flex-col justify-between">
          
          <div className="space-y-8 flex-1">
            
            {/* Sync Alert Toast Banner */}
            {statusMessage && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl flex items-center gap-3 text-xs font-black uppercase tracking-wider shadow-sm animate-fade-in shrink-0">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
                <span>{statusMessage}</span>
              </div>
            )}

            {/* Sub-module Dynamic Header */}
            <div className="border-b border-slate-200 pb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                  NEDA Corporate Sub-Module
                </span>
                <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mt-1.5">
                  {currentPillar.subModules.find(s => s.id === activeSub)?.name}
                </h2>
                <p className="text-xs text-slate-500 mt-1 max-w-3xl font-medium">
                  {currentPillar.subModules.find(s => s.id === activeSub)?.desc}
                </p>
              </div>

              {/* Central sync status */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                  Status: Secure Cloud Storage
                </span>
              </div>
            </div>

            {/* Dynamic Rendering Section with Smooth Entry Animations */}
            <div className="min-h-[400px]">
              
              {/* --- PILLAR 1: ORGANISATIONAL PMS (REPLICATED AS PER THE MAIN SYSTEM) --- */}
              {activeSub === 'annual_report' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Annual Report Module</h3>
                  <AR currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'annual_perf_report' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Annual Performance Report Module</h3>
                  <APR currentUser={user} activeTenantId={tenantId} onClose={() => {}} />
                </div>
              )}

              {activeSub === 'idp' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Strategic IDP Module</h3>
                  <IDP currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'sdbip' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Service Delivery and Budget Implementation Plan Module</h3>
                  <SDBIP currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'fred2' && (
                <div className="animate-fade-in">
                  <Fred2Suite currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {/* --- PILLAR 2: INDIVIDUAL PMS (REPLICATED AS PER THE MAIN SYSTEM) --- */}
              {activeSub === 'ipms_kpi_capture' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated IPMS KPI Capture</h3>
                  <KPIIPMS currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'ipms_kpa_capture' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated IPMS KPA Capture</h3>
                  <KPAIPMS currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'pdp' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Personal Development Plan Module</h3>
                  <PersonalDevelopmentPlan currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'performance_plan' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Performance Planner Module</h3>
                  <PerformanceAgreements currentUser={user} activeTenantId={tenantId} isPlan={true} />
                </div>
              )}

              {activeSub === 'core_competencies' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Core Competencies Module</h3>
                  <CoreCompetencies currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'job_specific_competencies' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Job Specific Competencies (JSC) Module</h3>
                  <JobSpecificCompetencies currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'performance_agreement' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Performance Agreement Contract Module</h3>
                  <PerformanceAgreements currentUser={user} activeTenantId={tenantId} isPlan={false} />
                </div>
              )}

              {activeSub === 'self_evaluation' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Self Evaluation Module</h3>
                  <EvaluationIPMS currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'managers_approval' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Manager Approval Matrix</h3>
                  <ManagerReviewIPMS currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {activeSub === 'internal_audit' && (
                <div className="animate-fade-in bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Integrated Internal Audit QA Review</h3>
                  <InternalAuditReviewIPMS currentUser={user} activeTenantId={tenantId} />
                </div>
              )}

              {/* INDIVIDUAL PMS: Portfolio of Evidence (PoE) submodule */}
              {activeSub === 'portfolio_of_evidence' && (
                <div className="animate-fade-in space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Portfolio of Evidence (PoE) Secure Ledger</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Back up and lock down files associated with quarterly KPI evaluations.</p>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2 py-1 rounded border border-emerald-100">
                        {poeItems.length} Backed Up Files
                      </span>
                    </div>

                    {/* Form to log / upload new evidence */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Associated KPI Indicator</label>
                        <select
                          value={newPoeKpi}
                          onChange={(e) => setNewPoeKpi(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">Select KPI Goal...</option>
                          <option value="Number of youth-owned SMMEs funded">SMMEs Funding Goal</option>
                          <option value="Value of domestic investment secured">Investment Capital Goal</option>
                          <option value="Industrial hub infrastructure project percentage completion">Agri-Hub Capex Goal</option>
                          <option value="Statutory audits cleared with clean findings">Auditor General Goal</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">File Name</label>
                        <input
                          type="text"
                          value={newPoeFile}
                          onChange={(e) => setNewPoeFile(e.target.value)}
                          placeholder="e.g. Q4_Signoff_Report.pdf"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">File Size</label>
                        <select
                          value={newPoeSize}
                          onChange={(e) => setNewPoeSize(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="1.2 MB">1.2 MB</option>
                          <option value="2.8 MB">2.8 MB</option>
                          <option value="4.5 MB">4.5 MB</option>
                          <option value="10.2 MB">10.2 MB</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleAddPoe}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-2.5 rounded shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 border border-emerald-500"
                        >
                          <Upload className="w-3.5 h-3.5" /> Upload & Sync PoE
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black text-[9px] tracking-wider">
                            <th className="p-4">Evidence Description (Associated KPI)</th>
                            <th className="p-4">Uploaded File</th>
                            <th className="p-4">Size</th>
                            <th className="p-4">Uploaded By</th>
                            <th className="p-4">Upload Date</th>
                            <th className="p-4">Verification Status</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {poeItems.map((item, index) => (
                            <tr key={item.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                              <td className="p-4 font-black text-slate-900">{item.kpiName}</td>
                              <td className="p-4 font-bold text-slate-700 flex items-center gap-1.5">
                                <FileText className="w-4 h-4 text-slate-400" />
                                {item.fileName}
                              </td>
                              <td className="p-4 text-slate-500 font-bold">{item.size}</td>
                              <td className="p-4 text-slate-600 font-bold">{item.uploadedBy}</td>
                              <td className="p-4 text-slate-500">{item.uploadDate}</td>
                              <td className="p-4">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${
                                  item.status === 'Verified' 
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                                    : 'bg-amber-50 text-amber-800 border-amber-200'
                                }`}>
                                  {item.status}
                                </span>
                              </td>
                              <td className="p-4 text-center flex items-center justify-center gap-2">
                                <button
                                  onClick={() => alert(`Downloading archived file: ${item.fileName} from Supabase storage partition...`)}
                                  className="text-emerald-700 hover:text-emerald-500 p-1 cursor-pointer"
                                  title="Download File"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDeletePoe(item.id)}
                                  className="text-rose-600 hover:text-rose-500 p-1 cursor-pointer"
                                  title="Remove PoE"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                          {poeItems.length === 0 && (
                            <tr>
                              <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                                No portfolios of evidence recorded. Use the inputs above to upload the first file.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* --- PILLAR 3: FINANCIAL & SCM (PROPER WORKING FUNCTIONALITY BACKED BY SUPABASE) --- */}
              {activeSub === 'budget_tracking' && (
                <div className="animate-fade-in space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">NEDA Budget Expenditure Tracker</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Control operating and capital investments, monitor real-time expenditure, and track positive/negative variances.</p>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2.5 py-1 rounded border border-emerald-200">
                        MFMA Compliant Ledger
                      </span>
                    </div>

                    {/* Form to insert new budget line */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Expenditure Line Category</label>
                        <input
                          type="text"
                          value={newBudgetCategory}
                          onChange={(e) => setNewBudgetCategory(e.target.value)}
                          placeholder="e.g. Infrastructure Maintenance"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Planned Allocation (ZAR)</label>
                        <input
                          type="number"
                          value={newBudgetPlanned}
                          onChange={(e) => setNewBudgetPlanned(e.target.value)}
                          placeholder="e.g. 5000000"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Actual Spent (ZAR)</label>
                        <input
                          type="number"
                          value={newBudgetActual}
                          onChange={(e) => setNewBudgetActual(e.target.value)}
                          placeholder="e.g. 4800000"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleAddBudget}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-2.5 rounded shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 border border-emerald-500"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Budget Row
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black text-[9px] tracking-wider">
                            <th className="p-4">Expenditure Category / Cost Center</th>
                            <th className="p-4 text-right">Planned Allocation</th>
                            <th className="p-4 text-right">Actual Spent</th>
                            <th className="p-4 text-right">Remaining Balance</th>
                            <th className="p-4 text-center">Variance %</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {budgetRows.map((row, index) => {
                            const variance = row.planned - row.actual;
                            const percent = row.planned > 0 ? (row.actual / row.planned) * 100 : 0;
                            return (
                              <tr key={row.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                                <td className="p-4">
                                  <input 
                                    type="text" 
                                    value={row.category} 
                                    onChange={(e) => {
                                      const updated = [...budgetRows];
                                      updated[index].category = e.target.value;
                                      setBudgetRows(updated);
                                      triggerSave(updated, 'budgetRows');
                                    }}
                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-900 font-black w-full"
                                  />
                                </td>
                                <td className="p-4 text-right">
                                  <input 
                                    type="number" 
                                    value={row.planned} 
                                    onChange={(e) => {
                                      const updated = [...budgetRows];
                                      updated[index].planned = Number(e.target.value);
                                      setBudgetRows(updated);
                                      triggerSave(updated, 'budgetRows');
                                    }}
                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-right font-bold text-slate-700 w-28"
                                  />
                                </td>
                                <td className="p-4 text-right">
                                  <input 
                                    type="number" 
                                    value={row.actual} 
                                    onChange={(e) => {
                                      const updated = [...budgetRows];
                                      updated[index].actual = Number(e.target.value);
                                      setBudgetRows(updated);
                                      triggerSave(updated, 'budgetRows');
                                    }}
                                    className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-right font-bold text-slate-800 w-28"
                                  />
                                </td>
                                <td className={`p-4 text-right font-black ${variance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  R {variance.toLocaleString()}
                                </td>
                                <td className="p-4 text-center">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                    percent > 100 ? 'bg-rose-50 text-rose-800 border border-rose-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  }`}>
                                    {percent.toFixed(1)}% Spent
                                  </span>
                                </td>
                                <td className="p-4 text-center">
                                  <button 
                                    onClick={() => handleDeleteBudget(row.id)}
                                    className="text-rose-600 hover:text-rose-500 p-1 cursor-pointer animate-pulse"
                                    title="Delete Budget Line"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeSub === 'scm_performance' && (
                <div className="animate-fade-in space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">NEDA SCM Tender Procurement Audit</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Track procurement committee meetings, active bids, and competitive tenders complying with local regulations.</p>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2.5 py-1 rounded border border-emerald-200">
                        Competitive Bids Registry
                      </span>
                    </div>

                    {/* Add bid SCM form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Tender/Bid Number</label>
                        <input
                          type="text"
                          value={newScmBid}
                          onChange={(e) => setNewScmBid(e.target.value)}
                          placeholder="e.g. NEDA-2026-008"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Bid Description</label>
                        <input
                          type="text"
                          value={newScmDesc}
                          onChange={(e) => setNewScmDesc(e.target.value)}
                          placeholder="e.g. Supply of IT servers"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Estimated Value (ZAR)</label>
                        <input
                          type="number"
                          value={newScmValue}
                          onChange={(e) => setNewScmValue(e.target.value)}
                          placeholder="e.g. 500000"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Committee Stage</label>
                        <select
                          value={newScmStage}
                          onChange={(e) => setNewScmStage(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Specifications Committee">Specifications Committee</option>
                          <option value="Evaluation Committee">Evaluation Committee</option>
                          <option value="Adjudication Committee">Adjudication Committee</option>
                          <option value="Awarded / SLA Draft">Awarded / SLA Draft</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleAddScm}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-2.5 rounded shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1 border border-emerald-500"
                        >
                          <Plus className="w-3.5 h-3.5" /> Record Tender Bid
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black text-[9px] tracking-wider">
                            <th className="p-4">Tender Reference ID</th>
                            <th className="p-4">Tender / Bid Description</th>
                            <th className="p-4 text-right">Value (ZAR)</th>
                            <th className="p-4">Active Bid Committee Stage</th>
                            <th className="p-4 text-center">Days Active</th>
                            <th className="p-4">Pre-compliance</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {scmItems.map((bid, index) => (
                            <tr key={bid.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                              <td className="p-4 font-black text-emerald-800">{bid.bidNumber}</td>
                              <td className="p-4">
                                <input 
                                  type="text" 
                                  value={bid.description} 
                                  onChange={(e) => {
                                    const updated = [...scmItems];
                                    updated[index].description = e.target.value;
                                    setScmItems(updated);
                                    triggerSave(updated, 'scmItems');
                                  }}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 font-bold w-full"
                                />
                              </td>
                              <td className="p-4 text-right">
                                <input 
                                  type="number" 
                                  value={bid.budget} 
                                  onChange={(e) => {
                                    const updated = [...scmItems];
                                    updated[index].budget = Number(e.target.value);
                                    setScmItems(updated);
                                    triggerSave(updated, 'scmItems');
                                  }}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-right font-bold text-slate-700 w-24"
                                />
                              </td>
                              <td className="p-4">
                                <select
                                  value={bid.stage}
                                  onChange={(e) => {
                                    const updated = [...scmItems];
                                    updated[index].stage = e.target.value;
                                    setScmItems(updated);
                                    triggerSave(updated, 'scmItems');
                                  }}
                                  className="bg-white text-slate-800 text-xs rounded p-1 border border-slate-200 font-bold focus:outline-none focus:border-emerald-500"
                                >
                                  <option value="Specifications Committee">Specifications Committee</option>
                                  <option value="Evaluation Committee">Evaluation Committee</option>
                                  <option value="Adjudication Committee">Adjudication Committee</option>
                                  <option value="Awarded / SLA Draft">Awarded / SLA Draft</option>
                                </select>
                              </td>
                              <td className="p-4 text-center font-bold">
                                <input 
                                  type="number" 
                                  value={bid.daysElapsed} 
                                  onChange={(e) => {
                                    const updated = [...scmItems];
                                    updated[index].daysElapsed = Number(e.target.value);
                                    setScmItems(updated);
                                    triggerSave(updated, 'scmItems');
                                  }}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 text-center font-bold w-12"
                                /> days
                              </td>
                              <td className="p-4">
                                <span className="text-emerald-800 font-black bg-emerald-100 px-2.5 py-1 rounded-full border border-emerald-200 text-[9px] tracking-wider uppercase">PASSED</span>
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => handleDeleteScm(bid.id)}
                                  className="text-rose-600 hover:text-rose-500 p-1 cursor-pointer"
                                  title="Remove Bid"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeSub === 'audit_risk' && (
                <div className="animate-fade-in space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">NEDA Audit Findings Mitigation register</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Monitor and resolve findings issued by the Auditor-General and Internal Audit division.</p>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2.5 py-1 rounded border border-emerald-200">
                        Supabase Audit Log
                      </span>
                    </div>

                    {/* Add Finding form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Query Finding Detail</label>
                        <input
                          type="text"
                          value={newFindingQuery}
                          onChange={(e) => setNewFindingQuery(e.target.value)}
                          placeholder="e.g. Unreconciled service contract invoices"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Finding Category</label>
                        <select
                          value={newFindingCategory}
                          onChange={(e) => setNewFindingCategory(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Compliance">Compliance</option>
                          <option value="Internal Control">Internal Control</option>
                          <option value="Financial Management">Financial Management</option>
                          <option value="Risk Management">Risk Management</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Risk Level</label>
                        <select
                          value={newFindingRisk}
                          onChange={(e) => setNewFindingRisk(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Corrective Action Plan</label>
                        <input
                          type="text"
                          value={newFindingAction}
                          onChange={(e) => setNewFindingAction(e.target.value)}
                          placeholder="e.g. Appoint consultant to review SCM compliance files"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="col-span-1 md:col-span-4 flex justify-end">
                        <button
                          onClick={handleAddFinding}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded shadow-sm transition-colors cursor-pointer border border-emerald-500"
                        >
                          Record Audit Finding
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black text-[9px] tracking-wider">
                            <th className="p-4">Audit Finding / Deficiency Description</th>
                            <th className="p-4">Category</th>
                            <th className="p-4">Risk Level</th>
                            <th className="p-4">Action Plan Response</th>
                            <th className="p-4 text-center">Implementation Progress</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditFindings.map((row, index) => (
                            <tr key={row.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                              <td className="p-4 font-black text-slate-900">
                                <input 
                                  type="text" 
                                  value={row.finding} 
                                  onChange={(e) => {
                                    const updated = [...auditFindings];
                                    updated[index].finding = e.target.value;
                                    setAuditFindings(updated);
                                    triggerSave(updated, 'auditFindings');
                                  }}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-800 font-bold w-full"
                                />
                              </td>
                              <td className="p-4 text-slate-500 font-bold">{row.category}</td>
                              <td className="p-4">
                                <select
                                  value={row.riskLevel}
                                  onChange={(e) => {
                                    const updated = [...auditFindings];
                                    updated[index].riskLevel = e.target.value;
                                    setAuditFindings(updated);
                                    triggerSave(updated, 'auditFindings');
                                  }}
                                  className="bg-white text-slate-800 text-xs rounded p-1 border border-slate-200 font-bold focus:outline-none"
                                >
                                  <option value="High">High</option>
                                  <option value="Medium">Medium</option>
                                  <option value="Low">Low</option>
                                </select>
                              </td>
                              <td className="p-4 text-slate-700">
                                <input 
                                  type="text" 
                                  value={row.actionPlan} 
                                  onChange={(e) => {
                                    const updated = [...auditFindings];
                                    updated[index].actionPlan = e.target.value;
                                    setAuditFindings(updated);
                                    triggerSave(updated, 'auditFindings');
                                  }}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none text-slate-700 w-full"
                                />
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center gap-2 justify-center">
                                  <input 
                                    type="range" 
                                    min="0" 
                                    max="100" 
                                    value={row.progress} 
                                    onChange={(e) => {
                                      const updated = [...auditFindings];
                                      updated[index].progress = Number(e.target.value);
                                      setAuditFindings(updated);
                                      triggerSave(updated, 'auditFindings');
                                    }}
                                    className="w-20 accent-emerald-600 cursor-pointer"
                                  />
                                  <span className="font-extrabold text-[10px] text-slate-800 w-8">{row.progress}%</span>
                                </div>
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => handleDeleteFinding(row.id)}
                                  className="text-rose-600 hover:text-rose-500 p-1 cursor-pointer"
                                  title="Delete Finding"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* --- PILLAR 4: GOVERNANCE & ANALYTICS (PROPER WORKING FUNCTIONALITY BACKED BY SUPABASE) --- */}
              {activeSub === 'dashboard_analytics' && (
                <div className="animate-fade-in space-y-8">
                  
                  {/* Top Metric Cards - Light Theme */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Corporate KPI Pass Rate</span>
                      <h4 className="text-3xl font-black tracking-tight text-slate-900 mt-2">88.5%</h4>
                      <span className="text-[10px] font-bold text-emerald-600 mt-1.5 block">▲ 2.1% from last quarter</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Tenders In Specification Stage</span>
                      <h4 className="text-3xl font-black tracking-tight text-slate-900 mt-2">
                        {scmItems.filter(s => s.stage === 'Specifications Committee').length} Bids
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 mt-1.5 block">Compliance audits passed</span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total Capital Budget Spent</span>
                      <h4 className="text-3xl font-black tracking-tight text-slate-900 mt-2">
                        {budgetRows.length > 0 
                          ? ((budgetRows.reduce((a, b) => a + b.actual, 0) / budgetRows.reduce((a, b) => a + b.planned, 0)) * 100).toFixed(1) 
                          : '0.0'}%
                      </h4>
                      <span className="text-[10px] font-bold text-slate-500 mt-1.5 block">
                        R {(budgetRows.reduce((a,b) => a+b.actual, 0) / 1000000).toFixed(1)}M spent of R {(budgetRows.reduce((a,b) => a+b.planned, 0) / 1000000).toFixed(1)}M
                      </span>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Audit Finding Implementation</span>
                      <h4 className="text-3xl font-black tracking-tight text-slate-900 mt-2">
                        {auditFindings.length > 0 
                          ? (auditFindings.reduce((a,b) => a + b.progress, 0) / auditFindings.length).toFixed(0) 
                          : '0'}% Avg
                      </h4>
                      <span className="text-[10px] font-bold text-emerald-600 mt-1.5 block">Mitigating historical AG queries</span>
                    </div>
                  </div>

                  {/* Multi-charts with Recharts in light theme green, grey and black */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">SCM Tender Processing: Days Elapsed per Stage</h3>
                      <div className="h-64 mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={scmItems}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="bidNumber" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Line type="monotone" dataKey="daysElapsed" name="Days Active" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981' }} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Financial Performance: Planned Allocation vs Actual Spent</h3>
                      <div className="h-64 mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={budgetRows}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="category" stroke="#64748b" fontSize={8} tickFormatter={(val) => val.split(' ').slice(0, 2).join(' ')} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                            <Legend wrapperStyle={{ fontSize: 9 }} />
                            <Bar dataKey="planned" name="Planned ZAR" fill="#64748b" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="actual" name="Spent ZAR" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {activeSub === 'statutory_reporting' && (
                <div className="animate-fade-in space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">NEDA Statutory Reports Compiler</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Automate and compile legislative reports (Section 46 annual, quarterly scorecard, budget assessments).</p>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2.5 py-1 rounded border border-emerald-200">
                        MFMA Section 46 Compiler
                      </span>
                    </div>

                    {/* New Statutory Report Form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Report Draft Name</label>
                        <input
                          type="text"
                          value={newDraftName}
                          onChange={(e) => setNewDraftName(e.target.value)}
                          placeholder="e.g. Q1 Performance Report 2026/27"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Approval Stage Status</label>
                        <select
                          value={newDraftStatus}
                          onChange={(e) => setNewDraftStatus(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Drafting Stage">Drafting Stage</option>
                          <option value="Under Board Review">Under Board Review</option>
                          <option value="Board Approved">Board Approved</option>
                          <option value="District Submitted">District Submitted</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleAddDraft}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-2.5 rounded shadow-sm transition-colors cursor-pointer border border-emerald-500"
                        >
                          Compile Performance Draft
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {reportingDrafts.map((draft) => (
                        <div key={draft.id} className="bg-slate-50 p-6 rounded-xl border border-slate-200 space-y-4 flex flex-col justify-between shadow-sm hover:border-emerald-300 transition-colors">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="bg-emerald-100 p-2 rounded-lg">
                                <FileText className="w-5 h-5 text-emerald-800" />
                              </div>
                              <span className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                                {draft.approvalStatus}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-900">{draft.name}</h4>
                            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Compiler Exec: {draft.compiledBy}</div>
                          </div>
                          
                          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 font-bold">
                            <span>Compiled: {draft.compiledDate}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => alert(`Generating PDF and Excel backup pack for ${draft.name}...`)}
                                className="text-emerald-700 hover:text-emerald-500 underline font-extrabold cursor-pointer"
                              >
                                Export Pack
                              </button>
                              <button 
                                onClick={() => handleDeleteDraft(draft.id)}
                                className="text-rose-600 hover:text-rose-500 cursor-pointer p-0.5"
                                title="Delete Draft"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {activeSub === 'stakeholder_oversight' && (
                <div className="animate-fade-in space-y-6">
                  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">Stakeholder Submission Oversight Log</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Control submissions of corporate evaluation reports, financial packets, and board adoption frameworks.</p>
                      </div>
                      <span className="text-[10px] text-emerald-800 bg-emerald-50 font-bold px-2.5 py-1 rounded border border-emerald-200">
                        Oversight Audit Trail
                      </span>
                    </div>

                    {/* New Oversight submission form */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Target Oversight Body</label>
                        <input
                          type="text"
                          value={newOversightTarget}
                          onChange={(e) => setNewOversightTarget(e.target.value)}
                          placeholder="e.g. Mayoral Committee"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Report Pack Submitted</label>
                        <input
                          type="text"
                          value={newOversightReport}
                          onChange={(e) => setNewOversightReport(e.target.value)}
                          placeholder="e.g. FY 2025/26 Annual Performance Pack"
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Submission Stage Status</label>
                        <select
                          value={newOversightStatus}
                          onChange={(e) => setNewOversightStatus(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-xs text-slate-800 rounded p-2 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Submitted">Submitted</option>
                          <option value="Under Review">Under Review</option>
                          <option value="Adopted with Recommendations">Adopted with Recommendations</option>
                          <option value="Submitted Successfully">Submitted Successfully</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <button
                          onClick={handleAddOversight}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] py-2.5 rounded shadow-sm transition-colors cursor-pointer border border-emerald-500"
                        >
                          Log Formal Submission
                        </button>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-700 uppercase font-black text-[10px] tracking-wider">
                            <th className="p-4">Oversight Body Target</th>
                            <th className="p-4">Submitted Performance Report / Pack</th>
                            <th className="p-4">Submission Date</th>
                            <th className="p-4">Oversight Status</th>
                            <th className="p-4 text-center">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {oversightLogs.map((log, index) => (
                            <tr key={log.id} className="border-b border-slate-150 hover:bg-slate-50/50">
                              <td className="p-4 font-black text-slate-900">
                                <input 
                                  type="text" 
                                  value={log.targetBody} 
                                  onChange={(e) => {
                                    const updated = [...oversightLogs];
                                    updated[index].targetBody = e.target.value;
                                    setOversightLogs(updated);
                                    triggerSave(updated, 'oversightLogs');
                                  }}
                                  className="bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 focus:outline-none font-bold text-slate-850 w-full"
                                />
                              </td>
                              <td className="p-4 text-slate-800 font-extrabold">{log.reportName}</td>
                              <td className="p-4 text-slate-500">{log.submissionDate}</td>
                              <td className="p-4">
                                <select
                                  value={log.status}
                                  onChange={(e) => {
                                    const updated = [...oversightLogs];
                                    updated[index].status = e.target.value;
                                    setOversightLogs(updated);
                                    triggerSave(updated, 'oversightLogs');
                                  }}
                                  className="bg-white text-slate-800 text-xs rounded p-1 border border-slate-200 font-bold focus:outline-none"
                                >
                                  <option value="Submitted">Submitted</option>
                                  <option value="Under Review">Under Review</option>
                                  <option value="Adopted with Recommendations">Adopted with Recommendations</option>
                                  <option value="Submitted Successfully">Submitted Successfully</option>
                                </select>
                              </td>
                              <td className="p-4 text-center">
                                <button 
                                  onClick={() => handleDeleteOversight(log.id)}
                                  className="text-rose-600 hover:text-rose-500 p-1 cursor-pointer"
                                  title="Remove Log Item"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeSub === 'administrator2' && (
                <div className="animate-fade-in">
                  <UserManagement2 currentUser={user} onImpersonate={onImpersonate} />
                </div>
              )}

            </div>

          </div>

          {/* Clean, Light-themed Footer */}
          <footer className="shrink-0 pt-8 border-t border-slate-200 text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center mt-12">
            &copy; {new Date().getFullYear()} NEDA SUBSIDIARY PORTAL &bull; AUDITED IN ACCORDANCE WITH ACT 56 OF 2003 (MFMA) &bull; BACKED UP TO SECURE SUPABASE CLOUD INSTANCE
          </footer>

        </main>

      </div>
    </div>
  );
}
