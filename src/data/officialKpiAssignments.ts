import officialsMapJson from '../../scripts/official_kpi_officials_map.json';

export interface OfficialAssignment {
  submitter: string;
  approver: string;
}

export const OFFICIAL_KPI_ASSIGNMENTS: Record<string, OfficialAssignment> = officialsMapJson as Record<string, OfficialAssignment>;

export function getOfficialAssignment(refNum: string, fallbackUnit?: string): OfficialAssignment {
  if (OFFICIAL_KPI_ASSIGNMENTS[refNum]) {
    return OFFICIAL_KPI_ASSIGNMENTS[refNum];
  }
  const cleanRef = (refNum || '').replace('-', '_').toUpperCase();
  if (OFFICIAL_KPI_ASSIGNMENTS[cleanRef]) {
    return OFFICIAL_KPI_ASSIGNMENTS[cleanRef];
  }
  return {
    submitter: fallbackUnit || 'Departmental Submitter',
    approver: 'Accounting Officer'
  };
}
