# Story 5.1: Console REPL shell with history

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a curious peer,
I want a real terminal input with command history,
so that the Console tab feels like an actual shell, not a fake terminal.

## Acceptance Criteria

1. **(FR-040 — real input, not a fake terminal)** `/console` renders a terminal-style REPL backed by a **real `<input>`** (`aria-label="Console input"`) — never a `contenteditable` div and never a fake blinking-caret `<div>` that breaks text selection. The browser's native input caret is the only caret. The input is part of a real `<form>` (or has an `onKeyDown` Enter handler) so Enter submits.

2. **(FR-040 / UJ-3 — auto-focus on mount)** When the `ConsoleREPL` client island mounts, the input **auto-focuses** (visible cursor in the input, ready to type) without scrolling the page. Auto-focus is a client-only post-mount effect (`useEffect` + a ref) — never an SSR/render-time focus call.

3. **(FR-040 + NFR-A4 — semantic, accessible transcript)** Submitting a non-empty command echoes a prompt line into a scrollable **output/transcript region** that has `aria-live="polite"` so screen readers announce new lines. The echoed line shows a prompt sigil (e.g. `$`/`>`) + the entered text, in `font-mono`. The page keeps exactly **one `<h1>`** (the existing "Console" heading) — the transcript region is not a heading.

4. **(FR-040 — history buffer with ↑/↓)** Pressing **↑** in the input walks backward through previously-submitted commands (most-recent first); **↓** walks forward toward the current/empty line. The history cursor is bounded (↑ at the oldest entry stays on the oldest; ↓ past the newest returns to the empty draft line). Submitting a command appends it to the history buffer and resets the history cursor to the draft position. Empty/whitespace-only submissions are ignored (not echoed, not added to history).

5. **(FR-044 — multiline paste: first line only + notice)** Pasting a multiline string into the input **executes only the first line**; the remaining lines are ignored and an **inline notice** is shown in the transcript (DevTools voice, e.g. `note: pasted N additional line(s) ignored — one command per line`). A single-line paste behaves like normal typing (no notice). The input value after a multiline paste must not contain newline characters.

6. **(NFR-R3 — mobile usable with on-screen history buttons)** On mobile (`<sm` / touch), focusing the input brings up the touch keyboard, and **on-screen ↑/↓ history buttons** appear under the input so history is reachable without a physical arrow key. The buttons are real `<button>` elements with `aria-label`s (e.g. "Previous command" / "Next command"), drive the **same** history-walk logic as the ↑/↓ keys (no duplicated state), and are hidden/irrelevant on desktop pointer layouts per the design-system breakpoint convention.

7. **(NFR-P6 — code-split route)** `/console` loads the REPL via `dynamic(() => import("@/components/console-repl").then((m) => m.ConsoleREPL))` from the RSC `page.tsx`, with a `loading:` skeleton — mirroring the established `NetworkRequestDetail` pattern in `app/(chrome)/work/[slug]/page.tsx`. **No `{ ssr: false }`** (illegal/unnecessary from an RSC). `page.tsx` stays a Server Component and keeps its `export const metadata`.

8. **(Scope seam — shell only, NOT the registry)** This story delivers the **shell + history I/O loop only**. It does **NOT** implement the command registry, voiced outputs, `command not found` / `did you mean`, or the `+5` XP grant — those are **Story 5.2** (`lib/repl/commands.ts`, FR-041/042/043). Submitting a command in 5.1 echoes the input line and records history; it produces **no command response and no XP**. Provide a single, clearly-marked execution seam (a `runCommand`-shaped call site returning "no output" for now) so 5.2 can plug in the registry and response rendering **without restructuring** the shell. Do not pre-empt 5.2's `command not found` wording with a placeholder error.

9. **(Reduced motion / no gratuitous animation)** No blinking-caret animation and no scroll/transition animation is introduced that isn't gated. If any transition is added (e.g. transcript fade), it must route through the existing `useShouldAnimate()` helper. The native input caret is not an animation and needs no gating.

