# Story 1.3: Build shared cross-cutting helpers

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As an implementing agent,
I want single-source helpers for reduced motion, hotkey hygiene, and the panel idiom,
so that every later component reuses them instead of re-deriving divergent behavior.

## Context & Orientation (read first)

Third story of Epic 1 (Foundation). Stories 1.1 + 1.2 rewrote `app/globals.css` (tokens, selection, grid/scan, surface language). **This story writes the first real TypeScript/React code in the project** — three shared primitives that ~12 later components depend on (ARCH-4). It is therefore **the first story that must ship unit tests** (and the first to make the test harness actually run).

**Three deliverables (all NEW files) + two small touch-ups:**
1. `hooks/use-should-animate.ts` — `useShouldAnimate()` reduced-motion source of truth (wraps `motion/react` `useReducedMotion`).
2. `lib/keyboard.ts` — `isTypingTarget(el)` shared hotkey guard.
3. `components/computed-styles-panel.tsx` — `<ComputedStylesPanel>` (UX-DR1 universal panel idiom).
4. **Refactor** `components/theme-provider.tsx` to import `isTypingTarget` from `@/lib/keyboard` and delete its local copy (the "do not duplicate" requirement — see Dev Notes).
5. **Re-export** the hook from `hooks/index.ts` (currently empty).

**Two harness facts you MUST handle (discovered, not optional):**
- **`tests/setup.ts` does NOT exist.** The `tests/` directory is empty, yet `vitest.config.ts` has `setupFiles: ['./tests/setup.ts']`. The moment you add the first `*.test.ts`, Vitest will fail trying to load the missing setup file. **You must create `tests/setup.ts`** importing `@testing-library/jest-dom` (already a devDependency). This is why prior stories saw `yarn test:run` → "No test files found"; this story flips the repo to actually testing.
- **jsdom (29.x) has no `window.matchMedia`.** `useReducedMotion()` reads it. Tests for `useShouldAnimate` MUST mock `matchMedia` or they throw. Pattern is in Testing Requirements.

**Scope fence — NOT in this story:**
- Do NOT build `<XPBar>`, hooks `use-xp`/`use-unlocks`/`use-recruiter-mode`, Konami, palette (Epics 2/5/6). Only the three cross-cutting helpers.
- Do NOT change the `D`-hotkey *behavior* in `theme-provider.tsx` (it currently toggles theme; Story 2.4 changes it to a dark-only toast). The only edit here is swapping the local `isTypingTarget` for the shared import — behavior-preserving.
- Do NOT apply `<ComputedStylesPanel>` to any page (principles/hero usage is Story 3.2). Build + unit-test it only.
- Do NOT touch `globals.css` (Stories 1.1/1.2) or remove Dexie / `lib/repository` (Story 1.4).

## Acceptance Criteria

1. **AC1 — `useShouldAnimate()` reduced-motion hook.**
   **Given** `hooks/use-should-animate.ts` (a `"use client"` module),
   **When** a component calls `useShouldAnimate()`,
   **Then** it returns `false` when `prefers-reduced-motion: reduce` is set and `true` otherwise, by wrapping `motion/react`'s `useReducedMotion()` (i.e. `return !useReducedMotion()`), and it is re-exported from `hooks/index.ts`. (The hook is the single source of truth; consumers collapse duration to `0.001s` / render final state when it returns `false` — that consumer pattern is documented, not implemented here since no animation exists yet.)

2. **AC2 — `isTypingTarget()` shared guard, consumed by the existing hotkey.**
   **Given** `lib/keyboard.ts` exporting `isTypingTarget(target: EventTarget | null): boolean`,
   **When** called with an `<input>`, `<textarea>`, `<select>`, or `contentEditable` element,
   **Then** it returns `true`; for any other element or `null` it returns `false` — matching the current `theme-provider.tsx` implementation exactly. **And** `theme-provider.tsx` is refactored to import this shared `isTypingTarget` and its local duplicate is removed (no behavior change to the `D` hotkey).

