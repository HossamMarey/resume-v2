# Story 2.2: Identity strip and DevTools tab navigation

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want a labeled identity strip and the five DevTools tab labels with a clear active state,
So that I always know who this is and where I am.

## Context & Orientation (read first)

This is **Story 2.2 of Epic 2 (Chrome & Navigation)**, building directly on **Story 2.1** which delivered:
- `app/(chrome)/layout.tsx` with persistent chrome mounting, `AnimatePresence` transitions, skip-to-content link
- `components/devtools-chrome.tsx` — minimal shell with placeholder identity strip (`devtools://hossam` text) and basic tab row
- All 7 stub routes navigable (`/`, `/work`, `/work/[slug]`, `/console`, `/perf`, `/sources`, `/recruiter`)

**This story upgrades the chrome from a structural shell to a fully labeled navigation surface.** We add the identity strip (name + role from `lib/content/profile.ts`), ensure the tab row matches the DevTools panel mental model, and reserve chrome real estate for future features (Recruiter Mode chip, XP bar) without implementing them yet.

**Scope fence — what this story does NOT do:**
- It does NOT build the mobile bottom tab bar (Story 2.3)
- It does NOT wire the `D` hotkey dark-only toast (Story 2.4)
- It does NOT build the XP bus or bar (Story 2.5)
- It does NOT implement Recruiter Mode toggle logic (Epic 6)
- It does NOT add icons or visual flair beyond the identity text and tab labels

## Acceptance Criteria

**AC1 — Identity strip renders Profile data (FR-002).**
**Given** the `profile` object from `lib/content/profile.ts`
**When** the chrome renders
**Then** the `<header>` shows `Profile.name` + `Profile.role` left-aligned in a single-row identity strip, using `font-mono text-xs uppercase tracking-wider text-muted-foreground` for the role and a larger/bolder treatment for the name, and a right-aligned region visually reserves space for the future Recruiter Mode toggle and XP bar (Story 2.5/Epic 6).

**AC2 — Tab row matches DevTools panel semantics (FR-003 + NFR-A4).**
**Given** the existing tab navigation in `components/devtools-chrome.tsx`
**When** the chrome renders
**Then** all 5 tabs remain real `<Link>`s inside `<nav aria-label="DevTools tabs">`, the active tab (from `usePathname()`) gets `border-b-2 border-lime` + `aria-current="page"`, inactive tabs are `text-muted-foreground border-b-2 border-transparent hover:text-foreground`, and tab text uses `font-mono text-xs uppercase tracking-wider`.

**AC3 — Skip-to-content link remains first focusable element (UX-DR6 + NFR-A4).**
**Given** the skip link already exists in `app/(chrome)/layout.tsx`
**When** the page loads
**Then** the first focusable element in `<body>` is still the visually-hidden-until-focused "Skip to content" link, positioned before the chrome in the DOM order, jumping focus past the chrome to `<main id="main-content">`.

**AC4 — Chrome is semantic and accessible (NFR-A4).**
**Given** the chrome renders
**When** read by a screen reader
**Then** the identity strip announces as a banner region (`<header>`), the tab row announces as navigation with 5 tab items, the active tab announces as current, and focusable elements follow a logical order (skip link → identity → tabs → main content).

**AC5 — Static-first with zero console errors (NFR-P2 + NFR-A4).**
**Given** the chrome upgrades
**When** any chrome'd tab is hard-refreshed
**Then** the identity strip + tab row paint immediately without JS, hydration adds interactivity with zero console errors or warnings, and the chrome DOM identity is retained (no re-mount/flicker) when navigating between tabs.

**AC6 — Build and checks remain green (AC6).**
**Given** all changes
**When** `yarn typecheck && yarn lint && yarn test:run && yarn build` run
**Then** all pass with no new errors/warnings.

## Tasks / Subtasks

- [x] **Task 1 — Read current state and Profile data (AC1)**
  - [x] Read `components/devtools-chrome.tsx` to understand current shell
  - [x] Read `lib/content/profile.ts` to confirm `Profile.name` and `Profile.role` fields
  - [x] Verify `Profile.name` is populated (if empty, use a sensible fallback or note it)

