# Story 2.3: Mobile bottom tab bar

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a mobile visitor,
I want a thumb-reachable bottom tab bar instead of off-screen scrolling tabs,
So that all five panels are discoverable on a phone.

## Context & Orientation (read first)

This is **Story 2.3 of Epic 2 (Chrome & Navigation)**, building directly on **Stories 2.1 and 2.2** which delivered:
- `app/(chrome)/layout.tsx` with persistent chrome mounting, `AnimatePresence` transitions, skip-to-content link
- `components/devtools-chrome.tsx` — identity strip with `Profile.name` + `Profile.role`, tab row with 5 DevTools tabs, active-tab detection via `usePathname()`, `isActiveTab()` helper for nested routes
- All 7 stub routes navigable with zero console errors

**This story adds the mobile-responsive bottom tab bar.** On viewports `<640px`, the top tab row is replaced by a fixed bottom tab bar that honors `env(safe-area-inset-bottom)`. The identity strip stays single-row at the top. This is a **deliberate departure** from `docs/design-system.md` §10 (which calls for top scrollable tabs) — endorsed by PRD FR-004 and UX-DR10.

**Scope fence — what this story does NOT do:**
- It does NOT wire the `D` hotkey dark-only toast (Story 2.4)
- It does NOT build the XP bus or bar (Story 2.5)
- It does NOT implement Recruiter Mode toggle logic (Epic 6)
- It does NOT add new pages or content (Epics 3–7)
- It does NOT add icons to desktop tabs (they remain text-only on desktop)

## Acceptance Criteria

**AC1 — Mobile bottom tab bar replaces top tab row on <640px (FR-004 + UX-DR10).**
**Given** the viewport is `<640px`
**When** the chrome renders
**Then** the top tab row (`<nav aria-label="DevTools tabs">`) is **hidden** (`hidden sm:flex`), and a fixed bottom tab bar (`fixed bottom-0 inset-x-0`) is **shown** (`flex sm:hidden`) with `env(safe-area-inset-bottom)` padding, `border-t border-hairline bg-surface` styling, and `z-50` to stay above content.

**AC2 — Bottom tab bar shows all 5 tabs with icons + labels (or icons-only at 360px) (NFR-R1).**
**Given** the viewport is between 360px and 640px
**When** the bottom tab bar renders
**Then** all 5 tabs are visible as flex items with `flex-1`, each containing a Lucide icon + label stacked vertically (icon above, label below), active tab gets `border-t-2 border-lime` + lime-colored icon + `aria-current="page"`, inactive tabs get `border-t-2 border-transparent` + muted icon, and tab text uses `font-mono text-[10px] uppercase tracking-wider`.

**AC3 — Bottom tab bar fits 5 tabs at 360px width without overflow (NFR-R1).**
**Given** the viewport is as narrow as 360px
**When** the bottom tab bar renders
**Then** all 5 tabs still fit with no horizontal overflow; labels may truncate with `truncate` or hide entirely (`hidden` on labels, icon-only) while the active tab shows a small lime dot indicator below the icon, and touch targets are `≥44×44px` (`min-h-[44px] min-w-[44px]`).

**AC4 — Tab navigation remains accessible on mobile (NFR-A4).**
**Given** the bottom tab bar is visible
**When** read by a screen reader
**Then** the bar announces as `<nav aria-label="DevTools tabs">` with 5 tab items, the active tab announces as current, focus order is logical (skip link → identity strip → main content → bottom tabs are reachable via Tab after scrolling), and each tab is a real `<Link>` from `next/link` (not a `<button>`).

**AC5 — Main content accounts for bottom bar height (NFR-R1).**
**Given** the bottom tab bar is fixed at the bottom
**When** page content renders
**Then** `<main id="main-content">` has bottom padding (`pb-16` or `pb-[calc(4rem+env(safe-area-inset-bottom))]`) so the last content is not obscured by the tab bar, and this padding only applies on mobile (`sm:pb-0`).

**AC6 — Identity strip stays at top on mobile (FR-004).**
**Given** the viewport is `<640px`
**When** the chrome renders
**Then** the identity strip (`<header>`) stays single-row at the top (not moved to bottom), with name + role still visible, and the tab row inside `<header>` is hidden on mobile while the bottom bar takes over navigation.

**AC7 — Active tab state is consistent between desktop and mobile (FR-003).**
**Given** the active route is `/work`
**When** viewed on desktop (`≥640px`) and mobile (`<640px`)
**Then** both the top tab row and the bottom tab bar highlight the "Network" tab with lime underline/border (`border-b-2 border-lime` on desktop, `border-t-2 border-lime` on mobile), and `aria-current="page"` is set on the active tab in both contexts.

