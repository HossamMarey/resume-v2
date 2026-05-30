---
stepsCompleted: [1, 2, 3, 4]
status: 'complete'
completedAt: '2026-05-30'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md
  - _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - _bmad-output/planning-artifacts/architecture.md
  - _bmad-output/project-context.md
mode: 'do-all-phases-select-recommended'
---

# devtools://hossam — Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for **devtools://hossam** (Hossam Marey's resume + portfolio site), decomposing the PRD requirements, UX Design specification, and Architecture decisions into implementable stories with testable acceptance criteria for the Developer agent.

**Sizing note.** This is a static-first, frontend-only Next.js 16 site with **no backend in v1**. Epics are organized to deliver visible user value incrementally and are aligned to the seven validated PRD build phases (§8). The foundation (Next.js 16 + shadcn vendored, `lib/content/*` Zod migration, font swap) **already exists** — so Epic 1 begins with the design-token rewrite, not project scaffolding (Architecture: "the first story is the `app/globals.css` token rewrite, not a scaffold command").

**XP-spine note.** Per the Architecture Decision-Impact analysis, the XP event bus + `useXP` hook + chrome XP bar are built **early** (Epic 2) so that later epics merely *emit* `hm:xp` events (building on a previous epic) instead of creating forward dependencies. Each XP-granting surface wires only its own grant when that surface is built — the entity-creation-only-when-needed principle applied to gamification.

---

## Requirements Inventory

### Functional Requirements

**F1 — Persistent DevTools Chrome**
- FR-001: Chrome renders on every route except `/recruiter`; tab switches animate via `motion/react` `AnimatePresence mode="wait"`; chrome does not re-mount.
- FR-002: Identity strip shows name + role (left); Recruiter Mode toggle + XP bar (right, `≥sm`); XP bar hidden under Recruiter Mode or `prefers-reduced-motion`.
- FR-003: Tab row shows 5 DevTools tabs; active tab `border-b-2 border-lime`; inactive muted + transparent border.
- FR-004: Mobile chrome uses a bottom tab bar with `env(safe-area-inset-bottom)`; identity strip stays single-row top.

**F2 — Elements (`/`) Hero & Principles**
- FR-010: Hero renders name (H1 `clamp(2rem,10vw,6rem)`), role, tagline, "Inspect me" CTA that opens ⌘K palette.
- FR-011: Principles section — 4 cards from `Profile.principles[]`, rendered as a scroll-revealed Computed-styles panel (not a card marquee).
- FR-012: Stack marquee — animated horizontal scroll of primary tech, pauses on hover, static grid under reduced motion.
- FR-013: Hero background combines `.bg-grid` + `.bg-scan` at `opacity-40`/`opacity-60`, dark-only.

**F3 — Network (`/work`) Project Waterfall**
- FR-020: `/work` renders all projects as a request-waterfall table (desktop grid; mobile card).
- FR-021: Method column = colored badge (GET/POST/PUT/PATCH); decorative metaphor, not semantic typing.
- FR-022: Status column = HTTP-style pill (`200 shipped`/`201 ongoing`/`410 archived`) using status tokens.
- FR-023: Size column renders `size` label; `sizeWeight` (0–1) drives bar fill.
- FR-024: Time column renders `time`; `timeWeight` drives bar width, `startOffset` drives position; bars use `transform: scaleX()` only.
- FR-025: Clicking a row navigates to `/work/[slug]` with a layout-shared transition.
- FR-026: Filter chips by method/status/year, multi-select, URL-persisted via search params.
- FR-027: Empty filter state: "No requests match your filter" + Clear filters.

**F4 — Network Detail (`/work/[slug]`) Case Study**
- FR-030: Case-study route statically generated via `generateStaticParams`; no client fetching.
- FR-031: Layout order: breadcrumb → Problem → Role → Stack → Decisions → Outcomes → Links (non-null filtered).
- FR-032: Metadata: per-slug title/description/OG; JSON-LD `BreadcrumbList`.
- FR-033: Prev/next pager in footer, ordered by declaration order in `lib/content/projects.ts`.
- FR-034: v1 scope = 6 fully-authored case studies; remaining projects waterfall-only.

**F5 — Console (`/console`) REPL**
- FR-040: Real `<input>`-backed REPL; history buffer navigable with ↑/↓.
- FR-041: Command registry: `help`, `whoami`, `projects`, `contact`, `theme`, `clear`, `download resume`, Konami-locked `experimental`; unknown → `command not found`.
- FR-042: Command outputs as specified (help/whoami/projects with flags/contact/theme/download/clear/experimental).
- FR-043: Each successful command grants +5 XP.
- FR-044: Fully keyboard-accessible; multiline paste executes first line only with a notice.

**F6 — Performance (`/perf`) Stats**
- FR-050: Score rings for years/projects/talks/mentees; omit ring entirely if value is 0.
- FR-051: Page-weight budget viz (HTML/JS/CSS/images/fonts) computed at build, embedded as static JSON.
- FR-052: Optional live Lighthouse score easter-egg — deferred to v1.1.

**F7 — Sources (`/sources`) File Tree + Contact**
- FR-060: File tree entries `resume.pdf`, `articles/`, `talks/`, `contact.ts` (articles/talks = "Coming soon" placeholders).
- FR-061: Preview pane: `resume.pdf` → embed + download; `contact.ts` → boss-level form.
- FR-062: Mobile single-pane stack (tree above, preview below).

**F8 — Contact "Boss-Level" Form**
- FR-070: Typed-terminal sequence; validation rendered as passing tests.
- FR-071: Fields name/email/subject/message with Zod schema in `lib/schemas/contact.ts`.
- FR-072: Submit stubbed (faked success 600–1200ms) + sonner toast + +50 XP.
- FR-073: Keyboard-navigable; ↵ advances on valid, ↑ back, Esc clears; errors render as failing tests.

**F9 — XP & Gamification**
- FR-074: XP increments — new tab visit +10, project detail +15, REPL command +5, contact submit +50; persisted in `localStorage["hm_xp_v1"]`.
- FR-075: XP capped at 100; per-action-per-session idempotent; property-tested with `fast-check`.
- FR-076: XP bar in chrome, spring width animation; hidden under Recruiter Mode + reduced motion.
- FR-077: XP toast on each grant; hidden under reduced motion (still increments).
- FR-078: Cross-component bus = `CustomEvent("hm:xp")`; no state-management library.

