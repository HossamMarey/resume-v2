---
title: "PRD ↔ design-system.md reconciliation"
project: web
created: 2026-05-25
canonical_source: docs/design-system.md
reconciled_targets:
  - _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md
  - _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md
verdict: PARTIAL — IA, motion, a11y, content-model intent largely intact; visual token specificity, typography stack, and key component patterns lost.
---

# Reconciliation — PRD vs. `docs/design-system.md`

## Verdict summary

The PRD/addendum carry the **conceptual** design system forward well: the DevTools metaphor, route → tab mapping, gamification rules, motion philosophy, and a11y rules all transfer cleanly. What does **not** transfer is the **visual specificity** — the OKLCH palette values, the named tokens, the typography stack, the component-pattern recipes (especially the "Computed-styles cell" panel effect and the chip/kbd styles), and several CSS utilities. The PRD reads like an intent doc; an implementer would have to keep `docs/design-system.md` open at all times to actually build the surfaces. There is also a direct **typography stack contradiction** between the two docs that needs resolution before P1.

Severity legend: 🚨 BLOCKING (must reconcile before build starts) · ⚠️ GAP (significant info loss; should be added) · 📎 MINOR (nice-to-have; acceptable if design-system.md remains source-of-truth).

---

## 1. Palette tokens — OKLCH values + names

**Spec (design-system.md §2):** 12 named CSS custom properties with explicit OKLCH values, plus 5 chart tokens, plus 3 traffic-light values. Every token is named (`--background`, `--surface`, `--surface-2`, `--hairline`, `--lime`, `--lime-foreground`, `--primary`, `--muted-foreground`, `--status-ok`, `--status-warn`, `--status-err`, `--destructive`, `--chart-1`..`--chart-5`).

**PRD coverage:**
- ✅ Names referenced: `--status-ok`, `--status-warn`, `--status-err` (FR-022); `border-hairline` (FR-003); `border-lime`, `text-muted-foreground` (FR-003); `bg-lime` (addendum print stylesheet).
- ❌ **No OKLCH values appear anywhere** in PRD or addendum. The phrase "Obsidian + Lime tokens" appears once (P1 phase) and "Obsidian + Signal Lime" once (Appendix A) — neither defines the values.
- ❌ `--surface`, `--surface-2`, `--foreground`, `--lime-foreground`, `--primary`, `--destructive` are not mentioned anywhere.
- ❌ Chart palette (`--chart-1`..`--chart-5`) is partially translated as informal color hints in FR-021 ("cyan", "orange", "purple") — the actual OKLCH chart tokens are not named.
- ❌ Traffic-light values (top chrome dot colors) — not mentioned at all.

**Status: 🚨 BLOCKING.** A Phase 1 task says "Rewrite `app/globals.css` to Obsidian + Lime tokens" with no token list inline. The implementer must read `docs/design-system.md` separately or reverse-engineer from `src/styles.css`.

**Recommended fix:** Add a "Visual tokens (canonical reference)" subsection under PRD §6 (or a new Appendix C) that either inlines the full §2 table from design-system.md or — at minimum — names every token the implementer needs to author and points at the canonical file.

---

## 2. Typography stack — **direct contradiction**

**Spec (design-system.md §3):**
- Sans body: **Inter** (400–600)
- Sans titles: **Fraunces** (400–600)
- Mono: **IBM Plex Mono** (400–500)
- Font features: `"ss01", "cv11"` global

**PRD coverage:**
- PRD P1 phase row: *"Swap fonts (IBM Plex Mono + Inter Tight)"* — calls out **Inter Tight**, not **Inter**, and omits **Fraunces** entirely.
- Addendum §6 print stylesheet: `font-family: "Inter Tight", system-ui, sans-serif` — confirms PRD intends **Inter Tight** as the sans family.
- ✅ IBM Plex Mono is consistent.
- ❌ Fraunces (titles) — **completely absent** from PRD and addendum. The hero H1 (FR-010) specifies a size (`clamp(2rem, 10vw, 6rem)`) with no font assigned, so by default Inter Tight would be used → loses the serif/sans contrast that is a load-bearing piece of the visual identity.
- ❌ Font-feature settings (`ss01`, `cv11`) — not mentioned.

