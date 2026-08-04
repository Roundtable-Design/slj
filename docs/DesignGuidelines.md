# Design Guidelines — Calm, editorial, app-like where needed

This app should *feel like* Talks From The Warehouse: editorial, spacious, typography-led — but with standard web-app navigation patterns.

## Non-negotiables (agents must follow)
1) **App Shell layout**: left nav + main content (+ right notes panel on reader).
2) **Collapsible left nav** on desktop; drawer nav on mobile.
3) **Serif for content, sans for UI** (no exceptions).
4) **Only 3 base colors**: `#000`, `#fff`, `#E5E7EB` plus opacity variants of black. Do not introduce new hex colors.
5) Prefer borders/spacing over shadows/gradients.

## Brand tokens

### Fonts
- **Serif (reading/brand):** `Cormorant Garamond`
- **Sans (UI):** `ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"`

Usage rules:
- Course content body: serif
- Course content headings: serif
- Navigation, buttons, labels, forms, meta text: sans
- Do not mix fonts within the same component unless it’s content inside the reader.

### Colors (strict)
Base colors (the only hex codes allowed):
- Text: `#000`
- Background: `#fff`
- Border/separators: `#E5E7EB`

Allowed derived values (from black via opacity only):
- Muted text: `rgba(0,0,0,0.65)`
- Secondary muted: `rgba(0,0,0,0.45)`
- Hover background: `rgba(0,0,0,0.04)`
- Active background: `rgba(0,0,0,0.06)`
- Focus ring/outline: `rgba(0,0,0,0.30)`

Disallowed:
- Any additional brand/accent colors
- Gradients
- Heavy shadows

## Layout system (standard UI shell)

### App Shell (required)
Desktop:
- **Left:** collapsible side nav
- **Center:** main content
- **Right (reader only):** margin notes panel (fixed width)

Mobile:
- Side nav becomes a drawer
- Notes become a bottom sheet or right drawer

### Side nav (collapsible) — required behavior
Structure:
- Top: course title + “Resume”
- Nav: Course, Worksheets, Groups, Progress
- Footer: account + sign out

Behavior:
- Default expanded on desktop
- Collapse to a narrow rail (icons optional; tooltips required if icons are used)
- Persist collapsed state (localStorage)
- Mobile uses drawer; do not implement “collapsed rail” on mobile

Styling rules:
- Background remains `#fff`
- Use borders (`#E5E7EB`) to separate nav from content
- Active item uses subtle indicator (left border, underline, or weight), not color

## Reader layout (the core experience)
- Reading width: **65ch** (within the 60–75ch / ~50–75 character best-practice band; 65–66ch is the usual editorial target)
- Line height: **1.7** for body text
- Paragraph spacing: generous (16–20px)
- Content column: centered, `max-w-prose` style (`65ch`)
- Notes: beside the measure when present; under ~⅓ viewport width

## Notes UX rules
- Notes must feel like margin notes:
  - adjacent to the relevant passage
  - minimal chrome
  - clear anchor reference
- Mobile: one “Notes” affordance opens a bottom sheet showing notes for the current section.

## Component principles (durable)
- Buttons: minimal; one primary style (black bg, white text) used sparingly
- Inputs: border + clear focus state
- Panels: border + padding; avoid heavy shadows
- Links: underline on hover; keep defaults simple

## Print rules (worksheets)
- Print routes are separate from app shell
- No navigation, no notes panel, no UI chrome in print views
- Control margins and page breaks with `@media print`
- Tables provide ample writing space

## “No UI drift” enforcement
- Do not introduce a new component style ad-hoc.
- If a new pattern is needed, update this doc first.
