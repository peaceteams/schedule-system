import { NextResponse } from "next/server";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("admin_session")?.value;

  // ★ /admin/login は保護しない
  if (url.pathname === "/admin/login") {
    return NextResponse.next();
  }

  // ★ /admin/* にアクセスしたのに Cookie が無い → ログインへ
  if (url.pathname.startsWith("/admin") && !token) {
    url.pathname = "/admin/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};