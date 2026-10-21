export interface OfficialJSCItem {
  id: string;
  jscNo: string;
  competency: string;
  definition: string;
  level: string;
  weight: number;
  category: string;
}

export const RAKAUJ_METADATA = {
  employeeName: "Johannah M. Rakau",
  employeeTitle: "Chief Environmental Health Practitioner",
  department: "Community Development Services",
  position: "Chief EHP",
  level: "04",
  employerName: "Johannes M. Tlou",
  employerTitle: "General Manager: Community Development Services",
  manager: "Johannes MT. Tlou",
  managerEmail: "tloujmt@nkangaladm.gov.za",
  reportTo: "Johannes MT. Tlou",
  financialYear: "2026/2027",
  period: "01 July 2026 – 30 June 2027",
  municipality: "The Nkangala District Municipality"
};

export const RAKAUJ_OFFICIAL_KPAS = [
  { kpaNumber: "1", kpaName: "GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION", fullTitle: "KPA 1: GOOD GOVERNANCE AND INSTITUTIONAL TRANSFORMATION", weighting: "11%" },
  { kpaNumber: "2", kpaName: "FOOD CONTROL AND SAFETY", fullTitle: "KPA 2: FOOD CONTROL AND SAFETY", weighting: "17%" },
  { kpaNumber: "3", kpaName: "WATER QUALITY MONITORING", fullTitle: "KPA 3: WATER QUALITY MONITORING", weighting: "10%" },
  { kpaNumber: "4", kpaName: "WASTE MANAGEMENT", fullTitle: "KPA 4: WASTE MANAGEMENT", weighting: "12%" },
  { kpaNumber: "5", kpaName: "SURVEILLANCE OF PREMISES", fullTitle: "KPA 5: SURVEILLANCE OF PREMISES", weighting: "35%" },
  { kpaNumber: "6", kpaName: "EDUCATION AND AWARENESS", fullTitle: "KPA 6: EDUCATION AND AWARENESS", weighting: "15%" }
];

export const RAKAUJ_OFFICIAL_JSCS: OfficialJSCItem[] = [
  {
    id: "jsc-rakauj-1",
    jscNo: "1",
    competency: "Attention to detail.",
    definition: "Ability to scrutinize own work and that of others to ensure accuracy and compliance with the relevant municipal standards.",
    level: "3",
    weight: 15,
    category: "Core Professional competencies"
  },
  {
    id: "jsc-rakauj-2",
    jscNo: "2",
    competency: "Planning and organising",
    definition: "The ability to plan activities within specific timeframes and then to execute these activities according to plan.",
    level: "3",
    weight: 15,
    category: "Core Professional competencies"
  },
  {
    id: "jsc-rakauj-3",
    jscNo: "3",
    competency: "Interpersonal Relationships",
    definition: "The ability to establish and maintain productive relationships with people within and outside of the Municipality.",
    level: "3",
    weight: 20,
    category: "Public Service Orientation Competencies"
  },
  {
    id: "jsc-rakauj-4",
    jscNo: "4",
    competency: "Client Orientation and Customer Focus",
    definition: "Understands the service needs of a client/customer (internal or external) and actively focuses on anticipating, meeting and exceeding the needs in a timely and appropriate manner.",
    level: "3",
    weight: 25,
    category: "Public Service Orientation Competencies"
  },
  {
    id: "jsc-rakauj-5",
    jscNo: "5",
    competency: "Integrity",
    definition: "Behaves in an honest, fair, and ethical manner.",
    level: "3",
    weight: 25,
    category: "Personal Competencies"
  }
];

export const RAKAUJ_FULL_COMPETENCY_ROWS = RAKAUJ_OFFICIAL_JSCS.map(j => ({
  id: j.id,
  jscNo: j.jscNo,
  competency: j.competency,
  category: j.category,
  definition: {
    mainText: j.definition,
    subsections: []
  },
  level: `Level ${j.level}`,
  proficiency: `Level ${j.level}`,
  weight: j.weight,
  weighting: `${j.weight}%`,
  q1: { selfScore: 0, selfComments: "", managerScore: 0, managerMotivation: "", status: "draft" as const },
  q2: { selfScore: 0, selfComments: "", managerScore: 0, managerMotivation: "", status: "draft" as const },
  q3: { selfScore: 0, selfComments: "", managerScore: 0, managerMotivation: "", status: "draft" as const },
  q4: { selfScore: 0, selfComments: "", managerScore: 0, managerMotivation: "", status: "draft" as const }
}));
