const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  console.log("Searching messages for manganijp...");
  const { data: rows, error } = await supabase.from('messages').select('id, tenant_id, content');
  if (error) {
    console.error("Error fetching messages:", error);
    return;
  }

  let manganiRows = [];
  let countsMap = {};

  for (const r of rows) {
    if (r.id.includes('manganijp') || (r.content && r.content.includes('manganijp'))) {
      manganiRows.push(r);
    }
    if (r.id.startsWith('pplan_') || r.id.startsWith('kpis_')) {
      try {
        const parsed = JSON.parse(r.content);
        const items = parsed.items || parsed.rows || parsed.kpis || (Array.isArray(parsed) ? parsed : []);
        countsMap[r.id] = items.length;
      } catch (e) {}
    }
  }

  console.log("Found mangani rows:", manganiRows.map(r => r.id));
  manganiRows.forEach(r => {
    try {
      const parsed = JSON.parse(r.content);
      const items = parsed.items || parsed.rows || parsed.kpis || (Array.isArray(parsed) ? parsed : []);
      console.log(`Row ${r.id}: ${items.length} items`);
    } catch(e) {
      console.log(`Row ${r.id}: parse error`);
    }
  });

  console.log("\nSummary of pplan/kpis item counts across DB:");
  const countsCount = {};
  for (const [id, count] of Object.entries(countsMap)) {
    countsCount[count] = (countsCount[count] || 0) + 1;
    if (count === 7 || count === 42 || count === 46 || count === 49) {
      console.log(`Special Count ${count}: ID = ${id}`);
    }
  }
  console.log("Counts distribution:", countsCount);

  // Check ipms_gm_performance_plans table
  const { data: gmRows } = await supabase.from('ipms_gm_performance_plans').select('*');
  console.log("\nGM Performance plans count:", gmRows ? gmRows.length : 0);
  if (gmRows) {
    gmRows.forEach(g => {
      console.log(`GM Plan for ${g.user_email}: ${g.items_payload ? g.items_payload.length : 0} items`);
    });
  }
}

run();
