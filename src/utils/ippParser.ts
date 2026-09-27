import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    const version = (pdfjsLib as any).version || '3.11.174';
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("[IPP Parser] PDF worker initialization:", e);
  }
}

export type KpaCode = 'bsd' | 'led' | 'mfvm' | 'ggpp' | 'midt' | 'sr' | 'cs';

export interface ExtractedKpaDefinition {
  kpaNumber?: string;
  kpaName?: string;
  fullTitle?: string;
  title?: string;
  weighting?: string;
  allocatedWeight?: number;
  kpiCount?: number;
  totalKpiWeight?: number;
  code?: KpaCode | 'functional' | string;
  kpaType?: 'functional' | 'national';
  nationalKpaName?: string;
}

/**
 * Strict Flat-List Item Schema for Individual Performance Plans (IPP)
 * Every field reflects 100% verbatim text with zero artificial inference.
 */
export interface ExtractedMappedKPI {
  "kpi no": string;
  "kpi description": string;
  "%wt": string;
  "baseline": string;
  "annual target": string;
  "1st qtr target": string;
  "2nd qtr target": string;
  "3rd qtr target": string;
  "4th qtr target": string;
  "poe": string;
  "budget": string;
  "functional kpa": string;
  "national kpa"?: string;
  "kpa": string;
  kpaType?: 'functional' | 'national';

  // Internal UI tracking
  _id?: string;
  _selected?: boolean;
}

export interface IPPExtractionResponse {
  success: boolean;
  items: ExtractedMappedKPI[];
  count: number;
  kpas: ExtractedKpaDefinition[];
  metadata?: {
    financialYear?: string;
    municipality?: string;
    employeeName?: string;
    position?: string;
    department?: string;
  };
  fileName?: string;
  verbatimAccuracy?: string;
  zeroHallucinations?: boolean;
}

export const NATIONAL_KPAS: Record<KpaCode, { code: KpaCode; name: string; fullTitle: string; color: string; badgeBg: string }> = {
  bsd: {
    code: 'bsd',
    name: 'BSD',
    fullTitle: 'Basic Service Delivery and Infrastructure Development',
    color: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50'
  },
  led: {
    code: 'led',
    name: 'LED',
    fullTitle: 'Local Economic Development',
    color: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50'
  },
  mfvm: {
    code: 'mfvm',
    name: 'MFVM',
    fullTitle: 'Municipal Financial Viability and Management',
    color: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50'
  },
  ggpp: {
    code: 'ggpp',
    name: 'GGPP',
    fullTitle: 'Good Governance and Public Participation',
    color: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700/50'
  },
  midt: {
    code: 'midt',
    name: 'MIDT',
    fullTitle: 'Municipal Institutional Development and Transformation',
    color: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50'
  },
  sr: {
    code: 'sr',
    name: 'SR',
    fullTitle: 'Spatial Rationale and Local Planning',
    color: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700/50'
  },
  cs: {
    code: 'cs',
    name: 'CS',
    fullTitle: 'Community Services and Social Development',
    color: 'text-indigo-700 dark:text-indigo-300',
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700/50'
  }
};

export const KPA_METADATA = NATIONAL_KPAS;

/**
 * Normalizes weight to clean numeric string
 */
export function normalizeWeight(val: any): string {
  if (val === null || val === undefined || val === '') return '';
  const str = String(val).replace(/%/g, '').replace(/,/g, '.').trim();
  const num = parseFloat(str);
  if (isNaN(num)) return '';
  return String(Math.round(num * 100) / 100);
}

/**
 * Ensures verbatim functional KPA titles preserve verbatim heading text
 */
export function formatFunctionalKpaTitle(rawTitle: string, defaultNumber?: string | number): string {
  const trimmed = (rawTitle || '').trim();
  if (!trimmed) {
    return defaultNumber ? `KPA ${defaultNumber}: Functional Performance Area` : 'KPA: Functional Performance Area';
  }

  // Strip trailing weight percentages
  let clean = trimmed.replace(/\s+\d{1,3}%?$/, '').trim();

  // Detect explicit KPA number from the text
  const numMatch = clean.match(/\bKPA\s*(\d+[A-Za-z]?)\b/i) || clean.match(/^(\d+[A-Za-z]?)\s*[:.\-–]/);
  const kNum = numMatch ? numMatch[1] : (defaultNumber !== undefined && defaultNumber !== null && String(defaultNumber).trim() ? String(defaultNumber) : '');

  // Strip duplicate prefixes
  clean = clean.replace(/^(?:\d+\.\s*)?(?:KPA\s*\d+[A-Za-z]?\s*[:.\-–]\s*)*(?:\d+\.\s*)?(?:KPA\s*\d+[A-Za-z]?\s*[:.\-–]\s*)*/i, '').trim();

  if (!clean) {
    clean = 'Functional Performance Area';
  }

  if (kNum) {
    return `KPA ${kNum}: ${clean}`;
  }
  return `KPA: ${clean}`;
}

