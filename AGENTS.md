# AGENTS.md — Simplicity Love & Justice (A Discussion Course)

## Stack (boring + durable)
- Next.js (App Router) + TypeScript
- Neon Postgres + Auth.js (email magic link via Resend) + Drizzle
- Tailwind CSS (minimal, typography-first)
- Hosting: Vercel
- Content: Markdown in repo + stable block IDs

## V1 outcomes
Users can:
- Request a magic link and sign in via email
- Read the course in a clean reader
- Write PRIVATE margin-style notes anchored to paragraphs/blocks (shown beside each paragraph in the reader, not a separate scrollable list)
- Track progress (manual per-section completion)
- Print worksheets (print-only; blank tables for writing)
- Join a group and see:
  - course start date
  - a shared free-text “group notes” block editable by all members

## Non-negotiables
- Notes are private by design and by RLS.
- Keep the system bulletproof for 3+ years:
  - no exotic frameworks
  - minimize dependencies
  - avoid clever architecture
- This is not an LMS. Avoid complex features (quizzes, certificates, grading, etc.).
- Content is developer-driven (Markdown in repo). No CMS UI in V1.

## Commands (pnpm)
- Install: `pnpm i`
- Dev: `pnpm dev`
- Lint: `pnpm lint`
- Typecheck: `pnpm typecheck`
- Test (unit): `pnpm test`
- Test (e2e): `pnpm exec playwright install chromium` once, then `pnpm test:e2e` (starts dev with `NEXT_PUBLIC_PLAYWRIGHT_E2E`; placeholder Supabase URL in Playwright config if env unset — local/CI smoke only).
- Build: `pnpm build`
- Start: `pnpm start`

## Environment variables
Create `.env.local` from `.env.example`.

Required:
- `DATABASE_URL` (Neon pooled)
- `AUTH_SECRET`
- `AUTH_RESEND_KEY` (Resend API key for magic links)

Optional:
- `AUTH_E2E_SECRET` — Credentials test sign-in for local/staging
- `STAGING_BASIC_AUTH_USER` / `STAGING_BASIC_AUTH_PASSWORD` — gate `slj.round-table.co.uk`

## Directory map
- `app/` Next.js routes
  - `(public)/`
  - `(auth)/auth`
  - `(course)/course`
  - `(worksheets)/worksheets`
  - `(groups)/groups`
- `content/`
  - `course/` markdown chapters
  - `worksheets/` print-only worksheet definitions (md or json)
  - `manifest.json` generated stable IDs
- `lib/`
 - `db/` Drizzle schema + client
 - `actions/` server actions for notes/progress/groups
 - `content/` loaders + manifest utilities
- `drizzle/` generated migrations (when using migrate)
- `scripts/` content build scripts
- `docs/` planning + architecture + rules
- `docs/agent-handoff-jul-2026.md` — production state for agents (Jul 2026)
- `docs/plans/Neon-Authjs-Drizzle-Migration-Plan.md` — DB/Auth migration plan
- `.cursor/rules/` scoped rules for agents

## Definition of Done (any task)
- Meets acceptance criteria in `docs/Tasks.md`
- Lint + typecheck pass
- RLS enforced for all tables with user data
- No TODOs left behind
- Docs updated (if architecture/decisions changed)

## PR rules (even if you’re solo)
- Small, task-scoped commits
- Update `docs/Tasks.md` checkboxes
- Include “How to test” steps in PR description

## Security rules
- Validate user input (zod) where applicable
- RLS on all tables containing user data
- Never log note contents
- Do not store course content in DB

## Cursor Cloud specific instructions

### Services overview
This is a single Next.js app with a Supabase cloud backend. There are no Docker containers or local databases to run.

### Environment
- `.env.local` must exist with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Without these the middleware crashes with a 500 on every route. For offline work (lint, typecheck, tests, build) these can be placeholder values; for full auth flow testing, real Supabase project credentials are required via `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` secrets.
- `pnpm install` may warn about ignored build scripts for `esbuild`, `sharp`, and `unrs-resolver`. This is expected and does not affect development — the app runs fine without them.

### Running commands
All commands are documented in the "Commands (pnpm)" section above. Key notes:
- `pnpm lint`, `pnpm typecheck`, and `pnpm test` work offline without Supabase credentials.
- `pnpm build` runs `prebuild` (generates `content/manifest.json` from Markdown files) then `next build`. Works offline.
- `pnpm dev` starts the dev server on port 3000. Requires `.env.local` with at least placeholder Supabase values.
- Protected routes (`/course`, `/worksheets`, `/groups`, `/preferences`, `/progress`) redirect to `/auth/sign-in` when not authenticated. Public routes (`/`, `/auth/sign-in`) work without auth.
