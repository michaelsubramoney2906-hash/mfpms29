// Lightweight Client-Side Performance Logging & Telemetry Utility

export type PerformanceEventType = 'interaction' | 'api' | 'render' | 'longtask' | 'page_load' | 'benchmark';
export type PerformanceSeverity = 'normal' | 'moderate' | 'slow' | 'critical';

export interface PerformanceEvent {
  id: string;
  type: PerformanceEventType;
  name: string;
  duration: number; // in milliseconds
  timestamp: string;
  status?: number | string;
  isBottleneck: boolean;
  severity: PerformanceSeverity;
  details?: Record<string, any>;
  url?: string;
  method?: string;
  userEmail?: string;
  tenantId?: string;
}

export interface EndpointStat {
  url: string;
  count: number;
  avgDuration: number;
  maxDuration: number;
  bottlenecks: number;
  errors: number;
}

export interface PerformanceTelemetrySummary {
  avgInteractionMs: number;
  avgApiMs: number;
  p95LatencyMs: number;
  totalEvents: number;
  bottleneckCount: number;
  criticalCount: number;
  events: PerformanceEvent[];
  bottlenecks: PerformanceEvent[];
  endpointStats: EndpointStat[];
  longTasksCount: number;
  estimatedMemoryMb?: number;
}

// Thresholds for bottleneck classification (in milliseconds)
export const PERFORMANCE_THRESHOLDS = {
  INTERACTION_MODERATE: 150,
  INTERACTION_SLOW: 400,
  INTERACTION_BOTTLENECK: 800,
  API_MODERATE: 300,
  API_SLOW: 1000,
  API_BOTTLENECK: 2000,
  RENDER_SLOW: 100,
  LONG_TASK_MIN: 50,
};

class PerformanceLogger {
  private queue: PerformanceEvent[] = [];
  private maxQueueSize = 500;
  private flushTimer: any = null;
  private currentUserEmail: string = 'anonymous';
  private currentTenantId: string = 'default';
  private isInitialized = false;
  private isEnabled = true;
  private listeners: ((events: PerformanceEvent[]) => void)[] = [];
  private originalFetch: typeof window.fetch | null = null;
  private longTasksCount = 0;
  private notifyTimeout: any = null;
  private lastNotifyTime = 0;

  constructor() {
    // Singleton
  }

  public init(userEmail?: string, tenantId?: string) {
    if (userEmail) this.currentUserEmail = userEmail;
    if (tenantId) this.currentTenantId = tenantId;

    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    this.interceptFetch();
    this.observeLongTasks();
    this.observePageMetrics();
    this.startAutoFlush();

    // Log initial page ready
    this.logEvent({
      type: 'page_load',
      name: 'Application Initialization',
      duration: Math.round(performance.now()),
      status: 'ready',
      details: {
        userAgent: navigator.userAgent,
        screenWidth: window.innerWidth,
        screenHeight: window.innerHeight,
        connection: (navigator as any).connection?.effectiveType || 'unknown'
      }
    });
  }

