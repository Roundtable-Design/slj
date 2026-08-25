import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NO_STORE = { "Cache-Control": "no-store" };

/**
 * Public liveness for uptime monitors (Better Stack, etc.).
 * Does not ping Neon — frequent checks must not keep compute awake 24/7.
 * Use GET /api/health/db for periodic database checks (e.g. every 10 min).
 */
export async function GET() {
  const started = Date.now();
  return NextResponse.json(
    { ok: true, app: "up", ms: Date.now() - started },
    { status: 200, headers: NO_STORE }
  );
}
