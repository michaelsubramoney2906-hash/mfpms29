import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Zap, 
  AlertTriangle, 
  Clock, 
  Server, 
  RefreshCw, 
  Download, 
  Trash2, 
  Play, 
  CheckCircle2, 
  Filter, 
  Search, 
  TrendingUp, 
  Cpu, 
  HardDrive,
  Eye,
  Sliders,
  ShieldCheck,
  Radio
} from 'lucide-react';
import { 
  performanceLogger, 
  PerformanceEvent, 
  PerformanceTelemetrySummary,
  EndpointStat 
} from '../../utils/performanceLogger';
import { User } from '../../types';

interface PerformanceMonitorProps {
  currentUser?: User;
  activeTenantId?: string;
}

export function PerformanceMonitor({ currentUser, activeTenantId }: PerformanceMonitorProps) {
  const [summary, setSummary] = useState<PerformanceTelemetrySummary>(() => performanceLogger.getSummary());
  const [serverSummary, setServerSummary] = useState<any>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoggingActive, setIsLoggingActive] = useState<boolean>(true);
  const [isBenchmarkRunning, setIsBenchmarkRunning] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<any>(null);
  const [selectedEvent, setSelectedEvent] = useState<PerformanceEvent | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'bottlenecks' | 'endpoints' | 'live_events' | 'benchmark'>('overview');
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  const fetchServerLogs = async () => {
    try {
      const res = await fetch('/api/admin/performance-logs');
      if (res.ok) {
        const data = await res.json();
        setServerSummary(data);
      }
    } catch (e) {
      console.warn("Failed fetching server telemetry:", e);
    }
  };

  useEffect(() => {
    // Initialize logger with current user context
    if (currentUser?.email) {
      performanceLogger.setUserContext(currentUser.email, activeTenantId || currentUser.tenantId);
    }

    // Subscribe to client-side real-time logger events
    const unsubscribe = performanceLogger.subscribe(() => {
      setSummary(performanceLogger.getSummary());
    });

    fetchServerLogs();

    let refreshInterval: any = null;
    if (autoRefresh) {
      refreshInterval = setInterval(() => {
        if (typeof document !== 'undefined' && document.hidden) return;
        setSummary(performanceLogger.getSummary());
        fetchServerLogs();
      }, 6000);
    }

    return () => {
      unsubscribe();
      if (refreshInterval) clearInterval(refreshInterval);
    };
  }, [currentUser, activeTenantId, autoRefresh]);

  const handleToggleLogging = () => {
    const nextState = !isLoggingActive;
    setIsLoggingActive(nextState);
    performanceLogger.setEnabled(nextState);
  };

  const handleClearLogs = async () => {
    if (window.confirm("Are you sure you want to clear all client and server performance logs?")) {
      performanceLogger.clearLogs();
      setSummary(performanceLogger.getSummary());
      try {
        await fetch('/api/admin/performance-logs/clear', { method: 'POST' });
        await fetchServerLogs();
      } catch (e) {}
    }
  };

  const handleRunBenchmark = async () => {
    setIsBenchmarkRunning(true);
    setBenchmarkResult(null);
    try {
      const result = await performanceLogger.runDiagnosticBenchmark();
      setBenchmarkResult(result);
      setSummary(performanceLogger.getSummary());
      await fetchServerLogs();
    } catch (e: any) {
      console.error("Benchmark error:", e);
    } finally {
      setIsBenchmarkRunning(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      exportedAt: new Date().toISOString(),
      clientSummary: summary,
      serverSummary: serverSummary
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `performance_telemetry_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const filteredEvents = summary.events.filter(evt => {
    if (filterType === 'bottlenecks' && !evt.isBottleneck) return false;
    if (filterType !== 'all' && filterType !== 'bottlenecks' && evt.type !== filterType) return false;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      const matchName = evt.name.toLowerCase().includes(query);
      const matchUrl = evt.url?.toLowerCase().includes(query);
      const matchType = evt.type.toLowerCase().includes(query);
      const matchUser = evt.userEmail?.toLowerCase().includes(query);
      return matchName || matchUrl || matchType || matchUser;
    }
    return true;
  });

  const getSeverityBadge = (severity: string, isBottleneck: boolean) => {
    if (severity === 'critical' || isBottleneck) {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">Bottleneck</span>;
    }
    if (severity === 'slow') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">Slow</span>;
    }
    if (severity === 'moderate') {
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30">Moderate</span>;
    }
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Fast</span>;
  };

  const getLatencyColor = (ms: number, type: string) => {
    const isApi = type === 'api';
    const slowThreshold = isApi ? 1000 : 400;
    const moderateThreshold = isApi ? 300 : 150;

    if (ms >= slowThreshold) return 'text-rose-400';
    if (ms >= moderateThreshold) return 'text-amber-400';
    return 'text-emerald-400';
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 font-sans">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white">Client Performance & Bottleneck Telemetry</h2>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                Active Monitoring
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Real-time interaction latency tracker, main-thread responsiveness monitor, and server bottleneck detection engine.
            </p>
          </div>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunBenchmark}
            disabled={isBenchmarkRunning}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold shadow-lg shadow-emerald-950 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isBenchmarkRunning ? 'animate-spin' : ''}`} />
            {isBenchmarkRunning ? 'Running Benchmark...' : 'Run Speed Benchmark'}
          </button>

          <button
            onClick={handleToggleLogging}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              isLoggingActive 
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isLoggingActive ? 'text-emerald-400' : 'text-slate-500'}`} />
            {isLoggingActive ? 'Telemetry: On' : 'Telemetry: Paused'}
          </button>

          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
              autoRefresh 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
            title={autoRefresh ? "Auto-refreshing every 5s" : "Auto-refresh disabled"}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
          </button>

          <button
            onClick={handleExportJSON}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            title="Export Telemetry JSON"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={handleClearLogs}
            className="p-2 rounded-lg bg-slate-800 hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/40 transition-colors cursor-pointer"
            title="Clear Performance Logs"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-1 px-6 border-b border-slate-800 bg-slate-900/40">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          Telemetry Metrics
        </button>

        <button
          onClick={() => setActiveTab('bottlenecks')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'bottlenecks'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Bottleneck Incidents
          {summary.bottleneckCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
              {summary.bottleneckCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('endpoints')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'endpoints'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Server className="w-3.5 h-3.5" />
          Endpoint Latency Breakdown
        </button>

        <button
          onClick={() => setActiveTab('live_events')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'live_events'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          Live Interaction Stream ({summary.totalEvents})
        </button>

        <button
          onClick={() => setActiveTab('benchmark')}
          className={`px-4 py-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'benchmark'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          Speed Benchmark Probe
        </button>
      </div>

      {/* Main Tab View Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metric KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Interaction Latency Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Client Interaction Speed</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-white">
                    {summary.avgInteractionMs}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">ms avg</span>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold ${
                    summary.avgInteractionMs < 150 ? 'text-emerald-400' : summary.avgInteractionMs < 400 ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {summary.avgInteractionMs < 150 ? 'Optimal (Sub-150ms)' : summary.avgInteractionMs < 400 ? 'Good' : 'Sluggish'}
                  </span>
                </div>
              </div>

              {/* API Response Time Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">API Roundtrip Speed</span>
                  <div className="p-2 rounded-lg bg-teal-500/10 text-teal-400">
                    <Server className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-white">
                    {summary.avgApiMs}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">ms avg</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>95th Percentile:</span>
                  <span className="font-semibold text-slate-200">{summary.p95LatencyMs} ms</span>
                </div>
              </div>

              {/* Bottlenecks Detected Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Bottlenecks & Long Tasks</span>
                  <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black tracking-tight ${summary.bottleneckCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {summary.bottleneckCount}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">incidents</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>UI Thread Freezes (&gt;50ms):</span>
                  <span className="font-semibold text-slate-200">{summary.longTasksCount}</span>
                </div>
              </div>

              {/* Memory & Health Card */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 relative overflow-hidden group">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Client Memory & Server</span>
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <Cpu className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black tracking-tight text-white">
                    {summary.estimatedMemoryMb ? `${summary.estimatedMemoryMb}` : `${serverSummary?.serverMemoryMb || 48}`}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">MB Heap</span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                  <span>Server Uptime:</span>
                  <span className="font-semibold text-slate-200">{serverSummary?.serverUptime ? `${Math.floor(serverSummary.serverUptime / 60)}m` : 'Active'}</span>
                </div>
              </div>
            </div>

            {/* Quick Diagnostic Insights Banner */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-emerald-950/30 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Automated Interaction & Bottleneck Monitoring Active</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {summary.bottleneckCount === 0 
                      ? "All monitored user interactions, state transitions, and server API calls are executing smoothly within high-speed thresholds." 
                      : `${summary.bottleneckCount} potential latency bottlenecks identified. Click 'Bottleneck Incidents' to inspect actionable remediation steps.`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveTab('bottlenecks')}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                Inspect Bottlenecks
              </button>
            </div>

            {/* Recent High Latency / Bottleneck Preview */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white">Recent Bottlenecks & Anomaly Log</h3>
                </div>
                <button
                  onClick={() => setActiveTab('bottlenecks')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  View All ({summary.bottleneckCount}) →
                </button>
              </div>

              {summary.bottlenecks.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
                  <p className="text-sm font-medium text-slate-300">No Performance Bottlenecks Detected</p>
                  <p className="text-xs text-slate-500 mt-1">Client interaction speed and API responses are operating within optimal latency bounds.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto">
                  {summary.bottlenecks.slice(0, 5).map(item => (
                    <div key={item.id} className="p-3.5 hover:bg-slate-800/40 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        {getSeverityBadge(item.severity, item.isBottleneck)}
                        <span className="font-semibold text-slate-200 truncate">{item.name}</span>
                        <span className="text-slate-500 text-[11px] uppercase tracking-wider">{item.type}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`font-mono font-bold ${getLatencyColor(item.duration, item.type)}`}>
                          {item.duration} ms
                        </span>
                        <span className="text-slate-500 text-[11px]">
                          {new Date(item.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Slowest Endpoints */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-teal-400" />
                  <h3 className="text-sm font-bold text-white">Top Monitored Endpoints & Performance</h3>
                </div>
                <button
                  onClick={() => setActiveTab('endpoints')}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer"
                >
                  Full Breakdown →
                </button>
              </div>

              {summary.endpointStats.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs">
                  Interact with the app to generate endpoint telemetry records.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/60">
                  {summary.endpointStats.slice(0, 5).map(ep => (
                    <div key={ep.url} className="p-3.5 hover:bg-slate-800/40 flex items-center justify-between gap-4 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-slate-300 truncate">{ep.url}</span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] font-bold">
                          {ep.count} reqs
                        </span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className="text-slate-400">
                          Avg: <strong className={getLatencyColor(ep.avgDuration, 'api')}>{ep.avgDuration} ms</strong>
                        </span>
                        <span className="text-slate-400">
                          Max: <strong className={getLatencyColor(ep.maxDuration, 'api')}>{ep.maxDuration} ms</strong>
                        </span>
                        {ep.bottlenecks > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold">
                            {ep.bottlenecks} bottlenecks
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* BOTTLENECK INCIDENTS TAB */}
        {activeTab === 'bottlenecks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Bottleneck Diagnostics & Performance Anomalies</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transactions exceeding latency thresholds (&gt;800ms UI actions, &gt;1500ms API calls, or &gt;50ms UI long tasks).
                </p>
              </div>
            </div>

            {summary.bottlenecks.length === 0 ? (
              <div className="p-12 rounded-2xl bg-slate-900 border border-slate-800 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3 opacity-90" />
                <h4 className="text-base font-bold text-white">Zero Bottlenecks Recorded</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
                  All monitored client-side interaction events, page transitions, and server-side API requests are running at optimal execution speeds.
                </p>
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-4">Severity</th>
                        <th className="py-3 px-4">Action / Endpoint</th>
                        <th className="py-3 px-4">Type</th>
                        <th className="py-3 px-4">Duration</th>
                        <th className="py-3 px-4">User / Session</th>
                        <th className="py-3 px-4">Timestamp</th>
                        <th className="py-3 px-4 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {summary.bottlenecks.map(b => (
                        <tr key={b.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4">{getSeverityBadge(b.severity, b.isBottleneck)}</td>
                          <td className="py-3 px-4 font-mono font-medium text-slate-200 max-w-xs truncate" title={b.name}>
                            {b.name}
                          </td>
                          <td className="py-3 px-4 text-slate-400 uppercase text-[10px] font-bold tracking-wider">{b.type}</td>
                          <td className="py-3 px-4 font-mono font-bold text-rose-400">{b.duration} ms</td>
                          <td className="py-3 px-4 text-slate-400 truncate max-w-[120px]">{b.userEmail || 'Anonymous'}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{new Date(b.timestamp).toLocaleTimeString()}</td>
                          <td className="py-3 px-4 text-right">
                            <button
                              onClick={() => setSelectedEvent(b)}
                              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ENDPOINT LATENCY BREAKDOWN TAB */}
        {activeTab === 'endpoints' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">API Endpoint Latency & Throughput Breakdown</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Aggregated response times, request counts, and error rates across all backend endpoints.
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-800/80 border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Endpoint Path</th>
                      <th className="py-3 px-4">Total Requests</th>
                      <th className="py-3 px-4">Avg Latency</th>
                      <th className="py-3 px-4">Peak Latency</th>
                      <th className="py-3 px-4">Bottlenecks</th>
                      <th className="py-3 px-4">Status / Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {summary.endpointStats.map(ep => (
                      <tr key={ep.url} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 font-mono font-medium text-slate-200">{ep.url}</td>
                        <td className="py-3 px-4 font-bold text-slate-300">{ep.count}</td>
                        <td className={`py-3 px-4 font-mono font-bold ${getLatencyColor(ep.avgDuration, 'api')}`}>
                          {ep.avgDuration} ms
                        </td>
                        <td className={`py-3 px-4 font-mono font-bold ${getLatencyColor(ep.maxDuration, 'api')}`}>
                          {ep.maxDuration} ms
                        </td>
                        <td className="py-3 px-4">
                          {ep.bottlenecks > 0 ? (
                            <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold">
                              {ep.bottlenecks}
                            </span>
                          ) : (
                            <span className="text-slate-500">0</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {ep.avgDuration < 300 ? (
                            <span className="text-emerald-400 font-medium flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> High Speed
                            </span>
                          ) : ep.avgDuration < 1000 ? (
                            <span className="text-amber-400 font-medium flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> Normal
                            </span>
                          ) : (
                            <span className="text-rose-400 font-bold flex items-center gap-1">
                              <AlertTriangle className="w-3.5 h-3.5" /> Slow Route
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LIVE INTERACTION STREAM TAB */}
        {activeTab === 'live_events' && (
          <div className="space-y-4">
            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search interaction name, endpoint, user, or status..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="all">All Event Types</option>
                  <option value="bottlenecks">Bottlenecks Only</option>
                  <option value="interaction">UI Interactions</option>
                  <option value="api">API Calls</option>
                  <option value="render">Renders / Paints</option>
                  <option value="longtask">Long Tasks</option>
                </select>
              </div>
            </div>

            {/* Events Stream Table */}
            <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
              <div className="overflow-x-auto max-h-[500px]">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-800 z-10">
                    <tr className="border-b border-slate-700 text-slate-300 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-4">Status / Severity</th>
                      <th className="py-3 px-4">Event / Target</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredEvents.map(evt => (
                      <tr key={evt.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-4">{getSeverityBadge(evt.severity, evt.isBottleneck)}</td>
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-200 truncate max-w-sm" title={evt.name}>
                          {evt.name}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 uppercase text-[10px] font-bold tracking-wider">{evt.type}</td>
                        <td className={`py-2.5 px-4 font-mono font-bold ${getLatencyColor(evt.duration, evt.type)}`}>
                          {evt.duration} ms
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 truncate max-w-[120px]">{evt.userEmail || 'Anonymous'}</td>
                        <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">{new Date(evt.timestamp).toLocaleTimeString()}</td>
                        <td className="py-2.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedEvent(evt)}
                            className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="View Event Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* SPEED BENCHMARK PROBE TAB */}
        {activeTab === 'benchmark' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-white">Full-Stack Diagnostic Speed Benchmark</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl">
                    Executes multi-tier latency probes to test HTTP gateway roundtrip, database query speed, memory heap allocation, and client-side UI rendering latency.
                  </p>
                </div>
                <button
                  onClick={handleRunBenchmark}
                  disabled={isBenchmarkRunning}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Play className={`w-4 h-4 ${isBenchmarkRunning ? 'animate-spin' : ''}`} />
                  {isBenchmarkRunning ? 'Running Latency Benchmark...' : 'Start Live Diagnostic Probe'}
                </button>
              </div>

              {benchmarkResult && (
                <div className="mt-8 space-y-6 pt-6 border-t border-slate-800 animate-in fade-in">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <div className="flex items-center gap-3">
                      <div className={`p-3 rounded-xl ${
                        benchmarkResult.overallScore >= 80 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        <Zap className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Overall System Performance</div>
                        <div className="text-lg font-extrabold text-white">{benchmarkResult.status} Performance Rating</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-3xl font-black text-emerald-400">{benchmarkResult.overallScore}</span>
                      <span className="text-xs text-slate-400">/100</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-xs text-slate-400 font-semibold uppercase">1. Gateway Roundtrip</span>
                      <div className="text-2xl font-black text-white mt-1">{benchmarkResult.pingMs} ms</div>
                      <p className="text-[11px] text-emerald-400 mt-1">HTTP Keep-Alive OK</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-xs text-slate-400 font-semibold uppercase">2. Database Query Speed</span>
                      <div className="text-2xl font-black text-white mt-1">{benchmarkResult.dbQueryMs} ms</div>
                      <p className="text-[11px] text-emerald-400 mt-1">Single-Flight Cached</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-xs text-slate-400 font-semibold uppercase">3. Payload Decompression</span>
                      <div className="text-2xl font-black text-white mt-1">{benchmarkResult.payloadProcessingMs} ms</div>
                      <p className="text-[11px] text-emerald-400 mt-1">5,000 JSON Nodes</p>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <span className="text-xs text-slate-400 font-semibold uppercase">4. UI Render Latency</span>
                      <div className="text-2xl font-black text-white mt-1">{benchmarkResult.uiRenderMs} ms</div>
                      <p className="text-[11px] text-emerald-400 mt-1">60 FPS Double Frame</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Selected Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Event Telemetry Inspector</h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-800/50">
                <div>
                  <span className="text-slate-400 block font-semibold">Event Name:</span>
                  <span className="font-mono text-slate-200">{selectedEvent.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Type:</span>
                  <span className="uppercase font-bold text-slate-300">{selectedEvent.type}</span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Duration:</span>
                  <span className={`font-mono font-bold ${getLatencyColor(selectedEvent.duration, selectedEvent.type)}`}>
                    {selectedEvent.duration} ms
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block font-semibold">Classification:</span>
                  {getSeverityBadge(selectedEvent.severity, selectedEvent.isBottleneck)}
                </div>
              </div>

              {selectedEvent.details && (
                <div>
                  <span className="text-slate-400 block font-semibold mb-1">Payload & Trace Metadata:</span>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-48">
                    {JSON.stringify(selectedEvent.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
