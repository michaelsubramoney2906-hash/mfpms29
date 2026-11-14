import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface ExportKpiDetailItem {
  index: number;
  id: string;
  kpiNo: string;
  kpiTitle: string;
  kpaName?: string;
  target: string;
  actual: string;
  selfScore: string;
  managerScore: string;
  auditorScore?: string;
  poeDocsCount: number;
  poeDocNames: string[];
  reviewStatus: string;
  internalAuditStatus?: string;
  qPoeStatus: string;
  statusLabel: string;
  isNa: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  isAudited?: boolean;
  isAwaitingManager: boolean;
  isAwaitingAudit?: boolean;
  isRevisionRequired: boolean;
  isDraftInProgress: boolean;
}

export interface ExportKpaDetailItem {
  kpaName: string;
  totalKpis: number;
  naKpis: number;
  applicableKpis: number;
  submittedKpis: number;
  approvedKpis: number;
  auditedKpis: number;
  isNa: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  isAudited: boolean;
  statusLabel: string;
}

export interface ExportCompetencyOrPdpDetailItem {
  index: number;
  id: string;
  code: string;
  title: string;
  weight?: string;
  milestoneOrTarget?: string;
  progressOrOutcome?: string;
  selfScore: string;
  managerScore: string;
  auditorScore: string;
  poeDocsCount: number;
  poeDocNames: string[];
  reviewStatus: string;
  isSubmitted: boolean;
  isApproved: boolean;
  isAudited: boolean;
  statusLabel: string;
}

export interface ExportQuarterDimensionSummary {
  total: number;
  na?: number;
  applicable?: number;
  submitted: number;
  notSubmitted: number;
  approved: number;
  notApproved: number;
  audited: number;
  notAudited: number;
}

export interface ExportUserKpiRow {
  email: string;
  fullName: string;
  entity: string;
  department: string;
  subDepartment?: string;
  jobFunction: string;
  manager: string;
  managerEmail: string;
  totalKpis: number;
  naKpis: number;
  applicableKpis: number;
  submittedKpis: number;
  notSubmittedKpis: number;
  approvedKpis: number;
  notApprovedKpis: number;
  auditedKpis?: number;
  notAuditedKpis?: number;
  awaitingManagerApprovalKpis: number;
  awaitingAuditKpis?: number;
  revisionRequiredKpis: number;
  draftInProgressKpis: number;
  submissionRate: number;
  approvalRate: number;
  auditRate?: number;
  overallStatus: string;
  kpiDetails: ExportKpiDetailItem[];
  kpiQuarters?: Record<'q1' | 'q2' | 'q3' | 'q4', ExportQuarterDimensionSummary>;

  // KPAs
  totalKpas?: number;
  applicableKpas?: number;
  submittedKpas?: number;
  notSubmittedKpas?: number;
  approvedKpas?: number;
  notApprovedKpas?: number;
  auditedKpas?: number;
  notAuditedKpas?: number;
  kpaDetails?: ExportKpaDetailItem[];

  // JSCs
  totalJscs?: number;
  submittedJscs?: number;
  notSubmittedJscs?: number;
  approvedJscs?: number;
  notApprovedJscs?: number;
  auditedJscs?: number;
  notAuditedJscs?: number;
  jscDetails?: ExportCompetencyOrPdpDetailItem[];
  jscQuarters?: Record<'q1' | 'q2' | 'q3' | 'q4', ExportQuarterDimensionSummary>;

  // Core Competencies
  totalCcomp?: number;
  submittedCcomp?: number;
  notSubmittedCcomp?: number;
  approvedCcomp?: number;
  notApprovedCcomp?: number;
  auditedCcomp?: number;
  notAuditedCcomp?: number;
  ccompDetails?: ExportCompetencyOrPdpDetailItem[];
  ccompQuarters?: Record<'q1' | 'q2' | 'q3' | 'q4', ExportQuarterDimensionSummary>;

  // PDPs
  totalPdps?: number;
  submittedPdps?: number;
  notSubmittedPdps?: number;
  approvedPdps?: number;
  notApprovedPdps?: number;
  auditedPdps?: number;
  notAuditedPdps?: number;
  pdpDetails?: ExportCompetencyOrPdpDetailItem[];
  pdpQuarters?: Record<'q1' | 'q2' | 'q3' | 'q4', ExportQuarterDimensionSummary>;
}

export interface ExportDepartmentStatRow {
  department: string;
  shortName: string;
  totalOfficials: number;
  officialsWithKpis: number;
  totalKpis: number;
  naKpis: number;
  applicableKpis: number;
  submittedKpis: number;
  notSubmittedKpis: number;
  approvedKpis: number;
  notApprovedKpis: number;
  auditedKpis?: number;
  notAuditedKpis?: number;
  awaitingManagerKpis: number;
  awaitingAuditKpis?: number;
  submissionRate: number;
  approvalRate: number;
  auditRate?: number;
  totalKpas?: number;
  submittedKpas?: number;
  approvedKpas?: number;
  auditedKpas?: number;
  totalJscs?: number;
  submittedJscs?: number;
  approvedJscs?: number;
  auditedJscs?: number;
  totalCcomp?: number;
  submittedCcomp?: number;
  approvedCcomp?: number;
  auditedCcomp?: number;
  totalPdps?: number;
  submittedPdps?: number;
  approvedPdps?: number;
  auditedPdps?: number;
}

export interface ExportFilteredTotals {
  totalUsers: number;
  usersWithKpis: number;
  fullySubmittedUsers: number;
  fullyApprovedUsers: number;
  fullyAuditedUsers?: number;
  totalKpis: number;
  naKpis: number;
  applicableKpis: number;
  submittedKpis: number;
  notSubmittedKpis: number;
  approvedKpis: number;
  notApprovedKpis: number;
  auditedKpis?: number;
  notAuditedKpis?: number;
  awaitingManagerKpis: number;
  awaitingAuditKpis?: number;
  totalKpas?: number;
  submittedKpas?: number;
  approvedKpas?: number;
  auditedKpas?: number;
  totalJscs?: number;
  submittedJscs?: number;
  approvedJscs?: number;
  auditedJscs?: number;
  totalCcomp?: number;
  submittedCcomp?: number;
  approvedCcomp?: number;
  auditedCcomp?: number;
  totalPdps?: number;
  submittedPdps?: number;
  approvedPdps?: number;
  auditedPdps?: number;
}

