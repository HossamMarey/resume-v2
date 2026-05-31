# Deferred Work

Surfaced by quick-dev review loops. Each entry: source spec, finding, suggested follow-up.

---

## From spec-repalette-obsidian-lime (2026-05-25, loop 1 review)

### 1. `::selection` rule is inverted under the lime palette

**Where:** `app/globals.css:309-312` — currently `background-color: var(--primary-foreground); color: var(--primary);`. With `--primary` now `var(--lime)`, selecting text in dark mode produces lime text on near-black background — opposite of design-system.md §5 ("lime background with dark foreground") and visually collides with the page background (also near-black).

**Why deferred:** The repalette spec explicitly fenced `::selection` updates under **Ask First / out of scope**. Needs its own spec (likely batched with `.bg-grid` / `.bg-scan` / global `font-feature-settings` from design-system.md).

**Suggested fix:** Swap to `background: var(--primary); color: var(--primary-foreground);`.

### 2. `sonner.tsx` default `theme = "system"` mismatches new provider

**Where:** `components/ui/sonner.tsx:8` — `const { theme = "system" } = useTheme()`. With `enableSystem` removed from `ThemeProvider`, sonner may briefly receive `"system"` on first render and try to honor `prefers-color-scheme`, producing a light toast on the dark page during hydration.

**Why deferred:** Spec Never list forbids `components/ui/*` edits.

**Suggested fix:** Change default to `"dark"` to match the new provider default.

### 3. Legacy `theme: "system"` in returning visitors' localStorage

**Where:** `next-themes` stores user preference under `localStorage.theme`. If any returning visitor has `"system"` stored from a prior session, the provider (which no longer recognizes system) will fall back to `defaultTheme="dark"`, but the first `D` keypress may toggle to an unexpected state since `resolvedTheme` can briefly be undefined.

**Why deferred:** Greenfield project with no real users yet — risk is theoretical until launch.

**Suggested fix:** On `ThemeProvider` mount, if `localStorage.getItem("theme") === "system"`, call `setTheme("dark")` to migrate.

### 4. Light-mode (`:root`) shadow tokens still use warm `rgba(36, 31, 27, …)`

**Where:** `app/globals.css:105-112` — shadow stack in the cream/terracotta placeholder block uses warm brown shadows. Cool-neutral shadows (like the `.dark` block uses) would compose better whenever a real light palette is designed.

**Why deferred:** Light palette is intentionally placeholder per resolved decision #1. Will be addressed when (or if) a real light palette is designed.

---

## From code review of stories 1.1–1.3 (2026-05-30)

### 8. ThemeHotkey still toggles light mode

**Where:** `components/theme-provider.tsx:46` — `setTheme(resolvedTheme === "dark" ? "light" : "dark")`.

**Why deferred:** Pre-existing behavior from commit `643002c`; Story 2.4 will change the `D` hotkey to a dark-only toast. `theme-provider.tsx` was only touched by Story 1.3 to import shared `isTypingTarget`.

### 9. `import * as React from "react"` pattern in theme-provider

**Where:** `components/theme-provider.tsx:3` — old React import pattern.

**Why deferred:** Pre-existing from commit `643002c`. Project context prefers no `import React` (JSX runtime is `react-jsx`). File was only modified by Story 1.3 to add the `isTypingTarget` import.

---

## From spec-lib-content-migration (2026-05-25, loop 1 review)

### 5. `Object.freeze` on lib/content collections is shallow

**Where:** `lib/content/projects.ts`, `experience.ts`, `skills.ts` — each calls `Object.freeze(...)` on the exported collection. `readonly` on the type is compile-time only; a deliberate consumer cast (`(projects as Project[])[0].stack.push("x")`) mutates at runtime, and Next.js module caching means mutations leak across requests.

**Why deferred:** No consumers exist yet; mutation surface is theoretical. Hardening can land in a follow-up.

**Suggested fix:** Add a small `deepFreeze<T>(value: T): T` utility in `lib/utils/` and use it across all three content collections.

### 6. `toSlug` returns empty string for all-symbol input

