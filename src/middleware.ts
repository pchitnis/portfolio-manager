export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/home", "/assets/:path*", "/dashboard/:path*", "/cashflow/:path*"],
};
