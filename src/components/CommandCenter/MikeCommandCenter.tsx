import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  Users,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Clock,
  Database,
  Layers,
  BarChart3,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RefreshCw,
  Award,
  Target,
  Briefcase,
  GraduationCap,
  Eye,
  X,
  SlidersHorizontal,
  Check,
  Building2,
  Mail,
  Zap,
  UserCheck
} from 'lucide-react';
import type { User } from '../../types';
import { FinancialYearSwitcher } from '../FinancialYearSwitcher';

export interface CommandCenterUser {
  id: string;
  fullName: string;
  email: string;
  department: string;
  jobFunction: string;
  role: string;
  tenantId: string;
  hasPA: boolean;
  paCount: number;
  hasJSC: boolean;
  jscCount: number;
  hasKPA: boolean;
  kpaCount: number;
  hasKPI: boolean;
  kpiCount: number;
  hasPDP: boolean;
  pdpCount: number;
  activeModulesCount: number;
  complianceScore: number;
  lastUpdated?: string;
}

export interface CommandCenterSummary {
  totalUsers: number;
  usersWithPA: number;
  usersWithJSC: number;
  usersWithKPA: number;
  usersWithKPI: number;
  usersWithPDP: number;
  fullyCompliantUsers: number;
  paPercentage: number;
  jscPercentage: number;
  kpaPercentage: number;
  kpiPercentage: number;
  pdpPercentage: number;
  overallComplianceAvg: number;
}

interface MikeCommandCenterProps {
  currentUser: User;
  activeTenantId: string;
}

const PAGE_SIZE = 20;

