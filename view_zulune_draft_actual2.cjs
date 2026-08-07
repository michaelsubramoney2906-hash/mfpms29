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
    console.log("KEYS:", Object.keys(draft));
    console.log("zuluneKpaText type:", typeof draft.zuluneKpaText);
    console.log("kpaText type:", typeof draft.kpaText);
    console.log("html string?:", typeof draft === 'string' ? draft.length : (draft.html ? draft.html.length : 'no'));
    console.log("DRAFT:", JSON.stringify(draft).substring(0, 1000));
  } else {
    console.log("No draft found");
  }
}

main();
