/**
 * Reporting Periods Utility
 */

export type ReportingPhase = 'open' | 'review' | 'audit' | 'closed';

export interface ReportingPeriodConfig {
  quarter: string;
  name: string;
  startDate: string;
  endDate: string;
  phase: ReportingPhase;
  isOpen: boolean;
}

export const REPORTING_PERIOD_CONFIGS: Record<string, ReportingPeriodConfig> = {
  q1: { quarter: 'q1', name: 'Quarter 1 (Jul - Sep)', startDate: '2026-07-01', endDate: '2026-09-30', phase: 'open', isOpen: true },
  q2: { quarter: 'q2', name: 'Quarter 2 (Oct - Dec)', startDate: '2026-10-01', endDate: '2026-12-31', phase: 'open', isOpen: true },
  q3: { quarter: 'q3', name: 'Quarter 3 (Jan - Mar)', startDate: '2026-01-01', endDate: '2026-03-31', phase: 'open', isOpen: true },
  q4: { quarter: 'q4', name: 'Quarter 4 (Apr - Jun)', startDate: '2026-04-01', endDate: '2026-06-30', phase: 'open', isOpen: true }
};

export function getCurrentMunicipalQuarter(): string {
  const month = new Date().getMonth() + 1; // 1-12
  if (month >= 7 && month <= 9) return 'q1';
  if (month >= 10 && month <= 12) return 'q2';
  if (month >= 1 && month <= 3) return 'q3';
  return 'q4';
}

export function isQuarterInReportingPeriod(quarter: string): boolean {
  return true;
}

export function getQuarterLockNotice(quarter: string): string {
  return `Reporting period active for ${quarter.toUpperCase()}`;
}
