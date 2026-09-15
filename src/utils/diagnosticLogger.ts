/**
 * Diagnostic Utility: IPMS 4-Pillars Verification (KPIs, KPAs, JSCs, PDPs)
 * 
 * Verifies the total count of KPIs, KPAs, JSCs, and PDPs fetched from the database
 * versus what is actively rendered in the UI, and logs detailed diagnostics and
 * discrepancies to the browser console for debugging.
 */

export type PillarType = 'KPIs' | 'KPAs' | 'JSCs' | 'PDPs';

export type DiscrepancyStatus = 
  | 'MATCH' 
  | 'DISCREPANCY_DEFICIT' 
  | 'DISCREPANCY_SURPLUS' 
  | 'DB_EMPTY' 
  | 'UI_UNRENDERED';

export interface PillarDiagnosticItem {
  pillar: PillarType;
  dbCount: number;
  uiCount: number;
  discrepancy: boolean;
  difference: number; // uiCount - dbCount
  status: DiscrepancyStatus;
  expectedBenchmark: number; // Standard target benchmark (17 KPIs, 6 KPAs, 12 JSCs, 6 PDPs)
  dbSample?: string[];
  uiSample?: string[];
  details: string;
}

export interface PillarDiagnosticReport {
  timestamp: string;
  userEmail: string;
  tenantId: string;
  callerSource: string;
  hasDiscrepancies: boolean;
  totalDbCount: number;
  totalUiCount: number;
  pillars: Record<PillarType, PillarDiagnosticItem>;
  summaryMessage: string;
}

export interface VerifyPillarOptions {
  userEmail?: string;
  tenantId?: string;
  uiCounts?: {
    kpis?: number | any[];
    kpas?: number | any[];
    jscs?: number | any[];
    pdps?: number | any[];
  };
  callerSource?: string;
  logToConsole?: boolean;
  forceGroupOpen?: boolean;
}

// Standard baseline counts expected for full Nkangala municipal profiles
export const STATUTORY_BENCHMARKS: Record<PillarType, number> = {
  KPIs: 17,
  KPAs: 6,
  JSCs: 12,
  PDPs: 6
};

/**
 * Normalizes input items or count to a uniform count and preview list
 */
function extractCountAndPreview(input: number | any[] | undefined): { count: number; preview: string[] } {
  if (input === undefined || input === null) {
    return { count: 0, preview: [] };
  }
  if (typeof input === 'number') {
    return { count: Math.max(0, input), preview: [`Count provided: ${input}`] };
  }
  if (Array.isArray(input)) {
    const preview = input.slice(0, 3).map((item, idx) => {
      if (typeof item === 'string') return item;
      if (typeof item === 'object' && item !== null) {
        return item.kpi || item.name || item.competency || item.skillsGap || item.title || item.kpiNo || `Item ${idx + 1}`;
      }
      return String(item);
    });
    return { count: input.length, preview };
  }
  return { count: 0, preview: [] };
}

/**
 * Fetches raw database counts and lists directly from server-side APIs for the target official
 */
