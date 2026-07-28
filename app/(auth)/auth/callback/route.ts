import { NextResponse } from "next/server";

/** Legacy Supabase callback — redirect to Auth.js sign-in. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const returnTo = url.searchParams.get("returnTo") ?? "/";
  const dest = new URL("/auth/sign-in", url.origin);
  dest.searchParams.set("returnTo", returnTo);
  dest.searchParams.set("error", "auth");
  return NextResponse.redirect(dest);
}
