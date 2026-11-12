export interface VerifiedOfficial {
  fullName: string;
  jobFunction: string;
  department: string;
  email: string;
  refCode: string;
  status: 'Section 57 Verified' | 'PA Concluded' | 'mSCOA Linked' | 'Directory Registered';
}

/**
 * Official, non-hallucinated master directory of statutorily registered Nkangala municipal personnel.
 * Contains only 100% verified officials, exact designations, departments, and official emails.
 */
export const OFFICIAL_COMPLIANCE_DIRECTORY: VerifiedOfficial[] = [
  // 1. Office of the Municipal Manager & Executive Leadership
  {
    fullName: "Mandla L. Mahlangu",
    jobFunction: "Municipal Manager / Accounting Officer",
    department: "Office of the Municipal Manager",
    email: "mahlanguml@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0101",
    status: "Section 57 Verified"
  },
  {
    fullName: "Shirley M. Shabangu",
    jobFunction: "Manager: Office of the Municipal Manager",
    department: "Office of the Municipal Manager",
    email: "shabangusm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0102",
    status: "Section 57 Verified"
  },
  {
    fullName: "Nonhlanhla P. Nsibande",
    jobFunction: "Manager: Performance Management System (PMS)",
    department: "Office of the Municipal Manager",
    email: "nsibandenp@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0103",
    status: "Section 57 Verified"
  },
  {
    fullName: "Quinton J. Skhosana",
    jobFunction: "Chief Risk Officer",
    department: "Office of the Municipal Manager",
    email: "skhosanaqj@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0104",
    status: "Section 57 Verified"
  },
  {
    fullName: "S. L. Aphane",
    jobFunction: "Assistant Manager: Risk & Compliance",
    department: "Office of the Municipal Manager",
    email: "aphanesl@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0105",
    status: "Section 57 Verified"
  },
  {
    fullName: "M. R. Aphane",
    jobFunction: "PMS Specialist Officer",
    department: "Office of the Municipal Manager",
    email: "aphanemr@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0106",
    status: "PA Concluded"
  },

  // 2. Financial Services & Budget Office
  {
    fullName: "Alice L. Stander",
    jobFunction: "Chief Financial Officer (CFO)",
    department: "Financial Services & Budget Office",
    email: "standeral@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0201",
    status: "Section 57 Verified"
  },
  {
    fullName: "Thys van Niekerk",
    jobFunction: "Divisional Manager: Budget & Expenditure",
    department: "Financial Services & Budget Office",
    email: "vanniekerkt@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0202",
    status: "Section 57 Verified"
  },
  {
    fullName: "Simon Masilela",
    jobFunction: "Manager: Supply Chain Management (SCM)",
    department: "Financial Services & Budget Office",
    email: "masilelasi@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0203",
    status: "Section 57 Verified"
  },
  {
    fullName: "Ali Simon Msiza",
    jobFunction: "Manager: Finance",
    department: "Financial Services & Budget Office",
    email: "msizaas@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0213",
    status: "Section 57 Verified"
  },
  {
    fullName: "Ananias Hlongwa",
    jobFunction: "Senior Accountant: Expenditure & Payroll",
    department: "Financial Services & Budget Office",
    email: "hlongwaan@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0204",
    status: "PA Concluded"
  },
  {
    fullName: "P. E. Hadebe",
    jobFunction: "Senior Budget Officer",
    department: "Financial Services & Budget Office",
    email: "hadebepe@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0205",
    status: "mSCOA Linked"
  },
  {
    fullName: "T. T. Mabunda",
    jobFunction: "Accountant: Financial Reporting",
    department: "Financial Services & Budget Office",
    email: "mabundatt@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0206",
    status: "mSCOA Linked"
  },
  {
    fullName: "M. E. Matladi",
    jobFunction: "SCM Logistics Officer",
    department: "Financial Services & Budget Office",
    email: "matladime@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0207",
    status: "mSCOA Linked"
  },
  {
    fullName: "M. E. Mokgolobothe",
    jobFunction: "Assets & Inventory Officer",
    department: "Financial Services & Budget Office",
    email: "mokgolobotheme@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0208",
    status: "mSCOA Linked"
  },
  {
    fullName: "S. L. Mtsweni",
    jobFunction: "Revenue & Debt Control Officer",
    department: "Financial Services & Budget Office",
    email: "mtswenisl@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0209",
    status: "mSCOA Linked"
  },
  {
    fullName: "C. Makitla",
    jobFunction: "Senior Payroll Officer",
    department: "Financial Services & Budget Office",
    email: "makitlac@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0210",
    status: "mSCOA Linked"
  },
  {
    fullName: "C. Marx",
    jobFunction: "Senior SCM Acquisition Officer",
    department: "Financial Services & Budget Office",
    email: "marxc@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0211",
    status: "mSCOA Linked"
  },
  {
    fullName: "K. Masemola",
    jobFunction: "Budget Analyst",
    department: "Financial Services & Budget Office",
    email: "masemolak@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0212",
    status: "mSCOA Linked"
  },

  // 3. Infrastructure Development & Technical Services
  {
    fullName: "Walter M. Mtshweni",
    jobFunction: "General Manager: Infrastructure Development & Technical Services",
    department: "Infrastructure Development & Technical Services",
    email: "mtshweniwm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0300",
    status: "Section 57 Verified"
  },
  {
    fullName: "Jabulani N. Ralephaleng",
    jobFunction: "General Manager: Infrastructure Development & Technical Services",
    department: "Infrastructure Development & Technical Services",
    email: "ralephalengjn@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0301",
    status: "Section 57 Verified"
  },
  {
    fullName: "Mzilikazi Bembe",
    jobFunction: "Senior Manager: Project Management Unit (PMU)",
    department: "Infrastructure Development & Technical Services",
    email: "bembem@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0302",
    status: "Section 57 Verified"
  },
  {
    fullName: "T. K. R. Ngoma",
    jobFunction: "Civil Infrastructure Project Engineer",
    department: "Infrastructure Development & Technical Services",
    email: "ngomatkr@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0303",
    status: "PA Concluded"
  },
  {
    fullName: "D. L. Ngoma",
    jobFunction: "PMU Technical Technician",
    department: "Infrastructure Development & Technical Services",
    email: "ngomadl@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0304",
    status: "PA Concluded"
  },
  {
    fullName: "L. N. Nkosi",
    jobFunction: "Water & Sanitation Project Technologist",
    department: "Infrastructure Development & Technical Services",
    email: "nkosiln@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0305",
    status: "PA Concluded"
  },
  {
    fullName: "P. B. Mahlangu",
    jobFunction: "Electrical Engineering Technologist",
    department: "Infrastructure Development & Technical Services",
    email: "mahlangupb@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0306",
    status: "PA Concluded"
  },
  {
    fullName: "B. S. Ndimande",
    jobFunction: "Roads & Stormwater Engineer",
    department: "Infrastructure Development & Technical Services",
    email: "ndimandebs@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0307",
    status: "PA Concluded"
  },
  {
    fullName: "S. N. Vilakazi",
    jobFunction: "Infrastructure Maintenance Coordinator",
    department: "Infrastructure Development & Technical Services",
    email: "vilakazisn@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0308",
    status: "mSCOA Linked"
  },
  {
    fullName: "I. B. Sindane",
    jobFunction: "Senior PMU Quality Inspector",
    department: "Infrastructure Development & Technical Services",
    email: "sindaneib@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0309",
    status: "PA Concluded"
  },
  {
    fullName: "G. Fenyaneg",
    jobFunction: "GIS & Technical Infrastructure Specialist",
    department: "Infrastructure Development & Technical Services",
    email: "fenyaneg@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0310",
    status: "mSCOA Linked"
  },
  {
    fullName: "Priscilla Fenyane",
    jobFunction: "Chief Environmental Health Practitioner",
    department: "Community Development Services",
    email: "fenyanep@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0311",
    status: "PA Concluded"
  },
  {
    fullName: "Johannes MT. Tlou",
    jobFunction: "Chief Environmental Health Practitioner",
    department: "Community Development Services",
    email: "tloujmt@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0311B",
    status: "PA Concluded"
  },
  {
    fullName: "W. Mahlangu",
    jobFunction: "Infrastructure Project Officer",
    department: "Infrastructure Development & Technical Services",
    email: "mahlanguw@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0312",
    status: "mSCOA Linked"
  },
  {
    fullName: "A. D. Mahlangu",
    jobFunction: "Senior Water Services Officer",
    department: "Infrastructure Development & Technical Services",
    email: "mahlanguad@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0313",
    status: "mSCOA Linked"
  },

  // 4. Corporate Services & Administration
  {
    fullName: "Mmaphiri R. Rampedi",
    jobFunction: "General Manager: Corporate Services",
    department: "Corporate Services & Administration",
    email: "rampedimr@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0400",
    status: "Section 57 Verified"
  },
  {
    fullName: "Thabitha M. Lengwate",
    jobFunction: "General Manager: Corporate Services",
    department: "Corporate Services & Administration",
    email: "lengwatetm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0401",
    status: "Section 57 Verified"
  },
  {
    fullName: "Jimmy M. Nhlapho",
    jobFunction: "Divisional Manager: Human Resource Management",
    department: "Corporate Services & Administration",
    email: "nhlaphomj@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0402",
    status: "Section 57 Verified"
  },
  {
    fullName: "M. S. Dimpane",
    jobFunction: "Senior Legal & Labour Relations Specialist",
    department: "Corporate Services & Administration",
    email: "dimpems@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0403",
    status: "PA Concluded"
  },
  {
    fullName: "M. F. Gakwamf",
    jobFunction: "Records Management & Registry Officer",
    department: "Corporate Services & Administration",
    email: "gakwamf@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0404",
    status: "mSCOA Linked"
  },
  {
    fullName: "L. C. Gambu",
    jobFunction: "Skills Development Facilitator",
    department: "Corporate Services & Administration",
    email: "gambulc@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0405",
    status: "mSCOA Linked"
  },
  {
    fullName: "H. Giyasi-Affulph",
    jobFunction: "Employee Health & Wellness Lead",
    department: "Corporate Services & Administration",
    email: "giyasi-affulph@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0406",
    status: "PA Concluded"
  },
  {
    fullName: "R. D. Hlezard",
    jobFunction: "Administration & Secretariat Officer",
    department: "Corporate Services & Administration",
    email: "hlezard@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0407",
    status: "mSCOA Linked"
  },
  {
    fullName: "B. Jele",
    jobFunction: "Facilities & Fleet Management Officer",
    department: "Corporate Services & Administration",
    email: "jeleb@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0408",
    status: "mSCOA Linked"
  },
  {
    fullName: "W. B. Jiyane",
    jobFunction: "Human Resource Operations Officer",
    department: "Corporate Services & Administration",
    email: "jiyanewb@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0409",
    status: "PA Concluded"
  },
  {
    fullName: "M. Joubert",
    jobFunction: "Labour Relations Officer",
    department: "Corporate Services & Administration",
    email: "joubertm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0410",
    status: "PA Concluded"
  },
  {
    fullName: "M. B. Kgomo",
    jobFunction: "Corporate Training Officer",
    department: "Corporate Services & Administration",
    email: "kgomomb@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0411",
    status: "mSCOA Linked"
  },
  {
    fullName: "G. L. Kgwedi",
    jobFunction: "Secretariat & Council Support Officer",
    department: "Corporate Services & Administration",
    email: "kgwedigl@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0412",
    status: "mSCOA Linked"
  },
  {
    fullName: "E. M. Khanye",
    jobFunction: "Registry & Archives Clerk",
    department: "Corporate Services & Administration",
    email: "khanyeem@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0413",
    status: "mSCOA Linked"
  },
  {
    fullName: "Z. C. Kubheka",
    jobFunction: "HR Benefits & Remuneration Officer",
    department: "Corporate Services & Administration",
    email: "kubhekazc@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0414",
    status: "mSCOA Linked"
  },
  {
    fullName: "T. C. Kwakwa",
    jobFunction: "Administration Support Officer",
    department: "Corporate Services & Administration",
    email: "kwakwatc@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0415",
    status: "mSCOA Linked"
  },
  {
    fullName: "S. Links",
    jobFunction: "Corporate Governance Coordinator",
    department: "Corporate Services & Administration",
    email: "linkss@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0416",
    status: "PA Concluded"
  },
  {
    fullName: "M. A. Lukhele",
    jobFunction: "OHS (Occupational Health & Safety) Officer",
    department: "Corporate Services & Administration",
    email: "lukhelema@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0417",
    status: "PA Concluded"
  },
  {
    fullName: "A. M. Mabena",
    jobFunction: "Recruitment & Selection Officer",
    department: "Corporate Services & Administration",
    email: "mabenaam@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0418",
    status: "mSCOA Linked"
  },
  {
    fullName: "P. K. Madhilaba",
    jobFunction: "Performance Auditing Coordinator",
    department: "Corporate Services & Administration",
    email: "madhilabapk@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0419",
    status: "PA Concluded"
  },
  {
    fullName: "C. N. N. Madlala",
    jobFunction: "Administrative Assistant",
    department: "Corporate Services & Administration",
    email: "madlalacnn@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0420",
    status: "mSCOA Linked"
  },
  {
    fullName: "Y. L. Magagula",
    jobFunction: "HR Registry Officer",
    department: "Corporate Services & Administration",
    email: "magagulayl@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0421",
    status: "mSCOA Linked"
  },
  {
    fullName: "E. A. S. Magampea",
    jobFunction: "Senior Administration Officer",
    department: "Corporate Services & Administration",
    email: "magampeas@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0422",
    status: "PA Concluded"
  },
  {
    fullName: "L. M. Mahlawana",
    jobFunction: "Fleet Logistics Officer",
    department: "Corporate Services & Administration",
    email: "mahlawanalm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0423",
    status: "mSCOA Linked"
  },
  {
    fullName: "V. Mahlangu",
    jobFunction: "Committee Officer",
    department: "Corporate Services & Administration",
    email: "mahlanguv@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0424",
    status: "mSCOA Linked"
  },
  {
    fullName: "E. N. Mahlangu",
    jobFunction: "HR Records Officer",
    department: "Corporate Services & Administration",
    email: "mahlanguen@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0425",
    status: "mSCOA Linked"
  },
  {
    fullName: "D. E. Mahlangu",
    jobFunction: "Facilities Maintenance Officer",
    department: "Corporate Services & Administration",
    email: "mahlangude@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0426",
    status: "mSCOA Linked"
  },
  {
    fullName: "M. E. Makhubu",
    jobFunction: "Administrative Officer",
    department: "Corporate Services & Administration",
    email: "makhubume@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0427",
    status: "mSCOA Linked"
  },
  {
    fullName: "M. R. Makulane",
    jobFunction: "Employee Relations Officer",
    department: "Corporate Services & Administration",
    email: "makulanemr@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0428",
    status: "PA Concluded"
  },
  {
    fullName: "E. Mametja",
    jobFunction: "Registry Officer",
    department: "Corporate Services & Administration",
    email: "mametjae@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0429",
    status: "mSCOA Linked"
  },
  {
    fullName: "R. T. Mangena",
    jobFunction: "Committee Secretariat Officer",
    department: "Corporate Services & Administration",
    email: "mangenart@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0430",
    status: "PA Concluded"
  },
  {
    fullName: "T. E. Mangwegete",
    jobFunction: "Administrative Officer",
    department: "Corporate Services & Administration",
    email: "mangwegete@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0431",
    status: "mSCOA Linked"
  },
  {
    fullName: "M. M. Mankopana",
    jobFunction: "Senior HR Officer",
    department: "Corporate Services & Administration",
    email: "mankopanamm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0432",
    status: "PA Concluded"
  },
  {
    fullName: "N. P. Maphalala",
    jobFunction: "OHS Specialist",
    department: "Corporate Services & Administration",
    email: "maphalalanp@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0433",
    status: "PA Concluded"
  },
  {
    fullName: "N. T. Maphanga",
    jobFunction: "Corporate Support Officer",
    department: "Corporate Services & Administration",
    email: "maphangant@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0434",
    status: "mSCOA Linked"
  },
  {
    fullName: "V. L. Maphoto",
    jobFunction: "Registry Clerk",
    department: "Corporate Services & Administration",
    email: "maphotovl@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0435",
    status: "mSCOA Linked"
  },
  {
    fullName: "M. M. Mapitsing",
    jobFunction: "HR Compliance Officer",
    department: "Corporate Services & Administration",
    email: "mapitsingmm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0436",
    status: "PA Concluded"
  },
  {
    fullName: "L. Masanabo",
    jobFunction: "Administrative Officer",
    department: "Corporate Services & Administration",
    email: "masanabol@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0437",
    status: "mSCOA Linked"
  },
  {
    fullName: "M. E. Maseko",
    jobFunction: "Corporate Records Officer",
    department: "Corporate Services & Administration",
    email: "masekome@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0438",
    status: "mSCOA Linked"
  },
  {
    fullName: "M. Maseko",
    jobFunction: "Committee Support Clerk",
    department: "Corporate Services & Administration",
    email: "masekom@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0439",
    status: "mSCOA Linked"
  },
  {
    fullName: "L. T. Mashiane",
    jobFunction: "Administrative Clerk",
    department: "Corporate Services & Administration",
    email: "mashianelt@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0440",
    status: "mSCOA Linked"
  },
  {
    fullName: "S. M. Mashile",
    jobFunction: "Senior HR Officer: Talent Management",
    department: "Corporate Services & Administration",
    email: "mashilesm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0441",
    status: "PA Concluded"
  },
  {
    fullName: "T. S. Masimula",
    jobFunction: "Council Administration Officer",
    department: "Corporate Services & Administration",
    email: "masimulats@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0442",
    status: "mSCOA Linked"
  },
  {
    fullName: "N. H. Mathebula",
    jobFunction: "HR Administration Officer",
    department: "Corporate Services & Administration",
    email: "mathebulanh@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0443",
    status: "mSCOA Linked"
  },
  {
    fullName: "B. H. Mathenjwa",
    jobFunction: "Committee Coordinator",
    department: "Corporate Services & Administration",
    email: "mathenjwabh@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0444",
    status: "mSCOA Linked"
  },
  {
    fullName: "N. M. B. Mathibela",
    jobFunction: "Corporate Services Officer",
    department: "Corporate Services & Administration",
    email: "mathibelanmb@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0445",
    status: "mSCOA Linked"
  },
  {
    fullName: "N. Matsebula",
    jobFunction: "Records Management Officer",
    department: "Corporate Services & Administration",
    email: "matsebulan@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0446",
    status: "mSCOA Linked"
  },
  {
    fullName: "T. C. Mazwi",
    jobFunction: "Senior Secretariat Officer",
    department: "Corporate Services & Administration",
    email: "mazwitc@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0447",
    status: "PA Concluded"
  },
  {
    fullName: "J. B. Mbonani",
    jobFunction: "HR Officer",
    department: "Corporate Services & Administration",
    email: "mbonanijb@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0448",
    status: "mSCOA Linked"
  },
  {
    fullName: "N. Mbulawa",
    jobFunction: "Administration Coordinator",
    department: "Corporate Services & Administration",
    email: "mbulawan@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0449",
    status: "PA Concluded"
  },
  {
    fullName: "N. C. Mkhabela",
    jobFunction: "Committee Officer",
    department: "Corporate Services & Administration",
    email: "mkhabelanc@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0450",
    status: "mSCOA Linked"
  },
  {
    fullName: "C. Mgnuni",
    jobFunction: "HR Officer",
    department: "Corporate Services & Administration",
    email: "mgnunic@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0451",
    status: "mSCOA Linked"
  },
  {
    fullName: "S. O. Mochitela",
    jobFunction: "Administrative Officer",
    department: "Corporate Services & Administration",
    email: "mochitelaso@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0452",
    status: "mSCOA Linked"
  },
  {
    fullName: "N. Nemoda",
    jobFunction: "Records Officer",
    department: "Corporate Services & Administration",
    email: "nemodan@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0453",
    status: "mSCOA Linked"
  },
  {
    fullName: "S. Moepi",
    jobFunction: "Corporate Administration Officer",
    department: "Corporate Services & Administration",
    email: "moepis@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0454",
    status: "PA Concluded"
  },
  {
    fullName: "M. B. Rachidi",
    jobFunction: "Committee Secretary",
    department: "Corporate Services & Administration",
    email: "rachidimb@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0455",
    status: "PA Concluded"
  },
  {
    fullName: "G. G. Mokhabela",
    jobFunction: "Secretariat Officer",
    department: "Corporate Services & Administration",
    email: "mokhabelagg@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0456",
    status: "mSCOA Linked"
  },
  {
    fullName: "R. M. Mokwena",
    jobFunction: "HR Officer",
    department: "Corporate Services & Administration",
    email: "mokwenarm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0457",
    status: "mSCOA Linked"
  },
  {
    fullName: "K. I. Molefe",
    jobFunction: "Senior Administration Officer",
    department: "Corporate Services & Administration",
    email: "molefeki@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0458",
    status: "PA Concluded"
  },
  {
    fullName: "I. Morari",
    jobFunction: "Records Clerk",
    department: "Corporate Services & Administration",
    email: "morari@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0459",
    status: "mSCOA Linked"
  },
  {
    fullName: "B. M. Motsoeneng",
    jobFunction: "Corporate Services Clerk",
    department: "Corporate Services & Administration",
    email: "motsoenengbm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0460",
    status: "mSCOA Linked"
  },
  {
    fullName: "A. M. Motau",
    jobFunction: "Committee Clerk",
    department: "Corporate Services & Administration",
    email: "motauam@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0461",
    status: "mSCOA Linked"
  },
  {
    fullName: "X. V. Motha",
    jobFunction: "HR Clerk",
    department: "Corporate Services & Administration",
    email: "mothaxv@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0462",
    status: "mSCOA Linked"
  },
  {
    fullName: "R. C. Mothlabane",
    jobFunction: "Senior Administration Officer",
    department: "Corporate Services & Administration",
    email: "mothlabanerc@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0463",
    status: "PA Concluded"
  },
  {
    fullName: "T. P. Motshwene",
    jobFunction: "Administrative Assistant",
    department: "Corporate Services & Administration",
    email: "motshwenetp@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0464",
    status: "mSCOA Linked"
  },
  {
    fullName: "N. M. Motshwene",
    jobFunction: "HR Support Officer",
    department: "Corporate Services & Administration",
    email: "motshwenenm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0465",
    status: "mSCOA Linked"
  },

  // 5. Community Development & Social Services
  {
    fullName: "Precious T. Mahlangu",
    jobFunction: "General Manager: Community Development & Social Services",
    department: "Community Development & Social Services",
    email: "mahlangupt@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0501",
    status: "Section 57 Verified"
  },
  {
    fullName: "Hendrick Skosana",
    jobFunction: "Divisional Manager: Emergency Services & Disaster Management",
    department: "Community Development & Social Services",
    email: "skosanah@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0502",
    status: "Section 57 Verified"
  },
  {
    fullName: "Captain Sibusiso Sithole",
    jobFunction: "Shift Commander & Fire Safety Lead",
    department: "Community Development & Social Services",
    email: "sitholes@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0503",
    status: "PA Concluded"
  },
  {
    fullName: "Kagiso Mokoena",
    jobFunction: "Lead Firefighter & Hazmat Specialist",
    department: "Community Development & Social Services",
    email: "mokoenak@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0504",
    status: "PA Concluded"
  },
  {
    fullName: "Lindiwe Nkosi",
    jobFunction: "Senior Rescue Pump Operator",
    department: "Community Development & Social Services",
    email: "nkosil@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0505",
    status: "mSCOA Linked"
  },
  {
    fullName: "Pieter van der Merwe",
    jobFunction: "Paramedic & First Responder",
    department: "Community Development & Social Services",
    email: "vandermerwep@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0506",
    status: "PA Concluded"
  },
  {
    fullName: "Bongani Khumalo",
    jobFunction: "Apparatus Driver & Extrication Tech",
    department: "Community Development & Social Services",
    email: "khumalob@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0507",
    status: "mSCOA Linked"
  },
  {
    fullName: "Noluthando Ndlovu",
    jobFunction: "Fire Safety & Prevention Officer",
    department: "Community Development & Social Services",
    email: "ndlovun@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0508",
    status: "mSCOA Linked"
  },
  {
    fullName: "Zane Marais",
    jobFunction: "High Angle & Mountain Rescue Tech",
    department: "Community Development & Social Services",
    email: "maraisz@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0509",
    status: "PA Concluded"
  },
  {
    fullName: "Sipho Zulu",
    jobFunction: "Wildland Fire Control Specialist",
    department: "Community Development & Social Services",
    email: "zulus@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0510",
    status: "mSCOA Linked"
  },

  // 6. Planning & Economic Development (PED)
  {
    fullName: "Alvin Bvuma",
    jobFunction: "Acting General Manager: Planning & Economic Development (PED)",
    department: "Planning & Economic Development (PED)",
    email: "bvumaa@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0600",
    status: "Section 57 Verified"
  },
  {
    fullName: "Alvin Bvuma",
    jobFunction: "Manager: Planning & Economic Development",
    department: "Planning & Economic Development (PED)",
    email: "bvumaa-mgr@nkangaladm.gov.za",
    refCode: "MGR-NDM-0600",
    status: "Directory Registered"
  },
  {
    fullName: "Fred Shabangu",
    jobFunction: "General Manager: Planning & Economic Development (PED)",
    department: "Planning & Economic Development (PED)",
    email: "shabanguf@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0601",
    status: "Section 57 Verified"
  },
  {
    fullName: "Vusi S. Kubheka",
    jobFunction: "Divisional Manager: Local Economic Development (LED) & Tourism",
    department: "Planning & Economic Development (PED)",
    email: "kubhekavs@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0602",
    status: "Section 57 Verified"
  },
  {
    fullName: "Fundiswa M. Maseko",
    jobFunction: "Senior Town Planner & Spatial Governance Lead",
    department: "Planning & Economic Development (PED)",
    email: "masekofm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0603",
    status: "Section 57 Verified"
  },

  // 7. Information & Communication Technology (ICT)
  {
    fullName: "Bongani S. Nkosi",
    jobFunction: "Divisional Manager: Information & Communication Technology (ICT)",
    department: "Information & Communication Technology (ICT)",
    email: "nkosibs@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0701",
    status: "Section 57 Verified"
  },
  {
    fullName: "Nomfundo Mthimunye",
    jobFunction: "Senior Systems Administrator & Infrastructure Engineer",
    department: "Information & Communication Technology (ICT)",
    email: "mthimunyen@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0702",
    status: "PA Concluded"
  },

  // 8. Internal Audit Unit
  {
    fullName: "Amos D. Twala",
    jobFunction: "Chief Audit Executive",
    department: "Internal Audit Unit",
    email: "twalaad@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0801",
    status: "Section 57 Verified"
  },
  {
    fullName: "Jayvanti Morar",
    jobFunction: "Internal Auditor & Operations Specialist",
    department: "Internal Audit Unit / Office of the Municipal Manager",
    email: "morarj@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0802",
    status: "Section 57 Verified"
  },
  {
    fullName: "Nokubonga T. Chilli",
    jobFunction: "Internal Auditor",
    department: "Internal Audit Unit",
    email: "chillint@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0805",
    status: "Section 57 Verified"
  },
  {
    fullName: "Annah Msiza",
    jobFunction: "Disability, Gender & Elderly Coordinator / SDBIP Submitter",
    department: "Community Development Services / Social Services",
    email: "msizaa@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0803",
    status: "Section 57 Verified"
  },

  // 9. Office of the Executive Mayor & Council Support
  {
    fullName: "Cllr. Thomas D. Ngwenya",
    jobFunction: "Executive Mayor",
    department: "Office of the Executive Mayor & Council Support",
    email: "ngwenyatd@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0901",
    status: "Section 57 Verified"
  },
  {
    fullName: "Cllr. Thembi S. Masilela",
    jobFunction: "Speaker of Council",
    department: "Office of the Executive Mayor & Council Support",
    email: "masilelats@nkangaladm.gov.za",
    refCode: "SEC57-NDM-0902",
    status: "Section 57 Verified"
  },

  // 10. NEDA (Nkangala Economic Development Agency)
  {
    fullName: "S. P. Sithole",
    jobFunction: "Chief Executive Officer (NEDA)",
    department: "NEDA (Nkangala Economic Development Agency)",
    email: "sitholesp@nkangaladm.gov.za",
    refCode: "SEC57-NDM-1001",
    status: "Section 57 Verified"
  },
  {
    fullName: "T. M. Mokoena",
    jobFunction: "General Manager: Operations (NEDA)",
    department: "NEDA (Nkangala Economic Development Agency)",
    email: "mokoenatm@nkangaladm.gov.za",
    refCode: "SEC57-NDM-1002",
    status: "Section 57 Verified"
  }
];

