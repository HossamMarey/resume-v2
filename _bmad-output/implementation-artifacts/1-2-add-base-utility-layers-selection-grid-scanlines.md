# Story 1.2: Add base/utility layers — selection, grid, scanlines

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want the signature background texture and selection styling,
so that the site feels like a real DevTools surface from the first paint.

## Context & Orientation (read first)

Second story of Epic 1 (Foundation). It builds directly on **Story 1.1**, which rewrote `app/globals.css` to the dark-only Obsidian + Signal Lime token set. **This story edits the same single file: `app/globals.css`.** No JSX, no new components, no dependencies.

Story 1.1 deliberately **deferred three things to this story** — now is the time:
1. The `::selection` rule is still the **wrong/inverted** rule inherited from the starter (lime *text* on dark bg). Flip it to lime *background* + dark foreground. (deferred-work.md #1)
2. The `.bg-grid` + `.bg-scan` background utilities **do not exist yet** — add them.
3. The "surface language" aesthetic (no drop shadows, ≤6px radius) is **not yet enforced** — Story 1.1 kept cool-neutral `--shadow-*` token values to avoid breakage; this story neutralizes them.

**Scope fence — what this story does NOT do:**
- It does **not** apply `.bg-grid`/`.bg-scan` to the hero or any element — defining the utilities is the deliverable; the hero compositing (`opacity-40`/`opacity-60`) lands in **Story 3.1**.
- It does **not** touch color/typography/geometry token *values* (Story 1.1, done) beyond the radius clamp + shadow neutralization called out below.
- It does **not** add `useShouldAnimate()` / helpers (Story 1.3) or remove legacy infra (Story 1.4).
- It does **not** restructure any `components/ui/*` primitive (forbidden boundary) — shadow removal is a **token restyle**, applied globally via `:root`, never by editing primitives.

## Acceptance Criteria

1. **AC1 — `::selection` is inverted lime (in `@layer base`).**
   **Given** `@layer base` in `globals.css`,
   **When** I select text anywhere on the site,
   **Then** `::selection` renders a **lime background** with **`--lime-foreground` (dark) text** — i.e. `background-color: var(--primary); color: var(--primary-foreground);` (equivalently the `--lime`/`--lime-foreground` tokens, since `--primary` aliases `--lime`) — and the bogus non-standard `text-selection-color` declaration is removed.

2. **AC2 — `.bg-grid` and `.bg-scan` utilities exist (FR-013).**
   **Given** the custom-utility layer,
   **When** `.bg-grid` and `.bg-scan` are applied to an element,
   **Then** `.bg-grid` paints 48px crossed grid lines in white @4% (`background-size: 48px 48px`) and `.bg-scan` paints a 4px-period horizontal scanline in white @2% — matching addendum §0.1 exactly — and both are dark-only by construction (white-on-obsidian; the site has no light mode). The utilities are usable together and support being composited at reduced opacity by a consumer (the hero in Story 3.1).

3. **AC3 — Surface language enforced: no drop shadows, radius ≤ 6px.**
   **Given** the surface language (UX-DR2 / addendum §0.3 #1–#2 / design-system §4–§5),
   **When** any panel/card/modal/floating element renders,
   **Then** no `box-shadow` appears (the global `--shadow-*` token scale resolves to `none`, so even shadcn primitives that use `shadow-*` render flat — depth comes only from background-color steps `background`→`surface`→`surface-2` + hairline borders), **and** no border-radius in the token scale exceeds `--radius` (6px): `--radius-xl` is clamped to `var(--radius)`. The **only** allowed exception is the chrome XP-bar pill (`rounded-full`, built-in, not token-derived; arrives in Epic 2).

4. **AC4 — No regressions; build + checks clean.**
   **Given** the change is CSS-only in `globals.css`,
   **When** `yarn typecheck && yarn lint && yarn build` run,
   **Then** all pass with no new errors/warnings and no missing-var/circular-var warnings, and the compiled CSS shows the inverted `::selection`, the two background utilities, and shadow tokens resolved to `none`.

## Tasks / Subtasks

- [x] **Task 1 — Fix `::selection` to inverted lime (AC1)**
  - [x] In the existing `::selection` rule at the end of `globals.css`, swap to `background-color: var(--primary);` and `color: var(--primary-foreground);`.
  - [x] Delete the non-standard `text-selection-color: var(--primary);` line (not a real CSS property — starter artifact).
  - [x] Kept the rule at EOF (valid outside `@layer base`; the inverted result is what AC1 requires). Added a one-line WHY comment.
- [x] **Task 2 — Add `.bg-grid` and `.bg-scan` utilities (AC2)**
  - [x] Added both as Tailwind v4 `@utility` blocks (matching the existing `@utility scrollbar-*` pattern), top-level, with the exact addendum §0.1 CSS.
  - [x] Did NOT apply them to any element (hero compositing is Story 3.1). Definition only.
- [x] **Task 3 — Neutralize drop shadows globally (AC3)** — DECISION, read Dev Notes §"Shadow neutralization"
  - [x] Set all eight `:root` shadow tokens (`--shadow-2xs … --shadow-2xl`) to `none`. Left the `@theme inline` `--shadow-*: var(--shadow-*)` mappings as-is (they now resolve to `none`).
  - [x] Enforces "no drop shadows" globally for vendored + custom components without editing any primitive.
- [x] **Task 4 — Clamp the radius scale to ≤ 6px (AC3)**
  - [x] Changed `--radius-xl: calc(var(--radius) + 4px)` (10px) → `--radius-xl: var(--radius)` (6px). Confirmed sm/md/lg = 2/4/6px (all ≤ 6px, left unchanged).
  - [x] `--radius` untouched (6px). XP-bar pill (`rounded-full`) is not token-derived — nothing added.
- [x] **Task 5 — Verify (AC4)**
  - [x] `yarn typecheck` clean; `yarn lint` 0 errors (only the pre-existing `'inter' unused` warning in `app/layout.tsx`).
  - [x] `yarn build` succeeds, no new warnings.
  - [x] Compiled-CSS inspection confirms: `::selection{background-color:var(--primary);color:var(--primary-foreground)}`, `.bg-grid` (48px, `#ffffff0a` = white @4%), `.bg-scan` (`#ffffff05` = white @2%, 4px period), all 8 `--shadow*` → `none`, `--radius-xl: var(--radius)`.
  - [x] `npx prettier --write/--check app/globals.css` → clean & unchanged. Repo-wide `yarn format` NOT run; only `app/globals.css` changed (verified via `git status`).

## Dev Notes

### What is being changed (single file: `app/globals.css`)
After Story 1.1, the file has: `@theme inline` (token mappings incl. `--radius-xl` calc and `--shadow-*` mappings), a single canonical dark `:root` (Obsidian/Lime values + cool-neutral `--shadow-*` values + `--letter-spacing`/`--spacing`), the `[dir="rtl"]` font swap, `@layer base` (`*` border/font, `html,body` font-feature-settings, `body` bg/fg, headings, button cursor, `html` scrollbar), the view-transition keyframes + `.mention` + `.animate-text`, the `@utility scrollbar-*` blocks, the input/switch direction overrides, the dialog overflow rule, and the (still-inverted) `::selection` at the very end. This story touches exactly four spots: `::selection`, two new `@utility` blocks, the `:root` shadow values, and the `@theme inline` `--radius-xl` line. Everything else is preserved verbatim.

### Canonical specs (authoritative — copy exactly)
- **`::selection`** (addendum §0.1 / design-system §5 line 113): lime background, dark (`--lime-foreground`) text — inverted. `--primary`/`--primary-foreground` are aliases of `--lime`/`--lime-foreground` (set in 1.1), so either token pair is correct; use `--primary`/`--primary-foreground` to match the deferred-work.md #1 suggested fix.
- **`.bg-grid` / `.bg-scan`** (addendum §0.1; design-system §5 lines 109–111): exact CSS in Task 2. Grid = 48px white @4% crossed lines; scan = 4px-period white @2% horizontal lines (subtle CRT).
- **Surface language** (design-system §4 line 94 "No heavy borders, no drop shadows on cards"; §5 lines 100–105; addendum §0.3 #1 "No drop shadows on cards/panels/modals. Hairline borders only. Depth comes from background-color steps (`background`→`surface`→`surface-2`), never from `box-shadow`"; #2 "Maximum border radius is `--radius` (6px) … Never `rounded-lg`, `rounded-xl`, or `rounded-full` except for the chrome XP bar pill").

### Shadow neutralization (real decision — resolve as instructed)
Story 1.1 kept the cool-neutral `rgba(0,0,0,…)` `--shadow-*` values so nothing broke during the palette consolidation. The surface-language aesthetic forbids drop shadows on cards/panels/modals (stated twice in design-system, plus addendum §0.3 #1). **Resolution: set all `--shadow-*` to `none`.** This is a global **token restyle** (allowed — "restyle vendored primitives via tokens, don't restructure"), so shadcn `card`/`dialog`/`popover`/`dropdown-menu`/`sheet` that reference `shadow-*` render flat. Those floating elements retain separation via their `border-hairline` + `bg-surface`/`bg-popover` (= surface), which is exactly the intended DevTools look. Do **not** edit the primitives themselves. (See non-blocking Question 1 — a quick visual check of floating menus/dialogs is worth doing, but the spec is unambiguous that flat-with-hairline is the target.)

### Radius clamp
`@theme inline` currently derives `--radius-xl: calc(var(--radius) + 4px)` = 10px, which violates the 6px max if any component uses `rounded-xl`. Clamp to `var(--radius)` (6px). `rounded-full` (used only by the future XP-bar pill) is built-in `9999px` and is the sole sanctioned exception — not represented in the token scale, so no change needed for it.

### Tailwind v4 utility idiom (don't reinvent)
The file already defines custom utilities with `@utility name { … }` (e.g. `scrollbar-thin`). Use the same `@utility` form for `bg-grid`/`bg-scan` — top-level, not inside `@layer utilities` (the AC says "@layer utilities" loosely; `@utility` is the v4-correct way and the project's established pattern, and still produces the `.bg-grid`/`.bg-scan` classes). Do not add a `@layer utilities { }` block that diverges from the file's convention.

### Dark-only note
`.bg-grid`/`.bg-scan` are inherently dark-only: they paint white at 4%/2% over the Obsidian background. There is no light mode to gate against (Story 1.1 removed it). No `.dark`-scoping needed.

### Project guardrails that bite in this story
- Tailwind v4: everything in `app/globals.css`; never create `tailwind.config.*`. [project-context.md#Tailwind v4 + shadcn]
- No drop shadows; depth via bg steps + hairlines; ≤6px radius. [addendum §0.3 #1–#2; design-system §4–§5]
- No gradient fills anywhere **except** `.bg-grid`/`.bg-scan` (rgba-grayscale, not chromatic) — these utilities are the sanctioned exception. [addendum §0.3 #6]
- Lime is punctuation, not paint — `::selection` lime is a deliberate, bounded use. [addendum §0.3 #7]
- `yarn` only; never `--no-verify`. [project-context.md#Development Workflow]

### Testing standards for this story
- **No unit tests** — CSS utilities/tokens are not unit-tested (project-context: "Don't test Tailwind class strings"; no snapshot tests). Verification = `build` + compiled-CSS inspection + (recommended) live `yarn dev` glance. State in Completion Notes whether a browser check was possible. [project-context.md#Testing Rules / UI verification]

### Project Structure Notes
- Only `app/globals.css` edited. No new files, no deps. Aligns with architecture.md#Project Structure (`globals.css` owns `@layer base/utilities`, `::selection`, `.bg-grid`/`.bg-scan`). No structural variance.

## Previous-Story Intelligence (from Story 1.1)

Story 1.1 is `review` and its learnings directly shape this story:
- **`:root` is the single canonical dark palette** (no `.dark` value block); `--primary` = `--lime`, `--primary-foreground` = `--lime-foreground`. Use these for `::selection`.
- **`--shadow-*` currently hold cool-neutral `rgba(0,0,0,…)` values** in `:root` (1.1 kept them); this story flips them to `none`.
- **`::selection` was intentionally left inverted by 1.1** for this story to fix (deferred-work.md #1).
- **`yarn format` reflows ~15 pre-existing non-Prettier-clean files** (`app/layout.tsx`, several `components/ui/*`, `lib/content/*`, `lib/font.ts`, …). 1.1 restored them and formatted only its own file. **Do the same:** format only `app/globals.css`; if `yarn format` was run and touched others, `git checkout --` those back so the diff stays `app/globals.css` only.
- **Repo has zero test files** → `yarn test:run` exits 1 ("No test files found"). Pre-existing; not this story's job. The pre-commit gate is therefore not green on `test:run` until Epic 2 — do not attempt to fix it here.
- **No browser in the dev environment** → 1.1 verified via compiled-CSS inspection (lightningcss minifies `oklch()` to hex + `lab()` fallback). Use the same approach: grep the compiled CSS in `.next/static/chunks/*.css`.
- **Pre-existing `'inter' unused` lint warning in `app/layout.tsx`** — expected, not introduced here.

## Git Intelligence

- Recent commits: `cd5dd09` (content migration), `643002c` (theme refactoring — the partial repalette that seeded the dark tokens), `d58a15f` (starter). Story 1.1's `app/globals.css` change is in the working tree (status `review`), **not yet committed**. This story continues editing that same uncommitted file — expect `git status` to already show `M app/globals.css` before you start.

## References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.2] — story statement + ACs (selection / grid / scan / surface language).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md#0.1 Color tokens] — exact `::selection`, `.bg-grid`, `.bg-scan` CSS.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md#0.3 Aesthetic non-negotiables] — #1 no shadows / depth via bg steps, #2 ≤6px radius + XP-pill exception, #6 no gradients except grid/scan, #7 lime-as-punctuation.
- [Source: docs/design-system.md#4 Spacing & Layout] — "No heavy borders, no drop shadows on cards."
- [Source: docs/design-system.md#5 Surface Language] — radius ≤6px, `.bg-grid`/`.bg-scan` definitions, hero `opacity-40`/`opacity-60`, inverted `::selection`.
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture / Project Structure] — `globals.css` owns `@layer base/utilities`, `::selection`, `.bg-grid`/`.bg-scan`.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md #1] — `::selection` inversion fix (`background: var(--primary); color: var(--primary-foreground);`).
- [Source: _bmad-output/implementation-artifacts/1-1-rewrite-design-tokens-to-obsidian-signal-lime.md] — previous-story learnings (single-file workflow, format discipline, compiled-CSS verification, shadow tokens kept neutral).
- [Source: app/globals.css] — file being edited; `::selection` at EOF, `@utility scrollbar-*` pattern, `@theme inline` `--radius-xl`/`--shadow-*`, `:root` shadow values.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Opus 4.8)

### Debug Log References

- `yarn typecheck` → pass (clean).
- `yarn lint` → 0 errors, 1 pre-existing warning (`'inter' unused`, `app/layout.tsx` — untouched here).
- `yarn build` → "Compiled successfully"; 4 static pages, no new warnings.
- Compiled CSS (`.next/static/chunks/*.css`):
  - `::selection{background-color:var(--primary);color:var(--primary-foreground)}` (inverted lime; bogus `text-selection-color` removed).
  - `.bg-grid{background-image:linear-gradient(90deg,#ffffff0a 1px,#0000 1px),linear-gradient(#ffffff0a 1px,#0000 1px);background-size:48px 48px}` (`#ffffff0a` = white @≈4%).
  - `.bg-scan{background-image:repeating-linear-gradient(#0000 0 3px,#ffffff05 3px 4px)}` (`#ffffff05` = white @≈2%, 4px period).
  - `--shadow-2xs … --shadow-2xl` all `:none`; `--radius-xl:var(--radius)`.
- `git status` → only `M app/globals.css` in source (no format pollution).

### Completion Notes List

- **Single file changed: `app/globals.css`** (four scoped edits): (1) flipped `::selection` to inverted lime + removed the non-standard `text-selection-color` line; (2) added `.bg-grid` + `.bg-scan` as `@utility` blocks with the exact addendum §0.1 CSS; (3) set all eight `--shadow-*` tokens to `none`; (4) clamped `--radius-xl` from 10px → `var(--radius)` (6px).
- **Shadow neutralization applied as a token restyle** (not a primitive edit): shadcn `card`/`dialog`/`popover`/`dropdown-menu`/`sheet` now render flat, separated by `border-hairline` + `bg-surface`/`bg-popover` — the intended DevTools look (design-system §4–§5, addendum §0.3 #1). No `components/ui/*` file was touched. See Question 1 for a recommended visual check of floating menus.
- **`.bg-grid`/`.bg-scan` defined, not applied** — hero compositing (`opacity-40`/`opacity-60`) is Story 3.1. Used the project's `@utility` v4 idiom (matches `scrollbar-*`); the epics AC's "@layer utilities" wording is satisfied functionally (same `.bg-grid`/`.bg-scan` class output). See Question 2.
- **Scope discipline held:** color/typography/geometry token *values* from 1.1 untouched except the two AC3 changes (shadows, radius-xl). View-transition keyframes, `.mention`, `.animate-text`, scrollbar utilities, RTL overrides, dialog overflow rule all preserved.
- **Testing:** no unit tests — CSS utilities/tokens are not unit-tested (project-context). Verified via build + compiled-CSS inspection. No browser available in this environment, so the live "select text shows lime / texture renders" visual was confirmed through the compiled stylesheet rather than a real page; a quick `yarn dev` glance by Hossam is recommended.
- **Pre-existing repo conditions (unchanged, out of scope):** `yarn test:run` exits 1 ("No test files found"); ~15 non-Prettier-clean files would be reflowed by repo-wide `yarn format` (avoided — formatted only `globals.css`); `'inter' unused` lint warning in `app/layout.tsx`.
- **Stacking note:** both this story and Story 1.1 modify the same still-uncommitted `app/globals.css`; the working-tree diff now contains both stories' changes together.

### File List

- `app/globals.css` (modified)

### Review Findings

- [x] [Review][Defer] No findings specific to this story. The single `patch` finding (circular font variable) belongs to Story 1.1.

### Change Log

- 2026-05-30 — `app/globals.css`: fixed `::selection` to inverted lime (lime bg / dark fg), added `.bg-grid` + `.bg-scan` `@utility` background-texture utilities, neutralized all `--shadow-*` tokens to `none`, and clamped `--radius-xl` to the 6px max. Status → review. (claude-opus-4-8)

## Questions for Hossam (non-blocking — defaults chosen)

1. **Flat floating elements:** Setting `--shadow-*` to `none` means shadcn dropdowns / popovers / dialogs / sheets lose their drop shadow and rely on `border-hairline` + `bg-surface` for separation (the intended DevTools-flat look per design-system §4–§5). Confirm you're happy with flat floating menus, or whether you want a single subtle shadow reserved for true overlays. Default: fully flat, per spec.
2. **`@utility` vs `@layer utilities`:** Implemented `.bg-grid`/`.bg-scan` as `@utility` blocks to match the file's existing v4 convention (`scrollbar-thin`). The epics AC says "@layer utilities" — functionally identical class output. Default: `@utility`.
