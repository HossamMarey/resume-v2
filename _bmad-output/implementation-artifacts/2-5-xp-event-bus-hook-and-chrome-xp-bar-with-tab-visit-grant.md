# Story 2.5: XP event bus, hook, and chrome XP bar with tab-visit grant

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a curious visitor,
I want an XP bar that rewards exploring new tabs,
So that the site feels alive without ever gating content.

## Context & Orientation (read first)

This is **Story 2.5 of Epic 2 (Chrome & Navigation)**, building on **Stories 2.1–2.4** which delivered:
- `app/(chrome)/layout.tsx` with persistent chrome, `AnimatePresence` transitions
- `components/devtools-chrome.tsx` — identity strip, tab row, mobile bottom bar
- `components/theme-provider.tsx` — dark-only theme with `D` hotkey toast
- `hooks/use-should-animate.ts` — reduced-motion single source of truth
- All 7 stub routes navigable with zero console errors

**This story builds the XP event bus + hook + chrome XP bar, plus the tab-visit grant mechanism.** It is the load-bearing gamification spine that later epics (4.5, 5.2, 5.4, 6.4) merely *emit into*.

**Scope fence — what this story does NOT do:**
- It does NOT build the Recruiter Mode toggle (Epic 6)
- It does NOT wire XP grants for project opens, REPL commands, Konami, or contact submit (Epics 4–6 emit those)
- It does NOT implement the Recruiter Mode chrome unmount logic (Epic 6)
- It does NOT add new pages or content (Epics 3–7)
- It does NOT add any new dependencies

## Acceptance Criteria

**AC1 — XP event bus emits CustomEvent with clamped values (FR-078 + ARCH-3).**
**Given** `lib/xp/bus.ts` exports `emitXP(delta, reason)`
**When** any surface calls it
**Then** it dispatches `CustomEvent("hm:xp", { detail: { delta, reason, timestamp } })` on `window`, clamps `delta` so the resulting XP stays within `[0,100]` (FR-075), enforces per-session idempotence for `visit:*` reasons against `sessionStorage["hm_xp_granted"]` (FR-075), and returns silently if the reason was already granted this session.

**AC2 — `useXP` hook subscribes, persists, and exposes state (FR-075 + FR-076 + ARCH-3).**
**Given** `hooks/use-xp.ts`
**When** it mounts in a client component
**Then** it reads `localStorage["hm_xp_v1"]` (defaulting to `0` on first visit), subscribes to `hm:xp` events, updates state with the clamped new value, persists back to `localStorage`, and exposes `{ xp, emitXP }` — where `xp` is a number in `[0,100]`.

**AC3 — Tab-visit grant fires once per session per tab (FR-074 + FR-075).**
**Given** the `(chrome)` layout mounts or route changes
**When** the active tab is visited for the first time this session
**Then** `emitXP(10, "visit:<tab>")` fires (e.g., `visit:network`, `visit:console`), the XP bar animates, and re-visiting the same tab in the same session emits nothing.

