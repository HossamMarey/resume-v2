# Story 7.1: Per-route metadata and JSON-LD

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Scope seam (2026-06-02): This story owns per-route METADATA (title/description/canonical/OG tags via the Next metadata API) + JSON-LD (Person + WebSite on `/`, BreadcrumbList on `/work/[slug]`). It does NOT generate the OG IMAGE bitmap, robots.txt, or sitemap.xml — those are Story 7.2 (`app/robots.ts`, `app/sitemap.ts`, `opengraph-image.tsx`). NFR-S1's "OG image" requirement is satisfied jointly across 7.1 (the `og:*` tags + `metadataBase`) and 7.2 (the actual image files, which Next auto-wires by file convention). Do NOT point `openGraph.images` at a file that doesn't exist yet — see Dev Notes "The 7.1↔7.2 seam". -->

## Story

As a recruiter finding the site via search/social,
I want correct titles, descriptions, canonical URLs, and structured data on every route,
so that shared links render richly in Slack/LinkedIn/iMessage and the site is discoverable and credible.

## Acceptance Criteria

1. **(NFR-S1 — per-route metadata, every route)** Every public route exports metadata via the **Next.js metadata API** (`export const metadata` for static routes; `generateMetadata` for `/work/[slug]`) such that the rendered `<head>` carries:
   - a `<title>` **≤60 chars**,
   - a `<meta name="description">` **≤160 chars**,
   - a **canonical URL** (`alternates.canonical`),
   - **Open Graph tags** (`og:title`, `og:description`, `og:url`, `og:type`, `og:site_name`, `og:locale`) and Twitter card tags (`twitter:card` = `summary_large_image`).
   Routes in scope: `/` (Elements), `/work` (Network), `/work/[slug]` (case study), `/perf` (Performance), `/sources` (Sources), `/console` (Console), `/recruiter` (editorial resume). [Source: prd.md:289 NFR-S1; epics.md:761-763]

2. **(metadataBase + DRY root defaults)** `app/layout.tsx` exports a root `metadata` that sets **`metadataBase`** (absolute site URL — see Dev Notes "Canonical domain is OQ1") so all per-route relative canonical/OG URLs resolve to absolute, plus a **title template** (`title: { template: "%s — devtools://hossam", default: "devtools://hossam — Hossam Marey, Senior Front-End Developer" }`), a default `description`, default `openGraph` (`type: "website"`, `siteName`, `locale: "en_US"`), and default `twitter` card. Per-route files then set the **bare segment** title (e.g. `title: "Elements"`) and rely on the template; `/recruiter` and `/work/[slug]` use `title.absolute` where the full string must differ from the template. No route's final title exceeds 60 chars. [Source: project-context.md:82; architecture.md:369]

3. **(FR-032 — case-study metadata derived from content)** `app/(chrome)/work/[slug]/page.tsx` `generateMetadata` produces, **per featured slug**:
   - title `${project.name} — devtools://hossam` (via `title.absolute`), **truncated/guarded so the final string is ≤60 chars** (if `name` is long, fall back to `${project.name}` alone or a clipped form — see Dev Notes),
   - `description` derived from the **first sentence of `project.problem`** (clamp to ≤160 chars, strip trailing whitespace),
   - canonical `/work/${slug}` and `openGraph.url` `/work/${slug}` with `og:type` `article`.
   The existing non-featured / not-found branch (`{ title: "Project Detail — devtools://hossam" }`) is preserved (still ≤60). [Source: prd.md:178 FR-032; epics.md:763; app/(chrome)/work/[slug]/page.tsx:32-45]

4. **(NFR-S2 — JSON-LD Person + WebSite on `/`)** The Elements route `/` renders **JSON-LD** for a `Person` (`name`, `jobTitle` = `profile.role`, `url` = site URL, `sameAs` = `profile.socials[].href`, `address`/`addressCountry` from `profile.location`) **and** a `WebSite` (`name`, `url`), sourced from `lib/content/profile.ts`. Injection uses a `<script type="application/ld+json">` with **`dangerouslySetInnerHTML`** carrying `JSON.stringify(data)` with `<` escaped to `<` (see Dev Notes). This is the **sanctioned owned-JSON-LD exception** to the no-`dangerouslySetInnerHTML` rule (AC6). [Source: prd.md:290 NFR-S2; epics.md:763,767; project-context.md:178,288]

