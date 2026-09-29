export const PERFORMANCE_AGREEMENT_DATA = {
  kpas: [
    {
      id: "KPA_01",
      name: "INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
      weighting: 15,
      kpis: [
        { id: "M_01", indicator: "Maximum acceptable percentage of Staff vacancy rate (circular 88) per quarter", annualTarget: "≤10%" },
        { id: "M_02", indicator: "Percentage of vacant posts filled within 6 months (circular 88) by 30 June 2027", annualTarget: "93%" },
        // ... (remaining M-01 to M-38 from agreement)
      ]
    },
    // ... (KPA 2 to 7)
  ],
  coreCompetencies: [
    { name: "Strategic Direction and Leadership", weighting: 10 },
    { name: "People Management", weighting: 10 },
    // ... (remaining competencies)
  ]
};

export const SDBIP_DATA = {
  kpas: [
    {
      id: "KPA_01",
      name: "INSTITUTIONAL DEVELOPMENT AND TRANSFORMATION",
      kpis: [
         { id: "M_01", indicator: "Maximum acceptable percentage of staff vacancy rate" },
         // ... (remaining M-01 to M-92, P-01 to P-18)
      ],
      projects: []
    }
  ]
};

export const NKANGALA_HARDCODED_DATA = {
  performanceAgreement: PERFORMANCE_AGREEMENT_DATA,
  sdbip: SDBIP_DATA,
};
