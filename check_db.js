const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data } = await supabase.from('messages').select('id, content').in('id', [
    'pplan_tenant-229_zulune@nkangaladm.gov.za', 
    'pplan_tenant-229_nsibandenp@nkangaladm.gov.za',
    'pplan_nkangala_auto_zulune@nkangaladm.gov.za', 
    'pplan_nkangala_auto_nsibandenp@nkangaladm.gov.za'
  ]);
  
  if (data) {
    data.forEach(d => {
       const parsed = JSON.parse(d.content);
       console.log(`${d.id} -> Name: ${parsed.metadata?.name} | Items count: ${parsed.items?.length}`);
    });
  }
}
check();