export async function fetchPillarDataFromDatabase(userEmail: string, tenantId: string = 'nkangala_auto'): Promise<{
  kpis: { count: number; items: any[] };
  kpas: { count: number; items: any[] };
  jscs: { count: number; items: any[] };
  pdps: { count: number; items: any[] };
}> {
  const safeEmail = encodeURIComponent(userEmail.trim().toLowerCase());
  const cacheBuster = `t=${Date.now()}`;

  const results = {
    kpis: { count: 0, items: [] as any[] },
    kpas: { count: 0, items: [] as any[] },
    jscs: { count: 0, items: [] as any[] },
    pdps: { count: 0, items: [] as any[] }
  };

  // Fetch all 4 pillars concurrently from server endpoints
  try {
    const [kpiRes, planRes, kpaRes, jscRes, pdpRes] = await Promise.allSettled([
      fetch(`/api/tenant/${tenantId}/kpis?userId=${safeEmail}&${cacheBuster}`),
      fetch(`/api/tenant/${tenantId}/pplan?userId=${safeEmail}&${cacheBuster}`),
      fetch(`/api/tenant/${tenantId}/kpas?userId=${safeEmail}&${cacheBuster}`),
      fetch(`/api/tenant/${tenantId}/job-competencies?userId=${safeEmail}&${cacheBuster}`),
      fetch(`/api/tenant/${tenantId}/pdp?userId=${safeEmail}&${cacheBuster}`)
    ]);

    // 1. Process KPIs & Performance Plan
    let rawKpis: any[] = [];
    if (kpiRes.status === 'fulfilled' && kpiRes.value.ok) {
      try {
        const data = await kpiRes.value.json();
        if (Array.isArray(data.kpis)) rawKpis = data.kpis;
        else if (Array.isArray(data.items)) rawKpis = data.items;
        else if (Array.isArray(data)) rawKpis = data;
      } catch (e) {}
    }
    if (rawKpis.length === 0 && planRes.status === 'fulfilled' && planRes.value.ok) {
      try {
        const data = await planRes.value.json();
        if (Array.isArray(data.items)) rawKpis = data.items;
        else if (Array.isArray(data.rows)) rawKpis = data.rows;
      } catch (e) {}
    }
    results.kpis = { count: rawKpis.length, items: rawKpis };

    // 2. Process KPAs
    let rawKpas: any[] = [];
    if (kpaRes.status === 'fulfilled' && kpaRes.value.ok) {
      try {
        const data = await kpaRes.value.json();
        if (Array.isArray(data.kpas)) rawKpas = data.kpas;
        else if (data.customKpaTable?.rows && Array.isArray(data.customKpaTable.rows)) rawKpas = data.customKpaTable.rows;
        else if (Array.isArray(data)) rawKpas = data;
      } catch (e) {}
    }
    results.kpas = { count: rawKpas.length, items: rawKpas };

    // 3. Process JSCs
    let rawJscs: any[] = [];
    if (jscRes.status === 'fulfilled' && jscRes.value.ok) {
      try {
        const data = await jscRes.value.json();
        if (Array.isArray(data.competencies)) rawJscs = data.competencies;
        else if (Array.isArray(data.items)) rawJscs = data.items;
        else if (Array.isArray(data)) rawJscs = data;
      } catch (e) {}
    }
    results.jscs = { count: rawJscs.length, items: rawJscs };

    // 4. Process PDPs
    let rawPdps: any[] = [];
    if (pdpRes.status === 'fulfilled' && pdpRes.value.ok) {
      try {
        const data = await pdpRes.value.json();
        if (Array.isArray(data.items)) rawPdps = data.items;
        else if (Array.isArray(data.pdps)) rawPdps = data.pdps;
        else if (Array.isArray(data)) rawPdps = data;
      } catch (e) {}
    }
    results.pdps = { count: rawPdps.length, items: rawPdps };

  } catch (err) {
    console.error('Diagnostic error fetching database pillar counts:', err);
  }

  return results;
}

/**
 * Compares DB vs UI items for a single pillar
 */
function evaluatePillar(
  pillar: PillarType,
  dbCount: number,
  dbItems: any[],
  uiInput: number | any[] | undefined
): PillarDiagnosticItem {
  const { count: uiCount, preview: uiSample } = extractCountAndPreview(uiInput);
  const dbSample = dbItems.slice(0, 3).map((item, idx) => {
    if (typeof item === 'string') return item;
    if (typeof item === 'object' && item !== null) {
      return item.kpi || item.name || item.competency || item.skillsGap || item.title || item.kpiNo || `DB Item ${idx + 1}`;
    }
    return String(item);
  });

  const difference = uiCount - dbCount;
  const discrepancy = dbCount !== uiCount;
  let status: DiscrepancyStatus = 'MATCH';

  if (dbCount === 0 && uiCount === 0) {
    status = 'DB_EMPTY';
  } else if (dbCount > 0 && uiCount === 0) {
    status = 'UI_UNRENDERED';
  } else if (difference < 0) {
    status = 'DISCREPANCY_DEFICIT';
  } else if (difference > 0) {
    status = 'DISCREPANCY_SURPLUS';
  } else {
    status = 'MATCH';
  }

  let details = '';
  if (status === 'MATCH') {
    details = `Synchronized: ${uiCount}/${dbCount} items rendered (Benchmark: ${STATUTORY_BENCHMARKS[pillar]}).`;
  } else if (status === 'DISCREPANCY_DEFICIT') {
    details = `Deficit Discrepancy: Database has ${dbCount} records, but UI rendered only ${uiCount} (${Math.abs(difference)} missing in UI).`;
  } else if (status === 'DISCREPANCY_SURPLUS') {
    details = `Surplus Discrepancy: UI has ${uiCount} items rendered, exceeding DB count of ${dbCount} (+${difference} extra in UI).`;
  } else if (status === 'UI_UNRENDERED') {
    details = `Critical: Database returned ${dbCount} items, but UI rendered 0 items.`;
  } else {
    details = `Empty: 0 items in DB and 0 items rendered.`;
  }

  return {
    pillar,
    dbCount,
    uiCount,
    discrepancy,
    difference,
    status,
    expectedBenchmark: STATUTORY_BENCHMARKS[pillar],
    dbSample,
    uiSample,
    details
  };
}

