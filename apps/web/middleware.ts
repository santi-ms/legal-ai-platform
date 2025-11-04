import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Aquí puedes agregar lógica adicional si es necesario
    // Por ejemplo, verificar roles, permisos, etc.
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Si no hay token, no está autorizado
        if (!token) {
          return false;
        }

        // Verificar que el token no haya expirado
        // NextAuth ya maneja esto, pero podemos agregar verificaciones adicionales
        return true;
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/documents/:path*",
    // Agregar otras rutas protegidas aquí
  ],
};
