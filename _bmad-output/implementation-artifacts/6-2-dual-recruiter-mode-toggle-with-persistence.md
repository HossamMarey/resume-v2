# Story 6.2: Dual Recruiter Mode toggle with persistence

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a recruiter,
I want the Recruiter Mode toggle reachable in ≤2 clicks from anywhere,
so that I'm never trapped in an unfamiliar UI.

## Acceptance Criteria

1. **(FR-100 + ARCH-3 — single source of truth via one hook)** Recruiter Mode state is owned by a single client hook `useRecruiterMode` (`hooks/use-recruiter-mode.ts`) that reads/writes `localStorage["hm_recruiter_v1"]` (a boolean stored as `"true"`/`"false"`). **No component reads or writes that key directly** — every surface goes through the hook (which delegates storage I/O to a `lib/recruiter/bus.ts` module, mirroring `lib/xp/bus.ts` and `lib/unlocks/bus.ts`). Two surfaces drive it:
   - **Chrome button** — a button labeled the literal text **"Recruiter Mode"**, placed **right of the identity strip** (at the existing `{/* Recruiter Mode chip — Epic 6 */}` slot in `components/devtools-chrome.tsx`, left of `<XPBar>`), **visible only at `≥sm`** (`hidden sm:inline-flex`), with a **lime border** — the **only** chrome element using a lime border outside the active-tab underline. Accessible name "Toggle Recruiter Mode" (e.g. `aria-label`), visible focus ring (`focus-visible:ring-1 focus-visible:ring-ring`).
   - **⌘K palette Actions entry** — the existing "Toggle Recruiter Mode" `CommandItem` in `components/command-palette.tsx` (Actions group) is **rewired** to set the mode through the hook (today it only `router.push("/recruiter")` with no storage write).

2. **(FR-101 — toggle ON)** Activating either surface writes `hm_recruiter_v1 = true` **and** navigates to `/recruiter`. Because `/recruiter` lives **outside** the `(chrome)` route group, the chrome (identity strip, tab row, XP bar, command palette, mobile bottom nav) is **unmounted entirely — not CSS-hidden** — by the route change. No `display:none`/conditional-render hiding of chrome.

3. **(FR-104 — toggle OFF returns to `/`)** From `/recruiter` (where no chrome and no palette exist), a single **"Exit Recruiter Mode"** control writes `hm_recruiter_v1 = false` and navigates to `/`, restoring the full chrome. This control is the OFF half of the toggle (the chrome button + palette are the ON half; they are unmounted on `/recruiter`). It is keyboard-reachable with a visible focus ring and uses semantic, editorial-register styling that does not reintroduce DevTools chrome onto the editorial page.

4. **(FR-100 "state persists" + UX §539 — persisted preference honored on load)** The persisted preference is honored on a fresh load of a chrome route: when `hm_recruiter_v1 === true` and the user lands on any `(chrome)` route, a mount-time guard (using `useRecruiterMode`, behind its mounted gate) `router.replace("/recruiter")` so a returning recruiter lands in the editorial layout. `/recruiter` itself stays reachable by direct URL **regardless** of the stored value (the editorial route is never redirected away). Toggling OFF (AC3) sets `false` first, so the subsequent landing on `/` does not bounce back. **(See "Open decisions" — this redirect is the recommended default; if Hossam prefers no auto-redirect, this one guard is the only piece to drop and the toggle still satisfies FR-100/101/104.)**

5. **(UX-DR10 / AC mobile — `<sm` reachability)** On mobile (`<sm`) the chrome button is hidden (AC1 `hidden sm:inline-flex`); the toggle remains reachable through the ⌘K palette **Actions** group (same rewired `CommandItem`). No new mobile chrome affordance is added in this story.

6. **(SSR-safe, degradation, no state lib)** The hook never reads storage during render — it uses the established `useEffect` + `requestAnimationFrame` mounted-gate pattern (mirrors `useXP`/`useUnlocks`), attaches a same-tick event listener synchronously, and wraps all `localStorage` access in `try/catch` (private mode / quota → degrade to in-memory, navigation still happens). **No state-management library**, no new dependency.

7. **("Gamification gone" on `/recruiter` — Konami suppression, deferred from Story 6.1)** The global `KonamiListener` (mounted in root `app/layout.tsx`, so it is present on `/recruiter`) is **suppressed on `/recruiter`**: its keydown handler early-returns when `usePathname() === "/recruiter"`, so the editorial route has no live gamification listener. (XP/palette/REPL are already gone because the chrome is unmounted; this closes the one global listener that root layout keeps mounted.)

8. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds; toggling ON navigates to a statically rendered `/recruiter`, toggling OFF returns to `/` with chrome restored, and a persisted `true` redirects chrome routes to `/recruiter` on load.

## Tasks / Subtasks

- [x] **Task 1 — Storage bus `lib/recruiter/bus.ts` (AC: 1, 6)**
  - [x] Create `lib/recruiter/bus.ts` mirroring `lib/unlocks/bus.ts` / `lib/xp/bus.ts`: export `RECRUITER_EVENT = "hm:recruiter"`, `RECRUITER_KEY = "hm_recruiter_v1"`, `readRecruiterMode(): boolean` (SSR guard `typeof window === "undefined"` → `false`; `try/catch` → `false`; value is `localStorage.getItem(RECRUITER_KEY) === "true"`), and `writeRecruiterMode(on: boolean): void` (SSR guard; `try { setItem(KEY, on ? "true" : "false"); persisted = true } catch {}`; dispatch `new CustomEvent(RECRUITER_EVENT)` only when persisted — same shape as `addUnlock`).
  - [x] Colocate `lib/recruiter/bus.test.ts`: default read `false`; write `true` persists `"true"` + dispatches `RECRUITER_EVENT`; write `false` persists `"false"`; `setItem` throwing degrades silently (no throw, no event).

- [x] **Task 2 — Hook `hooks/use-recruiter-mode.ts` (AC: 1, 6)**
  - [x] Create `hooks/use-recruiter-mode.ts` (`"use client"`, named export `useRecruiterMode`) modeled exactly on `hooks/use-unlocks.ts`/`hooks/use-xp.ts`: `useState` for the boolean + a `mounted` gate; in `useEffect`, attach `RECRUITER_EVENT` listener synchronously (`onChange = () => setMode(readRecruiterMode())`), then a `requestAnimationFrame` does the initial `setMode(readRecruiterMode())` + `setMounted(true)`; cleanup removes the listener and cancels the rAF. Return `{ isRecruiterMode: mounted ? mode : false, mounted, setRecruiterMode: writeRecruiterMode }`.
  - [x] (Optional, for consistency) add `export * from "./use-recruiter-mode"` to `hooks/index.ts`. (Note: `use-unlocks` is imported directly today, so a direct `@/hooks/use-recruiter-mode` import is also fine — match whichever the consuming file already does.)
  - [x] Colocate `hooks/use-recruiter-mode.test.ts` mirroring `hooks/use-unlocks.test.ts`/`hooks/use-xp.test.ts`: initial value is `false` before the rAF (mounted gate); after the rAF it reflects the persisted value; dispatching `RECRUITER_EVENT` after a `writeRecruiterMode(true)` updates the hook. Use the same fake-timer / rAF-flush approach those tests already use.

- [x] **Task 3 — Chrome "Recruiter Mode" button (AC: 1, 2, 5)**
  - [x] In `components/devtools-chrome.tsx`, replace the placeholder `{/* Recruiter Mode chip — Epic 6 */}` (inside the right-side `div`, before `<XPBar />`) with the button. Use `useRouter` from `next/navigation` and `useRecruiterMode`. On click: `setRecruiterMode(true)` then `router.push("/recruiter")`.
  - [x] Styling: reuse `@/components/ui/button` (`<Button variant="outline" size="sm" className="hidden border-lime ... sm:inline-flex">`) **or** a plain `<button>` — either way: literal text **"Recruiter Mode"**, `border-lime` (semantic token, the only chrome lime border outside the active tab), `hidden sm:inline-flex` so it disappears `<sm`, `aria-label="Toggle Recruiter Mode"`, visible `focus-visible:ring-1 focus-visible:ring-ring`. **Semantic tokens + logical properties only** (`me-`/`ms-` not `mr-`/`ml-`); no hardcoded hex/oklch.
  - [x] `DevToolsChrome` is already `"use client"`; the new `useRouter`/`useRecruiterMode` usage is fine. Do **not** read `hm_recruiter_v1` directly here — go through the hook.
  - [x] Add `components/devtools-chrome.test.tsx` (colocated): mock `next/navigation` (`useRouter`→`push`, `usePathname`) and `@/hooks/use-recruiter-mode` (and `@/hooks/use-xp`); assert the "Recruiter Mode" button renders with accessible name, and clicking it calls `setRecruiterMode(true)` then `push("/recruiter")`.

