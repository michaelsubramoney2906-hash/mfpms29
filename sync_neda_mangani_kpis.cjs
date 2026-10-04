const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
);

async function syncNedaManganiKpis() {
  const email = 'manganijp@nkangaladm.gov.za';
  const sourceDocId = `kpis_nkangala_auto_${email}`;

  console.log(`Reading source 42 KPIs document: ${sourceDocId}`);
  const { data: sourceRow, error: srcErr } = await supabase
    .from('messages')
    .select('*')
    .eq('id', sourceDocId)
    .single();

  if (srcErr || !sourceRow) {
    console.error("Error reading source row:", srcErr);
    return;
  }

  let parsedSource;
  try {
    parsedSource = JSON.parse(sourceRow.content);
  } catch (e) {
    console.error("Failed to parse source JSON:", e);
    return;
  }

  const items = parsedSource.items || parsedSource.rows || parsedSource.kpis || [];
  console.log(`Successfully retrieved ${items.length} KPIs from ${sourceDocId}`);

  if (items.length === 0) {
    console.error("Source items array is empty!");
    return;
  }

  const targetDocIds = [
    `pplan_neda_${email}`,
    `kpis_neda_${email}`,
    `pplan_tenant-229_${email}`,
    `pplan_nkangala_auto_${email}`
  ];

  const payload = {
    metadata: {
      ...(parsedSource.metadata || {}),
      name: "Johan P. Mangani",
      email: email,
      jobTitle: "Manager: Planning and Economic Development",
      department: "Planning and Economic Development",
      municipality: "Nkangala District Municipality",
      lastSynced: new Date().toISOString()
    },
    items: items,
    rows: items,
    kpis: items
  };

  const payloadStr = JSON.stringify(payload);

  for (const docId of targetDocIds) {
    const tenantId = docId.startsWith('pplan_neda_') || docId.startsWith('kpis_neda_') 
      ? 'neda' 
      : docId.includes('tenant-229') ? 'tenant-229' : 'nkangala_auto';

    console.log(`Upserting ${items.length} items into ${docId} (tenant_id: ${tenantId})...`);
    const { error: upsertErr } = await supabase
      .from('messages')
      .upsert({
        id: docId,
        tenant_id: tenantId,
        sender_id: 'sync_tool',
        sender_email: email,
        sender_name: 'Johan P. Mangani',
        content: payloadStr,
        message_type: 'pplan_list',
        created_at: new Date().toISOString()
      });

    if (upsertErr) {
      console.error(`Error upserting ${docId}:`, upsertErr);
    } else {
      console.log(`Successfully updated ${docId} with ${items.length} KPIs.`);
    }
  }

  console.log("\n--- Verification Check ---");
  for (const docId of targetDocIds) {
    const { data: vRow } = await supabase.from('messages').select('content').eq('id', docId).single();
    if (vRow) {
      const vParsed = JSON.parse(vRow.content);
      const vItems = vParsed.items || vParsed.rows || vParsed.kpis || [];
      console.log(`Verified ${docId}: ${vItems.length} items present.`);
    } else {
      console.error(`Verification failed for ${docId}`);
    }
  }
}

syncNedaManganiKpis();
