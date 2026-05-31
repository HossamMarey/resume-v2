# Story 3.2: Principles as a Computed-styles panel

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an engineering manager,
I want the principles rendered like a real DevTools Computed tab,
so that the craft signal lands instead of a generic card marquee.

## Acceptance Criteria

1. **(FR-011 / UX-DR1 — Computed-styles idiom, not a marquee)** The Elements page (`/`) renders a principles section **below the hero** in which the **4 entries** from `profile.principles[]` appear inside the existing `<ComputedStylesPanel>` (the hairline-grid / `gap-px` / `bg-surface`-cell idiom). Each principle is one `<ComputedStylesCell>` laid out **label-left / value-right** (DevTools `property: value` reading): the principle **title** is the label, the principle **body** is the value. It must **not** be a row of free-floating cards or an animated marquee (that is Story 3.3).
2. **(UX-DR11 / NFR-A3 — scroll reveal, motion-disciplined)** The panel is **scroll-revealed** via `useInView({ once: true })` — it animates `transform`/`opacity` **only**, once, when it first enters the viewport. Under `prefers-reduced-motion` (i.e. when `useShouldAnimate()` is `false`) the panel renders **fully visible at mount** with no reveal animation. The reveal must not re-run on back-scroll, and must not depend on or double-run with the layout's existing page-swap `AnimatePresence`.
3. **(NFR-A4 — semantic markup, single h1)** The section is introduced by an `<h2>` (heading level 2) and introduces **no second `<h1>`** — the hero's identity `<h1>` remains the only level-1 heading on `/`. Each principle's title/body use real semantic elements (e.g. `<h3>` title + `<p>` body, or a `<dl>`/`<dt>`/`<dd>` description-list inside the cells) so a screen reader reads coherent name→value pairs and the heading outline is h1 → h2 → h3 with no skipped levels.
4. **(Content authoring — `profile.principles` is currently `[]`)** `lib/content/profile.ts` ships with `principles: []`. Because AC 1 requires **4** entries, the 4 principles MUST be authored as real content in `lib/content/profile.ts` (each `{ key, title, body }`, all non-empty per `ProfileSchema`). The section must not render an empty panel, placeholder text, or fewer than 4 cells.
5. **(Reuse, no fork)** The section composes the **existing** `@/components/computed-styles-panel` (`<ComputedStylesPanel>` + `<ComputedStylesCell>`) and the **existing** `@/hooks/use-should-animate` — it does not re-implement the hairline grid, hardcode the panel classes, or call `useReducedMotion()` directly. `app/(chrome)/page.tsx` stays a **Server Component**; only the scroll-reveal wrapper is a `"use client"` child.
6. **Gates green:** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean; `/` shows no console errors/warnings; the theme `D` hotkey still toasts dark-only; `<html dir="rtl">` does not break the panel layout (logical properties only); mobile (`<640px`) renders the cells single-column with no horizontal overflow, `sm:` and up renders the 2-column grid.

## Tasks / Subtasks

- [x] **Task 1 — Author the 4 principles content (AC: 4)**
  - [x] In `lib/content/profile.ts`, populate `rawProfile.principles` with **exactly 4** `{ key, title, body }` entries (unique kebab-case `key`s; `title` short label-style; `body` one or two sentences). Author them in Hossam's senior-FE voice — craft/restraint/precision themes consistent with the tagline and `project-context.md` thesis ("senior FE craft = restraint + precision").
  - [x] These pass `ProfileSchema.parse` (every field `.min(1)`), so no schema change is needed. Do **not** weaken the schema.
  - [x] If Hossam has not supplied principle copy, author sensible defaults and call it out in Completion Notes (mirrors how Story 3.1 authored `profile.name`/`location`/`years`). Do not ship `[]` or placeholders.