export function MikeCommandCenter({ currentUser, activeTenantId }: MikeCommandCenterProps) {
  const [users, setUsers] = useState<CommandCenterUser[]>([]);
  const [summary, setSummary] = useState<CommandCenterSummary>({
    totalUsers: 0,
    usersWithPA: 0,
    usersWithJSC: 0,
    usersWithKPA: 0,
    usersWithKPI: 0,
    usersWithPDP: 0,
    fullyCompliantUsers: 0,
    paPercentage: 0,
    jscPercentage: 0,
    kpaPercentage: 0,
    kpiPercentage: 0,
    pdpPercentage: 0,
    overallComplianceAvg: 0
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedUser, setSelectedUser] = useState<CommandCenterUser | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'compliance' | 'department'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const [fetchError, setFetchError] = useState<string | null>(null);

  // Fetch matrix in real time
  const fetchMatrix = useCallback(async (isManualRefresh = false, signal?: AbortSignal) => {
    if (isManualRefresh) setIsRefreshing(true);
    const targetTenant = activeTenantId || currentUser?.tenantId || 'tenant-229';
    try {
      const res = await fetch(`/api/tenant/${encodeURIComponent(targetTenant)}/command-center-matrix?force=${isManualRefresh ? 'true' : 'false'}&t=${Date.now()}&userEmail=${encodeURIComponent(currentUser?.email || '')}`, {
        signal,
        headers: {
          'x-user-email': currentUser?.email || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          setUsers(data.users);
          if (data.summary) {
            setSummary(data.summary);
          }
          const now = new Date();
          setLastSyncedTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          setFetchError(null);
        }
      } else {
        setFetchError(`Server returned ${res.status}`);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Command center sync notice (retrying automatically):', err.message || err);
        setFetchError('Network connection syncing...');
      }
    } finally {
      setIsLoading(false);
      if (isManualRefresh) {
        setTimeout(() => setIsRefreshing(false), 500);
      }
    }
  }, [activeTenantId, currentUser?.tenantId, currentUser?.email]);

  // Initial load and live real-time polling every 6 seconds for fresh telemetry
  useEffect(() => {
    const controller = new AbortController();
    fetchMatrix(false, controller.signal);
    
    const interval = setInterval(() => {
      fetchMatrix(false, controller.signal);
    }, 6000);

    const handleForceRefresh = () => {
      fetchMatrix(true);
    };

    window.addEventListener('command-center-force-refresh', handleForceRefresh);
    window.addEventListener('nkangala-batch-restoration-complete', handleForceRefresh);

    return () => {
      controller.abort();
      clearInterval(interval);
      window.removeEventListener('command-center-force-refresh', handleForceRefresh);
      window.removeEventListener('nkangala-batch-restoration-complete', handleForceRefresh);
    };
  }, [fetchMatrix]);

  // Unique departments for filter
  const departments = useMemo(() => {
    const set = new Set<string>();
    users.forEach(u => {
      if (u.department && u.department.trim()) {
        set.add(u.department.trim());
      }
    });
    return Array.from(set).sort();
  }, [users]);

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    let result = [...users];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        (u.fullName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q) ||
        (u.department || '').toLowerCase().includes(q) ||
        (u.jobFunction || '').toLowerCase().includes(q)
      );
    }

    // Department filter
    if (departmentFilter !== 'all') {
      result = result.filter(u => (u.department || '').trim() === departmentFilter);
    }

    // Status filter
    if (statusFilter === 'pa') {
      result = result.filter(u => u.hasPA);
    } else if (statusFilter === 'no_pa') {
      result = result.filter(u => !u.hasPA);
    } else if (statusFilter === 'jsc') {
      result = result.filter(u => u.hasJSC);
    } else if (statusFilter === 'no_jsc') {
      result = result.filter(u => !u.hasJSC);
    } else if (statusFilter === 'kpa') {
      result = result.filter(u => u.hasKPA);
    } else if (statusFilter === 'no_kpa') {
      result = result.filter(u => !u.hasKPA);
    } else if (statusFilter === 'kpi') {
      result = result.filter(u => u.hasKPI);
    } else if (statusFilter === 'no_kpi') {
      result = result.filter(u => !u.hasKPI);
    } else if (statusFilter === 'pdp') {
      result = result.filter(u => u.hasPDP);
    } else if (statusFilter === 'no_pdp') {
      result = result.filter(u => !u.hasPDP);
    } else if (statusFilter === 'compliant') {
      result = result.filter(u => u.complianceScore === 100);
    } else if (statusFilter === 'incomplete') {
      result = result.filter(u => u.complianceScore < 100);
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'name') {
        const cmp = (a.fullName || '').localeCompare(b.fullName || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      } else if (sortBy === 'compliance') {
        const cmp = a.complianceScore - b.complianceScore;
        return sortOrder === 'asc' ? cmp : -cmp;
      } else if (sortBy === 'department') {
        const cmp = (a.department || '').localeCompare(b.department || '');
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return 0;
    });

    return result;
  }, [users, searchQuery, departmentFilter, statusFilter, sortBy, sortOrder]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, departmentFilter, statusFilter, sortBy, sortOrder]);

  // Pagination calculation (strictly 20 per page)
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return filteredUsers.slice(startIndex, startIndex + PAGE_SIZE);
  }, [filteredUsers, currentPage]);

  const startIndexDisplay = filteredUsers.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endIndexDisplay = Math.min(currentPage * PAGE_SIZE, filteredUsers.length);

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-3xl overflow-y-auto shadow-2xl p-6 lg:p-8 relative">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 pointer-events-none"></div>

      {/* Header Bar */}
      <div className="mb-6 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 uppercase tracking-widest flex items-center gap-1.5 font-mono">
              <Zap className="w-3 h-3 text-cyan-400 animate-pulse" />
              Real-Time Command Matrix • Executive Governance Stream
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-white uppercase tracking-tight flex items-center gap-3">
            <Activity className="w-7 h-7 text-cyan-400 animate-pulse" />
            Municipality Command Center
          </h2>
          <p className="text-slate-400 text-xs mt-1 font-mono tracking-wider">
            Live institutional governance: real-time monitoring of Performance Agreements, JSCs, KPAs, KPIs, and PDPs.
          </p>
        </div>

        {/* Action & Status Header Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-900/90 border border-slate-800 p-1.5 rounded-xl shadow-sm">
            <FinancialYearSwitcher />
          </div>

          {/* Live Sync Status Indicator */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl text-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <span className="text-slate-300 font-mono text-[11px]">
              Live <span className="text-slate-500">({lastSyncedTime || 'Syncing...'})</span>
            </span>
            <button
              onClick={() => fetchMatrix(true)}
              disabled={isRefreshing}
              title="Force Sync Live Data"
              className="ml-1 p-1 hover:bg-slate-800 text-slate-400 hover:text-cyan-400 rounded-lg transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Top Real-Time Compliance Counters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6 relative z-10">
        {/* Total Users */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'all' 
              ? 'bg-cyan-950/40 border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.15)]' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{summary.totalUsers}</div>
          <div className="text-[10px] text-cyan-400 font-medium mt-1">100% Municipal Personnel</div>
        </div>

        {/* Performance Agreements */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'pa' ? 'all' : 'pa')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'pa' 
              ? 'bg-emerald-950/40 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Agreements (PA)</span>
            <FileText className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {summary.usersWithPA}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {summary.totalUsers}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-emerald-300 font-bold">{summary.paPercentage}% Active</span>
            <span className="text-slate-500">{summary.totalUsers - summary.usersWithPA} Pending</span>
          </div>
        </div>

        {/* JSCs (Job Specific Competencies) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'jsc' ? 'all' : 'jsc')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'jsc' 
              ? 'bg-purple-950/40 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">JSC Modules</span>
            <Award className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-400 font-mono">
            {summary.usersWithJSC}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {summary.totalUsers}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-purple-300 font-bold">{summary.jscPercentage}% Active</span>
            <span className="text-slate-500">{summary.totalUsers - summary.usersWithJSC} Pending</span>
          </div>
        </div>

        {/* KPAs (Key Performance Areas) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'kpa' ? 'all' : 'kpa')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'kpa' 
              ? 'bg-blue-950/40 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">KPAs Set</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400 font-mono">
            {summary.usersWithKPA}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {summary.totalUsers}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-blue-300 font-bold">{summary.kpaPercentage}% Active</span>
            <span className="text-slate-500">{summary.totalUsers - summary.usersWithKPA} Pending</span>
          </div>
        </div>

        {/* KPIs (Key Performance Indicators) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'kpi' ? 'all' : 'kpi')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'kpi' 
              ? 'bg-amber-950/40 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">KPIs Target</span>
            <Target className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">
            {summary.usersWithKPI}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {summary.totalUsers}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-amber-300 font-bold">{summary.kpiPercentage}% Active</span>
            <span className="text-slate-500">{summary.totalUsers - summary.usersWithKPI} Pending</span>
          </div>
        </div>

        {/* PDPs (Personal Development Plans) */}
        <div 
          onClick={() => setStatusFilter(statusFilter === 'pdp' ? 'all' : 'pdp')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            statusFilter === 'pdp' 
              ? 'bg-rose-950/40 border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.15)]' 
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider">PDP Plans</span>
            <GraduationCap className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 font-mono">
            {summary.usersWithPDP}
            <span className="text-xs text-slate-400 font-normal ml-1">/ {summary.totalUsers}</span>
          </div>
          <div className="flex items-center justify-between mt-1 text-[10px]">
            <span className="text-rose-300 font-bold">{summary.pdpPercentage}% Active</span>
            <span className="text-slate-500">{summary.totalUsers - summary.usersWithPDP} Pending</span>
          </div>
        </div>
      </div>

      {/* Search, Filter, and Controls Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-4 relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-md">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by user name, email, department, or job title..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Sorting */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Department Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Departments ({departments.length})</option>
              {departments.map(d => (
                <option key={d} value={d} className="bg-slate-900 text-white">
                  {d}
                </option>
              ))}
            </select>
          </div>

          {/* Status Quick Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-transparent border-none text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="all" className="bg-slate-900 text-white">All Statuses</option>
              <option value="pa" className="bg-slate-900 text-white">Has Performance Agreement</option>
              <option value="no_pa" className="bg-slate-900 text-white">Missing Performance Agreement</option>
              <option value="jsc" className="bg-slate-900 text-white">Has JSC Competencies</option>
              <option value="no_jsc" className="bg-slate-900 text-white">Missing JSC Competencies</option>
              <option value="kpa" className="bg-slate-900 text-white">Has KPAs</option>
              <option value="kpi" className="bg-slate-900 text-white">Has KPIs</option>
              <option value="pdp" className="bg-slate-900 text-white">Has PDP</option>
              <option value="compliant" className="bg-slate-900 text-white">100% Fully Compliant (All 5)</option>
              <option value="incomplete" className="bg-slate-900 text-white">Incomplete (&lt;100%)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-transparent border-none text-slate-200 text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="name" className="bg-slate-900 text-white">Sort: User Name</option>
              <option value="compliance" className="bg-slate-900 text-white">Sort: Compliance Score</option>
              <option value="department" className="bg-slate-900 text-white">Sort: Department</option>
            </select>
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-cyan-400"
              title="Toggle Sort Direction"
            >
              {sortOrder.toUpperCase()}
            </button>
          </div>
        </div>
      </div>

      {/* Main Paginated User Compliance Roster */}
      <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative z-10 flex-1 flex flex-col mb-4">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="p-3.5 pl-5">#</th>
                <th className="p-3.5">User Full Name & Credentials</th>
                <th className="p-3.5">Department / Role</th>
                <th className="p-3.5 text-center">Performance Agreement</th>
                <th className="p-3.5 text-center">JSC (Competencies)</th>
                <th className="p-3.5 text-center">KPAs</th>
                <th className="p-3.5 text-center">KPIs</th>
                <th className="p-3.5 text-center">PDP</th>
                <th className="p-3.5 text-center">Compliance</th>
                <th className="p-3.5 pr-5 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {isLoading && users.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <Activity className="w-8 h-8 text-cyan-400 animate-pulse" />
                      <span className="text-xs uppercase font-mono tracking-widest text-cyan-400">Loading Municipal User Matrix...</span>
                    </div>
                  </td>
                </tr>
              ) : paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="p-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <AlertTriangle className="w-7 h-7 text-amber-400" />
                      <p className="text-sm font-bold text-white">No users match the active filter criteria</p>
                      <p className="text-xs text-slate-500">Try clearing your search query or selecting &quot;All Statuses&quot;.</p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setDepartmentFilter('all');
                          setStatusFilter('all');
                        }}
                        className="mt-2 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold transition"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u, index) => {
                  const itemIndex = (currentPage - 1) * PAGE_SIZE + index + 1;
                  return (
                    <tr
                      key={u.id ? `cc-user-${u.id}-${index}` : `cc-user-${u.email || 'user'}-${index}`}
                      className="hover:bg-slate-800/40 transition-colors group"
                    >
                      {/* Row Index */}
                      <td className="p-3.5 pl-5 font-mono text-[11px] text-slate-500 font-bold">
                        {itemIndex}
                      </td>

                      {/* User Name & Email */}
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs uppercase shadow-sm">
                            {(u.fullName || u.email).substring(0, 2)}
                          </div>
                          <div>
                            <div className="font-bold text-white group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                              {u.fullName}
                              {u.complianceScore === 100 && (
                                <span title="100% Fully Compliant" className="text-emerald-400">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5 text-slate-500" />
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Department & Job Title */}
                      <td className="p-3.5">
                        <div className="text-xs text-slate-200 font-medium truncate max-w-[180px]" title={u.department}>
                          {u.department}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-[180px]" title={u.jobFunction}>
                          {u.jobFunction}
                        </div>
                      </td>

                      {/* Performance Agreement */}
                      <td className="p-3.5 text-center">
                        {u.hasPA ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                            <Check className="w-3 h-3 text-emerald-400" />
                            {u.paCount > 0 ? `${u.paCount} Items` : 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/20 text-rose-400">
                            <X className="w-3 h-3 text-rose-400" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* JSC (Job Specific Competencies) */}
                      <td className="p-3.5 text-center">
                        {u.hasJSC ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 border border-purple-500/30 text-purple-400">
                            <Check className="w-3 h-3 text-purple-400" />
                            {u.jscCount > 0 ? `${u.jscCount} JSCs` : 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700/50">
                            <X className="w-3 h-3" />
                            Missing
                          </span>
                        )}
                      </td>

                      {/* KPAs */}
                      <td className="p-3.5 text-center">
                        {u.hasKPA ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                            <Check className="w-3 h-3 text-blue-400" />
                            {u.kpaCount > 0 ? `${u.kpaCount} KPAs` : 'Set'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700/50">
                            <X className="w-3 h-3" />
                            Missing
                          </span>
                        )}
                      </td>

                      {/* KPIs */}
                      <td className="p-3.5 text-center">
                        {u.hasKPI ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">
                            <Check className="w-3 h-3 text-amber-400" />
                            {u.kpiCount > 0 ? `${u.kpiCount} KPIs` : 'Target'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700/50">
                            <X className="w-3 h-3" />
                            Pending
                          </span>
                        )}
                      </td>

                      {/* PDP */}
                      <td className="p-3.5 text-center">
                        {u.hasPDP ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">
                            <Check className="w-3 h-3 text-rose-400" />
                            {u.pdpCount > 0 ? `${u.pdpCount} Goals` : 'Active'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700/50">
                            <X className="w-3 h-3" />
                            Missing
                          </span>
                        )}
                      </td>

                      {/* Compliance Score */}
                      <td className="p-3.5 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className={`text-xs font-mono font-black ${
                            u.complianceScore === 100 ? 'text-emerald-400' :
                            u.complianceScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                          }`}>
                            {u.complianceScore}%
                          </span>
                          <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                u.complianceScore === 100 ? 'bg-emerald-400' :
                                u.complianceScore >= 60 ? 'bg-amber-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${u.complianceScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Details View Button */}
                      <td className="p-3.5 pr-5 text-right">
                        <button
                          onClick={() => setSelectedUser(u)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold inline-flex items-center gap-1 transition"
                        >
                          <Eye className="w-3.5 h-3.5 text-cyan-400" />
                          Inspect
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Strict 20 Results Per Page Pagination Bar */}
        <div className="border-t border-slate-800 bg-slate-950/90 p-4 px-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="text-slate-400 text-[11px] font-mono">
            Showing <strong className="text-white">{startIndexDisplay}–{endIndexDisplay}</strong> of <strong className="text-cyan-400">{filteredUsers.length}</strong> municipal users
            <span className="ml-2 text-slate-500 font-sans">(Strictly 20 results per page)</span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* First Page */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              title="First Page"
            >
              <ChevronsLeft className="w-4 h-4" />
            </button>

            {/* Previous Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 pr-2.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px] font-semibold">Prev</span>
            </button>

            {/* Page Pill Indicators */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold font-mono transition ${
                    currentPage === pageNum
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-[0_0_10px_rgba(6,182,212,0.4)]'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Page */}
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1 pl-2.5"
            >
              <span className="text-[11px] font-semibold">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            {/* Last Page */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
              title="Last Page"
            >
              <ChevronsRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* User Inspection Modal Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg uppercase shadow-md">
                  {(selectedUser.fullName || selectedUser.email).substring(0, 2)}
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">{selectedUser.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-medium">
                      {selectedUser.department}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-cyan-300 font-mono">
                      {selectedUser.jobFunction}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Complete Module Breakdown */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Overall Institutional Compliance</span>
                <span className={`text-base font-black font-mono ${
                  selectedUser.complianceScore === 100 ? 'text-emerald-400' : 'text-amber-400'
                }`}>
                  {selectedUser.complianceScore}% ({selectedUser.activeModulesCount}/5 Modules)
                </span>
              </div>

              {/* Module Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* 1. Performance Agreement */}
                <div className={`p-4 rounded-xl border ${selectedUser.hasPA ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">Performance Agreement</span>
                    </div>
                    {selectedUser.hasPA ? (
                      <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">Active</span>
                    ) : (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">Missing</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedUser.hasPA ? `${selectedUser.paCount} performance scorecard items and commitments registered.` : 'No active performance agreement or draft filed.'}
                  </p>
                </div>

                {/* 2. JSC */}
                <div className={`p-4 rounded-xl border ${selectedUser.hasJSC ? 'bg-purple-950/20 border-purple-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-bold text-white">JSC Competencies</span>
                    </div>
                    {selectedUser.hasJSC ? (
                      <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/30">Active</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Missing</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedUser.hasJSC ? `${selectedUser.jscCount} Job Specific Competency frameworks allocated.` : 'Job Specific Competencies not configured for user.'}
                  </p>
                </div>

                {/* 3. KPAs */}
                <div className={`p-4 rounded-xl border ${selectedUser.hasKPA ? 'bg-blue-950/20 border-blue-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-bold text-white">Key Performance Areas</span>
                    </div>
                    {selectedUser.hasKPA ? (
                      <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/30">Set</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Missing</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedUser.hasKPA ? `${selectedUser.kpaCount} Strategic KPAs aligned with municipal SDBIP.` : 'No KPAs mapped to this official.'}
                  </p>
                </div>

                {/* 4. KPIs */}
                <div className={`p-4 rounded-xl border ${selectedUser.hasKPI ? 'bg-amber-950/20 border-amber-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-bold text-white">Performance Indicators (KPI)</span>
                    </div>
                    {selectedUser.hasKPI ? (
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">Target Set</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Missing</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedUser.hasKPI ? `${selectedUser.kpiCount} operational KPIs targeted with quarterly benchmarks.` : 'No active operational KPI targets assigned.'}
                  </p>
                </div>

                {/* 5. PDP */}
                <div className={`p-4 rounded-xl border sm:col-span-2 ${selectedUser.hasPDP ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-950 border-slate-800'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="w-4 h-4 text-rose-400" />
                      <span className="text-xs font-bold text-white">Personal Development Plan (PDP)</span>
                    </div>
                    {selectedUser.hasPDP ? (
                      <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/30">Active</span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">Missing</span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {selectedUser.hasPDP ? `${selectedUser.pdpCount} developmental interventions & training objectives scheduled.` : 'No Personal Development Plan logged for this official.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export const MunicipalityCommandCenter = MikeCommandCenter;
