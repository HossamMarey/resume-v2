# Story 5.4: Konami unlock with chrome pulse

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a curious peer,
I want the Konami code to unlock an experimental surface,
so that discovering it feels like a reward worth sharing.

## Acceptance Criteria

1. **(FR-080 — sequence detection)** A new client component `components/konami-listener.tsx` (named export `KonamiListener`) is mounted **once** in the **root** layout `app/layout.tsx` (replacing the `{/* KonamiListener placeholder — Story 2.5 */}` comment), so the buffer is global and survives client route transitions. A single `window` `keydown` listener detects the sequence `↑↑↓↓←→←→BA` — i.e. `ArrowUp, ArrowUp, ArrowDown, ArrowDown, ArrowLeft, ArrowRight, ArrowLeft, ArrowRight, b, a` — **case-insensitive on the letters** (`b`/`B`, `a`/`A`). A **partial/late/wrong** key resets the buffer; a wrong key that is itself the first key of the sequence (`ArrowUp`) restarts the buffer at progress 1 (standard Konami restart — do not drop a fresh `ArrowUp`).

2. **(FR-080 — 2-second per-key window)** More than **2000ms** between consecutive accepted keys resets the buffer to empty. (Implement as a per-key timer cleared/reset on each accepted key; the pure key-matching reducer lives in `lib/keyboard.ts` so it is property-testable.)

3. **(FR-081 — typing-target + modifier skip)** Detection MUST be ignored when `isTypingTarget(event.target)` is true (`@/lib/keyboard` — reuse, do not reinvent) and when `event.metaKey || event.ctrlKey || event.altKey` is held or `event.repeat` is true — mirroring the `ThemeHotkey` pattern in `components/theme-provider.tsx`. (Holding a modifier or typing in the REPL `<input>` / contact form must never advance the buffer.)

4. **(FR-082 — persist unlock, once)** On completion the listener calls `addUnlock("konami")` from a new `lib/unlocks/bus.ts`, which appends `"konami"` to the array in `localStorage["hm_unlocks_v1"]` **idempotently** (no duplicate entries; no-op if already present) and dispatches a `CustomEvent("hm:unlock")` so already-mounted surfaces (the persistent palette) update live without reload. `localStorage` is wrapped in try/catch — private mode / quota failure degrades to in-memory (no crash; user can re-Konami next visit).

5. **(FR-082 — +20 XP once-ever)** On completion the listener calls `emitXP(20, "konami")` (`@/lib/xp/bus` — reuse). The existing bus already dedupes by reason via `hm_xp_granted`, so a second completion (or a reload + re-Konami) does **not** re-grant. Do **not** reimplement once-grant logic.

6. **(FR-082 + UX §743 — one-shot 800ms lime chrome pulse, reduced-motion suppressed)** On completion a single ~**800ms** lime glow pulse fires over the viewport/chrome, then self-clears (one-shot, does not loop). It is **suppressed entirely under `prefers-reduced-motion`** via `useShouldAnimate()` (`@/hooks/use-should-animate`) — when reduced motion is set, the pulse renders nothing while the XP grant + unlock persistence + REPL/palette reveal still happen. Animate **`opacity`/`transform` only** (never `width`/`height`/`top`/`left`); use semantic tokens (`bg-lime` / `ring-lime` / `shadow`), never hardcoded color. Implement as `components/chrome-pulse.tsx` (named export `ChromePulse`) — a controlled one-shot animation the listener triggers; it returns `null` when reduced motion is set or when inactive.

7. **(FR-082 — `experimental` revealed in REPL)** `lib/repl/commands.ts` gains an `experimental` registry entry marked **locked**. `runCommand` accepts the current unlock array (default `[]` so existing callers/tests are unaffected) and:
   - **hides** locked commands from `help` output unless `"konami"` is unlocked;
   - returns the standard **`command not found`** result for a locked command when it is not unlocked (it must not even hint that `experimental` exists before unlock);
   - when `"konami"` is unlocked, `help` lists `experimental` and running `experimental` returns the **real content** (AC 9). `components/console-repl.tsx` reads the array via `useUnlocks()` and passes it to `runCommand(command, unlocks)`.

8. **(FR-082 — "Experimental" palette entry)** `components/command-palette.tsx` reads `useUnlocks()` and **conditionally renders** an `Experimental` `<CommandItem>` in the **Actions** group **only when `"konami"` is unlocked** (the append seam left by Story 5.3 — add the entry, do not restructure the group). Selecting it closes the palette and `router.push("/console")` (where the `experimental` command lives). Because the palette is mounted persistently, the `hm:unlock` event makes the entry appear the same session the sequence completes; on reload it reads the persisted array.

9. **(OQ3 — real content or ship disabled — NON-NEGOTIABLE)** The `experimental` command MUST reveal **real content** (a project/idea Hossam is genuinely exploring), sourced from a new typed content module `lib/content/experimental.ts` (exported via the `@/lib/content` barrel). A placeholder is unacceptable (UX §522, OQ3). If no real content is authored, the unlock **ships disabled**: when the content module is empty, the whole Konami unlock is inert (the listener does not unlock, the palette entry never appears, `experimental` stays `command not found`) — it does **not** point at a placeholder. A single `EXPERIMENTAL_ENABLED` flag derived from content presence is the source of truth gating the listener, the REPL command, and the palette entry. **See Questions #1 — Hossam must provide the content (or confirm ship-disabled).**

10. **(FR-083 — deferred to Epic 6, surfaced not silently dropped)** The Recruiter-Mode footer "🎮 Show experimental" parity button (FR-083) is **out of scope here** — it lives on the `/recruiter` editorial layout, which is **Story 6.1** (today `/recruiter` is a stub). Keep `addUnlock("konami")` as the single shared unlock writer so the 6.1 footer button can call it in one line. (See Dev Notes "FR-083 — deferred to Epic 6.")

