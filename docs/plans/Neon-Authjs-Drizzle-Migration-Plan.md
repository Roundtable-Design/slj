# Plan: Migrate SLJ off Supabase → Neon + Auth.js + Drizzle

**Status:** Draft for evaluation (not approved to implement)  
**Date:** 28 Jul 2026  
**Author:** Agent draft for Louis  
**Current production DB/Auth:** Supabase project `slj` (`mlbmjrgykjjwhellmtpz`, `eu-west-1`)  
**App host:** Vercel (`roundtable-supports-projects/slj`) → `slj.talksfromthewarehouse.co.uk`

---

## 1. Decision you are evaluating

Replace Supabase (Auth + Postgres + RLS + PostgREST client) with:

| Layer | Choice | Why |
|--------|--------|-----|
| Postgres | **Neon** (Vercel Marketplace, `eu-central-1` or `eu-west-2`) | No week-long free-tier project pause; wakes on query; fits Vercel |
| Auth | **Auth.js (NextAuth v5)** email magic link | Same UX as today (email code/link); lives in the Next app; no second vendor for identity |
| Email delivery | **Resend** (Auth.js provider) | Transactional magic-link mail; keep branding control |
| ORM / SQL | **Drizzle** + `postgres` (or `@neondatabase/serverless`) | Boring, typed, migrations in-repo; no PostgREST |
| Authz | **Server-side session checks** (not DB RLS) | All data access moves behind server actions / route handlers |

**Out of scope for this plan:** CMS, quizzes, Realtime, Storage, Edge Functions (unused today).

---

## 2. Why this is not an env-var swap

Today Auth and DB are one Supabase project:

- FKs and triggers target `auth.users`
- RLS / RPCs use `auth.uid()`
- Browser calls `supabase.from("notes"|…)` and `supabase.rpc("join_group_by_invite_code")`
- Middleware refreshes Supabase cookies via `@supabase/ssr`
- Account delete uses `SUPABASE_SERVICE_ROLE_KEY` → Auth Admin API

Neon is Postgres only. Keeping Supabase Auth + Neon DB (hybrid) is explicitly **rejected** here: user sync, dual vendors, and broken RLS/`auth.uid()` make it worse than either full migrate or stay-on-Supabase-Pro.

---

## 3. Target architecture (after)

```
Browser  →  Next.js (Vercel)
              ├─ Auth.js session (HTTP-only cookie)
              ├─ Server Actions / Route Handlers
              │     └─ Drizzle → Neon Postgres (pooled)
              └─ Markdown content (unchanged, in repo)
```

**Hard rule:** No browser → database. Notes, progress, and groups only mutate via server code that already knows `session.user.id`.

### Schema (semantic parity)

Keep the same tables; re-home identity:

| Object | Change |
|--------|--------|
| `profiles` | PK = Auth.js user id (UUID). Populate on first successful sign-in (no `auth.users` trigger). |
| `notes`, `progress`, `chapter_progress`, `group_members` | FK → `profiles(id)` (or `users`) with `ON DELETE CASCADE` |
| `groups.created_by` | FK → `profiles` with `ON DELETE RESTRICT` (same as today) |
| `group_member_role` enum | Keep |
| `join_group_by_invite_code` | **Drop RPC**; reimplement as server action |
| RLS policies | **Drop** (or leave unused); enforcement in app |
| Auth.js tables | Add `accounts`, `sessions`, `verification_tokens` (Drizzle Auth.js adapter schema) *or* JWT session strategy with minimal DB (prefer **database sessions** for easy revoke on account delete) |

**User id continuity (critical):** Export Supabase `auth.users.id` UUIDs and reuse them as Auth.js / `profiles.id` so notes, progress, and group membership stay attached with **no remap**.

---

## 4. What stays the same vs what changes

### Unchanged (product)

- Course Markdown + manifest + worksheets
- Reader UX (margin notes beside blocks, progress, groups)
- Domain, Vercel project, branding
- “Private notes” product rule (enforced in server code + never log note bodies)

