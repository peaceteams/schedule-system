import supabase from "@/lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  const { email, password } = req.body;

  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("email", email)
    .single();

  if (!admin) {
    return res.status(400).json({ ok: false, error: "ユーザーが存在しません" });
  }

  if (admin.password_hash !== password) {
    return res.status(400).json({ ok: false, error: "パスワードが違います" });
  }

  // JWT を発行
  const token = jwt.sign(
    { adminId: admin.id },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // Cookie にセット
  res.setHeader("Set-Cookie", `admin_session=${token}; HttpOnly; Path=/; Max-Age=43200; Secure; SameSite=Strict`);

  return res.status(200).json({ ok: true });
}