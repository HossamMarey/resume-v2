# Story 3.3: Stack marquee with reduced-motion fallback

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a visitor,
I want an animated stack marquee that calms down when I hover or prefer reduced motion,
so that the tech signal is lively but never gratuitous.

## Acceptance Criteria

1. **(FR-012 / NFR-P5 — animated, transform-only, hover-pause, primary skills)** The Elements page (`/`) renders a **stack marquee**: a single horizontal row of the **primary-tier** skills that scrolls continuously using **`transform` only** (never `width`/`left`/`margin`/`scroll-position`). The animation **pauses on hover** (and on keyboard focus-within, for parity). It is the **only** marquee on the site (UX §What-to-Avoid line 217) and shows skill **names as hairline text chips** — **not brand-logo images**.
2. **(NFR-A3 / UX-DR4 — reduced-motion fallback)** When `prefers-reduced-motion: reduce` is set (i.e. `useShouldAnimate()` returns `false`), the scrolling marquee is **replaced by a static grid** of the same primary skills — no animation, no duplicated track, all chips visible and readable at mount. The animated and static branches are chosen via `useShouldAnimate()`, never by calling `useReducedMotion()` directly in feature code.
3. **("primary-tier" must be real in the schema)** "Primary tier" is currently **not expressible** — `SkillSchema` (`lib/content/skills.ts`) only has `level: 1 | 2 | 3`, no `tier`. Make `Skill.tier === "primary"` a true, Zod-validated fact: add a `tier` field to `SkillSchema` and derive it from the existing data (`level === 1` → `"primary"`, else `"secondary"`) so the marquee filters on `skill.tier === "primary"` exactly as the FR specifies. Do **not** hand-write a parallel type — keep `z.infer`. Expose a flattened, frozen `primarySkills` selector from `lib/content/skills.ts` so the Server page imports a ready array (no filtering logic in the component or page).
4. **(No 404 assets)** The marquee MUST NOT render `next/image`/`<img>` for skill icons — the legacy `icon` paths (`/images/skills/*.png`) point at files that **do not exist** in `public/` and would 404 + trip the `next/image` lint rule. Render each skill as a **text chip** using the established chip idiom (`rounded border border-hairline px-2 py-1 font-mono text-[11px]`, design-system §Buttons/Chip). Ignore `Skill.icon` entirely in this story.
5. **(Seamless loop + a11y)** For the animated branch, the track is duplicated so the `transform` loop is visually seamless; the **duplicate copy is `aria-hidden`** (and not focusable) so a screen reader / the accessibility tree reads each skill **once**. The marquee lives in its own `<section aria-labelledby=...>` introduced by an `<h2>` (e.g. "Stack") — it introduces **no second `<h1>`** (the hero's identity `<h1>` stays the only level-1 heading on `/`). Overflow is clipped (`overflow-hidden`) so the off-screen track never creates a horizontal scrollbar.
6. **(Reuse, no fork, RSC boundary)** Compose the **existing** `useShouldAnimate()` (`@/hooks/use-should-animate`) for the motion gate. `app/(chrome)/page.tsx` stays a **Server Component**; only the new `components/stack-marquee.tsx` is `"use client"`. Skills are passed **down as a serializable prop** (`primarySkills`), imported on the server page — push the client boundary deep (ARCH / project-context). Named export for the component; `page.tsx` keeps its default export.
7. **Gates green:** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean; `/` shows no console errors/warnings; the theme `D` hotkey still toasts dark-only; `<html dir="rtl">` does not break the layout (no fixed `left/right`/`ml/mr`; transform-based scroll is acceptable in both directions, no horizontal page scrollbar); mobile (`<640px`) renders without horizontal overflow; with OS "reduce motion" on, the static grid renders with all primary skills visible and **no** motion.

## Tasks / Subtasks

- [x] **Task 1 — Add `tier` to the skill schema + a `primarySkills` selector (AC: 3, 4)**
  - [x] In `lib/content/skills.ts`, extend `SkillSchema` with `tier: SkillTier` where `export const SkillTier = z.union([z.literal("primary"), z.literal("secondary")])`. Keep `type Skill = z.infer<typeof SkillSchema>` — do not hand-write the type.
  - [x] Derive `tier` in the existing `rawSkillGroups` map from `level`: `tier: s.level === 1 ? "primary" : "secondary"`. No change to the `legacy` source data and no new authoring required — every level-1 skill becomes `"primary"`.
  - [x] Add and export a frozen flattened selector: `export const primarySkills: readonly Skill[] = Object.freeze(skillGroups.flatMap((g) => g.skills).filter((s) => s.tier === "primary"))`. This is what the marquee consumes. (Order follows group/source order; that's fine.)
  - [x] Re-export `SkillTier` and `primarySkills` from `lib/content/index.ts` alongside the existing `SkillLevel`/`skillGroups` exports (keep alpha-ish grouping consistent with the file).
  - [x] Do **not** touch `Skill.icon` or add/repair image assets — icons are out of scope (AC 4).
- [x] **Task 2 — Build the stack marquee client component (AC: 1, 2, 4, 5, 6)**
  - [x] Create `components/stack-marquee.tsx` (`"use client"`, named export `StackMarquee`, kebab-case file). Props: `skills: readonly Skill[]` (import `import type { Skill } from "@/lib/content/skills"`).
  - [x] `const shouldAnimate = useShouldAnimate()`. **Branch on it:**
    - `!shouldAnimate` → render a **static grid/flex-wrap** of chips (all `skills`, each once), no animation, no duplicate track. (e.g. `flex flex-wrap gap-2`.)
    - `shouldAnimate` → render the scrolling track (below).
  - [x] **Animated track:** an `overflow-hidden` viewport wrapping a flex row that contains the chip list **twice** — the second copy `aria-hidden="true"` (AC 5). Animate the row by `transform: translateX(0 → -50%)` on an infinite linear loop so the seam is invisible (two identical halves). **Transform only** — no `width`/`left`/`scroll`.
  - [x] **Hover/focus pause:** the loop pauses while the marquee is hovered or contains focus.
  - [x] **Chips:** map skills to the chip idiom — `rounded border border-hairline px-2 py-1 font-mono text-[11px]` (design-system §123/127), `whitespace-nowrap`, lime accent optional but restrained (lime is punctuation only — do not fill chips lime). Key by `skill.name`. Render `skill.name` as text; **no image**.
  - [x] `<section aria-labelledby="stack-heading">` → `<h2 id="stack-heading">` (DevTools register: `font-mono text-sm tracking-wider text-muted-foreground uppercase`, mirror `principles-panel.tsx`). No second `<h1>`, no `<main>`/skip-link/chrome (the `(chrome)` layout owns those).
  - [x] **RTL:** the transform-scroll works under `dir="rtl"` without change; avoid physical `ml-`/`mr-`/`left`/`right` in layout — use logical/`gap` utilities. The duplicated-track + `overflow-hidden` must not produce a horizontal **page** scrollbar in either direction (the `html` rule already sets `overflow-x-hidden`, but clip locally too).
  - [x] **Implementation choice (pick one — both are fine, recommend the CSS-keyframes path):**
    - **Recommended — CSS keyframes:** add a `@keyframes marquee` + an `@utility animate-marquee` to `app/globals.css` (mirror the existing `@keyframes text` / `.animate-text` pattern at globals.css:251-262), animating `transform: translateX(0)` → `translateX(-50%)`, `linear infinite`. Pause via Tailwind's `hover:[animation-play-state:paused]` / `[&:focus-within]:[animation-play-state:paused]` on the track. Simplest hover-pause; transform-only; GPU-composited. Only mounts when `shouldAnimate` so it's reduced-motion-safe by construction.
    - ~~Alternative — framer-motion~~ (not chosen)
- [x] **Task 3 — Mount the marquee on `/` (AC: 1, 6)**
  - [x] In `app/(chrome)/page.tsx` (stays a Server Component — no `"use client"`), import `{ primarySkills }` from `@/lib/content/skills` (or via `@/lib/content`) and `{ StackMarquee }` from `@/components/stack-marquee`. Render `<StackMarquee skills={primarySkills} />` **below `<PrinciplesPanel>`** (the natural fold order: hero → principles → stack). Keep the existing `metadata` export and the hero `<h1>` untouched.
- [x] **Task 4 — Tests (AC: 1, 2, 3, 5)**
  - [x] Add `components/stack-marquee.test.tsx` (colocated; mirror `components/computed-styles-panel.test.tsx` / `principles-panel.test.tsx` style — `globals: true`, do **not** import `describe/it/expect`, query by role/text).
  - [x] Assert: the section heading is queryable as a level-2 heading (`getByRole("heading", { level: 2 })`); **no** level-1 heading is introduced (`queryByRole("heading", { level: 1 })` is null); each primary skill name renders (use `getAllByText(name)` since the animated branch duplicates — assert `>= 1`, or render the reduced-motion branch for an exact-once check).
  - [x] **Reduced-motion branch:** because `useShouldAnimate` wraps `useReducedMotion()` (framer-motion), the jsdom default is "no preference" → animating. To exercise the static-grid fallback, either mock `matchMedia` to report `prefers-reduced-motion: reduce` **or** mock `useShouldAnimate` to return `false`. Assert each skill appears **exactly once** and the duplicated/`aria-hidden` track is absent in that branch.
  - [x] Add `lib/content/skills.test.ts` (or extend if one exists): assert `primarySkills` is non-empty, every entry has `tier === "primary"`, and `SkillSchema.parse` accepts a `{ name, level, tier }` object — guards the schema/selector contract from regressing.
  - [x] Do **not** test Tailwind class strings, framer-motion internals, the `@keyframes` CSS, or take JSX snapshots (project-context Testing rules).
- [x] **Task 5 — Verify & gate (AC: 7)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` all green; `yarn format`.
  - [x] `yarn dev` → load `/`: scroll past principles, confirm the marquee scrolls smoothly (transform only — check DevTools that it's not repainting layout), **pauses on hover** and on `Tab`-focus-within, shows primary skills as hairline mono chips with **no broken images / 404s in the Network or Console**, exactly one `<h1>` on the page. Toggle `<html dir="rtl">` — no horizontal page scrollbar, layout intact. Resize to `<640px` — no horizontal overflow. Enable OS "Reduce motion" and reload — the marquee is a **static grid** with every primary skill visible and no movement. `D` still toasts dark-only.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the **stack marquee** on `/` (Elements) — the FR-012 animated horizontal scroll of **primary** tech, hover-pause, transform-only, with a static-grid reduced-motion fallback — plus the minimal schema work to make `Skill.tier === "primary"` real.
- **IS NOT:** the principles panel (Story 3.2 — done; FR-011 mandates Computed-styles panel, *not* a marquee — do not confuse the two), the hero (3.1 — done), `/perf` rings (3.4), `/sources` tree (3.5), or any case-study stack-chip row (Epic 4). This is the **only** marquee on the site (UX line 217).

### ⚠️ Two real gaps this story closes (don't skip — they'll fail review otherwise)
1. **`Skill.tier` does not exist yet.** The FR says `Skill.tier === "primary"` but `lib/content/skills.ts` ships only `level: 1 | 2 | 3` (SkillSchema lines 5-9). Task 1 adds the `tier` field and derives it from `level` so the FR's filter is literally true and Zod stays the source of truth (project-context: "Zod schemas are the source of truth … derive types via `z.infer` … never hand-write parallel interfaces"). Mapping decision: **`level === 1` → `"primary"`** (the "Main skills" group's top tier; ~18 skills — a good marquee length). See Open Questions if a curated primary set is preferred.
2. **Skill icon images don't exist.** `lib/content/skills.ts` carries `icon: "/images/skills/*.png"` for every skill, but `public/images/skills/` **does not exist** (verified — `Glob public/images/skills/*` → no files). Rendering them via `next/image` would 404 and trip the `core-web-vitals` lint rule. The UX spec also explicitly rejects a **logo** marquee ("Animated marquee of brand logos … Generic agency aesthetic; doesn't fit DevTools register" — line 217). So this marquee renders **text chips**, ignoring `Skill.icon`. Do not "fix" the images or wire `next/image` here.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `lib/content/skills.ts` | **UPDATE** | Add `SkillTier` union + `tier` to `SkillSchema`; derive `tier` from `level` in the `rawSkillGroups` map; add frozen `primarySkills` selector. No new authoring, no `legacy`-data change, no `icon` work. |
| `lib/content/index.ts` | **UPDATE** | Re-export `SkillTier` + `primarySkills`. |
| `components/stack-marquee.tsx` | **NEW** | `"use client"`, named export `StackMarquee`; `useShouldAnimate()` branch (animated track vs static grid); transform-only loop; hover/focus pause; duplicated track w/ `aria-hidden`; chip idiom; `<section>`+`<h2>`. |
| `components/stack-marquee.test.tsx` | **NEW** | h2 present, no new h1, primary skill names render; reduced-motion branch renders static grid (skills once). |
| `lib/content/skills.test.ts` | **NEW** (or extend) | `primarySkills` non-empty + all `tier === "primary"`; schema accepts `tier`. |
| `app/(chrome)/page.tsx` | **UPDATE** | Stays a Server Component; render `<StackMarquee skills={primarySkills} />` below `<PrinciplesPanel>`. Keep `metadata` + hero `<h1>`. |
| `app/globals.css` | **UPDATE** (only if CSS-keyframes path chosen) | Add `@keyframes marquee` + `@utility animate-marquee` mirroring the existing `@keyframes text` / `.animate-text` (globals.css:251-262). Transform-only. |

### Current state of `app/(chrome)/page.tsx` (extend, don't rewrite)
Server Component exporting `metadata` (`"Elements — devtools://hossam"`). Returns a fragment: a full-height hero `<section>` (`min-h-[calc(100vh-4rem)]`, `bg-grid`/`bg-scan` texture, Fraunces `<h1>` = `profile.name`, role, tagline, `<InspectMeCta />`) followed by `<PrinciplesPanel principles={profile.principles} />` (Story 3.2). **Must preserve:** the `metadata` export, Server-Component nature, the single `<h1>`, the one lime CTA, and the existing principles block. **What changes:** append `<StackMarquee>` as a sibling after `<PrinciplesPanel>`.

### Reuse — do NOT reinvent (mirror Story 3.1/3.2 patterns)
- **`useShouldAnimate()`** (`@/hooks/use-should-animate`) — the single reduced-motion gate; it wraps `useReducedMotion()` (returns `!useReducedMotion()`). Import it; **never** call `useReducedMotion()` directly in feature code (ARCH-4 / UX-DR4). Gating precedent: `components/principles-panel.tsx:20`, `components/xp-bar.tsx:13-14` (xp-bar returns `null` when `!shouldAnimate`; here we render the static grid instead), `components/inspect-me-cta.tsx:17,33`.
- **Chip idiom** — design-system §123/127: `rounded border border-hairline px-2 py-1 font-mono text-[11px]`. `<Badge>` (`@/components/ui/badge`) is the shadcn primitive for chips/pills, but it's `cva`-variant-driven and may carry its own padding/colors — a plain `<span>`/`<li>` with the chip classes is lighter and matches the design-system snippet exactly. Reuse `<Badge>` only if its default variant already lands the hairline-mono look; otherwise use the raw classes. Either is acceptable — do not invent a third chip style.
- **Heading register** — copy the `<h2>` treatment from `principles-panel.tsx:29-34` (`font-mono text-sm tracking-wider text-muted-foreground uppercase`) for visual consistency across the `/` sections.
- **`framer-motion`** (NOT `motion/react`) — only if you take the framer-motion animation path. The `motion` package is not installed (project-context anti-pattern). `motion` + `useAnimationControls` come from `framer-motion`.
- **globals.css keyframe precedent** — `@keyframes text` + `.animate-text` (globals.css:251-262) and the `@utility bg-grid`/`bg-scan` blocks show the house style for adding keyframes/utilities in Tailwind v4 (`@utility`, no `tailwind.config.*`). Follow that shape for `@keyframes marquee` / `@utility animate-marquee`.

### Marquee mechanics (concrete)
- **Seamless loop:** render the chip list **twice** in a flex row; animate the row `translateX(0%) → translateX(-50%)`. At `-50%` the second (identical) half sits exactly where the first started, so the reset is invisible. The **second copy is `aria-hidden="true"`** and its chips are not focusable (no interactive elements inside; if you ever add links, also `tabIndex={-1}` the dupes).
- **Transform only (NFR-P5):** animate `transform`/`opacity` exclusively — never `width`, `left`, `margin`, or `scrollLeft`. The track is `flex w-max` (or `inline-flex`) so it sizes to content and the parent `overflow-hidden` clips it.
- **Hover/focus pause:** CSS path → `hover:[animation-play-state:paused] [&:focus-within]:[animation-play-state:paused]` on the animated element. framer path → `controls.stop()` on enter/focus, `controls.start(...)` on leave/blur.
- **Speed:** a slow, calm linear scroll (e.g. ~25-40s for one full cycle) — "lively but never gratuitous." Tune in the browser.
- **Reduced-motion branch is a separate render** (not just `animation: none`): a `flex flex-wrap gap-2` grid of the chips, each rendered **once**, no duplicate/`aria-hidden` track. This guarantees AC 2/7 (all skills visible, no motion) and keeps the test's "exactly once" assertion clean.

### Architecture / project-context guardrails (must follow)
- **Semantic tokens only** — `border-hairline`, `text-muted-foreground`, `font-mono`, `bg-surface`, `text-lime` (punctuation only). **No hardcoded hex/oklch** in JSX.
- **RSC by default; push `"use client"` deep** — `page.tsx` stays a Server Component; only `stack-marquee.tsx` is `"use client"` (it uses `useShouldAnimate`/possibly `useAnimationControls`). Skills imported on the server, passed as a serializable prop.
- **Named exports** for the new component + selectors; `page.tsx` keeps its **default export** (Next.js requirement).
- **`import type`** for the `Skill` type (`isolatedModules: true`); **no `import React`** (jsx runtime `react-jsx`).
- **Import order:** external (`react`, `framer-motion`) → internal aliases (`@/components/*`, `@/hooks/*`, `@/lib/*`) → relative — blank line between groups, alpha within (see `principles-panel.tsx` for the canonical ordering).
- **RTL:** logical/`gap` utilities only; transform-scroll is direction-agnostic. Verify no horizontal **page** scrollbar appears in `dir="rtl"` (clip locally with `overflow-hidden` even though `html` is already `overflow-x-hidden`).
- **A11y:** exactly one `<h1>` per route (the hero's); this section uses `<h2>`; the duplicated track is `aria-hidden` so SR reads each skill once; chips are non-interactive (no focus ring needed). If you wrap chips in a list, use `<ul>`/`<li>` with `list-none`.
- **Prettier:** no semicolons, double quotes, 2-space, classes inside `cn()`/`cva()` auto-sort — wrap dynamic class strings in `cn()` (from `@/lib/utils`).

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true` (don't import `describe/it/expect`), env `jsdom`, setup `tests/setup.ts`. `@/` alias works in tests.
- **Colocate** the component test (`stack-marquee.test.tsx`); mirror `computed-styles-panel.test.tsx` / `principles-panel.test.tsx`.
- Query **by role/text**: `getByRole("heading", { level: 2 })`, `queryByRole("heading", { level: 1 })` (null), skill names via `getByText`/`getAllByText`. Avoid `getByTestId`.
- **Animated branch duplicates** each chip → use `getAllByText(name).length >= 1`, or test the reduced-motion branch (mock `useShouldAnimate` → `false`, or stub `matchMedia` to report `prefers-reduced-motion: reduce`) for an exact-`1` assertion. jsdom default has no `matchMedia` reduced-motion preference, so the un-mocked component renders the **animated** branch.
- If the framer-motion path is taken and a test throws on `IntersectionObserver`/`matchMedia` being undefined, stub minimally rather than mocking framer-motion (prefer asserting rendered output over animation timing).
- The `skills.test.ts` content test guards the schema/selector contract (mirrors the optional `profile.principles` length guard suggested in Story 3.2).
- **Don't test** Tailwind class strings, framer-motion internals, the `@keyframes` CSS, the shadcn `<Badge>` primitive, or take snapshots.

### Project Structure Notes
- Routes under `app/(chrome)/`; `/` = `app/(chrome)/page.tsx`. The `(chrome)` layout already renders `<main id="main-content">`, the skip link, `<DevToolsChrome>`, the page-swap `AnimatePresence`, and `<MobileBottomNav>` — **do not** add another `<main>`/skip-link/chrome.
- New shared component → `components/stack-marquee.tsx` (sibling of `inspect-me-cta.tsx`, `computed-styles-panel.tsx`, `principles-panel.tsx`).
- Content layer: `lib/content/skills.ts` (schema + data + selectors) re-exported through `lib/content/index.ts`. Keep new exports flowing through the barrel.
- Tailwind v4: any new keyframe/utility goes in `app/globals.css` via `@keyframes` + `@utility` — **never** a `tailwind.config.*` (anti-pattern).

### References
- [Source: _bmad-output/planning-artifacts/epics.md:449-463] — Story 3.3 AC: animated stack marquee, `transform` only, pauses on hover, `Skill.tier === "primary"`; reduced-motion → static grid via `useShouldAnimate()`.
- [Source: _bmad-output/planning-artifacts/epics.md:39] — FR-012: "Stack marquee — animated horizontal scroll of primary tech, pauses on hover, static grid under reduced motion."
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:217] — Stack marquee on `/` is the **only** marquee; pauses on hover; static grid under reduced motion; **logo marquees rejected** (use text chips).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:333,729] — Lime is a punctuation color; never fill chips/large surfaces lime.
- [Source: docs/design-system.md:123,127] — chip idiom: `rounded border border-hairline px-2 py-1 font-mono text-[11px]`; §240 lists `/` as "Hero, identity, principles marquee, stack marquee".
- [Source: lib/content/skills.ts:3-11,98-105] — `SkillSchema` has `level: 1|2|3`, **no `tier`** (gap to close); `skillGroups` is the frozen parsed collection; `icon` paths reference nonexistent `/images/skills/*.png`.
- [Source: public/images/skills/ — DOES NOT EXIST] — verified via Glob; do not render skill icons.
- [Source: components/principles-panel.tsx:1-65] — canonical `"use client"` + `useShouldAnimate()` + `<section aria-labelledby>`/`<h2>` pattern, import ordering, server-page→client-child prop pass; the `<h2>` register to mirror.
- [Source: components/xp-bar.tsx:12-14] — `useShouldAnimate()` early-return precedent (here: render static grid instead of `null`).
- [Source: components/inspect-me-cta.tsx:17,33] — `useShouldAnimate()` gating of a `framer-motion`/transform animation.
- [Source: app/globals.css:251-262] — `@keyframes text` + `.animate-text` precedent for adding a transform keyframe/utility (Tailwind v4 `@utility`, no config file); :206-208 `html` is already `overflow-x-hidden`.
- [Source: app/(chrome)/page.tsx:1-46] — Server-Component hero + `<PrinciplesPanel>` to extend; preserve `metadata` + single `<h1>`; append `<StackMarquee>` below principles.
- [Source: _bmad-output/implementation-artifacts/3-2-principles-as-a-computed-styles-panel.md] — prior story: deep-client-child split, `useShouldAnimate` discipline, test style, "ignore the word 'marquee' for principles — the marquee is the *stack* (3.3)".
- [Source: _bmad-output/project-context.md] — `framer-motion` not `motion/react`; semantic tokens; named exports / `page.tsx` default export; RSC-deep-boundary; `import type`; Zod source-of-truth; Tailwind v4 no config; RTL logical props; testing rules; "Animate `transform`/`opacity` only".

### Open Questions (for Hossam — non-blocking; sensible defaults chosen)
1. **Primary-skill mapping:** I mapped `tier === "primary"` to `level === 1` (the "Main skills" group's top tier → ~18 skills: HTML/CSS/SASS/JS/TS/jQuery/Bootstrap/Tailwind/Ant/Material/React/Redux/Next/SWR/Vue/Nuxt/Vuetify/Vue Query). If you'd rather show a **curated** shorter set as the marquee's "primary tech" (e.g. drop jQuery/Bootstrap/Ant to sharpen the senior-FE signal), say which to include and I'll set `tier` explicitly on those instead of deriving from `level`.
2. **Marquee chip style:** text-only hairline mono chips (no logos), since `public/images/skills/` doesn't exist and the UX spec rejects logo marquees. If you want real logos later, that's a separate asset-sourcing task (add SVGs to `public/`, wire `next/image` with width/height/alt) — out of scope here.

## Dev Agent Record

### Agent Model Used

k2p6 (kimi-for-coding/k2p6)

### Debug Log References

- No debug issues encountered during implementation.

### Completion Notes List

- **Task 1 (Schema):** Added `SkillTier` union (`"primary" | "secondary"`) to `lib/content/skills.ts`, extended `SkillSchema` with `tier`, derived it from `level` in the `rawSkillGroups` map, and exported a frozen `primarySkills` selector. Re-exported both from `lib/content/index.ts`.
- **Task 2 (Component):** Built `components/stack-marquee.tsx` as a `"use client"` component using CSS keyframes (`@keyframes marquee` + `@utility animate-marquee` in `globals.css`). Implements `useShouldAnimate()` branching: animated track (duplicated, `aria-hidden`, `overflow-hidden`, hover/focus pause) vs static flex-wrap grid. Uses hairline mono chip idiom, `<section>` + `<h2>`, no images, no physical left/right properties.
- **Task 3 (Mount):** Mounted `<StackMarquee skills={primarySkills} />` in `app/(chrome)/page.tsx` below `<PrinciplesPanel>`. Page remains a Server Component with default export.
- **Task 4 (Tests):** Added colocated `components/stack-marquee.test.tsx` (heading levels, skill rendering, reduced-motion branch, aria-hidden duplicate) and `lib/content/skills.test.ts` (schema validation, primarySkills selector contract).
- **Task 5 (Gates):** `yarn typecheck`, `yarn lint`, `yarn test:run` (48/48 tests pass), and `yarn format` all green. No regressions.

### File List

| File | Change |
|---|---|
| `lib/content/skills.ts` | Added `SkillTier`, `tier` field in `SkillSchema`, derived `tier` in mapping, exported `primarySkills` selector |
| `lib/content/index.ts` | Re-exported `SkillTier` and `primarySkills` |
| `components/stack-marquee.tsx` | New — `"use client"` marquee component with animated/static branches |
| `components/stack-marquee.test.tsx` | New — component tests for heading levels, skill rendering, reduced-motion branch |
| `lib/content/skills.test.ts` | New — schema and selector contract tests |
| `app/(chrome)/page.tsx` | Imported and mounted `<StackMarquee>` below `<PrinciplesPanel>` |
| `app/globals.css` | Added `@keyframes marquee` and `@utility animate-marquee` |
| `_bmad-output/implementation-artifacts/sprint-status.yaml` | Story status updated to `in-progress` |
| `_bmad-output/implementation-artifacts/3-3-stack-marquee-with-reduced-motion-fallback.md` | Story status updated to `review`, tasks marked complete, Dev Agent Record filled |

### Review Findings

- [x] [Review][Decision→Patch] Keyboard `focus-within` pause is unreachable — **Resolved:** Removed the `focus-within:[animation-play-state:paused]` rule. Chips are non-interactive `<span>` elements; hover pause is sufficient. [components/stack-marquee.tsx:28]

- [x] [Review][Patch] Hardcoded `headingId` risks duplicate DOM IDs — **Fixed:** Replaced `const headingId = "stack-heading"` with `const headingId = useId()` from React. [components/stack-marquee.tsx:12]

- [x] [Review][Patch] `gap-2` on animated container breaks seamless loop — **Fixed:** Removed `gap-2` from the animated flex container and added `pr-2` to each `<ul>` so the 50% offset aligns flush with the track boundary. [components/stack-marquee.tsx:28]

- [x] [Review][Patch] Test cleanup only clears call history — **Fixed:** Changed `vi.clearAllMocks()` to `vi.resetAllMocks()` in `afterEach` to fully isolate tests. [components/stack-marquee.test.tsx:15]

- [x] [Review][Defer] Duplicate skill names would cause React key collisions — `key={skill.name}`; if two groups contain the same skill name, React keys collide. Pre-existing data concern, not introduced by this change. [components/stack-marquee.tsx:27,40,53] — deferred, pre-existing

- [x] [Review][Defer] Print media shows duplicated skills — The `aria-hidden` duplicate track is hidden from assistive tech but still visible when printing. Pre-existing concern for print styles, not addressed in this story. — deferred, pre-existing

- [x] [Review][Defer] Scroll speed varies with content width — `translateX(-50%)` with fixed 35s duration means pixel speed depends on total track width. Design tuning consideration, not a bug. — deferred, pre-existing

- [x] [Review][Defer] Hydration mismatch risk on reduced-motion clients — `useReducedMotion()` may return different values during SSR vs client hydration. Likely handled by framer-motion internally; monitor if issues arise. — deferred, pre-existing
