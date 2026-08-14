import React, { useState, useRef, useMemo } from 'react';
import { User } from '../types';
import { 
  FileText, Upload, CheckCircle2, AlertCircle, Sparkles, Download, 
  Copy, Check, ArrowRight, Table, Code2, RefreshCw, Trash2, 
  Layers, ShieldCheck, Filter, Edit3, Eye, FileSpreadsheet,
  FileCode, Cpu, HelpCircle, CheckSquare, Square, Zap, Info, Play
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  ExtractedMappedKPI, 
  KpaCode, 
  KPA_METADATA, 
  extractKPIsFromPDF, 
  extractKPIsFromDocx, 
  extractKPIsFromExcel, 
  extractKPIsFromPastedContent,
  resolveKpaCode 
} from '../utils/performanceAgreementParser';

interface ExtractionEngineProps {
  currentUser: User;
  activeTenantId: string;
  onNavigateToIPMS?: (subModuleId?: string) => void;
}

const SAMPLE_PERFORMANCE_PLAN_TEXT = `Annexure A - Annual Performance Plan & Scorecard
Financial Year 2025/2026 - Directorate: Infrastructure, Finance & Corporate Services

KPA 1: Basic Service Delivery and Infrastructure Development
KPI No. | Key Performance Indicators | Weight | Baseline | Annual Target | 1st Quarter Planned Target | 2nd Quarter Planned Target | 3rd Quarter Planned Target | 4th Quarter Planned Target | POE | Total Budget Allocated
BSD-01 | Number of new water connections completed in informal settlements in accordance with the Water Services Act and Municipal SDBIP | 20 | 450 connections completed in 2023/24 | 600 new connections fully commissioned | 150 connections completed | 150 connections completed | 150 connections completed | 150 connections completed | Engineering completion certificates, GIS spatial coordinates, and signed beneficiary job cards | R 12,500,000
BSD-02 | Percentage of municipal asphalt and gravel roads resealed, regravelled, and rehabilitated within the municipal jurisdiction | 15 | 82% road network maintained | 95% of identified road network rehabilitated | 20% road network rehabilitated | 45% road network rehabilitated | 70% road network rehabilitated | 95% road network rehabilitated | Monthly civil contractor progress reports, site inspection verification logs, and Council oversight certificates | R 8,200,000

KPA 4: Municipal Financial Viability and Management
KPI No. | Key Performance Indicators | Weight | Baseline | Annual Target | 1st Quarter Planned Target | 2nd Quarter Planned Target | 3rd Quarter Planned Target | 4th Quarter Planned Target | POE | Total Budget Allocated
MFVM-01 | Percentage of municipal operating budget spent in compliance with the Municipal Finance Management Act (MFMA No. 56 of 2003) and SDBIP | 25 | 94% compliant expenditure in 2023/24 | 98% operating budget spent in full MFMA compliance | 25% expenditure compliance | 50% expenditure compliance | 75% expenditure compliance | 98% expenditure compliance | Quarterly Section 71 budget statements, General Ledger audit trails, and signed Bank Reconciliation Statements | Operational Budget
MFVM-02 | Revenue collection rate on billed property rates, electricity, refuse, and potable water service charges | 15 | 88% overall revenue collected | 93% sustained revenue collection achieved | 90% revenue collection | 91% revenue collection | 92% revenue collection | 93% revenue collection | Debtor age analysis schedules, billing master summaries, and monthly cash receipt reports | R 450,000

KPA 5: Good Governance and Public Participation
KPI No. | Key Performance Indicators | Weight | Baseline | Annual Target | 1st Quarter Planned Target | 2nd Quarter Planned Target | 3rd Quarter Planned Target | 4th Quarter Planned Target | POE | Total Budget Allocated
GGPP-01 | Number of quarterly ward committee public participation meetings convened across all municipal wards | 15 | 36 meetings convened in 2023/24 | 48 ward committee meetings successfully convened | 12 ward meetings convened | 12 ward meetings convened | 12 ward meetings convened | 12 ward meetings convened | Signed attendance registers, public notice distribution records, and approved Ward Committee minutes | R 320,000

KPA 2: Municipal Institutional Development and Transformation
KPI No. | Key Performance Indicators | Weight | Baseline | Annual Target | 1st Quarter Planned Target | 2nd Quarter Planned Target | 3rd Quarter Planned Target | 4th Quarter Planned Target | POE | Total Budget Allocated
MIDT-01 | Percentage of Workplace Skills Plan (WSP) municipal employee training and capacity building initiatives executed | 10 | 85% training executed in 2023/24 | 95% planned WSP skills training programs executed | 20% training programs executed | 45% training programs executed | 75% training programs executed | 95% training programs executed | Signed training attendance registers, accredited training certificates, and annual LGSETA compliance submissions | R 1,800,000`;