/**
 * Main Diagnostic Utility Function:
 * Verifies the total count of KPIs, KPAs, JSCs, and PDPs fetched from the database
 * versus what is rendered in the UI, and logs discrepancies to the console for debugging.
 *
 * @param options Diagnostic options including userEmail, tenantId, and UI counts/arrays
 * @returns Promise<PillarDiagnosticReport> Comprehensive structured diagnostic report
 */
export async function verifyPillarCounts(options: VerifyPillarOptions = {}): Promise<PillarDiagnosticReport> {
  const userEmail = options.userEmail || 'current_user';
  const tenantId = options.tenantId || 'nkangala_auto';
  const caller = options.callerSource || 'IPMS Component';
  const shouldLog = options.logToConsole !== false;

  // 1. Fetch DB counts
  const dbData = await fetchPillarDataFromDatabase(userEmail, tenantId);

  // 2. Evaluate all 4 pillars
  const kpisEval = evaluatePillar('KPIs', dbData.kpis.count, dbData.kpis.items, options.uiCounts?.kpis);
  const kpasEval = evaluatePillar('KPAs', dbData.kpas.count, dbData.kpas.items, options.uiCounts?.kpas);
  const jscsEval = evaluatePillar('JSCs', dbData.jscs.count, dbData.jscs.items, options.uiCounts?.jscs);
  const pdpsEval = evaluatePillar('PDPs', dbData.pdps.count, dbData.pdps.items, options.uiCounts?.pdps);

  const pillars: Record<PillarType, PillarDiagnosticItem> = {
    KPIs: kpisEval,
    KPAs: kpasEval,
    JSCs: jscsEval,
    PDPs: pdpsEval
  };

  const hasDiscrepancies = kpisEval.discrepancy || kpasEval.discrepancy || jscsEval.discrepancy || pdpsEval.discrepancy;
  const totalDbCount = dbData.kpis.count + dbData.kpas.count + dbData.jscs.count + dbData.pdps.count;
  const totalUiCount = kpisEval.uiCount + kpasEval.uiCount + jscsEval.uiCount + pdpsEval.uiCount;

  let summaryMessage = '';
  if (!hasDiscrepancies) {
    summaryMessage = `All 4 IPMS pillars are in 100% parity (DB Total: ${totalDbCount} items, UI Total: ${totalUiCount} items).`;
  } else {
    const discrepancyList = (Object.keys(pillars) as PillarType[])
      .filter(p => pillars[p].discrepancy)
      .map(p => `${p} (DB: ${pillars[p].dbCount} vs UI: ${pillars[p].uiCount})`)
      .join(', ');
    summaryMessage = `Discrepancies detected across: ${discrepancyList}.`;
  }

  const report: PillarDiagnosticReport = {
    timestamp: new Date().toISOString(),
    userEmail,
    tenantId,
    callerSource: caller,
    hasDiscrepancies,
    totalDbCount,
    totalUiCount,
    pillars,
    summaryMessage
  };

  // 3. Log to console if requested
  if (shouldLog) {
    logDiagnosticReportToConsole(report, options.forceGroupOpen);
  }

  return report;
}

/**
 * Formats and outputs the diagnostic report to the browser console
 */
