import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type BetterStackIncidentPayload = {
  event?: string;
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      name?: string | null;
      cause?: string | null;
      url?: string | null;
      started_at?: string | null;
      resolved_at?: string | null;
    };
  };
};

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

function isDownEvent(event: string | undefined, resolvedAt: string | null | undefined) {
  const e = (event ?? "").toLowerCase();
  if (e.includes("resolv")) return false;
  if (e.includes("start") || e.includes("reopen")) return true;
  // Prefer resolved_at when event is missing (default Better Stack template).
  if (resolvedAt) return false;
  if (e === "" || e === "$event") return resolvedAt == null;
  return !resolvedAt;
}

async function sendPushover(opts: {
  title: string;
  message: string;
  /** 0 normal · 1 high (one Critical Alert if enabled) · 2 emergency (retries — avoid by default) */
  priority: 0 | 1 | 2;
}) {
  const token = process.env.PUSHOVER_API_TOKEN?.trim();
  const user = process.env.PUSHOVER_USER_KEY?.trim();
  if (!token || !user) {
    return { ok: false as const, error: "pushover_unconfigured" };
  }

  const body = new URLSearchParams();
  body.set("token", token);
  body.set("user", user);
  body.set("title", opts.title.slice(0, 250));
  body.set("message", opts.message.slice(0, 1024));
  body.set("priority", String(opts.priority));
  body.set("tags", "slj-uptime");
  if (opts.priority === 2) {
    body.set("retry", "60");
    body.set("expire", "180");
    body.set("sound", "siren");
  } else if (opts.priority === 1) {
    body.set("sound", "persistent");
  }

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: number;
    errors?: string[];
    receipt?: string;
  };
  if (!res.ok || json.status !== 1) {
    return {
      ok: false as const,
      error: json.errors?.join(", ") || `pushover_http_${res.status}`,
    };
  }
  return { ok: true as const, receipt: json.receipt };
}

/**
 * Better Stack → Pushover bridge.
 * Secure with ?secret= BETTER_STACK_WEBHOOK_SECRET (or Authorization: Bearer …).
 */
export async function POST(req: NextRequest) {
  const expected = process.env.BETTER_STACK_WEBHOOK_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "webhook_unconfigured" },
      { status: 503 }
    );
  }

  const q = req.nextUrl.searchParams.get("secret");
  const auth = req.headers.get("authorization");
  const bearer = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;
  if (q !== expected && bearer !== expected) {
    return unauthorized();
  }

  let payload: BetterStackIncidentPayload;
  try {
    payload = (await req.json()) as BetterStackIncidentPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const attrs = payload.data?.attributes ?? {};
  const name = attrs.name?.trim() || "";
  const cause = attrs.cause?.trim() || "";
  const url = attrs.url?.trim();
  const event = payload.event?.trim();

  // Broken/empty Better Stack templates previously produced "Monitor / Unknown cause"
  // noise. Skip incomplete payloads instead of notifying.
  const looksPlaceholder =
    !name ||
    name === "Monitor" ||
    !cause ||
    cause === "Unknown cause" ||
    event === "$EVENT" ||
    (url?.includes(".vercel.app") ?? false);

  if (looksPlaceholder && (!name || name === "Monitor")) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "incomplete_payload",
    });
  }

  const down = isDownEvent(event, attrs.resolved_at);

  const title = down ? `🔴 ${name || "Monitor"}` : `🟢 ${name || "Monitor"} recovered`;
  const lines = [
    cause || null,
    url ? `URL: ${url}` : null,
    event ? `Event: ${event}` : null,
    payload.data?.id ? `Incident: ${payload.data.id}` : null,
  ].filter(Boolean);

  const emergency = process.env.PUSHOVER_EMERGENCY === "1";
  const priority: 0 | 1 | 2 = down ? (emergency ? 2 : 1) : 0;
  const result = await sendPushover({
    title,
    message: lines.join("\n") || "Uptime event",
    priority,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 502 }
    );
  }

  return NextResponse.json({
    ok: true,
    down,
    event: event ?? null,
    priority,
  });
}
