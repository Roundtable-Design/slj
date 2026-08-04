# Tasks — V1 Implementation Plan

> Keep tasks small. Tick acceptance criteria. Avoid feature creep.

## T0 — Scaffold & basic tooling
- [x] Create Next.js App Router + TypeScript + Tailwind
- [x] Add scripts: lint/typecheck/test/build
- [x] Add `.env.example`
### Acceptance criteria
- [x] `pnpm dev` runs
- [x] `pnpm lint` passes
- [x] `pnpm typecheck` passes

## T1 — Supabase setup (Auth + tables + RLS)
- [x] Enable Supabase Auth: email sign-in
- [x] Create tables: profiles, notes, progress, groups, group_members
- [x] Enable RLS + policies for each table
### Acceptance criteria
- [x] User can sign in via email code
- [x] User can only read/write their own notes + progress
- [x] Group content only visible to group members

## T2 — Content pipeline (Markdown → manifest → stable block IDs)
- [x] Store chapters in `content/course/*.md`
- [x] Script generates `content/manifest.json` with stable IDs per block
- [x] Content loader exposes: chapters → sections → blocks
### Acceptance criteria
- [x] Each paragraph/heading renders with `data-block-id`
- [x] IDs stable across builds unless text changes
- [x] Links can target blocks via `#block-id`

## T3 — Course reader UI (App Shell)
- [x] App shell with collapsible left nav (desktop), drawer nav (mobile)
- [x] Reader: desktop 2-column (content left, notes right)
- [x] Mobile: notes drawer/bottom sheet
- [x] Table of contents + prev/next
### Acceptance criteria
- [x] Reader is calm/typography-first, minimal UI
- [x] Navigation does not lose reading context

#### T3 CHECKPOINT
- **Summary:** App shell with collapsible left nav (desktop) and drawer (mobile); reader shows Chapter 1 with block IDs; notes panel (desktop) and notes drawer (mobile) placeholders; Cormorant Garamond for content, design-system colors only; placeholder routes `/course`, `/worksheets`, `/groups`, `/progress`.
- **How to run:** `pnpm dev` → open `/course` for the reader; use left nav for Course, Worksheets, Groups, Progress; desktop: use collapse arrow to narrow the nav; mobile: use ☰ to open drawer; on `/course` mobile, use “Notes” button for notes drawer placeholder.
- **Files changed:** `app/layout.tsx`, `tailwind.config.ts`, `app/globals.css`, `app/(app)/layout.tsx`, `components/AppNav.tsx`, `components/NotesDrawerPlaceholder.tsx`, `app/(app)/course/page.tsx`, `app/(app)/worksheets/page.tsx`, `app/(app)/groups/page.tsx`, `app/(app)/progress/page.tsx`, `app/page.tsx`; removed `app/(course)/*`, `app/(worksheets)/*`, `app/(groups)/*`.
- **Next:** Run T4 (private margin notes CRUD).

## T4 — Private margin notes (CRUD)
- [x] Add/edit/delete notes for `block_id`
- [x] Notes list for current chapter/section
### Acceptance criteria
- [x] Notes persist and reload
- [x] Notes anchored to correct blocks
- [x] RLS prevents cross-user access

#### T4 CHECKPOINT
- **Summary:** Notes CRUD (create via “Add note for this paragraph” on each block; edit/delete in notes panel). Notes panel (desktop) and notes drawer (mobile) show notes for the current chapter; RLS enforces private notes; persistence via Supabase.
- **How to test:** (1) Sign in with an emailed code. (2) Open `/course`. (3) Click “Add note for this paragraph” on a paragraph; note appears in the right panel (desktop) or open “Notes” drawer (mobile). (4) Edit note text and blur; refresh page — note persists. (5) Delete a note via “Delete note”; refresh — note is gone. (6) Sign out; panel shows “Sign in to add notes.”
- **Files changed:** `lib/notes.ts` (new), `components/NotesPanelContent.tsx` (new), `components/CourseReader.tsx` (new), `app/(app)/course/page.tsx` (uses CourseReader, blockIds, blockIdToLabel), `components/NotesDrawerPlaceholder.tsx` (removed), `docs/Tasks.md`.
- **Next:** Run T5.