export function logDiagnosticReportToConsole(report: PillarDiagnosticReport, forceGroupOpen = false): void {
  const badgeStyle = report.hasDiscrepancies
    ? 'background: #dc2626; color: #ffffff; font-weight: bold; padding: 3px 8px; border-radius: 4px;'
    : 'background: #059669; color: #ffffff; font-weight: bold; padding: 3px 8px; border-radius: 4px;';
  
  const titleStyle = 'font-weight: bold; color: #1e293b;';
  const groupLabel = `%c[IPMS PILLAR DIAGNOSTIC]%c ${report.hasDiscrepancies ? '⚠️ DISCREPANCIES DETECTED' : '✅ 100% IN SYNC'} — ${report.userEmail} (${report.callerSource})`;

  if (report.hasDiscrepancies || forceGroupOpen) {
    console.group(groupLabel, badgeStyle, titleStyle);
  } else {
    console.groupCollapsed(groupLabel, badgeStyle, titleStyle);
  }

  console.info(`🕒 Timestamp: ${report.timestamp}`);
  console.info(`👤 Target User: ${report.userEmail}`);
  console.info(`🏛️ Tenant ID: ${report.tenantId}`);
  console.info(`📍 Caller Source: ${report.callerSource}`);
  console.info(`📊 Summary: ${report.summaryMessage}`);

  // Tabular diagnostic comparison
  const tableData: Record<string, any> = {};
  (Object.keys(report.pillars) as PillarType[]).forEach(key => {
    const p = report.pillars[key];
    tableData[key] = {
      'DB Count': p.dbCount,
      'UI Rendered': p.uiCount,
      'Match?': p.discrepancy ? '❌ NO' : '✅ YES',
      'Difference': p.difference > 0 ? `+${p.difference}` : p.difference,
      'Statutory Benchmark': p.expectedBenchmark,
      'Status': p.status,
      'Details': p.details
    };
  });
  console.table(tableData);

  // Explicit warning/error logs for each discrepancy
  if (report.hasDiscrepancies) {
    (Object.keys(report.pillars) as PillarType[]).forEach(key => {
      const p = report.pillars[key];
      if (p.discrepancy) {
        console.warn(
          `%c⚠️ Discrepancy in ${key}:%c Database returned ${p.dbCount} item(s), but UI rendered ${p.uiCount} item(s). Difference: ${p.difference}. Benchmark target: ${p.expectedBenchmark}.`,
          'color: #b91c1c; font-weight: bold;',
          'color: #334155;'
        );
        if (p.dbSample && p.dbSample.length > 0) {
          console.debug(`  DB Sample (${key}):`, p.dbSample);
        }
        if (p.uiSample && p.uiSample.length > 0) {
          console.debug(`  UI Sample (${key}):`, p.uiSample);
        }
      }
    });
  }

  console.groupEnd();
}

/**
 * Diagnostic helper for standalone in-component comparison
 * Can be called synchronously if both DB and UI arrays are already in memory.
 */
export function diagnosePillarDiscrepancy(
  pillar: PillarType,
  dbItems: any[],
  uiItems: any[] | number,
  context?: { userEmail?: string; tenantId?: string; caller?: string }
): PillarDiagnosticItem {
  const result = evaluatePillar(pillar, Array.isArray(dbItems) ? dbItems.length : 0, dbItems || [], uiItems);

  if (result.discrepancy) {
    console.warn(
      `%c[IPMS Pillar Discrepancy: ${pillar}]%c DB Count: ${result.dbCount} vs UI Count: ${result.uiCount} (Diff: ${result.difference}). User: ${context?.userEmail || 'N/A'}, Caller: ${context?.caller || 'N/A'}`,
      'background: #fef2f2; color: #dc2626; font-weight: bold; padding: 2px 6px; border: 1px solid #f87171; border-radius: 3px;',
      'color: #1e293b;'
    );
  }

  return result;
}

// Global window registration for instant interactive console debugging
if (typeof window !== 'undefined') {
  (window as any).runIpmsDiagnostics = async (userEmail?: string, tenantId = 'nkangala_auto') => {
    const targetEmail = userEmail || (window as any).__CURRENT_USER_EMAIL__ || 'zulune@nkangaladm.gov.za';
    console.log(`%c[RUNNING IPMS DIAGNOSTICS]%c Querying database for ${targetEmail}...`, 'color: #2563eb; font-weight: bold;', 'color: #64748b;');
    return await verifyPillarCounts({
      userEmail: targetEmail,
      tenantId,
      callerSource: 'Browser DevTools Console',
      forceGroupOpen: true
    });
  };

  (window as any).verifyPillarCounts = verifyPillarCounts;
  (window as any).diagnosePillarDiscrepancy = diagnosePillarDiscrepancy;
}

/**
 * React hook to automatically trigger pillar diagnostics on component mount or data changes
 */
export function usePillarDiagnostics(options: VerifyPillarOptions & { enabled?: boolean }) {
  const { enabled = true, ...diagOptions } = options;
  
  if (typeof window !== 'undefined' && options.userEmail) {
    (window as any).__CURRENT_USER_EMAIL__ = options.userEmail;
  }

  return {
    runCheck: () => verifyPillarCounts(diagOptions),
    verifyPillarCounts,
    diagnosePillarDiscrepancy
  };
}
