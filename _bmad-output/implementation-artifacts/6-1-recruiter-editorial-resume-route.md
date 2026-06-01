# Story 6.1: `/recruiter` editorial resume route

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a recruiter,
I want a flat editorial resume with no DevTools metaphor,
so that I can scan seniority and grab the resume in under a minute.

## Acceptance Criteria

1. **(FR-102 + UX-DR11 + NFR-A1 — editorial single column)** `/recruiter` renders an editorial single-column layout (`max-w-3xl`, centered) with **no DevTools chrome, no XP, no command palette, no gamification**. Top to bottom it contains: a header (`Profile.name` + one-sentence headline + 3 highlight bullets), a featured case-study card list (method / status / year / outcomes per card), a 3-column skills matrix (**no skill bars / no percentages**), a **Download Resume** primary CTA, and contact links. The page lives **outside** the `(chrome)` route group (it already does — `app/recruiter/page.tsx`), so no chrome renders.

2. **(NFR-A4 / NFR-A1 — semantics & landmark)** The page renders its own single `<main>` landmark (the root `app/layout.tsx` does **not** render `<main>` — only the `(chrome)` layout does), containing exactly one `<h1>` (`Profile.name`), real `<h2>` section headings, and meeting the same WCAG AA bar as the rest of the site. Every interactive element (CTA, contact links, any case-study link) is keyboard-reachable with a visible focus ring (`focus-visible:ring-1 focus-visible:ring-ring`).

3. **(FR-103 + A26/OQ5 — photo optional)** The layout works **with or without** a profile photo. No photo asset exists today (`public/images/` is absent), so render **without** a photo and do not add a placeholder image. If a photo is later supplied, it must use `next/image` with explicit `width`/`height` and `alt={Profile.name}`.

4. **(Tone — editorial register, UX-DR11 voice lock)** The visual register is editorial/magazine (Stripe-Docs direction): `font-title` (Fraunces) for the name/headings, generous line-height, single column, semantic tokens only. **No** DevTools idioms here (no method/status pills styled as HTTP chrome beyond the plain card metadata, no marquee, no hero shader, no "Hello, I'm Hossam!" hero, no skill bars — all are explicit anti-patterns).

