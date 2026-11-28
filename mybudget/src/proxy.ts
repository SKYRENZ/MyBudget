import { NextResponse, type NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE_NAME } from "@/lib/auth-session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/accounts",
  "/expenses",
  "/savings",
  "/reports",
  "/goals",
];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const rawCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = rawCookie ? decryptSession(rawCookie) : null;
  const hasSession = Boolean(session);

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  if (pathname === "/auth" && hasSession) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/auth",
    "/dashboard/:path*",
    "/accounts/:path*",
    "/expenses/:path*",
    "/savings/:path*",
    "/reports/:path*",
    "/goals/:path*",
  ],
};
