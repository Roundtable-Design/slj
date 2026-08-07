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
  // Default Better Stack payloads may omit event; treat unresolved as down.
  return !resolvedAt;
}

async function sendPushover(opts: {
  title: string;
  message: string;
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
  if (opts.priority === 2) {
    // Emergency: repeats until ack; maps to iOS Critical Alerts when enabled.
    body.set("retry", "30");
    body.set("expire", "600");
    body.set("sound", "siren");
  }

  const res = await fetch("https://api.pushover.net/1/messages.json", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = (await res.json().catch(() => ({}))) as {
    status?: number;
    errors?: string[];
  };
  if (!res.ok || json.status !== 1) {
    return {
      ok: false as const,
      error: json.errors?.join(", ") || `pushover_http_${res.status}`,
    };
  }
  return { ok: true as const };
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
  const name = attrs.name?.trim() || "Monitor";
  const cause = attrs.cause?.trim() || "Unknown cause";
  const url = attrs.url?.trim();
  const event = payload.event;
  const down = isDownEvent(event, attrs.resolved_at);

  const title = down ? `🔴 ${name}` : `🟢 ${name} recovered`;
  const lines = [
    cause,
    url ? `URL: ${url}` : null,
    event ? `Event: ${event}` : null,
    payload.data?.id ? `Incident: ${payload.data.id}` : null,
  ].filter(Boolean);

  const result = await sendPushover({
    title,
    message: lines.join("\n"),
    priority: down ? 2 : 0,
  });

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, down, event: event ?? null });
}
