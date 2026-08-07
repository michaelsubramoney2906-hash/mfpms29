const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) return;
  const supabase = createClient(url, key);
  
  // Find messages where id contains ar_draft
  const { data, error } = await supabase
    .from("messages")
    .select("id, content")
    .like("id", "%ar_draft_%");
    
  if (data) {
    for (let row of data) {
      if (row.id.includes("zulune")) {
        console.log("Found zulune draft:", row.id);
        const content = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
        
        console.log("Current isPPlanAdopted:", content.isPPlanAdopted);
        
        // Is the user talking about removing a specific KPI from the plan, or the entire adopted plan?
        // "remove the first adopted performance plan KPIs on the performance agreement."
        // Let's print out the plan items.
      }
    }
  }
}

main();
