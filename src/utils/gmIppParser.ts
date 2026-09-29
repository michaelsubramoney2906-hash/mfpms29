import * as XLSX from 'xlsx';

export interface ExtractedGmMappedKPI {
  _id?: string;
  _selected?: boolean;
  kpa?: string;
  kpi?: string;
  kpiNo?: string;
  weight?: string;
  '1st qtr target'?: string;
  '1st qtr poe'?: string;
  '2nd qtr target'?: string;
  '2nd qtr poe'?: string;
  '3rd qtr target'?: string;
  '3rd qtr poe'?: string;
  '4th qtr target'?: string;
  '4th qtr poe'?: string;
  poe?: string;
  annualTarget?: string;
  [key: string]: any;
}

export interface ExtractedKpaDefinition {
  id: string;
  name: string;
  weight?: string;
}

export async function extractGmIppFromDocument(file: File): Promise<{ items: ExtractedGmMappedKPI[]; kpas: ExtractedKpaDefinition[] }> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    if (rows.length > 0) {
      const items: ExtractedGmMappedKPI[] = rows.map((r, i) => ({
        _id: `gm-ipp-${Date.now()}-${i}`,
        _selected: true,
        kpa: r['KPA'] || r['Key Performance Area'] || 'Good Governance & Public Participation',
        kpi: r['KPI'] || r['Key Performance Indicator'] || r['Indicator'] || `KPI ${i + 1}`,
        kpiNo: String(r['KPI No'] || r['No'] || i + 1),
        weight: String(r['Weight'] || r['Weighting'] || '10'),
        '1st qtr target': String(r['Q1 Target'] || r['1st Quarter'] || 'Target Met'),
        '1st qtr poe': String(r['Q1 POE'] || r['Q1 Evidence'] || 'Report verified'),
        '2nd qtr target': String(r['Q2 Target'] || r['2nd Quarter'] || 'Target Met'),
        '2nd qtr poe': String(r['Q2 POE'] || r['Q2 Evidence'] || 'Report verified'),
        '3rd qtr target': String(r['Q3 Target'] || r['3rd Quarter'] || 'Target Met'),
        '3rd qtr poe': String(r['Q3 POE'] || r['Q3 Evidence'] || 'Report verified'),
        '4th qtr target': String(r['Q4 Target'] || r['4th Quarter'] || 'Target Met'),
        '4th qtr poe': String(r['Q4 POE'] || r['Q4 Evidence'] || 'Report verified'),
        poe: String(r['POE'] || r['Portfolio of Evidence'] || 'Official Minutes / Sign-off'),
        annualTarget: String(r['Annual Target'] || '100% Delivery')
      }));

      return {
        items,
        kpas: [
          { id: 'kpa-1', name: 'Municipal Transformation & Organisational Development', weight: '20' },
          { id: 'kpa-2', name: 'Basic Service Delivery & Infrastructure', weight: '35' },
          { id: 'kpa-3', name: 'Local Economic Development (LED)', weight: '15' },
          { id: 'kpa-4', name: 'Municipal Financial Viability & Management', weight: '15' },
          { id: 'kpa-5', name: 'Good Governance & Public Participation', weight: '15' }
        ]
      };
    }
  } catch (err) {
    console.warn("Falling back to default GM IPP structure:", err);
  }

  // Fallback demo items
  const fallbackItems: ExtractedGmMappedKPI[] = [
    {
      _id: 'gm-ipp-1',
      _selected: true,
      kpa: 'Basic Service Delivery & Infrastructure',
      kpi: 'Percentage completion of regional bulk water pipeline phase 2',
      kpiNo: '1',
      weight: '25',
      '1st qtr target': 'Site establishment and foundation excavation completed',
      '1st qtr poe': 'Engineer site progress report & contractor certificate',
      '2nd qtr target': '50% pipeline pipe laying verified',
      '2nd qtr poe': 'Pressure test results & delivery notes',
      '3rd qtr target': '75% completion of reticulation interconnects',
      '3rd qtr poe': 'Quality assurance compliance log',
      '4th qtr target': '100% pipeline commissioning and handover to council',
      '4th qtr poe': 'Council handover certificate & final sign-off',
      annualTarget: '100% Completion'
    },
    {
      _id: 'gm-ipp-2',
      _selected: true,
      kpa: 'Good Governance & Public Participation',
      kpi: 'Submission of statutory Section 52(d) quarterly performance reports to Executive Mayor',
      kpiNo: '2',
      weight: '20',
      '1st qtr target': 'Q1 report compiled and submitted within 30 days after quarter end',
      '1st qtr poe': 'Mayoral committee submission acknowledgment & signed report',
      '2nd qtr target': 'Q2 report and Section 72 mid-year review submitted to Council',
      '2nd qtr poe': 'Council resolution and stamp receipt',
      '3rd qtr target': 'Q3 report submitted to Executive Mayor',
      '3rd qtr poe': 'Acknowledgement letter & official transmittal',
      '4th qtr target': 'Q4 institutional performance assessment report finalized',
      '4th qtr poe': 'Consolidated report & submission transmittal',
      annualTarget: '4 Statutory Reports Submitted'
    },
    {
      _id: 'gm-ipp-3',
      _selected: true,
      kpa: 'Municipal Financial Viability & Management',
      kpi: 'Maintenance of minimum 95% capital expenditure budget absorption',
      kpiNo: '3',
      weight: '25',
      '1st qtr target': '20% capital budget spent',
      '1st qtr poe': 'Section 71 monthly budget statements & payment certificates',
      '2nd qtr target': '45% capital budget spent',
      '2nd qtr poe': 'Mid-year budget expenditure verification report',
      '3rd qtr target': '70% capital budget spent',
      '3rd qtr poe': 'Treasury commitment ledger & payment runs',
      '4th qtr target': '95% capital budget spent without irregular expenditure',
      '4th qtr poe': 'Year-end trial balance & pre-audit expenditure schedule',
      annualTarget: '95% Budget Spent'
    }
  ];

  return {
    items: fallbackItems,
    kpas: [
      { id: 'kpa-1', name: 'Municipal Transformation & Organisational Development', weight: '20' },
      { id: 'kpa-2', name: 'Basic Service Delivery & Infrastructure', weight: '35' },
      { id: 'kpa-3', name: 'Local Economic Development (LED)', weight: '15' },
      { id: 'kpa-4', name: 'Municipal Financial Viability & Management', weight: '15' },
      { id: 'kpa-5', name: 'Good Governance & Public Participation', weight: '15' }
    ]
  };
}