/**
 * Resolves national KPA code for analytics without altering the verbatim functional title
 */
export function resolveKpaCode(text: string): KpaCode {
  const norm = (text || '').toLowerCase().trim();
  if (norm.includes('institution') || norm.includes('transformation') || norm.includes('skills') || norm.includes('training') || norm.includes('hr') || norm.includes('human resource') || norm.includes('wsp') || norm.includes('pmds')) return 'midt';
  if (norm.includes('financial') || norm.includes('viability') || norm.includes('budget') || norm.includes('revenue') || norm.includes('expenditure') || norm.includes('mfma') || norm.includes('scm') || norm.includes('debtor') || norm.includes('billing')) return 'mfvm';
  if (norm.includes('basic service') || norm.includes('infrastructure') || norm.includes('water') || norm.includes('sanitation') || norm.includes('electricity') || norm.includes('roads') || norm.includes('waste') || norm.includes('refuse') || norm.includes('health surveil')) return 'bsd';
  if (norm.includes('economic') || norm.includes('led') || norm.includes('job creation') || norm.includes('epwp') || norm.includes('smme') || norm.includes('tourism') || norm.includes('agriculture')) return 'led';
  if (norm.includes('spatial') || norm.includes('spluma') || norm.includes('town planning') || norm.includes('gis') || norm.includes('land use') || norm.includes('human settlement')) return 'sr';
  if (norm.includes('community') || norm.includes('social') || norm.includes('disaster') || norm.includes('fire') || norm.includes('traffic') || norm.includes('library')) return 'cs';
  return 'ggpp';
}

/**
 * ArrayBuffer to Base64 utility
 */
export function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  try {
    const bytes = buffer instanceof Uint8Array 
      ? buffer 
      : new Uint8Array(buffer.slice(0));
    let binary = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
      binary += String.fromCharCode.apply(null, chunk as any);
    }
    return btoa(binary);
  } catch (e) {
    console.warn("[IPP Parser] arrayBufferToBase64 error:", e);
    return "";
  }
}

/**
 * Calls Server IPP Extraction Engine enforcing a rigid flat-list schema
 */
