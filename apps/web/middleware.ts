import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Middleware simple - solo pasar la request si está autorizado
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Si hay token, está autorizado
        return !!token;
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
  ],
};
