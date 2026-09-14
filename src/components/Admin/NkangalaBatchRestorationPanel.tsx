import React, { useState, useEffect, useRef } from 'react';
import { 
  RefreshCw, CheckCircle2, AlertCircle, Database, Users, 
  Layers, Award, BookOpen, Clock, Search, Play, 
  Check, X, ArrowRight, ShieldCheck, Sparkles, Filter, 
  ChevronRight, Terminal, UserCheck, AlertTriangle
} from 'lucide-react';
import { User } from '../../types';

interface ProcessLog {
  id: string;
  timestamp: string;
  email: string;
  name: string;
  department: string;
  jobFunction: string;
  kpasCount: number;
  kpisCount: number;
  jscsCount: number;
  pdpsCount: number;
  status: 'processing' | 'success' | 'error';
  details?: string;
}

interface BatchStats {
  totalUsers: number;
  processedUsers: number;
  totalKpas: number;
  totalKpis: number;
  totalJscs: number;
  totalPdps: number;
  errorCount: number;
  startTime: number | null;
  endTime: number | null;
}

interface NkangalaBatchRestorationPanelProps {
  currentUser: User;
  activeTenantId: string;
  onClose?: () => void;
}

export function NkangalaBatchRestorationPanel({ currentUser, activeTenantId, onClose }: NkangalaBatchRestorationPanelProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [stats, setStats] = useState<BatchStats>({
    totalUsers: 0,
    processedUsers: 0,
    totalKpas: 0,
    totalKpis: 0,
    totalJscs: 0,
    totalPdps: 0,
    errorCount: 0,
    startTime: null,
    endTime: null
  });

  const [currentProcessingUser, setCurrentProcessingUser] = useState<{
    email: string;
    name: string;
    department: string;
    jobFunction: string;
    kpas: number;
    kpis: number;
    jscs: number;
    pdps: number;
  } | null>(null);

  const [logs, setLogs] = useState<ProcessLog[]>([]);
  const [logFilter, setLogFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error'>('all');
  const [selectedUserInspection, setSelectedUserInspection] = useState<any | null>(null);
  const [inspectLoading, setInspectLoading] = useState(false);
  const [inspectEmail, setInspectEmail] = useState('khumaloab@nkangaladm.gov.za');

  const logsContainerRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsContainerRef.current && isRunning) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs, isRunning]);

  // Cleanup EventSource on unmount
  useEffect(() => {
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleStartBatchReprocess = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setIsCompleted(false);
    setLogs([]);
    setSelectedUserInspection(null);

    const startTime = Date.now();
    setStats({
      totalUsers: 0,
      processedUsers: 0,
      totalKpas: 0,
      totalKpis: 0,
      totalJscs: 0,
      totalPdps: 0,
      errorCount: 0,
      startTime,
      endTime: null
    });

    try {
      // Connect to SSE stream
      const sseUrl = `/api/admin/reprocess-nkangala-profiles/stream?tenantId=${encodeURIComponent(activeTenantId)}&initiator=${encodeURIComponent(currentUser.email || 'admin')}`;
      const es = new EventSource(sseUrl);
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);

          if (payload.type === 'init') {
            setStats(prev => ({
              ...prev,
              totalUsers: payload.totalUsers || 0
            }));
          } else if (payload.type === 'progress') {
            setCurrentProcessingUser({
              email: payload.user.email,
              name: payload.user.fullName || payload.user.name,
              department: payload.user.department || 'Nkangala DM',
              jobFunction: payload.user.jobFunction || payload.user.title || 'Official',
              kpas: payload.counts.kpas,
              kpis: payload.counts.kpis,
              jscs: payload.counts.jscs,
              pdps: payload.counts.pdps
            });

            setStats(prev => ({
              ...prev,
              processedUsers: payload.currentIndex,
              totalUsers: payload.totalUsers || prev.totalUsers,
              totalKpas: prev.totalKpas + (payload.counts.kpas || 0),
              totalKpis: prev.totalKpis + (payload.counts.kpis || 0),
              totalJscs: prev.totalJscs + (payload.counts.jscs || 0),
              totalPdps: prev.totalPdps + (payload.counts.pdps || 0),
              errorCount: prev.errorCount + (payload.status === 'error' ? 1 : 0)
            }));

            setLogs(prev => [
              ...prev,
              {
                id: `log_${payload.user.email}_${Date.now()}`,
                timestamp: new Date().toLocaleTimeString(),
                email: payload.user.email,
                name: payload.user.fullName || payload.user.name,
                department: payload.user.department || 'Nkangala DM',
                jobFunction: payload.user.jobFunction || payload.user.title || 'Official',
                kpasCount: payload.counts.kpas,
                kpisCount: payload.counts.kpis,
                jscsCount: payload.counts.jscs,
                pdpsCount: payload.counts.pdps,
                status: payload.status === 'error' ? 'error' : 'success',
                details: payload.details
              }
            ]);
          } else if (payload.type === 'complete') {
            setIsRunning(false);
            setIsCompleted(true);
            setStats(prev => ({
              ...prev,
              processedUsers: payload.totalProcessed || prev.processedUsers,
              totalKpas: payload.totalKpas || prev.totalKpas,
              totalKpis: payload.totalKpis || prev.totalKpis,
              totalJscs: payload.totalJscs || prev.totalJscs,
              totalPdps: payload.totalPdps || prev.totalPdps,
              endTime: Date.now()
            }));
            es.close();
            eventSourceRef.current = null;
          } else if (payload.type === 'error') {
            setIsRunning(false);
            setStats(prev => ({
              ...prev,
              errorCount: prev.errorCount + 1,
              endTime: Date.now()
            }));
            es.close();
            eventSourceRef.current = null;
          }
        } catch (err) {
          console.error("Error parsing SSE stream message:", err);
        }
      };

      es.onerror = (err) => {
        console.warn("EventSource error, falling back to polling check:", err);
        es.close();
        eventSourceRef.current = null;
        // Fallback fetch completion status
        fetch(`/api/admin/reprocess-nkangala-profiles/status`)
          .then(res => res.json())
          .then(data => {
            if (data) {
              setStats(prev => ({
                ...prev,
                processedUsers: data.processedUsers || prev.processedUsers,
                totalUsers: data.totalUsers || prev.totalUsers,
                totalKpas: data.totalKpas || prev.totalKpas,
                totalKpis: data.totalKpis || prev.totalKpis,
                totalJscs: data.totalJscs || prev.totalJscs,
                totalPdps: data.totalPdps || prev.totalPdps,
                endTime: Date.now()
              }));
              setIsRunning(false);
              setIsCompleted(true);
            }
          })
          .catch(() => {
            setIsRunning(false);
          });
      };
    } catch (e) {
      console.error("Failed to start batch reprocess:", e);
      setIsRunning(false);
    }
  };

  const handleInspectUser = async (emailToInspect: string) => {
    if (!emailToInspect) return;
    setInspectLoading(true);
    try {
      const [kpasRes, kpisRes, pplanRes, jscRes, pdpRes] = await Promise.all([
        fetch(`/api/tenant/${activeTenantId}/kpas?userId=${encodeURIComponent(emailToInspect)}`),
        fetch(`/api/tenant/${activeTenantId}/kpis?userId=${encodeURIComponent(emailToInspect)}`),
        fetch(`/api/tenant/${activeTenantId}/pplan?userId=${encodeURIComponent(emailToInspect)}`),
        fetch(`/api/tenant/${activeTenantId}/job-competencies?userId=${encodeURIComponent(emailToInspect)}`),
        fetch(`/api/tenant/${activeTenantId}/pdp?userId=${encodeURIComponent(emailToInspect)}`)
      ]);

      const [kpas, kpis, pplan, jsc, pdp] = await Promise.all([
        kpasRes.ok ? kpasRes.json() : { kpas: [] },
        kpisRes.ok ? kpisRes.json() : { kpis: [] },
        pplanRes.ok ? pplanRes.json() : { items: [] },
        jscRes.ok ? jscRes.json() : { competencies: [] },
        pdpRes.ok ? pdpRes.json() : { items: [] }
      ]);

      setSelectedUserInspection({
        email: emailToInspect,
        kpas: kpas.kpas || [],
        kpis: kpis.kpis || [],
        pplan: pplan.items || pplan.rows || [],
        jscs: jsc.competencies || [],
        pdp: pdp.items || []
      });
    } catch (e) {
      console.error("Inspection error:", e);
    } finally {
      setInspectLoading(false);
    }
  };

  const progressPercentage = stats.totalUsers > 0 
    ? Math.min(100, Math.round((stats.processedUsers / stats.totalUsers) * 100))
    : 0;

  const filteredLogs = logs.filter(log => {
    const matchesSearch = logFilter === '' || 
      log.name.toLowerCase().includes(logFilter.toLowerCase()) || 
      log.email.toLowerCase().includes(logFilter.toLowerCase()) || 
      log.department.toLowerCase().includes(logFilter.toLowerCase()) ||
      log.jobFunction.toLowerCase().includes(logFilter.toLowerCase());

    const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl shadow-2xl border border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-8 py-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-white tracking-tight">Nkangala DM Batch Restoration Suite</h2>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-emerald-500/30 tracking-wider">
                Official @nkangaladm.gov.za Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Synchronize, regenerate, and verify all 4 pillars (KPAs, KPIs, PDPs, and JSCs) across all municipal accounts with live verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!isRunning ? (
            <button
              onClick={handleStartBatchReprocess}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-900/30 hover:scale-[1.02] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              {isCompleted ? 'Re-Run Batch Synchronization' : 'Execute Full Batch Synchronization'}
            </button>
          ) : (
            <div className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-5 py-2.5 rounded-xl flex items-center gap-3 text-xs font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processing Directory in Progress...
            </div>
          )}

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="p-8 flex-1 overflow-y-auto space-y-6">
        {/* Progress Bar & Live Stats */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
            <div className="flex items-center gap-3">
              <span className="text-sm font-black text-slate-200 uppercase tracking-wider">
                Restoration Progress
              </span>
              <span className="bg-slate-800 text-emerald-400 font-mono text-xs font-black px-2.5 py-1 rounded-md border border-slate-700">
                {stats.processedUsers} / {stats.totalUsers || '...'} Profiles ({progressPercentage}%)
              </span>
            </div>

            {isRunning && currentProcessingUser && (
              <div className="text-xs text-slate-400 flex items-center gap-2 truncate max-w-md">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                <span className="text-slate-500">Currently syncing:</span>
                <span className="font-bold text-white truncate">{currentProcessingUser.name}</span>
                <span className="text-slate-400 font-mono text-[11px] truncate">({currentProcessingUser.email})</span>
              </div>
            )}

            {isCompleted && (
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 className="w-4 h-4" />
                100% Directory Restored & Verified
              </div>
            )}
          </div>

          {/* Progress Bar Track */}
          <div className="w-full bg-slate-800 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-700/60">
            <div 
              className={`h-full rounded-full transition-all duration-300 ${
                isCompleted 
                  ? 'bg-emerald-500' 
                  : isRunning 
                  ? 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 animate-pulse' 
                  : 'bg-slate-700'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6">
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Profiles Synced
              </div>
              <div className="text-xl font-black text-white mt-1 font-mono">{stats.processedUsers}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase">
                <Layers className="w-3.5 h-3.5 text-blue-400" />
                KPAs Populated
              </div>
              <div className="text-xl font-black text-blue-400 mt-1 font-mono">{stats.totalKpas}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                KPIs Restored
              </div>
              <div className="text-xl font-black text-emerald-400 mt-1 font-mono">{stats.totalKpis}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                JSCs Populated
              </div>
              <div className="text-xl font-black text-amber-400 mt-1 font-mono">{stats.totalJscs}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase">
                <BookOpen className="w-3.5 h-3.5 text-purple-400" />
                PDPs Restored
              </div>
              <div className="text-xl font-black text-purple-400 mt-1 font-mono">{stats.totalPdps}</div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-xl">
              <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                Error Rate
              </div>
              <div className={`text-xl font-black mt-1 font-mono ${stats.errorCount > 0 ? 'text-rose-400' : 'text-teal-400'}`}>
                {stats.errorCount}
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout: Live Activity Stream + User Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Activity Logs Stream */}
          <div className="lg:col-span-7 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col h-[420px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Real-Time Synchronization Stream
                </span>
                <span className="bg-slate-800 text-slate-400 font-mono text-[10px] px-2 py-0.5 rounded">
                  {filteredLogs.length} events
                </span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    placeholder="Filter user / role..."
                    className="bg-slate-900 border border-slate-800 text-[11px] text-slate-200 rounded-lg pl-7 pr-2.5 py-1 focus:border-emerald-500 outline-none w-36 sm:w-48 placeholder:text-slate-600"
                  />
                </div>
              </div>
            </div>

            <div 
              ref={logsContainerRef}
              className="flex-1 p-4 overflow-y-auto space-y-2 font-mono text-xs"
            >
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
                  <Database className="w-8 h-8 mb-2 opacity-40" />
                  <p className="font-sans text-xs">No active logs yet. Click "Execute Full Batch Synchronization" to begin processing.</p>
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div 
                    key={log.id} 
                    onClick={() => {
                      setInspectEmail(log.email);
                      handleInspectUser(log.email);
                    }}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80 hover:border-emerald-500/50 transition-all flex items-center justify-between gap-3 cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span className="text-[10px] text-slate-500 shrink-0">{log.timestamp}</span>
                      <div className="truncate">
                        <span className="font-sans font-bold text-white text-xs group-hover:text-emerald-300 transition-colors">
                          {log.name}
                        </span>
                        <span className="text-slate-400 text-[11px] ml-1.5 font-mono">
                          &lt;{log.email}&gt;
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="bg-blue-500/10 text-blue-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-500/20">
                        {log.kpasCount} KPAs
                      </span>
                      <span className="bg-emerald-500/10 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-500/20">
                        {log.kpisCount} KPIs
                      </span>
                      <span className="bg-amber-500/10 text-amber-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-500/20">
                        {log.jscsCount} JSCs
                      </span>
                      <span className="bg-purple-500/10 text-purple-300 text-[10px] font-bold px-1.5 py-0.5 rounded border border-purple-500/20">
                        {log.pdpsCount} PDPs
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Profile Pillar Inspector */}
          <div className="lg:col-span-5 bg-slate-950/60 border border-slate-800 rounded-2xl flex flex-col h-[420px] overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-black uppercase tracking-wider text-slate-200">
                  Instant Profile Inspector
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-bold uppercase">4-Pillar Validation</span>
            </div>

            <div className="p-4 border-b border-slate-800/80 bg-slate-900/40 flex items-center gap-2">
              <input
                type="text"
                value={inspectEmail}
                onChange={(e) => setInspectEmail(e.target.value)}
                placeholder="Enter user email (e.g. khumaloab@nkangaladm.gov.za)"
                className="flex-1 bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 outline-none focus:border-indigo-500"
              />
              <button
                onClick={() => handleInspectUser(inspectEmail)}
                disabled={inspectLoading}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                {inspectLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                Inspect
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-3 font-sans text-xs">
              {!selectedUserInspection ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
                  <UserCheck className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-xs">Enter any municipal email above or click any record in the stream to inspect their exact 4-pillar payload live.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                    <div className="font-bold text-white text-sm">{selectedUserInspection.email}</div>
                    <div className="text-[11px] text-emerald-400 font-bold mt-0.5">Verified 4-Pillar Dataset Present</div>
                  </div>

                  {/* KPAs List */}
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-blue-400 mb-1.5 flex items-center justify-between">
                      <span>KPAs ({selectedUserInspection.kpas.length})</span>
                      <span className="text-slate-500 font-mono text-[10px]">Key Performance Areas</span>
                    </div>
                    <div className="space-y-1">
                      {selectedUserInspection.kpas.map((k: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="text-slate-200 truncate">{k.name || k.kpa}</span>
                          <span className="bg-blue-500/20 text-blue-300 font-bold px-1.5 py-0.5 rounded text-[10px] ml-2 shrink-0">{k.weight || k.weighting}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* KPIs List */}
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-emerald-400 mb-1.5 flex items-center justify-between">
                      <span>KPIs ({selectedUserInspection.kpis.length})</span>
                      <span className="text-slate-500 font-mono text-[10px]">Key Performance Indicators</span>
                    </div>
                    <div className="space-y-1 max-h-36 overflow-y-auto">
                      {selectedUserInspection.kpis.map((kpi: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg text-[11px]">
                          <div className="text-slate-200 font-medium">{kpi.kpi || kpi.name}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5 truncate">Target: {kpi.annualTarget || kpi.target}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* JSCs List */}
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-1.5 flex items-center justify-between">
                      <span>JSCs ({selectedUserInspection.jscs.length})</span>
                      <span className="text-slate-500 font-mono text-[10px]">Job Specific Competencies</span>
                    </div>
                    <div className="space-y-1">
                      {selectedUserInspection.jscs.map((j: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg flex items-center justify-between text-[11px]">
                          <span className="text-slate-200 truncate">{j.competency || j.name}</span>
                          <span className="bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded text-[10px] ml-2 shrink-0">{j.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PDP List */}
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider text-purple-400 mb-1.5 flex items-center justify-between">
                      <span>PDP ({selectedUserInspection.pdp.length})</span>
                      <span className="text-slate-500 font-mono text-[10px]">Personal Development Plan</span>
                    </div>
                    <div className="space-y-1">
                      {selectedUserInspection.pdp.map((p: any, idx: number) => (
                        <div key={idx} className="bg-slate-900/90 border border-slate-800/80 p-2 rounded-lg text-[11px]">
                          <div className="text-slate-200 font-bold">{p.skillsGap || p["Skills performance gap (in order of priority)"]}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">{p.suggestedTraining || p["Suggested training and/or development activity"]}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
