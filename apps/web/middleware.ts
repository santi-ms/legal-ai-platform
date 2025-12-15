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
  "/api/_auth/(.*)",
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

  // Permitir TODAS las rutas de API sin verificación
  // Esto incluye /api/_proxy, /api/_auth, /api/auth, etc.
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // Permitir rutas de API proxy y auth sin verificación (redundante pero seguro)
  if (pathname.startsWith("/api/_proxy") || pathname.startsWith("/api/_auth")) {
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/ (all API routes - proxy, auth, etc.)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - assets (asset files)
     */
    "/((?!api/|_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