- [x] **Task 2 — Upgrade identity strip in DevToolsChrome (AC1, AC4)**
  - [x] Replace placeholder `devtools://hossam` div with structured identity strip
  - [x] Left side: `Profile.name` (bold, `text-foreground`) + `Profile.role` (mono, muted)
  - [x] Right side: visual reservation/spacer for future Recruiter chip and XP bar
  - [x] Ensure single-row layout that doesn't wrap on desktop (`≥sm`)
  - [x] Keep `border-b border-hairline bg-surface` on `<header>`

- [x] **Task 3 — Refine tab row semantics (AC2, AC4)**
  - [x] Ensure `<nav aria-label="DevTools tabs">` wraps the tab list
  - [x] Verify `aria-current="page"` is set only on active tab
  - [x] Ensure tab `<Link>` elements use `next/link` (not `<a>`)
  - [x] Confirm `isActiveTab()` helper correctly handles nested routes (e.g., `/work/some-slug` should keep `/work` tab active)
  - [x] Keep tab styling: `font-mono text-xs uppercase tracking-wider`

- [x] **Task 4 — Verify skip-to-content link ordering (AC3)**
  - [x] Confirm `app/(chrome)/layout.tsx` renders skip link before `<DevToolsChrome />`
  - [x] Ensure skip link CSS (`sr-only focus:not-sr-only`) remains intact
  - [x] Browser test: Tab from page start → skip link appears → Enter → focus jumps to `<main>`

- [x] **Task 5 — Static-first verification (AC5)**
  - [x] Hard-refresh on `/` — identity strip + tabs paint without JS
  - [x] Navigate between tabs — chrome does NOT re-mount
  - [x] Confirm zero console errors

- [x] **Task 6 — Run gates (AC6)**
  - [x] `yarn typecheck` → clean
  - [x] `yarn lint` → clean (or only pre-existing warnings)
  - [x] `yarn test:run` → passes
  - [x] `yarn build` → succeeds

## Dev Notes

### Architecture context

**The identity strip is the chrome's "who and what" signal.** It must be readable at a glance (name prominent, role secondary) and must not compete with the tab row for attention. The DevTools metaphor treats the identity strip as the "window title bar" — informative but quiet.

**Right-side reservation pattern:** We reserve space for the Recruiter Mode chip and XP bar without implementing them. A simple spacer or placeholder comment is acceptable — the goal is to avoid re-layout when Story 2.5/Epic 6 adds those elements. Example:
```tsx
<div className="ms-auto flex items-center gap-3">
  {/* Recruiter Mode chip — Epic 6 */}
  {/* XP bar — Story 2.5 */}
</div>
```

**Tab row is already functional from Story 2.1.** This story polishes it: ensures semantic markup, validates active-state logic for nested routes, and confirms the visual hierarchy (tabs are secondary to identity strip).

### What is being changed

1. **`components/devtools-chrome.tsx`** — Upgrade from placeholder to real identity strip with Profile data.
2. **`app/(chrome)/layout.tsx`** — Verify skip-to-content link remains first in DOM order (likely no changes needed).

### Files being modified — READ BEFORE EDITING

**`components/devtools-chrome.tsx` (UPDATE)**
- Current state: renders `<header>` with placeholder `devtools://hossam` text and basic tab `<ul>`
- What changes: Replace placeholder with structured identity strip (name + role left, reserved space right); keep existing tab row structure; ensure `<nav>` has correct `aria-label`
- What must be preserved: `usePathname()` active-tab logic, `isActiveTab()` helper, `next/link` usage, `"use client"` directive, `cn()` utility

**`app/(chrome)/layout.tsx` (VERIFY — likely no changes)**
- Current state: skip link renders before `<DevToolsChrome />`, `<main id="main-content">` wraps children
- What to verify: skip link is still the first focusable element in `<body>`
- What must be preserved: `AnimatePresence` setup, `pageVariants`, `useShouldAnimate()` gating, `"use client"` directive

### Files being created

None — this story modifies existing files only.

### Project guardrails that bite in this story

