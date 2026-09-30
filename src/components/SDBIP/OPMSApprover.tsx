import React, { useState, useEffect } from 'react';
import { 
  Search, CheckCircle, AlertTriangle, AlertCircle, RefreshCw, 
  Layers, Database, ChevronRight, Clock, ShieldCheck, 
  ThumbsUp, MessageSquare, ArrowLeftRight, UserCheck, Check, X, ShieldAlert, Award, FileSpreadsheet,
  Eye, Download, FileText, Presentation, File, FolderOpen, Paperclip, Bell, ArrowRight
} from 'lucide-react';
import type { User } from '../../types';
import { SdbipRow, SdbipPoeFile } from './SDBIP';
import { OfficeDocumentViewer } from '../IPMS/OfficeDocumentViewer';
import { downloadOriginalFile, viewOriginalFile } from '../../utils/documentBinaryHelper';
import { 
  SdbipWorkflowNotification, 
  isUserMatch, 
  fetchSdbipNotifications, 
  dispatchSdbipNotification, 
  markSdbipNotificationRead,
  extractKpiPoes,
  PMS_TEAM_REVIEWERS
} from '../../utils/sdbipWorkflowHelper';
import { calcOpmsVariance } from '../../utils/varianceCalculator';

interface OPMSApproverProps {
  currentUser: User;
  activeTenantId: string;
}

