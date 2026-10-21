/**
 * Intelligent Variance & Metric Extractor for IPMS and OPMS / SDBIP
 * Nkangala District Municipality Performance Management System
 */

export const isCellNA = (val: any): boolean => {
  if (val === null || val === undefined) return false;
  const s = String(val).trim().toUpperCase();
  return (
    s === 'N/A' ||
    s === 'NA' ||
    s === 'N / A' ||
    s === 'NOT APPLICABLE' ||
    s.startsWith('N/A') ||
    s.startsWith('NOT APPLICABLE') ||
    s.includes('LOCKED (NOT REPORTABLE)')
  );
};

export const extractNumericValue = (val?: any): number | null => {
  if (val === null || val === undefined) return null;
  const raw = String(val).trim();
  if (!raw) return null;

  // Pure number check: "1", "1.5", "-2", "90", "100"
  if (/^-?\d+(\.\d+)?$/.test(raw)) {
    return parseFloat(raw);
  }

  // Pre-cleaning non-metric digits:
  // 1. Remove 4-digit years & split financial years (e.g., 2025/2026, 2024/25, 2026, 2026-2027)
  let str = raw
    .replace(/\b20\d{2}[/-](20)?\d{2}\b/g, ' ')
    .replace(/\b(19|20)\d{2}\b/g, ' ');

  // 2. Remove date-day references before calendar months (e.g. "31 August", "30 June", "31 Dec")
  str = str.replace(
    /\b\d{1,2}(?:st|nd|rd|th)?\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/gi,
    ' '
  );

  // 3. Remove circular/act/section/regulation/stage/phase/step/part labels with digits
  // (e.g. "Stage 2", "Phase 1", "Step 3", "Circular 88", "Circular 63", "Section 71", "MFMA 56", "KPA 1")
  str = str.replace(
    /\b(?:circular|section|act|kpa|mfma|regulation|reg|phase|step|stage|level|grade|milestone|tier|part|item)\s*#?\d+\b/gi,
    ' '
  );

  // 4. Remove quarter references (e.g. "Q1", "Q2", "Q3", "Q4", "1st Qtr", "2nd Quarter")
  str = str.replace(/\b[1-4](?:st|nd|rd|th)?\s*(?:qtr|quarter)\b/gi, ' ');
  str = str.replace(/\bQ[1-4]\b/gi, ' ');

  // 5. Look for percentage numbers explicitly (e.g. "90%", "(100%)", "96.5%")
  const pctMatch = str.match(/-?\d+(\.\d+)?\s*%/);
  if (pctMatch) {
    const p = parseFloat(pctMatch[0].replace('%', '').trim());
    if (!isNaN(p)) return p;
  }

  // 6. Look for currency numbers explicitly (e.g. "R 1,500,000", "R50000", "R 45,000.00")
  const currMatch = str.match(/R\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[0-9]+(?:\.[0-9]+)?)/i);
  if (currMatch) {
    const c = parseFloat(currMatch[1].replace(/,/g, ''));
    if (!isNaN(c)) return c;
  }

  // 7. General number extraction: remove commas inside digits (e.g. 1,000 -> 1000)
  const normalized = str.replace(/(\d),(\d)/g, '$1$2');
  const numMatches = normalized.match(/-?\d+(\.\d+)?/g);
  if (numMatches && numMatches.length > 0) {
    const parsed = parseFloat(numMatches[0]);
    if (!isNaN(parsed)) return parsed;
  }

  return null;
};

/**
 * IPMS Standard Variance: Actual - Target (Positive when exceeded, negative when short)
 */
export const calculateVariance = (target?: string, actual?: string): string => {
  if (!target || !actual || !target.toString().trim() || !actual.toString().trim()) return '0';
  if (isCellNA(target) && isCellNA(actual)) return '0';

  const tNum = extractNumericValue(target);
  const aNum = extractNumericValue(actual);

  if (tNum !== null && aNum !== null) {
    const diff = aNum - tNum;
    if (Math.abs(diff) < 0.0001) return '0';
    const sign = diff > 0 ? '+' : '';
    return `${sign}${Number(diff.toFixed(2)).toString()}`;
  }

  if (isCellNA(target) || isCellNA(actual)) return '0';

  const tNorm = target.toString().trim().toLowerCase();
  const aNorm = actual.toString().trim().toLowerCase();
  if (tNorm === aNorm) return '0';
  return 'Variance (Target not met)';
};

