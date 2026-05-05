import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ SUPABASE_URL が読み込めていません");
}
if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY が読み込めていません");
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;