import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Database,
  Trash2,
  RefreshCw,
  Search,
  CheckSquare,
  Square,
  Info,
  Shield,
  Layers,
  FileSpreadsheet,
  Edit3,
  User as UserIcon,
  Users,
  ChevronDown,
  ChevronRight,
  Check,
  Building,
  BarChart3
} from 'lucide-react';
import type { User } from '../types';
import {
  extractGmIppFromDocument,
  type ExtractedGmMappedKPI,
  type ExtractedKpaDefinition
} from '../utils/gmIppParser';

export const NEDA_ALLOWED_RECIPIENTS = [
  {
    email: 'ChaukeNH@nkangaladm.gov.za',
    fullName: 'N.H. Chauke',
    jobFunction: 'Senior Manager / Executive Official',
    department: 'NEDA Executive Office'
  },
  {
    email: 'SehlakoLS@neda.gov.za',
    fullName: 'Lekgotla Samuel Sehlako',
    jobFunction: 'Manager: Supply Chain Management',
    department: 'Supply Chain Management'
  },
  {
    email: 'ChaukeKC@neda.gov.za',
    fullName: 'Kulani Collen Chauke',
    jobFunction: 'Chief Financial Officer',
    department: 'Finance and Administration'
  },
  {
    email: 'manganijp@nkangaladm.gov.za',
    fullName: 'Johan Prince Mangani',
    jobFunction: 'Acting Chief Executive Officer',
    department: 'Office of the Chief Executive Officer'
  }
];

interface FredGmPerformancePlanExtractorProps {
  currentUser: User;
  activeTenantId: string;
  onNavigateToIPMS?: (subModuleId?: string) => void;
}

