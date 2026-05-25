---
title: 'Repalette to Obsidian + Lime (dark canon)'
type: 'refactor'
created: '2026-05-25'
status: 'done'
baseline_commit: 'd58a15faeee0ff6449139f0c7545d76c33f49773'
context:
  - '{project-root}/_bmad-output/project-context.md'
  - '{project-root}/docs/design-system.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `app/globals.css` ships warm cream `#fbf6ef` + terracotta `#c64a2b` tokens; the canonical `docs/design-system.md` mandates Obsidian + Signal Lime in OKLCH (dark-only); and the mono font is Geist Mono instead of IBM Plex Mono. Every future feature would build on the wrong visual foundation, then need rework.

**Approach:** Rewrite the `.dark` token block in `app/globals.css` to match `docs/design-system.md` §2 verbatim; add new brand tokens (`--lime`, `--surface`, `--hairline`, status colors) at `:root` level (theme-independent) and register them in `@theme inline` so Tailwind generates utilities; swap `Geist_Mono` → `IBM_Plex_Mono` in `lib/font.ts`; lock `defaultTheme="dark"` and drop `enableSystem` in `components/theme-provider.tsx`. `:root` light tokens stay as cream/terracotta *placeholder* (D-key toggle still works) until a real light palette is designed.

## Boundaries & Constraints

**Always:**
- New color values are OKLCH and match `docs/design-system.md` §2 verbatim — no hex, no approximations.
- New brand tokens (`--lime`, `--lime-foreground`, `--surface`, `--surface-2`, `--hairline`, `--status-ok`, `--status-warn`, `--status-err`, `--input-dark`) added at `:root` (theme-independent) AND registered in `@theme inline` as `--color-*` so utilities like `bg-lime` / `border-hairline` resolve.
- Shadcn semantic tokens (`--background`, `--card`, `--primary`, `--ring`, etc.) inside `.dark` map onto new brand values per the table in Design Notes.
- `--radius: 0.375rem` set in BOTH `:root` and `.dark` (foundation decision, not theme-scoped).
- ThemeProvider preserves `attribute="class"`, `disableTransitionOnChange`, and the `D` hotkey untouched; only `defaultTheme` becomes `"dark"` and `enableSystem` is removed.
- `lib/font.ts` keeps Inter, Fraunces, Tajawal, Almarai unchanged; only the mono import + initialization changes.

**Ask First:**
- Adding new utility classes (`.bg-grid`, `.bg-scan`, global `font-feature-settings`, lime `::selection`) — explicitly out of scope; new spec if a feature needs them.
- Touching `:root` (light) tokens beyond `--radius` — placeholder is intentional.
- Removing `* { color-scheme: light dark; }` — leave as-is unless asked.

**Never:**
- Don't reintroduce `tailwind.config.*` (Tailwind v4 forbids it).
- Don't create application visual code (page bodies, components) in this spec — token refactor only.
- Don't hand-edit shadcn primitives in `components/ui/*`.
- Don't add light-mode parallels of the new brand tokens — light is dead placeholder.
- Don't change `.dark` shadow values (already neutral `rgba(0,0,0,…)`).
- Don't import a new font family or remove Inter / Fraunces / Tajawal / Almarai.

</frozen-after-approval>

## Code Map

- `app/globals.css` -- Rewrite `.dark { ... }` block; extend `:root` with theme-agnostic brand tokens; extend `@theme inline` with new `--color-*` mappings; bump `--radius` in both blocks.
- `lib/font.ts` -- Swap `Geist_Mono` → `IBM_Plex_Mono`; keep `--font-mono` variable name; keep all other font imports.
- `components/theme-provider.tsx` -- `defaultTheme: "system"` → `"dark"`; remove `enableSystem` prop. `ThemeHotkey` body unchanged.
- `app/layout.tsx` -- Sanity-only; no edit expected. Note `Inter` is imported here too with `--font-sans` variable; leave intact.

## Tasks & Acceptance

