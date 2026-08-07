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
    .eq("id", "draft_doc_pms_team_nkangala_auto_zulune@nkangaladm.gov.za");
    
  if (data && data.length > 0) {
    const draft = data[0].content;
    console.log("kpaText:", draft.kpaText);
    console.log("zuluneKpaText:", draft.zuluneKpaText);
    console.log("sectionExtras:", draft.sectionExtras);
  } else {
    console.log("No draft found");
  }
}

main();
