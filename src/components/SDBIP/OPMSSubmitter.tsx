import React, { useState, useEffect, useRef } from 'react';
import { 
  FileText, ArrowRight, CheckCircle, AlertTriangle, AlertCircle, 
  Send, RefreshCw, Layers, Database, Search, ChevronRight, 
  Clock, Plus, ShieldCheck, Check, MessageSquare, Info, Lock,
  Upload, Eye, Trash2, Paperclip, FileSpreadsheet, Presentation, Image as ImageIcon,
  Bell, CheckCircle2, UserCheck, ShieldAlert, X
} from 'lucide-react';
import type { User } from '../../types';
import { SdbipRow } from './SDBIP';
import { isQuarterInReportingPeriod, getQuarterLockNotice } from '../../utils/reportingPeriods';
import { OfficeDocumentViewer, PoeDocument } from '../IPMS/OfficeDocumentViewer';
import { 
  SdbipWorkflowNotification, 
  isUserMatch, 
  fetchSdbipNotifications, 
  dispatchSdbipNotification, 
  markSdbipNotificationRead,
  extractKpiPoes 
} from '../../utils/sdbipWorkflowHelper';

interface OPMSSubmitterProps {
  currentUser: User;
  activeTenantId: string;
}

export function OPMSSubmitter({ currentUser, activeTenantId }: OPMSSubmitterProps) {
  const [rows, setRows] = useState<SdbipRow[]>([]);
  const [notifications, setNotifications] = useState<SdbipWorkflowNotification[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<'ALL' | 'MINE'>('ALL');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<SdbipRow | null>(null);
  const [kpaFilter, setKpaFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [poes, setPoes] = useState<any[]>([]);
  const [previewDoc, setPreviewDoc] = useState<PoeDocument | null>(null);
  const [uploadingPoe, setUploadingPoe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editing states for selected KPI
  const [q1Actual, setQ1Actual] = useState('');
  const [q1Variance, setQ1Variance] = useState('');
  const [q1Corrective, setQ1Corrective] = useState('');
  
  const [q2Actual, setQ2Actual] = useState('');
  const [q2Variance, setQ2Variance] = useState('');
  const [q2Corrective, setQ2Corrective] = useState('');

  const [q3Actual, setQ3Actual] = useState('');
  const [q3Variance, setQ3Variance] = useState('');
  const [q3Corrective, setQ3Corrective] = useState('');

  const [q4Actual, setQ4Actual] = useState('');
  const [q4Variance, setQ4Variance] = useState('');
  const [q4Corrective, setQ4Corrective] = useState('');

  const [poeDesc, setPoeDesc] = useState('');
  const [submitterNotes, setSubmitterNotes] = useState('');

  const loadNotifications = async () => {
    const list = await fetchSdbipNotifications(activeTenantId);
    setNotifications(list);
  };

  useEffect(() => {
    fetchSDBIPData(false);
    fetchPoes();
    loadNotifications();
    const interval = setInterval(() => {
      fetchSDBIPData(true);
      fetchPoes();
      loadNotifications();
    }, 4000);

    const handleFocus = () => {
      fetchSDBIPData(true);
      fetchPoes();
      loadNotifications();
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [activeTenantId]);

  const fetchPoes = async () => {
    try {
      const res = await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`);
      if (res.ok) {
        const data = await res.json();
        setPoes(data.poes || []);
      }
    } catch (e) {
      console.error("Error fetching POEs:", e);
    }
  };

  useEffect(() => {
    if (selectedKpi) {
      setQ1Actual(selectedKpi.q1Actual || '');
      setQ1Variance(selectedKpi.q1Variance || '');
      setQ1Corrective(selectedKpi.q1Corrective || '');

      setQ2Actual(selectedKpi.q2Actual || '');
      setQ2Variance(selectedKpi.q2Variance || '');
      setQ2Corrective(selectedKpi.q2Corrective || '');

      setQ3Actual(selectedKpi.q3Actual || '');
      setQ3Variance(selectedKpi.q3Variance || '');
      setQ3Corrective(selectedKpi.q3Corrective || '');

      setQ4Actual(selectedKpi.q4Actual || '');
      setQ4Variance(selectedKpi.q4Variance || '');
      setQ4Corrective(selectedKpi.q4Corrective || '');

      setPoeDesc(selectedKpi.poeDesc || selectedKpi.q1PoeDesc || '');
      setSubmitterNotes((selectedKpi as any).submitterNotes || '');
    } else {
      clearForm();
    }
  }, [selectedKpi]);

  const clearForm = () => {
    setQ1Actual('');
    setQ1Variance('');
    setQ1Corrective('');
    setQ2Actual('');
    setQ2Variance('');
    setQ2Corrective('');
    setQ3Actual('');
    setQ3Variance('');
    setQ3Corrective('');
    setQ4Actual('');
    setQ4Variance('');
    setQ4Corrective('');
    setPoeDesc('');
    setSubmitterNotes('');
  };

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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedKpi) return;
    
    setUploadingPoe(true);
    try {
      const file = files[0];
      const reader = new FileReader();
      
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const newPoeItem = {
          id: `poe-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          refNum: selectedKpi.refNum,
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          date: new Date().toISOString().split('T')[0],
          fileData: dataUrl,
          fileType: file.type || 'application/octet-stream',
          uploadedBy: currentUser.email,
          uploadedAt: new Date().toISOString()
        };

        const updatedPoes = [newPoeItem, ...poes.filter(p => !(p.refNum === selectedKpi.refNum && p.name === file.name))];
        
        await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ poes: updatedPoes })
        });

        setPoes(updatedPoes);

        // Also update the row's general or active quarter poes list
        const updatedRows = rows.map(r => {
          if (r.id === selectedKpi.id) {
            const currentQ1Poes = r.q1Poes || [];
            return {
              ...r,
              q1Poes: Array.from(new Set([...currentQ1Poes, file.name]))
            };
          }
          return r;
        });

        setRows(updatedRows);
        setSuccess(`Evidence document "${file.name}" uploaded and encrypted into Supabase Cloud Vault.`);
        setTimeout(() => setSuccess(null), 4000);
      };

      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      setError('Failed to upload POE document: ' + err.message);
    } finally {
      setUploadingPoe(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleOpenPoePreview = (file: any) => {
    setPreviewDoc({
      id: file.id,
      name: file.name,
      mimeType: file.fileType || 'application/octet-stream',
      dataUrl: file.fileData,
      uploadedAt: file.uploadedAt || file.date,
      uploadedBy: file.uploadedBy || currentUser.fullName || currentUser.email,
      kpiName: selectedKpi?.kpi,
      quarter: 'General / Current Quarter'
    });
  };

  const handleDeletePoe = async (poeId: string, fileName: string) => {
    if (!selectedKpi) return;
    try {
      const updatedPoes = poes.filter(p => p.id !== poeId);
      await fetch(`/api/tenant/${activeTenantId}/sdbip-poes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poes: updatedPoes })
      });
      setPoes(updatedPoes);
      setSuccess(`Document "${fileName}" removed.`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (e: any) {
      setError('Failed to delete document: ' + e.message);
    }
  };

  const handleSaveDraft = async () => {
    if (!selectedKpi) return;
    setLoading(true);
    try {
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const workflows = r.workflows || {};
          ['q1', 'q2', 'q3', 'q4'].forEach(q => {
            workflows[q] = {
              ...(workflows[q]),
              status: 'draft',
              submittedBy: currentUser.email,
              submittedAt: new Date().toLocaleDateString()
            };
          });
          return {
            ...r,
            q1Actual, q1Variance, q1Corrective,
            q2Actual, q2Variance, q2Corrective,
            q3Actual, q3Variance, q3Corrective,
            q4Actual, q4Variance, q4Corrective,
            poeDesc,
            workflowStatus: (r as any).workflowStatus || 'Draft',
            submitterNotes: submitterNotes,
            workflows
          } as SdbipRow;
        }
        return r;
      });

      const response = await fetch(`/api/tenant/${activeTenantId}/sdbip`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: updatedRows })
      });

      if (!response.ok) throw new Error('Failed to save draft to Supabase');
      
      setRows(updatedRows);
      setSuccess('Draft metrics saved locally and synced with Supabase database!');
      setTimeout(() => setSuccess(null), 4000);
      setSelectedKpi(updatedRows.find(x => x.id === selectedKpi.id) || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWorkflow = async () => {
    if (!selectedKpi) return;
    setLoading(true);
    try {
      const approverTarget = selectedKpi.approver || 'Approver';
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Submitted to Approver',
            user: currentUser.fullName || currentUser.email,
            notes: submitterNotes || `Submitted to Executive Approver (${approverTarget}) through OPMS Submitter dashboard.`
          };

          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(q => {
            workflows[q] = {
              ...(workflows[q]),
              status: 'pending_approval',
              submittedBy: currentUser.fullName || currentUser.email,
              submittedAt: new Date().toLocaleDateString()
            };
          });

          return {
            ...r,
            q1Actual, q1Variance, q1Corrective,
            q2Actual, q2Variance, q2Corrective,
            q3Actual, q3Variance, q3Corrective,
            q4Actual, q4Variance, q4Corrective,
            poeDesc,
            workflowStatus: 'Submitted to Approver',
            submittedBy: currentUser.fullName || currentUser.email,
            submitterNotes: submitterNotes,
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

      if (!response.ok) throw new Error('Failed to submit SDBIP item to Approver');

      // Dispatch real-time notification to specified approver
      await dispatchSdbipNotification(activeTenantId, {
        targetUser: approverTarget,
        senderUser: currentUser.fullName || currentUser.email,
        kpiId: selectedKpi.id,
        refNum: selectedKpi.refNum,
        kpiName: selectedKpi.kpi,
        phase: 'General',
        message: `KPI ${selectedKpi.refNum} submitted for Executive Approval by Submitter ${currentUser.fullName || currentUser.email}.`,
        comment: submitterNotes,
        actionType: 'submitted'
      });

      await loadNotifications();
      
      setRows(updatedRows);
      setSuccess(`SDBIP KPI ${selectedKpi.refNum} successfully submitted to Executive Approver (${approverTarget})!`);
      setTimeout(() => setSuccess(null), 4000);
      setSelectedKpi(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Compute unique KPAs for filtering
  const kpas = Array.from(new Set(rows.map(r => r.kpas).filter(Boolean)));

  const filteredRows = rows.filter(r => {
    const matchesKpa = kpaFilter === 'ALL' || r.kpas === kpaFilter;
    const matchesSearch = searchQuery === '' || 
      (r.refNum && r.refNum.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (r.kpi && r.kpi.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (r.strategicObj && r.strategicObj.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesMine = assignedFilter === 'ALL' || isUserMatch(r.submitter, currentUser);
    return matchesKpa && matchesSearch && matchesMine;
  });

  // Calculate high level stats
  const totalKpis = rows.length;
  const draftCount = rows.filter(r => !(r as any).workflowStatus || (r as any).workflowStatus === 'Draft').length;
  const submittedCount = rows.filter(r => (r as any).workflowStatus === 'Submitted to Approver' || (r as any).workflowStatus === 'Submitted').length;
  const reviewedCount = rows.filter(r => (r as any).workflowStatus === 'Reviewed' || (r as any).workflowStatus === 'Pending Review').length;
  const approvedCount = rows.filter(r => (r as any).workflowStatus === 'Approved').length;
  const returnedCount = rows.filter(r => (r as any).workflowStatus === 'Returned').length;

  const getStatusBadge = (status: string | undefined) => {
    const s = status || 'Draft';
    switch (s) {
      case 'Submitted':
      case 'Submitted to Approver':
        return <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Awaiting Approver</span>;
      case 'Pending Review':
        return <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Awaiting Reviewer</span>;
      case 'Reviewed':
        return <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Awaiting MM Approval</span>;
      case 'Approved':
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Approved & Locked</span>;
      case 'Returned':
        return <span className="bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Returned / Action Required</span>;
      default:
        return <span className="bg-slate-500/20 text-slate-300 border border-slate-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Draft Workspace</span>;
    }
  };

  return (
    <div className="flex flex-col h-full space-y-4 text-white p-2">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-white/10 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Layers className="w-40 h-40" />
        </div>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-indigo-500/30 text-indigo-300 border border-indigo-500/40 text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                OPMS Submitter Station
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[9px] px-2 py-0.5 rounded-full font-semibold">
                Supabase Connected
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-100 font-sans">
              Departmental Scorecard Submission Workspace
            </h1>
            <p className="text-slate-400 text-xs max-w-2xl mt-1">
              Log actual quarterly achievements, attach verifiable Portfolio of Evidence (PoE) documentation, and dispatch to the Performance Management Unit (PMU) for compliance review.
            </p>
          </div>
          <button 
            onClick={() => fetchSDBIPData(false)}
            disabled={loading}
            className="bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/30 rounded-xl px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Data
          </button>
        </div>
      </div>

      {/* High-Level Executive Dashboard Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Total KPIs</span>
          <span className="text-2xl font-black text-white mt-1">{totalKpis}</span>
        </div>
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Draft Workspace</span>
          <span className="text-2xl font-black text-slate-300 mt-1">{draftCount}</span>
        </div>
        <div className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-amber-500 uppercase tracking-wider">Awaiting PMU Review</span>
          <span className="text-2xl font-black text-amber-400 mt-1">{submittedCount}</span>
        </div>
        <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3 flex flex-col justify-between">
          <span className="text-[10px] font-black text-emerald-500 uppercase tracking-wider">Approved & Locked</span>
          <span className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</span>
        </div>
        <div className="bg-rose-950/20 border border-rose-900/30 rounded-xl p-3 flex flex-col justify-between col-span-2 md:col-span-1">
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider">Action Required</span>
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

      {/* Real-time Submitter Workflow Notifications Pop-Up Panel */}
      {(() => {
        const myUnreadNotifs = notifications.filter(n => isUserMatch(n.targetUser, currentUser) && !n.read);
        if (myUnreadNotifs.length === 0) return null;
        return (
          <div className="space-y-2">
            {myUnreadNotifs.map((notif) => {
              const isReturned = notif.actionType === 'returned';
              return (
                <div 
                  key={notif.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all animate-fade-in ${
                    isReturned 
                      ? 'bg-rose-950/60 border-rose-500/40 text-rose-100' 
                      : 'bg-indigo-950/60 border-indigo-500/40 text-indigo-100'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${isReturned ? 'bg-rose-600/30 text-rose-300' : 'bg-indigo-600/30 text-indigo-300'}`}>
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black bg-black/40 px-2 py-0.5 rounded border border-white/10">{notif.refNum}</span>
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isReturned ? 'bg-rose-600/30 text-rose-300 border border-rose-500/30' : 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30'
                        }`}>
                          {isReturned ? 'Returned for Resubmission' : 'Workflow Update'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 text-white">{notif.message}</p>
                      {notif.comment && (
                        <div className="mt-1.5 p-2 bg-black/40 rounded-lg border border-white/5 text-[11px] italic font-sans text-rose-200">
                          <strong>Comments / Required Changes:</strong> "{notif.comment}"
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => {
                        const targetRow = rows.find(r => r.id === notif.kpiId || r.refNum === notif.refNum);
                        if (targetRow) {
                          setSelectedKpi(targetRow);
                        }
                      }}
                      className="px-3 py-1.5 bg-white text-slate-900 hover:bg-slate-100 rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Review & Resend KPI</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const updated = await markSdbipNotificationRead(activeTenantId, notif.id, notifications);
                        setNotifications(updated);
                      }}
                      className="p-1.5 bg-black/30 hover:bg-black/50 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                      title="Dismiss notification"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        );
      })()}

      {/* Split Dashboard Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Side: Scorecard List Pane */}
        <div className={`flex flex-col space-y-3 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 min-h-[500px] ${selectedKpi ? 'lg:col-span-6 xl:col-span-7' : 'lg:col-span-12'}`}>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              Assigned Performance scorecards ({filteredRows.length})
            </h2>

            {/* Smart Inline Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setAssignedFilter('MINE')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${assignedFilter === 'MINE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  My KPIs
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedFilter('ALL')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${assignedFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All KPIs
                </button>
              </div>

              <div className="relative shrink-0 w-36">
                <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter key ref..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-2 py-1.5 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={kpaFilter}
                onChange={(e) => setKpaFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-[11px] text-slate-300 focus:outline-none focus:border-indigo-500"
              >
                <option value="ALL">All KPAs</option>
                {kpas.map(kpa => (
                  <option key={kpa} value={kpa}>{kpa}</option>
                ))}
              </select>
            </div>
          </div>

          {/* List/Table of KPIs */}
          <div className="overflow-auto max-h-[520px] divide-y divide-slate-850">
            {filteredRows.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                <AlertTriangle className="w-8 h-8 opacity-40 mb-2" />
                <p className="text-xs font-bold">No assigned KPIs matching the current filter options.</p>
                <p className="text-[10px] mt-0.5">Please ensure SDBIP top-layer tables have been configured or synchronized.</p>
              </div>
            ) : (
              filteredRows.map(row => {
                const isSelected = selectedKpi?.id === row.id;
                const status = (row as any).workflowStatus || 'Draft';
                return (
                  <div 
                    key={row.id}
                    onClick={() => setSelectedKpi(row)}
                    className={`p-3 transition-all cursor-pointer hover:bg-slate-850/50 flex flex-col space-y-2 border-l-4 ${isSelected ? 'bg-slate-850 border-l-indigo-500' : 'border-l-transparent'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400">
                        <span className="bg-slate-950 px-2 py-0.5 border border-slate-800 text-slate-200 rounded font-bold">
                          {row.refNum}
                        </span>
                        <span className="text-[10px] tracking-wide text-slate-500 truncate max-w-xs">
                          {row.kpas}
                        </span>
                      </div>
                      {getStatusBadge(status)}
                    </div>
                    
                    <p className="text-xs text-slate-200 line-clamp-2 leading-relaxed">
                      <strong>KPI:</strong> {row.kpi}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
                      <span>Annual Target: <strong className="text-indigo-400">{row.annualTarget}</strong></span>
                      <span className="flex items-center gap-1 text-slate-400 font-semibold hover:text-white transition-colors">
                        Enter Achievements <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Execution Detail Submission Desk */}
        {selectedKpi && (
          <div className="lg:col-span-6 xl:col-span-5 bg-slate-900/65 border-2 border-slate-800 rounded-2xl p-5 flex flex-col space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Active Workspace</span>
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest mt-0.5 font-mono">
                  KPI REF: {selectedKpi.refNum}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedKpi(null)}
                className="text-slate-500 hover:text-slate-200 text-xs font-bold font-mono px-2 py-1 rounded hover:bg-slate-800 transition-all cursor-pointer"
              >
                ✕ Close
              </button>
            </div>

            {/* General Info Card */}
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-1.5 text-xs">
              <p className="text-slate-400"><strong>Strategic Objective:</strong> {selectedKpi.strategicObj}</p>
              <p className="text-slate-200"><strong>Assigned Key Performance Indicator:</strong> {selectedKpi.kpi}</p>
              <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] border-t border-slate-900 text-slate-400">
                <span>Unit of Measure: <strong>{selectedKpi.uom || 'N/A'}</strong></span>
                <span>Annual Target: <strong className="text-indigo-400">{selectedKpi.annualTarget}</strong></span>
              </div>
            </div>

            {/* Current workflow state callout */}
            <div className="bg-slate-950 p-3 border border-slate-850 rounded-xl flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-bold uppercase">Workflow Stage:</span>
              {getStatusBadge((selectedKpi as any).workflowStatus)}
            </div>

            {/* Workflow status constraints warning */}
            {((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed') && (
              <div className="bg-emerald-950/20 border border-emerald-900/40 text-emerald-300 text-[11px] p-3 rounded-xl flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  This scorecard has been formally validated by executive authorities and is <strong>locked</strong> against further modifications. Editing is disabled.
                </span>
              </div>
            )}

            {/* Returned warning alert */}
            {(selectedKpi as any).workflowStatus === 'Returned' && (
              <div className="bg-rose-950/30 border border-rose-900/40 text-rose-300 text-[11px] p-3 rounded-xl flex flex-col space-y-1">
                <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>PMU Correction Directive</span>
                </div>
                <p className="text-slate-300 text-[10.5px]">
                  <strong>Review Remarks:</strong> {(selectedKpi as any).reviewerNotes || 'Please inspect details, attach correct PoE and re-submit.'}
                </p>
              </div>
            )}

            {/* Submitter Metrics Entry Forms */}
            <div className="space-y-4 max-h-[360px] overflow-auto pr-1">
              
              <div className="border border-slate-800 rounded-xl overflow-hidden">
                <div className="bg-slate-950 px-3 py-2 text-[11px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  Target Projections vs Achievements
                </div>
                
                <div className="p-3 space-y-3">
                  {/* Q1 Section */}
                  <div className={`p-2.5 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors ${!isQuarterInReportingPeriod('q1') ? 'bg-slate-950/60 border-slate-850 opacity-80' : 'bg-slate-900/80 border-slate-850/60'}`}>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>1st Quarter (Q1) Target: <strong className="text-white">{selectedKpi.q1 || '0'}</strong></span>
                      {!isQuarterInReportingPeriod('q1') ? (
                        <span title={getQuarterLockNotice('q1')} className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-500/80" /> Q1 Locked
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Q1 Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Actual progress</label>
                      <input
                        type="text"
                        value={q1Actual}
                        onChange={(e) => setQ1Actual(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q1') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q1') ? "Locked for this period" : "Log performance..."}
                        title={!isQuarterInReportingPeriod('q1') ? getQuarterLockNotice('q1') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q1') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Variance explanation</label>
                      <input
                        type="text"
                        value={q1Variance}
                        onChange={(e) => setQ1Variance(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q1') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q1') ? "Locked for this period" : "Why targets differ..."}
                        title={!isQuarterInReportingPeriod('q1') ? getQuarterLockNotice('q1') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q1') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Corrective measure</label>
                      <input
                        type="text"
                        value={q1Corrective}
                        onChange={(e) => setQ1Corrective(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q1') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q1') ? "Locked for this period" : "Mitigations for gaps..."}
                        title={!isQuarterInReportingPeriod('q1') ? getQuarterLockNotice('q1') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q1') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                  </div>

                  {/* Q2 Section */}
                  <div className={`p-2.5 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors ${!isQuarterInReportingPeriod('q2') ? 'bg-slate-950/60 border-slate-850 opacity-80' : 'bg-slate-900/80 border-slate-850/60'}`}>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>2nd Quarter (Q2) Target: <strong className="text-white">{selectedKpi.q2 || '0'}</strong></span>
                      {!isQuarterInReportingPeriod('q2') ? (
                        <span title={getQuarterLockNotice('q2')} className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-500/80" /> Q2 Locked
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Q2 Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Actual progress</label>
                      <input
                        type="text"
                        value={q2Actual}
                        onChange={(e) => setQ2Actual(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q2') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q2') ? "Locked for this period" : "Log performance..."}
                        title={!isQuarterInReportingPeriod('q2') ? getQuarterLockNotice('q2') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q2') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Variance explanation</label>
                      <input
                        type="text"
                        value={q2Variance}
                        onChange={(e) => setQ2Variance(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q2') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q2') ? "Locked for this period" : "Why targets differ..."}
                        title={!isQuarterInReportingPeriod('q2') ? getQuarterLockNotice('q2') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q2') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Corrective measure</label>
                      <input
                        type="text"
                        value={q2Corrective}
                        onChange={(e) => setQ2Corrective(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q2') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q2') ? "Locked for this period" : "Mitigations for gaps..."}
                        title={!isQuarterInReportingPeriod('q2') ? getQuarterLockNotice('q2') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q2') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                  </div>

                  {/* Q3 Section */}
                  <div className={`p-2.5 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors ${!isQuarterInReportingPeriod('q3') ? 'bg-slate-950/60 border-slate-850 opacity-80' : 'bg-slate-900/80 border-slate-850/60'}`}>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>3rd Quarter (Q3) Target: <strong className="text-white">{selectedKpi.q3 || '0'}</strong></span>
                      {!isQuarterInReportingPeriod('q3') ? (
                        <span title={getQuarterLockNotice('q3')} className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-500/80" /> Q3 Locked
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Q3 Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Actual progress</label>
                      <input
                        type="text"
                        value={q3Actual}
                        onChange={(e) => setQ3Actual(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q3') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q3') ? "Locked for this period" : "Log performance..."}
                        title={!isQuarterInReportingPeriod('q3') ? getQuarterLockNotice('q3') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q3') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Variance explanation</label>
                      <input
                        type="text"
                        value={q3Variance}
                        onChange={(e) => setQ3Variance(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q3') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q3') ? "Locked for this period" : "Why targets differ..."}
                        title={!isQuarterInReportingPeriod('q3') ? getQuarterLockNotice('q3') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q3') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Corrective measure</label>
                      <input
                        type="text"
                        value={q3Corrective}
                        onChange={(e) => setQ3Corrective(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q3') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q3') ? "Locked for this period" : "Mitigations for gaps..."}
                        title={!isQuarterInReportingPeriod('q3') ? getQuarterLockNotice('q3') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q3') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                  </div>

                  {/* Q4 Section */}
                  <div className={`p-2.5 rounded-lg border grid grid-cols-1 md:grid-cols-2 gap-2 transition-colors ${!isQuarterInReportingPeriod('q4') ? 'bg-slate-950/60 border-slate-850 opacity-80' : 'bg-slate-900/80 border-slate-850/60'}`}>
                    <div className="col-span-2 text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1 flex justify-between items-center">
                      <span>4th Quarter (Q4) Target: <strong className="text-white">{selectedKpi.q4 || '0'}</strong></span>
                      {!isQuarterInReportingPeriod('q4') ? (
                        <span title={getQuarterLockNotice('q4')} className="text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5 text-amber-500/80" /> Q4 Locked
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" /> Q4 Active
                        </span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Actual progress</label>
                      <input
                        type="text"
                        value={q4Actual}
                        onChange={(e) => setQ4Actual(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q4') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q4') ? "Locked for this period" : "Log performance..."}
                        title={!isQuarterInReportingPeriod('q4') ? getQuarterLockNotice('q4') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q4') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Variance explanation</label>
                      <input
                        type="text"
                        value={q4Variance}
                        onChange={(e) => setQ4Variance(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q4') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q4') ? "Locked for this period" : "Why targets differ..."}
                        title={!isQuarterInReportingPeriod('q4') ? getQuarterLockNotice('q4') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q4') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                    <div className="col-span-2 space-y-1">
                      <label className="text-[10px] text-slate-500 font-bold uppercase">Corrective measure</label>
                      <input
                        type="text"
                        value={q4Corrective}
                        onChange={(e) => setQ4Corrective(e.target.value)}
                        disabled={!isQuarterInReportingPeriod('q4') || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                        placeholder={!isQuarterInReportingPeriod('q4') ? "Locked for this period" : "Mitigations for gaps..."}
                        title={!isQuarterInReportingPeriod('q4') ? getQuarterLockNotice('q4') : undefined}
                        className={`w-full border rounded p-1.5 text-xs ${!isQuarterInReportingPeriod('q4') ? 'bg-slate-900/60 border-slate-800 text-slate-500 cursor-not-allowed italic' : 'bg-slate-950 border-slate-800 focus:border-indigo-500 text-white'}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Portfolio of Evidence Detail & File Vault */}
              <div className="space-y-2 bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Verifiable Portfolio of Evidence (PoE)</span>
                  </label>
                  <div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.svg,.txt"
                    />
                    <button
                      type="button"
                      disabled={uploadingPoe || (selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                    >
                      <Upload className="w-3 h-3" />
                      <span>{uploadingPoe ? 'Uploading...' : 'Upload PoE File'}</span>
                    </button>
                  </div>
                </div>

                <textarea
                  value={poeDesc}
                  onChange={(e) => setPoeDesc(e.target.value)}
                  disabled={(selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                  placeholder="Provide brief details on what evidence is available (e.g. 'Attendance Register file, Site Inspection photographs attached')."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-2 text-xs text-white h-16 focus:outline-none resize-none"
                />

                {/* Attached PoE Files for this KPI */}
                {(() => {
                  const relevantPoes = extractKpiPoes(selectedKpi, poes);
                  if (relevantPoes.length === 0) {
                    return (
                      <p className="text-[10px] text-slate-500 italic py-1">
                        No files attached yet. Upload Word, Excel, PowerPoint, PDF or image evidence directly.
                      </p>
                    );
                  }

                  return (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[9px] font-black tracking-wider uppercase text-slate-400">Attached Evidence Files ({relevantPoes.length}):</span>
                      <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pr-1">
                        {relevantPoes.map((p) => {
                          const ext = p.name.split('.').pop()?.toLowerCase();
                          return (
                            <div key={p.id} className="flex items-center justify-between p-2 bg-slate-900 border border-slate-800 rounded-lg text-xs hover:border-slate-700 transition">
                              <div className="flex items-center gap-2 overflow-hidden">
                                {ext === 'xlsx' || ext === 'xls' || ext === 'csv' ? (
                                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : ext === 'pptx' || ext === 'ppt' ? (
                                  <Presentation className="w-4 h-4 text-amber-400 shrink-0" />
                                ) : ext === 'png' || ext === 'jpg' || ext === 'jpeg' || ext === 'webp' || ext === 'svg' ? (
                                  <ImageIcon className="w-4 h-4 text-rose-400 shrink-0" />
                                ) : (
                                  <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                )}
                                <div className="truncate">
                                  <span className="text-white font-medium block truncate text-[11px]">{p.name}</span>
                                  <span className="text-[9px] text-slate-400">{p.quarter} • {p.size || 'Attached'}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                <button
                                  type="button"
                                  onClick={() => handleOpenPoePreview(p)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold flex items-center gap-1 transition cursor-pointer shadow-sm"
                                  title="View document on-screen without downloading"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View PoE</span>
                                </button>
                                {(!((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed')) && (
                                  <button
                                    type="button"
                                    onClick={() => handleDeletePoe(p.id, p.name)}
                                    className="p-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded transition cursor-pointer"
                                    title="Delete document"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Feedback History Cards from Approver, Reviewer, and Audit */}
              {((selectedKpi as any).approverNotes || (selectedKpi as any).reviewerNotes || (selectedKpi as any).auditNotes) && (
                <div className="space-y-2">
                  {(selectedKpi as any).approverNotes && (
                    <div className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold uppercase text-[10px] font-mono">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>Executive Approver Directive / Comments ({selectedKpi.approver || 'Approver'}):</span>
                      </div>
                      <p className="text-amber-200 italic font-medium leading-relaxed bg-black/30 p-2 rounded border border-amber-900/40">
                        "{(selectedKpi as any).approverNotes}"
                      </p>
                    </div>
                  )}

                  {(selectedKpi as any).reviewerNotes && (
                    <div className="bg-indigo-950/40 border border-indigo-800/60 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-400 font-bold uppercase text-[10px] font-mono">
                        <Search className="w-3.5 h-3.5" />
                        <span>PMU Reviewer Feedback ({selectedKpi.reviewer || 'Reviewer'}):</span>
                      </div>
                      <p className="text-indigo-200 italic font-medium leading-relaxed bg-black/30 p-2 rounded border border-indigo-900/40">
                        "{(selectedKpi as any).reviewerNotes}"
                      </p>
                    </div>
                  )}

                  {(selectedKpi as any).auditNotes && (
                    <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold uppercase text-[10px] font-mono">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Internal Audit Findings / Queries ({selectedKpi.internalAudit || 'Internal Audit Desk'}):</span>
                      </div>
                      <p className="text-rose-200 italic font-medium leading-relaxed bg-black/30 p-2 rounded border border-rose-900/40">
                        "{(selectedKpi as any).auditNotes}"
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Submitter specific comments */}
              <div className="space-y-1 bg-slate-950/40 border border-slate-800 rounded-xl p-3">
                <label className="text-[10px] font-black uppercase text-slate-400">Submitter Workflow Remarks & Explanation</label>
                <textarea
                  value={submitterNotes}
                  onChange={(e) => setSubmitterNotes(e.target.value)}
                  disabled={(selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed'}
                  placeholder="Enter context, explanations of variances, or responses to feedback before pushing to the Executive Approver..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-2 text-xs text-white h-16 focus:outline-none resize-none"
                />
              </div>

              {/* Workflow History Logs */}
              {(selectedKpi as any).workflowHistory && (selectedKpi as any).workflowHistory.length > 0 && (
                <div className="border border-slate-800 rounded-xl p-3 bg-slate-950/20 space-y-2">
                  <div className="text-[10px] font-black text-slate-500 uppercase tracking-wider flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Audit Pipeline Logs</span>
                  </div>
                  <div className="space-y-2 font-mono text-[10px] divide-y divide-slate-850/60 max-h-48 overflow-y-auto pr-1">
                    {((selectedKpi as any).workflowHistory as any[]).map((h, i) => (
                      <div key={i} className="pt-2 first:pt-0">
                        <div className="flex items-center justify-between font-bold">
                          <span className="text-indigo-400">{h.action}</span>
                          <span className="text-slate-500">{new Date(h.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-slate-400 mt-0.5 font-sans">User: {h.user}</p>
                        {h.notes && <p className="text-slate-300 bg-slate-950 px-2 py-1 rounded mt-1 font-sans italic text-[10.5px]">Notes: {h.notes}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

            {/* Submitter Action Controls */}
            {(!((selectedKpi as any).workflowStatus === 'Approved' || (selectedKpi as any).workflowStatus === 'Reviewed')) && (
              <div className="space-y-2 pt-3 border-t border-slate-850">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>Designated Approver: <strong className="text-amber-400 font-bold">{selectedKpi.approver || 'Not assigned'}</strong></span>
                  <span>Reviewer: <strong className="text-indigo-400 font-bold">{selectedKpi.reviewer || 'Not assigned'}</strong></span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleSaveDraft}
                    disabled={loading}
                    className="w-full bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800 rounded-xl py-3 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    Save Draft
                  </button>
                  <button
                    onClick={handleSubmitWorkflow}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-600 via-amber-500 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-xl py-3 font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
                    title={`Push to Approver (${selectedKpi.approver || 'Executive Approver'})`}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Push to Approver</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {previewDoc && (
        <OfficeDocumentViewer
          document={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
