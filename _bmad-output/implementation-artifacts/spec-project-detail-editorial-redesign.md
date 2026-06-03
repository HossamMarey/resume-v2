---
title: "Editorial redesign of the single project (case-study) detail page"
type: feature
created: 2026-06-03
status: done
baseline_commit: 16b8366c1acbb0bc985eda8cbed93029d1f7c591
context:
  - "{project-root}/_bmad-output/project-context.md"
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The single project page (`/work/[slug]`) is a flat, uniform vertical stack — small mono title, carousel, then six identically-styled mono-label sections. It reads like a form, not a portfolio piece, and undersells the featured work.

**Approach:** Reframe the page as an *art-directed HTTP request/response* — keep the DevTools metaphor (status line, request/response sections) but add editorial drama in Obsidian + Signal Lime: a request-status masthead, an asymmetric hero pairing an oversized Fraunces display title + lede with the featured media, a decorative repeating-name marquee band, and large numbered section markers (`01 / Problem` …). No new dependencies, dark-only, semantic tokens only.

## Boundaries & Constraints

**Always:** Reuse existing idioms — `ComputedStylesPanel`/`ComputedStylesCell`, `ProjectMediaGallery`, `bg-grid`, `animate-marquee`, `Badge`, `Button`, `next/image` (with width/height/sizes + alt). Semantic tokens only (`text-lime`, `text-muted-foreground`, `bg-surface`, `text-status-ok`, `border-hairline`) — no hex/oklch. Logical properties (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`). Every animation gated by `useShouldAnimate()` / `useReducedMotion`. Exactly one `<h1>` (the project name). Preserve all empty-state fallbacks for `[MOCK]`/missing fields.

**Ask First:** Adding any npm dependency. Changing the `Project` schema (`lib/content/projects.ts`). Touching shared components beyond the five in the Code Map.

**Never:** Light-mode styles. Drop shadows (depth = surface steps + hairlines). Departing from the DevTools conceptual frame (this is the Hybrid direction, not Full editorial). `forwardRef`/`import React`. Default-exporting regular components (except `page.tsx`). Hardcoded `ml-/mr-/left-/right-`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Featured project, ≥2 images | full project | Hero shows `images[0]`; gallery below shows `images.slice(1)` + videos | N/A |
| Project with 0 images | `images: []` | Hero renders type-only typographic media panel (no `next/image`); gallery hidden | gallery returns null at total 0 |
| Exactly 1 image, no video | 1 image | Hero shows it; gallery receives empty media → renders nothing | no empty carousel chrome |
| `[MOCK]`/empty section field | `problem: ""` etc. | Section still renders its number + label + italic muted "No … provided." fallback | N/A |
| `prefers-reduced-motion` | reduced | Marquee static (no scroll); hero reveal collapses to final state | N/A |
| RTL (`dir="rtl"`) | Arabic dir | Layout mirrors via logical props; marquee stays decorative (`aria-hidden`) | N/A |

</frozen-after-approval>

## Code Map

- `app/(chrome)/work/[slug]/page.tsx` -- page composition; recompose order (header → hero → detail → gallery → pager) and split media (hero gets `images[0]`, gallery gets the rest).
- `components/case-study-header.tsx` -- evolve into the request-status masthead: `200 OK · GET /work/{slug}` status strip (lime dot + `text-status-ok`) + breadcrumb + `[MOCK]` badge. No `<h1>` here.
- `components/case-study-hero.tsx` -- NEW client component: asymmetric grid — left = `<h1>` Fraunces display title + `org · type` meta + description lede; right = featured media panel (`images[0]` via `next/image`, or typographic fallback) over `bg-grid`. Includes the `animate-marquee` name band. Motion reveal gated by `useShouldAnimate`.
- `components/network-request-detail.tsx` -- restyle into numbered editorial sections (`01 / Problem`, `02 / Role`, `03 / Stack`, `04 / Decisions`, `05 / Outcomes`, `06 / Links`); large lime mono index numerals; keep `ComputedStylesPanel` for Decisions/Outcomes; remove the description block (moved to hero).
- `components/case-study-pager.tsx` -- light editorial restyle (kept structure: prev/next featured, wrap at ends); larger arrows, mono index hint.

## Tasks & Acceptance

**Execution:**
- [x] `components/case-study-header.tsx` -- replace breadcrumb+title block with a status-line masthead (mono `200 OK · GET /work/{slug}`, lime status dot, `text-status-ok`) + breadcrumb + `[MOCK]` badge; drop the `<h1>` (moves to hero). Dropped `"use client"` (now a server component).
- [x] `components/case-study-hero.tsx` -- create the hero: asymmetric `md:grid-cols-[1.2fr_1fr]` layout, `<h1>` in `font-title` display size with `text-balance`, `org · type` mono meta, description lede; right media panel with `next/image fill` over `bg-grid` (or typographic fallback when no image); decorative `animate-marquee` band of the repeated name (`aria-hidden`), static under reduced motion; entrance reveal gated by `useShouldAnimate`.
- [x] `components/network-request-detail.tsx` -- restyle each section with a large `font-mono text-lime` index numeral + label; preserve all fallbacks; keep Decisions/Outcomes in `ComputedStylesPanel`; remove description section.
- [x] `app/(chrome)/work/[slug]/page.tsx` -- recompose: `<CaseStudyHeader>` → `<CaseStudyHero project image={project.images[0]}>` → `<NetworkRequestDetail>` → `<ProjectMediaGallery images={project.images.slice(1)} …>` → `<CaseStudyPager>`; keep JsonLd + ProjectOpenXp + dynamic imports.
- [x] `components/case-study-pager.tsx` -- editorial restyle only (no logic change).

**Acceptance Criteria:**
- Given a featured project with content, when I open `/work/{slug}`, then I see one `<h1>` (the project name in Fraunces display type), a request-status masthead, the asymmetric hero with featured media, a decorative name marquee, and six numbered sections.
- Given `prefers-reduced-motion: reduce`, when the page loads, then no marquee scroll or entrance animation runs and all content is visible.
- Given a project with no images, when I open its page, then the hero shows a typographic media panel and no empty carousel renders.
- Given `dir="rtl"`, when I view the page, then the layout mirrors correctly with no overflow and the marquee is `aria-hidden`.

## Design Notes

Hero feel (Obsidian + Lime, dark-only):
```tsx
// case-study-hero.tsx — shape, not final copy
<section className="relative mb-10">
  <div className="grid items-end gap-6 md:grid-cols-[1.2fr_1fr]">
    <div>
      <h1 className="font-title text-5xl leading-[0.95] text-balance md:text-7xl">
        {project.name}
      </h1>
      <p className="mt-3 font-mono text-xs tracking-wider text-muted-foreground uppercase">
        {[project.org, project.type].filter(Boolean).join(" · ")}
      </p>
      <p className="mt-5 max-w-prose text-sm leading-relaxed text-foreground">
        {project.description}
      </p>
    </div>
    <div className="bg-grid relative aspect-[4/3] overflow-hidden rounded-sm bg-surface">
      {image ? <Image fill … /> : /* typographic fallback */}
    </div>
  </div>
</section>
```
Numbered section header idiom in `network-request-detail.tsx`:
```tsx
<div className="flex items-baseline gap-3">
  <span className="font-mono text-2xl text-lime tabular-nums">01</span>
  <h2 className="font-mono text-sm tracking-wider text-muted-foreground uppercase">Problem</h2>
</div>
```
Marquee reuses `animate-marquee` (a duplicated track) and must render a static row when `useShouldAnimate()` is false.

## Verification

**Commands:**
- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: no new warnings (next/image, logical-prop, no-img rules pass)
- `yarn build` -- expected: `/work/[slug]` static params build succeeds

**Manual checks:**
- `yarn dev` → `/work/buguard`: one h1, hero media renders, marquee scrolls, six numbered sections, links + pager work; no console errors.
- Toggle `D` (theme) and `prefers-reduced-motion` (DevTools): motion stops, content intact.
- Resize <640px: hero stacks, title clamps, no horizontal scroll.
- Set `<html dir="rtl">`: layout mirrors, marquee decorative.

## Suggested Review Order

**Page composition (start here)**

- Entry point: hero added, gallery now sliced + conditional below the text sections.
  [`page.tsx:137`](../../app/(chrome)/work/[slug]/page.tsx#L137)

**Editorial hero (the core of the redesign)**

- New component — asymmetric title/media grid carrying the design intent.
  [`case-study-hero.tsx:16`](../../components/case-study-hero.tsx#L16)
- The only `<h1>`: oversized Fraunces display title.
  [`case-study-hero.tsx:30`](../../components/case-study-hero.tsx#L30)
- Decorative name marquee — `animate-marquee` only when motion is allowed.
  [`case-study-hero.tsx:74`](../../components/case-study-hero.tsx#L74)

**DevTools framing**

- Request-status masthead (`200 OK · GET /work/{slug}`) replacing the old title block.
  [`case-study-header.tsx:24`](../../components/case-study-header.tsx#L24)
- Numbered section marker idiom reused across all six sections.
  [`network-request-detail.tsx:27`](../../components/network-request-detail.tsx#L27)
- Sections restyled with editorial rhythm; description removed (moved to hero).
  [`network-request-detail.tsx:42`](../../components/network-request-detail.tsx#L42)

**Supporting**

- Pager restyled to a two-column editorial prev/next (logic unchanged).
  [`case-study-pager.tsx:28`](../../components/case-study-pager.tsx#L28)
- Tests updated to the new contract (h1/description moved) + new hero coverage.
  [`case-study-hero.test.tsx:54`](../../components/case-study-hero.test.tsx#L54)
