// /api/invalidate-session?session=xxxx
import { createClient } from "@supabase/supabase-js";
import { forcePasswordReset } from "@/lib/resetPassword";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const sessionId = req.query.session;

  if (!sessionId) return res.status(400).send("Missing session");

  console.log("sessionId:", sessionId);

  const { data: check } = await supabase
    .from("admin_sessions")
    .select("*")
    .eq("id", sessionId);

  console.log("DB check:", check);

  // 2. 削除フラグを立てる（Realtime が確実に拾える）
  const { data: updateResult, error: updateError } = await supabase
    .from("admin_sessions")
    .update({ is_deleted: true })
    .eq("id", sessionId);

  console.log("[API] UPDATE error:", updateError);
  console.log("[API] UPDATE raw result:", updateResult);

  // 直後に DB を再確認
  const { data: afterUpdate, error: afterError } = await supabase
    .from("admin_sessions")
    .select("id, is_deleted")
    .eq("id", sessionId);

  console.log("[API] AFTER UPDATE:", afterUpdate, afterError);

  // DELETE
  await supabase
    .from("admin_sessions")
    .delete()
    .eq("id", sessionId);

  // パスワードリセット
  await forcePasswordReset(adminId, email);

  return res.status(200).send("Session invalidated and password reset email sent");
}