## T5 — Progress tracking
- [x] Manual “mark section complete”
- [x] Store last-read position (chapter + block) or section
- [x] Simple progress summary page
- [x] Completion is chapter-only in the UI (section completion is not shown or used)
### Acceptance criteria
- [x] Progress persists
- [x] Resume reading works

#### T5 CHECKPOINT
- **Summary:** Progress table wired end-to-end: manual “Mark complete” per section in reader TOC; last-read stored on chapter open and on note add; `/course` redirects to last-read or first chapter; `/course/[chapterId]` dynamic route; Progress page shows completion by chapter/section and “Resume reading” link; RLS keeps progress private.
- **How to test:** (1) Sign in. (2) Open Course (or click Resume); you are redirected to first chapter. (3) In “In this chapter”, click “Mark complete” on a section; refresh Progress page — section shows “Complete”. (4) Add a note on a paragraph; click “Resume” in nav or open `/course` — you are taken to that chapter and block. (5) Sign out; Progress page shows “Sign in to view your progress.”
- **Files changed:** `lib/progress.ts` (new), `lib/progress-actions.ts` (new), `app/(app)/course/page.tsx`, `app/(app)/course/[chapterId]/page.tsx` (new), `components/CourseReader.tsx`, `app/(app)/progress/page.tsx`, `docs/Tasks.md`.
- **Next:** Run T6.

### View all chapters + Progress/Worksheets design (Stitch)
- [x] Full-book view at `/course/all` with TOC and notes
- [x] Shared block components (`BlockContent.tsx`), `FullBookReader`, nav link “All chapters”
- [x] Progress page redesigned to match Stitch (percentage, progress bar, sidebar resume/stats, curriculum cards)
- [x] Worksheets page redesigned to match Stitch (header, resource list, print hint); placeholder worksheet list and `/worksheets/print/[id]` until T6

## T6 — Worksheets (print-only)
- [x] Store worksheet definitions in `content/worksheets`
- [x] Worksheet view + dedicated `/print` route (no app shell)
- [x] Print CSS: page breaks, margins, no UI chrome
### Acceptance criteria
- [ ] Prints well in Chrome + Safari
- [x] Tables have writing space

## T7 — Groups (minimal)
- [x] Create group
- [x] Join group via code/link
- [x] Group home shows:
  - start date
  - shared “group notes” text block editable by any member
### Acceptance criteria
- [x] Only members can view/edit group details
- [x] No private notes are shared in group

#### T7 CHECKPOINT
- **Summary:** Create group (name + start date; invite_code generated); join via invite code or invite link (`/groups/join?code=X`); group home shows start date and shared notes textarea with debounced autosave; RLS restricts view/edit to members only; private notes are never shown on group pages.
- **How to test manually (2 users):** (1) User A: sign in, go to Groups, create a group (name + optional start date), open the group and copy the invite link or code. (2) User B: open the invite link (or go to Groups, paste code, Join). Sign in if prompted, then land on the group home. (3) Both users: confirm start date matches; edit shared notes, wait for “Saved”; refresh and confirm the other’s text appears. (4) As a non-member (or logged out), open a group URL directly — should redirect to `/groups` or sign-in.
- **Files changed:** `supabase/migrations/20250218100000_join_group_by_invite_code.sql`, `lib/groups.ts`, `app/(app)/groups/page.tsx`, `app/(app)/groups/join/page.tsx`, `app/(app)/groups/[groupId]/page.tsx`, `components/GroupsListContent.tsx`, `components/JoinGroupByCode.tsx`, `components/GroupSharedNotesEditor.tsx`, `components/CopyInviteLinkClient.tsx`, `docs/Tasks.md`.
- **Next:** Run T8.

## T8 — Deploy (draft)
- [ ] GitHub repo
- [ ] Vercel deploy
- [ ] Production domain configured
- [ ] Supabase redirect URLs include production domain
### Acceptance criteria
- [ ] Sign in works on production
- [ ] Reader works on production

#### T8 CHECKPOINT
- **Commands that must pass:** `pnpm lint`, `pnpm typecheck`, `pnpm build`
- **Env vars required:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (set in Vercel for production)
- **Files changed:** `.env.example`, `docs/ReleaseChecklist.md`, `README.md`, `docs/Tasks.md`
- **Next:** Deployment (GitHub repo, Vercel deploy, production domain, Supabase Site URL + Redirect URLs configured, smoke test)

