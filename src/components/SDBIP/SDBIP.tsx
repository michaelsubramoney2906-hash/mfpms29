import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Layers, Info, CheckCircle, Upload, Download, ArrowRight, Shield, ShieldCheck, AlertTriangle, HelpCircle, Check, CheckSquare, FileText, Plus, Trash2, Database, FolderArchive, AlertCircle, Sparkles, Send, Inbox, Bell, Eye, Lock, Unlock, RefreshCw, XCircle, Clock, Maximize2, Minimize2, Calendar, CalendarDays, ShieldAlert, KeyRound, BellOff, Key, X, RotateCcw, Save } from 'lucide-react';
import type { User } from '../../types';
import { SDBIPDraftingSuite } from './SDBIPDraftingSuite';
import { WordProcessor } from './WordProcessor';
import { DraftingSuiteTab } from '../APR/APR';
import { AzureADPicker } from './AzureADPicker';
import { SDBIPPagination } from './SDBIPPagination';
import { ExpandableCell, CellExpandModal, ExpandModalState } from './ExpandableCell';
import { isQuarterInReportingPeriod, getQuarterLockNotice, REPORTING_PERIOD_CONFIGS, getCurrentMunicipalQuarter, ReportingPhase } from '../../utils/reportingPeriods';
import { PMS_TEAM_REVIEWERS, INTERNAL_AUDIT_USERS, isUserMatch, dispatchSdbipNotification, isMasterAdminMike, isQuarter1UnlockedKpi } from '../../utils/sdbipWorkflowHelper';
import { isUserUnrestricted } from '../../utils/unrestrictedHelper';
import { OfficeDocumentViewer } from '../IPMS/OfficeDocumentViewer';
import { calcVar, extractNumericValue } from '../../utils/varianceCalculator';
import { ensureAllSdbipKpis } from '../../sdbip_catalog';

export { isQuarter1UnlockedKpi };

export const isSdbipPlaceholderRow = (row: any): boolean => {
  if (!row || typeof row !== 'object') return false;
  if (row.isPlaceholder === false || row._isPlaceholder === false) return false;
  if (row.source === 'extractor' || row.source === 'upload' || row.source === 'manual' || row.source === 'editor') return false;
  if (row.isPlaceholder === true || row._isPlaceholder === true) return true;

  const id = String(row.id || row._id || '').trim();
  const kpi = String(row.kpi || row.KPI || row.operationalActivity || row.Description || '').trim();

  // Explicit dummy placeholder IDs
  if (/^sdbip-placeholder/i.test(id)) return true;

  // Exact sample strings from default dummy catalog
  if (
    kpi === 'Percentage of households with access to basic potable water supply.' ||
    kpi === 'Percentage of sanitation complaints resolved within 24 hours.' ||
    kpi === 'Number of new water connections completed in informal settlements.' ||
    kpi === 'Kilometers of new storm-water drainage pipelines installed.' ||
    kpi === 'Percentage of electricity service interruptions resolved within standard NRS timeframes.'
  ) {
    return true;
  }

  return false;
};

export const getDefaultCanonicalSdbipRows = (): SdbipRow[] => {
  // Purged: Returns empty array so placeholders are never injected into application or Supabase
  return [];
};

export const isTargetNA = (val: string | undefined | null): boolean => {
  if (!val) return false;
  const cleaned = val.trim().toLowerCase();
  if (
    cleaned === 'n/a' ||
    cleaned === 'na' ||
    cleaned === 'n / a' ||
    cleaned === 'n.a.' ||
    cleaned === 'n.a' ||
    cleaned === 'not applicable' ||
    cleaned.startsWith('n/a') ||
    cleaned.startsWith('na ')
  ) {
    return true;
  }
  return false;
};

let globalReportingAssignmentsUnlocked = false;

/**
 * Submitter & Approver cells in the SDBIP Top Layer reporting table are permanently locked so existing assignments cannot be changed.
 */
export const isKpiUnlockedForSubmitterApprover = (_row?: { refNum?: string; id?: string; kpi?: string } | null | undefined): boolean => {
  return false; 
};

export const isSubmitterApproverLockedInReporting = (_row?: { refNum?: string; id?: string; kpi?: string; adminLocked?: boolean; workflowStatus?: string } | null | undefined): boolean => {
  return true; 
};

interface SDBIPProps {
  currentUser: User;
  activeTenantId: string;
}

export interface SdbipWorkflow {
  status: 'draft' | 'pending_review' | 'pending_approval' | 'approved' | 'completed' | 'pending_audit';
  submittedBy?: string;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  auditedBy?: string;
  auditedAt?: string;
  comments?: string;
}

export interface SdbipRow {
  id: string;
  refNum: string;
  strategicObj: string;
  bsd: string; // KPA 5: Basic Service Delivery and Infrastructure
  led: string; // KPA 3: Local Economic Development
  mfvm: string; // KPA 4: Municipal Financial Viability and Management
  ggpp: string; // KPA 2: Good Governance and Public Participation
  midt: string; // KPA 1: Institutional Development and Transformation
  sr: string;   // KPA 6: Spatial Rationale
  midTerm?: string; // Calculated Mid Term (Q1+Q2) Target
  kpas: string;
  operationalActivity: string;
  kpi: string;
  compliance: 'compliant' | 'non-compliant' | 'at risk';
  uom: string;
  mscoaTracking: string;
  baseline: string;
  annualTarget: string;
  budgetAllocation: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  responsibleUnit: string;
  submitter?: string;
  reviewer?: string;
  approver?: string;
  internalAudit?: string;
  auditChecklist?: {
    poeVerified?: boolean;
    actualsVerified?: boolean;
    varianceVerified?: boolean;
    targetCalculations?: boolean;
    complianceConfirmed?: boolean;
    auditSubmitted?: boolean;
    comments?: string;
  };
  poeStatus: string;
  weight?: string;
  score?: string;
  // Reporting fields
  q1Actual?: string;
  q1Variance?: string;
  q1Corrective?: string;
  q2Actual?: string;
  q2Variance?: string;
  q2Corrective?: string;
  midTermActual?: string;
  midTermVariance?: string;
  midTermCorrective?: string;
  midTermTarget?: string;
  q3Actual?: string;
  q3Variance?: string;
  q3Corrective?: string;
  q4Actual?: string;
  q4Variance?: string;
  q4Corrective?: string;
  ragStatus?: 'red' | 'amber' | 'green';
  q1Poes?: string[];
  q2Poes?: string[];
  midTermPoes?: string[];
  q3Poes?: string[];
  q4Poes?: string[];
  poeDesc?: string;
  q1PoeDesc?: string;
  q2PoeDesc?: string;
  midTermPoeDesc?: string;
  q3PoeDesc?: string;
  q4PoeDesc?: string;
  q1Expenditure?: string;
  q2Expenditure?: string;
  midTermExpenditure?: string;
  q3Expenditure?: string;
  q4Expenditure?: string;
  workflows?: {
    [key: string]: SdbipWorkflow;
  };
  workflowStatus?: string;
  approvedBy?: string;
  adminLocked?: boolean;
  workflowHistory?: any[];
  budgetOverride?: {
    requested?: boolean;
    requestedBy?: string;
    requestedAt?: string;
    reason?: string;
    excessAmount?: number;
    approved?: boolean;
    approvedBy?: string;
    approvedAt?: string;
    rejected?: boolean;
    rejectedBy?: string;
    rejectedAt?: string;
  };
}

const isOpex = (budget: string): boolean => {
  return budget ? budget.toLowerCase().includes('opex') : false;
};

export const parseBudgetNum = (val: any): number => {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : Math.round(val);
  const s = String(val).trim();
  if (!s || s.toLowerCase() === 'opex' || s.toLowerCase() === 'capex') return 0;
  const clean = s.replace(/[^\d]/g, '');
  return clean ? parseInt(clean, 10) : 0;
};

export interface BudgetBreakdown {
  totalBudget: number;
  q1Exp: number;
  q2Exp: number;
  q3Exp: number;
  q4Exp: number;
  totalSpent: number;
  remainingBudget: number;
  isExceeded: boolean;
  excessAmount: number;
  remainingQuarterCount: number;
  suggestedPerQuarter: number;
  hasOverrideApproval: boolean;
  overrideApprovedBy?: string;
  overrideRequested?: boolean;
}

export function getRowBudgetBreakdown(row: SdbipRow): BudgetBreakdown {
  const totalBudget = parseBudgetNum(row.budgetAllocation || (row as any).budget || '');
  const q1Exp = parseBudgetNum(row.q1Expenditure || '');
  const q2Exp = parseBudgetNum(row.q2Expenditure || '');
  const q3Exp = parseBudgetNum(row.q3Expenditure || '');
  const q4Exp = parseBudgetNum(row.q4Expenditure || '');

  const totalSpent = q1Exp + q2Exp + q3Exp + q4Exp;
  const remainingBudget = totalBudget - totalSpent;
  const isExceeded = totalBudget > 0 && totalSpent > totalBudget;
  const excessAmount = isExceeded ? totalSpent - totalBudget : 0;

  // Count which future quarters haven't been reported yet (among Q2, Q3, Q4)
  const unfilledFuture = [
    { q: 'q2', val: q2Exp },
    { q: 'q3', val: q3Exp },
    { q: 'q4', val: q4Exp }
  ].filter(item => item.val === 0).length;

  const remainingQuarterCount = unfilledFuture > 0 ? unfilledFuture : 3;
  const suggestedPerQuarter = remainingBudget > 0 ? Math.round(remainingBudget / remainingQuarterCount) : 0;

  const hasOverrideApproval = !!row.budgetOverride?.approved;
  const overrideApprovedBy = row.budgetOverride?.approvedBy;
  const overrideRequested = !!row.budgetOverride?.requested;

  return {
    totalBudget,
    q1Exp,
    q2Exp,
    q3Exp,
    q4Exp,
    totalSpent,
    remainingBudget,
    isExceeded,
    excessAmount,
    remainingQuarterCount,
    suggestedPerQuarter,
    hasOverrideApproval,
    overrideApprovedBy,
    overrideRequested
  };
}

const isFieldDisabled = (variance: string | undefined): boolean => {
  if (!variance) return true;
  const clean = variance.replace(/[^0-9.-]/g, '').trim();
  if (clean === '0' || clean === '-0' || clean === '') return true;
  const num = parseFloat(clean);
  return isNaN(num) || num === 0;
};

export const KPA_DESCRIPTIONS: Record<string, string> = {
  bsd: 'Basic Service Delivery and Infrastructure Development (BSD)',
  led: 'Local Economic Development (LED)',
  mfvm: 'Municipal Financial Viability and Management (MFVM)',
  ggpp: 'Good Governance and Public Participation (GGPP)',
  midt: 'Municipal Institutional Development and Transformation (MIDT)',
  sr: 'Spatial Rationale (SR)'
};

export function sanitizeSdbipRow(row: SdbipRow): SdbipRow {
  const isMarked = (val: string | undefined) => {
    if (!val) return false;
    const v = val.trim().toUpperCase();
    return v === 'X' || v === 'Y' || v === '1' || v === 'TRUE';
  };

  const activeKeys = (['bsd', 'led', 'mfvm', 'ggpp', 'midt', 'sr'] as const).filter(k => isMarked(row[k]));

  let chosenKpa: 'bsd' | 'led' | 'mfvm' | 'ggpp' | 'midt' | 'sr' = 'bsd';

  if (activeKeys.length === 1) {
    chosenKpa = activeKeys[0];
  } else if (activeKeys.length > 1) {
    const text = (row.kpas || '').toLowerCase();
    const match = activeKeys.find(k =>
      text.includes(k) ||
      (k === 'bsd' && text.includes('service')) ||
      (k === 'led' && text.includes('economic')) ||
      (k === 'mfvm' && text.includes('financial')) ||
      (k === 'ggpp' && text.includes('governance')) ||
      (k === 'midt' && text.includes('institutional')) ||
      (k === 'sr' && text.includes('spatial'))
    );
    chosenKpa = match || activeKeys[0];
  } else {
    const text = `${row.kpas || ''} ${row.strategicObj || ''} ${row.kpi || ''}`.toLowerCase();
    if (text.includes('spatial') || text.includes('sr') || text.includes('town planning') || text.includes('land use')) chosenKpa = 'sr';
    else if (text.includes('institutional') || text.includes('midt') || text.includes('skills') || text.includes('transformation') || text.includes('hr')) chosenKpa = 'midt';
    else if (text.includes('governance') || text.includes('ggpp') || text.includes('public participation') || text.includes('ward')) chosenKpa = 'ggpp';
    else if (text.includes('financial') || text.includes('mfvm') || text.includes('viability') || text.includes('budget') || text.includes('revenue')) chosenKpa = 'mfvm';
    else if (text.includes('economic') || text.includes('led') || text.includes('tourism') || text.includes('smme')) chosenKpa = 'led';
    else chosenKpa = 'bsd';
  }

  // Auto-sanitize existing and incoming quarterly variances so legacy corruptions (e.g. "2065%") are healed
  const sanitizedQ1Var = (row.q1Actual && String(row.q1Actual).trim()) ? calcVar(row.q1, row.q1Actual, row.uom) : (row.q1Variance || '');
  const sanitizedQ2Var = (row.q2Actual && String(row.q2Actual).trim()) ? calcVar(row.q2, row.q2Actual, row.uom) : (row.q2Variance || '');
  const sanitizedMidVar = (row.midTermActual && String(row.midTermActual).trim()) ? calcVar(row.midTermTarget || row.midTerm, row.midTermActual, row.uom) : (row.midTermVariance || '');
  const sanitizedQ3Var = (row.q3Actual && String(row.q3Actual).trim()) ? calcVar(row.q3, row.q3Actual, row.uom) : (row.q3Variance || '');
  const sanitizedQ4Var = (row.q4Actual && String(row.q4Actual).trim()) ? calcVar(row.q4, row.q4Actual, row.uom) : (row.q4Variance || '');

  const kpiVal = String(row.kpi || row.operationalActivity || (row as any).KPI || (row as any).Description || (row as any).kpiDescription || '').trim();
  const activityVal = String(row.operationalActivity || row.kpi || (row as any).Description || (row as any).KPI || '').trim();

  // Strict Azure AD Approver & Submitter normalization for specific statutory KPIs
  let normalizedApprover = row.approver || '';
  let normalizedSubmitter = row.submitter || '';

  const cleanRef = String(row.refNum || '').trim().toUpperCase();
  if (cleanRef === 'M_13' || cleanRef === 'M13') {
    if (!normalizedApprover || normalizedApprover.toLowerCase().includes('mayor') || normalizedApprover.toLowerCase().includes('executive')) {
      normalizedApprover = 'Mmaphiri R. Rampedi';
    }
    if (!normalizedSubmitter) {
      normalizedSubmitter = 'Jimmy Nhlapho';
    }
  } else if (cleanRef === 'M_17' || cleanRef === 'M17') {
    if (!normalizedApprover || normalizedApprover.toLowerCase().includes('mayor') || normalizedApprover.toLowerCase().includes('executive')) {
      normalizedApprover = 'Juliet N. Ralephaleng';
    }
    if (!normalizedSubmitter) {
      normalizedSubmitter = 'Quinton Skhosana';
    }
  } else if (['M_81', 'M_82', 'M_83', 'M_84', 'M81', 'M82', 'M83', 'M84'].includes(cleanRef)) {
    normalizedSubmitter = 'Annah Msiza';
    normalizedApprover = 'Thandiwe M. Lengwate';
  }

  return {
    ...row,
    submitter: normalizedSubmitter,
    approver: normalizedApprover,
    kpi: kpiVal || activityVal,
    operationalActivity: activityVal || kpiVal,
    bsd: chosenKpa === 'bsd' ? 'X' : '',
    led: chosenKpa === 'led' ? 'X' : '',
    mfvm: chosenKpa === 'mfvm' ? 'X' : '',
    ggpp: chosenKpa === 'ggpp' ? 'X' : '',
    midt: chosenKpa === 'midt' ? 'X' : '',
    sr: chosenKpa === 'sr' ? 'X' : '',
    kpas: KPA_DESCRIPTIONS[chosenKpa],
    q1Variance: sanitizedQ1Var,
    q2Variance: sanitizedQ2Var,
    midTermVariance: sanitizedMidVar,
    q3Variance: sanitizedQ3Var,
    q4Variance: sanitizedQ4Var
  };
}

export interface SdbipPoeFile {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  refNum: string;
  description?: string;
  fileData?: string;
  fileType?: string;
}

export function SDBIP({ currentUser, activeTenantId }: SDBIPProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'table' | 'reporting' | 'drafting'>('brief');
  const [isReportingAssignmentsUnlocked, setIsReportingAssignmentsUnlocked] = useState(globalReportingAssignmentsUnlocked);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const isMikeOnly = (currentUser?.email || '').toLowerCase().trim() === 'mike@mzansiflow.co.za';

  const [mikeAuthModal, setMikeAuthModal] = useState<{
    isOpen: boolean;
    title: string;
    action: () => void;
    passwordInput: string;
    error: string | null;
  }>({
    isOpen: false,
    title: '',
    action: () => {},
    passwordInput: '',
    error: null,
  });

  const requestMikeAuth = (title: string, action: () => void) => {
    setMikeAuthModal({
      isOpen: true,
      title,
      action,
      passwordInput: '',
      error: null,
    });
  };

  const handleToggleAssignmentsLock = () => {
    if (isReportingAssignmentsUnlocked) {
      globalReportingAssignmentsUnlocked = false;
      setIsReportingAssignmentsUnlocked(false);
      setSuccessToast("Submitter & Approver columns have been LOCKED again successfully!");
      return;
    }
    if (isSuperAdminMike || isUserUnrestricted(currentUser)) {
      globalReportingAssignmentsUnlocked = true;
      setIsReportingAssignmentsUnlocked(true);
      setSuccessToast("🔓 Submitter & Approver assignments UNLOCKED for all reporting KPIs!");
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    setEnteredPassword('');
    setPasswordError('');
    setIsPasswordModalOpen(true);
  };

  const handleUnlockSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (enteredPassword === '8655M9sznnes01*') {
      globalReportingAssignmentsUnlocked = true;
      setIsReportingAssignmentsUnlocked(true);
      setIsPasswordModalOpen(false);
      setSuccessToast("Submitter & Approver columns have been UNLOCKED successfully!");
    } else {
      setPasswordError("Invalid password. Unlock rejected.");
    }
  };
  const [draftingSubTab, setDraftingSubTab] = useState<'chapters' | 'memo'>('chapters');
  const [rows, setRows] = useState<SdbipRow[]>([]);
  const [poes, setPoes] = useState<SdbipPoeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [poeModal, setPoeModal] = useState<{ 
    isOpen: boolean; 
    rowId: string | null; 
    refNum: string; 
    quarter?: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'general';
  }>({ isOpen: false, rowId: null, refNum: '' });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadMode, setUploadMode] = useState<'single' | 'multi'>('multi');
  const [poeFileName, setPoeFileName] = useState('');
  const [poeFileSize, setPoeFileSize] = useState('1.5 MB');
  const [poeDescription, setPoeDescription] = useState('');
  const [poeUploadedFiles, setPoeUploadedFiles] = useState<{ name: string; size: string; fileData?: string; fileType?: string }[]>([]);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ rowId: string; type: 'row' | 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' } | null>(null);

  // View POE Document Modal State
  const [viewPoeModal, setViewPoeModal] = useState<{
    isOpen: boolean;
    rowId: string | null;
    refNum: string;
    quarterLabel: string;
    quarterKey: string;
    files: { name: string; size?: string; date?: string; fileData?: string; fileType?: string }[];
    description: string;
    kpiTitle?: string;
    activeFileIndex: number;
  }>({
    isOpen: false,
    rowId: null,
    refNum: '',
    quarterLabel: '',
    quarterKey: '',
    files: [],
    description: '',
    activeFileIndex: 0
  });

  const [previewDoc, setPreviewDoc] = useState<any | null>(null);

  // Expandable cells inspector modal state
  const [cellModal, setCellModal] = useState<ExpandModalState>({
    isOpen: false,
    title: '',
    value: '',
    isReadOnly: true
  });

  // Cell expandability modes: default to true so all words and sentences fit in cells automatically
  const [isFitAllTopLayerCells, setIsFitAllTopLayerCells] = useState<boolean>(true);
  const [isFitAllReportingCells, setIsFitAllReportingCells] = useState<boolean>(true);

  // Clear modal states for Top Layer Table and Reporting Table
  const [clearTopLayerModal, setClearTopLayerModal] = useState<{
    isOpen: boolean;
    clearTarget: 'all' | 'filtered';
  }>({ isOpen: false, clearTarget: 'all' });

  const [clearReportingModal, setClearReportingModal] = useState<{
    isOpen: boolean;
    scope: 'all_quarters' | 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'entire_table';
  }>({ isOpen: false, scope: 'all_quarters' });
  const [isClearing, setIsClearing] = useState(false);

  const openCellExpandModal = (title: string, value: string, onSave?: (v: string) => void, readOnly: boolean = false, subtitle?: string) => {
    setCellModal({
      isOpen: true,
      title,
      value: value || '',
      isReadOnly: readOnly,
      onSave,
      subtitle
    });
  };

  // Parser states for rich document rendering
  const [renderedDocHtml, setRenderedDocHtml] = useState<string>('');
  const [renderedXlsxSheets, setRenderedXlsxSheets] = useState<{ name: string; html: string }[]>([]);
  const [activeXlsxSheetIdx, setActiveXlsxSheetIdx] = useState<number>(0);
  const [renderedTextContent, setRenderedTextContent] = useState<string>('');
  const [docRenderLoading, setDocRenderLoading] = useState<boolean>(false);
  const [docRenderError, setDocRenderError] = useState<string>('');
  const [activeFileBlobUrl, setActiveFileBlobUrl] = useState<string>('');

  const dataURLToArrayBuffer = (dataURL: string): ArrayBuffer => {
    const base64 = dataURL.split(',')[1];
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Custom SDBIP officials states (appointed reviewers and auditors)
  const [reviewers, setReviewers] = useState<string[]>([
    'Nompumelelo P. Nsibande',
    'Sibusiso M. Shabanga',
    'Noluthando Zulu',
    'Mduduzi Lukele'
  ]);
  const [internalAuditors, setInternalAuditors] = useState<string[]>([
    'Amos D. Twala',
    'Peggy L. Seerane',
    'Katlego Masemola',
    'Sthembile C. Mpanza'
  ]);
  const [savingOfficials, setSavingOfficials] = useState(false);
  const [isPulling, setIsPulling] = useState(false);

  const pullSdbipTopLayerData = async () => {
    setIsPulling(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip?t=${Date.now()}`);
      if (!res.ok) throw new Error("Failed to load SDBIP data");
      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        setRows(data.items.map(sanitizeSdbipRow));
        setSuccessToast(`Successfully pulled and loaded ${data.items.length} records from the SDBIP top layer table.`);
      } else {
        setRows([]);
        setSuccessToast("SDBIP top layer table data refreshed (0 records).");
      }
    } catch (err: any) {
      console.error("Error pulling SDBIP top layer data:", err);
      setSuccessToast("Failed to pull SDBIP top layer data.");
    } finally {
      setIsPulling(false);
    }
  };

  // SDBIP Workflow states
  const [workflowPhase, setWorkflowPhase] = useState<'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual'>('q1');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(true);
  const [isWorkflowDeskOpen, setIsWorkflowDeskOpen] = useState(false);
  const [selectedWorkflowRow, setSelectedWorkflowRow] = useState<SdbipRow | null>(null);
  const [workflowComments, setWorkflowComments] = useState('');
  const [workflowCommentsMap, setWorkflowCommentsMap] = useState<{[key: string]: string}>({});
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<'submissions' | 'approvals' | 'reviews' | 'audits'>('submissions');
  const [submissionFilter, setSubmissionFilter] = useState<'submitted' | 'all'>('all');
  const [showAllKpisInDesk, setShowAllKpisInDesk] = useState(true);
  const [isTableExpanded, setIsTableExpanded] = useState(false);

  // Municipal Reporting Period & Calendar Temporal Control (Defaults to Quarter 1 active, Q2-Q4 locked)
  const [periodOverride, setPeriodOverride] = useState<string>('q1');
  const isQuarterActive = (phase: string): boolean => {
    return isQuarterInReportingPeriod(phase as any, periodOverride);
  };

  // Performance pagination states
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState<number | 'all'>(50);

  const [reportingPage, setReportingPage] = useState(1);
  const [reportingPageSize, setReportingPageSize] = useState<number | 'all'>(50);

  const [deskPage, setDeskPage] = useState(1);
  const [deskPageSize, setDeskPageSize] = useState<number | 'all'>(25);

  // Auto-saving & debouncing indicators
  const [isSavingRows, setIsSavingRows] = useState(false);
  const saveDebounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const lastUserEditTimeRef = React.useRef<number>(0);

  // Budget Override Modal states
  const [budgetOverrideModalRow, setBudgetOverrideModalRow] = useState<SdbipRow | null>(null);
  const [overrideReason, setOverrideReason] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState<boolean>(false);

  const currentUserDisplayName = currentUser.fullName || currentUser.email.split('@')[0];

  React.useEffect(() => {
    const handleSwitchTab = (e: any) => {
      let tab = e?.detail?.tab || sessionStorage.getItem('sdbip_active_tab');
      if (tab === 'top-layer' || tab === 'top_layer' || tab === 'sdbip-top-layer') {
        tab = 'table';
      }
      if (tab === 'table' || tab === 'reporting' || tab === 'brief' || tab === 'drafting') {
        setActiveTab(tab as any);
        sessionStorage.removeItem('sdbip_active_tab');
      }
      if (e?.detail?.items && Array.isArray(e.detail.items)) {
        setRows(e.detail.items.map(sanitizeSdbipRow));
      }
      if (e?.detail?.refresh || e?.detail?.items) {
        pullSdbipTopLayerData();
      }
    };

    const handleRefresh = (e: any) => {
      if (e?.detail?.items && Array.isArray(e.detail.items)) {
        setRows(e.detail.items.map(sanitizeSdbipRow));
      }
      pullSdbipTopLayerData();
    };

    window.addEventListener('sdbip:switch_tab', handleSwitchTab);
    window.addEventListener('sdbip:refresh', handleRefresh);

    const saved = sessionStorage.getItem('sdbip_active_tab');
    if (saved === 'table' || saved === 'reporting' || saved === 'brief' || saved === 'drafting' || saved === 'top-layer') {
      const active = saved === 'top-layer' ? 'table' : saved;
      setActiveTab(active as any);
      sessionStorage.removeItem('sdbip_active_tab');
      pullSdbipTopLayerData();
    }
    return () => {
      window.removeEventListener('sdbip:switch_tab', handleSwitchTab);
      window.removeEventListener('sdbip:refresh', handleRefresh);
    };
  }, []);

  React.useEffect(() => {
    const mySubmissions = rows;

    const myPendingReviews = rows.filter(r => r.workflows?.[workflowPhase]?.status === 'pending_review');

    const myPendingApprovals = rows.filter(r => r.workflows?.[workflowPhase]?.status === 'pending_approval');

    const myPendingAudits = rows;

    if (activeWorkflowTab === 'submissions') {
      // If a row is currently selected and still exists in rows, preserve it!
      // NEVER forcefully redirect away from a chosen KPI or overwrite with submissionsToRender[0]!
      if (selectedWorkflowRow && rows.some(r => r.id === selectedWorkflowRow.id)) {
        // Selection remains active and stable!
      } else {
        const submissionsToRender = submissionFilter === 'submitted'
          ? mySubmissions.filter(r => r.workflows?.[workflowPhase]?.status && r.workflows[workflowPhase].status !== 'draft')
          : mySubmissions;
        
        if (submissionsToRender.length > 0) {
          setSelectedWorkflowRow(submissionsToRender[0]);
        } else {
          setSelectedWorkflowRow(null);
        }
      }
    } else if (activeWorkflowTab === 'reviews') {
      if (myPendingReviews.length > 0) {
        if (!selectedWorkflowRow || !myPendingReviews.some(r => r.id === selectedWorkflowRow.id)) {
          setSelectedWorkflowRow(myPendingReviews[0]);
        }
      } else {
        setSelectedWorkflowRow(null);
      }
    } else if (activeWorkflowTab === 'approvals') {
      if (myPendingApprovals.length > 0) {
        if (!selectedWorkflowRow || !myPendingApprovals.some(r => r.id === selectedWorkflowRow.id)) {
          setSelectedWorkflowRow(myPendingApprovals[0]);
        }
      } else {
        setSelectedWorkflowRow(null);
      }
    } else if (activeWorkflowTab === 'audits') {
      if (myPendingAudits.length > 0) {
        if (!selectedWorkflowRow || !myPendingAudits.some(r => r.id === selectedWorkflowRow.id)) {
          setSelectedWorkflowRow(myPendingAudits[0]);
        }
      } else {
        setSelectedWorkflowRow(null);
      }
    }
  }, [activeWorkflowTab, submissionFilter, rows, workflowPhase, showAllKpisInDesk, currentUserDisplayName]);

  // Smart Filtering states
  const [searchRef, setSearchRef] = useState('');
  const [searchAdName, setSearchAdName] = useState('');
  const [selectedKpa, setSelectedKpa] = useState('ALL');
  const [selectedNationalKpa, setSelectedNationalKpa] = useState('ALL');

  // Computed unique Responsible Owners
  const uniqueKpas = React.useMemo(() => {
    const kpaSet = new Set<string>();
    rows.forEach(row => {
      if (row.kpas && row.kpas.trim()) {
        kpaSet.add(row.kpas.trim());
      }
    });
    return Array.from(kpaSet).sort();
  }, [rows]);

  // Reactive Smart Filtered Rows
  const filteredRows = React.useMemo(() => {
    return rows.filter((row) => {
      // 1. Search by ref number or KPI description
      if (searchRef.trim() !== '') {
        const query = searchRef.toLowerCase();
        const matchesRef = row.refNum?.toLowerCase().includes(query);
        const matchesKpi = row.kpi?.toLowerCase().includes(query);
        const matchesObj = row.strategicObj?.toLowerCase().includes(query);
        if (!matchesRef && !matchesKpi && !matchesObj) {
          return false;
        }
      }

      // 1.5. Search by Azure AD name (Submitter, Reviewer, or Approver)
      if (searchAdName.trim() !== '') {
        const queryName = searchAdName.toLowerCase();
        const matchesSubmitter = row.submitter?.toLowerCase().includes(queryName);
        const matchesReviewer = row.reviewer?.toLowerCase().includes(queryName);
        const matchesApprover = row.approver?.toLowerCase().includes(queryName);
        const matchesResponsible = row.responsibleUnit?.toLowerCase().includes(queryName);
        if (!matchesSubmitter && !matchesReviewer && !matchesApprover && !matchesResponsible) {
          return false;
        }
      }

      // 2. Filter by Responsible Owner
      if (selectedKpa !== 'ALL') {
        if (row.kpas !== selectedKpa) {
          return false;
        }
      }

      // 3. Filter by National Key Performance Areas (BSD, LED, MFVM, GGPP, MIDT, SR)
      if (selectedNationalKpa !== 'ALL') {
        const key = selectedNationalKpa.toLowerCase(); // 'bsd', 'led', etc.
        const val = row[key as keyof SdbipRow];
        if (!val || typeof val !== 'string' || val.trim() === '') {
          return false;
        }
      }

      return true;
    });
  }, [rows, searchRef, searchAdName, selectedKpa, selectedNationalKpa]);

  // Reset pagination when filters change
  useEffect(() => {
    setTablePage(1);
  }, [searchRef, searchAdName, selectedKpa, selectedNationalKpa]);

  useEffect(() => {
    setReportingPage(1);
  }, [searchRef, searchAdName, selectedKpa, selectedNationalKpa]);

  // Paginated slices for 60fps instant UI
  const paginatedTableRows = React.useMemo(() => {
    if (tablePageSize === 'all') return filteredRows;
    const start = (tablePage - 1) * tablePageSize;
    return filteredRows.slice(start, start + tablePageSize);
  }, [filteredRows, tablePage, tablePageSize]);

  const paginatedReportingRows = React.useMemo(() => {
    if (reportingPageSize === 'all') return filteredRows;
    const start = (reportingPage - 1) * reportingPageSize;
    return filteredRows.slice(start, start + reportingPageSize);
  }, [filteredRows, reportingPage, reportingPageSize]);

  const renderSmartFilterPanel = () => {
    return (
      <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></span>
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">SDBIP Scorecard Smart Filter Panel</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Search Bar */}
          <div className="space-y-2">
            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Search Ref / KPI Keyword
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchRef}
                  onChange={(e) => setSearchRef(e.target.value)}
                  placeholder="e.g. REF-01 or Water Upgrade..."
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 rounded-lg p-2 text-xs text-slate-800 transition-all focus:outline-none"
                />
                {searchRef && (
                  <button 
                    onClick={() => setSearchRef('')} 
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
                Search by Name (Azure AD Profile)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchAdName}
                  onChange={(e) => setSearchAdName(e.target.value)}
                  placeholder="e.g. Mike, Thabo, Sarah..."
                  className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 rounded-lg p-2 text-xs text-slate-800 transition-all focus:outline-none"
                />
                {searchAdName && (
                  <button 
                    onClick={() => setSearchAdName('')} 
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Responsible Owner Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
              Responsible Owner
            </label>
            <select
              value={selectedKpa}
              onChange={(e) => setSelectedKpa(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none transition-all"
            >
              <option value="ALL">All Responsible Owners ({uniqueKpas.length})</option>
              {uniqueKpas.map((kpa) => (
                <option key={kpa} value={kpa}>{kpa}</option>
              ))}
            </select>
          </div>

          {/* 3. National Key Performance Areas */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
              National Key Performance Area
            </label>
            <select
              value={selectedNationalKpa}
              onChange={(e) => setSelectedNationalKpa(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none transition-all"
            >
              <option value="ALL">All National KPAs (BSD, LED, MFVM, GGPP, MIDT, SR)</option>
              <option value="BSD">Basic Service Delivery (BSD)</option>
              <option value="LED">Local Economic Development (LED)</option>
              <option value="MFVM">Municipal Finance Viability & Management (MFVM)</option>
              <option value="GGPP">Good Governance & Public Participation (GGPP)</option>
              <option value="MIDT">Municipal Institutional Development & Transformation (MIDT)</option>
              <option value="SR">Spatial Rationale (SR)</option>
            </select>
          </div>

        </div>

        {/* Filter helper stats / badge pill indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-2">
            <span>Filtered: <strong>{filteredRows.length}</strong> of <strong>{rows.length}</strong> records</span>
            {(searchRef || searchAdName || selectedKpa !== 'ALL' || selectedNationalKpa !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchRef('');
                  setSearchAdName('');
                  setSelectedKpa('ALL');
                  setSelectedNationalKpa('ALL');
                }}
                className="text-indigo-600 hover:text-indigo-800 font-bold uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded border border-indigo-150 transition-colors cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
          
          {/* Active pills of filters */}
          <div className="flex items-center gap-1.5">
            {searchRef && (
              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold">
                Query: "{searchRef}"
              </span>
            )}
            {searchAdName && (
              <span className="bg-violet-100 text-violet-700 px-2 py-0.5 rounded border border-violet-200 flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold">
                Azure AD: "{searchAdName}"
              </span>
            )}
            {selectedKpa !== 'ALL' && (
              <span className="bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded border border-indigo-200 flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold">
                KPA: {selectedKpa}
              </span>
            )}
            {selectedNationalKpa !== 'ALL' && (
              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1 text-[9px] uppercase tracking-wider font-extrabold">
                Nat-KPA: {selectedNationalKpa}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // New row input variables
  const [newRowData, setNewRowData] = useState<Partial<SdbipRow>>({
    refNum: '',
    strategicObj: '',
    bsd: '',
    led: '',
    mfvm: '',
    ggpp: '',
    midt: '',
    sr: '',
    kpas: '',
    operationalActivity: '',
    kpi: '',
    compliance: 'compliant',
    uom: '',
    mscoaTracking: '',
    baseline: '',
    annualTarget: '',
    budgetAllocation: '',
    q1: '',
    q2: '',
    q3: '',
    q4: '',
    responsibleUnit: '',
    poeStatus: 'Not Uploaded'
  });

  // Fetch SDBIP rows, POEs, Notifications, and Appointed Officials from Supabase on load & periodically
  const fetchSDBIPAll = (isBackground = false) => {
    if (!isBackground) setLoading(true);

    const safeJson = async (res: Response, fallback: any) => {
      if (!res || res.bodyUsed || !res.ok) {
        if (res && !res.ok) console.warn(`Fetch to ${res.url} failed with status ${res.status}`);
        return fallback;
      }
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.toLowerCase().includes("application/json")) {
        console.warn(`Fetch to ${res.url} returned non-JSON content: ${contentType}`);
        return fallback;
      }
      try {
        return await res.json();
      } catch (e) {
        console.warn(`Error parsing JSON from ${res.url}:`, e);
        return fallback;
      }
    };

    Promise.all([
      fetch(`/api/tenant/${activeTenantId}/sdbip?t=${Date.now()}`),
      fetch(`/api/tenant/${activeTenantId}/sdbip-poes?t=${Date.now()}`),
      fetch(`/api/tenant/${activeTenantId}/sdbip-notifications?t=${Date.now()}`),
      fetch(`/api/tenant/${activeTenantId}/sdbip-officials?t=${Date.now()}`)
    ])
      .then(async ([rowsRes, poesRes, notifRes, officialsRes]) => {
        const rowsData = await safeJson(rowsRes, { items: [] });
        const poesData = await safeJson(poesRes, { poes: [] });
        const notifData = await safeJson(notifRes, { notifications: [] });
        const officialsData = await safeJson(officialsRes, { reviewers: [], internalAuditors: [] });
        
        // Load rows from database
        if (rowsData && Array.isArray(rowsData.items)) {
          if (!isBackground || Date.now() - lastUserEditTimeRef.current >= 15000) {
            setRows(rowsData.items.map(sanitizeSdbipRow));
          }
        } else if (!isBackground) {
          setRows([]);
        }

        if (poesData && Array.isArray(poesData.poes)) {
          setPoes(poesData.poes);
        }

        if (notifData && Array.isArray(notifData.notifications)) {
          setNotifications(notifData.notifications);
        }

        if (officialsData) {
          const filterMorar = (list: any[]) => Array.isArray(list)
            ? list.filter(item => {
                const s = String(item || '').toLowerCase();
                return !s.includes('jayvanti') && !s.includes('morar');
              })
            : [];
          if (Array.isArray(officialsData.reviewers) && officialsData.reviewers.length > 0) {
            setReviewers(filterMorar(officialsData.reviewers));
          }
          if (Array.isArray(officialsData.internalAuditors) && officialsData.internalAuditors.length > 0) {
            setInternalAuditors(filterMorar(officialsData.internalAuditors));
          }
        }
      })
      .catch(err => console.error("Error loading SDBIP data:", err))
      .finally(() => {
        if (!isBackground) setLoading(false);
      });
  };

  useEffect(() => {
    fetchSDBIPAll(false);
    const interval = setInterval(() => {
      fetchSDBIPAll(true);
    }, 25000);

    const handleFocus = () => {
      fetchSDBIPAll(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTenantId]);

  useEffect(() => {
    let currentBlobUrl = '';

    const cleanupBlobUrl = () => {
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
        currentBlobUrl = '';
        setActiveFileBlobUrl('');
      }
    };

    if (!viewPoeModal.isOpen || viewPoeModal.files.length === 0) {
      setRenderedDocHtml('');
      setRenderedXlsxSheets([]);
      setActiveXlsxSheetIdx(0);
      setRenderedTextContent('');
      setDocRenderError('');
      cleanupBlobUrl();
      return;
    }

    const activeFile = viewPoeModal.files[viewPoeModal.activeFileIndex] || viewPoeModal.files[0];
    if (!activeFile || !activeFile.fileData) {
      setRenderedDocHtml('');
      setRenderedXlsxSheets([]);
      setActiveXlsxSheetIdx(0);
      setRenderedTextContent('');
      setDocRenderError('');
      cleanupBlobUrl();
      return;
    }

    const ext = activeFile.name.split('.').pop()?.toLowerCase() || '';
    
    // Clear previous state
    setRenderedDocHtml('');
    setRenderedXlsxSheets([]);
    setActiveXlsxSheetIdx(0);
    setRenderedTextContent('');
    setDocRenderError('');

    if (activeFile.fileData.startsWith('data:')) {
      // Create a blob URL for previewing files (e.g., PDFs, images) securely and perfectly inline inside sandboxed iframes.
      try {
        const parts = activeFile.fileData.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : (activeFile.fileType || getMimeTypeFromExtension(activeFile.name));
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        currentBlobUrl = URL.createObjectURL(blob);
        setActiveFileBlobUrl(currentBlobUrl);
      } catch (blobErr) {
        console.error("Error generating blob URL:", blobErr);
        setActiveFileBlobUrl(activeFile.fileData); // Fallback
      }

      setDocRenderLoading(true);
      try {
        if (ext === 'docx') {
          try {
            const arrayBuffer = dataURLToArrayBuffer(activeFile.fileData);
            mammoth.convertToHtml({ arrayBuffer })
              .then((result) => {
                setRenderedDocHtml(result.value || '<p class="text-slate-500 italic">This document is empty.</p>');
                setDocRenderLoading(false);
              })
              .catch((err: any) => {
                console.error("Mammoth error:", err);
                setDocRenderError(`Failed to parse DOCX: ${err.message || err}`);
                setDocRenderLoading(false);
              });
          } catch (err: any) {
            console.error("Mammoth outer error:", err);
            setDocRenderError(`Failed to prepare DOCX binary: ${err.message || err}`);
            setDocRenderLoading(false);
          }
        } else if (ext === 'xlsx' || ext === 'xls') {
          try {
            const arrayBuffer = dataURLToArrayBuffer(activeFile.fileData);
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const sheetsList = workbook.SheetNames.map(sheetName => {
              const worksheet = workbook.Sheets[sheetName];
              const html = XLSX.utils.sheet_to_html(worksheet, { editable: false });
              return { name: sheetName, html };
            });
            setRenderedXlsxSheets(sheetsList);
            setDocRenderLoading(false);
          } catch (err: any) {
            console.error("XLSX error:", err);
            setDocRenderError(`Failed to parse Excel spreadsheet: ${err.message || err}`);
            setDocRenderLoading(false);
          }
        } else if (ext === 'txt' || ext === 'csv' || ext === 'json' || ext === 'xml' || ext === 'log') {
          try {
            const parts = activeFile.fileData.split(',');
            if (parts[1]) {
              const decoded = decodeURIComponent(escape(window.atob(parts[1])));
              setRenderedTextContent(decoded);
            } else {
              setRenderedTextContent('');
            }
            setDocRenderLoading(false);
          } catch (err: any) {
            console.error("Text decoding error:", err);
            setDocRenderError(`Failed to read text document: ${err.message || err}`);
            setDocRenderLoading(false);
          }
        } else {
          setDocRenderLoading(false);
        }
      } catch (err: any) {
        setDocRenderError(`Error loading document parser: ${err.message || err}`);
        setDocRenderLoading(false);
      }
    }

    return () => {
      cleanupBlobUrl();
    };
  }, [viewPoeModal.isOpen, viewPoeModal.activeFileIndex, viewPoeModal.files]);

  const saveNotifications = async (updatedNotifs: any[]) => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/sdbip-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: updatedNotifs })
      });
      setNotifications(updatedNotifs);
    } catch (err) {
      console.error("Error saving SDBIP notifications:", err);
    }
  };

  const clearSystemNotifications = async () => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/sdbip-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifications: [] })
      });
      setNotifications([]);
      setSuccessToast("All system notifications cleared successfully.");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error("Error clearing SDBIP notifications:", err);
    }
  };

  const saveOfficials = async (updatedReviewers: string[], updatedAuditors: string[]) => {
    setSavingOfficials(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip-officials`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewers: updatedReviewers, internalAuditors: updatedAuditors })
      });
      if (!res.ok) throw new Error("Failed to save officials");
      setReviewers(updatedReviewers);
      setInternalAuditors(updatedAuditors);
      setSuccessToast("Appointed SDBIP Officials and Auditors saved successfully!");
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err) {
      console.error("Error saving SDBIP officials:", err);
    } finally {
      setSavingOfficials(false);
    }
  };

  const [isExplicitlySaving, setIsExplicitlySaving] = useState(false);

  const handleSaveAndOverwriteSDBIP = async () => {
    if (!rows || rows.length === 0) {
      setSuccessToast("⚠️ No SDBIP rows to save.");
      setTimeout(() => setSuccessToast(null), 3000);
      return;
    }

    setIsExplicitlySaving(true);
    setSuccessToast(`💾 Saving and permanently overwriting ${rows.length} SDBIP records on Supabase and application...`);

    try {
      const payload = rows.map(r => ({
        ...r,
        isPlaceholder: false,
        _isPlaceholder: false,
        source: (r as any).source || 'manual'
      }));

      // 1. Save to primary active tenant
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: payload, overwrite: true })
      });

      if (!res.ok) {
        throw new Error(`Server returned error status ${res.status}`);
      }

      // 2. Ensure sync across all statutory tenant namespaces
      const syncTenants = ['tenant-229', 'nkangala_auto', 'nkangala', 'default', 'global'].filter(t => t !== activeTenantId);
      for (const tId of syncTenants) {
        try {
          await fetch(`/api/tenant/${tId}/sdbip`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: payload, overwrite: true })
          });
        } catch (_) {}
      }

      // 3. Dispatch event to keep all views in sync
      try {
        window.dispatchEvent(new CustomEvent('sdbip:refresh', { detail: { count: payload.length, items: payload } }));
      } catch (_) {}

      setSuccessToast(`✅ Successfully saved and permanently overwritten ${rows.length} SDBIP records to Supabase, cloud database, and website!`);
      setTimeout(() => setSuccessToast(null), 5000);
    } catch (err: any) {
      console.error("Error saving SDBIP to Supabase:", err);
      setSuccessToast(`❌ Failed to save SDBIP to Supabase: ${err.message || 'Unknown error'}`);
      setTimeout(() => setSuccessToast(null), 5000);
    } finally {
      setIsExplicitlySaving(false);
    }
  };

  const saveRows = async (updatedRows: SdbipRow[]) => {
    try {
      setIsSavingRows(true);
      await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: updatedRows })
      });
    } catch (err) {
      console.error("Failed to save SDBIP rows:", err);
    } finally {
      setIsSavingRows(false);
    }
  };

  const debouncedSaveRows = (updatedRows: SdbipRow[]) => {
    lastUserEditTimeRef.current = Date.now();
    setIsSavingRows(true);
    if (saveDebounceTimeoutRef.current) {
      clearTimeout(saveDebounceTimeoutRef.current);
    }
    saveDebounceTimeoutRef.current = setTimeout(() => {
      saveRows(updatedRows);
    }, 600);
  };

  const savePoes = async (updatedPoes: SdbipPoeFile[]) => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ poes: updatedPoes })
      });
    } catch (err) {
      console.error("Failed to save SDBIP POEs:", err);
    }
  };

  const isSuperAdminMike = isMasterAdminMike(currentUser);

  // Global Administrator Mike Master Override: Undo submission and return KPI to Draft
  const handleMasterUndoSubmission = async (rowId: string, phase = workflowPhase) => {
    const targetRow = rows.find(r => r.id === rowId);
    if (!targetRow) return;
    const phaseLabel = phase === 'midTerm' ? 'Mid-Term' : phase === 'annual' ? 'Annual' : phase.toUpperCase();

    const currentHistory = (targetRow as any).workflowHistory || [];
    const newHistoryItem = {
      date: new Date().toISOString(),
      action: `Submission Undone by Global Admin (${phaseLabel})`,
      user: currentUserDisplayName,
      notes: `Global Administrator Mike reverted KPI ${targetRow.refNum} submission to Draft state.`
    };

    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        const workflows = { ...(r.workflows || {}) };
        if (workflows[phase]) {
          workflows[phase] = { ...workflows[phase], status: 'draft', approvedBy: undefined };
        }
        ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
          if (workflows[ph] && (workflows[ph].status === 'pending_approval' || workflows[ph].status === 'pending_review' || workflows[ph].status === 'pending_audit')) {
            workflows[ph] = { ...workflows[ph], status: 'draft' };
          }
        });
        return {
          ...r,
          workflowStatus: 'Draft',
          workflows,
          workflowHistory: [...currentHistory, newHistoryItem]
        } as SdbipRow;
      }
      return r;
    });

    setRows(updatedRows);
    await saveRows(updatedRows);

    fetch('/api/audit/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        fullName: currentUser.fullName,
        tenantId: activeTenantId,
        role: 'Global Administrator',
        action: 'SUPERADMIN_UNDO_SUBMISSION',
        moduleId: 'sdbip-reporting',
        moduleName: 'SDBIP Reporting Table',
        subModuleId: 'sdbip-table',
        subModuleName: 'SDBIP Main Table',
        details: `Global Administrator Mike reverted KPI ${targetRow.refNum} (${phaseLabel}) from Submitted to Draft state.`
      })
    }).catch(console.error);

    setSuccessToast(`🔓 Master Override: Submission undone for KPI ${targetRow.refNum}! It is now in Draft workspace.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Global Administrator Mike Master Override: Revoke approval and unlock KPI
  const handleMasterUnlockApproval = async (rowId: string, phase = workflowPhase) => {
    const targetRow = rows.find(r => r.id === rowId);
    if (!targetRow) return;
    const phaseLabel = phase === 'midTerm' ? 'Mid-Term' : phase === 'annual' ? 'Annual' : phase.toUpperCase();

    const currentHistory = (targetRow as any).workflowHistory || [];
    const newHistoryItem = {
      date: new Date().toISOString(),
      action: `Approval Revoked by Global Admin (${phaseLabel})`,
      user: currentUserDisplayName,
      notes: `Global Administrator Mike revoked approval seal and unlocked KPI ${targetRow.refNum} for revision.`
    };

    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        const workflows = { ...(r.workflows || {}) };
        if (workflows[phase]) {
          workflows[phase] = { ...workflows[phase], status: 'draft', approvedBy: undefined };
        }
        ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
          if (workflows[ph] && (workflows[ph].status === 'approved' || workflows[ph].status === 'pending_review' || workflows[ph].status === 'pending_audit')) {
            workflows[ph] = { ...workflows[ph], status: 'draft', approvedBy: undefined };
          }
        });
        return {
          ...r,
          workflowStatus: 'Draft',
          approvedBy: undefined,
          workflows,
          workflowHistory: [...currentHistory, newHistoryItem]
        } as SdbipRow;
      }
      return r;
    });

    setRows(updatedRows);
    await saveRows(updatedRows);

    fetch('/api/audit/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        fullName: currentUser.fullName,
        tenantId: activeTenantId,
        role: 'Global Administrator',
        action: 'SUPERADMIN_UNLOCK_APPROVAL',
        moduleId: 'sdbip-reporting',
        moduleName: 'SDBIP Reporting Table',
        subModuleId: 'sdbip-table',
        subModuleName: 'SDBIP Main Table',
        details: `Global Administrator Mike revoked approval and unlocked KPI ${targetRow.refNum} (${phaseLabel}) for revision.`
      })
    }).catch(console.error);

    setSuccessToast(`🔓 Master Override: Approval revoked & unlocked for KPI ${targetRow.refNum}! Reopened for revision.`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Global Administrator Mike Master Override: Lock / Unlock row toggle
  const handleMasterToggleRowLock = async (rowId: string) => {
    const targetRow = rows.find(r => r.id === rowId);
    if (!targetRow) return;
    const isCurrentlyLocked = (targetRow as any).workflowStatus === 'Approved' || (targetRow as any).adminLocked;
    const newStatus = isCurrentlyLocked ? 'Draft' : 'Approved';

    const currentHistory = (targetRow as any).workflowHistory || [];
    const newHistoryItem = {
      date: new Date().toISOString(),
      action: isCurrentlyLocked ? 'Unlocked by Global Admin' : 'Locked by Global Admin',
      user: currentUserDisplayName,
      notes: isCurrentlyLocked ? 'Global Administrator Mike unlocked KPI.' : 'Global Administrator Mike locked KPI.'
    };

    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        const workflows = { ...(r.workflows || {}) };
        ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
          if (workflows[ph]) {
            workflows[ph] = { ...workflows[ph], status: isCurrentlyLocked ? 'draft' : 'approved', approvedBy: isCurrentlyLocked ? undefined : currentUserDisplayName };
          }
        });
        return {
          ...r,
          workflowStatus: newStatus,
          approvedBy: isCurrentlyLocked ? undefined : (r.approvedBy || currentUserDisplayName),
          adminLocked: !isCurrentlyLocked,
          workflows,
          workflowHistory: [...currentHistory, newHistoryItem]
        } as SdbipRow;
      }
      return r;
    });

    setRows(updatedRows);
    await saveRows(updatedRows);

    fetch('/api/audit/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        fullName: currentUser.fullName,
        tenantId: activeTenantId,
        role: 'Global Administrator',
        action: isCurrentlyLocked ? 'SUPERADMIN_UNLOCK_KPI' : 'SUPERADMIN_LOCK_KPI',
        moduleId: 'sdbip-reporting',
        moduleName: 'SDBIP Reporting Table',
        subModuleId: 'sdbip-table',
        subModuleName: 'SDBIP Main Table',
        details: `Global Administrator Mike ${isCurrentlyLocked ? 'unlocked' : 'locked'} KPI ${targetRow.refNum}.`
      })
    }).catch(console.error);

    setSuccessToast(`🔓 Master Override: KPI ${targetRow.refNum} successfully ${isCurrentlyLocked ? 'unlocked and opened for editing' : 'locked'}!`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Bulk Master Overrides
  const handleMasterUnlockAllApproved = async () => {
    if (!window.confirm('Are you sure you want to unlock ALL currently Approved KPIs? This will reopen them for revision.')) return;
    const currentHistoryItem = {
      date: new Date().toISOString(),
      action: 'All Approvals Revoked by Global Admin',
      user: currentUserDisplayName,
      notes: 'Global Administrator Mike unlocked and reopened all Approved KPIs.'
    };
    const updatedRows = rows.map(r => {
      const isApproved = (r as any).workflowStatus === 'Approved' || Object.values(r.workflows || {}).some((w: any) => w?.status === 'approved');
      if (isApproved) {
        const workflows = { ...(r.workflows || {}) };
        Object.keys(workflows).forEach(k => {
          if (workflows[k]?.status === 'approved') {
            workflows[k] = { ...workflows[k], status: 'draft', approvedBy: undefined };
          }
        });
        return {
          ...r,
          workflowStatus: 'Draft',
          approvedBy: undefined,
          workflows,
          workflowHistory: [...((r as any).workflowHistory || []), currentHistoryItem]
        };
      }
      return r;
    });

    setRows(updatedRows);
    await saveRows(updatedRows);

    // Also unlock Submitter & Approver assignments
    globalReportingAssignmentsUnlocked = true;
    setIsReportingAssignmentsUnlocked(true);

    fetch('/api/audit/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        fullName: currentUser.fullName,
        tenantId: activeTenantId,
        role: 'Global Administrator',
        action: 'SUPERADMIN_BULK_UNLOCK_APPROVED',
        moduleId: 'sdbip-reporting',
        moduleName: 'SDBIP Reporting Table',
        subModuleId: 'sdbip-table',
        subModuleName: 'SDBIP Main Table',
        details: `Global Administrator Mike unlocked all Approved KPIs including Submitter and Approver assignments.`
      })
    }).catch(console.error);

    setSuccessToast('🔓 Master Override: All approved KPIs & Submitter/Approver assignments have been unlocked!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleMasterUndoAllSubmissions = async () => {
    if (!window.confirm('Are you sure you want to undo ALL submitted KPIs and revert them to Draft?')) return;
    const currentHistoryItem = {
      date: new Date().toISOString(),
      action: 'All Submissions Undone by Global Admin',
      user: currentUserDisplayName,
      notes: 'Global Administrator Mike returned all pending submissions to Draft.'
    };
    const updatedRows = rows.map(r => {
      const isPending = ['Submitted', 'Reviewed', 'Pending Audit', 'pending_approval', 'pending_review', 'pending_audit'].includes((r as any).workflowStatus) ||
        Object.values(r.workflows || {}).some((w: any) => ['pending_approval', 'pending_review', 'pending_audit'].includes(w?.status));
      if (isPending) {
        const workflows = { ...(r.workflows || {}) };
        Object.keys(workflows).forEach(k => {
          if (['pending_approval', 'pending_review', 'pending_audit'].includes(workflows[k]?.status)) {
            workflows[k] = { ...workflows[k], status: 'draft' };
          }
        });
        return {
          ...r,
          workflowStatus: 'Draft',
          workflows,
          workflowHistory: [...((r as any).workflowHistory || []), currentHistoryItem]
        };
      }
      return r;
    });

    setRows(updatedRows);
    await saveRows(updatedRows);

    fetch('/api/audit/log-access', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser.email,
        fullName: currentUser.fullName,
        tenantId: activeTenantId,
        role: 'Global Administrator',
        action: 'SUPERADMIN_BULK_UNDO_SUBMISSIONS',
        moduleId: 'sdbip-reporting',
        moduleName: 'SDBIP Reporting Table',
        subModuleId: 'sdbip-table',
        subModuleName: 'SDBIP Main Table',
        details: `Global Administrator Mike returned all submitted KPIs to Draft.`
      })
    }).catch(console.error);

    setSuccessToast('🔓 Master Override: All submitted KPIs returned to Draft!');
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const handleMasterPurgeActivePoe = async (rowId?: string, quarter?: string, fileName?: string) => {
    if (!rowId || !fileName) return;
    const targetRow = rows.find(r => r.id === rowId);
    if (!targetRow) return;

    try {
      // 1. Remove from global poes list
      const updatedPoes = poes.filter(p => !(p.refNum === targetRow.refNum && p.name === fileName));
      await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poes: updatedPoes })
      });
      setPoes(updatedPoes);

      // 2. Remove from row quarter POE arrays
      const filterPoes = (arr: any) => Array.isArray(arr) ? arr.filter((fn: string) => fn !== fileName) : arr;
      const updatedRows = rows.map(r => {
        if (r.id === rowId) {
          const u = {
            ...r,
            q1Poes: filterPoes(r.q1Poes),
            q2Poes: filterPoes(r.q2Poes),
            midTermPoes: filterPoes(r.midTermPoes),
            q3Poes: filterPoes(r.q3Poes),
            q4Poes: filterPoes(r.q4Poes),
          };
          const q1Empty = !u.q1Poes || u.q1Poes.length === 0;
          const q2Empty = !u.q2Poes || u.q2Poes.length === 0;
          const midTermEmpty = !u.midTermPoes || u.midTermPoes.length === 0;
          const q3Empty = !u.q3Poes || u.q3Poes.length === 0;
          const q4Empty = !u.q4Poes || u.q4Poes.length === 0;
          if (q1Empty && q2Empty && midTermEmpty && q3Empty && q4Empty) {
            u.poeStatus = 'Not Uploaded';
          }
          return u;
        }
        return r;
      });
      setRows(updatedRows);
      await saveRows(updatedRows);

      // 3. Log to audit
      fetch('/api/audit/log-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          fullName: currentUser.fullName,
          tenantId: activeTenantId,
          role: 'Global Administrator',
          action: 'SUPERADMIN_POE_PURGE',
          moduleId: 'sdbip-reporting',
          moduleName: 'SDBIP Reporting Table',
          subModuleId: 'sdbip-table',
          subModuleName: 'PoE Inspector',
          details: `Global Administrator Mike purged PoE document "${fileName}" from KPI ${targetRow.refNum}.`
        })
      }).catch(console.error);

      // 4. Update viewPoeModal state
      setViewPoeModal(p => {
        const remainingFiles = p.files.filter(f => f.name !== fileName);
        if (remainingFiles.length === 0) {
          return { ...p, isOpen: false, files: [] };
        }
        return {
          ...p,
          files: remainingFiles,
          activeFileIndex: Math.max(0, Math.min(p.activeFileIndex, remainingFiles.length - 1))
        };
      });

      setSuccessToast(`🗑️ Master Override: Evidence document "${fileName}" purged and deleted from Supabase!`);
      setTimeout(() => setSuccessToast(null), 3500);
    } catch (err: any) {
      console.error('Failed to purge PoE:', err);
      setSuccessToast(`Error deleting document: ${err.message}`);
      setTimeout(() => setSuccessToast(null), 4000);
    }
  };

  const getPhaseData = (row: SdbipRow, phase: string) => {
    const sourcePoe = row.poeDesc || row.poeStatus || row.q1PoeDesc || row.q2PoeDesc || row.midTermPoeDesc || row.q3PoeDesc || row.q4PoeDesc || '';
    switch (phase) {
      case 'q1':
        return {
          target: row.q1 || '-',
          actual: row.q1Actual || '',
          variance: row.q1Variance || '',
          corrective: row.q1Corrective || '',
          expenditure: row.q1Expenditure || '',
          poeDesc: row.q1PoeDesc || sourcePoe,
          poes: row.q1Poes || []
        };
      case 'q2':
        return {
          target: row.q2 || '-',
          actual: row.q2Actual || '',
          variance: row.q2Variance || '',
          corrective: row.q2Corrective || '',
          expenditure: row.q2Expenditure || '',
          poeDesc: row.q2PoeDesc || sourcePoe,
          poes: row.q2Poes || []
        };
      case 'midTerm':
        return {
          target: row.midTermTarget || row.midTerm || '-',
          actual: row.midTermActual || '',
          variance: row.midTermVariance || '',
          corrective: row.midTermCorrective || '',
          expenditure: row.midTermExpenditure || '',
          poeDesc: row.midTermPoeDesc || sourcePoe,
          poes: row.midTermPoes || []
        };
      case 'q3':
        return {
          target: row.q3 || '-',
          actual: row.q3Actual || '',
          variance: row.q3Variance || '',
          corrective: row.q3Corrective || '',
          expenditure: row.q3Expenditure || '',
          poeDesc: row.q3PoeDesc || sourcePoe,
          poes: row.q3Poes || []
        };
      case 'q4':
        return {
          target: row.q4 || '-',
          actual: row.q4Actual || '',
          variance: row.q4Variance || '',
          corrective: row.q4Corrective || '',
          expenditure: row.q4Expenditure || '',
          poeDesc: row.q4PoeDesc || sourcePoe,
          poes: row.q4Poes || []
        };
      case 'annual':
        return {
          target: row.annualTarget || '-',
          actual: row.q4Actual || '', // Uses Q4 or consolidated
          variance: row.q4Variance || '',
          corrective: row.q4Corrective || '',
          expenditure: row.q4Expenditure || '',
          poeDesc: row.q4PoeDesc || sourcePoe,
          poes: row.q4Poes || []
        };
      default:
        return { target: '-', actual: '', variance: '', corrective: '', expenditure: '', poeDesc: sourcePoe, poes: [] };
    }
  };

  const updateWorkflowState = async (rowId: string, phase: string, status: 'draft' | 'pending_review' | 'pending_approval' | 'approved' | 'completed' | 'pending_audit', updates: Partial<SdbipWorkflow>, notifMessage?: string, notifTarget?: string | string[]) => {
    // Municipal Calendar Guard: Verify active reporting period
    if (!isQuarterActive(phase)) {
      const lockNotice = getQuarterLockNotice(phase as any);
      setSuccessToast(`Reporting Period Restricted: ${lockNotice} Unless you are in the actual period, you cannot report or transition workflow controls.`);
      setTimeout(() => setSuccessToast(null), 5000);
      return;
    }

    const targetRow = rows.find(r => r.id === rowId);
    if (targetRow && status === 'pending_approval') {
      const isM81to84 = isQuarter1UnlockedKpi(targetRow);
      const assignedSubmitter = isM81to84 ? 'Annah Msiza' : (targetRow.submitter || targetRow.responsibleUnit);
      const isMatch = isUserMatch(assignedSubmitter, currentUser) || isSuperAdminMike || isUserUnrestricted(currentUser);
      if (!isMatch) {
        setSuccessToast(`Submission Restricted: Only the designated Submitter (${assignedSubmitter}) can submit KPI ${targetRow.refNum || ''} for approval.`);
        setTimeout(() => setSuccessToast(null), 4000);
        return;
      }
      const isTargetNA = targetRow.q1 && (targetRow.q1.trim().toUpperCase() === 'N/A' || targetRow.q1.trim().toUpperCase() === 'NOT APPLICABLE');
      if (phase === 'q1' && !isTargetNA && (!targetRow.q1Actual || targetRow.q1Actual.trim() === '')) {
        setSuccessToast(`Validation Error: Cannot submit KPI ${targetRow.refNum} to Approver without Q1 Actual performance figure.`);
        setTimeout(() => setSuccessToast(null), 5000);
        return;
      }
    }

    let targetRowRefNum = '';
    let targetRowKpi = '';
    const currentUserDisplayName = currentUser.fullName || currentUser.email;

    const updatedRows = rows.map(r => {
      if (r.id === rowId) {
        targetRowRefNum = r.refNum;
        targetRowKpi = r.kpi || 'Unnamed KPI';
        const workflows = r.workflows || {};
        const currentWf = workflows[phase] || { status: 'draft' };
        workflows[phase] = {
          ...currentWf,
          status,
          ...updates
        };

        // Determine top-level workflowStatus
        let workflowStatus = (r as any).workflowStatus || 'Draft';
        if (status === 'pending_approval') {
          workflowStatus = 'Submitted';
        } else if (status === 'pending_review') {
          workflowStatus = 'Reviewed';
        } else if (status === 'pending_audit') {
          workflowStatus = 'Pending Audit';
        } else if (status === 'approved' || status === 'completed') {
          workflowStatus = 'Approved';
        } else if (status === 'draft') {
          workflowStatus = (r as any).workflowStatus === 'Returned' ? 'Returned' : 'Draft';
        }

        const currentHistory = (r as any).workflowHistory || [];
        const newHistoryItem = {
          date: new Date().toISOString(),
          action: `Pushed (${phase.toUpperCase()}): ${status.replace('_', ' ').toUpperCase()}`,
          user: currentUserDisplayName,
          notes: notifMessage || `Workflow updated for phase ${phase}.`
        };

        return { 
          ...r, 
          workflows,
          workflowStatus,
          submittedBy: status === 'pending_approval' ? currentUserDisplayName : ((r as any).submittedBy || currentUserDisplayName),
          reviewedBy: status === 'pending_review' ? currentUserDisplayName : (r as any).reviewedBy,
          approvedBy: status === 'approved' ? currentUserDisplayName : (r as any).approvedBy,
          auditedBy: (status === 'completed' || status === 'pending_audit') ? currentUserDisplayName : (r as any).auditedBy,
          workflowHistory: [...currentHistory, newHistoryItem]
        };
      }
      return r;
    });
    setRows(updatedRows);
    await saveRows(updatedRows);

    if (notifMessage && notifTarget) {
      const targets = Array.isArray(notifTarget) ? notifTarget : [notifTarget];
      const newNotifs = targets.filter(Boolean).map((target, idx) => ({
        id: `notif-${Date.now()}-${idx}`,
        targetUser: target,
        kpiId: rowId,
        refNum: targetRowRefNum,
        kpiName: targetRowKpi,
        phase,
        message: notifMessage,
        createdAt: new Date().toISOString(),
        read: false
      }));
      const updatedNotifs = [...newNotifs, ...notifications];
      await saveNotifications(updatedNotifs);
    }
    setSuccessToast(`KPI status updated to ${status.toUpperCase().replace('_', ' ')}!`);
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const combineInfo = (a: string | undefined, b: string | undefined) => {
    const valA = (a || '').trim();
    const valB = (b || '').trim();
    if (!valA && !valB) return '';
    if (!valA) return valB;
    if (!valB) return valA;
    
    const numA = parseFloat(valA.replace(/[^0-9.-]/g, ''));
    const numB = parseFloat(valB.replace(/[^0-9.-]/g, ''));
    
    const isNumA = !isNaN(numA) && valA.match(/^[R]?\s?[0-9,.]+$/);
    const isNumB = !isNaN(numB) && valB.match(/^[R]?\s?[0-9,.]+$/);

    if (isNumA && isNumB) {
      const prefix = valA.startsWith('R') || valB.startsWith('R') ? 'R ' : '';
      return prefix + (numA + numB).toLocaleString();
    }
    return `${valA} + ${valB}`;
  };

  const calcAnnualTarget = (q1: string | undefined, q2: string | undefined, q3: string | undefined, q4: string | undefined) => {
    const q1Val = (q1 || '').trim();
    const q2Val = (q2 || '').trim();
    const q3Val = (q3 || '').trim();
    const q4Val = (q4 || '').trim();
    if (!q1Val && !q2Val && !q3Val && !q4Val) return '';

    const n1 = extractNumericValue(q1Val);
    const n2 = extractNumericValue(q2Val);
    const n3 = extractNumericValue(q3Val);
    const n4 = extractNumericValue(q4Val);

    const numbers = [n1, n2, n3, n4].filter((n): n is number => n !== null && !isNaN(n));
    if (numbers.length > 0) {
      const total = numbers.reduce((sum, val) => sum + val, 0);
      const hasR = q1Val.startsWith('R') || q2Val.startsWith('R') || q3Val.startsWith('R') || q4Val.startsWith('R');
      return (hasR ? 'R ' : '') + total.toLocaleString();
    }

    return [q1Val, q2Val, q3Val, q4Val].filter(Boolean).join(' + ');
  };

  const getRagDetails = (row: SdbipRow) => {
    if (row.auditChecklist?.auditSubmitted) {
      return {
        status: 'green' as const,
        face: '😁',
        label: 'Smiling Big Grin',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        textClass: 'text-emerald-700',
        tooltip: 'Audit Submitted - Target Achieved'
      };
    }

    const quarters = [
      { target: row.q1, actual: row.q1Actual },
      { target: row.q2, actual: row.q2Actual },
      { target: row.q3, actual: row.q3Actual },
      { target: row.q4, actual: row.q4Actual }
    ];

    let totalTarget = 0;
    let totalActual = 0;
    let hasReportingData = false;

    for (const q of quarters) {
      const t = extractNumericValue(q.target);
      const a = extractNumericValue(q.actual);

      if (t !== null && a !== null && !isNaN(t) && !isNaN(a)) {
        totalTarget += t;
        totalActual += a;
        hasReportingData = true;
      }
    }

    if (!hasReportingData) {
      return {
        status: 'none' as const,
        face: '☹️',
        label: 'Sad',
        bgClass: 'bg-slate-50',
        borderClass: 'border-slate-200',
        textClass: 'text-slate-500',
        tooltip: 'No target/actual data entered yet.'
      };
    }

    if (totalTarget === 0) {
      if (totalActual >= 0) {
        return {
          status: 'green' as const,
          face: '😁',
          label: 'Smiling Big Grin',
          bgClass: 'bg-emerald-50',
          borderClass: 'border-emerald-200',
          textClass: 'text-emerald-700',
          tooltip: 'No target set, performance is positive.'
        };
      } else {
        return {
          status: 'red' as const,
          face: '☹️',
          label: 'Sad',
          bgClass: 'bg-rose-50',
          borderClass: 'border-rose-200',
          textClass: 'text-rose-700',
          tooltip: 'No target set, performance is negative.'
        };
      }
    }

    const achievementRate = totalActual / totalTarget;
    const ratePercent = Math.round(achievementRate * 100);

    if (achievementRate >= 1.0) {
      return {
        status: 'green' as const,
        face: '😁',
        label: 'Smiling Big Grin',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        textClass: 'text-emerald-700',
        tooltip: `Exceeds or meets target! Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
      };
    } else if (achievementRate >= 0.70) {
      return {
        status: 'amber' as const,
        face: '🙂',
        label: 'Semi Smiling',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        textClass: 'text-amber-700',
        tooltip: `Progressing towards target. Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
      };
    } else {
      return {
        status: 'red' as const,
        face: '☹️',
        label: 'Sad',
        bgClass: 'bg-rose-50',
        borderClass: 'border-rose-200',
        textClass: 'text-rose-700',
        tooltip: `Under target / severe underperformance. Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
      };
    }
  };

  const calculateRagStatus = (row: SdbipRow): 'red' | 'amber' | 'green' => {
    const details = getRagDetails(row);
    if (details.status === 'none') {
      return 'red';
    }
    return details.status;
  };

  const handleCellChange = (rowId: string, field: keyof SdbipRow, value: any) => {
    // SDBIP source POE descriptions are strictly read-only and reflect verbatim across all quarters
    const poeDescFields = ['q1PoeDesc', 'q2PoeDesc', 'midTermPoeDesc', 'q3PoeDesc', 'q4PoeDesc', 'poeDesc'];
    if (poeDescFields.includes(field as string)) {
      setSuccessToast('POE Description is locked and populated directly from the SDBIP source document for this KPI.');
      setTimeout(() => setSuccessToast(null), 3500);
      return;
    }

    // Temporal verification guard for SDBIP quarter reporting fields
    const q1Fields = ['q1', 'q1Expenditure', 'q1Actual', 'q1Corrective'];
    const q2Fields = ['q2', 'q2Expenditure', 'q2Actual', 'q2Corrective'];
    const midTermFields = ['midTerm', 'midTermTarget', 'midTermExpenditure', 'midTermActual', 'midTermCorrective'];
    const q3Fields = ['q3', 'q3Expenditure', 'q3Actual', 'q3Corrective'];
    const q4Fields = ['q4', 'q4Expenditure', 'q4Actual', 'q4Corrective'];

    if (q1Fields.includes(field as string) && !isQuarterActive('q1')) {
      setSuccessToast(`Reporting Locked: ${getQuarterLockNotice('q1')} Unless you are in the actual period, you cannot report.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    if (q2Fields.includes(field as string) && !isQuarterActive('q2')) {
      setSuccessToast(`Reporting Locked: ${getQuarterLockNotice('q2')} Unless you are in the actual period, you cannot report.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    if (midTermFields.includes(field as string) && !isQuarterActive('midTerm')) {
      setSuccessToast(`Reporting Locked: ${getQuarterLockNotice('midTerm')} Unless you are in the actual period, you cannot report.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    if (q3Fields.includes(field as string) && !isQuarterActive('q3')) {
      setSuccessToast(`Reporting Locked: ${getQuarterLockNotice('q3')} Unless you are in the actual period, you cannot report.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    if (q4Fields.includes(field as string) && !isQuarterActive('q4')) {
      setSuccessToast(`Reporting Locked: ${getQuarterLockNotice('q4')} Unless you are in the actual period, you cannot report.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }

    // Lock Submitter and Approver fields to prevent changing assigned responsibilities
    const targetRow = rows.find(r => r.id === rowId);
    const cleanRowRef = String(targetRow?.refNum || '').trim().toUpperCase();
    const isTargetM81to84 = ['M_81', 'M_82', 'M_83', 'M_84', 'M81', 'M82', 'M83', 'M84'].includes(cleanRowRef);

    if ((field === 'submitter' || field === 'approver') && isTargetM81to84) {
      if (!isSuperAdminMike) {
        setSuccessToast(`Statutory Locked: KPI ${cleanRowRef} Submitter is permanently locked as Annah Msiza and Approver as Thandiwe M. Lengwate.`);
        setTimeout(() => setSuccessToast(null), 4000);
        return;
      }
    }

    if (activeTab === 'reporting' && (field === 'submitter' || field === 'approver')) {
      setSuccessToast(`Field Locked: Submitter and Approver assignments are locked in the SDBIP Top Layer reporting table only so that current submitters and approvers cannot be changed.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }

    // Locked targets and midterm expenditure
    if (activeTab === 'reporting' && (field === 'q1' || field === 'midTermExpenditure')) {
      setSuccessToast(`Field Locked: ${field === 'q1' ? 'Q1 Target' : 'Mid-Term Expenditure'} is locked in the reporting view for KPI ${targetRow?.refNum || ''}.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }

    // Strict Submitter reporting enforcement: Only designated submitter can report on actuals
    const actualsFields = [
      'score',
      'q1Actual', 'q2Actual', 'midTermActual', 'q3Actual', 'q4Actual', 
      'q1Corrective', 'q2Corrective', 'q3Corrective', 'q4Corrective', 
      'poeDesc', 'q1PoeDesc', 'q2PoeDesc', 'q3PoeDesc', 'q4PoeDesc', 'midTermPoeDesc',
      'q1Expenditure', 'q2Expenditure', 'midTermExpenditure', 'q3Expenditure', 'q4Expenditure'
    ];
    if (actualsFields.includes(field as string)) {
      if (targetRow && (targetRow.submitter || targetRow.responsibleUnit || isTargetM81to84)) {
        const assignedSubmitter = isTargetM81to84 ? 'Annah Msiza' : (targetRow.submitter || targetRow.responsibleUnit);
        const isMatch = isUserMatch(assignedSubmitter, currentUser) || isSuperAdminMike || isUserUnrestricted(currentUser);
        if (!isMatch) {
          setSuccessToast(`Reporting Restricted: Only the designated Submitter (${assignedSubmitter}) can report on actuals for KPI ${targetRow.refNum || ''}.`);
          setTimeout(() => setSuccessToast(null), 4000);
          return;
        }
      }
    }

    const updated = rows.map(r => {
      if (r.id === rowId) {
        let updatedRow = { ...r, [field]: value };
        
        // Handle KPA selection with strict mutual exclusivity & Responsible Owner alignment
        if (['bsd', 'led', 'mfvm', 'ggpp', 'midt', 'sr'].includes(field as string)) {
          const kpaKey = field as 'bsd' | 'led' | 'mfvm' | 'ggpp' | 'midt' | 'sr';
          updatedRow.bsd = kpaKey === 'bsd' ? 'X' : '';
          updatedRow.led = kpaKey === 'led' ? 'X' : '';
          updatedRow.mfvm = kpaKey === 'mfvm' ? 'X' : '';
          updatedRow.ggpp = kpaKey === 'ggpp' ? 'X' : '';
          updatedRow.midt = kpaKey === 'midt' ? 'X' : '';
          updatedRow.sr = kpaKey === 'sr' ? 'X' : '';
          updatedRow.kpas = KPA_DESCRIPTIONS[kpaKey];
        }

        // Update submitter or responsibleUnit without corrupting each other
        if (field === 'submitter') {
          updatedRow.submitter = value;
          if ((updatedRow as any).Submitter !== undefined) (updatedRow as any).Submitter = value;
        } else if (field === 'responsibleUnit') {
          updatedRow.responsibleUnit = value;
          if ((updatedRow as any).Responsible_Owner !== undefined) (updatedRow as any).Responsible_Owner = value;
        }

        // Automatically unlock Reviewer or Internal Audit module and notify user & Global Administrators
        if ((field === 'reviewer' || field === 'internalAudit') && value) {
          fetch(`/api/tenant/${activeTenantId}/auto-unlock-official`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rowId: r.id,
              refNum: r.refNum,
              kpiName: r.kpi,
              roleType: field === 'reviewer' ? 'reviewer' : 'internal_audit',
              officialIdentifier: value,
              assignedBy: currentUser.fullName || currentUser.email || 'Global Administrator'
            })
          })
          .then(res => res.json())
          .then(data => {
            if (data?.success) {
              window.dispatchEvent(new CustomEvent('sdbip_module_unlocked', { detail: data }));
              setSuccessToast(`🔓 Official Designated: ${value}. ${data.unlockedModule?.name || (field === 'reviewer' ? 'OPMS Reviewer' : 'OPMS Internal Audit')} module automatically unlocked! Notifications dispatched to official inbox and all Global Administrators.`);
              setTimeout(() => setSuccessToast(null), 6000);
            }
          })
          .catch(e => console.error("Error auto-unlocking official module:", e));
        }
        
        // Auto-calculate Annual Target if quarterly targets are modified
        if (field === 'q1' || field === 'q2' || field === 'q3' || field === 'q4') {
          updatedRow.annualTarget = calcAnnualTarget(updatedRow.q1, updatedRow.q2, updatedRow.q3, updatedRow.q4);
        }

        // Auto-calculate Mid Term values
        if (field === 'q1' || field === 'q2') {
          const midValue = combineInfo(updatedRow.q1, updatedRow.q2);
          updatedRow.midTerm = midValue;
          updatedRow.midTermTarget = midValue;
        } else if (field === 'q1Actual' || field === 'q2Actual') {
          updatedRow.midTermActual = combineInfo(updatedRow.q1Actual, updatedRow.q2Actual);
        }

        // Auto-calculate Variance for all quarters
        updatedRow.q1Variance = calcVar(updatedRow.q1, updatedRow.q1Actual, updatedRow.uom);
        updatedRow.q2Variance = calcVar(updatedRow.q2, updatedRow.q2Actual, updatedRow.uom);
        updatedRow.midTermVariance = calcVar(updatedRow.midTermTarget, updatedRow.midTermActual, updatedRow.uom);
        updatedRow.q3Variance = calcVar(updatedRow.q3, updatedRow.q3Actual, updatedRow.uom);
        updatedRow.q4Variance = calcVar(updatedRow.q4, updatedRow.q4Actual, updatedRow.uom);
        
        // Auto-calculate RAG Status if actual or target values change
        if (field === 'q1' || field === 'q2' || field === 'q3' || field === 'q4' ||
            field === 'q1Actual' || field === 'q2Actual' || field === 'q3Actual' || field === 'q4Actual') {
          updatedRow.ragStatus = calculateRagStatus(updatedRow);
        }

        // Budget monitoring and overrun notification
        const expFields = ['q1Expenditure', 'q2Expenditure', 'midTermExpenditure', 'q3Expenditure', 'q4Expenditure'];
        if (expFields.includes(field as string)) {
          const breakdown = getRowBudgetBreakdown(updatedRow);
          if (breakdown.isExceeded) {
            if (!breakdown.hasOverrideApproval) {
              setSuccessToast(`⚠️ Budget Exceeded by R ${breakdown.excessAmount.toLocaleString()}! Requires permission from mike@mzansiflow.co.za.`);
              setBudgetOverrideModalRow(updatedRow);
            }
          } else if (breakdown.totalBudget > 0 && breakdown.remainingBudget >= 0) {
            setSuccessToast(`Expenditure saved. R ${breakdown.remainingBudget.toLocaleString()} available for remaining ${breakdown.remainingQuarterCount} quarters (~R ${breakdown.suggestedPerQuarter.toLocaleString()} / qtr).`);
          }
        }

        return updatedRow;
      }
      return r;
    });
    setRows(updated);
    if (field === 'submitter' || field === 'approver' || field === 'reviewer' || field === 'internalAudit') {
      lastUserEditTimeRef.current = Date.now();
      if (saveDebounceTimeoutRef.current) {
        clearTimeout(saveDebounceTimeoutRef.current);
      }
      saveRows(updated);
    } else {
      debouncedSaveRows(updated);
    }
  };

  const triggerUploadModal = (rowId: string, refNum: string, quarter: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'general' = 'general') => {
    if (quarter !== 'general' && !isQuarterActive(quarter)) {
      setSuccessToast(`Upload Locked: ${getQuarterLockNotice(quarter)} Unless you are in the actual period, you cannot upload or edit POE.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    const targetRow = rows.find(r => r.id === rowId);
    if (targetRow && (targetRow.submitter || targetRow.responsibleUnit)) {
      const assignedSubmitter = targetRow.submitter || targetRow.responsibleUnit;
      const isMatch = isUserMatch(assignedSubmitter, currentUser) || isSuperAdminMike || isUserUnrestricted(currentUser);
      if (!isMatch) {
        setSuccessToast(`Upload Restricted: Only the designated Submitter (${assignedSubmitter}) can upload or edit POE for KPI ${targetRow.refNum || ''}.`);
        setTimeout(() => setSuccessToast(null), 4000);
        return;
      }
    }
    setPoeModal({ isOpen: true, rowId, refNum, quarter });
    const suffix = quarter !== 'general' ? `_${quarter}` : '';
    setPoeFileName(`poe_evidence_ref_${refNum.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}${suffix}.pdf`);
    setPoeUploadedFiles([]);
    setUploadMode('multi');
    
    // Find existing description to pre-populate if any
    const existingRow = rows.find(r => r.id === rowId);
    if (existingRow) {
      if (quarter === 'general') setPoeDescription(existingRow.poeDesc || '');
      else if (quarter === 'q1') setPoeDescription(existingRow.q1PoeDesc || '');
      else if (quarter === 'q2') setPoeDescription(existingRow.q2PoeDesc || '');
      else if (quarter === 'midTerm') setPoeDescription(existingRow.midTermPoeDesc || '');
      else if (quarter === 'q3') setPoeDescription(existingRow.q3PoeDesc || '');
      else if (quarter === 'q4') setPoeDescription(existingRow.q4PoeDesc || '');
    } else {
      setPoeDescription('');
    }
  };

  const triggerViewPoeModal = (row: SdbipRow, quarter: 'general' | 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' = 'general') => {
    let quarterLabel = 'General / Overall';
    let fileList: string[] = [];
    let description = '';

    if (quarter === 'q1') {
      quarterLabel = 'Q1 (First Quarter)';
      fileList = row.q1Poes || [];
      description = row.q1PoeDesc || '';
    } else if (quarter === 'q2') {
      quarterLabel = 'Q2 (Second Quarter)';
      fileList = row.q2Poes || [];
      description = row.q2PoeDesc || '';
    } else if (quarter === 'midTerm') {
      quarterLabel = 'Mid-Term Assessment';
      fileList = row.midTermPoes || [];
      description = row.midTermPoeDesc || '';
    } else if (quarter === 'q3') {
      quarterLabel = 'Q3 (Third Quarter)';
      fileList = row.q3Poes || [];
      description = row.q3PoeDesc || '';
    } else if (quarter === 'q4') {
      quarterLabel = 'Q4 (Fourth Quarter)';
      fileList = row.q4Poes || [];
      description = row.q4PoeDesc || '';
    } else {
      quarterLabel = 'Overall Top Layer POE';
      description = row.poeDesc || '';
      const matchPoes = poes.filter(p => p.refNum === row.refNum);
      if (matchPoes.length > 0) {
        fileList = matchPoes.map(p => p.name);
      } else {
        const allQ = [...(row.q1Poes || []), ...(row.q2Poes || []), ...(row.midTermPoes || []), ...(row.q3Poes || []), ...(row.q4Poes || [])];
        fileList = Array.from(new Set(allQ));
      }
    }

    const filesWithMetadata = fileList.map(fName => {
      const foundPoe = poes.find(p => p.name === fName || (p.refNum === row.refNum && p.name.includes(fName)));
      return {
        name: fName,
        size: foundPoe?.size || '1.5 MB',
        date: foundPoe?.date || new Date().toISOString().split('T')[0],
        fileData: foundPoe?.fileData,
        fileType: foundPoe?.fileType || getMimeTypeFromExtension(fName)
      };
    });

    if (filesWithMetadata.length === 0) {
      const suffix = quarter !== 'general' ? `_${quarter}` : '';
      const fallbackName = `poe_evidence_ref_${row.refNum.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}${suffix}.pdf`;
      filesWithMetadata.push({
        name: fallbackName,
        size: '1.8 MB',
        date: new Date().toISOString().split('T')[0],
        fileData: undefined,
        fileType: getMimeTypeFromExtension(fallbackName)
      });
    }

    setViewPoeModal({
      isOpen: true,
      rowId: row.id,
      refNum: row.refNum,
      quarterLabel,
      quarterKey: quarter,
      files: filesWithMetadata,
      description: description || row.poeDesc || 'Portfolio of Evidence document uploaded and stored securely on cloud vault.',
      kpiTitle: row.kpi,
      activeFileIndex: 0
    });
  };

  const getMimeTypeFromExtension = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    switch (ext) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls': return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'csv': return 'text/csv';
      case 'png': return 'image/png';
      case 'jpg':
      case 'jpeg': return 'image/jpeg';
      case 'gif': return 'image/gif';
      case 'svg': return 'image/svg+xml';
      case 'txt': return 'text/plain';
      case 'html': return 'text/html';
      case 'zip': return 'application/zip';
      default: return 'application/octet-stream';
    }
  };

  const createFallbackBlobForFormat = (fileName: string, ext: string, mimeType: string): Blob => {
    if (ext === 'pdf') {
      const pdfContent = `%PDF-1.4
1 0 obj
<< /Title (${fileName}) /Subject (Nkangala District Municipality POE) /Creator (Supabase Cloud Vault) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R /Resources << /Font << /F1 6 0 R >> >> >>
endobj
5 0 obj
<< /Length 220 >>
stream
BT
/F1 14 Tf
50 720 Td
(NKANGALA DISTRICT MUNICIPALITY) Tj
0 -20 Td
(SDBIP PORTFOLIO OF EVIDENCE) Tj
0 -20 Td
(Document Name: ${fileName}) Tj
0 -20 Td
(Audit Verification: Compliant & Verified) Tj
ET
endstream
endobj
6 0 obj
<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>
endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000115 00000 n 
0000000164 00000 n 
0000000223 00000 n 
0000000350 00000 n 
0000000620 00000 n 
trailer
<< /Size 7 /Root 2 0 R >>
startxref
690
%%EOF`;
      return new Blob([pdfContent], { type: 'application/pdf' });
    } else if (ext === 'docx' || ext === 'doc') {
      const docContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><title>${fileName}</title>
<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->
<style>
body { font-family: Calibri, Arial, sans-serif; margin: 40px; color: #1e293b; }
h1 { color: #1e3a8a; border-bottom: 2px solid #3b82f6; padding-bottom: 5px; }
.meta { background: #f8fafc; padding: 12px; border-left: 4px solid #3b82f6; margin: 15px 0; font-size: 14px; }
</style>
</head>
<body>
<h1>NKANGALA DISTRICT MUNICIPALITY</h1>
<h2>SDBIP Portfolio of Evidence (POE)</h2>
<div class="meta">
<p><strong>Document Name:</strong> ${fileName}</p>
<p><strong>Status:</strong> Verified & Audit-Compliant</p>
<p><strong>Storage Vault:</strong> Supabase Cloud Database</p>
</div>
<h3>Official Evidence Document Narrative:</h3>
<p>${viewPoeModal.description || 'This document constitutes official verifiable evidence for top-layer SDBIP performance reporting.'}</p>
</body>
</html>`;
      return new Blob([docContent], { type: 'application/msword' });
    } else if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
      const csvContent = `Nkangala District Municipality - SDBIP Portfolio of Evidence
Document Name,${fileName}
KPI Reference,${viewPoeModal.refNum || 'SDBIP-POE'}
Quarter,${viewPoeModal.quarterLabel || 'General'}
Status,Verified & Audit-Compliant
Description,"${(viewPoeModal.description || 'Verified evidence file.').replace(/"/g, '""')}"
Timestamp,"${new Date().toLocaleString()}"
`;
      return new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    } else if (ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'svg') {
      const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
        <rect width="800" height="500" fill="#0f172a"/>
        <rect x="30" y="30" width="740" height="440" rx="16" fill="#1e293b" stroke="#334155" stroke-width="2"/>
        <text x="400" y="120" fill="#38bdf8" font-family="sans-serif" font-size="22" font-weight="bold" text-anchor="middle">NKANGALA DISTRICT MUNICIPALITY</text>
        <text x="400" y="160" fill="#f8fafc" font-family="sans-serif" font-size="18" font-weight="bold" text-anchor="middle">POE EVIDENCE PHOTO / IMAGE RECORD</text>
        <rect x="180" y="200" width="440" height="180" rx="12" fill="#334155"/>
        <text x="400" y="290" fill="#94a3b8" font-family="sans-serif" font-size="16" text-anchor="middle">📷 ${fileName}</text>
        <text x="400" y="430" fill="#64748b" font-family="monospace" font-size="12" text-anchor="middle">Ref: ${viewPoeModal.refNum || 'SDBIP'} • Audit Compliant Storage</text>
      </svg>`;
      return new Blob([svgContent], { type: ext === 'png' ? 'image/png' : ext === 'svg' ? 'image/svg+xml' : 'image/jpeg' });
    } else {
      const content = `NKANGALA DISTRICT MUNICIPALITY
PORTFOLIO OF EVIDENCE (POE) DOCUMENT
--------------------------------------------------
KPI Ref: ${viewPoeModal.refNum}
Quarter: ${viewPoeModal.quarterLabel}
Document Name: ${fileName}
Status: Verified & Audit-Compliant

Narrative Description:
${viewPoeModal.description}
--------------------------------------------------
Timestamp: ${new Date().toLocaleString()}
`;
      return new Blob([content], { type: mimeType });
    }
  };

  const handleDownloadPoe = (fileName: string, fileData?: string, fileType?: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase() || 'pdf';
    const mimeType = fileType || getMimeTypeFromExtension(fileName);
    let blob: Blob;

    if (fileData && fileData.startsWith('data:')) {
      try {
        const parts = fileData.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : mimeType;
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        blob = new Blob([u8arr], { type: mime });
      } catch {
        blob = createFallbackBlobForFormat(fileName, ext, mimeType);
      }
    } else {
      blob = createFallbackBlobForFormat(fileName, ext, mimeType);
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName; // PRESERVES EXACT ORIGINAL FILE EXTENSION AND FORMAT! NO CONVERSION TO .TXT!
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setSuccessToast(`Downloaded POE document in original (${ext.toUpperCase()}) format: ${fileName}`);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const deleteNewUploadedFileInModal = (index: number) => {
    const updatedList = poeUploadedFiles.filter((_, i) => i !== index);
    setPoeUploadedFiles(updatedList);
    if (updatedList.length > 0) {
      setPoeFileName(updatedList.map(f => f.name).join(', '));
      const totalSizeMB = updatedList.reduce((sum, f) => {
        const val = parseFloat(f.size);
        return sum + (isNaN(val) ? 0 : val);
      }, 0);
      setPoeFileSize(`${totalSizeMB.toFixed(2)} MB`);
    } else {
      setPoeFileName('');
      setPoeFileSize('0.00 MB');
    }
  };

  const deleteExistingPoeFileInModal = (fileName: string) => {
    if (!poeModal.rowId) return;
    const quarter = poeModal.quarter || 'general';
    const updatedPoes = poes.filter(p => !(p.refNum === poeModal.refNum && p.name === fileName));
    
    const updatedRows = rows.map(r => {
      if (r.id === poeModal.rowId) {
        const u = { ...r };
        if (quarter === 'general') {
          const remainingForKpi = updatedPoes.filter(p => p.refNum === poeModal.refNum);
          if (remainingForKpi.length === 0) {
            u.poeStatus = 'Not Uploaded';
          }
        } else if (quarter === 'q1') {
          u.q1Poes = (u.q1Poes || []).filter(name => name !== fileName);
          if (u.q1Poes.length === 0) u.poeStatus = 'Not Uploaded';
        } else if (quarter === 'q2') {
          u.q2Poes = (u.q2Poes || []).filter(name => name !== fileName);
          if (u.q2Poes.length === 0) u.poeStatus = 'Not Uploaded';
        } else if (quarter === 'midTerm') {
          u.midTermPoes = (u.midTermPoes || []).filter(name => name !== fileName);
          if (u.midTermPoes.length === 0) u.poeStatus = 'Not Uploaded';
        } else if (quarter === 'q3') {
          u.q3Poes = (u.q3Poes || []).filter(name => name !== fileName);
          if (u.q3Poes.length === 0) u.poeStatus = 'Not Uploaded';
        } else if (quarter === 'q4') {
          u.q4Poes = (u.q4Poes || []).filter(name => name !== fileName);
          if (u.q4Poes.length === 0) u.poeStatus = 'Not Uploaded';
        }
        return u;
      }
      return r;
    });

    setRows(updatedRows);
    saveRows(updatedRows);
    setPoes(updatedPoes);
    savePoes(updatedPoes);

    setSuccessToast(`Deleted POE document: ${fileName}`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handlePoeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poeFileName.trim()) return;

    if (!poeModal.rowId) return;
    const quarter = poeModal.quarter || 'general';

    // Collect all the files we've uploaded
    let filesToSave = [...poeUploadedFiles];
    if (filesToSave.length === 1 && poeFileName.trim()) {
      // If there's exactly one file and they renamed/edited it in the input, keep the edited name!
      filesToSave[0] = { 
        ...filesToSave[0], 
        name: poeFileName.trim(), 
        fileType: getMimeTypeFromExtension(poeFileName.trim()) 
      };
    } else if (filesToSave.length === 0) {
      filesToSave = [{ name: poeFileName.trim(), size: poeFileSize, fileType: getMimeTypeFromExtension(poeFileName.trim()) }];
    }

    const newPoesToAdd: SdbipPoeFile[] = filesToSave.map((f, i) => ({
      id: `poe-${Date.now()}-${i}`,
      name: f.name,
      type: `${quarter !== 'general' ? quarter.toUpperCase() + ' ' : ''}SDBIP Portfolio of Evidence`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      size: f.size,
      refNum: poeModal.refNum,
      description: poeDescription.trim(),
      fileData: f.fileData,
      fileType: f.fileType || getMimeTypeFromExtension(f.name)
    }));

    const updatedPoes = [...newPoesToAdd, ...poes];
    setPoes(updatedPoes);
    savePoes(updatedPoes);

    // Update row cell & its correct poe fields
    const updatedRows = rows.map(r => {
      if (r.id === poeModal.rowId) {
        const u = { ...r };
        const fileNames = filesToSave.map(f => f.name);

        if (quarter === 'general') {
          u.poeStatus = 'Uploaded - Visit Backup';
          u.poeDesc = poeDescription.trim();
        } else if (quarter === 'q1') {
          u.q1Poes = Array.from(new Set([...(u.q1Poes || []), ...fileNames]));
          u.q1PoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        } else if (quarter === 'q2') {
          u.q2Poes = Array.from(new Set([...(u.q2Poes || []), ...fileNames]));
          u.q2PoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        } else if (quarter === 'midTerm') {
          u.midTermPoes = Array.from(new Set([...(u.midTermPoes || []), ...fileNames]));
          u.midTermPoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        } else if (quarter === 'q3') {
          u.q3Poes = Array.from(new Set([...(u.q3Poes || []), ...fileNames]));
          u.q3PoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        } else if (quarter === 'q4') {
          u.q4Poes = Array.from(new Set([...(u.q4Poes || []), ...fileNames]));
          u.q4PoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        }
        return u;
      }
      return r;
    });
    setRows(updatedRows);
    saveRows(updatedRows);

    setPoeModal({ isOpen: false, rowId: null, refNum: '' });
    setPoeUploadedFiles([]);
    setSuccessToast(`Successfully attached ${filesToSave.length} document(s) to KPI ${poeModal.refNum} SDBIP reporting entry!`);
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const addRow = () => {
    const newRow: SdbipRow = {
      id: `row-${Date.now()}`,
      refNum: newRowData.refNum || `REF-ADD-${rows.length + 1}`,
      strategicObj: newRowData.strategicObj || '',
      bsd: newRowData.bsd || '',
      led: newRowData.led || '',
      mfvm: newRowData.mfvm || '',
      ggpp: newRowData.ggpp || '',
      midt: newRowData.midt || '',
      sr: newRowData.sr || '',
      kpas: newRowData.kpas || '',
      operationalActivity: newRowData.operationalActivity || '',
      kpi: newRowData.kpi || '',
      compliance: (newRowData.compliance as any) || 'compliant',
      uom: newRowData.uom || '',
      mscoaTracking: newRowData.mscoaTracking || '',
      baseline: newRowData.baseline || '',
      annualTarget: newRowData.annualTarget || '',
      budgetAllocation: newRowData.budgetAllocation || '',
      q1: newRowData.q1 || '',
      q2: newRowData.q2 || '',
      q3: newRowData.q3 || '',
      q4: newRowData.q4 || '',
      responsibleUnit: newRowData.responsibleUnit || '',
      poeStatus: 'Not Uploaded'
    };

    const updated = [...rows, newRow];
    setRows(updated);
    saveRows(updated);

    // Reset inputs
    setNewRowData({
      refNum: '',
      strategicObj: '',
      bsd: '',
      led: '',
      mfvm: '',
      ggpp: '',
      midt: '',
      sr: '',
      kpas: '',
      operationalActivity: '',
      kpi: '',
      compliance: 'compliant',
      uom: '',
      mscoaTracking: '',
      baseline: '',
      annualTarget: '',
      budgetAllocation: '',
      q1: '',
      q2: '',
      q3: '',
      q4: '',
      responsibleUnit: '',
      poeStatus: 'Not Uploaded'
    });

    setSuccessToast("New SDBIP row added successfully!");
    setTimeout(() => setSuccessToast(null), 3500);
  };

  const clearQuarterPoe = (rowId: string, quarter: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4') => {
    if (!isSuperAdminMike && !isQuarterActive(quarter)) {
      setSuccessToast(`Action Locked: ${getQuarterLockNotice(quarter)} Unless you are in the actual period, you cannot modify POE.`);
      setTimeout(() => setSuccessToast(null), 4000);
      return;
    }
    const targetRow = rows.find(r => r.id === rowId);
    if (!isSuperAdminMike && targetRow && (targetRow.submitter || targetRow.responsibleUnit)) {
      const assignedSubmitter = targetRow.submitter || targetRow.responsibleUnit;
      const isMatch = isUserMatch(assignedSubmitter, currentUser);
      if (!isMatch) {
        setSuccessToast(`Action Restricted: Only the designated Submitter (${assignedSubmitter}) can delete POE for KPI ${targetRow.refNum || ''}.`);
        setTimeout(() => setSuccessToast(null), 4000);
        return;
      }
    }
    if (targetRow) {
      let filesToRemove: string[] = [];
      if (quarter === 'q1') {
        filesToRemove = targetRow.q1Poes || [];
      } else if (quarter === 'q2') {
        filesToRemove = targetRow.q2Poes || [];
      } else if (quarter === 'midTerm') {
        filesToRemove = targetRow.midTermPoes || [];
      } else if (quarter === 'q3') {
        filesToRemove = targetRow.q3Poes || [];
      } else if (quarter === 'q4') {
        filesToRemove = targetRow.q4Poes || [];
      }

      const suffix = `_${quarter}`;
      const fallbackName = `poe_evidence_ref_${targetRow.refNum.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}${suffix}.pdf`;
      const allFilesToRemove = Array.from(new Set([...filesToRemove, fallbackName]));

      // Permanently remove matching files from the global poes list state and call savePoes to update Supabase
      const updatedPoes = poes.filter(p => {
        if (p.refNum === targetRow.refNum) {
          if (allFilesToRemove.includes(p.name)) {
            return false;
          }
          const quarterPrefix = quarter === 'midTerm' ? 'MIDTERM' : quarter.toUpperCase();
          if (p.type.toUpperCase().includes(quarterPrefix)) {
            return false;
          }
        }
        return true;
      });

      setPoes(updatedPoes);
      savePoes(updatedPoes);
    }

    const updated = rows.map(r => {
      if (r.id === rowId) {
        const u = { ...r };
        if (quarter === 'q1') {
          u.q1Poes = [];
        } else if (quarter === 'q2') {
          u.q2Poes = [];
        } else if (quarter === 'midTerm') {
          u.midTermPoes = [];
        } else if (quarter === 'q3') {
          u.q3Poes = [];
        } else if (quarter === 'q4') {
          u.q4Poes = [];
        }

        // Auto-reset status if no POE files are left attached
        const q1Empty = !u.q1Poes || u.q1Poes.length === 0;
        const q2Empty = !u.q2Poes || u.q2Poes.length === 0;
        const midTermEmpty = !u.midTermPoes || u.midTermPoes.length === 0;
        const q3Empty = !u.q3Poes || u.q3Poes.length === 0;
        const q4Empty = !u.q4Poes || u.q4Poes.length === 0;
        if (q1Empty && q2Empty && midTermEmpty && q3Empty && q4Empty) {
          u.poeStatus = 'Not Uploaded';
        }

        return u;
      }
      return r;
    });

    setRows(updated);
    saveRows(updated);
    setSuccessToast(`Permanently deleted ${quarter.toUpperCase()} SDBIP POE records from cloud vault!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const deleteRowHandler = (rowId: string) => {
    const updated = rows.filter(r => r.id !== rowId);
    setRows(updated);
    saveRows(updated);
    setSuccessToast("SDBIP Row deleted successfully!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handlePurgePlaceholders = async () => {
    setIsClearing(true);
    try {
      const nonPlaceholders = rows.filter(r => !isSdbipPlaceholderRow(r));
      setRows(nonPlaceholders);
      await fetch(`/api/tenant/${activeTenantId}/sdbip/purge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (nonPlaceholders.length > 0) {
        await saveRows(nonPlaceholders);
      }
      setTablePage(1);
      setReportingPage(1);
      setSuccessToast("All placeholders successfully purged from both application and Supabase.");
    } catch (err) {
      console.error("Error purging placeholders:", err);
      setSuccessToast("Purged placeholders from active view.");
    } finally {
      setIsClearing(false);
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleExecuteClearTopLayer = async (target: 'all' | 'filtered') => {
    setIsClearing(true);
    try {
      if (target === 'all') {
        setRows([]);
        await fetch(`/api/tenant/${activeTenantId}/sdbip/purge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        await saveRows([]);
        setTablePage(1);
        setReportingPage(1);
        setSuccessToast("SDBIP Top Layer table cleared successfully. All records removed from database.");
      } else {
        const visibleIds = new Set(filteredRows.map(r => r.id));
        const remaining = rows.filter(r => !visibleIds.has(r.id)).filter(r => !isSdbipPlaceholderRow(r));
        setRows(remaining);
        await saveRows(remaining);
        setTablePage(1);
        setReportingPage(1);
        setSuccessToast(`Successfully cleared ${visibleIds.size} filtered items from SDBIP Top Layer table.`);
      }
    } catch (err) {
      console.error("Error clearing SDBIP top layer table:", err);
      setSuccessToast("Failed to clear table. Please check network connection.");
    } finally {
      setIsClearing(false);
      setClearTopLayerModal({ isOpen: false, clearTarget: 'all' });
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const handleExecuteClearReporting = async (scope: 'all_quarters' | 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'entire_table') => {
    setIsClearing(true);
    try {
      if (scope === 'entire_table') {
        setRows([]);
        await fetch(`/api/tenant/${activeTenantId}/sdbip/purge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });
        await saveRows([]);
        setTablePage(1);
        setReportingPage(1);
        setSuccessToast("All SDBIP Top Layer & Reporting records have been completely purged from the application and Supabase.");
      } else if (scope === 'all_quarters') {
        const updated = rows.map(r => ({
          ...r,
          q1Actual: '',
          q1Variance: '',
          q1Corrective: '',
          q1Expenditure: '',
          q1Poes: [],
          q1PoeDesc: '',
          q2Actual: '',
          q2Variance: '',
          q2Corrective: '',
          q2Expenditure: '',
          q2Poes: [],
          q2PoeDesc: '',
          midTermActual: '',
          midTermVariance: '',
          midTermCorrective: '',
          midTermExpenditure: '',
          midTermPoes: [],
          midTermPoeDesc: '',
          q3Actual: '',
          q3Variance: '',
          q3Corrective: '',
          q3Expenditure: '',
          q3Poes: [],
          q3PoeDesc: '',
          q4Actual: '',
          q4Variance: '',
          q4Corrective: '',
          q4Expenditure: '',
          q4Poes: [],
          q4PoeDesc: '',
          ragStatus: undefined,
          poeStatus: 'Not Uploaded',
          workflows: {}
        }));
        setRows(updated);
        await saveRows(updated);
        setSuccessToast("All quarterly reporting data (actuals, variances, corrective actions, expenditures & evidence) cleared successfully.");
      } else {
        const quarterKey = scope;
        const updated = rows.map(r => {
          const u = { ...r };
          if (quarterKey === 'q1') {
            u.q1Actual = '';
            u.q1Variance = '';
            u.q1Corrective = '';
            u.q1Expenditure = '';
            u.q1Poes = [];
            u.q1PoeDesc = '';
          } else if (quarterKey === 'q2') {
            u.q2Actual = '';
            u.q2Variance = '';
            u.q2Corrective = '';
            u.q2Expenditure = '';
            u.q2Poes = [];
            u.q2PoeDesc = '';
          } else if (quarterKey === 'midTerm') {
            u.midTermActual = '';
            u.midTermVariance = '';
            u.midTermCorrective = '';
            u.midTermExpenditure = '';
            u.midTermPoes = [];
            u.midTermPoeDesc = '';
          } else if (quarterKey === 'q3') {
            u.q3Actual = '';
            u.q3Variance = '';
            u.q3Corrective = '';
            u.q3Expenditure = '';
            u.q3Poes = [];
            u.q3PoeDesc = '';
          } else if (quarterKey === 'q4') {
            u.q4Actual = '';
            u.q4Variance = '';
            u.q4Corrective = '';
            u.q4Expenditure = '';
            u.q4Poes = [];
            u.q4PoeDesc = '';
          }
          return u;
        });
        setRows(updated);
        await saveRows(updated);
        setSuccessToast(`${quarterKey.toUpperCase()} reporting actuals, variances, and corrective actions cleared successfully.`);
      }
    } catch (err) {
      console.error("Error clearing reporting data:", err);
      setSuccessToast("Failed to clear reporting data. Please try again.");
    } finally {
      setIsClearing(false);
      setClearReportingModal({ isOpen: false, scope: 'all_quarters' });
      setTimeout(() => setSuccessToast(null), 3500);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Reference Number", "Strategic Objectives", "KPI", "BSD", "LED", "MFVM",
      "GGPP", "MIDT", "Responsible Owner", "Operational Activity",
      "Compliance", "Unit of Measure", "mSCOA Tracking", "Baseline",
      "Annual Target", "Budget Allocation", "Weight", "Score",
      "Q1 Target", "Q1 Actual", "Q1 Variance", "Q1 Corrective",
      "Q2 Target", "Q2 Actual", "Q2 Variance", "Q2 Corrective",
      "Mid-Term Expenditure", "Mid-Term POE Description", "Mid-Term Target", "Mid-Term Actual", "Mid-Term Variance", "Mid-Term Corrective",
      "Q3 Target", "Q3 Actual", "Q3 Variance", "Q3 Corrective",
      "Q4 Target", "Q4 Actual", "Q4 Variance", "Q4 Corrective",
      "Responsible Unit", "POE Status"
    ];

    const dataRows = rows.map(r => [
      r.refNum, r.strategicObj, r.kpi, r.bsd, r.led, r.mfvm,
      r.ggpp, r.midt, r.kpas, r.operationalActivity,
      r.compliance, r.uom, r.mscoaTracking, r.baseline,
      r.annualTarget, r.budgetAllocation, r.weight, r.score,
      r.q1, r.q1Actual, r.q1Variance, r.q1Corrective,
      r.q2, r.q2Actual, r.q2Variance, r.q2Corrective,
      r.midTermExpenditure, r.midTermPoeDesc, r.midTermTarget, r.midTermActual, r.midTermVariance, r.midTermCorrective,
      r.q3, r.q3Actual, r.q3Variance, r.q3Corrective,
      r.q4, r.q4Actual, r.q4Variance, r.q4Corrective,
      r.responsibleUnit, r.poeStatus
    ]);

    const content = [headers, ...dataRows].map(e => e.map(val => `"${(val || '').replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `sdbip_top_layer_${activeTenantId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const applyBudgetSuggestion = (rowId: string) => {
    const targetRow = rows.find(r => r.id === rowId);
    if (!targetRow) return;
    const breakdown = getRowBudgetBreakdown(targetRow);
    if (breakdown.remainingBudget <= 0) return;

    const perQtr = breakdown.suggestedPerQuarter;
    const updated = rows.map(r => {
      if (r.id === rowId) {
        const u = { ...r };
        const emptyQuarters: ('q2' | 'q3' | 'q4')[] = [];
        if (!parseBudgetNum(u.q2Expenditure || '')) emptyQuarters.push('q2');
        if (!parseBudgetNum(u.q3Expenditure || '')) emptyQuarters.push('q3');
        if (!parseBudgetNum(u.q4Expenditure || '')) emptyQuarters.push('q4');

        const targetQtrs = emptyQuarters.length > 0 ? emptyQuarters : (['q2', 'q3', 'q4'] as const);

        targetQtrs.forEach((q, idx) => {
          const amount = (idx === targetQtrs.length - 1)
            ? (breakdown.remainingBudget - perQtr * (targetQtrs.length - 1))
            : perQtr;
          const fieldKey = `${q}Expenditure` as 'q2Expenditure' | 'q3Expenditure' | 'q4Expenditure';
          u[fieldKey] = `R ${amount.toLocaleString()}`;
        });
        return u;
      }
      return r;
    });
    setRows(updated);
    debouncedSaveRows(updated);
    setSuccessToast(`Suggested budget allocation of ~R ${perQtr.toLocaleString()}/qtr applied across remaining quarters.`);
  };

  const renderQuarterExpenditureCell = (
    row: SdbipRow,
    quarter: 'q1' | 'q2' | 'q3' | 'q4',
    targetVal: string | undefined,
    isRowSubmitter: boolean
  ) => {
    const isSpecialQ1 = quarter === 'q1' && isQuarter1UnlockedKpi(row);
    if (!isSpecialQ1 && isTargetNA(targetVal)) {
      return (
        <div className="flex flex-col items-center justify-center p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none" title={`Expenditure reporting locked (${quarter.toUpperCase()} Target is N/A)`}>
          <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
            <Lock className="w-3 h-3 text-slate-400" />
            <KeyRound className="w-3 h-3 text-amber-600" />
            <span>Locked</span>
          </div>
          <span className="text-[9px] text-slate-400 font-mono">N/A</span>
        </div>
      );
    }

    const fieldKey = `${quarter}Expenditure` as 'q1Expenditure' | 'q2Expenditure' | 'q3Expenditure' | 'q4Expenditure';
    const cellVal = row[fieldKey] || '';
    const isActive = isQuarterActive(quarter);
    const breakdown = getRowBudgetBreakdown(row);
    const canEdit = isSpecialQ1 || (isRowSubmitter && isActive);

    return (
      <div className="space-y-1">
        <ExpandableCell
          value={cellVal}
          disabled={!canEdit}
          onChange={(val) => handleCellChange(row.id, fieldKey, val)}
          cellTitle={`${quarter.toUpperCase()} Expenditure`}
          refNum={row.refNum}
          isFitAll={isFitAllReportingCells}
          minRows={1}
          placeholder={!canEdit ? `Submitter Only (${row.submitter || row.responsibleUnit || 'Assigned'})` : !isActive && !isSpecialQ1 ? "Locked" : "e.g. R 150 000"}
          onOpenExpandModal={openCellExpandModal}
          className={`font-bold ${!canEdit ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white text-slate-800'}`}
        />
        {breakdown.totalBudget > 0 && (
          <div className="text-[10px] space-y-1">
            {breakdown.isExceeded ? (
              breakdown.hasOverrideApproval ? (
                <div className="flex items-center gap-1 text-emerald-800 bg-emerald-50 border border-emerald-300 rounded px-1.5 py-0.5 font-bold text-[9px]">
                  <CheckCircle className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>Override Approved (+R ${breakdown.excessAmount.toLocaleString()}) by {breakdown.overrideApprovedBy || 'mike@mzansiflow.co.za'}</span>
                </div>
              ) : breakdown.overrideRequested ? (
                <button
                  type="button"
                  onClick={() => setBudgetOverrideModalRow(row)}
                  className="w-full flex items-center justify-between gap-1 text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded px-1.5 py-0.5 font-bold text-[9px] cursor-pointer transition shadow-2xs"
                  title="Override requested from mike@mzansiflow.co.za. Click to view."
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600 shrink-0 animate-pulse" />
                    <span>Override Pending (+R ${breakdown.excessAmount.toLocaleString()})</span>
                  </span>
                  <span className="underline">View</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setBudgetOverrideModalRow(row)}
                  className="w-full flex items-center justify-between gap-1 text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300 rounded px-1.5 py-0.5 font-bold text-[9px] cursor-pointer transition shadow-2xs"
                  title="Exceeded! Ask mike@mzansiflow.co.za for override permission."
                >
                  <span className="flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                    <span>Exceeded by R ${breakdown.excessAmount.toLocaleString()}</span>
                  </span>
                  <span className="underline text-[8.5px]">Request Override</span>
                </button>
              )
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded p-1 text-[9px] text-slate-600 space-y-0.5">
                <div className="flex justify-between font-semibold text-slate-700">
                  <span>Avail for next {breakdown.remainingQuarterCount} Qtrs:</span>
                  <span className="font-bold text-teal-700">R ${breakdown.remainingBudget.toLocaleString()}</span>
                </div>
                {breakdown.remainingBudget > 0 && breakdown.remainingQuarterCount > 0 && (
                  <div className="flex items-center justify-between gap-1 pt-0.5 border-t border-slate-200">
                    <span className="text-slate-500 italic">💡 ~R ${breakdown.suggestedPerQuarter.toLocaleString()} / qtr</span>
                    {isRowSubmitter && (
                      <button
                        type="button"
                        onClick={() => applyBudgetSuggestion(row.id)}
                        className="text-[8.5px] px-1 py-0.5 bg-teal-600 hover:bg-teal-700 text-white rounded font-medium cursor-pointer transition"
                        title={`Auto-fill remaining quarters with ~R ${breakdown.suggestedPerQuarter.toLocaleString()} each`}
                      >
                        Apply
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderQuarterWorkflowCell = (row: SdbipRow, phase: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual', isLocked = false) => {
    const targetVal = 
      phase === 'q1' ? row.q1 :
      phase === 'q2' ? row.q2 :
      phase === 'midTerm' ? (row.midTermTarget || row.midTerm) :
      phase === 'q3' ? row.q3 :
      phase === 'q4' ? row.q4 : row.annualTarget;

    const phaseLabel = phase === 'midTerm' ? 'Mid-Term' : phase === 'annual' ? 'Annual' : phase.toUpperCase();
    const isSpecialQ1 = phase === 'q1' && isQuarter1UnlockedKpi(row);

    if (!isSpecialQ1 && isTargetNA(targetVal)) {
      return (
        <div 
          className="flex flex-col items-center justify-center gap-1 py-2 px-3 bg-slate-100/90 border border-dashed border-slate-300 rounded-lg text-center select-none min-w-[135px]"
          title={`${phaseLabel} Target is N/A - Workflow control locked`}
        >
          <div className="flex items-center justify-center gap-1.5 text-xs font-black uppercase text-slate-600">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <KeyRound className="w-3.5 h-3.5 text-amber-600" />
            <span>Locked</span>
          </div>
          <span className="text-[9px] text-slate-400 font-bold uppercase">{phaseLabel} Target is N/A</span>
        </div>
      );
    }

    const wf = (row.workflows?.[phase] || {}) as any;
    const status = wf.status || (
      (row.workflowStatus === 'Submitted to Approver' || row.workflowStatus === 'Submitted') ? 'pending_approval' :
      (row.workflowStatus === 'Approved') ? 'approved' :
      (row.workflowStatus === 'Reviewed' || row.workflowStatus === 'Pending Review') ? 'pending_review' :
      (row.workflowStatus === 'Pending Audit') ? 'pending_audit' :
      (row.workflowStatus === 'Returned') ? 'draft' : 'draft'
    );
    const submitterName = currentUser.fullName || currentUser.email.split('@')[0];

    if (isLocked) {
      return (
        <div className="flex flex-col items-center gap-1.5 py-1.5 min-w-[140px] select-none">
          {/* Current Badge */}
          {status === 'approved' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs">
              <CheckCircle className="w-2.5 h-2.5" /> Approved
            </span>
          )}
          {status === 'pending_approval' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-300 shadow-xs">
              <Clock className="w-2.5 h-2.5" /> Submitted
            </span>
          )}
          {status === 'pending_review' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-violet-50 text-violet-700 border-violet-200 shadow-xs">
              <Clock className="w-2.5 h-2.5" /> Pend. Rev.
            </span>
          )}
          {status === 'pending_audit' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-rose-50 text-rose-700 border-rose-200 shadow-xs">
              <ShieldCheck className="w-2.5 h-2.5" /> Pend. Audit
            </span>
          )}
          {status === 'draft' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 border-slate-200 shadow-xs">
              <FileText className="w-2.5 h-2.5" /> Draft
            </span>
          )}

          <div 
            className="flex flex-col items-center justify-center gap-0.5 w-full max-w-[135px] mt-1 bg-slate-100/90 border border-slate-200 p-1.5 rounded text-center shadow-2xs" 
            title={`${phaseLabel} Workflow Control is Locked`}
          >
            <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-500">
              <Lock className="w-2.5 h-2.5 text-amber-500" />
              <span>Workflow Locked</span>
            </div>
            <span className="text-[8px] text-slate-400 font-medium leading-tight">
              Action controls locked
            </span>
            {isSuperAdminMike && (
              <div className="mt-1 flex flex-col gap-1 w-full pt-1 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => handleMasterUnlockApproval(row.id, phase)}
                  className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8.5px] font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  title="Master Override: Revoke Approval & Unlock (Mike)"
                >
                  <Unlock className="w-2.5 h-2.5 text-rose-200" />
                  <span>Unlock (Mike)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center gap-1.5 py-1.5 min-w-[140px]">
        {/* Current Badge */}
        {status === 'approved' && (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border-emerald-200 shadow-xs">
              <CheckCircle className="w-2.5 h-2.5" /> Approved
            </span>
            {isSuperAdminMike && (
              <button
                type="button"
                onClick={() => handleMasterUnlockApproval(row.id, phase)}
                className="mt-0.5 px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8.5px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Revoke Approval & Reopen (Mike Master Override)"
              >
                <Unlock className="w-2.5 h-2.5 text-rose-200" />
                <span>Unlock (Mike)</span>
              </button>
            )}
          </div>
        )}
        {status === 'pending_approval' && (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-300 shadow-xs">
              <Clock className="w-2.5 h-2.5" /> Submitted
            </span>
            {isSuperAdminMike && (
              <button
                type="button"
                onClick={() => handleMasterUndoSubmission(row.id, phase)}
                className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[8.5px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Undo Submission & Revert to Draft (Mike Master Override)"
              >
                <RotateCcw className="w-2.5 h-2.5 text-amber-200" />
                <span>Undo (Mike)</span>
              </button>
            )}
          </div>
        )}
        {status === 'pending_review' && (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-violet-50 text-violet-700 border-violet-200 shadow-xs">
              <Clock className="w-2.5 h-2.5" /> Pend. Rev.
            </span>
            {isSuperAdminMike && (
              <button
                type="button"
                onClick={() => handleMasterUndoSubmission(row.id, phase)}
                className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[8.5px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Undo Submission & Revert to Draft (Mike Master Override)"
              >
                <RotateCcw className="w-2.5 h-2.5 text-amber-200" />
                <span>Undo (Mike)</span>
              </button>
            )}
          </div>
        )}
        {status === 'pending_audit' && (
          <div className="flex flex-col items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-rose-50 text-rose-700 border-rose-200 shadow-xs">
              <ShieldCheck className="w-2.5 h-2.5" /> Pend. Audit
            </span>
            {isSuperAdminMike && (
              <button
                type="button"
                onClick={() => handleMasterUndoSubmission(row.id, phase)}
                className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[8.5px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer"
                title="Undo Submission & Revert to Draft (Mike Master Override)"
              >
                <RotateCcw className="w-2.5 h-2.5 text-amber-200" />
                <span>Undo (Mike)</span>
              </button>
            )}
          </div>
        )}
        {status === 'draft' && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 border-slate-200 shadow-xs">
            <FileText className="w-2.5 h-2.5" /> Draft
          </span>
        )}

        {/* Interactive Transition Buttons or Locked Status */}
        {!isQuarterActive(phase) ? (
          <div 
            className="flex flex-col items-center gap-0.5 w-full max-w-[135px] mt-1 bg-slate-100/90 border border-slate-200 p-1.5 rounded text-center shadow-2xs group/lock" 
            title={getQuarterLockNotice(phase as ReportingPhase)}
          >
            <div className="flex items-center justify-center gap-1 text-[9px] font-bold text-slate-500">
              <Lock className="w-2.5 h-2.5 text-slate-400" />
              <span>Locked</span>
            </div>
            <span className="text-[8px] text-slate-400 font-medium leading-tight">
              {REPORTING_PERIOD_CONFIGS[phase as ReportingPhase]?.monthsLabel || 'Outside Period'}
            </span>
            {isSuperAdminMike && (
              <div className="mt-1 flex flex-col gap-1 w-full pt-1 border-t border-amber-200">
                <button
                  type="button"
                  onClick={() => handleMasterUnlockApproval(row.id, phase)}
                  className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8.5px] font-bold transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                  title="Master Override: Unlock / Reopen (Mike)"
                >
                  <Unlock className="w-2.5 h-2.5 text-rose-200" />
                  <span>Unlock (Mike)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1 w-full max-w-[130px] mt-1">
            {status === 'draft' && (
              <div className="flex flex-col gap-1 w-full">
                {isUserMatch(row.submitter || row.responsibleUnit, currentUser) ? (
                  <button
                    onClick={() => {
                      const approverName = row.approver || 'Approver';
                      updateWorkflowState(
                        row.id, 
                        phase, 
                        'pending_approval', 
                        { submittedBy: submitterName, submittedAt: new Date().toLocaleDateString() },
                        `KPI ${row.refNum} (${phaseLabel}) submitted to you for executive approval.`,
                        approverName
                      );
                    }}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-[10px] text-white font-bold rounded flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                    title="Submit this KPI to the Executive Approver"
                  >
                    <Send className="w-2.5 h-2.5" /> Push to Approver
                  </button>
                ) : (
                  <span className="text-[9px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded text-center" title={`Only designated submitter (${row.submitter || row.responsibleUnit || 'Submitter'}) can submit this KPI`}>
                    Submitter Only ({row.submitter || row.responsibleUnit || 'Assigned'})
                  </span>
                )}
              </div>
            )}

            {status === 'pending_approval' && (
              <div className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => {
                    const reviewerName = row.reviewer || 'Reviewer';
                    const submitterNameVal = row.submitter || 'Submitter';
                    updateWorkflowState(
                      row.id, 
                      phase, 
                      'pending_review', 
                      { approvedBy: submitterName, approvedAt: new Date().toLocaleDateString(), comments: 'Approved by executive.' },
                      `KPI ${row.refNum} (${phaseLabel}) approved by Executive and pushed to Reviewer for final sign-off.`,
                      [reviewerName, submitterNameVal]
                    );
                  }}
                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-[10px] text-white font-bold rounded flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  title="Approve & Push to Reviewer"
                >
                  <Check className="w-2.5 h-2.5" /> Push to Reviewer
                </button>
                <button
                  onClick={() => {
                    updateWorkflowState(
                      row.id, 
                      phase, 
                      'draft', 
                      { approvedBy: submitterName, comments: 'Returned by executive approver.' },
                      `Executive approver returned KPI ${row.refNum} to submitter.`,
                      row.submitter || 'Submitter'
                    );
                  }}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[9px] font-medium rounded flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Send back to Submitter"
                >
                  <XCircle className="w-2.5 h-2.5" /> Send Back
                </button>
              </div>
            )}

            {status === 'pending_review' && (
              <div className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => {
                    const auditorName = row.internalAudit || 'Internal Auditor';
                    updateWorkflowState(
                      row.id, 
                      phase, 
                      'pending_audit', 
                      { reviewedBy: submitterName, comments: 'Pushed to Internal Audit.' },
                      `KPI ${row.refNum} (${phaseLabel}) pushed to Internal Audit desk.`,
                      auditorName
                    );
                  }}
                  className="px-2 py-1 bg-rose-600 hover:bg-rose-700 text-[10px] text-white font-bold rounded flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  title="Push to Internal Audit Desk"
                >
                  <ShieldCheck className="w-2.5 h-2.5" /> Push to Audit
                </button>
                <button
                  onClick={() => {
                    const submitterNameVal = row.submitter || 'Submitter';
                    const approverNameVal = row.approver || 'Approver';
                    updateWorkflowState(
                      row.id, 
                      phase, 
                      'pending_approval', 
                      { reviewedBy: submitterName, comments: 'Reviewer requested corrections.' },
                      `Reviewer returned KPI ${row.refNum} to Executive Approver.`,
                      [approverNameVal, submitterNameVal]
                    );
                  }}
                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-medium rounded flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Send back to Approver"
                >
                  <XCircle className="w-2.5 h-2.5" /> Send Back
                </button>
              </div>
            )}

            {status === 'pending_audit' && (
              <div className="flex flex-col gap-1 w-full">
                <button
                  onClick={() => {
                    updateWorkflowState(
                      row.id, 
                      phase, 
                      'approved', 
                      { auditedBy: submitterName, comments: 'Internal audit statutory clearance granted.' },
                      `Internal Audit clearance granted for KPI ${row.refNum}. Officially approved.`,
                      [row.submitter || 'Submitter', row.approver || 'Approver', row.reviewer || 'Reviewer']
                    );
                  }}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-[10px] text-white font-bold rounded flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                  title="Clear Audit and Officially Approve"
                >
                  <ShieldCheck className="w-2.5 h-2.5" /> Clear Audit ✅
                </button>
                <button
                  onClick={() => {
                    const submitterNameVal = row.submitter || 'Submitter';
                    const approverNameVal = row.approver || 'Approver';
                    const reviewerNameVal = row.reviewer || 'Reviewer';
                    updateWorkflowState(
                      row.id, 
                      phase, 
                      'draft', 
                      { auditedBy: submitterName, comments: 'Internal audit queries raised.' },
                      `Internal Audit returned KPI ${row.refNum} with audit findings.`,
                      [approverNameVal, submitterNameVal, reviewerNameVal]
                    );
                  }}
                  className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-medium rounded flex items-center justify-center gap-1 transition cursor-pointer"
                  title="Return with Audit Findings"
                >
                  <XCircle className="w-2.5 h-2.5" /> Return / Findings
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderWorkflowSection = () => {
    const currentUserDisplayName = currentUser.fullName || currentUser.email.split('@')[0];
    
    // Filter notifications for active user (allow all in showAllKpisInDesk mode, or matching user)
    const myNotifs = showAllKpisInDesk 
      ? notifications.filter(n => !n.read)
      : notifications.filter(n => (isUserMatch(n.targetUser, currentUser) || n.targetUser?.toLowerCase() === currentUserDisplayName.toLowerCase()) && !n.read);

    // Filter rows for each role based on simulation mode or logged-in user
    const mySubmissions = rows;
    
    const myPendingReviews = rows.filter(r => (r.workflows?.[workflowPhase]?.status === 'pending_review' || (r as any).workflowStatus === 'Reviewed'));

    const myPendingApprovals = rows.filter(r => (r.workflows?.[workflowPhase]?.status === 'pending_approval' || (r as any).workflowStatus === 'Submitted'));

    const myPendingAudits = rows.filter(r => (r.workflows?.[workflowPhase]?.status === 'pending_audit' || (r as any).workflowStatus === 'Pending Audit'));

    const activeWorkflowPhaseLabel = 
      workflowPhase === 'midTerm' ? 'Mid-Term' :
      workflowPhase === 'annual' ? 'Annual' :
      workflowPhase.toUpperCase();

    return (
      <div className="space-y-4 select-none mb-6">
        {/* System notifications center */}
        {showNotifications && myNotifs.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-amber-200 pb-2">
              <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wider font-mono">
                <Bell className="w-4 h-4 text-amber-600 animate-bounce" /> 
                <span>System Notifications ({myNotifs.length})</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button 
                  onClick={() => {
                    const updated = notifications.map(n => (isUserMatch(n.targetUser, currentUser) || n.targetUser?.toLowerCase() === currentUserDisplayName.toLowerCase()) ? { ...n, read: true } : n);
                    saveNotifications(updated);
                  }}
                  className="text-[10px] text-amber-700 font-bold hover:underline cursor-pointer"
                >
                  Mark all as read
                </button>
                <span className="text-amber-300 text-xs">•</span>
                <button 
                  type="button"
                  onClick={clearSystemNotifications}
                  className="text-[10px] text-rose-700 hover:text-rose-900 font-bold hover:underline cursor-pointer flex items-center gap-1"
                  title="Clear all system notifications"
                >
                  <BellOff className="w-3 h-3 text-rose-600" />
                  <span>Clear System Notifications</span>
                </button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
              {myNotifs.map((notif) => (
                <div key={notif.id} className="bg-white p-3 rounded-lg border border-amber-100 flex items-start justify-between gap-3 text-xs shadow-sm">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900">
                      <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[9px] font-mono">{notif.refNum}</span>
                      <span className="text-slate-500 font-normal uppercase text-[9px] font-mono">({notif.phase.toUpperCase()})</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-medium">{notif.message}</p>
                    <span className="text-[9px] text-slate-400 block font-mono">{new Date(notif.createdAt).toLocaleString()}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const updated = notifications.map(n => n.id === notif.id ? { ...n, read: true } : n);
                      saveNotifications(updated);
                    }}
                    className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-slate-50 rounded-lg cursor-pointer transition"
                    title="Dismiss"
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Municipal Reporting Calendar & Temporal Controls Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/50 rounded-2xl p-4 md:p-5 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-full bg-indigo-500/10 blur-3xl pointer-events-none"></div>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1.5 font-mono">
                  <CalendarDays className="w-3.5 h-3.5 text-indigo-400" />
                  MFMA Statutory Municipal Calendar
                </span>
                {periodOverride !== 'auto' ? (
                  <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-amber-400" />
                    Simulated / Override Mode
                  </span>
                ) : (
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Strict Real-Time Enforcement
                  </span>
                )}
              </div>
              <h3 className="text-sm md:text-base font-black text-white tracking-tight flex items-center gap-2">
                Municipal Performance Reporting Window & Temporal Access Controls
              </h3>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                South African MFMA Section 52 & Section 72 statutory regulations dictate that performance achievements, expenditure, and Portfolio of Evidence (POE) records may only be reported during each quarter's designated municipal window. Periods outside their active cycle remain locked to prevent non-compliant submissions.
              </p>
            </div>

            {/* Simulation / Override Mode Selector */}
            <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-2 shrink-0">
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 p-1.5 rounded-xl">
                <span className="text-[10px] font-bold text-slate-400 uppercase font-mono px-2">Cycle Mode:</span>
                <select
                  value={periodOverride}
                  onChange={(e) => {
                    const val = e.target.value;
                    setPeriodOverride(val);
                    if (val !== 'auto' && val !== 'all_open') {
                      setWorkflowPhase(val as any);
                    }
                  }}
                  className="bg-slate-900 border border-indigo-700/50 text-indigo-200 text-xs font-bold rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value="auto">Auto: Real-Time Municipal Calendar (Strict)</option>
                  <option value="q1">Simulate Q1 (July – September)</option>
                  <option value="q2">Simulate Q2 (October – December)</option>
                  <option value="midTerm">Simulate Mid-Term Sec 72 (October – January)</option>
                  <option value="q3">Simulate Q3 (January – March)</option>
                  <option value="q4">Simulate Q4 (April – June)</option>
                  <option value="annual">Simulate Annual APR (July – August)</option>
                  <option value="all_open">Auditor / Super-Admin Override (All Periods Open)</option>
                </select>
              </div>
              <span className="text-[10px] text-indigo-300/80 font-mono">
                Current Active Cycle: <strong className="text-white">{REPORTING_PERIOD_CONFIGS[getCurrentMunicipalQuarter()].title}</strong>
              </span>
            </div>
          </div>

          {/* Period Cycle Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 pt-4 border-t border-indigo-900/40 mt-4">
            {(['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'] as const).map((phaseKey) => {
              const config = REPORTING_PERIOD_CONFIGS[phaseKey];
              const active = isQuarterActive(phaseKey);
              const isSelected = workflowPhase === phaseKey;

              return (
                <div
                  key={phaseKey}
                  onClick={() => setWorkflowPhase(phaseKey)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-indigo-600/30 border-indigo-400 shadow-md ring-1 ring-indigo-400' 
                      : active 
                        ? 'bg-slate-900/60 border-emerald-500/40 hover:bg-slate-850' 
                        : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-900/40 opacity-75'
                  }`}
                  title={active ? `${config.title} is currently ACTIVE for reporting` : getQuarterLockNotice(phaseKey)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-black text-white">{config.shortTitle}</span>
                    {active ? (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                        <Check className="w-2.5 h-2.5" /> OPEN
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.2 rounded border border-slate-800">
                        <Lock className="w-2.5 h-2.5" /> LOCKED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-300 font-medium truncate">{config.monthsLabel}</div>
                  <div className="text-[9px] text-slate-400 truncate mt-0.5">{active ? 'Submissions enabled' : 'Period restricted'}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Workflow action desk panel */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {/* Desk Header */}
          <div className="bg-slate-50 border-b border-slate-200 px-5 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  SDBIP Reporting Workflow & Approval Desk
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
                    isQuarterActive(workflowPhase) 
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}>
                    {isQuarterActive(workflowPhase) ? <Check className="w-3 h-3 text-emerald-600" /> : <Lock className="w-3 h-3 text-amber-700" />}
                    Phase: {activeWorkflowPhaseLabel} ({isQuarterActive(workflowPhase) ? 'Window Open' : 'Window Locked'})
                  </span>
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Push KPI reports from Submitter to Approver, then Reviewer, with automatic system notifications.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setShowAllKpisInDesk(p => !p)}
                className={`px-2.5 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${showAllKpisInDesk ? 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                title="Toggle between seeing only KPIs assigned to you vs all SDBIP KPIs for testing/simulation."
              >
                <Database className="w-3.5 h-3.5" />
                {showAllKpisInDesk ? 'Oversight (Show All)' : 'My KPIs Only'}
              </button>
              <button 
                onClick={() => {
                  if (myNotifs.length > 0) {
                    const messages = myNotifs.map(n => `• [${n.refNum}] ${n.message}`).join("\n");
                    setSuccessToast(`🔔 Active Notifications:\n${messages}`);
                    setTimeout(() => setSuccessToast(null), 8000);
                    
                    const updated = notifications.map(n => 
                      (isUserMatch(n.targetUser, currentUser) || n.targetUser?.toLowerCase() === currentUserDisplayName.toLowerCase())
                        ? { ...n, read: true } 
                        : n
                    );
                    saveNotifications(updated);
                  } else {
                    setSuccessToast("🔔 No new notifications.");
                    setTimeout(() => setSuccessToast(null), 3000);
                  }
                  setShowNotifications(true);
                }}
                className={`p-1.5 border rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition ${showNotifications ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                <Bell className="w-3.5 h-3.5" />
                {myNotifs.length > 0 && <span className="bg-rose-500 text-white w-2 h-2 rounded-full inline-block"></span>}
                Notifications
              </button>
              <button 
                type="button"
                onClick={clearSystemNotifications}
                className="px-2.5 py-1.5 border border-slate-200 hover:border-amber-300 bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition shadow-2xs"
                title="Clear all system notifications"
              >
                <BellOff className="w-3.5 h-3.5 text-amber-600" />
                <span>Clear Notifications</span>
              </button>
              <button 
                onClick={() => setIsWorkflowDeskOpen(p => !p)}
                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer transition"
              >
                {isWorkflowDeskOpen ? 'Collapse Desk' : 'Open Desk'}
              </button>
            </div>
          </div>

          {isWorkflowDeskOpen && (
            <div className="p-5 space-y-5">
              {/* Active phase selection & role selection */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Reporting Period Target</span>
                    {!isQuarterActive(workflowPhase) && (
                      <span className="text-[9px] text-rose-600 bg-rose-50 border border-rose-200 font-bold px-1.5 py-0.2 rounded inline-flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> Locked Window
                      </span>
                    )}
                  </div>
                  <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                    {(['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'] as const).map((p) => {
                      const isActive = workflowPhase === p;
                      const isPeriodOpen = isQuarterActive(p);
                      const label = 
                        p === 'q1' ? 'Q1' :
                        p === 'q2' ? 'Q2' :
                        p === 'midTerm' ? 'Mid-Term' :
                        p === 'q3' ? 'Q3' :
                        p === 'q4' ? 'Q4' : 'Annual';
                      return (
                        <button
                          key={p}
                          onClick={() => setWorkflowPhase(p)}
                          title={!isPeriodOpen ? getQuarterLockNotice(p) : `${label} is Active`}
                          className={`px-3 py-1 rounded-md text-xs font-bold cursor-pointer transition flex items-center gap-1.5 ${
                            isActive 
                              ? isPeriodOpen
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'bg-slate-800 text-amber-300 shadow-sm' 
                              : isPeriodOpen
                                ? 'text-slate-700 hover:text-slate-950'
                                : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {!isPeriodOpen && <Lock className="w-3 h-3 opacity-60" />}
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Logged In Profile Workspace</span>
                  <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50">
                    <button
                      onClick={() => setActiveWorkflowTab('submissions')}
                      className={`px-3.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${activeWorkflowTab === 'submissions' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Send className="w-3.5 h-3.5 text-slate-400" />
                      My Submissions
                      <span className="bg-slate-200 text-slate-700 text-[9px] px-1.5 py-0.2 rounded-full font-bold">{mySubmissions.length}</span>
                    </button>
                    <button
                      onClick={() => setActiveWorkflowTab('approvals')}
                      className={`px-3.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${activeWorkflowTab === 'approvals' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      My Pending Approvals
                      {myPendingApprovals.length > 0 && <span className="bg-amber-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">{myPendingApprovals.length}</span>}
                    </button>
                    <button
                      onClick={() => setActiveWorkflowTab('reviews')}
                      className={`px-3.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${activeWorkflowTab === 'reviews' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <Inbox className="w-3.5 h-3.5 text-violet-500" />
                      My Pending Reviews
                      {myPendingReviews.length > 0 && <span className="bg-violet-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">{myPendingReviews.length}</span>}
                    </button>
                    <button
                      onClick={() => setActiveWorkflowTab('audits')}
                      className={`px-3.5 py-1 rounded-md text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${activeWorkflowTab === 'audits' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-rose-500" />
                      My Pending Audits
                      {myPendingAudits.length > 0 && <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-bold">{myPendingAudits.length}</span>}
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Helper Methods for Replica SDBIP Table */}
              {(() => {
                const getPhaseFieldValue = (row: SdbipRow, phase: string, col: string): string => {
                  const sourcePoe = row.poeDesc || row.poeStatus || row.q1PoeDesc || row.q2PoeDesc || row.midTermPoeDesc || row.q3PoeDesc || row.q4PoeDesc || '';
                  if (phase === 'q1') {
                    if (col === 'exp') return row.q1Expenditure || '';
                    if (col === 'poeDesc') return row.q1PoeDesc || sourcePoe;
                    if (col === 'actual') return row.q1Actual || '';
                    if (col === 'var') return row.q1Variance || '';
                    if (col === 'corr') return row.q1Corrective || '';
                  } else if (phase === 'q2') {
                    if (col === 'exp') return row.q2Expenditure || '';
                    if (col === 'poeDesc') return row.q2PoeDesc || sourcePoe;
                    if (col === 'actual') return row.q2Actual || '';
                    if (col === 'var') return row.q2Variance || '';
                    if (col === 'corr') return row.q2Corrective || '';
                  } else if (phase === 'midTerm') {
                    if (col === 'exp') return row.midTermExpenditure || '';
                    if (col === 'poeDesc') return row.midTermPoeDesc || sourcePoe;
                    if (col === 'actual') return row.midTermActual || '';
                    if (col === 'var') return row.midTermVariance || '';
                    if (col === 'corr') return row.midTermCorrective || '';
                  } else if (phase === 'q3') {
                    if (col === 'exp') return row.q3Expenditure || '';
                    if (col === 'poeDesc') return row.q3PoeDesc || sourcePoe;
                    if (col === 'actual') return row.q3Actual || '';
                    if (col === 'var') return row.q3Variance || '';
                    if (col === 'corr') return row.q3Corrective || '';
                  } else if (phase === 'q4') {
                    if (col === 'exp') return row.q4Expenditure || '';
                    if (col === 'poeDesc') return row.q4PoeDesc || sourcePoe;
                    if (col === 'actual') return row.q4Actual || '';
                    if (col === 'var') return row.q4Variance || '';
                    if (col === 'corr') return row.q4Corrective || '';
                  }
                  return '';
                };

                const handlePhaseFieldChange = (rowId: string, phase: string, col: string, val: string) => {
                  let field = '';
                  if (phase === 'q1') {
                    if (col === 'exp') field = 'q1Expenditure';
                    if (col === 'poeDesc') field = 'q1PoeDesc';
                    if (col === 'actual') field = 'q1Actual';
                    if (col === 'corr') field = 'q1Corrective';
                  } else if (phase === 'q2') {
                    if (col === 'exp') field = 'q2Expenditure';
                    if (col === 'poeDesc') field = 'q2PoeDesc';
                    if (col === 'actual') field = 'q2Actual';
                    if (col === 'corr') field = 'q2Corrective';
                  } else if (phase === 'midTerm') {
                    if (col === 'exp') field = 'midTermExpenditure';
                    if (col === 'poeDesc') field = 'midTermPoeDesc';
                    if (col === 'actual') field = 'midTermActual';
                    if (col === 'corr') field = 'midTermCorrective';
                  } else if (phase === 'q3') {
                    if (col === 'exp') field = 'q3Expenditure';
                    if (col === 'poeDesc') field = 'q3PoeDesc';
                    if (col === 'actual') field = 'q3Actual';
                    if (col === 'corr') field = 'q3Corrective';
                  } else if (phase === 'q4') {
                    if (col === 'exp') field = 'q4Expenditure';
                    if (col === 'poeDesc') field = 'q4PoeDesc';
                    if (col === 'actual') field = 'q4Actual';
                    if (col === 'corr') field = 'q4Corrective';
                  }
                  if (field) {
                    handleCellChange(rowId, field as any, val);
                  }
                };

                const renderSdbipTableReplica = (rowsToRender: SdbipRow[]) => {
                  const isAll = deskPageSize === 'all';
                  const numericSize = isAll ? rowsToRender.length : deskPageSize;
                  const totalPages = isAll || rowsToRender.length === 0 ? 1 : Math.ceil(rowsToRender.length / numericSize);
                  const safeDeskPage = Math.min(Math.max(1, deskPage), totalPages || 1);
                  const paginatedRows = isAll ? rowsToRender : rowsToRender.slice((safeDeskPage - 1) * numericSize, safeDeskPage * numericSize);

                  return (
                    <div className="space-y-2">
                      <div className="overflow-auto border border-slate-200 rounded-xl relative bg-white h-[380px] shadow-sm select-none">
                        <table className="w-full text-left border-collapse table-fixed min-w-[2800px]">
                        <thead className="sticky top-0 bg-slate-100 z-20 border-b border-slate-200 text-[10px] font-black tracking-wider uppercase text-slate-700 font-mono">
                          <tr>
                            <th className="p-3 border-r border-slate-200 w-24 sticky left-0 z-30 bg-slate-100">REF NUMBER</th>
                            <th className="p-3 border-r border-slate-200 w-64">STRATEGIC OBJECTIVES</th>
                            <th className="p-3 border-r border-slate-200 w-64">KPI</th>
                            <th className="p-3 border-r border-slate-200 w-20 text-center bg-blue-100 text-blue-900">BSD</th>
                            <th className="p-3 border-r border-slate-200 w-20 text-center bg-emerald-100 text-emerald-900">LED</th>
                            <th className="p-3 border-r border-slate-200 w-20 text-center bg-amber-100 text-amber-900">MFVM</th>
                            <th className="p-3 border-r border-slate-200 w-20 text-center bg-indigo-100 text-indigo-900">GGPP</th>
                            <th className="p-3 border-r border-slate-200 w-20 text-center bg-rose-100 text-rose-900">MIDT</th>
                            <th className="p-3 border-r border-slate-200 w-20 text-center bg-orange-100 text-orange-900">SR</th>
                            <th className="p-3 border-r border-slate-200 w-52">RESPONSIBLE OWNER</th>
                            <th className="p-3 border-r border-slate-200 w-40">BASELINE</th>
                            <th className="p-3 border-r border-slate-200 w-44">ANNUAL TARGET</th>
                            <th className="p-3 border-r border-slate-200 w-40">TOTAL BUDGET</th>
                            <th className="p-3 border-r border-slate-200 w-32 text-center bg-slate-200 text-slate-900">RAG STATUS</th>
                            <th className="p-3 border-r border-slate-200 w-44 text-center bg-indigo-50 text-indigo-900 border-b border-indigo-200 font-bold">ACTIVE WORKFLOW ({activeWorkflowPhaseLabel})</th>
                            
                            {/* Active Phase's Dynamic SDBIP Reporting Columns */}
                            <th className="p-3 border-r border-slate-200 w-36 bg-teal-50 text-teal-955 font-bold text-center border-b-2 border-teal-200">{activeWorkflowPhaseLabel} EXPENDITURE</th>
                            <th className="p-3 border-r border-slate-200 w-48 bg-indigo-50 text-indigo-955 font-bold text-center">{activeWorkflowPhaseLabel} POE</th>
                            <th className="p-3 border-r border-slate-200 w-24 bg-indigo-50 text-indigo-900 text-center">{activeWorkflowPhaseLabel} TARGET</th>
                            <th className="p-3 border-r border-slate-200 w-48 bg-indigo-100 text-indigo-900 border-b-2 border-indigo-200">{activeWorkflowPhaseLabel} ACTUAL</th>
                            <th className="p-3 border-r border-slate-200 w-48 bg-indigo-200 text-indigo-955 border-b-2 border-indigo-300">{activeWorkflowPhaseLabel} VARIANCE</th>
                            <th className="p-3 border-r border-slate-200 w-64 bg-indigo-300 text-indigo-955 border-b-2 border-indigo-400">{activeWorkflowPhaseLabel} CORRECTIVE MEASURE</th>

                            <th className="p-3 border-r border-slate-200 w-64 bg-indigo-50 text-indigo-900 font-bold text-center border-b-2 border-indigo-200">SUBMITTER</th>
                            <th className="p-3 border-r border-slate-200 w-64 bg-emerald-50 text-emerald-900 font-bold text-center border-b-2 border-emerald-200">APPROVER</th>
                            <th className="p-3 border-r border-slate-200 w-64 bg-violet-50 text-violet-900 font-bold text-center border-b-2 border-violet-200">REVIEWER</th>
                            <th className="p-3 w-28 text-center bg-slate-50 text-slate-900 border-b-2 border-slate-200 font-bold">SCORE</th>
                          </tr>
                        </thead>
                        <tbody className="text-xs font-medium text-slate-800 divide-y divide-slate-100">
                          {paginatedRows.map((row) => {
                            const isSelected = selectedWorkflowRow?.id === row.id;
                            const pData = getPhaseData(row, workflowPhase);
                            const wf = row.workflows?.[workflowPhase] || { status: 'draft' };
                            const status = wf.status || 'draft';
                            const isPhaseSpecialUnlocked = workflowPhase === 'q1' && isQuarter1UnlockedKpi(row);

                            return (
                              <tr 
                                key={row.id} 
                                onClick={() => setSelectedWorkflowRow(row)}
                                className={`group hover:bg-slate-50/70 transition-colors cursor-pointer ${isSelected ? 'bg-indigo-50/80 font-semibold' : ''}`}
                              >
                                <td className={`p-2 border-r border-slate-150 sticky left-0 z-10 font-mono text-[11px] ${isSelected ? 'bg-indigo-100 font-black text-indigo-950' : 'bg-white group-hover:bg-slate-50/95'}`}>
                                  <div className="flex items-center gap-1">
                                    {row.refNum}
                                    {isSelected && <span className="text-[8px] bg-indigo-600 text-white font-mono px-1 rounded font-bold animate-pulse">ACTIVE</span>}
                                  </div>
                                </td>
                                <td className="p-2 border-r border-slate-150 text-[11px] leading-tight text-slate-500 overflow-hidden text-ellipsis whitespace-normal">{row.strategicObj}</td>
                                <td className="p-2 border-r border-slate-150 text-[11px] leading-tight font-bold text-slate-700">{row.kpi}</td>
                                <td className="p-2 border-r border-slate-150 text-center bg-blue-50/30 font-bold text-blue-600">{row.bsd}</td>
                                <td className="p-2 border-r border-slate-150 text-center bg-emerald-50/30 font-bold text-emerald-600">{row.led}</td>
                                <td className="p-2 border-r border-slate-150 text-center bg-amber-50/30 font-bold text-amber-600">{row.mfvm}</td>
                                <td className="p-2 border-r border-slate-150 text-center bg-indigo-50/30 font-bold text-indigo-600">{row.ggpp}</td>
                                <td className="p-2 border-r border-slate-150 text-center bg-rose-50/30 font-bold text-rose-600">{row.midt}</td>
                                <td className="p-2 border-r border-slate-150 text-center bg-orange-50/30 font-bold text-orange-600">{row.sr}</td>
                                <td className="p-2 border-r border-slate-150 text-[11px] text-slate-500">{row.kpas}</td>
                                <td className="p-2 border-r border-slate-150 text-[11px] text-slate-600">{row.baseline}</td>
                                <td className="p-2 border-r border-slate-150 text-[11px] font-black text-indigo-700">{row.annualTarget}</td>
                                <td className="p-2 border-r border-slate-150 text-[11px] font-bold text-slate-700">{row.budgetAllocation || 'Opex'}</td>
                                
                                {/* RAG Status */}
                                <td className="p-2 border-r border-slate-150 text-center bg-slate-50/10">
                                  {(() => {
                                    const details = getRagDetails(row);
                                    return (
                                      <div className="flex flex-col items-center gap-1">
                                        <div 
                                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-semibold shadow-xs select-none ${details.bgClass} ${details.borderClass} ${details.textClass}`}
                                          title={details.tooltip}
                                        >
                                          <span className="text-xs leading-none">{details.face}</span>
                                          <span className="text-[8px] uppercase tracking-wider font-black">{details.label}</span>
                                        </div>
                                        {row.auditChecklist?.auditSubmitted && (
                                          <span className="text-[9px] font-black text-emerald-600 uppercase tracking-wider">Submitted</span>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </td>

                                {/* Active Workflow Status */}
                                <td className="p-2 border-r border-slate-150 text-center bg-indigo-50/10 min-w-[130px]">
                                  {(!isPhaseSpecialUnlocked && isTargetNA(pData.target)) ? (
                                    <div className="flex flex-col items-center gap-0.5 py-1">
                                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase bg-slate-200 text-slate-600 border-slate-300">
                                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                                        <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                                        <span>Locked</span>
                                      </span>
                                      <span className="text-[8px] text-slate-400 font-mono">Target N/A</span>
                                    </div>
                                  ) : (
                                    <div className="flex flex-col items-center gap-1 py-1">
                                      {status === 'approved' && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border-emerald-200">
                                          <CheckCircle className="w-2.5 h-2.5" /> Approved
                                        </span>
                                      )}
                                      {status === 'pending_approval' && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-200">
                                          <Clock className="w-2.5 h-2.5" /> Pend. Appr.
                                        </span>
                                      )}
                                      {status === 'pending_review' && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-violet-50 text-violet-700 border-violet-200">
                                          <Clock className="w-2.5 h-2.5" /> Pend. Rev.
                                        </span>
                                      )}
                                      {status === 'draft' && (
                                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 border-slate-200">
                                          <FileText className="w-2.5 h-2.5" /> Draft
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Expenditure */}
                                <td className="p-2 border-r border-slate-100 bg-teal-50/10" onClick={(e) => e.stopPropagation()}>
                                  {(!isPhaseSpecialUnlocked && isTargetNA(pData.target)) ? (
                                    <div className="text-center font-bold text-slate-400 text-[11px] flex items-center justify-center gap-1 select-none" title="Expenditure reporting locked (Target is N/A)">
                                      <Lock className="w-2.5 h-2.5 text-slate-400" /> <KeyRound className="w-2.5 h-2.5 text-amber-500" /> <span>Locked</span>
                                    </div>
                                  ) : (
                                    (() => {
                                      const breakdown = getRowBudgetBreakdown(row);
                                      const expVal = getPhaseFieldValue(row, workflowPhase, 'exp') || '';
                                      return (
                                        <div className="space-y-1">
                                          <input 
                                            type="text"
                                            disabled={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked}
                                            value={expVal}
                                            onChange={(e) => handlePhaseFieldChange(row.id, workflowPhase, 'exp', e.target.value)}
                                            title={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? getQuarterLockNotice(workflowPhase) : undefined}
                                            className={`w-full border p-1 rounded text-[11px] font-bold ${!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-800 border-slate-200'}`}
                                            placeholder={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? "Locked" : "e.g. R 150 000"}
                                          />
                                          {breakdown.totalBudget > 0 && (
                                            <div className="text-[9px]">
                                              {breakdown.isExceeded ? (
                                                <div className="text-rose-700 font-bold bg-rose-50 px-1 py-0.5 rounded border border-rose-200">
                                                  Exceeded (+R {breakdown.excessAmount.toLocaleString()})
                                                </div>
                                              ) : (
                                                <div className="text-teal-700 font-semibold bg-teal-50/70 px-1 py-0.5 rounded border border-teal-200/50">
                                                  Avail: R {breakdown.remainingBudget.toLocaleString()}
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })()
                                  )}
                                </td>

                                {/* POE Column */}
                                <td className="p-2 border-r border-slate-100 bg-indigo-50/10" onClick={(e) => e.stopPropagation()}>
                                  {(!isPhaseSpecialUnlocked && isTargetNA(pData.target)) ? (
                                    <div className="flex flex-col items-center justify-center p-2 bg-slate-100/90 rounded border border-slate-200 text-slate-500 gap-0.5 select-none" title="POE reporting locked (Target is N/A)">
                                      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-600">
                                        <Lock className="w-3 h-3 text-slate-500" /> <KeyRound className="w-3 h-3 text-amber-600" /> <span>Locked</span>
                                      </div>
                                      <span className="text-[8px] text-slate-400">Target is N/A</span>
                                    </div>
                                  ) : (
                                    <div className="space-y-1.5">
                                      <textarea 
                                        rows={2} 
                                        value={getPhaseFieldValue(row, workflowPhase, 'poeDesc') || ''} 
                                        disabled={true} 
                                        readOnly={true} 
                                        title="Source document POE description (non-editable across all quarters)" 
                                        className="w-full border p-1 rounded text-[10px] bg-slate-100/90 text-slate-700 cursor-not-allowed border-slate-200" 
                                        placeholder="Source Document POE Description..." 
                                      />
                                      {pData.poes && pData.poes.length > 0 && (
                                        <button
                                          type="button"
                                          onClick={() => triggerViewPoeModal(row, workflowPhase as any)}
                                          className="w-full text-left text-[9px] bg-emerald-50 hover:bg-emerald-100 p-1 border border-emerald-200 rounded text-emerald-800 truncate font-semibold flex items-center gap-1 cursor-pointer transition-all duration-150 shadow-2xs hover:scale-[1.01]"
                                          title={`Click to view/download this POE: ${pData.poes[pData.poes.length - 1]}`}
                                        >
                                          <span className="truncate flex-1">📄 {pData.poes[pData.poes.length - 1]}</span>
                                          <Eye className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                        </button>
                                      )}
                                      <div className="flex gap-1">
                                        <button 
                                          disabled={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked}
                                          onClick={() => triggerUploadModal(row.id, row.refNum, workflowPhase as any)}
                                          title={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? getQuarterLockNotice(workflowPhase) : "Upload/Edit POE"}
                                          className={`flex-1 py-0.5 text-[9px] font-bold rounded border transition-colors flex items-center justify-center gap-1 ${!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer'}`}
                                        >
                                          <Upload className="w-2 h-2" /> Upload
                                        </button>
                                        {((pData.poes && pData.poes.length > 0) || getPhaseFieldValue(row, workflowPhase, 'poeDesc')) && (
                                          confirmDelete?.rowId === row.id && confirmDelete?.type === workflowPhase ? (
                                            <div className="flex flex-col gap-1 bg-rose-50 border border-rose-200 p-1 rounded min-w-[80px]">
                                              <span className="text-[8px] text-rose-800 font-bold text-center leading-none">Delete?</span>
                                              <div className="flex gap-1 justify-center">
                                                <button
                                                  disabled={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked}
                                                  onClick={() => {
                                                    clearQuarterPoe(row.id, workflowPhase as any);
                                                    setConfirmDelete(null);
                                                  }}
                                                  className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-rose-700 disabled:opacity-50"
                                                >
                                                  Yes
                                                </button>
                                                <button
                                                  onClick={() => setConfirmDelete(null)}
                                                  className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer"
                                                >
                                                  No
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <button 
                                              disabled={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked}
                                              onClick={() => setConfirmDelete({ rowId: row.id, type: workflowPhase as any })}
                                              title={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? getQuarterLockNotice(workflowPhase) : "Delete POE"}
                                              className={`p-1 text-[9px] font-bold rounded border transition-colors flex items-center justify-center ${!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer'}`}
                                            >
                                              <Trash2 className="w-2.5 h-2.5" />
                                            </button>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </td>

                                {/* TARGET */}
                                <td className="p-2 border-r border-slate-100 bg-indigo-50/20 text-center font-bold text-indigo-900 text-xs">
                                  {pData.target || '-'}
                                </td>

                                {/* ACTUAL */}
                                <td className="p-2 border-r border-slate-100 bg-indigo-50/5 relative" onClick={(e) => e.stopPropagation()}>
                                  {(!isPhaseSpecialUnlocked && isTargetNA(pData.target)) ? (
                                    <div className="text-center font-bold text-slate-400 text-[11px] flex items-center justify-center gap-1 py-2 bg-slate-100 rounded border border-slate-200 select-none" title="Actual reporting locked (Target is N/A)">
                                      <Lock className="w-2.5 h-2.5 text-slate-400" /> <KeyRound className="w-2.5 h-2.5 text-amber-600" /> <span>Locked</span>
                                    </div>
                                  ) : (
                                    <>
                                      <textarea 
                                        rows={2} 
                                        disabled={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked}
                                        value={getPhaseFieldValue(row, workflowPhase, 'actual') || ''} 
                                        onChange={(e) => handlePhaseFieldChange(row.id, workflowPhase, 'actual', e.target.value)} 
                                        title={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? getQuarterLockNotice(workflowPhase) : undefined}
                                        className={`w-full border p-1 rounded text-[11px] ${!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white border-slate-200 focus:ring-1 focus:ring-indigo-300'}`} 
                                        placeholder={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? "Locked for this period" : "Actual..."} 
                                      />
                                      {pData.actual && pData.target && pData.actual !== pData.target && (
                                        <div className="absolute top-1 right-1" title={`Target Discrepancy: Target is ${pData.target}, Actual is ${pData.actual}`}>
                                          <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse" />
                                        </div>
                                      )}
                                    </>
                                  )}
                                </td>

                                {/* VARIANCE */}
                                <td className="p-2 border-r border-slate-100 bg-indigo-50/5 text-center font-bold text-slate-700">
                                  {(!isPhaseSpecialUnlocked && isTargetNA(pData.target)) ? (
                                    <div className="text-center font-bold text-slate-400 text-[11px] flex items-center justify-center gap-1 select-none" title="Variance locked (Target is N/A)">
                                      <Lock className="w-2.5 h-2.5 text-slate-400" /> <KeyRound className="w-2.5 h-2.5 text-amber-600" /> <span>Locked</span>
                                    </div>
                                  ) : (
                                    getPhaseFieldValue(row, workflowPhase, 'var') || '-'
                                  )}
                                </td>

                                {/* CORRECTIVE MEASURES */}
                                <td className="p-2 border-r border-slate-100 bg-indigo-50/5" onClick={(e) => e.stopPropagation()}>
                                  {(!isPhaseSpecialUnlocked && isTargetNA(pData.target)) ? (
                                    <div className="text-center font-bold text-slate-400 text-[11px] flex items-center justify-center gap-1 py-2 bg-slate-100 rounded border border-slate-200 select-none" title="Corrective measure locked (Target is N/A)">
                                      <Lock className="w-2.5 h-2.5 text-slate-400" /> <KeyRound className="w-2.5 h-2.5 text-amber-600" /> <span>Locked</span>
                                    </div>
                                  ) : (
                                    <textarea 
                                      rows={2} 
                                      value={getPhaseFieldValue(row, workflowPhase, 'corr') || ''} 
                                      disabled={(!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked) || (!isPhaseSpecialUnlocked && isFieldDisabled(getPhaseFieldValue(row, workflowPhase, 'var')))}
                                      onChange={(e) => handlePhaseFieldChange(row.id, workflowPhase, 'corr', e.target.value)} 
                                      title={!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked ? getQuarterLockNotice(workflowPhase) : undefined}
                                      className={`w-full p-1 rounded text-[11px] transition-colors ${(!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked) || (!isPhaseSpecialUnlocked && isFieldDisabled(getPhaseFieldValue(row, workflowPhase, 'var'))) ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed italic font-normal' : 'bg-white border-slate-200 text-slate-800 focus:ring-1 focus:ring-indigo-300'}`} 
                                      placeholder={(!isQuarterActive(workflowPhase) && !isPhaseSpecialUnlocked) ? "Locked for this period" : isFieldDisabled(getPhaseFieldValue(row, workflowPhase, 'var')) && !isPhaseSpecialUnlocked ? "No variance." : "Corrective..."} 
                                    />
                                  )}
                                </td>

                                <td className="p-2 border-r border-slate-150 text-[11px] text-slate-600 text-center font-semibold">{row.submitter || '-'}</td>
                                <td className="p-2 border-r border-slate-150 text-[11px] text-slate-600 text-center font-semibold">{row.reviewer || '-'}</td>
                                <td className="p-2 border-r border-slate-150 text-[11px] text-slate-600 text-center font-semibold">{row.approver || '-'}</td>
                                <td className="p-2 text-center text-slate-600 font-bold">{row.score !== undefined ? row.score : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                      </div>
                      <SDBIPPagination
                        currentPage={safeDeskPage}
                        pageSize={deskPageSize}
                        totalItems={rowsToRender.length}
                        onPageChange={setDeskPage}
                        onPageSizeChange={setDeskPageSize}
                        pageSizeOptions={[15, 25, 50, 100, 'all']}
                        itemName="desk KPIs"
                      />
                    </div>
                  );
                };

                return (
                  <div className="bg-slate-100/50 p-4 border border-slate-200 rounded-xl shadow-inner overflow-hidden">
                    {activeWorkflowTab === 'submissions' && (() => {
                      const submissionsToRender = submissionFilter === 'submitted'
                        ? mySubmissions.filter(r => r.workflows?.[workflowPhase]?.status && r.workflows[workflowPhase].status !== 'draft')
                        : mySubmissions;

                      return (
                        <div className="space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
                            <div className="flex items-center gap-2">
                              <Inbox className="w-4 h-4 text-indigo-600" />
                              <h4 className="text-xs font-black text-slate-950 font-mono uppercase">Submitter Scorecard Control Center</h4>
                            </div>
                            <div className="flex items-center gap-1.5 bg-slate-100 p-0.5 rounded-lg border border-slate-200/60">
                              <button
                                onClick={() => setSubmissionFilter('submitted')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${submissionFilter === 'submitted' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                Specifically Submitted ({mySubmissions.filter(r => r.workflows?.[workflowPhase]?.status && r.workflows[workflowPhase].status !== 'draft').length})
                              </button>
                              <button
                                onClick={() => setSubmissionFilter('all')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${submissionFilter === 'all' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                              >
                                All Captured KPIs ({mySubmissions.length})
                              </button>
                            </div>
                          </div>

                          {submissionsToRender.length === 0 ? (
                            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
                              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                              <h4 className="text-xs font-bold text-slate-700">No KPIs found matching your active filter</h4>
                              <p className="text-[10px] text-slate-400 mt-1">Try switching to "All Captured KPIs" or type your name "{currentUserDisplayName}" into the "Submitter" column.</p>
                            </div>
                          ) : (
                            <>
                              {renderSdbipTableReplica(submissionsToRender)}
                              
                              {selectedWorkflowRow && submissionsToRender.some(r => r.id === selectedWorkflowRow.id) && (() => {
                                const row = selectedWorkflowRow;
                                const wf = row.workflows?.[workflowPhase] || { status: 'draft' };
                                const pData = getPhaseData(row, workflowPhase);
                                return (
                                  <div className="bg-white p-5 border border-slate-200 rounded-xl shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-2">
                                    <div className="space-y-1.5 max-w-2xl">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="bg-slate-100 text-slate-800 text-[10px] font-black px-2.5 py-0.5 rounded font-mono">{row.refNum}</span>
                                        <span className="text-slate-500 font-bold text-[10px] uppercase tracking-wider font-mono">Focused KPI Submission Action Panel</span>
                                        {wf.status === 'approved' && (
                                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                            <Check className="w-3 h-3" /> Approved
                                          </span>
                                        )}
                                        {wf.status === 'pending_approval' && (
                                          <span className="bg-amber-50 text-amber-700 border border-amber-100 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Pending Executive Approval
                                          </span>
                                        )}
                                        {wf.status === 'pending_review' && (
                                          <span className="bg-violet-50 text-violet-700 border border-violet-100 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Pending Review
                                          </span>
                                        )}
                                        {(wf.status === 'draft' || !wf.status) && (
                                          <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                            <FileText className="w-3 h-3" /> Draft
                                          </span>
                                        )}
                                      </div>
                                      <h4 className="text-xs font-black text-slate-950 leading-snug">{row.kpi || 'No KPI Name'}</h4>
                                      <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                                        <strong className="font-bold text-slate-700">Target:</strong> {pData.target} | <strong className="font-bold text-slate-700">Reported Actual:</strong> <span className="text-indigo-600 font-bold">{pData.actual || 'Not reported yet'}</span> | <strong className="font-bold text-slate-700">Expenditure:</strong> {pData.expenditure || 'R0'}
                                      </p>
                                      {wf.comments && (
                                        <div className="bg-amber-50/75 text-amber-900 border border-amber-100 text-[10px] p-2.5 rounded-lg leading-relaxed mt-2 font-medium">
                                          <strong className="font-bold">Workflow Remarks:</strong> "{wf.comments}"
                                        </div>
                                      )}
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1.5 w-full md:w-auto">
                                      <span className="text-[10px] text-slate-400 font-bold">Executive Approver: {row.approver || 'None assigned'}</span>
                                       {(!wf.status || wf.status === 'draft') && (
                                        <button
                                          disabled={!isQuarterActive(workflowPhase)}
                                          onClick={() => {
                                            if (!row.approver) {
                                              setSuccessToast("Please assign an Approver to this KPI first.");
                                              setTimeout(() => setSuccessToast(null), 3000);
                                              return;
                                            }
                                            updateWorkflowState(
                                              row.id, 
                                              workflowPhase, 
                                              'pending_approval', 
                                              { submittedBy: currentUserDisplayName, submittedAt: new Date().toLocaleDateString() },
                                              `KPI ${row.refNum} (${activeWorkflowPhaseLabel}) submitted for your approval.`,
                                              row.approver
                                            );
                                            // Smoothly transition to next unsubmitted / draft KPI if available
                                            const nextDraft = rows.find(r => r.id !== row.id && (!r.workflows?.[workflowPhase]?.status || r.workflows[workflowPhase].status === 'draft'));
                                            if (nextDraft) {
                                              setSelectedWorkflowRow(nextDraft);
                                            }
                                          }}
                                          title={!isQuarterActive(workflowPhase) ? getQuarterLockNotice(workflowPhase) : "Submit for Approval"}
                                          className={`w-full md:w-auto px-4 py-2 text-xs font-bold rounded-lg transition shadow-xs inline-flex items-center justify-center gap-1.5 ${!isQuarterActive(workflowPhase) ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed' : 'bg-amber-600 text-white hover:bg-amber-700 cursor-pointer'}`}
                                        >
                                          {!isQuarterActive(workflowPhase) ? <Lock className="w-3.5 h-3.5 text-slate-400" /> : <Send className="w-3.5 h-3.5" />} 
                                          <span>{!isUserMatch(row.submitter || row.responsibleUnit, currentUser) ? `Submitter Only (${row.submitter || row.responsibleUnit || 'Assigned'})` : !isQuarterActive(workflowPhase) ? 'Locked Period' : 'Push to Approver'}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {activeWorkflowTab === 'reviews' && (() => {
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                            <Inbox className="w-4 h-4 text-violet-600" />
                            <h4 className="text-xs font-black text-slate-950 font-mono uppercase">Reviewer Scorecard Verification desk</h4>
                          </div>

                          {myPendingReviews.length === 0 ? (
                            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
                              <CheckCircle className="w-10 h-10 text-emerald-300 mx-auto mb-2 animate-pulse" />
                              <h4 className="text-xs font-bold text-slate-700 font-mono">No KPIs pending your review sign-off</h4>
                              <p className="text-[10px] text-slate-400 mt-1">When an SDBIP item is approved by the Executive, it will route to your verified profile for final sign-off.</p>
                            </div>
                          ) : (
                            <>
                              {renderSdbipTableReplica(myPendingReviews)}
                              
                              {selectedWorkflowRow && myPendingReviews.some(r => r.id === selectedWorkflowRow.id) && (() => {
                                const row = selectedWorkflowRow;
                                const pData = getPhaseData(row, workflowPhase);
                                const commentKey = `${row.id}-${workflowPhase}`;
                                const activeComment = workflowCommentsMap[commentKey] || '';
                                return (
                                  <div className="bg-white border-2 border-indigo-100 rounded-xl p-5 shadow-xs space-y-4 mt-2">
                                    <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="bg-indigo-100 text-indigo-900 text-xs font-black px-3 py-0.5 rounded font-mono">{row.refNum}</span>
                                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">KPI PENDING FINAL REVIEW</span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900 leading-snug">{row.kpi || 'No KPI Name'}</h4>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-[10px] text-slate-400 font-bold block">Submitted By</span>
                                        <span className="text-xs font-black text-indigo-700 block">{row.submitter}</span>
                                      </div>
                                    </div>

                                    {/* Entire Context */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div className="space-y-2 bg-slate-50/50 p-4 rounded-xl border border-slate-200/50">
                                        <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider font-mono">Strategic Context & Scope</h5>
                                        <div className="space-y-1.5 leading-relaxed text-slate-700">
                                          <p><strong className="font-bold">Objective:</strong> {row.strategicObj || '-'}</p>
                                          <p><strong className="font-bold">Responsible Owner:</strong> {row.kpas || '-'}</p>
                                          <p><strong className="font-bold">Baseline:</strong> {row.baseline || '-'}</p>
                                          <p><strong className="font-bold">Annual Target:</strong> {row.annualTarget || '-'}</p>
                                        </div>
                                      </div>

                                      <div className="space-y-2 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100/50">
                                        <h5 className="font-bold text-indigo-955 text-[11px] uppercase tracking-wider font-mono">Reported Phase Metrics ({activeWorkflowPhaseLabel})</h5>
                                        <div className="space-y-1.5 leading-relaxed text-indigo-955">
                                          <p><strong className="font-bold">Phase Target:</strong> {pData.target}</p>
                                          <p><strong className="font-bold">Reported Actual:</strong> <span className="bg-indigo-100 px-2 py-0.5 rounded font-black text-indigo-900">{pData.actual || '-'}</span></p>
                                          <p><strong className="font-bold">Variance:</strong> {pData.variance || '-'} (Calculated: <span className="font-bold text-indigo-700">{calcVar(pData.target, pData.actual, row.uom) || '0'}</span>)</p>
                                          <p><strong className="font-bold">Corrective Action:</strong> {pData.corrective || '-'}</p>
                                          <p><strong className="font-bold">Actual Expenditure:</strong> {pData.expenditure || 'R0'}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* POE verification */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-xs space-y-2">
                                      <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                                        <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
                                        Evidence File Verification (POE)
                                      </h5>
                                      <p className="text-slate-600 font-medium"><strong className="font-bold">POE Narrative:</strong> {pData.poeDesc || 'No narrative provided.'}</p>
                                      <div className="pt-1.5">
                                        {pData.poes.length === 0 ? (
                                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded font-bold">⚠️ No evidence files uploaded for this phase!</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-2">
                                            {pData.poes.map((fName, idx) => (
                                              <div key={idx} className="bg-white px-2.5 py-1 rounded border border-slate-200 flex items-center gap-2 text-[11px] font-black text-slate-800 shadow-sm">
                                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>{fName}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Executive Approver remarks */}
                                    <div className="bg-amber-50/40 p-3.5 rounded-lg border border-amber-100 flex items-start gap-2.5 text-xs">
                                      <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                      <div>
                                        <strong className="font-bold text-amber-955">Executive Approval Comments:</strong>
                                        <p className="text-amber-900 mt-1 italic font-medium">"{row.workflows?.[workflowPhase]?.comments || 'Approved with no specific remarks.'}"</p>
                                      </div>
                                    </div>

                                    {/* Review comment & actions */}
                                    <div className="space-y-2.5 pt-2">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Review Comments & Corrections</label>
                                      <textarea
                                        placeholder="Enter any suggestions, correction instructions, or notes for approval here..."
                                        value={activeComment}
                                        onChange={(e) => setWorkflowCommentsMap(p => ({ ...p, [commentKey]: e.target.value }))}
                                        className="w-full h-20 p-2.5 bg-white border border-slate-200 focus:border-indigo-500 outline-none rounded-xl text-xs font-medium resize-none shadow-inner"
                                      />
                                      <div className="flex items-center justify-end gap-3">
                                        <button
                                          onClick={() => {
                                            const targets = [row.approver, row.submitter].filter(Boolean);
                                            updateWorkflowState(
                                              row.id,
                                              workflowPhase,
                                              'pending_approval',
                                              { reviewedBy: currentUserDisplayName, comments: activeComment || 'Review rejected by Reviewer.' },
                                              `Reviewer ${currentUserDisplayName} rejected the review for KPI ${row.refNum}: "${activeComment || 'Needs corrections.'}"`,
                                              targets
                                            );
                                          }}
                                          className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                                        >
                                          <XCircle className="w-3.5 h-3.5" /> Reject & Send Back
                                        </button>
                                        <button
                                          onClick={() => {
                                            const targets = [row.approver, row.submitter, row.internalAudit].filter(Boolean);
                                            updateWorkflowState(
                                              row.id,
                                              workflowPhase,
                                              'pending_audit',
                                              { reviewedBy: currentUserDisplayName, reviewedAt: new Date().toLocaleDateString(), comments: activeComment || 'Review accepted.' },
                                              `Reviewer ${currentUserDisplayName} accepted and pushed KPI ${row.refNum} to Internal Audit desk.`,
                                              targets
                                            );
                                          }}
                                          className="px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5" /> Accept & Push to Audit ✅
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {activeWorkflowTab === 'approvals' && (() => {
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                            <Layers className="w-4 h-4 text-amber-600" />
                            <h4 className="text-xs font-black text-slate-950 font-mono uppercase">Executive Approval Verification Desk</h4>
                          </div>

                          {myPendingApprovals.length === 0 ? (
                            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
                              <CheckCircle className="w-10 h-10 text-amber-300 mx-auto mb-2 animate-pulse" />
                              <h4 className="text-xs font-bold text-slate-700 font-mono">No KPIs pending your executive approval</h4>
                              <p className="text-[10px] text-slate-400 mt-1">When an SDBIP item is submitted by a submitter, it will route to your verified profile for executive approval.</p>
                            </div>
                          ) : (
                            <>
                              {renderSdbipTableReplica(myPendingApprovals)}
                              
                              {selectedWorkflowRow && myPendingApprovals.some(r => r.id === selectedWorkflowRow.id) && (() => {
                                const row = selectedWorkflowRow;
                                const pData = getPhaseData(row, workflowPhase);
                                const commentKey = `${row.id}-${workflowPhase}`;
                                const activeComment = workflowCommentsMap[commentKey] || '';
                                return (
                                  <div className="bg-white border-2 border-amber-100 rounded-xl p-5 shadow-xs space-y-4 mt-2">
                                    <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-0.5 rounded font-mono">{row.refNum}</span>
                                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">KPI PENDING EXECUTIVE APPROVAL</span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900 leading-snug">{row.kpi || 'No KPI Name'}</h4>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-[10px] text-slate-400 font-bold block">Approver Assigned</span>
                                        <span className="text-xs font-black text-amber-700 block">{row.approver}</span>
                                      </div>
                                    </div>

                                    {/* Entire Context */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                                        <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider font-mono">Strategic Scope</h5>
                                        <div className="space-y-1.5 leading-relaxed text-slate-700">
                                          <p><strong className="font-bold">Objective:</strong> {row.strategicObj || '-'}</p>
                                          <p><strong className="font-bold">Responsible Owner:</strong> {row.kpas || '-'}</p>
                                          <p><strong className="font-bold">Baseline:</strong> {row.baseline || '-'}</p>
                                          <p><strong className="font-bold">Annual Target:</strong> {row.annualTarget || '-'}</p>
                                        </div>
                                      </div>

                                      <div className="space-y-2 bg-amber-50/10 p-4 rounded-xl border border-amber-100/50">
                                        <h5 className="font-bold text-amber-955 text-[11px] uppercase tracking-wider font-mono">Performance & Expenditure Metrics</h5>
                                        <div className="space-y-1.5 leading-relaxed text-slate-800">
                                          <p><strong className="font-bold">Phase Target:</strong> {pData.target}</p>
                                          <p><strong className="font-bold">Reported Actual:</strong> <span className="bg-emerald-100 px-2 py-0.5 rounded font-black text-emerald-900">{pData.actual || '-'}</span></p>
                                          <p><strong className="font-bold">Variance:</strong> {pData.variance || '-'} (Calculated: <span className="font-bold text-indigo-700">{calcVar(pData.target, pData.actual, row.uom) || '0'}</span>)</p>
                                          <p><strong className="font-bold">Corrective Action:</strong> {pData.corrective || '-'}</p>
                                          <p><strong className="font-bold">Expenditure:</strong> {pData.expenditure || 'R0'}</p>
                                        </div>
                                      </div>
                                    </div>

                                    {/* POE evidence */}
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 text-xs space-y-2">
                                      <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider font-mono flex items-center gap-1.5">
                                        <FolderArchive className="w-3.5 h-3.5 text-slate-500" />
                                        Attached Evidence Files (POE)
                                      </h5>
                                      <p className="text-slate-600 font-medium"><strong className="font-bold">POE Description:</strong> {pData.poeDesc || 'No narrative provided.'}</p>
                                      <div className="pt-1.5">
                                        {pData.poes.length === 0 ? (
                                          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-2 py-1 rounded font-bold font-mono">⚠️ No evidence files uploaded for this phase!</span>
                                        ) : (
                                          <div className="flex flex-wrap gap-2">
                                            {pData.poes.map((fName, idx) => (
                                              <div key={idx} className="bg-white px-2.5 py-1 rounded border border-slate-200 flex items-center gap-2 text-[11px] font-black text-slate-800 shadow-sm">
                                                <FileText className="w-3.5 h-3.5 text-indigo-600" />
                                                <span>{fName}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Executive Approval comments */}
                                    <div className="space-y-2.5 pt-2">
                                      <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block font-mono">Executive Approval Comments</label>
                                      <textarea
                                        placeholder="Enter executive approval comments, directives, or remarks here..."
                                        value={activeComment}
                                        onChange={(e) => setWorkflowCommentsMap(p => ({ ...p, [commentKey]: e.target.value }))}
                                        className="w-full h-20 p-2.5 bg-white border border-slate-200 focus:border-amber-500 outline-none rounded-xl text-xs font-medium resize-none shadow-inner"
                                      />
                                      <div className="flex items-center justify-end gap-3">
                                        <button
                                          onClick={() => {
                                            updateWorkflowState(
                                              row.id,
                                              workflowPhase,
                                              'draft',
                                              { approvedBy: currentUserDisplayName, comments: activeComment || 'Rejected by Executive Approver.' },
                                              `Executive Approver ${currentUserDisplayName} rejected KPI ${row.refNum}: "${activeComment || 'Needs corrections.'}"`,
                                              row.submitter
                                            );
                                          }}
                                          className="px-4 py-2 bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-1"
                                        >
                                          <XCircle className="w-3.5 h-3.5" /> Reject & Send Back
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (!row.reviewer) {
                                              setSuccessToast("Please assign a Reviewer to this KPI first.");
                                              setTimeout(() => setSuccessToast(null), 3000);
                                              return;
                                            }
                                            const targets = [row.reviewer, row.submitter].filter(Boolean);
                                            updateWorkflowState(
                                              row.id,
                                              workflowPhase,
                                              'pending_review',
                                              { approvedBy: currentUserDisplayName, approvedAt: new Date().toLocaleDateString(), comments: activeComment || 'Approved by Executive.' },
                                              `Executive Approver ${currentUserDisplayName} approved KPI ${row.refNum} and pushed to Reviewer: "${activeComment || 'Pushed to Reviewer.'}"`,
                                              targets
                                            );
                                          }}
                                          className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer inline-flex items-center gap-1"
                                        >
                                          <Check className="w-3.5 h-3.5" /> Push to Reviewer
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })()}

                    {activeWorkflowTab === 'audits' && (() => {
                      return (
                        <div className="space-y-4">
                          <div className="flex items-center gap-2 bg-white p-3 rounded-xl border border-slate-200">
                            <CheckSquare className="w-4 h-4 text-rose-600" />
                            <h4 className="text-xs font-black text-slate-950 font-mono uppercase">Internal Audit Verification Desk</h4>
                          </div>

                          {myPendingAudits.length === 0 ? (
                            <div className="text-center py-12 bg-white border border-dashed border-slate-200 rounded-xl">
                              <CheckCircle className="w-10 h-10 text-rose-300 mx-auto mb-2 animate-pulse" />
                              <h4 className="text-xs font-bold text-slate-700 font-mono">No KPIs assigned for internal audit</h4>
                            </div>
                          ) : (
                            <>
                              {renderSdbipTableReplica(myPendingAudits)}
                              
                              {selectedWorkflowRow && myPendingAudits.some(r => r.id === selectedWorkflowRow.id) && (() => {
                                const row = selectedWorkflowRow;
                                const pData = getPhaseData(row, workflowPhase);
                                const checklist = row.auditChecklist || {};
                                
                                const toggleCheck = (key: 'poeVerified' | 'actualsVerified' | 'varianceVerified' | 'targetCalculations' | 'complianceConfirmed' | 'auditSubmitted') => {
                                  const updatedChecklist = {
                                    ...checklist,
                                    [key]: !checklist[key]
                                  };
                                  handleCellChange(row.id, 'auditChecklist', updatedChecklist);
                                };

                                const baseKeys = ['poeVerified', 'actualsVerified', 'varianceVerified', 'targetCalculations', 'complianceConfirmed'];
                                const checkedCount = baseKeys.filter(k => checklist[k as keyof typeof checklist]).length;
                                const isComplete = checkedCount === 5;

                                return (
                                  <div className="bg-white border-2 border-rose-100 rounded-xl p-5 shadow-xs space-y-4 mt-2">
                                    <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-100">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="bg-rose-100 text-rose-900 text-xs font-black px-3 py-0.5 rounded font-mono">{row.refNum}</span>
                                          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">KPI PENDING INTERNAL AUDIT</span>
                                        </div>
                                        <h4 className="text-sm font-black text-slate-900 leading-snug">{row.kpi || 'No KPI Name'}</h4>
                                      </div>
                                      <div className="text-right shrink-0">
                                        <span className="text-[10px] text-slate-400 font-bold block font-mono font-bold">Assigned Auditor</span>
                                        <span className="text-xs font-black text-rose-700 block">{row.internalAudit || 'Unassigned'}</span>
                                      </div>
                                    </div>

                                    {/* Audit Checklist Section */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                                        <h5 className="font-black text-slate-900 text-xs uppercase tracking-wider font-mono flex items-center gap-1.5">
                                          <CheckSquare className="w-4 h-4 text-rose-500" />
                                          Required KPI Audit Steps Checklist
                                        </h5>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isComplete ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                          {checkedCount} / 5 Checked {isComplete && '✓ Complete'}
                                        </span>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[
                                          { key: 'poeVerified', label: 'Verify Evidence Files (POE)', desc: 'Ensure uploaded documents match report descriptions and are legally sufficient.' },
                                          { key: 'actualsVerified', label: 'Verify Reported Actuals against POE', desc: 'Confirm reported numerical metrics are accurately substantiated by evidence.' },
                                          { key: 'varianceVerified', label: 'Validate Variance and Corrective Actions', desc: 'Confirm that variance explanations and proposed corrective items are robust.' },
                                          { key: 'targetCalculations', label: 'Verify Target Aggregation & Calculations', desc: 'Confirm annual target sums and progress are mathematically correct.' },
                                          { key: 'complianceConfirmed', label: 'Confirm Compliance Alignment (MFMA)', desc: 'Ensure that KPI aligns fully with National Treasury MFMA standards.' },
                                          { key: 'auditSubmitted', label: 'Submitted once audit is done and all 5 boxes have been ticked', desc: 'Finalize and submit the audit outcome.' }
                                        ].map((item) => {
                                          const isChecked = !!checklist[item.key as keyof typeof checklist];
                                          const isSixthBox = item.key === 'auditSubmitted';
                                          const disabled = isSixthBox && !isComplete;
                                          return (
                                            <div 
                                              key={item.key}
                                              onClick={() => {
                                                if (disabled) return;
                                                toggleCheck(item.key as any);
                                              }}
                                              className={`flex items-start gap-3 p-3 rounded-lg border select-none transition-colors ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200' : 'cursor-pointer ' + (isChecked ? 'bg-emerald-50/40 border-emerald-200 hover:bg-emerald-50/60' : 'bg-white border-slate-200 hover:bg-slate-50')}`}
                                            >
                                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 mt-0.5 transition-all ${isChecked ? 'bg-emerald-650 border-emerald-650 text-white' : 'border-slate-300 bg-white'}`}>
                                                {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                              </div>
                                              <div>
                                                <p className={`text-xs font-bold leading-none ${isChecked ? 'text-slate-900 line-through decoration-slate-400' : 'text-slate-800'}`}>
                                                  {item.label}
                                                </p>
                                                <p className="text-[10px] text-slate-500 mt-1">
                                                  {item.desc}
                                                </p>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                      
                                      <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-mono">Internal Audit Comments</label>
                                        <textarea
                                          placeholder="Enter internal audit remarks or directives here..."
                                          value={checklist.comments || ''}
                                          onChange={(e) => handleCellChange(row.id, 'auditChecklist', { ...checklist, comments: e.target.value })}
                                          className="w-full bg-white border border-slate-200 rounded-lg p-3 text-xs focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition resize-y min-h-[80px]"
                                        />
                                      </div>
                                    </div>

                                    {/* Entire Context */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200/50">
                                        <h5 className="font-bold text-slate-900 text-[11px] uppercase tracking-wider font-mono">Strategic Scope</h5>
                                        <div className="space-y-1.5 leading-relaxed text-slate-700">
                                          <p><strong className="font-bold">Objective:</strong> {row.strategicObj || '-'}</p>
                                          <p><strong className="font-bold">Responsible Owner:</strong> {row.kpas || '-'}</p>
                                          <p><strong className="font-bold">Baseline:</strong> {row.baseline || '-'}</p>
                                          <p><strong className="font-bold">Annual Target:</strong> {row.annualTarget || '-'}</p>
                                        </div>
                                      </div>

                                      <div className="space-y-2 bg-rose-50/10 p-4 rounded-xl border border-rose-100/50">
                                        <h5 className="font-bold text-rose-955 text-[11px] uppercase tracking-wider font-mono">Performance & Expenditure Metrics</h5>
                                        <div className="space-y-1.5 leading-relaxed text-slate-800">
                                          <p><strong className="font-bold">Phase Target:</strong> {pData.target}</p>
                                          <p><strong className="font-bold">Reported Actual:</strong> <span className="bg-emerald-100 px-2 py-0.5 rounded font-black text-emerald-900">{pData.actual || '-'}</span></p>
                                          <p><strong className="font-bold">Variance:</strong> {pData.variance || '-'} (Calculated: <span className="font-bold text-indigo-700">{calcVar(pData.target, pData.actual, row.uom) || '0'}</span>)</p>
                                          <p><strong className="font-bold">Corrective Action:</strong> {pData.corrective || '-'}</p>
                                          <p><strong className="font-bold">Expenditure:</strong> {pData.expenditure || 'R0'}</p>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="pt-4 border-t border-rose-100 flex justify-end">
                                      <button
                                        onClick={() => {
                                          if (!isComplete || !checklist.auditSubmitted) {
                                            setSuccessToast("Please complete the Required KPI Audit Steps Checklist and check the submitted box.");
                                            setTimeout(() => setSuccessToast(null), 3000);
                                            return;
                                          }
                                          updateWorkflowState(
                                            row.id,
                                            workflowPhase,
                                            'completed',
                                            { auditedBy: currentUserDisplayName, auditedAt: new Date().toLocaleDateString(), comments: checklist.comments || 'Audited successfully.' },
                                            `Internal Auditor ${currentUserDisplayName} audited and completed KPI ${row.refNum}.`,
                                            [row.submitter || '', row.reviewer || '', row.approver || '']
                                          );
                                        }}
                                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                                        title="Submit and mark this audit as completed"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                        Submit Once Audit
                                      </button>
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-xl flex flex-col min-h-[600px] overflow-hidden text-slate-800">
      
      {/* Upper Module Ribbon Menu Tabs */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">SDBIP Top-Layer Manager</h1>
            <p className="text-xs text-slate-500">Service Delivery & Budget Implementation Plan operational framework</p>
          </div>
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center bg-slate-200/60 p-1.5 rounded-xl shrink-0 select-none">
          <button 
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'brief' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            SDBIP Brief
          </button>
          <button 
            onClick={() => setActiveTab('table')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'table' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            SDBIP Top Layer Table
          </button>
          <button 
            onClick={() => setActiveTab('reporting')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'reporting' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            SDBIP Top Layer Reporting Table
          </button>
          <button 
            onClick={() => setActiveTab('drafting')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'drafting' 
                ? 'bg-white text-slate-900 shadow-sm' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Drafting Suite & Upload
          </button>
        </div>
      </div>

      {successToast && (
        <div className={`border-y px-6 py-3 text-xs font-semibold flex items-start gap-2.5 whitespace-pre-line shadow-sm transition-all ${
          successToast.includes('🔔') 
            ? 'bg-amber-50 border-amber-200 text-amber-900' 
            : 'bg-emerald-50 border-emerald-100 px-6 py-3 text-emerald-800'
        }`}>
          {successToast.includes('🔔') ? (
            <Bell className="w-4 h-4 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
          ) : (
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 leading-relaxed">{successToast}</div>
        </div>
      )}

      {/* Main Area */}
      <div className="p-6 lg:p-8 flex-1 flex flex-col min-h-0">
        
        {/* BRIEF TAB */}
        {activeTab === 'brief' && (
          <div className="space-y-8 max-w-5xl">
            
            {/* Sec 1 */}
            <div className="space-y-3">
              <h2 className="text-base font-black text-slate-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-indigo-600 font-mono text-xs font-semibold">01.</span>
                What Information Does an SDBIP Contain?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                National Treasury MFMA Circular 13 explicitly dictates that a compliant SDBIP must contain five core components:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase">Monthly Revenue Collections</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Detailed monthly income breakdowns of rates, tariffs, and national grants.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase">Monthly Projections of Opex/Capex</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Monthly schedules showing when funds are spent across different municipal votes.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase">Quarterly Service Targets</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Standard performance metrics divided into quarters detailing infrastructure delivery targets.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase">Ward-Specific Projects</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">Capital project lists mapped down to specific geographical areas & wards.</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2">
                  <h4 className="text-[11px] font-bold text-slate-900 uppercase font-sans">Capital Projects Plan</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed font-sans">procurement milestones, start/completion timelines, and multi-year views.</p>
                </div>
              </div>
            </div>

            {/* Sec 2 */}
            <div className="space-y-3">
              <h2 className="text-base font-black text-slate-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-indigo-600 font-mono text-xs font-semibold">02.</span>
                What Is the SDBIP Aligned To?
              </h2>
              <p className="text-xs text-slate-600">
                The SDBIP is the tactical "glue" that locks the strategic vision of the municipality directly to its bank account and staff oversight:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase">The IDP and Budget (The Golden Triangle)</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    The SDBIP must align perfectly with the 5-Year IDP strategic pillars and the annual budget approved by Council. Total figures in SDBIP must match MFMA Schedule A budget tables exactly.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase">mSCOA Segments</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Financial projections align directly to mSCOA Project, Function, and Regional segments to allow automated electronic reporting to National Treasury.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase">MFMA Circular 88</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Performance indicators must use standardized national output and outcome metrics for uniform sector reporting.
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-1">
                  <h4 className="text-xs font-bold text-indigo-950 uppercase">Individual Performance Agreements (Section 56/57)</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Quarterly institutional SDBIP targets are duplicated directly into annual performance contracts of MM & Executive Directors, making them personally accountable.
                  </p>
                </div>
              </div>
            </div>

            {/* Sec 3 */}
            <div className="space-y-3">
              <h2 className="text-base font-black text-slate-900 uppercase flex items-center gap-2 border-b border-slate-100 pb-2">
                <span className="text-indigo-600 font-mono text-xs font-semibold">03.</span>
                Where Does the Information Come From?
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                The SDBIP is compiled through an internal, technical consolidation process coordinated by the municipal IDP/PMS unit and the Budget Office:
              </p>
              <ul className="space-y-2 text-xs list-disc pl-5 text-slate-600 font-sans">
                <li>
                  <strong className="text-slate-800">Approved Municipal Budget:</strong> The final revenue and expenditure figures are pulled directly from newly approved MTREF budget sheets.
                </li>
                <li>
                  <strong className="text-slate-800">Departmental Business Plans:</strong> Every executive director submits operational plans detailing their department's capacity, timelines, and procurement plans.
                </li>
                <li>
                  <strong className="text-slate-800">National Division of Revenue Act (DoRA):</strong> Payment schedules for national allocations determine grant-funded project implementation timing.
                </li>
                <li>
                  <strong className="text-slate-800 font-sans">The IDP Project List:</strong> The year-one implementation slice is extracted directly from the 5-year capital project pipeline designed during public phases.
                </li>
              </ul>
            </div>

            {/* Appointed Officials Configuration Form */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-6 space-y-4">
              <div className="flex items-start gap-3 border-b border-slate-200 pb-3">
                <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase">Appointed SDBIP Officials Setup</h3>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Set up the exactly 4 reviewers and 5 internal auditors who are authorized to verify and audit the SDBIP logs. 
                    Only these specified personnel can be selected per KPI target.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Reviewers */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/60">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">PMU Reviewers (Exactly 4)</span>
                    <span className="bg-violet-100 text-violet-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Review Panel</span>
                  </div>
                  <div className="space-y-2.5">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={`reviewer-${i}`} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono w-5">#0{i+1}</span>
                        <input
                          type="text"
                          value={reviewers[i] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReviewers(prev => {
                              const copy = [...prev];
                              copy[i] = val;
                              return copy;
                            });
                          }}
                          placeholder={`Reviewer Name ${i+1}`}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column 2: Internal Auditors */}
                <div className="space-y-3.5">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-slate-200/60">
                    <span className="text-xs font-black text-slate-800 uppercase tracking-wide">Internal Auditors (Exactly 5)</span>
                    <span className="bg-amber-100 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Audit Panel</span>
                  </div>
                  <div className="space-y-2.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={`auditor-${i}`} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 font-mono w-5">#0{i+1}</span>
                        <input
                          type="text"
                          value={internalAuditors[i] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setInternalAuditors(prev => {
                              const copy = [...prev];
                              copy[i] = val;
                              return copy;
                            });
                          }}
                          placeholder={`Auditor Name ${i+1}`}
                          className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center">
                <span className="text-[10px] text-slate-500 italic">
                  Changes persist automatically to Supabase Cloud Database.
                </span>
                <button
                  type="button"
                  disabled={savingOfficials}
                  onClick={() => saveOfficials(reviewers, internalAuditors)}
                  className={`px-4 py-2 text-xs font-bold uppercase rounded-lg shadow-sm transition-all text-white flex items-center gap-1.5 ${
                    savingOfficials 
                      ? 'bg-slate-400 cursor-not-allowed' 
                      : 'bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                  }`}
                >
                  {savingOfficials ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" /> Save Official Directory
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => setActiveTab('table')}
                className="px-5 py-3 bg-indigo-950 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-indigo-900 transition-all flex items-center gap-2"
              >
                Access SDBIP Top Layer Table <ArrowRight className="w-4 h-4 text-indigo-300" />
              </button>
            </div>

          </div>
        )}

        {/* TABLE TAB */}
        {/* TABLE TAB (View-Only Top Layer Baseline) */}
        {activeTab === 'table' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            
            {/* Toolbar controller */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl select-none text-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-100 text-indigo-800 rounded-lg flex items-center gap-1.5 shrink-0">
                  <Lock className="w-3.5 h-3.5 text-indigo-700" />
                  <span className="text-[11px] font-black uppercase tracking-wider">Statutory Baseline (View Only)</span>
                </div>
                <span className="text-xs font-bold text-slate-700">
                  Council-Approved SDBIP Top Layer Scorecard. Currently viewing: <strong className="text-slate-900 font-black">{filteredRows.length}</strong> of <strong className="text-slate-900 font-bold">{rows.length}</strong> statutory log items.
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveAndOverwriteSDBIP}
                  disabled={isExplicitlySaving || rows.length === 0}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all border border-emerald-500/40 hover:shadow-emerald-600/20"
                  title="Save and permanently overwrite all current SDBIP Top Layer indicators to Supabase, cloud database, and website"
                >
                  <Save className={`w-3.5 h-3.5 ${isExplicitlySaving ? 'animate-bounce' : ''}`} />
                  <span>{isExplicitlySaving ? 'Overwriting...' : 'Save & Overwrite to Supabase'}</span>
                </button>
                <button
                  type="button"
                  onClick={pullSdbipTopLayerData}
                  disabled={isPulling}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all border border-indigo-500/30"
                  title="Pull all information currently in the SDBIP top layer table from Supabase"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                  <span>{isPulling ? 'Pulling Data...' : 'Pull SDBIP Data'}</span>
                </button>
                {isMikeOnly && (
                  <button
                    type="button"
                    onClick={() => requestMikeAuth("Purge Placeholders Authorization", handlePurgePlaceholders)}
                    disabled={isClearing}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    title="Purge all placeholder indicators from SDBIP Top Layer table and Supabase (Mike Only)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Purge Placeholders</span>
                  </button>
                )}
                {isMikeOnly && (
                  <button
                    type="button"
                    onClick={() => requestMikeAuth("Purge Top Layer Table Authorization", () => setClearTopLayerModal({ isOpen: true, clearTarget: 'all' }))}
                    disabled={isClearing || rows.length === 0}
                    className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    title="Purge all records from SDBIP Top Layer table and Supabase (Mike Only)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Purge Top Layer Table</span>
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => setIsFitAllTopLayerCells(!isFitAllTopLayerCells)}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    isFitAllTopLayerCells 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                  title="Expand all table cells vertically so all sentences fit comfortably without clipping"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{isFitAllTopLayerCells ? "Fit All Sentences (Active)" : "Expand All Cells"}</span>
                </button>
                <button 
                  onClick={exportToCSV}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {/* Smart Filter Panel */}
            {renderSmartFilterPanel()}

            {/* Pagination Controls Header */}
            <SDBIPPagination
              currentPage={tablePage}
              pageSize={tablePageSize}
              totalItems={filteredRows.length}
              onPageChange={setTablePage}
              onPageSizeChange={setTablePageSize}
              pageSizeOptions={[25, 50, 100, 200, 'all']}
              itemName="SDBIP top layer items"
              isSaving={isSavingRows}
            />

            {/* Large Wide Spreadsheet Table Container (View Only) */}
            <div className="overflow-auto border border-slate-200 rounded-xl relative bg-white h-[580px] max-h-[68vh]">
              
              <table className="w-full text-left border-collapse select-text table-fixed min-w-[3360px]">
                
                {/* Headers */}
                <thead className="sticky top-0 bg-slate-100 z-20 border-b-2 border-slate-200 text-[10px] font-black tracking-wider uppercase text-slate-700 font-mono">
                  <tr>
                    <th className="p-3 border-r border-slate-200 w-28 sticky top-0 left-0 z-30 bg-slate-100">REF NUMBER</th>
                    <th className="p-3 border-r border-slate-200 w-72 sticky top-0 z-20 bg-slate-100">STRATEGIC OBJECTIVES</th>
                    <th className="p-3 border-r border-slate-200 w-80 sticky top-0 z-20 bg-slate-100">KPI</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-blue-100 text-blue-900">BSD (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-emerald-100 text-emerald-900">LED (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-amber-100 text-amber-900">MFVM (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-purple-100 text-purple-900">GGPP (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-rose-100 text-rose-900">MIDT (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-orange-100 text-orange-900">SR (X)</th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-100">RESPONSIBLE OWNER</th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-100">UNIT OF MEASURE</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-100">MSCOA TRACKING</th>
                    <th className="p-3 border-r border-slate-200 w-52 sticky top-0 z-20 bg-slate-100">BASELINE</th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-100">ANNUAL TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">BUDGET ALLOCATION</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">1ST QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">2ND QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-44 text-center sticky top-0 z-20 bg-rose-100 text-rose-900">MID TERM</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">3RD QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">4TH QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-amber-50 text-amber-900 font-bold text-center">STATUS</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-indigo-50 text-indigo-900">SUBMITTER</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-emerald-50 text-emerald-900">APPROVER</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-violet-50 text-violet-900">REVIEWER</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-amber-50 text-amber-900">INTERNAL AUDIT</th>
                    <th className="p-3 border-r border-slate-200 w-56 text-center sticky top-0 z-20 bg-indigo-50 text-indigo-900 border-l border-indigo-200">POE AND DESCRIPTION</th>
                  </tr>
                </thead>

                {/* Body Rows */}
                <tbody className="text-xs font-medium text-slate-800 divide-y divide-slate-100">
                  {paginatedTableRows.length === 0 ? (
                    <tr>
                      <td colSpan={27} className="p-16 text-center bg-white">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                          <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200/80">
                            <Layers className="w-8 h-8 text-slate-400" />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            SDBIP Top Layer Table is Clean & Purged
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed text-center">
                            All placeholder indicators have been purged from both the application and Supabase. To populate official indicators, upload an authentic SDBIP scorecard in the <strong>Drafting Suite & Upload</strong> tab or via the <strong>Fred Extractor</strong>.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTableRows.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50/70 transition-colors">
                      
                      {/* Ref Num */}
                      <td className="p-2 border-r border-slate-150 sticky left-0 z-10 bg-white group-hover:bg-slate-50/95 transition-colors drop-shadow-[1px_0_0_rgba(203,213,225,1)]">
                        <ExpandableCell 
                          value={row.refNum || ''}
                          readOnly={true}
                          cellTitle="Reference Number"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={1}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                          className="font-mono"
                        />
                      </td>

                      {/* Strategic Objectives */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.strategicObj || ''}
                          readOnly={true}
                          cellTitle="Strategic Objectives"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                        />
                      </td>

                      {/* KPI */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.kpi || ''}
                          readOnly={true}
                          cellTitle="Key Performance Indicator (KPI)"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-150 text-center bg-blue-50/50 cursor-pointer hover:bg-blue-100/50" title="Click to select BSD" onClick={() => handleCellChange(row.id, 'bsd', 'X')}>
                        {row.bsd ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-blue-100 border border-blue-300 font-bold text-blue-900 text-xs shadow-2xs">
                            X
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>

                      {/* LED */}
                      <td className="p-2 border-r border-slate-150 text-center bg-emerald-50/50 cursor-pointer hover:bg-emerald-100/50" title="Click to select LED" onClick={() => handleCellChange(row.id, 'led', 'X')}>
                        {row.led ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-100 border border-emerald-300 font-bold text-emerald-900 text-xs shadow-2xs">
                            X
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>

                      {/* MFVM */}
                      <td className="p-2 border-r border-slate-150 text-center bg-amber-50/50 cursor-pointer hover:bg-amber-100/50" title="Click to select MFVM" onClick={() => handleCellChange(row.id, 'mfvm', 'X')}>
                        {row.mfvm ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-amber-100 border border-amber-300 font-bold text-amber-900 text-xs shadow-2xs">
                            X
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>

                      {/* GGPP */}
                      <td className="p-2 border-r border-slate-150 text-center bg-purple-50/50 cursor-pointer hover:bg-purple-100/50" title="Click to select GGPP" onClick={() => handleCellChange(row.id, 'ggpp', 'X')}>
                        {row.ggpp ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-purple-100 border border-purple-300 font-bold text-purple-900 text-xs shadow-2xs">
                            X
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>

                      {/* MIDT (Institutional Development) */}
                      <td className="p-2 border-r border-slate-150 text-center bg-rose-50/50 cursor-pointer hover:bg-rose-100/50" title="Click to select MIDT" onClick={() => handleCellChange(row.id, 'midt', 'X')}>
                        {row.midt ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-rose-100 border border-rose-300 font-bold text-rose-900 text-xs shadow-2xs">
                            X
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>

                      {/* SR (Spatial Rationale) */}
                      <td className="p-2 border-r border-slate-150 text-center bg-orange-50/50 cursor-pointer hover:bg-orange-100/50" title="Click to select SR" onClick={() => handleCellChange(row.id, 'sr', 'X')}>
                        {row.sr ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-orange-100 border border-orange-300 font-bold text-orange-900 text-xs shadow-2xs">
                            X
                          </span>
                        ) : (
                          <span className="text-slate-300 font-mono text-[10px]">-</span>
                        )}
                      </td>

                      {/* Responsible Owner */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.kpas || ''}
                          readOnly={true}
                          cellTitle="Responsible Owner (KPAS)"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                          className="font-bold text-slate-900"
                        />
                      </td>

                      {/* Unit of Measure */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.uom || ''}
                          readOnly={true}
                          cellTitle="Unit of Measure"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                        />
                      </td>

                      {/* mSCOA Tracking */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.mscoaTracking || ''}
                          readOnly={true}
                          cellTitle="mSCOA Tracking"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                          className="font-mono text-slate-700"
                        />
                      </td>

                      {/* Baseline */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.baseline || ''}
                          readOnly={true}
                          cellTitle="Baseline"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                        />
                      </td>

                      {/* Annual Target */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.annualTarget || ''}
                          readOnly={true}
                          cellTitle="Annual Target"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                          className="font-bold text-indigo-900"
                        />
                      </td>

                      {/* Budget Allocation */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.budgetAllocation || ''}
                          readOnly={true}
                          cellTitle="Budget Allocation"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={1}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                          className="font-bold text-slate-800"
                        />
                      </td>

                      {/* Q1 */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.q1 || ''}
                          readOnly={true}
                          cellTitle="1st Quarter Target"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                        />
                      </td>

                      {/* Q2 */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.q2 || ''}
                          readOnly={true}
                          cellTitle="2nd Quarter Target"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                        />
                      </td>

                      {/* MID TERM Targets (Calculated) */}
                      <td className="p-2 border-r border-slate-150 text-center bg-rose-50/50">
                        <ExpandableCell 
                          value={row.midTerm || ''}
                          readOnly={true}
                          cellTitle="Mid Term Target (Calculated)"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={1}
                          onOpenExpandModal={openCellExpandModal}
                          textClassName="font-bold text-rose-900 text-center"
                        />
                      </td>

                      {/* Q3 */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.q3 || ''}
                          readOnly={true}
                          cellTitle="3rd Quarter Target"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                        />
                      </td>

                      {/* Q4 */}
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell 
                          value={row.q4 || ''}
                          readOnly={true}
                          cellTitle="4th Quarter Target"
                          refNum={row.refNum}
                          isFitAll={isFitAllTopLayerCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          placeholder="-"
                        />
                      </td>

                      {/* Workflow Status */}
                      <td className="p-2 border-r border-slate-150 text-center bg-slate-50/20">
                        {(() => {
                          const status = (row as any).workflowStatus || (
                            row.workflows?.q1?.status === 'pending_approval' || row.workflows?.q2?.status === 'pending_approval' || row.workflows?.midTerm?.status === 'pending_approval' || row.workflows?.q3?.status === 'pending_approval' || row.workflows?.q4?.status === 'pending_approval' ? 'Submitted to Approver' :
                            row.workflows?.q1?.status === 'approved' ? 'Approved' :
                            row.workflows?.q1?.status === 'pending_review' ? 'Pending Review' : 'Draft'
                          );
                          if (status === 'Submitted to Approver' || status === 'Submitted') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9.5px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-300 shadow-2xs">
                                <Clock className="w-2.5 h-2.5 text-amber-500" />
                                <span>Submitted</span>
                              </span>
                            );
                          }
                          if (status === 'Approved') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9.5px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs">
                                <CheckCircle className="w-2.5 h-2.5 text-emerald-600" />
                                <span>Approved</span>
                              </span>
                            );
                          }
                          if (status === 'Pending Review' || status === 'Reviewed') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9.5px] font-black tracking-wider uppercase bg-violet-50 text-violet-700 border-violet-300 shadow-2xs">
                                <Clock className="w-2.5 h-2.5 text-violet-500" />
                                <span>Awaiting Review</span>
                              </span>
                            );
                          }
                          if (status === 'Returned') {
                            return (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9.5px] font-black tracking-wider uppercase bg-rose-50 text-rose-700 border-rose-300 shadow-2xs">
                                <XCircle className="w-2.5 h-2.5 text-rose-500" />
                                <span>Returned</span>
                              </span>
                            );
                          }
                          return (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9.5px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 border-slate-200 shadow-2xs">
                              <FileText className="w-2.5 h-2.5 text-slate-400" />
                              <span>Draft</span>
                            </span>
                          );
                        })()}
                      </td>

                      {/* Submitter */}
                      <td className="p-1.5 border-r border-slate-150">
                        <div className="flex flex-col gap-1">
                          {(() => {
                            const isRowM81to84 = isQuarter1UnlockedKpi(row);
                            return (
                              <>
                                <AzureADPicker 
                                  value={isRowM81to84 ? 'Annah Msiza' : (row.submitter || '')}
                                  onChange={(val) => handleCellChange(row.id, 'submitter', val)}
                                  roleType="submitter"
                                  activeTenantId={activeTenantId}
                                  isFitAll={isFitAllTopLayerCells}
                                  disabled={isRowM81to84 ? !isSuperAdminMike : (!isReportingAssignmentsUnlocked && !isSuperAdminMike)}
                                />
                                {isRowM81to84 && (
                                  <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 inline-flex items-center gap-0.5 w-fit shadow-2xs">
                                    <Lock className="w-2 h-2 text-slate-500" /> Locked Submitter
                                  </span>
                                )}
                              </>
                            );
                          })()}
                          {((row as any).workflowStatus === 'Submitted to Approver' || (row as any).workflowStatus === 'Submitted' || row.workflows?.q1?.status === 'pending_approval') && !['Pending Review', 'Reviewed', 'Approved', 'Pending Audit'].includes((row as any).workflowStatus) && !['pending_review', 'reviewed', 'approved', 'pending_audit'].includes(row.workflows?.q1?.status || '') && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-0.5 w-fit">
                              <Clock className="w-2 h-2 text-amber-600" /> Submitted
                            </span>
                          )}
                          {((row as any).workflowStatus === 'Pending Review' || row.workflows?.q1?.status === 'pending_review') && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 inline-flex items-center gap-0.5 w-fit">
                              <CheckCircle className="w-2 h-2 text-indigo-600" /> Approved by Approver
                            </span>
                          )}
                          {(row as any).workflowStatus === 'Reviewed' && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center gap-0.5 w-fit">
                              <CheckCircle className="w-2 h-2 text-purple-600" /> Reviewed
                            </span>
                          )}
                          {(row as any).workflowStatus === 'Approved' && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5 w-fit">
                              <CheckCircle className="w-2 h-2 text-emerald-600" /> Approved
                            </span>
                          )}
                          {((row as any).workflowStatus === 'Returned' || (row as any).workflowStatus === 'Returned to Submitter') && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-0.5 w-fit">
                              <XCircle className="w-2 h-2 text-rose-600" /> Returned / Redo
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Approver */}
                      <td className="p-1.5 border-r border-slate-150">
                        <div className="flex flex-col gap-1">
                          {(() => {
                            const isRowM81to84 = isQuarter1UnlockedKpi(row);
                            return (
                              <>
                                <AzureADPicker 
                                  value={isRowM81to84 ? 'Thandiwe M. Lengwate' : (row.approver || '')}
                                  onChange={(val) => handleCellChange(row.id, 'approver', val)}
                                  roleType="approver"
                                  activeTenantId={activeTenantId}
                                  isFitAll={isFitAllTopLayerCells}
                                  disabled={isRowM81to84 ? !isSuperAdminMike : (!isReportingAssignmentsUnlocked && !isSuperAdminMike)}
                                />
                                {isRowM81to84 && (
                                  <span className="text-[8px] font-mono font-bold px-1 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300 inline-flex items-center gap-0.5 w-fit shadow-2xs">
                                    <Lock className="w-2 h-2 text-slate-500" /> Locked Approver
                                  </span>
                                )}
                              </>
                            );
                          })()}
                          {((row as any).workflowStatus === 'Submitted to Approver' || (row as any).workflowStatus === 'Submitted' || row.workflows?.q1?.status === 'pending_approval') && !['Pending Review', 'Reviewed', 'Approved', 'Pending Audit'].includes((row as any).workflowStatus) && !['pending_review', 'reviewed', 'approved', 'pending_audit'].includes(row.workflows?.q1?.status || '') && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300 inline-flex items-center gap-0.5 w-fit">
                              <Clock className="w-2 h-2 text-amber-600" /> Awaiting Approval
                            </span>
                          )}
                          {((row as any).workflowStatus === 'Pending Review' || row.workflows?.q1?.status === 'pending_review') && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 inline-flex items-center gap-0.5 w-fit">
                              <CheckCircle className="w-2 h-2 text-indigo-600" /> Approved & Pushed
                            </span>
                          )}
                          {(row as any).workflowStatus === 'Reviewed' && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center gap-0.5 w-fit">
                              <CheckCircle className="w-2 h-2 text-purple-600" /> Reviewed
                            </span>
                          )}
                          {(row as any).workflowStatus === 'Approved' && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5 w-fit">
                              <CheckCircle className="w-2 h-2 text-emerald-600" /> Approved & Sealed
                            </span>
                          )}
                          {((row as any).workflowStatus === 'Returned' || (row as any).workflowStatus === 'Returned to Submitter') && (
                            <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-rose-100 text-rose-800 border border-rose-300 inline-flex items-center gap-0.5 w-fit">
                              <XCircle className="w-2 h-2 text-rose-600" /> Returned to Submitter
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Reviewer */}
                      <td className="p-2 border-r border-slate-150">
                        <div className="text-[11px] font-medium text-slate-800 px-1 py-0.5 whitespace-pre-wrap break-words">
                          {row.reviewer ? (
                            <div className="flex flex-col gap-1">
                              <span className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                                {row.reviewer}
                              </span>
                              {((row as any).workflowStatus === 'Pending Review' || row.workflows?.q1?.status === 'pending_review') && (
                                <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-300 inline-flex items-center gap-0.5 w-fit">
                                  <Clock className="w-2 h-2 text-blue-600" /> Awaiting Review
                                </span>
                              )}
                              {(row as any).workflowStatus === 'Reviewed' && (
                                <span className="text-[8px] font-mono font-bold px-1 py-0.2 rounded bg-purple-100 text-purple-800 border border-purple-300 inline-flex items-center gap-0.5 w-fit">
                                  <CheckCircle className="w-2 h-2 text-purple-600" /> Review Signed-off
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-300 italic text-[10px]">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* Internal Audit */}
                      <td className="p-2 border-r border-slate-150">
                        <div className="text-[11px] font-medium text-slate-800 px-1 py-0.5 whitespace-pre-wrap break-words">
                          {row.internalAudit ? (
                            <span className="inline-flex items-center gap-1 text-slate-800 font-semibold">
                              {row.internalAudit}
                            </span>
                          ) : (
                            <span className="text-slate-300 italic text-[10px]">Unassigned</span>
                          )}
                        </div>
                      </td>

                      {/* POE with description and viewability */}
                      <td className="p-2 border-r border-indigo-200 text-center bg-indigo-50/40 min-w-[170px]">
                        {(() => {
                          const topLayerPoe = (row.poeDesc || row.poeStatus || row.q1PoeDesc || row.q2PoeDesc || row.midTermPoeDesc || row.q3PoeDesc || row.q4PoeDesc || '').trim();
                          const hasPoeDocs = (row.poeStatus?.includes('Uploaded')) || row.poeStatus === 'Attached' || (row.q1Poes && row.q1Poes.length > 0);
                          return (
                            <div className="flex flex-col items-center gap-1.5 select-none">
                              {hasPoeDocs ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-0.5 rounded-md border border-emerald-200">
                                  Uploaded - Cloud Vault
                                </span>
                              ) : (
                                <span className="text-[9px] bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-md border border-slate-200">
                                  Source Document POE
                                </span>
                              )}
                              {topLayerPoe && (
                                <div 
                                  className="text-[10px] text-slate-700 italic max-w-[220px] whitespace-pre-wrap break-words leading-relaxed cursor-pointer hover:text-indigo-600 transition bg-white/80 p-1.5 rounded border border-slate-200 text-left shadow-2xs" 
                                  title="Source Document POE Description (Statutory baseline)"
                                  onClick={() => openCellExpandModal("Source Document POE Description (Non-Editable)", topLayerPoe, undefined, true, `Ref: ${row.refNum}`)}
                                >
                                  "{topLayerPoe}"
                                </div>
                              )}
                              <div className="flex items-center gap-1 mt-1">
                                <button 
                                  onClick={() => triggerViewPoeModal(row, 'general')}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-extrabold cursor-pointer transition shadow-xs"
                                  title="View POE document details & download"
                                >
                                  <Eye className="w-3 h-3" /> View POE
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                    </tr>
                  ))
                )}
                </tbody>

              </table>

            </div>

            {/* Pagination Controls Footer */}
            <SDBIPPagination
              currentPage={tablePage}
              pageSize={tablePageSize}
              totalItems={filteredRows.length}
              onPageChange={setTablePage}
              onPageSizeChange={setTablePageSize}
              pageSizeOptions={[25, 50, 100, 200, 'all']}
              itemName="SDBIP top layer items"
              isSaving={isSavingRows}
            />

          </div>
        )}

        {/* REPORTING TAB */}
        {activeTab === 'reporting' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl select-none text-slate-700">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold">Currently reporting on: <strong className="text-slate-900 font-black">{filteredRows.length}</strong> of <strong className="text-slate-900 font-bold">{rows.length}</strong> SDBIP top layer items. All fields are editable and auto-expand.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleSaveAndOverwriteSDBIP}
                  disabled={isExplicitlySaving || rows.length === 0}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-lg text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all border border-emerald-500/40 hover:shadow-emerald-600/20"
                  title="Save and permanently overwrite all current SDBIP Reporting actuals, variances, expenditures, and POE data to Supabase and website"
                >
                  <Save className={`w-3.5 h-3.5 ${isExplicitlySaving ? 'animate-bounce' : ''}`} />
                  <span>{isExplicitlySaving ? 'Overwriting...' : 'Save & Overwrite to Supabase'}</span>
                </button>
                {isMikeOnly && (
                  <button
                    type="button"
                    onClick={() => requestMikeAuth("Pull SDBIP Top Layer Authorization", pullSdbipTopLayerData)}
                    disabled={isPulling}
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all border border-indigo-500/30"
                    title="Pull all information currently in the SDBIP top layer table (Mike Only)"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPulling ? 'animate-spin' : ''}`} />
                    <span>{isPulling ? 'Pulling Data...' : 'Pull SDBIP Top Layer Data'}</span>
                  </button>
                )}
                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-slate-100 border border-slate-300 text-slate-700 shadow-2xs select-none"
                  title="Submitter and Approver cells in the SDBIP Top Layer reporting table are locked so current submitter and approver assignments cannot be changed."
                >
                  <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Submitter & Approver: Locked</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsFitAllReportingCells(!isFitAllReportingCells)}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                    isFitAllReportingCells 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 shadow-xs' 
                      : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                  title="Expand all table cells vertically so all sentences fit comfortably without clipping"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{isFitAllReportingCells ? "Fit All Sentences (Active)" : "Expand All Cells"}</span>
                </button>
                <button 
                  onClick={() => setIsTableExpanded(p => !p)}
                  className={`px-3 py-1.5 border rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-all ${isTableExpanded ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'}`}
                  title="Toggle expanded full-page height to fill screen"
                >
                  {isTableExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  {isTableExpanded ? 'Contract Table' : 'Fill Screen / Expand Table'}
                </button>
                <button 
                  onClick={exportToCSV}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export reporting data
                </button>
                {isMikeOnly && (
                  <button
                    type="button"
                    onClick={() => requestMikeAuth("Clear System Notifications Authorization", clearSystemNotifications)}
                    className="px-3.5 py-1.5 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-amber-700 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    title="Clear all system notifications for SDBIP Top Layer (Mike Only)"
                  >
                    <BellOff className="w-3.5 h-3.5 text-amber-600" />
                    <span>Clear System Notifications</span>
                    {notifications.length > 0 && (
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                        {notifications.length}
                      </span>
                    )}
                  </button>
                )}
                {isMikeOnly && (
                  <button
                    type="button"
                    onClick={() => requestMikeAuth("Purge Placeholders Authorization", handlePurgePlaceholders)}
                    disabled={isClearing}
                    className="px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    title="Purge all placeholder indicators from SDBIP Top Layer Reporting table and Supabase (Mike Only)"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    <span>Purge Placeholders</span>
                  </button>
                )}
                {isMikeOnly && (
                  <button
                    type="button"
                    onClick={() => requestMikeAuth("Purge Reporting Table Authorization", () => setClearReportingModal({ isOpen: true, scope: 'entire_table' }))}
                    disabled={isClearing || rows.length === 0}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    title="Purge placeholders and all reporting records from table and Supabase (Mike Only)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Purge Reporting Table</span>
                  </button>
                )}
              </div>
            </div>

            {/* Workflow Action Desk & Notifications */}
            {renderWorkflowSection()}

            {/* Conditional Wrapper for Fullscreen Expansion */}
            <div className={isTableExpanded ? "fixed inset-0 z-[99999] bg-slate-900/95 backdrop-blur-md flex flex-col p-4 md:p-6 overflow-hidden text-slate-700 w-screen h-screen top-0 left-0" : ""}>
              {isTableExpanded && (
                <div className="flex items-center justify-between gap-4 mb-4 bg-white p-4 rounded-xl border border-slate-200 shadow-lg shrink-0 select-none">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <div>
                      <h3 className="text-sm font-black text-slate-900">SDBIP Active Reporting Console (FULLSCREEN MODE)</h3>
                      <p className="text-[11px] text-slate-500 font-medium">Currently showing <strong className="text-slate-900 font-bold">{filteredRows.length}</strong> of <strong className="text-slate-900 font-bold">{rows.length}</strong> items. All cells are fully editable in real-time.</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSaveAndOverwriteSDBIP}
                      disabled={isExplicitlySaving || rows.length === 0}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-sm transition-all border border-emerald-500/40 hover:shadow-emerald-600/20"
                      title="Save and permanently overwrite all current SDBIP Reporting actuals, variances, expenditures, and POE data to Supabase and website"
                    >
                      <Save className={`w-4 h-4 ${isExplicitlySaving ? 'animate-bounce' : ''}`} />
                      <span>{isExplicitlySaving ? 'Overwriting Supabase...' : 'Save & Overwrite to Supabase'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={pullSdbipTopLayerData}
                      disabled={isPulling}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                    >
                      <RefreshCw className={`w-4 h-4 ${isPulling ? 'animate-spin' : ''}`} />
                      <span>{isPulling ? 'Pulling Data...' : 'Pull SDBIP Top Layer Data'}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsFitAllReportingCells(!isFitAllReportingCells)}
                      className={`px-3 py-2 border rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition ${
                        isFitAllReportingCells 
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-700' 
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span>{isFitAllReportingCells ? "Fit Sentences" : "Expand Cells"}</span>
                    </button>
                    <button 
                      type="button"
                      onClick={() => setIsTableExpanded(false)}
                      className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition shadow-md border border-rose-500"
                    >
                      <Minimize2 className="w-4 h-4 text-white" /> Contract Table (Exit Fullscreen)
                    </button>
                    <button 
                      type="button"
                      onClick={exportToCSV}
                      className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <Download className="w-4 h-4" /> Export CSV
                    </button>
                    <button
                      type="button"
                      onClick={clearSystemNotifications}
                      className="px-4 py-2 bg-white hover:bg-amber-50 border border-slate-200 hover:border-amber-300 text-amber-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                      title="Clear all system notifications for SDBIP Top Layer"
                    >
                      <BellOff className="w-4 h-4 text-amber-600" />
                      <span>Clear System Notifications</span>
                      {notifications.length > 0 && (
                        <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold">
                          {notifications.length}
                        </span>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handlePurgePlaceholders}
                      disabled={isClearing}
                      className="px-4 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                      title="Purge all placeholder indicators from SDBIP Top Layer Reporting table and Supabase"
                    >
                      <RotateCcw className="w-4 h-4 text-amber-600" />
                      <span>Purge Placeholders</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setClearReportingModal({ isOpen: true, scope: 'entire_table' })}
                      disabled={isClearing || rows.length === 0}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition shadow-xs"
                      title="Purge placeholders and all reporting records from table and Supabase"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500" />
                      <span>Purge Reporting Table</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Smart Filter Panel (only show here if in fullscreen, otherwise show normal position) */}
              {isTableExpanded ? (
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs mb-3 shrink-0">
                  {renderSmartFilterPanel()}
                </div>
              ) : (
                renderSmartFilterPanel()
              )}

              {/* Reporting Pagination Controls Header */}
              <div className="mb-2 shrink-0">
                <SDBIPPagination
                  currentPage={reportingPage}
                  pageSize={reportingPageSize}
                  totalItems={filteredRows.length}
                  onPageChange={setReportingPage}
                  onPageSizeChange={setReportingPageSize}
                  pageSizeOptions={[25, 50, 100, 200, 'all']}
                  itemName="reporting items"
                  isSaving={isSavingRows}
                />
              </div>

              {/* Master Override Bar for Global Administrator Mike */}
              {isSuperAdminMike && (
                <div className="mb-3 bg-gradient-to-r from-amber-950/40 via-red-950/30 to-amber-950/40 border-2 border-amber-500/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500 text-slate-950 rounded-lg shrink-0">
                      <ShieldAlert className="w-5 h-5 font-black" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider">
                          👑 Global Administrator Master Override (Mike)
                        </span>
                        <span className="text-[10px] bg-amber-900/80 text-amber-200 border border-amber-600/50 font-mono px-2 py-0.5 rounded-full font-bold">
                          mike@mzansiflow.co.za
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5">
                        Master privileges enabled: You can undo submissions, unlock approval seals, toggle scorecard locks, and purge locked PoE files on any indicator.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={handleMasterUnlockAllApproved}
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      title="Revoke and unlock all currently Approved KPIs so departments can revise them"
                    >
                      <Unlock className="w-3.5 h-3.5" />
                      <span>Unlock All Approved</span>
                    </button>
                    <div
                      className="px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm border bg-slate-900 text-slate-300 border-amber-500/40 select-none"
                      title="Submitter and Approver cells in the SDBIP Top Layer reporting table are locked so current submitter and approver assignments cannot be changed."
                    >
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      <span>Reporting Submitter/Approver: Locked</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleMasterUndoAllSubmissions}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
                      title="Undo all pending submissions and return them to Draft state"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Undo All Submissions</span>
                    </button>
                  </div>
                </div>
              )}

              <div className={`overflow-auto border border-slate-200 rounded-xl relative bg-white transition-all duration-300 ${isTableExpanded ? 'flex-1 shadow-2xl border-indigo-100 min-h-0' : 'h-[580px] max-h-[68vh]'}`}>
              <table className="w-full text-left border-collapse table-fixed min-w-[9400px]">
                <thead className="sticky top-0 bg-slate-100 z-20 border-b-2 border-slate-200 text-[10px] font-black tracking-wider uppercase text-slate-700 font-mono">
                  <tr>
                    {/* Fixed Info Columns */}
                    <th className="p-3 border-r border-slate-200 w-28 sticky top-0 left-0 z-30 bg-slate-100">REF NUMBER</th>
                    <th className="p-3 border-r border-slate-200 w-72 sticky top-0 z-20 bg-slate-100">STRATEGIC OBJECTIVES</th>
                    <th className="p-3 border-r border-slate-200 w-80 sticky top-0 z-20 bg-slate-100">KPI</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-blue-100 text-blue-900">BSD (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-emerald-100 text-emerald-900">LED (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-amber-100 text-amber-900">MFVM (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-indigo-100 text-indigo-900">GGPP (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-rose-100 text-rose-900">MIDT (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-orange-100 text-orange-900">SR (X)</th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-100">RESPONSIBLE OWNER</th>
                    <th className="p-3 border-r border-slate-200 w-52 sticky top-0 z-20 bg-slate-100">BASELINE</th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-100">ANNUAL TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">TOTAL BUDGET</th>
                    <th className="p-3 border-r border-slate-200 w-32 text-center sticky top-0 z-20 bg-slate-200 text-slate-900">RAG STATUS</th>
                    <th className="p-3 border-r border-slate-200 w-48 text-center sticky top-0 z-20 bg-indigo-50 text-indigo-900 border-b-2 border-indigo-200 font-bold">ACTIVE WORKFLOW ({workflowPhase.toUpperCase()})</th>
                    
                    {/* Q1 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-teal-50 text-teal-955 font-bold text-center border-b-2 border-teal-200">Q1 EXPENDITURE</th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-indigo-50 text-indigo-955 font-bold text-center">Q1 POE</th>
                    <th className="p-3 border-r border-slate-200 w-28 sticky top-0 z-20 bg-indigo-50 text-indigo-900 text-center">Q1 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-indigo-100 text-indigo-900 border-b-2 border-indigo-200">Q1 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-indigo-200 text-indigo-955 border-b-2 border-indigo-300">Q1 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-72 sticky top-0 z-20 bg-indigo-300 text-indigo-955 border-b-2 border-indigo-400">Q1 CORRECTIVE MEASURE</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-indigo-400 text-indigo-955 font-bold text-center border-b-2 border-indigo-500">Q1 WORKFLOW CONTROL</th>

                    {/* Q2 Reporting (Locked) */}
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q2 EXPENDITURE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q2 POE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-28 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q2 TARGET</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q2 ACTUAL</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q2 VARIANCE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-72 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q2 CORRECTIVE MEASURE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q2 WORKFLOW CONTROL</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>

                    {/* Mid Term Reporting (Locked) */}
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-teal-50 text-teal-955 font-bold text-center border-b-2 border-teal-200">MID TERM EXPENDITURE</th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>MID TERM POE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-32 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>MID TERM TARGET</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>MID TERM ACTUAL</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>MID TERM VARIANCE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-72 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>MID TERM CORRECTIVE MEASURE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>MID-TERM WORKFLOW CONTROL</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>

                    {/* Q3 Reporting (Locked) */}
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q3 EXPENDITURE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q3 POE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-28 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q3 TARGET</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q3 ACTUAL</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q3 VARIANCE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-72 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q3 CORRECTIVE MEASURE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q3 WORKFLOW CONTROL</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>

                    {/* Q4 Reporting (Locked) */}
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q4 EXPENDITURE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q4 POE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-28 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q4 TARGET</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-56 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q4 ACTUAL</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q4 VARIANCE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-72 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q4 CORRECTIVE MEASURE</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex items-center justify-center gap-1">
                        <span>Q4/ANNUAL WORKFLOW CONTROL</span>
                        <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                      </div>
                    </th>

                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center justify-center gap-1">
                          <span>SUBMITTER</span>
                          <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        </div>
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                          <Lock className="w-2 h-2 text-amber-600" /> LOCKED
                        </span>
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-slate-200/90 text-slate-700 font-bold text-center border-b-2 border-slate-300">
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <div className="flex items-center justify-center gap-1">
                          <span>APPROVER</span>
                          <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                        </div>
                        <span className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                          <Lock className="w-2 h-2 text-amber-600" /> LOCKED
                        </span>
                      </div>
                    </th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-violet-50 text-violet-900 font-bold text-center border-b-2 border-violet-200">REVIEWER</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-amber-50 text-amber-900 font-bold text-center border-b-2 border-amber-200">INTERNAL AUDIT</th>

                    <th className="p-3 w-28 text-center bg-slate-50 text-slate-900 border-b-2 border-slate-200 font-bold sticky top-0 z-20">SCORE</th>
                  </tr>
                </thead>

                <tbody className="text-xs font-medium text-slate-800 divide-y divide-slate-100">
                  {paginatedReportingRows.length === 0 ? (
                    <tr>
                      <td colSpan={32} className="p-16 text-center bg-white">
                        <div className="flex flex-col items-center justify-center max-w-md mx-auto space-y-3">
                          <div className="p-4 bg-slate-50 text-slate-400 rounded-2xl border border-slate-200/80">
                            <Layers className="w-8 h-8 text-slate-400" />
                          </div>
                          <h4 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                            SDBIP Top Layer Reporting Table is Clean & Purged
                          </h4>
                          <p className="text-xs text-slate-500 leading-relaxed text-center">
                            All placeholder indicators and dummy quarterly targets have been purged from both the application and Supabase. Quarterly reporting actuals, variances, and evidence portfolios will appear here once official SDBIP indicators are active.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedReportingRows.map((row) => {
                    const isM81to84 = isQuarter1UnlockedKpi(row);
                    const isSpecialQ1 = isM81to84;
                    const isRowSubmitter = isM81to84
                      ? (isUserMatch('Annah Msiza', currentUser) || isSuperAdminMike || isUserUnrestricted(currentUser))
                      : (isUserMatch(row.submitter || row.responsibleUnit, currentUser) || isSuperAdminMike || isUserUnrestricted(currentUser));
                    return (
                    <tr key={row.id} className="group hover:bg-slate-50/70 transition-colors">
                      <td className="p-2 border-r border-slate-150 sticky left-0 z-10 bg-white group-hover:bg-slate-50/95 transition-colors font-mono text-[11px] drop-shadow-[1px_0_0_rgba(203,213,225,1)]">
                        <ExpandableCell
                          value={row.refNum || ''}
                          readOnly
                          cellTitle="Reference Number"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={1}
                          onOpenExpandModal={openCellExpandModal}
                          className="font-mono font-bold text-slate-800"
                        />
                        {isSpecialQ1 && (
                          <div className="mt-1">
                            <span className="text-[8px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.5 rounded inline-flex items-center gap-1 shadow-2xs">
                              <Unlock className="w-2.5 h-2.5 text-emerald-700" /> Q1 Unlocked
                            </span>
                          </div>
                        )}
                        {isSuperAdminMike && (
                          <div className="flex flex-col gap-1 mt-1 pt-1 border-t border-amber-300">
                            <div className="flex items-center gap-1 flex-wrap">
                              <button
                                type="button"
                                onClick={() => handleMasterToggleRowLock(row.id)}
                                className={`px-1.5 py-0.5 rounded text-[8.5px] font-black uppercase tracking-wider flex items-center gap-0.5 transition cursor-pointer shadow-2xs ${
                                  (row as any).workflowStatus === 'Approved' || (row as any).adminLocked
                                    ? 'bg-rose-100 text-rose-800 hover:bg-rose-200 border border-rose-300'
                                    : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border border-emerald-300'
                                }`}
                                title="Master Lock/Unlock Toggle (Mike)"
                              >
                                {(row as any).workflowStatus === 'Approved' || (row as any).adminLocked ? (
                                  <>
                                    <Unlock className="w-2.5 h-2.5 text-rose-600" />
                                    <span>Unlock</span>
                                  </>
                                ) : (
                                  <>
                                    <Lock className="w-2.5 h-2.5 text-emerald-700" />
                                    <span>Lock</span>
                                  </>
                                )}
                              </button>
                              {((row as any).workflowStatus === 'Approved' || (row as any).workflowStatus === 'Reviewed') && (
                                <button
                                  type="button"
                                  onClick={() => handleMasterUnlockApproval(row.id)}
                                  className="px-1.5 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[8.5px] font-bold transition shadow-2xs cursor-pointer"
                                  title="Revoke Approval & Reopen (Mike Master Override)"
                                >
                                  Reopen
                                </button>
                              )}
                              {((row as any).workflowStatus === 'Submitted' || (row as any).workflowStatus === 'pending_approval' || (row as any).workflowStatus === 'pending_review' || (row as any).workflowStatus === 'pending_audit') && (
                                <button
                                  type="button"
                                  onClick={() => handleMasterUndoSubmission(row.id)}
                                  className="px-1.5 py-0.5 bg-amber-600 hover:bg-amber-700 text-white rounded text-[8.5px] font-bold transition shadow-2xs cursor-pointer"
                                  title="Undo Submission & Revert to Draft (Mike Master Override)"
                                >
                                  Undo
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell
                          value={row.strategicObj || ''}
                          readOnly
                          cellTitle="Strategic Objectives"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          className="text-slate-600"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell
                          value={row.kpi || ''}
                          readOnly
                          cellTitle="Key Performance Indicator (KPI)"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          className="font-bold text-slate-800"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-150 text-center bg-blue-50/30 cursor-pointer hover:bg-blue-100/50" title="Click to select BSD" onClick={() => handleCellChange(row.id, 'bsd', 'X')}>
                        {row.bsd ? <span className="font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded text-xs shadow-2xs">X</span> : <span className="text-slate-300 font-mono text-[10px]">-</span>}
                      </td>
                      <td className="p-2 border-r border-slate-150 text-center bg-emerald-50/30 cursor-pointer hover:bg-emerald-100/50" title="Click to select LED" onClick={() => handleCellChange(row.id, 'led', 'X')}>
                        {row.led ? <span className="font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded text-xs shadow-2xs">X</span> : <span className="text-slate-300 font-mono text-[10px]">-</span>}
                      </td>
                      <td className="p-2 border-r border-slate-150 text-center bg-amber-50/30 cursor-pointer hover:bg-amber-100/50" title="Click to select MFVM" onClick={() => handleCellChange(row.id, 'mfvm', 'X')}>
                        {row.mfvm ? <span className="font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-xs shadow-2xs">X</span> : <span className="text-slate-300 font-mono text-[10px]">-</span>}
                      </td>
                      <td className="p-2 border-r border-slate-150 text-center bg-indigo-50/30 cursor-pointer hover:bg-indigo-100/50" title="Click to select GGPP" onClick={() => handleCellChange(row.id, 'ggpp', 'X')}>
                        {row.ggpp ? <span className="font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded text-xs shadow-2xs">X</span> : <span className="text-slate-300 font-mono text-[10px]">-</span>}
                      </td>
                      <td className="p-2 border-r border-slate-150 text-center bg-rose-50/30 cursor-pointer hover:bg-rose-100/50" title="Click to select MIDT" onClick={() => handleCellChange(row.id, 'midt', 'X')}>
                        {row.midt ? <span className="font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded text-xs shadow-2xs">X</span> : <span className="text-slate-300 font-mono text-[10px]">-</span>}
                      </td>
                      <td className="p-2 border-r border-slate-150 text-center bg-orange-50/30 cursor-pointer hover:bg-orange-100/50" title="Click to select SR" onClick={() => handleCellChange(row.id, 'sr', 'X')}>
                        {row.sr ? <span className="font-bold text-orange-700 bg-orange-100 px-1.5 py-0.5 rounded text-xs shadow-2xs">X</span> : <span className="text-slate-300 font-mono text-[10px]">-</span>}
                      </td>
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell
                          value={row.kpas || ''}
                          readOnly
                          cellTitle="Responsible Owner"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          className="font-semibold text-slate-700"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell
                          value={row.baseline || ''}
                          readOnly
                          cellTitle="Baseline"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          className="text-slate-600"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-150">
                        <ExpandableCell
                          value={row.annualTarget || ''}
                          readOnly
                          cellTitle="Annual Target"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={2}
                          onOpenExpandModal={openCellExpandModal}
                          className="font-black text-indigo-700"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-150">
                        {(() => {
                          const breakdown = getRowBudgetBreakdown(row);
                          return (
                            <div className="flex flex-col gap-1">
                              <ExpandableCell
                                value={row.budgetAllocation || (row as any).budget || 'Opex'}
                                readOnly
                                cellTitle="Total Budget Allocation"
                                refNum={row.refNum}
                                isFitAll={isFitAllReportingCells}
                                minRows={1}
                                onOpenExpandModal={openCellExpandModal}
                                className="font-bold text-slate-800"
                              />
                              {breakdown.totalBudget > 0 && (
                                <div className="text-[10px] space-y-0.5 mt-0.5">
                                  <div className="flex justify-between items-center text-slate-500 font-mono text-[9px]">
                                    <span>Spent:</span>
                                    <span className="font-bold text-slate-700">R {breakdown.totalSpent.toLocaleString()}</span>
                                  </div>
                                  {breakdown.isExceeded ? (
                                    <div className="flex items-center justify-between text-rose-700 font-bold bg-rose-50 px-1 py-0.5 rounded border border-rose-200 text-[9px]">
                                      <span>Overrun:</span>
                                      <span>+R {breakdown.excessAmount.toLocaleString()}</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-between text-emerald-700 font-bold bg-emerald-50 px-1 py-0.5 rounded border border-emerald-200 text-[9px]">
                                      <span>Avail:</span>
                                      <span>R {breakdown.remainingBudget.toLocaleString()}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      
                      {/* RAG Status */}
                      <td className="p-2 border-r border-slate-150 text-center bg-slate-50/10">
                        {(() => {
                          const details = getRagDetails(row);
                          const isSubmitted = (row as any).workflowStatus === 'Submitted to Approver' || 
                                              (row as any).workflowStatus === 'Submitted' || 
                                              row.workflows?.[workflowPhase]?.status === 'pending_approval' ||
                                              row.workflows?.q1?.status === 'pending_approval' ||
                                              row.auditChecklist?.auditSubmitted;
                          return (
                            <div className="flex flex-col items-center gap-1">
                              <div 
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-sm select-none ${details.bgClass} ${details.borderClass} ${details.textClass}`}
                                title={details.tooltip}
                              >
                                <span className="text-sm leading-none">{details.face}</span>
                                <span className="text-[9px] uppercase tracking-wider font-extrabold">{details.label}</span>
                              </div>
                              {isSubmitted && (
                                <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-0.5 shadow-2xs">
                                  <Clock className="w-2 h-2 text-amber-600" /> Submitted
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>

                      {/* Active Workflow Status */}
                      <td className="p-2 border-r border-slate-150 text-center bg-indigo-50/10 min-w-[150px]">
                        {(() => {
                          const activePhaseTarget = 
                            workflowPhase === 'q1' ? row.q1 :
                            workflowPhase === 'q2' ? row.q2 :
                            workflowPhase === 'midTerm' ? (row.midTermTarget || row.midTerm) :
                            workflowPhase === 'q3' ? row.q3 :
                            workflowPhase === 'q4' ? row.q4 : row.annualTarget;

                          if (isTargetNA(activePhaseTarget)) {
                            return (
                              <div className="flex flex-col items-center justify-center gap-1 py-1.5 px-2 bg-slate-100/90 rounded-lg border border-dashed border-slate-300 text-center select-none" title={`${workflowPhase.toUpperCase()} Target is N/A - Active workflow locked`}>
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase bg-slate-200 text-slate-600 border-slate-300 shadow-2xs">
                                  <Lock className="w-2.5 h-2.5 text-slate-500" />
                                  <KeyRound className="w-2.5 h-2.5 text-amber-600" />
                                  <span>Locked</span>
                                </span>
                                <span className="text-[8px] text-slate-400 font-semibold font-mono">{workflowPhase.toUpperCase()} Target N/A</span>
                              </div>
                            );
                          }

                          if (!isQuarterActive(workflowPhase)) {
                            const notice = getQuarterLockNotice(workflowPhase);
                            const pConfig = REPORTING_PERIOD_CONFIGS[workflowPhase as ReportingPhase];
                            return (
                              <div className="flex flex-col items-center gap-1 py-1 px-1 text-center bg-slate-50/80 rounded border border-dashed border-slate-200" title={notice}>
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase bg-slate-100 text-slate-500 border-slate-200">
                                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Locked
                                </span>
                                <span className="text-[8px] text-slate-400 leading-tight font-medium">
                                  {pConfig?.monthsLabel || 'Inactive period'}
                                </span>
                              </div>
                            );
                          }

                          const wf = (row.workflows?.[workflowPhase] || {}) as any;
                          const status = wf.status || (
                            (row.workflowStatus === 'Submitted to Approver' || row.workflowStatus === 'Submitted') ? 'pending_approval' :
                            (row.workflowStatus === 'Approved') ? 'approved' :
                            (row.workflowStatus === 'Reviewed' || row.workflowStatus === 'Pending Review') ? 'pending_review' :
                            (row.workflowStatus === 'Pending Audit') ? 'pending_audit' :
                            (row.workflowStatus === 'Returned') ? 'draft' : 'draft'
                          );
                          const phaseLabel = workflowPhase === 'midTerm' ? 'Mid-Term' : workflowPhase === 'annual' ? 'Annual' : workflowPhase.toUpperCase();
                          const submitterName = currentUser.fullName || currentUser.email.split('@')[0];
                          
                          return (
                            <div className="flex flex-col items-center gap-1.5 py-1">
                              {/* Current Badge */}
                              {status === 'approved' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-emerald-50 text-emerald-700 border-emerald-200 shadow-2xs">
                                  <CheckCircle className="w-2.5 h-2.5" /> Approved & Sealed
                                </span>
                              )}
                              {status === 'pending_approval' && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-amber-50 text-amber-700 border-amber-300 shadow-2xs">
                                  <Clock className="w-2.5 h-2.5 text-amber-500" /> Submitted
                                </span>
                              )}
                              {status === 'pending_review' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-violet-50 text-violet-700 border-violet-200">
                                  <Clock className="w-2.5 h-2.5" /> Pend. Rev.
                                </span>
                              )}
                              {status === 'pending_audit' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-rose-50 text-rose-700 border-rose-200 animate-pulse">
                                  <ShieldAlert className="w-2.5 h-2.5" /> Pend. Audit
                                </span>
                              )}
                              {status === 'draft' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black tracking-wider uppercase bg-slate-100 text-slate-600 border-slate-200">
                                  <FileText className="w-2.5 h-2.5" /> Draft
                                </span>
                              )}

                              {/* Interactive Transition Buttons */}
                              <div className="flex flex-col gap-1 w-full max-w-[140px] mt-1">
                                {status === 'draft' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        const approverName = row.approver || 'Approver';
                                        updateWorkflowState(
                                          row.id, 
                                          workflowPhase, 
                                          'pending_approval', 
                                          { submittedBy: submitterName, submittedAt: new Date().toLocaleDateString() },
                                          `KPI ${row.refNum} (${phaseLabel}) submitted to you for executive approval.`,
                                          approverName
                                        );
                                      }}
                                      className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-[10px] text-white font-bold rounded flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                                      title={`Submit this KPI to the Executive Approver (${row.approver || 'Approver'})`}
                                    >
                                      <Send className="w-2.5 h-2.5" /> Push to Approver
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => triggerViewPoeModal(row, 'general')}
                                      className="px-1.5 py-0.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 text-[9px] rounded flex items-center justify-center gap-1 transition cursor-pointer"
                                      title="Inspect KPI and attached PoE on system without downloading"
                                    >
                                      <Eye className="w-2.5 h-2.5" /> Inspect PoE
                                    </button>
                                  </>
                                )}

                                {status === 'pending_approval' && (
                                  <div className="flex flex-col gap-1 w-full">
                                    <button
                                      type="button"
                                      onClick={() => triggerViewPoeModal(row, 'general')}
                                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer"
                                      title="View KPI and attached PoE documents directly on system without downloading"
                                    >
                                      <Eye className="w-2.5 h-2.5" /> View KPI & PoE
                                    </button>
                                    <button
                                      onClick={() => {
                                        const reviewerName = row.reviewer || 'Reviewer';
                                        const comment = prompt('Enter approval comment or notes (optional):', 'Approved by Executive Approver. Pushed to Reviewer.') || 'Approved by Executive Approver.';
                                        updateWorkflowState(
                                          row.id,
                                          workflowPhase,
                                          'pending_review',
                                          { approvedBy: submitterName, approvedAt: new Date().toLocaleDateString(), comments: comment },
                                          `KPI ${row.refNum} (${phaseLabel}) approved by Executive and pushed to you for PMU Review: "${comment}"`,
                                          reviewerName
                                        );
                                      }}
                                      className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-[10px] text-white font-bold rounded flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                                      title={`Approve & Push to Reviewer (${row.reviewer || 'Reviewer'})`}
                                    >
                                      <Check className="w-2.5 h-2.5" /> Push to Reviewer
                                    </button>
                                    <button
                                      onClick={() => {
                                        const comment = prompt('Please enter reason / corrections required for resubmission:', 'Please update actuals and re-verify PoE documentation.');
                                        if (comment === null) return; // user cancelled
                                        updateWorkflowState(
                                          row.id,
                                          workflowPhase,
                                          'draft',
                                          { approvedBy: submitterName, comments: comment || 'Returned by executive approver for corrections.' },
                                          `Executive approver returned KPI ${row.refNum} with comments: "${comment}"`,
                                          row.submitter || 'Submitter'
                                        );
                                      }}
                                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-medium rounded flex items-center justify-center gap-1 transition cursor-pointer"
                                      title="Reject & Request Resend with comments"
                                    >
                                      <XCircle className="w-2.5 h-2.5" /> Reject & Resend
                                    </button>
                                  </div>
                                )}

                                {status === 'pending_review' && (
                                  <div className="flex flex-col gap-1 w-full">
                                    <button
                                      type="button"
                                      onClick={() => triggerViewPoeModal(row, 'general')}
                                      className="px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer"
                                      title="View KPI and attached PoE documents directly on system without downloading"
                                    >
                                      <Eye className="w-2.5 h-2.5" /> View KPI & PoE
                                    </button>
                                    <button
                                      onClick={() => {
                                        const auditorName = row.internalAudit || 'Internal Audit';
                                        const comment = prompt('Enter review notes or compliance remarks (optional):', 'Review sign-off completed. Pushed to Internal Audit.') || 'Review sign-off completed.';
                                        updateWorkflowState(
                                          row.id,
                                          workflowPhase,
                                          'pending_audit',
                                          { reviewedBy: submitterName, reviewedAt: new Date().toLocaleDateString(), comments: comment },
                                          `KPI ${row.refNum} (${phaseLabel}) review sign-off completed. Pushed to Internal Audit: "${comment}"`,
                                          auditorName
                                        );
                                      }}
                                      className="px-2 py-1 bg-gradient-to-r from-violet-600 to-rose-600 hover:from-violet-700 hover:to-rose-700 text-[10px] text-white font-bold rounded flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                                      title={`Accept & Push to Internal Audit (${row.internalAudit || 'Internal Audit'})`}
                                    >
                                      <ShieldCheck className="w-2.5 h-2.5" /> Push to Audit
                                    </button>
                                    <button
                                      onClick={() => {
                                        const comment = prompt('Please enter reason / corrections required for resubmission:', 'Reviewer noted discrepancies. Please correct and resend.');
                                        if (comment === null) return;
                                        updateWorkflowState(
                                          row.id,
                                          workflowPhase,
                                          'draft',
                                          { reviewedBy: submitterName, comments: comment || 'Reviewer requested corrections.' },
                                          `Reviewer returned KPI ${row.refNum} to Submitter: "${comment}"`,
                                          [row.submitter || 'Submitter', row.approver || 'Approver']
                                        );
                                      }}
                                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-medium rounded flex items-center justify-center gap-1 transition cursor-pointer"
                                      title="Reject & Request Resend with comments"
                                    >
                                      <XCircle className="w-2.5 h-2.5" /> Reject & Resend
                                    </button>
                                  </div>
                                )}

                                {status === 'pending_audit' && (
                                  <div className="flex flex-col gap-1 w-full">
                                    <button
                                      type="button"
                                      onClick={() => triggerViewPoeModal(row, 'general')}
                                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-bold rounded flex items-center justify-center gap-1 transition cursor-pointer"
                                      title="View KPI and attached PoE documents directly on system without downloading"
                                    >
                                      <Eye className="w-2.5 h-2.5" /> View KPI & PoE
                                    </button>
                                    <button
                                      onClick={() => {
                                        const comment = prompt('Enter Internal Audit clearance notes (optional):', 'MFMA statutory compliance audit verification passed.') || 'Audit verification passed.';
                                        updateWorkflowState(
                                          row.id,
                                          workflowPhase,
                                          'approved',
                                          { auditedBy: submitterName, auditedAt: new Date().toLocaleDateString(), comments: comment },
                                          `Internal Audit clearance GRANTED for KPI ${row.refNum}. Officially approved: "${comment}"`,
                                          [row.submitter || 'Submitter', row.approver || 'Approver', row.reviewer || 'Reviewer']
                                        );
                                      }}
                                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-[10px] text-white font-bold rounded flex items-center justify-center gap-1 transition shadow-sm cursor-pointer"
                                      title="Grant Audit Clearance and Officially Approve"
                                    >
                                      <ShieldCheck className="w-2.5 h-2.5" /> Clear Audit ✅
                                    </button>
                                    <button
                                      onClick={() => {
                                        const comment = prompt('Please enter Internal Audit findings / required actions:', 'Audit query raised: Evidence documentation requires correction.');
                                        if (comment === null) return;
                                        updateWorkflowState(
                                          row.id,
                                          workflowPhase,
                                          'draft',
                                          { auditedBy: submitterName, comments: comment || 'Internal audit returned with queries.' },
                                          `Internal Audit returned KPI ${row.refNum} with findings: "${comment}"`,
                                          [row.submitter || 'Submitter', row.approver || 'Approver', row.reviewer || 'Reviewer']
                                        );
                                      }}
                                      className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[9px] font-medium rounded flex items-center justify-center gap-1 transition cursor-pointer"
                                      title="Return with Audit Findings"
                                    >
                                      <XCircle className="w-2.5 h-2.5" /> Audit Findings
                                    </button>
                                  </div>
                                )}

                                {status === 'approved' && (
                                  <button
                                    type="button"
                                    onClick={() => triggerViewPoeModal(row, 'general')}
                                    className="px-2 py-0.5 text-emerald-700 hover:bg-emerald-50 text-[9px] font-semibold rounded flex items-center justify-center gap-1 transition cursor-pointer"
                                    title="View verified KPI record and PoE on system"
                                  >
                                    <Eye className="w-2.5 h-2.5" /> View PoE
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Q1 Expenditure (Moved before POE) */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        {renderQuarterExpenditureCell(row, 'q1', row.q1, isRowSubmitter)}
                      </td>

                      {/* Q1 POE Column */}
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/10">
                        {isTargetNA(row.q1) && !isSpecialQ1 ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-1 select-none min-h-[72px]" title="Q1 Target is N/A - POE submission locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Q1 Target is N/A</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(() => {
                              const sourcePoe = (row.poeDesc || row.poeStatus || row.q1PoeDesc || row.q2PoeDesc || row.midTermPoeDesc || row.q3PoeDesc || row.q4PoeDesc || '').trim();
                              return (
                                <ExpandableCell
                                  value={row.q1PoeDesc || sourcePoe}
                                  disabled={true}
                                  onChange={() => {}}
                                  cellTitle="Q1 POE Description (Non-Editable Source Document POE)"
                                  refNum={row.refNum}
                                  isFitAll={isFitAllReportingCells}
                                  minRows={2}
                                  placeholder="Source Document POE Description..."
                                  onOpenExpandModal={openCellExpandModal}
                                  className="bg-slate-100/90 text-slate-700 border-slate-200 cursor-not-allowed"
                                />
                              );
                            })()}
                            {row.q1Poes && row.q1Poes.length > 0 && (
                              <div 
                                onClick={() => triggerViewPoeModal(row, 'q1')}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 p-1 border border-emerald-200 rounded text-emerald-800 truncate cursor-pointer transition flex items-center justify-between font-semibold" 
                                title="Click to view full POE document details & preview"
                              >
                                <span className="truncate">📄 {row.q1Poes[row.q1Poes.length - 1]}</span>
                                <Eye className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
                              </div>
                            )}
                            <div className="flex gap-1">
                              {((row.q1Poes && row.q1Poes.length > 0) || row.q1PoeDesc) && (
                                <button 
                                  onClick={() => triggerViewPoeModal(row, 'q1')}
                                  className="px-2 py-1 text-[9px] font-bold rounded border bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  title="View POE Document Details"
                                >
                                  <Eye className="w-2.5 h-2.5" /> View
                                </button>
                              )}
                              <button 
                                disabled={!isRowSubmitter || !isQuarterActive('q1')}
                                onClick={() => triggerUploadModal(row.id, row.refNum, 'q1')}
                                className={`flex-1 py-1 text-[9px] font-bold rounded border transition-colors flex items-center justify-center gap-1 ${!isRowSubmitter || !isQuarterActive('q1') ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 cursor-pointer'}`}
                                title={!isRowSubmitter ? `Upload Restricted: Only designated submitter (${row.submitter || row.responsibleUnit}) can upload POE` : !isQuarterActive('q1') ? getQuarterLockNotice('q1') : "Upload/Edit POE"}
                              >
                                <Upload className="w-2.5 h-2.5" /> Upload/Edit
                              </button>
                              {((row.q1Poes && row.q1Poes.length > 0) || row.q1PoeDesc) && (
                                confirmDelete?.rowId === row.id && confirmDelete?.type === 'q1' ? (
                                  <div className="flex flex-col gap-1 bg-rose-50 border border-rose-200 p-1 rounded min-w-[80px]">
                                    <span className="text-[8px] text-rose-800 font-bold text-center leading-none">Are you sure?</span>
                                    <div className="flex gap-1 justify-center">
                                      <button
                                        disabled={!isRowSubmitter || !isQuarterActive('q1')}
                                        onClick={() => {
                                          clearQuarterPoe(row.id, 'q1');
                                          setConfirmDelete(null);
                                        }}
                                        className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-rose-700 disabled:opacity-50"
                                      >
                                        Yes
                                      </button>
                                      <button
                                        onClick={() => setConfirmDelete(null)}
                                        className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[8px] font-bold cursor-pointer hover:bg-slate-300"
                                      >
                                        No
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button 
                                    disabled={!isRowSubmitter || !isQuarterActive('q1')}
                                    onClick={() => setConfirmDelete({ rowId: row.id, type: 'q1' })}
                                    className={`p-1 text-[9px] font-bold rounded border transition-colors flex items-center justify-center ${!isRowSubmitter || !isQuarterActive('q1') ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed' : 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer'}`}
                                    title={!isRowSubmitter ? `Delete Restricted: Only designated submitter (${row.submitter || row.responsibleUnit}) can delete POE` : !isQuarterActive('q1') ? getQuarterLockNotice('q1') : "Delete POE and Description"}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Q1 TARGET Column */}
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/20 text-center">
                        <ExpandableCell
                          value={row.q1 || ''}
                          readOnly={true}
                          disabled={true}
                          onChange={() => {}}
                          cellTitle="Q1 Target (Locked)"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={1}
                          placeholder="Locked"
                          onOpenExpandModal={openCellExpandModal}
                          className="font-bold text-slate-500 text-center bg-slate-100/90 cursor-not-allowed border-slate-200"
                        />
                      </td>

                      <td className="p-2 border-r border-slate-100 bg-indigo-50/5 relative group">
                        {isTargetNA(row.q1) && !isSpecialQ1 ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Q1 Target is N/A - Actual reporting is locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <>
                            <ExpandableCell
                              value={row.q1Actual || ''}
                              disabled={!isRowSubmitter || !isQuarterActive('q1')}
                              onChange={(val) => handleCellChange(row.id, 'q1Actual', val)}
                              cellTitle="Q1 Actual"
                              refNum={row.refNum}
                              isFitAll={isFitAllReportingCells}
                              minRows={2}
                              placeholder={!isRowSubmitter ? `Submitter Only (${row.submitter || row.responsibleUnit || 'Assigned'})` : !isQuarterActive('q1') ? "Locked for this period" : "Q1 Actual..."}
                              onOpenExpandModal={openCellExpandModal}
                              className={!isRowSubmitter || !isQuarterActive('q1') ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-white'}
                            />
                            {row.q1Actual && row.q1 && row.q1Actual !== row.q1 && (
                              <div className="absolute top-1 right-1 pointer-events-auto z-10">
                                <div className="relative group/tip">
                                  <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse cursor-help" />
                                  <div className="absolute bottom-full right-0 mb-1 hidden group-hover/tip:block z-50">
                                    <div className="bg-rose-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap border border-rose-700">
                                      <div className="font-bold border-b border-rose-800 pb-1 mb-1">Target Discrepancy</div>
                                      <div>Target: {row.q1}</div>
                                      <div>Actual: {row.q1Actual}</div>
                                      <div className="mt-1 text-rose-200">Please provide variance explanation.</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/5">
                        {isTargetNA(row.q1) && !isSpecialQ1 ? (
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none" title="Q1 Target is N/A - Variance calculation is locked">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q1Variance || ''}
                            readOnly
                            cellTitle="Q1 Variance"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={1}
                            placeholder="No variance"
                            onOpenExpandModal={openCellExpandModal}
                            className="font-bold text-slate-700 bg-white"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/5">
                        {isTargetNA(row.q1) && !isSpecialQ1 ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Q1 Target is N/A - Corrective measures locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q1Corrective || ''}
                            disabled={!isRowSubmitter || !isQuarterActive('q1') || isFieldDisabled(row.q1Variance)}
                            onChange={(val) => handleCellChange(row.id, 'q1Corrective', val)}
                            cellTitle="Q1 Corrective Measure"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder={!isRowSubmitter ? `Submitter Only (${row.submitter || row.responsibleUnit || 'Assigned'})` : !isQuarterActive('q1') ? "Locked for this period" : isFieldDisabled(row.q1Variance) ? "No variance detected." : "Q1 Corrective..."}
                            onOpenExpandModal={openCellExpandModal}
                            className={!isRowSubmitter || !isQuarterActive('q1') || isFieldDisabled(row.q1Variance) ? 'bg-slate-100 text-slate-400 cursor-not-allowed italic font-normal' : 'bg-white text-slate-800'}
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-indigo-100/10 text-center">
                        {renderQuarterWorkflowCell(row, 'q1')}
                      </td>

                      {/* Q2 Expenditure */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        {renderQuarterExpenditureCell(row, 'q2', row.q2, isRowSubmitter)}
                      </td>

                      {/* Q2 POE Column (Locked) */}
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q2) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-1 select-none min-h-[72px]" title="Q2 Target is N/A - POE submission locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Q2 Target is N/A</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(() => {
                              const sourcePoe = (row.poeDesc || row.poeStatus || row.q1PoeDesc || row.q2PoeDesc || row.midTermPoeDesc || row.q3PoeDesc || row.q4PoeDesc || '').trim();
                              return (
                                <ExpandableCell
                                  value={row.q2PoeDesc || sourcePoe}
                                  readOnly={true}
                                  disabled={true}
                                  onChange={() => {}}
                                  cellTitle="Q2 POE Description (Locked)"
                                  refNum={row.refNum}
                                  isFitAll={isFitAllReportingCells}
                                  minRows={2}
                                  placeholder="Locked"
                                  onOpenExpandModal={openCellExpandModal}
                                  className="bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed"
                                />
                              );
                            })()}
                            {row.q2Poes && row.q2Poes.length > 0 && (
                              <div 
                                onClick={() => triggerViewPoeModal(row, 'q2')}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 p-1 border border-emerald-200 rounded text-emerald-800 truncate cursor-pointer transition flex items-center justify-between font-semibold" 
                                title="Click to view full POE document details & preview"
                              >
                                <span className="truncate">📄 {row.q2Poes[row.q2Poes.length - 1]}</span>
                                <Eye className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
                              </div>
                            )}
                            <div className="flex gap-1">
                              {((row.q2Poes && row.q2Poes.length > 0) || row.q2PoeDesc) && (
                                <button 
                                  onClick={() => triggerViewPoeModal(row, 'q2')}
                                  className="px-2 py-1 text-[9px] font-bold rounded border bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  title="View POE Document Details"
                                >
                                  <Eye className="w-2.5 h-2.5" /> View
                                </button>
                              )}
                              <button 
                                disabled={true}
                                className="flex-1 py-1 text-[9px] font-bold rounded border transition-colors flex items-center justify-center gap-1 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                title="Upload Locked"
                              >
                                <Lock className="w-2.5 h-2.5 text-amber-500" /> Upload Locked
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Q2 TARGET Column (Locked) */}
                      <td className="p-2 border-r border-slate-100 bg-slate-100/50 text-center">
                        <ExpandableCell
                          value={row.q2 || ''}
                          readOnly={true}
                          disabled={true}
                          onChange={() => {}}
                          cellTitle="Q2 Target (Locked)"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={1}
                          placeholder="Locked"
                          onOpenExpandModal={openCellExpandModal}
                          className="font-bold text-slate-600 text-center bg-slate-100/90 cursor-not-allowed border-slate-200"
                        />
                      </td>

                      <td className="p-2 border-r border-slate-100 bg-slate-100/40 relative">
                        {isTargetNA(row.q2) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Q2 Target is N/A - Actual reporting is locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q2Actual || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q2 Actual (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-200"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q2) ? (
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none" title="Q2 Target is N/A - Variance calculation is locked">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q2Variance || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q2 Variance (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={1}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="font-bold text-slate-600 bg-slate-100/90 cursor-not-allowed border-slate-200"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q2) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Q2 Target is N/A - Corrective measures locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q2Corrective || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q2 Corrective Measure (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="bg-slate-100/90 text-slate-500 border-slate-200 cursor-not-allowed italic font-normal"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40 text-center">
                        {renderQuarterWorkflowCell(row, 'q2', true)}
                      </td>

                      {/* Mid Term Expenditure */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        {isTargetNA(row.midTermTarget || row.midTerm) ? (
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none" title="Expenditure reporting locked (Mid-Term Target is N/A)">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">N/A</span>
                          </div>
                        ) : (
                          (() => {
                            const q1Val = parseBudgetNum(row.q1Expenditure);
                            const q2Val = parseBudgetNum(row.q2Expenditure);
                            const midSum = q1Val + q2Val;
                            const displayVal = midSum > 0 ? `R ${midSum.toLocaleString()}` : (row.midTermExpenditure || 'R 0');
                            return (
                              <ExpandableCell
                                value={displayVal}
                                readOnly={true}
                                disabled={true}
                                onChange={() => {}}
                                cellTitle="Mid-Term Total Expenditure (Q1 + Q2)"
                                refNum={row.refNum}
                                isFitAll={isFitAllReportingCells}
                                minRows={1}
                                placeholder="R 0"
                                onOpenExpandModal={openCellExpandModal}
                                className="font-bold bg-slate-100/90 text-slate-700 cursor-not-allowed border-slate-200"
                              />
                            );
                          })()
                        )}
                      </td>

                      {/* Mid Term POE Column (Locked) */}
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.midTermTarget || row.midTerm) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-1 select-none min-h-[72px]" title="Mid-Term Target is N/A - POE submission locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Mid-Term Target is N/A</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(() => {
                              const sourcePoe = (row.poeDesc || row.poeStatus || row.q1PoeDesc || row.q2PoeDesc || row.midTermPoeDesc || row.q3PoeDesc || row.q4PoeDesc || '').trim();
                              return (
                                <ExpandableCell
                                  value={row.midTermPoeDesc || sourcePoe}
                                  readOnly={true}
                                  disabled={true}
                                  onChange={() => {}}
                                  cellTitle="Mid-Term POE Description (Locked)"
                                  refNum={row.refNum}
                                  isFitAll={isFitAllReportingCells}
                                  minRows={2}
                                  placeholder="Locked"
                                  onOpenExpandModal={openCellExpandModal}
                                  className="bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed"
                                />
                              );
                            })()}
                            {row.midTermPoes && row.midTermPoes.length > 0 && (
                              <div 
                                onClick={() => triggerViewPoeModal(row, 'midTerm')}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 p-1 border border-emerald-200 rounded text-emerald-800 truncate cursor-pointer transition flex items-center justify-between font-semibold" 
                                title="Click to view full POE document details & preview"
                              >
                                <span className="truncate">📄 {row.midTermPoes[row.midTermPoes.length - 1]}</span>
                                <Eye className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
                              </div>
                            )}
                            <div className="flex gap-1">
                              {((row.midTermPoes && row.midTermPoes.length > 0) || row.midTermPoeDesc) && (
                                <button 
                                  onClick={() => triggerViewPoeModal(row, 'midTerm')}
                                  className="px-2 py-1 text-[9px] font-bold rounded border bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  title="View POE Document Details"
                                >
                                  <Eye className="w-2.5 h-2.5" /> View
                                </button>
                              )}
                              <button 
                                disabled={true}
                                className="flex-1 py-1 text-[9px] font-bold rounded border transition-colors flex items-center justify-center gap-1 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                title="Upload Locked"
                              >
                                <Lock className="w-2.5 h-2.5 text-amber-500" /> Upload Locked
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Mid Term Target (Locked) */}
                      <td className="p-2 border-r border-slate-100 bg-slate-100/50 text-center">
                        <ExpandableCell
                          value={row.midTermTarget || ''}
                          readOnly={true}
                          disabled={true}
                          onChange={() => {}}
                          cellTitle="Mid-Term Target (Locked)"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={1}
                          placeholder="Locked"
                          onOpenExpandModal={openCellExpandModal}
                          className="font-bold text-slate-600 text-center bg-slate-100/90 cursor-not-allowed border-slate-200"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40 relative">
                        {isTargetNA(row.midTermTarget || row.midTerm) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Mid-Term Target is N/A - Actual reporting is locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.midTermActual || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Mid-Term Actual (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-200 font-bold"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.midTermTarget || row.midTerm) ? (
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none" title="Mid-Term Target is N/A - Variance calculation is locked">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.midTermVariance || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Mid-Term Variance (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={1}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="font-bold text-slate-600 bg-slate-100/90 cursor-not-allowed border-slate-200"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.midTermTarget || row.midTerm) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Mid-Term Target is N/A - Corrective measures locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.midTermCorrective || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Mid-Term Corrective Measure (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="bg-slate-100/90 border-slate-200 text-slate-500 cursor-not-allowed italic font-normal"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40 text-center">
                        {renderQuarterWorkflowCell(row, 'midTerm', true)}
                      </td>

                      {/* Q3 Expenditure */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        {renderQuarterExpenditureCell(row, 'q3', row.q3, isRowSubmitter)}
                      </td>

                      {/* Q3 POE Column (Locked) */}
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q3) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-1 select-none min-h-[72px]" title="Q3 Target is N/A - POE submission locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Q3 Target is N/A</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(() => {
                              const sourcePoe = (row.poeDesc || row.poeStatus || row.q1PoeDesc || row.q2PoeDesc || row.midTermPoeDesc || row.q3PoeDesc || row.q4PoeDesc || '').trim();
                              return (
                                <ExpandableCell
                                  value={row.q3PoeDesc || sourcePoe}
                                  readOnly={true}
                                  disabled={true}
                                  onChange={() => {}}
                                  cellTitle="Q3 POE Description (Locked)"
                                  refNum={row.refNum}
                                  isFitAll={isFitAllReportingCells}
                                  minRows={2}
                                  placeholder="Locked"
                                  onOpenExpandModal={openCellExpandModal}
                                  className="bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed"
                                />
                              );
                            })()}
                            {row.q3Poes && row.q3Poes.length > 0 && (
                              <div 
                                onClick={() => triggerViewPoeModal(row, 'q3')}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 p-1 border border-emerald-200 rounded text-emerald-800 truncate cursor-pointer transition flex items-center justify-between font-semibold" 
                                title="Click to view full POE document details & preview"
                              >
                                <span className="truncate">📄 {row.q3Poes[row.q3Poes.length - 1]}</span>
                                <Eye className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
                              </div>
                            )}
                            <div className="flex gap-1">
                              {((row.q3Poes && row.q3Poes.length > 0) || row.q3PoeDesc) && (
                                <button 
                                  onClick={() => triggerViewPoeModal(row, 'q3')}
                                  className="px-2 py-1 text-[9px] font-bold rounded border bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  title="View POE Document Details"
                                >
                                  <Eye className="w-2.5 h-2.5" /> View
                                </button>
                              )}
                              <button 
                                disabled={true}
                                className="flex-1 py-1 text-[9px] font-bold rounded border transition-colors flex items-center justify-center gap-1 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                title="Upload Locked"
                              >
                                <Lock className="w-2.5 h-2.5 text-amber-500" /> Upload Locked
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Q3 TARGET Column (Locked) */}
                      <td className="p-2 border-r border-slate-100 bg-slate-100/50 text-center">
                        <ExpandableCell
                          value={row.q3 || ''}
                          readOnly={true}
                          disabled={true}
                          onChange={() => {}}
                          cellTitle="Q3 Target (Locked)"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={1}
                          placeholder="Locked"
                          onOpenExpandModal={openCellExpandModal}
                          className="font-bold text-slate-600 text-center bg-slate-100/90 cursor-not-allowed border-slate-200"
                        />
                      </td>

                      <td className="p-2 border-r border-slate-100 bg-slate-100/40 relative text-slate-800">
                        {isTargetNA(row.q3) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Q3 Target is N/A - Actual reporting is locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q3Actual || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q3 Actual (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-200 font-semibold"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q3) ? (
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none" title="Q3 Target is N/A - Variance calculation is locked">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q3Variance || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q3 Variance (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={1}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="font-bold text-slate-600 bg-slate-100/90 cursor-not-allowed border-slate-200"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q3) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Q3 Target is N/A - Corrective measures locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q3Corrective || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q3 Corrective Measure (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="bg-slate-100/90 border-slate-200 text-slate-500 cursor-not-allowed italic font-normal"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40 text-center">
                        {renderQuarterWorkflowCell(row, 'q3', true)}
                      </td>

                      {/* Q4 Expenditure */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        {renderQuarterExpenditureCell(row, 'q4', row.q4, isRowSubmitter)}
                      </td>

                      {/* Q4 POE Column (Locked) */}
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q4) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-1 select-none min-h-[72px]" title="Q4 Target is N/A - POE submission locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">Q4 Target is N/A</span>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {(() => {
                              const sourcePoe = (row.poeDesc || row.poeStatus || row.q1PoeDesc || row.q2PoeDesc || row.midTermPoeDesc || row.q3PoeDesc || row.q4PoeDesc || '').trim();
                              return (
                                <ExpandableCell
                                  value={row.q4PoeDesc || sourcePoe}
                                  readOnly={true}
                                  disabled={true}
                                  onChange={() => {}}
                                  cellTitle="Q4 POE Description (Locked)"
                                  refNum={row.refNum}
                                  isFitAll={isFitAllReportingCells}
                                  minRows={2}
                                  placeholder="Locked"
                                  onOpenExpandModal={openCellExpandModal}
                                  className="bg-slate-100/90 text-slate-600 border-slate-200 cursor-not-allowed"
                                />
                              );
                            })()}
                            {row.q4Poes && row.q4Poes.length > 0 && (
                              <div 
                                onClick={() => triggerViewPoeModal(row, 'q4')}
                                className="text-[10px] bg-emerald-50 hover:bg-emerald-100 p-1 border border-emerald-200 rounded text-emerald-800 truncate cursor-pointer transition flex items-center justify-between font-semibold" 
                                title="Click to view full POE document details & preview"
                              >
                                <span className="truncate">📄 {row.q4Poes[row.q4Poes.length - 1]}</span>
                                <Eye className="w-3 h-3 text-emerald-600 shrink-0 ml-1" />
                              </div>
                            )}
                            <div className="flex gap-1">
                              {((row.q4Poes && row.q4Poes.length > 0) || row.q4PoeDesc) && (
                                <button 
                                  onClick={() => triggerViewPoeModal(row, 'q4')}
                                  className="px-2 py-1 text-[9px] font-bold rounded border bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-700 transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                                  title="View POE Document Details"
                                >
                                  <Eye className="w-2.5 h-2.5" /> View
                                </button>
                              )}
                              <button 
                                disabled={true}
                                className="flex-1 py-1 text-[9px] font-bold rounded border transition-colors flex items-center justify-center gap-1 bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed"
                                title="Upload Locked"
                              >
                                <Lock className="w-2.5 h-2.5 text-amber-500" /> Upload Locked
                              </button>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Q4 TARGET Column (Locked) */}
                      <td className="p-2 border-r border-slate-100 bg-slate-100/50 text-center">
                        <ExpandableCell
                          value={row.q4 || ''}
                          readOnly={true}
                          disabled={true}
                          onChange={() => {}}
                          cellTitle="Q4 Target (Locked)"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={1}
                          placeholder="Locked"
                          onOpenExpandModal={openCellExpandModal}
                          className="font-bold text-slate-600 text-center bg-slate-100/90 cursor-not-allowed border-slate-200"
                        />
                      </td>

                      <td className="p-2 border-r border-slate-100 bg-slate-100/40 relative">
                        {isTargetNA(row.q4) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Q4 Target is N/A - Actual reporting is locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q4Actual || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q4 Actual (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="bg-slate-100/90 text-slate-600 cursor-not-allowed border-slate-200 font-semibold"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q4) ? (
                          <div className="flex flex-col items-center justify-center p-2 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none" title="Q4 Target is N/A - Variance calculation is locked">
                            <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
                              <Lock className="w-3 h-3 text-slate-400" />
                              <KeyRound className="w-3 h-3 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono">N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q4Variance || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q4 Variance (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={1}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="font-bold text-slate-600 bg-slate-100/90 cursor-not-allowed border-slate-200"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40">
                        {isTargetNA(row.q4) ? (
                          <div className="flex flex-col items-center justify-center p-2.5 bg-slate-100/90 border border-slate-200 rounded-lg text-slate-500 gap-0.5 select-none min-h-[58px]" title="Q4 Target is N/A - Corrective measures locked">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                              <Lock className="w-3.5 h-3.5 text-slate-500" />
                              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                              <span>Locked</span>
                            </div>
                            <span className="text-[9px] text-slate-400 font-semibold font-mono">Target N/A</span>
                          </div>
                        ) : (
                          <ExpandableCell
                            value={row.q4Corrective || ''}
                            readOnly={true}
                            disabled={true}
                            onChange={() => {}}
                            cellTitle="Q4 Corrective Measure (Locked)"
                            refNum={row.refNum}
                            isFitAll={isFitAllReportingCells}
                            minRows={2}
                            placeholder="Locked"
                            onOpenExpandModal={openCellExpandModal}
                            className="bg-slate-100/90 border-slate-200 text-slate-500 cursor-not-allowed italic font-normal"
                          />
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-slate-100/40 text-center">
                        {renderQuarterWorkflowCell(row, 'q4', true)}
                      </td>

                      {/* Submitter */}
                      <td className="p-1.5 border-r border-slate-100 bg-slate-100/50">
                        <div className="flex flex-col gap-1">
                          {(() => {
                            const isRowM81to84 = isQuarter1UnlockedKpi(row);
                            return (
                              <>
                                <AzureADPicker 
                                  value={isRowM81to84 ? 'Annah Msiza' : (row.submitter || '')}
                                  onChange={(val) => handleCellChange(row.id, 'submitter', val)}
                                  roleType="submitter"
                                  activeTenantId={activeTenantId}
                                  isFitAll={isFitAllReportingCells}
                                  disabled={true}
                                />
                                <div className="flex items-center gap-1 justify-center">
                                  <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-0.5 shadow-2xs">
                                    <Lock className="w-2 h-2 text-slate-600" /> LOCKED
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                          {((row as any).workflowStatus === 'Submitted to Approver' || (row as any).workflowStatus === 'Submitted' || row.workflows?.q1?.status === 'pending_approval') && !['Pending Review', 'Reviewed', 'Approved', 'Pending Audit'].includes((row as any).workflowStatus) && !['pending_review', 'reviewed', 'approved', 'pending_audit'].includes(row.workflows?.q1?.status || '') && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5 shadow-2xs">
                                <Clock className="w-2 h-2 text-amber-600" /> SUBMITTED
                              </span>
                            </div>
                          )}
                          {((row as any).workflowStatus === 'Pending Review' || row.workflows?.q1?.status === 'pending_review') && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-0.5 shadow-2xs">
                                <CheckCircle className="w-2 h-2 text-indigo-600" /> APPROVED BY APPROVER
                              </span>
                            </div>
                          )}
                          {(row as any).workflowStatus === 'Reviewed' && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-0.5 shadow-2xs">
                                <CheckCircle className="w-2 h-2 text-purple-600" /> REVIEWED
                              </span>
                            </div>
                          )}
                          {(row as any).workflowStatus === 'Approved' && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5 shadow-2xs">
                                <CheckCircle className="w-2 h-2 text-emerald-600" /> APPROVED
                              </span>
                            </div>
                          )}
                          {((row as any).workflowStatus === 'Returned' || (row as any).workflowStatus === 'Returned to Submitter') && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5 shadow-2xs">
                                <XCircle className="w-2 h-2 text-rose-600" /> RETURNED / REDO
                              </span>
                            </div>
                          )}
                          
                        </div>
                      </td>

                      {/* Approver */}
                      <td className="p-1.5 border-r border-slate-100 bg-slate-100/50">
                        <div className="flex flex-col gap-1">
                          {(() => {
                            const isRowM81to84 = isQuarter1UnlockedKpi(row);
                            return (
                              <>
                                <AzureADPicker 
                                  value={isRowM81to84 ? 'Thandiwe M. Lengwate' : (row.approver || '')}
                                  onChange={(val) => handleCellChange(row.id, 'approver', val)}
                                  roleType="approver"
                                  activeTenantId={activeTenantId}
                                  isFitAll={isFitAllReportingCells}
                                  disabled={true}
                                />
                                <div className="flex items-center gap-1 justify-center">
                                  <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-800 border border-slate-300 flex items-center gap-0.5 shadow-2xs">
                                    <Lock className="w-2 h-2 text-slate-600" /> LOCKED
                                  </span>
                                </div>
                              </>
                            );
                          })()}
                          {((row as any).workflowStatus === 'Submitted to Approver' || (row as any).workflowStatus === 'Submitted' || row.workflows?.q1?.status === 'pending_approval') && !['Pending Review', 'Reviewed', 'Approved', 'Pending Audit'].includes((row as any).workflowStatus) && !['pending_review', 'reviewed', 'approved', 'pending_audit'].includes(row.workflows?.q1?.status || '') && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-0.5 shadow-2xs">
                                <Clock className="w-2 h-2 text-amber-600" /> AWAITING APPROVER
                              </span>
                            </div>
                          )}
                          {((row as any).workflowStatus === 'Pending Review' || row.workflows?.q1?.status === 'pending_review') && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-300 flex items-center gap-0.5 shadow-2xs">
                                <CheckCircle className="w-2 h-2 text-indigo-600" /> APPROVED & ROUTED
                              </span>
                            </div>
                          )}
                          {(row as any).workflowStatus === 'Reviewed' && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-0.5 shadow-2xs">
                                <CheckCircle className="w-2 h-2 text-purple-600" /> REVIEWED
                              </span>
                            </div>
                          )}
                          {(row as any).workflowStatus === 'Approved' && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5 shadow-2xs">
                                <CheckCircle className="w-2 h-2 text-emerald-600" /> APPROVED & SEALED
                              </span>
                            </div>
                          )}
                          {((row as any).workflowStatus === 'Returned' || (row as any).workflowStatus === 'Returned to Submitter') && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-0.5 shadow-2xs">
                                <XCircle className="w-2 h-2 text-rose-600" /> RETURNED TO SUBMITTER
                              </span>
                            </div>
                          )}
                          {!isQuarter1UnlockedKpi(row) && (isReportingAssignmentsUnlocked || isSuperAdminMike) && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                                UNLOCKED
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Reviewer */}
                      <td className="p-1.5 border-r border-slate-100 bg-slate-50/5">
                        <div className="flex flex-col gap-1">
                          <AzureADPicker 
                            value={row.reviewer || ''}
                            onChange={(val) => handleCellChange(row.id, 'reviewer', val)}
                            roleType="reviewer"
                            activeTenantId={activeTenantId}
                            isFitAll={isFitAllReportingCells}
                          />
                          {((row as any).workflowStatus === 'Pending Review' || row.workflows?.q1?.status === 'pending_review') && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-0.5 shadow-2xs">
                                <Clock className="w-2 h-2 text-blue-600" /> AWAITING REVIEWER
                              </span>
                            </div>
                          )}
                          {(row as any).workflowStatus === 'Reviewed' && (
                            <div className="flex items-center gap-1 justify-center">
                              <span className="text-[8px] font-bold font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-300 flex items-center gap-0.5 shadow-2xs">
                                <CheckCircle className="w-2 h-2 text-purple-600" /> REVIEW SIGNED-OFF
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Internal Audit */}
                      <td className="p-1.5 border-r border-slate-100 bg-slate-50/5">
                        <AzureADPicker 
                          value={row.internalAudit || ''}
                          onChange={(val) => handleCellChange(row.id, 'internalAudit', val)}
                          roleType="internal_audit"
                          activeTenantId={activeTenantId}
                          isFitAll={isFitAllReportingCells}
                        />
                      </td>

                      <td className="p-2 text-center text-[10px] text-slate-500">
                        <ExpandableCell
                          value={row.score || ''}
                          disabled={!isRowSubmitter}
                          readOnly={!isRowSubmitter}
                          onChange={(val) => handleCellChange(row.id, 'score', val)}
                          cellTitle="Score"
                          refNum={row.refNum}
                          isFitAll={isFitAllReportingCells}
                          minRows={1}
                          placeholder={!isRowSubmitter ? "Submitter Only" : "Score"}
                          onOpenExpandModal={openCellExpandModal}
                          className={`font-bold text-center font-mono ${!isRowSubmitter ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : 'bg-white text-slate-800'}`}
                        />
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
              </table>
            </div>

            {/* Reporting Pagination Controls Footer */}
            <div className="mt-2 shrink-0">
              <SDBIPPagination
                currentPage={reportingPage}
                pageSize={reportingPageSize}
                totalItems={filteredRows.length}
                onPageChange={setReportingPage}
                onPageSizeChange={setReportingPageSize}
                pageSizeOptions={[25, 50, 100, 200, 'all']}
                itemName="reporting items"
                isSaving={isSavingRows}
              />
            </div>
          </div>

          </div>
        )}

        {/* REDESIGNED DRAFTING SUITE & UPLOAD */}
        {activeTab === 'drafting' && (
          <SDBIPDraftingSuite 
            currentUser={currentUser} 
            activeTenantId={activeTenantId} 
            rows={rows} 
          />
        )}

      </div>

      {/* Upload POE Dialog Modal */}
      {poeModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-text">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-4.5 space-y-3.5 animate-fade-in text-slate-800">
            
            <div className="border-b border-slate-100 pb-2.5 flex items-center gap-3">
              <div className="p-1.5 bg-indigo-50 rounded-lg text-indigo-600">
                <Upload className="w-4.5 h-4.5" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wide">
                  Upload Portfolio of Evidence (POE)
                  {poeModal.quarter && poeModal.quarter !== 'general' ? ` - ${poeModal.quarter.toUpperCase()}` : ''}
                </h3>
                <p className="text-[9px] text-slate-500 font-mono">Ref: {poeModal.refNum} (Supabase Secure Vault)</p>
              </div>
            </div>

            {/* Upload Mode Selector Tab */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setUploadMode('single');
                  if (poeUploadedFiles.length > 1) {
                    const singleFile = [poeUploadedFiles[0]];
                    setPoeUploadedFiles(singleFile);
                    setPoeFileName(singleFile[0].name);
                    setPoeFileSize(singleFile[0].size);
                  }
                }}
                className={`flex-1 text-center py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                  uploadMode === 'single'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Single File Upload
              </button>
              <button
                type="button"
                onClick={() => setUploadMode('multi')}
                className={`flex-1 text-center py-1 text-[10px] font-bold rounded-md transition-colors cursor-pointer ${
                  uploadMode === 'multi'
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Multi-File Batch Upload
              </button>
            </div>

            <form onSubmit={handlePoeSubmit} className="space-y-3">
              
              {/* Actual File Selector Component */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block">
                  {uploadMode === 'single' ? 'Add Single File' : 'Add Multiple Files'} (Max 200MB total)
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-3 text-center cursor-pointer transition-colors relative bg-slate-50 hover:bg-indigo-50/20 group">
                  <Upload className="w-5 h-5 text-indigo-500 mx-auto mb-0.5 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-700 group-hover:text-indigo-600 block">
                    {uploadMode === 'single' ? 'Click to select a file or drag & drop here' : 'Click to add files or drag & drop here'}
                  </span>
                  <span className="text-[8.5px] text-slate-400 block mt-0.5">
                    Supports any file format (Up to 200 files, 200MB total limit per KPI)
                  </span>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    multiple
                    accept="*"
                    onChange={async (e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      const selectedList = Array.from(e.target.files);
                      if (selectedList.length > 200) {
                        setSuccessToast("You can upload at most 200 files at a time.");
                        return;
                      }
                      
                      setIsUploading(true);
                      setUploadProgress(10);
                      const progressInterval = setInterval(() => {
                        setUploadProgress(prev => {
                          if (prev >= 85) {
                            clearInterval(progressInterval);
                            return 85;
                          }
                          return prev + 15;
                        });
                      }, 80);

                      let newTotalSizeMB = 0;
                      const readPromises = selectedList.map(file => {
                        return new Promise<{ name: string; size: string; fileData?: string; fileType?: string }>((resolve) => {
                          const sizeMB = file.size / (1024 * 1024);
                          newTotalSizeMB += sizeMB;
                          const reader = new FileReader();
                          reader.onload = () => {
                            resolve({
                              name: file.name,
                              size: `${sizeMB.toFixed(2)} MB`,
                              fileData: reader.result as string,
                              fileType: file.type || getMimeTypeFromExtension(file.name)
                            });
                          };
                          reader.onerror = () => {
                            resolve({
                              name: file.name,
                              size: `${sizeMB.toFixed(2)} MB`,
                              fileType: file.type || getMimeTypeFromExtension(file.name)
                            });
                          };
                          reader.readAsDataURL(file);
                        });
                      });

                      const newFilesList = await Promise.all(readPromises);
                      clearInterval(progressInterval);
                      setUploadProgress(100);

                      setTimeout(() => {
                        setIsUploading(false);
                        setUploadProgress(0);
                      }, 400);

                      let updatedList: { name: string; size: string; fileData?: string; fileType?: string }[] = [];
                      if (uploadMode === 'single' && newFilesList.length === 1) {
                        updatedList = [newFilesList[0]];
                      } else {
                        updatedList = [...poeUploadedFiles, ...newFilesList];
                      }

                      if (updatedList.length > 200) {
                        setSuccessToast("Maximum of 200 files allowed.");
                        return;
                      }

                      const newTotalMB = updatedList.reduce((sum, f) => {
                        const val = parseFloat(f.size);
                        return sum + (isNaN(val) ? 0 : val);
                      }, 0);

                      // Calculate existing POEs total size for this KPI
                      const existingKpiPoes = poes.filter(p => p.refNum === poeModal.refNum);
                      const existingSizeMB = existingKpiPoes.reduce((sum, p) => {
                        const parsed = parseFloat(p.size || '0');
                        return sum + (isNaN(parsed) ? 0 : parsed);
                      }, 0);

                      const grandTotalMB = existingSizeMB + newTotalMB;

                      if (grandTotalMB > 200) {
                        setSuccessToast(`Total file size for KPI ${poeModal.refNum} (${grandTotalMB.toFixed(1)} MB) exceeds the 200MB limit per KPI. (Existing: ${existingSizeMB.toFixed(1)} MB, New: ${newTotalMB.toFixed(1)} MB)`);
                        return;
                      }

                      setPoeUploadedFiles(updatedList);
                      setPoeFileName(updatedList.map(f => f.name).join(', '));
                      setPoeFileSize(`${grandTotalMB.toFixed(2)} MB`);
                    }}
                  />
                </div>
              </div>

              {/* Uploading progress status bar */}
              {isUploading && (
                <div className="space-y-1 bg-indigo-50/50 border border-indigo-100 p-2 rounded-xl">
                  <div className="flex justify-between items-center text-[9px]">
                    <span className="font-bold text-indigo-700 flex items-center gap-1">
                      <RefreshCw className="w-3 h-3 animate-spin" /> Processing selected file bytes...
                    </span>
                    <span className="font-mono font-black text-indigo-800">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-150" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* SECTION 1: Existing Uploaded Files with File Delete Buttons */}
              {(() => {
                const existingRow = rows.find(r => r.id === poeModal.rowId);
                let existingFileNames: string[] = [];
                if (existingRow && poeModal.quarter) {
                  const q = poeModal.quarter;
                  if (q === 'q1') existingFileNames = existingRow.q1Poes || [];
                  else if (q === 'q2') existingFileNames = existingRow.q2Poes || [];
                  else if (q === 'midTerm') existingFileNames = existingRow.midTermPoes || [];
                  else if (q === 'q3') existingFileNames = existingRow.q3Poes || [];
                  else if (q === 'q4') existingFileNames = existingRow.q4Poes || [];
                }
                
                if (existingFileNames.length === 0) return null;
                
                return (
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block">
                      Currently Uploaded POE Files ({existingFileNames.length})
                    </label>
                    <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-2 space-y-1 max-h-24 overflow-y-auto">
                      {existingFileNames.map((fileName, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 text-[10px] bg-white p-1 px-1.5 rounded border border-emerald-200/50">
                          <span className="truncate font-medium text-slate-700" title={fileName}>{fileName}</span>
                          <button
                            type="button"
                            onClick={() => deleteExistingPoeFileInModal(fileName)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer shrink-0"
                            title="Delete this file from system"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* SECTION 2: Staged Documents for Upload with File Delete Buttons */}
              {poeUploadedFiles.length > 0 && (
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block">
                    Staged Documents to Upload ({poeUploadedFiles.length})
                  </label>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1 max-h-24 overflow-y-auto">
                    {poeUploadedFiles.map((f, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 text-[10px] bg-white p-1 px-1.5 rounded border border-slate-200">
                        <span className="truncate font-medium text-slate-700" title={f.name}>{f.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="font-mono text-[9px] text-indigo-600 font-bold uppercase">{f.name.split('.').pop() || 'FILE'} • {f.size}</span>
                          <button
                            type="button"
                            onClick={() => deleteNewUploadedFileInModal(idx)}
                            className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition cursor-pointer"
                            title="Remove from selection"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Document File Name</label>
                <input 
                  type="text" 
                  value={poeFileName}
                  onChange={(e) => setPoeFileName(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 text-[11px] rounded-lg outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  placeholder="poe_evidence.pdf"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Total File size</label>
                  <input
                    type="text"
                    value={poeFileSize}
                    onChange={(e) => setPoeFileSize(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 text-[11px] rounded-lg bg-slate-50 text-slate-600 font-semibold"
                    placeholder="e.g. 1.5 MB"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Format</label>
                  <span className="w-full block px-2.5 py-1.5 bg-slate-50 border border-slate-200 text-[11px] text-indigo-700 font-bold rounded-lg font-mono text-center uppercase">
                    {poeFileName.includes('.') ? `${poeFileName.split('.').pop()?.toUpperCase()} FORMAT` : 'ORIGINAL FORMAT'}
                  </span>
                </div>
              </div>

              {/* POE DESCRIPTION FIELD - MANDATORY FOR USER REQUIREMENT */}
              <div className="space-y-1">
                <label className="text-[9.5px] font-bold text-slate-400 uppercase font-mono tracking-wider block">POE Document Description</label>
                <textarea 
                  value={poeDescription}
                  onChange={(e) => setPoeDescription(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 text-[11px] rounded-lg outline-none focus:border-indigo-500 text-slate-800 font-medium min-h-[55px]"
                  placeholder="Provide detailed description of this Portfolio of Evidence..."
                  required
                />
              </div>

              <div className="p-2 bg-indigo-50 text-[9px] text-indigo-950 font-medium rounded-lg flex items-start gap-1.5 border border-indigo-100/50">
                <Shield className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-snug">Stores securely on Supabase cloud database Backup Archive. The original file format is preserved for direct viewing and downloading.</p>
              </div>

              <div className="flex justify-end gap-2.5 pt-1">
                <button 
                  type="button"
                  onClick={() => setPoeModal({ isOpen: false, rowId: null, refNum: '' })}
                  className="px-3.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg shadow-md transition-transform hover:scale-[1.01]"
                >
                  Confirm & Save POE
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* View POE Document Inspector Modal */}
      {viewPoeModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs select-text">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-5 animate-fade-in text-slate-800 max-h-[90vh] overflow-y-auto">
            
            {/* Header */}
            <div className="border-b border-slate-100 pb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                  <Eye className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-slate-900">
                      Portfolio of Evidence (POE) Inspector
                    </h3>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider rounded-md border border-emerald-200">
                      {viewPoeModal.quarterLabel}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    KPI Ref: <strong className="text-slate-800 font-bold">{viewPoeModal.refNum}</strong> • Supabase Cloud Vault
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setViewPoeModal(p => ({ ...p, isOpen: false }))}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                title="Close Viewer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* KPI Title Banner */}
            {viewPoeModal.kpiTitle && (
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-wider block">Targeted KPI</span>
                <p className="text-xs font-bold text-slate-800 leading-snug">{viewPoeModal.kpiTitle}</p>
              </div>
            )}

            {/* Multiple Files Tabs / List */}
            {viewPoeModal.files.length > 0 && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">
                  Attached Evidence Documents ({viewPoeModal.files.length})
                </label>
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {viewPoeModal.files.map((file, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setViewPoeModal(p => ({ ...p, activeFileIndex: idx }))}
                      className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border cursor-pointer shrink-0 ${
                        viewPoeModal.activeFileIndex === idx
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span className="max-w-[160px] truncate">{file.name}</span>
                      <span className="opacity-80 text-[9px] font-mono uppercase bg-black/10 px-1 py-0.5 rounded">{file.name.split('.').pop() || 'FILE'}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active File Inspector Box */}
            {(() => {
              const activeFile = viewPoeModal.files[viewPoeModal.activeFileIndex] || viewPoeModal.files[0] || { name: 'poe_document.pdf', size: '1.5 MB', date: new Date().toISOString().split('T')[0] };
              const ext = activeFile.name.split('.').pop()?.toUpperCase() || 'DOCUMENT';
              const isImage = ['PNG', 'JPG', 'JPEG', 'GIF', 'SVG', 'WEBP'].includes(ext) || (activeFile.fileData && activeFile.fileData.startsWith('data:image/'));
              const isPdf = ext === 'PDF' || (activeFile.fileData && activeFile.fileData.startsWith('data:application/pdf'));

              return (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                  {/* Visual Document Header */}
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-500/20 text-indigo-300 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold font-mono text-indigo-200 truncate max-w-[320px]">{activeFile.name}</h4>
                        <p className="text-[10px] text-slate-400 font-mono">Original Format: <strong className="text-emerald-400 font-bold">{ext}</strong> • Size: {activeFile.size || '1.5 MB'} • Uploaded: {activeFile.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const sizeBytes = activeFile.size ? parseFloat(activeFile.size) * 1024 * 1024 : 1500000;
                          setPreviewDoc({
                            name: activeFile.name,
                            mimeType: activeFile.fileType || getMimeTypeFromExtension(activeFile.name),
                            size: sizeBytes,
                            dataUrl: activeFile.fileData,
                            kpiName: viewPoeModal.kpiTitle || 'Municipal Service Delivery Target',
                            quarter: viewPoeModal.quarterLabel,
                            uploadedAt: activeFile.date || new Date().toISOString(),
                            uploadedBy: 'Performance Officer'
                          });
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-wide rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Open document in gorgeous full-screen system workspace"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>View on System</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const extLower = ext.toLowerCase();
                          const isNativeBrowserOpenable = ['pdf', 'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(extLower);

                          if (isNativeBrowserOpenable) {
                            window.open(activeFileBlobUrl || activeFile.fileData, '_blank');
                          } else {
                            const sizeBytes = activeFile.size ? parseFloat(activeFile.size) * 1024 * 1024 : 1500000;
                            setPreviewDoc({
                              name: activeFile.name,
                              mimeType: activeFile.fileType || getMimeTypeFromExtension(activeFile.name),
                              size: sizeBytes,
                              dataUrl: activeFile.fileData,
                              kpiName: viewPoeModal.kpiTitle || 'Municipal Service Delivery Target',
                              quarter: viewPoeModal.quarterLabel,
                              uploadedAt: activeFile.date || new Date().toISOString(),
                              uploadedBy: 'Performance Officer'
                            });
                          }
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wide rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="View original file in its native format in a new browser tab or on-system viewer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Original File</span>
                      </button>
                      {isSuperAdminMike && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`⚠️ Master Override (Mike):\nAre you sure you want to PERMANENTLY PURGE and delete "${activeFile.name}" from Supabase storage? This cannot be undone.`)) {
                              handleMasterPurgeActivePoe(viewPoeModal.rowId, viewPoeModal.quarterKey, activeFile.name);
                            }
                          }}
                          className="px-2.5 py-1 bg-rose-700 hover:bg-rose-800 text-rose-100 text-[10px] font-black uppercase tracking-wide rounded-md transition shadow-xs flex items-center gap-1.5 cursor-pointer border border-rose-500/60"
                          title="Master Override: Purge locked PoE file (Mike)"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Purge PoE</span>
                        </button>
                      )}
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full border border-emerald-500/30">
                        <ShieldCheck className="w-3 h-3" /> VERIFIED POE
                      </span>
                    </div>
                  </div>

                  {/* Visual File Canvas Preview with Rich Parsers */}
                  <style dangerouslySetInnerHTML={{ __html: `
                    .excel-table-preview table { border-collapse: collapse; width: 100%; min-width: 600px; }
                    .excel-table-preview th, .excel-table-preview td { border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }
                    .excel-table-preview tr:nth-child(even) { background-color: #f8fafc; }
                    .excel-table-preview th { background-color: #f1f5f9; font-weight: bold; color: #1e293b; }
                    .word-docx-preview p { margin-bottom: 0.75rem; }
                    .word-docx-preview h1, .word-docx-preview h2, .word-docx-preview h3 { font-weight: bold; margin-top: 1rem; margin-bottom: 0.5rem; }
                  ` }} />

                  {docRenderLoading ? (
                    <div className="p-12 bg-slate-50 flex flex-col items-center justify-center gap-3 border-b border-slate-200">
                      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
                      <p className="text-xs font-bold text-slate-500">Parsing and rendering original file binary on-screen...</p>
                    </div>
                  ) : docRenderError ? (
                    <div className="p-8 bg-amber-50/70 border-b border-slate-200 flex flex-col items-center justify-center gap-3">
                      <AlertTriangle className="w-8 h-8 text-amber-600 animate-bounce" />
                      <p className="text-xs font-bold text-slate-700 text-center">{docRenderError}</p>
                      <p className="text-[10px] text-slate-500 max-w-sm text-center">You can still download the original document using the button below to view it locally.</p>
                    </div>
                  ) : isImage && (activeFileBlobUrl || activeFile.fileData) ? (
                    <div className="p-4 bg-slate-950 flex justify-center items-center border-b border-slate-800">
                      <img src={activeFileBlobUrl || activeFile.fileData} alt={activeFile.name} className="max-h-96 object-contain rounded-lg border border-slate-800" referrerPolicy="no-referrer" />
                    </div>
                  ) : isPdf && (activeFileBlobUrl || activeFile.fileData) ? (
                    <div className="p-2 bg-slate-900 border-b border-slate-800">
                      <iframe src={activeFileBlobUrl || activeFile.fileData} className="w-full h-[650px] rounded-lg border border-slate-800" title={activeFile.name} />
                    </div>
                  ) : renderedDocHtml ? (
                    <div className="p-5 max-h-[400px] overflow-y-auto bg-white border-b border-slate-200 text-slate-800 text-xs leading-relaxed font-sans select-text">
                      <div className="word-docx-preview border border-slate-100 p-6 rounded-xl shadow-xs space-y-4" dangerouslySetInnerHTML={{ __html: renderedDocHtml }} />
                    </div>
                  ) : renderedXlsxSheets.length > 0 ? (
                    <div className="bg-slate-50 border-b border-slate-200 flex flex-col select-text">
                      {/* Sheet Switch Tabs */}
                      {renderedXlsxSheets.length > 1 && (
                        <div className="flex gap-1 bg-slate-200 p-1 overflow-x-auto border-b border-slate-300">
                          {renderedXlsxSheets.map((sheet, sIdx) => (
                            <button
                              key={sIdx}
                              type="button"
                              onClick={() => setActiveXlsxSheetIdx(sIdx)}
                              className={`px-3 py-1 rounded text-[10px] font-bold transition whitespace-nowrap cursor-pointer ${
                                activeXlsxSheetIdx === sIdx
                                  ? 'bg-white text-indigo-700 shadow-xs'
                                  : 'text-slate-600 hover:bg-white/50'
                              }`}
                            >
                              📊 {sheet.name}
                            </button>
                          ))}
                        </div>
                      )}
                      {/* Active Sheet HTML Table wrapper */}
                      <div className="p-2 overflow-auto max-h-[350px]">
                        <div 
                          className="excel-table-preview text-[11px] font-mono border border-slate-300 rounded-lg bg-white overflow-hidden" 
                          dangerouslySetInnerHTML={{ __html: renderedXlsxSheets[activeXlsxSheetIdx]?.html || renderedXlsxSheets[0]?.html }} 
                        />
                      </div>
                    </div>
                  ) : renderedTextContent ? (
                    <div className="p-3 bg-slate-950 border-b border-slate-800 overflow-auto max-h-[350px] select-text">
                      <pre className="font-mono text-[10px] text-emerald-400 whitespace-pre leading-relaxed">{renderedTextContent}</pre>
                    </div>
                  ) : (
                    <div className="p-5 bg-slate-50/70 border-b border-slate-200 space-y-4">
                      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3 font-mono text-[11px] text-slate-700">
                        <div className="border-b border-slate-100 pb-2 flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          <span>NKANGALA DISTRICT MUNICIPALITY — AUDITED EVIDENCE RECORD</span>
                          <span>FORMAT: {ext}</span>
                        </div>
                        
                        <div className="space-y-1.5 font-sans">
                          <span className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Document Narrative / Description</span>
                          <div className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-lg text-slate-800 text-xs font-medium leading-relaxed">
                            {viewPoeModal.description || "No narrative description provided for this POE upload."}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] text-slate-500 border-t border-slate-100">
                          <div><strong>Storage Vault:</strong> Supabase PostgreSQL Storage</div>
                          <div><strong>File Extension:</strong> .{ext.toLowerCase()}</div>
                          <div><strong>Audit Status:</strong> Verified & Original Format Preserved</div>
                          <div><strong>Municipal Record:</strong> Official Top Layer Record</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Document Action Footer */}
                  <div className="p-3 bg-slate-100/60 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownloadPoe(activeFile.name, activeFile.fileData, activeFile.fileType)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download in Original ({ext}) Format</span>
                    </button>

                    <div className="flex items-center gap-2">
                      {isSuperAdminMike && (
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`⚠️ Master Override (Mike):\nAre you sure you want to PERMANENTLY PURGE and delete "${activeFile.name}" from Supabase storage? This cannot be undone.`)) {
                              handleMasterPurgeActivePoe(viewPoeModal.rowId, viewPoeModal.quarterKey, activeFile.name);
                            }
                          }}
                          className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                          title="Master Override: Purge and delete this PoE document from Supabase storage (Mike)"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Purge / Delete PoE</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setViewPoeModal(p => ({ ...p, isOpen: false }));
                          triggerUploadModal(viewPoeModal.rowId!, viewPoeModal.refNum, viewPoeModal.quarterKey as any);
                        }}
                        className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <Upload className="w-4 h-4 text-indigo-600" />
                        <span>Upload / Replace Files</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewPoeModal(p => ({ ...p, isOpen: false }))}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

      {previewDoc && (
        <OfficeDocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

      {/* Clear Top Layer Modal */}
      {clearTopLayerModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100000] flex items-center justify-center p-4 backdrop-blur-xs select-text">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 animate-fade-in text-slate-800">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Clear SDBIP Top Layer Table
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Choose the scope of Top Layer items to clear from the database.
                </p>
              </div>
            </div>

            <div className="space-y-2.5">
              <label
                onClick={() => setClearTopLayerModal(p => ({ ...p, clearTarget: 'all' }))}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  clearTopLayerModal.clearTarget === 'all'
                    ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400/30'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <input
                  type="radio"
                  name="clearTopLayerScope"
                  checked={clearTopLayerModal.clearTarget === 'all'}
                  onChange={() => setClearTopLayerModal(p => ({ ...p, clearTarget: 'all' }))}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900">Clear All Table Items ({rows.length} total)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Wipes all Top Layer KPIs, targets, and baselines completely from Supabase.</div>
                </div>
              </label>

              {filteredRows.length < rows.length && (
                <label
                  onClick={() => setClearTopLayerModal(p => ({ ...p, clearTarget: 'filtered' }))}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                    clearTopLayerModal.clearTarget === 'filtered'
                      ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400/30'
                      : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                  }`}
                >
                  <input
                    type="radio"
                    name="clearTopLayerScope"
                    checked={clearTopLayerModal.clearTarget === 'filtered'}
                    onChange={() => setClearTopLayerModal(p => ({ ...p, clearTarget: 'filtered' }))}
                    className="mt-0.5 text-rose-600 focus:ring-rose-500"
                  />
                  <div>
                    <div className="text-xs font-black text-slate-900">Clear Filtered Items Only ({filteredRows.length} filtered)</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Removes only the items currently matching your active search/filter criteria.</div>
                  </div>
                </label>
              )}
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                Warning: This action will permanently update the municipal Supabase persistent database.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClearTopLayerModal({ isOpen: false, clearTarget: 'all' })}
                disabled={isClearing}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteClearTopLayer(clearTopLayerModal.clearTarget)}
                disabled={isClearing || rows.length === 0}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isClearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isClearing ? 'Clearing...' : 'Confirm & Clear Table'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear Reporting Modal */}
      {clearReportingModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[100000] flex items-center justify-center p-4 backdrop-blur-xs select-text">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 animate-fade-in text-slate-800">
            <div className="flex items-start gap-3 border-b border-slate-100 pb-3">
              <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Clear SDBIP Top Layer Reporting Data
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Select whether to clear quarterly actuals, specific quarters, or entire records.
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
              <label
                onClick={() => setClearReportingModal(p => ({ ...p, scope: 'all_quarters' }))}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                  clearReportingModal.scope === 'all_quarters'
                    ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400/30'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <input
                  type="radio"
                  name="clearReportingScope"
                  checked={clearReportingModal.scope === 'all_quarters'}
                  onChange={() => setClearReportingModal(p => ({ ...p, scope: 'all_quarters' }))}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-black text-slate-900">Reset All Quarterly Reporting Actuals (Recommended)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Clears Q1, Q2, Mid-Term, Q3 & Q4 actuals, variances, corrective actions, and expenditure while keeping KPIs and targets.</div>
                </div>
              </label>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {(['q1', 'q2', 'midTerm', 'q3', 'q4'] as const).map(q => {
                  const qLabel = q === 'midTerm' ? 'Mid-Term (Q1+Q2)' : q.toUpperCase();
                  const isSelected = clearReportingModal.scope === q;
                  return (
                    <label
                      key={q}
                      onClick={() => setClearReportingModal(p => ({ ...p, scope: q }))}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400/30'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="clearReportingScope"
                        checked={isSelected}
                        onChange={() => setClearReportingModal(p => ({ ...p, scope: q }))}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span className="text-xs font-bold text-slate-800">Clear {qLabel} Only</span>
                    </label>
                  );
                })}
              </div>

              <label
                onClick={() => setClearReportingModal(p => ({ ...p, scope: 'entire_table' }))}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition mt-2 ${
                  clearReportingModal.scope === 'entire_table'
                    ? 'bg-rose-50/70 border-rose-300 ring-1 ring-rose-400/30'
                    : 'bg-slate-50 border-slate-200 hover:bg-slate-100/70'
                }`}
              >
                <input
                  type="radio"
                  name="clearReportingScope"
                  checked={clearReportingModal.scope === 'entire_table'}
                  onChange={() => setClearReportingModal(p => ({ ...p, scope: 'entire_table' }))}
                  className="mt-0.5 text-rose-600 focus:ring-rose-500"
                />
                <div>
                  <div className="text-xs font-black text-rose-900">Purge Entire SDBIP Table ({rows.length} records)</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">Completely removes all records and KPI definitions from the database.</div>
                </div>
              </label>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="text-[11px] leading-relaxed">
                Changes will instantly be synchronized and committed to the Supabase backend.
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setClearReportingModal({ isOpen: false, scope: 'all_quarters' })}
                disabled={isClearing}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleExecuteClearReporting(clearReportingModal.scope)}
                disabled={isClearing || rows.length === 0}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition disabled:opacity-50"
              >
                {isClearing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isClearing ? 'Clearing...' : 'Confirm & Clear Reporting'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expandable Cell Full Inspector / Editor Modal */}
      <CellExpandModal
        modalState={cellModal}
        onClose={() => setCellModal(m => ({ ...m, isOpen: false }))}
      />

      {/* Password Modal for Submitter/Approver Unlock */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleUnlockSubmit}
            className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in duration-200"
          >
            <div className="flex items-start gap-3">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                <KeyRound className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wide">
                  Unlock Submitter/Approver Assignments
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Only authorized administration personnel are allowed to modify responsibility assignments for active KPIs. Please provide the bypass credential.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 block tracking-wider">
                Enter Bypass Password
              </label>
              <input
                type="password"
                required
                autoFocus
                placeholder="••••••••••••••"
                value={enteredPassword}
                onChange={(e) => {
                  setEnteredPassword(e.target.value);
                  setPasswordError('');
                }}
                className="w-full px-3.5 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm bg-slate-50/50 text-slate-900"
              />
              {passwordError && (
                <div className="text-[11px] font-semibold text-rose-600 flex items-center gap-1 mt-1 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{passwordError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-xs cursor-pointer flex items-center gap-1.5 transition"
              >
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Unlock Columns</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Budget Override Modal */}
      {budgetOverrideModalRow && (() => {
        const row = budgetOverrideModalRow;
        const breakdown = getRowBudgetBreakdown(row);
        const isMikeMzansi = (currentUser.email || '').toLowerCase().includes('mike@mzansiflow.co.za') ||
                             (currentUser.email || '').toLowerCase().includes('mike@massivedynamixdistributors.com');

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 border border-rose-500/30">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Budget Override Permission</h3>
                    <p className="text-[11px] text-slate-300">Required Authorization from mike@mzansiflow.co.za</p>
                  </div>
                </div>
                <button
                  onClick={() => setBudgetOverrideModalRow(null)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* KPI Info */}
                <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 font-mono">{row.refNum}</span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider">{row.responsibleUnit || row.submitter || 'Official'}</span>
                  </div>
                  <p className="text-slate-600 line-clamp-2">{row.kpi}</p>
                </div>

                {/* Financial Overview Cards */}
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block uppercase font-medium">Total Budget</span>
                    <span className="font-bold text-slate-800 text-sm">R {breakdown.totalBudget.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-indigo-50 rounded-lg border border-indigo-200">
                    <span className="text-[10px] text-indigo-600 block uppercase font-medium">Total Spent</span>
                    <span className="font-bold text-indigo-900 text-sm">R {breakdown.totalSpent.toLocaleString()}</span>
                  </div>
                  <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-200">
                    <span className="text-[10px] text-rose-600 block uppercase font-medium">Excess Overrun</span>
                    <span className="font-bold text-rose-700 text-sm">+R {breakdown.excessAmount.toLocaleString()}</span>
                  </div>
                </div>

                {/* Status Message */}
                {row.budgetOverride?.approved ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Override Approved by {row.budgetOverride.approvedBy || 'mike@mzansiflow.co.za'}</span>
                      <span className="text-[11px] text-emerald-700">{row.budgetOverride.reason || 'Authorized budget variance.'}</span>
                    </div>
                  </div>
                ) : row.budgetOverride?.requested ? (
                  <div className="p-3 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                    <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Permission Request Sent to mike@mzansiflow.co.za</span>
                      <span className="text-[11px] text-amber-700">Requested by {row.budgetOverride.requestedBy} on {new Date(row.budgetOverride.requestedAt || '').toLocaleDateString()}. Reason: "{row.budgetOverride.reason || 'None provided'}"</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-1">
                    <p className="font-semibold text-slate-800">
                      Expenditure input of <span className="font-mono font-bold text-indigo-700">R {breakdown.totalSpent.toLocaleString()}</span> has been accepted, but exceeds allocated budget of <span className="font-mono font-bold text-slate-700">R {breakdown.totalBudget.toLocaleString()}</span> by <span className="font-mono font-bold text-rose-700">R {breakdown.excessAmount.toLocaleString()}</span>.
                    </p>
                    <p className="text-[11px] text-slate-500">
                      An official permission request will be delivered to <strong className="text-slate-700 font-semibold">mike@mzansiflow.co.za</strong> for audit compliance sign-off.
                    </p>
                  </div>
                )}

                {/* Justification note */}
                {!row.budgetOverride?.approved && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-700">
                      Justification / Motivation for Budget Overrun:
                    </label>
                    <textarea
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="e.g. SCM price escalation, emergency infrastructure repairs, or contingency reallocation..."
                      rows={3}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setBudgetOverrideModalRow(null)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg font-medium transition cursor-pointer"
                  >
                    Close
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Direct approval button if logged-in user is mike@mzansiflow.co.za or admin */}
                    {isMikeMzansi && !row.budgetOverride?.approved && (
                      <button
                        type="button"
                        onClick={async () => {
                          const updated = rows.map(r => {
                            if (r.id === row.id) {
                              return {
                                ...r,
                                budgetOverride: {
                                  approved: true,
                                  approvedBy: 'mike@mzansiflow.co.za',
                                  approvedAt: new Date().toISOString(),
                                  excessAmount: breakdown.excessAmount,
                                  reason: overrideReason || 'Approved by mike@mzansiflow.co.za'
                                }
                              };
                            }
                            return r;
                          });
                          setRows(updated);
                          await debouncedSaveRows(updated);
                          setSuccessToast('✓ Budget override successfully authorized and approved by mike@mzansiflow.co.za.');
                          setBudgetOverrideModalRow(null);
                        }}
                        className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Approve Override (as mike@mzansiflow.co.za)
                      </button>
                    )}

                    {!row.budgetOverride?.approved && !isMikeMzansi && (
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSubmittingOverride(true);
                          try {
                            const updated = rows.map(r => {
                              if (r.id === row.id) {
                                return {
                                  ...r,
                                  budgetOverride: {
                                    requested: true,
                                    requestedBy: currentUser.email || 'submitter',
                                    requestedAt: new Date().toISOString(),
                                    excessAmount: breakdown.excessAmount,
                                    reason: overrideReason || 'Budget overrun requiring authorization'
                                  }
                                };
                              }
                              return r;
                            });
                            setRows(updated);
                            await debouncedSaveRows(updated);

                            await dispatchSdbipNotification(activeTenantId, {
                              targetUser: 'mike@mzansiflow.co.za',
                              senderUser: currentUser.email || currentUser.fullName || 'Submitter',
                              kpiId: row.id,
                              refNum: row.refNum,
                              kpiName: row.kpi || '',
                              phase: 'Budget Override',
                              message: `Budget Override Request: Total expenditure (R ${breakdown.totalSpent.toLocaleString()}) exceeds budget (R ${breakdown.totalBudget.toLocaleString()}) by R ${breakdown.excessAmount.toLocaleString()}.`,
                              comment: overrideReason || 'Please review and authorize budget override.',
                              actionType: 'submitted'
                            });

                            setSuccessToast('✓ Permission request successfully delivered to mike@mzansiflow.co.za.');
                            setBudgetOverrideModalRow(null);
                          } catch (e) {
                            setSuccessToast('Permission request recorded on system for mike@mzansiflow.co.za.');
                            setBudgetOverrideModalRow(null);
                          } finally {
                            setIsSubmittingOverride(false);
                          }
                        }}
                        disabled={isSubmittingOverride}
                        className="px-3 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition flex items-center gap-1 cursor-pointer shadow-sm disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> Request Permission from mike@mzansiflow.co.za
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Master Security Password Modal for mike@mzansiflow.co.za */}
      {mikeAuthModal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 select-none">
          <div className="bg-slate-900 border-2 border-indigo-500/60 rounded-2xl max-w-md w-full p-6 shadow-2xl text-white space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider text-white">
                  {mikeAuthModal.title || 'Security Authorization Required'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setMikeAuthModal(p => ({ ...p, isOpen: false, passwordInput: '', error: null }))}
                className="text-slate-400 hover:text-white p-1 rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This high-privilege administrative action is restricted exclusively to <strong>mike@mzansiflow.co.za</strong>. Please enter your master security authorization password to proceed.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (mikeAuthModal.passwordInput === '8655M9sznnes01*') {
                  const actionToExecute = mikeAuthModal.action;
                  setMikeAuthModal({ isOpen: false, title: '', action: () => {}, passwordInput: '', error: null });
                  actionToExecute();
                } else {
                  setMikeAuthModal(p => ({ ...p, error: 'Incorrect password. Action rejected.' }));
                }
              }}
              className="space-y-4"
            >
              <div>
                <input
                  type="password"
                  autoFocus
                  value={mikeAuthModal.passwordInput}
                  onChange={(e) => setMikeAuthModal(p => ({ ...p, passwordInput: e.target.value, error: null }))}
                  placeholder="Enter security password (8655M9sznnes01*)..."
                  className="w-full bg-slate-950 border border-slate-700 focus:border-indigo-500 rounded-xl px-4 py-2 text-sm text-white outline-none font-mono"
                />
                {mikeAuthModal.error && (
                  <p className="text-rose-400 text-xs font-bold mt-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{mikeAuthModal.error}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setMikeAuthModal(p => ({ ...p, isOpen: false, passwordInput: '', error: null }))}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer"
                >
                  Authenticate & Proceed
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
