# Story 4.3: Statically-generated case-study detail

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an engineering manager,
I want each featured project as a structured case study,
so that I can read the real trade-offs, not a feature list.

## Acceptance Criteria

1. **(FR-030 + ARCH-7 + NFR-P6 — static generation, RSC, code-split)** `/work/[slug]` is statically generated via `generateStaticParams` (returning **only the featured slugs**), renders with **no client-side fetching**, stays a **Server Component**, and the detail body is code-split via `next/dynamic`.

2. **(FR-031 — layout order)** The page renders an `<article>` with exactly one `<h1>` (the project name), and sections in this exact order: **breadcrumb → Problem → Role → Stack chips → Decisions → Outcomes → Links**. The **Decisions** and **Outcomes** sections render inside `<ComputedStylesPanel>` (label/value cell idiom). The **Links** section filters out null/empty hrefs and renders only present links; external links use `target="_blank" rel="noopener noreferrer"`.

3. **(FR-034 — featured set, no detail for non-featured)** The featured slugs — **Buguard, Dark Atlas, Masheed Gate** (Hossam's decision 2026-05-31; FR-034's nominal 6 reduced to these 3 for v1, remaining projects waterfall-only) — have `featured: true` and a reachable detail page. Any **non-featured** project has **no detail page**: visiting `/work/<non-featured-slug>` calls `notFound()`, and `generateStaticParams` does not emit it.

4. **(FR-034 cross-component — waterfall row linking)** In the Network waterfall (`network-waterfall-row.tsx` row **and** card), a **featured** project's name links to `/work/[slug]` (internal `<Link>`); a **non-featured** project's name links to its live/source URL only (external `<a target="_blank" rel="noopener noreferrer">`) or renders as non-linked text when it has no external link — it must **not** link to a detail route that would 404.

5. **(ARCH-6 — mock badge, dev-only)** When a featured project's `meta.mock === true` and `process.env.NODE_ENV !== "production"`, the detail page renders a visible `[MOCK]` badge and emits a one-time `console.warn` naming the slug. In production these are suppressed. (The build-failing CI grep itself is Story 7.4 — out of scope here.)

6. **(Schema — `featured` + `meta.mock`)** `lib/content/projects.ts` `ProjectSchema` gains `featured: boolean` and `meta: { mock: boolean }`, validated at module load via Zod (existing `ProjectsCollectionSchema.parse`). All existing data continues to parse; non-featured legacy entries default to `featured: false`.

7. **(NFR-A4 — semantics & a11y)** The breadcrumb is a real `<nav aria-label="Breadcrumb">` with a `<Link>` back to `/work`. The article uses one `<h1>` and `<h2>` section headings. Stack entries and links are keyboard-reachable with visible focus rings.

8. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. A `yarn build` succeeds and statically renders only the featured slugs. Visiting a non-featured slug returns the not-found page.

## Tasks / Subtasks

- [x] **Task 1 — Extend the content schema (AC: 6)**
  - [x] In `lib/content/projects.ts`, add to `ProjectSchema`: `featured: z.boolean()` and `meta: z.object({ mock: z.boolean() })`.
  - [x] Update the `transform()` legacy mapper to default new fields: `featured: false`, `meta: { mock: true }` (legacy entries are unauthored placeholders).
  - [x] Keep `ProjectsCollectionSchema.parse(...)` as the single validation point. Confirm `Project = z.infer<typeof ProjectSchema>` now carries the new fields (do NOT hand-write the type).

