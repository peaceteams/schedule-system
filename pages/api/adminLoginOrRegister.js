import supabase from "@/lib/db";
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
  const expires = new Date(Date.now() + 5 * 60 * 1000).toISOString();

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
        isNewUser: true,
      })
      .select()
      .single();

    if (error) {
      return res.status(400).json({ ok: false, error: "登録に失敗しました" });
    }

    const verifyUrl = `${process.env.BASE_URL}/api/verify-email?token=${token}`;

    await sendMail({
      to: email,
      subject: "管理者登録の確認",
      html: `
        <p>以下のボタンをクリックしてメールアドレスを確認してください。</p>
        <a href="${verifyUrl}"
          style="
            display: inline-block;
            padding: 12px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: bold;
          ">
          メールアドレスを確認する
        </a>
        <p>このリンクは5分間有効です。</p>
      `
    });

    // ★ カウントダウン用 expiresAt を返す
    return res.status(200).json({
      ok: true,
      adminId: newAdmin.id,
      expiresAt: expires
    });
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

  const verifyUrl = `${process.env.BASE_URL}/api/verify-email?token=${token}`;

  await sendMail({
    to: email,
    subject: "ログイン認証",
    html: `
      <p>以下のボタンをクリックしてメールアドレスを確認してください。</p>
      <a href="${verifyUrl}"
        style="
          display: inline-block;
          padding: 12px 20px;
          background-color: #4CAF50;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: bold;
        ">
        メールアドレスを確認する
      </a>
      <p>このリンクは5分間有効です。</p>
    `
  });

  // ★ カウントダウン用 expiresAt を返す
  return res.status(200).json({
    ok: true,
    adminId: existing.id,
    expiresAt: expires,
    isNewUser: false
  });
}