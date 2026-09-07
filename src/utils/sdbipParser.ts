import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { extractTextFromPDF, arrayBufferToBase64 } from './performanceAgreementParser';

export interface ExtractedSdbipItem {
  _id: string;
  _selected?: boolean;
  refNum: string;
  strategicObj: string;
  kpas: string;
  operationalActivity: string;
  kpi: string;
  compliance: 'compliant' | 'non-compliant' | 'at risk';
  uom: string;
  mscoaTracking: string;
  baseline: string;
  annualTarget: string;
  budgetAllocation: string;
  q1: string;
  q2: string;
  midTerm?: string;
  q3: string;
  q4: string;
  responsibleUnit: string;
  submitter?: string;
  reviewer?: string;
  approver?: string;
  internalAudit?: string;
  poeStatus?: string;
  // Reporting fields
  q1Actual?: string;
  q1Variance?: string;
  q1Corrective?: string;
  q1Expenditure?: string;
  q1PoeDesc?: string;
  q2Actual?: string;
  q2Variance?: string;
  q2Corrective?: string;
  q2Expenditure?: string;
  q2PoeDesc?: string;
  midTermActual?: string;
  midTermVariance?: string;
  midTermCorrective?: string;
  midTermExpenditure?: string;
  midTermPoeDesc?: string;
  q3Actual?: string;
  q3Variance?: string;
  q3Corrective?: string;
  q3Expenditure?: string;
  q3PoeDesc?: string;
  q4Actual?: string;
  q4Variance?: string;
  q4Corrective?: string;
  q4Expenditure?: string;
  q4PoeDesc?: string;
}

export const SDBIP_KPA_OPTIONS = [
  'KPA 1: Institutional Development and Transformation (MIDT)',
  'KPA 2: Good Governance and Public Participation (GGPP)',
  'KPA 3: Local Economic Development (LED)',
  'KPA 4: Municipal Financial Viability and Management (MFVM)',
  'KPA 5: Basic Service Delivery and Infrastructure Development (BSD)',
  'KPA 6: Spatial Rationale and Municipal Planning (SR)'
];

export const SDBIP_DIRECTORATE_OPTIONS = [
  'Infrastructure Development & Technical Services',
  'Corporate Services & Administration',
  'Financial Services & Budget Office',
  'Social Services & Community Development',
  'Planning & Economic Development',
  'Office of the Municipal Manager / Strategic Executive'
];

/**
 * Normalizes KPA text to one of the 6 standard SA Local Government KPAs
 */
export function resolveSdbipKpa(raw: string): string {
  const norm = (raw || '').toLowerCase();
  if (norm.includes('service') || norm.includes('infrastructure') || norm.includes('bsd') || norm.includes('water') || norm.includes('sanitation') || norm.includes('electricity') || norm.includes('roads')) {
    return 'KPA 5: Basic Service Delivery and Infrastructure Development (BSD)';
  }
  if (norm.includes('economic') || norm.includes('led') || norm.includes('tourism') || norm.includes('smme') || norm.includes('job creation')) {
    return 'KPA 3: Local Economic Development (LED)';
  }
  if (norm.includes('financial') || norm.includes('viability') || norm.includes('mfvm') || norm.includes('budget') || norm.includes('revenue') || norm.includes('audit')) {
    return 'KPA 4: Municipal Financial Viability and Management (MFVM)';
  }
  if (norm.includes('governance') || norm.includes('public participation') || norm.includes('ggpp') || norm.includes('ward') || norm.includes('council')) {
    return 'KPA 2: Good Governance and Public Participation (GGPP)';
  }
  if (norm.includes('institutional') || norm.includes('transformation') || norm.includes('midt') || norm.includes('skills') || norm.includes('hr') || norm.includes('human resources')) {
    return 'KPA 1: Institutional Development and Transformation (MIDT)';
  }
  if (norm.includes('spatial') || norm.includes('rationale') || norm.includes('planning') || norm.includes('sr') || norm.includes('town planning') || norm.includes('land use')) {
    return 'KPA 6: Spatial Rationale and Municipal Planning (SR)';
  }
  return raw || 'KPA 5: Basic Service Delivery and Infrastructure Development (BSD)';
}