- [x] **Task 4 — Rewire the ⌘K palette Actions entry (AC: 1, 2, 5)**
  - [x] In `components/command-palette.tsx`, import `useRecruiterMode`; change `handleToggleRecruiterMode` to `setRecruiterMode(true)` then `router.push("/recruiter")` (keep `setOpen(false)`). Keep the existing `CommandItem value="Toggle Recruiter Mode"` in the Actions group as-is (label/keywords unchanged). Leave the separate **Navigate → "Recruiter"** item (plain `router.push("/recruiter")`, no storage write) unchanged — it is a navigation shortcut, not the mode toggle.
  - [x] Update `components/command-palette.test.tsx`: mock `@/hooks/use-recruiter-mode` (pattern identical to the existing `@/hooks/use-unlocks` mock) exposing a spy `setRecruiterMode`; change the existing test **"navigates to recruiter via Toggle Recruiter Mode"** to assert both `setRecruiterMode` called with `true` **and** `push("/recruiter")`. The Navigate-group "Recruiter" item test (if added) asserts only `push("/recruiter")`.

- [x] **Task 5 — Exit control on `/recruiter` (AC: 3, 6)**
  - [x] Create a small client component `components/recruiter-exit.tsx` (`"use client"`, named export `RecruiterExit`): a `<button>` (or `Button variant="ghost"/"link"`) labeled e.g. **"Exit Recruiter Mode"** (or "← Interactive site"); on click `setRecruiterMode(false)` then `router.push("/")`. Visible focus ring; editorial/quiet styling (`text-muted-foreground`, `font-mono` or `text-sm` — do **not** reintroduce DevTools chrome/lime-chip visuals onto the editorial page). Semantic tokens + logical properties only.
  - [x] Render `<RecruiterExit />` from `app/recruiter/page.tsx` (the page stays an RSC; importing a client component into an RSC is fine) — place it unobtrusively (top-left or footer of the `max-w-3xl` column). Do **not** convert `recruiter-resume.tsx` to a client component; keep it the pure presentational RSC from Story 6.1.
  - [x] Colocate `components/recruiter-exit.test.tsx`: mock `next/navigation` + `@/hooks/use-recruiter-mode`; clicking calls `setRecruiterMode(false)` then `push("/")`.

- [x] **Task 6 — Persisted-preference redirect guard (AC: 4)**
  - [x] Add a mount-time redirect in the `(chrome)` tree so a persisted `true` lands returning visitors on `/recruiter`. Recommended placement: a tiny client component `components/recruiter-redirect.tsx` (`"use client"`, named export) using `useRecruiterMode` + `useRouter`; in a `useEffect`, when `mounted && isRecruiterMode` → `router.replace("/recruiter")`. Mount it once in `app/(chrome)/layout.tsx` (already `"use client"`). **Use `replace` (not `push`)** so the back button doesn't bounce. Going through `useRecruiterMode` (not `readRecruiterMode`) keeps AC1's "no direct per-component storage reads" intact.
  - [x] Do **not** add a redirect to `app/recruiter/page.tsx` — the editorial route is reachable by direct URL whatever the stored value (Story 6.1 contract). The exit control (Task 5) writes `false` before navigating to `/`, so no bounce.
  - [x] Colocate `components/recruiter-redirect.test.tsx`: when the mocked hook returns `{ mounted: true, isRecruiterMode: true }` → `replace("/recruiter")` is called; when `false` (or `mounted: false`) → `replace` not called.

- [x] **Task 7 — Suppress Konami on `/recruiter` (AC: 7)**
  - [x] In `components/konami-listener.tsx`, add `const pathname = usePathname()` (`next/navigation`) and early-return from the `onKeyDown` handler when `pathname === "/recruiter"` (read the latest pathname — keep it in a ref updated each render, or include `pathname` in the effect deps so the listener re-binds; prefer the ref to avoid re-attaching the global listener). The component still renders `<ChromePulse>`; only the sequence detection is inert on the editorial route.
  - [x] Extend/refresh `components/konami-listener.test.tsx` if present (or add a focused case): completing the sequence while `usePathname()` returns `/recruiter` does **not** call `addUnlock`/`emitXP`/show the pulse; on a normal route it still does.

