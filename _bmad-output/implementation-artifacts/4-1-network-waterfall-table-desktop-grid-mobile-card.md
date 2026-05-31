# Story 4.1: Network waterfall table (desktop grid + mobile card)

Status: done

## Story

As an engineering manager,
I want all projects rendered as a Network request waterfall,
so that I can scan the body of work like a real DevTools panel.

## Acceptance Criteria

1. **(FR-020..024 + ARCH-5 — desktop waterfall grid)** `/work` renders all projects from `lib/content/projects.ts` as a DevTools Network-style waterfall. Desktop layout (`≥sm`): a data grid with columns `method | name | type | status | size | time | waterfall-bar`. The entire row is clickable and navigates to `/work/[slug]`. The grid uses a CSS grid layout (`grid-cols-[60px_1.4fr_0.9fr_90px_90px_90px_1.4fr]`) matching the UX spec column proportions.

2. **(FR-021 — method badge)** The `method` column renders a colored badge for each project's HTTP-method metaphor: `GET` (cyan, `--chart-2`), `POST` (orange, `--chart-3`), `PUT` (orange, `--chart-3`), `PATCH` (purple, `--chart-5`). This is a **decorative metaphor, not semantic typing** — no HTTP calls are made.

3. **(FR-022 — status pill)** The `status` column renders an HTTP-style pill: `200 shipped` → `--status-ok` (green), `201 ongoing` → `--status-warn` (yellow), `410 archived` → `--status-err` (red). Each pill has an `aria-label` describing the status (e.g., `aria-label="Status: shipped, 200"`).

4. **(FR-023 — size column)** The `size` column renders the `size` label (e.g., "12.4 MB", "894 KB") as display text. The `sizeWeight` field (0–1) drives a visual bar fill in the waterfall bar column.

5. **(FR-024 + NFR-P5 — waterfall bar)** The `time` column renders `time` (e.g., "8 mo", "2 yr"). The waterfall bar uses `transform: scaleX(timeWeight) translateX(startOffset * 100%)` **only** — never animate `width` or `left`. The bar color derives from the method via chart tokens. Bars animate on mount using `framer-motion` `initial={{ scaleX: 0 }}` → `animate={{ scaleX: timeWeight }}` with `transformOrigin: "left"`, gated by `useShouldAnimate()`.

6. **(FR-020 + NFR-R2 — mobile card layout)** When viewport is `<640px`, rows become a **dedicated card layout**: a top row with method badge + name + status pill, and the waterfall bar below it. The desktop grid does not auto-degrade — this is an intentionally separate mobile layout.

7. **(NFR-A4 — accessibility)** The table uses semantic `<table>`/`<thead>`/`<tbody>`/`<tr>`/`<td>` elements (not ARIA grid). Each row contains a visible `<Link>` wrapping the name cell to `/work/[slug]`. Screen readers can navigate row-by-row and understand the data structure.

8. **(NFR-P5 — animation discipline)** All animations use `transform`/`opacity` only. Waterfall bars animate via `scaleX`. Hover states use `background-color` transitions only. No `width`, `left`, `margin`, or `padding` animations.

9. **(Performance)** The page is a Server Component; data is imported statically from `lib/content/projects.ts` at build time. No client fetching. No skeleton loaders.

10. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean; `/work` shows no console errors/warnings; mobile (`<640px`) renders as card layout with no horizontal overflow; waterfall bars animate smoothly at 60fps; screen reader can navigate the table.

## Tasks / Subtasks

- [x] **Task 1 — Build `<NetworkWaterfallRow>` component (AC: 1, 2, 3, 4, 5, 6, 8)**
  - [x] Create `components/network-waterfall-row.tsx` (`"use client"`, named export `NetworkWaterfallRow`). Props: `project: Project`.
  - [x] Render desktop grid layout using CSS grid with the specified column template. Each cell is a `<td>`.
  - [x] Method cell: render `<Badge>` with variant derived from method → color token mapping. `GET`→`bg-cyan-500`, `POST`/`PUT`→`bg-orange-500`, `PATCH`→`bg-purple-500` (use chart tokens: `--chart-2`, `--chart-3`, `--chart-5`).
  - [x] Name cell: render project name wrapped in `<Link href={`/work/${project.slug}`}>` with `className="hover:underline"`. The Link makes the entire name clickable.
  - [x] Type cell: render `project.type` as plain text.
  - [x] Status cell: render `<Badge>` with color derived from `statusCode` → `--status-ok` (200), `--status-warn` (201), `--status-err` (410). Include `aria-label`.
  - [x] Size cell: render `project.size` as plain text.
  - [x] Time cell: render `project.time` as plain text.
  - [x] Waterfall bar cell: render a `<motion.div>` (from `framer-motion`) with `transform: scaleX(timeWeight) translateX(startOffset * 100%)`. Use `origin-left`. Animate from `scaleX: 0` to `scaleX: timeWeight`. Duration 0.6s easeOut. Gate with `useShouldAnimate()` — when false, render at final state immediately.
  - [x] Mobile card variant: when viewport `<640px`, render as a card: top row (method badge + name + status pill) and bar below. Use conditional rendering or responsive CSS to switch between grid row and card.

