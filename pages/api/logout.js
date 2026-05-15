// /api/logout
import supabase from "@/lib/db";
import { getSessionFromCookie } from "@/lib/session";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  console.log("=== /api/logout START ===");

  const raw = getSessionFromCookie(req);
  console.log("[LOGOUT] raw cookie:", raw);

  if (!raw) {
    console.log("[LOGOUT] No cookie → END");
    return res.status(200).json({ ok: true });
  }

  // JWT を decode
  let decoded;
  try {
    decoded = jwt.verify(raw.sessionId, process.env.JWT_SECRET);
    console.log("[LOGOUT] decoded JWT:", decoded);
  } catch (e) {
    console.log("[LOGOUT] JWT decode error:", e);
    return res.status(400).json({ ok: false, error: "invalid token" });
  }

  const sessionId = decoded.sessionId;
  console.log("[LOGOUT] extracted sessionId:", sessionId);

  // DELETE 実行
  const { data, error } = await supabase
    .from("admin_sessions")
    .delete()
    .eq("id", sessionId);

  console.log("[LOGOUT] deleteData:", data);
  console.log("[LOGOUT] deleteError:", error);

  if (error) {
    console.log("[LOGOUT] DELETE FAILED:", error);
    return res.status(500).json({ ok: false, error });
  }

  console.log("[LOGOUT] DELETE SUCCESS");

  // Cookie 削除
  res.setHeader(
    "Set-Cookie",
    "admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure"
  );

  console.log("[LOGOUT] Cookie cleared");
  console.log("=== /api/logout END ===");

  return res.status(200).json({ ok: true });
}