/**
 * Call Server AI SDBIP Extraction Engine
 */
export async function callServerAiSDBIPExtraction(params: {
  documentText?: string;
  fileBase64?: string;
  mimeType?: string;
  fileName?: string;
}): Promise<ExtractedSdbipItem[]> {
  const response = await fetch('/api/extract-sdbip', {
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
      throw new Error(`Server SDBIP extraction failed with status ${response.status}`);
    }
    throw new Error(`Server returned non-JSON response (${response.status}): ${rawText.slice(0, 100)}`);
  }

  if (!response.ok) {
    throw new Error(data?.error || `Server SDBIP extraction failed with status ${response.status}`);
  }

  if (data && data.success && Array.isArray(data.items)) {
    return data.items.map((it: any, idx: number) => {
      const kpa = resolveSdbipKpa(it.kpas || it.kpa || it.nationalKpa || it.functionalKpa || '');
      return {
        _id: `sdbip-ext-${Date.now()}-${idx + 1}`,
        _selected: true,
        refNum: String(it.refNum || it.refNo || it.kpiNo || `TL-${String(idx + 1).padStart(2, '0')}`).trim(),
        strategicObj: String(it.strategicObj || it.strategicObjective || it.goal || 'To ensure sustainable service delivery and clean audit compliance').trim(),
        kpas: kpa,
        operationalActivity: String(it.operationalActivity || it.project || it.activity || it.kpi || '').trim(),
        kpi: String(it.kpi || it.kpiDescription || it.indicator || '').trim(),
        compliance: (it.compliance === 'compliant' || it.compliance === 'non-compliant' || it.compliance === 'at risk') ? it.compliance : 'compliant',
        uom: String(it.uom || it.unitOfMeasure || it.unit || 'Number').trim(),
        mscoaTracking: String(it.mscoaTracking || it.mscoaCode || it.projectCode || 'Operational').trim(),
        baseline: String(it.baseline ?? '').trim(),
        annualTarget: String(it.annualTarget ?? '').trim(),
        budgetAllocation: String(it.budgetAllocation || it.budget || 'Operational Budget').trim(),
        q1: String(it.q1 ?? it.q1Target ?? '').trim(),
        q2: String(it.q2 ?? it.q2Target ?? '').trim(),
        midTerm: String(it.midTerm || it.midTermTarget || '').trim(),
        q3: String(it.q3 ?? it.q3Target ?? '').trim(),
        q4: String(it.q4 ?? it.q4Target ?? '').trim(),
        responsibleUnit: String(it.responsibleUnit || it.department || it.directorate || 'Technical Services').trim(),
        submitter: String(it.submitter || it.responsibleOwner || '').trim(),
        reviewer: String(it.reviewer || '').trim(),
        approver: String(it.approver || '').trim(),
        internalAudit: String(it.internalAudit || '').trim(),
        poeStatus: it.poeStatus || 'Pending Evidence',
        // Reporting fields
        q1Actual: String(it.q1Actual || '').trim(),
        q1Variance: String(it.q1Variance || '').trim(),
        q1Corrective: String(it.q1Corrective || '').trim(),
        q1Expenditure: String(it.q1Expenditure || '').trim(),
        q1PoeDesc: String(it.q1PoeDesc || it.poe || '').trim(),
        q2Actual: String(it.q2Actual || '').trim(),
        q2Variance: String(it.q2Variance || '').trim(),
        q2Corrective: String(it.q2Corrective || '').trim(),
        q2Expenditure: String(it.q2Expenditure || '').trim(),
        q2PoeDesc: String(it.q2PoeDesc || '').trim(),
        midTermActual: String(it.midTermActual || '').trim(),
        midTermVariance: String(it.midTermVariance || '').trim(),
        midTermCorrective: String(it.midTermCorrective || '').trim(),
        midTermExpenditure: String(it.midTermExpenditure || '').trim(),
        midTermPoeDesc: String(it.midTermPoeDesc || '').trim(),
        q3Actual: String(it.q3Actual || '').trim(),
        q3Variance: String(it.q3Variance || '').trim(),
        q3Corrective: String(it.q3Corrective || '').trim(),
        q3Expenditure: String(it.q3Expenditure || '').trim(),
        q3PoeDesc: String(it.q3PoeDesc || '').trim(),
        q4Actual: String(it.q4Actual || '').trim(),
        q4Variance: String(it.q4Variance || '').trim(),
        q4Corrective: String(it.q4Corrective || '').trim(),
        q4Expenditure: String(it.q4Expenditure || '').trim(),
        q4PoeDesc: String(it.q4PoeDesc || '').trim(),
      };
    });
  }

  return [];
}

