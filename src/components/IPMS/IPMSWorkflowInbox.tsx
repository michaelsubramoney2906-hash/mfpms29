import React, { useState, useEffect } from 'react';
import { 
  Inbox, 
  Bell, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Search, 
  CheckCheck, 
  Trash2, 
  ChevronRight, 
  UserCheck, 
  ShieldCheck, 
  FileText, 
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Filter
} from 'lucide-react';

export interface IPMSNotification {
  id: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  title: string;
  message: string;
  kpiId?: string;
  kpiNo?: string;
  quarter?: string;
  actionType: 'submission' | 'approval' | 'revision_requested' | 'audit_request' | 'audit_completed' | 'info';
  poeDocsCount?: number;
  createdAt: string;
  read?: boolean;
}

interface IPMSWorkflowInboxProps {
  role: 'manager' | 'auditor' | 'employee';
  currentUser: any;
  activeTenantId: string;
  onSelectUserPlan?: (userId: string, kpiId?: string, quarter?: string) => void;
  className?: string;
}

export function IPMSWorkflowInbox({
  role,
  currentUser,
  activeTenantId,
  onSelectUserPlan,
  className = ''
}: IPMSWorkflowInboxProps) {
  const [notifications, setNotifications] = useState<IPMSNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<'all' | 'action' | 'approval' | 'audit'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchInbox = async () => {
    setLoading(true);
    try {
      const userEmail = (currentUser?.email || '').toLowerCase().trim();
      const isAuditor = role === 'auditor';
      const isManager = role === 'manager';

      const queryParams = new URLSearchParams({
        userEmail,
        role,
        isAuditor: String(isAuditor),
        isManager: String(isManager),
        t: String(Date.now())
      });

      const res = await fetch(`/api/tenant/${activeTenantId}/ipms-notifications?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch (e) {
      console.error("Error fetching inbox notifications:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInbox();
    const interval = setInterval(fetchInbox, 12000); // Poll every 12 seconds
    return () => clearInterval(interval);
  }, [currentUser, activeTenantId, role]);

  const handleMarkAsRead = async (notifId: string) => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: notifId })
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications/mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: 'all' })
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear your workflow inbox history?")) return;
    try {
      await fetch(`/api/tenant/${activeTenantId}/ipms-notifications`, { method: 'DELETE' });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  // Filter items
  const filteredItems = notifications.filter(item => {
    // Search
    const searchMatch = !searchTerm || 
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.senderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.senderEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.recipientName?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!searchMatch) return false;

    // Filter category
    if (filterCategory === 'action') {
      return item.actionType === 'submission' || item.actionType === 'revision_requested' || item.actionType === 'audit_request';
    }
    if (filterCategory === 'approval') {
      return item.actionType === 'approval' || item.actionType === 'audit_completed';
    }
    if (filterCategory === 'audit') {
      return item.actionType === 'audit_request' || item.actionType === 'audit_completed';
    }

    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const getRoleHeader = () => {
    if (role === 'manager') {
      return {
        title: 'Line Manager Workflow Inbox',
        subtitle: 'Incoming subordinate KPI submissions & PoE verification alerts',
        badgeColor: 'bg-indigo-600 text-white',
        icon: UserCheck
      };
    }
    if (role === 'auditor') {
      return {
        title: 'Internal Audit Dispatch Inbox',
        subtitle: 'Line-approved KPI performance plans pushed for oversight & rating',
        badgeColor: 'bg-emerald-600 text-white',
        icon: ShieldCheck
      };
    }
    return {
      title: 'My Performance & Review Inbox',
      subtitle: 'Real-time manager evaluation feedback, PoE revisions, & audit sign-offs',
      badgeColor: 'bg-blue-600 text-white',
      icon: Bell
    };
  };

  const roleInfo = getRoleHeader();
  const HeaderIcon = roleInfo.icon;

  return (
    <div className={`bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl p-4 sm:p-5 shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-slate-800/90 border border-slate-700/80 text-indigo-400">
            <HeaderIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm uppercase tracking-wide text-white m-0">
                {roleInfo.title}
              </h3>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-rose-500 text-white animate-pulse">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 m-0 font-medium">
              {roleInfo.subtitle}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchInbox}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1 border border-slate-700 cursor-pointer"
            title="Refresh Inbox"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded-xl transition text-[11px] font-bold flex items-center gap-1 border border-slate-700 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
              Mark Read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2.5 py-1.5 bg-rose-950/60 hover:bg-rose-900 text-rose-300 rounded-xl transition text-[11px] font-bold flex items-center gap-1 border border-rose-800/80 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterCategory === 'all' 
                ? 'bg-indigo-600 text-white shadow-sm' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            All Messages ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('action')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterCategory === 'action' 
                ? 'bg-amber-600 text-white shadow-sm' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            Action Needed
          </button>
          <button
            type="button"
            onClick={() => setFilterCategory('approval')}
            className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              filterCategory === 'approval' 
                ? 'bg-emerald-600 text-white shadow-sm' 
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
            }`}
          >
            Approved & Verified
          </button>
          {role !== 'employee' && (
            <button
              type="button"
              onClick={() => setFilterCategory('audit')}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                filterCategory === 'audit' 
                  ? 'bg-purple-600 text-white shadow-sm' 
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              Audit Requests
            </button>
          )}
        </div>

        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search inbox..."
            className="w-full pl-8 pr-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Message List */}
      <div className="mt-3 space-y-2.5 max-h-80 overflow-y-auto pr-1">
        {loading && notifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
            <span>Loading workflow messages...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/50 space-y-2">
            <Inbox className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs font-bold text-slate-400 m-0">No inbox items match this filter.</p>
            <p className="text-[11px] text-slate-500 m-0">
              {role === 'manager' && 'Subordinate KPI submissions and PoE verification requests will appear here automatically.'}
              {role === 'auditor' && 'Line-manager approved performance plans pushed for internal audit oversight will arrive here.'}
              {role === 'employee' && 'Line manager evaluation comments, score updates, and PoE feedback will show up here.'}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const isUnread = !item.read;
            const isRevisionReq = item.actionType === 'revision_requested';
            const isApproval = item.actionType === 'approval' || item.actionType === 'audit_completed';
            const isAuditReq = item.actionType === 'audit_request';
            const isSubmission = item.actionType === 'submission';

            return (
              <div
                key={item.id}
                className={`p-3.5 rounded-xl border transition flex flex-col gap-2 relative ${
                  isUnread 
                    ? 'bg-slate-800/90 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/30' 
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Top Row: Sender / Recipient + Status Pill + Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isUnread ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {item.senderName || item.senderEmail}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
                      ({item.senderEmail})
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded ${
                      isRevisionReq ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                      isApproval ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                      isAuditReq ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' :
                      isSubmission ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {isRevisionReq ? 'Revision Required' :
                       isApproval ? 'Approved & Signed' :
                       isAuditReq ? 'Audit Dispatch' :
                       isSubmission ? 'Subordinate KPI' :
                       'Notification'}
                    </span>

                    <span className="text-[10px] font-mono text-slate-400">
                      {item.createdAt ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                    </span>
                  </div>
                </div>

                {/* Message Title & Content */}
                <div>
                  <h4 className="font-bold text-xs text-white m-0 flex items-center gap-1.5">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-300 mt-1 mb-0 leading-relaxed font-sans whitespace-pre-wrap select-text">
                    {item.message}
                  </p>
                </div>

                {/* Bottom Actions Row */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                    {item.kpiNo && <span>KPI #{item.kpiNo}</span>}
                    {item.quarter && <span className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">{item.quarter}</span>}
                    {item.poeDocsCount ? <span>📎 {item.poeDocsCount} PoE File(s)</span> : null}
                  </div>

                  <div className="flex items-center gap-2">
                    {isUnread && (
                      <button
                        type="button"
                        onClick={() => handleMarkAsRead(item.id)}
                        className="text-[10px] text-slate-400 hover:text-slate-200 transition underline cursor-pointer"
                      >
                        Mark Read
                      </button>
                    )}

                    {onSelectUserPlan && (
                      <button
                        type="button"
                        onClick={() => {
                          handleMarkAsRead(item.id);
                          // Route to target user plan
                          const targetUser = item.senderEmail && role === 'manager' 
                            ? item.senderEmail 
                            : item.recipientEmail && role === 'employee' 
                              ? currentUser.email 
                              : item.senderEmail || item.recipientEmail;
                          onSelectUserPlan(targetUser, item.kpiId, item.quarter);
                        }}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg transition flex items-center gap-1 shadow-xs cursor-pointer"
                      >
                        <span>Open & Review</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
