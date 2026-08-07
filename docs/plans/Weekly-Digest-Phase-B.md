# Phase B — Weekly usage digest email

**Status:** Awaiting Louis approval (do not implement until approved)  
**Owner (eng):** Louis / agent  
**Depends on:** Inkar Phase A complete (Sentry, Better Stack, Web Analytics, Mailchimp UTMs)  
**Related:** [`Monitoring-Setup-Brief-Inkar.md`](../Monitoring-Setup-Brief-Inkar.md) §5 · [`Monitoring.md`](../Monitoring.md) · ADR [`0004-analytics.md`](../adr/0004-analytics.md)

---

## Goal

Every Monday morning (UK), email Louis (and optional Roundtable recipients) a short usage digest — counts only, not a dashboard login.

Vercel Web Analytics does **not** send this email. We build a thin **cron + Resend** job.

---

## Decision needed from Louis

Approve (or amend) before build:

1. **Recipients** — default proposal: Louis + optional `support@round-table.co.uk`
2. **Schedule** — Mon ~09:00 Europe/London (`0 8 * * 1` UTC ≈ 09:00 BST; retune for GMT)
3. **v1 metrics set** below (in / out of scope)
4. **Go ahead to implement** Phase B in this repo

---

## Email contents (v1)

| Line | Source |
|------|--------|
| Pageviews / visitors (site total) | Vercel Web Analytics API |
| Hits on `/auth/sign-in` | Vercel API filter `requestPath` |
| Landings from Mailchimp (`utm_source=mailchimp`) | Vercel API UTM filter (requires live Mailchimp UTM links) |
| New accounts (count only) | Neon `user` table — aggregate count for the week |
| Notes written / sections marked complete (counts) | Neon `notes` / `progress` (or `chapter_progress`) — **counts only, never note text** |
| Top course paths this week | Vercel Web Analytics API |
| Errors / downtime one-liner (optional) | Sentry / Better Stack APIs |

**Out of scope for v1:** Mailchimp open rates inside our email (use Mailchimp Reports), Session Replay, per-user activity lists, PII beyond aggregate counts.

---

## Architecture

```text
Vercel Cron (Mon ~09:00 Europe/London)
  → GET /api/cron/weekly-digest  (Authorization: Bearer CRON_SECRET)
      → query Vercel Web Analytics API (pageviews, paths, UTMs)
      → query Neon for aggregate activity counts
      → Resend → WEEKLY_DIGEST_TO
```

| Piece | Detail |
|-------|--------|
| Route | `app/api/cron/weekly-digest/route.ts` (new) |
| Schedule | `vercel.json` cron entry |
| Auth | Reject unless `Authorization: Bearer ${CRON_SECRET}` |
| Email | Existing Resend stack (same as magic links) |
| Privacy | Counts only; never log or email note bodies |

---

## Env vars (Production)

| Name | Purpose | Status |
|------|---------|--------|
| `CRON_SECRET` | Protect cron route | **New** |
| `VERCEL_TOKEN` | Web Analytics API read | **New** |
| `VERCEL_TEAM_ID` | Scope analytics query | **New** |
| `VERCEL_PROJECT_ID` | Scope analytics query | **New** |
| `WEEKLY_DIGEST_TO` | Comma-separated recipients | **New** |
| `RESEND_API_KEY` | Send digest | Exists (auth email) |
| `DATABASE_URL` | Neon aggregates | Exists |

Do not invent values in git; set on Vercel when building.

---

## Build steps (after approval)

1. Add cron route + zod/auth check for `CRON_SECRET`
2. Implement Vercel Web Analytics API client (pageviews, path, UTM filters)
3. Implement Neon aggregate queries (users created, notes count, progress completions for last 7 days)
4. Resend HTML + plain-text template (typography-first, short)
5. Add `vercel.json` cron schedule
6. Document env vars in `.env.example` (names only / placeholders)
7. **Test:** `curl` the route with Bearer secret against Preview or Production; confirm Louis receives email
8. Check off Phase B in Inkar brief §6 + `docs/Tasks.md`

### Optional later (Phase C)

- Custom `track()` events (e.g. `sign_in_success`) if Neon counts aren’t enough
- Mailchimp Marketing API click totals in the same email
- Sentry / Better Stack summary line

---

## How to test (once built)

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://slj.talksfromthewarehouse.co.uk/api/cron/weekly-digest"
```

Expect `200` and an email to `WEEKLY_DIGEST_TO`. Do not wait for Monday for the first proof.

---

## Non-negotiables

- Not an LMS / BI product — keep the job boring and durable
- Never include note contents or user emails in the digest body
- No GA4 / cookie-banner analytics for this
- Minimize dependencies; reuse Resend + Neon + Vercel APIs already in stack
