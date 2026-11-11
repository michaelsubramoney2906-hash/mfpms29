export interface TeamPreset {
  id: number;
  name: string;
  defaultRows: string[][];
  description?: string;
}

export interface DepartmentConfig {
  title: string;
  documentIdSuffix: string;
  defaultHeaders: string[];
  teams: TeamPreset[];
}

const CDS_CONFIG: DepartmentConfig = {
  title: "Community & Disaster Services (CDS) Team",
  documentIdSuffix: "cds",
  defaultHeaders: ["No.", "Full Name (Team Members)", "Employee Number / Station Designation", "Team Role"],
  teams: [
    {
      id: 1,
      name: "TEAM CONTROL ROOM",
      description: "Disaster Management Control Room Operations, Emergency Call Taking & Radio Communication",
      defaultRows: [
        ["1", "HERMAN DUMISANI MPOFU", "P120106", "Team Leader"],
        ["2", "PONTTSHO CEDRIC MADITSI", "FF-0204", "Team Member"],
        ["3", "SMANGELE ELIZABETH MIGGELS", "P114346", "Team Member"],
        ["4", "ANIL VALLA", "P120023", "Team Member"],
        ["5", "MANTOMBE DORAH KHUMALO", "P118930", "Team Member"],
        ["6", "PETER SIPHO SIBEKO", "P113786", "Team Member"],
        ["7", "DORCAS MASHILOANE", "P114339", "Team Member"],
        ["8", "MMANOKO CATHRINE  SELOBA", "P115222", "Team Member"]
      ]
    },
    {
      id: 2,
      name: "Bravo Shift - Wildland & Hazardous Materials",
      description: "Wildfire containment, chemical neutralization, and toxic spill response",
      defaultRows: [
        ["1", "Lieutenant Thabo Motsepe (Bravo Platoon Leader)", "FF-0201"],
        ["2", "Nomvula Mahlangu (Hazmat Specialist Level 3)", "FF-0202"],
        ["3", "Jaco Du Plessis (Wildland Forestry Driver Operator)", "FF-0203"],
        ["4", "Ayanda Radebe (Breathing Apparatus Specialist)", "FF-0204"],
        ["5", "Karabo Maseko (Incident Command Radio Dispatcher)", "FF-0205"]
      ]
    },
    {
      id: 3,
      name: "Charlie Shift - Heavy Rescue & Vehicle Extrication",
      description: "Specialized hydraulic extrication, heavy transport crash mitigation, and trench rescue",
      defaultRows: [
        ["1", "Station Officer Michael Khanyile", "FF-0301"],
        ["2", "Dumisani Mazibuko (Hydraulic Extrication Tech)", "FF-0302"],
        ["3", "Stefan van Zyl (Heavy Tender Operator)", "FF-0303"],
        ["4", "Palesa Molefe (Emergency Medical Tech)", "FF-0304"],
        ["5", "Godfrey Tshabalala (Safety & Breaching Specialist)", "FF-0305"]
      ]
    },
    {
      id: 4,
      name: "Delta Shift - Industrial Safety & Petrochemical Response",
      description: "High-temperature suppression, industrial refinery safety, and foam apparatus deployment",
      defaultRows: [
        ["1", "Lieutenant Sipho Dlamini (Industrial Fire Officer)", "FF-0401"],
        ["2", "Brandon Pillay (Foam Unit Operator)", "FF-0402"],
        ["3", "Precious Ndaba (Industrial Risk Assessor)", "FF-0403"],
        ["4", "Willem Steyn (Thermal Imaging & Vent Tech)", "FF-0404"]
      ]
    },
    {
      id: 5,
      name: "Hazmat Specialist & Chemical Containment Crew",
      description: "Radiation, biological, and dangerous goods emergency mitigation",
      defaultRows: [
        ["1", "Specialist Commander Vusi Khumalo", "FF-0501"],
        ["2", "Fatima Hoosain (Chemical Detection Analyst)", "FF-0502"],
        ["3", "Clarence Sithole (Decontamination Unit Tech)", "FF-0503"],
        ["4", "Kobus Engelbrecht (Hazmat Incident Officer)", "FF-0504"]
      ]
    },
    {
      id: 6,
      name: "Emergency Medical & First Responder Unit",
      description: "Triage operations, advanced life support, and rapid evacuation",
      defaultRows: [
        ["1", "Paramedic Lead Lerato Mthembu", "FF-0601"],
        ["2", "David Naidoo (Intermediate Life Support)", "FF-0602"],
        ["3", "Zanele Vilakazi (Emergency Care Practitioner)", "FF-0603"],
        ["4", "Henk Joubert (Ambulance & Rescue Driver)", "FF-0604"]
      ]
    },
    {
      id: 7,
      name: "Aviation & Aerodrome Rescue Platoon",
      description: "Airport runway emergency response and aircraft firefighting",
      defaultRows: [
        ["1", "Commander Johannes Swart (ARFF Lead)", "FF-0701"],
        ["2", "Mandla Maseko (Crash Tender Driver)", "FF-0702"],
        ["3", "Refilwe Tau (Aircraft Evacuation Tech)", "FF-0703"]
      ]
    },
    {
      id: 8,
      name: "High-Angle, Confined Space & Mountain Rescue",
      description: "Vertical rope rescue, cliff evacuation, and silo/trench operations",
      defaultRows: [
        ["1", "Rope Rescue Commander Siphiwe Gwebu", "FF-0801"],
        ["2", "Andrew Scott (High-Angle Technician)", "FF-0802"],
        ["3", "Nompumelelo Shabangu (Confined Space Specialist)", "FF-0803"]
      ]
    },
    {
      id: 9,
      name: "Water Rescue & Aquatic Dive Unit",
      description: "Swiftwater rescue, flood response, and submerged asset recovery",
      defaultRows: [
        ["1", "Master Diver Bheki Zwane", "FF-0901"],
        ["2", "Gert Bekker (Swiftwater Rescue Specialist)", "FF-0902"],
        ["3", "Themba Masina (Boat Pilot & Water Rescuer)", "FF-0903"]
      ]
    },
    {
      id: 10,
      name: "Disaster Management & Incident Command Support",
      description: "Strategic coordination, emergency communications, and operational logistics",
      defaultRows: [
        ["1", "HERMAN DUMISANI MPOFU", "P120106", "Team Leader"],
        ["2", "PONTTSHO CEDRIC MADITSI", "FF-0204", "Team Member"],
        ["3", "SMANGELE ELIZABETH MIGGELS", "P114346", "Team Member"],
        ["4", "ANIL VALLA", "P120023", "Team Member"],
        ["5", "MANTOMBE DORAH KHUMALO", "P118930", "Team Member"],
        ["6", "PETER SIPHO SIBEKO", "P113786", "Team Member"],
        ["7", "DORCAS MASHILOANE", "P114339", "Team Member"],
        ["8", "MMANOKO CATHRINE  SELOBA", "P115222", "Team Member"]
      ]
    }
  ]
};

