import React, { useState, useEffect } from 'react';
import { 
  ClipboardCheck, Plus, Trash2, Save, RotateCcw, Copy, ArrowUp, ArrowDown, 
  Columns, Sparkles, Check, Download, Search, Info, HelpCircle,
  FileSpreadsheet, Maximize2, Minimize2, Eye, Edit3, AlertCircle
} from 'lucide-react';
import type { UserProfile } from '../../types';

export interface PerformanceAssessmentConfig {
  title: string;
  subtitle: string;
  description: string;
  headers: string[];
  rows: string[][];
  notesAbove?: string;
  notesBelow?: string;
  updatedAt?: string;
  updatedBy?: string;
}

interface PerformanceAssessmentProps {
  currentUser: UserProfile | any;
  activeTenantId: string;
}

export const DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG: PerformanceAssessmentConfig = {
  title: "Performance Assessment Framework & Rating Scale",
  subtitle: "Regulation 5-Point Rating Scale & Performance Evaluation Standards",
  description: "The performance assessment of the Employee will be based on the following statutory 5-point rating scale criteria.",
  notesAbove: "4.1 The Employee agrees to participate in the performance assessment and development system of the Municipality.\n4.2 The Employee undertakes to actively focus on consistent achievement of core performance standards, strategic KPAs, and prescribed competency levels.\n4.3 The performance assessment will be moderated and calculated in accordance with the following 5-point rating scale:",
  headers: [
    "Level",
    "Terminology / Rating Band",
    "Qualitative Description / Performance Criteria",
    "Scorecard Range (%)",
    "Remedial / Bonus Implication"
  ],
  rows: [
    [
      "5",
      "Outstanding Performance",
      "Performance far exceeds the standard expected of an employee at this level. The operational and strategic deliverables have demonstrated exceptional quality, innovation, and leadership throughout the financial year.",
      "130% - 167%",
      "Eligible for Maximum Performance Bonus consideration as per municipal framework regulations and policy."
    ],
    [
      "4",
      "Performance Significantly Above Expectations",
      "Performance is significantly higher than the standard expected in the position with respect to quality, quantity, and timeliness of deliverables.",
      "100% - 129%",
      "Eligible for Merit Performance Bonus consideration in accordance with performance moderation rules."
    ],
    [
      "3",
      "Fully Effective",
      "Performance fully meets the standard expected in all areas of the position. The employee has achieved 100% of agreed quarterly objectives and key performance indicators satisfactorily.",
      "100%",
      "Standard compliant delivery; maintains normal salary progression and good performance standing."
    ],
    [
      "2",
      "Performance Not Fully Effective",
      "Performance is below the standard required for the job in key areas. Corrective action and structured personal development plan (PDP) intervention required.",
      "60% - 99%",
      "Mandatory PDP targeted training; remedial action timeline established; ineligible for performance bonus."
    ],
    [
      "1",
      "Unacceptable Performance",
      "Performance does not meet the standard expected for the job. The employee has failed to demonstrate the minimum required output despite prior counseling and guidance.",
      "< 60%",
      "Formal capability / incapacity proceedings initiated in terms of applicable municipal regulations."
    ]
  ],
  notesBelow: "4.4 The personal development plan (PDP) will address any developmental needs identified during the competency assessment process.\n4.5 Performance evaluation results are subject to institutional moderation by the Departmental Performance Management Committee (DPMC) and Internal Audit verification.",
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default"
};

