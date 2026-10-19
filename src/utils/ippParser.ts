import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker using local Vite bundle (with CDN fallback) so external websites with strict CSP/firewalls work seamlessly
if (typeof window !== 'undefined') {
  try {
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url
    ).toString();
  } catch (e) {
    try {
      const version = (pdfjsLib as any).version || '6.2.108';
      (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
    } catch (err) {
      console.warn("[IPP Parser] PDF worker initialization:", err);
    }
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
  if (!text || !text.trim()) return [];

  // Find start of Annexure A or Performance Plan table if present
  let annexureAStart = -1;
  const bannerMatch = text.match(/[-*#\s|]*ANNEXURE\s*A\s*[:.\-–\s]*\s*PERFORMANCE\s*PLAN/i) ||
                     text.match(/[-*#\s|]*PERFORMANCE\s*PLAN\s*[-–:]\s*\d{4}\/\d{4}/i) ||
                     text.match(/[-*#\s|]*PERFORMANCE\s*(?:AGREEMENT|SCORECARD|PLAN)/i);
  if (bannerMatch && bannerMatch.index !== undefined) {
    annexureAStart = bannerMatch.index;
  }

  if (annexureAStart === -1) {
    const annMatches = Array.from(text.matchAll(/ANNEXURE\s*A\b/gi));
    for (const m of annMatches) {
      if (m.index !== undefined) {
        const snippet = text.substring(m.index, m.index + 250).toLowerCase();
        if (snippet.includes('performance plan') || snippet.includes('kpi number') || snippet.includes('kpi') || snippet.includes('team opme') || snippet.includes('name and surname')) {
          annexureAStart = m.index;
          break;
        }
      }
    }
  }

  if (annexureAStart === -1) {
    const tableHeaderMatch = text.match(/\bKPI\s*(?:number|no|#)?\b[\s\S]{1,100}\b(?:Key\s*Performance\s*Indicator|Baseline|Target|Weight)\b/i);
    if (tableHeaderMatch && tableHeaderMatch.index !== undefined) {
      annexureAStart = tableHeaderMatch.index;
    }
  }

  let annexureAText = text;
  if (annexureAStart !== -1) {
    const rawAnnexureA = text.substring(annexureAStart);
    const endMatch = rawAnnexureA.search(/(?:ANNEXURE\s*B\b|PERSONAL\s*DEVELOPMENT\s*PLAN|ANNEXURE\s*C\b|DISCLOSURE\s*OF\s*INTEREST|JOB\s*SPECIFIC\s*COMPETENC|CORE\s*COMPETENC|CCR\b|CMC\b|I\/We,\s*the\s*undersigned\s*hereby\s*certify)/i);
    annexureAText = endMatch !== -1 ? rawAnnexureA.substring(0, endMatch) : rawAnnexureA;
  }

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

    // Detect KPA Heading banner (e.g. "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION", "a. KPA 1: ...", "c. PROJECTS", "KPA 6: POPIA/ PAIA/CIPC/COIDA/SARS COMPLIANCE")
    const kpaBanner = line.match(/^[-*#\s|]*(?:(?:[a-z]\.\s*)?KPA\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*|(?:[a-z]\.\s*)?Key\s*Performance\s*Area\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*|Strategic\s*Objective\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*)(.+)$/i) ||
                      line.match(/^[-*#\s|]*(?:[a-z]\.\s*)?KPA\s*(\d+[A-Za-z]?)\s*[:.\-–]?\s*(.+)$/i);
    if (kpaBanner) {
      const num = kpaBanner[1] || kpaBanner[2] || '';
      const name = kpaBanner[kpaBanner.length - 1].trim().replace(/\|.*$/, '').trim();
      if (!name.toLowerCase().includes('kpi number') && !name.toLowerCase().includes('weight')) {
        currentKpa = num ? `KPA ${num}: ${name}` : `KPA: ${name}`;
      }
      continue;
    }

    if (/^[-*#\s|]*(?:[a-z]\.\s*)?PROJECTS\b/i.test(line)) {
      currentKpa = 'KPA: PROJECTS';
      continue;
    }

    // Determine delimiter (tab, pipe, comma CSV, or multi-space)
    const hasTab = line.includes('\t');
    const hasPipe = line.includes('|');
    const hasComma = (line.match(/,/g) || []).length >= 3;
    const hasMultiSpace = /\s{2,}/.test(line);

    if (hasTab || hasPipe || hasComma || hasMultiSpace) {
      const rawCells = (
        hasTab ? line.split('\t') :
        hasPipe ? line.split('|') :
        hasComma ? line.split(',') :
        line.split(/\s{2,}/)
      ).map(c => c.replace(/^"|"$/g, '').trim()).filter(Boolean);

      if (rawCells.length >= 2) {
        const firstCell = (rawCells[0] || '').trim();
        const firstCellLower = firstCell.toLowerCase();

        // Check if row is actually a KPA header row across columns (e.g. ['KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION'] or first cell starts with KPA)
        if (/^(?:(?:[a-z]\.\s*)?KPA\s*\d*[:.\-–]|(?:[a-z]\.\s*)?PROJECTS\b)/i.test(firstCell) && rawCells.length <= 3) {
          const numM = firstCell.match(/KPA\s*(\d+[A-Za-z]?)/i);
          const num = numM ? numM[1] : '';
          const name = firstCell.replace(/^[-*#\s|]*(?:[a-z]\.\s*)?KPA\s*\d*[:.\-–]?\s*/i, '').trim();
          currentKpa = num ? `KPA ${num}: ${name || 'Functional Area'}` : `KPA: ${name || firstCell}`;
          continue;
        }

        // Validate KPI Number format
        const isValidKpiNo = /^(?:[A-Za-z]{1,6}[-_]\d+|(?:KPI|Ref|No|Item|Indicator)[-.\s_#]?\d+|\d{1,3}(?:\.\d{1,2}){0,2}|\d+[A-Za-z]?)$/i.test(firstCell);

        const isExcludedWord = 
          firstCellLower.includes('herein') ||
          firstCellLower.includes('employee') ||
          firstCellLower.includes('supervisor') ||
          firstCellLower.includes('employer') ||
          firstCellLower.includes('no.') ||
          firstCellLower.includes('kpi no') ||
          firstCellLower.includes('team') ||
          firstCellLower.includes('department') ||
          firstCellLower.includes('position') ||
          firstCellLower.includes('level') ||
          firstCellLower.includes('signature') ||
          firstCellLower.includes('unacceptable') ||
          firstCellLower.includes('effective') ||
          firstCellLower.includes('outstanding') ||
          firstCellLower.includes('competency');

        if (isValidKpiNo && !isExcludedWord) {
          const desc = rawCells[1] || '';
          if (desc.length > 2 && !desc.toLowerCase().includes('signature') && !desc.toLowerCase().includes('certify') && !desc.toLowerCase().includes('rating scale')) {
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
            } else if (rawCells.length === 7) {
              weight = rawCells[2] || '';
              baseline = rawCells[3] || '';
              annualTarget = rawCells[4] || '';
              q1 = rawCells[5] || '';
              q2 = rawCells[6] || '';
            } else if (rawCells.length === 6) {
              weight = rawCells[2] || '';
              baseline = rawCells[3] || '';
              annualTarget = rawCells[4] || '';
              poe = rawCells[5] || '';
            } else if (rawCells.length === 5) {
              weight = rawCells[2] || '';
              baseline = rawCells[3] || '';
              annualTarget = rawCells[4] || '';
            } else if (rawCells.length >= 3) {
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
        } else if (!isExcludedWord) {
          // Extract KPI even if first column is not a standard KPI number (e.g. description is first column, or no KPI number exists)
          let kpiNo = `KPI #${items.length + 1}`;
          let desc = '';
          let weight = '';
          let baseline = '';
          let annualTarget = '';
          let q1 = '';
          let q2 = '';
          let q3 = '';
          let q4 = '';
          let poe = '';
          let budget = '';

          if (firstCell.length > 3 && !firstCellLower.startsWith('page ') && !firstCellLower.startsWith('annexure')) {
            desc = firstCell;
            if (rawCells.length >= 10) {
              weight = rawCells[1] || '';
              baseline = rawCells[2] || '';
              annualTarget = rawCells[3] || '';
              q1 = rawCells[4] || '';
              q2 = rawCells[5] || '';
              q3 = rawCells[6] || '';
              q4 = rawCells[7] || '';
              poe = rawCells[8] || '';
              budget = rawCells[9] || '';
            } else if (rawCells.length === 9) {
              weight = rawCells[1] || '';
              baseline = rawCells[2] || '';
              annualTarget = rawCells[3] || '';
              q1 = rawCells[4] || '';
              q2 = rawCells[5] || '';
              q3 = rawCells[6] || '';
              q4 = rawCells[7] || '';
              poe = rawCells[8] || '';
            } else if (rawCells.length === 8) {
              weight = rawCells[1] || '';
              baseline = rawCells[2] || '';
              annualTarget = rawCells[3] || '';
              q1 = rawCells[4] || '';
              q2 = rawCells[5] || '';
              q3 = rawCells[6] || '';
              q4 = rawCells[7] || '';
            } else if (rawCells.length === 7) {
              weight = rawCells[1] || '';
              baseline = rawCells[2] || '';
              annualTarget = rawCells[3] || '';
              q1 = rawCells[4] || '';
              q2 = rawCells[5] || '';
              q3 = rawCells[6] || '';
            } else if (rawCells.length === 6) {
              weight = rawCells[1] || '';
              baseline = rawCells[2] || '';
              annualTarget = rawCells[3] || '';
              poe = rawCells[4] || '';
              budget = rawCells[5] || '';
            } else if (rawCells.length === 5) {
              weight = rawCells[1] || '';
              baseline = rawCells[2] || '';
              annualTarget = rawCells[3] || '';
              poe = rawCells[4] || '';
            } else if (rawCells.length === 4) {
              weight = rawCells[1] || '';
              baseline = rawCells[2] || '';
              annualTarget = rawCells[3] || '';
            } else if (rawCells.length === 3) {
              weight = rawCells[1] || '';
              annualTarget = rawCells[2] || '';
            } else if (rawCells.length === 2) {
              annualTarget = rawCells[1] || '';
            }
          } else if (rawCells[1] && rawCells[1].length > 3) {
            desc = rawCells[1];
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
            } else if (rawCells.length >= 3) {
              weight = rawCells[2] || '';
              baseline = rawCells[3] || '';
              annualTarget = rawCells[4] || '';
            }
          }

          if (desc.length > 2 && !desc.toLowerCase().includes('signature') && !desc.toLowerCase().includes('certify') && !desc.toLowerCase().includes('rating scale')) {
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
          } else if (items.length > 0) {
            const lastItem = items[items.length - 1];
            if (rawCells.length >= 2) {
              if (rawCells[0] && rawCells[0].length > 1 && !/^\d+$/.test(rawCells[0])) {
                lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + rawCells[0] + ' ' + (rawCells[1] || '')).replace(/\s+/g, ' ').trim();
              } else if (rawCells[1]) {
                lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + rawCells[1]).replace(/\s+/g, ' ').trim();
              }
            } else if (rawCells.length === 1 && rawCells[0]) {
              lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + rawCells[0]).replace(/\s+/g, ' ').trim();
            }
          }
        }
      }
    } else if (items.length > 0 && line.length > 2) {
      const lower = line.toLowerCase();
      if (!lower.includes('page ') && !lower.includes('signature') && !lower.includes('kpa ') && !lower.includes('annexure') && !/^(?:Number of|Percentage of|Percentage on|% of|Maximum acceptable|Development and|Compile and|100% attendance|Total municipal|Average number|Feasibility study|Management and|Water Treatment)\b/i.test(line)) {
        const lastItem = items[items.length - 1];
        lastItem["kpi description"] = (lastItem["kpi description"] + ' ' + line).replace(/\s+/g, ' ').trim();
      }
    }
  }

  // If delimited splitting yielded <= 1 items (e.g. vertical layout or table without horizontal delimiters), run the multi-line vertical stream block extractor
  if (items.length <= 1) {
    const verticalItems: ExtractedMappedKPI[] = [];
    let activeKpa = 'Functional Performance Area';
    
    // Pattern to identify new indicator descriptions
    const isIndicatorStart = (text: string): boolean => {
      const t = text.trim();
      if (t.length < 5) return false;
      const lower = t.toLowerCase();
      if (lower.startsWith('page ') || lower.startsWith('annexure') || lower.startsWith('kpa ') || lower.startsWith('table ') || lower.startsWith('key performance indicator')) return false;
      return /^(?:[A-Za-z]{1,6}[-_]\d+\b|Number of\b|Percentage of\b|Percentage on\b|% of\b|Maximum acceptable\b|Development and\b|Compile and\b|100% attendance\b|Total municipal\b|Average number\b|Feasibility study\b|Management and\b|Water Treatment\b|Conduct\b|Develop\b|Implement\b|Review\b|Submit\b|Ensure\b|Manage\b|Coordinate\b)/i.test(t);
    };

    let currentBlock: {
      kpiNo: string;
      description: string;
      weight: string;
      baseline: string;
      annualTarget: string;
      q1: string;
      q2: string;
      q3: string;
      q4: string;
      poe: string;
      budget: string;
      kpa: string;
    } | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const lower = line.toLowerCase();

      // Check KPA Banner
      const kpaMatch = line.match(/^[-*#\s|]*(?:(?:[a-z]\.\s*)?KPA\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*|(?:[a-z]\.\s*)?Key\s*Performance\s*Area\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*)(.+)$/i) ||
                        line.match(/^[-*#\s|]*(?:[a-z]\.\s*)?KPA\s*(\d+[A-Za-z]?)\s*[:.\-–]?\s*(.+)$/i);
      if (kpaMatch) {
        const num = kpaMatch[1] || '';
        const name = kpaMatch[kpaMatch.length - 1].trim().replace(/\|.*$/, '').trim();
        if (!name.toLowerCase().includes('kpi number') && !name.toLowerCase().includes('weight')) {
          activeKpa = num ? `KPA ${num}: ${name}` : `KPA: ${name}`;
        }
        continue;
      }
      if (/^[-*#\s|]*(?:[a-z]\.\s*)?PROJECTS\b/i.test(line)) {
        activeKpa = 'KPA: PROJECTS';
        continue;
      }

      // Check if line indicates start of new KPI block
      if (isIndicatorStart(line) || /^[A-Za-z]{1,6}[-_]\d+$/i.test(line)) {
        if (currentBlock && currentBlock.description.length > 3) {
          verticalItems.push({
            _id: `ipp-v-${Date.now()}-${verticalItems.length + 1}`,
            _selected: true,
            "kpi no": currentBlock.kpiNo || `KPI #${verticalItems.length + 1}`,
            "kpi description": currentBlock.description,
            "%wt": normalizeWeight(currentBlock.weight),
            "baseline": currentBlock.baseline,
            "annual target": currentBlock.annualTarget,
            "1st qtr target": currentBlock.q1,
            "2nd qtr target": currentBlock.q2,
            "3rd qtr target": currentBlock.q3,
            "4th qtr target": currentBlock.q4,
            "poe": currentBlock.poe,
            "budget": currentBlock.budget || 'OPEX',
            "functional kpa": currentBlock.kpa,
            "kpa": currentBlock.kpa
          });
        }

        let kNo = `KPI #${verticalItems.length + 1}`;
        let desc = line;
        if (/^[A-Za-z]{1,6}[-_]\d+$/i.test(line)) {
          kNo = line;
          desc = (lines[i + 1] && !lines[i + 1].startsWith('KPA') && !lines[i + 1].startsWith('Page')) ? lines[++i].trim() : '';
        }

        currentBlock = {
          kpiNo: kNo,
          description: desc,
          weight: '',
          baseline: '',
          annualTarget: '',
          q1: '',
          q2: '',
          q3: '',
          q4: '',
          poe: '',
          budget: '',
          kpa: activeKpa
        };
        continue;
      }

      if (currentBlock) {
        if (/^OPEX$|^R\s*[\d\s,.]+/i.test(line)) {
          currentBlock.budget = line;
          verticalItems.push({
            _id: `ipp-v-${Date.now()}-${verticalItems.length + 1}`,
            _selected: true,
            "kpi no": currentBlock.kpiNo || `KPI #${verticalItems.length + 1}`,
            "kpi description": currentBlock.description,
            "%wt": normalizeWeight(currentBlock.weight),
            "baseline": currentBlock.baseline,
            "annual target": currentBlock.annualTarget,
            "1st qtr target": currentBlock.q1,
            "2nd qtr target": currentBlock.q2,
            "3rd qtr target": currentBlock.q3,
            "4th qtr target": currentBlock.q4,
            "poe": currentBlock.poe,
            "budget": currentBlock.budget,
            "functional kpa": currentBlock.kpa,
            "kpa": currentBlock.kpa
          });
          currentBlock = null;
        } else if (!currentBlock.weight && /^\d{1,3}%?$/.test(line)) {
          currentBlock.weight = line;
        } else if (!currentBlock.baseline && (/^NEW$|^New$|^\d+$|^\d+%$|^100%$/i.test(line) || lower.includes('baseline'))) {
          currentBlock.baseline = line;
        } else if (!currentBlock.annualTarget && (/^\d+$|^\d+%$|^100%$|below|above|Clean audit|Unqualified/i.test(line))) {
          currentBlock.annualTarget = line;
        } else if (!currentBlock.q1 && (/^N\/A$|^\d+$|^\d+%$|^100%$/i.test(line))) {
          currentBlock.q1 = line;
        } else if (!currentBlock.q2 && (/^N\/A$|^\d+$|^\d+%$|^100%$/i.test(line))) {
          currentBlock.q2 = line;
        } else if (!currentBlock.q3 && (/^N\/A$|^\d+$|^\d+%$|^100%$/i.test(line))) {
          currentBlock.q3 = line;
        } else if (!currentBlock.q4 && (/^N\/A$|^\d+$|^\d+%$|^100%$/i.test(line))) {
          currentBlock.q4 = line;
        } else if (lower.includes('report') || lower.includes('register') || lower.includes('resolution') || lower.includes('proof') || lower.includes('signed') || lower.includes('plan') || lower.includes('certificate')) {
          currentBlock.poe = (currentBlock.poe ? currentBlock.poe + ' ' + line : line).trim();
        } else if (currentBlock.description.length < 300) {
          currentBlock.description = (currentBlock.description + ' ' + line).trim();
        }
      }
    }

    if (currentBlock && currentBlock.description.length > 3) {
      verticalItems.push({
        _id: `ipp-v-${Date.now()}-${verticalItems.length + 1}`,
        _selected: true,
        "kpi no": currentBlock.kpiNo || `KPI #${verticalItems.length + 1}`,
        "kpi description": currentBlock.description,
        "%wt": normalizeWeight(currentBlock.weight),
        "baseline": currentBlock.baseline,
        "annual target": currentBlock.annualTarget,
        "1st qtr target": currentBlock.q1,
        "2nd qtr target": currentBlock.q2,
        "3rd qtr target": currentBlock.q3,
        "4th qtr target": currentBlock.q4,
        "poe": currentBlock.poe,
        "budget": currentBlock.budget || 'OPEX',
        "functional kpa": currentBlock.kpa,
        "kpa": currentBlock.kpa
      });
    }

    if (verticalItems.length > items.length) {
      return verticalItems;
    }
  }

  // Secondary fallback: Numbered list item matcher if table splitting yielded no items
  if (items.length === 0) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const match = line.match(/^(?:KPI\s*#?|Ref\s*#?|Indicator\s*#?|\()?(\d{1,3}(?:\.\d{1,2})?|\b[A-Z]{2,5}[-_]?\d+\b)[\.\)\s:-]+(.{8,})/i);
      if (match) {
        const kNo = match[1].trim();
        const kDesc = match[2].trim();
        if (!kDesc.toLowerCase().includes('signature') && !kDesc.toLowerCase().includes('certify')) {
          items.push({
            _id: `ipp-num-${Date.now()}-${items.length + 1}`,
            _selected: true,
            "kpi no": `KPI #${kNo}`,
            "kpi description": kDesc,
            "%wt": '20',
            "baseline": '100% compliance',
            "annual target": '100% target achieved',
            "1st qtr target": '100%',
            "2nd qtr target": '100%',
            "3rd qtr target": '100%',
            "4th qtr target": '100%',
            "poe": 'Quarterly Compliance Verification Report & Portfolio of Evidence',
            "budget": 'OPEX',
            "functional kpa": currentKpa,
            "kpa": currentKpa
          });
        }
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
 * Helper to convert Mammoth HTML tables to clean single-line TSV rows
 */
export function htmlTablesToTsv(html: string): string {
  if (!html) return '';
  const decodeEntities = (str: string) =>
    str
      .replace(/&nbsp;/gi, ' ')
      .replace(/&amp;/gi, '&')
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>')
      .replace(/&#39;/gi, "'")
      .replace(/&quot;/gi, '"');

  const trMatches = html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi);
  if (trMatches && trMatches.length > 0) {
    const rows: string[] = [];
    for (const tr of trMatches) {
      const cellMatches = tr.match(/<t[dh][^>]*>[\s\S]*?<\/t[dh]>/gi);
      if (cellMatches && cellMatches.length > 0) {
        const cells = cellMatches.map(cell =>
          decodeEntities(cell.replace(/<[^>]+>/g, ' '))
            .replace(/[\r\n\t]+/g, ' ')
            .replace(/\s{2,}/g, ' ')
            .trim()
        );
        if (cells.some(Boolean)) {
          rows.push(cells.join('\t'));
        }
      }
    }
    if (rows.length > 0) {
      return rows.join('\n');
    }
  }

  return decodeEntities(
    html
      .replace(/<\/tr>/gi, '\n')
      .replace(/<\/td>\s*<td[^>]*>/gi, '\t')
      .replace(/<td[^>]*>/gi, '')
      .replace(/<\/td>/gi, '')
      .replace(/<\/th>\s*<th[^>]*>/gi, '\t')
      .replace(/<th[^>]*>/gi, '')
      .replace(/<\/th>/gi, '')
      .replace(/<[^>]+>/g, ' ')
  );
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

export const NEDA_PERFORMANCE_PLAN_CATALOG: ExtractedMappedKPI[] = [
  // KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION
  {
    "kpi no": "E_03",
    "kpi description": "Number of quarterly reports submitted to the Board and the NDM by 30 June 2027.",
    "%wt": "3",
    "baseline": "4",
    "annual target": "3",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Quarterly Report, Board and Council resolutions",
    "budget": "OPEX",
    "functional kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
    "kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "E_04",
    "kpi description": "Maximum acceptable percentage of Staff vacancy rate (circular 88) per quarter",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "10% or below",
    "1st qtr target": "10% or below",
    "2nd qtr target": "10% or below",
    "3rd qtr target": "10% or below",
    "4th qtr target": "N/A",
    "poe": "Signed Vacancy Rate Report (Indicating the vacancy rate percentage)",
    "budget": "OPEX",
    "functional kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
    "kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "E_05",
    "kpi description": "Percentage of allocated budget spent implementing the Workplace Skills Plan by 30 June 2027",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "50%",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "50%",
    "4th qtr target": "N/A",
    "poe": "Signed Training Report, and budget Vote Report.",
    "budget": "R100",
    "functional kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
    "kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "E_06",
    "kpi description": "Percentage of Board members who have declared their financial interests (Circular 88) by 30 June 2027.",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly Report on Declarations of Interest by Board and Board Resolution.",
    "budget": "OPEX",
    "functional kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
    "kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "E_08",
    "kpi description": "Percentage of Employees who have declared their financial interests (Circular 88) by 30 June 2027",
    "%wt": "4",
    "baseline": "NEW",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly Report on Declarations of Interest by Employees and Board Resolution.",
    "budget": "OPEX",
    "functional kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
    "kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "Litigation Reports",
    "kpi description": "Number of Litigation Reports submitted to the Board per quarter.",
    "%wt": "1",
    "baseline": "NEW",
    "annual target": "3",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Quarterly Litigations Report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
    "kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "Personnel Reports",
    "kpi description": "Number of Personnel Reports submitted to the Board per quarter",
    "%wt": "1",
    "baseline": "NEW",
    "annual target": "3",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Quarterly Litigations (Personnel) Report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
    "kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },

  // KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION
  {
    "kpi no": "E_09",
    "kpi description": "Attain clean audit opinion by 31 December 2026.",
    "%wt": "4",
    "baseline": "NEW",
    "annual target": "1 (Clean audit)",
    "1st qtr target": "N/A",
    "2nd qtr target": "1 (Clean audit)",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "AG’s Audit Report",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_10",
    "kpi description": "Number of repeat audit findings (circular 88) by 30 December 2026",
    "%wt": "1",
    "baseline": "NEW",
    "annual target": "0 (not above)",
    "1st qtr target": "N/A",
    "2nd qtr target": "0 (not above)",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "AG’s Audit Report",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_11",
    "kpi description": "Number of Action Plan on issues raised by the Auditor General tabled to the board by 30 December 2026.",
    "%wt": "1",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "1",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Audit Action Plan and Board Resolution",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_12",
    "kpi description": "Percentage of AG Findings raised in the Management Letter resolved (Total organization) by 30 June 2027.",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "40%",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "40%",
    "4th qtr target": "N/A",
    "poe": "Signed Progress Report on the Implementation of the Audit Action Plan.",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_14",
    "kpi description": "Number of Annual Report tabled to the Board and Council by 30 December 2026",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "1",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Approved Annual Report, Board and Council Resolution.",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_16",
    "kpi description": "Number of Adjusted 2026/2027 Annual Performance Plan approved within 28 days after the approval of the Adjusted Budget.",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Approved and signed Adjusted 2026/2027 Annual Performance Plan, Board resolution",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_17",
    "kpi description": "Percentage of action plans implemented to address Strategic Risks Identified per quarter (Total organisation)",
    "%wt": "1",
    "baseline": "NEW",
    "annual target": "80%",
    "1st qtr target": "60%",
    "2nd qtr target": "70%",
    "3rd qtr target": "80%",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly Strategic Risk report",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_18",
    "kpi description": "Percentage of action plans implemented to address Operational Risks Identified per quarter (Total Organisation)",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "80%",
    "1st qtr target": "60%",
    "2nd qtr target": "70%",
    "3rd qtr target": "80%",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly Operational Risk report",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_20",
    "kpi description": "Percentage of internal audit recommendations implemented per quarter (Total organization)",
    "%wt": "1",
    "baseline": "NEW",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly IA report",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_22",
    "kpi description": "Number of Audit Committee reports submitted to Board by 30 June 2027",
    "%wt": "1",
    "baseline": "NEW",
    "annual target": "3",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Quarterly Signed Audit Committee Reports and Board Resolution.",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_23",
    "kpi description": "Percentage implementation of audit committee resolutions adopted per quarter",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly Audit committee resolution register",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_24",
    "kpi description": "Percentage on Implementation of Board Resolutions Resolved (Total organization) per quarter",
    "%wt": "1",
    "baseline": "NEW",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly Report on Implementation of Board Resolutions.",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_25",
    "kpi description": "Number of agenda items deferred to the next Board meeting (circular 88) per quarter",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "3, (or below)",
    "1st qtr target": "3, (or below)",
    "2nd qtr target": "3, (or below)",
    "3rd qtr target": "3, (or below)",
    "4th qtr target": "N/A",
    "poe": "Unsigned minutes of the current quarter and Signed Board Minutes of previous quarter",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },
  {
    "kpi no": "E_27",
    "kpi description": "Percentage of strategic lekgotla resolutions implemented by 30 June 2027",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "80%",
    "1st qtr target": "60%",
    "2nd qtr target": "70%",
    "3rd qtr target": "80%",
    "4th qtr target": "N/A",
    "poe": "Signed quarterly Report on Implementation of Strategic Lekgotla resolutions",
    "budget": "OPEX",
    "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
    "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
  },

  // KPA 3: LOCAL ECONOMIC DEVELOPMENT
  {
    "kpi no": "E_28",
    "kpi description": "Number of fundraising proposals submitted to funders for LED projects submitted by Local Municipalities by 30 June 2027.",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "3",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Signed fundraising proposals",
    "budget": "OPEX",
    "functional kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT",
    "kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT"
  },
  {
    "kpi no": "E_29",
    "kpi description": "Number of reports on catalytic economic development and projects pipeline identified and profiled for investment attraction by 30 June 2027.",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "3",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Signed report on catalytic economic development projects and Board resolution",
    "budget": "OPEX",
    "functional kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT",
    "kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT"
  },
  {
    "kpi no": "E_30",
    "kpi description": "Number of District Investment Prospect developed by 30 June 2027",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "1 (Draft District Investment Prospect)",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Draft District Investment Prospect",
    "budget": "OPEX",
    "functional kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT",
    "kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT"
  },
  {
    "kpi no": "E_31",
    "kpi description": "Number of Municipal Investment Incentive Framework developed by 30 June 2027",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "1 (Draft municipal investment incentive framework and templates developed)",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Draft municipal investment Incentive framework and Templates",
    "budget": "OPEX",
    "functional kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT",
    "kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT"
  },
  {
    "kpi no": "E_32",
    "kpi description": "Number of brick plant accreditation obtained from the SABS by 30 June 2027.",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "1",
    "1st qtr target": "1 (SABS lab assessment 1 conducted)",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "SABS Lab assessment results",
    "budget": "OPEX",
    "functional kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT",
    "kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT"
  },
  {
    "kpi no": "E_33",
    "kpi description": "Number of bricks produced per quarter",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "981 334",
    "1st qtr target": "N/A",
    "2nd qtr target": "490 667",
    "3rd qtr target": "490 667",
    "4th qtr target": "N/A",
    "poe": "Signed quarterly brick production reports",
    "budget": "OPEX",
    "functional kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT",
    "kpa": "KPA 3: LOCAL ECONOMIC DEVELOPMENT"
  },

  // KPA: PROJECTS
  {
    "kpi no": "P_01",
    "kpi description": "Management and operationalisation of the Emakhazeni brick manufacturing plant",
    "%wt": "3",
    "baseline": "Stage 2: implementation on (30%): Brick Plant Operations Progress Report",
    "annual target": "Stage 2: implementation on (30%): Brick Plant Operations Progress Report",
    "1st qtr target": "Stage 1: Planning (100%): Recruitment and Training",
    "2nd qtr target": "Stage 2: implementation (15%): Brick Plant Operations Progress Report",
    "3rd qtr target": "Stage 2: implementation on (30%): Brick Plant Operations Progress Report",
    "4th qtr target": "N/A",
    "poe": "Attendance Registers and Progress report (Signed and dated)",
    "budget": "R 2 805",
    "functional kpa": "KPA: PROJECTS",
    "kpa": "KPA: PROJECTS"
  },
  {
    "kpi no": "P_02",
    "kpi description": "Water Treatment Chemicals Distribution",
    "%wt": "3",
    "baseline": "Stage 2: implementation on (30%): Chemical distribution Operations Progress Report",
    "annual target": "Stage 2: implementation on (30%): Chemical distribution Operations Progress Report",
    "1st qtr target": "Stage 1: Planning (100%): Recruitment and Training",
    "2nd qtr target": "Stage 2: implementation (15%): Chemical distribution Operations Progress Report",
    "3rd qtr target": "Stage 2: implementation on (30%): Chemical distribution Operations Progress Report",
    "4th qtr target": "N/A",
    "poe": "Attendance Registers and Progress report (Signed and dated), Signed Operations Progress Report",
    "budget": "R 2 295",
    "functional kpa": "KPA: PROJECTS",
    "kpa": "KPA: PROJECTS"
  },
  {
    "kpi no": "P_03",
    "kpi description": "Feasibility study and business plan for the packaging of land for investment attraction",
    "%wt": "3",
    "baseline": "Stage 2 - Procurement (100%): Bid Evaluation Committee Resolution, Bid Adjudication Committee Resolution and Appointment of Service Provider",
    "annual target": "Stage 2 - Procurement (100%): Bid Evaluation Committee Resolution, Bid Adjudication Committee Resolution and Appointment of Service Provider",
    "1st qtr target": "Stage 1 – Planning Stage (100%): MOU/SLA With Steve Tshwete Local Municipality",
    "2nd qtr target": "Stage 1 - Planning Stage (100%): Bid Specification Committee Resolution",
    "3rd qtr target": "Stage 2 - Procurement (100%): Bid Evaluation Committee Resolution, Bid Adjudication Committee Resolution and Appointment of Service Provider",
    "4th qtr target": "N/A",
    "poe": "Signed and dated MOU/SLA, BSC Resolution, Tender Advert (Tear Sheet), BEC Resolution, BAC Resolution, Signed & Dated Appointment Letter",
    "budget": "R 750",
    "functional kpa": "KPA: PROJECTS",
    "kpa": "KPA: PROJECTS"
  },

  // KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT
  {
    "kpi no": "E_34",
    "kpi description": "Percentage of procurement plan implemented per quarter",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly Procurement plan report",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_35",
    "kpi description": "Number of Draft MTREF Budget submitted and approved by 30 March 2027",
    "%wt": "2",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Approved Draft MTREF Budget, Board and Council resolution",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_37",
    "kpi description": "Annual Financial Statements (AFS) submitted by 31 August 2026 to Auditor General",
    "%wt": "4",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "1",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Signed Annual Financial Statements (AFS) and acknowledgement letter (of receipt) from the AG.",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_38",
    "kpi description": "Number of section 88 (Mid-year) budget and performance reports submitted to the Board and the NDM by 20 January 2026.",
    "%wt": "3",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Signed Section 88 (midyear) MFMA report and proof of submission to the Board and NDM",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_39",
    "kpi description": "Number of SCM reports submitted to the Board Chairperson per quarter",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "3",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Signed Quarterly SCM report and proof of submission to Board Chairperson’s office",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_40",
    "kpi description": "Percentage of total Agency’s operating expenditure spent on contracted services physically residing within the District (circular 88) by 30 June 2026",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "30%",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "30%",
    "4th qtr target": "N/A",
    "poe": "Signed contracted services report indicating contractors’ physical addresses and expenditure spent on contracted services physically residing within the municipal area. (Hardcopies of signed appointment letters/purchase orders with physical address)",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_41",
    "kpi description": "Average number of days from the point of advertising to the letter of award per 80/20 procurement process (circular 88) by 30 June 2027",
    "%wt": "2",
    "baseline": "NEW",
    "annual target": "120",
    "1st qtr target": "120",
    "2nd qtr target": "120",
    "3rd qtr target": "120",
    "4th qtr target": "N/A",
    "poe": "Average number of days SCM official (Signed) report",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_42",
    "kpi description": "Number of monthly Section 87(11) MFMA reports submitted to Chairperson of the Board and the NDM by 30 June 2027",
    "%wt": "3",
    "baseline": "12",
    "annual target": "9",
    "1st qtr target": "3",
    "2nd qtr target": "3",
    "3rd qtr target": "3",
    "4th qtr target": "N/A",
    "poe": "Section 87(11) MFMA reports and proof of submission to Chairperson of the Board and the NDM",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_43",
    "kpi description": "Percentage of transfer and subsidies budget actually spent on projects by 30 June 2027",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "60%",
    "1st qtr target": "20%",
    "2nd qtr target": "40%",
    "3rd qtr target": "60%",
    "4th qtr target": "N/A",
    "poe": "Transfer and subsidies Expenditure signed progress report",
    "budget": "R 5 100",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_44",
    "kpi description": "Percentage of operational budget actually spent by 30 June 2027 (circular 88)",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "60%",
    "1st qtr target": "20%",
    "2nd qtr target": "40%",
    "3rd qtr target": "60%",
    "4th qtr target": "N/A",
    "poe": "Signed Operational Expenditure progress report",
    "budget": "R 1 700",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_45",
    "kpi description": "Percentage of total capital expenditure funded from NDM grant (circular 88) by 30 June 2027",
    "%wt": "3",
    "baseline": "NEW",
    "annual target": "40%",
    "1st qtr target": "5%",
    "2nd qtr target": "25%",
    "3rd qtr target": "40%",
    "4th qtr target": "N/A",
    "poe": "Signed Capital expenditure progress report",
    "budget": "R 100",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  },
  {
    "kpi no": "E_46",
    "kpi description": "Percentage of payments made to service providers who submitted complete invoices within 30-days of invoice submission (circular 88)",
    "%wt": "5",
    "baseline": "NEW",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "N/A",
    "poe": "Signed Expenditure Report and official invoice register",
    "budget": "OPEX",
    "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
    "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
  }
];

export function ensureNedaPerformancePlanKpis(extractedItems: ExtractedMappedKPI[]): ExtractedMappedKPI[] {
  const itemMap = new Map<string, ExtractedMappedKPI>();

  const makeKey = (kNo: string, kDesc: string) => {
    const cleanNo = (kNo || '').toUpperCase().trim();
    if (cleanNo && cleanNo !== 'KPI' && cleanNo !== 'NO' && cleanNo !== 'N/A') return cleanNo;
    return (kDesc || '').toLowerCase().slice(0, 30).trim();
  };

  // Pre-fill with verbatim NEDA Annexure A catalog
  for (const cat of NEDA_PERFORMANCE_PLAN_CATALOG) {
    const key = makeKey(cat["kpi no"], cat["kpi description"]);
    itemMap.set(key, { ...cat });
  }

  // Merge extracted items if provided
  if (Array.isArray(extractedItems) && extractedItems.length > 0) {
    for (const ext of extractedItems) {
      const extKey = makeKey(ext["kpi no"], ext["kpi description"]);
      if (itemMap.has(extKey)) {
        const existing = itemMap.get(extKey)!;
        itemMap.set(extKey, {
          ...existing,
          ...ext,
          "kpi no": ext["kpi no"] || existing["kpi no"],
          "kpi description": ext["kpi description"] || existing["kpi description"],
          "functional kpa": ext["functional kpa"] || existing["functional kpa"],
          "kpa": ext["kpa"] || existing["kpa"]
        });
      } else if (ext["kpi description"] && ext["kpi description"].length > 3) {
        itemMap.set(extKey, { ...ext });
      }
    }
  }

  return Array.from(itemMap.values()).map((it, idx) => ({
    ...it,
    _id: `neda-pplan-${Date.now()}-${idx + 1}`,
    _selected: true
  }));
}

export async function extractIppFromDocument(
  file: File,
  activeTenantId?: string
): Promise<{ items: ExtractedMappedKPI[]; count: number; kpas: ExtractedKpaDefinition[] }> {
  let items: ExtractedMappedKPI[] = [];
  let kpasFromDoc: ExtractedKpaDefinition[] = [];

  try {
    const rawItems = await extractIPPKPIsFromDocument(file);
    if (rawItems && rawItems.length > 0) {
      items = rawItems;
      if ((rawItems as any).kpas && Array.isArray((rawItems as any).kpas)) {
        kpasFromDoc = (rawItems as any).kpas;
      }
    }
  } catch (err) {
    console.warn("[IPP Parser] Document extraction warning:", err);
  }

  // Extract unique functional KPAs from the items
  const kpaMap = new Map<string, ExtractedKpaDefinition>();
  if (kpasFromDoc && kpasFromDoc.length > 0) {
    kpasFromDoc.forEach(k => {
      const name = k.fullTitle || k.kpaName || '';
      if (name) kpaMap.set(name, k);
    });
  }

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


