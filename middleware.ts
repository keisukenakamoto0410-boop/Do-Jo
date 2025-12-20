import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/learner/:path*",
    "/host/:path*",
    "/admin/:path*",
    "/session/:path*",
  ],
};
