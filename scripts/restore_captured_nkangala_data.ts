import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

function getCleanEmail(raw: string): string | null {
  if (!raw) return null;
  const match = raw.match(/([a-zA-Z0-9._%+-]+@nkangaladm\.[a-z.]+)/i);
  if (!match) return null;
  let em = match[1].toLowerCase().trim();
  if (em.includes("_")) {
    const parts = em.split("_");
    em = parts[parts.length - 1];
  }
  return em;
}

interface UserCapturedData {
  email: string;
  kpas: any[];
  customKpaTable: any | null;
  kpis: any[];
  pdp: any[];
  jsc: any[];
  sourceDocs: string[];
}

async function run() {
  console.log("=== STARTING NKANGALA PERFORMANCE DATA IMPORT (AS AT 4 OCT 2026) ===");

  // 1. Fetch all drafting suite documents and pa templates
  console.log("Step 1: Fetching all captured draft documents and PA templates...");
  const { data: drafts, error: dErr } = await supabase
    .from('messages')
    .select('id, content, created_at')
    .like('id', 'draft_doc_%');
  if (dErr) console.error("Error fetching drafts:", dErr);

  const { data: pas, error: pErr } = await supabase
    .from('messages')
    .select('id, content, created_at')
    .like('id', 'pa_templates_%');
  if (pErr) console.error("Error fetching pas:", pErr);

  const { data: pplans, error: ppErr } = await supabase
    .from('messages')
    .select('id, content, created_at')
    .like('id', 'pplan_%');
  if (ppErr) console.error("Error fetching pplans:", ppErr);

  console.log(`Found ${drafts?.length || 0} drafts, ${pas?.length || 0} PA templates, and ${pplans?.length || 0} pplans.`);

  const userMap = new Map<string, UserCapturedData>();

  function ensureUser(email: string): UserCapturedData {
    if (!userMap.has(email)) {
      userMap.set(email, {
        email,
        kpas: [],
        customKpaTable: null,
        kpis: [],
        pdp: [],
        jsc: [],
        sourceDocs: []
      });
    }
    return userMap.get(email)!;
  }

  function processAgreement(content: string, docId: string) {
    const email = getCleanEmail(docId);
    if (!email) return;
    try {
      const p = JSON.parse(content);
      const h = Array.isArray(p.templates) ? p.templates[0] : (p.template || p.html || p);
      if (!h) return;

      const user = ensureUser(email);
      user.sourceDocs.push(docId);

      // KPIs
      const rawKpis = h.pulledFilteredPplanItems || h.pulledPplanItems;
      if (Array.isArray(rawKpis) && rawKpis.length > user.kpis.length) {
        user.kpis = rawKpis;
      }

      // PDP
      const rawPdp = h.pulledPdpItems || h.pdpCustomTable;
      if (Array.isArray(rawPdp) && rawPdp.length > user.pdp.length) {
        user.pdp = rawPdp;
      }

      // JSC
      const rawJsc = h.pulledKhuboniJscRows || h.pulledCompetencyRows || h.pulledCorpCompetencyRows || h.pulledCfoCompetencyRows || h.pulledPedCompetencyRows || h.pulledJscRows;
      if (Array.isArray(rawJsc) && rawJsc.length > user.jsc.length) {
        user.jsc = rawJsc;
      }

      // KPAs from customTables
      if (Array.isArray(h.customTables)) {
        const kt = h.customTables.find((t: any) => Array.isArray(t?.headers) && t.headers.some((hdr: any) => String(hdr).toLowerCase().includes('kpa') || String(hdr).toLowerCase().includes('key performance')));
        if (kt && Array.isArray(kt.rows)) {
          const validRows = kt.rows.filter((r: any) => r && (r[0] || r[1]) && String(r[0] || r[1]).trim().toLowerCase() !== 'total');
          if (validRows.length > user.kpas.length) {
            user.customKpaTable = kt;
            user.kpas = validRows.map((r: any, idx: number) => {
              const numVal = r[0] ? String(r[0]).trim() : String(idx + 1);
              const titleVal = r[1] ? String(r[1]).trim() : (r[0] ? String(r[0]).trim() : `KPA ${idx + 1}`);
              const weightVal = r[2] ? parseFloat(String(r[2]).replace(/[^0-9.]/g, '')) || 0 : (r[1] && !isNaN(parseFloat(r[1])) ? parseFloat(r[1]) : 0);
              let name = titleVal;
              if (!name.toLowerCase().startsWith('kpa') && /^[0-9]+/.test(numVal)) {
                name = `KPA ${numVal}: ${titleVal}`;
              }
              return {
                id: `kpa-${idx + 1}`,
                name: name,
                title: titleVal,
                weighting: weightVal,
                nationalKpa: name.toUpperCase()
              };
            });
          }
        }
      }
    } catch(e) {}
  }

  for (const d of drafts || []) processAgreement(d.content, d.id);
  for (const p of pas || []) processAgreement(p.content, p.id);

  // Derive KPAs from KPIs if missing
  userMap.forEach(u => {
    if (u.kpas.length === 0 && u.kpis.length > 0) {
      const distinctKpas = new Map<string, any>();
      u.kpis.forEach(k => {
        if (k.kpa && typeof k.kpa === 'string' && k.kpa.trim()) {
          const kName = k.kpa.trim();
          if (!distinctKpas.has(kName)) {
            distinctKpas.set(kName, {
              id: `kpa-${distinctKpas.size + 1}`,
              name: kName,
              title: kName.replace(/^KPA\s*\d+[:.-]?\s*/i, ''),
              weighting: 0,
              nationalKpa: kName.toUpperCase()
            });
          }
        }
      });
      if (distinctKpas.size > 0) {
        u.kpas = Array.from(distinctKpas.values());
      }
    }
  });

  // Non-17 pplans
  for (const pp of pplans || []) {
    const email = getCleanEmail(pp.id);
    if (!email) continue;
    try {
      const p = JSON.parse(pp.content);
      const items = Array.isArray(p.items) ? p.items : (Array.isArray(p) ? p : (p.rows || []));
      if (items.length > 0 && items.length !== 17) {
        const u = ensureUser(email);
        if (items.length > u.kpis.length) {
          u.kpis = items;
        }
      }
    } catch(e) {}
  }

  console.log(`Step 2: Extracted captured agreements for ${userMap.size} users.`);

  // Filter out any completely empty users
  const activeCapturedUsers = Array.from(userMap.values()).filter(u => (u.kpas.length > 0 || u.kpis.length > 0 || u.jsc.length > 0 || u.pdp.length > 0));
  console.log(`Step 3: Found ${activeCapturedUsers.length} users with non-zero captured performance data.`);

  // 4. Purge generic batch restoration engine records and corrupted nested records
  console.log("Step 4: Purging generic batch restoration records and corrupted nested IDs...");
  const purgeBatches = [
    supabase.from('messages').delete().eq('sender_id', 'batch_restoration_engine'),
    supabase.from('messages').delete().like('id', '%_global_job_competencies_%'),
    supabase.from('messages').delete().like('id', '%_global_kpis_%'),
    supabase.from('messages').delete().like('id', '%_global_kpas_%'),
    supabase.from('messages').delete().like('id', '%_global_pdp_%'),
    supabase.from('messages').delete().like('id', '%_global_pplan_%')
  ];
  for (const p of purgeBatches) {
    const { error } = await p;
    if (error) console.error("Purge error:", error);
  }
  console.log("Generic records purged.");

  // 5. Upsert exact authentic records for all captured users across relevant tenants
  console.log("Step 5: Upserting exact authentic performance records to Supabase...");
  const tenants = ['nkangala_auto', 'tenant-229', 'global'];
  const allUpserts: any[] = [];
  const now = new Date().toISOString();

  for (const u of activeCapturedUsers) {
    for (const t of tenants) {
      // KPAs
      if (u.kpas.length > 0) {
        allUpserts.push({
          id: `kpas_${t}_${u.email}`,
          tenant_id: t,
          sender_id: 'ipms_master_restoration',
          sender_email: 'admin@nkangaladm.gov.za',
          sender_name: 'Nkangala Performance System Engine',
          content: JSON.stringify({
            kpas: u.kpas,
            customKpaTable: u.customKpaTable || null
          }),
          message_type: 'kpas_list',
          created_at: now
        });
      }

      // KPIs
      if (u.kpis.length > 0) {
        allUpserts.push({
          id: `kpis_${t}_${u.email}`,
          tenant_id: t,
          sender_id: 'ipms_master_restoration',
          sender_email: 'admin@nkangaladm.gov.za',
          sender_name: 'Nkangala Performance System Engine',
          content: JSON.stringify({
            kpis: u.kpis
          }),
          message_type: 'kpis_list',
          created_at: now
        });

        // PPLAN
        allUpserts.push({
          id: `pplan_${t}_${u.email}`,
          tenant_id: t,
          sender_id: 'ipms_master_restoration',
          sender_email: 'admin@nkangaladm.gov.za',
          sender_name: 'Nkangala Performance System Engine',
          content: JSON.stringify({
            metadata: {
              email: u.email,
              source: 'captured_pa_restoration',
              updatedAt: '2026-10-04T00:00:00.000Z'
            },
            items: u.kpis,
            rows: u.kpis
          }),
          message_type: 'pplan_list',
          created_at: now
        });
      }

      // PDP
      if (u.pdp.length > 0) {
        allUpserts.push({
          id: `pdp_${t}_${u.email}`,
          tenant_id: t,
          sender_id: 'ipms_master_restoration',
          sender_email: 'admin@nkangaladm.gov.za',
          sender_name: 'Nkangala Performance System Engine',
          content: JSON.stringify({
            items: u.pdp
          }),
          message_type: 'pdp_list',
          created_at: now
        });
      }

      // JSC (Job Specific Competencies)
      if (u.jsc.length > 0) {
        allUpserts.push({
          id: `job_competencies_${t}_${u.email}`,
          tenant_id: t,
          sender_id: 'ipms_master_restoration',
          sender_email: 'admin@nkangaladm.gov.za',
          sender_name: 'Nkangala Performance System Engine',
          content: JSON.stringify({
            competencies: u.jsc
          }),
          message_type: 'job_competencies_list',
          created_at: now
        });

        allUpserts.push({
          id: `jsc_draft_${t}_${u.email}`,
          tenant_id: t,
          sender_id: 'ipms_master_restoration',
          sender_email: 'admin@nkangaladm.gov.za',
          sender_name: 'Nkangala Performance System Engine',
          content: JSON.stringify({
            competencies: u.jsc,
            rows: u.jsc
          }),
          message_type: 'job_specific_competencies',
          created_at: now
        });
      }
    }
  }

  console.log(`Total database records to upsert: ${allUpserts.length}`);

  // Batch insert in chunks of 100
  const CHUNK_SIZE = 100;
  for (let i = 0; i < allUpserts.length; i += CHUNK_SIZE) {
    const chunk = allUpserts.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('messages').upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`Error upserting chunk ${i / CHUNK_SIZE}:`, error);
    } else {
      process.stdout.write(`.`);
    }
  }

  console.log("\n=== NKANGALA DATA IMPORT COMPLETED SUCCESSFULLY ===");
  console.log(`Successfully restored real, non-generic data for ${activeCapturedUsers.length} users.`);
}

run().catch(err => {
  console.error("FATAL ERROR in import script:", err);
  process.exit(1);
});
