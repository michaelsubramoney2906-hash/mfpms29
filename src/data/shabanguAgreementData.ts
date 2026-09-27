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
  "functional kpa": string;
  "national kpa": string;
  "kpa": string;
  kpaType: 'functional' | 'national';
  _id?: string;
  _selected?: boolean;
}

export interface ExtractedKpaHeader {
  kpaNumber: string;
  kpaName: string;
  fullTitle: string;
  weighting: string;
  kpiCount?: number;
  totalKpiWeight?: number;
  nationalKpa?: string;
  kpaType?: 'functional' | 'national';
}

export interface OfficialJSCItem {
  id: string;
  competency: string;
  definition: string;
  level: string;
  weight: number;
  category: string;
}

export const SHABANGUSM_METADATA = {
  employeeName: "Sibusiso Mancoba Shabangu",
  employeeTitle: "Divisional Manager: OPME & PMDS",
  department: "PMS",
  level: "3",
  employerName: "Mahlangu Lucas Mandla",
  employerTitle: "Municipal Manager",
  financialYear: "2026/2027",
  period: "01 July 2026 – 30 June 2027",
  municipality: "The Nkangala District Municipality"
};

export const SHABANGUSM_OFFICIAL_KPAS: ExtractedKpaHeader[] = [
  {
    kpaNumber: "1",
    kpaName: "GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION",
    fullTitle: "KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION",
    weighting: "25",
    nationalKpa: "GGPP",
    kpaType: "functional"
  },
  {
    kpaNumber: "2",
    kpaName: "FINANCIAL VIABILITY",
    fullTitle: "KPA 2: FINANCIAL VIABILITY",
    weighting: "10",
    nationalKpa: "MFVM",
    kpaType: "functional"
  },
  {
    kpaNumber: "3",
    kpaName: "ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    fullTitle: "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    weighting: "30",
    nationalKpa: "GGPP",
    kpaType: "functional"
  },
  {
    kpaNumber: "4",
    kpaName: "INDIVIDUAL PERFORMANCE MANAGEMENT",
    fullTitle: "KPA 4: INDIVIDUAL PERFORMANCE MANAGEMENT",
    weighting: "10",
    nationalKpa: "MIDT",
    kpaType: "functional"
  },
  {
    kpaNumber: "5",
    kpaName: "PERFORMANCE MONITORING AND EVALUATION",
    fullTitle: "KPA 5: PERFORMANCE MONITORING AND EVALUATION",
    weighting: "25",
    nationalKpa: "GGPP",
    kpaType: "functional"
  }
];

export const SHABANGUSM_OFFICIAL_JSCS: OfficialJSCItem[] = [
  {
    id: "jsc-1",
    competency: "Ethics and Professionalism",
    definition: "The ability to identify and deal with ethical issues and conflicts of interest.",
    level: "3",
    weight: 20,
    category: "Core Professional competencies"
  },
  {
    id: "jsc-2",
    competency: "Planning and organising",
    definition: "The ability to plan activities within specific timeframes and then to execute these activities according to plan.",
    level: "3",
    weight: 15,
    category: "Core Professional competencies"
  },
  {
    id: "jsc-3",
    competency: "Business process",
    definition: "Ability to engage with system or component process and make continuous improvements",
    level: "3",
    weight: 15,
    category: "Functional Competencies"
  },
  {
    id: "jsc-4",
    competency: "Data Processing & Analysis",
    definition: "Ability to process data and bring out about improvements in the way in which it is processed.",
    level: "3",
    weight: 15,
    category: "Functional Competencies"
  },
  {
    id: "jsc-5",
    competency: "Change readiness",
    definition: "The ability to innovate and challenge the status quo and the ability to cope with change driven by others",
    level: "3",
    weight: 15,
    category: "Personal Competencies"
  },
  {
    id: "jsc-6",
    competency: "Impact and influence",
    definition: "The ability to inspire a positive attitude in others and be able to influence others effectively",
    level: "3",
    weight: 20,
    category: "Management / leadership competencies"
  }
];

