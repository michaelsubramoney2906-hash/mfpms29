const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  
  const { data, error } = await supabase
    .from("messages")
    .select("id, content")
    .like("id", "pplan_tenant-229_zulune@nkangaladm.gov.za");
    
  if (data && data.length > 0) {
    const pplan = data[0].content;
    console.log("Found pplan for zulune in tenant-229. Number of items:", pplan.items ? pplan.items.length : 0);
    if (pplan.items && pplan.items.length > 0) {
      console.log("First item:", pplan.items[0]);
      
      // Let's remove the first item and save it back
      pplan.items.shift();
      const { error: updateErr } = await supabase.from("messages").update({ content: pplan }).eq("id", "pplan_tenant-229_zulune@nkangaladm.gov.za");
      console.log("Update error:", updateErr);
      
      // Let's also do it for nkangala_auto just in case
      const { data: data2 } = await supabase.from("messages").select("id, content").eq("id", "pplan_nkangala_auto_zulune@nkangaladm.gov.za");
      if (data2 && data2.length > 0) {
         const pplan2 = data2[0].content;
         if (pplan2.items && pplan2.items.length > 0) {
           pplan2.items.shift();
           await supabase.from("messages").update({ content: pplan2 }).eq("id", "pplan_nkangala_auto_zulune@nkangaladm.gov.za");
         }
      }
    }
  } else {
    console.log("No pplan found");
  }
}

main();
