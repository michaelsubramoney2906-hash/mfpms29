import React, { useState, useRef, useMemo } from 'react';
import { User } from '../types';
import { 
  FileText, Upload, CheckCircle2, AlertCircle, Sparkles, Download, 
  Copy, Check, ArrowRight, Table, Code2, RefreshCw, Trash2, 
  Layers, ShieldCheck, Filter, Edit3, Eye, FileSpreadsheet,
  FileCode, Cpu, HelpCircle, CheckSquare, Square, Zap, Info, Play,
  Save, Plus, Database, Landmark, ExternalLink
} from 'lucide-react';
import { 
  ExtractedSdbipItem,
  SDBIP_KPA_OPTIONS,
  SDBIP_DIRECTORATE_OPTIONS,
  extractSDBIPFromExcel,
  extractSDBIPFromDocx,
  extractSDBIPFromPDF,
  extractSDBIPFromPastedContent,
  parseSdbipTableFromText,
  resolveSdbipKpa,
  SAMPLE_SDBIP_TOP_LAYER_TEXT
} from '../utils/sdbipParser';
import { SdbipRow } from './SDBIP/SDBIP';

interface SDBIPExtractionEngineProps {
  currentUser: User;
  activeTenantId: string;
  onNavigateToSDBIP?: (tab?: 'table' | 'reporting') => void;
}