**F10 — Konami Code Easter Egg**
- FR-080: Keydown buffer detects `↑↑↓↓←→←→BA`; 2s timeout resets.
- FR-081: Detection skips `<input>`/`<textarea>`/`[contenteditable]`.
- FR-082: Unlock persists `"konami"` to `localStorage["hm_unlocks_v1"]`; lime glow pulse; reveals `experimental` in REPL + palette.
- FR-083: Recruiter footer has "🎮 Show experimental" button for keyboard/discovery parity.

**F11 — ⌘K Command Palette**
- FR-090: Opens on ⌘K/Ctrl+K, from "Inspect me" CTA, and chrome hint.
- FR-091: Four groups — Navigate / Projects / Actions / Socials.
- FR-092: Fuzzy search across all groups; order exact > prefix > fuzzy; keyboard nav; Esc closes.
- FR-093: Respects reduced motion (opacity only).

**F12 — Recruiter Mode**
- FR-100: Toggle exposed in two places (chrome button `≥sm` + ⌘K Actions); both read/write `localStorage["hm_recruiter_v1"]`.
- FR-101: When ON, navigate to `/recruiter` and persist; chrome unmounted entirely (XP/Konami/REPL hints/palette XP all gone).
- FR-102: `/recruiter` flat editorial layout (photo + name + headline, 3 bullets, 6 case-study cards, skills matrix, Download Resume, contact links).
- FR-103: Recruiter Mode stays dark-only in v1; print handles paper.
- FR-104: Toggling OFF returns to `/` with chrome restored.

