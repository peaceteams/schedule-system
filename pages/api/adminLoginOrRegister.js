import supabase from "@/lib/supabase";
import { sendMail } from "@/lib/sendMail";
import crypto from "crypto";

export default async function handler(req, res) {
  const { email, password } = req.body;

  // 既存ユーザーか確認
  const { data: existing } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();

  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // -----------------------------
  // ① 未登録 → 新規登録フロー
  // -----------------------------
  if (!existing) {
    const { data: newAdmin, error } = await supabase
      .from("admins")
      .insert({
        email,
        password_hash: password,
        is_verified: false,
        verification_token: token,
        verification_expires: expires,
      })
      .select()
      .single();

    if (error) return res.status(400).json({ ok: false, error: "登録に失敗しました" });

    await sendMail(
      email,
      "管理者登録の確認",
      `以下のURLを開いて認証してください:\n${process.env.NEXT_PUBLIC_BASE_URL}/api/verify?token=${token}`
    );

    return res.status(200).json({ ok: true, adminId: newAdmin.id });
  }

  // -----------------------------
  // ② 登録済み → ログインフロー
  // -----------------------------
  if (existing.password_hash !== password) {
    return res.status(400).json({ ok: false, error: "パスワードが違います" });
  }

  // ログイン用の新しいトークンを発行
  await supabase
    .from("admins")
    .update({
      verification_token: token,
      verification_expires: expires,
    })
    .eq("id", existing.id);

  await sendMail(
    email,
    "ログイン確認",
    `以下のURLを開いて認証してください:\n${process.env.NEXT_PUBLIC_BASE_URL}/api/verify?token=${token}`
  );

  return res.status(200).json({ ok: true, adminId: existing.id });
}