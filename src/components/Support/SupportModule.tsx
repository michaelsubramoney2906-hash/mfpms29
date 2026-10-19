import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
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
  X
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

export function SupportModule({ currentUser, activeTenantId }: SupportModuleProps) {
  const userEmail = (currentUser?.email || '').toLowerCase().trim();
  const userName = currentUser?.fullName || (currentUser as any)?.name || userEmail.split('@')[0] || 'User';
  const isMzansiFlowUser =
    userEmail.endsWith('@mzansiflow.co.za') ||
    userEmail.includes('@mzansiflow.co.za') ||
    userEmail === 'mike@massivedynamixdistributors.com';
  const isReadOnly = Boolean(currentUser?.isReadOnly || userEmail === 'sivend@mzansiflow.co.za');

  const [tickets, setTickets] = useState<SupportTicketRecord[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [submittingTicket, setSubmittingTicket] = useState(false);
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
  const [ticketSearchQuery, setTicketSearchQuery] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const ticketFileInputRef = useRef<HTMLInputElement | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const safeParseJson = async (res: Response): Promise<any | null> => {
    try {
      const text = await res.text();
      if (!text) return null;
      const trimmed = text.trim();
      if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
        return null;
      }
      return JSON.parse(trimmed);
    } catch {
      return null;
    }
  };

  const fetchTickets = async (silent = false) => {
    if (!silent) setLoadingTickets(true);
    try {
      const res = await fetch(
        `/api/support/tickets?userEmail=${encodeURIComponent(userEmail)}&tenantId=${encodeURIComponent(activeTenantId || 'tenant-229')}`,
        {
          headers: {
            Accept: 'application/json'
          }
        }
      );
      if (res.ok) {
        const data = await safeParseJson(res);
        if (data && Array.isArray(data.tickets)) {
          setTickets(data.tickets);
          if (selectedTicket) {
            const updated = data.tickets.find((t: SupportTicketRecord) => t.id === selectedTicket.id);
            if (updated) setSelectedTicket(updated);
          }
        }
      }
    } catch {
      // Transient network or gateway reload; silently retain current tickets state
    } finally {
      if (!silent) setLoadingTickets(false);
    }
  };

  useEffect(() => {
    fetchTickets();
    const interval = setInterval(() => {
      fetchTickets(true);
    }, 10000);
    return () => clearInterval(interval);
  }, [userEmail, activeTenantId]);

  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('support_join', { userEmail });
    });

    socket.on('support_ticket_created', (ticket: SupportTicketRecord) => {
      setTickets(prev => {
        if (prev.some(t => t.id === ticket.id)) return prev;
        return [ticket, ...prev];
      });
    });

    socket.on('support_ticket_updated', (ticket: SupportTicketRecord) => {
      setTickets(prev => prev.map(t => (t.id === ticket.id ? ticket : t)));
      setSelectedTicket(prev => (prev && prev.id === ticket.id ? ticket : prev));
    });

    return () => {
      socket.disconnect();
    };
  }, [userEmail]);

  const handleTicketFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setTicketDocument({
          name: file.name,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
          dataUrl: reader.result
        });
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleCreateSupportTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return;
    setTicketError(null);
    setTicketConfirmation(null);

    if (!ticketSubject.trim() || !ticketIssue.trim()) {
      setTicketError('Please enter both a ticket subject and a detailed description of the issue.');
      return;
    }

    setSubmittingTicket(true);
    try {
      const payload = {
        tenantId: activeTenantId || 'tenant-229',
        reporterEmail: userEmail,
        reporterName: userName,
        reporterDepartment: currentUser?.department || 'Nkangala District Municipality',
        reporterJobTitle: currentUser?.jobFunction || currentUser?.role || 'Municipal Official',
        subject: ticketSubject.trim(),
        category: ticketCategory,
        priority: ticketPriority,
        issue: ticketIssue.trim(),
        document: ticketDocument
      };

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify(payload)
      });

      const data = await safeParseJson(res);
      if (!res.ok || !data) {
        throw new Error(data?.error || 'Failed to log support ticket. Please try again.');
      }

      if (data.ticket) {
        setTickets(prev => [data.ticket, ...prev.filter(t => t.id !== data.ticket.id)]);
        setSelectedTicket(data.ticket);
        setTicketConfirmation({
          ticketNumber: data.ticket.ticketNumber,
          notifiedRecipients: data.ticket.notifiedRecipients || [],
          subject: data.ticket.subject,
          priority: data.ticket.priority
        });
        setTicketSubject('');
        setTicketIssue('');
        setTicketDocument(null);
      }
    } catch (err: any) {
      setTicketError(err.message || 'An unexpected error occurred while logging your ticket.');
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, newStatus: SupportTicketRecord['status']) => {
    if (isReadOnly) return;
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(ticketId)}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({
          status: newStatus,
          updatedByEmail: userEmail,
          updatedByName: userName
        })
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        if (data?.ticket) {
          setTickets(prev => prev.map(t => (t.id === data.ticket.id ? data.ticket : t)));
          if (selectedTicket?.id === data.ticket.id) {
            setSelectedTicket(data.ticket);
          }
        }
      }
    } catch {
      // Ignore transient status update error
    }
  };

  const handleAddTicketComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyBody.trim() || isReadOnly) return;
    setSubmittingReply(true);
    try {
      const res = await fetch(`/api/support/tickets/${encodeURIComponent(selectedTicket.id)}/comment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'x-user-email': userEmail
        },
        body: JSON.stringify({
          authorEmail: userEmail,
          authorName: userName,
          body: replyBody.trim()
        })
      });
      if (res.ok) {
        const data = await safeParseJson(res);
        if (data?.ticket) {
          setTickets(prev => prev.map(t => (t.id === data.ticket.id ? data.ticket : t)));
          setSelectedTicket(data.ticket);
          setReplyBody('');
        }
      }
    } catch {
      // Ignore transient comment error
    } finally {
      setSubmittingReply(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (ticketFilterStatus !== 'ALL' && t.status !== ticketFilterStatus) return false;
      if (ticketSearchQuery.trim()) {
        const q = ticketSearchQuery.toLowerCase().trim();
        return (
          t.ticketNumber.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.issue.toLowerCase().includes(q) ||
          t.reporterEmail.toLowerCase().includes(q) ||
          t.reporterName.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, ticketFilterStatus, ticketSearchQuery]);

  const getPriorityBadgeStyle = (priority: SupportTicketRecord['priority']) => {
    switch (priority) {
      case 'Critical':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'High':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      case 'Medium':
        return 'bg-sky-500/15 text-sky-300 border-sky-500/40';
      default:
        return 'bg-slate-700/60 text-slate-300 border-slate-600';
    }
  };

  const getStatusBadgeStyle = (status: SupportTicketRecord['status']) => {
    switch (status) {
      case 'Resolved':
      case 'Closed':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      case 'In Progress':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      default:
        return 'bg-indigo-500/15 text-indigo-300 border-indigo-500/40';
    }
  };

  return (
    <div className="flex flex-col gap-6 text-slate-100">
      {/* Header */}
      <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400">
              Nkangala District Municipality • Mzansi Flow Support Desk
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1">
            Support Ticketing & Automated Email Dispatch
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Log a support ticket with your issue, priority, and supporting document. Generates an official ticket number and immediately emails all <span className="text-slate-200 font-semibold">@mzansiflow.co.za</span> accounts.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800 self-start lg:self-auto">
          <Ticket className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-white">
            Active Tickets Ledger
          </span>
          <span className="px-2 py-0.5 text-xs rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
            {tickets.length}
          </span>
        </div>
      </div>

      {/* Support Ticketing Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Form: Log a New Support Ticket */}
        <div className="lg:col-span-5 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Ticket className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log a Support Ticket</h3>
              <p className="text-xs text-slate-400">
                Generates a ticket number & emails all <span className="text-emerald-400 font-mono">@mzansiflow.co.za</span> users
              </p>
            </div>
          </div>

          {ticketConfirmation && (
            <div className="mt-4 p-4 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Support Ticket Logged & Emailed
                </span>
                <span className="font-mono font-black text-sm text-white bg-emerald-600/30 border border-emerald-500/40 px-2.5 py-0.5 rounded">
                  {ticketConfirmation.ticketNumber}
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Ticket <strong className="text-white font-mono">{ticketConfirmation.ticketNumber}</strong> ({ticketConfirmation.priority} Priority) has been dispatched with its issue details and uploaded document to all <strong className="text-emerald-300">@mzansiflow.co.za</strong> accounts:
              </p>
              <div className="flex flex-wrap gap-1 pt-1">
                {ticketConfirmation.notifiedRecipients.map(email => (
                  <span
                    key={email}
                    className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 font-mono text-[10px] text-emerald-300"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          )}

          {ticketError && (
            <div className="mt-4 p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-200 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{ticketError}</span>
            </div>
          )}

          <form onSubmit={handleCreateSupportTicket} className="mt-5 space-y-4">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Ticket Subject / Summary *
              </label>
              <input
                type="text"
                required
                disabled={isReadOnly}
                value={ticketSubject}
                onChange={e => setTicketSubject(e.target.value)}
                placeholder="e.g., Unable to unlock Q1 Self-Evaluation KPI row"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Affected Module
                </label>
                <select
                  disabled={isReadOnly}
                  value={ticketCategory}
                  onChange={e => setTicketCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="IPMS - Performance Plan & Scorecard">IPMS - Performance Plan & Scorecard</option>
                  <option value="IPMS - Self Evaluation & POE Upload">IPMS - Self Evaluation & POE Upload</option>
                  <option value="IPMS - Manager Approval & Review">IPMS - Manager Approval & Review</option>
                  <option value="IPMS - Internal Audit & DPMC">IPMS - Internal Audit & DPMC</option>
                  <option value="OPMS - SDBIP & Quarterly Reporting">OPMS - SDBIP & Quarterly Reporting</option>
                  <option value="Fred AI Document Extractor">Fred AI Document Extractor</option>
                  <option value="User Profile, Hierarchy & Access">User Profile, Hierarchy & Access</option>
                  <option value="General System Support">General System Support</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Priority Level *
                </label>
                <select
                  disabled={isReadOnly}
                  value={ticketPriority}
                  onChange={e => setTicketPriority(e.target.value as SupportTicketRecord['priority'])}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                >
                  <option value="Low">Low Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="High">High Priority</option>
                  <option value="Critical">Critical / Urgent</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Issue Description *
              </label>
              <textarea
                rows={5}
                required
                disabled={isReadOnly}
                value={ticketIssue}
                onChange={e => setTicketIssue(e.target.value)}
                placeholder="Describe the exact issue you are experiencing, including any affected KPI numbers, user accounts, or error messages..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 leading-relaxed"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                Supporting Document / Screenshot Attachment
              </label>
              <input
                ref={ticketFileInputRef}
                type="file"
                onChange={handleTicketFileChange}
                className="hidden"
              />
              {ticketDocument ? (
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-white truncate">{ticketDocument.name}</p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {Math.round(ticketDocument.size / 1024)} KB • Ready to attach to email
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setTicketDocument(null)}
                    className="text-slate-400 hover:text-rose-400 p-1 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isReadOnly}
                  onClick={() => ticketFileInputRef.current?.click()}
                  className="w-full py-3.5 px-4 rounded-xl border border-dashed border-slate-700 hover:border-emerald-500/60 bg-slate-950/60 hover:bg-slate-950 text-xs text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Paperclip className="w-4 h-4 text-emerald-400" />
                  <span>Click to upload supporting document, PDF, Word, Excel, or screenshot</span>
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isReadOnly || submittingTicket}
              className="w-full py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <Mail className="w-4 h-4" />
              <span>
                {submittingTicket
                  ? 'Generating Ticket & Dispatching Emails...'
                  : 'Submit Support Ticket & Notify @mzansiflow.co.za'}
              </span>
            </button>
          </form>
        </div>

        {/* Right Column: Support Tickets Ledger & Inspector */}
        <div className="lg:col-span-7 bg-slate-900/95 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">
                {isMzansiFlowUser ? 'All Logged Support Tickets (@mzansiflow.co.za Ledger)' : 'My Logged Support Tickets'}
              </h3>
              <p className="text-xs text-slate-400">
                Click any ticket to inspect the full issue, priority, email recipients, and uploaded document
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={ticketFilterStatus}
                onChange={e => setTicketFilterStatus(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
              <button
                type="button"
                onClick={() => fetchTickets()}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white cursor-pointer"
                title="Refresh Tickets"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={ticketSearchQuery}
              onChange={e => setTicketSearchQuery(e.target.value)}
              placeholder="Search by ticket number (e.g. TKT-NDM-2026-0001), subject, or user email..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Tickets List */}
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            {loadingTickets ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Loading support tickets from Supabase...
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl">
                <Ticket className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-300">No Support Tickets Found</p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Logged tickets will appear here with their generated ticket number and email dispatch status.
                </p>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-950/30 border-emerald-500/50'
                        : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded">
                          {ticket.ticketNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getPriorityBadgeStyle(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority} Priority
                        </span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${getStatusBadgeStyle(
                            ticket.status
                          )}`}
                        >
                          {ticket.status}
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(ticket.createdAt).toLocaleString([], {
                          year: 'numeric',
                          month: 'short',
                          day: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white mt-2">{ticket.subject}</h4>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{ticket.issue}</p>

                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-800/80 text-[11px] text-slate-400">
                      <span className="font-mono">
                        Logged by: <strong className="text-slate-200">{ticket.reporterName}</strong> ({ticket.reporterEmail})
                      </span>
                      <div className="flex items-center gap-3">
                        {ticket.document && (
                          <span className="flex items-center gap-1 text-emerald-400 font-medium">
                            <Paperclip className="w-3 h-3" />
                            {ticket.document.name}
                          </span>
                        )}
                        <span className="text-slate-500 font-mono">
                          Emailed to {ticket.notifiedRecipients?.length || 0} @mzansiflow.co.za
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Selected Ticket Detailed Inspector */}
          {selectedTicket && (
            <div className="mt-2 pt-5 border-t border-slate-800 bg-slate-950/80 rounded-xl p-5 space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-black text-emerald-400">
                      {selectedTicket.ticketNumber}
                    </span>
                    <span className="text-xs text-slate-400">• {selectedTicket.category}</span>
                  </div>
                  <h4 className="text-base font-bold text-white mt-1">
                    {selectedTicket.subject}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">
                    Reporter: {selectedTicket.reporterName} ({selectedTicket.reporterEmail}) • {selectedTicket.reporterDepartment}
                  </p>
                </div>

                {isMzansiFlowUser && !isReadOnly && (
                  <div className="flex items-center gap-1.5">
                    {(['Open', 'In Progress', 'Resolved', 'Closed'] as const).map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => handleUpdateTicketStatus(selectedTicket.id, st)}
                        className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase cursor-pointer border transition-colors ${
                          selectedTicket.status === st
                            ? 'bg-emerald-600 text-white border-emerald-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap leading-relaxed">
                {selectedTicket.issue}
              </div>

              {selectedTicket.document && (
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        Uploaded Document: {selectedTicket.document.name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">
                        {Math.round((selectedTicket.document.size || 0) / 1024)} KB • Attached to @mzansiflow.co.za email dispatch
                      </p>
                    </div>
                  </div>
                  <a
                    href={selectedTicket.document.dataUrl}
                    download={selectedTicket.document.name}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Document
                  </a>
                </div>
              )}

              <div className="text-[11px] text-slate-400">
                <span className="font-bold text-slate-300">Email Dispatch Recipients (@mzansiflow.co.za): </span>
                <span className="font-mono text-emerald-400">
                  {(selectedTicket.notifiedRecipients || []).join(', ')}
                </span>
              </div>

              {/* Ticket Thread / Responses */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Ticket Updates & Responses ({(selectedTicket.comments || []).length})
                </p>
                {(selectedTicket.comments || []).map(c => (
                  <div key={c.id} className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                      <span className="font-bold text-emerald-400">
                        {c.authorName} ({c.authorEmail})
                      </span>
                      <span className="font-mono">
                        {new Date(c.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-slate-200 whitespace-pre-wrap">{c.body}</p>
                  </div>
                ))}

                {!isReadOnly && (
                  <form onSubmit={handleAddTicketComment} className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      value={replyBody}
                      onChange={e => setReplyBody(e.target.value)}
                      placeholder="Add a response or status note to this support ticket..."
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                    <button
                      type="submit"
                      disabled={submittingReply || !replyBody.trim()}
                      className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
                    >
                      {submittingReply ? 'Posting...' : 'Post Reply'}
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
