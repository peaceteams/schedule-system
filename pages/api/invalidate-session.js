// /api/invalidate-session?session=xxxx
import supabase from "@/lib/db";
import { forcePasswordReset } from "@/lib/resetPassword";

export default async function handler(req, res) {
  const sessionId = req.query.session;

  console.log("=== /api/invalidate-session START ===");
  console.log("[API] sessionId from query:", sessionId);

  if (!sessionId) {
    console.log("[API] Missing session");
    return res.status(400).send("Missing session");
  }

  // 1. セッション情報を取得（admin_id を知るため）
  const { data: session, error: fetchError } = await supabase
    .from("admin_sessions")
    .select("id, admin_id, admins(email)")
    .eq("id", sessionId)
    .single();

  console.log("[API] Supabase fetch session result:", session);
  console.log("[API] Supabase fetch session error:", fetchError);

  if (!session) {
    console.log("[API] Session not found");
    return res.status(404).send("Session not found");
  }

  const adminId = session.admin_id;
  const email = session.admins?.email;

  console.log("[API] adminId:", adminId);
  console.log("[API] email:", email);

  // 2. セッション削除（この端末だけログアウト）
  const { error: deleteError } = await supabase
    .from("admin_sessions")
    .delete()
    .eq("id", sessionId);

  console.log("[API] DELETE sessionId:", sessionId);
  console.log("[API] DELETE error:", deleteError);

  // 3. パスワードリセットフラグを立ててメール送信（lib 呼び出し）
  try {
    console.log("[API] Calling forcePasswordReset...");
    await forcePasswordReset(adminId, email);
    console.log("[API] forcePasswordReset DONE");
  } catch (err) {
    console.log("[API] forcePasswordReset ERROR:", err);
  }

  console.log("=== /api/invalidate-session END ===");

  return res.status(200).send("Session invalidated and password reset email sent");
}