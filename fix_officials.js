import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function run() {
  const { data, error } = await supabase.from('messages').select('id').like('id', 'sdbip_officials_%');
  if (data && data.length > 0) {
    for (const row of data) {
      await supabase.from('messages').delete().eq('id', row.id);
    }
    console.log("Deleted old officials.");
  } else {
    console.log("No old officials found.");
  }
}
run();
