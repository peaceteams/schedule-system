// /api/logout
import supabase from "@/lib/db";
import { getSessionFromCookie } from "@/lib/session";

export default async function handler(req, res) {
  console.log("=== /api/logout START ===");

  // 1. Cookie からセッション取得
  const session = getSessionFromCookie(req);
  console.log("[LOGOUT] session from cookie:", session);

  if (!session) {
    console.log("[LOGOUT] No session found in cookie → nothing to delete");
    return res.status(200).json({ ok: true });
  }

  const sessionId = session.sessionId;
  console.log("[LOGOUT] target sessionId:", sessionId);

  // 2. DELETE 実行（eq の書き方を修正）
  const { data: deleteData, error: deleteError } = await supabase
    .from("admin_sessions")
    .delete()
    .eq("id", sessionId);

  console.log("[LOGOUT] deleteData:", deleteData);
  console.log("[LOGOUT] deleteError:", deleteError);

  if (deleteError) {
    console.log("[LOGOUT] DELETE FAILED:", deleteError);
    return res.status(500).json({ ok: false, error: deleteError });
  }

  console.log("[LOGOUT] DELETE SUCCESS");

  // 3. Cookie 削除
  res.setHeader(
    "Set-Cookie",
    "admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure"
  );
  console.log("[LOGOUT] Cookie cleared");

  console.log("=== /api/logout END ===");
  return res.status(200).json({ ok: true });
}