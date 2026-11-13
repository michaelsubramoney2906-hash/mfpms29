import { MORARJ_OFFICIAL_KPIS, MORARJ_OFFICIAL_KPAS, MORARJ_METADATA } from '../data/morarAgreementData';

export function normalizeEmail(email: string): string {
  return (email || '').trim().toLowerCase();
}

export function isJayvantiMorar(email: string): boolean {
  const norm = normalizeEmail(email);
  return norm === 'morarj@nkangaladm.gov.za' || norm === 'morari@nkangaladm.gov.za' || norm.includes('morar');
}

export function isMmaphiriRampedi(email: string): boolean {
  const norm = normalizeEmail(email);
  return norm === 'rampedimr@nkangaladm.gov.za' || norm.includes('rampedi');
}

export function isThomasMahlangu(email: string): boolean {
  const norm = normalizeEmail(email);
  return norm === 'mahlangutp@nkangaladm.gov.za' || norm.includes('mahlangutp');
}

export function isMxolisiBembe(email: string): boolean {
  const norm = normalizeEmail(email);
  return norm === 'bembem@nkangaladm.gov.za' || norm.includes('bembe');
}

export function resolveUserEmailAlias(email: string): string {
  const norm = normalizeEmail(email);
  if (norm === 'khumalobs@nkangaladm.gov.za') {
    return 'nkosibs@nkangaladm.gov.za';
  }
  if (norm === 'morari@nkangaladm.gov.za' || norm === 'morarj@nkangaladm.gov.za') {
    return 'morarj@nkangaladm.gov.za';
  }
  if (norm.includes('bvuma') && (norm.includes('mgr') || norm.includes('manager'))) {
    return 'bvumaa-mgr@nkangaladm.gov.za';
  }
  if (norm.includes('bvuma') || norm.includes('alvin.bvuma') || norm.includes('a.bvuma')) {
    return 'bvumaa@nkangaladm.gov.za';
  }
  return norm;
}

/**
 * Transforms or filters KPIs according to specific official instructions.
 */
