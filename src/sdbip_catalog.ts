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
        POE_Description: sourcePoe,
        Description: extracted.Description || extracted.description || (compactDef ? compactDef.desc : "")
      });
    } else if (compactDef) {
      result.push(inflateItem(code, compactDef));
    } else {
      // Emergency dummy fallback
      result.push(inflateItem(code, { desc: `Departmental KPI Indicator details for ${code}`, kpaIndex: 5, poe: `Signed quarterly project evidence for ${code}` }));
    }
  }

  return result;
}