/**
 * Extract SDBIP from Excel (.xlsx, .xls, .csv)
 */
export async function extractSDBIPFromExcel(arrayBuffer: ArrayBuffer, fileName: string): Promise<ExtractedSdbipItem[]> {
  try {
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    let textDump = '';
    const allRows: any[] = [];

    workbook.SheetNames.forEach(sheetName => {
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) return;
      const jsonData: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
      if (jsonData.length > 0) {
        textDump += `\n--- SHEET: ${sheetName} ---\n`;
        jsonData.forEach(row => {
          if (Array.isArray(row) && row.some(c => c !== null && c !== undefined && String(c).trim() !== '')) {
            textDump += row.map(c => String(c ?? '').trim()).join('\t') + '\n';
          }
        });
      }
    });

    // Try Server AI Extraction first for accuracy
    try {
      const items = await callServerAiSDBIPExtraction({
        documentText: textDump,
        fileName
      });
      if (items && items.length > 0) return items;
    } catch (aiErr) {
      console.warn("Server AI SDBIP extraction error on Excel, using local matrix parser:", aiErr);
    }

    // Heuristic Fallback on sheet matrix
    return parseSdbipTableFromText(textDump);
  } catch (err: any) {
    console.error("Excel SDBIP parsing error:", err);
    throw new Error(`Failed to parse SDBIP Excel document: ${err.message}`);
  }
}

/**
 * Extract SDBIP from Word (.docx)
 */
export async function extractSDBIPFromDocx(arrayBuffer: ArrayBuffer, fileName: string): Promise<ExtractedSdbipItem[]> {
  try {
    const htmlResult = await mammoth.convertToHtml({ arrayBuffer });
    const textResult = await mammoth.extractRawText({ arrayBuffer });

    try {
      const items = await callServerAiSDBIPExtraction({
        documentText: textResult.value || htmlResult.value,
        fileName
      });
      if (items && items.length > 0) return items;
    } catch (aiErr) {
      console.warn("Server AI SDBIP extraction error on Word docx, using heuristic fallback:", aiErr);
    }

    return parseSdbipTableFromText(textResult.value || htmlResult.value);
  } catch (err: any) {
    console.error("Word SDBIP extraction error:", err);
    throw new Error(`Failed to extract SDBIP from Word document: ${err.message}`);
  }
}

/**
 * Extract SDBIP from PDF
 */