**Status: 🚨 BLOCKING contradiction.** The user's task brief explicitly flagged this. There are **two** disagreements:
1. **Inter** (canonical) vs **Inter Tight** (PRD). These are different Google Fonts families — Inter Tight is a tighter-default-tracking variant of Inter and is not what design-system.md specifies.
2. **Fraunces titles** present in canonical, missing in PRD.

**Recommended fix:** Pick one direction explicitly. Either (a) update design-system.md if Hossam genuinely intends Inter Tight + drop Fraunces (which would simplify but lose the serif accent), or (b) update the PRD P1 row to read *"Swap fonts (IBM Plex Mono + Inter + Fraunces)"* and add a typography FR under §5 referencing the §3 scale table. Until resolved, the implementer will guess.

---

## 3. Content model — `Profile` and `Project` schemas

**Spec (design-system.md §13):**
- `Profile`: `name`, `role`, `location`, `email`, `tagline`, `years`, `socials[]` (`{label, href}`), `principles[]` (`{key, title, body}`), `metrics[]` (`{label, value, suffix}`).
- `Project`: `slug`, `name`, `org`, `method` (GET/POST/PUT/PATCH), `status` (shipped/ongoing/archived), `statusCode` (200, 201), `type`, `size`, `sizeWeight` (0–1), `time`, `timeWeight`, `startOffset`, `year`, `stack[]`, `problem`, `role`, `decisions[]`, `outcomes[]`, `links[]`.

**Addendum §1.1 coverage (Zod schemas):**
- ✅ `ProfileSchema` — every field present, names exact (`name`, `role`, `location`, `email`, `tagline`, `years`, `socials`, `principles`, `metrics`).
- ✅ `SocialSchema`, `PrincipleSchema`, `MetricSchema` — exact field names match (`label`/`href`; `key`/`title`/`body`; `label`/`value`/`suffix`).
- ✅ `ProjectSchema` — every spec'd field present (`slug`, `name`, `org`, `method`, `status`, `statusCode`, `type`, `size`, `sizeWeight`, `time`, `timeWeight`, `startOffset`, `year`, `stack`, `problem`, `role`, `decisions`, `outcomes`, `links`).
- ➕ Additions beyond spec: `ProjectLinkSchema` typed as `{ label: enum, href }` (spec only says `links[]`), `featured: boolean`, `meta: { mock: boolean }`. These are **additive and defensible** (`featured` enables `/recruiter` 6-project surfacing; `meta.mock` enables the §7.4 mock-content launch gate). 📎 Should be noted as PRD-driven extensions of the canonical schema.
- ➕ Additions: `ExperienceSchema`, `SkillSchema` — addendum explicitly notes these are not in design-system.md §13 and infers them from `lib/data/index.ts`. Reasonable extension.
- ⚠️ `statusCode` enum: spec says "200, 201" (and the migration table extends to 410 for archived). PRD FR-022 specifies `200 shipped / 201 ongoing / 410 archived`. Schema types `statusCode` as open `z.number().int()` — no enum constraint. 📎 Should probably be `z.literal(200).or(z.literal(201)).or(z.literal(410))` to lock the contract.

**Status: ✅ MATCHES with documented extensions.** Best-preserved section in the reconciliation.

---

## 4. Component patterns

**Spec (design-system.md §6):** Buttons (5 variants with full Tailwind class strings), data table grid template, panels (the **"Computed-styles cell" effect** — `bg-hairline` outer + `gap-px` + `bg-surface` children), inputs (specific oklch background), chips, kbd.

