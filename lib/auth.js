import jwt from "jsonwebtoken";
import supabase from "@/lib/db";

export async function requireAdminSession(req) {
  const token = req.cookies.admin_session;

  if (!token) {
    return { ok: false, reason: "NO_COOKIE" };
  }

  // 1. JWT を検証
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return { ok: false, reason: "INVALID_JWT" };
  }

  const sessionId = payload.sessionId;

  // 2. admin_sessions に sessionId が存在するか確認
  const { data: session } = await supabase
    .from("admin_sessions")
    .select("id, admin_id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { ok: false, reason: "SESSION_NOT_FOUND" };
  }

  // 3. 正常
  return {
    ok: true,
    adminId: session.admin_id,
    sessionId,
  };
}