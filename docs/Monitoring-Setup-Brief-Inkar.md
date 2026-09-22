# Brief: SLJ monitoring setup (Inkar)

**Owner:** Inkar  
**Accounts:** Roundtable **Sentry** · Louis’s **Better Stack** · Roundtable **Vercel**  
**App:** https://slj.talksfromthewarehouse.co.uk  
**Repo (new home):** https://github.com/Roundtable-Design/slj  
**Repo context:** [`docs/Monitoring.md`](./Monitoring.md) (stack rationale)

Do this so Louis gets phone alerts if the site falls over, deploys keep working after the GitHub org move, Mailchimp traffic is measurable (UTM tracking link), errors are captured, and the **planned Monday usage email** has the data it needs (see §5 — eng builds the cron after this).

---

## 0. Vercel ↔ GitHub (required after repo move)

The repo moved from `louisreid/slj` → **`Roundtable-Design/slj`**. Vercel must point at the new GitHub repo or production deploys stop updating.

1. Vercel → team **roundtable-supports-projects** → project **`slj`**.
2. **Settings → Git**.
3. Disconnect the old `louisreid/slj` connection if still shown.
4. **Connect Git Repository** → choose **`Roundtable-Design/slj`** (ensure the Vercel GitHub App can access the **Roundtable-Design** org — org Settings → GitHub Apps / Vercel if the repo doesn’t appear).
5. Confirm **Production Branch** = `main`.
6. Trigger a production deploy (empty commit or **Redeploy** latest) and confirm https://slj.talksfromthewarehouse.co.uk updates.

---

## 1. Sentry (Roundtable account)

1. Log into Roundtable’s Sentry org.
2. Create project **`slj`** (platform: **Next.js**), or reuse if it already exists.
3. Copy the **DSN**.
4. In Vercel → project **`slj`** → Settings → Environment Variables, add for **Production** (and Preview if useful):

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SENTRY_DSN` | *(DSN)* |
   | `SENTRY_DSN` | *(same DSN)* |
   | `SENTRY_ORG` | Roundtable org slug |
   | `SENTRY_PROJECT` | `slj` |
   | `SENTRY_AUTH_TOKEN` | Auth token with `project:releases` / org read-write as needed for source maps (optional but preferred) |

5. Redeploy production after env vars so Sentry is active.
6. Smoke-check: open Sentry → Issues after a deploy; optional: hit a known test error once, then delete it.

**Do not** enable Session Replay for V1 (keeps us clear of a cookie banner for analytics).

---

## 2. Better Stack (Louis’s account)

Ask Louis for access, or have him create an **API token** and share it securely (1Password / DM — not in git).

1. Log into Louis’s Better Stack (Uptime).
2. Install the **Better Stack mobile app** on Louis’s phone and sign in (push alerts).
3. Create API token: **Settings → API tokens**.
4. From a machine with the repo:

   ```bash
   git clone https://github.com/Roundtable-Design/slj.git   # or pull latest
   cd slj && pnpm i
   export BETTER_STACK_UPTIME_API_TOKEN='…'
   pnpm setup:monitoring
   ```

   That creates/updates:
   - **SLJ production homepage** → `https://slj.talksfromthewarehouse.co.uk/` (every 180s)
   - **SLJ production database** → `https://slj.talksfromthewarehouse.co.uk/api/health/db` (every 600s — do not use 60s; keeps Neon awake)
   - **SLJ production homepage** → `https://slj.talksfromthewarehouse.co.uk/` (every 180s)

5. Confirm both monitors are **Up** in the Better Stack UI.
6. Trigger a quick test alert if the UI allows, confirm **phone push** + email.

If you prefer the UI over the script: create the same two HTTP monitors manually with those URLs and check frequencies.

---

## 3. Vercel Web Analytics — enable now

1. Vercel → **`slj`** → **Analytics** → enable **Web Analytics** if not already on.
2. Code already includes `@vercel/analytics` in the root layout — no cookie banner needed for this.

**What the dashboard shows today:** pageviews / visitors by path (e.g. `/auth/sign-in`), referrers, and (when UTMs are on links) campaign filters. It does **not** email a weekly funnel report by itself — that is the planned job in §5.

**Note:** Rich UTM breakdowns in the Vercel UI may need **Web Analytics Plus**. Even without Plus, the **API** can still power our digest, and Mailchimp’s own click stats always work.

---

## 4. Mailchimp — tracking link (paste this)

Vercel does **not** issue a separate “referral” short link. Tracking works by putting **UTM query params** on the SLJ URL. That is the link Vercel (and our weekly digest) attribute as Mailchimp traffic.

**Use this exact URL** for the primary “Start here” / course CTA (copy–paste into Mailchimp):

```text
https://slj.talksfromthewarehouse.co.uk/auth/sign-in?utm_source=mailchimp&utm_medium=email&utm_campaign=slj-digital-launch&utm_content=start-here
```

| Param | Value | Why |
|-------|--------|-----|
| `utm_source` | `mailchimp` | Marks email traffic |
| `utm_medium` | `email` | Channel |
| `utm_campaign` | `slj-digital-launch` | Stable slug for this launch send (change only for a new campaign) |
| `utm_content` | `start-here` | Which button/placement |

