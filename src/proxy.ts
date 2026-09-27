import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Primary domain for SEO consolidation (non-www)
const PRIMARY_DOMAIN = "vectorafriqproperties.co.ke";

export async function proxy(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get("host") || "";

  // ============================================
  // WWW to NON-WWW 301 REDIRECT (SEO)
  // ============================================
  // Redirect www.vectorafriqproperties.co.ke → vectorafriqproperties.co.ke
  // Only run in production to avoid issues during local development
  if (
    process.env.NODE_ENV === "production" &&
    hostname.startsWith("www.")
  ) {
    // Remove 'www.' prefix and redirect with 301
    const nonWwwHostname = hostname.replace(/^www\./, "");
    url.host = nonWwwHostname;
    // nextUrl carries the port passed to next() (server.js defaults to 3000).
    // Setting .host keeps an existing port, so clear it — otherwise www
    // redirects to https://domain:3000 which nothing serves.
    url.port = "";

    return NextResponse.redirect(url, {
      status: 301, // Permanent redirect for SEO
      headers: {
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  // ============================================
  // PROTECTED ROUTES (Authentication)
  // ============================================
  const path = request.nextUrl.pathname;

  // Check if the path is a protected CRM route
  const isProtectedPath =
    path.startsWith("/crm") ||
    path.startsWith("/api/crm");

  if (isProtectedPath) {
    const token = await getToken({ req: request });

    if (!token) {
      const loginUrl = new URL("/auth/signin", request.url);
      // request.url is built from next({ hostname: "localhost", port: 3000 })
      // and leaks that internal origin into callbackUrl; NextAuth then
      // rejects it and lands users on the homepage. Use the path instead
      // (same pattern as the /admin branch below).
      loginUrl.searchParams.set("callbackUrl", path + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Admin pages are also gated client-side in admin/layout.tsx, but that
  // only kicks in after the page's JS loads - check the role server-side
  // too so an unauthenticated/non-admin request never renders the shell.
  if (path.startsWith("/admin")) {
    const token = await getToken({ req: request });

    if (!token) {
      const loginUrl = new URL("/auth/signin", request.url);
      loginUrl.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(loginUrl);
    }

    const role = (token.role as string | undefined)?.toLowerCase();
    if (role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes for www redirect, plus protected CRM routes
  matcher: [
    // Match all paths except static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2|ttf|eot|otf)$).*)",
  ],
};