5. **(NFR-S2 — BreadcrumbList on `/work/[slug]`)** Each case-study page renders a `BreadcrumbList` JSON-LD with items: **Home (`/`) → Network (`/work`) → `${project.name}` (`/work/${slug}`)**, positions 1→3, absolute URLs. Same injection mechanism as AC4. [Source: prd.md:290 NFR-S2; epics.md:763]

6. **(NFR-P3 + NFR-SE3 — injection discipline)** Structured data uses **only** the metadata API and the owned inline JSON-LD `<script>`. **No external `<script src>` tags** (NFR-P3) and **no `dangerouslySetInnerHTML` anywhere except the owned, JSON-stringified JSON-LD nodes** (NFR-SE3). The JSON-LD payload contains only **owned, static content** (from `profile`/`projects`) — no user input, no `fetch`. [Source: prd.md:267 NFR-P3, 298 NFR-SE3; epics.md:765-767; architecture.md:178]

7. **(No regressions)** Existing route content/UX is untouched (this story only adds/edits `metadata`/`generateMetadata` exports and inserts inert JSON-LD `<script>` nodes). Pages that export `metadata` remain **Server Components** (no `"use client"` added). The `/work/[slug]` `generateStaticParams` + dynamic-import detail pane, the `(chrome)` layout, Recruiter Mode, the XP bus, and the `D`/`⌘K`/Konami hotkeys all keep working. `/sources` & `/work/[slug]` stay statically generated; no route becomes dynamic. [Source: project-context.md:80-83; architecture.md:382-390]

8. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds with all routes still **static** (`○`/`●`), no route flips to dynamic (`ƒ`). Manual (`yarn dev` + view-source / devtools): each route shows a ≤60 title, ≤160 description, canonical `<link>`, `og:*`/`twitter:*` tags; `/` view-source contains parseable `Person` + `WebSite` JSON-LD; `/work/<slug>` contains parseable `BreadcrumbList`; paste a `/work/<slug>` URL into a link-preview validator (or inspect the tags) — title/description/og present; no console errors; `D` hotkey + `<html dir="rtl">` + mobile still work.

## Tasks / Subtasks

- [x] **Task 1 — Site config constant (AC: 2, 4, 5)**
  - [ ] Create `lib/site.ts` (named exports, no `"use client"`): `SITE_URL` (absolute, e.g. `https://hossammarey.com` — **OQ1 placeholder, env-overridable**: `process.env.NEXT_PUBLIC_SITE_URL ?? "https://hossammarey.com"`), `SITE_NAME = "devtools://hossam"`, `SITE_TITLE_DEFAULT`, `SITE_DESCRIPTION_DEFAULT` (≤160), `OG_LOCALE = "en_US"`. Export a `siteUrl(path = "/")` helper that joins `SITE_URL` + path for absolute JSON-LD URLs.
  - [ ] Add `NEXT_PUBLIC_SITE_URL` to `.env.example` with a comment (this is a **public, non-secret** URL — `NEXT_PUBLIC_` is correct here, unlike the Telegram secrets). Surface OQ1 (undecided canonical domain) in Completion Notes.

- [x] **Task 2 — Root metadata defaults + metadataBase (AC: 1, 2)**
  - [ ] In `app/layout.tsx`, add `export const metadata: Metadata = { metadataBase: new URL(SITE_URL), title: { template: "%s — devtools://hossam", default: SITE_TITLE_DEFAULT }, description: SITE_DESCRIPTION_DEFAULT, openGraph: { type: "website", siteName: SITE_NAME, locale: OG_LOCALE, url: "/" }, twitter: { card: "summary_large_image" } }`. Keep the existing `viewport` export and everything else unchanged. `import type { Metadata } from "next"`.

