// lib/session.js
import supabase from "@/lib/db";
import crypto from "crypto";

export async function getOrCreateSession(adminId, req) {
  const userAgent = req.headers["user-agent"] || "";
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  // 既存セッションを検索
  const { data: existingSession } = await supabase
    .from("admin_sessions")
    .select("*")
    .eq("admin_id", adminId)
    .eq("user_agent", userAgent)
    .eq("ip", ip)
    .maybeSingle();

  let sessionId;

  if (existingSession) {
    // 既存セッションを再利用しつつ last_active を更新
    sessionId = existingSession.id;

    await supabase
      .from("admin_sessions")
      .update({ last_active: new Date().toISOString() })
      .eq("id", sessionId);

  } else {
    // 新規セッション作成
    sessionId = crypto.randomUUID();

    await supabase.from("admin_sessions").insert({
      id: sessionId,
      admin_id: adminId,
      user_agent: userAgent,
      ip,
      last_active: new Date().toISOString(),
    });
  }

  return sessionId;
}