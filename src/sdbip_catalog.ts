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

// Compact KPI definitions list
const mKpisCompact: { [key: string]: { desc: string; kpaIndex: number; uom?: string; target?: string; base?: string; q1?: string; q2?: string; mid?: string; q3?: string; q4?: string } } = {
  // KPA 1: Basic Service Delivery (1 - 15)
  "M_01": { desc: "Percentage of households with access to basic potable water supply.", kpaIndex: 1, uom: "% households", target: "100%", base: "95%" },
  "M_02": { desc: "Percentage of sanitation complaints resolved within 24 hours.", kpaIndex: 1, uom: "% resolution", target: "100%", base: "85%" },
  "M_03": { desc: "Number of new water connections completed in informal settlements.", kpaIndex: 1, uom: "connections", target: "500", base: "300" },
  "M_04": { desc: "Kilometers of new storm-water drainage pipelines installed.", kpaIndex: 1, uom: "km", target: "12 km", base: "8 km" },
  "M_05": { desc: "Percentage of electricity service interruptions resolved within standard NRS timeframes.", kpaIndex: 1, uom: "% compliance", target: "95%", base: "90%" },
  "M_06": { desc: "Number of high-mast street lights installed in rural nodes.", kpaIndex: 1, uom: "high-masts", target: "20", base: "12" },
  "M_07": { desc: "Kilometers of gravel roads upgraded to asphalt/tar.", kpaIndex: 1, uom: "km upgraded", target: "15 km", base: "10 km" },
  "M_08": { desc: "Square meters of potholes patched on major municipal roads.", kpaIndex: 1, uom: "sqm patched", target: "8000 sqm", base: "5000 sqm" },
  "M_09": { desc: "Percentage of formal households with weekly refuse collection services.", kpaIndex: 1, uom: "% households", target: "100%", base: "98%" },
  "M_10": { desc: "Volume of domestic waste diverted from landfill sites through recycling initiatives.", kpaIndex: 1, uom: "tons", target: "1500 tons", base: "1000 tons" },
  "M_11": { desc: "Number of low-cost housing units connected to the bulk sewerage network.", kpaIndex: 1, uom: "units", target: "350 units", base: "200 units" },
  "M_12": { desc: "Percentage compliance with drinking water quality standards (Blue Drop).", kpaIndex: 1, uom: "% compliance score", target: "98%", base: "95%" },
  "M_13": { desc: "Percentage compliance with wastewater treatment facility effluent standards (Green Drop).", kpaIndex: 1, uom: "% compliance score", target: "92%", base: "88%" },
  "M_14": { desc: "Number of preventative maintenance interventions executed on bulk water pumps.", kpaIndex: 1, uom: "cycles completed", target: "24", base: "18" },
  "M_15": { desc: "Percentage reduction in non-revenue water losses across municipal grid.", kpaIndex: 1, uom: "% loss reduction", target: "5% reduction", base: "3% reduction" },

  // KPA 2: Municipal Institutional Development & Transformation (16 - 30)
  "M_16": { desc: "Percentage of employment equity targets met in senior manager roles.", kpaIndex: 2, uom: "% representation", target: "60%", base: "55%" },
  "M_17": { desc: "Percentage of municipal staff performance reviews completed on time.", kpaIndex: 2, uom: "% compliance", target: "100%", base: "90%" },
  "M_18": { desc: "Percentage of critical vacant posts filled within 3 months of advertisement.", kpaIndex: 2, uom: "% vacancies filled", target: "80%", base: "70%" },
  "M_19": { desc: "Number of formal workplace skills training interventions completed.", kpaIndex: 2, uom: "interventions", target: "45", base: "30" },
  "M_20": { desc: "Employee retention rate under strategic scarce-skills program.", kpaIndex: 2, uom: "% retention", target: "92%", base: "88%" },
  "M_21": { desc: "Number of joint labor-management consultative forum meetings held.", kpaIndex: 2, uom: "meetings", target: "4", base: "4" },
  "M_22": { desc: "Percentage of IT disaster recovery plan test cycles passed.", kpaIndex: 2, uom: "% pass", target: "100%", base: "100%" },
  "M_23": { desc: "Percentage availability of core municipal ERP systems.", kpaIndex: 2, uom: "% uptime", target: "99.5%", base: "98%" },
  "M_24": { desc: "Number of employee wellness outreach and health screening programs conducted.", kpaIndex: 2, uom: "programs", target: "8", base: "6" },
  "M_25": { desc: "Percentage of occupational health and safety (OHS) incident audits completed.", kpaIndex: 2, uom: "% compliance", target: "100%", base: "95%" },
  "M_26": { desc: "Percentage of internal promotions aligned with the employment equity plan.", kpaIndex: 2, uom: "% alignment", target: "75%", base: "70%" },
  "M_27": { desc: "Number of departmental operational risk registers updated.", kpaIndex: 2, uom: "updates", target: "4", base: "4" },
  "M_28": { desc: "Percentage of municipal bylaws reviewed and updated for council submission.", kpaIndex: 2, uom: "% progress", target: "100%", base: "80%" },
  "M_29": { desc: "Average number of days taken to resolve formal staff grievances.", kpaIndex: 2, uom: "days", target: "Less than 15 days", base: "18 days average" },
  "M_30": { desc: "Percentage of customer service desks meeting standard response protocols.", kpaIndex: 2, uom: "% compliance", target: "90%", base: "85%" },

  // KPA 3: Local Economic Development (31 - 45)
  "M_31": { desc: "Number of work opportunities created through Expanded Public Works Programme (EPWP).", kpaIndex: 3, uom: "jobs", target: "1200", base: "950" },
  "M_32": { desc: "Number of local SMMEs supported through targeted municipal capacity workshops.", kpaIndex: 3, uom: "SMMEs trained", target: "80", base: "50" },
  "M_33": { desc: "Value of municipal procurement spend allocated to local SMMEs.", kpaIndex: 3, uom: "Rand value", target: "R15,000,000", base: "R10,000,000" },
  "M_34": { desc: "Number of tourist information desks maintained and supported.", kpaIndex: 3, uom: "desks", target: "4", base: "3" },
  "M_35": { desc: "Number of agricultural cooperatives supported with equipment or training.", kpaIndex: 3, uom: "cooperatives", target: "10", base: "6" },
  "M_36": { desc: "Number of local business forums hosted to align LED initiatives.", kpaIndex: 3, uom: "forums", target: "4", base: "2" },
  "M_37": { desc: "Percentage of LED strategy targets successfully implemented during the year.", kpaIndex: 3, uom: "% implementation", target: "90%", base: "80%" },
  "M_38": { desc: "Number of job seekers registered on the municipal skills database.", kpaIndex: 3, uom: "seekers", target: "1500", base: "1000" },
  "M_39": { desc: "Number of youth-owned enterprises receiving direct material assistance.", kpaIndex: 3, uom: "enterprises", target: "25", base: "15" },
  "M_40": { desc: "Number of informal trading stalls constructed or upgraded.", kpaIndex: 3, uom: "stalls", target: "50", base: "30" },
  "M_41": { desc: "Percentage of informal trading licenses processed within 7 working days.", kpaIndex: 3, uom: "% compliance", target: "95%", base: "90%" },
  "M_42": { desc: "Number of investment promotion workshops hosted with external partners.", kpaIndex: 3, uom: "workshops", target: "2", base: "1" },
  "M_43": { desc: "Number of community-based public works infrastructure programs initiated.", kpaIndex: 3, uom: "programs", target: "6", base: "4" },
  "M_44": { desc: "Number of skills training bursaries awarded to local youth.", kpaIndex: 3, uom: "bursaries", target: "30", base: "20" },
  "M_45": { desc: "Value of public private partnership agreements finalized for economic hubs.", kpaIndex: 3, uom: "agreements", target: "2", base: "1" },

  // KPA 4: Municipal Financial Viability & Management (46 - 60)
  "M_46": { desc: "Debt coverage ratio achieved by the municipality.", kpaIndex: 4, uom: "ratio", target: "2.5 times or better", base: "2.1 times" },
  "M_47": { desc: "Percentage of capital budget spent on infrastructure projects.", kpaIndex: 4, uom: "% capital spent", target: "95%", base: "91%" },
  "M_48": { desc: "Percentage of operational budget spent on planned maintenance.", kpaIndex: 4, uom: "% operational spent", target: "100%", base: "94%" },
  "M_49": { desc: "Audit outcome obtained from the Auditor-General for the previous financial year.", kpaIndex: 4, uom: "audit status", target: "Clean audit outcome", base: "Unqualified audit" },
  "M_50": { desc: "Percentage of creditor invoices paid within statutory 30-day timeframe.", kpaIndex: 4, uom: "% invoices paid", target: "100%", base: "95%" },
  "M_51": { desc: "Percentage of municipal revenue collection rate achieved against billed revenue.", kpaIndex: 4, uom: "% revenue collected", target: "95%", base: "92%" },
  "M_52": { desc: "Percentage variance of actual expenditure against approved mid-term budget.", kpaIndex: 4, uom: "% variance", target: "Less than 5%", base: "7% variance" },
  "M_53": { desc: "Percentage accuracy of the municipal asset register (verified via physical audit).", kpaIndex: 4, uom: "% accuracy", target: "100%", base: "98%" },
  "M_54": { desc: "Percentage of grant funding spent in accordance with grant conditions.", kpaIndex: 4, uom: "% grant spent", target: "100%", base: "95%" },
  "M_55": { desc: "Percentage of supply chain bids processed within standard turnaround time.", kpaIndex: 4, uom: "% compliance", target: "90%", base: "84%" },
  "M_56": { desc: "Cost coverage ratio of the municipality (cash reserves/monthly operating exp).", kpaIndex: 4, uom: "months coverage", target: "3 months", base: "2 months" },
  "M_57": { desc: "Percentage reduction in unauthorized, irregular, fruitless and wasteful expenditure (UIFW).", kpaIndex: 4, uom: "% reduction", target: "100% reduction", base: "80% reduction" },
  "M_58": { desc: "Percentage compliance of the annual financial statements submitted to AG.", kpaIndex: 4, uom: "% compliance", target: "100%", base: "100%" },
  "M_59": { desc: "Percentage of indigent households registered and receiving free basic services.", kpaIndex: 4, uom: "% registry accuracy", target: "100%", base: "96%" },
  "M_60": { desc: "Percentage of financial reports submitted to National Treasury within due dates.", kpaIndex: 4, uom: "% compliance", target: "100%", base: "100%" },

  // KPA 5: Good Governance & Public Participation (61 - 75)
  "M_61": { desc: "Number of functional ward committees established and meeting regularly.", kpaIndex: 5, uom: "committees active", target: "100%", base: "90%" },
  "M_62": { desc: "Percentage of resolved community complaints logged through CRM system.", kpaIndex: 5, uom: "% complaints resolved", target: "95%", base: "82%" },
  "M_63": { desc: "Number of IDP public representative consultation meetings held.", kpaIndex: 5, uom: "meetings", target: "12", base: "8" },
  "M_64": { desc: "Percentage compliance with the municipal risk management plan.", kpaIndex: 5, uom: "% compliance", target: "100%", base: "90%" },
  "M_65": { desc: "Percentage of internal audit findings successfully resolved by management.", kpaIndex: 5, uom: "% resolved", target: "90%", base: "75%" },
  "M_66": { desc: "Percentage implementation of the municipal anti-corruption strategy.", kpaIndex: 5, uom: "% compliance", target: "100%", base: "85%" },
  "M_67": { desc: "Number of council-approved oversight reports published for the public.", kpaIndex: 5, uom: "reports", target: "4", base: "4" },
  "M_68": { desc: "Number of municipal public accounts committee (MPAC) meetings conducted.", kpaIndex: 5, uom: "meetings", target: "8", base: "6" },
  "M_69": { desc: "Percentage compliance with the Promotion of Access to Information Act (PAIA).", kpaIndex: 5, uom: "% compliance", target: "100%", base: "100%" },
  "M_70": { desc: "Percentage of executive council decisions implemented within due dates.", kpaIndex: 5, uom: "% implementation", target: "95%", base: "90%" },
  "M_71": { desc: "Number of community feedback newsletters published in local languages.", kpaIndex: 5, uom: "editions", target: "4", base: "2" },
  "M_72": { desc: "Percentage compliance with standard municipal delegation registers.", kpaIndex: 5, uom: "% compliance", target: "100%", base: "95%" },
  "M_73": { desc: "Number of external compliance reports submitted to Provincial COGTA.", kpaIndex: 5, uom: "reports", target: "4", base: "4" },
  "M_74": { desc: "Percentage of ward councilors trained in leadership and governance skills.", kpaIndex: 5, uom: "% training rate", target: "100%", base: "80%" },
  "M_75": { desc: "Percentage uptime of the community digital communication portals.", kpaIndex: 5, uom: "% availability", target: "99%", base: "97%" },

  // KPA 6: Spatial Rationale & Environmental Management (76 - 92)
  "M_76": { desc: "Percentage of land-use applications processed within statutory SPLUMA timeframes.", kpaIndex: 6, uom: "% compliance", target: "95%", base: "88%" },
  "M_77": { desc: "Number of environmental compliance audits conducted on key municipal projects.", kpaIndex: 6, uom: "audits completed", target: "10", base: "6" },
  "M_78": { desc: "Percentage alignment of municipal budget with Spatial Development Framework (SDF).", kpaIndex: 6, uom: "% alignment", target: "100%", base: "95%" },
  "M_79": { desc: "Number of GIS layers updated with land use data.", kpaIndex: 6, uom: "updates", target: "6", base: "4" },
  "M_80": { desc: "Percentage of municipal land audits completed and cataloged in asset register.", kpaIndex: 6, uom: "% complete", target: "100%", base: "85%" },
  "M_81": { desc: "Number of local spatial planning workshops hosted with community leaders.", kpaIndex: 6, uom: "workshops", target: "4", base: "2" },
  "M_82": { desc: "Number of hectares of alien invasive vegetation cleared in conservation zones.", kpaIndex: 6, uom: "hectares", target: "200", base: "150" },
  "M_83": { desc: "Number of public parks maintained to standard occupational safety criteria.", kpaIndex: 6, uom: "parks", target: "15", base: "10" },
  "M_84": { desc: "Percentage compliance with integrated waste management plan (IWMP) targets.", kpaIndex: 6, uom: "% compliance score", target: "90%", base: "80%" },
  "M_85": { desc: "Percentage of newly registered townships aligned with integrated human settlements plan.", kpaIndex: 6, uom: "% alignment", target: "100%", base: "90%" },
  "M_86": { desc: "Number of localized environmental awareness campaigns conducted.", kpaIndex: 6, uom: "campaigns", target: "8", base: "4" },
  "M_87": { desc: "Percentage of illegal dumping hot-spots cleared within 48 hours.", kpaIndex: 6, uom: "% clearance rate", target: "90%", base: "75%" },
  "M_88": { desc: "Number of urban renewal spatial project feasibility studies completed.", kpaIndex: 6, uom: "studies", target: "3", base: "1" },
  "M_89": { desc: "Percentage compliance with national air quality monitoring criteria.", kpaIndex: 6, uom: "% compliance", target: "98%", base: "95%" },
  "M_90": { desc: "Number of building plan inspections completed during construction stages.", kpaIndex: 6, uom: "inspections", target: "250", base: "180" },
  "M_91": { desc: "Percentage of illegal structure enforcement notices issued within 7 days of discovery.", kpaIndex: 6, uom: "% compliance", target: "95%", base: "90%" },
  "M_92": { desc: "Number of climate change adaptation strategy training sessions held.", kpaIndex: 6, uom: "sessions", target: "4", base: "2" }
};

