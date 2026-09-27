import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://skuuhpjbhiablxycsyco.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

if (!SUPABASE_ANON_KEY) {
  console.error("Missing SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false }
});

interface UserSeedData {
  primaryEmail: string;
  aliases: string[];
  fullName: string;
  jobFunction: string;
  department: string;
  role: string;
  level: string;
  manager: string;
  signatureData?: string;
  kpas: Array<{ id: string; name: string; weighting: number }>;
  kpis: Array<{
    id: string;
    kpi: string;
    target: string;
    annualTarget: string;
    weight: number;
    baseline: string;
    poe: string;
    q1Target?: string;
    q2Target?: string;
    q3Target?: string;
    q4Target?: string;
    kpa?: string;
  }>;
  jscs: Array<{
    id: string;
    jscNo: string;
    competency: string;
    weight: number;
    level: string;
    definition: {
      mainText: string;
      subsections?: Array<{ heading: string; paragraphs: string[] }>;
    };
  }>;
  pdps: Array<{
    id: string;
    skillsGap: string;
    outcomes: string;
    suggestedTraining: string;
    modeOfDelivery: string;
    timeFrame: string;
    workOpportunity: string;
    supportPerson: string;
  }>;
}

const SEED_USERS: UserSeedData[] = [
  // 1. Mandla L. Mahlangu (Municipal Manager)
  {
    primaryEmail: "mahlanguml@nkangaladm.gov.za",
    aliases: ["mahlangulm@nkangaladm.gov.za", "mandlaml@nkangaladm.gov.za"],
    fullName: "Mandla L. Mahlangu",
    jobFunction: "Municipal Manager",
    department: "Office of The MM",
    role: "Standard User",
    level: "1",
    manager: "Executive Mayor Ngwenya",
    signatureData: "https://skuuhpjbhiablxycsyco.supabase.co/storage/v1/object/public/signatures/signature_global_222a65cf-53d8-4a6a-87dc-b6ddac6be7fe_1784448228992.png",
    kpas: [
      { id: "kpa-1", name: "Good Governance and Public Participation", weighting: 30 },
      { id: "kpa-2", name: "Municipal Institutional Development and Transformation", weighting: 25 },
      { id: "kpa-3", name: "Municipal Financial Viability and Management", weighting: 20 },
      { id: "kpa-4", name: "Basic Service Delivery and Infrastructure Development", weighting: 15 },
      { id: "kpa-5", name: "Local Economic Development", weighting: 10 }
    ],
    kpis: [
      {
        id: "kpi-1",
        kpi: "Annual Performance Report (2025/26) submitted by 31 August 2026 to Auditor General",
        target: "1 Report Submitted",
        annualTarget: "1",
        weight: 15,
        baseline: "1",
        poe: "Verified submission receipt from Auditor General & Council Resolution",
        q1Target: "1",
        q2Target: "N/A",
        q3Target: "N/A",
        q4Target: "N/A",
        kpa: "Good Governance and Public Participation"
      },
      {
        id: "kpi-2",
        kpi: "Final 2027/2028 SDBIP approved by Executive Mayor within 28 days after approval of Budget",
        target: "100% Compliance",
        annualTarget: "1",
        weight: 15,
        baseline: "1",
        poe: "Signed Executive Mayor SDBIP Approval Memo and Council Minutes",
        q1Target: "N/A",
        q2Target: "N/A",
        q3Target: "N/A",
        q4Target: "1",
        kpa: "Good Governance and Public Participation"
      },
      {
        id: "kpi-3",
        kpi: "Municipal performance moderation committee conducted by 31 December 2026",
        target: "Moderation Completed",
        annualTarget: "1",
        weight: 15,
        baseline: "1",
        poe: "Signed Moderation Committee Minutes and Consolidated Assessment Report",
        q1Target: "N/A",
        q2Target: "1",
        q3Target: "N/A",
        q4Target: "N/A",
        kpa: "Municipal Institutional Development and Transformation"
      },
      {
        id: "kpi-4",
        kpi: "Percentage of operational budget actually spent in accordance with Circular 88 by 30 June 2027",
        target: "95% OPEX spend",
        annualTarget: "95%",
        weight: 20,
        baseline: "92%",
        poe: "Signed Section 71 Financial Outturn Report and General Ledger Extract",
        q1Target: "20%",
        q2Target: "45%",
        q3Target: "70%",
        q4Target: "95%",
        kpa: "Municipal Financial Viability and Management"
      },
      {
        id: "kpi-5",
        kpi: "Percentage of Council resolutions implemented within prescribed statutory timeframe",
        target: "100% Implementation",
        annualTarget: "100%",
        weight: 20,
        baseline: "100%",
        poe: "Consolidated Council Resolution Implementation Matrix signed by Municipal Manager",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        kpa: "Good Governance and Public Participation"
      },
      {
        id: "kpi-6",
        kpi: "Number of quarterly District Development Model (DDM) coordination sessions convened",
        target: "4 DDM Sessions",
        annualTarget: "4",
        weight: 15,
        baseline: "4",
        poe: "DDM Minutes, Attendance Registers and Implementation Scorecards",
        q1Target: "1",
        q2Target: "1",
        q3Target: "1",
        q4Target: "1",
        kpa: "Local Economic Development"
      }
    ],
    jscs: [
      {
        id: "jsc-1",
        jscNo: "JSC-MM-01",
        competency: "Strategic Direction and Leadership",
        weight: 25,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Provides visionary institutional guidance, oversees IDP formulation, and steers organizational culture.",
          subsections: [
            { heading: "Executive Governance", paragraphs: ["Directs senior management team in alignment with municipal priorities.", "Ensures statutory compliance with MFMA, Systems Act and Structures Act."] }
          ]
        }
      },
      {
        id: "jsc-2",
        jscNo: "JSC-MM-02",
        competency: "Financial Management and Accountability",
        weight: 25,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Exercises overall accounting officer responsibility for municipal finances, budgeting, and audit outcomes.",
          subsections: [
            { heading: "Fiscal Discipline", paragraphs: ["Oversees revenue enhancement and eliminates unauthorized/fruitless expenditure.", "Enforces internal control frameworks across all directorates."] }
          ]
        }
      },
      {
        id: "jsc-3",
        jscNo: "JSC-MM-03",
        competency: "Program and Project Management Oversight",
        weight: 20,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Ensures institutional delivery of capital and operational programmes on schedule and within budget.",
          subsections: [
            { heading: "Infrastructure Monitoring", paragraphs: ["Tracks MIG and capital project progress milestones via PMU dashboard.", "Resolves interdepartmental delivery bottlenecks."] }
          ]
        }
      },
      {
        id: "jsc-4",
        jscNo: "JSC-MM-04",
        competency: "Change Leadership & Institutional Transformation",
        weight: 15,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Drives continuous administrative reform, performance management, and workforce development.",
          subsections: [
            { heading: "Organizational Culture", paragraphs: ["Instills Batho Pele culture and high-performance standards."] }
          ]
        }
      },
      {
        id: "jsc-5",
        jscNo: "JSC-MM-05",
        competency: "Intergovernmental Relations and Stakeholder Engagement",
        weight: 15,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Builds strategic partnerships with National/Provincial Government, local municipalities, and civic society.",
          subsections: [
            { heading: "District Alignment", paragraphs: ["Leads DDM Technical Hubs and cooperative governance forums."] }
          ]
        }
      }
    ],
    pdps: [
      {
        id: "pdp-1",
        skillsGap: "Advanced Municipal Governance & Clean Audit Sustainability",
        outcomes: "Sustained clean audit outcome and enhanced risk governance",
        suggestedTraining: "Executive Leadership in Local Government (SALGA/NSG)",
        modeOfDelivery: "Executive Coaching & Masterclass",
        timeFrame: "Q1-Q4 2026/2027",
        workOpportunity: "Leading Audit Action Plan Committee",
        supportPerson: "Executive Mayor / Audit Committee Chairperson"
      },
      {
        id: "pdp-2",
        skillsGap: "Integrated Digital Governance and Smart District Strategy",
        outcomes: "Digital modernization of municipal reporting systems",
        suggestedTraining: "Smart Cities & Digital Transformation Executive Workshop",
        modeOfDelivery: "Blended Learning & Peer Review",
        timeFrame: "Q2-Q3 2026/2027",
        workOpportunity: "ICT Steering Committee Chairmanship",
        supportPerson: "GM: Corporate Services"
      }
    ]
  },

  // 2. Alice L. Stander (Chief Financial Officer)
  {
    primaryEmail: "standeral@nkangaladm.gov.za",
    aliases: ["standera@nkangaladm.gov.za"],
    fullName: "Alice L. Stander",
    jobFunction: "Chief Financial Officer",
    department: "Finance Services",
    role: "Standard User",
    level: "1",
    manager: "Mandla L Mahlangu",
    signatureData: "https://skuuhpjbhiablxycsyco.supabase.co/storage/v1/object/public/signatures/signature_global_43b9c87a-b5fb-4a29-9644-1e0b4c6a88a5_1784182389233.png",
    kpas: [
      { id: "kpa-1", name: "Municipal Financial Viability and Management", weighting: 55 },
      { id: "kpa-2", name: "Good Governance and Public Participation", weighting: 20 },
      { id: "kpa-3", name: "Municipal Institutional Development and Transformation", weighting: 15 },
      { id: "kpa-4", name: "Basic Service Delivery Support", weighting: 10 }
    ],
    kpis: [
      {
        id: "kpi-cfo-1",
        kpi: "Achievement and maintenance of Clean Audit opinion on Annual Financial Statements (AFS) by 31 October 2026",
        target: "Clean Audit",
        annualTarget: "Clean Audit",
        weight: 25,
        baseline: "Clean Audit",
        poe: "Auditor General Audit Report and Management Letter for 2025/26",
        q1Target: "N/A",
        q2Target: "Clean Audit",
        q3Target: "N/A",
        q4Target: "N/A",
        kpa: "Municipal Financial Viability and Management"
      },
      {
        id: "kpi-cfo-2",
        kpi: "Submission of Section 71 Monthly Budget Statements to Executive Mayor and National/Provincial Treasury within 10 working days",
        target: "12 Reports",
        annualTarget: "12",
        weight: 20,
        baseline: "12",
        poe: "Treasury portal upload receipts and signed Section 71 distribution memos",
        q1Target: "3",
        q2Target: "3",
        q3Target: "3",
        q4Target: "3",
        kpa: "Municipal Financial Viability and Management"
      },
      {
        id: "kpi-cfo-3",
        kpi: "Percentage of valid creditor invoices paid within 30 days of receipt in terms of Section 65(2)(e) of MFMA",
        target: "100% Compliance",
        annualTarget: "100%",
        weight: 20,
        baseline: "100%",
        poe: "Creditors Age Analysis and 30-Day Payment Compliance Register",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        kpa: "Municipal Financial Viability and Management"
      },
      {
        id: "kpi-cfo-4",
        kpi: "Percentage execution of approved Capital Budget by 30 June 2027",
        target: "95% CAPEX spend",
        annualTarget: "95%",
        weight: 20,
        baseline: "90%",
        poe: "Capital expenditure monitoring reports and general ledger accounts",
        q1Target: "20%",
        q2Target: "45%",
        q3Target: "70%",
        q4Target: "95%",
        kpa: "Municipal Financial Viability and Management"
      },
      {
        id: "kpi-cfo-5",
        kpi: "Submission of draft 2027/2028 MTREF Annual Budget to Council by 31 March 2027",
        target: "Tabled to Council",
        annualTarget: "1",
        weight: 15,
        baseline: "1",
        poe: "Council Resolution approving tabling of Draft MTREF Budget and Treasury submissions",
        q1Target: "N/A",
        q2Target: "N/A",
        q3Target: "1",
        q4Target: "N/A",
        kpa: "Good Governance and Public Participation"
      }
    ],
    jscs: [
      {
        id: "jsc-cfo-1",
        jscNo: "JSC-CFO-01",
        competency: "Financial Management and GRAP Accounting Standards",
        weight: 30,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Applies expert knowledge of GRAP accounting standards, asset accounting, and financial statement compilation.",
          subsections: [
            { heading: "AFS Quality", paragraphs: ["Oversees balance sheet reconciliations and eliminates misstatements.", "Maintains asset register in full compliance with GRAP 17."] }
          ]
        }
      },
      {
        id: "jsc-cfo-2",
        jscNo: "JSC-CFO-02",
        competency: "Supply Chain Management & MFMA Compliance",
        weight: 25,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Drives transparent, fair, and cost-effective procurement in compliance with SCM regulations.",
          subsections: [
            { heading: "Procurement Governance", paragraphs: ["Eliminates irregular expenditure and enforces bid committee charters."] }
          ]
        }
      },
      {
        id: "jsc-cfo-3",
        jscNo: "JSC-CFO-03",
        competency: "Budgeting, Treasury & Risk Management",
        weight: 20,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Formulates multi-year budgets aligned with IDP goals and manages cash flow liquidity.",
          subsections: [
            { heading: "Cash Flow Stability", paragraphs: ["Ensures strict cost containment and prudent investment management."] }
          ]
        }
      },
      {
        id: "jsc-cfo-4",
        jscNo: "JSC-CFO-04",
        competency: "Revenue Management & Billing Accuracy",
        weight: 15,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Optimizes municipal revenue collection and grant drawdown schedules.",
          subsections: [
            { heading: "Revenue Optimization", paragraphs: ["Monitors billing integrity and debtor recovery."] }
          ]
        }
      },
      {
        id: "jsc-cfo-5",
        jscNo: "JSC-CFO-05",
        competency: "Audit Coordination & Internal Controls",
        weight: 10,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Facilitates seamless Auditor General audit process and enforces Audit Action Plan resolution.",
          subsections: [
            { heading: "Audit Readiness", paragraphs: ["Maintains 100% audit portfolio evidence repository."] }
          ]
        }
      }
    ],
    pdps: [
      {
        id: "pdp-cfo-1",
        skillsGap: "mSCOA Version 6.8 Updates and Treasury Reform Guidelines",
        outcomes: "Flawless mSCOA segment string alignment across all financial modules",
        suggestedTraining: "National Treasury mSCOA Master Practitioner Workshop",
        modeOfDelivery: "Workplace Coaching & National Treasury Masterclass",
        timeFrame: "Q1-Q2 2026/2027",
        workOpportunity: "Chairing mSCOA Project Implementation Committee",
        supportPerson: "Municipal Manager"
      },
      {
        id: "pdp-cfo-2",
        skillsGap: "Public Sector SCM Dispute Resolution & PPP Frameworks",
        outcomes: "Enhanced contract negotiation and public-private partnership structuring",
        suggestedTraining: "Advanced Municipal SCM & PPP Certification (CIPS / NSG)",
        modeOfDelivery: "Specialized Seminar",
        timeFrame: "Q3 2026/2027",
        workOpportunity: "SCM Bid Adjudication Committee",
        supportPerson: "Audit Committee Chair"
      }
    ]
  },

  // 3. Mmaphiri R. Rampedi (General Manager: Corporate Services)
  {
    primaryEmail: "rampedimr@nkangaladm.gov.za",
    aliases: ["rampedim@nkangaladm.gov.za"],
    fullName: "Mmaphiri R. Rampedi",
    jobFunction: "General Manager : Corporate Services",
    department: "Corporate Services",
    role: "Standard User",
    level: "1",
    manager: "Mandla L Mahlangu",
    signatureData: "https://skuuhpjbhiablxycsyco.supabase.co/storage/v1/object/public/signatures/signature_global_e7cbf1b9-313c-4cf2-8e30-daf95ebb1500_1784481819922.png",
    kpas: [
      { id: "kpa-1", name: "Municipal Institutional Development and Transformation", weighting: 50 },
      { id: "kpa-2", name: "Good Governance and Public Participation", weighting: 25 },
      { id: "kpa-3", name: "Municipal Financial Viability and Management", weighting: 15 },
      { id: "kpa-4", name: "Information & Communication Technology Transformation", weighting: 10 }
    ],
    kpis: [
      {
        id: "kpi-corp-1",
        kpi: "Percentage implementation of approved Workplace Skills Plan (WSP) by 30 April 2027",
        target: "100% Implementation",
        annualTarget: "100%",
        weight: 20,
        baseline: "100%",
        poe: "LGSETA WSP Submission Acknowledgement Letter and Training Register",
        q1Target: "25%",
        q2Target: "50%",
        q3Target: "75%",
        q4Target: "100%",
        kpa: "Municipal Institutional Development and Transformation"
      },
      {
        id: "kpi-corp-2",
        kpi: "Number of departmental Training Needs Analysis (TNA) submitted by 30 March 2027",
        target: "All Departments (100%)",
        annualTarget: "1",
        weight: 15,
        baseline: "1",
        poe: "Compliance Certificate issued by HRM&D Unit and signed TNA submissions",
        q1Target: "N/A",
        q2Target: "N/A",
        q3Target: "1",
        q4Target: "N/A",
        kpa: "Municipal Institutional Development and Transformation"
      },
      {
        id: "kpi-corp-3",
        kpi: "Percentage of disciplinary and grievance matters concluded within 90 days of registration",
        target: "100% Concluded",
        annualTarget: "100%",
        weight: 20,
        baseline: "100%",
        poe: "Labour Relations Case Register, Presiding Officer Reports and Outcome Letters",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        kpa: "Municipal Institutional Development and Transformation"
      },
      {
        id: "kpi-corp-4",
        kpi: "Percentage of Council resolution extracts dispatched to departments within 48 hours of Council sitting",
        target: "100% on time",
        annualTarget: "100%",
        weight: 20,
        baseline: "100%",
        poe: "Secretariat Dispatch Registers and Email Delivery Audit Trails",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        kpa: "Good Governance and Public Participation"
      },
      {
        id: "kpi-corp-5",
        kpi: "Percentage of Leave approvals processed within prescribed timeframe in accordance with Leave Management Policy",
        target: "100% Compliant",
        annualTarget: "100%",
        weight: 15,
        baseline: "100%",
        poe: "HR Leave Audit Report and ESS Transaction Logs",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        kpa: "Municipal Institutional Development and Transformation"
      },
      {
        id: "kpi-corp-6",
        kpi: "ICT Disaster Recovery and Business Continuity testing conducted and reported to ICT Steering Committee",
        target: "2 Tests Conducted",
        annualTarget: "2",
        weight: 10,
        baseline: "2",
        poe: "Disaster Recovery Test Results and ICT Steering Committee Minutes",
        q1Target: "N/A",
        q2Target: "1",
        q3Target: "N/A",
        q4Target: "1",
        kpa: "Information & Communication Technology Transformation"
      }
    ],
    jscs: [
      {
        id: "jsc-corp-1",
        jscNo: "JSC-CORP-01",
        competency: "Human Resource Management & Organizational Development",
        weight: 25,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Directs workforce planning, recruitment, talent retention, and organizational restructuring.",
          subsections: [
            { heading: "HR Strategy", paragraphs: ["Aligns organogram with municipal mandate and IDP goals.", "Oversees performance management cascade across all staff levels."] }
          ]
        }
      },
      {
        id: "jsc-corp-2",
        jscNo: "JSC-CORP-02",
        competency: "Labour Relations & Collective Bargaining",
        weight: 25,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Manages Local Labour Forum (LLF), dispute resolution, and workplace equity.",
          subsections: [
            { heading: "Labour Peace", paragraphs: ["Ensures proactive engagement with organized labour unions (SAMWU/IMATU).", "Enforces compliance with SALGBC collective agreements."] }
          ]
        }
      },
      {
        id: "jsc-corp-3",
        jscNo: "JSC-CORP-03",
        competency: "Corporate Governance & Council Secretariat",
        weight: 20,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Oversees Council meeting administration, records management, and statutory reporting.",
          subsections: [
            { heading: "Council Support", paragraphs: ["Ensures flawless compilation and distribution of Council agendas and minutes.", "Maintains registry of municipal policies and bylaws."] }
          ]
        }
      },
      {
        id: "jsc-corp-4",
        jscNo: "JSC-CORP-04",
        competency: "Legal Compliance & Policy Formulation",
        weight: 15,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Coordinates departmental policies, POPIA compliance, and municipal code of conduct.",
          subsections: [
            { heading: "Compliance Framework", paragraphs: ["Conducts annual review of institutional policies."] }
          ]
        }
      },
      {
        id: "jsc-corp-5",
        jscNo: "JSC-CORP-05",
        competency: "ICT Governance and Information Security",
        weight: 15,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Oversees enterprise IT governance, cybersecurity, and digital transformation.",
          subsections: [
            { heading: "ICT Leadership", paragraphs: ["Ensures compliance with DPSA Corporate Governance of ICT Framework (CGICTF)."] }
          ]
        }
      }
    ],
    pdps: [
      {
        id: "pdp-corp-1",
        skillsGap: "Advanced Strategic Labour Dispute Resolution & SALGBC Jurisprudence",
        outcomes: "100% institutional compliance with SALGBC awards and minimal litigation costs",
        suggestedTraining: "Advanced Labour Law & Dispute Resolution Masterclass (CCMA/SALGBC)",
        modeOfDelivery: "Executive Seminar & Case Study Reviews",
        timeFrame: "Q1-Q2 2026/2027",
        workOpportunity: "Leading Local Labour Forum (LLF)",
        supportPerson: "Municipal Manager"
      },
      {
        id: "pdp-corp-2",
        skillsGap: "Digital Records Automation and Enterprise POPIA Compliance",
        outcomes: "Full transition to automated Council paperless records management system",
        suggestedTraining: "Enterprise Information Architecture & POPIA Certification (NSG)",
        modeOfDelivery: "Workplace Coaching",
        timeFrame: "Q3 2026/2027",
        workOpportunity: "Overseeing Municipal Records Digitization Project",
        supportPerson: "ICT Manager"
      }
    ]
  },

  // 4. Precious T. Mahlangu (General Manager: Community Development Services)
  {
    primaryEmail: "mahlangupt@nkangaladm.gov.za",
    aliases: ["mahlangup@nkangaladm.gov.za"],
    fullName: "Precious T. Mahlangu",
    jobFunction: "General Manager: Community Development Services",
    department: "Community Development Services",
    role: "Standard User",
    level: "1",
    manager: "Mandla L Mahlangu",
    signatureData: "",
    kpas: [
      { id: "kpa-1", name: "Basic Service Delivery and Community Development", weighting: 45 },
      { id: "kpa-2", name: "Good Governance and Public Participation", weighting: 25 },
      { id: "kpa-3", name: "Local Economic Development and Social Upliftment", weighting: 15 },
      { id: "kpa-4", name: "Municipal Institutional Development and Transformation", weighting: 15 }
    ],
    kpis: [
      {
        id: "kpi-comm-1",
        kpi: "Percentage of reported municipal disaster incidents responded to within 24 hours of notification",
        target: "100% Response",
        annualTarget: "100%",
        weight: 25,
        baseline: "100%",
        poe: "Disaster Management Incident Logs, Assessment Reports, and Relief Distribution Registers",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        kpa: "Basic Service Delivery and Community Development"
      },
      {
        id: "kpi-comm-2",
        kpi: "Number of Environmental and Municipal Health Services food safety and water sample inspections conducted",
        target: "120 Inspections",
        annualTarget: "120",
        weight: 20,
        baseline: "115",
        poe: "Environmental Health Practitioner (EHP) Inspection Reports and Lab Test Certificates",
        q1Target: "30",
        q2Target: "30",
        q3Target: "30",
        q4Target: "30",
        kpa: "Basic Service Delivery and Community Development"
      },
      {
        id: "kpi-comm-3",
        kpi: "Number of community social upliftment programmes executed (Youth, Women, Elderly, Disability)",
        target: "8 Programmes",
        annualTarget: "8",
        weight: 20,
        baseline: "8",
        poe: "Programme Closeout Reports, Beneficiary Registers, and Photo Portfolios",
        q1Target: "2",
        q2Target: "2",
        q3Target: "2",
        q4Target: "2",
        kpa: "Local Economic Development and Social Upliftment"
      },
      {
        id: "kpi-comm-4",
        kpi: "Percentage of Fire and Rescue emergency responses initiated within the 15-minute standard call-out protocol",
        target: "95% Adherence",
        annualTarget: "95%",
        weight: 20,
        baseline: "94%",
        poe: "Fire Station Incident Logbooks and Control Room Timestamp Data",
        q1Target: "95%",
        q2Target: "95%",
        q3Target: "95%",
        q4Target: "95%",
        kpa: "Basic Service Delivery and Community Development"
      },
      {
        id: "kpi-comm-5",
        kpi: "Submission of Community Services quarterly Section 52(d) departmental performance report to Council",
        target: "4 Reports",
        annualTarget: "4",
        weight: 15,
        baseline: "4",
        poe: "Approved Section 52(d) Departmental Reports and Council Resolutions",
        q1Target: "1",
        q2Target: "1",
        q3Target: "1",
        q4Target: "1",
        kpa: "Good Governance and Public Participation"
      }
    ],
    jscs: [
      {
        id: "jsc-comm-1",
        jscNo: "JSC-COMM-01",
        competency: "Disaster Risk Management & Emergency Services Coordination",
        weight: 30,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Directs district disaster management centre, relief coordination, and climate adaptation initiatives.",
          subsections: [
            { heading: "Emergency Preparedness", paragraphs: ["Maintains multi-agency emergency readiness and disaster contingency plans."] }
          ]
        }
      },
      {
        id: "jsc-comm-2",
        jscNo: "JSC-COMM-02",
        competency: "Municipal Health Services & Environmental Surveillance",
        weight: 25,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Ensures compliance with National Health Act and district municipal health bylaws.",
          subsections: [
            { heading: "Public Health", paragraphs: ["Oversees potable water quality surveillance and hazardous premises compliance."] }
          ]
        }
      },
      {
        id: "jsc-comm-3",
        jscNo: "JSC-COMM-03",
        competency: "Community Mobilization & Social Development Policy",
        weight: 20,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Drives vulnerable group mainstreaming, sports, arts, and cultural heritage programmes.",
          subsections: [
            { heading: "Stakeholder Relations", paragraphs: ["Partners with traditional leaders and community development workers (CDWs)."] }
          ]
        }
      },
      {
        id: "jsc-comm-4",
        jscNo: "JSC-COMM-04",
        competency: "Program Planning & Resource Allocation",
        weight: 15,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Manages departmental OPEX/CAPEX budgets and social grant alignments.",
          subsections: [
            { heading: "Resource Optimization", paragraphs: ["Ensures effective allocation of community emergency relief funds."] }
          ]
        }
      },
      {
        id: "jsc-comm-5",
        jscNo: "JSC-COMM-05",
        competency: "Inter-Agency Public Safety Collaboration",
        weight: 10,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Collaborates with SAPS, Traffic Services, and EMS for comprehensive district community safety.",
          subsections: [
            { heading: "Safety Forums", paragraphs: ["Facilitates District Community Safety Forum sittings."] }
          ]
        }
      }
    ],
    pdps: [
      {
        id: "pdp-comm-1",
        skillsGap: "Advanced Climate Change Adaptation & Disaster Early Warning Systems",
        outcomes: "Integrated early warning alert systems across all local municipal nodes",
        suggestedTraining: "National Disaster Management Early Warning & Mitigation Executive Programme",
        modeOfDelivery: "Specialized Course & Practical Drills",
        timeFrame: "Q1-Q2 2026/2027",
        workOpportunity: "District Disaster Advisory Forum",
        supportPerson: "Municipal Manager"
      },
      {
        id: "pdp-comm-2",
        skillsGap: "Public Health Quality Assurance & Environmental Auditing Standards",
        outcomes: "Attainment of 100% compliance with National Department of Health audit benchmarks",
        suggestedTraining: "Advanced Municipal Health Services Quality Management (HPCSA/NSG)",
        modeOfDelivery: "Workplace Coaching",
        timeFrame: "Q3 2026/2027",
        workOpportunity: "Leading District Environmental Health Task Team",
        supportPerson: "Provincial Health Liaison"
      }
    ]
  },

  // 5. William M. Mtshwenu (General Manager: Technical Services / Infrastructure)
  {
    primaryEmail: "mtshwenuwm@nkangaladm.gov.za",
    aliases: ["mtshwenuw@nkangaladm.gov.za", "williamm@nkangaladm.gov.za"],
    fullName: "William M. Mtshwenu",
    jobFunction: "General Manager: Technical Services / Infrastructure",
    department: "Technical Services",
    role: "Standard User",
    level: "1",
    manager: "Mandla L Mahlangu",
    signatureData: "",
    kpas: [
      { id: "kpa-1", name: "Basic Service Delivery and Infrastructure Development", weighting: 60 },
      { id: "kpa-2", name: "Municipal Financial Viability (MIG / CAPEX Execution)", weighting: 20 },
      { id: "kpa-3", name: "Good Governance and Technical Oversight", weighting: 10 },
      { id: "kpa-4", name: "Institutional Development and Technical Capacity", weighting: 10 }
    ],
    kpis: [
      {
        id: "kpi-tech-1",
        kpi: "Percentage expenditure of allocated Municipal Infrastructure Grant (MIG) by 30 June 2027",
        target: "100% MIG Spend",
        annualTarget: "100%",
        weight: 30,
        baseline: "100%",
        poe: "CoGTA MIG Monthly Financial Outturn Schedules and Verified Engineer Payment Certificates",
        q1Target: "25%",
        q2Target: "50%",
        q3Target: "75%",
        q4Target: "100%",
        kpa: "Basic Service Delivery and Infrastructure Development"
      },
      {
        id: "kpi-tech-2",
        kpi: "Number of regional bulk water infrastructure upgrade projects completed within schedule and budget",
        target: "4 Projects",
        annualTarget: "4",
        weight: 25,
        baseline: "3",
        poe: "Practical Completion Certificates signed by Professional Consulting Engineers and Closeout Reports",
        q1Target: "1",
        q2Target: "1",
        q3Target: "1",
        q4Target: "1",
        kpa: "Basic Service Delivery and Infrastructure Development"
      },
      {
        id: "kpi-tech-3",
        kpi: "Kilometres of district rural road networks upgraded, regravelled or resealed by 30 June 2027",
        target: "45 Kilometres",
        annualTarget: "45 km",
        weight: 20,
        baseline: "40 km",
        poe: "Verified Road Asset Management System (RAMS) inspection sheets and engineering completion notes",
        q1Target: "10 km",
        q2Target: "12 km",
        q3Target: "11 km",
        q4Target: "12 km",
        kpa: "Basic Service Delivery and Infrastructure Development"
      },
      {
        id: "kpi-tech-4",
        kpi: "Monthly submission of verified Project Management Unit (PMU) technical progress reports to CoGTA and Treasury",
        target: "12 Reports",
        annualTarget: "12",
        weight: 15,
        baseline: "12",
        poe: "CoGTA Technical Database upload logs and signed PMU progress summaries",
        q1Target: "3",
        q2Target: "3",
        q3Target: "3",
        q4Target: "3",
        kpa: "Good Governance and Technical Oversight"
      },
      {
        id: "kpi-tech-5",
        kpi: "Percentage resolution of technical engineering infrastructure queries and repairs within 48 hours of logging",
        target: "95% Resolution",
        annualTarget: "95%",
        weight: 10,
        baseline: "90%",
        poe: "Technical Helpdesk Job Cards and Municipal Maintenance System extracts",
        q1Target: "95%",
        q2Target: "95%",
        q3Target: "95%",
        q4Target: "95%",
        kpa: "Basic Service Delivery and Infrastructure Development"
      }
    ],
    jscs: [
      {
        id: "jsc-tech-1",
        jscNo: "JSC-TECH-01",
        competency: "Engineering Project Management & Contract Administration (GCC/FIDIC)",
        weight: 30,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Directs civil, electrical, and water infrastructure engineering contracts in compliance with CIDB and GCC regulations.",
          subsections: [
            { heading: "Contract Governance", paragraphs: ["Manages engineering variation orders, contractor claims, and site quality assurance."] }
          ]
        }
      },
      {
        id: "jsc-tech-2",
        jscNo: "JSC-TECH-02",
        competency: "Municipal Infrastructure Planning & Asset Lifecycle Management",
        weight: 25,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Maintains comprehensive Infrastructure Asset Management Plans (IAMP) and GRAP 17 technical asset registers.",
          subsections: [
            { heading: "Asset Sustainability", paragraphs: ["Develops multi-year capital maintenance master plans."] }
          ]
        }
      },
      {
        id: "jsc-tech-3",
        jscNo: "JSC-TECH-03",
        competency: "MIG Grant Compliance & Technical Reporting",
        weight: 20,
        level: "Level 4: Advanced Leader",
        definition: {
          mainText: "Oversees PMU business plans, CoGTA registration, and monthly grant reconciliations.",
          subsections: [
            { heading: "Grant Maximization", paragraphs: ["Ensures zero MIG fund stoppage or roll-over penalties."] }
          ]
        }
      },
      {
        id: "jsc-tech-4",
        jscNo: "JSC-TECH-04",
        competency: "Occupational Health and Safety (OHSA Construction Regulations)",
        weight: 15,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Enforces 100% compliance with Construction Regulations and Section 16(2) OHSA appointments.",
          subsections: [
            { heading: "Site Safety", paragraphs: ["Directs safety audits on all active municipal construction sites."] }
          ]
        }
      },
      {
        id: "jsc-tech-5",
        jscNo: "JSC-TECH-05",
        competency: "Sustainable Water & Energy Resource Management",
        weight: 10,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Promotes renewable energy integration, water conservation, and demand management.",
          subsections: [
            { heading: "Green Infrastructure", paragraphs: ["Oversees bulk water loss reduction and non-revenue water mitigation."] }
          ]
        }
      }
    ],
    pdps: [
      {
        id: "pdp-tech-1",
        skillsGap: "GCC 2015 & FIDIC Red Book Advanced Construction Claims & Dispute Adjudication",
        outcomes: "Elimination of unjustified contractor extension of time and financial claims",
        suggestedTraining: "Advanced Construction Law & Claims Management Masterclass (SAICE/ECSA)",
        modeOfDelivery: "Specialized Engineering Seminar & Case Study Practicums",
        timeFrame: "Q1-Q2 2026/2027",
        workOpportunity: "Leading Infrastructure Bid Specifications & Contract Oversight",
        supportPerson: "Municipal Manager"
      },
      {
        id: "pdp-tech-2",
        skillsGap: "ISO 55000 Municipal Infrastructure Asset Management & GIS Integration",
        outcomes: "Full integration of Geographic Information Systems (GIS) with asset life-cycle register",
        suggestedTraining: "Certified Infrastructure Asset Management Practitioner (SAAMA)",
        modeOfDelivery: "Workplace Coaching & Online Modules",
        timeFrame: "Q3 2026/2027",
        workOpportunity: "Overseeing RAMS & GIS Technical Migration",
        supportPerson: "CFO / Town Planner"
      }
    ]
  },

  // 6. Thomas P. Mahlangu (Legal Advisor)
  {
    primaryEmail: "MahlanguTP@nkangaladm.gov.za",
    aliases: ["mashlangutp@nkangaladm.gov.za", "mahlangutp@nkangaladm.gov.za", "thomasm@nkangaladm.gov.za"],
    fullName: "Thomas P. Mahlangu",
    jobFunction: "Legal Advisor",
    department: "Corporate Services",
    role: "Standard User",
    level: "3",
    manager: "Mmaphiri R. Rampedi",
    signatureData: "",
    kpas: [
      { id: "kpa-1", name: "Good Governance, Legal Compliance and Risk Management", weighting: 50 },
      { id: "kpa-2", name: "Municipal Institutional Transformation", weighting: 25 },
      { id: "kpa-3", name: "Municipal Financial Viability (Litigation Cost Containment)", weighting: 15 },
      { id: "kpa-4", name: "Contract Administration and SLA Oversight", weighting: 10 }
    ],
    kpis: [
      {
        id: "kpi-legal-1",
        kpi: "Percentage of written legal advisory opinions provided within 5 business days of formal request",
        target: "100% on time",
        annualTarget: "100%",
        weight: 30,
        baseline: "100%",
        poe: "Legal Advisory Register, Signed Legal Opinion Memoranda and Departmental Acknowledgements",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        kpa: "Good Governance, Legal Compliance and Risk Management"
      },
      {
        id: "kpi-legal-2",
        kpi: "Percentage of active municipal litigation cases defended with minimum 85% favorable judgment or settlement rate",
        target: "85% Favorable Outcome",
        annualTarget: "85%",
        weight: 25,
        baseline: "85%",
        poe: "Litigation Status Register, Court Orders, Settlement Agreements, and Attorney Reports",
        q1Target: "85%",
        q2Target: "85%",
        q3Target: "85%",
        q4Target: "85%",
        kpa: "Good Governance, Legal Compliance and Risk Management"
      },
      {
        id: "kpi-legal-3",
        kpi: "Percentage of municipal contracts, tender SLAs, and MoUs vetted for legal compliance prior to signature",
        target: "100% Vetted",
        annualTarget: "100%",
        weight: 20,
        baseline: "100%",
        poe: "Contract Vetting Register with Legal Stamp and Vetting Certificates",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        kpa: "Contract Administration and SLA Oversight"
      },
      {
        id: "kpi-legal-4",
        kpi: "Number of municipal bylaws reviewed, updated or gazetted in compliance with legislative program",
        target: "2 Bylaws Reviewed",
        annualTarget: "2",
        weight: 15,
        baseline: "2",
        poe: "Council Approved Draft Bylaws, Public Participation Reports, and Provincial Gazette Extracts",
        q1Target: "N/A",
        q2Target: "1",
        q3Target: "N/A",
        q4Target: "1",
        kpa: "Good Governance, Legal Compliance and Risk Management"
      },
      {
        id: "kpi-legal-5",
        kpi: "Quarterly submission of consolidated Legal Risk and Contingent Liabilities report to Audit Committee",
        target: "4 Reports",
        annualTarget: "4",
        weight: 10,
        baseline: "4",
        poe: "Audit Committee Pack extracts and signed Legal Risk Reports",
        q1Target: "1",
        q2Target: "1",
        q3Target: "1",
        q4Target: "1",
        kpa: "Municipal Financial Viability (Litigation Cost Containment)"
      }
    ],
    jscs: [
      {
        id: "jsc-legal-1",
        jscNo: "JSC-LEG-01",
        competency: "Constitutional & Administrative Law in Local Government",
        weight: 30,
        level: "Level 4: Advanced Specialist",
        definition: {
          mainText: "Interprets municipal legislative statutes, PAJA, PAIA, and Local Government Municipal Systems Act.",
          subsections: [
            { heading: "Statutory Guidance", paragraphs: ["Provides expert guidance on council resolutions and administrative justice."] }
          ]
        }
      },
      {
        id: "jsc-legal-2",
        jscNo: "JSC-LEG-02",
        competency: "Municipal Contract Drafting, Negotiation & Vetting",
        weight: 25,
        level: "Level 4: Advanced Specialist",
        definition: {
          mainText: "Drafts robust commercial contracts, SLAs, leases, and inter-governmental agreements.",
          subsections: [
            { heading: "Contract Protection", paragraphs: ["Protects municipal interests and minimizes liability exposure."] }
          ]
        }
      },
      {
        id: "jsc-legal-3",
        jscNo: "JSC-LEG-03",
        competency: "Litigation Management & Dispute Resolution",
        weight: 20,
        level: "Level 4: Advanced Specialist",
        definition: {
          mainText: "Instructs panel attorneys, drafts court pleadings, and represents municipality in mediation/arbitration.",
          subsections: [
            { heading: "Litigation Control", paragraphs: ["Controls legal cost tariffs and expedites court proceedings."] }
          ]
        }
      },
      {
        id: "jsc-legal-4",
        jscNo: "JSC-LEG-04",
        competency: "Bylaw Drafting & Legislative Review",
        weight: 15,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Drafts clear, enforceable municipal bylaws and manages public notice gazetting.",
          subsections: [
            { heading: "Bylaw Formulation", paragraphs: ["Aligns municipal bylaws with National/Provincial standard legislation."] }
          ]
        }
      },
      {
        id: "jsc-legal-5",
        jscNo: "JSC-LEG-05",
        competency: "Legal Risk Identification & Compliance Auditing",
        weight: 10,
        level: "Level 3: Advanced Architect",
        definition: {
          mainText: "Maintains contingent liability registers and assesses legal risks across all departments.",
          subsections: [
            { heading: "Risk Reporting", paragraphs: ["Provides quarterly risk assessments to Accounting Officer and Audit Committee."] }
          ]
        }
      }
    ],
    pdps: [
      {
        id: "pdp-legal-1",
        skillsGap: "MFMA Legal Governance & Municipal Procurement Arbitration",
        outcomes: "Elimination of procurement litigation and swift handling of tender challenges",
        suggestedTraining: "Advanced Municipal SCM Law & Procurement Dispute Masterclass (LSSA/LEAD)",
        modeOfDelivery: "Specialized Legal Seminar",
        timeFrame: "Q1-Q2 2026/2027",
        workOpportunity: "Advising Bid Adjudication Committee",
        supportPerson: "GM: Corporate Services"
      },
      {
        id: "pdp-legal-2",
        skillsGap: "POPIA Compliance Enforcement & Data Protection in Local Government",
        outcomes: "100% compliance with Information Regulator standards and POPIA governance",
        suggestedTraining: "Certified Information Privacy Legal Practitioner (CIPP/NSG)",
        modeOfDelivery: "Online Certified Modules",
        timeFrame: "Q3 2026/2027",
        workOpportunity: "Municipal Deputy Information Officer duties",
        supportPerson: "Municipal Manager"
      }
    ]
  }
];

