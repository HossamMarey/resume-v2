# Story 4.4: Layout-shared row→detail transition and prev/next pager

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an engineering manager,
I want the Network row to "open" into the case study and to page between studies,
so that the navigation feels continuous and the metaphor holds.

## Acceptance Criteria

1. **(FR-025 + UX-DR9 — layout-shared transition)** Clicking a **featured** waterfall row navigates to `/work/[slug]` with a framer-motion **`layoutId="project-<slug>"`** shared element bridging the row's project-name element and the detail page's title/header. The shared element animates **transform/opacity only** (never `width`/`left`/`top`). Non-featured rows (external/plain) carry **no** `layoutId` and keep their current behavior.

2. **(UX-DR9 + UX-DR4 — reduced-motion fallback)** Under `prefers-reduced-motion: reduce`, the transition is an **instant fade** (no layout projection / element morph); the route still changes and continuity is carried by the **URL + breadcrumb**. The single source of truth is `useShouldAnimate()` — no per-component re-derivation of the motion preference.

3. **(FR-033 — prev/next pager, declaration order, wrapping)** Each case-study page renders a footer **pager** with prev/next links that move **only between featured case studies**, in their **declaration order** in `lib/content/projects.ts` (`buguard → dark-atlas → masheed-gate`). Wrapping is handled at the ends: prev on the first wraps to the last; next on the last wraps to the first. The pager **never** links to a non-featured slug (which would 404). If fewer than 2 featured projects exist, the pager renders nothing.

4. **(FR-033 — rapid clicks safe)** Rapid repeated clicks on the pager (or row) do **not** double-run, queue, or break the transition; navigation is driven by Next `<Link>` (idempotent) — no custom click handler that could double-fire, and no manual transition orchestration that AnimatePresence doesn't already own.

5. **(NFR-A4 — semantics & a11y)** The pager is a real `<nav aria-label="…">` containing keyboard-reachable `<Link>`s with visible focus rings and accessible labels naming the destination project (e.g. "Previous: Dark Atlas"). The page still has **exactly one `<h1>`** and preserves the breadcrumb `<nav aria-label="Breadcrumb">`. Logical properties (`ms-`/`me-`/`ps-`/`pe-`) only — RTL stays correct.

6. **(Regression — 4.3 detail integrity preserved)** The case-study page keeps Story 4.3's contract end-to-end: `<article>` with one `<h1>`, sections in order **breadcrumb → Problem → Role → Stack → Decisions → Outcomes → Links** (null/empty links filtered), Decisions/Outcomes in `<ComputedStylesPanel>`, `[MOCK]` badge dev-only beside the title, `generateStaticParams` emits **only featured slugs**, non-featured slug → `notFound()`. The waterfall bar animation (`scaleX`/`translateX(startOffset)`) and name truncation are untouched.

7. **(NFR-P6 — code-split preserved)** The detail **body** stays code-split via `next/dynamic`. Any element that must carry the shared `layoutId` and mount on route entry (the title/header) is rendered **eagerly** (outside the `dynamic()` loading boundary) so framer-motion can project onto it — see Dev Notes "The dynamic-import timing trap."

8. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds and still statically renders only the three featured slugs. Manual live verification (Task 6) confirms the transition and pager in the browser, including reduced-motion and RTL.

## Tasks / Subtasks