- [x] **Task 2 — Mark + seed the featured case studies (AC: 3, 6)** — decided 2026-05-31: mechanism-first
  - [x] Mark **Buguard, Dark Atlas, Masheed Gate** `featured: true` (match by their generated slugs: `buguard`, `dark-atlas`, `masheed-gate`). All other projects stay `featured: false`.
  - [x] Seed all three featured entries with `meta.mock: true` and brief placeholder `problem`/`role`/`decisions[]`/`outcomes[]` text (≥1 entry each so the panels render). The `[MOCK]` badge (Task 3/4) flags them in dev; Hossam authors real content + flips `meta.mock: false` per slug later.
  - [x] Do **NOT** fabricate Hossam's career trade-offs as if real — placeholders must read as obvious placeholders.
  - [x] Preserve declaration order in the `projects` array (used by the prev/next pager in Story 4.4).
  - [x] Note: the three featured slugs derive from `transform()` today (empty fields). Either author explicit `Project` objects for them or override the transformed fields — keep them inside the single `projects` collection that `ProjectsCollectionSchema.parse` validates.

- [x] **Task 3 — Build `<NetworkRequestDetail>` (AC: 1, 2, 5, 7)**
  - [x] Create `components/network-request-detail.tsx` — **named export**, presentational **Server Component** (no `"use client"`). Props: `{ project: Project }`.
  - [x] Render the `<article>` in the exact section order (AC 2). One `<h1>` = `project.name`.
  - [x] Breadcrumb: `<nav aria-label="Breadcrumb">` → `<Link href="/work">Network</Link>` ` / ` `{project.name}`.
  - [x] Problem: `<h2>` + `project.problem`. Role: `<h2>` + `project.role`.
  - [x] Stack chips: map `project.stack` to `<Badge variant="outline">` chips.
  - [x] Decisions: `<ComputedStylesPanel>` with one `<ComputedStylesCell>` per `project.decisions[]` entry. Same idiom for Outcomes.
  - [x] Links: filter to present hrefs, render external `<a target="_blank" rel="noopener noreferrer">` with the link label.
  - [x] Mock badge: when `project.meta.mock && process.env.NODE_ENV !== "production"`, render a `[MOCK]` `<Badge>` near the `<h1>`.

- [x] **Task 4 — Wire the route page (AC: 1, 3, 5)**
  - [x] Update `app/(chrome)/work/[slug]/page.tsx`:
    - [x] `generateStaticParams` returns **only featured slugs**: `projects.filter((p) => p.featured).map((p) => ({ slug: p.slug }))`.
    - [x] In the page, look up the project; if missing **or not featured**, call `notFound()`.
    - [x] Emit the dev-only `console.warn` when the found project has `meta.mock === true` and `NODE_ENV !== "production"`.
    - [x] Render the case-study body via `next/dynamic`: `const NetworkRequestDetail = dynamic(() => import("@/components/network-request-detail").then((m) => m.NetworkRequestDetail))`. (No `ssr: false` — that is illegal in a Server Component and not wanted; this is a presentational server chunk-split.)
  - [x] Keep the existing `generateMetadata` title export as-is (full per-slug OG/JSON-LD is Story 7.1 — do not add it here).

- [x] **Task 5 — Update waterfall row/card linking (AC: 4)**
  - [x] In `components/network-waterfall-row.tsx`, in **both** `NetworkWaterfallRow` and `NetworkWaterfallCard`, branch the name cell:
    - `project.featured` → `<Link href={`/work/${project.slug}`}>` (current behavior).
    - else → external `<a href={firstExternalLink} target="_blank" rel="noopener noreferrer">` where `firstExternalLink = project.links[0]?.href`; if no link, render plain `<span>` (still truncated, no underline-on-hover affordance that implies navigation).
  - [x] Do not change bar animation, badges, or grid structure (4.1 review flagged: preserve `translateX(startOffset)` and name truncation).

- [x] **Task 6 — Tests (AC: 2, 3, 4, 5)**
  - [x] `components/network-request-detail.test.tsx`: render with a featured mock-false project and assert (a) one `<h1>` with the name, (b) sections appear in order Problem→Role→Stack→Decisions→Outcomes→Links, (c) breadcrumb link to `/work` present, (d) null/empty links are filtered, (e) `[MOCK]` badge is absent when `meta.mock: false`, present when `meta.mock: true` (stub `NODE_ENV`).
  - [x] `components/network-waterfall-row.test.tsx` (extend existing): assert a featured project's name is an internal link to `/work/[slug]`, and a non-featured project's name is an external link (or plain text when no link).
  - [x] Do **not** test `generateStaticParams`/Next internals or Tailwind classes. Verify the not-found behavior via `yarn build` in Task 7, not a unit test.