const RAW_TEAM_CONFIGS: Record<string, DepartmentConfig> = {
  cds: CDS_CONFIG,
  firefighters: CDS_CONFIG,

  technical_services: {
    title: "Technical Services Team",
    documentIdSuffix: "technical_services",
    defaultHeaders: ["No.", "Full Name (Team Members)", "Employee Number / Technical Designation", "Team Role"],
    teams: [
      {
        id: 1,
        name: "Bulk Water & Sanitation Operations",
        description: "Bulk water transmission, reservoirs, reticulation, and wastewater treatment plants",
        defaultRows: [
          ["1", "Eng. Sipho Mthembu (Chief Engineer / General Manager)", "TS-0100"],
          ["2", "Johan Botha (Senior Water Network Superintendent)", "TS-0205"],
          ["3", "Nolwazi Dube (Water Distribution Supervisor)", "TS-0312"],
          ["4", "Tebogo Radebe (Pipe Fitting & Valve Specialist)", "TS-0418"],
          ["5", "Farai Moyo (Wastewater Plant Process Controller)", "TS-0525"],
          ["6", "Mandla Ndlovu (Water Quality Testing Tech)", "TS-0630"]
        ]
      },
      {
        id: 2,
        name: "Electricity Grid & Energy Distribution",
        description: "High/medium voltage electrical networks, substation maintenance, and streetlight infrastructure",
        defaultRows: [
          ["1", "Eng. Nolwazi Dube (Electrical Grid Distribution Manager)", "TS-0201"],
          ["2", "Kobus Pretorius (High-Voltage Substation Inspector)", "TS-0202"],
          ["3", "Vusi Mahlangu (Master Electrician / Linesman)", "TS-0203"],
          ["4", "Precious Sibeko (Meter Auditing & Loss Control)", "TS-0204"],
          ["5", "Dean Moodley (SCADA & Power Control Engineer)", "TS-0205"]
        ]
      },
      {
        id: 3,
        name: "Roads, Bridges & Stormwater Infrastructure",
        description: "Road resurfacing, pothole repair, stormwater attenuation, and bridges engineering",
        defaultRows: [
          ["1", "Tebogo Radebe (Roads, Stormwater & Civil Works Lead)", "TS-0301"],
          ["2", "Sibusiso Nkosi (Heavy Earthmoving Plant Operator)", "TS-0302"],
          ["3", "Dirk Van Der Walt (Asphalt & Pavement Inspector)", "TS-0303"],
          ["4", "Nomsa Sithole (Stormwater Drainage Superintendent)", "TS-0304"]
        ]
      },
      {
        id: 4,
        name: "Project Management Unit (PMU Engineering)",
        description: "Capital projects execution, MIG grants management, contractor oversight, and site inspections",
        defaultRows: [
          ["1", "Farai Moyo (PMU Engineering Project Manager)", "TS-0401"],
          ["2", "Lindiwe Dlamini (MIG Grants Compliance Lead)", "TS-0402"],
          ["3", "Thabo Khumalo (Civil Infrastructure Resident Engineer)", "TS-0403"],
          ["4", "Audrey Coetzee (Quality & Materials Inspector)", "TS-0404"]
        ]
      },
      {
        id: 5,
        name: "Fleet & Mechanical Workshop Services",
        description: "Municipal vehicles maintenance, heavy machinery overhaul, and fuel management",
        defaultRows: [
          ["1", "Mandla Ndlovu (Fleet & Mechanical Workshop Foreman)", "TS-0501"],
          ["2", "Gerrit Du Toit (Senior Diesel Mechanic)", "TS-0502"],
          ["3", "Patrick Maseko (Auto Electrician Specialist)", "TS-0503"],
          ["4", "Zama Sithole (Fleet Telematics & Fuel Controller)", "TS-0504"]
        ]
      },
      {
        id: 6,
        name: "Water Quality, Laboratories & Blue Drop Compliance",
        description: "Potable water chemical analysis, SANS 241 compliance, and effluent testing",
        defaultRows: [
          ["1", "Dr. Annelize Coetzee (Chief Chemist / Water Quality Lead)", "TS-0601"],
          ["2", "Kagiso Molefe (Microbiology Laboratory Analyst)", "TS-0602"],
          ["3", "Sipho Mashego (Sampling & Water Safety Officer)", "TS-0603"]
        ]
      },
      {
        id: 7,
        name: "Substation Automation & Renewable Energy",
        description: "Green energy integration, solar plants, telemetry systems, and smart grid automation",
        defaultRows: [
          ["1", "Specialist Engineer Vusi Vilakazi", "TS-0701"],
          ["2", "Craig Peters (Solar PV & Grid Integration Tech)", "TS-0702"],
          ["3", "Noluthando Sithole (Substation SCADA Specialist)", "TS-0703"]
        ]
      },
      {
        id: 8,
        name: "Civil Rapid Response & Emergency Repairs",
        description: "Burst main mitigation, structural collapse response, and emergency bypass installations",
        defaultRows: [
          ["1", "Superintendent Bheki Mthembu", "TS-0801"],
          ["2", "Willem Botha (Emergency Pipe Welder & Rigger)", "TS-0802"],
          ["3", "Katlego Dlamini (Civil Maintenance Operator)", "TS-0803"]
        ]
      },
      {
        id: 9,
        name: "Rural Infrastructure & Borehole Systems",
        description: "Groundwater extraction, solar-powered boreholes, and rural communal water points",
        defaultRows: [
          ["1", "Project Officer Themba Nkosi", "TS-0901"],
          ["2", "Pieter Van Rensburg (Hydro-Geological Technician)", "TS-0902"],
          ["3", "Nomvula Khanyile (Rural Water Committee Liaison)", "TS-0903"]
        ]
      },
      {
        id: 10,
        name: "TEAM: JETPATCHER DRIVER/ OPERATORS",
        description: "Road maintenance, pothole patching, and Jetpatcher operations across Nkangala District",
        defaultRows: [
          ["1", "Michael P. Ntuli (Jetpatcher Driver/ Operator)", "P120759", "Team Leader"],
          ["2", "Amos Mahlangu (Jetpatcher Driver/ Operator)", "P120758", "Team Member"],
          ["3", "Christina Skosana (Jetpatcher Driver/ Operator)", "P120760", "Team Member"],
          ["4", "Nozipho Maggie Manana (Jetpatcher Driver/ Operator)", "P121658", "Team Member"],
          ["5", "Bhekithemba Nsingwane (Jetpatcher Driver/ Operator)", "P121679", "Team Member"],
          ["6", "Sibusiso S. Mahlangu (Jetpatcher Driver/ Operator)", "P120660", "Team Member"]
        ]
      }
    ]
  },

  corporate_services: {
    title: "Corporate Services Team",
    documentIdSuffix: "corporate_services",
    defaultHeaders: ["No.", "Full Name (Team Members)", "Employee Number / Designation", "Team Role"],
    teams: [
      {
        id: 1,
        name: "Human Resources Management & Development",
        description: "Talent acquisition, payroll, employee relations, and workforce planning",
        defaultRows: [
          ["1", "Audrey Mpanza (Director: Corporate Services)", "CS-0101"],
          ["2", "Mike Thompson (Senior HR & Governance Lead)", "CS-0205"],
          ["3", "Fatima Patel (Legal & Administration Officer)", "CS-0312"],
          ["4", "Sipho Dlamini (IT & Records Systems Administrator)", "CS-0418"],
          ["5", "Zama Khumalo (Committee & Secretariat Specialist)", "CS-0522"],
          ["6", "Thabo Mokoena (Auxiliary Services & Logistics Coordinator)", "CS-0630"],
          ["7", "Lerato Moloi (Employee Wellness & OHS Officer)", "CS-0740"],
          ["8", "Precious Sithole (Customer Care & Communications Lead)", "CS-0855"]
        ]
      },
      {
        id: 2,
        name: "ICT, Records & Digital Infrastructure",
        description: "Network security, enterprise ERP systems, database integrity, and municipal connectivity",
        defaultRows: [
          ["1", "Sipho Dlamini (IT & Records Systems Administrator)", "CS-0201"],
          ["2", "David Nkosi (Senior Network & Cyber Security Engineer)", "CS-0202"],
          ["3", "Michelle Joubert (Database & ERP Administrator)", "CS-0203"],
          ["4", "Katlego Sithole (Helpdesk & Hardware Support Tech)", "CS-0204"]
        ]
      },
      {
        id: 3,
        name: "Legal Services & Corporate Compliance",
        description: "Litigation management, municipal bylaws, contract vetting, and statutory governance",
        defaultRows: [
          ["1", "Adv. Fatima Patel (Senior Legal Counsel)", "CS-0301"],
          ["2", "Thami Mahlangu (Compliance & Risk Auditor)", "CS-0302"],
          ["3", "Annelize Botha (Contract Vetting Specialist)", "CS-0303"]
        ]
      },
      {
        id: 4,
        name: "Council Secretariat & Committee Support",
        description: "Mayoral committee support, council agendas, minute taking, and resolution tracking",
        defaultRows: [
          ["1", "Zama Khumalo (Committee & Secretariat Specialist)", "CS-0401"],
          ["2", "Sibusiso Ndlovu (Council Agendas Administrator)", "CS-0402"],
          ["3", "Precious Sibeko (Resolution Tracking Officer)", "CS-0403"]
        ]
      },
      {
        id: 5,
        name: "Auxiliary Services, Facilities & Logistics",
        description: "Municipal buildings maintenance, security, cleaning, and asset protection",
        defaultRows: [
          ["1", "Thabo Mokoena (Auxiliary Services & Logistics Coordinator)", "CS-0501"],
          ["2", "Bongani Zwane (Facilities Operations Supervisor)", "CS-0502"],
          ["3", "Nomsa Khumalo (Registry & Printing Coordinator)", "CS-0503"]
        ]
      },
      {
        id: 6,
        name: "Employee Wellness, Labour Relations & Bargaining",
        description: "SALGBC dispute management, grievance handling, and employee health programs",
        defaultRows: [
          ["1", "Lerato Moloi (Labour Relations & Wellness Lead)", "CS-0601"],
          ["2", "Godfrey Tshabalala (Bargaining Council Specialist)", "CS-0602"],
          ["3", "Refilwe Tau (Occupational Nurse / Counselor)", "CS-0603"]
        ]
      },
      {
        id: 7,
        name: "Customer Care, Communications & Public Relations",
        description: "Municipal call centre, citizen complaints management, social media, and newsletters",
        defaultRows: [
          ["1", "Precious Sithole (Communications & Customer Care Lead)", "CS-0701"],
          ["2", "Mpho Dube (Municipal Spokesperson / Media Officer)", "CS-0702"],
          ["3", "Vusi Maseko (Call Centre Operations Supervisor)", "CS-0703"]
        ]
      },
      {
        id: 8,
        name: "Registry, Archive & Document Management",
        description: "National Archives Act compliance, document scanning, electronic records, and file classification",
        defaultRows: [
          ["1", "Chief Archivist Nomvula Mahlangu", "CS-0801"],
          ["2", "Johan Van Zyl (Records Management Specialist)", "CS-0802"],
          ["3", "Kagiso Molefe (Scanning & Indexing Clerk)", "CS-0803"]
        ]
      },
      {
        id: 9,
        name: "Occupational Health, Safety & Environmental Compliance",
        description: "OHSA compliance, hazard identification, PPE distribution, and incident investigations",
        defaultRows: [
          ["1", "Safety Officer Hendrik Steyn (OHS Manager)", "CS-0901"],
          ["2", "Lindiwe Mazibuko (Workplace Safety Inspector)", "CS-0902"],
          ["3", "Sipho Khanyile (Incident Investigation Specialist)", "CS-0903"]
        ]
      },
      {
        id: 10,
        name: "Skills Development & Workplace Training",
        description: "WSP/ATR submissions to LGSETA, learnerships, bursary schemes, and performance training",
        defaultRows: [
          ["1", "Skills Development Facilitator (SDF) Zanele Nkosi", "CS-1001"],
          ["2", "Dumisani Sithole (Learnership & Internship Coordinator)", "CS-1002"],
          ["3", "Pieter Marais (Training Program Evaluator)", "CS-1003"]
        ]
      }
    ]
  },

  pms_team: {
    title: "PMS Team",
    documentIdSuffix: "pms_team",
    defaultHeaders: ["No.", "Full Name (Team Members)", "Employee Number / Designation", "Team Role"],
    teams: [
      {
        id: 1,
        name: "Institutional Performance & SDBIP Planning",
        description: "Top-layer SDBIP formulation, institutional scorecard drafting, and quarterly review frameworks",
        defaultRows: [
          ["1", "Noluthando E. Zulu", "P113807", "PMS Officer"],
          ["2", "Nompumelelo P. Nsibande", "P120480", "PMS Officer"]
        ]
      },
      {
        id: 2,
        name: "Monitoring, Evaluation & Quarterly Reporting",
        description: "Section 52d and Section 72 mid-year reporting, KPI verification, and performance dashboards",
        defaultRows: [
          ["1", "Qiniso Sithole (M&E Reporting Specialist)", "PM-0201"],
          ["2", "Marlan Botha (Senior Data Analytics Lead)", "PM-0202"],
          ["3", "Lerato Molefe (Quarterly Indicator Verifier)", "PM-0203"],
          ["4", "Bongani Dlamini (PMS Automation Specialist)", "PM-0204"]
        ]
      },
      {
        id: 3,
        name: "Audit Liaison & AGSA Performance Compliance",
        description: "Auditor-General performance audit liaison, AOPO compliance, and audit action plan monitoring",
        defaultRows: [
          ["1", "Brandon Pillay (Quality Assurance & Audit Liaison)", "PM-0301"],
          ["2", "Farai Moyo (AOPO Compliance Specialist)", "PM-0302"],
          ["3", "Zama Sithole (Audit Findings Remediation Lead)", "PM-0303"]
        ]
      },
      {
        id: 4,
        name: "Departmental Scorecards & Cascading Unit",
        description: "Cascading performance agreements to levels 2-6 across all municipal departments",
        defaultRows: [
          ["1", "Grace Mahlangu (Departmental Scorecard Coordinator)", "PM-0401"],
          ["2", "Sipho Zulu (Cascading Implementation Officer)", "PM-0402"],
          ["3", "Thabo Motsepe (Performance Review Moderator)", "PM-0403"]
        ]
      },
      {
        id: 5,
        name: "Portfolio of Evidence (POE) & Verification Unit",
        description: "Systematic auditing of target evidence files, source documents verification, and pre-audit sampling",
        defaultRows: [
          ["1", "Dumisani Nkosi (Evidence & POE Verification Analyst)", "PM-0501"],
          ["2", "Audrey Coetzee (Document Verifier & Auditor)", "PM-0502"],
          ["3", "Patrick Mthembu (Field Evidence Inspector)", "PM-0503"]
        ]
      },
      {
        id: 6,
        name: "Risk & Strategic Performance Alignment",
        description: "Enterprise risk mitigation alignment with SDBIP targets and quarterly risk scorecards",
        defaultRows: [
          ["1", "Strategic Risk Officer Nomvula Khumalo", "PM-0601"],
          ["2", "David Naidoo (Risk & KPI Correlation Analyst)", "PM-0602"]
        ]
      },
      {
        id: 7,
        name: "Municipal Entities Oversight & Performance",
        description: "Monitoring service delivery entities, agency performance agreements, and SLA compliance",
        defaultRows: [
          ["1", "Entities Oversight Officer Vusi Mahlangu", "PM-0701"],
          ["2", "Kagiso Dube (Entity SLA Performance Verifier)", "PM-0702"]
        ]
      },
      {
        id: 8,
        name: "IDP Alignment & Five-Year Strategic Target Unit",
        description: "Integrated Development Plan alignment with national/provincial outcomes and 5-year targets",
        defaultRows: [
          ["1", "IDP Strategy Specialist Michelle Joubert", "PM-0801"],
          ["2", "Kobus Engelbrecht (Strategic Target Modeler)", "PM-0802"]
        ]
      },
      {
        id: 9,
        name: "Automated PMS & Systems Integration",
        description: "Real-time municipal digital dashboard integration, mSCOA integration, and reporting automation",
        defaultRows: [
          ["1", "Systems Architect Siphiwe Gwebu", "PM-0901"],
          ["2", "Dean Moodley (PMS Software & Database Engineer)", "PM-0902"]
        ]
      },
      {
        id: 10,
        name: "Performance Audit Committee (PAC) Secretariat",
        description: "PAC meeting packs, independent evaluation reports, and council reporting documentation",
        defaultRows: [
          ["1", "PAC Secretary Zanele Vilakazi", "PM-1001"],
          ["2", "Hendrik Venter (PAC Reporting Specialist)", "PM-1002"]
        ]
      }
    ]
  }
};