10. **(Regression — chrome + tabs intact)** `/console` remains inside the `(chrome)` route group: the persistent DevTools chrome (identity strip, tab nav, XP bar) renders unchanged, the Console tab shows active, tab-switching to/from `/console` still works without full reload, the `D` theme hotkey still toggles, and the existing `visit:console` tab-visit XP grant (Story 2.5, fired by `app/(chrome)/layout.tsx`) is untouched. No console errors/warnings on mount, submit, history-walk, paste, theme toggle, or RTL flip.

11. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds and `/console` is statically rendered (shell hydrates client-side). Live verification (Task 5) confirms auto-focus, echo, ↑/↓ history, multiline-paste notice, and mobile history buttons.

## Tasks / Subtasks

- [x] **Task 1 — Build the REPL shell client component (AC: 1, 2, 3, 4, 5, 9)**
  - [x] Create `components/console-repl.tsx` — **`"use client"`**, **named export** `ConsoleREPL`. No props required (self-contained shell).
  - [x] State: a `transcript` array of line entries and a `history` array of submitted command strings, plus a `historyIndex` cursor and the controlled `input` draft value. Use a small local type, e.g. `type ConsoleLine = { id: number; kind: "input" | "notice"; text: string }`. (Keep the model minimal but leave room for a `kind: "output"` that 5.2 will add — do not add command-output rendering now.)
  - [x] Render: a scrollable transcript region (`role`/`aria-live="polite"`, `font-mono text-sm`, tokenized colors — `text-foreground` / `text-muted-foreground`, never hex) above a real `<input aria-label="Console input">` inside a `<form>` (or input with `onKeyDown` Enter). Prompt sigil before the input (e.g. `$`) using `text-lime` or `text-muted-foreground` per design-system.
  - [x] Auto-focus: `const inputRef = useRef<HTMLInputElement>(null)`; in a `useEffect(() => { inputRef.current?.focus({ preventScroll: true }) }, [])`. Client-only, post-mount.
  - [x] Submit handler: trim input; if empty → ignore. Else push an `input` line to transcript (prompt echo), push the raw command to `history`, reset `historyIndex` to the draft position, clear the input, and **call the execution seam** (see Task 2). Auto-scroll the transcript to the bottom after a new line (ref + `scrollTop = scrollHeight`, or `scrollIntoView` on a sentinel) — no animation required.
  - [x] History walk: `onKeyDown` — `ArrowUp` moves the cursor toward older entries and sets the input to that command; `ArrowDown` moves toward newer/draft. Clamp at both ends (oldest stays oldest; past-newest returns the saved draft / empty). `preventDefault()` on ↑/↓ so the caret doesn't jump. Factor the walk into a `stepHistory(direction: "prev" | "next")` function reused by the mobile buttons (Task 3).
  - [x] Multiline paste: add an `onPaste` handler — read `e.clipboardData.getData("text")`, split on `/\r?\n/`; if >1 line, `preventDefault()`, set the input to the **first** line only, and push a `notice` line to the transcript (e.g. `note: pasted ${rest} additional line(s) ignored — one command per line`). Single-line paste → let default paste happen (no notice). Ensure the resulting input value never contains a newline.
  - [x] Do **not** implement: command resolution, `help`/`whoami`/etc., `command not found`, `did you mean`, or `emitXP`. Those are Story 5.2.

- [x] **Task 2 — Define the 5.2 execution seam (AC: 8)**
  - [x] In the submit handler, route the trimmed command through a single, clearly-named call site, e.g. `const output = runCommand(command)` where `runCommand` is a local stub in this file that **returns no output** for now (e.g. `(_command: string): ConsoleLine[] => []`). Append whatever it returns to the transcript (currently nothing).
  - [x] Add a brief WHY comment marking this as the Story 5.2 registry seam (this is a legitimate "why", not narration) so the next dev knows exactly where `lib/repl/commands.ts` plugs in and that XP (`emitXP(5, "repl:command")`) is wired there — not here.
  - [x] Do **not** create `lib/repl/commands.ts` in this story (it belongs to 5.2). Keep the seam's shape stable so 5.2 only swaps the stub for the real registry call.

