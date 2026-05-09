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

  // 1. セッション情報を取得（adminId と email を得る）
  const { data: sessionCheck, error: checkError } = await supabase
    .from("admin_sessions")
    .select("id, admin_id, admins(email)")
    .eq("id", sessionId)
    .single();

  console.log("DB check:", sessionCheck);

  if (!sessionCheck) {
    return res.status(404).send("Session not found");
  }

  const adminId = sessionCheck.admin_id;
  const email = sessionCheck.admins?.email;

  // 2. is_deleted を true に更新（Realtime 用）
  const { data: updateResult, error: updateError } = await supabase
    .from("admin_sessions")
    .update({ is_deleted: true })
    .eq("id", sessionId);

  console.log("[API] UPDATE error:", updateError);
  console.log("[API] UPDATE raw result:", updateResult);

  // 3. 更新後の状態を確認（デバッグ）
  const { data: afterUpdate, error: afterError } = await supabase
    .from("admin_sessions")
    .select("id, is_deleted")
    .eq("id", sessionId);

  console.log("[API] AFTER UPDATE:", afterUpdate, afterError);

  // 4. DELETE
  await supabase
    .from("admin_sessions")
    .delete()
    .eq("id", sessionId)
    .select();

  // 5. パスワードリセットメール送信
  await forcePasswordReset(adminId, email);

  return res
    .status(200)
    .send("Session invalidated and password reset email sent");
}