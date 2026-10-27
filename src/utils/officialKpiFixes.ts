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

  return result;
}