- [x] **Task 2 — Build the scroll-reveal principles panel client child (AC: 1, 2, 3, 5)**
  - [x] Create `components/principles-panel.tsx` (`"use client"`, named export `PrinciplesPanel`, kebab-case file). It receives the principles as a prop: `principles: Profile["principles"]` (import the `Profile` type via `import type { Profile } from "@/lib/content/profile"`). Keep data import on the server page; pass the serializable array down (push the client boundary deep, per ARCH / project-context).
  - [x] Render a `<section aria-labelledby=...>` containing the `<h2>` heading, then the `<ComputedStylesPanel>` with one `<ComputedStylesCell>` per principle. Map over `principles` keyed by `principle.key`.
  - [x] **Cell layout — label-left / value-right:** inside each cell, put the title as the label at the inline-start and the body as the value at the inline-end (e.g. a 2-col `grid grid-cols-[auto_1fr] gap-4` or `flex` with logical spacing). Use **logical** utilities (`ms-`/`me-`/`ps-`/`pe-`/`text-start`/`text-end`) — never `ml-`/`mr-`/`left-`/`right-` — so RTL flips correctly (AC 6).
  - [x] **Two-column grid:** pass `className="sm:grid-cols-2"` to `<ComputedStylesPanel>` so 4 principles render 1-col on mobile and 2×2 on `sm+` (UX §Layout: `sm:grid-cols-2` for principles). The panel's `grid gap-px` keeps the hairline dividers.
  - [x] **Semantics:** the title is a label/`<h3>`-level element (or `<dt>`), the body a `<p>` (or `<dd>`). If you use a `<dl>`/`<dt>`/`<dd>` description list, put the `<dl>` *inside* the cells (the shared `<ComputedStylesPanel>` renders a `<div>` and must stay one — do not modify it to change its tag). Give the title the DevTools register (`font-mono`, optionally `text-lime`); body in `text-muted-foreground` body copy.
  - [x] **Scroll reveal:** `const ref = useRef(null); const inView = useInView(ref, { once: true })` (import `useInView` and `motion` from `framer-motion`, **not** `motion/react`). `const shouldAnimate = useShouldAnimate()`. Wrap the panel in a `motion.div` whose `initial`/`animate` move only `opacity` (and a small `y` translate). When `!shouldAnimate`, render the final/visible state immediately (skip the reveal — e.g. `initial={false}` or animate to the visible state with no transition). Attach `ref` to the in-view sentinel.
  - [x] Do not add a second `<main>`, skip link, or chrome — the `(chrome)` layout owns those. This is a `<section>` inside the page.
- [x] **Task 3 — Mount the panel on `/` (AC: 1, 3, 5)**
  - [x] In `app/(chrome)/page.tsx` (stays a Server Component — no `"use client"`), import `PrinciplesPanel` and render `<PrinciplesPanel principles={profile.principles} />` **after** the hero `<section>` content. Keep the existing `export const metadata` and the hero `<h1>` exactly as-is.
  - [x] Decide placement: the hero is currently a full-height centered `<section>` (`min-h-[calc(100vh-4rem)]`). Add the principles as a sibling block below it (its own `<section>`/spacing) so it scroll-reveals as the visitor moves past the fold — `useInView` needs the panel to start out of view for the reveal to be observable.
- [x] **Task 4 — Tests (AC: 1, 3, 4)**
  - [x] Add `components/principles-panel.test.tsx` (colocated). Render `<PrinciplesPanel principles={profile.principles} />` (or a small fixture of 4) and assert: the section heading is queryable as a level-2 heading (`getByRole("heading", { level: 2 })`); **no** level-1 heading is introduced by this component (`queryByRole("heading", { level: 1 })` is null); all 4 principle titles and bodies render. Query by role/text — avoid `getByTestId`. Mirror `components/computed-styles-panel.test.tsx` style (`globals: true`, no `describe/it/expect` import).
  - [x] Optionally assert the real `profile.principles` has length 4 (guards the content gap from regressing) — a tiny `lib/content/profile.test.ts` or an assertion in the panel test.
  - [x] Do **not** test Tailwind class strings, the shadcn/`ComputedStylesPanel` primitive internals, framer-motion behavior, or take JSX snapshots (project-context Testing rules).
