import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(url, key);

async function checkSpecifics() {
  const users = ['khuboniy@nkangaladm.gov.za', 'lukhelema@nkangaladm.gov.za', 'zulune@nkangaladm.gov.za', 'nsibandenp@nkangaladm.gov.za'];
  for (const u of users) {
    console.log('====================================');
    console.log('USER:', u);
    const { data } = await supabase.from('messages').select('id, content').eq('id', `pplan_tenant-229_${u}`);
    if (data && data[0]) {
      const parsed = JSON.parse(data[0].content);
      console.log('ITEMS COUNT:', parsed.items?.length);
      parsed.items?.forEach((it: any, idx: number) => {
        console.log(`  [${idx+1}] kpiNo: ${it.kpiNo || ''} | kpi: ${(it.kpi || '').substring(0, 70)}`);
      });
    } else {
      console.log('NO PPLAN FOUND for ID:', `pplan_tenant-229_${u}`);
    }
  }
}
checkSpecifics();