async function seedAll() {
  console.log("Starting comprehensive restoration for key Nkangala profiles...");
  const namespaces = ["tenant-229", "nkangala_auto", "global"];

  for (const user of SEED_USERS) {
    console.log(`\n======================================================`);
    console.log(`Processing: ${user.fullName} (${user.primaryEmail})`);
    const allEmails = Array.from(new Set([user.primaryEmail, ...user.aliases])).map(e => e.toLowerCase().trim());

    // 1. Ensure user exists in 'users' table
    for (const ns of namespaces) {
      for (const email of allEmails) {
        const { error: userErr } = await supabase
          .from("users")
          .upsert({
            id: `usr_${ns}_${email}`,
            tenant_id: ns,
            email: email,
            full_name: user.fullName,
            role: user.role,
            job_function: user.jobFunction,
            department: user.department,
            source: 'manual',
            created_at: new Date().toISOString()
          }, { onConflict: "id" });

        if (userErr) {
          console.warn(`Warning upserting user ${email} in ${ns}:`, userErr.message);
        }
      }
    }

    // 2. Prepare Pplan Items from KPIs
    const pplanItems = user.kpis.map((k, idx) => ({
      id: `pplan-${idx + 1}`,
      kpiNo: `KPI-00${idx + 1}`,
      strategicGoal: k.kpa || "Institutional Excellence & Service Delivery",
      kpi: k.kpi,
      baseline: k.baseline,
      annualTarget: k.annualTarget,
      budget: "Operating Budget",
      weighting: String(k.weight),
      poe: k.poe,
      annualRequiredPoe: k.poe,
      q1Target: k.q1Target || "N/A",
      q2Target: k.q2Target || "N/A",
      q3Target: k.q3Target || "N/A",
      q4Target: k.q4Target || "N/A",
      q1Poe: k.poe,
      q2Poe: k.poe,
      midtermPoe: k.poe,
      q3Poe: k.poe,
      q4Poe: k.poe
    }));

    // 3. Prepare PA Drafting Template Document Payload
    const paDraftingPayload = {
      templateId: `template-${user.primaryEmail}`,
      templateName: `${user.fullName} Performance Agreement 2026/2027`,
      employeeName: user.fullName,
      employeeEmail: user.primaryEmail,
      employeePosition: user.jobFunction,
      supervisorName: user.manager || "Municipal Manager",
      supervisorPosition: user.primaryEmail.includes("mahlanguml") ? "Executive Mayor" : "Municipal Manager",
      municipalityName: "Nkangala District Municipality",
      financialYear: "2026/2027",
      coverPage: `PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nNkangala District Municipality represented by ${user.manager || 'Municipal Manager'}\n\n&\n\n${user.fullName}\n\n${user.jobFunction}\n\nFOR THE FINANCIAL YEAR: 2026/2027`,
      pulledPplanItems: pplanItems,
      pulledFilteredPplanItems: pplanItems,
      pulledCompetencyRows: user.jscs,
      pulledPdpItems: user.pdps,
      updatedAt: new Date().toISOString()
    };

    // 4. Save across all messages documents for all namespaces and email variants
    for (const ns of namespaces) {
      for (const email of allEmails) {
        const recordsToInsert = [
          // KPAs
          {
            id: `kpas_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ kpas: user.kpas }),
            message_type: "kpa_list",
            created_at: new Date().toISOString()
          },
          // KPIs
          {
            id: `kpis_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ kpis: user.kpis }),
            message_type: "kpi_list",
            created_at: new Date().toISOString()
          },
          // Performance Plan
          {
            id: `pplan_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ items: pplanItems }),
            message_type: "pplan_list",
            created_at: new Date().toISOString()
          },
          // Job Specific Competencies (JSC)
          {
            id: `job_competencies_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ competencies: user.jscs }),
            message_type: "job_competencies_list",
            created_at: new Date().toISOString()
          },
          // Team JSC
          {
            id: `team_jsc_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ competencies: user.jscs }),
            message_type: "team_jsc_list",
            created_at: new Date().toISOString()
          },
          // Personal Development Plan (PDP)
          {
            id: `pdp_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ items: user.pdps }),
            message_type: "pdp_list",
            created_at: new Date().toISOString()
          },
          // Team PDP
          {
            id: `team_pdp_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ items: user.pdps }),
            message_type: "team_pdp_list",
            created_at: new Date().toISOString()
          },
          // Team JSC 2
          {
            id: `team_jsc_2_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ competencies: user.jscs }),
            message_type: "team_jsc_2_list",
            created_at: new Date().toISOString()
          },
          // Team PDP 2
          {
            id: `team_pdp_2_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ items: user.pdps }),
            message_type: "team_pdp_2_list",
            created_at: new Date().toISOString()
          },
          // PA Drafting Document
          {
            id: `pa_drafting_doc_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ html: paDraftingPayload }),
            message_type: "pa_drafting_doc",
            created_at: new Date().toISOString()
          },
          // Draft doc
          {
            id: `draft_doc_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ html: paDraftingPayload }),
            message_type: "draft_doc",
            created_at: new Date().toISOString()
          },
          // PA Templates
          {
            id: `pa_templates_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify({ templates: [paDraftingPayload] }),
            message_type: "pa_templates",
            created_at: new Date().toISOString()
          },
          // Legacy Drafting Memo fallback
          {
            id: `doc_pa_drafting_memo_${ns}_${email}`,
            tenant_id: ns,
            sender_id: "system_restorer",
            sender_email: email,
            sender_name: user.fullName,
            content: JSON.stringify(paDraftingPayload),
            message_type: "doc_pa_drafting_memo",
            created_at: new Date().toISOString()
          }
        ];

        for (const rec of recordsToInsert) {
          const { error } = await supabase
            .from("messages")
            .upsert(rec, { onConflict: "id" });
          if (error) {
            console.warn(`Error storing ${rec.id}:`, error.message);
          }
        }
      }
    }
    console.log(`✓ Successfully restored PDP, JSC, PPlan & PA for ${user.fullName} (${user.primaryEmail})`);
  }

  console.log("\n======================================================");
  console.log("All 6 requested user profiles successfully restored across all namespaces!");
}

seedAll()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal seed error:", err);
    process.exit(1);
  });
