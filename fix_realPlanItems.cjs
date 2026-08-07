const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  
  const emails = ["zulune@nkangaladm.gov.za", "nsibandenp@nkangaladm.gov.za"];
  
  for (const email of emails) {
    const { data } = await supabase.from("messages").select("id, content").like("id", `%pplan_%${email}`);
    if (data) {
      for (const row of data) {
        if (row.content && row.content.items && row.content.items.length > 0) {
          console.log("Found items in", row.id, row.content.items.length);
          row.content.items.shift();
          await supabase.from("messages").update({ content: row.content }).eq("id", row.id);
          console.log("Removed first item from", row.id);
        } else {
          console.log("No items in", row.id);
        }
      }
    }
  }
}

main();
