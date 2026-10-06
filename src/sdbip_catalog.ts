// SDBIP KPI Catalog Source of Truth
// Defines all 110 SDBIP KPIs (92 Municipal M-series, 18 Departmental P-series)

export interface SdbipCatalogItem {
  Ref_Number: string;
  SDBIP_Strategic_Objective: string;
  KPI: string;
  National_KPA: string;
  BSD: string;
  LED: string;
  MFVM: string;
  GGPP: string;
  MIDT: string;
  SR: string;
  Responsible_Owner: string;
  Unit_of_Measure: string;
  Baseline: string;
  Annual_Target: string;
  Budget_Allocation: string;
  Q1_Target: string;
  Q2_Target: string;
  Mid_Term_Target: string;
  Q3_Target: string;
  Q4_Target: string;
  Submitter: string;
  Approver: string;
  POE_Description: string;
  Description: string;
}

// Compact KPI definitions list with individual KPI-specific POE descriptions
const mKpisCompact: { [key: string]: { desc: string; kpaIndex: number; uom?: string; target?: string; base?: string; q1?: string; q2?: string; mid?: string; q3?: string; q4?: string; poe: string } } = {
  // KPA 1: Basic Service Delivery (1 - 15)
  "M_01": { desc: "Percentage of households with access to basic potable water supply.", kpaIndex: 1, uom: "% households", target: "100%", base: "95%", poe: "Signed water quality and access verification report with meter connection logs" },
  "M_02": { desc: "Percentage of sanitation complaints resolved within 24 hours.", kpaIndex: 1, uom: "% resolution", target: "100%", base: "85%", poe: "Signed sanitation complaints register and 24-hour job card closure report" },
  "M_03": { desc: "Number of new water connections completed in informal settlements.", kpaIndex: 1, uom: "connections", target: "500", base: "300", poe: "Signed completion certificates and informal settlement connection register" },
  "M_04": { desc: "Kilometers of new storm-water drainage pipelines installed.", kpaIndex: 1, uom: "km", target: "12 km", base: "8 km", poe: "Engineer signed stormwater completion certificates and GIS line records" },
  "M_05": { desc: "Percentage of electricity service interruptions resolved within standard NRS timeframes.", kpaIndex: 1, uom: "% compliance", target: "95%", base: "90%", poe: "Signed NRS 048 outage logbook and fault resolution verification report" },
  "M_06": { desc: "Number of high-mast street lights installed in rural nodes.", kpaIndex: 1, uom: "high-masts", target: "20", base: "12", poe: "Signed contractor handover certificate and high-mast inspection signoff" },
  "M_07": { desc: "Kilometers of gravel roads upgraded to asphalt/tar.", kpaIndex: 1, uom: "km upgraded", target: "15 km", base: "10 km", poe: "Signed road surfacing completion certificates and GIS project ledger" },
  "M_08": { desc: "Square meters of potholes patched on major municipal roads.", kpaIndex: 1, uom: "sqm patched", target: "8000 sqm", base: "5000 sqm", poe: "Signed pothole patching job cards and road maintenance register" },
  "M_09": { desc: "Percentage of formal households with weekly refuse collection services.", kpaIndex: 1, uom: "% households", target: "100%", base: "98%", poe: "Signed waste collection route verification register and weighbridge tickets" },
  "M_10": { desc: "Volume of domestic waste diverted from landfill sites through recycling initiatives.", kpaIndex: 1, uom: "tons", target: "1500 tons", base: "1000 tons", poe: "Signed recycling weighbridge receipts and waste diversion monthly report" },
  "M_11": { desc: "Number of low-cost housing units connected to the bulk sewerage network.", kpaIndex: 1, uom: "units", target: "350 units", base: "200 units", poe: "Signed sewer connection certificates and housing ledger" },
  "M_12": { desc: "Percentage compliance with drinking water quality standards (Blue Drop).", kpaIndex: 1, uom: "% compliance score", target: "98%", base: "95%", poe: "Signed Blue Drop water quality lab test compliance report" },
  "M_13": { desc: "Percentage compliance with wastewater treatment facility effluent standards (Green Drop).", kpaIndex: 1, uom: "% compliance score", target: "92%", base: "88%", poe: "Signed Green Drop wastewater effluent laboratory compliance certificates" },
  "M_14": { desc: "Number of preventative maintenance interventions executed on bulk water pumps.", kpaIndex: 1, uom: "cycles completed", target: "24", base: "18", poe: "Signed mechanical preventative maintenance job cards and pump station logbooks" },
  "M_15": { desc: "Percentage reduction in non-revenue water losses across municipal grid.", kpaIndex: 1, uom: "% loss reduction", target: "5% reduction", base: "3% reduction", poe: "Signed water balance reconciliation report and non-revenue water audit" },

  // KPA 2: Municipal Institutional Development & Transformation (16 - 30)
  "M_16": { desc: "Percentage of employment equity targets met in senior manager roles.", kpaIndex: 2, uom: "% representation", target: "60%", base: "55%", poe: "Signed quarterly employment equity report and senior management stats" },
  "M_17": { desc: "Percentage of municipal staff performance reviews completed on time.", kpaIndex: 2, uom: "% compliance", target: "100%", base: "90%", poe: "Signed staff performance review assessment forms and HR submission register" },
  "M_18": { desc: "Percentage of critical vacant posts filled within 3 months of advertisement.", kpaIndex: 2, uom: "% vacancies filled", target: "80%", base: "70%", poe: "Signed vacancy rate report (indicating the vacancy rate percentage)" },
  "M_19": { desc: "Number of formal workplace skills training interventions completed.", kpaIndex: 2, uom: "interventions", target: "45", base: "30", poe: "Signed Workplace Skills Plan (WSP) and training attendance registers" },
  "M_20": { desc: "Employee retention rate under strategic scarce-skills program.", kpaIndex: 2, uom: "% retention", target: "92%", base: "88%", poe: "Signed scarce skills retention schedule and payroll verification report" },
  "M_21": { desc: "Number of joint labor-management consultative forum meetings held.", kpaIndex: 2, uom: "meetings", target: "4", base: "4", poe: "Signed Local Labour Forum (LLF) minutes and attendance registers" },
  "M_22": { desc: "Percentage of IT disaster recovery plan test cycles passed.", kpaIndex: 2, uom: "% pass", target: "100%", base: "100%", poe: "Signed IT disaster recovery test result signoff and simulation log" },
  "M_23": { desc: "Percentage availability of core municipal ERP systems.", kpaIndex: 2, uom: "% uptime", target: "99.5%", base: "98%", poe: "Signed ERP monthly system uptime availability reports" },
  "M_24": { desc: "Number of employee wellness outreach and health screening programs conducted.", kpaIndex: 2, uom: "programs", target: "8", base: "6", poe: "Signed employee wellness attendance register and medical outreach report" },
  "M_25": { desc: "Percentage of occupational health and safety (OHS) incident audits completed.", kpaIndex: 2, uom: "% compliance", target: "100%", base: "95%", poe: "Signed OHS compliance audit certificates and inspection reports" },
  "M_26": { desc: "Percentage of internal promotions aligned with the employment equity plan.", kpaIndex: 2, uom: "% alignment", target: "75%", base: "70%", poe: "Signed HR recruitment minutes and employment equity promotion log" },
  "M_27": { desc: "Number of departmental operational risk registers updated.", kpaIndex: 2, uom: "updates", target: "4", base: "4", poe: "Signed departmental operational risk registers with Risk Committee signoff" },
  "M_28": { desc: "Percentage of municipal bylaws reviewed and updated for council submission.", kpaIndex: 2, uom: "% progress", target: "100%", base: "80%", poe: "Signed Council resolution approving municipal bylaws review" },
  "M_29": { desc: "Average number of days taken to resolve formal staff grievances.", kpaIndex: 2, uom: "days", target: "Less than 15 days", base: "18 days average", poe: "Signed employee grievance resolution log and closure letters" },
  "M_30": { desc: "Percentage of customer service desks meeting standard response protocols.", kpaIndex: 2, uom: "% compliance", target: "90%", base: "85%", poe: "Signed customer service response tracking report and mystery shopper audit" },

  // KPA 3: Local Economic Development (31 - 45)
  "M_31": { desc: "Number of work opportunities created through Expanded Public Works Programme (EPWP).", kpaIndex: 3, uom: "jobs", target: "1200", base: "950", poe: "Signed EPWP participant contracts, ID copies, and monthly stipend payroll registers" },
  "M_32": { desc: "Number of local SMMEs supported through targeted municipal capacity workshops.", kpaIndex: 3, uom: "SMMEs trained", target: "80", base: "50", poe: "Signed SMME capacity workshop attendance registers and training evaluation reports" },
  "M_33": { desc: "Value of municipal procurement spend allocated to local SMMEs.", kpaIndex: 3, uom: "Rand value", target: "R15,000,000", base: "R10,000,000", poe: "Signed SCM local spend report and payment vouchers to local SMMEs" },
  "M_34": { desc: "Number of tourist information desks maintained and supported.", kpaIndex: 3, uom: "desks", target: "4", base: "3", poe: "Signed tourist information desk visitor logs and monthly tourism activity report" },
  "M_35": { desc: "Number of agricultural cooperatives supported with equipment or training.", kpaIndex: 3, uom: "cooperatives", target: "10", base: "6", poe: "Signed agricultural cooperative support distribution register and handover notes" },
  "M_36": { desc: "Number of local business forums hosted to align LED initiatives.", kpaIndex: 3, uom: "forums", target: "4", base: "2", poe: "Signed Local Business Forum agenda, minutes, and attendance register" },
  "M_37": { desc: "Percentage of LED strategy targets successfully implemented during the year.", kpaIndex: 3, uom: "% implementation", target: "90%", base: "80%", poe: "Signed LED strategy implementation progress report and oversight notes" },
  "M_38": { desc: "Number of job seekers registered on the municipal skills database.", kpaIndex: 3, uom: "seekers", target: "1500", base: "1000", poe: "Signed municipal job seeker database extracts and registration records" },
  "M_39": { desc: "Number of youth-owned enterprises receiving direct material assistance.", kpaIndex: 3, uom: "enterprises", target: "25", base: "15", poe: "Signed youth enterprise support distribution sheets and delivery notes" },
  "M_40": { desc: "Number of informal trading stalls constructed or upgraded.", kpaIndex: 3, uom: "stalls", target: "50", base: "30", poe: "Signed informal trading stall handover certificates and inspection report" },
  "M_41": { desc: "Percentage of informal trading licenses processed within 7 working days.", kpaIndex: 3, uom: "% compliance", target: "95%", base: "90%", poe: "Signed informal trading permits register and processing turnaround log" },
  "M_42": { desc: "Number of investment promotion workshops hosted with external partners.", kpaIndex: 3, uom: "workshops", target: "2", base: "1", poe: "Signed investment promotion workshop attendance register and partner agreements" },
  "M_43": { desc: "Number of community-based public works infrastructure programs initiated.", kpaIndex: 3, uom: "programs", target: "6", base: "4", poe: "Signed community public works project initiation charter and site log" },
  "M_44": { desc: "Number of skills training bursaries awarded to local youth.", kpaIndex: 3, uom: "bursaries", target: "30", base: "20", poe: "Signed youth bursary award letters and tertiary registration proofs" },
  "M_45": { desc: "Value of public private partnership agreements finalized for economic hubs.", kpaIndex: 3, uom: "agreements", target: "2", base: "1", poe: "Signed Public-Private Partnership (PPP) agreements and Council approval" },

  // KPA 4: Municipal Financial Viability & Management (46 - 60)
  "M_46": { desc: "Debt coverage ratio achieved by the municipality.", kpaIndex: 4, uom: "ratio", target: "2.5 times or better", base: "2.1 times", poe: "Signed audited debt coverage ratio calculation schedule and CFO signoff" },
  "M_47": { desc: "Percentage of capital budget spent on infrastructure projects.", kpaIndex: 4, uom: "% capital spent", target: "95%", base: "91%", poe: "Signed capital expenditure report, payment certificates, and Section 71 schedule" },
  "M_48": { desc: "Percentage of operational budget spent on planned maintenance.", kpaIndex: 4, uom: "% operational spent", target: "100%", base: "94%", poe: "Signed repairs and maintenance expenditure ledger and asset maintenance log" },
  "M_49": { desc: "Audit outcome obtained from the Auditor-General for the previous financial year.", kpaIndex: 4, uom: "audit status", target: "Clean audit outcome", base: "Unqualified audit", poe: "Auditor-General final audit report and signed audit action plan" },
  "M_50": { desc: "Percentage of creditor invoices paid within statutory 30-day timeframe.", kpaIndex: 4, uom: "% invoices paid", target: "100%", base: "95%", poe: "Signed Section 71 30-day creditor payment compliance report and invoice ledger" },
  "M_51": { desc: "Percentage of municipal revenue collection rate achieved against billed revenue.", kpaIndex: 4, uom: "% revenue collected", target: "95%", base: "92%", poe: "Signed billing ledger and bank revenue collection reconciliation report" },
  "M_52": { desc: "Percentage variance of actual expenditure against approved mid-term budget.", kpaIndex: 4, uom: "% variance", target: "Less than 5%", base: "7% variance", poe: "Signed mid-term budget review report and Section 72 financial statement" },
  "M_53": { desc: "Percentage accuracy of the municipal asset register (verified via physical audit).", kpaIndex: 4, uom: "% accuracy", target: "100%", base: "98%", poe: "Signed physical asset verification report and updated fixed asset register" },
  "M_54": { desc: "Percentage of grant funding spent in accordance with grant conditions.", kpaIndex: 4, uom: "% grant spent", target: "100%", base: "95%", poe: "Signed conditional grant expenditure report and National Treasury DORA schedules" },
  "M_55": { desc: "Percentage of supply chain bids processed within standard turnaround time.", kpaIndex: 4, uom: "% compliance", target: "90%", base: "84%", poe: "Signed Bid Adjudication Committee (BAC) minutes and award turnaround ledger" },
  "M_56": { desc: "Cost coverage ratio of the municipality (cash reserves/monthly operating exp).", kpaIndex: 4, uom: "months coverage", target: "3 months", base: "2 months", poe: "Signed cash flow liquidity schedule and bank statements demonstrating cost coverage" },
  "M_57": { desc: "Percentage reduction in unauthorized, irregular, fruitless and wasteful expenditure (UIFW).", kpaIndex: 4, uom: "% reduction", target: "100% reduction", base: "80% reduction", poe: "Signed UIFW expenditure reduction report and MPAC investigation register" },
  "M_58": { desc: "Percentage compliance of the annual financial statements submitted to AG.", kpaIndex: 4, uom: "% compliance", target: "100%", base: "100%", poe: "Signed Annual Financial Statements (AFS) submission letter to Auditor-General" },
  "M_59": { desc: "Percentage of indigent households registered and receiving free basic services.", kpaIndex: 4, uom: "% registry accuracy", target: "100%", base: "96%", poe: "Signed indigent register extract and free basic services billing reports" },
  "M_60": { desc: "Percentage of financial reports submitted to National Treasury within due dates.", kpaIndex: 4, uom: "% compliance", target: "100%", base: "100%", poe: "Signed Section 71 and Section 52 submission confirmation receipts from National Treasury" },

  // KPA 5: Good Governance & Public Participation (61 - 75)
  "M_61": { desc: "Number of functional ward committees established and meeting regularly.", kpaIndex: 5, uom: "committees active", target: "100%", base: "90%", poe: "Signed ward committee meeting minutes and monthly stipend attendance registers" },
  "M_62": { desc: "Percentage of resolved community complaints logged through CRM system.", kpaIndex: 5, uom: "% complaints resolved", target: "95%", base: "82%", poe: "Signed CRM complaints resolution report and customer satisfaction log" },
  "M_63": { desc: "Number of IDP public representative consultation meetings held.", kpaIndex: 5, uom: "meetings", target: "12", base: "8", poe: "Signed IDP public participation attendance registers and meeting minutes" },
  "M_64": { desc: "Percentage compliance with the municipal risk management plan.", kpaIndex: 5, uom: "% compliance", target: "100%", base: "90%", poe: "Signed municipal risk management committee quarterly compliance report" },
  "M_65": { desc: "Percentage of internal audit findings successfully resolved by management.", kpaIndex: 5, uom: "% resolved", target: "90%", base: "75%", poe: "Signed Internal Audit resolution tracking register and Audit Committee report" },
  "M_66": { desc: "Percentage implementation of the municipal anti-corruption strategy.", kpaIndex: 5, uom: "% compliance", target: "100%", base: "85%", poe: "Signed anti-corruption strategy implementation progress report" },
  "M_67": { desc: "Number of council-approved oversight reports published for the public.", kpaIndex: 5, uom: "reports", target: "4", base: "4", poe: "Signed Council oversight report on Annual Report and public notices" },
  "M_68": { desc: "Number of municipal public accounts committee (MPAC) meetings conducted.", kpaIndex: 5, uom: "meetings", target: "8", base: "6", poe: "Signed MPAC minutes, oversight recommendations, and Council submissions" },
  "M_69": { desc: "Percentage compliance with the Promotion of Access to Information Act (PAIA).", kpaIndex: 5, uom: "% compliance", target: "100%", base: "100%", poe: "Signed Section 32 PAIA annual report submitted to SAHRC" },
  "M_70": { desc: "Percentage of executive council decisions implemented within due dates.", kpaIndex: 5, uom: "% implementation", target: "95%", base: "90%", poe: "Signed Council resolution implementation tracking matrix" },
  "M_71": { desc: "Number of community feedback newsletters published in local languages.", kpaIndex: 5, uom: "editions", target: "4", base: "2", poe: "Copies of published municipal newsletters and distribution receipts" },
  "M_72": { desc: "Percentage compliance with standard municipal delegation registers.", kpaIndex: 5, uom: "% compliance", target: "100%", base: "95%", poe: "Signed system of delegations register approved by Council" },
  "M_73": { desc: "Number of external compliance reports submitted to Provincial COGTA.", kpaIndex: 5, uom: "reports", target: "4", base: "4", poe: "Signed Section 46 provincial reporting submission receipts from COGTA" },
  "M_74": { desc: "Percentage of ward councilors trained in leadership and governance skills.", kpaIndex: 5, uom: "% training rate", target: "100%", base: "80%", poe: "Signed Councilor training certificates and attendance registers" },
  "M_75": { desc: "Percentage uptime of the community digital communication portals.", kpaIndex: 5, uom: "% availability", target: "99%", base: "97%", poe: "Signed digital portal availability log and uptime verification certificate" },

  // KPA 6: Spatial Rationale & Environmental Management (76 - 92)
  "M_76": { desc: "Percentage of land-use applications processed within statutory SPLUMA timeframes.", kpaIndex: 6, uom: "% compliance", target: "95%", base: "88%", poe: "Signed SPLUMA tribunal decision notices and application turnaround register" },
  "M_77": { desc: "Number of environmental compliance audits conducted on key municipal projects.", kpaIndex: 6, uom: "audits completed", target: "10", base: "6", poe: "Signed environmental authorization compliance audit reports" },
  "M_78": { desc: "Percentage alignment of municipal budget with Spatial Development Framework (SDF).", kpaIndex: 6, uom: "% alignment", target: "100%", base: "95%", poe: "Signed Spatial Development Framework (SDF) capital alignment report" },
  "M_79": { desc: "Number of GIS layers updated with land use data.", kpaIndex: 6, uom: "updates", target: "6", base: "4", poe: "Signed GIS spatial database update log and metadata reports" },
  "M_80": { desc: "Percentage of municipal land audits completed and cataloged in asset register.", kpaIndex: 6, uom: "% complete", target: "100%", base: "85%", poe: "Signed municipal land audit report and updated municipal land inventory" },
  "M_81": { desc: "Number of local spatial planning workshops hosted with community leaders.", kpaIndex: 6, uom: "workshops", target: "4", base: "2", poe: "Signed spatial planning community workshop attendance registers and minutes" },
  "M_82": { desc: "Number of hectares of alien invasive vegetation cleared in conservation zones.", kpaIndex: 6, uom: "hectares", target: "200", base: "150", poe: "Signed alien vegetation clearing verification certificates and GIS polygon map" },
  "M_83": { desc: "Number of public parks maintained to standard occupational safety criteria.", kpaIndex: 6, uom: "parks", target: "15", base: "10", poe: "Signed public parks safety maintenance checklists and inspection reports" },
  "M_84": { desc: "Percentage compliance with integrated waste management plan (IWMP) targets.", kpaIndex: 6, uom: "% compliance score", target: "90%", base: "80%", poe: "Signed Integrated Waste Management Plan (IWMP) implementation report" },
  "M_85": { desc: "Percentage of newly registered townships aligned with integrated human settlements plan.", kpaIndex: 6, uom: "% alignment", target: "100%", base: "90%", poe: "Signed township establishment approval certificates and layout maps" },
  "M_86": { desc: "Number of localized environmental awareness campaigns conducted.", kpaIndex: 6, uom: "campaigns", target: "8", base: "4", poe: "Signed environmental campaign event reports and participant attendance sheets" },
  "M_87": { desc: "Percentage of illegal dumping hot-spots cleared within 48 hours.", kpaIndex: 6, uom: "% clearance rate", target: "90%", base: "75%", poe: "Signed illegal dumping clearance job cards and before/after photo evidence" },
  "M_88": { desc: "Number of urban renewal spatial project feasibility studies completed.", kpaIndex: 6, uom: "studies", target: "3", base: "1", poe: "Signed urban renewal feasibility study reports and Council submission" },
  "M_89": { desc: "Percentage compliance with national air quality monitoring criteria.", kpaIndex: 6, uom: "% compliance", target: "98%", base: "95%", poe: "Signed ambient air quality monitoring station reports and emission log" },
  "M_90": { desc: "Number of building plan inspections completed during construction stages.", kpaIndex: 6, uom: "inspections", target: "250", base: "180", poe: "Signed building control inspection certificates and stage completion notices" },
  "M_91": { desc: "Percentage of illegal structure enforcement notices issued within 7 days of discovery.", kpaIndex: 6, uom: "% compliance", target: "95%", base: "90%", poe: "Signed illegal structure contravention notices and compliance inspection reports" },
  "M_92": { desc: "Number of climate change adaptation strategy training sessions held.", kpaIndex: 6, uom: "sessions", target: "4", base: "2", poe: "Signed climate change adaptation training attendance registers and module notes" }
};

