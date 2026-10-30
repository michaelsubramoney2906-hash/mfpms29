export interface NedaExtractedUserPackage {
  userId: string;
  primaryEmail: string;
  aliases: string[];
  fullName: string;
  jobFunction: string;
  department: string;
  directorate: string;
  level: string;
  role: string;
  supervisorName: string;
  supervisorTitle: string;
  supervisorEmail: string;
  financialYear: string;
  period: string;
  pdfAssetUrl: string;
  kpas: Array<{
    id: string;
    title: string;
    nationalKpa: string;
    parentObjective: string;
    mscoaCode: string;
    weighting: string;
  }>;
  competencyType: 'mm' | 'cfo' | 'jsc';
  coreCompetencies: Array<{
    id: string;
    category: string;
    competency: string;
    components: string;
    definition: string;
    weighting: number;
    level?: string;
  }>;
  jscs: Array<{
    id: string;
    jscNo: string;
    category: string;
    competency: string;
    definition: {
      mainText: string;
      subsections: Array<{ heading: string; paragraphs: string[] }>;
    };
    level: string;
    weight: number;
  }>;
  kpis: Array<{
    id: string;
    kpiNo: string;
    kpa: string;
    strategicGoal: string;
    kpi: string;
    baseline: string;
    annualTarget: string;
    q1Target: string;
    q2Target: string;
    q3Target: string;
    q4Target: string;
    weighting: string;
    poe: string;
    budget: string;
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
  disclosures?: Array<{
    businessName: string;
    registrationNumber: string;
    percentageOwned: string;
  }>;
}

const CCR_BASE_DEFINITIONS = [
  {
    category: 'Leading Competencies',
    competency: 'Strategic Direction and Leadership',
    components: 'Impact and Influence; Institutional Performance Management; Strategic Planning and Management; Organisational Awareness.',
    definition: 'Provide and direct a vision for the institution, inspire and mobilize others to achieve strategic objectives.'
  },
  {
    category: 'Leading Competencies',
    competency: 'People Management',
    components: 'Human Capital Planning and Development; Diversity Management; Employee Relations Management; Negotiation and dispute Management.',
    definition: 'Effectively manage, inspire, and motivate individuals while fostering diversity, optimizing talent, and cultivating relationships to achieve institutional objectives.'
  },
  {
    category: 'Leading Competencies',
    competency: 'Programme and Project Management',
    components: 'Programme and Project Planning and Implementation; Service Delivery Management; Programme and Project Monitoring and Evaluation.',
    definition: 'Understand and apply program and project management methodologies; proficient in planning, managing, monitoring, and evaluating specific activities to achieve set objectives.'
  },
  {
    category: 'Leading Competencies',
    competency: 'Financial Management',
    components: 'Budget Planning and Execution; Financial Strategy and Delivery; Financial Reporting and Monitoring.',
    definition: 'Compile, plan, and manage budgets, control cash flow, mitigate financial risks, and oversee procurement processes in accordance with recognized financial practices. Additionally, ensure all financial transactions are conducted ethically.'
  },
  {
    category: 'Leading Competencies',
    competency: 'Change Leadership',
    components: 'Change Vision and Strategy; Process Design and improvement; Change Impact Monitoring and Evaluation.',
    definition: 'Lead, direct, and initiate institutional transformation at all levels to drive the successful implementation of new initiatives, delivering professional and quality services to the community.'
  },
  {
    category: 'Leading Competencies',
    competency: 'Governance Leadership',
    components: 'Policy Formulation; Risk and Compliance management; Cooperative Governance.',
    definition: 'Promote, direct, and apply professionalism in managing risk and compliance requirements, utilizing a thorough understanding of governance practices and obligations. Additionally, direct the conceptualization of relevant policies and enhance cooperative governance relationships and practices.'
  },
  {
    category: 'Core Competencies',
    competency: 'Moral competence',
    components: 'Core Competency',
    definition: 'Demonstrate integrity, ethical behavior, and moral reasoning consistently. (I.e. identify moral triggers, apply reasoning that promotes honesty and integrity, and consistently display behavior that reflects moral competence)'
  },
  {
    category: 'Core Competencies',
    competency: 'Planning and Organising',
    components: 'Core Competency',
    definition: 'Plan, prioritize, and organize information and resources effectively to ensure quality service delivery and build efficient contingency plans to manage risk.'
  },
  {
    category: 'Core Competencies',
    competency: 'Analysis and Innovation',
    components: 'Core Competency',
    definition: 'Critically analyze information, challenges, and trends to establish and implement innovative, fact-based solutions that improve institutional processes and achieve key strategic objective.'
  },
  {
    category: 'Core Competencies',
    competency: 'Knowledge and Information Management',
    components: 'Core Competency',
    definition: 'Promote the generation and sharing of knowledge and information through various processes and media to enhance the collective knowledge base of local government.'
  },
  {
    category: 'Core Competencies',
    competency: 'Communication',
    components: 'Core Competency',
    definition: 'Maintain high-quality standards, achieve objectives, and monitor performance. Share information, knowledge, and ideas in a clear, focused, and concise manner appropriate for the audience, effectively conveying, persuading, and influencing stakeholders.'
  },
  {
    category: 'Core Competencies',
    competency: 'Results and Quality Focus',
    components: 'Core Competency',
    definition: 'Maintain high-quality standards, focus on achieving objectives, exceed expectations, and encourage others to meet quality standards. Additionally, actively monitor and measure performance and quality against established objectives.'
  }
];

const MANGANI_MM_WEIGHTS = [10, 10, 10, 5, 10, 5, 10, 10, 10, 5, 10, 5];
const CHAUKE_CFO_WEIGHTS = [5, 3, 3, 60, 2, 5, 5, 5, 2, 3, 2, 5];

export const NEDA_EXTRACTED_PACKAGES: NedaExtractedUserPackage[] = [
  // ============================================================================
  // 1. JP MANGANI — ACTING CHIEF EXECUTIVE OFFICER (NEDA)
  // ============================================================================
  {
    userId: 'neda-user-manganijp',
    primaryEmail: 'manganijp@nkangaladm.gov.za',
    aliases: [
      'manganijp@nkangaladm.gov.za',
      'manganijp@neda.gov.za',
      'Manganijp@nkangaladm.gov.za',
      'ManganiJP@nkangaladm.gov.za',
      'Manganijp@neda.gov.za',
      'ManganiJP@neda.gov.za'
    ],
    fullName: 'Johan P. Mangani',
    jobFunction: 'Acting Chief Executive Officer',
    department: 'Office of the Chief Executive Officer',
    directorate: 'Office of the Chief Executive Officer',
    level: '1',
    role: 'Senior Management',
    supervisorName: 'Mr MT Khumalo',
    supervisorTitle: 'Board Chairperson',
    supervisorEmail: 'khumalomt@neda.gov.za',
    financialYear: '2026/2027',
    period: '01 August 2026 – 31 January 2027',
    pdfAssetUrl: '/assets/aistudio/2026-2027_ACEO_NEDA_-PA_-_JP_Mangani_58260b68.pdf',
    kpas: [
      { id: 'kpa-mangani-1', title: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', nationalKpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', parentObjective: 'Institutional Development and Transformation', mscoaCode: 'Operational', weighting: '16' },
      { id: 'kpa-mangani-2', title: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', nationalKpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', parentObjective: 'Good Governance and Public Participation', mscoaCode: 'Operational', weighting: '26' },
      { id: 'kpa-mangani-3', title: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', nationalKpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', parentObjective: 'Local Economic Development', mscoaCode: 'Operational', weighting: '13' },
      { id: 'kpa-mangani-4', title: 'PROJECTS', nationalKpa: 'PROJECTS', parentObjective: 'Strategic Catalytic Economic Projects Implementation', mscoaCode: 'Capital / Project', weighting: '9' },
      { id: 'kpa-mangani-5', title: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', nationalKpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', parentObjective: 'Municipal Financial Viability and Management', mscoaCode: 'Operational', weighting: '36' }
    ],
    competencyType: 'mm',
    coreCompetencies: CCR_BASE_DEFINITIONS.map((c, idx) => ({
      id: `mm-${idx + 1}`,
      category: c.category,
      competency: c.competency,
      components: c.components,
      definition: c.definition,
      weighting: MANGANI_MM_WEIGHTS[idx],
      level: 'Superior / Advanced'
    })),
    jscs: CCR_BASE_DEFINITIONS.map((c, idx) => ({
      id: `jsc-mangani-${idx + 1}`,
      jscNo: `CCR ${idx + 1}`,
      category: c.category,
      competency: c.competency,
      definition: {
        mainText: c.definition,
        subsections: [{ heading: 'Key Components', paragraphs: [c.components] }]
      },
      level: 'Level 4',
      weight: MANGANI_MM_WEIGHTS[idx]
    })),
    kpis: [
      // KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION (16%)
      { id: 'kpi-mangani-1', kpiNo: 'E_03', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', strategicGoal: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Number of quarterly reports submitted to the Board and the NDM by 30 June 2027.', weighting: '3', baseline: '4', annualTarget: '3', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: 'N/A', poe: 'Quarterly Report, Board and Council resolutions', budget: 'OPEX' },
      { id: 'kpi-mangani-2', kpiNo: 'E_04', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', strategicGoal: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Maximum acceptable percentage of Staff vacancy rate (circular 88) per quarter', weighting: '2', baseline: 'NEW', annualTarget: '10% or below', q1Target: '10% or below', q2Target: '10% or below', q3Target: '10% or below', q4Target: 'N/A', poe: 'Signed Vacancy Rate Report (Indicating the vacancy rate percentage)', budget: 'OPEX' },
      { id: 'kpi-mangani-3', kpiNo: 'E_05', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', strategicGoal: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage of allocated budget spent implementing the Workplace Skills Plan by 30 June 2027', weighting: '3', baseline: 'NEW', annualTarget: '50%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '50%', q4Target: 'N/A', poe: 'Signed Training Report, and budget Vote Report.', budget: 'R100' },
      { id: 'kpi-mangani-4', kpiNo: 'E_06', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', strategicGoal: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage of Board members who have declared their financial interests (Circular 88) by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: 'N/A', poe: 'Signed Quarterly Report on Declarations of Interest by Board and Board Resolution.', budget: 'OPEX' },
      { id: 'kpi-mangani-5', kpiNo: 'E_08', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', strategicGoal: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage of Employees who have declared their financial interests (Circular 88) by 30 June 2027', weighting: '4', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: 'N/A', poe: 'Signed Quarterly Report on Declarations of Interest by Employees and Board Resolution.', budget: 'OPEX' },
      { id: 'kpi-mangani-6', kpiNo: 'E_08A', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', strategicGoal: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Number of Litigation Reports submitted to the Board per quarter.', weighting: '1', baseline: 'NEW', annualTarget: '3', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: 'N/A', poe: 'Quarterly Litigations Report', budget: 'OPEX' },
      { id: 'kpi-mangani-7', kpiNo: 'E_08B', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', strategicGoal: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Number of Personnel Reports submitted to the Board per quarter', weighting: '1', baseline: 'NEW', annualTarget: '3', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: 'N/A', poe: 'Quarterly Litigations (Personnel) Report', budget: 'OPEX' },

      // KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION (26%)
      { id: 'kpi-mangani-8', kpiNo: 'E_09', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Attain clean audit opinion by 31 December 2026.', weighting: '4', baseline: 'NEW', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: "AG's Audit Report", budget: 'OPEX' },
      { id: 'kpi-mangani-9', kpiNo: 'E_10', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of repeat audit findings (circular 88) by 30 December 2026', weighting: '1', baseline: 'NEW', annualTarget: '0 (not above)', q1Target: 'N/A', q2Target: '0 (not above)', q3Target: 'N/A', q4Target: 'N/A', poe: "AG's Audit Report", budget: 'OPEX' },
      { id: 'kpi-mangani-10', kpiNo: 'E_11', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of Action Plan on issues raised by the Auditor General tabled to the board by 30 December 2026.', weighting: '1', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'Audit Action Plan and Board Resolution', budget: 'OPEX' },
      { id: 'kpi-mangani-11', kpiNo: 'E_12', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of AG Findings raised in the Management Letter resolved (Total organization) by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '40%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '40%', q4Target: 'N/A', poe: 'Signed Progress Report on the Implementation of the Audit Action Plan.', budget: 'OPEX' },
      { id: 'kpi-mangani-12', kpiNo: 'E_14', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of Annual Report tabled to the Board and Council by 30 December 2026', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'Approved Annual Report, Board and Council Resolution.', budget: 'OPEX' },
      { id: 'kpi-mangani-13', kpiNo: 'E_16', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of Adjusted 2026/2027 Annual Performance Plan approved within 28 days after the approval of the Adjusted Budget.', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Approved and signed Adjusted 2026/2027 Annual Performance Plan, Board resolution', budget: 'OPEX' },
      { id: 'kpi-mangani-14', kpiNo: 'E_17', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (Total organisation)', weighting: '1', baseline: 'NEW', annualTarget: '80%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: 'N/A', poe: 'Signed Quarterly Strategic Risk report', budget: 'OPEX' },
      { id: 'kpi-mangani-15', kpiNo: 'E_18', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of action plans implemented to address Operational Risks Identified per quarter (Total Organisation)', weighting: '3', baseline: 'NEW', annualTarget: '80%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: 'N/A', poe: 'Signed Quarterly Operational Risk report', budget: 'OPEX' },
      { id: 'kpi-mangani-16', kpiNo: 'E_20', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of internal audit recommendations implemented per quarter (Total organization)', weighting: '1', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: 'N/A', poe: 'Signed Quarterly IA report', budget: 'OPEX' },
      { id: 'kpi-mangani-17', kpiNo: 'E_22', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of Audit Committee reports submitted to Board by 30 June 2027', weighting: '1', baseline: 'NEW', annualTarget: '3', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: 'N/A', poe: 'Quarterly Signed Audit Committee Reports and Board Resolution.', budget: 'OPEX' },
      { id: 'kpi-mangani-18', kpiNo: 'E_23', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage implementation of audit committee resolutions adopted per quarter', weighting: '3', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: 'N/A', poe: 'Signed Quarterly Audit committee resolution register', budget: 'OPEX' },
      { id: 'kpi-mangani-19', kpiNo: 'E_24', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage on Implementation of Board Resolutions Resolved (Total organization) per quarter', weighting: '1', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: 'N/A', poe: 'Signed Quarterly Report on Implementation of Board Resolutions.', budget: 'OPEX' },
      { id: 'kpi-mangani-20', kpiNo: 'E_25', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of agenda items deferred to the next Board meeting (circular 88) per quarter', weighting: '2', baseline: 'NEW', annualTarget: '3, (or below)', q1Target: '3, (or below)', q2Target: '3, (or below)', q3Target: '3, (or below)', q4Target: 'N/A', poe: 'Unsigned minutes of the current quarter and Signed Board Minutes of previous quarter', budget: 'OPEX' },
      { id: 'kpi-mangani-21', kpiNo: 'E_27', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', strategicGoal: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of strategic lekgotla resolutions implemented by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '80%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: 'N/A', poe: 'Signed quarterly Report on Implementation of Strategic Lekgotla resolutions', budget: 'OPEX' },

      // KPA 3: LOCAL ECONOMIC DEVELOPMENT (13%)
      { id: 'kpi-mangani-22', kpiNo: 'E_28', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of fundraising proposals submitted to funders for LED projects submitted by Local Municipalities by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '3', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: 'N/A', poe: 'Signed fundraising proposals', budget: 'OPEX' },
      { id: 'kpi-mangani-23', kpiNo: 'E_29', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of reports on catalytic economic development and projects pipeline identified and profiled for investment attraction by 30 June 2027.', weighting: '3', baseline: 'NEW', annualTarget: '3', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: 'N/A', poe: 'Signed report on catalytic economic development projects and Board resolution', budget: 'OPEX' },
      { id: 'kpi-mangani-24', kpiNo: 'E_30', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of District Investment Prospect developed by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: '1 (Draft District Investment Prospect)', q3Target: 'N/A', q4Target: 'N/A', poe: 'Draft District Investment Prospect', budget: 'OPEX' },
      { id: 'kpi-mangani-25', kpiNo: 'E_31', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of Municipal Investment Incentive Framework developed by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: '1 (Draft municipal investment incentive framework and templates developed)', q3Target: 'N/A', q4Target: 'N/A', poe: 'Draft municipal investment Incentive framework and Templates', budget: 'OPEX' },
      { id: 'kpi-mangani-26', kpiNo: 'E_32', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of brick plant accreditation obtained from the SABS by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: '1 (SABS lab assessment 1 conducted)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'SABS Lab assessment results', budget: 'OPEX' },
      { id: 'kpi-mangani-27', kpiNo: 'E_33', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of bricks produced per quarter', weighting: '2', baseline: 'NEW', annualTarget: '981 334', q1Target: 'N/A', q2Target: '490 667', q3Target: '490 667', q4Target: 'N/A', poe: 'Signed quarterly brick production reports', budget: 'OPEX' },

      // PROJECTS (9%)
      { id: 'kpi-mangani-28', kpiNo: 'P_01', kpa: 'PROJECTS', strategicGoal: 'PROJECTS', kpi: 'Management and operationalisation of the Emakhazeni brick manufacturing plant (Emakhazeni Local Municipality)', weighting: '3', baseline: 'NEW', annualTarget: 'Stage 2: implementation (30%): Brick Plant Operations Progress Report', q1Target: 'Stage 1: Planning (100%): Recruitment and Training; Develop Pricing and Marketing Strategy; Quality Assurance Framework', q2Target: 'Stage 2: implementation (15%): Brick Plant Operations Progress Report', q3Target: 'Stage 2: implementation (30%): Brick Plant Operations Progress Report', q4Target: 'N/A', poe: 'Attendance Registers and Progress report (Signed and dated); Pricing and Marketing Strategy; Signed Quality Assurance Framework; Signed Operations Progress Report', budget: 'R 2 805' },
      { id: 'kpi-mangani-29', kpiNo: 'P_02', kpa: 'PROJECTS', strategicGoal: 'PROJECTS', kpi: 'Water Treatment Chemicals Distribution (Thembisile Hani Local Municipality)', weighting: '3', baseline: 'NEW', annualTarget: 'Stage 2: implementation (30%): Chemical distribution Operations Progress Report', q1Target: 'Stage 1: Planning (100%): Recruitment and Training', q2Target: 'Stage 2: implementation (15%): Chemical distribution Operations Progress Report', q3Target: 'Stage 2: implementation (30%): Chemical distribution Operations Progress Report', q4Target: 'N/A', poe: 'Attendance Registers and Progress report (Signed and dated); Signed Operations Progress Report', budget: 'R 2 295' },
      { id: 'kpi-mangani-30', kpiNo: 'P_03', kpa: 'PROJECTS', strategicGoal: 'PROJECTS', kpi: 'Feasibility study and business plan for the packaging of land for investment attraction (District wide)', weighting: '3', baseline: 'NEW', annualTarget: 'Stage 2 - Procurement (100%): Bid Evaluation Committee Resolution, Bid Adjudication Committee Resolution and Appointment of Service Provider', q1Target: 'Stage 1 – Planning Stage (100%): MOU/SLA With Steve Tshwete Local Municipality', q2Target: 'Stage 1 - Planning Stage (100%): Bid Specification Committee Resolution', q3Target: 'Stage 2 - Procurement (100%): Bid Evaluation Committee Resolution, Bid Adjudication Committee Resolution and Appointment of Service Provider', q4Target: 'N/A', poe: 'Signed and dated MOU/SLA, BSC Resolution, Tender Advert (Tear Sheet), BEC Resolution, BAC Resolution, Signed & Dated Appointment Letter', budget: 'R 750' },

      // KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT (36%)
      { id: 'kpi-mangani-31', kpiNo: 'E_34', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of procurement plan implemented per quarter', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: 'N/A', poe: 'Signed Quarterly Procurement plan report', budget: 'OPEX' },
      { id: 'kpi-mangani-32', kpiNo: 'E_35', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of Draft MTREF Budget submitted and approved by 30 March 2027', weighting: '2', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Approved Draft MTREF Budget, Board and Council resolution', budget: 'OPEX' },
      { id: 'kpi-mangani-33', kpiNo: 'E_37', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Annual Financial Statements (AFS) submitted by 31 August 2026 to Auditor General', weighting: '4', baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Annual Financial Statements (AFS) and acknowledgement letter (of receipt) from the AG.', budget: 'OPEX' },
      { id: 'kpi-mangani-34', kpiNo: 'E_38', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of section 88 (Mid-year) budget and performance reports submitted to the Board and the NDM by 20 January 2026.', weighting: '3', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Signed Section 88 (midyear) MFMA report and proof of submission to the Board and NDM', budget: 'OPEX' },
      { id: 'kpi-mangani-35', kpiNo: 'E_39', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of SCM reports submitted to the Board Chairperson per quarter', weighting: '3', baseline: 'NEW', annualTarget: '3', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: 'N/A', poe: "Signed Quarterly SCM report and proof of submission to Board Chairperson's office", budget: 'OPEX' },
      { id: 'kpi-mangani-36', kpiNo: 'E_40', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: "Percentage of total Agency's operating expenditure spent on contracted services physically residing within the District (circular 88) by 30 June 2026", weighting: '3', baseline: 'NEW', annualTarget: '30%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '30%', q4Target: 'N/A', poe: "Signed contracted services report indicating contractors' physical addresses and expenditure spent on contracted services physically residing within the municipal area. (Hardcopies of signed appointment letters/purchase orders with physical address)", budget: 'OPEX' },
      { id: 'kpi-mangani-37', kpiNo: 'E_41', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Average number of days from the point of advertising to the letter of award per 80/20 procurement process (circular 88) by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '120', q1Target: '120', q2Target: '120', q3Target: '120', q4Target: 'N/A', poe: 'Average number of days SCM official (Signed) report', budget: 'OPEX' },
      { id: 'kpi-mangani-38', kpiNo: 'E_42', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of monthly Section 87(11) MFMA reports submitted to Chairperson of the Board and the NDM by 30 June 2027', weighting: '3', baseline: '12', annualTarget: '9', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: 'N/A', poe: 'Section 87(11) MFMA reports and proof of submission to Chairperson of the Board and the NDM', budget: 'OPEX' },
      { id: 'kpi-mangani-39', kpiNo: 'E_43', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of transfer and subsidies budget actually spent on projects by 30 June 2027', weighting: '3', baseline: 'NEW', annualTarget: '60%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: 'N/A', poe: 'Transfer and subsidies Expenditure signed progress report', budget: 'R 5 100' },
      { id: 'kpi-mangani-40', kpiNo: 'E_44', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of operational budget actually spent by 30 June 2027 (circular 88)', weighting: '3', baseline: 'NEW', annualTarget: '60%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: 'N/A', poe: 'Signed Operational Expenditure progress report', budget: 'R 1 700' },
      { id: 'kpi-mangani-41', kpiNo: 'E_45', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of total capital expenditure funded from NDM grant (circular 88) by 30 June 2027', weighting: '3', baseline: 'NEW', annualTarget: '40%', q1Target: '5%', q2Target: '25%', q3Target: '40%', q4Target: 'N/A', poe: 'Signed Capital expenditure progress report', budget: 'R 100' },
      { id: 'kpi-mangani-42', kpiNo: 'E_46', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of payments made to service providers who submitted complete invoices within 30-days of invoice submission (circular 88)', weighting: '5', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: 'N/A', poe: 'Signed Expenditure Report and official invoice register', budget: 'OPEX' }
    ],
    pdps: [
      {
        id: 'pdp-mangani-1',
        skillsGap: 'Executive Corporate Governance & King IV Entity Oversight',
        outcomes: 'Enhanced Board accountability, clean audit governance, and strategic investment delivery across NEDA',
        suggestedTraining: 'IoDSA King IV & Municipal Entity Executive Governance Programme',
        modeOfDelivery: 'External Accredited Provider',
        timeFrame: '01 August 2026 to 31 January 2027',
        workOpportunity: 'Lead NEDA Board reporting, Annual Performance Plan execution, and District Investment Prospectus delivery',
        supportPerson: 'Board Chairperson (Mr MT Khumalo)'
      }
    ]
  },

  // ============================================================================
  // 2. CHAUKE KC — CHIEF FINANCIAL OFFICER (NEDA)
  // ============================================================================
  {
    userId: 'neda-user-chaukekc',
    primaryEmail: 'chaukekc@neda.gov.za',
    aliases: [
      'chaukekc@neda.gov.za',
      'ChaukeKC@neda.gov.za',
      'chaukekc@nkangaladm.gov.za'
    ],
    fullName: 'Kulani Collen Chauke',
    jobFunction: 'Chief Financial Officer',
    department: 'Finance',
    directorate: 'Finance and Administration',
    level: '2',
    role: 'Senior Management',
    supervisorName: 'Johan P. Mangani',
    supervisorTitle: 'Acting Chief Executive Officer',
    supervisorEmail: 'manganijp@nkangaladm.gov.za',
    financialYear: '2026/2027',
    period: '01 July 2026 – 30 June 2027',
    pdfAssetUrl: '/assets/aistudio/2026-2027_Performance_Agreement_-_Chauke_853da60e.pdf',
    kpas: [
      { id: 'kpa-chauke-1', title: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', nationalKpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', parentObjective: 'Good Governance and Institution Transformation', mscoaCode: 'Operational', weighting: '40' },
      { id: 'kpa-chauke-2', title: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', nationalKpa: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', parentObjective: 'Local Economic Development', mscoaCode: 'Operational', weighting: '10' },
      { id: 'kpa-chauke-3', title: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', nationalKpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', parentObjective: 'Municipal Financial Viability and Management', mscoaCode: 'Operational', weighting: '35' },
      { id: 'kpa-chauke-4', title: 'KPA 4: PROJECT MANAGEMENT', nationalKpa: 'KPA 4: PROJECT MANAGEMENT', parentObjective: 'Project Management', mscoaCode: 'Capital / Project', weighting: '15' }
    ],
    competencyType: 'cfo',
    coreCompetencies: CCR_BASE_DEFINITIONS.map((c, idx) => ({
      id: `cfo-${idx + 1}`,
      category: c.category,
      competency: c.competency,
      components: c.components,
      definition: c.definition,
      weighting: CHAUKE_CFO_WEIGHTS[idx],
      level: 'Superior / Advanced'
    })),
    jscs: CCR_BASE_DEFINITIONS.map((c, idx) => ({
      id: `jsc-chauke-${idx + 1}`,
      jscNo: `CCR ${idx + 1}`,
      category: c.category,
      competency: c.competency,
      definition: {
        mainText: c.definition,
        subsections: [{ heading: 'Key Components', paragraphs: [c.components] }]
      },
      level: 'Level 4',
      weight: CHAUKE_CFO_WEIGHTS[idx]
    })),
    kpis: [
      // KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION (40%)
      { id: 'kpi-chauke-1', kpiNo: 'E_01', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of SDBIP and Annual Performance Plan aligned with the NDM IDP approved by the Board Chairperson 28 days after the approval of the budget by 30 June 2027.', weighting: '4', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Approved SDBIP and Annual Performance Plan by Board Chairperson', budget: 'OPEX' },
      { id: 'kpi-chauke-2', kpiNo: 'E_02', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of new/reviewed policies and enabling documents approved by the board by 30 June 2027.', weighting: '3', baseline: '5', annualTarget: '5', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '5', poe: 'Reviewed Policies and Board Resolution', budget: 'OPEX' },
      { id: 'kpi-chauke-3', kpiNo: 'E_03', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of quarterly reports submitted to the Board and the NDM by 30 June 2027', weighting: '2', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly Report, Board and Council resolutions', budget: 'OPEX' },
      { id: 'kpi-chauke-4', kpiNo: 'E_04', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Maximum acceptable percentage of Staff vacancy rate (circular 88) per quarter', weighting: '2', baseline: 'NEW', annualTarget: '10% or below', q1Target: '10% or below', q2Target: '10% or below', q3Target: '10% or below', q4Target: '10% or below', poe: 'Signed Vacancy Rate Report (Indicating the vacancy rate percentage)', budget: 'OPEX' },
      { id: 'kpi-chauke-5', kpiNo: 'E_08', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of Finance Employees who have declared their financial interests (Circular 88) by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Report on Declarations of Interest by Employees and Board Resolution.', budget: 'OPEX' },
      { id: 'kpi-chauke-6', kpiNo: 'E_09', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Attain clean audit opinion by 31 December 2026.', weighting: '5', baseline: 'NEW', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: "AG's Audit Report", budget: 'OPEX' },
      { id: 'kpi-chauke-7', kpiNo: 'E_10', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of repeat audit findings (circular 88) by 30 December 2026', weighting: '3', baseline: 'NEW', annualTarget: '0 (not above)', q1Target: 'N/A', q2Target: '0 (not above)', q3Target: 'N/A', q4Target: 'N/A', poe: "AG's Audit Report", budget: 'OPEX' },
      { id: 'kpi-chauke-8', kpiNo: 'E_11', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of Action Plan on issues raised by the Auditor General tabled to the board by 30 December 2026.', weighting: '2', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'Audit Action Plan and Board Resolution', budget: 'OPEX' },
      { id: 'kpi-chauke-9', kpiNo: 'E_12', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of AG Findings raised in the Management Letter resolved (Finance Department) by 30 June 2027.', weighting: '3', baseline: 'NEW', annualTarget: '100%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '40%', q4Target: '100%', poe: 'Signed Progress Report on the Implementation of the Audit Action Plan.', budget: 'OPEX' },
      { id: 'kpi-chauke-10', kpiNo: 'E_16', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of Adjusted 2026/2027 Annual Performance Plan approved within 28 days after the approval of the Adjusted Budget.', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Approved and signed Adjusted 2026/2027 Annual Performance Plan, Board resolution', budget: 'OPEX' },
      { id: 'kpi-chauke-11', kpiNo: 'E_17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (Finance Department)', weighting: '2', baseline: 'NEW', annualTarget: '90%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: '90%', poe: 'Signed Quarterly Strategic Risk report', budget: 'OPEX' },
      { id: 'kpi-chauke-12', kpiNo: 'E_18', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Operational Risks Identified per quarter (Finance Department)', weighting: '2', baseline: 'NEW', annualTarget: '90%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: '90%', poe: 'Signed Quarterly Operational Risk report', budget: 'OPEX' },
      { id: 'kpi-chauke-13', kpiNo: 'E_20', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of internal audit recommendations implemented per quarter (Finance Department)', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly IA report', budget: 'OPEX' },
      { id: 'kpi-chauke-14', kpiNo: 'E_23', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage implementation of audit committee resolutions adopted per quarter (Finance Department)', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Audit committee resolution register', budget: 'OPEX' },
      { id: 'kpi-chauke-15', kpiNo: 'E_24', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage on Implementation of Board Resolutions Resolved (Finance Department) per quarter', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Report on Implementation of Board Resolutions.', budget: 'OPEX' },
      { id: 'kpi-chauke-16', kpiNo: 'E_27', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of strategic lekgotla resolutions implemented by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '90%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: '90%', poe: 'Signed quarterly Report on Implementation of Strategic Lekgotla resolutions', budget: 'OPEX' },

      // KPA 2: LOCAL ECONOMIC DEVELOPMENT (10%)
      { id: 'kpi-chauke-17', kpiNo: 'E_28', kpa: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of fundraising proposals submitted to funders for LED projects submitted by Local Municipalities by 30 June 2027.', weighting: '3', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Signed fundraising proposals', budget: 'OPEX' },
      { id: 'kpi-chauke-18', kpiNo: 'E_30', kpa: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of District Investment Prospect developed by 30 June 2027', weighting: '3', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: '1 (Draft District Investment Prospect)', q3Target: 'N/A', q4Target: '1 (Approved District Investment Prospect)', poe: 'Approved District Investment Prospect and Board Resolution.', budget: 'OPEX' },
      { id: 'kpi-chauke-19', kpiNo: 'E_32', kpa: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of brick plant accreditation obtained from the SABS by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: '1 (SABS lab assessment 1 conducted)', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1 (SABS Accreditation certificate)', poe: 'SABS Lab assessment results / SABS Accreditation certificate', budget: 'OPEX' },
      { id: 'kpi-chauke-20', kpiNo: 'E_33', kpa: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', strategicGoal: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of bricks produced per quarter', weighting: '2', baseline: 'NEW', annualTarget: '1 472 000', q1Target: 'N/A', q2Target: '490 667', q3Target: '490 667', q4Target: '490 667', poe: 'Signed quarterly brick production reports', budget: 'OPEX' },

      // KPA 4: PROJECT MANAGEMENT (15%)
      { id: 'kpi-chauke-21', kpiNo: 'P_01', kpa: 'KPA 4: PROJECT MANAGEMENT', strategicGoal: 'KPA 4: PROJECT MANAGEMENT', kpi: 'Management and operationalisation of the Emakhazeni brick manufacturing plant (Emakhazeni Local Municipality)', weighting: '5', baseline: 'NEW', annualTarget: 'Stage 2: implementation (75%): Brick Plant Operations Progress Report', q1Target: 'Stage 1: Planning (100%): Recruitment and Training; Develop Pricing and Marketing Strategy; Quality Assurance Framework', q2Target: 'Stage 2: implementation (15%): Brick Plant Operations Progress Report', q3Target: 'Stage 2: implementation (30%): Brick Plant Operations Progress Report', q4Target: 'Stage 2: implementation (75%): Brick Plant Operations Progress Report', poe: 'Attendance Registers and Progress report (Signed and dated); Pricing and Marketing Strategy; Signed Quality Assurance Framework; Signed Operations Progress Report', budget: 'R 2 805' },
      { id: 'kpi-chauke-22', kpiNo: 'P_02', kpa: 'KPA 4: PROJECT MANAGEMENT', strategicGoal: 'KPA 4: PROJECT MANAGEMENT', kpi: 'Water Treatment Chemicals Distribution (Thembisile Hani Local Municipality)', weighting: '5', baseline: 'NEW', annualTarget: 'Stage 2: implementation (75%): Chemical distribution Operations Progress Report', q1Target: 'Stage 1: Planning (100%): Recruitment and Training', q2Target: 'Stage 2: implementation (15%): Chemical distribution Operations Progress Report', q3Target: 'Stage 2: implementation (30%): Chemical distribution Operations Progress Report', q4Target: 'Stage 2: implementation (75%): Chemical distribution Operations Progress Report', poe: 'Attendance Registers and Progress report (Signed and dated); Signed Operations Progress Report', budget: 'R 2 295' },
      { id: 'kpi-chauke-23', kpiNo: 'P_03', kpa: 'KPA 4: PROJECT MANAGEMENT', strategicGoal: 'KPA 4: PROJECT MANAGEMENT', kpi: 'Feasibility study and business plan for the packaging of land for investment attraction (District wide)', weighting: '5', baseline: 'NEW', annualTarget: 'Stage 3 - Implementation (20%): Inception Report', q1Target: 'Stage 1 – Planning Stage (100%): MOU/SLA With Steve Tshwete Local Municipality', q2Target: 'Stage 1 - Planning Stage (100%): Bid Specification Committee Resolution', q3Target: 'Stage 2 - Procurement (100%): Bid Evaluation Committee Resolution, Bid Adjudication Committee Resolution and Appointment of Service Provider', q4Target: 'Stage 3 - Implementation (20%): Inception Report', poe: 'Signed and dated MOU/SLA, BSC Resolution, Tender Advert (Tear Sheet), BEC Resolution, BAC Resolution, Signed & Dated Appointment Letter, Signed and dated Inception Report', budget: 'R 750' },

      // KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT (35%)
      { id: 'kpi-chauke-24', kpiNo: 'E_34', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of procurement plan implemented per quarter', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Procurement plan report', budget: 'OPEX' },
      { id: 'kpi-chauke-25', kpiNo: 'E_35', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of Draft MTREF Budget submitted and approved by 30 March 2027', weighting: '2', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Approved Draft MTREF Budget, Board and Council resolution', budget: 'OPEX' },
      { id: 'kpi-chauke-26', kpiNo: 'E_36', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of Final MTREF Budget submitted and approved by 31 May 2027', weighting: '2', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Approved Final MTREF Budget, Board and Council resolution', budget: 'OPEX' },
      { id: 'kpi-chauke-27', kpiNo: 'E_37', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Annual Financial Statements (AFS) submitted by 31 August 2026 to Auditor General', weighting: '5', baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Annual Financial Statements (AFS) and acknowledgement letter (of receipt) from the AG.', budget: 'OPEX' },
      { id: 'kpi-chauke-28', kpiNo: 'E_38', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of section 88 (Mid-year) budget and performance reports submitted to the Board and the NDM by 20 January 2026.', weighting: '3', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Signed Section 88 (midyear) MFMA report and proof of submission to the Board and NDM', budget: 'OPEX' },
      { id: 'kpi-chauke-29', kpiNo: 'E_39', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of SCM reports submitted to the Board Chairperson per quarter', weighting: '3', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: "Signed Quarterly SCM report and proof of submission to Board Chairperson's office", budget: 'OPEX' },
      { id: 'kpi-chauke-30', kpiNo: 'E_40', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: "Percentage of total Agency's operating expenditure spent on contracted services physically residing within the District (circular 88) by 30 June 2026", weighting: '2', baseline: 'NEW', annualTarget: '40%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '30%', q4Target: '40%', poe: "Signed contracted services report indicating contractors' physical addresses and expenditure spent on contracted services physically residing within the municipal area.", budget: 'OPEX' },
      { id: 'kpi-chauke-31', kpiNo: 'E_41', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Average number of days from the point of advertising to the letter of award per 80/20 procurement process (circular 88) by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '120', q1Target: '120', q2Target: '120', q3Target: '120', q4Target: '120', poe: 'Average number of days SCM official (Signed) report', budget: 'OPEX' },
      { id: 'kpi-chauke-32', kpiNo: 'E_42', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Number of monthly Section 87(11) MFMA reports submitted to Chairperson of the Board and the NDM by 30 June 2027', weighting: '3', baseline: '12', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Section 87(11) MFMA reports and proof of submission to Chairperson of the Board and the NDM', budget: 'OPEX' },
      { id: 'kpi-chauke-33', kpiNo: 'E_43', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of transfer and subsidies budget actually spent on projects by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '90%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: '90%', poe: 'Transfer and subsidies Expenditure signed progress report', budget: 'R 5 100' },
      { id: 'kpi-chauke-34', kpiNo: 'E_44', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of operational budget actually spent by 30 June 2027 (circular 88)', weighting: '2', baseline: 'NEW', annualTarget: '90%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: '90%', poe: 'Signed Operational Expenditure progress report', budget: 'R 1 700' },
      { id: 'kpi-chauke-35', kpiNo: 'E_45', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of total capital expenditure funded from NDM grant (circular 88) by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '90%', q1Target: '5%', q2Target: '25%', q3Target: '40%', q4Target: '90%', poe: 'Signed Capital expenditure progress report', budget: 'R 100' },
      { id: 'kpi-chauke-36', kpiNo: 'E_46', kpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', strategicGoal: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of payments made to service providers who submitted complete invoices within 30-days of invoice submission (circular 88)', weighting: '5', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Expenditure Report and official invoice register', budget: 'OPEX' }
    ],
    pdps: [
      {
        id: 'pdp-chauke-1',
        skillsGap: 'Caseware application training',
        outcomes: 'Functional reporting ito GRAP Standards',
        suggestedTraining: 'Caseware',
        modeOfDelivery: 'External Service provider',
        timeFrame: '1 Jul 2026 to 30 June 2027',
        workOpportunity: 'Preparation of Annual Financial Statements (AFS) in accordance with GRAP Standards',
        supportPerson: 'CEO'
      },
      {
        id: 'pdp-chauke-2',
        skillsGap: 'Munsoft financial system and Payroll training',
        outcomes: 'Functional reporting ito Mscoa financial system an Payroll',
        suggestedTraining: 'Munsoft and Payroll',
        modeOfDelivery: 'External Service provider',
        timeFrame: '1 Jul 2026 to 30 June 2027',
        workOpportunity: 'mSCOA financial system management and monthly payroll verification',
        supportPerson: 'CEO'
      },
      {
        id: 'pdp-chauke-3',
        skillsGap: 'GRAP standards applicable to AFS preparation',
        outcomes: 'Functional reporting ito GRAP Standards',
        suggestedTraining: 'GRAP Standards update',
        modeOfDelivery: 'External service provider',
        timeFrame: '1 Jul 2026 to 30 June 2027',
        workOpportunity: 'Compilation and review of compliant Annual Financial Statements',
        supportPerson: 'CEO'
      }
    ]
  },

  // ============================================================================
  // 3. LYDIA SADI SEHLAKO — DIVISIONAL MANAGER: SUPPLY CHAIN MANAGEMENT (NEDA)
  // ============================================================================
  {
    userId: 'neda-user-sehlakols',
    primaryEmail: 'sehlakols@neda.gov.za',
    aliases: [
      'sehlakols@neda.gov.za',
      'SehlakoLS@neda.gov.za',
      'sehlakols@nkangaladm.gov.za'
    ],
    fullName: 'Lydia Sadi Sehlako',
    jobFunction: 'Divisional Manager: Supply Chain Management',
    department: 'Finance',
    directorate: 'Finance and Administration',
    level: '03',
    role: 'Manager',
    supervisorName: 'Kulani Collen Chauke',
    supervisorTitle: 'Chief Financial Officer',
    supervisorEmail: 'chaukekc@neda.gov.za',
    financialYear: '2026/2027',
    period: '01 July 2026 – 30 June 2027',
    pdfAssetUrl: '/assets/aistudio/Lydia_Performance_Agreement__28_July_2026___PMS_Inputs_83411ab3.pdf',
    kpas: [
      { id: 'kpa-sehlako-1', title: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', nationalKpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', parentObjective: 'Good Governance and Institutional Transformation', mscoaCode: 'Operational', weighting: '50' },
      { id: 'kpa-sehlako-2', title: 'KPA 2: FINANCIAL VIABILITY', nationalKpa: 'KPA 2: FINANCIAL VIABILITY', parentObjective: 'Financial Viability', mscoaCode: 'Operational', weighting: '12' },
      { id: 'kpa-sehlako-3', title: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', nationalKpa: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', parentObjective: 'Administration of Supply Chain Management', mscoaCode: 'Operational', weighting: '25' },
      { id: 'kpa-sehlako-4', title: 'KPA 4: CONTRACT MANAGEMENT', nationalKpa: 'KPA 4: CONTRACT MANAGEMENT', parentObjective: 'Contract Management', mscoaCode: 'Operational', weighting: '5' },
      { id: 'kpa-sehlako-5', title: 'KPA 5: REPORT ON SCM MATTERS TO THE BOARD AND OTHER STAKEHOLDERS', nationalKpa: 'KPA 5: REPORT ON SCM MATTERS TO THE BOARD AND OTHER STAKEHOLDERS', parentObjective: 'Report on SCM Matters to the Board and Other Stakeholders', mscoaCode: 'Operational', weighting: '8' }
    ],
    competencyType: 'jsc',
    coreCompetencies: [
      {
        id: 'cc-sehlako-1',
        category: 'Core Professional competencies',
        competency: 'Planning and organizing',
        components: 'Core Professional competencies',
        definition: 'Manages the procurement and tenders process according to prevailing legislation, norms and standards',
        weighting: 20,
        level: 'Level 4'
      },
      {
        id: 'cc-sehlako-2',
        category: 'Functional Competencies',
        competency: 'Procurement and Tenders',
        components: 'Functional Competencies',
        definition: 'Manages the procurement and tenders process according to prevailing legislation, norms and standards',
        weighting: 20,
        level: 'Level 4'
      },
      {
        id: 'cc-sehlako-3',
        category: 'Public Service Orientation Competencies',
        competency: 'Service Delivery Orientation',
        components: 'Public Service Orientation Competencies',
        definition: 'The ability to explore and implement new ways of delivering services that contribute to the improvement of entity processes in order to achieve entity goals.',
        weighting: 20,
        level: 'Level 4'
      },
      {
        id: 'cc-sehlako-4',
        category: 'Personal Competencies',
        competency: 'Action and Outcome Orientation',
        components: 'Personal Competencies',
        definition: "The display of high work ethic in setting and achieving challenging goals, meeting deadlines and keeping promises. It manifests itself in one's ability to stay focused on tasks, to be energetic, persistent and reliable.",
        weighting: 20,
        level: 'Level 4'
      },
      {
        id: 'cc-sehlako-5',
        category: 'Management / leadership competencies',
        competency: 'Direction setting',
        components: 'Management / leadership competencies',
        definition: 'The ability to create a clear sense of common purpose and vision for others with a view to obtaining buying and commitment to the goals.',
        weighting: 20,
        level: 'Level 4'
      }
    ],
    jscs: [
      {
        id: 'jsc-sehlako-1',
        jscNo: '1',
        category: 'Core Professional competencies',
        competency: 'Planning and organizing',
        definition: {
          mainText: 'Manages the procurement and tenders process according to prevailing legislation, norms and standards',
          subsections: [{ heading: 'Core Professional competencies', paragraphs: ['Manages the procurement and tenders process according to prevailing legislation, norms and standards'] }]
        },
        level: 'Level 4',
        weight: 20
      },
      {
        id: 'jsc-sehlako-2',
        jscNo: '2',
        category: 'Functional Competencies',
        competency: 'Procurement and Tenders',
        definition: {
          mainText: 'Manages the procurement and tenders process according to prevailing legislation, norms and standards',
          subsections: [{ heading: 'Functional Competencies', paragraphs: ['Manages the procurement and tenders process according to prevailing legislation, norms and standards'] }]
        },
        level: 'Level 4',
        weight: 20
      },
      {
        id: 'jsc-sehlako-3',
        jscNo: '3',
        category: 'Public Service Orientation Competencies',
        competency: 'Service Delivery Orientation',
        definition: {
          mainText: 'The ability to explore and implement new ways of delivering services that contribute to the improvement of entity processes in order to achieve entity goals.',
          subsections: [{ heading: 'Public Service Orientation Competencies', paragraphs: ['The ability to explore and implement new ways of delivering services that contribute to the improvement of entity processes in order to achieve entity goals.'] }]
        },
        level: 'Level 4',
        weight: 20
      },
      {
        id: 'jsc-sehlako-4',
        jscNo: '4',
        category: 'Personal Competencies',
        competency: 'Action and Outcome Orientation',
        definition: {
          mainText: "The display of high work ethic in setting and achieving challenging goals, meeting deadlines and keeping promises. It manifests itself in one's ability to stay focused on tasks, to be energetic, persistent and reliable.",
          subsections: [{ heading: 'Personal Competencies', paragraphs: ["The display of high work ethic in setting and achieving challenging goals, meeting deadlines and keeping promises. It manifests itself in one's ability to stay focused on tasks, to be energetic, persistent and reliable."] }]
        },
        level: 'Level 4',
        weight: 20
      },
      {
        id: 'jsc-sehlako-5',
        jscNo: '5',
        category: 'Management / leadership competencies',
        competency: 'Direction setting',
        definition: {
          mainText: 'The ability to create a clear sense of common purpose and vision for others with a view to obtaining buying and commitment to the goals.',
          subsections: [{ heading: 'Management / leadership competencies', paragraphs: ['The ability to create a clear sense of common purpose and vision for others with a view to obtaining buying and commitment to the goals.'] }]
        },
        level: 'Level 4',
        weight: 20
      }
    ],
    kpis: [
      // KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION (50%)
      { id: 'kpi-sehlako-1', kpiNo: 'E_03', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of quarterly reports submitted to the Board (Supply Chain Management).', weighting: '6', baseline: '2', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Board Resolutions', budget: 'OPEX' },
      { id: 'kpi-sehlako-2', kpiNo: 'E_02', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of new/reviewed policies and enabling documents approved by the board by 30 June 2026.', weighting: '6', baseline: '1', annualTarget: '5', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '5', poe: 'Reviewed policies and Board resolution', budget: 'OPEX' },
      { id: 'kpi-sehlako-3', kpiNo: 'E_17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (Supply Chain Management)', weighting: '3', baseline: '90%', annualTarget: '90%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: '90%', poe: 'Signed Quarterly Strategic Risk report', budget: 'OPEX' },
      { id: 'kpi-sehlako-4', kpiNo: 'E_20', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of internal audit recommendations implemented per quarter SCM', weighting: '3', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly IA report', budget: 'OPEX' },
      { id: 'kpi-sehlako-5', kpiNo: 'E_23', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of implementation of audit committee resolutions adopted by board per quarter.', weighting: '3', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Audit committee resolution register', budget: 'OPEX' },
      { id: 'kpi-sehlako-6', kpiNo: 'E_24', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage on implementation of Board and board Resolutions resolved (Supply Chain Management) per quarter.', weighting: '4', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly report on implementation of Board and board resolutions', budget: 'OPEX' },
      { id: 'kpi-sehlako-7', kpiNo: 'E_28', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of fundraising proposal submitted to the funders for LED projects submitted by Local Municipalities by 30 June 2027', weighting: '10', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Signed fundraising proposals', budget: 'OPEX' },
      { id: 'kpi-sehlako-8', kpiNo: 'E_27', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of strategic Lekgotla resolutions implemented by 30 June 2027', weighting: '5', baseline: '90%', annualTarget: '90%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: '90%', poe: 'Signed quarterly report implementation of strategic Lekgotla resolutions', budget: 'OPEX' },
      { id: 'kpi-sehlako-9', kpiNo: 'SCM_09', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by August 2026', weighting: '5', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },
      { id: 'kpi-sehlako-10', kpiNo: 'SCM_10', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of performance assessments conducted per quarter', weighting: '5', baseline: '1', annualTarget: '4 (Assessment)', q1Target: '1 (Fourth Quarter Assessment)', q2Target: '1 (First Quarter Assessment)', q3Target: '1 (Second Quarter Assessment)', q4Target: '1 (third Quarter assessment)', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },

      // KPA 2: FINANCIAL VIABILITY (12%)
      { id: 'kpi-sehlako-11', kpiNo: 'SCM_11', kpa: 'KPA 2: FINANCIAL VIABILITY', strategicGoal: 'KPA 2: FINANCIAL VIABILITY', kpi: '100% attendance at scheduled Bid Specification Committee meetings per quarter', weighting: '4', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Bid Specifications Committee Attendance Report', budget: 'OPEX' },
      { id: 'kpi-sehlako-12', kpiNo: 'SCM_12', kpa: 'KPA 2: FINANCIAL VIABILITY', strategicGoal: 'KPA 2: FINANCIAL VIABILITY', kpi: '100% attendance at scheduled Bid Evaluation Committee meetings per quarter', weighting: '4', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Bid Specifications Committee Attendance Report', budget: 'OPEX' },
      { id: 'kpi-sehlako-13', kpiNo: 'SCM_13', kpa: 'KPA 2: FINANCIAL VIABILITY', strategicGoal: 'KPA 2: FINANCIAL VIABILITY', kpi: 'Percentage of procurement plan implemented per quarter', weighting: '4', baseline: '100%', annualTarget: '100%', q1Target: 'N/A', q2Target: '60%', q3Target: '80%', q4Target: '100%', poe: 'Signed Quarterly Procurement plan', budget: 'OPEX' },

      // KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT (25%)
      { id: 'kpi-sehlako-14', kpiNo: 'SCM_14', kpa: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', strategicGoal: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', kpi: 'Number of quarterly reports on deviations made per quarter', weighting: '5', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly reports on deviation', budget: 'OPEX' },
      { id: 'kpi-sehlako-15', kpiNo: 'SCM_15', kpa: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', strategicGoal: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', kpi: 'Number of quarterly reports on procurement of transaction value over R2 000.00 [Two Thousand Rand] but less than R30 000.00 [Thirty Thousand Rand] (VAT included);', weighting: '5', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'SCM Quarterly report and Annexure for procurement of a transaction value over R2 000.00 [Two Thousand Rand] but less than R30 000.00 [Thirty Thousand Rand] (VAT included);', budget: 'OPEX' },
      { id: 'kpi-sehlako-16', kpiNo: 'SCM_16', kpa: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', strategicGoal: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', kpi: 'Number of quarterly reports on procurement of goods or services valued from R30 001.00 [Thirty Thousand and One Cent] to R200 000.00 [Two Hundred Thousand Rand], (VAT included)', weighting: '5', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'SCM Quarterly report and Annexure for formal written price quotations for procurement valued from R30 001.00 [Thirty Thousand and One Cent] to R200 000.00 [Two Hundred Thousand Rand], (VAT included);', budget: 'OPEX' },
      { id: 'kpi-sehlako-17', kpiNo: 'SCM_17', kpa: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', strategicGoal: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', kpi: '% of department procurement plan developed and submitted by 30 June 2026', weighting: '5', baseline: 'New', annualTarget: '100%', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '100%', poe: 'Approved procurement plan for the next financial year (2026-27)', budget: 'OPEX' },
      { id: 'kpi-sehlako-18', kpiNo: 'SCM_18', kpa: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', strategicGoal: 'KPA 3: ADMINISTRATION OF SUPPLY CHAIN MANAGEMENT', kpi: 'Number of monthly reports on procurement plan submitted to the CFO by 30 June 2026', weighting: '5', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Monthly procurement plan reports', budget: 'OPEX' },

      // KPA 4: CONTRACT MANAGEMENT (5%)
      { id: 'kpi-sehlako-19', kpiNo: 'SCM_19', kpa: 'KPA 4: CONTRACT MANAGEMENT', strategicGoal: 'KPA 4: CONTRACT MANAGEMENT', kpi: 'Percentage of performance evaluation reports performed/loaded on the Contract Management System within 15 days', weighting: '5', baseline: 'New', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'SCM Contract management report', budget: 'OPEX' },

      // KPA 5: REPORT ON SCM MATTERS TO THE BOARD AND OTHER STAKEHOLDERS (8%)
      { id: 'kpi-sehlako-20', kpiNo: 'SCM_20', kpa: 'KPA 5: REPORT ON SCM MATTERS TO THE BOARD AND OTHER STAKEHOLDERS', strategicGoal: 'KPA 5: REPORT ON SCM MATTERS TO THE BOARD AND OTHER STAKEHOLDERS', kpi: 'Total municipal operating expenditure spent on contracted service physically residing within the municipal area', weighting: '4', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly signed contracted service progress report with physical address of awarded contractors.', budget: 'OPEX' },
      { id: 'kpi-sehlako-21', kpiNo: 'SCM_21', kpa: 'KPA 5: REPORT ON SCM MATTERS TO THE BOARD AND OTHER STAKEHOLDERS', strategicGoal: 'KPA 5: REPORT ON SCM MATTERS TO THE BOARD AND OTHER STAKEHOLDERS', kpi: 'Average number of days from the point of advertising to the letter of award per 80/20 procurement process (circular 88) by 30 June 2026', weighting: '4', baseline: 'New', annualTarget: '120 days', q1Target: '120 days', q2Target: '120 days', q3Target: '120 days', q4Target: '120 days', poe: 'Quarterly signed average days SCM official report', budget: 'OPEX' }
    ],
    pdps: [
      {
        id: 'pdp-sehlako-1',
        skillsGap: 'N/A (Annexure B: Personal Development Plan — No critical skills performance gap recorded; ongoing MFMA SCM & Contract Management continuous professional development)',
        outcomes: '100% compliance with MFMA Supply Chain Management Regulations and Circular 88 procurement turnaround targets',
        suggestedTraining: 'Advanced MFMA Supply Chain & Contract Management Refresher',
        modeOfDelivery: 'External / National Treasury',
        timeFrame: '01 July 2026 to 30 June 2027',
        workOpportunity: 'Administration of NEDA Supply Chain Management, Bid Committees, and Contract Management System',
        supportPerson: 'Chief Financial Officer (Kulani Collen Chauke)'
      }
    ],
    disclosures: [
      { businessName: 'Beyond Design and Furniture', registrationNumber: '2020/694195/07', percentageOwned: '50%' },
      { businessName: 'Kapano Public Services', registrationNumber: '2001/039578/23', percentageOwned: '25%' }
    ]
  },

  // ============================================================================
  // 4. NTSOAKI NOMONDE CHARMAINE NGOMANE — COMPANY SECRETARY (NEDA)
  // ============================================================================
  {
    userId: 'neda-user-ngomanennc',
    primaryEmail: 'ngomanennc@neda.gov.za',
    aliases: [
      'ngomanennc@neda.gov.za',
      'NgomaneNNC@neda.gov.za',
      'ngomanennc@nkangaladm.gov.za'
    ],
    fullName: 'Ntsoaki Nomonde Charmaine Ngomane',
    jobFunction: 'Company Secretary',
    department: 'Office of the Chief Executive Officer',
    directorate: 'Office of the Chief Executive Officer',
    level: '3/9',
    role: 'Manager',
    supervisorName: 'Johan Prince Mangani',
    supervisorTitle: 'Acting Chief Executive Officer',
    supervisorEmail: 'manganijp@nkangaladm.gov.za',
    financialYear: '2026/2027',
    period: '01 July 2026 – 30 June 2027',
    pdfAssetUrl: '/assets/aistudio/Ngomane_N__2026-2027_Performance_Agreement_NEDA_Company_Sec_9b3d8c69.pdf',
    kpas: [
      { id: 'kpa-ngomane-1', title: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', nationalKpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', parentObjective: 'Good Governance and Institutional Transformation', mscoaCode: 'Operational', weighting: '40' },
      { id: 'kpa-ngomane-2', title: 'KPA 2: FINANCIAL VIABILITY', nationalKpa: 'KPA 2: FINANCIAL VIABILITY', parentObjective: 'Financial Viability', mscoaCode: 'Operational', weighting: '3' },
      { id: 'kpa-ngomane-3', title: 'KPA 3: SECRETARIAT SERVICES', nationalKpa: 'KPA 3: SECRETARIAT SERVICES', parentObjective: 'Secretariat Services', mscoaCode: 'Operational', weighting: '34' },
      { id: 'kpa-ngomane-4', title: 'KPA 4: CONTRACT MANAGEMENT', nationalKpa: 'KPA 4: CONTRACT MANAGEMENT', parentObjective: 'Contract Management', mscoaCode: 'Operational', weighting: '9' },
      { id: 'kpa-ngomane-5', title: 'KPA 5: LITIGATION MANAGEMENT', nationalKpa: 'KPA 5: LITIGATION MANAGEMENT', parentObjective: 'Litigation Management', mscoaCode: 'Operational', weighting: '4' },
      { id: 'kpa-ngomane-6', title: 'KPA 6: POPIA/ PAIA/CIPC/COIDA/SARS COMPLIANCE', nationalKpa: 'KPA 6: POPIA/ PAIA/CIPC/COIDA/SARS COMPLIANCE', parentObjective: 'POPIA / PAIA / CIPC / COIDA / SARS Statutory Compliance', mscoaCode: 'Operational', weighting: '10' }
    ],
    competencyType: 'jsc',
    coreCompetencies: [
      {
        id: 'cc-ngomane-1',
        category: 'Core Professional competencies',
        competency: 'Communication',
        components: 'Core Professional competencies',
        definition: 'The capacity to listen attentively, grasp issues, present information in a clear manner and respond appropriately to verbal and written communication of others.',
        weighting: 20,
        level: 'Level 4'
      },
      {
        id: 'cc-ngomane-2',
        category: 'Functional Competencies',
        competency: 'Financial Reporting',
        components: 'Functional Competencies',
        definition: 'Ability to Identify overall objectives of financial reporting, specific information needs of stakeholders & the general information needs of others.',
        weighting: 20,
        level: 'Level 4'
      },
      {
        id: 'cc-ngomane-3',
        category: 'Public Service Orientation Competencies',
        competency: 'Planning and Organising',
        components: 'Public Service Orientation Competencies',
        definition: 'The ability to plan activities within specific timeframes and then to execute these activities according to plan',
        weighting: 20,
        level: 'Level 4'
      },
      {
        id: 'cc-ngomane-4',
        category: 'Personal Competencies',
        competency: 'Resilience',
        components: 'Personal Competencies',
        definition: 'The ability to responds constructively to pressure / stress situations and the ability to persist goals despite obstacles and setbacks.',
        weighting: 20,
        level: 'Level 4'
      },
      {
        id: 'cc-ngomane-5',
        category: 'Management / leadership competencies',
        competency: 'Budgeting',
        components: 'Management / leadership competencies',
        definition: 'Establish and Manages credible budgets within the legislative, political and administrative mandates.',
        weighting: 20,
        level: 'Level 4'
      }
    ],
    jscs: [
      {
        id: 'jsc-ngomane-1',
        jscNo: '1',
        category: 'Core Professional competencies',
        competency: 'Communication',
        definition: {
          mainText: 'The capacity to listen attentively, grasp issues, present information in a clear manner and respond appropriately to verbal and written communication of others.',
          subsections: [{ heading: 'Core Professional competencies', paragraphs: ['The capacity to listen attentively, grasp issues, present information in a clear manner and respond appropriately to verbal and written communication of others.'] }]
        },
        level: 'Level 4',
        weight: 20
      },
      {
        id: 'jsc-ngomane-2',
        jscNo: '2',
        category: 'Functional Competencies',
        competency: 'Financial Reporting',
        definition: {
          mainText: 'Ability to Identify overall objectives of financial reporting, specific information needs of stakeholders & the general information needs of others.',
          subsections: [{ heading: 'Functional Competencies', paragraphs: ['Ability to Identify overall objectives of financial reporting, specific information needs of stakeholders & the general information needs of others.'] }]
        },
        level: 'Level 4',
        weight: 20
      },
      {
        id: 'jsc-ngomane-3',
        jscNo: '3',
        category: 'Public Service Orientation Competencies',
        competency: 'Planning and Organising',
        definition: {
          mainText: 'The ability to plan activities within specific timeframes and then to execute these activities according to plan',
          subsections: [{ heading: 'Public Service Orientation Competencies', paragraphs: ['The ability to plan activities within specific timeframes and then to execute these activities according to plan'] }]
        },
        level: 'Level 4',
        weight: 20
      },
      {
        id: 'jsc-ngomane-4',
        jscNo: '4',
        category: 'Personal Competencies',
        competency: 'Resilience',
        definition: {
          mainText: 'The ability to responds constructively to pressure / stress situations and the ability to persist goals despite obstacles and setbacks.',
          subsections: [{ heading: 'Personal Competencies', paragraphs: ['The ability to responds constructively to pressure / stress situations and the ability to persist goals despite obstacles and setbacks.'] }]
        },
        level: 'Level 4',
        weight: 20
      },
      {
        id: 'jsc-ngomane-5',
        jscNo: '5',
        category: 'Management / leadership competencies',
        competency: 'Budgeting',
        definition: {
          mainText: 'Establish and Manages credible budgets within the legislative, political and administrative mandates.',
          subsections: [{ heading: 'Management / leadership competencies', paragraphs: ['Establish and Manages credible budgets within the legislative, political and administrative mandates.'] }]
        },
        level: 'Level 4',
        weight: 20
      }
    ],
    kpis: [
      // KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION (40%)
      { id: 'kpi-ngomane-1', kpiNo: 'CS_01', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of new/reviewed policies approved by Board by 30 June 2027', weighting: '3', baseline: 'NEW', annualTarget: '15', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Report to Board and Board Resolution(s) (stating all the policies reviewed by Board).', budget: 'OPEX' },
      { id: 'kpi-ngomane-2', kpiNo: 'CS_02', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of quarterly reports submitted to the Board and the NDM by 30 June 2027.', weighting: '3', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly Report, Board and Council resolutions', budget: 'OPEX' },
      { id: 'kpi-ngomane-3', kpiNo: 'CS_03', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Maximum acceptable percentage of Staff vacancy rate (circular 88) per quarter', weighting: '2', baseline: 'NEW', annualTarget: '10% or below', q1Target: '10% or below', q2Target: '10% or below', q3Target: '10% or below', q4Target: '10% or below', poe: 'Signed Vacancy Rate Report (Indicating the vacancy rate percentage)', budget: 'OPEX' },
      { id: 'kpi-ngomane-4', kpiNo: 'CS_04', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of Board members who have declared their financial interests (Circular 88) by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Report on Declarations of Interest by Board and Board Resolution.', budget: 'OPEX' },
      { id: 'kpi-ngomane-5', kpiNo: 'CS_05', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of shared service agreement (SDAs) reviewed and submitted to NDM by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Reviewed SDA and proof of submission.', budget: 'OPEX' },
      { id: 'kpi-ngomane-6', kpiNo: 'CS_06', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of performance agreements signed with supervisor and submitted to OPME & PMDS unit for the 2026/2027 financial year by 30 July 2027', weighting: '4', baseline: 'NEW', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },
      { id: 'kpi-ngomane-7', kpiNo: 'CS_07', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of self-assessment report compiled and submitted to Supervisor per quarter.', weighting: '2', baseline: 'NEW', annualTarget: '4', q1Target: '1 annual assessment', q2Target: '1 Q1 assessment', q3Target: '1 midyear assessment', q4Target: '1 Q3 assessment', poe: 'Quarterly Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },
      { id: 'kpi-ngomane-8', kpiNo: 'CS_08', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of repeat audit findings (circular 88) by 30 December 2026', weighting: '2', baseline: 'NEW', annualTarget: '0 (not above)', q1Target: 'N/A', q2Target: '0 (not above)', q3Target: 'N/A', q4Target: 'N/A', poe: "AG's Audit Report", budget: 'OPEX' },
      { id: 'kpi-ngomane-9', kpiNo: 'CS_09', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of Action Plan on issues raised by the Auditor General tabled to the board by 30 December 2026.', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'Audit Action Plan and Board resolution', budget: 'OPEX' },
      { id: 'kpi-ngomane-10', kpiNo: 'CS_10', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of AG Findings raised in the Management Letter resolved (Total organization) by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '40%', q4Target: '100%', poe: 'Signed Progress Report on the Implementation of the Audit Action Plan.', budget: 'OPEX' },
      { id: 'kpi-ngomane-11', kpiNo: 'CS_11', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of Final Strategic Plan tabled for approval to Board and Council by 31 May 2027', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Final Strategic Plan Document, Board & Council Resolution', budget: 'OPEX' },
      { id: 'kpi-ngomane-12', kpiNo: 'CS_12', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of Strategic Planning Sessions convened by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Signed Notice, Agenda and Attendance Register', budget: 'OPEX' },
      { id: 'kpi-ngomane-13', kpiNo: 'CS_13', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of Final 2027/2028 Annual Performance Plan approved by the Board Chairperson within 28 days after approval of Budget', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Approved and signed 2027/2028 Annual Performance plan', budget: 'OPEX' },
      { id: 'kpi-ngomane-14', kpiNo: 'CS_14', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of Adjusted 2026/2027 Annual Performance Plan approved within 28 days after the approval of the Adjusted Budget.', weighting: '2', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Approved and signed Adjusted 2026/2027 Annual Performance Plan, Board resolution', budget: 'OPEX' },
      { id: 'kpi-ngomane-15', kpiNo: 'CS_15', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (Total organisation)', weighting: '2', baseline: 'NEW', annualTarget: '90%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: '90%', poe: 'Signed Quarterly Strategic Risk report', budget: 'OPEX' },
      { id: 'kpi-ngomane-16', kpiNo: 'CS_16', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of board resolutions implemented by 30 June 2027', weighting: '1', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Board Resolution Monitoring Report', budget: 'OPEX' },
      { id: 'kpi-ngomane-17', kpiNo: 'CS_17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Operational Risks Identified per quarter (Total Organisation)', weighting: '2', baseline: 'NEW', annualTarget: '90%', q1Target: '60%', q2Target: '70%', q3Target: '80%', q4Target: '90%', poe: 'Signed Quarterly Operational Risk report', budget: 'OPEX' },
      { id: 'kpi-ngomane-18', kpiNo: 'CS_18', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of agenda items deferred to the next Board meeting (circular 88) per quarter', weighting: '2', baseline: 'NEW', annualTarget: '3, (or below)', q1Target: '3, (or below)', q2Target: '3, (or below)', q3Target: '3, (or below)', q4Target: '3, (or below)', poe: 'Unsigned minutes of the current quarter and Signed Board Minutes of previous quarter', budget: 'OPEX' },

      // KPA 2: FINANCIAL VIABILITY (3%)
      { id: 'kpi-ngomane-19', kpiNo: 'CS_19', kpa: 'KPA 2: FINANCIAL VIABILITY', strategicGoal: 'KPA 2: FINANCIAL VIABILITY', kpi: '100% attendance at scheduled Bid Committee meetings per quarter', weighting: '3', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Bid Committee Attendance Report', budget: 'OPEX' },

      // KPA 3: SECRETARIAT SERVICES (34%)
      { id: 'kpi-ngomane-20', kpiNo: 'CS_20', kpa: 'KPA 3: SECRETARIAT SERVICES', strategicGoal: 'KPA 3: SECRETARIAT SERVICES', kpi: 'Number of Draft Year Planner for Board meetings overseen by 30 June 2027.', weighting: '10', baseline: 'NEW', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Copy of Draft Year Planner for Board.', budget: 'OPEX' },
      { id: 'kpi-ngomane-21', kpiNo: 'CS_21', kpa: 'KPA 3: SECRETARIAT SERVICES', strategicGoal: 'KPA 3: SECRETARIAT SERVICES', kpi: 'Number of registers of Board Resolutions overseen by 30 June 2027.', weighting: '3', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Copy of register of Board Resolutions', budget: 'OPEX' },
      { id: 'kpi-ngomane-22', kpiNo: 'CS_22', kpa: 'KPA 3: SECRETARIAT SERVICES', strategicGoal: 'KPA 3: SECRETARIAT SERVICES', kpi: 'Number of registers of Council Resolutions related to the NEDA overseen by 30 June 2027.', weighting: '3', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Copy of register of Council Resolutions', budget: 'OPEX' },
      { id: 'kpi-ngomane-23', kpiNo: 'CS_23', kpa: 'KPA 3: SECRETARIAT SERVICES', strategicGoal: 'KPA 3: SECRETARIAT SERVICES', kpi: 'Number of Board Meetings coordinated by 30 June 2027.', weighting: '10', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Notice, Minutes & Attendance Register for Board meeting.', budget: 'OPEX' },
      { id: 'kpi-ngomane-24', kpiNo: 'CS_24', kpa: 'KPA 3: SECRETARIAT SERVICES', strategicGoal: 'KPA 3: SECRETARIAT SERVICES', kpi: 'Number of Audit Committee Meetings coordinated by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Notice, Minutes & Attendance Register for Audit Committee meeting.', budget: 'OPEX' },
      { id: 'kpi-ngomane-25', kpiNo: 'CS_25', kpa: 'KPA 3: SECRETARIAT SERVICES', strategicGoal: 'KPA 3: SECRETARIAT SERVICES', kpi: 'Number of Risk Management, Anti-Fraud and Anti-Corruption Committees monitored by 30 June 2027.', weighting: '2', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Notice, Minutes & Attendance Register for Audit Committee meeting.', budget: 'OPEX' },
      { id: 'kpi-ngomane-26', kpiNo: 'CS_26', kpa: 'KPA 3: SECRETARIAT SERVICES', strategicGoal: 'KPA 3: SECRETARIAT SERVICES', kpi: 'Number of reports on Board members attendance of Board Meetings by 30 June 2027.', weighting: '4', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly reports on Board attendance and Board Resolution.', budget: 'OPEX' },

      // KPA 4: CONTRACT MANAGEMENT (9%)
      { id: 'kpi-ngomane-27', kpiNo: 'CS_27', kpa: 'KPA 4: CONTRACT MANAGEMENT', strategicGoal: 'KPA 4: CONTRACT MANAGEMENT', kpi: 'Number of performance evaluation report for all the Service Providers loaded in the system within 15 days after the end of each quarter.', weighting: '4', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: "Quarterly Reports on contractors' evaluations", budget: 'OPEX' },
      { id: 'kpi-ngomane-28', kpiNo: 'CS_28', kpa: 'KPA 4: CONTRACT MANAGEMENT', strategicGoal: 'KPA 4: CONTRACT MANAGEMENT', kpi: 'Development and finalisation of Memorandum of Understanding/Service Level Agreements and/or Memorandum of Agreements within 30 days of receipt of Contract Request.', weighting: '5', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Contract Register', budget: 'OPEX' },

      // KPA 5: LITIGATION MANAGEMENT (4%)
      { id: 'kpi-ngomane-29', kpiNo: 'CS_29', kpa: 'KPA 5: LITIGATION MANAGEMENT', strategicGoal: 'KPA 5: LITIGATION MANAGEMENT', kpi: 'Number of Litigation Reports submitted to the Chief Executive Officer per quarter.', weighting: '2', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly Litigations Report', budget: 'OPEX' },
      { id: 'kpi-ngomane-30', kpiNo: 'CS_30', kpa: 'KPA 5: LITIGATION MANAGEMENT', strategicGoal: 'KPA 5: LITIGATION MANAGEMENT', kpi: 'Number of Personnel Reports submitted to the Chief Executive Officer per quarter.', weighting: '2', baseline: 'NEW', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly Litigations Report', budget: 'OPEX' },

      // KPA 6: POPIA/ PAIA/CIPC/COIDA/SARS COMPLIANCE (10%)
      { id: 'kpi-ngomane-31', kpiNo: 'CS_31', kpa: 'KPA 6: POPIA/ PAIA/CIPC/COIDA/SARS COMPLIANCE', strategicGoal: 'KPA 6: POPIA/ PAIA/CIPC/COIDA/SARS COMPLIANCE', kpi: 'Number of compliance report submitted to the Information Regulator by 30 June 2027', weighting: '10', baseline: 'NEW', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Submission report / Proof of submission', budget: 'OPEX' }
    ],
    pdps: [
      {
        id: 'pdp-ngomane-1',
        skillsGap: 'Corporate Secretariat Governance, POPIA/PAIA Information Regulator Compliance & Board Advisory',
        outcomes: '100% statutory compliance with Companies Act, CIPC, POPIA/PAIA Information Regulator submissions, and Board Charter governance',
        suggestedTraining: 'Chartered Governance Institute of Southern Africa (CGISA) Board Secretariat & POPIA Compliance Programme',
        modeOfDelivery: 'External Accredited Provider',
        timeFrame: '01 July 2026 to 30 June 2027',
        workOpportunity: 'Coordinate NEDA Board, Audit Committee, Risk & Anti-Corruption Committee secretariats and Information Regulator filings',
        supportPerson: 'Acting Chief Executive Officer (Johan Prince Mangani)'
      }
    ]
  },

  // ============================================================================
  // 5. CHAUKE NH — EXECUTIVE OFFICIAL (NEDA)
  // ============================================================================
  {
    userId: 'neda-user-chaukenh',
    primaryEmail: 'chaukenh@nkangaladm.gov.za',
    aliases: [
      'chaukenh@nkangaladm.gov.za',
      'ChaukeNH@nkangaladm.gov.za',
      'chaukenh@neda.gov.za',
      'ChaukeNH@neda.gov.za'
    ],
    fullName: 'N.H. Chauke',
    jobFunction: 'Senior Manager / Executive Official',
    department: 'NEDA Executive Office',
    directorate: 'Administration & Economic Planning',
    level: '2',
    role: 'Senior Management',
    supervisorName: 'Johan P. Mangani',
    supervisorTitle: 'Acting Chief Executive Officer',
    supervisorEmail: 'manganijp@nkangaladm.gov.za',
    financialYear: '2026/2027',
    period: '01 July 2026 – 30 June 2027',
    pdfAssetUrl: '/assets/aistudio/2026-2027_Performance_Agreement_-_Chauke_853da60e.pdf',
    kpas: [
      { id: 'kpa-chaukenh-1', title: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', nationalKpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', parentObjective: 'Good Governance and Institution Transformation', mscoaCode: 'Operational', weighting: '40' },
      { id: 'kpa-chaukenh-2', title: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', nationalKpa: 'KPA 2: LOCAL ECONOMIC DEVELOPMENT', parentObjective: 'Local Economic Development', mscoaCode: 'Operational', weighting: '10' },
      { id: 'kpa-chaukenh-3', title: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', nationalKpa: 'KPA 3: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', parentObjective: 'Municipal Financial Viability and Management', mscoaCode: 'Operational', weighting: '35' },
      { id: 'kpa-chaukenh-4', title: 'KPA 4: PROJECT MANAGEMENT', nationalKpa: 'KPA 4: PROJECT MANAGEMENT', parentObjective: 'Project Management', mscoaCode: 'Capital / Project', weighting: '15' }
    ],
    competencyType: 'jsc',
    coreCompetencies: CCR_BASE_DEFINITIONS.map((c, idx) => ({
      id: `chaukenh-cc-${idx + 1}`,
      category: c.category,
      competency: c.competency,
      components: c.components,
      definition: c.definition,
      weighting: CHAUKE_CFO_WEIGHTS[idx] || 10,
      level: 'Superior / Advanced'
    })),
    jscs: CCR_BASE_DEFINITIONS.map((c, idx) => ({
      id: `jsc-chaukenh-${idx + 1}`,
      jscNo: `CCR ${idx + 1}`,
      category: c.category,
      competency: c.competency,
      definition: {
        mainText: c.definition,
        subsections: [{ heading: 'Key Components', paragraphs: [c.components] }]
      },
      level: 'Level 4',
      weight: CHAUKE_CFO_WEIGHTS[idx] || 10
    })),
    kpis: [
      { id: 'kpi-chaukenh-1', kpiNo: 'E_01', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of SDBIP and Annual Performance Plan aligned with the NDM IDP approved by the Board Chairperson 28 days after the approval of the budget by 30 June 2027.', weighting: '4', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Approved SDBIP and Annual Performance Plan by Board Chairperson', budget: 'OPEX' },
      { id: 'kpi-chaukenh-2', kpiNo: 'E_02', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of new/reviewed policies and enabling documents approved by the board by 30 June 2027.', weighting: '3', baseline: '5', annualTarget: '5', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '5', poe: 'Reviewed Policies and Board Resolution', budget: 'OPEX' },
      { id: 'kpi-chaukenh-3', kpiNo: 'E_03', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of quarterly reports submitted to the Board and the NDM by 30 June 2027', weighting: '2', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly Report, Board and Council resolutions', budget: 'OPEX' },
      { id: 'kpi-chaukenh-4', kpiNo: 'E_04', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Maximum acceptable percentage of Staff vacancy rate (circular 88) per quarter', weighting: '2', baseline: 'NEW', annualTarget: '10% or below', q1Target: '10% or below', q2Target: '10% or below', q3Target: '10% or below', q4Target: '10% or below', poe: 'Signed Vacancy Rate Report (Indicating the vacancy rate percentage)', budget: 'OPEX' },
      { id: 'kpi-chaukenh-5', kpiNo: 'E_08', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', strategicGoal: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of Finance Employees who have declared their financial interests (Circular 88) by 30 June 2027', weighting: '2', baseline: 'NEW', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Report on Declarations of Interest by Employees and Board Resolution.', budget: 'OPEX' }
    ],
    pdps: [
      {
        id: 'pdp-chaukenh-1',
        skillsGap: 'Executive Public Sector Governance & Strategic Municipal Delivery',
        outcomes: 'Enhanced executive delivery across NEDA strategic planning, project implementation and compliance',
        suggestedTraining: 'Municipal Entity Governance & Strategic Performance Executive Programme',
        modeOfDelivery: 'Accredited Executive Provider',
        timeFrame: '01 July 2026 to 30 June 2027',
        workOpportunity: 'Executive planning and project oversight at NEDA',
        supportPerson: 'Acting Chief Executive Officer (Johan Prince Mangani)'
      }
    ]
  }
];

export function findNedaPackageByEmailOrName(identifier: string): NedaExtractedUserPackage | undefined {
  const clean = (identifier || '').toLowerCase().trim();
  if (!clean) return undefined;
  return NEDA_EXTRACTED_PACKAGES.find(pkg => {
    if (pkg.primaryEmail.toLowerCase() === clean) return true;
    if (pkg.aliases.some(a => a.toLowerCase() === clean)) return true;
    const prefix = clean.split('@')[0];
    if (prefix && pkg.primaryEmail.toLowerCase().split('@')[0] === prefix) return true;
    if (clean.includes('mangani')) return pkg.primaryEmail === 'manganijp@neda.gov.za' || pkg.primaryEmail === 'manganijp@nkangaladm.gov.za';
    if (clean.includes('chaukenh')) return pkg.primaryEmail === 'chaukenh@nkangaladm.gov.za';
    if (clean.includes('chaukekc')) return pkg.primaryEmail === 'chaukekc@neda.gov.za';
    if (clean.includes('chauke') && clean.includes('nh')) return pkg.primaryEmail === 'chaukenh@nkangaladm.gov.za';
    if (clean.includes('chauke')) return pkg.primaryEmail === 'chaukekc@neda.gov.za';
    if (clean.includes('sehlako') || clean.includes('lydia')) return pkg.primaryEmail === 'sehlakols@neda.gov.za';
    if (clean.includes('ngomane') || clean.includes('ntsoaki')) return pkg.primaryEmail === 'ngomanennc@neda.gov.za';
    return false;
  });
}