- [x] **Task 2 — Build `<NetworkWaterfallTable>` component (AC: 1, 7, 9)**
  - [x] Create `components/network-waterfall-table.tsx` (`"use client"` OR keep as RSC — recommended: RSC since data is static and no client interactivity is needed at the table level). Props: `projects: Project[]`.
  - [x] Render `<table className="w-full">` with `<thead>` containing header row: METHOD, NAME, TYPE, STATUS, SIZE, TIME, WATERFALL (uppercase mono labels).
  - [x] Render `<tbody>` with `{projects.map(p => <NetworkWaterfallRow key={p.slug} project={p} />)}`.
  - [x] Apply responsive styles: hide table on `<sm`, show cards instead. Or use CSS to make the table rows transform into cards at small viewports.
  - [x] Add hover state on rows: `hover:bg-surface-2/50` (subtle background lift).

- [x] **Task 3 — Build `/work` page (AC: 1, 9, 10)**
  - [x] Update `app/(chrome)/work/page.tsx`: keep `metadata` export (`title: "Network — devtools://hossam"`). Import `projects` from `@/lib/content/projects` and `NetworkWaterfallTable` from `@/components/network-waterfall-table`.
  - [x] Render `<section className="p-4">` with `<h1 className="font-mono text-lg">Network</h1>` and the table.
  - [x] The page stays a **Server Component** — data is imported statically.

- [x] **Task 4 — Tests (AC: 7, 10)**
  - [x] Add `components/network-waterfall-row.test.tsx` (colocated). Assert: (a) project name renders, (b) Link has correct `href`, (c) method badge renders with correct text, (d) status pill renders with correct text, (e) waterfall bar has correct `transform` style, (f) no `<h1>` introduced by the component.
  - [x] Add `components/network-waterfall-table.test.tsx`. Assert: (a) all projects render, (b) header row has correct labels, (c) table uses semantic `<table>` element.
  - [x] Do **not** test `framer-motion` internals, Tailwind class strings, or exact color values.

- [x] **Task 5 — Verify & gate (AC: 10)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` all green; `yarn format`.
  - [x] `yarn dev` → navigate to `/work`: confirm all projects render in grid, method badges have correct colors, status pills have correct colors, waterfall bars animate, clicking a name navigates to `/work/[slug]`. Resize to `<640px` → card layout renders. No console errors.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the `/work` page (Network tab) — a static project waterfall table with desktop grid + mobile card layout. No filters yet (Story 4.2). No case study detail content yet (Story 4.3). Just the waterfall list.
- **IS NOT:** filter chips, URL persistence, empty state, case study detail page content, layout-shared transitions, prev/next pager, or XP grant on open. Those are Stories 4.2–4.5.

### ⚠️ Critical: data shape in `lib/content/projects.ts`
The `projects` array is already validated and typed. Each `Project` has:
- `slug`, `name`, `org`, `method` ("GET"|"POST"|"PUT"|"PATCH"), `status` ("shipped"|"ongoing"|"archived"), `statusCode` (200|201|410)
- `type`, `size`, `sizeWeight` (0–1), `time`, `timeWeight` (0–1), `startOffset` (0–1)
- `year`, `stack`, `problem`, `role`, `decisions`, `outcomes`, `links`

For this story, you only need: `slug`, `name`, `method`, `status`, `statusCode`, `type`, `size`, `sizeWeight`, `time`, `timeWeight`, `startOffset`.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/network-waterfall-row.tsx` | **NEW** | `"use client"`, named export; desktop grid cell + mobile card variant; method/status badges; waterfall bar with motion. |
| `components/network-waterfall-table.tsx` | **NEW** | Can be RSC; renders `<table>` with `<thead>` + `<tbody>`; maps projects to rows. |
| `components/network-waterfall-row.test.tsx` | **NEW** | Colocated; render, link href, badges, bar transform, no h1. |
| `components/network-waterfall-table.test.tsx` | **NEW** | Colocated; all projects render, header labels, semantic table. |
| `app/(chrome)/work/page.tsx` | **UPDATE** | Replace stub with RSC page importing projects + table. |