// Compact Departmental KPI definitions list (P_01 to P_19) with verbatim SDBIP statutory project data from SDBIP document
const pKpisCompact: { 
  [key: string]: { 
    desc: string; 
    kpaIndex: number; 
    uom?: string; 
    target?: string; 
    base?: string; 
    q1?: string; 
    q2?: string; 
    mid?: string; 
    q3?: string; 
    q4?: string; 
    poe: string;
    budget?: string;
    owner?: string;
    location?: string;
  } 
} = {
  "P_01": {
    desc: "50 SASSETA Learnership (Security) recruited and trained by 30 June 2027 (34377)",
    kpaIndex: 3,
    owner: "Executive Manager: Social Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: implementation Stage (100%): Practical Training",
    q1: "Stage 2: procurement Stage (100%): Appointment of the service provider",
    q2: "Stage 3: implementation Stage (50%): Recruitment of 50 learners",
    mid: "Stage 3: implementation Stage (50%): Recruitment of 50 learners",
    q3: "Stage 3: implementation Stage (75%): Theory Training",
    q4: "Stage 3: implementation Stage (100%) Practical Training",
    poe: "Appointment Letter, Contracts of learners, signed Site Visit Reports with attendance register attached (Contracts available on hard copy files)",
    budget: "R3 010 000",
    location: "District Wide"
  },
  "P_02": {
    desc: "Support to SMMEs/ Cooperatives/ Informal Traders by 30 June 2027. (34409)",
    kpaIndex: 3,
    owner: "Executive Manager: Development Planning",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Implementation Stage (100% (30) SMMEs/Cooperatives/Informal Traders)- Signing of agreement between NDM and beneficiaries. Supply and Delivery of tools/equipment’s to SMMEs",
    q1: "Stage 1: Planning Stage (100%): Bid Specification Committee Resolution",
    q2: "Stage 2: Procurement Stage (25%): Tender Advertisement",
    mid: "Stage 2: Procurement Stage (25%): Tender Advertisement",
    q3: "Stage 2: Procurement Stage (100%): Bid Evaluation Committee Resolution, Bid Adjudication Committee Resolution and Appointment of Service Provider",
    q4: "Stage 3: Implementation Stage (100%) - Signing of agreement between NDM and beneficiaries. Supply and Delivery of tools/equipment’s to SMMEs/Cooperatives/Informal Traders and Delivery Notes.",
    poe: "BSC Resolution, Tender Advert (Tear Sheet), BEC Resolution, BAC Resolution, Signed & Dated Appointment Letter, list of beneficiaries, Signed Agreements",
    budget: "R5 000 000",
    location: "District wide"
  },
  "P_03": {
    desc: "Preparation of Consolidated AFS for NDM and NEDA AFS by 31 December 2026.",
    kpaIndex: 4,
    owner: "Chief Financial Officer",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Implementation Stage (100%): spending as per Finance Related Projects Report",
    q1: "Stage 3: Implementation Stage (100%): Consolidated AFS prepared and submitted to AG",
    q2: "Stage 3: Implementation Stage (100%): spending as per Finance Related Projects Report",
    mid: "Stage 3: Implementation Stage (100%): spending as per Finance Related Projects Report",
    q3: "N/A",
    q4: "N/A",
    poe: "Acknowledgement of receipt from AG, Final Consolidated AFS, Signed progress report",
    budget: "R500 000",
    location: "NDM"
  },
  "P_04": {
    desc: "Actuarial valuations paid by 31 December 2026.",
    kpaIndex: 4,
    owner: "Chief Financial Officer",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Implementation Stage (100%): Payment of Actuarial evaluator",
    q1: "Stage 3: Implementation Stage (100%): Final Actuarial Report",
    q2: "Stage 3: Implementation Stage (100%): Payment of Actuarial evaluator",
    mid: "Stage 3: Implementation Stage (100%): Payment of Actuarial evaluator",
    q3: "N/A",
    q4: "N/A",
    poe: "Actuarial valuations report (Q1) and proof of payment (Q2)",
    budget: "R20 000",
    location: "NDM"
  },
  "P_05": {
    desc: "SCM/Debtors verification system paid by 30 June 2027.",
    kpaIndex: 4,
    owner: "Chief Financial Officer",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Implementation Stage (100%): spending as per Finance Related Projects Report",
    q1: "Stage 3: Implementation Stage (17%): spending as per Finance Related Projects Report",
    q2: "Stage 3: Implementation Stage (42%): spending as per Finance Related Projects Report",
    mid: "Stage 3: Implementation Stage (42%): spending as per Finance Related Projects Report",
    q3: "Stage 3: Implementation Stage (67%): spending as per Finance Related Projects Report",
    q4: "Stage 3: Implementation Stage (100%): spending as per Finance Related Projects Report",
    poe: "Signed progress report",
    budget: "R960 000",
    location: "NDM"
  },
  "P_06": {
    desc: "AFS Assistance and Review of AFS for NDM and Reviewal of AFS for NEDA by 31 December 2026.",
    kpaIndex: 4,
    owner: "Chief Financial Officer",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Implementation Stage (100%): Assistance report during Audit",
    q1: "Stage 3: Implementation Stage (100%): Final AFS Review Report",
    q2: "Stage 3: Implementation Stage (100%): Assistance report during Audit",
    mid: "Stage 3: Implementation Stage (100%): Assistance report during Audit",
    q3: "N/A",
    q4: "N/A",
    poe: "NDM AFS Review Report (Q1) and NEDA AFS Review Reports (Q1), COMAF Register (with comments from independent reviewer)",
    budget: "R472 000",
    location: "NDM"
  },
  "P_07": {
    desc: "Refurbishment & Upgrading Delmas WWTW by 30 June 2027",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 3: Construction Stage (90%): Construction Progress",
    q2: "Stage 3: Construction Stage (95%): Construction Progress",
    mid: "Stage 3: Construction Stage (95%): Construction Progress",
    q3: "Stage 3: Construction Stage (98%): Construction Progress",
    q4: "Stage 3: Construction Stage (100%): Construction Progress",
    poe: "Signed Construction progress report, Completion certificate",
    budget: "R12 732 860",
    location: "Victor Khanye"
  },
  "P_08": {
    desc: "Refurbishment of Emalahleni Bulk Water Infrastructure by 30 June 2027",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 3: Construction Stage (40%): Construction Progress",
    q2: "Stage 3: Construction Stage (45%): Construction Progress",
    mid: "Stage 3: Construction Stage (45%): Construction Progress",
    q3: "Stage 3: Construction Stage (65%): Construction Progress",
    q4: "Stage 3: Construction Stage (100%): Construction Progress",
    poe: "Signed Construction progress report, Completion certificate",
    budget: "R47 619 047",
    location: "Emalahleni"
  },
  "P_09": {
    desc: "Loskop Regional Bulk Water Supply: WP1 by 30 June 2027",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 3: Construction Stage (80%): Construction Progress",
    q2: "Stage 3: Construction Stage (90%): Construction Progress",
    mid: "Stage 3: Construction Stage (90%): Construction Progress",
    q3: "Stage 3: Construction Stage (100%): Construction Progress",
    q4: "N/A",
    poe: "Signed Construction progress report.",
    budget: "R213 500 000",
    location: "Thembisile Hani"
  },
  "P_10": {
    desc: "Loskop Regional Bulk Water Supply: WP2 by 30 June 2027",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 3: Construction Stage (95%): Construction Progress",
    q2: "Stage 3: Construction Stage (98%): Construction Progress",
    mid: "Stage 3: Construction Stage (98%): Construction Progress",
    q3: "Stage 3: Construction Stage (100%): Construction Progress",
    q4: "N/A",
    poe: "Completion certificate",
    budget: "R0",
    location: "Thembisile Hani"
  },
  "P_11": {
    desc: "Loskop Regional Bulk Water Supply: WP3 by 30 June 2027",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 3: Construction Stage (90%): Construction Progress",
    q2: "Stage 3: Construction Stage (95%): Construction Progress",
    mid: "Stage 3: Construction Stage (95%): Construction Progress",
    q3: "Stage 3: Construction Stage (100%): Construction Progress",
    q4: "N/A",
    poe: "Completion certificate",
    budget: "R0",
    location: "Thembisile Hani"
  },
  "P_12": {
    desc: "Loskop Regional Bulk Water Supply: WP6(A) by 30 June 2027",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 1 – Planning and Design Stage (100%): BSC Resolutions",
    q2: "Stage 2 – Procurement Stage (100%): Advert, BEC&BAC Resolutions Contractor’s Appointment Letter",
    mid: "Stage 2 – Procurement Stage (100%): Advert, BEC&BAC Resolutions Contractor’s Appointment Letter",
    q3: "Stage 3: Construction Stage (70%): Construction Progress",
    q4: "Stage 3: Construction Stage (100%): Construction Progress",
    poe: "BSC resolutions, tender advert, BEC & BAC resolutions and signed appointment letter, Signed Construction progress report.",
    budget: "R0",
    location: "Thembisile Hani"
  },
  "P_13": {
    desc: "Loskop Regional Bulk Water Supply: WP6 (B) by 30 June 2027",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 1 – Planning and Design Stage (100%): BSC Resolutions",
    q2: "Stage 2 – Procurement Stage (100%): Advert, BEC&BAC Resolutions Contractor’s Appointment Letter",
    mid: "Stage 2 – Procurement Stage (100%): Advert, BEC&BAC Resolutions Contractor’s Appointment Letter",
    q3: "Stage 3: Construction Stage (70%): Construction Progress",
    q4: "Stage 3: Construction Stage (100%): Construction Progress",
    poe: "Signed Construction progress report.",
    budget: "R0",
    location: "Thembisile Hani"
  },
  "P_14": {
    desc: "Borehole Materials: Dr JS Moroka",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Implementation Stage (100%): Expenditure Progress",
    q1: "Stage 2 – Procurement Stage (100%): Appointment of Contractor",
    q2: "Stage 3: Implementation Stage (40%): Expenditure Progress",
    mid: "Stage 3: Implementation Stage (40%): Expenditure Progress",
    q3: "Stage 3: Implementation Stage (70%): Expenditure Progress",
    q4: "Stage 3: Implementation Stage (100%): Expenditure Progress",
    poe: "Appointment Letter, Signed Delivery Note(s) and Expenditure Report",
    budget: "R500 000",
    location: "Dr JS Moroka"
  },
  "P_15": {
    desc: "Rural Road Asset Management by 30 June 2027. (7302)",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 2: Implementation Stage (100%): Road Network Assessment",
    q1: "Stage 2: Implementation Stage (75%): Road Network Assessment",
    q2: "Stage 2: Implementation Stage (85%): Road Network Assessment",
    mid: "Stage 2: Implementation Stage (85%): Road Network Assessment",
    q3: "Stage 2: Implementation Stage (95%): Road Network Assessment",
    q4: "Stage 2: Implementation Stage (100%): Road Network Assessment",
    poe: "Signed Road Network Assessment progress reports",
    budget: "R2 659 000",
    location: "District Wide"
  },
  "P_16": {
    desc: "High mast Lights Retrofitting by 30 June 2027. (185541)",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 1: Planning Stage (100%): Approved Business plan",
    q2: "Stage 3: Construction Stage (30%): Construction Progress",
    mid: "Stage 3: Construction Stage (30%): Construction Progress",
    q3: "Stage 3: Construction Stage (60%): Construction Progress",
    q4: "Stage 3: Construction Stage (100%): Construction Progress",
    poe: "Signed Construction progress report and completion certificate, Approved Business plan",
    budget: "R2 000 000",
    location: "Victor Khanye LM"
  },
  "P_17": {
    desc: "High mast Lights Retrofitting by 30 June 2027. (185541)",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 3: Construction Stage (100%): Construction Progress",
    q1: "Stage 1: Planning Stage (100%): Approved Business plan",
    q2: "Stage 3: Construction Stage (30%): Construction Progress",
    mid: "Stage 3: Construction Stage (30%): Construction Progress",
    q3: "Stage 3: Construction Stage (60%): Construction Progress",
    q4: "Stage 3: Construction Stage (100%): Construction Progress",
    poe: "Signed Construction progress report and completion certificate, Approved Business plan",
    budget: "R2 000 000",
    location: "Dr JS Moroka LM"
  },
  "P_18": {
    desc: "Finalisation of a Township Establishment in Siyathuthuka",
    kpaIndex: 6,
    owner: "Executive Manager: Development Planning",
    uom: "Stage / % Completion",
    base: "0%",
    target: "Stage 2: Implementation Stage (100%): Final Special Study and Final of Opening of Township Register",
    q1: "Stage 1: Planning Stage (100%): Appointment of the Service Provider",
    q2: "Stage 2: Implementation Stage (30%): Inception Report",
    mid: "Stage 2: Implementation Stage (30%): Inception Report",
    q3: "Stage 2: Implementation Stage (60%): Draft Special Study and Draft Opening of Township Register",
    q4: "Stage 2: Implementation Stage (100%): Final Special Study and Final of Opening of Township Register",
    poe: "Appointment Letter, Inception Report, Draft Special Study and Opening of Township Register, Final Special Study and Opening of Township Register",
    budget: "R700 000",
    location: "Emakhazeni LM"
  },
  "P_19": {
    desc: "Percentage implementation of capital project management milestones within approved project schedule and budget.",
    kpaIndex: 1,
    owner: "Executive Manager: Technical Services",
    uom: "% milestone completion",
    base: "90%",
    target: "100%",
    q1: "25%",
    q2: "50%",
    mid: "50%",
    q3: "75%",
    q4: "100%",
    poe: "Signed capital project milestone completion certificates and project manager reports",
    budget: "R0",
    location: "District Wide"
  }
};

