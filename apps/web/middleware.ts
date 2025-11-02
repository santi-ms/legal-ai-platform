import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = request.nextUrl.pathname;

  // Rutas que requieren autenticación
  const protectedRoutes = ["/documents"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Rutas de autenticación que NO deben ser accesibles si ya estás logueado
  const authRoutes = ["/auth/login", "/auth/register"];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Si intenta acceder a una ruta protegida sin estar autenticado
  if (isProtectedRoute && !token) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Si ya está autenticado e intenta acceder a login/register, redirigir al dashboard
  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/documents", request.url));
  }

  return NextResponse.next();
}

// Configurar qué rutas aplican el middleware
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

