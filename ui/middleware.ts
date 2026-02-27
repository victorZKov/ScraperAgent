import { auth } from "@/auth";
import { NextResponse } from "next/server";

const ADMIN_PATHS = ["/dashboard", "/settings", "/reports"];

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminPath = ADMIN_PATHS.some((p) => pathname.startsWith(p));

  if (!isAdminPath) return NextResponse.next();
  if (req.auth) return NextResponse.next();

  const signInUrl = new URL("/api/auth/signin", req.url);
  signInUrl.searchParams.set("callbackUrl", req.url);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/reports/:path*"],
};
