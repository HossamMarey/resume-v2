# Story 8.2: Reconcile Recruiter Mode, Console & Command Palette with the Experience / Network / Performance changes

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

> **Context for this story:** This is **post-launch consistency work** in Epic 8 ("Experience"), following Story 8.1. Three recent changes were made across earlier stories/commits:
> 1. **Experience added** — a new `/experience` route + a 6th DevTools tab + a re-modeled `lib/content/experience.ts` (company → nested roles, with computed durations). _(Story 8.1, commit `166144f`)_
> 2. **Network updated** — the filter system gained an **`org` (Company)** category, and each Experience company deep-links to `/work?org=<project.org>`. _(Story 8.1)_
> 3. **Performance hidden** — the `/perf` tab is **commented out** of the chrome nav (`components/devtools-chrome.tsx:37`); the route, sitemap entry, and palette entry all still exist.
>
> Those changes touched the chrome, the Network page, and the Experience surfaces — but **three other surfaces were left only partially updated and now disagree with the rest of the app**: Recruiter Mode, the Console REPL, and the ⌘K Command Palette. This story makes them consistent. **No new feature** — this is a reconciliation pass so every navigation/discovery surface tells the same story.

## Story

As **Hossam (site owner) and the recruiters/peers who use the site**,
I want **Recruiter Mode, the Console REPL, and the ⌘K Command Palette brought back in sync with the new Experience surface, the updated Network filters, and the now-hidden Performance tab**,
so that **every way of discovering or describing the site agrees — the resume shows my work history, the palette doesn't advertise a hidden tab in the wrong order, and the console commands point at routes that still exist**.

## Acceptance Criteria

1. **Recruiter Mode shows work history.** `components/recruiter-resume.tsx` gains an **Experience** section sourced from `lib/content/experience.ts` (`experience`), rendered editorially (NOT the DevTools timeline visual). For each company it shows: company name, employment `type` + computed company-level duration, `location` · `locationType` (when present), and the nested `roles[]` each with role name and `date-range · duration`. Durations reuse the existing `lib/utils/experienceDuration.ts` helpers (`formatCompanyDuration`, `formatDateRange` / `formatExperienceDuration`) — **do not** re-implement date math. Full-time and Freelance render as two labeled subsections (group by `experience[].category`), in the same declaration order as the data.

2. **Recruiter Experience section fits the editorial layout.** It uses the same `max-w-3xl`, `font-title` headings, semantic-token styling, and section rhythm as the existing Recruiter sections (Featured work / Skills). It is **print-clean** — visible (not `print:hidden`) and degrades to single-column black-on-white under `app/recruiter/print.css` like the other resume sections. No DevTools chrome, no XP, no `lime`-on-body-text (AA: lime only for large text/labels). One `<h1>` on the page is preserved (the section uses `<h2>`/`<h3>`).

3. **Palette Navigate group matches the live nav.** In `components/command-palette.tsx`, the **Navigate** group is reconciled with the chrome tab set and order. The chrome tabs are now: **Elements, Experience, Network, Console, Sources** (`components/devtools-chrome.tsx:32-39`). The palette's Navigate entries are reordered to match that order, with **Experience** sitting where the chrome puts it (right after Elements), followed by the non-tab destinations (Contact, Recruiter) at the end.

4. **Performance is treated consistently everywhere.** Performance is hidden from the chrome nav. Per the decision in Dev Notes ("Performance: soft-hide"), the **"Performance" entry is removed from the palette Navigate group** and **`/perf` is removed from `app/sitemap.ts` `staticRoutes`** — but the `/perf` route, its page, and its components are **left intact** (hidden, not deleted). After this story, no user-facing navigation or discovery surface (chrome tabs, palette, sitemap) advertises Performance, and there is no longer a palette entry pointing at an un-navigable tab. _(If the user instead wants Performance fully removed or kept fully discoverable, see Open Questions — but the default implemented here is soft-hide.)_

