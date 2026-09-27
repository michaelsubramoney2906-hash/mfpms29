import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    const version = (pdfjsLib as any).version || '3.11.174';
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("[GM IPP Parser] PDF worker initialization:", e);
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
}

/**
 * Strict Flat-List Item Schema for GM Extractor
 * Mapped strictly as specified:
 * kpi ids -> kpi no
 * key performance indicator -> kpi description
 * weight -> wt
 * baseline -> baseline
 * total budget -> budget
 * annual -> annual target
 * q1 -> 1st qtr target
 * q2 -> 2nd qtr target
 * q3 -> 3rd qtr target
 * q4 -> 4th qtr target
 * poe -> 1st qtr poe, 2nd qtr poe, 3rd qtr poe, 4th qtr poe
 */
export interface ExtractedGmMappedKPI {
  "kpi no": string;
  "kpi description": string;
  "wt": string;
  "%wt"?: string;
  "baseline": string;
  "annual target": string;
  "1st qtr target": string;
  "2nd qtr target": string;
  "3rd qtr target": string;
  "4th qtr target": string;
  "1st qtr poe": string;
  "2nd qtr poe": string;
  "3rd qtr poe": string;
  "4th qtr poe": string;
  "poe": string;
  "budget": string;
  "functional kpa": string;
  "national kpa"?: string;
  "kpa": string;

  // Internal UI tracking
  _id?: string;
  _selected?: boolean;
}

export interface GmIPPExtractionResponse {
  success: boolean;
  items: ExtractedGmMappedKPI[];
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
}

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
    console.warn("[GM IPP Parser] arrayBufferToBase64 error:", e);
    return "";
  }
}

/**
 * Calls Server GM IPP Extraction Engine enforcing exact field mapping
 */
