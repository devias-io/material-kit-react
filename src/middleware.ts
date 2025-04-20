import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const isPublicPath = path.startsWith("/auth");
  const isProtectedPath = path.startsWith("/dashboard");
  const isAdminPath = path.startsWith("/admin");
  const isUserDashboardPath = path.startsWith("/dashboard");
  const token = request.cookies.get("accessToken")?.value || null;
  const role = request.cookies.get("role")?.value || null;

  // Redirect authenticated users from public (auth) routes to dashboard
  if (isPublicPath && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Redirect unauthenticated users from protected routes to login
  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Restrict admin routes to admin role only
  if (isAdminPath && role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (isUserDashboardPath && role === "admin") {
    return NextResponse.redirect(new URL("/admin/subscriptions", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
