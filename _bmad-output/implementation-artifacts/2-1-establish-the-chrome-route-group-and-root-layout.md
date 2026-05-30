# Story 2.1: Establish the `(chrome)` route group and root layout

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want a single persistent app frame across the five DevTools tabs,
So that moving between panels feels like one coherent tool, not a multi-page site.

## Context & Orientation (read first)

This is the **first story of Epic 2 (Chrome & Navigation)** and follows the completion of Epic 1 (Foundation). Epic 1 delivered:
- `app/globals.css` with Obsidian + Signal Lime tokens, `.bg-grid`/`.bg-scan`, `::selection`
- `hooks/use-should-animate.ts` (reduced-motion gate)
- `lib/keyboard.ts` (`isTypingTarget()`)
- `components/computed-styles-panel.tsx` (universal panel idiom)
- Cleanup: Dexie removed, legacy data archived

**This story's scope is structural: the route-group split that makes persistent chrome possible.** The actual chrome UI (identity strip, tab row, mobile bottom bar, XP bar) lands in Stories 2.2–2.5. What we build here is the **shell** — the `(chrome)` route group, the layout that mounts once, the `AnimatePresence` page transitions, and stub pages for every route so the navigation topology is navigable end-to-end.

**Scope fence — what this story does NOT do:**
- It does NOT build the identity strip or tab navigation (Story 2.2)
- It does NOT build the mobile bottom tab bar (Story 2.3)
- It does NOT wire the `D` hotkey dark-only toast (Story 2.4)
- It does NOT build the XP bus or bar (Story 2.5)
- It does NOT populate real content in any page (Epics 3–6)
- It does NOT implement the Recruiter Mode toggle logic (Epic 6)

## Acceptance Criteria

**AC1 — Route group topology matches architecture.**
**Given** ARCH-2 routing topology
**When** the directory structure is created
**Then** `app/(chrome)/layout.tsx` exists and renders a `<DevToolsChrome>` component wrapping `<main>` for the 6 chrome'd routes (`/`, `/work`, `/work/[slug]`, `/console`, `/perf`, `/sources`), while `app/recruiter/page.tsx` lives **outside** the `(chrome)` group, and `app/layout.tsx` (root) contains only global concerns (`<html>`, `ThemeProvider`, fonts, `<Toaster>`, `KonamiListener` placeholder) with **no** `<main>` element.

**AC2 — Chrome layout mounts once with AnimatePresence transitions.**
**Given** FR-001 + NFR-A3 + UX-DR4
**When** a user navigates between chrome'd tabs via `<Link>`
**Then** the chrome DOM identity is retained (no re-mount/flicker), the page slot swaps inside `motion/react` `<AnimatePresence mode="wait">` with 0.2s fade-in / 0.15s fade-out (easeOut), and under reduced motion the transition is instant (duration collapsed to `0.001s` via `useShouldAnimate()`).

**AC3 — Static-first rendering with zero console errors.**
**Given** NFR-P2 + NFR-A4
**When** any chrome'd tab is hard-refreshed
**Then** the chrome + content paint without JS and hydration adds interactivity with zero console errors or warnings. Every route exports valid metadata (at minimum a `title` string ≤60 chars).

**AC4 — Skip-to-content link exists.**
**Given** UX-DR6 + NFR-A4
**When** the chrome layout renders
**Then** the first focusable element in `<body>` is a visually-hidden-until-focused "Skip to content" link that jumps focus past the chrome to `<main id="main-content">`.

**AC5 — Stub pages for all routes are navigable.**
**Given** the route topology
**When** each route is visited directly
**Then** it renders without 404s: `/` (Elements), `/work` (Network), `/work/[slug]` (case study, at least one slug from `lib/content/projects.ts`), `/console` (Console), `/perf` (Performance), `/sources` (Sources), `/recruiter` (Recruiter Mode).

**AC6 — Build and checks remain green.**
**Given** all structural changes
**When** `yarn typecheck && yarn lint && yarn test:run && yarn build` run
**Then** all pass with no new errors/warnings.

## Tasks / Subtasks

- [x] **Task 1 — Update root layout (AC1, AC3)**
  - [x] Remove `<main>` from `app/layout.tsx` (chrome layout will own it)
  - [x] Add `<Toaster />` from `@/components/ui/sonner` to root layout
  - [x] Ensure `suppressHydrationWarning` remains on `<html>`
  - [x] Add `dir="ltr"` to `<html>` (RTL swap infra exists in CSS; no UI toggle in v1)