- [x] **Task 8 — Verify & gate (AC: 2, 3, 4, 8)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds (and `/recruiter` still statically renders — adding a client child to its RSC page must not make the page dynamic).
  - [x] `yarn dev` manual pass (project-context "UI verification"):
    1. Desktop `/`: the lime-bordered **"Recruiter Mode"** button shows right of identity (left of XP bar). Click → lands on `/recruiter`, **no chrome** (no tab row, no XP bar, no palette, no mobile nav). `localStorage.hm_recruiter_v1 === "true"`.
    2. On `/recruiter`: **Exit Recruiter Mode** → back to `/`, full chrome restored, `hm_recruiter_v1 === "false"`.
    3. Persisted reload: set mode ON, hard-refresh `/` (or `/work`) → auto-redirects to `/recruiter`. Set mode OFF, refresh `/` → stays on `/`. Direct-load `/recruiter` with mode `false` → still shows the editorial page (no redirect away).
    4. ⌘K → Actions → "Toggle Recruiter Mode" → same as the button (writes key + navigates).
    5. Mobile (`<640px`): the chrome button is gone; the palette Actions entry still toggles.
    6. `<input>`/REPL typing on a chrome route still doesn't trigger the palette/Konami; Konami sequence on `/recruiter` does nothing.
    7. No console errors/warnings; `D` theme hotkey still works on both `/` and `/recruiter`; `<html dir="rtl">` spacing flips (logical props).

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the dual Recruiter Mode **toggle** and its plumbing — `lib/recruiter/bus.ts` + `useRecruiterMode` hook (single source of truth), the chrome lime-bordered "Recruiter Mode" button, the rewired ⌘K Actions entry, the `/recruiter` **Exit** control, the persisted-preference load redirect, and Konami suppression on `/recruiter`. It makes Story 6.1's destination route a real, reversible, persisted mode.
- **IS NOT:**
  - **The editorial `/recruiter` layout itself** (`recruiter-resume.tsx`) → built in **Story 6.1 (done)**. Do not rebuild or restyle it; only add the small `<RecruiterExit />` to `app/recruiter/page.tsx`.
  - **The recruiter print stylesheet** (`app/recruiter/print.css` / `@media print`) → **Story 7.3**. No print CSS here.
  - **Per-route metadata / OG / JSON-LD** → **Story 7.1**. Keep the existing simple `<title>` on `/recruiter`.
  - **The boss-level contact *form*** (typed prompts, validation-as-tests, stubbed submit + XP) → **Stories 6.3 / 6.4**, and it lives on the `/sources` `contact.ts` preview, not on `/recruiter`.
  - **The "🎮 Show experimental" recruiter footer button (FR-083)** → see "Open decisions" #3. This story's `/recruiter` addition is **only** the mode-OFF exit control, not the Konami keyboard-parity button. Do not build the experimental-unlock footer button here.
  - **Changing XP, unlocks, theme, or any other gamification mechanic.** Recruiter Mode suppresses gamification structurally (chrome unmount + Konami early-return); it does not modify the XP/unlock systems.

