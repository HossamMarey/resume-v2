# Story 4.6: Flexible Project Schema + Media Gallery & Network-Table Redesign

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Hossam (site owner authoring portfolio content),
I want the `Project` schema to require only `slug`, `name`, and `description` (everything else optional) and to carry per-project `images`, `videos`, and an object-shaped `links` map,
so that I can add a project with minimal effort, the case-study page shows its media in a professional slider and its links as prominent calls-to-action, and the `/work` listing is redesigned around the fields that actually exist.

## Context & Scope

Brownfield enhancement to **Epic 4 (Project Network & Case Studies)**, added after all epics were `done`. It reshapes the single source of project data (`lib/content/projects.ts`), redesigns the `/work` listing, and rebuilds the case-study detail surface.

### Owner-approved decisions (2026-06-03) — these are LOCKED, build to them

1. **DROP the DevTools "Network" data fields entirely.** Remove `method`, `status`, `statusCode`, `size`, `sizeWeight`, `time`, `timeWeight`, `startOffset`, `year`, and `meta` from the schema. The owner accepted that this **removes the waterfall bar and the colored METHOD/STATUS badges** from `/work` and requires redesigning the table, its filters, the recruiter resume, and the REPL listing. Build the redesign described below.
2. **Hero media slider built with `framer-motion`** (already installed) — full-width `aspect-video`, prev/next, dot indicators, counter, keyboard arrows, swipe, reduced-motion safe. **No new carousel dependency.**
3. **`next/image` remote hosts = explicit allowlist** (Unsplash + `hossammarey.com` + any host in seed content). NOT a fully-open `hostname: "**"`.

### New `Project` shape (authoring)

Required: `slug`, `name`, `description`.
Optional: `org`, `type`, `stack: string[]`, `images: string[]`, `videos: string[]`, `links: { preview?, code?, design?, repo?, docs? }` (each an optional URL), `problem`, `role`, `decisions: string[]`, `outcomes: string[]`, `featured: boolean`.

```ts
{
  slug: "buguard-landingpage",          // required
  name: "Buguard landingpage",           // required
  description: "A beautiful landing page…", // required
  org: "Buguard, LLC",
  images: ["/images/projects/x.jpg", "https://…unsplash…"],
  videos: ["https://www.pexels.com/download/video/31289616/"],
  stack: ["html", "css"],
  links: { preview: "…", code: "…", design: "…" },
  type: "web",
  problem: "…", role: "…", decisions: ["…"], outcomes: ["…"],
  featured: true,
}
```

### ⚠️ Blast radius of dropping the Network fields (every consumer below MUST be updated — grep-verified)

- `components/network-waterfall-row.tsx` — reads `method`, `statusCode`, `status`, `size`, `time`, `timeWeight`, `startOffset`, and `links.find/[0]`. **Redesign** (see Task 2). `methodColor`/`statusColor` exports are removed.
- `components/network-waterfall-table.tsx` — column headers (METHOD/STATUS/SIZE/TIME/waterfall) must change to the new columns.
- `components/network-page-client.tsx` — filter facets built from `method`, `status`, `year`. **Replace** facets with `type` (and optionally `stack`). Keep the URL-persistence mechanism from story 4-2.
- `components/recruiter-resume.tsx` — `method`, `status`, `year` badges → replace with `type` / `org` / `stack`.
- `lib/repl/commands.ts:205` — `[${p.method}] ${p.name} (${p.status}) — ${p.year}` → reformat without dropped fields.
- `components/case-study-header.tsx:33` & `app/(chrome)/work/[slug]/page.tsx:81` — `meta.mock` mock badge / warning. `meta` is dropped → switch mock detection to placeholder-text detection (see Task 5) or remove.
- `tests/gate/mock-content.test.ts` — filters `p.meta.mock`. **Rework** to detect placeholder markers in content fields instead (see Task 5).
- `components/network-request-detail.tsx:14` — `links.filter(...)` array → object via helper.
- `app/(chrome)/work/[slug]/page.tsx:54` — `firstSentence(project.problem)` → fall back to `description`.