Rules:

- Update **every** SLJ link in the campaign(s) the same way (vary `utm_content` only if there are multiple CTAs).
- Keep Mailchimp’s click-tracking wrapper **and** leave these query params on the final destination (don’t strip them).
- After send: **Mailchimp → Reports** = opens/clicks from the email; Vercel / weekly digest = landings that arrived with these UTMs.
- Confirm campaign **From** is `info@talksfromthewarehouse.co.uk` (see [`InfoEmail-Mailbox.md`](./InfoEmail-Mailbox.md)).

---

## 5. Planned system: weekly usage email (engineering)

**Goal:** Every Monday morning (UK), email Louis (and optional Roundtable recipients) a short digest — not a dashboard login.

Vercel Analytics alone cannot send that email. We build a small **cron + Resend** job that pulls numbers and emails them. Inkar’s job for this section is mostly §4 (UTM link) + enabling Analytics; Louis/agent builds the job next.

### What the Monday email will include

| Line in the email | Source |
|-------------------|--------|
| Pageviews / visitors (site total) | Vercel Web Analytics API |
| Hits on `/auth/sign-in` | Vercel API filter `requestPath` |
| Landings from Mailchimp (`utm_source=mailchimp`) | Vercel API UTM filter — **requires §4 link** |
| New + all accounts (email, name, joined) | Neon `user` table — admin digest only (`WEEKLY_DIGEST_TO`); excludes `@example.com` / e2e test users |
| Notes written / sections marked complete (counts) | Neon aggregates — **never note text** |
| Top course paths this week | Vercel API |
| Errors / downtime summary (optional one-liner) | Sentry / Better Stack APIs |

**Out of scope for v1 of the digest:** full Mailchimp open rates inside our email (use Mailchimp Reports for that), Session Replay, note bodies. Account **emails are included** for Louis/admin recipients only.

### Architecture (boring)

```text
Vercel Cron (Mon ~09:00 Europe/London)
  → GET /api/cron/weekly-digest  (Authorization: Bearer CRON_SECRET)
      → query Vercel Web Analytics API (pageviews, paths, UTMs)
      → query Neon for aggregate activity counts
      → Resend → louis@… (+ optional support@round-table.co.uk)
```

| Piece | Detail |
|-------|--------|
| Schedule | `vercel.json` cron `0 8 * * *` (08:00 UTC daily); handler only emails on Mondays UTC (≈ 09:00 BST) unless `?force=1` |
| Auth | `CRON_SECRET` env on Vercel; reject unauthenticated calls |
| Analytics token | Vercel token with Web Analytics read + `projectId` / `teamId` as env |
| Email | Existing **Resend** account (same stack as magic links) |
| Privacy | Account emails OK for admin digest; never log or email note bodies |

### Phases

| Phase | Who | What |
|-------|-----|------|
| **A — now** | Inkar | §0 Git, §1–3 monitoring, §4 **paste UTM link into Mailchimp** |
| **B — next eng** | Louis / agent | Implement cron route + Resend template + env vars; send a test digest once |
| **C — optional** | Eng | Custom `track()` events (e.g. `sign_in_success`) if Neon counts aren’t enough; Mailchimp Marketing API for click totals in the same email |

### Env vars for Phase B (document when building — do not invent values yet)

| Name | Purpose |
|------|---------|
| `CRON_SECRET` | Protect the cron route |
| `VERCEL_ANALYTICS_TOKEN` | Web Analytics API (dashboard token; not CLI login) |
| `VERCEL_TEAM_ID` / `VERCEL_PROJECT_ID` | Scope the query |
| `RESEND_API_KEY` | Already used for auth email |
| `WEEKLY_DIGEST_TO` | Comma-separated recipients (default: Louis + James `theodgersfamily@aol.com`) |

Until Phase B ships: use Mailchimp Reports + Vercel Analytics UI manually each week.

---

## 6. Done checklist

### Inkar (this week)

- [x] Vercel Git connected to **`Roundtable-Design/slj`**; production deploy succeeds  
- [x] Sentry project `slj` + DSN on Vercel Production  
- [x] Production redeploy after Sentry env vars  
- [x] Better Stack monitors for `/api/health` + homepage  
- [x] Louis receives a test downtime / alert on his phone  
- [x] Web Analytics enabled on the Vercel project  
- [x] Mailchimp SLJ CTAs use the **UTM tracking URL** from §4  

### Engineering (Phase B — after Inkar)

- [ ] Weekly digest cron + Resend email live; Louis receives a test Monday (or forced) run  

Inkar’s checklist is green (Aug 2026). Phase B remains for Louis / eng.

---

## Links

- Production: https://slj.talksfromthewarehouse.co.uk  
- Health: https://slj.talksfromthewarehouse.co.uk/api/health  
- Repo: https://github.com/Roundtable-Design/slj  
- Setup script: `scripts/setup-monitoring.ts`  
- Full stack notes: [`Monitoring.md`](./Monitoring.md)  
- `info@` mailbox: [`InfoEmail-Mailbox.md`](./InfoEmail-Mailbox.md)
