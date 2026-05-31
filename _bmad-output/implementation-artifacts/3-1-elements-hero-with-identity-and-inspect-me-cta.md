# Story 3.1: Elements hero with identity and "Inspect me" CTA

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want a strong hero with name, role, tagline, and a primary CTA,
so that I grasp who this is within seconds of landing.

## Acceptance Criteria

1. **(FR-010 — identity + h1)** When `/` renders, it shows `profile.name` as the **single `<h1>`** styled `text-[clamp(2rem,10vw,6rem)] font-semibold leading-[0.95] tracking-tight font-title` (Fraunces), plus `profile.role` and `profile.tagline` as supporting text. There is exactly one `<h1>` on the page.
2. **(FR-010 / UX-DR3 — the one CTA)** The hero renders an **"Inspect me" Primary CTA** — the single lime CTA on the surface (`bg-lime/10 border-lime/50 text-lime hover:bg-lime hover:text-lime-foreground`). No other lime/primary CTA appears on `/`.
3. **(FR-013 — signature texture)** The hero background composites `.bg-grid` **at `opacity-40`** and `.bg-scan` **at `opacity-60`**, dark-only. The texture is decorative (`aria-hidden`) and sits behind the content, not over the text.
4. **(Forward-compatible CTA seam, NOT a no-op)** "Inspect me" is wired to a **stable open-palette seam** that Epic 5's `<CommandPalette>` fulfills without editing this story's code. Before the palette exists, clicking the CTA **degrades to focusing a visible `⌘K` hint** (not a dead handler, not a thrown error).
5. **(NFR-A — accessibility)** All interactive elements are real semantic elements (the CTA is a `<button>`), reachable by `Tab`, with a visible focus ring. The decorative texture has no accessible name. No second `<h1>`.
6. **(NFR-P5 / UX-DR4 — motion discipline)** Any hero entrance animation animates `transform`/`opacity` only and is gated by `useShouldAnimate()` (renders final state instantly under `prefers-reduced-motion`). A static hero with no entrance animation also satisfies this AC.
7. **Gates green:** `yarn typecheck && yarn lint && yarn test:run` pass; `/` shows no console errors/warnings; theme `D` hotkey and RTL (`dir="rtl"`) still work; mobile (`<640px`) H1 wraps without horizontal overflow.

## Tasks / Subtasks

- [x] **Task 1 — Author the hero on `/` (AC: 1, 2, 3, 5)**
  - [x] Replace the stub in `app/(chrome)/page.tsx`. Keep it a **Server Component** (no `"use client"`) — only the CTA needs interactivity, so extract that into a small client child.
  - [x] Keep the existing `export const metadata` (title `"Elements — devtools://hossam"`); page uses `<section>`, NOT `<main>` (the `(chrome)` layout already owns `<main id="main-content">`).
  - [x] Render `<h1>{profile.name}</h1>` with the Fraunces clamp classes from AC 1; render `profile.role` and `profile.tagline` as supporting copy (role in `font-mono uppercase tracking-wider text-muted-foreground`, tagline in body `text-muted-foreground` per the identity voice).
  - [x] Import `profile` from `@/lib/content/profile` (the validated singleton). Do NOT re-import schemas or re-parse.
  - [x] Add the decorative texture layer: an `aria-hidden` absolutely-positioned `<div>` behind the content stacking `bg-grid opacity-40` and `bg-scan opacity-60` (two layers or one element with both utilities — `.bg-grid`/`.bg-scan` set only `background-image`/`-size`, so they compose). Ensure the hero container is `relative` and content sits in a higher stacking layer.
- [x] **Task 2 — Stable "open palette" seam (AC: 4)**
  - [x] Create `lib/command-palette/bus.ts` mirroring the `lib/xp/bus.ts` module style (named consts, pure functions, SSR-guarded). Export a registration seam so Epic 5 can plug in without touching the hero.
  - [x] Add a colocated `lib/command-palette/bus.test.ts`: register → `openCommandPalette()` calls the opener and returns `true`; after unsubscribe, it returns `false` and invokes the passed fallback.
- [x] **Task 3 — "Inspect me" CTA client child (AC: 2, 4, 5, 6)**
  - [x] Create `components/inspect-me-cta.tsx` (`"use client"`, named export, kebab-case file). Compose the shadcn `<Button>` (`@/components/ui/button`) — do NOT hand-roll a button — with the Primary-CTA lime classes via `className` (AC 2 palette). Label: `Inspect me`.
  - [x] Render a visible `⌘K` hint as a focusable `<kbd>`-styled affordance beside/below the CTA: `rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px]` per the UX `<kbd>` token. Give it a ref.
  - [x] `onClick`: `openCommandPalette(() => hintRef.current?.focus())` — real palette opens it once Epic 5 registers; until then focus moves to the `⌘K` hint (observable, non-dead).
  - [x] Gate any micro-interaction (e.g. hover pulse) behind `useShouldAnimate()`; transform/opacity only.
