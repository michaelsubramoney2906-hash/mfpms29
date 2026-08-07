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
    const raw = data[0].content;
    let obj = raw;
    if (typeof obj === "string") {
      try { obj = JSON.parse(obj); } catch(e){}
    }
    if (obj && obj.html) {
      const state = typeof obj.html === "string" ? JSON.parse(obj.html) : obj.html;
      console.log("isPPlanAdopted:", state.isPPlanAdopted);
      console.log("zuluneKpaText has table?", state.zuluneKpaText ? state.zuluneKpaText.includes("table") : "no text");
      console.log("kpaText has table?", state.kpaText ? state.kpaText.includes("table") : "no text");
      console.log("sectionExtras kpaText has table?", state.sectionExtras && state.sectionExtras.kpaText && state.sectionExtras.kpaText.includes("table"));
      console.log("sectionExtras evaluating has table?", state.sectionExtras && state.sectionExtras.evaluating && state.sectionExtras.evaluating.includes("table"));
      
      // Look for the "Adopted Performance Plan KPIs" string in any text field
      const strState = JSON.stringify(state);
      console.log("Found 'Adopted Performance Plan KPIs' in state?", strState.includes("Adopted Performance Plan KPIs"));
      if (state.sectionExtras && state.sectionExtras.kpaText && state.sectionExtras.kpaText.includes("Adopted Performance Plan KPIs")) {
         console.log("Found it in sectionExtras.kpaText!");
         // Actually let's just see where it is
      }
    }
  }
}

main();
