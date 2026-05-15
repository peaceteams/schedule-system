// /api/logout
import supabase from "@/lib/db";
import { getSessionFromCookie } from "@/lib/session";

export default async function handler(req, res) {
  const session = getSessionFromCookie(req);

  if (!session) {
    return res.status(200).json({ ok: true });
  }

  await supabase
    .from("admin_sessions")
    .delete()
    .eq(session.sessionId);

  res.setHeader(
    "Set-Cookie",
    "admin_session=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict; Secure"
  );

  return res.status(200).json({ ok: true });
}