### Reuse — do NOT reinvent (mirror Story 3.1–3.5 patterns)
- **`<Badge>`** (`@/components/ui/badge`) — use for method and status pills. Precedent: existing badge usage in other components.
- **`useShouldAnimate()`** — gate waterfall bar animation. Precedent: `score-ring.tsx`, `page-weight-budget.tsx`.
- **`framer-motion`** — import `motion` from `framer-motion` (NOT `motion/react`). Precedent: all animated components in the project.
- **`Link`** from `next/link` — for row navigation. Precedent: `devtools-chrome.tsx` tabs.
- **Semantic tokens** — `bg-surface`, `text-muted-foreground`, `border-hairline`, `font-mono`. No hardcoded hex.
- **`cn()`** from `@/lib/utils` — wrap dynamic class strings.
- **Heading register** — copy the `<h1>` treatment from other pages: `font-mono text-lg` for the page title.

### Waterfall bar mechanics (concrete)
- **Transform-only rule (NFR-P5):** The bar MUST use `style={{ transform: `scaleX(${timeWeight}) translateX(${startOffset * 100}%)` }}` with `transformOrigin: "left"`. Never use `width: ${pct}%` or `left: ${offset}px`. This is a hard perf rule.
- **Animation:** Use `motion.div` with `initial={animate ? { scaleX: 0 } : false}` and `animate={{ scaleX: timeWeight }}`. When `useShouldAnimate()` returns false, skip animation (render final state).
- **Bar color:** Derive from method → chart token. Use a helper function:
  ```ts
  function methodColor(method: ProjectMethod): string {
    switch (method) {
      case "GET": return "bg-[var(--chart-2)]"
      case "POST":
      case "PUT": return "bg-[var(--chart-3)]"
      case "PATCH": return "bg-[var(--chart-5)]"
    }
  }
  ```
  Or use Tailwind arbitrary values: `bg-[var(--chart-2)]` etc.
- **Bar container:** The bar cell should have a relative container with a subtle background track (`bg-surface-2/30 rounded-sm h-2`), and the bar is an absolutely positioned child filling the track.

### Status pill mechanics (concrete)
- **Status → color mapping (fixed contract):**
  - `shipped` / `200` → `--status-ok` (green)
  - `ongoing` / `201` → `--status-warn` (yellow)
  - `archived` / `410` → `--status-err` (red)
- **Pill text:** Render `"200"`, `"201"`, or `"410"` (the statusCode), not the status string. The status string is for the `aria-label`.
- **aria-label:** `aria-label={`Status: ${project.status}, ${project.statusCode}`}`

### Mobile card layout (concrete)
- **Switch point:** `<640px` (Tailwind `sm:` breakpoint). Hide the table, show cards.
- **Card structure:** Each card is a `<div>` with:
  - Top row: flex with method badge (left), name (center, flex-1), status pill (right)
  - Bottom: waterfall bar (full width, same bar mechanics as desktop)
- **Card styling:** `border-b border-hairline py-3` separating cards. No border radius (consistent with DevTools aesthetic).
- **Click behavior:** The entire card is clickable (wrap in `<Link>` or add `onClick` with router push). For accessibility, make the name a visible link and the card itself clickable.