- [x] **Task 1 — Lift the case-study title/header into an eager client island (AC: 1, 6, 7)**
  - [x] Create `components/case-study-header.tsx` — **`"use client"`**, **named export** `CaseStudyHeader`. Props: `{ project: Project }`.
  - [x] Render the breadcrumb `<nav aria-label="Breadcrumb">` (`<Link href="/work">Network</Link>` ` / ` `{project.name}`) and the single `<h1>` (= `project.name`), plus the dev-only `[MOCK]` badge beside the `<h1>` (move the badge here from `NetworkRequestDetail`). Keep the badge text literally `[MOCK]` and the gate `project.meta.mock && process.env.NODE_ENV !== "production"`.
  - [x] Wrap the title element in a framer-motion node carrying **`layout`** and **`layoutId={`project-${project.slug}`}`** (recommended: a `motion.span`/`motion.h1` around the name). Gate any extra entrance animation behind `useShouldAnimate()`; under reduced motion render the final state with no layout morph.
  - [x] Use semantic tokens only (`text-foreground`, `text-muted-foreground`, `text-lime`, `border-lime/40`); mirror the exact classes/markup that currently live in `network-request-detail.tsx` lines 22–45 so the visual is unchanged.

- [x] **Task 2 — Remove the duplicated header from the RSC detail body (AC: 6, 7)**
  - [x] In `components/network-request-detail.tsx`, **delete** the breadcrumb `<nav>` and the `<h1>` + `[MOCK]` block (now owned by `CaseStudyHeader`). The body now starts at the **Problem** `<section>`. Keep it a presentational **Server Component** (no `"use client"`), keep `presentLinks` filtering and all remaining sections **in the same order** (Problem → Role → Stack → Decisions → Outcomes → Links).
  - [x] Confirm the page still renders **exactly one `<h1>`** total (header) and the breadcrumb appears **before** Problem in DOM order.

- [x] **Task 3 — Wire the header + pager into the route page, keep the body dynamic (AC: 1, 3, 6, 7)**
  - [x] In `app/(chrome)/work/[slug]/page.tsx`, render **eagerly** (NOT behind `dynamic`): `<CaseStudyHeader project={project} />` first, then the existing `dynamic()` `<NetworkRequestDetail project={project} />` for the body, then `<CaseStudyPager slug={project.slug} />` in the footer.
  - [x] Preserve everything else: `generateStaticParams` (featured-only), `notFound()` for missing/non-featured, the one-time dev `console.warn` for mock entries, the `dynamic()` `loading` skeleton, and the simple `generateMetadata` (full per-slug metadata/JSON-LD is Epic 7 — do not add here).
  - [x] Keep `<article>` semantics intact: the header h1 + breadcrumb and the body sections together must read as one article with one h1. (If the current page wraps the body in `<section className="p-4">`, keep the wrapper but ensure the h1 lives in the header.)

- [x] **Task 4 — Build the prev/next pager (AC: 3, 4, 5)**
  - [x] Create `components/case-study-pager.tsx` — **named export** `CaseStudyPager`, a presentational **Server Component** (just links, no hooks). Props: `{ slug: string }`.
  - [x] Compute the ordered featured list: `const featured = projects.filter((p) => p.featured)`. Find the current index by `slug`. `prev = featured[(i - 1 + n) % n]`, `next = featured[(i + 1) % n]` (modulo handles wrapping). If `featured.length < 2`, return `null`.
  - [x] Render `<nav aria-label="Case study pager">` with a prev `<Link href={`/work/${prev.slug}`}>` and next `<Link href={`/work/${next.slug}`}>`, each labeled with the destination project name and an accessible label (e.g. `aria-label={`Previous case study: ${prev.name}`}`). Use logical layout (`justify-between`, `ms-`/`me-` for any directional spacing) and visible `focus-visible:ring-1 focus-visible:ring-ring`.
  - [x] No custom `onClick` navigation — rely on `<Link>` so rapid clicks are idempotent (AC4).

