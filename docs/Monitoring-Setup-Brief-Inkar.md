# Brief: SLJ monitoring setup (Inkar)

**Owner:** Inkar  
**Accounts:** Roundtable **Sentry** · Louis’s **Better Stack** · Roundtable **Vercel**  
**App:** https://slj.talksfromthewarehouse.co.uk  
**Repo (new home):** https://github.com/Roundtable-Design/slj  
**Repo context:** [`docs/Monitoring.md`](./Monitoring.md) (stack rationale)

Do this so Louis gets phone alerts if the site falls over, deploys keep working after the GitHub org move, Mailchimp traffic is measurable, and we capture errors + basic usage.

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
   - **SLJ production health** → `https://slj.talksfromthewarehouse.co.uk/api/health` (every 60s)
   - **SLJ production homepage** → `https://slj.talksfromthewarehouse.co.uk/` (every 180s)

5. Confirm both monitors are **Up** in the Better Stack UI.
6. Trigger a quick test alert if the UI allows, confirm **phone push** + email.

If you prefer the UI over the script: create the same two HTTP monitors manually with those URLs and check frequencies.

---

## 3. Vercel Web Analytics — what it can / can’t do

### What you get today (no extra work)

- Dashboard pageviews / visitors for routes like `/`, `/auth/sign-in`, `/course/…`
- Referrers (when present)
- **No built-in weekly email digest** that says “N signed in, M completed a chapter”
- **Does not know “logged in” or “what they did”** by itself — only pages loaded (unless we add custom events later)

### Weekly email updates

**Vercel Analytics does not send a ready-made weekly email report** for funnel metrics. Options:

| Need | Practical approach |
|------|-------------------|
| “How many hit sign-in?” | Check Vercel → Analytics → filter path `/auth/sign-in` (manual weekly), **or** later automate via `vercel metrics` / Web Analytics API + a cron email |
| “How many clicked Mailchimp?” | Use **Mailchimp campaign reports** (opens/clicks) **and** UTM links into SLJ (below) so Vercel can show campaign traffic |
| “How many logged in / what they did?” | Needs **custom events** (and/or DB queries on Neon). Not available from pageviews alone. Flag for a follow-up task if Louis wants this automated |

For V1: enable Web Analytics + Mailchimp UTMs; Louis reviews the Vercel dashboard (and Mailchimp reports) weekly. Do **not** promise an automatic weekly email from Vercel alone without building a small report job later.

### Enable Web Analytics

1. Vercel → **`slj`** → **Analytics** → enable **Web Analytics** if not already on.
2. Code already includes `@vercel/analytics` in the root layout — no cookie banner needed for this.

**Note:** UTM breakdowns in the Vercel UI may require **Web Analytics Plus** on the team plan. Even without Plus, Mailchimp’s own click stats still work, and landing URLs with UTMs remain best practice.

---

## 4. Mailchimp — update links with tracking params

Please **update every SLJ link in the Mailchimp campaign(s)** (including the “Start here” / course CTA) so traffic is attributable.

**Canonical destination:**  
`https://slj.talksfromthewarehouse.co.uk`  
(or `/auth/sign-in` if the CTA should go straight to sign-in)

**Add UTM query params**, for example:

```text
https://slj.talksfromthewarehouse.co.uk/auth/sign-in?utm_source=mailchimp&utm_medium=email&utm_campaign=slj-digital-launch&utm_content=start-here
```

Guidelines:

- `utm_source=mailchimp`
- `utm_medium=email`
- `utm_campaign=` a stable slug for this send (e.g. `slj-digital-launch`)
- `utm_content=` button/placement name if you have multiple links in one email
- Use the **same campaign slug** across all links in that send
- Prefer Mailchimp’s merge/tracked links **with** these UTMs still on the final URL (don’t strip query params)
- After send: check **Mailchimp → Reports** for clicks, and Vercel Analytics / referrers for landings

Also confirm the campaign **From** is `info@talksfromthewarehouse.co.uk` (see [`InfoEmail-Mailbox.md`](./InfoEmail-Mailbox.md)).

---

## 5. Done checklist

- [ ] Vercel Git connected to **`Roundtable-Design/slj`**; production deploy succeeds  
- [ ] Sentry project `slj` + DSN on Vercel Production  
- [ ] Production redeploy after Sentry env vars  
- [ ] Better Stack monitors for `/api/health` + homepage  
- [ ] Louis receives a test downtime / alert on his phone  
- [ ] Web Analytics enabled on the Vercel project  
- [ ] Mailchimp SLJ CTAs updated with **UTM** query params  
- [ ] Louis knows: weekly story = Mailchimp reports + Vercel path views (not an auto email funnel yet)

Ping Louis when the checklist is green.

---

## Links

- Production: https://slj.talksfromthewarehouse.co.uk  
- Health: https://slj.talksfromthewarehouse.co.uk/api/health  
- Repo: https://github.com/Roundtable-Design/slj  
- Setup script: `scripts/setup-monitoring.ts`  
- Full stack notes: [`Monitoring.md`](./Monitoring.md)  
- `info@` mailbox: [`InfoEmail-Mailbox.md`](./InfoEmail-Mailbox.md)
