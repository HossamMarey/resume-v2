# Story 7.2: robots, sitemap, and OG images

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Scope seam (2026-06-02): This story owns the THREE file-convention SEO routes that Story 7.1 deliberately left out — `app/robots.ts`, `app/sitemap.ts`, and the OG IMAGE bitmaps (`app/opengraph-image.tsx` site-wide default + `app/(chrome)/work/[slug]/opengraph-image.tsx` per featured slug). 7.1 already shipped the per-route `og:*`/`twitter:*` *tags* + `metadataBase`; once this story adds the `opengraph-image` files, Next auto-wires `og:image`/`og:image:alt` by file convention — closing the 7.1↔7.2 seam. It does NOT touch metadata tags, JSON-LD (7.1 done), the print stylesheet (7.3), the mock-content CI gate (7.4), or CSP/Lighthouse/deploy (7.5). -->

## Story

As a recruiter,
I want crawlable, share-ready pages,
so that the canonical link looks professional everywhere it's posted and the site is fully indexable.

## Acceptance Criteria

1. **(NFR-S3 — robots.txt via metadata API)** `app/robots.ts` exports a default function returning `MetadataRoute.Robots` that: allows crawling of all public content (`userAgent: "*"`, `allow: "/"`), **disallows `/api/`** (the contact route handler is not a page), and declares `sitemap: ${SITE_URL}/sitemap.xml` (absolute) plus `host: SITE_URL`. The generated `/robots.txt` is served as a **static** route. [Source: prd.md NFR-S3; epics.md:777-779; architecture.md:382]

2. **(NFR-S3 — sitemap.xml via metadata API)** `app/sitemap.ts` exports a default function returning `MetadataRoute.Sitemap` that covers **every public route** with **absolute** URLs (built via `siteUrl()` from `lib/site.ts`, NOT relative — `metadataBase` does not auto-resolve sitemap entries): the 7 static routes `/`, `/work`, `/perf`, `/sources`, `/console`, `/recruiter`, **and one entry per featured project** `/work/${slug}` (derived from `projects.filter((p) => p.featured)` — same source as `generateStaticParams`). No duplicates; entry count = 6 chrome/recruiter routes + N featured slugs. Served as a **static** route. [Source: prd.md NFR-S3; epics.md:779; lib/content/projects.ts:118-228; app/(chrome)/work/[slug]/page.tsx:30-32]

