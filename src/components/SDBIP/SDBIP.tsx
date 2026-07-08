import React, { useState, useEffect } from 'react';
import { Layers, Info, CheckCircle, Upload, Download, ArrowRight, Shield, AlertTriangle, HelpCircle, Check, FileText, Plus, Trash2, Database, FolderArchive, AlertCircle } from 'lucide-react';
import type { User } from '../../types';
import { SDBIPDraftingSuite } from './SDBIPDraftingSuite';
import { WordProcessor } from './WordProcessor';
import { DraftingSuiteTab } from '../APR/APR';

interface SDBIPProps {
  currentUser: User;
  activeTenantId: string;
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
}

export interface SdbipPoeFile {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  refNum: string;
}

export function SDBIP({ currentUser, activeTenantId }: SDBIPProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'table' | 'reporting' | 'drafting'>('brief');
  const [draftingSubTab, setDraftingSubTab] = useState<'chapters' | 'memo'>('chapters');
  const [rows, setRows] = useState<SdbipRow[]>([]);
  const [poes, setPoes] = useState<SdbipPoeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [poeModal, setPoeModal] = useState<{ isOpen: boolean; rowId: string | null; refNum: string }>({ isOpen: false, rowId: null, refNum: '' });
  const [poeFileName, setPoeFileName] = useState('');
  const [poeFileSize, setPoeFileSize] = useState('1.5 MB');
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

  // Fetch SDBIP rows and POEs from Supabase on load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/tenant/${activeTenantId}/sdbip`),
      fetch(`/api/tenant/${activeTenantId}/sdbip-poes`)
    ])
      .then(async ([rowsRes, poesRes]) => {
        const rowsData = await rowsRes.json();
        const poesData = await poesRes.json();
        
        // If no rows are loaded, generate 25 default blank template rows across
        if (rowsData && Array.isArray(rowsData.items) && rowsData.items.length > 0) {
          setRows(rowsData.items);
        } else {
          const templates: SdbipRow[] = Array.from({ length: 25 }, (_, idx) => ({
            id: `row-template-${idx + 1}`,
            refNum: `REF-0${idx + 1}`,
            strategicObj: 
              idx === 0 ? "To ensure reliable bulk water and electricity infrastructure" : 
              idx === 1 ? "To promote local agrarian, manufacturing and hospitality economy" : 
              idx === 2 ? "To provide effective institutional management and administrative support" :
              idx === 3 ? "To ensure sound financial management and municipal viability" :
              idx === 4 ? "To enhance good governance and public participation" :
              idx === 5 ? "To implement integrated spatial planning and land use management" : "",
            bsd: idx === 0 ? "Y" : "",
            led: idx === 1 ? "Y" : "",
            midt: idx === 2 ? "Y" : "",
            mfvm: idx === 3 ? "Y" : "",
            ggpp: idx === 4 ? "Y" : "",
            sr: idx === 5 ? "Y" : "",
            kpas: 
              idx === 0 ? "Water Infrastructure Upgrade" : 
              idx === 1 ? "Hospitality LED Co-op" : 
              idx === 2 ? "Institutional Capacity Building" :
              idx === 3 ? "Financial Systems Integration" :
              idx === 4 ? "Public Consultation Forums" :
              idx === 5 ? "Spatial Development Framework" : "",
            operationalActivity: "",
            kpi: "",
            compliance: 'compliant',
            uom: "",
            mscoaTracking: idx === 0 ? "Project" : "",
            baseline: "",
            annualTarget: "",
            budgetAllocation: "",
            q1: "",
            q2: "",
            q3: "",
            q4: "",
            responsibleUnit: "",
            poeStatus: "Not Uploaded"
          }));
          setRows(templates);
        }

        if (poesData && Array.isArray(poesData.poes)) {
          setPoes(poesData.poes);
        } else {
          setPoes([]);
        }
      })
      .catch(err => console.error("Error loading SDBIP data:", err))
      .finally(() => setLoading(false));
  }, [activeTenantId]);

  const saveRows = async (updatedRows: SdbipRow[]) => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ items: updatedRows })
      });
    } catch (err) {
      console.error("Failed to save SDBIP rows:", err);
    }
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

  const calcVar = (target: string | undefined, actual: string | undefined) => {
    const tVal = (target || '').trim();
    const aVal = (actual || '').trim();
    if (!tVal && !aVal) return '';
    
    const parseNum = (s: string) => {
      const cleaned = s.replace(/[^0-9.-]/g, '');
      return cleaned ? parseFloat(cleaned) : NaN;
    };

    const nT = parseNum(tVal);
    const nA = parseNum(aVal);

    if (isNaN(nT) || isNaN(nA)) return '';

    const diff = nT - nA;
    const prefix = tVal.startsWith('R') || aVal.startsWith('R') ? 'R ' : '';
    return prefix + diff.toLocaleString();
  };

  const handleCellChange = (rowId: string, field: keyof SdbipRow, value: any) => {
    const updated = rows.map(r => {
      if (r.id === rowId) {
        let updatedRow = { ...r, [field]: value };
        
        // Auto-calculate Mid Term values
        if (field === 'q1' || field === 'q2') {
          const midValue = combineInfo(updatedRow.q1, updatedRow.q2);
          updatedRow.midTerm = midValue;
          updatedRow.midTermTarget = midValue;
        } else if (field === 'q1Actual' || field === 'q2Actual') {
          updatedRow.midTermActual = combineInfo(updatedRow.q1Actual, updatedRow.q2Actual);
        }

        // Auto-calculate Variance for all quarters
        updatedRow.q1Variance = calcVar(updatedRow.q1, updatedRow.q1Actual);
        updatedRow.q2Variance = calcVar(updatedRow.q2, updatedRow.q2Actual);
        updatedRow.midTermVariance = calcVar(updatedRow.midTermTarget, updatedRow.midTermActual);
        updatedRow.q3Variance = calcVar(updatedRow.q3, updatedRow.q3Actual);
        updatedRow.q4Variance = calcVar(updatedRow.q4, updatedRow.q4Actual);
        
        return updatedRow;
      }
      return r;
    });
    setRows(updated);
    saveRows(updated);
  };

  const triggerUploadModal = (rowId: string, refNum: string) => {
    setPoeModal({ isOpen: true, rowId, refNum });
    setPoeFileName(`poe_evidence_ref_${refNum.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}.pdf`);
  };

  const handlePoeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poeFileName.trim()) return;

    if (!poeModal.rowId) return;

    // Append to virtual POEs list for Backup Archive
    const newPoe: SdbipPoeFile = {
      id: `poe-${Date.now()}`,
      name: poeFileName.trim(),
      type: 'SDBIP Portfolio of Evidence',
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      size: poeFileSize,
      refNum: poeModal.refNum
    };

    const updatedPoes = [newPoe, ...poes];
    setPoes(updatedPoes);
    savePoes(updatedPoes);

    // Update row cell to "Uploaded - Visit Backup"
    const updatedRows = rows.map(r => {
      if (r.id === poeModal.rowId) {
        return { ...r, poeStatus: 'Uploaded - Visit Backup' };
      }
      return r;
    });
    setRows(updatedRows);
    saveRows(updatedRows);

    setPoeModal({ isOpen: false, rowId: null, refNum: '' });
    setSuccessToast(`Document "${newPoe.name}" correctly stored in municipality SDBIP backup archive virtual folder!`);
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

  const deleteRowHandler = (rowId: string) => {
    if (confirm("Are you sure you want to delete this row from SDBIP top-layer?")) {
      const updated = rows.filter(r => r.id !== rowId);
      setRows(updated);
      saveRows(updated);
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Reference Number", "Strategic Objectives", "KPI", "BSD", "LED", "MFVM",
      "GGPP", "MIDT", "KPA Functional Area", "Operational Activity",
      "Compliance", "Unit of Measure", "mSCOA Tracking", "Baseline",
      "Annual Target", "Budget Allocation", "Weight", "Score",
      "Q1 Target", "Q1 Actual", "Q1 Variance", "Q1 Corrective",
      "Q2 Target", "Q2 Actual", "Q2 Variance", "Q2 Corrective",
      "Mid-Term Target", "Mid-Term Actual", "Mid-Term Variance", "Mid-Term Corrective",
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
      r.midTermTarget, r.midTermActual, r.midTermVariance, r.midTermCorrective,
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
        <div className="bg-emerald-50 border-y border-emerald-100 px-6 py-3 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          {successToast}
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
        {activeTab === 'table' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            
            {/* Toolbar controller */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl select-none text-slate-700">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold">Currently viewing: <strong className="text-slate-900 font-black">{rows.length}</strong> active SDBIP top layer log items. Click cells directly to modify text.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={exportToCSV}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
              </div>
            </div>

            {/* Large Wide Spreadsheet Table Container */}
            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl relative bg-white min-h-[400px]">
              
              <table className="w-full text-left border-collapse select-text table-fixed min-w-[2300px]">
                
                {/* Headers */}
                <thead className="sticky top-0 bg-slate-100 z-20 border-b-2 border-slate-200 text-[10px] font-black tracking-wider uppercase text-slate-700 font-mono">
                  <tr>
                    <th className="p-3 border-r border-slate-200 w-24 sticky left-0 z-30 bg-slate-100">REF NUMBER</th>
                    <th className="p-3 border-r border-slate-200 w-64">STRATEGIC OBJECTIVES</th>
                    <th className="p-3 border-r border-slate-200 w-64">KPI</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-blue-100 text-blue-900">BSD (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-emerald-100 text-emerald-900">LED (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-amber-100 text-amber-900">MFVM (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-purple-100 text-purple-900">GGPP (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-rose-100 text-rose-900">MIDT (X)</th>
                    <th className="p-3 border-r border-slate-200 w-52">KPA FUNCTIONAL AREA</th>
                    <th className="p-3 border-r border-slate-200 w-48">UNIT OF MEASURE</th>
                    <th className="p-3 border-r border-slate-200 w-44">MSCOA TRACKING</th>
                    <th className="p-3 border-r border-slate-200 w-40">BASELINE</th>
                    <th className="p-3 border-r border-slate-200 w-44">ANNUAL TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-40">BUDGET ALLOCATION</th>
                    <th className="p-3 border-r border-slate-200 w-32">1ST QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-32">2ND QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-32 text-center bg-rose-100 text-rose-900">MID TERM</th>
                    <th className="p-3 border-r border-slate-200 w-32">3RD QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-32">4TH QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-48">RESPONSIBLE UNIT</th>
                    <th className="p-3 border-r border-slate-200 w-48 text-center bg-indigo-50 text-indigo-900 border-l border-indigo-200">POE AND DESCRIPTION</th>
                    <th className="p-3 w-16 text-center">ACTIONS</th>
                  </tr>
                </thead>

                {/* Body Rows */}
                <tbody className="text-xs font-medium text-slate-800 divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      
                      {/* Ref Num */}
                      <td className="p-2 border-r border-slate-150 sticky left-0 z-10 bg-white drop-shadow-[1px_0_0_rgba(203,213,225,1)]">
                        <input 
                          type="text" 
                          value={row.refNum || ''}
                          onChange={(e) => handleCellChange(row.id, 'refNum', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px] font-mono"
                        />
                      </td>

                      {/* Strategic Objectives */}
                      <td className="p-2 border-r border-slate-150">
                        <textarea 
                          rows={2}
                          value={row.strategicObj || ''}
                          onChange={(e) => handleCellChange(row.id, 'strategicObj', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px] resize min-h-[40px] leading-tight"
                        />
                      </td>

                      {/* KPI */}
                      <td className="p-2 border-r border-slate-150">
                        <textarea 
                          rows={2}
                          value={row.kpi || ''}
                          onChange={(e) => handleCellChange(row.id, 'kpi', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px] resize min-h-[40px] leading-tight"
                        />
                      </td>
                      <td className="p-2 border-r border-slate-150 text-center bg-blue-50/50">
                        <input 
                          type="text" 
                          value={row.bsd || ''}
                          onChange={(e) => handleCellChange(row.id, 'bsd', e.target.value)}
                          className="w-8 mx-auto bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-center font-bold text-blue-900"
                        />
                      </td>

                      {/* LED */}
                      <td className="p-2 border-r border-slate-150 text-center bg-emerald-50/50">
                        <input 
                          type="text" 
                          value={row.led || ''}
                          onChange={(e) => handleCellChange(row.id, 'led', e.target.value)}
                          className="w-8 mx-auto bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-center font-bold text-emerald-900"
                        />
                      </td>

                      {/* MFVM */}
                      <td className="p-2 border-r border-slate-150 text-center bg-amber-50/50">
                        <input 
                          type="text" 
                          value={row.mfvm || ''}
                          onChange={(e) => handleCellChange(row.id, 'mfvm', e.target.value)}
                          className="w-8 mx-auto bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-center font-bold text-amber-900"
                        />
                      </td>

                      {/* GGPP */}
                      <td className="p-2 border-r border-slate-150 text-center bg-purple-50/50">
                        <input 
                          type="text" 
                          value={row.ggpp || ''}
                          onChange={(e) => handleCellChange(row.id, 'ggpp', e.target.value)}
                          className="w-8 mx-auto bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-center font-bold text-purple-900"
                        />
                      </td>

                      {/* MIDT (Institutional Development) */}
                      <td className="p-2 border-r border-slate-150 text-center bg-rose-50/50">
                        <input 
                          type="text" 
                          value={row.midt || ''}
                          onChange={(e) => handleCellChange(row.id, 'midt', e.target.value)}
                          className="w-8 mx-auto bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-center font-bold text-rose-900"
                        />
                      </td>

                      <td className="p-2 border-r border-slate-150">
                        <textarea 
                          rows={2}
                          value={row.kpas || ''}
                          onChange={(e) => handleCellChange(row.id, 'kpas', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded font-bold text-slate-900 resize min-h-[40px] text-[11px]"
                        />
                      </td>

                      {/* Unit of Measure */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.uom || ''}
                          onChange={(e) => handleCellChange(row.id, 'uom', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                        />
                      </td>

                      {/* mSCOA Tracking */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.mscoaTracking || ''}
                          onChange={(e) => handleCellChange(row.id, 'mscoaTracking', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded font-mono text-[11px]"
                        />
                      </td>

                      {/* Baseline */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.baseline || ''}
                          onChange={(e) => handleCellChange(row.id, 'baseline', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                        />
                      </td>

                      {/* Annual Target */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.annualTarget || ''}
                          onChange={(e) => handleCellChange(row.id, 'annualTarget', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                        />
                      </td>

                      {/* Budget Allocation */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.budgetAllocation || ''}
                          onChange={(e) => handleCellChange(row.id, 'budgetAllocation', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded font-bold text-[11px] text-slate-700"
                        />
                      </td>

                      {/* Q1 */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.q1 || ''}
                          onChange={(e) => handleCellChange(row.id, 'q1', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                        />
                      </td>

                      {/* Q2 */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.q2 || ''}
                          onChange={(e) => handleCellChange(row.id, 'q2', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                        />
                      </td>

                      {/* MID TERM Targets (Calculated) */}
                      <td className="p-2 border-r border-slate-150 text-center bg-rose-50/50">
                        <input 
                          type="text" 
                          value={row.midTerm || ''}
                          readOnly
                          className="w-full bg-transparent border-0 p-1 rounded text-center font-bold text-rose-900 text-[11px]"
                        />
                      </td>

                      {/* Q3 */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.q3 || ''}
                          onChange={(e) => handleCellChange(row.id, 'q3', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                        />
                      </td>

                      {/* Q4 */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.q4 || ''}
                          onChange={(e) => handleCellChange(row.id, 'q4', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                        />
                      </td>

                      {/* Responsible Unit */}
                      <td className="p-2 border-r border-slate-150">
                        <input 
                          type="text" 
                          value={row.responsibleUnit || ''}
                          onChange={(e) => handleCellChange(row.id, 'responsibleUnit', e.target.value)}
                          className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                        />
                      </td>

                      {/* POE Upload with redirect indicators as instructed */}
                      <td className="p-2 border-r border-indigo-200 text-center bg-indigo-50/40">
                        {row.poeStatus.includes('Uploaded') ? (
                          <div className="flex flex-col items-center gap-1 select-none">
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-1 rounded-md border border-emerald-200">
                              Uploaded - Visit Backup
                            </span>
                            <button 
                              onClick={() => triggerUploadModal(row.id, row.refNum)}
                              className="text-[9px] text-[#4F46E5] hover:underline font-bold"
                            >
                              Update document
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => triggerUploadModal(row.id, row.refNum)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 hover:scale-[1.02] duration-150"
                          >
                            <Upload className="w-3 h-3" /> Upload Link
                          </button>
                        )}
                      </td>

                      {/* Action columns */}
                      <td className="p-2 text-center h-full">
                        <button 
                          onClick={() => deleteRowHandler(row.id)}
                          className="text-slate-300 hover:text-rose-500 transition-colors"
                          title="Delete SDBIP line"
                        >
                          <Trash2 className="w-3.5 h-3.5 mx-auto" />
                        </button>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>

            </div>

            {/* Quick Add Form Row helper at the bottom of spreadsheet */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl select-none">
              <h4 className="text-xs font-black text-slate-900 uppercase mb-3 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-indigo-600" />
                Capture Multi-Column SDBIP Top-Layer Row Unit
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                <input 
                  type="text"
                  placeholder="Reference No. (e.g. SDBIP-205)"
                  value={newRowData.refNum || ''}
                  onChange={(e) => setNewRowData(p => ({ ...p, refNum: e.target.value }))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-505"
                />
                <input 
                  type="text"
                  placeholder="Strategic Objectives Link"
                  value={newRowData.strategicObj || ''}
                  onChange={(e) => setNewRowData(p => ({ ...p, strategicObj: e.target.value }))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-505"
                />
                <input 
                  type="text"
                  placeholder="KPA Functional Area"
                  value={newRowData.kpas || ''}
                  onChange={(e) => setNewRowData(p => ({ ...p, kpas: e.target.value }))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-505"
                />
                <input 
                  type="text"
                  placeholder="Key Performance Indicator (KPI)"
                  value={newRowData.kpi || ''}
                  onChange={(e) => setNewRowData(p => ({ ...p, kpi: e.target.value }))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-505"
                />
                <input 
                  type="text"
                  placeholder="mSCOA segment alignment"
                  value={newRowData.mscoaTracking || ''}
                  onChange={(e) => setNewRowData(p => ({ ...p, mscoaTracking: e.target.value }))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-505"
                />
                <input 
                  type="text"
                  placeholder="Annual target"
                  value={newRowData.annualTarget || ''}
                  onChange={(e) => setNewRowData(p => ({ ...p, annualTarget: e.target.value }))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-505"
                />
                <input 
                  type="text"
                  placeholder="Budget (e.g. R 4,200,000)"
                  value={newRowData.budgetAllocation || ''}
                  onChange={(e) => setNewRowData(p => ({ ...p, budgetAllocation: e.target.value }))}
                  className="px-3 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:border-indigo-505"
                />
                <button 
                  onClick={addRow}
                  className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition"
                >
                  Append SDBIP Row
                </button>
              </div>
            </div>

          </div>
        )}

        {/* REPORTING TAB */}
        {activeTab === 'reporting' && (
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-50 p-4 border border-slate-200 rounded-xl select-none text-slate-700">
              <div className="flex items-center gap-3">
                <Database className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-bold">Currently reporting on: <strong className="text-slate-900 font-black">{rows.length}</strong> SDBIP top layer items. All fields are editable and auto-expand.</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button 
                  onClick={exportToCSV}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export reporting data
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto border border-slate-200 rounded-xl relative bg-white min-h-[400px]">
              <table className="w-full text-left border-collapse table-fixed min-w-[5000px]">
                <thead className="sticky top-0 bg-slate-100 z-20 border-b-2 border-slate-200 text-[10px] font-black tracking-wider uppercase text-slate-700 font-mono">
                  <tr>
                    {/* Fixed Info Columns */}
                    <th className="p-3 border-r border-slate-200 w-24 sticky left-0 z-30 bg-slate-100">REF NUMBER</th>
                    <th className="p-3 border-r border-slate-200 w-64">STRATEGIC OBJECTIVES</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-blue-100 text-blue-900">BSD (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-emerald-100 text-emerald-900">LED (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-amber-100 text-amber-900">MFVM (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-indigo-100 text-indigo-900">GGPP (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center bg-rose-100 text-rose-900">MIDT (X)</th>
                    <th className="p-3 border-r border-slate-200 w-64">KPI</th>
                    <th className="p-3 border-r border-slate-200 w-52">KPA FUNCTIONAL AREA</th>
                    <th className="p-3 border-r border-slate-200 w-44">ANNUAL TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-32 text-center bg-slate-200 text-slate-900">RAG STATUS</th>

                    {/* Q1 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-32 bg-indigo-50 text-indigo-900">Q1 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-indigo-100 text-indigo-900 border-b-2 border-indigo-200">Q1 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-indigo-200 text-indigo-950 border-b-2 border-indigo-300">Q1 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 bg-indigo-300 text-indigo-950 border-b-2 border-indigo-400">Q1 CORRECTIVE MEASURE</th>

                    {/* Q2 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-32 bg-blue-50 text-blue-900">Q2 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-blue-100 text-blue-900 border-b-2 border-blue-200">Q2 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-blue-200 text-blue-950 border-b-2 border-blue-300">Q2 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 bg-blue-300 text-blue-950 border-b-2 border-blue-400">Q2 CORRECTIVE MEASURE</th>

                    {/* Mid Term Reporting */}
                    <th className="p-3 border-r border-slate-200 w-32 bg-emerald-50 text-emerald-900 border-b-2 border-emerald-100">MID TERM TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-emerald-100 text-emerald-900 border-b-2 border-emerald-200">MID TERM ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-emerald-200 text-emerald-900 border-b-2 border-emerald-300">MID TERM VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 bg-emerald-300 text-emerald-950 border-b-2 border-emerald-400">MID TERM CORRECTIVE MEASURE</th>

                    {/* Q3 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-32 bg-amber-50 text-amber-900">Q3 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-amber-100 text-amber-900 border-b-2 border-amber-200">Q3 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-amber-200 text-amber-950 border-b-2 border-amber-300">Q3 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 bg-amber-300 text-amber-950 border-b-2 border-amber-400">Q3 CORRECTIVE MEASURE</th>

                    {/* Q4 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-32 bg-rose-50 text-rose-900">Q4 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-rose-100 text-rose-900 border-b-2 border-rose-200">Q4 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 bg-rose-200 text-rose-950 border-b-2 border-rose-300">Q4 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 bg-rose-300 text-rose-950 border-b-2 border-rose-400">Q4 CORRECTIVE MEASURE</th>

                    <th className="p-3 w-28 text-center bg-slate-50 text-slate-900 border-b-2 border-slate-200 font-bold">SCORE</th>
                  </tr>
                </thead>

                <tbody className="text-xs font-medium text-slate-800 divide-y divide-slate-100">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-2 border-r border-slate-150 sticky left-0 z-10 bg-white font-mono text-[11px]">{row.refNum}</td>
                      <td className="p-2 border-r border-slate-150 text-[11px] leading-tight text-slate-500 overflow-hidden text-ellipsis whitespace-normal">{row.strategicObj}</td>
                      <td className="p-2 border-r border-slate-150 text-center bg-blue-50/30 font-bold text-blue-600">{row.bsd}</td>
                      <td className="p-2 border-r border-slate-150 text-center bg-emerald-50/30 font-bold text-emerald-600">{row.led}</td>
                      <td className="p-2 border-r border-slate-150 text-center bg-amber-50/30 font-bold text-amber-600">{row.mfvm}</td>
                      <td className="p-2 border-r border-slate-150 text-center bg-indigo-50/30 font-bold text-indigo-600">{row.ggpp}</td>
                      <td className="p-2 border-r border-slate-150 text-center bg-rose-50/30 font-bold text-rose-600">{row.midt}</td>
                      <td className="p-2 border-r border-slate-150 text-[11px] leading-tight font-bold text-slate-700">{row.kpi}</td>
                      <td className="p-2 border-r border-slate-150 text-[11px] text-slate-500">{row.kpas}</td>
                      <td className="p-2 border-r border-slate-150 text-[11px] font-black text-indigo-700">{row.annualTarget}</td>
                      
                      {/* RAG Status */}
                      <td className="p-2 border-r border-slate-150 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button 
                            onClick={() => handleCellChange(row.id, 'ragStatus', 'red')}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${row.ragStatus === 'red' ? 'bg-red-500 border-red-700 shadow-inner' : 'bg-red-200 border-red-300 hover:bg-red-300'}`}
                            title="Not Complete"
                          >
                            {row.ragStatus === 'red' && <span className="text-[10px]">☹️</span>}
                          </button>
                          <button 
                            onClick={() => handleCellChange(row.id, 'ragStatus', 'amber')}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${row.ragStatus === 'amber' ? 'bg-amber-500 border-amber-700 shadow-inner' : 'bg-amber-200 border-amber-300 hover:bg-amber-300'}`}
                            title="In Progress"
                          >
                            {row.ragStatus === 'amber' && <span className="text-[10px]">😐</span>}
                          </button>
                          <button 
                            onClick={() => handleCellChange(row.id, 'ragStatus', 'green')}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${row.ragStatus === 'green' ? 'bg-emerald-500 border-emerald-700 shadow-inner' : 'bg-emerald-200 border-emerald-300 hover:bg-emerald-300'}`}
                            title="Complete"
                          >
                            {row.ragStatus === 'green' && <span className="text-[10px]">😊</span>}
                          </button>
                        </div>
                      </td>

                      {/* Q1 Reporting Inputs */}
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/20">
                        <div className="mb-2 font-bold text-indigo-900">{row.q1}</div>
                        <div className="relative inline-block w-full">
                          <button className={`w-full py-1 text-[9px] font-bold rounded border ${row.q1Poes && row.q1Poes.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'} transition-colors flex items-center justify-center gap-1`}>
                            <Upload className="w-2.5 h-2.5" /> {row.q1Poes && row.q1Poes.length > 0 ? `${row.q1Poes.length} POE attached` : 'Upload POE'}
                          </button>
                          <input 
                            type="file" multiple 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            onChange={(e) => {
                              if (!e.target.files) return;
                              const names = Array.from(e.target.files).map(f => f.name);
                              handleCellChange(row.id, 'q1Poes', [...(row.q1Poes || []), ...names] as any);
                              handleCellChange(row.id, 'poeStatus', 'Attached');
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/5 relative group">
                        <textarea rows={3} value={row.q1Actual || ''} onChange={(e) => handleCellChange(row.id, 'q1Actual', e.target.value)} className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]" placeholder="Q1 Actual..." />
                        {row.q1Actual && row.q1 && row.q1Actual !== row.q1 && (
                          <div className="absolute top-1 right-1">
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
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/5">
                        <div className="w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold text-slate-700 min-h-[40px]">
                          {row.q1Variance || ''}
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/5">
                        <textarea rows={3} value={row.q1Corrective || ''} onChange={(e) => handleCellChange(row.id, 'q1Corrective', e.target.value)} className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]" placeholder="Q1 Corrective..." />
                      </td>

                      {/* Q2 Reporting Inputs */}
                      <td className="p-2 border-r border-slate-100 bg-blue-50/20">
                        <div className="mb-2 font-bold text-blue-900">{row.q2}</div>
                        <div className="relative inline-block w-full">
                          <button className={`w-full py-1 text-[9px] font-bold rounded border ${row.q2Poes && row.q2Poes.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'} transition-colors flex items-center justify-center gap-1`}>
                            <Upload className="w-2.5 h-2.5" /> {row.q2Poes && row.q2Poes.length > 0 ? `${row.q2Poes.length} POE attached` : 'Upload POE'}
                          </button>
                          <input 
                            type="file" multiple 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            onChange={(e) => {
                              if (!e.target.files) return;
                              const names = Array.from(e.target.files).map(f => f.name);
                              handleCellChange(row.id, 'q2Poes', [...(row.q2Poes || []), ...names] as any);
                              handleCellChange(row.id, 'poeStatus', 'Attached');
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-blue-50/5 relative">
                        <textarea rows={3} value={row.q2Actual || ''} onChange={(e) => handleCellChange(row.id, 'q2Actual', e.target.value)} className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-blue-300 rounded text-[11px]" placeholder="Q2 Actual..." />
                        {row.q2Actual && row.q2 && row.q2Actual !== row.q2 && (
                          <div className="absolute top-1 right-1">
                            <div className="relative group/tip">
                              <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse cursor-help" />
                              <div className="absolute bottom-full right-0 mb-1 hidden group-hover/tip:block z-50">
                                <div className="bg-rose-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap border border-rose-700">
                                  <div className="font-bold border-b border-rose-800 pb-1 mb-1">Target Discrepancy</div>
                                  <div>Target: {row.q2}</div>
                                  <div>Actual: {row.q2Actual}</div>
                                  <div className="mt-1 text-rose-200">Please provide variance explanation.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-blue-50/5">
                        <div className="w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold text-slate-700 min-h-[40px]">
                          {row.q2Variance || ''}
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-blue-50/5">
                        <textarea rows={3} value={row.q2Corrective || ''} onChange={(e) => handleCellChange(row.id, 'q2Corrective', e.target.value)} className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-blue-300 rounded text-[11px]" placeholder="Q2 Corrective..." />
                      </td>

                      {/* Mid Term Reporting Inputs */}
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20">
                        <div className="mb-2 font-bold text-emerald-900 bg-white border border-slate-200 p-1 rounded text-[11px]">
                          {row.midTermTarget || ''}
                        </div>
                        <div className="relative inline-block w-full">
                          <button className={`w-full py-1 text-[9px] font-bold rounded border ${row.midTermPoes && row.midTermPoes.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'} transition-colors flex items-center justify-center gap-1`}>
                            <Upload className="w-2.5 h-2.5" /> {row.midTermPoes && row.midTermPoes.length > 0 ? `${row.midTermPoes.length} POE attached` : 'Upload POE'}
                          </button>
                          <input 
                            type="file" multiple 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            onChange={(e) => {
                              if (!e.target.files) return;
                              const names = Array.from(e.target.files).map(f => f.name);
                              handleCellChange(row.id, 'midTermPoes', [...(row.midTermPoes || []), ...names] as any);
                              handleCellChange(row.id, 'poeStatus', 'Attached');
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/5 relative">
                        <div className="w-full bg-white border border-emerald-100 p-1 rounded text-[11px] min-h-[40px] font-bold text-emerald-700 mb-1">
                          {row.midTermActual || ''}
                        </div>
                        {row.midTermActual && row.midTermTarget && row.midTermActual !== row.midTermTarget && (
                          <div className="absolute top-1 right-1">
                            <div className="relative group/tip">
                              <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse cursor-help" />
                              <div className="absolute bottom-full right-0 mb-1 hidden group-hover/tip:block z-50">
                                <div className="bg-rose-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap border border-rose-700">
                                  <div className="font-bold border-b border-rose-800 pb-1 mb-1">Target Discrepancy</div>
                                  <div>Target: {row.midTermTarget}</div>
                                  <div>Actual: {row.midTermActual}</div>
                                  <div className="mt-1 text-rose-200">Please provide variance explanation.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/5">
                        <div className="w-full bg-white border border-emerald-100 p-1 rounded text-[11px] font-bold text-emerald-800 min-h-[40px]">
                          {row.midTermVariance || ''}
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/5">
                        <textarea rows={3} value={row.midTermCorrective || ''} onChange={(e) => handleCellChange(row.id, 'midTermCorrective', e.target.value)} className="w-full bg-white border border-emerald-100 p-1 focus:ring-1 focus:ring-emerald-300 rounded text-[11px]" placeholder="Mid-Term Corrective..." />
                      </td>

                      {/* Q3 Reporting Inputs */}
                      <td className="p-2 border-r border-slate-100 bg-amber-50/20">
                        <div className="mb-2 font-bold text-amber-900">{row.q3}</div>
                        <div className="relative inline-block w-full">
                          <button className={`w-full py-1 text-[9px] font-bold rounded border ${row.q3Poes && row.q3Poes.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'} transition-colors flex items-center justify-center gap-1`}>
                            <Upload className="w-2.5 h-2.5" /> {row.q3Poes && row.q3Poes.length > 0 ? `${row.q3Poes.length} POE attached` : 'Upload POE'}
                          </button>
                          <input 
                            type="file" multiple 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            onChange={(e) => {
                              if (!e.target.files) return;
                              const names = Array.from(e.target.files).map(f => f.name);
                              handleCellChange(row.id, 'q3Poes', [...(row.q3Poes || []), ...names] as any);
                              handleCellChange(row.id, 'poeStatus', 'Attached');
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-amber-50/5 relative">
                        <textarea rows={3} value={row.q3Actual || ''} onChange={(e) => handleCellChange(row.id, 'q3Actual', e.target.value)} className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-amber-300 rounded text-[11px]" placeholder="Q3 Actual..." />
                        {row.q3Actual && row.q3 && row.q3Actual !== row.q3 && (
                          <div className="absolute top-1 right-1">
                            <div className="relative group/tip">
                              <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse cursor-help" />
                              <div className="absolute bottom-full right-0 mb-1 hidden group-hover/tip:block z-50">
                                <div className="bg-rose-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap border border-rose-700">
                                  <div className="font-bold border-b border-rose-800 pb-1 mb-1">Target Discrepancy</div>
                                  <div>Target: {row.q3}</div>
                                  <div>Actual: {row.q3Actual}</div>
                                  <div className="mt-1 text-rose-200">Please provide variance explanation.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-amber-50/5">
                        <div className="w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold text-slate-700 min-h-[40px]">
                          {row.q3Variance || ''}
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-amber-50/5">
                        <textarea rows={3} value={row.q3Corrective || ''} onChange={(e) => handleCellChange(row.id, 'q3Corrective', e.target.value)} className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-amber-300 rounded text-[11px]" placeholder="Q3 Corrective..." />
                      </td>

                      {/* Q4 Reporting Inputs */}
                      <td className="p-2 border-r border-slate-100 bg-rose-50/20">
                        <div className="mb-2 font-bold text-rose-900">{row.q4}</div>
                        <div className="relative inline-block w-full">
                          <button className={`w-full py-1 text-[9px] font-bold rounded border ${row.q4Poes && row.q4Poes.length > 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'} transition-colors flex items-center justify-center gap-1`}>
                            <Upload className="w-2.5 h-2.5" /> {row.q4Poes && row.q4Poes.length > 0 ? `${row.q4Poes.length} POE attached` : 'Upload POE'}
                          </button>
                          <input 
                            type="file" multiple 
                            className="absolute inset-0 opacity-0 cursor-pointer w-full"
                            onChange={(e) => {
                              if (!e.target.files) return;
                              const names = Array.from(e.target.files).map(f => f.name);
                              handleCellChange(row.id, 'q4Poes', [...(row.q4Poes || []), ...names] as any);
                              handleCellChange(row.id, 'poeStatus', 'Attached');
                            }}
                          />
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-rose-50/5 relative">
                        <textarea rows={3} value={row.q4Actual || ''} onChange={(e) => handleCellChange(row.id, 'q4Actual', e.target.value)} className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-rose-300 rounded text-[11px]" placeholder="Q4 Actual..." />
                        {row.q4Actual && row.q4 && row.q4Actual !== row.q4 && (
                          <div className="absolute top-1 right-1">
                            <div className="relative group/tip">
                              <AlertCircle className="w-3 h-3 text-rose-500 animate-pulse cursor-help" />
                              <div className="absolute bottom-full right-0 mb-1 hidden group-hover/tip:block z-50">
                                <div className="bg-rose-900 text-white text-[10px] p-2 rounded shadow-lg whitespace-nowrap border border-rose-700">
                                  <div className="font-bold border-b border-rose-800 pb-1 mb-1">Target Discrepancy</div>
                                  <div>Target: {row.q4}</div>
                                  <div>Actual: {row.q4Actual}</div>
                                  <div className="mt-1 text-rose-200">Please provide variance explanation.</div>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-rose-50/5">
                        <div className="w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold text-slate-700 min-h-[40px]">
                          {row.q4Variance || ''}
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-rose-50/5">
                        <textarea rows={3} value={row.q4Corrective || ''} onChange={(e) => handleCellChange(row.id, 'q4Corrective', e.target.value)} className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-rose-300 rounded text-[11px]" placeholder="Q4 Corrective..." />
                      </td>

                      <td className="p-2 text-center text-[10px] text-slate-500">
                        <input
                          type="text"
                          value={row.score || ''}
                          onChange={(e) => handleCellChange(row.id, 'score', e.target.value)}
                          className="w-16 mx-auto bg-white border border-slate-200 p-1 rounded font-bold text-center font-mono focus:ring-1 focus:ring-indigo-300"
                          placeholder="Score"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5 animate-fade-in text-slate-800">
            
            <div className="border-b border-slate-100 pb-3 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase text-slate-900">Upload Portfolio of Evidence (POE)</h3>
                <p className="text-[10px] text-slate-500">Ref: {poeModal.refNum} (Stored per municipality under /sdbip/ unique folder)</p>
              </div>
            </div>

            <form onSubmit={handlePoeSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Document File Name</label>
                <input 
                  type="text" 
                  value={poeFileName}
                  onChange={(e) => setPoeFileName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-800 font-semibold"
                  placeholder="poe_evidence.pdf"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">File size</label>
                  <select 
                    value={poeFileSize}
                    onChange={(e) => setPoeFileSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-xl cursor-not-allowed bg-slate-50"
                    disabled
                  >
                    <option value="1.5 MB">1.5 MB</option>
                    <option value="2.8 MB">2.8 MB</option>
                    <option value="4.2 MB">4.2 MB</option>
                    <option value="5.6 MB">5.6 MB</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Format</label>
                  <span className="w-full block px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-500 font-bold rounded-xl font-mono">
                    PDF / COMPLIANT DOCUMENT
                  </span>
                </div>
              </div>

              <div className="p-3 bg-indigo-50 text-[11px] text-indigo-950 font-medium rounded-xl flex items-start gap-2 border border-indigo-100/50">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-snug">Uploading this file automatically archives it inside the active municipality's Backup Archive. The table cell will update in real-time accordingly.</p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setPoeModal({ isOpen: false, rowId: null, refNum: '' })}
                  className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 font-bold text-xs"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg"
                >
                  Simulate Upload & Save
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
