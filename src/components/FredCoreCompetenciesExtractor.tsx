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
  Shield,
  Layers,
  FileSpreadsheet,
  Edit3,
  User as UserIcon,
  Users,
  ChevronDown,
  Plus,
  Send,
  Save,
  Award,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import type { User } from '../types';
import {
  extractCoreCompetenciesFromDocument,
  type ExtractedCoreCompetency
} from '../utils/coreCompetenciesParser';

interface FredCoreCompetenciesExtractorProps {
  currentUser: User;
  activeTenantId: string;
  onNavigateToIPMS?: (subModuleId?: string) => void;
}

export function FredCoreCompetenciesExtractor({
  currentUser,
  activeTenantId,
  onNavigateToIPMS
}: FredCoreCompetenciesExtractorProps) {
  // State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPushing, setIsPushing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [extractedItems, setExtractedItems] = useState<ExtractedCoreCompetency[]>([]);
  const [sourceFileName, setSourceFileName] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'info' | 'success' | 'error'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [targetScope, setTargetScope] = useState<'community_services' | 'technical_services' | 'cfo' | 'mm' | 'ped' | 'corp' | 'standard' | 'directors'>('community_services');
  const [targetEmployeeEmail, setTargetEmployeeEmail] = useState<string>(currentUser.email || '');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Calculate total weighting
  const totalWeight = extractedItems
    .filter(it => it._selected !== false)
    .reduce((acc, it) => acc + (parseFloat(it.weighting) || 0), 0);

  // Update target employee when currentUser changes
  useEffect(() => {
    if (currentUser?.email) {
      setTargetEmployeeEmail(currentUser.email);
    }
  }, [currentUser]);

  // Load existing extraction snapshot if available
  useEffect(() => {
    setExtractedItems([]);
    setSourceFileName('');
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    const loadSavedSnapshot = async () => {
      try {
        const targetEmail = targetEmployeeEmail || currentUser.email;
        if (!targetEmail) return;
        const res = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${encodeURIComponent(targetEmail)}&t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          const items = data.items || data.data;
          if (items && Array.isArray(items) && items.length > 0) {
            setExtractedItems(items.map((it: any, idx: number) => ({
              ...it,
              id: it.id || `cc-item-${idx}-${Date.now()}`,
              _id: it._id || `cc-item-${idx}-${Date.now()}`,
              _selected: it._selected !== false,
              competencies: it.competencies || it.competency || `Core Competency ${idx + 1}`,
              components: it.components || '',
              "compentency definition": it["compentency definition"] || it.definition || '',
              weighting: String(it.weighting || '0').replace(/[^0-9.]/g, '')
            })));
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
  }, [activeTenantId, targetEmployeeEmail, currentUser.email]);

  // Handle File Upload & Extraction
  const handleFileUpload = async (file: File) => {
    if (!file) return;
    setSelectedFile(file);
    setIsExtracting(true);
    setStatusMessage({
      type: 'info',
      text: `Processing document "${file.name}"... Parsing Core Competencies, Components, Compentency Definition, and Weighting verbatim.`
    });

    try {
      const result = await extractCoreCompetenciesFromDocument(file);
      
      const formattedItems: ExtractedCoreCompetency[] = (result.items || []).map((item, idx) => ({
        ...item,
        id: `cc-item-${Date.now()}-${idx + 1}`,
        _id: `cc-item-${Date.now()}-${idx + 1}`,
        _selected: true
      }));

      setExtractedItems(formattedItems);
      setSourceFileName(file.name);
      
      setStatusMessage({
        type: 'success',
        text: `Successfully extracted and mapped ${formattedItems.length} Core Competencies from "${file.name}".`
      });

      // Automatically persist snapshot to server under core_competencies_engine & role engine
      const targetEmail = targetEmployeeEmail || currentUser.email;
      const roleEngine = targetScope === 'community_services' ? 'community_services_competencies_engine' :
                         targetScope === 'technical_services' ? 'technical_services_competencies_engine' :
                         targetScope === 'cfo' ? 'cfo_competencies_engine' :
                         targetScope === 'mm' ? 'mm_competencies_engine' :
                         targetScope === 'ped' ? 'ped_competencies_engine' :
                         targetScope === 'corp' ? 'corporate_services_competencies_engine' :
                         targetScope === 'directors' ? 'community_services_competencies_engine' :
                         'core_competencies_engine';

      try {
        const payload = {
          items: formattedItems,
          sourceFileName: file.name,
          targetScope,
          timestamp: new Date().toISOString()
        };
        await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${encodeURIComponent(targetEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (roleEngine !== 'core_competencies_engine') {
          await fetch(`/api/tenant/${activeTenantId}/fred-extraction/${roleEngine}?userId=${encodeURIComponent(targetEmail)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });
        }
      } catch (saveErr) {
        console.warn("Core Competencies snapshot auto-save error:", saveErr);
      }
    } catch (err: any) {
      console.error("Core Competencies extraction error:", err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to extract Core Competencies. Please ensure the document contains a competencies schedule.'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  // Add a new row manually
  const handleAddRow = () => {
    const newRow: ExtractedCoreCompetency = {
      id: `cc-item-${Date.now()}-${extractedItems.length + 1}`,
      _id: `cc-item-${Date.now()}-${extractedItems.length + 1}`,
      _selected: true,
      competencies: '',
      components: '',
      "compentency definition": '',
      weighting: '0'
    };
    setExtractedItems(prev => [...prev, newRow]);
  };

  // Update a field in a row
  const handleUpdateRow = (id: string, field: keyof ExtractedCoreCompetency, value: any) => {
    setExtractedItems(prev => prev.map(row => {
      if (row.id === id || row._id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  // Delete a row
  const handleDeleteRow = (id: string) => {
    setExtractedItems(prev => prev.filter(row => row.id !== id && row._id !== id));
  };

  // Toggle selection
  const handleToggleSelectAll = () => {
    const allSelected = extractedItems.every(r => r._selected !== false);
    setExtractedItems(prev => prev.map(r => ({ ...r, _selected: !allSelected })));
  };

  // Save changes explicitly to Supabase
  const handleSaveToSupabase = async () => {
    const targetEmail = targetEmployeeEmail || currentUser.email;
    if (!targetEmail) return;

    setIsSaving(true);
    const roleEngine = targetScope === 'community_services' ? 'community_services_competencies_engine' :
                       targetScope === 'technical_services' ? 'technical_services_competencies_engine' :
                       targetScope === 'cfo' ? 'cfo_competencies_engine' :
                       targetScope === 'mm' ? 'mm_competencies_engine' :
                       targetScope === 'ped' ? 'ped_competencies_engine' :
                       targetScope === 'corp' ? 'corporate_services_competencies_engine' :
                       targetScope === 'directors' ? 'community_services_competencies_engine' :
                       'core_competencies_engine';

    try {
      const payload = {
        items: extractedItems,
        sourceFileName: sourceFileName || selectedFile?.name || 'Core Competencies Matrix',
        targetScope,
        timestamp: new Date().toISOString()
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (roleEngine !== 'core_competencies_engine') {
        await fetch(`/api/tenant/${activeTenantId}/fred-extraction/${roleEngine}?userId=${encodeURIComponent(targetEmail)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (res.ok) {
        setStatusMessage({
          type: 'success',
          text: `Saved ${extractedItems.length} Core Competency records to Supabase for ${targetEmail} (${targetScope.toUpperCase()}).`
        });
      } else {
        throw new Error("Failed to save records to database.");
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || "Failed to save records to Supabase."
      });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 6000);
    }
  };

  // Push Extracted Rows directly into IPMS Core Competencies table
  const handlePushToIPMS = async () => {
    const selectedRows = extractedItems.filter(r => r._selected !== false);
    if (selectedRows.length === 0) {
      setStatusMessage({
        type: 'error',
        text: 'Please select at least one competency row to push to IPMS.'
      });
      return;
    }

    const targetEmail = targetEmployeeEmail || currentUser.email;
    setIsPushing(true);
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/fred-extraction/push-to-core-competencies?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: selectedRows,
          targetScope: targetScope,
          userEmail: targetEmail
        })
      });

      if (res.ok) {
        const json = await res.json();
        setStatusMessage({
          type: 'success',
          text: `Successfully pushed ${selectedRows.length} Core Competencies into IPMS (${targetScope.toUpperCase()} tab) for ${targetEmail}!`
        });
      } else {
        throw new Error("Server rejected push to IPMS Core Competencies table.");
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || "Failed to push Core Competencies into IPMS."
      });
    } finally {
      setIsPushing(false);
    }
  };

  // Clear extraction snapshot
  const handleClear = async () => {
    const targetEmail = targetEmployeeEmail || currentUser.email;
    try {
      await fetch(`/api/tenant/${activeTenantId}/fred-extraction/core_competencies_engine?userId=${encodeURIComponent(targetEmail)}`, {
        method: 'DELETE'
      });
    } catch (e) {}

    setExtractedItems([]);
    setSelectedFile(null);
    setSourceFileName('');
    if (fileInputRef.current) fileInputRef.current.value = '';
    setStatusMessage({
      type: 'info',
      text: 'Cleared Core Competencies extraction workspace.'
    });
    setTimeout(() => setStatusMessage(null), 4000);
  };

  // Filter items based on search
  const filteredItems = extractedItems.filter(item => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.competencies.toLowerCase().includes(q) ||
      item.components.toLowerCase().includes(q) ||
      item["compentency definition"].toLowerCase().includes(q) ||
      item.weighting.toLowerCase().includes(q)
    );
  });

  return (
    <div id="fred-core-competencies-extractor-root" className="h-full flex flex-col bg-slate-900 text-slate-100 overflow-hidden">
      
      {/* Top Banner */}
      <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-950 text-rose-300 border border-rose-800">
              Dedicated Fred Engine 4
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-900 text-emerald-400 border border-slate-750 flex items-center gap-1">
              <Shield className="w-3 h-3" /> Strict 4-Field Mapping Guarantee
            </span>
          </div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <Award className="w-5 h-5 text-rose-400" />
            Core Competencies Extractor & Mapping Engine
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl mt-0.5">
            Completely separate cognitive extractor and mapping engine strictly limited to extracting and mapping: 
            <span className="text-white font-bold mx-1">competencies</span>,
            <span className="text-white font-bold mx-1">components</span>,
            <span className="text-white font-bold mx-1">compentency definition</span>, and
            <span className="text-white font-bold mx-1">weighting</span>.
          </p>
        </div>

        {/* Action Controls & Navigation */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
            <UserIcon className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              value={targetEmployeeEmail}
              onChange={(e) => setTargetEmployeeEmail(e.target.value)}
              placeholder="Target official email..."
              className="bg-transparent text-slate-200 outline-none w-48 font-mono text-[11px]"
              title="Official email profile to associate this Core Competencies extraction snapshot with"
            />
          </div>

          {onNavigateToIPMS && (
            <button
              type="button"
              onClick={() => onNavigateToIPMS('ccomp')}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
              title="Open IPMS Core Competencies Matrix in new view"
            >
              <span>View IPMS Core Competencies</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Status Bar */}
      {statusMessage && (
        <div className={`px-6 py-2.5 text-xs font-bold flex items-center justify-between border-b ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/80 border-emerald-800 text-emerald-200' 
            : statusMessage.type === 'error'
              ? 'bg-rose-950/80 border-rose-800 text-rose-200'
              : 'bg-indigo-950/80 border-indigo-800 text-indigo-200'
        }`}>
          <div className="flex items-center gap-2">
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-400" />}
            {statusMessage.type === 'info' && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setStatusMessage(null)} 
            className="text-slate-400 hover:text-white font-extrabold px-1 cursor-pointer"
          >
            &times;
          </button>
        </div>
      )}

      {/* Main Workspace Body */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        
        {/* Left Side: Upload & Target Configuration Sidebar */}
        <div className="w-full lg:w-80 bg-slate-950/60 border-r border-slate-800 p-5 flex flex-col gap-4 overflow-y-auto shrink-0">
          
          {/* File Upload Box */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4 text-rose-400" />
              <span>Document Ingestion</span>
            </h3>

            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file);
              }}
              accept=".docx,.doc,.xlsx,.xls,.pdf,.txt"
              className="hidden"
            />

            <button
              type="button"
              disabled={isExtracting}
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-slate-700 hover:border-rose-500 rounded-xl p-5 flex flex-col items-center justify-center text-center transition cursor-pointer bg-slate-950/50 hover:bg-slate-900/80 disabled:opacity-50"
            >
              {isExtracting ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
                  <span className="text-xs font-bold text-slate-300">Extracting Core Competencies...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-10 h-10 rounded-full bg-rose-950 border border-rose-800 flex items-center justify-center text-rose-400 shadow-sm">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">Upload Agreement / Matrix</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Word (.docx), Excel (.xlsx), PDF, Text</span>
                  </div>
                </div>
              )}
            </button>

            {sourceFileName && (
              <div className="mt-3 p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center gap-2 text-xs">
                <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                <span className="truncate text-slate-300 font-mono text-[11px]" title={sourceFileName}>
                  {sourceFileName}
                </span>
              </div>
            )}
          </div>

          {/* Target IPMS Scope Mapping */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Target IPMS Category</span>
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Select which IPMS Core Competencies tab this extraction maps to when pushed:
            </p>

            <div className="space-y-1.5">
              {[
                { id: 'community_services', label: 'Community Service Core Competencies (GM: Community Development - RampediMR / MahlanguPT)', color: 'indigo' },
                { id: 'technical_services', label: 'Technical Service Core Competencies (GM: Technical - RalephalengJN / MtshweniWM)', color: 'teal' },
                { id: 'mm', label: 'Municipal Managers Core Competencies (MM - MahlanguML)', color: 'emerald' },
                { id: 'cfo', label: 'CFOs Core Competencies (CFO - StanderAL)', color: 'blue' },
                { id: 'corp', label: 'Corporate Services Competencies (GM: Corporate - LengwateTM / MahlanguA)', color: 'pink' },
                { id: 'ped', label: 'PED Core Competencies (GM: PED - ShabanguF / BvumaA)', color: 'amber' },
                { id: 'standard', label: 'Standard Core Competencies (General Municipal Appointees)', color: 'teal' }
              ].map(opt => (
                <label 
                  key={opt.id}
                  className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                    targetScope === opt.id 
                      ? 'bg-rose-950/50 border-rose-700 text-white font-bold' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="targetScope"
                    value={opt.id}
                    checked={targetScope === opt.id}
                    onChange={() => setTargetScope(opt.id as any)}
                    className="accent-rose-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Weighting Balance Badge */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <h3 className="text-xs font-black text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Total Weighting</span>
              <span className={`text-xs font-mono font-black px-2 py-0.5 rounded ${
                totalWeight === 100 
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                  : 'bg-amber-950 text-amber-300 border border-amber-800'
              }`}>
                {totalWeight}%
              </span>
            </h3>
            {totalWeight === 100 ? (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Balanced: Exactly 100% statutory requirement met.</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Total is {totalWeight}%. Must equal 100% for official IPMS sign-off.</span>
              </div>
            )}
          </div>

          {/* Primary Operations */}
          <div className="space-y-2 pt-1 mt-auto">
            <button
              type="button"
              disabled={isPushing || extractedItems.length === 0}
              onClick={handlePushToIPMS}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              title="Push extracted competencies directly into the IPMS Core Competencies table"
            >
              {isPushing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>Push to IPMS ({targetScope.toUpperCase()})</span>
            </button>

            <button
              type="button"
              disabled={isSaving || extractedItems.length === 0}
              onClick={handleSaveToSupabase}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-700 cursor-pointer disabled:opacity-50"
              title="Explicitly save current table state to Supabase"
            >
              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5 text-emerald-400" />}
              <span>Save to Supabase</span>
            </button>

            {extractedItems.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="w-full py-2 px-3 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Extraction</span>
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Extracted & Mapped Core Competencies Table */}
        <div className="flex-1 flex flex-col bg-slate-900 overflow-hidden">
          
          {/* Table Toolbar */}
          <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>Extracted Competency Records</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-950 border border-rose-800 text-rose-300 font-mono">
                  {extractedItems.length}
                </span>
              </span>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="text-[11px] text-slate-400 hover:text-white font-medium flex items-center gap-1.5 transition cursor-pointer"
              >
                {extractedItems.length > 0 && extractedItems.every(r => r._selected !== false) ? (
                  <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>Select All</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5">
              {/* Search Bar */}
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
                <Search className="w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter competencies..."
                  className="bg-transparent text-slate-200 outline-none w-40 text-xs"
                />
              </div>

              {/* Add Row Button */}
              <button
                type="button"
                onClick={handleAddRow}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Add Row</span>
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-auto p-6">
            {extractedItems.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
                <div className="w-14 h-14 rounded-2xl bg-rose-950/50 border border-rose-800 flex items-center justify-center text-rose-400 mb-4 shadow-lg">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="text-base font-black text-white">No Core Competencies Extracted Yet</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
                  Upload an official Performance Agreement, Competency Matrix, or Job Profile to automatically extract and map the 4 strict fields: 
                  <span className="text-slate-300 font-semibold"> competencies</span>, 
                  <span className="text-slate-300 font-semibold"> components</span>, 
                  <span className="text-slate-300 font-semibold"> compentency definition</span>, and 
                  <span className="text-slate-300 font-semibold"> weighting</span>.
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Choose Document</span>
                </button>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-900/90 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                      <th className="p-3 w-10 text-center">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="cursor-pointer text-slate-400 hover:text-white"
                        >
                          {extractedItems.every(r => r._selected !== false) ? (
                            <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-500" />
                          )}
                        </button>
                      </th>
                      <th className="p-3 w-1/4">1. Competencies</th>
                      <th className="p-3 w-1/4">2. Components</th>
                      <th className="p-3 w-1/3">3. Compentency Definition</th>
                      <th className="p-3 w-24 text-center">4. Weighting</th>
                      <th className="p-3 w-12 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/80 text-xs">
                    {filteredItems.map((item, idx) => {
                      const rowKey = item.id || item._id || `row-${idx}`;
                      const isSelected = item._selected !== false;
                      return (
                        <tr 
                          key={rowKey}
                          className={`hover:bg-slate-900/60 transition ${
                            !isSelected ? 'opacity-50 bg-slate-950/40' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="p-3 text-center align-top">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleUpdateRow(rowKey, '_selected', e.target.checked)}
                              className="accent-rose-500 cursor-pointer mt-1"
                            />
                          </td>

                          {/* 1. Competencies */}
                          <td className="p-3 align-top">
                            <textarea
                              rows={3}
                              value={item.competencies}
                              onChange={(e) => handleUpdateRow(rowKey, 'competencies', e.target.value)}
                              placeholder="Competency name / title..."
                              className="w-full bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-lg p-2 text-xs font-bold text-white outline-none resize-y transition"
                            />
                          </td>

                          {/* 2. Components */}
                          <td className="p-3 align-top">
                            <textarea
                              rows={3}
                              value={item.components}
                              onChange={(e) => handleUpdateRow(rowKey, 'components', e.target.value)}
                              placeholder="Operational components..."
                              className="w-full bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-lg p-2 text-xs text-slate-300 outline-none resize-y transition"
                            />
                          </td>

                          {/* 3. Compentency Definition */}
                          <td className="p-3 align-top">
                            <textarea
                              rows={3}
                              value={item["compentency definition"]}
                              onChange={(e) => handleUpdateRow(rowKey, 'compentency definition', e.target.value)}
                              placeholder="Compentency definition & behavioral standards..."
                              className="w-full bg-slate-900/90 hover:bg-slate-900 focus:bg-slate-900 border border-slate-800 focus:border-rose-500 rounded-lg p-2 text-xs text-slate-300 outline-none resize-y transition"
                            />
                          </td>

                          {/* 4. Weighting */}
                          <td className="p-3 align-top text-center">
                            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 focus-within:border-rose-500 rounded-lg px-2 py-1.5 w-20 mx-auto">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.weighting}
                                onChange={(e) => handleUpdateRow(rowKey, 'weighting', e.target.value)}
                                className="w-full bg-transparent text-center font-mono font-black text-rose-300 text-xs outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-slate-500 font-bold text-[10px]">%</span>
                            </div>
                          </td>

                          {/* Action */}
                          <td className="p-3 text-center align-top">
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(rowKey)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
