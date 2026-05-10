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

  // 2. must_reset_password チェック（先にやる）
  const check = await checkMustResetPassword(admin);
  if (!check.ok) {
    return res.status(403).json({
      ok: false,
      message: check.error
    });
  }

  // 3. セッション作成
  const sessionId = await getOrCreateSession(admin.id, req);

  // 4. JWT を発行
  const jwtToken = jwt.sign(
    { sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // 5. Cookie に保存
  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", jwtToken, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: 60 * 60 * 12,
    })
  );

  // 6. ★ 成功後にトークンを無効化（これが正しい順番）
  await supabase
    .from("admins")
    .update({
      verification_token: null,
      verification_expires: null,
      is_verified: true,
    })
    .eq("id", admin.id);

  // 7. ログイン通知メールを送信
  await sendLoginNotification(admin.email, sessionId);

  // 8. ダッシュボードへリダイレクト
  res.writeHead(302, { Location: "/admin/dashboard" });
  res.end();
}