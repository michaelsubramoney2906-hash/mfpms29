/**
 * South African Municipal Financial Management Act (MFMA) SDBIP Reporting Periods Utility
 * 
 * Municipal Financial Year Cycle:
 * - Q1: July, August, September (Months 7, 8, 9)
 * - Q2: October, November, December (Months 10, 11, 12)
 * - Mid-Term: October, November, December, January (Mid-year Section 72 evaluation)
 * - Q3: January, February, March (Months 1, 2, 3)
 * - Q4: April, May, June (Months 4, 5, 6)
 * - Annual: July, August (Post year-end compilation)
 */

export type ReportingPhase = 'q1' | 'q2' | 'midTerm' | 'q3' | 'q4' | 'annual';

export interface PeriodConfig {
  phase: ReportingPhase;
  title: string;
  shortTitle: string;
  months: number[]; // 1-12
  monthsLabel: string;
  description: string;
}

export const REPORTING_PERIOD_CONFIGS: Record<ReportingPhase, PeriodConfig> = {
  q1: {
    phase: 'q1',
    title: '1st Quarter (Q1)',
    shortTitle: 'Q1',
    months: [7, 8, 9, 10], // July - October (Q1 execution and statutory reporting window)
    monthsLabel: 'July – October (Active Q1)',
    description: 'Q1 Active Reporting Window (July to October)'
  },
  q2: {
    phase: 'q2',
    title: '2nd Quarter (Q2)',
    shortTitle: 'Q2',
    months: [11, 12], // November – December (Q2 reporting window)
    monthsLabel: 'November – December',
    description: 'Q2 Active Reporting Window (November to December)'
  },
  midTerm: {
    phase: 'midTerm',
    title: 'Mid-Term Section 72 Review',
    shortTitle: 'Mid-Term',
    months: [11, 12, 1],
    monthsLabel: 'November – January',
    description: 'Section 72 Mid-Year Budget & Performance Assessment'
  },
  q3: {
    phase: 'q3',
    title: '3rd Quarter (Q3)',
    shortTitle: 'Q3',
    months: [2, 3, 4],
    monthsLabel: 'February – April',
    description: 'Q3 Active Reporting Window (February to April)'
  },
  q4: {
    phase: 'q4',
    title: '4th Quarter (Q4 / Annual Final)',
    shortTitle: 'Q4',
    months: [5, 6],
    monthsLabel: 'May – June',
    description: 'Q4 Active Reporting Window (May to June)'
  },
  annual: {
    phase: 'annual',
    title: 'Annual Performance Report (APR)',
    shortTitle: 'Annual',
    months: [7, 8],
    monthsLabel: 'July – August',
    description: 'Annual SDBIP Performance Reconciliation'
  }
};

/**
 * Determine the current calendar quarter based on South African municipal financial year (July-June)
 */
export function getCurrentMunicipalQuarter(date: Date = new Date()): 'q1' | 'q2' | 'q3' | 'q4' {
  const month = date.getMonth() + 1; // 1-12
  if (month >= 7 && month <= 10) return 'q1';
  if (month >= 11 && month <= 12) return 'q2';
  if (month >= 1 && month <= 4) return 'q3';
  return 'q4'; // 5, 6
}

/**
 * Check whether a quarter phase is in its active reporting period.
 * Supports an optional simulation override ('auto' or specific quarter) for audits/testing.
 */
export function isQuarterInReportingPeriod(
  phase: ReportingPhase,
  periodOverride: string = 'auto',
  date: Date = new Date()
): boolean {
  if (periodOverride && periodOverride !== 'auto') {
    if (periodOverride === 'all_open') return true; // Debug / Super-admin override if ever needed
    if (periodOverride === phase) return true;
    if (phase === 'midTerm' && (periodOverride === 'q2' || periodOverride === 'midTerm')) return true;
    return false;
  }

  const currentMonth = date.getMonth() + 1; // 1-12
  const config = REPORTING_PERIOD_CONFIGS[phase];
  if (!config) return false;
  
  return config.months.includes(currentMonth);
}

/**
 * Generate human-readable lock notice
 */
export function getQuarterLockNotice(phase: ReportingPhase): string {
  const config = REPORTING_PERIOD_CONFIGS[phase];
  return `Reporting locked: ${config.shortTitle} operates only between ${config.monthsLabel}. Unless you are in the actual reporting period, reporting is strictly restricted.`;
}

/**
 * Current period status summary
 */
export function getCurrentPeriodStatus(date: Date = new Date()): {
  activeQuarter: 'q1' | 'q2' | 'q3' | 'q4';
  currentMonthName: string;
  activeLabel: string;
} {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const monthIdx = date.getMonth();
  const currentMonthName = monthNames[monthIdx];
  const activeQuarter = getCurrentMunicipalQuarter(date);
  const activeLabel = REPORTING_PERIOD_CONFIGS[activeQuarter].monthsLabel;

  return {
    activeQuarter,
    currentMonthName,
    activeLabel
  };
}
