import { serialize } from "cookie";
import supabase from "@/lib/db";
import jwt from "jsonwebtoken";
import { getOrCreateSession } from "@/lib/session";
import { sendLoginNotification } from "@/lib/loginNotification";
import { checkMustResetPassword } from "@/lib/auth";

export default async function handler(req, res) {
  const token = req.query.token;

  // 1. トークンで管理者を検索
  const { data: admin } = await supabase
    .from("admins")
    .select("*")
    .eq("verification_token", token)
    .single();

  if (!admin) {
    return res.status(400).send("Invalid token");
  }

  // 2. トークンを無効化
  await supabase
    .from("admins")
    .update({
      verification_token: null,
      verification_expires: null,
      is_verified: true,
    })
    .eq("id", admin.id);

  // ★ 共通ロジックで sessionId を取得
  const sessionId = await getOrCreateSession(admin.id, req);
  const check = checkMustResetPassword(admin);
  if (!check.ok) {
    return res.status(403).json(check);
  }
  await sendLoginNotification(admin.email, sessionId);

  // JWT を発行
  const jwtToken = jwt.sign(
    { sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // Cookie に保存
  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    })
  );

  // ダッシュボードへリダイレクト
  res.writeHead(302, { Location: "/admin/dashboard" });
  res.end();
}