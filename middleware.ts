import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const isLoggedIn = !!token;

  // Public routes
  if (pathname === "/" || pathname === "/login") {
    return NextResponse.next();
  }

  // API routes — allow (auth checked inside)
  if (pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Static files
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/images")
  ) {
    return NextResponse.next();
  }

  // All dashboard routes require login
  if (pathname.startsWith("/dashboard")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = token.role as string;

    // --- STAFF RULES ---
    if (role === "staff") {
      // Staff trying to access admin-only pages
      if (pathname === "/dashboard/users" || pathname.startsWith("/dashboard/users/")) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }

      // Allow QR connect page and API calls
      if (pathname === "/dashboard/connect" || pathname.startsWith("/api/wa/")) {
        return NextResponse.next();
      }

      // If not connected to WA, force to connect page
      // We check via the /api/wa/status endpoint client-side
      // to avoid extra DB call on every middleware run
    }

    // --- ADMIN RULES ---
    if (role === "admin") {
      // Admin cannot access blast/contacts/schedule
      if (
        pathname.startsWith("/dashboard/contacts") ||
        pathname.startsWith("/dashboard/blast") ||
        pathname.startsWith("/dashboard/schedule") ||
        pathname === "/dashboard/connect"
      ) {
        return NextResponse.redirect(new URL("/dashboard", req.url));
      }
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
