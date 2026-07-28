import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, 
  Layers, Database, ChevronRight, Clock, ShieldCheck, 
  ThumbsUp, MessageSquare, ArrowLeftRight, UserCheck, Check, X, ShieldAlert
} from 'lucide-react';
import type { User } from '../../types';
import { SdbipRow } from './SDBIP';

interface OPMSReviewerProps {
  currentUser: User;
  activeTenantId: string;
}

export function OPMSReviewer({ currentUser, activeTenantId }: OPMSReviewerProps) {
  const [rows, setRows] = useState<SdbipRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<SdbipRow | null>(null);
  const [kpaFilter, setKpaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // default to ALL to show all pending items immediately!
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');

  useEffect(() => {
    fetchSDBIPData(false);
    const interval = setInterval(() => {
      fetchSDBIPData(true);
    }, 4000);

    const handleFocus = () => {
      fetchSDBIPData(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTenantId]);

  useEffect(() => {
    if (selectedKpi) {
      setReviewerNotes((selectedKpi as any).reviewerNotes || '');
    } else {
      setReviewerNotes('');
    }
  }, [selectedKpi]);

  const fetchSDBIPData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    if (!isBackground) setError(null);
    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/sdbip`);
      if (!response.ok) throw new Error('Failed to retrieve SDBIP scorecard data');
      const data = await response.json();
      const freshItems = data.items || [];
      setRows(freshItems);
      setSelectedKpi(prev => {
        if (!prev) return null;
        return freshItems.find((x: SdbipRow) => x.id === prev.id) || prev;
      });
    } catch (err: any) {
      console.error(err);
      if (!isBackground) setError(err.message || 'An error occurred while communicating with Supabase.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  };

  const handleRecommendApproval = async () => {
    if (!selectedKpi) return;
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Recommended for Approval',
            user: currentUser.email,
            notes: reviewerNotes || 'Recommended by Performance Review unit.'
          };

          const workflows = r.workflows || {};
          // Update all active phases or q1
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'pending_approval', reviewedBy: currentUser.email };
            }
          });

          return {
            ...r,
            workflowStatus: 'Reviewed',
            reviewedBy: currentUser.email,
            reviewerNotes: reviewerNotes,
            workflows,
            workflowHistory: [...currentHistory, newHistoryItem]
          } as SdbipRow;
        }
        return r;
      });

      const response = await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });

      if (!response.ok) throw new Error('Failed to update review recommendations to Supabase');
      
      setRows(updatedRows);
      setSuccess('SDBIP Item recommended for Executive Sign-off successfully!');
      setTimeout(() => setSuccess(null), 4000);
      setSelectedKpi(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePushToAudit = async () => {
    if (!selectedKpi) return;
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Pushed to Internal Audit',
            user: currentUser.email,
            notes: reviewerNotes || 'Pushed to Internal Audit desk for compliance verification.'
          };

          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'pending_audit', reviewedBy: currentUser.email };
            }
          });

          return {
            ...r,
            workflowStatus: 'Pending Audit',
            reviewedBy: currentUser.email,
            reviewerNotes: reviewerNotes,
            workflows,
            workflowHistory: [...currentHistory, newHistoryItem]
          } as SdbipRow;
        }
        return r;
      });

      const response = await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });

      if (!response.ok) throw new Error('Failed to push item to Internal Audit');
      
      setRows(updatedRows);
      setSuccess('SDBIP Item successfully pushed to Internal Audit desk!');
      setTimeout(() => setSuccess(null), 4000);
      setSelectedKpi(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToSubmitter = async () => {
    if (!selectedKpi) return;
    if (!reviewerNotes.trim()) {
      setError('Please provide reviewer notes explaining why this is returned for corrections.');
      setTimeout(() => setError(null), 4000);
      return;
    }
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Returned for Corrections',
            user: currentUser.email,
            notes: reviewerNotes
          };

          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'draft' };
            }
          });

          return {
            ...r,
            workflowStatus: 'Returned',
            reviewerNotes: reviewerNotes,
            workflows,
            workflowHistory: [...currentHistory, newHistoryItem]
          } as SdbipRow;
        }
        return r;
      });

      const response = await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });

      if (!response.ok) throw new Error('Failed to dispatch correction request');
      
      setRows(updatedRows);
      setSuccess('Scorecard successfully returned to department with correction logs.');
      setTimeout(() => setSuccess(null), 4000);
      setSelectedKpi(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute filters
  const kpas = Array.from(new Set(rows.map(r => r.kpas).filter(Boolean)));

  const filteredRows = rows.filter(r => {
    const matchesKpa = kpaFilter === 'ALL' || r.kpas === kpaFilter;
    
    const rowStatus = (r as any).workflowStatus || 'Draft';
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'Submitted') {
        matchesStatus = rowStatus === 'Submitted' || rowStatus === 'Reviewed' || rowStatus === 'Pending Review' ||
          r.workflows?.q1?.status === 'pending_review' || r.workflows?.q2?.status === 'pending_review' ||
          r.workflows?.q3?.status === 'pending_review' || r.workflows?.q4?.status === 'pending_review' ||
          r.workflows?.q1?.status === 'pending_approval' || r.workflows?.q2?.status === 'pending_approval';
      } else {
        matchesStatus = rowStatus === statusFilter;
      }
    }

    const matchesSearch = searchQuery === '' || 
      (r.refNum && r.refNum.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (r.kpi && r.kpi.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesKpa && matchesStatus && matchesSearch;
  });

  // Calculate high level stats
  const totalKpis = rows.length;
  const submittedCount = rows.filter(r => (r as any).workflowStatus === 'Submitted').length;
  const reviewedCount = rows.filter(r => (r as any).workflowStatus === 'Reviewed').length;
  const approvedCount = rows.filter(r => (r as any).workflowStatus === 'Approved').length;
  const returnedCount = rows.filter(r => (r as any).workflowStatus === 'Returned').length;

  const getStatusBadge = (status: string | undefined) => {
    const s = status || 'Draft';
    switch (s) {
      case 'Submitted':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Submitted / Awaiting Review</span>;
      case 'Reviewed':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Reviewed & Recommended</span>;
      case 'Approved':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Officially Approved</span>;
      case 'Returned':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Returned / Action Required</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Draft</span>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-white p-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Database className="w-40 h-40" />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-violet-500/30 text-violet-300 border border-violet-500/40 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                PMU Review Station
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-semibold">
                Authorization Pipeline
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-100 font-sans">
              Performance Review & Auditing Deck
            </h1>
            <p className="text-slate-400 text-xs max-w-2xl mt-1">
              Audit reported achievements, cross-verify target metrics against digital Portfolios of Evidence (PoE), and provide direct alignment advice.
            </p>
          </div>
          <button 
            onClick={() => fetchSDBIPData(false)}
            disabled={loading}
            className="bg-violet-600/30 hover:bg-violet-600/50 text-violet-200 border border-violet-500/30 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Dashboard
          </button>
        </div>
      </div>

      {/* Reviewer Pipeline Count Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Indicators</span>
          <span className="text-2xl font-black text-white mt-1">{totalKpis}</span>
        </div>
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Awaiting PMU Review</span>
          <span className="text-2xl font-black text-amber-400 mt-1">{submittedCount}</span>
        </div>
        <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Recommended for sign-off</span>
          <span className="text-2xl font-black text-indigo-400 mt-1">{reviewedCount}</span>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Approved & Sealed</span>
          <span className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</span>
        </div>
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Returned & Retrying</span>
          <span className="text-2xl font-black text-rose-400 mt-1">{returnedCount}</span>
        </div>
      </div>

      {/* Global Toast Alerts */}
      {error && (
        <div className="bg-rose-950/30 border-2 border-rose-500/30 rounded-xl p-3 flex items-center gap-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="bg-emerald-950/30 border-2 border-emerald-500/30 rounded-xl p-3 flex items-center gap-2 text-emerald-300 text-xs">
          <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{success}</span>
        </div>
      )}

      {/* Audit Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left List of items under selected stages */}
        <div className={`flex flex-col space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 min-h-[500px] ${selectedKpi ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4.5 h-4.5 text-indigo-500" />
              SDBIP review inbox ({filteredRows.length})
            </h2>

            {/* Smart Filters */}
            <div className="flex flex-wrap items-center gap-2">
              
              <div className="relative shrink-0 w-36">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Ref query..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-white focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
              >
                <option value="ALL">All States</option>
                <option value="Submitted">Awaiting PMU Review</option>
                <option value="Reviewed">Reviewed / Recommending</option>
                <option value="Approved">Sealed & Approved</option>
                <option value="Returned">Returned / Correction</option>
                <option value="Draft">Draft Workspace</option>
              </select>

              <select
                value={kpaFilter}
                onChange={(e) => setKpaFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none"
              >
                <option value="ALL">All KPAs</option>
                {kpas.map(kpa => (
                  <option key={kpa} value={kpa}>{kpa}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-auto max-h-[520px] divide-y divide-slate-850">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                <ThumbsUp className="w-10 h-10 opacity-30 mb-2 text-indigo-400" />
                <p className="text-xs font-bold text-slate-400">Review Inbox Clean!</p>
                <p className="text-[10px] mt-0.5 text-slate-500">All submitted department targets have been audited.</p>
              </div>
            ) : (
              filteredRows.map(row => {
                const isSelected = selectedKpi?.id === row.id;
                const status = (row as any).workflowStatus || 'Draft';
                return (
                  <div 
                    key={row.id}
                    onClick={() => setSelectedKpi(row)}
                    className={`p-3 transition-all cursor-pointer hover:bg-slate-850/50 flex flex-col space-y-1.5 border-l-4 ${isSelected ? 'bg-slate-850 border-l-violet-500' : 'border-l-transparent'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="bg-slate-950 px-2 py-0.5 border border-slate-800 font-mono text-[11px] text-slate-200 rounded font-bold">
                        {row.refNum}
                      </span>
                      {getStatusBadge(status)}
                    </div>
                    
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      <strong>KPI:</strong> {row.kpi}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span>KPA Area: <strong className="text-indigo-400 truncate max-w-[200px] inline-block align-bottom">{row.kpas}</strong></span>
                      <span className="text-indigo-300 font-bold flex items-center gap-0.5">
                        Audit Details <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Audit Desk Detail Sheet */}
        {selectedKpi && (
          <div className="lg:col-span-6 xl:col-span-5 bg-slate-900/65 border-2 border-slate-800 rounded-2xl p-5 flex flex-col space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Appraisal Panel</span>
                <h3 className="text-sm font-black text-slate-200 uppercase mt-0.5 font-mono">
                  REF: {selectedKpi.refNum}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedKpi(null)}
                className="text-slate-500 hover:text-slate-200 text-xs font-mono px-2 py-1 rounded hover:bg-slate-800 transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* Submitter details overview */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-900 pb-1">Reported Progress Logs</h4>
              <div className="space-y-2">
                {selectedKpi.q1Actual && (
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-850/50">
                    <p className="text-[10.5px] font-bold text-slate-400">Quarter 1 (Target: {selectedKpi.q1}):</p>
                    <p className="text-white mt-0.5 font-sans">Actual: <span className="text-emerald-400 font-bold">{selectedKpi.q1Actual}</span></p>
                    {selectedKpi.q1Variance && <p className="text-slate-400 text-[10px]">Variance: {selectedKpi.q1Variance}</p>}
                    {selectedKpi.q1Corrective && <p className="text-amber-400 text-[10px]">Correction: {selectedKpi.q1Corrective}</p>}
                  </div>
                )}
                {selectedKpi.q2Actual && (
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-850/50">
                    <p className="text-[10.5px] font-bold text-slate-400">Quarter 2 (Target: {selectedKpi.q2}):</p>
                    <p className="text-white mt-0.5 font-sans">Actual: <span className="text-emerald-400 font-bold">{selectedKpi.q2Actual}</span></p>
                    {selectedKpi.q2Variance && <p className="text-slate-400 text-[10px]">Variance: {selectedKpi.q2Variance}</p>}
                    {selectedKpi.q2Corrective && <p className="text-amber-400 text-[10px]">Correction: {selectedKpi.q2Corrective}</p>}
                  </div>
                )}
                {selectedKpi.q3Actual && (
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-850/50">
                    <p className="text-[10.5px] font-bold text-slate-400">Quarter 3 (Target: {selectedKpi.q3}):</p>
                    <p className="text-white mt-0.5 font-sans">Actual: <span className="text-emerald-400 font-bold">{selectedKpi.q3Actual}</span></p>
                    {selectedKpi.q3Variance && <p className="text-slate-400 text-[10px]">Variance: {selectedKpi.q3Variance}</p>}
                    {selectedKpi.q3Corrective && <p className="text-amber-400 text-[10px]">Correction: {selectedKpi.q3Corrective}</p>}
                  </div>
                )}
                {selectedKpi.q4Actual && (
                  <div className="bg-slate-900/60 p-2 rounded border border-slate-850/50">
                    <p className="text-[10.5px] font-bold text-slate-400">Quarter 4 (Target: {selectedKpi.q4}):</p>
                    <p className="text-white mt-0.5 font-sans">Actual: <span className="text-emerald-400 font-bold">{selectedKpi.q4Actual}</span></p>
                    {selectedKpi.q4Variance && <p className="text-slate-400 text-[10px]">Variance: {selectedKpi.q4Variance}</p>}
                    {selectedKpi.q4Corrective && <p className="text-amber-400 text-[10px]">Correction: {selectedKpi.q4Corrective}</p>}
                  </div>
                )}
              </div>
            </div>

            {/* digital PoE Evidence logs */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Verifiable Evidence Desk</span>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                {selectedKpi.poeDesc || (selectedKpi as any).q1PoeDesc || "No explicit digital evidence text descriptions logged."}
              </p>
            </div>

            {/* Submitter remarks */}
            {(selectedKpi as any).submitterNotes && (
              <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-850/60 space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Submitter Remarks</span>
                <p className="text-xs text-slate-300 font-sans italic">
                  "{(selectedKpi as any).submitterNotes}"
                </p>
              </div>
            )}

            {/* Audit review checklist (interactive larp) */}
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">Compliance Checklist</span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800" />
                  <span>Reported Achievements align with UoM</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800" />
                  <span>Portfolio of Evidence (PoE) matches data</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800" />
                  <span>Variance and mitigations meet AGSA standards</span>
                </label>
              </div>
            </div>

            {/* Reviewer appraisal editor */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Auditor / PMU Review Remarks</label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                disabled={(selectedKpi as any).workflowStatus === 'Approved'}
                placeholder="State evaluation remarks, audit findings or return instructions here..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-2 text-xs text-white h-24 focus:outline-none resize-none"
              />
            </div>

            {/* Reviewer Action Buttons */}
            {((selectedKpi as any).workflowStatus !== 'Approved') ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-3 border-t border-slate-850">
                <button
                  onClick={handleReturnToSubmitter}
                  disabled={loading}
                  className="w-full bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 border border-rose-800/30 rounded-xl py-3 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Return
                </button>
                <button
                  onClick={handlePushToAudit}
                  disabled={loading}
                  className="w-full bg-amber-950/40 hover:bg-amber-900/30 text-amber-300 border border-amber-800/30 rounded-xl py-3 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Push to Audit
                </button>
                <button
                  onClick={handleRecommendApproval}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl py-3 font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <Check className="w-3.5 h-3.5" />
                  Recommend
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-xs p-3 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>This item is finalized, approved, and sealed. No further review acts required.</span>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
