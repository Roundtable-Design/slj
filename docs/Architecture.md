# Architecture (Simple C4)

## Context
A small course platform:
- read course content
- private margin notes
- print worksheets
- minimal groups (start date + shared notes)
- manual progress tracking

## Containers
- Web app: Next.js on Vercel
- DB/Auth: Neon Postgres + Auth.js (Resend magic link) + Drizzle; authz in server actions
- Content: Markdown in repo + build script to generate stable IDs manifest

## Data flow
- Content: server renders Markdown → blocks with stable IDs
- Notes/progress: client calls server actions → Drizzle → Neon (session-scoped)
- Groups: membership-gated shared data (start date + shared notes)

### Chapter mode (interactive vs static)
Each chapter in the manifest has a **mode**: `interactive` (default) or `static`. **Interactive** chapters: block IDs, note anchoring, “In this chapter” TOC, and section/chapter completion UI. **Static** chapters: typographic reading only—no note affordances, no block-level note targets, no progress UI. Reference-only content (front matter, preface, notes, further reading, etc.) is marked static; session chapters are interactive. The renderer branches on `mode` to show or hide note and progress UI.

## Modules
- `content/` source of truth
- `scripts/` generate `content/manifest.json`
- `lib/content/` loaders + ID helpers
- `lib/db/` Drizzle + `lib/actions/` server actions
- `app/(course)` reader pages
- `app/(groups)` group pages
- `app/(worksheets)` worksheets + print routes

## Operational simplicity
No background jobs required for V1.
Later (production hardening): CI + RLS tests + richer analytics if needed.