**AC8 — Static-first with zero console errors (NFR-P2 + NFR-A4).**
**Given** the chrome upgrades
**When** any chrome'd tab is hard-refreshed on mobile
**Then** the identity strip + bottom tab bar paint immediately without JS, hydration adds interactivity with zero console errors or warnings, and the chrome DOM identity is retained (no re-mount/flicker) when navigating between tabs.

**AC9 — Build and checks remain green.**
**Given** all changes
**When** `yarn typecheck && yarn lint && yarn test:run && yarn build` run
**Then** all pass with no new errors/warnings.

## Tasks / Subtasks

- [x] **Task 1 — Read current state (AC1, AC6)**
  - [x] Read `components/devtools-chrome.tsx` to understand current structure
  - [x] Read `app/(chrome)/layout.tsx` to understand main content wrapper
  - [x] Verify existing tabs array and `isActiveTab()` helper
  - [x] Check available Lucide icons for tab metaphors

- [x] **Task 2 — Restructure DevToolsChrome for responsive nav (AC1, AC6, AC7)**
  - [x] Add `hidden sm:flex` to the existing top `<nav>` tab row
  - [x] Create bottom tab bar component (`<nav>` with `fixed bottom-0`, `flex sm:hidden`)
  - [x] Map each tab to a Lucide icon: Elements (`Code`), Network (`Globe`), Console (`Terminal`), Performance (`Activity`), Sources (`FileText`)
  - [x] Active state: `border-t-2 border-lime text-lime` + `aria-current="page"`
  - [x] Inactive state: `border-t-2 border-transparent text-muted-foreground`
  - [x] Ensure both top and bottom navs share the same `tabs` array and `isActiveTab()` logic

- [x] **Task 3 — Handle narrow viewport (360px) with icon-only fallback (AC3)**
  - [x] Use `truncate` with `max-w-full` and `text-[10px]` to prevent overflow at 360px
  - [x] Ensure `min-h-[44px] min-w-[44px]` touch targets on all tabs
  - [x] All 5 tabs fit within 360px without horizontal overflow

- [x] **Task 4 — Add safe-area and z-index styling (AC1, AC5)**
  - [x] Bottom bar: `pb-[env(safe-area-inset-bottom)]` for iOS notch/home indicator
  - [x] Bottom bar: `z-50` to stay above page content
  - [x] Update `app/(chrome)/layout.tsx`: add `pb-16 sm:pb-0` to `<main>`
  - [x] Verify `bg-surface` + `border-t border-hairline` styling matches chrome aesthetic

- [x] **Task 5 — Verify accessibility (AC4)**
  - [x] Bottom bar uses `<nav aria-label="DevTools tabs">`
  - [x] Active tab gets `aria-current="page"`
  - [x] All tabs are real `<Link>` elements (not buttons)
  - [x] Touch targets are `≥44×44px`

- [x] **Task 6 — Browser verification (AC8)**
  - [x] Desktop (`≥640px`): top tab row visible, bottom bar hidden, identity strip at top
  - [x] Mobile (`<640px`): bottom bar visible, top tab row hidden, identity strip stays at top
  - [x] Navigate between tabs on mobile — chrome does NOT re-mount
  - [x] Console has zero errors/warnings

- [x] **Task 7 — Run gates (AC9)**
  - [x] `yarn typecheck` → clean
  - [x] `yarn lint` → clean (0 errors, 0 warnings)
  - [x] `yarn test:run` → 10 passed (3 files)
  - [x] `yarn build` → succeeds (31 static pages)

## Dev Notes

### Architecture context

**Responsive nav strategy:** A single `DevToolsChrome` component renders both desktop and mobile navigation, toggling visibility via responsive Tailwind utilities (`hidden sm:flex` / `flex sm:hidden`). This avoids duplicating state/logic and keeps the component tree shallow. The tab data (href, label, icon) lives in one array consumed by both nav surfaces.

**Why bottom bar on mobile?** The UX spec endorses this as a deliberate departure from the design-system's top-scroll recommendation. Bottom bars are thumb-reachable, conventional in 2026 mobile apps, and prevent off-screen tabs from being invisible. This decision is logged in `docs/design-system.md` departures.

**Identity strip preservation:** The identity strip (`<header>` with name + role) stays at the top on mobile. Only the tab row moves to the bottom. This matches real DevTools behavior (the URL/identity bar stays top; panel tabs are an app-level concern).

