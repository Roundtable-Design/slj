# Monitoring & analytics (agent-configurable)

**Status:** Chosen stack for SLJ production (`slj.talksfromthewarehouse.co.uk`)  
**Principle:** Prefer **API / CLI / MCP** tools so Cursor agents can create monitors, wire SDKs, and verify alerts without clicking through dashboards.

---

## Chosen stack

| Layer | Tool | Why (agent-friendly) | Cookies? |
|-------|------|----------------------|----------|
| **Uptime + phone push** | [Better Stack](https://betterstack.com/) Uptime | Full REST API to create monitors & get statuses; mobile app for push | N/A (server-side) |
| **App errors** | [Sentry](https://sentry.io/) | Cursor **Sentry MCP** + `@sentry/nextjs` + auth token API; optional uptime monitors later | Server SDK: no visitor cookies. Skip Session Replay for V1 |
| **Page analytics** | [Vercel Web Analytics](https://vercel.com/docs/analytics) | Enable via `@vercel/analytics` in code + Vercel project (CLI); privacy-friendly pageviews | **No cookie banner** for Web Analytics (no advertising cookies) |
| **Backup phone ping** | OpenClaw Telegram (existing) | Optional: Better Stack webhook → Telegram, or Mini cron curl → Telegram | N/A |

**Not chosen:** Plausible Sites API (enterprise-gated provisioning), GA4/PostHog default (cookies → consent UI), OpenClaw-only uptime (Mini/home net can die silently).

---

## Cookie / privacy note

- **Auth session cookies** — necessary for sign-in; disclose in privacy text when you add a policy page.
- **Vercel Web Analytics** — cookieless / privacy-friendly; **no marketing cookie banner required** for this alone.
- **Sentry browser SDK** — errors/tracing only in V1; do **not** enable Session Replay without revisiting consent.
- If you later add GA/Meta pixels → then add a cookie notice.

---

## Phone alerts (priority)

1. Install **Better Stack** mobile app; sign in with the same account as the API token.
2. Monitors created via API with `email: true` (and push via app once logged in).
3. Optional: Better Stack → webhook → OpenClaw/Telegram for a second loud channel (same pattern as email-router priority).

## Weekly usage email — expectations

**Vercel Web Analytics does not send a built-in weekly email** covering sign-ins, Mailchimp clicks, or “what users did.”

| Question | Where the answer lives (V1) |
|----------|-------------------------------|
| Hit sign-in / course pages? | Vercel Analytics (filter by path) |
| Clicked Mailchimp CTA? | Mailchimp campaign report + UTM landings |
| Logged in / notes / progress? | Needs custom `track()` events and/or Neon queries — not automatic yet |

Inkar brief: [`Monitoring-Setup-Brief-Inkar.md`](./Monitoring-Setup-Brief-Inkar.md) (includes Mailchimp UTM + Vercel Git reconnect).

---

## Secrets Louis must provide once

Paste into Cursor secrets / shell (never commit):

| Env | Where to get |
|-----|----------------|
| `BETTER_STACK_UPTIME_API_TOKEN` | Better Stack → Settings → API tokens |
| `SENTRY_AUTH_TOKEN` | Sentry → Settings → Auth Tokens (`project:write`, `org:read`) |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry project client DSN (after project create) |
| `SENTRY_ORG` / `SENTRY_PROJECT` | e.g. org slug + `slj` |

Then an agent can run `pnpm exec tsx scripts/setup-monitoring.ts`.

Also: **authenticate Sentry MCP** in Cursor (MCP auth) so agents can inspect issues.

---

## Health check (in this repo)

`GET /api/health` — public, no auth.

- `200` `{ ok: true, db: "up" }` when Neon responds  
- `503` if DB unreachable  

Better Stack should monitor:

1. `https://slj.talksfromthewarehouse.co.uk/api/health` (every 60–180s)  
2. Optional: `https://slj.talksfromthewarehouse.co.uk/` (status only)

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
