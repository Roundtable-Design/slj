# James sign-off (15 Jul 2026) + production maturity plan

> **Agent entry point:** [agent-handoff-jul-2026.md](../agent-handoff-jul-2026.md) — what shipped, what's deferred, commands, key files.

James confirmed the digital course is **ready to go** on the 15 Jul call. This plan covers:

1. **Immediate edits** from that call (ship + test + deploy)
2. **Production hardening** so future changes are safe
3. **Deferred launch work** (Talks from the Warehouse distribution) — back burner

**Production:** https://slj.talksfromthewarehouse.co.uk

---

## Part 1 — James edits ✅ shipped (`3369b3c`)

James walked through the site and found **five fixes**. One item was discussed and **explicitly left as-is**.

### 1.1 Content & copy fixes

| # | Location | Issue | Fix |
|---|----------|-------|-----|
| 1 | **Reviews** (`content/course/05-reviews.md`) | “…spoke very powerfully to me **in an** issue…” | Change to **“on an issue”** |
| 2 | **Session Three — Time** (`content/course/13-session-three.md`) | *Cat’s in the Cradle* lyrics use `>>` (left/right column) | Change to `::` (centered poem), matching the “Be still and know” poem below |
| 3 | **Worksheet 1A** (`components/worksheets/BudgetingMoneyAuditWorksheet.tsx`) | “After the **example above**…” but Mrs R. E. Joyce example is **below** | Change to **“After reading the example below…”** (or similar) |
| 4 | **Session Nine — Saving & Insurance** (`content/course/25-session-nine.md`) | Errant `'` after “surplus given away” | Remove stray closing quote → `…surplus given away.` |
| 5 | **Footnote [2] “Cited in” link** (Introduction) | James could not follow reverse link on his machine | Fixed: display title **Introduction**, `saveCitationScrollTarget` on click |

### 1.2 Explicitly not changing

| Location | Issue | Decision |
|----------|-------|----------|
| **Work — Reading** (capitalism paragraph, big justified gaps) | Justified text creates uneven word spacing | **Leave as-is** — James accepted after explanation |

### 1.3 Implementation steps (one focused session)

```bash
# 1. Edit markdown + worksheet component (see table above)
# 2. Regenerate manifest (block IDs may change if poem syntax changes)
pnpm run generate-manifest

# 3. Content checks
pnpm lint:content
pnpm tsx scripts/check-footnote-links.ts

# 4. Full quality gate
pnpm lint && pnpm typecheck && pnpm test

# 5. E2e (includes James review suite)
PLAYWRIGHT_PORT=3010 pnpm test:e2e

# 6. Commit (scoped message), push main → Vercel production
```

### 1.4 Tests to add with these edits

Add to `e2e/james-jul-2026-review.spec.ts` (or new `e2e/james-signoff-2026-07.spec.ts`):

- [x] Reviews page contains “on an issue” (not “in an issue”)
- [x] Session Three *Cat’s in the Cradle* block has `text-center` (centered poem class)
- [x] Worksheet 1A print view contains “example below” (not “example above”)
- [x] Session Nine Saving paragraph: “surplus given away.” without stray quote before period
- [x] References → note [2] → “Cited in” link → Introduction loads with correct anchor

Unit/content (optional, fast):

- [ ] `scripts/lint-content.ts` or small test: no `in an issue` in reviews markdown
- [ ] Snapshot or regex on manifest block for session nine paragraph

### 1.5 Manual smoke after deploy (~10 min)

- [ ] Reviews typo fixed on production
- [ ] Cat’s in the Cradle centered in Session Three
- [ ] Worksheet 1A wording correct in print preview
- [ ] Session Nine quote mark gone
- [ ] Footnote [2] cited-in round trip (James’s path)

---

## Part 2 — Production maturity ✅ shipped (M5 optional)

Goal: **any future edit** (content or code) goes through automated gates so James/Louis can change things without regressions.

### 2.1 Current test inventory

| Layer | What exists | Gap |
|-------|-------------|-----|
| **Unit** | Jest: footnotes, progress, worksheets, smoke, footnote-citations | — |
| **Content scripts** | `lint:content`, `check-footnote-links.ts` | In CI via `pnpm test:content` |
| **E2e** | 45 Playwright tests across James review, sign-off, journeys | Notes CRUD, groups journeys still optional |
| **CI** | `.github/workflows/ci.yml` | Enable branch protection on GitHub if desired |

### 2.2 Target architecture

```
PR / push to main
    │
    ├─ lint + typecheck + unit tests          (~2 min)
    ├─ generate-manifest + content scripts    (~1 min)
    ├─ next build                             (~3 min)
    └─ Playwright e2e (smoke + James suites)  (~5 min)
           │
           └─ deploy to Vercel (production on main only)
```

### 2.3 Phase M1 — CI baseline (priority)

**Deliverable:** `.github/workflows/ci.yml`