### Changed (engineering)

| Area | Today | After |
|------|--------|--------|
| Sign-in | `signInWithOtp` / `verifyOtp` | Auth.js email magic link (+ optional 6-digit code if we keep parity UX) |
| Session gate | `middleware.ts` + Supabase `getUser()` | Auth.js middleware / `auth()` |
| Notes / progress / groups | Client Supabase SDK | Server actions calling Drizzle |
| Email change | `supabase.auth.updateUser` | Auth.js email-update flow (or “sign in with new email + merge” — decide in Phase 0) |
| Delete account | Service-role `deleteUser` | Transaction: delete app rows + Auth.js user/session rows |
| Migrations | `supabase/migrations/*.sql` + `pnpm db:push` | `drizzle/` migrations + `pnpm db:migrate` |
| Env | `NEXT_PUBLIC_SUPABASE_*` | `DATABASE_URL`, `AUTH_SECRET`, `AUTH_URL`, Resend key; **no** public DB URL |

### Files that must be rewritten or deleted (inventory)

**Auth / session**

- `middleware.ts`
- `components/SignInForm.tsx`
- `app/(auth)/auth/sign-in/page.tsx`
- `app/(auth)/auth/callback/route.ts`
- `app/(auth)/auth/sign-out/route.ts`
- `app/(app)/preferences/actions.ts` (+ preferences UI)
- `lib/supabase/client.ts`, `server.ts`, `admin.ts` → remove
- `docs/AuthEmailBranding.md` → replace with Resend + Auth.js template docs

**Data**

- `lib/notes.ts`, `lib/progress.ts`, `lib/progress-actions.ts`, `lib/groups.ts`
- Call sites: `CourseReader.tsx`, `FullBookReader.tsx`, group components/pages, `ProgressDashboard.tsx`, app layout / home `getUser()` usages

**Ops / CI**

- `.env.example`, `docs/DEPLOYMENT.md`, `AGENTS.md` stack section
- `.github/workflows/ci.yml` env placeholders
- `playwright.config.ts` / e2e auth smoke
- Scripts: `scripts/apply-chapter-progress.sh`, `create-supabase-project.sh`, `update-supabase-email-templates.sh`

---

## 5. Neon plan recommendation (ops)

| Env | Neon tier | Scale-to-zero | Notes |
|-----|-----------|---------------|--------|
| Preview / local | Free OK | On (5 min) | Cold start acceptable |
| Production | **Launch** (or Free if you accept cold start) | **Disable** for Launch | Stops “DB asleep” UX; pay for active compute |

Neon Free still suspends after idle but **auto-wakes** on next query (unlike Supabase Free project pause). For James/course readers, prefer production always-on.

Region: pick one EU region and stick to it (match users; document in DEPLOYMENT).

---

## 6. Phased delivery plan

### Phase 0 — Decisions & freeze (½ day)

Lock before coding:

1. **Auth UX:** magic link only vs magic link + OTP code (today’s form supports both).
2. **Email change:** support in V1 migrate or defer (preferences currently supports it).
3. **Session strategy:** database sessions (recommended) vs JWT.
4. **Neon region + billing:** Free vs Launch for prod.
5. **Maintenance window:** accept ~15–60 min read-only / downtime for cutover, or dual-write (not recommended for this size).
6. **Go / no-go vs Supabase Pro** (see §10).

**Exit:** Written answers in this doc’s “Decision log” (§12).

### Phase 1 — Neon + Drizzle scaffold on a branch (1–2 days)

1. Create Neon project via Vercel Marketplace; attach to `slj`.
2. Add Drizzle schema matching current tables + Auth.js adapter tables.
3. Port SQL from `supabase/migrations/` into one clean Drizzle migration (no `auth.*`, no RLS, no SECURITY DEFINER RPCs).
4. Local `DATABASE_URL` + `drizzle-kit migrate`.
5. Seed script for empty DB smoke test.

**Exit:** Empty Neon DB with correct schema; no production traffic.

### Phase 2 — Auth.js + Resend (1–2 days)

