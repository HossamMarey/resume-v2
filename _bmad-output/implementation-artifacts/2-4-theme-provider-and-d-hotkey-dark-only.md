# Story 2.4: Theme provider and D hotkey (dark-only)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want a stable dark theme with a playful dark-only hotkey response,
So that the site never flashes the wrong theme and power users get a voiced refusal.

## Context & Orientation (read first)

This is **Story 2.4 of Epic 2 (Chrome & Navigation)**, building on **Stories 2.1, 2.2, and 2.3** which delivered:
- `app/(chrome)/layout.tsx` with persistent chrome, `AnimatePresence` transitions, skip-to-content link
- `components/devtools-chrome.tsx` — identity strip, tab row, mobile bottom tab bar
- `components/theme-provider.tsx` — already exists with `ThemeProvider` + `ThemeHotkey`, currently toggles theme on `D` key
- `lib/keyboard.ts` — `isTypingTarget()` helper already exists and is used by `ThemeHotkey`
- All 7 stub routes navigable with zero console errors

**This story hardens the theme provider for dark-only and retools the `D` hotkey into a no-op toast.**

**Scope fence — what this story does NOT do:**
- It does NOT build the XP bus or bar (Story 2.5)
- It does NOT wire Recruiter Mode (Epic 6)
- It does NOT add new pages or content (Epics 3–7)
- It does NOT add any new dependencies

## Acceptance Criteria

