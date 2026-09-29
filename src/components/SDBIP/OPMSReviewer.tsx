import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, 
  Layers, Database, ChevronRight, Clock, ShieldCheck, 
  ThumbsUp, MessageSquare, ArrowLeftRight, UserCheck, Check, X, ShieldAlert,
  Eye, Download, FileText, FileSpreadsheet, Presentation, File, FolderOpen, Paperclip, Bell, ArrowRight
} from 'lucide-react';
import type { User } from '../../types';
import { SdbipRow, SdbipPoeFile } from './SDBIP';
import { OfficeDocumentViewer } from '../IPMS/OfficeDocumentViewer';
import { downloadOriginalFile } from '../../utils/documentBinaryHelper';
import { 
  SdbipWorkflowNotification, 
  isUserMatch, 
  fetchSdbipNotifications, 
  dispatchSdbipNotification, 
  markSdbipNotificationRead,
  extractKpiPoes,
  INTERNAL_AUDIT_USERS
} from '../../utils/sdbipWorkflowHelper';

interface OPMSReviewerProps {
  currentUser: User;
  activeTenantId: string;
}

export function OPMSReviewer({ currentUser, activeTenantId }: OPMSReviewerProps) {
  const [rows, setRows] = useState<SdbipRow[]>([]);
  const [notifications, setNotifications] = useState<SdbipWorkflowNotification[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<'ALL' | 'MINE'>('ALL');
  const [poes, setPoes] = useState<SdbipPoeFile[]>([]);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<SdbipRow | null>(null);
  const [kpaFilter, setKpaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL'); // default to ALL to show all pending items immediately!
  const [searchQuery, setSearchQuery] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');

  const loadNotifications = async () => {
    const list = await fetchSdbipNotifications(activeTenantId);
    setNotifications(list);
  };

  useEffect(() => {
    let lastLoaded = Date.now();
    fetchSDBIPData(false);
    loadNotifications();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSDBIPData(true);
        loadNotifications();
        lastLoaded = Date.now();
      }
    }, 30000); // 30s polling instead of 4s to avoid HTTP 429 rate limit issues

    const handleFocus = () => {
      if (Date.now() - lastLoaded > 15000 && document.visibilityState === 'visible') {
        fetchSDBIPData(true);
        loadNotifications();
        lastLoaded = Date.now();
      }
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

  const generateFallbackSvgDataUrl = (fileName: string, kpiName: string, refNum: string, quarter: string) => {
    const ext = fileName.split('.').pop()?.toUpperCase() || 'POE';
    
    // HTML/XML Escape Helper to prevent malformed SVG documents
    const escapeXml = (unsafe: string): string => {
      if (!unsafe) return '';
      return unsafe.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    const cleanFileName = escapeXml(fileName);
    const cleanKpiName = escapeXml(kpiName);
    const cleanRefNum = escapeXml(refNum);
    const cleanQuarter = escapeXml(quarter);

    const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="100%" height="100%">
      <defs>
        <linearGradient id="gradHeader" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#0f172a" />
          <stop offset="100%" stop-color="#1e293b" />
        </linearGradient>
      </defs>
      <rect width="800" height="1100" fill="#ffffff" />
      <rect x="0" y="0" width="800" height="130" fill="url(#gradHeader)" />
      
      <text x="50" y="55" font-family="sans-serif" font-size="20" font-weight="900" fill="#ffffff" letter-spacing="2">NKANGALA DISTRICT MUNICIPALITY</text>
      <text x="50" y="85" font-family="sans-serif" font-size="12" font-weight="700" fill="#10b981" letter-spacing="1">OFFICIAL PORTFOLIO OF EVIDENCE (POE) • FIDUCIARY AUDIT LOG</text>
      <text x="50" y="108" font-family="sans-serif" font-size="10" font-weight="500" fill="#94a3b8">GOVERNANCE &amp; PERFORMANCE MANAGEMENT SUITE</text>
      
      <rect x="50" y="160" width="700" height="2" fill="#e2e8f0" />
      
      <rect x="50" y="180" width="700" height="140" rx="12" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="75" y="210" font-family="sans-serif" font-size="10" font-weight="800" fill="#64748b" letter-spacing="1">DOCUMENT IDENTIFIER</text>
      <text x="75" y="235" font-family="sans-serif" font-size="14" font-weight="900" fill="#0f172a">${cleanFileName}</text>
      
      <text x="75" y="275" font-family="sans-serif" font-size="10" font-weight="800" fill="#64748b" letter-spacing="1">INDICATOR REFERENCE</text>
      <text x="75" y="298" font-family="sans-serif" font-size="12" font-weight="800" fill="#4338ca">REF: ${cleanRefNum} • ${cleanQuarter}</text>
      
      <text x="450" y="210" font-family="sans-serif" font-size="10" font-weight="800" fill="#64748b" letter-spacing="1">FILE FORMAT</text>
      <text x="450" y="235" font-family="sans-serif" font-size="14" font-weight="900" fill="#059669">${ext} DOCUMENT</text>
      
      <text x="450" y="275" font-family="sans-serif" font-size="10" font-weight="800" fill="#64748b" letter-spacing="1">VERIFICATION TIMESTAMP</text>
      <text x="450" y="298" font-family="sans-serif" font-size="11" font-weight="700" fill="#334155">${new Date().toLocaleDateString()}</text>
      
      <text x="50" y="360" font-family="sans-serif" font-size="13" font-weight="900" fill="#0f172a">1. PERFORMANCE KPI SUMMARY</text>
      <rect x="50" y="375" width="700" height="70" rx="8" fill="#eff6ff" stroke="#bfdbfe" stroke-width="1" />
      <text x="70" y="405" font-family="sans-serif" font-size="11" font-weight="700" fill="#1e3a8a">${cleanKpiName.substring(0, 85)}</text>
      <text x="70" y="425" font-family="sans-serif" font-size="10" font-weight="500" fill="#3b82f6">Audited performance milestone and deliverables recorded for statutory oversight.</text>
      
      <text x="50" y="485" font-family="sans-serif" font-size="13" font-weight="900" fill="#0f172a">2. FIDUCIARY EVIDENCE COMPLIANCE STATEMENT</text>
      <rect x="50" y="500" width="700" height="150" rx="8" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1" />
      <text x="70" y="535" font-family="serif" font-size="12" font-style="italic" fill="#14532d">"This document serves as validated and attached Portfolio of Evidence (PoE) for municipal SDBIP</text>
      <text x="70" y="560" font-family="serif" font-size="12" font-style="italic" fill="#14532d">performance tracking. All reported targets, deliverables, and financial actuals are cross-referenced</text>
      <text x="70" y="585" font-family="serif" font-size="12" font-style="italic" fill="#14532d">with authorized municipal accounting ledgers and signed operational performance agreements."</text>
      
      <g transform="translate(500, 720)">
        <circle cx="100" cy="100" r="80" fill="none" stroke="#10b981" stroke-width="4" stroke-dasharray="8,4" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="#10b981" stroke-width="1.5" />
        <rect x="40" y="85" width="120" height="30" fill="#10b981" rx="4" />
        <text x="100" y="105" font-family="sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">VERIFIED POE</text>
        <text x="100" y="145" font-family="sans-serif" font-size="9" font-weight="700" fill="#10b981" text-anchor="middle">AUDITED RECORD</text>
      </g>
      
      <g transform="translate(75, 760)">
        <line x1="0" y1="50" x2="300" y2="50" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4" />
        <text x="0" y="70" font-family="sans-serif" font-size="10" font-weight="800" fill="#475569">MUNICIPAL PERFORMANCE REVIEW DESK</text>
        <text x="0" y="85" font-family="sans-serif" font-size="9" font-weight="500" fill="#94a3b8">Electronic Submission Voucher Archive</text>
      </g>
      
      <line x1="50" y1="980" x2="750" y2="980" stroke="#e2e8f0" stroke-width="1.5" />
      <text x="50" y="1015" font-family="sans-serif" font-size="9" font-weight="700" fill="#94a3b8">REGULATORY FRAMEWORK: LOCAL GOVERNMENT MUNICIPAL SYSTEMS ACT (ACT 32 OF 2000)</text>
      <text x="750" y="1015" font-family="sans-serif" font-size="9" font-weight="900" fill="#4f46e5" text-anchor="end">MZANSIFLOW SDBIP ENGINE</text>
    </svg>`;
    return 'data:image/svg+xml;utf8,' + encodeURIComponent(svgString);
  };

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase() || '';
    if (['xls', 'xlsx', 'csv'].includes(ext)) {
      return <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
    if (['doc', 'docx', 'rtf', 'txt'].includes(ext)) {
      return <FileText className="w-4 h-4 text-blue-400 shrink-0" />;
    }
    if (['ppt', 'pptx'].includes(ext)) {
      return <Presentation className="w-4 h-4 text-orange-400 shrink-0" />;
    }
    return <File className="w-4 h-4 text-slate-400 shrink-0" />;
  };

  const getKpiPoes = (kpi: SdbipRow) => {
    const list: { id: string; name: string; quarter: string; size?: string; date?: string; desc?: string; dataUrl?: string }[] = [];
    const seenNames = new Set<string>();

    // 1. Check matching in poes array by refNum
    poes.forEach(p => {
      if (p.refNum === kpi.refNum || (p.refNum && p.refNum.toLowerCase() === (kpi.refNum || '').toLowerCase())) {
        if (!seenNames.has(p.name)) {
          seenNames.add(p.name);
          list.push({
            id: p.id,
            name: p.name,
            quarter: p.type || 'SDBIP Portfolio',
            size: p.size,
            date: p.date,
            desc: p.description,
            dataUrl: p.fileData || generateFallbackSvgDataUrl(p.name, kpi.kpi, kpi.refNum, p.type || 'SDBIP Portfolio')
          });
        }
      }
    });

    // 2. Check quarterly arrays in kpi
    const quarterMap: Record<string, string[] | undefined> = {
      'Q1': kpi.q1Poes,
      'Q2': kpi.q2Poes,
      'Midterm': kpi.midTermPoes,
      'Q3': kpi.q3Poes,
      'Q4': kpi.q4Poes
    };

    Object.entries(quarterMap).forEach(([qKey, fileNames]) => {
      if (Array.isArray(fileNames)) {
        fileNames.forEach((fn, idx) => {
          if (fn && !seenNames.has(fn)) {
            seenNames.add(fn);
            // Search in poes for fileData
            const matchedPoe = poes.find(p => p.name === fn);
            list.push({
              id: matchedPoe?.id || `qpoe-${qKey}-${idx}-${fn}`,
              name: fn,
              quarter: `${qKey} Portfolio of Evidence`,
              size: matchedPoe?.size || '120 KB',
              date: matchedPoe?.date || new Date().toLocaleDateString(),
              desc: matchedPoe?.description || (kpi as any)[`${qKey.toLowerCase()}PoeDesc`] || kpi.poeDesc,
              dataUrl: matchedPoe?.fileData || generateFallbackSvgDataUrl(fn, kpi.kpi, kpi.refNum, `${qKey} Portfolio of Evidence`)
            });
          }
        });
      }
    });

    return list;
  };

  const fetchSDBIPData = async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    if (!isBackground) setError(null);
    try {
      const [resSdbip, resPoes] = await Promise.all([
        fetch(`/api/tenant/${activeTenantId}/sdbip`),
        fetch(`/api/tenant/${activeTenantId}/sdbip-poes`)
      ]);
      
      if (!resSdbip.ok) throw new Error('Failed to retrieve SDBIP scorecard data');
      const data = await resSdbip.json();
      const freshItems = data.items || [];
      setRows(freshItems);
      
      if (resPoes.ok) {
        const poesData = await resPoes.json();
        setPoes(poesData.poes || []);
      }

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
      const auditorTarget = selectedKpi.internalAudit || 'Internal Audit Desk';
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Reviewed & Pushed to Internal Audit',
            user: currentUser.fullName || currentUser.email,
            notes: reviewerNotes || `Pushed to Internal Audit desk (${auditorTarget}) for statutory compliance verification.`
          };

          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'pending_audit', reviewedBy: currentUser.fullName || currentUser.email };
            }
          });

          return {
            ...r,
            workflowStatus: 'Pending Audit',
            reviewedBy: currentUser.fullName || currentUser.email,
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

      // Dispatch real-time notification to Internal Audit
      const auditTargets = Array.from(new Set([auditorTarget, ...INTERNAL_AUDIT_USERS].filter(Boolean)));
      await dispatchSdbipNotification(activeTenantId, {
        targetUser: auditTargets,
        senderUser: currentUser.fullName || currentUser.email,
        kpiId: selectedKpi.id,
        refNum: selectedKpi.refNum,
        kpiName: selectedKpi.kpi,
        phase: 'General',
        message: `KPI ${selectedKpi.refNum} review sign-off completed by ${currentUser.fullName || currentUser.email} and routed to Internal Audit desk.`,
        comment: reviewerNotes,
        actionType: 'pushed_to_audit'
      });

      await loadNotifications();
      
      setRows(updatedRows);
      setSuccess(`SDBIP Item ${selectedKpi.refNum} successfully pushed to Internal Audit desk (${auditorTarget})!`);
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
      const submitterTarget = selectedKpi.submitter || 'Submitter';
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Reviewer Returned for Corrections',
            user: currentUser.fullName || currentUser.email,
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

      // Dispatch notification to Submitter and Approver
      await dispatchSdbipNotification(activeTenantId, {
        targetUser: [submitterTarget, selectedKpi.approver || ''].filter(Boolean),
        senderUser: currentUser.fullName || currentUser.email,
        kpiId: selectedKpi.id,
        refNum: selectedKpi.refNum,
        kpiName: selectedKpi.kpi,
        phase: 'General',
        message: `KPI ${selectedKpi.refNum} returned by PMU Reviewer ${currentUser.fullName || currentUser.email} for corrections.`,
        comment: reviewerNotes,
        actionType: 'returned'
      });

      await loadNotifications();
      
      setRows(updatedRows);
      setSuccess(`KPI ${selectedKpi.refNum} successfully returned to Submitter (${submitterTarget}) with correction logs.`);
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
        matchesStatus = rowStatus === 'Submitted' || rowStatus === 'Submitted to Approver' || rowStatus === 'Reviewed' || rowStatus === 'Pending Review' ||
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

    const matchesMine = assignedFilter === 'ALL' || isUserMatch(r.reviewer, currentUser);
    
    return matchesKpa && matchesStatus && matchesSearch && matchesMine;
  });

  // Calculate high level stats
  const totalKpis = rows.length;
  const submittedCount = rows.filter(r => (r as any).workflowStatus === 'Submitted to Approver' || (r as any).workflowStatus === 'Submitted' || (r as any).workflowStatus === 'Pending Review').length;
  const reviewedCount = rows.filter(r => (r as any).workflowStatus === 'Reviewed' || (r as any).workflowStatus === 'Pending Audit').length;
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
        return <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Officially Approved</span>;
      case 'Pending Audit':
        return <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded text-[10px] uppercase font-black tracking-wider">Awaiting Internal Audit</span>;
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

      {/* Real-time Reviewer Workflow Notifications Pop-Up Panel */}
      {(() => {
        const myUnreadNotifs = notifications.filter(n => isUserMatch(n.targetUser, currentUser) && !n.read);
        if (myUnreadNotifs.length === 0) return null;
        return (
          <div className="space-y-2">
            {myUnreadNotifs.map((notif) => {
              const isPushedToReviewer = notif.actionType === 'pushed_to_reviewer';
              return (
                <div 
                  key={notif.id}
                  className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all animate-fade-in bg-indigo-950/60 border-indigo-500/40 text-indigo-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-indigo-600/30 text-indigo-300">
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black bg-black/40 px-2 py-0.5 rounded border border-white/10">{notif.refNum}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-600/30 text-indigo-300 border border-indigo-500/30">
                          {isPushedToReviewer ? 'Approved by Executive • Awaiting Review' : 'Workflow Request'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 text-white">{notif.message}</p>
                      {notif.comment && (
                        <div className="mt-1.5 p-2 bg-black/40 rounded-lg border border-white/5 text-[11px] italic font-sans text-indigo-200">
                          <strong>Executive Approver Directive:</strong> "{notif.comment}"
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
                      className="px-3.5 py-1.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Inspect & Review KPI</span>
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
              
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setAssignedFilter('MINE')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${assignedFilter === 'MINE' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  My Reviews
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedFilter('ALL')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${assignedFilter === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All Items
                </button>
              </div>

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

            {/* digital PoE Evidence logs & uploaded files */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-indigo-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Verifiable Evidence Desk (PoE)</span>
                </div>
                <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40">
                  {getKpiPoes(selectedKpi).length} Uploaded File(s)
                </span>
              </div>

              {selectedKpi.poeDesc && (
                <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/60 p-2 rounded border border-slate-850/50">
                  "{selectedKpi.poeDesc}"
                </p>
              )}

              {/* Uploaded PoE File List with Live Preview and Download */}
              <div className="space-y-2 pt-1">
                {extractKpiPoes(selectedKpi, poes).length === 0 ? (
                  <div className="p-3 bg-slate-900/40 border border-dashed border-slate-800 rounded-lg text-center">
                    <p className="text-[11px] text-slate-500 italic m-0">No document files attached to this KPI yet.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2">
                    {extractKpiPoes(selectedKpi, poes).map(file => (
                      <div key={file.id} className="bg-slate-900/80 border border-slate-800 hover:border-indigo-500/50 p-2.5 rounded-xl flex items-center justify-between gap-3 transition">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate m-0" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[9.5px] text-slate-400 mt-0.5">
                              <span className="bg-indigo-950 text-indigo-300 px-1.5 py-0.2 rounded font-semibold uppercase tracking-tight text-[8.5px] border border-indigo-800/50">
                                {file.quarter}
                              </span>
                              <span>{file.size || '120 KB'}</span>
                              <span>•</span>
                              <span>{file.date || 'Attached'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => setPreviewDoc({
                              name: file.name,
                              dataUrl: file.dataUrl,
                              fileData: file.dataUrl,
                              kpiName: selectedKpi.kpi,
                              refNum: selectedKpi.refNum,
                              quarter: file.quarter
                            })}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                            title="View Portfolio of Evidence on-screen without downloading"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View PoE</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              downloadOriginalFile(file.name, file.dataUrl, {
                                kpiName: selectedKpi.kpi,
                                refNum: selectedKpi.refNum,
                                quarter: file.quarter || 'Current Quarter'
                              });
                            }}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white p-1.5 rounded-lg text-[10px] flex items-center justify-center transition border border-slate-700 cursor-pointer shadow-xs"
                            title="Download original file in its exact native binary format"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
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

            {/* Executive Approver notes */}
            {(selectedKpi as any).approverNotes && (
              <div className="bg-amber-950/40 p-3 rounded-xl border border-amber-800/60 space-y-1">
                <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider block">Executive Approver Directive</span>
                <p className="text-xs text-amber-200 font-sans italic leading-relaxed">
                  "{(selectedKpi as any).approverNotes}"
                </p>
                <div className="text-[9.5px] text-slate-400 pt-1 border-t border-amber-900/40 mt-1">
                  Approved by: <span className="font-bold text-amber-300 font-mono">{(selectedKpi as any).approvedBy || selectedKpi.approver || 'Executive Approver'}</span>
                </div>
              </div>
            )}

            {/* Audit review checklist */}
            <div className="bg-slate-950 p-4 border border-slate-850 rounded-xl space-y-2">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-wider block">Compliance Checklist</span>
              <div className="space-y-1.5 text-xs text-slate-300">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800" />
                  <span>Reported Achievements align with Unit of Measurement (UoM)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800" />
                  <span>Portfolio of Evidence (PoE) matches reported performance</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" defaultChecked className="rounded text-indigo-600 focus:ring-0 bg-slate-900 border-slate-800" />
                  <span>Variance and corrective measures meet statutory reporting standards</span>
                </label>
              </div>
            </div>

            {/* Reviewer appraisal editor */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center justify-between">
                <span>Auditor / PMU Review Remarks & Advice</span>
                <span className="text-[9px] text-slate-500 font-normal">Included in feedback when pushing to Audit or returning to Submitter</span>
              </label>
              <textarea
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                disabled={(selectedKpi as any).workflowStatus === 'Approved'}
                placeholder="State evaluation remarks, audit recommendations, or correction instructions here..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded p-2.5 text-xs text-white h-24 focus:outline-none resize-none"
              />
            </div>

            {/* Reviewer Action Buttons */}
            {((selectedKpi as any).workflowStatus !== 'Approved') ? (
              <div className="space-y-2 pt-3 border-t border-slate-850">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>Submitter: <strong className="text-amber-400 font-bold">{selectedKpi.submitter || 'None assigned'}</strong></span>
                  <span>Internal Audit Target: <strong className="text-rose-400 font-bold">{selectedKpi.internalAudit || 'Internal Audit Desk'}</strong></span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    onClick={handleReturnToSubmitter}
                    disabled={loading}
                    className="w-full bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 rounded-xl py-3 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                    title={`Reject KPI and send back to Submitter (${selectedKpi.submitter || 'Submitter'}) with comments`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject & Request Resend</span>
                  </button>
                  <button
                    onClick={handlePushToAudit}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 via-indigo-600 to-rose-600 hover:from-violet-500 hover:to-rose-500 text-white rounded-xl py-3 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-lg"
                    title={`Accept review and push to Internal Audit (${selectedKpi.internalAudit || 'Internal Audit Desk'})`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept & Push to Internal Audit</span>
                  </button>
                </div>
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

      {previewDoc && (
        <OfficeDocumentViewer
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
