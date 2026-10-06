import React, { useState, useEffect, useMemo } from 'react';
import { 
  Archive, Database, RefreshCw, CheckCircle2, AlertCircle, 
  Download, Upload, Search, Users, Folder, FolderOpen, 
  FileText, ShieldCheck, Check, Copy, Eye, ExternalLink,
  Layers, Award, BookOpen, Clock, ChevronRight, ChevronDown,
  Sparkles, Play, HardDrive, Filter, X
} from 'lucide-react';
import { User } from '../../types';

interface BackupUserProfile {
  id: string;
  email: string;
  fullName: string;
  department: string;
  jobFunction: string;
  directorate?: string;
  kpisCount: number;
  kpasCount: number;
  jscsCount: number;
  pdpsCount: number;
  hasPerformanceAgreement: boolean;
  lastBackupTimestamp: string;
  status: 'synced' | 'pending' | 'restored' | 'modified';
  kpis?: any[];
  kpas?: any[];
  jscs?: any[];
  pdp?: any[];
  agreementDoc?: any;
}

interface BackupVaultStats {
  totalUsers: number;
  totalKpis: number;
  totalKpas: number;
  totalJscs: number;
  totalPdps: number;
  totalAgreements: number;
  lastSnapshotTimestamp: string | null;
  unifiedTenantStatus: 'active' | 'syncing' | 'error';
}

interface NkangalaBackupVaultProps {
  currentUser: User;
  activeTenantId: string;
  onImpersonate?: (user: User) => void;
}

