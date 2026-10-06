import React, { useState } from 'react';
import { 
  Settings, Database, RefreshCw, ShieldCheck, CheckCircle2, 
  Activity, Users, Server, HardDrive, Key, AlertTriangle, 
  FileText, Play, Terminal, Layers
} from 'lucide-react';
import { User } from '../../types';
import { NkangalaBatchRestorationPanel } from './NkangalaBatchRestorationPanel';
import { NkangalaBackupVault } from './NkangalaBackupVault';

interface SystemControlPanelProps {
  currentUser: User;
  activeTenantId: string;
  onImpersonate?: (user: User) => void;
  onNavigateToCommandCenter?: () => void;
}

export function SystemControlPanel({ currentUser, activeTenantId, onImpersonate, onNavigateToCommandCenter }: SystemControlPanelProps) {
  const [activeTab, setActiveTab] = useState<'vault' | 'batch-sync' | 'db-health'>('vault');
  const [clearingCache, setClearingCache] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<string | null>(null);

  const handleClearCache = async () => {
    setClearingCache(true);
    try {
      const res = await fetch('/api/admin/performance-logs/clear', { method: 'POST' });
      if (res.ok) {
        setCacheStatus('System telemetry and caches successfully refreshed!');
        setTimeout(() => setCacheStatus(null), 4000);
      }
    } catch (e) {
      setCacheStatus('Error clearing system logs');
    } finally {
      setClearingCache(false);
    }
  };

  return (
    <div className="bg-slate-950 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Top Bar */}
      <div className="bg-slate-900/80 border-b border-slate-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white">System Control Panel</h1>
            <p className="text-xs text-slate-400">Administrative Orchestration, Directory Integrity & Pipeline Sync</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('vault')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'vault'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Nkangala Backup Vault & 1-Click Restore
          </button>
          <button
            onClick={() => setActiveTab('batch-sync')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'batch-sync'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Live Batch Stream
          </button>
          <button
            onClick={() => setActiveTab('db-health')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'db-health'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            Database & Namespace Health
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden p-6">
        {activeTab === 'vault' && (
          <NkangalaBackupVault
            currentUser={currentUser}
            activeTenantId={activeTenantId}
            onImpersonate={onImpersonate}
          />
        )}

        {activeTab === 'batch-sync' && (
          <NkangalaBatchRestorationPanel 
            currentUser={currentUser} 
            activeTenantId={activeTenantId} 
            onImpersonate={onImpersonate}
            onNavigateToCommandCenter={onNavigateToCommandCenter}
          />
        )}

        {activeTab === 'db-health' && (
          <div className="space-y-6 overflow-y-auto h-full pr-2">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Primary Cloud Store</span>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Connected
                  </span>
                </div>
                <div className="text-xl font-black text-white mt-2">Supabase PostgreSQL</div>
                <div className="text-xs text-slate-500 mt-1">Table: `messages` (Key-Value Document Store)</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Directory Coverage</span>
                  <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/30">
                    100% Synced
                  </span>
                </div>
                <div className="text-xl font-black text-white mt-2">642 Municipal Accounts</div>
                <div className="text-xs text-slate-500 mt-1">Nkangala District Municipality</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase">Namespaces</span>
                  <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-500/30">
                    Multi-Tenant Active
                  </span>
                </div>
                <div className="text-xl font-black text-white mt-2">tenant-229 & nkangala_auto</div>
                <div className="text-xs text-slate-500 mt-1">Cross-replicated with global fallback</div>
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Maintenance Actions</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={handleClearCache}
                  disabled={clearingCache}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${clearingCache ? 'animate-spin' : ''}`} />
                  Clear Telemetry & Cache
                </button>
                {cacheStatus && (
                  <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    {cacheStatus}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
