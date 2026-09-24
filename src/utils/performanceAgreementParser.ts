import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import JSZip from 'jszip';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker with reliable fallback CDN URLs
if (typeof window !== 'undefined') {
  try {
    const version = (pdfjsLib as any).version || '3.11.174';
    // Use jsdelivr or unpkg which hosts all versions including .mjs / .js
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("PDF worker initialization warning:", e);
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

  // Internal UI metadata
  _id?: string;
  _selected?: boolean;
}

/**
 * 7 Statutory National KPAs for South African Local Government
 */
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
 * Ensures verbatim functional KPA titles always start with the word 'KPA'
 * (e.g. "KPA 1: Skills Development" or "KPA: Water Quality Monitoring")
 */
export function formatFunctionalKpaTitle(rawTitle: string, defaultNumber?: string | number): string {
  const trimmed = (rawTitle || '').trim();
  if (!trimmed) {
    return defaultNumber ? `KPA ${defaultNumber}: Functional Performance Area` : 'KPA: Functional Performance Area';
  }

  // Strip trailing weight numbers like " 30" or " 15%"
  let clean = trimmed.replace(/\s+\d{1,3}%?$/, '').trim();

  // Detect explicit KPA number from the text
  const numMatch = clean.match(/\bKPA\s*(\d+[A-Za-z]?)\b/i) || clean.match(/^(\d+[A-Za-z]?)\s*[:.\-–]/);
  const kNum = numMatch ? numMatch[1] : (defaultNumber !== undefined && defaultNumber !== null && String(defaultNumber).trim() ? String(defaultNumber) : '');

  // Strip redundant/nested prefixes like "1. KPA 1:", "KPA 1: 1. KPA 1:", "KPA 1: KPA 1:"
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
 * Accurately maps contextual heading, section text, or KPI description
 * to one of the strict abbreviated KPA codes: [bsd, led, mfvm, ggpp, midt, sr]
 * Prioritizes semantic wording over arbitrary numbers.
 */
export function resolveKpaCode(text: string): KpaCode {
  const norm = (text || '').toLowerCase().trim();

  // 1. Direct code match
  if (norm === 'bsd') return 'bsd';
  if (norm === 'midt') return 'midt';
  if (norm === 'led') return 'led';
  if (norm === 'mfvm') return 'mfvm';
  if (norm === 'ggpp') return 'ggpp';
  if (norm === 'sr') return 'sr';
  if (norm === 'cs') return 'cs';

  // 2. High-priority semantic wording matching (domain semantics take precedence over arbitrary numbers)
  if (
    norm.includes('community service') ||
    norm.includes('social service') ||
    norm.includes('community development') ||
    norm.includes('disaster management') ||
    norm.includes('fire service') ||
    norm.includes('traffic') ||
    norm.includes('library') ||
    norm.includes('parks') ||
    norm.includes('cemetery')
  ) {
    return 'cs';
  }

  if (
    norm.includes('skill') ||
    norm.includes('training') ||
    norm.includes('institutional development') ||
    norm.includes('transformation') ||
    norm.includes('human resources') ||
    norm.includes('hr') ||
    norm.includes('workplace skills') ||
    norm.includes('wsp') ||
    norm.includes('ict') ||
    norm.includes('pmds')
  ) {
    return 'midt';
  }

  if (
    norm.includes('financial viability') ||
    norm.includes('financial management') ||
    norm.includes('viability management') ||
    norm.includes('budget') ||
    norm.includes('mscoa') ||
    norm.includes('revenue') ||
    norm.includes('expenditure') ||
    norm.includes('mfma') ||
    norm.includes('debtor') ||
    norm.includes('supply chain') ||
    norm.includes('scm') ||
    norm.includes('billing')
  ) {
    return 'mfvm';
  }

  if (
    norm.includes('basic service') ||
    norm.includes('infrastructure') ||
    norm.includes('water') ||
    norm.includes('electricity') ||
    norm.includes('sanitation') ||
    norm.includes('roads') ||
    norm.includes('refuse') ||
    norm.includes('civil') ||
    norm.includes('engineering') ||
    norm.includes('health surveillance') ||
    norm.includes('food sample') ||
    norm.includes('environmental health') ||
    norm.includes('waste')
  ) {
    return 'bsd';
  }

  if (
    norm.includes('good governance') ||
    norm.includes('public participation') ||
    norm.includes('community engagement') ||
    norm.includes('ward committee') ||
    norm.includes('council') ||
    norm.includes('mpac') ||
    norm.includes('risk management') ||
    norm.includes('internal audit') ||
    norm.includes('community consultation') ||
    norm.includes('oversight') ||
    norm.includes('audit committee') ||
    norm.includes('fraud') ||
    norm.includes('corruption')
  ) {
    return 'ggpp';
  }

  if (
    norm.includes('local economic') ||
    norm.includes('economic development') ||
    norm.includes('job creation') ||
    norm.includes('epwp') ||
    norm.includes('smme') ||
    norm.includes('tourism') ||
    norm.includes('agriculture') ||
    norm.includes('agrarian')
  ) {
    return 'led';
  }

  if (
    norm.includes('spatial rationale') ||
    norm.includes('spatial planning') ||
    norm.includes('spluma') ||
    norm.includes('town planning') ||
    norm.includes('gis') ||
    norm.includes('land use') ||
    norm.includes('human settlements') ||
    norm.includes('housing')
  ) {
    return 'sr';
  }

  // 3. Fallback to standard COGTA numbering if no semantic match
  if (norm.includes('kpa 1')) return 'bsd';
  if (norm.includes('kpa 2')) return 'midt';
  if (norm.includes('kpa 3')) return 'led';
  if (norm.includes('kpa 4')) return 'mfvm';
  if (norm.includes('kpa 5')) return 'ggpp';
  if (norm.includes('kpa 6')) return 'sr';

  return 'ggpp'; // Default municipal fallback
}

/**
 * Calculates roll-up summaries for each KPA, comparing against framework weighting
 */
export function deriveKpaSummaries(
  items: ExtractedMappedKPI[],
  predefinedKpas?: ExtractedKpaDefinition[]
): ExtractedKpaDefinition[] {
  // 1. If predefined KPAs exist, preserve them 1:1 as defined in Section 4.2 of the agreement
  if (predefinedKpas && predefinedKpas.length > 0) {
    const canonicalKpas: ExtractedKpaDefinition[] = predefinedKpas.map((kpa, idx) => {
      const rawTitle = kpa.title || kpa.fullTitle || kpa.kpaName || `KPA ${idx + 1}`;
      const numMatch = rawTitle.match(/\bKPA\s*(\d+[A-Za-z]?)\b/i) || String(kpa.kpaNumber || '').match(/^(\d+[A-Za-z]?)$/);
      const kpaNum = numMatch ? numMatch[1] : (kpa.kpaNumber ? String(kpa.kpaNumber) : String(idx + 1));
      const cleanName = rawTitle.replace(/^KPA\s*\d+[A-Za-z]?\s*[:.\-–]\s*/i, '').trim();
      const formattedTitle = formatFunctionalKpaTitle(cleanName || rawTitle, kpaNum);
      const allocW = kpa.allocatedWeight !== undefined ? kpa.allocatedWeight : (kpa.weighting ? parseFloat(kpa.weighting) : undefined);

      return {
        ...kpa,
        kpaNumber: kpaNum,
        kpaName: cleanName || rawTitle,
        title: formattedTitle,
        fullTitle: formattedTitle,
        code: kpa.code || 'functional',
        allocatedWeight: isNaN(allocW as number) ? undefined : allocW,
        weighting: allocW !== undefined ? String(allocW) : (kpa.weighting || ''),
        kpiCount: 0,
        totalKpiWeight: 0,
        kpaType: 'functional' as const
      };
    });

    // Assign each KPI item to its parent Functional KPA
    items.forEach(it => {
      const itemKpa = (it['functional kpa'] || it['kpa'] || '').trim();
      const itemW = parseFloat(it['%wt'] || '0') || 0;

      // Match by exact KPA number first
      const itemNumMatch = itemKpa.match(/\bKPA\s*(\d+[A-Za-z]?)\b/i);
      let matchedIndex = -1;

      if (itemNumMatch) {
        matchedIndex = canonicalKpas.findIndex(k => k.kpaNumber?.toLowerCase() === itemNumMatch[1].toLowerCase());
      }

      // Match by substring in name
      if (matchedIndex === -1 && itemKpa) {
        const itemNorm = itemKpa.toLowerCase();
        matchedIndex = canonicalKpas.findIndex(k => {
          const kNorm = (k.kpaName || k.title || '').toLowerCase();
          return kNorm.includes(itemNorm) || itemNorm.includes(kNorm);
        });
      }

      // Fallback to first KPA if not matched
      if (matchedIndex === -1 && canonicalKpas.length > 0) {
        matchedIndex = 0;
      }

      if (matchedIndex !== -1) {
        canonicalKpas[matchedIndex].kpiCount = (canonicalKpas[matchedIndex].kpiCount || 0) + 1;
        canonicalKpas[matchedIndex].totalKpiWeight = Math.round(((canonicalKpas[matchedIndex].totalKpiWeight || 0) + itemW) * 100) / 100;
      }
    });

    return canonicalKpas;
  }

  // 2. Synthesize KPAs directly from extracted items if no Section 4.2 table was present
  const statsMap = new Map<string, { count: number; weight: number }>();
  items.forEach(it => {
    const rawKpa = (it['functional kpa'] || it['kpa'] || 'Functional Performance Area').trim();
    const w = parseFloat(it['%wt'] || '0') || 0;
    
    const numMatch = rawKpa.match(/\bKPA\s*(\d+[A-Za-z]?)\b/i);
    const kNum = numMatch ? numMatch[1] : '';
    const cleanTitle = formatFunctionalKpaTitle(rawKpa, kNum);

    const existing = statsMap.get(cleanTitle) || { count: 0, weight: 0 };
    existing.count += 1;
    existing.weight = Math.round((existing.weight + w) * 100) / 100;
    statsMap.set(cleanTitle, existing);
  });

  const result: ExtractedKpaDefinition[] = [];
  let idx = 1;
  for (const [kpaTitle, stats] of statsMap.entries()) {
    const numMatch = kpaTitle.match(/\bKPA\s*(\d+[A-Za-z]?)\b/i);
    const kpaNum = numMatch ? numMatch[1] : String(idx);
    const cleanName = kpaTitle.replace(/^KPA\s*\d+[A-Za-z]?\s*[:.\-–]\s*/i, '').trim();

    result.push({
      kpaNumber: kpaNum,
      kpaName: cleanName || kpaTitle,
      fullTitle: kpaTitle,
      title: kpaTitle,
      weighting: String(stats.weight),
      allocatedWeight: stats.weight,
      kpiCount: stats.count,
      totalKpiWeight: stats.weight,
      code: 'functional',
      kpaType: 'functional'
    });
    idx++;
  }
  return result;
}

/**
 * Normalizes raw string weight to clean numeric string without defaulting or hallucinating
 */
export function normalizeWeight(val: any): string {
  if (val === undefined || val === null) return '';
  const str = String(val).replace('%', '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? '' : String(num);
}

/**
 * Helper to convert ArrayBuffer or Uint8Array to Base64 safely without buffer detachment
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
    console.warn("arrayBufferToBase64 error:", e);
    return "";
  }
}

/**
 * Call Server IPP Extraction Engine with 100% Verbatim Accuracy & Flat-List Schema
 */
export async function callServerAiExtraction(params: {
  documentText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<ExtractedMappedKPI[]> {
  let response: Response;
  try {
    response = await fetch('/api/extract-ipp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
  } catch (_netErr) {
    response = await fetch('/api/extract-performance-agreement', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });
  }

  const rawText = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch (_parseErr) {
    if (!response.ok) {
      throw new Error(`Server extraction failed with status ${response.status}`);
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
        it['key_performance_indicators'] ?? 
        it['key_performance_indicator'] ?? 
        it.kpi ?? 
        it.indicator ?? 
        it.description ?? 
        it.indicatorName ?? 
        it.indicatorDescription ?? 
        it.measure ?? 
        it.output ?? 
        '';
      const kpiNo = it['kpi no'] ?? 
        it.kpiNo ?? 
        it['kpi_no'] ?? 
        it['KPI number'] ?? 
        it['kpi number'] ?? 
        it['KPI Number'] ?? 
        it['kpi_number'] ?? 
        it.refNo ?? 
        it.refNum ?? 
        it.ref ?? 
        it.no ?? 
        it.id ?? 
        `KPI-${idx + 1}`;
      return {
        _id: `ext-${Date.now()}-${idx + 1}`,
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
 * Calls Server Automated Validation Service to cross-verify extracted KPIs with source document
 */
export async function validateExtractionIntegrity(params: {
  documentText?: string;
  fileName?: string;
  fileBase64?: string;
  mimeType?: string;
  items: ExtractedMappedKPI[];
  kpas?: ExtractedKpaDefinition[];
  tenantId?: string;
  userEmail?: string;
  userName?: string;
}): Promise<any> {
  const response = await fetch('/api/validate-extraction-integrity', {
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
  } catch (_e) {
    throw new Error(`Integrity validator returned non-JSON response (${response.status})`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Validation failed with status ${response.status}`);
  }

  return data.report;
}

/**
 * Resilient raw binary stream text extractor for PDF documents
 * Extracts plain text, stream tokens, and text operators without external workers
 */
export function extractRawTextFromPdfBinary(input: ArrayBuffer | Uint8Array): string {
  try {
    const bytes = input instanceof Uint8Array 
      ? input 
      : new Uint8Array(input.slice(0));
    const textDecoder = new TextDecoder('utf-8', { fatal: false });
    const rawString = textDecoder.decode(bytes);

    let extractedText = '';

    // 1. Extract Parenthesized strings (text) Tj and TJ
    const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")/g;
    let match;
    while ((match = tjRegex.exec(rawString)) !== null) {
      const clean = match[1].replace(/\\([()\\])/g, '$1').trim();
      if (clean.length > 0) {
        extractedText += clean + ' ';
      }
    }

    // 2. Extract TJ array strings
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

    // 3. Fallback: Extract printable ASCII sequences
    const printableRegex = /[\x20-\x7E\r\n\t]{4,}/g;
    const matches: string[] = rawString.match(printableRegex) || [];
    const filtered = matches.filter((m: string) => !m.startsWith('/Font') && !m.startsWith('/Obj') && !m.startsWith('xref') && !m.startsWith('endobj')).join(' ');
    return filtered || rawString.slice(0, 50000);
  } catch (e) {
    console.warn("Raw PDF binary extraction error:", e);
    return "";
  }
}

/**
 * Extracts all text content from a PDF document with multi-tier fallback and safe buffer cloning
 */
export async function extractTextFromPDF(input: ArrayBuffer | Uint8Array): Promise<string> {
  let fullText = '';

  // Tier 1: Try PDF.js getDocument with a freshly cloned buffer so it cannot detach the caller's buffer
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
      
      // Sort items primarily by Y descending (top to bottom), secondarily by X ascending (left to right)
      items.sort((a, b) => {
        const yDiff = (b.transform?.[5] || 0) - (a.transform?.[5] || 0);
        if (Math.abs(yDiff) > 3.5) {
          return yDiff;
        }
        return (a.transform?.[4] || 0) - (b.transform?.[4] || 0);
      });

      // Group into table lines by Y coordinate
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
    console.warn("PDF.js text parsing encountered worker issue, falling back to binary extractor:", pdfjsErr);
  }

  // Tier 2: Binary stream extraction fallback
  if (!fullText || fullText.trim().length < 20) {
    const rawExtracted = extractRawTextFromPdfBinary(input);
    if (rawExtracted && rawExtracted.trim().length > 0) {
      fullText = rawExtracted;
    }
  }

  return fullText;
}

/**
 * Extracts and maps KPIs from PDF document with 100% Verbatim Multimodal AI Engine
 */
export async function extractKPIsFromPDF(arrayBuffer: ArrayBuffer, fileName: string = 'Document.pdf'): Promise<ExtractedMappedKPI[]> {
  // Step 1: Immediately extract base64 from a clone of the buffer before any worker or library can detach it
  const fileBase64 = arrayBufferToBase64(arrayBuffer.slice(0));

  // Step 2: Extract full text from PDF on client using a cloned slice
  let fullText = '';
  try {
    fullText = await extractTextFromPDF(arrayBuffer.slice(0));
  } catch (textErr) {
    console.warn("Text extraction failed:", textErr);
  }

  // Step 3: Call Server AI Multimodal Extraction Engine (Passes both PDF Base64 for vision/layout AND extracted text)
  try {
    const aiItems = await callServerAiExtraction({
      documentText: fullText || undefined,
      fileBase64: fileBase64 || undefined,
      mimeType: 'application/pdf',
      fileName
    });

    if (aiItems && aiItems.length > 0) {
      return aiItems;
    }
  } catch (aiErr) {
    console.warn("Server AI PDF extraction error, checking fallback:", aiErr);
  }

  // Step 4: Local heuristic extraction fallback (strictly verbatim without fake placeholders)
  if (fullText && fullText.trim().length > 30) {
    const localItems = parseRawTextLines(fullText);
    if (localItems && localItems.length > 0) {
      return localItems;
    }
  }

  throw new Error("Unable to parse text or tables from PDF document. Please verify the file is not password-protected.");
}

/**
 * Extracts and maps KPIs from Word .docx file with 100% Verbatim Precision
 */
export async function extractKPIsFromDocx(arrayBuffer: ArrayBuffer, fileName: string = 'Document.docx'): Promise<ExtractedMappedKPI[]> {
  const fileBase64 = arrayBufferToBase64(arrayBuffer.slice(0));
  let docxText = '';
  let docxHtml = '';

  // 1. Try Mammoth text and HTML conversion with cloned buffers
  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer.slice(0) });
    docxHtml = htmlResult.value;
  } catch (mErr) {
    console.warn("Mammoth HTML extraction warning:", mErr);
  }

  try {
    const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) });
    docxText = textResult.value;
  } catch (mErr) {
    console.warn("Mammoth text extraction warning:", mErr);
  }

  // 2. Try Word XML Table Extraction via JSZip for table preservation
  try {
    const zip = await JSZip.loadAsync(arrayBuffer.slice(0));
    const documentXml = await zip.file('word/document.xml')?.async('text');

    if (documentXml && typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(documentXml, 'application/xml');
      const tblNodes = xmlDoc.getElementsByTagName('w:tbl');

      if (tblNodes.length > 0) {
        let extractedHtmlTable = '<table>';
        for (let t = 0; t < tblNodes.length; t++) {
          const tbl = tblNodes[t];
          const trNodes = tbl.getElementsByTagName('w:tr');
          for (let r = 0; r < trNodes.length; r++) {
            const tr = trNodes[r];
            extractedHtmlTable += '<tr>';
            const tcNodes = tr.getElementsByTagName('w:tc');
            for (let c = 0; c < tcNodes.length; c++) {
              const tc = tcNodes[c];
              const tNodes = tc.getElementsByTagName('w:t');
              let cellText = '';
              for (let i = 0; i < tNodes.length; i++) {
                cellText += tNodes[i].textContent + ' ';
              }
              extractedHtmlTable += `<td>${cellText.trim()}</td>`;
            }
            extractedHtmlTable += '</tr>';
          }
        }
        extractedHtmlTable += '</table>';
        docxHtml = (docxHtml || '') + '\n' + extractedHtmlTable;
      }
    }
  } catch (zipErr) {
    console.warn("Docx XML table parse skipped:", zipErr);
  }

  const payloadText = docxHtml ? `${docxHtml}\n\nPlain Text:\n${docxText}` : docxText;

  // 3. Prioritize Server AI Engine for 100% exact verbatim extraction
  try {
    const aiItems = await callServerAiExtraction({
      documentText: payloadText,
      fileBase64: fileBase64 || undefined,
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileName
    });
    if (aiItems && aiItems.length > 0) {
      return aiItems;
    }
  } catch (aiErr) {
    console.warn("AI Docx extraction failed, trying local table parser:", aiErr);
  }

  // 4. Local fallback
  if (docxHtml && docxHtml.includes('<table')) {
    const parsedHtml = parseHtmlTableToMappedKPIs(docxHtml);
    if (parsedHtml.length > 0) return parsedHtml;
  }

  if (docxText && docxText.trim().length > 0) {
    return parseRawTextLines(docxText);
  }

  throw new Error(`Failed to parse Word (.docx) document. Please ensure it is a valid document.`);
}

/**
 * Extracts and maps KPIs from Excel/CSV file
 */
export async function extractKPIsFromExcel(arrayBuffer: ArrayBuffer, fileName: string = 'Scorecard.xlsx'): Promise<ExtractedMappedKPI[]> {
  try {
    const workbook = XLSX.read(arrayBuffer.slice(0), { type: 'array' });
    let allExtracted: ExtractedMappedKPI[] = [];
    let combinedCsv = '';

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const csv = XLSX.utils.sheet_to_csv(sheet);
      combinedCsv += `\n--- SHEET: ${sheetName} ---\n${csv}\n`;

      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rawRows || rawRows.length === 0) continue;

      const sheetItems = parseMatrixToMappedKPIs(rawRows, sheetName);
      if (sheetItems.length > 0) {
        allExtracted = allExtracted.concat(sheetItems);
      }
    }

    // Call Server AI Engine for 100% exact extraction
    if (combinedCsv.trim()) {
      try {
        const aiItems = await callServerAiExtraction({
          documentText: combinedCsv,
          fileName
        });
        if (aiItems && aiItems.length > 0) {
          return aiItems;
        }
      } catch (aiErr) {
        console.warn("Server AI Excel extraction fallback to matrix:", aiErr);
      }
    }

    if (allExtracted.length > 0) {
      return allExtracted;
    }

    if (combinedCsv.trim()) {
      return parseRawTextLines(combinedCsv);
    }
  } catch (err: any) {
    console.error("Excel parse error:", err);
    throw new Error(`Failed to parse spreadsheet: ${err.message}`);
  }

  return [];
}

/**
 * Extracts and maps KPIs from pasted raw text or HTML clipboard content with 100% verbatim accuracy
 */
export async function extractKPIsFromPastedContent(
  text: string,
  html?: string,
  sourceName: string = 'Pasted Data'
): Promise<ExtractedMappedKPI[]> {
  // 1. Prioritize Server AI Engine with zero-temperature for 100% exact verbatim wording
  try {
    const payload = html && html.includes('<table') ? `${html}\n\nText:\n${text}` : text;
    const aiItems = await callServerAiExtraction({
      documentText: payload,
      fileName: sourceName
    });
    if (aiItems && aiItems.length > 0) {
      return aiItems;
    }
  } catch (e) {
    console.warn("AI extraction for pasted content failed, using local table parser:", e);
  }

  // 2. If HTML table exists, parse directly
  if (html && html.includes('<table')) {
    const parsedHtml = parseHtmlTableToMappedKPIs(html);
    if (parsedHtml.length > 0) {
      return parsedHtml;
    }
  }

  // 3. If TSV or delimited lines
  if (text.includes('\t') || text.includes(',')) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const matrix: string[][] = lines.map(line => {
      if (line.includes('\t')) return line.split('\t').map(c => c.trim());
      return line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    });

    const parsedMatrix = parseMatrixToMappedKPIs(matrix, sourceName);
    if (parsedMatrix.length > 0) {
      return parsedMatrix;
    }
  }

  // 4. Line-by-line heuristic parsing strictly verbatim without fake placeholders
  return parseRawTextLines(text);
}

/**
 * Parses HTML Table directly to strictly mapped schema
 */
function parseHtmlTableToMappedKPIs(htmlString: string): ExtractedMappedKPI[] {
  if (typeof DOMParser === 'undefined') return [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlString, 'text/html');
  const tables = doc.querySelectorAll('table');

  const allItems: ExtractedMappedKPI[] = [];

  tables.forEach((table) => {
    const rows = Array.from(table.querySelectorAll('tr'));
    if (rows.length < 2) return;

    const matrix: string[][] = rows.map(tr => {
      const cells = Array.from(tr.querySelectorAll('th, td'));
      return cells.map(cell => (cell.textContent || '').trim());
    });

    const items = parseMatrixToMappedKPIs(matrix);
    allItems.push(...items);
  });

  return allItems;
}

// Helper to identify and skip contract clauses, rating scales, and legal text
function isLegalOrIgnoredText(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (lower.includes('page ') && lower.includes(' of ')) ||
    lower.includes("employee’s signature") || lower.includes("employee's signature") ||
    lower.includes("supervisor’ signature") || lower.includes("supervisor' signature") ||
    lower.includes("pms official’s signature") || lower.includes("pms official's signature") ||
    lower.includes("annexure b: personal development plan") ||
    lower.includes("annexure c: disclosure of interest") ||
    lower.includes("whereby it is agreed as follows") ||
    lower.includes("1. purpose") || lower.includes("2. validity of the agreement") ||
    lower.includes("3. reporting requirements") || lower.includes("4. performance assessment framework") ||
    lower.includes("5. conditions of performance") || lower.includes("6. performance assessment") ||
    lower.includes("7. feedback") || lower.includes("8. timetable and records") ||
    lower.includes("9. management of poor performance") || lower.includes("10. dispute resolution") ||
    lower.includes("11. amendment of agreement") || lower.includes("12. evaluation") ||
    lower.includes("13. signatures of parties") ||
    (lower.includes("outstanding performance") && lower.includes("75-100")) ||
    (lower.includes("fully effective") && lower.includes("51-64")) ||
    (lower.includes("not fully effective") && lower.includes("31-50")) ||
    (lower.includes("unacceptable performance") && lower.includes("less than")) ||
    lower.includes("performance significantly above") ||
    lower.startsWith("level terminology description") ||
    lower.startsWith("note: adherence to jsc") ||
    lower.startsWith("note: weighting for one") ||
    lower.startsWith("the municipal moderation committee consists of") ||
    lower.startsWith("the departmental performance moderation")
  );
}

/**
 * Parses 2D Matrix into the exact required schema without inserting fake defaults
 * Supports multi-tier/merged header rows and positional column fallbacks
 */
function parseMatrixToMappedKPIs(matrix: string[][], contextHint?: string): ExtractedMappedKPI[] {
  if (!matrix || matrix.length < 2) return [];

  // 1. Locate primary header row
  let headerRowIndex = -1;
  let currentFunctionalKpa = (contextHint || 'Functional Performance Area').trim();

  for (let r = 0; r < Math.min(matrix.length, 10); r++) {
    const rowStr = matrix[r].join(' ').toLowerCase();
    if (
      (rowStr.includes('kpi') || rowStr.includes('indicator') || rowStr.includes('project') || rowStr.includes('target') || rowStr.includes('output') || rowStr.includes('measure')) &&
      (rowStr.includes('weight') || rowStr.includes('annual') || rowStr.includes('q1') || rowStr.includes('quarter') || rowStr.includes('milestone') || rowStr.includes('target') || rowStr.includes('baseline') || rowStr.includes('poe') || rowStr.includes('evidence'))
    ) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    if (matrix[0].length >= 4) headerRowIndex = 0;
    else return [];
  }

  // 2. Build composite header by merging header row and potential sub-header rows (multi-tier merged headers)
  const maxCols = Math.max(...matrix.map(row => row.length));
  const compositeHeader: string[] = [];
  let subHeaderRowsCount = 0;

  for (let c = 0; c < maxCols; c++) {
    let colText = (matrix[headerRowIndex]?.[c] || '').toLowerCase().trim();
    // Check if next 1 or 2 rows are also header/sub-header rows
    for (let subR = 1; subR <= 2; subR++) {
      const candidateRowIndex = headerRowIndex + subR;
      if (candidateRowIndex < matrix.length) {
        const candidateRow = matrix[candidateRowIndex];
        const rowJoined = candidateRow.join(' ').toLowerCase();
        const isHeaderLike = rowJoined.includes('q1') || rowJoined.includes('q2') || rowJoined.includes('q3') || rowJoined.includes('q4') ||
          rowJoined.includes('annual') || rowJoined.includes('target') || rowJoined.includes('baseline') || rowJoined.includes('quarter') ||
          rowJoined.includes('milestone') || rowJoined.includes('actual') || rowJoined.includes('weight') || rowJoined.includes('poe') || rowJoined.includes('evidence');
        
        const hasKpiNumber = candidateRow.some(cell => /^[M|P]_\d+|[A-Z]{1,5}[-_]\d+|\b\d+\.\d+\b|\bKPI\s*\d+/i.test(cell.trim()));
        
        if (isHeaderLike && !hasKpiNumber) {
          const subCell = (candidateRow[c] || '').toLowerCase().trim();
          if (subCell) {
            colText += ' ' + subCell;
          }
          if (c === 0 && subR > subHeaderRowsCount) {
            subHeaderRowsCount = subR;
          }
        }
      }
    }
    compositeHeader.push(colText.trim());
  }

  // Find column indices with robust keyword matching
  let colKpiNo = compositeHeader.findIndex(h => h.includes('kpi number') || h.includes('kpi no') || h.includes('kpi ids') || h.includes('kpi id') || h.includes('project id') || h.includes('kpi ref') || h.includes('ref no') || h.includes('ref number') || h.includes('indicator no') || h === 'no' || h === 'no.' || h === '#' || h === 'ref');
  let colKpiDesc = compositeHeader.findIndex(h => h.includes('key performance indicator') || h.includes('key performance indicators') || h.includes('kpi description') || h.includes('project name') || h.includes('indicator') || h.includes('output') || h.includes('description') || h.includes('measure') || h.includes('activity') || h === 'kpi' || h === 'project');
  let colLocation = compositeHeader.findIndex(h => h.includes('location') || h.includes('locatio') || h.includes('municipality') || h.includes('area'));
  let colWeight = compositeHeader.findIndex(h => h.includes('weight') || h.includes('%wt') || h.includes('weighting') || h.includes('%') || h.includes('wt'));
  let colBaseline = compositeHeader.findIndex(h => h.includes('baseline') || h.includes('baseline2025/2026') || h.includes('baseline 2025/2026') || h.includes('baseline2024/2025') || h.includes('baseline 2024/2025') || h.includes('previous year') || h.includes('prior year') || h.includes('2023/24') || h.includes('2024/25') || h.includes('2025/26') || h.includes('actual baseline'));
  
  // Target columns: exact pattern matching
  let colAnnualTarget = compositeHeader.findIndex(h => 
    (h.includes('annual') && h.includes('target')) || 
    (h.includes('annual') && h.includes('milestone')) || 
    (h.includes('annual') && h.includes('planned')) || 
    h.includes('annual target') || 
    h.includes('yearly target') || 
    h.includes('annual planned target') || 
    h.includes('annual milestone') ||
    h.includes('target for the year') || 
    h.includes('annual output') || 
    h.includes('target (annual)') || 
    h.includes('planned annual target') ||
    (/^(annual|annual milestone|target)$/i.test(h) && !h.includes('q1') && !h.includes('q2') && !h.includes('q3') && !h.includes('q4') && !h.includes('1st') && !h.includes('2nd') && !h.includes('3rd') && !h.includes('4th'))
  );

  let colQ1 = compositeHeader.findIndex(h => 
    h.includes('1st quarter planned target') || h.includes('1st quarter planned') || h.includes('1st quarter target') || h.includes('1st qtr target') || h.includes('1st quarter') || h.includes('1st qtr') ||
    /\b(q1|q\s*1|1st\s*q|1st\s*quarter|quarter\s*1|quarter\s*01|first\s*quarter|qtr\s*1|qtr1|jul\s*[-–]\s*sep)\b/i.test(h) ||
    h.includes('q1 target') || h.includes('q1 planned') || h.includes('quarter 1 target')
  );

  let colQ2 = compositeHeader.findIndex(h => 
    h.includes('2nd quarter planned target') || h.includes('2nd quarter planned') || h.includes('2nd quarter target') || h.includes('2nd qtr target') || h.includes('2nd quarter') || h.includes('2nd qtr') ||
    /\b(q2|q\s*2|2nd\s*q|2nd\s*quarter|quarter\s*2|quarter\s*02|second\s*quarter|qtr\s*2|qtr2|oct\s*[-–]\s*dec)\b/i.test(h) ||
    h.includes('q2 target') || h.includes('q2 planned') || h.includes('quarter 2 target')
  );

  let colQ3 = compositeHeader.findIndex(h => 
    h.includes('3rd quarter planned target') || h.includes('3rd quarter planned') || h.includes('3rd quarter target') || h.includes('3rd qtr target') || h.includes('3rd quarter') || h.includes('3rd qtr') ||
    /\b(q3|q\s*3|3rd\s*q|3rd\s*quarter|quarter\s*3|quarter\s*03|third\s*quarter|qtr\s*3|qtr3|jan\s*[-–]\s*mar)\b/i.test(h) ||
    h.includes('q3 target') || h.includes('q3 planned') || h.includes('quarter 3 target')
  );

  let colQ4 = compositeHeader.findIndex(h => 
    h.includes('4th quarter planned target') || h.includes('4th quarter planned') || h.includes('4th quarter target') || h.includes('4th qtr target') || h.includes('4th quarter') || h.includes('4th qtr') ||
    /\b(q4|q\s*4|4th\s*q|4th\s*quarter|quarter\s*4|quarter\s*04|fourth\s*quarter|qtr\s*4|qtr4|apr\s*[-–]\s*jun)\b/i.test(h) ||
    h.includes('q4 target') || h.includes('q4 planned') || h.includes('quarter 4 target')
  );

  let colPoe = compositeHeader.findIndex(h => h.includes('poe') || h.includes('portfolio of evidence') || h.includes('means of verification') || h.includes('evidence') || h.includes('verification'));
  let colBudget = compositeHeader.findIndex(h => h.includes('total budget allocated') || h.includes('total budget') || h.includes('budget') || h.includes('allocation') || h.includes('financial') || h.includes('funding'));
  let colFunctionalKpa = compositeHeader.findIndex(h => 
    /^(functional kpa|kpa name|kpa title|departmental kpa|kpa)$/i.test(h) || 
    (h.includes('functional kpa') && !h.includes('indicator') && !h.includes('target') && !h.includes('weight') && !h.includes('objective'))
  );

  // 3. Fallback Positional Resolution for Standard SDBIP / Scorecard Matrices
  if (colBaseline !== -1) {
    const endTargetCol = colPoe !== -1 ? colPoe : maxCols;
    const targetGap = endTargetCol - colBaseline - 1;

    if (targetGap >= 5) {
      if (colAnnualTarget === -1) colAnnualTarget = colBaseline + 1;
      if (colQ1 === -1) colQ1 = colBaseline + 2;
      if (colQ2 === -1) colQ2 = colBaseline + 3;
      if (colQ3 === -1) colQ3 = colBaseline + 4;
      if (colQ4 === -1) colQ4 = colBaseline + 5;
    } else if (targetGap === 4) {
      if (colQ1 === -1) colQ1 = colBaseline + 1;
      if (colQ2 === -1) colQ2 = colBaseline + 2;
      if (colQ3 === -1) colQ3 = colBaseline + 3;
      if (colQ4 === -1) colQ4 = colBaseline + 4;
    } else if (targetGap === 1 && colAnnualTarget === -1) {
      colAnnualTarget = colBaseline + 1;
    }
  }

  const items: ExtractedMappedKPI[] = [];
  const startRow = headerRowIndex + 1 + subHeaderRowsCount;

  for (let r = startRow; r < matrix.length; r++) {
    const row = matrix[r];
    if (!row || row.length === 0) continue;
    const rowText = row.join(' ').trim();
    if (!rowText) continue;

    if (isLegalOrIgnoredText(rowText)) {
      continue;
    }

    // Check if this row is a general KPA Section Banner or Projects Section Banner
    const kpaBannerMatch = rowText.match(/^[-*#\s|]*(?:KPA\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*|Key\s*Performance\s*Area\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*)(.+)$/i);
    if (kpaBannerMatch) {
      const kpaNum = kpaBannerMatch[1] || kpaBannerMatch[2] || '';
      const rawKpaName = kpaBannerMatch[3].trim().replace(/\|.*$/, '').trim();
      if (rawKpaName.length > 1 && !rawKpaName.toLowerCase().includes('kpi no') && !rawKpaName.toLowerCase().includes('kpi ids') && !rawKpaName.toLowerCase().includes('weight')) {
        currentFunctionalKpa = kpaNum ? `KPA ${kpaNum}: ${rawKpaName}` : `KPA: ${rawKpaName}`;
      }
      continue;
    }

    if (
      rowText.toLowerCase().includes('institution development') ||
      rowText.toLowerCase().includes('good governance') ||
      rowText.toLowerCase().includes('local economic') ||
      rowText.toLowerCase().includes('financial viability') ||
      rowText.toLowerCase().includes('basic service delivery') ||
      rowText.toLowerCase().includes('projects: completed projects') ||
      rowText.toLowerCase().includes('completed projects for priority issue')
    ) {
      const cleanBanner = rowText.replace(/^[-*#\s|]+/, '').replace(/^KPA\s*\d+\s*[:.\-–]\s*/i, '').trim();
      if (cleanBanner.length > 2 && !cleanBanner.toLowerCase().includes('kpi no') && !cleanBanner.toLowerCase().includes('kpi ids')) {
        currentFunctionalKpa = cleanBanner;
      }
      continue;
    }

    // Skip repeat header rows in paginated tables
    const rowLower = rowText.toLowerCase();
    if (
      (rowLower.includes('kpi no') || rowLower.includes('kpi ids') || rowLower.includes('indicator') || rowLower.includes('project name') || rowLower.includes('baseline')) &&
      (rowLower.includes('weight') || rowLower.includes('annual target') || rowLower.includes('annual milestone') || rowLower.includes('poe'))
    ) {
      continue;
    }

    // Extract cell values with complete verbatim text
    const kpiNoVal = colKpiNo !== -1 && colKpiNo < row.length ? row[colKpiNo] : '';
    let kpiDescVal = colKpiDesc !== -1 && colKpiDesc < row.length ? row[colKpiDesc] : (colKpiNo !== -1 && row[1] ? row[1] : row[0]);
    const locationVal = colLocation !== -1 && colLocation < row.length ? row[colLocation] : '';
    const weightVal = colWeight !== -1 && colWeight < row.length ? row[colWeight] : '';
    const baselineVal = colBaseline !== -1 && colBaseline < row.length ? row[colBaseline] : '';
    const annualTargetVal = colAnnualTarget !== -1 && colAnnualTarget < row.length ? row[colAnnualTarget] : '';
    const q1Val = colQ1 !== -1 && colQ1 < row.length ? row[colQ1] : '';
    const q2Val = colQ2 !== -1 && colQ2 < row.length ? row[colQ2] : '';
    const q3Val = colQ3 !== -1 && colQ3 < row.length ? row[colQ3] : '';
    const q4Val = colQ4 !== -1 && colQ4 < row.length ? row[colQ4] : '';
    const poeVal = colPoe !== -1 && colPoe < row.length ? row[colPoe] : '';
    const budgetVal = colBudget !== -1 && colBudget < row.length ? row[colBudget] : '';
    const rowKpaVal = colFunctionalKpa !== -1 && colFunctionalKpa < row.length ? row[colFunctionalKpa] : '';

    // Ignore completely empty rows
    if (!kpiDescVal && !kpiNoVal && !annualTargetVal && !baselineVal && !q1Val) continue;

    // Append location if project table has location
    if (locationVal && locationVal.trim() && !kpiDescVal.toLowerCase().includes(locationVal.toLowerCase())) {
      kpiDescVal = `${kpiDescVal} (Location: ${locationVal.trim()})`;
    }

    // Only use rowKpaVal if it is a concise, valid KPA name (not a long narrative or project description)
    let validatedRowKpa = '';
    if (rowKpaVal && rowKpaVal.trim().length <= 70 && !rowKpaVal.includes('.') && rowKpaVal.split(/\s+/).length <= 8) {
      validatedRowKpa = rowKpaVal.trim();
    }

    const effectiveFunctionalKpa = String(validatedRowKpa || currentFunctionalKpa || 'Functional Performance Area').trim();

    items.push({
      _id: `kpi-mapped-${Date.now()}-${items.length + 1}`,
      _selected: true,
      "kpi no": String(kpiNoVal || `KPI-${items.length + 1}`).trim(),
      "kpi description": String(kpiDescVal || '').trim(),
      "%wt": normalizeWeight(weightVal),
      "baseline": String(baselineVal || '').trim(),
      "annual target": String(annualTargetVal || '').trim(),
      "1st qtr target": String(q1Val || '').trim(),
      "2nd qtr target": String(q2Val || '').trim(),
      "3rd qtr target": String(q3Val || '').trim(),
      "4th qtr target": String(q4Val || '').trim(),
      "poe": String(poeVal || '').trim(),
      "budget": String(budgetVal || '').trim(),
      "functional kpa": effectiveFunctionalKpa,
      "kpa": effectiveFunctionalKpa
    });
  }

  return items;
}

/**
 * Line-by-line text parser for unstructured text with 100% verbatim extraction and NO fake defaults
 */
function parseRawTextLines(text: string): ExtractedMappedKPI[] {
  // If the text contains tabs or commas or pipe characters, route through matrix parser
  if (text.includes('\t') || text.includes('|')) {
    const rawLines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const matrix: string[][] = rawLines.map(line => {
      if (line.includes('\t')) return line.split('\t').map(c => c.trim());
      return line.split('|').map(c => c.trim());
    });
    const parsedMatrix = parseMatrixToMappedKPIs(matrix);
    if (parsedMatrix.length > 0) {
      return parsedMatrix;
    }
  }

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: ExtractedMappedKPI[] = [];
  let currentFunctionalKpa = 'Functional Performance Area';
  let insideScorecardOrProjects = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (isLegalOrIgnoredText(line)) {
      continue;
    }

    if (
      line.toLowerCase().includes('annexure a: performance plan') ||
      line.toLowerCase().includes('projects: completed projects') ||
      line.toLowerCase().includes('completed projects for priority issue')
    ) {
      insideScorecardOrProjects = true;
    }

    const kpaBannerMatch = line.match(/^[-*#\s|]*(?:KPA\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*|Key\s*Performance\s*Area\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*)(.+)$/i);
    if (kpaBannerMatch) {
      const kpaNum = kpaBannerMatch[1] || kpaBannerMatch[2] || '';
      const rawKpaName = kpaBannerMatch[3].trim().replace(/\|.*$/, '').trim();
      if (rawKpaName.length > 1 && !rawKpaName.toLowerCase().includes('kpi no') && !rawKpaName.toLowerCase().includes('kpi ids') && !rawKpaName.toLowerCase().includes('weight')) {
        currentFunctionalKpa = kpaNum ? `KPA ${kpaNum}: ${rawKpaName}` : `KPA: ${rawKpaName}`;
        insideScorecardOrProjects = true;
      }
      continue;
    }

    if (
      line.toLowerCase().includes('institution development') ||
      line.toLowerCase().includes('good governance') ||
      line.toLowerCase().includes('local economic') ||
      line.toLowerCase().includes('financial viability') ||
      line.toLowerCase().includes('basic service delivery') ||
      line.toLowerCase().includes('projects: completed projects') ||
      line.toLowerCase().includes('completed projects for priority issue')
    ) {
      const cleanBanner = line.replace(/^[-*#\s|]+/, '').replace(/^KPA\s*\d+\s*[:.\-–]\s*/i, '').trim();
      if (cleanBanner.length > 2 && !cleanBanner.toLowerCase().includes('kpi no') && !cleanBanner.toLowerCase().includes('kpi ids') && !cleanBanner.toLowerCase().includes('weight')) {
        currentFunctionalKpa = cleanBanner;
        insideScorecardOrProjects = true;
      }
      continue;
    }

    // Match explicit KPI codes (M_11, M_15, P_09, P_10, KPI 1, BSD-01, MFVM-02) inside scorecard/projects
    const match = line.match(/^([M|P]_\d+|[A-Z]{2,5}[-_]\d+|\bKPI\s*\d+)\s*[:.\-–\t\s|](.+)$/i);
    if (match && insideScorecardOrProjects) {
      const kpiNo = match[1].trim();
      const kpiDesc = match[2].trim();
      if (kpiDesc.length > 3 && !kpiDesc.toLowerCase().startsWith('financial year') && !kpiDesc.toLowerCase().startsWith('page') && !kpiDesc.toLowerCase().includes('signature')) {
        items.push({
          _id: `raw-${Date.now()}-${items.length + 1}`,
          _selected: true,
          "kpi no": kpiNo,
          "kpi description": kpiDesc,
          "%wt": "",
          "baseline": "",
          "annual target": "",
          "1st qtr target": "",
          "2nd qtr target": "",
          "3rd qtr target": "",
          "4th qtr target": "",
          "poe": "",
          "budget": "",
          "functional kpa": currentFunctionalKpa,
          "kpa": currentFunctionalKpa
        });
      }
    }
  }

  return items;
}