- Trigger: PR + push to `main`
- Node 22, pnpm cache
- Steps: `pnpm i` → lint → typecheck → test → `pnpm run generate-manifest` → `git diff --exit-code content/manifest.json` (fail if manifest not committed) → `pnpm lint:content` → `pnpm tsx scripts/check-footnote-links.ts` → `pnpm build`
- Playwright: install chromium, run `pnpm test:e2e` with `NEXT_PUBLIC_PLAYWRIGHT_E2E` / placeholder Supabase (existing pattern)
- **Branch protection:** require CI green before merge (GitHub settings)

**Acceptance:** A deliberate break (typo in footnote link) fails CI.

### 2.4 Phase M2 — E2e journey coverage

Organise specs by **user journey**, not only James review snapshots:

| Spec file | Journeys |
|-----------|----------|
| `e2e/auth-smoke.spec.ts` | Landing → sign-in form → (mock or test account if available) |
| `e2e/reader-navigation.spec.ts` | Sidebar chapters, prev/next top+bottom, footnote → references → return |
| `e2e/search.spec.ts` | Sidebar → `/search` autofocus, results metadata, visited colour, back-to-result |
| `e2e/worksheets.spec.ts` | Open worksheet, print route loads, back to course |
| `e2e/james-*.spec.ts` | Editorial/regression snapshots (keep existing) |

**Principles:**

- Prefer **behaviour assertions** over brittle full-page screenshots where possible
- Keep visual snapshots for layout regressions (foreword, session one reader)
- One shared `e2e/fixtures.ts` for base URL and common navigation helpers

**Acceptance:** Core V1 outcomes from `AGENTS.md` each have at least one automated e2e path.

### 2.5 Phase M3 — Content pipeline guardrails

- [ ] CI fails if `content/course/*.md` changed but `manifest.json` not regenerated
- [ ] Add `pnpm test:content` script wrapping `lint:content` + `check-footnote-links`
- [ ] Document in `docs/ContentWorkflow.md`: edit md → generate-manifest → commit both
- [ ] Optional: unit test for `buildCourseSearchIndex()` hit count / spot keywords (“Micah”, “money”)

### 2.6 Phase M4 — Release & monitoring

- [ ] Update `docs/ReleaseChecklist.md` with post-deploy smoke URLs (from James checklists)
- [ ] Vercel: enable deployment notifications (Slack/email)
- [ ] Supabase: confirm auth redirect URLs for production domain
- [ ] Keep `docs/James-Review-Checklist-Round2.md` as manual **gold path** quarterly or before major content drops

### 2.7 Phase M5 — RLS & data (later, optional)

From `docs/Testing.md` “later hardening”:

- Supabase local / policy tests for notes, progress, groups
- Not blocking V1 launch; schedule when groups feature is actively used

### 2.8 Suggested order & effort

| Phase | Effort | When |
|-------|--------|------|
| **Part 1** James edits + deploy | ~2–3 hours | **Next session** |
| **M1** CI | ~2 hours | Same session or immediately after |
| **M2** E2e journeys | ~1 day | Before next content batch |
| **M3** Content guardrails | ~2 hours | With M1 |
| **M4** Release docs | ~1 hour | After first CI green deploy |
| **M5** RLS tests | ~1 day | When capacity allows |

---

## Part 3 — Launch & distribution

**Access model decided (Aug 2026):** open straight link from Talks from the Warehouse (no barrier).

Canonical checklist + Inka draft: **[T9-Public-Launch.md](T9-Public-Launch.md)**. Track in `docs/Tasks.md` under **T9**.

- [ ] **TFW toast:** “Simplicity, Love and Justice, a 10-week study course, is now digital.” → SLJ (keep ~6 months)
- [ ] **TFW header menu:** Simplicity Love & Justice → SLJ (permanent)
- [ ] **TFW:** remove “coming shortly” / taster
- [x] **SLJ:** print version note + mailto `info@talksfromthewarehouse.co.uk` on login/landing
- [ ] **`info@` routing:** confirm mailbox owners; use as replyable From for course email where possible
- [ ] **Email:** MailChimp to subscriber list (James copy) after TFW banner live
- [ ] **Louis pilot group:** target Sep/Oct/Dec small group run-through
- [ ] **Analytics:** optional — who signed in (Supabase auth logs); no note content logging

**Owner:** Louis + James; Inka for WordPress.

---

## Part 4 — Resume checklist

When picking the project back up:

1. [ ] Complete **Part 1** edits + tests + deploy
2. [ ] Send James one-line confirmation: “Your five points are live”
3. [ ] Implement **M1 CI** before any other feature work
4. [ ] Split **M2** e2e specs across 2–3 PRs if helpful
5. [ ] Leave **Part 3** until James confirms launch approach

---

## Related docs

- [James-Review-Checklist-Round2.md](../James-Review-Checklist-Round2.md) — manual regression gold path
- [James-Next-Meeting-Prep.md](../James-Next-Meeting-Prep.md) — footnote [56] Stuart Murray (still deferred)
- [Testing.md](../Testing.md) — update when M1–M3 land
- [ReleaseChecklist.md](../ReleaseChecklist.md) — production deploy steps
- [Tasks.md](../Tasks.md) — add T9 launch deferred + M1–M5 maturity tasks