- [x] **Task 3 — Mobile on-screen history buttons (AC: 6)**
  - [x] Below the input, render two real `<button type="button">` controls with `aria-label="Previous command"` and `aria-label="Next command"` that call `stepHistory("prev")` / `stepHistory("next")` (same logic as ↑/↓). After pressing, return focus to the input so the user can edit/submit.
  - [x] Show them only on mobile per the design-system breakpoint convention (e.g. `sm:hidden`, or a touch/pointer-coarse treatment) — desktop relies on physical ↑/↓. Use lucide-react `ArrowUp`/`ArrowDown` icons or text; keep them keyboard-focusable and within the hairline/mono visual language.
  - [x] Verify the buttons and the keyboard arrows share one history cursor (no second `historyIndex`).

- [x] **Task 4 — Wire the code-split route (AC: 7, 10)**
  - [x] Update `app/(chrome)/console/page.tsx` (currently a stub): keep it an **RSC** with `export const metadata` (title unchanged: `"Console — devtools://hossam"`). Replace the stub paragraph.
  - [x] `const ConsoleREPL = dynamic(() => import("@/components/console-repl").then((m) => m.ConsoleREPL), { loading: () => <…skeleton…> })` — mirror the `NetworkRequestDetail` block (`app/(chrome)/work/[slug]/page.tsx:12-26`), including a tokenized `animate-pulse` skeleton. No `{ ssr: false }`.
  - [x] Page body: `<section className="flex h-full flex-col p-4">` with the single `<h1 className="font-mono text-lg">Console</h1>` (match `sources/page.tsx` shape) followed by `<ConsoleREPL />`. The Console panel sizing should respect the mobile `h-[65vh]` design-system note where applicable — match how `sources/page.tsx` handles full-height (`flex h-full flex-col`).
  - [x] Do not add `"use client"` to `page.tsx`. Do not touch `app/(chrome)/layout.tsx` (the `visit:console` grant + chrome live there and must stay untouched).

- [x] **Task 5 — Live verification (AC: 2, 3, 4, 5, 6, 10)**
  - [x] `yarn dev` → open `/console`. Confirm the input **auto-focuses** (cursor blinking, no page jump). Type `hello` + Enter → the line echoes as `$ hello` in the transcript; input clears.
  - [x] Submit 3 commands; press **↑** three times (walks oldest-ward), **↓** back to the draft. Confirm clamping at both ends and that the caret doesn't jump to line start.
  - [x] Paste a multiline string (copy 3 lines) → only the first line lands in the input and a `note: pasted 2 additional line(s) ignored` line appears. Single-line paste → no notice.
  - [x] Resize to mobile (`<640px`) → focus the input (touch keyboard appears), confirm on-screen ↑/↓ buttons appear and walk history; confirm they're absent on desktop width.
  - [x] Confirm: no console errors/warnings; `D` theme hotkey still toggles; Console tab shows active and tab-switching has no full reload; RTL (`<html dir="rtl">`) doesn't break layout. Confirm the XP bar still shows the `visit:console` grant behavior from 2.5 (this story adds no XP).

