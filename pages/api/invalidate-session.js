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

  const { data: session } = await supabase
    .from("admin_sessions")
    .select("id, admin_id, admins(email)")
    .eq("id", sessionId)
    .single();

  if (!session) return res.status(404).send("Session not found");

  const adminId = session.admin_id;
  const email = session.admins?.email;

  const { data, error } = await supabase
    .from("admin_sessions")
    .update({ is_deleted: true })
    .eq("id", sessionId);

  console.log("UPDATE result:", data, error);

  // DELETE
  await supabase
    .from("admin_sessions")
    .delete()
    .eq("id", sessionId);

  // パスワードリセット
  await forcePasswordReset(adminId, email);

  return res.status(200).send("Session invalidated and password reset email sent");
}