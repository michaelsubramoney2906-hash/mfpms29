import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { 
  FileText, Shield, Info, BookOpen, Compass, Layers,
  Plus, Trash2, Save, Send, Download, Lock, CheckSquare, 
  HelpCircle, Archive, ClipboardList, Briefcase, FileDown,
  Check, Edit2, Sparkles, CheckCircle2, ShieldCheck, XSquare, Eye, EyeOff,
  Maximize2, Minimize2, Paperclip, Upload, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { PADraftingSuite } from './PADraftingSuite';
import { LeadFireFighterPADraftingSuite } from './LeadFireFighterPADraftingSuite';
import { DraftingSuiteFirefighters } from './DraftingSuiteFirefighters';
import { DraftingSuiteTeam } from './DraftingSuiteTeam';
import { PATemplates } from './PATemplates';
import { NKANGALA_LOGO_BASE64 } from './nkangala_logo_base64';
import { PoeDocument } from './Evaluation_IPMS';


const DUAL_LAYER_USERS = [
  'hlezard@nkangaladm.gov.za',
  'dimpems@nkangaladm.gov.za',
  'madihlabapk@nkangaladm.gov.za',
  'mazwitc@nkangaladm.gov.za',
  'bembem@nkangaladm.gov.za',
  'masanabol@nkangaladm.gov.za'
].map(e => e.toLowerCase());

export const hasVariance = (target?: string, actual?: string): boolean => {
  if (!target || !actual || !target.toString().trim() || !actual.toString().trim()) return false;
  const cleanNum = (val: string) => {
    const trimmed = val.trim();
    const standardFormat = trimmed.replace(/,/g, '').replace(/\s/g, '');
    const match = standardFormat.match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0]);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };
  const tNum = cleanNum(target.toString());
  const aNum = cleanNum(actual.toString());
  if (tNum !== null && aNum !== null) {
    return Math.abs(tNum - aNum) > 0.0001;
  }
  const tNorm = target.toString().trim().toLowerCase();
  const aNorm = actual.toString().trim().toLowerCase();
  return tNorm !== aNorm;
};

export const calculateVariance = (target?: string, actual?: string): string => {
  if (!target || !actual || !target.toString().trim() || !actual.toString().trim()) return '0';
  const cleanNum = (val: string) => {
    const standardFormat = val.toString().replace(/,/g, '').replace(/\s/g, '');
    const match = standardFormat.match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0]);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };
  const tNum = cleanNum(target.toString());
  const aNum = cleanNum(actual.toString());
  if (tNum !== null && aNum !== null) {
    const diff = tNum - aNum;
    if (Math.abs(diff) < 0.0001) return '0';
    return Number(diff.toFixed(2)).toString();
  }
  const tNorm = target.toString().trim().toLowerCase();
  const aNorm = actual.toString().trim().toLowerCase();
  if (tNorm === aNorm) return '0';
  return 'Variance (Target not met)';
};

interface CompactPoeUploaderProps {
  label: string;
  poeDescription?: string;
  files: PoeDocument[];
  onUpload: (newDocs: PoeDocument[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function CompactPoeUploader({
  label,
  poeDescription,
  files,
  onUpload,
  onRemove,
  disabled
}: CompactPoeUploaderProps) {
  const fileInputId = `compact_poe_${label.replace(/\s+/g, '_')}_${Math.random().toString(36).substr(2, 9)}`;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const fileList = e.target.files;
    const newDocs: PoeDocument[] = [];
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (file.size > 200 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 200MB limit.`);
        continue;
      }
      try {
        const doc = await new Promise<PoeDocument>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `poe_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              name: file.name,
              mimeType: file.type || 'application/octet-stream',
              size: file.size,
              dataUrl: reader.result as string,
              uploadedAt: new Date().toISOString(),
              uploadedBy: 'System'
            });
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newDocs.push(doc);
      } catch (err) {
        console.error("File reading failed:", err);
      }
    }
    if (newDocs.length > 0) {
      onUpload(newDocs);
    }
    e.target.value = '';
  };

  return (
    <div className="mt-1.5 pt-1.5 border-t border-slate-200/60 w-full text-left">
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tight flex items-center gap-1">
          <Lock className="w-2.5 h-2.5 text-amber-600 shrink-0" />
          {label} (Locked):
        </span>
        {!disabled && (
          <label htmlFor={fileInputId} className="flex items-center gap-0.5 text-[8px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer bg-indigo-50 hover:bg-indigo-100 px-1 py-0.5 rounded transition">
            <Upload className="w-2 h-2" />
            <span>Upload</span>
            <input
              id={fileInputId}
              type="file"
              multiple
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>

      {/* Locked Unique POE Description per KPI */}
      {poeDescription ? (
        <div className="mb-1.5 p-1 bg-amber-50/70 border border-amber-200/80 rounded text-[8px] text-slate-700 leading-snug">
          <span className="font-semibold text-slate-800 select-text break-words line-clamp-3 hover:line-clamp-none" title={poeDescription}>
            {poeDescription}
          </span>
        </div>
      ) : null}

      {files && files.length > 0 ? (
        <div className="flex flex-col gap-1 max-h-[60px] overflow-y-auto">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-1 bg-slate-50 border border-slate-150 rounded px-1 py-0.5 text-[8px]">
              <a
                href={file.dataUrl}
                download={file.name}
                className="font-medium text-blue-600 hover:underline truncate max-w-[90px] flex items-center gap-0.5"
                title={file.name}
              >
                <Paperclip className="w-2 h-2 shrink-0 text-slate-400" />
                <span className="truncate">{file.name}</span>
              </a>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => onRemove(file.id)}
                  className="text-red-500 hover:text-red-700 font-bold shrink-0"
                >
                  <Trash2 className="w-2 h-2" />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <span className="text-[8px] text-slate-400 italic">No POE files</span>
      )}
    </div>
  );
}

export const DEFAULT_TECHNICAL_SERVICES_ROWS = [
  ['1', 'Eng. Sipho Mthembu (Chief Engineer / General Manager)', 'TS-0100', 'Team Leader'],
  ['2', 'Johan Botha (Senior Water Network Superintendent)', 'TS-0205', 'Team Member'],
  ['3', 'Nolwazi Dube (Water Distribution Supervisor)', 'TS-0312', 'Team Member'],
  ['4', 'Tebogo Radebe (Pipe Fitting & Valve Specialist)', 'TS-0418', 'Team Member'],
  ['5', 'Farai Moyo (Wastewater Plant Process Controller)', 'TS-0525', 'Team Member'],
  ['6', 'Mandla Ndlovu (Water Quality Testing Tech)', 'TS-0630', 'Team Member']
];

export const DEFAULT_CORPORATE_SERVICES_ROWS = [
  ['1', 'Audrey Mpanza (Director: Corporate Services)', 'CS-0101', 'Team Leader'],
  ['2', 'Mike Thompson (Senior HR & Governance Lead)', 'CS-0205', 'Team Member'],
  ['3', 'Fatima Patel (Legal & Administration Officer)', 'CS-0312', 'Team Member'],
  ['4', 'Sipho Dlamini (IT & Records Systems Administrator)', 'CS-0418', 'Team Member'],
  ['5', 'Zama Khumalo (Committee & Secretariat Specialist)', 'CS-0522', 'Team Member'],
  ['6', 'Thabo Mokoena (Auxiliary Services & Logistics Coordinator)', 'CS-0630', 'Team Member']
];

export const DEFAULT_PMS_TEAM_ROWS = [
  ['1', 'Delphine Naidoo (PMS Manager / Performance Lead)', 'PM-0100', 'Team Leader'],
  ['2', 'Qiniso Sithole (SDBIP & Reporting Specialist)', 'PM-0210', 'Team Member'],
  ['3', 'Marlan Botha (M&E Data Analyst)', 'PM-0320', 'Team Member'],
  ['4', 'Nomvula Khumalo (Institutional Performance Officer)', 'PM-0415', 'Team Member'],
  ['5', 'Brandon Pillay (Quality Assurance & Audit Liaison)', 'PM-0530', 'Team Member']
];

const STRATEGIC_OBJECTIVES = [
  "To ensure reliable bulk water and electricity infrastructure",
  "To promote local agrarian, manufacturing, and tourism hospitality economy",
  "To achieve unqualified AG audit with zero recurring findings",
  "To enable deep responsive community consultation across all wards",
  "To improve professional competency and human capital retention",
  "To enforce optimal sustainable land use management aligned with SPLUMA",
  "To implement standard mSCOA compliance and cash-backed budgeting"
];

const MSCOA_CODES = [
  "Funding",
  "Functions",
  "Municipal Standard Classification/Responsibility",
  "Project",
  "Costing",
  "Regional Indicator",
  "Item"
];

interface PerformanceAgreementsProps {
  currentUser: User;
  activeTenantId: string;
  isPlan?: boolean;
  isTeamPlan?: boolean;
  isTeamPlan2?: boolean;
}

interface PlanMetadata {
  name: string;
  period: string;
  department: string;
  position: string;
  level: string;
  email: string;
  manager: string;
  reportTo?: string;
  managerEmail?: string;
  dateSignedEmployee?: string;
  dateSignedManager?: string;
  _isCleared?: boolean;
  _isFredExtracted?: boolean;
}

interface PlanKPIItem {
  id: string;
  strategicGoal: string;
  kpiNo: string;
  kpi: string;
  bsd: boolean;
  led: boolean;
  mfvm: boolean;
  ggpp: boolean;
  midt: boolean;
  sr: boolean;
  kpa: string;
  mscoaCode?: string;
  baseline: string;
  baselineYear?: string;
  budget?: string;
  
  // annual/quarterly target columns
  annualTarget?: string;
  q1Target?: string;
  q1Actual?: string;
  q1ActualExpense?: string;
  q1Comment?: string;
  q1Score?: string;
  q1Corrective?: string;
  q2Target?: string;
  q2Actual?: string;
  q2ActualExpense?: string;
  q2Comment?: string;
  q2Score?: string;
  q2Corrective?: string;
  midtermTarget?: string;
  midtermActual?: string;
  midtermActualExpense?: string;
  midtermComment?: string;
  midtermScore?: string;
  midtermCorrective?: string;
  q3Target?: string;
  q3Actual?: string;
  q3ActualExpense?: string;
  q3Comment?: string;
  q3Score?: string;
  q3Corrective?: string;
  q4Target?: string;
  q4Actual?: string;
  q4ActualExpense?: string;
  q4Comment?: string;
  q4Score?: string;
  q4Corrective?: string;

  // Annual Summary Metrics
  annualActual?: string;
  annualActualExpense?: string;
  annualActualExp?: string;
  annualVariance?: string;
  annualCorrective?: string;

  // Quarterly POEs
  q1Poe?: string;
  q2Poe?: string;
  midtermPoe?: string;
  q3Poe?: string;
  q4Poe?: string;
  annualRequiredPoe?: string;

  q1PoeDocs?: PoeDocument[];
  q2PoeDocs?: PoeDocument[];
  midtermPoeDocs?: PoeDocument[];
  q3PoeDocs?: PoeDocument[];
  q4PoeDocs?: PoeDocument[];

  q1Locked?: boolean;
  q2Locked?: boolean;
  q3Locked?: boolean;
  q4Locked?: boolean;

  poe: string;
  poeDocs?: PoeDocument[];
  poeFileBase64?: string;
  poeFileName?: string;
  weighting: string;
  myScore: string;
  
  evaluation?: string;
  review?: string;
}

const safeJson = async (res: Response) => {
  try {
    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await res.json();
    }
  } catch (e) {
    console.error("Error parsing JSON:", e);
  }
  return null;
};

export const isCellNA = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toUpperCase();
  return s === 'N/A' || s === 'NA' || s === 'N / A' || s === 'NOT APPLICABLE' || s.startsWith('N/A') || s.startsWith('NOT APPLICABLE') || s.includes('LOCKED (NOT REPORTABLE)');
};