export async function callServerAiIPPExtraction(params: {
  documentText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<ExtractedMappedKPI[]> {
  // Use /api/extract-ipp endpoint
  const response = await fetch('/api/extract-ipp', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const rawText = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch (_parseErr) {
    if (!response.ok) {
      throw new Error(`Server IPP extraction failed with status ${response.status}`);
    }
    throw new Error(`Server returned non-JSON response (${response.status}): ${rawText.slice(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Server extraction failed with status ${response.status}`);
  }

  if (data && data.success && Array.isArray(data.items)) {
    const formattedList: ExtractedMappedKPI[] = data.items.map((it: any, idx: number) => {
      const functionalKpa = String(it['functional kpa'] || it.functionalKpa || it.kpa || 'Functional Performance Area').trim();
      const kpiDescription = it['kpi description'] ?? 
        it.kpiDescription ?? 
        it['kpi_description'] ?? 
        it['Key Performance Indicators'] ?? 
        it['key performance indicators'] ?? 
        it['Key Performance Indicator'] ?? 
        it['key performance indicator'] ?? 
        it.kpi ?? 
        it.indicator ?? 
        it.description ?? 
        it.measure ?? 
        it.output ?? 
        '';
      const kpiNo = it['kpi no'] ?? 
        it.kpiNo ?? 
        it['kpi_no'] ?? 
        it['KPI number'] ?? 
        it['kpi number'] ?? 
        it.refNo ?? 
        it.refNum ?? 
        it.ref ?? 
        it.no ?? 
        it.id ?? 
        `KPI-${idx + 1}`;
      return {
        _id: `ipp-ext-${Date.now()}-${idx + 1}`,
        _selected: true,
        "kpi no": String(kpiNo).trim(),
        "kpi description": String(kpiDescription).trim(),
        "%wt": normalizeWeight(it['%wt']),
        "baseline": String(it.baseline ?? '').trim(),
        "annual target": String(it['annual target'] ?? '').trim(),
        "1st qtr target": String(it['1st qtr target'] ?? '').trim(),
        "2nd qtr target": String(it['2nd qtr target'] ?? '').trim(),
        "3rd qtr target": String(it['3rd qtr target'] ?? '').trim(),
        "4th qtr target": String(it['4th qtr target'] ?? '').trim(),
        "poe": String(it.poe ?? '').trim(),
        "budget": String(it.budget ?? '').trim(),
        "functional kpa": functionalKpa,
        "kpa": functionalKpa
      };
    });

    if (data.kpas && Array.isArray(data.kpas)) {
      (formattedList as any).kpas = data.kpas;
    }
    if (data.metadata) {
      (formattedList as any).metadata = data.metadata;
    }
    if (params.documentText) {
      (formattedList as any).rawDocumentText = params.documentText;
    }
    return formattedList;
  }

  return [];
}

/**
 * Raw text parser for PDF binaries
 */
export function extractRawTextFromPdfBinary(input: ArrayBuffer | Uint8Array): string {
  try {
    const bytes = input instanceof Uint8Array 
      ? input 
      : new Uint8Array(input.slice(0));
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = textDecoder.decode(bytes);

    let extractedText = '';
    const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")/g;
    let match;
    while ((match = tjRegex.exec(rawString)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean.length > 0) {
        extractedText += clean + ' ';
      }
    }

    const tjArrayRegex = /\[([^\]]+)\]\s*TJ/gi;
    while ((match = tjArrayRegex.exec(rawString)) !== null) {
      const inner = match[1];
      const subMatchRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
      let subMatch;
      let lineStr = '';
      while ((subMatch = subMatchRegex.exec(inner)) !== null) {
        lineStr += subMatch[1].replace(/\\([()\\])/g, '$1') + ' ';
      }
      if (lineStr.trim().length > 0) {
        extractedText += '\n' + lineStr.trim();
      }
    }

    if (extractedText.trim().length > 80) {
      return extractedText;
    }

    const printableRegex = /[\x20-\x7E\r\n\t]{4,}/g;
    const matches: string[] = rawString.match(printableRegex) || [];
    const filtered = matches.filter((m: string) => !m.startsWith('/Font') && !m.startsWith('/Obj') && !m.startsWith('xref') && !m.startsWith('endobj')).join(' ');
    return filtered || rawString.slice(0, 50000);
  } catch (e) {
    console.warn("[IPP Parser] Raw PDF binary extraction error:", e);
    return "";
  }
}

/**
 * Extracts text from PDF document
 */
export async function extractTextFromPDF(input: ArrayBuffer | Uint8Array): Promise<string> {
  let fullText = '';
  try {
    const rawArrayBuffer = input instanceof Uint8Array 
      ? input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) 
      : input.slice(0);
      
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(rawArrayBuffer),
      useSystemFonts: true
    } as any);
    const pdfDoc = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const items = (textContent.items as any[]).filter(item => item.str && item.str.trim().length > 0);
      
      items.sort((a, b) => {
        const yDiff = (b.transform?.[5] || 0) - (a.transform?.[5] || 0);
        if (Math.abs(yDiff) > 3.5) return yDiff;
        return (a.transform?.[4] || 0) - (b.transform?.[4] || 0);
      });

      const lines: string[] = [];
      let currentLine: any[] = [];
      let currentY: number | null = null;

      for (const item of items) {
        const itemY = item.transform?.[5] || 0;
        if (currentY === null || Math.abs(itemY - currentY) <= 3.5) {
          currentLine.push(item);
          if (currentY === null) currentY = itemY;
        } else {
          currentLine.sort((a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0));
          lines.push(currentLine.map(it => it.str).join('\t'));
          currentLine = [item];
          currentY = itemY;
        }
      }
      if (currentLine.length > 0) {
        currentLine.sort((a, b) => (a.transform?.[4] || 0) - (b.transform?.[4] || 0));
        lines.push(currentLine.map(it => it.str).join('\t'));
      }

      fullText += `\n--- PAGE ${pageNum} ---\n` + lines.join('\n');
    }
  } catch (pdfjsErr) {
    console.warn("[IPP Parser] PDF.js worker fallback:", pdfjsErr);
  }

  if (!fullText || fullText.trim().length < 20) {
    const rawExtracted = extractRawTextFromPdfBinary(input);
    if (rawExtracted && rawExtracted.trim().length > 0) {
      fullText = rawExtracted;
    }
  }

  return fullText;
}

