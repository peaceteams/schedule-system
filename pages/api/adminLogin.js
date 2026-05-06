import supabase from "@/lib/db";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { email, password } = req.body;

  // 1. admin を取得
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();

  if (!admin) {
    return res.status(400).json({ error: "メールが見つかりません" });
  }

  // 2. パスワードチェック
  const ok = await bcrypt.compare(password, admin.password_hash);
  if (!ok) {
    return res.status(400).json({ error: "パスワードが違います" });
  }

  // 3. 未認証なら verify メールを再送
  if (!admin.is_verified) {
    return res.status(400).json({
      error: "メール認証が完了していません。登録メールを確認してください。",
    });
  }

  // 4. JWT 発行
  const jwtToken = jwt.sign(
    { adminId: admin.id },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // 5. Cookie セット
  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", jwtToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    })
  );

  return res.status(200).json({ ok: true });
}