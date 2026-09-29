import { TEAM_MODULE_CONFIGS } from '../components/IPMS/teamPADefaults';

export interface TeamMemberInfo {
  name: string;
  designation: string;
  email: string;
  teamRole: 'Team Leader' | 'Team Member';
}

export interface UserTeamStatus {
  isMember: boolean;
  isLeader: boolean;
  teamDepartment: 'cds' | 'technical_services' | 'corporate_services' | 'pms_team' | null;
  teamTitle: string | null;
  teamName: string | null;
  teamLeaderName: string | null;
  teamLeaderEmail: string | null;
  canReportOrEdit: boolean;
}

/**
 * Checks whether a user is an administrator with universal override rights.
 */
export function isUserAdmin(user: any): boolean {
  if (!user) return false;
  const email = (user.email || '').toLowerCase().trim();
  const role = (user.role || '').toLowerCase().trim();
  const systemRole = (user.systemRole || '').toLowerCase().trim();

  return (
    role === 'admin' ||
    role === 'global administrator' ||
    systemRole === 'global administrator' ||
    systemRole.includes('admin') ||
    email === 'mike@mzansiflow.co.za' ||
    email === 'mike@massivedynamixdistributors.com'
  );
}

export interface CheckRosterResult {
  isLeader: boolean;
  isMember: boolean;
  leaderName: string;
  leaderEmail: string;
  userRoleInTeam: 'Team Leader' | 'Team Member' | null;
  canReportOrEdit: boolean;
}

/**
 * Resolves whether the current user is a Team Leader or Team Member based on an active team roster.
 */
export function checkRosterRole(
  user: any,
  tableRows: string[][],
  defaultLeaderName?: string,
  defaultLeaderEmail?: string
): CheckRosterResult {
  if (isUserAdmin(user)) {
    return {
      isLeader: true,
      isMember: true,
      leaderName: user?.fullName || user?.name || user?.email || 'Administrator',
      leaderEmail: user?.email || '',
      userRoleInTeam: 'Team Leader',
      canReportOrEdit: true
    };
  }

  const currentEmail = (user?.email || '').toLowerCase().trim();
  const currentName = (user?.fullName || user?.name || '').toLowerCase().trim();

  let leaderName = defaultLeaderName || '';
  let leaderEmail = defaultLeaderEmail || '';
  let userFoundInRoster = false;
  let userIsDesignatedLeader = false;
  let userRoleInTeam: 'Team Leader' | 'Team Member' | null = null;

  tableRows.forEach((row, idx) => {
    const rawNo = row[0] || String(idx + 1);
    const rawName = (row[1] || '').trim();
    const rawDesig = (row[2] || '').trim();
    
    // Check if role is in col3 or col4
    let roleInTeam = (idx === 0 ? 'Team Leader' : 'Team Member');
    let rawEmail = '';

    const col3 = (row[3] || '').trim();
    const col4 = (row[4] || '').trim();

    if (col3 === 'Team Leader' || col3 === 'Team Member') {
      roleInTeam = col3;
      if (col4.includes('@')) rawEmail = col4.toLowerCase().trim();
    } else if (col4 === 'Team Leader' || col4 === 'Team Member') {
      roleInTeam = col4;
      if (col3.includes('@')) rawEmail = col3.toLowerCase().trim();
    } else {
      if (col3.includes('@')) rawEmail = col3.toLowerCase().trim();
      else if (col4.includes('@')) rawEmail = col4.toLowerCase().trim();
    }

    if (roleInTeam === 'Team Leader') {
      leaderName = rawName || leaderName;
      if (rawEmail) leaderEmail = rawEmail;
    }

    // Check if this row is the current user
    const matchesEmail = rawEmail && currentEmail && rawEmail === currentEmail;
    const matchesName = rawName && currentName && (
      rawName.toLowerCase() === currentName ||
      rawName.toLowerCase().includes(currentName) ||
      currentName.includes(rawName.toLowerCase()) ||
      (currentEmail && rawName.toLowerCase().includes(currentEmail.split('@')[0]))
    );

    if (matchesEmail || matchesName) {
      userFoundInRoster = true;
      userRoleInTeam = roleInTeam as 'Team Leader' | 'Team Member';
      if (roleInTeam === 'Team Leader') {
        userIsDesignatedLeader = true;
      }
    }
  });

  // If user is designated leader in the roster
  if (userIsDesignatedLeader) {
    return {
      isLeader: true,
      isMember: true,
      leaderName: user?.fullName || user?.name || leaderName,
      leaderEmail: user?.email || leaderEmail,
      userRoleInTeam: 'Team Leader',
      canReportOrEdit: true
    };
  }

  // If user is in the roster as a team member
  if (userFoundInRoster) {
    return {
      isLeader: false,
      isMember: true,
      leaderName: leaderName || defaultLeaderName || 'Team Leader',
      leaderEmail: leaderEmail || defaultLeaderEmail || '',
      userRoleInTeam: 'Team Member',
      canReportOrEdit: true
    };
  }

  // If user is not in the roster at all, fallback based on global department status
  const globalStatus = resolveGlobalTeamStatus(user);
  if (globalStatus.isMember) {
    return {
      isLeader: globalStatus.isLeader,
      isMember: true,
      leaderName: globalStatus.teamLeaderName || defaultLeaderName || 'Team Leader',
      leaderEmail: globalStatus.teamLeaderEmail || defaultLeaderEmail || '',
      userRoleInTeam: globalStatus.isLeader ? 'Team Leader' : 'Team Member',
      canReportOrEdit: true
    };
  }

  return {
    isLeader: true,
    isMember: false,
    leaderName: defaultLeaderName || '',
    leaderEmail: defaultLeaderEmail || '',
    userRoleInTeam: null,
    canReportOrEdit: true
  };
}