**AC4 — XP bar renders in chrome with correct a11y (FR-076 + NFR-A4).**
**Given** the chrome renders on `≥sm`
**When** the XP bar mounts
**Then** it renders as a pill-shaped progress bar (`role="progressbar"`, `aria-valuenow={xp}`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label="Site exploration XP"`), with a lime fill using `transform: scaleX(xp/100)`, hidden entirely on mobile (`sm:block hidden`) and under reduced motion (bar hidden, XP still increments silently).

**AC5 — XP toast rises from the bar on each grant (FR-077 + UX-DR5).**
**Given** motion is enabled and XP changes
**When** a grant fires
**Then** a subtle lime pill (`+10 visited Network`) rises from the XP bar and fades over 1.2s; under reduced motion the toast is suppressed while XP still increments silently.

**AC6 — Graceful degradation when storage is unavailable (NFR-O4).**
**Given** `localStorage` or `sessionStorage` is unavailable (private mode, quota exceeded, etc.)
**When** the XP system operates
**Then** it degrades to in-memory state without crashing, XP still increments and emits events, but does not persist across page reloads.

**AC7 — Property tests validate XP math (NFR-O4 + FR-075).**
**Given** `fast-check` runs against the XP reducer
**When** fed arbitrary sequences of deltas
**Then** the resulting XP stays within `[0,100]` for every sequence, and the reducer is idempotent (applying the same delta twice with the same reason in one session yields the same final XP).

**AC8 — Build and checks remain green.**
**Given** all changes
**When** `yarn typecheck && yarn lint && yarn test:run && yarn build` run
**Then** all pass with no new errors/warnings.

## Tasks / Subtasks

- [x] **Task 1 — Read current state**
  - [x] Read `components/devtools-chrome.tsx` to understand chrome structure and XP bar mount point
  - [x] Read `app/(chrome)/layout.tsx` to understand route-change detection for tab-visit grants
  - [x] Read `hooks/index.ts` to understand hook export pattern
  - [x] Read `hooks/use-should-animate.ts` for reduced-motion API
  - [x] Check `package.json` for `fast-check` version

- [x] **Task 2 — Create XP event bus (`lib/xp/bus.ts`) (AC1, AC7)**
  - [x] Define `emitXP(delta, reason)` function
  - [x] Implement per-session idempotence: read/write `sessionStorage["hm_xp_granted"]` as a JSON set of granted reasons
  - [x] Skip dispatch if reason already in session set (applied to ALL reasons per Dev Notes future-proofing, not just `visit:*`)
  - [x] Dispatch `CustomEvent("hm:xp", { detail: { delta, reason, timestamp: Date.now() } })`
  - [x] Wrap `sessionStorage` access in try/catch (graceful degradation)

- [x] **Task 3 — Create `useXP` hook (`hooks/use-xp.ts`) (AC2, AC6)**
  - [x] Read `localStorage["hm_xp_v1"]` on mount (default 0, try/catch wrapped)
  - [x] Subscribe to `window` `hm:xp` events via `addEventListener`
  - [x] Reducer: `newXp = clamp(current + delta, 0, 100)` (via `applyDelta` from bus)
  - [x] Persist `newXp` to `localStorage["hm_xp_v1"]` after each update
  - [x] Expose `{ xp, emitXP }` where `emitXP` is the function from `lib/xp/bus.ts`
  - [x] Use `useEffect` + mounted gate; never read storage during render
  - [x] Cleanup event listener on unmount

- [x] **Task 4 — Create `<XPBar>` component (`components/xp-bar.tsx`) (AC4)**
  - [x] Accept `xp: number` prop
  - [x] Pill shape: `rounded-full` (the only exception to the no-rounded-full rule)
  - [x] Background: `bg-surface border border-hairline`
  - [x] Fill: `bg-lime` with `transform: scaleX(xp / 100)` and `origin-left`
  - [x] Spring animation via `framer-motion` `motion.div` (stiffness 120, damping 20)
  - [x] A11y: `role="progressbar"`, `aria-valuenow`, `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-label="Site exploration XP"`
  - [x] Hidden under reduced motion: `useShouldAnimate()` gates the bar (returns null — bar hidden entirely per AC4)
  - [x] Mobile: hidden (`hidden sm:block`)
  - [x] Desktop widths: `w-32` on desktop, `w-16` base

- [x] **Task 5 — Create `<XPToast>` component (`components/xp-toast.tsx`) (AC5)**
  - [x] Accept `delta: number` and `reason: string` props
  - [x] Render lime pill with `+{delta} {reason}` text (reason humanized: `visit:network` → `visited Network`)
  - [x] Animate: rise 8px + fade over 1.2s via `framer-motion`
  - [x] `AnimatePresence` for mount/unmount (owned by chrome, keyed per grant)
  - [x] Hidden under reduced motion (return null when `useShouldAnimate()` is false)
  - [x] `role="status"`, `aria-live="polite"`

- [x] **Task 6 — Wire XP bar into chrome (`components/devtools-chrome.tsx`) (AC3, AC4)**
  - [x] Import `useXP` from `@/hooks/use-xp`
  - [x] Import `<XPBar>` from `@/components/xp-bar`
  - [x] Import `<XPToast>` from `@/components/xp-toast`
  - [x] Add XP bar to identity strip right region (next to the Recruiter Mode placeholder)
  - [x] Add XP toast positioned relative to the bar (chrome owns listener + 1.2s dismiss timer)
  - [x] Ensure chrome component remains `"use client"`

- [x] **Task 7 — Wire tab-visit grants (`app/(chrome)/layout.tsx`) (AC3)**
  - [x] Import `emitXP` from `@/lib/xp/bus`
  - [x] In a `useEffect` keyed on `pathname`, detect tab changes
  - [x] Map pathname to tab reason: `/` → `visit:elements`, `/work` → `visit:network`, etc.
  - [x] Call `emitXP(10, reason)` on first visit per session
  - [x] Ensure idempotence is handled by `emitXP` (not duplicated here)

- [x] **Task 8 — Write unit + property tests**
  - [x] `lib/xp/bus.test.ts` — test `emitXP` idempotence, event dispatch, session tracking
  - [x] `hooks/use-xp.test.ts` — test hook state, localStorage persistence, event subscription
  - [x] `lib/xp/bus.test.ts` (property) — `fast-check` arbitrary sequences of deltas, verify clamp `[0,100]` + per-reason idempotence
  - [x] Mock `localStorage`/`sessionStorage` in tests (jsdom has them, but mock to test degradation)

- [x] **Task 9 — Run gates (AC8)**
  - [x] `yarn typecheck` → clean
  - [x] `yarn lint` → clean (0 errors, 0 warnings)
  - [x] `yarn test:run` → passes (28 tests, 5 files)
  - [x] `yarn build` → succeeds (31 static pages)

### Review Findings

_Code review 2026-05-31 (Blind Hunter + Edge Case Hunter + Acceptance Auditor). 3 patch (one resolved from a decision), 7 deferred, 10 dismissed. Decisions ②③ resolved as dismiss; decision ① resolved → patch._

**Decisions resolved (2026-05-31):**

- ① Cross-session XP inflation → **patch**: persist granted reasons in `localStorage` (grants become once-ever). NOTE: deviates from the Dev Notes "frozen contract" (`hm_xp_granted` was sessionStorage) and shifts AC1/AC3 from per-session to once-ever idempotence — accepted by user.
- ② Mobile toast with no bar → **dismissed**: intentional sole XP feedback on mobile.
- ③ Reduced-motion hides bar entirely → **dismissed**: accepted as AC4's literal "bar hidden" reading.

**Patch (unambiguous fixes):**

- [x] [Review][Patch] First-visit grant dropped by listener-mount race — FIXED: `useXP` now attaches the counting listener synchronously in a single mount effect and derives the next value from the persisted base (`readXp()`) rather than React state, so the layout's first synchronous emit is caught without clobbering a not-yet-read value. [hooks/use-xp.ts:31-54]
- [x] [Review][Patch] `getGrantedReasons` non-array crash — FIXED: added `Array.isArray` guard so corrupt/tampered `hm_xp_granted` JSON (e.g. `"{}"`) returns `[]` instead of throwing `TypeError` out of `emitXP`. New regression test added. [lib/xp/bus.ts:39-47]
- [x] [Review][Patch] Cross-session XP inflation (decision ①) — FIXED: granted-reason persistence moved from `sessionStorage` to `localStorage` (`hm_xp_granted`); each reason now grants once ever, so the persisted total no longer re-inflates each session. Tests updated. [lib/xp/bus.ts:5,38-56]

**Deferred (real but not actionable now — see deferred-work.md):**

- [x] [Review][Defer] Toast `id`/`key` = `Date.now()` collides on same-ms emits; single-slot toast drops rapid grants [components/devtools-chrome.tsx:57,64-68,88] — deferred, latent until multi-emitter epics 4–6
- [x] [Review][Defer] No cross-tab `storage` event sync — XP diverges across tabs and stale overwrite on reload [hooks/use-xp.ts] — deferred, out of scope for this story
- [x] [Review][Defer] Multiple `useXP` consumers would double-count and last-writer-wins on persist [hooks/use-xp.ts:39-53] — deferred, latent until a 2nd consumer mounts
- [x] [Review][Defer] Nested routes (`/work/[slug]`) grant no visit XP though the tab shows active [app/(chrome)/layout.tsx:23-29] — deferred, confirm intended
- [x] [Review][Defer] `useShouldAnimate` returns true during framer null-resolution → brief flash of bar/toast for reduced-motion users [components/xp-bar.tsx:13, components/xp-toast.tsx:22] — deferred, cosmetic
- [x] [Review][Defer] Import-ordering guardrail not followed in the two modified files (external `lucide-react`/`react` after internal aliases, no blank-line groups) [components/devtools-chrome.tsx:1-15, app/(chrome)/layout.tsx:1-9] — deferred, pre-existing, lint passes
- [x] [Review][Defer] `favicon.ico` swapped (25931→4286 bytes), not in story File List [app/favicon.ico] — deferred, out-of-scope change bundled in working tree; confirm intentional and commit separately

## Dev Notes

### Architecture context

**XP system design:** This is a lightweight event-driven system intentionally without a state-management library. The bus (`lib/xp/bus.ts`) is the write surface; the hook (`hooks/use-xp.ts`) is the read surface. Any component can call `emitXP()`; any component can call `useXP()` to read the current value. The chrome XP bar reads; the layout writes (tab visits). Later epics will also write.

**Session idempotence:** `sessionStorage["hm_xp_granted"]` stores a JSON array of granted reason strings. `emitXP()` checks this array before dispatching for *all* reasons (not just `visit:*` — this is future-proofing). If the reason exists in the array, the call returns silently. After a successful dispatch, the reason is appended. This means:
- `emitXP(10, "visit:network")` → dispatches, adds `"visit:network"` to session set
- `emitXP(10, "visit:network")` again → silently returns
- `emitXP(15, "open:project-x")` → dispatches (different reason)

**localStorage fallback:** Both `localStorage` and `sessionStorage` access must be wrapped in try/catch. In private mode or when storage is disabled, the catch block silently continues with in-memory state. The XP bar still works; it just resets on reload.

**SSR safety:** Never read `localStorage` during render. The `useXP` hook must:
1. Initialize state to `0` (or read from a server-safe default)
2. In `useEffect`, read `localStorage` and update state if different
3. Subscribe to `hm:xp` events in `useEffect`
4. This mirrors the `next-themes` pattern already in the codebase.

### What is being changed

1. **`lib/xp/bus.ts`** (NEW) — XP event bus with `emitXP()` and session idempotence
2. **`hooks/use-xp.ts`** (NEW) — Hook subscribing to XP events, managing state, persisting to localStorage
3. **`components/xp-bar.tsx`** (NEW) — Visual XP bar component for chrome
4. **`components/xp-toast.tsx`** (NEW) — XP toast notification component
5. **`components/devtools-chrome.tsx`** (UPDATE) — Add XP bar + toast to identity strip
6. **`app/(chrome)/layout.tsx`** (UPDATE) — Add tab-visit grant logic on route change
7. **`hooks/index.ts`** (UPDATE) — Re-export `use-xp`
8. **`lib/xp/bus.test.ts`** (NEW) — Unit + property tests for XP bus
9. **`hooks/use-xp.test.ts`** (NEW) — Unit tests for useXP hook

### Files being modified — READ BEFORE EDITING

**`components/devtools-chrome.tsx` (UPDATE)**
- Current state: identity strip with name + role left, empty right div with `{/* XP bar — Story 2.5 */}` placeholder
- What changes:
  - Add `useXP` import and call inside `DevToolsChrome`
  - Add `<XPBar xp={xp} />` in the right div
  - Add `<XPToast />` positioned near the bar (toast needs its own state management — likely a local state in the chrome that listens to `hm:xp` events separately, or the toast is rendered conditionally based on the last event)
- What must be preserved:
  - All existing tab navigation, mobile bottom bar, identity strip
  - `usePathname()` active tab logic
  - Responsive behavior (`sm:` breakpoints)

**`app/(chrome)/layout.tsx` (UPDATE)**
- Current state: `ChromeLayout` with `AnimatePresence`, `useShouldAnimate`, skip link
- What changes:
  - Add `emitXP` import from `@/lib/xp/bus`
  - Add `useEffect` keyed on `pathname` to emit tab-visit XP
  - Tab-to-reason mapping: `/` → `visit:elements`, `/work` → `visit:network`, `/console` → `visit:console`, `/perf` → `visit:performance`, `/sources` → `visit:sources`
- What must be preserved:
  - `AnimatePresence` setup
  - `pageVariants` and transition durations
  - `useShouldAnimate()` gating
  - Skip-to-content link
  - `id="main-content"` for skip link target

**`hooks/index.ts` (UPDATE)**
- Current state: `export * from "./use-should-animate"`
- What changes: Add `export * from "./use-xp"`

### Files being created

- `lib/xp/bus.ts` — `emitXP(delta, reason)` with session idempotence
- `hooks/use-xp.ts` — `useXP()` hook
- `components/xp-bar.tsx` — `<XPBar xp={number} />`
- `components/xp-toast.tsx` — `<XPToast delta={number} reason={string} />`
- `lib/xp/bus.test.ts` — Unit + property tests
- `hooks/use-xp.test.ts` — Unit tests

### Project guardrails that bite in this story

- **`@/*` maps to project root** — imports use `@/lib/xp/bus`, `@/hooks/use-xp`, `@/components/xp-bar`
- **`framer-motion` import** — NOT `motion/react`. Use `import { motion, AnimatePresence, useSpring } from "framer-motion"`
- **Named exports only** for components/hooks (except `page.tsx`/`layout.tsx`)
- **No `import React`** — JSX runtime is `react-jsx`
- **Import ordering** (blank lines between groups, alpha within):
  1. External (`react`, `next/*`, `framer-motion`, `sonner`)
  2. Internal aliases (`@/lib/*`, `@/components/*`, `@/hooks/*`)
  3. Relative (`./`, `../`)
  4. Side-effect/style last
- **Storage keys (frozen contract):** `hm_xp_v1` (localStorage), `hm_xp_granted` (sessionStorage)
- **Never read `localStorage` in render** — always `useEffect` + mounted gate
- **Wrap storage access in try/catch** — graceful degradation to in-memory
- **XP capped `[0, 100]`** — clamp on every update
- **`useShouldAnimate()`** gates every animation; no per-component re-derivation
- **`transform` / `opacity` only** for animation
- **Token-only styling** — `bg-lime`, `bg-surface`, `border-hairline`, `text-foreground`

### Testing standards for this story

**Unit tests (`lib/xp/bus.test.ts`):**
- `emitXP` dispatches a `CustomEvent` with correct detail shape
- `emitXP` skips duplicate reasons in the same session
- `emitXP` wraps `sessionStorage` in try/catch (degradation)
- `emitXP` handles non-`visit:*` reasons without idempotence (or with — decide in implementation)

**Unit tests (`hooks/use-xp.test.ts`):**
- Hook reads `localStorage["hm_xp_v1"]` on mount
- Hook updates state when `hm:xp` event fires
- Hook persists new value to `localStorage`
- Hook handles missing `localStorage` gracefully
- Hook cleans up event listener on unmount

**Property tests (`lib/xp/bus.test.ts`):**
- Use `fast-check` `fc.array(fc.integer({ min: -1000, max: 1000 }))` for arbitrary delta sequences
- Verify: for any sequence, final XP ∈ [0, 100]
- Verify: idempotence — same reason twice in one session = same final XP as once

**Browser spot-check list:**
1. Load `/` — XP bar visible (if `≥sm`), starts at 0
2. Click Network tab — `+10 visited Network` toast appears, bar fills to ~10%
3. Click Elements tab (back) — no toast, XP stays at 10
4. Click Network tab again — no toast, XP stays at 10
5. Hard-refresh — XP persists (if localStorage available)
6. Press `D` key — toast appears, XP unchanged
7. Console has zero errors/warnings
8. Reduced motion toggle — bar hidden, toasts suppressed, XP still increments on tab change

### Technical Requirements

**Tab-to-reason mapping:**
```ts
const tabReasons: Record<string, string> = {
  "/": "visit:elements",
  "/work": "visit:network",
  "/console": "visit:console",
  "/perf": "visit:performance",
  "/sources": "visit:sources",
}
```

**XP reducer (clamp logic):**
```ts
function clamp(xp: number): number {
  return Math.max(0, Math.min(100, xp))
}
```

**Session idempotence (`lib/xp/bus.ts`):**
```ts
function getGrantedReasons(): string[] {
  try {
    const raw = sessionStorage.getItem("hm_xp_granted")
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function markReasonGranted(reason: string): void {
  try {
    const reasons = getGrantedReasons()
    reasons.push(reason)
    sessionStorage.setItem("hm_xp_granted", JSON.stringify(reasons))
  } catch {
    // silent degradation
  }
}

export function emitXP(delta: number, reason: string): void {
  const reasons = getGrantedReasons()
  if (reasons.includes(reason)) return

  markReasonGranted(reason)

  window.dispatchEvent(
    new CustomEvent("hm:xp", {
      detail: { delta, reason, timestamp: Date.now() },
    })
  )
}
```

**`useXP` hook skeleton:**
```ts
"use client"

import { useState, useEffect, useCallback } from "react"
import { emitXP } from "@/lib/xp/bus"

const STORAGE_KEY = "hm_xp_v1"

function readXp(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? Math.max(0, Math.min(100, Number(raw))) : 0
  } catch {
    return 0
  }
}

function writeXp(xp: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(xp))
  } catch {
    // silent degradation
  }
}

export function useXP() {
  const [xp, setXp] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setXp(readXp())
  }, [])

  useEffect(() => {
    if (!mounted) return

    function onXp(event: Event) {
      const custom = event as CustomEvent<{ delta: number }>
      setXp((prev) => {
        const next = Math.max(0, Math.min(100, prev + custom.detail.delta))
        writeXp(next)
        return next
      })
    }

    window.addEventListener("hm:xp", onXp)
    return () => window.removeEventListener("hm:xp", onXp)
  }, [mounted])

  return { xp: mounted ? xp : 0, emitXP }
}
```

**Note:** The `mounted` gate is critical. On first SSR/hydration render, `xp` is `0`. After mount (in `useEffect`), it reads from `localStorage`. This prevents hydration mismatch.

### Previous-Story Intelligence (Stories 2.1–2.4)

- **`components/devtools-chrome.tsx` exists** with identity strip, tab row, mobile bottom bar [Stories 2.1–2.3]
- **`app/(chrome)/layout.tsx` has `usePathname()` and `AnimatePresence`** [Story 2.1]
- **`hooks/use-should-animate.ts` exists** — returns `!useReducedMotion()` [Story 1.3]
- **`hooks/index.ts` re-exports hooks** — add `use-xp` to the barrel [Story 1.3]
- **`components/theme-provider.tsx` uses `useEffect` + mounted gate** — mirror this pattern for `useXP` [Story 2.4]
- **`lib/keyboard.ts` has `isTypingTarget()`** — pattern for guard functions [pre-Epic-2]
- **`yarn test:run` passes (10 tests, 3 files)** — add new tests, don't break existing [Story 2.4]
- **`yarn lint` passes clean** — maintain zero errors [Story 2.4]
- **`yarn build` succeeds (31 static pages)** — no build regressions [Story 2.4]
- **Import from `framer-motion`** — NOT `motion/react` [project-context.md]
- **Storage keys are versioned** — `hm_xp_v1`, `hm_xp_granted` [project-context.md]

### Architecture Compliance

**Client state without a library (ARCH-3):**
- `localStorage` for persistence (`hm_xp_v1`)
- `sessionStorage` for session idempotence (`hm_xp_granted`)
- `CustomEvent("hm:xp")` for cross-component bus
- No Redux/Zustand/Jotai — design is intentionally lightweight

**Accessibility (NFR-A1–A4):**
- XP bar: `role="progressbar"`, ARIA values
- XP toast: `role="status"`, `aria-live="polite"`
- Reduced motion: bar hidden, toast suppressed

**Performance (NFR-P2, NFR-P5, NFR-P6):**
- `transform: scaleX()` only for bar fill
- No width/left animation
- Lightweight CustomEvent (no library overhead)

**Gamification edge cases (from project-context.md):**
- XP capped `[0, 100]` — property-test with `fast-check`
- `localStorage` quota / disabled — wrap in try/catch; degrades to in-memory
- First visit: XP = 0, don't crash on `null`
- Reduced-motion hides XP toasts and bar fill — XP still increments silently

### Library / Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| React | 19.2.4 | `useState`, `useEffect`, `useCallback` |
| framer-motion | 12.40.0 | `motion.div`, `useSpring`, `AnimatePresence` for bar + toast animations |
| fast-check | 4.8.0 | Property tests for XP clamping and idempotence |

No new dependencies.

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.5] — story statement + ACs
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Architecture → Client-state] — localStorage + CustomEvent design
- [Source: _bmad-output/planning-artifacts/architecture.md#Communication Patterns] — XP events, storage I/O rules
- [Source: _bmad-output/planning-artifacts/architecture.md#Implementation Patterns → Naming] — storage keys, hook naming
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy → XPBar/XPToast] — component specs
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — XP grant pattern
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Cross-Journey Patterns] — localStorage mode bus, CustomEvent XP bus
- [Source: _bmad-output/project-context.md#Gamification edge cases] — XP cap, storage keys, graceful degradation
- [Source: _bmad-output/project-context.md#Anti-patterns] — no state-management libs, no motion/react import
- [Source: _bmad-output/implementation-artifacts/2-4-theme-provider-and-d-hotkey-dark-only.md] — previous story completion notes
- [Source: components/devtools-chrome.tsx] — current chrome implementation
- [Source: app/(chrome)/layout.tsx] — current layout with route transitions
- [Source: hooks/index.ts] — hook barrel export
- [Source: hooks/use-should-animate.ts] — reduced-motion helper

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Code dev-story workflow)

### Debug Log References

- `yarn lint` initially failed: `react-hooks/set-state-in-effect` on `useXP`'s synchronous mount-read. Resolved by deferring the mount read inside `requestAnimationFrame`, mirroring the existing pattern in `app/(chrome)/layout.tsx`. Tests updated with an async `flushMount()` helper that awaits one animation frame.

### Completion Notes List

- **XP system architecture (ARCH-3):** `lib/xp/bus.ts` is the stateless write surface (`emitXP`); `hooks/use-xp.ts` is the read surface. Cross-component bus is a `window` `CustomEvent("hm:xp")`. No state library — intentionally lightweight.
- **Clamping lives in the reducer, not the bus.** The bus is stateless and cannot know current XP, so `applyDelta`/`clampXp` (exported from the bus) enforce `[0,100]` in the hook. AC1's "clamps delta so the resulting XP stays within [0,100]" is satisfied by the system as a whole and covered by the property tests.
- **Pure `reduceGrants` model** added to the bus purely so `fast-check` can assert both the clamp invariant and per-reason idempotence over arbitrary input (AC7).
- **Session idempotence applies to ALL reasons**, not just `visit:*` — follows the Dev Notes future-proofing guidance so later epics (4.5/5.2/5.4/6.4) get one-shot semantics for free.
- **AC4 interpretation (flagged for reviewer):** under reduced motion the XP bar is hidden **entirely** (`useShouldAnimate()` → return null), per AC4's "bar hidden" wording (repeated in project-context.md gamification edge cases). Task 4's parenthetical also mentioned "fill instant" — I went with AC4's authoritative "bar hidden". XP still increments silently via the hook regardless of motion preference.
- **Toast lifecycle** is owned by the chrome (`DevToolsChrome`): it subscribes to `hm:xp`, stores the latest grant keyed by `timestamp`, renders `<XPToast>` inside `AnimatePresence`, and clears after 1200ms. `<XPToast>` itself is presentational (props `delta`/`reason`) per Task 5, humanizing `visit:network` → `visited Network`.
- **SSR safety:** `useXP` initializes to `0`, reads `localStorage` only after mount (in a deferred rAF), mirroring the `next-themes` mounted-gate pattern — no hydration mismatch. `emitXP` guards `typeof window === "undefined"`.
- **Graceful degradation (AC6):** all `localStorage`/`sessionStorage` access is try/catch wrapped; private mode / quota errors fall back to in-memory state without crashing (covered by tests that throw from `Storage.prototype`).
- **Gates:** `yarn typecheck` clean · `yarn lint` 0/0 · `yarn test:run` 28 passed (5 files; +10 new) · `yarn build` 31 static pages · `yarn prettier --write` applied to new/changed files.
- **Not done (out of scope, by design):** browser spot-check list (items 1–8) requires a live `yarn dev` browser session — not executed in this headless run. Recommend a manual pass before merge, especially the reduced-motion toggle and hard-refresh persistence.

### File List

**New:**
- `lib/xp/bus.ts`
- `lib/xp/bus.test.ts`
- `hooks/use-xp.ts`
- `hooks/use-xp.test.ts`
- `components/xp-bar.tsx`
- `components/xp-toast.tsx`

**Modified:**
- `components/devtools-chrome.tsx`
- `app/(chrome)/layout.tsx`
- `hooks/index.ts`

### Change Log

| Date | Change |
| --- | --- |
| 2026-05-31 | Implemented Story 2.5: XP event bus (`lib/xp/bus.ts`), `useXP` hook, `<XPBar>` + `<XPToast>` components, chrome wiring, and tab-visit grants in the `(chrome)` layout. Added unit + `fast-check` property tests. All gates green (typecheck/lint/test/build). Status → review. |

## References
