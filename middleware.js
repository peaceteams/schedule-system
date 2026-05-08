import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("admin_session")?.value;

  // 管理者ページにアクセスしたのに Cookie が無い → ログインへ
  if (url.pathname.startsWith("/admin") && !token) {
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 適用範囲
export const config = {
  matcher: ["/admin/:path*"],
};