export { default } from "next-auth/middleware";

export const config = {
  matcher: [
    "/learner/:path*",
    "/host/:path*",
    "/admin/:path*",
    "/session/:path*",
  ],
};
