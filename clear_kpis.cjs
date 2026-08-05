const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const users = [
    'zulune@nkangaladm.gov.za',
    'khuboniy@nkangaladm.gov.za',
    'nsibandenp@nkangaldm.gov.za',
    'nsibandenp@nkangaladm.gov.za'
  ];

  for (const email of users) {
    const pplanId = `pplan_tenant-229_${email}`;
    const pplanId2 = `pplan_nkangala_${email}`;
    const fredId1 = `fred_ext_agreement_to_plan_engine_tenant-229_${email}`;
    const fredId2 = `fred_ext_agreement_to_plan_engine_nkangala_${email}`;
    const fredId3 = `pa_extract_sdbip_3rd_tenant-229_${email}`;
    const fredId4 = `pa_extract_sdbip_2nd_tenant-229_${email}`;
    const paId1 = `pa_tenant-229_${email}`;
    const paId2 = `pa_nkangala_${email}`;

    console.log("Deleting for", email);
    await supabase.from('messages').delete().in('id', [pplanId, pplanId2, fredId1, fredId2, fredId3, fredId4, paId1, paId2]);
  }
  console.log("Done");
}

run();
