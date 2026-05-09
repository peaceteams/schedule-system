import supabase from "@/lib/db";
import jwt from "jsonwebtoken";

export default async function handler(req, res) {
  try {
    const token = req.cookies.admin_session;

    if (!token) {
      return res.status(401).json({ ok: false, error: "NO_SESSION" });
    }

    // JWT を decode
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const sessionId = payload.sessionId;

    console.log("sessionId:", sessionId);

    // 1. セッションが存在するか確認
    const { data: sessionCheck, error: checkError } = await supabase
      .from("admin_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    console.log("DB check:", sessionCheck);

    if (!sessionCheck) {
      console.log("SESSION_NOT_FOUND");
      return res.status(401).json({ ok: false, error: "SESSION_NOT_FOUND" });
    }

    // ★ adminId をここで定義（ReferenceError 修正）
    const adminId = sessionCheck.admin_id;

    // 2. is_deleted を true に更新
    const { data: updateResult, error: updateError } = await supabase
      .from("admin_sessions")
      .update({ is_deleted: true })
      .eq("id", sessionId);

    console.log("[API] UPDATE error:", updateError);
    console.log("[API] UPDATE raw result:", updateResult);

    // 3. 更新後の状態を確認（デバッグ用）
    const { data: afterUpdate, error: afterError } = await supabase
      .from("admin_sessions")
      .select("id, is_deleted")
      .eq("id", sessionId);

    console.log("[API] AFTER UPDATE:", afterUpdate, afterError);

    // 4. Cookie を削除
    res.setHeader(
      "Set-Cookie",
      `admin_session=; HttpOnly; Path=/; Max-Age=0; Secure; SameSite=Lax`
    );

    return res.status(200).json({ ok: true });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: "SERVER_ERROR" });
  }
}