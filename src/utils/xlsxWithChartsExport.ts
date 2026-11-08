import * as XLSX from 'xlsx';
import JSZip from 'jszip';

export interface ExportKpiDetailItem {
  index: number;
  id: string;
  kpiNo: string;
  kpiTitle: string;
  target: string;
  actual: string;
  selfScore: string;
  managerScore: string;
  poeDocsCount: number;
  poeDocNames: string[];
  reviewStatus: string;
  qPoeStatus: string;
  statusLabel: string;
  isNa: boolean;
  isSubmitted: boolean;
  isApproved: boolean;
  isAwaitingManager: boolean;
  isRevisionRequired: boolean;
  isDraftInProgress: boolean;
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
  awaitingManagerApprovalKpis: number;
  revisionRequiredKpis: number;
  draftInProgressKpis: number;
  submissionRate: number;
  approvalRate: number;
  overallStatus: string;
  kpiDetails: ExportKpiDetailItem[];
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
  awaitingManagerKpis: number;
  submissionRate: number;
  approvalRate: number;
}

export interface ExportFilteredTotals {
  totalUsers: number;
  usersWithKpis: number;
  fullySubmittedUsers: number;
  fullyApprovedUsers: number;
  totalKpis: number;
  naKpis: number;
  applicableKpis: number;
  submittedKpis: number;
  notSubmittedKpis: number;
  approvedKpis: number;
  notApprovedKpis: number;
  awaitingManagerKpis: number;
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
 * plotting every individual official in a Department along the X-axis with 4 gradient-shaded series
 * bound directly to the 'Per-User KPI Summary' worksheet cell ranges.
 */
function buildNativeDepartmentBarChartXml(params: {
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

/**
 * Generates an OpenXML (.xlsx) workbook with:
 * - Sheet 1 ('Department Summary & Charts'):
 *   - Departmental Summary table + AutoFilter
 *   - 3 Live Interactive OpenXML Donut/Pie Charts + Live Interactive Per-Department Individual Officials Bar Graphs
 *     with native DrawingML <a:gradFill> gradient shading and live cell-range formulas (<c:f>)
 * - Sheet 2 ('Per-User KPI Summary'):
 *   - Grouped by canonical department so each department's individual bar chart binds directly to its exact contiguous row range
 * - Sheet 3 ('Detailed KPI Breakdown'):
 *   - Every individual KPI row with AutoFilter enabled
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
  const sheet1Name = 'Department Summary & Charts';
  const sheet2Name = 'Per-User KPI Summary';
  const sheet3Name = 'Detailed KPI Breakdown';

  // 1. Build Sheet 1: Departmental & Executive Summary Table
  const deptRows = departmentStats.map((d, idx) => ({
    '#': idx + 1,
    'Canonical Department / Directorate': d.department,
    'Total Officials': d.totalOfficials,
    'Officials With Assigned KPIs': d.officialsWithKpis,
    'Period': quarter.toUpperCase(),
    'Total Assigned KPIs': d.totalKpis,
    'N/A KPIs': d.naKpis,
    'Applicable KPIs': d.applicableKpis,
    'KPIs Submitted': d.submittedKpis,
    'KPIs Not Submitted': d.notSubmittedKpis,
    'Submission Rate (%)': `${d.submissionRate}%`,
    'KPIs Approved': d.approvedKpis,
    'KPIs Not Approved': d.notApprovedKpis,
    'KPIs Awaiting Manager Approval': d.awaitingManagerKpis,
    'Approval Rate (%)': `${d.approvalRate}%`
  }));

  deptRows.push({
    '#': '' as any,
    'Canonical Department / Directorate': 'TOTAL (CURRENT VIEW)',
    'Total Officials': filteredTotals.totalUsers,
    'Officials With Assigned KPIs': filteredTotals.usersWithKpis,
    'Period': quarter.toUpperCase(),
    'Total Assigned KPIs': filteredTotals.totalKpis,
    'N/A KPIs': filteredTotals.naKpis,
    'Applicable KPIs': filteredTotals.applicableKpis,
    'KPIs Submitted': filteredTotals.submittedKpis,
    'KPIs Not Submitted': filteredTotals.notSubmittedKpis,
    'Submission Rate (%)':
      filteredTotals.applicableKpis > 0
        ? `${Math.round((filteredTotals.submittedKpis / filteredTotals.applicableKpis) * 100)}%`
        : '0%',
    'KPIs Approved': filteredTotals.approvedKpis,
    'KPIs Not Approved': filteredTotals.notApprovedKpis,
    'KPIs Awaiting Manager Approval': filteredTotals.awaitingManagerKpis,
    'Approval Rate (%)':
      filteredTotals.applicableKpis > 0
        ? `${Math.round((filteredTotals.approvedKpis / filteredTotals.applicableKpis) * 100)}%`
        : '0%'
  });

  const wsDepts = XLSX.utils.json_to_sheet(deptRows);

  // Add Executive Ratio Reference Cells in Columns Q & R (rows 1..7) on Sheet 1 so Pie Charts 1 & 2 bind to real cells
  const unapprovedOther = Math.max(0, filteredTotals.notApprovedKpis - filteredTotals.awaitingManagerKpis);
  XLSX.utils.sheet_add_aoa(
    wsDepts,
    [
      ['Executive Ratio Metric', 'KPI Count'],
      ['KPIs Submitted', filteredTotals.submittedKpis],
      ['KPIs Not Submitted', filteredTotals.notSubmittedKpis],
      ['Not Applicable (N/A)', filteredTotals.naKpis],
      ['Approved by Manager', filteredTotals.approvedKpis],
      ['Awaiting Manager Approval', filteredTotals.awaitingManagerKpis],
      ['Not Approved / Unsubmitted', unapprovedOther]
    ],
    { origin: 'Q1' }
  );

  wsDepts['!autofilter'] = { ref: `A1:O${Math.max(2, deptRows.length)}` };
  wsDepts['!cols'] = [
    { wch: 6 },
    { wch: 42 },
    { wch: 16 },
    { wch: 24 },
    { wch: 10 },
    { wch: 18 },
    { wch: 12 },
    { wch: 16 },
    { wch: 16 },
    { wch: 18 },
    { wch: 18 },
    { wch: 16 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 4 },
    { wch: 28 },
    { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, wsDepts, sheet1Name);

  // 2. Order users by Canonical Department (matching departmentStats order) then by Total KPIs desc
  //    so each Department's officials occupy a contiguous cell range on Sheet 2 ('Per-User KPI Summary')
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

  // Track the exact 1-based Excel row range [startRow, endRow] on Sheet 2 for each Department
  const deptRowRanges = new Map<
    string,
    { startRow: number; endRow: number; officials: ExportUserKpiRow[] }
  >();

  usersOrderedByDept.forEach((u, idx) => {
    const excelRow = idx + 2; // Row 1 is the header row
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

  const userSheetRows = usersOrderedByDept.map((u, idx) => ({
    '#': idx + 1,
    'Official Name': u.fullName,
    'Email': u.email,
    'Entity': u.entity,
    'Canonical Department': u.department,
    'Unit / Sub-Directorate': u.subDepartment || u.department,
    'Designation': u.jobFunction,
    'Line Manager (Approver)': u.manager || '—',
    'Manager Email': u.managerEmail || '—',
    'Period': quarter.toUpperCase(),
    'Total KPIs': u.totalKpis,
    'N/A KPIs': u.naKpis,
    'Applicable KPIs': u.applicableKpis,
    'KPIs Submitted': u.submittedKpis,
    'KPIs Not Submitted': u.notSubmittedKpis,
    'Submission Rate (%)': `${u.submissionRate}%`,
    'KPIs Approved': u.approvedKpis,
    'KPIs Not Approved': u.notApprovedKpis,
    'KPIs Awaiting Manager Approval': u.awaitingManagerApprovalKpis,
    'Approval Rate (%)': `${u.approvalRate}%`,
    'Overall Status': u.overallStatus
  }));

  const wsUsers = XLSX.utils.json_to_sheet(userSheetRows);
  wsUsers['!autofilter'] = { ref: `A1:U${Math.max(2, userSheetRows.length + 1)}` };
  wsUsers['!cols'] = [
    { wch: 6 },
    { wch: 28 },
    { wch: 34 },
    { wch: 16 },
    { wch: 36 },
    { wch: 32 },
    { wch: 32 },
    { wch: 26 },
    { wch: 32 },
    { wch: 10 },
    { wch: 12 },
    { wch: 12 },
    { wch: 15 },
    { wch: 15 },
    { wch: 18 },
    { wch: 18 },
    { wch: 15 },
    { wch: 18 },
    { wch: 26 },
    { wch: 16 },
    { wch: 24 }
  ];
  XLSX.utils.book_append_sheet(wb, wsUsers, sheet2Name);

  // 3. Build Sheet 3: Detailed KPI Breakdown
  const kpiBreakdownRows: Record<string, any>[] = [];
  for (const u of usersOrderedByDept) {
    for (const k of u.kpiDetails) {
      kpiBreakdownRows.push({
        'Official Name': u.fullName,
        'Email': u.email,
        'Entity': u.entity,
        'Canonical Department': u.department,
        'Line Manager': u.manager || '—',
        'Period': quarter.toUpperCase(),
        'KPI #': k.kpiNo,
        'KPI Description': k.kpiTitle,
        'Target': k.target,
        'Actual': k.actual,
        'Self Score': k.selfScore,
        'Manager Score': k.managerScore,
        'POE Docs Count': k.poeDocsCount,
        'POE Attachments': k.poeDocNames.join('; '),
        'Submitted?': k.isNa ? 'N/A' : k.isSubmitted ? 'Submitted' : 'Not Submitted',
        'Approved?': k.isNa
          ? 'N/A'
          : k.isApproved
          ? 'Approved'
          : k.isAwaitingManager
          ? 'Not Approved (Awaiting Manager)'
          : 'Not Approved',
        'Workflow Status': k.statusLabel
      });
    }
  }

  if (kpiBreakdownRows.length > 0) {
    const wsKpis = XLSX.utils.json_to_sheet(kpiBreakdownRows);
    wsKpis['!autofilter'] = { ref: `A1:Q${kpiBreakdownRows.length + 1}` };
    wsKpis['!cols'] = [
      { wch: 26 },
      { wch: 32 },
      { wch: 14 },
      { wch: 34 },
      { wch: 24 },
      { wch: 10 },
      { wch: 10 },
      { wch: 55 },
      { wch: 16 },
      { wch: 16 },
      { wch: 12 },
      { wch: 14 },
      { wch: 14 },
      { wch: 38 },
      { wch: 16 },
      { wch: 28 },
      { wch: 32 }
    ];
    XLSX.utils.book_append_sheet(wb, wsKpis, sheet3Name);
  }

  // Generate base XLSX ZIP archive
  const wbArrayBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const zip = await JSZip.loadAsync(wbArrayBuffer);

  // Build Native OpenXML Charts (xl/charts/chart1.xml .. chartN.xml)
  interface NativeChartPlacement {
    chartXml: string;
    name: string;
    fromCol: number;
    fromRow: number;
    toCol: number;
    toRow: number;
  }

  const charts: NativeChartPlacement[] = [];
  const baseChartRow = deptRows.length + 4;

  // Chart 1: Interactive KPI Submission Ratio Donut Chart (bound to Sheet 1 Q2:R4)
  charts.push({
    name: 'KPI Submission Ratio',
    fromCol: 0,
    fromRow: baseChartRow,
    toCol: 4,
    toRow: baseChartRow + 18,
    chartXml: buildNativeDonutChartXml({
      title: `1. KPI Submission Ratio (${quarter.toUpperCase()})`,
      seriesName: 'KPI Submission Ratio',
      catFormula: `'${sheet1Name}'!$Q$2:$Q$4`,
      valFormula: `'${sheet1Name}'!$R$2:$R$4`,
      categories: ['KPIs Submitted', 'KPIs Not Submitted', 'Not Applicable (N/A)'],
      values: [filteredTotals.submittedKpis, filteredTotals.notSubmittedKpis, filteredTotals.naKpis],
      sliceGradients: [
        { start: '#60A5FA', end: '#1D4ED8' },
        { start: '#FCD34D', end: '#D97706' },
        { start: '#94A3B8', end: '#475569' }
      ]
    })
  });

  // Chart 2: Interactive Manager Approval Ratio Donut Chart (bound to Sheet 1 Q5:R7)
  charts.push({
    name: 'Manager Approval Ratio',
    fromCol: 4,
    fromRow: baseChartRow,
    toCol: 9,
    toRow: baseChartRow + 18,
    chartXml: buildNativeDonutChartXml({
      title: `2. Manager Approval Ratio (${quarter.toUpperCase()})`,
      seriesName: 'Manager Approval Ratio',
      catFormula: `'${sheet1Name}'!$Q$5:$Q$7`,
      valFormula: `'${sheet1Name}'!$R$5:$R$7`,
      categories: ['Approved by Manager', 'Awaiting Manager Approval', 'Not Approved / Unsubmitted'],
      values: [filteredTotals.approvedKpis, filteredTotals.awaitingManagerKpis, unapprovedOther],
      sliceGradients: [
        { start: '#34D399', end: '#047857' },
        { start: '#38BDF8', end: '#0369A1' },
        { start: '#FB7185', end: '#BE123C' }
      ]
    })
  });

  // Chart 3: Interactive Applicable KPIs by Department Donut Chart (bound to Sheet 1 B2:B{N} and H2:H{N})
  const deptEndRow = Math.max(2, departmentStats.length + 1);
  charts.push({
    name: 'Applicable KPIs by Department',
    fromCol: 9,
    fromRow: baseChartRow,
    toCol: 15,
    toRow: baseChartRow + 18,
    chartXml: buildNativeDonutChartXml({
      title: `3. Applicable KPIs by Department (${quarter.toUpperCase()})`,
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

  // Charts 4..N: Per-Department Individual Officials Interactive Bar Graphs
  // Bound directly to 'Per-User KPI Summary'!$B$start:$B$end and columns $N, $O, $Q, $R
  let currentBarAnchorRow = baseChartRow + 20;

  for (const deptStat of departmentStats) {
    const rangeInfo = deptRowRanges.get(deptStat.department);
    if (!rangeInfo || rangeInfo.officials.length === 0) continue;

    const { startRow, endRow, officials } = rangeInfo;
    const catFormula = `'${sheet2Name}'!$B$${startRow}:$B$${endRow}`;

    const deptChartXml = buildNativeDepartmentBarChartXml({
      title: `${deptStat.department} — Individual Officials KPI Breakdown (${officials.length} Officials, ${quarter.toUpperCase()})`,
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
          name: 'KPIs Not Submitted',
          headerFormula: `'${sheet2Name}'!$O$1`,
          valFormula: `'${sheet2Name}'!$O$${startRow}:$O$${endRow}`,
          values: officials.map(u => u.notSubmittedKpis),
          colorStart: '#FBBF24',
          colorEnd: '#D97706'
        },
        {
          name: 'KPIs Approved',
          headerFormula: `'${sheet2Name}'!$Q$1`,
          valFormula: `'${sheet2Name}'!$Q$${startRow}:$Q$${endRow}`,
          values: officials.map(u => u.approvedKpis),
          colorStart: '#10B981',
          colorEnd: '#047857'
        },
        {
          name: 'KPIs Not Approved',
          headerFormula: `'${sheet2Name}'!$R$1`,
          valFormula: `'${sheet2Name}'!$R$${startRow}:$R$${endRow}`,
          values: officials.map(u => u.notApprovedKpis),
          colorStart: '#FB7185',
          colorEnd: '#BE123C'
        }
      ]
    });

    charts.push({
      name: `Individual Bar Graph - ${deptStat.shortName}`,
      fromCol: 0,
      fromRow: currentBarAnchorRow,
      toCol: 15,
      toRow: currentBarAnchorRow + 22,
      chartXml: deptChartXml
    });

    currentBarAnchorRow += 24;
  }

  // Write each chart XML to xl/charts/chart{i}.xml
  charts.forEach((c, idx) => {
    zip.file(`xl/charts/chart${idx + 1}.xml`, c.chartXml);
  });

  // Build xl/drawings/drawing1.xml referencing each native chart via <xdr:graphicFrame>
  const drawingAnchorsXml = charts
    .map((c, idx) => {
      const chartId = idx + 1;
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
        <xdr:cNvPr id="${chartId + 10}" name="${escapeXml(c.name)}"/>
        <xdr:cNvGraphicFramePr/>
      </xdr:nvGraphicFramePr>
      <xdr:xfrm>
        <a:off x="0" y="0"/>
        <a:ext cx="0" cy="0"/>
      </xdr:xfrm>
      <a:graphic>
        <a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/chart">
          <c:chart xmlns:c="http://schemas.openxmlformats.org/drawingml/2006/chart" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:id="rIdChart${chartId}"/>
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

  zip.file('xl/drawings/drawing1.xml', drawingXml);

  const drawingRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${charts
  .map(
    (_, idx) =>
      `  <Relationship Id="rIdChart${idx + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/chart" Target="../charts/chart${idx + 1}.xml"/>`
  )
  .join('\n')}
</Relationships>`;

  zip.file('xl/drawings/_rels/drawing1.xml.rels', drawingRelsXml);

  // Attach drawing1.xml to xl/worksheets/sheet1.xml
  const sheet1File = zip.file('xl/worksheets/sheet1.xml');
  if (sheet1File) {
    let sheet1Xml = await sheet1File.async('string');
    if (!sheet1Xml.includes('xmlns:r=')) {
      sheet1Xml = sheet1Xml.replace(
        '<worksheet ',
        '<worksheet xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
      );
    }
    if (!sheet1Xml.includes('<drawing ')) {
      sheet1Xml = sheet1Xml.replace('</worksheet>', '<drawing r:id="rIdDrawing1"/></worksheet>');
    }
    zip.file('xl/worksheets/sheet1.xml', sheet1Xml);
  }

  const sheet1RelsPath = 'xl/worksheets/_rels/sheet1.xml.rels';
  const existingSheet1Rels = zip.file(sheet1RelsPath);
  if (existingSheet1Rels) {
    let relsXml = await existingSheet1Rels.async('string');
    if (!relsXml.includes('rIdDrawing1')) {
      relsXml = relsXml.replace(
        '</Relationships>',
        '  <Relationship Id="rIdDrawing1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>\n</Relationships>'
      );
      zip.file(sheet1RelsPath, relsXml);
    }
  } else {
    zip.file(
      sheet1RelsPath,
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rIdDrawing1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="../drawings/drawing1.xml"/>
</Relationships>`
    );
  }

  // Register drawing1.xml and all chart*.xml parts in [Content_Types].xml
  const contentTypesFile = zip.file('[Content_Types].xml');
  if (contentTypesFile) {
    let ctXml = await contentTypesFile.async('string');
    const overrides: string[] = [];
    if (!ctXml.includes('/xl/drawings/drawing1.xml')) {
      overrides.push(
        '  <Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/>'
      );
    }
    charts.forEach((_, idx) => {
      const partName = `/xl/charts/chart${idx + 1}.xml`;
      if (!ctXml.includes(partName)) {
        overrides.push(
          `  <Override PartName="${partName}" ContentType="application/vnd.openxmlformats-officedocument.drawingml.chart+xml"/>`
        );
      }
    });
    if (overrides.length > 0) {
      ctXml = ctXml.replace('</Types>', `${overrides.join('\n')}\n</Types>`);
      zip.file('[Content_Types].xml', ctXml);
    }
  }

  // Generate final .xlsx blob and trigger download
  const finalBlob = await zip.generateAsync({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });

  const entityTag = entityFilter === 'ALL' ? 'All_Entities' : entityFilter.replace(/\s+/g, '_');
  const fileName = `IPMS_KPI_Interactive_Report_${entityTag}_${quarter.toUpperCase()}_${new Date()
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
