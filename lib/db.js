import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error("❌ SUPABASE_URL が読み込めていません");
}
if (!supabaseKey) {
  console.error("❌ SUPABASE_SERVICE_ROLE_KEY が読み込めていません");
}

// Supabase クライアント（default export）
const supabase = createClient(supabaseUrl, supabaseKey);
export default supabase;

// 管理者をメールで取得（named export）
export async function getAdminByEmail(email) {
  const { data, error } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("getAdminByEmail error:", error);
    return null;
  }

  return data;
}