export async function extractSDBIPFromPDF(arrayBuffer: ArrayBuffer, fileName: string): Promise<ExtractedSdbipItem[]> {
  try {
    // Step 1: Safely encode base64 from a buffer clone
    const fileBase64 = arrayBufferToBase64(arrayBuffer.slice(0));

    // Step 2: Extract text from PDF using PDF.js & binary fallback
    let pdfText = '';
    try {
      pdfText = await extractTextFromPDF(arrayBuffer.slice(0));
    } catch (textErr) {
      console.warn("Client PDF text extraction warning:", textErr);
    }

    // Step 3: Try Server AI Multimodal Extraction
    try {
      const items = await callServerAiSDBIPExtraction({
        fileBase64: fileBase64 || undefined,
        documentText: pdfText || undefined,
        mimeType: 'application/pdf',
        fileName
      });
      if (items && items.length > 0) {
        return items;
      }
    } catch (aiErr: any) {
      console.warn("Server AI SDBIP extraction encountered error, engaging local deterministic fallback:", aiErr.message || aiErr);
    }

    // Step 4: Fallback to local heuristic table parser if AI didn't return items
    if (pdfText && pdfText.trim().length > 0) {
      const fallbackItems = parseSdbipTableFromText(pdfText);
      if (fallbackItems && fallbackItems.length > 0) {
        return fallbackItems;
      }
    }

    throw new Error(`No SDBIP scorecard indicators found in "${fileName}". Please ensure the PDF contains tabular SDBIP data.`);
  } catch (err: any) {
    console.error("PDF SDBIP extraction error:", err);
    throw new Error(`Failed to extract SDBIP from PDF document: ${err.message}`);
  }
}

/**
 * Extract SDBIP from Pasted Content (HTML table or TSV/CSV text)
 */
export async function extractSDBIPFromPastedContent(text: string, html?: string, fileName?: string): Promise<ExtractedSdbipItem[]> {
  try {
    const content = html || text;
    try {
      const items = await callServerAiSDBIPExtraction({
        documentText: content,
        fileName: fileName || 'Pasted SDBIP Content'
      });
      if (items && items.length > 0) return items;
    } catch (aiErr) {
      console.warn("AI extraction for pasted SDBIP failed, using local table parser:", aiErr);
    }

    return parseSdbipTableFromText(text);
  } catch (err: any) {
    console.error("Paste SDBIP extraction error:", err);
    throw new Error(`Failed to parse pasted SDBIP table: ${err.message}`);
  }
}

/**
 * Deterministic local heuristic parser for SDBIP Top Layer & Reporting Table
 */