export function applyOfficialKpiRules(userEmail: string, inputKpis: any[]): any[] {
  const normEmail = resolveUserEmailAlias(normalizeEmail(userEmail));

  // 1. Ms. Jayvanti Morar (MorarJ@nkangaladm.gov.za or morarj@nkangaladm.gov.za or morari@nkangaladm.gov.za)
  if (isJayvantiMorar(normEmail)) {
    const existingMap = new Map<string, any>();
    if (Array.isArray(inputKpis)) {
      inputKpis.forEach(item => {
        if (item) {
          if (item.id) existingMap.set(String(item.id).toLowerCase(), item);
          if (item.kpiNo) existingMap.set(String(item.kpiNo).toLowerCase(), item);
          if (item.refNum) existingMap.set(String(item.refNum).toLowerCase(), item);
        }
      });
    }

    return MORARJ_OFFICIAL_KPIS.map(kpi => {
      const existing = existingMap.get(String(kpi.id).toLowerCase()) || 
                       existingMap.get(String(kpi.kpiNo).toLowerCase()) || 
                       existingMap.get(String(kpi.refNum).toLowerCase()) || {};

      return {
        ...kpi,
        ...existing,
        id: kpi.id,
        kpiNo: kpi.kpiNo,
        refNum: kpi.refNum,
        kpaName: kpi.kpaName,
        kpaNumber: kpi.kpaNumber,
        kpiDescription: kpi.kpiDescription,
        kpi: kpi.kpiDescription,
        description: kpi.kpiDescription,
        indicator: kpi.kpiDescription,
        weight: kpi.weight,
        weighting: String(kpi.weight),
        wt: String(kpi.weight),
        baseline: kpi.baseline,
        annualTarget: kpi.annualTarget,
        target: kpi.annualTarget,
        q1Target: kpi.q1Target,
        q2Target: kpi.q2Target,
        q3Target: kpi.q3Target,
        q4Target: kpi.q4Target,
        poe: existing.poe || kpi.poe,
        budgetAllocated: kpi.budgetAllocated,
        budget: kpi.budgetAllocated,
        q1Applicable: kpi.q1Applicable,
        q2Applicable: kpi.q2Applicable,
        q3Applicable: kpi.q3Applicable,
        q4Applicable: kpi.q4Applicable,
        lockedQuarters: kpi.q1Applicable ? [] : ['Q1'],
        kpa: kpi.kpaName,
        strategicGoal: kpi.kpaName,
        functionalKpa: kpi.kpaName,
        // Preserve all user evaluation data across quarters
        q1Score: existing.q1Score !== undefined ? existing.q1Score : (kpi as any).q1Score,
        q1Actual: existing.q1Actual !== undefined ? existing.q1Actual : (kpi as any).q1Actual,
        q1ActualExpense: existing.q1ActualExpense !== undefined ? existing.q1ActualExpense : (kpi as any).q1ActualExpense,
        q1Comment: existing.q1Comment !== undefined ? existing.q1Comment : (kpi as any).q1Comment,
        q1Corrective: existing.q1Corrective !== undefined ? existing.q1Corrective : (kpi as any).q1Corrective,
        q1Poe: existing.q1Poe !== undefined ? existing.q1Poe : (kpi as any).q1Poe,
        q1PoeDocs: Array.isArray(existing.q1PoeDocs) ? existing.q1PoeDocs : ((kpi as any).q1PoeDocs || []),
        q2PoeDocs: Array.isArray(existing.q2PoeDocs) ? existing.q2PoeDocs : ((kpi as any).q2PoeDocs || []),
        q3PoeDocs: Array.isArray(existing.q3PoeDocs) ? existing.q3PoeDocs : ((kpi as any).q3PoeDocs || []),
        q4PoeDocs: Array.isArray(existing.q4PoeDocs) ? existing.q4PoeDocs : ((kpi as any).q4PoeDocs || []),
        annualPoeDocs: Array.isArray(existing.annualPoeDocs) ? existing.annualPoeDocs : ((kpi as any).annualPoeDocs || []),
        midtermPoeDocs: Array.isArray(existing.midtermPoeDocs) ? existing.midtermPoeDocs : ((kpi as any).midtermPoeDocs || []),
        reviewStatus: existing.reviewStatus || (kpi as any).reviewStatus,
        q1PoeStatus: existing.q1PoeStatus || (kpi as any).q1PoeStatus,
        q2PoeStatus: existing.q2PoeStatus || (kpi as any).q2PoeStatus,
        q3PoeStatus: existing.q3PoeStatus || (kpi as any).q3PoeStatus,
        q4PoeStatus: existing.q4PoeStatus || (kpi as any).q4PoeStatus,
        poeFileName: existing.poeFileName || (kpi as any).poeFileName,
        poeFileBase64: existing.poeFileBase64 || (kpi as any).poeFileBase64,
        myScore: existing.myScore || (kpi as any).myScore,
        // Aliases
        'kpi no': kpi.kpiNo,
        'kpi description': kpi.kpiDescription,
        '%wt': kpi.weight,
        'annual target': kpi.annualTarget,
        '1st qtr target': kpi.q1Target,
        '2nd qtr target': kpi.q2Target,
        '3rd qtr target': kpi.q3Target,
        '4th qtr target': kpi.q4Target,
        'functional kpa': kpi.kpaName
      };
    });
  }

  let result = [...inputKpis];

  // 2. Ms. Mmaphiri Rampedi (rampedimr@nkangaladm.gov.za)
  if (isMmaphiriRampedi(normEmail)) {
    result = result.map(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || '').toString().toLowerCase();

      // Lock KPI M_03 and M_09 for Quarter 1
      if (ref === 'M_03' || ref === 'M_09' || desc.includes('workplace skills plan') || desc.includes('litigation matters')) {
        return {
          ...kpi,
          q1Applicable: false,
          '1st qtr target': 'N/A',
          q1Target: 'N/A',
          lockedQuarters: Array.from(new Set([...(kpi.lockedQuarters || []), 'Q1', 'q1']))
        };
      }

      // Unlock KPI 2 for Quarter 1
      if (ref === '2' || ref === 'KPI 2' || desc.includes('annual performance agreement')) {
        return {
          ...kpi,
          q1Applicable: true,
          '1st qtr target': '1',
          q1Target: '1',
          lockedQuarters: (kpi.lockedQuarters || []).filter((q: string) => q.toUpperCase() !== 'Q1')
        };
      }

      return kpi;
    });
  }

  // 3. Mr. Thomas P. Mahlangu (mahlangutp@nkangaladm.gov.za)
  if (isThomasMahlangu(normEmail)) {
    result = result.map(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || '').toString().toLowerCase();

      // Unlock KPI 2 for Quarter 1
      if (ref === '2' || ref === 'KPI 2' || desc.includes('annual performance agreement')) {
        return {
          ...kpi,
          q1Applicable: true,
          '1st qtr target': '1',
          q1Target: '1',
          lockedQuarters: (kpi.lockedQuarters || []).filter((q: string) => q.toUpperCase() !== 'Q1')
        };
      }

      return kpi;
    });
  }

  // 4. Mr. Mxolisi Bembe (bembem@nkangaladm.gov.za or BembeM@nkangaladm.gov.za)
  if (isMxolisiBembe(normEmail)) {
    // Remove only Jetpatchers KPIs (Road Maintenance, Monthly Reports, Monthly Meetings) and duplicate stray block
    result = result.filter(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || kpi.id || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      // Remove stray duplicate block
      if (String(kpi.id || '').startsWith('extracted-sync-1787656937604-')) {
        return false;
      }

      // Remove Jetpatchers KPIs
      if (
        (desc.includes('road maintenance') && (desc.includes('submitted to municipal engineer') || desc.includes('jetpatcher'))) ||
        (desc.includes('condition of roads') && desc.includes('submitted on the condition of roads')) ||
        desc.includes('unit monthly meetings attendant for the') ||
        ['KPI 07', 'KPI 08', 'KPI 09', 'KPI 7', 'KPI 8', 'KPI 9'].includes(ref) && desc.includes('road')
      ) {
        return false;
      }
      return true;
    });

    // Ensure all 7 missing official KPIs are present if not already in input
    const missingBembeDefs = [
      {
        id: "extracted-sync-1786838328112-7-m23",
        kpiNo: "M_23",
        kpa: "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
        kpi: "Number of Action Plan on issues raised by the Auditor General tabled to Council by 30 December 2026.",
        weighting: "2",
        baseline: "1",
        annualTarget: "1",
        q1Target: "N/A",
        q2Target: "1",
        q3Target: "N/A",
        q4Target: "N/A",
        poe: "Audit Action Plan and Council resolution",
        annualRequiredPoe: "Audit Action Plan and Council resolution",
        q1Poe: "Audit Action Plan and Council resolution",
        q2Poe: "Audit Action Plan and Council resolution",
        midtermPoe: "Audit Action Plan and Council resolution",
        q3Poe: "Audit Action Plan and Council resolution",
        q4Poe: "Audit Action Plan and Council resolution",
        budget: "OPEX",
        q1Applicable: false,
        q1Locked: true
      },
      {
        id: "extracted-sync-1786838328112-8-m24",
        kpiNo: "M_24",
        kpa: "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
        kpi: "Percentage of AG Findings raised in the Management Letter resolved (Allocated Projects) by 30 June 2027.",
        weighting: "2",
        baseline: "100%",
        annualTarget: "100%",
        q1Target: "N/A",
        q2Target: "N/A",
        q3Target: "40%",
        q4Target: "100%",
        poe: "Signed Progress Report on the Implementation of the Audit Action Plan.",
        annualRequiredPoe: "Signed Progress Report on the Implementation of the Audit Action Plan.",
        q1Poe: "Signed Progress Report on the Implementation of the Audit Action Plan.",
        q2Poe: "Signed Progress Report on the Implementation of the Audit Action Plan.",
        midtermPoe: "Signed Progress Report on the Implementation of the Audit Action Plan.",
        q3Poe: "Signed Progress Report on the Implementation of the Audit Action Plan.",
        q4Poe: "Signed Progress Report on the Implementation of the Audit Action Plan.",
        budget: "OPEX",
        q1Applicable: false,
        q1Locked: true
      },
      {
        id: "extracted-sync-1786838328112-9-m36",
        kpiNo: "M_36",
        kpa: "KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION",
        kpi: "Percentage of strategic lekgotla resolutions implemented by 30 June 2027. (Technical Services Dept.)",
        weighting: "2",
        baseline: "100%",
        annualTarget: "100%",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        poe: "Signed Strategic Lekgotla monitoring report",
        annualRequiredPoe: "Signed Strategic Lekgotla monitoring report",
        q1Poe: "Signed Strategic Lekgotla monitoring report",
        q2Poe: "Signed Strategic Lekgotla monitoring report",
        midtermPoe: "Signed Strategic Lekgotla monitoring report",
        q3Poe: "Signed Strategic Lekgotla monitoring report",
        q4Poe: "Signed Strategic Lekgotla monitoring report",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786838328112-26-m67",
        kpiNo: "M_67",
        kpa: "KPA 4: BASIC SERVICE DELIVERY AND INFRASTRUCTURE:",
        kpi: "Total m2 of potholes patched on municipal roads by 30 June 2027",
        weighting: "15",
        baseline: "New",
        annualTarget: "4000 m2",
        q1Target: "1000 m2",
        q2Target: "1000 m2",
        q3Target: "1000 m2",
        q4Target: "1000 m2",
        poe: "Signed Quarterly reports",
        annualRequiredPoe: "Signed Quarterly reports",
        q1Poe: "Signed Quarterly reports",
        q2Poe: "Signed Quarterly reports",
        midtermPoe: "Signed Quarterly reports",
        q3Poe: "Signed Quarterly reports",
        q4Poe: "Signed Quarterly reports",
        budget: "R1 413 328",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786838328112-31-p07",
        kpiNo: "P_07",
        kpa: "KPA 4: BASIC SERVICE DELIVERY AND INFRASTRUCTURE:",
        kpi: "Refurbishment & Upgrading Delmas WWTW by 30 June 2027",
        weighting: "15",
        baseline: "Stage 3: Implementation Stage (100%): Construction Progress",
        annualTarget: "Stage 3: Implementation Stage (100%): Construction Progress",
        q1Target: "Stage 3: Implementation Stage (90%): Construction Progress",
        q2Target: "Stage 3: Implementation Stage (95%): Construction Progress",
        q3Target: "Stage 3: Implementation Stage (98%): Construction Progress Report",
        q4Target: "Stage 3: Implementation Stage (100%): Construction Progress Completion Certificate",
        poe: "Signed Construction Progress Report and completion certificate",
        annualRequiredPoe: "Signed Construction Progress Report and completion certificate",
        q1Poe: "Signed Construction Progress Report and completion certificate",
        q2Poe: "Signed Construction Progress Report and completion certificate",
        midtermPoe: "Signed Construction Progress Report and completion certificate",
        q3Poe: "Signed Construction Progress Report and completion certificate",
        q4Poe: "Signed Construction Progress Report and completion certificate",
        budget: "R 12 732 860.00",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786838328112-32-p08",
        kpiNo: "P_08",
        kpa: "KPA 4: BASIC SERVICE DELIVERY AND INFRASTRUCTURE:",
        kpi: "Refurbishment of Emalahleni Bulk Water Infrastructure by 30 June 2027",
        weighting: "2",
        baseline: "Stage 3: Implementation Stage (100%): Construction Progress",
        annualTarget: "Stage 3: Implementation Stage (100%): Construction Progress",
        q1Target: "Stage 3: Implementation Stage (40%): Construction Progress",
        q2Target: "Stage 3: Implementation Stage (45%): Construction Progress",
        q3Target: "Stage 3: Implementation Stage (65%): Construction Progress",
        q4Target: "Stage 3: Implementation Stage (100%): Construction Progress",
        poe: "Signed construction progress report and Completion Certificate",
        annualRequiredPoe: "Signed construction progress report and Completion Certificate",
        q1Poe: "Signed construction progress report and Completion Certificate",
        q2Poe: "Signed construction progress report and Completion Certificate",
        midtermPoe: "Signed construction progress report and Completion Certificate",
        q3Poe: "Signed construction progress report and Completion Certificate",
        q4Poe: "Signed construction progress report and Completion Certificate",
        budget: "R 47 619 047",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786838328112-33-p09",
        kpiNo: "P_09",
        kpa: "KPA 4: BASIC SERVICE DELIVERY AND INFRASTRUCTURE:",
        kpi: "Loskop Regional Bulk Water Supply: WP1 by 30 June 2027",
        weighting: "2",
        baseline: "Stage 3: Implementation Stage (100%): Construction Progress",
        annualTarget: "Stage 3: Implementation Stage (100%): Construction Progress",
        q1Target: "Stage 3: Implementation Stage (80%): Construction Progress",
        q2Target: "Stage 3: Implementation Stage (90%): Construction Progress",
        q3Target: "Stage 3: Implementation Stage (100%): Construction Progress",
        q4Target: "N/A",
        poe: "Signed construction progress report and Completion Certificate",
        annualRequiredPoe: "Signed construction progress report and Completion Certificate",
        q1Poe: "Signed construction progress report and Completion Certificate",
        q2Poe: "Signed construction progress report and Completion Certificate",
        midtermPoe: "Signed construction progress report and Completion Certificate",
        q3Poe: "Signed construction progress report and Completion Certificate",
        q4Poe: "Signed construction progress report and Completion Certificate",
        budget: "R 213 500",
        q1Applicable: true,
        q1Locked: false
      }
    ];

    for (const def of missingBembeDefs) {
      const exists = result.some(k => (k.kpiNo && String(k.kpiNo).toUpperCase() === def.kpiNo) || (k.kpi && k.kpi.toLowerCase() === def.kpi.toLowerCase()));
      if (!exists) {
        result.push(def);
      }
    }
  }

  // 5. Ms. Kgaogelo Molefe (molefeki@nkangaladm.gov.za) - Remove KPI 25, 26, 27, 28
  if (normEmail === 'molefeki@nkangaladm.gov.za' || normEmail.includes('molefe')) {
    result = result.filter(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim().toUpperCase();
      const isUnwanted = ['25', '26', '27', '28', 'KPI 25', 'KPI 26', 'KPI 27', 'KPI 28', 'KPI_25', 'KPI_26', 'KPI_27', 'KPI_28'].includes(ref);
      return !isUnwanted;
    });
  }

  // 6. Mr. David Emmanuel Mahlangu (mahlangude@nkangaladm.gov.za) - Signed 2026/2027 PA (24 KPIs, 100% total weight, remove HR vacancy KPI 25)
  if (normEmail === 'mahlangude@nkangaladm.gov.za' || normEmail.includes('mahlangude')) {
    const officialMahlanguKpis = [
      { kpiNo: '1', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Attain clean audit opinion by 31 December 2026.', weighting: '1', baseline: '1 (Unqualified with matters)', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: 'AG’s Audit Report', q1Locked: true, q1Applicable: false },
      { kpiNo: '2', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026', weighting: '1', baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '3', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of self-assessment reports compiled and submitted to Supervisor per quarter.', weighting: '1', baseline: '4', annualTarget: '4', q1Target: '1 (annual assessment)', q2Target: '1 (Q1 assessment)', q3Target: '1 (midyear assessment)', q4Target: '1 (Q3 assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '4', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026', weighting: '1', baseline: '1', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '5', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services' },
      { kpiNo: '6', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of weekly itineraries compiled and submitted to Supervisor for approval per quarter in Dr JS Moroka Local Municipality.', weighting: '3', baseline: '52', annualTarget: '52', q1Target: '13', q2Target: '13', q3Target: '13', q4Target: '13', poe: 'Signed weekly itineraries.' },
      { kpiNo: '7', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of municipal Health Services monthly reports submitted to Supervisor quarterly in Dr JS Moroka Local Municipality.', weighting: '3', baseline: '12', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Signed monthly reports' },
      { kpiNo: '8', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of spot fines issued per quarter in Dr J.S Moroka Local Municipality.', weighting: '1', baseline: '12', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Spot fine copies.' },
      { kpiNo: '9', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of Internal Audit Findings resolved per quarter as per Audit Plan in Dr JS Moroka Local Municipality.', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Internal audit quarterly reports' },
      { kpiNo: '10', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Operational Risks Identified in Dr JS Moroka Local Municipality per quarter.', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Operational Risk quarterly reports' },
      { kpiNo: '11', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Fraud and corruption Risks Identified in Dr JS Moroka Local Municipality per quarter.', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Fraud and corruption risk quarterly reports' },
      { kpiNo: '12', kpa: 'KPA 2: FOOD CONTROL AND SAFETY', kpi: 'Number of food handling and preparation facilities inspections conducted in terms of the Foodstuffs, Cosmetics, Disinfectant Act (FCDA) per quarter in Dr JS Moroka Local Municipality.', weighting: '10', baseline: '181', annualTarget: '180', q1Target: '45', q2Target: '45', q3Target: '45', q4Target: '45', poe: 'Listing and inspection reports' },
      { kpiNo: '13', kpa: 'KPA 2: FOOD CONTROL AND SAFETY', kpi: 'Number of food samples taken per quarter in Dr JS Moroka Local Municipality.', weighting: '10', baseline: '16', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Listing and Food Sampling sheets' },
      { kpiNo: '14', kpa: 'KPA 3: WATER QUALITY MONITORING', kpi: 'Number of water samples taken per quarter and send to Laboratory for analysis as per SANS 241 Standard in Dr JS Moroka Local municipality.', weighting: '20', baseline: '92', annualTarget: '92', q1Target: '23', q2Target: '23', q3Target: '23', q4Target: '23', poe: 'Listing and water Sampling sheets' },
      { kpiNo: '16', kpa: 'KPA 4: WASTE MANAGEMENT', kpi: 'Number of inspections conducted at illegal dumping hot spots per quarter in Dr JS Moroka Local Municipality.', weighting: '10', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Listing and inspections reports' },
      { kpiNo: '17', kpa: 'KPA 4: WASTE MANAGEMENT', kpi: 'Number of inspections conducted at Health Care Waste Generators (private clinics, dentist, veterinary clinics, pharmacies, doctors) per quarter in Dr JS Moroka Local Municipality.', weighting: '5', baseline: '16', annualTarget: '16', q1Target: '4', q2Target: '4', q3Target: '4', q4Target: '4', poe: 'Listing and Inspections reports' },
      { kpiNo: '18', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: 'Number of inspections conducted at (day care centres, crèches and preschools) per quarter in Dr JS Moroka Local Municipality.', weighting: '5', baseline: '37', annualTarget: '37', q1Target: '10', q2Target: '9', q3Target: '9', q4Target: '9', poe: 'Listing and inspections reports' },
      { kpiNo: '19', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: 'Number of inspections conducted at funeral undertakers and mortuaries per quarter in Dr JS Moroka Local Municipality.', weighting: '4', baseline: '12', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Listing and inspections reports' },
      { kpiNo: '20', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: 'Number of inspections conducted at Public Institutions/ Community facilities e.g. old age homes, disabled centres per quarter in Dr JS Moroka Local Municipality.', weighting: '2', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Listing and inspections reports' },
      { kpiNo: '21', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: 'Number of inspections conducted at government and private schools, colleges and/or boarding schools per quarter in Dr JS Moroka Local Municipality.', weighting: '2', baseline: '18', annualTarget: '18', q1Target: '5', q2Target: '5', q3Target: '4', q4Target: '4', poe: 'Listing and inspections reports' },
      { kpiNo: '22', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: 'Number of inspections conducted at Accommodation facilities e.g. hotels, guest houses etc per quarter in Dr JS Moroka Local Municipality.', weighting: '2', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Listing and inspections reports' },
      { kpiNo: '23', kpa: 'KPA 6: EDUCATION AND AWARENESS', kpi: 'Number of Community based awareness campaigns attended by 30 June 2027 with team Dr JS Moroka Local Municipality representation in Nkangala District Municipality.', weighting: '5', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Attendance register.' },
      { kpiNo: '24', kpa: 'KPA 6: EDUCATION AND AWARENESS', kpi: 'Number of joint operations conducted per quarter in Dr JS Moroka Local Municipality.', weighting: '5', baseline: '10', annualTarget: '10', q1Target: '3', q2Target: '2', q3Target: '3', q4Target: '2', poe: 'Reports and Attendance registers' },
      { kpiNo: '25', kpa: 'KPA 6: EDUCATION AND AWARENESS', kpi: 'Number of education and training conducted per quarter in Dr JS Moroka Local Municipality.', weighting: '5', baseline: '10', annualTarget: '10', q1Target: '3', q2Target: '2', q3Target: '3', q4Target: '2', poe: 'Reports and Attendance registers' }
    ];

    result = officialMahlanguKpis.map((def, idx) => {
      const targetId = `mahlangude-official-kpi-${idx + 1}`;
      const existing =
        result.find(ex => String(ex?.id || '') === targetId) ||
        result.find(ex => String(ex?.kpiNo || ex?.['kpi no'] || '').trim().toUpperCase() === def.kpiNo.toUpperCase()) ||
        result.find((_ex, exIdx) => exIdx === idx);
      const base = existing ? { ...existing } : {};
      const allQtrPoe = `Q1: ${def.poe}\nQ2: ${def.poe}\nQ3: ${def.poe}\nQ4: ${def.poe}`;

      // Strip the cloned KPI 16 Illegal Dumping POE (poe_doc_Q1_1792747168095_u5mj33fz2 / 'Illegal dumping listing and inspection reports.pdf')
      // that bled onto KPIs 17 to 22 (array indices 15 to 20, kpiNo '17' to '22')
      const isKpi17To22 = ['17', '18', '19', '20', '21', '22'].includes(def.kpiNo);
      const rawDocs = Array.isArray(base.q1PoeDocs) ? base.q1PoeDocs : [];
      const hadClonedIllegalDumpingDoc = isKpi17To22 && rawDocs.some(
        (d: any) =>
          d?.id === 'poe_doc_Q1_1792747168095_u5mj33fz2' ||
          String(d?.name || '').toLowerCase().includes('illegal dumping listing')
      );
      const cleanQ1PoeDocs = isKpi17To22
        ? rawDocs.filter(
            (d: any) =>
              d?.id !== 'poe_doc_Q1_1792747168095_u5mj33fz2' &&
              !String(d?.name || '').toLowerCase().includes('illegal dumping listing')
          )
        : rawDocs;

      // If this row in KPIs 17-22 only had the cloned Illegal Dumping POE and no genuine POE of its own, reset its cloned actual/score/status
      const shouldResetClonedFields = isKpi17To22 && hadClonedIllegalDumpingDoc && cleanQ1PoeDocs.length === 0;
      const cleanQ1Actual = shouldResetClonedFields ? '' : (base.q1Actual || '');
      const cleanQ1Score = shouldResetClonedFields ? '' : (base.q1Score || '');
      const cleanMyScore = shouldResetClonedFields ? '' : (base.myScore || '');
      const cleanPoeFileName = shouldResetClonedFields
        ? ''
        : (cleanQ1PoeDocs[0]?.name || (isKpi17To22 && String(base.poeFileName || '').toLowerCase().includes('illegal dumping') ? '' : base.poeFileName));
      const cleanReviewStatus = shouldResetClonedFields
        ? 'Draft'
        : (base.reviewStatus || (cleanQ1Actual || cleanQ1PoeDocs.length > 0 ? 'Submitted for Approval' : undefined));
      const cleanReviewApprovalStatus = shouldResetClonedFields ? '' : base.reviewApprovalStatus;
      const cleanQ1PoeStatus = shouldResetClonedFields ? 'Draft' : base.q1PoeStatus;

      return {
        ...base,
        id: targetId,
        kpiNo: def.kpiNo,
        'kpi no': def.kpiNo,
        kpa: def.kpa,
        functionalKpa: def.kpa,
        kpi: def.kpi,
        indicator: def.kpi,
        description: def.kpi,
        'kpi description': def.kpi,
        weighting: def.weighting,
        weight: def.weighting,
        '%wt': def.weighting,
        baseline: def.baseline,
        annualTarget: def.annualTarget,
        'annual target': def.annualTarget,
        q1Target: def.q1Target,
        q2Target: def.q2Target,
        q3Target: def.q3Target,
        q4Target: def.q4Target,
        poe: allQtrPoe,
        annualRequiredPoe: def.poe,
        q1Poe: def.poe,
        q2Poe: def.poe,
        midtermPoe: def.poe,
        q3Poe: def.poe,
        q4Poe: def.poe,
        budget: 'OPEX',
        q1Locked: def.q1Locked ?? false,
        q1Applicable: def.q1Applicable ?? true,
        reviewStatus: cleanReviewStatus,
        reviewApprovalStatus: cleanReviewApprovalStatus,
        q1PoeStatus: cleanQ1PoeStatus,
        q1Actual: cleanQ1Actual,
        actual: shouldResetClonedFields ? '' : base.actual,
        actualAchieved: shouldResetClonedFields ? '' : base.actualAchieved,
        q1Score: cleanQ1Score,
        myScore: cleanMyScore,
        poeFileName: cleanPoeFileName,
        q1PoeDocs: cleanQ1PoeDocs
      };
    });
  }

  // 7. Mr. Joseph Lebisi (lebisij@nkangaladm.gov.za) & Annual Performance Evaluation KPIs (due 29 August 2026)
  if (normEmail === 'lebisij@nkangaladm.gov.za' || normEmail.includes('lebisi')) {
    result = result.map(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || kpi.id || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      // Unlock KPI 4 / Annual Performance Evaluation KPI for Q1
      if (ref === '4' || ref === 'KPI 4' || ref === 'KPI_4' || desc.includes('annual performance evaluation') || desc.includes('29 august 2026')) {
        return {
          ...kpi,
          q1Applicable: true,
          q1Locked: false,
          '1st qtr target': '1 (annual assessment)',
          q1Target: '1 (annual assessment)',
          lockedQuarters: (kpi.lockedQuarters || []).filter((q: string) => q.toUpperCase() !== 'Q1')
        };
      }
      return kpi;
    });
  }

  // 8. Ms. Noluthando Mbulawa (mbulawan@nkangaladm.gov.za) - Remove vacancy rate and vacancy position KPIs (KPI 26, KPI 27)
  if (normEmail === 'mbulawan@nkangaladm.gov.za' || normEmail.includes('mbulawan')) {
    result = result.filter(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || kpi.id || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      const isVacancyKpi = ['26', '27', 'KPI 26', 'KPI 27', 'KPI_26', 'KPI_27'].includes(ref) || 
                           desc.includes('vacancy rate') || 
                           desc.includes('vacant posts') || 
                           desc.includes('vacancy position');
      return !isVacancyKpi;
    });
  }

  // 9. Mr. Sbusiso Skosana (SkosanaST@nkangaladm.gov.za) - Lock KPI M_21 ("Attain clean audit") for Quarter 1
  if (normEmail === 'skosanast@nkangaladm.gov.za' || normEmail.includes('skosanast')) {
    result = result.map(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || kpi.id || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      if (ref === 'M_21' || ref === 'M-21' || desc.includes('clean audit')) {
        return {
          ...kpi,
          kpiNo: 'M_21',
          q1Target: 'N/A',
          q1Locked: true,
          q1Applicable: false,
          '1st qtr target': 'N/A',
          lockedQuarters: Array.from(new Set([...(kpi.lockedQuarters || []), 'Q1', 'q1']))
        };
      }
      return kpi;
    });
  }

  // 10. Ms. Lungelo Portia Mpanza (mpanzal@nkangaladm.gov.za) - Reconcile exact 25 official THLM EHP KPIs from signed 2026/2027 PA
  if (normEmail === 'mpanzal@nkangaladm.gov.za' || normEmail.includes('mpanzal')) {
    const officialMpanzaKpis = [
      { kpiNo: 'M_21', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Attain clean audit opinion by 31 December 2026.', weighting: '2', baseline: '1 (Unqualified with matters)', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: 'AG’s Audit Report', q1Locked: true, q1Applicable: false },
      { kpiNo: '2', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026.', weighting: '3', baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '3', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of self-assessment reports compiled and submitted to Supervisor per quarter.', weighting: '3', baseline: '2', annualTarget: '4', q1Target: '1 (Q1 assessment)', q2Target: '1 (midyear assessment)', q3Target: '1 (Q3 assessment)', q4Target: '1 (annual assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '4', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026.', weighting: '2', baseline: '1', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '5', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027.', weighting: '2', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services' },
      { kpiNo: '6', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: '# of monthly consolidated municipal Health Services reports submitted to Chief EHP before the 28th of every month.', weighting: '4', baseline: '12', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Monthly reports' },
      { kpiNo: '7', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: '# of weekly itinerary compiled and submitted to CEHP', weighting: '5', baseline: '52', annualTarget: '52', q1Target: '13', q2Target: '13', q3Target: '13', q4Target: '13', poe: 'Weekly programme' },
      { kpiNo: '8', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: '% of Internal Audit Recommendations implemented per quarter.', weighting: '3', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Internal audit quarterly reports' },
      { kpiNo: '9', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: '% of action plans implemented to address Operational Risks identified per quarter.', weighting: '3', baseline: '95%', annualTarget: '98%', q1Target: '98%', q2Target: '98%', q3Target: '98%', q4Target: '98%', poe: 'Operational Risk quarterly reports' },
      { kpiNo: '10', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: '% of action plans implemented to address Fraud and corruption Risks identified per quarter.', weighting: '3', baseline: '94%', annualTarget: '96%', q1Target: '96%', q2Target: '96%', q3Target: '96%', q4Target: '96%', poe: 'Fraud and corruption risk quarterly reports' },
      { kpiNo: '11', kpa: 'KPA 2: LAW ENFORCEMENT', kpi: '# of spot fines issued in THLM per quarter', weighting: '5', baseline: '12', annualTarget: '12', q1Target: '03', q2Target: '03', q3Target: '03', q4Target: '03', poe: 'Spot fine copies only' },
      { kpiNo: '12', kpa: 'KPA 3: FOOD CONTROL', kpi: 'Number of food handling and preparation facilities inspected for compliance per quarter at THLM by 30 June 2027.', weighting: '5', baseline: '180', annualTarget: '180', q1Target: '45', q2Target: '45', q3Target: '45', q4Target: '45', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '13', kpa: 'KPA 3: FOOD CONTROL', kpi: 'Number of food samples taken per annum', weighting: '5', baseline: '11', annualTarget: '11', q1Target: '03', q2Target: '03', q3Target: '03', q4Target: '02', poe: 'Sampling schedule and Lab Sampling sheets (MHS THLM)' },
      { kpiNo: '14', kpa: 'KPA 4: WATER QUALITY MONITORING', kpi: 'Number of water samples taken per quarter from the THLM Water Reticulation, water sources, boreholes and treatment works to monitor water quality by 30 June 2027.', weighting: '5', baseline: '80', annualTarget: '80', q1Target: '20', q2Target: '20', q3Target: '20', q4Target: '20', poe: 'Water sampling sheets and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '15', kpa: 'KPA 5: HEALTH SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Waste Management Facilities, Landfill sites and illegal dumping sites per quarter in THLM by 30 June 2027.', weighting: '5', baseline: '15', annualTarget: '15', q1Target: '03', q2Target: '04', q3Target: '04', q4Target: '04', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '16', kpa: 'KPA 5: HEALTH SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Health Care Waste Generators per quarter in THLM by 30 June 2027.', weighting: '5', baseline: '14', annualTarget: '14', q1Target: '03', q2Target: '04', q3Target: '04', q4Target: '03', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '17', kpa: 'KPA 5: HEALTH SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Day care/crèches/ECDS in THLM per quarter by 30 June 2027.', weighting: '2', baseline: '43', annualTarget: '36', q1Target: '09', q2Target: '09', q3Target: '09', q4Target: '09', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '18', kpa: 'KPA 5: HEALTH SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at funeral undertakers premises, mortuaries per quarter in THLM by 30 June 2027.', weighting: '4', baseline: '13', annualTarget: '13', q1Target: '03', q2Target: '04', q3Target: '03', q4Target: '03', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '19', kpa: 'KPA 5: HEALTH SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Public Institutions, Old age homes per quarter in THLM by 30 June 2027.', weighting: '4', baseline: '04', annualTarget: '04', q1Target: '01', q2Target: '01', q3Target: '01', q4Target: '01', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '20', kpa: 'KPA 5: HEALTH SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Government and private schools per quarter in THLM by 30 June 2027.', weighting: '3', baseline: '20', annualTarget: '20', q1Target: '05', q2Target: '05', q3Target: '05', q4Target: '05', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '21', kpa: 'KPA 5: HEALTH SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Accommodation facilities, hotels per quarter in THLM by 30 June 2027.', weighting: '4', baseline: '06', annualTarget: '06', q1Target: '02', q2Target: '01', q3Target: '01', q4Target: '02', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '22', kpa: 'KPA 5: HEALTH SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Chemical Safety premises per quarter in THLM by 30 June 2027.', weighting: '3', baseline: '06', annualTarget: '06', q1Target: '02', q2Target: '02', q3Target: '01', q4Target: '01', poe: 'Inspection reports and Listing Spreadsheet (MHS THLM)' },
      { kpiNo: '23', kpa: 'KPA 6: ENVIRONMENTAL HEALTH EDUCATION AND AWARENESS', kpi: '# of Community based awareness campaigns attended by 30 June 2027.', weighting: '6', baseline: '05', annualTarget: '04', q1Target: '01', q2Target: '01', q3Target: '01', q4Target: '01', poe: 'Attendance registers (MHS THLM)' },
      { kpiNo: '24', kpa: 'KPA 6: ENVIRONMENTAL HEALTH EDUCATION AND AWARENESS', kpi: '# of municipal Health Services and Environmental Management joint operations per quarter by 30 June 2027.', weighting: '2', baseline: '13', annualTarget: '11', q1Target: '03', q2Target: '02', q3Target: '03', q4Target: '03', poe: 'Reports and Attendance registers (MHS THLM)' },
      { kpiNo: '25', kpa: 'KPA 6: ENVIRONMENTAL HEALTH EDUCATION AND AWARENESS', kpi: '# of municipal Health Services education and training sessions conducted at premises by 30 June 2027.', weighting: '2', baseline: '20', annualTarget: '14', q1Target: '04', q2Target: '03', q3Target: '04', q4Target: '03', poe: 'Reports and Attendance registers (MHS THLM)' }
    ];

    result = officialMpanzaKpis.map((def, idx) => {
      // Find matching existing item strictly by index or unique ID
      const existing = result.find((ex, exIdx) => {
        if (ex.id === `mpanzal-official-kpi-${idx + 1}`) return true;
        if (exIdx === idx) return true;
        return false;
      });
      const base = existing ? { ...existing } : {};
      const allQtrPoe = `Q1: ${def.poe}\nQ2: ${def.poe}\nQ3: ${def.poe}\nQ4: ${def.poe}`;
      
      // Prevent bleed of duplicate actuals/POEs from the shared mpanzal-official-kpi-15 ID
      const hasBleedDuplicate = idx > 14 && idx !== 22 && base.id === 'mpanzal-official-kpi-15';
      const cleanQ1Actual = hasBleedDuplicate ? '' : (base.q1Actual || '');
      const cleanQ1PoeDocs = hasBleedDuplicate ? [] : (Array.isArray(base.q1PoeDocs) ? base.q1PoeDocs : []);
      const cleanReviewStatus = cleanQ1Actual || cleanQ1PoeDocs.length > 0 ? (base.reviewStatus || 'Submitted for Approval') : undefined;

      return {
        ...base,
        id: `mpanzal-official-kpi-${idx + 1}`,
        kpiNo: def.kpiNo,
        'kpi no': def.kpiNo,
        kpa: def.kpa,
        functionalKpa: def.kpa,
        kpi: def.kpi,
        indicator: def.kpi,
        description: def.kpi,
        'kpi description': def.kpi,
        weighting: def.weighting,
        weight: def.weighting,
        '%wt': def.weighting,
        baseline: def.baseline,
        annualTarget: def.annualTarget,
        'annual target': def.annualTarget,
        q1Target: def.q1Target,
        '1st qtr target': def.q1Target,
        q2Target: def.q2Target,
        '2nd qtr target': def.q2Target,
        q3Target: def.q3Target,
        '3rd qtr target': def.q3Target,
        q4Target: def.q4Target,
        '4th qtr target': def.q4Target,
        poe: allQtrPoe,
        annualRequiredPoe: def.poe,
        q1Poe: def.poe,
        q2Poe: def.poe,
        midtermPoe: def.poe,
        q3Poe: def.poe,
        q4Poe: def.poe,
        budget: 'OPEX',
        q1Locked: def.q1Locked ?? false,
        q1Applicable: def.q1Applicable ?? true,
        reviewStatus: cleanReviewStatus,
        reviewApprovalStatus: hasBleedDuplicate ? undefined : base.reviewApprovalStatus,
        q1PoeStatus: hasBleedDuplicate ? undefined : base.q1PoeStatus,
        q1Actual: cleanQ1Actual,
        q1PoeDocs: cleanQ1PoeDocs
      };
    });
  }

  // 11. Mr. Alfred Shupeng Magampe (magampeas@nkangaladm.gov.za) - Remove KPI 31+ (strictly 30 KPIs), KPI 29 POE = Listings and Attendance Register, replace STLM with THLM in POEs
  if (normEmail === 'magampeas@nkangaladm.gov.za' || normEmail.includes('magampe')) {
    result = result.filter((kpi, index) => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim().toUpperCase();
      const numVal = parseInt(ref.replace(/[^0-9]/g, ''), 10);
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();
      if (
        desc.includes('staff vacancy rate') ||
        desc.includes('vacant posts filled') ||
        desc.includes('workplace skills plan') ||
        desc.includes('previously disadvantaged') ||
        desc.includes('suspended officials') ||
        desc.includes('active suspensions') ||
        desc.includes('declared their financial interests')
      ) {
        return false;
      }
      if (!isNaN(numVal) && numVal >= 31 && ref !== 'M_21') return false;
      if (index >= 30) return false;
      return true;
    }).map((kpi, index) => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim();
      const isKpi29 = ref === '29' || index === 28;
      const fixStlmToThlm = (str: any) => {
        if (typeof str !== 'string') return str;
        return str.replace(/\bSTLM\b/g, 'THLM').replace(/Steve Tshwete Local Municipality/gi, 'Thembisile Hani Local Municipality').replace(/Steve Tshwete/gi, 'Thembisile Hani');
      };
      const updated: any = {
        ...kpi,
        poe: fixStlmToThlm(kpi.poe),
        annualRequiredPoe: fixStlmToThlm(kpi.annualRequiredPoe),
        q1Poe: fixStlmToThlm(kpi.q1Poe),
        q2Poe: fixStlmToThlm(kpi.q2Poe),
        midtermPoe: fixStlmToThlm(kpi.midtermPoe),
        q3Poe: fixStlmToThlm(kpi.q3Poe),
        q4Poe: fixStlmToThlm(kpi.q4Poe)
      };
      if (isKpi29) {
        const kpi29Poe = 'Listings and Attendance Register';
        updated.poe = `Q1: ${kpi29Poe}\nQ2: ${kpi29Poe}\nQ3: ${kpi29Poe}\nQ4: ${kpi29Poe}`;
        updated.annualRequiredPoe = kpi29Poe;
        updated.q1Poe = kpi29Poe;
        updated.q2Poe = kpi29Poe;
        updated.midtermPoe = kpi29Poe;
        updated.q3Poe = kpi29Poe;
        updated.q4Poe = kpi29Poe;
      }
      return updated;
    });
  }

  // 12a. Mr. Prince M. Mthimunye (mthimunyepm@nkangaladm.gov.za) - Signed 2026/2027 PA (Exact 23 KPIs, 100% total weight)
  if (normEmail === 'mthimunyepm@nkangaladm.gov.za' || normEmail.includes('mthimunyepm')) {
    const officialMthimunyeKpis = [
      { kpiNo: '1', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Attain clean audit opinion by 31 December 2026.', weighting: '6', baseline: '1 (Unqualified with matters)', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: 'AG’s Audit Report', q1Locked: true, q1Applicable: false },
      { kpiNo: '2', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026', weighting: '1', baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '3', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of self-assessment reports compiled and submitted to Supervisor per quarter.', weighting: '1', baseline: '4', annualTarget: '4', q1Target: '1 (annual assessment)', q2Target: '1 (Q1 assessment)', q3Target: '1 (midyear assessment)', q4Target: '1 (Q3 assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '4', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026', weighting: '1', baseline: '1', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '5', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services' },
      { kpiNo: '6', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of monthly municipal Health Services reports submitted to the CHEP per month.', weighting: '1', baseline: '12', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Monthly reports' },
      { kpiNo: '7', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of spot fines/compliance notices issued in Dr J.SM LM per annum', weighting: '1', baseline: '06', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Spot fine/compliance notice copies only' },
      { kpiNo: '8', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: '% of Internal Audit Findings resolved per quarter as per the Audit Plan (MHS Dr JSM Local Municipality) per quarter', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Internal audit quarterly reports' },
      { kpiNo: '9', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: '% of action plans implemented to address Operational Risks Identified (MHS Dr JSM Local Municipality) per quarter', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Operational Risk quarterly reports' },
      { kpiNo: '10', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: '% of action plans implemented to address Fraud and corruption Risks Identified (MHS LM) per quarter', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Fraud and corruption risk quarterly reports' },
      { kpiNo: '11', kpa: 'KPA 2: FOOD CONTROL AND SAFETY', kpi: 'Number of food handling and preparation facility inspections conducted in terms of the Foodstuffs, Cosmetics, Disinfectant Act (FCDA) per quarter for MHS Dr JSM', weighting: '5', baseline: '182', annualTarget: '180', q1Target: '45', q2Target: '45', q3Target: '45', q4Target: '45', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '12', kpa: 'KPA 2: FOOD CONTROL AND SAFETY', kpi: 'Number of food samples taken per annum', weighting: '15', baseline: '20', annualTarget: '13', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '4', poe: 'Lab Sampling sheets' },
      { kpiNo: '13', kpa: 'KPA 3: WATER QUALITY MONITORING', kpi: 'Number of water samples taken per quarter from the Dr JSM participating municipality, analysed as per the SANS 241 standard per quarter', weighting: '5', baseline: '92', annualTarget: '92', q1Target: '23', q2Target: '23', q3Target: '23', q4Target: '23', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '14', kpa: 'KPA 4: WASTE MANAGEMENT', kpi: '# of municipal health services inspections conducted at Landfill sites/ transfer stations/ illegal dumping hot spots per quarter', weighting: '25', baseline: '5', annualTarget: '5', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '2', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '15', kpa: 'KPA 4: WASTE MANAGEMENT', kpi: '# of municipal health services inspections conducted at Health Care Waste Generators (private clinics, dentist, veterinary clinics, pharmacies, doctors) per bi-annually', weighting: '5', baseline: '12', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '16', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at day care centres, crèches or preschools (ECDS) per annum', weighting: '2', baseline: '36', annualTarget: '36', q1Target: '9', q2Target: '9', q3Target: '9', q4Target: '9', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '17', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at funeral undertakers and mortuaries per quarter', weighting: '2', baseline: '8', annualTarget: '8', q1Target: '2', q2Target: '2', q3Target: '2', q4Target: '2', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '18', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Public Institutions/ Community facilities e.g. Old age, disabled centres per annum', weighting: '2', baseline: '14', annualTarget: '12', q1Target: '2', q2Target: '2', q3Target: '2', q4Target: '2', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '19', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at government and private schools, colleges and/or boarding schools per annum', weighting: '2', baseline: '15', annualTarget: '15', q1Target: '4', q2Target: '3', q3Target: '4', q4Target: '4', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '20', kpa: 'KPA 5: SURVEILLANCE OF PREMISES', kpi: '# of municipal health services inspections conducted at Accommodation facilities eg. hotels, guest houses etc. per annum', weighting: '2', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'reports and Listing Spread sheets' },
      { kpiNo: '21', kpa: 'KPA 6: EDUCATION AND AWARENESS', kpi: '# of Community based awareness campaigns attended by 30 June 2027 with team Dr JSM presentation.', weighting: '2', baseline: '5', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Attendance registers only (MHS Dr JSM representation)' },
      { kpiNo: '22', kpa: 'KPA 6: EDUCATION AND AWARENESS', kpi: '# of municipal Health Services and Environmental Management joint operations programmes conducted per quarter with team Dr JSM representation.', weighting: '9', baseline: '16', annualTarget: '10', q1Target: '3', q2Target: '2', q3Target: '3', q4Target: '2', poe: 'Attendance registers (MHS Dr JSM representation)' },
      { kpiNo: '23', kpa: 'KPA 6: EDUCATION AND AWARENESS', kpi: '# of municipal Health Services education and training facilitated in Dr J.S.M per quarter with Dr JSM team representation.', weighting: '9', baseline: '13', annualTarget: '10', q1Target: '3', q2Target: '2', q3Target: '3', q4Target: '2', poe: 'Attendance registers (MHS Dr JSM representation)' }
    ];

    result = officialMthimunyeKpis.map((def, idx) => {
      const existing = result.find((ex, exIdx) => {
        if (ex.id === `mthimunyepm-official-kpi-${idx + 1}`) return true;
        if (exIdx === idx) return true;
        const exNo = String(ex.kpiNo || ex['kpi no'] || '').trim().toUpperCase();
        if (exNo === def.kpiNo.toUpperCase()) return true;
        return false;
      });
      const base = existing ? { ...existing } : {};
      const allQtrPoe = `Q1: ${def.poe}\nQ2: ${def.poe}\nQ3: ${def.poe}\nQ4: ${def.poe}`;
      return {
        ...base,
        id: `mthimunyepm-official-kpi-${idx + 1}`,
        kpiNo: def.kpiNo,
        'kpi no': def.kpiNo,
        kpa: def.kpa,
        functionalKpa: def.kpa,
        kpi: def.kpi,
        indicator: def.kpi,
        description: def.kpi,
        'kpi description': def.kpi,
        weighting: def.weighting,
        weight: def.weighting,
        '%wt': def.weighting,
        baseline: def.baseline,
        annualTarget: def.annualTarget,
        'annual target': def.annualTarget,
        q1Target: def.q1Target,
        q2Target: def.q2Target,
        q3Target: def.q3Target,
        q4Target: def.q4Target,
        poe: allQtrPoe,
        annualRequiredPoe: def.poe,
        q1Poe: def.poe,
        q2Poe: def.poe,
        midtermPoe: def.poe,
        q3Poe: def.poe,
        q4Poe: def.poe,
        budget: def.kpiNo === '13' ? 'R 2 000 (total NDM budget)' : (def.kpiNo === '21' ? 'R500 000 (Total CDS budget)' : (def.kpiNo === '12' ? 'R 110 (Total NDM budget)' : 'OPEX')),
        q1Locked: def.q1Locked ?? false,
        q1Applicable: def.q1Applicable ?? true,
        reviewStatus: base.reviewStatus || (base.q1Actual || (Array.isArray(base.q1PoeDocs) && base.q1PoeDocs.length > 0) ? 'Submitted for Approval' : undefined),
        reviewApprovalStatus: base.reviewApprovalStatus,
        q1PoeStatus: base.q1PoeStatus,
        q1Actual: base.q1Actual,
        q1PoeDocs: Array.isArray(base.q1PoeDocs) ? base.q1PoeDocs : []
      };
    });
  }

  // 12b. Mr. Vinny Lehlohonolo Maphoto (maphotovl@nkangaladm.gov.za) - Signed 2026/2027 PA (Strictly 12 KPIs, 100% total weight, remove HR KPIs 13-16)
  if (normEmail === 'maphotovl@nkangaladm.gov.za' || normEmail.includes('maphotovl')) {
    const officialMaphotoKpis = [
      { kpiNo: '1', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Maintain clean audit opinion by 30 December 2026', weighting: '5', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'AG’s Audit Report', q1Locked: true, q1Applicable: false },
      { kpiNo: '2', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Compile and sign the annual performance agreement for the 2025/2026 financial year and submit to OPME & PMDS unit by 30 July 2027', weighting: '5', baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '3', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Number of self-assessment reports compiled and submitted to Supervisor per quarter.', weighting: '5', baseline: '3', annualTarget: '4', q1Target: '1 (annual assessment)', q2Target: '1 (Q1 assessment)', q3Target: '1 (midyear assessment)', q4Target: '1 (Q3 assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '4', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026', weighting: '5', baseline: '1', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit' },
      { kpiNo: '5', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', weighting: '5', baseline: 'New', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services' },
      { kpiNo: '6', kpa: 'KPA 2: MEETING AND ADMINISTRATION', kpi: 'Number of Youth development Forum conducted by 30 June 2027', weighting: '5', baseline: '1', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Operational expenditure signed progress report' },
      { kpiNo: '7', kpa: 'KPA 3: AWARENESS CAMPAIGNS', kpi: 'Number of awareness campaigns on teenage pregnancy undertaken by 30 June 2027', weighting: '13', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Attendance registers and signed reports (proving number of awareness campaigns)' },
      { kpiNo: '8', kpa: 'KPA 3: AWARENESS CAMPAIGNS', kpi: 'Number of campaigns on drug / substance abuse held in partnership with SANCA by 30 June 2027', weighting: '14', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Attendance registers and signed reports (proving number of awareness campaigns)' },
      { kpiNo: '9', kpa: 'KPA 4: EDUCATIONAL CAREER EXPOS', kpi: 'Number of Education Career Expos held by 30 June 2027', weighting: '15', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Attendance registers and signed reports (proving of number of education career expos held)' },
      { kpiNo: '10', kpa: 'KPA 5: YOUTH DEVELOPMENT AND MANAGEMENT', kpi: 'Mayoral Academic Recognition of NDM Learners held by 30 June 2027', weighting: '10', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Attendance registers and signed report' },
      { kpiNo: '11', kpa: 'KPA 5: YOUTH DEVELOPMENT AND MANAGEMENT', kpi: 'Number of existing qualifying learners identified by 30 June 2027', weighting: '10', baseline: '25', annualTarget: '15', q1Target: 'N/A', q2Target: 'N/A', q3Target: '15', q4Target: 'N/A', poe: 'Bursary offer letters, academic transcript and progress signed reports of existing qualifying learners' },
      { kpiNo: '12', kpa: 'KPA 5: YOUTH DEVELOPMENT AND MANAGEMENT', kpi: 'Number of new qualifying learners identified by 31 March 2027', weighting: '8', baseline: '13', annualTarget: '7', q1Target: 'N/A', q2Target: 'N/A', q3Target: '7', q4Target: 'N/A', poe: 'Bursary offer letters, proof of registration, and signed Progress report on new qualifying learners' }
    ];

    result = officialMaphotoKpis.map((def, idx) => {
      const existing = result.find((ex, exIdx) => {
        if (ex.id === `maphotovl-official-kpi-${idx + 1}`) return true;
        if (exIdx === idx) return true;
        const exNo = String(ex.kpiNo || ex['kpi no'] || '').trim().toUpperCase();
        if (exNo === def.kpiNo.toUpperCase()) return true;
        return false;
      });
      const base = existing ? { ...existing } : {};
      const allQtrPoe = `Q1: ${def.poe}\nQ2: ${def.poe}\nQ3: ${def.poe}\nQ4: ${def.poe}`;
      return {
        ...base,
        id: `maphotovl-official-kpi-${idx + 1}`,
        kpiNo: def.kpiNo,
        'kpi no': def.kpiNo,
        kpa: def.kpa,
        functionalKpa: def.kpa,
        kpi: def.kpi,
        indicator: def.kpi,
        description: def.kpi,
        'kpi description': def.kpi,
        weighting: def.weighting,
        weight: def.weighting,
        '%wt': def.weighting,
        baseline: def.baseline,
        annualTarget: def.annualTarget,
        'annual target': def.annualTarget,
        q1Target: def.q1Target,
        q2Target: def.q2Target,
        q3Target: def.q3Target,
        q4Target: def.q4Target,
        poe: allQtrPoe,
        annualRequiredPoe: def.poe,
        q1Poe: def.poe,
        q2Poe: def.poe,
        midtermPoe: def.poe,
        q3Poe: def.poe,
        q4Poe: def.poe,
        budget: def.kpiNo === '7' || def.kpiNo === '8' ? 'R15' : (def.kpiNo === '9' ? 'R44' : (def.kpiNo === '10' ? 'R118' : (def.kpiNo === '11' || def.kpiNo === '12' ? 'R5000' : 'OPEX'))),
        q1Locked: def.q1Locked ?? false,
        q1Applicable: def.q1Applicable ?? true,
        reviewStatus: base.reviewStatus || (base.q1Actual || (Array.isArray(base.q1PoeDocs) && base.q1PoeDocs.length > 0) ? 'Submitted for Approval' : undefined),
        reviewApprovalStatus: base.reviewApprovalStatus,
        q1PoeStatus: base.q1PoeStatus,
        q1Actual: base.q1Actual,
        q1PoeDocs: Array.isArray(base.q1PoeDocs) ? base.q1PoeDocs : []
      };
    });
  }

  // 12c. Sindiso Moepi (moepis@nkangaladm.gov.za) and Mathapelo Mankopana (mankopanamm@nkangaladm.gov.za)
  if (
    normEmail === 'moepis@nkangaladm.gov.za' ||
    normEmail.includes('moepis') ||
    normEmail === 'mankopanamm@nkangaladm.gov.za' ||
    normEmail.includes('mankopana')
  ) {
    result = result.filter((kpi, index) => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim().toUpperCase();
      const numVal = parseInt(ref.replace(/[^0-9]/g, ''), 10);
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();
      if (
        desc.includes('staff vacancy rate') ||
        desc.includes('vacant posts filled') ||
        desc.includes('workplace skills plan') ||
        desc.includes('previously disadvantaged') ||
        desc.includes('suspended officials') ||
        desc.includes('active suspensions') ||
        desc.includes('declared their financial interests') ||
        desc.startsWith('achieve target deliverable kpi-')
      ) {
        return false;
      }
      if (!isNaN(numVal) && numVal >= 25 && ref !== 'M_21') return false;
      if (index >= 24) return false;
      return true;
    });
  }

  // 13. Mr. Mark Ephraim Maseko (masekome@nkangaladm.gov.za)
  if (normEmail === 'masekome@nkangaladm.gov.za' || normEmail.includes('masekome')) {
    // Collect any POE files attached to KPI 1 ("Maintain clean audit opinion") or KPA 1 KPI 6 ("informal performance evaluation")
    let misplacedPoeDocs: any[] = [];
    let bathoPelePoeDocs: any[] = [];
    result.forEach((kpi, index) => {
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();
      if (index === 0 || desc.includes('clean audit opinion')) {
        if (Array.isArray(kpi.q1PoeDocs) && kpi.q1PoeDocs.length > 0) {
          misplacedPoeDocs = [...kpi.q1PoeDocs];
        }
      }
      if (index === 5 || desc.includes('informal performance evaluation conducted with all subordinates')) {
        if (Array.isArray(kpi.q1PoeDocs) && kpi.q1PoeDocs.length > 0) {
          bathoPelePoeDocs = [...kpi.q1PoeDocs];
        }
      }
    });

    const hrPlanDocs = misplacedPoeDocs.filter(d => (d.name || '').toLowerCase().includes('hr plan'));
    const vacancyDocs = misplacedPoeDocs.filter(d => (d.name || '').toLowerCase().includes('vacancy'));

    result = result.map((kpi, index) => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim();
      const kpaStr = (kpi.kpa || '').toString().toLowerCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      // Clean Audit KPI (Index 0 / Maintain Clean Audit)
      if (index === 0 || desc.includes('clean audit opinion')) {
        return {
          ...kpi,
          q1Target: 'N/A',
          '1st qtr target': 'N/A',
          q1Locked: true,
          q1Applicable: false,
          q1PoeStatus: 'N/A',
          reviewStatus: 'N/A',
          reviewApprovalStatus: '',
          q1Actual: '',
          q1Poe: 'AG’s Audit Report',
          poe: 'AG’s Audit Report',
          q1PoeDocs: [],
          poeDocs: [],
          poeFileName: '',
          q1Score: ''
        };
      }

      // Unlock KPA 1 KPI 5 ("Submission of 2024/2025 Annual performance evaluation on E-PMS by 29 August 2026") for Quarter 1
      if (
        index === 4 ||
        (ref === '5' && (desc.includes('annual performance evaluation') || desc.includes('29 august'))) ||
        desc.includes('annual performance evaluation on e-pms')
      ) {
        return {
          ...kpi,
          q1Applicable: true,
          q1Locked: false,
          q1Target: '1 (annual assessment)',
          '1st qtr target': '1 (annual assessment)',
          lockedQuarters: (kpi.lockedQuarters || []).filter((q: string) => q.toUpperCase() !== 'Q1')
        };
      }

      // Lock KPA 1 KPI 6 ("Number of informal performance evaluation conducted with all subordinates per quarter") for Quarter 1 and clear duplicated Q1 actuals/POEs
      if (
        index === 5 ||
        String(kpi.id || '') === 'ipp-kpi-1790668545717-6' ||
        desc.includes('informal performance evaluation conducted with all subordinates')
      ) {
        return {
          ...kpi,
          q1Target: 'N/A',
          '1st qtr target': 'N/A',
          q2Target: kpi.q2Target && kpi.q2Target !== 'N/A' ? kpi.q2Target : '1 (Q1)',
          q3Target: 'N/A',
          q4Target: kpi.q4Target && kpi.q4Target !== 'N/A' ? kpi.q4Target : '1 (Q3)',
          q1Locked: true,
          q1Applicable: false,
          q1Actual: '',
          actual: '',
          actualAchieved: '',
          q1Score: '',
          managerScore: '',
          review: '',
          reviewStatus: 'N/A',
          reviewApprovalStatus: '',
          q1PoeStatus: 'N/A',
          q1PoeDocs: [],
          poeDocs: [],
          poeFileName: '',
          resubmittedAt: '',
          resubmissionUnlocked: false,
          lockedQuarters: ['Q1', 'q1', 'Q3', 'q3']
        };
      }

      // Lock KPA 3 KPI 5 ("Number of reports on the maintenance of the Organisational Structure by 30 June 2027") for Quarter 1 (only applicable in Q4)
      if (
        index === 12 ||
        String(kpi.id || '') === 'ipp-kpi-1790668545717-13' ||
        desc.includes('maintenance of the organisational structure')
      ) {
        return {
          ...kpi,
          q1Target: 'N/A',
          '1st qtr target': 'N/A',
          q2Target: 'N/A',
          q3Target: 'N/A',
          q4Target: '1',
          q1Locked: true,
          q1Applicable: false,
          reviewStatus: 'N/A',
          reviewApprovalStatus: '',
          q1PoeStatus: 'N/A',
          lockedQuarters: ['Q1', 'q1', 'Q2', 'q2', 'Q3', 'q3']
        };
      }

      // Preserve KPA 3 KPI 6 ("Number of Batho Pele Local Committee Meetings Coordinated") with its Q1 actuals, score, and Batho Pele POE files
      if (
        index === 13 ||
        String(kpi.id || '') === 'ipp-kpi-1790668545717-14' ||
        (kpaStr.includes('kpa 3') && ref === '6') ||
        desc.includes('batho pele local committee meetings')
      ) {
        const existingDocs = Array.isArray(kpi.q1PoeDocs) ? kpi.q1PoeDocs : [];
        const mergedDocs = Array.from(new Map([...existingDocs, ...bathoPelePoeDocs].map(d => [d.id || d.name, d])).values());
        return {
          ...kpi,
          q1Target: '1',
          '1st qtr target': '1',
          q1Locked: false,
          q1Applicable: true,
          q1Actual: kpi.q1Actual || '1',
          q1Score: kpi.q1Score || '3',
          q1PoeDocs: mergedDocs,
          poeFileName: mergedDocs[0]?.name || kpi.poeFileName
        };
      }

      // HR Plan KPI (Index 8: "HR plan developed and submitted to GM CS by 30 September 2026")
      if (index === 8 || desc.includes('hr plan developed')) {
        const existingDocs = Array.isArray(kpi.q1PoeDocs) ? kpi.q1PoeDocs : [];
        const mergedDocs = Array.from(new Map([...existingDocs, ...hrPlanDocs].map(d => [d.id || d.name, d])).values());
        return {
          ...kpi,
          q1PoeDocs: mergedDocs,
          poeFileName: mergedDocs[0]?.name || kpi.poeFileName
        };
      }

      // Vacancy Reports KPI (Index 14: "Number of vacant positions coordinated and facilitated for filling as per approved organogram")
      if (index === 14 || desc.includes('vacant positions coordinated')) {
        const existingDocs = Array.isArray(kpi.q1PoeDocs) ? kpi.q1PoeDocs : [];
        const mergedDocs = Array.from(new Map([...existingDocs, ...vacancyDocs].map(d => [d.id || d.name, d])).values());
        return {
          ...kpi,
          q1PoeDocs: mergedDocs,
          poeFileName: mergedDocs[0]?.name || kpi.poeFileName
        };
      }

      return kpi;
    });
  }

  // 14. Mr. Richard Dumisani Hleza (hlezard@nkangaladm.gov.za) - Full 27-KPI Scorecard from signed 2026/2027 Performance Agreement (Chief of Staff)
  if (normEmail === 'hlezard@nkangaladm.gov.za' || normEmail.includes('hlezard')) {
    const isVipProtectionTeamPlan = result.some((k: any) => {
      const d = String(k.kpiDescription || k['kpi description'] || k.kpi || k.description || '').toLowerCase();
      return d.includes('vehicle safety inspections') || d.includes('fuel garage card') || d.includes('advanced security assessment');
    });

    if (!isVipProtectionTeamPlan) {
      const hlezaCanonical27 = [
        { kpiNo: 'M_11', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '70', annualTarget: '70', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '70', poe: 'Report to Council and Council Resolution(s)', budget: 'OPEX', kpi: 'Number of new/reviewed policies approved by Council by 30 June 2027', matchKey: 'new/reviewed policies approved by council' },
        { kpiNo: 'M_15', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '90', annualTarget: '90%', q1Target: '90%', q2Target: '90%', q3Target: '90%', q4Target: '90%', poe: 'Strategic Risk Report', budget: 'OPEX', kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (Office of the Executive Mayor)', matchKey: 'strategic risks identified' },
        { kpiNo: 'M_16', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '98', annualTarget: '98%', q1Target: '98%', q2Target: '98%', q3Target: '98%', q4Target: '98%', poe: 'Signed Quarterly Operational Risk report', budget: 'OPEX', kpi: 'Percentage of action plans implemented to address Operational Risks Identified per quarter (Office of the Executive Mayor)', matchKey: 'operational risks identified' },
        { kpiNo: 'M_17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '96', annualTarget: '96%', q1Target: '96%', q2Target: '96%', q3Target: '96%', q4Target: '96%', poe: 'Signed Quarterly Fraud and corruption Risk report', budget: 'OPEX', kpi: 'Percentage of action plans implemented to address Fraud and corruption Risks Identified per quarter (Office of the Executive Mayor)', matchKey: 'fraud and corruption risks identified' },
        { kpiNo: 'M_21', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '1 (Unqualified with matters)', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: "AG's Audit Report", budget: 'OPEX', kpi: 'Attain clean audit opinion by 31 December 2026.', matchKey: 'clean audit opinion' },
        { kpiNo: 'M_22', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '1', annualTarget: '≤ 0', q1Target: 'N/A', q2Target: '≤ 0', q3Target: 'N/A', q4Target: 'N/A', poe: "AG's Audit Report", budget: 'OPEX', kpi: 'Number of repeat audit findings (circular 88) by 30 December 2026.', matchKey: 'repeat audit findings' },
        { kpiNo: 'M_23', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'Audit Action Plan and Council resolution', budget: 'OPEX', kpi: 'Number of Action Plan on issues raised by the Auditor General tabled to Council by 30 December 2026.', matchKey: 'action plan on issues raised by the auditor general' },
        { kpiNo: 'M_24', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '100%', annualTarget: '100%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '40%', q4Target: '100%', poe: 'Signed Progress Report on the Implementation of the Audit Action Plan.', budget: 'OPEX', kpi: 'Percentage of AG Findings raised in the Management Letter resolved by 30 June 2027. (Office of the Executive Mayor)', matchKey: 'ag findings raised in the management letter' },
        { kpiNo: 'M_36', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '100', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Strategic Lekgotla monitoring report', budget: 'OPEX', kpi: 'Percentage of strategic lekgotla resolutions implemented by 30 June 2027. (Office of the Executive Mayor)', matchKey: 'strategic lekgotla resolutions' },
        { kpiNo: 'M_37', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Quarterly Reports and Council Resolution.', budget: 'OPEX', kpi: 'Number of reports on Council Resolutions submitted to Council per quarter (Office of the Executive Mayor)', matchKey: 'reports on council resolutions submitted to council' },
        { kpiNo: 'M_40', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '100', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly IA report', budget: 'OPEX', kpi: 'Percentage of internal audit recommendations implemented by 30 June 2027. (Office of the Executive Mayor)', matchKey: 'internal audit recommendations implemented' },
        { kpiNo: 'M_41', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '100', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Audit committee resolution register', budget: 'OPEX', kpi: 'Percentage of audit committee resolutions implemented by 30 June 2027. (Office of the Executive Mayor)', matchKey: 'audit committee resolutions implemented' },
        { kpiNo: '13', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026.', matchKey: 'compile and sign the annual performance agreement' },
        { kpiNo: '14', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '4', annualTarget: '4', q1Target: '4', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX', kpi: 'Number of performance agreements signed with subordinates and submitted to OPME & PMDS unit for the 2026/2027 financial year by 30 July 2026.', matchKey: 'performance agreements signed with subordinates' },
        { kpiNo: '15', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '4', annualTarget: '4', q1Target: '1 (annual assessment)', q2Target: '1 (Q1 assessment)', q3Target: '1 (midyear assessment)', q4Target: '1 (Q3 assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS unit', budget: 'OPEX', kpi: 'Number of self-assessment report compiled and submitted to Supervisor per quarter.', matchKey: 'self-assessment report' },
        { kpiNo: '16', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '1', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026.', matchKey: 'annual performance evaluation on e-pms' },
        { kpiNo: '17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Compliance certificate from corporate services', budget: 'OPEX', kpi: 'Number of quarterly leave reconciliation report submitted to Departmental General Manager (within 30 days after end of each quarter)', matchKey: 'leave reconciliation report submitted to departmental general manager' },
        { kpiNo: '18', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services', budget: 'OPEX', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', matchKey: 'leave requests captured on the system' },
        { kpiNo: '19', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services', budget: 'OPEX', kpi: 'Percentage of leave approvals processed within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', matchKey: 'leave approvals processed within the prescribed timeframes' },
        { kpiNo: '20', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', weight: 1, baseline: 'New', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Compliance Certificate issued by HRM&D Unit.', budget: 'OPEX', kpi: 'Number of departmental Training Needs Analysis submitted (TNA) by 30 March 2027', matchKey: 'training needs analysis submitted' },
        { kpiNo: 'M_53', kpa: 'KPA 2: FINANCIAL VIABILITY', weight: 20, baseline: '90%', annualTarget: '90%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: '90%', poe: 'Signed Operational Expenditure progress report', budget: 'R', kpi: 'Percentage of operational budget actually spent (circular 88) by 30 June 2027.', matchKey: 'operational budget actually spent' },
        { kpiNo: '22', kpa: 'KPA 3: RESEARCH AND SPEECH WRITING', weight: 20, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed acknowledgement or email of sent to EM', budget: 'Opex', kpi: "Percentage of the Executive Mayor's speeches developed and submitted to the EM by 30 June 2027", matchKey: 'speeches developed and submitted' },
        { kpiNo: 'M-31', kpa: 'KPA 4: ADMINISTRATION FUNCTIONS', weight: 5, baseline: '12', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Public participation report', budget: 'Opex', kpi: 'Number of public participation meeting held by June 2027', matchKey: 'public participation meeting held' },
        { kpiNo: '24', kpa: 'KPA 4: ADMINISTRATION FUNCTIONS', weight: 5, baseline: '3', annualTarget: '3', q1Target: '1 (AFS)', q2Target: 'N/A', q3Target: '1 (adjusted SDBIP)', q4Target: '1(SDBIP)', poe: 'Foreword as proof of submission', budget: 'Opex', kpi: 'Number of Foreword compiled and submitted (PMS & Finance) by June 2027.', matchKey: 'foreword compiled and submitted' },
        { kpiNo: '25', kpa: 'KPA 4: ADMINISTRATION FUNCTIONS', weight: 5, baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Invitations Attendance registers', budget: 'Opex', kpi: "Number of Co-ordinated Mayor's Forum Meetings conducted by June 2027", matchKey: "mayor's forum meetings conducted" },
        { kpiNo: '26', kpa: 'KPA 4: ADMINISTRATION FUNCTIONS', weight: 5, baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Compliance certificate from Corporate Services', budget: 'Opex', kpi: 'Number of quarterly leave reconciliation report submitted to the General Manager/ Corporate Services [thirty days after end of quarter]', matchKey: 'leave reconciliation report submitted to the general manager/ corporate services' },
        { kpiNo: '27', kpa: "KPA 5: EXECUTIVE MAYOR'S SERVICE DELIVERY", weight: 20, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Letter of notifications to municipalities', budget: 'R 1 413 328,00', kpi: 'Percentage monitoring of Mayoral Service Delivery Road Infrastructure Programme by June 2027', matchKey: 'mayoral service delivery road infrastructure programme' }
      ];

      result = hlezaCanonical27.map((canon, idx) => {
        // Match existing item by description substring or kpiNo, or fallback to old 9-item positional index (0..8) when safe
        let existing = result.find((it: any) => {
          const d = String(it.kpiDescription || it['kpi description'] || it.kpi || it.description || '').toLowerCase();
          return d.includes(canon.matchKey);
        });
        if (!existing && idx < 9 && result.length === 9 && idx === 0) {
          // Old row 0 was M_11 overwritten by M_21
          existing = result[0];
        }
        const isQ1Na = canon.q1Target.toUpperCase() === 'N/A';
        const isQ2Na = canon.q2Target.toUpperCase() === 'N/A';
        const isQ3Na = canon.q3Target.toUpperCase() === 'N/A';
        const isQ4Na = canon.q4Target.toUpperCase() === 'N/A';
        const hasQ1Evidence = Boolean(
          existing &&
          !isQ1Na &&
          ((existing.q1Actual && String(existing.q1Actual).trim() !== '' && String(existing.q1Actual).trim().toUpperCase() !== 'N/A') ||
            (Array.isArray(existing.q1PoeDocs) && existing.q1PoeDocs.length > 0))
        );
        return {
          ...(existing || {}),
          id: existing?.id || `team-ipp-kpi-1790604123780-${idx + 1}`,
          kpiNo: canon.kpiNo,
          'kpi no': canon.kpiNo,
          kpa: canon.kpa,
          functionalKpa: canon.kpa,
          'functional kpa': canon.kpa,
          kpi: canon.kpi,
          description: canon.kpi,
          kpiDescription: canon.kpi,
          'kpi description': canon.kpi,
          indicator: canon.kpi,
          weight: canon.weight,
          weighting: String(canon.weight),
          '%wt': String(canon.weight),
          baseline: canon.baseline,
          'baseline 2025/26': canon.baseline,
          annualTarget: canon.annualTarget,
          'annual target': canon.annualTarget,
          q1Target: canon.q1Target,
          '1st qtr target': canon.q1Target,
          q2Target: canon.q2Target,
          '2nd qtr target': canon.q2Target,
          q3Target: canon.q3Target,
          '3rd qtr target': canon.q3Target,
          q4Target: canon.q4Target,
          '4th qtr target': canon.q4Target,
          poe: `Q1: ${canon.poe}\nQ2: ${canon.poe}\nQ3: ${canon.poe}\nQ4: ${canon.poe}`,
          annualRequiredPoe: canon.poe,
          q1Poe: canon.poe,
          q2Poe: canon.poe,
          midtermPoe: canon.poe,
          q3Poe: canon.poe,
          q4Poe: canon.poe,
          budget: canon.budget,
          q1Locked: isQ1Na,
          q2Locked: isQ2Na,
          q3Locked: isQ3Na,
          q4Locked: isQ4Na,
          q1Applicable: !isQ1Na,
          q1Actual: isQ1Na ? '' : (existing?.q1Actual || ''),
          q1PoeDocs: isQ1Na ? [] : (Array.isArray(existing?.q1PoeDocs) ? existing.q1PoeDocs : []),
          reviewStatus: isQ1Na ? 'N/A' : (hasQ1Evidence ? (existing?.reviewStatus || 'Submitted for Approval') : (existing?.reviewStatus && existing.reviewStatus !== 'N/A' ? existing.reviewStatus : 'Draft')),
          q1PoeStatus: isQ1Na ? 'N/A' : (hasQ1Evidence ? (existing?.q1PoeStatus || 'Pending Verification') : 'Draft')
        };
      });
    }
  }

  // 14b. Control Room Disaster Team (MpofuHD@nkangaladm.gov.za & 7 Control Operators + CDS Team 1 Control Room) - Strictly 11 KPIs from signed 2026/2027 Control Room PA
  const controlRoomOperatorPrefixes = ['mpofuhd', 'maditsipc', 'nhlabathise', 'miggelss', 'vallaa', 'khumalomd', 'sibekops', 'mashiloanedt', 'selobamc', 'seleshoatj'];
  const isControlRoomTeamScope =
    normEmail === 'dept_team_cds_team_1' ||
    controlRoomOperatorPrefixes.some(p => normEmail === `${p}@nkangaladm.gov.za` || normEmail.startsWith(`${p}@`));
  if (isControlRoomTeamScope) {
    const controlRoomCanonical11 = [
      { kpiNo: 'M_22', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 5, baseline: '1 (Unqualified with matters)', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: "AG's Audit Report", budget: 'OPEX', kpi: 'Attain clean audit opinion by 31 December 2026.', matchKey: 'clean audit opinion' },
      { kpiNo: '2', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 5, baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit', budget: 'OPEX', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2027', matchKey: 'compile and sign the annual performance agreement' },
      { kpiNo: '3', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 5, baseline: '3', annualTarget: '4', q1Target: '1 (annual assessment)', q2Target: '1 (Q1 assessment)', q3Target: '1 (midyear assessment)', q4Target: '1 (Q3 assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS Unit', budget: 'OPEX', kpi: 'Number of self-assessment reports compiled and submitted to Supervisor per quarter.', matchKey: 'self-assessment reports compiled' },
      { kpiNo: '4', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 5, baseline: '2', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit', budget: 'OPEX', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026', matchKey: 'annual performance evaluation on e-pms' },
      { kpiNo: '5', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 15, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services', budget: 'OPEX', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', matchKey: 'leave requests captured on the system' },
      { kpiNo: '6', kpa: 'KPA 2: COMMUNICATION SYSTEM MAINTANANCE', weight: 10, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'disaster', budget: 'OPEX', kpi: '% of the incumbents ability to operate the disaster management center system and duties e.g.take emergency calls,ensuring accurate recording of incident and contact details of the caller', matchKey: 'operate the disaster management center system' },
      { kpiNo: '7', kpa: 'KPA 2: COMMUNICATION SYSTEM MAINTANANCE', weight: 10, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Disaster radio test report', budget: 'OPEX', kpi: '% of communication radio system test conducted by the incumbent with THLM AND DRJA FIRE STATION BY 30 JUNE 2027', matchKey: 'communication radio system test' },
      { kpiNo: '8', kpa: 'KPA 3: CALL CENTER OPERATIONS', weight: 10, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Occurrence book', budget: 'OPEX', kpi: '% of incoming calls taken with the required response time by 30 june 2027', matchKey: 'incoming calls taken with the required response time' },
      { kpiNo: '9', kpa: 'KPA 3: CALL CENTER OPERATIONS', weight: 10, baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Disaster management system report nature of incidents', budget: 'OPEX', kpi: '% of incumbents ability to evaluate the nature of the emergency by 30 june 2027', matchKey: 'evaluate the nature of the emergency' },
      { kpiNo: '10', kpa: 'KPA 4: INFORMATION MANAGEMENT', weight: 10, baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Disaster management report(nature of the incident colum)', budget: 'OPEX', kpi: 'Number of quarterly reports of accidents and emergency calls and incidents records and other related duties,submitted by 30 june 2027', matchKey: 'reports of accidents and emergency calls' },
      { kpiNo: '11', kpa: 'KPA 5: AWERENESS CAMPAIGNS', weight: 15, baseline: '4', annualTarget: '1', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Quarterly Report', budget: 'OPEX', kpi: 'Number of disaster risk reduction awareness campaigns conducted by 30 june 2027', matchKey: 'disaster risk reduction awareness campaigns' }
    ];

    result = controlRoomCanonical11.map((canon, idx) => {
      // Only match existing items whose indicator text matches this Control Room KPI (never copy PMS KPI 6..17 data)
      const existing = result.find((it: any) => {
        const d = String(it.kpiDescription || it['kpi description'] || it.kpi || it.description || '').toLowerCase();
        return d.includes(canon.matchKey);
      });
      const isQ1Na = canon.q1Target.toUpperCase() === 'N/A';
      const isQ2Na = canon.q2Target.toUpperCase() === 'N/A';
      const isQ3Na = canon.q3Target.toUpperCase() === 'N/A';
      const isQ4Na = canon.q4Target.toUpperCase() === 'N/A';
      const hasReportedEvidence = !isQ1Na && Boolean(
        (existing?.q1Actual && String(existing.q1Actual).trim() !== '' && String(existing.q1Actual).trim().toUpperCase() !== 'N/A') ||
        (Array.isArray(existing?.q1PoeDocs) && existing.q1PoeDocs.length > 0)
      );
      return {
        ...(existing || {}),
        id: `team-ipp-kpi-1790760159082-${idx + 1}`,
        kpiNo: canon.kpiNo,
        'kpi no': canon.kpiNo,
        kpa: canon.kpa,
        functionalKpa: canon.kpa,
        'functional kpa': canon.kpa,
        kpi: canon.kpi,
        description: canon.kpi,
        kpiDescription: canon.kpi,
        'kpi description': canon.kpi,
        indicator: canon.kpi,
        weight: canon.weight,
        weighting: String(canon.weight),
        '%wt': String(canon.weight),
        baseline: canon.baseline,
        'baseline 2025/26': canon.baseline,
        annualTarget: canon.annualTarget,
        'annual target': canon.annualTarget,
        q1Target: canon.q1Target,
        '1st qtr target': canon.q1Target,
        q2Target: canon.q2Target,
        '2nd qtr target': canon.q2Target,
        q3Target: canon.q3Target,
        '3rd qtr target': canon.q3Target,
        q4Target: canon.q4Target,
        '4th qtr target': canon.q4Target,
        poe: `Q1: ${canon.poe}\nQ2: ${canon.poe}\nQ3: ${canon.poe}\nQ4: ${canon.poe}`,
        annualRequiredPoe: canon.poe,
        q1Poe: canon.poe,
        q2Poe: canon.poe,
        midtermPoe: canon.poe,
        q3Poe: canon.poe,
        q4Poe: canon.poe,
        budget: canon.budget,
        q1Locked: isQ1Na,
        q2Locked: isQ2Na,
        q3Locked: isQ3Na,
        q4Locked: isQ4Na,
        q1Applicable: !isQ1Na,
        q1Actual: isQ1Na ? '' : (existing?.q1Actual || ''),
        q1PoeDocs: isQ1Na ? [] : (Array.isArray(existing?.q1PoeDocs) ? existing.q1PoeDocs : []),
        reviewStatus: isQ1Na
          ? 'N/A'
          : (!hasReportedEvidence
              ? 'Draft'
              : (existing?.reviewStatus === 'Revision Requested' || (existing?.reviewStatus === 'Approved' && existing?.managerComment)
                  ? existing.reviewStatus
                  : 'Submitted for Approval')),
        reviewApprovalStatus: isQ1Na || !hasReportedEvidence
          ? ''
          : (existing?.reviewStatus === 'Revision Requested'
              ? 'Revision Requested'
              : (existing?.reviewStatus === 'Approved' && existing?.managerComment ? 'Approved' : 'Pending')),
        q1PoeStatus: isQ1Na
          ? 'N/A'
          : (!hasReportedEvidence
              ? 'Draft'
              : (existing?.reviewStatus === 'Approved' && existing?.managerComment ? 'Approved' : 'Pending Verification')),
        manager: 'Sibusiso P.L. Myeni',
        managerEmail: 'myenispl@nkangaladm.gov.za',
        reportTo: 'Sibusiso P.L. Myeni'
      };
    });
  }

  // 15. Clean Audit Opinion KPI (M_21 / M_22: "Attain clean audit opinion by 31 December 2026") is N/A in Quarter 1 (due Q2: 31 Dec 2026)
  result = result.map(kpi => {
    const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();
    const kNo = (kpi.kpiNo || kpi['kpi no'] || kpi.refNum || kpi.id || '').toString().trim().toUpperCase();
    const isCleanAudit = desc.includes('clean audit opinion') || kNo === 'M_21' || kNo === 'M-21';

    if (isCleanAudit) {
      const hasQ2Actual = Boolean(kpi.q2Actual && String(kpi.q2Actual).trim() !== '' && String(kpi.q2Actual).trim().toUpperCase() !== 'N/A');
      const hasUserQ1Poe = Array.isArray(kpi.q1PoeDocs) && kpi.q1PoeDocs.length > 0 && !kpi.q1PoeDocs.some((d: any) => (d.name || '').toLowerCase().includes('hr plan') || (d.name || '').toLowerCase().includes('vacancy'));

      return {
        ...kpi,
        kpiNo: kpi.kpiNo || 'M_21',
        q1Target: 'N/A',
        '1st qtr target': 'N/A',
        q1Locked: true,
        q1Applicable: false,
        q1PoeStatus: 'N/A',
        q1Actual: (hasUserQ1Poe || kpi.q1Actual === 'N/A') ? kpi.q1Actual : '',
        q1Poe: hasUserQ1Poe ? kpi.q1Poe : '',
        poe: hasUserQ1Poe ? kpi.poe : '',
        q1PoeDocs: hasUserQ1Poe ? kpi.q1PoeDocs : [],
        reviewStatus: hasQ2Actual ? kpi.reviewStatus : 'N/A',
        reviewApprovalStatus: hasQ2Actual ? kpi.reviewApprovalStatus : ''
      };
    }
    return kpi;
  });

  // 16. Mr. Mduduzi Anthony Lukhele (lukhelema@nkangaladm.gov.za) - Amended 2026/2027 Performance Agreement:
  // - Remove KPI PMS_D5 (PMS/D/5: "Number of 2026/2027 performance agreements for senior managers developed and drafts submitted to PMS Coordinator")
  // - Amend KPI PMS_D7 (PMS/D/7) from 2026/2027 to 2027/2028 ("Number of 2027/2028 performance agreements for senior managers developed and drafts submitted to PMS Coordinator within 5 days after the approval of 2027/2028 SDBIP")
  // - Adjust the two remaining KPA 4 weights to 15% each (total 30% for KPA 4, 16 KPIs = 100%)
  if (normEmail === 'lukhelema@nkangaladm.gov.za' || normEmail.includes('lukhelema')) {
    result = result.filter(kpi => {
      const kpiNo = (kpi.kpiNo || kpi['kpi no'] || '').toString().trim().toUpperCase().replace(/_/g, '/');
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().trim().toLowerCase();
      const itemId = String(kpi.id || '').trim();
      // Remove old PMS/D/5 (unadjusted 2026/2027 senior manager PAs without 'within 5 days')
      if (
        itemId === 'extracted-sync-1789982958074-10' ||
        (kpiNo === 'PMS/D/5' && !desc.includes('adjusted')) ||
        (desc.includes('2026/2027 performance agreements for senior managers') && !desc.includes('adjusted') && !desc.includes('within 5 days'))
      ) {
        return false;
      }
      return true;
    }).map(kpi => {
      const kpiNo = (kpi.kpiNo || kpi['kpi no'] || '').toString().trim().toUpperCase().replace(/_/g, '/');
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().trim().toLowerCase();
      const itemId = String(kpi.id || '').trim();

      if (itemId === 'extracted-sync-1789982958074-11' || kpiNo === 'PMS/D/6' || desc.includes('adjusted performance agreements for senior managers')) {
        return {
          ...kpi,
          weight: 15,
          weighting: '15',
          '%wt': '15',
          q1Target: 'N/A',
          '1st qtr target': 'N/A',
          q2Target: 'N/A',
          '2nd qtr target': 'N/A',
          q3Target: '6',
          '3rd qtr target': '6',
          q4Target: 'N/A',
          '4th qtr target': 'N/A',
          q1Locked: true,
          q1Applicable: false
        };
      }

      if (
        itemId === 'extracted-sync-1789982958074-12' ||
        kpiNo === 'PMS/D/7' ||
        desc.includes('within 5 days after the approval') ||
        desc.includes('2027/2028 performance agreements for senior managers')
      ) {
        const amendedDesc = 'Number of 2027/2028 performance agreements for senior managers developed and drafts submitted to PMS Coordinator within 5 days after the approval of 2027/2028 SDBIP';
        return {
          ...kpi,
          kpiNo: 'PMS/D/7',
          'kpi no': 'PMS/D/7',
          kpi: amendedDesc,
          description: amendedDesc,
          kpiDescription: amendedDesc,
          'kpi description': amendedDesc,
          indicator: amendedDesc,
          weight: 15,
          weighting: '15',
          '%wt': '15',
          baseline: 'New',
          annualTarget: '6',
          q1Target: 'N/A',
          '1st qtr target': 'N/A',
          q2Target: 'N/A',
          '2nd qtr target': 'N/A',
          q3Target: 'N/A',
          '3rd qtr target': 'N/A',
          q4Target: '6',
          '4th qtr target': '6',
          q1Locked: true,
          q2Locked: true,
          q3Locked: true,
          q4Locked: false,
          q1Applicable: false
        };
      }

      const numWt = Number(kpi.weight || kpi.weighting || kpi['%wt'] || 5) || 5;
      return {
        ...kpi,
        weight: numWt,
        weighting: String(numWt),
        '%wt': String(numWt)
      };
    });
  }

  // 17. Mr. Rachidi Mokgatle (rachidimb@nkangaladm.gov.za) - Lock KPI 22 and KPI 23 for Quarter 1
  if (normEmail === 'rachidimb@nkangaladm.gov.za' || normEmail.includes('rachidimb')) {
    result = result.map((kpi, index) => {
      const kNo = (kpi.kpiNo || kpi['kpi no'] || kpi.refNum || kpi.id || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      const isKpi22Or23 = index === 21 || index === 22 || kNo === '22' || kNo === '23' || desc.includes('prisons and correctional') || desc.includes('chemical handling premises');

      if (isKpi22Or23) {
        return {
          ...kpi,
          q1Target: 'N/A',
          '1st qtr target': 'N/A',
          q1Locked: true,
          q1Applicable: false,
          q1PoeStatus: 'N/A',
          reviewStatus: 'N/A',
          reviewApprovalStatus: '',
          q1Actual: 'N/A',
          lockedQuarters: Array.from(new Set([...(kpi.lockedQuarters || []), 'Q1', 'q1']))
        };
      }
      return kpi;
    });
  }

  // 18. Ms. Lungile Nkosi (nkosiln@nkangaladm.gov.za / nkosilm@nkangaladm.gov.za / nkosil@nkangaladm.gov.za) - Fix KPI 14 from signed 2026/2027 PA
  if (normEmail === 'nkosiln@nkangaladm.gov.za' || normEmail === 'nkosilm@nkangaladm.gov.za' || normEmail === 'nkosil@nkangaladm.gov.za' || normEmail.includes('nkosiln') || normEmail.includes('nkosilm') || (normEmail.includes('nkosil') && !normEmail.includes('nkosilc'))) {
    result = result.map((kpi, index) => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || kpi.id || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      if (ref === '14' || ref === 'KPI 14' || ref === 'KPI_14' || index === 13 || desc.includes('external meetings')) {
        const reqPoe = 'Print out of appointments from outlook or emails';
        return {
          ...kpi,
          kpiNo: '14',
          'kpi no': '14',
          kpi: 'Percentage of meetings facilitated for external meetings by 30 June 2026',
          description: 'Percentage of meetings facilitated for external meetings by 30 June 2026',
          'kpi description': 'Percentage of meetings facilitated for external meetings by 30 June 2026',
          indicator: 'Percentage of meetings facilitated for external meetings by 30 June 2026',
          weighting: '10',
          weight: '10',
          '%wt': '10',
          baseline: 'New',
          annualTarget: '100%',
          'annual target': '100%',
          q1Target: '100%',
          '1st qtr target': '100%',
          q2Target: '100%',
          '2nd qtr target': '100%',
          q3Target: '100%',
          '3rd qtr target': '100%',
          q4Target: '100%',
          '4th qtr target': '100%',
          poe: `Q1: ${reqPoe}\nQ2: ${reqPoe}\nQ3: ${reqPoe}\nQ4: ${reqPoe}`,
          annualRequiredPoe: reqPoe,
          q1Poe: reqPoe,
          q2Poe: reqPoe,
          midtermPoe: reqPoe,
          q3Poe: reqPoe,
          q4Poe: reqPoe,
          budget: 'OPEX',
          q1Applicable: true,
          q1Locked: false
        };
      }
      return kpi;
    });
  }

  // 19. Ms. Dimpho Tlaka (tlakadi@nkangaladm.gov.za / tlakad@nkangaladm.gov.za) - Remove duplicate advertisement KPI (KPI 10/11 duplicate) from signed 2026/2027 PA
  if (normEmail === 'tlakadi@nkangaladm.gov.za' || normEmail === 'tlakad@nkangaladm.gov.za' || normEmail.includes('tlakad') || normEmail.includes('tlaka')) {
    const advertSeen = { count: 0 };
    result = result.filter((kpi) => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || kpi.id || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      const isAdvertKpi = desc.includes('advertisement') || desc.includes('advertisment') || desc.includes('adverts') || (ref === '11' && desc.includes('advert'));
      if (isAdvertKpi) {
        advertSeen.count++;
        if (advertSeen.count > 1) {
          return false; // Remove duplicate entry
        }
      }
      return true;
    });
  }

  // 20. Ms. M.J. Thabang (thabangmj@nkangaladm.gov.za) - Remove duplicate seed templates, preserve submitted items
  if (normEmail === 'thabangmj@nkangaladm.gov.za' || normEmail.includes('thabangmj')) {
    const seenSeedMap = new Map<string, number>();
    result = result.filter((kpi) => {
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();
      if (desc.includes('clean audit opinion') || desc.includes('compile and sign the annual performance agreement')) {
        const key = desc.includes('clean audit') ? 'clean_audit' : 'annual_pa';
        const count = seenSeedMap.get(key) || 0;
        seenSeedMap.set(key, count + 1);
        if (count >= 1) {
          return false; // Remove repeated seed templates
        }
      }
      return true;
    });

    result = result.map(kpi => {
      const hasActual = Boolean(kpi.q1Actual && String(kpi.q1Actual).trim() !== '' && String(kpi.q1Actual).trim().toUpperCase() !== 'N/A');
      const hasDocs = Array.isArray(kpi.q1PoeDocs) && kpi.q1PoeDocs.length > 0;
      if ((hasActual || hasDocs) && (!kpi.reviewStatus || kpi.reviewStatus === 'Draft' || kpi.reviewStatus === 'In Progress')) {
        return {
          ...kpi,
          reviewStatus: 'Submitted for Approval'
        };
      }
      return kpi;
    });
  }

  // 21. Mr. M. Mokgolo (mokgolomothome@nkangaladm.gov.za) - Ensure all 24 KPIs preserve Submitted status when actuals/POEs exist
  if (normEmail === 'mokgolomothome@nkangaladm.gov.za' || normEmail.includes('mokgolomothome')) {
    result = result.map((kpi) => {
      const hasPoeDocs = (Array.isArray(kpi.q1PoeDocs) && kpi.q1PoeDocs.length > 0) ||
                         (Array.isArray(kpi.q2PoeDocs) && kpi.q2PoeDocs.length > 0) ||
                         (Array.isArray(kpi.q3PoeDocs) && kpi.q3PoeDocs.length > 0) ||
                         (Array.isArray(kpi.q4PoeDocs) && kpi.q4PoeDocs.length > 0) ||
                         Boolean(kpi.poeFileBase64 || kpi.poeFileName);
      const hasActuals = (kpi.q1Actual && String(kpi.q1Actual).trim() !== '' && String(kpi.q1Actual).trim().toUpperCase() !== 'N/A') ||
                         (kpi.q2Actual && String(kpi.q2Actual).trim() !== '' && String(kpi.q2Actual).trim().toUpperCase() !== 'N/A') ||
                         (kpi.q3Actual && String(kpi.q3Actual).trim() !== '' && String(kpi.q3Actual).trim().toUpperCase() !== 'N/A') ||
                         (kpi.q4Actual && String(kpi.q4Actual).trim() !== '' && String(kpi.q4Actual).trim().toUpperCase() !== 'N/A') ||
                         Boolean(kpi.q1Score || kpi.myScore || kpi.evaluationComment);
      if ((hasPoeDocs || hasActuals) && (!kpi.reviewStatus || kpi.reviewStatus === 'Draft' || kpi.reviewStatus === 'In Progress')) {
        return {
          ...kpi,
          reviewStatus: 'Submitted for Approval'
        };
      }
      return kpi;
    });
  }

  // 22. Mr. Alvin Bvuma (bvumaa@nkangaladm.gov.za) - Reconcile strictly 22 official KPIs from signed July-August 2026 Acting GM PED PA
  if (normEmail === 'bvumaa@nkangaladm.gov.za' || normEmail === 'bvumaa') {
    const officialActingKpis = [
      { kpiNo: 'M_07', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage of administrative staff who have declared their financial interests (circular 88) by 30 June 2027', weighting: '2', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Report on Declarations of Interests of Employees' },
      { kpiNo: '1', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Number of performance agreement signed with direct subordinates and submit to PMS unit by 30 July 2026', weighting: '2', baseline: 'New', annualTarget: '2', q1Target: '2', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from PMS' },
      { kpiNo: '2', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Number of quarterly leave reconciliation report submitted to Corporate Services', weighting: '2', baseline: '4', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from corporate services' },
      { kpiNo: '3', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', weighting: '2', baseline: 'New', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from Corporate Services' },
      { kpiNo: '4', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage of leave approvals processed within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', weighting: '2', baseline: 'New', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from Corporate Services' },
      { kpiNo: '5', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Submission of a Contract Request Development Memo to Legal Services within 7 (seven) days of receipt of an acceptance letter from the Service Provider.', weighting: '2', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Assurance Certificate signed by the Senior Legal Advisor.' },
      { kpiNo: '6', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage on implementation of CoGHSTA recommendations by 30 June 2027.', weighting: '2', baseline: 'New', annualTarget: '20%', q1Target: '20%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed quarterly resolution tracking progress report on the implementation. Proof of submission' },
      { kpiNo: '7', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage on implementation of revenue enhancement and cost containment initiatives to support municipal financial sustainability by 30 June 2027.', weighting: '2', baseline: 'New', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed progress implementation report' },
      { kpiNo: '8', kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION', kpi: 'Percentage implementation and Monitoring of Employment Equity Plan per quarter', weighting: '2', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Progress report on the implementation of EEP Plan' },
      { kpiNo: 'M_15', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (PED)', weighting: '2', baseline: '89%', annualTarget: '90%', q1Target: '90%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Quarterly Strategic Risk report' },
      { kpiNo: 'M_16', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of action plans implemented to address Operational Risks Identified per quarter (PED)', weighting: '2', baseline: '98%', annualTarget: '98%', q1Target: '98%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Quarterly Operational Risk report' },
      { kpiNo: 'M_17', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of action plans implemented to address Fraud and corruption Risks Identified per quarter (PED)', weighting: '2', baseline: '96%', annualTarget: '96%', q1Target: '96%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Quarterly Fraud and corruption Risk report' },
      { kpiNo: 'M_27', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of 2027/2028 IDP Final Framework Plan approved by 30 August 2026.', weighting: '2', baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Final Framework Plan and Council resolution' },
      { kpiNo: 'M_34', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of Nkangala District One Plan (DDM) report submitted to council by 30 June 2027.', weighting: '2', baseline: '4', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Quarterly Report on the Implementation of DDM One Plan and Council Resolutions.' },
      { kpiNo: 'M_35', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of DDM One Plan resolutions implemented by NDM per quarter', weighting: '1', baseline: 'New', annualTarget: '60%', q1Target: '60%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Quarterly DDM One Plan resolution monitoring report.' },
      { kpiNo: 'M_36', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of strategic lekgotla resolutions implemented by 30 June 2027', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Strategic Lekgotla monitoring report' },
      { kpiNo: 'M_37', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Number of reports on Council Resolutions submitted to Council per quarter', weighting: '2', baseline: 'New', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Quarterly Reports and Council Resolution.' },
      { kpiNo: 'M_40', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of internal audit recommendations implemented by 30 June 2027. (PED)', weighting: '2', baseline: '58%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Quarterly IA report' },
      { kpiNo: 'M_41', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of audit committee resolutions implemented by 30 June 2027. (PED)', weighting: '2', baseline: '83%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Quarterly Audit committee resolution register' },
      { kpiNo: 'M_45', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of EPWP Full Time Equivalent (FTE’s) job opportunities provided (GKPI) by 30 June 2027.', weighting: '10', baseline: '350', annualTarget: '30', q1Target: '30', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed progress reports and listing of employed EPWP Full Time Equivalent (FTE’s)' },
      { kpiNo: 'M_46', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of EPWP Work Opportunities jobs created (GKPI) by 30 June 2027', weighting: '10', baseline: '553', annualTarget: '300', q1Target: '300', q2Target: '0', q3Target: '0', q4Target: 'N/A', poe: 'Signed progress reports and listing of employed EPWP' },
      { kpiNo: 'P_01', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: '50 SASSETA Learnership (Security) recruited and trained by 30 June 2027 (34377)', weighting: '5', baseline: 'Stage 3', annualTarget: 'Stage 2 (100%): Appointment of service provider', q1Target: 'Stage 2 (100%): Appointment of service provider', q2Target: 'Stage 3 (50%): Recruitment', q3Target: 'Stage 3 (75%): Theory', q4Target: 'Stage 3 (100%): Practical', poe: 'Appointment Letter, Contracts of learners' },
      { kpiNo: 'P_02', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Support to SMMEs/ Cooperatives/ Informal Traders by 30 June 2027. (34409)', weighting: '5', baseline: 'Stage 3', annualTarget: 'Stage 1 (100%): Bid Specification Committee Resolution', q1Target: 'Stage 1 (100%): Bid Specification Committee Resolution', q2Target: 'Stage 2 (25%): Tender Advert', q3Target: 'Stage 2 (100%): BAC Resolution', q4Target: 'Stage 3 (100%): Signing of Agreement', poe: 'BSC Resolution, Tender Advert Tear Sheet' },
      { kpiNo: 'M_53', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of operational budget actually spent (circular 88) by 30 June 2027.', weighting: '2', baseline: '91%', annualTarget: '20%', q1Target: '20%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Operational Expenditure progress report' },
      { kpiNo: 'M_54', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of transfer and subsidies budget actually spent on projects (local Municipalities projects) by 30 June 2027', weighting: '2', baseline: '89%', annualTarget: '20%', q1Target: '20%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Transfer and subsidies Expenditure signed progress report' },
      { kpiNo: 'M_64', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: 'Percentage of procurement plan implementation by 30 June 2027', weighting: '3', baseline: '89%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Quarterly Procurement plan report' },
      { kpiNo: '9', kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT', kpi: '% attendance at scheduled Bid Committee meetings per quarter', weighting: '3', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Quarterly Bid Committee Report' },
      { kpiNo: 'M_91', kpa: 'KPA 6: SPATIAL RATIONALE', kpi: 'Percentage of compliant applications considered by municipal tribunal with respect to land use application within 120 days by 30 June 2027.', weighting: '5', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Register of application compliant and minutes of municipal tribunal' },
      { kpiNo: 'M_92', kpa: 'KPA 6: SPATIAL RATIONALE', kpi: 'Number of quarterly reports on land development applications received and responded to by the Local Municipalities by 30 June 2027.', weighting: '5', baseline: 'New', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Progress report on Land Development applications' },
      { kpiNo: 'P_18', kpa: 'KPA 6: SPATIAL RATIONALE', kpi: 'Finalisation of a Township Establishment in Siyathuthuka', weighting: '5', baseline: 'Stage 2', annualTarget: 'Stage 1 (100%): Appointment of Service Provider', q1Target: 'Stage 1 (100%): Appointment of Service Provider', q2Target: 'Stage 2 (30%): Inception Report', q3Target: 'Stage 2 (60%): Draft Special Study', q4Target: 'Stage 2 (100%): Final Special Study', poe: 'Appointment Letter, Inception Report' },
      { kpiNo: '10', kpa: 'KPA 7: SKILLS DEVELOPMENT', kpi: 'Number of quarterly Internships/Learnerships assessments conducted in the department by 30 June 2027', weighting: '9', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed quarterly assessment progress reports' }
    ];

    const existingMap = new Map<string, any>();
    if (Array.isArray(result)) {
      result.forEach(item => {
        if (item) {
          const kNo = String(item.kpiNo || '').toUpperCase();
          const desc = String(item.kpi || item.description || '').toLowerCase();
          if (kNo) existingMap.set(kNo, item);
          if (desc) existingMap.set(desc.substring(0, 30), item);
        }
      });
    }

    result = officialActingKpis.map((def, idx) => {
      const existing = existingMap.get(def.kpiNo.toUpperCase()) || existingMap.get(def.kpi.toLowerCase().substring(0, 30)) || {};
      const allQtrPoe = `Q1: ${def.poe}\nQ2: ${def.poe}\nQ3: ${def.poe}\nQ4: ${def.poe}`;
      return {
        ...existing,
        id: existing.id || `bvumaa-acting-kpi-${idx + 1}`,
        kpiNo: def.kpiNo,
        'kpi no': def.kpiNo,
        kpa: def.kpa,
        functionalKpa: def.kpa,
        kpi: def.kpi,
        indicator: def.kpi,
        description: def.kpi,
        'kpi description': def.kpi,
        weighting: def.weighting,
        weight: def.weighting,
        '%wt': def.weighting,
        baseline: def.baseline,
        annualTarget: def.annualTarget,
        'annual target': def.annualTarget,
        q1Target: def.q1Target,
        '1st qtr target': def.q1Target,
        q2Target: def.q2Target,
        '2nd qtr target': def.q2Target,
        q3Target: def.q3Target,
        '3rd qtr target': def.q3Target,
        q4Target: def.q4Target,
        '4th qtr target': def.q4Target,
        poe: allQtrPoe,
        annualRequiredPoe: def.poe,
        q1Poe: def.poe,
        q2Poe: def.poe,
        midtermPoe: def.poe,
        q3Poe: def.poe,
        q4Poe: def.poe,
        budget: 'OPEX',
        q1Applicable: def.q1Target !== 'N/A',
        q1Locked: def.q1Target === 'N/A',
        reviewStatus: existing.reviewStatus || (existing.q1Actual ? 'Submitted for Approval' : undefined),
        reviewApprovalStatus: existing.reviewApprovalStatus,
        q1PoeStatus: existing.q1PoeStatus,
        q1Actual: existing.q1Actual,
        q1PoeDocs: Array.isArray(existing.q1PoeDocs) ? existing.q1PoeDocs : []
      };
    });
  }

  // 23. Mr. Alvin Bvuma (bvumaa-mgr@nkangaladm.gov.za) - Reconcile strictly 24 official KPIs from signed 2026/2027 Manager PED PA
  if (normEmail === 'bvumaa-mgr@nkangaladm.gov.za' || normEmail === 'bvumaa-mgr') {
    const officialManagerKpis = [
      { kpiNo: 'M_11', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of new/reviewed policies approved by Council by 30 June 2027', weighting: '1', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Report to Council and Council Resolution(s)' },
      { kpiNo: 'M_15', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (PED)', weighting: '1', baseline: '90%', annualTarget: '90%', q1Target: '90%', q2Target: '90%', q3Target: '90%', q4Target: '90%', poe: 'Signed Quarterly Strategic Risk report' },
      { kpiNo: 'M_16', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Operational Risks Identified per quarter (PED)', weighting: '1', baseline: '97%', annualTarget: '98%', q1Target: '98%', q2Target: '98%', q3Target: '98%', q4Target: '98%', poe: 'Signed Quarterly Operational Risk report' },
      { kpiNo: 'M_17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of action plans implemented to address Fraud and corruption Risks Identified per quarter (PED)', weighting: '1', baseline: '95%', annualTarget: '96%', q1Target: '96%', q2Target: '96%', q3Target: '96%', q4Target: '96%', poe: 'Signed Quarterly Fraud and corruption Risk report' },
      { kpiNo: 'M_21', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Attain clean audit opinion by 31 December 2026.', weighting: '1', baseline: '1', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: 'AG’s Audit Report' },
      { kpiNo: 'M_22', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of repeat audit findings (circular 88) by 30 December 2026.', weighting: '1', baseline: '0', annualTarget: '≤ 0', q1Target: 'N/A', q2Target: '≤ 0', q3Target: 'N/A', q4Target: 'N/A', poe: 'AG’s Audit Report' },
      { kpiNo: 'M_23', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of Action Plan on issues raised by the Auditor General tabled to Council by 30 December 2026.', weighting: '1', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'Audit Action Plan and Council resolution' },
      { kpiNo: 'M_24', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of AG Findings raised in the Management Letter resolved (PED) by 30 June 2027.', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '40%', q4Target: '100%', poe: 'Signed Progress Report on the Implementation of the Audit Action Plan.' },
      { kpiNo: 'M_36', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of strategic lekgotla resolutions implemented by 30 June 2027. (PED)', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Strategic Lekgotla monitoring report' },
      { kpiNo: 'M_37', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of reports on Council Resolutions submitted to Council per quarter (PED)', weighting: '1', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Quarterly Reports and Council Resolution.' },
      { kpiNo: 'M_40', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of internal audit recommendations implemented by 30 June 2027 (PED)', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly IA report' },
      { kpiNo: 'M_41', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of audit committee resolutions implemented by 30 June 2027.', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Audit committee resolution register' },
      { kpiNo: '13', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026', weighting: '1', baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit' },
      { kpiNo: '14', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of performance agreements signed with subordinates and submitted to OPME & PMDS unit for the 2026/2027 financial year by 30 July 2026', weighting: '1', baseline: '5', annualTarget: '5', q1Target: '5', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit' },
      { kpiNo: '15', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of self-assessment report compiled and submitted to Supervisor per quarter.', weighting: '1', baseline: '4', annualTarget: '4', q1Target: '1 (Q1 assessment)', q2Target: '1 (midyear assessment)', q3Target: '1 (Q3 assessment)', q4Target: '1 (annual assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS unit' },
      { kpiNo: '16', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026', weighting: '1', baseline: '1', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit' },
      { kpiNo: '17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of informal performance evaluation conducted with all subordinates per quarter', weighting: '1', baseline: '2', annualTarget: '2 (Q1 & Q3)', q1Target: '1 (Q1)', q2Target: 'N/A', q3Target: '1 (Q3)', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit' },
      { kpiNo: '18', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of quarterly leave reconciliation report submitted to Departmental General Manager (within 30 days after end of each quarter)', weighting: '1', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Compliance certificate from corporate services' },
      { kpiNo: '19', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services' },
      { kpiNo: '20', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Percentage of leave approvals processed within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', weighting: '1', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services' },
      { kpiNo: '21', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of departmental Training Needs Analysis submitted (TNA) by 30 March 2027', weighting: '1', baseline: 'New', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Compliance Certificate issued by HRM&D Unit.' },
      { kpiNo: '22', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION', kpi: 'Number of quarterly Internships/Learnerships assessments conducted in the department by 30 June 2027', weighting: '1', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed quarterly assessment progress reports' },
      { kpiNo: 'M_53', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of operational budget actually spent (circular 88) by 30 June 2027.', weighting: '2', baseline: '90%', annualTarget: '91%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: '91%', poe: 'Signed Operational Expenditure progress report' },
      { kpiNo: 'M_54', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage of transfer and subsidies budget actually spent on projects (local Municipalities projects) by 30 June 2027', weighting: '2', baseline: '90%', annualTarget: '90%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: '90%', poe: 'Transfer and subsidies Expenditure signed progress report' },
      { kpiNo: 'M_64', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: 'Percentage implementation of the procurement plan by 30 June 2027.', weighting: '2', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Procurement plan report' },
      { kpiNo: '26', kpa: 'KPA 2: GOOD GOVERNANCE AND PUBLIC PARTICIPATION', kpi: '100% attendance at scheduled Bid Committee meetings per quarter', weighting: '4', baseline: '100%', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Bid Committee Attendance Report' },
      { kpiNo: 'M_45', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of EPWP Full Time Equivalent (FTE’s) job opportunities provided (GKPI) by 30 June 2027.', weighting: '5', baseline: '350', annualTarget: '132', q1Target: '30', q2Target: '30', q3Target: '30', q4Target: '42', poe: 'Signed progress reports and listing of employed EPWP Full Time Equivalent (FTE’s)' },
      { kpiNo: 'M_46', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of EPWP Work Opportunities jobs created (GKPI) by 30 June 2027', weighting: '5', baseline: '553', annualTarget: '394', q1Target: '300', q2Target: '0', q3Target: '0', q4Target: '94', poe: 'Signed progress reports and listing of employed EPWP' },
      { kpiNo: 'M_47', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of Final LED Strategy Reviewed by 31 December 2026.', weighting: '5', baseline: 'New', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'Final LED Strategy and Council resolution' },
      { kpiNo: 'M_49', kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT', kpi: 'Number of Tourism Expo convened by 30 April 2027.', weighting: '5', baseline: '71%', annualTarget: '66%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '40%', q4Target: '66%', poe: 'Signed SCM Quarterly Report on designated groups who benefited from NDM' },
      { kpiNo: '31', kpa: 'KPA 4: TRANSPORT PLANNING', kpi: 'Number of District Transport Forum meetings attended by June 2027', weighting: '5', baseline: '4', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'NDM Transport Forum Attendance register and Agenda' },
      { kpiNo: '32', kpa: 'KPA 5: INTEGRATED DEVELOPMENT PLANNING', kpi: 'Number of IDP/PMS Forums convened by 30 June 2027.', weighting: '6', baseline: '2', annualTarget: '2', q1Target: '1', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Attendance register' },
      { kpiNo: '33', kpa: 'KPA 5: INTEGRATED DEVELOPMENT PLANNING', kpi: 'Coordinate and facilitate IDP strategic planning lekgotla by 30 June 2027.', weighting: '6', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Strategic Lekgotla Attendance Register' },
      { kpiNo: '34', kpa: 'KPA 5: INTEGRATED DEVELOPMENT PLANNING', kpi: 'Coordinate the 2027 IDP/Budget Indaba by 30 June 2027.', weighting: '6', baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Indaba register' },
      { kpiNo: 'M_92', kpa: 'KPA 6: SPATIAL DEVELOPMENT', kpi: 'Number of quarterly reports on land development applications received and responded to by the Local Municipalities by 30 June 2027.', weighting: '10', baseline: 'New', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Progress report on Land Development applications' },
      { kpiNo: 'P_01', kpa: 'KPA 7: PROJECT MANAGEMENT', kpi: '50 SASSETA Learnership (Security) recruited and trained by 30 June 2027 (34377)', weighting: '5', baseline: 'Stage 3', annualTarget: 'Stage 3: Implementation Stage (100%): Practical Training', q1Target: 'Stage 2 (100%): Appointment', q2Target: 'Stage 3 (50%): Recruitment', q3Target: 'Stage 3 (75%): Theory', q4Target: 'Stage 3 (100%): Practical', poe: 'Appointment Letter, Contracts of learners' },
      { kpiNo: 'P_02', kpa: 'KPA 7: PROJECT MANAGEMENT', kpi: 'Support to SMMEs/ Cooperatives/ Informal Traders by 30 June 2027. (34409)', weighting: '5', baseline: 'Stage 3', annualTarget: 'Stage 3: Implementation Stage (100%)', q1Target: 'Stage 1 (100%): BSC Resolution', q2Target: 'Stage 2 (25%): Tender Advert', q3Target: 'Stage 2 (100%): BAC Resolution', q4Target: 'Stage 3 (100%): Signing Agreement', poe: 'BSC Resolution, Tender Advert Tear Sheet' },
      { kpiNo: 'P_18', kpa: 'KPA 7: PROJECT MANAGEMENT', kpi: 'Finalisation of Township Establishment in Siyathuthuka', weighting: '5', baseline: 'Stage 2', annualTarget: 'Stage 2: Implementation stage (100%) Final Special Study and Opening Township Register', q1Target: 'Stage 1 (100%): Appointment', q2Target: 'Stage 2 (30%): Inception Report', q3Target: 'Stage 2 (60%): Draft Special Study', q4Target: 'Stage 2 (100%): Final Special Study', poe: 'Appointment letter, Inception Report' }
    ];

    const existingMap = new Map<string, any>();
    if (Array.isArray(result)) {
      result.forEach(item => {
        if (item) {
          const kNo = String(item.kpiNo || '').toUpperCase();
          const desc = String(item.kpi || item.description || '').toLowerCase();
          if (kNo) existingMap.set(kNo, item);
          if (desc) existingMap.set(desc.substring(0, 30), item);
        }
      });
    }

    result = officialManagerKpis.map((def, idx) => {
      const existing = existingMap.get(def.kpiNo.toUpperCase()) || existingMap.get(def.kpi.toLowerCase().substring(0, 30)) || {};
      const allQtrPoe = `Q1: ${def.poe}\nQ2: ${def.poe}\nQ3: ${def.poe}\nQ4: ${def.poe}`;
      return {
        ...existing,
        id: existing.id || `bvumaa-mgr-kpi-${idx + 1}`,
        kpiNo: def.kpiNo,
        'kpi no': def.kpiNo,
        kpa: def.kpa,
        functionalKpa: def.kpa,
        kpi: def.kpi,
        indicator: def.kpi,
        description: def.kpi,
        'kpi description': def.kpi,
        weighting: def.weighting,
        weight: def.weighting,
        '%wt': def.weighting,
        baseline: def.baseline,
        annualTarget: def.annualTarget,
        'annual target': def.annualTarget,
        q1Target: def.q1Target,
        '1st qtr target': def.q1Target,
        q2Target: def.q2Target,
        '2nd qtr target': def.q2Target,
        q3Target: def.q3Target,
        '3rd qtr target': def.q3Target,
        q4Target: def.q4Target,
        '4th qtr target': def.q4Target,
        poe: allQtrPoe,
        annualRequiredPoe: def.poe,
        q1Poe: def.poe,
        q2Poe: def.poe,
        midtermPoe: def.poe,
        q3Poe: def.poe,
        q4Poe: def.poe,
        budget: 'OPEX',
        q1Applicable: def.q1Target !== 'N/A',
        q1Locked: def.q1Target === 'N/A',
        reviewStatus: existing.reviewStatus || (existing.q1Actual ? 'Submitted for Approval' : undefined),
        reviewApprovalStatus: existing.reviewApprovalStatus,
        q1PoeStatus: existing.q1PoeStatus,
        q1Actual: existing.q1Actual,
        q1PoeDocs: Array.isArray(existing.q1PoeDocs) ? existing.q1PoeDocs : []
      };
    });
  }

  // 17. Ms. Pretty B. Mahlangu (mahlangupb@nkangaladm.gov.za) - Assistant Director: LED (KPI 10 POE fix)
  if (normEmail === 'mahlangupb@nkangaladm.gov.za' || normEmail.includes('mahlangupb')) {
    const targetPoeText = "beneficiariesBSC Resolution, Tender Advert (Tear Sheet), BEC Resolution, BAC Resolution, Signed & Dated Appointment Letter, list of beneficiaries, Signed Agreements";
    const allQtrPoe = `Q1: ${targetPoeText}\nQ2: ${targetPoeText}\nQ3: ${targetPoeText}\nQ4: ${targetPoeText}`;

    result = result.map((kpi: any, idx: number) => {
      const kpiNum = String(kpi.kpiNo || kpi['kpi no'] || idx + 1);
      const desc = (kpi.kpi || kpi.description || kpi['kpi description'] || '').toLowerCase();
      const isKpi10 = kpiNum === '10' || kpi.id === 'extracted-sync-1786883523924-10' || desc.includes('smmes') || desc.includes('cooperatives and informal traders');

      if (isKpi10) {
        return {
          ...kpi,
          poe: allQtrPoe,
          annualRequiredPoe: targetPoeText,
          q1Poe: targetPoeText,
          q2Poe: targetPoeText,
          midtermPoe: targetPoeText,
          q3Poe: targetPoeText,
          q4Poe: targetPoeText,
          actualPoe: targetPoeText,
          q1ActualPoe: targetPoeText,
          q2ActualPoe: targetPoeText,
          q3ActualPoe: targetPoeText,
          q4ActualPoe: targetPoeText,
          q1PoeDescription: targetPoeText,
          q2PoeDescription: targetPoeText,
          q3PoeDescription: targetPoeText,
          q4PoeDescription: targetPoeText,
          q1ActualPoeDescription: targetPoeText,
          q2ActualPoeDescription: targetPoeText,
          q3ActualPoeDescription: targetPoeText,
          q4ActualPoeDescription: targetPoeText,
          actualPoeDescription: targetPoeText
        };
      }
      return kpi;
    });
  }

  // 18. Mr. Bongani Isaac Sindane (sindaneib@nkangaladm.gov.za) - KPI 13 Dust Management Plan targets
  if (normEmail === 'sindaneib@nkangaladm.gov.za' || normEmail.includes('sindaneib')) {
    result = result.map((kpi: any, idx: number) => {
      const kpiNum = String(kpi.kpiNo || kpi['kpi no'] || idx + 1);
      const desc = (kpi.kpi || kpi.description || kpi['kpi description'] || '').toLowerCase();
      if (kpiNum === '13' || desc.includes('monthly dust management plan')) {
        return {
          ...kpi,
          annualTarget: '40%',
          'annual target': '40%',
          q1Target: '10%',
          '1st qtr target': '10%',
          q2Target: '20%',
          '2nd qtr target': '20%',
          q3Target: '30%',
          '3rd qtr target': '30%',
          q4Target: '40%',
          '4th qtr target': '40%',
          q1Applicable: true,
          q1Locked: false
        };
      }
      return kpi;
    });
  }

  // 19. Mr. Bandile Zikhali (zikhalibi@nkangaladm.gov.za) - Unlock KPI 2 for Quarter 1 reporting
  if (normEmail === 'zikhalibi@nkangaladm.gov.za' || normEmail.includes('zikhalibi')) {
    result = result.map((kpi: any, idx: number) => {
      const kpiNum = String(kpi.kpiNo || kpi['kpi no'] || idx + 1);
      const desc = (kpi.kpi || kpi.description || kpi['kpi description'] || '').toLowerCase();
      if (kpiNum === '2' || (desc.includes('annual performance agreement') && desc.includes('opme & pmds'))) {
        return {
          ...kpi,
          q1Target: '1',
          '1st qtr target': '1',
          q1Applicable: true,
          q1Locked: false,
          lockedQuarters: Array.isArray(kpi.lockedQuarters) ? kpi.lockedQuarters.filter((q: string) => q.toUpperCase() !== 'Q1') : []
        };
      }
      return kpi;
    });
  }

  // 20. Mr. Thabang Mochabi (thabangmj@nkangaladm.gov.za) - SCM Clerk (All 13 official KPIs)
  if (normEmail === 'thabangmj@nkangaladm.gov.za' || normEmail.includes('thabangmj')) {
    const missingMochabiDefs = [
      {
        id: "extracted-sync-1786828057990-6",
        kpiNo: "6",
        kpa: "KPA 2: BID / TENDER EVALUATION COMMITTEE SECRETARIAT DUTIES (ALTERNATE)",
        kpi: "% of agendas prepared and submitted to the Bid/Tender Evaluation Committee",
        weighting: "10",
        baseline: "100%",
        annualTarget: "100%",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        poe: "Approved Bid/Tender Evaluation Committee agenda",
        annualRequiredPoe: "Approved Bid/Tender Evaluation Committee agenda",
        q1Poe: "Approved Bid/Tender Evaluation Committee agenda",
        q2Poe: "Approved Bid/Tender Evaluation Committee agenda",
        midtermPoe: "Approved Bid/Tender Evaluation Committee agenda",
        q3Poe: "Approved Bid/Tender Evaluation Committee agenda",
        q4Poe: "Approved Bid/Tender Evaluation Committee agenda",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786828057990-7",
        kpiNo: "7",
        kpa: "KPA 2: BID / TENDER EVALUATION COMMITTEE SECRETARIAT DUTIES (ALTERNATE)",
        kpi: "Percentage (%) attendance at scheduled Bid Committee meetings per quarter",
        weighting: "10",
        baseline: "100%",
        annualTarget: "100%",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        poe: "Quarterly Bid Committee Attendance register and report",
        annualRequiredPoe: "Quarterly Bid Committee Attendance register and report",
        q1Poe: "Quarterly Bid Committee Attendance register and report",
        q2Poe: "Quarterly Bid Committee Attendance register and report",
        midtermPoe: "Quarterly Bid Committee Attendance register and report",
        q3Poe: "Quarterly Bid Committee Attendance register and report",
        q4Poe: "Quarterly Bid Committee Attendance register and report",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786828057990-8",
        kpiNo: "8",
        kpa: "KPA 3: PRE-EVALUATION OF CLOSED TENDERS",
        kpi: "% of Pre-Evaluation of Closed Tenders by 30 June 2027",
        weighting: "10",
        baseline: "100%",
        annualTarget: "100%",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        poe: "Email sent to Divisional manager-SCM with Pre-Evaluation Report",
        annualRequiredPoe: "Email sent to Divisional manager-SCM with Pre-Evaluation Report",
        q1Poe: "Email sent to Divisional manager-SCM with Pre-Evaluation Report",
        q2Poe: "Email sent to Divisional manager-SCM with Pre-Evaluation Report",
        midtermPoe: "Email sent to Divisional manager-SCM with Pre-Evaluation Report",
        q3Poe: "Email sent to Divisional manager-SCM with Pre-Evaluation Report",
        q4Poe: "Email sent to Divisional manager-SCM with Pre-Evaluation Report",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786828057990-9",
        kpiNo: "9",
        kpa: "KPA 3: PRE-EVALUATION OF CLOSED TENDERS",
        kpi: "% of tender documents opening for closed bids.",
        weighting: "10",
        baseline: "100%",
        annualTarget: "100%",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        poe: "Tender opening results for closed bids",
        annualRequiredPoe: "Tender opening results for closed bids",
        q1Poe: "Tender opening results for closed bids",
        q2Poe: "Tender opening results for closed bids",
        midtermPoe: "Tender opening results for closed bids",
        q3Poe: "Tender opening results for closed bids",
        q4Poe: "Tender opening results for closed bids",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786828057990-10",
        kpiNo: "10",
        kpa: "KPA 4: CONTRACT MANAGEMENT SYSTEM",
        kpi: "Number of monthly, quarterly and annual Procurement utilising contracted service providers (Travel & Accommodation, Diesel (THLM & NDM) and Competency assessment).",
        weighting: "10",
        baseline: "17",
        annualTarget: "17",
        q1Target: "4",
        q2Target: "4",
        q3Target: "4",
        q4Target: "5",
        poe: "SCM long term report on (Travel & Accommodation, Diesel NDM and Fire Stations.",
        annualRequiredPoe: "SCM long term report on (Travel & Accommodation, Diesel NDM and Fire Stations.",
        q1Poe: "SCM long term report on (Travel & Accommodation, Diesel NDM and Fire Stations.",
        q2Poe: "SCM long term report on (Travel & Accommodation, Diesel NDM and Fire Stations.",
        midtermPoe: "SCM long term report on (Travel & Accommodation, Diesel NDM and Fire Stations.",
        q3Poe: "SCM long term report on (Travel & Accommodation, Diesel NDM and Fire Stations.",
        q4Poe: "SCM long term report on (Travel & Accommodation, Diesel NDM and Fire Stations.",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786828057990-11",
        kpiNo: "11",
        kpa: "KPA 4: CONTRACT MANAGEMENT SYSTEM",
        kpi: "Percentage of performance evaluation reports performed/loaded on the Contract Management System, (Travel & Accommodation, Diesel (THLM & NDM) and Competency assessment ).",
        weighting: "10",
        baseline: "100%",
        annualTarget: "100%",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        poe: "Evaluation reports conducted on the Contract Management system (Travel & Accommodation, Diesel for NDM and Fire Stations A and, Competency assessment)",
        annualRequiredPoe: "Evaluation reports conducted on the Contract Management system (Travel & Accommodation, Diesel for NDM and Fire Stations A and, Competency assessment)",
        q1Poe: "Evaluation reports conducted on the Contract Management system (Travel & Accommodation, Diesel for NDM and Fire Stations A and, Competency assessment)",
        q2Poe: "Evaluation reports conducted on the Contract Management system (Travel & Accommodation, Diesel for NDM and Fire Stations A and, Competency assessment)",
        midtermPoe: "Evaluation reports conducted on the Contract Management system (Travel & Accommodation, Diesel for NDM and Fire Stations A and, Competency assessment)",
        q3Poe: "Evaluation reports conducted on the Contract Management system (Travel & Accommodation, Diesel for NDM and Fire Stations A and, Competency assessment)",
        q4Poe: "Evaluation reports conducted on the Contract Management system (Travel & Accommodation, Diesel for NDM and Fire Stations A and, Competency assessment)",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786828057990-12",
        kpiNo: "12",
        kpa: "KPA 5: REPORTING ON SCM MATTERS TO COUNCIL AND OTHER STAKEHOLDERS",
        kpi: "Number of declarations of interest reports by NDM employees submitted monthly, quarterly and annual",
        weighting: "15",
        baseline: "17",
        annualTarget: "17",
        q1Target: "4",
        q2Target: "4",
        q3Target: "4",
        q4Target: "5",
        poe: "Declaration of interest report",
        annualRequiredPoe: "Declaration of interest report",
        q1Poe: "Declaration of interest report",
        q2Poe: "Declaration of interest report",
        midtermPoe: "Declaration of interest report",
        q3Poe: "Declaration of interest report",
        q4Poe: "Declaration of interest report",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "extracted-sync-1786828057990-13",
        kpiNo: "13",
        kpa: "KPA 5: REPORTING ON SCM MATTERS TO COUNCIL AND OTHER STAKEHOLDERS",
        kpi: "% of reminders sent to NDM officials who did not submit their declaration of interest",
        weighting: "5",
        baseline: "100%",
        annualTarget: "100%",
        q1Target: "100%",
        q2Target: "100%",
        q3Target: "100%",
        q4Target: "100%",
        poe: "E-mail reminder sent to NDM officials",
        annualRequiredPoe: "E-mail reminder sent to NDM officials",
        q1Poe: "E-mail reminder sent to NDM officials",
        q2Poe: "E-mail reminder sent to NDM officials",
        midtermPoe: "E-mail reminder sent to NDM officials",
        q3Poe: "E-mail reminder sent to NDM officials",
        q4Poe: "E-mail reminder sent to NDM officials",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      }
    ];

    for (const def of missingMochabiDefs) {
      const exists = result.some(k => (k.kpiNo && String(k.kpiNo) === def.kpiNo) || (k.kpi && k.kpi.toLowerCase() === def.kpi.toLowerCase()));
      if (!exists) {
        result.push(def);
      }
    }
  }

  // 21. Mrs. Yolanda Segami (segamiy@nkangaladm.gov.za) - KPI 24 Target Correction
  if (normEmail === 'segamiy@nkangaladm.gov.za' || normEmail.includes('segamiy')) {
    result = result.map((kpi: any, idx: number) => {
      const kpiNum = String(kpi.kpiNo || kpi['kpi no'] || idx + 1);
      const desc = (kpi.kpi || kpi.description || kpi['kpi description'] || '').toLowerCase();
      if (kpiNum === '24' || (desc.includes('schools') && desc.includes('colleges') && desc.includes('inspections'))) {
        return {
          ...kpi,
          baseline: '24',
          annualTarget: '24',
          'annual target': '24',
          q1Target: '6',
          '1st qtr target': '6',
          q2Target: '6',
          '2nd qtr target': '6',
          q3Target: '6',
          '3rd qtr target': '6',
          q4Target: '6',
          '4th qtr target': '6'
        };
      }
      return kpi;
    });
  }

  // 22. Ruth Linda Singo (singorl@nkangaladm.gov.za) - Official Scorecard Rectification (25 KPIs total)
  // KPIs 1 to 11 are verified correct and all submitted actuals/PoEs are strictly preserved.
  // Replace corrupted duplicates on KPIs 12 to 25 with exact official agreement definitions from KPAs 2-6.
  if (normEmail === 'singorl@nkangaladm.gov.za' || normEmail.includes('singorl')) {
    const officialSingoKpis12To25 = [
      {
        id: "singo-kpi-12",
        kpiNo: "12",
        kpa: "KPA 2: FOOD CONTROL AND SAFETY 20%",
        kpi: "Number of food handling and preparation facility inspections conducted in terms of the Foodstuffs, Cosmetics, Disinfectant Act (FCDA) per quarter for MHS Thembisile Hani",
        weighting: "15",
        baseline: "241",
        annualTarget: "180",
        q1Target: "45",
        q2Target: "45",
        q3Target: "45",
        q4Target: "45",
        poe: "Inspection Reports and Listing",
        annualRequiredPoe: "Inspection Reports and Listing",
        q1Poe: "Inspection Reports and Listing",
        q2Poe: "Inspection Reports and Listing",
        midtermPoe: "Inspection Reports and Listing",
        q3Poe: "Inspection Reports and Listing",
        q4Poe: "Inspection Reports and Listing",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-13",
        kpiNo: "13",
        kpa: "KPA 2: FOOD CONTROL AND SAFETY 20%",
        kpi: "Number of food samples taken per annum",
        weighting: "5",
        baseline: "11",
        annualTarget: "11",
        q1Target: "3",
        q2Target: "3",
        q3Target: "3",
        q4Target: "2",
        poe: "Sampling Schedule and Sampling Forms",
        annualRequiredPoe: "Sampling Schedule and Sampling Forms",
        q1Poe: "Sampling Schedule and Sampling Forms",
        q2Poe: "Sampling Schedule and Sampling Forms",
        midtermPoe: "Sampling Schedule and Sampling Forms",
        q3Poe: "Sampling Schedule and Sampling Forms",
        q4Poe: "Sampling Schedule and Sampling Forms",
        budget: "R200 (Total NDM Budget)",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-14",
        kpiNo: "14",
        kpa: "KPA 3: WATER QUALITY MONITORING 20%",
        kpi: "# of water samples taken per quarter from the Thembisile Hani participating municipality, analysed as per the SANS 241 standard per quarter",
        weighting: "20",
        baseline: "80",
        annualTarget: "80",
        q1Target: "20",
        q2Target: "20",
        q3Target: "20",
        q4Target: "20",
        poe: "Water Samples Sheets and Listing Spread Sheets",
        annualRequiredPoe: "Water Samples Sheets and Listing Spread Sheets",
        q1Poe: "Water Samples Sheets and Listing Spread Sheets",
        q2Poe: "Water Samples Sheets and Listing Spread Sheets",
        midtermPoe: "Water Samples Sheets and Listing Spread Sheets",
        q3Poe: "Water Samples Sheets and Listing Spread Sheets",
        q4Poe: "Water Samples Sheets and Listing Spread Sheets",
        budget: "R2 000 (Total NDM)",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-15",
        kpiNo: "15",
        kpa: "KPA 4: WASTE MANAGEMENT 10%",
        kpi: "# of municipal health services inspections conducted at Landfill sites/ transfer stations/ illegal dumping hot spots per quarter",
        weighting: "5",
        baseline: "20",
        annualTarget: "20",
        q1Target: "5",
        q2Target: "5",
        q3Target: "5",
        q4Target: "5",
        poe: "Inspection Reports and Listings",
        annualRequiredPoe: "Inspection Reports and Listings",
        q1Poe: "Inspection Reports and Listings",
        q2Poe: "Inspection Reports and Listings",
        midtermPoe: "Inspection Reports and Listings",
        q3Poe: "Inspection Reports and Listings",
        q4Poe: "Inspection Reports and Listings",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-16",
        kpiNo: "16",
        kpa: "KPA 4: WASTE MANAGEMENT 10%",
        kpi: "# of municipal health services inspections conducted at Health Care Waste Generators (private clinics, dentist, veterinary clinics, pharmacies, doctors) per annum",
        weighting: "5",
        baseline: "19",
        annualTarget: "19",
        q1Target: "5",
        q2Target: "5",
        q3Target: "4",
        q4Target: "5",
        poe: "Inspection Reports and Listings",
        annualRequiredPoe: "Inspection Reports and Listings",
        q1Poe: "Inspection Reports and Listings",
        q2Poe: "Inspection Reports and Listings",
        midtermPoe: "Inspection Reports and Listings",
        q3Poe: "Inspection Reports and Listings",
        q4Poe: "Inspection Reports and Listings",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-17",
        kpiNo: "17",
        kpa: "KPA 5: SURVEILANCE OF PREMISES 20%",
        kpi: "# of municipal health services inspections conducted at day care centres, crèches or preschools (ECDS) per annum",
        weighting: "5",
        baseline: "45",
        annualTarget: "32",
        q1Target: "8",
        q2Target: "8",
        q3Target: "8",
        q4Target: "8",
        poe: "Inspection Reports and Listings",
        annualRequiredPoe: "Inspection Reports and Listings",
        q1Poe: "Inspection Reports and Listings",
        q2Poe: "Inspection Reports and Listings",
        midtermPoe: "Inspection Reports and Listings",
        q3Poe: "Inspection Reports and Listings",
        q4Poe: "Inspection Reports and Listings",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-18",
        kpiNo: "18",
        kpa: "KPA 5: SURVEILANCE OF PREMISES 20%",
        kpi: "# of municipal health services inspections conducted at funeral undertakers and mortuaries per quarter",
        weighting: "5",
        baseline: "6",
        annualTarget: "6",
        q1Target: "1",
        q2Target: "2",
        q3Target: "1",
        q4Target: "2",
        poe: "Inspection Reports and Listings",
        annualRequiredPoe: "Inspection Reports and Listings",
        q1Poe: "Inspection Reports and Listings",
        q2Poe: "Inspection Reports and Listings",
        midtermPoe: "Inspection Reports and Listings",
        q3Poe: "Inspection Reports and Listings",
        q4Poe: "Inspection Reports and Listings",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-19",
        kpiNo: "19",
        kpa: "KPA 5: SURVEILANCE OF PREMISES 20%",
        kpi: "# of municipal health services inspections conducted at Public Institutions/ Community facilities e.g. Old age, disabled centres per annum",
        weighting: "2",
        baseline: "13",
        annualTarget: "13",
        q1Target: "2",
        q2Target: "4",
        q3Target: "4",
        q4Target: "3",
        poe: "Inspection Reports and Listings",
        annualRequiredPoe: "Inspection Reports and Listings",
        q1Poe: "Inspection Reports and Listings",
        q2Poe: "Inspection Reports and Listings",
        midtermPoe: "Inspection Reports and Listings",
        q3Poe: "Inspection Reports and Listings",
        q4Poe: "Inspection Reports and Listings",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-20",
        kpiNo: "20",
        kpa: "KPA 5: SURVEILANCE OF PREMISES 20%",
        kpi: "# of municipal health services inspections conducted at government and private schools, colleges and/or boarding schools per annum",
        weighting: "2",
        baseline: "26",
        annualTarget: "24",
        q1Target: "6",
        q2Target: "6",
        q3Target: "6",
        q4Target: "6",
        poe: "Inspection Reports and Listings",
        annualRequiredPoe: "Inspection Reports and Listings",
        q1Poe: "Inspection Reports and Listings",
        q2Poe: "Inspection Reports and Listings",
        midtermPoe: "Inspection Reports and Listings",
        q3Poe: "Inspection Reports and Listings",
        q4Poe: "Inspection Reports and Listings",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-21",
        kpiNo: "21",
        kpa: "KPA 5: SURVEILANCE OF PREMISES 20%",
        kpi: "# of municipal health services inspections conducted at Accommodation facilities eg. hotels, guest houses etc. per annum",
        weighting: "4",
        baseline: "7",
        annualTarget: "7",
        q1Target: "2",
        q2Target: "2",
        q3Target: "1",
        q4Target: "2",
        poe: "Inspection Reports and Listings",
        annualRequiredPoe: "Inspection Reports and Listings",
        q1Poe: "Inspection Reports and Listings",
        q2Poe: "Inspection Reports and Listings",
        midtermPoe: "Inspection Reports and Listings",
        q3Poe: "Inspection Reports and Listings",
        q4Poe: "Inspection Reports and Listings",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-22",
        kpiNo: "22",
        kpa: "KPA 5: SURVEILANCE OF PREMISES 20%",
        kpi: "# of municipal health services inspections conducted at Chemical Safety premises per annum",
        weighting: "2",
        baseline: "10",
        annualTarget: "10",
        q1Target: "2",
        q2Target: "3",
        q3Target: "2",
        q4Target: "3",
        poe: "Inspection Reports and Listings",
        annualRequiredPoe: "Inspection Reports and Listings",
        q1Poe: "Inspection Reports and Listings",
        q2Poe: "Inspection Reports and Listings",
        midtermPoe: "Inspection Reports and Listings",
        q3Poe: "Inspection Reports and Listings",
        q4Poe: "Inspection Reports and Listings",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-23",
        kpiNo: "23",
        kpa: "KPA 6: EDUCATION AND AWARENESS 10%",
        kpi: "# of community based campaigns conducted by 30 June 2027",
        weighting: "2",
        baseline: "04",
        annualTarget: "4",
        q1Target: "1",
        q2Target: "1",
        q3Target: "1",
        q4Target: "1",
        poe: "Attendance registers and Listing",
        annualRequiredPoe: "Attendance registers and Listing",
        q1Poe: "Attendance registers and Listing",
        q2Poe: "Attendance registers and Listing",
        midtermPoe: "Attendance registers and Listing",
        q3Poe: "Attendance registers and Listing",
        q4Poe: "Attendance registers and Listing",
        budget: "R750",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-24",
        kpiNo: "24",
        kpa: "KPA 6: EDUCATION AND AWARENESS 10%",
        kpi: "# of municipal Health Services and Environmental Management joint operations programmes conducted per quarter per Thembisile Hani team",
        weighting: "4",
        baseline: "11",
        annualTarget: "11",
        q1Target: "3",
        q2Target: "2",
        q3Target: "3",
        q4Target: "3",
        poe: "Attendance registers and Listing",
        annualRequiredPoe: "Attendance registers and Listing",
        q1Poe: "Attendance registers and Listing",
        q2Poe: "Attendance registers and Listing",
        midtermPoe: "Attendance registers and Listing",
        q3Poe: "Attendance registers and Listing",
        q4Poe: "Attendance registers and Listing",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      },
      {
        id: "singo-kpi-25",
        kpiNo: "25",
        kpa: "KPA 6: EDUCATION AND AWARENESS 10%",
        kpi: "# of municipal Health Services education and training facilitated in Thembisile Hani per quarter",
        weighting: "4",
        baseline: "14",
        annualTarget: "14",
        q1Target: "4",
        q2Target: "3",
        q3Target: "4",
        q4Target: "3",
        poe: "Attendance registers and Listing",
        annualRequiredPoe: "Attendance registers and Listing",
        q1Poe: "Attendance registers and Listing",
        q2Poe: "Attendance registers and Listing",
        midtermPoe: "Attendance registers and Listing",
        q3Poe: "Attendance registers and Listing",
        q4Poe: "Attendance registers and Listing",
        budget: "OPEX",
        q1Applicable: true,
        q1Locked: false
      }
    ];

    const existingMap = new Map<string, any>();
    if (Array.isArray(inputKpis)) {
      inputKpis.forEach((item, i) => {
        if (item) {
          if (item.id) existingMap.set(String(item.id).toLowerCase(), item);
          if (item.kpiNo) existingMap.set(String(item.kpiNo).toLowerCase(), item);
          if (i >= 11) existingMap.set(`idx-${i}`, item);
        }
      });
    }

    // Keep the first 11 valid items from KPA 1 (preserving actuals and PoEs)
    const preserved1To11 = result.slice(0, 11).map((kpi: any, idx: number) => ({
      ...kpi,
      kpiNo: String(idx + 1),
      q1Applicable: kpi.q1Target && kpi.q1Target !== 'N/A' && kpi.q1Target !== 'NONE'
    }));

    const mergedSingoKpis12To25 = officialSingoKpis12To25.map((kpi, idx) => {
      const kpiNum = String(idx + 12);
      const existing = existingMap.get(kpi.id.toLowerCase()) ||
                       existingMap.get(kpiNum) ||
                       existingMap.get(`idx-${idx + 11}`) ||
                       result[idx + 11] || {};

      return {
        ...kpi,
        ...existing,
        id: kpi.id,
        kpiNo: kpiNum,
        kpa: kpi.kpa,
        kpi: kpi.kpi,
        weighting: kpi.weighting,
        annualTarget: kpi.annualTarget,
        q1Target: kpi.q1Target,
        q2Target: kpi.q2Target,
        q3Target: kpi.q3Target,
        q4Target: kpi.q4Target,
        poe: existing.poe || kpi.poe,
        annualRequiredPoe: kpi.annualRequiredPoe,
        q1Poe: kpi.q1Poe,
        q2Poe: kpi.q2Poe,
        midtermPoe: kpi.midtermPoe,
        q3Poe: kpi.q3Poe,
        q4Poe: kpi.q4Poe,
        budget: kpi.budget,
        q1Applicable: true,
        q1Locked: false,
        q1Actual: existing.q1Actual ?? existing.actualAchieved ?? existing.actual ?? '',
        actual: existing.actual ?? existing.q1Actual ?? '',
        actualAchieved: existing.actualAchieved ?? existing.q1Actual ?? '',
        q1PoeDocs: existing.q1PoeDocs || existing.poeDocs || [],
        poeDocs: existing.poeDocs || existing.q1PoeDocs || [],
        selfScore: existing.selfScore ?? 0,
        q1Comments: existing.q1Comments || existing.comments || '',
        reviewStatus: existing.reviewStatus || 'Draft',
        reviewApprovalStatus: existing.reviewApprovalStatus || ''
      };
    });

    result = [...preserved1To11, ...mergedSingoKpis12To25];
  }

  // 23. Rebecca Tebogo Mangena (mangenart@nkangaladm.gov.za) - Unlock KPI 4 for Q1 reporting (Signed PA Annexure A)
  if (normEmail === 'mangenart@nkangaladm.gov.za' || normEmail.includes('mangenart')) {
    result = result.map((item: any, idx: number) => {
      const kNo = String(item.kpiNo || (idx + 1)).trim();
      const desc = String(item.kpi || item.description || '').toLowerCase();
      const isKpi4 = kNo === '4' || idx === 3 || desc.includes('submission of 2025/2026 annual performance evaluation');

      if (isKpi4) {
        return {
          ...item,
          kpiNo: "4",
          weighting: "3",
          baseline: "1 (annual assessment)",
          annualTarget: "1 (annual assessment)",
          q1Target: "1 (annual assessment)",
          q2Target: "N/A",
          q3Target: "N/A",
          q4Target: "N/A",
          poe: "Compliance certificate from OPME & PMDS Unit",
          annualRequiredPoe: "Compliance certificate from OPME & PMDS Unit",
          q1Poe: "Compliance certificate from OPME & PMDS Unit",
          q1Applicable: true,
          q1Locked: false,
          lockedQuarters: ['Q2', 'Q3', 'Q4'],
          budget: "OPEX"
        };
      }
      return item;
    });
  }

  // 24. Cedrive Makitla (makitlac@nkangaladm.gov.za) - Lock KPI 1 on KPA 2 for Quarter 1 (Not Applicable in Q1)
  if (normEmail === 'makitlac@nkangaladm.gov.za' || normEmail.includes('makitlac')) {
    result = result.map((item: any, idx: number) => {
      const kNo = String(item.kpiNo || '').trim();
      const kpaStr = String(item.kpa || '').toLowerCase();
      const desc = String(item.kpi || item.description || '').toLowerCase();
      const isKpa2Kpi1 =
        String(item.id || '') === 'extracted-sync-1790030926695-9' ||
        ((kpaStr.includes('kpa 2') || kpaStr.includes('supply chain')) &&
          (kNo === '1' || desc.includes('departmental procurement plan developed'))) ||
        (idx === 8 && desc.includes('departmental procurement plan developed'));

      if (isKpa2Kpi1) {
        return {
          ...item,
          q1Target: 'N/A',
          '1st qtr target': 'N/A',
          q1Locked: true,
          q1Applicable: false,
          q1Actual: '',
          actual: '',
          actualAchieved: '',
          q1Score: '',
          managerScore: '',
          review: '',
          reviewStatus: 'N/A',
          reviewApprovalStatus: '',
          q1PoeStatus: 'N/A',
          resubmittedAt: '',
          resubmissionUnlocked: false,
          lockedQuarters: Array.isArray(item.lockedQuarters)
            ? Array.from(new Set([...item.lockedQuarters, 'Q1', 'q1']))
            : ['Q1', 'q1']
        };
      }
      return item;
    });
  }

  // 25. Ms. Refilwe C. Motlhabane (motlhabanerc@nkangaladm.gov.za / mothlabanerc@nkangaladm.gov.za):
  // Unlock unsubmitted KPIs (KPIs 16 to 21, including KPI 17) that were prematurely bulk-approved with zero POE attachments and no actuals
  if (
    normEmail === 'motlhabanerc@nkangaladm.gov.za' ||
    normEmail === 'mothlabanerc@nkangaladm.gov.za' ||
    normEmail.includes('motlhabanerc') ||
    normEmail.includes('mothlabanerc')
  ) {
    result = result.map((item: any, idx: number) => {
      const kNo = String(item.kpiNo || item['kpi no'] || '').trim().toUpperCase();
      const desc = String(item.kpi || item.description || '').toLowerCase();
      if (idx === 0 || kNo === 'M_21' || desc.includes('clean audit opinion')) {
        return item;
      }
      const hasActual = Boolean(
        item.q1Actual &&
        String(item.q1Actual).trim() !== '' &&
        String(item.q1Actual).trim().toUpperCase() !== 'N/A'
      );
      const hasDocs = Array.isArray(item.q1PoeDocs) && item.q1PoeDocs.length > 0;
      const hasSelfScore = Boolean(item.q1Score && String(item.q1Score).trim() !== '' && String(item.q1Score).trim() !== '0');

      // If the employee has not yet captured an actual, self-score, or POE attachment, unlock the KPI to Draft
      if (!hasActual && !hasDocs && !hasSelfScore) {
        return {
          ...item,
          q1Applicable: true,
          q1Locked: false,
          lockedQuarters: Array.isArray(item.lockedQuarters)
            ? item.lockedQuarters.filter((q: string) => q.toUpperCase() !== 'Q1')
            : [],
          reviewStatus: 'Draft',
          reviewApprovalStatus: '',
          q1PoeStatus: 'Draft',
          managerScore: '',
          q1ManagerScore: '',
          myScore: '',
          resubmissionUnlocked: true
        };
      }
      return item;
    });
  }

  // 26. Mr. April Jackson Skosana (skosanaj@nkangaladm.gov.za):
  // Canonical 44 KPIs across 5 KPAs from his signed 2026/27 Adjusted Performance Agreement (Manager Technical Services)
  // 26. Mr. April Jackson Skosana (skosanaj@nkangaladm.gov.za):
  // Canonical 44 KPIs across 5 KPAs from his signed 2026/27 Adjusted Performance Agreement (Manager Technical Services)
  // Retains 100% of his reported actuals, self-scores, POE attachments (q1-q4), IDs, and review statuses
  if (normEmail === 'skosanaj@nkangaladm.gov.za' || normEmail.startsWith('skosanaj@')) {
    const skosanaCanonical44 = [
      // KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION (8 KPIs, 2% each) - Pages 11 & 12
      {
        origIdx: 1,
        id: 'extracted-sync-1790115582807-1',
        kpiNo: '1',
        kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION',
        strategicObjective: 'To ensure sustainable service delivery and clean audit compliance',
        weight: '2%',
        baseline: '1',
        kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026',
        annualTarget: '1',
        q1Target: '1',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: 'N/A',
        poe: 'Compliance certificate from OPME & PMDS unit',
        budget: 'OPEX'
      },
      {
        origIdx: 2,
        id: 'extracted-sync-1790115582807-2',
        kpiNo: '2',
        kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION',
        strategicObjective: 'To ensure sustainable service delivery and clean audit compliance',
        weight: '2%',
        baseline: '2',
        kpi: 'Number of performance agreements signed with subordinates and submitted to OPME & PMDS unit for the 2026/2027 financial year by 30 July 2026',
        annualTarget: '2',
        q1Target: '2',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: 'N/A',
        poe: 'Compliance certificate from OPME & PMDS unit',
        budget: 'OPEX'
      },
      {
        origIdx: 3,
        id: 'extracted-sync-1790115582807-3',
        kpiNo: '3',
        kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION',
        strategicObjective: 'To ensure sustainable service delivery and clean audit compliance',
        weight: '2%',
        baseline: '4',
        kpi: 'Number of self-assessment report compiled and submitted to Supervisor per quarter.',
        annualTarget: '4',
        q1Target: '1 (annual assessment)',
        q2Target: '1 (Q1 assessment)',
        q3Target: '1 (midyear assessment)',
        q4Target: '1 (Q3 assessment)',
        poe: 'Quarterly Compliance certificate from OPME & PMDS unit',
        budget: 'OPEX'
      },
      {
        origIdx: 4,
        id: 'extracted-sync-1790115582807-4',
        kpiNo: '4',
        kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION',
        strategicObjective: 'To ensure sustainable service delivery and clean audit compliance',
        weight: '2%',
        baseline: '1',
        kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026',
        annualTarget: '1 (annual assessment)',
        q1Target: '1 (annual assessment)',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: 'N/A',
        poe: 'Compliance certificate from OPME & PMDS unit',
        budget: 'OPEX'
      },
      {
        origIdx: 5,
        id: 'extracted-sync-1790115582807-5',
        kpiNo: '5',
        kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION',
        strategicObjective: 'To ensure sustainable service delivery and clean audit compliance',
        weight: '2%',
        baseline: '2',
        kpi: 'Number of informal performance evaluation conducted with all subordinates per quarter',
        annualTarget: '2 (Q1 & Q3)',
        q1Target: 'N/A',
        q2Target: '1 (Q1)',
        q3Target: 'N/A',
        q4Target: '1 (Q3)',
        poe: 'Compliance certificate from OPME & PMDS unit',
        budget: 'OPEX'
      },
      {
        origIdx: 6,
        id: 'extracted-sync-1790115582807-6',
        kpiNo: '6',
        kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION',
        strategicObjective: 'To ensure sustainable service delivery and clean audit compliance',
        weight: '2%',
        baseline: '4',
        kpi: 'Number of quarterly leave reconciliation report submitted to Departmental General Manager (within 30 days after end of each quarter)',
        annualTarget: '4',
        q1Target: '1',
        q2Target: '1',
        q3Target: '1',
        q4Target: '1',
        poe: 'Compliance certificate from corporate services',
        budget: 'OPEX'
      },
      {
        origIdx: 7,
        id: 'extracted-sync-1790115582807-7',
        kpiNo: '7',
        kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION',
        strategicObjective: 'To ensure sustainable service delivery and clean audit compliance',
        weight: '2%',
        baseline: '100%',
        kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027',
        annualTarget: '100%',
        q1Target: '100%',
        q2Target: '100%',
        q3Target: '100%',
        q4Target: '100%',
        poe: 'Compliance certificate from Corporate Services',
        budget: 'OPEX'
      },
      {
        origIdx: 8,
        id: 'extracted-sync-1790115582807-8',
        kpiNo: '8',
        kpa: 'KPA 1: INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION',
        strategicObjective: 'To ensure sustainable service delivery and clean audit compliance',
        weight: '2%',
        baseline: '100%',
        kpi: 'Percentage of leave approvals processed within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027',
        annualTarget: '100%',
        q1Target: '100%',
        q2Target: '100%',
        q3Target: '100%',
        q4Target: '100%',
        poe: 'Compliance certificate from Corporate Services',
        budget: 'OPEX'
      },

      // KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION (12 KPIs, 2% each) - Pages 13 & 14
      {
        origIdx: 9,
        id: 'extracted-sync-1790115582807-9',
        kpiNo: 'M_11',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '1',
        kpi: 'Number of new/reviewed policies approved by Council by 30 June 2027',
        annualTarget: '1',
        q1Target: 'N/A',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: '1',
        poe: 'Report to Council and Council Resolution(s)',
        budget: 'OPEX'
      },
      {
        origIdx: 10,
        id: 'extracted-sync-1790115582807-10',
        kpiNo: 'M_15',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '90%',
        kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (Technical Services)',
        annualTarget: '90%',
        q1Target: '90%',
        q2Target: '90%',
        q3Target: '90%',
        q4Target: '90%',
        poe: 'Signed Quarterly Strategic Risk report',
        budget: 'OPEX'
      },
      {
        origIdx: 11,
        id: 'extracted-sync-1790115582807-11',
        kpiNo: 'M_16',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '98%',
        kpi: 'Percentage of action plans implemented to address Operational Risks Identified per quarter (Technical Services)',
        annualTarget: '98%',
        q1Target: '98%',
        q2Target: '98%',
        q3Target: '98%',
        q4Target: '98%',
        poe: 'Signed Quarterly Operational Risk report',
        budget: 'OPEX'
      },
      {
        origIdx: 12,
        id: 'extracted-sync-1790115582807-12',
        kpiNo: 'M_17',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '96%',
        kpi: 'Percentage of action plans implemented to address Fraud and corruption Risks Identified per quarter (Technical Services)',
        annualTarget: '96%',
        q1Target: '96%',
        q2Target: '96%',
        q3Target: '96%',
        q4Target: '96%',
        poe: 'Signed Quarterly Fraud and corruption Risk report',
        budget: 'OPEX'
      },
      {
        origIdx: 13,
        id: 'extracted-sync-1790115582807-13',
        kpiNo: 'M_21',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '1 (Unqualified with matters)',
        kpi: 'Attain clean audit opinion by 31 December 2026.',
        annualTarget: '1 (Clean audit)',
        q1Target: 'N/A',
        q2Target: '1 (Clean audit)',
        q3Target: 'N/A',
        q4Target: 'N/A',
        poe: 'AG’s Audit Report',
        budget: 'OPEX'
      },
      {
        origIdx: 14,
        id: 'extracted-sync-1790115582807-14',
        kpiNo: 'M_22',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '≤ 0',
        kpi: 'Number of repeat audit findings (circular 88) by 30 December 2026.',
        annualTarget: '≤ 0',
        q1Target: 'N/A',
        q2Target: '≤ 0',
        q3Target: 'N/A',
        q4Target: 'N/A',
        poe: 'AG’s Audit Report',
        budget: 'OPEX'
      },
      {
        origIdx: 15,
        id: 'extracted-sync-1790115582807-15',
        kpiNo: 'M_23',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '1',
        kpi: 'Number of Action Plan on issues raised by the Auditor General tabled to Council by 30 December 2026.',
        annualTarget: '1',
        q1Target: 'N/A',
        q2Target: '1',
        q3Target: 'N/A',
        q4Target: 'N/A',
        poe: 'Audit Action Plan and Council resolution',
        budget: 'OPEX'
      },
      {
        origIdx: 16,
        id: 'extracted-sync-1790115582807-16',
        kpiNo: 'M_24',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '100%',
        kpi: 'Percentage of AG Findings raised in the Management Letter resolved (Technical Services) by 30 June 2027.',
        annualTarget: '100%',
        q1Target: 'N/A',
        q2Target: 'N/A',
        q3Target: '40%',
        q4Target: '100%',
        poe: 'Signed Progress Report on the Implementation of the Audit Action Plan.',
        budget: 'OPEX'
      },
      {
        origIdx: 17,
        id: 'extracted-sync-1790115582807-17',
        kpiNo: 'M_36',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '100%',
        kpi: 'Percentage of strategic lekgotla resolutions implemented by 30 June 2027. (Technical Services)',
        annualTarget: '100%',
        q1Target: '100%',
        q2Target: '100%',
        q3Target: '100%',
        q4Target: '100%',
        poe: 'Signed Strategic Lekgotla monitoring report',
        budget: 'OPEX'
      },
      {
        origIdx: 18,
        id: 'extracted-sync-1790115582807-18',
        kpiNo: 'M_37',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: 'New',
        kpi: 'Number of reports on Council Resolutions submitted to Council per quarter (Technical Services)',
        annualTarget: '4',
        q1Target: '1',
        q2Target: '1',
        q3Target: '1',
        q4Target: '1',
        poe: 'Signed Quarterly Reports and Council Resolution.',
        budget: 'OPEX'
      },
      {
        origIdx: 19,
        id: 'extracted-sync-1790115582807-19',
        kpiNo: 'M_40',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '100%',
        kpi: 'Percentage of internal audit recommendations implemented by 30 June 2027 (Technical Services)',
        annualTarget: '100%',
        q1Target: '100%',
        q2Target: '100%',
        q3Target: '100%',
        q4Target: '100%',
        poe: 'Signed Quarterly IA report',
        budget: 'OPEX'
      },
      {
        origIdx: 20,
        id: 'extracted-sync-1790115582807-20',
        kpiNo: 'M_41',
        kpa: 'KPA 2: GOOD GOVERNANCE AND INSTITUTION TRANSFORMATION',
        strategicObjective: 'Ensure execution of council Mandate of service delivery through efficient governance structures and Public Participation',
        weight: '2%',
        baseline: '100%',
        kpi: 'Percentage of audit committee resolutions implemented by 30 June 2027.',
        annualTarget: '100%',
        q1Target: '100%',
        q2Target: '100%',
        q3Target: '100%',
        q4Target: '100%',
        poe: 'Signed Quarterly Audit committee resolution register',
        budget: 'OPEX'
      },

      // KPA 3: LOCAL ECONOMIC DEVELOPMENT (1 KPI, 6%) - Page 15
      {
        origIdx: 21,
        id: 'extracted-sync-1790115582807-21',
        kpiNo: 'M_48',
        kpa: 'KPA 3: LOCAL ECONOMIC DEVELOPMENT (LED)',
        strategicObjective: 'Create an environment that promotes the development of the local economy and facilitates job creation',
        weight: '6%',
        baseline: '66%',
        kpi: 'Percentage of companies owned by designated group (disabilities 3%, women 32%, youth 28% and Military Veterans 3%) benefited from NDM by 30 June 2027',
        annualTarget: '66%',
        q1Target: 'N/A',
        q2Target: 'N/A',
        q3Target: '40%',
        q4Target: '66%',
        poe: 'Signed SCM Quarterly Report on designated groups who benefited from NDM (Hard copies of signed appointment letters and BEE certificate)',
        budget: 'CAPEX'
      },

      // KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT (6 KPIs, 2% each) - Page 16
      {
        origIdx: 22,
        id: 'extracted-sync-1790115582807-22',
        kpiNo: 'M_53',
        kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT',
        strategicObjective: 'To improve the financial viability and management of the Municipality',
        weight: '2%',
        baseline: '91%',
        kpi: 'Percentage of operational budget actually spent (circular 88) by 30 June 2027.',
        annualTarget: '91%',
        q1Target: '20%',
        q2Target: '40%',
        q3Target: '60%',
        q4Target: '91%',
        poe: 'Signed Operational Expenditure progress report',
        budget: 'R728 931 161'
      },
      {
        origIdx: 23,
        id: 'extracted-sync-1790115582807-23',
        kpiNo: 'M_54',
        kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT',
        strategicObjective: 'To improve the financial viability and management of the Municipality',
        weight: '2%',
        baseline: '89%',
        kpi: 'Percentage of transfer and subsidies budget actually spent on projects (local Municipalities projects) by 30 June 2027',
        annualTarget: '90%',
        q1Target: '20%',
        q2Target: '40%',
        q3Target: '60%',
        q4Target: '90%',
        poe: 'Transfer and subsidies Expenditure signed progress report',
        budget: 'R308 944 236'
      },
      {
        origIdx: -1,
        id: 'extracted-sync-1790115582807-23b-m59',
        kpiNo: 'M_59',
        kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT',
        strategicObjective: 'To improve the financial viability and management of the Municipality',
        weight: '2%',
        baseline: '1',
        kpi: 'Number of MTREF Budget submitted for approval by 31 May 2027.',
        annualTarget: '1',
        q1Target: 'N/A',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: '1',
        poe: 'Approved MTREF Budget and council resolution',
        budget: 'OPEX'
      },
      {
        origIdx: 24,
        id: 'extracted-sync-1790115582807-24',
        kpiNo: 'M_64',
        kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT',
        strategicObjective: 'To improve the financial viability and management of the Municipality',
        weight: '2%',
        baseline: '89%',
        kpi: 'Percentage implementation of the procurement plan by 30 June 2027.',
        annualTarget: '100%',
        q1Target: '100%',
        q2Target: '100%',
        q3Target: '100%',
        q4Target: '100%',
        poe: 'Signed Quarterly Procurement plan report',
        budget: 'OPEX'
      },
      {
        origIdx: 25,
        id: 'extracted-sync-1790115582807-25',
        kpiNo: 'M_66',
        kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT',
        strategicObjective: 'To improve the financial viability and management of the Municipality',
        weight: '2%',
        baseline: '100%',
        kpi: 'Percentage spent on Rural Assets Management Grant by 30 June 2027. (7302)',
        annualTarget: '100%',
        q1Target: '20%',
        q2Target: '40%',
        q3Target: '60%',
        q4Target: '100%',
        poe: 'Rural assets management grant Expenditure progress report signed off by CFO',
        budget: 'R2 659 000'
      },
      {
        origIdx: 26,
        id: 'extracted-sync-1790115582807-26',
        kpiNo: 'M_66 (b)',
        kpa: 'KPA 4: MUNICIPAL FINANCIAL VIABILITY AND MANAGEMENT',
        strategicObjective: 'To improve the financial viability and management of the Municipality',
        weight: '2%',
        baseline: '100%',
        kpi: '100% attendance at scheduled Bid Committee meetings per quarter',
        annualTarget: '100%',
        q1Target: '100%',
        q2Target: '100%',
        q3Target: '100%',
        q4Target: '100%',
        poe: 'Signed Quarterly Bid Committee Attendance Report',
        budget: 'OPEX'
      },

      // KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE (17 KPIs) - Pages 17 to 22
      {
        origIdx: 27,
        id: 'extracted-sync-1790115582807-27',
        kpiNo: 'M_67',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '4%',
        baseline: 'New',
        kpi: 'Total m² of potholes patched on municipal roads by 30 June 2027. (185538)',
        annualTarget: '4000m²',
        q1Target: '1000m²',
        q2Target: '1000m²',
        q3Target: '1000m²',
        q4Target: '1000m²',
        poe: 'Signed quarterly reports',
        budget: 'R1 413 328'
      },
      {
        origIdx: 28,
        id: 'extracted-sync-1790115582807-28',
        kpiNo: 'M_68',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '4%',
        baseline: 'New',
        kpi: 'Number of SANITATION projects (as submitted by the LM\'s) that are Completed in terms of project schedules by 30 June 2027.',
        annualTarget: '1',
        q1Target: 'N/A',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: '1',
        poe: 'Signed construction progress reports, 1 x Completion certificate',
        budget: 'R 12 732 860'
      },
      {
        origIdx: 29,
        id: 'extracted-sync-1790115582807-29',
        kpiNo: 'M_69',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '14%',
        baseline: '4',
        kpi: 'Number of WATER projects (as submitted by the LM\'s) that are Completed in terms of Project Schedules by 30 June 2027.',
        annualTarget: '7',
        q1Target: 'N/A',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: '7',
        poe: '2 x BSC resolutions, tender advert, BEC & BAC resolutions and signed appointment letter; Signed construction progress reports; 6 x Completion certificate; 1 x Appointment Letter, Signed Delivery Note(s) and Expenditure Report',
        budget: 'R261 619 047'
      },
      {
        origIdx: 30,
        id: 'extracted-sync-1790115582807-30',
        kpiNo: 'M_70',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '10%',
        baseline: '2',
        kpi: 'Number of ELECTRICITY Projects (as submitted by the LM\'s) that are Completed in terms of project schedules by 30 June 2027.',
        annualTarget: '2',
        q1Target: 'N/A',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: '2',
        poe: 'Signed construction progress reports; 2 x completion certificate',
        budget: 'R4 000 000'
      },
      {
        origIdx: 31,
        id: 'extracted-sync-1790115582807-31',
        kpiNo: 'M_71',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '4%',
        baseline: 'New',
        kpi: 'Number of roads and storm water projects (as submitted by LMs) that are completed in-terms of project schedules by 30 June 2027.',
        annualTarget: '1',
        q1Target: 'N/A',
        q2Target: 'N/A',
        q3Target: 'N/A',
        q4Target: '1',
        poe: 'Signed Road Network Assessment progress report; 1 x completion certificate',
        budget: 'R2 659 000'
      },
      {
        origIdx: 32,
        id: 'extracted-sync-1790115582807-32',
        kpiNo: 'M_72',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '4%',
        baseline: '2',
        kpi: 'Number of progress reports on households with access to basic services provided by local municipalities (Water, Sanitation, Electricity and Roads) submitted to Council by 30 June 2027',
        annualTarget: '2',
        q1Target: 'N/A',
        q2Target: '1',
        q3Target: 'N/A',
        q4Target: '1',
        poe: '2x Signed progress reports and Council resolutions',
        budget: 'Capex'
      },
      {
        origIdx: 33,
        id: 'extracted-sync-1790115582807-33',
        kpiNo: 'P_07',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '4%',
        baseline: 'Stage 3: Construction Stage',
        kpi: 'Refurbishment & Upgrading Delmas WWTW by 30 June 2027',
        location: 'Victor Khanye',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'Stage 3: Construction Stage (90%): Construction Progress',
        q2Target: 'Stage 3: Construction Stage (95%): Construction Progress',
        q3Target: 'Stage 3: Construction Stage (98%): Construction Progress',
        q4Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        poe: 'Signed Construction progress report, Completion certificate',
        budget: 'R 12 732 860.00'
      },
      {
        origIdx: 34,
        id: 'extracted-sync-1790115582807-34',
        kpiNo: 'P_08',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '2%',
        baseline: 'Stage 3: Construction Stage',
        kpi: 'Refurbishment of Emalahleni Bulk Water Infrastructure by 30 June 2027',
        location: 'Emalahleni',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'Stage 3: Construction Stage (40%): Construction Progress',
        q2Target: 'Stage 3: Construction Stage (45%): Construction Progress',
        q3Target: 'Stage 3: Construction Stage (65%): Construction Progress',
        q4Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        poe: 'Signed Construction progress report, Completion certificate',
        budget: 'R47 619 047'
      },
      {
        origIdx: 35,
        id: 'extracted-sync-1790115582807-35',
        kpiNo: 'P_09',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '2%',
        baseline: 'Stage 3: Construction Stage',
        kpi: 'Loskop Regional Bulk Water Supply: WP1 by 30 June 2027',
        location: 'Thembisile Hani',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'Stage 3: Construction Stage (80%): Construction Progress',
        q2Target: 'Stage 3: Construction Stage (90%): Construction Progress',
        q3Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        q4Target: 'N/A',
        poe: 'Signed Construction progress report, Completion certificate',
        budget: 'R213 500 000'
      },
      {
        origIdx: 36,
        id: 'extracted-sync-1790115582807-36',
        kpiNo: 'P_10',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '2%',
        baseline: 'Stage 3: Construction Stage',
        kpi: 'Loskop Regional Bulk Water Supply: WP2 by 30 June 2027',
        location: 'Thembisile Hani',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'Stage 3: Construction Stage (95%): Construction Progress',
        q2Target: 'Stage 3: Construction Stage (98%): Construction Progress',
        q3Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        q4Target: 'N/A',
        poe: 'Signed Construction progress report, Completion certificate',
        budget: 'Capital Project'
      },
      {
        origIdx: 37,
        id: 'extracted-sync-1790115582807-37',
        kpiNo: 'P_11',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '2%',
        baseline: 'Stage 3: Construction Stage',
        kpi: 'Loskop Regional Bulk Water Supply: WP3 by 30 June 2027',
        location: 'Thembisile Hani',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'Stage 3: Construction Stage (90%): Construction Progress',
        q2Target: 'Stage 3: Construction Stage (95%): Construction Progress',
        q3Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        q4Target: 'N/A',
        poe: 'Signed Construction progress report, Completion certificate',
        budget: 'Capital Project'
      },
      {
        origIdx: 38,
        id: 'extracted-sync-1790115582807-38',
        kpiNo: 'P_12',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '2%',
        baseline: 'Stage 3: Construction Stage',
        kpi: 'Loskop Regional Bulk Water Supply: WP6(A) by 30 June 2027',
        location: 'Thembisile Hani',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'N/A',
        q2Target: 'Construction Stage (20%): Construction Progress',
        q3Target: 'Stage 3: Construction Stage (60%): Construction Progress',
        q4Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        poe: 'Signed Construction progress report, Completion certificate',
        budget: 'Capital Project'
      },
      {
        origIdx: 39,
        id: 'extracted-sync-1790115582807-39',
        kpiNo: 'P_13',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '2%',
        baseline: 'Stage 1: Planning and Design Stage',
        kpi: 'Loskop Regional Bulk Water Supply: WP6 (B) by 30 June 2027',
        location: 'Thembisile Hani',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'Stage 1 – Planning and Design Stage (100%): BSC Resolutions',
        q2Target: 'Stage 2 – Procurement Stage (100%): Advert, BEC&BAC Resolutions Contractor’s Appointment Letter',
        q3Target: 'Stage 3: Construction Stage (70%): Construction Progress',
        q4Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        poe: 'Signed Construction progress report, Completion certificate',
        budget: 'Capital Project'
      },
      {
        origIdx: 40,
        id: 'extracted-sync-1790115582807-40',
        kpiNo: 'P_14',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '2%',
        baseline: 'Stage 2: Procurement Stage',
        kpi: 'Borehole Materials: Dr JS Moroka',
        location: 'Dr JS Moroka',
        annualTarget: 'Stage 3: Implementation Stage (100%): Expenditure Progress',
        q1Target: 'Stage 2 – Procurement Stage (100%): Appointment of Contractor',
        q2Target: 'Stage 3: Implementation Stage (40%): Expenditure Progress',
        q3Target: 'Stage 3: Implementation Stage (70%): Expenditure Progress',
        q4Target: 'Stage 3: Implementation Stage (100%): Expenditure Progress',
        poe: 'Appointment Letter, Signed Delivery Note(s) and Expenditure Report',
        budget: 'R500 000'
      },
      {
        origIdx: 41,
        id: 'extracted-sync-1790115582807-41',
        kpiNo: 'P_15',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '4%',
        baseline: 'Stage 2: Implementation Stage',
        kpi: 'Rural Road Asset Management by 30 June 2027. (7302)',
        location: 'District Wide',
        annualTarget: 'Stage 2: Implementation Stage (100%): Road Network Assessment',
        q1Target: 'Stage 2: Implementation Stage (75%): Road Network Assessment',
        q2Target: 'Stage 2: Implementation Stage (85%): Road Network Assessment',
        q3Target: 'Stage 2: Implementation Stage (95%): Road Network Assessment',
        q4Target: 'Stage 2: Implementation Stage (100%): Road Network Assessment',
        poe: 'Signed Road Network Assessment progress reports, Completion certificate',
        budget: 'R2 659 000'
      },
      {
        origIdx: 42,
        id: 'extracted-sync-1790115582807-42',
        kpiNo: 'P_16',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '5%',
        baseline: 'Stage 1: Planning Stage',
        kpi: 'High mast Lights Retrofitting by 30 June 2026',
        location: 'Victor Khanye LM',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'Stage 1: Planning Stage (100%): Approved Business plan',
        q2Target: 'Stage 3: Construction Stage (30%): Construction Progress',
        q3Target: 'Stage 3: Construction Stage (60%): Construction Progress',
        q4Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        poe: 'Signed Construction progress report and completion certificate, Approved Business plan',
        budget: 'R 2 000'
      },
      {
        origIdx: 43,
        id: 'extracted-sync-1790115582807-43',
        kpiNo: 'P_17',
        kpa: 'KPA 5 - BASIC SERVICE DELIVERY AND INFRASTRUCTURE',
        strategicObjective: 'To provide sustainable and reliable basic services and infrastructure to communities',
        weight: '5%',
        baseline: 'Stage 1: Planning Stage',
        kpi: 'High mast Lights Retrofitting by 30 June 2026',
        location: 'Dr JS Moroka LM',
        annualTarget: 'Stage 3: Construction Stage (100%): Construction Progress',
        q1Target: 'Stage 1: Planning Stage (100%): Approved Business plan',
        q2Target: 'Stage 3: Construction Stage (30%): Construction Progress',
        q3Target: 'Stage 3: Construction Stage (60%): Construction Progress',
        q4Target: 'Stage 3: Construction Stage (100%): Construction Progress',
        poe: 'Signed Construction progress report and completion certificate, Approved Business plan',
        budget: 'R 2 000'
      }
    ];

    result = skosanaCanonical44.map((canon) => {
      const existing = result.find((it: any) => String(it?.id || '') === canon.id) ||
        (canon.origIdx > 0 ? result.find((it: any) => String(it?.id || '').endsWith(`-${canon.origIdx}`)) : null) ||
        result.find((it: any) => String(it?.kpiNo || it?.['kpi no'] || '').trim().toUpperCase() === canon.kpiNo.toUpperCase());

      const q1NotApplicable = canon.q1Target.toUpperCase() === 'N/A';
      return {
        ...(existing || {}),
        id: existing?.id || canon.id,
        kpiNo: canon.kpiNo,
        'kpi no': canon.kpiNo,
        refNumber: canon.kpiNo,
        kpa: canon.kpa,
        strategicObjective: canon.strategicObjective,
        objective: canon.strategicObjective,
        weight: canon.weight,
        weighting: canon.weight,
        baseline: canon.baseline,
        kpi: canon.kpi,
        description: canon.kpi,
        annualTarget: canon.annualTarget,
        target: canon.annualTarget,
        q1Target: canon.q1Target,
        q2Target: canon.q2Target,
        q3Target: canon.q3Target,
        q4Target: canon.q4Target,
        poe: canon.poe,
        portfolioOfEvidence: canon.poe,
        meansOfVerification: canon.poe,
        budget: canon.budget,
        location: (canon as any).location || existing?.location || 'Nkangala District',
        q1Applicable: existing?.q1Applicable !== undefined ? existing.q1Applicable : !q1NotApplicable,
        // PRESERVED 100% OF ACTUALS
        q1Actual: existing?.q1Actual ?? '',
        q2Actual: existing?.q2Actual ?? '',
        q3Actual: existing?.q3Actual ?? '',
        q4Actual: existing?.q4Actual ?? '',
        annualActual: existing?.annualActual ?? '',
        actualPerformance: existing?.actualPerformance ?? existing?.q1Actual ?? '',
        // PRESERVED 100% OF SCORES
        q1Score: existing?.q1Score ?? '',
        myScore: existing?.myScore ?? existing?.q1Score ?? '',
        managerScore: existing?.managerScore ?? '',
        q1ManagerScore: existing?.q1ManagerScore ?? existing?.managerScore ?? '',
        // PRESERVED 100% OF UPLOADED POE FILES
        q1PoeDocs: Array.isArray(existing?.q1PoeDocs) ? existing.q1PoeDocs : [],
        q2PoeDocs: Array.isArray(existing?.q2PoeDocs) ? existing.q2PoeDocs : [],
        q3PoeDocs: Array.isArray(existing?.q3PoeDocs) ? existing.q3PoeDocs : [],
        q4PoeDocs: Array.isArray(existing?.q4PoeDocs) ? existing.q4PoeDocs : [],
        annualPoeDocs: Array.isArray(existing?.annualPoeDocs) ? existing.annualPoeDocs : [],
        midtermPoeDocs: Array.isArray(existing?.midtermPoeDocs) ? existing.midtermPoeDocs : [],
        // PRESERVED COMMENTS
        q1Comments: existing?.q1Comments || '',
        q2Comments: existing?.q2Comments || '',
        q3Comments: existing?.q3Comments || '',
        q4Comments: existing?.q4Comments || '',
        reviewStatus: existing?.reviewStatus || 'Draft',
        reviewApprovalStatus: existing?.reviewApprovalStatus || '',
        q1PoeStatus: existing?.q1PoeStatus || (existing?.reviewStatus === 'Submitted for Approval' ? 'Submitted for Approval' : 'Draft'),
        manager: 'Walter Mavundla Mtshweni',
        managerEmail: 'mtshweniwm@nkangaladm.gov.za'
      };
    });
  }

  // 27. Jetpatchers / Technical Services Team 10 (ntulimp, mahlangua, skosanac, mananamn, nsingwaneb, mahlanguss, dept_team_technical_services_team_10):
  // Strictly enforce the 9 official Team 10 Jetpatcher KPIs and stamp line manager as Mxolisi AVM Bembe (bembem@nkangaladm.gov.za)
  const jetpatcherEmails = [
    'ntulimp@nkangaladm.gov.za',
    'mahlangua@nkangaladm.gov.za',
    'skosanac@nkangaladm.gov.za',
    'mananamn@nkangaladm.gov.za',
    'nsingwaneb@nkangaladm.gov.za',
    'mahlanguss@nkangaladm.gov.za',
    'dept_team_technical_services_team_10'
  ];
  if (jetpatcherEmails.includes(normEmail)) {
    const jetpatcherCanonical9 = [
      { id: 'extracted-sync-1796516244137-0', kpiNo: 'M_21', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 5, baseline: '1', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: "AG’s Audit Report", budget: 'OPEX', kpi: 'Maintain clean audit opinion by 30 December 2026', matchKey: 'clean audit opinion' },
      { id: 'extracted-sync-1796516244137-1', kpiNo: 'KPI-2', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 4, baseline: '1', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit', budget: 'OPEX', kpi: 'Compile and sign the annual performance agreement for the 2025/2026 financial year and submit to OPME & PMDS unit by 30 July 2026', matchKey: 'compile and sign the annual performance agreement' },
      { id: 'extracted-sync-1796516244137-2', kpiNo: 'KPI-3', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 3, baseline: '4', annualTarget: '4', q1Target: '1 (annual assessment)', q2Target: '1 (Q1 assessment)', q3Target: '1 (midyear assessment)', q4Target: '1 (Q3 assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS Unit', budget: 'OPEX', kpi: 'Number of self-assessment reports compiled and submitted to Supervisor per quarter.', matchKey: 'self-assessment reports compiled' },
      { id: 'extracted-sync-1796516244137-3', kpiNo: 'KPI-4', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 4, baseline: '1', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS Unit', budget: 'OPEX', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026', matchKey: 'annual performance evaluation on e-pms' },
      { id: 'extracted-sync-1796516244137-4', kpiNo: 'KPI-5', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: 6, baseline: 'New', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services', budget: 'OPEX', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027.', matchKey: 'leave requests captured on the system' },
      { id: 'extracted-sync-1796516244137-5', kpiNo: 'M_67', kpa: 'KPA 2: BASIC SERVICE DELIVERY AND INFRASTRUCTURE', weight: 15, baseline: 'New', annualTarget: '4000 m2', q1Target: '1000 m2', q2Target: '1000 m2', q3Target: '1000 m2', q4Target: '1000 m2', poe: 'Signed Quarterly reports', budget: 'R1 413 328', kpi: 'Total m2 of potholes patched on municipal roads by 30 June 2027', matchKey: 'potholes patched on municipal roads' },
      { id: 'extracted-sync-1796516244137-6', kpiNo: 'KPI-7', kpa: 'KPA 3: MANAGEMENT OF MAINTENANCE PLAN', weight: 20, baseline: 'New', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Monthly road maintenance reports', budget: 'OPEX', kpi: 'Number of monthly reports on Road Maintenance submitted to the Supervisor by 30 June 2027', matchKey: 'reports on road maintenance' },
      { id: 'extracted-sync-1796516244137-7', kpiNo: 'KPI-8', kpa: 'KPA 4: REPORTING ON WORKPLACE SAFETY', weight: 20, baseline: 'New', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Monthly condition assessment reports', budget: 'OPEX', kpi: 'Number of monthly reports submitted on the condition assessment of machinery, tools and equipment submitted to the Supervisor by 30 June 2027', matchKey: 'condition assessment of machinery' },
      { id: 'extracted-sync-1796516244137-8', kpiNo: 'KPI-9', kpa: 'KPA 5: MEETING MANAGEMENT', weight: 20, baseline: 'New', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Attendance register', budget: 'OPEX', kpi: 'Number of unit monthly meetings attendant for the 2026 / 2027 financial year', matchKey: 'unit monthly meetings attendant' }
    ];

    result = jetpatcherCanonical9.map((canon) => {
      const existing = result.find((it: any) => {
        const itId = String(it?.id || '').trim();
        const d = String(it?.kpiDescription || it?.['kpi description'] || it?.kpi || it?.description || '').toLowerCase();
        if (itId.startsWith('ipp-kpi-1790274038476-')) return false;
        if (d.includes('organisational performance management system') || d.includes('council resolutions') || d.includes('back to basics') || d.includes('sdbip')) return false;
        return itId === canon.id || d.includes(canon.matchKey);
      });
      const isQ1Na = canon.q1Target.toUpperCase() === 'N/A';
      const isQ2Na = canon.q2Target.toUpperCase() === 'N/A';
      const isQ3Na = canon.q3Target.toUpperCase() === 'N/A';
      const isQ4Na = canon.q4Target.toUpperCase() === 'N/A';
      const hasReportedEvidence = !isQ1Na && Boolean(
        (existing?.q1Actual && String(existing.q1Actual).trim() !== '' && String(existing.q1Actual).trim().toUpperCase() !== 'N/A') ||
        (Array.isArray(existing?.q1PoeDocs) && existing.q1PoeDocs.length > 0)
      );
      const currentRevStatus = String(existing?.reviewStatus || '').trim();
      const effectiveReviewStatus = isQ1Na
        ? 'N/A'
        : (!hasReportedEvidence
            ? 'Draft'
            : (currentRevStatus === 'Approved' || currentRevStatus === 'Revision Requested' || currentRevStatus === 'Rejected'
                ? currentRevStatus
                : 'Submitted for Approval'));
      const effectiveApprovalStatus = isQ1Na || !hasReportedEvidence
        ? ''
        : (effectiveReviewStatus === 'Submitted for Approval'
            ? 'Pending'
            : (existing?.reviewApprovalStatus || effectiveReviewStatus));

      return {
        ...(existing || {}),
        id: canon.id,
        kpiNo: canon.kpiNo,
        'kpi no': canon.kpiNo,
        kpa: canon.kpa,
        functionalKpa: canon.kpa,
        'functional kpa': canon.kpa,
        kpi: canon.kpi,
        description: canon.kpi,
        kpiDescription: canon.kpi,
        'kpi description': canon.kpi,
        indicator: canon.kpi,
        weight: canon.weight,
        weighting: String(canon.weight),
        '%wt': String(canon.weight),
        baseline: canon.baseline,
        'baseline 2025/26': canon.baseline,
        annualTarget: canon.annualTarget,
        'annual target': canon.annualTarget,
        q1Target: canon.q1Target,
        '1st qtr target': canon.q1Target,
        q2Target: canon.q2Target,
        '2nd qtr target': canon.q2Target,
        q3Target: canon.q3Target,
        '3rd qtr target': canon.q3Target,
        q4Target: canon.q4Target,
        '4th qtr target': canon.q4Target,
        poe: `Q1: ${canon.poe}\nQ2: ${canon.poe}\nQ3: ${canon.poe}\nQ4: ${canon.poe}`,
        annualRequiredPoe: canon.poe,
        q1Poe: canon.poe,
        q2Poe: canon.poe,
        midtermPoe: canon.poe,
        q3Poe: canon.poe,
        q4Poe: canon.poe,
        budget: canon.budget,
        q1Locked: isQ1Na,
        q2Locked: isQ2Na,
        q3Locked: isQ3Na,
        q4Locked: isQ4Na,
        q1Applicable: !isQ1Na,
        q1Actual: isQ1Na ? '' : (existing?.q1Actual || ''),
        q1PoeDocs: isQ1Na ? [] : (Array.isArray(existing?.q1PoeDocs) ? existing.q1PoeDocs : []),
        reviewStatus: effectiveReviewStatus,
        reviewApprovalStatus: effectiveApprovalStatus,
        q1PoeStatus: isQ1Na
          ? 'N/A'
          : (!hasReportedEvidence
              ? 'Draft'
              : (effectiveReviewStatus === 'Approved' ? 'Approved' : 'Pending Verification')),
        manager: 'Mxolisi AVM Bembe',
        managerEmail: 'bembem@nkangaladm.gov.za',
        reportTo: 'Mxolisi AVM Bembe'
      };
    });
  }

  // 28. Mr. Sibusiso P.L. Myeni (myenispl@nkangaladm.gov.za):
  // Canonical 13 personal KPIs across 5 KPAs from his signed 2026/27 Performance Agreement (Disaster Management Officer)
  // Reporting to Mr. Elmon Nkosi (nkosije@nkangaladm.gov.za)
  // Retains 100% of reported actuals, self-scores, POE attachments, and review statuses
  if (!normEmail.endsWith('_team') && (normEmail === 'myenispl@nkangaladm.gov.za' || normEmail === 'myenispl@nkangaldm.gov.za' || normEmail.startsWith('myenispl@'))) {
    const myeniCanonical13 = [
      { origIdx: 1, id: 'myeni-personal-kpi-1', kpiNo: 'M_21', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '10%', baseline: '1', kpi: 'Attain clean audit opinion by 31 December 2026.', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'AG Audit report', budget: 'OPEX' },
      { origIdx: 2, id: 'myeni-personal-kpi-2', kpiNo: '2', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '5%', baseline: '1', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Performance Agreement', budget: 'OPEX' },
      { origIdx: 3, id: 'myeni-personal-kpi-3', kpiNo: '3', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '5%', baseline: '1', kpi: 'Number of performance agreements signed with subordinates and submitted to OPME & PMDS unit for the 2026/2027 financial year by 30 July 2026', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Subordinate Performance Agreements', budget: 'OPEX' },
      { origIdx: 4, id: 'myeni-personal-kpi-4', kpiNo: '4', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '3%', baseline: '4', kpi: 'Number of self-assessment reports compiled and submitted to Supervisor per quarter.', annualTarget: '4', q1Target: '1 (annual assessment)', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly Self-Assessment Report', budget: 'OPEX' },
      { origIdx: 5, id: 'myeni-personal-kpi-5', kpiNo: '5', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '3%', baseline: '1', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026', annualTarget: '1', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'E-PMS Annual Evaluation Submission Proof', budget: 'OPEX' },
      { origIdx: 6, id: 'myeni-personal-kpi-6', kpiNo: '6', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '3%', baseline: '4', kpi: 'Number of informal performance evaluation conducted with all subordinates per quarter', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Quarterly Subordinate Review Minutes', budget: 'OPEX' },
      { origIdx: 7, id: 'myeni-personal-kpi-7', kpiNo: '7', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '3%', baseline: '100%', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Leave System Summary Report', budget: 'OPEX' },
      { origIdx: 8, id: 'myeni-personal-kpi-8', kpiNo: '8', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '3%', baseline: '100%', kpi: 'Percentage of leave approvals processed within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Leave Approval Summary Report', budget: 'OPEX' },
      { origIdx: 9, id: 'myeni-personal-kpi-9', kpiNo: '9', kpa: 'KPA 2: CO-ORDINATION OF DISASTER MANAGEMENT PROGRAMMES', weight: '15%', baseline: '4', kpi: 'Number of Community-Based campaigns conducted by 30 June 2027 (Disaster Risk Reduction Awareness, MHS & Environmental Management Awareness and Climate change awareness )', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Campaign Reports & Attendance Registers', budget: 'OPEX' },
      { origIdx: 10, id: 'myeni-personal-kpi-10', kpiNo: '10', kpa: 'KPA 2: CO-ORDINATION OF DISASTER MANAGEMENT PROGRAMMES', weight: '15%', baseline: '4', kpi: 'Number of NDM Disaster Management Centre reports complied per quarter', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'NDM Centre Quarterly Reports', budget: 'OPEX' },
      { origIdx: 11, id: 'myeni-personal-kpi-11', kpiNo: '11', kpa: 'KPA 3: OPERATIONS, RESPONSE AND RECOVERY', weight: '10%', baseline: '100%', kpi: '% of assisted victims of disaster with available support by 30 June 2027', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Disaster Incident & Relief Register', budget: 'OPEX' },
      { origIdx: 12, id: 'myeni-personal-kpi-12', kpiNo: '12', kpa: 'KPA 4: MEETINGS AND INFORMATION SHARING', weight: '20%', baseline: '4', kpi: 'Number of Disaster Management Advisory Forums attended by 30 June 2027', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Forum Agendas & Attendance Registers', budget: 'OPEX' },
      { origIdx: 13, id: 'myeni-personal-kpi-13', kpiNo: '13', kpa: 'KPA 5: SAFETY SERVICES', weight: '5%', baseline: '4', kpi: 'Number of Community Safety forums attended by 30 June 2027', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Safety Forum Attendance Registers', budget: 'OPEX' }
    ];

    result = myeniCanonical13.map((canon) => {
      const existing = result.find((it: any) => String(it?.id || '') === canon.id) ||
        result.find((it: any) => String(it?.kpiNo || it?.['kpi no'] || '').trim().toUpperCase() === canon.kpiNo.toUpperCase()) ||
        result.find((it: any) => {
          const d = String(it?.kpi || it?.description || it?.kpiDescription || '').toLowerCase();
          return d.slice(0, 30) === canon.kpi.toLowerCase().slice(0, 30);
        });

      const q1NotApplicable = canon.q1Target.toUpperCase() === 'N/A';
      return {
        ...(existing || {}),
        id: existing?.id || canon.id,
        kpiNo: canon.kpiNo,
        'kpi no': canon.kpiNo,
        kpa: canon.kpa,
        functionalKpa: canon.kpa,
        'functional kpa': canon.kpa,
        weight: canon.weight,
        weighting: canon.weight,
        '%wt': canon.weight,
        baseline: canon.baseline,
        kpi: canon.kpi,
        description: canon.kpi,
        kpiDescription: canon.kpi,
        annualTarget: canon.annualTarget,
        target: canon.annualTarget,
        q1Target: canon.q1Target,
        q2Target: canon.q2Target,
        q3Target: canon.q3Target,
        q4Target: canon.q4Target,
        poe: canon.poe,
        meansOfVerification: canon.poe,
        budget: canon.budget,
        q1Applicable: existing?.q1Applicable !== undefined ? existing.q1Applicable : !q1NotApplicable,
        q1Actual: existing?.q1Actual ?? '',
        q2Actual: existing?.q2Actual ?? '',
        q3Actual: existing?.q3Actual ?? '',
        q4Actual: existing?.q4Actual ?? '',
        q1Score: existing?.q1Score ?? '',
        myScore: existing?.myScore ?? existing?.q1Score ?? '',
        managerScore: existing?.managerScore ?? '',
        q1ManagerScore: existing?.q1ManagerScore ?? existing?.managerScore ?? '',
        q1PoeDocs: Array.isArray(existing?.q1PoeDocs) ? existing.q1PoeDocs : [],
        reviewStatus: existing?.reviewStatus || 'Draft',
        reviewApprovalStatus: existing?.reviewApprovalStatus || '',
        q1PoeStatus: existing?.q1PoeStatus || (existing?.reviewStatus === 'Submitted for Approval' ? 'Submitted for Approval' : 'Draft'),
        manager: 'Elmon Nkosi',
        managerEmail: 'nkosije@nkangaladm.gov.za',
        reportTo: 'Elmon Nkosi'
      };
    });
  }

  // 29. Mr. Ali Simon Msiza (msizaas@nkangaladm.gov.za / msizaas@nkangala.gov.za):
  // Canonical 42 KPIs across 6 KPAs from his signed 2026/27 Performance Agreement (Manager: Finance)
  // Reporting to CFO Alice Stander (standeral@nkangaladm.gov.za)
  if (normEmail === 'msizaas@nkangaladm.gov.za' || normEmail === 'msizaas@nkangala.gov.za' || normEmail.startsWith('msizaas@')) {
    const msizaCanonical42 = [
      // KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION (Weighting: 35%)
      { origIdx: 1, id: 'msiza-finance-kpi-1', kpiNo: 'M_11', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '22', kpi: 'Number of new/reviewed policies approved by Council by 30 June 2027', annualTarget: '22', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '22', poe: 'Report to Council and Council Resolution(s)', budget: 'OPEX' },
      { origIdx: 2, id: 'msiza-finance-kpi-2', kpiNo: 'M_15', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '80', kpi: 'Percentage of action plans implemented to address Strategic Risks Identified per quarter (Finance)', annualTarget: '90%', q1Target: '90%', q2Target: '90%', q3Target: '90%', q4Target: '90%', poe: 'Signed Quarterly Strategic Risk report', budget: 'OPEX' },
      { origIdx: 3, id: 'msiza-finance-kpi-3', kpiNo: 'M_16', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '93', kpi: 'Percentage of action plans implemented to address Operational Risks Identified per quarter (Finance)', annualTarget: '98%', q1Target: '98%', q2Target: '98%', q3Target: '98%', q4Target: '98%', poe: 'Signed Quarterly Operational Risk report', budget: 'OPEX' },
      { origIdx: 4, id: 'msiza-finance-kpi-4', kpiNo: 'M_17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '83', kpi: 'Percentage of action plans implemented to address Fraud and corruption Risks Identified per quarter (Finance)', annualTarget: '96%', q1Target: '96%', q2Target: '96%', q3Target: '96%', q4Target: '96%', poe: 'Signed Quarterly Fraud and corruption Risk report', budget: 'OPEX' },
      { origIdx: 5, id: 'msiza-finance-kpi-5', kpiNo: 'M_21', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '15%', weighting: '15', baseline: '1 (Unqualified with matters)', kpi: 'Attain clean audit opinion by 31 December 2026.', annualTarget: '1 (Clean audit)', q1Target: 'N/A', q2Target: '1 (Clean audit)', q3Target: 'N/A', q4Target: 'N/A', poe: "AG’s Audit Report", budget: 'OPEX' },
      { origIdx: 6, id: 'msiza-finance-kpi-6', kpiNo: 'M_22', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '25', kpi: 'Number of repeat audit findings (circular 88) by 30 December 2026.', annualTarget: '≤ 0', q1Target: 'N/A', q2Target: '≤ 0', q3Target: 'N/A', q4Target: 'N/A', poe: "AG’s Audit Report", budget: 'OPEX' },
      { origIdx: 7, id: 'msiza-finance-kpi-7', kpiNo: 'M_23', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '1', kpi: 'Number of Action Plan on issues raised by the Auditor General tabled to Council by 30 December 2026.', annualTarget: '1', q1Target: 'N/A', q2Target: '1', q3Target: 'N/A', q4Target: 'N/A', poe: 'Audit Action Plan and Council resolution', budget: 'OPEX' },
      { origIdx: 8, id: 'msiza-finance-kpi-8', kpiNo: 'M_24', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '100%', kpi: 'Percentage of AG Findings raised in the Management Letter resolved (Finance) by 30 June 2027.', annualTarget: '100%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '40%', q4Target: '100%', poe: 'Signed Progress Report on the Implementation of the Audit Action Plan.', budget: 'OPEX' },
      { origIdx: 9, id: 'msiza-finance-kpi-9', kpiNo: 'M_36', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '100%', kpi: 'Percentage of strategic lekgotla resolutions implemented by 30 June 2027. (Finance)', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Strategic Lekgotla monitoring report', budget: 'OPEX' },
      { origIdx: 10, id: 'msiza-finance-kpi-10', kpiNo: 'M_37', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: 'New', kpi: 'Number of reports on Council Resolutions submitted to Council per quarter (Finance)', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Quarterly Reports and Council Resolution.', budget: 'OPEX' },
      { origIdx: 11, id: 'msiza-finance-kpi-11', kpiNo: 'M_40', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '82%', kpi: 'Percentage of internal audit recommendations implemented by 30 June 2027 (Finance)', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly IA report', budget: 'OPEX' },
      { origIdx: 12, id: 'msiza-finance-kpi-12', kpiNo: 'M_41', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '100', kpi: 'Percentage of audit committee resolutions implemented by 30 June 2027.', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Audit committee resolution register', budget: 'OPEX' },
      { origIdx: 13, id: 'msiza-finance-kpi-13', kpiNo: '13', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '1', kpi: 'Compile and sign the annual performance agreement for the 2026/2027 financial year and submit to OPME & PMDS unit by 30 July 2026', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },
      { origIdx: 14, id: 'msiza-finance-kpi-14', kpiNo: '14', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '4', kpi: 'Number of performance agreements signed with subordinates and submitted to OPME & PMDS unit for the 2026/2027 financial year by 30 July 2026', annualTarget: '4', q1Target: '4', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },
      { origIdx: 15, id: 'msiza-finance-kpi-15', kpiNo: '15', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '4', kpi: 'Number of self-assessment report compiled and submitted to Supervisor per quarter.', annualTarget: '4', q1Target: '1 (annual assessment)', q2Target: '1 (Q1 assessment)', q3Target: '1 (midyear assessment)', q4Target: '1 (Q3 assessment)', poe: 'Quarterly Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },
      { origIdx: 16, id: 'msiza-finance-kpi-16', kpiNo: '16', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '1', kpi: 'Submission of 2025/2026 Annual performance evaluation on E-PMS by 29 August 2026', annualTarget: '1 (annual assessment)', q1Target: '1 (annual assessment)', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },
      { origIdx: 17, id: 'msiza-finance-kpi-17', kpiNo: '17', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '4', kpi: 'Number of informal performance evaluation conducted with all subordinates per quarter', annualTarget: '2 (Q1 & Q3)', q1Target: 'N/A', q2Target: '1 (Q1)', q3Target: 'N/A', q4Target: '1 (Q3)', poe: 'Compliance certificate from OPME & PMDS unit', budget: 'OPEX' },
      { origIdx: 18, id: 'msiza-finance-kpi-18', kpiNo: '18', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '4', kpi: 'Number of quarterly leave reconciliation report submitted to Departmental General Manager (within 30 days after end of each quarter)', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Compliance certificate from corporate services', budget: 'OPEX' },
      { origIdx: 19, id: 'msiza-finance-kpi-19', kpiNo: '19', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '100%', kpi: 'Percentage of leave requests captured on the system within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services', budget: 'OPEX' },
      { origIdx: 20, id: 'msiza-finance-kpi-20', kpiNo: '20', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: '100%', kpi: 'Percentage of leave approvals processed within the prescribed timeframes, in accordance with the Leave Management Policy, by 30 June 2027.', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Compliance certificate from Corporate Services', budget: 'OPEX' },
      { origIdx: 21, id: 'msiza-finance-kpi-21', kpiNo: '21', kpa: 'KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION', weight: '1%', weighting: '1', baseline: 'New', kpi: 'Number of departmental Training Needs Analysis submitted (TNA) by 30 March 2027', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Compliance Certificate issued by HRM&D Unit.', budget: 'OPEX' },

      // KPA 2: FINANCIAL VIABILITY (Weighting: 10%)
      { origIdx: 22, id: 'msiza-finance-kpi-22', kpiNo: '22', kpa: 'KPA 2: FINANCIAL VIABILITY AND MANAGEMENT', weight: '4%', weighting: '4', baseline: '1', kpi: 'Submission of the Annual Financial Statements to Auditor General by 31 August 2025', annualTarget: '1', q1Target: '1', q2Target: 'N/A', q3Target: 'N/A', q4Target: 'N/A', poe: 'Signed Annual financial Statement and Acknowledgement of receipt from AG.', budget: 'N/A' },
      { origIdx: 23, id: 'msiza-finance-kpi-23', kpiNo: '23', kpa: 'KPA 2: FINANCIAL VIABILITY AND MANAGEMENT', weight: '4%', weighting: '4', baseline: '1', kpi: 'Submission of Interim Annual Financial Statements by 28 Feb 2026', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Interim AFS and acknowledgement form IA', budget: 'N/A' },
      { origIdx: 24, id: 'msiza-finance-kpi-24', kpiNo: '24', kpa: 'KPA 2: FINANCIAL VIABILITY AND MANAGEMENT', weight: '1%', weighting: '1', baseline: '1.07:1', kpi: 'Current Ratio expressed as current assets / current liabilities (GKPI) per quarter', annualTarget: '1.0:1', q1Target: '1.0:1', q2Target: '1.0:1', q3Target: '1.0:1', q4Target: '1.0:1', poe: 'Signed Quarterly Section 52 Report ( Current Ratio)', budget: 'N/A' },
      { origIdx: 25, id: 'msiza-finance-kpi-25', kpiNo: '25', kpa: 'KPA 2: FINANCIAL VIABILITY AND MANAGEMENT', weight: '1%', weighting: '1', baseline: '12', kpi: 'Number of monthly investment reports prepared and submitted to the MM by 30 June 2026', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Monthly Investment reports', budget: 'N/A' },

      // KPA 3: SUPPLY CHAIN MANAGEMENT (Weighting: 15%)
      { origIdx: 26, id: 'msiza-finance-kpi-26', kpiNo: 'M_64', kpa: 'KPA 3: SUPPLY CHAIN MANAGEMENT', weight: '2%', weighting: '2', baseline: '86%', kpi: 'Percentage implementation of the procurement plan by 30 June 2027.', annualTarget: '90%', q1Target: '90%', q2Target: '90%', q3Target: '90%', q4Target: '90%', poe: 'Signed Quarterly Procurement plan report', budget: 'OPEX' },
      { origIdx: 27, id: 'msiza-finance-kpi-27', kpiNo: '27', kpa: 'KPA 3: SUPPLY CHAIN MANAGEMENT', weight: '5%', weighting: '5', baseline: '100%', kpi: '100% attendance at scheduled Bid Committee meetings per quarter', annualTarget: '100%', q1Target: '100%', q2Target: '100%', q3Target: '100%', q4Target: '100%', poe: 'Signed Quarterly Bid Committee Attendance Report', budget: 'OPEX' },
      { origIdx: 28, id: 'msiza-finance-kpi-28', kpiNo: '28', kpa: 'KPA 3: SUPPLY CHAIN MANAGEMENT', weight: '5%', weighting: '5', baseline: 'New', kpi: 'Average number of days from the point of advertising to the letter of award per 80/20 procurement process (circular 88) by 30 June 2025', annualTarget: '120 Days', q1Target: '120 Days', q2Target: '120 Days', q3Target: '120 Days', q4Target: '120 Days', poe: 'Signed Average number of days SCM report', budget: 'N/A' },
      { origIdx: 29, id: 'msiza-finance-kpi-29', kpiNo: '29', kpa: 'KPA 3: SUPPLY CHAIN MANAGEMENT', weight: '3%', weighting: '3', baseline: 'New', kpi: 'Percentage of total municipal operating expenditure spent on contracted services physically residing within the municipal area (circular 88) by 30 June 2025', annualTarget: '10%', q1Target: 'N/A', q2Target: 'N/A', q3Target: '10%', q4Target: '10%', poe: 'Reports on Contracted Services', budget: 'NA' },

      // KPA 4: BUDGET AND REPORTING (Weighting: 20%)
      { origIdx: 30, id: 'msiza-finance-kpi-30', kpiNo: '30', kpa: 'KPA 4: BUDGET AND REPORTING', weight: '5%', weighting: '5', baseline: '1', kpi: 'Section 72 (midyear) MFMA report submitted to Executive Mayor and relevant stakeholders within legislative timeframes by 25 January 2026', annualTarget: '1', q1Target: 'NA', q2Target: 'NA', q3Target: '1', q4Target: 'NA', poe: 'Signed Mid-Year Budget and Performance Report and Acknowledgment of Receipt By EM Office', budget: 'N/A' },
      { origIdx: 31, id: 'msiza-finance-kpi-31', kpiNo: '31', kpa: 'KPA 4: BUDGET AND REPORTING', weight: '5%', weighting: '5', baseline: '4', kpi: 'Number of quarterly section 52(d) MFMA reports submitted to Executive Mayor and other relevant stakeholders within 30 days of the end of each quarter', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Quarterly section 52(d) MFMA report and acknowledgement of Executive Mayor’s office', budget: 'N/A' },
      { origIdx: 32, id: 'msiza-finance-kpi-32', kpiNo: '32', kpa: 'KPA 4: BUDGET AND REPORTING', weight: '5%', weighting: '5', baseline: '12', kpi: 'Number of monthly section 71 MFMA reports submitted to Executive Mayor within 10 working days after end of each quarter.', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Signed Section 71 MFMA reports and acknowledgement of Executive Mayor’s office', budget: 'N/A' },
      { origIdx: 33, id: 'msiza-finance-kpi-33', kpiNo: '33', kpa: 'KPA 4: BUDGET AND REPORTING', weight: '3%', weighting: '3', baseline: '1', kpi: 'Submission for approval of DRAFT MTREF Budget by the 31st March 2026', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: '1', q4Target: 'N/A', poe: 'Approved MTREF Budget and Council resolution', budget: 'N/A' },
      { origIdx: 34, id: 'msiza-finance-kpi-34', kpiNo: '34', kpa: 'KPA 4: BUDGET AND REPORTING', weight: '2%', weighting: '2', baseline: '1', kpi: 'Submission for approval of MTREF Budget by the 31st May 2026', annualTarget: '1', q1Target: 'N/A', q2Target: 'N/A', q3Target: 'N/A', q4Target: '1', poe: 'Approved MTREF Budget and Council resolution', budget: 'N/A' },

      // KPA 5: EXPENDITURE MANAGEMENT (Weighting: 10%)
      { origIdx: 35, id: 'msiza-finance-kpi-35', kpiNo: 'M_53', kpa: 'KPA 5: EXPENDITURE MANAGEMENT', weight: '2%', weighting: '2', baseline: '93%', kpi: 'Percentage of operational budget actually spent (circular 88) by 30 June 2027. Finance', annualTarget: '90%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: '90%', poe: 'Signed Operational Expenditure progress report', budget: 'R' },
      { origIdx: 36, id: 'msiza-finance-kpi-36', kpiNo: '36', kpa: 'KPA 5: EXPENDITURE MANAGEMENT', weight: '2%', weighting: '2', baseline: '87%', kpi: 'Percentage of capital budget actually spent by 30 June 2026 (circular 88) ( Finance)', annualTarget: '90%', q1Target: '20%', q2Target: '40%', q3Target: '60%', q4Target: '90%', poe: 'Signed Capital Expenditure progress report', budget: 'R' },
      { origIdx: 37, id: 'msiza-finance-kpi-37', kpiNo: '37', kpa: 'KPA 5: EXPENDITURE MANAGEMENT', weight: '5%', weighting: '5', baseline: 'new', kpi: 'Percentage of municipal payments made to service providers who submitted complete forms within 30-days of invoice submission (circular 88)', annualTarget: '30 days', q1Target: '30 days', q2Target: '30 days', q3Target: '30 days', q4Target: '30 days', poe: 'Expenditure Report & Official Invoice Register', budget: 'OPEX' },
      { origIdx: 38, id: 'msiza-finance-kpi-38', kpiNo: '38', kpa: 'KPA 5: EXPENDITURE MANAGEMENT', weight: '1%', weighting: '1', baseline: '100%', kpi: 'Percentage spent on Financial Management Grant (FMG) by 30 June 2026.', annualTarget: '100%', q1Target: '25%', q2Target: '50%', q3Target: '75%', q4Target: '100%', poe: 'Signed Financial Management Grant expenditure progress report.', budget: 'OPEX' },

      // KPA 6: ASSET MANAGEMENT (Weighting: 10%)
      { origIdx: 39, id: 'msiza-finance-kpi-39', kpiNo: '39', kpa: 'KPA 6: ASSET MANAGEMENT', weight: '3%', weighting: '3', baseline: '12', kpi: 'Number of monthly FAR reports compiled and submitted to the MM by 30 June 2026 (within 15 days after end of month)', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Signed Monthly FAR reports', budget: 'OPEX' },
      { origIdx: 40, id: 'msiza-finance-kpi-40', kpiNo: '40', kpa: 'KPA 6: ASSET MANAGEMENT', weight: '2%', weighting: '2', baseline: '4', kpi: 'Number of quarterly assets reports submitted to the MM by 30 June 2026 (within 15 days after end of quarter)', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Quarterly Assets Reports', budget: 'OPEX' },
      { origIdx: 41, id: 'msiza-finance-kpi-41', kpiNo: '41', kpa: 'KPA 6: ASSET MANAGEMENT', weight: '3%', weighting: '3', baseline: '12', kpi: 'Number of monthly insurance reports prepared and submitted to the MM by 30 June 2026 (within 15 days after end of month)', annualTarget: '12', q1Target: '3', q2Target: '3', q3Target: '3', q4Target: '3', poe: 'Signed Monthly Insurance reports', budget: 'OPEX' },
      { origIdx: 42, id: 'msiza-finance-kpi-42', kpiNo: '42', kpa: 'KPA 6: ASSET MANAGEMENT', weight: '2%', weighting: '2', baseline: '4', kpi: 'Number of quarterly insurance reports submitted to the MM by 30 June 2026 (within 15 days after end of quarter)', annualTarget: '4', q1Target: '1', q2Target: '1', q3Target: '1', q4Target: '1', poe: 'Signed Quarterly Insurance reports', budget: 'OPEX' }
    ];

    result = msizaCanonical42.map((canon) => {
      const existing = result.find((it: any) => String(it?.id || '') === canon.id) ||
        (canon.origIdx > 0 ? result.find((it: any) => String(it?.id || '').endsWith(`-${canon.origIdx}`)) : null) ||
        result.find((it: any) => String(it?.kpiNo || it?.['kpi no'] || '').trim().toUpperCase() === canon.kpiNo.toUpperCase()) ||
        result.find((it: any) => {
          const d = String(it?.kpi || it?.description || it?.kpiDescription || '').toLowerCase();
          return d.slice(0, 30) === canon.kpi.toLowerCase().slice(0, 30);
        });

      const q1NotApplicable = canon.q1Target.toUpperCase() === 'N/A';
      return {
        ...(existing || {}),
        id: canon.id,
        kpiNo: canon.kpiNo,
        'kpi no': canon.kpiNo,
        refNumber: canon.kpiNo,
        kpa: canon.kpa,
        functionalKpa: canon.kpa,
        'functional kpa': canon.kpa,
        weight: canon.weight,
        weighting: canon.weighting,
        '%wt': canon.weight,
        baseline: canon.baseline,
        kpi: canon.kpi,
        description: canon.kpi,
        kpiDescription: canon.kpi,
        annualTarget: canon.annualTarget,
        target: canon.annualTarget,
        q1Target: canon.q1Target,
        q2Target: canon.q2Target,
        q3Target: canon.q3Target,
        q4Target: canon.q4Target,
        poe: canon.poe,
        portfolioOfEvidence: canon.poe,
        meansOfVerification: canon.poe,
        q1Poe: canon.poe,
        q2Poe: canon.poe,
        q3Poe: canon.poe,
        q4Poe: canon.poe,
        annualRequiredPoe: canon.poe,
        midtermPoe: canon.poe,
        budget: canon.budget,
        location: 'Nkangala District',
        q1Applicable: !q1NotApplicable,
        q1Locked: q1NotApplicable,
        q1Actual: existing?.q1Actual ?? '',
        q2Actual: existing?.q2Actual ?? '',
        q3Actual: existing?.q3Actual ?? '',
        q4Actual: existing?.q4Actual ?? '',
        annualActual: existing?.annualActual ?? '',
        q1Score: existing?.q1Score ?? '',
        myScore: existing?.myScore ?? existing?.q1Score ?? '',
        managerScore: existing?.managerScore ?? '',
        q1ManagerScore: existing?.q1ManagerScore ?? existing?.managerScore ?? '',
        q1PoeDocs: Array.isArray(existing?.q1PoeDocs) ? existing.q1PoeDocs : [],
        q2PoeDocs: Array.isArray(existing?.q2PoeDocs) ? existing.q2PoeDocs : [],
        q3PoeDocs: Array.isArray(existing?.q3PoeDocs) ? existing.q3PoeDocs : [],
        q4PoeDocs: Array.isArray(existing?.q4PoeDocs) ? existing.q4PoeDocs : [],
        annualPoeDocs: Array.isArray(existing?.annualPoeDocs) ? existing.annualPoeDocs : [],
        midtermPoeDocs: Array.isArray(existing?.midtermPoeDocs) ? existing.midtermPoeDocs : [],
        reviewStatus: existing?.reviewStatus || 'Draft',
        reviewApprovalStatus: existing?.reviewApprovalStatus || '',
        q1PoeStatus: existing?.q1PoeStatus || 'Draft',
        manager: 'Alice Stander',
        managerEmail: 'standeral@nkangaladm.gov.za',
        reportTo: 'Alice Stander'
      };
    });
  }

  // 41. Johan P. Mangani (manganijp@nkangaladm.gov.za / manganijp@neda.gov.za) — Zero-Data-Loss Recovery of Real Uploaded Supabase POE Blobs & Q1 Actuals
  if (normEmail.includes('manganijp')) {
    const MANGANI_RECOVERED_Q1: Record<
      string,
      {
        q1Actual: string;
        q1Score: string;
        reviewStatus: string;
        docs: Array<{
          id: string;
          name: string;
          mimeType: string;
          size: number;
          dataUrl: string;
          url: string;
          uploadedAt: string;
          uploadedBy: string;
        }>;
      }
    > = {
      'kpi-mangani-1': {
        q1Actual: '1',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794578510257_r9kx7jpyn',
            name: 'Fourth_Quarter_performance_report_.pdf',
            mimeType: 'application/pdf',
            size: 460175,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794578510257_r9kx7jpyn',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794578510257_r9kx7jpyn',
            uploadedAt: '2026-11-13T14:01:50.475Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794578532162_au6lpxn90',
            name: 'ME_07.10.2026.docx.pdf',
            mimeType: 'application/pdf',
            size: 297021,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794578532162_au6lpxn90',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794578532162_au6lpxn90',
            uploadedAt: '2026-11-13T14:02:12.112Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794578569834_h9t2sekz7',
            name: 'Quarter 4 Council resolution (1).pdf',
            mimeType: 'application/pdf',
            size: 266653,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794578569834_h9t2sekz7',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794578569834_h9t2sekz7',
            uploadedAt: '2026-11-13T14:02:49.783Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-2': {
        q1Actual: '10%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794578702138_rrm6tdqnz',
            name: 'Vacancy rate report_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 144017,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794578702138_rrm6tdqnz',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794578702138_rrm6tdqnz',
            uploadedAt: '2026-11-13T14:05:01.964Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-4': {
        q1Actual: '100%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794579177822_gc3gc4mjs',
            name: 'Decleration of interest_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 86002,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794579177822_gc3gc4mjs',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794579177822_gc3gc4mjs',
            uploadedAt: '2026-11-13T14:12:57.587Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-5': {
        q1Actual: '100%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794579177822_gc3gc4mjs',
            name: 'Decleration of interest_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 86002,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794579177822_gc3gc4mjs',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794579177822_gc3gc4mjs',
            uploadedAt: '2026-11-13T14:12:57.587Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-14': {
        q1Actual: '60%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794579508691_4iqzulha8',
            name: 'Quarter 1 Strategic Risk Report_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 216243,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794579508691_4iqzulha8',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794579508691_4iqzulha8',
            uploadedAt: '2026-11-13T14:18:28.691Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-15': {
        q1Actual: '60%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794579549777_dreskoejj',
            name: 'Quarter 1 Operational Risk Report_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 230811,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794579549777_dreskoejj',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794579549777_dreskoejj',
            uploadedAt: '2026-11-13T14:19:09.778Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-16': {
        q1Actual: '100%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794580790126_qyseu92b9',
            name: 'Neda 1st qtr follow-up final report.pdf',
            mimeType: 'application/pdf',
            size: 6360005,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794580790126_qyseu92b9',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794580790126_qyseu92b9',
            uploadedAt: '2026-11-13T14:39:50.127Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794580811965_u1tlv3iwz',
            name: 'Summary Neda 1st qtr follw-up.pdf',
            mimeType: 'application/pdf',
            size: 2123599,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794580811965_u1tlv3iwz',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794580811965_u1tlv3iwz',
            uploadedAt: '2026-11-13T14:40:11.966Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-17': {
        q1Actual: '1',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794581168134_vpcs8rs4f',
            name: 'Neda fourth quarter report.pdf',
            mimeType: 'application/pdf',
            size: 285755,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794581168134_vpcs8rs4f',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794581168134_vpcs8rs4f',
            uploadedAt: '2026-11-13T14:46:08.134Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794581253291_ipp74dwf6',
            name: 'ME_04.10.2026_.docx.pdf',
            mimeType: 'application/pdf',
            size: 297068,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794581253291_ipp74dwf6',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794581253291_ipp74dwf6',
            uploadedAt: '2026-11-13T14:47:33.291Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-18': {
        q1Actual: '100%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794581436125_l6qtme5nq',
            name: 'Summary Neda 1st qtr follw-up.pdf',
            mimeType: 'application/pdf',
            size: 2123599,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794581436125_l6qtme5nq',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794581436125_l6qtme5nq',
            uploadedAt: '2026-11-13T14:50:36.126Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-19': {
        q1Actual: '100%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794582026097_7ntinb1s8',
            name: 'NEDA_Q1_2026-2027_Implementation_of_Board_Resolutions.pdf',
            mimeType: 'application/pdf',
            size: 207566,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582026097_7ntinb1s8',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582026097_7ntinb1s8',
            uploadedAt: '2026-11-13T15:00:26.097Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794582155947_n05c1w878',
            name: 'Minutes of the 1st Ordinary Board Meeting_ 16102026.pdf',
            mimeType: 'application/pdf',
            size: 317361,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582155947_n05c1w878',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582155947_n05c1w878',
            uploadedAt: '2026-11-13T15:02:35.947Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794582168167_919e2wczg',
            name: 'Minutes of the 02nd Special Board Meeting_ 18082026.pdf',
            mimeType: 'application/pdf',
            size: 256402,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582168167_919e2wczg',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582168167_919e2wczg',
            uploadedAt: '2026-11-13T15:02:48.167Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794582175197_qg83r8vp6',
            name: 'Minutes of the 03rd Special Board Meeting_ 18092026.pdf',
            mimeType: 'application/pdf',
            size: 282934,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582175197_qg83r8vp6',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582175197_qg83r8vp6',
            uploadedAt: '2026-11-13T15:02:55.197Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-20': {
        q1Actual: '0',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794583181120_i9eouxq1h',
            name: 'Minutes OF NEDA ORDINARY BOARD MEETING 12 MAY 2026.pdf',
            mimeType: 'application/pdf',
            size: 644130,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583181120_i9eouxq1h',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583181120_i9eouxq1h',
            uploadedAt: '2026-11-13T15:19:41.121Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794583194599_cygtaoj3k',
            name: 'NEDA 8th ORDINARY BOARD MEETING MINUTES.docx.pdf',
            mimeType: 'application/pdf',
            size: 308157,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583194599_cygtaoj3k',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583194599_cygtaoj3k',
            uploadedAt: '2026-11-13T15:19:54.599Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794583213332_grr0pcxsb',
            name: 'NEDA 9th ORDINARY BOARD MEETING MINUTES_.docx.pdf',
            mimeType: 'application/pdf',
            size: 302661,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583213332_grr0pcxsb',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583213332_grr0pcxsb',
            uploadedAt: '2026-11-13T15:20:13.333Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-21': {
        q1Actual: '60%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794582459165_yjg1p9cuw',
            name: 'Quarter 1 Lekgotla_ NDM_signed.pdf',
            mimeType: 'application/pdf',
            size: 254219,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582459165_yjg1p9cuw',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794582459165_yjg1p9cuw',
            uploadedAt: '2026-11-13T15:07:39.166Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-23': {
        q1Actual: '1',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794583058728_fxs5wxzd0',
            name: 'ME_13.10.2026.docx.pdf',
            mimeType: 'application/pdf',
            size: 340458,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583058728_fxs5wxzd0',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583058728_fxs5wxzd0',
            uploadedAt: '2026-11-13T15:17:38.729Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794583074851_xakfw5r0a',
            name: 'Quarter 1 Catalytic Economic Development Projects.pdf',
            mimeType: 'application/pdf',
            size: 351505,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583074851_xakfw5r0a',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794583074851_xakfw5r0a',
            uploadedAt: '2026-11-13T15:17:54.852Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-26': {
        q1Actual: '1',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794585108159_4idlh93px',
            name: '0085 I - Lesedi la Balomo SANS 1215 (1) (1).pdf',
            mimeType: 'application/pdf',
            size: 1833307,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794585108159_4idlh93px',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794585108159_4idlh93px',
            uploadedAt: '2026-11-13T15:51:49.454Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794585118541_nen940fl0',
            name: '0086 I - Lesedi la Balomo SANS 1058 (1).pdf',
            mimeType: 'application/pdf',
            size: 1695664,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794585118541_nen940fl0',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794585118541_nen940fl0',
            uploadedAt: '2026-11-13T15:51:59.771Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794585127709_9pgai2bn6',
            name: '0086 I -80mm Lesedi la Balomo SANS 1058 (1).pdf',
            mimeType: 'application/pdf',
            size: 1684632,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794585127709_9pgai2bn6',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794585127709_9pgai2bn6',
            uploadedAt: '2026-11-13T15:52:08.930Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794585137086_g3wuxoa78',
            name: 'DOC (1).pdf',
            mimeType: 'application/pdf',
            size: 94387,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794585137086_g3wuxoa78',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794585137086_g3wuxoa78',
            uploadedAt: '2026-11-13T15:52:17.435Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-29': {
        q1Actual: '1',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794586124948_190uq4k1f',
            name: 'Training matrix and First aid .pdf',
            mimeType: 'application/pdf',
            size: 1438648,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586124948_190uq4k1f',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586124948_190uq4k1f',
            uploadedAt: '2026-11-13T16:08:44.948Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-31': {
        q1Actual: '100%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794586300502_ttw9iqkwh',
            name: 'Procurement  Plan Progress as at 30th September 2026_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 94308,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586300502_ttw9iqkwh',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586300502_ttw9iqkwh',
            uploadedAt: '2026-11-13T16:11:40.502Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-33': {
        q1Actual: '1',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794586787198_kcfibka4d',
            name: 'Acknowledgement of receipt of AFS and APR  -NEDA - Copy (1).pdf',
            mimeType: 'application/pdf',
            size: 240600,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586787198_kcfibka4d',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586787198_kcfibka4d',
            uploadedAt: '2026-11-13T16:19:47.198Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794586796890_ipwabf8n2',
            name: 'DRAFT AFS NEDA 30.09.2026 V2.. (1).pdf',
            mimeType: 'application/pdf',
            size: 424915,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586796890_ipwabf8n2',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586796890_ipwabf8n2',
            uploadedAt: '2026-11-13T16:19:56.890Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-35': {
        q1Actual: '1',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794586923441_s33mnc660',
            name: 'SCM Report_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 187339,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586923441_s33mnc660',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586923441_s33mnc660',
            uploadedAt: '2026-11-13T16:22:03.441Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794586934427_h9t507u24',
            name: 'ME_20.10.2026.docx.pdf',
            mimeType: 'application/pdf',
            size: 297883,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586934427_h9t507u24',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794586934427_h9t507u24',
            uploadedAt: '2026-11-13T16:22:14.427Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-37': {
        q1Actual: '120',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794587124273_k95mg7e49',
            name: 'Number of days_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 199316,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587124273_k95mg7e49',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587124273_k95mg7e49',
            uploadedAt: '2026-11-13T16:25:24.273Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-38': {
        q1Actual: '3',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794587269326_2khfkd5cb',
            name: 'Chairperson__COVER_Letter_NDM__July.pdf',
            mimeType: 'application/pdf',
            size: 637499,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587269326_2khfkd5cb',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587269326_2khfkd5cb',
            uploadedAt: '2026-11-13T16:27:49.327Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794587277254_y253v8xbj',
            name: 'Chairperson__COVER_Letter_NDM__August.pdf',
            mimeType: 'application/pdf',
            size: 637148,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587277254_y253v8xbj',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587277254_y253v8xbj',
            uploadedAt: '2026-11-13T16:27:57.254Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794587284771_md1jjasbp',
            name: 'Chairperson__COVER_Letter_NDM__September.pdf',
            mimeType: 'application/pdf',
            size: 637188,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587284771_md1jjasbp',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587284771_md1jjasbp',
            uploadedAt: '2026-11-13T16:28:04.771Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794587297079_21o1c85xo',
            name: 'SEC 87 REPORT JULY SUBMITTED.pdf',
            mimeType: 'application/pdf',
            size: 873956,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587297079_21o1c85xo',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587297079_21o1c85xo',
            uploadedAt: '2026-11-13T16:28:17.079Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794587308572_aewrabxos',
            name: 'SECTION 87-Aug 2026.pdf',
            mimeType: 'application/pdf',
            size: 1239545,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587308572_aewrabxos',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587308572_aewrabxos',
            uploadedAt: '2026-11-13T16:28:28.572Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
          {
            id: 'poe_doc_Q1_1794587320774_t3eev4ald',
            name: 'SECTION 87_SEPTEMBER 2026.pdf',
            mimeType: 'application/pdf',
            size: 1091988,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587320774_t3eev4ald',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587320774_t3eev4ald',
            uploadedAt: '2026-11-13T16:28:40.774Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-39': {
        q1Actual: '20%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794587625525_dsoi4xwd6',
            name: 'NEDA Transfers and subsidies September 2026 (003)_signed (1).pdf',
            mimeType: 'application/pdf',
            size: 183228,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587625525_dsoi4xwd6',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587625525_dsoi4xwd6',
            uploadedAt: '2026-11-13T16:33:45.525Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-40': {
        q1Actual: '20%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794587757578_n7ax881i7',
            name: 'NEDA_Opex_Q1_2026-27.pdf',
            mimeType: 'application/pdf',
            size: 203418,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587757578_n7ax881i7',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587757578_n7ax881i7',
            uploadedAt: '2026-11-13T16:35:57.578Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
      'kpi-mangani-41': {
        q1Actual: '5%',
        q1Score: '3',
        reviewStatus: 'Submitted for Approval',
        docs: [
          {
            id: 'poe_doc_Q1_1794587973935_5gcfuo1xd',
            name: 'NEDA_Capex_Q1_2026-27.pdf',
            mimeType: 'application/pdf',
            size: 190126,
            dataUrl: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587973935_5gcfuo1xd',
            url: '/api/poe/blob/poe_blob_poe_doc_Q1_1794587973935_5gcfuo1xd',
            uploadedAt: '2026-11-13T16:39:33.935Z',
            uploadedBy: 'manganijp@nkangaladm.gov.za',
          },
        ],
      },
    };

    result = result.map((it: any, idx: number) => {
      const kpiId = String(it.id || `kpi-mangani-${idx + 1}`).trim();
      const rec = MANGANI_RECOVERED_Q1[kpiId];
      if (!rec) return it;
      const existingDocs = Array.isArray(it.q1PoeDocs) ? it.q1PoeDocs : [];
      const mergedDocs =
        existingDocs.length > 0
          ? Array.from(new Map([...rec.docs, ...existingDocs].map((d: any) => [d.id || d.name, d])).values())
          : rec.docs;
      const q1Actual = it.q1Actual && String(it.q1Actual).trim() !== '' ? it.q1Actual : rec.q1Actual;
      const q1Score = it.q1Score && String(it.q1Score).trim() !== '' ? it.q1Score : rec.q1Score;
      const reviewStatus =
        it.reviewStatus && it.reviewStatus !== 'Draft' && it.reviewStatus !== 'N/A'
          ? it.reviewStatus
          : rec.reviewStatus;
      return {
        ...it,
        id: kpiId,
        q1Actual,
        q1Score,
        myScore: it.myScore || q1Score,
        ownScore: it.ownScore || q1Score,
        q1PoeDocs: mergedDocs,
        poeDocs: mergedDocs,
        poeFileName: mergedDocs[0]?.name || it.poeFileName || '',
        reviewStatus,
        q1PoeStatus: 'Pending Verification',
      };
    });
  }

  return result;
}

export function applyOfficialUserKpiFixes(inputKpis: any[], userEmail: string): any[] {
  return applyOfficialKpiRules(userEmail || '', Array.isArray(inputKpis) ? inputKpis : []);
}




