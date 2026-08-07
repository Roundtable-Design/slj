# Brief: SLJ monitoring setup (Inkar)

**Owner:** Inkar  
**Accounts:** Roundtable **Sentry** · Louis’s **Better Stack**  
**App:** https://slj.talksfromthewarehouse.co.uk  
**Repo context:** [`docs/Monitoring.md`](./Monitoring.md) (stack rationale)

Do this once so Louis gets phone alerts if the site falls over, and we capture errors + basic pageviews.

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

5. Redeploy production (or wait for next push) so Sentry is active.
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
   export BETTER_STACK_UPTIME_API_TOKEN='…'
   pnpm setup:monitoring
   ```

   That creates/updates:
   - **SLJ production health** → `https://slj.talksfromthewarehouse.co.uk/api/health` (every 60s)
   - **SLJ production homepage** → `https://slj.talksfromthewarehouse.co.uk/` (every 180s)

5. Confirm both monitors are **Up** in the Better Stack UI.
6. Trigger a quick test alert if the UI allows (or temporarily pause the health route with Louis’s OK), confirm **phone push** + email.

If you prefer the UI over the script: create the same two HTTP monitors manually with those URLs and check frequencies.

---

## 3. Vercel Web Analytics

1. Vercel → **`slj`** → **Analytics** → enable **Web Analytics** if not already on.
2. Code already includes `@vercel/analytics` in the root layout — no cookie banner needed for this.

---

## 4. Done checklist

- [ ] Sentry project `slj` + DSN on Vercel Production  
- [ ] Production redeploy after env vars  
- [ ] Better Stack monitors for `/api/health` + homepage  
- [ ] Louis receives a test downtime / alert on his phone  
- [ ] Web Analytics enabled on the Vercel project  

Ping Louis when the checklist is green.

---

## Links

- Production health: https://slj.talksfromthewarehouse.co.uk/api/health  
- Setup script: `scripts/setup-monitoring.ts`  
- Full stack notes: [`Monitoring.md`](./Monitoring.md)