**PRD coverage:**
- ✅ Primary lime button visual intent referenced via "Inspect me" CTA (FR-010); active tab styling exact (`border-b-2 border-lime`) in FR-003; inactive tab styling exact in FR-003.
- ⚠️ Outline button — not referenced as a pattern. ("Clear filters", FR-027, would use it; no class hint.)
- ⚠️ Chip/tag — referenced as concept ("chips from `stack[]`", FR-031) but no class recipe carried over. The spec's `rounded border border-hairline px-2 py-1 font-mono text-[11px]` is lost.
- ⚠️ Data table grid columns — PRD FR-020 paraphrases the columns (`method | name | type | status | size | time | waterfall-bar`) but loses the exact CSS Grid template (`grid-cols-[60px_1.4fr_0.9fr_90px_90px_90px_1.4fr]` with `gap-2`).
- 🚨 **Panel-as-CSS-grid-with-gap "Computed-styles cell" effect — entirely absent.** This is the spec's signature treatment for all content panels (outer `bg-hairline` + internal `gap-px` + children `bg-surface` to create separator-lines-as-background). Without it, the implementer will reach for `border-b` between rows and the panel aesthetic will lose its DevTools-cell feel. **Most important visual gap in the entire reconcile.**
- ⚠️ `<kbd>` styling (spec: `rounded border border-hairline px-1.5 py-0.5`) — referenced indirectly (FR-090 mentions `⌘K`) but no kbd-style FR. Discoverability hints in chrome (mentioned in F11) would need kbd treatment.
- ⚠️ Input pattern (spec: `bg-[oklch(0.13_0.012_260)]` darker-than-surface, `font-mono text-sm`, lime focus border) — REPL (F5) and contact form (F8) both need inputs; neither FR specifies the visual recipe.
- ✅ XP bar height/width/color (spec: `h-1`, `w-16` mobile / `w-32` desktop, `bg-lime`, spring) — FR-076 says "Spring animation on width via `motion/react`" + chrome bar concept; exact dimensions not in PRD but `bg-lime` color implied. 📎 dimensions missing.

**Status: ⚠️ GAP, with one 🚨 BLOCKING omission (panel pattern).**

**Recommended fix:** Add a "Component patterns (canonical)" subsection cross-referencing design-system.md §6 by row; or, at minimum, an FR per component family that names the pattern by reference: "Panels render with the 'Computed-styles cell' treatment per design-system.md §6." That's enough for an LLM agent or implementer to fetch the recipe.

---

## 5. Page-level visual treatments per route

**Spec (design-system.md §12):** Each route maps to a DevTools tab + content description (e.g., "Network detail" for `/work/$slug`, file tree for `/sources` etc.).

**PRD coverage:**
- ✅ Route → tab mapping carried 1:1 in §4 IA table.
- ✅ Hero background combo (`.bg-grid` + `.bg-scan` at `opacity-40` / `opacity-60`) — captured in FR-013.
- ✅ Network waterfall column order — captured in FR-020.
- ✅ Mobile waterfall card layout — captured in FR-020 + NFR-R2.
- ⚠️ Performance score-ring visual treatment — FR-050 names them as "à la Lighthouse" but doesn't capture the ring-draw animation timing (spec §7: 1.1s `useInView` once, `easeOut`) which is the visible polish. Animation timing **is** in PRD §F9/F2 motion descriptions but not bound to the ring component.
- ⚠️ Sources file-tree visual — FR-060/061 specifies layout (left pane / right pane) but no class hints. Spec doesn't give a class either, so this is a wash — but the desktop tree column width (`220px` sidebar + `1fr` content, spec §4) is lost.
- ⚠️ "Console" REPL terminal aesthetic — FR-040 says "terminal-style" but no class recipe; spec doesn't define one either. Acceptable.
- ⚠️ Network waterfall **bar render rule** — spec §6 inputs row + PRD FR-024 both say "`transform: scaleX()` only, never `width`" — ✅ captured. NFR-P5 reinforces. Good.

**Status: ⚠️ minor gaps, route-level largely intact.**

---

## 6. Accessibility & motion

**Spec (design-system.md §7 + §11):** `prefers-reduced-motion` collapses every animation to `0.001ms`; focus rings via `focus-visible:ring-1 focus-visible:ring-ring`; semantic HTML (`<article>`, `<nav>`, `<main>`, single `<h1>`); ARIA labels; lime-on-obsidian large text only.