11. **(State-bus discipline — one hook per key)** A new `hooks/use-unlocks.ts` (named export `useUnlocks`) is the **only** way components read `hm_unlocks_v1`. It reads on mount (deferred via `requestAnimationFrame`, mounted-gated → returns `[]` during SSR/first paint to avoid hydration mismatch and `react-hooks/set-state-in-effect`) and subscribes **synchronously** to `hm:unlock` (mirror `hooks/use-xp.ts` exactly — attach the listener synchronously so a same-tick unlock is not missed; rAF only the initial read). Returns `{ unlocks, isUnlocked(name) }`. No component reads `localStorage["hm_unlocks_v1"]` directly.

12. **(Reuse — do not reinvent)** Reuse `isTypingTarget` (`@/lib/keyboard`), `emitXP` (`@/lib/xp/bus`), `useShouldAnimate` (`@/hooks/use-should-animate`), `cn` (`@/lib/utils`), the `@/lib/content` barrel, `useRouter` from `next/navigation`. Do **not** add a dependency, a state library, a `tailwind.config.*`, or edit `app/globals.css` for the pulse (gate in JS, the in-repo pattern). Do **not** modify `lib/command-palette/bus.ts`, `inspect-me-cta.tsx`, or `components/ui/*`.

13. **(Accessibility)** The listener and pulse are non-interactive: the pulse overlay is `aria-hidden="true"` + `pointer-events-none` and never traps focus or blocks clicks. The unlock has a keyboard/discovery equivalent **deferred to Epic 6** (FR-083 footer button) — note it; do not block on it. No new focusable elements are introduced. Existing `aria-live` XP toast announces the grant (existing infra).

14. **(Regression)** Persistent chrome, tab navigation, `visit:*` XP grants (Story 2.5), the `D` deadpan toast (`theme-provider.tsx`), the XP bar/toast, the `⌘K` palette (Story 5.3, incl. re-press-to-close + typing-target skip), the REPL (`help`/`whoami`/`projects`/`contact`/`theme`/`clear`/`download resume`, history, `+5 repl:command` XP), mobile bottom nav, RTL, and theme all keep working. `runCommand("…")` (no second arg) still behaves exactly as before for all existing tests. No console errors/warnings on any path.

15. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds; all chrome routes + `/recruiter` still render. Live verification (Task 7) confirms: sequence unlocks (pulse + `+20` toast), reload persists, `experimental` works in REPL + appears in `help`, palette "Experimental" entry appears, typing-target/2s-timeout/partial-reset all behave, reduced-motion suppresses the pulse (everything else still works), and the content-empty path ships the unlock disabled.

## Tasks / Subtasks

- [x] **Task 1 — Konami key-matching in `lib/keyboard.ts` (pure, property-testable) (AC: 1, 2)**
  - [ ] Add `export const KONAMI_KEYS` = the normalized lowercase sequence: `["arrowup","arrowup","arrowdown","arrowdown","arrowleft","arrowright","arrowleft","arrowright","b","a"] as const`.
  - [ ] Add `export function normalizeKonamiKey(key: string): string` → `key.toLowerCase()`.
  - [ ] Add a **pure** advance reducer, e.g. `export function advanceKonami(progress: number, key: string): number`: given current match progress (0..len) and the next raw key, return the new progress. On match → `progress + 1`; on mismatch → restart (`normalizeKonamiKey(key) === KONAMI_KEYS[0] ? 1 : 0`). Add `export function isKonamiComplete(progress: number): boolean` → `progress >= KONAMI_KEYS.length`.
  - [ ] Keep these functions free of DOM/`window` — the component owns timing + side effects. (Property tests: arbitrary key noise never completes unless the exact ordered subsequence occurs; a completing run reports complete; the `↑↑↑↓…` overlap restarts correctly.)

- [x] **Task 2 — Unlock bus `lib/unlocks/bus.ts` (NEW) (AC: 4, 11)**
  - [ ] Mirror `lib/xp/bus.ts` structure. Export `UNLOCK_EVENT = "hm:unlock"`, `UNLOCKS_KEY = "hm_unlocks_v1"`.
  - [ ] `export function readUnlocks(): string[]` — try/catch `localStorage.getItem`; `JSON.parse`; return `Array.isArray(parsed) ? parsed.filter(x => typeof x === "string") : []`; `[]` on any error or SSR (`typeof window === "undefined"`).
  - [ ] `export function hasUnlock(name: string, unlocks = readUnlocks()): boolean`.
  - [ ] `export function addUnlock(name: string): void` — SSR guard; read current; if already present **return** (idempotent, no event); else push, persist (try/catch → in-memory degrade), then `window.dispatchEvent(new CustomEvent(UNLOCK_EVENT))`.
  - [ ] (Optional pure helper `reduceUnlocks(adds: string[], initial?: string[])` for symmetry with `reduceGrants` if it makes the unit test cleaner — not required.)

- [x] **Task 3 — `hooks/use-unlocks.ts` (NEW) (AC: 7, 8, 11)**
  - [ ] `"use client"`. Named export `useUnlocks`. Mirror `hooks/use-xp.ts`: `const [unlocks, setUnlocks] = useState<string[]>([])`, `const [mounted, setMounted] = useState(false)`.
  - [ ] In one `useEffect([])`: attach `window.addEventListener(UNLOCK_EVENT, onUnlock)` **synchronously** (where `onUnlock` does `setUnlocks(readUnlocks())`); then `const raf = requestAnimationFrame(() => { setUnlocks(readUnlocks()); setMounted(true) })`. Cleanup removes the listener + cancels the rAF.
  - [ ] Return `{ unlocks: mounted ? unlocks : [], isUnlocked: (name: string) => (mounted ? unlocks : []).includes(name) }`.