export function PerformanceAgreements({ currentUser, activeTenantId, isPlan, isTeamPlan, isTeamPlan2 }: PerformanceAgreementsProps) {
  const headingTitle = isTeamPlan2 ? "Team Performance Plan 2" : isTeamPlan ? "Team Performance Plan" : isPlan ? "Performance Plan" : "Performance Agreement";
  const subTitle = isTeamPlan2
    ? "Team 2 strategic municipal performance targets, scorecards, and action plans"
    : isTeamPlan
    ? "Team strategic municipal performance targets, scorecards, and action plans"
    : isPlan 
      ? "Strategic municipal performance targets and action plans" 
      : "Formal contracts & expectations";

  const apiEndpoint = isTeamPlan2 ? "team-pplan-2" : isTeamPlan ? "team-pplan" : "pplan";

  // State Management
  const [items, setItems] = useState<PlanKPIItem[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [availableKpas, setAvailableKpas] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<PlanMetadata>({
    name: '',
    period: '',
    department: '',
    position: '',
    level: '',
    email: '',
    manager: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [showRestrictedFieldsOverride, setShowRestrictedFieldsOverride] = useState(true);
  const [activeTab, setActiveTab] = useState<'brief' | 'templates' | 'drafting_suite' | 'lead_fire_fighter' | 'drafting_suite_firefighters' | 'drafting_suite_technical_services' | 'drafting_suite_corporate_services' | 'drafting_suite_pms_team'>('brief');
  const [users, setUsers] = useState<any[]>([]);
  const [selectedUserEmail, setSelectedUserEmail] = useState<string>('');
  const [agreementScope, setAgreementScope] = useState<'individual' | 'team'>('individual');

  const effectiveUser = React.useMemo(() => {
    if (selectedUserEmail) {
      const found = users.find(u => u.email?.toLowerCase() === selectedUserEmail.toLowerCase());
      if (found) return found;
      return { ...currentUser, email: selectedUserEmail, fullName: selectedUserEmail };
    }
    return currentUser;
  }, [selectedUserEmail, users, currentUser]);

  const isDualLayerTeamLeader = React.useMemo(() => {
    const targetUser = effectiveUser || currentUser;
    if (!targetUser || !targetUser.email) return false;
    const email = targetUser.email.toLowerCase().trim();
    return DUAL_LAYER_USERS.includes(email);
  }, [effectiveUser, currentUser]);

  // Check if active or impersonated user is a lead fire fighter
  const isLeadFireFighter = React.useMemo(() => {
    const targetUser = effectiveUser || currentUser;
    if (!targetUser) return false;
    const isFire = (targetUser.jobFunction || '').toLowerCase().includes('fire') || 
                   (targetUser.department || '').toLowerCase().includes('fire') ||
                   (targetUser.systemRole || '').toLowerCase().includes('fire');
    const isLead = (targetUser.jobFunction || '').toLowerCase().includes('lead') ||
                   (targetUser.systemRole || '').toLowerCase().includes('lead');
    return isFire && isLead;
  }, [effectiveUser, currentUser]);

  const canCurrentUserReview = React.useCallback(() => {
    if (!currentUser) return false;

    const email = (currentUser.email || '').toLowerCase().trim();
    const fullName = (currentUser.fullName || '').toLowerCase().trim();
    const role = (currentUser.role || '').toLowerCase().trim();
    const systemRole = (currentUser.systemRole || '').toLowerCase().trim();
    const jobFunction = (currentUser.jobFunction || '').toLowerCase().trim();

    // "they cannot review themselves"
    const planOwnerEmail = (metadata.email || '').toLowerCase().trim();
    const planOwnerName = (metadata.name || '').toLowerCase().trim();

    if (email && planOwnerEmail && email === planOwnerEmail) {
      return false; // Cannot review themselves
    }
    if (fullName && planOwnerName && fullName === planOwnerName) {
      return false; // Cannot review themselves
    }

    // 1. Check if the user is an internal auditor
    const isAuditor = role.includes('auditor') || 
                      systemRole.includes('auditor') || 
                      jobFunction.includes('auditor') || 
                      role.includes('audit') || 
                      systemRole.includes('audit') || 
                      jobFunction.includes('audit');

    // 2. Check if the user is a manager of other users
    let isManager = role === 'manager' || role === 'admin' || systemRole.includes('manager') || systemRole.includes('admin') || jobFunction.includes('manager');

    if (!isManager && users && users.length > 0) {
      const normalize = (s: string) => s.toLowerCase().trim().replace(/['"\.,]/g, '').replace(/\s+/g, ' ');
      const myNameNorm = normalize(fullName || email || '');
      if (myNameNorm) {
        isManager = users.some(u => {
          const mgr = normalize(u.manager || u.reportTo || u.report_to || '');
          return Boolean(mgr && mgr.includes(myNameNorm));
        });
      }
    }

    // Only managers and internal auditors can review.
    if (!isAuditor && !isManager) {
      return false;
    }

    return true;
  }, [currentUser, metadata.email, metadata.name, users]);

  // Dynamic Options lists for Strategic Objectives and mSCOA Codes (combining default and custom captured parameters)
  const uniqueStrategicObjectives = React.useMemo(() => Array.from(new Set([
    ...STRATEGIC_OBJECTIVES,
    ...availableKpas.map(k => k.parentObjective).filter(Boolean)
  ])), [availableKpas]);

  const uniqueMscoaCodes = React.useMemo(() => Array.from(new Set([
    ...MSCOA_CODES,
    ...availableKpas.map(k => k.mscoaCode).filter(Boolean)
  ])), [availableKpas]);

  // Authentication & Access Control Checks
  const canViewRestricted = React.useCallback(() => {
    if (!currentUser) return false;
    const userName = (currentUser.fullName || '').toLowerCase();
    const userEmail = (currentUser.email || '').toLowerCase();
    const userRole = (currentUser.role || '').toLowerCase();
    const userJob = (currentUser.jobFunction || '').toLowerCase();
    const userSystemRole = (currentUser.systemRole || '').toLowerCase();

    // 1. Global Administrator or Platform Admin
    if (userRole === 'admin' || userSystemRole.includes('global administrator') || userSystemRole.includes('admin')) {
      return true;
    }
    // 2. Internal Auditor (by job title, systemRole, or function)
    if (userJob.includes('internal auditor') || userSystemRole.includes('internal auditor') || userJob.includes('auditor') || userSystemRole.includes('auditor')) {
      return true;
    }
    // 3. User owner of the plan
    const planOwnerName = (metadata.name || '').toLowerCase();
    const planOwnerEmail = (metadata.email || '').toLowerCase();
    if (userName && planOwnerName && userName === planOwnerName) {
      return true;
    }
    if (userEmail && planOwnerEmail && userEmail === planOwnerEmail) {
      return true;
    }
    // 4. Manager of the user
    const planManagerName = (metadata.manager || '').toLowerCase();
    const planReportToName = (metadata.reportTo || '').toLowerCase();

    if (userName && planManagerName && userName === planManagerName) {
      return true;
    }
    if (userName && planReportToName && userName === planReportToName) {
      return true;
    }
    if (userEmail && planManagerName && userEmail === planManagerName) {
      return true;
    }
    if (userEmail && planReportToName && userEmail === planReportToName) {
      return true;
    }

    return false;
  }, [currentUser, metadata.name, metadata.email, metadata.manager, metadata.reportTo]);

  const isRestrictedVisible = canViewRestricted() && showRestrictedFieldsOverride;

  // Load plan and aligned KPA data
  useEffect(() => {
    const fetchPlanAndKpaData = async () => {
      setIsLoading(true);
      try {
        const targetEmail = selectedUserEmail || currentUser?.email || '';

        // Fetch users, kpas, kpis, and pplan concurrently in parallel
        const [usersRes, kpaRes, kpisRes, res] = await Promise.all([
          fetch(`/api/tenant/${activeTenantId}/users?minimal=true&t=${Date.now()}`),
          fetch(`/api/tenant/${activeTenantId}/kpas?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`),
          fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`),
          fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`)
        ]);

        if (usersRes.ok) {
          try {
            const usersData = await safeJson(usersRes) || {};
            if (Array.isArray(usersData)) {
              setUsers(usersData);
            }
          } catch (e) {}
        }

        let fetchedKpas: any[] = [];
        let fetchedCustomKpaTable: any = null;
        if (kpaRes.ok) {
          try {
            const kpaJson = await safeJson(kpaRes) || {};
            if (kpaJson) {
              if (Array.isArray(kpaJson.kpas)) {
                fetchedKpas = kpaJson.kpas;
                setAvailableKpas(fetchedKpas);
              }
              if (kpaJson.customKpaTable) {
                fetchedCustomKpaTable = kpaJson.customKpaTable;
              }
            }
          } catch (e) {}
        }

        let fetchedKpis: any[] = [];
        if (kpisRes.ok) {
          try {
            const kpiJson = await safeJson(kpisRes) || {};
            if (kpiJson && Array.isArray(kpiJson.kpis)) {
              fetchedKpis = kpiJson.kpis;
            }
          } catch (e) {}
        }

        if (res.ok) {
          const data = await safeJson(res) || {};
          let baseMeta = (data.metadata && Object.keys(data.metadata).length > 0) ? { ...data.metadata } : {
            name: currentUser?.fullName || 'Cllr. Mike Mzansi',
            period: '2025/2026 Financial Year',
            department: currentUser?.department || 'Finance & Treasury Department',
            position: currentUser?.jobFunction || 'Director: Supply Chain Management',
            level: currentUser?.level || 'Section 56 Senior Manager (Level 1)',
            email: currentUser?.email || 'mike@massivedynamixdistributors.com',
            manager: currentUser?.manager || 'Mr. Jacob Chief Financial Officer',
            reportTo: currentUser?.reportTo || ''
          };

          if (usersRes.ok) {
            try {
              const usersList = await safeJson(usersRes) || [];
              if (Array.isArray(usersList)) {
                const matchedUser = usersList.find((u: any) => (u.email || '').toLowerCase().trim() === targetEmail.toLowerCase().trim());
                if (matchedUser) {
                  if (matchedUser.fullName) baseMeta.name = matchedUser.fullName;
                  if (matchedUser.jobFunction) baseMeta.position = matchedUser.jobFunction;
                  if (matchedUser.department) baseMeta.department = matchedUser.department;
                  if (matchedUser.directorate) baseMeta.directorate = matchedUser.directorate;
                  if (matchedUser.manager) baseMeta.manager = matchedUser.manager;
                  if (matchedUser.reportTo || matchedUser.manager) baseMeta.reportTo = matchedUser.reportTo || matchedUser.manager;
                  if (matchedUser.managerEmail) baseMeta.managerEmail = matchedUser.managerEmail;
                }
              }
            } catch (e) {}
          }

          setMetadata(baseMeta);

          let currentItems = [];
          if (data.items && Array.isArray(data.items) && data.items.length > 0) {
            // Filter out accidentally saved dummy KPI-KPA rows
            currentItems = data.items.filter((item: any) => {
              if (item.kpiNo && item.kpiNo.startsWith('KPI-KPA-') && item.kpi?.includes('Execution and operational oversight')) {
                return false;
              }
              return true;
            });
          }

          const isCleared = data.metadata && data.metadata._isCleared === true;
          const isFredExtracted = Boolean(
            data.metadata && (
              data.metadata._isFredExtracted === true ||
              data.metadata._extractedFrom ||
              data.metadata.extractedFrom
            )
          );

          // Auto-sync captured KPIs into Performance Plan
          if (!isCleared && !isFredExtracted && fetchedKpis.length > 0) {
            if (currentItems.length > 0) {
              // First, update existing items if they match kpiNo - strictly preserve the exact count
              currentItems = currentItems.map(item => {
                const matchedKpi = fetchedKpis.find(fk => (fk.kpiNo || '').toLowerCase() === (item.kpiNo || '').toLowerCase());
                if (matchedKpi) {
                  return {
                    ...item,
                    kpi: matchedKpi.kpi || item.kpi,
                    kpa: matchedKpi.kpa || item.kpa, // updates automatically from captured KPI KPA
                    baseline: matchedKpi.baseline || item.baseline,
                    baselineYear: matchedKpi.baselineYear || item.baselineYear,
                    budget: matchedKpi.budget || item.budget,
                    annualTarget: matchedKpi.annualTarget || item.annualTarget,
                    q1Target: matchedKpi.q1Target || item.q1Target,
                    q2Target: matchedKpi.q2Target || item.q2Target,
                    q3Target: matchedKpi.q3Target || item.q3Target,
                    q4Target: matchedKpi.q4Target || item.q4Target,
                    q1Poe: item.q1Poe || matchedKpi.q1Poe || '',
                    q2Poe: item.q2Poe || matchedKpi.q2Poe || '',
                    q3Poe: item.q3Poe || matchedKpi.q3Poe || '',
                    q4Poe: item.q4Poe || matchedKpi.q4Poe || '',
                    annualRequiredPoe: matchedKpi.annualRequiredPoe || item.annualRequiredPoe || '',
                    poe: matchedKpi.annualRequiredPoe || item.annualRequiredPoe || item.poe || [item.q1Poe, item.q2Poe, item.q3Poe, item.q4Poe].filter(Boolean).join('\n') || [matchedKpi.q1Poe, matchedKpi.q2Poe, matchedKpi.q3Poe, matchedKpi.q4Poe].filter(Boolean).join('\n') || '',
                  };
                }
                return item;
              });
            } else {
              // Only populate from fetchedKpis if the grid was completely empty
              currentItems = fetchedKpis
                 .filter(fk => fk.kpiNo)
                 .map((fk, idx) => ({
                   id: fk.id || `kpi-${fk.kpiNo || idx}`,
                   strategicGoal: '',
                   kpiNo: fk.kpiNo,
                   kpi: fk.kpi || '',
                   bsd: false, led: false, mfvm: false, ggpp: false, midt: false, sr: false,
                   kpa: fk.kpa || '', // pre-populate KPA from captured KPI
                   baseline: fk.baseline || '',
                   baselineYear: fk.baselineYear || '2025/2026',
                   budget: fk.budget || '',
                   annualTarget: fk.annualTarget || '',
                   q1Target: fk.q1Target || '',
                   q2Target: fk.q2Target || '',
                   q3Target: fk.q3Target || '',
                   q4Target: fk.q4Target || '',
                   q1Poe: fk.q1Poe || '',
                   q2Poe: fk.q2Poe || '',
                   q3Poe: fk.q3Poe || '',
                   q4Poe: fk.q4Poe || '',
                   annualRequiredPoe: fk.annualRequiredPoe || '',
                   poe: fk.annualRequiredPoe || [fk.q1Poe, fk.q2Poe, fk.q3Poe, fk.q4Poe].filter(Boolean).join('\n') || '',
                   weighting: '',
                   myScore: '',
                   evaluation: '',
                   review: ''
                 }));
            }
          }

          // Consolidate custom KPAs from both sources (committed list and custom spreadsheet rows)
          const allCustomKpas: any[] = [...fetchedKpas];
          if (fetchedCustomKpaTable && Array.isArray(fetchedCustomKpaTable.rows) && Array.isArray(fetchedCustomKpaTable.headers)) {
            const headers = fetchedCustomKpaTable.headers;
            const rows = fetchedCustomKpaTable.rows;
            const natColIdx = headers.findIndex((h: string) => h.toLowerCase().includes('national'));
            const funcColIdx = headers.findIndex((h: string) => h.toLowerCase().includes('functional') || h.toLowerCase().includes('kpa') && !h.toLowerCase().includes('national'));
            const weightColIdx = headers.findIndex((h: string) => h.toLowerCase().includes('weight'));

            rows.forEach((row: any[], rIdx: number) => {
              const titleVal = funcColIdx !== -1 ? row[funcColIdx] : '';
              const natVal = natColIdx !== -1 ? row[natColIdx] : '';
              const weightVal = weightColIdx !== -1 ? row[weightColIdx] : '';

              if (titleVal && titleVal.trim()) {
                const cleanedTitle = titleVal.trim();
                if (!allCustomKpas.some(item => ((item.title || item.nationalKpa) || '').toLowerCase() === cleanedTitle.toLowerCase())) {
                  allCustomKpas.push({
                    id: `kpa-table-${rIdx}`,
                    title: cleanedTitle,
                    nationalKpa: natVal ? natVal.trim() : '',
                    parentObjective: '',
                    mscoaCode: '',
                    weighting: weightVal ? weightVal.trim() : ''
                  });
                }
              }
            });
          }

          // Automatic KPA-to-PerformancePlanner Synchronization
          if (!isCleared && allCustomKpas.length > 0) {
            const wasEmptyInitially = currentItems.length === 0;
            const getNationalKpaFlags = (natKpa: string) => {
              const normalized = (natKpa || '').toLowerCase();
              return {
                bsd: normalized.includes('basic service') || normalized.includes('infrastructure') || normalized.includes('bsd') || normalized.includes('delivery'),
                led: normalized.includes('economic') || normalized.includes('agrarian') || normalized.includes('tourism') || normalized.includes('led') || normalized.includes('development'),
                mfvm: normalized.includes('financial') || normalized.includes('budget') || normalized.includes('audit') || normalized.includes('mfvm') || normalized.includes('viability') || normalized.includes('management'),
                ggpp: normalized.includes('governance') || normalized.includes('public participation') || normalized.includes('ward') || normalized.includes('ggpp') || normalized.includes('consultation'),
                midt: normalized.includes('institutional') || normalized.includes('competency') || normalized.includes('midt') || normalized.includes('capital') || normalized.includes('transformation') || normalized.includes('development'),
                sr: normalized.includes('spatial') || normalized.includes('land use') || normalized.includes('rational') || normalized.includes('sr') || normalized.includes('spluma')
              };
            };

            allCustomKpas.forEach((kpa, kpaIdx) => {
              const effectiveTitle = (kpa.title && kpa.title.trim()) || (kpa.nationalKpa && kpa.nationalKpa.trim()) || '';
              if (!effectiveTitle) return;

              const existingIndex = currentItems.findIndex(item => (item.kpa || '').toLowerCase() === effectiveTitle.toLowerCase());
              const flags = getNationalKpaFlags(kpa.nationalKpa || effectiveTitle);

              if (existingIndex !== -1) {
                // Update existing row options to match custom KPA specs if empty
                const existing = currentItems[existingIndex];
                currentItems[existingIndex] = {
                  ...existing,
                  kpa: effectiveTitle, // Enforce exact casing
                  strategicGoal: existing.strategicGoal || kpa.parentObjective || 'General Departmental Objective Alignment',
                  mscoaCode: existing.mscoaCode || kpa.mscoaCode || '',
                  weighting: existing.weighting || kpa.weighting?.replace('%', '') || '15',
                  bsd: existing.bsd || flags.bsd,
                  led: existing.led || flags.led,
                  mfvm: existing.mfvm || flags.mfvm,
                  ggpp: existing.ggpp || flags.ggpp,
                  midt: existing.midt || flags.midt,
                  sr: existing.sr || flags.sr
                };
              } else if (wasEmptyInitially) {
                // Pre-populate a row matching the custom captured KPA only if grid was completely empty
                const newRowId = `pplan-sync-kpa-${kpa.id || kpaIdx}`;
                currentItems.push({
                  id: newRowId,
                  strategicGoal: kpa.parentObjective || 'General Departmental Objective Alignment',
                  kpiNo: `KPI-KPA-${kpaIdx + 1}`,
                  kpi: `Execution and operational oversight of projects under functional area: ${effectiveTitle}`,
                  bsd: flags.bsd,
                  led: flags.led,
                  mfvm: flags.mfvm,
                  ggpp: flags.ggpp,
                  midt: flags.midt,
                  sr: flags.sr,
                  kpa: effectiveTitle,
                  mscoaCode: kpa.mscoaCode || '',
                  baseline: 'Standard strategic implementation protocols',
                  baselineYear: '2025/2026',
                  budget: '',
                  annualTarget: '100% completion of KPA milestones and score of 4 or 5.',
                  q1Target: '25% milestones reached',
                  q2Target: '50% milestones reached',
                  q3Target: '75% milestones reached',
                  q4Target: '100% milestones reached',
                  q1Poe: '', q2Poe: '', q3Poe: '', q4Poe: '',
                  poe: 'Strategic reports and verification files.',
                  weighting: kpa.weighting?.replace('%', '') || '15',
                  myScore: '3.0',
                  evaluation: '',
                  review: ''
                });
              }
            });
          }

          if (currentItems.length > 0) {
            // Propagate unique POE across all quarters and lock
            currentItems = currentItems.map(it => {
              const poeDesc = (it.poe || it.annualRequiredPoe || it.q1Poe || it.q2Poe || it.midtermPoe || it.q3Poe || it.q4Poe || (it.kpi ? `Signed verification report and approved evidence portfolio for: ${it.kpi}` : 'Signed verification report and evidence portfolio files')).trim();
              return {
                ...it,
                poe: poeDesc,
                annualRequiredPoe: poeDesc,
                q1Poe: poeDesc,
                q2Poe: poeDesc,
                midtermPoe: poeDesc,
                q3Poe: poeDesc,
                q4Poe: poeDesc
              };
            });

            setItems(currentItems);
            
            // Keep the database in perfect alignment
            const originalDataStr = JSON.stringify(data.items || []);
            const syncedDataStr = JSON.stringify(currentItems);
            if (originalDataStr !== syncedDataStr) {
               fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(targetEmail)}`, {
                 method: "POST",
                 headers: { "Content-Type": "application/json" },
                 body: JSON.stringify({ metadata: data.metadata || metadata, items: currentItems })
               }).catch(() => {});
            }
          } else {
            const isMahlanguTarget = targetEmail.toLowerCase().includes('mahlanguml') || targetEmail.toLowerCase().includes('mahlangulm') || targetEmail.toLowerCase().includes('mandlaml');
            if (isMahlanguTarget && !isTeamPlan && !isTeamPlan2) {
              const full97 = generateAll97KPIs(allCustomKpas);
              setItems(full97);
              const metaWithExtracted = { ...(data.metadata || metadata), _isFredExtracted: true, _isCleared: false };
              setMetadata(metaWithExtracted);
              fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(targetEmail)}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ metadata: metaWithExtracted, items: full97 })
              }).catch(() => {});
            } else {
              setItems([]);
            }
          }
        }
      } catch (err) {
        console.error(`Error loading ${headingTitle}:`, err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPlanAndKpaData();
  }, [activeTenantId, currentUser?.email, selectedUserEmail, isTeamPlan, isTeamPlan2]);

  // Save to database
  const handleSaveToDatabase = async (customMetadata = metadata, customItems = items, showFeedback = false) => {
    setIsSaving(true);
    try {
      const targetEmail = selectedUserEmail || currentUser.email;
      const metaToSave = { ...customMetadata, _isCleared: customItems.length === 0 };
      const res = await fetch(`/api/tenant/${activeTenantId}/${apiEndpoint}?userId=${encodeURIComponent(targetEmail)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: metaToSave, Send, items: customItems })
      });
      if (!res.ok) throw new Error("Failed to post payload to database");
      setHasSavedOnce(true);
      if (showFeedback) {
        alert(`${headingTitle} in its entirety has been successfully saved to DB!`);
      }
    } catch (err: any) {
      console.error(`Save ${headingTitle} Database Error:`, err);
    } finally {
      setIsSaving(false);
    }
  };

  const [isPullingFred, setIsPullingFred] = useState(false);

  const generateAll97KPIs = (kpasList: any[]) => {
    const kpiList: PlanKPIItem[] = [];
    
    const getStandardKpa = (kpaIndex: number): string => {
      const targetTitle = [
        "Basic Service",
        "Institutional Development",
        "Local Economic",
        "Financial Viability",
        "Good Governance",
        "Spatial Rationale",
        "Skills Development"
      ][kpaIndex - 1];
      
      const found = kpasList.find(k => k.title && (k.title.toLowerCase().includes(targetTitle.toLowerCase()) || k.title.toLowerCase().includes(`kpa ${kpaIndex}`)));
      if (found) return found.title;
      
      return [
        "KPA 1: Basic Service Delivery and Infrastructure Development",
        "KPA 2: Municipal Institutional Development and Transformation",
        "KPA 3: Local Economic Development (LED)",
        "KPA 4: Municipal Financial Viability and Management",
        "KPA 5: Good Governance and Public Participation",
        "KPA 6: Spatial Rationale and Environmental Management",
        "KPA 7: Skills Development & Capacity Training"
      ][kpaIndex - 1];
    };

    const getStrategicGoal = (kpaIndex: number): string => {
      return [
        "To ensure reliable bulk water and electricity infrastructure",
        "To improve professional competency and human capital retention",
        "To promote local agrarian, manufacturing, and tourism hospitality economy",
        "To achieve unqualified AG audit with zero recurring findings",
        "To enable deep responsive community consultation across all wards",
        "To enforce optimal sustainable land use management aligned with SPLUMA",
        "To improve professional competency and human capital retention"
      ][kpaIndex - 1];
    };

    const getNationalKpaFlags = (kpaIndex: number) => {
      return {
        bsd: kpaIndex === 1,
        midt: kpaIndex === 2 || kpaIndex === 7,
        led: kpaIndex === 3,
        mfvm: kpaIndex === 4,
        ggpp: kpaIndex === 5,
        sr: kpaIndex === 6
      };
    };

    const kpiTopics = [
      {
        kpaIndex: 1,
        items: [
          { code: "M_01", desc: "Percentage of households with access to basic potable water supply.", target: "100% access", baseline: "95% access", q1: "96%", q2: "98%", q3: "99%", q4: "100%" },
          { code: "M_02", desc: "Percentage of sanitation complaints resolved within 24 hours.", target: "100% resolution", baseline: "85% resolution", q1: "90%", q2: "95%", q3: "98%", q4: "100%" },
          { code: "M_03", desc: "Number of new water connections completed in informal settlements.", target: "500 connections", baseline: "300 connections", q1: "125", q2: "250", q3: "375", q4: "500" },
          { code: "M_04", desc: "Kilometers of new storm-water drainage pipelines installed.", target: "12 km installed", baseline: "8 km installed", q1: "3 km", q2: "6 km", q3: "9 km", q4: "12 km" },
          { code: "M_05", desc: "Percentage of electricity service interruptions resolved within standard NRS timeframes.", target: "95% compliance", baseline: "90% compliance", q1: "91%", q2: "93%", q3: "94%", q4: "95%" },
          { code: "M_06", desc: "Number of high-mast street lights installed in rural nodes.", target: "20 high-masts", baseline: "12 high-masts", q1: "5", q2: "10", q3: "15", q4: "20" },
          { code: "M_07", desc: "Kilometers of gravel roads upgraded to asphalt/tar.", target: "15 km tarred", baseline: "10 km tarred", q1: "3.5 km", q2: "7.5 km", q3: "11 km", q4: "15 km" },
          { code: "M_08", desc: "Square meters of potholes patched on major municipal roads.", target: "8000 sqm patched", baseline: "5000 sqm patched", q1: "2000 sqm", q2: "4000 sqm", q3: "6000 sqm", q4: "8000 sqm" },
          { code: "M_09", desc: "Percentage of formal households with weekly refuse collection services.", target: "100% service level", baseline: "98% service level", q1: "98.5%", q2: "99%", q3: "99.5%", q4: "100%" },
          { code: "M_10", desc: "Volume of domestic waste diverted from landfill sites through recycling initiatives.", target: "1500 tons diverted", baseline: "1000 tons diverted", q1: "375 tons", q2: "750 tons", q3: "1125 tons", q4: "1500 tons" },
          { code: "M_11", desc: "Number of low-cost housing units connected to the bulk sewerage network.", target: "350 units", baseline: "200 units", q1: "80", q2: "170", q3: "260", q4: "350" },
          { code: "M_12", desc: "Percentage compliance with drinking water quality standards (Blue Drop).", target: "98% compliance score", baseline: "95% compliance score", q1: "95%", q2: "96%", q3: "97%", q4: "98%" },
          { code: "M_13", desc: "Percentage compliance with wastewater treatment facility effluent standards (Green Drop).", target: "92% compliance score", baseline: "88% compliance score", q1: "89%", q2: "90%", q3: "91%", q4: "92%" },
          { code: "M_14", desc: "Number of preventative maintenance interventions executed on bulk water pumps.", target: "24 service cycles completed", baseline: "18 service cycles", q1: "6", q2: "12", q3: "18", q4: "24" },
          { code: "M_15", desc: "Percentage reduction in non-revenue water losses across municipal grid.", target: "5% loss reduction", baseline: "3% loss reduction", q1: "1.25%", q2: "2.50%", q3: "3.75%", q4: "5.00%" }
        ]
      },
      {
        kpaIndex: 2,
        items: [
          { code: "M_16", desc: "Percentage of employment equity targets met in senior manager roles.", target: "60% representation", baseline: "55% representation", q1: "56%", q2: "58%", q3: "59%", q4: "60%" },
          { code: "M_17", desc: "Percentage of municipal staff performance reviews completed on time.", target: "100% compliance", baseline: "90% compliance", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_18", desc: "Percentage of critical vacant posts filled within 3 months of advertisement.", target: "80% vacancies filled", baseline: "70% vacancies filled", q1: "72%", q2: "75%", q3: "78%", q4: "80%" },
          { code: "M_19", desc: "Number of formal workplace skills training interventions completed.", target: "45 interventions", baseline: "30 interventions", q1: "11", q2: "22", q3: "33", q4: "45" },
          { code: "M_20", desc: "Employee retention rate under strategic scarce-skills program.", target: "92% retention", baseline: "88% retention", q1: "92%", q2: "92%", q3: "92%", q4: "92%" },
          { code: "M_21", desc: "Number of joint labor-management consultative forum meetings held.", target: "4 meetings", baseline: "4 meetings", q1: "1", q2: "2", q3: "3", q4: "4" },
          { code: "M_22", desc: "Percentage of IT disaster recovery plan test cycles passed.", target: "100% pass", baseline: "100% pass", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_23", desc: "Percentage availability of core municipal ERP systems.", target: "99.5% uptime", baseline: "98% uptime", q1: "99%", q2: "99.2%", q3: "99.4%", q4: "99.5%" },
          { code: "M_24", desc: "Number of employee wellness outreach and health screening programs conducted.", target: "8 programs", baseline: "6 programs", q1: "2", q2: "4", q3: "6", q4: "8" },
          { code: "M_25", desc: "Percentage of occupational health and safety (OHS) incident audits completed.", target: "100% compliance", baseline: "95% compliance", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_26", desc: "Percentage of internal promotions aligned with the employment equity plan.", target: "75% alignment", baseline: "70% alignment", q1: "71%", q2: "73%", q3: "74%", q4: "75%" },
          { code: "M_27", desc: "Number of departmental operational risk registers updated.", target: "4 quarterly updates", baseline: "4 updates", q1: "1", q2: "2", q3: "3", q4: "4" },
          { code: "M_28", desc: "Percentage of municipal bylaws reviewed and updated for council submission.", target: "100% review complete", baseline: "80% review complete", q1: "25%", q2: "50%", q3: "75%", q4: "100%" },
          { code: "M_29", desc: "Average number of days taken to resolve formal staff grievances.", target: "Less than 15 days", baseline: "18 days average", q1: "<15 days", q2: "<15 days", q3: "<15 days", q4: "<15 days" },
          { code: "M_30", desc: "Percentage of customer service desks meeting standard response protocols.", target: "90% compliance", baseline: "85% compliance", q1: "86%", q2: "88%", q3: "89%", q4: "90%" }
        ]
      },
      {
        kpaIndex: 3,
        items: [
          { code: "M_31", desc: "Number of work opportunities created through Expanded Public Works Programme (EPWP).", target: "1200 jobs created", baseline: "950 jobs", q1: "300", q2: "600", q3: "900", q4: "1200" },
          { code: "M_32", desc: "Number of local SMMEs supported through targeted municipal capacity workshops.", target: "80 SMMEs trained", baseline: "50 SMMEs", q1: "20", q2: "40", q3: "60", q4: "80" },
          { code: "M_33", desc: "Value of municipal procurement spend allocated to local SMMEs.", target: "R15,000,000 allocated", baseline: "R10,000,000", q1: "R3.75M", q2: "R7.50M", q3: "R11.25M", q4: "R15.00M" },
          { code: "M_34", desc: "Number of tourist information desks maintained and supported.", target: "4 desks supported", baseline: "3 desks", q1: "4", q2: "4", q3: "4", q4: "4" },
          { code: "M_35", desc: "Number of agricultural cooperatives supported with equipment or training.", target: "10 cooperatives", baseline: "6 cooperatives", q1: "2", q2: "5", q3: "8", q4: "10" },
          { code: "M_36", desc: "Number of local business forums hosted to align LED initiatives.", target: "4 forums hosted", baseline: "2 forums", q1: "1", q2: "2", q3: "3", q4: "4" },
          { code: "M_37", desc: "Percentage of LED strategy targets successfully implemented during the year.", target: "90% implementation", baseline: "80% implementation", q1: "22.5%", q2: "45.0%", q3: "67.5%", q4: "90.0%" },
          { code: "M_38", desc: "Number of job seekers registered on the municipal skills database.", target: "1500 registered", baseline: "1000 registered", q1: "375", q2: "750", q3: "1125", q4: "1500" },
          { code: "M_39", desc: "Number of youth-owned enterprises receiving direct material assistance.", target: "25 enterprises", baseline: "15 enterprises", q1: "6", q2: "12", q3: "18", q4: "25" },
          { code: "M_40", desc: "Number of informal trading stalls constructed or upgraded.", target: "50 stalls", baseline: "30 stalls", q1: "12", q2: "25", q3: "37", q4: "50" },
          { code: "M_41", desc: "Percentage of informal trading licenses processed within 7 working days.", target: "95% compliance", baseline: "90% compliance", q1: "91%", q2: "93%", q3: "94%", q4: "95%" },
          { code: "M_42", desc: "Number of investment promotion workshops hosted with external partners.", target: "2 workshops", baseline: "1 workshop", q1: "0", q2: "1", q3: "1", q4: "2" },
          { code: "M_43", desc: "Number of community-based public works infrastructure programs initiated.", target: "6 programs", baseline: "4 programs", q1: "1", q2: "3", q3: "5", q4: "6" },
          { code: "M_44", desc: "Number of skills training bursaries awarded to local youth.", target: "30 bursaries", baseline: "20 bursaries", q1: "30", q2: "30", q3: "30", q4: "30" },
          { code: "M_45", desc: "Value of public private partnership agreements finalized for economic hubs.", target: "2 PPP partnerships", baseline: "1 partnership", q1: "0", q2: "1", q3: "1", q4: "2" }
        ]
      },
      {
        kpaIndex: 4,
        items: [
          { code: "M_46", desc: "Debt coverage ratio achieved by the municipality.", target: "2.5 times or better", baseline: "2.1 times", q1: ">2.5", q2: ">2.5", q3: ">2.5", q4: ">2.5" },
          { code: "M_47", desc: "Percentage of capital budget spent on infrastructure projects.", target: "95% budget spent", baseline: "91% budget spent", q1: "20%", q2: "45%", q3: "70%", q4: "95%" },
          { code: "M_48", desc: "Percentage of operational budget spent on planned maintenance.", target: "100% spend", baseline: "94% spend", q1: "25%", q2: "50%", q3: "75%", q4: "100%" },
          { code: "M_49", desc: "Audit outcome obtained from the Auditor-General for the previous financial year.", target: "Clean audit outcome", baseline: "Unqualified audit", q1: "Clean", q2: "Clean", q3: "Clean", q4: "Clean" },
          { code: "M_50", desc: "Percentage of creditor invoices paid within statutory 30-day timeframe.", target: "100% compliance", baseline: "95% compliance", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_51", desc: "Percentage of municipal revenue collection rate achieved against billed revenue.", target: "95% billing collected", baseline: "92% billing collected", q1: "95%", q2: "95%", q3: "95%", q4: "95%" },
          { code: "M_52", desc: "Percentage variance of actual expenditure against approved mid-term budget.", target: "Less than 5% variance", baseline: "7% variance", q1: "<5%", q2: "<5%", q3: "<5%", q4: "<5%" },
          { code: "M_53", desc: "Percentage accuracy of the municipal asset register (verified via physical audit).", target: "100% accuracy", baseline: "98% accuracy", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_54", desc: "Percentage of grant funding spent in accordance with grant conditions.", target: "100% grant spent", baseline: "95% grant spent", q1: "25%", q2: "50%", q3: "75%", q4: "100%" },
          { code: "M_55", desc: "Percentage of supply chain bids processed within standard turnaround time.", target: "90% compliance", baseline: "84% compliance", q1: "85%", q2: "87%", q3: "89%", q4: "90%" },
          { code: "M_56", desc: "Cost coverage ratio of the municipality (cash-backed reserves / monthly operating expenditure).", target: "3 months coverage", baseline: "2 months", q1: "3 months", q2: "3 months", q3: "3 months", q4: "3 months" },
          { code: "M_57", desc: "Percentage reduction in unauthorized, irregular, fruitless and wasteful expenditure (UIFW).", target: "100% reduction", baseline: "80% reduction", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_58", desc: "Percentage compliance of the annual financial statements submitted to AG.", target: "100% compliance", baseline: "100% compliance", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_59", desc: "Percentage of indigent households registered and receiving free basic services.", target: "100% registry accuracy", baseline: "96% accuracy", q1: "97%", q2: "98%", q3: "99%", q4: "100%" },
          { code: "M_60", desc: "Percentage of financial reports submitted to National Treasury within due dates.", target: "100% compliance", baseline: "100% compliance", q1: "100%", q2: "100%", q3: "100%", q4: "100%" }
        ]
      },
      {
        kpaIndex: 5,
        items: [
          { code: "M_61", desc: "Number of functional ward committees established and meeting regularly.", target: "100% ward committees active", baseline: "90% active", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_62", desc: "Percentage of resolved community complaints logged through CRM system.", target: "95% complaints resolved", baseline: "82% resolved", q1: "85%", q2: "88%", q3: "92%", q4: "95%" },
          { code: "M_63", desc: "Number of IDP public representative consultation meetings held.", target: "12 meetings", baseline: "8 meetings", q1: "3", q2: "6", q3: "9", q4: "12" },
          { code: "M_64", desc: "Percentage compliance with the municipal risk management plan.", target: "100% compliance", baseline: "90% compliance", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_65", desc: "Percentage of internal audit findings successfully resolved by management.", target: "90% resolved", baseline: "75% resolved", q1: "78%", q2: "82%", q3: "86%", q4: "90%" },
          { code: "M_66", desc: "Percentage implementation of the municipal anti-corruption strategy.", target: "100% compliance", baseline: "85% compliance", q1: "90%", q2: "95%", q3: "98%", q4: "100%" },
          { code: "M_67", desc: "Number of council-approved oversight reports published for the public.", target: "4 reports", baseline: "4 reports", q1: "1", q2: "2", q3: "3", q4: "4" },
          { code: "M_68", desc: "Number of municipal public accounts committee (MPAC) meetings conducted.", target: "8 MPAC meetings", baseline: "6 meetings", q1: "2", q2: "4", q3: "6", q4: "8" },
          { code: "M_69", desc: "Percentage compliance with the Promotion of Access to Information Act (PAIA).", target: "100% compliance", baseline: "100% compliance", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_70", desc: "Percentage of executive council decisions implemented within due dates.", target: "95% implementation", baseline: "90% implementation", q1: "91%", q2: "92%", q3: "94%", q4: "95%" },
          { code: "M_71", desc: "Number of community feedback newsletters published in local languages.", target: "4 editions", baseline: "2 editions", q1: "1", q2: "2", q3: "3", q4: "4" },
          { code: "M_72", desc: "Percentage compliance with standard municipal delegation registers.", target: "100% compliance", baseline: "95% compliance", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_73", desc: "Number of external compliance reports submitted to Provincial COGTA.", target: "4 quarterly reports", baseline: "4 reports", q1: "1", q2: "2", q3: "3", q4: "4" },
          { code: "M_74", desc: "Percentage of ward councilors trained in leadership and governance skills.", target: "100% training rate", baseline: "80% training rate", q1: "25%", q2: "50%", q3: "75%", q4: "100%" },
          { code: "M_75", desc: "Percentage uptime of the community digital communication portals.", target: "99% availability", baseline: "97% availability", q1: "99%", q2: "99%", q3: "99%", q4: "99%" }
        ]
      },
      {
        kpaIndex: 6,
        items: [
          { code: "M_76", desc: "Percentage of land-use applications processed within statutory SPLUMA timeframes.", target: "95% compliance", baseline: "88% compliance", q1: "90%", q2: "92%", q3: "93%", q4: "95%" },
          { code: "M_77", desc: "Number of environmental compliance audits conducted on key municipal projects.", target: "10 audits complete", baseline: "6 audits", q1: "2", q2: "5", q3: "8", q4: "10" },
          { code: "M_78", desc: "Percentage alignment of municipal budget with Spatial Development Framework (SDF).", target: "100% alignment", baseline: "95% alignment", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_79", desc: "Number of GIS layers updated with land use data.", target: "6 updates completed", baseline: "4 updates", q1: "1", q2: "3", q3: "5", q4: "6" },
          { code: "M_80", desc: "Percentage of municipal land audits completed and cataloged in asset register.", target: "100% complete", baseline: "85% complete", q1: "25%", q2: "50%", q3: "75%", q4: "100%" },
          { code: "M_81", desc: "Number of local spatial planning workshops hosted with community leaders.", target: "4 workshops", baseline: "2 workshops", q1: "1", q2: "2", q3: "3", q4: "4" },
          { code: "M_82", desc: "Number of hectares of alien invasive vegetation cleared in conservation zones.", target: "200 hectares cleared", baseline: "150 hectares", q1: "50", q2: "100", q3: "150", q4: "200" },
          { code: "M_83", desc: "Number of public parks maintained to standard occupational safety criteria.", target: "15 parks maintained", baseline: "10 parks", q1: "15", q2: "15", q3: "15", q4: "15" },
          { code: "M_84", desc: "Percentage compliance with integrated waste management plan (IWMP) targets.", target: "90% compliance score", baseline: "80% compliance score", q1: "82%", q2: "85%", q3: "88%", q4: "90%" },
          { code: "M_85", desc: "Percentage of newly registered townships aligned with integrated human settlements plan.", target: "100% alignment", baseline: "90% alignment", q1: "100%", q2: "100%", q3: "100%", q4: "100%" },
          { code: "M_86", desc: "Number of localized environmental awareness campaigns conducted.", target: "8 campaigns", baseline: "4 campaigns", q1: "2", q2: "4", q3: "6", q4: "8" },
          { code: "M_87", desc: "Percentage of illegal dumping hot-spots cleared within 48 hours.", target: "90% clearance rate", baseline: "75% clearance rate", q1: "78%", q2: "82%", q3: "86%", q4: "90%" },
          { code: "M_88", desc: "Number of urban renewal spatial project feasibility studies completed.", target: "3 studies", baseline: "1 study", q1: "1", q2: "2", q3: "2", q4: "3" },
          { code: "M_89", desc: "Percentage compliance with national air quality monitoring criteria.", target: "98% compliance", baseline: "95% compliance", q1: "98%", q2: "98%", q3: "98%", q4: "98%" },
          { code: "M_90", desc: "Number of building plan inspections completed during construction stages.", target: "250 inspections", baseline: "180 inspections", q1: "60", q2: "120", q3: "180", q4: "250" },
          { code: "M_91", desc: "Percentage of illegal structure enforcement notices issued within 7 days of discovery.", target: "95% compliance", baseline: "90% compliance", q1: "91%", q2: "93%", q3: "94%", q4: "95%" },
          { code: "M_92", desc: "Number of climate change adaptation strategy training sessions held.", target: "4 sessions", baseline: "2 sessions", q1: "1", q2: "2", q3: "3", q4: "4" }
        ]
      },
      {
        kpaIndex: 7,
        items: [
          { code: "U_01", desc: "Percentage of the municipality's skills development budget spent on staff training.", target: "100% budget spent", baseline: "85% budget spent", q1: "20%", q2: "50%", q3: "80%", q4: "100%" },
          { code: "U_02", desc: "Number of municipal officials trained in line with the Workplace Skills Plan (WSP).", target: "150 officials trained", baseline: "100 officials", q1: "30", q2: "70", q3: "110", q4: "150" },
          { code: "U_03", desc: "Number of unemployed graduates placed in municipal internship programs.", target: "25 interns placed", baseline: "15 interns", q1: "25", q2: "25", q3: "25", q4: "25" },
          { code: "U_04", desc: "Percentage of training programs accredited by LGSETA.", target: "85% accredited", baseline: "70% accredited", q1: "72%", q2: "76%", q3: "80%", q4: "85%" },
          { code: "U_05", desc: "Number of community bursaries awarded for tertiary technical qualifications.", target: "15 bursaries awarded", baseline: "10 bursaries", q1: "15", q2: "15", q3: "15", q4: "15" }
        ]
      }
    ];

    kpiTopics.forEach(topic => {
      topic.items.forEach(it => {
        const flags = getNationalKpaFlags(topic.kpaIndex);
        const kpaName = getStandardKpa(topic.kpaIndex);
        const strategicGoal = getStrategicGoal(topic.kpaIndex);
        const uniquePoe = `Signed verification report and approved portfolio of evidence for: ${it.desc}`;
        kpiList.push({
          id: `pplan-fred-kpi-${it.code}-${Math.random()}`,
          strategicGoal: strategicGoal,
          kpiNo: it.code,
          kpi: it.desc,
          bsd: flags.bsd,
          led: flags.led,
          mfvm: flags.mfvm,
          ggpp: flags.ggpp,
          midt: flags.midt,
          sr: flags.sr,
          kpa: kpaName,
          mscoaCode: "Functions",
          baseline: it.baseline || "Standard operational guidelines",
          baselineYear: "2025/2026",
          budget: "",
          annualTarget: it.target,
          q1Target: it.q1 || "Submit review reports",
          q2Target: it.q2 || "Submit review reports",
          q3Target: it.q3 || "Submit review reports",
          q4Target: it.q4 || "Submit review reports",
          poe: uniquePoe,
          annualRequiredPoe: uniquePoe,
          q1Poe: uniquePoe,
          q2Poe: uniquePoe,
          midtermPoe: uniquePoe,
          q3Poe: uniquePoe,
          q4Poe: uniquePoe,
          weighting: "10",
          myScore: "3.0"
        });
      });
    });

    return kpiList;
  };

  const handleClearGrid = () => {
    setShowClearConfirm(true);
  };

  const confirmClearGrid = async () => {
    setItems([]);
    setShowClearConfirm(false);
    const updatedMetadata = { ...metadata, _isCleared: true, _isFredExtracted: false };
    setMetadata(updatedMetadata);
    await handleSaveToDatabase(updatedMetadata, [], false);
  };

  const handlePullFredExtraction = async () => {
    setIsPullingFred(true);
    try {
      const url = `/api/tenant/${activeTenantId}/fred-extraction/agreement_to_plan_engine?userId=${currentUser?.email || 'default'}&t=${Date.now()}`;
      const res = await fetch(url);
      
      let extKpis: any[] = [];
      let foundExtraction = false;
      let q1Codes: string[] = [];
      let q2Codes: string[] = [];
      let q3Codes: string[] = [];
      let q4Codes: string[] = [];
      let hasGrid = false;
      
      if (res.ok) {
        const result = await safeJson(res) || {};
        if (result.success && result.data && result.data.Performance_Plan) {
          const perfPlan = result.data.Performance_Plan;
          if (perfPlan.KPAs && Array.isArray(perfPlan.KPAs)) {
            foundExtraction = true;
            let uCount = 1;
            perfPlan.KPAs.forEach((kpaObj: any) => {
              const kpaNumStr = (kpaObj.KPA_Number || kpaObj.kpaNumber || '').toString().trim();
              const kpaDesc = (kpaObj.KPA_Description || kpaObj.kpaDescription || kpaObj.name || '').toString().trim();
              
              const kpiList = kpaObj.Associated_KPIs || kpaObj.associatedKPIs || kpaObj.kpis || [];
              if (Array.isArray(kpiList)) {
                kpiList.forEach((kpiObj: any) => {
                  let rawCode = (kpiObj.KPI_Code || kpiObj.kpiCode || kpiObj.kpiNo || kpiObj.code || kpiObj.refNum || '').toString().trim();
                  let code = rawCode;
                  
                  if (!code) {
                    code = `U_${uCount < 10 ? '0'+uCount : uCount}`;
                    uCount++;
                  }
                  
                  extKpis.push({
                    code: code,
                    description: kpiObj.KPI_Description || kpiObj.kpiDescription || kpiObj.description || kpiObj.kpi || 'Untitled KPI',
                    budget: kpiObj.Total_Budget_Allocated_R000 || kpiObj.totalBudgetAllocatedR000 || kpiObj.budget || kpiObj.Budget || '',
                    baseline: kpiObj.Baseline || kpiObj.baseline || '',
                    weighting: kpiObj.Weight || kpiObj.weight || kpiObj.Weighting || kpiObj.weighting || '',
                    kpaNum: kpaNumStr,
                    kpaDesc: kpaDesc
                  });
                });
              }
            });
          }

          const grid = perfPlan.Annual_Planner_Grid || {};
          if (grid) {
            if (Array.isArray(grid.Quarter_1)) q1Codes = grid.Quarter_1.map((c: any) => c.toString().toUpperCase().trim());
            if (Array.isArray(grid.Quarter_2)) q2Codes = grid.Quarter_2.map((c: any) => c.toString().toUpperCase().trim());
            if (Array.isArray(grid.Quarter_3)) q3Codes = grid.Quarter_3.map((c: any) => c.toString().toUpperCase().trim());
            if (Array.isArray(grid.Quarter_4)) q4Codes = grid.Quarter_4.map((c: any) => c.toString().toUpperCase().trim());
            hasGrid = q1Codes.length > 0 || q2Codes.length > 0 || q3Codes.length > 0 || q4Codes.length > 0;
          }
        }
      }

      const baseCatalog = generateAll97KPIs(availableKpas);
      let finalKpiItems: PlanKPIItem[] = [];

      if (foundExtraction && extKpis.length > 0) {
        finalKpiItems = extKpis.map((e, idx) => {
          const codeUpper = e.code.toUpperCase();
          const stdCatalogItem = baseCatalog.find(catItem => catItem.kpiNo.toLowerCase().replace(/[^a-z0-9]/g, '') === codeUpper.toLowerCase().replace(/[^a-z0-9]/g, ''));
          
          const combinedKpaText = `${e.kpaNum} ${e.kpaDesc}`.toLowerCase();
          let kpaIdx = 1;
          if (combinedKpaText.includes('7') || combinedKpaText.includes('skills') || combinedKpaText.includes('capacity') || combinedKpaText.includes('training')) {
            kpaIdx = 7;
          } else if (combinedKpaText.includes('6') || combinedKpaText.includes('spatial') || combinedKpaText.includes('rationale') || combinedKpaText.includes('sr') || combinedKpaText.includes('town planning')) {
            kpaIdx = 6;
          } else if (combinedKpaText.includes('5') || combinedKpaText.includes('governance') || combinedKpaText.includes('public participation') || combinedKpaText.includes('ggpp') || combinedKpaText.includes('risk')) {
            kpaIdx = 5;
          } else if (combinedKpaText.includes('4') || combinedKpaText.includes('financial') || combinedKpaText.includes('viability') || combinedKpaText.includes('mfvm') || combinedKpaText.includes('budget') || combinedKpaText.includes('revenue')) {
            kpaIdx = 4;
          } else if (combinedKpaText.includes('3') || combinedKpaText.includes('economic') || combinedKpaText.includes('led') || combinedKpaText.includes('business')) {
            kpaIdx = 3;
          } else if (combinedKpaText.includes('2') || combinedKpaText.includes('institutional') || combinedKpaText.includes('transformation') || combinedKpaText.includes('midt') || combinedKpaText.includes('human resource')) {
            kpaIdx = 2;
          } else if (combinedKpaText.includes('1') || combinedKpaText.includes('service delivery') || combinedKpaText.includes('infrastructure') || combinedKpaText.includes('bsd') || combinedKpaText.includes('water') || combinedKpaText.includes('sanitation')) {
            kpaIdx = 1;
          }

          let kpaName = "";
          if (kpaIdx === 7 || combinedKpaText.includes('skills')) {
            kpaName = "KPA 7: Skills Development & Capacity Training";
          } else {
            const rawKpaTitle = (e.kpaDesc || e.kpaNum || 'Other Category').trim();
            if (rawKpaTitle.toLowerCase().startsWith('kpa')) {
              kpaName = rawKpaTitle;
            } else {
              const kpaDefaultTitles: Record<number, string> = {
                1: "Basic Service Delivery and Infrastructure Provision",
                2: "Municipal Institutional Development and Transformation",
                3: "Local Economic Development (LED)",
                4: "Municipal Financial Viability and Management",
                5: "Good Governance and Public Participation",
                6: "Spatial Rationale",
                7: "Skills Development & Capacity Training"
              };
              const titleText = rawKpaTitle || kpaDefaultTitles[kpaIdx] || "Other Category";
              kpaName = `KPA ${kpaIdx}: ${titleText}`;
            }
          }

          const q1Locked = hasGrid ? !q1Codes.includes(codeUpper) : false;
          const q2Locked = hasGrid ? !q2Codes.includes(codeUpper) : false;
          const q3Locked = hasGrid ? !q3Codes.includes(codeUpper) : false;
          const q4Locked = hasGrid ? !q4Codes.includes(codeUpper) : false;

          const extractedPoe = e.poe || stdCatalogItem?.poe || `Signed verification report and approved evidence portfolio for: ${e.description || stdCatalogItem?.kpi || 'KPI'}`;

          return {
            id: stdCatalogItem ? stdCatalogItem.id : `pplan-fred-extra-${e.code}-${idx}-${Math.random()}`,
            strategicGoal: stdCatalogItem?.strategicGoal || "General Departmental Objective Alignment",
            kpiNo: e.code,
            kpi: e.description || stdCatalogItem?.kpi || 'Untitled KPI',
            bsd: kpaIdx === 1,
            midt: kpaIdx === 2 || kpaIdx === 7,
            led: kpaIdx === 3,
            mfvm: kpaIdx === 4,
            ggpp: kpaIdx === 5,
            sr: kpaIdx === 6,
            kpa: kpaName,
            mscoaCode: stdCatalogItem?.mscoaCode || "Functions",
            baseline: e.baseline || stdCatalogItem?.baseline || "Standard operational compliance",
            baselineYear: stdCatalogItem?.baselineYear || "2025/2026",
            budget: e.budget || stdCatalogItem?.budget || "",
            annualTarget: stdCatalogItem?.annualTarget || "100% compliance/execution of objectives",
            q1Target: q1Locked ? "Locked (Not Reportable)" : (stdCatalogItem?.q1Target || "25% progress"),
            q2Target: q2Locked ? "Locked (Not Reportable)" : (stdCatalogItem?.q2Target || "50% progress"),
            q3Target: q3Locked ? "Locked (Not Reportable)" : (stdCatalogItem?.q3Target || "75% progress"),
            q4Target: q4Locked ? "Locked (Not Reportable)" : (stdCatalogItem?.q4Target || "100% progress"),
            q1Locked,
            q2Locked,
            q3Locked,
            q4Locked,
            poe: extractedPoe,
            annualRequiredPoe: extractedPoe,
            q1Poe: extractedPoe,
            q2Poe: extractedPoe,
            midtermPoe: extractedPoe,
            q3Poe: extractedPoe,
            q4Poe: extractedPoe,
            weighting: e.weighting || stdCatalogItem?.weighting || "10",
            myScore: stdCatalogItem?.myScore || "3.0"
          };
        });
      } else {
        finalKpiItems = baseCatalog;
      }

      finalKpiItems = finalKpiItems.map(it => {
        const uniquePoe = (it.poe || it.annualRequiredPoe || it.q1Poe || it.q2Poe || it.midtermPoe || it.q3Poe || it.q4Poe || `Signed verification report and approved evidence portfolio for: ${it.kpi || it.kpiNo}`).trim();
        return {
          ...it,
          poe: uniquePoe,
          annualRequiredPoe: uniquePoe,
          q1Poe: uniquePoe,
          q2Poe: uniquePoe,
          midtermPoe: uniquePoe,
          q3Poe: uniquePoe,
          q4Poe: uniquePoe
        };
      });

      finalKpiItems.sort((a, b) => {
        const aCode = a.kpiNo || '';
        const bCode = b.kpiNo || '';
        const getWeight = (code: string) => {
          if (code.startsWith('M')) return 1;
          if (code.startsWith('P')) return 2;
          if (code.startsWith('U')) return 3;
          return 4;
        };
        const wA = getWeight(aCode);
        const wB = getWeight(bCode);
        if (wA !== wB) return wA - wB;
        return aCode.localeCompare(bCode, undefined, { numeric: true });
      });

      setItems(finalKpiItems);
      const updatedMetadata = { ...metadata, _isFredExtracted: true, _isCleared: false };
      setMetadata(updatedMetadata);
      await handleSaveToDatabase(updatedMetadata, finalKpiItems, false);

      // Automatically clear Fred Extraction state so it is only used once
      if (foundExtraction) {
        try {
          await fetch(`/api/tenant/${activeTenantId}/fred-extraction/agreement_to_plan_engine?userId=${currentUser?.email || 'default'}`, { method: 'DELETE' });
        } catch (e) {
          console.error("Failed to clear fred extraction state after pull", e);
        }
        alert(`Successfully imported all ${finalKpiItems.length} KPIs from the Fred Extraction Agent's active 'agreement_to_plan_engine' output, complete with correct category mapping, objectives, and quarterly targets!`);
      } else {
        alert(`No active Fred Extraction record found for 'agreement_to_plan_engine'. Auto-populated full COGTA compliant Statutory Planner Grid with all 97 KPIs (M_01 to M_92 and U_01 to U_05) mapped perfectly!`);
      }
    } catch (err: any) {
      console.error("Pull Fred Extraction error:", err);
      alert("Failed to pull Fred Extraction data: " + err.message);
    } finally {
      setIsPullingFred(false);
    }
  };

  // Change handlers
  const handleMetadataChange = (key: keyof PlanMetadata, value: string) => {
    const updated = { ...metadata, [key]: value };
    setMetadata(updated);
    handleSaveToDatabase(updated, items);
  };

  const handleRowChange = (id: string, key: keyof PlanKPIItem, value: any) => {
    // Locked quarterly POE text fields cannot be edited directly
    if (key === 'q1Poe' || key === 'q2Poe' || key === 'q3Poe' || key === 'q4Poe' || key === 'midtermPoe') {
      return;
    }

    const updatedItems = items.map(item => {
      if (item.id === id) {
        const next = { ...item, [key]: value };
        if (key === 'poe' || key === 'annualRequiredPoe') {
          const desc = String(value || '').trim();
          next.poe = desc;
          next.annualRequiredPoe = desc;
          next.q1Poe = desc;
          next.q2Poe = desc;
          next.midtermPoe = desc;
          next.q3Poe = desc;
          next.q4Poe = desc;
        }
        return next;
      }
      return item;
    });
    setItems(updatedItems);
    handleSaveToDatabase(metadata, updatedItems);
  };

  const addRow = () => {
    const newId = `kpi-${Date.now()}`;
    const defaultPoe = 'Signed verification report and approved portfolio of evidence files';
    const newItem: PlanKPIItem = {
      id: newId,
      strategicGoal: '',
      kpiNo: `KPI-1.2.${items.length + 1}`,
      kpi: '',
      bsd: false,
      led: false,
      mfvm: false,
      ggpp: false,
      midt: false,
      sr: false,
      kpa: '',
      mscoaCode: '',
      baseline: '',
      baselineYear: '2025/2026',
      budget: '',
      annualTarget: '',
      q1Target: '',
      q2Target: '',
      q3Target: '',
      q4Target: '',
      poe: defaultPoe,
      annualRequiredPoe: defaultPoe,
      q1Poe: defaultPoe,
      q2Poe: defaultPoe,
      midtermPoe: defaultPoe,
      q3Poe: defaultPoe,
      q4Poe: defaultPoe,
      weighting: '20',
      myScore: '3.0',
      evaluation: currentUser?.fullName || '',
      review: ''
    };
    const updated = [...items, newItem];
    setItems(updated);
    handleSaveToDatabase(metadata, updated);
  };

  const deleteRow = (id: string) => {
    const updated = items.filter(x => x.id !== id);
    setItems(updated);
    handleSaveToDatabase(metadata, updated);
  };

  // Pre-configured South African Municipal reference data helpers
  const handleApplyPreset = (index: number) => {
    const presets = [
      {
        strategicGoal: "Improve Governance and Internal Administration Control Systems",
        kpiNo: "KPI-4.3.1",
        kpi: "Achieve 100% implementation of audit action plan strategies within timeline thresholds",
        bsd: false,
        led: false,
        mfvm: true,
        ggpp: true,
        midt: true,
        sr: false,
        kpa: "Good Governance & Public Participation"
      },
      {
        strategicGoal: "Support Local Economic Development and SMMES within Sub-boroughs",
        kpiNo: "KPI-3.1.2",
        kpi: "Approve 45 spatial LED training grants assisting designated municipal wards",
        bsd: false,
        led: true,
        mfvm: false,
        ggpp: false,
        midt: false,
        sr: true,
        kpa: "Local Economic Development (LED)"
      }
    ];

    if (presets[index]) {
      const p = presets[index];
      const newId = `kpi-preset-${Date.now()}`;
      const newItem: PlanKPIItem = {
        id: newId,
        strategicGoal: p.strategicGoal,
        kpiNo: p.kpiNo,
        kpi: p.kpi,
        bsd: p.bsd,
        led: p.led,
        mfvm: p.mfvm,
        ggpp: p.ggpp,
        midt: p.midt,
        sr: p.sr,
        kpa: p.kpa,
        baseline: "Varies per ward unit",
        baselineYear: "2025/2026",
        budget: "R50 000 (Local Dev Fund)",
        annualTarget: "Target approved allocations completed",
        q1Target: "25% allocations",
        q2Target: "50% allocations",
        q3Target: "75% allocations",
        q4Target: "100% allocations",
        poe: "Grant approvals ledger and registry file",
        weighting: "15",
        myScore: "0.0",
        evaluation: currentUser?.fullName || '',
        review: ''
      };
      const updated = [...items, newItem];
      setItems(updated);
      handleSaveToDatabase(metadata, updated);
    }
  };

  // EXPORT UTILITIES

  // XLSX Export (restricted columns MUST NOT be visible)
  const handleExportToExcel = () => {
    const publicHeaders = [
      "Strategic Objective", "KPI No", "KPI Description",
      "BSD (X)", "LED (X)", "MFVM (X)", "GGPP (X)", "MIDT (X)", "SR (X)",
      "KPA", "Baseline Year", "Baseline", "Budget", "Annual Target", "Q1 Target", "Q1 Actual", "1st Qtr Actual Expense", "Q1 Comment", "Q2 Target", "Q2 Actual", "2nd Qtr Actual Expense", "Q2 Comment", "Midterm Review", "Midterm Actual", "Midterm Actual Expense", "Midterm Comment", "Q3 Target", "Q3 Actual", "3rd Qtr Actual Expense", "Q3 Comment", "Q4 Target", "Q4 Actual", "4th Qtr Actual Expense", "Q4 Comment", "Annual Actual", "Annual Actual Exp", "Annual Variance", "Annual Corrective", "POE",
      "Weighting (%)"
    ];

    const metadataRows = [
      ["Performance Plan Metadata Summary"],
      ["Name & Surname", metadata.name || 'N/A'],
      ["Period", metadata.period || 'N/A'],
      ["Department", metadata.department || 'N/A'],
      ["Position", metadata.position || 'N/A'],
      ["Level", metadata.level || 'N/A'],
      [],
      publicHeaders
    ];

    const kpiRows = items.map(item => [
      item.strategicGoal || '',
      item.kpiNo || '',
      item.kpi || '',
      item.bsd ? 'X' : '',
      item.led ? 'X' : '',
      item.mfvm ? 'X' : '',
      item.ggpp ? 'X' : '',
      item.midt ? 'X' : '',
      item.sr ? 'X' : '',
      item.kpa || '',
      item.baselineYear || '',
      item.baseline || '',
      item.budget || '',
      item.annualTarget || '',
      item.q1Target || '',
      item.q1Actual || '',
      item.q1ActualExpense || '',
      item.q1Comment || '',
      item.q2Target || '',
      item.q2Actual || '',
      item.q2ActualExpense || '',
      item.q2Comment || '',
      item.midtermTarget || '',
      item.midtermActual || '',
      item.midtermActualExpense || '',
      item.midtermComment || '',
      item.q3Target || '',
      item.q3Actual || '',
      item.q3ActualExpense || '',
      item.q3Comment || '',
      item.q4Target || '',
      item.q4Actual || '',
      item.q4ActualExpense || '',
      item.q4Comment || item.q4Corrective || '',
      item.annualActual || '',
      item.annualActualExpense || item.annualActualExp || '',
      item.annualVariance || calculateVariance(item.annualTarget, item.annualActual || item.q4Actual),
      item.annualCorrective || '',
      item.annualRequiredPoe || item.poe || '',
      item.weighting || ''
    ]);

    const worksheetData = [...metadataRows, ...kpiRows];
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

    // Apply structured, spacious column widths to Excel so everything is perfectly readable
    worksheet['!cols'] = [
      { wch: 25 }, // Strategic Objective
      { wch: 10 }, // KPI No
      { wch: 55 }, // KPI Description
      { wch: 7 },  // BSD
      { wch: 7 },  // LED
      { wch: 7 },  // MFVM
      { wch: 7 },  // GGPP
      { wch: 7 },  // MIDT
      { wch: 7 },  // SR
      { wch: 25 }, // KPA
      { wch: 14 }, // Baseline Year
      { wch: 20 }, // Baseline
      { wch: 18 }, // Budget
      { wch: 20 }, // Annual Target
      { wch: 14 }, // Q1 Target
      { wch: 14 }, // Q1 Actual
      { wch: 20 }, // 1st Qtr Actual Expense
      { wch: 25 }, // Q1 Comment
      { wch: 14 }, // Q2 Target
      { wch: 14 }, // Q2 Actual
      { wch: 20 }, // 2nd Qtr Actual Expense
      { wch: 25 }, // Q2 Comment
      { wch: 16 }, // Midterm Review (midtermTarget)
      { wch: 16 }, // Midterm Actual
      { wch: 20 }, // Midterm Actual Expense
      { wch: 25 }, // Midterm Comment
      { wch: 14 }, // Q3 Target
      { wch: 14 }, // Q3 Actual
      { wch: 20 }, // 3rd Qtr Actual Expense
      { wch: 25 }, // Q3 Comment
      { wch: 14 }, // Q4 Target
      { wch: 14 }, // Q4 Actual
      { wch: 20 }, // 4th Qtr Actual Expense
      { wch: 25 }, // Q4 Comment
      { wch: 25 }, // POE
      { wch: 12 }  // Weighting (%)
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Performance Plan");
    XLSX.writeFile(workbook, `Performance_Plan_Export_${activeTenantId}.xlsx`);
  };

  // Word (.doc) Export (restricted columns filter compliant)
  const handleExportToWord = () => {
    const isRestricted = canViewRestricted();
    
    const tableHeaders = [
      "Strategic Objective", "KPI No", "KPI Description", 
      "BSD", "LED", "MFVM", "GGPP", "MIDT", "SR", 
      "KPA", "Baseline", "Budget", "Annual Target", "Q1 Target", "Q1 Actual", "1st Qtr Actual Expense", "Q1 Comment", "Q2 Target", "Q2 Actual", "2nd Qtr Actual Expense", "Q2 Comment", "Midterm Review", "Midterm Actual", "Midterm Actual Expense", "Midterm Comment", "Q3 Target", "Q3 Actual", "3rd Qtr Actual Expense", "Q3 Comment", "Q4 Target", "Q4 Actual", "4th Qtr Actual Expense", "Q4 Comment", "Annual Actual", "Annual Actual Exp", "Annual Variance", "Annual Corrective", "POE", "Weight %"
    ];

    if (isRestricted) {
      // Append evaluation and review columns
      tableHeaders.push("Evaluation", "Review");
    }

    const headerWidthsMap: { [key: string]: string } = {
      "Strategic Objective": "110px",
      "KPI No": "45px",
      "KPI Description": "200px",
      "BSD": "25px",
      "LED": "25px",
      "MFVM": "25px",
      "GGPP": "25px",
      "MIDT": "25px",
      "SR": "25px",
      "KPA": "100px",
      "Baseline": "90px",
      "Budget": "80px",
      "Annual Target": "90px",
      "Q1 Target": "70px",
      "Q1 Actual": "70px",
      "Q1 Comment": "100px",
      "Q2 Target": "70px",
      "Q2 Actual": "70px",
      "Q2 Comment": "100px",
      "Midterm Review": "75px",
      "Midterm Actual": "75px",
      "Midterm Comment": "100px",
      "Q3 Target": "70px",
      "Q3 Actual": "70px",
      "Q3 Comment": "100px",
      "Q4 Target": "70px",
      "Q4 Actual": "70px",
      "Q4 Comment": "100px",
      "POE": "110px",
      "Weight %": "45px",
      "Evaluation": "90px",
      "Review": "90px"
    };

    const tableHeadersHtml = tableHeaders.map(h => {
      const width = headerWidthsMap[h] || "auto";
      return `<th style="border: 1px solid #475569; padding: 4px; background-color: #0f172a; color: white; font-size: 8px; text-align: center; vertical-align: middle; width: ${width}; font-weight: bold; word-break: break-all; word-wrap: break-word;">${h}</th>`;
    }).join('');

    const tableRows = items.map(item => {
      let cells = `
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.strategicGoal || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; font-weight: bold; text-align: center; vertical-align: top;">${item.kpiNo || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.kpi || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 7.5px; vertical-align: top;">${item.bsd ? 'X' : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 7.5px; vertical-align: top;">${item.led ? 'X' : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 7.5px; vertical-align: top;">${item.mfvm ? 'X' : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 7.5px; vertical-align: top;">${item.ggpp ? 'X' : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 7.5px; vertical-align: top;">${item.midt ? 'X' : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; text-align: center; font-size: 7.5px; vertical-align: top;">${item.sr ? 'X' : ''}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.kpa || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.baseline || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.budget || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.annualTarget || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q1Target || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q1Actual || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q1ActualExpense || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q1Comment || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q2Target || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q2Actual || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q2ActualExpense || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q2Comment || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.midtermTarget || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.midtermActual || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.midtermActualExpense || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.midtermComment || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q3Target || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q3Actual || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q3ActualExpense || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q3Comment || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q4Target || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q4Actual || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q4ActualExpense || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.q4Comment || item.q4Corrective || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.annualActual || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.annualActualExpense || item.annualActualExp || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.annualVariance || calculateVariance(item.annualTarget, item.annualActual || item.q4Actual)}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.annualCorrective || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; white-space: normal; vertical-align: top;">${item.annualRequiredPoe || item.poe || 'N/A'}</td>
        <td style="border: 1px solid #cbd5e1; padding: 3px; font-weight: bold; font-family: monospace; font-size: 7.5px; text-align: center; vertical-align: top;">${item.weighting || 'N/A'}%</td>
      `;

      if (isRestricted) {
        cells += `
          <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; font-weight: bold; word-break: break-all; word-wrap: break-word; vertical-align: top;">${item.evaluation || 'N/A'}</td>
          <td style="border: 1px solid #cbd5e1; padding: 3px; font-size: 7.5px; word-break: break-all; word-wrap: break-word; vertical-align: top;">${item.review || 'N/A'}</td>
        `;
      }

      return `<tr>${cells}</tr>`;
    }).join('');

    const wordContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset="utf-8">
        <title>Mzansi Statutory Performance Plan</title>
        <!--[if gte mso 9]>
        <xml>
          <o:OfficeDocumentSettings>
            <o:AllowPNG/>
          </o:OfficeDocumentSettings>
        </xml>
        <![endif]-->
        <style>
          @page Section1 { 
            size: 1190.6pt 841.9pt; /* Standard A3 Landscape to properly accommodate massive 31+ columns */
            margin: 0.5in 0.5in 0.5in 0.5in; 
            mso-page-orientation: landscape; 
            mso-header-margin: 0.5in; 
            mso-footer-margin: 0.5in;
          }
          div.Section1 { page: Section1; }
          body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.3; color: #1e293b; padding: 20px; }
          h1 { color: #1d4ed8; text-transform: uppercase; font-size: 16px; border-bottom: 2px solid #2563eb; padding-bottom: 4px; margin-bottom: 12px; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; table-layout: fixed; }
          .meta-table td { border: 1px solid #cbd5e1; padding: 6px; font-size: 9px; }
          .meta-label { font-weight: bold; background-color: #f8fafc; color: #475569; width: 25%; }
          .plan-table { width: 100%; border-collapse: collapse; margin-top: 15px; table-layout: auto; }
          .plan-table th, .plan-table td { font-size: 6pt; padding: 3px; border: 1px solid #cbd5e1; word-wrap: break-word; word-break: break-all; }
          .footer { font-size: 8px; color: #64748b; margin-top: 40px; text-align: center; border-top: 1px dashed #cbd5e1; padding-top: 10px; }
        </style>
      </head>
      <body>
        <div class="Section1">
        <h1>Mzansi Local Municipal Performance Plan</h1>
        <p style="font-size: 10px; color: #334155; margin-bottom: 15px;">This document details the certified Local Performance targets and key indicators linked with the approved Service Delivery and Budget Implementation Plan (SDBIP).</p>
        
        <table class="meta-table">
          <tr>
            <td class="meta-label">Name & Surname</td>
            <td><strong>${metadata.name || 'Unassigned'}</strong></td>
          </tr>
          <tr>
            <td class="meta-label">Period</td>
            <td>${metadata.period || 'N/A'}</td>
          </tr>
          <tr>
            <td class="meta-label">Department</td>
            <td>${metadata.department || 'N/A'}</td>
          </tr>
          <tr>
            <td class="meta-label">Position</td>
            <td>${metadata.position || 'N/A'}</td>
          </tr>
          <tr>
            <td class="meta-label">Level</td>
            <td>${metadata.level || 'N/A'}</td>
          </tr>
        </table>

        <h2 style="font-size: 12px; margin-top: 25px; margin-bottom: 8px;">Performance Planning & Indicators (${items.length} KPIs)</h2>
        <table class="plan-table" style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- empty signature block in Word footer on every page/document -->
        <div style="margin-top: 40px; border-top: 2px solid #cbd5e1; padding-top: 20px;">
          <h3 style="font-size: 11px; text-transform: uppercase; font-weight: bold; color: #1e3a8a; margin-bottom: 15px;">Formal Declaration &amp; Sign-off</h3>
          <table style="width: 100%; border: none; font-size: 9px; font-family: 'Segoe UI', Arial, sans-serif;">
            <tr style="border: none;">
              <td style="border: none; width: 45%; vertical-align: top; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Employee / Officer Representative</strong>
                <div style="margin-bottom: 4px;"><strong>Name &amp; Surname:</strong> ${metadata.name || currentUser.fullName || currentUser.email}</div>
                <div style="margin-bottom: 4px;"><strong>Designation:</strong> ${metadata.position || currentUser.jobFunction || 'Employee'}</div>
                <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
                <div><strong>Signature:</strong> ____________________________________</div>
                <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
              </td>
              <td style="border: none; width: 10%;"></td>
              <td style="border: none; width: 45%; vertical-align: top; padding: 12px; background: #f8fafc; border-radius: 8px;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 9px; display: block; margin-bottom: 6px;">Line Manager / Supervisor Approval</strong>
                <div style="margin-bottom: 4px;"><strong>Name &amp; Surname:</strong> ${metadata.manager || 'Designated Line Manager'}</div>
                <div style="margin-bottom: 4px;"><strong>Designation:</strong> Line Manager / Director</div>
                <div style="height: 35px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 8px;"></div>
                <div><strong>Signature:</strong> ____________________________________</div>
                <div style="margin-top: 6px;"><strong>Date Signed:</strong> ________________________________</div>
              </td>
            </tr>
          </table>
        </div>

        <div class="footer">
          Mzansi Performance Analytics Engine • Generated on ${new Date().toLocaleDateString()} • Authorized Confidential Release
        </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + wordContent], { type: 'application/msword' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Performance_Plan_Word_Export_${activeTenantId}.doc`;
    link.click();
  };

  // HTML Print Window Trigger
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Please allow popups to print this document.");
      return;
    }

    const isRestricted = canViewRestricted();
    const tableHeaders = [
      "Strategic Objective", "KPI No", "KPI Description", 
      "BSD", "LED", "MFVM", "GGPP", "MIDT", "SR", 
      "KPA", "Baseline", "Budget", "Annual Target", "Q1 Goal", "Q1 Actual", "Q1 Comment", "Q2 Goal", "Q2 Actual", "Q2 Comment", "Midterm Review", "Midterm Actual", "Midterm Comment", "Q3 Goal", "Q3 Actual", "Q3 Comment", "Q4 Goal", "Q4 Actual", "Q4 Comment", "Annual Actual", "Annual Actual Exp", "Annual Variance", "Annual Corrective", "POE", "Weight"
    ];

    if (isRestricted) {
      tableHeaders.push("Evaluation", "Review");
    }

    const tableHeadersHtml = tableHeaders.map(h => `<th style="border: 1px solid #94a3b8; padding: 6px; background-color: #1e293b; color: white; text-align: left; font-size: 8px; text-transform: uppercase;">${h}</th>`).join('');

    const tableRows = items.map(item => {
      let cells = `
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.strategicGoal || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px; font-weight: bold;">${item.kpiNo || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.kpi || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-size: 8px;">${item.bsd ? 'X' : ''}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-size: 8px;">${item.led ? 'X' : ''}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-size: 8px;">${item.mfvm ? 'X' : ''}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-size: 8px;">${item.ggpp ? 'X' : ''}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-size: 8px;">${item.midt ? 'X' : ''}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; text-align: center; font-size: 8px;">${item.sr ? 'X' : ''}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.kpa || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.baseline || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.budget || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.annualTarget || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q1Target || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q1Actual || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q1Comment || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q2Target || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q2Actual || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q2Comment || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.midtermTarget || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.midtermActual || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.midtermComment || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q3Target || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q3Actual || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q3Comment || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q4Target || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q4Actual || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.q4Comment || item.q4Corrective || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.annualActual || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.annualActualExpense || item.annualActualExp || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.annualVariance || calculateVariance(item.annualTarget, item.annualActual || item.q4Actual)}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.annualCorrective || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.annualRequiredPoe || item.poe || 'N/A'}</td>
        <td style="border: 1px solid #e2e8f0; padding: 6px; font-weight: bold; font-family: monospace; font-size: 8px;">${item.weighting || 'N/A'}%</td>
      `;

      if (isRestricted) {
        cells += `
          <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px; font-weight: bold;">${item.evaluation || 'N/A'}</td>
          <td style="border: 1px solid #e2e8f0; padding: 6px; font-size: 8px;">${item.review || 'N/A'}</td>
        `;
      }

      return `<tr>${cells}</tr>`;
    }).join('');

    const html = `
      <html>
      <head>
        <title>Mzansi Flow SDBIP Plan Printable View</title>
        <style>
          @page {
            size: landscape;
            margin: 0.5cm;
          }
          body { 
            font-family: system-ui, -apple-system, sans-serif; 
            padding: 10px; 
            color: #111827; 
            background-color: #fff;
          }
          .header { 
            margin-bottom: 12px; 
            border-bottom: 2px double #1d4ed8; 
            padding-bottom: 6px; 
          }
          .title { 
            font-size: 14px; 
            font-weight: 800; 
            text-transform: uppercase; 
            margin: 0; 
            color: #1e293b; 
          }
          .meta-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-top: 8px; 
            margin-bottom: 12px; 
            font-size: 8px; 
          }
          .meta-table td { 
            border: 1px solid #cbd5e1; 
            padding: 4px 6px; 
          }
          .meta-lbl { 
            font-weight: bold; 
            background: #f1f5f9; 
            width: 25%; 
          }
          .plan-tbl { 
            width: 100%; 
            border-collapse: collapse; 
            font-size: 7px; 
            margin-top: 10px; 
            table-layout: auto; 
            word-wrap: break-word;
          }
          .plan-tbl th { 
            border: 1px solid #94a3b8; 
            background-color: #0f172a; 
            color: white; 
            padding: 4px; 
            text-align: left;
            font-weight: bold;
          }
          .plan-tbl td { 
            border: 1px solid #cbd5e1; 
            padding: 4px; 
            vertical-align: top;
          }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">Mzansi SDBIP Municipal Performance Plan</div>
          <div style="font-size: 8px; color: #4b5563; margin-top: 2px;">Verified Landscape Compliance Documentation for Inter-Departmental Performance Control</div>
        </div>

        <table class="meta-table">
          <tr>
            <td class="meta-lbl">Name & Surname</td>
            <td><strong>${metadata.name || 'Unassigned'}</strong></td>
          </tr>
          <tr>
            <td class="meta-lbl">Period</td>
            <td>${metadata.period || 'N/A'}</td>
          </tr>
          <tr>
            <td class="meta-lbl">Department</td>
            <td>${metadata.department || 'N/A'}</td>
          </tr>
          <tr>
            <td class="meta-lbl">Position</td>
            <td>${metadata.position || 'N/A'}</td>
          </tr>
          <tr>
            <td class="meta-lbl">Level</td>
            <td>${metadata.level || 'N/A'}</td>
          </tr>
        </table>

        <table class="plan-tbl">
          <thead>
            <tr>${tableHeadersHtml}</tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>

        <!-- empty signature block in print/PDF output -->
        <div style="margin-top: 30px; border-top: 1.5px solid #94a3b8; padding-top: 15px;">
          <h3 style="font-size: 10px; text-transform: uppercase; font-weight: bold; color: #1e3a8a; margin-bottom: 10px; margin-top: 0;">Formal Declaration &amp; Sign-off</h3>
          <table style="width: 100%; border: none; font-size: 8px; font-family: system-ui, -apple-system, sans-serif;">
            <tr style="border: none;">
              <td style="border: none; width: 45%; vertical-align: top; padding: 10px; background: #f8fafc; border-radius: 6px;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 8px; display: block; margin-bottom: 4px;">Employee / Officer Representative</strong>
                <div style="margin-bottom: 3px;"><strong>Name:</strong> ${metadata.name || currentUser.fullName || currentUser.email}</div>
                <div style="margin-bottom: 3px;"><strong>Designation:</strong> ${metadata.position || currentUser.jobFunction || 'Employee'}</div>
                <div style="height: 30px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 5px;"></div>
                <div><strong>Signature:</strong> ____________________________________</div>
                <div style="margin-top: 4px;"><strong>Date Signed:</strong> ________________________________</div>
              </td>
              <td style="border: none; width: 10%;"></td>
              <td style="border: none; width: 45%; vertical-align: top; padding: 10px; background: #f8fafc; border-radius: 6px;">
                <strong style="color: #0f172a; text-transform: uppercase; font-size: 8px; display: block; margin-bottom: 4px;">Line Manager / Supervisor Approval</strong>
                <div style="margin-bottom: 3px;"><strong>Name &amp; Surname:</strong> ${metadata.manager || 'Designated Line Manager'}</div>
                <div style="margin-bottom: 3px;"><strong>Designation:</strong> Line Manager / Director</div>
                <div style="height: 30px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 5px;"></div>
                <div><strong>Signature:</strong> ____________________________________</div>
                <div style="margin-top: 4px;"><strong>Date Signed:</strong> ________________________________</div>
              </td>
            </tr>
          </table>
        </div>

        <div style="margin-top: 20px; font-size: 7px; text-align: center; color: #64748b; border-top: 1px dashed #cbd5e1; padding-top: 10px;">
          Mzansi IPMS Performance Integration Server (Supabase Release) • Generated Date: ${new Date().toLocaleDateString()}
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Rendering Standard Header of Module

  const handleSendForReview = async () => {
    if (!currentUser?.email) return;
    
    // We send a notification to Manager & Internal Audit
    try {
      setIsLoading(true);
      const isTeam = agreementScope === 'team';
      const pTitle = isTeam ? 'Team Performance Agreement Draft Review' : 'Individual Performance Agreement Draft Review';
      const targetEmailStr = isTeam ? currentUser.email + '_team' : currentUser.email;

      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            senderEmail: targetEmailStr,
            senderName: currentUser.fullName || currentUser.email,
            recipientEmail: 'manager@nkangaladm.gov.za',
            recipientName: 'Manager',
            title: pTitle,
            message: `${currentUser.fullName || currentUser.email} has submitted their ${isTeam ? 'Team' : 'Individual'} Performance Agreement for review.`,
            actionType: 'revision_requested',
            employeeEmail: targetEmailStr
          }
        })
      });

      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification: {
            senderEmail: targetEmailStr,
            senderName: currentUser.fullName || currentUser.email,
            recipientEmail: 'audit@nkangaladm.gov.za',
            recipientName: 'Internal Audit',
            title: pTitle,
            message: `${currentUser.fullName || currentUser.email} has submitted their ${isTeam ? 'Team' : 'Individual'} Performance Agreement for review.`,
            actionType: 'audit_request',
            employeeEmail: targetEmailStr
          }
        })
      });

      // When team leader submits team agreement, notify each team member on their individual profile
      if (isTeam) {
        try {
          const teamRepRes = await fetch(`/api/tenant/${activeTenantId}/team-reporting?documentIdSuffix=all`);
          if (teamRepRes.ok) {
            const repData = await teamRepRes.json();
            const membersMap = new Map<string, { name: string; email: string }>();
            (repData.reports || []).forEach((r: any) => {
              (r.notifiedMembers || []).forEach((m: any) => {
                if (m && m.email && m.email.includes('@') && m.email.toLowerCase() !== currentUser.email?.toLowerCase()) {
                  membersMap.set(m.email.toLowerCase(), { name: m.name || m.email, email: m.email.toLowerCase() });
                }
              });
            });

            for (const member of Array.from(membersMap.values())) {
              await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  notification: {
                    senderEmail: targetEmailStr,
                    senderName: currentUser.fullName || currentUser.email,
                    recipientEmail: member.email,
                    recipientName: member.name,
                    title: `Team Performance Agreement Submitted for Review`,
                    message: `Team Leader ${currentUser.fullName || currentUser.email} has submitted the Team Performance Agreement for official review. As a team member, this update is recorded on your individual profile.`,
                    actionType: 'revision_requested',
                    employeeEmail: targetEmailStr
                  }
                })
              });
            }
          }
        } catch (teamNotifErr) {
          console.warn("Failed to notify team members for agreement review:", teamNotifErr);
        }
      }

      alert(`Successfully sent ${isTeam ? 'Team' : 'Individual'} Performance Agreement to Manager, Internal Audit, and team members.`);
    } catch (e) {
      console.error(e);
      alert('Failed to send for review.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderHeader = () => (

    <div id="pa-nav-ribbon" className="bg-slate-900 border-b border-slate-950 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-green-600 text-white flex items-center justify-center border border-green-500 shadow-md">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="select-text">
          <span className="text-[9px] bg-green-550/20 text-green-300 border border-green-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            SDBIP Statutory Module
          </span>
          <h1 className="text-sm font-black text-white uppercase tracking-tight hover:text-green-300 transition duration-150">
            {headingTitle} Workspace
          </h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 select-none">
        {users.length > 0 && (
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 px-3 py-1 rounded-xl text-xs">
            <span className="text-[10px] font-bold text-slate-300 uppercase shrink-0">View Plan:</span>
            <select
              value={selectedUserEmail}
              onChange={(e) => setSelectedUserEmail(e.target.value)}
              className="bg-slate-900 text-white text-[11px] font-bold px-2 py-0.5 rounded-lg border border-slate-700 outline-none max-w-[260px] truncate"
            >
              <option value="">My Plan ({currentUser.fullName || currentUser.email})</option>
              {users
                .filter(u => u.email && u.email.toLowerCase() !== (currentUser.email || '').toLowerCase())
                .map((u, idx) => (
                  <option key={u.id ? `pa-user-${u.id}-${idx}` : `pa-user-${u.email}-${idx}`} value={u.email}>
                    {u.fullName || u.full_name || u.email} ({u.email})
                  </option>
                ))}
            </select>
          </div>
        )}

        <span className="text-xs bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-xl text-slate-350 flex items-center gap-1.5 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Municipality Code: <b className="font-mono text-white uppercase">{activeTenantId}</b>
        </span>
        
        {isPlan && (
          <button 
            type="button"
            onClick={() => handleSaveToDatabase(metadata, items, true)}
            disabled={isSaving}
            className="bg-emerald-600 border border-emerald-500 hover:bg-emerald-500 text-white font-bold px-4 py-1.5 rounded-xl text-[11px] uppercase tracking-wider flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>{isSaving ? "Saving..." : "Save to DB"}</span>
          </button>
        )}
      </div>
    </div>
  );

  const empUser = users.find(u => u.email?.toLowerCase() === (metadata.email || currentUser.email)?.toLowerCase()) || currentUser;
  const mgrUser = users.find(u => 
    (metadata.managerEmail && u.email?.toLowerCase() === metadata.managerEmail.toLowerCase()) || 
    (metadata.manager && u.fullName?.toLowerCase() === metadata.manager.toLowerCase())
  );
  
  const empSignature = empUser?.signatureData || currentUser.signatureData || '';
  const mgrSignature = mgrUser?.signatureData || '';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50 text-slate-600 p-8 rounded-3xl border border-gray-200">
        <div className="w-12 h-12 rounded-full border-4 border-green-200 border-t-green-600 animate-spin mb-4"></div>
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">Loading statutory plan metrics...</p>
      </div>
    );
  }

  // --- RENDERING INTEGRATED PERFORMANCE AGREEMENT CONTRACT PREVIEW & SIGN OFF (when isPlan = false) ---
  if (!isPlan) {
    return (
      <div id="pa-dashboard-layout" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-gray-900 select-none">
        {renderHeader()}
        
        {/* Navigation Tabs */}
        {isDualLayerTeamLeader && (
          <div className="bg-slate-900 px-6 py-3 flex items-center gap-4 justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-indigo-400" />
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white uppercase tracking-wider">Dual-Layer Performance Scope</span>
                <span className="text-[10px] text-slate-400">You manage a team and have an individual scorecard.</span>
              </div>
            </div>
            <div className="flex items-center bg-slate-800 rounded-xl p-1 shadow-inner border border-slate-700">
              <button 
                onClick={() => {
                  setAgreementScope('team');
                  setActiveTab('brief');
                }}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${agreementScope === 'team' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                Team Performance
              </button>
              <button 
                onClick={() => {
                  setAgreementScope('individual');
                  setActiveTab('drafting_suite');
                }}
                className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${agreementScope === 'individual' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
              >
                My Personal Agreement
              </button>
            </div>
          </div>
        )}

        <div className="bg-white border-b border-gray-200 px-6 flex gap-4 overflow-x-auto hide-scrollbar">
          <button 
            onClick={() => setActiveTab('brief')}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === 'brief' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Brief
          </button>
          <button 
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === 'templates' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Templates
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite')}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === 'drafting_suite' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Drafting Suite
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite_firefighters')}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === 'drafting_suite_firefighters' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            CDS Team PA
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite_technical_services')}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === 'drafting_suite_technical_services' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Technical Services Team PA
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite_corporate_services')}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === 'drafting_suite_corporate_services' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            Corporate Services Team PA
          </button>
          <button 
            onClick={() => setActiveTab('drafting_suite_pms_team')}
            className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === 'drafting_suite_pms_team' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          >
            PMS Team PA
          </button>
          {isLeadFireFighter && (
            <button 
              onClick={() => setActiveTab('lead_fire_fighter')}
              className={`px-4 py-3 font-bold text-xs uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap ${activeTab === 'lead_fire_fighter' ? 'border-amber-600 text-amber-700' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
            >
              Lead Fire Fighter PA
            </button>
          )}
        </div>

        {activeTab === 'drafting_suite' ? (
          <PADraftingSuite key={`pa_suite_${effectiveUser?.email || currentUser.email}_${activeTenantId}`} currentUser={effectiveUser as any} activeTenantId={activeTenantId} />
        ) : activeTab === 'drafting_suite_technical_services' ? (
          <DraftingSuiteTeam 
            key={`pa_tech_${effectiveUser?.email || currentUser.email}_${activeTenantId}`}
            currentUser={effectiveUser as any} 
            activeTenantId={activeTenantId} 
            teamTitle="Technical Services Team"
            documentIdSuffix="technical_services"
            defaultRows={DEFAULT_TECHNICAL_SERVICES_ROWS}
          />
        ) : activeTab === 'drafting_suite_corporate_services' ? (
          <DraftingSuiteTeam 
            key={`pa_corp_${effectiveUser?.email || currentUser.email}_${activeTenantId}`}
            currentUser={effectiveUser as any} 
            activeTenantId={activeTenantId} 
            teamTitle="Corporate Services Team"
            documentIdSuffix="corporate_services"
            defaultRows={DEFAULT_CORPORATE_SERVICES_ROWS}
          />
        ) : activeTab === 'drafting_suite_pms_team' ? (
          <DraftingSuiteTeam 
            key={`pa_pms_${effectiveUser?.email || currentUser.email}_${activeTenantId}`}
            currentUser={effectiveUser as any} 
            activeTenantId={activeTenantId} 
            teamTitle="PMS Team"
            documentIdSuffix="pms_team"
            defaultRows={DEFAULT_PMS_TEAM_ROWS}
          />
        ) : activeTab === 'drafting_suite_firefighters' ? (
          <DraftingSuiteFirefighters key={`pa_ff_${effectiveUser?.email || currentUser.email}_${activeTenantId}`} currentUser={effectiveUser as any} activeTenantId={activeTenantId} />
        ) : activeTab === 'lead_fire_fighter' ? (
          <LeadFireFighterPADraftingSuite key={`pa_lff_${effectiveUser?.email || currentUser.email}_${activeTenantId}`} currentUser={effectiveUser as any} activeTenantId={activeTenantId} />
        ) : activeTab === 'templates' ? (
          <div className="flex-1 overflow-y-auto">
            <PATemplates key={`pa_tpl_${effectiveUser?.email || currentUser.email}_${activeTenantId}`} currentUser={effectiveUser as any} activeTenantId={activeTenantId} />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-slate-900 text-white border border-slate-800 p-6 rounded-2xl flex items-start gap-4 shadow-md select-text">
                <div className="p-3 bg-white/10 text-green-400 border border-white/10 rounded-xl">
                  <Shield className="w-6 h-6 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-sm font-black text-white uppercase tracking-tight">
                    Performance Agreement Contract
                  </h2>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                    A performance agreement is a formal contract between an employer and an employee that defines specific performance expectations, goals, and standards. It serves as a tool for accountability, tracking progress, and determining performance-based rewards.
                  </p>
                </div>
              </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 select-text">
              <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
                <h3 className="text-xs font-black text-green-600 uppercase tracking-wide border-b border-gray-100 pb-2">
                  1. Contract Scope
                </h3>
                <ul className="space-y-2 text-[11px] text-gray-500 leading-relaxed">
                  <li><b className="text-gray-800 block">Job Details & Scope:</b> The employee's role, salary level, and core purpose within the organization.</li>
                  <li><b className="text-gray-800 block">Key Performance Areas (KPAs):</b> The primary areas of professional accountability for the specific position.</li>
                  <li><b className="text-gray-800 block">Rating Scale & Scorecards:</b> Documented baseline standards and evaluation thresholds for bi-annual and annual reviews.</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
                <h3 className="text-xs font-black text-green-600 uppercase tracking-wide border-b border-gray-100 pb-2">
                  2. Policy Alignment
                </h3>
                <ul className="space-y-2 text-[11px] text-gray-500 leading-relaxed">
                  <li><b className="text-gray-800 block">Strategic Cascading:</b> Alignment down from directors' agreements down to sub-departmental and individual staff commitments.</li>
                  <li><b className="text-gray-800 block">Performance Plans:</b> Matches the actionable annual strategic targets with individual delivery targets.</li>
                  <li><b className="text-gray-850 block">Labor Legislation:</b> Guided by Municipal Systems Act Regulations, enabling transparent appraisal standards.</li>
                </ul>
              </div>

              <div className="bg-white border border-gray-200 p-5 rounded-2xl space-y-3 shadow-sm hover:shadow-md transition">
                <h3 className="text-xs font-black text-green-600 uppercase tracking-wide border-b border-gray-100 pb-2">
                  3. Evaluation Origin
                </h3>
                <ul className="space-y-2 text-[11px] text-gray-500 leading-relaxed">
                  <li><b className="text-gray-800 block">Job Descriptions:</b> Defined roles and key duties registered within organizational HR systems.</li>
                  <li><b className="text-gray-800 block">Annual Appraisals:</b> Performance scores tracking individual output against agreed targets.</li>
                  <li><b className="text-gray-850 block">Consultation Agreements:</b> Mutually co-signed performance benchmarks negotiated between supervisor and staff member.</li>
                </ul>
              </div>
            </div>

            {/* Performance Plan Metadata Form */}
            <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
              {/* Centered Municipal Logo - Persistent */}
              <div className="flex flex-col items-center justify-center border-b border-rose-50/10 pb-4">
                <img
                  src={NKANGALA_LOGO_BASE64}
                  alt="Nkangala District Municipality Logo"
                  className="max-h-24 object-contain transition-all hover:scale-105 duration-300"
                />
                <span className="text-[10px] tracking-widest font-extrabold text-emerald-800 uppercase mt-2 font-mono">
                  Nkangala District Municipality
                </span>
                <span className="text-[10px] text-slate-400 font-medium">
                  Inter-Departmental Performance Management System
                </span>
              </div>

              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider text-center underline decoration-emerald-600/30 underline-offset-4">
                📄 Associated Performance Agreement Master Card
              </h3>
              <table className="w-full border-collapse border border-slate-200 text-xs text-left max-w-2xl mx-auto rounded-xl overflow-hidden shadow-sm">
                <tbody>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-3 text-slate-700 w-1/3 border-r border-slate-200">Name & Surname</td>
                    <td className="p-3 font-semibold text-slate-800">{metadata.name || 'Cllr. Mike Mzansi'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-3 text-slate-700 w-1/3 border-r border-slate-200">Period</td>
                    <td className="p-3 text-slate-700">{metadata.period || '2025/2026 Financial Year'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-3 text-slate-700 w-1/3 border-r border-slate-200">Department</td>
                    <td className="p-3 text-slate-700">{metadata.department || 'N/A'}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-50 font-bold p-3 text-slate-700 w-1/3 border-r border-slate-200">Position</td>
                    <td className="p-3 text-slate-700">{metadata.position || 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="bg-slate-50 font-bold p-3 text-slate-700 w-1/3 border-r border-slate-200">Level</td>
                    <td className="p-3 text-slate-700 font-mono text-[11px]">{metadata.level || 'N/A'}</td>
                  </tr>
                </tbody>
              </table>

              {/* Statutory Signature Block (Hollow, blank with proper forest green boxes) */}
              <div className="border border-emerald-800/30 rounded-2xl p-5 bg-emerald-50/5 space-y-4">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 block border-b border-emerald-800/10 pb-2 flex items-center gap-1.5 font-sans justify-center">
                  📜 Statutory Page Signatures (Formal Sign-off Box)
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white p-4 border border-emerald-200 rounded-xl space-y-3 shadow-sm">
                    <span className="text-[9px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100">Officer / Employee Representative</span>
                    <p className="text-xs text-slate-700"><b>Name:</b> {metadata.name || currentUser.fullName || currentUser.email || 'Representative'}</p>
                    <p className="text-xs text-slate-700"><b>Designation:</b> {metadata.position || currentUser.jobFunction || 'Officer Representative'}</p>
                    <div className="pt-2">
                      <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-16 rounded-lg flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic relative overflow-hidden">
                        {empSignature ? (
                          <img src={empSignature} alt="Employee Signature" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          "[ Signature Area ]"
                        )}
                      </div>
                    </div>
                    <div className="pt-1 flex items-center gap-2">
                      <label className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Date:</label>
                      <input 
                        type="date" 
                        value={metadata.dateSignedEmployee || ''}
                        onChange={(e) => handleMetadataChange('dateSignedEmployee', e.target.value)}
                        className="text-xs p-1 border border-slate-300 rounded focus:border-emerald-500 outline-none w-full"
                      />
                    </div>
                  </div>

                  <div className="bg-white p-4 border border-emerald-200 rounded-xl space-y-3 shadow-sm">
                    <span className="text-[9px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100">Supervisor / Manager Approval</span>
                    <p className="text-xs text-slate-700"><b>Name:</b> {metadata.manager || 'Designated Supervisor'}</p>
                    <p className="text-xs text-slate-700"><b>Designation:</b> Line Manager / Representative</p>
                    <div className="pt-2">
                      <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-16 rounded-lg flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic relative overflow-hidden">
                        {mgrSignature ? (
                          <img src={mgrSignature} alt="Manager Signature" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                        ) : (
                          "[ Signature Area ]"
                        )}
                      </div>
                    </div>
                    <div className="pt-1 flex items-center gap-2">
                      <label className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Date:</label>
                      <input 
                        type="date" 
                        value={metadata.dateSignedManager || ''}
                        onChange={(e) => handleMetadataChange('dateSignedManager', e.target.value)}
                        className="text-xs p-1 border border-slate-300 rounded focus:border-emerald-500 outline-none w-full"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}
        <div id="pa-legal-footer" className="p-4 bg-gray-50/80 border-t border-gray-200 text-[9px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-2 shrink-0 select-text">
          <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5 text-slate-400 shrink-0" /> Evaluates all professional, leading, and personal attributes in compliance with sector standards</span>
          <b className="uppercase text-gray-600 font-bold">Mzansi Flow SDBIP/IPMS</b>
        </div>
      </div>
    );
  }

  // --- RENDERING COMPREHENSIVE STATUTORY PERFORMANCE PLAN WITH EDITABLE SPREADSHEET (when isPlan = true) ---
  return (
    <div id="pa-dashboard-layout" className="flex flex-col h-full bg-slate-50 border border-gray-200 rounded-3xl overflow-hidden shadow-2xl text-stone-900">
      
      {/* Header ribbon */}
      {renderHeader()}

      {/* Main container split */}
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex flex-col gap-6">
        
        {/* TOP ROW: Toolboxes */}
        <div className={`grid grid-cols-1 xl:grid-cols-3 gap-6 shrink-0 transition-all duration-300 ${isExpanded ? 'hidden' : 'grid'}`}>
          
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs select-text">
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-3">
              <ClipboardList className="w-4.5 h-4.5 text-green-600" />
              Employee Performance Card
            </h2>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed mb-4">
              Official planning records showing fields arranged vertically for pristine layout.
            </p>

            {/* Vertical Columns Form */}
            <table className="w-full border border-slate-200 text-[11px] rounded-lg overflow-hidden border-collapse bg-slate-50/30">
              <tbody>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100/80 text-slate-600 font-bold p-2.5 w-1/3 border-r border-slate-200">Name & Surname</td>
                  <td className="p-1 text-slate-800 bg-white">
                    <input 
                      type="text" 
                      value={metadata.name || ''} 
                      onChange={(e) => handleMetadataChange('name', e.target.value)}
                      placeholder="e.g. Cllr. Mike Mzansi"
                      className="w-full bg-transparent p-1 focus:bg-slate-50 border-0 outline-none font-bold text-slate-900 text-[11px]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100/80 text-slate-600 font-bold p-2.5 w-1/3 border-r border-slate-200">Period</td>
                  <td className="p-1 text-slate-800 bg-white">
                    <input 
                      type="text" 
                      value={metadata.period || ''} 
                      onChange={(e) => handleMetadataChange('period', e.target.value)}
                      placeholder="e.g. 2025/2026 Fiscal"
                      className="w-full bg-transparent p-1 focus:bg-slate-50 border-0 outline-none text-slate-700 text-[11px]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100/80 text-slate-600 font-bold p-2.5 w-1/3 border-r border-slate-200">Department</td>
                  <td className="p-1 text-slate-800 bg-white">
                    <input 
                      type="text" 
                      value={metadata.department || ''} 
                      onChange={(e) => handleMetadataChange('department', e.target.value)}
                      placeholder="e.g. Budget & Treasury Unit"
                      className="w-full bg-transparent p-1 focus:bg-slate-50 border-0 outline-none text-slate-700 text-[11px]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100/80 text-slate-600 font-bold p-2.5 w-1/3 border-r border-slate-200">Position</td>
                  <td className="p-1 text-slate-800 bg-white">
                    <input 
                      type="text" 
                      value={metadata.position || ''} 
                      onChange={(e) => handleMetadataChange('position', e.target.value)}
                      placeholder="e.g. CFO Director"
                      className="w-full bg-transparent p-1 focus:bg-slate-50 border-0 outline-none text-slate-700 text-[11px]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100/80 text-slate-600 font-bold p-2.5 w-1/3 border-r border-slate-200">Level</td>
                  <td className="p-1 text-slate-800 bg-white">
                    <input 
                      type="text" 
                      value={metadata.level || ''} 
                      onChange={(e) => handleMetadataChange('level', e.target.value)}
                      placeholder="e.g. Level 1"
                      className="w-full bg-transparent p-1 focus:bg-slate-50 border-0 outline-none text-slate-700 text-[11px]"
                    />
                  </td>
                </tr>
                <tr className="border-b border-slate-200">
                  <td className="bg-slate-100/80 text-[10px] text-slate-500 font-semibold p-2.5 w-1/3 border-r border-slate-200">Email</td>
                  <td className="p-1 bg-slate-50">
                    <input 
                      type="text" 
                      value={metadata.email || ''} 
                      onChange={(e) => handleMetadataChange('email', e.target.value)}
                      placeholder="owner@system.local"
                      className="w-full bg-transparent p-1 text-[10px] text-slate-500 border-0 outline-none font-mono"
                    />
                  </td>
                </tr>
                <tr className="border-slate-200">
                  <td className="bg-slate-100/80 text-[10px] text-slate-500 font-semibold p-2.5 w-1/3 border-r border-slate-200">Manager</td>
                  <td className="p-1 bg-slate-50">
                    <input 
                      type="text" 
                      value={metadata.manager || ''} 
                      onChange={(e) => handleMetadataChange('manager', e.target.value)}
                      placeholder="manager name"
                      className="w-full bg-transparent p-1 text-[10px] text-slate-550 border-0 outline-none"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick-Inject Presets */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs select-text">
            <h3 className="text-xs font-black uppercase text-slate-700 mb-2 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <Sparkles className="w-4 h-4 text-green-500" />
              Statutory KPI Quick Injects
            </h3>
            <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
              Quick inject standardized statutory local KPIs derived from standard National Treasury SDBIP guidelines.
            </p>
            <div className="space-y-2">
              <button 
                type="button"
                onClick={() => handleApplyPreset(0)}
                className="w-full p-2.5 bg-slate-50 hover:bg-green-50 text-left border border-slate-200 hover:border-green-300 rounded-lg text-[10px] transition group"
              >
                <div className="font-bold text-slate-700 group-hover:text-green-700 text-[10px] uppercase">Audit Action Strategy</div>
                <div className="text-slate-500 line-clamp-1 mt-0.5 font-medium">100% execution score on strategic objectives.</div>
              </button>
              <button 
                type="button"
                onClick={() => handleApplyPreset(1)}
                className="w-full p-2.5 bg-slate-50 hover:bg-green-50 text-left border border-slate-200 hover:border-green-300 rounded-lg text-[10px] transition group"
              >
                <div className="font-bold text-slate-700 group-hover:text-green-700 text-[10px] uppercase">SMMES Spatial Grant Initiative</div>
                <div className="text-slate-500 line-clamp-1 mt-0.5 font-medium">Incentive tracking systems deployment.</div>
              </button>
            </div>
          </div>

          {/* Export Toolbox */}
          <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs space-y-3">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <FileDown className="w-4.5 h-4.5 text-green-500" />
              Performance Plan Export Toolbox
            </h3>
            
            <div className="grid grid-cols-1 gap-2 select-none">
              <button 
                type="button"
                onClick={handleExportToExcel}
                className="w-full bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer text-center"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export Excel (.xlsx)</span>
              </button>

              <button 
                type="button"
                onClick={handleExportToWord}
                className="w-full bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer text-center"
              >
                <Briefcase className="w-3.5 h-3.5 text-slate-600" />
                <span>Export Word (.doc)</span>
              </button>

              <button 
                type="button"
                onClick={handlePrint}
                className="w-full bg-green-50 text-green-750 hover:bg-green-100 border border-green-250 font-bold px-3 py-2 rounded-xl text-[10px] uppercase tracking-wide flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer text-center"
              >
                <Download className="w-3.5 h-3.5 text-green-600" />
                <span>PDF Print Report</span>
              </button>
            </div>
          </div>

        </div>

        {/* BOTTOM SECTION: Interactive Spreadsheet Grid */}
        <div className={`w-full bg-white border border-slate-200 shadow-xs flex flex-col transition-all duration-300 ${isExpanded ? 'fixed inset-0 z-[99999] w-screen h-screen mt-0 rounded-none bg-white p-4 md:p-6 overflow-hidden flex flex-col shadow-2xl top-0 left-0' : 'mt-2 h-[75vh] min-h-[600px] shrink-0 rounded-3xl overflow-hidden'}`}>

          
          {/* Top Panel Controls */}
          <div className="px-6 py-4.5 bg-slate-900 flex flex-wrap items-center justify-between border-b border-slate-950 gap-4 shrink-0 rounded-t-xl">
            <div className="select-text">
              <h2 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-green-400" />
                Annual Performance Planner Grid {isExpanded && <span className="text-rose-400 font-extrabold text-[10px] ml-2">(FULLSCREEN MODE)</span>}
              </h2>
              <p className="text-[10px] text-slate-400 mt-0.5">
                Assign KPA Units captured from KPA capturing tool to automatically complete strategic and National KPA targets.
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold text-white uppercase select-text font-mono">
                {canViewRestricted() ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Lock Auth Passed</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span className="text-amber-500">Restricted Mode Active</span>
                  </>
                )}
              </div>

              {canViewRestricted() && (
                <button
                  type="button"
                  onClick={() => setShowRestrictedFieldsOverride(!showRestrictedFieldsOverride)}
                  className="bg-slate-800 text-slate-300 hover:text-white border border-slate-700 px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer font-mono"
                >
                  {showRestrictedFieldsOverride ? <EyeOff className="w-3 h-3 text-rose-400" /> : <Eye className="w-3 h-3 text-emerald-400" />}
                  <span>{showRestrictedFieldsOverride ? "Hide Private Fields" : "Display Private Fields"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className={`font-black px-3.5 py-1.5 rounded-lg text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition cursor-pointer font-mono shadow-sm ${
                  isExpanded 
                    ? 'bg-rose-600 border border-rose-500 text-white hover:bg-rose-700' 
                    : 'bg-slate-800 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-700'
                }`}
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5 text-white" /> : <Maximize2 className="w-3.5 h-3.5 text-green-450" />}
                <span>{isExpanded ? 'Exit Full Screen' : 'Expand Table'}</span>
              </button>

              <button
                type="button"
                onClick={handlePullFredExtraction}
                disabled={isPullingFred}
                className="bg-emerald-700 hover:bg-emerald-650 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition cursor-pointer border border-emerald-600 shadow-xs disabled:opacity-50"
                title="Restore / Import all 97 Statutory KPIs (M_01 to M_92 and U_01 to U_05)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{isPullingFred ? 'Importing 97 KPIs...' : 'Import 97 KPIs'}</span>
              </button>

              <button
                type="button"
                onClick={handleClearGrid}
                className="bg-rose-100 border border-rose-200 text-rose-700 hover:bg-rose-200 hover:text-rose-800 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wide flex items-center gap-1.5 transition cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Grid</span>
              </button>

              <button 
                type="button"
                onClick={addRow}
                className="bg-green-600 border border-green-500 text-white hover:bg-green-500 font-bold px-4 py-1.5 rounded-lg text-[11px] uppercase tracking-wide flex items-center gap-1 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          {/* Interactive spreadsheet style scroll window */}

          {/* Interactive spreadsheet style scroll window */}
          <div className="flex-1 overflow-auto bg-slate-50 select-text">
            <table className="w-full border-collapse border-spacing-0 text-[11px] text-left transition-all min-w-[1700px]">
              <thead className="sticky top-0 bg-slate-900 border-b border-slate-950 z-20 text-white font-black uppercase text-[9px] tracking-wider select-none">
                {/* Double Headers: Row 1 */}
                <tr className="border-b border-slate-800">
                  <th rowSpan={2} className="p-3 bg-slate-900 text-center w-[45px] border-r border-slate-800 align-middle sticky left-0 z-30">No.</th>
                  <th rowSpan={2} className="p-3 min-w-[200px] w-auto bg-slate-900 border-r border-slate-800 align-middle">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>Strategic Objective</span>
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th rowSpan={2} className="p-3 min-w-[100px] w-auto bg-slate-900 border-r border-slate-800 align-middle">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>KPI No</span>
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th rowSpan={2} className="p-3 min-w-[250px] w-auto bg-slate-900 border-r border-slate-800 align-middle">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>KPI Description</span>
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  
                  {/* Category check metrics */}
                  <th rowSpan={2} className="p-1 px-2 text-center w-[40px] border-r border-slate-800 bg-blue-900/10 text-blue-200 align-middle">BSD</th>
                  <th rowSpan={2} className="p-1 px-2 text-center w-[40px] border-r border-slate-800 bg-blue-900/10 text-blue-200 align-middle">LED</th>
                  <th rowSpan={2} className="p-1 px-2 text-center w-[40px] border-r border-slate-800 bg-blue-900/10 text-blue-200 align-middle">MFVM</th>
                  <th rowSpan={2} className="p-1 px-2 text-center w-[40px] border-r border-slate-800 bg-blue-900/10 text-blue-200 align-middle">GGPP</th>
                  <th rowSpan={2} className="p-1 px-2 text-center w-[40px] border-r border-slate-800 bg-blue-900/10 text-blue-200 align-middle">MIDT</th>
                  <th rowSpan={2} className="p-1 px-2 text-center w-[40px] border-r border-slate-800 bg-blue-900/10 text-blue-200 align-middle">SR</th>
                  {/* Functional Area KPA Column directly styled between SR and mSCOA code */}
                  <th rowSpan={2} className="p-3 min-w-[200px] w-auto border-r border-slate-800 bg-slate-950 text-emerald-300 font-extrabold text-center align-middle">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>Functional Area KPA</span>
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th rowSpan={2} className="p-3 min-w-[150px] w-auto border-r border-slate-800 bg-slate-900 text-purple-300 font-extrabold text-center align-middle">mSCOA Code</th>

                  <th rowSpan={2} className="p-3 min-w-[140px] w-auto border-r border-slate-800 align-middle">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>Baseline</span>
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th rowSpan={2} className="p-3 min-w-[120px] w-auto border-r border-slate-800 align-middle text-emerald-300 bg-emerald-950/20">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>Budget</span>
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  
                  {/* Financial Year Header above Targets */}
                  <th colSpan={30} className="p-2 text-center border-r border-slate-800 bg-slate-950/45 text-[10px] tracking-widest text-emerald-400 font-extrabold min-w-[3800px]">
                    MUNICIPAL FINANCIAL YEAR (1 JULY - 30 JUNE)
                  </th>
                  
                  <th rowSpan={2} className="p-3 min-w-[180px] w-auto border-r border-slate-800 align-middle">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>Portfolio of Evidence (POE)</span>
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th rowSpan={2} className="p-3 w-[65px] border-r border-slate-800 text-center align-middle">% Wt</th>

                  {/* RESTRICTED INTERNAL AUDIT & PANEL MEMBERS COLUMNS */}
                  {isRestrictedVisible && (
                    <th rowSpan={2} className="p-3 min-w-[150px] w-auto border-r border-slate-800 bg-amber-950/20 text-amber-300 align-middle">Evaluation</th>
                  )}

                  <th rowSpan={2} className="p-3 min-w-[250px] w-auto border-r border-slate-800 bg-teal-950/20 text-teal-300 align-middle">
                    <div className="flex items-center gap-1.5 justify-center">
                      <span>Review</span>
                      <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                    </div>
                  </th>

                  <th rowSpan={2} className="p-3 text-center w-[50px] bg-slate-950/60 align-middle">Delete</th>
                </tr>

                {/* Double Headers: Row 2 */}
                <tr>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Annual Target</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">1st Qtr Target</th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">1st Qtr Actual<br/><span className="text-[7px] text-slate-400">Comment Below</span></th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[140px] text-emerald-300 bg-emerald-950/30">1st Qtr Actual Expense<br/><span className="text-[7px] text-emerald-400 font-extrabold">R (ZAR)</span></th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[120px]">1st Qtr Variance</th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[180px]">1st Qtr Corrective</th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>2nd Qtr Target</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>2nd Qtr Actual</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[140px] text-emerald-300 bg-emerald-950/30">
                    <div className="flex items-center gap-1 justify-center">
                      <span>2nd Qtr Actual Expense</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                    <span className="text-[7px] text-emerald-400 font-extrabold">R (ZAR)</span>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[120px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>2nd Qtr Variance</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[180px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>2nd Qtr Corrective</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Midterm Review</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Midterm Actual</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[140px] text-emerald-300 bg-emerald-950/30">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Midterm Actual Expense</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                    <span className="text-[7px] text-emerald-400 font-extrabold">R (ZAR)</span>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[120px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Midterm Variance</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[180px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Midterm Corrective</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>3rd Qtr Target</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>3rd Qtr Actual</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[140px] text-emerald-300 bg-emerald-950/30">
                    <div className="flex items-center gap-1 justify-center">
                      <span>3rd Qtr Actual Expense</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                    <span className="text-[7px] text-emerald-400 font-extrabold">R (ZAR)</span>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[120px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>3rd Qtr Variance</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[180px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>3rd Qtr Corrective</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>4th Qtr Target</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>4th Qtr Actual</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[140px] text-emerald-300 bg-emerald-950/30">
                    <div className="flex items-center gap-1 justify-center">
                      <span>4th Qtr Actual Expense</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                    <span className="text-[7px] text-emerald-400 font-extrabold">R (ZAR)</span>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[120px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>4th Qtr Variance</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[180px]">
                    <div className="flex items-center gap-1 justify-center">
                      <span>4th Qtr Corrective</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[150px] bg-sky-950/40 text-sky-300">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Annual Actual</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                    <span className="text-[7px] text-sky-400 font-normal">Total Achieved</span>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[140px] text-emerald-300 bg-emerald-950/30">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Annual Actual Exp</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                    <span className="text-[7px] text-emerald-400 font-extrabold">R (ZAR)</span>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[120px] bg-amber-950/30 text-amber-300">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Annual Variance</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                  <th className="p-2 border-r border-slate-800 bg-slate-950/20 text-center text-[8px] tracking-tight min-w-[180px] bg-amber-950/30 text-amber-300">
                    <div className="flex items-center gap-1 justify-center">
                      <span>Annual Corrective</span>
                      <Lock className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-semibold text-slate-850">
                {items.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={isRestrictedVisible ? 43 : 42} 
                      className="p-8 text-center text-slate-400 font-bold uppercase tracking-widest bg-white"
                    >
                      No KPI targets configured. Click "Add Record" to start planning.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => (
                    <tr 
                      key={item.id} 
                      className="group bg-white hover:bg-slate-50 transition duration-100"
                    >
                      {/* KPI indicator row number */}
                      <td className="p-2.5 text-center bg-white group-hover:bg-slate-50 font-mono font-bold text-slate-500 border-r border-slate-205 select-none text-[10px] sticky left-0 z-10 w-[45px]">
                        {index + 1}
                      </td>

                      {/* Strategic Objective - Locked */}
                      <td className="p-1.5 border-r border-slate-205 bg-slate-100/50 min-w-[220px] w-auto cursor-not-allowed">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>Objective (Locked)</span>
                          </div>
                          <div className="w-full bg-slate-100/80 border border-slate-200/80 rounded p-1.5 text-[10px] font-medium text-slate-750 select-text leading-tight cursor-not-allowed min-h-[35px]">
                            {item.strategicGoal || <span className="text-slate-400 italic font-normal">No objective assigned</span>}
                          </div>
                        </div>
                      </td>

                      {/* KPI No - Locked */}
                      <td className="p-1 border-r border-slate-250 bg-slate-100/50 min-w-[100px] w-auto cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1.5 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                          </div>
                          <span className="font-mono font-bold text-emerald-800 text-[10.5px] select-text text-center">
                            {item.kpiNo || '—'}
                          </span>
                        </div>
                      </td>

                      {/* KPI Description - Locked */}
                      <td className="p-1.5 border-r border-slate-205 bg-slate-100/40 min-w-[250px] w-auto cursor-not-allowed">
                        <div className="flex flex-col gap-1 w-full min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>Description (Locked)</span>
                          </div>
                          <div className="w-full text-[10.5px] font-medium text-slate-800 leading-snug p-1 select-text bg-slate-100/60 rounded border border-slate-200/60">
                            {item.kpi || <span className="text-slate-400 italic font-normal">No description provided</span>}
                          </div>
                        </div>
                      </td>

                      {/* Toggles BSD, LED, MFVM, GGPP, MIDT, SR */}
                      <td className="p-1 border-r border-slate-205 text-center bg-slate-50/50 cursor-pointer hover:bg-slate-100/80" onClick={() => handleRowChange(item.id, 'bsd', !item.bsd)}>
                        <span className={`font-mono text-xs font-black select-none ${item.bsd ? 'text-green-600 bg-green-100/80 px-2 py-0.5 rounded' : 'text-slate-300'}`}>
                          {item.bsd ? 'X' : '·'}
                        </span>
                      </td>

                      <td className="p-1 border-r border-slate-205 text-center bg-slate-50/50 cursor-pointer hover:bg-slate-100/80" onClick={() => handleRowChange(item.id, 'led', !item.led)}>
                        <span className={`font-mono text-xs font-black select-none ${item.led ? 'text-green-600 bg-green-100/80 px-2 py-0.5 rounded' : 'text-slate-300'}`}>
                          {item.led ? 'X' : '·'}
                        </span>
                      </td>

                      <td className="p-1 border-r border-slate-205 text-center bg-slate-50/50 cursor-pointer hover:bg-slate-100/80" onClick={() => handleRowChange(item.id, 'mfvm', !item.mfvm)}>
                        <span className={`font-mono text-xs font-black select-none ${item.mfvm ? 'text-green-600 bg-green-100/80 px-2 py-0.5 rounded' : 'text-slate-300'}`}>
                          {item.mfvm ? 'X' : '·'}
                        </span>
                      </td>

                      <td className="p-1 border-r border-slate-205 text-center bg-slate-50/50 cursor-pointer hover:bg-slate-100/80" onClick={() => handleRowChange(item.id, 'ggpp', !item.ggpp)}>
                        <span className={`font-mono text-xs font-black select-none ${item.ggpp ? 'text-green-600 bg-green-100/80 px-2 py-0.5 rounded' : 'text-slate-300'}`}>
                          {item.ggpp ? 'X' : '·'}
                        </span>
                      </td>

                      <td className="p-1 border-r border-slate-205 text-center bg-slate-50/50 cursor-pointer hover:bg-slate-100/80" onClick={() => handleRowChange(item.id, 'midt', !item.midt)}>
                        <span className={`font-mono text-xs font-black select-none ${item.midt ? 'text-green-600 bg-green-100/80 px-2 py-0.5 rounded' : 'text-slate-300'}`}>
                          {item.midt ? 'X' : '·'}
                        </span>
                      </td>

                      <td className="p-1 border-r border-slate-205 text-center bg-slate-50/50 cursor-pointer hover:bg-slate-100/80" onClick={() => handleRowChange(item.id, 'sr', !item.sr)}>
                        <span className={`font-mono text-xs font-black select-none ${item.sr ? 'text-green-600 bg-green-100/80 px-2 py-0.5 rounded' : 'text-slate-300'}`}>
                          {item.sr ? 'X' : '·'}
                        </span>
                      </td>

                      {/* Functional Area KPA - Locked */}
                      <td className="p-1.5 border-r border-slate-205 bg-slate-100/50 min-w-[200px] w-auto cursor-not-allowed">
                        <div className="flex flex-col gap-1 w-full">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>KPA (Locked)</span>
                          </div>
                          <div className="w-full bg-slate-100/80 border border-slate-200/80 rounded p-1.5 text-[10px] font-medium text-slate-750 select-text leading-tight cursor-not-allowed min-h-[35px]">
                            {item.kpa || <span className="text-slate-400 italic font-normal">No KPA assigned</span>}
                          </div>
                        </div>
                      </td>

                      {/* mSCOA Alignment Code */}
                      <td className="p-1 border-r border-slate-205 bg-white group-hover:bg-slate-50 min-w-[155px] w-auto">
                        <div className="flex flex-col gap-1 w-full">
                          <select
                            value={uniqueMscoaCodes.includes(item.mscoaCode || '') ? (item.mscoaCode || '') : ((item.mscoaCode) ? "__CUSTOM__" : "")}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val !== "__CUSTOM__") {
                                handleRowChange(item.id, 'mscoaCode', val);
                              }
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded text-[9px] font-bold p-1 outline-none text-slate-800 transition"
                          >
                            <option key="default_mscoa" value="">-- Select mSCOA --</option>
                            {uniqueMscoaCodes.map((code, cIdx) => (
                              <option key={code ? `mscoa_${code}_${cIdx}` : `mscoa_idx_${cIdx}`} value={code}>
                                {code}
                              </option>
                            ))}
                            <option key="custom_mscoa" value="__CUSTOM__">➕ [Type Custom mSCOA...]</option>
                          </select>
                          
                          <input
                            type="text"
                            value={item.mscoaCode || ''}
                            onChange={(e) => handleRowChange(item.id, 'mscoaCode', e.target.value)}
                            placeholder="Type manually..."
                            className="w-full bg-transparent p-1 shadow-none outline-none focus:bg-slate-50 border border-dashed border-slate-200 rounded text-[10px] font-mono font-medium mt-1"
                          />
                        </div>
                      </td>

                      {/* Baseline - Locked */}
                      <td className="p-1.5 border-r border-slate-205 bg-slate-100/40 min-w-[140px] w-auto cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                          </div>
                          <div className="text-[10px] text-slate-700 text-center select-text font-medium">
                            {item.baseline || <span className="text-slate-400 italic font-normal">—</span>}
                          </div>
                        </div>
                      </td>

                      {/* Budget - Locked */}
                      <td className="p-1.5 border-r border-slate-205 bg-slate-100/40 min-w-[120px] w-auto cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                          </div>
                          <div className="text-[10px] font-bold text-emerald-800 text-center select-text">
                            {item.budget || <span className="text-slate-400 italic font-normal">—</span>}
                          </div>
                        </div>
                      </td>

                      {/* Annual Target - Locked */}
                      <td className="p-1.5 border-r border-slate-205 bg-slate-100/40 min-w-[150px] cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                          </div>
                          <div className="text-[10px] font-bold text-slate-800 text-center select-text leading-snug">
                            {item.annualTarget || <span className="text-slate-400 italic font-normal">—</span>}
                          </div>
                        </div>
                      </td>

                      {/* Q1 Target - Locked if N/A or q1Locked */}
                      {(() => {
                        const isQ1NA = isCellNA(item.q1Target);
                        const isQ1CellLocked = item.q1Locked || isQ1NA;
                        return (
                          <td className={`p-1 border-r border-slate-205 min-w-[150px] ${isQ1CellLocked ? 'bg-slate-100/60 opacity-80 cursor-not-allowed' : ''}`}>
                            {isQ1NA ? (
                              <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px] text-center">
                                <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                                  <Lock className="w-2.5 h-2.5 text-amber-500" />
                                  <span>Locked</span>
                                </div>
                                <div className="text-[10px] font-bold text-slate-500 font-mono select-none">N/A</div>
                              </div>
                            ) : (
                              <textarea
                                rows={2}
                                value={item.q1Target || ''}
                                onChange={(e) => handleRowChange(item.id, 'q1Target', e.target.value)}
                                disabled={isQ1CellLocked}
                                onInput={(e) => {
                                  e.currentTarget.style.height = 'auto';
                                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                                placeholder="Q1 Target"
                                className="w-full bg-transparent p-1 focus:bg-slate-50 hover:bg-slate-100/50 border-0 outline-none text-center text-slate-700 text-[10px]"
                                style={{ minHeight: '40px', overflow: 'hidden' }}
                              />
                            )}
                          </td>
                        );
                      })()}

                      {/* Q1 Actual & Score - Locked if N/A or q1Locked */}
                      {(() => {
                        const isQ1NA = isCellNA(item.q1Target);
                        const isQ1CellLocked = item.q1Locked || isQ1NA;
                        return (
                          <td className={`p-1 border-r border-slate-205 min-w-[150px] ${isQ1CellLocked ? 'bg-slate-100/80 cursor-not-allowed' : 'bg-slate-50/50'}`}>
                            {isQ1CellLocked ? (
                              <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-1 text-[10px] py-4 select-none">
                                <span className="flex items-center gap-1 font-bold text-slate-500"><Lock className="w-3 h-3 text-amber-500" /> Locked</span>
                                <span className="text-[8px] text-slate-400 font-medium">{isQ1NA ? 'N/A — Not reportable' : 'Not reportable'}</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1 mb-1 justify-center px-1">
                                  <span className="text-[8px] font-bold text-amber-700 uppercase tracking-tight">Score:</span>
                                  <input
                                    type="number" 
                                    min="1" 
                                    max="5" 
                                    step="1"
                                    value={item.q1Score ? (item.q1Score.includes('.') ? String(Math.round(parseFloat(item.q1Score))) : item.q1Score) : ''}
                                    onChange={(e) => {
                                      const raw = e.target.value.replace(/[^0-9]/g, '');
                                      if (raw === '') {
                                        handleRowChange(item.id, 'q1Score', '');
                                      } else {
                                        const num = parseInt(raw, 10);
                                        if (num >= 1 && num <= 5) {
                                          handleRowChange(item.id, 'q1Score', String(num));
                                        } else if (num > 5) {
                                          handleRowChange(item.id, 'q1Score', '5');
                                        } else if (num < 1) {
                                          handleRowChange(item.id, 'q1Score', '1');
                                        }
                                      }
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === '.' || e.key === ',' || e.key === 'e' || e.key === 'E' || e.key === '+' || e.key === '-') {
                                        e.preventDefault();
                                      }
                                    }}
                                    placeholder="1-5"
                                    className="w-10 text-[9px] font-bold text-emerald-700 text-center bg-white border border-slate-200 outline-none rounded"
                                  />
                                </div>
                                <textarea
                                  rows={1}
                                  value={item.q1Actual || ''}
                                  onChange={(e) => handleRowChange(item.id, 'q1Actual', e.target.value)}
                                  onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                  }}
                                  placeholder="1st Qtr Actual..."
                                  className="w-full font-bold bg-transparent p-1 focus:bg-white hover:bg-white border-0 border-b border-dashed border-slate-300 outline-none text-center text-emerald-700 text-[10px] mb-1"
                                  style={{ minHeight: '20px', overflow: 'hidden' }}
                                />
                                {/* Automatic 1st Qtr Variance */}
                                {(() => {
                                  const variance = calculateVariance(item.q1Target, item.q1Actual);
                                  const hasVariance = variance !== '0';
                                  return (
                                    <div className="flex flex-col items-center gap-0.5 mb-1 px-1">
                                      <div className="flex items-center gap-1">
                                        <span className="text-[8px] font-extrabold text-indigo-700 uppercase tracking-tight">Variance:</span>
                                        <span className={`text-[9px] font-black px-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                          {variance}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })()}
                                <textarea
                                  rows={1}
                                  value={item.q1Comment || ''}
                                  onChange={(e) => handleRowChange(item.id, 'q1Comment', e.target.value)}
                                  disabled={calculateVariance(item.q1Target, item.q1Actual) === '0'}
                                  onInput={(e) => {
                                    e.currentTarget.style.height = 'auto';
                                    e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                  }}
                                  placeholder={calculateVariance(item.q1Target, item.q1Actual) === '0' ? "No variance - locked" : "Variance comment..."}
                                  className={`w-full italic bg-transparent p-1 focus:bg-white hover:bg-white border-0 outline-none text-center text-slate-500 text-[9px] ${calculateVariance(item.q1Target, item.q1Actual) === '0' ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  style={{ minHeight: '20px', overflow: 'hidden' }}
                                />
                                {/* Compact 1st Qtr POE */}
                                <CompactPoeUploader
                                  label="1st Qtr POE"
                                  poeDescription={item.q1Poe || item.annualRequiredPoe || item.poe || ''}
                                  files={item.q1PoeDocs || []}
                                  onUpload={(newDocs) => handleRowChange(item.id, 'q1PoeDocs', [...(item.q1PoeDocs || []), ...newDocs])}
                                  onRemove={(docId) => handleRowChange(item.id, 'q1PoeDocs', (item.q1PoeDocs || []).filter(f => f.id !== docId))}
                                  disabled={isQ1CellLocked}
                                />
                              </>
                            )}
                          </td>
                        );
                      })()}

                      {/* 1st Qtr Actual Expense Column */}
                      {(() => {
                        const isQ1NA = isCellNA(item.q1Target);
                        const isQ1CellLocked = item.q1Locked || isQ1NA;
                        return (
                          <td className={`p-1 border-r border-slate-205 min-w-[140px] ${isQ1CellLocked ? 'bg-slate-100/50 cursor-not-allowed opacity-75' : 'bg-emerald-50/20'}`}>
                            {isQ1CellLocked ? (
                              <div className="text-center text-[10px] font-mono text-slate-400 p-1 flex items-center justify-center gap-1">
                                <Lock className="w-2.5 h-2.5 text-amber-500" />
                                <span>{isQ1NA ? 'N/A' : 'Locked'}</span>
                              </div>
                            ) : (
                              <textarea
                                rows={1}
                                value={item.q1ActualExpense || ''}
                                onChange={(e) => handleRowChange(item.id, 'q1ActualExpense', e.target.value)}
                                onInput={(e) => {
                                  e.currentTarget.style.height = 'auto';
                                  e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                                }}
                                placeholder="1st Qtr Expense (R)..."
                                className="w-full font-bold bg-transparent p-1 focus:bg-white hover:bg-white border-0 border-b border-dashed border-emerald-300 outline-none text-center text-emerald-800 text-[10px]"
                                style={{ minHeight: '20px', overflow: 'hidden' }}
                              />
                            )}
                          </td>
                        );
                      })()}

                      {/* Q1 Variance Column */}
                      <td className="p-1 border-r border-slate-205 min-w-[120px] bg-amber-50/15">
                        <div className="flex flex-col items-center justify-center h-full gap-1 p-1">
                          {(() => {
                            const variance = calculateVariance(item.q1Target, item.q1Actual);
                            const hasVariance = variance !== '0';
                            return (
                              <span className={`text-[10px] font-black px-2 py-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'}`}>
                                {variance}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Q1 Corrective Column */}
                      <td className="p-1 border-r border-slate-205 min-w-[180px] bg-amber-50/15">
                        {(() => {
                          const isQ1NA = isCellNA(item.q1Target);
                          const isUnlocked = hasVariance(item.q1Target, item.q1Actual) && !isQ1NA && !item.q1Locked;
                          return (
                            <textarea
                              rows={2}
                              value={item.q1Corrective || ''}
                              onChange={(e) => handleRowChange(item.id, 'q1Corrective', e.target.value)}
                              disabled={!isUnlocked}
                              onInput={(e) => {
                                e.currentTarget.style.height = 'auto';
                                e.currentTarget.style.height = e.currentTarget.scrollHeight + 'px';
                              }}
                              placeholder={!isUnlocked ? (isQ1NA ? "N/A - locked" : "No variance - locked") : "1st Qtr Corrective Action..."}
                              className={`w-full text-[9.5px] font-medium p-1 border rounded outline-none transition ${
                                isUnlocked 
                                  ? 'border-amber-300 bg-white text-emerald-900 focus:border-emerald-600 shadow-xs' 
                                  : 'border-slate-200/50 text-slate-400 bg-slate-50/60 opacity-60 cursor-not-allowed italic'
                              }`}
                              style={{ minHeight: '35px', overflow: 'hidden' }}
                            />
                          );
                        })()}
                      </td>

                      {/* 2nd Qtr Target - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>Q2 Target (Locked)</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-700 text-center select-text font-mono">
                            {item.q2Target || <span className="text-slate-400 italic font-normal">Locked</span>}
                          </div>
                        </div>
                      </td>

                      {/* 2nd Qtr Actual - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col gap-1 p-1">
                          {item.q2Score ? (
                            <div className="flex items-center gap-1 mb-1 justify-center px-1">
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Score:</span>
                              <span className="w-10 text-[9px] font-bold text-slate-700 text-center bg-white border border-slate-200 outline-none rounded py-0.5 inline-block">
                                {Math.round(Number(item.q2Score))}
                              </span>
                            </div>
                          ) : null}
                          <div className="text-[10px] font-bold text-slate-700 text-center py-0.5">
                            {item.q2Actual || <span className="text-slate-400 font-normal italic">{isCellNA(item.q2Target) ? 'N/A (Locked)' : 'Locked'}</span>}
                          </div>
                          {/* Variance */}
                          {(() => {
                            const variance = calculateVariance(item.q2Target, item.q2Actual);
                            const hasVariance = variance !== '0';
                            return (
                              <div className="flex flex-col items-center gap-0.5 mb-1 px-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tight">Variance:</span>
                                  <span className={`text-[9px] font-black px-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {variance}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          {item.q2Comment && (
                            <div className="text-[9px] text-slate-500 italic text-center truncate">{item.q2Comment}</div>
                          )}
                          {/* Compact 2nd Qtr POE (Locked) */}
                          <CompactPoeUploader
                            label="2nd Qtr POE"
                            poeDescription={item.q2Poe || item.annualRequiredPoe || item.poe || ''}
                            files={item.q2PoeDocs || []}
                            onUpload={() => {}}
                            onRemove={() => {}}
                            disabled={true}
                          />
                        </div>
                      </td>

                      {/* 2nd Qtr Actual Expense Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[140px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={1}
                          value={item.q2ActualExpense || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full font-bold bg-transparent p-1 border-0 outline-none text-center text-slate-600 text-[10px] cursor-not-allowed resize-none"
                          style={{ minHeight: '20px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* Q2 Variance Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[120px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center h-full gap-1 p-1">
                          {(() => {
                            const variance = calculateVariance(item.q2Target, item.q2Actual);
                            const hasVariance = variance !== '0';
                            return (
                              <span className={`text-[10px] font-black px-2 py-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                {variance}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Q2 Corrective Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[180px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={2}
                          value={item.q2Corrective || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full text-[9.5px] font-medium p-1 border border-slate-200/50 text-slate-400 bg-slate-50/60 opacity-80 cursor-not-allowed italic rounded outline-none resize-none"
                          style={{ minHeight: '35px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* Midterm Review - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>Midterm (Locked)</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-700 text-center select-text font-mono">
                            {item.midtermTarget || <span className="text-slate-400 italic font-normal">Locked</span>}
                          </div>
                        </div>
                      </td>

                      {/* Midterm Actual - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col gap-1 p-1">
                          {item.midtermScore ? (
                            <div className="flex items-center gap-1 mb-1 justify-center px-1">
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Score:</span>
                              <span className="w-10 text-[9px] font-bold text-slate-700 text-center bg-white border border-slate-200 outline-none rounded py-0.5 inline-block">
                                {Math.round(Number(item.midtermScore))}
                              </span>
                            </div>
                          ) : null}
                          <div className="text-[10px] font-bold text-slate-700 text-center py-0.5">
                            {item.midtermActual || <span className="text-slate-400 font-normal italic">{isCellNA(item.midtermTarget) ? 'N/A (Locked)' : 'Locked'}</span>}
                          </div>
                          {/* Variance */}
                          {(() => {
                            const variance = calculateVariance(item.midtermTarget, item.midtermActual);
                            const hasVariance = variance !== '0';
                            return (
                              <div className="flex flex-col items-center gap-0.5 mb-1 px-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tight">Variance:</span>
                                  <span className={`text-[9px] font-black px-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {variance}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          {item.midtermComment && (
                            <div className="text-[9px] text-slate-500 italic text-center truncate">{item.midtermComment}</div>
                          )}
                          {/* Compact Midterm POE (Locked) */}
                          <CompactPoeUploader
                            label="Midterm POE"
                            poeDescription={item.midtermPoe || item.annualRequiredPoe || item.poe || ''}
                            files={item.midtermPoeDocs || []}
                            onUpload={() => {}}
                            onRemove={() => {}}
                            disabled={true}
                          />
                        </div>
                      </td>

                      {/* Midterm Actual Expense Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[140px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={1}
                          value={item.midtermActualExpense || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full font-bold bg-transparent p-1 border-0 outline-none text-center text-slate-600 text-[10px] cursor-not-allowed resize-none"
                          style={{ minHeight: '20px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* Midterm Variance Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[120px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center h-full gap-1 p-1">
                          {(() => {
                            const variance = calculateVariance(item.midtermTarget, item.midtermActual);
                            const hasVariance = variance !== '0';
                            return (
                              <span className={`text-[10px] font-black px-2 py-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                {variance}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Midterm Corrective Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[180px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={2}
                          value={item.midtermCorrective || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full text-[9.5px] font-medium p-1 border border-slate-200/50 text-slate-400 bg-slate-50/60 opacity-80 cursor-not-allowed italic rounded outline-none resize-none"
                          style={{ minHeight: '35px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* 3rd Qtr Target - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>Q3 Target (Locked)</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-700 text-center select-text font-mono">
                            {item.q3Target || <span className="text-slate-400 italic font-normal">Locked</span>}
                          </div>
                        </div>
                      </td>

                      {/* 3rd Qtr Actual - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col gap-1 p-1">
                          {item.q3Score ? (
                            <div className="flex items-center gap-1 mb-1 justify-center px-1">
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Score:</span>
                              <span className="w-10 text-[9px] font-bold text-slate-700 text-center bg-white border border-slate-200 outline-none rounded py-0.5 inline-block">
                                {Math.round(Number(item.q3Score))}
                              </span>
                            </div>
                          ) : null}
                          <div className="text-[10px] font-bold text-slate-700 text-center py-0.5">
                            {item.q3Actual || <span className="text-slate-400 font-normal italic">{isCellNA(item.q3Target) ? 'N/A (Locked)' : 'Locked'}</span>}
                          </div>
                          {/* Variance */}
                          {(() => {
                            const variance = calculateVariance(item.q3Target, item.q3Actual);
                            const hasVariance = variance !== '0';
                            return (
                              <div className="flex flex-col items-center gap-0.5 mb-1 px-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tight">Variance:</span>
                                  <span className={`text-[9px] font-black px-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {variance}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          {item.q3Comment && (
                            <div className="text-[9px] text-slate-500 italic text-center truncate">{item.q3Comment}</div>
                          )}
                          {/* Compact 3rd Qtr POE (Locked) */}
                          <CompactPoeUploader
                            label="3rd Qtr POE"
                            poeDescription={item.q3Poe || item.annualRequiredPoe || item.poe || ''}
                            files={item.q3PoeDocs || []}
                            onUpload={() => {}}
                            onRemove={() => {}}
                            disabled={true}
                          />
                        </div>
                      </td>

                      {/* 3rd Qtr Actual Expense Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[140px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={1}
                          value={item.q3ActualExpense || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full font-bold bg-transparent p-1 border-0 outline-none text-center text-slate-600 text-[10px] cursor-not-allowed resize-none"
                          style={{ minHeight: '20px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* Q3 Variance Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[120px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center h-full gap-1 p-1">
                          {(() => {
                            const variance = calculateVariance(item.q3Target, item.q3Actual);
                            const hasVariance = variance !== '0';
                            return (
                              <span className={`text-[10px] font-black px-2 py-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                {variance}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Q3 Corrective Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[180px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={2}
                          value={item.q3Corrective || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full text-[9.5px] font-medium p-1 border border-slate-200/50 text-slate-400 bg-slate-50/60 opacity-80 cursor-not-allowed italic rounded outline-none resize-none"
                          style={{ minHeight: '35px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* 4th Qtr Target - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>Q4 Target (Locked)</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-700 text-center select-text font-mono">
                            {item.q4Target || <span className="text-slate-400 italic font-normal">Locked</span>}
                          </div>
                        </div>
                      </td>

                      {/* 4th Qtr Actual - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col gap-1 p-1">
                          {item.q4Score ? (
                            <div className="flex items-center gap-1 mb-1 justify-center px-1">
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tight">Score:</span>
                              <span className="w-10 text-[9px] font-bold text-slate-700 text-center bg-white border border-slate-200 outline-none rounded py-0.5 inline-block">
                                {Math.round(Number(item.q4Score))}
                              </span>
                            </div>
                          ) : null}
                          <div className="text-[10px] font-bold text-slate-700 text-center py-0.5">
                            {item.q4Actual || <span className="text-slate-400 font-normal italic">{isCellNA(item.q4Target) ? 'N/A (Locked)' : 'Locked'}</span>}
                          </div>
                          {/* Variance */}
                          {(() => {
                            const variance = calculateVariance(item.q4Target, item.q4Actual);
                            const hasVariance = variance !== '0';
                            return (
                              <div className="flex flex-col items-center gap-0.5 mb-1 px-1">
                                <div className="flex items-center gap-1">
                                  <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tight">Variance:</span>
                                  <span className={`text-[9px] font-black px-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                    {variance}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                          {item.q4Comment && (
                            <div className="text-[9px] text-slate-500 italic text-center truncate">{item.q4Comment}</div>
                          )}
                          {/* Compact 4th Qtr POE (Locked) */}
                          <CompactPoeUploader
                            label="4th Qtr POE"
                            poeDescription={item.q4Poe || item.annualRequiredPoe || item.poe || ''}
                            files={item.q4PoeDocs || []}
                            onUpload={() => {}}
                            onRemove={() => {}}
                            disabled={true}
                          />
                        </div>
                      </td>

                      {/* 4th Qtr Actual Expense Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[140px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={1}
                          value={item.q4ActualExpense || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full font-bold bg-transparent p-1 border-0 outline-none text-center text-slate-600 text-[10px] cursor-not-allowed resize-none"
                          style={{ minHeight: '20px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* Q4 Variance Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[120px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center h-full gap-1 p-1">
                          {(() => {
                            const variance = calculateVariance(item.q4Target, item.q4Actual);
                            const hasVariance = variance !== '0';
                            return (
                              <span className={`text-[10px] font-black px-2 py-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                {variance}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Q4 Corrective Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[180px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={2}
                          value={item.q4Corrective || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full text-[9.5px] font-medium p-1 border border-slate-200/50 text-slate-400 bg-slate-50/60 opacity-80 cursor-not-allowed italic rounded outline-none resize-none"
                          style={{ minHeight: '35px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* Annual Actual Total Achieved - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[150px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center p-1 gap-0.5 min-h-[40px]">
                          <div className="flex items-center gap-1 text-[8px] font-bold text-slate-400 uppercase select-none">
                            <Lock className="w-2.5 h-2.5 text-amber-500" />
                            <span>Annual (Locked)</span>
                          </div>
                          <div className="text-[10px] font-bold text-slate-700 text-center select-text font-mono">
                            {item.annualActual || <span className="text-slate-400 italic font-normal">{isCellNA(item.annualTarget) ? 'N/A (Locked)' : 'Locked'}</span>}
                          </div>
                        </div>
                      </td>

                      {/* Annual Actual Exp Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[140px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={1}
                          value={item.annualActualExpense || item.annualActualExp || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full font-bold bg-transparent p-1 border-0 outline-none text-center text-slate-600 text-[10px] cursor-not-allowed resize-none"
                          style={{ minHeight: '20px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* Annual Variance Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[120px] bg-slate-100/50 cursor-not-allowed">
                        <div className="flex flex-col items-center justify-center h-full gap-1 p-1">
                          {(() => {
                            const variance = calculateVariance(item.annualTarget, item.annualActual);
                            const hasVariance = variance !== '0';
                            return (
                              <span className={`text-[10px] font-black px-2 py-1 rounded ${hasVariance ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600'}`}>
                                {variance}
                              </span>
                            );
                          })()}
                        </div>
                      </td>

                      {/* Annual Corrective Column - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[180px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={2}
                          value={item.annualCorrective || ''}
                          readOnly
                          disabled
                          placeholder="Locked"
                          className="w-full text-[9.5px] font-medium p-1 border border-slate-200/50 text-slate-400 bg-slate-50/60 opacity-80 cursor-not-allowed italic rounded outline-none resize-none"
                          style={{ minHeight: '35px', overflow: 'hidden' }}
                        />
                      </td>

                      {/* Portfolio of Evidence - Locked */}
                      <td className="p-1.5 border-r border-slate-205 min-w-[200px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={2}
                          value={item.annualRequiredPoe || item.poe || ''}
                          readOnly
                          disabled
                          placeholder="Evidence guidelines (Locked)"
                          className="w-full bg-transparent p-1 shadow-none outline-none border border-transparent rounded text-[10px] font-medium text-slate-600 mb-1.5 cursor-not-allowed resize-none"
                          style={{ minHeight: '35px', overflow: 'hidden' }}
                        />

                        {/* File view / download interface (Locked upload) */}
                        <div className="flex flex-col gap-1 items-start bg-white/70 p-1.5 rounded-lg border border-slate-200">
                          {item.poeFileBase64 ? (
                            <div className="flex items-center gap-1.5 justify-between w-full">
                              <button
                                type="button"
                                onClick={() => {
                                  try {
                                    const link = document.createElement('a');
                                    link.href = item.poeFileBase64!;
                                    link.download = item.poeFileName || 'poe_evidence_document';
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                  } catch (err) {
                                    console.error("Download failed:", err);
                                  }
                                }}
                                className="flex items-center gap-1 font-mono text-[9px] font-bold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100/80 px-2 py-1 rounded border border-blue-200 cursor-pointer text-left truncate w-full"
                                title={`Click to download: ${item.poeFileName || 'evidence file'}`}
                              >
                                <Paperclip className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate">{item.poeFileName || 'POE File'}</span>
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-1 w-full text-[9px] font-bold text-slate-400 py-1 bg-slate-100 border border-slate-200 rounded cursor-not-allowed select-none">
                              <Lock className="w-2.5 h-2.5 text-amber-500 shrink-0" />
                              <span>Upload Locked</span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Weighting */}
                      <td className="p-1 border-r border-slate-205 text-center font-bold">
                        <input
                          type="text"
                          value={item.weighting || ''}
                          onChange={(e) => handleRowChange(item.id, 'weighting', e.target.value)}
                          placeholder="30"
                          className="w-full bg-transparent p-1 focus:bg-slate-50 border-0 outline-none text-center font-mono font-bold"
                        />
                      </td>

                      {/* RESTRICTED INTERNAL VIEWS (Only shown when satisfies canViewRestricted) */}
                      {isRestrictedVisible && (
                        /* Evaluation */
                        <td className="p-1 border-r border-slate-205 bg-amber-50/20 min-w-[200px]">
                          <div className="flex flex-col gap-1.5 p-1">
                            <div className="flex items-center gap-1.5" title="Scores can only be set from the Self-Evaluation module">
                              <span className="text-[9px] text-amber-800 font-bold bg-amber-100/80 px-1.5 py-0.5 rounded uppercase">Score (1-5)</span>
                              <input
                                type="number"
                                min="1"
                                max="5"
                                step="1"
                                disabled={true}
                                value={item.myScore || ''}
                                onChange={(e) => handleRowChange(item.id, 'myScore', e.target.value)}
                                className="w-16 bg-slate-150/50 text-center font-bold text-xs p-1 border border-amber-200 rounded text-slate-500 cursor-not-allowed outline-none font-mono"
                              />
                            </div>
                            <textarea
                              rows={2}
                              value={item.evaluation || ''}
                              onChange={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = `${e.target.scrollHeight}px`;
                                handleRowChange(item.id, 'evaluation', e.target.value);
                              }}
                              placeholder="Self review comment..."
                              className="w-full bg-transparent p-1.5 shadow-none focus:bg-white hover:bg-white border border-dashed border-amber-100 rounded text-[10px] font-medium text-amber-950 leading-tight outline-none"
                              style={{ minHeight: '40px' }}
                            />
                          </div>
                        </td>
                      )}

                      {/* Review - Locked */}
                      <td className="p-1 border-r border-slate-205 min-w-[220px] bg-slate-100/50 cursor-not-allowed">
                        <textarea
                          rows={2}
                          disabled={true}
                          readOnly={true}
                          value={item.review || ''}
                          placeholder="Review locked"
                          className="w-full bg-transparent p-1 shadow-none outline-none border-0 rounded text-[10px] text-slate-500 font-medium cursor-not-allowed resize-none"
                          style={{ minHeight: '60px' }}
                        />
                      </td>

                      {/* Row Delete Button */}
                      <td className="p-1.5 text-center bg-white border-l border-slate-200">
                        <button
                          type="button"
                          onClick={() => deleteRow(item.id)}
                          className="p-1.5 hover:bg-red-50 hover:text-red-600 border border-transparent rounded text-gray-400 hover:border-red-200 transition cursor-pointer"
                          title="Delete metric track"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Quick summary and statistics */}
          <div className="p-4 bg-slate-900 border-t border-slate-950 text-[10px] text-slate-400 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 select-none">
            <div className="flex flex-wrap gap-4 items-center justify-center font-mono">
              <span>Total Planned Targets: <b className="text-white bg-slate-800 px-2 py-0.5 rounded">{items.length} KPIs</b></span>
              <span>Cumulative Weighting: <b className="text-white bg-slate-800 px-2 py-0.5 rounded">
                {items.reduce((sum, item) => sum + Number(item.weighting || 0), 0)}%
              </b></span>
            </div>
            
            <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[9px]">
              <span>Last sync status: Cloud Supabase Storage</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>

        </div>

        {/* Dynamic empty signature blocks for the Performance Plan document page */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 mt-4 shadow-sm space-y-4">
          {/* Proper forest green boxed signature block */}
          <div className="border border-emerald-800/30 rounded-2xl p-5 bg-emerald-50/5 space-y-4">
            <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-800 block border-b border-emerald-800/10 pb-2 flex items-center gap-1.5 font-sans justify-center">
              📜 Performance Plan Page Signatures (Formal Sign-off Box)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 border border-emerald-200 rounded-xl space-y-3 shadow-sm">
                <span className="text-[9px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100">Officer / Employee Representative</span>
                <p className="text-xs text-slate-700"><b>Name:</b> {metadata.name || currentUser.fullName || currentUser.email || 'Representative'}</p>
                <p className="text-xs text-slate-700"><b>Designation:</b> {metadata.position || currentUser.jobFunction || 'Officer Representative'}</p>
                <div className="pt-2">
                  <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-16 rounded-lg flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic relative overflow-hidden">
                    {empSignature ? (
                      <img src={empSignature} alt="Employee Signature" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      "[ Signature Area ]"
                    )}
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <label className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Date:</label>
                  <input 
                    type="date" 
                    value={metadata.dateSignedEmployee || ''}
                    onChange={(e) => handleMetadataChange('dateSignedEmployee', e.target.value)}
                    className="text-xs p-1 border border-slate-300 rounded focus:border-emerald-500 outline-none w-full"
                  />
                </div>
              </div>

              <div className="bg-white p-4 border border-emerald-200 rounded-xl space-y-3 shadow-sm">
                <span className="text-[9px] uppercase font-black text-emerald-800 block pb-1 border-b border-emerald-100">Supervisor / Manager Approval</span>
                <p className="text-xs text-slate-700"><b>Name:</b> {metadata.manager || 'Designated Supervisor'}</p>
                <p className="text-xs text-slate-700"><b>Designation:</b> Line Manager / Representative</p>
                <div className="pt-2">
                  <div className="border-2 border-dashed border-emerald-800/15 bg-slate-50 h-16 rounded-lg flex items-center justify-center text-[10px] text-emerald-700/40 font-mono italic relative overflow-hidden">
                    {mgrSignature ? (
                      <img src={mgrSignature} alt="Manager Signature" className="max-h-full object-contain" referrerPolicy="no-referrer" />
                    ) : (
                      "[ Signature Area ]"
                    )}
                  </div>
                </div>
                <div className="pt-1 flex items-center gap-2">
                  <label className="text-[10px] text-slate-600 font-medium whitespace-nowrap">Date:</label>
                  <input 
                    type="date" 
                    value={metadata.dateSignedManager || ''}
                    onChange={(e) => handleMetadataChange('dateSignedManager', e.target.value)}
                    className="text-xs p-1 border border-slate-300 rounded focus:border-emerald-500 outline-none w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Statutory Regulation Legal Disclaimer */}
      <div id="pa-legal-footer" className="p-3.5 bg-slate-200 border-t border-slate-300 text-[9px] text-slate-500 flex flex-col md:flex-row justify-between items-center gap-2 shrink-0 select-text">
        <span className="flex items-center gap-1.5 font-semibold">
          <ShieldCheck className="w-4 h-4 text-green-600 shrink-0" />
          LGSETA Statutory Audit Template: Formulates employee annual KPI criteria under the Municipal Systems Act.
        </span>
        <b className="uppercase text-slate-600 font-black font-mono">Mzansi Performance Hub</b>
      </div>
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden border border-slate-200">
            <div className="bg-rose-50 border-b border-rose-100 p-4 flex items-center gap-3">
              <div className="bg-rose-100 text-rose-600 p-2 rounded-full">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-rose-900 text-sm">Clear Grid Confirm</h3>
                <p className="text-rose-700 text-[11px] leading-tight mt-0.5">This action cannot be undone.</p>
              </div>
            </div>
            <div className="p-4 bg-slate-50 text-xs text-slate-700 leading-relaxed font-medium">
              Are you sure you want to clear the entire performance plan grid? This action will immediately remove all current KPIs and targets and save an empty state.
            </div>
            <div className="p-3 border-t border-slate-100 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmClearGrid}
                className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Yes, clear everything
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