const getKpaName = (idx: number): string => {
  return [
    "KPA 1: Basic Service Delivery and Infrastructure Development",
    "KPA 2: Municipal Institutional Development and Transformation",
    "KPA 3: Local Economic Development (LED)",
    "KPA 4: Municipal Financial Viability and Management",
    "KPA 5: Good Governance and Public Participation",
    "KPA 6: Spatial Rationale and Environmental Management",
    "KPA 7: Skills Development & Capacity Training"
  ][idx - 1] || "KPA 1: Basic Service Delivery and Infrastructure Development";
};

const getKpaFlags = (idx: number) => {
  return {
    bsd: idx === 1 ? "X" : "",
    midt: (idx === 2 || idx === 7) ? "X" : "",
    led: idx === 3 ? "X" : "",
    mfvm: idx === 4 ? "X" : "",
    ggpp: idx === 5 ? "X" : "",
    sr: idx === 6 ? "X" : ""
  };
};

const getKpaStrategicObjective = (idx: number): string => {
  return [
    "To ensure reliable bulk water and electricity infrastructure",
    "To improve professional competency and human capital retention",
    "To promote local agrarian, manufacturing, and tourism hospitality economy",
    "To achieve unqualified AG audit with zero recurring findings",
    "To enable deep responsive community consultation across all wards",
    "To enforce optimal sustainable land use management aligned with SPLUMA",
    "To improve professional competency and human capital retention"
  ][idx - 1] || "To ensure reliable bulk water and electricity infrastructure";
};