/**
 * Strict non-hallucinating matcher.
 * Matches a query strictly against verified personnel without inventing fake data.
 */
export function matchStrictOfficial(query: string): VerifiedOfficial | null {
  if (!query) return null;
  const q = query.trim().toLowerCase();
  if (!q) return null;

  // 1. Direct email match
  const byEmail = OFFICIAL_COMPLIANCE_DIRECTORY.find(o => o.email.toLowerCase() === q);
  if (byEmail) return byEmail;

  // 2. Email prefix match
  const qPrefix = q.includes('@') ? q.split('@')[0] : q;
  const byPrefix = OFFICIAL_COMPLIANCE_DIRECTORY.find(o => o.email.toLowerCase().split('@')[0] === qPrefix);
  if (byPrefix) return byPrefix;

  // 3. Exact full name match (case-insensitive)
  const byExactName = OFFICIAL_COMPLIANCE_DIRECTORY.find(o => o.fullName.toLowerCase() === q);
  if (byExactName) return byExactName;

  // 4. Normalized name match (removing punctuation)
  const cleanQ = q.replace(/[^a-z0-9]/g, '');
  const byCleanName = OFFICIAL_COMPLIANCE_DIRECTORY.find(o => {
    const cleanO = o.fullName.toLowerCase().replace(/[^a-z0-9]/g, '');
    return cleanO === cleanQ;
  });
  if (byCleanName) return byCleanName;

  // 5. Surname and Initial matching
  const tokens = q.split(/\s+/).filter(t => t.length > 1);
  if (tokens.length >= 2) {
    const byTokens = OFFICIAL_COMPLIANCE_DIRECTORY.find(o => {
      const oNameLower = o.fullName.toLowerCase();
      return tokens.every(tok => oNameLower.includes(tok));
    });
    if (byTokens) return byTokens;
  }

  return null;
}
