import { NextResponse } from "next/server";
import { neon } from "@neondatabase/serverless";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Public liveness for uptime monitors (Better Stack, etc.).
 * Do not put secrets or user data in the response.
 */
export async function GET() {
  const started = Date.now();
  const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!url) {
    return NextResponse.json(
      { ok: false, db: "unconfigured", ms: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }

  try {
    const sql = neon(url);
    await sql`select 1`;
    return NextResponse.json(
      { ok: true, db: "up", ms: Date.now() - started },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: "down", ms: Date.now() - started },
      { status: 503, headers: { "Cache-Control": "no-store" } }
    );
  }
}