export function PerformanceAssessment({ currentUser, activeTenantId }: PerformanceAssessmentProps) {
  const [config, setConfig] = useState<PerformanceAssessmentConfig>(DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [showAddColModal, setShowAddColModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const email = (currentUser?.email || '').toLowerCase().trim();
      const res = await fetch(`/api/tenant/${activeTenantId}/performance-assessment-config?userId=${encodeURIComponent(email)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.headers && Array.isArray(data.rows)) {
          setConfig({
            title: data.title || DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.title,
            subtitle: data.subtitle || DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.subtitle,
            description: data.description || DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.description,
            headers: data.headers.length > 0 ? data.headers : DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.headers,
            rows: data.rows.length > 0 ? data.rows : DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.rows,
            notesAbove: data.notesAbove !== undefined ? data.notesAbove : DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.notesAbove,
            notesBelow: data.notesBelow !== undefined ? data.notesBelow : DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG.notesBelow,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching performance assessment config:", err);
      showToast("Could not load latest performance assessment template.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [activeTenantId, currentUser?.email]);

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const email = (currentUser?.email || '').toLowerCase().trim();
      const payload = {
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || currentUser?.name || email || 'User'
      };

      const res = await fetch(`/api/tenant/${activeTenantId}/performance-assessment-config?userId=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Failed to save: ${res.statusText}`);
      }

      const resData = await res.json();
      setConfig(prev => ({
        ...prev,
        updatedAt: payload.updatedAt,
        updatedBy: payload.updatedBy
      }));
      setSaveSuccess(true);
      showToast("Performance Assessment template saved permanently to Supabase database. It is now static and importable in all Performance Agreements!", "success");
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error("Error saving performance assessment config:", err);
      setSaveError(err.message || "Failed to save configuration");
      showToast(err.message || "Failed to save configuration", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset the table to the standard 5-point performance assessment scale? Any unsaved custom columns or rows will be overwritten.")) {
      setConfig({
        ...DEFAULT_PERFORMANCE_ASSESSMENT_CONFIG,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || currentUser?.email || 'User'
      });
      showToast("Reset to standard 5-point rating scale.", "info");
    }
  };

  const handleAddRow = (insertIdx?: number) => {
    setConfig(prev => {
      const newRow = new Array(prev.headers.length).fill('');
      // Give initial Level number if first col is Level
      if (prev.headers[0]?.toLowerCase().includes('level')) {
        newRow[0] = String(prev.rows.length + 1);
      }
      const newRows = [...prev.rows];
      if (typeof insertIdx === 'number') {
        newRows.splice(insertIdx + 1, 0, newRow);
      } else {
        newRows.push(newRow);
      }
      return { ...prev, rows: newRows };
    });
    showToast("New row added.", "info");
  };

  const handleDuplicateRow = (idx: number) => {
    setConfig(prev => {
      const rowToDup = [...prev.rows[idx]];
      const newRows = [...prev.rows];
      newRows.splice(idx + 1, 0, rowToDup);
      return { ...prev, rows: newRows };
    });
    showToast("Row duplicated.", "info");
  };

  const handleDeleteRow = (idx: number) => {
    if (config.rows.length <= 1) {
      showToast("The table must retain at least one row.", "error");
      return;
    }
    setConfig(prev => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== idx)
    }));
    showToast("Row removed.", "info");
  };

  const handleMoveRow = (idx: number, direction: 'up' | 'down') => {
    setConfig(prev => {
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (targetIdx < 0 || targetIdx >= prev.rows.length) return prev;
      const newRows = [...prev.rows];
      const temp = newRows[idx];
      newRows[idx] = newRows[targetIdx];
      newRows[targetIdx] = temp;
      return { ...prev, rows: newRows };
    });
  };

  const handleAddColumn = () => {
    const colTitle = newColumnName.trim() || `Column ${config.headers.length + 1}`;
    setConfig(prev => ({
      ...prev,
      headers: [...prev.headers, colTitle],
      rows: prev.rows.map(row => [...row, ''])
    }));
    setNewColumnName('');
    setShowAddColModal(false);
    showToast(`Added column: "${colTitle}"`, "success");
  };

  const handleDeleteColumn = (colIdx: number) => {
    if (config.headers.length <= 1) {
      showToast("Table must have at least one column.", "error");
      return;
    }
    const colName = config.headers[colIdx];
    if (window.confirm(`Are you sure you want to delete column "${colName}" and all its cell data across all rows?`)) {
      setConfig(prev => ({
        ...prev,
        headers: prev.headers.filter((_, i) => i !== colIdx),
        rows: prev.rows.map(row => row.filter((_, i) => i !== colIdx))
      }));
      showToast(`Column "${colName}" removed.`, "info");
    }
  };

  const handleHeaderChange = (colIdx: number, value: string) => {
    setConfig(prev => {
      const newHeaders = [...prev.headers];
      newHeaders[colIdx] = value;
      return { ...prev, headers: newHeaders };
    });
  };

  const handleCellChange = (rowIdx: number, colIdx: number, value: string) => {
    setConfig(prev => {
      const newRows = prev.rows.map((row, rI) => {
        if (rI === rowIdx) {
          const newRow = [...row];
          newRow[colIdx] = value;
          return newRow;
        }
        return row;
      });
      return { ...prev, rows: newRows };
    });
  };

  const handleTablePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>, startRowIdx: number, startColIdx: number) => {
    const pasteData = e.clipboardData.getData('text');
    if (!pasteData) return;

    // Only intercept as multi-cell grid paste if there are actual tab delimiters (from Excel/Sheets/Table copy)
    if (pasteData.includes('\t')) {
      e.preventDefault();
      
      // Parse TSV rows without truncating or dropping multiline sentences
      const lines = pasteData.split(/\r?\n/);
      const parsedRows: string[][] = [];
      for (const line of lines) {
        if (line.length === 0 && parsedRows.length > 0) continue;
        parsedRows.push(line.split('\t'));
      }

      if (parsedRows.length > 0) {
        setConfig(prev => {
          let newHeaders = [...prev.headers];
          let newRows = prev.rows.map(r => [...r]);

          parsedRows.forEach((pRow, rOffset) => {
            const targetRowIdx = startRowIdx + rOffset;
            while (newRows.length <= targetRowIdx) {
              newRows.push(new Array(newHeaders.length).fill(''));
            }
            pRow.forEach((cellVal, cOffset) => {
              const targetColIdx = startColIdx + cOffset;
              while (newHeaders.length <= targetColIdx) {
                newHeaders.push(`Column ${newHeaders.length + 1}`);
                newRows.forEach(r => r.push(''));
              }
              // Clean wrapping quotes from Excel if present, but preserve all inner sentences completely
              let cleaned = cellVal;
              if (cleaned.startsWith('"') && cleaned.endsWith('"') && cleaned.length >= 2) {
                cleaned = cleaned.slice(1, -1).replace(/""/g, '"');
              }
              newRows[targetRowIdx][targetColIdx] = cleaned;
            });
          });

          return {
            ...prev,
            headers: newHeaders,
            rows: newRows
          };
        });
        showToast("Pasted tabular data into cells without character limits.", "success");
      }
    }
    // If no tab delimiter, allow full natural paste into the cell textarea (unlimited characters, full sentences)
  };

  const filteredRowsWithIndex = config.rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => {
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase();
      return row.some(cell => String(cell).toLowerCase().includes(term));
    });

  const exportAsCsv = () => {
    const csvContent = [
      config.headers.map(h => `"${h.replace(/"/g, '""')}"`).join(','),
      ...config.rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Performance_Assessment_Table_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Performance Assessment table as CSV.", "info");
  };

  if (loading) {
    return (
      <div id="performance-assessment-loading" className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-600">Loading Performance Assessment Matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <div id="performance-assessment-module" className={`flex flex-col gap-5 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-6 overflow-y-auto' : ''}`}>
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium transition-all ${
          notification.type === 'success' ? 'bg-emerald-800 text-white' :
          notification.type === 'error' ? 'bg-rose-700 text-white' : 'bg-slate-800 text-white'
        }`}>
          {notification.type === 'success' ? <Check className="w-4 h-4 text-emerald-300" /> : <AlertCircle className="w-4 h-4 text-amber-300" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shadow-inner">
              <ClipboardCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Performance Assessment Module
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-200 border border-emerald-400/40">
                  IPMS Master Standard
                </span>
              </h1>
              <p className="text-xs text-emerald-200/90 font-medium">
                Configure, expand, and persist the static Performance Assessment 5-Point Rating Scale and framework table used across all Performance Agreements.
              </p>
            </div>
          </div>
        </div>

        {/* Global Actions */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center bg-white/10 rounded-lg p-1 border border-white/10 text-xs">
            <button
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'editor' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-200 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Table Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-200 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Document Preview
            </button>
          </div>

          <button
            id="save-performance-assessment-btn"
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              saveSuccess 
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' 
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black hover:shadow-emerald-500/30'
            }`}
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Saving to Supabase...</span>
              </>
            ) : saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved & Static</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Performance Assessment</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen View"}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-200 transition cursor-pointer border border-white/10"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Info Status Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-emerald-950">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-emerald-700 shrink-0" />
          <span>
            <strong>Static Database Master:</strong> When saved, this Performance Assessment table is stored permanently in Supabase. Any user drafting a Performance Agreement can import this standardized table directly into their agreement.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-emerald-800 shrink-0 font-medium">
          <span>Rows: <strong className="font-bold text-emerald-950">{config.rows.length}</strong></span>
          <span>•</span>
          <span>Columns: <strong className="font-bold text-emerald-950">{config.headers.length}</strong></span>
          {config.updatedAt && (
            <>
              <span>•</span>
              <span>Last Modified: {new Date(config.updatedAt).toLocaleTimeString()} ({config.updatedBy || 'Master'})</span>
            </>
          )}
        </div>
      </div>

      {activeTab === 'editor' ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
          {/* Module Meta Header Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4 border-b border-slate-100">
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Module / Table Title</label>
              <input
                type="text"
                value={config.title}
                onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Performance Assessment Framework & Rating Scale"
                className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:bg-white focus:border-emerald-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Subtitle / Classification</label>
              <input
                type="text"
                value={config.subtitle}
                onChange={e => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Regulation 5-Point Rating Scale & Standards"
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:bg-white focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Section 4 Narrative Commentary (Above Table) */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-slate-600 tracking-wider flex items-center justify-between">
              <span>Section 4 Narrative Framework (Introductory Clauses Above Table)</span>
              <span className="text-[10px] text-slate-400 font-normal">Editable standard clauses</span>
            </label>
            <textarea
              rows={3}
              value={config.notesAbove || ''}
              onChange={e => setConfig(prev => ({ ...prev, notesAbove: e.target.value }))}
              placeholder="Enter framework intro notes..."
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:bg-white focus:border-emerald-500 transition font-sans leading-relaxed"
            />
          </div>

          {/* Table Controls Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <div className="relative w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Filter or search rows..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500 focus:bg-white text-slate-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddRow()}
                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold hover:bg-emerald-100 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
              <button
                type="button"
                onClick={() => setShowAddColModal(true)}
                className="px-3 py-1.5 bg-teal-50 text-teal-700 border border-teal-200 rounded-lg text-xs font-bold hover:bg-teal-100 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Columns className="w-3.5 h-3.5" />
                Add Column
              </button>
              <button
                type="button"
                onClick={exportAsCsv}
                className="px-3 py-1.5 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-slate-100 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export CSV
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-3 py-1.5 bg-slate-50 text-rose-600 border border-slate-200 rounded-lg text-xs font-bold hover:bg-rose-50 flex items-center gap-1.5 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset 5 Rows
              </button>
            </div>
          </div>

          {/* Add Column Prompt Modal */}
          {showAddColModal && (
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-teal-900 uppercase">Add New Table Column</span>
                <button 
                  onClick={() => setShowAddColModal(false)}
                  className="text-xs text-teal-600 hover:text-teal-900 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={e => setNewColumnName(e.target.value)}
                  placeholder="Enter column header title (e.g. Assessment Evidence / Minimum Score)"
                  className="flex-1 text-xs p-2 bg-white border border-teal-300 rounded-lg outline-none focus:ring-2 focus:ring-teal-400"
                  onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-4 py-2 bg-teal-600 text-white rounded-lg text-xs font-bold hover:bg-teal-700 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Main Editable Grid Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[750px]">
                <thead>
                  <tr className="bg-emerald-800 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-2.5 w-12 text-center border-r border-emerald-700/60">#</th>
                    {config.headers.map((header, colIdx) => (
                      <th 
                        key={colIdx} 
                        className={`p-2.5 border-r border-emerald-700/60 relative group ${
                          colIdx === 0 ? 'min-w-[70px] w-20' : 
                          colIdx === 1 ? 'min-w-[170px]' : 
                          colIdx === 2 ? 'min-w-[340px]' : 
                          colIdx === 3 ? 'min-w-[130px]' : 
                          colIdx === 4 ? 'min-w-[280px]' : 'min-w-[180px]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <input
                            type="text"
                            value={header}
                            onChange={e => handleHeaderChange(colIdx, e.target.value)}
                            className="bg-transparent text-white font-bold text-[11px] w-full outline-none focus:bg-emerald-900/60 focus:px-1.5 focus:rounded py-0.5 placeholder:text-emerald-300"
                            placeholder={`Col ${colIdx + 1}`}
                          />
                          {config.headers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(colIdx)}
                              title={`Delete column "${header}"`}
                              className="opacity-0 group-hover:opacity-100 text-emerald-300 hover:text-rose-300 p-0.5 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </th>
                    ))}
                    <th className="p-2.5 w-24 text-center">Row Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredRowsWithIndex.length === 0 ? (
                    <tr>
                      <td colSpan={config.headers.length + 2} className="p-8 text-center text-slate-400">
                        No rows match your filter.
                      </td>
                    </tr>
                  ) : (
                    filteredRowsWithIndex.map(({ row, index: originalRowIdx }) => (
                      <tr key={originalRowIdx} className="hover:bg-emerald-50/30 transition-colors group">
                        <td className="p-2.5 text-center text-slate-400 font-mono text-[10px] bg-slate-50 border-r border-slate-100 font-bold">
                          {originalRowIdx + 1}
                        </td>
                        {row.map((cell, colIdx) => (
                          <td key={colIdx} className="p-2 border-r border-slate-100 align-top">
                            <textarea
                              rows={colIdx === 0 ? 1 : colIdx === 2 || colIdx === 4 ? 3 : 2}
                              value={cell}
                              onChange={e => handleCellChange(originalRowIdx, colIdx, e.target.value)}
                              onPaste={e => handleTablePaste(e, originalRowIdx, colIdx)}
                              className="w-full text-[11.5px] text-slate-800 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500 rounded p-1.5 transition resize-y font-normal leading-relaxed break-words whitespace-pre-wrap min-h-[38px]"
                              placeholder="Enter full details (no character limit)..."
                            />
                          </td>
                        ))}
                        <td className="p-2 text-center align-middle bg-slate-50/50">
                          <div className="flex items-center justify-center gap-1 opacity-80 group-hover:opacity-100">
                            <button
                              type="button"
                              onClick={() => handleMoveRow(originalRowIdx, 'up')}
                              disabled={originalRowIdx === 0}
                              title="Move Up"
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveRow(originalRowIdx, 'down')}
                              disabled={originalRowIdx === config.rows.length - 1}
                              title="Move Down"
                              className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 cursor-pointer"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDuplicateRow(originalRowIdx)}
                              title="Duplicate Row"
                              className="p-1 text-slate-400 hover:text-emerald-700 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(originalRowIdx)}
                              title="Delete Row"
                              className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Add Row Bar */}
            <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-medium">
                Tip: You can copy and paste entire rows/columns from Excel or Word into any cell directly.
              </span>
              <button
                type="button"
                onClick={() => handleAddRow()}
                className="px-3 py-1 bg-white border border-slate-300 rounded text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row Below
              </button>
            </div>
          </div>

          {/* Section 4.4 / 4.5 Post-Table Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-slate-600 tracking-wider flex items-center justify-between">
              <span>Section 4 Narrative Framework (Concluding Clauses Below Table)</span>
              <span className="text-[10px] text-slate-400 font-normal">Moderation & PDP developmental rules</span>
            </label>
            <textarea
              rows={3}
              value={config.notesBelow || ''}
              onChange={e => setConfig(prev => ({ ...prev, notesBelow: e.target.value }))}
              placeholder="Enter post-table guidance..."
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:bg-white focus:border-emerald-500 transition font-sans leading-relaxed"
            />
          </div>

          {/* Bottom Save Bar */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-xs text-slate-500">
              {config.updatedAt ? `Last saved: ${new Date(config.updatedAt).toLocaleString()}` : 'Unsaved changes in workspace'}
            </div>
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Performance Assessment Table</span>
            </button>
          </div>
        </div>
      ) : (
        /* Preview Tab: Formatted Printable Document View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-4xl mx-auto space-y-6 text-slate-800">
          <div className="border-b-2 border-emerald-800 pb-3 text-center">
            <h2 className="text-base font-black uppercase tracking-wide text-emerald-900">{config.title}</h2>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{config.subtitle}</p>
          </div>

          {config.notesAbove && (
            <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line font-serif">
              {config.notesAbove}
            </div>
          )}

          <div className="border border-emerald-800 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-emerald-800 text-white font-bold uppercase">
                  {config.headers.map((h, i) => (
                    <th key={i} className="p-2 border border-emerald-700">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {config.rows.map((row, rI) => (
                  <tr key={rI} className={rI % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                    {row.map((cell, cI) => (
                      <td key={cI} className="p-2 border border-slate-200 text-slate-800 align-top">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {config.notesBelow && (
            <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line font-serif">
              {config.notesBelow}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