// Compact Departmental KPI definitions list (P_01 to P_19)
const pKpisCompact: { [key: string]: { desc: string; kpaIndex: number; uom?: string; target?: string; base?: string; q1?: string; q2?: string; mid?: string; q3?: string; q4?: string } } = {
  "P_01": { desc: "Percentage of departmental capital budget spent on service delivery projects.", kpaIndex: 4, uom: "% spent", target: "95%", base: "90%" },
  "P_02": { desc: "Number of community consultation meetings held to gather input on departmental projects.", kpaIndex: 5, uom: "meetings", target: "4", base: "2" },
  "P_03": { desc: "Percentage of departmental audit queries resolved within 30 days of notification.", kpaIndex: 4, uom: "% resolved", target: "100%", base: "95%" },
  "P_04": { desc: "Average response time (in hours) to resolve urgent customer service requests.", kpaIndex: 1, uom: "hours", target: "<24 hours", base: "36 hours" },
  "P_05": { desc: "Percentage of staff performance reviews conducted and submitted within deadlines.", kpaIndex: 2, uom: "% reviews", target: "100%", base: "90%" },
  "P_06": { desc: "Percentage compliance with departmental procurement plan milestones.", kpaIndex: 4, uom: "% compliance", target: "90%", base: "85%" },
  "P_07": { desc: "Number of safety inspections conducted at municipal facilities.", kpaIndex: 2, uom: "inspections", target: "12", base: "8" },
  "P_08": { desc: "Percentage of local labor employed in departmental infrastructure projects.", kpaIndex: 3, uom: "% local labor", target: "40%", base: "35%" },
  "P_09": { desc: "Number of training hours completed per employee in the department.", kpaIndex: 2, uom: "hours per staff", target: "24", base: "16" },
  "P_10": { desc: "Percentage of departmental risk registers updated quarterly.", kpaIndex: 2, uom: "% updated", target: "100%", base: "100%" },
  "P_11": { desc: "Number of LED initiatives supported directly by the department.", kpaIndex: 3, uom: "initiatives", target: "6", base: "4" },
  "P_12": { desc: "Percentage reduction in departmental energy/water utility losses.", kpaIndex: 1, uom: "% loss reduction", target: "5%", base: "3%" },
  "P_13": { desc: "Number of departmental reports submitted to municipal council on time.", kpaIndex: 5, uom: "reports", target: "12", base: "12" },
  "P_14": { desc: "Percentage compliance with the Promotion of Administrative Justice Act (PAJA).", kpaIndex: 5, uom: "% compliance", target: "100%", base: "100%" },
  "P_15": { desc: "Number of public awareness campaigns hosted by the department.", kpaIndex: 5, uom: "campaigns", target: "4", base: "2" },
  "P_16": { desc: "Percentage of departmental documents archived in the centralized DMS.", kpaIndex: 2, uom: "% archived", target: "100%", base: "95%" },
  "P_17": { desc: "Average number of days to process business license applications.", kpaIndex: 3, uom: "days", target: "5 days", base: "7 days" },
  "P_18": { desc: "Percentage of departmental service standards published and met.", kpaIndex: 5, uom: "% standards met", target: "95%", base: "90%" },
  "P_19": { desc: "Percentage implementation of capital project management milestones within approved project schedule and budget.", kpaIndex: 1, uom: "% milestone completion", target: "100%", base: "90%" }
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

// Generates a fully inflated catalog item
function inflateItem(refCode: string, compact: { desc: string; kpaIndex: number; uom?: string; target?: string; base?: string; q1?: string; q2?: string; mid?: string; q3?: string; q4?: string }): SdbipCatalogItem {
  const flags = getKpaFlags(compact.kpaIndex);
  const uom = compact.uom || "Percentage";
  const target = compact.target || "100% compliance";
  const base = compact.base || "0%";

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
    Responsible_Owner: getKpaResponsibleOwner(compact.kpaIndex),
    Unit_of_Measure: uom,
    Baseline: base,
    Annual_Target: target,
    Budget_Allocation: refCode.startsWith('M') ? "R 1,500,000" : "R 250,000",
    Q1_Target: compact.q1 || `25% of ${target}`,
    Q2_Target: compact.q2 || `50% of ${target}`,
    Mid_Term_Target: compact.mid || `50% of ${target}`,
    Q3_Target: compact.q3 || `75% of ${target}`,
    Q4_Target: compact.q4 || target,
    Submitter: "Departmental Submitter",
    Approver: "Executive Manager",
    POE_Description: `Upload quarterly evidence for ${refCode}`,
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
        POE_Description: extracted.POE_Description || extracted.poeStatus || `Upload quarterly evidence for ${code}`,
        Description: extracted.Description || extracted.description || (compactDef ? compactDef.desc : "")
      });
    } else if (compactDef) {
      result.push(inflateItem(code, compactDef));
    } else {
      // Emergency dummy fallback
      result.push(inflateItem(code, { desc: `Municipal KPI Indicator details for ${code}`, kpaIndex: 1 }));
    }
  }

  // 2. Inflate P_01 to P_19
  for (let i = 1; i <= 19; i++) {
    const code = `P_${String(i).padStart(2, '0')}`;
    const extracted = normalizedExtractedMap.get(code);
    const compactDef = pKpisCompact[code];

    if (extracted) {
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
        Budget_Allocation: extracted.Budget_Allocation || extracted.budgetAllocation || "R 250,000",
        Q1_Target: extracted.Q1_Target || extracted.q1 || (compactDef ? compactDef.q1 || `25% of ${compactDef.target}` : ""),
        Q2_Target: extracted.Q2_Target || extracted.q2 || (compactDef ? compactDef.q2 || `50% of ${compactDef.target}` : ""),
        Mid_Term_Target: extracted.Mid_Term_Target || extracted.midTerm || (compactDef ? compactDef.mid || `50% of ${compactDef.target}` : ""),
        Q3_Target: extracted.Q3_Target || extracted.q3 || (compactDef ? compactDef.q3 || `75% of ${compactDef.target}` : ""),
        Q4_Target: extracted.Q4_Target || extracted.q4 || (compactDef ? compactDef.q4 || compactDef.target : ""),
        Submitter: extracted.Submitter || extracted.submitter || "Departmental Submitter",
        Approver: extracted.Approver || extracted.approver || "Executive Manager",
        POE_Description: extracted.POE_Description || extracted.poeStatus || `Upload quarterly evidence for ${code}`,
        Description: extracted.Description || extracted.description || (compactDef ? compactDef.desc : "")
      });
    } else if (compactDef) {
      result.push(inflateItem(code, compactDef));
    } else {
      // Emergency dummy fallback
      result.push(inflateItem(code, { desc: `Departmental KPI Indicator details for ${code}`, kpaIndex: 5 }));
    }
  }

  return result;
}
