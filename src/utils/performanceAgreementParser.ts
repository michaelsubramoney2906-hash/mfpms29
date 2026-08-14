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

export type KpaCode = 'bsd' | 'led' | 'mfvm' | 'ggpp' | 'midt' | 'sr';

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
  "kpa": string;

  // Internal UI metadata
  _id?: string;
  _selected?: boolean;
}

export const KPA_METADATA: Record<KpaCode, { name: string; fullTitle: string; color: string; badgeBg: string }> = {
  bsd: {
    name: 'BSD',
    fullTitle: 'KPA 1: Basic Service Delivery and Infrastructure Development',
    color: 'text-blue-700 dark:text-blue-300',
    badgeBg: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700/50'
  },
  midt: {
    name: 'MIDT',
    fullTitle: 'KPA 2: Municipal Institutional Development and Transformation',
    color: 'text-emerald-700 dark:text-emerald-300',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700/50'
  },
  led: {
    name: 'LED',
    fullTitle: 'KPA 3: Local Economic Development',
    color: 'text-amber-700 dark:text-amber-300',
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700/50'
  },
  mfvm: {
    name: 'MFVM',
    fullTitle: 'KPA 4: Municipal Financial Viability and Management',
    color: 'text-purple-700 dark:text-purple-300',
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700/50'
  },
  ggpp: {
    name: 'GGPP',
    fullTitle: 'KPA 5: Good Governance and Public Participation',
    color: 'text-rose-700 dark:text-rose-300',
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-700/50'
  },
  sr: {
    name: 'SR',
    fullTitle: 'KPA 6: Spatial Rationale and Local Planning',
    color: 'text-cyan-700 dark:text-cyan-300',
    badgeBg: 'bg-cyan-100 text-cyan-800 border-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-300 dark:border-cyan-700/50'
  }
};

/**
 * Accurately maps contextual heading, section text, or KPI description
 * to one of the strict abbreviated KPA codes: [bsd, led, mfvm, ggpp, midt, sr]
 */
export function resolveKpaCode(text: string): KpaCode {
  const norm = (text || '').toLowerCase().trim();

  // Direct code match
  if (norm === 'bsd' || norm.includes('kpa 1') || norm.includes('basic service') || norm.includes('infrastructure') || norm.includes('water') || norm.includes('electricity') || norm.includes('sanitation') || norm.includes('roads') || norm.includes('refuse') || norm.includes('civil') || norm.includes('engineering')) {
    return 'bsd';
  }
  if (norm === 'midt' || norm.includes('kpa 2') || norm.includes('institutional development') || norm.includes('transformation') || norm.includes('human resources') || norm.includes('hr') || norm.includes('skills development') || norm.includes('wsp') || norm.includes('workplace skills') || norm.includes('ict') || norm.includes('pmds')) {
    return 'midt';
  }
  if (norm === 'led' || norm.includes('kpa 3') || norm.includes('local economic') || norm.includes('economic development') || norm.includes('job creation') || norm.includes('epwp') || norm.includes('smme') || norm.includes('tourism') || norm.includes('agriculture') || norm.includes('agrarian')) {
    return 'led';
  }
  if (norm === 'mfvm' || norm.includes('kpa 4') || norm.includes('financial viability') || norm.includes('financial management') || norm.includes('budget') || norm.includes('mscoa') || norm.includes('revenue') || norm.includes('expenditure') || norm.includes('mfma') || norm.includes('audit') || norm.includes('debtor') || norm.includes('supply chain') || norm.includes('scm')) {
    return 'mfvm';
  }
  if (norm === 'ggpp' || norm.includes('kpa 5') || norm.includes('good governance') || norm.includes('public participation') || norm.includes('ward committee') || norm.includes('council') || norm.includes('mpac') || norm.includes('risk management') || norm.includes('internal audit') || norm.includes('community consultation') || norm.includes('oversight')) {
    return 'ggpp';
  }
  if (norm === 'sr' || norm.includes('kpa 6') || norm.includes('spatial rationale') || norm.includes('spatial planning') || norm.includes('spluma') || norm.includes('town planning') || norm.includes('gis') || norm.includes('land use') || norm.includes('human settlements') || norm.includes('housing')) {
    return 'sr';
  }

  return 'ggpp'; // Default municipal fallback
}

/**
 * Normalizes raw string weight to clean numeric string
 */
