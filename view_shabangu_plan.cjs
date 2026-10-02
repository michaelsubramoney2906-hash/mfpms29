const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, content')
    .or('id.eq.pplan_tenant-229_shabangusm@nkangaladm.gov.za,id.eq.pplan_nkangala_auto_shabangusm@nkangaladm.gov.za,id.eq.pplan_global_shabangusm@nkangaladm.gov.za');

  if (error) {
    console.error("Error:", error);
    return;
  }

  console.log(`Found ${data.length} documents.`);
  for (const doc of data) {
    try {
      const parsed = JSON.parse(doc.content);
      const items = parsed.items || parsed.rows || parsed.kpis || [];
      console.log(`Doc: ${doc.id} | Items count: ${items.length}`);
      items.forEach((it, idx) => {
        console.log(`  [${idx + 1}] Code/Ref: ${it.code || it.refNum || it.id || 'N/A'} | Title: ${(it.kpi || it.title || it.description || '').substring(0, 100)}`);
      });
    } catch (e) {
      console.error(e);
    }
  }
}
check();
