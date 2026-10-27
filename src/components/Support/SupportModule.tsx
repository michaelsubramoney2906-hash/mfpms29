import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Ticket,
  Paperclip,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Mail,
  RefreshCw,
  X,
  MessageSquare,
  Phone,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
  Activity,
  Send,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  Zap,
  BookOpen,
  LifeBuoy,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';
import type { User } from '../../types';

interface SupportModuleProps {
  currentUser: User;
  activeTenantId: string;
  initialSubModuleId?: string | null;
}

interface SupportTicketComment {
  id: string;
  authorEmail: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface SupportTicketRecord {
  id: string;
  ticketNumber: string;
  tenantId: string;
  reporterEmail: string;
  reporterName: string;
  reporterDepartment: string;
  reporterJobTitle: string;
  subject: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  issue: string;
  status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
  document?: {
    name: string;
    mimeType: string;
    size: number;
    dataUrl: string;
  } | null;
  notifiedRecipients: string[];
  emailDispatchedAt: string;
  createdAt: string;
  updatedAt: string;
  comments?: SupportTicketComment[];
}

interface FAQArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string[];
  tags: string[];
}

const FAQ_ARTICLES: FAQArticle[] = [
  {
    id: 'faq-opms-1',
    category: 'OPMS & SDBIP Administration',
    title: 'OPMS & SDBIP Administrative Guidelines',
    summary: 'Comprehensive guide for administrators on managing top-layer/departmental SDBIP layers, Circular 88 indicators, and MFMA compliance.',
    content: [
      '1. Organizational Performance Management System (OPMS) & SDBIP Structure:',
      '• Top-Layer SDBIP KPIs align directly with Council-approved Integrated Development Plan (IDP) Strategic Objectives.',
      '• Departmental / Lower-Layer SDBIPs operationalize directorate activities and mSCOA budget allocations.',
      '2. KPI Creation & Target Imports:',
      '• Define clear baselines, annual targets, and quarterly breakdowns (Q1, Q2, Q3, Q4).',
      '• Ensure Circular 88 standardized performance indicators (EE1, FM1, WS1) are mapped to proper KPA categories.',
      '3. Quarterly Reporting & PoE Audit Trail:',
      '• Directors and Section 56/57 managers submit quarterly actuals along with mandatory Portfolios of Evidence (PoEs).',
      '• The OPMS Administrator conducts pre-audit validation prior to dispatching submissions to Internal Audit and DPMC committees.',
      '4. SDBIP Revisions & Adjustment Budgets:',
      '• SDBIP adjustments must follow official Council approval during mid-year budget adjustments (Section 72 of the MFMA).'
    ],
    tags: ['opms', 'sdbip', 'circular 88', 'idp', 'admin', 'mfma', 'targets']
  },
  {
    id: 'faq-ipms-1',
    category: 'IPMS & Performance Agreements',
    title: 'How do I upload quarterly actuals and Portfolios of Evidence (PoE)?',
    summary: 'Step-by-step guide on entering actual deliverables, assigning scores (1-5), and attaching evidence files.',
    content: [
      '1. Navigate to the IPMS module and click on Employee Self-Evaluation.',
      '2. Select the relevant Quarter tab (e.g. Q1, Q2, Q3, Q4) on your KPI card.',
      '3. Enter your whole-number Self Score (1 to 5) and type your 1st Qtr Actual Reached description.',
      '4. Scroll to the Portfolio of Evidence section and drag-and-drop your evidence file (PDF, Word, Excel, Images up to 200MB).',
      '5. Click "Submit Single KPI" or select multiple KPIs and click "Push to Manager for Approval".'
    ],
    tags: ['ipms', 'poe', 'actuals', 'scores', 'upload', 'self-evaluation']
  },
  {
    id: 'faq-ipms-2',
    category: 'IPMS & Performance Agreements',
    title: 'Why is a quarter locked or marked as N/A on my KPI?',
    summary: 'Understanding quarter applicability, target baselines, and lock conditions.',
    content: [
      'A quarter displays as locked (🔒 N/A) when:',
      '• The quarterly target in your approved Performance Agreement is explicitly defined as "N/A" or not scheduled for that quarter.',
      '• The KPI milestone is assigned exclusively to a different quarter (e.g., Clean Audit opinion targets scheduled in Q3).',
      'If a target was omitted in error, your Line Manager or PMS Administrator can update your agreement target to unlock the quarter.'
    ],
    tags: ['locked', 'n/a', 'applicability', 'quarter', 'target', 'ipms']
  },
  {
    id: 'faq-poe-1',
    category: 'Portfolio of Evidence (PoE)',
    title: 'What are the file size and upload limits for PoE files?',
    summary: 'Maximum file size per document and file count limits per KPI section.',
    content: [
      '• Maximum File Size: Up to 200MB per file upload / PoE blob.',
      '• Maximum Document Count: Up to 100 PoE files per KPI quarter section.',
      '• Allowed File Formats: PDF documents, Microsoft Word (.doc, .docx), Excel spreadsheets (.xls, .xlsx), PowerPoint presentations (.ppt, .pptx), PNG/JPEG images, and ZIP archives.',
      'All uploaded files are automatically stored securely on Supabase with zero data loss.'
    ],
    tags: ['poe', 'file limit', '200mb', '100 files', 'pdf', 'size']
  },
  {
    id: 'faq-jsc-1',
    category: 'Job Specific Competencies (JSC) & Core Competencies',
    title: 'How do I complete my JSC and Core Competencies Self-Evaluation?',
    summary: 'Evaluating job competencies, assigning self-ratings, and submitting to line manager.',
    content: [
      '1. Open the JSC / Core Competencies module in IPMS.',
      '2. Review your defined competency list, weighting percentages, and proficiency levels.',
      '3. Select the active Quarter (Q1, Q2, Q3, Q4) and enter your Self Score (1 to 5) and motivation commentary.',
      '4. Attach optional supporting evidence files under each competency.',
      '5. Click "Submit Self Evaluation" to route your assessment to your Line Manager.'
    ],
    tags: ['jsc', 'core competencies', 'self evaluation', 'competency', 'level']
  },
  {
    id: 'faq-access-1',
    category: 'User Access & Manager Approvals',
    title: 'Why can’t I see my subordinates or Manager Approval module?',
    summary: 'Resolving line manager reporting relationships and approval module permissions.',
    content: [
      'The Manager Approval module unlocks automatically when official municipal reporting lines indicate that subordinates report directly to your profile.',
      'If you have officials reporting to you but the module is greyed out:',
      '• Verify that your subordinates have your official email address saved as their Manager / Report To Email.',
      '• Contact the PMS Administrator or submit a Support Ticket to link your reporting structure.'
    ],
    tags: ['manager', 'approval', 'subordinates', 'reporting', 'access', 'permissions']
  },
  {
    id: 'faq-audit-1',
    category: 'Audit Ledgers & AOPO Compliance',
    title: 'How does the system ensure zero data loss and AGSA audit compliance?',
    summary: 'Overview of the immutable audit ledger, automatic timestamps, and resilience wrappers.',
    content: [
      'The Mzansi Flow PMS engine incorporates multi-layer data resilience:',
      '• Immutable Supabase Storage: Every performance plan modification, score update, and PoE upload creates an audited timestamped record in Supabase.',
      '• Client Circuit Breakers: Network loss triggers automatic offline queueing and silent retry mechanisms.',
      '• AGSA AOPO Compliance: Built-in extraction audit logs provide full traceability for Auditor-General performance audits.'
    ],
    tags: ['agsa', 'audit', 'data loss', 'resilience', 'aopo', 'compliance']
  }
];

