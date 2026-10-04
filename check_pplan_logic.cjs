const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkPplanRouteLogic() {
  const userId = 'manganijp@nkangaladm.gov.za';
  const tenantId = 'nkangala_auto';
  const documentId = `pplan_${tenantId}_${userId}`;

  console.log("Checking documentId:", documentId);
  let { data } = await supabase.from('messages').select('content').eq('id', documentId).maybeSingle();
  console.log("Direct document exists?", !!data);

  if (!data) {
    console.log("Searching for fallbacks...");
    const fallbackKeys = [
      `pplan_tenant-229_${userId}`,
      `pplan_nkangala_auto_${userId}`,
      `pplan_global_${userId}`,
      `kpis_tenant-229_${userId}`,
      `kpis_nkangala_auto_${userId}`,
      `kpis_global_${userId}`
    ];

    for (const key of fallbackKeys) {
      const fb = await supabase.from('messages').select('content').eq('id', key).maybeSingle();
      if (fb.data) {
        console.log(`Found fallback key ${key}!`);
      }
    }

    const { data: searchRows } = await supabase
      .from('messages')
      .select('id, content')
      .like('id', `%pplan_%${userId}%`);

    console.log("Search rows matching userId:", searchRows ? searchRows.map(r => r.id) : []);

    const { data: likeRows } = await supabase
      .from('messages')
      .select('id, content')
      .like('id', `%pplan_%`);

    let bestFallbackParsed = null;
    let maxItems = 0;
    for (const r of searchRows || []) {
      try {
        const parsed = JSON.parse(r.content);
        const list = Array.isArray(parsed) ? parsed : (parsed.items || parsed.rows || parsed.kpis || []);
        if (list.length > maxItems) {
          maxItems = list.length;
          bestFallbackParsed = { id: r.id, count: list.length };
        }
      } catch (e) {}
    }
    console.log("Best fallback parsed:", bestFallbackParsed);
  }

  // Check NEDA user pplans
  console.log("\nChecking NEDA users pplans:");
  const { data: nedaPplans } = await supabase.from('messages').select('id, content').like('id', 'pplan_%neda%');
  for (const p of nedaPplans || []) {
    try {
      const parsed = JSON.parse(p.content);
      const list = Array.isArray(parsed) ? parsed : (parsed.items || parsed.rows || parsed.kpis || []);
      console.log(`NEDA PPLAN ID: ${p.id} -> count: ${list.length}`);
    } catch (e) {}
  }
}

checkPplanRouteLogic();
