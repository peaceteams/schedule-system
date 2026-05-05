import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendMail } from "../../lib/sendMail";

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
    text: `以下のリンクをクリックしてメールアドレスを確認してください:\n${verifyUrl}`,
    html: `
      <p>以下のリンクをクリックしてメールアドレスを確認してください。</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>このリンクは5分間有効です。</p>
    `,
  });

  return res.status(200).json({
    ok: true,
    message: "確認メールを送信しました。メールをチェックしてください。",
  });
}