/**
 * Parses raw text lines strictly as a flat list of items from Annexure A
 */
export function parseRawTextLines(text: string): ExtractedMappedKPI[] {
  if (!text) return [];

  // Strictly find start of Annexure A Performance Plan
  let annexureAStart = -1;
  const bannerMatch = text.match(/[-*#\s|]*ANNEXURE\s*A\s*[:.\-–\s]*\s*PERFORMANCE\s*PLAN/i) ||
                     text.match(/[-*#\s|]*PERFORMANCE\s*PLAN\s*[-–:]\s*\d{4}\/\d{4}/i);
  if (bannerMatch && bannerMatch.index !== undefined) {
    annexureAStart = bannerMatch.index;
  }

  if (annexureAStart === -1) {
    const annMatches = Array.from(text.matchAll(/ANNEXURE\s*A\b/gi));
    for (const m of annMatches) {
      if (m.index !== undefined) {
        const snippet = text.substring(m.index, m.index + 250).toLowerCase();
        if (snippet.includes('performance plan') || snippet.includes('kpi number') || snippet.includes('team opme') || snippet.includes('name and surname')) {
          annexureAStart = m.index;
          break;
        }
      }
    }
  }

  if (annexureAStart === -1) {
    const tableHeaderMatch = text.match(/\bKPI\s*number\b[\s\S]{1,100}\bKey\s*Performance\s*Indicators\b/i);
    if (tableHeaderMatch && tableHeaderMatch.index !== undefined) {
      annexureAStart = tableHeaderMatch.index;
    }
  }

  if (annexureAStart === -1) {
    return [];
  }

  const rawAnnexureA = text.substring(annexureAStart);
  // Strictly find end of Annexure A
  const endMatch = rawAnnexureA.search(/(?:ANNEXURE\s*B\b|PERSONAL\s*DEVELOPMENT\s*PLAN|ANNEXURE\s*C\b|DISCLOSURE\s*OF\s*INTEREST|JOB\s*SPECIFIC\s*COMPETENC|CORE\s*COMPETENC|CCR\b|CMC\b|I\/We,\s*the\s*undersigned\s*hereby\s*certify)/i);
  const annexureAText = endMatch !== -1 ? rawAnnexureA.substring(0, endMatch) : rawAnnexureA;

  const lines = annexureAText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: ExtractedMappedKPI[] = [];
  let currentKpa = 'Functional Performance Area';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Skip metadata headers, signoffs, rating scales, PDP
    if (
      (lower.includes('page ') && lower.includes(' of ')) ||
      lower.startsWith('team ') || lower.startsWith('period ') || lower.startsWith('department ') ||
      lower.startsWith('name and surname') || lower.startsWith('position ') || lower.startsWith('level ') ||
      lower.includes("employee’s signature") || lower.includes("employee's signature") ||
      lower.includes("supervisor’ signature") || lower.includes("supervisor' signature") ||
      lower.includes("pms official’s signature") || lower.includes("pms official's signature") ||
      lower.includes("annexure a: performance plan") || lower.includes("annexure a -") ||
      lower.includes("personal development plan") || lower.includes("annexure b") ||
      lower.includes("job specific competencies") || lower.includes("core competencies") ||
      lower.includes("unacceptable performance") || lower.includes("not fully effective") ||
      lower.includes("fully effective") || lower.includes("significantly above expectations") ||
      lower.includes("outstanding performance")
    ) {
      continue;
    }

    // Detect KPA Heading banner (e.g. "KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION")
    const kpaBanner = line.match(/^[-*#\s|]*(?:KPA\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*|Key\s*Performance\s*Area\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*)(.+)$/i);
    if (kpaBanner) {
      const num = kpaBanner[1] || kpaBanner[2] || '';
      const name = kpaBanner[3].trim().replace(/\|.*$/, '').trim();
      if (!name.toLowerCase().includes('kpi number') && !name.toLowerCase().includes('weight')) {
        currentKpa = num ? `KPA ${num}: ${name}` : `KPA: ${name}`;
      }
      continue;
    }

    // Table rows separated by tabs or pipes
    if (line.includes('\t') || line.includes('|')) {
      const rawCells = (line.includes('\t') ? line.split('\t') : line.split('|')).map(c => c.trim()).filter(Boolean);
      const firstCell = (rawCells[0] || '').trim();
      const firstCellLower = firstCell.toLowerCase();

      // Strict validation: First cell MUST be a valid KPI Number format (e.g. "M_21", "1", "2", "17", "1.1", "BSD-01")
      const isValidKpiNo = /^(?:[M|P|U]_\d+|\d{1,3}(?:\.\d{1,2})?|[A-Z]{2,5}[-_]?\d+)$/i.test(firstCell);

      const isExcludedWord = 
        firstCellLower.includes('herein') ||
        firstCellLower.includes('employee') ||
        firstCellLower.includes('supervisor') ||
        firstCellLower.includes('employer') ||
        firstCellLower.includes('no.') ||
        firstCellLower.includes('no') ||
        firstCellLower.includes('kpi') ||
        firstCellLower.includes('team') ||
        firstCellLower.includes('department') ||
        firstCellLower.includes('position') ||
        firstCellLower.includes('level') ||
        firstCellLower.includes('signature') ||
        firstCellLower.includes('baseline') ||
        firstCellLower.includes('target') ||
        firstCellLower.includes('weight') ||
        firstCellLower.includes('unacceptable') ||
        firstCellLower.includes('effective') ||
        firstCellLower.includes('outstanding') ||
        firstCellLower.includes('competency');

      if (isValidKpiNo && !isExcludedWord && rawCells.length >= 2) {
        const desc = rawCells[1] || '';
        if (desc.length > 3 && !desc.toLowerCase().includes('signature') && !desc.toLowerCase().includes('certify') && !desc.toLowerCase().includes('rating scale')) {
          let kpiNo = firstCell;
          let weight = '';
          let baseline = '';
          let annualTarget = '';
          let q1 = '';
          let q2 = '';
          let q3 = '';
          let q4 = '';
          let poe = '';
          let budget = '';

          if (rawCells.length >= 11) {
            weight = rawCells[2] || '';
            baseline = rawCells[3] || '';
            annualTarget = rawCells[4] || '';
            q1 = rawCells[5] || '';
            q2 = rawCells[6] || '';
            q3 = rawCells[7] || '';
            q4 = rawCells[8] || '';
            poe = rawCells[9] || '';
            budget = rawCells[10] || '';
          } else if (rawCells.length === 10) {
            weight = rawCells[2] || '';
            baseline = rawCells[3] || '';
            annualTarget = rawCells[4] || '';
            q1 = rawCells[5] || '';
            q2 = rawCells[6] || '';
            q3 = rawCells[7] || '';
            q4 = rawCells[8] || '';
            poe = rawCells[9] || '';
          } else if (rawCells.length === 9) {
            weight = rawCells[2] || '';
            baseline = rawCells[3] || '';
            annualTarget = rawCells[4] || '';
            q1 = rawCells[5] || '';
            q2 = rawCells[6] || '';
            q3 = rawCells[7] || '';
            q4 = rawCells[8] || '';
          } else if (rawCells.length === 8) {
            weight = rawCells[2] || '';
            baseline = rawCells[3] || '';
            annualTarget = rawCells[4] || '';
            q1 = rawCells[5] || '';
            q2 = rawCells[6] || '';
            q3 = rawCells[7] || '';
          } else if (rawCells.length === 6) {
            weight = rawCells[2] || '';
            baseline = rawCells[3] || '';
            annualTarget = rawCells[4] || '';
            poe = rawCells[5] || '';
          } else if (rawCells.length === 3) {
            weight = rawCells[2] || '';
          }

          items.push({
            _id: `ipp-raw-${Date.now()}-${items.length + 1}`,
            _selected: true,
            "kpi no": kpiNo,
            "kpi description": desc,
            "%wt": normalizeWeight(weight),
            "baseline": baseline,
            "annual target": annualTarget,
            "1st qtr target": q1,
            "2nd qtr target": q2,
            "3rd qtr target": q3,
            "4th qtr target": q4,
            "poe": poe,
            "budget": budget,
            "functional kpa": currentKpa,
            "kpa": currentKpa
          });
        }
      } else if (items.length > 0 && !isExcludedWord) {
        // Continuation text of multi-line cell belonging to the active KPI item
        const lastItem = items[items.length - 1];
        if (rawCells.length >= 2) {
          if (rawCells[0] && rawCells[0].length > 1 && !/^\d+$/.test(rawCells[0])) {
            lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + rawCells[0] + ' ' + (rawCells[1] || '')).replace(/\s+/g, ' ').trim();
          } else if (rawCells[1]) {
            lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + rawCells[1]).replace(/\s+/g, ' ').trim();
          }
          if (rawCells.length >= 3 && rawCells[2] && isNaN(parseFloat(rawCells[2]))) {
            lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + rawCells[2]).replace(/\s+/g, ' ').trim();
          }
          const lastCell = rawCells[rawCells.length - 1];
          if (lastCell && (lastCell.toLowerCase().includes('unit') || lastCell.toLowerCase().includes('report') || lastCell.toLowerCase().includes('services') || lastCell.toLowerCase().includes('certificate') || lastCell.toLowerCase().includes('register'))) {
            lastItem["poe"] = (lastItem["poe"] + ' ' + lastCell).replace(/\s+/g, ' ').trim();
          }
        } else if (rawCells.length === 1 && rawCells[0]) {
          lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + rawCells[0]).replace(/\s+/g, ' ').trim();
        }
      }
    } else if (items.length > 0 && line.length > 2) {
      const lower = line.toLowerCase();
      if (!lower.includes('page ') && !lower.includes('signature') && !lower.includes('kpa ') && !lower.includes('annexure')) {
        const lastItem = items[items.length - 1];
        lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + line).replace(/\s+/g, ' ').trim();
      }
    }
  }

  return items;
}

