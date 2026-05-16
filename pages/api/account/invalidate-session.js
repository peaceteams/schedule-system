// /api/invalidate-session?session=xxxx
import { createClient } from "@supabase/supabase-js";
import { forcePasswordReset } from "@/lib/resetPassword";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  const sessionId = req.query.session;

  if (!sessionId) {
    return res.status(400).send("Missing session");
  }

  // 1. セッション情報を取得（admin_id を知るため）
  const { data: session } = await supabase
    .from("admin_sessions")
    .select("admin_id, admins(email)")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return res.status(404).send("Session not found");
  }

  const adminId = session.admin_id;
  const email = session.admins.email;

  // 2. セッションアップデート（この端末だけログアウト）
  await supabase
    .from("admin_sessions")
    .update({ is_deleted: true })
    .eq("id", sessionId);

  // 3. セッション削除
    const { error } = await supabase
    .from("admin_sessions")
    .delete()
    .eq("id", sessionId);

  // 4. パスワードリセットフラグを立ててメール送信（lib 呼び出し）
  await forcePasswordReset(adminId, email);

  return res.status(200).send("Session invalidated and password reset email sent");
}