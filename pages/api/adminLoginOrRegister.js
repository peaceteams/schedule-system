import supabase from "@/lib/db";
import { sendMail } from "@/lib/sendMail";
import crypto from "crypto";

export default async function handler(req, res) {
  console.log("=== adminLoginOrRegister START ===");
  console.log("req.body:", req.body);

  const { email, password } = req.body;
  console.log("email:", email);
  console.log("password:", password);

  // 既存ユーザーか確認
  const { data: existing, error: existingError } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();

  console.log("existing:", existing);
  console.log("existingError:", existingError);

  const token = crypto.randomBytes(32).toString("hex");
  const expiresIn = req.body.expiresInSeconds || 300; // ★ デフォルト5分
  const expires = new Date(Date.now() + expiresIn * 1000).toISOString();

  console.log("generated token:", token);
  console.log("expires:", expires);

  // -----------------------------
  // ① 未登録 → 新規登録フロー
  // -----------------------------
  if (!existing) {
    console.log("→ 新規登録フロー");

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
      .maybeSingle();

    console.log("newAdmin:", newAdmin);
    console.log("insertError:", error);

    if (error) {
      console.log("❌ 登録エラー:", error);
      return res.status(400).json({ ok: false, error: "登録に失敗しました" });
    }

    const verifyUrl = `${process.env.BASE_URL}/api/verify-email?token=${token}`;
    console.log("verifyUrl:", verifyUrl);

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

    console.log("=== 新規登録成功 ===");

    return res.status(200).json({
      ok: true,
      adminId: newAdmin.id,
      expiresInSeconds: expiresIn,
      expiresAt: expires
    });
  }

  // -----------------------------
  // ② 登録済み → ログインフロー
  // -----------------------------
  console.log("→ ログインフロー");

  if (existing.password_hash !== password) {
    console.log("❌ パスワード不一致");
    return res.status(400).json({ ok: false, error: "パスワードが違います" });
  }

  checkMustResetPassword(existing);

  const { error: updateError } = await supabase
    .from("admins")
    .update({
      verification_token: token,
      verification_expires: expires,
    })
    .eq("id", existing.id);

  console.log("updateError:", updateError);

  const verifyUrl = `${process.env.BASE_URL}/api/verify-email?token=${token}`;
  console.log("verifyUrl:", verifyUrl);

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

  console.log("=== ログインフロー成功 ===");

  return res.status(200).json({
    ok: true,
    adminId: existing.id,
    expiresAt: expires,
    expiresInSeconds: expiresIn,
  });
}