**PRD coverage:**
- ✅ NFR-A1: WCAG 2.1 AA + lime-on-obsidian large-text-only rule (exact).
- ✅ NFR-A2: focus rings (`focus-visible:ring-1 focus-visible:ring-ring`) verbatim.
- ✅ NFR-A3: `prefers-reduced-motion` gates every animation, with explicit "XP bar fill still updates (instant); toasts hidden; tab transitions instant" — **more specific than spec** in places. Good elaboration.
- ✅ NFR-A4: semantic HTML — one `<h1>` per route, `<nav>`, `<article>`, `<button>` not `<div onClick>` — verbatim.
- ✅ FR-076 / FR-077: XP bar + toast both gated on reduced-motion.
- ✅ FR-081: Konami buffer skips input/textarea/contenteditable targets (matches design-system.md §11 keyboard rule + reference to existing `ThemeHotkey` pattern).
- ➕ NFR-A5 (`alt` on every img; never `<img>`, always `next/image`) — extension beyond spec, defensible.
- ➕ NFR-A6 (print stylesheet for `/recruiter`) — extension beyond spec, defensible.

**Status: ✅ MATCHES + DEFENSIBLE EXTENSIONS.** Best-preserved section after the content model.

---

## 7. CSS utilities — `.bg-grid`, `.bg-scan`, `::selection`

**Spec (design-system.md §5):**
- `.bg-grid` — 48px CSS grid lines at 4% white.
- `.bg-scan` — 4px horizontal scanlines at 2% opacity (CRT effect).
- `::selection` — lime background, dark foreground (inverted).
- Border-radius scale: `--radius: 0.375rem` max; `rounded-sm` for small UI; no large rounded corners.

**PRD coverage:**
- ✅ `.bg-grid` and `.bg-scan` — captured in FR-013 with exact pixel sizes (48px / 4px) and opacities (4% / 2%) inherited from §5 prose. Good.
- ❌ `::selection` styling — **not mentioned anywhere** in PRD or addendum. Small but pure aesthetic; would otherwise default to browser blue.
- ❌ Border-radius scale (`--radius: 0.375rem` max, no-large-corners rule) — **not mentioned**. An implementer reaching for `rounded-xl` would silently break the "technical/dev tool aesthetic" intent (spec §5: "No large rounded corners").

**Status: ⚠️ GAP.** Both omissions are small individually but together they erode the "this is a panel, not a marketing card" vibe.

**Recommended fix:** Add an FR under F1 or a new "Surface language" subsection: "All radii ≤ 6px; no `rounded-lg`/`rounded-xl`. `::selection` uses inverted lime/dark per design-system.md §5."

---

## 8. Visual-intent items the user explicitly flagged

| Item flagged in task brief | Spec location | PRD status |
|---|---|---|
| Drop-shadow policy ("No drop shadows on cards") | design-system.md §4 | ❌ Not mentioned in PRD/addendum. A future implementer with Tailwind muscle memory will reach for `shadow-md` on cards. **⚠️ GAP.** |
| Hairline-only borders ("default border treatment; no heavy borders") | design-system.md §4 | ⚠️ Token name `border-hairline` referenced (FR-003), but the "default for everything; no heavy borders" rule is not stated as a constraint. **⚠️ GAP — soft.** |
| "Computed-styles cell" panel effect | design-system.md §6 (Panels) | ❌ Entirely absent. **🚨 BLOCKING (most important aesthetic omission).** |
| Lime-on-obsidian large-text-only contrast rule | design-system.md §11 | ✅ Captured verbatim in NFR-A1. |
| `transform: scaleX()` only for waterfall bars | design-system.md §6 + §7 | ✅ Captured in FR-024 and NFR-P5. |

---

## 9. Other deltas worth noting