export function FredGmPerformancePlanExtractor({
  currentUser,
  activeTenantId,
  onNavigateToIPMS
}: FredGmPerformancePlanExtractorProps) {
  // Helper to resolve the initial target employee to one of the 4 approved NEDA users
  const resolveApprovedNedaUser = (email?: string) => {
    if (!email) return NEDA_ALLOWED_RECIPIENTS[3];
    const clean = email.toLowerCase().trim();
    const found = NEDA_ALLOWED_RECIPIENTS.find(u => {
      const uEmail = u.email.toLowerCase().trim();
      return uEmail === clean ||
        (clean.includes('mangani') && uEmail.includes('mangani')) ||
        (clean.includes('chaukekc') && uEmail.includes('chaukekc')) ||
        (clean.includes('chaukenh') && uEmail.includes('chaukenh')) ||
        (clean.includes('sehlako') && uEmail.includes('sehlako'));
    });
    return found || NEDA_ALLOWED_RECIPIENTS[3];
  };

  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedGmMappedKPI[]>([]);
  const [extractedKpas, setExtractedKpas] = useState<ExtractedKpaDefinition[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterKpa, setFilterKpa] = useState<string>('all');
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [targetEmployeeEmail, setTargetEmployeeEmail] = useState<string>(currentUser?.email || '');
  
  // Azure AD Directory Picker State
  const [azureUsers, setAzureUsers] = useState<User[]>([]);
  const [selectedTargetUser, setSelectedTargetUser] = useState<User | null>(null);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all Azure AD Directory Officials (Nkangala and NEDA)
  useEffect(() => {
    const fetchAzureDirectory = async () => {
      try {
        const [resNkangala, resNeda] = await Promise.all([
          fetch(`/api/tenant/tenant-229/users`),
          fetch(`/api/tenant/neda/users`)
        ]);
        let combined: User[] = [];
        if (resNkangala.ok) {
          const nk = await resNkangala.json();
          if (Array.isArray(nk)) combined = [...combined, ...nk];
        }
        if (resNeda.ok) {
          const nd = await resNeda.json();
          if (Array.isArray(nd)) combined = [...combined, ...nd];
        }
        // Deduplicate by email
        const unique = Array.from(new Map(combined.map(u => [u.email.toLowerCase().trim(), u])).values());
        if (unique.length > 0) {
          setAzureUsers(unique);
          const currentEmail = currentUser?.email?.toLowerCase().trim();
          const match = unique.find(u => u.email.toLowerCase().trim() === currentEmail) || unique[0];
          setSelectedTargetUser(match);
          setTargetEmployeeEmail(match.email);
        }
      } catch (err) {
        console.warn("Failed to fetch Azure AD directory users in GM Extractor:", err);
      }
    };
    fetchAzureDirectory();
  }, [currentUser?.email]);

  // Load existing extraction snapshot if available
  useEffect(() => {
    setExtractedItems([]);
    setExtractedKpas([]);
    setSourceFileName('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const loadSavedSnapshot = async () => {
      try {
        const targetEmail = targetEmployeeEmail || currentUser.email;
        if (!targetEmail) return;
        const effectiveTenantId = targetEmail.toLowerCase().includes('neda.gov.za') ? 'neda' : (activeTenantId || 'tenant-229');
        const res = await fetch(`/api/tenant/${effectiveTenantId}/fred-extraction/gm_performance_agreement?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data.data;
          if (items && Array.isArray(items) && items.length > 0) {
            setExtractedItems(items.map((it: any, idx: number) => ({
              ...it,
              _id: it._id || `gm-ipp-item-${idx}-${Date.now()}`,
              _selected: it._selected !== false
            })));
            if (data.kpas && Array.isArray(data.kpas)) {
              setExtractedKpas(data.kpas);
            }
            if (data.fileName || data.sourceFileName) {
              setSourceFileName(data.fileName || data.sourceFileName);
            }
          }
        }
      } catch (err) {
        // Silent fail on initial load
      }
    };
    loadSavedSnapshot();
  }, [targetEmployeeEmail, currentUser.email, activeTenantId]);

  // Handle File Upload & Extraction
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsExtracting(true);
    setStatusMessage({
      type: 'info',
      text: `Processing GM Performance Agreement "${file.name}"... Parsing KPAs, KPIs, KPI IDs, weights, quarterly targets & POEs verbatim.`
    });

    try {
      const result = await extractGmIppFromDocument(file);
      
      const formattedItems: ExtractedGmMappedKPI[] = (result.items || []).map((item, idx) => ({
        ...item,
        _id: `gm-ipp-item-${Date.now()}-${idx + 1}`,
        _selected: true
      }));

      setExtractedItems(formattedItems);
      setExtractedKpas(result.kpas || []);
      setSourceFileName(file.name);
      
      setStatusMessage({
        type: 'success',
        text: `Successfully extracted ${formattedItems.length} GM KPIs and ${result.kpas?.length || 0} Functional KPAs from "${file.name}" with verbatim mapping fidelity.`
      });

      // Persist snapshot to server
      const targetEmail = targetEmployeeEmail || currentUser.email;
      try {
        await fetch(`/api/tenant/${activeTenantId}/fred-extraction/gm_performance_agreement?userId=${encodeURIComponent(targetEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: formattedItems,
            kpas: result.kpas || [],
            sourceFileName: file.name,
            timestamp: new Date().toISOString()
          })
        });
      } catch (saveErr) {
        console.warn("GM snapshot auto-save error:", saveErr);
      }
    } catch (err: any) {
      console.error("GM Extraction error:", err);
      setStatusMessage({
        type: 'error',
        text: `Extraction failed: ${err.message || 'Unknown error occurred while parsing GM document.'}`
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Push Extracted Data to Performance Plan
  const handlePushToPerformancePlan = async () => {
    const selected = extractedItems.filter(it => it._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one KPI to push to the Performance Plan.' });
      return;
    }

    const targetEmail = targetEmployeeEmail || currentUser.email;
    const targetUser = selectedTargetUser || azureUsers.find(u => u.email.toLowerCase().trim() === targetEmail.toLowerCase().trim()) || { fullName: targetEmail, email: targetEmail };
    const effectiveTenantId = targetEmail.toLowerCase().includes('neda.gov.za') ? 'neda' : (activeTenantId || 'tenant-229');

    setIsPushing(true);
    setStatusMessage({
      type: 'info',
      text: `Pushing ${selected.length} verbatim GM KPIs into the Performance Plan for ${targetUser.fullName || (targetUser as any).full_name || targetEmail} (${targetEmail})...`
    });

    try {

      // Map strictly as required:
      const planItems = selected.map((it, idx) => {
        const functionalKpa = it["functional kpa"] || (it as any).functionalKpa || it["kpa"] || (it as any).kpa || 'Functional Performance Area';
        const poeVal = it["poe"] || (it as any).poe || (it as any).poeDesc || '';
        const kpiNoVal = it["kpi no"] || (it as any).kpiNo || (it as any).refNum || (it as any).id || `M_${idx + 1}`;
        const kpiDescVal = it["kpi description"] || (it as any).kpiDescription || (it as any).kpi || (it as any).description || '';
        const wtVal = String(it["wt"] || (it as any).wt || (it as any).weighting || (it as any).weight || '1');
        const budgetVal = it["budget"] || (it as any).budget || (it as any).totalBudget || '';
        const baselineVal = it["baseline"] || (it as any).baseline || '';
        const annualTargetVal = it["annual target"] || (it as any).annualTarget || (it as any).annual || '';
        const q1TargetVal = it["1st qtr target"] || (it as any).q1Target || (it as any).q1 || '';
        const q2TargetVal = it["2nd qtr target"] || (it as any).q2Target || (it as any).q2 || '';
        const q3TargetVal = it["3rd qtr target"] || (it as any).q3Target || (it as any).q3 || '';
        const q4TargetVal = it["4th qtr target"] || (it as any).q4Target || (it as any).q4 || '';
        const q1PoeVal = it["1st qtr poe"] || (it as any).q1Poe || poeVal;
        const q2PoeVal = it["2nd qtr poe"] || (it as any).q2Poe || poeVal;
        const q3PoeVal = it["3rd qtr poe"] || (it as any).q3Poe || poeVal;
        const q4PoeVal = it["4th qtr poe"] || (it as any).q4Poe || poeVal;

        return {
          id: (it as any).id || `gm-ipp-kpi-${Date.now()}-${idx + 1}`,
          kpiNo: kpiNoVal,
          refNum: kpiNoVal,
          kpiDescription: kpiDescVal,
          kpi: kpiDescVal,
          description: kpiDescVal,
          kpa: functionalKpa,
          functionalKpa: functionalKpa,
          weighting: parseFloat(wtVal) || 1,
          wt: wtVal,
          weight: wtVal,
          baseline: baselineVal,
          annualTarget: annualTargetVal,
          annual: annualTargetVal,
          q1Target: q1TargetVal,
          q2Target: q2TargetVal,
          q3Target: q3TargetVal,
          q4Target: q4TargetVal,
          q1: q1TargetVal,
          q2: q2TargetVal,
          q3: q3TargetVal,
          q4: q4TargetVal,
          q1Poe: q1PoeVal,
          q2Poe: q2PoeVal,
          q3Poe: q3PoeVal,
          q4Poe: q4PoeVal,
          poe: poeVal,
          poeDesc: poeVal,
          budget: budgetVal,
          totalBudget: budgetVal,
          // Spaced / bracket verbatim keys
          "kpi no": kpiNoVal,
          "kpi description": kpiDescVal,
          "%wt": wtVal,
          "annual target": annualTargetVal,
          "1st qtr target": q1TargetVal,
          "2nd qtr target": q2TargetVal,
          "3rd qtr target": q3TargetVal,
          "4th qtr target": q4TargetVal,
          "1st qtr poe": q1PoeVal,
          "2nd qtr poe": q2PoeVal,
          "3rd qtr poe": q3PoeVal,
          "4th qtr poe": q4PoeVal,
          "functional kpa": functionalKpa,
          sourceFileName: sourceFileName || 'GM_Performance_Agreement.pdf',
          extractedBy: currentUser.email,
          extractedAt: new Date().toISOString()
        };
      });

      let pushRes = await fetch(`/api/tenant/${effectiveTenantId}/ipms/gm-push-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: targetEmail,
          items: planItems,
          kpas: extractedKpas,
          sourceFileName
        })
      });
      if (pushRes.status === 502 || pushRes.status === 503 || pushRes.status === 504) {
        await new Promise(r => setTimeout(r, 800));
        pushRes = await fetch(`/api/tenant/${effectiveTenantId}/ipms/gm-push-plan`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: targetEmail,
            items: planItems,
            kpas: extractedKpas,
            sourceFileName
          })
        });
      }

      if (!pushRes.ok) {
        let errMsg = `Server returned error status ${pushRes.status}`;
        try {
          const errData = await pushRes.json();
          if (errData?.error) errMsg = errData.error;
        } catch (e) {}
        throw new Error(errMsg);
      }

      window.dispatchEvent(new CustomEvent('pplan-updated', { detail: { tenantId: effectiveTenantId, userId: targetEmail } }));
      window.dispatchEvent(new CustomEvent('neda-kpis-updated', { detail: { tenantId: effectiveTenantId, userId: targetEmail } }));

      setStatusMessage({
        type: 'success',
        text: `Successfully mapped and pushed ${planItems.length} verbatim GM KPIs into the Performance Plan for ${targetUser.fullName || (targetUser as any).full_name || targetEmail} (${targetEmail}).`
      });

      if (onNavigateToIPMS) {
        setTimeout(() => {
          onNavigateToIPMS('appg');
        }, 1200);
      }
    } catch (err: any) {
      console.error("Push error:", err);
      setStatusMessage({
        type: 'error',
        text: `Push failed: ${err.message || 'Unknown error occurred.'}`
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Toggle selection
  const toggleSelectAll = () => {
    const allSelected = extractedItems.every(it => it._selected !== false);
    setExtractedItems(extractedItems.map(it => ({ ...it, _selected: !allSelected })));
  };

  const toggleSelectItem = (id: string) => {
    setExtractedItems(extractedItems.map(it => it._id === id ? { ...it, _selected: !(it._selected !== false) } : it));
  };

  // Clear Extractor
  const handleClearExtractor = async () => {
    setExtractedItems([]);
    setExtractedKpas([]);
    setSourceFileName('');
    setSelectedFile(null);
    setStatusMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const targetEmail = targetEmployeeEmail || currentUser.email;
    try {
      await fetch(`/api/tenant/${activeTenantId}/fred-extraction/gm_performance_agreement?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'DELETE'
      });
    } catch (err) {
      // Silent catch
    }
  };

  // Handle cell edit
  const handleCellEdit = (id: string, field: keyof ExtractedGmMappedKPI, value: string) => {
    setExtractedItems(extractedItems.map(it => {
      if (it._id === id) {
        const updated = { ...it, [field]: value };
        if (field === 'poe') {
          updated['1st qtr poe'] = value;
          updated['2nd qtr poe'] = value;
          updated['3rd qtr poe'] = value;
          updated['4th qtr poe'] = value;
        }
        return updated;
      }
      return it;
    }));
  };

  // Filtering
  const filteredItems = extractedItems.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item["kpi no"].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item["kpi description"].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item["functional kpa"].toLowerCase().includes(searchQuery.toLowerCase()) ||
      item["poe"].toLowerCase().includes(searchQuery.toLowerCase());

    const matchesKpa = filterKpa === 'all' || item["functional kpa"].toLowerCase().includes(filterKpa.toLowerCase());

    return matchesSearch && matchesKpa;
  });

  const uniqueKpas = Array.from(new Set(extractedItems.map(it => it["functional kpa"]).filter(Boolean)));

  return (
    <div className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-y-auto p-6 space-y-6">
      
      {/* Header & Sub-Module Identity */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-amber-900/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-wide">EXTRACTION ENGINE — GM Extractor</h2>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                NEDA Sec 56 GM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dedicated Extractor for General Manager & Executive Director Agreements. Target and push directly to whoever is selected from the Azure AD user database.
            </p>
          </div>
        </div>

        {/* Target Profile Switcher (Azure AD Directory Picker) */}
        <div className="flex items-center gap-3 bg-slate-900 border border-emerald-500/40 p-2 rounded-xl relative">
          <UserIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs text-slate-400 font-bold uppercase tracking-wider shrink-0">Selected Target Official:</span>
          
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsPickerOpen(!isPickerOpen)}
              className="bg-slate-950 border border-emerald-500/50 hover:border-emerald-400 text-emerald-300 text-xs font-black rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer shadow-inner flex items-center gap-2 min-w-[300px] justify-between"
            >
              <span className="truncate">
                {selectedTargetUser?.fullName || (selectedTargetUser as any)?.full_name || targetEmployeeEmail || 'Select Official'} ({targetEmployeeEmail})
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            </button>

            {isPickerOpen && (
              <div className="absolute right-0 mt-2 w-96 bg-slate-950 border border-slate-700 rounded-xl shadow-2xl z-50 p-3 space-y-2 text-left">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search Azure AD directory by name, email, department..."
                    value={userSearchTerm}
                    onChange={(e) => setUserSearchTerm(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg text-xs text-white pl-8 pr-3 py-1.5 focus:outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
                <div className="max-h-60 overflow-y-auto divide-y divide-slate-800/60">
                  {azureUsers
                    .filter(u => {
                      if (!userSearchTerm) return true;
                      const q = userSearchTerm.toLowerCase();
                      return (
                        (u.fullName || (u as any).full_name || '').toLowerCase().includes(q) ||
                        (u.email || '').toLowerCase().includes(q) ||
                        (u.jobFunction || (u as any).job_function || '').toLowerCase().includes(q) ||
                        (u.department || '').toLowerCase().includes(q)
                      );
                    })
                    .map((u, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setSelectedTargetUser(u);
                          setTargetEmployeeEmail(u.email);
                          setIsPickerOpen(false);
                          setUserSearchTerm('');
                        }}
                        className="w-full text-left p-2 hover:bg-slate-900 transition flex flex-col gap-0.5 cursor-pointer rounded-lg"
                      >
                        <span className="font-bold text-white text-xs">{u.fullName || (u as any).full_name}</span>
                        <span className="text-[10px] text-emerald-400 font-mono">{u.email}</span>
                        {(u.jobFunction || (u as any).job_function || u.department) && (
                          <span className="text-[10px] text-slate-400">
                            {u.jobFunction || (u as any).job_function} {u.department ? `(${u.department})` : ''}
                          </span>
                        )}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exact Mapping Specification Badge */}
      <div className="bg-slate-950/90 border border-amber-500/30 rounded-2xl p-4 shadow-lg flex flex-col space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span>Strict GM Field Mapping Logic (1:1 Verbatim Protocol):</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-slate-300">
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">KPI IDs</span> <span className="text-amber-400 font-bold">→</span> <span className="text-emerald-300 font-semibold">kpi no</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Key Performance Indicator</span> <span className="text-amber-400 font-bold">→</span> <span className="text-emerald-300 font-semibold">kpi description</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Weight</span> <span className="text-amber-400 font-bold">→</span> <span className="text-emerald-300 font-semibold">wt</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Baseline</span> <span className="text-amber-400 font-bold">→</span> <span className="text-emerald-300 font-semibold">baseline</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Annual</span> <span className="text-amber-400 font-bold">→</span> <span className="text-emerald-300 font-semibold">annual target</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Q1 - Q4</span> <span className="text-amber-400 font-bold">→</span> <span className="text-emerald-300 font-semibold">1st - 4th qtr target</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">POE</span> <span className="text-amber-400 font-bold">→</span> <span className="text-emerald-300 font-semibold">1st - 4th qtr poe</span>
          </div>
          <div className="bg-slate-900/80 p-2 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-medium">Total Budget</span> <span className="text-amber-400 font-bold">→</span> <span className="text-emerald-300 font-semibold">budget</span>
          </div>
        </div>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-xs font-semibold ${
          statusMessage.type === 'error'
            ? 'bg-rose-950/80 border-rose-700/80 text-rose-200'
            : statusMessage.type === 'success'
            ? 'bg-emerald-950/80 border-emerald-700/80 text-emerald-200'
            : 'bg-indigo-950/80 border-indigo-700/80 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <Loader2 className="w-4 h-4 text-indigo-400 animate-spin shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          {extractedItems.length > 0 && (
            <button
              onClick={handleClearExtractor}
              className="text-slate-400 hover:text-white underline text-[11px] ml-4 cursor-pointer flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Extractor</span>
            </button>
          )}
        </div>
      )}

      {/* Upload Dropzone */}
      <div className="bg-slate-950/80 border-2 border-dashed border-amber-600/40 hover:border-amber-500/80 rounded-2xl p-8 text-center transition group relative">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.xlsx,.xls,.doc"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileUpload(file);
          }}
          disabled={isExtracting}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
        />
        <div className="flex flex-col items-center justify-center space-y-3 pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-amber-900/40 border border-amber-500/40 flex items-center justify-center text-amber-300 group-hover:scale-105 transition shadow-lg">
            {isExtracting ? (
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            ) : (
              <UploadCloud className="w-8 h-8 text-amber-400" />
            )}
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {isExtracting ? 'Extracting GM Performance Agreement...' : 'Upload GM Performance Agreement (PDF / DOCX / XLSX)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              Drag & drop the signed GM / Section 56 Performance Agreement here, or click to browse. The engine extracts all KPAs, KPIs, KPI IDs, weights, baselines, annual targets, Q1-Q4 targets, POE, and total budget.
            </p>
          </div>
          {sourceFileName && (
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-amber-950/60 border border-amber-700/50 text-amber-300 text-xs font-semibold">
                <FileText className="w-3.5 h-3.5" />
                <span>Loaded: {sourceFileName} ({extractedItems.length} GM KPIs)</span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearExtractor();
                }}
                className="pointer-events-auto px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white rounded-lg text-xs font-bold border border-rose-700/50 transition cursor-pointer flex items-center gap-1 shadow"
              >
                <Trash2 className="w-3 h-3 text-rose-400" />
                <span>Clear Extractor</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Extracted Data Grid */}
      {extractedItems.length > 0 && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col space-y-4 p-5">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleSelectAll}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-2 cursor-pointer"
              >
                {extractedItems.every(it => it._selected !== false) ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500" />
                )}
                <span>Select All ({extractedItems.filter(it => it._selected !== false).length}/{extractedItems.length})</span>
              </button>

              {/* KPA Filter */}
              <select
                value={filterKpa}
                onChange={(e) => setFilterKpa(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:border-amber-500"
              >
                <option value="all">All Functional KPAs ({uniqueKpas.length})</option>
                {uniqueKpas.map((kpa, i) => (
                  <option key={i} value={kpa}>{kpa}</option>
                ))}
              </select>
            </div>

            {/* Search Input & Action Button */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search KPI ID, desc, POE..."
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-xs font-medium rounded-lg pl-8 pr-3 py-1.5 focus:outline-none focus:border-amber-500 w-56"
                />
              </div>

              <button
                onClick={handlePushToPerformancePlan}
                disabled={isPushing || extractedItems.filter(it => it._selected !== false).length === 0}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-900/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isPushing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                ) : (
                  <ArrowRight className="w-4 h-4" />
                )}
                <span>Push Verbatim GM KPIs to Performance Plan</span>
              </button>
            </div>
          </div>

          {/* Table View */}
          <div className="overflow-x-auto border border-slate-800 rounded-xl bg-slate-900/50">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-800 sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-10 text-center">Sel</th>
                  <th className="p-3 w-24 text-amber-400">KPI IDs (kpi no)</th>
                  <th className="p-3 min-w-[220px]">Key Performance Indicator (kpi description)</th>
                  <th className="p-3 w-16 text-center text-amber-400">Weight (wt)</th>
                  <th className="p-3 w-28 text-slate-300">Baseline</th>
                  <th className="p-3 w-28 text-amber-300">Annual Target</th>
                  <th className="p-3 w-20 text-indigo-300 text-center">Q1</th>
                  <th className="p-3 w-20 text-indigo-300 text-center">Q2</th>
                  <th className="p-3 w-20 text-indigo-300 text-center">Q3</th>
                  <th className="p-3 w-20 text-indigo-300 text-center">Q4</th>
                  <th className="p-3 min-w-[180px] text-emerald-300">POE (1st-4th Qtr POE)</th>
                  <th className="p-3 w-24 text-rose-300">Total Budget</th>
                  <th className="p-3 w-48 text-purple-300">Functional KPA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium text-slate-200">
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={13} className="p-8 text-center text-slate-500 font-semibold">
                      No GM KPIs match the selected filter.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => (
                    <tr
                      key={item._id}
                      className={`hover:bg-slate-800/40 transition ${
                        item._selected === false ? 'opacity-40 bg-slate-950/40' : 'bg-slate-900/20'
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => toggleSelectItem(item._id!)}
                          className="cursor-pointer text-slate-400 hover:text-amber-400"
                        >
                          {item._selected !== false ? (
                            <CheckSquare className="w-4 h-4 text-amber-400" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600" />
                          )}
                        </button>
                      </td>

                      {/* KPI IDs -> kpi no */}
                      <td className="p-3 font-mono font-bold text-amber-300 text-[11px]">
                        <input
                          type="text"
                          value={item["kpi no"]}
                          onChange={(e) => handleCellEdit(item._id!, 'kpi no', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-amber-500 rounded px-1.5 py-0.5 w-full font-mono text-amber-300 font-bold focus:bg-slate-950 focus:outline-none"
                        />
                      </td>

                      {/* Key Performance Indicator -> kpi description */}
                      <td className="p-3">
                        <textarea
                          value={item["kpi description"]}
                          onChange={(e) => handleCellEdit(item._id!, 'kpi description', e.target.value)}
                          rows={2}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-amber-500 rounded p-1 w-full text-xs text-slate-100 font-medium focus:bg-slate-950 focus:outline-none resize-y"
                        />
                      </td>

                      {/* Weight -> wt */}
                      <td className="p-3 text-center">
                        <input
                          type="text"
                          value={item["wt"]}
                          onChange={(e) => handleCellEdit(item._id!, 'wt', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-amber-500 rounded px-1 py-0.5 w-full text-center font-bold text-amber-400 focus:bg-slate-950 focus:outline-none"
                        />
                      </td>

                      {/* Baseline */}
                      <td className="p-3 text-slate-300">
                        <input
                          type="text"
                          value={item["baseline"]}
                          onChange={(e) => handleCellEdit(item._id!, 'baseline', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-amber-500 rounded px-1 py-0.5 w-full text-xs text-slate-300 focus:bg-slate-950 focus:outline-none"
                        />
                      </td>

                      {/* Annual Target */}
                      <td className="p-3">
                        <input
                          type="text"
                          value={item["annual target"]}
                          onChange={(e) => handleCellEdit(item._id!, 'annual target', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-amber-500 rounded px-1 py-0.5 w-full text-xs font-semibold text-amber-300 focus:bg-slate-950 focus:outline-none"
                        />
                      </td>

                      {/* Q1 */}
                      <td className="p-3 text-center">
                        <input
                          type="text"
                          value={item["1st qtr target"]}
                          onChange={(e) => handleCellEdit(item._id!, '1st qtr target', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1 py-0.5 w-full text-center text-xs text-indigo-200 focus:bg-slate-950 focus:outline-none"
                        />
                      </td>

                      {/* Q2 */}
                      <td className="p-3 text-center">
                        <input
                          type="text"
                          value={item["2nd qtr target"]}
                          onChange={(e) => handleCellEdit(item._id!, '2nd qtr target', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1 py-0.5 w-full text-center text-xs text-indigo-200 focus:bg-slate-950 focus:outline-none"
                        />
                      </td>

                      {/* Q3 */}
                      <td className="p-3 text-center">
                        <input
                          type="text"
                          value={item["3rd qtr target"]}
                          onChange={(e) => handleCellEdit(item._id!, '3rd qtr target', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1 py-0.5 w-full text-center text-xs text-indigo-200 focus:bg-slate-950 focus:outline-none"
                        />
                      </td>

                      {/* Q4 */}
                      <td className="p-3 text-center">
                        <input
                          type="text"
                          value={item["4th qtr target"]}
                          onChange={(e) => handleCellEdit(item._id!, '4th qtr target', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-indigo-500 rounded px-1 py-0.5 w-full text-center text-xs text-indigo-200 focus:bg-slate-950 focus:outline-none"
                        />
                      </td>

                      {/* POE */}
                      <td className="p-3">
                        <textarea
                          value={item["poe"]}
                          onChange={(e) => handleCellEdit(item._id!, 'poe', e.target.value)}
                          rows={2}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-emerald-500 rounded p-1 w-full text-xs text-emerald-200 focus:bg-slate-950 focus:outline-none resize-y"
                        />
                      </td>

                      {/* Total Budget */}
                      <td className="p-3 font-semibold text-rose-300">
                        <input
                          type="text"
                          value={item["budget"]}
                          onChange={(e) => handleCellEdit(item._id!, 'budget', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-rose-500 rounded px-1 py-0.5 w-full text-xs text-rose-300 focus:bg-slate-950 focus:outline-none font-semibold"
                        />
                      </td>

                      {/* Functional KPA */}
                      <td className="p-3 text-purple-300">
                        <input
                          type="text"
                          value={item["functional kpa"]}
                          onChange={(e) => handleCellEdit(item._id!, 'functional kpa', e.target.value)}
                          className="bg-transparent border border-transparent hover:border-slate-700 focus:border-purple-500 rounded px-1 py-0.5 w-full text-xs text-purple-300 focus:bg-slate-950 focus:outline-none"
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-2 text-xs text-slate-400 font-semibold">
            <span>Showing {filteredItems.length} of {extractedItems.length} GM KPIs</span>
            <span>Total Weighting: {extractedItems.reduce((acc, curr) => acc + (parseFloat(curr["wt"]) || 0), 0)}%</span>
          </div>
        </div>
      )}
    </div>
  );
}
