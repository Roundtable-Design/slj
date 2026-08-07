import { neon } from "@neondatabase/serverless";

export type DigestAccount = {
  email: string;
  name: string | null;
  /** Auth.js has no createdAt; emailVerified ≈ first successful magic-link. */
  joinedAt: string | null;
};

export type WeeklyDigestData = {
  weekStartIso: string;
  weekEndIso: string;
  accountsTotal: number;
  accountsNewThisWeek: DigestAccount[];
  accountsAll: DigestAccount[];
  notesCountWeek: number;
  progressCompletionsWeek: number;
  analytics?: {
    pageviews: number | null;
    visitors: number | null;
    signInPageviews: number | null;
    mailchimpLandings: number | null;
    error?: string;
  };
};

const TEST_EMAIL_RE =
  /@(example\.com)$/i;

function isTestAccount(email: string | null | undefined): boolean {
  if (!email) return true;
  if (TEST_EMAIL_RE.test(email)) return true;
  if (/^(e2e-|staging-qa-|session-check-|test-)/i.test(email)) return true;
  return false;
}

function weekWindow(now = new Date()) {
  const weekEnd = now;
  const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { weekStart, weekEnd };
}

async function fetchAnalytics(since: Date, until: Date) {
  const token = process.env.VERCEL_TOKEN?.trim();
  const projectId =
    process.env.VERCEL_PROJECT_ID?.trim() ||
    process.env.VERCEL_PROJECT_ID_SLJ?.trim() ||
    "prj_hG6Wwle5fSSvg5hcEyS0K1JYTer4";
  const teamId =
    process.env.VERCEL_TEAM_ID?.trim() || "team_F3yCY7NEWjHAaPkzyAGiQ4W2";

  if (!token) {
    return { pageviews: null, visitors: null, signInPageviews: null, mailchimpLandings: null, error: "VERCEL_TOKEN unset" };
  }

  async function count(filter?: string) {
    const params = new URLSearchParams({
      projectId,
      teamId,
      since: since.toISOString(),
      until: until.toISOString(),
    });
    if (filter) params.set("filter", filter);
    const res = await fetch(
      `https://api.vercel.com/v1/query/web-analytics/visits/count?${params}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) {
      throw new Error(`analytics ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
    const json = (await res.json()) as {
      data?: { pageviews?: number; visitors?: number };
    };
    return {
      pageviews: json.data?.pageviews ?? null,
      visitors: json.data?.visitors ?? null,
    };
  }

  try {
    const all = await count();
    const signIn = await count("requestPath eq '/auth/sign-in'");
    let mailchimp: { pageviews: number | null; visitors: number | null } = {
      pageviews: null,
      visitors: null,
    };
    try {
      mailchimp = await count("utmSource eq 'mailchimp'");
    } catch {
      // UTM dimensions may need Analytics Plus — ignore.
    }
    return {
      pageviews: all.pageviews,
      visitors: all.visitors,
      signInPageviews: signIn.pageviews,
      mailchimpLandings: mailchimp.pageviews ?? mailchimp.visitors,
    };
  } catch (e) {
    return {
      pageviews: null,
      visitors: null,
      signInPageviews: null,
      mailchimpLandings: null,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function gatherWeeklyDigestData(
  now = new Date()
): Promise<WeeklyDigestData> {
  const { weekStart, weekEnd } = weekWindow(now);
  const dbUrl = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;
  if (!dbUrl) {
    throw new Error("DATABASE_URL is not configured");
  }
  const sql = neon(dbUrl);

  const rows = await sql`
    SELECT email, name, "emailVerified" AS joined_at
    FROM "user"
    ORDER BY "emailVerified" DESC NULLS LAST, email ASC
  `;

  const accountsAll: DigestAccount[] = rows
    .filter((r) => !isTestAccount(r.email as string | null))
    .map((r) => ({
      email: String(r.email),
      name: (r.name as string | null) ?? null,
      joinedAt: r.joined_at
        ? new Date(r.joined_at as string | Date).toISOString()
        : null,
    }));

  const weekStartMs = weekStart.getTime();
  const accountsNewThisWeek = accountsAll.filter((a) => {
    if (!a.joinedAt) return false;
    return new Date(a.joinedAt).getTime() >= weekStartMs;
  });

  const notes = await sql`
    SELECT COUNT(*)::int AS n
    FROM notes
    WHERE created_at >= ${weekStart.toISOString()}
  `;

  const progress = await sql`
    SELECT COUNT(*)::int AS n
    FROM progress
    WHERE completed_at IS NOT NULL
      AND completed_at >= ${weekStart.toISOString()}
  `;

  const analytics = await fetchAnalytics(weekStart, weekEnd);

  return {
    weekStartIso: weekStart.toISOString(),
    weekEndIso: weekEnd.toISOString(),
    accountsTotal: accountsAll.length,
    accountsNewThisWeek,
    accountsAll,
    notesCountWeek: notes[0]?.n ?? 0,
    progressCompletionsWeek: progress[0]?.n ?? 0,
    analytics,
  };
}

export function formatWeeklyDigestEmail(data: WeeklyDigestData): {
  subject: string;
  text: string;
  html: string;
} {
  const fmt = (iso: string | null) =>
    iso
      ? new Date(iso).toLocaleString("en-GB", {
          timeZone: "Europe/London",
          dateStyle: "medium",
          timeStyle: "short",
        })
      : "—";

  const newLines =
    data.accountsNewThisWeek.length === 0
      ? "  (none)"
      : data.accountsNewThisWeek
          .map(
            (a) =>
              `  • ${a.email}${a.name ? ` (${a.name})` : ""} — joined ${fmt(a.joinedAt)}`
          )
          .join("\n");

  const allLines = data.accountsAll
    .map(
      (a) =>
        `  • ${a.email}${a.name ? ` (${a.name})` : ""} — ${fmt(a.joinedAt)}`
    )
    .join("\n");

  const a = data.analytics;
  const subject = `SLJ weekly digest — ${data.accountsNewThisWeek.length} new account(s), ${data.accountsTotal} total`;

  const text = [
    `Simplicity Love & Justice — weekly digest`,
    `Period: ${fmt(data.weekStartIso)} → ${fmt(data.weekEndIso)} (Europe/London)`,
    ``,
    `## Accounts`,
    `Total (excl. test): ${data.accountsTotal}`,
    `New this week: ${data.accountsNewThisWeek.length}`,
    `New this week:`,
    newLines,
    ``,
    `All accounts:`,
    allLines,
    ``,
    `## Activity (Neon)`,
    `Notes created this week: ${data.notesCountWeek}`,
    `Section completions this week: ${data.progressCompletionsWeek}`,
    ``,
    `## Vercel Analytics`,
    a?.error
      ? `Unavailable: ${a.error}`
      : [
          `Pageviews: ${a?.pageviews ?? "—"}`,
          `Visitors: ${a?.visitors ?? "—"}`,
          `Sign-in page views: ${a?.signInPageviews ?? "—"}`,
          `Mailchimp UTM landings: ${a?.mailchimpLandings ?? "—"}`,
        ].join("\n"),
    ``,
    `Joined dates use Auth.js emailVerified (first successful magic link).`,
  ].join("\n");

  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  const html = `<pre style="font-family:ui-monospace,Menlo,monospace;font-size:13px;line-height:1.45;white-space:pre-wrap">${esc(text)}</pre>`;

  return { subject, text, html };
}