export function parseSdbipTableFromText(rawText: string): ExtractedSdbipItem[] {
  const lines = (rawText || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const items: ExtractedSdbipItem[] = [];

  let headerIndex = -1;
  let headers: string[] = [];
  let currentKpa = 'KPA 5: Basic Service Delivery and Infrastructure Development (BSD)';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lower = line.toLowerCase();

    // Check for KPA section banners
    if (lower.includes('kpa 1') || lower.includes('kpa 2') || lower.includes('kpa 3') || lower.includes('kpa 4') || lower.includes('kpa 5') || lower.includes('kpa 6') || lower.includes('basic service') || lower.includes('local economic') || lower.includes('financial viability') || lower.includes('good governance') || lower.includes('institutional development') || lower.includes('spatial rationale')) {
      currentKpa = resolveSdbipKpa(line);
      continue;
    }

    const cells = (line.includes('\t') ? line.split('\t') : line.includes('|') ? line.split('|') : line.split(/,{2,}/)).map(c => c.trim());
    if (cells.length < 3) continue;

    // Detect header row
    if (cells.some(c => {
      const cl = c.toLowerCase();
      return cl.includes('kpi') || cl.includes('ref') || cl.includes('indicator') || cl.includes('annual target');
    }) && headerIndex === -1) {
      headerIndex = i;
      headers = cells.map(c => c.toLowerCase());
      continue;
    }

    // Skip if this is a header repetition
    if (cells[0].toLowerCase().includes('ref') || cells[0].toLowerCase().includes('kpi no') || cells[0].toLowerCase().includes('kpi number')) {
      continue;
    }

    // Map columns
    let refNum = '';
    let strategicObj = '';
    let operationalActivity = '';
    let kpi = '';
    let uom = 'Number';
    let mscoaTracking = 'Operational';
    let baseline = '';
    let annualTarget = '';
    let budgetAllocation = 'Operational Budget';
    let q1 = '';
    let q2 = '';
    let midTerm = '';
    let q3 = '';
    let q4 = '';
    let responsibleUnit = 'Technical Services';
    let q1Actual = '';
    let q1Variance = '';
    let q1Corrective = '';
    let q1Expenditure = '';
    let q1PoeDesc = '';
    let q2Actual = '';
    let q2Variance = '';
    let q2Corrective = '';
    let q2Expenditure = '';
    let q2PoeDesc = '';

    if (headers.length > 0) {
      cells.forEach((cellVal, colIdx) => {
        const h = headers[colIdx] || '';
        if (h.includes('ref') || h.includes('kpi no') || h.includes('number')) refNum = cellVal;
        else if (h.includes('strategic') || h.includes('objective')) strategicObj = cellVal;
        else if (h.includes('activity') || h.includes('project')) operationalActivity = cellVal;
        else if (h.includes('kpi') || h.includes('indicator') || h.includes('description')) kpi = cellVal;
        else if (h.includes('uom') || h.includes('unit of measure') || h.includes('measurement')) uom = cellVal;
        else if (h.includes('mscoa') || h.includes('tracking')) mscoaTracking = cellVal;
        else if (h.includes('baseline')) baseline = cellVal;
        else if (h.includes('annual') || h.includes('yearly target')) annualTarget = cellVal;
        else if (h.includes('budget') || h.includes('allocation') || h.includes('vote')) budgetAllocation = cellVal;
        else if (h.includes('q1 target') || h.includes('1st quarter') || h === 'q1') q1 = cellVal;
        else if (h.includes('q2 target') || h.includes('2nd quarter') || h === 'q2') q2 = cellVal;
        else if (h.includes('mid') || h.includes('mid-term') || h.includes('mid term')) midTerm = cellVal;
        else if (h.includes('q3 target') || h.includes('3rd quarter') || h === 'q3') q3 = cellVal;
        else if (h.includes('q4 target') || h.includes('4th quarter') || h === 'q4') q4 = cellVal;
        else if (h.includes('unit') || h.includes('department') || h.includes('directorate') || h.includes('responsible')) responsibleUnit = cellVal;
        else if (h.includes('q1 actual')) q1Actual = cellVal;
        else if (h.includes('q1 variance')) q1Variance = cellVal;
        else if (h.includes('q1 corrective')) q1Corrective = cellVal;
        else if (h.includes('q1 exp')) q1Expenditure = cellVal;
        else if (h.includes('q1 poe')) q1PoeDesc = cellVal;
        else if (h.includes('q2 actual')) q2Actual = cellVal;
        else if (h.includes('q2 variance')) q2Variance = cellVal;
        else if (h.includes('q2 corrective')) q2Corrective = cellVal;
        else if (h.includes('q2 exp')) q2Expenditure = cellVal;
        else if (h.includes('q2 poe')) q2PoeDesc = cellVal;
      });
    } else {
      // Positional fallback
      refNum = cells[0] || `TL-${items.length + 1}`;
      kpi = cells[1] || '';
      if (cells.length >= 10) {
        baseline = cells[2] || '';
        annualTarget = cells[3] || '';
        q1 = cells[4] || '';
        q2 = cells[5] || '';
        q3 = cells[6] || '';
        q4 = cells[7] || '';
        budgetAllocation = cells[8] || 'Operational Budget';
        responsibleUnit = cells[9] || 'Technical Services';
      } else if (cells.length >= 6) {
        baseline = cells[2] || '';
        annualTarget = cells[3] || '';
        q1 = cells[4] || '';
        q2 = cells[5] || '';
      }
    }

    if (!kpi && cells.length > 1) {
      kpi = cells[1];
    }
    if (!refNum) {
      refNum = `TL-${String(items.length + 1).padStart(2, '0')}`;
    }

    if (kpi && kpi.length > 3) {
      items.push({
        _id: `sdbip-parsed-${Date.now()}-${items.length + 1}`,
        _selected: true,
        refNum: refNum.trim(),
        strategicObj: strategicObj.trim() || 'To provide sustainable municipal infrastructure and service delivery',
        kpas: currentKpa,
        operationalActivity: operationalActivity.trim() || kpi.trim(),
        kpi: kpi.trim(),
        compliance: 'compliant',
        uom: uom.trim() || 'Number',
        mscoaTracking: mscoaTracking.trim() || 'Operational',
        baseline: baseline.trim(),
        annualTarget: annualTarget.trim(),
        budgetAllocation: budgetAllocation.trim() || 'Operational Budget',
        q1: q1.trim(),
        q2: q2.trim(),
        midTerm: midTerm.trim(),
        q3: q3.trim(),
        q4: q4.trim(),
        responsibleUnit: responsibleUnit.trim() || 'Infrastructure Development & Technical Services',
        poeStatus: 'Pending Evidence',
        q1Actual: q1Actual.trim(),
        q1Variance: q1Variance.trim(),
        q1Corrective: q1Corrective.trim(),
        q1Expenditure: q1Expenditure.trim(),
        q1PoeDesc: q1PoeDesc.trim(),
        q2Actual: q2Actual.trim(),
        q2Variance: q2Variance.trim(),
        q2Corrective: q2Corrective.trim(),
        q2Expenditure: q2Expenditure.trim(),
        q2PoeDesc: q2PoeDesc.trim()
      });
    }
  }

  return items;
}

