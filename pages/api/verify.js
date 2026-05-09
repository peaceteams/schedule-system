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

  // 2. トークンを無効化（再利用防止）
  await supabase
    .from("admins")
    .update({
      verification_token: null,
      verification_expires: null,
      is_verified: true,
    })
    .eq("id", admin.id);

  // 3. must_reset_password チェック
  const check = checkMustResetPassword(admin);
  if (!check.ok) {
    return res.status(403).json(check);
  }

  // 4. セッション作成
  const sessionId = await getOrCreateSession(admin.id, req);

  // 5. JWT を発行
  const jwtToken = jwt.sign(
    { sessionId },
    process.env.JWT_SECRET,
    { expiresIn: "12h" }
  );

  // 6. Cookie に保存
  res.setHeader(
    "Set-Cookie",
    serialize("admin_session", jwtToken, {
      httpOnly: true,
      secure: true,        // ★ 必須
      sameSite: "none",    // ★ これが最重要
      path: "/",
      maxAge: 60 * 60 * 12,
    })
  );

  // 7. ログイン通知メールを送信
  await sendLoginNotification(admin.email, sessionId);

  // 8. ダッシュボードへリダイレクト
  res.writeHead(302, { Location: "/admin/dashboard" });
  res.end();
}