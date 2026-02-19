import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Check if request has a valid session token in query params
function hasSessionToken(req: NextRequest): boolean {
  const token = req.nextUrl.searchParams.get("token");
  return !!token && token.length > 0;
}

// Paths that should always bypass authentication
const alwaysPublicPaths = ["/session/join", "/api/session/validate-token"];

// Session paths that allow token-based access
const sessionPathPatterns = [
  /^\/senior\/session\/[^/]+$/,
  /^\/host\/session\/[^/]+$/,
  /^\/learner\/session\/[^/]+$/,
];

export default withAuth(
  function middleware(req: NextRequest) {
    const pathname = req.nextUrl.pathname;

    // Allow always-public paths
    if (alwaysPublicPaths.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Allow session pages with token parameter
    if (hasSessionToken(req)) {
      const isSessionPath = sessionPathPatterns.some((pattern) =>
        pattern.test(pathname)
      );
      if (isSessionPath) {
        return NextResponse.next();
      }
    }
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/learner/:path*",
    "/host/:path*",
    "/senior/:path*",
    "/admin/:path*",
    "/session/:path*",
  ],
};