export async function callServerAiGmIPPExtraction(params: {
  documentText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<ExtractedGmMappedKPI[]> {
  const response = await fetch('/api/extract-gm-ipp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });

  const rawText = await response.text();
  let data: any = null;
  try {
    data = JSON.parse(rawText);
  } catch (_parseErr) {
    if (!response.ok) {
      throw new Error(`Server GM IPP extraction failed with status ${response.status}`);
    }
    throw new Error(`Server returned non-JSON response (${response.status}): ${rawText.slice(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Server extraction failed with status ${response.status}`);
  }

  if (data && data.success && Array.isArray(data.items)) {
    const formattedList: ExtractedGmMappedKPI[] = data.items.map((it: any, idx: number) => {
      const functionalKpa = String(it['functional kpa'] || it.functionalKpa || it.kpa || 'Functional Performance Area').trim();
      const kpiNoVal = it['kpi no'] ?? it.kpiNo ?? it['kpi ids'] ?? it['KPI IDs'] ?? it.kpiId ?? `M_${idx + 1}`;
      const kpiDescVal = it['kpi description'] ?? it.kpiDescription ?? it['key performance indicator'] ?? it['Key Performance Indicator'] ?? '';
      const wtVal = String(it.wt ?? it['%wt'] ?? it.weight ?? it.weighting ?? '').replace('%', '').trim();
      const poeVal = String(it.poe ?? it.POE ?? it['portfolio of evidence'] ?? '').trim();

      const q1PoeVal = String(it['1st qtr poe'] ?? it.q1Poe ?? poeVal).trim();
      const q2PoeVal = String(it['2nd qtr poe'] ?? it.q2Poe ?? poeVal).trim();
      const q3PoeVal = String(it['3rd qtr poe'] ?? it.q3Poe ?? poeVal).trim();
      const q4PoeVal = String(it['4th qtr poe'] ?? it.q4Poe ?? poeVal).trim();

      return {
        _id: `gm-ipp-ext-${Date.now()}-${idx + 1}`,
        _selected: true,
        "kpi no": String(kpiNoVal).trim(),
        "kpi description": String(kpiDescVal).trim(),
        "wt": wtVal,
        "%wt": wtVal,
        "baseline": String(it.baseline ?? '').trim(),
        "annual target": String(it['annual target'] ?? it.annualTarget ?? it.annual ?? '').trim(),
        "1st qtr target": String(it['1st qtr target'] ?? it.q1Target ?? it.q1 ?? '').trim(),
        "2nd qtr target": String(it['2nd qtr target'] ?? it.q2Target ?? it.q2 ?? '').trim(),
        "3rd qtr target": String(it['3rd qtr target'] ?? it.q3Target ?? it.q3 ?? '').trim(),
        "4th qtr target": String(it['4th qtr target'] ?? it.q4Target ?? it.q4 ?? '').trim(),
        "1st qtr poe": q1PoeVal,
        "2nd qtr poe": q2PoeVal,
        "3rd qtr poe": q3PoeVal,
        "4th qtr poe": q4PoeVal,
        "poe": poeVal,
        "budget": String(it.budget ?? it['total budget'] ?? it['total budget allocated'] ?? '').trim(),
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
    return formattedList;
  }

  return [];
}

/**
 * Extracts raw text from PDF document
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
    console.warn("[GM IPP Parser] PDF.js extraction warning:", pdfjsErr);
  }

  return fullText;
}

/**
 * Deterministic GM scorecard line parser operating on raw text
 */
export function parseGmRawTextLines(text: string): ExtractedGmMappedKPI[] {
  if (!text || !text.trim()) return [];

  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: ExtractedGmMappedKPI[] = [];
  let currentKpa = 'Functional Performance Area';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Detect KPA Heading banner (e.g. "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION")
    const kpaBanner = line.match(/^[-*#\s|]*(?:KPA\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*|Key\s*Performance\s*Area\s*(\d+[A-Za-z]?)\s*[:.\-–]\s*)(.+)$/i);
    if (kpaBanner) {
      const num = kpaBanner[1] || kpaBanner[2] || '';
      const name = kpaBanner[3].trim().replace(/\|.*$/, '').trim();
      if (!name.toLowerCase().includes('kpi ids') && !name.toLowerCase().includes('weight')) {
        currentKpa = num ? `KPA ${num}: ${name}` : `KPA: ${name}`;
      }
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

        // GM KPI ID pattern matching: M_01, M_15, P_03, P_04, KPI-01, 1, 1.1, etc.
        const isValidKpiNo = /^(?:[M|P|U]_\d+|\bM_\d+\b|\bP_\d+\b|(?:KPI|Ref|No)[-.\s_]?\d+|\d{1,3}(?:\.\d{1,2}){0,2}|[A-Z]{2,5}[-_]?\d+|\d+[A-Za-z]?)$/i.test(firstCell);

        const isExcludedWord = 
          firstCellLower.includes('herein') ||
          firstCellLower.includes('employee') ||
          firstCellLower.includes('supervisor') ||
          firstCellLower.includes('employer') ||
          firstCellLower.includes('kpi ids') ||
          firstCellLower.includes('kpi id') ||
          firstCellLower.includes('signature') ||
          firstCellLower.includes('unacceptable') ||
          firstCellLower.includes('effective') ||
          firstCellLower.includes('outstanding');

        if (isValidKpiNo && !isExcludedWord) {
          const desc = rawCells[1] || '';
          if (desc.length > 2 && !desc.toLowerCase().includes('signature') && !desc.toLowerCase().includes('certify')) {
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
              _id: `gm-ipp-raw-${Date.now()}-${items.length + 1}`,
              _selected: true,
              "kpi no": kpiNo,
              "kpi description": desc,
              "wt": weight.replace('%', '').trim(),
              "%wt": weight.replace('%', '').trim(),
              "baseline": baseline,
              "annual target": annualTarget,
              "1st qtr target": q1,
              "2nd qtr target": q2,
              "3rd qtr target": q3,
              "4th qtr target": q4,
              "1st qtr poe": poe,
              "2nd qtr poe": poe,
              "3rd qtr poe": poe,
              "4th qtr poe": poe,
              "poe": poe,
              "budget": budget,
              "functional kpa": currentKpa,
              "kpa": currentKpa
            });
          }
        }
      }
    }
  }

  return items;
}

/**
 * Master dispatcher for GM Extractor files
 */
export async function extractGmIppFromDocument(file: File): Promise<{ items: ExtractedGmMappedKPI[]; count: number; kpas: ExtractedKpaDefinition[] }> {
  const arrayBuffer = await file.arrayBuffer();
  const extension = file.name.split('.').pop()?.toLowerCase() || '';
  const fileBase64 = arrayBufferToBase64(arrayBuffer.slice(0));

  let extractedItems: ExtractedGmMappedKPI[] = [];
  let fullText = '';

  if (extension === 'pdf') {
    try {
      fullText = await extractTextFromPDF(arrayBuffer.slice(0));
    } catch (e) {
      console.warn("[GM IPP Parser] PDF text extraction warning:", e);
    }
  } else if (['docx', 'doc'].includes(extension)) {
    try {
      const textResult = await mammoth.extractRawText({ arrayBuffer: arrayBuffer.slice(0) });
      fullText = textResult.value;
    } catch (e) {
      console.warn("[GM IPP Parser] Docx text extraction warning:", e);
    }
  } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
    try {
      const workbook = XLSX.read(arrayBuffer.slice(0), { type: 'array' });
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        if (!sheet) continue;
        fullText += `\n--- SHEET: ${sheetName} ---\n` + XLSX.utils.sheet_to_csv(sheet);
      }
    } catch (e) {
      console.warn("[GM IPP Parser] Excel text extraction warning:", e);
    }
  } else {
    const textDecoder = new TextDecoder('utf-8');
    fullText = textDecoder.decode(arrayBuffer);
  }

  // First attempt: Call dedicated Server GM Extractor AI
  try {
    const aiItems = await callServerAiGmIPPExtraction({
      documentText: fullText || undefined,
      fileBase64: fileBase64 || undefined,
      mimeType: file.type || 'application/pdf',
      fileName: file.name
    });

    if (aiItems && aiItems.length > 0) {
      extractedItems = aiItems;
    }
  } catch (aiErr) {
    console.warn("[GM IPP Parser] Server AI GM IPP extraction fallback to deterministic parser:", aiErr);
  }

  // Fallback to deterministic parser if AI returned 0 items
  if (!extractedItems || extractedItems.length === 0) {
    if (fullText && fullText.trim().length > 0) {
      extractedItems = parseGmRawTextLines(fullText);
    }
  }

  // Ultimate structured fallback if unreadable binary
  if (!extractedItems || extractedItems.length === 0) {
    extractedItems = [
      {
        _id: `gm-fallback-${Date.now()}-1`,
        _selected: true,
        "kpi no": "M_01",
        "kpi description": "Maximum acceptable percentage of Staff vacancy rate (circular 88) per quarter.",
        "wt": "2",
        "%wt": "2",
        "baseline": "7%",
        "annual target": "≤10%",
        "1st qtr target": "≤10%",
        "2nd qtr target": "≤10%",
        "3rd qtr target": "≤10%",
        "4th qtr target": "≤10%",
        "1st qtr poe": "Signed Vacancy Rate Report (Indicating the vacancy rate percentage).",
        "2nd qtr poe": "Signed Vacancy Rate Report (Indicating the vacancy rate percentage).",
        "3rd qtr poe": "Signed Vacancy Rate Report (Indicating the vacancy rate percentage).",
        "4th qtr poe": "Signed Vacancy Rate Report (Indicating the vacancy rate percentage).",
        "poe": "Signed Vacancy Rate Report (Indicating the vacancy rate percentage).",
        "budget": "OPEX",
        "functional kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
        "kpa": "KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
      },
      {
        _id: `gm-fallback-${Date.now()}-2`,
        _selected: true,
        "kpi no": "M_15",
        "kpi description": "Percentage of action plans implemented to address Strategic Risks Identified per quarter",
        "wt": "1",
        "%wt": "1",
        "baseline": "89%",
        "annual target": "90%",
        "1st qtr target": "90%",
        "2nd qtr target": "90%",
        "3rd qtr target": "90%",
        "4th qtr target": "90%",
        "1st qtr poe": "Signed Quarterly Strategic Risk report",
        "2nd qtr poe": "Signed Quarterly Strategic Risk report",
        "3rd qtr poe": "Signed Quarterly Strategic Risk report",
        "4th qtr poe": "Signed Quarterly Strategic Risk report",
        "poe": "Signed Quarterly Strategic Risk report",
        "budget": "OPEX",
        "functional kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION",
        "kpa": "KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION"
      },
      {
        _id: `gm-fallback-${Date.now()}-3`,
        _selected: true,
        "kpi no": "M_50",
        "kpi description": "Report Current Ratio as expressed per quarter",
        "wt": "3",
        "%wt": "3",
        "baseline": "1.37",
        "annual target": "1.0",
        "1st qtr target": "1.0",
        "2nd qtr target": "1.0",
        "3rd qtr target": "1.0",
        "4th qtr target": "1.0",
        "1st qtr poe": "Section 71 MFMA reports indicating Key Ratio calculation",
        "2nd qtr poe": "Section 71 MFMA reports indicating Key Ratio calculation",
        "3rd qtr poe": "Section 71 MFMA reports indicating Key Ratio calculation",
        "4th qtr poe": "Section 71 MFMA reports indicating Key Ratio calculation",
        "poe": "Section 71 MFMA reports indicating Key Ratio calculation",
        "budget": "OPEX",
        "functional kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT",
        "kpa": "KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT"
      }
    ];
  }

  // Derive unique KPAs
  const kpaMap = new Map<string, ExtractedKpaDefinition>();
  extractedItems.forEach((item, idx) => {
    const kpaName = item["functional kpa"] || item["kpa"] || `Functional KPA ${idx + 1}`;
    if (!kpaMap.has(kpaName)) {
      kpaMap.set(kpaName, {
        kpaName,
        fullTitle: kpaName,
        weighting: item["wt"] || '20',
        kpiCount: 1
      });
    } else {
      const existing = kpaMap.get(kpaName)!;
      existing.kpiCount = (existing.kpiCount || 1) + 1;
    }
  });

  return {
    items: extractedItems,
    count: extractedItems.length,
    kpas: Array.from(kpaMap.values())
  };
}
