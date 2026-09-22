import { NextRequest, NextResponse } from "next/server";
import { sendTftwWelcomeEmail } from "@/lib/tftw-welcome-email";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Mailchimp list webhook — website (and admin) subscribe events.
 * Configured with sources.api=false so course auto-subscribe does not double-send.
 *
 * Mailchimp validates the URL with GET; POST is application/x-www-form-urlencoded.
 */
export async function GET() {
  return new NextResponse("ok", { status: 200 });
}

export async function POST(req: NextRequest) {
  const expected = process.env.MAILCHIMP_WEBHOOK_SECRET?.trim();
  if (expected) {
    const q = req.nextUrl.searchParams.get("secret");
    if (q !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
  }

  const contentType = req.headers.get("content-type") ?? "";
  let type = "";
  let email = "";

  try {
    if (contentType.includes("application/json")) {
      const json = (await req.json()) as {
        type?: string;
        data?: { email?: string };
      };
      type = String(json.type ?? "");
      email = String(json.data?.email ?? "").trim().toLowerCase();
    } else {
      const form = await req.formData();
      type = String(form.get("type") ?? "");
      email = String(
        form.get("data[email]") ?? form.get("data[merges][EMAIL]") ?? ""
      )
        .trim()
        .toLowerCase();
    }
  } catch {
    return NextResponse.json({ ok: false, error: "bad_body" }, { status: 400 });
  }

  if (type !== "subscribe" || !email.includes("@")) {
    return NextResponse.json({ ok: true, ignored: true, type });
  }

  const sent = await sendTftwWelcomeEmail({ email });
  if (!sent.ok) {
    console.error("[mailchimp-webhook] welcome failed", sent.error);
    return NextResponse.json(
      { ok: false, error: sent.error },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, sent: true, email });
}
