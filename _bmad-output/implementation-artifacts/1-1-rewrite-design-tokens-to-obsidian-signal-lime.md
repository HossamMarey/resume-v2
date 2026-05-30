# Story 1.1: Rewrite design tokens to Obsidian + Signal Lime

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Hossam (site owner),
I want `app/globals.css` rewritten to the canonical OKLCH dark-only token set,
so that the whole site renders in the devtools://hossam visual identity instead of the wrong cream/terracotta starter palette.

## Context & Orientation (read first)

This is the **first implementation story of the project** (Phase 1 Foundation). There is no previous story. The Next.js 16 + shadcn + `lib/content/*` + `lib/font.ts` foundation already exists; **this story does not scaffold anything** — it rewrites design tokens only.

**The single most important fact:** the correct Obsidian + Signal Lime OKLCH values **already exist** in `app/globals.css` inside the `.dark { … }` block (lines ~136–179), put there by the partial repalette in commit `643002c`. The cream/terracotta values in the `:root { … }` block (lines ~77–134) are the **wrong, leftover placeholder palette**. So this story is fundamentally a **consolidation to dark-only**: promote the already-correct `.dark` values to be the single canonical token set, delete the cream light-mode block, and fix the font cascade. You are **editing one file**: `app/globals.css`.

**Scope fence — what this story does NOT do (assigned to sibling stories):**
- `::selection` rule → **Story 1.2** (and it is currently inverted — see deferred-work.md #1 — do not "fix" it here).
- `.bg-grid` / `.bg-scan` utilities → **Story 1.2**.
- "No box-shadow / surface-depth" aesthetic enforcement → **Story 1.2**.
- `useShouldAnimate()`, `isTypingTarget()`, `<ComputedStylesPanel>` helpers → **Story 1.3**.
- Dexie/`fake-indexeddb` removal, `docs/plan.md` archive → **Story 1.4**.
- `lib/font.ts` is **NOT modified** — it already defines the correct next/font variables. You only reference them.

## Acceptance Criteria

1. **AC1 — Tokens defined in `@theme inline`, no light block, no config.**
   **Given** the project uses Tailwind v4 with no config file,
   **When** `app/globals.css` is authored,
   **Then** all color/typography/geometry tokens from addendum §0.1–0.2 are defined and exposed through `@theme inline { … }` (background, foreground, surface, surface-2, hairline, lime, lime-foreground, primary, primary-foreground, muted-foreground, status-ok/warn/err, destructive, destructive-foreground, chart-1..5, radius, border, input, ring; font-sans/title/mono), **and** there is **no** `:root` light-mode (cream/terracotta) block and **no** `tailwind.config.*` file anywhere in the repo.

2. **AC2 — Semantic utilities resolve to OKLCH tokens, zero hardcoded color in JSX.**
   **Given** the dark-only decision,
   **When** a component uses a semantic utility (`bg-background`, `text-foreground`, `border-hairline`, `bg-primary`, `text-muted-foreground`, `bg-surface`),
   **Then** it resolves to the OKLCH token value, and no hardcoded hex/oklch appears in JSX (verified for this story by confirming the token plumbing resolves — there is no JSX change in this story).

3. **AC3 — Fonts chain to the existing next/font CSS variables + font-feature-settings.**
   **Given** the font setup already exists in `lib/font.ts` (IBM Plex Mono / Inter / Fraunces / Tajawal / Almarai, exposing `--font-en-mono`, `--font-en-base`, `--font-en-title`, `--font-ar-base`, `--font-ar-title`),
   **When** tokens reference font families,
   **Then** `--font-sans` / `--font-title` / `--font-mono` **chain to the next/font CSS variables** (each next/font variable is the FIRST entry in the stack, with literal family names + system fallbacks after), the existing `[dir="rtl"]` swap to `--font-ar-*` is preserved, **and** `font-feature-settings: "ss01" on, "cv11" on` is set on `html, body`.

4. **AC4 — shadcn semantic tokens preserved; nothing visually breaks.**
   **Given** ~22 vendored shadcn primitives consume `--card`, `--popover`, `--secondary`, `--muted`, `--accent`, `--sidebar-*`, `--border`, `--ring`,
   **When** the cream block is removed and tokens consolidated,
   **Then** every shadcn semantic token still resolves (mapped to the obsidian/lime palette exactly as the current `.dark` block does: `card`/`popover` → `surface`, `secondary`/`muted`/`accent` → `surface-2`, etc.), and `yarn typecheck && yarn lint && yarn test:run && yarn build` all pass clean.

5. **AC5 — Live dark render verified.**
   **Given** the site is dark-only,
   **When** `yarn dev` is run and any route is loaded,
   **Then** the page renders on the Obsidian background (`oklch(0.155 0.012 260)`) with light foreground text, lime accents resolve via `bg-primary`/`text-primary`, there are **zero console errors/warnings**, and there is no flash of the cream palette on load.

## Tasks / Subtasks

- [x] **Task 1 — Consolidate to a single dark-only token source (AC1, AC4)**
  - [x] Remove the cream/terracotta `:root { … }` light block (current lines ~77–134), including its warm `rgba(36,31,27,…)` shadow stack and `--input-dark`.
  - [x] Promote the already-correct `.dark { … }` OKLCH values (current lines ~136–179) to be the single canonical token set in `:root` (so tokens apply with zero JS / no theme flash, static-first). Keep `next-themes` adding `.dark` on `<html>` (Story 2.4) — the `dark:` shadcn variant still resolves because `.dark` remains present; the canonical values just no longer depend on it.
  - [x] Confirm every token the current `@theme inline` maps still has a defined source value: `--background --foreground --card --card-foreground --popover --popover-foreground --primary --primary-foreground --secondary --secondary-foreground --muted --muted-foreground --accent --accent-foreground --destructive --destructive-foreground --border --input --ring --chart-1..5 --sidebar*` plus custom `--lime --lime-foreground --surface --surface-2 --hairline --status-ok --status-warn --status-err`.
  - [x] Remove `color-scheme: light dark;` on `*` (line ~181–183); the site is dark-only — set `color-scheme: dark` (on `:root`/`html`) instead.
- [x] **Task 2 — Set `--input` per the design system (AC1, AC4)** — DECISION, read Dev Notes §"`--input` clash"
  - [x] Set `--input: oklch(0.13 0.012 260)` (the darker-than-surface input background per addendum §0.1 / design-system §"Forms"). Drop the now-redundant `--input-dark`.
  - [x] Verify vendored `input.tsx` / `textarea.tsx` still look correct (their `border-input` now reads near-black-on-dark ≈ effectively a hairline; design-system intends explicit `border-hairline` + `focus:border-lime` for the metaphor, handled in later stories). If any primitive looks broken, note it in Completion Notes rather than restructuring the primitive.
- [x] **Task 3 — Fix the font cascade (AC3)**
  - [x] In `@theme inline`, expose `--font-sans`, `--font-title`, `--font-mono` (rename the current `--font-sans: var(--font-base)` indirection so the internal value var and the theme key are consistent — do not invent a new font; keep the existing working chain shape).
  - [x] Define the value chain so the **next/font variable is first**:
        `--font-sans:  var(--font-en-base), "Inter", ui-sans-serif, system-ui, sans-serif;`
        `--font-title: var(--font-en-title), "Fraunces", var(--font-en-base), serif;`
        `--font-mono:  var(--font-en-mono), ui-monospace, "Geist Mono", monospace;`
  - [x] Preserve the `[dir="rtl"]` block that swaps `--font-sans`/`--font-title` to `var(--font-ar-base)` / `var(--font-ar-title)` (currently keyed on `--font-base`/`--font-title` — keep it pointing at whatever the final value-var names are).
  - [x] Add `font-feature-settings: "ss01" on, "cv11" on;` to `html, body` inside `@layer base`.
- [x] **Task 4 — Set geometry (AC1)**
  - [x] Keep `--radius: 0.375rem` (6px max) and the existing `--radius-sm/md/lg/xl` calc derivations.
- [x] **Task 5 — Verify (AC4, AC5)**
  - [x] `yarn typecheck && yarn lint` pass (`yarn test:run` reports "No test files found" — pre-existing repo state, see Completion Notes).
  - [x] `yarn build` succeeds (Tailwind v4 compiles tokens; no missing-var warnings).
  - [x] Dark render verified via compiled CSS inspection (browser unavailable in this environment — see Completion Notes): Obsidian bg, light text, lime accents, no cream values.
  - [x] `yarn format` run; `app/globals.css` confirmed Prettier-clean.

## Dev Notes

### What is being changed (single file: `app/globals.css`)
- **Current state:** the file is in a *partial* state from commit `643002c`. It has (a) a cream/terracotta `:root` light block [WRONG — remove], (b) a `.dark` block already containing the correct Obsidian/Lime OKLCH values [CORRECT — promote], (c) a working `@theme inline` mapping `--color-*` → vars, (d) RTL font swap, (e) misc custom utilities (`scrollbar-thin`, view-transition reveal, `.mention`, `.animate-text`). 
- **What this story preserves untouched:** `@import "tailwindcss"` / `tw-animate-css` / `shadcn/tailwind.css`, the `@custom-variant dark`, the `@theme inline` radius/tracking/shadow *plumbing*, the scrollbar utilities, the RTL/`direction` overrides, and the dialog overflow rule. Do not gratuitously delete working utilities — this story is about *tokens*, not housekeeping (that's Story 1.4).
- **What this story must NOT touch:** the `::selection` rule (Story 1.2 — currently inverted per deferred-work.md #1; leaving it wrong here is correct), and there is no `.bg-grid`/`.bg-scan` to add here (Story 1.2).

### Canonical token values (authoritative — copy exactly)
From addendum §0.1–0.2; identical in design-system.md (verified, no conflict). These already match the current `.dark` block:
```
--background: oklch(0.155 0.012 260);   --foreground: oklch(0.96 0.005 260);
--surface:    oklch(0.19 0.012 260);    --surface-2:  oklch(0.225 0.014 260);
--hairline:   oklch(1 0 0 / 8%);
--lime:       oklch(0.92 0.21 125);     --lime-foreground: oklch(0.18 0.02 260);
--primary: var(--lime);                 --primary-foreground: var(--lime-foreground);
--muted-foreground: oklch(0.7 0.02 260);
--status-ok:  oklch(0.85 0.18 145);     --status-warn: oklch(0.85 0.16 85);   --status-err: oklch(0.7 0.22 25);
--destructive: oklch(0.62 0.22 25);     --destructive-foreground: var(--foreground);
--chart-1: var(--lime);  --chart-2: oklch(0.75 0.15 200);  --chart-3: oklch(0.78 0.16 60);
--chart-4: oklch(0.7 0.22 25);  --chart-5: oklch(0.6 0.18 300);
--radius: 0.375rem;
--border: var(--hairline);   --input: oklch(0.13 0.012 260);   --ring: var(--lime);
```
shadcn compatibility tokens (keep mapping as the current `.dark` block already does): `--card`/`--popover` → `var(--surface)`, `--secondary`/`--muted`/`--accent` → `var(--surface-2)`, plus their `*-foreground` → `var(--foreground)`, and `--sidebar*` → obsidian/lime values.

### The `--input` clash (real decision — resolve as instructed)
shadcn's convention treats `--input` as the **input border** color; addendum §0.1 / design-system define `--input` as the **input background** (`oklch(0.13 0.012 260)`, darker than surface). **Resolution: follow the addendum** — set `--input` to `oklch(0.13 0.012 260)`. The design-system styles inputs with explicit `bg-input` + `border-hairline` + `focus:border-lime` (a lime border, *not* a glow ring — aesthetic non-negotiable #4), so it does not rely on shadcn's border-input default. On a dark surface a near-black border is visually a hairline, so vendored inputs degrade gracefully. Note any primitive that looks off in Completion Notes; do **not** restructure `components/ui/*` (forbidden boundary). This satisfies AC1's explicit `--input` requirement.

### Font cascade — DO NOT lose the next/font chain (known footgun)
`lib/font.ts` exposes next/font families **only** through CSS variables `--font-en-base`, `--font-en-title`, `--font-en-mono`, `--font-ar-base`, `--font-ar-title` (auto-generated hashed family names). The literal strings in addendum §0.2 (`"Inter Variable"`, `"Fraunces Variable"`, `"IBM Plex Mono"`) will **not** resolve to the loaded fonts on their own — the `var(--font-en-*)` reference must be the first entry in each stack, with literals/system fonts as fallbacks. If you replace the chain with literal names only, the loaded next/font assignment is silently lost and the browser falls back to system fonts. This is a previously-burned pattern — preserve `--font-en-*`/`--font-ar-*` as the primary references.

### Dark-only rationale (why `:root`, not `.dark`)
`next-themes` is configured (or will be, Story 2.4) with `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`. It adds `.dark` to `<html>`. Putting the canonical values in `:root` (not gated behind `.dark`) means correct colors paint **before hydration and with JS disabled** (static-first; supports the no-flash AC5 and the no-JS-paint requirement of Story 2.1). Keep `.dark` present on `<html>` so the `@custom-variant dark` and any `dark:` utilities inside vendored primitives still match — you simply don't need a separate `.dark` value block anymore. (If you prefer to keep both `:root` and an identical `.dark` block for shadcn-template familiarity, that is acceptable but redundant; the reviewer's bar is "no cream block, single canonical dark palette, no flash.")

### Project guardrails that bite in this story
- Tailwind v4: tokens in `app/globals.css` `@theme inline` only — **never** create `tailwind.config.*` (anti-pattern). [Source: project-context.md#Tailwind v4 + shadcn]
- Dark-only: **no light-mode `:root` block** (anti-pattern: "Adding a light-mode color block"). Print stylesheet (Story 7.3) is the only light surface, out of scope here. [Source: addendum §8; project-context.md]
- No hardcoded hex/oklch in JSX — palette changes happen only in `globals.css`. (No JSX touched here.) [Source: architecture.md#Enforcement Guidelines]
- `yarn` only; pre-commit gate `yarn typecheck && yarn lint && yarn test:run && yarn format`; never `--no-verify`. [Source: project-context.md#Development Workflow]
- Lime is a punctuation color, never a paint color — do not widen lime usage. [Source: addendum §0.3 #7]

### Testing standards for this story
- There is **no unit test** for raw CSS token values (project-context: "Don't test Tailwind class strings"). Verification for this story is the **build + lint + typecheck pass** plus the **live `yarn dev` visual check** (AC5). Tests/typecheck verify code, not visual correctness — state explicitly in Completion Notes that the dark render + no-cream-flash + zero-console-errors were visually confirmed (or that you could not run a browser, if so). [Source: project-context.md#UI verification]
- Do **not** add snapshot tests. [Source: project-context.md#Testing Rules]

### Project Structure Notes
- Only `app/globals.css` is edited. `lib/font.ts` is referenced, not modified. No new files. No dependency changes. Aligns 1:1 with architecture.md#Project Structure (`app/globals.css` is the design-token source). No structural variance.

### References
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1] — story statement + ACs.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md#0.1 Color tokens] — authoritative color token values.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md#0.2 Typography tokens] — font tokens + `font-feature-settings`.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md#0.3 Aesthetic non-negotiables] — radius ≤6px, no shadows (1.2), lime-as-punctuation, dark-input #4.
- [Source: docs/design-system.md#tokens] — canonical OKLCH table (matches addendum exactly).
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontend Architecture] — dark-only theme config; token-only styling.
- [Source: _bmad-output/project-context.md#Tailwind v4 + shadcn / Resolved Decisions #1] — token rewrite mandate; no tailwind.config; dark-only.
- [Source: _bmad-output/implementation-artifacts/deferred-work.md #1, #4] — `::selection` inversion deferred to 1.2; warm shadow tokens removed with cream block.
- [Source: app/globals.css:136–179] — `.dark` block already holds correct target values (from commit `643002c`).
- [Source: lib/font.ts] — next/font variables `--font-en-*` / `--font-ar-*` that the cascade must chain.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Opus 4.8)

### Debug Log References

- `yarn typecheck` → pass (tsc --noEmit, clean).
- `yarn lint` → 0 errors, 1 pre-existing warning (`'inter' unused` in `app/layout.tsx` — not touched by this story).
- `yarn test:run` → "No test files found, exiting with code 1" — the repo currently contains zero test files (pre-existing).
- `yarn build` → "Compiled successfully"; 4 static pages generated, no missing-var / circular-var warnings.
- Compiled-CSS inspection (`.next/static/chunks/*.css`, minified by lightningcss to hex + lab() fallback):
  `--background:#090c11` (Obsidian), `--foreground:#f0f2f5` (near-white), `--lime:#c5fb41` (Signal Lime),
  `--input:#05070c` (darker than surface), `font-feature-settings: "ss01" on,"cv11" on` present,
  `--font-sans: var(--font-en-base),"Inter",…` chain intact, RTL `--font-ar-base` swap intact, **no `fbf6ef`/`c64a2b`/`#241f1b` (cream/terracotta) anywhere**.

### Completion Notes List

- **Single file changed: `app/globals.css`.** Implemented as a consolidation, not a from-scratch rewrite: the correct Obsidian/Lime OKLCH values already existed in the `.dark` block (commit `643002c`); promoted them into a single canonical `:root` (paints with zero JS / no theme flash), deleted the cream/terracotta light block, removed `* { color-scheme: light dark }` in favor of `color-scheme: dark` on `:root`.
- **Font cascade (the known footgun):** `--font-sans/title/mono` chain `var(--font-en-*)` FIRST, then literal families + system fallbacks; verified in compiled CSS that the `--font-en-base` reference survived. `[dir="rtl"]` swap rekeyed to `--font-sans`/`--font-title`. `font-feature-settings: "ss01"/"cv11"` added to `html, body`. `lib/font.ts` NOT modified.
- **`--input` decision applied:** set to `oklch(0.13 0.012 260)` per addendum §0.1 / design-system (input *background* darker than surface), overriding shadcn's border-color convention; dropped the redundant `--input-dark`. Vendored `input.tsx`/`textarea.tsx` were not restructured (forbidden boundary); their `border-input` now reads as a near-black hairline on the dark surface, which is acceptable until the design-system's explicit `bg-input`+`border-hairline`+`focus:border-lime` styling lands in a later story.
- **Defensive fix in scope:** added `--letter-spacing: 0em;` to `:root`. The `@theme inline` `--tracking-*` calcs reference `var(--letter-spacing)`, which was previously undefined (would make `tracking-tight`/`tracking-wider` resolve to invalid `calc()`); the hero (Story 3.1) needs `tracking-tight`. This is a typography-token fix within AC scope.
- **Scope discipline:** `::selection` left untouched (still the inverted rule — deferred-work.md #1 → Story 1.2). No `.bg-grid`/`.bg-scan` added (Story 1.2). View-transition `reveal` keyframes / `.mention` / `.animate-text` / scrollbar utilities / RTL `direction` overrides / dialog overflow rule all preserved verbatim (housekeeping is Story 1.4).
- **Testing:** no unit tests added — per project-context.md ("don't test Tailwind class strings / CSS token values; no snapshot tests"), CSS design tokens are verified by build + compiled-CSS inspection, not Vitest. Verification of "zero console errors" and "no cream flash" was done via the compiled stylesheet (Obsidian tokens present, cream absent) because a browser is not available in this environment — a live `yarn dev` visual confirmation by Hossam is recommended as a sanity check.
- **Pre-existing repo conditions surfaced (NOT addressed here — out of scope):** (1) `yarn test:run` fails with "No test files found" — the pre-commit gate will block commits until the first tests land (Epic 2 XP property tests); (2) `yarn format` reformats ~15 pre-existing non-Prettier-clean files (`app/layout.tsx`, several `components/ui/*`, `lib/content/*`, `lib/font.ts`, etc.) — these were restored to their committed state so this story's diff is `app/globals.css` only; a repo-wide format belongs in a chore/cleanup pass. (3) `app/layout.tsx` lint warning (`'inter' unused`).

### File List

- `app/globals.css` (modified)

### Review Findings

- [x] [Review][Patch] Circular font variable reference in `@theme inline` (`app/globals.css:51`) — Fixed: restored `--font-base` indirection. `@theme inline` now maps `--font-sans: var(--font-base)`; `:root` defines `--font-base` with the English stack; RTL block overrides `--font-base` with the Arabic stack. Eliminates the self-reference fragility.

### Change Log

- 2026-05-30 — Rewrote `app/globals.css` to the canonical Obsidian + Signal Lime OKLCH token set, dark-only. Removed the cream/terracotta light `:root` block; consolidated canonical values into a single `:root`; fixed the next/font cascade and added `ss01`/`cv11` font features; set `--input` to the dark input background; added `--letter-spacing` to repair `tracking-*` utilities. Status → review. (claude-opus-4-8)

## Questions for Hossam (non-blocking — defaults chosen)

1. **`--input` value:** Story sets `--input: oklch(0.13 0.012 260)` per addendum (input *background*), overriding shadcn's border-color convention. Confirm this is intended (the design system's input styling supports it). Default: proceed as specified.
2. **`:root` vs `.dark` for canonical values:** Story folds the canonical palette into `:root` for no-flash/no-JS paint, keeping `.dark` on `<html>` only for the `dark:` variant. Confirm you don't want to retain a duplicate `.dark` value block for shadcn-template familiarity. Default: single `:root` block.
3. **View-transition `reveal` keyframes + `.animate-text` / `.mention`:** these survive from the wrong-palette era and relate to a theme-toggle wave that is now a dark-only no-op. Left in place this story (housekeeping is Story 1.4). Flag if you'd rather remove them now.