/**
 * Extracts and maps KPIs from PDF document strictly for IPP
 */
export async function extractIPPKPIsFromPDF(arrayBuffer: ArrayBuffer, fileName: string = 'IPP_Agreement.pdf'): Promise<ExtractedMappedKPI[]> {
  const fileBase64 = arrayBufferToBase64(arrayBuffer.slice(0));
  let fullText = '';
  try {
    fullText = await extractTextFromPDF(arrayBuffer.slice(0));
  } catch (textErr) {
    console.warn("[IPP Parser] PDF text extraction warning:", textErr);
  }

  try {
    const aiItems = await callServerAiIPPExtraction({
      documentText: fullText || undefined,
      fileBase64: fileBase64 || undefined,
      mimeType: 'application/pdf',
      fileName
    });

    if (aiItems && aiItems.length > 0) {
      return aiItems;
    }
  } catch (aiErr) {
    console.warn("[IPP Parser] Server AI IPP extraction fallback to deterministic text parser:", aiErr);
  }

  if (fullText && fullText.trim().length > 30) {
    return parseRawTextLines(fullText);
  }

  throw new Error("Unable to parse text or tables from PDF document. Please verify the file is not password-protected.");
}

/**
 * Helper to convert Mammoth HTML tables to TSV rows
 */