**AC1 — next-themes configured for dark-only with no system preference (FR-110).**
**Given** `next-themes` mounts at root
**When** the `ThemeProvider` renders
**Then** it uses `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, `disableTransitionOnChange`, and `<html>` keeps `suppressHydrationWarning` (no hydration theme flash).

**AC2 — `D` key shows dark-only toast instead of toggling (FR-111 + FR-112).**
**Given** I press `D` while not focused in a typing target
**When** the `ThemeHotkey` handler fires
**Then** a sonner toast reads "Site is dark-only. The vibe is intentional." and the theme does not change; pressing `D` inside an `<input>`/`<textarea>`/`[contenteditable]` does nothing (uses `isTypingTarget`).

**AC3 — Toast follows project feedback patterns (UX-DR5 + NFR-A3).**
**Given** the toast fires on `D` key
**When** it renders
**Then** it uses the existing sonner `<Toaster>` infrastructure (already in root layout), respects the dark theme styling (no flash), and is dismissible or auto-dismisses after a reasonable duration.

**AC4 — Static-first with zero console errors (NFR-P2 + NFR-A4).**
**Given** the theme provider changes
**When** any chrome'd tab is hard-refreshed
**Then** the page paints immediately without JS, hydration adds interactivity with zero console errors or warnings, and no theme flash occurs on load.

**AC5 — Build and checks remain green.**
**Given** all changes
**When** `yarn typecheck && yarn lint && yarn test:run && yarn build` run
**Then** all pass with no new errors/warnings.

## Tasks / Subtasks

- [x] **Task 1 — Read current state (AC1, AC2)**
  - [x] Read `components/theme-provider.tsx` to understand current ThemeProvider + ThemeHotkey
  - [x] Read `app/layout.tsx` to confirm Toaster placement and suppressHydrationWarning
  - [x] Read `lib/keyboard.ts` to confirm `isTypingTarget()` signature
  - [x] Verify `next-themes` version and available props

- [x] **Task 2 — Harden ThemeProvider for dark-only (AC1)**
  - [x] Add `enableSystem={false}` to `<NextThemesProvider>` invocation
  - [x] Verify `defaultTheme="dark"` is already set (should be)
  - [x] Verify `attribute="class"` is already set (should be)
  - [x] Verify `disableTransitionOnChange` is already set (should be)

- [x] **Task 3 — Retool ThemeHotkey for dark-only toast (AC2, AC3)**
  - [x] Replace `setTheme(resolvedTheme === "dark" ? "light" : "dark")` with `toast("Site is dark-only. The vibe is intentional.")`
  - [x] Import `toast` from `sonner`
  - [x] Keep the `isTypingTarget` skip guard intact
  - [x] Keep the modifier-key guard (`metaKey`/`ctrlKey`/`altKey`) intact
  - [x] Keep the `defaultPrevented` / `repeat` guard intact

- [x] **Task 4 — Run gates (AC5)**
  - [x] `yarn typecheck` → clean (4.02s)
  - [x] `yarn lint` → clean (0 errors, 0 warnings, 6.34s)
  - [x] `yarn test:run` → 10 passed, 3 files (2.94s)
  - [x] `yarn build` → succeeds, 31 static pages (16.55s)

## Dev Notes

### Architecture context

**Dark-only decision context:** The project is intentionally dark-only per Resolved Decision 1 (2026-05-25). The `next-themes` provider stays for infrastructure (Recruiter Mode print stylesheet is v1.1), but the site does not offer a light mode. The `D` hotkey is kept as playful infrastructure — it acknowledges power-user expectations ("I pressed D, something should happen") without actually changing the theme.

**Why not remove the `D` hotkey entirely?** Per PRD FR-111, the hotkey infrastructure is kept for future flexibility. Removing it would mean re-adding it later. The no-op toast is the minimal viable behavior that satisfies the "power user pressed D" expectation.

**Sonner integration:** `<Toaster>` is already mounted in `app/layout.tsx` inside `<TooltipProvider>`. The `ThemeHotkey` component is a child of `<NextThemesProvider>`, so it can import and call `toast()` from `sonner` without additional providers. The toast will render in the existing toast container.

### What is being changed

1. **`components/theme-provider.tsx`** — Two surgical changes:
   - Add `enableSystem={false}` prop to `NextThemesProvider`
   - Replace theme-toggle logic in `ThemeHotkey` with a `toast()` call

### Files being modified — READ BEFORE EDITING

**`components/theme-provider.tsx` (UPDATE)**
- Current state: `ThemeProvider` wraps `NextThemesProvider` with `attribute="class"`, `defaultTheme="dark"`, `disableTransitionOnChange`. `ThemeHotkey` listens for `D` key and toggles theme via `setTheme(resolvedTheme === "dark" ? "light" : "dark")`.
- What changes:
  - Add `enableSystem={false}` to `NextThemesProvider` props
  - In `ThemeHotkey`, replace `setTheme(...)` with `toast("Site is dark-only. The vibe is intentional.")`
  - Add `import { toast } from "sonner"`
- What must be preserved:
  - `isTypingTarget(event.target)` guard (skip hotkey when typing)
  - Modifier key guards (`metaKey`, `ctrlKey`, `altKey`)
  - `defaultPrevented` and `repeat` guards
  - `useEffect` cleanup (removeEventListener on unmount)
  - Component export as named export (`export { ThemeProvider }`)

**`app/layout.tsx` (NO CHANGES — read-only)**
- Current state: `<html suppressHydrationWarning>` with `ThemeProvider` wrapping children + `<Toaster />`
- What must be preserved:
  - `suppressHydrationWarning` on `<html>`
  - `<Toaster />` inside `<TooltipProvider>`
  - `<ThemeProvider>` at root level

### Files being created

None — this story modifies one existing file only.

### Project guardrails that bite in this story

- **`@/*` maps to project root** — imports use `@/lib/keyboard`
- **`framer-motion` import** — NOT `motion/react`. The `motion` package is not installed. Use `import { motion, AnimatePresence } from "framer-motion"` (relevant for layout files, not this story)
- **Named exports only** for components (except `page.tsx`/`layout.tsx` which MUST default-export)
- **No `import React`** — JSX runtime is `react-jsx`
- **Import ordering** (blank lines between groups, alpha within):
  1. External (`react`, `next/*`, `sonner`)
  2. Internal aliases (`@/lib/*`, `@/components/*`)
  3. Relative (`./`, `../`)
  4. Side-effect/style last
- **Token-only styling** — no hardcoded colors in JSX (not applicable here — no UI changes)
- **Conventional Commits** — `feat:` for behavioral change, `chore:` for configuration

### Testing standards for this story

- **No new unit tests required** — this is a small behavioral change to an existing component.
- **Existing test harness** should continue to pass (no regressions).
- **Verification = gate checks + manual spot-check**
- **Manual spot-check list:**
  1. Load any page — confirm no theme flash on load
  2. Press `D` key — confirm sonner toast appears with "Site is dark-only. The vibe is intentional."
  3. Focus an `<input>` and press `D` — confirm no toast fires
  4. Press `⌘D` or `Ctrl+D` — confirm no toast fires (modifier guard)
  5. Confirm theme does not toggle (page stays dark)
  6. Console has zero errors/warnings
  7. `yarn typecheck && yarn lint && yarn test:run && yarn build` all pass

### Technical Requirements

**Current ThemeHotkey logic (to be replaced):**
```tsx
function ThemeHotkey() {
  const { resolvedTheme, setTheme } = useTheme()

  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return

      setTheme(resolvedTheme === "dark" ? "light" : "dark")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [resolvedTheme, setTheme])

  return null
}
```

**New ThemeHotkey logic:**
```tsx
import { toast } from "sonner"

function ThemeHotkey() {
  React.useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.repeat) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      if (event.key.toLowerCase() !== "d") return
      if (isTypingTarget(event.target)) return

      toast("Site is dark-only. The vibe is intentional.")
    }

    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return null
}
```

Note: The `useTheme()` hook is no longer needed inside `ThemeHotkey` since we don't read or set the theme. The dependency array becomes empty `[]`. Remove the `useTheme` import if it's no longer used elsewhere in the file.

**ThemeProvider props change:**
```tsx
<NextThemesProvider
  attribute="class"
  defaultTheme="dark"
  enableSystem={false}  // ← ADD THIS
  disableTransitionOnChange
  {...props}
>
```

### Previous-Story Intelligence (Stories 2.1, 2.2, 2.3)

- **`components/theme-provider.tsx` exists** — created before Story 2.1, not modified in Epic 2 yet [pre-Epic-2]
- **`lib/keyboard.ts` with `isTypingTarget()` exists** — used by `ThemeHotkey` [pre-Epic-2]
- **`app/layout.tsx` has `<Toaster />`** — mounted inside `<TooltipProvider>` [Story 2.1]
- **`suppressHydrationWarning` on `<html>`** — required for `next-themes` [pre-Epic-2]
- **`yarn test:run` passes** — do not break the harness [Story 2.3]
- **`yarn lint` passes clean** — maintain zero errors [Story 2.3]
- **`yarn build` succeeds** — 31 static pages generated [Story 2.3]
- **Import from `framer-motion`** — NOT `motion/react` [project-context.md, Story 1.3]
- **Named exports only** for components [project-context.md]

### Architecture Compliance

**Routing topology (ARCH-2):**
- No changes to route group structure

**Client state without a library (ARCH-3):**
- No storage I/O in this story; purely a UI feedback change

**Accessibility (NFR-A1–A4):**
- Hotkey skips typing targets (preserved)
- No a11y regressions

**Performance (NFR-P2, NFR-P5, NFR-P6):**
- No new dependencies
- No animation changes
- Toast is lightweight

**Theme & hotkeys (FR-110–112):**
- `enableSystem={false}` enforces dark-only
- `D` key shows toast, doesn't toggle

### Library / Framework Requirements

| Library | Version | Usage |
|---------|---------|-------|
| next-themes | 0.4.6 | `ThemeProvider` with `enableSystem={false}` |
| sonner | 2.0.7 | `toast()` call in `ThemeHotkey` |
| react | 19.2.4 | `useEffect` hook |

No new dependencies.

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

- `yarn typecheck` → pass (clean, 4.02s)
- `yarn lint` → pass (0 errors, 0 warnings, 6.34s)
- `yarn test:run` → 10 passed (3 files, 2.94s)
- `yarn build` → Compiled successfully, 31 static pages generated (16.55s)

### Completion Notes List

- **`components/theme-provider.tsx`** — Two surgical changes:
  - Added `enableSystem={false}` to `NextThemesProvider` props to enforce dark-only (no system preference)
  - Replaced `useTheme()` hook and `setTheme()` call in `ThemeHotkey` with `toast("Site is dark-only. The vibe is intentional.")` from `sonner`
  - Removed unused `useTheme` import from `next-themes`
  - Added `import { toast } from "sonner"` with correct import ordering (external group)
  - Kept all guards intact: `defaultPrevented`, `repeat`, modifier keys (`metaKey`/`ctrlKey`/`altKey`), `isTypingTarget()` typing-target skip
  - `useEffect` dependency array changed from `[resolvedTheme, setTheme]` to `[]` since no external dependencies are needed
  - Component continues to export as named export (`export { ThemeProvider }`)

### File List

- `components/theme-provider.tsx` (modified) — added `enableSystem={false}`, replaced theme toggle with `toast("Site is dark-only. The vibe is intentional.")`

### Change Log

- 2026-05-30 — Implemented Story 2.4: hardened `next-themes` for dark-only (`enableSystem={false}`), retool `D` hotkey to show sonner toast "Site is dark-only. The vibe is intentional." instead of toggling theme. All gates pass (typecheck, lint, test:run, build). Status → review.

## Review Findings

_Code review 2026-05-31 — 3 layers (Blind Hunter, Edge Case Hunter, Acceptance Auditor). Acceptance Auditor: AC1–AC4 satisfied by inspection, AC5 self-reported (gates not re-run in audit). Blind Hunter: clean._

- [x] [Review][Patch] `D`-key toast stacks on rapid re-press — fixed: added stable `id: "theme-dark-only"` so repeated presses refresh one toast [components/theme-provider.tsx:46]
- [x] [Review][Defer] Toaster `theme="system"` fallback vs `enableSystem={false}` — already tracked as deferred-work.md item #2 (`components/ui/sonner.tsx:8`); real impact is low since `--normal-bg: var(--popover)` forces dark tokens regardless

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 2.4] — story statement + ACs
- [Source: _bmad-output/planning-artifacts/architecture.md#Locked Technology Stack] — next-themes 0.4.6
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture → Theme] — dark-only config
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Feedback Patterns] — "Theme toggle (dark-only): sonner toast"
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md#Component Strategy → DevToolsChrome] — theme infrastructure
- [Source: _bmad-output/project-context.md#Framework-Specific Rules → next-themes] — `suppressHydrationWarning`, `defaultTheme="dark"`
- [Source: _bmad-output/project-context.md#Resolved Decisions] — dark-only decision (Resolved Decision 1)
- [Source: _bmad-output/implementation-artifacts/2-3-mobile-bottom-tab-bar.md] — previous story completion notes
- [Source: components/theme-provider.tsx] — current implementation
- [Source: app/layout.tsx] — Toaster placement and suppressHydrationWarning
- [Source: lib/keyboard.ts] — isTypingTarget helper