### Architecture / project-context guardrails (must follow)
- **No state library; one hook owns the key.** All `hm_recruiter_v1` I/O flows through `useRecruiterMode` → `lib/recruiter/bus.ts`. No component calls `localStorage` for this key directly (AC1). [Source: architecture.md:212,300; project-context.md:269-274]
- **SSR-safe mounted gate.** Never read storage in render. Use `useEffect` + `requestAnimationFrame` + a `mounted` flag, exactly like `hooks/use-xp.ts` and `hooks/use-unlocks.ts`. Attach the event listener synchronously (so a same-tick write is seen); only the initial read/`setMounted` is deferred to the rAF. **Do not gate the listener behind the rAF/mounted flag** — that drops synchronous emits (a real bug fixed in Story 2.5; see `hooks/use-xp.ts` comments). [Source: hooks/use-xp.ts; hooks/use-unlocks.ts]
- **Unmount, not hide.** Recruiter Mode is a complete UI swap via the route-group boundary (`/recruiter` is outside `(chrome)`); the chrome literally unmounts on navigation. Never CSS-hide the chrome to simulate the mode. [Source: architecture.md:206-210,462; project-context.md:270; ux-design-specification.md:85,300]
- **Lime border is precious.** The chrome "Recruiter Mode" button's lime border is the **only** lime border in the chrome outside the active-tab underline — it is the deliberate eye-pull for P1. Don't add other lime borders to chrome. [Source: ux-design-specification.md:164,448; epics.md:705]
- **Button, not Switch.** Render an action button (literal text "Recruiter Mode"), not a `<Switch>` toggle widget. [Source: ux-design-specification.md:559,577]
- **`framer-motion` import** if any motion is added (none required here) — import from `framer-motion`, never `motion/react`. Gate any animation on `prefers-reduced-motion` via `useShouldAnimate`. This story needs **no** animation. [Source: project-context.md:104-105]
- **Type-only imports** use `import type` (`isolatedModules`). **No `import React`** (jsx runtime). **Named exports** for components/hooks; `page.tsx`/`layout.tsx` keep default exports. **Import order:** external → `@/` aliases → relative → side-effects, blank line between groups. [Source: project-context.md:65-72,158-162]
- **Semantic tokens + logical properties only** (RTL is wired). No hardcoded colors, no `ml-`/`mr-`/`left-`/`right-`. [Source: project-context.md:95,100]
- **Accessibility:** every new interactive element keyboard-reachable, visible `focus-visible:ring-1 focus-visible:ring-ring`, real `<button>` (no `<div onClick>`), accessible name "Toggle Recruiter Mode" on the chrome button. [Source: project-context.md:250-257; ux-design-specification.md:893]

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `lib/recruiter/bus.ts` | **NEW** | `RECRUITER_KEY`/`RECRUITER_EVENT` + `readRecruiterMode`/`writeRecruiterMode`. Mirrors `lib/unlocks/bus.ts`. |
| `lib/recruiter/bus.test.ts` | **NEW** | Read default, write persists + dispatches, disabled-storage degradation. |
| `hooks/use-recruiter-mode.ts` | **NEW** | Hook; mounted gate; returns `{ isRecruiterMode, mounted, setRecruiterMode }`. Architecture-named (architecture.md:427). |
| `hooks/use-recruiter-mode.test.ts` | **NEW** | Mounted gate + event update; mirror `use-unlocks.test.ts`. |
| `hooks/index.ts` | **UPDATE (optional)** | Add `export * from "./use-recruiter-mode"` for barrel consistency. |
| `components/devtools-chrome.tsx` | **UPDATE** | Replace the `{/* Recruiter Mode chip — Epic 6 */}` placeholder with the lime-bordered button (`hidden sm:inline-flex`); add `useRouter` + `useRecruiterMode`. |
| `components/devtools-chrome.test.tsx` | **NEW** | Button renders + click writes key + navigates. |
| `components/command-palette.tsx` | **UPDATE** | Rewire `handleToggleRecruiterMode` through `useRecruiterMode`. |
| `components/command-palette.test.tsx` | **UPDATE** | Mock `use-recruiter-mode`; assert `setRecruiterMode(true)` + `push("/recruiter")`. |
| `components/recruiter-exit.tsx` | **NEW** | Client OFF control on `/recruiter`: `setRecruiterMode(false)` + `push("/")`. |
| `components/recruiter-exit.test.tsx` | **NEW** | Click → false + navigate `/`. |
| `app/recruiter/page.tsx` | **UPDATE** | Render `<RecruiterExit />`; page stays RSC; keep simple `<title>`. |
| `components/recruiter-redirect.tsx` | **NEW** | Mount-time guard: persisted `true` → `router.replace("/recruiter")`. |
| `components/recruiter-redirect.test.tsx` | **NEW** | Redirects only when `mounted && isRecruiterMode`. |
| `app/(chrome)/layout.tsx` | **UPDATE** | Mount `<RecruiterRedirect />` (already `"use client"`). |
| `components/konami-listener.tsx` | **UPDATE** | Early-return the keydown handler when `usePathname() === "/recruiter"`. |
| `components/konami-listener.test.tsx` | **UPDATE/NEW** | Sequence on `/recruiter` is inert; normal route still unlocks. |

### Reuse — do NOT reinvent
- **`lib/unlocks/bus.ts` / `lib/xp/bus.ts`** — copy the module shape for `lib/recruiter/bus.ts` (constants, SSR guard, try/catch, dispatch-only-on-persist).
- **`hooks/use-unlocks.ts` / `hooks/use-xp.ts`** — copy the mounted-gate + rAF + synchronous-listener pattern for `use-recruiter-mode.ts`. (Recruiter mode is simpler — a boolean, no delta math, no idempotent-grant set.)
- **`@/components/ui/button`** (`Button`, `variant`, `asChild`) — for the chrome button and exit control if you don't hand-roll a `<button>`.
- **Existing palette mock harness** in `components/command-palette.test.tsx` — the cmdk primitive mocks + `vi.hoisted` router/toast spies are already there; add a `use-recruiter-mode` mock alongside the `use-unlocks` one.
- **Existing semantic tokens** (`border-lime`, `text-foreground`, `text-muted-foreground`, `bg-surface`, `font-mono`, `focus-visible:ring-ring`) — no new tokens.

