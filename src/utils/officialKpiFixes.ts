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

/**
 * Transforms or filters KPIs according to specific official instructions.
 */
export function applyOfficialKpiRules(userEmail: string, inputKpis: any[]): any[] {
  const normEmail = normalizeEmail(userEmail);

  // 1. Ms. Jayvanti Morar (MorarJ@nkangaladm.gov.za or morarj@nkangaladm.gov.za or morari@nkangaladm.gov.za)
  if (isJayvantiMorar(normEmail)) {
    return MORARJ_OFFICIAL_KPIS.map(kpi => ({
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
      poe: kpi.poe,
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
    }));
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

  return result;
}