function escapeXml(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function buildGradFillXml(startHex: string, endHex: string): string {
  const s = startHex.replace('#', '').toUpperCase();
  const e = endHex.replace('#', '').toUpperCase();
  return `<a:gradFill flip="none" rotWithShape="1">
            <a:gsLst>
              <a:gs pos="0"><a:srgbClr val="${s}"/></a:gs>
              <a:gs pos="100000"><a:srgbClr val="${e}"/></a:gs>
            </a:gsLst>
            <a:lin ang="5400000" scaled="1"/>
          </a:gradFill>`;
}

/**
 * Builds a Native Interactive OpenXML Doughnut / Pie Chart XML (<c:chartSpace>)
 * linked directly to worksheet cell formulas (<c:f>) with per-slice gradient shading.
 */
function buildNativeDonutChartXml(params: {
  title: string;
  seriesName: string;
  catFormula: string;
  valFormula: string;
  categories: string[];
  values: number[];
  sliceGradients: { start: string; end: string }[];
}): string {
  const { title, seriesName, catFormula, valFormula, categories, values, sliceGradients } = params;

  const dPtXml = categories
    .map((_, idx) => {
      const grad = sliceGradients[idx % sliceGradients.length];
      return `<c:dPt>
            <c:idx val="${idx}"/>
            <c:bubble3D val="0"/>
            <c:spPr>
              ${buildGradFillXml(grad.start, grad.end)}
              <a:ln w="12700"><a:solidFill><a:srgbClr val="FFFFFF"/></a:solidFill></a:ln>
            </c:spPr>
          </c:dPt>`;
    })
    .join('\n          ');

  const strPtsXml = categories
    .map((cat, idx) => `<c:pt idx="${idx}"><c:v>${escapeXml(cat)}</c:v></c:pt>`)
    .join('');

  const numPtsXml = values
    .map((val, idx) => `<c:pt idx="${idx}"><c:v>${Number(val) || 0}</c:v></c:pt>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:roundedCorners val="1"/>
  <c:chart>
    <c:title>
      <c:tx>
        <c:rich>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr><a:defRPr sz="1100" b="1"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill></a:defRPr></a:pPr>
            <a:r><a:rPr lang="en-ZA" sz="1100" b="1"/><a:t>${escapeXml(title)}</a:t></a:r>
          </a:p>
        </c:rich>
      </c:tx>
      <c:overlay val="0"/>
    </c:title>
    <c:autoTitleDeleted val="0"/>
    <c:plotArea>
      <c:layout/>
      <c:doughnutChart>
        <c:varyColors val="1"/>
        <c:ser>
          <c:idx val="0"/>
          <c:order val="0"/>
          <c:tx><c:v>${escapeXml(seriesName)}</c:v></c:tx>
          ${dPtXml}
          <c:dLbls>
            <c:showLegendKey val="0"/>
            <c:showVal val="1"/>
            <c:showCatName val="0"/>
            <c:showSerName val="0"/>
            <c:showPercent val="1"/>
            <c:showLeaderLines val="1"/>
          </c:dLbls>
          <c:cat>
            <c:strRef>
              <c:f>${escapeXml(catFormula)}</c:f>
              <c:strCache>
                <c:ptCount val="${categories.length}"/>
                ${strPtsXml}
              </c:strCache>
            </c:strRef>
          </c:cat>
          <c:val>
            <c:numRef>
              <c:f>${escapeXml(valFormula)}</c:f>
              <c:numCache>
                <c:formatCode>General</c:formatCode>
                <c:ptCount val="${values.length}"/>
                ${numPtsXml}
              </c:numCache>
            </c:numRef>
          </c:val>
        </c:ser>
        <c:firstSliceAng val="0"/>
        <c:holeSize val="55"/>
      </c:doughnutChart>
    </c:plotArea>
    <c:legend>
      <c:legendPos val="b"/>
      <c:overlay val="0"/>
    </c:legend>
    <c:plotVisOnly val="1"/>
  </c:chart>
</c:chartSpace>`;
}

/**
 * Builds a Native Interactive OpenXML Clustered Column Bar Chart XML (<c:chartSpace>)
 * bound directly to worksheet cell ranges.
 */
function buildNativeBarChartXml(params: {
  title: string;
  catFormula: string;
  categories: string[];
  seriesList: {
    name: string;
    headerFormula: string;
    valFormula: string;
    values: number[];
    colorStart: string;
    colorEnd: string;
  }[];
}): string {
  const { title, catFormula, categories, seriesList } = params;

  const strPtsXml = categories
    .map((cat, idx) => `<c:pt idx="${idx}"><c:v>${escapeXml(cat)}</c:v></c:pt>`)
    .join('');

  const seriesXml = seriesList
    .map((ser, sIdx) => {
      const numPtsXml = ser.values
        .map((v, idx) => `<c:pt idx="${idx}"><c:v>${Number(v) || 0}</c:v></c:pt>`)
        .join('');

      return `<c:ser>
          <c:idx val="${sIdx}"/>
          <c:order val="${sIdx}"/>
          <c:tx>
            <c:strRef>
              <c:f>${escapeXml(ser.headerFormula)}</c:f>
              <c:strCache>
                <c:ptCount val="1"/>
                <c:pt idx="0"><c:v>${escapeXml(ser.name)}</c:v></c:pt>
              </c:strCache>
            </c:strRef>
          </c:tx>
          <c:spPr>
            ${buildGradFillXml(ser.colorStart, ser.colorEnd)}
          </c:spPr>
          <c:invertIfNegative val="0"/>
          <c:dLbls>
            <c:showLegendKey val="0"/>
            <c:showVal val="1"/>
            <c:showCatName val="0"/>
            <c:showSerName val="0"/>
            <c:showPercent val="0"/>
          </c:dLbls>
          <c:cat>
            <c:strRef>
              <c:f>${escapeXml(catFormula)}</c:f>
              <c:strCache>
                <c:ptCount val="${categories.length}"/>
                ${strPtsXml}
              </c:strCache>
            </c:strRef>
          </c:cat>
          <c:val>
            <c:numRef>
              <c:f>${escapeXml(ser.valFormula)}</c:f>
              <c:numCache>
                <c:formatCode>General</c:formatCode>
                <c:ptCount val="${ser.values.length}"/>
                ${numPtsXml}
              </c:numCache>
            </c:numRef>
          </c:val>
        </c:ser>`;
    })
    .join('\n        ');

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<c:chartSpace xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <c:roundedCorners val="1"/>
  <c:chart>
    <c:title>
      <c:tx>
        <c:rich>
          <a:bodyPr/>
          <a:lstStyle/>
          <a:p>
            <a:pPr><a:defRPr sz="1150" b="1"><a:solidFill><a:srgbClr val="0F172A"/></a:solidFill></a:defRPr></a:pPr>
            <a:r><a:rPr lang="en-ZA" sz="1150" b="1"/><a:t>${escapeXml(title)}</a:t></a:r>
          </a:p>
        </c:rich>
      </c:tx>
      <c:overlay val="0"/>
    </c:title>
    <c:autoTitleDeleted val="0"/>
    <c:plotArea>
      <c:layout/>
      <c:barChart>
        <c:barDir val="col"/>
        <c:grouping val="clustered"/>
        <c:varyColors val="0"/>
        ${seriesXml}
        <c:gapWidth val="150"/>
        <c:overlap val="-15"/>
        <c:axId val="1001"/>
        <c:axId val="1002"/>
      </c:barChart>
      <c:catAx>
        <c:axId val="1001"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="b"/>
        <c:numFmt formatCode="General" sourceLinked="1"/>
        <c:majorTickMark val="out"/>
        <c:minorTickMark val="none"/>
        <c:tickLblPos val="nextTo"/>
        <c:txPr>
          <a:bodyPr rot="-2700000" vert="horz"/>
          <a:lstStyle/>
          <a:p><a:pPr><a:defRPr sz="850" b="1"/></a:pPr></a:p>
        </c:txPr>
        <c:crossAx val="1002"/>
        <c:crosses val="autoZero"/>
        <c:auto val="1"/>
        <c:lblAlgn val="ctr"/>
        <c:lblOffset val="100"/>
      </c:catAx>
      <c:valAx>
        <c:axId val="1002"/>
        <c:scaling><c:orientation val="minMax"/></c:scaling>
        <c:delete val="0"/>
        <c:axPos val="l"/>
        <c:majorGridlines/>
        <c:numFmt formatCode="General" sourceLinked="1"/>
        <c:majorTickMark val="out"/>
        <c:minorTickMark val="none"/>
        <c:tickLblPos val="nextTo"/>
        <c:crossAx val="1001"/>
        <c:crosses val="autoZero"/>
        <c:crossBetween val="between"/>
      </c:valAx>
    </c:plotArea>
    <c:legend>
      <c:legendPos val="t"/>
      <c:overlay val="0"/>
    </c:legend>
    <c:plotVisOnly val="1"/>
  </c:chart>
</c:chartSpace>`;
}

interface NativeChartPlacement {
  chartXml: string;
  name: string;
  fromCol: number;
  fromRow: number;
  toCol: number;
  toRow: number;
}

/**
 * Attaches a set of NativeChartPlacements to a specific 1-based worksheet index (`sheetIdx`)
 * using `xl/drawings/drawing{drawingIdx}.xml` and registers all relationships and Content_Types.
 */
async function attachChartsToWorksheet(params: {
  zip: JSZip;
  sheetIdx: number;
  drawingIdx: number;
  charts: NativeChartPlacement[];
  startingChartGlobalId: number;
  contentTypeOverrides: string[];
}): Promise<number> {
  const { zip, sheetIdx, drawingIdx, charts, startingChartGlobalId, contentTypeOverrides } = params;
  if (charts.length === 0) return startingChartGlobalId;

  let nextChartId = startingChartGlobalId;
  const chartGlobalIds: number[] = [];

  for (const c of charts) {
    const cId = nextChartId++;
    chartGlobalIds.push(cId);
    zip.file(`xl/charts/chart${cId}.xml`, c.chartXml);
    contentTypeOverrides.push(
      `  <Override PartName="/xl/charts/chart${cId}.xml" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`
    );
  }

  const drawingAnchorsXml = charts
    .map((c, idx) => {
      const cId = chartGlobalIds[idx];
      return `
  <xdr:twoCellAnchor>
    <xdr:from>
      <xdr:col>${c.fromCol}</xdr:col>
      <xdr:colOff>0</xdr:colOff>
      <xdr:row>${c.fromRow}</xdr:row>
      <xdr:rowOff>0</xdr:rowOff>
    </xdr:from>
    <xdr:to>
      <xdr:col>${c.toCol}</xdr:col>
      <xdr:colOff>0</xdr:colOff>
      <xdr:row>${c.toRow}</xdr:row>
      <xdr:rowOff>0</xdr:rowOff>
    </xdr:to>
    <xdr:graphicFrame macro="">
      <xdr:nvGraphicFramePr>
        <xdr:cNvPr id="${cId + 100}" name="${escapeXml(c.name)}"/>
        <xdr:cNvGraphicFramePr/>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm>
        <a:off x="0" y="0"/>
        <a:ext cx="0" cy="0"/>
      </xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdChart${cId}"/>
        </a:graphicData>
      </a:graphic>
    </xdr:graphicFrame>
    <xdr:clientData/>
  </xdr:twoCellAnchor>`;
    })
    .join('');

  const drawingXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<xdr:wsDr xmlns:xdr="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">${drawingAnchorsXml}
</xdr:wsDr>`;

  const drawingPath = `xl/drawings/drawing${drawingIdx}.xml`;
  zip.file(drawingPath, drawingXml);
  contentTypeOverrides.push(
    `  <Override PartName="/${drawingPath}" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>`
  );

  const drawingRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${chartGlobalIds
  .map(
    cId =>
      `  <Relationship Id="rIdChart${cId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${cId}.xml"/>`
  )
  .join('\n')}
</Relationships>`;

  zip.file(`xl/drawings/_rels/drawing${drawingIdx}.xml.rels`, drawingRelsXml);

  const sheetXmlPath = `xl/worksheets/sheet${sheetIdx}.xml`;
  const sheetFile = zip.file(sheetXmlPath);
  if (sheetFile) {
    let sheetXml = await sheetFile.async('string');
    if (!sheetXml.includes('xmlns:r=')) {
      sheetXml = sheetXml.replace(
        '<worksheet ',
        '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
      );
    }
    if (!sheetXml.includes('<drawing ')) {
      sheetXml = sheetXml.replace('</worksheet>', `<drawing r:id="rIdDrawing${drawingIdx}"/></worksheet>`);
    }
    zip.file(sheetXmlPath, sheetXml);
  }

  const sheetRelsPath = `xl/worksheets/_rels/sheet${sheetIdx}.xml.rels`;
  const existingSheetRels = zip.file(sheetRelsPath);
  if (existingSheetRels) {
    let relsXml = await existingSheetRels.async('string');
    if (!relsXml.includes(`rIdDrawing${drawingIdx}`)) {
      relsXml = relsXml.replace(
        '</Relationships>',
        `  <Relationship Id="rIdDrawing${drawingIdx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingIdx}.xml"/>\n</Relationships>`
      );
      zip.file(sheetRelsPath, relsXml);
    }
  } else {
    zip.file(
      sheetRelsPath,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdDrawing${drawingIdx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing${drawingIdx}.xml"/>
</Relationships>`
    );
  }

  return nextChartId;
}

