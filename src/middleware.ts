import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Public routes
  if (
    pathname === "/" ||
    pathname === "/complaint" ||
    pathname.startsWith("/admin/login") ||
    pathname.startsWith("/privacy-policy") ||
    pathname.startsWith("/terms") ||
    pathname.startsWith("/emergency") ||
    pathname.startsWith("/api/complaints") ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // Admin routes require authentication
  if (pathname.startsWith("/admin")) {
    const token = request.cookies.get("session")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }

    const payload = await verifySessionToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.redirect(new URL("/admin/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/:path*"],
};