- [x] **Task 2 — Create `(chrome)` route group and layout (AC1, AC2, AC4)**
  - [x] Create `app/(chrome)/layout.tsx` (default export)
  - [x] Import `DevToolsChrome` from `@/components/devtools-chrome`
  - [x] Wrap `{children}` in `<main id="main-content">`
  - [x] Add `<AnimatePresence mode="wait">` around children with `useShouldAnimate()` gating
  - [x] Add skip-to-content link as first child of `<body>` (before chrome)

- [x] **Task 3 — Create stub pages (AC5)**
  - [x] `app/(chrome)/page.tsx` — Elements home (move/adapt existing `app/page.tsx` or create new; must default-export, include `metadata`)
  - [x] `app/(chrome)/work/page.tsx` — Network waterfall stub
  - [x] `app/(chrome)/work/[slug]/page.tsx` — Case study stub (use `generateStaticParams` with at least one slug from `lib/content/projects.ts`)
  - [x] `app/(chrome)/console/page.tsx` — Console stub
  - [x] `app/(chrome)/perf/page.tsx` — Performance stub
  - [x] `app/(chrome)/sources/page.tsx` — Sources stub
  - [x] `app/recruiter/page.tsx` — Recruiter Mode stub (outside `(chrome)` group)

- [x] **Task 4 — Create `DevToolsChrome` shell component (AC1, AC2)**
  - [x] Create `components/devtools-chrome.tsx` (named export)
  - [x] Render `<header>` + `<nav aria-label="DevTools tabs">` structure
  - [x] Include 5 tab `<Link>` entries: `/`, `/work`, `/console`, `/perf`, `/sources`
  - [x] Active tab derived from `usePathname()` with `border-b-2 border-lime` / `aria-current="page"`
  - [x] Inactive tabs: `text-muted-foreground border-b-2 border-transparent`
  - [x] Keep the component minimal — identity strip details and mobile bottom bar come in later stories

- [x] **Task 5 — Delete old `app/page.tsx` (AC1)**
  - [x] Remove `app/page.tsx` (superseded by `app/(chrome)/page.tsx`)

- [x] **Task 6 — Verify gates (AC6)**
  - [x] `yarn typecheck` → clean
  - [x] `yarn lint` → clean (or only pre-existing warnings)
  - [x] `yarn test:run` → passes
  - [x] `yarn build` → succeeds
  - [x] Browser spot-check: click between tabs, verify no chrome re-mount, no console errors

## Dev Notes

### Architecture context

**The route-group split is the central architectural decision.** `app/(chrome)/layout.tsx` owns the persistent chrome; `app/recruiter/page.tsx` lives outside it so Recruiter Mode is a **real unmount**, not CSS-hidden (FR-101). The root `app/layout.tsx` owns truly global concerns that must exist on `/recruiter` too (theme, fonts, toaster, Konami listener).

**RSC by default; client boundary only where needed.** The chrome layout and `DevToolsChrome` component need `usePathname()` and `motion/react` — so they are client components. Pages inside `(chrome)/` can be RSC (server components) unless they need client features.

**AnimatePresence discipline:**
- Import from `framer-motion` (NOT `motion/react` — the `motion` package is not installed; decision 2026-05-30)
- Use `mode="wait"` so the old page exits before the new one enters
- Each page inside `(chrome)/` should be wrapped in a `motion.div` with `initial`, `animate`, `exit` props
- Duration: 0.2s enter / 0.15s exit under motion; 0.001s under reduced motion

### What is being changed

1. **Root layout (`app/layout.tsx`)** — Remove `<main>` wrapper, add `<Toaster />`, keep `ThemeProvider` + `TooltipProvider` + fonts.
2. **Chrome layout (`app/(chrome)/layout.tsx`)** — New file. Default-export layout. Wraps children in `<main id="main-content">` with `AnimatePresence`.
3. **Stub pages** — Minimal valid Next.js pages with `metadata` export. No real content yet.
4. **`DevToolsChrome` component** — Minimal shell with tab links. Full chrome UI (identity strip, XP bar slot, mobile bottom bar) comes in Stories 2.2–2.5.
5. **Old `app/page.tsx`** — Deleted (moved into `(chrome)` group).

