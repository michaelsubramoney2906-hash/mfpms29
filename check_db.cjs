const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data: total, error: err1 } = await supabase
    .from('messages')
    .select('id, tenant_id')
    .eq('message_type', 'pplan_list');
    
  const { data: filtered, error: err2 } = await supabase
    .from('messages')
    .select('id, tenant_id')
    .eq('message_type', 'pplan_list')
    .in('tenant_id', ['nkangala_auto', 'tenant-229']);
    
  console.log("Total records:", total ? total.length : 0);
  console.log("Filtered records:", filtered ? filtered.length : 0);
}
check();