export const SAMPLE_SDBIP_TOP_LAYER_TEXT = `Service Delivery and Budget Implementation Plan (SDBIP) - Top Layer & Reporting Scorecard
Financial Year: 2025/2026 | Nkangala District Municipality

Ref No | Strategic Objective | National KPA | Operational Activity | Key Performance Indicator | Unit of Measure | mSCOA Tracking | Baseline | Annual Target | Budget Allocation | Q1 Target | Q2 Target | Mid-Term Target | Q3 Target | Q4 Target | Responsible Directorate | Q1 Actual | Q1 Variance | Q1 Corrective Measure | Q1 Expenditure | Q1 POE Description | Q2 Actual | Q2 Variance | Q2 Corrective Measure | Q2 Expenditure | Q2 POE Description
TL-01 | To improve access to sustainable basic municipal services | KPA 5: Basic Service Delivery and Infrastructure Development (BSD) | Bulk Water Scheme Infrastructure Expansion | Number of new bulk potable water connections commissioned in informal settlements | Connections | Function: Water Services (CAPEX) | 450 connections completed | 600 new connections fully commissioned | R 18,500,000 (MIG) | 150 connections completed | 150 connections completed | 300 connections completed | 150 connections completed | 150 connections completed | Infrastructure Development & Technical Services | 152 connections completed | +2 connections | Target exceeded due to accelerated trenching contractor shifts | R 4,625,000 | Engineering completion sign-off certificates and signed GIS beneficiary verification registers | 150 connections completed | 0 | On schedule and fully compliant with project specification | R 4,600,000 | Monthly consulting engineer progress reports and Council site inspection records
TL-02 | To enhance municipal road network accessibility and mobility | KPA 5: Basic Service Delivery and Infrastructure Development (BSD) | Regional Municipal Road Rehabilitation & Resealing | Kilometers of municipal asphalt and gravel roads rehabilitated and resealed | Kilometers (km) | Function: Roads and Stormwater (CAPEX) | 28 km rehabilitated | 40 km road network rehabilitated | R 24,000,000 (MIG) | 10 km rehabilitated | 10 km rehabilitated | 20 km rehabilitated | 10 km rehabilitated | 10 km rehabilitated | Infrastructure Development & Technical Services | 9 km rehabilitated | -1 km | Delayed bitumen material delivery caused by national transport strike | R 5,800,000 | Contractor weekly site measurement sheets and certified payment certificates | 11 km rehabilitated | +1 km | Double shift implemented to recover Q1 backlog successfully | R 6,200,000 | Final asphalt density test certificates and signed completion handover log
TL-03 | To maintain sound municipal financial viability and clean audit compliance | KPA 4: Municipal Financial Viability and Management (MFVM) | Municipal Operating Budget MFMA Compliance Execution | Percentage of approved municipal operating budget spent in full MFMA compliance | Percentage (%) | Function: Financial Administration (OPEX) | 96% compliant spend | 98% compliant expenditure achieved | Operational Budget | 25% expenditure compliance | 50% expenditure compliance | 50% expenditure compliance | 75% expenditure compliance | 98% expenditure compliance | Financial Services & Budget Office | 24.8% expenditure | -0.2% | Minor delay in processing final supplier invoices during financial system upgrade | R 12,400,000 | Section 71 monthly budget statements, general ledger audit trails, and bank reconciliation statements | 50.2% expenditure | +0.2% | All scheduled expenditure aligned with approved procurement plan | R 25,100,000 | Quarterly Section 52 MFMA performance report and approved treasury monitoring schedules
TL-04 | To stimulate inclusive local economic growth and job opportunities | KPA 3: Local Economic Development (LED) | Township and Rural SMME Incubation Program | Number of accredited local small enterprises supported through incubation centers | SMMEs | Function: Economic Development | 85 SMMEs supported | 120 local SMMEs provided with capacity and market access support | R 3,500,000 (Own Revenue) | 30 SMMEs supported | 30 SMMEs supported | 60 SMMEs supported | 30 SMMEs supported | 30 SMMEs supported | Planning & Economic Development | 32 SMMEs supported | +2 SMMEs | High attendance at regional enterprise training roadshows | R 850,000 | Signed incubation intake agreements, CIPC registration records, and workshop attendance registers | 30 SMMEs supported | 0 | All scheduled incubation modules delivered on time | R 875,000 | Accredited training certificates and formal quarterly mentorship progress logs
TL-05 | To strengthen institutional transformation, capacity, and workforce skills | KPA 1: Institutional Development and Transformation (MIDT) | Workplace Skills Plan (WSP) Staff Training Execution | Percentage of Workplace Skills Plan mandatory employee training programs executed | Percentage (%) | Function: Human Resources (OPEX) | 88% training executed | 95% planned WSP skills training executed | R 2,200,000 (LGSETA Grant) | 20% training programs executed | 45% training programs executed | 45% training programs executed | 75% training programs executed | 95% training programs executed | Corporate Services & Administration | 22% training executed | +2% | Advanced scheduling of municipal finance management program cohorts | R 520,000 | LGSETA submission receipts, signed attendance registers, and accredited course certificates | 45% training executed | 0 | Target fully achieved across all targeted directorates | R 540,000 | Human Resources training evaluation forms and certified institution invoices
TL-06 | To foster transparent governance and active citizen participation | KPA 2: Good Governance and Public Participation (GGPP) | Quarterly Ward Committee Public Consultation Engagements | Number of scheduled ward committee public feedback meetings convened across all wards | Meetings | Function: Council Support | 48 meetings convened | 64 ward committee meetings successfully convened | R 1,200,000 (Own Revenue) | 16 meetings convened | 16 meetings convened | 32 meetings convened | 16 meetings convened | 16 meetings convened | Office of the Municipal Manager / Strategic Executive | 16 meetings convened | 0 | 100% quorum achieved across all designated municipal wards | R 300,000 | Public meeting notices, signed citizen attendance registers, and adopted ward committee minutes | 16 meetings convened | 0 | High community participation and feedback captured for Council submission | R 300,000 | Council agenda verification pack and signed Speaker oversight certification`;