export function OPMSApprover({ currentUser, activeTenantId }: OPMSApproverProps) {
  const [rows, setRows] = useState<SdbipRow[]>([]);
  const [notifications, setNotifications] = useState<SdbipWorkflowNotification[]>([]);
  const [assignedFilter, setAssignedFilter] = useState<'ALL' | 'MINE'>('ALL');
  const [poes, setPoes] = useState<SdbipPoeFile[]>([]);
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedKpi, setSelectedKpi] = useState<SdbipRow | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL'); // default to ALL to show all pending items immediately!
  const [searchQuery, setSearchQuery] = useState('');
  const [approverNotes, setApproverNotes] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);

  const calcVar = (target: string | undefined, actual: string | undefined) => {
    return calcOpmsVariance(target, actual, selectedKpi?.uom);
  };

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
      setApproverNotes((selectedKpi as any).approverNotes || '');
    } else {
      setApproverNotes('');
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
      <text x="50" y="108" font-family="sans-serif" font-size="10" font-weight="500" fill="#94a3b8">EXECUTIVE APPROVAL &amp; OVERSIGHT PORTAL</text>
      
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
        <text x="100" y="105" font-family="sans-serif" font-size="14" font-weight="900" fill="#ffffff" text-anchor="middle">EXECUTIVE APPROVED</text>
        <text x="100" y="145" font-family="sans-serif" font-size="9" font-weight="700" fill="#10b981" text-anchor="middle">SEALED EVIDENCE</text>
      </g>
      
      <g transform="translate(75, 760)">
        <line x1="0" y1="50" x2="300" y2="50" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,4" />
        <text x="0" y="70" font-family="sans-serif" font-size="10" font-weight="800" fill="#475569">EXECUTIVE MAYORAL &amp; MUNICIPAL MANAGER OFFICE</text>
        <text x="0" y="85" font-family="sans-serif" font-size="9" font-weight="500" fill="#94a3b8">Statutory Top Layer Evidence Filing</text>
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

          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'approved', approvedBy: currentUser.email };
            }
          });

          return {
            ...r,
            workflowStatus: 'Approved',
            approvedBy: currentUser.email,
            approverNotes: approverNotes,
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

  const handlePushToReviewer = async () => {
    if (!selectedKpi) return;
    setLoading(true);
    try {
      const reviewerTarget = selectedKpi.reviewer || 'Reviewer';
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Approved & Pushed to Reviewer',
            user: currentUser.fullName || currentUser.email,
            notes: approverNotes || `Approved by Executive Approver and routed to Reviewer (${reviewerTarget}).`
          };

          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'pending_review', approvedBy: currentUser.fullName || currentUser.email };
            }
          });

          return {
            ...r,
            workflowStatus: 'Pending Review',
            approvedBy: currentUser.fullName || currentUser.email,
            approverNotes: approverNotes,
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

      if (!response.ok) throw new Error('Failed to push item to Reviewer');

      // Dispatch real-time notification to the specified Reviewer & PMS Team members
      const reviewerTargets = Array.from(new Set([reviewerTarget, ...PMS_TEAM_REVIEWERS].filter(Boolean)));
      await dispatchSdbipNotification(activeTenantId, {
        targetUser: reviewerTargets,
        senderUser: currentUser.fullName || currentUser.email,
        kpiId: selectedKpi.id,
        refNum: selectedKpi.refNum,
        kpiName: selectedKpi.kpi,
        phase: 'General',
        message: `KPI ${selectedKpi.refNum} approved by Executive Approver ${currentUser.fullName || currentUser.email} and routed to PMS Team for Review sign-off.`,
        comment: approverNotes,
        actionType: 'pushed_to_reviewer'
      });

      await loadNotifications();
      
      setRows(updatedRows);
      setSuccess(`SDBIP Item ${selectedKpi.refNum} successfully approved and pushed to Reviewer (${reviewerTarget})!`);
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
      const submitterTarget = selectedKpi.submitter || 'Submitter';
      const updatedRows = rows.map(r => {
        if (r.id === selectedKpi.id) {
          const currentHistory = (r as any).workflowHistory || [];
          const newHistoryItem = {
            date: new Date().toISOString(),
            action: 'Rejected & Returned to Submitter',
            user: currentUser.fullName || currentUser.email,
            notes: approverNotes
          };

          const workflows = r.workflows || {};
          ['q1', 'q2', 'midTerm', 'q3', 'q4', 'annual'].forEach(ph => {
            if (workflows[ph]) {
              workflows[ph] = { ...workflows[ph], status: 'draft' };
            }
          });

          return {
            ...r,
            workflowStatus: 'Returned', // return back to submitter with feedback
            approverNotes: approverNotes,
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

      if (!response.ok) throw new Error('Failed to dispatch rejection directive');

      // Dispatch real-time notification to the specified Submitter
      await dispatchSdbipNotification(activeTenantId, {
        targetUser: submitterTarget,
        senderUser: currentUser.fullName || currentUser.email,
        kpiId: selectedKpi.id,
        refNum: selectedKpi.refNum,
        kpiName: selectedKpi.kpi,
        phase: 'General',
        message: `KPI ${selectedKpi.refNum} returned by Executive Approver ${currentUser.fullName || currentUser.email} for corrections and resubmission.`,
        comment: approverNotes,
        actionType: 'returned'
      });

      await loadNotifications();
      
      setRows(updatedRows);
      setSuccess(`KPI ${selectedKpi.refNum} rejected and returned to Submitter (${submitterTarget}) with correction instructions.`);
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
      if (statusFilter === 'Reviewed' || statusFilter === 'Submitted') {
        matchesStatus = rowStatus === 'Reviewed' || rowStatus === 'Submitted' || rowStatus === 'Submitted to Approver' || rowStatus === 'Pending Approval' ||
          r.workflows?.q1?.status === 'pending_approval' || r.workflows?.q2?.status === 'pending_approval' ||
          r.workflows?.q3?.status === 'pending_approval' || r.workflows?.q4?.status === 'pending_approval' ||
          r.workflows?.q1?.status === 'pending_review' || r.workflows?.q2?.status === 'pending_review';
      } else {
        matchesStatus = rowStatus === statusFilter;
      }
    }

    const matchesSearch = searchQuery === '' || 
      (r.refNum && r.refNum.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (r.kpi && r.kpi.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMine = assignedFilter === 'ALL' || isUserMatch(r.approver, currentUser);
    
    return matchesStatus && matchesSearch && matchesMine;
  });

  // Calculate high level stats
  const totalKpis = rows.length;
  const submittedCount = rows.filter(r => (r as any).workflowStatus === 'Submitted to Approver' || (r as any).workflowStatus === 'Submitted').length;
  const reviewedCount = rows.filter(r => (r as any).workflowStatus === 'Reviewed' || (r as any).workflowStatus === 'Pending Review').length;
  const approvedCount = rows.filter(r => (r as any).workflowStatus === 'Approved').length;

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
              onClick={() => fetchSDBIPData(false)}
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

      {/* Real-time Approver Workflow Notifications Pop-Up Panel */}
      {(() => {
        const myUnreadNotifs = notifications.filter(n => isUserMatch(n.targetUser, currentUser) && !n.read);
        if (myUnreadNotifs.length === 0) return null;
        return (
          <div className="space-y-2">
            {myUnreadNotifs.map((notif) => {
              const isSubmission = notif.actionType === 'submitted';
              return (
                <div 
                  key={notif.id}
                  className="p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg transition-all animate-fade-in bg-amber-950/60 border-amber-500/40 text-amber-100"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg shrink-0 mt-0.5 bg-amber-600/30 text-amber-300">
                      <Bell className="w-5 h-5 animate-bounce" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-black bg-black/40 px-2 py-0.5 rounded border border-white/10">{notif.refNum}</span>
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-600/30 text-amber-300 border border-amber-500/30">
                          {isSubmission ? 'Awaiting Executive Approval' : 'Workflow Request'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-xs font-bold mt-1 text-white">{notif.message}</p>
                      {notif.comment && (
                        <div className="mt-1.5 p-2 bg-black/40 rounded-lg border border-white/5 text-[11px] italic font-sans text-amber-200">
                          <strong>Submitter Note:</strong> "{notif.comment}"
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
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-black uppercase tracking-wider transition cursor-pointer shadow-md flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                      <span>Review & Action KPI</span>
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
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-lg border border-slate-800 bg-slate-950 p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setAssignedFilter('MINE')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${assignedFilter === 'MINE' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  My Approvals
                </button>
                <button
                  type="button"
                  onClick={() => setAssignedFilter('ALL')}
                  className={`px-2 py-1 rounded transition cursor-pointer ${assignedFilter === 'ALL' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  All Items
                </button>
              </div>

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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-900 text-slate-350">
                {selectedKpi.q1Actual && (
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850/50">
                    <div className="font-bold text-slate-300">Quarter 1 Performance:</div>
                    <div>Target: <strong className="text-white">{selectedKpi.q1}</strong></div>
                    <div>Actual: <strong className="text-emerald-400 font-bold">{selectedKpi.q1Actual}</strong></div>
                    <div className="text-[10px] text-indigo-400 font-extrabold mt-0.5">Calculated Variance: {calcVar(selectedKpi.q1, selectedKpi.q1Actual) || '0'}</div>
                  </div>
                )}
                {selectedKpi.q2Actual && (
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850/50">
                    <div className="font-bold text-slate-300">Quarter 2 Performance:</div>
                    <div>Target: <strong className="text-white">{selectedKpi.q2}</strong></div>
                    <div>Actual: <strong className="text-emerald-400 font-bold">{selectedKpi.q2Actual}</strong></div>
                    <div className="text-[10px] text-indigo-400 font-extrabold mt-0.5">Calculated Variance: {calcVar(selectedKpi.q2, selectedKpi.q2Actual) || '0'}</div>
                  </div>
                )}
                {selectedKpi.q3Actual && (
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850/50">
                    <div className="font-bold text-slate-300">Quarter 3 Performance:</div>
                    <div>Target: <strong className="text-white">{selectedKpi.q3}</strong></div>
                    <div>Actual: <strong className="text-emerald-400 font-bold">{selectedKpi.q3Actual}</strong></div>
                    <div className="text-[10px] text-indigo-400 font-extrabold mt-0.5">Calculated Variance: {calcVar(selectedKpi.q3, selectedKpi.q3Actual) || '0'}</div>
                  </div>
                )}
                {selectedKpi.q4Actual && (
                  <div className="bg-slate-900/60 p-2.5 rounded border border-slate-850/50">
                    <div className="font-bold text-slate-300">Quarter 4 Performance:</div>
                    <div>Target: <strong className="text-white">{selectedKpi.q4}</strong></div>
                    <div>Actual: <strong className="text-emerald-400 font-bold">{selectedKpi.q4Actual}</strong></div>
                    <div className="text-[10px] text-indigo-400 font-extrabold mt-0.5">Calculated Variance: {calcVar(selectedKpi.q4, selectedKpi.q4Actual) || '0'}</div>
                  </div>
                )}
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

            {/* digital PoE Evidence logs & uploaded files */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-850 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-wider">Verifiable Evidence Desk (PoE)</span>
                </div>
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
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
                      <div key={file.id} className="bg-slate-900/80 border border-slate-800 hover:border-emerald-500/50 p-2.5 rounded-xl flex items-center justify-between gap-3 transition">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="p-2 bg-slate-950 rounded-lg border border-slate-800 shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white truncate m-0" title={file.name}>
                              {file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[9.5px] text-slate-400 mt-0.5">
                              <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded font-semibold uppercase tracking-tight text-[8.5px] border border-emerald-800/50">
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
                            onClick={() => viewOriginalFile(file.name, file.dataUrl, {
                              kpiName: selectedKpi.kpi,
                              refNum: selectedKpi.refNum,
                              quarter: file.quarter || 'Current Quarter'
                            })}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wide flex items-center gap-1.5 cursor-pointer transition shadow-sm"
                            title="Open Portfolio of Evidence in a new window natively"
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

            {/* Approver direct comments */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase text-slate-400 flex items-center justify-between">
                <span>Executive Directives / Approver Remarks</span>
                <span className="text-[9px] text-slate-500 font-normal">Included in feedback when pushing to Reviewer or returning to Submitter</span>
              </label>
              <textarea
                value={approverNotes}
                onChange={(e) => setApproverNotes(e.target.value)}
                disabled={(selectedKpi as any).workflowStatus === 'Approved'}
                placeholder="Enter executive approval comments, directives, or required corrections..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded p-2.5 text-xs text-white h-24 focus:outline-none resize-none"
              />
            </div>

            {/* Action buttons */}
            {((selectedKpi as any).workflowStatus !== 'Approved') ? (
              <div className="space-y-2 pt-3 border-t border-slate-850">
                <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-mono">
                  <span>Submitter: <strong className="text-amber-400 font-bold">{selectedKpi.submitter || 'None assigned'}</strong></span>
                  <span>Reviewer Target: <strong className="text-indigo-400 font-bold">{selectedKpi.reviewer || 'PMU Reviewer'}</strong></span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <button
                    onClick={handleRejectToReviewer}
                    disabled={loading}
                    className="w-full bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 border border-rose-800/40 rounded-xl py-3 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                    title={`Reject KPI and send back to Submitter (${selectedKpi.submitter || 'Submitter'}) with comments`}
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reject & Request Resend</span>
                  </button>
                  <button
                    onClick={handlePushToReviewer}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl py-3 font-bold text-[11px] uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-md"
                    title={`Accept and route to Reviewer (${selectedKpi.reviewer || 'Reviewer'})`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Accept & Push to Reviewer</span>
                  </button>
                  <button
                    onClick={handleGrantApproval}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-650 hover:from-emerald-500 hover:to-teal-600 text-white rounded-xl py-3 font-bold text-[11px] uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Grant Direct Sign-off</span>
                  </button>
                </div>
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

      {previewDoc && (
        <OfficeDocumentViewer
          doc={previewDoc}
          onClose={() => setPreviewDoc(null)}
        />
      )}

    </div>
  );
}
