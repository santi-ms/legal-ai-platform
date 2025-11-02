import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

  // Verificar si tiene cookie de sesión de NextAuth
  const sessionCookie = request.cookies.get(
    request.cookies.getAll().find((c) => c.name.startsWith("next-auth.session-token"))?.name || 
    request.cookies.getAll().find((c) => c.name.startsWith("__Secure-next-auth.session-token"))?.name || 
    ""
  );

  // Si no hay cookie pero la ruta es protegida, redirigir a login
  if (isProtectedRoute && !sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si hay cookie pero intenta acceder a auth routes, redirigir al dashboard
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/documents", request.url));
  }

  return NextResponse.next();
}

// Middleware se aplica a todas las rutas excepto estáticos
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
