import supabase from "@/lib/db";
import jwt from "jsonwebtoken";
import crypto from "crypto";

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

  // ★ 1. sessionId を発行
  const sessionId = crypto.randomUUID();

  // ★ 2. admin_sessions に保存
  await supabase.from("admin_sessions").insert({
    id: sessionId,
    admin_id: admin.id,
    user_agent: req.headers["user-agent"] || "",
    ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
  });

  // ★ 3. JWT を sessionId で発行
  const token = jwt.sign(
    { sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // ★ 4. Cookie にセット
  res.setHeader(
    "Set-Cookie",
    `admin_session=${token}; HttpOnly; Path=/; Max-Age=43200; Secure; SameSite=Lax`
  );

  return res.status(200).json({ ok: true });
}