import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserType } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // If no token and trying to access protected route, redirect to login
    if (!token && !path.startsWith("/login") && !path.startsWith("/register")) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // If token exists, handle role-based redirects
    if (token) {
      const userType = token.userType as UserType;

      // Redirect from auth pages if already logged in
      if (path.startsWith("/login") || path.startsWith("/register")) {
        if (userType === UserType.CANDIDATE) {
          return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
        } else if (userType === UserType.INTERVIEWER) {
          return NextResponse.redirect(new URL("/interviewer/dashboard", req.url));
        } else if (userType === UserType.ADMIN) {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      }

      // Protect candidate routes
      if (path.startsWith("/candidate")) {
        if (userType !== UserType.CANDIDATE) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }

      // Protect interviewer routes
      if (path.startsWith("/interviewer")) {
        if (userType !== UserType.INTERVIEWER) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }

      // Protect admin routes
      if (path.startsWith("/admin")) {
        if (userType !== UserType.ADMIN) {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }

      // Redirect from root based on user type
      if (path === "/") {
        if (userType === UserType.CANDIDATE) {
          return NextResponse.redirect(new URL("/candidate/dashboard", req.url));
        } else if (userType === UserType.INTERVIEWER) {
          return NextResponse.redirect(new URL("/interviewer/dashboard", req.url));
        } else if (userType === UserType.ADMIN) {
          return NextResponse.redirect(new URL("/admin/dashboard", req.url));
        }
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;

        // Public routes
        if (
          path.startsWith("/login") ||
          path.startsWith("/register") ||
          path.startsWith("/api/auth") ||
          path === "/"
        ) {
          return true;
        }

        // Protected routes require token
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (NextAuth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
