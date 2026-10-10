import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  try {
    const version = (pdfjsLib as any).version || '3.11.174';
    (pdfjsLib as any).GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${version}/build/pdf.worker.min.mjs`;
  } catch (e) {
    console.warn("[Core Competencies Parser] PDF worker initialization:", e);
  }
}

/**
 * Strict Core Competencies schema extracting ONLY:
 * 1. competencies
 * 2. components
 * 3. compentency definition
 * 4. weighting
 */
export interface ExtractedCoreCompetency {
  id?: string;
  _id?: string;
  _selected?: boolean;
  competencies: string;
  components: string;
  "compentency definition": string;
  weighting: string;

  // Interoperability aliases
  competency?: string;
  definition?: string;
}

export interface CoreCompetenciesExtractionResponse {
  success: boolean;
  count: number;
  items: ExtractedCoreCompetency[];
  data: ExtractedCoreCompetency[];
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
    console.warn("[Core Competencies Parser] arrayBufferToBase64 error:", e);
    return "";
  }
}

/**
 * Extract raw text from a PDF file in browser
 */
export async function extractTextFromPdf(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    let fullText = '';
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ');
      fullText += `--- Page ${pageNum} ---\n${pageText}\n\n`;
    }
    return fullText;
  } catch (e) {
    console.warn("[Core Competencies Parser] PDF client extraction fallback:", e);
    return "";
  }
}

/**
 * Extract raw text from a Word document (.docx) in browser
 */
export async function extractTextFromDocx(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    return result.value || "";
  } catch (e) {
    console.warn("[Core Competencies Parser] Mammoth client extraction error:", e);
    return "";
  }
}

/**
 * Extract raw text from Excel (.xlsx, .xls) in browser
 */
export async function extractTextFromExcel(file: File): Promise<string> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let text = '';
    workbook.SheetNames.forEach(name => {
      const sheet = workbook.Sheets[name];
      text += `--- Sheet: ${name} ---\n` + XLSX.utils.sheet_to_txt(sheet) + '\n\n';
    });
    return text;
  } catch (e) {
    console.warn("[Core Competencies Parser] Excel client extraction error:", e);
    return "";
  }
}

/**
 * Calls Server Core Competencies Extraction Engine enforcing exact 4-field mapping
 */
export async function callServerCoreCompetenciesExtraction(params: {
  documentText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<ExtractedCoreCompetency[]> {
  const response = await fetch('/api/extract-core-competencies', {
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
      throw new Error(`Server Core Competencies extraction failed with status ${response.status}`);
    }
    throw new Error(`Server returned non-JSON response (${response.status}): ${rawText.slice(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Server extraction failed with status ${response.status}`);
  }

  if (data && data.success && Array.isArray(data.items)) {
    return data.items.map((it: any, idx: number) => {
      const competencyTitle = String(
        it.competencies ?? 
        it.competency ?? 
        it.Competency ?? 
        it.name ?? 
        `Core Competency ${idx + 1}`
      ).trim();

      const componentsVal = String(
        it.components ?? 
        it.Components ?? 
        ''
      ).trim();

      const definitionVal = String(
        it['compentency definition'] ?? 
        it['competency definition'] ?? 
        it.compentencyDefinition ?? 
        it.competencyDefinition ?? 
        it.definition ?? 
        it.Definition ?? 
        ''
      ).trim();

      const rawWeight = String(
        it.weighting ?? 
        it.Weighting ?? 
        it.weight ?? 
        '0'
      ).replace(/[^0-9.]/g, '').trim();

      return {
        id: it.id || `cc-item-${Date.now()}-${idx + 1}`,
        _id: it._id || `cc-item-${Date.now()}-${idx + 1}`,
        _selected: it._selected !== false,
        competencies: competencyTitle,
        components: componentsVal,
        "compentency definition": definitionVal,
        weighting: rawWeight || '0',
        competency: competencyTitle,
        definition: definitionVal
      };
    });
  }

  return [];
}

/**
 * Main entrance function to extract and map Core Competencies from any document
 */
export async function extractCoreCompetenciesFromDocument(file: File): Promise<CoreCompetenciesExtractionResponse> {
  const arrayBuffer = await file.arrayBuffer();
  const fileBase64 = arrayBufferToBase64(arrayBuffer);
  const fileName = file.name;
  const mimeType = file.type || 'application/octet-stream';

  let clientExtractedText = '';
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
    clientExtractedText = await extractTextFromDocx(file);
  } else if (lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls') || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    clientExtractedText = await extractTextFromExcel(file);
  } else if (lowerName.endsWith('.pdf') || mimeType.includes('pdf')) {
    clientExtractedText = await extractTextFromPdf(file);
  } else if (lowerName.endsWith('.txt')) {
    clientExtractedText = await file.text();
  }

  const items = await callServerCoreCompetenciesExtraction({
    documentText: clientExtractedText,
    fileBase64,
    mimeType,
    fileName
  });

  return {
    success: true,
    count: items.length,
    items,
    data: items,
    fileName
  };
}
