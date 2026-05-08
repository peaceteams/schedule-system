import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import supabase from "@/lib/db";

export async function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("admin_session")?.value;

  // ★ /admin/login は保護しない
  if (url.pathname === "/admin/login") {
    return NextResponse.next();
  }

  // ★ Cookie が無い → ログインへ
  if (url.pathname.startsWith("/admin") && !token) {
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // ★ JWT を検証
  let payload;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    // 改ざん or 期限切れ
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  const sessionId = payload.sessionId;

  // ★ admin_sessions に sessionId が存在するか確認
  const { data: session } = await supabase
    .from("admin_sessions")
    .select("id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    // Cookie はあるが DB に無い → 不正セッション → ログアウト
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  // ★ 正常 → 通過
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};