function normalizeDepartmentConfig(cfg: DepartmentConfig): DepartmentConfig {
  return {
    ...cfg,
    defaultHeaders: ["No.", "Full Name (Team Members)", "Employee Number / Designation", "Team Role"],
    teams: cfg.teams.map(team => ({
      ...team,
      defaultRows: team.defaultRows.map((row, idx) => {
        const no = row[0] || String(idx + 1);
        const name = row[1] || '';
        const desig = row[2] || '';
        const role = (row[3] === 'Team Leader' || row[3] === 'Team Member') 
          ? row[3] 
          : (idx === 0 ? 'Team Leader' : 'Team Member');
        return [no, name, desig, role];
      })
    }))
  };
}

// Apply normalization to ensure all 4 municipal team configs strictly include Team Leader & Team Member roles
const NORMALIZED_CONFIGS: Record<string, DepartmentConfig> = {
  cds: normalizeDepartmentConfig(RAW_TEAM_CONFIGS.cds),
  firefighters: normalizeDepartmentConfig(RAW_TEAM_CONFIGS.cds),
  technical_services: normalizeDepartmentConfig(RAW_TEAM_CONFIGS.technical_services),
  corporate_services: normalizeDepartmentConfig(RAW_TEAM_CONFIGS.corporate_services),
  pms_team: normalizeDepartmentConfig(RAW_TEAM_CONFIGS.pms_team)
};

export const TEAM_MODULE_CONFIGS: Record<string, DepartmentConfig> = NORMALIZED_CONFIGS;
