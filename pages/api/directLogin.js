import supabase from "@/lib/db";
import jwt from "jsonwebtoken";
import { getOrCreateSession } from "@/lib/session";

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

  // ★ 共通ロジックで sessionId を取得
  const sessionId = await getOrCreateSession(admin.id, req);

  // JWT を発行
  const token = jwt.sign(
    { sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // Cookie にセット
  res.setHeader(
    "Set-Cookie",
    `admin_session=${token}; HttpOnly; Path=/; Max-Age=43200; Secure; SameSite=Lax`
  );

  return res.status(200).json({ ok: true });
}