import jwt from "jsonwebtoken";
import supabase from "@/lib/db";

export async function requireAdminSession(req) {
  console.log("=== requireAdminSession START ===");

  // 0. Cookie 全体を確認
  console.log("SSR Cookies:", req.headers.cookie);
  console.log("Parsed cookies:", req.cookies);

  const token = req.cookies.admin_session;
  console.log("admin_session token:", token);

  if (!token) {
    console.log("NO_COOKIE");
    return { ok: false, reason: "NO_COOKIE" };
  }

  // 1. JWT を検証
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
    console.log("JWT payload:", payload);
  } catch (err) {
    console.log("INVALID_JWT:", err);
    return { ok: false, reason: "INVALID_JWT" };
  }

  const sessionId = payload.sessionId;
  console.log("sessionId from JWT:", sessionId);

  // 2. admin_sessions に sessionId が存在するか確認
  const { data: session, error: sessionError } = await supabase
    .from("admin_sessions")
    .select("id, admin_id")
    .eq("id", sessionId)
    .single();

  console.log("Supabase session query result:", session);
  console.log("Supabase session query error:", sessionError);

  if (!session) {
    console.log("SESSION_NOT_FOUND");
    return { ok: false, reason: "SESSION_NOT_FOUND" };
  }

  // 3. must_reset_password を確認
  const { data: admin } = await supabase
    .from("admins")
    .select("must_reset_password")
    .eq("id", session.admin_id)
    .single();

  if (admin?.must_reset_password) {
    console.log("PASSWORD_RESET_REQUIRED");
    return {
      ok: false,
      reason: "PASSWORD_RESET_REQUIRED",
      redirect: "/admin/login",
    };
  }

  // 4. 正常
  console.log("SESSION OK:", session);
  console.log("=== requireAdminSession END ===");

  return {
    ok: true,
    adminId: session.admin_id,
    sessionId,
  };
}