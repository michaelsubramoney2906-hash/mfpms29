import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Users, Shield, Clock, Search, RefreshCw, Filter, 
  Calendar, ArrowUpDown, ChevronDown, ChevronRight, ChevronLeft,
  ChevronsLeft, ChevronsRight, Download, CheckCircle2, ExternalLink, 
  Activity, Layers, Database, Eye, Laptop, Globe, Sparkles, 
  Building2, UserCheck, SlidersHorizontal, AlertCircle
} from 'lucide-react';
import { UserProfile, AuditLogEntry, UserAuditSummary } from '../../types';

interface AuditLogsProps {
  currentUser: UserProfile;
  activeTenantId?: string;
}

const ITEMS_PER_PAGE = 20;

export const AuditLogs: React.FC<AuditLogsProps> = ({ currentUser, activeTenantId }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'stream'>('users');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  
  // Data state
  const [userSummaries, setUserSummaries] = useState<UserAuditSummary[]>([]);
  const [rawLogs, setRawLogs] = useState<AuditLogEntry[]>([]);
  const [expandedUserEmails, setExpandedUserEmails] = useState<Set<string>>(new Set());
  const [userTimelinePages, setUserTimelinePages] = useState<Record<string, number>>({});

  // Pagination states (strictly 20 items per page)
  const [usersPage, setUsersPage] = useState<number>(1);
  const [streamPage, setStreamPage] = useState<number>(1);

  // Filters
  const todayStr = useMemo(() => {
    const d = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }, []);

  const [dateFilter, setDateFilter] = useState<string>(todayStr);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('all');
  const [selectedActionFilter, setSelectedActionFilter] = useState<string>('all');
  const [isReseeding, setIsReseeding] = useState<boolean>(false);
  const [reseedNotice, setReseedNotice] = useState<string | null>(null);

  // Fetch data
  const fetchData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      // 1. Fetch user summary
      const summaryParams = new URLSearchParams({
        date: dateFilter,
        tenantId: activeTenantId || 'all'
      });
      if (searchQuery.trim()) {
        summaryParams.set('search', searchQuery.trim());
      }
      const summaryRes = await fetch(`/api/audit/users-summary?${summaryParams.toString()}`);
      if (summaryRes.ok) {
        const data = await summaryRes.json();
        if (data.success && Array.isArray(data.users)) {
          // Double safeguard to filter out mike@mzansiflow.co.za
          const cleanUsers = data.users.filter((u: UserAuditSummary) => 
            (u.userEmail || '').toLowerCase().trim() !== 'mike@mzansiflow.co.za'
          );
          setUserSummaries(cleanUsers);
        }
      }

      // 2. Fetch raw audit logs
      const logsParams = new URLSearchParams({
        date: dateFilter,
        tenantId: activeTenantId || 'all',
        limit: '1000'
      });
      if (searchQuery.trim()) {
        logsParams.set('search', searchQuery.trim());
      }
      if (selectedModuleFilter !== 'all') {
        logsParams.set('moduleId', selectedModuleFilter);
      }
      if (selectedActionFilter !== 'all') {
        logsParams.set('action', selectedActionFilter);
      }

      const logsRes = await fetch(`/api/audit/logs?${logsParams.toString()}`);
      if (logsRes.ok) {
        const data = await logsRes.json();
        if (data.success && Array.isArray(data.logs)) {
          const cleanLogs = data.logs.filter((l: AuditLogEntry) => 
            (l.userEmail || '').toLowerCase().trim() !== 'mike@mzansiflow.co.za'
          );
          setRawLogs(cleanLogs);
        }
      }
    } catch (err) {
      console.error("Failed to load audit logs:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateFilter, activeTenantId]);

  // Reset page to 1 whenever filters change
  useEffect(() => {
    setUsersPage(1);
    setStreamPage(1);
  }, [searchQuery, dateFilter, selectedModuleFilter, selectedActionFilter, activeTab]);

  // Auto refresh poll every 20 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchData(false);
    }, 20000);
    return () => clearInterval(interval);
  }, [autoRefresh, dateFilter, activeTenantId, selectedModuleFilter, selectedActionFilter]);

  // Re-seed / Sync Today's Activity handler
  const handleReseed = async () => {
    setIsReseeding(true);
    setReseedNotice(null);
    try {
      const res = await fetch('/api/audit/reseed', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReseedNotice(`Successfully synchronized ${data.count} today's activity audit logs with Supabase.`);
        await fetchData(true);
        setTimeout(() => setReseedNotice(null), 5000);
      }
    } catch (e: any) {
      setReseedNotice(`Sync failed: ${e.message}`);
    } finally {
      setIsReseeding(false);
    }
  };

  const toggleUserExpand = (email: string) => {
    setExpandedUserEmails(prev => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  // Filtered summaries for search query
  const filteredUserSummaries = useMemo(() => {
    if (!searchQuery.trim()) return userSummaries;
    const q = searchQuery.toLowerCase().trim();
    return userSummaries.filter(u => 
      u.userName.toLowerCase().includes(q) ||
      u.userEmail.toLowerCase().includes(q) ||
      u.department.toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q) ||
      u.modulesAccessed.some(m => m.name.toLowerCase().includes(q)) ||
      u.subModulesAccessed.some(sm => sm.name.toLowerCase().includes(q))
    );
  }, [userSummaries, searchQuery]);

  // Paginated user summaries (strictly 20 per page)
  const totalUserPages = Math.max(1, Math.ceil(filteredUserSummaries.length / ITEMS_PER_PAGE));
  const currentUsersPage = Math.min(usersPage, totalUserPages);
  const paginatedUserSummaries = useMemo(() => {
    const start = (currentUsersPage - 1) * ITEMS_PER_PAGE;
    return filteredUserSummaries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUserSummaries, currentUsersPage]);

  // Filtered raw logs for search query & filters
  const filteredRawLogs = useMemo(() => {
    return rawLogs.filter(l => {
      if (selectedModuleFilter !== 'all' && l.moduleId !== selectedModuleFilter) return false;
      if (selectedActionFilter !== 'all' && !l.action.toLowerCase().includes(selectedActionFilter.toLowerCase())) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        l.userName.toLowerCase().includes(q) ||
        l.userEmail.toLowerCase().includes(q) ||
        l.moduleName.toLowerCase().includes(q) ||
        l.subModuleName.toLowerCase().includes(q) ||
        (l.details || '').toLowerCase().includes(q) ||
        (l.ipAddress || '').toLowerCase().includes(q) ||
        (l.department || '').toLowerCase().includes(q)
      );
    });
  }, [rawLogs, searchQuery, selectedModuleFilter, selectedActionFilter]);

  // Paginated raw logs (strictly 20 per page)
  const totalStreamPages = Math.max(1, Math.ceil(filteredRawLogs.length / ITEMS_PER_PAGE));
  const currentStreamPage = Math.min(streamPage, totalStreamPages);
  const paginatedRawLogs = useMemo(() => {
    const start = (currentStreamPage - 1) * ITEMS_PER_PAGE;
    return filteredRawLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredRawLogs, currentStreamPage]);

  // Unique modules list from logs
  const availableModules = useMemo(() => {
    const map = new Map<string, string>();
    rawLogs.forEach(l => {
      if (l.moduleId && l.moduleName) {
        map.set(l.moduleId, l.moduleName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [rawLogs]);

  // Session duration aggregates across all users
  const durationStats = useMemo(() => {
    if (userSummaries.length === 0) {
      return { avgFormatted: '0 mins', maxFormatted: '0 mins', maxUser: 'None' };
    }
    
    let totalMinutes = 0;
    let maxMinutes = -1;
    let maxUser = '';
    let maxFormatted = '';

    for (const u of userSummaries) {
      const mins = u.sessionDurationMinutes || 0;
      totalMinutes += mins;
      if (mins > maxMinutes) {
        maxMinutes = mins;
        maxUser = u.userName;
        maxFormatted = u.sessionDurationFormatted || `${mins} mins`;
      }
    }

    const avgMins = Math.round(totalMinutes / userSummaries.length);
    const avgHours = Math.floor(avgMins / 60);
    const avgRemMins = avgMins % 60;
    const avgFormatted = avgHours > 0 
      ? `${avgHours} hr${avgHours > 1 ? 's' : ''} ${avgRemMins} min${avgRemMins > 1 ? 's' : ''}` 
      : `${avgMins} mins`;

    return { avgFormatted, maxFormatted: maxFormatted || `${maxMinutes} mins`, maxUser: maxUser || 'N/A' };
  }, [userSummaries]);

  // Export to CSV
  const handleExportCSV = () => {
    if (activeTab === 'users') {
      if (filteredUserSummaries.length === 0) return;
      const headers = [
        'User Full Name',
        'User Email',
        'Department',
        'Role',
        'Tenant ID',
        'First Login Time',
        'Last Active Time',
        'Time on System (Duration)',
        'Total Duration (Minutes)',
        'Total Logged Actions',
        'Modules Accessed'
      ];

      const rows = filteredUserSummaries.map(u => [
        `"${(u.userName || '').replace(/"/g, '""')}"`,
        u.userEmail,
        `"${(u.department || '').replace(/"/g, '""')}"`,
        `"${(u.role || '').replace(/"/g, '""')}"`,
        u.tenantId,
        u.firstLogin,
        u.lastActive,
        `"${u.sessionDurationFormatted || '< 1 min'}"`,
        u.sessionDurationMinutes || 0,
        u.totalActions,
        `"${u.modulesAccessed.map(m => `${m.name} (${m.count})`).join('; ')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `User_Session_Durations_${dateFilter}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (filteredRawLogs.length === 0) return;
    const headers = [
      'Audit ID',
      'Date',
      'Time (Exact)',
      'User Full Name',
      'User Email',
      'Department',
      'Role',
      'Action Performed',
      'Module Name',
      'Sub-Module Name',
      'Activity Details',
      'IP Address'
    ];

    const rows = filteredRawLogs.map(l => [
      l.id,
      l.dateStr,
      l.timeStr,
      `"${(l.userName || '').replace(/"/g, '""')}"`,
      l.userEmail,
      `"${(l.department || '').replace(/"/g, '""')}"`,
      `"${(l.role || '').replace(/"/g, '""')}"`,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.moduleName || '').replace(/"/g, '""')}"`,
      `"${(l.subModuleName || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      l.ipAddress || ''
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Audit_Logs_Activity_${dateFilter}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for generating page numbers with smart ellipsis
  const getPageNumbers = (currentPage: number, totalPages: number) => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
      {/* Top Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 flex flex-wrap items-center justify-between gap-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white tracking-tight">Audit Logs & User Access Ledger</h2>
              <span className="bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Supabase Persistent
              </span>
              <span className="bg-indigo-500/10 text-indigo-300 text-[11px] font-semibold px-2 py-0.5 rounded-md border border-indigo-500/20">
                20 items / page
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time user session tracking, module and sub-module access histories, and security footprint down to the exact second.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Re-seed today button */}
          <button
            onClick={handleReseed}
            disabled={isReseeding}
            title="Synchronize all municipal user logins and access events for today into Supabase"
            className="px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            <Sparkles className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin' : 'text-indigo-400'}`} />
            {isReseeding ? 'Syncing...' : 'Sync Today’s Activity'}
          </button>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
              autoRefresh 
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Activity className={`w-3.5 h-3.5 ${autoRefresh ? 'text-emerald-400 animate-pulse' : ''}`} />
            {autoRefresh ? 'Live Poll: 20s' : 'Live Poll: Paused'}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => fetchData(true)}
            disabled={refreshing}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center justify-center transition-all disabled:opacity-50"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>

          {/* Export CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Reseed notice banner */}
      {reseedNotice && (
        <div className="bg-indigo-950/80 border-b border-indigo-800/60 px-6 py-2.5 text-xs text-indigo-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{reseedNotice}</span>
          </div>
          <button onClick={() => setReseedNotice(null)} className="text-indigo-400 hover:text-indigo-200 text-xs font-bold">Dismiss</button>
        </div>
      )}

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 p-6 pb-2">
        {/* Card 1: Users logged in today */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-indigo-400" />
              Active Users Today
            </span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {userSummaries.length}
              <span className="text-xs font-normal text-slate-400 ml-2">officials & staff</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Excluding system manager (<code className="text-indigo-300 font-mono text-[10px]">mike@mzansiflow.co.za</code>)
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <UserCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Average Time On System */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-cyan-500"></div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Avg Time on System
            </span>
            <div className="text-2xl font-extrabold text-cyan-300 mt-1 font-mono">
              {durationStats.avgFormatted}
              <span className="text-xs font-normal text-slate-400 ml-2 font-sans">per user</span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]" title={`Peak: ${durationStats.maxFormatted} (${durationStats.maxUser})`}>
              Peak session: <span className="text-white font-medium">{durationStats.maxFormatted}</span>
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Logged Events */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              Total Logged Events
            </span>
            <div className="text-2xl font-extrabold text-white mt-1">
              {rawLogs.length}
              <span className="text-xs font-normal text-slate-400 ml-2">exact timestamps</span>
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-0.5 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Synchronized to Supabase database
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Target Date */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-purple-500"></div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              Active Date Scope
            </span>
            <div className="text-lg font-bold text-white mt-1 font-mono">
              {dateFilter === 'all' ? 'All Historic Dates' : dateFilter}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {dateFilter === todayStr ? 'Showing today’s active sessions' : 'Filtered calendar range'}
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Tab Controller Bar */}
      <div className="px-6 py-3 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Users Logged In Today ({userSummaries.length})
          </button>
          <button
            onClick={() => setActiveTab('stream')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'stream'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Chronological Audit Stream ({filteredRawLogs.length})
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user, email, module..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Date Selector */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value={todayStr} className="bg-slate-900 text-white">Today ({todayStr})</option>
              <option value="all" className="bg-slate-900 text-white">All Historic Dates</option>
            </select>
          </div>

          {/* Module Filter (when on stream tab) */}
          {activeTab === 'stream' && (
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedModuleFilter}
                onChange={(e) => setSelectedModuleFilter(e.target.value)}
                className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
              >
                <option value="all" className="bg-slate-900 text-white">All Modules</option>
                {availableModules.map(m => (
                  <option key={m.id} value={m.id} className="bg-slate-900 text-white">{m.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 p-6 flex flex-col justify-between">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center py-20 text-slate-400">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
            <p className="text-sm font-medium">Querying Supabase persistent audit trail database...</p>
          </div>
        ) : activeTab === 'users' ? (
          /* TAB 1: USERS LOGGED IN TODAY SUMMARY DIRECTORY */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Showing <strong>{filteredUserSummaries.length === 0 ? 0 : (currentUsersPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentUsersPage * ITEMS_PER_PAGE, filteredUserSummaries.length)}</strong> of <strong>{filteredUserSummaries.length}</strong> active users (Page {currentUsersPage} of {totalUserPages}).
              </span>
              <span className="text-[11px] text-slate-500">20 users per page • Click any user to inspect chronological timeline</span>
            </div>

            {filteredUserSummaries.length === 0 ? (
              <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                <AlertCircle className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-slate-300">No users logged in matching criteria</h4>
                <p className="text-xs text-slate-500 mt-1">Try clearing search filters or click "Sync Today’s Activity" above.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {paginatedUserSummaries.map((userSummary) => {
                  const isExpanded = expandedUserEmails.has(userSummary.userEmail);
                  const userTlPage = userTimelinePages[userSummary.userEmail] || 1;
                  const totalTlPages = Math.max(1, Math.ceil(userSummary.timeline.length / ITEMS_PER_PAGE));
                  const currentTlPage = Math.min(userTlPage, totalTlPages);
                  const paginatedTimeline = userSummary.timeline.slice(
                    (currentTlPage - 1) * ITEMS_PER_PAGE,
                    currentTlPage * ITEMS_PER_PAGE
                  );

                  return (
                    <div 
                      key={userSummary.userEmail}
                      className="bg-slate-900/80 border border-slate-800/90 hover:border-slate-700/80 rounded-xl overflow-hidden transition-all shadow-sm"
                    >
                      {/* User Header Row */}
                      <div 
                        onClick={() => toggleUserExpand(userSummary.userEmail)}
                        className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/40 select-none"
                      >
                        {/* User Identity */}
                        <div className="flex items-center gap-3.5 min-w-[260px]">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-800 to-indigo-950 border border-indigo-500/30 flex items-center justify-center font-bold text-indigo-300 text-sm shadow-inner shrink-0">
                            {userSummary.userName.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-bold text-white tracking-tight">{userSummary.userName}</h3>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                                {userSummary.role}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>{userSummary.userEmail}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-400 font-sans">{userSummary.department}</span>
                            </div>
                          </div>
                        </div>

                        {/* Timestamps & Counters */}
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          {/* Time on System Duration */}
                          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-lg px-3 py-1.5 flex flex-col min-w-[125px]">
                            <span className="text-[10px] uppercase font-bold text-cyan-300 flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5 text-cyan-400" />
                              Time on System
                            </span>
                            <span className="font-bold text-white text-xs font-mono flex items-center gap-1.5 mt-0.5">
                              <span className="text-cyan-300 font-bold">{userSummary.sessionDurationFormatted || '< 1 min'}</span>
                              {userSummary.isActiveNow && (
                                <span className="flex h-2 w-2 relative" title="Active recently">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                </span>
                              )}
                            </span>
                          </div>

                          {/* First Login Time */}
                          <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-500">First Login</span>
                            <span className="font-mono font-bold text-indigo-400 text-xs flex items-center gap-1">
                              <Clock className="w-3 h-3 text-indigo-400" />
                              {userSummary.firstLogin}
                            </span>
                          </div>

                          {/* Last Active Time */}
                          <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 flex flex-col">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Last Active</span>
                            <span className="font-mono font-bold text-emerald-400 text-xs flex items-center gap-1">
                              <Activity className="w-3 h-3 text-emerald-400" />
                              {userSummary.lastActive}
                            </span>
                          </div>

                          {/* Total Actions */}
                          <div className="bg-slate-950/70 border border-slate-800 rounded-lg px-3 py-1.5 flex flex-col items-center min-w-[65px]">
                            <span className="text-[10px] uppercase font-bold text-slate-500">Actions</span>
                            <span className="font-bold text-white text-xs">{userSummary.totalActions} events</span>
                          </div>

                          {/* Expand chevron */}
                          <div className="w-8 h-8 rounded-lg bg-slate-800/80 flex items-center justify-center text-slate-400">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Modules & Submodules summary badges bar */}
                      <div className="px-4 py-2.5 bg-slate-950/40 border-t border-slate-800/60 flex flex-wrap items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Modules Accessed:</span>
                        {userSummary.modulesAccessed.map(m => (
                          <span 
                            key={m.id}
                            className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-slate-800/90 text-slate-200 border border-slate-700/60 flex items-center gap-1.5"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                            {m.name}
                            <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1 py-0.2 rounded font-bold">{m.count}</span>
                          </span>
                        ))}

                        <div className="w-px h-4 bg-slate-800 mx-1 hidden sm:block"></div>

                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Sub-Modules:</span>
                        {userSummary.subModulesAccessed.slice(0, 4).map(sm => (
                          <span 
                            key={sm.id}
                            className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-950/40 text-indigo-300 border border-indigo-800/40"
                          >
                            {sm.name}
                          </span>
                        ))}
                        {userSummary.subModulesAccessed.length > 4 && (
                          <span className="text-[10px] text-slate-500 font-medium">
                            +{userSummary.subModulesAccessed.length - 4} more
                          </span>
                        )}
                      </div>

                      {/* Expanded Chronological Timeline Down to the Second */}
                      {isExpanded && (
                        <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 animate-in fade-in duration-200">
                          {/* User Session Duration Breakdown Banner */}
                          <div className="mb-3.5 p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
                                <Clock className="w-4 h-4" />
                              </div>
                              <div>
                                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Time on System</span>
                                <div className="text-sm font-bold text-cyan-300 font-mono">
                                  {userSummary.sessionDurationFormatted || '< 1 min'}
                                  <span className="text-slate-400 text-xs font-normal ml-2">({userSummary.sessionDurationMinutes || 0} minutes active span)</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4 text-[11px] font-mono">
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">First In:</span>
                                <span className="text-indigo-300 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{userSummary.firstLogin}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Last Active:</span>
                                <span className="text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{userSummary.lastActive}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-500">Total Logged:</span>
                                <span className="text-white font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">{userSummary.totalActions} events</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Activity className="w-3.5 h-3.5 text-indigo-400" />
                              Exact Chronological Access Stream for {userSummary.userName}
                            </h4>
                            <span className="text-[11px] font-mono text-slate-400">
                              Showing {paginatedTimeline.length} of {userSummary.timeline.length} entries (20 per page)
                            </span>
                          </div>

                          <div className="overflow-x-auto rounded-lg border border-slate-800">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-900/90 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                                <tr>
                                  <th className="py-2.5 px-3">Date & Time (Exact)</th>
                                  <th className="py-2.5 px-3">Action Type</th>
                                  <th className="py-2.5 px-3">Module Accessed</th>
                                  <th className="py-2.5 px-3">Sub-Module</th>
                                  <th className="py-2.5 px-3">Activity Description</th>
                                  <th className="py-2.5 px-3 text-right">IP & Security</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-800/60 font-sans">
                                {paginatedTimeline.map((entry) => (
                                  <tr key={entry.id} className="hover:bg-slate-900/50">
                                    <td className="py-2.5 px-3 font-mono text-indigo-300 font-bold whitespace-nowrap">
                                      {entry.dateStr} <span className="text-white bg-slate-800 px-1.5 py-0.5 rounded text-[11px] ml-1">{entry.timeStr}</span>
                                    </td>
                                    <td className="py-2.5 px-3 whitespace-nowrap">
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        entry.action === 'User Authentication'
                                          ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                                      }`}>
                                        {entry.action}
                                      </span>
                                    </td>
                                    <td className="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap">
                                      {entry.moduleName}
                                    </td>
                                    <td className="py-2.5 px-3 text-indigo-300 whitespace-nowrap">
                                      {entry.subModuleName || '-'}
                                    </td>
                                    <td className="py-2.5 px-3 text-slate-400 max-w-md truncate">
                                      {entry.details || '-'}
                                    </td>
                                    <td className="py-2.5 px-3 text-right font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                      {entry.ipAddress || '102.165.44.18'}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>

                          {/* Timeline pagination controls if > 20 entries */}
                          {totalTlPages > 1 && (
                            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                              <span className="text-slate-400 text-[11px]">
                                Page {currentTlPage} of {totalTlPages} ({userSummary.timeline.length} total entries)
                              </span>
                              <div className="flex items-center gap-1.5">
                                <button
                                  disabled={currentTlPage <= 1}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUserTimelinePages(p => ({ ...p, [userSummary.userEmail]: Math.max(1, currentTlPage - 1) }));
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-800 text-xs"
                                >
                                  Prev 20
                                </button>
                                <span className="font-mono text-slate-300 text-[11px] px-2">{currentTlPage}/{totalTlPages}</span>
                                <button
                                  disabled={currentTlPage >= totalTlPages}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setUserTimelinePages(p => ({ ...p, [userSummary.userEmail]: Math.min(totalTlPages, currentTlPage + 1) }));
                                  }}
                                  className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-slate-300 disabled:opacity-40 hover:bg-slate-800 text-xs"
                                >
                                  Next 20
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls for Users Tab */}
            {filteredUserSummaries.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                <div className="text-xs text-slate-400">
                  Showing <span className="text-white font-bold">{(currentUsersPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-white font-bold">{Math.min(currentUsersPage * ITEMS_PER_PAGE, filteredUserSummaries.length)}</span> of <span className="text-white font-bold">{filteredUserSummaries.length}</span> active users
                </div>

                <div className="flex items-center gap-1.5">
                  {/* First Page */}
                  <button
                    onClick={() => setUsersPage(1)}
                    disabled={currentUsersPage === 1}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Prev Page */}
                  <button
                    onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                    disabled={currentUsersPage === 1}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 mx-1">
                    {getPageNumbers(currentUsersPage, totalUserPages).map((p, idx) => (
                      typeof p === 'number' ? (
                        <button
                          key={idx}
                          onClick={() => setUsersPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            p === currentUsersPage
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={idx} className="px-1 text-slate-600 text-xs font-mono select-none">...</span>
                      )
                    ))}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setUsersPage(p => Math.min(totalUserPages, p + 1))}
                    disabled={currentUsersPage === totalUserPages}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setUsersPage(totalUserPages)}
                    disabled={currentUsersPage === totalUserPages}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* TAB 2: COMPREHENSIVE CHRONOLOGICAL AUDIT STREAM VIEW */
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>
                Showing <strong>{filteredRawLogs.length === 0 ? 0 : (currentStreamPage - 1) * ITEMS_PER_PAGE + 1}–{Math.min(currentStreamPage * ITEMS_PER_PAGE, filteredRawLogs.length)}</strong> of <strong>{filteredRawLogs.length}</strong> sequential audit entries (Page {currentStreamPage} of {totalStreamPages}).
              </span>
              <span className="text-[11px] text-slate-500">20 entries per page • Stored in Supabase for audit compliance</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                    <tr>
                      <th className="py-3 px-3.5">Timestamp (Exact Sec)</th>
                      <th className="py-3 px-3.5">User & Identity</th>
                      <th className="py-3 px-3.5">Department / Role</th>
                      <th className="py-3 px-3.5">Action</th>
                      <th className="py-3 px-3.5">Module</th>
                      <th className="py-3 px-3.5">Sub-Module</th>
                      <th className="py-3 px-3.5">Activity Details</th>
                      <th className="py-3 px-3.5 text-right">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {paginatedRawLogs.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-500">
                          No audit log entries matching the selected criteria.
                        </td>
                      </tr>
                    ) : (
                      paginatedRawLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* Exact Timestamp */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap font-mono">
                            <span className="text-slate-400 text-[11px]">{log.dateStr}</span>
                            <span className="text-white font-bold bg-slate-800/90 border border-slate-700 px-1.5 py-0.5 rounded text-[11px] ml-1.5">
                              {log.timeStr}
                            </span>
                          </td>

                          {/* User Identity */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <div className="font-bold text-slate-100">{log.userName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{log.userEmail}</div>
                          </td>

                          {/* Department & Role */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <div className="text-slate-300 font-medium">{log.department || 'District Administration'}</div>
                            <div className="text-[10px] text-indigo-400">{log.role}</div>
                          </td>

                          {/* Action Badge */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              log.action === 'User Authentication'
                                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                                : log.action.includes('Export')
                                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-300 border border-slate-700'
                            }`}>
                              {log.action}
                            </span>
                          </td>

                          {/* Module */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap font-semibold text-slate-200">
                            {log.moduleName}
                          </td>

                          {/* Sub-Module */}
                          <td className="py-2.5 px-3.5 whitespace-nowrap text-indigo-300 font-medium">
                            {log.subModuleName || '-'}
                          </td>

                          {/* Details */}
                          <td className="py-2.5 px-3.5 text-slate-400 max-w-xs truncate" title={log.details}>
                            {log.details || '-'}
                          </td>

                          {/* IP Address */}
                          <td className="py-2.5 px-3.5 text-right font-mono text-[11px] text-slate-400 whitespace-nowrap">
                            {log.ipAddress || '102.165.44.18'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination Controls for Stream Tab */}
            {filteredRawLogs.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl">
                <div className="text-xs text-slate-400">
                  Showing <span className="text-white font-bold">{(currentStreamPage - 1) * ITEMS_PER_PAGE + 1}</span> to <span className="text-white font-bold">{Math.min(currentStreamPage * ITEMS_PER_PAGE, filteredRawLogs.length)}</span> of <span className="text-white font-bold">{filteredRawLogs.length}</span> entries
                </div>

                <div className="flex items-center gap-1.5">
                  {/* First Page */}
                  <button
                    onClick={() => setStreamPage(1)}
                    disabled={currentStreamPage === 1}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="First Page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>

                  {/* Prev Page */}
                  <button
                    onClick={() => setStreamPage(p => Math.max(1, p - 1))}
                    disabled={currentStreamPage === 1}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                    Prev
                  </button>

                  {/* Page Numbers */}
                  <div className="flex items-center gap-1 mx-1">
                    {getPageNumbers(currentStreamPage, totalStreamPages).map((p, idx) => (
                      typeof p === 'number' ? (
                        <button
                          key={idx}
                          onClick={() => setStreamPage(p)}
                          className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                            p === currentStreamPage
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700'
                          }`}
                        >
                          {p}
                        </button>
                      ) : (
                        <span key={idx} className="px-1 text-slate-600 text-xs font-mono select-none">...</span>
                      )
                    ))}
                  </div>

                  {/* Next Page */}
                  <button
                    onClick={() => setStreamPage(p => Math.min(totalStreamPages, p + 1))}
                    disabled={currentStreamPage === totalStreamPages}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-semibold flex items-center gap-1 transition-all"
                  >
                    Next
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>

                  {/* Last Page */}
                  <button
                    onClick={() => setStreamPage(totalStreamPages)}
                    disabled={currentStreamPage === totalStreamPages}
                    className="p-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                    title="Last Page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-slate-900/90 border-t border-slate-800 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 backdrop-blur-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Supabase Audit Table Active</span>
          </div>
          <span className="text-slate-600">•</span>
          <span>Filtered Scope: <strong>{userSummaries.length} Users</strong> across Nkangala District Municipality</span>
          <span className="text-slate-600">•</span>
          <span className="text-slate-400">Strict Exclusion Rule: <strong className="text-indigo-300">mike@mzansiflow.co.za</strong> omitted</span>
          <span className="text-slate-600">•</span>
          <span className="text-indigo-300 font-medium">Paginated (20 / page)</span>
        </div>

        <div className="text-[11px] font-mono text-slate-500">
          Last Synced: {new Date().toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};