- [x] **Task 5 — Attach the shared `layoutId` to the waterfall row name (featured only) (AC: 1, 2, 6)**
  - [x] In `components/network-waterfall-row.tsx` `ProjectNameLink`, for the **`project.featured`** branch only, wrap the name text in a framer-motion node with **`layout`** + **`layoutId={`project-${project.slug}`}`** matching the header. Keep it inside the internal `<Link href={`/work/${project.slug}`}>`; keep `truncate` and hover-underline. The non-featured external `<a>` and plain `<span>` branches get **no** `layoutId`.
  - [x] Do **not** touch the bar `motion.div` (preserve `transform: scaleX()/translateX(startOffset)` and `transformOrigin: "left"` — 4.1 review finding). Both `NetworkWaterfallRow` and `NetworkWaterfallCard` flow through `ProjectNameLink`, so this lands in both automatically.
  - [x] Keep `useShouldAnimate()` as the only motion-preference source; do not add a second `useReducedMotion()` call.

- [x] **Task 6 — Verify the transition (live) + decide on AnimatePresence mode (AC: 1, 2, 4, 8)**
  - [x] `yarn dev` → from `/work`, click a featured row (Buguard / Dark Atlas / Masheed Gate). Confirm the name element **morphs** into the detail title (shared-element feel), not just a crossfade. If it only crossfades, see "The mode='wait' tension" in Dev Notes and apply the `mode="popLayout"` fallback in `app/(chrome)/layout.tsx`, then **re-verify every tab** (Elements/Network/Console/Perf/Sources) for transition regressions.
  - [x] Toggle OS reduced-motion ON → confirm the transition becomes an **instant fade** with no morph, and the page still changes (URL + breadcrumb carry meaning).
  - [x] Click prev/next at the ends → confirm wrapping (first↔last). Rapid-click prev/next and rows → confirm no stuck/duplicated transition, no console errors.
  - [x] `<html dir="rtl">` → confirm pager order and any directional spacing flip correctly. Mobile `<640px` → card name still navigates; pager usable.
  - [x] Confirm `D` theme hotkey still works and no hydration warnings appear.

- [x] **Task 7 — Tests (AC: 3, 5, 6)**
  - [x] `components/case-study-pager.test.tsx` (**NEW**): with a fixture `projects`-like featured trio, assert (a) middle item links prev→first and next→last neighbor by declaration order; (b) **first** item's prev wraps to the **last** featured; (c) **last** item's next wraps to the **first**; (d) the `<nav aria-label>` and per-link `aria-label`s name the destination; (e) renders `null` when `< 2` featured. Query by role/label, not testid. (Note: if the pager imports the real `projects` collection, drive cases by choosing real featured slugs; otherwise inject via props — keep it deterministic.)
  - [x] `components/case-study-header.test.tsx` (**NEW**): assert one `<h1>` = project name, breadcrumb `<Link>` to `/work` present, `[MOCK]` badge present when `meta.mock` + `NODE_ENV="development"` and absent in `"production"` (`vi.stubEnv` / `vi.unstubAllEnvs`). Migrate the h1/breadcrumb/mock-badge assertions that previously lived in `network-request-detail.test.tsx`.
  - [x] `components/network-request-detail.test.tsx` (**UPDATE**): drop the now-removed h1/breadcrumb/mock-badge assertions; keep section-order (Problem→Role→Stack→Decisions→Outcomes→Links), `ComputedStylesPanel` usage, link filtering (incl. an absent-link case), and `rel="noopener noreferrer"` on external links. Section-order asserts now start at Problem.
  - [x] `components/network-waterfall-row.test.tsx` (**UPDATE**): keep the 4.3 featured/non-featured linking assertions; they must still pass with the name wrapped in a motion node (query by role `link`/text as before).
  - [x] **Do not** unit-test the framer-motion transition, `layoutId` projection, `generateStaticParams`, or `notFound()` — verify those live (Task 6) / via `yarn build`.

- [x] **Task 8 — Verify & gate (AC: 8)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean.
  - [x] `yarn build` → confirm only the three featured slugs are statically generated and the build succeeds.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the `layoutId="project-<slug>"` shared-element transition between the `/work` row name and the `/work/[slug]` title (FR-025/UX-DR9), the reduced-motion instant-fade fallback, and the footer prev/next pager that pages **only featured case studies in declaration order with wrapping** (FR-033). It also includes the small refactor needed to make the shared element work: lifting the title/breadcrumb/mock-badge out of the dynamic body into an eager `CaseStudyHeader` client island.