export function ExtractionEngine({ currentUser, activeTenantId, onNavigateToIPMS }: ExtractionEngineProps) {
  const [extractedItems, setExtractedItems] = useState<ExtractedMappedKPI[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'results' | 'json'>('upload');
  const [pasteText, setPasteText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [isSyncingToIPMS, setIsSyncingToIPMS] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [kpaFilter, setKpaFilter] = useState<string>('all');
  const [targetEmployeeEmail, setTargetEmployeeEmail] = useState<string>(currentUser?.email || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate weights
  const totalWeight = extractedItems
    .filter(it => it._selected !== false)
    .reduce((sum, item) => sum + (parseFloat(item["%wt"]) || 0), 0);

  // Unique Functional KPAs extracted
  const uniqueFunctionalKpas = useMemo(() => {
    const set = new Set<string>();
    extractedItems.forEach(it => {
      const kpaVal = it["functional kpa"] || it["kpa"];
      if (kpaVal && kpaVal.trim()) set.add(kpaVal.trim());
    });
    return Array.from(set);
  }, [extractedItems]);

  // Functional KPA Counts
  const kpaCounts = useMemo(() => {
    return extractedItems.reduce((acc, it) => {
      const code = it["functional kpa"] || it["kpa"] || 'Functional Performance Area';
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [extractedItems]);

  // Handle results commit
  const handleExtractedResult = (items: ExtractedMappedKPI[], name: string) => {
    if (!items || items.length === 0) {
      setStatusMessage({
        type: 'error',
        text: `No Key Performance Indicators found in ${name}. Ensure the document contains a performance scorecard table.`
      });
      setIsProcessing(false);
      return;
    }

    setExtractedItems(items);
    setSourceFileName(name);
    setIsProcessing(false);
    setActiveTab('results');
    setStatusMessage({
      type: 'success',
      text: `Successfully extracted and mapped ${items.length} KPI records from "${name}" with verbatim Functional KPA areas.`
    });
  };

  // 1. Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: `Analyzing and extracting "${file.name}"...` });

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const items = await extractKPIsFromPDF(arrayBuffer, file.name);
        handleExtractedResult(items, file.name);
      } else if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const items = await extractKPIsFromDocx(arrayBuffer, file.name);
        handleExtractedResult(items, file.name);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        const arrayBuffer = await file.arrayBuffer();
        const items = await extractKPIsFromExcel(arrayBuffer, file.name);
        handleExtractedResult(items, file.name);
      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        const parsed = JSON.parse(text);
        const rawArray = Array.isArray(parsed) ? parsed : (parsed.items || []);
        const items: ExtractedMappedKPI[] = rawArray.map((it: any, idx: number) => {
          const functionalKpa = String(it["functional kpa"] || it.functionalKpa || it.kpa || 'Functional Performance Area').trim();
          return {
            _id: `json-${Date.now()}-${idx + 1}`,
            _selected: true,
            "kpi no": String(it["kpi no"] || it.kpiNo || `KPI-${idx + 1}`).trim(),
            "kpi description": String(it["kpi description"] || it.kpi || it.description || `Indicator ${idx + 1}`).trim(),
            "%wt": String(it["%wt"] || it.weighting || it.weight || '0').replace('%', '').trim(),
            "baseline": String(it.baseline || '').trim(),
            "annual target": String(it["annual target"] || it.annualTarget || '').trim(),
            "1st qtr target": String(it["1st qtr target"] || it.q1Target || '').trim(),
            "2nd qtr target": String(it["2nd qtr target"] || it.q2Target || '').trim(),
            "3rd qtr target": String(it["3rd qtr target"] || it.q3Target || '').trim(),
            "4th qtr target": String(it["4th qtr target"] || it.q4Target || '').trim(),
            "poe": String(it.poe || '').trim(),
            "budget": String(it.budget || 'R0').trim(),
            "functional kpa": functionalKpa,
            "kpa": functionalKpa
          };
        });
        handleExtractedResult(items, file.name);
      } else {
        const text = await file.text();
        const items = await extractKPIsFromPastedContent(text, undefined, file.name);
        handleExtractedResult(items, file.name);
      }
    } catch (err: any) {
      console.error("File extraction error:", err);
      setStatusMessage({ type: 'error', text: `Extraction failed: ${err.message || 'Unknown error'}` });
      setIsProcessing(false);
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 2. Handle Paste from Clipboard
  const handleDirectPaste = async (e: React.ClipboardEvent) => {
    const html = e.clipboardData.getData('text/html');
    const text = e.clipboardData.getData('text/plain');

    if (!text && !html) return;

    setIsProcessing(true);
    try {
      const items = await extractKPIsFromPastedContent(text, html, 'Clipboard Table');
      handleExtractedResult(items, 'Clipboard Table');
      setPasteText(text);
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Paste extraction error: ${err.message}` });
      setIsProcessing(false);
    }
  };

  // 3. Handle Manual Parse Button
  const handleParsePastedText = async () => {
    if (!pasteText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste table content from Word or Excel.' });
      return;
    }
    setIsProcessing(true);
    try {
      const items = await extractKPIsFromPastedContent(pasteText, undefined, 'Pasted Text');
      handleExtractedResult(items, 'Pasted Text');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Failed to parse pasted text: ${err.message}` });
      setIsProcessing(false);
    }
  };

  // 4. Load Sample Performance Plan
  const handleLoadSample = async () => {
    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Loading sample municipal Performance Agreement scorecard...' });
    setPasteText(SAMPLE_PERFORMANCE_PLAN_TEXT);
    try {
      const items = await extractKPIsFromPastedContent(SAMPLE_PERFORMANCE_PLAN_TEXT, undefined, 'Sample Performance Plan');
      handleExtractedResult(items, 'Sample Performance Plan (Annexure A)');
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: `Sample loading failed: ${err.message}` });
      setIsProcessing(false);
    }
  };

  // 5. Update KPI Field in State
  const handleUpdateItem = (index: number, field: keyof ExtractedMappedKPI, value: any) => {
    setExtractedItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    const allSelected = extractedItems.every(it => it._selected !== false);
    setExtractedItems(prev => prev.map(it => ({ ...it, _selected: !allSelected })));
  };

  // Toggle single item
  const handleToggleSelectItem = (index: number) => {
    setExtractedItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], _selected: !updated[index]._selected };
      return updated;
    });
  };

  // Remove item
  const handleRemoveItem = (index: number) => {
    setExtractedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // 6. Direct 1-Click Sync to IPMS Performance Plan Module (Annual Performance Planner Grid)
  const handleSyncToIPMS = async () => {
    const selected = extractedItems.filter(it => it._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one KPI to sync to the IPMS Performance Plan.' });
      return;
    }

    setIsSyncingToIPMS(true);
    setStatusMessage({ type: 'info', text: `Syncing ${selected.length} KPIs into IPMS Annual Performance Planner Grid...` });

    try {
      const targetEmail = targetEmployeeEmail || currentUser.email;

      // Transform mapped schema strictly into IPMS PlanKPIItem format
      const ipmsPlanItems = selected.map((it, idx) => {
        const functionalKpa = it["functional kpa"] || it["kpa"] || 'Functional Performance Area';
        const norm = functionalKpa.toLowerCase();

        return {
          id: `extracted-sync-${Date.now()}-${idx + 1}`,
          kpiNo: it["kpi no"],
          kpi: it["kpi description"],
          weighting: it["%wt"],
          baseline: it["baseline"],
          annualTarget: it["annual target"],
          q1Target: it["1st qtr target"],
          q2Target: it["2nd qtr target"],
          q3Target: it["3rd qtr target"],
          q4Target: it["4th qtr target"],
          poe: it["poe"],
          budget: it["budget"],
          kpa: functionalKpa,
          mscoaCode: 'Functions',
          strategicGoal: 'To ensure sustainable service delivery and clean audit compliance',
          bsd: norm.includes('service') || norm.includes('infrastructure') || norm.includes('water') || norm.includes('bsd'),
          led: norm.includes('economic') || norm.includes('led'),
          mfvm: norm.includes('financial') || norm.includes('budget') || norm.includes('mfvm'),
          ggpp: norm.includes('governance') || norm.includes('public') || norm.includes('ggpp'),
          midt: norm.includes('institutional') || norm.includes('hr') || norm.includes('midt'),
          sr: norm.includes('spatial') || norm.includes('planning') || norm.includes('sr'),
          myScore: '3.0'
        };
      });

      // Prepare metadata
      const planMetadata = {
        name: currentUser.fullName || 'Employee Performance Plan',
        period: '2025/2026 Financial Year',
        department: currentUser.department || 'Municipal Administration',
        position: currentUser.jobFunction || 'Manager / Section 56 Senior Manager',
        level: currentUser.level || 'Level 1',
        email: targetEmail,
        manager: currentUser.manager || 'Municipal Manager',
        _isFredExtracted: true,
        _extractedAt: new Date().toISOString(),
        _sourceDocument: sourceFileName
      };

      // Push to Supabase via server API
      const res = await fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metadata: planMetadata,
          items: ipmsPlanItems
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to sync to IPMS: Status ${res.status}`);
      }

      setSyncSuccess(true);
      setStatusMessage({
        type: 'success',
        text: `Successfully synced ${selected.length} KPIs directly into the Annual Performance Planner Grid for ${targetEmail}!`
      });

      // Auto-navigate to IPMS module if handler is provided
      setTimeout(() => {
        if (onNavigateToIPMS) {
          onNavigateToIPMS('appg');
        }
      }, 1500);

    } catch (err: any) {
      console.error("IPMS Sync error:", err);
      setStatusMessage({ type: 'error', text: `Sync failed: ${err.message}` });
    } finally {
      setIsSyncingToIPMS(false);
    }
  };

  // 7. Export Mapped JSON
  const handleExportJson = () => {
    const cleanOutput = extractedItems.map(it => ({
      "kpi no": it["kpi no"],
      "kpi description": it["kpi description"],
      "%wt": it["%wt"],
      "baseline": it["baseline"],
      "annual target": it["annual target"],
      "1st qtr target": it["1st qtr target"],
      "2nd qtr target": it["2nd qtr target"],
      "3rd qtr target": it["3rd qtr target"],
      "4th qtr target": it["4th qtr target"],
      "poe": it["poe"],
      "budget": it["budget"],
      "functional kpa": it["functional kpa"] || it["kpa"]
    }));

    const blob = new Blob([JSON.stringify(cleanOutput, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Mapped_Performance_Plan_${sourceFileName.replace(/\.[^/.]+$/, '') || 'Scorecard'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 8. Export Clean Excel
  const handleExportExcel = () => {
    const rows = extractedItems.map(it => ({
      'KPI No': it['kpi no'],
      'Functional KPA': it['functional kpa'] || it['kpa'],
      'KPI Description': it['kpi description'],
      '% Weight': it['%wt'],
      'Baseline': it['baseline'],
      'Annual Target': it['annual target'],
      '1st Qtr Target': it['1st qtr target'],
      '2nd Qtr Target': it['2nd qtr target'],
      '3rd Qtr Target': it['3rd qtr target'],
      '4th Qtr Target': it['4th qtr target'],
      'POE': it['poe'],
      'Total Budget': it['budget']
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mapped Performance Plan');
    XLSX.writeFile(workbook, `Mapped_Performance_Plan_${Date.now()}.xlsx`);
  };

  // 9. Copy Clean JSON to Clipboard
  const handleCopyJson = () => {
    const cleanOutput = extractedItems.map(it => ({
      "kpi no": it["kpi no"],
      "kpi description": it["kpi description"],
      "%wt": it["%wt"],
      "baseline": it["baseline"],
      "annual target": it["annual target"],
      "1st qtr target": it["1st qtr target"],
      "2nd qtr target": it["2nd qtr target"],
      "3rd qtr target": it["3rd qtr target"],
      "4th qtr target": it["4th qtr target"],
      "poe": it["poe"],
      "budget": it["budget"],
      "functional kpa": it["functional kpa"] || it["kpa"]
    }));

    navigator.clipboard.writeText(JSON.stringify(cleanOutput, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  // Filter items by Functional KPA
  const filteredItems = extractedItems.filter(it => {
    if (kpaFilter === 'all') return true;
    const itemKpa = it["functional kpa"] || it["kpa"] || '';
    return itemKpa === kpaFilter;
  });

  return (
    <div id="extraction_engine_container" className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-y-auto space-y-6">
      
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-slate-950 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-inner">
              <Cpu className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-white tracking-tight">Extraction &amp; Data-Mapping Engine</h1>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider flex items-center gap-1">
                  <Zap className="w-3 h-3 text-emerald-400" />
                  Verbatim Word-for-Word Precision
                </span>
                <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider">
                  100% Functional KPA Bound
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1 max-w-3xl leading-relaxed">
                Extracts scorecard data from PDF, Word (.docx), Excel (.xlsx/.csv), and pasted tables. Every single word in each <strong className="text-amber-300">KPI description</strong> and <strong className="text-indigo-300">Functional KPA</strong> is preserved exactly as is, and every KPI row is strictly tied to its respective Functional Key Performance Area.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn_load_sample_doc"
              onClick={handleLoadSample}
              disabled={isProcessing}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-indigo-500/30 rounded-xl font-bold text-xs flex items-center gap-2 transition hover:shadow-lg disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 text-indigo-400" />
              <span>Load Sample Scorecard</span>
            </button>
          </div>
        </div>

        {/* STRICT FIELD MAPPING PILLS BANNER */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Strict Target Schema Keys (Mapped 1-to-1):</span>
          </div>
          <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
            {['kpi no', 'kpi description', '%wt', 'baseline', 'annual target', '1st qtr target', '2nd qtr target', '3rd qtr target', '4th qtr target', 'poe', 'budget', 'functional kpa'].map((keyName) => (
              <span key={keyName} className="bg-slate-800/90 text-indigo-200 border border-indigo-700/40 px-2.5 py-1 rounded-md">
                "{keyName}"
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* STATUS NOTIFICATION */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200' 
            : statusMessage.type === 'error'
            ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
            : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-200'
        }`}>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            {statusMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-indigo-400 shrink-0 animate-spin" />}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* NAVIGATION TABS */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            id="tab_upload_file"
            onClick={() => setActiveTab('upload')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'upload'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          <button
            id="tab_paste_table"
            onClick={() => setActiveTab('paste')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeTab === 'paste'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Table className="w-4 h-4" />
            <span>Paste Table / TSV</span>
          </button>

          {extractedItems.length > 0 && (
            <>
              <button
                id="tab_view_results"
                onClick={() => setActiveTab('results')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'results'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Mapped Grid ({extractedItems.length})</span>
              </button>

              <button
                id="tab_view_json"
                onClick={() => setActiveTab('json')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'json'
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <Code2 className="w-4 h-4" />
                <span>Schema JSON</span>
              </button>
            </>
          )}
        </div>

        {extractedItems.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportExcel}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              title="Download Excel"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Excel</span>
            </button>

            <button
              onClick={handleExportJson}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
              title="Download JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-400" />
              <span>JSON</span>
            </button>
          </div>
        )}
      </div>

      {/* 1. UPLOAD TAB */}
      {activeTab === 'upload' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-500/40 hover:border-indigo-400 bg-slate-900/60 hover:bg-slate-900 rounded-2xl p-12 text-center flex flex-col items-center justify-center cursor-pointer transition group relative"
          >
            <input 
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.xlsx,.xls,.csv,.json,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />

            <div className="w-20 h-20 rounded-3xl bg-indigo-600/20 group-hover:bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-4 transition transform group-hover:scale-105">
              {isProcessing ? (
                <RefreshCw className="w-10 h-10 animate-spin text-indigo-400" />
              ) : (
                <Upload className="w-10 h-10" />
              )}
            </div>

            <h3 className="text-xl font-black text-white mb-2">
              {isProcessing ? 'Extracting Scorecard...' : 'Drop Performance Agreement or Scorecard Here'}
            </h3>
            <p className="text-slate-400 text-sm max-w-md mb-4">
              Supports <strong className="text-slate-200">PDF (.pdf)</strong>, <strong className="text-slate-200">Word (.docx)</strong>, <strong className="text-slate-200">Excel (.xlsx/.csv)</strong>, and <strong className="text-slate-200">JSON</strong> files.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="bg-indigo-950/80 border border-indigo-700/50 text-indigo-300 px-3 py-1 rounded-full font-bold">
                14-Field Scorecard Detection
              </span>
              <span className="bg-emerald-950/80 border border-emerald-700/50 text-emerald-300 px-3 py-1 rounded-full font-bold">
                Automated KPA Classification
              </span>
              <span className="bg-purple-950/80 border border-purple-700/50 text-purple-300 px-3 py-1 rounded-full font-bold">
                Direct IPMS Grid Sync
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. PASTE TAB */}
      {activeTab === 'paste' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Paste Table from Word, Excel, or SDBIP Scorecard</h3>
              <p className="text-xs text-slate-400">Directly paste copied table cells (Ctrl+V) or raw tab-separated text below.</p>
            </div>
            <button
              onClick={handleLoadSample}
              className="text-xs text-indigo-400 hover:text-indigo-300 font-bold underline cursor-pointer"
            >
              Insert Sample Text
            </button>
          </div>

          <textarea
            id="paste_textarea_input"
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            onPaste={handleDirectPaste}
            placeholder="Paste copied table rows or SDBIP matrix here (e.g. from Word or Excel)..."
            rows={12}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
          />

          <div className="flex items-center justify-end gap-3">
            <button
              onClick={() => setPasteText('')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition"
            >
              Clear
            </button>
            <button
              id="btn_parse_pasted_text"
              onClick={handleParsePastedText}
              disabled={isProcessing || !pasteText.trim()}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              <span>Extract &amp; Map Schema</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. RESULTS GRID TAB */}
      {activeTab === 'results' && extractedItems.length > 0 && (
        <div className="space-y-4">
          
          {/* CONTROL & SUMMARY BAR */}
          <div className="bg-slate-800/80 border border-slate-700/70 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            
            {/* Functional KPA Filter Pills */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5" />
                <span>Functional KPA:</span>
              </span>
              <button
                onClick={() => setKpaFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  kpaFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({extractedItems.length})
              </button>

              {uniqueFunctionalKpas.map(fKpa => {
                const count = kpaCounts[fKpa] || 0;
                return (
                  <button
                    key={fKpa}
                    onClick={() => setKpaFilter(fKpa)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      kpaFilter === fKpa
                        ? 'bg-slate-700 text-white ring-2 ring-indigo-500'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <span className="truncate max-w-[180px]">{fKpa}</span>
                    <span className="bg-slate-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">{count}</span>
                  </button>
                );
              })}
            </div>

            {/* WEIGHT STATUS & SYNC BUTTON */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto justify-end">
              <div className={`px-3 py-1.5 rounded-xl border text-xs font-black flex items-center gap-1.5 ${
                Math.round(totalWeight) === 100
                  ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-950/80 border-amber-500/50 text-amber-300'
              }`}>
                <span>Total Weight:</span>
                <span className="font-mono text-sm">{totalWeight.toFixed(1)}%</span>
                {Math.round(totalWeight) === 100 ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <span className="text-[10px] opacity-75">(Target: 100%)</span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={targetEmployeeEmail}
                  onChange={(e) => setTargetEmployeeEmail(e.target.value)}
                  placeholder="Target user email..."
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-200 w-48 focus:outline-none focus:border-indigo-500"
                  title="Target employee email for Performance Plan sync"
                />

                <button
                  id="btn_sync_to_ipms_module"
                  onClick={handleSyncToIPMS}
                  disabled={isSyncingToIPMS}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                >
                  {isSyncingToIPMS ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>Push to IPMS Performance Plan</span>
                </button>
              </div>
            </div>
          </div>

          {/* KPI TABLE */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="overflow-x-auto max-h-[600px]">
              <datalist id="functional-kpa-list">
                {uniqueFunctionalKpas.map(f => (
                  <option key={f} value={f} />
                ))}
              </datalist>
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-black tracking-wider sticky top-0 z-20 border-b border-slate-800">
                  <tr>
                    <th className="p-3 w-10 text-center">
                      <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-white">
                        {extractedItems.every(it => it._selected !== false) ? (
                          <CheckSquare className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="p-3 w-28">kpi no</th>
                    <th className="p-3 min-w-[200px]">functional kpa</th>
                    <th className="p-3 min-w-[280px]">kpi description</th>
                    <th className="p-3 w-16 text-center">%wt</th>
                    <th className="p-3 min-w-[140px]">baseline</th>
                    <th className="p-3 min-w-[160px]">annual target</th>
                    <th className="p-3 min-w-[110px]">1st qtr target</th>
                    <th className="p-3 min-w-[110px]">2nd qtr target</th>
                    <th className="p-3 min-w-[110px]">3rd qtr target</th>
                    <th className="p-3 min-w-[110px]">4th qtr target</th>
                    <th className="p-3 min-w-[180px]">poe</th>
                    <th className="p-3 min-w-[120px]">budget</th>
                    <th className="p-3 w-10 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-sans">
                  {filteredItems.map((item, originalIndex) => {
                    const idx = extractedItems.findIndex(it => it === item);
                    const kpaVal = item["functional kpa"] || item["kpa"] || 'Functional Performance Area';

                    return (
                      <tr 
                        key={item._id || idx}
                        className={`hover:bg-slate-800/50 transition ${
                          item._selected === false ? 'opacity-40 bg-slate-950/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="p-3 text-center">
                          <button onClick={() => handleToggleSelectItem(idx)} className="text-slate-400 hover:text-white">
                            {item._selected !== false ? (
                              <CheckSquare className="w-4 h-4 text-indigo-400" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* kpi no */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item["kpi no"]}
                            onChange={(e) => handleUpdateItem(idx, "kpi no", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-indigo-300 font-mono font-bold text-xs"
                          />
                        </td>

                        {/* functional kpa */}
                        <td className="p-2">
                          <input
                            type="text"
                            list="functional-kpa-list"
                            value={kpaVal}
                            onChange={(e) => {
                              handleUpdateItem(idx, "functional kpa", e.target.value);
                              handleUpdateItem(idx, "kpa", e.target.value);
                            }}
                            placeholder="Functional KPA..."
                            className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-semibold text-emerald-300 focus:outline-none focus:border-indigo-500"
                          />
                        </td>

                        {/* kpi description */}
                        <td className="p-2">
                          <textarea
                            value={item["kpi description"]}
                            onChange={(e) => handleUpdateItem(idx, "kpi description", e.target.value)}
                            rows={2}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                          />
                        </td>

                        {/* %wt */}
                        <td className="p-2 text-center">
                          <input
                            type="number"
                            value={item["%wt"]}
                            onChange={(e) => handleUpdateItem(idx, "%wt", e.target.value)}
                            className="w-14 bg-slate-800/80 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-amber-300 text-xs"
                          />
                        </td>

                        {/* baseline */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.baseline}
                            onChange={(e) => handleUpdateItem(idx, "baseline", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          />
                        </td>

                        {/* annual target */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item["annual target"]}
                            onChange={(e) => handleUpdateItem(idx, "annual target", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-300 font-semibold"
                          />
                        </td>

                        {/* 1st qtr target */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item["1st qtr target"]}
                            onChange={(e) => handleUpdateItem(idx, "1st qtr target", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          />
                        </td>

                        {/* 2nd qtr target */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item["2nd qtr target"]}
                            onChange={(e) => handleUpdateItem(idx, "2nd qtr target", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          />
                        </td>

                        {/* 3rd qtr target */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item["3rd qtr target"]}
                            onChange={(e) => handleUpdateItem(idx, "3rd qtr target", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          />
                        </td>

                        {/* 4th qtr target */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item["4th qtr target"]}
                            onChange={(e) => handleUpdateItem(idx, "4th qtr target", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          />
                        </td>

                        {/* poe */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.poe}
                            onChange={(e) => handleUpdateItem(idx, "poe", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                          />
                        </td>

                        {/* budget */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={item.budget}
                            onChange={(e) => handleUpdateItem(idx, "budget", e.target.value)}
                            className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono"
                          />
                        </td>

                        {/* delete */}
                        <td className="p-2 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-500 hover:text-rose-400 p-1 transition"
                            title="Remove row"
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

      {/* 4. JSON SCHEMA VIEW TAB */}
      {activeTab === 'json' && extractedItems.length > 0 && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Exact Schema Output JSON</h3>
              <p className="text-xs text-slate-400">Strictly adheres to target keys and extracted functional KPA areas.</p>
            </div>
            <button
              onClick={handleCopyJson}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition cursor-pointer"
            >
              {copiedJson ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copiedJson ? 'Copied to Clipboard!' : 'Copy JSON'}</span>
            </button>
          </div>

          <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-400 overflow-x-auto max-h-[500px]">
            {JSON.stringify(
              extractedItems.map(it => ({
                "kpi no": it["kpi no"],
                "kpi description": it["kpi description"],
                "%wt": it["%wt"],
                "baseline": it["baseline"],
                "annual target": it["annual target"],
                "1st qtr target": it["1st qtr target"],
                "2nd qtr target": it["2nd qtr target"],
                "3rd qtr target": it["3rd qtr target"],
                "4th qtr target": it["4th qtr target"],
                "poe": it["poe"],
                "budget": it["budget"],
                "functional kpa": it["functional kpa"] || it["kpa"]
              })),
              null,
              2
            )}
          </pre>
        </div>
      )}

    </div>
  );
}
