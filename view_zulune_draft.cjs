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
    
  if (data && data.length > 0) {
    const draft = data[0].content;
    console.log("Found draft for zulune.");
    console.log("isPPlanAdopted:", draft.isPPlanAdopted);
    console.log("dynTableRows:", draft.dynTableRows ? draft.dynTableRows.length : 0);
    if (draft.dynTableRows && draft.dynTableRows.length > 0) {
      console.log("First dynTableRow:", draft.dynTableRows[0]);
    }
  } else {
    console.log("No draft found");
  }
}

main();
