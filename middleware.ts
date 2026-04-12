import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const ADMIN_ROUTE = process.env.ADMIN_ROUTE ?? "admin-panel";

// Simple in-memory rate limiter (per-process; use Redis in production)
const rateLimit = new Map<string, { count: number; timestamp: number }>();
const RATE_WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 60;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimit.get(ip);

  if (!entry || now - entry.timestamp > RATE_WINDOW_MS) {
    rateLimit.set(ip, { count: 1, timestamp: now });
    return false;
  }

  entry.count++;
  return entry.count > MAX_REQUESTS;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rate limiting for API routes
  if (pathname.startsWith("/api/")) {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 },
      );
    }
  }

  // Admin route protection — refresh session and check auth
  if (pathname.startsWith(`/${ADMIN_ROUTE}`)) {
    const supabaseResponse = await updateSession(request);

    // Login page is always accessible
    if (pathname === `/${ADMIN_ROUTE}/login`) {
      return supabaseResponse;
    }

    // For all other admin routes, check if user is authenticated
    // The session cookie is refreshed by updateSession; the actual
    // auth gate is enforced via the admin layout's server component.
    return supabaseResponse;
  }

  // Refresh session for all other routes
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