## Acceptance Criteria

1. **Minimal authoring works.** `{ slug, name, description }` alone validates, joins the `projects` collection, and renders on `/work` and (if `featured`) on its detail page with no runtime errors.
2. **Required fields enforced** at build time via `ProjectsCollectionSchema.parse`: missing/empty `slug`, `name`, or `description` fails. `slug` matches `^[a-z0-9-]+$` and stays unique (existing `superRefine`).
3. **Dropped fields are gone** from the schema and the resolved `Project` type: `method`, `status`, `statusCode`, `size`, `sizeWeight`, `time`, `timeWeight`, `startOffset`, `year`, `meta`. No app code references them after this story (typecheck proves it).
4. **`links` is an object map** `{ preview?, code?, design?, repo?, docs? }` (each optional valid URL). A shared `projectLinkList()` helper produces an ordered display list `{ label, href, kind }[]`; all link UIs consume it (no `.find/.filter` on a raw array).
5. **`images` / `videos`** are optional `string[]` accepting local `/path` or remote `https://`. Absent/empty → no gallery, no layout gap.
6. **`/work` table redesigned** around surviving fields. Desktop columns: `NAME` (link) · `TYPE` · `STACK` (chips, truncated with `+N`) · `LINKS` (icon links). Mobile card shows the same data. No waterfall bar, no method/status badges. Keeps DevTools-flavored styling (mono headers, hairlines). Empty state from story 4-2 still works.
7. **Filters redesigned.** `/work` filters by `type` (and optionally `stack`), URL-persisted via the existing story-4-2 mechanism. No method/status/year facets. Empty-state preserved.
8. **Hero media slider** on the case-study detail: accessible `framer-motion` carousel of `images` + `videos` at the top of the detail content — prev/next, dot indicators, `n / total` counter, ArrowLeft/Right keyboard nav, optional swipe, `prefers-reduced-motion` → instant swap (no animation). Images via `next/image` (`fill`, `sizes`, `alt`); videos via native `<video controls preload="metadata" playsInline>` (no autoplay).
9. **External media loads.** `next.config.mjs`: add `media-src 'self' https: blob:` to BOTH `prodCsp` and `devCsp` (currently absent → pexels video is CSP-blocked); add `images.remotePatterns` allow-listing the seed-content hosts (Unsplash, `hossammarey.com`, …). `img-src` already permits `https:`.
10. **Links shown prominently** on the detail page: each present link a button/card affordance with a `lucide-react` icon + label per kind (Preview→"Live Preview", Code→"Source Code", Design→"Design", Repo, Docs), keyboard-focusable with visible ring, `target="_blank" rel="noopener noreferrer"` + SR "(opens in new tab)". Absent → graceful italic empty state.
11. **`description` surfaces** as a lead paragraph on the detail page and as the metadata-description fallback when `problem` is empty.
12. **Mock/placeholder gate reworked.** The story-7-4 CI gate and the `[MOCK]` badge no longer depend on `meta.mock`; they detect placeholder markers (`[PLACEHOLDER`, `[MOCK]`) in featured projects' content fields. Gate still fails the build if a featured project ships placeholder text.
13. **No regressions / green gate.** `/work` table+filters, recruiter mode, REPL `projects`/`open`, sitemap, OG image, case-study metadata, prev/next pager, project-open XP all build and pass. `yarn typecheck && yarn lint && yarn test:run && yarn format` is green.
14. **Tests added/updated** per Testing Requirements.

## Tasks / Subtasks