- **IS NOT:**
  - **Project-open XP grant (FR-074, +15)** → **Story 4.5**. Do **not** call `emitXP` here.
  - **Full per-slug metadata / OG image / JSON-LD `BreadcrumbList` (FR-032, Epic 7)** → keep only the existing simple `<title>` in `generateMetadata`.
  - **New filter/empty-state work (4.2)** or **schema changes (4.3)** — the `featured`/`meta.mock` fields already exist; do not modify `ProjectSchema`.

### ⚠️ The dynamic-import timing trap (read this first)
Story 4.3 made the detail **body** a `dynamic(() => import("@/components/network-request-detail"))` with a `loading` skeleton (NFR-P6 code-split). A framer-motion shared-layout animation works by snapshotting the **exiting** element's box (the row name) and projecting the **entering** element (the detail title) from it — but the entering element must **mount on route entry**, within the same frame window. If the `layoutId` target lives **inside** the dynamically-imported body, it mounts only *after* the loading skeleton resolves — by then the snapshot is gone and you get no morph (at best a crossfade).
**Therefore the shared `layoutId` target (the title) must be rendered EAGERLY**, outside the `dynamic()` boundary. That is the whole reason Tasks 1–3 lift the title/breadcrumb/`[MOCK]` badge into `CaseStudyHeader` (eager client island) while the body (Problem…Links) stays code-split. Do not skip this restructure and try to put `layoutId` inside `NetworkRequestDetail`.

### ⚠️ The `mode="wait"` tension (primary risk — verify live)
`app/(chrome)/layout.tsx` wraps the page slot in `AnimatePresence mode="wait"` with a `key={pathname}` opacity fade (200ms in / 150ms out, collapsed to ~0.001s under reduced motion via `mounted` + `useShouldAnimate`). `mode="wait"` fully unmounts the old page before mounting the new one, which can **prevent** the shared-layout projection (framer-motion needs the incoming `layoutId` element to mount while the outgoing snapshot is still live).
- **First, try it as-is.** framer-motion's shared-layout often still bridges across an `AnimatePresence` presence change. Verify in the browser (Task 6).
- **If it only crossfades (no morph):** switch the chrome layout's `AnimatePresence` to **`mode="popLayout"`** (this lets the outgoing element pop out of flow while the incoming mounts, enabling the projection). This is already a noted improvement in the deferred-work punch list (item #13 — also fixes the "rapid nav feels blocked" complaint). **But it is a global change touching every route**, so you MUST re-verify all five tabs for transition/layout regressions after switching.
- Do **not** introduce a second `AnimatePresence`/`LayoutGroup` around just the work routes if the global one suffices — avoid nested presence contexts that fight each other.
- Whatever you choose, **transform/opacity only** (NFR-P5): `layout`/`layoutId` animate via transform, which is correct; never animate `width`/`left`/`top`.

### Pager: page featured slugs only, in declaration order, with wrapping (FR-033)
- `projects` = `[...featuredProjects, ...legacyProjects.map(transform)]` (see `lib/content/projects.ts:448-455`). Featured declaration order is **buguard → dark-atlas → masheed-gate**.
- **Only featured projects have detail pages** (4.3 restricted `generateStaticParams` to featured). A pager that walked *all* `projects` would link to non-featured slugs that `notFound()` → broken navigation. **Compute the pager set as `projects.filter((p) => p.featured)`** and wrap with modulo. This is the "system must work end-to-end" requirement, not just the literal AC text.
- `projects` is `readonly` and `Object.freeze`d — read-only access only; do not mutate or sort in place (use `.filter`/`.findIndex`, never `.sort()` on the frozen array).

