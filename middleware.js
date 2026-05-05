import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("admin_session")?.value;

  // 管理者ページにアクセスした時だけチェック
  if (url.pathname.startsWith("/admin")) {
    // ログインページは除外
    if (url.pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    // JWT が無い → ログインページへ
    if (!token) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    try {
      // JWT 検証
      jwt.verify(token, process.env.JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      // 無効な JWT → ログインページへ
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};