- [x] **Task 7 — Verify & gate (AC: 8)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean.
  - [x] `yarn build` — confirm only featured slugs are statically generated (check build output / `.next` route list).
  - [ ] `yarn dev` → open a featured `/work/<slug>`: verify section order, breadcrumb, stack chips, Decisions/Outcomes panels, link targets; verify `[MOCK]` badge shows for a mock entry and console.warn fires. Visit a non-featured slug → not-found page (no crash). On `/work`, click a featured row → detail; a non-featured row → opens external live URL in new tab. Resize `<640px` → cards link the same way. No console errors; `D` hotkey + RTL unaffected.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the static `/work/[slug]` case-study page (structure, semantics, code-split), the `featured` + `meta.mock` schema fields, the dev-only `[MOCK]` badge, restricting detail pages to featured slugs, and fixing waterfall-row linking so non-featured rows don't 404.
- **IS NOT:**
  - **Layout-shared `layoutId` transition (FR-025/UX-DR9) and prev/next pager (FR-033)** → **Story 4.4**. Do not implement the shared-element transition or footer pager here.
  - **Project-open XP grant (FR-074, +15)** → **Story 4.5**. Do not call `emitXP` here.
  - **Full per-slug metadata / OG image / JSON-LD `BreadcrumbList` (FR-032, NFR-S1/S2/S4)** → **Epic 7 (Stories 7.1/7.2)**. Keep only the existing simple `<title>` in `generateMetadata`. The breadcrumb here is the **visual** nav element, not the structured-data block.
  - **The build-failing mock-content CI grep (ARCH-6 gate)** → **Story 7.4**. This story only does the in-page dev badge + warn.

### Content authoring (decided 2026-05-31 — mechanism-first)
- **Decision:** featured set = **Buguard, Dark Atlas, Masheed Gate** (3 for v1, not the nominal FR-034 count of 6). All three ship `meta.mock: true` with placeholder content now; Hossam authors real `problem`/`role`/`decisions`/`outcomes` and flips `meta.mock: false` per slug later. The `[MOCK]` badge surfaces this in dev.
- The legacy data has **empty** `role`/`decisions`/`outcomes`/`org` for every project — none is authored. This is a content decision Hossam owns (architecture OQ2/A18/A22).
- **The dev agent must NOT invent Hossam's real career trade-offs.** Placeholders must read as obvious placeholders. The mechanism (schema fields, featured restriction, `[MOCK]` badge, gate-readiness) is this story's deliverable regardless of how much real content lands now.

### ⚠️ Critical regression: row linking + static params must move together
- Today `generateStaticParams` emits **all** slugs and `network-waterfall-row.tsx` links **all** names to `/work/[slug]`. If you restrict `generateStaticParams` to featured slugs without updating the row, **every non-featured row 404s**. Tasks 4 and 5 must land together. This is the "system must work end-to-end, not just satisfy stated ACs" requirement.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `lib/content/projects.ts` | **UPDATE** | Add `featured` + `meta.mock` to schema; default legacy `transform()`; mark + author featured set. |
| `components/network-request-detail.tsx` | **NEW** | Presentational **Server Component** (no `"use client"`); the `<article>` body. |
| `app/(chrome)/work/[slug]/page.tsx` | **UPDATE** | featured-only `generateStaticParams`; `notFound()` for non-featured; `dynamic()` import of detail; dev warn. Keep simple `generateMetadata`. |
| `components/network-waterfall-row.tsx` | **UPDATE** | Branch name cell on `project.featured` (internal Link vs external `<a>` vs plain text) in **both** Row and Card. |
| `components/network-request-detail.test.tsx` | **NEW** | Colocated; layout order, breadcrumb, link filtering, mock badge. |
| `components/network-waterfall-row.test.tsx` | **UPDATE** | Add featured-vs-non-featured linking assertions. |
| `components/computed-styles-panel.tsx` | **NO CHANGE** | Reuse `ComputedStylesPanel` + `ComputedStylesCell`. |

