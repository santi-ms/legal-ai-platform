import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_PATHS = [
  "/",
  "/auth/login",
  "/auth/register",
  "/auth/reset",
  "/auth/reset/(.*)",
  "/auth/verify-email",
  "/api/_proxy/(.*)",
  "/api/auth/(.*)",
  "/favicon.ico",
  "/_next/(.*)",
  "/assets/(.*)",
];

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((pattern) => {
    if (pattern.endsWith("(.*)")) {
      const base = pattern.replace("(.*)", "");
      return pathname.startsWith(base);
    }
    return pathname === pattern;
  });
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/_proxy")) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  const protectedPrefixes = ["/dashboard", "/documents"];
  const needsAuth = protectedPrefixes.some((prefix) =>
    pathname.startsWith(prefix)
  );

  if (!needsAuth) {
    return NextResponse.next();
  }

  const hasSessionCookie =
    req.cookies.has("next-auth.session-token") ||
    req.cookies.has("__Secure-next-auth.session-token");

  if (!hasSessionCookie) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/_proxy|_next/static|_next/image|favicon.ico|assets).*)"],
};