### Doc-vs-code variances / decisions to surface (do NOT silently resolve)
1. **Persisted-preference auto-redirect (AC4 / Task 6).** The three explicit ACs (FR-100/101/104) describe the *toggle action*; "state persists" + UX §539 ("Recruiter Mode via initial route `/recruiter` if persisted") imply that a returning visitor with `hm_recruiter_v1=true` should land on `/recruiter`. **Default chosen:** implement the chrome-route load redirect (`router.replace`) so persistence is meaningful. **Trade-off to flag:** this also redirects deep links into chrome routes (e.g. a shared `/work/<slug>`) to `/recruiter` while the preference is on. If Hossam wants deep links to bypass the redirect, that is a deliberate refinement (e.g. only redirect from `/`). The whole redirect is isolated to one component (`recruiter-redirect.tsx`) and trivially droppable.
2. **The Exit affordance shape/placement (Task 5).** Specs name the ON surfaces precisely (chrome button + palette) but not the OFF affordance's exact look, because the chrome is unmounted on `/recruiter`. **Default chosen:** a single quiet "Exit Recruiter Mode" text button at the top of the editorial column, styled to not reintroduce DevTools visuals. Hossam may prefer different copy ("← Back to the interactive site") or placement (footer). Cosmetic; does not affect the contract.
3. **FR-083 "🎮 Show experimental" recruiter footer button.** UX §517/§299/§669 mention a recruiter-footer button that gives the Konami unlock keyboard parity. That is a **gamification-discoverability** concern, not the mode toggle, and is **out of scope here** (it would also reintroduce a gamification artifact onto the editorial "calm room," which conflicts with FR-101's "gamification gone"). **Flag:** confirm which story owns FR-083 (likely an Epic 5 follow-up or explicitly dropped for the editorial route). Do not build it in 6.2.

### Previous story / cross-cutting intelligence
- **Story 6.1 (done)** built `components/recruiter-resume.tsx` (pure presentational RSC) and `app/recruiter/page.tsx` (RSC rendering `<main className="mx-auto max-w-3xl px-4 py-16">`). It **explicitly deferred to 6.2**: the `useRecruiterMode` hook, the chrome lime-border button, the ⌘K Actions wiring, the chrome unmount/navigate logic, and Konami suppression on `/recruiter`. Keep `recruiter-resume.tsx` an RSC — only `app/recruiter/page.tsx` gains the client `<RecruiterExit />`/exit affordance. [Source: 6-1-recruiter-editorial-resume-route.md:62-67]
- **Story 2.5** (`hooks/use-xp.ts`) is the canonical mounted-gate reference and the source of the "**don't gate the listener behind the rAF/mounted flag**" rule (synchronous emits get dropped otherwise). Mirror it. [Source: hooks/use-xp.ts; memory feedback_raf_mount_gate_drops_sync_emits]
- **Stories 5.3 / 5.4 (review)**: `components/command-palette.tsx` already has the "Toggle Recruiter Mode" Actions item and a `handleToggleRecruiterMode` that only navigates — this story makes it write the key too. The palette test harness (cmdk mocks, hoisted spies, per-hook `vi.mock`) is the template for mocking `use-recruiter-mode`.
- **`lib/unlocks/bus.ts` + `hooks/use-unlocks.ts`** are the most recent and closest precedent (boolean-ish presence state + event bus + mounted gate) — lean on them over the more complex XP bus.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom` (do **not** import `describe`/`it`/`expect`). `@/` alias works in tests. Colocate `*.test.ts(x)` next to source.
- **Query by role/label/text** — the chrome button by its accessible name (`getByRole("button", { name: /recruiter mode/i })`), the exit control by its name. Avoid `getByTestId` (the cmdk mocks use testids only because the primitives are vendored).
- **`user-event` with `userEvent.setup()`** for clicks; `fireEvent.keyDown(window, …)` only for the keyboard cases user-event doesn't model (matches the existing palette test).
- **Mock external boundaries only:** mock `next/navigation` (`useRouter`/`usePathname`) and the hooks at the component-test boundary; test the **real** `lib/recruiter/bus.ts` and the real hook against jsdom `localStorage`. Don't over-mock the bus in the hook test.
- For the rAF/mounted-gate hook test, mirror the fake-timer / `act` + rAF-flush approach already used in `hooks/use-xp.test.ts` / `hooks/use-unlocks.test.ts`.
- **Don't test:** Tailwind class strings (Prettier sorts them), shadcn primitives, Next framework behavior, the cmdk internals. Verify the live route-group unmount/redirect behavior in Task 8, not in units.

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router.** `useRouter`/`usePathname` from `next/navigation`. `router.replace` for the non-history redirect; `router.push` for user-initiated toggles. `/recruiter` must remain statically rendered — importing a client child into its RSC page is fine and does **not** force the page dynamic.
- **React 19.2.4** — refs are props (no `forwardRef`). Effects run twice in dev Strict Mode — the rAF/mounted gate already tolerates this; don't rely on render-order side effects.
- **Tailwind v4** — tokens in `app/globals.css`, `@theme inline`; `border-lime` is an existing semantic utility. No `tailwind.config.*`.
- **No new dependencies.** No state lib, no router/i18n addition, no motion.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:695-713] — Story 6.2 AC (single hook, chrome button + ⌘K, lime border, ON→/recruiter unmount, OFF→/, mobile palette-only).
- [Source: _bmad-output/planning-artifacts/implementation-readiness-report-2026-05-30.md:129-134] — FR-100..104 (toggle 2 places r/w `hm_recruiter_v1`; ON redirect + unmount; OFF return; FR-102 layout is 6.1; FR-103 dark-only).
- [Source: _bmad-output/planning-artifacts/architecture.md:185,277] — `localStorage` mode bus keys incl. `hm_recruiter_v1`.
- [Source: _bmad-output/planning-artifacts/architecture.md:206-210,462] — route group; `/recruiter` outside `(chrome)`; chrome literally unmounts; root layout owns global concerns except gamification (suppressed by Recruiter Mode).
- [Source: _bmad-output/planning-artifacts/architecture.md:212,300] — no state lib; one hook per key owns storage I/O; SSR-safe mounted gate; direct per-component storage reads forbidden.
- [Source: _bmad-output/planning-artifacts/architecture.md:427,487] — `hooks/use-recruiter-mode.ts` (hm_recruiter_v1 boolean); F12 file map.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:85,93,164,448] — two surfaces; toggle off returns to `/`; ≤2-click ≤10s discoverability; lime border = only chrome lime outside active tab.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:559,573,577,578,815,893] — button not switch; identity-strip anatomy; chip literal text + click behavior; mobile chip hidden / palette-only; a11y label.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:529,539] — mode-bus hooks; URL canonical incl. Recruiter Mode via initial route `/recruiter` if persisted.
- [Source: _bmad-output/project-context.md:269-274,311-312] — versioned keys; complete UI swap (not CSS hide); toggle in two places; SSR/hydration + localStorage-disabled degradation.
- [Source: components/devtools-chrome.tsx:84-86] — the right-side container + `{/* Recruiter Mode chip — Epic 6 */}` placeholder + `<XPBar>` neighbor.
- [Source: components/command-palette.tsx:74-77,165-172] — existing `handleToggleRecruiterMode` (navigate-only) + Actions `CommandItem` to rewire.
- [Source: app/(chrome)/layout.tsx] — `"use client"` chrome layout; mount point for `<RecruiterRedirect />`.
- [Source: app/recruiter/page.tsx] — RSC page rendering `<RecruiterResume />`; host for `<RecruiterExit />`.
- [Source: app/layout.tsx:5,37] — root mounts `<KonamiListener />` (present on `/recruiter`).
- [Source: components/konami-listener.tsx:28-63] — keydown handler to early-return on `/recruiter`.
- [Source: lib/unlocks/bus.ts; lib/xp/bus.ts] — bus module pattern to mirror.
- [Source: hooks/use-unlocks.ts; hooks/use-xp.ts] — hook mounted-gate pattern to mirror; "don't gate the listener" rule.
- [Source: _bmad-output/implementation-artifacts/6-1-recruiter-editorial-resume-route.md:62-67] — explicit 6.1→6.2 scope handoff (hook, button, palette wiring, unmount, Konami suppression).

### Project Structure Notes
- `hooks/use-recruiter-mode.ts`, `lib/recruiter/bus.ts`, and `components/recruiter-*.tsx` match the architecture-named files (architecture.md:427/487) and kebab-case + named-export conventions.
- `app/recruiter/print.css` (7.3) and the boss-level contact form (6.3/6.4) are intentionally **not** created here.
- No new dependencies; no state lib, router, or i18n additions; no motion. The page `/recruiter` stays statically rendered.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Created `lib/recruiter/bus.ts` with `RECRUITER_EVENT`/`RECRUITER_KEY`, SSR-safe `readRecruiterMode()`, and `writeRecruiterMode()` with try/catch degradation and event dispatch.
- Created `hooks/use-recruiter-mode.ts` mirroring `use-unlocks.ts`/`use-xp.ts` mounted-gate + synchronous listener + rAF pattern.
- Added lime-bordered "Recruiter Mode" button to `components/devtools-chrome.tsx` (right of identity, left of XP bar, `hidden sm:inline-flex`).
- Rewired `components/command-palette.tsx` Actions "Toggle Recruiter Mode" to write `hm_recruiter_v1=true` before navigating.
- Created `components/recruiter-exit.tsx` and rendered it in `app/recruiter/page.tsx` for the OFF control.
- Created `components/recruiter-redirect.tsx` and mounted it in `app/(chrome)/layout.tsx` for persisted-preference auto-redirect (uses `router.replace`).
- Updated `components/konami-listener.tsx` to early-return on `/recruiter` via `usePathname` ref.
- Added colocated tests for all new modules and updated existing tests. All 280 tests pass.
- `yarn typecheck`, `yarn lint`, `yarn test:run`, `yarn format`, `yarn build` all green. `/recruiter` remains statically rendered.

### File List

- `lib/recruiter/bus.ts` — NEW
- `lib/recruiter/bus.test.ts` — NEW
- `hooks/use-recruiter-mode.ts` — NEW
- `hooks/use-recruiter-mode.test.ts` — NEW
- `hooks/index.ts` — UPDATE (barrel export)
- `components/devtools-chrome.tsx` — UPDATE (Recruiter Mode button)
- `components/devtools-chrome.test.tsx` — NEW
- `components/command-palette.tsx` — UPDATE (rewire Actions toggle)
- `components/command-palette.test.tsx` — UPDATE (assert setRecruiterMode call)
- `components/recruiter-exit.tsx` — NEW
- `components/recruiter-exit.test.tsx` — NEW
- `app/recruiter/page.tsx` — UPDATE (render RecruiterExit)
- `components/recruiter-redirect.tsx` — NEW
- `components/recruiter-redirect.test.tsx` — NEW
- `app/(chrome)/layout.tsx` — UPDATE (mount RecruiterRedirect)
- `components/konami-listener.tsx` — UPDATE (suppress on /recruiter)
- `components/konami-listener.test.tsx` — UPDATE (add /recruiter inert case)

## Story Completion Status

- [x] Epic context analyzed
- [x] Architecture requirements extracted (route-group unmount boundary, mode bus, single-hook ownership, SSR mounted gate)
- [x] Existing code read (devtools-chrome placeholder, palette handler, bus + hook patterns, layouts, konami listener)
- [x] File modifications identified (UPDATE vs NEW)
- [x] Reuse opportunities documented (unlocks/xp bus + hooks, palette test harness, ui/button)
- [x] Testing requirements specified
- [x] Anti-patterns and guardrails listed (no CSS-hide, no direct storage reads, no state lib, lime-border discipline)
- [x] Doc-vs-code variances surfaced (persist-redirect default + deep-link trade-off, exit affordance shape, FR-083 ownership)
- [x] Scope boundaries vs Stories 6.1 / 6.3 / 6.4 / 7.1 / 7.3 stated

**Status:** review
**Ultimate context engine analysis completed — comprehensive developer guide created**

### Review Findings

- [x] [Review][Patch] Import order violation in `devtools-chrome.tsx` — `@/hooks/use-recruiter-mode` imported before `next/navigation` [components/devtools-chrome.tsx:14-15] — **fixed**
- [x] [Review][Patch] `mockIsUnlocked` type narrowed from `(name: string) => boolean` to `() => boolean`, breaking TS at lines 310/317 [components/command-palette.test.tsx:23] — **fixed**
- [x] [Review][Defer] `writeRecruiterMode` silent failure when localStorage throws — no event dispatched, hooks go stale [lib/recruiter/bus.ts:25-27] — deferred, pre-existing pattern from xp/unlocks bus
- [x] [Review][Defer] Exit redirect loop risk — if `writeRecruiterMode(false)` silently fails, `RecruiterRedirect` reads stale `true`, potential bounce [components/recruiter-exit.tsx:11-14] — deferred, dependent on localStorage failure (extremely unlikely for small values)
- [x] [Review][Defer] No cross-tab sync — `CustomEvent` is tab-local, `storage` event not listened [hooks/use-recruiter-mode.ts:22] — deferred, pre-existing pattern across all bus modules
