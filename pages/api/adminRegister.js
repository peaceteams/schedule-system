import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendMail } from "@/lib/sendMail";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "email と password が必要です" });
  }

  // パスワードをハッシュ化
  const passwordHash = await bcrypt.hash(password, 10);

  // 認証用トークン生成
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 1000 * 60 * 5); // 5分有効
  console.log("TOKEN GENERATED:", token, token.length);

  // 仮登録（is_verified = false）
  const { error } = await supabase
    .from("admins")
    .insert({
      email,
      password_hash: passwordHash,
      is_verified: false,
      verification_token: token,
      verification_expires: expires.toISOString(),
    });

  if (error) {
    return res.status(400).json({ error: error.message });
  }

  // 確認メール送信
  const verifyUrl = `${process.env.BASE_URL}/api/verify?token=${token}`;

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

  return res.status(200).json({
    ok: true,
    message: "確認メールを送信しました。メールをチェックしてください。",
  });
}