- **`@/*` maps to project root** — imports use `@/components/...`, `@/lib/...`, `@/hooks/...`
- **`framer-motion` import** — NOT `motion/react`. The `motion` package is not installed. Use `import { motion, AnimatePresence } from "framer-motion"`
- **Named exports only** for components (except `page.tsx`/`layout.tsx` which MUST default-export)
- **No `import React`** — JSX runtime is `react-jsx`
- **Semantic HTML** — `<header>` for identity strip, `<nav aria-label="DevTools tabs">` for tab row
- **Token-only styling** — `bg-surface`, `border-hairline`, `text-foreground`, `text-muted-foreground`, `border-lime`
- **Profile data from `lib/content/profile.ts`** — import the already-instantiated `profile` object (not the schema)

### Testing standards for this story

- **No new unit tests required** — this story is UI/chrome polish. Existing test harness validates nothing is broken.
- **Verification = gate checks + browser spot-check**
- **Browser spot-check list:**
  1. Navigate to `/` — identity strip shows name + role, tabs render
  2. Click each tab — active tab underline updates, chrome does NOT flicker/re-mount
  3. Hard-refresh on `/work` — identity strip + tabs paint immediately
  4. Press `Tab` — skip-to-content link appears, Enter jumps to main content
  5. Confirm name and role text is readable and hierarchy is clear (name > role)
  6. Open `/recruiter` — chrome is absent entirely (not hidden)
  7. Console has zero errors/warnings

### Technical Requirements

**`components/devtools-chrome.tsx` requirements:**
- Named export: `export function DevToolsChrome()`
- `"use client"` (uses `usePathname` from `next/navigation`)
- Import `profile` from `@/lib/content/profile`
- Render `<header>` containing:
  - Identity strip row: flex container with `justify-between`
    - Left: `profile.name` (e.g., `text-sm font-semibold text-foreground`) + `profile.role` (e.g., `font-mono text-xs uppercase tracking-wider text-muted-foreground`)
    - Right: placeholder spacer for future Recruiter chip + XP bar
  - `<nav aria-label="DevTools tabs">` with `<ul className="flex gap-1 px-4">`
    - 5 tabs: `/` (Elements), `/work` (Network), `/console` (Console), `/perf` (Performance), `/sources` (Sources)
    - Active: `border-b-2 border-lime text-foreground` + `aria-current="page"`
    - Inactive: `border-b-2 border-transparent text-muted-foreground hover:text-foreground`
    - Tab text: `font-mono text-xs uppercase tracking-wider`
- Keep `border-b border-hairline bg-surface` on `<header>`
- Keep `isActiveTab()` helper with nested-route support

**Profile data fallback:**
If `profile.name` is empty string (as observed in current `lib/content/profile.ts`), use a sensible fallback in the component:
```tsx
const displayName = profile.name || "Hossam Marey"
```
This ensures the UI is never broken even if content is incomplete. Do NOT modify `lib/content/profile.ts` — that file is content-authoring territory, not this story's scope.

### Previous-Story Intelligence (Story 2.1)

- **`components/devtools-chrome.tsx` exists** — created in Story 2.1 with placeholder identity strip and working tab row [Story 2.1]
- **`isActiveTab()` helper handles nested routes** — `pathname === href || pathname.startsWith(href + "/")` for non-root tabs [Story 2.1 review fix]
- **`app/(chrome)/layout.tsx` has skip link + AnimatePresence** — verified working [Story 2.1]
- **Tab row uses `next/link`** — correct pattern already in place [Story 2.1]
- **`yarn test:run` passes (10 tests, 3 files)** — do not break the harness [Story 2.1]
- **`yarn lint` passes clean** — maintain zero errors [Story 2.1]
- **`yarn build` succeeds** — 31 static pages generated [Story 2.1]
- **Semantic tokens only** — `bg-surface`, `border-hairline`, `text-foreground`, etc. [Story 1.1]
- **No hardcoded hex/oklch in JSX** — all colors via tokens [Story 1.1]
- **Conventional Commits** — `feat:` for new features, `chore:` for structural moves [project-context.md]

### Architecture Compliance

**Routing topology (ARCH-2):**
- `(chrome)` group holds 6 chrome'd routes; `/recruiter` lives outside; root layout has NO chrome
- Already implemented in Story 2.1 — no changes needed

**Component composition (ARCH-7):**
- RSC by default; `"use client"` only where hooks/browser APIs needed
- `DevToolsChrome` is correctly a client component (uses `usePathname()`)