- [x] **Task 5 — Verify & gate (AC: 6)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` all green; `yarn format`.
  - [x] `yarn dev` → load `/`: scroll down, confirm the panel reveals once (transform/opacity), 4 cells in a 2×2 hairline grid on desktop / single column on mobile, exactly one `<h1>` on the page (the hero), `<h2>` for the principles section, `Tab` order is sane, `D` toggles the dark-only toast, `<html dir="rtl">` flips label/value sides without overflow. With OS "reduce motion" on, confirm the panel is visible at mount with no reveal animation.

## Dev Notes

### What this story is (and is NOT)
- **IS:** the **principles** block on `/` (Elements), rendered with the existing `<ComputedStylesPanel>` Computed-tab idiom, scroll-revealed, plus authoring the 4 principles content entries.
- **IS NOT:** the hero (Story 3.1 — already done), the **stack marquee** (Story 3.3 — FR-012, a *separate* animated section), the real ⌘K palette (Epic 5), or `/perf`/`/sources` (Stories 3.4/3.5). Note FR-038/design-system call the legacy IA item "principles marquee" — **ignore the word "marquee" for principles**; UX-DR1/FR-011 explicitly require the Computed-styles **panel**, not a marquee. The marquee is the *stack* (3.3).

### ⚠️ Content gap — `profile.principles` is currently `[]`
`lib/content/profile.ts:43` ships `principles: []`. AC 1 needs **4** entries. This is the same class of content gap Story 3.1 hit with `profile.name` (which it resolved by authoring real content). Author 4 real `{ key, title, body }` principles. The schema (`lib/content/profile.ts:16-22`) already requires `key`/`title`/`body` non-empty, so authoring is the only work — **no schema change**. If real copy isn't provided by Hossam, author defensible defaults in his voice and flag it in Completion Notes; never ship an empty panel.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `lib/content/profile.ts` | **UPDATE** | Populate `rawProfile.principles` with 4 `{ key, title, body }` entries. No schema change. |
| `components/principles-panel.tsx` | **NEW** | `"use client"`, named export `PrinciplesPanel`; composes `<ComputedStylesPanel>`/`<ComputedStylesCell>`; `useInView({ once: true })` reveal gated by `useShouldAnimate()`. |
| `components/principles-panel.test.tsx` | **NEW** | h2 present, no new h1, 4 titles+bodies render. |
| `app/(chrome)/page.tsx` | **UPDATE** | Stays a Server Component; render `<PrinciplesPanel principles={profile.principles} />` below the hero. Keep `metadata` + hero `<h1>`. |

### Current state of `app/(chrome)/page.tsx` (being extended, not rewritten)
Server Component exporting `metadata` (`"Elements — devtools://hossam"`). Body is a single full-height hero `<section>` (`min-h-[calc(100vh-4rem)]`, centered) with the decorative `bg-grid`/`bg-scan` layers, the Fraunces `<h1>` (`profile.name`), role (mono uppercase), tagline, and `<InspectMeCta />`. **Must preserve:** the `metadata` export, the Server-Component nature, the single `<h1>`, and the one lime CTA. **What changes:** append a principles block below the hero. Do not touch the hero internals.

### Reuse — do NOT reinvent
- **`<ComputedStylesPanel>` / `<ComputedStylesCell>`** (`@/components/computed-styles-panel`) — the panel renders `grid gap-px rounded border border-hairline bg-hairline` and each cell `bg-surface p-4`. Pass extra grid columns via `className` (it merges via `cn`). It spreads `...props` onto a hardcoded `<div>` — **do not** modify it to become a `<dl>`; put any description-list markup *inside* the cells. The `direction="horizontal"` variant is for chip rows — principles want the **default vertical** grid + `sm:grid-cols-2`.
- **`useShouldAnimate()`** (`@/hooks/use-should-animate`) — single source of truth for reduced motion (it wraps `useReducedMotion()`). Import it; never call `useReducedMotion()` directly in feature code (ARCH-4 / UX-DR4). Established gating pattern: see `components/xp-bar.tsx:13` and `components/inspect-me-cta.tsx:17,33`.
- **`profile`** singleton + **`Profile`** type from `@/lib/content/profile` — already Zod-validated at module load; import the value on the server page and the type (`import type`) in the client child. Don't re-parse or re-declare the schema.
- **`framer-motion`** (NOT `motion/react`) for `motion` + `useInView` — the `motion` package is not installed (project-context anti-pattern). This story is the first feature use of `useInView`; the project-context already mandates `useInView({ once: true })` for scroll reveals.

### The scroll-reveal pattern (AC 2) — concrete shape
```tsx
"use client"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
// ...
const ref = useRef<HTMLDivElement>(null)
const inView = useInView(ref, { once: true })
const shouldAnimate = useShouldAnimate()
// reveal only opacity + small y; reduced motion => visible at mount
<motion.div
  ref={ref}
  initial={shouldAnimate ? { opacity: 0, y: 16 } : false}
  animate={shouldAnimate ? (inView ? { opacity: 1, y: 0 } : {}) : { opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: "easeOut" }}
