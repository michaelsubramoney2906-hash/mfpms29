import React, { useState, useEffect } from 'react';
import { BadgePlus, Plus, Trash2, Save, AlertTriangle } from 'lucide-react';

interface CoreCompetenciesProps {
  currentUser?: {
    email: string;
    role: string;
    name?: string;
  };
  activeTenantId?: string;
}

interface CompetencyRow {
  id: string;
  competency: string;
  basic: string;
  competent: string;
  advanced: string;
  superior: string;
}

export function CoreCompetencies({ currentUser, activeTenantId }: CoreCompetenciesProps) {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'cached' | 'saved' | 'saving' | 'error'>('cached');

  const [rows, setRows] = useState<CompetencyRow[]>([
    {
      id: 'row-1',
      competency: 'Strategic Leadership',
      basic: 'Minimal ability to guide teams',
      competent: 'Can lead a team effectively',
      advanced: 'Transforms team performance and strategy',
      superior: 'Industry visionary, drives systemic changes'
    },
    {
      id: 'row-2',
      competency: 'Financial Management',
      basic: 'Basic understanding of budgets',
      competent: 'Manages departmental budgets accurately',
      advanced: 'Optimizes large scale financial operations',
      superior: 'Sets strategic financial policies for the organisation'
    }
  ]);

  // Handle cell edits
  const handleCellEdit = (rowId: string, field: keyof CompetencyRow, value: string) => {
    setRows(prevRows => 
      prevRows.map(row => 
        row.id === rowId ? { ...row, [field]: value } : row
      )
    );
    setSyncStatus('cached');
  };

  // Handle row deletion
  const handleDeleteRow = (rowId: string) => {
    setRows(prevRows => prevRows.filter(row => row.id !== rowId));
    setSyncStatus('cached');
  };

  // Handle adding new row
  const handleAddRow = () => {
    const newId = `row-${Date.now()}`;
    setRows(prevRows => [
      ...prevRows, 
      {
        id: newId,
        competency: '',
        basic: '',
        competent: '',
        advanced: '',
        superior: ''
      }
    ]);
    setSyncStatus('cached');
  };

  // Fetch data
  useEffect(() => {
    if (!activeTenantId) return;
    
    setLoading(true);
    fetch(`/api/tenant/${activeTenantId}/core-competencies`)
      .then(res => res.json())
      .then(data => {
        if (data && data.items && Array.isArray(data.items) && data.items.length > 0) {
          setRows(data.items);
          setSyncStatus('saved');
        } else {
          // Keep defaults if nothing is returned
          setSyncStatus('saved');
        }
      })
      .catch(err => {
        console.error("Error fetching core competencies:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [activeTenantId]);

  // Save to backend
  const handleSave = async () => {
    if (!activeTenantId) return;
    
    setSaving(true);
    setSyncStatus('saving');
    
    try {
      await fetch(`/api/tenant/${activeTenantId}/core-competencies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: rows })
      });
      setSyncStatus('saved');
    } catch (err) {
      console.error("Failed to save core competencies:", err);
      setSyncStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent pr-1"></div>
          <p className="font-medium text-slate-500">Loading Core Competencies API Pipeline...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      {/* Header bar */}
      <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <div className="p-2 bg-indigo-600 rounded-xl">
              <BadgePlus className="w-6 h-6 text-white" />
            </div>
            Core Competencies Module
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">Manage institutional core competency definitions and scaling standards.</p>
        </div>
        <div className="flex items-center gap-4">
           {syncStatus === 'cached' && <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5"/> Unsaved Changes</span>}
           {syncStatus === 'saving' && <span className="text-xs font-bold text-indigo-600 flex items-center gap-1.5"><div className="w-3.5 h-3.5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"/> Syncing...</span>}
           {syncStatus === 'saved' && <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">✓ Synced to Cloud</span>}
          <button 
            onClick={handleAddRow}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-lg hover:bg-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Row
          </button>
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            <Save className="w-4 h-4" /> Save Configuration
          </button>
        </div>
      </div>

      <div className="flex-1 p-8 overflow-y-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-800">Competency details</h2>
          </div>
          
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100/50 text-[11px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-4 border-b border-r border-slate-200">Competencies</th>
                  <th className="p-4 border-b border-r border-slate-200">Basic</th>
                  <th className="p-4 border-b border-r border-slate-200">Competent</th>
                  <th className="p-4 border-b border-r border-slate-200">Advanced</th>
                  <th className="p-4 border-b border-slate-200">Superior</th>
                  <th className="p-4 border-b border-slate-200 text-center w-16">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100 hover:bg-indigo-50/30 transition group">
                    <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/6">
                      <textarea 
                        value={row.competency} 
                        onChange={(e) => handleCellEdit(row.id, 'competency', e.target.value)}
                        className="w-full text-sm font-bold text-slate-900 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Enter competency..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/6 bg-rose-50/20 focus-within:bg-rose-50/50 transition">
                      <textarea 
                        value={row.basic} 
                        onChange={(e) => handleCellEdit(row.id, 'basic', e.target.value)}
                        className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Define basic level..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/6 bg-amber-50/20 focus-within:bg-amber-50/50 transition">
                      <textarea 
                        value={row.competent} 
                        onChange={(e) => handleCellEdit(row.id, 'competent', e.target.value)}
                        className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Define competent level..."
                      />
                    </td>
                    <td className="p-3 border-r border-slate-100 whitespace-pre-wrap align-top w-1/6 bg-emerald-50/20 focus-within:bg-emerald-50/50 transition">
                      <textarea 
                        value={row.advanced} 
                        onChange={(e) => handleCellEdit(row.id, 'advanced', e.target.value)}
                        className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Define advanced level..."
                      />
                    </td>
                    <td className="p-3 whitespace-pre-wrap align-top w-1/6 bg-blue-50/20 focus-within:bg-blue-50/50 transition">
                      <textarea 
                        value={row.superior} 
                        onChange={(e) => handleCellEdit(row.id, 'superior', e.target.value)}
                        className="w-full text-sm font-medium text-slate-700 bg-white/50 focus:bg-white focus:ring-2 focus:ring-indigo-500 rounded p-1 outline-none resize-y min-h-[60px] transition-all"
                        placeholder="Define superior level..."
                      />
                    </td>
                    <td className="p-3 align-middle text-center">
                      <button 
                        onClick={() => handleDeleteRow(row.id)}
                        className="p-2 text-slate-400 hover:bg-rose-100 hover:text-rose-600 rounded-lg transition opacity-0 group-hover:opacity-100 mx-auto"
                        title="Delete Row"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center bg-slate-50 border-b-2 border-dashed border-slate-300">
                      <div className="flex flex-col items-center justify-center space-y-2">
                         <BadgePlus className="w-8 h-8 text-slate-400" />
                         <p className="text-sm font-bold text-slate-600">No core competencies defined.</p>
                         <p className="text-xs font-medium text-slate-500 w-3/4">Click "Add Row" to start building your institutional core competency evaluation standards matrix.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