**Safe-area handling:** iOS Safari and modern mobile browsers reserve bottom space for the home indicator. `env(safe-area-inset-bottom)` adds dynamic padding so the tab bar isn't obscured. The tab bar's own padding accounts for this; the `<main>` padding accounts for the total bar height.

### What is being changed

1. **`components/devtools-chrome.tsx`** — Major upgrade: add bottom tab bar, make top tab row responsive, add icons to tabs.
2. **`app/(chrome)/layout.tsx`** — Minor update: add bottom padding to `<main>` so content isn't hidden behind the fixed bottom bar on mobile.

### Files being modified — READ BEFORE EDITING

**`components/devtools-chrome.tsx` (UPDATE)**
- Current state: renders `<header>` with identity strip + top tab row (`<nav>` with `<ul className="flex gap-1 px-4">`)
- What changes:
  - Add Lucide icons to each tab (import from `lucide-react`)
  - Make top `<nav>` hidden on mobile: `hidden sm:flex` (or `hidden` with responsive prefix)
  - Add new bottom `<nav>` fixed at bottom, visible only on mobile: `fixed bottom-0 inset-x-0 flex sm:hidden`
  - Bottom bar uses `flex` with `flex-1` children (not `<ul>`/`<li>`)
  - Active indicator on bottom: `border-t-2 border-lime` (top border, not bottom)
  - Add safe-area padding: `pb-[env(safe-area-inset-bottom)]`
- What must be preserved:
  - `usePathname()` active-tab logic
  - `isActiveTab()` helper with nested-route support
  - `next/link` usage (real `<Link>`, not `<a>` or `<button>`)
  - `profile` data import and display
  - Semantic HTML: `<header>`, `<nav aria-label="DevTools tabs">`
  - Tab text styling: `font-mono text-xs uppercase tracking-wider`
  - `cn()` utility for conditional classes

**`app/(chrome)/layout.tsx` (UPDATE)**
- Current state: `<main id="main-content" className="flex-1">` wraps children
- What changes: Add bottom padding on mobile to account for fixed bottom bar
  - `className="flex-1 pb-16 sm:pb-0"` (or `pb-[calc(4rem+env(safe-area-inset-bottom))]`)
- What must be preserved:
  - `AnimatePresence` setup
  - `pageVariants` and transition durations
  - `useShouldAnimate()` gating
  - Skip-to-content link as first child
  - `id="main-content"` for skip link target

### Files being created

None — this story modifies existing files only.

### Project guardrails that bite in this story

- **`@/*` maps to project root** — imports use `@/components/...`, `@/lib/...`, `@/hooks/...`
- **`framer-motion` import** — NOT `motion/react`. The `motion` package is not installed. Use `import { motion, AnimatePresence } from "framer-motion"`
- **Named exports only** for components (except `page.tsx`/`layout.tsx` which MUST default-export)
- **No `import React`** — JSX runtime is `react-jsx`
- **Semantic HTML** — `<header>` for identity strip, `<nav aria-label="DevTools tabs">` for tab row + bottom bar
- **Token-only styling** — `bg-surface`, `border-hairline`, `text-foreground`, `text-muted-foreground`, `border-lime`, `text-lime`
- **Logical properties** — use `inset-x-0` (not `left-0 right-0`), `border-t` (not `border-top`)
- **Lucide icons** — import specific icons (tree-shaken): `import { Code, Globe, Terminal, Activity, FileText } from "lucide-react"`
- **Touch targets** — `min-h-[44px] min-w-[44px]` for every tab button/link
- **`usePathname()` returns `string | null`** — guard against null in `isActiveTab()` (Story 2.1 review noted this)

### Testing standards for this story

- **No new unit tests required** — this story is UI/responsive polish. Existing test harness validates nothing is broken.
- **Verification = gate checks + browser spot-check**
- **Browser spot-check list:**
  1. Desktop (`≥640px`): top tab row visible, bottom bar hidden, identity strip at top
  2. Mobile (`<640px`): bottom bar visible, top tab row hidden, identity strip stays at top
  3. Click each tab on mobile — URL updates, content swaps, chrome does NOT flicker/re-mount
  4. Hard-refresh on mobile (`/work`) — bottom bar + identity strip paint immediately
  5. 360px width — all 5 tabs fit, no horizontal overflow, touch targets are large enough
  6. iOS Safari (if available) — safe-area padding works, no overlap with home indicator
  7. Tab through page on mobile — skip link → identity → main content → tabs reachable
  8. Console has zero errors/warnings
  9. Reduced motion — tab switches are instant (handled by AnimatePresence in layout)

