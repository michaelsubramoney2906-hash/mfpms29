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

export const MAHLANGUTP_METADATA = {
  employeeName: "Mahlangu Thomas P",
  employeeTitle: "Legal Advisor",
  department: "Corporate Services",
  level: "3",
  employerName: "Nomhle Thembsile Maphanga",
  employerTitle: "Senior Legal Advisor",
  manager: "Nomhle Maphanga",
  managerEmail: "maphangant@nkangaladm.gov.za",
  reportTo: "Nomhle Maphanga",
  financialYear: "2026/2027",
  period: "01 July 2026 – 30 June 2027",
  municipality: "The Nkangala District Municipality"
};

export const MAHLANGUTP_OFFICIAL_KPIS: ExtractedAgreementItem[] = [
  {
    "kpi no": "M_11",
    "kpi description": "Number of new/reviewed policies and enabling documents approved by Council by 30 June 2027.",
    "%wt": "3",
    "baseline": "2",
    "annual target": "2",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "2",
    "poe": "Council Resolutions and Report to Council",
    "budget": "OPEX",
    "kpa": "GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION"
  },
  {
    "kpi no": "2",
    "kpi description": "Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to PMS unit by 30 July 2027",
    "%wt": "3",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "1",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Compliance certificate from PMS Unit",
    "budget": "OPEX",
    "kpa": "GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION"
  },
  {
    "kpi no": "M_21",
    "kpi description": "Attain clean audit opinion by 30 December 2026.",
    "%wt": "3",
    "baseline": "1 (Unqualified with matters)",
    "annual target": "1 (Clean audit)",
    "1st qtr target": "N/A",
    "2nd qtr target": "1 (Clean audit)",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "AG’s Audit Report",
    "budget": "OPEX",
    "kpa": "GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION"
  }
];