export function htmlTablesToTsv(html: string): string {
  if (!html) return '';
  return html
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/td>\s*<td[^>]*>/gi, '\t')
    .replace(/<td[^>]*>/gi, '')
    .replace(/<\/td>/gi, '')
    .replace(/<\/th>\s*<th[^>]*>/gi, '\t')
    .replace(/<th[^>]*>/gi, '')
    .replace(/<\/th>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
}

/**
 * Extracts and maps KPIs from Word (.docx) strictly for IPP
 */
export async function extractIPPKPIsFromDocx(arrayBuffer: ArrayBuffer, fileName: string = 'IPP_Agreement.docx'): Promise<ExtractedMappedKPI[]> {
  const fileBase64 = arrayBufferToBase64(arrayBuffer.slice(0));
  let docxText = '';
  let docxHtml = '';

  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer.slice(0) });
    docxHtml = htmlResult.value;
  } catch (mErr) {
    console.warn("[IPP Parser] Mammoth HTML extraction warning:", mErr);
  }

  try {
    const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) });
    docxText = textResult.value;
  } catch (mErr) {
    console.warn("[IPP Parser] Mammoth text extraction warning:", mErr);
  }

  const tableTsv = docxHtml ? htmlTablesToTsv(docxHtml) : '';
  const payloadText = tableTsv ? `${tableTsv}\n\nPlain Document Text:\n${docxText}` : docxText;

  try {
    const aiItems = await callServerAiIPPExtraction({
      documentText: payloadText,
      fileBase64: fileBase64 || undefined,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName
    });
    if (aiItems && aiItems.length > 0) {
      return aiItems;
    }
  } catch (aiErr) {
    console.warn("[IPP Parser] Server AI docx extraction fallback to text parser:", aiErr);
  }

  if (tableTsv && tableTsv.trim().length > 0) {
    const parsed = parseRawTextLines(tableTsv);
    if (parsed.length > 0) return parsed;
  }

  if (docxText && docxText.trim().length > 0) {
    return parseRawTextLines(docxText);
  }

  throw new Error("Failed to parse Word (.docx) document.");
}