export const SHABANGUSM_OFFICIAL_KPIS: ExtractedAgreementItem[] = [
  // Page 12 - KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION
  {
    "kpi no": "M_11",
    "kpi description": "Number of new/reviewed policies approved by Council by 30 June 2027",
    "%wt": "1",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "1",
    "poe": "Report to Council and Council Resolution(s)",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_15",
    "kpi description": "Percentage of action plans implemented to address Strategic Risks Identified per quarter (PMS)",
    "%wt": "100",
    "baseline": "90%",
    "annual target": "90%",
    "1st qtr target": "90%",
    "2nd qtr target": "90%",
    "3rd qtr target": "90%",
    "4th qtr target": "90%",
    "poe": "Signed Quarterly Strategic Risk report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_16",
    "kpi description": "Percentage of action plans implemented to address Operational Risks Identified per quarter (PMS)",
    "%wt": "100",
    "baseline": "98%",
    "annual target": "98%",
    "1st qtr target": "98%",
    "2nd qtr target": "98%",
    "3rd qtr target": "98%",
    "4th qtr target": "98%",
    "poe": "Signed Quarterly Operational Risk report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_17",
    "kpi description": "Percentage of action plans implemented to address Fraud and corruption Risks Identified per quarter (PMS)",
    "%wt": "100",
    "baseline": "96%",
    "annual target": "96%",
    "1st qtr target": "96%",
    "2nd qtr target": "96%",
    "3rd qtr target": "96%",
    "4th qtr target": "96%",
    "poe": "Signed Quarterly Fraud and corruption Risk report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_21",
    "kpi description": "Attain clean audit opinion by 31 December 2026.",
    "%wt": "1",
    "baseline": "1 (Unqualified with matters)",
    "annual target": "1 (Clean audit)",
    "1st qtr target": "N/A",
    "2nd qtr target": "1 (Clean audit)",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "AG’s Audit Report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_22",
    "kpi description": "Number of repeat audit findings (circular 88) by 30 December 2026.",
    "%wt": "0",
    "baseline": "≤ 0",
    "annual target": "≤ 0",
    "1st qtr target": "N/A",
    "2nd qtr target": "≤ 0",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "AG’s Audit Report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_23",
    "kpi description": "Number of Action Plan on issues raised by the Auditor General tabled to Council by 30 December 2026.",
    "%wt": "1",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "1",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Audit Action Plan and Council resolution",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_24",
    "kpi description": "Percentage of AG Findings raised in the Management Letter resolved (PMS) by 30 June 2027.",
    "%wt": "100",
    "baseline": "100%",
    "annual target": "100%",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "40%",
    "4th qtr target": "100%",
    "poe": "Signed Progress Report on the Implementation of the Audit Action Plan.",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },

  // Page 13 - KPA 1 continuation
  {
    "kpi no": "M_36",
    "kpi description": "Percentage of strategic lekgotla resolutions implemented by 30 June 2027. (PMS)",
    "%wt": "100",
    "baseline": "100%",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "100%",
    "poe": "Signed Strategic Lekgotla monitoring report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_37",
    "kpi description": "Number of reports on Council Resolutions submitted to Council per quarter (PMS)",
    "%wt": "4",
    "baseline": "4",
    "annual target": "4",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "1",
    "poe": "Signed Quarterly Reports and Council Resolution.",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_40",
    "kpi description": "Percentage of internal audit recommendations implemented by 30 June 2027 (PMS)",
    "%wt": "100",
    "baseline": "100%",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "100%",
    "poe": "Signed Quarterly IA report",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_41",
    "kpi description": "Percentage of audit committee resolutions implemented by 30 June 2027.",
    "%wt": "100",
    "baseline": "100%",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "100%",
    "poe": "Signed Quarterly Audit committee resolution register",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "GGPP",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "1",
    "kpi description": "Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026",
    "%wt": "1",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "1",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Compliance certificate from OPME & PMDS unit",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "2",
    "kpi description": "Number of performance agreements signed with subordinates and submitted to OPME & PMDS unit for the 2026/2027 financial year by 30 July 2026",
    "%wt": "1",
    "baseline": "2",
    "annual target": "2",
    "1st qtr target": "2",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Compliance certificate from OPME & PMDS unit",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "3",
    "kpi description": "Number of self-assessment report compiled and submitted to Supervisor per quarter.",
    "%wt": "4",
    "baseline": "4",
    "annual target": "4",
    "1st qtr target": "1 (annual assessment)",
    "2nd qtr target": "1 (Q1 assessment)",
    "3rd qtr target": "1 (midyear assessment)",
    "4th qtr target": "1 (Q3 assessment)",
    "poe": "Quarterly Compliance certificate from OPME & PMDS unit",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "4",
    "kpi description": "Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026",
    "%wt": "1",
    "baseline": "1 (annual assessment)",
    "annual target": "1 (annual assessment)",
    "1st qtr target": "1 (annual assessment)",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Compliance certificate from OPME & PMDS unit",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "5",
    "kpi description": "Number of informal performance evaluation conducted with all subordinates per quarter",
    "%wt": "2",
    "baseline": "2 (Q1 & Q3)",
    "annual target": "2 (Q1 & Q3)",
    "1st qtr target": "N/A",
    "2nd qtr target": "1 (Q1)",
    "3rd qtr target": "N/A",
    "4th qtr target": "1 (Q3)",
    "poe": "Compliance certificate from OPME & PMDS unit",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },

  // Page 14 - KPA 1 continuation
  {
    "kpi no": "6",
    "kpi description": "Number of quarterly leave reconciliation report submitted to Departmental General Manager (within 30 days after end of each quarter)",
    "%wt": "4",
    "baseline": "4",
    "annual target": "4",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "1",
    "poe": "Compliance certificate from corporate services",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "7",
    "kpi description": "Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027",
    "%wt": "100",
    "baseline": "100%",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "100%",
    "poe": "Compliance certificate from Corporate Services",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "8",
    "kpi description": "Percentage of leave approvals processed within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027",
    "%wt": "100",
    "baseline": "100%",
    "annual target": "100%",
    "1st qtr target": "100%",
    "2nd qtr target": "100%",
    "3rd qtr target": "100%",
    "4th qtr target": "100%",
    "poe": "Compliance certificate from Corporate Services",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },
  {
    "kpi no": "9",
    "kpi description": "Number of departmental Training Needs Analysis submitted (TNA) by 30 March 2027",
    "%wt": "1",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Compliance Certificate issued by HRM&D Unit.",
    "budget": "OPEX",
    "functional kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "national kpa": "MIDT",
    "kpa": "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
    "kpaType": "functional"
  },

  // Page 14 - KPA 2: FINANCIAL VIABILITY
  {
    "kpi no": "M_53",
    "kpi description": "Percentage of operational budget actually spent (circular 88) by 30 June 2027.",
    "%wt": "90",
    "baseline": "90%",
    "annual target": "90%",
    "1st qtr target": "20%",
    "2nd qtr target": "40%",
    "3rd qtr target": "60%",
    "4th qtr target": "90%",
    "poe": "Signed Operational Expenditure progress report",
    "budget": "R",
    "functional kpa": "KPA 2: FINANCIAL VIABILITY",
    "national kpa": "MFVM",
    "kpa": "KPA 2: FINANCIAL VIABILITY",
    "kpaType": "functional"
  },

  // Page 14 - KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT
  {
    "kpi no": "M_19",
    "kpi description": "Number of Annual Report tabled to Council by 31 January 2027.",
    "%wt": "6",
    "baseline": "New",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Approved Annual Report and Council Resolution.",
    "budget": "OPEX",
    "functional kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "national kpa": "GGPP",
    "kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "kpaType": "functional"
  },
  {
    "kpi no": "10",
    "kpi description": "Unaudited Annual Report (2025/26) tabled to Council by 31 August 2026 in-terms of MFMA Circular 63.",
    "%wt": "6",
    "baseline": "New",
    "annual target": "1",
    "1st qtr target": "1",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Draft Annual Report and Council resolution",
    "budget": "OPEX",
    "functional kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "national kpa": "GGPP",
    "kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_25",
    "kpi description": "Final 2027/2028 SDBIP approved by Executive Mayor within 28 days after approval of Budget",
    "%wt": "6",
    "baseline": "New",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "1",
    "poe": "Approved and signed 2026/2027 SDBIP",
    "budget": "OPEX",
    "functional kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "national kpa": "GGPP",
    "kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "kpaType": "functional"
  },
  {
    "kpi no": "M_26",
    "kpi description": "Adjusted 2026/2027 SDBIP approved within 28 days after the approval of the Adjusted Budget.",
    "%wt": "6",
    "baseline": "New",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "1",
    "4th qtr target": "N/A",
    "poe": "Approved and signed Adjusted 2025/2026 SDBIP, Council resolution",
    "budget": "OPEX",
    "functional kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "national kpa": "GGPP",
    "kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "kpaType": "functional"
  },

  // Page 15 - KPA 3 continuation
  {
    "kpi no": "11",
    "kpi description": "Annual Performance Report (2025/26) submitted by 31 August 2026 to Auditor General",
    "%wt": "5",
    "baseline": "New",
    "annual target": "1",
    "1st qtr target": "1",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Annual Performance report and council resolution",
    "budget": "OPEX",
    "functional kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "national kpa": "GGPP",
    "kpa": "KPA 3: ORGANIZATIONAL PERFORMANCE MANAGEMENT",
    "kpaType": "functional"
  },

  // Page 15 - KPA 4: INDIVIDUAL PERFORMANCE MANAGEMENT
  {
    "kpi no": "M_09",
    "kpi description": "Percentage of 2025/2026 individual performance evaluation conducted with all employees by 30 June 2027.",
    "%wt": "2",
    "baseline": "100% 2024/25 (Annual evaluation)",
    "annual target": "100%",
    "1st qtr target": "N/A",
    "2nd qtr target": "N/A",
    "3rd qtr target": "N/A",
    "4th qtr target": "100% 2025/26 (Annual evaluation)",
    "poe": "Consolidated Annual Performance Evaluation Report to Council and Council resolution.",
    "budget": "OPEX",
    "functional kpa": "KPA 4: INDIVIDUAL PERFORMANCE MANAGEMENT",
    "national kpa": "MIDT",
    "kpa": "KPA 4: INDIVIDUAL PERFORMANCE MANAGEMENT",
    "kpaType": "functional"
  },
  {
    "kpi no": "12",
    "kpi description": "Municipal performance moderation committee conducted by 31 December 2026.",
    "%wt": "2",
    "baseline": "1",
    "annual target": "1",
    "1st qtr target": "N/A",
    "2nd qtr target": "1",
    "3rd qtr target": "N/A",
    "4th qtr target": "N/A",
    "poe": "Consolidated Individual Performance Moderation Report",
    "budget": "OPEX",
    "functional kpa": "KPA 4: INDIVIDUAL PERFORMANCE MANAGEMENT",
    "national kpa": "MIDT",
    "kpa": "KPA 4: INDIVIDUAL PERFORMANCE MANAGEMENT",
    "kpaType": "functional"
  },

  // Page 15 - KPA 5: PERFORMANCE MONITORING AND EVALUATION
  {
    "kpi no": "13",
    "kpi description": "Number of quarterly DDM reports submitted to corporate services by 30 June 2026.",
    "%wt": "10",
    "baseline": "4",
    "annual target": "4",
    "1st qtr target": "1",
    "2nd qtr target": "1",
    "3rd qtr target": "1",
    "4th qtr target": "1",
    "poe": "Corporate services DDM report / agenda.",
    "budget": "OPEX",
    "functional kpa": "KPA 5: PERFORMANCE MONITORING AND EVALUATION",
    "national kpa": "GGPP",
    "kpa": "KPA 5: PERFORMANCE MONITORING AND EVALUATION",
    "kpaType": "functional"
  }
];
