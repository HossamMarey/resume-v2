---
title: 'Console — Claude Code design & interactions in brand colors'
type: 'feature'
created: '2026-06-01'
status: 'done'
baseline_commit: '29836e822a4645b1ab453b8a0c69fb144d58a3f5'
context: ['{project-root}/_bmad-output/project-context.md', '{project-root}/docs/design-system.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The `/console` REPL is functionally complete but visually bare (an `<h1>`, a plain transcript, a `$`-prefixed inline `<input>`). Hossam wants it to look and behave like **Claude Code** — bordered prompt box, welcome framing, slash commands, live command autocomplete — in the site brand (Obsidian + Signal Lime, IBM Plex Mono).

**Approach:** Restyle the console with existing brand tokens; migrate to `/`-prefixed slash commands (registry stays bare, `runCommand` normalizes a leading `/`, every display surface shows the slash form); add a hand-rolled autocomplete menu driven by the existing registry. No new deps; reuse registry, XP bus, unlock gating, history.

## Boundaries & Constraints

**Always:**
- Brand tokens only (`bg-surface`/`bg-surface-2`/`bg-popover`, `border-hairline`, `text-lime`, `text-foreground`, `text-muted-foreground`, `text-status-err`, `ring-ring`); `font-mono`. No hardcoded color.
- Input stays a real `<input>` (auto-focus, `aria-label`); transcript `aria-live="polite"` + `role="log"`; full keyboard use; visible focus ring; RTL logical properties only.
- Preserve all current behavior: history (↑/↓ + mobile buttons), multiline-paste-first-line+notice, `clear` (wipes transcript, keeps history), `+5 repl:command` XP, `navigate`/`download` effects, locked-`experimental` gating via `useUnlocks`.
- Slash normalization accepts both `/help` and `help` (one optional leading `/`, case-insensitive) so the `fast-check` "never throws" property holds; keep `unlocks` defaulted in `runCommand`.
- Autocomplete never surfaces a locked command before unlock (reuse registry visibility).

**Ask First:** adding any npm dependency; renaming/removing a command or changing a voiced-output string; changing the `/console` route layout beyond the console surface.

**Never:** no new route/backend/state-lib/`tailwind.config.*`/`globals.css` edit; do not modify `components/ui/command.tsx` or `command-palette.tsx` (no REPL-command copy there); no animation bypassing `prefers-reduced-motion`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Behavior |
|----------|--------------|-------------------|
| Run command | `/whoami` ↵ (or bare `whoami`) | strip `/`, run `whoami`; echo `▸ /whoami`; voiced output |
| Menu opens | input starts with `/`, e.g. `/wh` | menu lists matching **visible** commands (`/whoami`) + summaries; first highlighted; empty matches → hidden |
| Menu nav | menu open, ↑/↓ | move highlight (history nav suppressed while menu open) |
| Complete / Run / Close | menu open, `⇥` / `↵` / `Esc` | `⇥` sets input `/<sel> ` (no submit); `↵` runs highlighted; `Esc` hides, keeps text |
| History | menu closed, ↑/↓ | walk history buffer (unchanged) |
| Locked hidden | `/experimental` pre-Konami | absent from menu; run → `command not found: /experimental. Type '/help'…`; no suggestion leak |
| Near-miss | `/whoam` ↵ | not-found + `did you mean: /whoami?` (dist ≥ 3 → none) |
| Reduced motion | `prefers-reduced-motion` | no motion; all interactions still work |

</frozen-after-approval>

## Code Map

- `lib/repl/commands.ts` — registry + `runCommand(raw, unlocks=[])`, `levenshtein`/`suggest`, locked gating. Add `/` normalization, slash display copy, exported `listCommands(unlocks)`.
- `components/console-repl.tsx` — REPL client island; visual restyle + welcome + footer hint + `▸` prompt + autocomplete menu & keyboard wiring.
- `app/(chrome)/console/page.tsx` — page shell/heading; minor restyle to match (keep `dynamic()` + metadata).
- `lib/repl/commands.test.ts` / `components/console-repl.test.tsx` — update copy/prompt assertions; add `listCommands` + autocomplete tests.

## Tasks & Acceptance

**Execution:**
- [x] `lib/repl/commands.ts` — strip one optional leading `/` in `runCommand` before tokenizing (case-insensitive; `unlocks` defaulted). Display helper so `help` lists `/<name>`, `notFound` reads `command not found: <raw>. Type '/help' for available commands.`, `suggest` returns `/<name>`. Export `listCommands(unlocks): { name; summary }[]` (visible only, reuse `isVisible`).
- [x] `components/console-repl.tsx` — bordered rounded input box (`rounded-lg border border-hairline bg-surface focus-within:ring-1 focus-within:ring-ring`) with a `▸` `text-lime` caret; welcome block on mount (bordered `bg-surface-2`, voiced intro + "type `/help` to begin"); footer hint (`text-muted-foreground text-xs`, logical spacing) e.g. `type / for commands · ↑↓ history · ⇥ complete · ↵ run`; transcript echo prefix `$`→`▸`. Autocomplete: when `input` starts with `/`, show `listCommands(unlocks)` prefix-filtered by name; ↑/↓ move highlight (suppress history while open), `⇥` completes to `/<name> `, `↵` runs highlighted, `Esc` closes. Menu `role="listbox"` + `aria-activedescendant`; items `role="option"`. Keyboard precedence: menu-open branch before history/submit. Preserve history/paste/clear/XP/effects; keep mobile ↑↓ buttons (brand-styled).
- [x] `app/(chrome)/console/page.tsx` — window-title framing instead of a bare `<h1>`; keep code-split + metadata.
- [x] `lib/repl/commands.test.ts` — slash display assertions; assert `/help` and `help` both resolve; `listCommands` tests (excludes locked `experimental` until `["konami"]` + content enabled).
- [x] `components/console-repl.test.tsx` — `▸` prompt + new copy; autocomplete tests (opens on `/`, prefix filter, ↑↓ highlight, `⇥` complete, `↵` run, `Esc` close, locked absent). Mock boundaries only; query by role/label/text.

**Acceptance Criteria:**
- Given mount, then a welcome block, a bordered `▸` input box, and a footer hint render in brand colors/IBM Plex Mono with no console errors.
- Given `/wh` with menu open, when `↵`, then `whoami` runs; when `⇥` instead, input becomes `/whoami `.
- Given menu closed, when ↑/↓, then history walks exactly as before.
- Given Konami locked, then `experimental` never appears and `/experimental` → `command not found … Type '/help'`.
- Given `prefers-reduced-motion`, then no motion plays and interactions still work.
- Given `yarn typecheck && yarn lint && yarn test:run`, then all pass; `yarn format` clean; `yarn build` succeeds.

## Design Notes

Hand-roll the menu (don't reuse cmdk): registry is ~8 static entries; cmdk is dialog-oriented and wiring it to a controlled input that also owns history/submit costs more than a prefix-filter + highlight index. Reuse the *data* (`listCommands`), not the dialog.

Slash strategy = low blast radius: registry names stay bare (so `download resume`, flags, and `experimental` gating are untouched); only `runCommand` normalization + three display strings change. Both `/cmd` and `cmd` run; every surface *shows* the `/` form.

## Verification

**Commands:** `yarn typecheck` (no errors) · `yarn test:run` (all pass) · `yarn lint` (no new errors) · `yarn build` (success).
**Manual:** `yarn dev` → `/console`: welcome + bordered `▸` box + footer in brand colors; `/` opens menu; ↑↓ highlight / ⇥ complete / ↵ run / Esc close; menu-closed ↑↓ = history; `/experimental` hidden pre-Konami; reduced-motion → no motion; RTL + mobile (`<640px`) intact; no console errors.

## Suggested Review Order

**Slash-command surface (design intent)**

- Entry point: optional leading `/` is normalized so `/cmd` and `cmd` both resolve.
  [`commands.ts:269`](../../lib/repl/commands.ts#L269)
- Display-only prefix helper — registry keys stay bare; every surface shows `/name`.
  [`commands.ts:29`](../../lib/repl/commands.ts#L29)
- New `listCommands(unlocks)` seam feeds the autocomplete menu (visible commands only).
  [`commands.ts:261`](../../lib/repl/commands.ts#L261)

**Autocomplete interaction**

- Memoized suggestions: open while input is a bare `/token`, dismissable by Esc.
  [`console-repl.tsx:48`](../../components/console-repl.tsx#L48)
- Keyboard precedence — menu branch (↑↓/⇥/↵/Esc) runs before history/submit.
  [`console-repl.tsx:166`](../../components/console-repl.tsx#L166)
- The `role="listbox"` menu with `role="option"` rows + mousedown-to-run.
  [`console-repl.tsx:275`](../../components/console-repl.tsx#L275)
- Bordered `▸` prompt box as an ARIA combobox (expanded/controls/activedescendant).
  [`console-repl.tsx:329`](../../components/console-repl.tsx#L329)

**Framing & shell**

- `execute()` extracted from submit so menu-Enter and form-submit share one path.
  [`console-repl.tsx:100`](../../components/console-repl.tsx#L100)
- Page heading restyled to the panel-label idiom.
  [`page.tsx:24`](../../app/(chrome)/console/page.tsx#L24)

**Tests (supporting)**

- Slash display copy + `listCommands` coverage.
  [`commands.test.ts:12`](../../lib/repl/commands.test.ts#L12)
- Combobox role migration + autocomplete suite.
  [`console-repl.test.tsx:305`](../../components/console-repl.test.tsx#L305)