## Upgrade tasks (later, “production hardening”)
- [ ] CI (GitHub Actions): lint/typecheck/test
- [ ] RLS policy tests with Supabase tools/emulator
- [ ] Basic analytics/reporting dashboard (optional)

## James Jul 2026 sign-off (15 Jul call)

James approved the course for release. See **[plans/James-Signoff-And-Maturity-Plan.md](plans/James-Signoff-And-Maturity-Plan.md)**.

- [x] Reviews: “in an issue” → “on an issue”
- [x] Session Three: Cat’s in the Cradle centered (`::` not `>>`)
- [x] Worksheet 1A: “After reading the example below…”
- [x] Session Nine: remove errant quote after “surplus given away”
- [x] Footnote [2] “Cited in” link: display title “Introduction” + reliable hash scroll
- [x] E2e assertions for sign-off fixes; deployed to production

## T9 — Public launch

Access model decided: **open link from Talks from the Warehouse**. Full plan: [plans/T9-Public-Launch.md](plans/T9-Public-Launch.md).

- [ ] TFW toast banner (copy: “Simplicity, Love and Justice, a 10-week study course, is now digital.”) — Inka / WordPress
- [ ] TFW header menu item → SLJ — Inka / WordPress
- [ ] Remove TFW “coming shortly” / taster copy
- [x] SLJ login + landing: print version available + mailto `info@talksfromthewarehouse.co.uk`
- [ ] Confirm who receives `info@` (Rackspace / emailsrvr); Louis + James can read print requests
- [ ] Send course auth/invite email from `info@` (or replyable address into that inbox) via Supabase custom SMTP
- [ ] MailChimp announcement to subscriber list (James copy)
- [ ] After ~6 months: remove TFW toast only; keep header menu (TARS reminder due 2027-02-04)

See [plans/James-Signoff-And-Maturity-Plan.md](plans/James-Signoff-And-Maturity-Plan.md) Part 3.

## Production maturity (M1–M5)

- [x] M1: GitHub Actions CI (lint, typecheck, test, build, content scripts, e2e)
- [x] M2: E2e specs by user journey (auth, reader, search, worksheets)
- [x] M3: Manifest drift check in CI
- [x] M4: Release checklist + testing docs updated
- [ ] M5: RLS policy tests (optional)

See [plans/James-Signoff-And-Maturity-Plan.md](plans/James-Signoff-And-Maturity-Plan.md) Part 2.

## Draft 2 — Readability, navigation, notes UX polish
- [x] Auth UX: magic-link copy + explicit "check email" state + resend action + OTP entry (Supabase email token)
- [x] Auth recovery for invalid/expired link with clear resend path
- [x] Light mode readability pass (stronger contrast, heavier UI text, white surfaces)
- [x] Notes UX polish ("Notes" naming, clearer icon affordance, narrower notes panel)
- [x] Session signposts: front matter grouping on dashboard + prev/next controls in reader
- [x] Worksheets back behavior points to dashboard (not session one)
- [x] Quote and Bible verse visual treatment + adjacent duplicate quote guardrail
- [x] Content maintenance guardrails documented + content lint script
- [x] James Odgers feedback (Apr 2025): narrower notes column, note panel scroll after save, duplicate chapter titles (static + full book), Further reading section band, Session 1 worksheet link + Things to Change markdown repair, worksheet print styling, minimal `[text](url)` in course paragraphs, Playwright e2e smoke (`pnpm test:e2e`)
- [x] Margin notes layout — notes beside paragraphs (not sidebar): see [plans/margin-notes-layout.md](plans/margin-notes-layout.md) (Phases A–D)

## James May 2026 review (James Odgers)

- [x] End-of-book notes chapter (`28-notes.md`) + `[n]` hyperlinks in reader
- [x] Static chapter reading measure (`max-w-[72ch]` on foreword, intro, etc.)
- [x] Introduction: private margin notes how-to
- [x] Budgeting worksheet: Mrs R. E. Joyce example heading
- [x] Remove empty `08-further-reading-and-resources.md` stub; docs/index updated
- [x] E2e smoke: foreword h1, intro further reading, footnote link, Joyce heading
- [x] Spot-check script: [James-May-2026-SpotCheck.md](James-May-2026-SpotCheck.md)