export function SDBIPExtractionEngine({ currentUser, activeTenantId, onNavigateToSDBIP }: SDBIPExtractionEngineProps) {
  const [sdbipItems, setSdbipItems] = useState<ExtractedSdbipItem[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'results' | 'json'>('upload');
  const [viewMode, setViewMode] = useState<'all' | 'planning' | 'reporting'>('all');
  const [pasteText, setPasteText] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [isPushingToSDBIP, setIsPushingToSDBIP] = useState<boolean>(false);
  const [isSavingDataset, setIsSavingDataset] = useState<boolean>(false);
  const [isLoadingSaved, setIsLoadingSaved] = useState<boolean>(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [pushSuccess, setPushSuccess] = useState<boolean>(false);
  const [pushCount, setPushCount] = useState<number>(0);
  const [kpaFilter, setKpaFilter] = useState<string>('all');
  const [directorateFilter, setDirectorateFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load previously saved SDBIP extraction or actual SDBIP items from Supabase
  const handleLoadSavedSDBIP = async () => {
    setIsLoadingSaved(true);
    setStatusMessage({ type: 'info', text: 'Loading saved SDBIP Top Layer records from Supabase...' });
    try {
      // First try to load from sdbip_top_layer extraction snapshot
      const extRes = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/sdbip_top_layer`);
      let loadedFromSnapshot = false;

      if (extRes.ok) {
        const extData = await extRes.json();
        const items = extData && (extData.data || extData.items);
        if (Array.isArray(items) && items.length > 0) {
          setSdbipItems(items);
          setSourceFileName(extData.fileName || 'Saved SDBIP Top Layer');
          setHasUnsavedChanges(false);
          if (extData.savedAt || extData.extractedAt) {
            setLastSavedTime(new Date(extData.savedAt || extData.extractedAt).toLocaleTimeString());
          }
          setActiveTab('results');
          setStatusMessage({
            type: 'success',
            text: `Loaded ${items.length} saved SDBIP records from extraction vault in Supabase.`
          });
          loadedFromSnapshot = true;
        }
      }

      // If no extraction snapshot, load directly from SDBIP Top Layer table
      if (!loadedFromSnapshot) {
        const sdbipRes = await fetch(`/api/tenant/${activeTenantId}/sdbip?t=${Date.now()}`);
        if (sdbipRes.ok) {
          const sdbipData = await sdbipRes.json();
          if (sdbipData && Array.isArray(sdbipData.items) && sdbipData.items.length > 0) {
            const mappedItems: ExtractedSdbipItem[] = sdbipData.items.map((row: SdbipRow, idx: number) => ({
              _id: row.id || `sdbip-loaded-${Date.now()}-${idx + 1}`,
              _selected: true,
              refNum: row.refNum || `TL-${idx + 1}`,
              strategicObj: row.strategicObj || '',
              kpas: resolveSdbipKpa(row.kpas || row.bsd || row.led || row.mfvm || row.ggpp || row.midt || row.sr || ''),
              operationalActivity: row.operationalActivity || '',
              kpi: row.kpi || '',
              compliance: row.compliance || 'compliant',
              uom: row.uom || 'Number',
              mscoaTracking: row.mscoaTracking || '',
              baseline: row.baseline || '',
              annualTarget: row.annualTarget || '',
              budgetAllocation: row.budgetAllocation || 'Operational Budget',
              q1: row.q1 || '',
              q2: row.q2 || '',
              midTerm: row.midTerm || '',
              q3: row.q3 || '',
              q4: row.q4 || '',
              responsibleUnit: row.responsibleUnit || '',
              submitter: row.submitter || '',
              reviewer: row.reviewer || '',
              approver: row.approver || '',
              internalAudit: row.internalAudit || '',
              poeStatus: row.poeStatus || 'Pending Evidence',
              q1Actual: row.q1Actual || '',
              q1Variance: row.q1Variance || '',
              q1Corrective: row.q1Corrective || '',
              q1Expenditure: row.q1Expenditure || '',
              q1PoeDesc: row.q1PoeDesc || row.poeDesc || '',
              q2Actual: row.q2Actual || '',
              q2Variance: row.q2Variance || '',
              q2Corrective: row.q2Corrective || '',
              q2Expenditure: row.q2Expenditure || '',
              q2PoeDesc: row.q2PoeDesc || '',
              midTermActual: row.midTermActual || '',
              midTermVariance: row.midTermVariance || '',
              midTermCorrective: row.midTermCorrective || '',
              midTermExpenditure: row.midTermExpenditure || '',
              midTermPoeDesc: row.midTermPoeDesc || '',
              q3Actual: row.q3Actual || '',
              q3Variance: row.q3Variance || '',
              q3Corrective: row.q3Corrective || '',
              q3Expenditure: row.q3Expenditure || '',
              q3PoeDesc: row.q3PoeDesc || '',
              q4Actual: row.q4Actual || '',
              q4Variance: row.q4Variance || '',
              q4Corrective: row.q4Corrective || '',
              q4Expenditure: row.q4Expenditure || '',
              q4PoeDesc: row.q4PoeDesc || ''
            }));

            setSdbipItems(mappedItems);
            setSourceFileName('Active SDBIP Top Layer Table');
            setActiveTab('results');
            setStatusMessage({
              type: 'success',
              text: `Loaded all ${mappedItems.length} active records directly from SDBIP Top Layer Table in Supabase.`
            });
            return;
          }
        }
        setStatusMessage({ type: 'info', text: 'No saved SDBIP records found. Please extract an SDBIP file or load the sample scorecard.' });
      }
    } catch (err: any) {
      console.warn("Error loading saved SDBIP:", err);
      setStatusMessage({ type: 'error', text: err.message || 'Failed to load saved SDBIP records.' });
    } finally {
      setIsLoadingSaved(false);
    }
  };

  // Clear SDBIP Engine
  const handleClearEngine = () => {
    setSdbipItems([]);
    setSourceFileName('');
    setPasteText('');
    setHasUnsavedChanges(false);
    setLastSavedTime(null);
    setKpaFilter('all');
    setDirectorateFilter('all');
    setSearchQuery('');
    setActiveTab('upload');
    setPushSuccess(false);
    setCopiedJson(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setStatusMessage({
      type: 'info',
      text: 'SDBIP Top Layer & Reporting Extraction Engine reset.'
    });
  };

  // Handle extracted results commit
  const handleExtractedResult = (items: ExtractedSdbipItem[], name: string) => {
    if (!items || items.length === 0) {
      setStatusMessage({
        type: 'error',
        text: `No SDBIP Top Layer indicators found in "${name}". Please ensure the file contains a table with SDBIP KPI definitions.`
      });
      setIsProcessing(false);
      return;
    }

    setSdbipItems(items);
    setSourceFileName(name);
    setIsProcessing(false);
    setActiveTab('results');
    setHasUnsavedChanges(true);
    setStatusMessage({
      type: 'success',
      text: `Successfully extracted and mapped ${items.length} SDBIP Top Layer records from "${name}". Verify and push to SDBIP tables below.`
    });
  };

  // 1. Handle File Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: `Analyzing and extracting SDBIP document "${file.name}"...` });

    try {
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.pdf')) {
        const arrayBuffer = await file.arrayBuffer();
        const items = await extractSDBIPFromPDF(arrayBuffer, file.name);
        handleExtractedResult(items, file.name);
      } else if (fileName.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const items = await extractSDBIPFromDocx(arrayBuffer, file.name);
        handleExtractedResult(items, file.name);
      } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        const arrayBuffer = await file.arrayBuffer();
        const items = await extractSDBIPFromExcel(arrayBuffer, file.name);
        handleExtractedResult(items, file.name);
      } else if (fileName.endsWith('.json')) {
        const text = await file.text();
        let parsed: any = [];
        try { parsed = JSON.parse(text); } catch(err) { throw new Error("Invalid JSON file uploaded"); }
        const rawArray = Array.isArray(parsed) ? parsed : (parsed.items || parsed.kpis || []);
        const items: ExtractedSdbipItem[] = rawArray.map((it: any, idx: number) => ({
          _id: `sdbip-json-${Date.now()}-${idx + 1}`,
          _selected: true,
          refNum: String(it.refNum || it.refNo || it.kpiNo || `TL-${idx + 1}`).trim(),
          strategicObj: String(it.strategicObj || it.strategicObjective || 'To provide sustainable municipal services').trim(),
          kpas: resolveSdbipKpa(it.kpas || it.kpa || ''),
          operationalActivity: String(it.operationalActivity || it.project || it.kpi || '').trim(),
          kpi: String(it.kpi || it.kpiDescription || `SDBIP Indicator ${idx + 1}`).trim(),
          compliance: it.compliance || 'compliant',
          uom: String(it.uom || it.unitOfMeasure || 'Number').trim(),
          mscoaTracking: String(it.mscoaTracking || it.projectCode || 'Operational').trim(),
          baseline: String(it.baseline || '').trim(),
          annualTarget: String(it.annualTarget || '').trim(),
          budgetAllocation: String(it.budgetAllocation || it.budget || 'Operational Budget').trim(),
          q1: String(it.q1 || it.q1Target || '').trim(),
          q2: String(it.q2 || it.q2Target || '').trim(),
          midTerm: String(it.midTerm || it.midTermTarget || '').trim(),
          q3: String(it.q3 || it.q3Target || '').trim(),
          q4: String(it.q4 || it.q4Target || '').trim(),
          responsibleUnit: String(it.responsibleUnit || it.department || 'Infrastructure Development & Technical Services').trim(),
          submitter: String(it.submitter || '').trim(),
          reviewer: String(it.reviewer || '').trim(),
          approver: String(it.approver || '').trim(),
          internalAudit: String(it.internalAudit || '').trim(),
          poeStatus: it.poeStatus || 'Pending Evidence',
          q1Actual: String(it.q1Actual || '').trim(),
          q1Variance: String(it.q1Variance || '').trim(),
          q1Corrective: String(it.q1Corrective || '').trim(),
          q1Expenditure: String(it.q1Expenditure || '').trim(),
          q1PoeDesc: String(it.q1PoeDesc || '').trim(),
          q2Actual: String(it.q2Actual || '').trim(),
          q2Variance: String(it.q2Variance || '').trim(),
          q2Corrective: String(it.q2Corrective || '').trim(),
          q2Expenditure: String(it.q2Expenditure || '').trim(),
          q2PoeDesc: String(it.q2PoeDesc || '').trim(),
          midTermActual: String(it.midTermActual || '').trim(),
          midTermVariance: String(it.midTermVariance || '').trim(),
          midTermCorrective: String(it.midTermCorrective || '').trim(),
          midTermExpenditure: String(it.midTermExpenditure || '').trim(),
          midTermPoeDesc: String(it.midTermPoeDesc || '').trim(),
          q3Actual: String(it.q3Actual || '').trim(),
          q3Variance: String(it.q3Variance || '').trim(),
          q3Corrective: String(it.q3Corrective || '').trim(),
          q3Expenditure: String(it.q3Expenditure || '').trim(),
          q3PoeDesc: String(it.q3PoeDesc || '').trim(),
          q4Actual: String(it.q4Actual || '').trim(),
          q4Variance: String(it.q4Variance || '').trim(),
          q4Corrective: String(it.q4Corrective || '').trim(),
          q4Expenditure: String(it.q4Expenditure || '').trim(),
          q4PoeDesc: String(it.q4PoeDesc || '').trim()
        }));
        handleExtractedResult(items, file.name);
      } else {
        throw new Error("Unsupported file format. Please upload PDF, Word (.docx), Excel (.xlsx, .xls, .csv), or JSON.");
      }
    } catch (err: any) {
      console.error("SDBIP Extraction error:", err);
      setStatusMessage({ type: 'error', text: `Extraction failed: ${err.message || 'Unknown error'}` });
      setIsProcessing(false);
    }
  };

  // 2. Handle Paste Table Extraction
  const handlePasteExtract = async () => {
    if (!pasteText.trim()) {
      setStatusMessage({ type: 'error', text: 'Please paste SDBIP table data or text before extracting.' });
      return;
    }

    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Extracting and parsing SDBIP records from pasted content...' });

    try {
      const items = await extractSDBIPFromPastedContent(pasteText, undefined, 'Pasted SDBIP Content');
      handleExtractedResult(items, 'Pasted SDBIP Content');
    } catch (err: any) {
      console.error("Paste extraction error:", err);
      setStatusMessage({ type: 'error', text: `Extraction failed: ${err.message}` });
      setIsProcessing(false);
    }
  };

  // 3. Handle Load Sample SDBIP Scorecard
  const handleLoadSample = () => {
    setIsProcessing(true);
    setStatusMessage({ type: 'info', text: 'Loading realistic South African Municipal SDBIP Top Layer Scorecard...' });
    setTimeout(() => {
      try {
        const items = parseSdbipTableFromText(SAMPLE_SDBIP_TOP_LAYER_TEXT);
        handleExtractedResult(items, 'Sample 2025/2026 SDBIP Top Layer & Reporting Scorecard');
      } catch (err: any) {
        setStatusMessage({ type: 'error', text: 'Failed to load sample SDBIP.' });
        setIsProcessing(false);
      }
    }, 400);
  };

  // Field change
  const handleFieldChange = (index: number, field: keyof ExtractedSdbipItem, value: string) => {
    setSdbipItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasUnsavedChanges(true);
  };

  // Add empty SDBIP row
  const handleAddRow = () => {
    const newRow: ExtractedSdbipItem = {
      _id: `sdbip-custom-${Date.now()}`,
      _selected: true,
      refNum: `TL-${String(sdbipItems.length + 1).padStart(2, '0')}`,
      strategicObj: 'To ensure sustainable basic municipal infrastructure and service delivery',
      kpas: 'KPA 5: Basic Service Delivery and Infrastructure Development (BSD)',
      operationalActivity: 'Municipal Infrastructure Project',
      kpi: 'New Performance Indicator Description',
      compliance: 'compliant',
      uom: 'Number',
      mscoaTracking: 'Function: Technical Services',
      baseline: '0',
      annualTarget: '100%',
      budgetAllocation: 'Operational Budget',
      q1: '25%',
      q2: '50%',
      midTerm: '50%',
      q3: '75%',
      q4: '100%',
      responsibleUnit: 'Infrastructure Development & Technical Services',
      poeStatus: 'Pending Evidence'
    };

    setSdbipItems(prev => [newRow, ...prev]);
    setHasUnsavedChanges(true);
    setStatusMessage({ type: 'info', text: 'Added new SDBIP Top Layer indicator row.' });
  };

  // Duplicate row
  const handleDuplicateRow = (index: number) => {
    const target = sdbipItems[index];
    if (!target) return;
    const duplicated: ExtractedSdbipItem = {
      ...target,
      _id: `sdbip-dup-${Date.now()}`,
      refNum: `${target.refNum}-COPY`
    };
    setSdbipItems(prev => {
      const copy = [...prev];
      copy.splice(index + 1, 0, duplicated);
      return copy;
    });
    setHasUnsavedChanges(true);
  };

  // Remove row
  const handleRemoveRow = (index: number) => {
    setSdbipItems(prev => prev.filter((_, idx) => idx !== index));
    setHasUnsavedChanges(true);
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    const allSelected = sdbipItems.every(it => it._selected !== false);
    setSdbipItems(prev => prev.map(it => ({ ...it, _selected: !allSelected })));
  };

  const handleToggleSelectItem = (index: number) => {
    setSdbipItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], _selected: !updated[index]._selected };
      return updated;
    });
  };

  // Save extraction dataset snapshot to Supabase
  const handleSaveSnapshot = async () => {
    if (sdbipItems.length === 0) {
      setStatusMessage({ type: 'error', text: 'No SDBIP records to save.' });
      return;
    }
    setIsSavingDataset(true);
    setStatusMessage({ type: 'info', text: 'Saving SDBIP extraction snapshot to Supabase...' });
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/sdbip_top_layer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: sdbipItems,
          fileName: sourceFileName || 'SDBIP Top Layer Scorecard',
          metadata: {
            kpiCount: sdbipItems.length,
            savedBy: currentUser.email,
            engine: 'sdbip_top_layer'
          }
        })
      });

      if (!res.ok) throw new Error(`Status ${res.status}`);
      setHasUnsavedChanges(false);
      const timeStr = new Date().toLocaleTimeString();
      setLastSavedTime(timeStr);
      setStatusMessage({
        type: 'success',
        text: `Successfully saved ${sdbipItems.length} SDBIP records to Supabase extraction vault at ${timeStr}.`
      });
    } catch (err: any) {
      console.error("Error saving SDBIP snapshot:", err);
      setStatusMessage({ type: 'error', text: `Save failed: ${err.message}` });
    } finally {
      setIsSavingDataset(false);
    }
  };

  // PUSH DIRECTLY AND ONLY TO SDBIP TOP LAYER TABLE & REPORTING TABLE
  const handlePushToSDBIP = async () => {
    const selected = sdbipItems.filter(it => it._selected !== false);
    if (selected.length === 0) {
      setStatusMessage({ type: 'error', text: 'Please select at least one SDBIP row to push.' });
      return;
    }

    setIsPushingToSDBIP(true);
    setStatusMessage({ type: 'info', text: `Pushing ${selected.length} records directly to SDBIP Top Layer & Reporting Table...` });

    try {
      // Transform each item to the exact SdbipRow format expected by SDBIP.tsx
      const rowsToPush: SdbipRow[] = selected.map((it, idx) => {
        const kpaText = it.kpas || '';
        const normKpa = kpaText.toLowerCase();

        const isBsd = normKpa.includes('basic service') || normKpa.includes('bsd') || normKpa.includes('infrastructure');
        const isLed = normKpa.includes('local economic') || normKpa.includes('led');
        const isMfvm = normKpa.includes('financial') || normKpa.includes('mfvm') || normKpa.includes('budget');
        const isGgpp = normKpa.includes('governance') || normKpa.includes('ggpp') || normKpa.includes('public participation');
        const isMidt = normKpa.includes('institutional') || normKpa.includes('transformation') || normKpa.includes('midt');
        const isSr = normKpa.includes('spatial') || normKpa.includes('rationale') || normKpa.includes('sr');

        return {
          id: `sdbip_ext_${Date.now()}_${idx + 1}`,
          refNum: it.refNum || `TL-${idx + 1}`,
          strategicObj: it.strategicObj || 'To ensure sustainable service delivery and clean audit compliance',
          bsd: isBsd ? 'KPA 5: Basic Service Delivery and Infrastructure Development' : '',
          led: isLed ? 'KPA 3: Local Economic Development' : '',
          mfvm: isMfvm ? 'KPA 4: Municipal Financial Viability and Management' : '',
          ggpp: isGgpp ? 'KPA 2: Good Governance and Public Participation' : '',
          midt: isMidt ? 'KPA 1: Institutional Development and Transformation' : '',
          sr: isSr ? 'KPA 6: Spatial Rationale and Municipal Planning' : '',
          kpas: it.kpas || (isBsd ? 'Basic Service Delivery' : isLed ? 'Local Economic Development' : isMfvm ? 'Financial Viability' : isGgpp ? 'Good Governance' : isMidt ? 'Institutional Development' : 'Spatial Rationale'),
          operationalActivity: it.operationalActivity || it.kpi,
          kpi: it.kpi,
          compliance: it.compliance || 'compliant',
          uom: it.uom || 'Number',
          mscoaTracking: it.mscoaTracking || 'Operational',
          baseline: it.baseline || '',
          annualTarget: it.annualTarget || '',
          budgetAllocation: it.budgetAllocation || 'Operational Budget',
          q1: it.q1 || '',
          q2: it.q2 || '',
          midTerm: it.midTerm || '',
          midTermTarget: it.midTerm || '',
          q3: it.q3 || '',
          q4: it.q4 || '',
          responsibleUnit: it.responsibleUnit || 'Infrastructure Development & Technical Services',
          submitter: it.submitter || currentUser.fullName || currentUser.email,
          reviewer: it.reviewer || 'Nompumelelo P. Nsibande',
          approver: it.approver || 'Sibusiso M. Shabanga',
          internalAudit: it.internalAudit || 'Amos D. Twala',
          poeStatus: it.poeStatus || 'Pending Evidence',
          // Reporting table fields
          q1Actual: it.q1Actual || '',
          q1Variance: it.q1Variance || '',
          q1Corrective: it.q1Corrective || '',
          q1Expenditure: it.q1Expenditure || '',
          q1PoeDesc: it.q1PoeDesc || '',
          q2Actual: it.q2Actual || '',
          q2Variance: it.q2Variance || '',
          q2Corrective: it.q2Corrective || '',
          q2Expenditure: it.q2Expenditure || '',
          q2PoeDesc: it.q2PoeDesc || '',
          midTermActual: it.midTermActual || '',
          midTermVariance: it.midTermVariance || '',
          midTermCorrective: it.midTermCorrective || '',
          midTermExpenditure: it.midTermExpenditure || '',
          midTermPoeDesc: it.midTermPoeDesc || '',
          q3Actual: it.q3Actual || '',
          q3Variance: it.q3Variance || '',
          q3Corrective: it.q3Corrective || '',
          q3Expenditure: it.q3Expenditure || '',
          q3PoeDesc: it.q3PoeDesc || '',
          q4Actual: it.q4Actual || '',
          q4Variance: it.q4Variance || '',
          q4Corrective: it.q4Corrective || '',
          q4Expenditure: it.q4Expenditure || '',
          q4PoeDesc: it.q4PoeDesc || ''
        };
      });

      // Save directly to the official SDBIP endpoint which writes to Supabase
      const sdbipRes = await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rowsToPush })
      });

      if (!sdbipRes.ok) {
        throw new Error(`SDBIP database sync failed with HTTP status ${sdbipRes.status}`);
      }

      // Also save an extraction snapshot in Supabase
      handleSaveSnapshot().catch(() => {});

      setPushSuccess(true);
      setPushCount(rowsToPush.length);
      setHasUnsavedChanges(false);
      setStatusMessage({
        type: 'success',
        text: `Successfully mapped and pushed ${rowsToPush.length} records directly into SDBIP Top Layer Table and SDBIP Top Layer Reporting Table in Supabase!`
      });

      // Notify any mounted SDBIP instance to reload immediately
      window.dispatchEvent(new CustomEvent('sdbip:switch_tab', { detail: { tab: 'table', refresh: true } }));

    } catch (err: any) {
      console.error("Push to SDBIP failed:", err);
      setStatusMessage({ type: 'error', text: `Failed to push to SDBIP: ${err.message}` });
    } finally {
      setIsPushingToSDBIP(false);
    }
  };

  // Filtered SDBIP items
  const filteredItems = useMemo(() => {
    return sdbipItems.filter(it => {
      if (kpaFilter !== 'all') {
        const normKpa = (it.kpas || '').toLowerCase();
        if (kpaFilter === 'bsd' && !normKpa.includes('basic service') && !normKpa.includes('bsd')) return false;
        if (kpaFilter === 'led' && !normKpa.includes('local economic') && !normKpa.includes('led')) return false;
        if (kpaFilter === 'mfvm' && !normKpa.includes('financial') && !normKpa.includes('mfvm')) return false;
        if (kpaFilter === 'ggpp' && !normKpa.includes('governance') && !normKpa.includes('ggpp')) return false;
        if (kpaFilter === 'midt' && !normKpa.includes('institutional') && !normKpa.includes('midt')) return false;
        if (kpaFilter === 'sr' && !normKpa.includes('spatial') && !normKpa.includes('sr')) return false;
      }
      if (directorateFilter !== 'all') {
        if ((it.responsibleUnit || '').toLowerCase() !== directorateFilter.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match = (it.refNum || '').toLowerCase().includes(q) ||
          (it.kpi || '').toLowerCase().includes(q) ||
          (it.strategicObj || '').toLowerCase().includes(q) ||
          (it.operationalActivity || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [sdbipItems, kpaFilter, directorateFilter, searchQuery]);

  return (
    <div id="sdbip-extraction-engine-root" className="flex flex-col h-full bg-slate-50 text-slate-800">
      {/* Engine Dedicated Sub-Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 text-white px-6 py-4 border-b border-emerald-800/40 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center shadow-inner">
            <Landmark className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-white flex items-center gap-2">
                SDBIP Top Layer & Reporting Extraction Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 uppercase tracking-wider">
                Strict Target Isolation
              </span>
            </div>
            <p className="text-xs text-emerald-200/80 mt-0.5">
              Dedicated engine for municipal Top Layer SDBIP tables and quarterly reporting scorecards. Mapped <strong className="text-white underline decoration-emerald-400">solely to SDBIP Top Layer and Reporting Table</strong>.
            </p>
          </div>
        </div>

        {/* Quick Actions in Banner */}
        <div className="flex items-center gap-2">
          <button
            id="sdbip-load-sample-btn"
            type="button"
            onClick={handleLoadSample}
            disabled={isProcessing}
            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Load authentic municipal sample SDBIP Top Layer & Reporting Scorecard"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            Load Sample SDBIP
          </button>
          <button
            id="sdbip-load-saved-btn"
            type="button"
            onClick={handleLoadSavedSDBIP}
            disabled={isLoadingSaved || isProcessing}
            className="px-3 py-1.5 bg-emerald-600/50 hover:bg-emerald-600/70 border border-emerald-400/40 rounded-lg text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer shadow-xs"
            title="Load saved SDBIP from Supabase database"
          >
            <Database className="w-3.5 h-3.5 text-emerald-200" />
            {isLoadingSaved ? 'Loading...' : 'Load from Supabase'}
          </button>
          {sdbipItems.length > 0 && (
            <button
              id="sdbip-clear-engine-btn"
              type="button"
              onClick={handleClearEngine}
              className="p-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 rounded-lg text-xs text-rose-200 transition cursor-pointer"
              title="Reset SDBIP engine"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Target Destination Confirmation Strip */}
      <div className="bg-emerald-50/80 border-b border-emerald-200/60 px-6 py-2 flex items-center justify-between text-xs text-emerald-900">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Isolated Destination Pipeline:</strong> All extracted and mapped indicators will write <strong>exclusively</strong> to the <span className="font-bold underline">SDBIP Top Layer Table</span> and <span className="font-bold underline">SDBIP Top Layer Reporting Table</span> in Supabase.
          </span>
        </div>
        {onNavigateToSDBIP && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onNavigateToSDBIP('table')}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Open SDBIP Top Layer Table <ExternalLink className="w-3 h-3" />
            </button>
            <span className="text-emerald-300">|</span>
            <button
              type="button"
              onClick={() => onNavigateToSDBIP('reporting')}
              className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 hover:underline cursor-pointer"
            >
              Open SDBIP Reporting Table <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Success Notification Banner */}
      {pushSuccess && (
        <div className="mx-6 mt-4 p-4 bg-emerald-50 border border-emerald-300 rounded-xl shadow-xs flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-emerald-950">Successfully Pushed {pushCount} Indicators to SDBIP!</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                All records have been mapped and saved to the SDBIP Top Layer Table and SDBIP Top Layer Reporting Table in Supabase.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {onNavigateToSDBIP && (
              <>
                <button
                  type="button"
                  onClick={() => onNavigateToSDBIP('table')}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View in SDBIP Top Layer Table
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToSDBIP('reporting')}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Table className="w-3.5 h-3.5" />
                  View in Reporting Table
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setPushSuccess(false)}
              className="p-1 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Status Message Alert */}
      {statusMessage && !pushSuccess && (
        <div className={`mx-6 mt-3 p-3 rounded-xl border flex items-center justify-between text-xs font-medium ${
          statusMessage.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          statusMessage.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          'bg-blue-50 border-blue-200 text-blue-800'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> :
             statusMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> :
             <Info className="w-4 h-4 shrink-0" />}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="text-slate-400 hover:text-slate-600 text-sm">✕</button>
        </div>
      )}

      {/* Main Tab Navigation */}
      <div className="px-6 pt-4 flex items-center justify-between border-b border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <button
            id="sdbip-tab-upload"
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'upload' 
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg' 
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload SDBIP Document
          </button>
          <button
            id="sdbip-tab-paste"
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'paste' 
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg' 
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            Paste SDBIP Table
          </button>
          <button
            id="sdbip-tab-results"
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer relative ${
              activeTab === 'results' 
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg' 
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Table className="w-3.5 h-3.5" />
            SDBIP Mapping Engine
            {sdbipItems.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                {sdbipItems.length}
              </span>
            )}
          </button>
          <button
            id="sdbip-tab-json"
            type="button"
            onClick={() => setActiveTab('json')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'json' 
                ? 'border-emerald-600 text-emerald-800 bg-emerald-50/40 rounded-t-lg' 
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            JSON Schema View
          </button>
        </div>

        {/* Action Controls for Results */}
        {activeTab === 'results' && sdbipItems.length > 0 && (
          <div className="flex items-center gap-2 pb-2">
            <button
              id="sdbip-save-snapshot-btn"
              type="button"
              onClick={handleSaveSnapshot}
              disabled={isSavingDataset}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-bold rounded-lg shadow-2xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 text-emerald-600" />
              {isSavingDataset ? 'Saving...' : 'Save Snapshot'}
            </button>
            <button
              id="sdbip-push-primary-btn"
              type="button"
              onClick={handlePushToSDBIP}
              disabled={isPushingToSDBIP}
              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-extrabold rounded-lg shadow-sm flex items-center gap-2 transition cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              {isPushingToSDBIP ? 'Pushing to SDBIP...' : 'Push to SDBIP Top Layer & Reporting Table'}
            </button>
          </div>
        )}
      </div>

      {/* Main Tab Content Area */}
      <div className="flex-1 overflow-auto p-6">
        {/* TAB 1: UPLOAD SDBIP DOCUMENT */}
        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-4">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Upload SDBIP Top Layer & Reporting Document</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
                Upload your official Municipal SDBIP document. The specialized AI and heuristic table parser extracts all Top Layer strategic objectives, KPAs, quarterly targets, and reporting actuals.
              </p>

              {/* Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 p-8 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/20 hover:bg-emerald-50/40 rounded-xl transition cursor-pointer flex flex-col items-center justify-center gap-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx,.xlsx,.xls,.csv,.json"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-center">
                  <span className="text-xs font-bold text-emerald-950 block">Click to select SDBIP file or drag and drop</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">Supports PDF, Excel (.xlsx, .xls, .csv), Word (.docx), or JSON</span>
                </div>
              </div>

              {/* Dedicated Extract Button */}
              <div className="mt-6 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-emerald-200" />
                  {isProcessing ? 'Processing SDBIP Document...' : 'Select & Extract SDBIP Top Layer File'}
                </button>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Load Sample SDBIP Scorecard
                </button>
              </div>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  100% SDBIP Schema Compliant
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Extracts Ref Number, Strategic Objectives, the 6 National KPAs, UoM, Baselines, Annual Targets, and Q1-Q4 quarterly targets.
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-teal-600" />
                  Reporting Table Ready
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Extracts Q1-Q4 actuals, variances, corrective measures, municipal expenditures, and POE descriptions when present.
                </p>
              </div>
              <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  Target SDBIP Tables Only
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Data from this engine maps strictly to the SDBIP Top Layer Table and SDBIP Top Layer Reporting Table in Supabase.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PASTE SDBIP TABLE */}
        {activeTab === 'paste' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Paste SDBIP Table / Scorecard Text</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Copy and paste tabular content directly from Microsoft Excel, Word, or PDF tables.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPasteText(SAMPLE_SDBIP_TOP_LAYER_TEXT)}
                  className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  Insert Sample SDBIP Text
                </button>
              </div>

              <textarea
                id="sdbip-paste-textarea"
                rows={12}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste tab-delimited or pipe-separated SDBIP table here (e.g. Ref No | Strategic Objective | KPA | KPI | Target | Q1 | Q2...)"
                className="w-full p-3 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:bg-white transition"
              />

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-slate-400">
                  {pasteText ? `${pasteText.split('\n').length} lines detected` : 'No text entered'}
                </span>
                <button
                  id="sdbip-paste-extract-btn"
                  type="button"
                  onClick={handlePasteExtract}
                  disabled={isProcessing || !pasteText.trim()}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-2 transition cursor-pointer"
                >
                  <Cpu className="w-4 h-4 text-emerald-200" />
                  {isProcessing ? 'Extracting SDBIP Data...' : 'Extract SDBIP Records from Pasted Content'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: SDBIP MAPPING & EDITING TABLE */}
        {activeTab === 'results' && (
          <div className="space-y-4">
            {sdbipItems.length === 0 ? (
              <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center max-w-md mx-auto space-y-4">
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                  <Table className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800">No Extracted SDBIP Records</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Upload an SDBIP document, paste a table, or load the municipal sample scorecard to begin mapping.
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Upload SDBIP File
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadSample}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer"
                  >
                    Load Sample
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Toolbar and View Mode Switcher */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
                  {/* Left: View Mode Pills */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setViewMode('all')}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        viewMode === 'all' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All Columns ({sdbipItems.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('planning')}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        viewMode === 'planning' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Top Layer Planning View
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('reporting')}
                      className={`px-3 py-1 rounded text-xs font-bold transition cursor-pointer ${
                        viewMode === 'reporting' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Quarterly Reporting View
                    </button>
                  </div>

                  {/* Right: Filters & Add Row */}
                  <div className="flex items-center gap-2">
                    {/* Search */}
                    <input
                      type="text"
                      placeholder="Search KPI or Ref..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-500 w-44"
                    />

                    {/* KPA Filter */}
                    <select
                      value={kpaFilter}
                      onChange={(e) => setKpaFilter(e.target.value)}
                      className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 font-medium"
                    >
                      <option value="all">All KPAs</option>
                      <option value="bsd">Basic Service Delivery (BSD)</option>
                      <option value="led">Local Economic Dev (LED)</option>
                      <option value="mfvm">Financial Viability (MFVM)</option>
                      <option value="ggpp">Good Governance (GGPP)</option>
                      <option value="midt">Institutional Dev (MIDT)</option>
                      <option value="sr">Spatial Rationale (SR)</option>
                    </select>

                    {/* Add Row Button */}
                    <button
                      id="sdbip-add-row-btn"
                      type="button"
                      onClick={handleAddRow}
                      className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer transition shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Indicator
                    </button>
                  </div>
                </div>

                {/* Table Stats Banner */}
                <div className="flex items-center justify-between text-xs text-slate-600 px-1">
                  <div className="flex items-center gap-4">
                    <span>Source: <strong className="text-slate-900">{sourceFileName || 'SDBIP Document'}</strong></span>
                    <span>Total Rows: <strong className="text-slate-900">{sdbipItems.length}</strong></span>
                    <span>Selected: <strong className="text-emerald-700">{sdbipItems.filter(it => it._selected !== false).length}</strong></span>
                    {hasUnsavedChanges && (
                      <span className="text-amber-600 font-bold flex items-center gap-1">
                        ● Unsaved modifications
                      </span>
                    )}
                    {lastSavedTime && (
                      <span className="text-slate-400">Snapshot saved at {lastSavedTime}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleToggleSelectAll}
                      className="text-xs text-indigo-700 hover:text-indigo-900 font-bold cursor-pointer"
                    >
                      {sdbipItems.every(it => it._selected !== false) ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                </div>

                {/* Main SDBIP Table */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-900 text-white sticky top-0 z-20 select-none text-[11px] font-bold">
                        <tr>
                          <th className="p-2.5 w-10 text-center border-r border-slate-800">
                            <input
                              type="checkbox"
                              checked={sdbipItems.length > 0 && sdbipItems.every(it => it._selected !== false)}
                              onChange={handleToggleSelectAll}
                              className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                            />
                          </th>
                          <th className="p-2.5 w-24 border-r border-slate-800">Ref No.</th>
                          
                          {(viewMode === 'all' || viewMode === 'planning') && (
                            <>
                              <th className="p-2.5 w-56 border-r border-slate-800">Strategic Objective</th>
                              <th className="p-2.5 w-56 border-r border-slate-800">National KPA</th>
                              <th className="p-2.5 w-48 border-r border-slate-800">Operational Activity</th>
                            </>
                          )}

                          <th className="p-2.5 min-w-[220px] border-r border-slate-800">Key Performance Indicator (KPI)</th>

                          {(viewMode === 'all' || viewMode === 'planning') && (
                            <>
                              <th className="p-2.5 w-24 border-r border-slate-800">UoM</th>
                              <th className="p-2.5 w-28 border-r border-slate-800">Baseline</th>
                              <th className="p-2.5 w-32 border-r border-slate-800">Annual Target</th>
                              <th className="p-2.5 w-32 border-r border-slate-800">Budget</th>
                              <th className="p-2.5 w-24 border-r border-slate-800 text-center bg-blue-950/60">Q1 Target</th>
                              <th className="p-2.5 w-24 border-r border-slate-800 text-center bg-blue-950/60">Q2 Target</th>
                              <th className="p-2.5 w-24 border-r border-slate-800 text-center bg-blue-950/60">Mid-Term</th>
                              <th className="p-2.5 w-24 border-r border-slate-800 text-center bg-blue-950/60">Q3 Target</th>
                              <th className="p-2.5 w-24 border-r border-slate-800 text-center bg-blue-950/60">Q4 Target</th>
                              <th className="p-2.5 w-48 border-r border-slate-800">Responsible Unit</th>
                            </>
                          )}

                          {(viewMode === 'all' || viewMode === 'reporting') && (
                            <>
                              <th className="p-2.5 w-28 border-r border-slate-800 bg-teal-950/60">Q1 Actual</th>
                              <th className="p-2.5 w-28 border-r border-slate-800 bg-teal-950/60">Q1 Variance</th>
                              <th className="p-2.5 w-36 border-r border-slate-800 bg-teal-950/60">Q1 Corrective</th>
                              <th className="p-2.5 w-28 border-r border-slate-800 bg-teal-950/60">Q1 Exp</th>
                              <th className="p-2.5 w-40 border-r border-slate-800 bg-indigo-950/60">Q1 POE Desc</th>
                              <th className="p-2.5 w-28 border-r border-slate-800 bg-teal-950/60">Q2 Actual</th>
                              <th className="p-2.5 w-28 border-r border-slate-800 bg-teal-950/60">Q2 Variance</th>
                              <th className="p-2.5 w-36 border-r border-slate-800 bg-teal-950/60">Q2 Corrective</th>
                              <th className="p-2.5 w-28 border-r border-slate-800 bg-teal-950/60">Q2 Exp</th>
                              <th className="p-2.5 w-40 border-r border-slate-800 bg-indigo-950/60">Q2 POE Desc</th>
                            </>
                          )}

                          <th className="p-2.5 w-20 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredItems.map((item, index) => {
                          const isSelected = item._selected !== false;
                          return (
                            <tr key={item._id || index} className={`hover:bg-slate-50 transition ${!isSelected ? 'opacity-40 bg-slate-50/50' : ''}`}>
                              {/* Checkbox */}
                              <td className="p-2 text-center border-r border-slate-100">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleSelectItem(index)}
                                  className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                                />
                              </td>

                              {/* Ref No */}
                              <td className="p-2 border-r border-slate-100">
                                <input
                                  type="text"
                                  value={item.refNum || ''}
                                  onChange={(e) => handleFieldChange(index, 'refNum', e.target.value)}
                                  className="w-full bg-transparent font-mono font-bold text-slate-900 border-0 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px]"
                                />
                              </td>

                              {/* Strategic Objective */}
                              {(viewMode === 'all' || viewMode === 'planning') && (
                                <td className="p-2 border-r border-slate-100">
                                  <textarea
                                    rows={2}
                                    value={item.strategicObj || ''}
                                    onChange={(e) => handleFieldChange(index, 'strategicObj', e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px] text-slate-700 leading-snug"
                                  />
                                </td>
                              )}

                              {/* National KPA Dropdown */}
                              {(viewMode === 'all' || viewMode === 'planning') && (
                                <td className="p-2 border-r border-slate-100">
                                  <select
                                    value={item.kpas || ''}
                                    onChange={(e) => handleFieldChange(index, 'kpas', e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-200 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px] font-semibold text-slate-800"
                                  >
                                    {SDBIP_KPA_OPTIONS.map(opt => (
                                      <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                  </select>
                                </td>
                              )}

                              {/* Operational Activity */}
                              {(viewMode === 'all' || viewMode === 'planning') && (
                                <td className="p-2 border-r border-slate-100">
                                  <textarea
                                    rows={2}
                                    value={item.operationalActivity || ''}
                                    onChange={(e) => handleFieldChange(index, 'operationalActivity', e.target.value)}
                                    className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px] text-slate-700 leading-snug"
                                  />
                                </td>
                              )}

                              {/* KPI Description */}
                              <td className="p-2 border-r border-slate-100">
                                <textarea
                                  rows={2}
                                  value={item.kpi || ''}
                                  onChange={(e) => handleFieldChange(index, 'kpi', e.target.value)}
                                  className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px] font-medium text-slate-900 leading-snug"
                                />
                              </td>

                              {/* Planning Columns */}
                              {(viewMode === 'all' || viewMode === 'planning') && (
                                <>
                                  <td className="p-2 border-r border-slate-100">
                                    <input
                                      type="text"
                                      value={item.uom || ''}
                                      onChange={(e) => handleFieldChange(index, 'uom', e.target.value)}
                                      className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100">
                                    <input
                                      type="text"
                                      value={item.baseline || ''}
                                      onChange={(e) => handleFieldChange(index, 'baseline', e.target.value)}
                                      className="w-full bg-transparent border-0 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100">
                                    <input
                                      type="text"
                                      value={item.annualTarget || ''}
                                      onChange={(e) => handleFieldChange(index, 'annualTarget', e.target.value)}
                                      className="w-full bg-transparent font-bold text-slate-900 border-0 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100">
                                    <input
                                      type="text"
                                      value={item.budgetAllocation || ''}
                                      onChange={(e) => handleFieldChange(index, 'budgetAllocation', e.target.value)}
                                      className="w-full bg-transparent font-bold text-slate-700 border-0 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-blue-50/20 text-center">
                                    <input
                                      type="text"
                                      value={item.q1 || ''}
                                      onChange={(e) => handleFieldChange(index, 'q1', e.target.value)}
                                      className="w-full bg-transparent font-bold text-blue-900 text-center border-0 p-1 focus:ring-1 focus:ring-blue-300 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-blue-50/20 text-center">
                                    <input
                                      type="text"
                                      value={item.q2 || ''}
                                      onChange={(e) => handleFieldChange(index, 'q2', e.target.value)}
                                      className="w-full bg-transparent font-bold text-blue-900 text-center border-0 p-1 focus:ring-1 focus:ring-blue-300 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-rose-50/30 text-center">
                                    <input
                                      type="text"
                                      value={item.midTerm || ''}
                                      onChange={(e) => handleFieldChange(index, 'midTerm', e.target.value)}
                                      className="w-full bg-transparent font-bold text-rose-900 text-center border-0 p-1 focus:ring-1 focus:ring-rose-300 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-blue-50/20 text-center">
                                    <input
                                      type="text"
                                      value={item.q3 || ''}
                                      onChange={(e) => handleFieldChange(index, 'q3', e.target.value)}
                                      className="w-full bg-transparent font-bold text-blue-900 text-center border-0 p-1 focus:ring-1 focus:ring-blue-300 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-blue-50/20 text-center">
                                    <input
                                      type="text"
                                      value={item.q4 || ''}
                                      onChange={(e) => handleFieldChange(index, 'q4', e.target.value)}
                                      className="w-full bg-transparent font-bold text-blue-900 text-center border-0 p-1 focus:ring-1 focus:ring-blue-300 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100">
                                    <select
                                      value={item.responsibleUnit || ''}
                                      onChange={(e) => handleFieldChange(index, 'responsibleUnit', e.target.value)}
                                      className="w-full bg-slate-50 border border-slate-200 p-1 focus:ring-1 focus:ring-emerald-500 rounded text-[11px]"
                                    >
                                      {SDBIP_DIRECTORATE_OPTIONS.map(dir => (
                                        <option key={dir} value={dir}>{dir}</option>
                                      ))}
                                    </select>
                                  </td>
                                </>
                              )}

                              {/* Reporting Columns */}
                              {(viewMode === 'all' || viewMode === 'reporting') && (
                                <>
                                  <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                                    <textarea
                                      rows={2}
                                      value={item.q1Actual || ''}
                                      onChange={(e) => handleFieldChange(index, 'q1Actual', e.target.value)}
                                      placeholder="Q1 Actual..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                                    <input
                                      type="text"
                                      value={item.q1Variance || ''}
                                      onChange={(e) => handleFieldChange(index, 'q1Variance', e.target.value)}
                                      placeholder="Variance..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                                    <textarea
                                      rows={2}
                                      value={item.q1Corrective || ''}
                                      onChange={(e) => handleFieldChange(index, 'q1Corrective', e.target.value)}
                                      placeholder="Corrective action..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                                    <input
                                      type="text"
                                      value={item.q1Expenditure || ''}
                                      onChange={(e) => handleFieldChange(index, 'q1Expenditure', e.target.value)}
                                      placeholder="Exp..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-indigo-50/10">
                                    <textarea
                                      rows={2}
                                      value={item.q1PoeDesc || ''}
                                      onChange={(e) => handleFieldChange(index, 'q1PoeDesc', e.target.value)}
                                      placeholder="POE desc..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[10px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                                    <textarea
                                      rows={2}
                                      value={item.q2Actual || ''}
                                      onChange={(e) => handleFieldChange(index, 'q2Actual', e.target.value)}
                                      placeholder="Q2 Actual..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                                    <input
                                      type="text"
                                      value={item.q2Variance || ''}
                                      onChange={(e) => handleFieldChange(index, 'q2Variance', e.target.value)}
                                      placeholder="Variance..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                                    <textarea
                                      rows={2}
                                      value={item.q2Corrective || ''}
                                      onChange={(e) => handleFieldChange(index, 'q2Corrective', e.target.value)}
                                      placeholder="Corrective action..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[11px]"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-teal-50/10">
                                    <input
                                      type="text"
                                      value={item.q2Expenditure || ''}
                                      onChange={(e) => handleFieldChange(index, 'q2Expenditure', e.target.value)}
                                      placeholder="Exp..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[11px] font-bold"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-100 bg-indigo-50/10">
                                    <textarea
                                      rows={2}
                                      value={item.q2PoeDesc || ''}
                                      onChange={(e) => handleFieldChange(index, 'q2PoeDesc', e.target.value)}
                                      placeholder="POE desc..."
                                      className="w-full bg-white border border-slate-200 p-1 rounded text-[10px]"
                                    />
                                  </td>
                                </>
                              )}

                              {/* Row Actions */}
                              <td className="p-2 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateRow(index)}
                                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded cursor-pointer"
                                    title="Duplicate row"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveRow(index)}
                                    className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                                    title="Delete indicator"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Bottom Push Action Bar */}
                <div className="p-4 bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                      <Landmark className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Ready to Deploy to SDBIP Tables?</h4>
                      <p className="text-xs text-emerald-200/80 mt-0.5">
                        Will sync {sdbipItems.filter(it => it._selected !== false).length} indicators directly into the SDBIP Top Layer Table and Reporting Table in Supabase.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleSaveSnapshot}
                      disabled={isSavingDataset}
                      className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-emerald-300" />
                      Save Snapshot
                    </button>
                    <button
                      id="sdbip-push-bottom-btn"
                      type="button"
                      onClick={handlePushToSDBIP}
                      disabled={isPushingToSDBIP}
                      className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-current" />
                      {isPushingToSDBIP ? 'Writing to Supabase...' : 'Push to SDBIP Top Layer & Reporting Tables'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* TAB 4: JSON SCHEMA INSPECTOR */}
        {activeTab === 'json' && (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">SDBIP JSON Payload Inspector</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live raw JSON representation formatted strictly for SDBIP Top Layer & Reporting storage.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(JSON.stringify(sdbipItems, null, 2));
                    setCopiedJson(true);
                    setTimeout(() => setCopiedJson(false), 2000);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg transition flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                  {copiedJson ? 'Copied!' : 'Copy JSON'}
                </button>
              </div>

              <pre className="p-4 bg-slate-900 text-emerald-400 rounded-xl font-mono text-xs overflow-auto max-h-[500px]">
                {JSON.stringify(sdbipItems, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
