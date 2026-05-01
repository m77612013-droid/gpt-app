import { NextRequest, NextResponse } from "next/server";
import { createSupabaseProxyClient } from "@/lib/supabase-server";

// Routes that require an authenticated session
const PROTECTED = ["/dashboard", "/offers", "/earn", "/withdraw", "/admin"];
// Routes that logged-in users should not revisit
const AUTH_ONLY = ["/login", "/register"];
// Admin-only email — set ADMIN_EMAIL in .env.local
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "aboutgamaa@gmail.com";

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request });
  const supabase = createSupabaseProxyClient(request, response);

  // Refresh session cookie if expired
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if (!user && PROTECTED.some((p) => pathname.startsWith(p))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect non-admin users away from /admin
  if (pathname.startsWith("/admin") && user?.email !== ADMIN_EMAIL && user?.user_metadata?.role !== "admin") {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    return NextResponse.redirect(homeUrl);
  }

  // Redirect authenticated users away from login/register
  if (user && AUTH_ONLY.some((p) => pathname.startsWith(p))) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/postback).*)",
  ],
};
