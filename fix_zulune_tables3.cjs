const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  
  const ids = [
    "draft_doc_pms_team_tenant-229_zulune@nkangaladm.gov.za",
    "draft_doc_pms_team_nkangala_auto_zulune@nkangaladm.gov.za"
  ];
  
  for (const docId of ids) {
    console.log("Checking:", docId);
    const { data, error } = await supabase
      .from("messages")
      .select("id, content")
      .eq("id", docId);
      
    if (data && data.length > 0) {
      const raw = data[0].content;
      let obj = raw;
      if (typeof obj === "string") {
        try { obj = JSON.parse(obj); } catch(e){}
      }
      if (obj && obj.html) {
        const state = typeof obj.html === "string" ? JSON.parse(obj.html) : obj.html;
        const strState = JSON.stringify(state);
        console.log("Found 'Adopted Performance Plan KPIs' in state?", strState.includes("Adopted Performance Plan KPIs"));
        
        if (state.sectionExtras) {
          for (const [k, v] of Object.entries(state.sectionExtras)) {
             const vStr = JSON.stringify(v);
             if (vStr.includes("Adopted Performance Plan KPIs")) {
                console.log("Found in sectionExtras key:", k);
                
                if (Array.isArray(v)) {
                   const idx = v.findIndex(item => typeof item === 'string' && item.includes("Adopted Performance Plan KPIs"));
                   if (idx !== -1) {
                      console.log("Found at index:", idx, "Removing it.");
                      v.splice(idx, 1);
                      
                      const newStateStr = JSON.stringify(state);
                      const newContent = { ...obj, html: newStateStr };
                      await supabase.from("messages").update({ content: newContent }).eq("id", data[0].id);
                      console.log("Saved.");
                   }
                }
             }
          }
        }
      }
    } else {
      console.log("No data for", docId);
    }
  }
}

main();
