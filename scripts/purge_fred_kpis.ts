import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_KEY!;
const supabase = createClient(url, key);

async function purgeFredKpis() {
  console.log("=== STARTING FRED KPI PURGE & DATABASE CLEANUP ===");

  // 1. Delete all FRED extraction standalone messages
  const { data: fredMessages, error: fredErr } = await supabase
    .from('messages')
    .select('id, sender_id, message_type')
    .or('sender_id.eq.sdbip_fred_extraction,sender_id.eq.fred_extraction,id.ilike.fred_ext_%');

  if (fredErr) {
    console.error("Error finding Fred messages:", fredErr);
  } else {
    console.log(`Found ${fredMessages?.length || 0} Fred extraction messages to purge.`);
    for (const msg of fredMessages || []) {
      console.log(` - Purging Fred message: ${msg.id} (${msg.sender_id})`);
      await supabase.from('messages').delete().eq('id', msg.id);
    }
  }

  // 2. Purge default KPI documents that contained FRED auto-synced items
  const { data: defaultKpiDocs, error: kpiErr } = await supabase
    .from('messages')
    .select('id, content')
    .like('id', 'kpis_%');

  if (kpiErr) {
    console.error("Error fetching KPI docs:", kpiErr);
  } else {
    for (const doc of defaultKpiDocs || []) {
      if (doc.id.includes('_default')) {
        console.log(` - Purging default FRED KPI document: ${doc.id}`);
        await supabase.from('messages').delete().eq('id', doc.id);
      } else {
        // Clean user-specific KPI docs
        try {
          const parsed = JSON.parse(doc.content);
          const items = Array.isArray(parsed) ? parsed : (parsed.kpis || []);
          const cleanedItems = items.filter((it: any) => {
            const isFredId = String(it.id).toLowerCase().includes('fred') || String(it.id).toLowerCase().includes('ext-');
            const isFredKpiNo = String(it.kpiNo || '').toUpperCase().startsWith('PMS/D/');
            return !isFredId && !isFredKpiNo;
          });
          if (cleanedItems.length !== items.length) {
            console.log(` - Cleaned ${items.length - cleanedItems.length} Fred KPIs from ${doc.id}`);
            await supabase.from('messages').update({ content: JSON.stringify(cleanedItems) }).eq('id', doc.id);
          }
        } catch (e) {
          console.error(`Error processing KPI doc ${doc.id}:`, e);
        }
      }
    }
  }

  // 3. Clean all pplan_% documents in Supabase by stripping FRED-imported KPIs
  const { data: pplanDocs, error: pplanErr } = await supabase
    .from('messages')
    .select('id, content')
    .like('id', 'pplan_%');

  if (pplanErr) {
    console.error("Error fetching PPLAN docs:", pplanErr);
  } else {
    console.log(`Processing ${pplanDocs?.length || 0} PPLAN documents for FRED KPI removal...`);
    for (const doc of pplanDocs || []) {
      try {
        const parsed = JSON.parse(doc.content);
        if (parsed && Array.isArray(parsed.items)) {
          const originalCount = parsed.items.length;
          const cleanedItems = parsed.items.filter((it: any) => {
            const idStr = String(it.id || '').toLowerCase();
            const kpiNoStr = String(it.kpiNo || '').toUpperCase();
            
            const isFredId = idStr.includes('fred') || idStr.includes('cfo-row-ext-') || idStr.includes('corp-row-ext-');
            const isFredKpiNo = kpiNoStr.startsWith('PMS/D/'); // PMS/D/1 through PMS/D/12 imported by Fred SDBIP sync
            
            // Keep only manually captured items
            return !isFredId && !isFredKpiNo;
          });

          if (cleanedItems.length !== originalCount) {
            console.log(` - Document ${doc.id}: Purged ${originalCount - cleanedItems.length} Fred KPIs. Kept ${cleanedItems.length} manually captured KPIs.`);
            parsed.items = cleanedItems;
            await supabase.from('messages').update({ content: JSON.stringify(parsed) }).eq('id', doc.id);
          } else {
            console.log(` - Document ${doc.id}: No Fred KPIs found. All ${originalCount} items are manually captured.`);
          }
        }
      } catch (e) {
        console.error(`Error cleaning PPLAN doc ${doc.id}:`, e);
      }
    }
  }

  console.log("=== FRED KPI PURGE & DATABASE CLEANUP COMPLETED ===");
}

purgeFredKpis();