**F13 — Theme & Hotkeys**
- FR-110: `next-themes` at root: `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, `disableTransitionOnChange`.
- FR-111: `D` key toggles theme — no-op in v1, toasts "Site is dark-only."
- FR-112: Hotkey detection skips typing targets.

### NonFunctional Requirements

- **NFR-P1:** Lighthouse ≥95 all four categories on live URL (CI-gating).
- **NFR-P2:** Interaction <100ms; animations 60fps.
- **NFR-P3:** No external `<script>`/`<link rel=stylesheet>`; fonts via `next/font/google`.
- **NFR-P4:** No dependency >50KB gzipped without approval; no Three.js/Lottie.
- **NFR-P5:** Animate `transform`/`opacity` only; scroll reveals `useInView({ once: true })`.
- **NFR-P6:** Code-split `/console`, `/work/[slug]`, `/sources`.
- **NFR-A1:** WCAG 2.1 AA; lime-on-obsidian only for large text/icons.
- **NFR-A2:** Full keyboard nav; visible focus rings.
- **NFR-A3:** `prefers-reduced-motion` gates every animation.
- **NFR-A4:** Semantic HTML (one `<h1>`/route, real `<nav>`, `<article>`, `<button>`).
- **NFR-A5:** `alt` on every image; `next/image` always.
- **NFR-A6:** `/recruiter` prints clean via `@media print` (light system).
- **NFR-R1:** Mobile-first; usable below 360px; breakpoints sm/md/lg.
- **NFR-R2:** Dedicated mobile card layout for waterfall.
- **NFR-R3:** REPL usable on mobile (↑/↓ via on-screen buttons).
- **NFR-S1:** Per-route title/description/canonical/OG.
- **NFR-S2:** JSON-LD `Person` + `WebSite` on `/`; `BreadcrumbList` on `/work/[slug]`.
- **NFR-S3:** `robots.txt` + `sitemap.xml` via Next metadata APIs.
- **NFR-S4:** Per-case-study OG via `opengraph-image.tsx` (static fallback allowed).
- **NFR-SE1:** No client-side secrets; contact stubbed in v1.
- **NFR-SE2:** Zod validation on submit.
- **NFR-SE3:** No `dangerouslySetInnerHTML`.
- **NFR-SE4:** CSP via `next.config.mjs headers()` at launch.
- **NFR-O1:** Vercel zero-config deploy; branch previews.
- **NFR-O2:** Yarn authoritative; never `npm install`.
- **NFR-O3:** Pre-commit gate `typecheck && lint && test:run && format`.
- **NFR-O4:** `localStorage`-only persistence, versioned keys, graceful degradation.
- **NFR-O5:** shadcn-on-Tailwind-v4 only; no parallel UI library.

### Additional Requirements (from Architecture)

- **ARCH-1:** No project scaffolding story — foundation already installed (brownfield). First story = `app/globals.css` token rewrite.
- **ARCH-2:** Routing topology — `app/(chrome)/` route group holds the 6 chrome'd routes (chrome layout mounts once); `app/recruiter/` lives outside the group (true unmount).
- **ARCH-3:** Client state without a library — `localStorage` mode bus (`hm_xp_v1`, `hm_unlocks_v1`, `hm_recruiter_v1`) + `sessionStorage["hm_xp_granted"]` (per-session visit idempotence) + `CustomEvent("hm:xp")`; consumed only via `hooks/use-*` and `lib/xp/bus.ts`.
- **ARCH-4:** Shared single-source helpers — `useShouldAnimate()` (reduced motion), `lib/keyboard.ts isTypingTarget()` (D/Konami/⌘K), `ComputedStylesPanel` wrapper.
- **ARCH-5:** Content layer — Zod-typed `lib/content/*` (migration already landed); validate at module load; new code imports only from `lib/content/*`.
- **ARCH-6:** Mock-content launch gate — CI greps `lib/content/projects.ts` for `"mock":\s*true` on featured slugs and fails the build.
- **ARCH-7:** RSC by default; `"use client"` pushed as deep as possible; code-split heavy panels via `dynamic()`.
- **ARCH-8:** Cleanup — remove Dexie/`fake-indexeddb`; archive `docs/plan.md` → `docs/archive/plan-tanstack-original.md`; remove empty `lib/repository`.
- **ARCH-9:** Deployment — Vercel; optional `vercel.json` only for CSP/redirects; pre-commit hooks via husky/simple-git-hooks (Phase 7).

### UX Design Requirements

- **UX-DR1:** Computed-styles cell idiom (`bg-hairline` outer + `gap-px` + `bg-surface` children) as the universal panel treatment — implemented once as `<ComputedStylesPanel>`; used on principles, case-study Decisions/Outcomes, Sources preview, REPL output blocks.
- **UX-DR2:** OKLCH token system in `app/globals.css` `@theme inline` (Obsidian + Signal Lime, dark-only); `::selection` inverted lime; `.bg-grid` + `.bg-scan` utilities; max radius 6px; no drop shadows.
- **UX-DR3:** Button hierarchy — Primary (lime, one per surface max) / Outline / Ghost / Tab-active / Tab-inactive — defined once via `cva`.
- **UX-DR4:** Reduced-motion single source of truth — `useShouldAnimate()` imported by every animated component; no per-component re-derivation.
- **UX-DR5:** Feedback patterns — sonner toasts in system-log voice; `<XPToast>` rising from the bar; form validation as `✓`/`✗` test lines; errors live in DevTools voice (no red modals).
- **UX-DR6:** Navigation parity — three paths to every destination (mouse, keyboard, ⌘K palette); skip-to-content link as first focusable element; external links `target=_blank rel=noopener noreferrer`.
- **UX-DR7:** `<ScoreRing>` — ring draw 0→target (1.1s) + rAF count-up (1100ms cubic) on `useInView({ once: true })`; full at mount under reduced motion; omit if value 0.
- **UX-DR8:** `<PageWeightBudget>` — stacked bar as `<dl>` semantics; draws on `whileInView`.
- **UX-DR9:** Layout-shared transitions — `motion/react` `layoutId="project-<slug>"` for `/work` row → `/work/[slug]`; instant fade under reduced motion.
- **UX-DR10:** Mobile bottom tab bar (deliberate departure from design-system top-scroll); thumb-reachable, safe-area-aware; Recruiter chip palette-only on mobile.
- **UX-DR11:** Voice & Tone lock (PRD §5.0) — Computed-styles principles, boss-fight contact register, REPL personality + `did you mean:`, editorial Recruiter Mode, real-DevTools waterfall feel. Voice wins ties over conflicting FRs.
- **UX-DR12:** Print stylesheet for `/recruiter` — `@media print` light system (white bg, black fg, no chrome/marquees, single column); clean 1–2 page PDF via Cmd+P.

### FR Coverage Map

| Requirement | Epic | Notes |
|---|---|---|
| FR-013, UX-DR1, UX-DR2, UX-DR3, UX-DR4, ARCH-1, ARCH-4, ARCH-5, ARCH-8 | **Epic 1** | Foundation & visual identity, helpers, cleanup |
| FR-001..004, FR-110..112, FR-076, FR-077, FR-078, FR-074(tab-visit +10), FR-075, ARCH-2, ARCH-3, UX-DR6, UX-DR10 | **Epic 2** | Chrome, navigation, theme/hotkeys, XP spine |
| FR-010..012, FR-050, FR-051, FR-060..062, UX-DR7, UX-DR8 | **Epic 3** | Elements, Performance, Sources tree (contact preview stubbed) |
| FR-020..027, FR-030..034, FR-074(project +15), UX-DR9, ARCH-6, ARCH-7 | **Epic 4** | Network waterfall + case studies |
| FR-040..044, FR-090..093, FR-080..083, FR-074(REPL +5 / Konami +20), UX-DR11 | **Epic 5** | Console, palette, Konami |
| FR-100..104, FR-070..073, FR-074(contact +50), UX-DR5 | **Epic 6** | Recruiter Mode + Contact boss-form |
| NFR-S1..S4, NFR-A6, NFR-P1, NFR-SE4, NFR-O3, UX-DR12, ARCH-9 | **Epic 7** | Launch readiness — SEO, print, perf, deploy |
| FR-052 | — | Deferred to v1.1 (explicitly out of v1 scope) |

> NFR-P2/P3/P4/P5/A1–A5/R1–R3/O2/O4/O5 are cross-cutting constraints enforced in **every** story's acceptance criteria, not a single story. They are restated in the relevant epic's stories where they bite hardest.

---

## Epic List

### Epic 1: Foundation & Visual Identity
Establish the Obsidian + Signal Lime dark-only visual system, shared cross-cutting helpers, and the universal panel idiom — so every later surface inherits a coherent devtools://hossam look and the reduced-motion / hotkey discipline for free.
**FRs covered:** FR-013 (+ token NFRs, UX-DR1–4, ARCH-1/4/5/8)

### Epic 2: Persistent DevTools Chrome, Navigation & XP Spine
Deliver the defining experience — a persistent DevTools chrome whose tabs swap panels without re-mounting — plus theme/hotkey infrastructure and the XP event bus + bar that later epics emit into.
**FRs covered:** FR-001..004, FR-110..112, FR-074 (tab-visit grant), FR-075, FR-076, FR-077, FR-078

### Epic 3: Static Content Surfaces — Elements, Performance, Sources
Build the three read-only content panels (hero/principles/stack on `/`, score rings + page-weight on `/perf`, file tree on `/sources`) so visitors can read the identity story and stats immediately.
**FRs covered:** FR-010, FR-011, FR-012, FR-050, FR-051, FR-060, FR-061, FR-062

### Epic 4: Project Network & Case Studies
Render the project list as a DevTools Network waterfall with shareable filters, and open each featured project into a statically-generated case study via a layout-shared transition — the load-bearing surface for the Engineering-Manager persona.
**FRs covered:** FR-020..027, FR-030..034, FR-074 (project-open grant)

### Epic 5: Console, Command Palette & Konami
Ship the peer-delight interactivity: a real REPL with a voiced command registry, the ⌘K fuzzy palette as a universal action surface, and the Konami easter-egg unlock.
**FRs covered:** FR-040..044, FR-090..093, FR-080..083, FR-074 (REPL + Konami grants)

### Epic 6: Recruiter Mode & Boss-Level Contact
Serve the dominant Recruiter persona with a one-click editorial escape hatch, and land the showcase contact interaction (validation-as-tests, stubbed submit).
**FRs covered:** FR-100..104, FR-070..073, FR-074 (contact grant)

### Epic 7: Launch Readiness — SEO, Print, Performance & Deploy
Close the gaps that make the artifact credible and shippable: metadata + JSON-LD + sitemap + OG images, the recruiter print stylesheet, the mock-content CI gate, CSP, the Lighthouse-95 pass, and the Vercel deploy.
**FRs covered:** NFR-S1..S4, NFR-A6, NFR-P1, NFR-SE4, NFR-O3 (+ ARCH-6/9, UX-DR12)

---

## Epic 1: Foundation & Visual Identity

Establish the dark-only Obsidian + Signal Lime token system, the shared cross-cutting helpers (reduced-motion, keyboard-skip, panel idiom), and clean up dropped infrastructure — so every later surface inherits a coherent look and the right discipline. Builds on the already-installed Next.js 16 + shadcn + `lib/content/*` foundation.

### Story 1.1: Rewrite design tokens to Obsidian + Signal Lime

As Hossam (site owner),
I want `app/globals.css` rewritten to the canonical OKLCH dark-only token set,
So that the whole site renders in the devtools://hossam visual identity instead of the wrong cream/terracotta starter palette.

**Acceptance Criteria:**

**Given** the project uses Tailwind v4 with no config file
**When** `app/globals.css` is authored
**Then** all color/typography/geometry tokens from addendum §0.1–0.2 are defined inside `@theme inline { … }` (background, foreground, surface, surface-2, hairline, lime, lime-foreground, primary, muted-foreground, status-ok/warn/err, destructive, chart-1..5, radius, border, input, ring; font-sans/title/mono)
**And** there is **no** `:root` light-mode block and **no** `tailwind.config.*` file.

**Given** the dark-only decision
**When** a component uses a semantic utility (`bg-background`, `text-foreground`, `border-hairline`, `bg-primary`)
**Then** it resolves to the OKLCH token value with zero hardcoded hex/oklch in JSX.

**Given** the font setup already exists in `lib/font.ts` (IBM Plex Mono / Inter / Fraunces / Tajawal / Almarai)
**When** tokens reference font families
**Then** `--font-sans`/`--font-title`/`--font-mono` chain to the next/font CSS variables and `font-feature-settings: "ss01","cv11"` is set on `html, body`.

### Story 1.2: Add base/utility layers — selection, grid, scanlines

As a visitor,
I want the signature background texture and selection styling,
So that the site feels like a real DevTools surface from the first paint.

**Acceptance Criteria:**

**Given** `@layer base` in `globals.css`
**When** I select text anywhere on the site
**Then** `::selection` renders lime background with `--lime-foreground` text (inverted).

**Given** `@layer utilities`
**When** `.bg-grid` and `.bg-scan` are applied (FR-013)
**Then** `.bg-grid` shows 48px white lines @4% and `.bg-scan` shows 4px scanlines @2%, dark-only, composited at `opacity-40`/`opacity-60` on the hero.

**Given** the surface language (UX-DR2)
**When** any panel/card/modal is styled
**Then** depth comes from background-color steps and hairline borders only — no `box-shadow`, and border radius never exceeds `--radius` (6px) except the XP-bar pill.

### Story 1.3: Build shared cross-cutting helpers

As an implementing agent,
I want single-source helpers for reduced motion, hotkey hygiene, and the panel idiom,
So that every later component reuses them instead of re-deriving divergent behavior.

**Acceptance Criteria:**

**Given** `hooks/use-should-animate.ts`
**When** a component calls `useShouldAnimate()`
**Then** it returns `false` when `prefers-reduced-motion: reduce` is set (wrapping `motion/react`'s `useReducedMotion()`), and animations collapse duration to `0.001s` / render final state when it is false.

**Given** `lib/keyboard.ts`
**When** `isTypingTarget(el)` is called with an `<input>`, `<textarea>`, or `[contenteditable="true"]`
**Then** it returns `true`, matching the existing `theme-provider.tsx` `ThemeHotkey` pattern, and global hotkeys consult it before firing.

**Given** `components/computed-styles-panel.tsx` (UX-DR1)
**When** `<ComputedStylesPanel>` wraps children
**Then** it renders the `rounded border border-hairline bg-hairline grid gap-px` outer with `bg-surface` children, producing the inset-hairline Computed-tab grid, and supports vertical (default) and horizontal direction variants.

### Story 1.4: Remove dropped infrastructure and archive legacy plan

As Hossam (maintainer),
I want Dexie/IndexedDB fully removed and the legacy TanStack plan archived,
So that the codebase matches the resolved decisions and agents stop referencing dropped infrastructure.

**Acceptance Criteria:**

**Given** Dexie was dropped (ARCH-8)
**When** dependencies are pruned
**Then** `dexie`, `dexie-react-hooks`, and `fake-indexeddb` are removed via `yarn remove`, `tests/setup.ts` no longer imports `fake-indexeddb/auto`, and any empty `lib/repository` Dexie wrapper is deleted.

**Given** `docs/plan.md` is TanStack-era intent
**When** the archive step runs
**Then** the original is moved to `docs/archive/plan-tanstack-original.md` and any remaining references resolve to the Next.js App Router equivalents (addendum §2).

**Given** the content migration already landed (commit cd5dd09)
**When** the codebase is checked
**Then** no source imports from `lib/data/index.ts` (it is deleted), and `yarn typecheck && yarn lint && yarn test:run` pass clean.

---

## Epic 2: Persistent DevTools Chrome, Navigation & XP Spine

Deliver the central UX claim — click a tab, the panel changes, the chrome doesn't — via a route-group layout that mounts the chrome once. Includes theme/hotkey infrastructure and the XP bus + bar that later epics emit into.

### Story 2.1: Establish the `(chrome)` route group and root layout

As a visitor,
I want a single persistent app frame across the five DevTools tabs,
So that moving between panels feels like one coherent tool, not a multi-page site.

**Acceptance Criteria:**

**Given** the routing topology (ARCH-2)
**When** the app structure is created
**Then** `app/layout.tsx` (root) holds `<html dir>` + `ThemeProvider` + fonts + `<Toaster>` and `app/(chrome)/layout.tsx` renders the DevTools chrome wrapping `<main>` for `/`, `/work`, `/work/[slug]`, `/console`, `/perf`, `/sources`, while `app/recruiter/page.tsx` lives **outside** the group.

**Given** the chrome layout mounts once (FR-001)
**When** I navigate between two chrome'd tabs via `<Link>`
**Then** the chrome DOM identity is retained (no re-mount/flicker) and only the page slot swaps inside `AnimatePresence mode="wait"` (0.2s in / 0.15s out, easeOut), instant under reduced motion.

**Given** static-first rendering
**When** any tab is hard-refreshed
**Then** the chrome + content paint with no JS required and hydration adds interactivity (NFR-P2), with zero console errors/warnings.

### Story 2.2: Identity strip and DevTools tab navigation

As a visitor,
I want a labeled identity strip and the five DevTools tab labels with a clear active state,
So that I always know who this is and where I am.

**Acceptance Criteria:**

**Given** FR-002
**When** the identity strip renders
**Then** it shows `Profile.name` + `Profile.role` left-aligned in a `<header>`, with a right-aligned region reserved for the Recruiter toggle (`≥sm`) and XP bar.

**Given** FR-003 + NFR-A4
**When** the tab row renders inside `<nav aria-label="DevTools tabs">`
**Then** all 5 tabs are real `<Link>`s, the active tab (from `usePathname()`) gets `border-b-2 border-lime` + `aria-current="page"`, and inactive tabs are `text-muted-foreground border-b-2 border-transparent`.

**Given** UX-DR6 (skip-to-content)
**When** the page loads
**Then** the first focusable element in `<body>` is a "Skip to content" link, visually hidden until focused, that jumps focus past the chrome to `<main>`.

### Story 2.3: Mobile bottom tab bar

As a mobile visitor,
I want a thumb-reachable bottom tab bar instead of off-screen scrolling tabs,
So that all five panels are discoverable on a phone.

**Acceptance Criteria:**

**Given** FR-004 + UX-DR10 (departure endorsed)
**When** the viewport is `<640px`
**Then** the top tab row is replaced by a fixed bottom tab bar honoring `env(safe-area-inset-bottom)`, the identity strip stays a single-row top, and touch targets are ≥44×44px.

**Given** NFR-R1
**When** the viewport is as narrow as 360px
**Then** all 5 tabs fit (icons-only if labels don't) with no horizontal overflow and the active tab shows the lime underline + dot.

### Story 2.4: Theme provider and `D` hotkey (dark-only)

As a visitor,
I want a stable dark theme with a playful dark-only hotkey response,
So that the site never flashes the wrong theme and power users get a voiced refusal.

**Acceptance Criteria:**

**Given** FR-110
**When** `next-themes` mounts at root
**Then** it uses `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, `disableTransitionOnChange`, and `<html>` keeps `suppressHydrationWarning` (no hydration theme flash).

**Given** FR-111 + FR-112
**When** I press `D` while not focused in a typing target
**Then** a sonner toast reads "Site is dark-only. The vibe is intentional." and the theme does not change; pressing `D` inside an `<input>`/`<textarea>`/`[contenteditable]` does nothing (uses `isTypingTarget`).

### Story 2.5: XP event bus, hook, and chrome XP bar with tab-visit grant

As a curious visitor,
I want an XP bar that rewards exploring new tabs,
So that the site feels alive without ever gating content.

**Acceptance Criteria:**

**Given** ARCH-3 + FR-078
**When** `lib/xp/bus.ts` exposes `emitXP(delta, reason)`
**Then** it dispatches `CustomEvent("hm:xp", { detail: { delta, reason, timestamp } })` with **no** state-management library, and `hooks/use-xp.ts` subscribes, clamps the value to `[0,100]` (FR-075), and persists to `localStorage["hm_xp_v1"]`.

**Given** FR-074 (tab visit) + FR-075 idempotence
**When** I visit a tab for the first time this session
**Then** `+10` XP is granted once via a `visit:<tab>` reason guarded against `sessionStorage["hm_xp_granted"]`, and re-visiting the same tab in the session grants nothing.

**Given** FR-076 + FR-077 + NFR-A3
**When** XP changes with motion enabled
**Then** `<XPBar>` (`role="progressbar"`, `aria-valuenow/min/max`, pill shape) springs its fill via `transform: scaleX()` and an `<XPToast>` rises from the bar; under Recruiter Mode or reduced motion the bar is hidden / toast suppressed while the value still increments silently.

**Given** NFR-O4 + property testing
**When** `fast-check` runs against the XP reducer
**Then** for any sequence of deltas the result stays within `[0,100]`, and `localStorage` being unavailable degrades to in-memory state without crashing.

---

## Epic 3: Static Content Surfaces — Elements, Performance, Sources

Build the three read-only panels so visitors can read the identity story, the stats, and the file tree immediately. All static, no client fetching.

### Story 3.1: Elements hero with identity and "Inspect me" CTA

As a visitor,
I want a strong hero with name, role, tagline, and a primary CTA,
So that I grasp who this is within seconds of landing.

**Acceptance Criteria:**

**Given** FR-010
**When** `/` renders
**Then** it shows `Profile.name` as the single `<h1>` (`clamp(2rem,10vw,6rem)`, Fraunces, `leading-[0.95] tracking-tight`), plus role and tagline, and an "Inspect me" primary CTA (the one lime CTA on the surface, UX-DR3).

**Given** FR-013
**When** the hero background renders
**Then** `.bg-grid` + `.bg-scan` composite at `opacity-40`/`opacity-60`, dark-only.

**Given** the palette is not yet built in this epic
**When** "Inspect me" is clicked before Epic 5 lands
**Then** the CTA is wired to a stable open-palette handler/route hook that Epic 5 fulfills — it is not a forward-dependent no-op (it degrades to focusing the ⌘K hint until the palette exists).

### Story 3.2: Principles as a Computed-styles panel

As an engineering manager,
I want the principles rendered like a real DevTools Computed tab,
So that the craft signal lands instead of a generic card marquee.

**Acceptance Criteria:**

**Given** FR-011 + UX-DR1 + UX-DR11
**When** the principles section renders
**Then** the 4 entries from `Profile.principles[]` render inside `<ComputedStylesPanel>` (hairline grid, label-left/value-right cells), scroll-revealed via `useInView({ once: true })`, instant under reduced motion.

**Given** NFR-A4
**When** the section is read by a screen reader
**Then** it uses semantic markup with an `<h2>` and does not introduce a second `<h1>`.

### Story 3.3: Stack marquee with reduced-motion fallback

As a visitor,
I want an animated stack marquee that calms down when I hover or prefer reduced motion,
So that the tech signal is lively but never gratuitous.

**Acceptance Criteria:**

**Given** FR-012 + NFR-P5
**When** the marquee animates
**Then** it scrolls horizontally using `transform` only, pauses on hover, and shows primary-tier skills (`Skill.tier === "primary"`).

**Given** NFR-A3 + UX-DR4
**When** `prefers-reduced-motion` is set
**Then** the marquee is replaced by a static grid via `useShouldAnimate()`.

### Story 3.4: Performance score rings and page-weight budget

As a curious peer,
I want Lighthouse-style rings and a page-weight breakdown,
So that the Performance tab demonstrates measurable craft.

**Acceptance Criteria:**

**Given** FR-050 + UX-DR7
**When** `/perf` renders rings for years/projects/talks/mentees from `Profile.metrics[]`
**Then** each ring draws 0→target (1.1s easeOut) with an rAF count-up (1100ms cubic) on `useInView({ once: true })`, renders full at mount under reduced motion, and **omits** any metric whose value is 0 (not a zero ring), with `aria-label="[label]: [value][suffix]"`.

**Given** FR-051 + UX-DR8
**When** the page-weight budget renders
**Then** it shows a stacked bar (HTML/JS/CSS/images/fonts) from build-time static JSON, marked up as a `<dl>` with `<dt>`/`<dd>` pairs, drawing on `whileInView`.

**Given** FR-052
**When** v1 scope is checked
**Then** the live-Lighthouse easter-egg is **not** implemented (deferred to v1.1).

### Story 3.5: Sources file tree and preview pane

As a recruiter,
I want a file tree where the resume is one click away,
So that I can grab the PDF without learning the metaphor.

**Acceptance Criteria:**

**Given** FR-060
**When** `/sources` renders (desktop `≥md` two-pane: 220px tree + content)
**Then** the tree (`<nav aria-label="Sources file tree">`, `<ul>/<li>`, `aria-selected`) lists `resume.pdf`, `articles/`, `talks/`, `contact.ts`; `articles/` and `talks/` show "Coming soon" placeholders; ↑/↓ navigates and ↵ selects.

**Given** FR-061
**When** `resume.pdf` is selected
**Then** the preview shows an embed + a Download button targeting `/hossam-marey-resume.pdf`; when `contact.ts` is selected, the preview shows a **stub** placeholder (the full boss-form lands in Epic 6) using `<ComputedStylesPanel>`.

**Given** FR-062 + NFR-R1
**When** the viewport is `<md`
**Then** the layout becomes a single-pane stack (tree above, preview below).

---

## Epic 4: Project Network & Case Studies

Render the project list as a DevTools Network waterfall with shareable filters, and open featured projects into statically-generated case studies via a layout-shared transition — the load-bearing EM surface.

### Story 4.1: Network waterfall table (desktop grid + mobile card)

As an engineering manager,
I want all projects rendered as a Network request waterfall,
So that I can scan the body of work like a real DevTools panel.

**Acceptance Criteria:**

**Given** FR-020..024 + ARCH-5
**When** `/work` renders all projects from `lib/content/projects.ts`
**Then** desktop shows a grid (`method | name | type | status | size | time | waterfall-bar`); method is a chart-token badge (FR-021, decorative); status is a `200/201/410` pill via status tokens with `aria-label` (FR-022); size label + `sizeWeight` fill (FR-023); and the bar uses `transform: scaleX(timeWeight) translateX(startOffset)` only — never `width`/`left` (FR-024, NFR-P5).

**Given** FR-020 + NFR-R2
**When** the viewport is `<640px`
**Then** rows become a dedicated card layout (method + name + status row, bar below) — the desktop grid does not auto-degrade.

**Given** NFR-A4
**When** the table is read by a screen reader
**Then** it uses table/row semantics with a visible link wrapping the name cell to `/work/[slug]`.

### Story 4.2: URL-persisted filters with empty state

As an engineering manager,
I want to filter the waterfall and share the filtered view,
So that I can isolate shipped work and send a precise link.

**Acceptance Criteria:**

**Given** FR-026
**When** I toggle method/status/year filter chips (multi-select, popover-with-checkboxes)
**Then** the selection persists to URL search params (e.g. `?status=shipped&method=GET`), filtering happens client-side over static data (no refetch), and a hard refresh rehydrates the chips from the URL.

**Given** FR-027
**When** a filter combination matches no projects
**Then** the table shows "No requests match your filter" with a "Clear filters" button that resets the params.

### Story 4.3: Statically-generated case-study detail

As an engineering manager,
I want each featured project as a structured case study,
So that I can read the real trade-offs, not a feature list.

**Acceptance Criteria:**

**Given** FR-030 + FR-031 + ARCH-7 + NFR-P6
**When** `/work/[slug]` is built
**Then** it is statically generated via `generateStaticParams`, code-split via `dynamic()`, rendered as an `<article>` with one `<h1>` and sections in order breadcrumb → Problem → Role → Stack chips → Decisions → Outcomes → Links (null links filtered), with Decisions/Outcomes using `<ComputedStylesPanel>`.

**Given** FR-034 + ARCH-6
**When** the 6 featured slugs render
**Then** each has authored content with `meta.mock: false`; any non-featured project links to source/live only with no detail page; and a non-prod build renders a `[MOCK]` badge + `console.warn` for any `meta.mock: true` entry.

### Story 4.4: Layout-shared row→detail transition and prev/next pager

As an engineering manager,
I want the Network row to "open" into the case study and to page between studies,
So that the navigation feels continuous and the metaphor holds.

**Acceptance Criteria:**

**Given** FR-025 + UX-DR9
**When** I click a waterfall row
**Then** it transitions to `/work/[slug]` via `motion/react` `layoutId="project-<slug>"` shared between the row and the detail header; under reduced motion the transition is an instant fade and meaning is carried by the URL + breadcrumb.

**Given** FR-033
**When** I reach the footer of a case study
**Then** prev/next links navigate in declaration order from `lib/content/projects.ts`, wrapping is handled at the ends, and rapid repeated clicks do not double-run or break the transition.

### Story 4.5: Grant project-open XP

As a curious visitor,
I want opening a case study to grant XP,
So that exploring the work is rewarded.

**Acceptance Criteria:**

**Given** FR-074 (project +15) building on the Epic 2 XP bus
**When** I open a `/work/[slug]` detail for the first time this session
**Then** `emitXP(15, "open:<slug>")` fires once (idempotent per session via `hm_xp_granted`), the bar updates, and re-opening the same slug in the session grants nothing.

---

## Epic 5: Console, Command Palette & Konami

Ship the peer-delight interactivity. The palette's Projects/Actions/Socials groups and the Konami unlock build on routes, content, and the XP bus already delivered.

### Story 5.1: Console REPL shell with history

As a curious peer,
I want a real terminal input with command history,
So that the Console tab feels like an actual shell, not a fake terminal.

**Acceptance Criteria:**

**Given** FR-040 + FR-044 + NFR-A4 + NFR-P6
**When** `/console` mounts (code-split via `dynamic()`)
**Then** it auto-focuses a real `<input>` (`aria-label="Console input"`, not contenteditable), output area is `aria-live="polite"`, ↑/↓ walk the history buffer, and a multiline paste executes only the first line with an inline notice for the rest.

**Given** NFR-R3
**When** on mobile
**Then** the REPL stays usable (touch keyboard on focus) with on-screen ↑/↓ history buttons under the input.

### Story 5.2: Command registry with voiced outputs

As a curious peer,
I want voiced commands with helpful errors,
So that the REPL rewards exploration and feels like Hossam.

**Acceptance Criteria:**

**Given** FR-041 + FR-042 + UX-DR11
**When** I run a registered command (`help`, `whoami`, `projects [--shipped|--tag x]`, `contact`, `theme`, `clear`, `download resume`)
**Then** each returns its specified voiced output (e.g. `whoami` in Hossam's voice; `theme light` deadpan refusal; `download resume` triggers `/hossam-marey-resume.pdf`; `clear` clears output, history persists), parsed by a tiny in-repo registry (no shell library, NFR-P4).

**Given** FR-041 (unknown) + UX-DR5
**When** I type an unknown command
**Then** output reads `command not found: <x>. Type 'help' for available commands.` plus `did you mean: <suggestion>?` when a near match exists (Levenshtein < 3).

**Given** FR-043 building on the XP bus
**When** a command succeeds
**Then** `emitXP(5, "repl:command")` fires (subject to the FR-075 cap).

### Story 5.3: ⌘K command palette with four groups

As any visitor,
I want a fuzzy command palette,
So that every destination and action is reachable by keyboard from anywhere.

**Acceptance Criteria:**

**Given** FR-090..093 + UX-DR6
**When** I press ⌘K / Ctrl+K (skipping typing targets) or click "Inspect me"
**Then** the `cmdk` `<CommandDialog>` opens with groups Navigate (6 routes incl. Recruiter) / Projects (every `Project.slug`) / Actions (Toggle Recruiter Mode, Download Resume, Copy Email, Toggle Theme→dark-only error) / Socials (`Profile.socials[]`, new tab), fuzzy-ranked exact > prefix > fuzzy, ↑/↓/↵ navigation, Esc closes, focus returns to trigger.

**Given** FR-093 + NFR-A3
**When** reduced motion is set
**Then** the palette uses opacity-only enter/exit (no scale/blur).

### Story 5.4: Konami unlock with chrome pulse

As a curious peer,
I want the Konami code to unlock an experimental surface,
So that discovering it feels like a reward worth sharing.

**Acceptance Criteria:**

**Given** FR-080 + FR-081
**When** I enter `↑↑↓↓←→←→BA` (case-insensitive letters) outside a typing target within 2s-per-key windows
**Then** the global `<KonamiListener>` (mounted in root layout, using `isTypingTarget`) detects it; a partial/late sequence resets the buffer.

**Given** FR-082 + FR-083 + UX-DR5
**When** the sequence completes
**Then** `"konami"` persists to `localStorage["hm_unlocks_v1"]`, a one-shot 800ms lime chrome pulse fires (suppressed under reduced motion), `emitXP(20, "konami")` grants once, and `experimental` appears in REPL `help` + an "Experimental" entry appears in the palette Actions group; on reload both surfaces read the unlock array.

**Given** OQ3 (content)
**When** `experimental` is run
**Then** it reveals real content (a project Hossam is exploring) — a placeholder is unacceptable; if no real content exists at launch, the unlock ships disabled rather than pointing at a placeholder.

---

## Epic 6: Recruiter Mode & Boss-Level Contact

Serve the dominant Recruiter persona with a one-click editorial escape hatch, and land the showcase contact interaction. Builds on chrome (Epic 2), content, and the XP bus.

### Story 6.1: `/recruiter` editorial resume route

As a recruiter,
I want a flat editorial resume with no DevTools metaphor,
So that I can scan seniority and grab the resume in under a minute.

**Acceptance Criteria:**

**Given** FR-102 + UX-DR11 + NFR-A1
**When** `/recruiter` renders (outside the `(chrome)` group)
**Then** it shows an editorial single-column layout (`max-w-3xl`): header name + one-sentence headline + 3 highlight bullets, 6 case-study cards (method/status/year/outcomes), a 3-column skills matrix (Primary/Secondary/Tools from `Skill.group`, no skill bars), a Download Resume primary CTA, and contact links (email/LinkedIn/GitHub) — no chrome, no XP, no palette, no gamification.

**Given** FR-103 + A26 (OQ5)
**When** the photo decision is pending
**Then** the layout works with or without a photo; if present it uses `next/image` with explicit dimensions + `alt={Profile.name}`.

**Given** NFR-A4
**When** read by a screen reader
**Then** it has one `<h1>`, real headings, and meets the same AA requirements as the rest of the site.

### Story 6.2: Dual Recruiter Mode toggle with persistence

As a recruiter,
I want the Recruiter Mode toggle reachable in ≤2 clicks from anywhere,
So that I'm never trapped in an unfamiliar UI.

**Acceptance Criteria:**

**Given** FR-100 + ARCH-3
**When** the toggle is exposed
**Then** a chrome button (right of identity, `≥sm`, lime border — the only chrome lime border outside the active tab) **and** a ⌘K Actions entry both read/write `localStorage["hm_recruiter_v1"]` via a single `useRecruiterMode` hook (no direct per-component storage reads).

**Given** FR-101 + FR-104
**When** I toggle Recruiter Mode ON
**Then** navigation goes to `/recruiter`, the state persists, and the chrome (with XP/Konami/REPL hints/palette XP) is unmounted entirely (not CSS-hidden); toggling OFF returns to `/` with full chrome restored.

**Given** UX-DR10
**When** on mobile (`<sm`)
**Then** the chrome chip is hidden and the toggle is reachable via the ⌘K palette Actions group.

### Story 6.3: Boss-level contact form UI

As a curious peer,
I want the contact form to feel like fighting a terminal boss,
So that the "this person codes" signal lands harder than any project list.

**Acceptance Criteria:**

**Given** FR-070 + FR-071 + UX-DR11
**When** the `contact.ts` preview renders the `<BossLevelContactForm>`
**Then** it is a real `<form>` with real `<label>`/`<input>`/`<textarea>` for name (≥2), email (RFC), subject (optional ≤120), message (≥20, ≤2000), each prompt typewriter-revealed, the next field revealed after the current is valid.

**Given** FR-073 + NFR-A2
**When** I navigate the form
**Then** ↵ advances on a valid field, ↑ goes back, Esc clears the current field, Tab is the conventional fallback, and focus rings are visible.

### Story 6.4: Validation-as-tests and stubbed submit with XP

As a curious peer,
I want validation rendered as passing/failing tests and a dramatic stubbed submit,
So that the showcase interaction reads as "all tests green," not a polite form.

**Acceptance Criteria:**

**Given** FR-070 + FR-073 + NFR-SE2 + UX-DR5
**When** I type into a field
**Then** the Zod schema in `lib/schemas/contact.ts` validates (debounced ~150ms) and renders `✓ rule_name` (lime, mono, below input) when valid or `✗ rule_name — short reason` (status-err) when invalid; submit is disabled while any field is invalid (with `aria-describedby` to the invalid summary, `aria-live="polite"`).

**Given** FR-072 + NFR-SE1
**When** I submit a valid form
**Then** the button shows "running tests…", a randomized 600–1200ms delay returns a faked success, a sonner toast reads as a system-log line ("message queued. response window: 2 business days."), `emitXP(50, "contact:submit")` fires once — with **no** backend, env vars, or secrets in v1.

---

## Epic 7: Launch Readiness — SEO, Print, Performance & Deploy

Close the credibility-and-shipping gaps: metadata, structured data, sitemap, OG, the recruiter print stylesheet, the mock-content gate, CSP, the Lighthouse pass, and the Vercel deploy.

### Story 7.1: Per-route metadata and JSON-LD

As a recruiter finding the site via search/social,
I want correct titles, descriptions, and structured data,
So that shared links render richly and the site is discoverable.

**Acceptance Criteria:**

**Given** NFR-S1 + NFR-S2
**When** each route exports metadata
**Then** every route has a `<title>` (≤60 chars), meta `description` (≤160), canonical URL, and OG tags via the Next metadata API; `/` carries JSON-LD `Person` + `WebSite`; `/work/[slug]` carries `BreadcrumbList` (FR-032).

**Given** NFR-P3 + NFR-SE3
**When** structured data is injected
**Then** it uses the metadata API (no raw external `<script>` tags) and no `dangerouslySetInnerHTML` beyond owned JSON-LD.

### Story 7.2: robots, sitemap, and OG images

As a recruiter,
I want crawlable, share-ready pages,
So that the canonical link looks professional everywhere it's posted.

**Acceptance Criteria:**

**Given** NFR-S3
**When** the site builds
**Then** `app/robots.ts` and `app/sitemap.ts` generate `robots.txt` + `sitemap.xml` via the metadata APIs, covering all public routes.

**Given** NFR-S4 + A14
**When** per-case-study OG is generated
**Then** `opengraph-image.tsx` produces a per-slug OG image; if dynamic generation proves too costly it falls back to a static OG per case study (documented choice), with `next/image`/`alt` discipline (NFR-A5) elsewhere.

### Story 7.3: Recruiter print stylesheet

As a recruiter,
I want `/recruiter` to print as a clean black-on-white résumé,
So that I can save or print a PDF without the dark theme.

**Acceptance Criteria:**

**Given** NFR-A6 + UX-DR12
**When** I open Cmd+P on `/recruiter`
**Then** an `@media print` block swaps to white background / black foreground / hairline at 20% black, hides chrome and marquees, flows a single column, and produces a clean 1–2 page PDF.

**Given** the site is otherwise dark-only
**When** print styles are added
**Then** they are scoped to `@media print` only and do not introduce a light theme anywhere on screen.

### Story 7.4: Mock-content CI gate and pre-commit hooks

As Hossam (maintainer),
I want the build to fail if placeholder content or broken quality gates slip through,
So that the launch never ships mock case studies.

**Acceptance Criteria:**

**Given** ARCH-6 + A19
**When** CI runs the content gate
**Then** a grep for `"mock":\s*true` against the featured slugs in `lib/content/projects.ts` fails the build if any match, and all `Experience.projectSlugs` references resolve to existing slugs.

**Given** NFR-O3 + ARCH-9
**When** a commit is made
**Then** a pre-commit hook (husky/simple-git-hooks) runs `yarn typecheck && yarn lint && yarn test:run && yarn format`, and hooks are never bypassed with `--no-verify`.

### Story 7.5: CSP, Lighthouse pass, and Vercel deploy

As Hossam (site owner),
I want the production site to pass Lighthouse 95+ with security headers and deploy on Vercel,
So that the artifact's performance/a11y claims are demonstrably true on the live URL.

**Acceptance Criteria:**

**Given** NFR-P1 + NFR-P2 + NFR-P5 + NFR-P6
**When** Lighthouse runs on the deployed URL (mobile + desktop)
**Then** all four categories score ≥95, with animations on `transform`/`opacity` only, heavy routes code-split, and `next/image`/`next/font` used throughout.

**Given** NFR-SE4 + A15
**When** going live
**Then** CSP headers are added via `next.config.mjs headers()` (or `vercel.json`), tightened from the addendum §9 starter before launch.

**Given** NFR-O1 + NFR-O2
**When** deploying
**Then** the site deploys zero-config on Vercel with `yarn` as the package manager, every PR gets a preview URL, and the production build is the default CI check.

---

## Coverage Confirmation

- **All v1 FRs** (FR-001 … FR-112) are covered by at least one story; **FR-052** is the sole intentionally-deferred FR (v1.1).
- **All NFRs** are addressed — feature-specific ones in their epic's stories, cross-cutting ones (NFR-P2/P3/P4/P5, A1–A5, R1–R3, O2/O4/O5) restated as acceptance criteria where they bite.
- **All UX-DRs (1–12)** map to stories (UX-DR1/4 → Epic 1; UX-DR2/3 → Epic 1; UX-DR6/10 → Epic 2; UX-DR7/8 → Epic 3; UX-DR9 → Epic 4; UX-DR11 → Epics 3/5/6; UX-DR5 → Epics 5/6; UX-DR12 → Epic 7).
- **All Architecture additional requirements (ARCH-1…9)** are represented (no scaffold story per ARCH-1; route group in 2.1; XP/state bus in 2.5; helpers in 1.3; content gate in 7.4; cleanup in 1.4).
- **Dependency flow validated:** each epic stands alone using only prior epics; the XP bus (2.5) precedes every XP-emitting story (4.5, 5.2, 5.4, 6.4); the palette (5.3) follows the routes/content/recruiter it references; no story depends on a future story.
- **File-overlap considered:** `/sources` (Epic 3 stub → Epic 6 form) and the chrome (Epic 2 build → Epic 3/5/6 additive surfacing) repeatedly touch the same files, but the overlap is **additive building on prior epics** (no inter-epic feedback loop), matching the architecture's deliberate phased design — consolidation considered and rejected with this rationale.
