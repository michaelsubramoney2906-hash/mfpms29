import React, { useState, useEffect, useMemo } from 'react';
import { 
  Layers, Search, Plus, Trash2, Download, Save, RefreshCw, AlertTriangle, 
  CheckCircle, FileText, Info, Upload, Check, Cloud, Star, MapPin, Building, X, Eye, 
  AlertCircle, CheckCircle2, ShieldCheck, Maximize2, Minimize2, Paperclip, Filter, User as UserIcon
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { cn } from '../Branding';
import { OfficeDocumentViewer } from '../IPMS/OfficeDocumentViewer';

export interface PoeDocument {
  id: string;
  name: string;
  mimeType: string;
  size?: number;
  dataUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SDBIP23Row {
  id: string;
  refNum: string;
  strategicObj: string;
  bsd: string;
  led: string;
  mfvm: string;
  ggpp: string;
  midt: string;
  sr: string;
  kpa: string;
  kpas?: string; // Compatibility alias
  mscoaCode?: string;
  mscoaTracking?: string;
  baseline: string;
  budgetAllocation: string;
  budget?: string;
  
  // Performance Plan Columns
  kpi: string;
  operationalActivity?: string;
  compliance?: string;
  uom?: string;
  
  // Municipal Financial Year (1 July - 30 June)
  annualTarget: string;
  q1Target: string;
  q1Actual?: string;
  q1ActualExpense?: string;
  q1Score?: string;
  q1Comment?: string;
  q1Corrective?: string;
  q1?: string; // Compatibility alias
  
  q2Target: string;
  q2Actual?: string;
  q2ActualExpense?: string;
  q2Score?: string;
  q2Comment?: string;
  q2Corrective?: string;
  q2?: string;
  
  midtermTarget?: string;
  midtermActual?: string;
  midtermActualExpense?: string;
  midtermScore?: string;
  midtermComment?: string;
  midtermCorrective?: string;
  
  q3Target: string;
  q3Actual?: string;
  q3ActualExpense?: string;
  q3Score?: string;
  q3Comment?: string;
  q3Corrective?: string;
  q3?: string;
  
  q4Target: string;
  q4Actual?: string;
  q4ActualExpense?: string;
  q4Score?: string;
  q4Comment?: string;
  q4Corrective?: string;
  q4?: string;
  
  // Annual Summary Metrics
  annualActual?: string;
  annualActualExpense?: string;
  annualActualExp?: string;
  annualVariance?: string;
  annualCorrective?: string;
  
  // POE
  poe: string;
  poeDocs?: PoeDocument[];
  poeFileBase64?: string;
  poeFileName?: string;
  poeStatus?: string;
  
  q1PoeDocs?: PoeDocument[];
  q2PoeDocs?: PoeDocument[];
  midtermPoeDocs?: PoeDocument[];
  q3PoeDocs?: PoeDocument[];
  q4PoeDocs?: PoeDocument[];
  
  weight: string;
  weighting?: string;
  myScore?: string;
  evaluation?: string;
  review?: string;
  
  responsibleUnit: string;
  evaluationUser: string;
  reviewManager: string;
  userName?: string;
}

interface SDBIP23Props {
  currentUser: {
    email: string;
    role?: string;
    fullName?: string;
    jobFunction?: string;
    department?: string;
    manager?: string;
  };
  activeTenantId: string;
  onClose?: () => void;
}

export const calculateVariance = (target?: string, actual?: string): string => {
  if (!target || !actual) return '0';
  const cleanNum = (val: string) => {
    const standardFormat = val.replace(/,/g, '').replace(/\s/g, '');
    const match = standardFormat.match(/-?\d+(\.\d+)?/);
    if (match) {
      const parsed = parseFloat(match[0]);
      return isNaN(parsed) ? null : parsed;
    }
    return null;
  };
  const tNum = cleanNum(target);
  const aNum = cleanNum(actual);
  if (tNum !== null && aNum !== null) {
    const diff = tNum - aNum;
    return Number(diff.toFixed(2)).toString();
  }
  return '0';
};

interface CompactPoeUploaderProps {
  label: string;
  files: PoeDocument[];
  onUpload: (newDocs: PoeDocument[]) => void;
  onRemove: (id: string) => void;
  disabled?: boolean;
}

export function CompactPoeUploader({
  label,
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
        <span className="text-[8px] font-extrabold text-slate-500 uppercase tracking-tight">{label}:</span>
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
      {files && files.length > 0 ? (
        <div className="flex flex-col gap-1 max-h-[60px] overflow-y-auto">
          {files.map((file) => (
            <div key={file.id} className="flex items-center justify-between gap-1 bg-slate-50 border border-slate-200 rounded px-1 py-0.5 text-[8px]">
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
                  className="text-red-500 hover:text-red-700 font-bold shrink-0 cursor-pointer"
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

export function SDBIP23({ currentUser, activeTenantId, onClose }: SDBIP23Props) {
  const [rows, setRows] = useState<SDBIP23Row[]>([]);
  const [userList, setUserList] = useState<any[]>([]);
  const [availableKpas, setAvailableKpas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedKpaFilter, setSelectedKpaFilter] = useState<string>('ALL');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);
  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);

  // Dynamic Options lists for Strategic Objectives and mSCOA Codes
  const uniqueStrategicObjectives = useMemo(() => Array.from(new Set([
    ...STRATEGIC_OBJECTIVES,
    ...availableKpas.map(k => k.parentObjective).filter(Boolean),
    ...rows.map(r => r.strategicObj).filter(Boolean)
  ])), [availableKpas, rows]);

  const uniqueMscoaCodes = useMemo(() => Array.from(new Set([
    ...MSCOA_CODES,
    ...availableKpas.map(k => k.mscoaCode).filter(Boolean),
    ...rows.map(r => r.mscoaCode).filter(Boolean)
  ])), [availableKpas, rows]);

  const uniqueFunctionalKpas = useMemo(() => {
    const set = new Set<string>();
    availableKpas.forEach(k => {
      if (k.name) set.add(k.name);
      if (k.kpaName) set.add(k.kpaName);
    });
    rows.forEach(r => {
      if (r.kpa) set.add(r.kpa);
      if (r.kpas) set.add(r.kpas);
    });
    return Array.from(set).filter(Boolean);
  }, [availableKpas, rows]);

  const uniqueDepartments = useMemo(() => {
    const set = new Set<string>();
    userList.forEach(u => {
      if (u.department) set.add(u.department);
    });
    rows.forEach(r => {
      if (r.responsibleUnit) set.add(r.responsibleUnit);
    });
    return Array.from(set).filter(Boolean);
  }, [userList, rows]);

  // Load available Functional Area KPAs for this tenant
  const loadKpas = async () => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/kpas?t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.kpas)) {
          setAvailableKpas(data.kpas);
        }
      }
    } catch (e) {
      console.warn("Could not fetch tenant functional area KPAs:", e);
    }
  };

  // Helper to save rows directly to Supabase
  const saveRowsToDatabase = async (nextList: SDBIP23Row[]) => {
    try {
      setIsSaving(true);
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip23`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: nextList })
      });
      if (!res.ok) {
        throw new Error(`Server responded with status: ${res.status}`);
      }
      setSuccessToast("SDBIP 2nd & 3rd layer registers saved to Supabase cloud storage!");
      setTimeout(() => setSuccessToast(null), 3000);
    } catch (err: any) {
      console.error("Save SDBIP error:", err);
      alert(`Error saving SDBIP table: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Comprehensive synchronization of everyone's KPIs & KPAs
  const syncEveryoneKpisAndKpas = async (silent: boolean = false, currentRows?: SDBIP23Row[]) => {
    try {
      if (!silent) setIsSyncing(true);
      
      // 1. Fetch all users in the tenant
      const uRes = await fetch(`/api/tenant/${activeTenantId}/users?t=${Date.now()}`);
      let usersData: any[] = [];
      if (uRes.ok) {
        usersData = await uRes.json();
        setUserList(usersData);
      }

      // 2. Fetch all functional area KPAs
      await loadKpas();

      // 3. Fetch all team performance plans
      const pplansRes = await fetch(`/api/tenant/${activeTenantId}/team-pplans?t=${Date.now()}`);
      let teamPlans: any[] = [];
      if (pplansRes.ok) {
        const teamPlansJson = await pplansRes.json();
        if (teamPlansJson && Array.isArray(teamPlansJson.teamPlans)) {
          teamPlans = teamPlansJson.teamPlans;
        }
      }

      // 4. Fetch each user's captured KPIs (individual profiles) in parallel
      const kpisPromises = usersData.map(async (user: any) => {
        try {
          const kRes = await fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(user.email)}&t=${Date.now()}`);
          if (kRes.ok) {
            const kJson = await kRes.json();
            return { email: user.email, kpis: Array.isArray(kJson.kpis) ? kJson.kpis : [] };
          }
        } catch(e) {
          console.warn(`Failed to fetch individual KPIs for ${user.email}:`, e);
        }
        return { email: user.email, kpis: [] };
      });
      const allUserKpis = await Promise.all(kpisPromises);

      // 5. Merge everything!
      const targetBaseRows = currentRows || rows;
      const mergedRows: SDBIP23Row[] = [...targetBaseRows];

      // Helper to add or update a row in mergedRows
      const upsertSdbipRow = (kpi: any, userEmail: string, source: string) => {
        const kNo = (kpi.kpiNo || kpi.refNum || kpi.id || '').trim();
        if (!kNo) return;

        // Match on refNum and evaluationUser to avoid accidental cross-user collision
        const matchIdx = mergedRows.findIndex(
          r => r.refNum && r.refNum.toLowerCase().trim() === kNo.toLowerCase().trim() &&
               (r.evaluationUser.toLowerCase().trim() === userEmail.toLowerCase().trim() || !r.evaluationUser)
        );

        const matchedProfile = usersData.find((u: any) => u.email?.toLowerCase() === userEmail?.toLowerCase());
        const userDept = matchedProfile?.department || matchedProfile?.jobFunction || '';
        const userManager = matchedProfile?.manager || 'Line Manager';
        const userFullName = matchedProfile?.fullName || userEmail;

        const resolvedKpa = (kpi.kpa || kpi.kpas || (matchIdx >= 0 ? mergedRows[matchIdx].kpa : '') || 'General Functional Area KPA').trim();

        const newRow: SDBIP23Row = {
          id: matchIdx >= 0 ? mergedRows[matchIdx].id : `sdbip23_${Date.now()}_${Math.floor(Math.random() * 1000000)}`,
          refNum: kNo,
          strategicObj: kpi.strategicGoal || kpi.strategicObj || (matchIdx >= 0 ? mergedRows[matchIdx].strategicObj : 'Strategic Core Priority'),
          bsd: kpi.bsd === true || kpi.bsd === 'Y' ? 'Y' : 'N',
          led: kpi.led === true || kpi.led === 'Y' ? 'Y' : 'N',
          mfvm: kpi.mfvm === true || kpi.mfvm === 'Y' ? 'Y' : 'N',
          ggpp: kpi.ggpp === true || kpi.ggpp === 'Y' ? 'Y' : 'N',
          midt: kpi.midt === true || kpi.midt === 'Y' ? 'Y' : 'N',
          sr: kpi.sr === true || kpi.sr === 'Y' ? 'Y' : 'N',
          kpa: resolvedKpa,
          kpas: resolvedKpa,
          mscoaCode: kpi.mscoaCode || kpi.mscoaTracking || (matchIdx >= 0 ? mergedRows[matchIdx].mscoaCode : ''),
          mscoaTracking: kpi.mscoaCode || kpi.mscoaTracking || (matchIdx >= 0 ? mergedRows[matchIdx].mscoaTracking : ''),
          baseline: kpi.baseline || (matchIdx >= 0 ? mergedRows[matchIdx].baseline : ''),
          budgetAllocation: kpi.budget || kpi.budgetAllocation || (matchIdx >= 0 ? mergedRows[matchIdx].budgetAllocation : ''),
          budget: kpi.budget || kpi.budgetAllocation || (matchIdx >= 0 ? mergedRows[matchIdx].budget : ''),
          
          kpi: kpi.kpi || kpi.description || (matchIdx >= 0 ? mergedRows[matchIdx].kpi : ''),
          operationalActivity: kpi.operationalActivity || (matchIdx >= 0 ? mergedRows[matchIdx].operationalActivity : `Aligned from ${source}`),
          compliance: kpi.compliance || 'compliant',
          uom: kpi.uom || (matchIdx >= 0 ? mergedRows[matchIdx].uom : ''),
          
          annualTarget: kpi.annualTarget || (matchIdx >= 0 ? mergedRows[matchIdx].annualTarget : ''),
          q1Target: kpi.q1Target || kpi.q1 || (matchIdx >= 0 ? mergedRows[matchIdx].q1Target : ''),
          q1Actual: kpi.q1Actual || (matchIdx >= 0 ? mergedRows[matchIdx].q1Actual : ''),
          q1ActualExpense: kpi.q1ActualExpense || (matchIdx >= 0 ? mergedRows[matchIdx].q1ActualExpense : ''),
          q1Score: kpi.q1Score || (matchIdx >= 0 ? mergedRows[matchIdx].q1Score : ''),
          q1Comment: kpi.q1Comment || (matchIdx >= 0 ? mergedRows[matchIdx].q1Comment : ''),
          q1Corrective: kpi.q1Corrective || (matchIdx >= 0 ? mergedRows[matchIdx].q1Corrective : ''),
          q1: kpi.q1Target || kpi.q1 || (matchIdx >= 0 ? mergedRows[matchIdx].q1 : ''),
          
          q2Target: kpi.q2Target || kpi.q2 || (matchIdx >= 0 ? mergedRows[matchIdx].q2Target : ''),
          q2Actual: kpi.q2Actual || (matchIdx >= 0 ? mergedRows[matchIdx].q2Actual : ''),
          q2ActualExpense: kpi.q2ActualExpense || (matchIdx >= 0 ? mergedRows[matchIdx].q2ActualExpense : ''),
          q2Score: kpi.q2Score || (matchIdx >= 0 ? mergedRows[matchIdx].q2Score : ''),
          q2Comment: kpi.q2Comment || (matchIdx >= 0 ? mergedRows[matchIdx].q2Comment : ''),
          q2Corrective: kpi.q2Corrective || (matchIdx >= 0 ? mergedRows[matchIdx].q2Corrective : ''),
          q2: kpi.q2Target || kpi.q2 || (matchIdx >= 0 ? mergedRows[matchIdx].q2 : ''),
          
          midtermTarget: kpi.midtermTarget || (matchIdx >= 0 ? mergedRows[matchIdx].midtermTarget : ''),
          midtermActual: kpi.midtermActual || (matchIdx >= 0 ? mergedRows[matchIdx].midtermActual : ''),
          midtermActualExpense: kpi.midtermActualExpense || (matchIdx >= 0 ? mergedRows[matchIdx].midtermActualExpense : ''),
          midtermScore: kpi.midtermScore || (matchIdx >= 0 ? mergedRows[matchIdx].midtermScore : ''),
          midtermComment: kpi.midtermComment || (matchIdx >= 0 ? mergedRows[matchIdx].midtermComment : ''),
          midtermCorrective: kpi.midtermCorrective || (matchIdx >= 0 ? mergedRows[matchIdx].midtermCorrective : ''),
          
          q3Target: kpi.q3Target || kpi.q3 || (matchIdx >= 0 ? mergedRows[matchIdx].q3Target : ''),
          q3Actual: kpi.q3Actual || (matchIdx >= 0 ? mergedRows[matchIdx].q3Actual : ''),
          q3ActualExpense: kpi.q3ActualExpense || (matchIdx >= 0 ? mergedRows[matchIdx].q3ActualExpense : ''),
          q3Score: kpi.q3Score || (matchIdx >= 0 ? mergedRows[matchIdx].q3Score : ''),
          q3Comment: kpi.q3Comment || (matchIdx >= 0 ? mergedRows[matchIdx].q3Comment : ''),
          q3Corrective: kpi.q3Corrective || (matchIdx >= 0 ? mergedRows[matchIdx].q3Corrective : ''),
          q3: kpi.q3Target || kpi.q3 || (matchIdx >= 0 ? mergedRows[matchIdx].q3 : ''),
          
          q4Target: kpi.q4Target || kpi.q4 || (matchIdx >= 0 ? mergedRows[matchIdx].q4Target : ''),
          q4Actual: kpi.q4Actual || (matchIdx >= 0 ? mergedRows[matchIdx].q4Actual : ''),
          q4ActualExpense: kpi.q4ActualExpense || (matchIdx >= 0 ? mergedRows[matchIdx].q4ActualExpense : ''),
          q4Score: kpi.q4Score || (matchIdx >= 0 ? mergedRows[matchIdx].q4Score : ''),
          q4Comment: kpi.q4Comment || (matchIdx >= 0 ? mergedRows[matchIdx].q4Comment : ''),
          q4Corrective: kpi.q4Corrective || (matchIdx >= 0 ? mergedRows[matchIdx].q4Corrective : ''),
          q4: kpi.q4Target || kpi.q4 || (matchIdx >= 0 ? mergedRows[matchIdx].q4 : ''),
          
          annualActual: kpi.annualActual || (matchIdx >= 0 ? mergedRows[matchIdx].annualActual : ''),
          annualActualExpense: kpi.annualActualExpense || kpi.annualActualExp || (matchIdx >= 0 ? mergedRows[matchIdx].annualActualExpense : ''),
          annualActualExp: kpi.annualActualExpense || kpi.annualActualExp || (matchIdx >= 0 ? mergedRows[matchIdx].annualActualExp : ''),
          annualVariance: kpi.annualVariance || (matchIdx >= 0 ? mergedRows[matchIdx].annualVariance : ''),
          annualCorrective: kpi.annualCorrective || (matchIdx >= 0 ? mergedRows[matchIdx].annualCorrective : ''),
          
          poe: kpi.poe || kpi.annualRequiredPoe || (matchIdx >= 0 ? mergedRows[matchIdx].poe : ''),
          poeDocs: kpi.poeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].poeDocs : []),
          poeFileBase64: kpi.poeFileBase64 || (matchIdx >= 0 ? mergedRows[matchIdx].poeFileBase64 : undefined),
          poeFileName: kpi.poeFileName || (matchIdx >= 0 ? mergedRows[matchIdx].poeFileName : undefined),
          poeStatus: 'In Cloud Storage',
          
          q1PoeDocs: kpi.q1PoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].q1PoeDocs : []),
          q2PoeDocs: kpi.q2PoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].q2PoeDocs : []),
          midtermPoeDocs: kpi.midtermPoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].midtermPoeDocs : []),
          q3PoeDocs: kpi.q3PoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].q3PoeDocs : []),
          q4PoeDocs: kpi.q4PoeDocs || (matchIdx >= 0 ? mergedRows[matchIdx].q4PoeDocs : []),
          
          weight: kpi.weighting || kpi.weight || (matchIdx >= 0 ? mergedRows[matchIdx].weight : '10'),
          weighting: kpi.weighting || kpi.weight || (matchIdx >= 0 ? mergedRows[matchIdx].weighting : '10'),
          myScore: kpi.myScore || (matchIdx >= 0 ? mergedRows[matchIdx].myScore : ''),
          evaluation: kpi.evaluation || (matchIdx >= 0 ? mergedRows[matchIdx].evaluation : ''),
          review: kpi.review || (matchIdx >= 0 ? mergedRows[matchIdx].review : ''),
          
          responsibleUnit: userDept || (matchIdx >= 0 ? mergedRows[matchIdx].responsibleUnit : ''),
          evaluationUser: userEmail,
          reviewManager: userManager,
          userName: userFullName
        };

        if (matchIdx >= 0) {
          mergedRows[matchIdx] = { ...mergedRows[matchIdx], ...newRow };
        } else {
          mergedRows.push(newRow);
        }
      };

      // Merge from Performance Plans (pplan)
      teamPlans.forEach((tp: any) => {
        if (tp.plan && Array.isArray(tp.plan.items)) {
          tp.plan.items.forEach((item: any) => {
            upsertSdbipRow(item, tp.userId, `${tp.userId}'s Performance Plan`);
          });
        }
      });

      // Merge from individual user KPIs
      allUserKpis.forEach((uk: any) => {
        if (Array.isArray(uk.kpis)) {
          uk.kpis.forEach((kpi: any) => {
            upsertSdbipRow(kpi, uk.email, `${uk.email}'s Individual KPIs`);
          });
        }
      });

      setRows(mergedRows);
      await saveRowsToDatabase(mergedRows);
      
      if (!silent) {
        setSuccessToast("Successfully synchronized everyone's KPIs & Functional Area KPAs into SDBIP 2nd & 3rd layer table!");
        setTimeout(() => setSuccessToast(null), 4000);
      }
      return mergedRows;
    } catch(err: any) {
      console.error("Sync everyone's KPIs/KPAs error:", err);
      if (!silent) {
        alert(`Error synchronizing KPI & KPA data: ${err.message}`);
      }
      return currentRows || rows;
    } finally {
      if (!silent) setIsSyncing(false);
    }
  };

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      try {
        await loadKpas();
        
        // Fetch existing SDBIP rows
        const res = await fetch(`/api/tenant/${activeTenantId}/sdbip23?t=${Date.now()}`);
        let loadedItems: SDBIP23Row[] = [];
        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.items)) {
            loadedItems = data.items;
          }
        }

        // Fetch users
        const uRes = await fetch(`/api/tenant/${activeTenantId}/users?t=${Date.now()}`);
        if (uRes.ok) {
          const uData = await uRes.json();
          setUserList(uData);
        }

        if (loadedItems.length === 0) {
          // If empty, auto-sync from everyone's performance plans and individual KPIs
          await syncEveryoneKpisAndKpas(true, []);
        } else {
          setRows(loadedItems);
        }
      } catch (e) {
        console.error("Failed to initialize SDBIP23:", e);
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, [activeTenantId]);

  // Update a single field in row state
  const updateRowField = (rowId: string, field: keyof SDBIP23Row, value: any) => {
    setRows(prev => prev.map(row => {
      if (row.id !== rowId) return row;
      const updated = { ...row, [field]: value };
      
      // Keep aliases in sync
      if (field === 'kpa') updated.kpas = value;
      if (field === 'kpas') updated.kpa = value;
      if (field === 'mscoaCode') updated.mscoaTracking = value;
      if (field === 'mscoaTracking') updated.mscoaCode = value;
      if (field === 'weight') updated.weighting = value;
      if (field === 'weighting') updated.weight = value;
      if (field === 'budgetAllocation') updated.budget = value;
      if (field === 'budget') updated.budgetAllocation = value;
      if (field === 'q1Target') updated.q1 = value;
      if (field === 'q1') updated.q1Target = value;
      if (field === 'q2Target') updated.q2 = value;
      if (field === 'q2') updated.q2Target = value;
      if (field === 'q3Target') updated.q3 = value;
      if (field === 'q3') updated.q3Target = value;
      if (field === 'q4Target') updated.q4 = value;
      if (field === 'q4') updated.q4Target = value;
      
      return updated;
    }));
  };

  // Add new row to SDBIP table
  const handleAddNewRow = () => {
    const newId = `sdbip23_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
    const newRow: SDBIP23Row = {
      id: newId,
      refNum: `S23-${Date.now().toString().slice(-4)}`,
      strategicObj: uniqueStrategicObjectives[0] || 'To ensure reliable bulk water and electricity infrastructure',
      bsd: 'Y',
      led: 'N',
      mfvm: 'N',
      ggpp: 'N',
      midt: 'N',
      sr: 'N',
      kpa: uniqueFunctionalKpas[0] || 'Infrastructure and Technical Services',
      kpas: uniqueFunctionalKpas[0] || 'Infrastructure and Technical Services',
      mscoaCode: uniqueMscoaCodes[0] || 'Funding',
      mscoaTracking: uniqueMscoaCodes[0] || 'Funding',
      baseline: '0',
      budgetAllocation: 'R 0.00',
      budget: 'R 0.00',
      kpi: 'New Performance Indicator Description',
      operationalActivity: 'Operational execution directive',
      compliance: 'compliant',
      uom: 'Number of quarterly milestones completed',
      annualTarget: '100%',
      q1Target: '25%',
      q1Actual: '',
      q1ActualExpense: '',
      q1Score: '3',
      q1Comment: '',
      q1Corrective: '',
      q1: '25%',
      q2Target: '50%',
      q2Actual: '',
      q2ActualExpense: '',
      q2Score: '3',
      q2Comment: '',
      q2Corrective: '',
      q2: '50%',
      midtermTarget: '50%',
      midtermActual: '',
      midtermActualExpense: '',
      midtermScore: '3',
      midtermComment: '',
      midtermCorrective: '',
      q3Target: '75%',
      q3Actual: '',
      q3ActualExpense: '',
      q3Score: '3',
      q3Comment: '',
      q3Corrective: '',
      q3: '75%',
      q4Target: '100%',
      q4Actual: '',
      q4ActualExpense: '',
      q4Score: '3',
      q4Comment: '',
      q4Corrective: '',
      q4: '100%',
      annualActual: '',
      annualActualExpense: '',
      annualActualExp: '',
      annualVariance: '',
      annualCorrective: '',
      poe: 'Quarterly verified inspection sign-offs and invoices',
      poeDocs: [],
      poeStatus: 'In Cloud Storage',
      q1PoeDocs: [],
      q2PoeDocs: [],
      midtermPoeDocs: [],
      q3PoeDocs: [],
      q4PoeDocs: [],
      weight: '15',
      weighting: '15',
      myScore: '3',
      evaluation: '',
      review: '',
      responsibleUnit: currentUser.department || 'Administration',
      evaluationUser: currentUser.email,
      reviewManager: currentUser.manager || 'Line Manager',
      userName: currentUser.fullName || currentUser.email
    };

    const nextList = [newRow, ...rows];
    setRows(nextList);
    saveRowsToDatabase(nextList);
  };

  // Delete row
  const handleDeleteRow = (rowId: string) => {
    if (confirm("Are you sure you want to remove this indicator from the SDBIP 2nd & 3rd layer table?")) {
      const nextList = rows.filter(r => r.id !== rowId);
      setRows(nextList);
      saveRowsToDatabase(nextList);
    }
  };

  // Clear entire grid
  const handleConfirmClearGrid = () => {
    setRows([]);
    saveRowsToDatabase([]);
    setShowClearConfirm(false);
  };

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      // User filter
      if (selectedUserFilter !== 'ALL' && row.evaluationUser?.toLowerCase() !== selectedUserFilter.toLowerCase()) {
        return false;
      }
      // Functional KPA filter
      if (selectedKpaFilter !== 'ALL' && (row.kpa !== selectedKpaFilter && row.kpas !== selectedKpaFilter)) {
        return false;
      }
      // Department filter
      if (selectedDeptFilter !== 'ALL' && row.responsibleUnit?.toLowerCase() !== selectedDeptFilter.toLowerCase()) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const textToSearch = [
          row.refNum,
          row.kpi,
          row.strategicObj,
          row.kpa,
          row.kpas,
          row.mscoaCode,
          row.evaluationUser,
          row.userName,
          row.responsibleUnit,
          row.annualTarget,
          row.poe
        ].filter(Boolean).join(' ').toLowerCase();
        if (!textToSearch.includes(q)) return false;
      }
      return true;
    });
  }, [rows, selectedUserFilter, selectedKpaFilter, selectedDeptFilter, searchQuery]);

  // Total cumulative weight
  const totalWeight = useMemo(() => {
    return filteredRows.reduce((sum, r) => sum + (parseFloat(r.weight || r.weighting || '0') || 0), 0);
  }, [filteredRows]);

  // Export to Excel / CSV
  const handleExportExcel = () => {
    const exportData = filteredRows.map((row, idx) => ({
      'No.': idx + 1,
      'REF NUMBER': row.refNum,
      'STRATEGIC OBJECTIVE': row.strategicObj,
      'KPI DESCRIPTION': row.kpi,
      'BSD': row.bsd,
      'LED': row.led,
      'MFVM': row.mfvm,
      'GGPP': row.ggpp,
      'MIDT': row.midt,
      'SR': row.sr,
      'FUNCTIONAL AREA KPA': row.kpa || row.kpas,
      'mSCOA CODE': row.mscoaCode || row.mscoaTracking,
      'BASELINE': row.baseline,
      'BUDGET (R)': row.budgetAllocation || row.budget,
      'ANNUAL TARGET': row.annualTarget,
      '1ST QTR TARGET': row.q1Target || row.q1,
      '1ST QTR ACTUAL': row.q1Actual,
      '1ST QTR EXPENSE (R)': row.q1ActualExpense,
      '1ST QTR VARIANCE': calculateVariance(row.q1Target || row.q1, row.q1Actual),
      '1ST QTR CORRECTIVE': row.q1Corrective,
      '2ND QTR TARGET': row.q2Target || row.q2,
      '2ND QTR ACTUAL': row.q2Actual,
      '2ND QTR EXPENSE (R)': row.q2ActualExpense,
      '2ND QTR VARIANCE': calculateVariance(row.q2Target || row.q2, row.q2Actual),
      '2ND QTR CORRECTIVE': row.q2Corrective,
      'MIDTERM TARGET': row.midtermTarget,
      'MIDTERM ACTUAL': row.midtermActual,
      'MIDTERM EXPENSE (R)': row.midtermActualExpense,
      'MIDTERM VARIANCE': calculateVariance(row.midtermTarget, row.midtermActual),
      'MIDTERM CORRECTIVE': row.midtermCorrective,
      '3RD QTR TARGET': row.q3Target || row.q3,
      '3RD QTR ACTUAL': row.q3Actual,
      '3RD QTR EXPENSE (R)': row.q3ActualExpense,
      '3RD QTR VARIANCE': calculateVariance(row.q3Target || row.q3, row.q3Actual),
      '3RD QTR CORRECTIVE': row.q3Corrective,
      '4TH QTR TARGET': row.q4Target || row.q4,
      '4TH QTR ACTUAL': row.q4Actual,
      '4TH QTR EXPENSE (R)': row.q4ActualExpense,
      '4TH QTR VARIANCE': calculateVariance(row.q4Target || row.q4, row.q4Actual),
      '4TH QTR CORRECTIVE': row.q4Corrective,
      'ANNUAL ACTUAL': row.annualActual,
      'ANNUAL ACTUAL EXP': row.annualActualExpense || row.annualActualExp,
      'ANNUAL VARIANCE': calculateVariance(row.annualTarget, row.annualActual),
      'ANNUAL CORRECTIVE': row.annualCorrective,
      'PORTFOLIO OF EVIDENCE (POE)': row.poe,
      '% WEIGHT': row.weight || row.weighting,
      'EVALUATION SCORE': row.myScore,
      'EVALUATION COMMENT': row.evaluation,
      'REVIEW COMMENT': row.review,
      'ASSIGNED USER': row.evaluationUser,
      'RESPONSIBLE UNIT': row.responsibleUnit,
      'LINE MANAGER': row.reviewManager
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "SDBIP_2nd_3rd_Layer");
    XLSX.writeFile(wb, `SDBIP_2nd_3rd_Layer_Master_${activeTenantId}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div id="sdbip23-master-container" className="flex flex-col h-full bg-slate-100 rounded-3xl overflow-hidden shadow-2xl border border-slate-300 font-sans select-text">
      
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/50 animate-fade-in text-xs font-bold">
          <CheckCircle className="w-5 h-5 text-emerald-300 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="p-5 bg-white border-b border-slate-200 flex flex-col xl:flex-row xl:items-center justify-between gap-4 shrink-0 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase tracking-wider border border-emerald-300">
              IPMS SDBIP MASTER
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest font-mono">
              TENANT: {activeTenantId}
            </span>
          </div>
          <h1 className="text-base font-black text-slate-900 uppercase tracking-tight flex items-center gap-2 mt-1">
            <Layers className="w-5 h-5 text-emerald-600 shrink-0" />
            SDBIP 2nd & 3rd Layer (Departmental & Operational Alignment Database)
          </h1>
          <p className="text-[11px] text-slate-500 font-medium mt-0.5">
            Exact statutory replica of Performance Plans containing every single user's KPIs and strategically linked Functional Area KPAs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 select-none">
          <button
            type="button"
            onClick={() => syncEveryoneKpisAndKpas(false)}
            disabled={isSyncing}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
            title="Sync everyone's KPIs, Performance Plans, and strategically linked Functional Area KPAs"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isSyncing && "animate-spin")} />
            <span>{isSyncing ? "Syncing All Profiles..." : "Sync Everyone's KPIs & KPAs"}</span>
          </button>

          <button
            type="button"
            onClick={handleAddNewRow}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-slate-900 hover:bg-black text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>Add Metric Row</span>
          </button>

          <button
            type="button"
            onClick={() => saveRowsToDatabase(rows)}
            disabled={isSaving}
            className="px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white shadow-sm flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? "Saving..." : "Save Grid"}</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={() => setShowClearConfirm(true)}
            className="px-3 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            title={isExpanded ? "Collapse View" : "Full Screen Table"}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 border border-slate-200 transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-slate-50 border-b border-slate-200 grid grid-cols-1 md:grid-cols-4 gap-3 text-xs shrink-0">
        
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by KPI, Ref, Functional KPA, Objective, or User..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-300 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filter User */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
          <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedUserFilter}
            onChange={(e) => setSelectedUserFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Users ({userList.length})</option>
            {userList.map(u => (
              <option key={u.email} value={u.email}>
                {u.fullName || u.email} {u.department ? `(${u.department})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Functional Area KPA */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
          <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedKpaFilter}
            onChange={(e) => setSelectedKpaFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Functional Area KPAs ({uniqueFunctionalKpas.length})</option>
            {uniqueFunctionalKpas.map(k => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
        </div>

        {/* Filter Department */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-xl px-2.5 py-1">
          <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <select
            value={selectedDeptFilter}
            onChange={(e) => setSelectedDeptFilter(e.target.value)}
            className="w-full bg-transparent text-xs text-slate-700 font-semibold focus:outline-none cursor-pointer"
          >
            <option value="ALL">All Departments ({uniqueDepartments.length})</option>
            {uniqueDepartments.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Main Table Viewport */}
      <div className="flex-1 overflow-x-auto overflow-y-auto bg-white">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 space-y-4">
            <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin" />
            <p className="text-sm text-slate-600 font-bold">Synchronizing SDBIP 2nd & 3rd layer database with Supabase...</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-left text-[11px] font-sans min-w-[4800px] border border-slate-300">
            
            {/* Double-Tier Exact Header Replica */}
            <thead className="sticky top-0 z-20 bg-slate-100 text-slate-800 shadow-sm border-b-2 border-slate-300 select-none">
              
              {/* Top Tier */}
              <tr className="border-b border-slate-300 text-[10px] uppercase font-black tracking-wider">
                <th rowSpan={2} className="p-3 w-12 text-center sticky left-0 bg-slate-200 border-r border-slate-300 z-30 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                  No.
                </th>
                <th rowSpan={2} className="p-3 min-w-[320px] border-r border-slate-300">
                  Strategic Objective
                </th>
                <th rowSpan={2} className="p-3 w-28 text-center border-r border-slate-300 font-mono">
                  KPI No
                </th>
                <th rowSpan={2} className="p-3 min-w-[340px] border-r border-slate-300">
                  KPI Description
                </th>
                
                {/* National KPA Flags */}
                <th rowSpan={2} className="p-2 w-10 text-center border-r border-slate-300 bg-cyan-50" title="Basic Service Delivery">BSD</th>
                <th rowSpan={2} className="p-2 w-10 text-center border-r border-slate-300 bg-amber-50" title="Local Economic Development">LED</th>
                <th rowSpan={2} className="p-2 w-10 text-center border-r border-slate-300 bg-emerald-50" title="Municipal Financial Viability & Management">MFVM</th>
                <th rowSpan={2} className="p-2 w-10 text-center border-r border-slate-300 bg-violet-50" title="Good Governance & Public Participation">GGPP</th>
                <th rowSpan={2} className="p-2 w-10 text-center border-r border-slate-300 bg-pink-50" title="Municipal Institutional Development & Transformation">MIDT</th>
                <th rowSpan={2} className="p-2 w-10 text-center border-r border-slate-300 bg-rose-50" title="Social Responsibility">SR</th>

                {/* Strategically Linked Functional Area KPA */}
                <th rowSpan={2} className="p-3 min-w-[280px] border-r border-slate-300 bg-emerald-50/50 text-emerald-950">
                  Functional Area KPA
                </th>
                
                {/* mSCOA */}
                <th rowSpan={2} className="p-3 min-w-[180px] border-r border-slate-300 bg-indigo-50/40 text-indigo-950">
                  mSCOA Code
                </th>

                {/* Baseline & Budget */}
                <th rowSpan={2} className="p-3 min-w-[160px] border-r border-slate-300">
                  Baseline
                </th>
                <th rowSpan={2} className="p-3 min-w-[150px] border-r border-slate-300 font-mono text-right">
                  Budget (R)
                </th>

                {/* MUNICIPAL FINANCIAL YEAR SPAN (28 Subcolumns) */}
                <th colSpan={28} className="p-2.5 text-center bg-slate-800 text-white font-extrabold tracking-widest border-r border-slate-300">
                  MUNICIPAL FINANCIAL YEAR (1 JULY - 30 JUNE)
                </th>

                {/* POE, Weight, Reviews, User */}
                <th rowSpan={2} className="p-3 min-w-[280px] border-r border-slate-300 bg-slate-50">
                  Portfolio of Evidence (POE)
                </th>
                <th rowSpan={2} className="p-3 w-16 text-center border-r border-slate-300 bg-rose-50 font-black text-rose-800">
                  % Wt
                </th>
                <th rowSpan={2} className="p-3 min-w-[220px] border-r border-slate-300 bg-emerald-50">
                  Evaluation
                </th>
                <th rowSpan={2} className="p-3 min-w-[220px] border-r border-slate-300 bg-blue-50">
                  Review
                </th>
                <th rowSpan={2} className="p-3 min-w-[220px] border-r border-slate-300 bg-amber-50/40">
                  Assigned User / Unit
                </th>
                <th rowSpan={2} className="p-3 w-14 text-center">
                  Actions
                </th>
              </tr>

              {/* Bottom Tier for Municipal Financial Year */}
              <tr className="border-b border-slate-300 text-[9px] uppercase font-bold tracking-tight bg-slate-200/90 text-slate-700">
                <th className="p-2 min-w-[140px] border-r border-slate-300">Annual Target</th>
                
                {/* Q1 */}
                <th className="p-2 min-w-[130px] border-r border-slate-300 bg-slate-100">1st Qtr Target</th>
                <th className="p-2 min-w-[200px] border-r border-slate-300 bg-emerald-50/60">1st Qtr Actual</th>
                <th className="p-2 min-w-[110px] border-r border-slate-300 bg-emerald-50/60 text-right">1st Qtr Actual Expense</th>
                <th className="p-2 min-w-[80px] text-center border-r border-slate-300 bg-emerald-50/60">1st Qtr Variance</th>
                <th className="p-2 min-w-[140px] border-r border-slate-300 bg-emerald-50/60">1st Qtr Corrective</th>

                {/* Q2 */}
                <th className="p-2 min-w-[130px] border-r border-slate-300 bg-slate-100">2nd Qtr Target</th>
                <th className="p-2 min-w-[200px] border-r border-slate-300 bg-blue-50/60">2nd Qtr Actual</th>
                <th className="p-2 min-w-[110px] border-r border-slate-300 bg-blue-50/60 text-right">2nd Qtr Actual Expense</th>
                <th className="p-2 min-w-[80px] text-center border-r border-slate-300 bg-blue-50/60">2nd Qtr Variance</th>
                <th className="p-2 min-w-[140px] border-r border-slate-300 bg-blue-50/60">2nd Qtr Corrective</th>

                {/* Midterm */}
                <th className="p-2 min-w-[130px] border-r border-slate-300 bg-amber-50">Midterm Review</th>
                <th className="p-2 min-w-[200px] border-r border-slate-300 bg-amber-50/70">Midterm Actual</th>
                <th className="p-2 min-w-[110px] border-r border-slate-300 bg-amber-50/70 text-right">Midterm Actual Expense</th>
                <th className="p-2 min-w-[80px] text-center border-r border-slate-300 bg-amber-50/70">Midterm Variance</th>
                <th className="p-2 min-w-[140px] border-r border-slate-300 bg-amber-50/70">Midterm Corrective</th>

                {/* Q3 */}
                <th className="p-2 min-w-[130px] border-r border-slate-300 bg-slate-100">3rd Qtr Target</th>
                <th className="p-2 min-w-[200px] border-r border-slate-300 bg-purple-50/60">3rd Qtr Actual</th>
                <th className="p-2 min-w-[110px] border-r border-slate-300 bg-purple-50/60 text-right">3rd Qtr Actual Expense</th>
                <th className="p-2 min-w-[80px] text-center border-r border-slate-300 bg-purple-50/60">3rd Qtr Variance</th>
                <th className="p-2 min-w-[140px] border-r border-slate-300 bg-purple-50/60">3rd Qtr Corrective</th>

                {/* Q4 */}
                <th className="p-2 min-w-[130px] border-r border-slate-300 bg-slate-100">4th Qtr Target</th>
                <th className="p-2 min-w-[200px] border-r border-slate-300 bg-rose-50/60">4th Qtr Actual</th>
                <th className="p-2 min-w-[110px] border-r border-slate-300 bg-rose-50/60 text-right">4th Qtr Actual Expense</th>
                <th className="p-2 min-w-[80px] text-center border-r border-slate-300 bg-rose-50/60">4th Qtr Variance</th>
                <th className="p-2 min-w-[140px] border-r border-slate-300 bg-rose-50/60">4th Qtr Corrective</th>

                {/* Annual Metrics */}
                <th className="p-2 min-w-[140px] border-r border-slate-300 bg-slate-200">Annual Actual</th>
                <th className="p-2 min-w-[110px] border-r border-slate-300 bg-slate-200 text-right">Annual Actual Exp</th>
                <th className="p-2 min-w-[80px] text-center border-r border-slate-300 bg-slate-200">Annual Variance</th>
                <th className="p-2 min-w-[140px] border-r border-slate-300 bg-slate-200">Annual Corrective</th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={44} className="p-16 text-center text-slate-400 bg-slate-50/50">
                    <Layers className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-sm font-bold text-slate-700">No matching SDBIP indicators found</p>
                    <p className="text-xs text-slate-400 mt-1">Click "Sync Everyone's KPIs & KPAs" to auto-import all profiles and performance plans.</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, index) => {
                  const q1Var = calculateVariance(row.q1Target || row.q1, row.q1Actual);
                  const q2Var = calculateVariance(row.q2Target || row.q2, row.q2Actual);
                  const midtermVar = calculateVariance(row.midtermTarget, row.midtermActual);
                  const q3Var = calculateVariance(row.q3Target || row.q3, row.q3Actual);
                  const q4Var = calculateVariance(row.q4Target || row.q4, row.q4Actual);
                  const annualVar = calculateVariance(row.annualTarget, row.annualActual);

                  return (
                    <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50/80 transition-colors">
                      
                      {/* Sticky No. */}
                      <td className="p-2.5 text-center sticky left-0 bg-white border-r border-slate-200 font-mono font-bold text-slate-500 shadow-[2px_0_5px_rgba(0,0,0,0.02)]">
                        {index + 1}
                      </td>

                      {/* Strategic Objective */}
                      <td className="p-2 border-r border-slate-200">
                        <select
                          value={row.strategicObj || ''}
                          onChange={(e) => updateRowField(row.id, 'strategicObj', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-[10px] font-semibold text-slate-700 mb-1 focus:outline-none"
                        >
                          <option value="">-- Select Strategic Objective --</option>
                          {uniqueStrategicObjectives.map((obj) => (
                            <option key={obj} value={obj}>{obj}</option>
                          ))}
                        </select>
                        <textarea
                          rows={2}
                          value={row.strategicObj || ''}
                          onChange={(e) => updateRowField(row.id, 'strategicObj', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Strategic objective text..."
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-700 leading-snug resize-y outline-none"
                        />
                      </td>

                      {/* KPI No */}
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.refNum || ''}
                          onChange={(e) => updateRowField(row.id, 'refNum', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          className="w-full bg-slate-50 border border-slate-200 rounded p-1 text-center font-mono font-bold text-emerald-800 text-[10px] focus:outline-none focus:border-emerald-500"
                        />
                      </td>

                      {/* KPI Description */}
                      <td className="p-2 border-r border-slate-200">
                        <textarea
                          rows={3}
                          value={row.kpi || ''}
                          onChange={(e) => updateRowField(row.id, 'kpi', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="KPI description details..."
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1.5 text-[11px] text-slate-900 font-medium leading-relaxed resize-y outline-none"
                        />
                      </td>

                      {/* National KPA Toggles */}
                      <td className="p-1 border-r border-slate-200 text-center bg-cyan-50/30">
                        <button
                          type="button"
                          onClick={() => {
                            const next = row.bsd === 'Y' ? 'N' : 'Y';
                            updateRowField(row.id, 'bsd', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, bsd: next } : r));
                          }}
                          className={cn(
                            "w-6 h-6 rounded font-black text-[10px] transition cursor-pointer",
                            row.bsd === 'Y' ? "bg-cyan-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {row.bsd === 'Y' ? 'X' : '·'}
                        </button>
                      </td>
                      <td className="p-1 border-r border-slate-200 text-center bg-amber-50/30">
                        <button
                          type="button"
                          onClick={() => {
                            const next = row.led === 'Y' ? 'N' : 'Y';
                            updateRowField(row.id, 'led', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, led: next } : r));
                          }}
                          className={cn(
                            "w-6 h-6 rounded font-black text-[10px] transition cursor-pointer",
                            row.led === 'Y' ? "bg-amber-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {row.led === 'Y' ? 'X' : '·'}
                        </button>
                      </td>
                      <td className="p-1 border-r border-slate-200 text-center bg-emerald-50/30">
                        <button
                          type="button"
                          onClick={() => {
                            const next = row.mfvm === 'Y' ? 'N' : 'Y';
                            updateRowField(row.id, 'mfvm', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, mfvm: next } : r));
                          }}
                          className={cn(
                            "w-6 h-6 rounded font-black text-[10px] transition cursor-pointer",
                            row.mfvm === 'Y' ? "bg-emerald-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {row.mfvm === 'Y' ? 'X' : '·'}
                        </button>
                      </td>
                      <td className="p-1 border-r border-slate-200 text-center bg-violet-50/30">
                        <button
                          type="button"
                          onClick={() => {
                            const next = row.ggpp === 'Y' ? 'N' : 'Y';
                            updateRowField(row.id, 'ggpp', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, ggpp: next } : r));
                          }}
                          className={cn(
                            "w-6 h-6 rounded font-black text-[10px] transition cursor-pointer",
                            row.ggpp === 'Y' ? "bg-violet-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {row.ggpp === 'Y' ? 'X' : '·'}
                        </button>
                      </td>
                      <td className="p-1 border-r border-slate-200 text-center bg-pink-50/30">
                        <button
                          type="button"
                          onClick={() => {
                            const next = row.midt === 'Y' ? 'N' : 'Y';
                            updateRowField(row.id, 'midt', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, midt: next } : r));
                          }}
                          className={cn(
                            "w-6 h-6 rounded font-black text-[10px] transition cursor-pointer",
                            row.midt === 'Y' ? "bg-pink-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {row.midt === 'Y' ? 'X' : '·'}
                        </button>
                      </td>
                      <td className="p-1 border-r border-slate-200 text-center bg-rose-50/30">
                        <button
                          type="button"
                          onClick={() => {
                            const next = row.sr === 'Y' ? 'N' : 'Y';
                            updateRowField(row.id, 'sr', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, sr: next } : r));
                          }}
                          className={cn(
                            "w-6 h-6 rounded font-black text-[10px] transition cursor-pointer",
                            row.sr === 'Y' ? "bg-rose-600 text-white shadow-xs" : "bg-slate-100 text-slate-400 hover:bg-slate-200"
                          )}
                        >
                          {row.sr === 'Y' ? 'X' : '·'}
                        </button>
                      </td>

                      {/* Strategically Linked Functional Area KPA */}
                      <td className="p-2 border-r border-slate-200 bg-emerald-50/20">
                        <select
                          value={row.kpa || row.kpas || ''}
                          onChange={(e) => updateRowField(row.id, 'kpa', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          className="w-full bg-white border border-emerald-300 rounded p-1 text-[10px] font-bold text-emerald-900 mb-1 focus:outline-none"
                        >
                          <option value="">-- Choose Functional Area KPA --</option>
                          {uniqueFunctionalKpas.map((fk) => (
                            <option key={fk} value={fk}>{fk}</option>
                          ))}
                        </select>
                        <textarea
                          rows={2}
                          value={row.kpa || row.kpas || ''}
                          onChange={(e) => updateRowField(row.id, 'kpa', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Captured functional area KPA..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-emerald-200 focus:border-emerald-500 rounded p-1 text-[10px] text-emerald-950 font-bold leading-snug resize-y outline-none"
                        />
                      </td>

                      {/* mSCOA Code */}
                      <td className="p-2 border-r border-slate-200 bg-indigo-50/20">
                        <select
                          value={row.mscoaCode || row.mscoaTracking || ''}
                          onChange={(e) => updateRowField(row.id, 'mscoaCode', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          className="w-full bg-white border border-indigo-200 rounded p-1 text-[10px] font-semibold text-indigo-900 mb-1 focus:outline-none"
                        >
                          <option value="">-- Select mSCOA --</option>
                          {uniqueMscoaCodes.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={row.mscoaCode || row.mscoaTracking || ''}
                          onChange={(e) => updateRowField(row.id, 'mscoaCode', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="mSCOA code..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-indigo-200 focus:border-indigo-500 rounded p-1 text-[10px] text-indigo-900 font-mono outline-none"
                        />
                      </td>

                      {/* Baseline */}
                      <td className="p-2 border-r border-slate-200">
                        <textarea
                          rows={2}
                          value={row.baseline || ''}
                          onChange={(e) => updateRowField(row.id, 'baseline', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Baseline metric..."
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-600 resize-y outline-none"
                        />
                      </td>

                      {/* Budget */}
                      <td className="p-2 border-r border-slate-200">
                        <input
                          type="text"
                          value={row.budgetAllocation || row.budget || ''}
                          onChange={(e) => updateRowField(row.id, 'budgetAllocation', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="R 0.00"
                          className="w-full bg-transparent hover:bg-slate-50 focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-right font-mono font-bold text-emerald-700 text-[10px] outline-none"
                        />
                      </td>

                      {/* Annual Target */}
                      <td className="p-2 border-r border-slate-200 bg-slate-50/50">
                        <textarea
                          rows={2}
                          value={row.annualTarget || ''}
                          onChange={(e) => updateRowField(row.id, 'annualTarget', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Annual target..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-900 font-bold resize-y outline-none"
                        />
                      </td>

                      {/* 1st Qtr Target */}
                      <td className="p-2 border-r border-slate-200 bg-slate-50/40">
                        <textarea
                          rows={2}
                          value={row.q1Target || row.q1 || ''}
                          onChange={(e) => updateRowField(row.id, 'q1Target', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q1 target..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none"
                        />
                      </td>

                      {/* 1st Qtr Actual */}
                      <td className="p-2 border-r border-slate-200 bg-emerald-50/20">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[8px] font-extrabold text-emerald-800 uppercase">Score (1-5):</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={row.q1Score || ''}
                            onChange={(e) => updateRowField(row.id, 'q1Score', e.target.value)}
                            onBlur={() => saveRowsToDatabase(rows)}
                            className="w-10 bg-white border border-emerald-300 rounded text-center text-[10px] font-bold text-emerald-900 p-0.5"
                          />
                          <span className={cn(
                            "ml-auto text-[8px] px-1.5 py-0.5 rounded font-black",
                            parseFloat(q1Var) <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                          )}>
                            Var: {q1Var}
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={row.q1Actual || ''}
                          onChange={(e) => updateRowField(row.id, 'q1Actual', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q1 Actual performance..."
                          className="w-full bg-white border border-emerald-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none mb-1"
                        />
                        <input
                          type="text"
                          value={row.q1Comment || ''}
                          onChange={(e) => updateRowField(row.id, 'q1Comment', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q1 variance comment..."
                          className="w-full bg-white/70 border border-slate-200 rounded p-0.5 text-[9px] text-slate-600 outline-none"
                        />
                        <CompactPoeUploader
                          label="Q1 POE"
                          files={row.q1PoeDocs || []}
                          onUpload={(docs) => {
                            const next = [...(row.q1PoeDocs || []), ...docs];
                            updateRowField(row.id, 'q1PoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, q1PoeDocs: next } : r));
                          }}
                          onRemove={(docId) => {
                            const next = (row.q1PoeDocs || []).filter(d => d.id !== docId);
                            updateRowField(row.id, 'q1PoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, q1PoeDocs: next } : r));
                          }}
                        />
                      </td>

                      {/* 1st Qtr Expense */}
                      <td className="p-2 border-r border-slate-200 bg-emerald-50/20">
                        <input
                          type="text"
                          value={row.q1ActualExpense || ''}
                          onChange={(e) => updateRowField(row.id, 'q1ActualExpense', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="R 0.00"
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-right font-mono text-[10px] text-slate-800 outline-none"
                        />
                      </td>

                      {/* 1st Qtr Variance */}
                      <td className="p-2 border-r border-slate-200 bg-emerald-50/20 text-center font-mono font-bold text-[10px]">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-extrabold",
                          parseFloat(q1Var) <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        )}>
                          {q1Var}
                        </span>
                      </td>

                      {/* 1st Qtr Corrective */}
                      <td className="p-2 border-r border-slate-200 bg-emerald-50/20">
                        <textarea
                          rows={2}
                          value={row.q1Corrective || ''}
                          onChange={(e) => updateRowField(row.id, 'q1Corrective', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q1 corrective action..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-700 resize-y outline-none"
                        />
                      </td>

                      {/* 2nd Qtr Target */}
                      <td className="p-2 border-r border-slate-200 bg-slate-50/40">
                        <textarea
                          rows={2}
                          value={row.q2Target || row.q2 || ''}
                          onChange={(e) => updateRowField(row.id, 'q2Target', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q2 target..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none"
                        />
                      </td>

                      {/* 2nd Qtr Actual */}
                      <td className="p-2 border-r border-slate-200 bg-blue-50/20">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[8px] font-extrabold text-blue-800 uppercase">Score (1-5):</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={row.q2Score || ''}
                            onChange={(e) => updateRowField(row.id, 'q2Score', e.target.value)}
                            onBlur={() => saveRowsToDatabase(rows)}
                            className="w-10 bg-white border border-blue-300 rounded text-center text-[10px] font-bold text-blue-900 p-0.5"
                          />
                          <span className={cn(
                            "ml-auto text-[8px] px-1.5 py-0.5 rounded font-black",
                            parseFloat(q2Var) <= 0 ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                          )}>
                            Var: {q2Var}
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={row.q2Actual || ''}
                          onChange={(e) => updateRowField(row.id, 'q2Actual', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q2 Actual performance..."
                          className="w-full bg-white border border-blue-200 focus:border-blue-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none mb-1"
                        />
                        <input
                          type="text"
                          value={row.q2Comment || ''}
                          onChange={(e) => updateRowField(row.id, 'q2Comment', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q2 variance comment..."
                          className="w-full bg-white/70 border border-slate-200 rounded p-0.5 text-[9px] text-slate-600 outline-none"
                        />
                        <CompactPoeUploader
                          label="Q2 POE"
                          files={row.q2PoeDocs || []}
                          onUpload={(docs) => {
                            const next = [...(row.q2PoeDocs || []), ...docs];
                            updateRowField(row.id, 'q2PoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, q2PoeDocs: next } : r));
                          }}
                          onRemove={(docId) => {
                            const next = (row.q2PoeDocs || []).filter(d => d.id !== docId);
                            updateRowField(row.id, 'q2PoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, q2PoeDocs: next } : r));
                          }}
                        />
                      </td>

                      {/* 2nd Qtr Expense */}
                      <td className="p-2 border-r border-slate-200 bg-blue-50/20">
                        <input
                          type="text"
                          value={row.q2ActualExpense || ''}
                          onChange={(e) => updateRowField(row.id, 'q2ActualExpense', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="R 0.00"
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-right font-mono text-[10px] text-slate-800 outline-none"
                        />
                      </td>

                      {/* 2nd Qtr Variance */}
                      <td className="p-2 border-r border-slate-200 bg-blue-50/20 text-center font-mono font-bold text-[10px]">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-extrabold",
                          parseFloat(q2Var) <= 0 ? "bg-blue-100 text-blue-800" : "bg-rose-100 text-rose-800"
                        )}>
                          {q2Var}
                        </span>
                      </td>

                      {/* 2nd Qtr Corrective */}
                      <td className="p-2 border-r border-slate-200 bg-blue-50/20">
                        <textarea
                          rows={2}
                          value={row.q2Corrective || ''}
                          onChange={(e) => updateRowField(row.id, 'q2Corrective', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q2 corrective action..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-700 resize-y outline-none"
                        />
                      </td>

                      {/* Midterm Target */}
                      <td className="p-2 border-r border-slate-200 bg-amber-50/30">
                        <textarea
                          rows={2}
                          value={row.midtermTarget || ''}
                          onChange={(e) => updateRowField(row.id, 'midtermTarget', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Midterm target..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-amber-200 focus:border-amber-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none"
                        />
                      </td>

                      {/* Midterm Actual */}
                      <td className="p-2 border-r border-slate-200 bg-amber-50/40">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[8px] font-extrabold text-amber-800 uppercase">Score (1-5):</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={row.midtermScore || ''}
                            onChange={(e) => updateRowField(row.id, 'midtermScore', e.target.value)}
                            onBlur={() => saveRowsToDatabase(rows)}
                            className="w-10 bg-white border border-amber-300 rounded text-center text-[10px] font-bold text-amber-900 p-0.5"
                          />
                          <span className={cn(
                            "ml-auto text-[8px] px-1.5 py-0.5 rounded font-black",
                            parseFloat(midtermVar) <= 0 ? "bg-amber-200 text-amber-900" : "bg-rose-100 text-rose-800"
                          )}>
                            Var: {midtermVar}
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={row.midtermActual || ''}
                          onChange={(e) => updateRowField(row.id, 'midtermActual', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Midterm Actual review..."
                          className="w-full bg-white border border-amber-200 focus:border-amber-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none mb-1"
                        />
                        <input
                          type="text"
                          value={row.midtermComment || ''}
                          onChange={(e) => updateRowField(row.id, 'midtermComment', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Midterm review comment..."
                          className="w-full bg-white/70 border border-slate-200 rounded p-0.5 text-[9px] text-slate-600 outline-none"
                        />
                        <CompactPoeUploader
                          label="Midterm POE"
                          files={row.midtermPoeDocs || []}
                          onUpload={(docs) => {
                            const next = [...(row.midtermPoeDocs || []), ...docs];
                            updateRowField(row.id, 'midtermPoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, midtermPoeDocs: next } : r));
                          }}
                          onRemove={(docId) => {
                            const next = (row.midtermPoeDocs || []).filter(d => d.id !== docId);
                            updateRowField(row.id, 'midtermPoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, midtermPoeDocs: next } : r));
                          }}
                        />
                      </td>

                      {/* Midterm Expense */}
                      <td className="p-2 border-r border-slate-200 bg-amber-50/30">
                        <input
                          type="text"
                          value={row.midtermActualExpense || ''}
                          onChange={(e) => updateRowField(row.id, 'midtermActualExpense', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="R 0.00"
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-right font-mono text-[10px] text-slate-800 outline-none"
                        />
                      </td>

                      {/* Midterm Variance */}
                      <td className="p-2 border-r border-slate-200 bg-amber-50/30 text-center font-mono font-bold text-[10px]">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-extrabold",
                          parseFloat(midtermVar) <= 0 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"
                        )}>
                          {midtermVar}
                        </span>
                      </td>

                      {/* Midterm Corrective */}
                      <td className="p-2 border-r border-slate-200 bg-amber-50/30">
                        <textarea
                          rows={2}
                          value={row.midtermCorrective || ''}
                          onChange={(e) => updateRowField(row.id, 'midtermCorrective', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Midterm corrective action..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-700 resize-y outline-none"
                        />
                      </td>

                      {/* 3rd Qtr Target */}
                      <td className="p-2 border-r border-slate-200 bg-slate-50/40">
                        <textarea
                          rows={2}
                          value={row.q3Target || row.q3 || ''}
                          onChange={(e) => updateRowField(row.id, 'q3Target', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q3 target..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none"
                        />
                      </td>

                      {/* 3rd Qtr Actual */}
                      <td className="p-2 border-r border-slate-200 bg-purple-50/20">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[8px] font-extrabold text-purple-800 uppercase">Score (1-5):</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={row.q3Score || ''}
                            onChange={(e) => updateRowField(row.id, 'q3Score', e.target.value)}
                            onBlur={() => saveRowsToDatabase(rows)}
                            className="w-10 bg-white border border-purple-300 rounded text-center text-[10px] font-bold text-purple-900 p-0.5"
                          />
                          <span className={cn(
                            "ml-auto text-[8px] px-1.5 py-0.5 rounded font-black",
                            parseFloat(q3Var) <= 0 ? "bg-purple-100 text-purple-800" : "bg-rose-100 text-rose-800"
                          )}>
                            Var: {q3Var}
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={row.q3Actual || ''}
                          onChange={(e) => updateRowField(row.id, 'q3Actual', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q3 Actual performance..."
                          className="w-full bg-white border border-purple-200 focus:border-purple-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none mb-1"
                        />
                        <input
                          type="text"
                          value={row.q3Comment || ''}
                          onChange={(e) => updateRowField(row.id, 'q3Comment', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q3 variance comment..."
                          className="w-full bg-white/70 border border-slate-200 rounded p-0.5 text-[9px] text-slate-600 outline-none"
                        />
                        <CompactPoeUploader
                          label="Q3 POE"
                          files={row.q3PoeDocs || []}
                          onUpload={(docs) => {
                            const next = [...(row.q3PoeDocs || []), ...docs];
                            updateRowField(row.id, 'q3PoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, q3PoeDocs: next } : r));
                          }}
                          onRemove={(docId) => {
                            const next = (row.q3PoeDocs || []).filter(d => d.id !== docId);
                            updateRowField(row.id, 'q3PoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, q3PoeDocs: next } : r));
                          }}
                        />
                      </td>

                      {/* 3rd Qtr Expense */}
                      <td className="p-2 border-r border-slate-200 bg-purple-50/20">
                        <input
                          type="text"
                          value={row.q3ActualExpense || ''}
                          onChange={(e) => updateRowField(row.id, 'q3ActualExpense', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="R 0.00"
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-right font-mono text-[10px] text-slate-800 outline-none"
                        />
                      </td>

                      {/* 3rd Qtr Variance */}
                      <td className="p-2 border-r border-slate-200 bg-purple-50/20 text-center font-mono font-bold text-[10px]">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-extrabold",
                          parseFloat(q3Var) <= 0 ? "bg-purple-100 text-purple-800" : "bg-rose-100 text-rose-800"
                        )}>
                          {q3Var}
                        </span>
                      </td>

                      {/* 3rd Qtr Corrective */}
                      <td className="p-2 border-r border-slate-200 bg-purple-50/20">
                        <textarea
                          rows={2}
                          value={row.q3Corrective || ''}
                          onChange={(e) => updateRowField(row.id, 'q3Corrective', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q3 corrective action..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-700 resize-y outline-none"
                        />
                      </td>

                      {/* 4th Qtr Target */}
                      <td className="p-2 border-r border-slate-200 bg-slate-50/40">
                        <textarea
                          rows={2}
                          value={row.q4Target || row.q4 || ''}
                          onChange={(e) => updateRowField(row.id, 'q4Target', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q4 target..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none"
                        />
                      </td>

                      {/* 4th Qtr Actual */}
                      <td className="p-2 border-r border-slate-200 bg-rose-50/20">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[8px] font-extrabold text-rose-800 uppercase">Score (1-5):</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={row.q4Score || ''}
                            onChange={(e) => updateRowField(row.id, 'q4Score', e.target.value)}
                            onBlur={() => saveRowsToDatabase(rows)}
                            className="w-10 bg-white border border-rose-300 rounded text-center text-[10px] font-bold text-rose-900 p-0.5"
                          />
                          <span className={cn(
                            "ml-auto text-[8px] px-1.5 py-0.5 rounded font-black",
                            parseFloat(q4Var) <= 0 ? "bg-rose-100 text-rose-800" : "bg-rose-200 text-rose-900"
                          )}>
                            Var: {q4Var}
                          </span>
                        </div>
                        <textarea
                          rows={2}
                          value={row.q4Actual || ''}
                          onChange={(e) => updateRowField(row.id, 'q4Actual', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q4 Actual performance..."
                          className="w-full bg-white border border-rose-200 focus:border-rose-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none mb-1"
                        />
                        <input
                          type="text"
                          value={row.q4Comment || ''}
                          onChange={(e) => updateRowField(row.id, 'q4Comment', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q4 variance comment..."
                          className="w-full bg-white/70 border border-slate-200 rounded p-0.5 text-[9px] text-slate-600 outline-none"
                        />
                        <CompactPoeUploader
                          label="Q4 POE"
                          files={row.q4PoeDocs || []}
                          onUpload={(docs) => {
                            const next = [...(row.q4PoeDocs || []), ...docs];
                            updateRowField(row.id, 'q4PoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, q4PoeDocs: next } : r));
                          }}
                          onRemove={(docId) => {
                            const next = (row.q4PoeDocs || []).filter(d => d.id !== docId);
                            updateRowField(row.id, 'q4PoeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, q4PoeDocs: next } : r));
                          }}
                        />
                      </td>

                      {/* 4th Qtr Expense */}
                      <td className="p-2 border-r border-slate-200 bg-rose-50/20">
                        <input
                          type="text"
                          value={row.q4ActualExpense || ''}
                          onChange={(e) => updateRowField(row.id, 'q4ActualExpense', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="R 0.00"
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-right font-mono text-[10px] text-slate-800 outline-none"
                        />
                      </td>

                      {/* 4th Qtr Variance */}
                      <td className="p-2 border-r border-slate-200 bg-rose-50/20 text-center font-mono font-bold text-[10px]">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-extrabold",
                          parseFloat(q4Var) <= 0 ? "bg-rose-100 text-rose-800" : "bg-rose-200 text-rose-900"
                        )}>
                          {q4Var}
                        </span>
                      </td>

                      {/* 4th Qtr Corrective */}
                      <td className="p-2 border-r border-slate-200 bg-rose-50/20">
                        <textarea
                          rows={2}
                          value={row.q4Corrective || ''}
                          onChange={(e) => updateRowField(row.id, 'q4Corrective', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Q4 corrective action..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-700 resize-y outline-none"
                        />
                      </td>

                      {/* Annual Actual */}
                      <td className="p-2 border-r border-slate-200 bg-slate-100/70">
                        <textarea
                          rows={2}
                          value={row.annualActual || ''}
                          onChange={(e) => updateRowField(row.id, 'annualActual', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Total Annual Actual..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-900 font-bold resize-y outline-none"
                        />
                      </td>

                      {/* Annual Actual Exp */}
                      <td className="p-2 border-r border-slate-200 bg-slate-100/70">
                        <input
                          type="text"
                          value={row.annualActualExpense || row.annualActualExp || ''}
                          onChange={(e) => updateRowField(row.id, 'annualActualExpense', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="R 0.00"
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded p-1 text-right font-mono text-[10px] text-slate-900 font-bold outline-none"
                        />
                      </td>

                      {/* Annual Variance */}
                      <td className="p-2 border-r border-slate-200 bg-slate-100/70 text-center font-mono font-bold text-[10px]">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-black",
                          parseFloat(annualVar) <= 0 ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        )}>
                          {annualVar}
                        </span>
                      </td>

                      {/* Annual Corrective */}
                      <td className="p-2 border-r border-slate-200 bg-slate-100/70">
                        <textarea
                          rows={2}
                          value={row.annualCorrective || ''}
                          onChange={(e) => updateRowField(row.id, 'annualCorrective', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Annual corrective recommendations..."
                          className="w-full bg-transparent hover:bg-white focus:bg-white border border-transparent hover:border-slate-300 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-700 resize-y outline-none"
                        />
                      </td>

                      {/* Portfolio of Evidence (POE) */}
                      <td className="p-2 border-r border-slate-200 bg-slate-50/50">
                        <textarea
                          rows={2}
                          value={row.poe || ''}
                          onChange={(e) => updateRowField(row.id, 'poe', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="General POE requirements..."
                          className="w-full bg-white border border-slate-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-700 leading-snug resize-y outline-none mb-1"
                        />
                        <CompactPoeUploader
                          label="Master POE"
                          files={row.poeDocs || []}
                          onUpload={(docs) => {
                            const next = [...(row.poeDocs || []), ...docs];
                            updateRowField(row.id, 'poeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, poeDocs: next } : r));
                          }}
                          onRemove={(docId) => {
                            const next = (row.poeDocs || []).filter(d => d.id !== docId);
                            updateRowField(row.id, 'poeDocs', next);
                            saveRowsToDatabase(rows.map(r => r.id === row.id ? { ...r, poeDocs: next } : r));
                          }}
                        />
                      </td>

                      {/* % Weight */}
                      <td className="p-2 border-r border-slate-200 bg-rose-50/20 text-center">
                        <input
                          type="number"
                          value={row.weight || row.weighting || ''}
                          onChange={(e) => updateRowField(row.id, 'weight', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          className="w-full bg-white border border-rose-300 rounded p-1 text-center font-bold text-rose-700 text-xs focus:outline-none"
                        />
                      </td>

                      {/* Evaluation */}
                      <td className="p-2 border-r border-slate-200 bg-emerald-50/20">
                        <div className="flex items-center gap-1 mb-1">
                          <span className="text-[9px] font-bold text-emerald-800">Self Score:</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={row.myScore || ''}
                            onChange={(e) => updateRowField(row.id, 'myScore', e.target.value)}
                            onBlur={() => saveRowsToDatabase(rows)}
                            className="w-10 bg-white border border-emerald-300 rounded text-center text-[10px] font-bold text-emerald-900 p-0.5"
                          />
                        </div>
                        <textarea
                          rows={2}
                          value={row.evaluation || ''}
                          onChange={(e) => updateRowField(row.id, 'evaluation', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Self assessment comment..."
                          className="w-full bg-white border border-emerald-200 focus:border-emerald-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none"
                        />
                      </td>

                      {/* Review */}
                      <td className="p-2 border-r border-slate-200 bg-blue-50/20">
                        <textarea
                          rows={3}
                          value={row.review || ''}
                          onChange={(e) => updateRowField(row.id, 'review', e.target.value)}
                          onBlur={() => saveRowsToDatabase(rows)}
                          placeholder="Supervisor / Auditor review..."
                          className="w-full bg-white border border-blue-200 focus:border-blue-500 rounded p-1 text-[10px] text-slate-800 resize-y outline-none"
                        />
                      </td>

                      {/* Assigned User / Unit */}
                      <td className="p-2.5 border-r border-slate-200 bg-amber-50/30 text-[10px] space-y-1">
                        <div className="flex items-center gap-1 font-bold text-slate-800 truncate" title={row.evaluationUser}>
                          <UserIcon className="w-3 h-3 text-amber-600 shrink-0" />
                          <span className="truncate">{row.userName || row.evaluationUser}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono truncate" title={row.responsibleUnit}>
                          Unit: <span className="font-semibold text-slate-700">{row.responsibleUnit || 'Unassigned'}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono truncate" title={row.reviewManager}>
                          Mgr: <span className="font-semibold text-slate-700">{row.reviewManager || 'Line Manager'}</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition cursor-pointer"
                          title="Delete SDBIP Indicator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        )}
      </div>

      {/* Footer Statistics & Status Bar */}
      <div className="p-3.5 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 text-xs font-mono select-none">
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <span>Total Indicators: <b className="text-white bg-slate-800 px-2 py-0.5 rounded">{filteredRows.length} KPIs</b></span>
          <span>Cumulative Weighting: <b className="text-emerald-400 bg-slate-800 px-2 py-0.5 rounded">{totalWeight.toFixed(1)}%</b></span>
          <span>Active Filter: <b className="text-amber-300 bg-slate-800 px-2 py-0.5 rounded">{selectedUserFilter !== 'ALL' ? selectedUserFilter : 'All Users'}</b></span>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          <span>Supabase Cloud Synchronized</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
      </div>

      {/* Clear Grid Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600 mb-3">
              <div className="p-2 bg-rose-100 rounded-xl">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase text-slate-900">Clear SDBIP Grid</h3>
                <p className="text-xs text-slate-500 font-medium">This will clear all currently displayed SDBIP rows.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-6 font-medium">
              Are you sure you want to clear the entire SDBIP 2nd & 3rd layer table? You can re-populate it at any time by clicking "Sync Everyone's KPIs & KPAs".
            </p>
            <div className="flex justify-end gap-2 text-xs font-black">
              <button
                type="button"
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClearGrid}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow cursor-pointer"
              >
                Yes, Clear Grid
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Office Document Previewer */}
      {previewDoc && (
        <OfficeDocumentViewer doc={previewDoc} onClose={() => setPreviewDoc(null)} />
      )}

    </div>
  );
}
