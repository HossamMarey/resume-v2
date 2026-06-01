# Story 5.2: Command registry with voiced outputs

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a curious peer,
I want voiced commands with helpful errors,
so that the REPL rewards exploration and feels like Hossam.

## Acceptance Criteria

1. **(FR-041 + FR-042 — the registry & its outputs)** A tiny in-repo command registry resolves and runs these 7 commands, each returning its specified **voiced** output (no JSON-dump tone, no Lorem):
   - `help` → a list of every **available** command with a one-line description each (mono, aligned). Does **not** list `experimental` (Konami-locked — Story 5.4).
   - `whoami` → Hossam's voice, not a printout: name + role + `years`+ location from `Profile`, the `Profile.tagline` as the one-liner, and a short authored story line (see Dev Notes "whoami voice"). Omit the email line because `Profile.email` is currently `""` — never render an empty `email:` field.
   - `projects` → a **numbered** list of all `projects` as `[<method>] <name> (<status>) — <year>`. `projects --shipped` filters to `status === "shipped"`; `projects --tag <x>` filters to projects whose `stack` includes `<x>` (case-insensitive). An empty filter result prints a voiced "no requests match" line, not a crash.
   - `contact` → prints a one-line voiced lead-in, then **navigates to `/sources`** (the boss-level contact form's home; resolved per FR-042 ASSUMPTION "navigate, since the boss-form is the showcase").
   - `theme` → `theme dark` acknowledges (already dark); `theme light` (or any non-dark arg) returns the **deadpan refusal** matching the existing hotkey copy **verbatim**: `Site is dark-only. The vibe is intentional.`; bare `theme` prints current theme + usage.
   - `clear` → clears the transcript/output region; the **history buffer persists** (↑/↓ still walks prior commands after a clear).
   - `download resume` → prints a one-line ASCII "descent" voice line, then triggers a download of `/hossam-marey-resume.pdf` (file exists at `public/hossam-marey-resume.pdf`).

2. **(FR-041 unknown + UX-DR5 — `command not found` + `did you mean`)** An unregistered command prints exactly: `command not found: <x>. Type 'help' for available commands.` When a registered command name is within **Levenshtein distance < 3** of `<x>`, append a second line `did you mean: <suggestion>?` (nearest match; ties broken by registry declaration order). No suggestion line when nothing is within distance 3.

3. **(FR-043 + FR-074 + FR-075 — XP on success)** When a **registered** command runs successfully (status `ok`, including `clear`/`theme`/`download`/`contact`), the component fires `emitXP(5, "repl:command")` **once** through the existing `lib/xp/bus.ts` pipeline. `command not found` does **not** grant. The reason string is the literal `"repl:command"`, so the existing bus dedup grants it once ever and the `[0,100]` cap holds. **Do NOT** modify `emitXP`, the bus, `hm_xp_granted`, or `useXP`, and do **not** add a second XP dedup mechanism. (See Dev Notes "XP granularity — locked decision + surfaced conflict".)

4. **(Parsing — tiny in-repo registry, NFR-P4 / NFR-P6)** Command resolution is a pure, dependency-free parser in `lib/repl/commands.ts` — **no shell-parsing library**, no new dependency. Tokenization is whitespace-split with the two-word command `download resume` and the `projects` flags (`--shipped`, `--tag <x>`) recognized. Resolution is case-insensitive on the command name; unknown flags on a known command produce a voiced usage line, not a crash.

5. **(Pure registry / side-effect seam)** `runCommand(raw)` is **pure** — it returns a structured result `{ lines, status, effect? }` and performs **no** I/O itself (no `window`, `localStorage`, `router`, DOM, or `emitXP` inside the registry). The `ConsoleREPL` component interprets the result: appends `lines` to the transcript, and executes any `effect` (`clear` → reset transcript; `download` → anchor click; `navigate` → router push) and the XP emit. This keeps the registry fast-check-testable in `jsdom` without mocking the world.

6. **(Replaces the 5.1 seam without restructuring the shell)** This story swaps Story 5.1's `runCommand` stub for the real registry call and adds the effect/XP handling block in the submit handler. The 5.1 shell is otherwise **preserved**: real `<input aria-label="Console input">`, `aria-live="polite"` transcript, ↑/↓ history + `stepHistory`, first-line-only multiline paste + notice, mobile ↑/↓ buttons, auto-focus, scroll-to-bottom. The `ConsoleLine` union gains `"output"` and `"error"` kinds (5.1 reserved room for `"output"`); render them with tokenized colors (`text-foreground` / `text-muted-foreground` / `text-status-err` or `text-destructive` for errors — never hex).

7. **(`clear` semantics)** Running `clear` removes the just-echoed `$ clear` line too (transcript ends empty), but leaves `history` intact so ↑ recalls `clear` and earlier commands. Implement `clear` as a `{ type: "clear" }` effect that sets the transcript to `[]` **after** the echo, rather than appending output.

8. **(Voice & accessibility — non-negotiable)** Every output is in DevTools/Hossam voice (PRD §5.0); no placeholder/Lorem ships. New output lines are announced via the existing `aria-live="polite"` transcript. Errors are conversation, not red modals. Any added transition routes through `useShouldAnimate()`; most commands are synchronous and need none. RTL: any sigil/spacing uses logical properties (carry over 5.1's `me-1`).

9. **(Konami `experimental` is out of scope)** `experimental` is **not** registered or listed in `help` here — it is Konami-locked and belongs to **Story 5.4** (unlock persists to `localStorage["hm_unlocks_v1"]`, then `experimental` appears in `help`). Architect the registry so 5.4 can add a locked command + reveal-on-unlock **without restructuring** (e.g. an availability predicate the registry consults), but implement no unlock logic now.

10. **(Regression — chrome, route, 5.1 behaviors intact)** `/console` stays code-split via `dynamic()` from the RSC `page.tsx` (no `{ ssr: false }`, `metadata` unchanged), inside the `(chrome)` group; the persistent chrome, the `visit:console` grant (Story 2.5, in `app/(chrome)/layout.tsx`), the `D` deadpan toast, tab-switching, and RTL all keep working. All 5.1 behaviors (echo, history, paste notice, mobile buttons, auto-focus) still pass their existing tests. No console errors/warnings on any command path.

11. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds and `/console` still statically renders the shell (registry runs client-side). Live verification (Task 6) confirms each command's output, `command not found` + `did you mean`, `clear`, `download resume`, `contact` navigation, the `theme light` refusal, and the +5 XP on first successful command.

## Tasks / Subtasks

- [x] **Task 1 — Build the pure command registry `lib/repl/commands.ts` (AC: 1, 2, 4, 5, 9)**
  - [x] Create `lib/repl/commands.ts`. Export the result contract:
    ```ts
    export type ReplLineKind = "output" | "notice" | "error"
    export type ReplEffect =
      | { type: "clear" }
      | { type: "download"; href: string }
      | { type: "navigate"; to: string }
    export interface ReplLine { kind: ReplLineKind; text: string }
    export interface ReplResult {
      lines: ReplLine[]
      status: "ok" | "not-found"
      effect?: ReplEffect
    }
    export function runCommand(raw: string): ReplResult
    ```
  - [x] Define a registry array of `{ name, summary, run }` entries (declaration order = `help` order = `did you mean` tie-break order). Each `run(args: string[]): ReplResult`-shaped (pure). Names: `help`, `whoami`, `projects`, `contact`, `theme`, `clear`, `download resume`. **No `experimental`.**
  - [x] Parse: trim → lowercase the command-name match → recognize the two-word `download resume` (match first two tokens) and the bare commands. Pass remaining tokens as `args`. Import `projects` and `profile` from `@/lib/content` (NOT `lib/data`).
  - [x] `help`: map registry entries to `<name> — <summary>` lines (aligned/mono).
  - [x] `whoami`: build voiced lines from `profile` (see Dev Notes "whoami voice"); omit email when `profile.email === ""`.
  - [x] `projects`: numbered `[<method>] <name> (<status>) — <year>`; apply `--shipped` / `--tag <x>` (case-insensitive `stack.includes`); empty result → one voiced "no requests match: <filter>" line (status still `ok`).
  - [x] `contact`: one voiced lead-in line + `effect: { type: "navigate", to: "/sources" }`.
  - [x] `theme`: `dark` → ack line; `light`/other → `Site is dark-only. The vibe is intentional.` (verbatim, matching `theme-provider.tsx`); bare → current + usage.
  - [x] `clear`: `effect: { type: "clear" }`, no output lines, status `ok`.
  - [x] `download resume`: one ASCII-descent voice line + `effect: { type: "download", href: "/hossam-marey-resume.pdf" }`.
  - [x] Unknown command → `status: "not-found"`, line 1 `command not found: <x>. Type 'help' for available commands.`, plus `did you mean: <suggestion>?` when a registry name is within Levenshtein < 3 (Task 2). Empty/whitespace `raw` → never reaches here (the component guards empty submits), but be defensive (return `not-found` with the standard line, no crash).

- [x] **Task 2 — Levenshtein + suggestion helper (AC: 2)**
  - [x] Add a pure exported `levenshtein(a: string, b: string): number` (classic DP, lowercased inputs) — co-locate in `commands.ts` or `lib/repl/levenshtein.ts`. No dependency.
  - [x] Add `suggest(input: string): string | undefined` → nearest registry command name with distance < 3; ties resolved by declaration order; `undefined` if none qualifies. For the two-word command, suggesting `download` is acceptable (compare against command names as declared).

- [x] **Task 3 — Wire the registry into `components/console-repl.tsx` (AC: 3, 5, 6, 7, 8, 10)**
  - [x] Remove the local `runCommand` stub + its `eslint-disable`. Import `{ runCommand }` (and types) from `@/lib/repl/commands`.
  - [x] Extend `ConsoleLine.kind` to `"input" | "notice" | "output" | "error"`. Map `ReplLine.kind` → `ConsoleLine.kind` (`output`/`notice`/`error`).
  - [x] In `handleSubmit`, after echoing the input line: `const result = runCommand(command)`.
    - Append `result.lines` (mapped) to the transcript (keep the existing single `setTranscript` batched update where practical).
    - If `result.status === "ok"`: `emitXP(5, "repl:command")` (import from `@/lib/xp/bus`) **and** apply `result.effect`:
      - `clear` → `setTranscript([])` (overrides the echo + any appended lines this tick; history untouched).
      - `download` → programmatic anchor: create `<a>`, set `href`/`download`, `click()`, remove. (No new dep; do it inline in the handler.)
      - `navigate` → `router.push(result.effect.to)` using `useRouter` from **`next/navigation`**.
    - Preserve scroll-to-bottom (`requestAnimationFrame(scrollToBottom)`), input clear, history append, `historyIndex`/`draft` reset exactly as 5.1.
  - [x] Add `const router = useRouter()` at the top of the component (client-only; `next/navigation`).
  - [x] Render the new kinds with tokens: `output` → `text-foreground`; `notice` → `text-muted-foreground`; `error` → `text-status-err` (or `text-destructive` if `status-err` token absent — verify in `app/globals.css`). Never hardcode hex.
  - [x] Do **not** emit XP inside the registry or before the listener exists — the chrome's `useXP` listener is attached synchronously on mount; emitting from the submit handler is safe (do not re-introduce the rAF-gated-emit bug, memory `feedback_raf_mount_gate_drops_sync_emits`).

- [x] **Task 4 — Registry unit tests (AC: 1, 2, 4, 5)**
  - [x] `lib/repl/commands.test.ts` (**NEW**), Vitest `globals: true`:
    - `help` lists all 7 commands and **not** `experimental`.
    - `whoami` includes name/role/years/location/tagline; never an empty `email:`.
    - `projects` numbering + `[method] name (status) — year` format; `--shipped` filters; `--tag react` filters (case-insensitive); unknown tag → voiced empty line, status `ok`.
    - `contact` → `effect.type === "navigate"`, `to === "/sources"`.
    - `theme light` → exact refusal string; `theme dark` → ack; bare `theme` → usage.
    - `clear` → `effect.type === "clear"`, no output lines.
    - `download resume` → `effect.type === "download"`, `href === "/hossam-marey-resume.pdf"`.
    - unknown → status `not-found`, exact `command not found:` line; `did you mean:` appears for a near-miss (e.g. `whoam` → `whoami`) and is **absent** for a far string (e.g. `xyzzy`).
  - [x] **fast-check** (project-context: REPL command parsing + XP math are designated fuzz targets): property-test `levenshtein` (non-negativity, identity `d(a,a)=0`, symmetry `d(a,b)=d(b,a)`, and `runCommand` never throws on arbitrary strings and always returns a valid `status`). Mirror the `fc` import style in `lib/xp/bus.test.ts`.

- [x] **Task 5 — Component wiring tests (AC: 3, 6, 7, 10)**
  - [x] Extend `components/console-repl.test.tsx` (existing 5.1 suite stays green):
    - Submitting `whoami` renders voiced output lines under the echoed `$ whoami`.
    - Submitting an unknown command renders the `command not found:` error line (and `did you mean:` for a near-miss).
    - `clear` empties the transcript but ↑ still recalls the prior command (history persists).
    - **XP on success:** `vi.mock("@/lib/xp/bus", () => ({ emitXP: vi.fn() }))`; assert `emitXP` called with `(5, "repl:command")` after a successful command, and **not** called after `command not found`.
    - **navigate:** mock `next/navigation` `useRouter` → assert `push("/sources")` on `contact`.
    - **download:** spy on anchor `click` (or `HTMLAnchorElement.prototype.click`) → assert it fires with the resume href on `download resume`. (Mock `createElement`/click minimally; don't assert real navigation.)
  - [x] Do **not** re-test the bus internals (dedup/clamp/persist) — covered by `lib/xp/bus.test.ts`. Do **not** test Tailwind classes, framer-motion, or `dynamic()` framework behavior. Query by role/label/text; `userEvent.setup()`.

- [x] **Task 6 — Live verification (AC: 1, 2, 7, 10, 11)**
  - [x] `yarn dev` → `/console`. Clear state (`localStorage.clear()`, reload). Run each: `help`, `whoami`, `projects`, `projects --shipped`, `projects --tag react`, `contact` (lands on `/sources`), `theme`, `theme dark`, `theme light` (deadpan refusal verbatim), `clear` (output clears, ↑ recalls history), `download resume` (PDF downloads + voice line). Confirm voiced output, no Lorem.
  - [x] Unknown command (`whoam`) → `command not found:` + `did you mean: whoami?`; far string (`xyzzy`) → no suggestion.
  - [x] XP bar increments **+5 on the first successful command** of the session; subsequent commands add nothing (reason deduped once-ever) — confirm and note for reviewers (see locked decision).
  - [x] Confirm: no console errors/warnings; `D` toast still fires; Console tab active + tab-switch has no full reload; RTL (`<html dir="rtl">`) layout intact; mobile ↑/↓ buttons + auto-focus still work.

- [x] **Task 7 — Gate (AC: 11)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds with `/console` statically rendered.
  - [x] Commit (Conventional Commits, one story per commit, console scope): `feat(console): command registry with voiced outputs (story 5.2)`.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the **command registry + voiced outputs + helpful errors + REPL XP** that fills the Story 5.1 seam. A pure `runCommand` in `lib/repl/commands.ts` returning structured lines + an effect; the `ConsoleREPL` component interprets effects (`clear`/`download`/`navigate`) and fires `emitXP(5, "repl:command")` on success.
- **IS NOT:**
  - **Konami `experimental`** — locked command, unlock persistence (`hm_unlocks_v1`), chrome pulse, `emitXP(20, "konami")` are **Story 5.4**. Leave a clean availability seam; implement nothing.
  - **The ⌘K command palette** — **Story 5.3** (`cmdk`, four groups). Different surface.
  - **The boss-level contact form** — **Epic 6** (Story 6.3/6.4). `contact` here only *navigates* to `/sources`; it does not build the form. `/sources` already exists (Story 3.5: file tree + preview).
  - **Modifying the XP bus** — the bus (`lib/xp/bus.ts`) is the single source of truth; reuse it untouched (same rule as Story 4.5).

### XP granularity — locked decision + surfaced conflict (READ THIS)
The epic AC (epics.md:629–631) literally says `emitXP(5, "repl:command")`. The existing bus dedupes **per-reason, persistently** (`hm_xp_granted` in `localStorage`; bus.ts comment: "each reason grants once ever"). So with the literal reason `"repl:command"`, the **first** successful command grants +5 and **every later command grants nothing** — exactly how `visit:network` grants once.

- **Locked for this story:** use the literal `"repl:command"`. It is self-consistent with FR-074 ("Run a successful REPL command: +5" — singular action) and FR-075 ("idempotent per-action … visiting Network 5× still only grants +10 the first time"), and it keeps the bus untouched.
- **Surfaced conflict (do NOT silently "fix"):** PRD UJ-3 step phrasing (prd.md:124) reads "+5 **per command** lands," which *could* imply per-distinct-command granularity (reason `repl:<name>`). That contradicts the literal epic AC and the bus's once-ever model. **Per the project rule, surface — don't resolve.** Implement the literal AC; flag the UJ wording to Hossam (see Questions). If Hossam wants +5 per *distinct* command, that's a one-line change (reason = `repl:${name}`) — but it is a deliberate decision, not a dev call.

### whoami voice (PRD §5.0 — "Hossam's actual voice, not a printout")
Build from `Profile`; voice over data. Strong default (confirm copy with Hossam — Questions):
```
Hossam Marey — Senior Front-End Developer · 8+ yrs · Egypt
> I build fast, accessible interfaces for data-heavy products — then teach how it was done.
> Right now I'm making a DevTools panel pretend to be a résumé. You're standing inside it.
```
Pull `name`, `role`, `years`, `location`, `tagline` from `profile`. **Omit the email line** (`profile.email === ""`). No JSON dump, no empty fields. (§5.0: "If `whoami` reads like a JSON dump, P3 disengages within seconds.")

### `theme` — reuse the exact existing copy
The site is dark-only and the `D` hotkey already toasts **`Site is dark-only. The vibe is intentional.`** (`components/theme-provider.tsx:46`). `theme light` must return that **verbatim** so the two surfaces agree (UX §117/§798 "deadpan refusal"). There is no real theme toggle to call — `theme dark` just acknowledges; do **not** import `useTheme`/`setTheme` (nothing to set).

### Reuse — do NOT reinvent
- **`emitXP`** from `@/lib/xp/bus` — the only XP path. Dedup + clamp + dispatch + persistence are done. Don't touch it; don't add a parallel guard (Story 4.5 rule).
- **Content** — import `projects`, `profile` from `@/lib/content` (barrel) — **never** `lib/data/index.ts` (deleted/legacy, project-context anti-pattern).
- **`useRouter`** from **`next/navigation`** (App Router) for `contact` → `/sources`. Not `next/router`.
- **The 5.1 shell** — keep `components/console-repl.tsx`'s input/transcript/history/paste/mobile-buttons/auto-focus intact; only the `runCommand` call site + effect/XP block change.
- **`useShouldAnimate()`** (`@/hooks`) — only if you add a transition (e.g. typewriter cadence). Most commands are synchronous; none required.
- **`cn()`** from `@/lib/utils` for conditional line classes.
- **Tokens** — `font-mono text-sm`, `text-foreground`/`text-muted-foreground`, `text-lime` sigil, error in `text-status-err`/`text-destructive`. Verify the error token name in `app/globals.css` before using.

### Registry contract & side-effect seam (the design that keeps it testable)
`runCommand(raw): ReplResult` is **pure** — returns `{ lines, status, effect? }`, performs no I/O. The component is the only place that touches `window`/`router`/`localStorage`/`emitXP`. This means the whole registry (parsing, filtering, voice, `did you mean`) is unit-/fast-check-testable in `jsdom` with zero mocking, and the component test only needs to verify the **wiring** (XP emit, navigate, download, clear). This is the clean replacement for 5.1's `(command) => ConsoleLine[]` stub.

### Architecture / project-context guardrails (must follow)
- **RSC by default; `page.tsx` untouched** (still RSC + `metadata` + `dynamic()`); all new logic is client (`console-repl.tsx`) or pure lib (`lib/repl/commands.ts`). **Named exports** (`runCommand`, `ConsoleREPL`); `page.tsx` keeps its default export.
- **TS strict / `isolatedModules`** — `import type` for type-only imports. **No `import React`**. No `as any`/`!` without a WHY comment.
- **No new dependency, no state library, no router/i18n lib, no `tailwind.config.*`.** Registry is hand-rolled (NFR-P4: "no shell library").
- **Import order:** external → `@/lib`/`@/components`/`@/hooks` → relative → side-effects; blank line between groups, alpha within.
- **RTL:** logical properties only (carry over `me-1` on the sigil). **Comments:** WHY-only (the registry seam / locked-XP-decision notes are legitimate WHYs).
- **Errors are conversation** (architecture.md:186,308): voiced lines, no red modal, no thrown error to the user. Wrap nothing in `try/catch` that would swallow real bugs — the registry is pure and shouldn't throw.

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router** — `useRouter` from `next/navigation`; `router.push("/sources")`. `/console` stays statically rendered; registry runs in the client island. No `{ ssr: false }`.
- **React 19.2.4** — refs are plain props; Strict Mode double-fires effects in dev (the submit handler isn't an effect, so unaffected; auto-focus from 5.1 is idempotent).
- **framer-motion 12.40.0** — import from `framer-motion` (NOT `motion/react`; pkg not installed). Likely unused here; gate via `useShouldAnimate()` if added.
- **fast-check 4.8.0** — designated for "REPL command parsing" + "XP math" (project-context §Testing). Use it for `levenshtein` properties + `runCommand` total-function robustness.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true` (don't import `describe`/`it`/`expect`), `jsdom`, setup `tests/setup.ts`. Colocate `commands.test.ts` next to `commands.ts`; extend `console-repl.test.tsx`.
- `userEvent.setup()` (not `fireEvent`) for typing/Enter. Query by role/label/text; avoid `getByTestId`. Mock **boundaries only** (`@/lib/xp/bus`, `next/navigation`) — test the **real** registry.
- No snapshot tests; don't test Tailwind class strings, framer-motion, or `dynamic()`.

### Edge cases to handle
- **`projects --tag <x>` no matches** → voiced "no requests match" line, status `ok` (still grants XP, still valid command).
- **`download resume`** → anchor click must not navigate away the SPA; use `download` attr + same-origin href. Remove the temp anchor after click.
- **`clear`** → transcript empties **including** the `$ clear` echo; `history` persists (↑ recalls).
- **Unknown two-word input** (e.g. `download cv`) → `download` alone isn't a command; treat the full string as unknown → `command not found: download cv …` with `did you mean: download resume?` if within distance 3 (compare against declared names — acceptable to suggest `download resume`).
- **Bare/whitespace submit** → already guarded by the 5.1 shell (no echo, no `runCommand`). Keep that guard.
- **`profile.email === ""`** → `whoami` omits the email line entirely.
- **RTL** → sigil + any spacing use logical props.

### XP toast collision (out of scope — tracked)
`deferred-work.md:143–147` notes the chrome XP-toast single-slot key collision becomes *triggerable* once multiple emitters exist. A single `repl:command` emit (once-ever) won't collide with itself, so **do not fix it here** — it stays tracked in deferred-work for a dedicated pass (likely once 5.4/6.4 add concurrent emitters).

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `lib/repl/commands.ts` | **NEW** | Pure registry: `runCommand(raw): ReplResult`, registry entries (7 commands, no `experimental`), `levenshtein` + `suggest`, `ReplLine`/`ReplEffect`/`ReplResult` types. No I/O, no deps. Imports `projects`/`profile` from `@/lib/content`. |
| `lib/repl/commands.test.ts` | **NEW** | Unit + fast-check: outputs, filters, `did you mean`, effects, total-function robustness. |
| `components/console-repl.tsx` | **UPDATE** | Replace `runCommand` stub with registry import; add `"output"`/`"error"` line kinds; in submit, append lines + (on `ok`) `emitXP(5,"repl:command")` + apply effect (`clear`/`download`/`navigate` via `next/navigation` `useRouter`). Preserve all 5.1 shell behavior. |
| `components/console-repl.test.tsx` | **UPDATE** | Add: voiced output render, `command not found`+`did you mean`, `clear` empties + history persists, XP emit on success / not on not-found, navigate on `contact`, download click on `download resume`. Keep 5.1 tests green. |
| `app/(chrome)/console/page.tsx` | **DO NOT TOUCH** | RSC + `metadata` + `dynamic()` import — unchanged. |
| `app/(chrome)/layout.tsx` | **DO NOT TOUCH** | Owns chrome + `visit:console` grant (Story 2.5). |
| `lib/xp/bus.ts` | **DO NOT TOUCH** | Reuse `emitXP` as-is (Story 4.5 rule). |

### Previous story intelligence
- **Story 5.1** (immediately prior, done) built the shell and the **exact seam** this story fills: stub `runCommand` at `components/console-repl.tsx:15-22`, submit handler at `:73-98`, `ConsoleLine` union at `:9-13` (already reserves room for an `"output"` kind). 5.1's code review applied: ArrowDown no-op at bottom, paste scroll-to-bottom, paste resets history nav, RTL `me-1` sigil — keep all of these.
- **Story 4.5** (XP precedent): emit through the bus from a client call site; **never** modify the bus or add a second dedup; the bus persists `hm_xp_granted` so reasons grant once-ever. The same applies to `repl:command`.
- **Story 2.5** (XP bus origin): the `useXP` listener attaches synchronously on mount → emitting from a handler/effect after mount is safe. Memory `feedback_raf_mount_gate_drops_sync_emits`: do **not** gate emits behind a rAF/mounted flag.
- **Standing rule (all stories):** surface doc-vs-code conflicts; don't silently resolve. Applied here to the XP-granularity / UJ-wording tension.

### Git intelligence (recent commits)
`ab0bfcb feat(console): REPL shell with command history (story 5.1)`, `1cf8842 fix(work): …`, `d674606 feat(work): grant project-open XP (story 4.5)`. Pattern: **Conventional Commits, one story per commit, scoped to the feature area** (RSC page + client island + colocated test + pure lib). Match it: `feat(console): command registry with voiced outputs (story 5.2)`.

### Project Structure Notes
- `lib/repl/commands.ts` is the architecture-named home for the registry (`architecture.md:439-440,480` map F5 to `console/page.tsx` + `console-repl.tsx` + `lib/repl/commands.ts`). camelCase-folder, kebab-free single file, named exports — consistent with `lib/xp/bus.ts` and `lib/content/*`.
- No new hook (registry is a pure module; effects live in the component). No new dependency, no `tailwind.config.*`, no state lib, no router/i18n change. Fully aligned with the unified structure.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:613-631] — Story 5.2 AC: registry (`help`/`whoami`/`projects [--shipped|--tag x]`/`contact`/`theme`/`clear`/`download resume`), voiced outputs, `command not found` + `did you mean` (Levenshtein < 3), `emitXP(5, "repl:command")` on success, tiny in-repo registry (NFR-P4).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:184-196] — FR-040..044: FR-041 registry + unknown wording; FR-042 per-command outputs (incl. `theme light` refusal, `download resume` → `/public/hossam-marey-resume.pdf`, `contact` ASSUMPTION=navigate); FR-043 +5 XP.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:124] — UJ-3 "+5 per command lands" (surfaced conflict vs. literal epic AC + bus once-ever model).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:219-225] — FR-074 (REPL command +5) + FR-075 (cap 100, idempotent per-action-per-session, fast-check).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:132-143] — §5.0 Voice: `whoami` = Hossam's voice not a printout; `theme light` deadpan refusal; `download resume` one-line ASCII descent; unknown → nearest valid.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:601-607] — `<ConsoleREPL>` spec: registry, voiced outputs, `command not found` + `did you mean`, `clear` resets output (history persists), +5 XP, `aria-live="polite"`, real `<input>`.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:117,157,166,740,798] — delight via `did you mean: 'projects'?`, `theme light` deadpan refusal, voice-rich error paths; unknown-command line wording.
- [Source: _bmad-output/planning-artifacts/architecture.md:439-440,480] — `lib/repl/commands.ts` registry (help/whoami/projects/contact/theme/clear/download/experimental); F5 file map.
- [Source: _bmad-output/planning-artifacts/architecture.md:186,308] — errors as DevTools voice (`did you mean:`), no error modals; storage access in try/catch (bus already does this).
- [Source: components/console-repl.tsx:9-22,73-98] — the 5.1 shell + `runCommand` stub seam being replaced; `ConsoleLine` union reserving `"output"`.
- [Source: components/theme-provider.tsx:46] — verbatim refusal copy `Site is dark-only. The vibe is intentional.` to reuse for `theme light`.
- [Source: lib/xp/bus.ts:62-73] — `emitXP(delta, reason)` reused as-is; once-ever per-reason dedup via `hm_xp_granted`; cap `[0,100]`.
- [Source: lib/content/index.ts; lib/content/profile.ts; lib/content/projects.ts] — `profile` (name/role/years/location/tagline; email `""`), `projects` (slug/name/method/status/year/stack) for `whoami`/`projects`. Import via `@/lib/content`.
- [Source: public/hossam-marey-resume.pdf] — exists; `download resume` → `/hossam-marey-resume.pdf`.
- [Source: app/(chrome)/sources/page.tsx] — `/sources` route exists (Story 3.5); `contact` navigates here.
- [Source: _bmad-output/implementation-artifacts/4-5-grant-project-open-xp.md] — XP-bus reuse pattern (don't modify bus; emit from client call site; no second dedup).
- [Source: _bmad-output/implementation-artifacts/deferred-work.md:143-147] — XP-toast single-slot collision (out of scope; tracked).
- [Source: _bmad-output/project-context.md] — RSC-by-default, named exports, `@/*`=root, import order, semantic tokens + logical props (RTL), framer-motion import rule, no state lib/no new deps, testing rules (role/label queries, `userEvent.setup()`, fast-check for REPL parsing + XP math, mock boundaries only), `lib/content` not `lib/data`.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- ✅ Built pure command registry `lib/repl/commands.ts` with 7 commands (help, whoami, projects, contact, theme, clear, download resume), Levenshtein distance suggestion, and pure `ReplResult` contract.
- ✅ Wired registry into `components/console-repl.tsx`: replaced stub, added output/error line kinds, applied effects (clear/download/navigate), emitted XP on success via `emitXP(5, "repl:command")`.
- ✅ Authored `lib/repl/commands.test.ts` with unit tests + fast-check property tests for levenshtein and runCommand total-function robustness.
- ✅ Extended `components/console-repl.test.tsx` with registry integration tests: voiced output, command not found + did you mean, clear + history persistence, XP emit on success/not on not-found, navigate on contact, download on download resume.
- ✅ All 191 tests pass (24 test files), including existing 5.1 regression suite.
- ✅ Gates green: `yarn typecheck`, `yarn lint`, `yarn test:run`, `yarn format`, `yarn build` all pass.
- ✅ `/console` statically renders; registry runs client-side in the dynamic island.

### Change Log

- Addressed code review findings — 0 items resolved (Date: 2026-06-01)
- Created `lib/repl/commands.ts` — pure command registry with voiced outputs
- Created `lib/repl/commands.test.ts` — unit + fast-check property tests
- Updated `components/console-repl.tsx` — wired registry, effects, XP, line kinds
- Updated `components/console-repl.test.tsx` — component wiring tests

### File List

| File | Action |
|---|---|
| `lib/repl/commands.ts` | NEW |
| `lib/repl/commands.test.ts` | NEW |
| `components/console-repl.tsx` | UPDATE |
| `components/console-repl.test.tsx` | UPDATE |

### Questions for Hossam
1. **`whoami` voice copy** — §5.0 forbids Lorem and requires "Hossam's actual voice." A strong default is in Dev Notes; confirm or replace the two voice lines so the shipped copy is genuinely yours.
2. **XP granularity** — locked to the literal epic AC `emitXP(5, "repl:command")` → +5 on the **first** successful command only (once ever, like tab-visits). UJ-3 phrasing ("+5 per command") could imply +5 per *distinct* command (`repl:<name>`). Confirm the once-ever reading, or request per-command (one-line change, deliberate decision).
3. **`contact` behavior** — resolved to **navigate to `/sources`** per the FR-042 ASSUMPTION. The boss-level form lands there in Epic 6; until then `/sources` shows the file tree + preview. OK to point `contact` at `/sources` now, or print contact info inline instead?