### Reuse — do NOT reinvent
- **`<ComputedStylesPanel>` / `<ComputedStylesCell>`** (`@/components/computed-styles-panel`) — for Decisions & Outcomes. Mirror the consumer pattern in `components/principles-panel.tsx` (grid cell with label/value). UX-DR1 mandates this idiom; do not build a bespoke list.
- **`<Badge variant="outline">`** (`@/components/ui/badge`) — stack chips + `[MOCK]` badge. Precedent: method/status badges in `network-waterfall-row.tsx`.
- **`notFound()`** from `next/navigation` — already imported in the current page; reuse it (renders the framework not-found).
- **`Project` type** from `@/lib/content/projects` — already typed; extend the schema, never hand-write a parallel interface.
- **`next/dynamic`** — no existing usage in the repo yet; this is the first `dynamic()` boundary (NFR-P6). Follow the architecture's `dynamic(() => import(...))` form.

### Architecture / project-context guardrails (must follow)
- **RSC by default.** `network-request-detail.tsx` is presentational → keep it a Server Component (no hooks, no event handlers). The page stays RSC. No `"use client"` added in this story.
- **`next/dynamic` in a Server Component:** allowed **without** `{ ssr: false }`. Do not pass `ssr: false` (illegal in RSC and would force a client boundary). The goal is code-splitting the detail chunk per NFR-P6.
- **No client fetching** — `projects` imported at build time (FR-030).
- **Named exports** for components; `page.tsx` keeps its default export (Next requirement).
- **Semantic tokens only** — `text-foreground`, `text-muted-foreground`, `text-lime`, `border-hairline`, `bg-surface`. No hardcoded hex/oklch.
- **Logical properties** (`ps-`/`pe-`/`ms-`/`me-`) for any custom spacing — RTL is wired.
- **`<article>` with one `<h1>`** (NFR-A4); section headings are `<h2>`. The chrome layout already renders `<main>`; do not add a second `<main>`.
- **External links** always `target="_blank" rel="noopener noreferrer"` (UX-DR6).
- **Type-only imports** use `import type` (`isolatedModules: true`).
- **Import order:** external (`next/*`, `framer-motion`) → internal aliases (`@/components/*`, `@/lib/*`) → relative → side-effects. Blank line between groups, alpha within.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`. Colocate `*.test.tsx` next to source.
- Query by **role/label/text**, not `getByTestId`. For section order, assert the relative DOM position of the `<h2>` headings (e.g. via `getAllByRole("heading", { level: 2 })` text sequence).
- To test the `[MOCK]` badge gate, stub the env: `vi.stubEnv("NODE_ENV", "development")` / `"production"` and `vi.unstubAllEnvs()` in `afterEach`.
- **Don't test:** Next framework behavior (`generateStaticParams`, `notFound` rendering), Tailwind class strings, or `dynamic()` internals. Verify static-generation + not-found via `yarn build` / `yarn dev` (Task 7), not units.
- A featured fixture project for tests must include all required fields incl. `featured: true`, `meta: { mock: false }`, non-empty `decisions`/`outcomes`/`links` (and one null/invalid link case to prove filtering — note the schema requires `href` to be a valid URL, so model "absent link" by omitting it from the array, not by a null href).

### Previous story intelligence
- **Story 4.1** established `NetworkWaterfallTable`/`Row`/`Card`. Row/Card are **client** components (`framer-motion`); your name-cell branch must keep them client and preserve the `transform: scaleX()/translateX(startOffset)` bars and name truncation (4.1 review findings).
- **Story 4.2** added `NetworkPageClient` (client) + `NetworkFilterBar`; the page stays RSC and passes the `projects` array as a prop. Your row change flows through unchanged — filtering passes a filtered subset to the same Row/Card. The `projects` array is `readonly` — keep prop types `readonly`/respect immutability.
- **Story 3.2** (`principles-panel.tsx`) is the canonical `ComputedStylesPanel` consumer — copy its cell structure for Decisions/Outcomes.
- Recurring review theme across 4.x: a11y attributes bound to the right state, and reuse of the specified shadcn primitive (4.2 had a "Badge not used per spec" finding) — use `<Badge>` for chips, don't hand-roll.

### Git intelligence (recent commits)
- `474fd31 feat(work): url-persisted filters` (4.2), `9fdec10 feat: story 4.1 network waterfall table`, `f4b5c7f Stories 3.4+3.5 score rings/page weight/sources tree`. Pattern: Conventional Commits, one story per commit, RSC page + deep client boundary, colocated tests, ComputedStylesPanel reused for panel surfaces. Match this: `feat(work): statically-generated case-study detail (story 4.3)`.

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router.** `params` is a **Promise** — `await params` (the current page already does this; preserve it). `next/dynamic` `{ ssr: false }` is **not allowed in Server Components** in Next 15/16 — omit options for a server chunk-split.
- **React 19.2.4** — no `forwardRef` needed; refs are props.
- **Tailwind v4** — tokens in `app/globals.css`, semantic utilities only.
- **framer-motion 12.40.0** — only relevant to the (unchanged) Row/Card bars here; the detail page itself needs no motion in this story (shared-element transition is 4.4).

### References
- [Source: _bmad-output/planning-artifacts/epics.md:547-561] — Story 4.3 AC (static gen, layout order, featured set, mock badge).
- [Source: _bmad-output/planning-artifacts/epics.md:52-58] — FR-030..034 case-study requirements.
- [Source: _bmad-output/planning-artifacts/epics.md:563-589] — Stories 4.4 (transition/pager) & 4.5 (XP) — explicit scope exclusions.
- [Source: _bmad-output/planning-artifacts/architecture.md:159] — `Project` schema expected to carry `featured` + `meta.mock`.
- [Source: _bmad-output/planning-artifacts/architecture.md:168,246] — mock gating; "mock gate wired before featured-slug authoring in P4."
- [Source: _bmad-output/planning-artifacts/architecture.md:390-391,479] — `work/[slug]/page.tsx` (generateStaticParams + generateMetadata), `components/network-request-detail.tsx`, `opengraph-image.tsx` (Epic 7).
- [Source: _bmad-output/planning-artifacts/architecture.md:216] — code-split `/work/[slug]` via `dynamic()` (NFR-P6).
- [Source: _bmad-output/planning-artifacts/architecture.md:527] — featured set + content are Hossam-owned content decisions (OQ2/A18/A22).
- [Source: _bmad-output/project-context.md] — RSC-by-default, semantic tokens, named exports, import order, logical props, testing rules, external-link rel.
- [Source: lib/content/projects.ts] — schema to extend; legacy `transform()`; `projects` collection.
- [Source: app/(chrome)/work/[slug]/page.tsx] — current stub page to flesh out.
- [Source: components/computed-styles-panel.tsx] — panel/cell primitives to reuse.
- [Source: components/principles-panel.tsx] — canonical ComputedStylesPanel consumer.
- [Source: components/network-waterfall-row.tsx] — Row/Card to update for featured linking.
- [Source: _bmad-output/implementation-artifacts/4-1-network-waterfall-table-desktop-grid-mobile-card.md] — Row/Card patterns + review findings.
- [Source: _bmad-output/implementation-artifacts/4-2-url-persisted-filters-with-empty-state.md] — RSC-boundary discipline; readonly projects.

### Project Structure Notes
- New `components/network-request-detail.tsx` matches the architecture-named component (line 479) and the kebab-case + named-export convention.
- `opengraph-image.tsx` is intentionally **not** created here (Epic 7).
- No new dependencies. `next/dynamic` is built-in. No state library, no router/i18n additions.

## Dev Agent Record

### Agent Model Used

zai-coding-plan/glm-5.1

### Debug Log References

### Completion Notes List

- Task 1: Added `featured: z.boolean()` and `meta: z.object({ mock: z.boolean() })` to `ProjectSchema`. Updated `transform()` to default `featured: false`, `meta: { mock: true }`. Type is derived via `z.infer`.
- Task 2: Extracted Buguard, Dark Atlas, Masheed Gate from legacy array into explicit `featuredProjects: Project[]` with `featured: true`, `meta.mock: true`, and placeholder content. Preserved declaration order at top of `projects` array.
- Task 3: Created `components/network-request-detail.tsx` — RSC, named export. Sections in exact order: breadcrumb → Problem → Role → Stack → Decisions → Outcomes → Links. Reuses `ComputedStylesPanel`/`ComputedStylesCell` and `<Badge variant="outline">`.
- Task 4: Updated `app/(chrome)/work/[slug]/page.tsx` — `generateStaticParams` emits only featured slugs; `notFound()` for non-featured; `dynamic()` import for code-split; dev-only `console.warn` for mock entries.
- Task 5: Extracted `ProjectNameLink` helper in `network-waterfall-row.tsx` — branches on `project.featured`: internal `<Link>`, external `<a target="_blank">`, or plain `<span>`. Both Row and Card updated.
- Task 6: Created `network-request-detail.test.tsx` (9 tests: h1, section order, breadcrumb, stack badges, decisions/outcomes panels, external links, MOCK badge gating). Extended `network-waterfall-row.test.tsx` (6 new tests: featured/non-featured linking for both Row and Card).
- Task 7: All gates green — typecheck, lint, 132 tests pass, format clean. Build generates only 3 featured slugs. Also fixed pre-existing Suspense boundary issue in `/work` page (from Story 4.2).
- Note: Task 7 manual dev verification (browser) requires Hossam to run `yarn dev` and verify visually.

### File List

- `lib/content/projects.ts` — UPDATE (added `featured` + `meta` to schema; extracted featured projects as explicit `Project[]` with placeholder content)
- `components/network-request-detail.tsx` — NEW (presentational RSC case-study detail)
- `app/(chrome)/work/[slug]/page.tsx` — UPDATE (featured-only generateStaticParams, notFound guard, dynamic import, dev mock warn)
- `app/(chrome)/work/page.tsx` — UPDATE (wrapped NetworkPageClient in Suspense to fix pre-existing build error)
- `components/network-waterfall-row.tsx` — UPDATE (ProjectNameLink helper, featured/non-featured linking)
- `components/network-request-detail.test.tsx` — NEW (9 tests)
- `components/network-waterfall-row.test.tsx` — UPDATE (added 6 featured/non-featured linking tests + updated fixture)
- `components/network-page-client.test.tsx` — UPDATE (added featured + meta to fixtures)
- `components/network-waterfall-table.test.tsx` — UPDATE (added featured + meta to fixtures)

## Story Completion Status

- [x] Epic context analyzed
- [x] Architecture requirements extracted
- [x] Previous story intelligence incorporated
- [x] File modifications identified (UPDATE vs NEW)
- [x] Reuse opportunities documented
- [x] Testing requirements specified
- [x] Anti-patterns and guardrails listed
- [x] Concrete implementation notes provided
- [x] Scope boundaries vs Stories 4.4 / 4.5 / Epic 7 stated

**Status:** ready-for-dev
**Ultimate context engine analysis completed — comprehensive developer guide created**

### Review Findings

- [ ] [Review][Patch] generateMetadata doesn't guard non-featured projects [app/(chrome)/work/[slug]/page.tsx:23-27] — `generateMetadata` only checks `if (!project)` but the page checks `if (!project || !project.featured)`. A non-featured project will get valid metadata while the page 404s. Also, if project is undefined, it returns a generic title instead of delegating to root layout 404 metadata.
- [ ] [Review][Patch] [MOCK] badge text omits square brackets [components/network-request-detail.tsx:42] — Spec says "renders a visible `[MOCK]` badge" but code renders `<Badge>MOCK</Badge>` without brackets.
- [ ] [Review][Patch] console.warn executes on every render, not one-time [app/(chrome)/work/[slug]/page.tsx:42-44] — Spec says "emits a one-time console.warn" but it runs inside the component on every request.
- [ ] [Review][Patch] Decisions and Outcomes sections conditionally rendered, breaking exact order guarantee [components/network-request-detail.tsx:78,95] — Spec says sections in "exact order" but conditional rendering omits them when arrays are empty.
- [ ] [Review][Patch] Tests don't assert rel="noopener noreferrer" on non-featured external links [components/network-waterfall-row.test.tsx:284-285,341-342] — Tests check target="_blank" but never verify the rel attribute on the external anchor.
- [ ] [Review][Patch] Tests don't verify null/empty link filtering [components/network-request-detail.test.tsx] — All test fixtures have valid links; no test exercises the filter guard for absent/empty hrefs.
- [ ] [Review][Patch] Duplicate React keys in links section [components/network-request-detail.tsx:120] — Uses `key={link.label}`; duplicate labels would cause React key warnings and reconciliation issues.
- [ ] [Review][Patch] External links lack "opens in new tab" affordance [components/network-request-detail.tsx:119, components/network-waterfall-row.tsx:58] — `target="_blank"` links have no visual or ARIA indicator that they open externally.
- [ ] [Review][Patch] ProjectNameLink arbitrarily selects links[0] without regard to type [components/network-waterfall-row.tsx:55] — Uses `project.links[0]?.href` without filtering by label/type. Could link to wrong destination if first link is not the live/preview URL.
- [ ] [Review][Patch] Empty problem/role strings render invisible content [components/network-request-detail.tsx:51-62] — Empty strings render empty `<p>` tags, creating layout noise for screen readers.
- [ ] [Review][Patch] No loading state for dynamically imported detail component [app/(chrome)/work/[slug]/page.tsx:7] — `dynamic()` has no `loading` prop. If the detail chunk is heavy, the route stalls without feedback.
- [ ] [Review][Patch] Suspense boundary without fallback [app/(chrome)/work/page.tsx:15] — `<Suspense>` has no `fallback` prop. UI may flash or appear unresponsive during hydration.
- [x] [Review][Defer] Method badge hidden from assistive technology [components/network-waterfall-row.tsx:83] — `aria-hidden="true"` on METHOD badge means screen readers don't know the HTTP method. Pre-existing from Story 4.1.
- [x] [Review][Defer] Keyboard focus missing on table row [components/network-waterfall-row.tsx:75] — Only the `<Link>` inside the row is focusable. Keyboard users cannot navigate to the row itself to hear full context. Pre-existing from Story 4.1.
- [x] [Review][Defer] timeWeight/startOffset animation exceeds container bounds [components/network-waterfall-row.tsx:122-131] — If values exceed 1.0 or are negative, the motion bar will overflow or render backwards. Pre-existing from Story 4.1; schema should validate clamping.

**Dismissed (5):** Legacy projects marked mock=true (by design per spec); Mock placeholder content in production (by design — mechanism-first approach); Slug collisions between featured and legacy (data controlled by author); console.warn invisible in build logs (secondary indicator, badge is primary); Duplicate React keys in stack list (stack is a set by data model); No automated test for notFound/static params (spec explicitly says not to test Next internals).