**Where:** `lib/content/projects.ts` and `lib/content/experience.ts` both define a local `toSlug()` that strips non-alphanumerics. Inputs like `"++"` or `"---"` produce `""`, which then fails the `/^[a-z0-9-]+$/` regex inside `ProjectSchema.slug` / `ExperienceSchema.slug` with a confusing Zod error.

**Why deferred:** No current legacy entry triggers this. Latent footgun for future contributors.

**Suggested fix:** Have `toSlug` throw an explicit `Error("slug derivation produced empty string for input: ...")` when its output is empty, OR fall back to a hash-of-input. Also: consider deduplicating `toSlug` into `lib/utils/slug.ts`.

### 7. Legacy date case inconsistency carried forward

**Where:** `lib/content/experience.ts` — `parseDateRange` preserves source casing, so the Inovola employment ends up with `endDate: "sep. 2022"` (lowercase) while siblings use `"Mar. 2021"`. Downstream sort/parse may distinguish "Sep." vs "sep.".

**Why deferred:** Cosmetic; downstream renderer can title-case month abbreviations. Real fix is parsing dates into proper `Date` objects rather than free-form strings — out of scope for this spec.

---

## From code review of story 2.1 (2026-05-30)

### 10. No error or loading boundaries in chrome group

**Where:** `app/(chrome)/`, `app/recruiter/` — no `error.tsx` or `loading.tsx` files.

**Why deferred:** Out of scope for Story 2.1. Runtime errors currently bubble to generic Next.js overlay.

**Suggested fix:** Add `error.tsx` and `loading.tsx` to `(chrome)` and root `app/`.

### 11. Zod parse crash at module initialization

**Where:** `lib/content/projects.ts:391` — `ProjectsCollectionSchema.parse()` runs at top level.

**Why deferred:** Pre-existing from content migration (commit `cd5dd09`). Not caused by Story 2.1.

**Suggested fix:** Move parsing into a function or wrap in try/catch with safe fallback.

### 12. Missing root `not-found.tsx`

**Where:** `app/not-found.tsx` does not exist.

**Why deferred:** Out of scope for Story 2.1. Unknown routes show default Next.js 404 without chrome styling.

**Suggested fix:** Create custom `not-found.tsx` at app root.

### 13. Rapid navigation feels blocked by `mode="wait"`

**Where:** `app/(chrome)/layout.tsx:67` — `AnimatePresence mode="wait"` waits 200ms for exit fade.

**Why deferred:** UX tuning, not a bug. Fast tab clicks queue transitions. Can be addressed in Story 2.2+ if it feels sluggish in practice.

**Suggested fix:** Switch to `mode="popLayout"` or reduce exit duration further.

---

## From code review of story 2.3 (2026-05-30)

### 15. `key={pathname}` may be `null` during SSR causing remount

**Where:** `app/(chrome)/layout.tsx:48` — `usePathname()` returns `null` during SSR and initial hydration pass, so `motion.div` mounts with `key={null}`; once hydration completes the key flips to the real path, forcing React to remount the child even though the route hasn't changed. The `mounted` flag collapses animation duration, but the remount still wastes work and can reset child focus/state.

**Why deferred:** Pre-existing from Story 2.1, already deferred there.

**Suggested fix:** Use a stable key or handle null pathname before passing to `key` prop.

### 14. `<main className="flex-1">` without flex parent

**Where:** `app/(chrome)/layout.tsx:66` — `flex-1` requires a flex container parent.

**Why deferred:** Layout refinement deferred to later stories (2.2–2.5) when the full chrome structure is built.

**Suggested fix:** Ensure `<body>` or a wrapper establishes `display: flex; flex-direction: column; min-height: 100vh`.

---

## From code review of story 2.5 (2026-05-31)

### 16. Toast `id`/`key` collides on same-millisecond emits; single-slot drops rapid grants

**Where:** `components/devtools-chrome.tsx:57,64-68,88` — `setToast({ id: timestamp })` where `timestamp = Date.now()`. Two emits in the same ms produce an identical `AnimatePresence` key (enter/exit skipped); the toast is a single slot, so a second grant within 1200ms replaces the first before it finishes.

