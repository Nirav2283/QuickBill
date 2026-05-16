import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secretKey = process.env.SESSION_SECRET;
const encodedKey = new TextEncoder().encode(secretKey);

async function decryptSession(session: string | undefined = "") {
  try {
    const { payload } = await jwtVerify(session, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload;
  } catch {
    return null;
  }
}

// All authenticated routes
const protectedRoutes = ["/dashboard", "/products", "/stock", "/sales"];
// Admin-only routes — staff cannot access these
const adminOnlyRoutes = ["/products", "/stock"];
const publicRoutes = ["/login"];

export async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );
  const isAdminOnlyRoute = adminOnlyRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );
  const isPublicRoute = publicRoutes.some(
    (route) => path === route || path.startsWith(route + "/")
  );

  // Decrypt session from cookie
  const cookie = req.cookies.get("session")?.value;
  const session = await decryptSession(cookie);

  // Redirect unauthenticated users to /login
  if (isProtectedRoute && !session?.userId) {
    return NextResponse.redirect(new URL("/login", req.nextUrl));
  }

  // Block staff from admin-only routes → redirect to /dashboard
  if (isAdminOnlyRoute && session?.role === "STAFF") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  // Redirect authenticated users away from /login to /dashboard
  if (isPublicRoute && session?.userId) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