### Files being modified — READ BEFORE EDITING

**`app/layout.tsx` (UPDATE)**
- Current state: renders `<html>` with `ThemeProvider` + `TooltipProvider` + `<main>`
- What changes: Remove `<main>` wrapper around `{children}`; add `<Toaster />` after `TooltipProvider`
- What must be preserved: `suppressHydrationWarning`, `fontVariables`, `cn()` class merging, `dir` attribute on `<html>`

**`app/page.tsx` (DELETE)**
- Current state: minimal "hello" page
- Action: Delete entirely (replaced by `app/(chrome)/page.tsx`)

### Files being created

- `app/(chrome)/layout.tsx` — Chrome layout (default export, `"use client"`)
- `app/(chrome)/page.tsx` — Elements home (default export, `metadata` export)
- `app/(chrome)/work/page.tsx` — Network stub
- `app/(chrome)/work/[slug]/page.tsx` — Case study stub with `generateStaticParams`
- `app/(chrome)/console/page.tsx` — Console stub
- `app/(chrome)/perf/page.tsx` — Performance stub
- `app/(chrome)/sources/page.tsx` — Sources stub
- `app/recruiter/page.tsx` — Recruiter stub (outside chrome group)
- `components/devtools-chrome.tsx` — Chrome shell component (named export, `"use client"`)

### Project guardrails that bite in this story

- **`@/*` maps to project root** — not `src/`. All imports use `@/components/...`, `@/lib/...`, `@/hooks/...`
- **`framer-motion` import** — NOT `motion/react`. The `motion` package is not installed. Use `import { motion, AnimatePresence } from "framer-motion"`
- **`useShouldAnimate()`** — Every animation must gate through this hook. Collapse duration to `0.001s` when false.
- **Named exports only** for components (except `page.tsx`/`layout.tsx` which MUST default-export)
- **No `import React`** — JSX runtime is `react-jsx`
- **Semantic HTML** — `<header>` for identity strip, `<nav aria-label="DevTools tabs">` for tab row, `<main id="main-content">` for page content
- **Skip-to-content link** — First focusable element in body, visually hidden until focused (`sr-only focus:not-sr-only` or equivalent)
- **Metadata on every route** — At minimum `export const metadata = { title: "..." }` with title ≤60 chars

### Testing standards for this story

- **No new unit tests required** — this story is structural routing/layout. The existing test harness validates nothing is broken.
- **Verification = gate checks + browser spot-check**
- **Browser spot-check list:**
  1. Navigate to `/` — chrome renders, "hello" or placeholder content visible
  2. Click each tab link — URL updates, content swaps, chrome does NOT flicker/re-mount
  3. Hard-refresh on `/work` — paints immediately, no JS required for initial paint
  4. Press `Tab` — skip-to-content link appears, Enter jumps to main content
  5. Toggle OS reduced motion — tab switches become instant
  6. Open `/recruiter` — chrome is absent entirely (not hidden)
  7. Console has zero errors/warnings

### Technical Requirements

**Route group structure:**
```
app/
├── layout.tsx           # Root: global providers, NO chrome, NO <main>
├── (chrome)/
│   ├── layout.tsx       # Chrome layout: DevToolsChrome + <main> + AnimatePresence
│   ├── page.tsx         # /  (Elements)
│   ├── work/
│   │   └── page.tsx     # /work  (Network)
│   ├── work/[slug]/
│   │   └── page.tsx     # /work/[slug]  (Case study)
│   ├── console/
│   │   └── page.tsx     # /console  (Console)
│   ├── perf/
│   │   └── page.tsx     # /perf  (Performance)
│   └── sources/
│       └── page.tsx     # /sources  (Sources)
└── recruiter/
    └── page.tsx         # /recruiter  (Recruiter Mode — outside chrome)
```

**`app/(chrome)/layout.tsx` requirements:**
- Must be `"use client"` (uses `usePathname` from `next/navigation` and `motion/react`)
- Default export (Next.js requirement)
- Renders `<DevToolsChrome />` above the page slot
- Wraps `{children}` in `<main id="main-content">`
- Wraps children in `<AnimatePresence mode="wait">`
- Each child page should be wrapped in a `motion.div` with fade transition props