/**
 * Generates an expanded 7-Worksheet OpenXML (.xlsx) workbook with Native Interactive Charts
 * across Every User, Every Quarter (Q1–Q4), and Every Department, with separate worksheets
 * and interactive OpenXML charts for:
 *  1. KPIs (including KPIs Audited)
 *  2. KPAs (Key Performance Areas)
 *  3. JSCs (Job Specific Competencies per Quarter & per User)
 *  4. Core Competencies (per Quarter & per User)
 *  5. PDPs (Personal Development Plans per Quarter & per User)
 */
export async function exportIpmsReportXlsxWithCharts(params: {
  quarter: string;
  entityFilter: string;
  departmentStats: ExportDepartmentStatRow[];
  filteredUsers: ExportUserKpiRow[];
  filteredTotals: ExportFilteredTotals;
}): Promise<void> {
  const { quarter, entityFilter, departmentStats, filteredUsers, filteredTotals } = params;

  const wb = XLSX.utils.book_new();
  const sheet1Name = 'Dept & Quarterly Summary';
  const sheet2Name = 'Per-User KPI & Audit Summary';
  const sheet3Name = 'KPAs Per User & Dept';
  const sheet4Name = 'JSCs Per User & Quarter';
  const sheet5Name = 'Core Comp Per User & Qtr';
  const sheet6Name = 'PDPs Per User & Quarter';
  const sheet7Name = 'Detailed Item Audit Ledger';

  // Order users by Canonical Department (matching departmentStats order) then by Total KPIs desc
  // so each Department's officials occupy a contiguous cell range across Sheets 2, 3, 4, 5, and 6!
  const deptOrderMap = new Map<string, number>();
  departmentStats.forEach((d, idx) => deptOrderMap.set(d.department, idx));

  const usersOrderedByDept = [...filteredUsers].sort((a, b) => {
    const da = deptOrderMap.get(a.department) ?? 999;
    const db = deptOrderMap.get(b.department) ?? 999;
    if (da !== db) return da - db;
    return (
      b.totalKpis - a.totalKpis ||
      b.submittedKpis - a.submittedKpis ||
      (a.fullName || '').localeCompare(b.fullName || '')
    );
  });

  // Track exact 1-based Excel row range [startRow, endRow] on User-ordered sheets (Sheets 2..6) for each Department
  const deptRowRanges = new Map<
    string,
    { startRow: number; endRow: number; officials: ExportUserKpiRow[] }
  >();

  usersOrderedByDept.forEach((u, idx) => {
    const excelRow = idx + 2; // Row 1 is header
    const existing = deptRowRanges.get(u.department);
    if (!existing) {
      deptRowRanges.set(u.department, {
        startRow: excelRow,
        endRow: excelRow,
        officials: [u]
      });
    } else {
      existing.endRow = excelRow;
      existing.officials.push(u);
    }
  });

  // Compute Quarterly (Q1..Q4) Totals across all filteredUsers for KPIs, JSCs, Core Competencies, PDPs
  const qKeys: ('q1' | 'q2' | 'q3' | 'q4')[] = ['q1', 'q2', 'q3', 'q4'];
  const quarterlyRollup = qKeys.map(qk => {
    let kpiSub = 0, kpiApp = 0, kpiAud = 0;
    let jscSub = 0, jscApp = 0, jscAud = 0;
    let ccSub = 0, ccApp = 0, ccAud = 0;
    let pdpSub = 0, pdpApp = 0, pdpAud = 0;

    for (const u of usersOrderedByDept) {
      const kq = u.kpiQuarters?.[qk];
      if (kq) {
        kpiSub += kq.submitted || 0;
        kpiApp += kq.approved || 0;
        kpiAud += kq.audited || 0;
      }
      const jq = u.jscQuarters?.[qk];
      if (jq) {
        jscSub += jq.submitted || 0;
        jscApp += jq.approved || 0;
        jscAud += jq.audited || 0;
      }
      const cq = u.ccompQuarters?.[qk];
      if (cq) {
        ccSub += cq.submitted || 0;
        ccApp += cq.approved || 0;
        ccAud += cq.audited || 0;
      }
      const pq = u.pdpQuarters?.[qk];
      if (pq) {
        pdpSub += pq.submitted || 0;
        pdpApp += pq.approved || 0;
        pdpAud += pq.audited || 0;
      }
    }

    return {
      quarterLabel: qk.toUpperCase(),
      kpiSub,
      kpiApp,
      kpiAud,
      jscSub,
      jscApp,
      jscAud,
      ccSub,
      ccApp,
      ccAud,
      pdpSub,
      pdpApp,
      pdpAud
    };
  });

  // ============================================================================
  // SHEET 1: Dept & Quarterly Summary (KPIs, KPAs, JSCs, Core Comp, PDPs)
  // ============================================================================
  const deptRows = departmentStats.map((d, idx) => {
    const deptOfficials = deptRowRanges.get(d.department)?.officials || [];
    const auditedKpis = d.auditedKpis ?? deptOfficials.reduce((s, u) => s + (u.auditedKpis || 0), 0);
    const notAuditedKpis = d.notAuditedKpis ?? Math.max(0, d.applicableKpis - auditedKpis);
    const auditRate = d.applicableKpis > 0 ? Math.round((auditedKpis / d.applicableKpis) * 100) : 0;

    const totalKpas = d.totalKpas ?? deptOfficials.reduce((s, u) => s + (u.totalKpas || 0), 0);
    const subKpas = d.submittedKpas ?? deptOfficials.reduce((s, u) => s + (u.submittedKpas || 0), 0);
    const appKpas = d.approvedKpas ?? deptOfficials.reduce((s, u) => s + (u.approvedKpas || 0), 0);
    const audKpas = d.auditedKpas ?? deptOfficials.reduce((s, u) => s + (u.auditedKpas || 0), 0);

    const totalJscs = d.totalJscs ?? deptOfficials.reduce((s, u) => s + (u.totalJscs || 0), 0);
    const subJscs = d.submittedJscs ?? deptOfficials.reduce((s, u) => s + (u.submittedJscs || 0), 0);
    const appJscs = d.approvedJscs ?? deptOfficials.reduce((s, u) => s + (u.approvedJscs || 0), 0);
    const audJscs = d.auditedJscs ?? deptOfficials.reduce((s, u) => s + (u.auditedJscs || 0), 0);

    const totalCcomp = d.totalCcomp ?? deptOfficials.reduce((s, u) => s + (u.totalCcomp || 0), 0);
    const subCcomp = d.submittedCcomp ?? deptOfficials.reduce((s, u) => s + (u.submittedCcomp || 0), 0);
    const appCcomp = d.approvedCcomp ?? deptOfficials.reduce((s, u) => s + (u.approvedCcomp || 0), 0);
    const audCcomp = d.auditedCcomp ?? deptOfficials.reduce((s, u) => s + (u.auditedCcomp || 0), 0);

    const totalPdps = d.totalPdps ?? deptOfficials.reduce((s, u) => s + (u.totalPdps || 0), 0);
    const subPdps = d.submittedPdps ?? deptOfficials.reduce((s, u) => s + (u.submittedPdps || 0), 0);
    const appPdps = d.approvedPdps ?? deptOfficials.reduce((s, u) => s + (u.approvedPdps || 0), 0);
    const audPdps = d.auditedPdps ?? deptOfficials.reduce((s, u) => s + (u.auditedPdps || 0), 0);

    return {
      '#': idx + 1,
      'Canonical Department / Directorate': d.department,
      'Total Officials': d.totalOfficials,
      'Officials With Assigned KPIs': d.officialsWithKpis,
      'Period': quarter.toUpperCase(),
      'Total KPIs': d.totalKpis,
      'N/A KPIs': d.naKpis,
      'Applicable KPIs': d.applicableKpis,
      'KPIs Submitted': d.submittedKpis,
      'KPIs Not Submitted': d.notSubmittedKpis,
      'Submission Rate (%)': `${d.submissionRate}%`,
      'KPIs Approved by Manager': d.approvedKpis,
      'KPIs Not Approved': d.notApprovedKpis,
      'KPIs Awaiting Manager': d.awaitingManagerKpis,
      'Approval Rate (%)': `${d.approvalRate}%`,
      'KPIs Audited': auditedKpis,
      'KPIs Not Audited': notAuditedKpis,
      'Audit Rate (%)': `${auditRate}%`,
      'KPAs (Total / Sub / Mgr App / Audited)': `${totalKpas} / ${subKpas} / ${appKpas} / ${audKpas}`,
      'JSCs (Total / Sub / Mgr App / Audited)': `${totalJscs} / ${subJscs} / ${appJscs} / ${audJscs}`,
      'Core Comp (Total / Sub / Mgr App / Audited)': `${totalCcomp} / ${subCcomp} / ${appCcomp} / ${audCcomp}`,
      'PDPs (Total / Sub / Mgr App / Audited)': `${totalPdps} / ${subPdps} / ${appPdps} / ${audPdps}`
    };
  });

  const totalAuditedKpis =
    filteredTotals.auditedKpis ??
    usersOrderedByDept.reduce((s, u) => s + (u.auditedKpis || 0), 0);
  const totalNotAuditedKpis =
    filteredTotals.notAuditedKpis ??
    Math.max(0, filteredTotals.applicableKpis - totalAuditedKpis);
  const totalAwaitingAuditKpis =
    filteredTotals.awaitingAuditKpis ??
    usersOrderedByDept.reduce((s, u) => s + (u.awaitingAuditKpis || 0), 0);

  const totKpas = usersOrderedByDept.reduce((s, u) => s + (u.totalKpas || 0), 0);
  const subKpas = usersOrderedByDept.reduce((s, u) => s + (u.submittedKpas || 0), 0);
  const appKpas = usersOrderedByDept.reduce((s, u) => s + (u.approvedKpas || 0), 0);
  const audKpas = usersOrderedByDept.reduce((s, u) => s + (u.auditedKpas || 0), 0);

  const totJscs = usersOrderedByDept.reduce((s, u) => s + (u.totalJscs || 0), 0);
  const subJscs = usersOrderedByDept.reduce((s, u) => s + (u.submittedJscs || 0), 0);
  const appJscs = usersOrderedByDept.reduce((s, u) => s + (u.approvedJscs || 0), 0);
  const audJscs = usersOrderedByDept.reduce((s, u) => s + (u.auditedJscs || 0), 0);

  const totCcomp = usersOrderedByDept.reduce((s, u) => s + (u.totalCcomp || 0), 0);
  const subCcomp = usersOrderedByDept.reduce((s, u) => s + (u.submittedCcomp || 0), 0);
  const appCcomp = usersOrderedByDept.reduce((s, u) => s + (u.approvedCcomp || 0), 0);
  const audCcomp = usersOrderedByDept.reduce((s, u) => s + (u.auditedCcomp || 0), 0);

  const totPdps = usersOrderedByDept.reduce((s, u) => s + (u.totalPdps || 0), 0);
  const subPdps = usersOrderedByDept.reduce((s, u) => s + (u.submittedPdps || 0), 0);
  const appPdps = usersOrderedByDept.reduce((s, u) => s + (u.approvedPdps || 0), 0);
  const audPdps = usersOrderedByDept.reduce((s, u) => s + (u.auditedPdps || 0), 0);

  deptRows.push({
    '#': '' as any,
    'Canonical Department / Directorate': 'TOTAL (CURRENT VIEW)',
    'Total Officials': filteredTotals.totalUsers,
    'Officials With Assigned KPIs': filteredTotals.usersWithKpis,
    'Period': quarter.toUpperCase(),
    'Total KPIs': filteredTotals.totalKpis,
    'N/A KPIs': filteredTotals.naKpis,
    'Applicable KPIs': filteredTotals.applicableKpis,
    'KPIs Submitted': filteredTotals.submittedKpis,
    'KPIs Not Submitted': filteredTotals.notSubmittedKpis,
    'Submission Rate (%)':
      filteredTotals.applicableKpis > 0
        ? `${Math.round((filteredTotals.submittedKpis / filteredTotals.applicableKpis) * 100)}%`
        : '0%',
    'KPIs Approved by Manager': filteredTotals.approvedKpis,
    'KPIs Not Approved': filteredTotals.notApprovedKpis,
    'KPIs Awaiting Manager': filteredTotals.awaitingManagerKpis,
    'Approval Rate (%)':
      filteredTotals.applicableKpis > 0
        ? `${Math.round((filteredTotals.approvedKpis / filteredTotals.applicableKpis) * 100)}%`
        : '0%',
    'KPIs Audited': totalAuditedKpis,
    'KPIs Not Audited': totalNotAuditedKpis,
    'Audit Rate (%)':
      filteredTotals.applicableKpis > 0
        ? `${Math.round((totalAuditedKpis / filteredTotals.applicableKpis) * 100)}%`
        : '0%',
    'KPAs (Total / Sub / Mgr App / Audited)': `${totKpas} / ${subKpas} / ${appKpas} / ${audKpas}`,
    'JSCs (Total / Sub / Mgr App / Audited)': `${totJscs} / ${subJscs} / ${appJscs} / ${audJscs}`,
    'Core Comp (Total / Sub / Mgr App / Audited)': `${totCcomp} / ${subCcomp} / ${appCcomp} / ${audCcomp}`,
    'PDPs (Total / Sub / Mgr App / Audited)': `${totPdps} / ${subPdps} / ${appPdps} / ${audPdps}`
  });

  const wsDepts = XLSX.utils.json_to_sheet(deptRows);

  // Add Executive Ratio Reference Cells in Columns X & Y (rows 1..10) on Sheet 1 for Donut Charts 1, 2, 3
  const unapprovedOther = Math.max(0, filteredTotals.notApprovedKpis - filteredTotals.awaitingManagerKpis);
  const unauditedOther = Math.max(0, totalNotAuditedKpis - totalAwaitingAuditKpis);
  XLSX.utils.sheet_add_aoa(
    wsDepts,
    [
      ['Executive Ratio Metric', 'KPI Count'],
      ['KPIs Submitted', filteredTotals.submittedKpis],
      ['KPIs Not Submitted', filteredTotals.notSubmittedKpis],
      ['Not Applicable (N/A)', filteredTotals.naKpis],
      ['Approved by Manager', filteredTotals.approvedKpis],
      ['Awaiting Manager Approval', filteredTotals.awaitingManagerKpis],
      ['Not Approved / Unsubmitted', unapprovedOther],
      ['KPIs Audited', totalAuditedKpis],
      ['Awaiting Internal Audit', totalAwaitingAuditKpis],
      ['Not Audited / Unsubmitted', unauditedOther]
    ],
    { origin: 'X1' }
  );

  // Add Quarterly (Q1–Q4) Multi-Dimension Reference Table in Columns AA..AM (rows 1..5) on Sheet 1
  XLSX.utils.sheet_add_aoa(
    wsDepts,
    [
      [
        'Quarter',
        'KPIs Submitted',
        'KPIs Approved by Manager',
        'KPIs Audited',
        'JSCs Submitted',
        'JSCs Approved by Manager',
        'JSCs Audited',
        'Core Comp Submitted',
        'Core Comp Approved by Manager',
        'Core Comp Audited',
        'PDPs Submitted',
        'PDPs Approved by Manager',
        'PDPs Audited'
      ],
      ...quarterlyRollup.map(q => [
        q.quarterLabel,
        q.kpiSub,
        q.kpiApp,
        q.kpiAud,
        q.jscSub,
        q.jscApp,
        q.jscAud,
        q.ccSub,
        q.ccApp,
        q.ccAud,
        q.pdpSub,
        q.pdpApp,
        q.pdpAud
      ])
    ],
    { origin: 'AA1' }
  );

  wsDepts['!autofilter'] = { ref: `A1:V${Math.max(2, deptRows.length)}` };
  wsDepts['!cols'] = [
    { wch: 5 },
    { wch: 40 },
    { wch: 15 },
    { wch: 22 },
    { wch: 10 },
    { wch: 14 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 17 },
    { wch: 17 },
    { wch: 22 },
    { wch: 17 },
    { wch: 20 },
    { wch: 16 },
    { wch: 15 },
    { wch: 16 },
    { wch: 15 },
    { wch: 30 },
    { wch: 30 },
    { wch: 32 },
    { wch: 30 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDepts, sheet1Name);

  // ============================================================================
  // SHEET 2: Per-User KPI & Audit Summary (Active Quarter + Q1..Q4 Breakdown)
  // ============================================================================
  const userKpiRows = usersOrderedByDept.map((u, idx) => {
    const audited = u.auditedKpis ?? 0;
    const notAudited = u.notAuditedKpis ?? Math.max(0, u.applicableKpis - audited);
    const awaitingAudit = u.awaitingAuditKpis ?? Math.max(0, u.submittedKpis - audited);
    const auditRate = u.auditRate ?? (u.applicableKpis > 0 ? Math.round((audited / u.applicableKpis) * 100) : 0);

    const q1 = u.kpiQuarters?.q1;
    const q2 = u.kpiQuarters?.q2;
    const q3 = u.kpiQuarters?.q3;
    const q4 = u.kpiQuarters?.q4;

    return {
      '#': idx + 1,
      'Official Name': u.fullName,
      'Email': u.email,
      'Entity': u.entity,
      'Canonical Department': u.department,
      'Unit / Sub-Directorate': u.subDepartment || u.department,
      'Designation': u.jobFunction,
      'Line Manager (Approver)': u.manager || '—',
      'Manager Email': u.managerEmail || '—',
      'Active Period': quarter.toUpperCase(),
      'Total KPIs': u.totalKpis, // Col K
      'N/A KPIs': u.naKpis, // Col L
      'Applicable KPIs': u.applicableKpis, // Col M
      'KPIs Submitted': u.submittedKpis, // Col N
      'KPIs Not Submitted': u.notSubmittedKpis, // Col O
      'Submission Rate (%)': `${u.submissionRate}%`, // Col P
      'KPIs Approved by Manager': u.approvedKpis, // Col Q
      'KPIs Not Approved': u.notApprovedKpis, // Col R
      'KPIs Awaiting Manager': u.awaitingManagerApprovalKpis, // Col S
      'Approval Rate (%)': `${u.approvalRate}%`, // Col T
      'KPIs Audited': audited, // Col U
      'KPIs Not Audited': notAudited, // Col V
      'KPIs Awaiting Audit': awaitingAudit, // Col W
      'Audit Rate (%)': `${auditRate}%`, // Col X
      'Q1 KPIs (Sub / Mgr App / Audited)': q1 ? `${q1.submitted} / ${q1.approved} / ${q1.audited}` : `${u.submittedKpis} / ${u.approvedKpis} / ${audited}`,
      'Q2 KPIs (Sub / Mgr App / Audited)': q2 ? `${q2.submitted} / ${q2.approved} / ${q2.audited}` : '0 / 0 / 0',
      'Q3 KPIs (Sub / Mgr App / Audited)': q3 ? `${q3.submitted} / ${q3.approved} / ${q3.audited}` : '0 / 0 / 0',
      'Q4 KPIs (Sub / Mgr App / Audited)': q4 ? `${q4.submitted} / ${q4.approved} / ${q4.audited}` : '0 / 0 / 0',
      'Overall Status': u.overallStatus
    };
  });

  const wsUsersKpi = XLSX.utils.json_to_sheet(userKpiRows);
  wsUsersKpi['!autofilter'] = { ref: `A1:AC${Math.max(2, userKpiRows.length + 1)}` };
  wsUsersKpi['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 32 },
    { wch: 14 },
    { wch: 36 },
    { wch: 28 },
    { wch: 28 },
    { wch: 24 },
    { wch: 28 },
    { wch: 12 },
    { wch: 12 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 15 },
    { wch: 16 },
    { wch: 18 },
    { wch: 15 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 26 },
    { wch: 22 }
  ];
  XLSX.utils.book_append_sheet(wb, wsUsersKpi, sheet2Name);

  // ============================================================================
  // SHEET 3: KPAs Per User & Dept (with native interactive KPA charts)
  // ============================================================================
  const userKpaRows = usersOrderedByDept.map((u, idx) => {
    const tot = u.totalKpas ?? 0;
    const app = u.applicableKpas ?? tot;
    const sub = u.submittedKpas ?? 0;
    const notSub = u.notSubmittedKpas ?? Math.max(0, app - sub);
    const mgrApp = u.approvedKpas ?? 0;
    const notMgrApp = u.notApprovedKpas ?? Math.max(0, app - mgrApp);
    const aud = u.auditedKpas ?? 0;
    const notAud = u.notAuditedKpas ?? Math.max(0, app - aud);
    return {
      '#': idx + 1, // Col A
      'Official Name': u.fullName, // Col B
      'Email': u.email, // Col C
      'Entity': u.entity, // Col D
      'Canonical Department': u.department, // Col E
      'Designation': u.jobFunction, // Col F
      'Line Manager': u.manager || '—', // Col G
      'Period': quarter.toUpperCase(), // Col H
      'Total KPAs': tot, // Col I
      'Applicable KPAs': app, // Col J
      'KPAs Submitted': sub, // Col K
      'KPAs Not Submitted': notSub, // Col L
      'KPAs Approved by Manager': mgrApp, // Col M
      'KPAs Not Approved': notMgrApp, // Col N
      'KPAs Audited': aud, // Col O
      'KPAs Not Audited': notAud, // Col P
      'KPA Breakdown Summary': (u.kpaDetails || [])
        .map(k => `${k.kpaName}: ${k.submittedKpis}/${k.applicableKpis} Sub, ${k.approvedKpis} App, ${k.auditedKpis} Aud`)
        .join(' | ')
    };
  });

  const wsKpas = XLSX.utils.json_to_sheet(userKpaRows);
  wsKpas['!autofilter'] = { ref: `A1:Q${Math.max(2, userKpaRows.length + 1)}` };
  wsKpas['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 30 },
    { wch: 14 },
    { wch: 36 },
    { wch: 28 },
    { wch: 24 },
    { wch: 10 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 15 },
    { wch: 16 },
    { wch: 65 }
  ];
  XLSX.utils.book_append_sheet(wb, wsKpas, sheet3Name);

  // ============================================================================
  // SHEET 4: JSCs Per User & Quarter (Q1, Q2, Q3, Q4 + Active Quarter + Charts)
  // ============================================================================
  const userJscRows = usersOrderedByDept.map((u, idx) => {
    const tot = u.totalJscs ?? 0;
    const sub = u.submittedJscs ?? 0;
    const notSub = u.notSubmittedJscs ?? Math.max(0, tot - sub);
    const mgrApp = u.approvedJscs ?? 0;
    const notMgrApp = u.notApprovedJscs ?? Math.max(0, tot - mgrApp);
    const aud = u.auditedJscs ?? 0;
    const notAud = u.notAuditedJscs ?? Math.max(0, tot - aud);

    const q1 = u.jscQuarters?.q1 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q2 = u.jscQuarters?.q2 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q3 = u.jscQuarters?.q3 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q4 = u.jscQuarters?.q4 || { total: tot, submitted: 0, approved: 0, audited: 0 };

    return {
      '#': idx + 1, // Col A
      'Official Name': u.fullName, // Col B
      'Email': u.email, // Col C
      'Entity': u.entity, // Col D
      'Canonical Department': u.department, // Col E
      'Designation': u.jobFunction, // Col F
      'Line Manager': u.manager || '—', // Col G
      'Active Period': quarter.toUpperCase(), // Col H
      'Total JSCs': tot, // Col I
      'JSCs Submitted': sub, // Col J
      'JSCs Not Submitted': notSub, // Col K
      'JSCs Approved by Manager': mgrApp, // Col L
      'JSCs Not Approved': notMgrApp, // Col M
      'JSCs Audited': aud, // Col N
      'JSCs Not Audited': notAud, // Col O
      'Q1 JSCs Submitted': q1.submitted, // Col P
      'Q1 JSCs Approved by Manager': q1.approved, // Col Q
      'Q1 JSCs Audited': q1.audited, // Col R
      'Q2 JSCs Submitted': q2.submitted, // Col S
      'Q2 JSCs Approved by Manager': q2.approved, // Col T
      'Q2 JSCs Audited': q2.audited, // Col U
      'Q3 JSCs Submitted': q3.submitted, // Col V
      'Q3 JSCs Approved by Manager': q3.approved, // Col W
      'Q3 JSCs Audited': q3.audited, // Col X
      'Q4 JSCs Submitted': q4.submitted, // Col Y
      'Q4 JSCs Approved by Manager': q4.approved, // Col Z
      'Q4 JSCs Audited': q4.audited // Col AA
    };
  });

  const wsJscs = XLSX.utils.json_to_sheet(userJscRows);
  wsJscs['!autofilter'] = { ref: `A1:AA${Math.max(2, userJscRows.length + 1)}` };
  wsJscs['!cols'] = [
    { wch: 5 },
    { wch: 28 },
    { wch: 30 },
    { wch: 14 },
    { wch: 36 },
    { wch: 28 },
    { wch: 24 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 18 },
    { wch: 22 },
    { wch: 18 },
    { wch: 15 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 },
    { wch: 16 },
    { wch: 22 },
    { wch: 16 }
  ];
  XLSX.utils.book_append_sheet(wb, wsJscs, sheet4Name);

  // ============================================================================
  // SHEET 5: Core Comp Per User & Qtr (Q1, Q2, Q3, Q4 + Active Quarter + Charts)
  // ============================================================================
  const userCcompRows = usersOrderedByDept.map((u, idx) => {
    const tot = u.totalCcomp ?? 0;
    const sub = u.submittedCcomp ?? 0;
    const notSub = u.notSubmittedCcomp ?? Math.max(0, tot - sub);
    const mgrApp = u.approvedCcomp ?? 0;
    const notMgrApp = u.notApprovedCcomp ?? Math.max(0, tot - mgrApp);
    const aud = u.auditedCcomp ?? 0;
    const notAud = u.notAuditedCcomp ?? Math.max(0, tot - aud);

    const q1 = u.ccompQuarters?.q1 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q2 = u.ccompQuarters?.q2 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q3 = u.ccompQuarters?.q3 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q4 = u.ccompQuarters?.q4 || { total: tot, submitted: 0, approved: 0, audited: 0 };

    return {
      '#': idx + 1, // Col A
      'Official Name': u.fullName, // Col B
      'Email': u.email, // Col C
      'Entity': u.entity, // Col D
      'Canonical Department': u.department, // Col E
      'Designation': u.jobFunction, // Col F
      'Line Manager': u.manager || '—', // Col G
      'Active Period': quarter.toUpperCase(), // Col H
      'Total Core Competencies': tot, // Col I
      'Core Comp Submitted': sub, // Col J
      'Core Comp Not Submitted': notSub, // Col K
      'Core Comp Approved by Manager': mgrApp, // Col L
      'Core Comp Not Approved': notMgrApp, // Col M
      'Core Comp Audited': aud, // Col N
      'Core Comp Not Audited': notAud, // Col O
      'Q1 Core Comp Submitted': q1.submitted, // Col P
      'Q1 Core Comp Approved by Manager': q1.approved, // Col Q
      'Q1 Core Comp Audited': q1.audited, // Col R
      'Q2 Core Comp Submitted': q2.submitted, // Col S
      'Q2 Core Comp Approved by Manager': q2.approved, // Col T
      'Q2 Core Comp Audited': q2.audited, // Col U
      'Q3 Core Comp Submitted': q3.submitted, // Col V
      'Q3 Core Comp Approved by Manager': q3.approved, // Col W
      'Q3 Core Comp Audited': q3.audited, // Col X
      'Q4 Core Comp Submitted': q4.submitted, // Col Y
      'Q4 Core Comp Approved by Manager': q4.approved, // Col Z
      'Q4 Core Comp Audited': q4.audited // Col AA
    };
  });

  const wsCcomp = XLSX.utils.json_to_sheet(userCcompRows);
  wsCcomp['!autofilter'] = { ref: `A1:AA${Math.max(2, userCcompRows.length + 1)}` };
  wsCcomp['!cols'] = wsJscs['!cols'];
  XLSX.utils.book_append_sheet(wb, wsCcomp, sheet5Name);

  // ============================================================================
  // SHEET 6: PDPs Per User & Quarter (Q1, Q2, Q3, Q4 + Active Quarter + Charts)
  // ============================================================================
  const userPdpRows = usersOrderedByDept.map((u, idx) => {
    const tot = u.totalPdps ?? 0;
    const sub = u.submittedPdps ?? 0;
    const notSub = u.notSubmittedPdps ?? Math.max(0, tot - sub);
    const mgrApp = u.approvedPdps ?? 0;
    const notMgrApp = u.notApprovedPdps ?? Math.max(0, tot - mgrApp);
    const aud = u.auditedPdps ?? 0;
    const notAud = u.notAuditedPdps ?? Math.max(0, tot - aud);

    const q1 = u.pdpQuarters?.q1 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q2 = u.pdpQuarters?.q2 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q3 = u.pdpQuarters?.q3 || { total: tot, submitted: 0, approved: 0, audited: 0 };
    const q4 = u.pdpQuarters?.q4 || { total: tot, submitted: 0, approved: 0, audited: 0 };

    return {
      '#': idx + 1, // Col A
      'Official Name': u.fullName, // Col B
      'Email': u.email, // Col C
      'Entity': u.entity, // Col D
      'Canonical Department': u.department, // Col E
      'Designation': u.jobFunction, // Col F
      'Line Manager': u.manager || '—', // Col G
      'Active Period': quarter.toUpperCase(), // Col H
      'Total PDPs': tot, // Col I
      'PDPs Submitted': sub, // Col J
      'PDPs Not Submitted': notSub, // Col K
      'PDPs Approved by Manager': mgrApp, // Col L
      'PDPs Not Approved': notMgrApp, // Col M
      'PDPs Audited': aud, // Col N
      'PDPs Not Audited': notAud, // Col O
      'Q1 PDPs Submitted': q1.submitted, // Col P
      'Q1 PDPs Approved by Manager': q1.approved, // Col Q
      'Q1 PDPs Audited': q1.audited, // Col R
      'Q2 PDPs Submitted': q2.submitted, // Col S
      'Q2 PDPs Approved by Manager': q2.approved, // Col T
      'Q2 PDPs Audited': q2.audited, // Col U
      'Q3 PDPs Submitted': q3.submitted, // Col V
      'Q3 PDPs Approved by Manager': q3.approved, // Col W
      'Q3 PDPs Audited': q3.audited, // Col X
      'Q4 PDPs Submitted': q4.submitted, // Col Y
      'Q4 PDPs Approved by Manager': q4.approved, // Col Z
      'Q4 PDPs Audited': q4.audited // Col AA
    };
  });

  const wsPdps = XLSX.utils.json_to_sheet(userPdpRows);
  wsPdps['!autofilter'] = { ref: `A1:AA${Math.max(2, userPdpRows.length + 1)}` };
  wsPdps['!cols'] = wsJscs['!cols'];
  XLSX.utils.book_append_sheet(wb, wsPdps, sheet6Name);

  // ============================================================================
  // SHEET 7: Detailed Item Audit Ledger (KPIs, JSCs, Core Competencies, PDPs)
  // ============================================================================
  const itemLedgerRows: Record<string, any>[] = [];
  for (const u of usersOrderedByDept) {
    // 1. KPIs
    for (const k of u.kpiDetails || []) {
      itemLedgerRows.push({
        'Official Name': u.fullName,
        'Email': u.email,
        'Entity': u.entity,
        'Canonical Department': u.department,
        'Line Manager': u.manager || '—',
        'Period': quarter.toUpperCase(),
        'Dimension': 'KPI',
        'Item # / Code': k.kpiNo,
        'KPA / Category': k.kpaName || '—',
        'Description / Title': k.kpiTitle,
        'Target / Weight': k.target,
        'Actual / Progress': k.actual,
        'Self Score': k.selfScore,
        'Manager Score': k.managerScore,
        'Auditor Score': k.auditorScore || '—',
        'POE Docs Count': k.poeDocsCount,
        'POE Attachments': k.poeDocNames.join('; '),
        'Submitted?': k.isNa ? 'N/A' : k.isSubmitted ? 'Submitted' : 'Not Submitted',
        'Approved by Manager?': k.isNa
          ? 'N/A'
          : k.isApproved
          ? 'Approved'
          : k.isAwaitingManager
          ? 'Awaiting Manager'
          : 'Not Approved',
        'Audited?': k.isNa
          ? 'N/A'
          : k.isAudited
          ? 'Audited'
          : k.isAwaitingAudit
          ? 'Awaiting Audit'
          : 'Not Audited',
        'Workflow Status': k.statusLabel
      });
    }
    // 2. JSCs
    for (const j of u.jscDetails || []) {
      itemLedgerRows.push({
        'Official Name': u.fullName,
        'Email': u.email,
        'Entity': u.entity,
        'Canonical Department': u.department,
        'Line Manager': u.manager || '—',
        'Period': quarter.toUpperCase(),
        'Dimension': 'JSC',
        'Item # / Code': j.code,
        'KPA / Category': 'Job Specific Competency',
        'Description / Title': j.title,
        'Target / Weight': j.weight || j.milestoneOrTarget || '—',
        'Actual / Progress': j.progressOrOutcome || '—',
        'Self Score': j.selfScore,
        'Manager Score': j.managerScore,
        'Auditor Score': j.auditorScore || '—',
        'POE Docs Count': j.poeDocsCount,
        'POE Attachments': j.poeDocNames.join('; '),
        'Submitted?': j.isSubmitted ? 'Submitted' : 'Not Submitted',
        'Approved by Manager?': j.isApproved ? 'Approved' : 'Not Approved',
        'Audited?': j.isAudited ? 'Audited' : 'Not Audited',
        'Workflow Status': j.statusLabel
      });
    }
    // 3. Core Competencies
    for (const c of u.ccompDetails || []) {
      itemLedgerRows.push({
        'Official Name': u.fullName,
        'Email': u.email,
        'Entity': u.entity,
        'Canonical Department': u.department,
        'Line Manager': u.manager || '—',
        'Period': quarter.toUpperCase(),
        'Dimension': 'Core Competency',
        'Item # / Code': c.code,
        'KPA / Category': 'Core Managerial / Occupational Competency',
        'Description / Title': c.title,
        'Target / Weight': c.weight || '—',
        'Actual / Progress': c.progressOrOutcome || '—',
        'Self Score': c.selfScore,
        'Manager Score': c.managerScore,
        'Auditor Score': c.auditorScore || '—',
        'POE Docs Count': c.poeDocsCount,
        'POE Attachments': c.poeDocNames.join('; '),
        'Submitted?': c.isSubmitted ? 'Submitted' : 'Not Submitted',
        'Approved by Manager?': c.isApproved ? 'Approved' : 'Not Approved',
        'Audited?': c.isAudited ? 'Audited' : 'Not Audited',
        'Workflow Status': c.statusLabel
      });
    }
    // 4. PDPs
    for (const p of u.pdpDetails || []) {
      itemLedgerRows.push({
        'Official Name': u.fullName,
        'Email': u.email,
        'Entity': u.entity,
        'Canonical Department': u.department,
        'Line Manager': u.manager || '—',
        'Period': quarter.toUpperCase(),
        'Dimension': 'PDP',
        'Item # / Code': p.code,
        'KPA / Category': 'Personal Development Plan',
        'Description / Title': p.title,
        'Target / Weight': p.milestoneOrTarget || '—',
        'Actual / Progress': p.progressOrOutcome || '—',
        'Self Score': p.selfScore,
        'Manager Score': p.managerScore,
        'Auditor Score': p.auditorScore || '—',
        'POE Docs Count': p.poeDocsCount,
        'POE Attachments': p.poeDocNames.join('; '),
        'Submitted?': p.isSubmitted ? 'Submitted' : 'Not Submitted',
        'Approved by Manager?': p.isApproved ? 'Approved' : 'Not Approved',
        'Audited?': p.isAudited ? 'Audited' : 'Not Audited',
        'Workflow Status': p.statusLabel
      });
    }
  }

  if (itemLedgerRows.length > 0) {
    const wsLedger = XLSX.utils.json_to_sheet(itemLedgerRows);
    wsLedger['!autofilter'] = { ref: `A1:U${itemLedgerRows.length + 1}` };
    wsLedger['!cols'] = [
      { wch: 26 },
      { wch: 30 },
      { wch: 14 },
      { wch: 34 },
      { wch: 24 },
      { wch: 10 },
      { wch: 16 },
      { wch: 14 },
      { wch: 32 },
      { wch: 52 },
      { wch: 16 },
      { wch: 18 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 14 },
      { wch: 36 },
      { wch: 16 },
      { wch: 22 },
      { wch: 18 },
      { wch: 28 }
    ];
    XLSX.utils.book_append_sheet(wb, wsLedger, sheet7Name);
  }

  // Generate base XLSX ZIP archive
  const wbArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const zip = await JSZip.loadAsync(wbArrayBuffer);

  const contentTypeOverrides: string[] = [];
  let nextChartGlobalId = 1;

  // ============================================================================
  // DRAWING 1 ON SHEET 1: Executive Donut Charts + Quarterly Comparison + Per-Dept KPI Bar Charts
  // ============================================================================
  const sheet1Charts: NativeChartPlacement[] = [];
  const baseChartRow = deptRows.length + 4;

  // Chart 1: Interactive KPI Submission Ratio Donut Chart (bound to Sheet 1 X2:Y4)
  sheet1Charts.push({
    name: 'KPI Submission Ratio',
    fromCol: 0,
    fromRow: baseChartRow,
    toCol: 4,
    toRow: baseChartRow + 18,
    chartXml: buildNativeDonutChartXml({
      title: `1. KPI Submission Ratio (${quarter.toUpperCase()})`,
      seriesName: 'KPI Submission Ratio',
      catFormula: `'${sheet1Name}'!$X$2:$X$4`,
      valFormula: `'${sheet1Name}'!$Y$2:$Y$4`,
      categories: ['KPIs Submitted', 'KPIs Not Submitted', 'Not Applicable (N/A)'],
      values: [filteredTotals.submittedKpis, filteredTotals.notSubmittedKpis, filteredTotals.naKpis],
      sliceGradients: [
        { start: '#60A5FA', end: '#1D4ED8' },
        { start: '#FCD34D', end: '#D97706' },
        { start: '#94A3B8', end: '#475569' }
      ]
    })
  });

  // Chart 2: Interactive Manager Approval Ratio Donut Chart (bound to Sheet 1 X5:Y7)
  sheet1Charts.push({
    name: 'Manager Approval Ratio',
    fromCol: 4,
    fromRow: baseChartRow,
    toCol: 8,
    toRow: baseChartRow + 18,
    chartXml: buildNativeDonutChartXml({
      title: `2. Manager Approval Ratio (${quarter.toUpperCase()})`,
      seriesName: 'Manager Approval Ratio',
      catFormula: `'${sheet1Name}'!$X$5:$X$7`,
      valFormula: `'${sheet1Name}'!$Y$5:$Y$7`,
      categories: ['Approved by Manager', 'Awaiting Manager Approval', 'Not Approved / Unsubmitted'],
      values: [filteredTotals.approvedKpis, filteredTotals.awaitingManagerKpis, unapprovedOther],
      sliceGradients: [
        { start: '#34D399', end: '#047857' },
        { start: '#38BDF8', end: '#0369A1' },
        { start: '#FB7185', end: '#BE123C' }
      ]
    })
  });

  // Chart 3: Interactive KPI Internal Audit Ratio Donut Chart (bound to Sheet 1 X8:Y10)
  sheet1Charts.push({
    name: 'KPI Internal Audit Ratio',
    fromCol: 8,
    fromRow: baseChartRow,
    toCol: 12,
    toRow: baseChartRow + 18,
    chartXml: buildNativeDonutChartXml({
      title: `3. KPIs Audited Ratio (${quarter.toUpperCase()})`,
      seriesName: 'KPIs Audited Ratio',
      catFormula: `'${sheet1Name}'!$X$8:$X$10`,
      valFormula: `'${sheet1Name}'!$Y$8:$Y$10`,
      categories: ['KPIs Audited', 'Awaiting Internal Audit', 'Not Audited / Unsubmitted'],
      values: [totalAuditedKpis, totalAwaitingAuditKpis, unauditedOther],
      sliceGradients: [
        { start: '#A78BFA', end: '#6D28D9' },
        { start: '#38BDF8', end: '#0284C7' },
        { start: '#94A3B8', end: '#475569' }
      ]
    })
  });

  // Chart 4: Interactive Applicable KPIs by Department Donut Chart (bound to Sheet 1 B2:B{N} and H2:H{N})
  const deptEndRow = Math.max(2, departmentStats.length + 1);
  sheet1Charts.push({
    name: 'Applicable KPIs by Department',
    fromCol: 12,
    fromRow: baseChartRow,
    toCol: 17,
    toRow: baseChartRow + 18,
    chartXml: buildNativeDonutChartXml({
      title: `4. Applicable KPIs by Department (${quarter.toUpperCase()})`,
      seriesName: 'Applicable KPIs',
      catFormula: `'${sheet1Name}'!$B$2:$B$${deptEndRow}`,
      valFormula: `'${sheet1Name}'!$H$2:$H$${deptEndRow}`,
      categories: departmentStats.map(d => d.department),
      values: departmentStats.map(d => d.applicableKpis),
      sliceGradients: [
        { start: '#10B981', end: '#047857' },
        { start: '#3B82F6', end: '#1D4ED8' },
        { start: '#6366F1', end: '#4338CA' },
        { start: '#F59E0B', end: '#B45309' },
        { start: '#EC4899', end: '#BE185D' },
        { start: '#14B8A6', end: '#0F766E' },
        { start: '#8B5CF6', end: '#5B21B6' },
        { start: '#F97316', end: '#C2410C' },
        { start: '#06B6D4', end: '#0E7490' }
      ]
    })
  });

  // Chart 5: Interactive Quarterly (Q1–Q4) Multi-Dimension Progression Bar Chart (bound to Sheet 1 AA2:AM5)
  sheet1Charts.push({
    name: 'Quarterly Q1-Q4 Multi-Dimension Progression',
    fromCol: 0,
    fromRow: baseChartRow + 20,
    toCol: 17,
    toRow: baseChartRow + 40,
    chartXml: buildNativeBarChartXml({
      title: '5. Quarterly (Q1–Q4) Progression — KPIs, JSCs, Core Competencies & PDPs (Submitted, Approved & Audited)',
      catFormula: `'${sheet1Name}'!$AA$2:$AA$5`,
      categories: ['Q1', 'Q2', 'Q3', 'Q4'],
      seriesList: [
        {
          name: 'KPIs Submitted',
          headerFormula: `'${sheet1Name}'!$AB$1`,
          valFormula: `'${sheet1Name}'!$AB$2:$AB$5`,
          values: quarterlyRollup.map(q => q.kpiSub),
          colorStart: '#3B82F6',
          colorEnd: '#1D4ED8'
        },
        {
          name: 'KPIs Approved by Manager',
          headerFormula: `'${sheet1Name}'!$AC$1`,
          valFormula: `'${sheet1Name}'!$AC$2:$AC$5`,
          values: quarterlyRollup.map(q => q.kpiApp),
          colorStart: '#10B981',
          colorEnd: '#047857'
        },
        {
          name: 'KPIs Audited',
          headerFormula: `'${sheet1Name}'!$AD$1`,
          valFormula: `'${sheet1Name}'!$AD$2:$AD$5`,
          values: quarterlyRollup.map(q => q.kpiAud),
          colorStart: '#8B5CF6',
          colorEnd: '#5B21B6'
        },
        {
          name: 'JSCs Submitted',
          headerFormula: `'${sheet1Name}'!$AE$1`,
          valFormula: `'${sheet1Name}'!$AE$2:$AE$5`,
          values: quarterlyRollup.map(q => q.jscSub),
          colorStart: '#F59E0B',
          colorEnd: '#B45309'
        },
        {
          name: 'Core Comp Submitted',
          headerFormula: `'${sheet1Name}'!$AH$1`,
          valFormula: `'${sheet1Name}'!$AH$2:$AH$5`,
          values: quarterlyRollup.map(q => q.ccSub),
          colorStart: '#EC4899',
          colorEnd: '#BE185D'
        },
        {
          name: 'PDPs Submitted',
          headerFormula: `'${sheet1Name}'!$AK$1`,
          valFormula: `'${sheet1Name}'!$AK$2:$AK$5`,
          values: quarterlyRollup.map(q => q.pdpSub),
          colorStart: '#14B8A6',
          colorEnd: '#0F766E'
        }
      ]
    })
  });

  // Per-Department Individual Officials KPI Bar Graphs on Sheet 1 (bound to Sheet 2)
  let currentBarAnchorRow = baseChartRow + 42;
  for (const deptStat of departmentStats) {
    const rangeInfo = deptRowRanges.get(deptStat.department);
    if (!rangeInfo || rangeInfo.officials.length === 0) continue;

    const { startRow, endRow, officials } = rangeInfo;
    const catFormula = `'${sheet2Name}'!$B$${startRow}:$B$${endRow}`;

    const deptChartXml = buildNativeBarChartXml({
      title: `${deptStat.department} — Individual Officials KPIs (Submitted, Approved by Manager, Audited) (${quarter.toUpperCase()})`,
      catFormula,
      categories: officials.map(u => u.fullName),
      seriesList: [
        {
          name: 'KPIs Submitted',
          headerFormula: `'${sheet2Name}'!$N$1`,
          valFormula: `'${sheet2Name}'!$N$${startRow}:$N$${endRow}`,
          values: officials.map(u => u.submittedKpis),
          colorStart: '#3B82F6',
          colorEnd: '#1D4ED8'
        },
        {
          name: 'KPIs Approved by Manager',
          headerFormula: `'${sheet2Name}'!$Q$1`,
          valFormula: `'${sheet2Name}'!$Q$${startRow}:$Q$${endRow}`,
          values: officials.map(u => u.approvedKpis),
          colorStart: '#10B981',
          colorEnd: '#047857'
        },
        {
          name: 'KPIs Audited',
          headerFormula: `'${sheet2Name}'!$U$1`,
          valFormula: `'${sheet2Name}'!$U$${startRow}:$U$${endRow}`,
          values: officials.map(u => u.auditedKpis || 0),
          colorStart: '#8B5CF6',
          colorEnd: '#5B21B6'
        },
        {
          name: 'KPIs Not Submitted',
          headerFormula: `'${sheet2Name}'!$O$1`,
          valFormula: `'${sheet2Name}'!$O$${startRow}:$O$${endRow}`,
          values: officials.map(u => u.notSubmittedKpis),
          colorStart: '#FBBF24',
          colorEnd: '#D97706'
        }
      ]
    });

    sheet1Charts.push({
      name: `KPI Bar Graph - ${deptStat.shortName}`,
      fromCol: 0,
      fromRow: currentBarAnchorRow,
      toCol: 17,
      toRow: currentBarAnchorRow + 22,
      chartXml: deptChartXml
    });

    currentBarAnchorRow += 24;
  }

  nextChartGlobalId = await attachChartsToWorksheet({
    zip,
    sheetIdx: 1,
    drawingIdx: 1,
    charts: sheet1Charts,
    startingChartGlobalId: nextChartGlobalId,
    contentTypeOverrides
  });

  // ============================================================================
  // DRAWING 2 ON SHEET 3 ('KPAs Per User & Dept'): Interactive KPA Bar Charts Per Department
  // ============================================================================
  const sheet3KpaCharts: NativeChartPlacement[] = [];
  let kpaChartRow = userKpaRows.length + 4;
  for (const deptStat of departmentStats) {
    const rangeInfo = deptRowRanges.get(deptStat.department);
    if (!rangeInfo || rangeInfo.officials.length === 0) continue;
    const { startRow, endRow, officials } = rangeInfo;

    sheet3KpaCharts.push({
      name: `KPA Bar Graph - ${deptStat.shortName}`,
      fromCol: 0,
      fromRow: kpaChartRow,
      toCol: 15,
      toRow: kpaChartRow + 20,
      chartXml: buildNativeBarChartXml({
        title: `${deptStat.department} — Individual Officials KPAs (Submitted, Manager Approved, Audited) (${quarter.toUpperCase()})`,
        catFormula: `'${sheet3Name}'!$B$${startRow}:$B$${endRow}`,
        categories: officials.map(u => u.fullName),
        seriesList: [
          {
            name: 'Applicable KPAs',
            headerFormula: `'${sheet3Name}'!$J$1`,
            valFormula: `'${sheet3Name}'!$J$${startRow}:$J$${endRow}`,
            values: officials.map(u => u.applicableKpas ?? u.totalKpas ?? 0),
            colorStart: '#64748B',
            colorEnd: '#334155'
          },
          {
            name: 'KPAs Submitted',
            headerFormula: `'${sheet3Name}'!$K$1`,
            valFormula: `'${sheet3Name}'!$K$${startRow}:$K$${endRow}`,
            values: officials.map(u => u.submittedKpas || 0),
            colorStart: '#3B82F6',
            colorEnd: '#1D4ED8'
          },
          {
            name: 'KPAs Approved by Manager',
            headerFormula: `'${sheet3Name}'!$M$1`,
            valFormula: `'${sheet3Name}'!$M$${startRow}:$M$${endRow}`,
            values: officials.map(u => u.approvedKpas || 0),
            colorStart: '#10B981',
            colorEnd: '#047857'
          },
          {
            name: 'KPAs Audited',
            headerFormula: `'${sheet3Name}'!$O$1`,
            valFormula: `'${sheet3Name}'!$O$${startRow}:$O$${endRow}`,
            values: officials.map(u => u.auditedKpas || 0),
            colorStart: '#8B5CF6',
            colorEnd: '#5B21B6'
          }
        ]
      })
    });
    kpaChartRow += 22;
  }

  nextChartGlobalId = await attachChartsToWorksheet({
    zip,
    sheetIdx: 3,
    drawingIdx: 2,
    charts: sheet3KpaCharts,
    startingChartGlobalId: nextChartGlobalId,
    contentTypeOverrides
  });

  // ============================================================================
  // DRAWING 3 ON SHEET 4 ('JSCs Per User & Quarter'): Interactive JSC Bar Charts Per Dept & Quarter
  // ============================================================================
  const sheet4JscCharts: NativeChartPlacement[] = [];
  let jscChartRow = userJscRows.length + 4;
  for (const deptStat of departmentStats) {
    const rangeInfo = deptRowRanges.get(deptStat.department);
    if (!rangeInfo || rangeInfo.officials.length === 0) continue;
    const { startRow, endRow, officials } = rangeInfo;

    sheet4JscCharts.push({
      name: `JSC Bar Graph - ${deptStat.shortName}`,
      fromCol: 0,
      fromRow: jscChartRow,
      toCol: 16,
      toRow: jscChartRow + 20,
      chartXml: buildNativeBarChartXml({
        title: `${deptStat.department} — Individual Officials JSCs (Total, Submitted, Approved by Manager, Audited) (${quarter.toUpperCase()})`,
        catFormula: `'${sheet4Name}'!$B$${startRow}:$B$${endRow}`,
        categories: officials.map(u => u.fullName),
        seriesList: [
          {
            name: 'Total JSCs',
            headerFormula: `'${sheet4Name}'!$I$1`,
            valFormula: `'${sheet4Name}'!$I$${startRow}:$I$${endRow}`,
            values: officials.map(u => u.totalJscs || 0),
            colorStart: '#64748B',
            colorEnd: '#334155'
          },
          {
            name: 'JSCs Submitted',
            headerFormula: `'${sheet4Name}'!$J$1`,
            valFormula: `'${sheet4Name}'!$J$${startRow}:$J$${endRow}`,
            values: officials.map(u => u.submittedJscs || 0),
            colorStart: '#3B82F6',
            colorEnd: '#1D4ED8'
          },
          {
            name: 'JSCs Approved by Manager',
            headerFormula: `'${sheet4Name}'!$L$1`,
            valFormula: `'${sheet4Name}'!$L$${startRow}:$L$${endRow}`,
            values: officials.map(u => u.approvedJscs || 0),
            colorStart: '#10B981',
            colorEnd: '#047857'
          },
          {
            name: 'JSCs Audited',
            headerFormula: `'${sheet4Name}'!$N$1`,
            valFormula: `'${sheet4Name}'!$N$${startRow}:$N$${endRow}`,
            values: officials.map(u => u.auditedJscs || 0),
            colorStart: '#8B5CF6',
            colorEnd: '#5B21B6'
          }
        ]
      })
    });
    jscChartRow += 22;
  }

  nextChartGlobalId = await attachChartsToWorksheet({
    zip,
    sheetIdx: 4,
    drawingIdx: 3,
    charts: sheet4JscCharts,
    startingChartGlobalId: nextChartGlobalId,
    contentTypeOverrides
  });

  // ============================================================================
  // DRAWING 4 ON SHEET 5 ('Core Comp Per User & Qtr'): Interactive Core Comp Bar Charts Per Dept
  // ============================================================================
  const sheet5CcompCharts: NativeChartPlacement[] = [];
  let ccChartRow = userCcompRows.length + 4;
  for (const deptStat of departmentStats) {
    const rangeInfo = deptRowRanges.get(deptStat.department);
    if (!rangeInfo || rangeInfo.officials.length === 0) continue;
    const { startRow, endRow, officials } = rangeInfo;

    sheet5CcompCharts.push({
      name: `Core Comp Bar Graph - ${deptStat.shortName}`,
      fromCol: 0,
      fromRow: ccChartRow,
      toCol: 16,
      toRow: ccChartRow + 20,
      chartXml: buildNativeBarChartXml({
        title: `${deptStat.department} — Individual Officials Core Competencies (Total, Submitted, Approved by Manager, Audited) (${quarter.toUpperCase()})`,
        catFormula: `'${sheet5Name}'!$B$${startRow}:$B$${endRow}`,
        categories: officials.map(u => u.fullName),
        seriesList: [
          {
            name: 'Total Core Competencies',
            headerFormula: `'${sheet5Name}'!$I$1`,
            valFormula: `'${sheet5Name}'!$I$${startRow}:$I$${endRow}`,
            values: officials.map(u => u.totalCcomp || 0),
            colorStart: '#64748B',
            colorEnd: '#334155'
          },
          {
            name: 'Core Comp Submitted',
            headerFormula: `'${sheet5Name}'!$J$1`,
            valFormula: `'${sheet5Name}'!$J$${startRow}:$J$${endRow}`,
            values: officials.map(u => u.submittedCcomp || 0),
            colorStart: '#3B82F6',
            colorEnd: '#1D4ED8'
          },
          {
            name: 'Core Comp Approved by Manager',
            headerFormula: `'${sheet5Name}'!$L$1`,
            valFormula: `'${sheet5Name}'!$L$${startRow}:$L$${endRow}`,
            values: officials.map(u => u.approvedCcomp || 0),
            colorStart: '#10B981',
            colorEnd: '#047857'
          },
          {
            name: 'Core Comp Audited',
            headerFormula: `'${sheet5Name}'!$N$1`,
            valFormula: `'${sheet5Name}'!$N$${startRow}:$N$${endRow}`,
            values: officials.map(u => u.auditedCcomp || 0),
            colorStart: '#8B5CF6',
            colorEnd: '#5B21B6'
          }
        ]
      })
    });
    ccChartRow += 22;
  }

  nextChartGlobalId = await attachChartsToWorksheet({
    zip,
    sheetIdx: 5,
    drawingIdx: 4,
    charts: sheet5CcompCharts,
    startingChartGlobalId: nextChartGlobalId,
    contentTypeOverrides
  });

  // ============================================================================
  // DRAWING 5 ON SHEET 6 ('PDPs Per User & Quarter'): Interactive PDP Bar Charts Per Dept
  // ============================================================================
  const sheet6PdpCharts: NativeChartPlacement[] = [];
  let pdpChartRow = userPdpRows.length + 4;
  for (const deptStat of departmentStats) {
    const rangeInfo = deptRowRanges.get(deptStat.department);
    if (!rangeInfo || rangeInfo.officials.length === 0) continue;
    const { startRow, endRow, officials } = rangeInfo;

    sheet6PdpCharts.push({
      name: `PDP Bar Graph - ${deptStat.shortName}`,
      fromCol: 0,
      fromRow: pdpChartRow,
      toCol: 16,
      toRow: pdpChartRow + 20,
      chartXml: buildNativeBarChartXml({
        title: `${deptStat.department} — Individual Officials PDPs (Total, Submitted, Approved by Manager, Audited) (${quarter.toUpperCase()})`,
        catFormula: `'${sheet6Name}'!$B$${startRow}:$B$${endRow}`,
        categories: officials.map(u => u.fullName),
        seriesList: [
          {
            name: 'Total PDPs',
            headerFormula: `'${sheet6Name}'!$I$1`,
            valFormula: `'${sheet6Name}'!$I$${startRow}:$I$${endRow}`,
            values: officials.map(u => u.totalPdps || 0),
            colorStart: '#64748B',
            colorEnd: '#334155'
          },
          {
            name: 'PDPs Submitted',
            headerFormula: `'${sheet6Name}'!$J$1`,
            valFormula: `'${sheet6Name}'!$J$${startRow}:$J$${endRow}`,
            values: officials.map(u => u.submittedPdps || 0),
            colorStart: '#3B82F6',
            colorEnd: '#1D4ED8'
          },
          {
            name: 'PDPs Approved by Manager',
            headerFormula: `'${sheet6Name}'!$L$1`,
            valFormula: `'${sheet6Name}'!$L$${startRow}:$L$${endRow}`,
            values: officials.map(u => u.approvedPdps || 0),
            colorStart: '#10B981',
            colorEnd: '#047857'
          },
          {
            name: 'PDPs Audited',
            headerFormula: `'${sheet6Name}'!$N$1`,
            valFormula: `'${sheet6Name}'!$N$${startRow}:$N$${endRow}`,
            values: officials.map(u => u.auditedPdps || 0),
            colorStart: '#8B5CF6',
            colorEnd: '#5B21B6'
          }
        ]
      })
    });
    pdpChartRow += 22;
  }

  nextChartGlobalId = await attachChartsToWorksheet({
    zip,
    sheetIdx: 6,
    drawingIdx: 5,
    charts: sheet6PdpCharts,
    startingChartGlobalId: nextChartGlobalId,
    contentTypeOverrides
  });

  // Register all drawing*.xml and chart*.xml parts in [Content_Types].xml
  const contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile && contentTypeOverrides.length > 0) {
    let ctXml = await contentTypesFile.async('string');
    const uniqueOverrides = Array.from(new Set(contentTypeOverrides));
    ctXml = ctXml.replace('</Types>', `${uniqueOverrides.join('\n')}\n</Types>`);
    zip.file('[Content_Types].xml', ctXml);
  }

  // Generate final .xlsx blob and trigger download
  const finalBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const entityTag = entityFilter === 'ALL' ? 'All_Entities' : entityFilter.replace(/\s+/g, '_');
  const fileName = `IPMS_Full_Interactive_Report_KPI_KPA_JSC_CoreComp_PDP_${entityTag}_${quarter.toUpperCase()}_${new Date()
    .toISOString()
    .slice(0, 10)}.xlsx`;

  const url = URL.createObjectURL(finalBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}