**Why deferred:** Latent — tab navigation can't produce two emits in the same ms, and reasons are deduped. Becomes triggerable once epics 4.5/5.2/5.4/6.4 add multiple XP emitters.

**Suggested fix:** Key the toast by a monotonic counter (or `${timestamp}-${reason}`) and/or queue toasts instead of single-slot replacement.

### 17. No cross-tab `storage` event sync

**Where:** `hooks/use-xp.ts` — `useXP` reads `localStorage` once on mount and only updates via the in-page `hm:xp` event. XP granted in tab A never reaches tab B, and tab B can overwrite the higher persisted value with its stale total on reload.

**Why deferred:** Out of scope for this story; no cross-tab requirement in the spec.

**Suggested fix:** Add a `window` `storage` event listener in `useXP` that re-reads `hm_xp_v1` when it changes in another tab.

### 18. Multiple `useXP` consumers double-count

**Where:** `hooks/use-xp.ts:39-53` — each `useXP` instance independently subscribes to `hm:xp` and independently `writeXp`s its own React state. A second mounted consumer both double-counts and races the persisted value (last writer wins).

**Why deferred:** Only the chrome consumes `useXP` today. Latent until the REPL/contact surfaces (epics 5–6) read XP.

**Suggested fix:** Single shared subscription (context provider or a module-level store) feeding all consumers, or document that `useXP` is single-instance.

### 19. Nested routes grant no visit XP though the tab shows active

**Where:** `app/(chrome)/layout.tsx:23-29` — `tabReasons` is an exact-match map, so `/work/[slug]` returns `undefined` and never grants `visit:network`, even though `isActiveTab` highlights Network. Deep-linking into a project detail looks visited but isn't.

**Why deferred:** Detail routes are stubs; confirm whether deep-links should grant the parent tab's visit XP.

**Suggested fix:** Match by tab prefix (longest-prefix) instead of exact pathname when resolving the visit reason.

### 20. `useShouldAnimate` flashes bar/toast for reduced-motion users

**Where:** `components/xp-bar.tsx:13`, `components/xp-toast.tsx:22` — framer's `useReducedMotion()` returns `null` before resolution, so `useShouldAnimate()` is `true` on the first render; the bar/toast mount visible then snap to `null` for users who actually prefer reduced motion. Neither component has a mounted gate (unlike the hook/layout).

**Why deferred:** Cosmetic single-frame flash; no functional impact.

**Suggested fix:** Add a mounted gate to these two components, or have `useShouldAnimate` return `false` until resolved.

### 21. Import-ordering guardrail not followed in the two modified files

**Where:** `components/devtools-chrome.tsx:1-15`, `app/(chrome)/layout.tsx:1-9` — external imports (`lucide-react`, `react`) appear after internal `@/` aliases with no blank-line grouping, contrary to the project import-ordering guardrail. The new files comply; the modified files carried (and slightly extended) pre-existing disorder.

**Why deferred:** Cosmetic, lint passes, pre-existing pattern not introduced by this story.

**Suggested fix:** Reorder to External → internal aliases → relative, blank lines between groups, when these files are next touched.

### 22. `favicon.ico` swapped but not part of the story

**Where:** `app/favicon.ico` — binary changed (25931→4286 bytes) in the working tree but is not in the story's File List and is unrelated to the XP system.

**Why deferred:** Out-of-scope change bundled into the same working tree.

**Suggested fix:** Confirm it's intentional and commit it separately from the Story 2.5 changes.

---

## From code review of story 3.1 (2026-05-31)

### 23. User-facing résumé skill typos in experience data

**Where:** `lib/content/experience.ts` — skill list contains `"Nuxt,js"` (comma instead of dot), `"Ant.Design"`, and `"TailwindCss"`. Surfaced when the block was reformatted by Prettier in this change.

**Why deferred:** Pre-existing data, not introduced by Story 3.1 (only an adjacent line was reflowed). The hero story doesn't render experience data.

**Suggested fix:** Correct to `"Nuxt.js"`, `"Ant Design"`, `"Tailwind CSS"`.

### 24. `profile.email` left empty while neighbors were populated

