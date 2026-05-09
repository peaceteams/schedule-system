// /api/invalidate-session?session=xxxx
import { createClient } from "@supabase/supabase-js";
import { forcePasswordReset } from "@/lib/resetPassword";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ← これが超重要
);

export default async function handler(req, res) {
  const sessionId = req.query.session;

  console.log("=== /api/invalidate-session START ===");
  console.log("[API] sessionId from query:", sessionId);

  if (!sessionId) {
    return res.status(400).send("Missing session");
  }

  // 1. セッション情報を取得
  const { data: session, error: fetchError } = await supabase
    .from("admin_sessions")
    .select("id, admin_id, admins(email)")
    .eq("id", sessionId)
    .single();

  console.log("[API] session:", session);
  console.log("[API] fetchError:", fetchError);

  if (!session) {
    return res.status(404).send("Session not found");
  }

  const adminId = session.admin_id;
  const email = session.admins?.email;

  // 2. 削除フラグを立てる（Realtime が確実に拾える）
  await supabase
    .from("admin_sessions")
    .update({ is_deleted: true })
    .eq("id", sessionId);

  // 3. 少し遅らせて DELETE（Realtime は UPDATE だけ見ればOK）
  setTimeout(async () => {
    try {
      await supabase.from("admin_sessions").delete().eq("id", sessionId);
    } catch (e) {
      console.log("[API] DELETE ignored:", e.message);
    }
  }, 500);

  // 4. パスワードリセット
  try {
    await forcePasswordReset(adminId, email);
  } catch (err) {
    console.log("[API] forcePasswordReset ERROR:", err);
  }

  console.log("=== /api/invalidate-session END ===");

  return res.status(200).send("Session invalidated and password reset email sent");
}