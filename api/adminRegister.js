import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

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

  // Supabase に保存（ログ付き）
  const { data, error } = await supabase
    .from("admins")
    .insert({
      email,
      password_hash: passwordHash,
    });

  if (error) {
    return res.status(400).json({
      ok: false,
      message: "Supabase error",
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
  }

  return res.status(200).json({ ok: true, data });
}