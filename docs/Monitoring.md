# Monitoring & analytics (agent-configurable)

**Status:** Chosen stack for SLJ production (`slj.talksfromthewarehouse.co.uk`)  
**Principle:** Prefer **API / CLI / MCP** tools so Cursor agents can create monitors, wire SDKs, and verify alerts without clicking through dashboards.

---

## Chosen stack

| Layer | Tool | Why (agent-friendly) | Cookies? |
|-------|------|----------------------|----------|
| **Uptime** | [Better Stack](https://betterstack.com/) Uptime (free) | REST API monitors; email + Slack on free | N/A |
| **Critical phone alerts** | [Pushover](https://pushover.net/) | iOS Critical Alerts / emergency priority; Better Stack webhook → `/api/webhooks/betterstack` → Pushover | N/A |
| **App errors** | [Sentry](https://sentry.io/) | Cursor **Sentry MCP** + `@sentry/nextjs` + auth token API; optional uptime monitors later | Server SDK: no visitor cookies. Skip Session Replay for V1 |
| **Page analytics** | [Vercel Web Analytics](https://vercel.com/docs/analytics) | Enable via `@vercel/analytics` in code + Vercel project (CLI); privacy-friendly pageviews | **No cookie banner** for Web Analytics (no advertising cookies) |

**Not chosen:** Better Stack paid iOS app ($29/responder) when Pushover (~$5 once) covers Critical Alerts; Plausible Sites API; GA4/PostHog default (cookies → consent UI); OpenClaw-only uptime (Mini can die silently).

---

## Cookie / privacy note

- **Auth session cookies** — necessary for sign-in; disclose in privacy text when you add a policy page.
- **Vercel Web Analytics** — cookieless / privacy-friendly; **no marketing cookie banner required** for this alone.
- **Sentry browser SDK** — errors/tracing only in V1; do **not** enable Session Replay without revisiting consent.
- If you later add GA/Meta pixels → then add a cookie notice.

---

## Phone alerts (Critical Alerts via Pushover)

Better Stack **free** includes email + Slack only (not their iOS app push). For alerts that cut through Focus/Silent:

1. Install **Pushover** on iPhone; enable **Critical Alerts** in iOS Settings → Pushover.
2. Create a Pushover application; set on Vercel Production:
   - `PUSHOVER_API_TOKEN`
   - `PUSHOVER_USER_KEY`
   - `BETTER_STACK_WEBHOOK_SECRET` (random string)
3. Better Stack outgoing webhook →  
   `https://slj.talksfromthewarehouse.co.uk/api/webhooks/betterstack?secret=…`  
   (`incident_change`, started + resolved). Route behaviour:
   - **SLJ monitors** (name/URL contains `slj`): high-priority Pushover on down (Critical Alert capable, **no endless retries**); normal on recovery. Set `PUSHOVER_EMERGENCY=1` only if you want emergency priority (retries until you acknowledge).
   - **All other monitors**: still sent to Pushover, but **quiet** (priority −1 — notification, no sound/vibration).
4. Slack `#alarms` can stay as a quiet log.

**Confirmation periods (reduces flap noise):** non-SLJ monitors use **300s** before an incident opens; SLJ stays at **60s** for faster course-app detection.

## Weekly usage email — plan

**Vercel Web Analytics does not send a built-in weekly email.** Planned system (documented for Inkar + eng):

- **Mailchimp CTA** = SLJ URL with UTMs (Vercel’s “referral” equivalent — no separate Vercel short link).
- **Monday digest** = **GitHub Action** (`.github/workflows/weekly-digest.yml`, Mondays `0 8 * * 1` UTC) → `/api/cron/weekly-digest` → Web Analytics API + Neon **account list** + activity → **Resend** to `WEEKLY_DIGEST_TO` (Louis + James).
  Vercel `vercel.json` also declares a daily cron (`0 8 * * *`; route emails Mondays only, or `?force=1`), but this project’s Vercel cron **definitions stayed empty**, so Actions is the reliable trigger. Requires repo secret `CRON_SECRET` (same value as Vercel). Manual: Actions → Weekly digest → Run workflow.
- **Analytics token:** Production env `VERCEL_ANALYTICS_TOKEN` must be a **dashboard** token from [vercel.com/account/tokens](https://vercel.com/account/tokens) (scopes: read Web Analytics for team `roundtable-supports-projects`). Do **not** use a CLI/`vercel login` session token — those expire after ~10 days idle and surface as `invalidToken` in the digest. If analytics shows unavailable, rotate this token and redeploy.

---

## Secrets Louis must provide once

Paste into Cursor secrets / shell (never commit):

| Env | Where to get |
|-----|----------------|
| `BETTER_STACK_UPTIME_API_TOKEN` | Better Stack → Settings → API tokens |
| `PUSHOVER_API_TOKEN` | Pushover → your application (e.g. Roundtable Uptime) |
| `PUSHOVER_USER_KEY` | Pushover dashboard user key |
| `BETTER_STACK_WEBHOOK_SECRET` | Random secret protecting `/api/webhooks/betterstack` |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens (`project:write`, `org:read`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project client DSN (after project create) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | e.g. org slug + `slj` |

Then an agent can run `pnpm exec tsx scripts/setup-monitoring.ts`.

Also: **authenticate Sentry MCP** in Cursor (MCP auth) so agents can inspect issues.

---

## Health check (in this repo)

- `GET /api/health` — app liveness only (no Neon ping). Safe for frequent uptime checks.
- `GET /api/health/db` — Neon `SELECT 1`. **Monitor at low frequency only** (e.g. every 10 min).

Better Stack should monitor:

1. `https://slj.talksfromthewarehouse.co.uk/` (every 180s) — app reachable  
2. `https://slj.talksfromthewarehouse.co.uk/api/health/db` (every 600s) — database up  

Do **not** point a 60s monitor at any URL that queries Neon; it prevents scale-to-zero and burns CU-hours on Free/Launch.

---

## Agent setup script

```bash
export BETTER_STACK_UPTIME_API_TOKEN=…
pnpm exec tsx scripts/setup-monitoring.ts
```

Creates/updates Better Stack monitors for prod health + homepage. Idempotent by pronounceable name.

---

## Manual one-time UI (cannot fully API yet)

| Step | Who |
|------|-----|
| Create Better Stack account + install phone app | Louis |
| Create free Sentry org if none | Louis or agent via MCP after auth |
| Enable Web Analytics on Vercel project | Agent: add `@vercel/analytics`; confirm in Vercel → Analytics if toggle required |

---

## Related

- ADR [0004-analytics.md](./adr/0004-analytics.md) — V1 still avoids a heavy event pipeline; Web Analytics is the light exception for “is anyone using it?”
- Production URL: https://slj.talksfromthewarehouse.co.uk
