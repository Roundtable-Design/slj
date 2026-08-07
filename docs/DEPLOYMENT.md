# Deployment checklist — slj.talksfromthewarehouse.co.uk

Deployment-only steps: Git push, Vercel, Supabase Auth, DNS, smoke tests. No feature work.

---

## Done via CLI (already run)

- **Git:** Repo at https://github.com/Roundtable-Design/slj (moved from `louisreid/slj`).
- **Vercel:** Project linked (`roundtable-supports-projects/slj`), domain `slj.talksfromthewarehouse.co.uk` added, production deploy completed. Production URL: https://slj-mu.vercel.app (custom domain works after DNS below).
- **Supabase:** Project **slj** created (ref `mlbmjrgykjjwhellmtpz`), linked, migrations pushed, Vercel env vars set, production redeployed. Dashboard: https://supabase.com/dashboard/project/mlbmjrgykjjwhellmtpz

---

## Manual steps (you)

### 0) Create Supabase project “slj” (CLI)

You have **slj-course** (paused); the app expects a project. Create a new one named **slj** via CLI:

**1. Log in (once):** In your terminal, run and complete the browser flow:

```bash
supabase login
```

**2. Get org ID and create project:**

```bash
# List orgs to get your org-id
supabase orgs list

# Create the project (replace YOUR_ORG_ID and use a strong password)
supabase projects create slj --org-id YOUR_ORG_ID --db-password 'YOUR_DB_PASSWORD' --region eu-west-1
```

Or run the helper script (after logging in):

```bash
./scripts/create-supabase-project.sh
```

It will print the exact `supabase projects create` command with a placeholder for org-id and password.

**3. After creation:** In the Supabase dashboard, open the new **slj** project → **Project Settings → API** and copy the **Project URL** and **anon public** key for Vercel env vars (step A). Then set Auth URLs (step B).

**4. (Optional) Push migrations:** From the repo, `supabase link --project-ref YOUR_PROJECT_REF` then `supabase db push` to apply the migrations in `supabase/migrations/`.

### A) Vercel environment variables

The app needs Supabase at runtime. Add these in **Vercel → Project slj → Settings → Environment Variables** (or run `vercel env add` in the repo for each):

- `NEXT_PUBLIC_SUPABASE_URL` — your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — your Supabase anon key

Then **redeploy** (Vercel dashboard → Deployments → … → Redeploy, or `vercel deploy --prod` from repo).

### B) Supabase Auth URLs

In **Supabase Dashboard → Authentication → URL Configuration**:

- **Site URL:** `https://slj.talksfromthewarehouse.co.uk`
- **Redirect URLs** (add both):
  - `http://localhost:3000/auth/callback`
  - `https://slj.talksfromthewarehouse.co.uk/auth/callback`

Save.

**Email branding (optional):** For custom sign-in-code and confirmation email copy and optional SMTP, see [AuthEmailBranding.md](AuthEmailBranding.md).

### C) DNS (domain owner)

At the DNS provider for **talksfromthewarehouse.co.uk**, add **one** record:

| Type | Name / Host | Value / Target |
|------|-------------|----------------|
| **A** | `slj` | `76.76.21.21` |

- **Name:** subdomain only, e.g. `slj` (some providers show full name `slj.talksfromthewarehouse.co.uk`).
- **Value:** `76.76.21.21` (Vercel’s target for this project).

**Gotchas:**

- This only affects **slj.talksfromthewarehouse.co.uk**. The existing **talksfromthewarehouse.co.uk** (apex) site is unchanged; only the subdomain points to Vercel.
- After saving, wait for DNS propagation (minutes up to 48h). Vercel will verify and issue SSL; you can check under **Vercel → Project → Settings → Domains**.

---

## Reference (original checklist)

### 1) Git — push to GitHub

**1.1** Create a GitHub repo (e.g. `your-org/slj` or `your-username/slj`) if needed. Create it empty (no README).

**1.2** From the project root, add remote and push (replace `YOUR_ORG_OR_USERNAME` with your GitHub org or username):

```bash
git remote add origin https://github.com/YOUR_ORG_OR_USERNAME/slj.git
git push -u origin main
```

Or with SSH:

```bash
git remote add origin git@github.com:YOUR_ORG_OR_USERNAME/slj.git
git push -u origin main
```

**1.3** Confirm `.env.local` and `.next/` are never committed (they are in `.gitignore`).

---

## 2) Vercel — create project and build settings

**2.1** Go to [vercel.com](https://vercel.com), sign in, **Add New → Project**.

**2.2** Import the GitHub repo `slj`. Authorize Vercel for GitHub if prompted.

**2.3** Configure:

| Setting | Value |
|--------|--------|
| **Framework Preset** | Next.js (auto-detected) |
| **Root Directory** | `.` (default) |
| **Build Command** | Leave blank or `pnpm run build` (Vercel uses pnpm when `pnpm-lock.yaml` is present) |
| **Output Directory** | Default (Next.js) |
| **Install Command** | Leave blank or `pnpm install` |

**2.4** Ensure pnpm: repo has `pnpm-lock.yaml`; Vercel will use pnpm automatically.

**2.5** Add environment variables (from `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (e.g. `https://xxxx.supabase.co`)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon/public key

Do **not** add `SUPABASE_SERVICE_ROLE_KEY` for V1.

**2.6** Click **Deploy**. Add custom domain before or after deploy.

---

## 3) Supabase Auth — sign-in URLs

In **Supabase Dashboard → Authentication → URL Configuration** (or **Project Settings → Auth**):

**3.1** **Site URL:** `https://slj.talksfromthewarehouse.co.uk`

**3.2** **Redirect URLs** — add both:

- `http://localhost:3000/auth/callback`
- `https://slj.talksfromthewarehouse.co.uk/auth/callback`

Save.

---

## 4) Custom domain — DNS

**4.1** In Vercel: **Project → Settings → Domains**. Add `slj.talksfromthewarehouse.co.uk`. Note the target Vercel shows.

**4.2** At the DNS provider for `talksfromthewarehouse.co.uk`, add:

- **Type:** `CNAME`
- **Name / Host:** `slj` (subdomain only; some providers show full name)
- **Value / Target:** Use the exact value from Vercel (e.g. `cname.vercel-dns.com` or project-specific CNAME)

**4.3** Wait for DNS propagation (minutes to 48 hours). Vercel shows a check when verified. SSL is provisioned automatically.

**4.4** Gotchas:

- Adding only the `slj` subdomain does **not** change the existing `talksfromthewarehouse.co.uk` (apex) site.
- Only `slj.talksfromthewarehouse.co.uk` points to Vercel; other subdomains and apex keep existing DNS.

---

## 5) Smoke-test checklist (production)

On **https://slj.talksfromthewarehouse.co.uk**:

1. **Sign in via email code** — `/auth/sign-in`, enter email, enter the emailed code, and confirm signed-in state.
2. **Load course reader** — Open course; confirm content loads.
3. **Create note** — Add a private margin note to a block; confirm it saves and appears.
4. **Mark progress** — In an interactive session chapter, click **Mark complete**; confirm it persists after refresh and updates `/progress` (requires `chapter_progress` migration applied).
5. **Print worksheet** — Open worksheets, use browser Print; confirm print-friendly layout.
6. **Join group + edit shared notes** — Join a group, edit shared group notes, save; confirm edits persist (e.g. after refresh).

If auth fails, re-check Supabase **Site URL** and **Redirect URLs**. Check browser console and network tab for other errors.
