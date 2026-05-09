// lib/session.js
import supabase from "@/lib/db";
import crypto from "crypto";

export async function getOrCreateSession(adminId, req) {
  const userAgent = req.headers["user-agent"] || "";
  const ip =
    req.headers["x-forwarded-for"] ||
    req.socket.remoteAddress ||
    "";

  console.log("=== getOrCreateSession START ===");
  console.log("adminId:", adminId);
  console.log("userAgent:", userAgent);
  console.log("ip:", ip);

  // 既存セッションを検索
  const { data: existingSession, error: existingError } = await supabase
    .from("admin_sessions")
    .select("*")
    .eq("admin_id", adminId)
    .eq("user_agent", userAgent)
    .eq("ip", ip)
    .maybeSingle();

  console.log("[SESSION] existingSession:", existingSession);
  console.log("[SESSION] existingError:", existingError);

  let sessionId;

  if (existingSession) {
    sessionId = existingSession.id;
    console.log("[SESSION] Reusing existing session:", sessionId);

    const { data: updateData, error: updateError } = await supabase
      .from("admin_sessions")
      .update({ last_active: new Date().toISOString() })
      .eq("id", sessionId)
      .select();

    console.log("[SESSION] UPDATE last_active data:", updateData);
    console.log("[SESSION] UPDATE last_active error:", updateError);

  } else {
    sessionId = crypto.randomUUID();
    console.log("[SESSION] Creating NEW session:", sessionId);

    const { data: insertData, error: insertError } = await supabase
      .from("admin_sessions")
      .insert({
        id: sessionId,
        admin_id: adminId,
        user_agent: userAgent,
        ip,
        last_active: new Date().toISOString(),
      })
      .select();

    console.log("[SESSION] INSERT data:", insertData);
    console.log("[SESSION] INSERT error:", insertError);
  }

  console.log("=== getOrCreateSession END ===");
  return sessionId;
}