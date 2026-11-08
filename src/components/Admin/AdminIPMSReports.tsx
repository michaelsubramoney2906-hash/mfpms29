import React, { useState, useEffect, useMemo } from 'react';
import {
  FileBarChart,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  Eye,
  X,
  FileText,
  Filter,
  UserCheck,
  ShieldCheck,
  ArrowUpDown,
  PieChart as PieChartIcon,
  BarChart3,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  Building2
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import type { User } from '../../types';
import { exportIpmsReportXlsxWithCharts } from '../../utils/xlsxWithChartsExport';

interface KpiDetailItem {
  index: number;
  id: string;
  kpiNo: string;
  kpiTitle: string;
  target: string;
  actual: string;
  selfScore: string;
  managerScore: string;
  poeDocsCount: number;
  poeDocNames: string[];
  reviewStatus: string;
  qPoeStatus: string;
  statusLabel: string;
  isNa: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  isAwaitingManager: boolean;
  isRevisionRequired: boolean;
  isDraftInProgress: boolean;
}

interface UserKpiReportRow {
  email: string;
  fullName: string;
  entity: 'Nkangala DM' | 'NEDA' | string;
  department: string;
  subDepartment?: string;
  jobFunction: string;
  manager: string;
  managerEmail: string;
  totalKpis: number;
  naKpis: number;
  applicableKpis: number;
  submittedKpis: number;
  notSubmittedKpis: number;
  approvedKpis: number;
  notApprovedKpis: number;
  awaitingManagerApprovalKpis: number;
  revisionRequiredKpis: number;
  draftInProgressKpis: number;
  submissionRate: number;
  approvalRate: number;
  overallStatus: string;
  kpiDetails: KpiDetailItem[];
}

interface ReportSummary {
  totalUsers: number;
  usersWithKpis: number;
  usersWithoutKpis: number;
  fullySubmittedUsers: number;
  partiallySubmittedUsers: number;
  notSubmittedUsers: number;
  fullyApprovedUsers: number;
  partiallyApprovedUsers: number;
  notApprovedUsers: number;
  totalKpisSystemWide: number;
  totalNaKpisSystemWide: number;
  totalApplicableKpisSystemWide: number;
  totalSubmittedKpisSystemWide: number;
  totalNotSubmittedKpisSystemWide: number;
  totalApprovedKpisSystemWide: number;
  totalNotApprovedKpisSystemWide: number;
  totalAwaitingManagerKpisSystemWide: number;
  quarter: string;
  generatedAt: string;
}

interface DepartmentStatRow {
  department: string;
  shortName: string;
  totalOfficials: number;
  officialsWithKpis: number;
  totalKpis: number;
  naKpis: number;
  applicableKpis: number;
  submittedKpis: number;
  notSubmittedKpis: number;
  approvedKpis: number;
  notApprovedKpis: number;
  awaitingManagerKpis: number;
  submissionRate: number;
  approvalRate: number;
}

interface AdminIPMSReportsProps {
  currentUser: User;
  activeTenantId: string;
}

const DEPT_GRADIENT_IDS = [
  'deptGrad0',
  'deptGrad1',
  'deptGrad2',
  'deptGrad3',
  'deptGrad4',
  'deptGrad5',
  'deptGrad6',
  'deptGrad7',
  'deptGrad8',
  'deptGrad9'
];

const DEPT_GRADIENT_STOPS = [
  { start: '#10b981', end: '#047857' },
  { start: '#3b82f6', end: '#1d4ed8' },
  { start: '#6366f1', end: '#4338ca' },
  { start: '#f59e0b', end: '#b45309' },
  { start: '#ec4899', end: '#be185d' },
  { start: '#14b8a6', end: '#0f766e' },
  { start: '#8b5cf6', end: '#5b21b6' },
  { start: '#f97316', end: '#c2410c' },
  { start: '#06b6d4', end: '#0e7490' },
  { start: '#64748b', end: '#334155' }
];

export function AdminIPMSReports({ activeTenantId }: AdminIPMSReportsProps) {
  const [quarter, setQuarter] = useState<'q1' | 'q2' | 'q3' | 'q4' | 'annual'>('q1');
  const [loading, setLoading] = useState<boolean>(true);
  const [exportingXlsx, setExportingXlsx] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [, setSummary] = useState<ReportSummary | null>(null);
  const [users, setUsers] = useState<UserKpiReportRow[]>([]);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [entityFilter, setEntityFilter] = useState<string>('ALL');
  const [departmentFilter, setDepartmentFilter] = useState<string>('ALL');
  const [activeChartDept, setActiveChartDept] = useState<string>('ALL_DEPARTMENTS');
  const [kpiPresenceFilter, setKpiPresenceFilter] = useState<'ALL' | 'WITH_KPIS' | 'WITHOUT_KPIS'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'totalKpis' | 'submitted' | 'notSubmitted' | 'approved' | 'notApproved'>('totalKpis');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [pageSize, setPageSize] = useState<number>(100);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [showCharts, setShowCharts] = useState<boolean>(true);

  const [selectedUserModal, setSelectedUserModal] = useState<UserKpiReportRow | null>(null);
  const [modalFilter, setModalFilter] = useState<'ALL' | 'SUBMITTED' | 'NOT_SUBMITTED' | 'APPROVED' | 'NOT_APPROVED' | 'NA'>('ALL');

  const fetchReport = async (selectedQuarter = quarter) => {
    setLoading(true);
    setError(null);
    try {
      const tenantSegment = activeTenantId || 'tenant-229';
      const res = await fetch(`/api/tenant/${encodeURIComponent(tenantSegment)}/admin/ipms-reports-summary?quarter=${encodeURIComponent(selectedQuarter)}&t=${Date.now()}`, {
        cache: 'no-store'
      });
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      const data = await res.json();
      setSummary(data.summary || null);
      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load IPMS Reports Summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(quarter);
  }, [quarter, activeTenantId]);

  const departmentsList = useMemo(() => {
    const map = new Map<string, number>();
    users.forEach(u => {
      if (entityFilter !== 'ALL' && u.entity !== entityFilter) return;
      const d = (u.department || '').trim();
      if (d) {
        map.set(d, (map.get(d) || 0) + 1);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([name, count]) => ({ name, count }));
  }, [users, entityFilter]);

  useEffect(() => {
    if (
      departmentFilter !== 'ALL' &&
      !departmentsList.some(d => d.name === departmentFilter)
    ) {
      setDepartmentFilter('ALL');
    }
  }, [departmentsList, departmentFilter]);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const list = users.filter(u => {
      if (entityFilter !== 'ALL' && u.entity !== entityFilter) return false;
      if (departmentFilter !== 'ALL' && u.department !== departmentFilter) return false;
      if (kpiPresenceFilter === 'WITH_KPIS' && u.totalKpis === 0) return false;
      if (kpiPresenceFilter === 'WITHOUT_KPIS' && u.totalKpis > 0) return false;

      if (statusFilter !== 'ALL') {
        if (statusFilter === 'SUBMITTED_ANY' && u.submittedKpis === 0) return false;
        if (statusFilter === 'FULLY_SUBMITTED' && !(u.applicableKpis > 0 && u.submittedKpis === u.applicableKpis)) return false;
        if (statusFilter === 'PARTIALLY_SUBMITTED' && !(u.applicableKpis > 0 && u.submittedKpis > 0 && u.submittedKpis < u.applicableKpis)) return false;
        if (statusFilter === 'NOT_SUBMITTED' && !(u.applicableKpis > 0 && u.submittedKpis === 0)) return false;
        if (statusFilter === 'FULLY_APPROVED' && !(u.applicableKpis > 0 && u.approvedKpis === u.applicableKpis)) return false;
        if (statusFilter === 'AWAITING_MANAGER' && u.awaitingManagerApprovalKpis === 0) return false;
        if (statusFilter === 'NOT_APPROVED' && !(u.applicableKpis > 0 && u.notApprovedKpis > 0)) return false;
      }

      if (q) {
        const matchName = (u.fullName || '').toLowerCase().includes(q);
        const matchEmail = (u.email || '').toLowerCase().includes(q);
        const matchDept = (u.department || '').toLowerCase().includes(q);
        const matchSubDept = (u.subDepartment || '').toLowerCase().includes(q);
        const matchJob = (u.jobFunction || '').toLowerCase().includes(q);
        const matchMgr = (u.manager || '').toLowerCase().includes(q) || (u.managerEmail || '').toLowerCase().includes(q);
        if (!matchName && !matchEmail && !matchDept && !matchSubDept && !matchJob && !matchMgr) return false;
      }

      return true;
    });

    list.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'name') {
        cmp = (a.fullName || '').localeCompare(b.fullName || '');
      } else if (sortBy === 'totalKpis') {
        cmp = a.totalKpis - b.totalKpis || a.submittedKpis - b.submittedKpis || (a.fullName || '').localeCompare(b.fullName || '');
      } else if (sortBy === 'submitted') {
        cmp = a.submittedKpis - b.submittedKpis || a.totalKpis - b.totalKpis;
      } else if (sortBy === 'notSubmitted') {
        cmp = a.notSubmittedKpis - b.notSubmittedKpis || a.totalKpis - b.totalKpis;
      } else if (sortBy === 'approved') {
        cmp = a.approvedKpis - b.approvedKpis || a.submittedKpis - b.submittedKpis;
      } else if (sortBy === 'notApproved') {
        cmp = a.notApprovedKpis - b.notApprovedKpis || a.totalKpis - b.totalKpis;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [users, searchQuery, entityFilter, departmentFilter, kpiPresenceFilter, statusFilter, sortBy, sortDir]);

  const entityScopedUsers = useMemo(() => {
    if (entityFilter === 'ALL') return users;
    return users.filter(u => u.entity === entityFilter);
  }, [users, entityFilter]);

  const filteredTotals = useMemo(() => {
    return filteredUsers.reduce(
      (acc, u) => {
        acc.totalUsers += 1;
        if (u.totalKpis > 0) acc.usersWithKpis += 1;
        if (u.applicableKpis > 0 && u.submittedKpis === u.applicableKpis) acc.fullySubmittedUsers += 1;
        if (u.applicableKpis > 0 && u.approvedKpis === u.applicableKpis) acc.fullyApprovedUsers += 1;
        acc.totalKpis += u.totalKpis;
        acc.naKpis += u.naKpis;
        acc.applicableKpis += u.applicableKpis;
        acc.submittedKpis += u.submittedKpis;
        acc.notSubmittedKpis += u.notSubmittedKpis;
        acc.approvedKpis += u.approvedKpis;
        acc.notApprovedKpis += u.notApprovedKpis;
        acc.awaitingManagerKpis += u.awaitingManagerApprovalKpis;
        return acc;
      },
      {
        totalUsers: 0,
        usersWithKpis: 0,
        fullySubmittedUsers: 0,
        fullyApprovedUsers: 0,
        totalKpis: 0,
        naKpis: 0,
        applicableKpis: 0,
        submittedKpis: 0,
        notSubmittedKpis: 0,
        approvedKpis: 0,
        notApprovedKpis: 0,
        awaitingManagerKpis: 0
      }
    );
  }, [filteredUsers]);

  // Departmental breakdown computed strictly from live filteredUsers (Read-Only)
  const departmentStats = useMemo<DepartmentStatRow[]>(() => {
    const map = new Map<string, DepartmentStatRow>();

    const formatShortDept = (dept: string) => {
      const lower = dept.toLowerCase();
      if (lower.includes('municipal manager')) return 'Office of MM';
      if (lower.includes('planning') && lower.includes('economic')) return 'PEDU / Planning';
      if (lower.includes('corporate')) return 'Corporate Svcs';
      if (lower.includes('financial') || lower.includes('finance')) return 'Financial Svcs';
      if (lower.includes('technical')) return 'Technical Svcs';
      if (lower.includes('community')) return 'Community Svcs';
      if (lower.includes('speaker')) return 'Speaker Office';
      if (lower.includes('executive mayor')) return 'Mayor Office';
      if (lower.includes('neda') || lower.includes('economic development agency')) return 'NEDA';
      return dept.length > 18 ? dept.slice(0, 16) + '…' : dept;
    };

    for (const u of filteredUsers) {
      const deptName = (u.department || 'Office of the Municipal Manager').trim();
      if (!map.has(deptName)) {
        map.set(deptName, {
          department: deptName,
          shortName: formatShortDept(deptName),
          totalOfficials: 0,
          officialsWithKpis: 0,
          totalKpis: 0,
          naKpis: 0,
          applicableKpis: 0,
          submittedKpis: 0,
          notSubmittedKpis: 0,
          approvedKpis: 0,
          notApprovedKpis: 0,
          awaitingManagerKpis: 0,
          submissionRate: 0,
          approvalRate: 0
        });
      }
      const row = map.get(deptName)!;
      row.totalOfficials += 1;
      if (u.totalKpis > 0) row.officialsWithKpis += 1;
      row.totalKpis += u.totalKpis;
      row.naKpis += u.naKpis;
      row.applicableKpis += u.applicableKpis;
      row.submittedKpis += u.submittedKpis;
      row.notSubmittedKpis += u.notSubmittedKpis;
      row.approvedKpis += u.approvedKpis;
      row.notApprovedKpis += u.notApprovedKpis;
      row.awaitingManagerKpis += u.awaitingManagerApprovalKpis;
    }

    const result = Array.from(map.values()).map(d => ({
      ...d,
      submissionRate: d.applicableKpis > 0 ? Math.round((d.submittedKpis / d.applicableKpis) * 100) : 0,
      approvalRate: d.applicableKpis > 0 ? Math.round((d.approvedKpis / d.applicableKpis) * 100) : 0
    }));

    result.sort((a, b) => b.totalKpis - a.totalKpis || b.totalOfficials - a.totalOfficials);
    return result;
  }, [filteredUsers]);

  // Group individual officials by department for the Per-Department Individual Bar Graphs
  const departmentIndividualGroups = useMemo(() => {
    const targetDepts =
      departmentFilter !== 'ALL'
        ? departmentStats.filter(d => d.department === departmentFilter)
        : activeChartDept !== 'ALL_DEPARTMENTS'
        ? departmentStats.filter(d => d.department === activeChartDept)
        : departmentStats;

    return targetDepts.map(deptStat => {
      const officials = filteredUsers
        .filter(u => u.department === deptStat.department)
        .sort(
          (a, b) =>
            b.totalKpis - a.totalKpis ||
            b.submittedKpis - a.submittedKpis ||
            (a.fullName || '').localeCompare(b.fullName || '')
        )
        .map(u => ({
          ...u,
          shortOfficialName:
            u.fullName.length > 20 ? u.fullName.slice(0, 18) + '…' : u.fullName
        }));

      return {
        deptStat,
        officials
      };
    });
  }, [departmentStats, filteredUsers, departmentFilter, activeChartDept]);

  const submissionPieData = useMemo(() => {
    return [
      { name: 'KPIs Submitted', value: filteredTotals.submittedKpis, gradientId: 'pieGradSubmitted', color: '#2563eb' },
      { name: 'KPIs Not Submitted', value: filteredTotals.notSubmittedKpis, gradientId: 'pieGradNotSubmitted', color: '#f59e0b' },
      { name: 'Not Applicable (N/A)', value: filteredTotals.naKpis, gradientId: 'pieGradNa', color: '#64748b' }
    ].filter(d => d.value > 0);
  }, [filteredTotals]);

  const approvalPieData = useMemo(() => {
    const unsubmittedOrRejected = Math.max(0, filteredTotals.notApprovedKpis - filteredTotals.awaitingManagerKpis);
    return [
      { name: 'Approved by Manager', value: filteredTotals.approvedKpis, gradientId: 'pieGradApproved', color: '#10b981' },
      { name: 'Awaiting Manager Approval', value: filteredTotals.awaitingManagerKpis, gradientId: 'pieGradAwaiting', color: '#3b82f6' },
      { name: 'Not Approved / Unsubmitted', value: unsubmittedOrRejected, gradientId: 'pieGradUnapproved', color: '#f43f5e' }
    ].filter(d => d.value > 0);
  }, [filteredTotals]);

  const departmentPieData = useMemo(() => {
    return departmentStats
      .filter(d => d.applicableKpis > 0)
      .map((d, idx) => ({
        name: d.department,
        shortName: d.shortName,
        value: d.applicableKpis,
        submitted: d.submittedKpis,
        approved: d.approvedKpis,
        gradientId: DEPT_GRADIENT_IDS[idx % DEPT_GRADIENT_IDS.length],
        color: DEPT_GRADIENT_STOPS[idx % DEPT_GRADIENT_STOPS.length].start
      }));
  }, [departmentStats]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredUsers.slice(start, start + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, entityFilter, departmentFilter, kpiPresenceFilter, statusFilter, pageSize]);

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortDir(column === 'name' ? 'asc' : 'desc');
    }
  };

  // Multi-Sheet Excel (.xlsx) Export with Embedded Gradient Pie Charts & Per-Department Individual Bar Graphs
  const handleExportXlsx = async () => {
    if (exportingXlsx) return;
    setExportingXlsx(true);
    try {
      await exportIpmsReportXlsxWithCharts({
        quarter,
        entityFilter,
        departmentStats,
        filteredUsers,
        filteredTotals
      });
    } finally {
      setExportingXlsx(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Fully Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Partially Approved':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'Awaiting Manager Approval':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Partially Submitted':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Revision Required':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'In Progress (Draft)':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'Not Submitted':
        return 'bg-slate-200 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200';
    }
  };

  const modalFilteredKpis = useMemo(() => {
    if (!selectedUserModal) return [];
    return selectedUserModal.kpiDetails.filter(k => {
      if (modalFilter === 'SUBMITTED') return !k.isNa && k.isSubmitted;
      if (modalFilter === 'NOT_SUBMITTED') return !k.isNa && !k.isSubmitted;
      if (modalFilter === 'APPROVED') return !k.isNa && k.isApproved;
      if (modalFilter === 'NOT_APPROVED') return !k.isNa && !k.isApproved;
      if (modalFilter === 'NA') return k.isNa;
      return true;
    });
  }, [selectedUserModal, modalFilter]);

  return (
    <div className="flex flex-col h-full bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden shadow-xl">
      {/* Header */}
      <div className="bg-slate-900 text-white px-6 py-5 shrink-0 flex flex-wrap items-center justify-between gap-4 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl">
            <FileBarChart className="w-7 h-7 text-[#00D65B]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl font-black tracking-tight text-white">
                IPMS Reports — KPI Submissions & Approvals Per User
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-[#00D65B] border border-emerald-500/30 rounded-md">
                Read-Only Live Supabase Ledger
              </span>
            </div>
            <p className="text-slate-400 text-xs font-medium mt-1">
              Live per-official and per-department breakdown of Submitted vs. Not Submitted and Approved vs. Not Approved KPIs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Quarter Tabs */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            {(['q1', 'q2', 'q3', 'q4', 'annual'] as const).map(qKey => (
              <button
                key={qKey}
                onClick={() => setQuarter(qKey)}
                className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                  quarter === qKey
                    ? 'bg-[#00D65B] text-slate-950 shadow'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {qKey === 'annual' ? 'Annual' : qKey.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCharts(prev => !prev)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer"
          >
            <BarChart3 className="w-4 h-4 text-[#00D65B]" />
            {showCharts ? 'Hide Charts' : 'Show Charts'}
            {showCharts ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => fetchReport(quarter)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#00D65B]' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportXlsx}
            disabled={loading || exportingXlsx || filteredUsers.length === 0}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00D65B] hover:bg-emerald-400 text-slate-950 text-xs font-black transition cursor-pointer disabled:opacity-50 shadow-md"
          >
            <FileSpreadsheet className="w-4 h-4" />
            {exportingXlsx
              ? 'Generating Excel + Charts...'
              : `Export Excel (.xlsx + Charts) (${filteredUsers.length})`}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-4 py-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-bold">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => fetchReport(quarter)}
              className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Executive Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Total Users */}
          <div className="bg-gradient-to-br from-white via-white to-slate-100/80 border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Officials in Current View
              </span>
              <Users className="w-4 h-4 text-slate-700" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? '...' : filteredTotals.totalUsers.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-600 pt-2 border-t border-slate-100">
              <span className="text-emerald-700 font-bold">
                {loading ? '—' : filteredTotals.usersWithKpis} With KPIs
              </span>
              <span className="text-slate-400">
                {loading ? '—' : filteredTotals.totalUsers - filteredTotals.usersWithKpis} With 0 KPIs
              </span>
            </div>
          </div>

          {/* Card 2: Total KPIs */}
          <div className="bg-gradient-to-br from-white via-white to-indigo-50/50 border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Total Assigned KPIs ({quarter.toUpperCase()})
              </span>
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-black text-slate-900">
              {loading ? '...' : filteredTotals.totalKpis.toLocaleString()}
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100">
              <span className="text-indigo-700 font-bold">
                {loading ? '—' : filteredTotals.applicableKpis.toLocaleString()} Applicable
              </span>
              <span className="text-slate-500">
                {loading ? '—' : filteredTotals.naKpis.toLocaleString()} N/A
              </span>
            </div>
          </div>

          {/* Card 3: Submitted vs Not Submitted */}
          <div className="bg-gradient-to-br from-white via-white to-blue-50/50 border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Submitted vs. Not Submitted
              </span>
              <UserCheck className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-black text-blue-700">
                  {loading ? '...' : filteredTotals.submittedKpis.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-blue-600 ml-1">Submitted</span>
              </div>
              <span className="text-slate-300 font-bold">/</span>
              <div>
                <span className="text-xl font-black text-amber-700">
                  {loading ? '...' : filteredTotals.notSubmittedKpis.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-amber-700 ml-1">Not Submitted</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100">
              <span className="text-slate-600">
                Submission Rate:{' '}
                <strong className="text-slate-900">
                  {filteredTotals.applicableKpis > 0
                    ? `${Math.round((filteredTotals.submittedKpis / filteredTotals.applicableKpis) * 100)}%`
                    : '0%'}
                </strong>
              </span>
              <span className="text-blue-700 font-bold">
                {loading ? '' : `${filteredTotals.fullySubmittedUsers} Users 100% Submitted`}
              </span>
            </div>
          </div>

          {/* Card 4: Approved vs Not Approved */}
          <div className="bg-gradient-to-br from-white via-white to-emerald-50/50 border border-slate-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Approved vs. Not Approved
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-3">
              <div>
                <span className="text-2xl font-black text-emerald-700">
                  {loading ? '...' : filteredTotals.approvedKpis.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-emerald-700 ml-1">Approved</span>
              </div>
              <span className="text-slate-300 font-bold">/</span>
              <div>
                <span className="text-xl font-black text-rose-700">
                  {loading ? '...' : filteredTotals.notApprovedKpis.toLocaleString()}
                </span>
                <span className="text-xs font-bold text-rose-700 ml-1">Not Approved</span>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-semibold pt-2 border-t border-slate-100">
              <span className="text-slate-600">
                Approval Rate:{' '}
                <strong className="text-slate-900">
                  {filteredTotals.applicableKpis > 0
                    ? `${Math.round((filteredTotals.approvedKpis / filteredTotals.applicableKpis) * 100)}%`
                    : '0%'}
                </strong>
              </span>
              <span className="text-amber-700 font-bold">
                {loading ? '' : `${filteredTotals.awaitingManagerKpis} Awaiting Manager`}
              </span>
            </div>
          </div>
        </div>

        {/* Departmental Pie & Individual-Officials Bar Graphs with SVG Gradient Shading */}
        {showCharts && !loading && (
          <div className="space-y-4">
            {/* Row 1: Individual Officials Bar Graphs Per Department */}
            <div className="bg-gradient-to-br from-white via-slate-50/50 to-emerald-50/20 border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#00D65B]" />
                    Individual Officials Bar Graphs Per Department ({quarter.toUpperCase()})
                  </h2>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Plotting every individual official within each Department / Directorate — Submitted vs. Not Submitted and Approved vs. Not Approved KPIs (click any official’s bar to inspect their KPIs)
                  </p>
                </div>

                {/* Department Selector Tabs for Individual Bar Graphs */}
                {departmentFilter === 'ALL' ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setActiveChartDept('ALL_DEPARTMENTS')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition cursor-pointer ${
                        activeChartDept === 'ALL_DEPARTMENTS'
                          ? 'bg-slate-900 text-white shadow'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      All Departments ({departmentStats.length})
                    </button>
                    {departmentStats.map(d => (
                      <button
                        key={d.department}
                        onClick={() => setActiveChartDept(d.department)}
                        className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                          activeChartDept === d.department
                            ? 'bg-[#00D65B] text-slate-950 font-black shadow'
                            : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {d.shortName} ({d.totalOfficials})
                      </button>
                    ))}
                  </div>
                ) : (
                  <button
                    onClick={() => setDepartmentFilter('ALL')}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                  >
                    Clear Department Filter ({departmentFilter})
                  </button>
                )}
              </div>

              {/* Per-Department Individual Officials Bar Graph Cards */}
              <div className="space-y-5">
                {departmentIndividualGroups.map(({ deptStat, officials }, groupIdx) => {
                  const minChartWidth = Math.max(760, officials.length * 68);
                  return (
                    <div
                      key={deptStat.department}
                      className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 rounded-lg bg-slate-900 text-[#00D65B]">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900">
                                {deptStat.department}
                              </h3>
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-black">
                                {deptStat.totalOfficials} Officials ({deptStat.officialsWithKpis} With KPIs)
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                              Total KPIs: <strong className="text-slate-800">{deptStat.totalKpis}</strong> ({deptStat.applicableKpis} Applicable) •{' '}
                              <span className="text-blue-700 font-bold">{deptStat.submittedKpis} Submitted</span> vs{' '}
                              <span className="text-amber-700 font-bold">{deptStat.notSubmittedKpis} Not Submitted</span> •{' '}
                              <span className="text-emerald-700 font-bold">{deptStat.approvedKpis} Approved</span> vs{' '}
                              <span className="text-rose-700 font-bold">{deptStat.notApprovedKpis} Not Approved</span>
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-[11px] font-black">
                          <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-800 border border-blue-200">
                            Submission: {deptStat.submissionRate}%
                          </span>
                          <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Approval: {deptStat.approvalRate}%
                          </span>
                        </div>
                      </div>

                      <div className="overflow-x-auto pb-1">
                        <div style={{ minWidth: `${minChartWidth}px`, height: '310px' }}>
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={officials}
                              margin={{ top: 12, right: 20, left: 0, bottom: 58 }}
                              onClick={(state: any) => {
                                const clickedUser = state?.activePayload?.[0]?.payload as UserKpiReportRow | undefined;
                                if (clickedUser) {
                                  setSelectedUserModal(clickedUser);
                                  setModalFilter('ALL');
                                }
                              }}
                            >
                              <defs>
                                <linearGradient id={`gradSub_${groupIdx}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.95} />
                                  <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.85} />
                                </linearGradient>
                                <linearGradient id={`gradNotSub_${groupIdx}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.95} />
                                  <stop offset="100%" stopColor="#d97706" stopOpacity={0.85} />
                                </linearGradient>
                                <linearGradient id={`gradApp_${groupIdx}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.95} />
                                  <stop offset="100%" stopColor="#047857" stopOpacity={0.85} />
                                </linearGradient>
                                <linearGradient id={`gradNotApp_${groupIdx}`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#fb7185" stopOpacity={0.95} />
                                  <stop offset="100%" stopColor="#be123c" stopOpacity={0.85} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                              <XAxis
                                dataKey="shortOfficialName"
                                tick={{ fontSize: 10, fontWeight: 700, fill: '#1e293b' }}
                                angle={-32}
                                textAnchor="end"
                                interval={0}
                                height={68}
                              />
                              <YAxis
                                allowDecimals={false}
                                tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }}
                              />
                              <Tooltip
                                contentStyle={{
                                  backgroundColor: '#0f172a',
                                  borderColor: '#1e293b',
                                  borderRadius: '12px',
                                  color: '#f8fafc',
                                  fontSize: '12px',
                                  fontWeight: 700
                                }}
                                labelFormatter={(_label, payload) => {
                                  const row = payload?.[0]?.payload as UserKpiReportRow | undefined;
                                  if (!row) return String(_label);
                                  return `${row.fullName} (${row.jobFunction}) — Total: ${row.totalKpis} KPIs (${row.applicableKpis} Applicable, ${row.naKpis} N/A)`;
                                }}
                              />
                              <Legend
                                wrapperStyle={{ fontSize: '11px', fontWeight: 800, paddingTop: '6px' }}
                              />
                              <Bar
                                dataKey="submittedKpis"
                                name="KPIs Submitted"
                                fill={`url(#gradSub_${groupIdx})`}
                                radius={[5, 5, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="notSubmittedKpis"
                                name="KPIs Not Submitted"
                                fill={`url(#gradNotSub_${groupIdx})`}
                                radius={[5, 5, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="approvedKpis"
                                name="KPIs Approved"
                                fill={`url(#gradApp_${groupIdx})`}
                                radius={[5, 5, 0, 0]}
                                cursor="pointer"
                              />
                              <Bar
                                dataKey="notApprovedKpis"
                                name="KPIs Not Approved"
                                fill={`url(#gradNotApp_${groupIdx})`}
                                radius={[5, 5, 0, 0]}
                                cursor="pointer"
                              />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Row 2: Three Gradient-Shaded Pie / Donut Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Pie 1: Submitted vs Not Submitted */}
              <div className="bg-gradient-to-br from-white via-white to-blue-50/40 border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <PieChartIcon className="w-4 h-4 text-blue-600" />
                      KPI Submission Ratio
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Submitted vs. Not Submitted vs. N/A
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-black">
                    {filteredTotals.applicableKpis > 0
                      ? `${Math.round((filteredTotals.submittedKpis / filteredTotals.applicableKpis) * 100)}%`
                      : '0%'}
                  </span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="pieGradSubmitted" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#60a5fa" />
                          <stop offset="100%" stopColor="#1d4ed8" />
                        </linearGradient>
                        <linearGradient id="pieGradNotSubmitted" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fcd34d" />
                          <stop offset="100%" stopColor="#d97706" />
                        </linearGradient>
                        <linearGradient id="pieGradNa" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#94a3b8" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={submissionPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {submissionPieData.map(entry => (
                          <Cell
                            key={entry.name}
                            fill={`url(#${entry.gradientId})`}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie 2: Approved vs Not Approved */}
              <div className="bg-gradient-to-br from-white via-white to-emerald-50/40 border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <PieChartIcon className="w-4 h-4 text-emerald-600" />
                      Manager Approval Ratio
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Approved vs. Awaiting Manager vs. Unapproved
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-xs font-black">
                    {filteredTotals.applicableKpis > 0
                      ? `${Math.round((filteredTotals.approvedKpis / filteredTotals.applicableKpis) * 100)}%`
                      : '0%'}
                  </span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        <linearGradient id="pieGradApproved" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#047857" />
                        </linearGradient>
                        <linearGradient id="pieGradAwaiting" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#38bdf8" />
                          <stop offset="100%" stopColor="#0369a1" />
                        </linearGradient>
                        <linearGradient id="pieGradUnapproved" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#fb7185" />
                          <stop offset="100%" stopColor="#be123c" />
                        </linearGradient>
                      </defs>
                      <Pie
                        data={approvalPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={52}
                        outerRadius={82}
                        paddingAngle={3}
                      >
                        {approvalPieData.map(entry => (
                          <Cell
                            key={entry.name}
                            fill={`url(#${entry.gradientId})`}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Pie 3: Applicable KPIs by Department */}
              <div className="bg-gradient-to-br from-white via-white to-indigo-50/40 border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                      <PieChartIcon className="w-4 h-4 text-indigo-600" />
                      Applicable KPIs by Department
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Share of active quarter KPIs across directorates
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-xs font-black">
                    {departmentPieData.length} Depts
                  </span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <defs>
                        {DEPT_GRADIENT_IDS.map((id, i) => (
                          <linearGradient key={id} id={id} x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor={DEPT_GRADIENT_STOPS[i].start} />
                            <stop offset="100%" stopColor={DEPT_GRADIENT_STOPS[i].end} />
                          </linearGradient>
                        ))}
                      </defs>
                      <Pie
                        data={departmentPieData}
                        dataKey="value"
                        nameKey="shortName"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={80}
                        paddingAngle={2}
                      >
                        {departmentPieData.map(entry => (
                          <Cell
                            key={entry.name}
                            fill={`url(#${entry.gradientId})`}
                            stroke="#ffffff"
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#0f172a',
                          borderColor: '#1e293b',
                          borderRadius: '10px',
                          color: '#ffffff',
                          fontSize: '12px',
                          fontWeight: 700
                        }}
                        formatter={(val: any, _name: any, props: any) => {
                          const p = props?.payload;
                          return [
                            `${val} Applicable (${p?.submitted ?? 0} Submitted, ${p?.approved ?? 0} Approved)`,
                            p?.name || 'Department'
                          ];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 700 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Search */}
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by official name, email, department, designation, or manager..."
                className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-slate-900 text-slate-900"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Entity Filter */}
            <div>
              <select
                value={entityFilter}
                onChange={e => setEntityFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">All Entities ({users.length} Officials)</option>
                <option value="Nkangala DM">
                  Nkangala District Municipality ({users.filter(u => u.entity === 'Nkangala DM').length})
                </option>
                <option value="NEDA">
                  NEDA ({users.filter(u => u.entity === 'NEDA').length})
                </option>
              </select>
            </div>

            {/* KPI Presence Filter */}
            <div>
              <select
                value={kpiPresenceFilter}
                onChange={e => setKpiPresenceFilter(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">Every User ({entityScopedUsers.length})</option>
                <option value="WITH_KPIS">Users With Assigned KPIs ({entityScopedUsers.filter(u => u.totalKpis > 0).length})</option>
                <option value="WITHOUT_KPIS">Users With 0 KPIs ({entityScopedUsers.filter(u => u.totalKpis === 0).length})</option>
              </select>
            </div>

            {/* Workflow Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-slate-900"
              >
                <option value="ALL">All Submission / Approval Statuses</option>
                <option value="SUBMITTED_ANY">Has Submitted KPIs (1 or more)</option>
                <option value="FULLY_SUBMITTED">100% Submitted by Official</option>
                <option value="PARTIALLY_SUBMITTED">Partially Submitted by Official</option>
                <option value="NOT_SUBMITTED">0 Submitted (Not Submitted)</option>
                <option value="FULLY_APPROVED">100% Approved by Line Manager</option>
                <option value="AWAITING_MANAGER">Awaiting Line Manager Approval</option>
                <option value="NOT_APPROVED">Has Unapproved KPIs</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-[11px] font-bold text-slate-500">Department (Canonical Directorate):</span>
              <select
                value={departmentFilter}
                onChange={e => setDepartmentFilter(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none"
              >
                <option value="ALL">All Canonical Departments ({departmentsList.length})</option>
                {departmentsList.map(dept => (
                  <option key={dept.name} value={dept.name}>
                    {dept.name} ({dept.count} Officials)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <span>
                Showing <strong>{paginatedUsers.length}</strong> of <strong>{filteredUsers.length}</strong> users
              </span>
              <select
                value={pageSize}
                onChange={e => setPageSize(Number(e.target.value))}
                className="px-2.5 py-1 text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg text-slate-800"
              >
                <option value={50}>50 per page</option>
                <option value={100}>100 per page</option>
                <option value={250}>250 per page</option>
                <option value={1000}>Show All ({filteredUsers.length})</option>
              </select>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                  <th className="py-3.5 px-3 w-10 text-center">#</th>
                  <th
                    onClick={() => handleSort('name')}
                    className="py-3.5 px-4 cursor-pointer hover:bg-slate-800 transition select-none"
                  >
                    <div className="flex items-center gap-1.5">
                      Official (User)
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4">Department & Designation</th>
                  <th className="py-3.5 px-4">Line Manager (Approver)</th>
                  <th
                    onClick={() => handleSort('totalKpis')}
                    className="py-3.5 px-3 text-center cursor-pointer hover:bg-slate-800 transition select-none"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Total KPIs
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('submitted')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-800 transition select-none bg-blue-950/50"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Submitted vs. Not Submitted
                      <ArrowUpDown className="w-3.5 h-3.5 text-blue-300" />
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('approved')}
                    className="py-3.5 px-4 text-center cursor-pointer hover:bg-slate-800 transition select-none bg-emerald-950/50"
                  >
                    <div className="flex items-center justify-center gap-1">
                      Approved vs. Not Approved
                      <ArrowUpDown className="w-3.5 h-3.5 text-emerald-300" />
                    </div>
                  </th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-bold">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-slate-700" />
                      Calculating live KPI submission and approval counts for every user from Supabase...
                    </td>
                  </tr>
                ) : paginatedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500 font-bold">
                      No users match the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((u, idx) => {
                    const rowIndex = (currentPage - 1) * pageSize + idx + 1;
                    return (
                      <tr
                        key={u.email}
                        className="hover:bg-slate-50/90 transition"
                      >
                        <td className="py-3 px-3 text-center font-bold text-slate-400">
                          {rowIndex}
                        </td>

                        {/* Official */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-slate-900">{u.fullName}</span>
                            <span
                              className={`px-1.5 py-0.5 text-[9px] font-black uppercase rounded border ${
                                u.entity === 'NEDA'
                                  ? 'bg-amber-50 text-amber-800 border-amber-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              {u.entity}
                            </span>
                          </div>
                          <div className="text-[11px] font-medium text-slate-500">{u.email}</div>
                        </td>

                        {/* Department & Designation */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{u.department}</div>
                          {u.subDepartment && u.subDepartment !== u.department && (
                            <div className="text-[10px] font-semibold text-indigo-700">
                              Unit: {u.subDepartment}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-500">{u.jobFunction}</div>
                        </td>

                        {/* Line Manager */}
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800">{u.manager || '—'}</div>
                          {u.managerEmail && (
                            <div className="text-[11px] text-slate-500">{u.managerEmail}</div>
                          )}
                        </td>

                        {/* Total KPIs */}
                        <td className="py-3 px-3 text-center">
                          <div className="font-black text-sm text-slate-900">{u.totalKpis}</div>
                          {u.totalKpis > 0 && (
                            <div className="text-[10px] font-semibold text-slate-500">
                              {u.applicableKpis} App {u.naKpis > 0 ? `• ${u.naKpis} N/A` : ''}
                            </div>
                          )}
                        </td>

                        {/* Submitted vs Not Submitted */}
                        <td className="py-3 px-4 bg-blue-50/30">
                          {u.applicableKpis > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[11px] border border-blue-200">
                                  {u.submittedKpis} Submitted
                                </span>
                                <span className="text-slate-300 font-bold">vs</span>
                                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[11px] border border-amber-200">
                                  {u.notSubmittedKpis} Not Submitted
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-500 to-blue-700 h-full transition-all"
                                  style={{ width: `${u.submissionRate}%` }}
                                />
                              </div>
                              <div className="text-center text-[10px] font-bold text-slate-600">
                                {u.submissionRate}% Submitted
                                {u.draftInProgressKpis > 0 ? ` (${u.draftInProgressKpis} in draft)` : ''}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-slate-400 font-semibold">—</div>
                          )}
                        </td>

                        {/* Approved vs Not Approved */}
                        <td className="py-3 px-4 bg-emerald-50/30">
                          {u.applicableKpis > 0 ? (
                            <div className="space-y-1.5">
                              <div className="flex items-center justify-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[11px] border border-emerald-200">
                                  {u.approvedKpis} Approved
                                </span>
                                <span className="text-slate-300 font-bold">vs</span>
                                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-black text-[11px] border border-rose-200">
                                  {u.notApprovedKpis} Not Approved
                                </span>
                              </div>
                              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-emerald-500 to-emerald-700 h-full transition-all"
                                  style={{ width: `${u.approvalRate}%` }}
                                />
                              </div>
                              <div className="text-center text-[10px] font-bold text-slate-600">
                                {u.approvalRate}% Approved
                                {u.awaitingManagerApprovalKpis > 0
                                  ? ` • ${u.awaitingManagerApprovalKpis} Awaiting Mgr`
                                  : ''}
                              </div>
                            </div>
                          ) : (
                            <div className="text-center text-slate-400 font-semibold">—</div>
                          )}
                        </td>

                        {/* Overall Status */}
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-[10px] font-black uppercase border ${getStatusBadgeStyle(
                              u.overallStatus
                            )}`}
                          >
                            {u.overallStatus}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedUserModal(u);
                              setModalFilter('ALL');
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5 text-[#00D65B]" />
                            Inspect ({u.totalKpis})
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-bold text-slate-600">
              <div>
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Per-User KPI Drill-Down Modal */}
      {selectedUserModal && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-black">{selectedUserModal.fullName}</h2>
                  <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-500/20 text-[#00D65B] border border-emerald-500/30 rounded">
                    {selectedUserModal.entity}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">
                    {selectedUserModal.email}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-1">
                  <strong className="text-white">Department:</strong> {selectedUserModal.department} •{' '}
                  <strong className="text-white">Designation:</strong> {selectedUserModal.jobFunction} •{' '}
                  <strong className="text-white">Line Manager:</strong> {selectedUserModal.manager || '—'}
                </p>
              </div>
              <button
                onClick={() => setSelectedUserModal(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Summary Strip */}
            <div className="px-6 py-3 bg-slate-100 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => setModalFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    modalFilter === 'ALL'
                      ? 'bg-slate-900 text-white'
                      : 'bg-white text-slate-700 border border-slate-200'
                  }`}
                >
                  All KPIs ({selectedUserModal.totalKpis})
                </button>
                <button
                  onClick={() => setModalFilter('SUBMITTED')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    modalFilter === 'SUBMITTED'
                      ? 'bg-blue-700 text-white'
                      : 'bg-blue-50 text-blue-800 border border-blue-200'
                  }`}
                >
                  Submitted ({selectedUserModal.submittedKpis})
                </button>
                <button
                  onClick={() => setModalFilter('NOT_SUBMITTED')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    modalFilter === 'NOT_SUBMITTED'
                      ? 'bg-amber-600 text-white'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  Not Submitted ({selectedUserModal.notSubmittedKpis})
                </button>
                <button
                  onClick={() => setModalFilter('APPROVED')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    modalFilter === 'APPROVED'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  }`}
                >
                  Approved ({selectedUserModal.approvedKpis})
                </button>
                <button
                  onClick={() => setModalFilter('NOT_APPROVED')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                    modalFilter === 'NOT_APPROVED'
                      ? 'bg-rose-700 text-white'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  Not Approved ({selectedUserModal.notApprovedKpis})
                </button>
                {selectedUserModal.naKpis > 0 && (
                  <button
                    onClick={() => setModalFilter('NA')}
                    className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                      modalFilter === 'NA'
                        ? 'bg-slate-700 text-white'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    N/A ({selectedUserModal.naKpis})
                  </button>
                )}
              </div>

              <div className="text-xs font-bold text-slate-600">
                Period: <strong className="text-slate-900">{quarter.toUpperCase()}</strong>
              </div>
            </div>

            {/* Modal KPI Table */}
            <div className="flex-1 overflow-y-auto p-6">
              {selectedUserModal.totalKpis === 0 ? (
                <div className="py-12 text-center text-slate-500 font-bold">
                  This official currently has 0 KPIs assigned in Supabase.
                </div>
              ) : (
                <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <thead>
                    <tr className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider">
                      <th className="py-3 px-3 w-16">KPI #</th>
                      <th className="py-3 px-4">KPI Description</th>
                      <th className="py-3 px-3 text-center">Target</th>
                      <th className="py-3 px-3 text-center">Actual</th>
                      <th className="py-3 px-3 text-center">Self Score</th>
                      <th className="py-3 px-3 text-center">Mgr Score</th>
                      <th className="py-3 px-3 text-center">POE Docs</th>
                      <th className="py-3 px-3 text-center">Submitted?</th>
                      <th className="py-3 px-3 text-center">Approved?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {modalFilteredKpis.map(k => (
                      <tr key={k.id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 font-black text-slate-900">
                          {k.kpiNo}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-800 leading-snug">{k.kpiTitle}</div>
                          {k.poeDocNames.length > 0 && (
                            <div className="text-[10px] text-slate-500 mt-1">
                              <strong>POE Files:</strong> {k.poeDocNames.join(', ')}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-slate-700">
                          {k.target}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-slate-900">
                          {k.actual}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-blue-700">
                          {k.selfScore}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-emerald-700">
                          {k.managerScore}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded font-black text-[11px] ${
                              k.poeDocsCount > 0
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {k.poeDocsCount}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {k.isNa ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-black text-[10px]">
                              N/A
                            </span>
                          ) : k.isSubmitted ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-black text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Submitted
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-black text-[10px]">
                              <Clock className="w-3 h-3" />
                              Not Submitted
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {k.isNa ? (
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-black text-[10px]">
                              N/A
                            </span>
                          ) : k.isApproved ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[10px]">
                              <CheckCircle2 className="w-3 h-3" />
                              Approved
                            </span>
                          ) : k.isAwaitingManager ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-black text-[10px]">
                              <Clock className="w-3 h-3" />
                              Not Approved (Awaiting Mgr)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-black text-[10px]">
                              Not Approved
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