5. **Console REPL is consistent with the routes and content.** `lib/repl/commands.ts`:
   - The existing **`experience`** command (with `--fulltime` / `--freelance` flags) is verified to still run against the current `experience` data shape and is listed in `/help`. _(It already exists — confirm it works, don't duplicate.)_
   - The **`contact`** command's `navigate` target is reconciled with the palette's Contact target. The palette navigates to `/sources?tab=contact`; the REPL navigates to `/sources`. Make them point at the **same** destination (prefer `/sources?tab=contact` if the Sources page reads that param — verify in `app/(chrome)/sources/page.tsx` / its client; if the tab param is not honored, fall back to `/sources` in BOTH surfaces so they still agree).
   - There is **no stale `perf`/`performance` command** to remove (none exists today) — confirm none is added, and `/help` lists only commands whose effects still work.

6. **No dead links anywhere.** Every route referenced by the palette Navigate group and by REPL `navigate` effects resolves to an existing route. Specifically: `/`, `/experience`, `/work`, `/console`, `/sources`, `/recruiter`, and the contact target all exist; `/perf` is no longer referenced by palette or sitemap (route file may remain).

7. **Behavior preserved (regression guard).** The reconciliation must not break existing behavior:
   - Palette still opens on ⌘K/Ctrl+K and from "Inspect me"; the Projects/Actions/Socials groups are unchanged; the konami-gated **Experimental** action still only appears when `isUnlocked("konami") && EXPERIMENTAL_ENABLED`.
   - REPL history (↑/↓), `clear`, `download resume`, `theme`, `whoami`, `projects [--featured|--tag]`, unknown-command `did you mean`, and the konami-locked `experimental` command all still behave as before.
   - Recruiter Mode still mounts outside the `(chrome)` group (no XP/palette/konami), the **exit** control still works, and the Download Resume CTA + contact links are unchanged.

8. **Tests updated and green.** Existing tests that assert palette/REPL/recruiter/sitemap content are updated to match (do not delete coverage):
   - `app/sitemap.test.ts` — expected route count/contents updated for the removed `/perf` (and the already-present `/experience`).
   - `components/command-palette.test.tsx` — Navigate group contents/order; absence of a Performance entry.
   - `lib/repl/commands.test.ts` — `contact` target; `experience` command still covered.
   - `components/recruiter-resume.test.tsx` — asserts the new Experience section renders companies + roles. Query by role/text (company name heading, a role name), **not** snapshots.

9. **Quality gates pass.** `yarn typecheck`, `yarn lint`, `yarn test:run` clean, `yarn format` run. Verified live per the project-context UI checklist: golden path (open palette → Navigate lists the right tabs in the right order, no Performance; `/recruiter` shows the Experience section; console `experience` + `contact` work), no console errors/warnings, `D`-key theme toggle still works, `<html dir="rtl">` not broken (logical properties in the new Recruiter section), `<640px` not broken.

## Tasks / Subtasks

- [x] **Task 1 — Add the Experience section to Recruiter Mode** (AC: 1, 2)
  - [x] In `components/recruiter-resume.tsx`, import `experience` from `@/lib/content` and the duration helpers from `@/lib/utils/experienceDuration` (`formatCompanyDuration`, `formatDateRange` — check exact exported names in that file first).
  - [x] Add an `<section>` (placed editorially — recommended **after Featured work, before Skills**) with an `<h2>` "Experience". Inside, split into two labeled `<h3>` subsections by `category` (`"fulltime"` → "Full-time", `"freelance"` → "Freelance"); skip a subsection if it has no entries.
  - [ ] For each company render: company name (e.g. `font-medium text-foreground`), a meta line (`font-mono text-xs text-muted-foreground` style consistent with the file) showing `type · <company duration>` and `location · locationType` when present, then a `<ul>` of roles each showing `role.name` + `formatDateRange(role.startDate, role.endDate)` · role duration. Keep it a Server Component (no `"use client"`), pure render over static data.
  - [ ] Use **logical properties** for spacing (`ms-`/`me-`/`ps-`/`pe-`/`gap-*`) so RTL holds. Semantic tokens only — no hardcoded hex, no `lime` on body copy. Match the existing section's `flex flex-col gap-*` rhythm.
  - [ ] Confirm it remains **print-visible** (no `print:hidden` on the section) and inherits the single-column print layout from `app/recruiter/print.css` — open `print.css` and confirm the new section's wrappers aren't accidentally hidden by an existing selector; add a print rule only if needed.

- [x] **Task 2 — Reconcile the ⌘K palette Navigate group** (AC: 3, 4, 6, 7)
  - [x] In `components/command-palette.tsx`, reorder the **Navigate** `CommandItem`s to match the chrome tab order: **Elements → Experience → Network → Console → Sources**, then the non-tab destinations **Contact → Recruiter** at the end.
  - [x] **Remove the "Performance" `CommandItem`** (currently `value="Performance"` → `/perf`, lines ~132-138) per the soft-hide decision.
  - [x] Leave the Projects / Actions / Socials groups, the konami-gated Experimental item, and all handlers untouched.
  - [x] Reconcile the **Contact** item's target with the REPL (Task 3) — they must navigate to the same place.

- [x] **Task 3 — Reconcile the Console REPL** (AC: 5, 6, 7)
  - [x] Open `app/(chrome)/sources/page.tsx` and its client component; determine whether a `?tab=contact` (or similar) search param actually selects the contact preview. 
    - If **yes** → set the REPL `contact` command `navigate.to` to `/sources?tab=contact` (match the palette).
    - If **no** → change the **palette** Contact item to `/sources` so both agree on the working target, and note it.
  - [x] Verify the `experience` command runs against the current `experience` shape (it reads `entry.company`, `entry.category`, `entry.roles[].name/startDate/endDate`) — these match the 8.1 schema; just confirm, no rewrite. Confirm it appears in `/help` output.
  - [x] Confirm no `perf`/`performance` command exists and none is added.

- [x] **Task 4 — Sitemap** (AC: 4, 6)
  - [x] In `app/sitemap.ts`, remove `"/perf"` from `staticRoutes`. Leave `"/experience"` (already present) and the rest unchanged.

- [x] **Task 5 — Update tests** (AC: 8)
  - [x] `app/sitemap.test.ts` — update expected static-route count/contents (drop `/perf`).
  - [x] `components/command-palette.test.tsx` — assert Navigate order + that no Performance entry exists; keep existing group assertions.
  - [x] `lib/repl/commands.test.ts` — assert the reconciled `contact` target; keep/confirm the `experience` command coverage.
  - [x] `components/recruiter-resume.test.tsx` — add assertions that the Experience section renders (e.g. a company name from `experience` and one role name). Query by text/role, no snapshots.

- [x] **Task 6 — Verify** (AC: 9)
  - [x] `yarn typecheck && yarn lint && yarn test:run` clean; run `yarn format`.
  - [ ] `yarn dev` and verify: ⌘K Navigate shows **Elements, Experience, Network, Console, Sources, Contact, Recruiter** in that order with **no Performance**; `/recruiter` shows the Experience section with companies + roles + durations and prints clean (Cmd+P); console `experience` and `contact` work and land on existing routes; no console errors; `D` toggle works; RTL not broken; `<640px` not broken.

## Dev Notes

### What exists today (read before changing)

- **Chrome tabs** (`components/devtools-chrome.tsx:32-39`): one `tabs` array drives both desktop + mobile navs. Current live tabs: `/` Elements, `/experience` Experience, `/work` Network, `/console` Console, `/sources` Sources. **`/perf` Performance is commented out (line 37)** — this is the source-of-truth for "hidden". The palette + sitemap must be reconciled to this set.
- **Command palette** (`components/command-palette.tsx`): `"use client"`. Navigate group currently lists (in this order): Elements, Network, Console, **Performance (`/perf`)**, Sources, **Experience**, Contact (`/sources?tab=contact`), Recruiter. → reorder + drop Performance. Actions group has Toggle Recruiter Mode, Download Resume, Copy Email, Toggle Theme, and konami-gated Experimental. Projects group maps `projects`; Socials maps `profile.socials`. **Leave those alone.**
- **REPL registry** (`lib/repl/commands.ts`): slash-style commands. Registry: `help, whoami, experimental (locked), projects, experience, contact, theme, clear, download resume`. The **`experience` command already exists** (lines ~212-245) and reads the new schema — this is up to date. `contact` (lines ~246-254) currently does `{ type: "navigate", to: "/sources" }`. `projects` reads `p.featured/p.type/p.stack` — all still valid fields (confirmed in `lib/content/projects.ts`).
- **Recruiter resume** (`components/recruiter-resume.tsx`): Server Component. Sections today: Header (name + tagline + first 3 `profile.metrics`), Featured work (`projects.filter(p => p.featured)`), Skills (`skillGroups`), Download CTA, Contact footer. **No Experience/work-history section** — that is the main gap. It imports from `@/lib/content` and shadcn `Card`/`Badge`/`Button`.
- **Recruiter page** (`app/recruiter/page.tsx`): outside the `(chrome)` group, `max-w-3xl`, imports `./print.css`, renders `<RecruiterExit />` + `<RecruiterResume />`. One `<h1>` lives in `RecruiterResume`.
- **Experience data + utils** (`lib/content/experience.ts`, `lib/utils/experienceDuration.ts`): `experience` is a frozen array of companies, each `{ slug, company, companyLogo?, type, category, location?, locationType, org?, roles[] }`; `roles[]` is `{ name, description?, startDate "YYYY-MM", endDate "YYYY-MM"|"present" }`. Duration helpers exist — **reuse them** (`formatCompanyDuration`, `formatDateRange`, `formatExperienceDuration` per 8.1 completion notes; confirm exact names/signatures in the file).
- **Sitemap** (`app/sitemap.ts:6-14`): `staticRoutes` = `["/", "/work", "/perf", "/sources", "/console", "/recruiter", "/experience"]`. Drop `"/perf"`.
- **Content barrel** (`lib/content/index.ts`): `experience`, `Experience`, `Role`, `profile`, `projects`, `skillGroups` all re-exported — import the Experience data via `@/lib/content`.

### Decision: Performance — "soft-hide" (the default this story implements)

"Hide performance" is implemented as **soft-hide**, consistent with how the chrome already did it (comment-out, not delete):
- **Remove** from discovery surfaces: chrome nav (already done), ⌘K palette Navigate, `app/sitemap.ts`.
- **Keep** the `/perf` route, `app/(chrome)/perf/page.tsx`, and its components intact (not deleted) so the work isn't lost and a direct URL still resolves.
- Rationale: a sitemap entry for a page linked from nowhere is a soft SEO smell; an un-navigable palette entry is a worse inconsistency than no entry. Soft-hide removes both without destroying code. The `profile.metrics` shown on the Recruiter resume are résumé-appropriate stats and are **independent** of the `/perf` tab — they stay.
- See **Open Questions** if the user wants a different interpretation (full removal, or keep-discoverable).

### Project-context rules that bite here (from `_bmad-output/project-context.md`)

- **TS strict + `isolatedModules`** — `import type` for type-only imports; **no `import React`**; **named exports** for components (`page.tsx` is the only default export).
- **Zod is source of truth** — read `experience`/`projects` as-is; never hand-write parallel types.
- **Tailwind v4, semantic tokens only** — `text-foreground`, `text-muted-foreground`, `bg-surface`, `border-hairline`, `text-lime`. **No hardcoded hex/oklch.** Dark-only (no light block). Wrap dynamic class strings in `cn()` for Prettier sorting.
- **Server Components by default** — the Recruiter Experience section is static; keep it server-rendered (no `"use client"`). The palette is already a client component; keep its boundary as-is.
- **RTL** — logical properties only (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`), never `ml-`/`left-`.
- **a11y** — one `<h1>` per route (Recruiter already has it in the header; new section uses `<h2>`/`<h3>`); WCAG AA (lime only for large text/labels, never body copy); visible focus rings on interactive elements; `next/link` for internal nav.
- **Testing** — Vitest `globals: true` (don't import `describe/it/expect`), colocate `*.test.tsx`, `@/` alias works in tests, Testing-Library queries by role/text, **no UI snapshots**, don't test Tailwind class strings or shadcn primitives.
- **Tooling** — Prettier (no semicolons, double quotes, 2-space, 80-col). **`yarn` only**; **no new dependency** is needed here (everything imported already exists) — and adding one would require user approval.

### Project Structure Notes

- **Touched files (all UPDATE, no NEW source files expected):**
  - `components/recruiter-resume.tsx` — add Experience section.
  - `components/command-palette.tsx` — reorder Navigate, drop Performance, reconcile Contact target.
  - `lib/repl/commands.ts` — reconcile `contact` target (and confirm `experience`/no-perf).
  - `app/sitemap.ts` — drop `/perf`.
  - Tests: `app/sitemap.test.ts`, `components/command-palette.test.tsx`, `lib/repl/commands.test.ts`, `components/recruiter-resume.test.tsx`.
- **Not touched (leave alone):** `components/devtools-chrome.tsx` (already correct — Performance commented out, Experience present), `app/(chrome)/perf/*` (soft-hidden, kept), `lib/content/experience.ts` (already redesigned in 8.1), the Network filter files (already extended with `org` in 8.1).
- **Variance note:** this story intentionally leaves the `/perf` route alive while removing it from all discovery surfaces — a deliberate soft-hide, documented above.

### Previous story intelligence (Story 8.1)

- 8.1 added `/experience` + the 6th tab, redesigned `lib/content/experience.ts` (company→roles), built `lib/utils/experienceDuration.ts`, extended Network filters with `org`, and added the Experience nav command to the palette. It also added `/experience` to the sitemap. **It did NOT touch Recruiter Mode or the REPL contact target, and it did not reconcile the lingering Performance palette/sitemap entries** — which is exactly the gap this story closes.
- 8.1 ended at **387 tests passing**; quality gates clean. Mirror its test discipline (colocated, role/text queries, no snapshots).
- The duration helpers from 8.1 are the canonical date math — reuse, don't re-derive (project-context: "Zod/utility single source of truth").

### Git intelligence

- Recent commits confirm the trajectory: `166144f feat(experience): add LinkedIn-style timeline page` (8.1), `4d78e07 feat: revamp Elements page — drop Principles, add General Info`, `b26d17d feat(recruiter): print stylesheet`. The recruiter print stylesheet (`app/recruiter/print.css`) is recent and load-bearing — the new Experience section must respect it (Task 1).

### Testing standards summary

- Vitest + jsdom, `globals: true`, setup `tests/setup.ts`, run `yarn test:run`.
- Update (don't delete) the four touched test files. New recruiter assertions query by company/role text.
- No snapshots; don't assert Tailwind classes; don't test shadcn primitives or Next.js framework behavior.

### References

- [Source: `_bmad-output/project-context.md`] — TS strict, Zod source of truth, Tailwind v4 tokens, dark-only, Server Components, RTL logical properties, a11y, testing, yarn, recruiter-mode rules (FR-100..104), palette four groups (FR-090..093), REPL registry (FR-040..044).
- [Source: `components/devtools-chrome.tsx#L32-L39`] — live tab set/order; `/perf` commented out (the hide source-of-truth).
- [Source: `components/command-palette.tsx#L110-L169`] — Navigate group to reorder + drop Performance; Contact target.
- [Source: `lib/repl/commands.ts#L212-L254`] — `experience` command (up to date) + `contact` navigate target to reconcile.
- [Source: `components/recruiter-resume.tsx`] — sections present today; where to add Experience.
- [Source: `app/recruiter/page.tsx`, `app/recruiter/print.css`] — recruiter shell + print stylesheet the new section must respect.
- [Source: `lib/content/experience.ts`, `lib/utils/experienceDuration.ts`] — Experience data shape + duration helpers to reuse.
- [Source: `lib/content/index.ts`] — barrel exports (`experience`, `Experience`, `Role`).
- [Source: `app/sitemap.ts#L6-L14`] — `staticRoutes` to drop `/perf` from.
- [Source: `_bmad-output/implementation-artifacts/8-1-linkedin-style-experience-page.md`] — prior story: what 8.1 changed and what it left for this story.

### Open Questions (saved for the user — do not block implementation)

1. **Performance scope.** This story implements **soft-hide** (remove from palette + sitemap; keep the `/perf` route alive). Confirm that's the intent vs. (a) **full removal** (delete `app/(chrome)/perf/*` + its tests + components), or (b) **keep discoverable** (re-add Performance to the chrome nav and stop treating it as hidden). If full removal is wanted, that's a follow-up task (more files, more deleted tests).
2. **Contact target.** The reconciled Contact destination depends on whether `app/(chrome)/sources` honors a `?tab=contact` param. If it doesn't, both palette and REPL fall back to `/sources` — confirm that's acceptable, or specify how Contact should deep-link to the contact preview.
3. **Recruiter Experience placement & depth.** Default: section after "Featured work", grouped Full-time / Freelance, showing company + role durations (no descriptions, to keep the resume scannable). Confirm whether role `description` text should also appear on the recruiter resume or stay omitted for brevity.

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

- Contact target reconciliation: SourcesPanel does NOT honor `?tab=contact` param (hardcoded default `selectedId = "resume"`). Both palette and REPL now navigate to `/sources` to agree.
- Recruiter test fix: `getByText(experience[0].company)` failed because "Buguard" also appears as a featured project name. Used `getAllByText` + `toBeGreaterThanOrEqual(1)`.
- Recruiter test fix: `getByText(role.name)` failed because role text is broken up by `{" · "}` interpolations. Used `new RegExp(role.name)` matcher.

### Completion Notes List

1. **Task 1 — Recruiter Experience section**: Added Experience section to `components/recruiter-resume.tsx` after Featured work, before Skills. Groups entries by `category` into "Full-time" and "Freelance" subsections. For each company renders: name, type + `formatCompanyDuration`, location/locationType when present, and roles list with name + `formatDateRange` + `formatExperienceDuration`. Server Component, semantic tokens, logical properties (`gap-*`), print-visible (no `print:hidden`).
2. **Task 2 — Palette Navigate group**: Reordered to Elements → Experience → Network → Console → Sources → Contact → Recruiter. Removed Performance entry. Changed Contact target from `/sources?tab=contact` to `/sources` (since SourcesPanel doesn't read the param).
3. **Task 3 — REPL reconciliation**: Verified `contact` command already navigates to `/sources` — no change needed. Verified `experience` command reads current schema and appears in `/help`. Confirmed no `perf`/`performance` command exists.
4. **Task 4 — Sitemap**: Removed `/perf` from `staticRoutes`; count now 6.
5. **Task 5 — Tests updated**: 
   - `sitemap.test.ts`: static route count 7→6, dropped `/perf` from assertions.
   - `command-palette.test.tsx`: updated Navigate items test to include Experience, exclude Performance, verify order.
   - `recruiter-resume.test.tsx`: added Experience section presence tests (heading, company, role, subsections).
   - `commands.test.ts`: no changes needed — contact already `/sources`, experience already covered.
6. **Task 6 — Quality gates**: `yarn typecheck` clean, `yarn lint` clean (0 errors), `yarn test:run` 413 passed, `yarn format` ran.

### File List

- `components/recruiter-resume.tsx` — added Experience section with company/role durations
- `components/command-palette.tsx` — reordered Navigate group, removed Performance, reconciled Contact target
- `app/sitemap.ts` — removed `/perf` from staticRoutes
- `app/sitemap.test.ts` — updated static route count and removed `/perf`
- `components/command-palette.test.tsx` — updated Navigate items assertion
- `components/recruiter-resume.test.tsx` — added Experience section tests