/**
 * Checks across the 4 pre-configured municipal department teams:
 * CDS (Community Development & Firefighters), Technical Services, Corporate Services, and PMS.
 */
export function resolveGlobalTeamStatus(user: any): UserTeamStatus {
  if (!user || !user.email) {
    return {
      isMember: false,
      isLeader: false,
      teamDepartment: null,
      teamTitle: null,
      teamName: null,
      teamLeaderName: null,
      teamLeaderEmail: null,
      canReportOrEdit: false
    };
  }

  if (isUserAdmin(user)) {
    return {
      isMember: true,
      isLeader: true,
      teamDepartment: null,
      teamTitle: 'Municipal Leadership (Admin)',
      teamName: 'All Municipal Teams',
      teamLeaderName: user.fullName || user.email,
      teamLeaderEmail: user.email,
      canReportOrEdit: true
    };
  }

  const emailLower = user.email.toLowerCase().trim();
  const nameLower = (user.fullName || user.name || '').toLowerCase().trim();
  const jobLower = (user.jobFunction || '').toLowerCase().trim();
  const deptLower = (user.department || '').toLowerCase().trim();

  const deptKeys: ('cds' | 'technical_services' | 'corporate_services' | 'pms_team')[] = [
    'cds',
    'technical_services',
    'corporate_services',
    'pms_team'
  ];

  for (const deptKey of deptKeys) {
    const config = (TEAM_MODULE_CONFIGS as any)[deptKey] || (deptKey === 'cds' ? TEAM_MODULE_CONFIGS.firefighters : null);
    if (!config || !Array.isArray(config.teams)) continue;

    for (const team of config.teams) {
      const rows = team.defaultRows || [];
      const leaderRow = rows[0] || [];
      const leaderName = leaderRow[1] || 'Team Leader';
      const leaderEmail = leaderRow[3] || '';

      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx];
        const rName = (r[1] || '').toLowerCase().trim();
        let rRole = idx === 0 ? 'Team Leader' : 'Team Member';
        let rEmail = '';

        if (r[3] === 'Team Leader' || r[3] === 'Team Member') {
          rRole = r[3];
          if (r[4] && r[4].includes('@')) rEmail = r[4].toLowerCase().trim();
        } else if (r[4] === 'Team Leader' || r[4] === 'Team Member') {
          rRole = r[4];
          if (r[3] && r[3].includes('@')) rEmail = r[3].toLowerCase().trim();
        } else {
          if (r[3] && r[3].includes('@')) rEmail = r[3].toLowerCase().trim();
          else if (r[4] && r[4].includes('@')) rEmail = r[4].toLowerCase().trim();
        }

        const matches = (rEmail && rEmail === emailLower) ||
                        (rName && nameLower && (rName.includes(nameLower) || nameLower.includes(rName))) ||
                        (emailLower && rName.includes(emailLower.split('@')[0]));

        if (matches) {
          const isLeader = rRole === 'Team Leader';
          return {
            isMember: true,
            isLeader,
            teamDepartment: deptKey,
            teamTitle: config.title,
            teamName: team.name,
            teamLeaderName: isLeader ? (user.fullName || r[1]) : leaderName,
            teamLeaderEmail: isLeader ? user.email : leaderEmail,
            canReportOrEdit: true
          };
        }
      }
    }
  }

  // Broad departmental heuristics if not matched by exact roster row
  if (deptLower.includes('fire') || jobLower.includes('fire') || deptLower.includes('disaster') || deptLower.includes('cds')) {
    const isLeader = jobLower.includes('commander') || jobLower.includes('lead') || jobLower.includes('station officer') || jobLower.includes('chief');
    return {
      isMember: true,
      isLeader,
      teamDepartment: 'cds',
      teamTitle: 'Community & Disaster Services (CDS) Team',
      teamName: 'Alpha Shift - Fire & Rescue Platoon',
      teamLeaderName: isLeader ? user.fullName : 'Captain Sibusiso Sithole (Shift Commander)',
      teamLeaderEmail: isLeader ? user.email : 'sitholes@nkangaladm.gov.za',
      canReportOrEdit: true
    };
  }

  if (deptLower.includes('technical') || jobLower.includes('engineer') || jobLower.includes('technician') || deptLower.includes('infrastructure')) {
    const isLeader = jobLower.includes('lead') || jobLower.includes('chief') || jobLower.includes('superintendent') || jobLower.includes('manager');
    return {
      isMember: true,
      isLeader,
      teamDepartment: 'technical_services',
      teamTitle: 'Technical Services Team',
      teamName: 'Bulk Water & Sanitation Operations',
      teamLeaderName: isLeader ? user.fullName : 'Eng. Sipho Mthembu (Chief Engineer / General Manager)',
      teamLeaderEmail: isLeader ? user.email : 'mthembu@nkangaladm.gov.za',
      canReportOrEdit: true
    };
  }

  if (deptLower.includes('corporate') || jobLower.includes('human resources') || jobLower.includes('legal') || jobLower.includes('ict')) {
    const isLeader = jobLower.includes('manager') || jobLower.includes('director') || jobLower.includes('lead') || jobLower.includes('head');
    return {
      isMember: true,
      isLeader,
      teamDepartment: 'corporate_services',
      teamTitle: 'Corporate Services Team',
      teamName: 'Human Resources, Labor Relations & Employee Wellness',
      teamLeaderName: isLeader ? user.fullName : 'HR Manager Thandiwe Sithole',
      teamLeaderEmail: isLeader ? user.email : 'sitholet@nkangaladm.gov.za',
      canReportOrEdit: true
    };
  }

  if (deptLower.includes('pms') || jobLower.includes('pms') || jobLower.includes('sdbip') || deptLower.includes('performance')) {
    const isLeader = jobLower.includes('lead') || jobLower.includes('specialist') || jobLower.includes('manager') || emailLower.includes('zulune');
    return {
      isMember: true,
      isLeader,
      teamDepartment: 'pms_team',
      teamTitle: 'PMS Team',
      teamName: 'Statutory Performance Reporting & Section 52(d) Unit',
      teamLeaderName: isLeader ? user.fullName : 'Performance Specialist Audrey Mpanza',
      teamLeaderEmail: isLeader ? user.email : 'mpanzaa@nkangaladm.gov.za',
      canReportOrEdit: true
    };
  }

  // Not part of a team agreement
  return {
    isMember: false,
    isLeader: false,
    teamDepartment: null,
    teamTitle: null,
    teamName: null,
    teamLeaderName: null,
    teamLeaderEmail: null,
    canReportOrEdit: true // standard user managing their own individual plan
  };
}