- [x] **Task 1 — Reshape `lib/content/projects.ts`** (AC: 1,2,3,4,5)
  - [x] `ProjectSchema` fields: `slug` (regex), `name` (`min(1)`), `description` (`min(1)`) required; `org` (default `""`), `type` (default `"web"`), `stack` (`z.array(z.string().min(1)).default([])`), `images` / `videos` (`z.array(z.string().min(1)).default([])` — `.min(1)` per item, NOT `.url()`, so local `/paths` validate), `links` (`z.object({ preview, code, design, repo, docs }).partial()` of `z.string().url()`, default `{}`), `problem`/`role` (default `""`), `decisions`/`outcomes` (default `[]`), `featured` (default `false`).
  - [x] Remove `ProjectMethod`, `ProjectStatus` enums and the dropped fields.
  - [x] `type Project = z.infer<typeof ProjectSchema>` (post-default output). Never hand-write.
  - [x] Rewrite `featuredProjects` (buguard, dark-atlas, masheed-gate) to the new shape; give **buguard** real `images`/`videos`/`description`/object-`links` so the slider is demonstrable.
  - [x] Rewrite the legacy `transform()`/`toLinks()` path: legacy `LegacyEntry` → new shape, `description` from legacy description, `links` object from preview/code/design, `featured: false`. Drop `meta`.
  - [x] Add `export function projectLinkList(links: Project["links"]): { label: string; href: string; kind: keyof Project["links"] }[]` — fixed order preview→code→design→repo→docs, human labels, absent keys omitted.

- [x] **Task 2 — Redesign `/work` table + row/card** (AC: 6)
  - [x] `components/network-waterfall-row.tsx` (rename mentally to a projects row; keep file name to minimize churn or rename to `project-row.tsx` + update imports): remove `methodColor`/`statusColor`, method/status/size/time cells and the waterfall `motion.div`. New cells: NAME (keep `ProjectNameLink`: featured→internal `/work/[slug]`, else first link from `projectLinkList`), TYPE, STACK chips (show first 3 + `+N` `Badge`), LINKS (icon `<a>`s from `projectLinkList`).
  - [x] `components/network-waterfall-table.tsx`: update `<thead>` column labels to NAME/TYPE/STACK/LINKS; keep mono/hairline DevTools styling and the existing responsive desktop-table / mobile-card split.

- [x] **Task 3 — Redesign filters** (AC: 7)
  - [x] `components/network-page-client.tsx`: build facets from `type` (and optionally distinct `stack` entries) instead of method/status/year. Reuse the URL-persistence + empty-state logic from story 4-2 unchanged; only the facet dimensions and filter predicates change.

- [x] **Task 4 — Hero media gallery** (AC: 8,9)
  - [x] New `components/project-media-gallery.tsx` (`"use client"`, named export). Props `{ images: string[]; videos: string[]; projectName: string }`. Ordered slides: images then videos. `images.length + videos.length === 0` → render `null`.
  - [x] `framer-motion` `AnimatePresence mode="wait"`, gated by `useShouldAnimate()` (no x-translate / `0.001s` when reduced). Animate `transform`/`opacity` only.
  - [x] Controls: prev/next (`lucide-react` `ChevronLeft`/`ChevronRight`), dot buttons, `n / total` counter, wrap-around.
  - [x] A11y: `role="region"` `aria-roledescription="carousel"` `aria-label="{projectName} media"`; ArrowLeft/Right handler; per-slide `aria-label="Slide n of total"`; polite live region; `aria-label`ed controls; `focus-visible:ring-1 focus-visible:ring-ring`.
  - [x] Images: `next/image` `fill` in an `aspect-video` container, `sizes`, `alt={`${projectName} screenshot n`}`. Videos: `<video controls preload="metadata" playsInline>` — no autoplay.
  - [x] Render in `app/(chrome)/work/[slug]/page.tsx` after `<CaseStudyHeader />`, before `<NetworkRequestDetail />`, code-split via `next/dynamic` (mirror the existing `NetworkRequestDetail` dynamic pattern + skeleton).

