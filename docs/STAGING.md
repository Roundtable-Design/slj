# Staging — slj.round-table.co.uk

**URL:** https://slj.round-table.co.uk  
**Git branch:** `chore/neon-authjs-migrate` (domain assigned to this branch)  
**Stack:** Neon + Auth.js + Drizzle (not production TFW yet)

## Access

1. Browser prompts for HTTP Basic Auth:
   - User: `slj`
   - Password: see `.staging-secrets.local` (not committed) — `STAGING_BASIC_AUTH_PASSWORD`
2. App sign-in: magic link via Resend, **or** local/staging test sign-in with `AUTH_E2E_SECRET` from `.staging-secrets.local`.

## How to test

```bash
pnpm exec playwright test --config=playwright.staging.config.ts \
  e2e/auth-neon.spec.ts e2e/groups-neon.spec.ts e2e/staging-visual.spec.ts
```

## Notes

- Production `slj.talksfromthewarehouse.co.uk` remains on `main` (Supabase) until cutover.
- Vercel SSO protection was disabled on this project so the custom staging domain is reachable; app-level basic auth gates staging.
- Neon resource: `slj-neon` (Vercel Marketplace).
