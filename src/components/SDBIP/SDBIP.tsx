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
}

const isOpex = (budget: string): boolean => {
  return budget ? budget.toLowerCase().includes('opex') : false;
};

const parseBudgetNum = (budgetStr: string): number => {
  if (!budgetStr) return 0;
  const clean = budgetStr.replace(/[^\d]/g, '');
  return parseInt(clean, 10) || 0;
};

const isFieldDisabled = (variance: string | undefined): boolean => {
  if (!variance) return true;
  const clean = variance.replace(/[^0-9.-]/g, '').trim();
  if (clean === '0' || clean === '-0' || clean === '') return true;
  const num = parseFloat(clean);
  return isNaN(num) || num === 0;
};

export interface SdbipPoeFile {
  id: string;
  name: string;
  type: string;
  date: string;
  size: string;
  refNum: string;
  description?: string;
}

export function SDBIP({ currentUser, activeTenantId }: SDBIPProps) {
  const [activeTab, setActiveTab] = useState<'brief' | 'table' | 'reporting' | 'drafting'>('brief');
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
  const [poeFileName, setPoeFileName] = useState('');
  const [poeFileSize, setPoeFileSize] = useState('1.5 MB');
  const [poeDescription, setPoeDescription] = useState('');
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ rowId: string; type: 'row' | 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' } | null>(null);

  // Smart Filtering states
  const [searchRef, setSearchRef] = useState('');
  const [selectedKpa, setSelectedKpa] = useState('ALL');
  const [selectedNationalKpa, setSelectedNationalKpa] = useState('ALL');

  // Computed unique KPA functional areas
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

      // 2. Filter by KPA Functional Area
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
  }, [rows, searchRef, selectedKpa, selectedNationalKpa]);

  const renderSmartFilterPanel = () => {
    return (
      <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
          <span className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></span>
          <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-700">SDBIP Scorecard Smart Filter Panel</h4>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          {/* 1. Search Bar */}
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

          {/* 2. KPA Functional Area Filter */}
          <div className="space-y-1">
            <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
              KPA Functional Area
            </label>
            <select
              value={selectedKpa}
              onChange={(e) => setSelectedKpa(e.target.value)}
              className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-300 rounded-lg p-2 text-xs text-slate-800 focus:outline-none transition-all"
            >
              <option value="ALL">All Functional Areas ({uniqueKpas.length})</option>
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
            {(searchRef || selectedKpa !== 'ALL' || selectedNationalKpa !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchRef('');
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

  const calcAnnualTarget = (q1: string | undefined, q2: string | undefined, q3: string | undefined, q4: string | undefined) => {
    const q1Val = (q1 || '').trim();
    const q2Val = (q2 || '').trim();
    const q3Val = (q3 || '').trim();
    const q4Val = (q4 || '').trim();
    if (!q1Val && !q2Val && !q3Val && !q4Val) return '';

    const parseNum = (s: string) => {
      const cleaned = s.replace(/[^0-9.-]/g, '');
      return cleaned ? parseFloat(cleaned) : NaN;
    };

    const n1 = parseNum(q1Val);
    const n2 = parseNum(q2Val);
    const n3 = parseNum(q3Val);
    const n4 = parseNum(q4Val);

    const numbers = [n1, n2, n3, n4].filter(n => !isNaN(n));
    if (numbers.length > 0) {
      const total = numbers.reduce((sum, val) => sum + val, 0);
      const hasR = q1Val.startsWith('R') || q2Val.startsWith('R') || q3Val.startsWith('R') || q4Val.startsWith('R');
      return (hasR ? 'R ' : '') + total.toLocaleString();
    }

    return [q1Val, q2Val, q3Val, q4Val].filter(Boolean).join(' + ');
  };

  const getRagDetails = (row: SdbipRow) => {
    const quarters = [
      { target: row.q1, actual: row.q1Actual },
      { target: row.q2, actual: row.q2Actual },
      { target: row.q3, actual: row.q3Actual },
      { target: row.q4, actual: row.q4Actual }
    ];

    const parseNum = (s: string | undefined) => {
      if (s === undefined || s === null) return NaN;
      const cleaned = s.toString().replace(/[^0-9.-]/g, '');
      if (!cleaned) return NaN;
      return parseFloat(cleaned);
    };

    let totalTarget = 0;
    let totalActual = 0;
    let hasReportingData = false;

    for (const q of quarters) {
      const t = parseNum(q.target);
      const a = parseNum(q.actual);

      if (!isNaN(t) && !isNaN(a)) {
        totalTarget += t;
        totalActual += a;
        hasReportingData = true;
      }
    }

    if (!hasReportingData) {
      return {
        status: 'none' as const,
        face: '😐',
        label: 'No Data',
        bgClass: 'bg-slate-50',
        borderClass: 'border-slate-200',
        textClass: 'text-slate-500',
        tooltip: 'No target/actual data entered.'
      };
    }

    if (totalTarget === 0) {
      if (totalActual >= 0) {
        return {
          status: 'green' as const,
          face: '😊',
          label: 'Happy',
          bgClass: 'bg-emerald-50',
          borderClass: 'border-emerald-200',
          textClass: 'text-emerald-700',
          tooltip: 'No target set, performance is positive.'
        };
      } else {
        return {
          status: 'red' as const,
          face: '😡',
          label: 'Angry',
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
        face: '😊',
        label: 'Happy',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
        textClass: 'text-emerald-700',
        tooltip: `Exceeds or meets target! Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
      };
    } else if (achievementRate >= 0.70) {
      return {
        status: 'amber' as const,
        face: '☹️',
        label: 'Sad',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        textClass: 'text-amber-700',
        tooltip: `Under target with minor variance. Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
      };
    } else {
      return {
        status: 'red' as const,
        face: '😡',
        label: 'Angry',
        bgClass: 'bg-rose-50',
        borderClass: 'border-rose-200',
        textClass: 'text-rose-700',
        tooltip: `Significant underperformance. Achievement Rate: ${ratePercent}% (${totalActual} actual vs ${totalTarget} target)`
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
        updatedRow.q1Variance = calcVar(updatedRow.q1, updatedRow.q1Actual);
        updatedRow.q2Variance = calcVar(updatedRow.q2, updatedRow.q2Actual);
        updatedRow.midTermVariance = calcVar(updatedRow.midTermTarget, updatedRow.midTermActual);
        updatedRow.q3Variance = calcVar(updatedRow.q3, updatedRow.q3Actual);
        updatedRow.q4Variance = calcVar(updatedRow.q4, updatedRow.q4Actual);
        
        // Auto-calculate RAG Status if actual or target values change
        if (field === 'q1' || field === 'q2' || field === 'q3' || field === 'q4' ||
            field === 'q1Actual' || field === 'q2Actual' || field === 'q3Actual' || field === 'q4Actual') {
          updatedRow.ragStatus = calculateRagStatus(updatedRow);
        }

        return updatedRow;
      }
      return r;
    });
    setRows(updated);
    saveRows(updated);
  };

  const triggerUploadModal = (rowId: string, refNum: string, quarter: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'general' = 'general') => {
    setPoeModal({ isOpen: true, rowId, refNum, quarter });
    const suffix = quarter !== 'general' ? `_${quarter}` : '';
    setPoeFileName(`poe_evidence_ref_${refNum.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}${suffix}.pdf`);
    
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

  const handlePoeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poeFileName.trim()) return;

    if (!poeModal.rowId) return;
    const quarter = poeModal.quarter || 'general';

    // Append to virtual POEs list for Backup Archive
    const newPoe: SdbipPoeFile = {
      id: `poe-${Date.now()}`,
      name: poeFileName.trim(),
      type: `${quarter !== 'general' ? quarter.toUpperCase() + ' ' : ''}SDBIP Portfolio of Evidence`,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      size: poeFileSize,
      refNum: poeModal.refNum,
      description: poeDescription.trim()
    };

    const updatedPoes = [newPoe, ...poes];
    setPoes(updatedPoes);
    savePoes(updatedPoes);

    // Update row cell & its correct poe fields
    const updatedRows = rows.map(r => {
      if (r.id === poeModal.rowId) {
        const u = { ...r };
        if (quarter === 'general') {
          u.poeStatus = 'Uploaded - Visit Backup';
          u.poeDesc = poeDescription.trim();
        } else if (quarter === 'q1') {
          u.q1Poes = Array.from(new Set([...(u.q1Poes || []), poeFileName.trim()]));
          u.q1PoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        } else if (quarter === 'q2') {
          u.q2Poes = Array.from(new Set([...(u.q2Poes || []), poeFileName.trim()]));
          u.q2PoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        } else if (quarter === 'midTerm') {
          u.midTermPoes = Array.from(new Set([...(u.midTermPoes || []), poeFileName.trim()]));
          u.midTermPoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        } else if (quarter === 'q3') {
          u.q3Poes = Array.from(new Set([...(u.q3Poes || []), poeFileName.trim()]));
          u.q3PoeDesc = poeDescription.trim();
          u.poeStatus = 'Attached';
        } else if (quarter === 'q4') {
          u.q4Poes = Array.from(new Set([...(u.q4Poes || []), poeFileName.trim()]));
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

  const clearQuarterPoe = (rowId: string, quarter: 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4') => {
    const updated = rows.map(r => {
      if (r.id === rowId) {
        const u = { ...r };
        if (quarter === 'q1') {
          u.q1Poes = [];
          u.q1PoeDesc = '';
        } else if (quarter === 'q2') {
          u.q2Poes = [];
          u.q2PoeDesc = '';
        } else if (quarter === 'midTerm') {
          u.midTermPoes = [];
          u.midTermPoeDesc = '';
        } else if (quarter === 'q3') {
          u.q3Poes = [];
          u.q3PoeDesc = '';
        } else if (quarter === 'q4') {
          u.q4Poes = [];
          u.q4PoeDesc = '';
        }
        return u;
      }
      return r;
    });
    setRows(updated);
    saveRows(updated);
    setSuccessToast(`${quarter.toUpperCase()} POE data deleted successfully!`);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const deleteRowHandler = (rowId: string) => {
    const updated = rows.filter(r => r.id !== rowId);
    setRows(updated);
    saveRows(updated);
    setSuccessToast("SDBIP Row deleted successfully!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const exportToCSV = () => {
    const headers = [
      "Reference Number", "Strategic Objectives", "KPI", "BSD", "LED", "MFVM",
      "GGPP", "MIDT", "KPA Functional Area", "Operational Activity",
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
                <span className="text-xs font-bold">Currently viewing: <strong className="text-slate-900 font-black">{filteredRows.length}</strong> of <strong className="text-slate-900 font-bold">{rows.length}</strong> active SDBIP top layer log items. Click cells directly to modify text.</span>
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

            {/* Smart Filter Panel */}
            {renderSmartFilterPanel()}

            {/* Large Wide Spreadsheet Table Container */}
            <div className="overflow-auto border border-slate-200 rounded-xl relative bg-white h-[580px] max-h-[68vh]">
              
              <table className="w-full text-left border-collapse select-text table-fixed min-w-[2380px]">
                
                {/* Headers */}
                <thead className="sticky top-0 bg-slate-100 z-20 border-b-2 border-slate-200 text-[10px] font-black tracking-wider uppercase text-slate-700 font-mono">
                  <tr>
                    <th className="p-3 border-r border-slate-200 w-24 sticky top-0 left-0 z-30 bg-slate-100">REF NUMBER</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-slate-100">STRATEGIC OBJECTIVES</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-slate-100">KPI</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-blue-100 text-blue-900">BSD (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-emerald-100 text-emerald-900">LED (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-amber-100 text-amber-900">MFVM (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-purple-100 text-purple-900">GGPP (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-rose-100 text-rose-900">MIDT (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-orange-100 text-orange-900">SR (X)</th>
                    <th className="p-3 border-r border-slate-200 w-52 sticky top-0 z-20 bg-slate-100">KPA FUNCTIONAL AREA</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-100">UNIT OF MEASURE</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">MSCOA TRACKING</th>
                    <th className="p-3 border-r border-slate-200 w-40 sticky top-0 z-20 bg-slate-100">BASELINE</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">ANNUAL TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-40 sticky top-0 z-20 bg-slate-100">BUDGET ALLOCATION</th>
                    <th className="p-3 border-r border-slate-200 w-32 sticky top-0 z-20 bg-slate-100">1ST QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-32 sticky top-0 z-20 bg-slate-100">2ND QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-32 text-center sticky top-0 z-20 bg-rose-100 text-rose-900">MID TERM</th>
                    <th className="p-3 border-r border-slate-200 w-32 sticky top-0 z-20 bg-slate-100">3RD QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-32 sticky top-0 z-20 bg-slate-100">4TH QUARTER</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-100">RESPONSIBLE UNIT</th>
                    <th className="p-3 border-r border-slate-200 w-48 text-center sticky top-0 z-20 bg-indigo-50 text-indigo-900 border-l border-indigo-200">POE AND DESCRIPTION</th>
                    <th className="p-3 w-16 text-center sticky top-0 z-20 bg-slate-100">ACTIONS</th>
                  </tr>
                </thead>

                {/* Body Rows */}
                <tbody className="text-xs font-medium text-slate-800 divide-y divide-slate-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50/70 transition-colors">
                      
                      {/* Ref Num */}
                      <td className="p-2 border-r border-slate-150 sticky left-0 z-10 bg-white group-hover:bg-slate-50/95 transition-colors drop-shadow-[1px_0_0_rgba(203,213,225,1)]">
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

                      {/* SR (Spatial Rationale) */}
                      <td className="p-2 border-r border-slate-150 text-center bg-orange-50/50">
                        <input 
                          type="text" 
                          value={row.sr || ''}
                          onChange={(e) => handleCellChange(row.id, 'sr', e.target.value)}
                          className="w-8 mx-auto bg-transparent border-0 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-center font-bold text-orange-900"
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
                            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2 py-1 rounded-md border border-emerald-200 max-w-[150px] truncate">
                              Uploaded - Visit Backup
                            </span>
                            {row.poeDesc && (
                              <p className="text-[9px] text-slate-500 italic max-w-[150px] truncate leading-tight" title={row.poeDesc}>
                                "{row.poeDesc}"
                              </p>
                            )}
                            <button 
                              onClick={() => triggerUploadModal(row.id, row.refNum, 'general')}
                              className="text-[9px] text-[#4F46E5] hover:underline font-bold"
                            >
                              Update document
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => triggerUploadModal(row.id, row.refNum, 'general')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-600 text-white rounded-lg text-[10px] font-bold hover:bg-indigo-700 hover:scale-[1.02] duration-150"
                          >
                            <Upload className="w-3 h-3" /> Upload Link
                          </button>
                        )}
                      </td>

                      {/* Action columns */}
                      <td className="p-2 text-center h-full">
                        {confirmDelete?.rowId === row.id && confirmDelete?.type === 'row' ? (
                          <div className="flex gap-1 justify-center items-center">
                            <button
                              onClick={() => {
                                deleteRowHandler(row.id);
                                setConfirmDelete(null);
                              }}
                              className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[9px] font-bold cursor-pointer hover:bg-rose-700"
                              title="Confirm delete line"
                            >
                              Yes
                            </button>
                            <button
                              onClick={() => setConfirmDelete(null)}
                              className="px-1.5 py-0.5 bg-slate-200 text-slate-700 rounded text-[9px] font-bold cursor-pointer hover:bg-slate-300"
                              title="Cancel"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => setConfirmDelete({ rowId: row.id, type: 'row' })}
                            className="text-slate-300 hover:text-rose-500 transition-colors"
                            title="Delete SDBIP line"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        )}
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
                <span className="text-xs font-bold">Currently reporting on: <strong className="text-slate-900 font-black">{filteredRows.length}</strong> of <strong className="text-slate-900 font-bold">{rows.length}</strong> SDBIP top layer items. All fields are editable and auto-expand.</span>
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

            {/* Smart Filter Panel */}
            {renderSmartFilterPanel()}

            <div className="overflow-auto border border-slate-200 rounded-xl relative bg-white h-[580px] max-h-[68vh]">
              <table className="w-full text-left border-collapse table-fixed min-w-[7072px]">
                <thead className="sticky top-0 bg-slate-100 z-20 border-b-2 border-slate-200 text-[10px] font-black tracking-wider uppercase text-slate-700 font-mono">
                  <tr>
                    {/* Fixed Info Columns */}
                    <th className="p-3 border-r border-slate-200 w-24 sticky top-0 left-0 z-30 bg-slate-100">REF NUMBER</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-slate-100">STRATEGIC OBJECTIVES</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-slate-100">KPI</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-blue-100 text-blue-900">BSD (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-emerald-100 text-emerald-900">LED (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-amber-100 text-amber-900">MFVM (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-indigo-100 text-indigo-900">GGPP (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-rose-100 text-rose-900">MIDT (X)</th>
                    <th className="p-3 border-r border-slate-200 w-20 text-center sticky top-0 z-20 bg-orange-100 text-orange-900">SR (X)</th>
                    <th className="p-3 border-r border-slate-200 w-52 sticky top-0 z-20 bg-slate-100">KPA FUNCTIONAL AREA</th>
                    <th className="p-3 border-r border-slate-200 w-40 sticky top-0 z-20 bg-slate-100">BASELINE</th>
                    <th className="p-3 border-r border-slate-200 w-44 sticky top-0 z-20 bg-slate-100">ANNUAL TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-40 sticky top-0 z-20 bg-slate-100">TOTAL BUDGET</th>
                    <th className="p-3 border-r border-slate-200 w-32 text-center sticky top-0 z-20 bg-slate-200 text-slate-900">RAG STATUS</th>
                    
                    {/* Q1 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-36 sticky top-0 z-20 bg-teal-50 text-teal-955 font-bold text-center border-b-2 border-teal-200">Q1 EXPENDITURE</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-indigo-50 text-indigo-955 font-bold text-center">Q1 POE</th>
                    <th className="p-3 border-r border-slate-200 w-24 sticky top-0 z-20 bg-indigo-50 text-indigo-900 text-center">Q1 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-indigo-100 text-indigo-900 border-b-2 border-indigo-200">Q1 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-indigo-200 text-indigo-955 border-b-2 border-indigo-300">Q1 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-indigo-300 text-indigo-955 border-b-2 border-indigo-400">Q1 CORRECTIVE MEASURE</th>

                    {/* Q2 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-36 sticky top-0 z-20 bg-teal-50 text-teal-955 font-bold text-center border-b-2 border-teal-200">Q2 EXPENDITURE</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-blue-50 text-blue-955 font-bold text-center">Q2 POE</th>
                    <th className="p-3 border-r border-slate-200 w-24 sticky top-0 z-20 bg-blue-50 text-blue-900 text-center">Q2 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-blue-100 text-blue-900 border-b-2 border-blue-200">Q2 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-blue-200 text-blue-955 border-b-2 border-blue-300">Q2 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-blue-300 text-blue-955 border-b-2 border-blue-400">Q2 CORRECTIVE MEASURE</th>

                    {/* Mid Term Reporting */}
                    <th className="p-3 border-r border-slate-200 w-36 sticky top-0 z-20 bg-teal-50 text-teal-955 font-bold text-center border-b-2 border-teal-200">MID TERM EXPENDITURE</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-emerald-50 text-emerald-955 font-bold text-center border-b-2 border-emerald-200">MID TERM POE</th>
                    <th className="p-3 border-r border-slate-200 w-32 sticky top-0 z-20 bg-emerald-50 text-emerald-900 border-b-2 border-emerald-100">MID TERM TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-emerald-100 text-emerald-900 border-b-2 border-emerald-200">MID TERM ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-emerald-200 text-emerald-900 border-b-2 border-emerald-300">MID TERM VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-emerald-300 text-emerald-950 border-b-2 border-emerald-400">MID TERM CORRECTIVE MEASURE</th>

                    {/* Q3 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-36 sticky top-0 z-20 bg-teal-50 text-teal-955 font-bold text-center border-b-2 border-teal-200">Q3 EXPENDITURE</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-amber-50 text-amber-955 font-bold text-center">Q3 POE</th>
                    <th className="p-3 border-r border-slate-200 w-24 sticky top-0 z-20 bg-amber-50 text-amber-900 text-center">Q3 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-amber-100 text-amber-900 border-b-2 border-amber-200">Q3 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-amber-200 text-amber-955 border-b-2 border-amber-300">Q3 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-amber-300 text-amber-955 border-b-2 border-amber-400">Q3 CORRECTIVE MEASURE</th>

                    {/* Q4 Reporting */}
                    <th className="p-3 border-r border-slate-200 w-36 sticky top-0 z-20 bg-teal-50 text-teal-955 font-bold text-center border-b-2 border-teal-200">Q4 EXPENDITURE</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-rose-50 text-rose-955 font-bold text-center">Q4 POE</th>
                    <th className="p-3 border-r border-slate-200 w-24 sticky top-0 z-20 bg-rose-50 text-rose-900 text-center">Q4 TARGET</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-rose-100 text-rose-900 border-b-2 border-rose-200">Q4 ACTUAL</th>
                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-rose-200 text-rose-955 border-b-2 border-rose-300">Q4 VARIANCE</th>
                    <th className="p-3 border-r border-slate-200 w-64 sticky top-0 z-20 bg-rose-300 text-rose-955 border-b-2 border-rose-400">Q4 CORRECTIVE MEASURE</th>

                    <th className="p-3 border-r border-slate-200 w-48 sticky top-0 z-20 bg-slate-100">RESPONSIBLE UNIT</th>

                    <th className="p-3 w-28 text-center bg-slate-50 text-slate-900 border-b-2 border-slate-200 font-bold sticky top-0 z-20">SCORE</th>
                  </tr>
                </thead>

                <tbody className="text-xs font-medium text-slate-800 divide-y divide-slate-100">
                  {filteredRows.map((row) => (
                    <tr key={row.id} className="group hover:bg-slate-50/70 transition-colors">
                      <td className="p-2 border-r border-slate-150 sticky left-0 z-10 bg-white group-hover:bg-slate-50/95 transition-colors font-mono text-[11px]">{row.refNum}</td>
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
                            <div 
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold shadow-sm select-none ${details.bgClass} ${details.borderClass} ${details.textClass}`}
                              title={details.tooltip}
                            >
                              <span className="text-sm leading-none">{details.face}</span>
                              <span className="text-[9px] uppercase tracking-wider font-extrabold">{details.label}</span>
                            </div>
                          );
                        })()}
                      </td>

                      {/* Q1 Expenditure (Moved before POE) */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        <input 
                          type="text"
                          disabled={!isOpex(row.budgetAllocation)}
                          value={isOpex(row.budgetAllocation) ? (row.q1Expenditure || '') : (() => {
                            const total = parseBudgetNum(row.budgetAllocation);
                            return total > 0 ? `R ${Math.round(total / 4).toLocaleString()}` : 'R 0';
                          })()}
                          onChange={(e) => handleCellChange(row.id, 'q1Expenditure', e.target.value)}
                          className={`w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold ${!isOpex(row.budgetAllocation) ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'text-slate-800'}`}
                          placeholder="Q1 Exp..."
                        />
                      </td>

                      {/* Q1 POE Column */}
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/10">
                        <div className="space-y-2">
                          <textarea 
                            rows={2}
                            value={row.q1PoeDesc || ''}
                            onChange={(e) => handleCellChange(row.id, 'q1PoeDesc', e.target.value)}
                            className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[10px]"
                            placeholder="Q1 POE Description..."
                          />
                          {row.q1Poes && row.q1Poes.length > 0 && (
                            <div className="text-[10px] bg-emerald-50/75 p-1 border border-emerald-100 rounded text-emerald-800 truncate" title={row.q1Poes[row.q1Poes.length - 1]}>
                              📄 {row.q1Poes[row.q1Poes.length - 1]}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <button 
                              onClick={() => triggerUploadModal(row.id, row.refNum, 'q1')}
                              className="flex-1 py-1 text-[9px] font-bold rounded border bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Upload/Edit POE"
                            >
                              <Upload className="w-2.5 h-2.5" /> Upload/Edit
                            </button>
                            {((row.q1Poes && row.q1Poes.length > 0) || row.q1PoeDesc) && (
                              confirmDelete?.rowId === row.id && confirmDelete?.type === 'q1' ? (
                                <div className="flex flex-col gap-1 bg-rose-50 border border-rose-200 p-1 rounded min-w-[80px]">
                                  <span className="text-[8px] text-rose-800 font-bold text-center leading-none">Are you sure?</span>
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => {
                                        clearQuarterPoe(row.id, 'q1');
                                        setConfirmDelete(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-rose-700"
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
                                  onClick={() => setConfirmDelete({ rowId: row.id, type: 'q1' })}
                                  className="p-1 text-[9px] font-bold rounded border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                                  title="Delete POE and Description"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Q1 TARGET Column */}
                      <td className="p-2 border-r border-slate-100 bg-indigo-50/20 text-center">
                        <div className="font-bold text-indigo-900 text-xs">{row.q1 || '-'}</div>
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
                        <textarea 
                          rows={3} 
                          value={row.q1Corrective || ''} 
                          disabled={isFieldDisabled(row.q1Variance)}
                          onChange={(e) => handleCellChange(row.id, 'q1Corrective', e.target.value)} 
                          className={`w-full p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px] transition-colors ${isFieldDisabled(row.q1Variance) ? 'bg-slate-50 border-slate-200 text-slate-450 cursor-not-allowed italic font-normal' : 'bg-white border-slate-200 text-slate-800'}`} 
                          placeholder={isFieldDisabled(row.q1Variance) ? "No variance detected." : "Q1 Corrective..."} 
                        />
                      </td>

                      {/* Q2 Expenditure (Moved before POE) */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        <input 
                          type="text"
                          disabled={!isOpex(row.budgetAllocation)}
                          value={isOpex(row.budgetAllocation) ? (row.q2Expenditure || '') : (() => {
                            const total = parseBudgetNum(row.budgetAllocation);
                            return total > 0 ? `R ${Math.round(total / 4).toLocaleString()}` : 'R 0';
                          })()}
                          onChange={(e) => handleCellChange(row.id, 'q2Expenditure', e.target.value)}
                          className={`w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold ${!isOpex(row.budgetAllocation) ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'text-slate-800'}`}
                          placeholder="Q2 Exp..."
                        />
                      </td>

                      {/* Q2 POE Column */}
                      <td className="p-2 border-r border-slate-100 bg-blue-50/10">
                        <div className="space-y-2">
                          <textarea 
                            rows={2}
                            value={row.q2PoeDesc || ''}
                            onChange={(e) => handleCellChange(row.id, 'q2PoeDesc', e.target.value)}
                            className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-blue-300 rounded text-[10px]"
                            placeholder="Q2 POE Description..."
                          />
                          {row.q2Poes && row.q2Poes.length > 0 && (
                            <div className="text-[10px] bg-emerald-50/75 p-1 border border-emerald-100 rounded text-emerald-800 truncate" title={row.q2Poes[row.q2Poes.length - 1]}>
                              📄 {row.q2Poes[row.q2Poes.length - 1]}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <button 
                              onClick={() => triggerUploadModal(row.id, row.refNum, 'q2')}
                              className="flex-1 py-1 text-[9px] font-bold rounded border bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Upload/Edit POE"
                            >
                              <Upload className="w-2.5 h-2.5" /> Upload/Edit
                            </button>
                            {((row.q2Poes && row.q2Poes.length > 0) || row.q2PoeDesc) && (
                              confirmDelete?.rowId === row.id && confirmDelete?.type === 'q2' ? (
                                <div className="flex flex-col gap-1 bg-rose-50 border border-rose-200 p-1 rounded min-w-[80px]">
                                  <span className="text-[8px] text-rose-800 font-bold text-center leading-none">Are you sure?</span>
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => {
                                        clearQuarterPoe(row.id, 'q2');
                                        setConfirmDelete(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-rose-700"
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
                                  onClick={() => setConfirmDelete({ rowId: row.id, type: 'q2' })}
                                  className="p-1 text-[9px] font-bold rounded border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                                  title="Delete POE and Description"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Q2 TARGET Column */}
                      <td className="p-2 border-r border-slate-100 bg-blue-50/20 text-center">
                        <div className="font-bold text-blue-900 text-xs">{row.q2 || '-'}</div>
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
                        <textarea 
                          rows={3} 
                          value={row.q2Corrective || ''} 
                          disabled={isFieldDisabled(row.q2Variance)}
                          onChange={(e) => handleCellChange(row.id, 'q2Corrective', e.target.value)} 
                          className={`w-full p-1 focus:ring-1 focus:ring-blue-300 rounded text-[11px] transition-colors ${isFieldDisabled(row.q2Variance) ? 'bg-slate-50 border-slate-200 text-slate-450 cursor-not-allowed italic font-normal' : 'bg-white border-slate-200 text-slate-800'}`} 
                          placeholder={isFieldDisabled(row.q2Variance) ? "No variance detected." : "Q2 Corrective..."} 
                        />
                      </td>

                      {/* Mid Term Expenditure */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        <input 
                          type="text"
                          disabled={!isOpex(row.budgetAllocation)}
                          value={isOpex(row.budgetAllocation) ? (row.midTermExpenditure || '') : (() => {
                            const total = parseBudgetNum(row.budgetAllocation);
                            return total > 0 ? `R ${Math.round(total / 2).toLocaleString()}` : 'R 0';
                          })()}
                          onChange={(e) => handleCellChange(row.id, 'midTermExpenditure', e.target.value)}
                          className={`w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold ${!isOpex(row.budgetAllocation) ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'text-slate-800'}`}
                          placeholder="Mid Term Exp..."
                        />
                      </td>

                      {/* Mid Term POE Column */}
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/10">
                        <div className="space-y-2">
                          <textarea 
                            rows={2}
                            value={row.midTermPoeDesc || ''}
                            onChange={(e) => handleCellChange(row.id, 'midTermPoeDesc', e.target.value)}
                            className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-emerald-300 rounded text-[10px]"
                            placeholder="Mid Term POE Description..."
                          />
                          {row.midTermPoes && row.midTermPoes.length > 0 && (
                            <div className="text-[10px] bg-emerald-50/75 p-1 border border-emerald-100 rounded text-emerald-800 truncate" title={row.midTermPoes[row.midTermPoes.length - 1]}>
                              📄 {row.midTermPoes[row.midTermPoes.length - 1]}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <button 
                              onClick={() => triggerUploadModal(row.id, row.refNum, 'midTerm')}
                              className="flex-1 py-1 text-[9px] font-bold rounded border bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Upload/Edit POE"
                            >
                              <Upload className="w-2.5 h-2.5" /> Upload/Edit
                            </button>
                            {((row.midTermPoes && row.midTermPoes.length > 0) || row.midTermPoeDesc) && (
                              confirmDelete?.rowId === row.id && confirmDelete?.type === 'midTerm' ? (
                                <div className="flex flex-col gap-1 bg-rose-50 border border-rose-200 p-1 rounded min-w-[80px]">
                                  <span className="text-[8px] text-rose-800 font-bold text-center leading-none">Are you sure?</span>
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => {
                                        clearQuarterPoe(row.id, 'midTerm');
                                        setConfirmDelete(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-rose-700"
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
                                  onClick={() => setConfirmDelete({ rowId: row.id, type: 'midTerm' })}
                                  className="p-1 text-[9px] font-bold rounded border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                                  title="Delete POE and Description"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Mid Term Target */}
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/20 text-center">
                        <div className="font-bold text-emerald-900 text-xs">{row.midTermTarget || ''}</div>
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
                        <div className="w-full bg-white border border-emerald-100 p-1 rounded text-[11px] font-bold text-slate-800 min-h-[40px]">
                          {row.midTermVariance || ''}
                        </div>
                      </td>
                      <td className="p-2 border-r border-slate-100 bg-emerald-50/5">
                        <textarea 
                          rows={3} 
                          value={row.midTermCorrective || ''} 
                          disabled={isFieldDisabled(row.midTermVariance)}
                          onChange={(e) => handleCellChange(row.id, 'midTermCorrective', e.target.value)} 
                          className={`w-full p-1 focus:ring-1 focus:ring-emerald-300 rounded text-[11px] transition-colors ${isFieldDisabled(row.midTermVariance) ? 'bg-slate-55 border-slate-200 text-slate-450 cursor-not-allowed italic font-normal' : 'bg-white border-emerald-100 p-1 text-slate-800'}`} 
                          placeholder={isFieldDisabled(row.midTermVariance) ? "No variance detected." : "Mid-Term Corrective..."} 
                        />
                      </td>

                      {/* Q3 Expenditure (Moved before POE) */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        <input 
                          type="text"
                          disabled={!isOpex(row.budgetAllocation)}
                          value={isOpex(row.budgetAllocation) ? (row.q3Expenditure || '') : (() => {
                            const total = parseBudgetNum(row.budgetAllocation);
                            return total > 0 ? `R ${Math.round(total / 4).toLocaleString()}` : 'R 0';
                          })()}
                          onChange={(e) => handleCellChange(row.id, 'q3Expenditure', e.target.value)}
                          className={`w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold ${!isOpex(row.budgetAllocation) ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'text-slate-800'}`}
                          placeholder="Q3 Exp..."
                        />
                      </td>

                      {/* Q3 POE Column */}
                      <td className="p-2 border-r border-slate-100 bg-amber-50/10">
                        <div className="space-y-2">
                          <textarea 
                            rows={2}
                            value={row.q3PoeDesc || ''}
                            onChange={(e) => handleCellChange(row.id, 'q3PoeDesc', e.target.value)}
                            className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-amber-300 rounded text-[10px]"
                            placeholder="Q3 POE Description..."
                          />
                          {row.q3Poes && row.q3Poes.length > 0 && (
                            <div className="text-[10px] bg-emerald-50/75 p-1 border border-emerald-100 rounded text-emerald-800 truncate" title={row.q3Poes[row.q3Poes.length - 1]}>
                              📄 {row.q3Poes[row.q3Poes.length - 1]}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <button 
                              onClick={() => triggerUploadModal(row.id, row.refNum, 'q3')}
                              className="flex-1 py-1 text-[9px] font-bold rounded border bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Upload/Edit POE"
                            >
                              <Upload className="w-2.5 h-2.5" /> Upload/Edit
                            </button>
                            {((row.q3Poes && row.q3Poes.length > 0) || row.q3PoeDesc) && (
                              confirmDelete?.rowId === row.id && confirmDelete?.type === 'q3' ? (
                                <div className="flex flex-col gap-1 bg-rose-50 border border-rose-200 p-1 rounded min-w-[80px]">
                                  <span className="text-[8px] text-rose-800 font-bold text-center leading-none">Are you sure?</span>
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => {
                                        clearQuarterPoe(row.id, 'q3');
                                        setConfirmDelete(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-rose-700"
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
                                  onClick={() => setConfirmDelete({ rowId: row.id, type: 'q3' })}
                                  className="p-1 text-[9px] font-bold rounded border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                                  title="Delete POE and Description"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Q3 TARGET Column */}
                      <td className="p-2 border-r border-slate-100 bg-amber-50/20 text-center">
                        <div className="font-bold text-amber-900 text-xs">{row.q3 || '-'}</div>
                      </td>

                      <td className="p-2 border-r border-slate-100 bg-amber-50/5 relative text-slate-800">
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
                        <textarea 
                          rows={3} 
                          value={row.q3Corrective || ''} 
                          disabled={isFieldDisabled(row.q3Variance)}
                          onChange={(e) => handleCellChange(row.id, 'q3Corrective', e.target.value)} 
                          className={`w-full p-1 focus:ring-1 focus:ring-amber-300 rounded text-[11px] transition-colors ${isFieldDisabled(row.q3Variance) ? 'bg-slate-50 border-slate-200 text-slate-455 cursor-not-allowed italic font-normal' : 'bg-white border-slate-200 text-slate-800'}`} 
                          placeholder={isFieldDisabled(row.q3Variance) ? "No variance detected." : "Q3 Corrective..."} 
                        />
                      </td>

                      {/* Q4 Expenditure (Moved before POE) */}
                      <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                        <input 
                          type="text"
                          disabled={!isOpex(row.budgetAllocation)}
                          value={isOpex(row.budgetAllocation) ? (row.q4Expenditure || '') : (() => {
                            const total = parseBudgetNum(row.budgetAllocation);
                            return total > 0 ? `R ${Math.round(total / 4).toLocaleString()}` : 'R 0';
                          })()}
                          onChange={(e) => handleCellChange(row.id, 'q4Expenditure', e.target.value)}
                          className={`w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold ${!isOpex(row.budgetAllocation) ? 'bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200' : 'text-slate-800'}`}
                          placeholder="Q4 Exp..."
                        />
                      </td>

                      {/* Q4 POE Column */}
                      <td className="p-2 border-r border-slate-100 bg-rose-50/10">
                        <div className="space-y-2">
                          <textarea 
                            rows={2}
                            value={row.q4PoeDesc || ''}
                            onChange={(e) => handleCellChange(row.id, 'q4PoeDesc', e.target.value)}
                            className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-rose-300 rounded text-[10px]"
                            placeholder="Q4 POE Description..."
                          />
                          {row.q4Poes && row.q4Poes.length > 0 && (
                            <div className="text-[10px] bg-emerald-50/75 p-1 border border-emerald-100 rounded text-emerald-800 truncate" title={row.q4Poes[row.q4Poes.length - 1]}>
                              📄 {row.q4Poes[row.q4Poes.length - 1]}
                            </div>
                          )}
                          <div className="flex gap-1">
                            <button 
                              onClick={() => triggerUploadModal(row.id, row.refNum, 'q4')}
                              className="flex-1 py-1 text-[9px] font-bold rounded border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                              title="Upload/Edit POE"
                            >
                              <Upload className="w-2.5 h-2.5" /> Upload/Edit
                            </button>
                            {((row.q4Poes && row.q4Poes.length > 0) || row.q4PoeDesc) && (
                              confirmDelete?.rowId === row.id && confirmDelete?.type === 'q4' ? (
                                <div className="flex flex-col gap-1 bg-rose-50 border border-rose-200 p-1 rounded min-w-[80px]">
                                  <span className="text-[8px] text-rose-800 font-bold text-center leading-none">Are you sure?</span>
                                  <div className="flex gap-1 justify-center">
                                    <button
                                      onClick={() => {
                                        clearQuarterPoe(row.id, 'q4');
                                        setConfirmDelete(null);
                                      }}
                                      className="px-1.5 py-0.5 bg-rose-600 text-white rounded text-[8px] font-bold cursor-pointer hover:bg-rose-700"
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
                                  onClick={() => setConfirmDelete({ rowId: row.id, type: 'q4' })}
                                  className="p-1 text-[9px] font-bold rounded border bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 transition-colors flex items-center justify-center cursor-pointer"
                                  title="Delete POE and Description"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Q4 TARGET Column */}
                      <td className="p-2 border-r border-slate-100 bg-rose-50/20 text-center">
                        <div className="font-bold text-rose-900 text-xs">{row.q4 || '-'}</div>
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
                        <textarea 
                          rows={3} 
                          value={row.q4Corrective || ''} 
                          disabled={isFieldDisabled(row.q4Variance)}
                          onChange={(e) => handleCellChange(row.id, 'q4Corrective', e.target.value)} 
                          className={`w-full p-1 focus:ring-1 focus:ring-rose-300 rounded text-[11px] transition-colors ${isFieldDisabled(row.q4Variance) ? 'bg-slate-50 border-slate-200 text-slate-450 cursor-not-allowed italic font-normal' : 'bg-white border-slate-200 text-slate-800'}`} 
                          placeholder={isFieldDisabled(row.q4Variance) ? "No variance detected." : "Q4 Corrective..."} 
                        />
                      </td>

                      <td className="p-2 border-r border-slate-100 bg-slate-50/5">
                        <input 
                          type="text" 
                          value={row.responsibleUnit || ''}
                          onChange={(e) => handleCellChange(row.id, 'responsibleUnit', e.target.value)}
                          className="w-full bg-white border border-slate-200 p-1 focus:ring-1 focus:ring-indigo-300 rounded text-[11px]"
                          placeholder="Responsible Unit..."
                        />
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
                <h3 className="text-sm font-black uppercase text-slate-900">
                  Upload Portfolio of Evidence (POE)
                  {poeModal.quarter && poeModal.quarter !== 'general' ? ` - ${poeModal.quarter.toUpperCase()}` : ''}
                </h3>
                <p className="text-[10px] text-slate-500 font-mono">Ref: {poeModal.refNum} (Stored securely on Supabase cloud database)</p>
              </div>
            </div>

            <form onSubmit={handlePoeSubmit} className="space-y-4">
              
              {/* Actual File Selector Component */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Select File (Actual Upload)</label>
                <div className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-xl p-4 text-center cursor-pointer transition-colors relative bg-slate-50 hover:bg-indigo-50/20 group">
                  <Upload className="w-6 h-6 text-indigo-500 mx-auto mb-1 animate-pulse" />
                  <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 block">
                    Click to select file or drag & drop here
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    Supports PDF, DOCX, XLSX, images (Max 15MB)
                  </span>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    onChange={(e) => {
                      if (!e.target.files || e.target.files.length === 0) return;
                      const file = e.target.files[0];
                      setPoeFileName(file.name);
                      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
                      setPoeFileSize(`${sizeMB} MB`);
                    }}
                  />
                </div>
              </div>

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
                  <input
                    type="text"
                    value={poeFileSize}
                    onChange={(e) => setPoeFileSize(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 text-xs rounded-xl bg-slate-50 text-slate-600 font-semibold"
                    placeholder="e.g. 1.5 MB"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">Format</label>
                  <span className="w-full block px-3 py-2 bg-slate-50 border border-slate-200 text-xs text-slate-500 font-bold rounded-xl font-mono text-center">
                    COMPLIANT DOCUMENT
                  </span>
                </div>
              </div>

              {/* POE DESCRIPTION FIELD - MANDATORY FOR USER REQUIREMENT */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider block">POE Document Description</label>
                <textarea 
                  value={poeDescription}
                  onChange={(e) => setPoeDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-xl outline-none focus:border-indigo-500 text-slate-800 font-medium min-h-[70px]"
                  placeholder="Provide a precise, detailed description of this Portfolio of Evidence (e.g., 'CFO Signed June Water Distribution Receipts and General Ledger Extract for Q1')."
                  required
                />
              </div>

              <div className="p-3 bg-indigo-50 text-[10px] text-indigo-950 font-medium rounded-xl flex items-start gap-2 border border-indigo-100/50">
                <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="leading-snug">Uploading this file stores it securely on Supabase cloud database inside the active municipality's Backup Archive. The table cell and description will update instantly.</p>
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
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.02]"
                >
                  Confirm & Save POE
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