**`app/layout.tsx` requirements (root):**
- Keep `<html lang="en" dir="ltr" suppressHydrationWarning className={...}>`
- Keep `ThemeProvider` + `TooltipProvider`
- Add `<Toaster />` from `@/components/ui/sonner`
- Remove `<main>` — chrome layout owns it now
- Children pass-through directly: `{children}`

**`components/devtools-chrome.tsx` requirements:**
- Named export: `export function DevToolsChrome()`
- `"use client"` (uses `usePathname` from `next/navigation`)
- Renders `<header>` containing identity strip placeholder + `<nav aria-label="DevTools tabs">`
- Tab links use `next/link` `<Link>` component
- 5 tabs: `/` (Elements), `/work` (Network), `/console` (Console), `/perf` (Performance), `/sources` (Sources)
- Active tab: `border-b-2 border-lime text-foreground` + `aria-current="page"`
- Inactive tab: `border-b-2 border-transparent text-muted-foreground hover:text-foreground`
- Tab text: `font-mono text-xs uppercase tracking-wider`
- Minimal for this story — full identity strip and mobile bottom bar come later

**Stub page pattern (apply to all):**
```tsx
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Elements — devtools://hossam",
}

export default function ElementsPage() {
  return (
    <section>
      <h1>Elements</h1>
      <p>Stub content for Elements panel.</p>
    </section>
  )
}
```

**`/work/[slug]` stub:**
```tsx
import type { Metadata } from "next"
import { projects } from "@/lib/content/projects"

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export const metadata: Metadata = {
  title: "Project Detail — devtools://hossam",
}

export default function CaseStudyPage({ params }: { params: { slug: string } }) {
  return (
    <section>
      <h1>Case Study: {params.slug}</h1>
      <p>Stub content for case study detail.</p>
    </section>
  )
}
```

### Previous-Story Intelligence (Epic 1)

- **`yarn test:run` passes (10 tests, 3 files)** — do not break the harness [Story 1.3, 1.4]
- **`'inter' unused` lint warning in `app/layout.tsx`** — pre-existing, expected [Story 1.1–1.4]
- **`yarn format` reflows ~15 pre-existing non-Prettier-clean files** — avoid repo-wide format; format only this story's new/modified files [Story 1.1–1.3]
- **Semantic tokens only** — `bg-background`, `text-foreground`, `border-hairline`, `font-mono`, `text-muted-foreground` [Story 1.1]
- **No hardcoded hex/oklch in JSX** — all colors via tokens [Story 1.1]
- **Font variables from `lib/font.ts`** — use `fontVariables` on `<html>` and token-based `font-family` [Story 1.1]
- **`useShouldAnimate()` pattern** — returns `!useReducedMotion()`, collapse duration to `0.001s` when false [Story 1.3]
- **`isTypingTarget()` from `lib/keyboard.ts`** — shared guard for global hotkeys [Story 1.3]
- **`ComputedStylesPanel` + `ComputedStylesCell`** — universal panel wrapper for later epics [Story 1.3]
- **Conventional Commits** — `feat:` for new features, `chore:` for structural moves [project-context.md]

### Architecture Compliance

**Routing topology (ARCH-2):**
- `(chrome)` group holds 6 chrome'd routes
- `/recruiter` lives outside the group
- Root layout has NO chrome

**State management (ARCH-3):**
- No state-management library
- `localStorage` mode bus + `CustomEvent("hm:xp")` — not yet implemented in this story
- Storage I/O confined to hooks — not yet implemented

**Component composition (ARCH-7):**
- RSC by default; `"use client"` only where hooks/browser APIs needed
- Push client boundary as deep as possible

**Performance (NFR-P2, NFR-P5, NFR-P6):**
- `transform`/`opacity`-only animation
- Code-split heavy routes via `dynamic()` — deferred to later stories
- `<100ms` interaction latency

**Accessibility (NFR-A1–A4):**
- WCAG 2.1 AA
- Full keyboard nav
- `prefers-reduced-motion` gates every animation
- Semantic HTML: `<header>`, `<nav>`, `<main>`, `<h1>`
- Skip-to-content link

### Library / Framework Requirements

