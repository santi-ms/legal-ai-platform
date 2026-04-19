import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

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

export async function middleware(req: NextRequest) {
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

  const onboardingPath = pathname.startsWith("/onboarding");

  if (!needsAuth && !onboardingPath) {
    return NextResponse.next();
  }

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || "dev-secret-change-in-production",
  });

  if (!token?.sub) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("from", pathname);
    return NextResponse.redirect(url);
  }

  const tenantId = typeof token.user?.tenantId === "string" && token.user.tenantId
    ? token.user.tenantId
    : null;

  if ((pathname.startsWith("/dashboard") || pathname.startsWith("/documents")) && !tenantId) {
    const url = req.nextUrl.clone();
    url.pathname = "/onboarding";
    return NextResponse.redirect(url);
  }

  // Solo redirigir fuera del onboarding si ya tiene tenant Y no está en /onboarding/plan
  // (el paso de elegir plan sí puede accederse teniendo tenant, es parte del flujo)
  if (onboardingPath && tenantId && !pathname.startsWith("/onboarding/plan")) {
    const url = req.nextUrl.clone();
    url.pathname = "/documents";
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
