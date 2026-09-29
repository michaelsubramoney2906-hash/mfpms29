import { TEAM_MODULE_CONFIGS } from '../components/IPMS/teamPADefaults';

export function isUserAdmin(user: any): boolean {
  if (!user) return false;
  const email = (user.email || "").toLowerCase().trim();
  const role = (user.role || "").toLowerCase().trim();
  const systemRole = (user.systemRole || "").toLowerCase().trim();
  return (
    role === "admin" ||
    role === "global administrator" ||
    systemRole === "global administrator" ||
    systemRole.includes("admin") ||
    email === "mike@mzansiflow.co.za" ||
    email === "mike@massivedynamixdistributors.com"
  );
}

export function checkRosterRole(
  user: any,
  tableRows: any[],
  defaultLeaderName?: string,
  defaultLeaderEmail?: string
) {
  if (isUserAdmin(user)) {
    return {
      isLeader: true,
      isMember: true,
      leaderName: user?.fullName || user?.name || user?.email || "Administrator",
      leaderEmail: user?.email || "",
      userRoleInTeam: "Team Leader",
      canReportOrEdit: true
    };
  }

  const currentEmail = (user?.email || "").toLowerCase().trim();
  const currentName = (user?.fullName || user?.name || "").toLowerCase().trim();

  let leaderName = defaultLeaderName || "";
  let leaderEmail = defaultLeaderEmail || "";
  let userFoundInRoster = false;
  let userIsDesignatedLeader = false;
  let userRoleInTeam: string | null = null;

  (tableRows || []).forEach((row, idx) => {
    const rawName = (row[1] || "").trim();
    let roleInTeam = idx === 0 ? "Team Leader" : "Team Member";
    let rawEmail = "";
    const col3 = (row[3] || "").trim();
    const col4 = (row[4] || "").trim();

    if (col3 === "Team Leader" || col3 === "Team Member") {
      roleInTeam = col3;
      if (col4.includes("@")) rawEmail = col4.toLowerCase().trim();
    } else if (col4 === "Team Leader" || col4 === "Team Member") {
      roleInTeam = col4;
      if (col3.includes("@")) rawEmail = col3.toLowerCase().trim();
    } else {
      if (col3.includes("@")) rawEmail = col3.toLowerCase().trim();
      else if (col4.includes("@")) rawEmail = col4.toLowerCase().trim();
    }

    if (roleInTeam === "Team Leader") {
      leaderName = rawName || leaderName;
      if (rawEmail) leaderEmail = rawEmail;
    }

    const matchesEmail = rawEmail && currentEmail && rawEmail === currentEmail;
    const matchesName =
      rawName &&
      currentName &&
      (rawName.toLowerCase() === currentName ||
        rawName.toLowerCase().includes(currentName) ||
        currentName.includes(rawName.toLowerCase()) ||
        (currentEmail && rawName.toLowerCase().includes(currentEmail.split("@")[0])));

    if (matchesEmail || matchesName) {
      userFoundInRoster = true;
      userRoleInTeam = roleInTeam;
      if (roleInTeam === "Team Leader") {
        userIsDesignatedLeader = true;
      }
    }
  });

  if (userIsDesignatedLeader) {
    return {
      isLeader: true,
      isMember: true,
      leaderName: user?.fullName || user?.name || leaderName,
      leaderEmail: user?.email || leaderEmail,
      userRoleInTeam: "Team Leader",
      canReportOrEdit: true
    };
  }

  if (userFoundInRoster) {
    return {
      isLeader: false,
      isMember: true,
      leaderName: leaderName || defaultLeaderName || "Team Leader",
      leaderEmail: leaderEmail || defaultLeaderEmail || "",
      userRoleInTeam: "Team Member",
      canReportOrEdit: true
    };
  }

  const globalStatus = resolveGlobalTeamStatus(user);
  if (globalStatus.isMember) {
    return {
      isLeader: globalStatus.isLeader,
      isMember: true,
      leaderName: globalStatus.teamLeaderName || defaultLeaderName || "Team Leader",
      leaderEmail: globalStatus.teamLeaderEmail || defaultLeaderEmail || "",
      userRoleInTeam: globalStatus.isLeader ? "Team Leader" : "Team Member",
      canReportOrEdit: true
    };
  }

  return {
    isLeader: true,
    isMember: false,
    leaderName: defaultLeaderName || "",
    leaderEmail: defaultLeaderEmail || "",
    userRoleInTeam: null,
    canReportOrEdit: true
  };
}

export function resolveGlobalTeamStatus(user: any) {
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
      teamTitle: "Municipal Leadership (Admin)",
      teamName: "All Municipal Teams",
      teamLeaderName: user.fullName || user.email,
      teamLeaderEmail: user.email,
      canReportOrEdit: true
    };
  }

  const emailLower = user.email.toLowerCase().trim();
  const nameLower = (user.fullName || user.name || "").toLowerCase().trim();
  const jobLower = (user.jobFunction || "").toLowerCase().trim();
  const deptLower = (user.department || "").toLowerCase().trim();

  const deptKeys = ["cds", "technical_services", "corporate_services", "pms_team"];
  for (const deptKey of deptKeys) {
    const config =
      (TEAM_MODULE_CONFIGS as any)[deptKey] ||
      (deptKey === "cds" ? (TEAM_MODULE_CONFIGS as any).firefighters : null);
    if (!config || !Array.isArray(config.teams)) continue;

    for (const team of config.teams) {
      const rows = team.defaultRows || [];
      const leaderRow = rows[0] || [];
      const leaderName = leaderRow[1] || "Team Leader";
      const leaderEmail = leaderRow[3] || "";

      for (let idx = 0; idx < rows.length; idx++) {
        const r = rows[idx];
        const rName = (r[1] || "").toLowerCase().trim();
        let rRole = idx === 0 ? "Team Leader" : "Team Member";
        let rEmail = "";

        if (r[3] === "Team Leader" || r[3] === "Team Member") {
          rRole = r[3];
          if (r[4] && r[4].includes("@")) rEmail = r[4].toLowerCase().trim();
        } else if (r[4] === "Team Leader" || r[4] === "Team Member") {
          rRole = r[4];
          if (r[3] && r[3].includes("@")) rEmail = r[3].toLowerCase().trim();
        } else {
          if (r[3] && r[3].includes("@")) rEmail = r[3].toLowerCase().trim();
          else if (r[4] && r[4].includes("@")) rEmail = r[4].toLowerCase().trim();
        }

        const matches =
          (rEmail && rEmail === emailLower) ||
          (rName && nameLower && (rName.includes(nameLower) || nameLower.includes(rName))) ||
          (emailLower && rName.includes(emailLower.split("@")[0]));

        if (matches) {
          const isLeader = rRole === "Team Leader";
          return {
            isMember: true,
            isLeader,
            teamDepartment: deptKey,
            teamTitle: config.title,
            teamName: team.name,
            teamLeaderName: isLeader ? user.fullName || r[1] : leaderName,
            teamLeaderEmail: isLeader ? user.email : leaderEmail,
            canReportOrEdit: true
          };
        }
      }
    }
  }

  return {
    isMember: false,
    isLeader: false,
    teamDepartment: null,
    teamTitle: null,
    teamName: null,
    teamLeaderName: null,
    teamLeaderEmail: null,
    canReportOrEdit: true
  };
}