| Library | Version | Usage |
|---|---|---|
| Next.js | 16.1.7 | App Router, route groups, `generateStaticParams` |
| React | 19.2.4 | Server Components by default |
| framer-motion | 12.40.0 | `AnimatePresence`, `motion.div` — import from `framer-motion` |
| next-themes | 0.4.6 | Already mounted in root layout |
| Tailwind CSS | 4.2.1 | Semantic tokens only |
| lucide-react | 1.16.0 | Icons for tabs (optional in this story) |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.1] — story statement + ACs
- [Source: _bmad-output/planning-artifacts/architecture.md#Routing topology] — route-group chrome split diagram
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — state management, component architecture, performance
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#2.2 User Mental Model] — DevTools tab mental model
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] — mobile bottom tab bar (deferred to Story 2.3)
- [Source: _bmad-output/project-context.md#Framework-Specific Rules] — Next.js App Router rules, RSC discipline, import ordering
- [Source: _bmad-output/project-context.md#Critical Don't-Miss Rules] — anti-patterns specific to this project
- [Source: _bmad-output/implementation-artifacts/1-4-remove-dropped-infrastructure-and-archive-legacy-plan.md] — previous story completion notes

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

- `yarn typecheck` → pass (clean after clearing `.next` cache — stale type artifacts from deleted `app/page.tsx`)
- `yarn lint` → pass (0 errors, 0 warnings)
- `yarn test:run` → 10 passed (3 files) — no regression from Epic 1
- `yarn build` → "Compiled successfully"; 31 static pages generated including all 22 case-study slugs from `lib/content/projects.ts`

### Completion Notes List

- **Root layout (`app/layout.tsx`)** — Removed the `<main>` wrapper (chrome layout now owns it), added `<Toaster />` from `@/components/ui/sonner`, kept `suppressHydrationWarning`, added `dir="ltr"` to `<html>`. Also removed the unused `inter` font import (from the original starter), which incidentally fixes the pre-existing `'inter' unused` lint warning.
- **Chrome layout (`app/(chrome)/layout.tsx`)** — Created as a `"use client"` default-export layout. Mounts `<DevToolsChrome />` before `<main id="main-content">`. Wraps page slot in `<AnimatePresence mode="wait">` with fade transitions (0.2s enter / 0.15s exit, `easeOut`), gated by `useShouldAnimate()` (collapses to 0.001s under reduced motion). Includes a skip-to-content link as the first focusable element (`sr-only focus:not-sr-only`).
- **DevToolsChrome (`components/devtools-chrome.tsx`)** — Named-export client component using `usePathname()` for active-tab detection. Renders 5 tab `<Link>` entries with `border-lime` active indicator and `aria-current="page"`. Tab text uses `font-mono text-xs uppercase tracking-wider`. Kept minimal per scope — identity strip and mobile bottom bar deferred to Stories 2.2–2.3.
- **Stub pages** — Created minimal valid pages for all 7 routes: Elements (`/`), Network (`/work`), Console (`/console`), Performance (`/perf`), Sources (`/sources`), case-study detail (`/work/[slug]` with `generateStaticParams` for all 22 projects), and Recruiter Mode (`/recruiter` outside chrome group). Every route exports a `title` ≤60 chars.
- **Route topology** — Matches ARCH-2: `(chrome)` group holds 6 chrome'd routes; `/recruiter` lives outside; root layout has no chrome.

### File List

- `app/layout.tsx` (modified) — removed `<main>`, added `<Toaster />`, added `dir="ltr"`, removed unused `inter` import
- `app/page.tsx` (deleted) — superseded by `app/(chrome)/page.tsx`
- `app/(chrome)/layout.tsx` (created) — chrome layout with AnimatePresence + skip-to-content link
- `app/(chrome)/page.tsx` (created) — Elements home stub
- `app/(chrome)/work/page.tsx` (created) — Network stub
- `app/(chrome)/work/[slug]/page.tsx` (created) — Case study stub with `generateStaticParams`
- `app/(chrome)/console/page.tsx` (created) — Console stub
- `app/(chrome)/perf/page.tsx` (created) — Performance stub
- `app/(chrome)/sources/page.tsx` (created) — Sources stub
- `app/recruiter/page.tsx` (created) — Recruiter stub (outside chrome group)
- `components/devtools-chrome.tsx` (created) — chrome shell component with tab navigation

### Change Log

- 2026-05-30 — Implemented Story 2.1: established `(chrome)` route group and root layout, created DevToolsChrome shell with AnimatePresence page transitions, added skip-to-content link, created stub pages for all 7 routes, verified all gates green. Status → review.

### Review Findings

- [x] [Review][Decision] **AnimatePresence destroys client state on every navigation** — Accepted as designed (option 1). The DevTools tab metaphor intentionally trades persistent client state for clean page transitions. Future stories can add `scrollRestoration` or route-level state persistence if needed. [app/(chrome)/layout.tsx:68]

- [x] [Review][Patch] **Async `params` not awaited (Next.js 15+)** — Fixed: Changed `params` to `Promise<{ slug: string }>`, awaited in both `generateMetadata` and page component. [app/(chrome)/work/[slug]/page.tsx]
- [x] [Review][Patch] **Missing `<main>` landmark on `/recruiter`** — Fixed: Changed `<section>` to `<main>` in `app/recruiter/page.tsx`. [app/recruiter/page.tsx]
- [x] [Review][Patch] **Tab active state fails for nested routes** — Fixed: Extracted `isActiveTab()` helper that checks `pathname === href || pathname.startsWith(href + "/")` for non-root tabs. [components/devtools-chrome.tsx]
- [x] [Review][Patch] **Static metadata on dynamic route** — Fixed: Replaced static `metadata` export with `generateMetadata({ params })` that looks up the project and returns `${project.name} — devtools://hossam`. [app/(chrome)/work/[slug]/page.tsx]
- [x] [Review][Patch] **Invalid slugs render 200 instead of 404** — Fixed: Added `projects.find()` lookup and `notFound()` call when slug doesn't match. [app/(chrome)/work/[slug]/page.tsx]
- [x] [Review][Patch] **Hydration mismatch risk in animation duration** — Fixed: Added `mounted` state (false during SSR/initial render, true after `requestAnimationFrame`). Transition duration uses `mounted ? (animate ? 0.2 : 0.001) : 0.001` to ensure SSR and initial client render are identical. [app/(chrome)/layout.tsx]
- [x] [Review][Patch] **Skip link positioning lacks coordinates** — Fixed: Added `focus:left-0 focus:top-0` to the skip link classes. [app/(chrome)/layout.tsx]
- [x] [Review][Patch] **`DevToolsChrome` defined inline instead of separate file** — Fixed: Extracted to `components/devtools-chrome.tsx` (named export, `"use client"`), imported in layout. [components/devtools-chrome.tsx]
- [x] [Review][Patch] **AnimatePresence transition duration mismatch** — Fixed: Used `variants` with per-state transitions (`animate: 0.2s`, `exit: 0.15s`) instead of single `duration`. [app/(chrome)/layout.tsx]
- [x] [Review][Patch] **Missing `KonamiListener` placeholder** — Fixed: Added `{/* KonamiListener placeholder — Story 2.5 */}` comment in root layout after `TooltipProvider`. [app/layout.tsx]
- [x] [Review][Patch] **Missing identity strip placeholder** — Fixed: Added `devtools://hossam` placeholder `<div>` inside `<header>` before `<nav>`. [components/devtools-chrome.tsx]
- [x] [Review][Patch] **Accessibility label implies tab semantics** — Fixed: Changed `aria-label` from `"DevTools tabs"` to `"DevTools panels"` to reflect page navigation semantics. [components/devtools-chrome.tsx]

- [x] [Review][Defer] **No error or loading boundaries** — No `error.tsx` or `loading.tsx` in chrome group or root. Runtime errors bubble to generic Next.js overlay. [app/(chrome)/, app/recruiter/] — deferred, out of scope
- [x] [Review][Defer] **Zod parse crash at module init** — `projects.ts` runs `ProjectsCollectionSchema.parse()` at top level; invalid data crashes module import. Pre-existing from content migration. [lib/content/projects.ts:391] — deferred, pre-existing
- [x] [Review][Defer] **Missing root `not-found.tsx`** — Unknown routes show default Next.js 404 without chrome styling. [app/not-found.tsx] — deferred, out of scope
- [x] [Review][Defer] **Rapid navigation feels blocked** — `mode="wait"` waits 200ms for exit fade before mounting new content; fast clicks can queue transitions. [app/(chrome)/layout.tsx:67] — deferred, UX tuning
- [x] [Review][Defer] **`<main className="flex-1">` without flex parent** — `flex-1` only works inside a flex container; `<body>` may not establish one. [app/(chrome)/layout.tsx:66] — deferred, layout refinement in later stories