  public setUserContext(userEmail?: string, tenantId?: string) {
    if (userEmail) this.currentUserEmail = userEmail;
    if (tenantId) this.currentTenantId = tenantId;
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public isLoggingEnabled(): boolean {
    return this.isEnabled;
  }

  private classifySeverity(type: PerformanceEventType, duration: number, isError: boolean): { severity: PerformanceSeverity; isBottleneck: boolean } {
    if (isError) return { severity: 'critical', isBottleneck: true };

    if (type === 'api') {
      if (duration >= PERFORMANCE_THRESHOLDS.API_BOTTLENECK) return { severity: 'critical', isBottleneck: true };
      if (duration >= PERFORMANCE_THRESHOLDS.API_SLOW) return { severity: 'slow', isBottleneck: true };
      if (duration >= PERFORMANCE_THRESHOLDS.API_MODERATE) return { severity: 'moderate', isBottleneck: false };
      return { severity: 'normal', isBottleneck: false };
    }

    if (type === 'interaction') {
      if (duration >= PERFORMANCE_THRESHOLDS.INTERACTION_BOTTLENECK) return { severity: 'critical', isBottleneck: true };
      if (duration >= PERFORMANCE_THRESHOLDS.INTERACTION_SLOW) return { severity: 'slow', isBottleneck: true };
      if (duration >= PERFORMANCE_THRESHOLDS.INTERACTION_MODERATE) return { severity: 'moderate', isBottleneck: false };
      return { severity: 'normal', isBottleneck: false };
    }

    if (type === 'render') {
      if (duration >= PERFORMANCE_THRESHOLDS.RENDER_SLOW * 3) return { severity: 'critical', isBottleneck: true };
      if (duration >= PERFORMANCE_THRESHOLDS.RENDER_SLOW) return { severity: 'slow', isBottleneck: true };
      return { severity: 'normal', isBottleneck: false };
    }

    if (type === 'longtask') {
      return { severity: duration >= 150 ? 'critical' : 'slow', isBottleneck: true };
    }

    return { severity: 'normal', isBottleneck: false };
  }

  public logEvent(data: {
    type: PerformanceEventType;
    name: string;
    duration: number;
    status?: number | string;
    details?: Record<string, any>;
    url?: string;
    method?: string;
  }): PerformanceEvent {
    const isError = typeof data.status === 'number' && data.status >= 400;
    const { severity, isBottleneck } = this.classifySeverity(data.type, data.duration, isError);

    const event: PerformanceEvent = {
      id: `perf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      type: data.type,
      name: data.name,
      duration: Math.max(0, Math.round(data.duration * 10) / 10),
      timestamp: new Date().toISOString(),
      status: data.status ?? 'ok',
      isBottleneck,
      severity,
      details: data.details,
      url: data.url,
      method: data.method,
      userEmail: this.currentUserEmail,
      tenantId: this.currentTenantId,
    };

    if (this.isEnabled) {
      this.queue.push(event);
      if (this.queue.length > this.maxQueueSize) {
        this.queue.shift();
      }
      this.notifyListeners();

      // If critical bottleneck detected, flush quickly
      if (severity === 'critical') {
        this.scheduleQuickFlush();
      }
    }

    return event;
  }

  // Timer helper: starts measurement and returns an end function
  public startMeasure(name: string, type: PerformanceEventType = 'interaction', details?: Record<string, any>) {
    const start = performance.now();
    return (status: number | string = 'ok', additionalDetails?: Record<string, any>) => {
      const duration = performance.now() - start;
      return this.logEvent({
        type,
        name,
        duration,
        status,
        details: { ...details, ...additionalDetails }
      });
    };
  }

  // Intercept window.fetch to automatically log API latencies & errors
  private interceptFetch() {
    if (typeof window === 'undefined' || !window.fetch) return;
    try {
      const orig = window.fetch.bind(window);
      this.originalFetch = orig;

      const wrappedFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const url = typeof input === 'string' ? input : (input instanceof Request ? input.url : input.toString());
        const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();

        // Avoid monitoring our own logging endpoint to prevent recursion
        if (url.includes('/api/admin/performance-logs')) {
          return orig(input, init);
        }

        const start = performance.now();
        try {
          const response = await orig(input, init);
          const duration = performance.now() - start;

          // Strip query params for cleaner aggregation name, but keep in details
          const cleanPath = url.split('?')[0];

          this.logEvent({
            type: 'api',
            name: `${method} ${cleanPath}`,
            duration,
            status: response.status,
            url,
            method,
            details: {
              statusText: response.statusText,
              ok: response.ok,
              type: response.type
            }
          });

          return response;
        } catch (err: any) {
          const duration = performance.now() - start;
          this.logEvent({
            type: 'api',
            name: `${method} ${url.split('?')[0]}`,
            duration,
            status: 500,
            url,
            method,
            details: { error: err?.message || 'Network Fetch Failed' }
          });
          throw err;
        }
      };

      // Safely apply wrapper without throwing on getter-only or sealed window properties
      try {
        Object.defineProperty(window, 'fetch', {
          value: wrappedFetch,
          writable: true,
          configurable: true,
          enumerable: true
        });
      } catch {
        try {
          (window as any).fetch = wrappedFetch;
        } catch {
          // If window.fetch is strict getter-only in this environment, gracefully continue without crashing
        }
      }
    } catch {
      // Safe fallback
    }
  }

  // Observe Main Thread Long Tasks (>50ms)
  private observeLongTasks() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.longTasksCount++;
          this.logEvent({
            type: 'longtask',
            name: `UI Thread Long Task (${Math.round(entry.duration)}ms)`,
            duration: entry.duration,
            status: 'blocked',
            details: {
              startTime: Math.round(entry.startTime),
              attribution: (entry as any).attribution?.[0]?.name || 'script'
            }
          });
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
    } catch (e) {
      // Not supported in this environment
    }
  }

  // Capture First Paint and First Contentful Paint
  private observePageMetrics() {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-paint' || entry.name === 'first-contentful-paint') {
            this.logEvent({
              type: 'render',
              name: entry.name === 'first-paint' ? 'First Paint (FP)' : 'First Contentful Paint (FCP)',
              duration: entry.startTime,
              status: 'paint',
              details: { entryType: entry.entryType }
            });
          }
        }
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch (e) {}
  }

  // Auto-flush batch logs to server
  private startAutoFlush() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => {
      this.flushToServer();
    }, 15000); // Flush every 15s

    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.flushToServer(true);
      });
    }
  }

  private scheduleQuickFlush() {
    setTimeout(() => {
      this.flushToServer();
    }, 500);
  }

  public async flushToServer(isBeacon = false) {
    if (this.queue.length === 0 || !this.isEnabled) return;

    const eventsToSend = [...this.queue.slice(-50)]; // send recent batch
    const payload = JSON.stringify({
      events: eventsToSend,
      userEmail: this.currentUserEmail,
      tenantId: this.currentTenantId,
      timestamp: new Date().toISOString()
    });

    if (isBeacon && typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/admin/performance-logs', blob);
      return;
    }

    try {
      if (this.originalFetch) {
        await this.originalFetch('/api/admin/performance-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload
        });
      }
    } catch (e) {
      // Fail silently to never break user flow
    }
  }

  // On-demand real-time benchmark suite
  public async runDiagnosticBenchmark(): Promise<{
    pingMs: number;
    dbQueryMs: number;
    payloadProcessingMs: number;
    uiRenderMs: number;
    overallScore: number; // 0-100
    status: 'Optimal' | 'Good' | 'Degraded' | 'Critical';
  }> {
    const fetchFunc = this.originalFetch || window.fetch;

    // 1. Gateway Ping Roundtrip
    const t0 = performance.now();
    let pingMs = 0;
    try {
      await fetchFunc('/api/admin/performance-benchmark?mode=ping');
      pingMs = Math.round(performance.now() - t0);
    } catch {
      pingMs = 999;
    }

    // 2. Database Query Roundtrip
    const t1 = performance.now();
    let dbQueryMs = 0;
    try {
      await fetchFunc('/api/tenant/nkangala_auto/users?minimal=true');
      dbQueryMs = Math.round(performance.now() - t1);
    } catch {
      dbQueryMs = 999;
    }

    // 3. Payload Processing & JSON Serialization
    const t2 = performance.now();
    const testArray = Array.from({ length: 5000 }, (_, i) => ({ id: i, text: `Item payload test string ${i}`, active: true }));
    const jsonStr = JSON.stringify(testArray);
    JSON.parse(jsonStr);
    const payloadProcessingMs = Math.round((performance.now() - t2) * 10) / 10;

    // 4. UI Render Latency Benchmark
    const t3 = performance.now();
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const uiRenderMs = Math.round((performance.now() - t3) * 10) / 10;

    // Calculate score
    let score = 100;
    if (pingMs > 200) score -= 15;
    if (pingMs > 600) score -= 25;
    if (dbQueryMs > 300) score -= 15;
    if (dbQueryMs > 1000) score -= 25;
    if (uiRenderMs > 32) score -= 20;

    const overallScore = Math.max(10, Math.min(100, score));
    let status: 'Optimal' | 'Good' | 'Degraded' | 'Critical' = 'Optimal';
    if (overallScore < 50) status = 'Critical';
    else if (overallScore < 75) status = 'Degraded';
    else if (overallScore < 90) status = 'Good';

    const result = { pingMs, dbQueryMs, payloadProcessingMs, uiRenderMs, overallScore, status };

    this.logEvent({
      type: 'benchmark',
      name: `Full System Diagnostic Benchmark (${status} - Score ${overallScore}/100)`,
      duration: pingMs + dbQueryMs + uiRenderMs,
      status: overallScore >= 75 ? 'passed' : 'warning',
      details: result
    });

    return result;
  }

  // Get current summary metrics
  public getSummary(): PerformanceTelemetrySummary {
    const events = [...this.queue];
    const bottlenecks = events.filter(e => e.isBottleneck);
    const criticalCount = events.filter(e => e.severity === 'critical').length;

    const interactionEvents = events.filter(e => e.type === 'interaction');
    const apiEvents = events.filter(e => e.type === 'api');

    const avgInteractionMs = interactionEvents.length > 0
      ? Math.round(interactionEvents.reduce((acc, e) => acc + e.duration, 0) / interactionEvents.length)
      : 0;

    const avgApiMs = apiEvents.length > 0
      ? Math.round(apiEvents.reduce((acc, e) => acc + e.duration, 0) / apiEvents.length)
      : 0;

    // Calculate p95 latency
    const sortedDurations = events.map(e => e.duration).sort((a, b) => a - b);
    const p95Index = Math.floor(sortedDurations.length * 0.95);
    const p95LatencyMs = sortedDurations.length > 0 ? sortedDurations[p95Index] || 0 : 0;

    // Group endpoint stats
    const endpointMap = new Map<string, { count: number; totalDuration: number; maxDuration: number; bottlenecks: number; errors: number }>();
    for (const e of apiEvents) {
      const key = e.name;
      const current = endpointMap.get(key) || { count: 0, totalDuration: 0, maxDuration: 0, bottlenecks: 0, errors: 0 };
      current.count++;
      current.totalDuration += e.duration;
      current.maxDuration = Math.max(current.maxDuration, e.duration);
      if (e.isBottleneck) current.bottlenecks++;
      if (typeof e.status === 'number' && e.status >= 400) current.errors++;
      endpointMap.set(key, current);
    }

    const endpointStats: EndpointStat[] = Array.from(endpointMap.entries()).map(([url, stats]) => ({
      url,
      count: stats.count,
      avgDuration: Math.round(stats.totalDuration / stats.count),
      maxDuration: stats.maxDuration,
      bottlenecks: stats.bottlenecks,
      errors: stats.errors
    })).sort((a, b) => b.avgDuration - a.avgDuration);

    const memoryMb = (performance as any).memory?.usedJSHeapSize
      ? Math.round(((performance as any).memory.usedJSHeapSize / (1024 * 1024)) * 10) / 10
      : undefined;

    return {
      avgInteractionMs,
      avgApiMs,
      p95LatencyMs,
      totalEvents: events.length,
      bottleneckCount: bottlenecks.length,
      criticalCount,
      events: events.slice().reverse(),
      bottlenecks: bottlenecks.slice().reverse(),
      endpointStats,
      longTasksCount: this.longTasksCount,
      estimatedMemoryMb: memoryMb
    };
  }

  public clearLogs() {
    this.queue = [];
    this.longTasksCount = 0;
    this.notifyListeners();
  }

  public subscribe(callback: (events: PerformanceEvent[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners() {
    if (this.listeners.length === 0) return;
    const now = Date.now();
    if (now - this.lastNotifyTime < 1500) {
      if (!this.notifyTimeout) {
        this.notifyTimeout = setTimeout(() => {
          this.notifyTimeout = null;
          this.lastNotifyTime = Date.now();
          this.dispatchToListeners();
        }, 1500);
      }
      return;
    }
    this.lastNotifyTime = now;
    this.dispatchToListeners();
  }

  private dispatchToListeners() {
    for (const cb of this.listeners) {
      try {
        cb(this.queue);
      } catch (e) {}
    }
  }
}

export const performanceLogger = new PerformanceLogger();
