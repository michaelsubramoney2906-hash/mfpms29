import React, { useState, useRef, useMemo } from 'react';
import { User } from '../types';
import { 
  FileText, Upload, CheckCircle2, AlertCircle, Sparkles, Download, 
  Copy, Check, ArrowRight, Table, Code2, RefreshCw, Trash2, 
  Layers, ShieldCheck, Filter, Edit3, Eye, FileSpreadsheet,
  FileCode, Cpu, HelpCircle, CheckSquare, Square, Zap, Info, Play,
  Save, Plus, Database, Landmark, UserCheck, Building2, Calendar, ListFilter
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { 
  ExtractedMappedKPI, 
  ExtractedKpaDefinition,
  KpaCode, 
  KPA_METADATA, 
  extractKPIsFromPDF, 
  extractKPIsFromDocx, 
  extractKPIsFromExcel, 
  extractKPIsFromPastedContent,
  resolveKpaCode,
  deriveKpaSummaries 
} from '../utils/performanceAgreementParser';
import { SDBIPExtractionEngine } from './SDBIPExtractionEngine';

interface ExtractionEngineProps {
  currentUser: User;
  activeTenantId: string;
  onNavigateToIPMS?: (subModuleId?: string) => void;
  onNavigateToSDBIP?: (tab?: 'table' | 'reporting') => void;
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

export function ExtractionEngine({ currentUser, activeTenantId, onNavigateToIPMS, onNavigateToSDBIP }: ExtractionEngineProps) {
  const [engineMode, setEngineMode] = useState<'performance_plan' | 'sdbip_top_layer'>('performance_plan');
  const [extractedItems, setExtractedItems] = useState<ExtractedMappedKPI[]>([]);
  const [extractedKpas, setExtractedKpas] = useState<ExtractedKpaDefinition[]>([]);
  const [agreementMetadata, setAgreementMetadata] = useState<{
    financialYear?: string;
    municipality?: string;
    employeeName?: string;
    position?: string;
    department?: string;
  } | null>(null);
  const [viewGrouping, setViewGrouping] = useState<'grouped' | 'flat'>('grouped');
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'results' | 'json'>('upload');
  const [pasteText, setPasteText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [isSyncingToIPMS, setIsSyncingToIPMS] = useState<boolean>(false);
  const [isSavingDataset, setIsSavingDataset] = useState<boolean>(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);
  const [kpaFilter, setKpaFilter] = useState<string>('all');
  const [targetEmployeeEmail, setTargetEmployeeEmail] = useState<string>(currentUser?.email || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load previously saved scorecard dataset from Supabase if available
  const handleLoadSavedScorecard = async () => {
    setIsLoadingSaved(true);
    setStatusMessage({ type: 'info', text: 'Loading saved scorecard dataset from Supabase...' });
    try {
      const targetEmail = targetEmployeeEmail || currentUser.email;
      const res = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`);
      if (!res.ok) {
        throw new Error('No previously saved scorecard found on Supabase.');
      }
      const data = await res.json();
      const loadedItems = (data && (data.data || data.items)) ? (data.data || data.items) : null;
      if (loadedItems && Array.isArray(loadedItems) && loadedItems.length > 0) {
        setExtractedItems(loadedItems);
        const kpas = deriveKpaSummaries(loadedItems, data.kpas);
        setExtractedKpas(kpas);
        if (data.metadata) {
          setAgreementMetadata(data.metadata);
        }
        setSourceFileName(data.fileName || 'Saved Scorecard');
        setHasUnsavedChanges(false);
        if (data.savedAt || data.extractedAt) {
          setLastSavedTime(new Date(data.savedAt || data.extractedAt).toLocaleTimeString());
        }
        setActiveTab('results');
        setStatusMessage({
          type: 'success',
          text: `Loaded ${loadedItems.length} saved KPIs across ${kpas.length} KPAs from Supabase database.`
        });
      } else {
        setStatusMessage({ type: 'info', text: 'No saved scorecard dataset found. Extract a document or paste a table.' });
      }
    } catch (err: any) {
      console.warn("Load saved scorecard:", err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load saved scorecard.' });
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Completely clear and reset the Extraction Engine
  const handleClearEngine = async (notify: boolean = true) => {
    try {
      const targetEmail = targetEmployeeEmail || currentUser.email;
      await fetch(`/api/tenant/${activeTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'DELETE'
      });
      if (currentUser?.email && currentUser.email.toLowerCase() !== targetEmail.toLowerCase()) {
        await fetch(`/api/tenant/${activeTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(currentUser.email)}`, {
          method: 'DELETE'
        });
      }
    } catch (e) {
      console.warn("Clear engine backend error:", e);
    }

    setExtractedItems([]);
    setExtractedKpas([]);
    setAgreementMetadata(null);
    setSourceFileName('');
    setPasteText('');
    setHasUnsavedChanges(false);
    setLastSavedTime(null);
    setKpaFilter('all');
    setActiveTab('upload');
    setCopiedJson(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (notify) {
      setStatusMessage({
        type: 'info',
        text: 'Extraction & Data Mapping Engine has been cleared completely.'
      });
    }
  };

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

    const attachedKpas = (items as any).kpas;
    const attachedMetadata = (items as any).metadata;
    const kpas = deriveKpaSummaries(items, attachedKpas);

    setExtractedItems(items);
    setExtractedKpas(kpas);
    if (attachedMetadata) {
      setAgreementMetadata(attachedMetadata);
    }
    setSourceFileName(name);
    setIsProcessing(false);
    setActiveTab('results');
    setStatusMessage({
      type: 'success',
      text: `Successfully extracted and mapped ${items.length} KPI records across ${kpas.length} KPAs from "${name}" with 100% verbatim precision.`
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
        let parsed: any = [];
        try { parsed = JSON.parse(text); } catch(e) { throw new Error("Invalid JSON file uploaded"); }
        const rawArray = Array.isArray(parsed) ? parsed : (parsed.items || parsed.kpis || []);
        const items: ExtractedMappedKPI[] = rawArray.map((it: any, idx: number) => {
          const functionalKpa = String(it["functional kpa"] || it.functionalKpa || it.kpa || it["functional area"] || it.departmentalKpa || 'Functional Performance Area').trim();
          const annualTarget = it["annual target"] ?? it.annual_target ?? it.annualTarget ?? it.target ?? it["annual planned target"] ?? it.plannedAnnualTarget ?? it["yearly target"] ?? '';
          const q1 = it["1st qtr target"] ?? it.q1 ?? it.q1Target ?? it["1st_qtr_target"] ?? it["q1 target"] ?? it.quarter1 ?? it["1st quarter target"] ?? '';
          const q2 = it["2nd qtr target"] ?? it.q2 ?? it.q2Target ?? it["2nd_qtr_target"] ?? it["q2 target"] ?? it.quarter2 ?? it["2nd quarter target"] ?? '';
          const q3 = it["3rd qtr target"] ?? it.q3 ?? it.q3Target ?? it["3rd_qtr_target"] ?? it["q3 target"] ?? it.quarter3 ?? it["3rd quarter target"] ?? '';
          const q4 = it["4th qtr target"] ?? it.q4 ?? it.q4Target ?? it["4th_qtr_target"] ?? it["q4 target"] ?? it.quarter4 ?? it["4th quarter target"] ?? '';

          const kpiDesc = it["kpi description"] ?? 
            it.kpiDescription ?? 
            it["kpi_description"] ?? 
            it["Key Performance Indicators"] ?? 
            it["key performance indicators"] ?? 
            it["Key Performance Indicator"] ?? 
            it["key performance indicator"] ?? 
            it.kpi ?? 
            it.indicator ?? 
            it.description ?? 
            it.indicatorName ?? 
            it.measure ?? 
            it.output ?? 
            '';

          return {
            _id: `json-${Date.now()}-${idx + 1}`,
            _selected: true,
            "kpi no": String(it["kpi no"] || it.kpiNo || it.refNo || `KPI-${idx + 1}`).trim(),
            "kpi description": String(kpiDesc).trim(),
            "%wt": String(it["%wt"] || it.weighting || it.weight || '0').replace('%', '').trim(),
            "baseline": String(it.baseline ?? '').trim(),
            "annual target": String(annualTarget).trim(),
            "1st qtr target": String(q1).trim(),
            "2nd qtr target": String(q2).trim(),
            "3rd qtr target": String(q3).trim(),
            "4th qtr target": String(q4).trim(),
            "poe": String(it.poe || it.evidence || it.meansOfVerification || '').trim(),
            "budget": String(it.budget || it.totalBudgetAllocated || '').trim(),
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
    setHasUnsavedChanges(true);
    setExtractedItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        [field]: value
      };
      return updated;
    });
  };

  // Add new KPI Row
  const handleAddRow = () => {
    const newIdx = extractedItems.length + 1;
    const defaultKpa = uniqueFunctionalKpas[0] || 'KPA 1: Basic Service Delivery and Infrastructure Development';
    const newRow: ExtractedMappedKPI = {
      _id: `manual-kpi-${Date.now()}-${newIdx}`,
      _selected: true,
      "kpi no": `KPI-${String(newIdx).padStart(2, '0')}`,
      "kpi description": '',
      "%wt": '10',
      "baseline": '',
      "annual target": '',
      "1st qtr target": '',
      "2nd qtr target": '',
      "3rd qtr target": '',
      "4th qtr target": '',
      "poe": '',
      "budget": '',
      "functional kpa": defaultKpa,
      "kpa": defaultKpa
    };
    setExtractedItems(prev => [...prev, newRow]);
    setHasUnsavedChanges(true);
  };

  // Save current dataset to Supabase backend
  const handleSaveDataset = async () => {
    if (extractedItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'No KPI records to save.' });
      return;
    }
    setIsSavingDataset(true);
    setStatusMessage({ type: 'info', text: 'Saving extracted scorecard and edits to Supabase...' });
    try {
      const targetEmail = targetEmployeeEmail || currentUser.email;
      const res = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: extractedItems,
          kpas: extractedKpas,
          fileName: sourceFileName || 'Performance Agreement Scorecard',
          metadata: {
            ...agreementMetadata,
            totalWeight,
            kpiCount: extractedItems.length,
            savedBy: currentUser.email
          }
        })
      });

      if (!res.ok) {
        throw new Error(`Failed to save scorecard: Status ${res.status}`);
      }

      const data = await res.json();
      setHasUnsavedChanges(false);
      const timeStr = new Date().toLocaleTimeString();
      setLastSavedTime(timeStr);
      setStatusMessage({
        type: 'success',
        text: `Successfully saved ${extractedItems.length} KPI records across ${extractedKpas.length} KPAs (including all quarterly targets and baselines) to Supabase at ${timeStr}.`
      });
    } catch (err: any) {
      console.error("Save dataset error:", err);
      setStatusMessage({ type: 'error', text: `Save failed: ${err.message}` });
    } finally {
      setIsSavingDataset(false);
    }
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
    setHasUnsavedChanges(true);
    setExtractedItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // 6. Direct 1-Click Sync to IPMS Performance Plan Module (Annual Performance Planner Grid)
  const handleSyncToIPMS = async (targetProfile: "individual" | "team" = "individual") => {
    const selected = extractedItems.filter(it => it._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one KPI to sync to the IPMS Performance Plan.' });
      return;
    }

    setIsSyncingToIPMS(true);
    setStatusMessage({ type: 'info', text: `Syncing ${selected.length} KPIs into IPMS Annual Performance Planner Grid...` });

    try {
      const targetEmail = targetEmployeeEmail || currentUser.email;

      // Transform mapped schema strictly into IPMS PlanKPIItem format with verbatim edited values
      const ipmsPlanItems = selected.map((it, idx) => {
        const functionalKpa = it["functional kpa"] || it["kpa"] || 'Functional Performance Area';
        const kpaCode = resolveKpaCode(functionalKpa);

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
          bsd: kpaCode === 'bsd',
          led: kpaCode === 'led',
          mfvm: kpaCode === 'mfvm',
          ggpp: kpaCode === 'ggpp',
          midt: kpaCode === 'midt',
          sr: kpaCode === 'sr',
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

      // Automatically purge/clear the extraction snapshot from Supabase so it does not store mappings and clog up the engine
      try {
        await fetch(`/api/tenant/${activeTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(targetEmail)}`, {
          method: 'DELETE'
        });
        if (currentUser?.email && currentUser.email.toLowerCase() !== targetEmail.toLowerCase()) {
          await fetch(`/api/tenant/${activeTenantId}/fred-extraction/performance_agreement?userId=${encodeURIComponent(currentUser.email)}`, {
            method: 'DELETE'
          });
        }
      } catch(e) {
        console.warn("Auto-clear extraction snapshot warning:", e);
      }

      // Clear the engine completely
      setExtractedItems([]);
      setSourceFileName('');
      setPasteText('');
      setHasUnsavedChanges(false);
      setLastSavedTime(null);
      setKpaFilter('all');
      setActiveTab('upload');
      setCopiedJson(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setSyncSuccess(true);
      setStatusMessage({
        type: 'success',
        text: `Successfully pushed ${selected.length} KPIs directly into the Annual Performance Planner Grid for ${targetEmail}! The Extraction & Data Mapping Engine has been cleared completely.`
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

  // 10. Load Nkangala DM - Solly Links (MHS) Verified Performance Agreement
  const handleLoadNkangalaMhsPreset = () => {
    const presetItems: ExtractedMappedKPI[] = [
      {
        _id: 'nk-kpi-1',
        _selected: true,
        "kpi no": "1",
        "kpi description": "Number of departmental Training Needs Analysis submitted (TNA) by 30 March 2027",
        "%wt": "2",
        "baseline": "New",
        "annual target": "1",
        "1st qtr target": "N/A",
        "2nd qtr target": "N/A",
        "3rd qtr target": "1",
        "4th qtr target": "N/A",
        "poe": "Compliance Certificate issued by HRM&D Unit.",
        "budget": "OPEX",
        "functional kpa": "Skills Development",
        "kpa": "Skills Development"
      },
      {
        _id: 'nk-kpi-m15',
        _selected: true,
        "kpi no": "M_15",
        "kpi description": "Percentage of action plans implemented to address Strategic Risks Identified per quarter (MHS)",
        "%wt": "2",
        "baseline": "88",
        "annual target": "90%",
        "1st qtr target": "90%",
        "2nd qtr target": "90%",
        "3rd qtr target": "90%",
        "4th qtr target": "90%",
        "poe": "Signed Quarterly Strategic Risk report",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m16',
        _selected: true,
        "kpi no": "M_16",
        "kpi description": "Percentage of action plans implemented to address Operational Risks Identified per quarter (MHS)",
        "%wt": "2",
        "baseline": "100",
        "annual target": "98%",
        "1st qtr target": "98%",
        "2nd qtr target": "98%",
        "3rd qtr target": "98%",
        "4th qtr target": "98%",
        "poe": "Signed Quarterly Operational Risk report",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m17',
        _selected: true,
        "kpi no": "M_17",
        "kpi description": "Percentage of action plans implemented to address Fraud and corruption Risks Identified per quarter (MHS)",
        "%wt": "2",
        "baseline": "97",
        "annual target": "96%",
        "1st qtr target": "96%",
        "2nd qtr target": "96%",
        "3rd qtr target": "96%",
        "4th qtr target": "96%",
        "poe": "Signed Quarterly Fraud and corruption Risk report",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m21',
        _selected: true,
        "kpi no": "M_21",
        "kpi description": "Attain clean audit opinion by 31 December 2026.",
        "%wt": "3",
        "baseline": "1 (Unqualified with matters)",
        "annual target": "1 (Clean audit)",
        "1st qtr target": "N/A",
        "2nd qtr target": "1 (Clean audit)",
        "3rd qtr target": "N/A",
        "4th qtr target": "N/A",
        "poe": "AG’s Audit Report",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m22',
        _selected: true,
        "kpi no": "M_22",
        "kpi description": "Number of repeat audit findings (circular 88) by 30 December 2026.",
        "%wt": "1",
        "baseline": "0",
        "annual target": "≤ 0",
        "1st qtr target": "N/A",
        "2nd qtr target": "≤ 0",
        "3rd qtr target": "N/A",
        "4th qtr target": "N/A",
        "poe": "AG’s Audit Report",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m23',
        _selected: true,
        "kpi no": "M_23",
        "kpi description": "Number of Action Plan on issues raised by the Auditor General tabled to Council by 30 December 2026.",
        "%wt": "1",
        "baseline": "1",
        "annual target": "1",
        "1st qtr target": "N/A",
        "2nd qtr target": "1",
        "3rd qtr target": "N/A",
        "4th qtr target": "N/A",
        "poe": "Audit Action Plan and Council resolution",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m24',
        _selected: true,
        "kpi no": "M_24",
        "kpi description": "Percentage of AG Findings raised in the Management Letter resolved (MHS) by 30 June 2027.",
        "%wt": "1",
        "baseline": "100%",
        "annual target": "100%",
        "1st qtr target": "N/A",
        "2nd qtr target": "N/A",
        "3rd qtr target": "40%",
        "4th qtr target": "100%",
        "poe": "Signed Progress Report on the Implementation of the Audit Action Plan.",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m36',
        _selected: true,
        "kpi no": "M_36",
        "kpi description": "Percentage of strategic lekgotla resolutions implemented by 30 June 2027. (MHS)",
        "%wt": "1",
        "baseline": "100%",
        "annual target": "100%",
        "1st qtr target": "100%",
        "2nd qtr target": "100%",
        "3rd qtr target": "100%",
        "4th qtr target": "100%",
        "poe": "Signed Strategic Lekgotla monitoring report",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m37',
        _selected: true,
        "kpi no": "M_37",
        "kpi description": "Number of reports on Council Resolutions submitted to Council per quarter (MHS)",
        "%wt": "4",
        "baseline": "4",
        "annual target": "4",
        "1st qtr target": "1",
        "2nd qtr target": "1",
        "3rd qtr target": "1",
        "4th qtr target": "1",
        "poe": "Signed Quarterly Reports and Council Resolution.",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m40',
        _selected: true,
        "kpi no": "M_40",
        "kpi description": "Percentage of internal audit recommendations implemented by 30 June 2027 (MHS)",
        "%wt": "1",
        "baseline": "96",
        "annual target": "100%",
        "1st qtr target": "100%",
        "2nd qtr target": "100%",
        "3rd qtr target": "100%",
        "4th qtr target": "100%",
        "poe": "Signed Quarterly IA report",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m41',
        _selected: true,
        "kpi no": "M_41",
        "kpi description": "Percentage of audit committee resolutions implemented by 30 June 2027.",
        "%wt": "1",
        "baseline": "96",
        "annual target": "100%",
        "1st qtr target": "100%",
        "2nd qtr target": "100%",
        "3rd qtr target": "100%",
        "4th qtr target": "100%",
        "poe": "Signed Quarterly Audit committee resolution register",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-2',
        _selected: true,
        "kpi no": "2",
        "kpi description": "Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026",
        "%wt": "4",
        "baseline": "1",
        "annual target": "1",
        "1st qtr target": "1",
        "2nd qtr target": "N/A",
        "3rd qtr target": "N/A",
        "4th qtr target": "N/A",
        "poe": "Compliance certificate from OPME & PMDS unit",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-3',
        _selected: true,
        "kpi no": "3",
        "kpi description": "Number of performance agreements signed with subordinates and submitted to OPME & PMDS unit for the 2026/2027 financial year by 30 July 2026",
        "%wt": "4",
        "baseline": "06",
        "annual target": "(06)",
        "1st qtr target": "(06)",
        "2nd qtr target": "N/A",
        "3rd qtr target": "N/A",
        "4th qtr target": "N/A",
        "poe": "Compliance certificate from OPME & PMDS unit",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-4',
        _selected: true,
        "kpi no": "4",
        "kpi description": "Number of self-assessment report compiled and submitted to Supervisor per quarter.",
        "%wt": "2",
        "baseline": "2",
        "annual target": "4",
        "1st qtr target": "1 (annual assessment)",
        "2nd qtr target": "1 (Q1 assessment)",
        "3rd qtr target": "1 (midyear assessment)",
        "4th qtr target": "1 (Q3 assessment)",
        "poe": "Quarterly Compliance certificate from OPME & PMDS unit",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-5',
        _selected: true,
        "kpi no": "5",
        "kpi description": "Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026",
        "%wt": "2",
        "baseline": "1",
        "annual target": "1 (annual assessment)",
        "1st qtr target": "1 (annual assessment)",
        "2nd qtr target": "N/A",
        "3rd qtr target": "N/A",
        "4th qtr target": "N/A",
        "poe": "Compliance certificate from OPME & PMDS unit",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-6',
        _selected: true,
        "kpi no": "6",
        "kpi description": "Number of informal performance evaluation conducted with all subordinates per quarter",
        "%wt": "1",
        "baseline": "2",
        "annual target": "2 (Q1 & Q3)",
        "1st qtr target": "N/A",
        "2nd qtr target": "1 (Q1)",
        "3rd qtr target": "N/A",
        "4th qtr target": "1 (Q3)",
        "poe": "Compliance certificate from OPME & PMDS unit",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-7',
        _selected: true,
        "kpi no": "7",
        "kpi description": "Number of quarterly leave reconciliation report submitted to Departmental General Manager (within 30 days after end of each quarter)",
        "%wt": "2",
        "baseline": "4",
        "annual target": "4",
        "1st qtr target": "1",
        "2nd qtr target": "1",
        "3rd qtr target": "1",
        "4th qtr target": "1",
        "poe": "Compliance certificate from corporate services",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-8',
        _selected: true,
        "kpi no": "8",
        "kpi description": "Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027 (MHS)",
        "%wt": "1",
        "baseline": "100%",
        "annual target": "100%",
        "1st qtr target": "100%",
        "2nd qtr target": "100%",
        "3rd qtr target": "100%",
        "4th qtr target": "100%",
        "poe": "Compliance certificate from Corporate Services",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-9',
        _selected: true,
        "kpi no": "9",
        "kpi description": "Percentage of leave approvals processed within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027 (MHS)",
        "%wt": "2",
        "baseline": "100%",
        "annual target": "100%",
        "1st qtr target": "100%",
        "2nd qtr target": "100%",
        "3rd qtr target": "100%",
        "4th qtr target": "100%",
        "poe": "Compliance certificate from Corporate Services",
        "budget": "OPEX",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-10',
        _selected: true,
        "kpi no": "10",
        "kpi description": "Number of Municipal Health Services joint operations conducted with sector Departments per quarter",
        "%wt": "6",
        "baseline": "70",
        "annual target": "50 (The unit has reached joint operation target",
        "1st qtr target": "12",
        "2nd qtr target": "12",
        "3rd qtr target": "13",
        "4th qtr target": "13",
        "poe": "MHS report and attendance registers",
        "budget": "Opex",
        "functional kpa": "Good Governance and Public Participation",
        "kpa": "Good Governance and Public Participation"
      },
      {
        _id: 'nk-kpi-m53',
        _selected: true,
        "kpi no": "M_53",
        "kpi description": "Percentage of operational budget actually spent (circular 88) by 30 June 2027.",
        "%wt": "3",
        "baseline": "93",
        "annual target": "90%",
        "1st qtr target": "20%",
        "2nd qtr target": "40%",
        "3rd qtr target": "60%",
        "4th qtr target": "90%",
        "poe": "Signed Operational Expenditure progress report",
        "budget": "R 5 380",
        "functional kpa": "Financial Viability Management",
        "kpa": "Financial Viability Management"
      },
      {
        _id: 'nk-kpi-11',
        _selected: true,
        "kpi no": "11",
        "kpi description": "Number of Municipal Health Services Facility owners Training conducted per quarter",
        "%wt": "7",
        "baseline": "94",
        "annual target": "60 (The unit has reached its limit)",
        "1st qtr target": "15",
        "2nd qtr target": "15",
        "3rd qtr target": "15",
        "4th qtr target": "15",
        "poe": "MHS report and attendance registers",
        "budget": "Opex",
        "functional kpa": "Community Engagement",
        "kpa": "Community Engagement"
      },
      {
        _id: 'nk-kpi-12',
        _selected: true,
        "kpi no": "12",
        "kpi description": "Number of community-based campaigns conducted by 30 June 2026 (Disaster Risk reduction awareness, MHS & Environmental Management awareness and Climate Change Awareness)",
        "%wt": "7",
        "baseline": "5",
        "annual target": "4",
        "1st qtr target": "1",
        "2nd qtr target": "1",
        "3rd qtr target": "1",
        "4th qtr target": "1",
        "poe": "CDS programme report and attendance registers",
        "budget": "450 000",
        "functional kpa": "Community Engagement",
        "kpa": "Community Engagement"
      },
      {
        _id: 'nk-kpi-13',
        _selected: true,
        "kpi no": "13",
        "kpi description": "Number of water samples taken per quarter from all participating municipalities, analysed as per the standards",
        "%wt": "7",
        "baseline": "3827",
        "annual target": "3400 (target depend on budget hence the reduction and the unit has reached the limit",
        "1st qtr target": "850",
        "2nd qtr target": "850",
        "3rd qtr target": "850",
        "4th qtr target": "850",
        "poe": "MHS Quarterly Report and Water Listing spreadsheet",
        "budget": "R2000 000",
        "functional kpa": "KPA 5: Basic Service Delivery and Infrastructure: Water Quality Monitoring",
        "kpa": "KPA 5: Basic Service Delivery and Infrastructure: Water Quality Monitoring"
      },
      {
        _id: 'nk-kpi-14',
        _selected: true,
        "kpi no": "14",
        "kpi description": "Number of food samples conducted in terms of the Foodstuffs, Cosmetics, Disinfectant Act (FCDA) per quarter",
        "%wt": "5",
        "baseline": "432",
        "annual target": "320 limited due to budget",
        "1st qtr target": "80",
        "2nd qtr target": "80",
        "3rd qtr target": "80",
        "4th qtr target": "80",
        "poe": "Quarterly report and Laboratory sampling forms",
        "budget": "110 000",
        "functional kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises",
        "kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises"
      },
      {
        _id: 'nk-kpi-15',
        _selected: true,
        "kpi no": "15",
        "kpi description": "Number of food handling and preparation facility inspections conducted in terms of the Foodstuffs, Cosmetics, Disinfectant Act (FCDA) per quarter",
        "%wt": "6",
        "baseline": "6278",
        "annual target": "5040 (target reduced due to EHP is limited to 15 food premises. Unit has reached the limit.",
        "1st qtr target": "1260",
        "2nd qtr target": "1260",
        "3rd qtr target": "1260",
        "4th qtr target": "1260",
        "poe": "MHS report and spreadsheet listing",
        "budget": "OPEX",
        "functional kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises",
        "kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises"
      },
      {
        _id: 'nk-kpi-16',
        _selected: true,
        "kpi no": "16",
        "kpi description": "Number of Health Care facilities (clinic, hospitals) inspected",
        "%wt": "5",
        "baseline": "501",
        "annual target": "420 (target reduced the Unit has reached the limit.",
        "1st qtr target": "105",
        "2nd qtr target": "105",
        "3rd qtr target": "105",
        "4th qtr target": "105",
        "poe": "MHS report and spreadsheet listing",
        "budget": "OPEX",
        "functional kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises",
        "kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises"
      },
      {
        _id: 'nk-kpi-17',
        _selected: true,
        "kpi no": "17",
        "kpi description": "Number of mortuaries / funeral undertakers inspections conducted Per quarter",
        "%wt": "5",
        "baseline": "372",
        "annual target": "320 (the unit has reached the limit on performance for this KPI. Some premises are closing.",
        "1st qtr target": "80",
        "2nd qtr target": "80",
        "3rd qtr target": "80",
        "4th qtr target": "80",
        "poe": "MHS report and spreadsheet listing",
        "budget": "OPEX",
        "functional kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises",
        "kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises"
      },
      {
        _id: 'nk-kpi-18',
        _selected: true,
        "kpi no": "18",
        "kpi description": "Number of ECD, Day care centres, Pre-schools, stimulation centres inspected",
        "%wt": "6",
        "baseline": "1219",
        "annual target": "900 (the KPI within the unit has reached the limit",
        "1st qtr target": "230",
        "2nd qtr target": "220",
        "3rd qtr target": "220",
        "4th qtr target": "230",
        "poe": "MHS report and spreadsheet listing",
        "budget": "OPEX",
        "functional kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises",
        "kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises"
      },
      {
        _id: 'nk-kpi-19',
        _selected: true,
        "kpi no": "19",
        "kpi description": "Number of landfill site/transfer stations/illegal dumping inspected per quarter",
        "%wt": "5",
        "baseline": "327",
        "annual target": "240",
        "1st qtr target": "60",
        "2nd qtr target": "60",
        "3rd qtr target": "60",
        "4th qtr target": "60",
        "poe": "MHS report and spreadsheet listing",
        "budget": "OPEX",
        "functional kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises",
        "kpa": "KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises"
      }
    ];

    const presetKpas: ExtractedKpaDefinition[] = [
      { kpaNumber: '1', kpaName: 'Skills Development', fullTitle: 'KPA 1: Skills Development', title: 'Skills Development', weighting: '2', allocatedWeight: 2, kpiCount: 1, totalKpiWeight: 2, code: 'midt' },
      { kpaNumber: '2', kpaName: 'Good Governance and Public Participation', fullTitle: 'KPA 2: Good Governance and Public Participation', title: 'Good Governance and Public Participation', weighting: '44', allocatedWeight: 44, kpiCount: 20, totalKpiWeight: 38, code: 'ggpp' },
      { kpaNumber: '3', kpaName: 'Financial Viability Management', fullTitle: 'KPA 3: Financial Viability Management', title: 'Financial Viability Management', weighting: '3', allocatedWeight: 3, kpiCount: 1, totalKpiWeight: 3, code: 'mfvm' },
      { kpaNumber: '4', kpaName: 'Community Engagement', fullTitle: 'KPA 4: Community Engagement', title: 'Community Engagement', weighting: '14', allocatedWeight: 14, kpiCount: 2, totalKpiWeight: 14, code: 'ggpp' },
      { kpaNumber: '5A', kpaName: 'Basic Service Delivery and Infrastructure: Water Quality Monitoring', fullTitle: 'KPA 5: Basic Service Delivery and Infrastructure: Water Quality Monitoring', title: 'Basic Service Delivery and Infrastructure: Water Quality Monitoring', weighting: '7', allocatedWeight: 7, kpiCount: 1, totalKpiWeight: 7, code: 'bsd' },
      { kpaNumber: '5B', kpaName: 'Basic Service Delivery and Infrastructure: Health Surveillance of Premises', fullTitle: 'KPA 5: Basic Service Delivery and Infrastructure: Health Surveillance of Premises', title: 'Basic Service Delivery and Infrastructure: Health Surveillance of Premises', weighting: '32', allocatedWeight: 32, kpiCount: 6, totalKpiWeight: 32, code: 'bsd' }
    ];

    setExtractedItems(presetItems);
    setExtractedKpas(presetKpas);
    setAgreementMetadata({
      employeeName: 'Solly Links',
      position: 'Divisional Manager - MHS',
      department: 'Community Development Services (Municipal Health Services)',
      municipality: 'The Nkangala District Municipality',
      financialYear: '2026/2027 Financial Year'
    });
    setSourceFileName('Solly Links - DM MHS 2026-2027 Performance Agreement.pdf');
    setActiveTab('results');
    setKpaFilter('all');
    setStatusMessage({
      type: 'success',
      text: 'Loaded complete 31-KPI Performance Agreement for Solly Links (DM: MHS). "Health Surveillance of Premises" is now actively mapped as a distinct KPA with its 6 KPIs and 32% weight!'
    });
  };

  // Filter items by Functional KPA
  const filteredItems = useMemo(() => {
    return extractedItems.filter(it => {
      if (kpaFilter === 'all') return true;
      const itemKpa = (it["functional kpa"] || it["kpa"] || '').trim().toLowerCase();
      const filterLower = kpaFilter.toLowerCase();
      if (itemKpa === filterLower || itemKpa.includes(filterLower) || filterLower.includes(itemKpa)) return true;

      // Alphanumeric normalized matching (handles colons, hyphens, prefixes like "KPA 5:")
      const itemClean = itemKpa.replace(/[^a-z0-9]/g, '');
      const filterClean = filterLower.replace(/[^a-z0-9]/g, '');
      if (itemClean && filterClean && (itemClean.includes(filterClean) || filterClean.includes(itemClean))) return true;

      // Departmental sub-focus keyword matching
      if (filterLower.includes('water quality') && itemKpa.includes('water quality')) return true;
      if (filterLower.includes('health surveil') && itemKpa.includes('health surveil')) return true;

      if (['bsd', 'midt', 'mfvm', 'ggpp', 'led', 'sr'].includes(filterLower)) {
        return resolveKpaCode(itemKpa).toLowerCase() === filterLower;
      }
      return false;
    });
  }, [extractedItems, kpaFilter]);

  // Group items by their parent KPA for structured hierarchy display
  const groupedKpaSections = useMemo(() => {
    const groups: {
      kpaDef: ExtractedKpaDefinition;
      items: { item: ExtractedMappedKPI; originalIndex: number }[];
    }[] = [];

    const assignedIndices = new Set<number>();

    // 1. Group by known extractedKpas if available
    if (extractedKpas.length > 0) {
      extractedKpas.forEach(kpaDef => {
        const matching: { item: ExtractedMappedKPI; originalIndex: number }[] = [];
        const defTitle = (kpaDef.title || kpaDef.fullTitle || kpaDef.kpaName || '').trim().toLowerCase();

        filteredItems.forEach((it, idx) => {
          const originalIdx = extractedItems.findIndex(orig => orig === it);
          const actualIdx = originalIdx >= 0 ? originalIdx : idx;
          if (assignedIndices.has(actualIdx)) return;

          const itemKpa = (it["functional kpa"] || it["kpa"] || '').trim().toLowerCase();

          const defTitleClean = defTitle.replace(/[^a-z0-9]/g, '');
          const itemKpaClean = itemKpa.replace(/[^a-z0-9]/g, '');
          const matchesTitle = defTitle && (
            itemKpa === defTitle || 
            itemKpa.includes(defTitle) || 
            defTitle.includes(itemKpa) ||
            (defTitleClean.length > 3 && itemKpaClean.length > 3 && (itemKpaClean.includes(defTitleClean) || defTitleClean.includes(itemKpaClean))) ||
            (defTitle.includes('water quality') && itemKpa.includes('water quality')) ||
            (defTitle.includes('health surveil') && itemKpa.includes('health surveil'))
          );
          // If another KPA definition has an exact or closer title match, do not steal via code
          const hasMoreSpecificTitleMatch = extractedKpas.some(other => {
            if (other === kpaDef) return false;
            const otherTitle = (other.title || other.fullTitle || other.kpaName || '').trim().toLowerCase();
            const otherClean = otherTitle.replace(/[^a-z0-9]/g, '');
            return otherTitle && (
              itemKpa === otherTitle || 
              itemKpa.includes(otherTitle) || 
              otherTitle.includes(itemKpa) ||
              (otherClean.length > 3 && itemKpaClean.length > 3 && (itemKpaClean.includes(otherClean) || otherClean.includes(itemKpaClean))) ||
              (otherTitle.includes('water quality') && itemKpa.includes('water quality')) ||
              (otherTitle.includes('health surveil') && itemKpa.includes('health surveil'))
            );
          });
          const matchesCode = !hasMoreSpecificTitleMatch && kpaDef.code && resolveKpaCode(itemKpa) === kpaDef.code;

          if (matchesTitle || matchesCode) {
            matching.push({ item: it, originalIndex: actualIdx });
            assignedIndices.add(actualIdx);
          }
        });

        if (matching.length > 0) {
          groups.push({
            kpaDef: {
              ...kpaDef,
              title: kpaDef.title || kpaDef.fullTitle || kpaDef.kpaName || 'Key Performance Area'
            },
            items: matching
          });
        }
      });
    }

    // 2. Capture any remaining items not matching extractedKpas
    const remaining: { item: ExtractedMappedKPI; originalIndex: number }[] = [];
    filteredItems.forEach((it, idx) => {
      const originalIdx = extractedItems.findIndex(orig => orig === it);
      const actualIdx = originalIdx >= 0 ? originalIdx : idx;
      if (!assignedIndices.has(actualIdx)) {
        remaining.push({ item: it, originalIndex: actualIdx });
      }
    });

    if (remaining.length > 0) {
      const map = new Map<string, { item: ExtractedMappedKPI; originalIndex: number }[]>();
      remaining.forEach(entry => {
        const title = (entry.item["functional kpa"] || entry.item["kpa"] || 'Other Functional Areas').trim();
        if (!map.has(title)) map.set(title, []);
        map.get(title)!.push(entry);
      });

      map.forEach((items, title) => {
        const code = resolveKpaCode(title);
        const totalW = items.reduce((s, it) => s + (parseFloat(it.item["%wt"]) || 0), 0);
        groups.push({
          kpaDef: {
            title,
            fullTitle: title,
            kpaName: title,
            code,
            kpiCount: items.length,
            totalKpiWeight: totalW
          },
          items
        });
      });
    }

    return groups;
  }, [filteredItems, extractedItems, extractedKpas]);

  if (engineMode === 'sdbip_top_layer') {
    return (
      <div id="extraction_engine_container" className="flex flex-col h-full bg-slate-900 text-slate-100 overflow-hidden">
        {/* Top Engine Mode Selector Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine:</span>
            <div className="inline-flex p-1 bg-slate-900 border border-slate-700/60 rounded-xl">
              <button
                id="btn-switch-to-ipms"
                type="button"
                onClick={() => setEngineMode('performance_plan')}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1.5"
              >
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Individual Performance Plan (IPMS)</span>
              </button>
              <button
                id="btn-switch-to-sdbip-active"
                type="button"
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white shadow-sm flex items-center gap-1.5 cursor-default"
              >
                <Landmark className="w-3.5 h-3.5 text-emerald-200" />
                <span>SDBIP Top Layer &amp; Reporting Engine</span>
                <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 ml-1">
                  Active
                </span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Target: SDBIP Top Layer &amp; Reporting Table ONLY
            </span>
            <button
              type="button"
              onClick={() => setEngineMode('performance_plan')}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-bold rounded-lg border border-slate-700 transition cursor-pointer"
            >
              Switch to IPMS Engine
            </button>
          </div>
        </div>

        {/* Dedicated SDBIP Extraction & Data Mapping Engine */}
        <div className="flex-1 overflow-hidden">
          <SDBIPExtractionEngine
            currentUser={currentUser}
            activeTenantId={activeTenantId}
            onNavigateToSDBIP={onNavigateToSDBIP}
          />
        </div>
      </div>
    );
  }

  return (
    <div id="extraction_engine_container" className="flex flex-col h-full bg-slate-900 text-slate-100 p-6 overflow-y-auto space-y-6">
      
      {/* TOP ENGINE MODE SELECTOR BAR */}
      <div className="bg-slate-950 border border-slate-800/80 rounded-xl px-5 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Engine:</span>
          <div className="inline-flex p-1 bg-slate-900 border border-slate-700/60 rounded-xl">
            <button
              id="btn-switch-to-ipms-active"
              type="button"
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-600 text-white shadow-sm flex items-center gap-1.5 cursor-default"
            >
              <Cpu className="w-3.5 h-3.5 text-indigo-200" />
              <span>Individual Performance Plan (IPMS)</span>
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-400/40 ml-1">
                Active
              </span>
            </button>
            <button
              id="btn-switch-to-sdbip-separate"
              type="button"
              onClick={() => setEngineMode('sdbip_top_layer')}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold text-slate-400 hover:text-white transition cursor-pointer flex items-center gap-1.5"
            >
              <Landmark className="w-3.5 h-3.5 text-emerald-400" />
              <span>SDBIP Top Layer &amp; Reporting Engine</span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-950/50 text-emerald-400 border border-emerald-600/30 ml-1">
                SDBIP ONLY
              </span>
            </button>
          </div>
        </div>

        {/* Separate Extraction Button */}
        <div className="flex items-center gap-2">
          <button
            id="btn-quick-extract-sdbip-separate"
            type="button"
            onClick={() => setEngineMode('sdbip_top_layer')}
            className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
          >
            <Landmark className="w-3.5 h-3.5 text-emerald-200" />
            <span>Extract SDBIP Top Layer &amp; Reporting</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-200" />
          </button>
        </div>
      </div>

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
            {/* Separate SDBIP Extraction Button right in header banner */}
            <button
              id="btn-header-extract-sdbip"
              type="button"
              onClick={() => setEngineMode('sdbip_top_layer')}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 cursor-pointer"
            >
              <Landmark className="w-4 h-4 text-emerald-300" />
              <span>Extract SDBIP Top Layer</span>
            </button>

            {extractedItems.length > 0 && (
              <div className="flex items-center gap-2">
                {/* DUAL LAYER EXTRACT BUTTONS */}
                {['hlezard@nkangaladm.gov.za', 'dimpems@nkangaladm.gov.za', 'madihlabapk@nkangaladm.gov.za', 'mazwitc@nkangaladm.gov.za', 'bembem@nkangaladm.gov.za', 'masanabol@nkangaladm.gov.za'].includes((currentUser?.email || '').toLowerCase().trim()) ? (
                  <div className="flex gap-2">
                    <button
                      id="btn_sync_to_ipms_module_indiv"
                      onClick={() => handleSyncToIPMS('individual')}
                      disabled={isSyncingToIPMS}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      {isSyncingToIPMS ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      <span>Push to Personal Performance Plan</span>
                    </button>
                    <button
                      id="btn_sync_to_ipms_module_team"
                      onClick={() => handleSyncToIPMS('team')}
                      disabled={isSyncingToIPMS}
                      className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-indigo-600/30 disabled:opacity-50 cursor-pointer"
                    >
                      {isSyncingToIPMS ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <ArrowRight className="w-4 h-4" />
                      )}
                      <span>Push to Team Performance Plan</span>
                    </button>
                  </div>
                ) : (
                  <button
                    id="btn_sync_to_ipms_module"
                    onClick={() => handleSyncToIPMS('individual')}
                    disabled={isSyncingToIPMS}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-black flex items-center gap-2 transition shadow-lg shadow-emerald-600/30 disabled:opacity-50 cursor-pointer"
                  >
                    {isSyncingToIPMS ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <ArrowRight className="w-4 h-4" />
                    )}
                    <span>Push to Personal Performance Plan</span>
                  </button>
                )}
              </div>
            )}
            </div>
          </div>
        </div>

      {/* TABS NAVIGATION */}
      <div className="flex bg-slate-950/50 border border-slate-800 rounded-xl p-1 gap-1 shrink-0">
        <button onClick={() => setActiveTab('upload')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'upload' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <Upload className="w-4 h-4" /> Upload Document
        </button>
        <button onClick={() => setActiveTab('paste')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'paste' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <FileText className="w-4 h-4" /> Paste Table
        </button>
        <button onClick={() => setActiveTab('results')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'results' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <Table className="w-4 h-4" /> Data Mapping
        </button>
        <button onClick={() => setActiveTab('json')} className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 ${activeTab === 'json' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
          <Code2 className="w-4 h-4" /> JSON Schema
        </button>
      </div>

      {activeTab === 'upload' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-8 flex flex-col items-center justify-center min-h-[400px] border-dashed">
          <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4">
            <Upload className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Upload Scorecard Document</h2>
          <p className="text-slate-400 text-sm mb-6 text-center max-w-md">
            Upload a PDF, Word (.docx), or Excel (.xlsx/.csv) file containing your performance scorecard table. The engine will automatically extract and map the KPIs.
          </p>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".pdf,.docx,.xlsx,.xls,.csv,.json"
            className="hidden"
          />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition cursor-pointer"
            >
              {isProcessing ? <RefreshCw className="w-5 h-5 animate-spin" /> : <FileText className="w-5 h-5" />}
              {isProcessing ? 'Extracting Data...' : 'Select File to Extract'}
            </button>
            <button
              type="button"
              onClick={handleLoadNkangalaMhsPreset}
              className="px-5 py-3 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-200 font-bold rounded-xl flex items-center gap-2 shadow-lg transition cursor-pointer"
              title="Load full 31-KPI Nkangala DM MHS Scorecard with distinct Health Surveillance of Premises KPA"
            >
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Load Nkangala DM (MHS) Demo Scorecard</span>
            </button>
            <button
              type="button"
              onClick={() => setEngineMode('sdbip_top_layer')}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition cursor-pointer"
            >
              <Landmark className="w-5 h-5 text-emerald-300" />
              <span>Extract SDBIP Top Layer Document Instead</span>
            </button>
          </div>

          {/* SDBIP Dedicated Engine Notice Card */}
          <div className="mt-6 p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl flex items-center justify-between gap-4 max-w-xl text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Landmark className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">Extracting an SDBIP Top Layer Scorecard?</h4>
                <p className="text-[11px] text-emerald-300/80 mt-0.5">Use the separate SDBIP engine to map directly &amp; solely to SDBIP Top Layer &amp; Reporting tables.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEngineMode('sdbip_top_layer')}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-lg transition shrink-0 cursor-pointer flex items-center gap-1 shadow-xs"
            >
              <span>Switch Engine</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {activeTab === 'paste' && (
        <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6 flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">Paste Table Content</h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadNkangalaMhsPreset}
                className="px-3.5 py-2 bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 font-bold rounded-xl flex items-center gap-1.5 transition text-xs cursor-pointer"
                title="Load full 31-KPI Nkangala DM MHS Scorecard"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Load Nkangala DM (MHS) Demo</span>
              </button>
              <button
                onClick={handleParsePastedText}
                disabled={isProcessing || !pasteText.trim()}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition text-sm cursor-pointer"
              >
                {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {isProcessing ? 'Processing...' : 'Extract KPIs from Pasted Data'}
              </button>
            </div>
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your Excel or Word table here..."
            className="flex-1 w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:border-indigo-500 font-mono resize-none"
          />
        </div>
      )}

      {activeTab === 'results' && (
        <div className="space-y-4">

          {/* Unsaved changes notification banner */}
          {hasUnsavedChanges && (
            <div className="bg-amber-950/70 border border-amber-600/50 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-amber-200 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Unsaved changes detected:</strong> You have edited KPI descriptions, baselines, weights, or targets. Click <strong>"Save Changes"</strong> to save to database or <strong>"Push to IPMS Performance Plan"</strong> to sync.
                </span>
              </div>
              <button
                onClick={handleSaveDataset}
                disabled={isSavingDataset}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Now</span>
              </button>
            </div>
          )}

          {/* Last saved info */}
          {lastSavedTime && !hasUnsavedChanges && (
            <div className="text-[11px] text-emerald-400/90 flex items-center gap-1.5 px-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>All changes saved to database at {lastSavedTime}.</span>
            </div>
          )}

          {/* AGREEMENT METADATA BANNER (IF DETECTED) */}
          {agreementMetadata && (agreementMetadata.employeeName || agreementMetadata.department || agreementMetadata.financialYear) && (
            <div className="bg-slate-950/80 border border-indigo-900/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-300">
              <div className="flex flex-wrap items-center gap-4">
                {agreementMetadata.employeeName && (
                  <div className="flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-slate-400">Employee:</span>
                    <strong className="text-white font-medium">{agreementMetadata.employeeName}</strong>
                  </div>
                )}
                {agreementMetadata.position && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Position:</span>
                    <strong className="text-indigo-200">{agreementMetadata.position}</strong>
                  </div>
                )}
                {agreementMetadata.department && (
                  <div className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-slate-400">Department:</span>
                    <strong className="text-slate-200">{agreementMetadata.department}</strong>
                  </div>
                )}
                {agreementMetadata.financialYear && (
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-slate-400">Period:</span>
                    <strong className="text-amber-200 font-mono">{agreementMetadata.financialYear}</strong>
                  </div>
                )}
                {agreementMetadata.municipality && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">Municipality:</span>
                    <strong className="text-slate-200">{agreementMetadata.municipality}</strong>
                  </div>
                )}
              </div>
              <div className="text-[11px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                Section 4.2 Scorecard Extraction
              </div>
            </div>
          )}

          {/* KPA ALIGNMENT & HIERARCHY OVERVIEW CARDS */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Key Performance Areas (KPAs) &amp; Hierarchy Mapping</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded-full">
                  {extractedKpas.length > 0 ? extractedKpas.length : uniqueFunctionalKpas.length} KPAs Extracted
                </span>
              </div>
              <div className="text-xs text-slate-400">
                Every KPI is strictly mapped and bound to its parent Key Performance Area banner.
              </div>
            </div>

            {/* Grid of KPA cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {(extractedKpas.length > 0 ? extractedKpas : deriveKpaSummaries(extractedItems)).map((kpaDef, kIdx) => {
                const kpaTitle = kpaDef.title || kpaDef.fullTitle || kpaDef.kpaName || `KPA ${kIdx + 1}`;
                const isSelected = kpaFilter.toLowerCase() === kpaTitle.toLowerCase() ||
                  (kpaDef.fullTitle && kpaFilter.toLowerCase() === kpaDef.fullTitle.toLowerCase()) ||
                  (kpaDef.kpaName && kpaFilter.toLowerCase() === kpaDef.kpaName.toLowerCase());
                const isAligned = kpaDef.allocatedWeight !== undefined ? Math.round(kpaDef.totalKpiWeight || 0) === Math.round(kpaDef.allocatedWeight) : true;

                return (
                  <button
                    key={kIdx}
                    type="button"
                    onClick={() => setKpaFilter(isSelected ? 'all' : kpaTitle)}
                    className={`text-left p-3 rounded-xl border transition cursor-pointer flex flex-col justify-between gap-2.5 ${
                      isSelected
                        ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-900/30'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                          kpaDef.code === 'bsd' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                          kpaDef.code === 'midt' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                          kpaDef.code === 'mfvm' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                          kpaDef.code === 'ggpp' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' :
                          kpaDef.code === 'led' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                          'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}>
                          {kpaDef.code ? kpaDef.code.toUpperCase() : 'KPA'}
                        </span>
                        <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight" title={kpaTitle}>
                          {kpaTitle}
                        </h4>
                      </div>
                      {isSelected && (
                        <span className="text-[10px] font-black text-indigo-400 bg-indigo-950 px-1.5 py-0.5 rounded border border-indigo-500/40">
                          Active
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400">
                        KPIs: <strong className="text-white">{kpaDef.kpiCount}</strong>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-400">
                          Weight: <strong className="text-amber-300 font-mono">{kpaDef.totalKpiWeight}%</strong>
                        </span>
                        {kpaDef.allocatedWeight !== undefined && (
                          <span className="text-slate-500 font-mono text-[10px]">
                            (Plan: {kpaDef.allocatedWeight}%)
                          </span>
                        )}
                      </div>
                    </div>

                    {kpaDef.allocatedWeight !== undefined && (
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-slate-400">Framework Alignment:</span>
                        <span className={`font-bold px-1.5 py-0.2 rounded ${
                          isAligned ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30' : 'bg-amber-950/80 text-amber-300 border border-amber-500/30'
                        }`}>
                          {isAligned ? '100% Aligned' : `${(kpaDef.totalKpiWeight || 0) > kpaDef.allocatedWeight ? '+' : ''}${((kpaDef.totalKpiWeight || 0) - kpaDef.allocatedWeight).toFixed(0)}% Variance`}
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* FILTER & GROUPING TOOLBAR */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 border border-slate-800 rounded-xl p-2.5 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
                <Filter className="w-3 h-3 text-slate-400" /> Filter KPA:
              </span>
              <button
                type="button"
                onClick={() => setKpaFilter('all')}
                className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  kpaFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                All KPAs ({extractedItems.length})
              </button>
              {(extractedKpas.length > 0 ? extractedKpas : deriveKpaSummaries(extractedItems)).map((kpa, idx) => {
                const kTitle = kpa.title || kpa.fullTitle || kpa.kpaName || `KPA ${idx + 1}`;
                const isSelected = kpaFilter.toLowerCase() === kTitle.toLowerCase() ||
                  (kpa.fullTitle && kpaFilter.toLowerCase() === kpa.fullTitle.toLowerCase()) ||
                  (kpa.kpaName && kpaFilter.toLowerCase() === kpa.kpaName.toLowerCase());
                
                let shortLabel = kpa.kpaName || kpa.title || `KPA ${idx + 1}`;
                if (shortLabel.toLowerCase().includes('water quality')) shortLabel = 'Water Quality';
                else if (shortLabel.toLowerCase().includes('health surveil')) shortLabel = 'Health Surveillance';
                else if (kpa.code && shortLabel.length > 25) shortLabel = `${kpa.code.toUpperCase()}: ${shortLabel.slice(0, 20)}…`;
                else if (shortLabel.length > 28) shortLabel = shortLabel.slice(0, 26) + '…';

                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setKpaFilter(isSelected ? 'all' : kTitle)}
                    title={kTitle}
                    className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    <span>{shortLabel}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-300">
                      {kpa.kpiCount}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase text-[10px] tracking-wider">Layout:</span>
              <div className="inline-flex p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setViewGrouping('grouped')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewGrouping === 'grouped' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Group KPIs under parent KPA banners"
                >
                  <Layers className="w-3 h-3" />
                  <span>Group by KPA</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewGrouping('flat')}
                  className={`px-2.5 py-1 rounded-md text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                    viewGrouping === 'flat' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Display flat list of KPIs"
                >
                  <Table className="w-3 h-3" />
                  <span>Flat View</span>
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
                  {viewGrouping === 'grouped' && kpaFilter === 'all' ? (
                    groupedKpaSections.map((group, groupIdx) => (
                      <React.Fragment key={`group-${groupIdx}`}>
                        {/* KPA PARENT BANNER ROW */}
                        <tr className="bg-slate-950/90 border-y border-indigo-500/40">
                          <td colSpan={14} className="px-4 py-2.5 bg-gradient-to-r from-indigo-950/70 via-slate-900 to-slate-950">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2.5">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase shrink-0 ${
                                  group.kpaDef.code === 'bsd' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                  group.kpaDef.code === 'midt' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' :
                                  group.kpaDef.code === 'mfvm' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                                  group.kpaDef.code === 'ggpp' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40' :
                                  group.kpaDef.code === 'led' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                                  'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                }`}>
                                  {group.kpaDef.code ? group.kpaDef.code.toUpperCase() : 'KPA'}
                                </span>
                                <span className="font-bold text-white text-xs tracking-tight">
                                  {group.kpaDef.title}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                  {group.items.length} {group.items.length === 1 ? 'KPI' : 'KPIs'}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-slate-400">
                                  Cumulative Weight: <strong className="text-amber-300 font-mono font-bold">{group.kpaDef.totalKpiWeight}%</strong>
                                </span>
                                {group.kpaDef.allocatedWeight !== undefined && (
                                  <span className="text-slate-400">
                                    Section 4.2 Target: <strong className="text-indigo-300 font-mono font-bold">{group.kpaDef.allocatedWeight}%</strong>
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* KPI ROWS UNDER THIS KPA */}
                        {group.items.map(({ item, originalIndex }) => {
                          const idx = originalIndex;
                          const kpaVal = item["functional kpa"] || item["kpa"] || group.kpaDef.title;
                          const kpaCode = resolveKpaCode(kpaVal);

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
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                                    kpaCode === 'bsd' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                    kpaCode === 'midt' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                    kpaCode === 'mfvm' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                    kpaCode === 'ggpp' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                                    kpaCode === 'led' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                    'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}>
                                    {kpaCode.toUpperCase()}
                                  </span>
                                  <input
                                    type="text"
                                    list="functional-kpa-list"
                                    value={kpaVal}
                                    onChange={(e) => {
                                      handleUpdateItem(idx, "functional kpa", e.target.value);
                                      handleUpdateItem(idx, "kpa", e.target.value);
                                    }}
                                    placeholder="Functional KPA..."
                                    className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-300 focus:outline-none focus:border-indigo-500"
                                  />
                                </div>
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
                                  className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                                  title="Remove row"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))
                  ) : (
                    filteredItems.map((item, originalIndex) => {
                      const idx = extractedItems.findIndex(it => it === item);
                      const actualIdx = idx >= 0 ? idx : originalIndex;
                      const kpaVal = item["functional kpa"] || item["kpa"] || 'Functional Performance Area';
                      const kpaCode = resolveKpaCode(kpaVal);

                      return (
                        <tr 
                          key={item._id || actualIdx}
                          className={`hover:bg-slate-800/50 transition ${
                            item._selected === false ? 'opacity-40 bg-slate-950/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center">
                            <button onClick={() => handleToggleSelectItem(actualIdx)} className="text-slate-400 hover:text-white">
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
                              onChange={(e) => handleUpdateItem(actualIdx, "kpi no", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-indigo-300 font-mono font-bold text-xs"
                            />
                          </td>

                          {/* functional kpa */}
                          <td className="p-2">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                                kpaCode === 'bsd' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                                kpaCode === 'midt' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                                kpaCode === 'mfvm' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                                kpaCode === 'ggpp' ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' :
                                kpaCode === 'led' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30' :
                                'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}>
                                {kpaCode.toUpperCase()}
                              </span>
                              <input
                                type="text"
                                list="functional-kpa-list"
                                value={kpaVal}
                                onChange={(e) => {
                                  handleUpdateItem(actualIdx, "functional kpa", e.target.value);
                                  handleUpdateItem(actualIdx, "kpa", e.target.value);
                                }}
                                placeholder="Functional KPA..."
                                className="w-full bg-slate-800/90 border border-slate-700 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-300 focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </td>

                          {/* kpi description */}
                          <td className="p-2">
                            <textarea
                              value={item["kpi description"]}
                              onChange={(e) => handleUpdateItem(actualIdx, "kpi description", e.target.value)}
                              rows={2}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg p-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 leading-relaxed"
                            />
                          </td>

                          {/* %wt */}
                          <td className="p-2 text-center">
                            <input
                              type="number"
                              value={item["%wt"]}
                              onChange={(e) => handleUpdateItem(actualIdx, "%wt", e.target.value)}
                              className="w-14 bg-slate-800/80 border border-slate-700 rounded-lg px-1.5 py-1 text-center font-mono font-bold text-amber-300 text-xs"
                            />
                          </td>

                          {/* baseline */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.baseline}
                              onChange={(e) => handleUpdateItem(actualIdx, "baseline", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                            />
                          </td>

                          {/* annual target */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item["annual target"]}
                              onChange={(e) => handleUpdateItem(actualIdx, "annual target", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-emerald-300 font-semibold"
                            />
                          </td>

                          {/* 1st qtr target */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item["1st qtr target"]}
                              onChange={(e) => handleUpdateItem(actualIdx, "1st qtr target", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                            />
                          </td>

                          {/* 2nd qtr target */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item["2nd qtr target"]}
                              onChange={(e) => handleUpdateItem(actualIdx, "2nd qtr target", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                            />
                          </td>

                          {/* 3rd qtr target */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item["3rd qtr target"]}
                              onChange={(e) => handleUpdateItem(actualIdx, "3rd qtr target", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                            />
                          </td>

                          {/* 4th qtr target */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item["4th qtr target"]}
                              onChange={(e) => handleUpdateItem(actualIdx, "4th qtr target", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                            />
                          </td>

                          {/* poe */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.poe}
                              onChange={(e) => handleUpdateItem(actualIdx, "poe", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300"
                            />
                          </td>

                          {/* budget */}
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.budget}
                              onChange={(e) => handleUpdateItem(actualIdx, "budget", e.target.value)}
                              className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-2 py-1 text-xs text-slate-300 font-mono"
                            />
                          </td>

                          {/* delete */}
                          <td className="p-2 text-center">
                            <button
                              onClick={() => handleRemoveItem(actualIdx)}
                              className="text-slate-500 hover:text-rose-400 p-1 transition cursor-pointer"
                              title="Remove row"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer Controls */}
            <div className="bg-slate-950/90 border-t border-slate-800 p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <button
                  id="btn_add_kpi_row"
                  onClick={handleAddRow}
                  className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-slate-700 rounded-xl font-bold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add KPI Row</span>
                </button>

                <button
                  id="btn_save_scorecard_bottom"
                  onClick={handleSaveDataset}
                  disabled={isSavingDataset}
                  className={`px-4 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition ${
                    hasUnsavedChanges
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-600/30'
                      : 'bg-indigo-600/80 hover:bg-indigo-600 text-white'
                  }`}
                >
                  {isSavingDataset ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span>{hasUnsavedChanges ? 'Save Changes *' : 'Save Dataset'}</span>
                </button>

                <button
                  id="btn_clear_scorecard_bottom"
                  onClick={() => handleClearEngine(true)}
                  className="px-3.5 py-1.5 bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 hover:text-rose-200 border border-rose-700/50 rounded-xl font-bold flex items-center gap-1.5 transition cursor-pointer"
                  title="Clear all rows and reset engine"
                >
                  <Trash2 className="w-4 h-4 text-rose-400" />
                  <span>Clear Engine</span>
                </button>
              </div>

              <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                <span>Total KPIs: <strong className="text-white">{extractedItems.length}</strong></span>
                <span>Selected: <strong className="text-indigo-400">{extractedItems.filter(it => it._selected !== false).length}</strong></span>
                <span>Cumulative Weight: <strong className={Math.round(totalWeight) === 100 ? "text-emerald-400 font-mono" : "text-amber-400 font-mono"}>{totalWeight.toFixed(1)}%</strong></span>
              </div>
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
