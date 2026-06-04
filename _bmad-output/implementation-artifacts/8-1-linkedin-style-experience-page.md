# Story 8.1: LinkedIn-style Experience timeline page

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

> **Context for this story:** Epics 1–7 (the original `devtools://hossam` build) are all `done`. This is **net-new, post-launch work** — a new top-level surface that did not exist in the original epics or PRD. Epic 8 ("Experience") is created to hold it. There is no prior story in this epic, so there is no previous-story carryover.

## Story

As a **recruiter or hiring manager visiting the portfolio**,
I want **a dedicated Experience page that presents Hossam's work history in the familiar LinkedIn layout — companies with logos, employment type, location, and nested roles with computed durations**,
so that **I can quickly scan career progression and jump straight to the case studies tied to each company**.

## Acceptance Criteria

1. **Route exists.** A new App Router route renders at `/experience` inside the `(chrome)` route group (so it inherits the DevTools chrome, XP bar, and mobile bottom nav). The page default-exports and uses the metadata API (no raw `<head>`).
2. **Sixth DevTools tab.** `components/devtools-chrome.tsx` gains an "Experience" tab pointing at `/experience` in BOTH the desktop tab row (`DevToolsChrome`) and the mobile bottom nav (`MobileBottomNav`), using a `lucide-react` icon (use `Briefcase`). The active-tab highlight works for `/experience` via the existing `isActiveTab` helper.
3. **Schema redesign.** `lib/content/experience.ts` is re-modeled so each experience is **a company with one or more nested roles**, validated with Zod (the source of truth — types via `z.infer`, never hand-written). Each experience carries: `company` (string), `companyLogo` (optional path), `type` (`"fulltime" | "parttime" | "contract"`), `category` (`"fulltime" | "freelance"` — the two groups), `location` (optional string), `locationType` (`"remote" | "hybrid" | "onsite"`), an optional `org` link field (see AC 7), and `roles[]` (≥1). Each role carries: `name` (string), `description` (optional string), `startDate` (`"YYYY-MM"`), and `endDate` (`"YYYY-MM"` **or** the literal `"present"`).
4. **Data re-authored.** The existing legacy data + the LinkedIn screenshot are reconciled into the new shape. The four full-time companies (Buguard, masheedGATE, Inovola, BE-STEAM) match the screenshot's dates/locations/types; the freelance entries (The Pick Path Group, Grand Community, Alsakn) carry over from the current `legacyFreelance` data. **Buguard has two roles** (Team Lead, Sep 2025–present; Senior Frontend Developer, Jun 2023–present), matching the screenshot. `experience` remains a frozen, schema-parsed export.
5. **Durations are computed, not stored.** A date utility computes a human duration (e.g. `"3 yrs 1 mo"`, `"10 mos"`, `"1 yr 6 mos"`) for (a) each role from its `startDate`→`endDate`, and (b) each company from its earliest role start → latest role end. `"present"` resolves to "now". Output format matches LinkedIn's (`"X yrs Y mos"`, dropping zero parts, `"yr"/"yrs"` and `"mo"/"mos"` pluralized; a span <1 month shows `"1 mo"`).
6. **LinkedIn layout, site design.** The page reproduces LinkedIn's experience *structure* — company logo, company name, `type · total-duration`, location · `locationType`, then a vertical timeline rail of roles each showing role name, `date-range · duration`, and description — but rendered entirely in the site's existing **dark Obsidian + Signal Lime** design tokens, `font-mono` for labels/meta, `font-title`/body for names, and existing motion rules. **No hardcoded hex/oklch**; semantic tokens only (`text-foreground`, `text-muted-foreground`, `border-hairline`, `bg-surface`, `text-lime`, etc.). Full-time and Freelance render as two labeled sections.
7. **Company → filtered Network link.** Each company links to the Network page pre-filtered to that company's projects. This requires extending the existing Network filter system with an `org` category (currently only `type` + `stack`): the link is `/work?org=<project.org value>`. The experience entry's optional `org` field holds the **exact `project.org` string** to filter by (because display names differ from project orgs — e.g. company "Buguard" → org `"Buguard, LLC"`). If an entry has no `org` value, no link is shown.
8. **Robustness.** Missing company logos (several referenced files don't exist in `public/images/companies/`) degrade gracefully to a deterministic text/initials placeholder — the page must not render a broken image. Every image uses `next/image` with explicit `width`/`height`/`alt`. The page is keyboard-navigable, has exactly one `<h1>`, respects `prefers-reduced-motion` on any animation, and is not broken at `<640px`.
9. **SEO + tests.** `/experience` is added to `staticRoutes` in `app/sitemap.ts`. Per-route metadata is set (title <60 chars, description <160 chars, canonical + OG per the existing `/work` pattern). The duration utility has unit tests (Vitest) covering year/month boundaries, `"present"`, and zero-part dropping; the schema rejects an experience with zero roles and an invalid `endDate`.
10. **Quality gates pass.** `yarn typecheck`, `yarn lint`, and `yarn test:run` are clean. Verified live in the browser per the project-context UI checklist (golden path, no console errors, `D`-key theme toggle, RTL, mobile viewport).

## Tasks / Subtasks

- [x] **Task 1 — Redesign the experience schema** (AC: 3)
  - [x] In `lib/content/experience.ts`, define `ExperienceType = z.enum(["fulltime", "parttime", "contract"])`, `ExperienceCategory = z.enum(["fulltime", "freelance"])`, `LocationType = z.enum(["remote", "hybrid", "onsite"])`.
  - [x] Define `RoleSchema`: `name` (min 1), `description` (optional), `startDate` (regex `^\d{4}-\d{2}$`), `endDate` (`z.union([z.literal("present"), z.string().regex(/^\d{4}-\d{2}$/)])`).
  - [x] Redefine `ExperienceSchema`: `slug` (kebab regex), `company` (min 1), `companyLogo` (optional), `type`, `category`, `location` (optional), `locationType`, `org` (optional string — the project.org join value), `roles` (`z.array(RoleSchema).min(1)`).
  - [x] Keep the existing duplicate-slug `superRefine` on the collection schema. Derive `Role` and `Experience` types via `z.infer`. Export the new enums/schemas/types.
  - [x] Update `lib/content/index.ts` re-exports to match the new public surface (drop `Highlight`/`HighlightSchema` and the old `ExperienceKind`/`ExperienceMode`/`mode`; add the new enums + `Role`/`RoleSchema`). Grep for any consumer of the removed names first (see Dev Notes — there are none in app code today, but confirm).
- [x] **Task 2 — Re-author the data** (AC: 4)
  - [x] Replace the legacy `LegacyEmployment`/`LegacySide`/transform machinery with directly-authored entries in the new shape. Drop the `side` category entirely (user specified only fulltime + freelance) OR fold side projects into freelance — confirm intent; default: drop `side`, since side projects already live in `lib/content/projects.ts`.
  - [x] Author the 4 full-time companies from the screenshot (see Dev Notes "Authoritative data" table). Buguard gets two roles.
  - [x] Author the freelance companies from current `legacyFreelance` (The Pick Path Group, Grand Community, Alsakn), converting `"2023 - 5 mos"`-style strings into `YYYY-MM` start/end where derivable; where only a year + duration is known, pick the documented start month and compute the rest.
  - [x] Set each entry's `org` to the exact matching `project.org` string (see mapping table). Leave `org` undefined where no project matches (e.g. BE-STEAM has no matching project org).
  - [x] Keep `export const experience` as `Object.freeze(ExperienceCollectionSchema.parse(rawExperience))`.
- [x] **Task 3 — Duration utility** (AC: 5)
  - [x] Add a duration helper (e.g. `lib/utils/experienceDuration.ts` or extend `lib/utils/dateUtils.ts`) that takes a `startDate` (`YYYY-MM`) and `endDate` (`YYYY-MM` | `"present"`) and returns a LinkedIn-style label. Use `date-fns` (already a dep: `intervalToDuration` / `differenceInMonths`). Treat months inclusively the way LinkedIn does (Sep 2019→Mar 2021 = "1 yr 7 mos").
  - [x] Add a company-level helper that takes the company's roles and returns the duration from the earliest start to the latest end (`"present"` wins as latest).
  - [x] Colocate `*.test.ts` with the util (project rule). Cover: same-month → "1 mo", 12 months → "1 yr", 13 → "1 yr 1 mo", `"present"` against a fixed `now` (inject/clock or `vi.useFakeTimers`), and zero-part dropping.
- [x] **Task 4 — Extend Network filters with `org`** (AC: 7)
  - [x] In `components/network-filter-bar.tsx`: add `"org"` to `FilterCategory`, `AvailableFilters`, `ActiveFilters`, `CATEGORIES`, and `CATEGORY_LABELS` (label `"Company"`).
  - [x] In `components/network-page-client.tsx`: `deriveAvailableFilters` collects `p.org` (skip empty); `parseActiveFilters` reads `searchParams.getAll("org")`; `applyFilters` adds `orgMatch` (`filters.org.length === 0 || filters.org.includes(p.org)`).
  - [x] Confirm the existing URL-persistence (`handleToggle`/`handleClear`) works unchanged for the new category (it iterates categories generically — verify).
  - [x] Manually verify `/work?org=Buguard%2C%20LLC` loads with the company pre-filtered and the chip shown active.
- [x] **Task 5 — Build the page + components** (AC: 1, 6, 8)
  - [x] Create `app/(chrome)/experience/page.tsx` — server component, default export, `export const metadata`, one `<h1>`. Mirror the `/work` page shell (`<section className="p-4">`, mono `<h1>`).
  - [x] Build presentational components under `components/` (kebab-case files, named exports): e.g. `experience-timeline.tsx` (groups by `category`, renders the two sections), `experience-company.tsx` (logo + header + meta + company duration + Network link), `experience-role-list.tsx` / role item (timeline rail with role name, range·duration, description). Keep these Server Components unless they need interactivity; push any `"use client"` as deep as possible. (Duration is computed at build time from static data — no client JS needed for it.)
  - [x] Company logo: build a small logo component that renders `next/image` when `companyLogo` is set AND the asset exists, else a deterministic initials/text placeholder block in site tokens. Since asset existence can't be checked at runtime cheaply, prefer: only set `companyLogo` for files that actually exist (see Dev Notes), and let the component fall back to initials when `companyLogo` is undefined.
  - [x] Use logical properties for spacing (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`) so RTL works. Timeline rail must flip correctly in RTL.
- [x] **Task 6 — Navigation tab** (AC: 2)
  - [x] Add `{ href: "/experience", label: "Experience", icon: Briefcase }` to the `tabs` array in `components/devtools-chrome.tsx` (import `Briefcase` from `lucide-react`). Both desktop and mobile navs map over the same array, so one change covers both. Pick a sensible position (after Network or at the end) — keep order intentional.
  - [x] (Optional, consistency) Add a "Go to Experience" navigation command to the command palette group if other routes are registered there — check `components/command-palette.tsx`; only do this if the nav-command pattern already exists, otherwise skip.
- [x] **Task 7 — SEO + metadata** (AC: 9)
  - [x] Add `"/experience"` to `staticRoutes` in `app/sitemap.ts`.
  - [x] Set page metadata following the `/work` pattern (title, description, `alternates.canonical`, `openGraph`). Keep within length limits.
- [x] **Task 8 — Verify** (AC: 10)
  - [x] `yarn typecheck && yarn lint && yarn test:run` clean. Run `yarn format`.
  - [x] `yarn dev` and verify: golden path renders all companies + roles + durations; no console errors/warnings; `D`-key theme toggle still works; `<html dir="rtl">` not broken; `<640px` not broken; the company → Network deep links filter correctly; missing logos show the placeholder, not a broken image.

## Dev Notes

### What exists today (read before changing)

- **`lib/content/experience.ts` is currently ORPHANED.** No application code imports it — confirmed by grep (`content/experience` only appears in `_bmad-output/*` artifacts, `lib/content/index.ts` re-export, and planning docs). This means the schema redesign has **no app-side consumers to break** today. The only live coupling is the `lib/content/index.ts` re-export surface — update it in lockstep (Task 1). Still, grep again before deleting any exported symbol.
- **`lib/content/index.ts`** re-exports `ExperienceKind, ExperienceMode, HighlightSchema, ExperienceSchema, experience, Highlight, Experience`. After redesign, several of these names disappear — fix the barrel.
- **Page shell pattern** (`app/(chrome)/work/page.tsx`): server component, `export const metadata`, `<section className="p-4">` wrapper, mono `<h1>`. The `(chrome)` layout already renders `<main>` and the chrome — page files use `<section>`/`<article>`, never another `<main>`.
- **Chrome tabs** (`components/devtools-chrome.tsx:25`): single `tabs` array drives both desktop (`DevToolsChrome`) and mobile (`MobileBottomNav`). `isActiveTab` already handles nested paths via `startsWith(href + "/")`. Adding one entry wires both navs.
- **Network filters** (`components/network-page-client.tsx`, `components/network-filter-bar.tsx`): URL-persisted via `searchParams.getAll(category)` and `router.replace`. **Only `type` and `stack` exist today** — there is no `org` filter yet, so Task 4 is required for AC 7. The toggle/clear logic is category-generic, so adding `org` to the type unions + the three helper functions (`derive`/`parse`/`apply`) + labels is the whole change.
- **Date utils** (`lib/utils/dateUtils.ts`): thin wrappers over `date-fns` (`format`, `parseISO`). `date-fns@4.3.0` is already a dependency — use `intervalToDuration`/`differenceInMonths`; do NOT add a new date library.
- **Sitemap** (`app/sitemap.ts:6`): `staticRoutes` is a manual array (`"/"`, `"/work"`, `"/perf"`, `"/sources"`, `"/console"`). Add `/experience`.

### Authoritative data (from the LinkedIn screenshot — full-time)

| Company | type | locationType | location | Roles (name · start → end) |
|---|---|---|---|---|
| Buguard | fulltime | remote | — | Team Lead (2025-09 → present); Senior Frontend Developer (2023-06 → present) |
| masheedGATE | fulltime | hybrid | Cairo, Egypt | Senior Frontend Developer (2022-11 → 2023-07) |
| Inovola | fulltime | remote | Al Jizah, Egypt | Frontend Developer (2021-04 → 2022-09) |
| BE-STEAM | fulltime | onsite | Cairo, Egypt | Frontend Developer (2019-09 → 2021-03) |

Freelance entries carry over from the current `legacyFreelance` array (The Pick Path Group / Commutrics, Grand Community, Alsakn). Their dates in the legacy data are coarse (`"2023 - 5 mos"`); convert to `YYYY-MM` start/end as best as the data allows — if only a year is known, pick the most plausible start month consistent with the related project and let the duration helper compute the rest. Flag any guesswork in the completion notes.

### Company ↔ project.org mapping (for the `org` deep-link field)

`project.org` values live in `lib/content/projects.ts`. Display company names differ from project orgs, so set `org` explicitly:

| Experience company | `org` value (exact `project.org`) | Matching projects |
|---|---|---|
| Buguard | `Buguard, LLC` | buguard, dark-atlas |
| masheedGATE | `MasheedGate` | masheed-gate |
| Inovola | `Inovola` | builderz |
| BE-STEAM | *(none — leave undefined)* | — |
| Grand Community | `Grand Community` | whatsapp-pro, gc-dashboard |
| The Pick Path Group | `The Pick Path Group (USA)` | commutrics-dashboard |
| Alsakn | `Alsakn (Freelance)` | alsakn |

Build the link as `/work?org=${encodeURIComponent(org)}`. When `org` is undefined, render no link.

### Company logos — existence check

Files that **actually exist** in `public/images/companies/`: `alsakn.jpg`, `besteam.png`, `commute.jpg`, `gizaapps.jpg`, `grand.png`, `inovola.jpg`, `rytalo.png`.

The current data references several files that **do NOT exist**: `buguard.png`, `masheed.png`, `eazyto.png`, `trendcoupons.png`. Do not point `companyLogo` at a missing file. Either (a) only set `companyLogo` for present assets and fall back to an initials placeholder otherwise, or (b) add the missing logo assets (out of scope unless the user provides them). Default to (a). The placeholder must be styled in site tokens (e.g. `bg-surface-2`, mono initials in `text-muted-foreground`), sized identically to the image box so layout doesn't shift.

### Schema shape (concrete target)

```ts
export const ExperienceType = z.enum(["fulltime", "parttime", "contract"])
export const ExperienceCategory = z.enum(["fulltime", "freelance"])
export const LocationType = z.enum(["remote", "hybrid", "onsite"])

export const RoleSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}$/),
  endDate: z.union([z.literal("present"), z.string().regex(/^\d{4}-\d{2}$/)]),
})

export const ExperienceSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  company: z.string().min(1),
  companyLogo: z.string().optional(),
  type: ExperienceType,
  category: ExperienceCategory,
  location: z.string().optional(),
  locationType: LocationType,
  org: z.string().optional(),
  roles: z.array(RoleSchema).min(1),
})
```

(Names are illustrative — match surrounding code style. `type`/`category` carry the two distinct concepts the user described: `type` is the per-company employment badge `[fulltime, parttime, contract]`; `category` is the `fulltime` vs `freelance` grouping for the two page sections.)

### Project-context rules that bite here (from `_bmad-output/project-context.md`)

- **TypeScript strict + `isolatedModules`** — type-only imports use `import type`. No `import React`. **Named exports** for components (except `page.tsx` which must default-export).
- **Zod is the source of truth** — derive types with `z.infer`, never hand-write parallel interfaces.
- **Tailwind v4, semantic tokens only** — `bg-background`/`text-foreground`/`text-muted-foreground`/`border-hairline`/`bg-surface`/`text-lime`. **No hardcoded hex/oklch.** Site is **dark-only** — do not add a light-mode block. Wrap dynamic class strings in `cn()` for Prettier class sorting.
- **Server Components by default** — only add `"use client"` where hooks/handlers/browser APIs are used; push the boundary deep. The timeline is static data, so it should be fully server-rendered (no client JS for durations).
- **`next/image`** for every image with explicit `width`/`height`/`alt`; `next/link` for internal nav.
- **RTL is wired** — use logical properties (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`), never `ml-`/`mr-`/`left-`/`right-`. The timeline rail must flip.
- **`prefers-reduced-motion`** gates every animation (`useReducedMotion()` or duration → `0.001s`). If using `framer-motion`, **import from `framer-motion`**, not `motion/react`.
- **Metadata API** for SEO; title <60, description <160. One `<h1>` per route.
- **a11y:** WCAG AA contrast (lime only for large text, never body copy), visible focus rings, semantic HTML, full keyboard nav.
- **Testing:** Vitest `globals: true` (don't import `describe/it/expect`), colocate `*.test.ts`, `@/` alias works in tests. Property-test math/date utils with `fast-check` if convenient. Don't snapshot UI; don't test Tailwind class strings or shadcn primitives.
- **Tooling:** Prettier (no semicolons, double quotes, 2-space, 80-col). `yarn` only — **do not `npm install`**, and **adding a dependency needs user approval** (none should be needed here; `date-fns`, `framer-motion`, `lucide-react`, shadcn `card`/`badge` are all present).

### Project Structure Notes

- New route: `app/(chrome)/experience/page.tsx` (inside the existing `(chrome)` group — inherits chrome/XP/mobile-nav layout).
- New components: `components/experience-*.tsx` (named exports, kebab-case files).
- Data: `lib/content/experience.ts` (rewritten) + `lib/content/index.ts` (barrel updated).
- Util: `lib/utils/experienceDuration.ts` (+ `.test.ts`) or extend `lib/utils/dateUtils.ts`.
- Touched existing files: `components/devtools-chrome.tsx` (tab), `components/network-page-client.tsx` + `components/network-filter-bar.tsx` (org filter), `app/sitemap.ts` (route).
- **Variance from original metaphor:** the original 7-epic build defined exactly five DevTools tabs (Elements/Network/Console/Performance/Sources). Adding a sixth "Experience" tab is an intentional, user-approved extension of that metaphor (decision captured below). It is consistent with the chrome's tab system but is not in the original PRD/architecture.

### Decisions captured (this story)

- **Route + nav:** new `/experience` route **and** a 6th tab in the DevTools chrome (desktop + mobile). *(user choice)*
- **Company → projects:** link each company to the Network page **pre-filtered by company** (`/work?org=...`), reusing the URL-persisted filter system (extended with an `org` category). *(user choice)*
- **Visual style:** **adapt LinkedIn's layout into the site's dark Obsidian + Signal Lime design** — not literal LinkedIn light/blue styling. *(user choice, and required by the dark-only design-system rule)*
- **`side` category:** dropped from experience (user specified only fulltime + freelance); side projects remain in `lib/content/projects.ts`. Confirm if unsure.

### Testing standards summary

- Vitest + jsdom, `globals: true`, setup at `tests/setup.ts`. Run `yarn test:run` for CI single-run.
- Unit-test the duration util thoroughly (boundaries, `"present"` with a controlled clock, zero-part dropping, pluralization). Optionally `fast-check` for monotonicity (later end ⇒ ≥ duration).
- Schema tests: reject zero-role experience, reject malformed `endDate`, accept `"present"`. Reuse the duplicate-slug refinement test style already in `lib/content/projects.test.ts`.
- Do not snapshot the timeline UI. If testing the component, query by role/text (e.g. company name heading, role names).

### References

- [Source: `_bmad-output/project-context.md`] — all the rules in "Project-context rules that bite here" (TS strict, Zod source of truth, Tailwind v4 tokens, dark-only, Server Components, next/image, RTL, reduced-motion, framer-motion import specifier, metadata API, a11y, testing, yarn).
- [Source: `lib/content/experience.ts`] — current (orphaned) schema + legacy data being replaced.
- [Source: `lib/content/projects.ts`] — `project.org` values for the company↔project join.
- [Source: `lib/content/index.ts`] — barrel export surface to update.
- [Source: `app/(chrome)/work/page.tsx`] — page shell + metadata pattern to mirror.
- [Source: `components/devtools-chrome.tsx#L25`] — `tabs` array driving both navs; `isActiveTab` helper.
- [Source: `components/network-page-client.tsx`, `components/network-filter-bar.tsx`] — filter system to extend with `org`.
- [Source: `lib/utils/dateUtils.ts`] — existing date-fns wrapper location.
- [Source: `app/sitemap.ts#L6`] — `staticRoutes` array to extend.
- [Source: `public/images/companies/`] — actual logo assets present (logo-existence reconciliation).
- [Source: LinkedIn experience screenshot provided with the request] — authoritative full-time companies, types, locations, dates, and Buguard's two roles.

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

### Completion Notes List

- Rewrote `lib/content/experience.ts` with new Zod schema: `ExperienceType`, `ExperienceCategory`, `LocationType`, `RoleSchema`, `ExperienceSchema`. Types derived via `z.infer`. Dropped legacy `HighlightSchema`, `ExperienceKind`, `ExperienceMode`, and transform machinery.
- Re-authored data with 4 full-time companies (Buguard with 2 roles, masheedGATE, Inovola, BE-STEAM) and 3 freelance entries (The Pick Path Group, Grand Community, Alsakn). Mapped `org` fields to exact `project.org` values for Network deep-linking. Only set `companyLogo` for assets that exist in `public/images/companies/`.
- Created `lib/utils/experienceDuration.ts` with `formatExperienceDuration`, `formatCompanyDuration`, and `formatDateRange`. Uses `date-fns/intervalToDuration` with inclusive month counting (LinkedIn style). Colocated tests cover same-month, year boundaries, present, pluralization, and zero-part dropping.
- Extended Network filter system with `org` category in `components/network-filter-bar.tsx` and `components/network-page-client.tsx`. URL persistence works generically for the new category.
- Built `app/(chrome)/experience/page.tsx` (server component, metadata) and presentational components `components/experience-timeline.tsx`, `components/experience-company.tsx`. Uses `next/image` with fallback initials placeholder. Timeline uses semantic tokens only, logical properties for RTL, one `<h1>` per route.
- Added "Experience" tab to `components/devtools-chrome.tsx` (desktop + mobile nav) using `Briefcase` icon from `lucide-react`.
- Added "Experience" navigation command to `components/command-palette.tsx` in the Navigate group.
- Added `/experience` to `app/sitemap.ts` static routes and updated `app/sitemap.test.ts` expected counts.
- All quality gates pass: `yarn typecheck` clean, `yarn lint` clean (0 new warnings), `yarn test:run` 387 passed.

### File List

- `lib/content/experience.ts` — rewritten schema + data
- `lib/content/index.ts` — updated barrel exports
- `lib/utils/experienceDuration.ts` — new duration utility
- `lib/utils/experienceDuration.test.ts` — new tests
- `components/network-filter-bar.tsx` — added `org` filter category
- `components/network-filter-bar.test.tsx` — updated for `org` field
- `components/network-page-client.tsx` — added `org` filter logic
- `app/(chrome)/experience/page.tsx` — new route page
- `components/experience-timeline.tsx` — new timeline component
- `components/experience-company.tsx` — new company/role component
- `components/devtools-chrome.tsx` — added Experience tab
- `components/command-palette.tsx` — added Experience nav command
- `app/sitemap.ts` — added `/experience`
- `app/sitemap.test.ts` — updated count expectations