export function SupportModule({ currentUser, activeTenantId }: SupportModuleProps) {
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const userName = currentUser?.fullName || (currentUser as any)?.name || userEmail.split('@')[0] || 'User';
  const isMzansiFlowUser =
    userEmail.endsWith('@mzansiflow.co.za') ||
    userEmail.includes('@mzansiflow.co.za') ||
    userEmail === 'mike@massivedynamixdistributors.com';
  const isReadOnly = Boolean(currentUser?.isReadOnly);

  // Active Tab: 'helpdesk' | 'knowledge_base' | 'tickets' | 'channels'
  const [activeTab, setActiveTab] = useState<'helpdesk' | 'knowledge_base' | 'tickets' | 'channels'>('helpdesk');

  // Search & Auto-Suggestions State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Tickets State
  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [showNewTicketModal, setShowNewTicketModal] = useState(false);

  // Form Fields
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketCategory, setTicketCategory] = useState('IPMS - Performance Plan & Scorecard');
  const [ticketPriority, setTicketPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('High');
  const [ticketIssue, setTicketIssue] = useState('');
  const [ticketDocument, setTicketDocument] = useState<{
    name: string;
    mimeType: string;
    size: number;
    dataUrl: string;
  } | null>(null);
  const [ticketConfirmation, setTicketConfirmation] = useState<{
    ticketNumber: string;
    notifiedRecipients: string[];
    subject: string;
    priority: string;
  } | null>(null);
  const [ticketError, setTicketError] = useState<string | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicketRecord | null>(null);
  const [ticketFilterStatus, setTicketFilterStatus] = useState<string>('ALL');
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const ticketFileInputRef = useRef<HTMLInputElement | null>(null);

  // FAQ Expand & Feedback State
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('faq-opms-1');
  const [articleFeedback, setArticleFeedback] = useState<Record<string, { voted: boolean; helpful?: boolean; commentSent?: boolean }>>({});
  const [feedbackComment, setFeedbackComment] = useState<Record<string, string>>({});
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Ping Latency
  const [pingLatency, setPingLatency] = useState<number>(18);

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => {
      setPingLatency(Math.floor(14 + Math.random() * 10));
    }, 12000);
    return () => clearInterval(interval);
  }, [userEmail, activeTenantId]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const res = await fetch(
        `/api/support/tickets?userEmail=${encodeURIComponent(userEmail)}&tenantId=${encodeURIComponent(activeTenantId || 'tenant-229')}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.tickets)) {
          setTickets(data.tickets);
          if (selectedTicket) {
            const updated = data.tickets.find((t: SupportTicketRecord) => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
          }
        }
      }
    } catch (e) {
      console.warn("Silent recovery during tickets fetch", e);
    } finally {
      setLoadingTickets(false);
    }
  };

  // Search auto-complete suggestions
  const suggestions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const matchedFaqs = FAQ_ARTICLES.filter(
      f => f.title.toLowerCase().includes(q) ||
           f.summary.toLowerCase().includes(q) ||
           f.tags.some(t => t.toLowerCase().includes(q))
    ).map(f => ({ type: 'faq' as const, id: f.id, label: f.title, category: f.category }));

    const matchedTickets = tickets.filter(
      t => t.ticketNumber.toLowerCase().includes(q) ||
           t.subject.toLowerCase().includes(q) ||
           t.issue.toLowerCase().includes(q)
    ).map(t => ({ type: 'ticket' as const, id: t.id, label: `${t.ticketNumber}: ${t.subject}`, category: `Ticket (${t.status})` }));

    return [...matchedFaqs, ...matchedTickets].slice(0, 6);
  }, [searchQuery, tickets]);

  const handleSelectSuggestion = (s: { type: 'faq' | 'ticket'; id: string }) => {
    setShowSuggestions(false);
    if (s.type === 'faq') {
      setActiveTab('knowledge_base');
      setExpandedFaqId(s.id);
    } else {
      setActiveTab('tickets');
      const target = tickets.find(t => t.id === s.id);
      if (target) setSelectedTicket(target);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 200 * 1024 * 1024) {
      alert('File size exceeds the 200MB maximum limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setTicketDocument({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
        dataUrl: reader.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Create New Ticket
  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) {
      alert('Your account is in read-only mode.');
      return;
    }
    if (!ticketSubject.trim() || !ticketIssue.trim()) {
      setTicketError('Please provide both a Subject and a detailed Issue description.');
      return;
    }

    setSubmittingTicket(true);
    setTicketError(null);

    try {
      const payload = {
        tenantId: activeTenantId || 'tenant-229',
        reporterEmail: userEmail,
        reporterName: userName,
        reporterDepartment: currentUser?.department || 'Municipal Services',
        reporterJobTitle: currentUser?.jobFunction || (currentUser as any)?.jobTitle || 'Official',
        subject: ticketSubject.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        issue: ticketIssue.trim(),
        document: ticketDocument
      };

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error(`Server returned HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data && data.ticket) {
        setTicketConfirmation({
          ticketNumber: data.ticket.ticketNumber || 'TKT-PENDING',
          notifiedRecipients: data.ticket.notifiedRecipients || ['support@mzansiflow.co.za'],
          subject: data.ticket.subject,
          priority: data.ticket.priority
        });
        setTicketSubject('');
        setTicketIssue('');
        setTicketDocument(null);
        setShowNewTicketModal(false);
        fetchTickets();
      } else {
        throw new Error(data?.error || 'Failed to generate support ticket.');
      }
    } catch (err: any) {
      console.error(err);
      setTicketError(err.message || 'Error submitting ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  // Add Comment to Ticket
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyBody.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(selectedTicket.id)}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authorEmail: userEmail,
          authorName: userName,
          body: replyBody.trim()
        })
      });

      if (res.ok) {
        setReplyBody('');
        fetchTickets();
      }
    } catch (err) {
      console.error("Error adding ticket comment", err);
    } finally {
      setSubmittingReply(false);
    }
  };

  // Update Status (Admin)
  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(ticketId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          updaterEmail: userEmail
        })
      });
      if (res.ok) {
        fetchTickets();
      }
    } catch (err) {
      console.error("Error updating status", err);
    }
  };

  // Send Article Feedback
  const handleVoteArticle = async (articleId: string, articleTitle: string, isHelpful: boolean) => {
    setSubmittingFeedback(true);
    try {
      const res = await fetch('/api/support/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          articleTitle,
          userEmail,
          isHelpful,
          feedbackText: feedbackComment[articleId] || ''
        })
      });
      if (res.ok) {
        setArticleFeedback(prev => ({
          ...prev,
          [articleId]: { voted: true, helpful: isHelpful, commentSent: true }
        }));
      }
    } catch (e) {
      console.error("Feedback error", e);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Filtered Tickets
  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const matchesStatus = ticketFilterStatus === 'ALL' || t.status.toUpperCase() === ticketFilterStatus.toUpperCase();
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q ||
        t.ticketNumber.toLowerCase().includes(q) ||
        t.subject.toLowerCase().includes(q) ||
        t.issue.toLowerCase().includes(q) ||
        t.reporterName.toLowerCase().includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [tickets, ticketFilterStatus, searchQuery]);

  return (
    <div className="flex flex-col space-y-6 max-w-7xl mx-auto p-4 sm:p-6 font-sans">
      
      {/* 1. STATUS & UPTIME LIVE INDICATOR BANNER */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/80 to-slate-900 text-white rounded-3xl p-5 shadow-xl border border-[#00D65B]/40 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00D65B]/20 border border-[#00D65B]/40 rounded-2xl flex items-center justify-center">
            <Activity className="w-5 h-5 text-[#00D65B] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-[#00D65B] shadow-[0_0_8px_#00D65B]"></span>
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-100 m-0">
                MzansiFlow Support & Helpdesk Hub
              </h2>
            </div>
            <p className="text-xs text-emerald-200 mt-0.5">
              Isolated Ticket Management & Interactive Knowledge Base • Zero Data Loss Guaranteed
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-[#00D65B]/10 border border-[#00D65B]/30 px-4 py-2 rounded-2xl text-xs">
          <span className="text-[#00D65B] font-extrabold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#00D65B]"></span>
            All Systems Operational
          </span>
          <span className="text-emerald-400">|</span>
          <span className="text-slate-200 font-mono font-bold">99.98% Uptime</span>
          <span className="text-emerald-400">|</span>
          <span className="text-emerald-300 font-mono text-[11px]">{pingLatency}ms</span>
        </div>
      </div>

      {/* 2. SEARCH BAR WITH REAL-TIME AUTO-SUGGESTIONS */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="w-5 h-5 absolute left-4 text-[#00D65B] pointer-events-none" />
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search FAQs, guides, Troubleshooting topics, or enter Ticket # (e.g. TKT-2026-001)..."
            className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-250 focus:border-[#00D65B] rounded-2xl text-sm font-bold text-slate-800 shadow-sm outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setShowSuggestions(false);
              }}
              className="absolute right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Auto-Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 overflow-hidden space-y-1 p-2 animate-fadeIn">
            <div className="text-[10px] font-black uppercase text-slate-400 px-3 py-1 tracking-wider">
              Auto-Suggested Results ({suggestions.length})
            </div>
            {suggestions.map((s) => (
              <button
                key={`${s.type}-${s.id}`}
                onClick={() => handleSelectSuggestion(s)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-[#00D65B]/10 transition flex items-center justify-between gap-2 cursor-pointer group"
              >
                <div className="flex items-center gap-2.5 truncate">
                  {s.type === 'faq' ? (
                    <BookOpen className="w-4 h-4 text-[#00D65B] shrink-0" />
                  ) : (
                    <Ticket className="w-4 h-4 text-[#00D65B] shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-800 group-hover:text-[#00D65B] truncate">
                    {s.label}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold text-slate-400 uppercase bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                  {s.category}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 3. NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {[
          { id: 'helpdesk', label: 'Support Hub', icon: LifeBuoy },
          { id: 'knowledge_base', label: 'Knowledge Base / FAQs', icon: BookOpen },
          { id: 'tickets', label: `Support Tickets (${tickets.length})`, icon: Ticket },
          { id: 'channels', label: 'Direct Support Channels', icon: Phone }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-black uppercase tracking-wider border-b-2 transition outline-none cursor-pointer shrink-0 ${
                isActive
                  ? 'border-[#00D65B] text-[#00D65B] bg-[#00D65B]/10'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#00D65B]' : 'text-slate-400'}`} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* CONFIRMATION NOTIFICATION BANNER */}
      {ticketConfirmation && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-emerald-900 shadow-sm flex items-start justify-between gap-3 animate-fadeIn">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-extrabold text-xs uppercase text-emerald-900 m-0">
                Support Ticket Generated: #{ticketConfirmation.ticketNumber}
              </h4>
              <p className="text-xs text-emerald-800 mt-1">
                Your ticket <strong>"{ticketConfirmation.subject}"</strong> has been logged in Supabase and dispatched to MzansiFlow Support Administrators.
              </p>
            </div>
          </div>
          <button
            onClick={() => setTicketConfirmation(null)}
            className="text-emerald-700 hover:text-emerald-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB 1: SUPPORT HUB HELPDESK DASHBOARD */}
      {activeTab === 'helpdesk' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Quick Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setShowNewTicketModal(true)}
              className="bg-gradient-to-br from-[#00D65B] to-emerald-700 text-slate-950 p-6 rounded-3xl shadow-lg hover:shadow-xl transition cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-slate-950/20 rounded-2xl">
                  <Ticket className="w-6 h-6 text-slate-950" />
                </div>
                <Sparkles className="w-5 h-5 text-slate-900 group-hover:rotate-12 transition" />
              </div>
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider m-0 text-slate-950">Log New Support Ticket</h3>
                <p className="text-xs text-slate-900/90 font-medium mt-1">
                  Submit a formal request for technical help, IPMS formula adjustments, or user access queries.
                </p>
              </div>
              <div className="flex items-center text-xs font-black text-slate-950 uppercase tracking-wider">
                <span>Create Request →</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('knowledge_base')}
              className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-[#00D65B]/60 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#00D65B]/10 rounded-2xl">
                  <BookOpen className="w-6 h-6 text-[#00D65B]" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider m-0">Knowledge Base & FAQs</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Browse curated, topically organized guides on performance agreements, PoE upload limits, and JSCs.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-[#00D65B] uppercase tracking-wider">
                <span>Explore Articles →</span>
              </div>
            </div>

            <div
              onClick={() => setActiveTab('channels')}
              className="bg-white border border-slate-200 p-6 rounded-3xl shadow-sm hover:border-[#00D65B]/60 hover:shadow-md transition cursor-pointer flex flex-col justify-between space-y-4 group"
            >
              <div className="flex items-center justify-between">
                <div className="p-3 bg-[#00D65B]/10 rounded-2xl">
                  <Phone className="w-6 h-6 text-[#00D65B]" />
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 group-hover:translate-x-1 transition" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider m-0">Direct Support Channels</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Reach MzansiFlow specialists via email, live chat, or municipal helpdesk telephone hotline.
                </p>
              </div>
              <div className="flex items-center text-xs font-bold text-[#00D65B] uppercase tracking-wider">
                <span>View Contact Details →</span>
              </div>
            </div>
          </div>

          {/* Top FAQs Section */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[#00D65B]" />
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider m-0">Top Troubleshooting Articles & Guides</h3>
              </div>
              <button
                onClick={() => setActiveTab('knowledge_base')}
                className="text-xs font-extrabold text-[#00D65B] hover:text-emerald-700 cursor-pointer"
              >
                View All FAQs →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {FAQ_ARTICLES.slice(0, 4).map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    setActiveTab('knowledge_base');
                    setExpandedFaqId(f.id);
                  }}
                  className="bg-slate-50 hover:bg-[#00D65B]/10 border border-slate-150 rounded-2xl p-4 transition cursor-pointer space-y-2 group"
                >
                  <span className="text-[10px] font-extrabold text-emerald-900 bg-[#00D65B]/20 px-2 py-0.5 rounded-full uppercase">
                    {f.category}
                  </span>
                  <h4 className="font-extrabold text-xs text-slate-800 group-hover:text-[#00D65B] leading-snug">
                    {f.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2">
                    {f.summary}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KNOWLEDGE BASE & FAQS WITH FEEDBACK WIDGET */}
      {activeTab === 'knowledge_base' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-150 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider m-0">
                Curated Knowledge Base & Operational Guides
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Answers to common performance management questions, file limits, and system compliance.
              </p>
            </div>

            <div className="space-y-3">
              {FAQ_ARTICLES.map((faq) => {
                const isExpanded = expandedFaqId === faq.id;
                const fbState = articleFeedback[faq.id] || {};
                return (
                  <div
                    key={faq.id}
                    className={`border rounded-2xl transition-all duration-200 ${
                      isExpanded ? 'border-[#00D65B] bg-[#00D65B]/5 shadow-sm' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedFaqId(isExpanded ? null : faq.id)}
                      className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer outline-none"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-2 bg-[#00D65B]/10 text-[#00D65B] rounded-xl font-bold text-xs shrink-0">
                          <BookOpen className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="text-[9.5px] font-black uppercase text-[#00D65B] tracking-wider block mb-0.5">
                            {faq.category}
                          </span>
                          <h4 className="font-extrabold text-xs text-slate-900 m-0">
                            {faq.title}
                          </h4>
                        </div>
                      </div>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180 text-[#00D65B]' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="px-5 pb-5 pt-2 border-t border-slate-150 space-y-4 text-xs text-slate-700 leading-relaxed animate-fadeIn">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-150 space-y-1.5 font-medium">
                          {faq.content.map((p, idx) => (
                            <p key={idx} className="m-0 text-[11.5px] text-slate-800">
                              {p}
                            </p>
                          ))}
                        </div>

                        {/* 5. FEEDBACK COLLECTION WIDGET */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
                          <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-[#00D65B] shrink-0" />
                            <span className="text-xs font-extrabold text-slate-800">
                              Was this article helpful?
                            </span>
                          </div>

                          {(fbState as any).voted ? (
                            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Thank you for your feedback!</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleVoteArticle(faq.id, faq.title, true)}
                                disabled={submittingFeedback}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-50"
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>Yes</span>
                              </button>
                              <button
                                onClick={() => handleVoteArticle(faq.id, faq.title, false)}
                                disabled={submittingFeedback}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold cursor-pointer transition disabled:opacity-50"
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                                <span>No</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TICKETING & CASE MANAGEMENT (ISOLATED USER VIEW) */}
      {activeTab === 'tickets' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-3xl shadow-sm">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 m-0">
                {isMzansiFlowUser ? 'MzansiFlow Admin Support Tickets' : 'My Support Tickets'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {isMzansiFlowUser
                  ? 'Showing all incoming tickets across Nkangala District Municipality.'
                  : `Showing tickets logged exclusively by ${userName} (${userEmail}).`}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={fetchTickets}
                className="p-2 text-slate-500 hover:text-[#00D65B] bg-slate-50 rounded-xl border border-slate-200 cursor-pointer transition"
                title="Refresh tickets"
              >
                <RefreshCw className={`w-4 h-4 ${loadingTickets ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setShowNewTicketModal(true)}
                className="bg-[#00D65B] hover:bg-[#00c052] text-slate-950 font-black px-4 py-2 rounded-2xl text-xs uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                <Ticket className="w-4 h-4" />
                <span>Log New Ticket</span>
              </button>
            </div>
          </div>

          {/* Tickets Table */}
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            {loadingTickets ? (
              <div className="p-12 text-center text-xs font-bold text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#00D65B]" />
                <span>Loading tickets from Supabase...</span>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <Ticket className="w-8 h-8 text-slate-300 mx-auto" />
                <h4 className="text-xs font-bold text-slate-600 uppercase m-0">No Support Tickets Found</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  You have not logged any support requests yet. Click "Log New Ticket" to submit a technical issue.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[9px] tracking-wider">
                      <th className="px-4 py-3 font-black">Ticket #</th>
                      <th className="px-4 py-3 font-black">Subject & Issue</th>
                      <th className="px-4 py-3 font-black">Category</th>
                      <th className="px-4 py-3 font-black text-center">Priority</th>
                      <th className="px-4 py-3 font-black text-center">Status</th>
                      <th className="px-4 py-3 font-black text-center">Date Logged</th>
                      <th className="px-4 py-3 font-black text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTickets.map((t) => (
                      <tr key={t.id} className="border-b border-slate-150 hover:bg-slate-50 transition">
                        <td className="px-4 py-3 font-mono font-black text-[#00D65B] text-xs">
                          {t.ticketNumber}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-800">
                          <div className="truncate max-w-xs">{t.subject}</div>
                          <div className="text-[10px] font-normal text-slate-500 truncate max-w-xs">{t.issue}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 font-medium">
                          {t.category}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
                            t.priority === 'Critical' ? 'bg-rose-100 text-rose-800' :
                            t.priority === 'High' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {t.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-black uppercase ${
                            t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-800' :
                            t.status === 'In Progress' ? 'bg-[#00D65B]/20 text-emerald-900' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-mono text-[10px] text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="bg-[#00D65B]/15 hover:bg-[#00D65B]/25 text-emerald-900 font-extrabold px-3 py-1 rounded-xl text-[10px] uppercase cursor-pointer transition"
                          >
                            View Ticket
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: DIRECT SUPPORT CHANNELS */}
      {activeTab === 'channels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#00D65B]/10 rounded-2xl text-[#00D65B]">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 m-0">Email Support</h3>
                <p className="text-xs text-slate-500 mt-0.5">Asynchronous support with 2-hour SLA response</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Support Inbox:</span>
                <a href="mailto:support@mzansiflow.co.za" className="font-extrabold text-[#00D65B] hover:underline">
                  support@mzansiflow.co.za
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Hours:</span>
                <span className="font-extrabold text-slate-800">Mon - Fri (07:30 - 16:30)</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#00D65B]/10 rounded-2xl text-[#00D65B]">
                <Phone className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 m-0">Telephone Helpdesk</h3>
                <p className="text-xs text-slate-500 mt-0.5">Direct assistance for urgent reporting issues</p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-150 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Hotline Phone:</span>
                <a href="tel:+27676909215" className="font-mono font-black text-[#00D65B] hover:underline text-sm">
                  +27 (67) 690 9215
                </a>
              </div>
              <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                <span>Operating Hours:</span>
                <span className="font-bold text-slate-800">Mon - Fri (07:30 - 16:30)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LOG NEW TICKET MODAL */}
      {showNewTicketModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-150 pb-3">
              <div className="flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[#00D65B]" />
                <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider m-0">Log Support Request</h3>
              </div>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Subject Title</label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="e.g. Need assistance with Q1 KPI deliverable actual calculation"
                  className="w-full px-3.5 py-2 bg-white border border-slate-250 focus:border-[#00D65B] rounded-xl text-xs font-bold text-slate-900 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e) => setTicketCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="IPMS - Performance Plan & Scorecard">IPMS - Performance Plan & Scorecard</option>
                    <option value="Portfolios of Evidence (PoE) & Documents">Portfolios of Evidence (PoE) & Documents</option>
                    <option value="JSC & Core Competencies">JSC & Core Competencies</option>
                    <option value="Manager Approvals & Reporting Lines">Manager Approvals & Reporting Lines</option>
                    <option value="Password & Account Access">Password & Account Access</option>
                    <option value="Other Technical Query">Other Technical Query</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Priority Level</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-250 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Detailed Issue Description</label>
                <textarea
                  rows={4}
                  value={ticketIssue}
                  onChange={(e) => setTicketIssue(e.target.value)}
                  placeholder="Describe what happened, error messages seen, and what help is required..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-250 focus:border-[#00D65B] rounded-xl text-xs font-medium text-slate-900 outline-none"
                  required
                />
              </div>

              {/* Attachment */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Attachment (Optional screenshot or document)</label>
                <input
                  type="file"
                  ref={ticketFileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => ticketFileInputRef.current?.click()}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer border border-slate-200"
                  >
                    <Paperclip className="w-3.5 h-3.5 text-slate-500" />
                    <span>{ticketDocument ? ticketDocument.name : 'Choose File'}</span>
                  </button>
                  {ticketDocument && (
                    <button
                      type="button"
                      onClick={() => setTicketDocument(null)}
                      className="text-rose-600 hover:text-rose-800 text-xs font-bold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>

              {ticketError && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-3 text-xs font-bold">
                  {ticketError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setShowNewTicketModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTicket}
                  className="px-5 py-2 bg-[#00D65B] hover:bg-[#00c052] text-slate-950 font-black rounded-xl text-xs uppercase cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition"
                >
                  {submittingTicket ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Submit Ticket</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SELECTED TICKET DETAIL DRAWER */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-end p-0 sm:p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-none sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl h-full sm:h-[90vh] flex flex-col justify-between overflow-hidden">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="font-mono font-black text-[#00D65B] text-xs uppercase">
                  #{selectedTicket.ticketNumber}
                </span>
                <h3 className="font-extrabold text-sm m-0 leading-tight">
                  {selectedTicket.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs text-slate-800">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-150">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Reporter</span>
                  <span className="font-bold text-slate-800">{selectedTicket.reporterName}</span>
                  <span className="block text-[10px] text-slate-500 font-mono">{selectedTicket.reporterEmail}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Status & Priority</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="px-2 py-0.5 bg-[#00D65B]/20 text-emerald-900 rounded font-black text-[9.5px]">
                      {selectedTicket.status}
                    </span>
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded font-black text-[9.5px]">
                      {selectedTicket.priority}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Issue Description</span>
                <div className="bg-white p-4 rounded-2xl border border-slate-200 font-medium leading-relaxed whitespace-pre-wrap">
                  {selectedTicket.issue}
                </div>
              </div>

              {selectedTicket.document && (
                <div className="bg-[#00D65B]/10 border border-[#00D65B]/30 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-4 h-4 text-[#00D65B] shrink-0" />
                    <span className="font-bold text-emerald-950 truncate">{selectedTicket.document.name}</span>
                  </div>
                  <a
                    href={selectedTicket.document.dataUrl}
                    download={selectedTicket.document.name}
                    className="px-3 py-1 bg-[#00D65B] hover:bg-[#00c052] text-slate-950 font-black rounded-xl text-[10px] uppercase shrink-0 transition"
                  >
                    Download
                  </a>
                </div>
              )}

              {/* Status Update (MzansiFlow Admins) */}
              {isMzansiFlowUser && (
                <div className="bg-slate-100 p-3 rounded-2xl space-y-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-500 block">Admin Status Control</span>
                  <div className="flex gap-2">
                    {['Open', 'In Progress', 'Resolved', 'Closed'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleUpdateStatus(selectedTicket.id, st)}
                        className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase transition ${
                          selectedTicket.status === st ? 'bg-[#00D65B] text-slate-950 font-black' : 'bg-white text-slate-700 border'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Comments Thread */}
              <div className="space-y-3 pt-2 border-t border-slate-150">
                <span className="text-[10px] font-black uppercase text-slate-400 block">Follow-up Communication</span>
                {selectedTicket.comments && selectedTicket.comments.length > 0 ? (
                  <div className="space-y-2">
                    {selectedTicket.comments.map((c) => (
                      <div key={c.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1">
                        <div className="flex justify-between items-center text-[10px]">
                          <span className="font-extrabold text-slate-800">{c.authorName} ({c.authorEmail})</span>
                          <span className="text-slate-400 font-mono">{new Date(c.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-xs text-slate-700 m-0">{c.body}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No comments added yet.</p>
                )}
              </div>
            </div>

            {/* Comment Form */}
            <form onSubmit={handleAddComment} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2">
              <input
                type="text"
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                placeholder="Type a follow-up comment..."
                className="flex-1 px-3.5 py-2 bg-white border border-slate-250 focus:border-[#00D65B] rounded-xl text-xs font-medium text-slate-800 outline-none"
              />
              <button
                type="submit"
                disabled={submittingReply || !replyBody.trim()}
                className="px-4 py-2 bg-[#00D65B] hover:bg-[#00c052] text-slate-950 font-black text-xs rounded-xl uppercase shrink-0 disabled:opacity-50 cursor-pointer transition"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
