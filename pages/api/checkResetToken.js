import { supabase } from "@/lib/db";

export default async function handler(req, res) {
  const { token } = req.query;

  const { data, error } = await supabase
    .from("admins")
    .select("id, reset_expires")
    .eq("reset_token", token)
    .single();

  if (error || !data) {
    return res.status(400).json({ ok: false, error: "invalid" });
  }

  // 期限切れチェック
  if (new Date(data.reset_expires) < new Date()) {
    return res.status(400).json({ ok: false, error: "expired" });
  }

  return res.status(200).json({ ok: true });
}