>
  <ComputedStylesPanel className="sm:grid-cols-2"> ... </ComputedStylesPanel>
</motion.div>
```
- Transform/opacity only (no layout props) — NFR-P5 / UX-DR4.
- `{ once: true }` so it never re-runs on back-scroll.
- When `!shouldAnimate`, the panel is fully visible at mount (UX spec line 873: "Computed-styles panel scroll reveals: rendered visible at mount").
- This is **independent** of the `(chrome)` layout's page-swap `AnimatePresence` (which fades the whole page slot on route change) — they don't conflict, but don't try to coordinate them.

### Architecture / project-context guardrails (must follow)
- **Semantic tokens only** — `bg-surface`, `bg-hairline`, `border-hairline`, `text-muted-foreground`, `text-lime`, `font-mono`, `font-title`. **No hardcoded hex/oklch** in JSX.
- **RSC by default; push `"use client"` deep** — `page.tsx` stays a Server Component; only `principles-panel.tsx` is a client component (it uses `useRef`/`useInView`/`useShouldAnimate`).
- **Named exports** for the new component; `page.tsx` keeps its **default export** (Next.js requirement).
- **`import type`** for the `Profile` type (`isolatedModules`); **no `import React`** (jsx runtime).
- **Import order:** external (`react`, `framer-motion`) → internal aliases (`@/components/*`, `@/hooks/*`, `@/lib/*`) → relative — blank line between groups, alpha within.
- **RTL:** logical utilities only for the label/value split (`text-start`/`text-end`, `ps-`/`pe-`, `ms-`/`me-`), so the "label-left/value-right" reading mirrors correctly under `dir="rtl"`.
- **A11y:** exactly one `<h1>` per route (the hero's) — this section uses `<h2>` and `<h3>`/`<dl>` with no level skip; cells are not interactive so no focus ring needed; if a `<dl>` is used, ensure `<dt>`/`<dd>` are direct `<dl>` children.
- **Prettier:** no semicolons, double quotes, 2-space, classes inside `cn()`/`cva()` auto-sort — wrap dynamic class strings in `cn()`.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true` (don't import `describe/it/expect`), env `jsdom`, setup `tests/setup.ts`. `@/` alias works in tests.
- **Colocate** the test (`principles-panel.test.tsx` beside the component). Mirror `components/computed-styles-panel.test.tsx`.
- Query **by role/text**: `getByRole("heading", { level: 2 })`, `queryByRole("heading", { level: 1 })` (assert null), titles/bodies via `getByText`. Avoid `getByTestId`.
- `useInView` relies on `IntersectionObserver`, which jsdom does not implement. The reveal still renders content (motion renders children regardless), so a render+text assertion works without faking the observer. **If** any test throws on `IntersectionObserver` being undefined, stub it minimally in the test (e.g. `vi.stubGlobal("IntersectionObserver", class { observe(){} disconnect(){} unobserve(){} })`) rather than mocking framer-motion. Prefer asserting rendered output over reveal timing.
- **Don't test** Tailwind class strings, the `ComputedStylesPanel` primitive, framer-motion internals, or take snapshots.

### Project Structure Notes
- Routes live under `app/(chrome)/`; `/` = `app/(chrome)/page.tsx`. The `(chrome)` layout (`app/(chrome)/layout.tsx`) already renders `<main id="main-content">`, the skip link, `<DevToolsChrome>`, the page-swap `AnimatePresence`, and `<MobileBottomNav>` — **do not** add another `<main>`, skip link, or chrome.
- New shared component → `components/principles-panel.tsx` (sibling of `inspect-me-cta.tsx`, `computed-styles-panel.tsx`).
- UX layout rule: `sm:grid-cols-2` for principles/metrics (ux-design-specification.md:366, :814). Single column below `sm`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.2] — AC text: 4 `Profile.principles[]` in `<ComputedStylesPanel>`, hairline grid, label-left/value-right, `useInView({ once: true })`, instant under reduced motion, `<h2>`, no second `<h1>`.
- [Source: _bmad-output/planning-artifacts/epics.md:38] — FR-011 (principles = scroll-revealed Computed-styles panel, **not** a card marquee).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:681-688] — `<ComputedStylesPanel>` purpose/anatomy/use-sites (principles panel on `/`).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:796] — "Principles render as Computed-styles panel (property:value cells, hairline-grid, scroll-revealed) — *not* a card marquee."
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:873] — reduced motion: "Computed-styles panel scroll reveals: rendered visible at mount."
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:366,814] — `sm:grid-cols-2` for principles; tablet 2-column.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:929] — `useInView({ once: true })` for scroll reveals; don't re-run on backscroll.
- [Source: _bmad-output/planning-artifacts/architecture.md:193-218] — RSC-by-default, deep client boundary, `useShouldAnimate` single-source helper.
- [Source: components/computed-styles-panel.tsx] — the wrapper to compose (renders a hardcoded `<div>`; `...props` spread; `cn`-merged `className`; `direction` variant). Test style: `components/computed-styles-panel.test.tsx`.
- [Source: components/xp-bar.tsx:13, components/inspect-me-cta.tsx:17,33] — established `useShouldAnimate()` gating pattern with `framer-motion`.
- [Source: lib/content/profile.ts:16-22,43,47] — `ProfileSchema.principles` shape `{ key, title, body }` (all `.min(1)`); `principles: []` content gap; `profile` parsed singleton + `Profile` type.
- [Source: app/(chrome)/page.tsx] — current hero Server Component to extend below the fold (preserve `metadata` + single `<h1>`).
- [Source: _bmad-output/implementation-artifacts/3-1-elements-hero-with-identity-and-inspect-me-cta.md] — prior story: how the content gap (`profile.name`) was authored, the Server-page + deep-client-child split, the `useShouldAnimate` motion discipline, and that `<ComputedStylesPanel>` "belongs to Story 3.2 (principles)".
- [Source: _bmad-output/project-context.md] — token/RTL/a11y/testing/anti-pattern rules; `framer-motion` (not `motion/react`); semantic tokens; named exports; `page.tsx` default export; `useInView({ once: true })`.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- **Story 3.2 implementation complete.** All 5 tasks finished; all acceptance criteria satisfied.
- **Content authored:** 4 principles written in Hossam's senior-FE voice (restraint, precision, accessibility, systems). No schema change needed — `ProfileSchema.parse` passes.
- **Scroll reveal:** `useInView({ once: true })` + `motion.div` with opacity/y transform only. Gated by `useShouldAnimate()` — panel renders fully visible at mount when reduced motion is preferred.
- **Semantics:** `<section aria-labelledby>` → `<h2>` → `<ComputedStylesPanel sm:grid-cols-2>` → `<h3>` title + `<p>` body per cell. No second `<h1>` introduced.
- **Reuse:** Composed existing `ComputedStylesPanel`/`ComputedStylesCell` and `useShouldAnimate`; no fork or reinvention.
- **Gates green:** `yarn typecheck` ✓, `yarn lint` ✓, `yarn test:run` ✓ (38 tests passed), `yarn format` ✓.

### File List

- `lib/content/profile.ts` — Updated: populated `principles` with 4 authored entries.
- `components/principles-panel.tsx` — New: `"use client"` scroll-reveal principles panel, composes `ComputedStylesPanel`/`ComputedStylesCell`.
- `components/principles-panel.test.tsx` — New: colocated tests for heading levels, content rendering.
- `app/(chrome)/page.tsx` — Updated: mounted `PrinciplesPanel` below hero section; stays Server Component.
