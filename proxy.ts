import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function proxy(request: Request) {
  const url = new URL(request.url);
  const cookie = request.headers.get("cookie") || "";
  const token = cookie
    .split("; ")
    .find((c) => c.startsWith("admin_session="))
    ?.split("=")[1];

  // /admin/login は保護しない
  if (url.pathname === "/admin/login" || url.pathname === "/admin/reset-password") {
    return NextResponse.next();
  }

  // Cookie が無い → ログインへ
  if (url.pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // JWT を検証（改ざん・期限切れチェック）
  try {
    jwt.verify(token!, process.env.JWT_SECRET!);
  } catch {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // 正常 → 通過
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};