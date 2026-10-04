const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function checkManganiDocs() {
  const email = 'manganijp@nkangaladm.gov.za';

  const { data: rows } = await supabase
    .from('messages')
    .select('id, tenant_id, content')
    .like('id', `%${email}%`);

  for (const r of rows || []) {
    console.log(`========================================`);
    console.log(`Document ID: ${r.id} | Tenant: ${r.tenant_id}`);
    try {
      const parsed = JSON.parse(r.content);
      const items = parsed.items || parsed.rows || parsed.kpis || (Array.isArray(parsed) ? parsed : []);
      console.log(`Items Count: ${items.length}`);
      if (items.length > 0) {
        console.log(`KPI Numbers / Descriptions:`);
        items.forEach((it, idx) => {
          console.log(`  ${idx + 1}. [${it.kpiNo || it.id || 'N/A'}] ${it.kpiDescription || it.kpi || it.indicator || 'No desc'}`);
        });
      }
    } catch (e) {
      console.log(`Parse error:`, e.message);
    }
  }
}

checkManganiDocs();
