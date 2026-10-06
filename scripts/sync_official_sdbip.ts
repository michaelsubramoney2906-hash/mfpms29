import fs from 'fs';
import { getOfficialSdbipDataset } from '../src/data/officialSdbipScorecard';

async function main() {
  const dataset = getOfficialSdbipDataset();
  console.log(`Loaded ${dataset.length} official verbatim indicators from PDF document.`);

  // 1. Write to sdbip_master_backup.json
  fs.writeFileSync("sdbip_master_backup.json", JSON.stringify({ items: dataset, updatedAt: new Date().toISOString() }, null, 2), "utf8");
  console.log("Wrote sdbip_master_backup.json");

  // 2. Generate updated src/sdbip_catalog.ts
  const catalogCode = `// SDBIP KPI Catalog Source of Truth - Synchronized directly from official Revised 2026/2027 SDBIP
// Defines all ${dataset.length} official verbatim municipal SDBIP indicators

export interface SdbipCatalogItem {
  Ref_Number: string;
  SDBIP_Strategic_Objective: string;
  KPI: string;
  National_KPA: string;
  BSD: string;
  LED: string;
  MFVM: string;
  GGPP: string;
  MIDT: string;
  SR: string;
  Responsible_Owner: string;
  Unit_of_Measure: string;
  Baseline: string;
  Annual_Target: string;
  Budget_Allocation: string;
  Q1_Target: string;
  Q2_Target: string;
  Mid_Term_Target: string;
  Q3_Target: string;
  Q4_Target: string;
  Submitter: string;
  Approver: string;
  POE_Description: string;
  Description: string;
}

export const OFFICIAL_SDBIP_ITEMS: SdbipCatalogItem[] = ${JSON.stringify(dataset.map(it => ({
    Ref_Number: it.refNum,
    SDBIP_Strategic_Objective: it.strategicObj,
    KPI: it.kpi,
    National_KPA: it.kpas,
    BSD: it.bsd,
    LED: it.led,
    MFVM: it.mfvm,
    GGPP: it.ggpp,
    MIDT: it.midt,
    SR: it.sr,
    Responsible_Owner: it.responsibleUnit,
    Unit_of_Measure: it.uom,
    Baseline: it.baseline,
    Annual_Target: it.annualTarget,
    Budget_Allocation: it.budgetAllocation,
    Q1_Target: it.q1,
    Q2_Target: it.q2,
    Mid_Term_Target: it.midTerm,
    Q3_Target: it.q3,
    Q4_Target: it.q4,
    Submitter: it.submitter,
    Approver: it.approver,
    POE_Description: it.poeStatus,
    Description: it.operationalActivity
  })), null, 2)};

export function ensureAllSdbipKpis(extractedItems: any[] = []): SdbipCatalogItem[] {
  if (extractedItems && extractedItems.length > 0) {
    const map = new Map();
    extractedItems.forEach(it => {
      const ref = it.Ref_Number || it.refNum || it.refNo;
      if (ref) map.set(ref, it);
    });
    return OFFICIAL_SDBIP_ITEMS.map(item => {
      const override = map.get(item.Ref_Number);
      return override ? { ...item, ...override } : item;
    });
  }
  return OFFICIAL_SDBIP_ITEMS;
}

export const SDBIP_CANONICAL_CATALOG: SdbipCatalogItem[] = OFFICIAL_SDBIP_ITEMS;

export function ensureNedaSdbipKpis(extractedItems: any[] = []): SdbipCatalogItem[] {
  return ensureAllSdbipKpis(extractedItems);
}
`;

  fs.writeFileSync("src/sdbip_catalog.ts", catalogCode, "utf8");
  console.log("Updated src/sdbip_catalog.ts");

  // 3. Post to local server for live sync
  const tenants = ["tenant-229", "nkangala_auto", "nkangala", "global", "default"];
  for (const t of tenants) {
    try {
      const res = await fetch(`http://localhost:3000/api/tenant/${t}/sdbip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: dataset, overwrite: true })
      });
      const data: any = await res.json();
      console.log(`Pushed to tenant ${t}: Count ${data.count}`);
    } catch (e: any) {
      console.log(`Could not push to tenant ${t}: ${e.message}`);
    }
  }
}

main().catch(console.error);