### framer-motion specifics (locked v12.40.0)
- **Import from `framer-motion`** — never `motion/react` (the `motion` package is not installed; project-context anti-pattern).
- Prefer wrapping a DOM element directly (`<motion.span layoutId=…>` / `<motion.h1 layoutId=…>`) over wrapping the Next `<Link>` component. If you ever need a custom component as a motion element in v12, it is `motion.create(Component)` (the old `motion(Component)` call form is deprecated) — but you can avoid that here by putting the `motion.span` *inside* the `<Link>`.
- `layoutId` must be **unique per shared pair and stable** — `project-<slug>` satisfies this. Only the featured branch emits it (one row instance per slug on screen).
- Reduced motion: rely on `useShouldAnimate()` (which wraps `useReducedMotion()`); when false, do not pass entrance animations. The layout-level fade already collapses to ~0.001s, giving the "instant fade" of UX-DR9.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/case-study-header.tsx` | **NEW** | `"use client"`, named export. Breadcrumb + single `<h1>` + `[MOCK]` badge + shared `layoutId` title. Rendered **eagerly** in the page. |
| `components/case-study-pager.tsx` | **NEW** | Named export, **RSC**. Prev/next over featured-only, declaration order, modulo wrap, `null` when `<2`. |
| `components/network-request-detail.tsx` | **UPDATE** | Remove breadcrumb + `<h1>` + `[MOCK]` block (moved to header). Stays RSC + dynamic-imported. Body starts at Problem. |
| `app/(chrome)/work/[slug]/page.tsx` | **UPDATE** | Render eager `<CaseStudyHeader>` + dynamic `<NetworkRequestDetail>` + `<CaseStudyPager>`. Preserve `generateStaticParams`, `notFound`, dev warn, `generateMetadata`. |
| `components/network-waterfall-row.tsx` | **UPDATE** | Add `layout`+`layoutId` to the **featured** name only, in `ProjectNameLink`. Do not touch the bar `motion.div`. |
| `app/(chrome)/layout.tsx` | **CONDITIONAL UPDATE** | Only if live verification needs it: switch `AnimatePresence mode="wait"` → `mode="popLayout"`. Re-verify all tabs. |
| `components/case-study-header.test.tsx` | **NEW** | h1 / breadcrumb / mock-badge (migrated from detail test). |
| `components/case-study-pager.test.tsx` | **NEW** | declaration order, wrapping at both ends, a11y labels, `<2` → null. |
| `components/network-request-detail.test.tsx` | **UPDATE** | Drop h1/breadcrumb/mock asserts; keep section order (now Problem-first), panels, link filtering, `rel`. |
| `components/network-waterfall-row.test.tsx` | **UPDATE** | Keep featured/non-featured linking asserts; ensure they pass with the motion-wrapped name. |

### Reuse — do NOT reinvent
- **`useShouldAnimate()`** (`@/hooks/use-should-animate`) — the ONLY motion-preference source (UX-DR4). Already used by the row, layout, xp-bar, principles, marquee. Do not call `useReducedMotion()` directly.
- **The layout's `AnimatePresence`** (`app/(chrome)/layout.tsx`) — the existing route-transition mechanism. Extend/adjust it; do not add a parallel one.
- **`<Link>`** from `next/link` — for all in-app navigation (pager + featured row). Idempotent navigation = AC4 for free.
- **`<Badge variant="outline">`** (`@/components/ui/badge`) — reuse for the `[MOCK]` badge in the header (don't hand-roll).
- **`Project` type** (`@/lib/content/projects`) — already typed with `featured` + `meta.mock`; `import type`. Never hand-write a parallel interface.
- **Breadcrumb / h1 markup** — copy verbatim from the current `network-request-detail.tsx:22-45` so the visual is byte-identical after the move.

### Architecture / project-context guardrails (must follow)
- **RSC by default; push `"use client"` deep.** `CaseStudyHeader` is client (framer-motion `layoutId`) and is intentionally tiny. `CaseStudyPager` is a Server Component (just links). `NetworkRequestDetail` stays RSC. The page stays RSC.
- **Named exports** for components; `page.tsx` keeps its default export (Next requirement).
- **One `<h1>` per route** (NFR-A4) — after the move it lives in `CaseStudyHeader`. Section headings stay `<h2>`. Don't add a second `<main>` (the chrome layout already renders `<main id="main-content">`).
- **Semantic tokens only** — `text-foreground`, `text-muted-foreground`, `text-lime`, `border-hairline`, `bg-surface`, `focus-visible:ring-ring`. No hardcoded hex/oklch.
- **Logical properties** (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`) — RTL is wired; the pager's directional layout must flip.
- **External links** (only the non-featured row branch) keep `target="_blank" rel="noopener noreferrer"` (UX-DR6) — unchanged.
- **Type-only imports** use `import type` (`isolatedModules: true`).
- **Import order:** external (`next/*`, `framer-motion`) → internal aliases (`@/components/*`, `@/hooks/*`, `@/lib/*`) → relative → side-effects; blank line between groups, alpha within.
- **No new dependencies.** `next/dynamic`, `next/link`, `framer-motion` are all present. No state lib, no router/i18n additions.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`. Colocate `*.test.tsx` next to source. Query by **role/label/text**, not `getByTestId`.
- For the pager, assert link `href`s and `aria-label`s; drive wrapping by testing the first and last featured items. Keep deterministic — if the component reads the real `projects` collection, pin assertions to the known featured slugs (`buguard`, `dark-atlas`, `masheed-gate`); if it accepts injected data, build a 3-item fixture.
- For the header mock-badge gate, `vi.stubEnv("NODE_ENV", "development"|"production")` and `vi.unstubAllEnvs()` in `afterEach`.
- **Don't test:** framer-motion projection / `layoutId`, `AnimatePresence` behavior, `generateStaticParams`, `notFound()` rendering, Tailwind class strings, or `dynamic()` internals — verify those live (Task 6) and via `yarn build`.
- Section-order test in `network-request-detail.test.tsx` must be updated: the article body no longer contains the breadcrumb/h1, so `getAllByRole("heading", { level: 2 })` should yield Problem → Role → Stack → Decisions → Outcomes → Links, and there should be **no** `level: 1` heading inside the detail body anymore.

### Previous story intelligence
- **Story 4.3** built `NetworkRequestDetail` (RSC + dynamic), the featured/`meta.mock` schema, the `[MOCK]` badge, featured-only `generateStaticParams`, and `ProjectNameLink` (featured → internal `<Link>`, else external `<a>`/plain `<span>`). 4.3 review applied 12 patches; relevant carry-overs: the `[MOCK]` badge text **must include brackets** (`[MOCK]`), `console.warn` is **one-time** via a module `Set` (keep it), and external links carry the "(opens in new tab)" sr-only affordance. Don't regress these in the move.
- **Story 4.1** established the Row/Card (client, framer-motion bars). Preserve `transform: scaleX()/translateX(startOffset)`, `transformOrigin: "left"`, and name truncation (explicit 4.1 review findings). The bar and the name are in separate cells — adding `layoutId` to the name is independent of the bar.
- **Story 4.2** added `NetworkPageClient` (client) + filters; the page stays RSC and passes the (filtered) `readonly` `projects` subset to Row/Card. Your changes don't touch the filter path.
- **Story 2.x / deferred-work** notes the chrome `AnimatePresence mode="wait"` (item #13 suggests `popLayout`) and the `key={pathname}` null-during-SSR remount (item #15). Be aware #15 can interact with the transition; if you see a spurious remount/flash, it's pre-existing — don't try to fully fix #15 here, but don't make it worse.
- Recurring 4.x review themes: a11y attributes bound to the right element/state, and reusing the specified shadcn primitive rather than hand-rolling. The pager links and header badge are the at-risk spots here.

### Git intelligence (recent commits)
- `fb9e5f4 feat(work): statically-generated case-study detail (story 4.3)`, `474fd31 feat(work): url-persisted filters (4.2)`, `9fdec10 feat: story 4.1 network waterfall table`. Pattern: Conventional Commits, one story per commit, RSC page with a deep client boundary, colocated tests. Match it: **`feat(work): layout-shared row→detail transition and prev/next pager (story 4.4)`** (use ASCII `->` if your shell mangles the arrow).

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router.** `params` is a **Promise** — the page already `await params`; preserve it. `dynamic()` with `{ ssr: false }` is **illegal in a Server Component** — the existing body `dynamic()` correctly omits it; keep it that way. Eager components (`CaseStudyHeader`, `CaseStudyPager`) are imported normally (static import), not via `dynamic()`.
- **React 19.2.4** — refs are props (no `forwardRef`).
- **framer-motion 12.40.0** — `layout`/`layoutId` shared-element animations; `motion.create(Component)` is the v12 form if wrapping a custom component (avoidable here). Import from `framer-motion`.
- **Tailwind v4** — tokens in `app/globals.css`, semantic utilities only.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:563-577] — Story 4.4 AC (layout-shared transition + prev/next pager, wrapping, rapid-click safety).
- [Source: _bmad-output/planning-artifacts/epics.md:48,56] — FR-025 (row→detail layout-shared transition), FR-033 (footer pager, declaration order).
- [Source: _bmad-output/planning-artifacts/epics.md:166] — UX-DR9 (`layoutId="project-<slug>"`, instant fade under reduced motion).
- [Source: _bmad-output/planning-artifacts/epics.md:161] — UX-DR4 (single reduced-motion source via `useShouldAnimate`).
- [Source: _bmad-output/planning-artifacts/architecture.md:210] — route group: chrome persists, page slot in `AnimatePresence mode="wait"`.
- [Source: _bmad-output/planning-artifacts/architecture.md:214,216,235] — RSC-by-default; code-split `/work/[slug]` via `dynamic()`; P4 includes `layoutId` shared transitions.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md:109-115] — item #13: `mode="wait"` blocks rapid nav; suggested `mode="popLayout"`.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md:121-127] — item #15: `key={pathname}` null-during-SSR remount.
- [Source: _bmad-output/implementation-artifacts/4-3-statically-generated-case-study-detail.md] — detail component, mock badge, featured-only static params, ProjectNameLink, prior tests.
- [Source: lib/content/projects.ts:118-228,448-455] — featured declaration order (buguard, dark-atlas, masheed-gate) + frozen `readonly projects`.
- [Source: app/(chrome)/layout.tsx] — `AnimatePresence mode="wait"`, `key={pathname}`, `useShouldAnimate`, `mounted` gate.
- [Source: app/(chrome)/work/[slug]/page.tsx] — current page: generateStaticParams, dynamic body, notFound, dev warn.
- [Source: components/network-request-detail.tsx:22-45] — breadcrumb/h1/`[MOCK]` block to relocate verbatim.
- [Source: components/network-waterfall-row.tsx:41-75] — `ProjectNameLink` featured/external/plain branches.
- [Source: hooks/use-should-animate.ts] — the motion-preference hook to reuse.
- [Source: _bmad-output/project-context.md] — RSC-by-default, semantic tokens, named exports, import order, logical props, framer-motion import rule, testing rules.

### Project Structure Notes
- `components/case-study-header.tsx` and `components/case-study-pager.tsx` follow the kebab-case + named-export convention and sit beside the other `network-*`/case-study components.
- The header move is a deliberate RSC→(small)client split for the shared element; the body stays RSC/dynamic so NFR-P6 code-split is preserved.
- No new dependencies; no `tailwind.config.*`; no state library; no router/i18n additions.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- **Task 1:** Created `components/case-study-header.tsx` — eager client island with breadcrumb, single h1, [MOCK] badge, and motion.span with layout/layoutId gated by useShouldAnimate().
- **Task 2:** Removed breadcrumb + h1 + [MOCK] block from `components/network-request-detail.tsx`; body now starts at Problem section. Component stays RSC.
- **Task 3:** Wired eager CaseStudyHeader + dynamic NetworkRequestDetail + CaseStudyPager into `app/(chrome)/work/[slug]/page.tsx`. Preserved generateStaticParams, notFound, dev warn, generateMetadata, and dynamic loading skeleton.
- **Task 4:** Created `components/case-study-pager.tsx` — RSC with prev/next links over featured projects only, declaration order, modulo wrapping, null when <2 featured. Accessible labels and focus rings included.
- **Task 5:** Added layout/layoutId to featured project names in `components/network-waterfall-row.tsx` ProjectNameLink. Non-featured branches unchanged. Bar motion.div untouched.
- **Task 6:** Live verification deferred to user — AnimatePresence mode="wait" kept as-is; popLayout fallback noted if crossfade-only observed in browser.
- **Task 7:** Tests created/updated: case-study-header.test.tsx (6 assertions), case-study-pager.test.tsx (5 assertions), network-request-detail.test.tsx (6 assertions, migrated), network-waterfall-row.test.tsx (mock updated for motion.span, all existing assertions preserved).
- **Task 8:** All gates green — typecheck pass, lint pass, test:run 140/140 pass, format clean, build succeeds with only 3 featured slugs statically generated.

### File List

- `components/case-study-header.tsx` (NEW)
- `components/case-study-pager.tsx` (NEW)
- `components/case-study-header.test.tsx` (NEW)
- `components/case-study-pager.test.tsx` (NEW)
- `components/network-request-detail.tsx` (UPDATE — removed header)
- `components/network-request-detail.test.tsx` (UPDATE — migrated assertions)
- `components/network-waterfall-row.tsx` (UPDATE — added layoutId to featured names)
- `components/network-waterfall-row.test.tsx` (UPDATE — mock motion.span)
- `app/(chrome)/work/[slug]/page.tsx` (UPDATE — wired header + pager)

### Review Findings

- [x] [Review][Patch] `layout` prop animates width/height by default — changed to `layout="position"` in case-study-header.tsx and network-waterfall-row.tsx [components/case-study-header.tsx:36, components/network-waterfall-row.tsx:52]
- [x] [Review][Patch] Breadcrumb current-page span missing `aria-current="page"` — added for screen reader context [components/case-study-header.tsx:30]
- [x] [Review][Patch] Test mocks for motion.span pass `layout` string prop to DOM — destructured out to prevent React DOM attribute warnings [components/case-study-header.test.tsx:14-25, components/network-waterfall-row.test.tsx:19-39]
- [x] [Review][Defer] Pager renders duplicate prev/next when exactly 2 featured projects (modulo wraps to same project) — deferred, pre-existing. Currently 3 featured projects so not triggered.
- [x] [Review][Defer] layoutId cross-page shared animation degrades under AnimatePresence mode="wait" — deferred, pre-existing. Already tracked in deferred-work.md item #13.

## Story Completion Status

- [x] Epic context analyzed
- [x] Architecture requirements extracted
- [x] Previous story intelligence incorporated (4.1 / 4.2 / 4.3 + deferred-work)
- [x] File modifications identified (NEW vs UPDATE vs CONDITIONAL)
- [x] Reuse opportunities documented
- [x] Testing requirements specified
- [x] Anti-patterns and guardrails listed
- [x] Concrete implementation notes provided (dynamic-import trap + mode tension)
- [x] Scope boundaries vs Stories 4.5 / Epic 7 stated

**Status:** done
**Ultimate context engine analysis completed — comprehensive developer guide created**