### Technical Requirements

**Tab-to-icon mapping:**
| Tab | Label | Icon (Lucide) | Rationale |
|-----|-------|---------------|-----------|
| `/` | Elements | `Code` | `<>` shape evokes markup/elements |
| `/work` | Network | `Globe` | Network/internet metaphor |
| `/console` | Console | `Terminal` | Terminal/console metaphor |
| `/perf` | Performance | `Activity` | Metrics/activity chart metaphor |
| `/sources` | Sources | `FileText` | File/document metaphor |

**Responsive visibility:**
```tsx
// Top tab row (desktop)
<nav aria-label="DevTools tabs" className="hidden sm:flex">
  ...existing tab row...
</nav>

// Bottom tab bar (mobile)
<nav
  aria-label="DevTools tabs"
  className="fixed bottom-0 inset-x-0 z-50 flex sm:hidden border-t border-hairline bg-surface pb-[env(safe-area-inset-bottom)]"
>
  {tabs.map((tab) => (
    <Link
      key={tab.href}
      href={tab.href}
      className={cn(
        "flex flex-1 flex-col items-center justify-center min-h-[44px] min-w-[44px] gap-0.5 border-t-2 px-1 py-1 transition-colors",
        isActive
          ? "border-lime text-lime"
          : "border-transparent text-muted-foreground"
      )}
      aria-current={isActive ? "page" : undefined}
    >
      <Icon className="h-4 w-4" />
      <span className="font-mono text-[10px] uppercase tracking-wider truncate">{tab.label}</span>
    </Link>
  ))}
</nav>
```

**Main content padding:**
```tsx
// In app/(chrome)/layout.tsx
<main id="main-content" className="flex-1 pb-16 sm:pb-0">
  ...children...
</main>
```

**360px icon-only fallback:**
At 360px, 5 tabs with labels may overflow. Options:
1. Truncate labels with `truncate` and `max-w-[60px]`
2. Hide labels below a custom breakpoint, show icon-only with a lime dot below active icon
3. Use `text-[9px]` or smaller font

Recommended approach: hide labels on very narrow screens (`hidden` on label span), show a `2px` lime dot (`w-1 h-1 rounded-full bg-lime`) below the active icon only. This keeps the bar clean and readable.

```tsx
// Inside bottom tab Link:
<span className={cn("hidden @xs:inline", "font-mono text-[10px] uppercase tracking-wider truncate")}>
  {tab.label}
</span>
{isActive && !showLabels && <span className="h-1 w-1 rounded-full bg-lime" />}
```

Note: `@xs` container query may not be available. Use a simpler approach: always show labels but truncate aggressively, or use `hidden sm:inline` combined with a custom `xs:` breakpoint if configured. If no custom breakpoint exists, use `hidden` on labels and show icon-only — this is acceptable per NFR-R1.

### Previous-Story Intelligence (Stories 2.1, 2.2)

- **`components/devtools-chrome.tsx` exists** — created in Story 2.1, upgraded in Story 2.2 [Story 2.1, 2.2]
- **`isActiveTab()` handles nested routes** — `pathname === href || pathname.startsWith(href + "/")` for non-root tabs [Story 2.1 review fix]
- **`usePathname()` can return `null`** — guard needed in `isActiveTab()` [Story 2.1 review defer]
- **`app/(chrome)/layout.tsx` has skip link + AnimatePresence** — verified working [Story 2.1]
- **Tab row uses `next/link`** — correct pattern already in place [Story 2.1]
- **Identity strip shows name + role** — `profile.name` and `profile.role` with fallbacks [Story 2.2]
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
- Touch targets `≥44×44px`

**Responsiveness (NFR-R1–R3):**
- Mobile-first; usable below 360px
- Bottom tab bar replaces top row on `<640px`
- No horizontal overflow at 360px

**Performance (NFR-P2, NFR-P5, NFR-P6):**
- `transform`/`opacity`-only animation (handled by AnimatePresence)
- `<100ms` interaction latency
- No new dependencies

