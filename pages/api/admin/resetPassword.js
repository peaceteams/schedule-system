// /api/resetPassword.js
import supabase from "@/lib/db";

export default async function handler(req, res) {
  const { token, hashedPassword } = req.body;

  // 1. トークンで admin を検索
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("reset_token", token)
    .single();

  if (!admin) {
    return res.status(400).json({ ok: false, message: "Invalid token" });
  }

  // 2. 有効期限チェック
  if (!admin.reset_expires || new Date(admin.reset_expires) < new Date()) {
    return res.status(400).json({ ok: false, message: "Token expired" });
  }

  // 4. パスワード更新 & リセット情報クリア
  const { error } = await supabase
    .from("admins")
    .update({
      password_hash: hashedPassword,
      must_reset_password: false,
      reset_token: null,
      reset_expires: null,
    })
    .eq("id", admin.id);

  if (error) {
    return res.status(500).json({ ok: false, message: "Update failed" });
  }

  return res.status(200).json({ ok: true });
}