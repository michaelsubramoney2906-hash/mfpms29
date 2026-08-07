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
    .like("id", "pplan_%_zulune@nkangaladm.gov.za");
    
  if (data && data.length > 0) {
    const pplan = data[0].content;
    console.log("Found pplan for zulune. Number of items:", pplan.items ? pplan.items.length : 0);
    if (pplan.items && pplan.items.length > 0) {
      console.log("First item:", pplan.items[0]);
    }
  } else {
    console.log("No pplan found");
  }
}

main();