- **Tagline:** spec §1 gives an exact tagline ("I build fast, accessible interfaces for data-heavy products — then teach how it was done."). PRD FR-010 references `tagline` as a `Profile` field without quoting the canonical string, and §7.2 lists `tagline` as "must be authored." → 📎 The canonical tagline is silently being treated as un-authored; either author it into `Profile.tagline` defaulting to the spec string, or note explicitly in PRD that the spec tagline is a starting draft.
- **Konami `experimental` reward:** spec §8 says Konami unlocks "an 'Experimental' tab in the nav." PRD FR-082 instead surfaces it as a REPL command + a ⌘K palette entry, not a nav tab. → 📎 Intentional simplification (fewer surfaces to maintain); should be flagged as a spec departure in the decision log.
- **Chrome XP bar dimensions:** spec gives `h-1`, `w-16` mobile / `w-32` desktop. PRD does not. 📎 minor.
- **Persistent chrome composition:** spec §1 ("The chrome persists across routes") — PRD §4 captures this well ("chrome stays mounted across tab switches; route transitions animate, do not full-reload"). ✅
- **Mobile bottom-tab-bar:** PRD FR-004 introduces a mobile bottom tab bar with safe-area-inset. Spec §10 only says "Tab nav: `overflow-x-auto` with hidden descriptions" for mobile — i.e., **the spec keeps the top tab nav and just makes it scrollable**, while the PRD swaps it for a bottom bar. **⚠️ Departure from spec — should be flagged.** Bottom bar is a defensible mobile UX choice but it's a real design change, not just an implementation detail.
- **REPL command list:** PRD FR-041 adds `clear` and `download resume` to the canonical command set. Spec §9 / §12 don't enumerate REPL commands beyond Konami `experimental`. ✅ defensible extension.

---

## 10. Prioritized fix list

| Priority | Action | Owner |
|---|---|---|
| 🚨 1 | **Resolve typography contradiction** — Inter Tight (PRD) vs Inter + Fraunces (spec). Pick one; update the losing doc. | Hossam |
| 🚨 2 | **Add palette token reference to PRD** — either inline the §2 OKLCH table or add an Appendix C linking to design-system.md and naming every token P1 must author. | PRD author |
| 🚨 3 | **Add the "Computed-styles cell" panel pattern** as an explicit PRD FR or visual-language subsection. Lose this and the surfaces look generic. | PRD author |
| ⚠️ 4 | Add an FR (or §6 subsection) covering: drop-shadow ban, hairline-only borders default, max radius 6px, `::selection` lime-inverted. | PRD author |
| ⚠️ 5 | Flag the mobile-bottom-tab-bar (FR-004) as an **intentional departure** from design-system.md §10. Decide and document. | Hossam |
| 📎 6 | Tighten `Project.statusCode` schema to enum `200 \| 201 \| 410`. | Schema author (P1) |
| 📎 7 | Either author canonical tagline into `Profile.tagline` default, or explicitly mark the spec tagline as draft. | Hossam |
| 📎 8 | Add chip + kbd + outline-button + input class recipes by reference ("per design-system.md §6") to the FRs that need them. | PRD author |
| 📎 9 | Note the Konami reward departure (REPL command + palette entry, not a new nav tab) in the decision log. | PRD author |
| 📎 10 | Capture font-feature settings (`ss01`, `cv11`) in the typography FR added in fix #1. | PRD author |

---

## 11. What carries forward cleanly (credit where due)

- Concept positioning + DevTools metaphor — landed.
- Route → tab IA table — exact.
- Motion timings + reduced-motion gating — captured with elaboration (better than spec in places).
- A11y rules — captured verbatim and extended sensibly.
- Content-model schemas — every field present, names exact, additions are defensible.
- Hero `.bg-grid` + `.bg-scan` combo with exact opacities — captured.
- Waterfall `transform: scaleX()` perf rule — captured and reinforced.
- Recruiter Mode behavior (chrome unmounted, not CSS-hidden) — captured with more specificity than spec.

---

## Closing assessment

The PRD/addendum is **structurally faithful** to the canonical design system — the IA, content model, motion philosophy, and a11y rules all transfer cleanly, often with helpful elaboration. The losses are concentrated in **visual specificity**: token values, the typography stack (with one direct contradiction), the panel "cells" pattern, and the small CSS utilities (`::selection`, radii, drop-shadow ban). These are the things that make the surfaces *feel* like DevTools rather than a generic dark portfolio. An implementer working from the PRD alone will get the structure right and the polish wrong.

Fix the four 🚨/⚠️ items above and the PRD becomes self-sufficient. Until then, `docs/design-system.md` must remain open during P1–P4 build phases.
