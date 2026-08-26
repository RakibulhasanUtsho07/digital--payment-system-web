import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // We check for both "access_token" (Express standard) and "token" just to be safe!
  const token = req.cookies.get("access_token")?.value || req.cookies.get("token")?.value;

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !token) {
    // Redirect to login if no token is found
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Allow access if token exists
  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};