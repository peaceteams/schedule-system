import { serialize } from "cookie";
import supabase from "@/lib/db";
import crypto from "crypto";
import jwt from "jsonwebtoken";

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

  // 2. トークンを無効化（再利用防止）
  await supabase
    .from("admins")
    .update({
      verification_token: null,
      verification_expires: null,
      is_verified: true,
    })
    .eq("id", admin.id);

  // 3. ★ session_id を発行（UUID）
  const sessionId = crypto.randomUUID();

  // 4. ★ admin_sessions に保存（端末ごとのログイン管理）
  const { error: sessionError } = await supabase
    .from("admin_sessions")
    .insert({
      id: sessionId,
      admin_id: admin.id,
      user_agent: req.headers["user-agent"] || "",
      ip: req.headers["x-forwarded-for"] || req.socket.remoteAddress || "",
    });

  console.log("admin_sessions insert error:", sessionError);

  // 5. ★ JWT を発行（payload に sessionId を入れる）
  const jwtToken = jwt.sign(
    { sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // 6. ★ Cookie に JWT を保存（署名付きで改ざん防止）
  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", jwtToken, {
      httpOnly: true,
      secure: true, // 本番は true
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    })
  );

  // 7. ダッシュボードへリダイレクト
  res.writeHead(302, { Location: "/admin/dashboard" });
  res.end();
}