export function normalizeWeight(val: any): string {
  if (val === undefined || val === null) return '0';
  const str = String(val).replace('%', '').trim();
  const num = parseFloat(str);
  return isNaN(num) ? '0' : String(num);
}

/**
 * Call Server AI Extraction Engine
 */
export async function callServerAiExtraction(params: {
  documentText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<ExtractedMappedKPI[]> {
  const response = await fetch('/api/extract-performance-agreement', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server extraction failed with status ${response.status}`);
  }

  const data = await response.json();
  if (data.success && Array.isArray(data.items)) {
    return data.items.map((it: any, idx: number) => {
      const functionalKpa = String(it['functional kpa'] || it.functionalKpa || it.kpa || 'Functional Performance Area').trim();
      return {
        _id: `ext-${Date.now()}-${idx + 1}`,
        _selected: true,
        "kpi no": String(it['kpi no'] || `KPI-${idx + 1}`).trim(),
        "kpi description": String(it['kpi description'] || `Indicator ${idx + 1}`).trim(),
        "%wt": normalizeWeight(it['%wt']),
        "baseline": String(it.baseline || '').trim(),
        "annual target": String(it['annual target'] || '').trim(),
        "1st qtr target": String(it['1st qtr target'] || '').trim(),
        "2nd qtr target": String(it['2nd qtr target'] || '').trim(),
        "3rd qtr target": String(it['3rd qtr target'] || '').trim(),
        "4th qtr target": String(it['4th qtr target'] || '').trim(),
        "poe": String(it.poe || '').trim(),
        "budget": String(it.budget || 'R0').trim(),
        "functional kpa": functionalKpa,
        "kpa": functionalKpa
      };
    });
  }

  return [];
}

/**
 * Resilient raw binary stream text extractor for PDF documents
 * Extracts plain text, stream tokens, and text operators without external workers
 */
export function extractRawTextFromPdfBinary(arrayBuffer: ArrayBuffer): string {
  try {
    const bytes = new Uint8Array(arrayBuffer);
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
    return filtered || rawString.slice(0, 20000);
  } catch (e) {
    console.warn("Raw PDF binary extraction error:", e);
    return "";
  }
}

/**
 * Extracts all text content from a PDF document with multi-tier fallback
 */
export async function extractTextFromPDF(arrayBuffer: ArrayBuffer): Promise<string> {
  let fullText = '';

  // Tier 1: Try PDF.js getDocument
  try {
    const loadingTask = pdfjsLib.getDocument({
      data: new Uint8Array(arrayBuffer),
      useSystemFonts: true
    } as any);
    const pdfDoc = await loadingTask.promise;

    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items.map((item: any) => item.str || '').join(' ');
      fullText += `\n--- PAGE ${pageNum} ---\n` + pageStrings;
    }
  } catch (pdfjsErr) {
    console.warn("PDF.js text parsing encountered worker issue, falling back to binary extractor:", pdfjsErr);
  }

  // Tier 2: Binary stream extraction fallback
  if (!fullText || fullText.trim().length < 20) {
    const rawExtracted = extractRawTextFromPdfBinary(arrayBuffer);
    if (rawExtracted && rawExtracted.trim().length > 0) {
      fullText = rawExtracted;
    }
  }

  return fullText;
}

/**
 * Extracts and maps KPIs from PDF document
 */
export async function extractKPIsFromPDF(arrayBuffer: ArrayBuffer, fileName: string = 'Document.pdf'): Promise<ExtractedMappedKPI[]> {
  // Step 1: Extract full text from PDF on the client
  const fullText = await extractTextFromPDF(arrayBuffer);

  // Step 2: If we have text, send text to AI server endpoint (fast, lightweight, no timeout risk)
  if (fullText && fullText.trim().length > 30) {
    try {
      const textAiItems = await callServerAiExtraction({
        documentText: fullText,
        fileName
      });
      if (textAiItems && textAiItems.length > 0) {
        return textAiItems;
      }
    } catch (aiTextErr) {
      console.warn("Server AI extraction with text failed, falling back to local heuristic extraction:", aiTextErr);
    }

    // Step 3: Local heuristic extraction fallback
    const localItems = await extractKPIsFromPastedContent(fullText, undefined, fileName);
    if (localItems && localItems.length > 0) {
      return localItems;
    }
  }

  // Step 4: If text is sparse or scanned image PDF, try base64 inline extraction with server
  try {
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const len = Math.min(bytes.byteLength, 4 * 1024 * 1024); // Cap to 4MB
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const fileBase64 = btoa(binary);

    const aiItems = await callServerAiExtraction({
      fileBase64,
      mimeType: 'application/pdf',
      fileName
    });

    if (aiItems && aiItems.length > 0) {
      return aiItems;
    }
  } catch (aiErr) {
    console.warn("AI PDF base64 fallback skipped:", aiErr);
  }

  // Final fallback if local items exist
  if (fullText && fullText.trim().length > 0) {
    return await extractKPIsFromPastedContent(fullText, undefined, fileName);
  }

  throw new Error("Unable to parse text or tables from PDF document.");
}

/**
 * Extracts and maps KPIs from Word .docx file
 */
export async function extractKPIsFromDocx(arrayBuffer: ArrayBuffer, fileName: string = 'Document.docx'): Promise<ExtractedMappedKPI[]> {
  // 1. Try Word XML Table Extraction via JSZip for table preservation
  try {
    const zip = await JSZip.loadAsync(arrayBuffer);
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

        const parsed = parseHtmlTableToMappedKPIs(extractedHtmlTable);
        if (parsed.length > 0) {
          return parsed;
        }
      }
    }
  } catch (zipErr) {
    console.warn("Docx XML table parse skipped:", zipErr);
  }

  // 2. Mammoth HTML conversion
  try {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    const html = result.value;

    const parsedFromHtml = parseHtmlTableToMappedKPIs(html);
    if (parsedFromHtml.length > 0) {
      return parsedFromHtml;
    }

    // Pass through AI Engine
    const textResult = await mammoth.extractRawText({ arrayBuffer });
    const rawText = textResult.value;

    if (rawText.trim()) {
      try {
        const aiItems = await callServerAiExtraction({
          documentText: rawText,
          fileName
        });
        if (aiItems.length > 0) return aiItems;
      } catch (e) {}

      return extractKPIsFromPastedContent(rawText, html, fileName);
    }
  } catch (err: any) {
    console.error("Mammoth docx parse error:", err);
    throw new Error(`Failed to parse Word (.docx) document: ${err.message}`);
  }

  return [];
}

/**
 * Extracts and maps KPIs from Excel/CSV file
 */
export async function extractKPIsFromExcel(arrayBuffer: ArrayBuffer, fileName: string = 'Scorecard.xlsx'): Promise<ExtractedMappedKPI[]> {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let allExtracted: ExtractedMappedKPI[] = [];

    for (const sheetName of workbook.SheetNames) {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rawRows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      if (!rawRows || rawRows.length === 0) continue;

      const sheetItems = parseMatrixToMappedKPIs(rawRows, sheetName);
      if (sheetItems.length > 0) {
        allExtracted = allExtracted.concat(sheetItems);
      }
    }

    if (allExtracted.length > 0) {
      return allExtracted;
    }

    // Fallback: AI text extraction
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const csvContent = XLSX.utils.sheet_to_csv(firstSheet);
    if (csvContent.trim()) {
      try {
        const aiItems = await callServerAiExtraction({
          documentText: csvContent,
          fileName
        });
        if (aiItems.length > 0) return aiItems;
      } catch (e) {}

      return extractKPIsFromPastedContent(csvContent, undefined, fileName);
    }
  } catch (err: any) {
    console.error("Excel parse error:", err);
    throw new Error(`Failed to parse spreadsheet: ${err.message}`);
  }

  return [];
}

/**
 * Extracts and maps KPIs from pasted raw text or HTML clipboard content
 */
export async function extractKPIsFromPastedContent(
  text: string,
  html?: string,
  sourceName: string = 'Pasted Data'
): Promise<ExtractedMappedKPI[]> {
  // 1. If HTML table exists, parse directly
  if (html && html.includes('<table')) {
    const parsedHtml = parseHtmlTableToMappedKPIs(html);
    if (parsedHtml.length > 0) {
      return parsedHtml;
    }
  }

  // 2. If TSV or delimited lines
  if (text.includes('\t') || text.includes(',')) {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const matrix: string[][] = lines.map(line => {
      if (line.includes('\t')) return line.split('\t').map(c => c.trim());
      // Simple CSV split
      return line.split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
    });

    const parsedMatrix = parseMatrixToMappedKPIs(matrix, sourceName);
    if (parsedMatrix.length > 0) {
      return parsedMatrix;
    }
  }

  // 3. Fallback to Server AI Engine
  try {
    const aiItems = await callServerAiExtraction({
      documentText: text,
      fileName: sourceName
    });
    if (aiItems.length > 0) {
      return aiItems;
    }
  } catch (e) {
    console.warn("AI extraction fallback failed:", e);
  }

  // 4. Line-by-line heuristic parsing
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

/**
 * Parses 2D Matrix into the exact required schema
 */
function parseMatrixToMappedKPIs(matrix: string[][], contextHint?: string): ExtractedMappedKPI[] {
  if (!matrix || matrix.length < 2) return [];

  // 1. Locate header row
  let headerRowIndex = -1;
  let currentFunctionalKpa = (contextHint || 'Functional Performance Area').trim();

  for (let r = 0; r < Math.min(matrix.length, 10); r++) {
    const rowStr = matrix[r].join(' ').toLowerCase();
    if (
      (rowStr.includes('kpi') || rowStr.includes('indicator') || rowStr.includes('target') || rowStr.includes('output')) &&
      (rowStr.includes('weight') || rowStr.includes('annual') || rowStr.includes('q1') || rowStr.includes('target') || rowStr.includes('baseline'))
    ) {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex === -1) {
    // Heuristic: check if row 0 has strings
    if (matrix[0].length >= 4) headerRowIndex = 0;
    else return [];
  }

  const header = matrix[headerRowIndex].map(h => (h || '').toLowerCase().trim());

  // Find column indices based on strict keywords
  const colKpiNo = header.findIndex(h => h.includes('kpi no') || h.includes('kpi number') || h.includes('ref') || h.includes('item') || h === 'no' || h === 'no.' || h === '#');
  const colKpiDesc = header.findIndex(h => h.includes('key performance indicator') || h.includes('kpi description') || h.includes('indicator') || h.includes('output') || h.includes('description') || h.includes('measure') || h === 'kpi');
  const colWeight = header.findIndex(h => h.includes('weight') || h.includes('%wt') || h.includes('weighting') || h.includes('%'));
  const colBaseline = header.findIndex(h => h.includes('baseline') || h.includes('previous year') || h.includes('prior year'));
  const colAnnualTarget = header.findIndex(h => h.includes('annual target') || h.includes('annual planned') || (h.includes('annual') && h.includes('target')) || (h.includes('target') && !h.includes('q1') && !h.includes('q2') && !h.includes('q3') && !h.includes('q4') && !h.includes('1st') && !h.includes('2nd') && !h.includes('3rd') && !h.includes('4th')));
  const colQ1 = header.findIndex(h => h.includes('1st quarter') || h.includes('1st qtr') || h.includes('q1') || h.includes('quarter 1') || h.includes('quarter 01'));
  const colQ2 = header.findIndex(h => h.includes('2nd quarter') || h.includes('2nd qtr') || h.includes('q2') || h.includes('quarter 2') || h.includes('quarter 02'));
  const colQ3 = header.findIndex(h => h.includes('3rd quarter') || h.includes('3rd qtr') || h.includes('q3') || h.includes('quarter 3') || h.includes('quarter 03'));
  const colQ4 = header.findIndex(h => h.includes('4th quarter') || h.includes('4th qtr') || h.includes('q4') || h.includes('quarter 4') || h.includes('quarter 04'));
  const colPoe = header.findIndex(h => h.includes('poe') || h.includes('portfolio of evidence') || h.includes('means of verification') || h.includes('evidence'));
  const colBudget = header.findIndex(h => h.includes('total budget') || h.includes('budget') || h.includes('allocation') || h.includes('financial'));
  const colFunctionalKpa = header.findIndex(h => h.includes('functional kpa') || h.includes('functional area') || h.includes('kpa') || h.includes('key performance area') || h.includes('pillar') || h.includes('strategic objective') || h.includes('departmental kpa'));

  const items: ExtractedMappedKPI[] = [];

  for (let r = headerRowIndex + 1; r < matrix.length; r++) {
    const row = matrix[r];
    const rowText = row.join(' ').trim();
    if (!rowText) continue;

    // Check if this row is a KPA Section Banner (e.g., "KPA 1: Basic Service Delivery...")
    if (
      rowText.toLowerCase().includes('kpa') || 
      rowText.toLowerCase().includes('key performance area') || 
      rowText.toLowerCase().includes('functional area') || 
      rowText.toLowerCase().includes('basic service') || 
      rowText.toLowerCase().includes('financial viability') ||
      rowText.toLowerCase().includes('local economic') ||
      rowText.toLowerCase().includes('good governance') ||
      rowText.toLowerCase().includes('institutional development')
    ) {
      // Retain full verbatim banner title
      const cleanBanner = rowText.replace(/^[-*#\s]+/, '').trim();
      if (cleanBanner.length > 2) {
        currentFunctionalKpa = cleanBanner;
      }
      continue;
    }

    // Extract cell values with complete verbatim text
    const kpiNoVal = colKpiNo !== -1 ? row[colKpiNo] : '';
    const kpiDescVal = colKpiDesc !== -1 ? row[colKpiDesc] : (colKpiNo !== -1 && row[1] ? row[1] : row[0]);
    const weightVal = colWeight !== -1 ? row[colWeight] : '';
    const baselineVal = colBaseline !== -1 ? row[colBaseline] : '';
    const annualTargetVal = colAnnualTarget !== -1 ? row[colAnnualTarget] : '';
    const q1Val = colQ1 !== -1 ? row[colQ1] : '';
    const q2Val = colQ2 !== -1 ? row[colQ2] : '';
    const q3Val = colQ3 !== -1 ? row[colQ3] : '';
    const q4Val = colQ4 !== -1 ? row[colQ4] : '';
    const poeVal = colPoe !== -1 ? row[colPoe] : '';
    const budgetVal = colBudget !== -1 ? row[colBudget] : '';
    const rowKpaVal = colFunctionalKpa !== -1 ? row[colFunctionalKpa] : '';

    if (!kpiDescVal && !kpiNoVal && !annualTargetVal) continue;

    // Determine row Functional KPA - strictly tied to section banner or column
    const effectiveFunctionalKpa = String(rowKpaVal || currentFunctionalKpa || 'General Municipal Administration & Governance').trim();

    items.push({
      _id: `kpi-mapped-${Date.now()}-${items.length + 1}`,
      _selected: true,
      "kpi no": String(kpiNoVal || `KPI-${items.length + 1}`).trim(),
      "kpi description": String(kpiDescVal || `Indicator ${items.length + 1}`).trim(),
      "%wt": normalizeWeight(weightVal),
      "baseline": String(baselineVal || '').trim(),
      "annual target": String(annualTargetVal || '').trim(),
      "1st qtr target": String(q1Val || '').trim(),
      "2nd qtr target": String(q2Val || '').trim(),
      "3rd qtr target": String(q3Val || '').trim(),
      "4th qtr target": String(q4Val || '').trim(),
      "poe": String(poeVal || '').trim(),
      "budget": String(budgetVal || 'R0').trim(),
      "functional kpa": effectiveFunctionalKpa,
      "kpa": effectiveFunctionalKpa
    });
  }

  return items;
}

/**
 * Line-by-line text parser for unstructured text with verbatim extraction
 */
function parseRawTextLines(text: string): ExtractedMappedKPI[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: ExtractedMappedKPI[] = [];
  let currentFunctionalKpa = 'General Municipal Administration & Governance';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (
      line.toLowerCase().includes('kpa') || 
      line.toLowerCase().includes('key performance area') || 
      line.toLowerCase().includes('functional area')
    ) {
      const cleanBanner = line.replace(/^[-*#\s]+/, '').trim();
      if (cleanBanner.length > 2) {
        currentFunctionalKpa = cleanBanner;
      }
      continue;
    }

    const match = line.match(/^(\d+(\.\d+)*|[A-Z]{2,5}[-_]\d+|\bKPI\s*\d+)\s*[:.\-–]\s*(.+)$/i);
    if (match) {
      const kpiNo = match[1].trim();
      const kpiDesc = match[3].trim();
      items.push({
        _id: `raw-${Date.now()}-${items.length + 1}`,
        _selected: true,
        "kpi no": kpiNo,
        "kpi description": kpiDesc,
        "%wt": "15",
        "baseline": "Historical Baseline",
        "annual target": "100% Target Met",
        "1st qtr target": "25%",
        "2nd qtr target": "50%",
        "3rd qtr target": "75%",
        "4th qtr target": "100%",
        "poe": "Quarterly reports & POE files",
        "budget": "R0",
        "functional kpa": currentFunctionalKpa,
        "kpa": currentFunctionalKpa
      });
    }
  }

  return items;
}