- [x] **Task 4 — Experimental content `lib/content/experimental.ts` (NEW) + barrel (AC: 9)**
  - [ ] Define a Zod schema + typed export for the experimental panel content (e.g. `experimental: { title: string; lines: string[] }` or `string[]`). **Author REAL content** (a project/idea Hossam is exploring) — pending Hossam (Questions #1). Until provided, export an **empty** shape.
  - [ ] Derive `export const EXPERIMENTAL_ENABLED = experimental.lines.length > 0` (single source of truth). Re-export from `lib/content/index.ts`.
  - [ ] **Do not invent placeholder copy.** Empty content ⇒ `EXPERIMENTAL_ENABLED === false` ⇒ unlock inert everywhere (AC 9).

- [x] **Task 5 — REPL `experimental` command + unlock-aware `runCommand` (AC: 7, 9, 14)**
  - [ ] In `lib/repl/commands.ts`: extend `CommandEntry` with optional `locked?: boolean`. Add an `experimental` entry (`locked: true`) whose `run()` returns the real content lines from `@/lib/content` `experimental` (gate on `EXPERIMENTAL_ENABLED`).
  - [ ] Change signature to `export function runCommand(raw: string, unlocks: string[] = []): ReplResult`. The `help` builder filters: include a `locked` command only when `unlocks.includes("konami") && EXPERIMENTAL_ENABLED`. When a matched entry is `locked` and not unlocked (or `!EXPERIMENTAL_ENABLED`) → return `notFound(trimmed, …)` (stays hidden; suggestion list must also exclude locked-while-locked commands so `suggest` can't leak `experimental`).
  - [ ] Existing behavior with no second arg unchanged (default `[]`). Do not alter other commands.

- [x] **Task 6 — Wire consumers (AC: 6, 7, 8, 1)**
  - [ ] `components/console-repl.tsx`: `const { unlocks } = useUnlocks()`; call `runCommand(command, unlocks)`; add `unlocks` to the `handleSubmit` `useCallback` deps.
  - [ ] `components/command-palette.tsx`: `const { isUnlocked } = useUnlocks()`; in the Actions group, after the existing items, render `{isUnlocked("konami") && EXPERIMENTAL_ENABLED && <CommandItem value="Experimental" keywords={["experimental","unlock","konami","secret"]} onSelect={handleOpenExperimental}>Experimental</CommandItem>}` where `handleOpenExperimental` does `setOpen(false); router.push("/console")`.
  - [ ] `components/chrome-pulse.tsx` (NEW): `"use client"`, named export `ChromePulse`, prop `active: boolean` (+ `onDone?: () => void`). Returns `null` when `!useShouldAnimate()` or `!active`. Otherwise renders a `fixed inset-0 z-[60] pointer-events-none` `aria-hidden` `motion.div` that animates opacity once (~0.8s, lime ring/glow via tokens) and calls `onDone` on `onAnimationComplete`.
  - [ ] `components/konami-listener.tsx` (NEW): `"use client"`, named export `KonamiListener`. `window` keydown effect (mounted once, `[]` deps): skip when `event.defaultPrevented || event.repeat`, modifier held, or `isTypingTarget(event.target)`; advance a `progressRef` via `advanceKonami`; reset a 2000ms timer on each accepted advance (clear on cleanup); on `isKonamiComplete` → guard on `EXPERIMENTAL_ENABLED`, then `addUnlock("konami")`, `emitXP(20,"konami")`, set `pulse=true`, reset progress. Render `<ChromePulse active={pulse} onDone={() => setPulse(false)} />`.
  - [ ] `app/layout.tsx`: replace the `{/* KonamiListener placeholder — Story 2.5 */}` comment with `<KonamiListener />` (client island inside the server root layout — fine).

- [x] **Task 7 — Tests (AC: 1–9, 11, 14)**
  - [ ] `lib/keyboard.test.ts` (UPDATE): unit + **fast-check** property tests for `advanceKonami`/`isKonamiComplete` (noise never completes; exact run completes; `↑↑↑↓` overlap restarts at 1; case-insensitive `B`/`A`).
  - [ ] `lib/unlocks/bus.test.ts` (NEW): `readUnlocks` empty/garbage/non-array → `[]`; `addUnlock` persists + dedupes + dispatches `hm:unlock` once (and **not** again when already present); quota/SSR guards don't throw. (`afterEach` clears `localStorage`.)
  - [ ] `lib/repl/commands.test.ts` (UPDATE): with default unlocks, `help` omits `experimental` and `runCommand("experimental")` is `not-found`; with `["konami"]` (+ enabled content fixture) `help` includes `experimental` and it returns the real lines; `suggest` never proposes `experimental` while locked; all existing command tests still green.
  - [ ] `hooks/use-unlocks.test.ts` (NEW): returns `[]` before rAF/mount; reads persisted array; updates on `hm:unlock` dispatch. (Use `act` + flush rAF as `use-xp.test.ts` does.)
  - [ ] `components/konami-listener.test.tsx` (NEW): mock `@/lib/unlocks/bus` (`addUnlock`), `@/lib/xp/bus` (`emitXP`), `@/hooks/use-should-animate`. `fireEvent.keyDown(window, {key})` the full sequence → `addUnlock("konami")` + `emitXP(20,"konami")` called once. Typing-target skip (dispatch with a focused `<input>` target → no unlock). Partial/wrong-key reset (insert a wrong key mid-run → no unlock). 2s timeout (`vi.useFakeTimers()`, advance >2000ms mid-run → no unlock). Reduced-motion (`useShouldAnimate` → false) still unlocks + grants XP but renders no pulse. Content-disabled path (`EXPERIMENTAL_ENABLED` false fixture) → sequence does nothing.
  - [ ] `components/command-palette.test.tsx` (UPDATE): mock `@/hooks/use-unlocks` → no `Experimental` item when locked; present when `isUnlocked("konami")` true (+ enabled). Selecting → `push("/console")`.
  - [ ] `components/console-repl.test.tsx` (UPDATE): mock `useUnlocks`; with `["konami"]`, submitting `experimental` shows the real content lines; existing tests still pass.
  - [ ] Query by role/label/text; mock **boundaries only**; no snapshot/Tailwind/framer-motion-internal assertions.

- [x] **Task 8 — Live verification (AC: 6, 7, 8, 14, 15)**
  - [ ] `yarn dev`. On any route type `↑↑↓↓←→←→BA` (not focused in an input) → lime pulse flashes once + `+20` XP toast; reload → still unlocked.
  - [ ] `/console`: `help` now lists `experimental`; run `experimental` → real content. `⌘K` palette → Actions shows **Experimental** → selecting lands on `/console`.
  - [ ] Negative paths: type the sequence **inside** the REPL input → no unlock; pause >2s mid-sequence → no unlock; wrong key mid-sequence → no unlock.
  - [ ] Reduced motion (DevTools "Emulate prefers-reduced-motion: reduce") → **no pulse**, but XP grants, unlock persists, `experimental` + palette entry appear. No console errors/warnings; `D` toast, tab-switch, RTL (`<html dir="rtl">`), mobile (`<640px`) intact.
  - [ ] If content is left empty (`EXPERIMENTAL_ENABLED === false`): sequence does nothing, no palette entry, `experimental` → `command not found` (ship-disabled path).

- [x] **Task 9 — Gate + commit (AC: 15)**
  - [ ] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds.
  - [ ] Commit (Conventional Commits, console scope): `feat(console): konami unlock with chrome pulse (story 5.4)`.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the global Konami sequence buffer (`↑↑↓↓←→←→BA`) mounted in the **root** layout, the `hm_unlocks_v1` persistence bus + `useUnlocks` hook, a one-shot 800ms lime chrome pulse (reduced-motion-suppressed), `+20` once-ever XP, and the reveal of `experimental` in the REPL `help`/registry **and** an "Experimental" entry in the `⌘K` palette Actions group — all gated on **real** experimental content existing.
- **IS NOT:**
  - **The FR-083 Recruiter footer "🎮 Show experimental" button** — that route/footer is **Story 6.1**; keep `addUnlock("konami")` shared so 6.1 calls it (AC 10).
  - **A new `/experimental` route or panel UI** — `experimental` content surfaces inside the existing REPL transcript; the palette entry routes to `/console`. (No new route is in scope; flag if a richer panel is wanted — Questions #2.)
  - **Recruiter-mode unmount of Konami** (FR-101) — Epic 6. For now the listener lives in root layout and is present on `/recruiter` too (acceptable; `/recruiter` is a stub).
  - **Changing XP once-grant / XPToast** — reuse `emitXP`; don't touch the bus or toast format (see the toast-copy note below).

### The unlock data flow (three surfaces, one source)
```
KonamiListener (root layout, global keydown)
  └─ sequence complete + EXPERIMENTAL_ENABLED
       ├─ addUnlock("konami")  → localStorage["hm_unlocks_v1"] += "konami"  → dispatch CustomEvent("hm:unlock")
       ├─ emitXP(20,"konami")  → existing hm:xp bus (deduped by hm_xp_granted) → XPToast +20
       └─ ChromePulse active=true (800ms, suppressed under reduced motion)

useUnlocks() (mounted-gated, subscribes to "hm:unlock")
  ├─ ConsoleREPL → runCommand(cmd, unlocks)  → help lists / runs `experimental`
  └─ CommandPalette → renders "Experimental" Actions item
       (live this session via the event; on reload both read the persisted array)
```

### Reuse — do NOT reinvent (mirror existing precedent)
- **`isTypingTarget`** — `@/lib/keyboard:1` (the same helper `D`/`⌘K` use; architecture mandates ONE shared helper for all global hotkeys — `architecture.md:243,306`).
- **`emitXP` + once-ever grant** — `@/lib/xp/bus:62`. Reason `"konami"`; the bus already persists granted reasons in `hm_xp_granted` and no-ops repeats. **Do not** add your own once-guard for XP.
- **`useShouldAnimate()`** — `@/hooks/use-should-animate` (reduced-motion gate; `false` ⇒ render nothing / collapse).
- **`useXP` is the structural precedent for `useUnlocks`** — `hooks/use-xp.ts:31-56`: attach the event listener **synchronously**, defer only the initial read to `requestAnimationFrame`, mounted-gate the returned value. Copy this shape (the rAF mount-gate-drops-sync-emits bug from Story 2.5 was fixed exactly this way — do not gate the listener behind the rAF).
- **`ThemeHotkey` pattern** — `components/theme-provider.tsx:27-56`: `keydown` on `window`, early-return on `defaultPrevented`/`repeat`/modifiers/typing-target. Konami mirrors it (plus a buffer + 2s timer).
- **`@/lib/content` barrel** — import `experimental`/`EXPERIMENTAL_ENABLED` from `@/lib/content`, never `lib/data`.

### Konami buffer — get the reset/restart right
- Track integer **progress** (0..10). On each accepted key (after the skip guards) compute `advanceKonami(progress, key)`.
- **Wrong key:** reset to `0` — **except** when the wrong key is `ArrowUp` (the sequence's first key), reset to `1` so a fresh `↑↑…` start isn't dropped. (Classic Konami edge — covered by a property/unit test.)
- **2s window:** keep a `timerRef`; on every accepted advance, `clearTimeout` then `setTimeout(() => { progressRef.current = 0 }, 2000)`. Clear on unmount.
- **Case-insensitivity** applies to letters only; arrows compare on the lowercased `event.key` (`"arrowup"` etc.) which is already case-stable.
- Keep `advanceKonami`/`isKonamiComplete` **pure** in `lib/keyboard.ts` (no refs/DOM) so `fast-check` can fuzz them (project-context §Testing: "Konami buffer" is a named property-test target; UX §915).

### Reduced motion (FR-082 / UX §743) — JS gate, no CSS
There is **no** `@media (prefers-reduced-motion)` rule in `app/globals.css`; every animation is JS-gated via `useShouldAnimate()` (Story 5.3 confirmed this and used `!animate-none`; Stories 2.5/3.x gate `framer-motion`). `ChromePulse` returns `null` when `useShouldAnimate()` is `false` — the pulse simply does not render. The XP grant + unlock persistence + REPL/palette reveal are **unconditional** (they are not animations). Do **not** add a `tailwind.config.*` or touch `globals.css`.

### Doc-vs-code discrepancies to surface (do not silently resolve)
1. **XPToast copy.** UX §743 wants the unlock toast to read **"+20 unlocked experimental"**, but the shipped `components/xp-toast.tsx` `formatReason` maps an unprefixed reason (`"konami"`) to literally `"konami"` → the toast would show **"+20 konami"**. Changing `formatReason` is a shared-component change affecting all toasts. **Recommended:** add a small `reason === "konami"` special-case in `formatReason` to emit `"unlocked experimental"` (one line, no behavior change for other reasons). **Flag to Hossam — Questions #3.** (AC only mandates the `emitXP(20,"konami")` call; treat the copy as the open item.)
2. **XPToast under reduced motion.** UX §743 says "Reduced motion → no pulse, **toast stays**," but `xp-toast.tsx:23` returns `null` under reduced motion (Story 2.5 behavior — "Reduced-motion ALSO hides XP toasts and bar fill; XP still increments silently," per project-context). So under reduced motion the toast does **not** stay. This is **existing global XP-toast behavior**, out of scope to change here. Flagged, not changed.
3. **`hm_xp_granted` storage.** `architecture.md:185,277` says per-session granted reasons live in **`sessionStorage`**; the shipped `lib/xp/bus.ts:8,43` uses **`localStorage`** (so grants dedupe once-ever, not per-session). This story just calls `emitXP` and inherits whatever the bus does — no change. Noted for the record.

### FR-083 — deferred to Epic 6 (surfaced, not dropped)
FR-083's Recruiter-Mode footer "🎮 Show experimental" button gives keyboard/discovery parity for the unlock. It belongs on the `/recruiter` **editorial layout** (Story 6.1) — which is currently a stub. Building it now would require inventing that layout. **Locked for 5.4:** ship the keyboard sequence + the shared `addUnlock("konami")` writer; Story 6.1 adds a footer `<Button variant="outline">` that calls `addUnlock("konami")` (one line, same source of truth). Mirrors how Story 5.3 deferred the Recruiter-Mode toggle to 6.2. (Questions #4.)

### OQ3 — `experimental` must be real (the share moment)
PRD A12/OQ3 + UX §522 are explicit: the `experimental` reveal is the peak P3 "desire-to-share" beat (`UJ-3`), and **a placeholder breaks it**. The architecture restates: "`experimental` command content (OQ3 — **must be real at launch, not placeholder**)" (`architecture.md:527`). So this story does **not** author fake copy. The `lib/content/experimental.ts` seam + `EXPERIMENTAL_ENABLED` gate let the feature **ship disabled** (inert, no placeholder) until Hossam supplies content. **Questions #1 is the blocker** — get the real content or an explicit "ship disabled for v1."

### Mount placement & perf
- **Root layout** (`app/layout.tsx`) per AC + `architecture.md:197,379,462` (root owns truly-global concerns: theme, fonts, toaster, **Konami listener**, global hotkeys — they must exist on `/recruiter` too). The listener is headless (no layout cost); `ChromePulse` renders nothing until a sequence completes.
- One `window` keydown listener; integer progress + one timer ref. Negligible. No `dynamic()` needed.
- React 19 Strict Mode double-fires effects in dev → the keydown effect cleans up (`removeEventListener` + `clearTimeout`), so double-mount is idempotent. `addUnlock`/`emitXP` are idempotent regardless.

### Content shapes / files in play
- `lib/content/experimental.ts` (NEW) — real "what I'm building next" content + `EXPERIMENTAL_ENABLED`. Zod-validated, barrel-exported (project-context: Zod is source of truth; `z.infer` types; import from `@/lib/content`).
- `lib/repl/commands.ts` — `CommandEntry` gains `locked?`; `experimental` entry; `runCommand(raw, unlocks=[])`; `help`/`suggest` filter locked commands. Existing `ReplResult`/`ReplEffect`/`levenshtein` unchanged.
- `components/command-palette.tsx` — the Story 5.3 Actions group left an explicit append seam (its AC 10 / Dev Notes); add the conditional `Experimental` item only.
- Resume PDF (`public/hossam-marey-resume.pdf`) + `/recruiter` stub + `/console` route all exist already.

### Architecture / project-context guardrails (must follow)
- **RSC by default; new components are client islands** (`"use client"`: hooks/events/animation). **Named exports** (`KonamiListener`, `ChromePulse`, `useUnlocks`); `page.tsx`/`layout.tsx` stay default-export.
- **TS strict / `isolatedModules`** — `import type` for type-only imports; no `import React`; no `as any`/non-null `!` without a WHY comment.
- **`@/*` = project root.** kebab-case component/hook files; `lib/unlocks/bus.ts` mirrors `lib/xp/bus.ts`.
- **Import order:** external → `@/lib`/`@/components`/`@/hooks` → relative → side-effects; blank line between groups, alpha within.
- **RTL:** logical properties only (the pulse is `inset-0`, fine; any spacing uses `ms-`/`me-`/`gap-*`). **Tokens:** semantic only (`bg-lime`/`ring-lime`/`text-foreground`), never hex/oklch. **Comments:** WHY-only (the Konami restart edge and the reduced-motion gate are legitimate WHYs).
- **Accessibility:** pulse `aria-hidden` + `pointer-events-none`, no focus traps, no new focusable nodes; keyboard parity for the unlock deferred to FR-083 (Epic 6).
- **No new dependency, no state lib, no router/i18n lib, no `tailwind.config.*`, no `globals.css` edit.**

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router** — `useRouter().push` from `next/navigation`; root `app/layout.tsx` is a Server Component, `<KonamiListener />` is a client island inside it (allowed).
- **React 19.2.4** — refs are props; Strict-Mode double-effects → clean up listeners/timers (idempotent).
- **framer-motion 12.40.0** — import from `framer-motion` (NOT `motion/react`); `useReducedMotion` is wrapped by `useShouldAnimate`; one-shot via `animate` + `onAnimationComplete`. Animate `opacity`/`transform` only.
- **sonner 2.0.7** — XP toast is existing infra; no new toast added here (unless Questions #3 special-cases the copy).
- **Zod 4.4.3** — schema for experimental content; `z.infer` the type.

### Testing standards (project-context §Testing)
- Vitest `globals: true` (don't import `describe`/`it`/`expect`), `jsdom`, setup `tests/setup.ts`. **Colocate** new `*.test.ts(x)` next to source.
- **`fast-check`** for the Konami buffer reducer (named property-test target) and any unlock-dedupe helper. Pure functions in `lib/` get real unit tests; components mock **boundaries only** (`@/lib/unlocks/bus`, `@/lib/xp/bus`, `@/hooks/use-should-animate`, `@/hooks/use-unlocks`, `next/navigation`).
- **`fireEvent.keyDown(window, { key })`** for the sequence (user-event doesn't model raw key sequences cleanly; project-context allows `fireEvent` for keyboard cases it can't model). **`vi.useFakeTimers()`** for the 2s window; `vi.useRealTimers()` in `afterEach`. `afterEach` clears `localStorage`.
- Query by role/label/text; **no** snapshot tests, **no** asserting Tailwind classes / framer-motion internals / `dynamic()`.

### Edge cases to handle
- **Sequence typed inside the REPL/contact input** → `isTypingTarget` skip; buffer never advances.
- **Modifier held / key repeat** → skip (mirror `ThemeHotkey`).
- **>2s between keys** → buffer resets to empty.
- **Wrong key mid-sequence** → reset (to `1` if the wrong key is `ArrowUp`, else `0`).
- **`localStorage` disabled / quota** → `addUnlock` degrades to in-memory; no crash; user re-Konamis next visit (accepted).
- **Reduced motion** → no pulse; XP + unlock + reveal still happen.
- **Already unlocked (reload / second sequence)** → `addUnlock` is a no-op (no duplicate, no event); `emitXP` no-ops (already granted). Pulse may still fire on a repeat sequence — acceptable (it's a one-shot visual; or guard on `!hasUnlock("konami")` if you prefer no repeat flash — minor, dev's call).
- **Content empty (`EXPERIMENTAL_ENABLED` false)** → entire unlock inert (listener no-ops, palette entry absent, `experimental` → `command not found`).
- **StrictMode double-mount (dev)** → listeners/timers clean up; no duplicate handlers.
- **`/recruiter`** → listener still mounted (root) in v1; recruiter-mode unmount is Epic 6.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `lib/keyboard.ts` | **UPDATE** | Add `KONAMI_KEYS`, `normalizeKonamiKey`, pure `advanceKonami`/`isKonamiComplete`. Keep `isTypingTarget` untouched. |
| `lib/unlocks/bus.ts` | **NEW** | `UNLOCK_EVENT`/`UNLOCKS_KEY`, `readUnlocks`/`hasUnlock`/`addUnlock` (idempotent + dispatch event). Mirror `lib/xp/bus.ts`. |
| `hooks/use-unlocks.ts` | **NEW** | `useUnlocks` — sync listener + rAF-deferred read + mounted-gate (mirror `use-xp.ts`). Returns `{ unlocks, isUnlocked }`. |
| `lib/content/experimental.ts` | **NEW** | Real experimental content (Zod) + `EXPERIMENTAL_ENABLED`. Author content (Questions #1) or ship empty/disabled. |
| `lib/content/index.ts` | **UPDATE** | Re-export `experimental` + `EXPERIMENTAL_ENABLED`. |
| `lib/repl/commands.ts` | **UPDATE** | `locked?` on `CommandEntry`; `experimental` entry; `runCommand(raw, unlocks=[])`; filter locked from `help`/`suggest`. |
| `components/chrome-pulse.tsx` | **NEW** | Controlled one-shot lime pulse; `null` under reduced motion / inactive; `aria-hidden` + `pointer-events-none`. |
| `components/konami-listener.tsx` | **NEW** | Global keydown buffer + 2s timer; on complete → `addUnlock`+`emitXP`+pulse (gated on `EXPERIMENTAL_ENABLED`). Renders `<ChromePulse>`. |
| `components/console-repl.tsx` | **UPDATE** | `useUnlocks()` → `runCommand(command, unlocks)`. |
| `components/command-palette.tsx` | **UPDATE** | `useUnlocks()` → conditional `Experimental` Actions item → `push("/console")`. |
| `app/layout.tsx` | **UPDATE** | Replace placeholder comment with `<KonamiListener />`. |
| `lib/keyboard.test.ts` | **UPDATE** | Konami reducer unit + `fast-check` property tests. |
| `lib/unlocks/bus.test.ts` | **NEW** | read/add/dedupe/event/guards. |
| `hooks/use-unlocks.test.ts` | **NEW** | mount-gate, read, live event update. |
| `components/konami-listener.test.tsx` | **NEW** | sequence unlock, skips, resets, timeout, reduced-motion, disabled-content. |
| `lib/repl/commands.test.ts` | **UPDATE** | locked hidden/visible, suggest leak guard, existing green. |
| `components/command-palette.test.tsx` | **UPDATE** | Experimental item gated by `useUnlocks`. |
| `components/console-repl.test.tsx` | **UPDATE** | passes unlocks; `experimental` works unlocked. |
| `lib/xp/bus.ts`, `lib/command-palette/bus.ts`, `components/inspect-me-cta.tsx`, `components/ui/*`, `app/globals.css` | **DO NOT TOUCH** | Reuse / vendored. |

### Previous story intelligence
- **Story 5.3** (palette, in review) left the explicit append seam for THIS story: its AC 10 says "No Konami 'Experimental' entry … Architect the Actions group so 5.4 can append a conditional entry without restructuring." Fill it — don't refactor the group. It also established the JS reduced-motion gate (`useShouldAnimate` → no CSS), `useRouter` from `next/navigation`, and boundary-only mocking.
- **Story 5.2** (registry) built `lib/repl/commands.ts` (pure `runCommand`, `levenshtein`/`suggest`, voiced outputs, `+5 repl:command` XP) and the download anchor-click pattern. Extend `runCommand` without breaking its `fast-check`/unit tests (default the new arg).
- **Story 5.1** built the REPL `<input>` (a typing target the Konami buffer must skip).
- **Story 2.5** is the XP-bus precedent **and** the source of the `useUnlocks` shape: the "rAF mount-gate drops sync emits" bug (memory `feedback_raf_mount_gate_drops_sync_emits`) was fixed by attaching the listener synchronously and only deferring the initial `setState`. `useUnlocks` MUST follow `use-xp.ts` exactly for the same reason.
- **Standing rule (all stories):** surface doc-vs-code conflicts; don't silently resolve. Applied here to the XPToast copy/reduced-motion behavior, the `hm_xp_granted` storage location, FR-083 deferral, and OQ3 content.

### Git intelligence (recent commits)
`6e4ee64 feat(console): ⌘K command palette with four groups (story 5.3)`, `b59762f feat(console): command registry with voiced outputs (story 5.2)`, `ab0bfcb feat(console): REPL shell with command history (story 5.1)`. Pattern: **Conventional Commits, one story per commit, `console` scope for Epic 5**, client island + colocated tests + minimal wiring. Match it: `feat(console): konami unlock with chrome pulse (story 5.4)`.

### Project Structure Notes
- `components/konami-listener.tsx`, `hooks/use-unlocks.ts`, `lib/unlocks/…` are the architecture-named homes (`architecture.md:419,426,485` — F10 → `components/konami-listener.tsx`, `hooks/use-unlocks.ts` (`hm_unlocks_v1`), `lib/keyboard.ts`). `components/chrome-pulse.tsx` matches the UX component inventory (§708, §743). Fully aligned with the unified structure — no new dependency, no state lib, no `tailwind.config.*`.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:649-667] — Story 5.4 AC: global `<KonamiListener>` in root layout using `isTypingTarget`, `↑↑↓↓←→←→BA` (case-insensitive letters, 2s windows, partial/late reset), persist `"konami"` to `hm_unlocks_v1`, 800ms lime pulse (reduced-motion suppressed), `emitXP(20,"konami")` once, `experimental` in REPL `help` + "Experimental" palette Actions entry, real content or ship disabled.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:229-234] — FR-080 (buffer + 2s timeout reset), FR-081 (skip input/textarea/contenteditable, match `ThemeHotkey`), FR-082 (persist `hm_unlocks_v1`, lime glow on chrome, reveal `experimental` in REPL + palette Actions), FR-083 (Recruiter footer "🎮 Show experimental").
- [Source: …/prd.md:185,194-195] — FR-041/FR-042 Konami-locked `experimental`; A12/OQ3 "what I'm building next" panel, content TBD.
- [Source: …/prd.md:306] — NFR-O4 `localStorage` versioned keys incl. `hm_unlocks_v1`; graceful in-memory degradation.
- [Source: …/prd.md:414,466,527-context] — OQ3 / A12: `experimental` must be real, not placeholder.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:515-523] — Konami detail: global root-layout buffer, skip typing targets, write `hm_unlocks_v1`, one-shot 800ms pulse (reduced-motion respects), add to REPL help + palette Actions, FR-083 footer parity, real-content-or-no-unlock, in-memory degradation.
- [Source: …/ux-design-specification.md:664-668,708,743] — `<KonamiListener>` (headless, root/(chrome) layout; idle/buffering/unlocked) + `<ChromePulse>` unlock-feedback animation; unlock feedback = "Chrome lime-pulse 800ms one-shot + `<XPToast>` '+20 unlocked experimental'; reduced motion → no pulse, toast stays."
- [Source: …/ux-design-specification.md:529,860,915,954,958] — single-hook-per-key (`useUnlocks`), shared typing-target skip helper, `fast-check` Konami buffer property test.
- [Source: _bmad-output/planning-artifacts/architecture.md:197,379,462] — root `app/layout.tsx` mounts `KonamiListener` + global hotkeys (no chrome).
- [Source: architecture.md:243,306] — ONE shared `isTypingTarget` helper for D/Konami/⌘K; every global keydown calls it first.
- [Source: architecture.md:419,426,440,485] — F10 file map: `components/konami-listener.tsx`, `hooks/use-unlocks.ts` (`hm_unlocks_v1`), `lib/repl/commands.ts` (registry incl. `experimental`), `lib/keyboard.ts`.
- [Source: architecture.md:185,277,527] — localStorage mode bus + versioned keys; `experimental` content must be real at launch (OQ3).
- [Source: lib/keyboard.ts:1-12] — `isTypingTarget` (reuse; add Konami matchers alongside).
- [Source: lib/xp/bus.ts:1-73] — `emitXP`/once-ever `hm_xp_granted`; structure to mirror for `lib/unlocks/bus.ts`.
- [Source: hooks/use-xp.ts:31-59] — synchronous-listener + rAF-deferred-read + mounted-gate pattern to mirror in `useUnlocks` (Story 2.5 sync-emit fix).
- [Source: components/theme-provider.tsx:27-56] — `ThemeHotkey` keydown guards (defaultPrevented/repeat/modifiers/typing-target) to mirror in the Konami listener.
- [Source: lib/repl/commands.ts:70-254] — `CommandEntry`/`registry`/`runCommand`/`help`/`suggest` to extend with `locked` + unlock-aware filtering.
- [Source: components/console-repl.tsx:91,105-133] — `runCommand(command)` call site + `+5 repl:command` XP (add unlocks arg).
- [Source: components/command-palette.tsx:158-189] — Actions `<CommandGroup>` append seam for the conditional Experimental item.
- [Source: components/xp-toast.tsx:12-37] — `formatReason` (`"konami"` → `"konami"`; UX wants "unlocked experimental"; reduced-motion returns null) — discrepancies flagged.
- [Source: hooks/use-should-animate.ts:11-13] — reduced-motion gate for the pulse.
- [Source: lib/content/index.ts; lib/content/profile.ts] — barrel pattern + Zod content modules to mirror for `experimental.ts`.
- [Source: app/layout.tsx:36] — `{/* KonamiListener placeholder — Story 2.5 */}` seam to replace.
- [Source: _bmad-output/implementation-artifacts/5-3-command-palette-with-four-groups.md] — palette append seam + JS reduced-motion gate + boundary-mock testing precedent.
- [Source: _bmad-output/project-context.md] — RSC/named exports, `@/*`=root, import order, semantic tokens + logical props (RTL), Zod source-of-truth, no new deps/no state lib/no `tailwind.config.*`, testing rules (role/label queries, `fireEvent` for unmodelled keys, `fast-check` for Konami buffer, mock boundaries only), versioned `localStorage` keys, `prefers-reduced-motion` gates every animation, gamification edge cases (Konami via keydown buffer w/ timeout, skip typing targets).

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

### Completion Notes List

- Implemented Konami sequence detection (↑↑↓↓←→←→BA) with 2s timeout, case-insensitive letters, and proper restart behavior (wrong key matching first key restarts at 1, not 0).
- Created unlock bus (`lib/unlocks/bus.ts`) mirroring XP bus pattern with idempotent `addUnlock`, `hm_unlocks_v1` persistence, and `hm:unlock` CustomEvent.
- Created `useUnlocks` hook mirroring `useXP` with synchronous event listener + rAF-deferred read + mounted-gate.
- Added `experimental` REPL command (locked) gated on `EXPERIMENTAL_ENABLED` — ships disabled with empty content.
- Added conditional "Experimental" palette entry in Actions group.
- Implemented ChromePulse one-shot 800ms lime glow animation, suppressed under `prefers-reduced-motion`.
- All 243 tests pass (including 16 new tests across 5 test files).
- `yarn typecheck`, `yarn lint`, `yarn test:run`, `yarn format`, `yarn build` all green.
- **Shipped disabled** — `lib/content/experimental.ts` has empty content; unlock is inert until real content is provided.

### File List

- `lib/keyboard.ts` — added `KONAMI_KEYS`, `normalizeKonamiKey`, `advanceKonami`, `isKonamiComplete`
- `lib/keyboard.test.ts` — added Konami reducer unit + fast-check property tests
- `lib/unlocks/bus.ts` — NEW: unlock persistence bus
- `lib/unlocks/bus.test.ts` — NEW: unlock bus tests
- `hooks/use-unlocks.ts` — NEW: unlocks hook
- `hooks/use-unlocks.test.ts` — NEW: unlocks hook tests
- `lib/content/experimental.ts` — NEW: experimental content (empty, ship-disabled)
- `lib/content/index.ts` — UPDATE: barrel export for experimental
- `lib/repl/commands.ts` — UPDATE: added `locked?` to `CommandEntry`, `experimental` command, unlock-aware `runCommand`
- `lib/repl/commands.test.ts` — UPDATE: added locked/unlocked tests for experimental
- `components/chrome-pulse.tsx` — NEW: one-shot lime pulse animation
- `components/konami-listener.tsx` — NEW: global Konami keydown listener
- `components/konami-listener.test.tsx` — NEW: Konami listener tests
- `components/console-repl.tsx` — UPDATE: wired `useUnlocks`, passes unlocks to `runCommand`
- `components/console-repl.test.tsx` — UPDATE: added unlocks integration test
- `components/command-palette.tsx` — UPDATE: conditional Experimental Actions item
- `components/command-palette.test.tsx` — UPDATE: added Experimental item tests
- `app/layout.tsx` — UPDATE: mounted `<KonamiListener />

## Questions for Hossam
1. **OQ3 — `experimental` content (BLOCKING).** The unlock must reveal **real** content (a project/idea you're exploring) — placeholder is explicitly unacceptable (PRD A12/OQ3, UX §522). Please provide the copy for `lib/content/experimental.ts` (a short "what I'm building next" — title + a few lines). If you'd rather not surface it for v1, confirm **ship-disabled** (the unlock stays inert, no placeholder) and we enable it in a later pass.
2. **Palette "Experimental" action behavior.** Selecting the palette entry currently routes to `/console` (where `experimental` lives). Want that, or should it open a dedicated panel/route instead (would add scope)?
3. **XP toast copy.** UX §743 wants the unlock toast to read **"+20 unlocked experimental"**, but the shipped `xp-toast.tsx` would render **"+20 konami"** for reason `"konami"`. OK to add a one-line `"konami"` special-case in `formatReason` to match the spec? (Separately: under reduced motion the XP toast is hidden by existing Story-2.5 behavior, whereas UX §743 says "toast stays" — leave as-is, or revisit globally?)
4. **FR-083 parity button deferred.** The Recruiter-Mode footer "🎮 Show experimental" button (keyboard/discovery parity) is deferred to **Story 6.1** (the `/recruiter` editorial layout, currently a stub); it'll call the same `addUnlock("konami")`. OK to defer?