- [x] **Task 4 — Verify & gate (AC: 7)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` all green; `yarn format`.
  - [x] `yarn dev` → load `/`: confirm single `<h1>`, one lime CTA, texture behind text, `Tab` reaches CTA with focus ring, `D` toggles theme (dark-only toast), `<html dir="rtl">` doesn't break layout, and `<640px` H1 wraps with no horizontal scroll.

## Dev Notes

### What this story is (and is NOT)
- **IS:** the `/` (Elements) **hero only** — name/role/tagline + "Inspect me" CTA + signature texture.
- **IS NOT:** principles (Story 3.2 — `ComputedStylesPanel`), the stack marquee (Story 3.3), the real ⌘K palette (Epic 5). Do not build those here. The CTA's job is to expose a *stable seam*, not the palette.

### ⚠️ Critical content gap — `profile.name` is currently `""`
`lib/content/profile.ts` ships with `name: ""`, `location: ""`, `principles: []`, `metrics: []` (placeholder authoring). AC 1 requires `profile.name` as the `<h1>`, so an empty `name` yields an **empty h1** — a real bug for identity + SEO.
- **The existing chrome works around this** with `profile.name?.trim() || "Hossam Marey"` (`components/devtools-chrome.tsx:50`). A hardcoded fallback is acceptable for the chrome's small label but **weak for the hero `<h1>`**.
- **Preferred resolution:** populate `rawProfile.name` (and `location` if surfaced) with the real value in `lib/content/profile.ts` so the h1 is authored content, not a fallback. `tagline` and `role` are already populated.
- This is flagged as an open question below — do not silently ship an empty h1. If content isn't provided, mirror the chrome's `|| "Hossam Marey"` fallback so the h1 is never empty, and note it.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `app/(chrome)/page.tsx` | **UPDATE** (replace stub) | Stays a Server Component; keeps `metadata`; uses `<section>` not `<main>`. |
| `components/inspect-me-cta.tsx` | **NEW** | `"use client"`, named export, composes `<Button>`. |
| `lib/command-palette/bus.ts` | **NEW** | Stable open-palette seam (mirrors `lib/xp/bus.ts`). |
| `lib/command-palette/bus.test.ts` | **NEW** | Register/open/unsubscribe + fallback. |
| `lib/content/profile.ts` | **UPDATE (likely)** | Author `name` (+ `location`) — see content gap above. |

### Current state of `app/(chrome)/page.tsx` (being replaced)
It is a 14-line stub: a Server Component exporting `metadata` and a `<section className="p-4">` with a placeholder `<h1 className="font-mono text-lg">Elements</h1>` + muted paragraph. **What must be preserved:** the `metadata` export and the Server-Component nature. **What changes:** the body becomes the real hero; the h1 becomes the Fraunces identity h1 (drop `font-mono text-lg`).

### Reuse — do NOT reinvent
- **`<Button>`** (`@/components/ui/button`) — compose it with `className` for the lime Primary tier. Don't write a raw `<button>` with bespoke styling.
- **`<ComputedStylesPanel>`** exists (`@/components/computed-styles-panel`) but belongs to Story 3.2 (principles), **not** this hero.
- **`useShouldAnimate()`** (`@/hooks/use-should-animate`) is the single source of truth for reduced motion — import it; never call `useReducedMotion()` directly in feature code (ARCH-4 / UX-DR4).
- **`profile`** singleton from `@/lib/content/profile` — already Zod-validated at module load; import the value, not the schema.
- **`.bg-grid` / `.bg-scan`** already exist in `app/globals.css` (defined as `@utility`, lines ~284–299) — they were authored "defined, not applied" expressly for this story. Apply them; do not redefine.
- **`framer-motion`** (NOT `motion/react`) if you add any animation — the `motion` package is not installed (project-context anti-pattern).

### Architecture / project-context guardrails (must follow)
- **Semantic tokens only** — `text-foreground`, `text-muted-foreground`, `border-hairline`, `bg-lime`, `text-lime`. **No hardcoded hex/oklch** in JSX.
- **RSC by default; push `"use client"` deep** — the page stays a Server Component; only `inspect-me-cta.tsx` is a client component (it has an `onClick` + ref + reduced-motion hook).
- **Named exports** for components; `page.tsx` keeps its **default export** (Next.js requirement).
- **`import type`** for type-only imports (`isolatedModules`). **No `import React`** (jsx runtime).
- **RTL:** use logical utilities (`ms-`, `me-`, `ps-`, `pe-`, `text-start`) — never `ml-`/`mr-`/`left-`/`right-`. The clamp h1 is fine; just keep any spacing logical.
- **A11y:** one `<h1>` per route; visible `focus-visible` ring on the CTA (the shadcn `<Button>` provides `focus-visible:ring-*` already — keep it); decorative texture `aria-hidden`.
- **Prettier:** no semicolons, double quotes, 2-space, classes inside `cn()`/`cva()` auto-sort — wrap dynamic class strings in `cn()`.

### The "Inspect me" seam — why a registration bus, not just a CustomEvent
FR-010 says the CTA "opens the ⌘K palette." Epic 5 owns the palette. The AC explicitly forbids a forward-dependent **no-op**. A bare `dispatchEvent("hm:open-palette")` with no listener *is* a silent no-op today. The `registerPaletteOpener`/`openCommandPalette(fallback)` pattern (above):
- gives Epic 5 a one-line plug-in (`registerPaletteOpener(() => setOpen(true))` in the palette's mount effect) with **zero edits to the hero**, and
- makes the v1 behavior **observable** (focus jumps to the `⌘K` hint) so reviewers and users see a real response.
It mirrors the established `lib/xp/bus.ts` seam style (named event const + pure, SSR-guarded functions), keeping the "no state library, in-browser bus" architecture (FR-078) intact.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true` (don't import `describe/it/expect`), env `jsdom`, setup `tests/setup.ts`. `@/` alias works in tests.
- **Colocate** tests next to source (`bus.test.ts` beside `bus.ts`; optional `inspect-me-cta.test.tsx` beside the component).
- Query **by role/label/text** (`getByRole("heading", { level: 1 })`, `getByRole("button", { name: /inspect me/i })`) — avoid `getByTestId`.
- Use `userEvent.setup()` (not `fireEvent`) for the CTA click.
- **Don't test** Tailwind class strings, shadcn primitives, or `next/font`/framework behavior. **Do test** the `bus.ts` seam (register/open/unsubscribe/fallback) and, if useful, that `/`'s hero exposes exactly one h1 and one "Inspect me" button.
- Mirror the existing `components/computed-styles-panel.test.tsx` style for any component test.

### Project Structure Notes
- Routes live under `app/(chrome)/`; `/` = `app/(chrome)/page.tsx`. The `(chrome)` layout (`app/(chrome)/layout.tsx`) already renders `<main id="main-content">`, the skip link, `<DevToolsChrome>`, `AnimatePresence` page-swap, and `<MobileBottomNav>` — **do not** add another `<main>`, skip link, or chrome here.
- New cross-cutting bus → `lib/command-palette/` (sibling of `lib/xp/`), matching the architecture's `lib/<domain>/` layout.
- Page-swap fade is already owned by the layout's `AnimatePresence`; a hero-internal entrance animation is optional and must not double-run with it.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 3.1] — AC text (h1 clamp/Fraunces, Inspect-me CTA, bg-grid/bg-scan opacities, non-no-op degrade).
- [Source: _bmad-output/planning-artifacts/epics.md#F2] — FR-010 (name h1 + role + tagline + CTA opens ⌘K), FR-013 (texture opacities).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:355] — Hero H1 token (`clamp(2rem,10vw,6rem) font-semibold leading-[0.95] tracking-tight font-title`, Fraunces).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:370] — Hero background `.bg-grid` (48px @4%) + `.bg-scan` (scanlines @2%), `opacity-40`/`opacity-60`, dark-only.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:679] — "Inspect me CTA on `/` opens" the palette; reduced motion = opacity only.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:722] — Primary CTA token (`bg-lime/10 border-lime/50 text-lime hover:bg-lime hover:text-lime-foreground`, one per surface).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:361] — `<kbd>` token for the ⌘K hint.
- [Source: _bmad-output/planning-artifacts/architecture.md:193-218] — route-group chrome split, RSC-by-default, deep client boundary, in-browser buses (no state lib), `useShouldAnimate`/`isTypingTarget` single-source helpers.
- [Source: _bmad-output/project-context.md] — token/RTL/a11y/testing/anti-pattern rules; `framer-motion` (not `motion/react`); semantic tokens; named exports; `page.tsx` default export.
- [Source: lib/xp/bus.ts] — bus module style to mirror for `lib/command-palette/bus.ts`.
- [Source: components/devtools-chrome.tsx:50] — existing `profile.name || "Hossam Marey"` fallback pattern (content-gap context).
- [Source: app/(chrome)/layout.tsx] — `<main>`/skip-link/chrome ownership; do not duplicate.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- Populated `profile.name` ("Hossam Marey"), `profile.location` ("Egypt"), and `profile.years` (8) in `lib/content/profile.ts` to resolve the empty-h1 content gap.
- Implemented hero as Server Component (`app/(chrome)/page.tsx`) with `<section>` (not `<main>`); extracted interactive CTA to `components/inspect-me-cta.tsx` client child.
- Hero renders single `<h1>` with `clamp(2rem,10vw,6rem)` Fraunces title, role in mono uppercase, tagline in body muted-foreground.
- Decorative texture composites `.bg-grid opacity-40` + `.bg-scan opacity-60` in `aria-hidden` absolutely-positioned divs behind content (z-10 separation).
- "Inspect me" CTA uses shadcn `<Button>` with lime palette (`bg-lime/10 border-lime/50 text-lime hover:bg-lime hover:text-lime-foreground`) — the only lime CTA on `/`.
- Stable open-palette seam (`lib/command-palette/bus.ts`) mirrors `lib/xp/bus.ts` style: `registerPaletteOpener` / `openCommandPalette(fallback)`. Returns `true` if opener handled it, `false` + calls fallback otherwise.
- `⌘K` hint is a focusable `div` beside the CTA; when no palette is registered, clicking CTA focuses the hint (observable degrade, not a no-op).
- Hover micro-interaction (scale 1.02) gated behind `useShouldAnimate()`; transforms only.
- All gates green: `yarn typecheck`, `yarn lint`, `yarn test:run` (34 tests pass), `yarn format`.

### File List

| File | Status | Notes |
|---|---|---|
| `app/(chrome)/page.tsx` | modified | Hero section with h1, role, tagline, texture layers, CTA import |
| `components/inspect-me-cta.tsx` | created | Client component: Button + ⌘K hint + openCommandPalette seam |
| `lib/command-palette/bus.ts` | created | Registration seam for Epic 5 palette |
| `lib/command-palette/bus.test.ts` | created | Tests: SSR, register/open, unsubscribe, fallback, re-registration |
| `lib/content/profile.ts` | modified | Populated name, location, years fields |

### Review Findings

_Code review 2026-05-31 (Blind Hunter + Edge Case Hunter + Acceptance Auditor). All 7 ACs PASS; findings below are hardening/quality. Triage: 1 decision, 5 patch, 3 defer, 3 dismissed._

- [x] [Review][Decision→Patch] `⌘K` hint was mac-only for every visitor — RESOLVED: added platform-aware `⌘`/`Ctrl` detection via `navigator.platform` with a `useEffect` mount gate (server + first paint render `⌘`, no hydration mismatch). [components/inspect-me-cta.tsx:13-17,42]
- [x] [Review][Patch] `openCommandPalette` calls `opener()` with no try/catch — a throwing palette opener (Epic 5) propagates through the CTA `onClick` and the fallback never runs; wrapped and falls back on throw. [lib/command-palette/bus.ts:14-21]
- [x] [Review][Patch] `ProfileSchema.name` is `z.string()` (no `.min(1)` like `role`/`tagline`) — an empty `name` passes parse and yields an empty `<h1>`, the exact content-gap this story flagged; added `.min(1)`. [lib/content/profile.ts:4]
- [x] [Review][Patch] CTA composes `<Button variant="outline">`, whose `dark:bg-input/30` / `dark:hover:bg-input/50` base is a different tailwind-merge key than `bg-lime/10`, so it is NOT merged away on the dark-only site; added explicit `dark:bg-lime/10 dark:hover:bg-lime`. [components/inspect-me-cta.tsx:28]
- [x] [Review][Patch] Hover micro-interaction used `transition-all` while only `scale` animates — tightened to `transition-transform` per UX-DR4 motion discipline. [components/inspect-me-cta.tsx:30]
- [x] [Review][Patch] SSR test set `globalThis.window = undefined` and restored it inline; if the assertion threw, `window` stayed undefined and corrupted later tests — wrapped restore in `try/finally`. [lib/command-palette/bus.test.ts:10-17]
- [x] [Review][Defer] User-facing résumé skill typos in experience data (`"Nuxt,js"`, `"Ant.Design"`, `"TailwindCss"`) — deferred, pre-existing (not introduced by this story). [lib/content/experience.ts]
- [x] [Review][Defer] `profile.email` is `""` while neighbors were populated — deferred, pre-existing; author when contact surfaces land (Epic 6). [lib/content/profile.ts:38]
- [x] [Review][Defer] Single-opener seam polish — `registerPaletteOpener` last-writer-wins clobber, empty-`beforeEach` test isolation, and unused exported `PALETTE_OPEN_EVENT` const — deferred, acceptable for a single-consumer seam; revisit when Epic 5 wires the real palette. [lib/command-palette/bus.ts]
