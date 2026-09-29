import React, { useState, useEffect } from 'react';
import { 
  CalendarDays, Plus, Trash2, Save, RotateCcw, Copy, ArrowUp, ArrowDown, 
  Columns, Check, Download, Search, Info,
  Maximize2, Minimize2, Eye, Edit3, AlertCircle, Clock
} from 'lucide-react';
import type { UserProfile } from '../../types';

export interface ReviewTimetableConfig {
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

interface ReviewTimetableProps {
  currentUser: UserProfile | any;
  activeTenantId: string;
}

export const DEFAULT_REVIEW_TIMETABLE_CONFIG: ReviewTimetableConfig = {
  title: "Schedule for Performance Reviews & Review Timetable",
  subtitle: "Statutory Performance Review Intervals & Compliance Discussions",
  description: "The performance of the Employee in relation to their performance agreement shall be reviewed on the following dates with the understanding that reviews in the second and fourth quarter may be conducted in more detail.",
  notesAbove: "8.1 The performance of each employee in relation to his / her performance agreement shall be reviewed according to the established institutional schedule below.\n8.2 The Employer shall keep a record of the mid-year review and annual assessment meetings.",
  headers: [
    "Review Interval / Milestone",
    "Evaluation Period",
    "Target Submission Date",
    "Review Framework & Mechanism",
    "Responsible Parties / Reviewers",
    "Output & Compliance Documentation"
  ],
  rows: [
    [
      "First Quarter (Q1) Review",
      "July - September",
      "October (First Week)",
      "Formal Progress Review & Portfolio of Evidence (POE) Submission",
      "Supervisor & Incumbent",
      "Q1 Performance Progress Report & Variance Remedial Plan"
    ],
    [
      "Second Quarter (Q2) / Mid-Year",
      "October - December",
      "January (Third Week)",
      "Comprehensive Mid-Year Assessment & S72 Formal Evaluation",
      "Supervisor, Evaluation Panel & Municipal Manager",
      "Section 72 Mid-Year Performance & Budget Adjustment Report"
    ],
    [
      "Third Quarter (Q3) Review",
      "January - March",
      "April (First Week)",
      "Formal Quarterly Milestone & Evidence Review",
      "Supervisor & Incumbent",
      "Q3 Performance Progress Assessment & KPI Status Report"
    ],
    [
      "Fourth Quarter (Q4) / Annual Assessment",
      "April - June",
      "July (Fourth Week)",
      "Comprehensive Annual Self-Assessment & Audit Reconciliation",
      "Supervisor, MM & Executive Mayor",
      "Annual Performance Report & Final Evidence Dossier"
    ],
    [
      "DPMC & Internal Audit Moderation",
      "July - August",
      "August (Third Week)",
      "Institutional Moderation, Evidence Verification & Audit Review",
      "DPMC / Internal Audit Committee",
      "Moderated Performance Scorecard & Quality Assurance Certificate"
    ],
    [
      "Council Tabling & Bonus Determination",
      "August - September",
      "September / October (Council Sitting)",
      "Final Tabling to Municipal Council & Public Disclosure",
      "Municipal Council, Mayor & Accounting Officer",
      "Adopted Council Resolution & Audited Annual Performance File"
    ]
  ],
  notesBelow: "8.3 Performance feedback shall be based on the Employer's assessment of the Employee's performance.\n8.4 The Employer will be entitled to review and make reasonable changes to the provisions of Annexure \"A\" from time to time for operational reasons. The Employee will be fully consulted before any such change is made.",
  updatedAt: new Date().toISOString(),
  updatedBy: "System Default"
};

export function ReviewTimetable({ currentUser, activeTenantId }: ReviewTimetableProps) {
  const [config, setConfig] = useState<ReviewTimetableConfig>(DEFAULT_REVIEW_TIMETABLE_CONFIG);
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
      const res = await fetch(`/api/tenant/${activeTenantId}/review-timetable-config?userId=${encodeURIComponent(email)}&t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.headers && Array.isArray(data.rows)) {
          setConfig({
            title: data.title || DEFAULT_REVIEW_TIMETABLE_CONFIG.title,
            subtitle: data.subtitle || DEFAULT_REVIEW_TIMETABLE_CONFIG.subtitle,
            description: data.description || DEFAULT_REVIEW_TIMETABLE_CONFIG.description,
            headers: data.headers.length > 0 ? data.headers : DEFAULT_REVIEW_TIMETABLE_CONFIG.headers,
            rows: data.rows.length > 0 ? data.rows : DEFAULT_REVIEW_TIMETABLE_CONFIG.rows,
            notesAbove: data.notesAbove !== undefined ? data.notesAbove : DEFAULT_REVIEW_TIMETABLE_CONFIG.notesAbove,
            notesBelow: data.notesBelow !== undefined ? data.notesBelow : DEFAULT_REVIEW_TIMETABLE_CONFIG.notesBelow,
            updatedAt: data.updatedAt,
            updatedBy: data.updatedBy
          });
        }
      }
    } catch (err: any) {
      console.error("Error fetching review timetable config:", err);
      showToast("Could not load latest review timetable template.", "error");
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

      const res = await fetch(`/api/tenant/${activeTenantId}/review-timetable-config?userId=${encodeURIComponent(email)}`, {
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
      showToast("Review Timetable template saved permanently to Supabase database. It is now static and importable in all Performance Agreements!", "success");
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: any) {
      console.error("Error saving review timetable config:", err);
      setSaveError(err.message || "Failed to save configuration");
      showToast(err.message || "Failed to save configuration", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (window.confirm("Are you sure you want to reset the table to the standard 6-row statutory review timetable? Any unsaved custom modifications will be overwritten.")) {
      setConfig({
        ...DEFAULT_REVIEW_TIMETABLE_CONFIG,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser?.displayName || currentUser?.email || 'User'
      });
      showToast("Reset to standard 6-row timetable.", "info");
    }
  };

  const handleAddRow = (insertIdx?: number) => {
    setConfig(prev => {
      const newRow = new Array(prev.headers.length).fill('');
      const newRows = [...prev.rows];
      if (typeof insertIdx === 'number') {
        newRows.splice(insertIdx + 1, 0, newRow);
      } else {
        newRows.push(newRow);
      }
      return { ...prev, rows: newRows };
    });
    showToast("New review milestone row added.", "info");
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

    if (pasteData.includes('\t')) {
      e.preventDefault();
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
    link.setAttribute('download', `Review_Timetable_Table_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Downloaded Review Timetable as CSV.", "info");
  };

  if (loading) {
    return (
      <div id="review-timetable-loading" className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-semibold text-slate-600">Loading Review Timetable Matrix...</span>
        </div>
      </div>
    );
  }

  return (
    <div id="review-timetable-module" className={`flex flex-col gap-5 ${isFullscreen ? 'fixed inset-0 z-50 bg-slate-100 p-6 overflow-y-auto' : ''}`}>
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium transition-all ${
          notification.type === 'success' ? 'bg-indigo-800 text-white' :
          notification.type === 'error' ? 'bg-rose-700 text-white' : 'bg-slate-800 text-white'
        }`}>
          {notification.type === 'success' ? <Check className="w-4 h-4 text-indigo-300" /> : <AlertCircle className="w-4 h-4 text-amber-300" />}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <CalendarDays className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                Review Timetable Module
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  IPMS Statutory Review Calendar
                </span>
              </h1>
              <p className="text-xs text-indigo-200/90 font-medium">
                Configure, customize, expand, and persist the static 6-row Review Timetable schedule used across all municipal Performance Agreements.
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
                activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-200 hover:text-white'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              Table Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-200 hover:text-white'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Document Preview
            </button>
          </div>

          <button
            id="save-review-timetable-btn"
            type="button"
            disabled={saving}
            onClick={handleSave}
            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg transition-all cursor-pointer ${
              saveSuccess 
                ? 'bg-emerald-500 text-white ring-2 ring-emerald-300' 
                : 'bg-indigo-500 hover:bg-indigo-400 text-slate-950 font-black hover:shadow-indigo-500/30'
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
                <span>Save Review Timetable</span>
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
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs text-indigo-950">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-indigo-700 shrink-0" />
          <span>
            <strong>Static Database Master:</strong> When saved, this 6-row Review Timetable schedule is saved permanently to Supabase. Any user drafting a Performance Agreement can import this schedule directly into Section 8 of their agreement.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-indigo-800 shrink-0 font-medium">
          <span>Rows: <strong className="font-bold text-indigo-950">{config.rows.length}</strong></span>
          <span>•</span>
          <span>Columns: <strong className="font-bold text-indigo-950">{config.headers.length}</strong></span>
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
                placeholder="Schedule for Performance Reviews & Review Timetable"
                className="w-full text-sm font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] uppercase font-bold text-slate-500 tracking-wider">Subtitle / Classification</label>
              <input
                type="text"
                value={config.subtitle}
                onChange={e => setConfig(prev => ({ ...prev, subtitle: e.target.value }))}
                placeholder="Statutory Performance Review Intervals & Compliance Discussions"
                className="w-full text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-2.5 outline-none focus:bg-white focus:border-indigo-500 transition"
              />
            </div>
          </div>

          {/* Section 8 Narrative Commentary (Above Table) */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-slate-600 tracking-wider flex items-center justify-between">
              <span>Section 8 Narrative Clauses (Introductory Text Above Timetable)</span>
              <span className="text-[10px] text-slate-400 font-normal">Editable statutory clauses</span>
            </label>
            <textarea
              rows={3}
              value={config.notesAbove || ''}
              onChange={e => setConfig(prev => ({ ...prev, notesAbove: e.target.value }))}
              placeholder="Enter timetable intro clauses..."
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:bg-white focus:border-indigo-500 transition font-sans leading-relaxed"
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
                  placeholder="Filter or search milestones..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 focus:bg-white text-slate-700"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddRow()}
                className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold hover:bg-indigo-100 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Milestone Row
              </button>
              <button
                type="button"
                onClick={() => setShowAddColModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-1.5 transition cursor-pointer"
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
                Reset 6 Rows
              </button>
            </div>
          </div>

          {/* Add Column Prompt Modal */}
          {showAddColModal && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-indigo-900 uppercase">Add New Table Column</span>
                <button 
                  onClick={() => setShowAddColModal(false)}
                  className="text-xs text-indigo-600 hover:text-indigo-900 font-bold"
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newColumnName}
                  onChange={e => setNewColumnName(e.target.value)}
                  placeholder="Enter column header title (e.g. Verification Method / Committee Chair)"
                  className="flex-1 text-xs p-2 bg-white border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-400"
                  onKeyDown={e => e.key === 'Enter' && handleAddColumn()}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleAddColumn}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold hover:bg-indigo-700 cursor-pointer"
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {/* Main Editable Grid Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead>
                  <tr className="bg-indigo-900 text-white text-[11px] font-bold uppercase tracking-wider">
                    <th className="p-2.5 w-12 text-center border-r border-indigo-800/60">#</th>
                    {config.headers.map((header, colIdx) => (
                      <th 
                        key={colIdx} 
                        className={`p-2.5 border-r border-indigo-800/60 relative group ${
                          colIdx === 0 ? 'min-w-[130px]' : 
                          colIdx === 1 ? 'min-w-[120px]' : 
                          colIdx === 2 ? 'min-w-[120px]' : 
                          colIdx === 3 ? 'min-w-[280px]' : 
                          colIdx === 4 ? 'min-w-[140px]' : 
                          colIdx === 5 ? 'min-w-[220px]' : 'min-w-[160px]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <input
                            type="text"
                            value={header}
                            onChange={e => handleHeaderChange(colIdx, e.target.value)}
                            className="bg-transparent text-white font-bold text-[11px] w-full outline-none focus:bg-indigo-950/60 focus:px-1.5 focus:rounded py-0.5 placeholder:text-indigo-300"
                            placeholder={`Col ${colIdx + 1}`}
                          />
                          {config.headers.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleDeleteColumn(colIdx)}
                              title={`Delete column "${header}"`}
                              className="opacity-0 group-hover:opacity-100 text-indigo-300 hover:text-rose-300 p-0.5 transition cursor-pointer"
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
                      <tr key={originalRowIdx} className="hover:bg-indigo-50/30 transition-colors group">
                        <td className="p-2.5 text-center text-slate-400 font-mono text-[10px] bg-slate-50 border-r border-slate-100 font-bold">
                          {originalRowIdx + 1}
                        </td>
                        {row.map((cell, colIdx) => (
                          <td key={colIdx} className="p-2 border-r border-slate-100 align-top">
                            <textarea
                              rows={colIdx === 0 || colIdx === 1 || colIdx === 2 ? 1 : colIdx === 3 || colIdx === 5 ? 3 : 2}
                              value={cell}
                              onChange={e => handleCellChange(originalRowIdx, colIdx, e.target.value)}
                              onPaste={e => handleTablePaste(e, originalRowIdx, colIdx)}
                              className="w-full text-[11.5px] text-slate-800 bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-500 rounded p-1.5 transition resize-y font-normal leading-relaxed break-words whitespace-pre-wrap min-h-[38px]"
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
                              className="p-1 text-slate-400 hover:text-indigo-700 cursor-pointer"
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
                className="px-3 py-1 bg-white border border-slate-300 rounded text-indigo-700 text-xs font-bold hover:bg-indigo-50 transition cursor-pointer flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Milestone Below
              </button>
            </div>
          </div>

          {/* Section 8 Post-Table Notes */}
          <div className="space-y-1.5">
            <label className="text-[11px] uppercase font-bold text-slate-600 tracking-wider flex items-center justify-between">
              <span>Section 8 Narrative Clauses (Concluding Text Below Timetable)</span>
              <span className="text-[10px] text-slate-400 font-normal">Feedback and operational amendment terms</span>
            </label>
            <textarea
              rows={3}
              value={config.notesBelow || ''}
              onChange={e => setConfig(prev => ({ ...prev, notesBelow: e.target.value }))}
              placeholder="Enter post-timetable terms..."
              className="w-full text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded-lg p-3 outline-none focus:bg-white focus:border-indigo-500 transition font-sans leading-relaxed"
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
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
              <span>Save Review Timetable</span>
            </button>
          </div>
        </div>
      ) : (
        /* Preview Tab: Formatted Printable Document View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8 max-w-4xl mx-auto space-y-6 text-slate-800">
          <div className="border-b-2 border-indigo-900 pb-3 text-center">
            <h2 className="text-base font-black uppercase tracking-wide text-indigo-950">{config.title}</h2>
            <p className="text-xs font-semibold text-slate-600 mt-0.5">{config.subtitle}</p>
          </div>

          {config.notesAbove && (
            <div className="text-xs leading-relaxed text-slate-700 whitespace-pre-line font-serif">
              {config.notesAbove}
            </div>
          )}

          <div className="border border-indigo-900 rounded overflow-hidden">
            <table className="w-full text-left border-collapse text-[10px]">
              <thead>
                <tr className="bg-indigo-900 text-white font-bold uppercase">
                  {config.headers.map((h, i) => (
                    <th key={i} className="p-2 border border-indigo-800">{h}</th>
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
