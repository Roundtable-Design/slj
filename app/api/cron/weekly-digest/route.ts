import { NextRequest, NextResponse } from "next/server";
import {
  formatWeeklyDigestEmail,
  gatherWeeklyDigestData,
} from "@/lib/weekly-digest";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/**
 * Monday weekly usage + accounts digest.
 * Auth: Authorization: Bearer CRON_SECRET  or  ?secret=
 */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET?.trim();
  if (!expected) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET unset" },
      { status: 503 }
    );
  }
  const auth = req.headers.get("authorization");
  const bearer = auth?.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : null;
  const q = req.nextUrl.searchParams.get("secret");
  if (bearer !== expected && q !== expected) {
    return unauthorized();
  }

  const dryRun = req.nextUrl.searchParams.get("dryRun") === "1";
  const force = req.nextUrl.searchParams.get("force") === "1";

  // Hobby plan registers daily crons reliably; only send mail on Mondays (UTC)
  // unless ?force=1 (manual catch-up). Cron schedule is `0 8 * * *`.
  const weekdayUtc = new Date().getUTCDay(); // 0=Sun … 1=Mon
  if (!force && !dryRun && weekdayUtc !== 1) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: "not_monday_utc",
      weekdayUtc,
    });
  }

  try {
    const data = await gatherWeeklyDigestData();
    const { subject, text, html } = formatWeeklyDigestEmail(data);

    if (dryRun) {
      return NextResponse.json({
        ok: true,
        dryRun: true,
        subject,
        preview: text,
        newAccounts: data.accountsNewThisWeek.length,
        totalAccounts: data.accountsTotal,
      });
    }

    const toRaw =
      process.env.WEEKLY_DIGEST_TO?.trim() ||
      "louis@round-table.co.uk,theodgersfamily@aol.com";
    const to = toRaw.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
    const apiKey =
      process.env.AUTH_RESEND_KEY?.trim() ||
      process.env.RESEND_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json(
        { ok: false, error: "Resend API key unset" },
        { status: 503 }
      );
    }

    const from =
      process.env.WEEKLY_DIGEST_FROM?.trim() ||
      process.env.AUTH_EMAIL_FROM?.trim() ||
      "Simplicity Love & Justice <info@talksfromthewarehouse.co.uk>";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json(
        { ok: false, error: `resend_${res.status}`, detail: err.slice(0, 400) },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      sent: true,
      to,
      newAccounts: data.accountsNewThisWeek.length,
      totalAccounts: data.accountsTotal,
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : String(e),
      },
      { status: 500 }
    );
  }
}