**Execution:**
- [x] `app/globals.css` -- In `:root`, append brand tokens: `--lime: oklch(0.92 0.21 125)`, `--lime-foreground: oklch(0.18 0.02 260)`, `--surface: oklch(0.19 0.012 260)`, `--surface-2: oklch(0.225 0.014 260)`, `--hairline: oklch(1 0 0 / 8%)`, `--status-ok: oklch(0.85 0.18 145)`, `--status-warn: oklch(0.85 0.16 85)`, `--status-err: oklch(0.7 0.22 25)`, `--input-dark: oklch(0.13 0.012 260)`. Update `--radius: 0.375rem`.
- [x] `app/globals.css` -- Rewrite `.dark { ... }` shadcn token block per Design Notes mapping table; mirror `--radius: 0.375rem` here too. Keep `.dark` shadow values as-is.
- [x] `app/globals.css` -- Extend `@theme inline { ... }` with `--color-lime`, `--color-lime-foreground`, `--color-surface`, `--color-surface-2`, `--color-hairline`, `--color-status-ok`, `--color-status-warn`, `--color-status-err`, each `var(--<token>)`.
- [x] `lib/font.ts` -- Replace `Geist_Mono` import with `IBM_Plex_Mono` from `next/font/google`; instantiate with `subsets: ['latin']`, `weight: ['400', '500']`, `variable: '--font-mono'`. Keep `fontVariables` export structure.
- [x] `components/theme-provider.tsx` -- Change `defaultTheme="system"` → `defaultTheme="dark"`; delete the `enableSystem` line. `ThemeHotkey` body unchanged.
- [x] `lib/font.ts` + `app/globals.css` -- Rename mono variable to `--font-en-mono` in `lib/font.ts` (mirror `--font-en-base` / `--font-en-title` pattern); update `:root --font-mono` in globals.css to chain `var(--font-en-mono), ui-monospace, "SF Mono", Menlo, monospace`. Restores the cascade: next/font assigns `--font-en-mono`, `:root --font-mono` references it, `@theme inline --font-mono: var(--font-mono)` exposes the Tailwind utility. Without this, the existing `:root --font-mono: ui-monospace,…` override killed the IBM Plex Mono load. **(Loop 2 amendment — see Spec Change Log.)**

**Acceptance Criteria:**
- Given a fresh browser session (no `theme` localStorage) loads any route, when the page renders, then `<html>` carries `class="dark"` and `body` computed `background-color` is `oklch(0.155 0.012 260)`.
- Given dark mode is active, when inspecting `body` computed styles, then `color` is `oklch(0.96 0.005 260)`.
- Given dark mode, when a test element uses `bg-lime`, `bg-primary`, `border-hairline`, `bg-surface`, `bg-surface-2`, or `text-lime-foreground`, then each computed value matches the design-system.md §2 OKLCH (e.g. `bg-lime` → `oklch(0.92 0.21 125)`; `border-hairline` → `oklch(1 0 0 / 8%)`).
- Given mono text (`font-mono`), when the page loads, then `font-family` resolves through the IBM Plex Mono `--font-mono` variable and Geist Mono appears nowhere in computed styles or network requests.
- Given the user presses `D` outside an input/textarea/contenteditable, then `next-themes` toggles the `dark` class on `<html>` (parity preserved).
- Given `yarn typecheck && yarn lint && yarn build` runs, then all three pass with zero new errors.

## Spec Change Log

### Loop 2 — 2026-05-25 — bad_spec: font-mono cascade override

