import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  ShieldCheck, 
  Users, 
  Layers, 
  FileText, 
  Briefcase, 
  BookOpen,
  ArrowRight,
  Filter
} from 'lucide-react';
import { NKANGALA_USER_MASTER_REGISTRY, UserRegistryCount } from '../../data/nkangalaUserMasterRegistry';
import type { User } from '../../types';

interface NkangalaDataVaultProps {
  currentUser: User;
  activeTenantId: string;
}

export function NkangalaDataVault({ currentUser, activeTenantId }: NkangalaDataVaultProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isRestoringAll, setIsRestoringAll] = useState(false);
  const [restoringUserEmail, setRestoringUserEmail] = useState<string | null>(null);
  const [restoreProgress, setRestoreProgress] = useState<{ current: number; total: number; user: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [vaultSummary, setVaultSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserRegistryCount | null>(null);

  const registryEntries = Object.values(NKANGALA_USER_MASTER_REGISTRY);

  const filteredEntries = registryEntries.filter(entry => 
    entry.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalKPIs = registryEntries.reduce((acc, curr) => acc + curr.kpis, 0);
  const totalKPAs = registryEntries.reduce((acc, curr) => acc + curr.kpas, 0);
  const totalJSCs = registryEntries.reduce((acc, curr) => acc + curr.jscs, 0);
  const totalPDPs = registryEntries.reduce((acc, curr) => acc + curr.pdps, 0);

  const fetchVaultStatus = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch(`/api/admin/nkangala-vault/status?tenantId=${activeTenantId}`);
      if (res.ok) {
        const data = await res.json();
        setVaultSummary(data);
      }
    } catch (e) {
      console.warn('Vault status query:', e);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    fetchVaultStatus();
  }, [activeTenantId]);

  const handleDownloadFullBackup = async () => {
    try {
      setStatusMessage({ type: 'info', text: 'Generating comprehensive JSON backup archive...' });
      const res = await fetch(`/api/admin/nkangala-vault/export?tenantId=${activeTenantId}`);
      if (!res.ok) throw new Error('Failed to generate export archive');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Nkangala_DM_Master_Vault_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatusMessage({ type: 'success', text: 'Backup archive downloaded successfully.' });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error downloading backup archive' });
    }
  };

  const handleRestoreSingleUser = async (targetEmail: string) => {
    setRestoringUserEmail(targetEmail);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/admin/nkangala-vault/restore-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenantId,
          email: targetEmail
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed to restore user profile');

      setStatusMessage({
        type: 'success',
        text: `Successfully restored profile for ${targetEmail}: ${result.kpisRestored} KPIs, ${result.kpasRestored} KPAs, ${result.jscsRestored} JSCs, and ${result.pdpsRestored} PDPs.`
      });
      fetchVaultStatus();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error restoring user' });
    } finally {
      setRestoringUserEmail(null);
    }
  };

  const handleRestoreAllUsers = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to execute 1-Click Master Restore for ALL ${registryEntries.length} Nkangala District Municipality profiles?\n\nThis will safely align every account to their verified ${totalKPIs} KPIs, ${totalKPAs} KPAs, ${totalJSCs} JSCs, and ${totalPDPs} PDPs without wiping any existing custom text.`
    );
    if (!confirmed) return;

    setIsRestoringAll(true);
    setStatusMessage({ type: 'info', text: 'Initializing 1-Click Master Restoration for all 174 accounts...' });
    setRestoreProgress({ current: 0, total: registryEntries.length, user: 'Starting...' });

    try {
      const res = await fetch(`/api/admin/nkangala-vault/restore-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: activeTenantId })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Batch restore encountered an error');

      setStatusMessage({
        type: 'success',
        text: `1-Click Restore Complete! Successfully verified and synced ${result.restoredCount} profiles across tenant-229 and nkangala_auto.`
      });
      fetchVaultStatus();
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Error during batch restore' });
    } finally {
      setIsRestoringAll(false);
      setRestoreProgress(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/30 text-indigo-400 rounded-2xl border border-indigo-500/30">
                <Database className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black tracking-tight text-white uppercase">
                  Nkangala District Municipality Data Vault & Backups
                </h2>
                <p className="text-xs text-indigo-200">
                  Universal Master Registry Archive • 1-Click Disaster Recovery & Automated Provisioning
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Permanent snapshot containing all 174 verified municipal employee performance structures. If any user agreement, KPI, KPA, JSC, or PDP profile experiences corruption or accidental deletion, click below to restore live accounts with 100% precision.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleDownloadFullBackup}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition shadow-sm border border-slate-700 cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Download JSON Archive</span>
            </button>

            <button
              onClick={handleRestoreAllUsers}
              disabled={isRestoringAll}
              className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRestoringAll ? 'animate-spin' : ''}`} />
              <span>{isRestoringAll ? 'Restoring All...' : '1-Click Restore All (174 Users)'}</span>
            </button>
          </div>
        </div>

        {/* Global Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-indigo-900/40">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-indigo-300 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Profiles Registered</span>
              <Users className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{registryEntries.length}</div>
            <span className="text-[10px] text-emerald-400 font-semibold">100% Verified Structure</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-indigo-300 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Total Active KPIs</span>
              <Layers className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{totalKPIs}</div>
            <span className="text-[10px] text-slate-300">SDBIP & Individual</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-indigo-300 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Key Performance Areas</span>
              <FileText className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{totalKPAs}</div>
            <span className="text-[10px] text-slate-300">5 - 7 Pillars per user</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5">
            <div className="flex items-center justify-between text-indigo-300 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Competencies (JSC)</span>
              <Briefcase className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{totalJSCs}</div>
            <span className="text-[10px] text-slate-300">Core Leadership Matrix</span>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-indigo-300 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider">Developmental Plans</span>
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">{totalPDPs}</div>
            <span className="text-[10px] text-slate-300">MFMA & Skills Outcomes</span>
          </div>
        </div>
      </div>

      {/* Status Notice */}
      {statusMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-sm ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
            : statusMessage.type === 'error'
            ? 'bg-rose-50 text-rose-800 border border-rose-200'
            : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
        }`}>
          <div className="flex items-center gap-3">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : statusMessage.type === 'error' ? (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            ) : (
              <RefreshCw className="w-5 h-5 text-indigo-600 shrink-0 animate-spin" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button 
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-700 ml-4 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* User Search & Registry Table */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">
              Registered Profile Catalog ({filteredEntries.length} Personnel)
            </h3>
            <p className="text-xs text-slate-500">
              Select any profile to verify or execute an isolated 1-click restore for that individual.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user email or surname..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-600 focus:bg-white transition"
            />
          </div>
        </div>

        <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto custom-scrollbar">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
              <tr>
                <th className="py-3 px-4">User Account Email</th>
                <th className="py-3 px-4 text-center">KPIs</th>
                <th className="py-3 px-4 text-center">KPAs</th>
                <th className="py-3 px-4 text-center">JSCs</th>
                <th className="py-3 px-4 text-center">PDPs</th>
                <th className="py-3 px-4 text-right">Vault Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEntries.map((entry) => {
                const isThisRestoring = restoringUserEmail === entry.email;
                return (
                  <tr key={entry.email} className="hover:bg-indigo-50/40 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        <span>{entry.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">{entry.kpis}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">{entry.kpas}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">{entry.jscs}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-slate-700">
                      <span className="bg-slate-100 px-2 py-0.5 rounded-md">{entry.pdps}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleRestoreSingleUser(entry.email)}
                        disabled={isThisRestoring || isRestoringAll}
                        className="px-3 py-1 bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white rounded-lg text-[11px] font-bold transition shadow-xs border border-indigo-200 hover:border-indigo-600 cursor-pointer disabled:opacity-50"
                      >
                        {isThisRestoring ? 'Restoring...' : '1-Click Restore'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
