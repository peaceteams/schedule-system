import supabase from "@/lib/db";
import crypto from "crypto";

export default async function handler(req, res) {
  const { token, password } = req.body;

  if (!token) {
    return res.status(400).json({ ok: false, error: "無効なトークンです。" });
  }

  // token から admin を取得
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("reset_token", token)
    .single();

  if (!admin) {
    return res.status(400).json({ ok: false, error: "無効なトークンです。" });
  }

  // トークン期限チェック
  if (new Date(admin.reset_expires) < new Date()) {
    return res.status(400).json({ ok: false, error: "トークンの有効期限が切れています。" });
  }

  // パスワード更新
  const { error } = await supabase
    .from("admins")
    .update({
      password_hash: password,
      must_reset_password: false,
      reset_token: null,
      reset_expires: null,
    })
    .eq("id", admin.id);

  if (error) {
    return res.status(500).json({ ok: false, error: "更新に失敗しました。" });
  }

  return res.status(200).json({ ok: true });
}