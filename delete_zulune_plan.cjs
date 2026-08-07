const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    console.log("No supabase credentials");
    return;
  }
  const supabase = createClient(url, key);
  
  const email = "zulune@nkangaladm.gov.za";
  console.log("Deleting for:", email);
  
  const { data, error } = await supabase
    .from("performance_plans")
    .delete()
    .eq("user_email", email);
    
  console.log("Delete performance_plans result:", { data, error });
  
  const { data: data2, error: error2 } = await supabase
    .from("performance_agreements")
    .delete()
    .eq("user_email", email);
    
  console.log("Delete performance_agreements result:", { data: data2, error: error2 });
}

main();