**Trigger:** Adversarial review (blind hunter #2) and edge-case review (parallel verification) flagged that `:root` in `app/globals.css:103` declares `--font-mono: ui-monospace, "SF Mono", Menlo, monospace;` directly — same selector + equal specificity as the next/font-injected class on `<html>` — and because globals.css is bundled after next/font CSS, the `:root` value wins the cascade. AC4 ("font-family resolves through the IBM Plex Mono `--font-mono` variable") therefore failed silently: the Tailwind `font-mono` utility renders system mono, never IBM Plex Mono. The same bug existed with Geist Mono pre-change; the spec did not surface it.

**Amendment:** Added a new execution task that renames `lib/font.ts`'s mono variable from `--font-mono` to `--font-en-mono` (mirroring the `--font-en-base` / `--font-en-title` pattern that DOES work) and updates `:root --font-mono` in globals.css to `var(--font-en-mono), ui-monospace, "SF Mono", Menlo, monospace` so the cascade chains correctly.

**Known-bad state avoided:** Shipping a Repalette whose mono font swap is functionally a no-op — the visible mono on every code/console/data-table surface would have remained system mono, masking the spec failure and forcing a re-fix later when the bug is noticed visually.

**KEEP (must survive re-derivation):**
- Mapping table values in Design Notes — verified verbatim against design-system.md §2 by acceptance auditor.
- Brand tokens at `:root` (theme-agnostic) decision.
- All `@theme inline` `--color-*` extensions.
- `.dark` shadcn token block as rewritten.
- `--radius: 0.375rem` in both blocks.
- `IBM_Plex_Mono` weights `['400', '500']` (matches design-system §3).
- ThemeProvider change (`defaultTheme="dark"`, no `enableSystem`).

## Design Notes

**Shadcn → brand-token mapping (inside `.dark` block):**

| shadcn token | new value |
|---|---|
| `--background` | `oklch(0.155 0.012 260)` |
| `--foreground` | `oklch(0.96 0.005 260)` |
| `--card` / `--popover` | `var(--surface)` |
| `--card-foreground` / `--popover-foreground` | `oklch(0.96 0.005 260)` |
| `--primary` | `var(--lime)` |
| `--primary-foreground` | `var(--lime-foreground)` |
| `--secondary` / `--accent` | `var(--surface-2)` |
| `--secondary-foreground` / `--accent-foreground` | `oklch(0.96 0.005 260)` |
| `--muted` | `var(--surface-2)` |
| `--muted-foreground` | `oklch(0.7 0.02 260)` |
| `--destructive` | `oklch(0.62 0.22 25)` |
| `--destructive-foreground` | `oklch(0.96 0.005 260)` |
| `--border` / `--input` | `var(--hairline)` |
| `--ring` | `var(--lime)` |
| `--chart-1` | `var(--lime)` |
| `--chart-2` | `oklch(0.75 0.15 200)` |
| `--chart-3` | `oklch(0.78 0.16 60)` |
| `--chart-4` | `oklch(0.7 0.22 25)` |
| `--chart-5` | `oklch(0.6 0.18 300)` |
| `--sidebar` | `oklch(0.155 0.012 260)` |
| `--sidebar-foreground` | `oklch(0.96 0.005 260)` |
| `--sidebar-primary` / `--sidebar-ring` | `var(--lime)` |
| `--sidebar-primary-foreground` | `var(--lime-foreground)` |
| `--sidebar-accent` | `var(--surface-2)` |
| `--sidebar-accent-foreground` | `oklch(0.96 0.005 260)` |
| `--sidebar-border` | `var(--hairline)` |

**Why brand tokens at `:root`:** Lime, surface, hairline, status colors are brand identity — not theme variants. Defining once at `:root` means utilities work regardless of theme, and a future light palette only swaps `--background` / `--foreground` family.

**Why drop `enableSystem`:** Dark is canonical. `enableSystem` would auto-flip to the unfinished cream/terracotta placeholder on machines preferring light — bad first impression while light is intentionally placeholder.

**IBM Plex Mono weights `['400', '500']`:** Matches design-system.md §3 ("400–500"). Avoids loading the full family.

## Verification

**Commands:**
- `yarn typecheck` -- expected: 0 errors
- `yarn lint` -- expected: 0 new errors (preexisting unrelated warnings OK)
- `yarn build` -- expected: success, no missing font / CSS errors

**Manual checks:**
- `yarn dev` → http://localhost:3000 → DevTools Elements: `<html class="dark">`, computed `body` background `oklch(0.155 0.012 260)`, color `oklch(0.96 0.005 260)`.
- DevTools Network: font requests include IBM Plex Mono; Geist Mono absent.
- In a temporary test element `<div class="bg-lime text-lime-foreground border border-hairline bg-surface bg-surface-2 bg-primary">x</div>` confirm computed colors match design-system values.
- Press `D` (outside any input) — `<html>` class toggles `dark` ↔ `light`; light shows cream/terracotta placeholder (expected).
- Clear `localStorage`, reload — defaults back to `dark` (no system flip).

## Suggested Review Order

**Brand tokens (the design system foundation)**

- New theme-agnostic brand vars — these are the names every future component will reach for (`bg-lime`, `border-hairline`, `bg-surface`).
  [`globals.css:115`](../../app/globals.css#L115)

- Tailwind v4 utility exposure — every brand token gets a `--color-*` alias so `bg-lime` etc. resolve.
  [`globals.css:41`](../../app/globals.css#L41)

**Dark palette swap (where the visual change happens)**

- Rewritten `.dark` block maps shadcn semantic tokens onto brand vars per design-system.md §2 verbatim.
  [`globals.css:137`](../../app/globals.css#L137)

- Radius shrunk to 6px in both blocks per design-system.md §5 ("technical/dev tool aesthetic").
  [`globals.css:170`](../../app/globals.css#L170)

**Font cascade (loop 2 fix — the subtle one)**

- Mono var renamed to `--font-en-mono` to mirror the working `--font-en-base` / `--font-en-title` pattern.
  [`font.ts:17`](../../lib/font.ts#L17)

- `:root --font-mono` now chains `var(--font-en-mono)` first, then system fallbacks. Without this chain the next/font assignment is cascade-lost.
  [`globals.css:112`](../../app/globals.css#L112)

**Theme provider lock**

- Default theme pinned to dark; `enableSystem` removed so a light-OS preference can't flip users into the cream placeholder.
  [`theme-provider.tsx:13`](../../components/theme-provider.tsx#L13)
