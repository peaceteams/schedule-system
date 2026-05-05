import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export function middleware(req) {
  const url = req.nextUrl.clone();
  const token = req.cookies.get("admin_session")?.value;

  if (url.pathname.startsWith("/admin")) {
    if (url.pathname.startsWith("/admin/login")) {
      return NextResponse.next();
    }

    if (!token) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }

    try {
      jwt.verify(token, process.env.JWT_SECRET);
      return NextResponse.next();
    } catch (err) {
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
  runtime: "nodejs",
};