1. Auth.js credentials: `AUTH_SECRET`, Resend API key, from-address (e.g. aligned with Talks branding).
2. Sign-in page: request link → email → callback → session cookie.
3. Middleware protects same routes as today: `/course`, `/worksheets`, `/groups`, `/preferences`, `/progress`, `/search`.
4. Sign-out + “create profile row on first login”.
5. Account delete: cascade app data + destroy sessions.
6. Update e2e auth smoke for new flow (may need test inbox or Auth.js test bypass under `NEXT_PUBLIC_PLAYWRIGHT_E2E`).

**Exit:** Preview deploy: can sign in/out; no data features yet (or stubbed).

### Phase 3 — Data layer behind server actions (2–3 days)

Reimplement with Drizzle, same external behaviour:

| Feature | Server API shape (suggested) |
|---------|------------------------------|
| Notes CRUD | `listNotesForBlocks`, `createNote`, `updateNote`, `deleteNote` |
| Progress | `upsertProgress`, `getChapterProgress`, `upsertChapterProgress` |
| Groups | `listMyGroups`, `createGroup`, `getGroup`, `updateSharedNotes`, `joinByInviteCode` |

Refactor readers to call server actions (or thin `fetch` to route handlers) instead of browser Supabase.

**Authz rules to preserve (test each):**

- Notes/progress: only owning `user_id`
- Groups: only members read/update shared notes; join only via invite code; creator = owner membership
- Never return another user’s notes
- Never log note `body`

**Exit:** Feature-complete on preview URL against Neon (empty or seeded fake data).

### Phase 4 — Data migration rehearsal (½–1 day)

1. `pg_dump` Supabase (schema+data) or CSV export of app tables + `auth.users` (`id`, `email`, timestamps).
2. Transform: strip `auth` schema; load users into Auth.js/`profiles` **keeping UUIDs**; load notes/progress/groups/members.
3. Run rehearsal against a throwaway Neon branch.
4. Verify row counts + spot-check 2–3 known users (if any) and invite codes.

**Exit:** Documented migrate script; rehearsal succeeds twice.

### Phase 5 — Cutover (half day, scheduled)

1. Announce short maintenance (optional banner).
2. Put app in maintenance **or** stop writes (Vercel env kill switch / static page).
3. Final dump from Supabase → Neon.
4. Set production env: `DATABASE_URL`, Auth/Resend secrets; remove Supabase public keys.
5. Deploy; smoke checklist (§8).
6. Keep Supabase project **paused but not deleted** for 7–14 days (rollback source).
7. Monitor Sign-in + note create for 24h.

**Exit:** Production on Neon; Supabase idle backup only.

### Phase 6 — Cleanup (½ day)

- Delete `@supabase/*` deps and `lib/supabase/`
- Update `AGENTS.md`, `Architecture.md`, `DEPLOYMENT.md`, `Tasks.md`, agent handoff
- Remove Supabase MCP reliance from agent docs
- After rollback window: delete Supabase project

---

## 7. Effort & risk (evaluation numbers)

| Item | Estimate |
|------|----------|
| Calendar effort | **~1–1.5 weeks** focused eng (Phases 0–6) |
| Risk level | **Medium** — schema small; Auth + every data call site is the work |
| Highest risks | User-id continuity; email deliverability; e2e auth; preferences email-change parity |
| Lowest risks | Content/worksheets; no Storage/Realtime |

### Failure modes & mitigations

| Failure | Mitigation |
|---------|------------|
| Magic links land in spam | Resend domain auth (SPF/DKIM); test with James’s mailbox before cutover |
| Users lose notes | Preserve UUIDs; rehearsal count checks; hold Supabase 2 weeks |
| Group join broken | Port invite RPC logic 1:1; e2e join-by-code |
| Cold starts on Free Neon | Use Launch + disable scale-to-zero for prod |
| Rollback needed | Re-point Vercel env to Supabase + redeploy previous git SHA (keep branch/tag `pre-neon-cutover`) |

---