/**
 * Top-Layer SDBIP Standard Variance: Actual - Target (formatted with % or R if applicable, + when exceeded)
 */
export const calcVar = (target: string | undefined, actual: string | undefined, uom?: string): string => {
  const tVal = (target || '').trim();
  const aVal = (actual || '').trim();
  if (!tVal && !aVal) return '';

  const nA = extractNumericValue(aVal);
  if (isCellNA(tVal)) {
    if (nA !== null) {
      return (nA > 0 ? '+' : '') + Number(nA.toFixed(2)).toLocaleString();
    }
    return '';
  }
  if (isCellNA(aVal)) return '';

  const nT = extractNumericValue(tVal);

  if (nT === null || nA === null) {
    if (!tVal || !aVal) return '';
    if (tVal.toLowerCase() === aVal.toLowerCase()) return '0';
    return '';
  }

  const diff = nA - nT;
  if (Math.abs(diff) < 0.0001) return '0';

  const isPercentage =
    tVal.includes('%') ||
    aVal.includes('%') ||
    (uom && uom.toLowerCase().includes('percent')) ||
    (uom && uom.toLowerCase().includes('%'));

  const sign = diff > 0 ? '+' : '';
  if (isPercentage) {
    return `${sign}${Number(diff.toFixed(2))}%`;
  }

  const prefix = tVal.startsWith('R') || aVal.startsWith('R') ? 'R ' : '';
  return `${sign}${prefix}${Number(diff.toFixed(2)).toLocaleString()}`;
};

/**
 * OPMS Submitter/Reviewer/Approver Variance: Actual - Target (shows + or -)
 */
export const calcOpmsVariance = (target: string | undefined, actual: string | undefined, uom?: string): string => {
  const tVal = (target || '').trim();
  const aVal = (actual || '').trim();
  if (!tVal && !aVal) return '';

  const nA = extractNumericValue(aVal);
  if (isCellNA(tVal) && nA !== null) {
    const sign = nA > 0 ? '+' : '';
    return `${sign}${Number(nA.toFixed(2)).toLocaleString()}`;
  }

  const nT = extractNumericValue(tVal);

  if (nT === null || nA === null) return '';

  const diff = nA - nT;
  if (Math.abs(diff) < 0.0001) return '0';

  const isPercentage =
    tVal.includes('%') ||
    aVal.includes('%') ||
    (uom && uom.toLowerCase().includes('percent')) ||
    (uom && uom.toLowerCase().includes('%'));

  const sign = diff > 0 ? '+' : '';
  if (isPercentage) {
    return `${sign}${Number(diff.toFixed(2))}%`;
  }
  const prefix = tVal.startsWith('R') || aVal.startsWith('R') ? 'R ' : '';
  return `${sign}${prefix}${Number(diff.toFixed(2)).toLocaleString()}`;
};

export const hasVariance = (target?: string, actual?: string): boolean => {
  if (!target || !actual || !target.toString().trim() || !actual.toString().trim()) return false;
  if (isCellNA(target) && isCellNA(actual)) return false;

  const tNum = extractNumericValue(target);
  const aNum = extractNumericValue(actual);

  if (tNum !== null && aNum !== null) {
    return Math.abs(tNum - aNum) > 0.0001;
  }

  if (isCellNA(target) || isCellNA(actual)) return false;

  const tNorm = target.toString().trim().toLowerCase();
  const aNorm = actual.toString().trim().toLowerCase();
  return tNorm !== aNorm;
};

export const calculateProgressPercentage = (target?: string, actual?: string): number => {
  if (!target || !actual) return 0;
  const tNum = extractNumericValue(target);
  const aNum = extractNumericValue(actual);
  if (tNum !== null && aNum !== null && tNum !== 0) {
    const pct = (aNum / tNum) * 100;
    return Math.min(Math.max(Math.round(pct), 0), 100);
  }
  return 0;
};
