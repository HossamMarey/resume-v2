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
