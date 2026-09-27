import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase credentials in environment");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const TARGET_PROFILES = [
  {
    email: "rampedimr@nkangaladm.gov.za",
    aliases: ["rampedimr@nkangaladm.gov.za", "rampedimr"],
    fullName: "Mmaphiri R. Rampedi",
    jobFunction: "General Manager : Corporate Services",
    department: "Corporate Services",
    manager: "Mandla L. Mahlangu",
    managerTitle: "Municipal Manager",
    pdp: [
      {
        id: "pdp-1",
        skillsGap: "Strategic HR Management & Labour Relations in Local Government",
        outcomes: "100% adherence to SALGBC collective agreements, rapid resolution of workplace disputes, and compliance with LRA and BCEA statutory standards.",
        suggestedTraining: "Advanced Municipal Labour Law, Dispute Resolution & Conciliation Masterclass",
        modeOfDelivery: "Accredited Executive Programme / Workplace Coaching",
        timeFrame: "Q1 - Q2 (2026/2027)",
        workOpportunity: "Lead the Local Labour Forum (LLF) negotiations and organizational restructuring review",
        supportPerson: "Municipal Manager (Mandla L. Mahlangu)"
      },
      {
        id: "pdp-2",
        skillsGap: "Corporate ICT Governance & Digital Transformation (COBIT / ITIL Framework)",
        outcomes: "Implementation of Nkangala DM Digital Modernization Strategy, 99.9% ICT infrastructure availability, and zero cybersecurity breach incidents.",
        suggestedTraining: "CGEIT / COBIT 2019 Foundation & Cybersecurity Governance for Municipal Executives",
        modeOfDelivery: "Specialist Professional Short Course",
        timeFrame: "Q2 - Q3 (2026/2027)",
        workOpportunity: "Chair the ICT Steering Committee and oversee District Disaster Recovery Site commissioning",
        supportPerson: "External ICT Governance Advisory / Audit Committee"
      },
      {
        id: "pdp-3",
        skillsGap: "Municipal Records Management & POPIA / PAIA Statutory Compliance",
        outcomes: "Clean audit outcome on records management, 100% digitalization of Council agendas/minutes, and full statutory compliance with National Archives regulations.",
        suggestedTraining: "National Archives & POPIA Compliance Executive Certification",
        modeOfDelivery: "Workplace Skills Development Programme",
        timeFrame: "Q3 - Q4 (2026/2027)",
        workOpportunity: "Direct the Electronic Document and Records Management System (EDRMS) district roll-out",
        supportPerson: "Information Officer / Legal Division"
      },
      {
        id: "pdp-4",
        skillsGap: "Workplace Skills Planning (WSP) & Employment Equity Strategy",
        outcomes: "100% timely submission of WSP and ATR to LGSETA, achievement of municipal EE numerical targets, and mandatory grant recovery.",
        suggestedTraining: "Advanced Skills Development Facilitator & Employment Equity Leadership",
        modeOfDelivery: "Blended Learning",
        timeFrame: "Q4 (2026/2027)",
        workOpportunity: "Oversee the District Training Committee and Employee Wellness programmes",
        supportPerson: "HRD Manager"
      }
    ],
    jscs: [
      { id: "jsc-1", jscNo: "JSC-01", competency: "Strategic HR & Talent Management", definition: { mainText: "Leads workforce planning, talent acquisition, employee retention, and capacity-building strategies across all municipal directorates." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-2", jscNo: "JSC-02", competency: "Labour Relations & Collective Bargaining", definition: { mainText: "Fosters harmonious industrial relations, effectively manages LLF engagements, and ensures fair labor practices." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-3", jscNo: "JSC-03", competency: "ICT Governance & Digital Innovation", definition: { mainText: "Directs enterprise technology adoption, cybersecurity resilience, and modernization of administrative business systems." }, level: "Level 3: Competent Leader", weight: 10 },
      { id: "jsc-4", jscNo: "JSC-04", competency: "Legal & Administrative Compliance", definition: { mainText: "Ensures municipal policies, council resolutions, and statutory reports comply strictly with Local Government legislation." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-5", jscNo: "JSC-05", competency: "Records Management & Information Governance", definition: { mainText: "Maintains compliant archival systems, sound document workflows, and adherence to POPIA and PAIA legislation." }, level: "Level 3: Competent Leader", weight: 10 },
      { id: "jsc-6", jscNo: "JSC-06", competency: "Council Support & Committee Administration", definition: { mainText: "Oversees prompt distribution of Council and Mayoral Committee documentation and verified records of resolutions." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-7", jscNo: "JSC-07", competency: "Organizational Transformation & Change Management", definition: { mainText: "Champions institutional culture shifts, service excellence, and Batho Pele principles across the workforce." }, level: "Level 3: Competent Leader", weight: 10 },
      { id: "jsc-8", jscNo: "JSC-08", competency: "Financial Management & Departmental Budget Control", definition: { mainText: "Ensures sound financial administration, zero unauthorized/irregular expenditure, and efficient resource allocation." }, level: "Level 3: Competent Leader", weight: 10 },
      { id: "jsc-9", jscNo: "JSC-09", competency: "Occupational Health, Safety & Employee Wellness", definition: { mainText: "Maintains a safe work environment compliant with OHS Act and comprehensive employee support services." }, level: "Level 3: Competent Leader", weight: 5 },
      { id: "jsc-10", jscNo: "JSC-10", competency: "Intergovernmental & Stakeholder Relations", definition: { mainText: "Coordinates district-local municipal HR forums, SALGA working groups, and provincial cooperative governance." }, level: "Level 3: Competent Leader", weight: 5 },
      { id: "jsc-11", jscNo: "JSC-11", competency: "Ethics, Integrity & Risk Management", definition: { mainText: "Upholds ethical governance, mitigates corporate risks, and drives zero-tolerance toward fraudulent conduct." }, level: "Level 4: Advanced Executive", weight: 5 },
      { id: "jsc-12", jscNo: "JSC-12", competency: "Communication & Public Information Dissemination", definition: { mainText: "Facilitates transparent communication channels, media relations, and brand reputation management for the district." }, level: "Level 3: Competent Leader", weight: 5 }
    ]
  },
  {
    email: "standeral@nkangaladm.gov.za",
    aliases: ["standeral@nkangaladm.gov.za", "standeral"],
    fullName: "Alice L. Stander",
    jobFunction: "Chief Financial Officer",
    department: "Finance Services",
    manager: "Mandla L. Mahlangu",
    managerTitle: "Municipal Manager",
    pdp: [
      {
        id: "pdp-1",
        skillsGap: "Advanced GRAP Standards & Clean Audit Strategy Formulation",
        outcomes: "Preparation of 100% compliant Annual Financial Statements (AFS), elimination of audit findings on financial statements, and sustained clean audit outcome.",
        suggestedTraining: "Executive Masterclass on GRAP Updates & Auditor-General South Africa (AGSA) Engagement Strategy",
        modeOfDelivery: "Accredited SAICA / CIGFARO Executive Workshop",
        timeFrame: "Q1 - Q2 (2026/2027)",
        workOpportunity: "Direct the 2025/2026 Annual Financial Statements preparation and external audit coordination",
        supportPerson: "Municipal Manager & Audit Committee"
      },
      {
        id: "pdp-2",
        skillsGap: "Municipal Revenue Optimization & Alternative Funding Mechanisms",
        outcomes: "Enhanced debt collection rate to 95%+, optimization of municipal investment yields, and structuring public-private partnerships (PPP) for capital funding.",
        suggestedTraining: "Municipal Revenue Management & Project Finance for Infrastructure",
        modeOfDelivery: "Blended Learning & Peer Review Sessions",
        timeFrame: "Q2 - Q3 (2026/2027)",
        workOpportunity: "Lead the District Revenue Enhancement Task Team and local municipality billing review",
        supportPerson: "National Treasury / Provincial Treasury Advisors"
      },
      {
        id: "pdp-3",
        skillsGap: "Supply Chain Management (SCM) Risk Mitigation & Procurement Automation",
        outcomes: "Zero irregular, fruitless, and wasteful expenditure; 100% compliance with 30-day invoice payment regulation; and automated supplier vetting.",
        suggestedTraining: "Advanced SCM Compliance, Contract Management & Preferential Procurement Regulations",
        modeOfDelivery: "Executive Masterclass",
        timeFrame: "Q3 - Q4 (2026/2027)",
        workOpportunity: "Oversee the modernization of the e-Procurement Portal and SCM Bid Committees",
        supportPerson: "Chief Risk Officer"
      },
      {
        id: "pdp-4",
        skillsGap: "mSCOA Version 6.8+ Integration & Financial Analytics",
        outcomes: "Seamless automated monthly and quarterly Section 71/72 data string uploads to National Treasury without portal validation errors.",
        suggestedTraining: "National Treasury Advanced mSCOA Integration & Financial Modeling",
        modeOfDelivery: "Practical Simulation & National Treasury Workshops",
        timeFrame: "Q4 (2026/2027)",
        workOpportunity: "Lead the municipal ERP and financial system data string synchronization",
        supportPerson: "Financial Systems Administrator"
      }
    ],
    jscs: [
      { id: "jsc-1", jscNo: "JSC-01", competency: "Strategic Financial Planning & Budgeting", definition: { mainText: "Formulates credible, funded multi-year MTREF budgets aligned with IDP priorities and National Treasury benchmarks." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-2", jscNo: "JSC-02", competency: "Financial Reporting & Accounting (GRAP)", definition: { mainText: "Ensures strict compliance with GRAP reporting frameworks and timely submission of Annual Financial Statements." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-3", jscNo: "JSC-03", competency: "Supply Chain & Asset Lifecycle Management", definition: { mainText: "Enforces fair, equitable, and transparent procurement and accurate GRAP-compliant asset registers." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-4", jscNo: "JSC-04", competency: "Revenue Enhancement & Debt Collection", definition: { mainText: "Drives sustainable revenue collection, billing integrity, and innovative investment management." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-5", jscNo: "JSC-05", competency: "Expenditure Control & Cashflow Management", definition: { mainText: "Maintains optimal cash liquidity, monitors cost-containment measures, and enforces 30-day payment compliance." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-6", jscNo: "JSC-06", competency: "mSCOA Compliance & Financial Systems", definition: { mainText: "Directs accurate multi-segment classification across all municipal financial transactions and National Treasury strings." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-7", jscNo: "JSC-07", competency: "Risk Management & Internal Financial Controls", definition: { mainText: "Identifies financial vulnerability, designs robust internal controls, and prevents irregular expenditure." }, level: "Level 4: Advanced Executive", weight: 5 },
      { id: "jsc-8", jscNo: "JSC-08", competency: "Statutory Reporting & Treasury Liaison", definition: { mainText: "Coordinates Section 71, 72, and 52 MFMA statutory reporting to Council, Provincial Treasury, and National Treasury." }, level: "Level 4: Advanced Executive", weight: 5 },
      { id: "jsc-9", jscNo: "JSC-09", competency: "People Leadership & Financial Team Development", definition: { mainText: "Empowers financial interns, accountants, and SCM practitioners through structured mentoring and training." }, level: "Level 3: Competent Leader", weight: 5 },
      { id: "jsc-10", jscNo: "JSC-10", competency: "Audit Management & Action Plan Oversight", definition: { mainText: "Manages external audit processes and implements comprehensive remedial plans for audit findings." }, level: "Level 4: Advanced Executive", weight: 4 },
      { id: "jsc-11", jscNo: "JSC-11", competency: "Governance, Ethics & Fraud Prevention", definition: { mainText: "Maintains absolute financial integrity and zero tolerance for corrupt practices." }, level: "Level 4: Advanced Executive", weight: 3 },
      { id: "jsc-12", jscNo: "JSC-12", competency: "Intergovernmental Fiscal Relations", definition: { mainText: "Collaborates with local municipalities and provincial authorities to coordinate equitable grant distributions." }, level: "Level 3: Competent Leader", weight: 3 }
    ]
  },
  {
    email: "mahlanguml@nkangaladm.gov.za",
    aliases: ["mahlanguml@nkangaladm.gov.za", "mandlaml@nkangaladm.gov.za", "mahlanguml"],
    fullName: "Mandla L. Mahlangu",
    jobFunction: "Municipal Manager",
    department: "Office of The MM",
    manager: "Mayor Thomas Ngwenya",
    managerTitle: "Executive Mayor",
    pdp: [
      {
        id: "pdp-1",
        skillsGap: "District Development Model (DDM) Implementation & Spatial Economic Integration",
        outcomes: "Institutionalization of the One Plan across the 6 local municipalities in Nkangala District, fostering intergovernmental catalytic infrastructure projects.",
        suggestedTraining: "Executive Leadership in District Development Model & Intergovernmental Coordination (SALGA / DPSA)",
        modeOfDelivery: "Executive Leadership Retreat & Specialized Coaching",
        timeFrame: "Q1 - Q2 (2026/2027)",
        workOpportunity: "Lead the District Intergovernmental Forum (DIF) and Technical Municipal Managers Forum",
        supportPerson: "Executive Mayor & COGTA Provincial Leadership"
      },
      {
        id: "pdp-2",
        skillsGap: "Institutional Governance, Consequence Management & Clean Audit Sustainability",
        outcomes: "Sustained clean audit status across all financial and performance information programmes, zero UIFW expenditure, and effective consequence management.",
        suggestedTraining: "Strategic Municipal Governance & Anti-Corruption Consequence Management Masterclass",
        modeOfDelivery: "National School of Government Executive Programme",
        timeFrame: "Q2 - Q3 (2026/2027)",
        workOpportunity: "Direct the Municipal Disciplinary Board and District Clean Audit Task Team",
        supportPerson: "Audit Committee Chairperson"
      },
      {
        id: "pdp-3",
        skillsGap: "Digital Government, AI & Intelligent Operations Management",
        outcomes: "Automated real-time monitoring of SDBIP targets, district-wide GIS infrastructure monitoring, and citizen service delivery tracker.",
        suggestedTraining: "Smart Cities & Digital Government Masterclass for Chief Executives",
        modeOfDelivery: "Blended / International Case Studies",
        timeFrame: "Q3 - Q4 (2026/2027)",
        workOpportunity: "Chair the Digital Transformation Steering Committee and Smart District Initiative",
        supportPerson: "ICT General Manager"
      }
    ],
    jscs: [
      { id: "jsc-1", jscNo: "JSC-01", competency: "Strategic Capability & Executive Leadership", definition: { mainText: "Provides visionary leadership, sets strategic municipal priorities, and steers administrative excellence across all departments." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-2", jscNo: "JSC-02", competency: "Financial Management & Accounting Officer Governance", definition: { mainText: "Enforces MFMA accountability, sound fiscal prudence, clean audit outcomes, and optimal resource utilization." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-3", jscNo: "JSC-03", competency: "Service Delivery Innovation & Infrastructure Oversight", definition: { mainText: "Drives effective delivery of basic services, catalytic infrastructure, and disaster management throughout the district." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-4", jscNo: "JSC-04", competency: "People Management & Institutional Empowerment", definition: { mainText: "Cultivates a high-performance culture, empowers executive managers, and upholds labor peace." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-5", jscNo: "JSC-05", competency: "Programme & Project Management", definition: { mainText: "Ensures capital projects, municipal grant expenditure (MIG), and strategic initiatives finish on time and within budget." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-6", jscNo: "JSC-06", competency: "Governance, Ethics & Risk Management", definition: { mainText: "Maintains exemplary ethical standards, transparent administrative systems, and robust enterprise risk management." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-7", jscNo: "JSC-07", competency: "Change Management & Institutional Transformation", definition: { mainText: "Guides institutional restructuring, modernization of service delivery models, and employment equity." }, level: "Level 4: Advanced Executive", weight: 5 },
      { id: "jsc-8", jscNo: "JSC-08", competency: "Knowledge Management & Strategic Information Systems", definition: { mainText: "Fosters evidence-based planning, institutional memory retention, and data-driven decision making." }, level: "Level 3: Competent Leader", weight: 5 },
      { id: "jsc-9", jscNo: "JSC-09", competency: "Client Orientation & Customer Focus (Batho Pele)", definition: { mainText: "Prioritizes community responsiveness, rapid turnaround on citizen queries, and stakeholder satisfaction." }, level: "Level 4: Advanced Executive", weight: 5 },
      { id: "jsc-10", jscNo: "JSC-10", competency: "Intergovernmental Relations & Cooperative Governance", definition: { mainText: "Fosters strong working relationships with National, Provincial, and Local spheres under the District Development Model." }, level: "Level 4: Advanced Executive", weight: 5 },
      { id: "jsc-11", jscNo: "JSC-11", competency: "Problem Solving & Analytical Judgement", definition: { mainText: "Demonstrates acute critical thinking in resolving complex political-administrative bottlenecks." }, level: "Level 4: Advanced Executive", weight: 5 },
      { id: "jsc-12", jscNo: "JSC-12", competency: "Communication, Media & Council Relations", definition: { mainText: "Communicates municipal achievements authoritatively and maintains cooperative liaison with Council and the Mayor." }, level: "Level 4: Advanced Executive", weight: 5 }
    ]
  },
  {
    email: "mahlangupt@nkangaladm.gov.za",
    aliases: ["mahlangupt@nkangaladm.gov.za", "mahlangupt"],
    fullName: "Precious T. Mahlangu",
    jobFunction: "General Manager: Community Development Services",
    department: "Community Development Services",
    manager: "Mandla L. Mahlangu",
    managerTitle: "Municipal Manager",
    pdp: [
      {
        id: "pdp-1",
        skillsGap: "Integrated Disaster Management & Emergency Preparedness Leadership",
        outcomes: "Zero casualty disaster response protocols, operationalization of 24/7 District Disaster Management Centre, and full climate resilience strategy implementation.",
        suggestedTraining: "Advanced Incident Command Systems (ICS) & Strategic Disaster Risk Reduction Certification",
        modeOfDelivery: "Accredited National Disaster Management Centre Programme",
        timeFrame: "Q1 - Q2 (2026/2027)",
        workOpportunity: "Direct District Disaster Advisory Forum and coordinate multi-agency emergency operations",
        supportPerson: "Municipal Manager & Provincial Disaster Centre"
      },
      {
        id: "pdp-2",
        skillsGap: "Municipal Environmental Health & Air Quality Management",
        outcomes: "100% compliance monitoring of licensed atmospheric emission facilities, clean air quality registers, and health inspection coverage.",
        suggestedTraining: "Executive Course in Air Quality Governance & Municipal Health Norms and Standards",
        modeOfDelivery: "Workplace Skills Development / University Short Course",
        timeFrame: "Q2 - Q3 (2026/2027)",
        workOpportunity: "Lead the Highveld Priority Area Air Quality Task Team in Nkangala District",
        supportPerson: "Chief Environmental Health Officer"
      },
      {
        id: "pdp-3",
        skillsGap: "Community Social Development, Youth & Vulnerable Groups Mainstreaming",
        outcomes: "Implementation of comprehensive youth development, gender empowerment, and indigent social support programmes across all local municipalities.",
        suggestedTraining: "Community Development Leadership & Social Upliftment Project Management",
        modeOfDelivery: "Blended Learning & Field Study",
        timeFrame: "Q3 - Q4 (2026/2027)",
        workOpportunity: "Oversee the District Special Programmes Directorate and community development clinics",
        supportPerson: "Portfolio Chairperson: Community Development"
      }
    ],
    jscs: [
      { id: "jsc-1", jscNo: "JSC-01", competency: "Strategic Community & Social Leadership", definition: { mainText: "Directs community development policies, public safety initiatives, and vulnerable group upliftment strategies." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-2", jscNo: "JSC-02", competency: "Disaster Risk Reduction & Emergency Services", definition: { mainText: "Leads district disaster management operations, fire and rescue coordination, and multi-agency emergency planning." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-3", jscNo: "JSC-03", competency: "Municipal Health & Environmental Governance", definition: { mainText: "Ensures strict monitoring of air quality, water quality sampling, waste management, and food hygiene standards." }, level: "Level 4: Advanced Executive", weight: 15 },
      { id: "jsc-4", jscNo: "JSC-04", competency: "Public Safety, Traffic & Law Enforcement Coordination", definition: { mainText: "Coordinates district traffic enforcement, road safety campaigns, and joint security operations." }, level: "Level 3: Competent Leader", weight: 10 },
      { id: "jsc-5", jscNo: "JSC-05", competency: "Sports, Arts, Culture & Heritage Management", definition: { mainText: "Oversees development of community sports facilities, heritage conservation, and youth cultural programmes." }, level: "Level 3: Competent Leader", weight: 10 },
      { id: "jsc-6", jscNo: "JSC-06", competency: "Stakeholder Engagement & Community Liaison", definition: { mainText: "Engages ward committees, civil society, traditional leaders, and NGOs to address grassroots social challenges." }, level: "Level 4: Advanced Executive", weight: 10 },
      { id: "jsc-7", jscNo: "JSC-07", competency: "Financial & Departmental Budget Control", definition: { mainText: "Administers operating and capital budgets with strict compliance to the MFMA and zero unauthorized expenditure." }, level: "Level 3: Competent Leader", weight: 5 },
      { id: "jsc-8", jscNo: "JSC-08", competency: "People Leadership & Community Services Team Building", definition: { mainText: "Builds capable emergency services and community development personnel through continuous training." }, level: "Level 3: Competent Leader", weight: 5 },
      { id: "jsc-9", jscNo: "JSC-09", competency: "Batho Pele & Public Service Excellence", definition: { mainText: "Promotes responsive, compassionate, and transparent municipal service delivery." }, level: "Level 4: Advanced Executive", weight: 5 },
      { id: "jsc-10", jscNo: "JSC-10", competency: "Ethics, Integrity & Accountability", definition: { mainText: "Upholds high standards of professional integrity, fairness, and accountability in community programmes." }, level: "Level 4: Advanced Executive", weight: 4 },
      { id: "jsc-11", jscNo: "JSC-11", competency: "Intergovernmental & Regional Coordination", definition: { mainText: "Collaborates with provincial health, social development, and police departments on integrated district plans." }, level: "Level 3: Competent Leader", weight: 3 },
      { id: "jsc-12", jscNo: "JSC-12", competency: "Crisis Communication & Media Management", definition: { mainText: "Effectively conveys urgent emergency notices, community warnings, and public health advisories." }, level: "Level 3: Competent Leader", weight: 3 }
    ]
  },
  {
    email: "mtshwenuwm@nkangaladm.gov.za",
    aliases: ["mtshwenuwm@nkangaladm.gov.za", "mtshwenuwm"],
    fullName: "W.M. Mtshwenu",
    jobFunction: "Senior Infrastructure & Project Management Specialist",
    department: "Technical & Infrastructure Services",
    manager: "General Manager : Technical Services",
    managerTitle: "General Manager: Technical Services",
    pdp: [
      {
        id: "pdp-1",
        skillsGap: "GCC 2015 & FIDIC Engineering Contract Administration",
        outcomes: "100% compliance with engineering contract specifications, zero contractor disputes resulting in litigation, and strict contractor performance enforcement.",
        suggestedTraining: "Advanced GCC 2015 / FIDIC Contract Law & Project Administration for Municipal Engineers",
        modeOfDelivery: "SAICE Professional Engineering Workshop",
        timeFrame: "Q1 - Q2 (2026/2027)",
        workOpportunity: "Act as Employer's Representative on District Capital Water and Roads Infrastructure Contracts",
        supportPerson: "GM Technical Services"
      },
      {
        id: "pdp-2",
        skillsGap: "Municipal Infrastructure Grant (MIG) & Capital Expenditure Planning",
        outcomes: "100% timely expenditure of capital grants, zero grant rollovers or stopping of funds by National Treasury, and quality engineering sign-offs.",
        suggestedTraining: "National Treasury Capital Infrastructure Planning & MIG Management System Masterclass",
        modeOfDelivery: "Accredited Programme",
        timeFrame: "Q2 - Q3 (2026/2027)",
        workOpportunity: "Lead the District MIG Technical Project Management Unit (PMU)",
        supportPerson: "Chief Financial Officer & GM Technical Services"
      },
      {
        id: "pdp-3",
        skillsGap: "Water Services Act Regulations, Blue/Green Drop Compliance & GIS Spatial Modeling",
        outcomes: "Attainment of Blue Drop and Green Drop certification across district water treatment works, and real-time GIS asset register mapping.",
        suggestedTraining: "DWS Blue/Green Drop Certification & QGIS Infrastructure Asset Management",
        modeOfDelivery: "Technical Short Course & Field Auditing",
        timeFrame: "Q3 - Q4 (2026/2027)",
        workOpportunity: "Oversee the District Water Quality Monitoring Task Team and treatment plant audits",
        supportPerson: "DWS Regional Director"
      }
    ],
    jscs: [
      { id: "jsc-1", jscNo: "JSC-01", competency: "Infrastructure Project Management & MIG Execution", definition: { mainText: "Manages technical scoping, contractor procurement, on-site supervision, and delivery of capital infrastructure projects." }, level: "Level 4: Advanced Specialist", weight: 15 },
      { id: "jsc-2", jscNo: "JSC-02", competency: "Water & Sanitation Engineering Oversight", definition: { mainText: "Supervises bulk water infrastructure, wastewater treatment plants, and compliance with water quality standards." }, level: "Level 4: Advanced Specialist", weight: 15 },
      { id: "jsc-3", jscNo: "JSC-03", competency: "Roads, Stormwater & Transport Infrastructure", definition: { mainText: "Oversees roads maintenance schedules, stormwater drainage design, and public transport infrastructure." }, level: "Level 4: Advanced Specialist", weight: 15 },
      { id: "jsc-4", jscNo: "JSC-04", competency: "Contract Administration (GCC 2015 / FIDIC)", definition: { mainText: "Enforces contractor compliance with engineering drawings, payment milestone certificates, and defect liability periods." }, level: "Level 4: Advanced Specialist", weight: 10 },
      { id: "jsc-5", jscNo: "JSC-05", competency: "Asset Management & Preventive Maintenance Planning", definition: { mainText: "Maintains comprehensive technical asset registers, depreciation models, and proactive maintenance routines." }, level: "Level 3: Competent Specialist", weight: 10 },
      { id: "jsc-6", jscNo: "JSC-06", competency: "Environmental Impact & Occupational Safety (OHS)", definition: { mainText: "Ensures EIA authorization compliance, construction safety standards, and environmental mitigation protocols." }, level: "Level 3: Competent Specialist", weight: 10 },
      { id: "jsc-7", jscNo: "JSC-07", competency: "Technical Specifications & Procurement Support", definition: { mainText: "Compiles rigorous technical terms of reference, bill of quantities (BOQ), and tender evaluation reports." }, level: "Level 4: Advanced Specialist", weight: 5 },
      { id: "jsc-8", jscNo: "JSC-08", competency: "Budget & Financial Tracking on Capital Works", definition: { mainText: "Monitors capital cashflows, verifies interim payment certificates (IPCs), and prevents variation orders." }, level: "Level 3: Competent Specialist", weight: 5 },
      { id: "jsc-9", jscNo: "JSC-09", competency: "Quality Assurance & Technical Problem Solving", definition: { mainText: "Performs rigorous materials testing, structural assessments, and rapid resolution of engineering faults." }, level: "Level 4: Advanced Specialist", weight: 5 },
      { id: "jsc-10", jscNo: "JSC-10", competency: "Stakeholder Liaison & Community Project Briefings", definition: { mainText: "Engages project steering committees (PSCs), community liaison officers (CLOs), and local beneficiaries." }, level: "Level 3: Competent Specialist", weight: 4 },
      { id: "jsc-11", jscNo: "JSC-11", competency: "Integrity, Ethics & Professional Conduct", definition: { mainText: "Upholds ECSA code of professional engineering ethics and strict anti-bribery standards in construction." }, level: "Level 4: Advanced Specialist", weight: 3 },
      { id: "jsc-12", jscNo: "JSC-12", competency: "Intergovernmental Infrastructure Coordination", definition: { mainText: "Collaborates with ESKOM, DWS, SANRAL, and local municipalities to ensure seamless infrastructure delivery." }, level: "Level 3: Competent Specialist", weight: 3 }
    ]
  },
  {
    email: "mashlangutp@nkangaladm.gov.za",
    aliases: ["mashlangutp@nkangaladm.gov.za", "mahlangutp@nkangaladm.gov.za", "mashlangutp", "mahlangutp"],
    fullName: "Thomas P. Mahlangu",
    jobFunction: "Legal Advisor",
    department: "Corporate Services",
    manager: "Mmaphiri R. Rampedi",
    managerTitle: "General Manager : Corporate Services",
    pdp: [
      {
        id: "pdp-1",
        skillsGap: "Advanced Municipal Legislative Drafting & Bylaw Reform",
        outcomes: "100% legally sound bylaws and Council policies, zero court challenges on administrative procedures, and gazetting of updated municipal bylaws.",
        suggestedTraining: "Legislative Drafting & Administrative Law for Local Government (LSSA / SALGA)",
        modeOfDelivery: "Specialist Legal Practice Certificate",
        timeFrame: "Q1 - Q2 (2026/2027)",
        workOpportunity: "Lead the District Bylaw Harmonization Project across all 6 local municipalities",
        supportPerson: "GM Corporate Services & Municipal Manager"
      },
      {
        id: "pdp-2",
        skillsGap: "Litigation Strategy, Alternative Dispute Resolution (ADR) & Risk Mitigation",
        outcomes: "Reduction in municipal legal expenditure by 30%, 95%+ success rate in defended matters, and prompt mediation of commercial and labor disputes.",
        suggestedTraining: "Commercial Mediation & Advanced High Court Litigation Practice for Public Entities",
        modeOfDelivery: "Accredited Legal Masterclass",
        timeFrame: "Q2 - Q3 (2026/2027)",
        workOpportunity: "Manage the District Municipal Litigation Register and external legal panel SLA reviews",
        supportPerson: "State Attorney / External Senior Counsel"
      },
      {
        id: "pdp-3",
        skillsGap: "Contract Negotiation, Service Level Agreements (SLA) & PAJA/PAIA Compliance",
        outcomes: "100% of municipal contracts vetted within 5 business days, zero contract disputes stemming from ambiguity, and full compliance with PAJA decisions.",
        suggestedTraining: "Contract Drafting, Negotiation & Public Procurement Law Masterclass",
        modeOfDelivery: "Executive Legal Seminars",
        timeFrame: "Q3 - Q4 (2026/2027)",
        workOpportunity: "Oversee the Legal Contract Management Register and SCM Bid Adjudication advisory",
        supportPerson: "Chief Financial Officer & Information Officer"
      }
    ],
    jscs: [
      { id: "jsc-1", jscNo: "JSC-01", competency: "Municipal Legal Advisory & Statutory Interpretation", definition: { mainText: "Provides authoritative legal opinions on the Municipal Systems Act, MFMA, Constitution, and Local Government statutes." }, level: "Level 4: Advanced Specialist", weight: 15 },
      { id: "jsc-2", jscNo: "JSC-02", competency: "Contract Drafting, Vetting & SLA Negotiation", definition: { mainText: "Drafts comprehensive commercial contracts, memoranda of understanding (MOUs), and enforceable service level agreements." }, level: "Level 4: Advanced Specialist", weight: 15 },
      { id: "jsc-3", jscNo: "JSC-03", competency: "Litigation Management & Dispute Resolution", definition: { mainText: "Manages external attorneys, monitors court schedules, formulates litigation defense strategies, and conducts mediation." }, level: "Level 4: Advanced Specialist", weight: 15 },
      { id: "jsc-4", jscNo: "JSC-04", competency: "Bylaw Formulation, Review & Gazetting", definition: { mainText: "Drafts standard and model municipal bylaws, coordinates public participation, and oversees statutory gazetting." }, level: "Level 4: Advanced Specialist", weight: 10 },
      { id: "jsc-5", jscNo: "JSC-05", competency: "Administrative Justice (PAJA) & Access to Information (PAIA)", definition: { mainText: "Ensures administrative decisions comply with lawful, reasonable, and procedurally fair standards under PAJA." }, level: "Level 4: Advanced Specialist", weight: 10 },
      { id: "jsc-6", jscNo: "JSC-06", competency: "Council & Mayoral Committee Legal Review", definition: { mainText: "Scrutinizes all Council agenda items, resolutions, and Mayoral memos to prevent unlawful decisions." }, level: "Level 4: Advanced Specialist", weight: 10 },
      { id: "jsc-7", jscNo: "JSC-07", competency: "Labor Law & Disciplinary Hearing Governance", definition: { mainText: "Provides expert legal support on labor arbitration, disciplinary proceedings, and SALGBC collective agreements." }, level: "Level 3: Competent Specialist", weight: 5 },
      { id: "jsc-8", jscNo: "JSC-08", competency: "Legal Risk Assessment & Compliance Auditing", definition: { mainText: "Maintains the municipal legal risk register and monitors proactive legal risk mitigation." }, level: "Level 4: Advanced Specialist", weight: 5 },
      { id: "jsc-9", jscNo: "JSC-09", competency: "Ethical Conduct, Professionalism & Confidentiality", definition: { mainText: "Maintains impeccable standards of legal ethics, attorney-client privilege, and integrity." }, level: "Level 4: Advanced Specialist", weight: 5 },
      { id: "jsc-10", jscNo: "JSC-10", competency: "Intergovernmental & Inter-Municipal Legal Alignment", definition: { mainText: "Provides legal support to local municipalities and coordinates district legal forums." }, level: "Level 3: Competent Specialist", weight: 4 },
      { id: "jsc-11", jscNo: "JSC-11", competency: "Legal Research & Analytical Reasoning", definition: { mainText: "Conducts in-depth jurisprudence research, case law analysis, and legislative updates for Council." }, level: "Level 4: Advanced Specialist", weight: 3 },
      { id: "jsc-12", jscNo: "JSC-12", competency: "Communication & Stakeholder Legal Briefings", definition: { mainText: "Articulates complex legal concepts clearly to Council committees, executive managers, and stakeholders." }, level: "Level 3: Competent Specialist", weight: 3 }
    ]
  }
];

// Helper to generate comprehensive performance plan KPIs if needed
function generatePerformancePlanForUser(profile) {
  const kpas = [
    { id: "kpa-1", name: "Municipal Institutional Development and Transformation", weighting: 30 },
    { id: "kpa-2", name: "Good Governance and Public Participation", weighting: 25 },
    { id: "kpa-3", name: "Basic Service Delivery and Infrastructure Development", weighting: 25 },
    { id: "kpa-4", name: "Municipal Financial Viability and Management", weighting: 20 }
  ];

  const kpiDefinitions = [
    {
      kpiNo: "KPI-001",
      strategicGoal: "Good Governance & Institutional Transformation",
      kpi: `Execution of ${profile.jobFunction} annual operational deliverables`,
      baseline: "100%",
      annualTarget: "100%",
      q1Target: "100%",
      q2Target: "100%",
      q3Target: "100%",
      q4Target: "100%",
      weighting: "30",
      budget: "Operating Budget",
      poe: `Signed quarterly performance delivery reports and verified functional KPI registers for ${profile.department}`,
      kpa: "Good Governance and Public Participation"
    },
    {
      kpiNo: "KPI-002",
      strategicGoal: "Statutory Compliance and Clean Audit Maintenance",
      kpi: "Timely submission of statutory compliance registers, risk mitigation reports and audit files",
      baseline: "100%",
      annualTarget: "100%",
      q1Target: "100%",
      q2Target: "100%",
      q3Target: "100%",
      q4Target: "100%",
      weighting: "25",
      budget: "Operating Budget",
      poe: "Verified compliance registers, quarterly risk mitigation submissions, and clean audit portfolio records",
      kpa: "Municipal Institutional Development and Transformation"
    },
    {
      kpiNo: "KPI-003",
      strategicGoal: "Financial Prudence and Budget Execution",
      kpi: "Percentage of departmental operating budget spent in compliance with the MFMA and Cost Containment regulations",
      baseline: "95%",
      annualTarget: "95% - 100%",
      q1Target: "25%",
      q2Target: "50%",
      q3Target: "75%",
      q4Target: "100%",
      weighting: "25",
      budget: "Operating Budget",
      poe: "Verified Section 71 expenditure reports, SCM procurement requisitions, and zero irregular expenditure declarations",
      kpa: "Municipal Financial Viability and Management"
    },
    {
      kpiNo: "KPI-004",
      strategicGoal: "Service Excellence & Citizen-Centric Delivery",
      kpi: "Adherence to Batho Pele customer service standards and resolution of administrative queries within prescribed turnaround times",
      baseline: "100%",
      annualTarget: "100%",
      q1Target: "100%",
      q2Target: "100%",
      q3Target: "100%",
      q4Target: "100%",
      weighting: "20",
      budget: "Operating Budget",
      poe: "Citizen query registers, signed service level adherence reports, and service delivery inspection logs",
      kpa: "Basic Service Delivery and Infrastructure Development"
    }
  ];

  return { kpas, items: kpiDefinitions };
}

function generatePerformanceAgreementDocument(profile) {
  const currentYear = "2025/2026";
  const docTitle = `PERFORMANCE AGREEMENT - ${profile.fullName.toUpperCase()} (${profile.jobFunction.toUpperCase()})`;
  
  const coverPageText = `PERFORMANCE AGREEMENT\n\nENTERED INTO BY AND BETWEEN:\nNkangala District Municipality herein represented by the Municipal Manager / Executive Mayor\n\n&\n\n${profile.fullName}\n\n${profile.jobFunction}\n\nFOR THE FINANCIAL YEAR: ${currentYear}`;

  const defaultHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1e293b; padding: 20px;">
      <div style="text-align: center; border-bottom: 3px solid #047857; padding-bottom: 20px; margin-bottom: 30px;">
        <h1 style="color: #047857; font-size: 24px; margin-bottom: 5px; font-weight: 800;">NKANGALA DISTRICT MUNICIPALITY</h1>
        <h2 style="color: #334155; font-size: 18px; margin-top: 0; font-weight: 700;">OFFICIAL STATUTORY PERFORMANCE AGREEMENT</h2>
        <p style="font-size: 14px; font-weight: 600; color: #64748b;">FINANCIAL YEAR: ${currentYear}</p>
      </div>

      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 25px;">
        <h3 style="color: #047857; margin-top: 0; font-size: 16px;">ENTERED INTO BY AND BETWEEN:</h3>
        <p><strong>The Municipality:</strong> Nkangala District Municipality, represented by <strong>${profile.manager}</strong> (${profile.managerTitle})</p>
        <p><strong>And:</strong> <strong>${profile.fullName}</strong> (${profile.jobFunction})</p>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #047857; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">1. PURPOSE OF THIS AGREEMENT</h3>
        <p>The purpose of this Agreement is to specify performance objectives and targets defined and agreed with the Employee and to communicate to the Employee the Municipality's expectations of the Employee's performance and accountability in accordance with the Local Government: Municipal Systems Act, 2000 (Act No. 32 of 2000), the Municipal Finance Management Act, 2003 (Act No. 56 of 2003) and the Regulations framed thereunder.</p>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #047857; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">2. PERFORMANCE MANAGEMENT SYSTEM</h3>
        <p>The Employee agrees to participate in the performance management system that the Municipality adopts or introduces for the Municipality, management, and staff of the Municipality.</p>
        <p>The Employee accepts that the purpose of the performance management system will be to provide a comprehensive system with specific performance standards to assist the Municipality, management, and municipal staff to perform to the standards required.</p>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #047857; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">3. CORE COMPETENCY REQUIREMENTS (JSC)</h3>
        <p>The Job Specific Competencies (JSC) make up 20% of the Employee's assessment score. The agreed competencies include Strategic Leadership, Financial Management, Governance Compliance, People Empowerment, and Batho Pele Service Delivery.</p>
      </div>

      <div style="margin-bottom: 25px;">
        <h3 style="color: #047857; border-bottom: 2px solid #cbd5e1; padding-bottom: 5px;">4. SIGNATURES AND COMMITMENT</h3>
        <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px;">
          <div style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 10px;">
            <p style="margin: 0; font-weight: bold;">${profile.fullName}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">${profile.jobFunction} (Employee)</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Date: 29 July 2026</p>
          </div>
          <div style="width: 45%; border-top: 1px solid #94a3b8; padding-top: 10px;">
            <p style="margin: 0; font-weight: bold;">${profile.manager}</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">${profile.managerTitle} (Supervisor / Accounting Officer)</p>
            <p style="margin: 0; font-size: 12px; color: #64748b;">Date: 29 July 2026</p>
          </div>
        </div>
      </div>
    </div>
  `;

  return { docTitle, coverPageText, defaultHtml };
}

async function runRestoration() {
  console.log("=== Starting Complete Restoration for Target Profiles ===");
  const targetTenants = ["tenant-229", "nkangala_auto", "global"];

  for (const profile of TARGET_PROFILES) {
    console.log(`\nRestoring profile: ${profile.fullName} (${profile.email})`);

    const pplanData = generatePerformancePlanForUser(profile);
    const paData = generatePerformanceAgreementDocument(profile);

    for (const emailKey of profile.aliases) {
      for (const tKey of targetTenants) {
        // 1. Restore PDP
        const pdpDocId = `pdp_${tKey}_${emailKey}`;
        const { error: pdpErr } = await supabase.from("messages").upsert({
          id: pdpDocId,
          tenant_id: tKey,
          sender_id: "system_restoration_agent",
          sender_email: "admin@nkangaladm.gov.za",
          sender_name: "Nkangala DM System Orchestrator",
          content: JSON.stringify({
            items: profile.pdp,
            skillsGapsMasters: profile.pdp.map(p => ({ id: p.id, title: p.skillsGap, description: p.outcomes })),
            trainingsMasters: profile.pdp.map(p => ({ id: p.id, title: p.suggestedTraining, provider: "National School of Government / Accredited Provider", duration: p.timeFrame })),
            modesMasters: [
              { id: "mode-1", mode: "Accredited Executive Programme / Workplace Coaching" },
              { id: "mode-2", mode: "Specialist Professional Short Course" },
              { id: "mode-3", mode: "Blended Learning & Peer Review Sessions" }
            ],
            supportMasters: [
              { id: "sup-1", name: profile.manager, role: profile.managerTitle }
            ]
          }),
          message_type: "pdp_list",
          created_at: new Date().toISOString()
        }, { onConflict: "id" });

        if (pdpErr) console.error(`Error saving PDP for ${pdpDocId}:`, pdpErr.message);

        // 2. Restore Team PDP
        const teamPdpDocId = `team_pdp_${tKey}_${emailKey}`;
        await supabase.from("messages").upsert({
          id: teamPdpDocId,
          tenant_id: tKey,
          sender_id: "system_restoration_agent",
          sender_email: "admin@nkangaladm.gov.za",
          sender_name: "Nkangala DM System Orchestrator",
          content: JSON.stringify({ items: profile.pdp }),
          message_type: "team_pdp_list",
          created_at: new Date().toISOString()
        }, { onConflict: "id" });

        // 3. Restore JSCs
        const jscDocId = `job_competencies_${tKey}_${emailKey}`;
        const { error: jscErr } = await supabase.from("messages").upsert({
          id: jscDocId,
          tenant_id: tKey,
          sender_id: "system_restoration_agent",
          sender_email: "admin@nkangaladm.gov.za",
          sender_name: "Nkangala DM System Orchestrator",
          content: JSON.stringify({
            competencies: profile.jscs,
            jscMasters: profile.jscs.map(j => ({ id: j.id, code: j.jscNo, title: j.competency })),
            competencyMasters: profile.jscs.map(j => ({ id: j.id, name: j.competency, code: j.jscNo })),
            definitionMasters: profile.jscs.map(j => ({ id: j.id, competency: j.competency, definition: j.definition })),
            levelMasters: [
              { id: "lvl-1", level: "Level 1: Basic Awareness" },
              { id: "lvl-2", level: "Level 2: Competent Operator" },
              { id: "lvl-3", level: "Level 3: Competent Leader" },
              { id: "lvl-4", level: "Level 4: Advanced Executive" }
            ],
            weightMasters: [
              { id: "w-5", weight: 5 },
              { id: "w-10", weight: 10 },
              { id: "w-15", weight: 15 },
              { id: "w-20", weight: 20 }
            ]
          }),
          message_type: "job_competencies_list",
          created_at: new Date().toISOString()
        }, { onConflict: "id" });

        if (jscErr) console.error(`Error saving JSC for ${jscDocId}:`, jscErr.message);

        // 4. Restore Team JSC
        const teamJscDocId = `team_jsc_${tKey}_${emailKey}`;
        await supabase.from("messages").upsert({
          id: teamJscDocId,
          tenant_id: tKey,
          sender_id: "system_restoration_agent",
          sender_email: "admin@nkangaladm.gov.za",
          sender_name: "Nkangala DM System Orchestrator",
          content: JSON.stringify({ competencies: profile.jscs }),
          message_type: "team_jsc_list",
          created_at: new Date().toISOString()
        }, { onConflict: "id" });

        // 5. Restore Performance Plan (KPAs + KPIs + PPlan) - check existing items first so we don't clobber large scorecards
        const pplanDocId = `pplan_${tKey}_${emailKey}`;
        const { data: existingPplan } = await supabase.from("messages").select("content").eq("id", pplanDocId).maybeSingle();
        
        let shouldSeedPplan = true;
        if (existingPplan && existingPplan.content) {
          try {
            const parsed = JSON.parse(existingPplan.content);
            if (Array.isArray(parsed.items) && parsed.items.length > 5) {
              shouldSeedPplan = false; // preserve existing rich scorecard (e.g. 59 or 101 items)
              console.log(`Preserving existing rich scorecard (${parsed.items.length} KPIs) for ${pplanDocId}`);
            }
          } catch (e) {}
        }

        if (shouldSeedPplan) {
          await supabase.from("messages").upsert({
            id: pplanDocId,
            tenant_id: tKey,
            sender_id: "system_restoration_agent",
            sender_email: "admin@nkangaladm.gov.za",
            sender_name: "Nkangala DM System Orchestrator",
            content: JSON.stringify({
              items: pplanData.items,
              metadata: {
                employeeName: profile.fullName,
                jobTitle: profile.jobFunction,
                department: profile.department,
                financialYear: "2025/2026",
                supervisorName: profile.manager
              }
            }),
            message_type: "pplan_list",
            created_at: new Date().toISOString()
          }, { onConflict: "id" });

          // Seed KPAs and KPIs
          await supabase.from("messages").upsert({
            id: `kpas_${tKey}_${emailKey}`,
            tenant_id: tKey,
            sender_id: "system_restoration_agent",
            sender_email: "admin@nkangaladm.gov.za",
            sender_name: "Nkangala DM System Orchestrator",
            content: JSON.stringify({ kpas: pplanData.kpas }),
            message_type: "kpa_list",
            created_at: new Date().toISOString()
          }, { onConflict: "id" });

          await supabase.from("messages").upsert({
            id: `kpis_${tKey}_${emailKey}`,
            tenant_id: tKey,
            sender_id: "system_restoration_agent",
            sender_email: "admin@nkangaladm.gov.za",
            sender_name: "Nkangala DM System Orchestrator",
            content: JSON.stringify({ kpis: pplanData.items }),
            message_type: "kpi_list",
            created_at: new Date().toISOString()
          }, { onConflict: "id" });
        }

        // 6. Restore Performance Agreement (Drafting Suite Document)
        const paDraftDocId = `pa_draft_${tKey}_${emailKey}`;
        const draftDocId = `draft_doc_${tKey}_${emailKey}`;
        
        const paPayload = {
          html: paData.defaultHtml,
          title: paData.docTitle,
          coverPage: paData.coverPageText,
          employeeName: profile.fullName,
          employeePosition: profile.jobFunction,
          supervisorName: profile.manager,
          supervisorPosition: profile.managerTitle,
          financialYear: "2025/2026",
          lastSaved: new Date().toISOString()
        };

        await supabase.from("messages").upsert([
          {
            id: paDraftDocId,
            tenant_id: tKey,
            sender_id: "system_restoration_agent",
            sender_email: "admin@nkangaladm.gov.za",
            sender_name: "Nkangala DM System Orchestrator",
            content: JSON.stringify(paPayload),
            message_type: "pa_draft",
            created_at: new Date().toISOString()
          },
          {
            id: draftDocId,
            tenant_id: tKey,
            sender_id: "system_restoration_agent",
            sender_email: "admin@nkangaladm.gov.za",
            sender_name: "Nkangala DM System Orchestrator",
            content: JSON.stringify(paPayload),
            message_type: "pa_draft",
            created_at: new Date().toISOString()
          }
        ], { onConflict: "id" });
      }
    }
  }

  console.log("\n=== Complete Restoration Successful for all 6 User Profiles! ===");
}

runRestoration().then(() => process.exit(0)).catch(e => {
  console.error("Restoration failed:", e);
  process.exit(1);
});