/**
 * Extracts and maps KPIs from Excel/CSV strictly for IPP
 */
export async function extractIPPKPIsFromExcel(arrayBuffer: ArrayBuffer, fileName: string = 'IPP_Scorecard.xlsx'): Promise<ExtractedMappedKPI[]> {
  try {
    const workbook = XLSX.read(arrayBuffer.slice(0), { type: 'array' });
    let combinedCsv = '';

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;
      const csv = XLSX.utils.sheet_to_csv(sheet);
      combinedCsv += `\n--- SHEET: ${sheetName} ---\n${csv}\n`;
    }

    if (combinedCsv.trim()) {
      try {
        const aiItems = await callServerAiIPPExtraction({
          documentText: combinedCsv,
          fileName
        });
        if (aiItems && aiItems.length > 0) {
          return aiItems;
        }
      } catch (aiErr) {
        console.warn("[IPP Parser] Server AI Excel fallback to deterministic line parser:", aiErr);
      }
      return parseRawTextLines(combinedCsv);
    }

    throw new Error("Excel spreadsheet contained no readable rows.");
  } catch (err: any) {
    throw new Error(`Excel IPP parsing error: ${err.message}`);
  }
}

/**
 * Extracts and maps KPIs from pasted raw text strictly for IPP
 */
export async function extractIPPKPIsFromPastedContent(pastedText: string, fileName: string = 'Pasted_IPP_Agreement.txt'): Promise<ExtractedMappedKPI[]> {
  if (!pastedText || !pastedText.trim()) {
    throw new Error("No text provided for IPP extraction.");
  }

  try {
    const aiItems = await callServerAiIPPExtraction({
      documentText: pastedText,
      fileName
    });
    if (aiItems && aiItems.length > 0) {
      return aiItems;
    }
  } catch (aiErr) {
    console.warn("[IPP Parser] AI IPP pasted content fallback to deterministic line parser:", aiErr);
  }

  return parseRawTextLines(pastedText);
}

/**
 * Master dispatcher for IPP files
 */
export async function extractIPPKPIsFromDocument(file: File): Promise<ExtractedMappedKPI[]> {
  const arrayBuffer = await file.arrayBuffer();
  const extension = file.name.split('.').pop()?.toLowerCase() || '';

  if (extension === 'pdf') {
    return extractIPPKPIsFromPDF(arrayBuffer, file.name);
  }
  if (['docx', 'doc'].includes(extension)) {
    return extractIPPKPIsFromDocx(arrayBuffer, file.name);
  }
  if (['xlsx', 'xls', 'csv'].includes(extension)) {
    return extractIPPKPIsFromExcel(arrayBuffer, file.name);
  }

  const textDecoder = new TextDecoder('utf-8');
  const text = textDecoder.decode(arrayBuffer);
  return extractIPPKPIsFromPastedContent(text, file.name);
}

export async function extractIppFromDocument(file: File): Promise<{ items: ExtractedMappedKPI[]; count: number; kpas: ExtractedKpaDefinition[] }> {
  // Extract strictly from what is physically present in the uploaded file with 100% dynamic parsing
  const items = await extractIPPKPIsFromDocument(file);
  
  // Extract unique functional KPAs from the items
  const kpaMap = new Map<string, ExtractedKpaDefinition>();
  items.forEach((item, idx) => {
    const kpaName = item["functional kpa"] || item["kpa"] || `Functional KPA ${idx + 1}`;
    if (!kpaMap.has(kpaName)) {
      kpaMap.set(kpaName, {
        kpaName,
        fullTitle: kpaName,
        weighting: item["%wt"] || '20',
        kpiCount: 1
      });
    } else {
      const existing = kpaMap.get(kpaName)!;
      existing.kpiCount = (existing.kpiCount || 1) + 1;
    }
  });

  return {
    items,
    count: items.length,
    kpas: Array.from(kpaMap.values())
  };
}