- [x] **Task 3 — Per-route static metadata (AC: 1, 2)**
  - [x] For `/` (`app/(chrome)/page.tsx`), `/work` (`app/(chrome)/work/page.tsx`), `/perf` (`app/(chrome)/perf/page.tsx`), `/sources` (`app/(chrome)/sources/page.tsx`), `/console` (`app/(chrome)/console/page.tsx`): change `metadata` to set the **bare segment title** (`"Elements"`, `"Network"`, `"Performance"`, `"Sources"`, `"Console"` — the template appends ` — devtools://hossam`), add a per-route `description` (≤160), `alternates: { canonical: "<route path>" }`, and `openGraph: { url: "<route path>", title, description }`. Verify each `title + " — devtools://hossam"` ≤60.
  - [x] For `/recruiter` (`app/recruiter/page.tsx`): keep its distinct title via `title: { absolute: "Hossam Marey — Senior Front-End Developer" }` (already its current string; just wrap as `absolute` so the template doesn't double-append), add `description`, `alternates.canonical: "/recruiter"`, `openGraph`.

- [x] **Task 4 — Case-study generateMetadata (AC: 1, 3)**
  - [x] In `app/(chrome)/work/[slug]/page.tsx` `generateMetadata`, for the featured branch return `title: { absolute: titleFor(project.name) }` (where `titleFor` clamps to ≤60), `description: firstSentence(project.problem)` (clamp ≤160), `alternates: { canonical: \`/work/${slug}\` }`, `openGraph: { type: "article", url: \`/work/${slug}\`, title, description }`. Keep the existing not-found/non-featured fallback (≤60). Add tiny pure helpers `firstSentence(s)` and a title clamp (colocate in this file or `lib/site.ts`).

- [x] **Task 5 — JSON-LD injection (AC: 4, 5, 6)**
  - [x] Add a tiny **Server Component** helper `components/json-ld.tsx` (named export `JsonLd`, no `"use client"`): renders `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />`. Accept `data: Record<string, unknown>` (or `unknown`). Add the **one** justification comment for the `dangerouslySetInnerHTML` (owned static JSON-LD, no user input — sanctioned by NFR-SE3 / epics.md:767). This is the single allowed use in the codebase.
  - [x] In `app/(chrome)/page.tsx`, build `personJsonLd` + `websiteJsonLd` from `profile` (+ `SITE_URL`) and render `<JsonLd data={personJsonLd} />` + `<JsonLd data={websiteJsonLd} />` inside the returned fragment (a `<script>` in the body is valid for JSON-LD and avoids touching layout). Use `@type: "Person"` / `"WebSite"`, `@context: "https://schema.org"`.
  - [x] In `app/(chrome)/work/[slug]/page.tsx` (the page default export, featured branch), build `breadcrumbJsonLd` (Home → Network → project) and render `<JsonLd data={breadcrumbJsonLd} />`.

- [x] **Task 6 — Tests (AC: 1, 3, 4, 5)**
  - [x] `components/json-ld.test.tsx`: render `<JsonLd data={{ "@type": "Person", name: "X" }} />`; assert a `script[type="application/ld+json"]` exists and `JSON.parse(script.textContent)` round-trips; assert a payload containing `</script>`-like `<` is escaped (no raw `<` in output).
  - [x] `app/(chrome)/work/[slug]/metadata.test.ts` (or colocated): call `generateMetadata({ params })` for a known featured slug — assert title ≤60, description ≤160 and equals the first sentence of that project's `problem`, canonical = `/work/<slug>`, `openGraph.type === "article"`. Assert the non-featured slug returns the fallback title.
  - [x] `lib/site.test.ts`: `siteUrl("/work/x")` returns an absolute URL with no double slash; `SITE_DESCRIPTION_DEFAULT.length <= 160`.
  - [x] (Optional, property-ish) a small test asserting every static route's effective title ≤60 and description ≤160 — import each route's `metadata`, compose with the template, assert lengths. Avoid testing Next framework internals or exact OG serialization (Next owns that).

- [x] **Task 7 — Verify & gate (AC: 7, 8)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds and the route table shows `/`, `/work`, `/work/[slug]`, `/perf`, `/sources`, `/console`, `/recruiter` all **static** (not `ƒ`).
  - [x] `yarn dev` manual (project-context "UI verification"): view-source each route → ≤60 title, ≤160 description, canonical, `og:*`, `twitter:card`; `/` has `Person` + `WebSite` JSON-LD (parseable); `/work/<slug>` has `BreadcrumbList`; no console errors/warnings; `D` theme toggle works; `<html dir="rtl">` still renders; mobile <640px not broken. Note in Completion Notes that the **OG image bitmap is Story 7.2** (tags reference it but the file lands next story).

## Dev Notes

### What this story IS (and is NOT)
- **IS:** per-route `metadata`/`generateMetadata` (title ≤60, description ≤160, canonical, OG/Twitter tags), a root `metadataBase` + title template, and **owned JSON-LD** (`Person` + `WebSite` on `/`, `BreadcrumbList` on `/work/[slug]`) injected via a single sanctioned `dangerouslySetInnerHTML` helper.
- **IS NOT:** generating the OG **image** bitmap (`opengraph-image.tsx`), `robots.txt`, or `sitemap.xml` — those are **Story 7.2**. Not CSP headers (Story 7.5). Not the print stylesheet (7.3). Not any content/UX change to the routes themselves.

### The 7.1↔7.2 seam (read this — avoids a broken-image regression)
- NFR-S1 lists "OG image" on every route; NFR-S4 + Story 7.2 produce the actual image via `opengraph-image.tsx` (per-slug, dynamic, with static fallback). [Source: prd.md:289,292; epics.md:769-783]
- **In 7.1, set the OG *tags* (title/description/url/type/site_name/locale) and `metadataBase` — do NOT set `openGraph.images` pointing at a file that doesn't exist yet.** Next.js auto-injects `og:image` when 7.2 adds an `opengraph-image.tsx`/`opengraph-image.png` by file convention; if you hardcode `images: ["/og.png"]` now, you ship a 404'd preview. Leaving `images` unset is correct for this story. (If a single global static OG is desired before 7.2, that's a 7.2 decision — flag, don't pre-empt.)

### JSON-LD injection — the sanctioned `dangerouslySetInnerHTML` exception
- Next.js's official pattern for JSON-LD is an inline `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />` rendered in the page (App Router, RSC). It is **same-origin inline** content, **not** an external `<script src>` — so it does **not** violate NFR-P3 ("no external `<script>` tags"). [Source: prd.md:267]
- project-context forbids `dangerouslySetInnerHTML` **"except for owned MDX with sanitization"**; the epic widens this explicitly: **"no `dangerouslySetInnerHTML` beyond owned JSON-LD."** The JSON-LD here is fully owned/static (from `profile`/`projects`), serialized by `JSON.stringify`, with **no user input** → this is the one sanctioned use. Put the single justification comment on the helper. [Source: project-context.md:288; epics.md:767; prd.md:298 NFR-SE3]
- **Escape `<` to `<`** in the serialized string (`JSON.stringify(data).replace(/</g, "\\u003c")`) so a value that ever contains `</script>` cannot break out of the tag. Owned data makes this low-risk, but it's the standard hardening and keeps NFR-SE3 honest.
- Centralize in **one** `components/json-ld.tsx` helper so the `dangerouslySetInnerHTML` lives in exactly one audited place (a grep for `dangerouslySetInnerHTML` should return only this file).

### Canonical domain is OQ1 (UNRESOLVED — surface it)
- The canonical domain (`hossammarey.com` vs `hossam.dev` vs …) is **Open Question OQ1**, resolved on **deploy day (Phase 7)**. [Source: prd.md:412 OQ1, 364]
- Don't block on it: define `SITE_URL` in `lib/site.ts` as `process.env.NEXT_PUBLIC_SITE_URL ?? "https://hossammarey.com"` (placeholder default) and add `NEXT_PUBLIC_SITE_URL` to `.env.example`. `metadataBase = new URL(SITE_URL)`. When the domain is decided (7.5/deploy), it's a one-line/env change. **Surface OQ1 in Completion Notes** so it isn't silently hardcoded. This URL is **public, non-secret** — `NEXT_PUBLIC_` is correct (contrast the Telegram token, which must stay server-only). [Source: project-context.md "Env vars", decision #5; lib/schemas/contact.ts pattern]

### Architecture / project-context guardrails (must follow)
- **Metadata API only** — `export const metadata` / `generateMetadata`, never raw `<head>` / `next/head`. Title <60, description <160. [Source: project-context.md:82; prd.md:289]
- **Server Components stay server** — these pages export `metadata`, so they must NOT gain `"use client"`. JSON-LD is rendered server-side. Don't move `metadata` into a client file (Next forbids `metadata` export from client components). [Source: project-context.md:80-83]
- **TypeScript:** `strict`; `import type { Metadata } from "next"` (`isolatedModules` → type-only import); **no `import React`** (`react-jsx`); **named exports** for `JsonLd` and `lib/site.ts` symbols (the `page.tsx`/`layout.tsx` default exports stay default). [Source: project-context.md:67-72]
- **Import order:** external → `@/*` → relative → side-effect/style. [Source: project-context.md:158-162]
- **No new dependency** — JSON-LD is hand-built objects + `JSON.stringify`; do NOT add `schema-dts`, `next-seo`, or any SEO lib (heavy-dep + approval rule). Optionally use `schema-dts` **types only** is still a dep — skip it; inline `Record<string, unknown>` or a small local type is fine. [Source: project-context.md:185,222,305]
- **Comments:** none except the one WHY comment justifying `dangerouslySetInnerHTML`. [Source: project-context.md:153-156]
- **Semantic HTML / a11y:** JSON-LD `<script>` is non-visual (no a11y impact). Don't alter heading structure or landmarks. [Source: project-context.md:250-257]

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `lib/site.ts` | **NEW** | `SITE_URL` (env-overridable, OQ1 placeholder), `SITE_NAME`, `SITE_TITLE_DEFAULT`, `SITE_DESCRIPTION_DEFAULT` (≤160), `OG_LOCALE`, `siteUrl(path)` helper. Optionally `firstSentence`/title-clamp helpers. |
| `lib/site.test.ts` | **NEW** | `siteUrl` join, default description ≤160. |
| `components/json-ld.tsx` | **NEW** | `JsonLd` server component; the **single** `dangerouslySetInnerHTML` (escaped). |
| `components/json-ld.test.tsx` | **NEW** | script present, JSON parses, `<` escaped. |
| `app/layout.tsx` | **UPDATE** | Add root `metadata` (metadataBase + title template + default description/OG/twitter). Keep `viewport` + structure. |
| `app/(chrome)/page.tsx` | **UPDATE** | Bare title `"Elements"` + description + canonical + OG; render `Person` + `WebSite` `<JsonLd>`. |
| `app/(chrome)/work/page.tsx` | **UPDATE** | Title `"Network"` + description + canonical + OG. |
| `app/(chrome)/work/[slug]/page.tsx` | **UPDATE** | `generateMetadata`: description from `problem` first sentence, ≤60 title, canonical, `og:type article`; render `BreadcrumbList` `<JsonLd>`. Keep `generateStaticParams` + fallback branch. |
| `app/(chrome)/perf/page.tsx` | **UPDATE** | Title `"Performance"` + description + canonical + OG. |
| `app/(chrome)/sources/page.tsx` | **UPDATE** | Title `"Sources"` + description + canonical + OG. Stays static. |
| `app/(chrome)/console/page.tsx` | **UPDATE** | Title `"Console"` + description + canonical + OG. |
| `app/recruiter/page.tsx` | **UPDATE** | `title.absolute` (keep current string) + description + canonical + OG. |
| `.env.example` | **UPDATE** | Add `NEXT_PUBLIC_SITE_URL` (public, non-secret) with comment. |
| `app/robots.ts`, `app/sitemap.ts`, `opengraph-image.tsx` | **DO NOT CREATE** | Story 7.2. |

### Reuse — do NOT reinvent
- **`profile` from `lib/content/profile.ts`** — `name`, `role` (→ `jobTitle`), `location`, `socials[].href` (→ `sameAs`), `tagline` (good default/description source, ~88 chars). Already Zod-validated. Do NOT re-author resume facts. [Source: lib/content/profile.ts:34-71]
- **`projects` from `lib/content/projects.ts`** — `slug`, `name`, `problem` (description source), `featured` (only featured slugs are statically generated and get metadata/breadcrumbs). [Source: lib/content/projects.ts:6-35; app/(chrome)/work/[slug]/page.tsx:28-29]
- **Existing `metadata`/`generateMetadata` exports** — every route already has a `title`; you're extending those exports, not adding new files. The `/work/[slug]` `generateMetadata` already awaits `params` and looks up the project — extend its return object. [Source: app/(chrome)/work/[slug]/page.tsx:32-45]
- **`metadataBase`** (set once at root) makes per-route `alternates.canonical` / `openGraph.url` work as **relative paths** — don't build absolute URLs by hand in each route for those (only JSON-LD needs absolute, via `siteUrl()`). [Source: architecture.md:369]

### Doc-vs-code variances / decisions to surface (do NOT silently resolve)
1. **OG image is 7.2, not 7.1 (seam).** NFR-S1 says every route has an "OG image"; the bitmap is produced in 7.2. 7.1 ships the `og:*` *tags* + `metadataBase` only. Leaving `openGraph.images` unset is intentional — flag so it's not read as a missed AC. [Source: epics.md:769-783]
2. **Canonical domain undecided (OQ1).** `SITE_URL` is a placeholder (`https://hossammarey.com`) with an env override. Surface; final value lands at deploy (7.5). [Source: prd.md:412]
3. **Title template refactor.** Existing routes hardcode `"<Segment> — devtools://hossam"`. Recommended: root template + bare segment titles (DRY, AC2). Alternative: keep full strings per route and skip the template. Default to the **template** (less repetition, single source for the suffix), with `title.absolute` for `/recruiter` and `/work/[slug]`. Either satisfies the ACs — flag the chosen approach.
4. **Person `address` granularity.** `profile.location` is just `"Egypt"`. Model as `address: { "@type": "PostalAddress", addressCountry: "Egypt" }` (or omit address and rely on `sameAs`). Minimal is fine — flag the choice.
5. **`email` in JSON-LD.** `profile.email` is currently `""` (empty) and contact is via the form/Telegram. Do **NOT** invent an email for `Person.email`; omit it (or use `sameAs` socials only). The toast-exposed `hosmarey@gmail.com` is a separate, intentional fallback and is not authored into structured data here.

### Previous story / cross-cutting intelligence
- **Story 6.4 (done)** established the **single sanctioned exception pattern** discipline (one audited place for a risky primitive) and the env-secret boundary (`NEXT_PUBLIC_` only for non-secrets). Mirror that: one `JsonLd` helper, `NEXT_PUBLIC_SITE_URL` is the *correct* public use of the prefix. [Source: 6-4 story Dev Notes "No client-side secrets"; project-context.md decision #5]
- **Story 4.3 (done)** built `/work/[slug]` with `generateStaticParams` (featured only) + `generateMetadata` (title only) + a `dynamic()`-imported detail pane. You're extending its `generateMetadata` and adding a JSON-LD node to its server render — **do not** touch `generateStaticParams`, the dynamic import, or the not-found branch. [Source: app/(chrome)/work/[slug]/page.tsx:1-45]
- **Story 6.1 (done)** built `/recruiter` OUTSIDE `(chrome)` with its own `<main>` and a distinct title — its title must NOT get the `devtools://hossam` suffix appended (use `title.absolute`). [Source: app/recruiter/page.tsx:6-7]
- **Architecture P7 phase** explicitly bundles "print stylesheet, OG images, JSON-LD, sitemap, CSP, Lighthouse, deploy" — confirming JSON-LD + per-route metadata are this epic's first credibility gate. [Source: architecture.md:238,489]

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`. Colocate `*.test.ts(x)` next to source. Query by role/text; avoid `getByTestId`. [Source: project-context.md:122-133]
- **`generateMetadata` is an async function returning a plain object** — call it directly with a mocked `params` Promise (`Promise.resolve({ slug })`) and assert the returned object's fields. No need to render the page for metadata assertions. [Source: app/(chrome)/work/[slug]/page.tsx:32-37]
- **`JsonLd`** — render with Testing Library, query the script via `container.querySelector('script[type="application/ld+json"]')`, `JSON.parse(el.textContent ?? "")`, assert shape and that `el.innerHTML` has no raw `</`/`<`.
- **Don't test:** Next's serialization of `metadata` into `<head>` (framework-owned), Tailwind classes, OG image rendering (7.2), exact title strings beyond the **≤60 / ≤160 length contracts**. No snapshots. [Source: project-context.md:130-132]
- `fast-check` is available if you want to property-test the `firstSentence`/clamp helpers (input never exceeds 160, never empty for non-empty input) — optional. [Source: project-context.md:129]

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 (App Router):** `Metadata` / `metadataBase` / `alternates.canonical` / `openGraph` / `twitter` are the supported metadata fields. `generateMetadata(props)` may be async and `params` is a **Promise** (already awaited in this file). A title `template` only applies to **child** segments' string titles, not to `title.absolute`. JSON-LD via inline `<script>` in the RSC tree is the documented approach. [Source: project-context.md:32-34,82]
- **React 19.2.4:** `dangerouslySetInnerHTML={{ __html }}` unchanged; server components render the `<script>` with no hydration cost. No `import React`. [Source: project-context.md:71,88-90]
- **TypeScript 5.9.3 strict / `isolatedModules`:** `import type { Metadata } from "next"`; type JSON-LD objects as `Record<string, unknown>` or a small local interface (no `schema-dts` dep). [Source: project-context.md:34,68]
- **No new dependencies** — no `next-seo`, no `schema-dts`. Hand-built objects only. [Source: project-context.md:185,305]

### References
- [Source: _bmad-output/planning-artifacts/epics.md:753-767] — Story 7.1 ACs: per-route title/description/canonical/OG via metadata API; `Person`+`WebSite` on `/`; `BreadcrumbList` on `/work/[slug]`; metadata API only, no external `<script>`, no `dangerouslySetInnerHTML` beyond owned JSON-LD.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:289-292] — NFR-S1 (title ≤60 / desc ≤160 / canonical / OG, every route), NFR-S2 (`Person`+`WebSite` on `/`, `BreadcrumbList` on `/work/[slug]`), NFR-S3/S4 (sitemap/robots/OG image — **7.2**).
- [Source: prd.md:178] — FR-032: case-study title `[name] — devtools://hossam`, description from `problem` first sentence, OG per slug, `BreadcrumbList`.
- [Source: prd.md:267 (NFR-P3), 298 (NFR-SE3), 412 (OQ1 domain), 364 (P7 phase)] — injection discipline + open domain question.
- [Source: _bmad-output/planning-artifacts/architecture.md:45,178,238,369,382-390,489] — SEO approach, no external `<script>`/`dangerouslySetInnerHTML`, P7 phase, `next.config.mjs` metadata defaults, route tree (`robots.ts`/`sitemap.ts`/`generateMetadata` homes), NFR-S row.
- [Source: _bmad-output/project-context.md:82 (metadata API), 80-83 (server components), 178/288 (JSON-LD exception), 267 (no external script), 185/222/305 (no heavy dep), 153-156 (comments)] — guardrails.
- [Source: app/layout.tsx:1-41] — root layout exports `viewport` only today; add `metadata`. `lang="en" dir="ltr"` → `og:locale en_US`.
- [Source: app/(chrome)/work/[slug]/page.tsx:28-45] — `generateStaticParams` (featured only) + `generateMetadata` (title only today) to extend; not-found fallback to preserve.
- [Source: lib/content/profile.ts:34-71] — `name`/`role`/`location`/`socials`/`tagline` for `Person`+`WebSite` and default description.
- [Source: lib/content/projects.ts:6-35] — `slug`/`name`/`problem`/`featured` for case-study metadata + breadcrumbs.
- [Source: app/recruiter/page.tsx:6-7] — distinct recruiter title (use `title.absolute`).
- [Source: prds/prd-web-2026-05-25/addendum.md:575-590] — CSP starter (context for 7.5; not this story).

### Project Structure Notes
- New files: `lib/site.ts` (camelCase util module per the `lib/utils/` convention — actually a flat `lib/site.ts` is fine, matches `lib/keyboard.ts`), `components/json-ld.tsx` (kebab-case, named export). Both Server-safe (no `"use client"`).
- All route edits are additive to existing `metadata`/`generateMetadata` exports + one JSON-LD node each on `/` and `/work/[slug]`. No content/layout/UX changes.
- The single `dangerouslySetInnerHTML` lives only in `components/json-ld.tsx` — a repo-wide grep for it should return exactly one file after this story.
- `app/robots.ts`, `app/sitemap.ts`, `opengraph-image.tsx` are deliberately **not** created here (Story 7.2). `metadataBase` is set so 7.2's auto-injected `og:image` resolves to absolute URLs without rework.

## Dev Agent Record

### Agent Model Used
k2p6

### Debug Log References

### Completion Notes List
- Created `lib/site.ts` with env-overridable `SITE_URL` (OQ1 placeholder `https://hossammarey.com`), `SITE_NAME`, `SITE_TITLE_DEFAULT`, `SITE_DESCRIPTION_DEFAULT` (≤160), `OG_LOCALE`, and helpers: `siteUrl`, `firstSentence`, `clampLength`, `titleForSegment`, `absoluteTitleForProject`.
- Added `NEXT_PUBLIC_SITE_URL` to `.env.example` with comment explaining OQ1 (public non-secret URL).
- Updated `app/layout.tsx` with root `metadata` export: `metadataBase`, title template `%s — devtools://hossam`, default title/description, OG defaults, Twitter card.
- Updated 6 route files with bare-segment titles (template appends suffix): `app/(chrome)/page.tsx`, `work/page.tsx`, `perf/page.tsx`, `sources/page.tsx`, `console/page.tsx`, `recruiter/page.tsx` (uses `title.absolute`).
- Extended `app/(chrome)/work/[slug]/page.tsx` `generateMetadata` to return description from `firstSentence(project.problem)`, canonical, OG type `article`, and clamped title ≤60.
- Created `components/json-ld.tsx` — the single sanctioned `dangerouslySetInnerHTML` in the codebase, with justification comment and `<` escaping.
- Injected `Person` + `WebSite` JSON-LD on `/` and `BreadcrumbList` on `/work/[slug]`.
- All routes remain static (`○`/`●`) after build; no route flipped to dynamic.
- OG image bitmap is intentionally NOT set — that is Story 7.2 (`opengraph-image.tsx`).

### File List
- `lib/site.ts` (new)
- `lib/site.test.ts` (new)
- `components/json-ld.tsx` (new)
- `components/json-ld.test.tsx` (new)
- `app/(chrome)/work/[slug]/metadata.test.ts` (new)
- `app/layout.tsx` (updated)
- `app/(chrome)/page.tsx` (updated)
- `app/(chrome)/work/page.tsx` (updated)
- `app/(chrome)/perf/page.tsx` (updated)
- `app/(chrome)/sources/page.tsx` (updated)
- `app/(chrome)/console/page.tsx` (updated)
- `app/recruiter/page.tsx` (updated)
- `app/(chrome)/work/[slug]/page.tsx` (updated)
- `.env.example` (updated)

## Story Completion Status

- [x] Epic context analyzed (Epic 7 launch readiness; 7.1 = metadata + JSON-LD; 7.2 = robots/sitemap/OG image; 7.3 print; 7.5 CSP/Lighthouse/deploy)
- [x] Architecture requirements extracted (metadata API only, server components, no external script, owned-JSON-LD exception, metadataBase, route tree)
- [x] Existing code read (root layout, all route `metadata`/`generateMetadata`, profile + projects content shapes, recruiter distinct title)
- [x] File modifications identified (NEW lib/site.ts + json-ld.tsx + tests; UPDATE 7 route files + layout + .env.example; DO-NOT-CREATE robots/sitemap/og-image)
- [x] Reuse opportunities documented (profile/projects content, existing metadata exports, metadataBase-relative canonical/OG)
- [x] Testing requirements specified (generateMetadata direct-call length contracts, JsonLd parse + escape, site helper; don't test framework serialization/OG image)
- [x] Anti-patterns + guardrails listed (no client on metadata pages, single dangerouslySetInnerHTML, escape `<`, no SEO dep, no openGraph.images pre-7.2, NEXT_PUBLIC_ only for the non-secret URL)
- [x] Doc-vs-code variances surfaced (OG-image seam to 7.2, OQ1 domain placeholder, title-template approach, Person address granularity, omit empty email)
- [x] Scope boundaries vs Stories 7.2 / 4.3 / 6.1 stated

**Status:** ready-for-dev

Ultimate context engine analysis completed — comprehensive developer guide created.
