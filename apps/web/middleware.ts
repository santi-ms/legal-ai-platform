import { withAuth } from "next-auth/middleware";
import { NextRequest, NextResponse } from "next/server";

const PROXY_EXCLUDE = [/^\/api\/\_proxy(\/|$)/];

export default withAuth(
  function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;
    if (PROXY_EXCLUDE.some((re) => re.test(pathname))) {
      return NextResponse.next();
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
    pages: {
      signIn: "/auth/login",
    },
  }
);

export const config = {
  matcher: ["/((?!api/_proxy).*)"],
};
