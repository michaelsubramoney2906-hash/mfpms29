const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('messages')
    .select('id, tenant_id, message_type, created_at, content')
    .like('id', 'pplan_%');

  if (error) {
    console.error("Error fetching pplan messages:", error);
    return;
  }

  console.log(`Found ${data.length} pplan documents.`);
  for (const doc of data) {
    try {
      const parsed = JSON.parse(doc.content);
      const itemsArray = parsed.items || parsed.rows || parsed.kpis || (Array.isArray(parsed) ? parsed : []);
      console.log(`Doc ID: ${doc.id} | CreatedAt: ${doc.created_at} | Items: ${itemsArray.length}`);
    } catch (err) {
      console.log(`Doc ID: ${doc.id} | Parse error:`, err.message);
    }
  }
}
check();
