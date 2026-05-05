import { createClient } from "@supabase/supabase-js";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token } = req.query;
  console.log("TOKEN FROM URL:", token, token.length);

  if (!token) {
    return res.status(400).send("Invalid token");
  }

  // token に一致するユーザーを取得
  const { data: user, error } = await supabase
    .from("admins")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (error || !user) {
    return res.status(400).send("Invalid or expired token");
  }

  // 有効期限チェック
  const now = new Date();
  const expires = new Date(user.verification_expires);

  if (now > expires) {
    return res.status(400).send("Verification link has expired");
  }

  // メール認証完了
  await supabase
    .from("admins")
    .update({
      is_verified: true,
      verification_token: null,
      verification_expires: null,
    })
    .eq("id", user.id);

  // JWT 発行（管理者ログイン用）
  const jwtToken = jwt.sign(
    {
      adminId: user.id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  // Cookie に保存（httpOnly / secure）
  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12, // 12時間
    })
  );

  // 管理画面へリダイレクト
  return res.redirect("/admin/dashboard");
}