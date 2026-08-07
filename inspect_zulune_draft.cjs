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
    .like("id", "draft_doc_pms_team_%_zulune@nkangaladm.gov.za");
    
  if (data) {
    for (const row of data) {
      console.log("Draft ID:", row.id);
      const draft = row.content;
      console.log("kpaText length:", draft.kpaText ? draft.kpaText.length : 0);
      console.log("zuluneKpaText length:", draft.zuluneKpaText ? draft.zuluneKpaText.length : 0);
      if (draft.zuluneKpaText && draft.zuluneKpaText.includes("table")) {
         console.log("zuluneKpaText contains table!");
      }
      if (draft.kpaText && draft.kpaText.includes("table")) {
         console.log("kpaText contains table!");
      }
      if (draft.zulunePPlanAboveText && draft.zulunePPlanAboveText.includes("table")) {
         console.log("zulunePPlanAboveText contains table!");
      }
      if (draft.sectionExtras && Object.keys(draft.sectionExtras).length > 0) {
         console.log("sectionExtras keys:", Object.keys(draft.sectionExtras));
         for (const key of Object.keys(draft.sectionExtras)) {
            if (draft.sectionExtras[key].includes("table")) {
               console.log("sectionExtras[", key, "] contains table");
            }
         }
      }
    }
  }
}

main();
