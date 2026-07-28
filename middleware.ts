import NextAuth from "next-auth";
import { NextResponse, type NextRequest } from "next/server";
import { authConfig } from "@/auth.config";
import { buildSignInHref } from "@/lib/navigation";

const { auth } = NextAuth(authConfig);

function stagingAuthFailed(request: NextRequest): NextResponse | null {
  const user = process.env.STAGING_BASIC_AUTH_USER;
  const pass = process.env.STAGING_BASIC_AUTH_PASSWORD;
  if (!user || !pass) return null;

  const host = request.headers.get("host") ?? "";
  const force =
    process.env.STAGING_BASIC_AUTH === "1" ||
    host.startsWith("slj.round-table.co.uk");
  if (!force) return null;

  const header = request.headers.get("authorization");
  if (header?.startsWith("Basic ")) {
    try {
      const decoded = atob(header.slice(6));
      const idx = decoded.indexOf(":");
      const u = decoded.slice(0, idx);
      const p = decoded.slice(idx + 1);
      if (u === user && p === pass) return null;
    } catch {
      /* fall through */
    }
  }

  return new NextResponse("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="SLJ Staging"',
    },
  });
}

export default auth((request) => {
  const gated = stagingAuthFailed(request);
  if (gated) return gated;

  const pathname = request.nextUrl.pathname;

  if (
    process.env.NEXT_PUBLIC_PLAYWRIGHT_E2E === "1" &&
    (pathname.startsWith("/course") ||
      pathname.startsWith("/worksheets") ||
      pathname.startsWith("/search"))
  ) {
    return NextResponse.next();
  }

  const isProtected =
    pathname.startsWith("/course") ||
    pathname.startsWith("/worksheets") ||
    pathname.startsWith("/groups") ||
    pathname.startsWith("/preferences") ||
    pathname.startsWith("/progress") ||
    pathname.startsWith("/search");

  if (isProtected && !request.auth) {
    const signInUrl = new URL(
      buildSignInHref(`${pathname}${request.nextUrl.search}`),
      request.url
    );
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