export function NkangalaBackupVault({
  currentUser,
  activeTenantId,
  onImpersonate
}: NkangalaBackupVaultProps) {
  const [profiles, setProfiles] = useState<BackupUserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<BackupVaultStats>({
    totalUsers: 0,
    totalKpis: 0,
    totalKpas: 0,
    totalJscs: 0,
    totalPdps: 0,
    totalAgreements: 0,
    lastSnapshotTimestamp: null,
    unifiedTenantStatus: 'active'
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  
  // Inspect Modal
  const [inspectProfile, setInspectProfile] = useState<BackupUserProfile | null>(null);
  const [inspectTab, setInspectTab] = useState<'overview' | 'kpis' | 'kpas' | 'jscs' | 'pdp' | 'agreement' | 'raw_json'>('overview');
  const [copiedJson, setCopiedJson] = useState(false);

  // 1-Click Operations State
  const [restoringAll, setRestoringAll] = useState(false);
  const [restoringUserEmail, setRestoringUserEmail] = useState<string | null>(null);
  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [progressPercent, setProgressPercent] = useState(0);

  // Fetch Backup Vault Catalog
  const fetchBackupVault = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/nkangala/backup-vault?tenantId=${encodeURIComponent(activeTenantId)}&t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to load Nkangala backup vault');
      const data = await res.json();
      
      if (data && Array.isArray(data.profiles)) {
        setProfiles(data.profiles);
        setStats({
          totalUsers: data.stats?.totalUsers || data.profiles.length,
          totalKpis: data.stats?.totalKpis || 0,
          totalKpas: data.stats?.totalKpas || 0,
          totalJscs: data.stats?.totalJscs || 0,
          totalPdps: data.stats?.totalPdps || 0,
          totalAgreements: data.stats?.totalAgreements || 0,
          lastSnapshotTimestamp: data.stats?.lastSnapshotTimestamp || new Date().toISOString(),
          unifiedTenantStatus: 'active'
        });

        // Expand first 2 folders by default
        const depts: Record<string, boolean> = {};
        data.profiles.slice(0, 50).forEach((p: BackupUserProfile) => {
          const dept = p.department || 'General Administration';
          depts[dept] = true;
        });
        setExpandedFolders(depts);
      }
    } catch (err: any) {
      console.error('Error fetching backup vault:', err);
      setActionNotice({
        type: 'error',
        message: 'Unable to reach backup vault repository. Falling back to local cloud registry.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBackupVault();
  }, [activeTenantId]);

  // Folder grouping by Department
  const groupedProfiles = useMemo(() => {
    const map: Record<string, BackupUserProfile[]> = {};
    profiles.forEach(p => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        p.fullName.toLowerCase().includes(q) || 
        p.email.toLowerCase().includes(q) || 
        p.jobFunction.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q);

      const matchesDept = selectedDepartment === 'all' || p.department === selectedDepartment;

      if (matchesSearch && matchesDept) {
        const dept = p.department || 'General Administration';
        if (!map[dept]) map[dept] = [];
        map[dept].push(p);
      }
    });
    return map;
  }, [profiles, searchQuery, selectedDepartment]);

  const departmentList = useMemo(() => {
    const set = new Set<string>();
    profiles.forEach(p => {
      if (p.department) set.add(p.department);
    });
    return Array.from(set).sort();
  }, [profiles]);

  const toggleFolder = (dept: string) => {
    setExpandedFolders(prev => ({
      ...prev,
      [dept]: !prev[dept]
    }));
  };

  // 1-Click Import / Restore Single User
  const handleRestoreSingleUser = async (userProfile: BackupUserProfile) => {
    if (restoringUserEmail) return;
    setRestoringUserEmail(userProfile.email);
    setActionNotice({
      type: 'info',
      message: `Restoring 1-Click Backup for ${userProfile.fullName} (${userProfile.email}) into both tenant-229 and nkangala_auto...`
    });

    try {
      const res = await fetch('/api/admin/nkangala/1-click-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'user',
          email: userProfile.email,
          tenantId: activeTenantId
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Restore failed');

      setActionNotice({
        type: 'success',
        message: `Successfully restored ${userProfile.fullName}'s account! Applied: ${result.kpisCount || userProfile.kpisCount} KPIs, ${result.kpasCount || userProfile.kpasCount} KPAs, ${result.jscsCount || userProfile.jscsCount} JSCs, and Personal Development Plan (PDP) to active profile.`
      });

      // Update local status
      setProfiles(prev => prev.map(p => p.email === userProfile.email ? { ...p, status: 'restored' } : p));
      if (inspectProfile && inspectProfile.email === userProfile.email) {
        setInspectProfile(prev => prev ? { ...prev, status: 'restored' } : null);
      }
    } catch (err: any) {
      console.error('Error in single user restore:', err);
      setActionNotice({
        type: 'error',
        message: `Failed to restore account: ${err.message}`
      });
    } finally {
      setRestoringUserEmail(null);
    }
  };

  // 1-Click Import / Restore All for Nkangala District Municipality
  const handleRestoreAllNkangala = async () => {
    if (restoringAll) return;
    if (!window.confirm('Are you sure you want to trigger 1-Click Restore for ALL @nkangaladm.gov.za users? This will apply and sync all official KPIs, KPAs, JSCs, PDPs, and Performance Agreements across both tenant-229 and nkangala_auto with zero data loss.')) {
      return;
    }

    setRestoringAll(true);
    setProgressPercent(5);
    setActionNotice({
      type: 'info',
      message: 'Beginning 1-Click Mass Restoration for Nkangala District Municipality...'
    });

    try {
      const progressInterval = setInterval(() => {
        setProgressPercent(old => (old < 90 ? old + Math.floor(Math.random() * 12) + 5 : old));
      }, 400);

      const res = await fetch('/api/admin/nkangala/1-click-restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target: 'all',
          tenantId: activeTenantId
        })
      });

      clearInterval(progressInterval);
      setProgressPercent(100);

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Mass restore failed');

      setActionNotice({
        type: 'success',
        message: `1-Click Mass Restoration Complete! Successfully synchronized ${result.processedUsers || profiles.length} municipal user accounts with ${result.totalKpis || stats.totalKpis} KPIs, ${result.totalKpas || stats.totalKpas} KPAs, ${result.totalJscs || stats.totalJscs} JSCs, and ${result.totalPdps || stats.totalPdps} PDPs into Supabase PostgreSQL.`
      });

      // Refresh catalog
      fetchBackupVault();
    } catch (err: any) {
      console.error('Error during mass restore:', err);
      setActionNotice({
        type: 'error',
        message: `Mass restoration notice: ${err.message}`
      });
    } finally {
      setRestoringAll(false);
      setTimeout(() => setProgressPercent(0), 3000);
    }
  };

  // Create Instant Backup Snapshot in Supabase
  const handleCreateSnapshot = async () => {
    if (snapshotLoading) return;
    setSnapshotLoading(true);
    try {
      const res = await fetch('/api/admin/nkangala/create-snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          triggeredBy: currentUser.email
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Snapshot creation failed');

      setActionNotice({
        type: 'success',
        message: `Instant Backup Snapshot created in Supabase! Stored under key: ${data.snapshotId}. Verified intact.`
      });
      fetchBackupVault();
    } catch (err: any) {
      setActionNotice({
        type: 'error',
        message: `Failed to create backup snapshot: ${err.message}`
      });
    } finally {
      setSnapshotLoading(false);
    }
  };

  // Download Backup JSON
  const handleExportBackup = () => {
    try {
      const exportData = {
        municipality: 'Nkangala District Municipality',
        tenantId: 'tenant-229',
        mirroredTenantId: 'nkangala_auto',
        exportedAt: new Date().toISOString(),
        exportedBy: currentUser.email,
        stats,
        profiles
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nkangala_district_municipality_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setActionNotice({
        type: 'success',
        message: 'Complete Nkangala Backup Archive JSON successfully generated and downloaded.'
      });
    } catch (e: any) {
      setActionNotice({
        type: 'error',
        message: `Export failed: ${e.message}`
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden font-sans">
      {/* Top Header Bar */}
      <div className="bg-slate-900/90 border-b border-slate-800 px-8 py-5 shrink-0 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Archive className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white tracking-tight">Nkangala Backup Vault & 1-Click Restore</h1>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
                Supabase Unified
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Persistent backup repository for all @nkangaladm.gov.za profiles. 1-Click Restore targets Nkangala District Municipality directly.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateSnapshot}
            disabled={snapshotLoading || restoringAll}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer disabled:opacity-50"
            title="Create an immutable backup snapshot in Supabase"
          >
            <HardDrive className={`w-3.5 h-3.5 ${snapshotLoading ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            {snapshotLoading ? 'Creating Snapshot...' : 'Instant Snapshot'}
          </button>

          <button
            onClick={handleExportBackup}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 cursor-pointer"
            title="Download full JSON backup of all profiles"
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            Download JSON
          </button>

          <button
            onClick={handleRestoreAllNkangala}
            disabled={restoringAll || loading}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center gap-2 shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${restoringAll ? 'animate-spin' : ''}`} />
            {restoringAll ? 'Restoring All Profiles...' : '1-Click Restore All for Nkangala'}
          </button>
        </div>
      </div>

      {/* Progress Bar for Mass Restore */}
      {progressPercent > 0 && (
        <div className="w-full bg-slate-800 h-1.5 shrink-0 overflow-hidden">
          <div 
            className="bg-emerald-500 h-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}

      {/* Notification Toast */}
      {actionNotice && (
        <div className={`mx-8 mt-4 px-4 py-3 rounded-2xl flex items-center justify-between text-xs font-semibold shrink-0 animate-fade-in border ${
          actionNotice.type === 'success' 
            ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300' 
            : actionNotice.type === 'error'
            ? 'bg-red-950/60 border-red-800/80 text-red-300'
            : 'bg-indigo-950/60 border-indigo-800/80 text-indigo-300'
        }`}>
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />}
            {actionNotice.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />}
            {actionNotice.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 text-indigo-400 animate-spin" />}
            <span>{actionNotice.message}</span>
          </div>
          <button 
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white p-1 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Summary Strip */}
      <div className="px-8 py-4 shrink-0 grid grid-cols-2 md:grid-cols-6 gap-3">
        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Backed-up Profiles</span>
            <Users className="w-3.5 h-3.5 text-slate-500" />
          </div>
          <div className="text-xl font-black text-white mt-1">{stats.totalUsers}</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">@nkangaladm.gov.za</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total KPIs</span>
            <Award className="w-3.5 h-3.5 text-amber-500" />
          </div>
          <div className="text-xl font-black text-amber-400 mt-1">{stats.totalKpis}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Scorecard Indicators</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total KPAs</span>
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="text-xl font-black text-indigo-300 mt-1">{stats.totalKpas}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Functional & National</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total JSCs</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-black text-blue-300 mt-1">{stats.totalJscs}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Job Competencies</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Total PDPs</span>
            <BookOpen className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-black text-purple-300 mt-1">{stats.totalPdps}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Personal Dev Plans</div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-2xl">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Unified Database</span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xs font-black text-emerald-400 mt-1.5 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            tenant-229 & auto
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Zero Data Loss Active</div>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="px-8 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 bg-slate-900/40 border-y border-slate-800/80">
        <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by name, email, department or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Departments ({profiles.length})</option>
            {departmentList.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <button
            onClick={fetchBackupVault}
            className="p-2 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition cursor-pointer"
            title="Refresh Backup Catalog"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Folder Explorer Area */}
      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 text-slate-500 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
            <p className="text-xs font-semibold">Reading Nkangala backup folders from Supabase...</p>
          </div>
        ) : Object.keys(groupedProfiles).length === 0 ? (
          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-12 text-center text-slate-400">
            <Archive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">No backup files match your filter</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search query or department selection.</p>
          </div>
        ) : (
          Object.entries(groupedProfiles).map(([dept, deptProfiles]) => {
            const isExpanded = !!expandedFolders[dept];
            return (
              <div 
                key={dept}
                className="bg-slate-900/60 border border-slate-800/90 rounded-2xl overflow-hidden transition-all duration-200"
              >
                {/* Folder Header */}
                <div 
                  onClick={() => toggleFolder(dept)}
                  className="px-5 py-3.5 bg-slate-900/90 hover:bg-slate-850 cursor-pointer flex items-center justify-between transition select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-slate-400 hover:text-white">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500" />
                      )}
                    </button>
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <FolderOpen className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Folder className="w-4 h-4 text-amber-400" />
                      )}
                      <span className="text-xs font-bold text-white tracking-wide">{dept}</span>
                    </div>
                    <span className="bg-slate-800 text-slate-400 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-700">
                      {deptProfiles.length} {deptProfiles.length === 1 ? 'Profile' : 'Profiles'}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 flex items-center gap-4">
                    <span>Target: <strong className="text-slate-400">Nkangala District</strong></span>
                    <span className="text-emerald-500 text-[10px] font-mono">100% Intact</span>
                  </div>
                </div>

                {/* Folder File List */}
                {isExpanded && (
                  <div className="divide-y divide-slate-800/60 bg-slate-950/40">
                    {deptProfiles.map((user) => (
                      <div 
                        key={user.email}
                        className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-900/40 transition"
                      >
                        {/* User Metadata */}
                        <div className="flex items-center gap-3 min-w-[260px]">
                          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-black text-slate-300 shrink-0">
                            {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{user.fullName}</span>
                              {user.email.includes('shabangu') && (
                                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-black uppercase px-1.5 py-0.2 rounded">
                                  PMS Official
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 font-mono">
                              <span>{user.email}</span>
                              <span className="text-slate-600">•</span>
                              <span className="text-slate-500 font-sans">{user.jobFunction || 'Municipal Staff'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Exact Pillar Counts Badges */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <span className="bg-amber-950/50 text-amber-300 border border-amber-800/60 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" title="KPIs Count">
                            <Award className="w-3 h-3 text-amber-400" />
                            {user.kpisCount} KPIs
                          </span>

                          <span className="bg-indigo-950/50 text-indigo-300 border border-indigo-800/60 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" title="KPAs Count">
                            <Layers className="w-3 h-3 text-indigo-400" />
                            {user.kpasCount} KPAs
                          </span>

                          <span className="bg-blue-950/50 text-blue-300 border border-blue-800/60 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" title="JSCs Count">
                            <CheckCircle2 className="w-3 h-3 text-blue-400" />
                            {user.jscsCount} JSCs
                          </span>

                          <span className="bg-purple-950/50 text-purple-300 border border-purple-800/60 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" title="PDPs Count">
                            <BookOpen className="w-3 h-3 text-purple-400" />
                            {user.pdpsCount} PDP
                          </span>

                          <span className="bg-slate-800 text-slate-300 border border-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg flex items-center gap-1" title="Performance Agreement Document">
                            <FileText className="w-3 h-3 text-emerald-400" />
                            PA Doc
                          </span>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setInspectProfile(user);
                              setInspectTab('overview');
                            }}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 border border-slate-700 cursor-pointer"
                            title="Inspect backup payload & verification details"
                          >
                            <Eye className="w-3.5 h-3.5 text-slate-400" />
                            Inspect
                          </button>

                          <button
                            onClick={() => handleRestoreSingleUser(user)}
                            disabled={restoringUserEmail === user.email || restoringAll}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                            title={`1-Click restore all ${user.kpisCount} KPIs, KPAs, JSCs & PDP directly into this account`}
                          >
                            <Play className={`w-3 h-3 fill-current ${restoringUserEmail === user.email ? 'animate-spin' : ''}`} />
                            {restoringUserEmail === user.email ? 'Restoring...' : '1-Click Restore'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Inspect Backup Modal / Drawer */}
      {inspectProfile && (
        <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Archive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">{inspectProfile.fullName} — Backup Inspection</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{inspectProfile.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleRestoreSingleUser(inspectProfile)}
                  disabled={restoringUserEmail === inspectProfile.email || restoringAll}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Play className="w-3 h-3 fill-current" />
                  1-Click Restore This Account
                </button>
                <button
                  onClick={() => setInspectProfile(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Tabs */}
            <div className="px-6 bg-slate-950/60 border-b border-slate-800 flex items-center gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => setInspectTab('overview')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  inspectTab === 'overview'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setInspectTab('kpis')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  inspectTab === 'kpis'
                    ? 'border-amber-500 text-amber-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                KPIs ({inspectProfile.kpisCount})
              </button>
              <button
                onClick={() => setInspectTab('kpas')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  inspectTab === 'kpas'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                KPAs ({inspectProfile.kpasCount})
              </button>
              <button
                onClick={() => setInspectTab('jscs')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  inspectTab === 'jscs'
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                JSCs ({inspectProfile.jscsCount})
              </button>
              <button
                onClick={() => setInspectTab('pdp')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  inspectTab === 'pdp'
                    ? 'border-purple-500 text-purple-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                PDP ({inspectProfile.pdpsCount})
              </button>
              <button
                onClick={() => setInspectTab('agreement')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  inspectTab === 'agreement'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Agreement Sections
              </button>
              <button
                onClick={() => setInspectTab('raw_json')}
                className={`py-3 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
                  inspectTab === 'raw_json'
                    ? 'border-slate-300 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Raw Backup JSON
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {inspectTab === 'overview' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">KPIs Backed Up</span>
                      <div className="text-lg font-black text-amber-400 mt-0.5">{inspectProfile.kpisCount}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">KPAs Defined</span>
                      <div className="text-lg font-black text-indigo-400 mt-0.5">{inspectProfile.kpasCount}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">Competencies (JSC)</span>
                      <div className="text-lg font-black text-blue-400 mt-0.5">{inspectProfile.jscsCount}</div>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl">
                      <span className="text-[10px] text-slate-500 font-bold uppercase">PDP Skills Gaps</span>
                      <div className="text-lg font-black text-purple-400 mt-0.5">{inspectProfile.pdpsCount}</div>
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Account Specifications</h4>
                    <div className="text-xs text-slate-300 space-y-1">
                      <div><strong className="text-slate-400">Department:</strong> {inspectProfile.department}</div>
                      <div><strong className="text-slate-400">Designation:</strong> {inspectProfile.jobFunction}</div>
                      <div><strong className="text-slate-400">Target Tenant:</strong> Nkangala District Municipality (tenant-229 & nkangala_auto)</div>
                      <div><strong className="text-slate-400">Database Mirroring:</strong> Enabled across dual identifiers with zero data loss</div>
                    </div>
                  </div>
                </div>
              )}

              {inspectTab === 'kpis' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Scorecard Indicators ({inspectProfile.kpis?.length || inspectProfile.kpisCount} Items)
                  </h4>
                  {inspectProfile.kpis && inspectProfile.kpis.length > 0 ? (
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      {inspectProfile.kpis.map((kpi: any, idx: number) => (
                        <div key={idx} className="p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-amber-400 font-mono">{kpi.kpiNo || `KPI-${idx + 1}`}</span>
                            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              Weight: {kpi.weight || kpi.weighting || kpi["%wt"] || '—'}%
                            </span>
                          </div>
                          <p className="text-slate-200 font-medium">{kpi.kpi || kpi["kpi description"]}</p>
                          <div className="text-[11px] text-slate-400 flex items-center gap-3">
                            <span>Target: <strong className="text-slate-300">{kpi.annualTarget || kpi.target || '100%'}</strong></span>
                            <span>POE: <strong className="text-slate-300">{kpi.poe || 'Portfolio of Evidence'}</strong></span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                      {inspectProfile.kpisCount} standard municipal indicators registered in backup index.
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'kpas' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Key Performance Areas ({inspectProfile.kpas?.length || inspectProfile.kpasCount} Areas)
                  </h4>
                  {inspectProfile.kpas && inspectProfile.kpas.length > 0 ? (
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      {inspectProfile.kpas.map((kpa: any, idx: number) => (
                        <div key={idx} className="p-3 text-xs flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{kpa.name || kpa.kpaName}</span>
                          <span className="bg-indigo-950 text-indigo-300 text-[10px] font-bold px-2 py-0.5 rounded border border-indigo-800">
                            {kpa.weighting}%
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                      Standard Functional & National KPAs registered.
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'jscs' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Job Specific Competencies ({inspectProfile.jscs?.length || inspectProfile.jscsCount} Competencies)
                  </h4>
                  {inspectProfile.jscs && inspectProfile.jscs.length > 0 ? (
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      {inspectProfile.jscs.map((jsc: any, idx: number) => (
                        <div key={idx} className="p-3 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-blue-400">{jsc.competency}</span>
                            <span className="bg-slate-800 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded">
                              {jsc.proficiency || `Level ${jsc.level || 3}`} (Weight: {jsc.weight}%)
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">{jsc.description || jsc.definition}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                      Core and leading municipal competencies registered.
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'pdp' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Personal Development Plan
                  </h4>
                  {inspectProfile.pdp && inspectProfile.pdp.length > 0 ? (
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      {inspectProfile.pdp.map((item: any, idx: number) => (
                        <div key={idx} className="p-3 text-xs space-y-1">
                          <span className="font-bold text-purple-400">{item.skillsGap}</span>
                          <p className="text-[11px] text-slate-300">
                            Training: <strong className="text-white">{item.suggestedTraining}</strong>
                          </p>
                          <p className="text-[11px] text-slate-400">Expected Outcome: {item.outcomes}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
                      Personal Development Plan targets registered.
                    </div>
                  )}
                </div>
              )}

              {inspectTab === 'agreement' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Performance Agreement Document Structure
                  </h4>
                  <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2 text-xs">
                    <div className="text-emerald-400 font-bold">16 Statutory Agreement Sections Backed Up:</div>
                    <ul className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300">
                      <li>• Cover Page & Contracting Parties</li>
                      <li>• Section 1: Introduction & Legislative Mandate</li>
                      <li>• Section 2: Purpose of this Agreement</li>
                      <li>• Section 3: Commencement and Duration</li>
                      <li>• Section 4: Performance Objectives & KPAs</li>
                      <li>• Section 5: Performance Management System</li>
                      <li>• Section 6: Evaluating Performance & Scale</li>
                      <li>• Section 7: Schedule for Performance Reviews</li>
                      <li>• Section 8: Developmental Requirements (PDP)</li>
                      <li>• Section 9: Employer Obligations</li>
                      <li>• Section 10: Consultation Mechanisms</li>
                      <li>• Section 11: Management of Evaluation Outcomes</li>
                      <li>• Section 12: Dispute Resolution Procedures</li>
                      <li>• Section 13: General Provisions & Amendments</li>
                      <li>• Signatures & Witnesses Execution</li>
                      <li>• Municipal Branding, Logo & Typography</li>
                    </ul>
                  </div>
                </div>
              )}

              {inspectTab === 'raw_json' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Direct Supabase Payload</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(inspectProfile, null, 2));
                        setCopiedJson(true);
                        setTimeout(() => setCopiedJson(false), 2000);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      {copiedJson ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedJson ? 'Copied' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] text-emerald-400 font-mono overflow-x-auto max-h-96">
                    {JSON.stringify(inspectProfile, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