- [x] **Task 6 — Tests (AC: 1, 2, 3, 4, 5)**
  - [x] `components/console-repl.test.tsx` (**NEW**), Vitest + Testing Library, `userEvent.setup()`:
    - [x] Auto-focus: after render, the `Console input` has focus (`getByRole("textbox", { name: /console input/i })` / `toHaveFocus()`).
    - [x] Submit echoes + clears: type a command + `{Enter}` → transcript shows the echoed line; input is empty; empty/whitespace submit is a no-op (no new line).
    - [x] History: submit two commands, press `{ArrowUp}` → input shows the latest; `{ArrowUp}` again → the earlier; `{ArrowDown}` walks back; clamping holds at both ends.
    - [x] Multiline paste: use `userEvent.paste("a\nb\nc")` (after focusing the input) → input value is `a` (no newline) and a notice line referencing ignored lines appears; `userEvent.paste("single")` → no notice.
    - [x] Mobile buttons drive the same walk: query the `Previous command` / `Next command` buttons, click them, assert the input reflects the same history steps as the arrow keys.
    - [x] aria: transcript region has `aria-live="polite"`; input is a real `<input>` with the expected `aria-label` (assert it's an `INPUT`, not contenteditable).
  - [x] **Do NOT** test: command outputs / registry (none yet — Story 5.2), XP (none — 5.2), Tailwind class strings, framer-motion, or Next.js dynamic-import framework behavior. Keep tests behavioral (role/label/text), not implementation-coupled.

- [x] **Task 7 — Gate (AC: 11)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds with `/console` rendered.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the **Console REPL shell** — a real `<input>`, an `aria-live` transcript that echoes submitted commands, a ↑/↓-navigable history buffer, first-line-only multiline paste with a notice, on-screen mobile history buttons, and the route code-split via `dynamic()`. It establishes the **I/O loop and the seam** that Story 5.2 fills.
- **IS NOT:**
  - **The command registry / voiced outputs** — `lib/repl/commands.ts`, `help`/`whoami`/`projects`/`contact`/`theme`/`clear`/`download resume`/`experimental`, `command not found`, `did you mean` are **Story 5.2** (FR-041, FR-042). Do not build them; do not create `lib/repl/commands.ts`.
  - **REPL XP (+5)** — `emitXP(5, "repl:command")` (FR-043) is **Story 5.2**. No XP emit in 5.1.
  - **The ⌘K command palette** (Story 5.3) or **Konami `experimental`** (Story 5.4) — separate stories.
  - **The contact form / `/sources` navigation** — the `contact` command's behavior is 5.2.

### The 5.1 / 5.2 boundary — the one thing to get right
5.1 owns the **shell**; 5.2 owns the **registry + responses + XP**. Concretely:
- 5.1's submit handler: trim → echo input line → push history → clear input → call `runCommand(command)` (a local stub returning `[]`) → append its (currently empty) result to the transcript.
- 5.2 replaces the `runCommand` stub with a call into `lib/repl/commands.ts`, returns response lines (including `command not found` + `did you mean`), and fires `emitXP(5, "repl:command")` on success.
- **Therefore:** do NOT make 5.1 print any error for unknown commands — an unknown command in 5.1 simply echoes with no response. Printing a placeholder error now would force 5.2 to rip it out and risks contradicting the exact FR-041 wording (`command not found: <name>. Type 'help' for available commands.`). Keep the seam's signature stable (`(command: string) => ConsoleLine[]`) so 5.2 is a drop-in.

### Reuse — do NOT reinvent
- **`dynamic()` code-split pattern** — copy the shape from `app/(chrome)/work/[slug]/page.tsx:12-26` (`dynamic(() => import(...).then((m) => m.X), { loading: () => <skeleton/> })`, no `ssr:false`). Don't invent a new lazy-loading mechanism.
- **Page shell shape** — mirror `app/(chrome)/sources/page.tsx`: RSC, `export const metadata`, `<section className="flex h-full flex-col p-4">`, single `<h1 className="font-mono text-lg">`, then the dynamic client island. The Sources page is the closest precedent (RSC page → client panel island).
- **`useShouldAnimate()`** (`@/hooks`) — the single reduced-motion source of truth (`hooks/use-should-animate.ts`). Only needed if you add any transition; the native caret needs none.
- **`cn()`** from `@/lib/utils` for conditional classes (Prettier sorts inside `cn`).
- **Design-system tokens** — `font-mono`, `text-foreground`/`text-muted-foreground`, `text-lime` for the prompt sigil, `border-hairline`/`bg-surface` for any cell framing. Never hardcode hex/oklch. (design-system §Typography table: console = IBM Plex Mono / `font-mono text-sm`.)
- **lucide-react** `ArrowUp`/`ArrowDown` for the mobile buttons (already a dependency) — no new icon pack.

### Accessibility (NFR-A4 / NFR-A2) — non-negotiable
- **Real `<input>`, never contenteditable**, never a fake caret div (UX spec §"The REPL is a real `<input>`": users must be able to paste, copy-out, screen-read, and use touch keyboards; "no fake blinking cursor div that breaks selection").
- `aria-label="Console input"` on the input (epic AC + design-system §A11y: "aria-label on … console input").
- Transcript region `aria-live="polite"` so new lines are announced.
- Single `<h1>` per route (NFR-A4) — the existing "Console" heading; the transcript is not a heading.
- Mobile history buttons are real `<button>` with `aria-label`s (NFR-A4: `<button>` not `<div onClick>`). Visible focus ring (`focus-visible:ring-1 focus-visible:ring-ring`) on input and buttons.
- Full keyboard operability: type, Enter to submit, ↑/↓ to walk history — all without a mouse.

### Architecture / project-context guardrails (must follow)
- **RSC by default; push `"use client"` deep.** `console/page.tsx` stays an RSC (keeps `metadata`); only `console-repl.tsx` is `"use client"`. **Named export** for the component (`page.tsx` keeps its default export — Next requirement).
- **No new dependencies, no state library.** History/transcript are local `useState`/`useRef` — do not reach for Redux/Zustand/Context. No router/i18n libs.
- **Path alias `@/*` = project root.** `import type` for type-only imports (`isolatedModules: true`). **No `import React`** (jsx runtime). Named exports only.
- **Import order:** external → internal aliases (`@/lib`, `@/components`, `@/hooks`) → relative → side-effects; blank line between groups, alpha within.
- **Tailwind v4 / shadcn:** semantic tokens only; logical properties (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`) for RTL — the prompt sigil and mobile buttons must flip correctly under `dir="rtl"`. No `tailwind.config.*`.
- **Comments:** default none; WHY-only. The `runCommand` seam comment is an allowed WHY.

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router.** `dynamic()` from `next/dynamic`; in an RSC do **not** pass `{ ssr: false }` (illegal). The client island hydrates and runs its mount effects (auto-focus) client-side. `/console` still statically renders the shell; the REPL chunk is split out (NFR-P6).
- **React 19.2.4.** Refs are plain props (no `forwardRef`). Strict Mode fires effects twice in dev — auto-focus is idempotent (focusing an already-focused input is a no-op), so no guard needed. Prefer `useActionState`/`useFormStatus` only if you genuinely need form transition state; a plain controlled input + `onKeyDown`/`onSubmit` is simpler here and sufficient.
- **framer-motion 12.40.0** — import from `framer-motion` (NOT `motion/react`; the `motion` pkg isn't installed — project-context anti-pattern). Likely unused in 5.1; if used, gate via `useShouldAnimate()`.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true` (don't import `describe`/`it`/`expect`), `jsdom`, setup at `tests/setup.ts`. Colocate `console-repl.test.tsx` next to source.
- `userEvent.setup()` (not `fireEvent`) for typing, Enter, paste (`userEvent.paste`), and button clicks. Query by role/label/text (`getByRole("textbox", { name: /console input/i })`), avoid `getByTestId`.
- Don't test framework/dynamic-import behavior, Tailwind class strings, or framer-motion. Test the observable shell behavior only. No snapshot tests.

### Edge cases to handle
- **Empty / whitespace-only submit** → ignored (no echo, no history entry).
- **↑ at oldest / ↓ past newest** → clamp (stay at oldest; return to the empty draft). Don't crash on empty history.
- **Multiline paste** → first line only; input value must contain no `\n`; notice counts the ignored lines correctly (`\r\n` and `\n`).
- **Auto-focus must not scroll** the page (`focus({ preventScroll: true })`).
- **RTL** — prompt sigil and mobile buttons use logical properties so they flip.
- **Transcript growth** — auto-scroll to newest line on submit; keep it a plain scroll (no animation) unless gated.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/console-repl.tsx` | **NEW** | `"use client"`, named export `ConsoleREPL`. Real `<input aria-label="Console input">`, `aria-live` transcript, ↑/↓ history (+ `stepHistory`), first-line-only multiline paste + notice, mobile ↑/↓ buttons, auto-focus, `runCommand` stub seam (returns `[]`). |
| `app/(chrome)/console/page.tsx` | **UPDATE** | RSC; keep `metadata`. Replace stub with `dynamic()` import of `ConsoleREPL` + loading skeleton; `<section className="flex h-full flex-col p-4">` + single `<h1>Console</h1>`. No `"use client"`, no `{ ssr: false }`. |
| `components/console-repl.test.tsx` | **NEW** | Behavioral tests: auto-focus, echo+clear, ↑/↓ history + clamp, multiline-paste first-line + notice, mobile buttons share walk, aria/real-input assertions. |
| `app/(chrome)/layout.tsx` | **DO NOT TOUCH** | Owns chrome + `visit:console` XP grant (Story 2.5). Read-only context. |
| `lib/repl/commands.ts` | **DO NOT CREATE** | Belongs to Story 5.2 (registry + responses + XP). |

### Previous story intelligence
- **Story 4.5** (immediately prior, done) is the precedent for the "RSC page + small client island, colocated test, mock only the boundary" shape and the project's standing rule: **surface doc-vs-code conflicts, don't silently resolve.** Here the relevant boundary is the 5.1/5.2 split — surfaced explicitly above.
- **Story 4.3/4.4** established the `dynamic()` + `loading:` skeleton pattern you're copying (`work/[slug]/page.tsx`), and that `page.tsx` stays an RSC while interactive bits live in client islands.
- **Story 2.5** built the XP bus + the per-route `visit:*` grant in `app/(chrome)/layout.tsx` (`visit:console` already fires on Console-tab entry). Do not duplicate or disturb it; 5.1 adds no XP. The rAF mount-gate lesson (memory `feedback_raf_mount_gate_drops_sync_emits`) is not directly exercised here since 5.1 emits nothing — but keep it in mind for 5.2.
- **Story 3.5 (Sources)** is the closest structural twin: RSC `page.tsx` → client panel island (`SourcesPanel`) with `flex h-full flex-col p-4` + single `<h1>`. Mirror it.

### Git intelligence (recent commits)
- Recent: `1cf8842 fix(work): …`, `d674606 feat(work): grant project-open XP (story 4.5)`, `7f8eee0 feat(work): …4.4`, `fb9e5f4 …4.3`. Pattern: **Conventional Commits, one story per commit**, scoped to the feature area, RSC page + client island + colocated test. Match it: **`feat(console): REPL shell with command history (story 5.1)`**.

### Project Structure Notes
- `components/console-repl.tsx` is the architecture-named home for F5's shell (`architecture.md:411,480` map F5 to `app/(chrome)/console/page.tsx` + `components/console-repl.tsx` + `lib/repl/commands.ts`; the last is 5.2). Kebab-case filename, named export — consistent with siblings.
- No new hook needed (history is component-local). No new dependency, no `tailwind.config.*`, no state library, no router/i18n change. Fully aligned with the unified structure.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:597-611] — Story 5.1 AC: real `<input>` (`aria-label="Console input"`, not contenteditable), `aria-live="polite"` output, ↑/↓ history, multiline paste executes first line + notice, code-split via `dynamic()`, mobile on-screen ↑/↓ buttons.
- [Source: _bmad-output/planning-artifacts/epics.md:613-631] — Story 5.2 scope (registry, voiced outputs, `command not found`/`did you mean`, `emitXP(5, "repl:command")`) — explicitly NOT in 5.1.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:184-196] — FR-040 (real input + ↑/↓ history), FR-041/042 (registry — 5.2), FR-043 (+5 XP — 5.2), FR-044 (keyboard-accessible; multiline paste first-line + notice).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:270] — NFR-P6 code-split `/console` via `dynamic(() => import(...))`.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:277] — NFR-A4 semantic HTML (one `<h1>`, `<button>` not `<div onClick>`).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:285] — NFR-R3 mobile REPL (touch keyboard on focus; on-screen ↑/↓ buttons under input, mobile only).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:86] — REPL history: ↑/↓ walks; multiline paste executes only first line with inline notice.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:279,514] — REPL is a real `<input>` (paste/copy/screen-read/touch); no fake blinking caret; must auto-focus on `/console` mount.
- [Source: _bmad-output/planning-artifacts/architecture.md:392,411,480] — `/console` REPL (dynamic import); `components/console-repl.tsx`; F5 file map.
- [Source: _bmad-output/planning-artifacts/architecture.md:216] — code-split `/console`, `/work/[slug]`, `/sources` via `dynamic()`.
- [Source: app/(chrome)/work/[slug]/page.tsx:1,12-26] — `dynamic(() => import(...).then((m) => m.X), { loading })` pattern to mirror (no `ssr:false`).
- [Source: app/(chrome)/sources/page.tsx] — RSC page → client panel island shape (`metadata`, `<section className="flex h-full flex-col p-4">`, single `<h1 className="font-mono text-lg">`).
- [Source: app/(chrome)/console/page.tsx] — current stub being replaced (keep `metadata` title `"Console — devtools://hossam"`).
- [Source: hooks/use-should-animate.ts] — reduced-motion single source of truth (only if a transition is added).
- [Source: lib/keyboard.ts] — `isTypingTarget()` (global-hotkey guard; informational — 5.1's ↑/↓ are scoped to the input, not global).
- [Source: docs/design-system.md:57,127,139-147,212,228-230,243] — console = IBM Plex Mono / `font-mono text-sm`; hairline/`bg-surface` cell idiom; mobile console `h-[65vh]`; `aria-label` on console input; `/console` = "Functional REPL with command history".
- [Source: _bmad-output/project-context.md] — RSC-by-default, named exports, `@/*`=root, import order, semantic tokens + logical props (RTL), framer-motion import rule, no state lib, testing rules (role/label queries, `userEvent.setup()`, mock boundaries only).

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Implemented ConsoleREPL client component with real `<input>`, `aria-live` transcript, ↑/↓ history navigation, multiline paste handling (first line only + notice), and mobile history buttons
- Created `runCommand` stub seam for Story 5.2 registry integration with WHY comment
- Wired code-split route via `dynamic()` in RSC page with loading skeleton
- All 9 tests pass covering auto-focus, submit echo, history walk with clamping, multiline paste, mobile buttons, and aria assertions
- Gates green: typecheck ✓, lint ✓, test:run ✓ (152 tests), format ✓, build ✓

### Change Log

- 2026-06-01: Story implementation complete — Console REPL shell with command history, multiline paste, mobile buttons, and Story 5.2 execution seam
- 2026-06-01: Code review — 5 patches applied (ArrowDown no-op at bottom, paste scroll-to-bottom, paste resets history nav, RTL prompt sigil, test update), 1 deferred, gates green

### File List

- `components/console-repl.tsx` (NEW) — Console REPL shell component
- `components/console-repl.test.tsx` (NEW) — Test suite for ConsoleREPL
- `app/(chrome)/console/page.tsx` (UPDATED) — RSC page with dynamic import and skeleton
- `_bmad-output/implementation-artifacts/sprint-status.yaml` (UPDATED) — Story status: in-progress → review

### Review Findings

- [x] [Review][Patch] ArrowDown at bottom no longer destroys unsaved user input [`components/console-repl.tsx:59`]
- [x] [Review][Patch] Multiline paste notice scrolled into view [`components/console-repl.tsx:131`]
- [x] [Review][Patch] Paste while browsing history resets navigation state [`components/console-repl.tsx:123-124`]
- [x] [Review][Patch] RTL prompt sigil uses logical margin (`me-1`) instead of literal space [`components/console-repl.tsx:152`]
- [x] [Review][Patch] Test updated to expect ArrowDown no-op at bottom [`components/console-repl.test.tsx:76-80`]
- [x] [Review][Defer] Paste handler replaces entire input instead of inserting at cursor — deferred, pre-existing (insert-at-cursor behavior is a nice-to-have enhancement for a future iteration)