3. **(NFR-S4 + A14 — per-slug OG image)** `app/(chrome)/work/[slug]/opengraph-image.tsx` produces a **per-slug** OG image (1200×630) for each **featured** case study, branded in the Obsidian + Signal Lime system, showing at minimum the **project name** and the `devtools://hossam` wordmark. It exports `size`, `contentType = "image/png"`, an `alt` string (NFR-A5 — every image has alt, including OG), and a `generateStaticParams` returning the **featured slugs** so all case-study OG images are **generated statically at build** (mirrors the page's `generateStaticParams`, featured-only). [Source: prd.md NFR-S4; epics.md:781-783; architecture.md:391,528; project-context.md:327 (palette)]

4. **(NFR-S1 closure — site-wide default OG image)** `app/opengraph-image.tsx` (root) produces a single branded **default** 1200×630 OG image (project wordmark + tagline/role), exporting `size`, `contentType`, and `alt`. By Next file-convention this default applies to **every route that lacks its own** (`/`, `/work`, `/perf`, `/sources`, `/console`, `/recruiter`), while the `work/[slug]` image overrides it for case studies. This satisfies NFR-S1's "OG image on every route" that 7.1 intentionally deferred (7.1 left `openGraph.images` unset on purpose). [Source: 7-1 story Dev Notes "The 7.1↔7.2 seam"; epics.md:769-783; prd.md NFR-S1]

5. **(A14 / NFR-S4 — dynamic-vs-static is a DOCUMENTED choice)** The OG images use **dynamic generation** via `ImageResponse` from `next/og` (built into Next 16 — **no new dependency**), generated statically at build time. If `next/og`/Satori font or layout constraints prove too costly (see Dev Notes "OG image: the `next/og` reality"), the **documented fallback** is a static pre-rendered PNG per case study + a default in `public/og/` referenced via `openGraph.images`. Whichever path is taken is **recorded in Completion Notes** as the resolved A14 decision. [Source: epics.md:781-783; architecture.md:528 ("pick during P4/P7")]

6. **(NFR-A5 — image discipline)** The OG image files declare an `alt` export so Next emits `og:image:alt`. No raw `<img>` is introduced anywhere by this story; if any real image were added it would use `next/image` with explicit `width`/`height`/`alt` (not applicable here — OG bitmaps are generated, not rendered in the DOM). [Source: prd.md NFR-A5; epics.md:125,783]

7. **(No regressions)** `robots.ts`, `sitemap.ts`, and the `opengraph-image.tsx` files are **additive** Server-only modules — they add no `"use client"`, touch no existing route content/UX, and do not modify the 7.1 metadata tags or JSON-LD. All existing routes stay **static** (`○`/`●`); `/work/[slug]` keeps its `generateStaticParams` (featured-only) + dynamic-import detail pane + not-found branch. The `(chrome)` layout, Recruiter Mode, XP bus, and `D`/`⌘K`/Konami hotkeys all keep working. [Source: project-context.md:80-83; app/(chrome)/work/[slug]/page.tsx:1-125]

8. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds; the route table lists `/robots.txt`, `/sitemap.xml`, an `/opengraph-image` route, and a `/work/[slug]/opengraph-image` route, with all case-study OG images **prerendered** (one per featured slug) and **no route flipped to dynamic** (`ƒ`). Manual (`yarn dev`): `GET /robots.txt` returns the rules + absolute sitemap URL; `GET /sitemap.xml` lists all routes as absolute URLs incl. each featured slug; opening `/opengraph-image` and `/work/<slug>/opengraph-image` renders a 1200×630 PNG; view-source on a route shows `og:image` + `og:image:alt`; pasting a `/work/<slug>` URL into a link-preview validator shows the per-slug image; no console errors; `D` toggle + `<html dir="rtl">` + mobile <640px still work.

## Tasks / Subtasks

- [x] **Task 1 — `app/robots.ts` (AC: 1, 7, 8)**
  - [x] Create `app/robots.ts` (Server-only, default export, no `"use client"`): `import type { MetadataRoute } from "next"` and `import { SITE_URL } from "@/lib/site"`. Return `{ rules: { userAgent: "*", allow: "/", disallow: "/api/" }, sitemap: `${SITE_URL}/sitemap.xml`, host: SITE_URL }`. Use `SITE_URL` (not a hardcoded domain) so OQ1's env override flows through.

- [x] **Task 2 — `app/sitemap.ts` (AC: 2, 7, 8)**
  - [x] Create `app/sitemap.ts` (Server-only, default export): `import type { MetadataRoute } from "next"`, `import { siteUrl } from "@/lib/site"`, `import { projects } from "@/lib/content/projects"`.
  - [x] Build the static-route list `["/", "/work", "/perf", "/sources", "/console", "/recruiter"]` mapped to `{ url: siteUrl(path) }`. Append `projects.filter((p) => p.featured).map((p) => ({ url: siteUrl(`/work/${p.slug}`) }))`. Return the concatenated array. Keep URLs **absolute** via `siteUrl()`.
  - [x] Do NOT set `lastModified: new Date()` (non-deterministic build / churns the sitemap every build). Omit `lastModified`, or use a fixed build-stable value. `changeFrequency`/`priority` are optional — keep minimal unless adding intentional signal.

- [x] **Task 3 — Shared OG image layout helper (AC: 3, 4, 5) — DRY**
  - [x] Add `lib/og.tsx` (or colocate): export shared `OG_SIZE = { width: 1200, height: 630 }`, `OG_CONTENT_TYPE = "image/png"`, and a pure function `renderOgImage({ title, subtitle }: { title: string; subtitle?: string })` returning the JSX tree for `ImageResponse`. Style with **inline styles only** (Satori does not read Tailwind/`globals.css`): Obsidian background `#0B0D10`, Signal Lime `#C6F24E` accent, the `devtools://hossam` wordmark, large `title`, optional `subtitle`. Use fl/`display: "flex"` on every multi-child container (Satori requires explicit `display: flex`). Keep to a single weight, system/sans font unless a brand font is loaded (see Dev Notes).
  - [x] This centralizes the OG layout so the root default and per-slug images don't duplicate JSX (one audited place, mirrors the `JsonLd` single-source discipline from 7.1).

- [x] **Task 4 — Root default OG image (AC: 4, 5, 6, 8)**
  - [x] Create `app/opengraph-image.tsx`: `import { ImageResponse } from "next/og"`; `export const size = OG_SIZE`; `export const contentType = OG_CONTENT_TYPE`; `export const alt = "devtools://hossam — Hossam Marey, Senior Front-End Developer"`; default export returns `new ImageResponse(renderOgImage({ title: "devtools://hossam", subtitle: profile.role }), { ...size })`. Source `profile.role`/`profile.tagline` from `lib/content/profile.ts` (no re-authoring).

- [x] **Task 5 — Per-slug case-study OG image (AC: 3, 5, 6, 8)**
  - [x] Create `app/(chrome)/work/[slug]/opengraph-image.tsx`: `export function generateStaticParams()` returning `projects.filter((p) => p.featured).map((p) => ({ slug: p.slug }))` (identical to the page so only featured slugs prerender). `export const size`/`contentType`. Default export is `async ({ params })` (params is a **Promise** in Next 16 — `await` it, matching `page.tsx`), looks up the project by slug, and returns `new ImageResponse(renderOgImage({ title: project.name, subtitle: "devtools://hossam" }), { ...size })`. Define `alt` (a function or const string referencing the project name is fine — Next supports `generateImageMetadata` but a static `alt` export is simplest).
  - [x] Guard the not-found case (non-featured/unknown slug): since `generateStaticParams` only emits featured slugs and the segment is static, an unknown slug won't be built — but defensively fall back to the wordmark title if `project` is undefined rather than throwing.

- [x] **Task 6 — (Optional) Twitter image parity (AC: 6) — flag, don't over-build**
  - [x] Twitter/X falls back to `og:image` when `twitter:image` is absent (card is already `summary_large_image` from 7.1). **Default: rely on the og:image fallback** (no extra files). If explicit `twitter:image` is wanted, add `app/twitter-image.tsx` + `app/(chrome)/work/[slug]/twitter-image.tsx` that **re-export** the opengraph-image modules (`export { default, size, contentType, alt } from "./opengraph-image"`). Record the choice in Completion Notes.

- [x] **Task 7 — Tests (AC: 1, 2, 3, 4)**
  - [x] `app/robots.test.ts`: call the default export; assert `rules.allow === "/"`, `rules.disallow` includes `/api/`, `sitemap` is absolute and ends with `/sitemap.xml`, `host === SITE_URL`.
  - [x] `app/sitemap.test.ts`: call the default export; assert it returns an array; every `url` is absolute (`startsWith(SITE_URL)`); the 6 static routes are present; each `projects` featured slug has a `/work/<slug>` entry; **no duplicate URLs**; total length === 6 + featuredCount.
  - [x] OG images: **do NOT render `ImageResponse` in jsdom** (Satori/`@vercel/og` needs a real runtime — it will throw under Vitest). Test only the **static exports + params**: `generateStaticParams()` returns exactly the featured slugs; `size` is `{ width: 1200, height: 630 }`; `contentType === "image/png"`; `alt` is a non-empty string. If `renderOgImage` is a pure function returning JSX, you may assert it returns a defined element for given props, but skip pixel/serialization assertions (framework-owned).
  - [x] (Optional) `lib/og.test.tsx`: `renderOgImage({ title })` returns a truthy element; `OG_SIZE`/`OG_CONTENT_TYPE` constants are correct. Avoid testing Satori output.

- [x] **Task 8 — Verify & gate (AC: 7, 8)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean.
  - [x] `yarn build` — confirm `/robots.txt`, `/sitemap.xml`, `/opengraph-image`, and `/work/[slug]/opengraph-image` appear in the route table; case-study OG images prerender one-per-featured-slug; **no route is `ƒ` (dynamic)**.
  - [x] `yarn dev` manual: `curl`/browse `/robots.txt` (rules + absolute sitemap URL), `/sitemap.xml` (all routes absolute, featured slugs present), `/opengraph-image` + `/work/<slug>/opengraph-image` (1200×630 PNG renders); view-source a route → `og:image` + `og:image:alt` present; link-preview validator on `/work/<slug>` shows per-slug image; no console errors; `D` theme toggle, `<html dir="rtl">`, mobile <640px all intact.
  - [x] Record in Completion Notes: the resolved **A14 decision** (dynamic `next/og` vs static), whether a brand font was loaded into `ImageResponse`, the Twitter-image choice, and re-confirm **OQ1** (canonical domain still the `SITE_URL` placeholder).

## Dev Notes

### What this story IS (and is NOT)
- **IS:** `app/robots.ts` + `app/sitemap.ts` (Next metadata-route APIs, absolute URLs, all public routes incl. featured case-study slugs) and the **OG image bitmaps** — a site-wide default `app/opengraph-image.tsx` plus a per-slug `app/(chrome)/work/[slug]/opengraph-image.tsx` — generated statically at build.
- **IS NOT:** per-route metadata tags / JSON-LD (**Story 7.1 — DONE**, do not re-touch), the recruiter print stylesheet (**7.3**), the mock-content CI gate (**7.4**), CSP headers / Lighthouse pass / Vercel deploy (**7.5**), or `favicon.ico` / `icon`/`apple-icon` (NOT in 7.2 scope — see "Out of scope" below). No content/UX change to any route.

### The 7.1↔7.2 seam — why the OG images land HERE
- Story 7.1 set every route's `og:*`/`twitter:*` **tags** and `metadataBase`, but **deliberately left `openGraph.images` unset** so it wouldn't ship a 404'd image reference. [Source: 7-1 story Dev Notes "The 7.1↔7.2 seam"; 7-1 Completion Notes "OG image bitmap is intentionally NOT set"]
- The clean closure is **file convention**: dropping `app/opengraph-image.tsx` makes Next auto-inject `og:image` (absolute, via the already-set `metadataBase`) into **every** route's `<head>`; dropping `app/(chrome)/work/[slug]/opengraph-image.tsx` overrides it for case studies. **Do not** go back and hand-set `openGraph.images` in the 7.1 metadata exports — that would double-wire it and fight the convention.

### OG image: the `next/og` reality (read before coding — this is where AC5/A14 bites)
- `ImageResponse` (`import { ImageResponse } from "next/og"`) is **built into Next 16.1.7** — **no dependency to add** (do not `yarn add @vercel/og`; it's vendored). It renders JSX to PNG via **Satori**, which is **not a browser**: only a CSS subset works.
  - **Every element with >1 child needs explicit `display: "flex"`** (or `display: "none"`). Satori throws otherwise.
  - **No Tailwind / no `globals.css`** — Satori does not read the project stylesheet. Use **inline `style={{ ... }}`** with literal hex (`#0B0D10` Obsidian, `#C6F24E` Signal Lime — from project-context "Resolved Decisions" #1). This is the one sanctioned place to write literal hex (the no-hardcoded-hex rule targets DOM/JSX components that should use semantic tokens; Satori can't consume tokens).
  - **Fonts:** Satori defaults to a built-in sans and **cannot use `next/font/google`** (those return CSS class vars, not font buffers). For brand fidelity you'd fetch an IBM Plex Mono / Fraunces `.woff`/`.ttf` `ArrayBuffer` and pass it via the `fonts` option. **This font-loading step is exactly the "if dynamic generation proves too costly" escape hatch in NFR-S4/A14.** Recommended for v1: ship with the **default Satori font** (clean, zero-fetch, deterministic build) and note brand-font loading as a deferred polish; only load a font if it's low-friction. Whatever you pick, **record it in Completion Notes**.
- **Static generation:** keep the default runtime (do **not** add `export const runtime = "edge"`). With `generateStaticParams` exporting the featured slugs, all case-study OG images **prerender at build** — matching the "all routes static" gate. Verify the build output shows them prerendered, not `ƒ`.
- **A14 decision (surface, don't bury):** architecture explicitly says per-slug **dynamic** vs **static fallback** is to be "picked during P4/P7." [architecture.md:528] This story picks **dynamic `next/og`, statically prerendered** as the default (on-brand, per-slug, zero new dep). The static fallback (`public/og/<slug>.png` + `openGraph.images`) remains the documented contingency if Satori proves brittle. State the chosen path in Completion Notes as the resolved A14 decision.

### robots.ts / sitemap.ts specifics
- Both are **Next metadata-route conventions** (`app/robots.ts`, `app/sitemap.ts`) returning typed objects — **not** hand-written `robots.txt`/`sitemap.xml` files, and **not** raw `<head>` (consistent with the "metadata API only" rule). [Source: project-context.md:82; architecture.md:382-383]
- **Sitemap URLs must be absolute.** Unlike `metadata.alternates.canonical` (which `metadataBase` resolves), `MetadataRoute.Sitemap` entries are emitted verbatim — use `siteUrl(path)` for every entry. A relative `url` produces an invalid sitemap.
- **Single source for routes/slugs:** the 7 public routes are a literal list (there's no route manifest to import); the featured slugs come from `projects.filter((p) => p.featured)` — **the same expression `generateStaticParams` uses** ([app/(chrome)/work/[slug]/page.tsx:30-32]) so the sitemap and the prerendered pages never drift. Do not hardcode slug strings.
- **`/api/` disallow:** `app/api/contact/route.ts` is a POST handler, not a page; disallowing `/api/` in robots is correct hygiene. Do not list it in the sitemap.
- **Determinism:** avoid `new Date()` in `sitemap.ts` — it makes every build emit a different `lastModified`, churning the file and breaking any "build output is stable" expectation. Omit it (or use a fixed constant).

### Architecture / project-context guardrails (must follow)
- **Server-only, no `"use client"`** — robots/sitemap/opengraph-image are all server modules; metadata-route files cannot be client components. [Source: project-context.md:80-83]
- **TypeScript strict / `isolatedModules`:** `import type { MetadataRoute } from "next"` (type-only import). **No `import React`** (`react-jsx`) — the OG JSX needs no React import. **Named exports** for `lib/og.tsx` helpers/constants; the route files use Next's required default export + named `size`/`contentType`/`alt`/`generateStaticParams` exports. [Source: project-context.md:67-72]
- **Import order:** external (`next/og`, `next`) → `@/*` (`@/lib/site`, `@/lib/content/*`, `@/lib/og`) → relative → side-effect/style. [Source: project-context.md:158-162]
- **No new dependency** — `next/og` is built in; do NOT add `@vercel/og`, `satori`, `sharp`, `next-sitemap`, or any SEO/image lib (heavy-dep + approval rule). [Source: project-context.md:185,222,305]
- **Comments:** none, except a single WHY comment if a Satori/literal-hex quirk genuinely needs explaining (e.g., "Satori can't read globals.css tokens"). [Source: project-context.md:153-156]
- **`SITE_URL`/`siteUrl()` reuse** — both already exist in `lib/site.ts` (created in 7.1) and carry the OQ1 env override. Reuse them; do **not** re-derive the domain. [Source: lib/site.ts:1-18]

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `app/robots.ts` | **NEW** | `MetadataRoute.Robots`; allow `/`, disallow `/api/`, absolute `sitemap` + `host` from `SITE_URL`. |
| `app/sitemap.ts` | **NEW** | `MetadataRoute.Sitemap`; 6 static routes + featured slugs, all absolute via `siteUrl()`; no `lastModified: new Date()`. |
| `lib/og.tsx` | **NEW** | Shared `OG_SIZE`, `OG_CONTENT_TYPE`, `renderOgImage({title, subtitle})` (inline-styled, Obsidian + Lime). Single source for OG layout. |
| `app/opengraph-image.tsx` | **NEW** | Root default OG (wordmark + role). `ImageResponse` + `size`/`contentType`/`alt`. |
| `app/(chrome)/work/[slug]/opengraph-image.tsx` | **NEW** | Per-slug OG; `generateStaticParams` (featured-only) + `size`/`contentType`/`alt`; `await params`. |
| `app/robots.test.ts` | **NEW** | rules/sitemap/host assertions. |
| `app/sitemap.test.ts` | **NEW** | absolute URLs, all routes + featured slugs, no dupes, count. |
| `lib/og.test.tsx` (optional) | **NEW** | constants + `renderOgImage` returns element. Don't test Satori output. |
| `app/twitter-image.tsx`, `.../[slug]/twitter-image.tsx` | **OPTIONAL** | Only if explicit `twitter:image` wanted; re-export the og-image modules. |
| `app/layout.tsx`, 7.1 metadata exports | **DO NOT TOUCH** | OG images auto-wire via convention; hand-setting `openGraph.images` would double-wire. |
| `app/favicon.ico` / `icon.*` | **DO NOT CREATE** | Not in 7.2 scope (see Out of scope). |
| `next.config.mjs` (CSP) | **DO NOT TOUCH** | Story 7.5. |

### Reuse — do NOT reinvent
- **`SITE_URL` + `siteUrl()`** from `lib/site.ts` (built in 7.1, env-overridable for OQ1) — for robots `sitemap`/`host`, every sitemap entry, and OG absolute resolution via `metadataBase`. [Source: lib/site.ts:1-18]
- **`projects.filter((p) => p.featured)`** — the canonical featured-slug expression; identical in `page.tsx` `generateStaticParams`, the sitemap, and the per-slug OG `generateStaticParams`. [Source: app/(chrome)/work/[slug]/page.tsx:30-32; lib/content/projects.ts:453-455]
- **`profile.role` / `profile.tagline`** from `lib/content/profile.ts` for the default OG subtitle — do not re-author. [Source: lib/content/profile.ts:34-40]
- **`ImageResponse` from `next/og`** — built-in; no `@vercel/og` install.
- **Brand hex** — Obsidian `#0B0D10`, Signal Lime `#C6F24E` (project-context Resolved Decision #1) for inline OG styles, since Satori can't read `globals.css` tokens.

### Doc-vs-code variances / decisions to surface (do NOT silently resolve)
1. **A14 — dynamic vs static OG (NFR-S4):** architecture defers the choice to "P4/P7." [architecture.md:528] This story chooses **dynamic `next/og`, statically prerendered** (per-slug, no dep, on-brand). The static `public/og/*.png` fallback is the documented contingency. **Record the final choice in Completion Notes.**
2. **OG brand font:** Satori can't use `next/font/google`. v1 may ship with Satori's default sans for a deterministic, zero-fetch build; loading IBM Plex Mono/Fraunces buffers is optional polish. Flag which was done.
3. **Twitter image:** relying on the `og:image` fallback (no extra files) vs. explicit `twitter-image.tsx` re-exports. Default to the fallback; flag if you add the re-exports.
4. **OQ1 — canonical domain** is still the `SITE_URL` placeholder (`https://hossammarey.com`, env-overridable). robots/sitemap/OG all inherit it; final value lands at deploy (7.5). Re-surface in Completion Notes — do not hardcode a new domain here. [Source: 7-1 Dev Notes "Canonical domain is OQ1"; prd.md OQ1]
5. **Mock content in OG:** featured projects are still `meta.mock: true` with `[PLACEHOLDER]` `problem` text. The OG image uses only `project.name` (real) + the wordmark — **not** `problem` — so placeholder copy never leaks into a share card. (The mock-content gate is 7.4.) [Source: lib/content/projects.ts:144-153]

### Out of scope (explicitly, to prevent scope creep)
- **`favicon.ico` / `app/icon.*` / `apple-icon` / `manifest`** — architecture lists `app/favicon.ico` [architecture.md:381] but it does **not** exist yet, and icons are **not** part of NFR-S3/S4 (robots/sitemap/OG). Do not create them in 7.2; flag as a separate future task if desired.
- **CSP / `next.config.mjs headers()`** — Story 7.5.
- **Print stylesheet** — Story 7.3. **Mock-content CI gate** — Story 7.4.

### Previous story / cross-cutting intelligence
- **Story 7.1 (review)** built `lib/site.ts` (`SITE_URL`, `siteUrl`, etc.), root `metadataBase` + title template, all per-route `og:*` tags, and the `JsonLd` single-source helper — and **deliberately left `openGraph.images` unset** for this story. Build on it: reuse `lib/site.ts`, close the seam via file-convention OG images, do not edit 7.1's metadata exports. [Source: 7-1 story Dev Notes + Completion Notes]
- **Story 4.3 (done)** established the `/work/[slug]` `generateStaticParams` (featured-only) + `await params` pattern; the per-slug OG image mirrors it exactly so prerender sets stay in lockstep. [Source: app/(chrome)/work/[slug]/page.tsx:30-39]
- **Single-source discipline** (from 7.1's one `JsonLd`, 6.4's one sanctioned exception): centralize the OG layout in one `lib/og.tsx` so the two image routes don't duplicate JSX.
- **Architecture P7** bundles "OG images, sitemap, robots" as the credibility-and-shipping gate; route tree already names `app/robots.ts`, `app/sitemap.ts`, and `work/[slug]/opengraph-image.tsx` as their homes. [Source: architecture.md:238,382-391]

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`; colocate `*.test.ts(x)` next to source; query by role/text (n/a for these data-shape tests). [Source: project-context.md:122-133]
- **robots/sitemap default exports are plain functions returning objects** — call them directly and assert the returned shape. No rendering needed.
- **Do NOT render `ImageResponse` under jsdom** — Satori/`@vercel/og` requires a real runtime and will throw in Vitest. Test only `generateStaticParams`, `size`, `contentType`, `alt`, and (optionally) that `renderOgImage` returns a defined element. Pixel/PNG output is framework-owned — no snapshots. [Source: project-context.md:130-132]
- **`fast-check`** available if you want to property-test the sitemap (e.g., every entry URL is absolute and unique for any subset of featured flags) — optional. [Source: project-context.md:129]

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 (App Router):** `MetadataRoute.Robots` / `MetadataRoute.Sitemap` are the typed return shapes for `app/robots.ts` / `app/sitemap.ts`. `ImageResponse` is imported from **`next/og`** (built in). `opengraph-image.tsx` in a dynamic segment receives `{ params }` where **`params` is a Promise** (await it) and supports `generateStaticParams` to prerender per-slug. The `alt`/`size`/`contentType` named exports feed `og:image:alt` and the image headers. [Source: project-context.md:32,78-84]
- **React 19.2.4:** OG JSX needs no `import React` (`react-jsx`); rendered server-side by Satori, zero client/hydration cost.
- **TypeScript 5.9.3 strict / `isolatedModules`:** `import type { MetadataRoute } from "next"`.
- **No new dependencies** — `next/og` vendored; no `next-sitemap`, `@vercel/og`, `sharp`, or `schema-dts`. [Source: project-context.md:185,305]

### References
- [Source: _bmad-output/planning-artifacts/epics.md:769-783] — Story 7.2 ACs: `app/robots.ts`/`app/sitemap.ts` via metadata APIs covering all public routes; `opengraph-image.tsx` per-slug OG with static fallback (A14) + `next/image`/`alt` discipline (NFR-A5).
- [Source: _bmad-output/planning-artifacts/epics.md:130-133] — NFR-S3 (robots/sitemap via Next metadata APIs), NFR-S4 (per-case-study OG via `opengraph-image.tsx`, static fallback allowed), NFR-S1/S2 (7.1).
- [Source: _bmad-output/planning-artifacts/epics.md:125] — NFR-A5 (`alt` on every image; `next/image` always).
- [Source: _bmad-output/planning-artifacts/architecture.md:45,238,260,382-391,489,528] — SEO approach, P7 phase, reserved route-file names, route-tree homes for `robots.ts`/`sitemap.ts`/`opengraph-image.tsx`, NFR-S home, dynamic-vs-static OG decision ("pick during P4/P7").
- [Source: _bmad-output/project-context.md:32-34,80-84,158-162,185,305,327] — Next 16/metadata API rules, server-component discipline, import order, no-heavy-dep, Obsidian + Lime palette hex.
- [Source: _bmad-output/implementation-artifacts/7-1-per-route-metadata-and-json-ld.md (Dev Notes "The 7.1↔7.2 seam", Completion Notes)] — `openGraph.images` left unset for 7.2; `lib/site.ts` API; do-not-double-wire guidance.
- [Source: lib/site.ts:1-18] — `SITE_URL` (env-overridable, OQ1), `SITE_NAME`, `siteUrl(path)` for absolute URLs.
- [Source: lib/content/projects.ts:118-228,453-455] — featured projects + frozen `projects` collection; featured-slug source for sitemap + per-slug OG.
- [Source: app/(chrome)/work/[slug]/page.tsx:30-39] — `generateStaticParams` (featured-only) + `await params` pattern to mirror in the per-slug OG image.
- [Source: lib/content/profile.ts:34-40] — `name`/`role`/`tagline` for the default OG image.
- [Source: app/layout.tsx:19-35] — 7.1 root metadata (metadataBase + tags) that auto-receives `og:image` once the opengraph-image files exist; DO NOT edit.

### Project Structure Notes
- New metadata-route files live at the **`app/` root** (`robots.ts`, `sitemap.ts`, `opengraph-image.tsx`) per Next reserved-name convention [architecture.md:260,382-383] and inside the dynamic segment for the per-slug image (`app/(chrome)/work/[slug]/opengraph-image.tsx`) [architecture.md:391]. `lib/og.tsx` follows the flat `lib/site.ts` convention (kebab/lowercase module, named exports, Server-safe).
- All additions are Server-only; none add `"use client"`, none alter route content/UX, and `/work/[slug]`'s existing `generateStaticParams` + dynamic import + not-found branch are untouched.
- The root `app/opengraph-image.tsx` cascades to all routes (incl. the `(chrome)` group and `/recruiter`); the `work/[slug]` image overrides only that segment — matching the file-convention model and the architecture route tree.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- **A14 decision resolved:** Dynamic `next/og` generation, statically prerendered at build. Chosen over static `public/og/*.png` fallback because `ImageResponse` is built into Next 16.1.7 (zero new dependency), generates per-slug branded images automatically, and all images are prerendered via `generateStaticParams`. The static PNG fallback remains the documented contingency if Satori proves brittle in production.
- **OG brand font:** Shipped with Satori's built-in default sans font for a deterministic, zero-fetch build. Loading IBM Plex Mono / Fraunces buffers into `ImageResponse` is noted as deferred polish — the inline-style approach with system font is clean and build-stable.
- **Twitter image:** Relying on `og:image` fallback (no extra `twitter-image.tsx` files). Twitter/X already falls back to `og:image` when `twitter:image` is absent, and `summary_large_image` card is set in 7.1 metadata.
- **OQ1 canonical domain:** Still using `SITE_URL` placeholder (`https://hossammarey.com`, env-overridable via `NEXT_PUBLIC_SITE_URL`). All robots/sitemap/OG URLs inherit it correctly. Final domain value lands at deploy (Story 7.5).
- **Build verification:** Route table shows `/robots.txt`, `/sitemap.xml`, `/opengraph-image` (○ static), and `/work/[slug]/opengraph-image` (● SSG with 3 featured slugs prerendered: buguard, dark-atlas, masheed-gate). No route flipped to dynamic (`ƒ`) except pre-existing `/api/contact`.
- **Gates:** `yarn typecheck` clean, `yarn lint` 0 errors (3 pre-existing warnings), `yarn test:run` 365 passed / 48 files, `yarn format` clean, `yarn build` successful.

### File List

| File | Status | Notes |
|---|---|---|
| `app/robots.ts` | **NEW** | `MetadataRoute.Robots`; allow `/`, disallow `/api/`, absolute sitemap + host via `SITE_URL` |
| `app/robots.test.ts` | **NEW** | Shape tests: rules, disallow, absolute sitemap, host |
| `app/sitemap.ts` | **NEW** | `MetadataRoute.Sitemap`; 6 static routes + 3 featured slugs, all absolute via `siteUrl()`; no `lastModified` |
| `app/sitemap.test.ts` | **NEW** | Absolute URLs, all routes + featured slugs present, no dupes, correct count |
| `lib/og.tsx` | **NEW** | Shared `OG_SIZE`, `OG_CONTENT_TYPE`, `renderOgImage({title, subtitle})` — inline styles, Obsidian + Signal Lime |
| `lib/og.test.tsx` | **NEW** | Constants + `renderOgImage` returns defined element; no Satori output testing |
| `app/opengraph-image.tsx` | **NEW** | Root default OG (wordmark + role from profile); `size`/`contentType`/`alt` exports |
| `app/opengraph-image.test.ts` | **NEW** | Static exports: size, contentType, alt, default export is function |
| `app/(chrome)/work/[slug]/opengraph-image.tsx` | **NEW** | Per-slug OG; `generateStaticParams` (featured-only) + `await params`; fallback for missing project |
| `app/(chrome)/work/[slug]/opengraph-image.test.ts` | **NEW** | `generateStaticParams` returns featured slugs only; static exports correct |
| `app/layout.tsx` | **UNCHANGED** | 7.1 metadata auto-receives `og:image` via convention; not touched |
| `app/(chrome)/work/[slug]/page.tsx` | **UNCHANGED** | Existing `generateStaticParams` + dynamic import + not-found branch untouched |

### Review Findings

- [x] [Review][Defer] Non-featured slug renders generic OG image instead of 404 [`app/(chrome)/work/[slug]/opengraph-image.tsx:20-23`] — deferred, pre-existing design choice; generateStaticParams limits to featured, page.tsx handles notFound separately
- [x] [Review][Defer] Very long title overflows OG image (no vertical clamp) [`lib/og.tsx:46-56`] — deferred, low-probability future concern; project names come from schema-validated content
- [x] [Review][Defer] Tests use JSON.stringify on React elements (fragile) [`lib/og.test.tsx:22-29`] — deferred, common pattern in this codebase; React upgrade unlikely to break
- [x] [Review][Defer] No `dynamicParams = false` export in per-slug OG image [`app/(chrome)/work/[slug]/opengraph-image.tsx`] — deferred, non-featured slugs aren't linked anywhere

### Change Log

- Created `app/robots.ts` + `app/robots.test.ts` — crawl rules with `/api/` disallow and absolute sitemap reference
- Created `app/sitemap.ts` + `app/sitemap.test.ts` — 9 entries (6 static + 3 featured projects), all absolute URLs
- Created `lib/og.tsx` + `lib/og.test.tsx` — shared OG layout helper with Obsidian + Signal Lime branding, inline Satori-safe styles
- Created `app/opengraph-image.tsx` + test — site-wide default OG image (1200×630 PNG)
- Created `app/(chrome)/work/[slug]/opengraph-image.tsx` + test — per-slug case-study OG images, statically prerendered for 3 featured projects
- All gates green: typecheck, lint (0 errors), test:run (365 passed), format, build

## Story Completion Status

- [x] Epic context analyzed (Epic 7 launch readiness; 7.1 metadata+JSON-LD DONE; 7.2 = robots/sitemap/OG-image bitmaps; 7.3 print; 7.4 mock-gate; 7.5 CSP/Lighthouse/deploy)
- [x] Architecture requirements extracted (metadata-route APIs, reserved file names, route-tree homes, server-only, no-dep, A14 dynamic-vs-static OG, absolute sitemap URLs)
- [x] Existing code read (lib/site.ts, lib/content/projects.ts + profile.ts, work/[slug]/page.tsx generateStaticParams, 7.1 root metadata + the deferred openGraph.images seam, font.ts, app/public structure)
- [x] File modifications identified (NEW robots.ts + sitemap.ts + lib/og.tsx + 2 opengraph-image.tsx + tests; DO-NOT-TOUCH 7.1 metadata/layout; OUT-OF-SCOPE favicon/CSP/print/gate)
- [x] Reuse opportunities documented (SITE_URL/siteUrl, featured-slug expression, profile fields, built-in next/og, brand hex)
- [x] Testing requirements specified (robots/sitemap shape tests; OG static-export + generateStaticParams only — never render ImageResponse in jsdom)
- [x] Anti-patterns + guardrails listed (no new dep, no double-wiring openGraph.images, no new Date() in sitemap, absolute sitemap URLs, Satori inline-style/display:flex constraints, server-only)
- [x] Doc-vs-code variances surfaced (A14 dynamic-vs-static decision, OG brand font, twitter-image choice, OQ1 domain, mock content not leaked into OG, favicon out of scope)
- [x] Scope boundaries vs Stories 7.1 / 7.3 / 7.4 / 7.5 / 4.3 stated

**Status:** ready-for-dev

Ultimate context engine analysis completed — comprehensive developer guide created.