**Where:** `lib/content/profile.ts:38` — `email: ""`. The schema permits `""` via `z.union([z.literal(""), z.string().email()])`, so it parses, but it's an incomplete profile field.

**Why deferred:** Not consumed by the Story 3.1 hero; the contact surface is Epic 6. Author the real address when that lands.

**Suggested fix:** Populate `email` when the contact form / footer surfaces it.

### 25. Single-opener palette seam — clobber, test isolation, unused event const

**Where:** `lib/command-palette/bus.ts` — (a) `registerPaletteOpener` is last-writer-wins: a second register silently clobbers the first and the first's unsubscribe becomes a dead no-op; (b) `bus.test.ts` `beforeEach` is an empty stub that can't reset the module-level `opener`, so isolation relies on each test cleaning up; (c) `PALETTE_OPEN_EVENT` is exported but unused (the seam is callback-based, not event-based).

**Why deferred:** Acceptable for the current single-consumer design — only Epic 5's palette will register an opener. Mirrors the `lib/xp/bus.ts` style intentionally.

**Suggested fix:** When Epic 5 wires the real palette, decide whether to dev-warn on double-register (or ref-count), add an exported test-reset hook + `afterEach`, and either consume `PALETTE_OPEN_EVENT` or remove it.

---

## From code review of story 3.2 (2026-05-31)

### 26. No-JS / hydration-delay leaves the principles panel visually hidden

**Where:** `components/principles-panel.tsx:33-45` — when `shouldAnimate` is true, the `motion.div` mounts at `initial={{ opacity: 0 }}` and only animates to visible once `useInView` (IntersectionObserver) fires. If JS fails to load or hydration is delayed, the content is present in the DOM (SSR'd, good for SEO/screen readers) but never visually appears.

**Why deferred:** Project-wide scroll-reveal pattern, not introduced uniquely by this story (`inspect-me-cta.tsx`, `xp-bar.tsx` gate the same way). Content is in the DOM; only the visual reveal is JS-gated.

**Suggested fix:** If progressive-enhancement resilience becomes a goal, adopt a project-wide convention (e.g. CSS `@media (scripting: none)` fallback that forces visible, or a `mounted`-gated visible default) across all scroll-reveal components.

### 27. Empty `principles` array renders an empty bordered grid with a dangling heading

**Where:** `components/principles-panel.tsx:48-58` — `principles.map(...)` over `[]` yields zero cells, but `<ComputedStylesPanel>` still renders its `border-hairline bg-hairline` wrapper and the `<h2>Principles</h2>` still renders, advertising a section with no content. `ProfileSchema.principles` is `z.array(...)` with no `.min(1)`, so `[]` is valid (it was the prior state).

**Why deferred:** The content contract (AC4) mandates 4 non-empty entries and the test asserts length; an empty panel can't occur with the shipped content. Empty-guard is optional hardening.

**Suggested fix:** Early-return `null` (or skip the section) when `principles.length === 0`.

### 28. Nothing enforces an even count for the `sm:grid-cols-2` layout

**Where:** `components/principles-panel.tsx:48` (`sm:grid-cols-2`) and the `ProfileSchema.principles` array (no length constraint). 4 entries render a clean 2×2; an odd count (3, 5) leaves a ragged last row.

**Why deferred:** Currently exactly 4 are authored; the spec said do not weaken/over-constrain the schema. Cosmetic only if the count later changes.

**Suggested fix:** If a fixed grid is a hard requirement, add `.length(4)` to the schema or document the even-count assumption near the component.

### 29. Duplicate `key`/`title`/`body` would break React keys and the test assertions

**Where:** `components/principles-panel.tsx:50` (`key={principle.key}`) and `components/principles-panel.test.tsx:36-37` (`getByText(principle.title)` / `getByText(principle.body)` throw on >1 match). The schema permits duplicate strings (only `.min(1)` per field).

**Why deferred:** All four current entries have unique keys/titles/bodies; this is latent test fragility, not a live bug.

**Suggested fix:** When authoring future principles, keep `key`/`title`/`body` unique; if duplicates become possible, switch the test to scoped queries (`within(...)`) and ensure `key` uniqueness.