### Library / Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| Next.js | 16.1.7 | App Router, `usePathname()` from `next/navigation`, `Link` from `next/link` |
| React | 19.2.4 | Client component (`"use client"`) |
| Tailwind CSS | 4.2.1 | Semantic tokens, responsive utilities (`sm:`, `hidden`), arbitrary values (`min-h-[44px]`) |
| lucide-react | 1.16.0 | Tab icons: `Code`, `Globe`, `Terminal`, `Activity`, `FileText` |
| framer-motion | 12.40.0 | Already used in layout for AnimatePresence |

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.3] — story statement + ACs
- [Source: _bmad-output/planning-artifacts/architecture.md#Routing topology] — route-group chrome split
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Responsive Strategy] — mobile bottom tab bar (deliberate departure from design-system)
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Navigation Patterns] — main nav (mobile) spec
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy] — DevToolsChrome component spec
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Departure: Mobile bottom tab bar vs. design-system spec] — rationale for bottom bar
- [Source: _bmad-output/project-context.md#Framework-Specific Rules] — Next.js App Router rules, RSC discipline, import ordering
- [Source: _bmad-output/project-context.md#Critical Don't-Miss Rules] — anti-patterns specific to this project
- [Source: _bmad-output/implementation-artifacts/2-1-establish-the-chrome-route-group-and-root-layout.md] — previous story completion notes
- [Source: _bmad-output/implementation-artifacts/2-2-identity-strip-and-devtools-tab-navigation.md] — previous story completion notes

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

- `yarn typecheck` → pass (clean, 4.15s)
- `yarn lint` → pass (0 errors, 0 warnings, 6.75s)
- `yarn test:run` → 10 passed (3 files, 4.01s)
- `yarn build` → Compiled successfully, 31 static pages generated (16.45s)

### Completion Notes List

- **`components/devtools-chrome.tsx`** — Major upgrade to support responsive navigation:
  - Added Lucide icon imports: `Code`, `Globe`, `Terminal`, `Activity`, `FileText`
  - Refactored `tabs` array to include `icon` property with `LucideIcon` type
  - Added `isActiveTab()` null guard for `pathname` (fixes Story 2.1 deferred review item)
  - Split component into two exports: `DevToolsChrome` (header + desktop nav) and `MobileBottomNav` (fixed bottom bar)
  - Desktop `<nav>`: `hidden sm:flex` with `<ul>/<li>` list semantics
  - Mobile bottom `<nav>`: `fixed bottom-0 inset-x-0 z-50 flex sm:hidden` with `<ul>/<li>` list semantics
  - Active state: `border-t-2 border-lime text-foreground` on mobile (consistent with desktop `text-foreground`)
  - Touch targets: `min-h-[44px] min-w-[44px]`
  - Safe-area support: `pb-[env(safe-area-inset-bottom)]`
  - Icon-only fallback: labels hidden below 380px (`hidden [@media(min-width:380px)]:block`), lime dot below active icon when labels hidden
  - `aria-hidden="true"` on all decorative icons
  - `text-[0.625rem]` (rem-based) instead of `text-[10px]` (px)
  - `focus-visible:ring-1 focus-visible:ring-lime` on mobile tabs

- **`app/(chrome)/layout.tsx`** — Restructured DOM order for correct tab sequence:
  - `<DevToolsChrome />` renders before `<main>`
  - `<MobileBottomNav />` renders after `<main>`
  - Tab order: skip link → identity strip → main content → bottom tabs
  - Changed padding to `pb-[calc(4rem+env(safe-area-inset-bottom))] sm:pb-0` for accurate bar height on notched devices

- **`app/layout.tsx`** — Added viewport export:
  - `export const viewport: Viewport = { width: "device-width", initialScale: 1, viewportFit: "cover" }`
  - Enables `env(safe-area-inset-bottom)` on iOS Safari

### File List

- `components/devtools-chrome.tsx` (modified) — added `MobileBottomNav` export with responsive bottom tab bar, Lucide icons, list semantics, safe-area padding, touch targets, icon-only fallback with lime dot, focus-visible rings, rem-based font sizing, aria-hidden on decorative icons
- `app/(chrome)/layout.tsx` (modified) — restructured DOM order (DevToolsChrome → main → MobileBottomNav), updated padding to `pb-[calc(4rem+env(safe-area-inset-bottom))]`
- `app/layout.tsx` (modified) — added `viewport` export with `viewportFit: "cover"`

### Change Log

- 2026-05-30 — Implemented Story 2.3: mobile bottom tab bar with Lucide icons, safe-area support, touch targets ≥44×44px, responsive show/hide between desktop/mobile, main content padding adjustment. All gates pass. Status → review.
- 2026-05-30 — Code review: 3 decision-needed items resolved (split component, icon-only fallback, consistent active text color), 8 patch findings applied (padding, viewport-fit, list semantics, aria-hidden, rem units, focus rings, nav flex class, truncate fix), 1 defer, 3 dismiss. All gates pass after patches. Status → done.
