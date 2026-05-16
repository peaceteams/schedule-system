import supabase from "@/lib/db";
import jwt from "jsonwebtoken";
import { getOrCreateSession } from "@/lib/session";
import { getClientInfo } from "@/lib/getClientInfo";
import { sendLoginNotification } from "@/lib/loginNotification";
import { checkMustResetPassword } from "@/lib/auth";

// ★ API 内部で二重実行を防ぐロック
let processing = false;

export default async function handler(req, res) {
  // ★ すでに処理中なら即 429 を返す（2 回目をブロック）
  if (processing) {
    return res.status(429).json({ ok: false, error: "Duplicate request" });
  }
  processing = true;

  try {
    const { email, password } = req.body;

    const { data: admin } = await supabase
      .from("admins")
      .select("*")
      .eq("email", email)
      .single();

    if (!admin) {
      processing = false;
      return res.status(400).json({ ok: false, error: "ユーザーが存在しません" });
    }

    if (admin.password_hash !== password) {
      processing = false;
      return res.status(400).json({ ok: false, error: "パスワードが違います" });
    }

    const check = checkMustResetPassword(admin);
    if (!check.ok) {
      processing = false;
      return res.status(403).json(check);
    }

    // ★ 共通ロジックで sessionId を取得
    const sessionId = await getOrCreateSession(admin.id, req);

    // クライアント情報取得&ログイン通知を送信
    const { data: session } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    await sendLoginNotification(
      admin.email,
      sessionId,
      session.ip,
      { country: session.country, region: session.region },
      session.user_agent
    );

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

    processing = false;
    return res.status(200).json({ ok: true });

  } catch (err) {
    processing = false;
    return res.status(500).json({ ok: false, error: "Server error" });
  }
}