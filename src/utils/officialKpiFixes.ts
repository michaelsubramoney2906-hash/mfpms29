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
  return norm;
}

/**
 * Transforms or filters KPIs according to specific official instructions.
 */
export function applyOfficialKpiRules(userEmail: string, inputKpis: any[]): any[] {
  const normEmail = normalizeEmail(userEmail);

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
    // a) Remove KPI 07, KPI 08, KPI 09 (Jetpatchers / Allocated Projects)
    // b) Remove KPI_26 (duplicate of KPI_M_67)
    const excludeRefs = new Set([
      '7', '8', '9', '07', '08', '09',
      'KPI 7', 'KPI 8', 'KPI 9', 'KPI 07', 'KPI 08', 'KPI 09',
      'KPI_7', 'KPI_8', 'KPI_9', 'KPI_07', 'KPI_08', 'KPI_09',
      'P_07', 'P_08', 'P_09', 'P_7', 'P_8', 'P_9',
      '26', 'KPI 26', 'KPI_26'
    ]);

    result = result.filter(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || kpi.id || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();

      if (excludeRefs.has(ref)) {
        return false;
      }
      if (desc.includes('delmas wwtw') || desc.includes('emalahleni bulk water') || desc.includes('loskop regional bulk water supply: wp1') || desc.includes('jetpatcher')) {
        return false;
      }
      return true;
    });

    // c) Lock KPI_29 for Quarter 1 (only applicable for Q2 and Q4)
    result = result.map(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim().toUpperCase();
      if (ref === 'KPI_29' || ref === 'KPI 29' || ref === '29') {
        return {
          ...kpi,
          q1Applicable: false,
          '1st qtr target': 'N/A',
          q1Target: 'N/A',
          lockedQuarters: Array.from(new Set([...(kpi.lockedQuarters || []), 'Q1', 'q1']))
        };
      }
      return kpi;
    });
  }

  // 5. Ms. Kgaogelo Molefe (molefeki@nkangaladm.gov.za) - Remove KPI 25, 26, 27, 28
  if (normEmail === 'molefeki@nkangaladm.gov.za' || normEmail.includes('molefe')) {
    result = result.filter(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim().toUpperCase();
      const isUnwanted = ['25', '26', '27', '28', 'KPI 25', 'KPI 26', 'KPI 27', 'KPI 28', 'KPI_25', 'KPI_26', 'KPI_27', 'KPI_28'].includes(ref);
      return !isUnwanted;
    });
  }

  // 6. Mr. David Mahlangu (mahlangude@nkangaladm.gov.za) - Remove KPI 29
  if (normEmail === 'mahlangude@nkangaladm.gov.za' || normEmail.includes('mahlangude')) {
    result = result.filter(kpi => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || kpi.id || '').toString().trim().toUpperCase();
      const isKpi29 = ['29', 'KPI 29', 'KPI_29', 'M_29', 'M 29', 'M29', 'KPI-29'].includes(ref);
      return !isKpi29;
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
      { kpiNo: '14', kpa: 'KPA 4: WATER QUALITY MONITORING', kpi: 'Number of water samples taken per quarter from the THLM Water Reticulation, water sources, boreholes and treatment works to monitor water quality by 30 June 2027.', weighting: '5', baseline: '120', annualTarget: '120', q1Target: '30', q2Target: '30', q3Target: '30', q4Target: '30', poe: 'Water sampling sheets and Listing Spreadsheet (MHS THLM)' },
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
      // Find first matching existing item that genuinely matches this KPI number/description (avoiding the repeated #12-#25 duplicates)
      const existing = result.find((ex, exIdx) => {
        const exNo = String(ex.kpiNo || ex['kpi no'] || '').trim().toUpperCase();
        const exDesc = String(ex.kpi || ex.description || ex['kpi description'] || '').toLowerCase();
        if (idx < 11 && exIdx === idx) return true;
        if (exNo === def.kpiNo.toUpperCase() && exIdx < 11) return true;
        if (idx >= 11 && (exNo === def.kpiNo.toUpperCase() || exDesc.includes(def.kpi.toLowerCase().substring(0, 25)))) return true;
        return false;
      });
      const base = existing ? { ...existing } : {};
      const allQtrPoe = `Q1: ${def.poe}\nQ2: ${def.poe}\nQ3: ${def.poe}\nQ4: ${def.poe}`;
      return {
        ...base,
        id: base.id || `mpanzal-official-kpi-${idx + 1}`,
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
        // Carry forward reviewStatus and actuals explicitly
        reviewStatus: base.reviewStatus || (base.q1Actual || (Array.isArray(base.q1PoeDocs) && base.q1PoeDocs.length > 0) ? 'Submitted for Approval' : undefined),
        reviewApprovalStatus: base.reviewApprovalStatus,
        q1PoeStatus: base.q1PoeStatus,
        q1Actual: base.q1Actual,
        q1PoeDocs: Array.isArray(base.q1PoeDocs) ? base.q1PoeDocs : []
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

  // 12. Mr. Prince M. Mthimunye (mthimunyepm@nkangaladm.gov.za), Sindiso Moepi (moepis@nkangaladm.gov.za), and Mathapelo Mankopana (mankopanamm@nkangaladm.gov.za)
  if (
    normEmail === 'mthimunyepm@nkangaladm.gov.za' ||
    normEmail.includes('mthimunyepm') ||
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
      if (normEmail.includes('mthimunyepm')) {
        if (!isNaN(numVal) && numVal >= 24 && ref !== 'M_21') return false;
        if (index >= 23) return false;
      } else {
        if (!isNaN(numVal) && numVal >= 25 && ref !== 'M_21') return false;
        if (index >= 24) return false;
      }
      return true;
    });
  }

  // 13. Mr. Mark Ephraim Maseko (masekome@nkangaladm.gov.za)
  if (normEmail === 'masekome@nkangaladm.gov.za' || normEmail.includes('masekome')) {
    // Collect any POE files attached to KPI 1 ("Maintain clean audit opinion")
    let misplacedPoeDocs: any[] = [];
    result.forEach((kpi, index) => {
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();
      if (index === 0 || desc.includes('clean audit opinion')) {
        if (Array.isArray(kpi.q1PoeDocs) && kpi.q1PoeDocs.length > 0) {
          misplacedPoeDocs = [...kpi.q1PoeDocs];
        }
      }
    });

    const hrPlanDocs = misplacedPoeDocs.filter(d => (d.name || '').toLowerCase().includes('hr plan') || (d.name || '').toLowerCase().includes('hr plan'));
    const vacancyDocs = misplacedPoeDocs.filter(d => (d.name || '').toLowerCase().includes('vacancy'));

    result = result.map((kpi, index) => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim();
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
          q1Actual: '',
          q1Poe: '',
          poe: '',
          q1PoeDocs: [],
          q1Score: ''
        };
      }

      // Unlock KPI 5 ("Submission of 2024/2025 Annual performance evaluation on E-PMS by 29 August 2026") for Quarter 1
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

  // 14. Mr. Richard Dumisani Hleza (hlezard@nkangaladm.gov.za) - KPI 2 (Strategic Risks Identified) required POE = "Strategic Risk Report"
  if (normEmail === 'hlezard@nkangaladm.gov.za' || normEmail.includes('hlezard')) {
    result = result.map((kpi, index) => {
      const ref = (kpi.kpiNo || kpi.refNum || kpi['kpi no'] || '').toString().trim().toUpperCase();
      const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().toLowerCase();
      if (index === 1 || ref === '2' || ref === 'M_15' || desc.includes('strategic risks identified')) {
        const reqPoe = 'Strategic Risk Report';
        return {
          ...kpi,
          poe: `Q1: ${reqPoe}\nQ2: ${reqPoe}\nQ3: ${reqPoe}\nQ4: ${reqPoe}`,
          annualRequiredPoe: reqPoe,
          q1Poe: reqPoe,
          q2Poe: reqPoe,
          midtermPoe: reqPoe,
          q3Poe: reqPoe,
          q4Poe: reqPoe
        };
      }
      return kpi;
    });
  }

  // 15. Clean Audit Opinion KPI (M_21 / KPI 1: "Attain clean audit opinion by 31 December 2026") is N/A in Quarter 1 (due Q2: 31 Dec 2026)
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

  // 16. Ms. M.A. Lukhele (lukhelema@nkangaladm.gov.za) - Remove duplicate KPI in KPA 4
  if (normEmail === 'lukhelema@nkangaladm.gov.za' || normEmail.includes('lukhelema')) {
    const kpa4SeenKeys = new Set<string>();
    result = result.filter(kpi => {
      const kpa = (kpi.kpa || kpi.functionalKpa || kpi['functional kpa'] || kpi.kpaName || '').toString().trim().toUpperCase();
      const isKpa4 = kpa.includes('KPA 4') || kpa.includes('KPA4') || kpa.includes('WATER QUALITY MONITORING');
      if (isKpa4) {
        const kpiNo = (kpi.kpiNo || kpi['kpi no'] || kpi.id || '').toString().trim().toLowerCase();
        const desc = (kpi.kpiDescription || kpi['kpi description'] || kpi.kpi || kpi.description || '').toString().trim().toLowerCase();
        const dedupKey = kpiNo ? `kpi_${kpiNo}` : `desc_${desc.substring(0, 40)}`;
        if (kpa4SeenKeys.has(dedupKey)) {
          return false; // Remove duplicate entry in KPA 4
        }
        if (dedupKey) {
          kpa4SeenKeys.add(dedupKey);
        }
      }
      return true;
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

  return result;
}

export function applyOfficialUserKpiFixes(inputKpis: any[], userEmail: string): any[] {
  return applyOfficialKpiRules(userEmail || '', Array.isArray(inputKpis) ? inputKpis : []);
}