const getKpaResponsibleOwner = (idx: number): string => {
  return [
    "Executive Manager: Technical Services",
    "Executive Manager: Corporate Services",
    "Executive Manager: Development Planning",
    "Chief Financial Officer",
    "Municipal Manager",
    "Executive Manager: Social Services",
    "Executive Manager: Corporate Services"
  ][idx - 1] || "Municipal Manager";
};

// Generates a fully inflated catalog item with KPI-specific POE
function inflateItem(refCode: string, compact: { desc: string; kpaIndex: number; uom?: string; target?: string; base?: string; q1?: string; q2?: string; mid?: string; q3?: string; q4?: string; poe?: string; budget?: string; owner?: string }): SdbipCatalogItem {
  const flags = getKpaFlags(compact.kpaIndex);
  const uom = compact.uom || "Percentage";
  const target = compact.target || "100% compliance";
  const base = compact.base || "0%";
  const poeDesc = compact.poe || `Signed quarterly verification report and compliance portfolio for ${refCode}`;

  return {
    Ref_Number: refCode,
    SDBIP_Strategic_Objective: getKpaStrategicObjective(compact.kpaIndex),
    KPI: compact.desc,
    National_KPA: getKpaName(compact.kpaIndex),
    BSD: flags.bsd,
    LED: flags.led,
    MFVM: flags.mfvm,
    GGPP: flags.ggpp,
    MIDT: flags.midt,
    SR: flags.sr,
    Responsible_Owner: compact.owner || getKpaResponsibleOwner(compact.kpaIndex),
    Unit_of_Measure: uom,
    Baseline: base,
    Annual_Target: target,
    Budget_Allocation: compact.budget || (refCode.startsWith('M') ? "R 1,500,000" : "R 250,000"),
    Q1_Target: compact.q1 || `25% of ${target}`,
    Q2_Target: compact.q2 || `50% of ${target}`,
    Mid_Term_Target: compact.mid || `50% of ${target}`,
    Q3_Target: compact.q3 || `75% of ${target}`,
    Q4_Target: compact.q4 || target,
    Submitter: "Departmental Submitter",
    Approver: "Executive Manager",
    POE_Description: poeDesc,
    Description: compact.desc
  };
}

