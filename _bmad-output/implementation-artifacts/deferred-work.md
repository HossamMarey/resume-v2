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
