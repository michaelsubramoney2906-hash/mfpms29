export interface ExtractedAgreementItem {
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
  "kpa": string;
  _id?: string;
  _selected?: boolean;
}

export const RAMPEDI_METADATA = {
  employeeName: "Mmaphiri Rosina Rampedi",
  employeeTitle: "General Manager: Corporate Services",
  department: "Corporate Services",
  level: "2",
  employerName: "Mandla Lucas Mahlangu",
  employerTitle: "Municipal Manager",
  manager: "Mandla Lucas Mahlangu",
  managerEmail: "mahlanguml@nkangaladm.gov.za",
  reportTo: "Mandla Lucas Mahlangu",
  financialYear: "2026/2027",
  period: "01 July 2026 – 30 June 2027",
  municipality: "The Nkangala District Municipality"
};

export const RAMPEDI_OFFICIAL_KPIS: ExtractedAgreementItem[] = [
  {
    "kpi no": "M_01",
    "kpi description": "Maximum acceptable percentage of Staff vacancy rate (circular 88) per quarter.",
    "%wt": "3",
    "baseline": "7%",
    "annual target": "≤10%",
    "1st qtr target": "≤10%",
    "2nd qtr target": "≤10%",
    "3rd qtr target": "≤10%",
    "4th qtr target": "≤10%",
    "poe": "Signed Vacancy Rate Report (Indicating the vacancy rate percentage).",
    "budget": "OPEX",
    "kpa": "INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "M_02",
    "kpi description": "Percentage of vacant posts filled within 6 months (circular 88) by 30 June 2027.",
    "%wt": "2",
    "baseline": "93%",
    "annual target": "93%",
    "1st qtr target": "93%",
    "2nd qtr target": "93%",
    "3rd qtr target": "93%",
    "4th qtr target": "93%",
    "poe": "Signed Vacancy Rate Report (indicating the vacancy rate).",
    "budget": "OPEX",
    "kpa": "INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "M_03",
    "kpi description": "Percentage of allocated budget spent implementing the Workplace Skills Plan (GKPI) by 30 June 2027.",
    "%wt": "3",
    "baseline": "96%",
    "annual target": "90%",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "90%",
    "poe": "Signed Training Report, Workplace Skills Plan and Budget Vote Report.",
    "budget": "R 2 000",
    "kpa": "INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "M_09",
    "kpi description": "Percentage on litigation matters resolved by 30 June 2027.",
    "%wt": "2",
    "baseline": "43%",
    "annual target": "43%",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "43%",
    "poe": "Signed report on Council Litigation matters.",
    "budget": "R 3 500",
    "kpa": "INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  },
  {
    "kpi no": "2",
    "kpi description": "Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to PMS unit by 30 July 2026",
    "%wt": "2",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "1",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Compliance certificate from PMS",
    "budget": "OPEX",
    "kpa": "INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION"
  }
];