5. **(Data-driven from `lib/content/*`)** All content is sourced from the typed content layer at build time (no client fetching, no hardcoded copy that duplicates `lib/content`):
   - Header name = `profile.name`; headline = `profile.tagline`; 3 highlight bullets = first 3 of `profile.metrics` rendered as `"{value}{suffix} {label}"` (e.g. "8+ Years shipped").
   - Case-study cards = `projects.filter((p) => p.featured)` (currently **3**: Buguard, Dark Atlas, Masheed Gate). Each card shows `project.name`, `project.method`, `project.status`, `project.year`, and `project.outcomes[]`. **Note the count is 3, not the FR-102 nominal "6"** — the featured set was deliberately reduced to 3 in Story 4.3; drive the list off `featured`, do not hardcode a count.
   - Skills matrix columns = the three existing `skillGroups` (names "Main skills" / "Basics" / "Tools"), each header = `group.name`, body = a flat list of `skill.name`. (See Dev Notes "Doc-vs-code variances" #2 for the `Skill.group` / "Primary/Secondary/Tools" naming mismatch.)
   - Download Resume CTA points at the existing static asset `/hossam-marey-resume.pdf` (present in `public/`).
   - Contact links = a `mailto:` **only when `profile.email` is non-empty** (it is `""` today → omit) plus each entry in `profile.socials[]` (currently GitHub only) as an external link. Render only links that exist; do not fabricate a LinkedIn URL. (See variance #4.)

6. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds and statically renders `/recruiter`.

## Tasks / Subtasks

- [x] **Task 1 — Build `<RecruiterResume>` editorial component (AC: 1, 2, 3, 4, 5)**
  - [x] Create `components/recruiter-resume.tsx` — **named export** `RecruiterResume`, presentational **Server Component** (no `"use client"`, no hooks, no event handlers). No props (reads `profile`, `projects`, `skillGroups` directly from `@/lib/content`).
  - [x] **Header:** one `<h1>` = `profile.name` in `font-title`; a one-sentence headline `<p>` = `profile.tagline`; a `<ul>` of 3 highlight bullets from `profile.metrics.slice(0, 3)` formatted `"{value}{suffix ?? ""} {label}"`.
  - [x] **Case-study section:** `<h2>` + a list of cards from `projects.filter((p) => p.featured)`. Reuse `@/components/ui/card` (`Card`, `CardHeader`, `CardTitle`, `CardContent`, …) and `@/components/ui/badge` (`Badge variant="outline"`) for the `method` / `status` / `year` metadata. Render `project.outcomes[]` as a short bullet list inside each card. (Featured entries currently carry placeholder `outcomes` like `"[PLACEHOLDER] Key outcome…"` — render them verbatim; do NOT invent real outcomes. See variance #3 and Story 4.3 mock-content note.)
  - [x] **Skills matrix:** `<h2>` + a responsive 3-column grid (`grid grid-cols-1 sm:grid-cols-3`) over `skillGroups`; per column a `<h3>` = `group.name` and a flat `<ul>` of `skill.name`. **No** progress bars, fills, levels, or percentages.
  - [x] **Download CTA:** a primary call-to-action linking to `/hossam-marey-resume.pdf`. Use `@/components/ui/button` `Button` with `asChild` wrapping an `<a href="/hossam-marey-resume.pdf" download>` (see Dev Notes "Download link & eslint").
  - [x] **Contact links:** render `mailto:${profile.email}` only if `profile.email !== ""`; map `profile.socials[]` to external `<a target="_blank" rel="noopener noreferrer">` with `link.label`. Keyboard-focusable, visible focus ring.
  - [x] Use **semantic tokens only** (`text-foreground`, `text-muted-foreground`, `text-lime`, `bg-card`, `border-hairline`, `bg-surface`) and **logical properties** (`ps-`/`pe-`/`ms-`/`me-`, `text-start`) — RTL is wired. No hardcoded hex/oklch, no `ml-`/`left-`.

- [x] **Task 2 — Wire the route page (AC: 1, 2)**
  - [x] Update `app/recruiter/page.tsx`: keep the default export (Next requirement) and the simple `metadata` title; render a single `<main className="mx-auto max-w-3xl px-4 py-…">` wrapping `<RecruiterResume />`. The page stays a **Server Component** (no `"use client"`).
  - [x] Keep `generateMetadata`/OG/JSON-LD **out** of this story — leave only the existing simple `<title>` (full per-route metadata is Story 7.1). A reasonable title: `"Hossam Marey — Senior Front-End Developer"` or keep the existing `"Recruiter Mode — devtools://hossam"`.
  - [x] Do **not** add the Recruiter Mode toggle, the `useRecruiterMode` hook, the chrome button, or the palette action here — that is **Story 6.2**. This story only builds the destination route; it is reachable by typing `/recruiter` directly.

- [x] **Task 3 — Tests (AC: 1, 2, 5)**
  - [x] Create `components/recruiter-resume.test.tsx` (colocated, Vitest + Testing Library). Assert: (a) exactly one `<h1>` with `profile.name`; (b) the headline (`profile.tagline`) renders; (c) one card per featured project (count = `projects.filter(p => p.featured).length`) and each card shows its name + at least one outcome; (d) three skills-matrix columns with the three `skillGroups[].name` headers and no element with `role="progressbar"`/percentage text; (e) the Download CTA is an anchor whose `href` is `/hossam-marey-resume.pdf`; (f) the GitHub social link renders as an external anchor with `rel="noopener noreferrer"`, and **no** `mailto:` link renders while `profile.email === ""`.
  - [x] Query by **role/label/text**, not `getByTestId`. Import the real `@/lib/content` data (don't over-mock) — these are pure typed modules.
  - [x] Do **not** test Tailwind class strings, Next framework behavior, or shadcn primitives.

- [x] **Task 4 — Verify & gate (AC: 6)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean.
  - [x] `yarn build` — confirm `/recruiter` builds/statically renders without error.
  - [x] `yarn dev` → open `/recruiter`: verify single-column editorial layout, one `<h1>`, 3 highlight bullets, the featured cards, the 3-column skills matrix (no bars), the Download Resume button downloads/opens `/hossam-marey-resume.pdf`, the GitHub link opens in a new tab. Confirm **no DevTools chrome** appears (no tab row, no XP bar, no mobile bottom nav). Confirm no console errors. Check `<640px` (single column stacks cleanly) and `<html dir="rtl">` (text/spacing flips via logical props). The `D` theme hotkey still works (it lives in the root `ThemeProvider`, which wraps `/recruiter` too).

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the `/recruiter` destination route and its editorial `<RecruiterResume>` component — header + headline + 3 highlight bullets, featured case-study cards, 3-column skills matrix (no bars), Download Resume CTA, contact links — sourced from `lib/content/*`, semantic + a11y-correct, **outside** the chrome group so no chrome renders.
- **IS NOT:**
  - **The dual Recruiter Mode toggle, the `useRecruiterMode` hook, the chrome lime-border button, the ⌘K Actions entry, and the chrome unmount/navigate logic** → **Story 6.2**. Do not add any toggle UI or storage I/O here. The route is reachable by direct URL only in this story.
  - **The print stylesheet** (`app/recruiter/print.css` / `@media print` light system) → **Story 7.3**. Do not add print CSS here.
  - **Per-route metadata / OG image / JSON-LD `Person`+`WebSite`** → **Story 7.1**. Keep only the existing simple `<title>`.
  - **The boss-level contact *form*** (typed prompts, validation-as-tests, stubbed submit) → **Stories 6.3 / 6.4**, and it lives on the `/sources` `contact.ts` preview, **not** on `/recruiter`. This story's "contact links" are plain mailto/social anchors, not a form.
  - **Suppressing the global Konami listener on `/recruiter`** → part of the **Story 6.2** "gamification gone" requirement. The `KonamiListener` is mounted in the root `app/layout.tsx`, so it is technically present on `/recruiter` today; leave it for 6.2. (It is invisible/inert until the sequence is typed, so it does not violate the editorial look in 6.1.)

### ⚠️ Doc-vs-code variances to surface (do NOT silently "fix" — these are Hossam's content decisions)
Per project-context, surface conflicts rather than resolve them. Four data-vs-spec gaps affect this story; the chosen defaults keep the dev unblocked:

1. **Featured card count: spec says "6", data has 3.** FR-102 / epic AC say "6 case-study cards"; Story 4.3 deliberately reduced the featured set to **3** (Buguard, Dark Atlas, Masheed Gate) for v1. **Default:** drive the card list off `projects.filter(p => p.featured)` (renders 3). If/when Hossam authors more featured projects, the list grows automatically — no code change.
2. **Skills matrix "Primary / Secondary / Tools from `Skill.group`" — no such field.** There is no `Skill.group`; the data is `skillGroups` (3 groups named "Main skills" / "Basics" / "Tools") and each `Skill` carries a `tier` (`"primary"`/`"secondary"`). **Default:** render the existing three `skillGroups` as the three columns, using `group.name` as the header. The label mismatch ("Main skills/Basics" vs "Primary/Secondary") is a content/renaming decision for Hossam — do not invent a new taxonomy or re-bucket skills.
3. **"3 highlight bullets" — no dedicated field.** `Profile` has no `highlights[]`. **Default:** derive 3 bullets from `profile.metrics.slice(0, 3)` (real data: "8+ Years shipped", "22 Projects shipped", "3 Talks & articles"). Do not add a schema field or author prose claims in this story; Hossam can add dedicated highlight copy later. Featured-card `outcomes` are still placeholders (`"[PLACEHOLDER]…"`) per Story 4.3 — render verbatim, do not fabricate.
4. **Contact links email/LinkedIn/GitHub — partial data.** `profile.email === ""` and `profile.socials` contains **only GitHub** (no LinkedIn). **Default:** render `mailto:` only when email is non-empty (so: omitted today), and render whatever is in `socials[]`. Email + LinkedIn are data gaps for Hossam to fill in `lib/content/profile.ts`; do not hardcode placeholder URLs.

### Open decision (reasonable default chosen; flag to Hossam)
- **Do the featured case-study cards link anywhere?** The case-study detail pages live at `/work/[slug]` **inside** the `(chrome)` group; linking there from `/recruiter` would re-mount the full DevTools chrome and break the "calm room" editorial escape (UX §"Recruiter Mode as a tonal pivot"). **Default for 6.1: cards are self-contained summaries and do NOT link into chrome routes.** If Hossam wants the cards clickable, that is a deliberate follow-up (likely deep-linking with Recruiter Mode persisted) and should be decided in/after Story 6.2.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/recruiter-resume.tsx` | **NEW** | Presentational **Server Component**, named export `RecruiterResume`. The editorial layout. Architecture-named (architecture.md:421, 487). |
| `app/recruiter/page.tsx` | **UPDATE** | Replace the stub body; render `<main className="mx-auto max-w-3xl …">` + `<RecruiterResume />`. Keep default export + simple title. Stays RSC. |
| `components/recruiter-resume.test.tsx` | **NEW** | Colocated; h1, headline, card count, skills columns, download href, contact links. |
| `lib/content/profile.ts` | **NO CHANGE (recommended)** | Email/LinkedIn are Hossam's to fill; not required for this story to ship. |

### Reuse — do NOT reinvent
- **`@/components/ui/card`** (`Card`, `CardHeader`, `CardTitle`, `CardContent`, `CardFooter`) — for the case-study cards. Already installed shadcn primitive.
- **`@/components/ui/badge`** (`Badge variant="outline"`) — for method/status/year metadata pills. Same precedent as `network-waterfall-row.tsx`.
- **`@/components/ui/button`** (`Button`, `asChild`) — for the Download Resume CTA wrapping an `<a>`.
- **`profile`, `projects`, `skillGroups`** from `@/lib/content` (barrel `lib/content/index.ts`) — typed, Zod-validated, build-time. Import from the barrel, never from `lib/data/index.ts` (legacy, scheduled for deletion).
- **Existing semantic tokens** in `app/globals.css`: `bg-card`, `text-card-foreground`, `text-foreground`, `text-muted-foreground`, `text-lime`, `border-hairline`, `bg-surface`, `font-title`, `font-mono`. Do not introduce new tokens.

### Architecture / project-context guardrails (must follow)
- **RSC by default.** `recruiter-resume.tsx` is presentational → Server Component (no `"use client"`, no hooks, no handlers). `app/recruiter/page.tsx` stays RSC.
- **The root layout renders no `<main>`.** Unlike `(chrome)` pages (which must NOT add a second `<main>` because `app/(chrome)/layout.tsx` provides it), `/recruiter` is outside that group, so **this page MUST render its own `<main>`** landmark. One `<h1>` per route; `<h2>`/`<h3>` for sections.
- **Named exports** for the component; `page.tsx` keeps its default export.
- **No client fetching** — all data imported at build time from `lib/content/*`.
- **Semantic tokens only**; **logical properties** for spacing/alignment (RTL wired). No hardcoded colors, no `ml-`/`mr-`/`left-`/`right-`.
- **External links** always `target="_blank" rel="noopener noreferrer"` (UX-DR6). Internal asset link (the PDF) is not a route — see below.
- **Type-only imports** use `import type` (`isolatedModules: true`). **No `import React`** (jsx runtime).
- **Import order:** external (`next/*`) → internal aliases (`@/components/*`, `@/lib/*`) → relative → side-effects; blank line between groups, alpha within.
- **Reduced motion:** this story ships **no animation** (static editorial page) — nothing to gate. If you add any reveal/transition, it MUST gate on `prefers-reduced-motion` via `useShouldAnimate()` (which would force a client boundary — prefer to keep 6.1 static and motion-free).

### Download link & eslint
- `eslint-config-next/core-web-vitals` enforces `next/link` over `<a href="/…">` **for routes**. `/hossam-marey-resume.pdf` is a **static asset**, not a route, so a plain `<a href="/hossam-marey-resume.pdf" download>` is correct and `next/link` is inappropriate. Wrap it in `<Button asChild>` for styling. If the lint rule still flags it, that is a false positive for a static file — add a single justified `// eslint-disable-next-line @next/next/no-html-link-for-pages` with a one-line reason (asset, not a page). Do not convert the PDF to a `next/link`.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom` (do NOT import `describe`/`it`/`expect`). `@/` alias works in tests.
- Colocate `recruiter-resume.test.tsx` next to source. Query by role/label/text.
- Import real `@/lib/content` modules (pure data) — mock external boundaries only; here there are none.
- For "no skill bars," assert the **absence** of `role="progressbar"` and of any `%` text in the skills region.
- For "no mailto while email empty," assert `queryByRole("link", { name: /email|mail/i })` (or a `href^="mailto:"` query) returns null with the current `profile.email === ""`.
- **Don't test:** Tailwind classes, shadcn primitives, Next framework behavior; verify the build + visual layout in Task 4, not units.

### Previous story / cross-cutting intelligence
- **Story 4.3** established the featured set (3 slugs) + `meta.mock` placeholders and the rule **"do not invent Hossam's real career content."** That holds here: featured `outcomes` are placeholders today — render them, do not author real ones. Its review repeatedly flagged (a) using the specified shadcn primitive instead of hand-rolling (use `Card`/`Badge`/`Button`), and (b) a11y attributes/semantics — carry both forward.
- **Story 3.2** (`principles-panel.tsx`) and **4.x** consistently keep presentational surfaces as RSC and reuse `lib/content` typed data — mirror that.
- The `(chrome)` layout (`app/(chrome)/layout.tsx`) is **`"use client"`** and owns chrome + the `<main>` + `AnimatePresence`. `/recruiter` shares **none** of that — confirm visually no chrome leaks (Task 4). Root layout (`app/layout.tsx`) DOES wrap `/recruiter` with `ThemeProvider`/`TooltipProvider`/`Toaster`/`KonamiListener` — so theme + `D` hotkey work, and (deliberately, until 6.2) the inert Konami listener is mounted.

### Git intelligence (recent commits)
- Recent HEAD: `2d6f050 feat(console): Claude Code-style design…`, `b509630 feat(console): konami unlock…`. Pattern: **Conventional Commits, one story per commit**, RSC page + reused primitives + colocated tests. Match it: `feat(recruiter): editorial resume route (story 6.1)`.

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router.** Static-first; `/recruiter` is a static RSC. No `params` here (not a dynamic route).
- **React 19.2.4** — no `forwardRef`; refs are props (not needed — no client component here).
- **Tailwind v4** — tokens in `app/globals.css`, `@theme inline`; semantic utilities only, no `tailwind.config.*`.
- **shadcn primitives** (`card`, `badge`, `button`) already vendored in `@/components/ui/*` — reuse, don't reinstall.
- **No new dependencies.** No state lib, no router/i18n, no motion needed.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:675-693] — Story 6.1 AC (editorial single column, photo-optional, a11y).
- [Source: _bmad-output/planning-artifacts/epics.md:101-105] — F12 Recruiter Mode FRs (FR-100..103); FR-102 layout contents, FR-103 dark-only.
- [Source: _bmad-output/planning-artifacts/epics.md:695-713] — Story 6.2 (toggle/unmount) = explicit scope exclusion.
- [Source: _bmad-output/planning-artifacts/architecture.md:206-210,394-397] — `app/recruiter/page.tsx` lives OUTSIDE `(chrome)`; chrome literally unmounts; `print.css` is later (7.3).
- [Source: _bmad-output/planning-artifacts/architecture.md:421,487] — `components/recruiter-resume.tsx` is the editorial layout component for F12.
- [Source: _bmad-output/planning-artifacts/architecture.md:462] — root layout owns global concerns on `/recruiter` (theme/fonts/toaster/Konami) except gamification (suppressed by Recruiter Mode → 6.2).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:57,187,222] — editorial/Stripe-Docs register, single column, typography-led, no DevTools metaphor.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:212,226] — anti-patterns: no skill bars/percentages, no "Hello I'm Hossam" hero, no Three.js.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:113-130,164] — P1 relief journey: editorial layout → Download Resume CTA visible; lime used as punctuation.
- [Source: _bmad-output/project-context.md:270-272] — Recruiter mode is a complete UI swap (not CSS hide); toggle in two places (→ 6.2); dark-only.
- [Source: lib/content/profile.ts] — `profile` (name, role, tagline, email `""`, socials [GitHub], metrics).
- [Source: lib/content/projects.ts] — `projects`; `featured` set = buguard / dark-atlas / masheed-gate; `outcomes[]` placeholders.
- [Source: lib/content/skills.ts] — `skillGroups` ("Main skills"/"Basics"/"Tools"), `Skill.tier`; **no** `Skill.group` field.
- [Source: lib/content/index.ts] — barrel exports for `profile`/`projects`/`skillGroups`.
- [Source: public/hossam-marey-resume.pdf] — Download Resume CTA target.
- [Source: app/recruiter/page.tsx] — current stub to flesh out.
- [Source: app/layout.tsx] — root layout renders NO `<main>`; wraps `/recruiter` with theme/toaster/Konami.
- [Source: app/(chrome)/layout.tsx] — the chrome `<main>`/`AnimatePresence`; `/recruiter` shares none of it.
- [Source: _bmad-output/implementation-artifacts/4-3-statically-generated-case-study-detail.md] — featured set (3), "don't invent content," reuse-primitive review pattern.

### Project Structure Notes
- `components/recruiter-resume.tsx` matches the architecture-named component (architecture.md:421/487) and the kebab-case + named-export convention.
- `app/recruiter/print.css` and the toggle hook/`useRecruiterMode` are intentionally **not** created here (Stories 7.3 / 6.2).
- No new dependencies; no state lib, router, or i18n additions; no motion.

## Dev Agent Record

### Agent Model Used

kimi-for-coding/k2p6

### Debug Log References

### Completion Notes List

- ✅ Built `components/recruiter-resume.tsx` as a presentational Server Component (named export, no "use client"), importing `profile`, `projects`, `skillGroups` from `@/lib/content`.
- ✅ Header renders `<h1>` with `profile.name`, tagline paragraph, and 3 highlight bullets from `profile.metrics.slice(0, 3)`.
- ✅ Featured case-study section renders 3 cards (Buguard, Dark Atlas, Masheed Gate) using shadcn `Card`/`Badge` primitives with method/status/year metadata and outcome bullet lists.
- ✅ Skills matrix renders 3-column responsive grid over `skillGroups` with group names as `<h3>` and flat skill lists — no progress bars, percentages, or levels.
- ✅ Download Resume CTA uses `Button asChild` wrapping `<a href="/hossam-marey-resume.pdf" download>`.
- ✅ Contact links conditionally render `mailto:` only when `profile.email !== ""` (omitted today) and external social links with `target="_blank" rel="noopener noreferrer"`.
- ✅ `app/recruiter/page.tsx` updated to render `<main className="mx-auto max-w-3xl px-4 py-16">` wrapping `<RecruiterResume />`; kept as RSC with simple metadata title.
- ✅ Colocated tests in `components/recruiter-resume.test.tsx` — 8 tests covering h1, headline, featured cards, skills matrix (no progress bars), download href, social link rel, and absent mailto.
- ✅ All gates green: `yarn typecheck`, `yarn lint`, `yarn test:run` (261 passed), `yarn format`, `yarn build` (statically renders `/recruiter`).

### File List

- `components/recruiter-resume.tsx` (new)
- `components/recruiter-resume.test.tsx` (new)
- `app/recruiter/page.tsx` (updated)

## Story Completion Status

- [x] Epic context analyzed
- [x] Architecture requirements extracted
- [x] Content-model realities (profile/projects/skills) extracted
- [x] File modifications identified (UPDATE vs NEW)
- [x] Reuse opportunities documented
- [x] Testing requirements specified
- [x] Anti-patterns and guardrails listed
- [x] Doc-vs-code variances surfaced (count, skills labels, highlights, contact data)
- [x] Scope boundaries vs Stories 6.2 / 6.3 / 6.4 / 7.1 / 7.3 stated

**Status:** review
**Ultimate context engine analysis completed — comprehensive developer guide created**
