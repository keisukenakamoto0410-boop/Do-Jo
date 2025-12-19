import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

type UserRole = "learner" | "senior" | "student" | "admin";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    console.log("Middleware:", { path, role: token?.role });

    // If no token and trying to access protected route, redirect to login
    if (!token && !path.startsWith("/login") && !path.startsWith("/register") && path !== "/") {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // If token exists, handle role-based redirects
    if (token) {
      const role = token.role as UserRole;

      // Redirect from login page if already logged in
      if (path.startsWith("/login")) {
        if (role === "learner") {
          return NextResponse.redirect(new URL("/learner/dashboard", req.url));
        } else if (role === "admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        } else {
          return NextResponse.redirect(new URL("/host/dashboard", req.url));
        }
      }

      // Redirect from register page if already logged in
      if (path.startsWith("/register")) {
        if (role === "learner") {
          return NextResponse.redirect(new URL("/learner/dashboard", req.url));
        } else {
          return NextResponse.redirect(new URL("/host/dashboard", req.url));
        }
      }

      // Redirect from /dashboard to appropriate dashboard
      if (path === "/dashboard") {
        if (role === "learner") {
          return NextResponse.redirect(new URL("/learner/dashboard", req.url));
        } else if (role === "admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        } else {
          return NextResponse.redirect(new URL("/host/dashboard", req.url));
        }
      }

      // Redirect from root to appropriate dashboard
      if (path === "/") {
        if (role === "learner") {
          return NextResponse.redirect(new URL("/learner/dashboard", req.url));
        } else if (role === "admin") {
          return NextResponse.redirect(new URL("/admin", req.url));
        } else {
          return NextResponse.redirect(new URL("/host/dashboard", req.url));
        }
      }

      // Protect learner routes
      if (path.startsWith("/learner") && role !== "learner") {
        return NextResponse.redirect(new URL("/host/dashboard", req.url));
      }

      // Protect host routes (senior/student only)
      if (path.startsWith("/host") && role === "learner") {
        return NextResponse.redirect(new URL("/learner/dashboard", req.url));
      }

      // Protect admin routes
      if (path.startsWith("/admin") && role !== "admin") {
        if (role === "learner") {
          return NextResponse.redirect(new URL("/learner/dashboard", req.url));
        } else {
          return NextResponse.redirect(new URL("/host/dashboard", req.url));
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
          path.startsWith("/api/") ||
          path.startsWith("/terms") ||
          path.startsWith("/privacy") ||
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
    "/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