// Ensure all 111 SDBIP items (M_01..M_92, P_01..P_19) are fully represented and populated in the array
export function ensureAllSdbipKpis(extractedItems: any[]): SdbipCatalogItem[] {
  const result: SdbipCatalogItem[] = [];
  const normalizedExtractedMap = new Map<string, any>();

  // Helper to normalize the reference keys (e.g. M1, M 1, M-01 -> M_01)
  const normalizeRef = (ref: string): string => {
    if (!ref) return "";
    let clean = ref.trim().toUpperCase().replace(/[\s_\-]+/g, "");
    if (clean.startsWith("M")) {
      const numStr = clean.substring(1);
      const parsed = parseInt(numStr, 10);
      if (!isNaN(parsed)) return `M_${String(parsed).padStart(2, '0')}`;
    } else if (clean.startsWith("P")) {
      const numStr = clean.substring(1);
      const parsed = parseInt(numStr, 10);
      if (!isNaN(parsed)) return `P_${String(parsed).padStart(2, '0')}`;
    }
    return ref;
  };

  // Map each incoming extracted item to its normalized Ref_Number
  for (const item of extractedItems) {
    if (!item) continue;
    const rawRef = item.Ref_Number || item.Ref_No || item.Ref || item.refNum || "";
    const normRef = normalizeRef(String(rawRef));
    if (normRef) {
      normalizedExtractedMap.set(normRef, item);
    }
  }

  // 1. Inflate M_01 to M_92
  for (let i = 1; i <= 92; i++) {
    const code = `M_${String(i).padStart(2, '0')}`;
    const extracted = normalizedExtractedMap.get(code);
    const compactDef = mKpisCompact[code];

    if (extracted) {
      const sourcePoe = extracted.POE_Description || extracted.poeStatus || extracted.poeDesc || extracted.poe || extracted.meansOfVerification || extracted.q1PoeDesc || extracted.q2PoeDesc || extracted.q3PoeDesc || extracted.q4PoeDesc || compactDef?.poe || `Signed quarterly verification report and compliance portfolio for ${code}`;
      // Map properties neatly, falling back to standard values if null/empty
      result.push({
        Ref_Number: code,
        SDBIP_Strategic_Objective: extracted.SDBIP_Strategic_Objective || extracted.strategicObj || (compactDef ? getKpaStrategicObjective(compactDef.kpaIndex) : ""),
        KPI: extracted.KPI || extracted.kpi || (compactDef ? compactDef.desc : ""),
        National_KPA: extracted.National_KPA || extracted.kpas || (compactDef ? getKpaName(compactDef.kpaIndex) : ""),
        BSD: extracted.BSD || (compactDef && getKpaFlags(compactDef.kpaIndex).bsd ? "X" : ""),
        LED: extracted.LED || (compactDef && getKpaFlags(compactDef.kpaIndex).led ? "X" : ""),
        MFVM: extracted.MFVM || (compactDef && getKpaFlags(compactDef.kpaIndex).mfvm ? "X" : ""),
        GGPP: extracted.GGPP || (compactDef && getKpaFlags(compactDef.kpaIndex).ggpp ? "X" : ""),
        MIDT: extracted.MIDT || (compactDef && getKpaFlags(compactDef.kpaIndex).midt ? "X" : ""),
        SR: extracted.SR || (compactDef && getKpaFlags(compactDef.kpaIndex).sr ? "X" : ""),
        Responsible_Owner: extracted.Responsible_Owner || extracted.responsibleUnit || (compactDef ? getKpaResponsibleOwner(compactDef.kpaIndex) : ""),
        Unit_of_Measure: extracted.Unit_of_Measure || extracted.uom || (compactDef ? compactDef.uom || "Percentage" : ""),
        Baseline: extracted.Baseline || extracted.baseline || (compactDef ? compactDef.base || "0%" : "0"),
        Annual_Target: extracted.Annual_Target || extracted.annualTarget || (compactDef ? compactDef.target || "100%" : ""),
        Budget_Allocation: extracted.Budget_Allocation || extracted.budgetAllocation || "R 1,500,000",
        Q1_Target: extracted.Q1_Target || extracted.q1 || (compactDef ? compactDef.q1 || `25% of ${compactDef.target}` : ""),
        Q2_Target: extracted.Q2_Target || extracted.q2 || (compactDef ? compactDef.q2 || `50% of ${compactDef.target}` : ""),
        Mid_Term_Target: extracted.Mid_Term_Target || extracted.midTerm || (compactDef ? compactDef.mid || `50% of ${compactDef.target}` : ""),
        Q3_Target: extracted.Q3_Target || extracted.q3 || (compactDef ? compactDef.q3 || `75% of ${compactDef.target}` : ""),
        Q4_Target: extracted.Q4_Target || extracted.q4 || (compactDef ? compactDef.q4 || compactDef.target : ""),
        Submitter: extracted.Submitter || extracted.submitter || "Departmental Submitter",
        Approver: extracted.Approver || extracted.approver || "Executive Manager",
        POE_Description: sourcePoe,
        Description: extracted.Description || extracted.description || (compactDef ? compactDef.desc : "")
      });
    } else if (compactDef) {
      result.push(inflateItem(code, compactDef));
    } else {
      // Emergency dummy fallback
      result.push(inflateItem(code, { desc: `Municipal KPI Indicator details for ${code}`, kpaIndex: 1, poe: `Signed quarterly portfolio of evidence for ${code}` }));
    }
  }

  // 2. Inflate P_01 to P_19
  for (let i = 1; i <= 19; i++) {
    const code = `P_${String(i).padStart(2, '0')}`;
    const extracted = normalizedExtractedMap.get(code);
    const compactDef = pKpisCompact[code];

    if (extracted) {
      const sourcePoe = extracted.POE_Description || extracted.poeStatus || extracted.poeDesc || extracted.poe || extracted.meansOfVerification || extracted.q1PoeDesc || extracted.q2PoeDesc || extracted.q3PoeDesc || extracted.q4PoeDesc || compactDef?.poe || `Signed quarterly project milestone certificates and expenditure reports for ${code}`;
      const rawKpi = extracted.KPI || extracted.kpi || "";
      const isGeneric = !rawKpi || rawKpi.length < 5 || rawKpi.includes("Percentage of departmental capital budget spent") || rawKpi.includes("Number of community consultation meetings");
      const kpiName = isGeneric ? (compactDef ? compactDef.desc : rawKpi) : rawKpi;

      result.push({
        Ref_Number: code,
        SDBIP_Strategic_Objective: extracted.SDBIP_Strategic_Objective || extracted.strategicObj || (compactDef ? getKpaStrategicObjective(compactDef.kpaIndex) : ""),
        KPI: kpiName,
        National_KPA: extracted.National_KPA || extracted.kpas || (compactDef ? getKpaName(compactDef.kpaIndex) : ""),
        BSD: extracted.BSD || (compactDef && getKpaFlags(compactDef.kpaIndex).bsd ? "X" : ""),
        LED: extracted.LED || (compactDef && getKpaFlags(compactDef.kpaIndex).led ? "X" : ""),
        MFVM: extracted.MFVM || (compactDef && getKpaFlags(compactDef.kpaIndex).mfvm ? "X" : ""),
        GGPP: extracted.GGPP || (compactDef && getKpaFlags(compactDef.kpaIndex).ggpp ? "X" : ""),
        MIDT: extracted.MIDT || (compactDef && getKpaFlags(compactDef.kpaIndex).midt ? "X" : ""),
        SR: extracted.SR || (compactDef && getKpaFlags(compactDef.kpaIndex).sr ? "X" : ""),
        Responsible_Owner: extracted.Responsible_Owner || extracted.responsibleUnit || (compactDef ? (compactDef.owner || getKpaResponsibleOwner(compactDef.kpaIndex)) : ""),
        Unit_of_Measure: (isGeneric && compactDef?.uom) ? compactDef.uom : (extracted.Unit_of_Measure || extracted.uom || (compactDef ? compactDef.uom || "Stage / % Completion" : "")),
        Baseline: (isGeneric && compactDef?.base) ? compactDef.base : (extracted.Baseline || extracted.baseline || (compactDef ? compactDef.base || "0%" : "0")),
        Annual_Target: (isGeneric && compactDef?.target) ? compactDef.target : (extracted.Annual_Target || extracted.annualTarget || (compactDef ? compactDef.target || "100%" : "")),
        Budget_Allocation: (isGeneric && compactDef?.budget) ? compactDef.budget : (extracted.Budget_Allocation || compactDef?.budget || extracted.budgetAllocation || "R 0"),
        Q1_Target: (isGeneric && compactDef?.q1) ? compactDef.q1 : (extracted.Q1_Target || extracted.q1 || (compactDef ? compactDef.q1 || `25%` : "")),
        Q2_Target: (isGeneric && compactDef?.q2) ? compactDef.q2 : (extracted.Q2_Target || extracted.q2 || (compactDef ? compactDef.q2 || `50%` : "")),
        Mid_Term_Target: (isGeneric && compactDef?.mid) ? compactDef.mid : (extracted.Mid_Term_Target || extracted.midTerm || (compactDef ? compactDef.mid || `50%` : "")),
        Q3_Target: (isGeneric && compactDef?.q3) ? compactDef.q3 : (extracted.Q3_Target || extracted.q3 || (compactDef ? compactDef.q3 || `75%` : "")),
        Q4_Target: (isGeneric && compactDef?.q4) ? compactDef.q4 : (extracted.Q4_Target || extracted.q4 || (compactDef ? compactDef.q4 || compactDef.target : "")),
        Submitter: extracted.Submitter || extracted.submitter || "Departmental Submitter",
        Approver: extracted.Approver || extracted.approver || "Executive Manager",
        POE_Description: isGeneric && compactDef?.poe ? compactDef.poe : sourcePoe,
        Description: kpiName
      });
    } else if (compactDef) {
      result.push(inflateItem(code, compactDef));
    } else {
      // Emergency dummy fallback
      result.push(inflateItem(code, { desc: `Departmental Project details for ${code}`, kpaIndex: 5, poe: `Signed quarterly project evidence for ${code}` }));
    }
  }

  return result;
}

export const SDBIP_CANONICAL_CATALOG: SdbipCatalogItem[] = ensureAllSdbipKpis([]);