## 8. Acceptance criteria (“done with no issues”)

- [ ] Sign-in with email magic link works on production domain
- [ ] Existing migrated users keep notes, progress, chapter completion, group membership
- [ ] New user can sign in, write a margin note, mark chapter complete
- [ ] Group: create, invite code join, edit shared notes (members only)
- [ ] Preferences: sign out; delete account removes data and blocks re-entry of session
- [ ] Email change: either works end-to-end **or** explicitly deferred with UI removed
- [ ] `pnpm lint`, `typecheck`, `test`, `test:e2e`, `build` green
- [ ] No `NEXT_PUBLIC_SUPABASE_*` in Vercel production
- [ ] Note bodies never logged
- [ ] Docs (`AGENTS.md`, `DEPLOYMENT.md`, Architecture) match new stack
- [ ] Supabase retained only as cold backup until rollback window ends

### How to test (cutover day)

1. Magic link to a known address → land on course home  
2. Open an interactive session → add/edit/delete a note  
3. Mark chapter complete → visible on progress  
4. Join or create a group → edit shared notes  
5. Second browser/incognito: confirm notes still private  
6. Delete a throwaway test account → cannot use old session  

---

## 9. Cost sketch (order-of-magnitude)

| Item | Ballpark |
|------|----------|
| Neon Launch (small always-on) | Low tens of $/month depending on compute size |
| Resend | Free tier often enough at this volume; else low tens |
| Auth.js | Free (self-hosted in app) |
| Eng time | Main cost |

Compare to **Supabase Pro** (~$25/mo): zero eng migration, same pause fix. Use §10.

---

## 10. Alternative: stay on Supabase Pro (decision frame)

| | Neon + Auth.js + Drizzle | Supabase Pro |
|--|--------------------------|--------------|
| Stops long pauses | Yes (esp. Launch always-on) | Yes |
| Eng work | ~1–1.5 weeks | Hours (billing) |
| Stack complexity | You own Auth + SQL | Status quo |
| Vendor | Neon + Resend | Supabase |
| Fits AGENTS “boring + durable” | Yes, if executed cleanly | Also yes |
| Future flexibility | Easier raw SQL / Vercel-native | Tied to Supabase Auth+RLS model |

**Recommendation for evaluation:** Choose Neon migrate if you want off Supabase deliberately (pause history, marketplace Postgres, simpler long-term mental model). Choose Pro if the only pain is pausing and James launch timing is soon.

---

## 11. Proposed implementation order (if approved)

1. Phase 0 decision log filled by Louis  
2. Branch `chore/neon-authjs-migrate`  
3. Phases 1–3 on preview  
4. James/Louis QA on preview with seeded or rehearsed data  
5. Phase 4 rehearsal  
6. Tag `pre-neon-cutover` + Phase 5  
7. Phase 6 cleanup PR  

Do **not** mix content/editorial work into this branch.

---

## 12. Decision log (fill before implementation)

| # | Decision | Options | Choice | Date |
|---|----------|---------|--------|------|
| D1 | Proceed with Neon migrate? | Neon / Supabase Pro / defer | | |
| D2 | Prod Neon tier | Free / Launch always-on | | |
| D3 | Auth UX | Link only / link + OTP | | |
| D4 | Email change in V1 | Keep / defer | | |
| D5 | Session strategy | DB sessions / JWT | | |
| D6 | Maintenance window OK? | Yes (duration) / no | | |
| D7 | Cutover owner + date | | | |

---

## 13. Open questions for Louis

1. Any production users beyond smoke tests whose data must survive (approx how many)?  
2. Preferred magic-link from-address / domain (Resend)?  
3. Is preferences **email change** required for James’s cohort, or can it wait?  
4. Hard deadline vs “do it properly after Mailchimp launch”?  

---

## Related docs

- Current deploy: `docs/DEPLOYMENT.md`  
- Stack rules: `AGENTS.md`  
- Handoff: `docs/agent-handoff-jul-2026.md`  
- Schema source: `supabase/migrations/`  
