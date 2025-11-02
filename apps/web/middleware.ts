import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const protectedRoutes = ["/documents"];
const authRoutes = ["/auth/login", "/auth/register"];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // si no es ni protegida ni de auth, dejá pasar y listo
  if (!isProtectedRoute && !isAuthRoute) {
    return NextResponse.next();
  }

  // si no hay secret en runtime (por si en Vercel se olvida)
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    // las protegidas mandalas a login
    if (isProtectedRoute) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // acá sí necesitamos saber si está logueado
  let token = null;
  try {
    token = await getToken({ req: request, secret });
  } catch (err) {
    // si falló leer el token y la ruta es protegida -> login
    if (isProtectedRoute) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // 1) no logueado y quiere entrar a /documents -> login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2) logueado y quiere ir a /auth/login o /auth/register -> mandalo al dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/documents", request.url));
  }

  return NextResponse.next();
}

// 👇 importante: ahora el middleware SOLO corre en lo que nos importa
export const config = {
  matcher: ["/documents/:path*", "/auth/:path*"],
};