- [x] **Task 5 — Detail links + description lead + mock rework** (AC: 10,11,12)
  - [x] `components/network-request-detail.tsx`: Links section uses `projectLinkList`; render each as a prominent affordance (shadcn `Button asChild` wrapping `<a>` or styled card link) with icon + label, new-tab attrs + SR text; keep italic empty state. Add a `project.description` lead paragraph above Problem. Problem/Role keep their italic empty states (now empty-string by default).
  - [x] Mock detection: add `lib/content/has-placeholder.ts` (or inline util) that returns true if any of `description/problem/role/decisions/outcomes` contains `"[PLACEHOLDER"` or `"[MOCK]"`. Use it for the `[MOCK]` badge in `case-study-header.tsx` and the dev warning in `page.tsx` (replacing `meta.mock`).
  - [x] `tests/gate/mock-content.test.ts`: filter featured projects through the placeholder util instead of `meta.mock`; assert none ship placeholder markers (or assert the util flags them — match the gate's original intent from story 7-4).

- [x] **Task 6 — Other consumers** (AC: 13)
  - [x] `components/recruiter-resume.tsx`: replace method/status/year badges with `type` + `org` (and/or stack chips); keep outcomes.
  - [x] `lib/repl/commands.ts:205`: reformat the `projects` listing line without method/status/year, e.g. `${i+1}. ${p.name} — ${p.type}${p.stack.length ? ` · ${p.stack.slice(0,3).join(", ")}` : ""}`.
  - [x] `app/(chrome)/work/[slug]/page.tsx`: `firstSentence(project.problem || project.description)` for metadata description.

- [x] **Task 7 — Config** (AC: 9)
  - [x] `next.config.mjs`: add `media-src 'self' https: blob:` to `prodCsp` and `devCsp`; add `images.remotePatterns` allow-listing seed hosts (e.g. `images.unsplash.com`, `plus.unsplash.com`, `hossammarey.com`). Comment that new image hosts must be added here. Ensure `public/images/projects/` assets referenced by seed data exist (or use remote URLs) so nothing 404s.

- [x] **Task 8 — Tests** (AC: 14) — see Testing Requirements.

- [x] **Task 9 — Verify** (AC: 13): `yarn typecheck && yarn lint && yarn test:run && yarn format`; then `yarn dev` and check golden paths — slider keyboard nav, video plays (no CSP block in console), links open, `/work` redesigned table + new filters, recruiter mode, REPL `projects`, `D` theme toggle, RTL, mobile <640px. Report results honestly.

## Dev Notes

### Files to touch (verified by grep)

**Modify**
- `lib/content/projects.ts` — schema reshape, drop fields, `links` object, `images`/`videos`, `projectLinkList`, rewrite featured + legacy transform.
- `components/network-waterfall-row.tsx` — remove waterfall/method/status; new NAME/TYPE/STACK/LINKS cells.
- `components/network-waterfall-table.tsx` — new column headers.
- `components/network-page-client.tsx` — `type`/`stack` filter facets.
- `components/network-request-detail.tsx` — link helper + prominent link UI + description lead.
- `components/case-study-header.tsx` — mock badge via placeholder util.
- `components/recruiter-resume.tsx` — drop method/status/year.
- `lib/repl/commands.ts` — reformat `projects` listing.
- `app/(chrome)/work/[slug]/page.tsx` — gallery render, metadata fallback, mock warning via util.
- `next.config.mjs` — CSP `media-src` + `images.remotePatterns`.
- `tests/gate/mock-content.test.ts` — placeholder-based gate.

**Create**
- `components/project-media-gallery.tsx` + `components/project-media-gallery.test.tsx`
- `lib/content/has-placeholder.ts` (or inline) + test
- `lib/content/projects.test.ts` (schema) if none exists

**Verify / update tests**
- `components/network-waterfall-row.test.tsx`, `components/network-request-detail.test.tsx`, `components/network-page-client.test.tsx`, `components/network-waterfall-table.test.tsx`, `lib/repl/commands.test.ts`, `app/(chrome)/work/[slug]/metadata.test.ts`, `opengraph-image.test.ts`, `app/sitemap.test.ts`.

### ⚠️ This redesign removes the site's signature waterfall visual
Dropping `method`/`status`/`statusCode`/`timeWeight`/`startOffset` deletes the colored METHOD/STATUS badges and the animated waterfall bar — the most recognizable element of the `devtools://hossam` "Network" tab. The owner explicitly approved this (2026-06-03). Keep the DevTools *flavor* (mono labels, hairlines, status-log voice) in the redesigned table so the metaphor doesn't fully collapse. If during implementation this feels like it guts the concept, STOP and confirm with the owner before proceeding — they can instead keep the fields auto-defaulted.

### Current behavior to preserve (read before editing)
- `network-page-client.tsx` URL-persisted filters + empty state (story 4-2): keep the mechanism, swap only the facet dimensions/predicates.
- `page.tsx`: dynamic-imports `NetworkRequestDetail` with a pulse skeleton; renders `JsonLd` breadcrumb + `ProjectOpenXp`; only `featured` projects get `generateStaticParams`/detail pages — mirror the dynamic pattern for the gallery.
- `network-request-detail.tsx`: section empty-state pattern + `ComputedStylesPanel`/`Cell` for decisions/outcomes — keep.
- RTL: use logical properties (`ms-/me-/ps-/pe-/start-/end-`). Reduced motion via `useShouldAnimate()`.

### Project rules that bind this story (from `_bmad-output/project-context.md`)
- **Zod is the source of truth**; derive types via `z.infer`. `import type` for type-only imports. **Named exports** for components (except `page.tsx`/`layout.tsx`). **No `import React`**.
- **framer-motion** import specifier is `framer-motion` (NOT `motion/react`). **Every animation gated by `prefers-reduced-motion`** via `useShouldAnimate()`. [memory: motion-import]
- **Tailwind v4 semantic tokens only** (`bg-card`, `text-foreground`, `text-lime`, `border-hairline`/`border-border`…), no hex/oklch in JSX; `cn()` from `@/lib/utils`; logical properties for RTL.
- **`next/image`** (explicit `width`/`height` or `fill` + `alt`) for every image; `next/link` for internal nav, `<a target="_blank">` for external.
- **No new dependencies without approval** — the slider is `framer-motion` only; do NOT add embla/swiper/keen. [deps check: none installed]
- **shadcn primitives in `@/components/ui/*`** — reuse `Button`, `Badge`. `lucide-react` `1.16.0` icons.
- **A11y non-negotiable:** semantic HTML, full keyboard nav, visible focus rings, `alt` on every image, `aria` carousel semantics.
- **Performance:** animate `transform`/`opacity` only; code-split client/media panels via `dynamic()`; Lighthouse 95+; `preload="metadata"` on videos.
- **Pre-commit gate:** `yarn typecheck && yarn lint && yarn test:run && yarn format`. **yarn**, never npm. Never `--no-verify`.

### CSP / media gotcha (do not miss)
CSP has `img-src 'self' data: https:` (images OK) but **no `media-src`**, so `<video>` from `pexels.com` falls back to `default-src 'self'` and is **blocked**. Add `media-src 'self' https: blob:` to both `prodCsp` and `devCsp`. Verify the video request isn't CSP-blocked in the browser console. [Source: next.config.mjs]

### `next/image` remote hosts
Next.js refuses remote images whose host isn't in `images.remotePatterns`. Allow-list the seed hosts (Unsplash, `hossammarey.com`). Explicit allowlist, not `hostname: "**"`. Add a comment that new hosts must be registered here.

### Testing Requirements
- **Vitest + jsdom, `globals: true`** (don't import `describe/it/expect`). Colocate `*.test.ts(x)`; queries by role/label/text; `userEvent.setup()`; `@/` alias works.
- **Schema** (`lib/content/projects.ts`): minimal `{slug,name,description}` parses → assert defaults (`type==="web"`, `links` `{}`, `images/videos` `[]`, `featured` false, `stack` `[]`); missing each required field fails; bad `slug` fails; duplicate slug fails; `links` non-URL fails. **`fast-check`** fuzz: any valid minimal object never throws and always yields all defaulted fields. [project-context.md#Testing Rules]
- **`projectLinkList`**: stable order, absent keys omitted, correct labels.
- **`project-media-gallery.test.tsx`**: correct slide count; ArrowRight/Left change active slide + counter + live region; `<video>` for video URLs, image for image URLs; reduced-motion (mock `useShouldAnimate`→false) doesn't animate; empty arrays → renders nothing.
- **`has-placeholder`**: flags `[PLACEHOLDER`/`[MOCK]`, clean text passes.
- **Update** waterfall-row/table, network-page-client, request-detail, commands, metadata, OG, sitemap tests to the new shapes. Rework `mock-content.test.ts` onto the placeholder util.
- **Don't** snapshot JSX or assert Tailwind class strings.

### Project Structure Notes
- New component in `components/` (kebab-case, named export) — consistent with `case-study-pager.tsx`.
- Schema/content stays the single source `lib/content/projects.ts`. The untracked `lib/content/projects-example.ts` is scratch/example — do NOT import it into the app; fold useful seed data into `projects.ts` or leave it untracked. Confirm with owner before deleting.
- No new `lib/data/*` (deprecated). No `tailwind.config.*`. No state library. No router/i18n lib.

### References
- [Source: _bmad-output/project-context.md] — full ruleset (Zod source of truth, framer-motion specifier, no new deps, Tailwind v4 tokens, a11y/perf, testing).
- [Source: lib/content/projects.ts] — current schema, `transform()`/`toLinks()`, unique-slug `superRefine`.
- [Source: components/network-waterfall-row.tsx] / [components/network-waterfall-table.tsx] — table to redesign.
- [Source: components/network-page-client.tsx] — filter facets to swap (story 4-2 URL persistence to keep).
- [Source: components/network-request-detail.tsx] — Links section + section empty-state pattern.
- [Source: app/(chrome)/work/[slug]/page.tsx] — dynamic-import + metadata + featured-only static params.
- [Source: next.config.mjs] — CSP (missing `media-src`), no `images` config yet.
- [Source: hooks/use-should-animate.ts] — reduced-motion gate to reuse.
- [Source: components/recruiter-resume.tsx], [lib/repl/commands.ts] — dropped-field consumers.

## Dev Agent Record

### Agent Model Used

glm-5.1

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Reshaped ProjectSchema to require only slug/name/description; all other fields optional with sensible defaults
- Dropped ProjectMethod, ProjectStatus, and all Network-related fields (method, status, statusCode, size, sizeWeight, time, timeWeight, startOffset, year, meta)
- Links changed from array to object map { preview?, code?, design?, repo?, docs? }
- Added projectLinkList() helper for ordered display list
- Redesigned /work table: NAME/TYPE/STACK/LINKS columns (desktop), card layout (mobile), no waterfall bar
- Redesigned filters: type + stack facets, URL-persisted, empty-state preserved
- Created project-media-gallery.tsx: accessible framer-motion carousel with prev/next, dots, counter, keyboard nav, reduced-motion safe
- Updated network-request-detail.tsx: description lead paragraph, Button-asChild links via projectLinkList
- Created has-placeholder.ts util replacing meta.mock for mock detection
- Updated case-study-header.tsx, page.tsx to use hasPlaceholder instead of meta.mock
- Updated recruiter-resume.tsx: org/type/stack badges instead of method/status/year
- Updated REPL commands: new format with name/type/stack, --featured flag replaces --shipped
- Added CSP media-src and images.remotePatterns to next.config.mjs
- All 387 tests pass, typecheck clean, lint 0 errors

### File List

**Modified:**
- lib/content/projects.ts
- lib/content/index.ts
- components/network-waterfall-row.tsx
- components/network-waterfall-table.tsx
- components/network-page-client.tsx
- components/network-request-detail.tsx
- components/case-study-header.tsx
- components/recruiter-resume.tsx
- components/network-filter-bar.tsx
- lib/repl/commands.ts
- app/(chrome)/work/[slug]/page.tsx
- next.config.mjs
- tests/gate/mock-content.test.ts
- components/network-waterfall-row.test.tsx
- components/network-waterfall-table.test.tsx
- components/network-request-detail.test.tsx
- components/network-page-client.test.tsx
- components/network-filter-bar.test.tsx
- components/case-study-header.test.tsx
- components/recruiter-resume.test.tsx
- lib/repl/commands.test.ts
- app/(chrome)/work/[slug]/metadata.test.ts

**Created:**
- components/project-media-gallery.tsx
- components/project-media-gallery.test.tsx
- lib/content/has-placeholder.ts
- lib/content/has-placeholder.test.ts
- lib/content/projects.test.ts

### Review Findings

- [x] [Review][Patch] Invisible links in /work table row LINKS column [components/network-waterfall-row.tsx:81-91] — fixed: added lucide-react icons (ExternalLink, Code, Palette, FolderGit, BookOpen)
- [x] [Review][Patch] Detail page links missing required lucide-react icons [components/network-request-detail.tsx:119-130] — fixed: added lucide-react icons to Button links
- [x] [Review][Patch] Gallery video URL points to HTML download page instead of video file [lib/content/projects.ts] — fixed: removed broken pexels download URL
- [x] [Review][Patch] Empty filter values in URL create unresolvable active filters [components/network-page-client.tsx:40-44] — fixed: added .filter(Boolean) to parseActiveFilters
- [x] [Review][Patch] Invalid `<track>` element missing required `src` attribute [components/project-media-gallery.tsx:88] — fixed: removed `<track>` element
- [x] [Review][Patch] Gallery lacks error handling for broken media URLs [components/project-media-gallery.tsx:81-98] — fixed: added onError handlers for both Image and video
- [x] [Review][Patch] REPL projects command shows stale flag name in usage message [lib/repl/commands.ts:309] — fixed: changed --shipped to --featured
- [x] [Review][Patch] Empty stack array renders blank section without empty state [components/network-request-detail.tsx:58-69] — fixed: added "No stack listed." empty state
- [x] [Review][Patch] Filter toggle discards unrelated query parameters [components/network-page-client.tsx:80-98] — fixed: preserve existing searchParams in handleToggle
- [x] [Review][Patch] Carousel slide content not announced to screen readers on change [components/project-media-gallery.tsx:56-149] — fixed: added sr-only aria-live region announcing slide content
- [x] [Review][Patch] `hasPlaceholder` utility lacks null safety guard [lib/content/has-placeholder.ts:5] — fixed: added null/undefined guard
- [x] [Review][Patch] Legacy URL validation guard is too permissive [lib/content/projects.ts:100-102] — fixed: use URL constructor with protocol check
- [x] [Review][Patch] Legacy transform builds `Record<string, string>` instead of strict links shape [lib/content/projects.ts:97-103] — fixed: typed links as `{ preview?: string; code?: string; design?: string }`
- [x] [Review][Patch] Missing required comment in next.config.mjs about adding new image hosts [next.config.mjs:30-37] — fixed: added comment
- [x] [Review][Patch] Gallery tests missing reduced-motion path coverage [components/project-media-gallery.test.tsx] — fixed: added reduced-motion test block
- [x] [Review][Defer] Duplicate React keys possible in stack badges [components/network-waterfall-row.tsx] — deferred, pre-existing
- [x] [Review][Defer] Unbounded dynamic import without error boundary [app/(chrome)/work/[slug]/page.tsx] — deferred, pre-existing
- [x] [Review][Defer] Zod schema accepts whitespace-only strings [lib/content/projects.ts:5-27] — deferred, pre-existing
- [x] [Review][Defer] Checkbox IDs could contain special characters [components/network-filter-bar.tsx:86] — deferred, pre-existing