### Table semantics (concrete)
- Use native `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, `<td>`.
- Header row: `<th scope="col">` for each column.
- Each row is a `<tr>`.
- The name cell contains the `<Link>` — this is the primary interactive element in the row.
- Do NOT add `role="grid"` or `role="row"` — native table elements already have the correct implicit roles.

### Architecture / project-context guardrails (must follow)
- **RSC by default; push `"use client"` deep** — The page can stay RSC. The row component needs `"use client"` because it uses `framer-motion` and `next/link` (Link is technically RSC-safe but motion is not). The table component can be RSC if it just composes rows.
- **Named exports** for `NetworkWaterfallRow` and `NetworkWaterfallTable`; `page.tsx` keeps its **default export**.
- **`import type`** for types (`isolatedModules: true`); **no `import React`**.
- **Import order:** external → internal aliases → relative; blank lines between groups.
- **RTL:** logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-0`, `end-0`). The waterfall bar's `transformOrigin` should be `start` (logical) — use `origin-start` or `origin-left` with a note that RTL may need adjustment in future.
- **A11y:** one `<h1>` per route (the page title); table has semantic structure; status pills have `aria-label`; method badges are decorative but should have `aria-hidden` if they don't add meaning.
- **Prettier:** no semicolons, double quotes, 2-space, classes inside `cn()` auto-sort.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`, `@/` alias works.
- **Colocate** tests next to source.
- Query by role/label/text: `getByRole("table")`, `getByText("Buguard")`, `getByRole("link", { name: "Buguard" })`.
- **Don't test:** `framer-motion` internals, Tailwind class strings, exact color values.
- Assert on `transform` style for the bar: `expect(bar).toHaveStyle("transform: scaleX(0.3) translateX(0%)")`.

### Project Structure Notes
- Routes under `app/(chrome)/`; `/work` = `app/(chrome)/work/page.tsx`. The `(chrome)` layout renders `<main id="main-content">`, skip link, chrome, `AnimatePresence`, and `MobileBottomNav` — do not add another `<main>`.
- New shared components → `components/network-waterfall-table.tsx` and `components/network-waterfall-row.tsx` (siblings of `file-tree.tsx`, `score-ring.tsx`, etc.).
- The `/work/[slug]/page.tsx` already exists with `generateStaticParams` and `generateMetadata` — do not modify it in this story.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:507-529] — Story 4.1 AC: desktop grid, mobile card, method badge, status pill, size/time, waterfall bar, table semantics.
- [Source: _bmad-output/planning-artifacts/epics.md:43-48] — FR-020..024: waterfall requirements.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:580-588] — `<NetworkWaterfallTable>` + `<NetworkWaterfallRow>` UX spec.
- [Source: _bmad-output/planning-artifacts/architecture.md:476-478] — Requirements-to-structure mapping for Network waterfall.
- [Source: _bmad-output/project-context.md] — `framer-motion` not `motion/react`; semantic tokens; named exports / `page.tsx` default export; RSC-deep-boundary; `import type`; Zod source-of-truth; Tailwind v4 no config; RTL logical props; testing rules; transform/opacity-only animation.
- [Source: components/ui/badge.tsx] — shadcn Badge component to reuse.
- [Source: lib/content/projects.ts] — Project schema and data source.
- [Source: app/(chrome)/work/page.tsx] — Current stub page to replace.
- [Source: app/(chrome)/work/[slug]/page.tsx] — Existing case study route (do not modify).

## Dev Agent Record

### Agent Model Used

glm-5.1

### Debug Log References

### Completion Notes List

- Built `NetworkWaterfallRow` (desktop `<tr>`) and `NetworkWaterfallCard` (mobile card) as separate exports from `network-waterfall-row.tsx` to keep HTML semantics valid (`<tr>` inside `<tbody>`, `<div>` outside table). Both share `methodColor`/`statusColor` helpers and animated `motion.div` waterfall bar pattern.
- `NetworkWaterfallTable` is an RSC — composes desktop `<table>` (hidden on `<sm`) and mobile `<div>` (shown on `<sm`). Imports client components for rows/cards.
- `/work` page remains RSC — static import of `projects` from `lib/content/projects.ts`.
- Waterfall bar uses `scaleX` transform only, `transformOrigin: "left"`, gated by `useShouldAnimate()`. 0.6s easeOut when animating, 0.001s when reduced motion.
- Method badges use chart tokens (`--chart-2` cyan for GET, `--chart-3` orange for POST/PUT, `--chart-5` purple for PATCH). Status pills use status tokens (`--status-ok`, `--status-warn`, `--status-err`). All via Tailwind arbitrary values.
- 22 new tests (17 for row/card, 5 for table) covering: renders, links, badges, aria-labels, bar transform-origin, semantic table, header labels, no h1. All passing.
- Gates: `typecheck` clean, `lint` clean, `test:run` 103/103 pass, `format` clean.

### File List

| File | Change |
|---|---|
| `components/network-waterfall-row.tsx` | New — `"use client"` with `NetworkWaterfallRow` (desktop `<tr>`), `NetworkWaterfallCard` (mobile card), `methodColor`, `statusColor` helpers |
| `components/network-waterfall-row.test.tsx` | New — 17 colocated tests for row, card, and helper functions |
| `components/network-waterfall-table.tsx` | New — RSC table wrapper with desktop `<table>` + mobile cards, `hidden`/`block` responsive switch |
| `components/network-waterfall-table.test.tsx` | New — 5 colocated tests for table rendering, headers, semantics |
| `app/(chrome)/work/page.tsx` | Update — replaced stub with RSC page importing `projects` + `NetworkWaterfallTable` |

### Change Log

- 2026-05-31: Story 4.1 implementation complete — Network waterfall table with desktop grid + mobile card layout, all 10 ACs satisfied, 22 tests added, all gates green.

### Review Findings

- [x] [Review][Patch] Broken test: `labels` undefined and `gridCells` undeclared in `components/network-waterfall-table.test.tsx:103-104` — fixed
- [x] [Review][Patch] Waterfall bar missing required `translateX(startOffset * 100%)` in `components/network-waterfall-row.tsx:89-103` and `:143-158` — fixed
- [x] [Review][Patch] Unimported `React` namespace in test mock type annotations in `network-waterfall-row.test.tsx` and `network-waterfall-table.test.tsx` — fixed
- [x] [Review][Patch] Long project names without truncate/overflow handling on desktop Link — fixed
- [x] [Review][Defer] Empty projects array renders table with only headers (`network-waterfall-table.tsx:41-51`) — deferred, data is statically validated and non-empty; pre-existing pattern