**Accessibility (NFR-A1–A4):**
- WCAG 2.1 AA
- Full keyboard nav
- `prefers-reduced-motion` gates every animation (handled in layout.tsx AnimatePresence)
- Semantic HTML: `<header>`, `<nav>`, `<main>`
- Skip-to-content link

### Library / Framework Requirements

| Library | Version | Usage |
|---|---|---|
| Next.js | 16.1.7 | App Router, `usePathname()` from `next/navigation` |
| React | 19.2.4 | Client component (`"use client"`) |
| Tailwind CSS | 4.2.1 | Semantic tokens only |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.2] — story statement + ACs
- [Source: _bmad-output/planning-artifacts/architecture.md#Routing topology] — route-group chrome split
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — DevToolsChrome component spec
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] — mobile chrome deferred to Story 2.3
- [Source: _bmad-output/project-context.md#Framework-Specific Rules] — Next.js App Router rules, import ordering
- [Source: _bmad-output/implementation-artifacts/2-1-establish-the-chrome-route-group-and-root-layout.md] — previous story completion notes

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

- `yarn typecheck` → pass (clean)
- `yarn lint` → pass (0 errors, 0 warnings)
- `yarn test:run` → 10 passed (3 files) — no regression from Story 2.1
- `yarn build` → "Compiled successfully"; 31 static pages generated

### Completion Notes List

- **`components/devtools-chrome.tsx`** — Upgraded from placeholder to real identity strip:
  - Imported `profile` from `@/lib/content/profile`
  - Added `displayName` fallback: `profile.name || "Hossam Marey"` (since `profile.name` is currently empty string in content)
  - Structured identity strip with `flex items-center justify-between` layout
  - Left side: name (`text-sm font-semibold text-foreground`) + role (`font-mono text-xs uppercase tracking-wider text-muted-foreground`)
  - Right side: placeholder spacer (`ms-auto flex items-center gap-3`) for future Recruiter Mode chip (Epic 6) and XP bar (Story 2.5)
  - Fixed `aria-label` on `<nav>` from `"DevTools panels"` to `"DevTools tabs"` per AC2
  - Preserved all existing functionality: `isActiveTab()` helper, `next/link` usage, active/inactive tab styling, `usePathname()` hook
- **`app/(chrome)/layout.tsx`** — Verified skip link remains first focusable element before `<DevToolsChrome />`; no changes needed

### File List

- `components/devtools-chrome.tsx` (modified) — upgraded identity strip with Profile data, fixed nav aria-label

### Change Log

- 2026-05-30 — Implemented Story 2.2: upgraded DevToolsChrome identity strip with name + role from Profile, reserved right-side space for future features, fixed nav aria-label to "DevTools tabs". Status → review.

### Review Findings

- [x] [Review][Patch] **Profile data robustness — `profile.role` lacks fallback and whitespace bypasses `||` guard** [components/devtools-chrome.tsx:24,33-35] — Fixed: Changed `displayName` to `profile.name?.trim() || "Hossam Marey"` and added `displayRole = profile.role?.trim() || "Senior Front-End Developer"`. [blind+edge+auditor]
- [x] [Review][Patch] **Adjacent name/role spans lack semantic separation for screen readers** [components/devtools-chrome.tsx:30-35] — Fixed: Added `aria-label={\`${displayName}, ${displayRole}\`}` on the parent div for clear screen reader announcement. [edge]
- [x] [Review][Defer] **Unhandled Zod parse crash at module initialization** [lib/content/profile.ts:49] — `ProfileSchema.parse()` runs at top level without try/catch; invalid content crashes module import before React mounts. deferred, pre-existing [edge]
- [x] [Review][Defer] **Horizontal overflow on narrow viewports** [components/devtools-chrome.tsx:42-43] — Tab row has no `overflow-x-auto`, `flex-wrap`, or truncation. Mobile bottom tab bar is Story 2.3 scope. deferred, out of scope [edge]
- [x] [Review][Defer] **Exported `profile` singleton is mutable** [lib/content/profile.ts:49] — Non-frozen export allows accidental mutation by any importer. deferred, pre-existing [edge]
- [x] [Review][Defer] **`isActiveTab` null-pathname runtime hazard** [components/devtools-chrome.tsx:16-18] — `usePathname()` returns `string | null`; `startsWith()` on null throws for non-root tabs during SSR/hydration. deferred, pre-existing (Story 2.1) [auditor]

