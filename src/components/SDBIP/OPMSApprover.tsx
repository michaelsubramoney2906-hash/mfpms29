import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, 
  Layers, Database, ChevronRight, Clock, ShieldCheck, 
  ThumbsUp, MessageSquare, ArrowLeftRight, UserCheck, Check, X, ShieldAlert, Award, FileSpreadsheet
} from 'lucide-react';
import type { User } from '../../types';
import { SdbipRow } from './SDBIP';

interface OPMSApproverProps {
  currentUser: User;
  activeTenantId: string;
}

export function OPMSApprover({ currentUser, activeTenantId }: OPMSApproverProps) {
  const [rows, setRows] = useState<SdbipRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<SdbipRow | null>(null);
  const [statusFilter, setStatusFilter] = useState('Reviewed'); // default to Reviewed first!
  const [searchQuery, setSearchQuery] = useState('');
  const [approverNotes, setApproverNotes] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  useEffect(() => {
    fetchSDBIPData();
  }, [activeTenantId]);

  useEffect(() => {
    if (selectedKpi) {
      setApproverNotes((selectedKpi as any).approverNotes || '');
    } else {
      setApproverNotes('');
    }
  }, [selectedKpi]);

  const fetchSDBIPData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/tenant/${activeTenantId}/sdbip`);
      if (!response.ok) throw new Error('Failed to retrieve SDBIP scorecard data');
      const data = await response.json();
      setRows(data.items || []);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while communicating with Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleGrantApproval = async () => {
    if (!selectedKpi) return;
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Officially Approved',
            user: currentUser.email,
            notes: approverNotes || 'Officially signed off & sealed by executive leadership.'
          };

          return {
            ...r,
            workflowStatus: 'Approved',
            approvedBy: currentUser.email,
            approverNotes: approverNotes,
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

      if (!response.ok) throw new Error('Failed to record Executive Approval to Supabase');
      
      setRows(updatedRows);
      setSuccess('SDBIP Item officially APPROVED and LOCKED in compliance archives!');
      setTimeout(() => setSuccess(null), 4000);
      setSelectedKpi(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRejectToReviewer = async () => {
    if (!selectedKpi) return;
    if (!approverNotes.trim()) {
      setError('Please provide executive notes explaining the rejection directive.');
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
            action: 'Rejected & Returned',
            user: currentUser.email,
            notes: approverNotes
          };

          return {
            ...r,
            workflowStatus: 'Returned', // return back to submitter with feedback
            reviewerNotes: `Executive Rejection Directive: ${approverNotes}`,
            approverNotes: approverNotes,
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

      if (!response.ok) throw new Error('Failed to dispatch rejection directive');
      
      setRows(updatedRows);
      setSuccess('Scorecard rejected and sent down the pipeline with executive correction notes.');
      setTimeout(() => setSuccess(null), 4000);
      setSelectedKpi(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredRows = rows.filter(r => {
    const rowStatus = (r as any).workflowStatus || 'Draft';
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      matchesStatus = rowStatus === statusFilter;
    }

    const matchesSearch = searchQuery === '' || 
      r.refNum.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.kpi.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  // Calculate high level stats
  const totalKpis = rows.length;
  const submittedCount = rows.filter(r => (r as any).workflowStatus === 'Submitted').length;
  const reviewedCount = rows.filter(r => (r as any).workflowStatus === 'Reviewed').length;
  const approvedCount = rows.filter(r => (r as any).workflowStatus === 'Approved').length;

  const getStatusBadge = (status: string | undefined) => {
    const s = status || 'Draft';
    switch (s) {
      case 'Submitted':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Awaiting Review</span>;
      case 'Reviewed':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Awaiting Executive Approval</span>;
      case 'Approved':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Approved & Sealed</span>;
      case 'Returned':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Returned / Correction</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Draft</span>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-white p-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl font-sans">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Award className="w-40 h-40" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                OPMS Approver Chamber
              </span>
              <span className="bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[9px] px-2 py-0.5 rounded-full font-semibold">
                MM Authorization Core
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-100">
              Executive Sign-Off & Seal Authority
            </h1>
            <p className="text-slate-400 text-xs max-w-2xl mt-1">
              Officially sanction reviewed department achievements, issue compliance signatures, and lock public records under national treasury standards.
            </p>
          </div>
          
          <div className="flex items-center gap-2 shrink-0">
            <button 
              onClick={() => setShowCertificate(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-900/30 border border-emerald-500/20"
            >
              <Award className="w-3.5 h-3.5" />
              Compliance Certificate
            </button>
            <button 
              onClick={fetchSDBIPData}
              disabled={loading}
              className="bg-slate-850 hover:bg-slate-850 text-slate-200 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Sync Data
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total Indicators</span>
          <span className="text-2xl font-black text-white mt-1">{totalKpis}</span>
        </div>
        <div className="bg-indigo-950/20 border border-indigo-900/30 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-wider">Pending Decision</span>
          <span className="text-2xl font-black text-indigo-400 mt-1">{reviewedCount}</span>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Approved & Locked</span>
          <span className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</span>
        </div>
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3.5 flex flex-col justify-between">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Under PMU Review</span>
          <span className="text-2xl font-black text-amber-400 mt-1">{submittedCount}</span>
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

      {/* Two Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Pending lists */}
        <div className={`flex flex-col space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 min-h-[500px] ${selectedKpi ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <UserCheck className="w-4.5 h-4.5 text-emerald-500" />
              Executive decision deck ({filteredRows.length})
            </h2>

            {/* Stage Quick filters */}
            <div className="flex items-center gap-2">
              <div className="relative shrink-0 w-36">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Query ref num..."
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
                <option value="Reviewed">Awaiting Sign-off (Recommended)</option>
                <option value="Approved">Officially Approved</option>
                <option value="Submitted">Awaiting Review</option>
                <option value="Returned">Returned / Correcting</option>
              </select>
            </div>
          </div>

          <div className="overflow-auto max-h-[520px] divide-y divide-slate-850">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 text-slate-500">
                <ShieldCheck className="w-10 h-10 opacity-30 mb-2 text-emerald-400" />
                <p className="text-xs font-bold text-slate-400">Executive Queue Clear!</p>
                <p className="text-[10px] mt-0.5 text-slate-500">No scorecards awaiting executive sanction in this category.</p>
              </div>
            ) : (
              filteredRows.map(row => {
                const isSelected = selectedKpi?.id === row.id;
                const status = (row as any).workflowStatus || 'Draft';
                return (
                  <div 
                    key={row.id}
                    onClick={() => setSelectedKpi(row)}
                    className={`p-3 transition-all cursor-pointer hover:bg-slate-850/50 flex flex-col space-y-1.5 border-l-4 ${isSelected ? 'bg-slate-850 border-l-emerald-500' : 'border-l-transparent'}`}
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
                      <span>Annual Target: <strong className="text-indigo-400">{row.annualTarget}</strong></span>
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        Authorize <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Execution Signoff Sheet */}
        {selectedKpi && (
          <div className="lg:col-span-6 xl:col-span-5 bg-slate-900/65 border-2 border-slate-800 rounded-2xl p-5 flex flex-col space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Executive Authority</span>
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

            {/* Full Details view */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-2 text-xs">
              <h4 className="font-bold text-slate-300 uppercase text-[10px] tracking-wider border-b border-slate-900 pb-1">Performance Details</h4>
              <p className="text-slate-400"><strong>KPI:</strong> {selectedKpi.kpi}</p>
              <p className="text-slate-400"><strong>Unit of Measure:</strong> {selectedKpi.uom}</p>
              
              {/* Performance Actual values side by side */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900 text-slate-300">
                {selectedKpi.q1Actual && <div>Q1 Actual: <strong className="text-emerald-400 font-bold">{selectedKpi.q1Actual}</strong> <span className="text-slate-500">(Target: {selectedKpi.q1})</span></div>}
                {selectedKpi.q2Actual && <div>Q2 Actual: <strong className="text-emerald-400 font-bold">{selectedKpi.q2Actual}</strong> <span className="text-slate-500">(Target: {selectedKpi.q2})</span></div>}
                {selectedKpi.q3Actual && <div>Q3 Actual: <strong className="text-emerald-400 font-bold">{selectedKpi.q3Actual}</strong> <span className="text-slate-500">(Target: {selectedKpi.q3})</span></div>}
                {selectedKpi.q4Actual && <div>Q4 Actual: <strong className="text-emerald-400 font-bold">{selectedKpi.q4Actual}</strong> <span className="text-slate-500">(Target: {selectedKpi.q4})</span></div>}
              </div>
            </div>

            {/* Reviewer advice notes */}
            {(selectedKpi as any).reviewerNotes && (
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-850/60 space-y-1">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">PMU Review Recommendation Remarks</span>
                <p className="text-xs text-slate-300 font-sans italic leading-relaxed">
                  "{(selectedKpi as any).reviewerNotes}"
                </p>
                <div className="text-[9.5px] text-slate-500 pt-1 border-t border-slate-900 mt-1">
                  Recommended by: <span className="font-bold text-indigo-300 font-mono">{(selectedKpi as any).reviewedBy || 'pmu@mzansiflow.co.za'}</span>
                </div>
              </div>
            )}

            {/* Evidence details */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Verifiable Evidence Desk</span>
              <p className="text-xs text-slate-300 leading-relaxed italic">
                {selectedKpi.poeDesc || "digital Portfolio of Evidence (PoE) logged & verified by reviewers."}
              </p>
            </div>

            {/* Approver direct comments */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400">Executive Directives / Approver Remarks</label>
              <textarea
                value={approverNotes}
                onChange={(e) => setApproverNotes(e.target.value)}
                disabled={(selectedKpi as any).workflowStatus === 'Approved'}
                placeholder="Type final sign-off directives or audit directives..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded p-2 text-xs text-white h-24 focus:outline-none resize-none"
              />
            </div>

            {/* Action buttons */}
            {((selectedKpi as any).workflowStatus !== 'Approved') ? (
              <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-850">
                <button
                  onClick={handleRejectToReviewer}
                  disabled={loading}
                  className="w-full bg-rose-950/40 hover:bg-rose-900/30 text-rose-300 border border-rose-800/30 rounded-xl py-3.5 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1"
                >
                  <X className="w-4 h-4" />
                  Decline & Return
                </button>
                <button
                  onClick={handleGrantApproval}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl py-3.5 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                >
                  <CheckCircle className="w-4 h-4" />
                  Grant Sign-off
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/25 border border-emerald-900/40 text-emerald-300 text-xs p-3.5 rounded-xl flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>
                  This KPI is officially approved and signed off. Approved by: <strong>{(selectedKpi as any).approvedBy || currentUser.email}</strong>
                </span>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Compliance Certificate Modal */}
      {showCertificate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border-2 border-emerald-500/30 rounded-3xl p-6 max-w-2xl w-full text-slate-100 shadow-2xl relative">
            <button 
              onClick={() => setShowCertificate(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full cursor-pointer transition-all"
            >
              ✕
            </button>

            <div className="text-center space-y-2 border-b border-slate-800 pb-5">
              <Award className="w-12 h-12 text-emerald-400 mx-auto" />
              <h2 className="text-xl font-black uppercase tracking-widest text-emerald-400">Official Compliance Certification</h2>
              <p className="text-xs text-slate-400">Issued under Section 56 of Municipal Finance Management Act (MFMA) standards</p>
            </div>

            <div className="my-5 space-y-3 max-h-[300px] overflow-auto pr-1">
              <p className="text-xs text-slate-300 leading-relaxed">
                This document certifies that the following SDBIP KPI items have been thoroughly submitted by departments, verified against digital Portfolios of Evidence (PoE) by the Performance Management Unit (PMU), and officially signed off by executive authority.
              </p>

              {/* List of approved items */}
              <div className="border border-slate-800 rounded-xl divide-y divide-slate-850 font-mono text-[11px] overflow-hidden">
                <div className="bg-slate-950 p-2.5 font-sans font-bold text-slate-400 flex justify-between">
                  <span>Approved KPI Target Ref</span>
                  <span>Compliance Status</span>
                </div>
                {rows.filter(r => (r as any).workflowStatus === 'Approved').length === 0 ? (
                  <div className="p-6 text-center text-slate-500">
                    No items currently marked as Approved & Signed-off.
                  </div>
                ) : (
                  rows.filter(r => (r as any).workflowStatus === 'Approved').map(row => (
                    <div key={row.id} className="p-2.5 flex items-center justify-between">
                      <span className="font-bold text-slate-200">{row.refNum} - <span className="font-sans font-normal text-slate-400">{row.kpi.substring(0, 45)}...</span></span>
                      <span className="text-emerald-400 font-bold">● SEALED</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="border-t border-slate-800 pt-5 flex items-center justify-between text-xs text-slate-400">
              <div>
                <p>Municipal Authority: <strong className="text-slate-200">Municipal Manager Office</strong></p>
                <p>Date Generated: <strong className="text-slate-200">{new Date().toLocaleDateString()}</strong></p>
              </div>
              <button 
                onClick={() => {
                  window.print();
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 py-2 font-bold uppercase tracking-wider cursor-pointer"
              >
                Print Sign-off Sheet
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