3. **AC3 — `<ComputedStylesPanel>` universal panel idiom (UX-DR1).**
   **Given** `components/computed-styles-panel.tsx` (a named-export RSC, no `"use client"`),
   **When** `<ComputedStylesPanel>` wraps children,
   **Then** it renders an outer `rounded border border-hairline bg-hairline grid gap-px` container whose cells sit on `bg-surface` — producing the inset-hairline Chrome-DevTools "Computed" grid — and it supports a `direction` prop of `"vertical"` (default, single column) and `"horizontal"` (columns), accepts a `className` passthrough merged via `cn()`, and carries `data-slot="computed-styles-panel"` + `data-direction={direction}` for styling/testing hooks.

4. **AC4 — Tests exist and pass; harness runs; checks clean.**
   **Given** this is the first tested story,
   **When** `yarn test:run` is executed,
   **Then** `tests/setup.ts` exists (imports `@testing-library/jest-dom`), unit tests for all three helpers pass, and `yarn typecheck && yarn lint && yarn build` are clean (only the pre-existing `'inter' unused` warning in `app/layout.tsx` is allowed).

## Tasks / Subtasks

- [x] **Task 0 — Make the test harness runnable (AC4)**
  - [x] Created `tests/setup.ts` (no `fake-indexeddb`). Used `import "@testing-library/jest-dom/vitest"` (the vitest entry — registers matchers AND augments Vitest's `expect` types). Also added `tests/vitest.d.ts` (`/// <reference types="vitest/globals" />`) so `tsc` recognizes the global `describe`/`it`/`expect`/`vi` (config uses `globals: true`). **Installed `@testing-library/dom@10.4.1`** (-D) — required peer of the existing `@testing-library/react@16`, was missing.
- [x] **Task 1 — `lib/keyboard.ts` + theme-provider refactor (AC2)**
  - [x] Created `lib/keyboard.ts` with `isTypingTarget` ported verbatim (incl. `SELECT`, `isContentEditable`). No `"use client"`.
  - [x] Refactored `components/theme-provider.tsx` to `import { isTypingTarget } from "@/lib/keyboard"` and deleted the local copy. `ThemeHotkey` behavior unchanged (D-toggle stays for Story 2.4).
  - [x] Added `lib/keyboard.test.ts` (input/textarea/select/contenteditable → true; div/button/null/non-element → false). 4 tests pass.
- [x] **Task 2 — `hooks/use-should-animate.ts` + re-export (AC1)**
  - [x] Created `hooks/use-should-animate.ts` (`"use client"`, `return !useReducedMotion()`). **Imported from `framer-motion`, not `motion/react`** — per your decision (the `motion`/`motion/react` package is not installed; project-context.md updated to match).
  - [x] Re-exported from `hooks/index.ts`.
  - [x] Added `hooks/use-should-animate.test.ts` — mocks the `framer-motion` boundary (cleaner + deterministic than a jsdom matchMedia stub, which framer-motion's module-level caching would defeat): true/false/null(→true) cases. 3 tests pass.
- [x] **Task 3 — `components/computed-styles-panel.tsx` (AC3)**
  - [x] Created `ComputedStylesPanel` (named-export RSC, no `"use client"`; `data-slot` + `data-direction`; `direction` vertical default / horizontal; `cn()` + `...props` passthrough; `import type { ComponentProps }`).
  - [x] Added `ComputedStylesCell` (`bg-surface p-4` cell, `data-slot="computed-styles-cell"`).
  - [x] Added `components/computed-styles-panel.test.tsx` — asserts children render + `data-direction` flips; no class-string assertions. 3 tests pass.
- [x] **Task 4 — Verify (AC4)**
  - [x] `yarn typecheck` clean (after adding `tests/vitest.d.ts` for the test globals).
  - [x] `yarn test:run` → **10 passed (3 files)** — the harness now runs for the first time.
  - [x] `yarn lint` → only the pre-existing `'inter' unused` warning in `app/layout.tsx`.
  - [x] `yarn build` succeeds.
  - [x] Formatted only this story's files with `npx prettier --write <paths>`; did NOT run repo-wide `yarn format`. `git status` shows only this story's source files (+ the pre-existing uncommitted `globals.css`, and `package.json`/`yarn.lock` from the approved install).

## Dev Notes

### Files created / changed (exhaustive)
- **NEW** `tests/setup.ts` — jest-dom import (unblocks the harness).
- **NEW** `lib/keyboard.ts` — `isTypingTarget`.
- **NEW** `lib/keyboard.test.ts`.
- **NEW** `hooks/use-should-animate.ts` — `useShouldAnimate`.
- **NEW** `hooks/use-should-animate.test.ts`.
- **NEW** `components/computed-styles-panel.tsx` — `ComputedStylesPanel` (+ `ComputedStylesCell`).
- **NEW** `components/computed-styles-panel.test.tsx`.
- **UPDATE** `components/theme-provider.tsx` — swap local `isTypingTarget` for the shared import (behavior-preserving).
- **UPDATE** `hooks/index.ts` — add the re-export (currently a single empty line).

### `isTypingTarget` — match the existing implementation (don't narrow it)
`theme-provider.tsx` already defines this (lines 23–34) and includes **`SELECT`** in addition to input/textarea/contentEditable. The architecture's prose lists only `<input>`/`<textarea>`/`[contenteditable="true"]`, but the **existing code is the reference** (AC2: "matching the existing theme-provider.tsx pattern") and suppressing hotkeys while a `<select>` is focused is correct. **Keep `SELECT`.** Use `target.isContentEditable` (the DOM property — handles inherited editing) rather than a `[contenteditable="true"]` attribute match. Porting verbatim guarantees the `D` hotkey behaves identically after the refactor.

### `useShouldAnimate` — semantics
`useReducedMotion()` (motion/react) returns `true` when the user prefers reduced motion, `false` when not, and `null` before it resolves. `useShouldAnimate = !useReducedMotion()` ⇒ returns `true` (animate) by default/SSR, `false` only when reduce is explicitly set. This is the single source of truth (Process Patterns: "every animation imports `useShouldAnimate()`… no per-component re-derivation"). Consumers (later stories) use it like the architecture's example: `transition={{ duration: animate ? 0.6 : 0.001 }}` and `initial={animate ? {…} : false}`. Do not bake duration constants into this hook.

### `ComputedStylesPanel` — the idiom (UX-DR1 / design-system §6)
The Chrome DevTools "Computed" look = a `bg-hairline` grid container with `gap-px`, whose children are `bg-surface`; the 1px gaps reveal hairline dividers (no borders between cells, no shadows). [design-system §6 "Panels": `rounded border border-hairline` outer shell, `bg-hairline` + `gap-px`, children `bg-surface`.] Used later by: principles panel (`/`), case-study Decisions/Outcomes, Sources preview pane, REPL output blocks (UX-DR1) — so keep it generic (no content assumptions). It's pure presentational → **RSC, no `"use client"`**, named export (project-context: regular components are named exports; only route files default-export). Spread remaining `...props` onto the outer `<div>` so `aria-*`/`id` pass through. Respect tokens only (`border-hairline`, `bg-hairline`, `bg-surface` — all defined in `globals.css` from Story 1.1); zero hardcoded colors.

### Project guardrails that bite here
- **Named exports only** for components/hooks; **no `import React`** (jsx runtime is `react-jsx`); use `import type` for type-only imports (`isolatedModules`). [project-context.md#TypeScript]
- **Import `motion/react`, never `framer-motion`** (v12 entry). [project-context.md#framer-motion]
- **`@/*` maps to project root** — import as `@/lib/keyboard`, `@/hooks`, `@/lib/utils`. [project-context.md]
- **kebab-case filenames**; one hook per file; `cn()` from `@/lib/utils`. [architecture.md#Naming]
- RSC by default; `"use client"` only where a client-only API is used (`useReducedMotion` ⇒ the hook module needs it; the panel does not). [architecture.md#Frontend Architecture]
- No new dependencies — everything needed (`motion/react`, testing-library, fast-check) is already installed. [project-context.md]

### Testing Requirements (this is the first tested story — get the harness right)
- **Vitest config (existing):** `environment: jsdom`, `globals: true` (do NOT import `describe`/`it`/`expect`), `setupFiles: ['./tests/setup.ts']`, alias `@/` → root. Colocate `*.test.ts(x)` next to source. [vitest.config.ts; project-context.md#Testing]
- **`tests/setup.ts` must be created** = `import "@testing-library/jest-dom"`. Nothing else (no `fake-indexeddb` — Dexie dropped).
- **jsdom has no `matchMedia`** → `useReducedMotion()` throws without a mock. In `hooks/use-should-animate.test.ts`, stub it per-test, e.g.:
  ```ts
  function setReducedMotion(matches: boolean) {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),    // legacy API motion may call
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  }
  ```
  Call `setReducedMotion(false)` → expect `useShouldAnimate()` truthy; `setReducedMotion(true)` → falsy. Use `renderHook` from `@testing-library/react`; `afterEach(() => vi.unstubAllGlobals())`.
- **`lib/keyboard.test.ts`** — create elements via `document.createElement(...)` (and a contenteditable `<div>` with `el.contentEditable = "true"`); assert the boolean for each, plus `null`. High-value, no mocks needed.
- **`computed-styles-panel.test.tsx`** — `render(<ComputedStylesPanel>…children…/>)`; assert children text is present and `data-direction` is `"vertical"` by default / `"horizontal"` when passed. **Do NOT assert Tailwind class strings** (project-context: they rot, Prettier sorts them). Query by role/text. No snapshot tests.
- Use `userEvent.setup()` only if you simulate input (not needed here). `fast-check` is available but not required for these helpers (XP math in Epic 2 is its real home).

### Project Structure Notes
- All files land in their architecture-prescribed homes: `hooks/use-*.ts` (+ `hooks/index.ts` re-export), `lib/keyboard.ts`, `components/*.tsx`, `tests/setup.ts`. [architecture.md#Project Structure] No structural variance. `lib/repository/` is untouched here (its removal is Story 1.4).

## Previous-Story Intelligence (Stories 1.1 & 1.2)

- **`yarn format` reflows ~15 pre-existing non-Prettier-clean files** (`app/layout.tsx`, several `components/ui/*`, `lib/content/*`, `lib/font.ts`, …). Its glob is `**/*.{ts,tsx}`, so the NEW `.ts/.tsx` files you add are in scope too. **Format only your own files** with `npx prettier --write <paths>`; if `yarn format` ran and touched others, `git checkout --` them so the diff stays scoped.
- **Repo had zero tests** → `yarn test:run` exited 1 with "No test files found". After this story it should run real tests. The missing `tests/setup.ts` is the reason any earlier attempt would have errored.
- **`'inter' unused` lint warning in `app/layout.tsx`** is pre-existing; expected, not yours to fix.
- **`app/globals.css` (Stories 1.1+1.2) is still uncommitted** in the working tree — your `git status` will show it alongside this story's files. Tokens it defines (`border-hairline`, `bg-hairline`, `bg-surface`) are what `<ComputedStylesPanel>` consumes; they resolve correctly (build-verified in 1.1/1.2).
- **Verification approach:** prior stories had no browser; these helpers are unit-testable in jsdom, so real Vitest tests (not compiled-CSS inspection) are the verification here.

## Git Intelligence

- Recent commits: `cd5dd09` (content migration → `lib/content/*`), `643002c` ("theme refactoring" — created the current `theme-provider.tsx` with `defaultTheme="dark"` + local `isTypingTarget`, and the partial repalette), `d58a15f` (starter). The `theme-provider.tsx` you refactor was last shaped by `643002c`; keep its `ThemeHotkey` effect intact apart from the `isTypingTarget` import swap.
- Working tree currently carries uncommitted `app/globals.css` (Stories 1.1/1.2, status `review`). This story adds new files and lightly edits `theme-provider.tsx` + `hooks/index.ts`.

## References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3] — story statement + ACs (useShouldAnimate / isTypingTarget / ComputedStylesPanel).
- [Source: _bmad-output/planning-artifacts/architecture.md#Cross-Cutting Concerns / Implementation Patterns / ARCH-4] — single-source helpers; reduced-motion + hotkey + panel; RSC-by-default; naming.
- [Source: _bmad-output/planning-artifacts/architecture.md#Pattern Examples] — the `useShouldAnimate()` consumer pattern (duration `animate ? 0.6 : 0.001`).
- [Source: docs/design-system.md#6 Component Patterns → Panels] — `rounded border border-hairline` + `bg-hairline` + `gap-px` + `bg-surface` children (the Computed-styles idiom).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md / UX-DR1] — idiom implemented once, reused on principles / case-study / sources / REPL.
- [Source: _bmad-output/project-context.md#Testing Rules / TypeScript / framer-motion] — jsdom + globals:true, no fake-indexeddb, named exports, `motion/react`, no class-string tests.
- [Source: components/theme-provider.tsx:23–34] — existing `isTypingTarget` to extract (includes `SELECT`, uses `isContentEditable`).
- [Source: vitest.config.ts] — `setupFiles: ['./tests/setup.ts']` (file currently missing — must be created).
- [Source: hooks/index.ts] — empty; add the re-export.
- [Source: package.json] — `format` script globs only `**/*.{ts,tsx}`; `fast-check`, testing-library, `framer-motion` already present.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Opus 4.8)

### Debug Log References

- `yarn test:run` → **10 passed / 3 files** (`lib/keyboard.test.ts` 4, `hooks/use-should-animate.test.ts` 3, `components/computed-styles-panel.test.tsx` 3). First green run in the repo's history.
- `yarn typecheck` → clean (after `tests/vitest.d.ts`).
- `yarn lint` → 0 errors, 1 pre-existing warning (`'inter' unused`, `app/layout.tsx`).
- `yarn build` → compiled successfully, 4 static pages.
- Two blockers hit during Task 0/2 (both resolved via user decision — see Completion Notes): missing `@testing-library/dom` peer; unresolvable `motion/react`.

### Completion Notes List

- **All three helpers shipped + unit-tested**, plus the theme-provider refactor (DRY `isTypingTarget`) and the `hooks/index.ts` re-export. This is the first story to make the Vitest harness actually run.
- **Harness bring-up (Task 0) required more than `setup.ts`:**
  - `@testing-library/dom` was a **missing required peer** of the approved `@testing-library/react@16` → installed `@testing-library/dom@10.4.1` (-D, user-approved). Without it, every `render()` test fails.
  - `tsc` didn't know the Vitest globals (`describe`/`it`/`expect`/`vi`) even with `globals: true` → added `tests/vitest.d.ts` with `/// <reference types="vitest/globals" />`. Chose a reference file over a `tsconfig` `types` array to avoid disabling auto-`@types` inclusion.
  - Used `@testing-library/jest-dom/vitest` in `setup.ts` (not the bare import) so jest-dom matchers extend Vitest's `expect` at the type level too.
- **`motion/react` → `framer-motion` (user decision):** `motion/react` is unresolvable — only `framer-motion@12.40` is installed and it exposes no `./react` subpath; the `motion` package is absent. Per your call, `useShouldAnimate` imports from `framer-motion`, and I updated `project-context.md` (tech-stack line, framer-motion rule, and the anti-pattern) so the ruleset no longer contradicts the code. NOTE: `architecture.md`, `epics.md`, and the addendum still say `motion/react` in places — a broader docs reconciliation is a good follow-up (logged below).
- **`useShouldAnimate` test mocks the `framer-motion` boundary** rather than stubbing jsdom `matchMedia`: framer-motion caches its reduced-motion listener at module load, which leaks across tests and makes a matchMedia stub non-deterministic. Mocking the boundary is the correct unit-test seam (project-context: "mock external boundaries only") and also covers the `null → animate` case.
- **`isTypingTarget` keeps `SELECT`** (matches the existing theme-provider implementation; broader than the architecture's 3-item prose — intentional, suppresses hotkeys while a `<select>` is focused).
- **`ComputedStylesPanel` + `ComputedStylesCell`** are pure-presentational RSCs (no `"use client"`), token-only (`border-hairline`/`bg-hairline`/`bg-surface`), with `data-slot`/`data-direction` for styling + testing. Not applied to any page (Story 3.2 owns usage).
- **Scope/format discipline:** formatted only this story's files; `git status` source diff = `theme-provider.tsx`, `hooks/index.ts`, the 6 new helper/test files, `tests/` (setup + d.ts), plus `package.json`/`yarn.lock` (approved install) and the still-uncommitted `globals.css` (Stories 1.1/1.2).
- **Pre-existing, untouched:** `'inter' unused` lint warning; Dexie/`fake-indexeddb` still in deps (Story 1.4 removes); `lib/repository/` still present (Story 1.4).

### File List

- `tests/setup.ts` (new) — jest-dom/vitest matcher + type registration.
- `tests/vitest.d.ts` (new) — Vitest global types reference.
- `lib/keyboard.ts` (new) — `isTypingTarget`.
- `lib/keyboard.test.ts` (new).
- `hooks/use-should-animate.ts` (new) — `useShouldAnimate` (imports `framer-motion`).
- `hooks/use-should-animate.test.ts` (new).
- `hooks/index.ts` (modified) — re-export `use-should-animate`.
- `components/computed-styles-panel.tsx` (new) — `ComputedStylesPanel` + `ComputedStylesCell`.
- `components/computed-styles-panel.test.tsx` (new).
- `components/theme-provider.tsx` (modified) — import shared `isTypingTarget`, remove local copy.
- `_bmad-output/project-context.md` (modified) — `framer-motion` import convention corrected.
- `package.json` / `yarn.lock` (modified) — added `@testing-library/dom@10.4.1` (-D).

### Review Findings

- [x] [Review][Defer] ThemeHotkey still toggles light mode (`components/theme-provider.tsx:46`) — `setTheme(resolvedTheme === "dark" ? "light" : "dark")` allows switching to light theme, but the site is dark-only per resolved decision. This behavior is pre-existing from commit `643002c`; Story 2.4 will change the `D` hotkey to a dark-only toast. (`components/theme-provider.tsx` was only modified to import shared `isTypingTarget`; hotkey behavior was untouched.)
- [x] [Review][Defer] `import * as React from "react"` pattern (`components/theme-provider.tsx:3`) — Project context prefers avoiding `import React` (JSX runtime is `react-jsx`). Pre-existing from commit `643002c`; the file was only modified to add the `isTypingTarget` import.

### Change Log

- 2026-05-30 — Added shared cross-cutting helpers: `useShouldAnimate()` (`hooks/use-should-animate.ts`, imports `framer-motion`), `isTypingTarget()` (`lib/keyboard.ts`, extracted from theme-provider + refactored the provider to consume it), and `<ComputedStylesPanel>`/`<ComputedStylesCell>` (`components/computed-styles-panel.tsx`). Brought up the Vitest harness (`tests/setup.ts` via jest-dom/vitest, `tests/vitest.d.ts` globals, installed missing `@testing-library/dom` peer). 10 unit tests, all passing. Updated `project-context.md` motion-import convention to `framer-motion`. Status → review. (claude-opus-4-8)

### Follow-ups / Deferred

- **Docs reconciliation:** `architecture.md`, `epics.md`, and `prds/.../addendum.md` still reference `motion/react`. Update them to `framer-motion` (or install the `motion` package later and revert) so all planning docs agree with `project-context.md`. Low priority; no code impact.

## Questions for Hossam (non-blocking — defaults chosen)

1. **`ComputedStylesCell` companion:** The story adds a tiny `ComputedStylesCell` (a `bg-surface p-4` cell) alongside `ComputedStylesPanel` so the idiom's `bg-surface` is written once, not re-typed by every consumer. If you'd rather keep the API to a single `<ComputedStylesPanel>` and have each consumer add `bg-surface` to its own children, say so. Default: ship both.
2. **`isTypingTarget` includes `<select>`:** Kept from the existing implementation (broader than the architecture's 3-item prose). Confirm you want hotkeys suppressed while a `<select>` is focused. Default: keep `SELECT`.
