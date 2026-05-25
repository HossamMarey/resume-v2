---
title: "devtools://hossam — Resume + Portfolio PRD"
project: web
owner: Hossam Marey
status: final
created: 2026-05-25
updated: 2026-05-25
mode: fast-path
inputs:
  - file:docs/plan.md (pending rewrite — IA + features extracted)
  - file:docs/design-system.md (CANONICAL — palette, typography, content model)
  - file:lib/data/index.ts (DEPRECATED — to migrate to lib/content/*)
  - file:_bmad-output/project-context.md (142-rule agent ruleset)
---

# devtools://hossam — Resume + Portfolio PRD

## 1. Overview

Personal resume + portfolio site for **Hossam Marey**, Senior Front-End Developer with ~10 years of experience across React/Next.js and Vue/Nuxt ecosystems. The site is themed `devtools://hossam` — every navigation, content layout, and interaction borrows from the browser DevTools metaphor (Elements / Network / Console / Performance / Sources tabs). A toggleable **Recruiter Mode** collapses the gamification into a flat editorial resume for time-pressed reviewers.

The site is a **public signaling artifact** built before an active job hunt — it must work for both recruiters (10-second scan → "interview yes/no") and engineering managers (deep technical credibility check → "can he build what I need?"). The DevTools metaphor is the differentiator: it demonstrates senior front-end craft (interaction design, performance discipline, a11y rigor) in the medium itself, not just in claims.

**Concept positioning:** "A senior front-end portfolio that *behaves* like the tool senior front-end devs live in." The metaphor is consistent, defensible, and rewards exploration without punishing skimmers (Recruiter Mode).

## 2. Goals

### Primary goals

- **G1.** Land Senior / Staff Front-End interviews at target companies during the 2026 job hunt cycle. [ASSUMPTION: target = product companies + funded scale-ups + premium agencies; not a specific company list]
- **G2.** Serve as the canonical "share link" replacing LinkedIn / resume PDF in cold outreach, applications, and referral intros.
- **G3.** Demonstrate senior FE craft *in the artifact itself* — interaction polish, perf budget discipline, a11y rigor, considered taste — at a quality level that justifies the senior title.

### Secondary goals

- **G4.** Be defensibly *not* a template. Recruiters and EMs see hundreds of portfolios; this one is memorable on first scan.
- **G5.** Stay one-person maintainable. No backend, no CMS, no infra. Content lives in typed files, deploys are zero-config Vercel.
- **G6.** Be ship-able in **≤3 weeks of evenings/weekends** from PRD sign-off. v1.1 work (real contact backend, more case studies) happens after launch.

### Non-goals

- Not a blog platform. No CMS, no MDX content pipeline in v1.
- Not a SaaS demo. Demonstrates portfolio-quality work, not a productized service.
- Not multi-author or multi-tenant.
- Not a generative playground. No live LLM features, no embedded sandboxes beyond the Console REPL.

## 3. Personas & Audience

### P1 — The Recruiter (dominant audience)

Engineering / technical recruiter at a target company. Reviews 50–200 candidates per role. Spends 30–90 seconds per portfolio before deciding "screen / pass."

**Wants:** clear title, years of experience, current/last company, tech-stack match against the open role, links to case studies (does not read them), a way to download the resume PDF or copy contact, a "is this person senior?" gut-feel signal.

**Does not want:** to learn a new UI, to scroll a long story, to play games, to figure out where contact info is.

**Implication for the site:** see UJ-1. Recruiter Mode must be reachable in ≤2 clicks from any route; resume PDF must be one click from `/`.

### P2 — The Engineering Manager (substantial audience)

EM / Staff+ engineer doing the deeper second-look after a recruiter passes the candidate forward. Looks for technical credibility: real systems built, real trade-offs articulated, real decisions explained.

**Wants:** case studies with the *why*, not just the *what*. Tech-stack honesty (what you actually used vs. what was on the team). Failed-or-archived projects flagged honestly. Interaction craft visible in the artifact. Reasonable performance — pages don't jank, animations don't gratuitously block content.

**Does not want:** marketing copy ("passionate developer"), tutorial-finishing screenshots labeled as "projects," skill bars/percentages, polished-but-empty "experimental" features.

**Implication for the site:** see UJ-2. Network tab is the load-bearing surface; case studies follow problem → decisions → outcomes; archived projects shown with `archived` status, not hidden.

### P3 — The Curious Peer (long-tail audience)

Other senior FE devs reaching the site via word-of-mouth, conference talks, social shares. Stays longer, explores easter eggs, likely to share if delighted.

**Wants:** craft details — the Konami code, the REPL commands, the waterfall metaphor done right, the type system on display.

**Implication for the site:** see UJ-3. Easter eggs serve P3 without obstructing P1/P2; XP bar must be hidable; Konami unlock must be discoverable but not gating.

## 4. Information Architecture

Seven routes, all under a persistent DevTools chrome (IA-C: chrome stays mounted across tab switches; route transitions animate, do not full-reload).

| Route | DevTools tab | Purpose | Primary persona |
|---|---|---|---|
| `/` | **Elements** | Hero identity, principles, stack marquee | P1, P3 |
| `/work` | **Network** | Project list rendered as request waterfall (method, status, size, time) | P2 |
| `/work/[slug]` | **Network → request detail** | Case study: problem, role, decisions, outcomes, links | P2 |
| `/console` | **Console** | Real REPL (`help`, `whoami`, `projects`, `contact`, `theme`, `download resume`, Konami-locked `experimental`) | P3 |
| `/perf` | **Performance** | Stats dashboard — score rings (years shipped, projects, talks) + "page weight" budget viz | P3 |
| `/sources` | **Sources** | File tree (`resume.pdf`, `articles/`, `contact.ts`) + preview pane; contact = boss-level form | P1, P2 |
| `/recruiter` | _(no chrome)_ | Flat editorial resume — photo, headline, bullets, 6 projects w/ metrics, skills, contact links | P1 |

**Persistent chrome contains** (top to bottom): identity strip (name + role + Recruiter Mode toggle button right-aligned), tab nav row (the 5 DevTools tabs), XP bar (top-right of identity strip, hidden in Recruiter Mode and under `prefers-reduced-motion`).

**Mobile (`<640px`)** chrome collapses to a bottom tab bar with safe-area-inset-bottom respected. Identity strip becomes a single-row top with Recruiter Mode in a hamburger or the ⌘K palette.

## 4.5 User Journeys

> Each UJ names a persona by exact label from §3 and walks a representative session. UJs drive prioritization decisions (e.g., FR-002 placing Recruiter Mode in chrome rather than buried in a menu serves UJ-1).

### UJ-1 — Recruiter 30-second scan (persona P1)

1. Lands on `/` from a LinkedIn DM or cover-letter link. Sees **name + role + tagline** above the fold; sees a chrome with unfamiliar tabs (Elements / Network / …) and a "Recruiter Mode" button labeled clearly.
2. Clicks **Recruiter Mode** (≤2 seconds from arrival). Chrome unmounts; flat editorial layout loads with photo, headline, 3 highlight bullets visible without scroll.
3. Scrolls past 6 case-study cards, eye-tracks the method + status + year + outcomes line on each card.
4. Clicks **Download Resume** in the primary CTA position. PDF downloads.
5. Tab closes. Total time on site: 30–60 seconds. Outcome: pass-to-EM decision made.

**Success:** Resume PDF download fires within 60 seconds of landing. **Failure:** P1 cannot find Recruiter Mode within 10 seconds and bounces, or P1 finds the chrome alienating and bounces before toggling.

### UJ-2 — Engineering Manager case-study deep dive (persona P2)

1. Lands on `/` after a recruiter-forwarded link. Skims the hero, sees the principles marquee, and notes the DevTools metaphor — credible.
2. Clicks the **Network** tab. Sees the waterfall of all 22 projects. Filters by `status: shipped` to remove ongoing/archived noise.
3. Clicks the **MasheedGate** row. Layout-shared transition opens the case-study detail. Reads **Problem → Role → Decisions → Outcomes** in order.
4. Notes the `stack` chips, clicks the "live" link in a new tab, returns. Hits the prev/next pager to read **Tamincom Refactor**.
5. After reading 2–3 case studies, opens the **⌘K palette** out of curiosity, sees the navigate/projects/socials groups, closes.
6. Returns to LinkedIn / Slack with a screening signal. Total time: 5–10 minutes.

**Success:** P2 reads ≥2 case studies and finds at least one "Decisions" entry that articulates a real trade-off (not marketing). **Failure:** every case study reads as feature-list summary with no trade-off rationale.

### UJ-3 — Peer console + Konami exploration (persona P3)

1. Lands on `/` from a Twitter/HN share. Skips the hero, looks for "the gimmick."
2. Notices **Console** tab, clicks. REPL is real: types `help`, sees the command list, types `whoami`, gets a Hossam-flavored response.
3. Types `projects --tag react` to filter project list. Notices XP bar incrementing in the chrome. +5 per command lands.
4. Closes REPL. Tries the Konami sequence (`↑↑↓↓←→←→BA`) somewhere on the site. Chrome flashes lime; "Experimental" command appears in `⌘K` palette and REPL `help` output.
5. Runs `experimental`, sees the unlocked panel content. Screenshots and shares.

**Success:** P3 unlocks Konami without a hint, shares the experience. **Failure:** REPL commands feel canned, Konami unlock leads to a placeholder, P3 leaves disappointed.

## 5. Features

### §5.0 Voice & Tone

> The PRD compresses interaction craft into FR tables, but the **feel** of devtools://hossam is load-bearing and must survive the compression. These voice rules are non-negotiable in implementation.

- **Hero `/` (Elements)** — the principles section is not a card marquee; it is a **scroll-revealed "Computed Styles" panel** that animates in like a real DevTools cell (label-left, value-right, hairline-grid background). The aesthetic borrows from the Computed tab of Chrome DevTools verbatim.
- **Contact form (Sources / contact.ts)** — frame it as **fighting a terminal boss**, not filling a form. The cadence is dramatic: each prompt arrives with a slight typewriter delay, validation results render as passing/failing test output (`✓ email_format` / `✗ message_length: 12 < 20`), submit feels like landing the killing blow. Sonner toast on success reads more like a system log line than a marketing confirmation.
- **Console REPL** — every command has personality. `whoami` returns more than a printout — it returns Hossam's actual voice (one-liner tagline, then a short story line). `theme light` errors with a deadpan refusal. `download resume` prints a one-line ASCII descent before triggering the file. Unknown commands suggest the nearest valid one (`did you mean: 'projects'?`).
- **Recruiter Mode** — the inversion is total. No chrome, no animations beyond the scroll-reveal of cards, no gamification artifacts. **Tone is editorial Sunday newspaper, not landing page** — left-aligned, generous line-height, content speaks for itself. No "Hi, I'm Hossam!" hero. Just: name, headline, three bullets, the projects, the contact, done.
- **Network waterfall** — the rows should feel like reading a DevTools Network panel during a real page load. Monospace typography in the data columns, hairline grid, status badges that look like actual DevTools status pills. Hovering a row reveals subtle metadata (timing tooltip), not a marketing card-flip.
- **404 / 500** — if reached, render with the same DevTools voice (`net::ERR_NAME_NOT_RESOLVED` flavor). Out of scope for v1 (default Next.js shells acceptable); revisit v1.1.

Implementation rule: when an FR conflicts with a voice rule above, raise it — voice wins unless there's a hard accessibility or performance reason.



> Functional requirements are nested under each feature with stable IDs (FR-NNN). IDs are stable across PRD edits; new features append.

### F1 — Persistent DevTools Chrome

- **FR-001.** Chrome renders on every route except `/recruiter`. Tab switches animate via `motion/react` `AnimatePresence mode="wait"` between page sections; chrome itself does not re-mount.
- **FR-002.** Identity strip shows `name` + `role` (from `Profile` content) left-aligned. Right-aligned: Recruiter Mode toggle button (`≥sm` breakpoint), XP bar (hidden when Recruiter Mode active or `prefers-reduced-motion: reduce`).
- **FR-003.** Tab row shows all 5 DevTools tabs (`Elements`, `Network`, `Console`, `Performance`, `Sources`) with the active tab indicated by `border-b-2 border-lime`. Inactive tabs `text-muted-foreground border-b-2 border-transparent`.
- **FR-004.** Mobile chrome: bottom tab bar replaces the desktop tab row. `env(safe-area-inset-bottom)` respected. Identity strip stays at top single-row.

### F2 — Elements (`/`) — Hero & Principles

- **FR-010.** Hero renders `name` (H1, `clamp(2rem, 10vw, 6rem)`), `role`, `tagline`, and a primary "Inspect me" CTA that opens the ⌘K palette.
- **FR-011.** Below hero: principles marquee — 4 cards from `Profile.principles[]`. Default content [ASSUMPTION]: **Performance is a feature** / **Accessibility is non-negotiable** / **DX compounds** / **Mentor the next senior**.
- **FR-012.** Stack marquee — animated horizontal scroll of primary tech logos/labels from `Profile.skills` or a curated subset. Pauses on hover. Respects `prefers-reduced-motion` (replaced with a static grid).
- **FR-013.** Hero background combines `.bg-grid` (48px lines @4% white) and `.bg-scan` (4px scanlines @2%) at `opacity-40`/`opacity-60`. Dark-only.

### F3 — Network (`/work`) — Project Waterfall

- **FR-020.** `/work` renders all projects from `lib/content/projects.ts` (Zod-validated) as a request-waterfall table. Desktop grid columns: `method | name | type | status | size | time | waterfall-bar`. Mobile: card with method + name + status row, then waterfall bar below.
- **FR-021.** Method column is a colored badge: `GET` (cyan), `POST` (orange), `PUT` (orange), `PATCH` (purple). The HTTP method is **decorative metaphor, not semantic typing** — chosen for the waterfall joke (a project list rendered as a network panel). A loose rule of thumb is used during content authoring (GET = ongoing product work, POST = new launches, PUT = rewrites/refactors, PATCH = small / contract work), but no FR depends on the mapping being interpreted literally. If a reviewer reads the column and thinks "that's not what HTTP methods mean," that is the intended reading.
- **FR-022.** Status column renders status pill with HTTP-style code: `200 shipped`, `201 ongoing`, `410 archived`. Color: `--status-ok` / `--status-warn` / `--status-err` from tokens.
- **FR-023.** Size column renders the `size` label (e.g., "12.4 MB", "894 KB") — the bytes are a metaphor for project impact/scope, not actual page weight. `sizeWeight` field (0–1) drives the visual bar fill.
- **FR-024.** Time column renders `time` (e.g., "8 mo", "2 yr"). `timeWeight` drives waterfall bar width; `startOffset` drives bar position. Bars use `transform: scaleX()` only, never `width` (perf rule).
- **FR-025.** Clicking a row navigates to `/work/[slug]` with a layout-shared transition (the row "opens" into the detail view).
- **FR-026.** Filter chips at top of `/work`: by `method`, by `status`, by `year`. Multi-select. URL-persisted via search params for shareable filtered views.
- **FR-027.** Empty filter state: shows "No requests match your filter" with a "Clear filters" button.

### F4 — Network detail (`/work/[slug]`) — Case Study

- **FR-030.** Case study route is statically generated via `generateStaticParams` from the content file. No client-side fetching.
- **FR-031.** Layout: top breadcrumb (`Network > [project name]`), then case study sections in order: **Problem** (1–3 paragraphs) → **Role** (1 paragraph, what *you* specifically did vs. the team) → **Stack** (chips from `stack[]`) → **Decisions** (bulleted, each with brief rationale) → **Outcomes** (bulleted, ideally with before/after numbers) → **Links** (live, code, design — filtered to non-null).
- **FR-032.** Metadata: `<title>` `[project name] — devtools://hossam`, `description` derived from `problem` first sentence, OG image per slug. JSON-LD `BreadcrumbList`.
- **FR-033.** Navigation between case studies via prev/next links in the footer of each detail page, ordered by file declaration order in `lib/content/projects.ts`.
- **FR-034.** v1 case-study scope: **6 case studies** authored fully, remaining projects listed in the waterfall but link to the source repo / live URL only with no detail page. [ASSUMPTION: 6 is enough to demonstrate range without becoming a writing project that delays launch; revisit if Hossam wants 8–10]

### F5 — Console (`/console`) — REPL

- **FR-040.** `/console` renders a terminal-style REPL backed by a real `<input>` (a11y: real input, not contenteditable). History buffer navigable with ↑/↓ arrows.
- **FR-041.** Command registry (v1): `help`, `whoami`, `projects`, `contact`, `theme`, `clear`, `download resume`, and Konami-locked `experimental`. Unknown commands print `command not found: <name>. Type 'help' for available commands.`
- **FR-042.** Command outputs:
  - `help` → list all commands with one-line descriptions.
  - `whoami` → renders `Profile.name`, `role`, `location`, `email`, `years`.
  - `projects` → numbered list of all projects with `[method] name (status) — year`. `projects --shipped` filters; `projects --tag react` filters by stack.
  - `contact` → either prints contact info inline OR navigates to `/sources` contact form (TBD; [ASSUMPTION: navigate, since the boss-form is the showcase]).
  - `theme` → `theme dark` / `theme light` (light errors with "Site is dark-only. The vibe is intentional.").
  - `download resume` → triggers PDF download from `/public/hossam-marey-resume.pdf`.
  - `clear` → clears history buffer.
  - `experimental` (locked) → reveals Konami-unlocked content [ASSUMPTION: a "what I'm building next" panel; concrete content TBD].
- **FR-043.** Each successful command grants +5 XP (FR-074).
- **FR-044.** REPL is fully keyboard-accessible. Pasting multiline strings is supported but only the first line executes (rest is ignored with a notice).

### F6 — Performance (`/perf`) — Stats

- **FR-050.** Renders score rings (à la Lighthouse) for: **years shipped**, **projects shipped**, **talks/articles**, **mentees** [ASSUMPTION: numbers from `Profile.metrics[]`; if mentees/talks are zero, those rings are omitted, not zeroed].
- **FR-051.** Below rings: a "page weight budget" visualization showing the actual site's bundle composition (HTML / JS / CSS / images / fonts). Computed at build time and embedded as static JSON.
- **FR-052.** Optional easter-egg sub-section: live Lighthouse score from the most recent CI run, fetched at build via Vercel API. [ASSUMPTION: defer to v1.1 unless trivially cheap to add]

### F7 — Sources (`/sources`) — File Tree + Contact

- **FR-060.** Left pane (desktop `≥md`): file tree with entries `resume.pdf`, `articles/`, `talks/`, `contact.ts`. [ASSUMPTION: `articles/` and `talks/` are empty in v1 with a "Coming soon" placeholder — Hossam doesn't have a published list yet]
- **FR-061.** Right pane: preview of selected file. `resume.pdf` shows embed + download button. `contact.ts` renders the boss-level form (F8).
- **FR-062.** Mobile (`<md`): single-pane stack — tree above, preview below.

### F8 — Contact "Boss-Level" Form

- **FR-070.** Form lives under `/sources` `contact.ts`. UI is a typed-terminal sequence: each field prompts inline, validates as you type, renders validation result as a passing test (`✓ email format`, `✓ message length ≥ 20 chars`).
- **FR-071.** Fields: `name` (required, ≥2 chars), `email` (required, RFC-compliant), `subject` (optional, ≤120 chars), `message` (required, ≥20 chars, ≤2000 chars). Zod schema in `lib/schemas/contact.ts`.
- **FR-072.** Submit: stubbed in v1. Returns faked success after 600–1200ms (randomized). Shows `sonner` toast: "Message queued — Hossam will reply within 2 business days." Awards +50 XP (FR-074). [ASSUMPTION: stubbed v1 is deliberate per resolved decision; v1.1 wires Resend via Next.js server action]
- **FR-073.** Form is fully keyboard-navigable. ↵ advances to next field if current is valid; ↑ goes back. Esc clears. Errors render as failing tests (`✗ email format — looks malformed`).

### F9 — XP & Gamification System

- **FR-074.** XP increments on the following actions, persisted in `localStorage["hm_xp_v1"]`:
  - Visit a new tab for the first time: +10
  - Open a project detail: +15
  - Run a successful REPL command: +5
  - Submit the contact form: +50
- **FR-075.** XP capped at **100**. Increments idempotent per-action-per-session (visiting Network 5× still only grants +10 the first time). Property-tested with `fast-check`.
- **FR-076.** XP bar renders in chrome (FR-002). Spring animation on width via `motion/react`. Hidden under Recruiter Mode and `prefers-reduced-motion`.
- **FR-077.** XP toast (small lime pill rising from the bar) fires on each XP grant. Hidden under `prefers-reduced-motion` (XP still increments silently).
- **FR-078.** Cross-component bus is `window.dispatchEvent(new CustomEvent("hm:xp", { detail: { delta, reason } }))`. No state-management library.

### F10 — Konami Code Easter Egg

- **FR-080.** Keydown sequence buffer detects `↑↑↓↓←→←→BA` (case-insensitive on letters). 2-second timeout between keys resets the buffer.
- **FR-081.** Sequence detection MUST skip keypress targets that are `<input>`, `<textarea>`, or `[contenteditable="true"]` (match `theme-provider.tsx` `ThemeHotkey` pattern).
- **FR-082.** On unlock: persists `"konami"` into `localStorage["hm_unlocks_v1"]` (array). Renders a lime glow pulse on chrome. Reveals an `experimental` command in the REPL (FR-042). Surfaces an "Experimental" entry in the ⌘K palette under Actions.
- **FR-083.** Recruiter-mode footer includes an explicit "🎮 Show experimental" button for keyboard/discovery parity — clicking it sets the same unlock.

### F11 — ⌘K Command Palette

- **FR-090.** `cmdk` palette opens on `⌘K` (macOS) / `Ctrl+K` (others). Also opens from the "Inspect me" CTA (FR-010) and the chrome's keyboard-shortcut hint.
- **FR-091.** Palette has four groups:
  - **Navigate** — `Elements`, `Network`, `Console`, `Performance`, `Sources`, `Recruiter`
  - **Projects** — every entry from `lib/content/projects.ts` (jump to `/work/[slug]`)
  - **Actions** — `Toggle Recruiter Mode`, `Download Resume`, `Copy Email`, `Toggle Theme` (errors with "Site is dark-only")
  - **Socials** — entries from `Profile.socials[]` (open in new tab)
- **FR-092.** Fuzzy search across all groups simultaneously. Result order: exact match > prefix > fuzzy. Keyboard ↑/↓/↵ navigation. Esc closes.
- **FR-093.** Palette respects `prefers-reduced-motion` — no scale/blur animation, just opacity.

### F12 — Recruiter Mode

- **FR-100.** Toggle exposed in **two** places: a chrome button (right of identity, `≥sm`) AND a ⌘K palette action under **Actions**. Both read/write `localStorage["hm_recruiter_v1"]` (boolean).
- **FR-101.** When ON, navigation redirects to `/recruiter` and persists. Chrome (FR-001) is unmounted entirely (not just hidden via CSS). XP bar, Konami, REPL hints, palette XP-grant — all unmounted.
- **FR-102.** `/recruiter` layout (flat editorial): header photo + name + headline (one sentence), 3 highlight bullets, 6 case-study cards with method/status/year/outcomes, skills matrix (3 columns: Primary / Secondary / Tools), Download Resume button (primary CTA), contact links (email, LinkedIn, GitHub).
- **FR-103.** Recruiter Mode is the only route that allows-but-doesn't-require dark/light. [ASSUMPTION: stay dark-only for v1; if recruiters complain about printability, revisit a light variant of `/recruiter` only]
- **FR-104.** Toggling OFF returns the user to `/` with full chrome restored.

### F13 — Theme & Hotkeys

- **FR-110.** `next-themes` provider mounted at root with `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}` (per resolved dark-only decision), `disableTransitionOnChange`.
- **FR-111.** `D` key (no modifiers) toggles theme — currently a no-op since site is dark-only. Keep the hotkey infrastructure for future light-mode/Recruiter-Mode-light flexibility; toast "Site is dark-only" on press.
- **FR-112.** Hotkey detection skips inputs/textareas/contenteditable (existing `ThemeHotkey` pattern).

## 6. Non-Functional Requirements

### Performance

- **NFR-P1.** Lighthouse ≥95 across all four categories (Performance, Accessibility, Best Practices, SEO) on the deployed Vercel production URL, measured on mobile and desktop emulations. Real budget — CI fails if any category drops below 95.
- **NFR-P2.** Interaction response <100ms (input → visible change). Animations sustain 60fps; jank budgeted only on the cold-cache first load.
- **NFR-P3.** No external `<script>` tags. No external `<link rel="stylesheet">`. Fonts via `next/font/google` only.
- **NFR-P4.** Adding any dependency >50KB gzipped requires explicit approval. No Three.js, no Lottie, no analytics SDKs beyond Vercel's built-in.
- **NFR-P5.** Animation: `transform` and `opacity` only. Never `top`/`left`/`width`/`height`. Scroll reveals use `useInView({ once: true })`.
- **NFR-P6.** Code-split heavy routes (`/console`, `/work/[slug]`, `/sources`) via `dynamic(() => import(...))`.

### Accessibility

- **NFR-A1.** WCAG 2.1 AA compliance across all routes. Lime-on-Obsidian only used for large text (≥18pt, or ≥14pt bold) or icons — never body copy.
- **NFR-A2.** Full keyboard navigation. Every interactive element reachable via Tab. Focus rings (`focus-visible:ring-1 focus-visible:ring-ring`) visible.
- **NFR-A3.** `prefers-reduced-motion: reduce` gates every animation. No exceptions. XP bar fill still updates (instant); toasts hidden; tab transitions instant.
- **NFR-A4.** Semantic HTML — one `<h1>` per route, real `<nav>`, `<article>` for case studies, `<button>` not `<div onClick>`.
- **NFR-A5.** `alt` on every `<img>` (empty for decorative). `next/image` always used; never `<img>`.
- **NFR-A6.** Recruiter Mode meets all accessibility requirements *plus* prints clean (CSS `@media print` — hide chrome, show black-on-white version of `/recruiter`). **Trade-off accepted:** because the site is dark-only, `/recruiter` ships with a parallel light-print color system in `@media print` (addendum §6). This is a deliberate complexity cost paid to keep the rest of the site visually unified.

### Responsiveness

- **NFR-R1.** Breakpoints: mobile-first. Critical thresholds at `sm` (640px), `md` (768px), `lg` (1024px). All routes usable below 360px width.
- **NFR-R2.** Network waterfall has a dedicated mobile card layout (FR-020); desktop grid does not auto-degrade.
- **NFR-R3.** REPL stays usable on mobile (touch keyboard appears on focus; ↑/↓ history accessible via on-screen buttons under the input on mobile only).

### SEO

- **NFR-S1.** Every route has `<title>` (≤60 chars), meta `description` (≤160 chars), canonical URL, OG image.
- **NFR-S2.** JSON-LD `Person` schema on `/`. `BreadcrumbList` on `/work/[slug]`. `WebSite` schema on `/`.
- **NFR-S3.** `robots.txt` + `sitemap.xml` generated by Next.js metadata APIs.
- **NFR-S4.** Per-case-study OG images generated via Next.js `opengraph-image.tsx` (dynamic). [ASSUMPTION: dynamic OG; if too complex, fall back to a single static OG per case study]

### Security

- **NFR-SE1.** No client-side secrets. Contact form is stubbed in v1 (no env vars). v1.1 wires Resend via Next.js server action with `RESEND_API_KEY` (server-only).
- **NFR-SE2.** Zod validates the contact form on submit — never trust HTML5 validation alone.
- **NFR-SE3.** `dangerouslySetInnerHTML` forbidden except for owned/sanitized MDX (none in v1).
- **NFR-SE4.** CSP headers via `next.config.mjs` `headers()` when going live. [ASSUMPTION: CSP can be a v1 launch-day add; defer until day before deploy]

### Operational

- **NFR-O1.** Deploy target: **Vercel** (zero-config). Branch previews automatic. CI relies on Vercel's build.
- **NFR-O2.** Yarn is the package manager. `yarn.lock` authoritative. Never `npm install`.
- **NFR-O3.** Pre-commit gate: `yarn typecheck && yarn lint && yarn test:run && yarn format`. Hook configured via `husky` or `simple-git-hooks`. [ASSUMPTION: add husky in build phase; not yet installed]
- **NFR-O4.** Persistence: `localStorage` only, versioned keys (`hm_xp_v1`, `hm_unlocks_v1`, `hm_visits_v1`, `hm_recruiter_v1`). Graceful degradation if `localStorage` unavailable (in-memory state, no crash).
- **NFR-O5.** UI primitives via **shadcn 4.8.0** (`radix-nova` style preset) on **Tailwind v4.2.1**. No alternative component library; shadcn primitives are vendored into `components/ui/*` and reused before any new component is hand-rolled. Replacing or adding a parallel primitive system requires explicit approval.

## 7. Content Strategy

### 7.1 Existing content inventory (from `lib/data/index.ts`)

- **4 companies** of work experience (Buguard, MasheedGate, Inovola, Besteam) with 8 nested projects.
- **3 freelance** companies (PickPath/Commutrics, Grand Community, Alsakn) with 4 projects.
- **2 side-project groups** (Eazy.to, Trend.coupons).
- **22 projects** in the flat gallery (overlaps with company-nested projects — needs dedup).
- **28 skills** across 3 tiers (Main, Basics, Tools).

### 7.2 Missing — must be authored

- **Profile identity:** name, location, email, socials, tagline, principles[], metrics[].
- **Per-project content (for case studies):** `slug`, `method`, `status`, `statusCode`, `size`, `sizeWeight`, `time`, `timeWeight`, `startOffset`, `problem`, `role`, `decisions[]`, `outcomes[]`, `links[]`.
- **Resume PDF** at `/public/hossam-marey-resume.pdf`.

### 7.3 v1 content cut

- **All 22 projects** (deduplicated) appear in the `/work` waterfall.
- **6 projects** get full case studies. **Default picks (revised after content-fidelity audit):** Dark Atlas, MasheedGate E-commerce, Tamincom Refactor, Zrealtors, Commutrics, Eazy.to. Rationale: these 6 have the most pre-authored role-bullet content in legacy `lib/data/index.ts`, minimizing case-study mock surface. Buguard Dashboards and BuilderZ are demoted to waterfall-only because their legacy descriptions are duplicated from sibling projects (Buguard ≈ Dark Atlas text, BuilderZ thin). Hossam can swap any pick at start of Phase 4. [ASSUMPTION: Tamincom (refactor/PUT) and Zrealtors (architecture-leadership bullets) carry a stronger senior-FE signal than Buguard Dashboards in v1; revisit if Hossam disagrees]
- Remaining 16 projects show in waterfall with a "View source" link only.
- Skills matrix in Recruiter Mode shows all 28 in 3 columns.

### 7.4 Mock data approach (v1 build acceleration)

Wherever real content is missing, the typed Project entry includes a `[MOCK]` flag in a `meta.mock` boolean field. Mocks are colored visually identical to real entries but logged to the console on render: `console.warn("[devtools://hossam] Mock content rendered for slug: <slug>")`. Pre-launch gate: zero mocks remain (CI check greps for `mock: true`).

### 7.5 Content migration plan

`lib/data/index.ts` → `lib/content/projects.ts`. See addendum §1 for the field-mapping table.

## 8. Build Phases & v1 Calendar

3-week sprint, evenings/weekends. [ASSUMPTION: ~4 hr/day weekdays + 8 hr/day weekends = ~50 build hours]

### Week 1 — Foundation + content (Phases 1–2)

| Phase | Scope | Estimated effort |
|---|---|---|
| **P1 — Foundation** | Rewrite `app/globals.css` to Obsidian + Lime tokens (full OKLCH set — see addendum §0). Swap fonts in `lib/font.ts`: keep Inter (body), keep Fraunces (titles), replace Geist Mono with **IBM Plex Mono** (labels, REPL, mono). Enable Inter font features `"ss01","cv11"` on `html`/`body`. Remove Dexie + fake-indexeddb. Migrate `lib/data/index.ts` → `lib/content/projects.ts` with Zod schemas (per addendum §1). Archive `docs/plan.md`. | 8 hr |
| **P2 — Chrome + routing** | App Router routes for all 7 tabs. Persistent DevTools chrome. Identity strip + tab nav. Mobile bottom tab bar. Theme provider. | 8 hr |

### Week 2 — Content surfaces (Phases 3–4)

| Phase | Scope | Estimated effort |
|---|---|---|
| **P3 — Elements + Sources + Performance** | Hero, principles, stack marquee. File-tree layout. Score rings + page-weight viz. Static content for all three. | 10 hr |
| **P4 — Network + case studies** | Project waterfall table + filters. Case study route. 6 case studies authored. Shared layout transitions. | 12 hr |

### Week 3 — Interactivity + polish (Phases 5–7)

| Phase | Scope | Estimated effort |
|---|---|---|
| **P5 — Console + Palette + Konami** | REPL with command registry. ⌘K palette (`cmdk`). Konami buffer. Lime-glow unlock. | 8 hr |
| **P6 — XP + Recruiter Mode + Contact** | XP store + chrome bar. Recruiter Mode route + toggle. Contact boss-form with Zod validation + stubbed submit. | 10 hr |
| **P7 — A11y + perf + SEO + launch** | Lighthouse pass to 95+ all categories. Keyboard audit. RTL pass (sanity). OG images + JSON-LD + sitemap. CSP headers. Deploy. | 8 hr |

**Total estimate:** ~64 hours. Buffer: cut Performance route easter-egg and the live Lighthouse score (FR-052) if time-pressured.

## 9. Success Metrics

> **Instrumentation note.** v1 ships with **Vercel Web Analytics only** (built-in, privacy-friendly, no client SDK weight). Vercel Analytics provides: page-view counts per route, top referrers, country, device class. It does **not** provide: per-session duration, multi-page funnel completion, custom event tracking. Metrics below are marked `[Vercel]` (computable from Vercel alone) or `[v1.1]` (require Plausible/PostHog, deferred). A v1.1 follow-up adds Plausible (≤2KB self-hosted-style or hosted) if the deferred metrics become important.

### Leading indicators (first 4 weeks post-launch)

- **M1.** `[v1.1]` Average session duration ≥ 90 seconds (excludes recruiter-mode bounces). Below 30s = the hook is failing. *v1 proxy: track manually by sharing the URL with 5 trusted reviewers and asking "did you read past the hero?"*
- **M2.** `[v1.1]` Case-study view-through rate ≥ 30% (visitors who land on `/` reach at least one `/work/[slug]`). *v1 proxy: compare `/work/[slug]` page-view total to `/` page-view total in Vercel — coarse but indicative.*
- **M3.** `[v1.1]` Recruiter Mode toggle rate ≤ 15% of total sessions. Too high = chrome is alienating P1. *v1 proxy: `/recruiter` page-view count from Vercel divided by total page views.*
- **M4.** `[Vercel + CI]` Lighthouse score on the live URL stays ≥95 across all categories for 4 weeks straight. Spot-checked via Vercel's built-in Speed Insights + manual runs.

### Lagging indicators (job-hunt outcome — manual tracking)

- **M5.** Interview rate from outreach using devtools://hossam as the share link is ≥2× the rate from LinkedIn-only outreach. *Hossam tracks manually during outreach.*
- **M6.** At least one interviewer mentions the portfolio unprompted ("I liked the X").
- **M7.** Zero accessibility complaints in the first 6 weeks.

### Counter-metrics

- **CM1.** `[v1.1]` Bounce rate >75% on `/work` = waterfall is too clever. Triage by adding a clearer "How to read this" affordance. *v1 proxy: anecdotal feedback from trusted reviewers.*
- **CM2.** `[v1.1]` Recruiter Mode toggle rate >40% = chrome is actively repelling P1. *v1 proxy: same as M3.*
- **CM3.** `[Vercel]` Console route page views <2% of total = it's invisible. Triage by adding a discovery hint in the ⌘K palette description.

**Decision rule for adding analytics in v1.1:** if any `[v1.1]` proxy gives ambiguous signal *and* a real product decision hinges on the answer, ship Plausible. Otherwise stay on Vercel-only.

## 10. Out of Scope (v1)

- ❌ Real contact backend (Resend, etc.) — stubbed in v1, v1.1 follow-up.
- ❌ CMS / MDX content pipeline — content in typed TS files only.
- ❌ Multi-language (EN/AR) — fonts already loaded but no language toggle UI in v1. [ASSUMPTION: defer until clear traffic signal; current resume data is EN-only]
- ❌ Analytics beyond Vercel built-in. No GA, no PostHog in v1.
- ❌ Blog / articles section — file-tree placeholder only.
- ❌ Talks / conference page — file-tree placeholder only.
- ❌ Live Lighthouse score in `/perf` (FR-052) — deferred to v1.1.
- ❌ A11y testing automation (axe in CI) — manual audit for v1; automate later.
- ❌ Light mode anywhere (including `/recruiter`).
- ❌ Custom 404 / 500 with DevTools flavor — basic Next.js default in v1, custom in v1.1.
- ❌ PWA / offline-first — explicitly dropped with Dexie.
- ❌ Custom-domain DNS configuration — `hossammarey.com` (or chosen domain) is a deploy-day task, not feature work. [ASSUMPTION: Hossam owns or will register a domain]

## 11. Open Questions

| # | Question | Why it matters | Decision needed by |
|---|---|---|---|
| OQ1 | What is the canonical domain (e.g., `hossammarey.com`, `hossam.dev`)? | OG URLs, JSON-LD canonical, business cards | Phase 7 (deploy day) |
| OQ2 | Which 6 projects get full case studies in v1? Default (per §7.3, after content-fidelity audit): Dark Atlas, MasheedGate, Tamincom Refactor, Zrealtors, Commutrics, Eazy.to. Buguard Dashboards and BuilderZ are demoted to waterfall-only because their legacy descriptions are thin/duplicated. | Phase 4 deliverable; writing time is the long pole. | Start of Phase 4 |
| OQ3 | Does the `experimental` REPL command reveal real content (e.g., side-project ideas Hossam is exploring) or a stylized placeholder? | F10 / FR-042 | Phase 5 |
| OQ4 | Resume PDF — existing one, or fresh one designed in matching Obsidian/Lime style? | F7 / FR-061 | Phase 3 |
| OQ5 | Profile photo — yes/no on `/recruiter`? Many senior devs skip it. | F12 / FR-102 | Phase 6 |
| OQ6 | Should the Elements `/` route have a brief 5-second tutorial overlay on first visit ("Tab between panels, press ⌘K for the palette, D for theme")? Could improve discoverability for P1 but risks looking gimmicky. | Phase 6 | Phase 6 |
| OQ7 | "Years of experience" — round to 10? Use precise start date (2015 graphic-design → 2019 FE switch)? Sensitive framing. | F2 / FR-011 metrics | Phase 1 (Profile authoring) |

These are deferrable — the build phases above proceed with stated assumptions. Each OQ resolution is a small content/scope tweak, not an architectural one.

---

## 12. Glossary

> Every term below is used in this PRD in exactly the sense given. Downstream agents (architecture, UX, story-writing) should anchor on these definitions; if a feature requires breaking a definition, log it as a decision before implementing.

| Term | Definition | First defined |
|---|---|---|
| **Chrome** | The persistent UI frame that wraps all non-`/recruiter` routes: identity strip + tab row (desktop) or identity strip + bottom tab bar (mobile) + XP bar. Sometimes "DevTools chrome." Not to be confused with the Chrome browser. | §4, FR-001 |
| **Recruiter Mode** | A toggleable state (persisted in `localStorage["hm_recruiter_v1"]`) that unmounts the chrome and redirects navigation to `/recruiter` — a flat editorial resume. The toggle is exposed in two places: chrome button and ⌘K palette. | §3, F12 |
| **Tab** | One of the five DevTools panel labels — Elements / Network / Console / Performance / Sources — rendered in the chrome's tab row. Each tab is a real Next.js route. | §4, FR-003 |
| **Method** | The HTTP-verb-shaped badge in the `/work` waterfall (`GET` / `POST` / `PUT` / `PATCH`). **Decorative metaphor only**, not semantic typing (see FR-021). | F3, FR-021 |
| **Status** | A `Project` enum: `shipped` (HTTP 200), `ongoing` (HTTP 201), `archived` (HTTP 410). Drives the colored pill in the waterfall. | F3, FR-022 |
| **Size / sizeWeight** | `size` is a display label (e.g., "12.4 MB") metaphorically standing for a project's impact/scope. `sizeWeight` is a `0–1` number driving visual bar fill. Bytes are decorative, not real page weight. | F3, FR-023 |
| **Time / timeWeight / startOffset** | `time` is a display string ("8 mo"). `timeWeight` (`0–1`) drives waterfall bar *width*. `startOffset` (`0–1`) drives bar *position*. Together they place each row on the relative timeline. | F3, FR-024 |
| **Waterfall** | The horizontal-bar visualization in `/work` borrowed from DevTools Network panel. Each project = one row with method, name, status, size, time, and a positioned bar. | F3 |
| **REPL** | The real `<input>`-backed read-eval-print loop at `/console`. Has command registry, history buffer, and personality (§5.0). Not a fake terminal. | F5 |
| **Palette / ⌘K palette / Command palette** | The `cmdk`-driven fuzzy-search overlay opened by `⌘K` / `Ctrl+K`. Four groups: Navigate / Projects / Actions / Socials. | F11 |
| **XP** | A `0–100` integer (capped) persisted in `localStorage["hm_xp_v1"]`. Increments on first-time tab visits, project-detail opens, REPL commands, and contact-form submit. Hidden under Recruiter Mode and `prefers-reduced-motion`. | F9 |
| **Konami** | The keydown sequence `↑↑↓↓←→←→BA` (case-insensitive). Unlocks the `experimental` REPL command and adds an Experimental palette entry. Persisted in `localStorage["hm_unlocks_v1"]`. | F10 |
| **Boss-level form** | The `/sources` contact form rendered with terminal-style typed prompts, validation rendered as test output, and dramatic submit cadence. See §5.0 voice rule. | F8, §5.0 |
| **Computed-styles panel / Computed-styles cell** | The visual idiom on `/` (and elsewhere) borrowing from Chrome DevTools' Computed tab: hairline grid of cells, label-left, value-right, no card shadow. Implemented as `bg-hairline` outer + `gap-px` + `bg-surface` children. | §5.0, addendum §0 |
| **Case study** | A `/work/[slug]` detail page with sections Problem → Role → Stack → Decisions → Outcomes → Links. 6 of these in v1 per §7.3; remaining projects are waterfall-only. | F4, §7.3 |
| **Mock content** | A `Project` entry with `meta.mock: true` whose case-study fields are `[ASSUMPTION] …` placeholders. CI fails if any v1-featured case study still has `meta.mock: true` at launch. | §7.4 |
| **Featured project** | One of the 6 projects selected for full case-study treatment. Distinct from waterfall-only projects (the other 16). | §7.3, FR-034 |
| **Identity strip** | The top row of the chrome containing name + role (left) and the Recruiter Mode toggle + XP bar (right). | FR-002 |

## 13. Assumptions Index

> Every `[ASSUMPTION: …]` tag in the PRD body, rolled up. Each row points to the section that contains the inline tag. Downstream agents should treat any unresolved row as a precondition that must be confirmed before depending on it.

| # | Assumption | PRD location | Status |
|---|---|---|---|
| A1 | Target = product companies + funded scale-ups + premium agencies; not a specific company list | §2 G1 | Pending |
| A2 | Resume PDF download is one click from `/`; resume file path `/public/hossam-marey-resume.pdf` | §3 P1 + FR-042 | Pending |
| A3 | First-impression budget for P1 is 30–90 seconds | §3 P1 | Confirmed (industry baseline) |
| A4 | EM persona (P2) reads case studies for the *why*, not the *what* | §3 P2 | Confirmed (drives F4 schema) |
| A5 | Peer audience (P3) is long-tail (no precise %) | §3 P3 | Confirmed (J2 ordinal-only) |
| A6 | Principles default content: "Performance is a feature / Accessibility is non-negotiable / DX compounds / Mentor the next senior" | FR-011 | Pending (Hossam authors) |
| A7 | Method → project-type mapping: GET=ongoing product / POST=new launch / PUT=rewrite / PATCH=small contract — **decorative, not semantic** | FR-021 | Confirmed (J1b) |
| A8 | `Profile.metrics[]` numbers (years, projects, talks, mentees). If zero, omit ring rather than zero it | FR-050 | Pending (Hossam authors) |
| A9 | Live Lighthouse score in `/perf` (FR-052) deferred to v1.1 | FR-052 | Confirmed |
| A10 | `articles/` and `talks/` file-tree entries are empty placeholders in v1 | FR-060 | Confirmed |
| A11 | `contact` REPL command navigates to `/sources` rather than printing inline | FR-042 | Pending |
| A12 | `experimental` REPL command reveals a "what I'm building next" panel (concrete content TBD) | FR-042 | Pending (OQ3) |
| A13 | Contact form: stubbed in v1, real backend (Resend) is v1.1 | FR-072 | Confirmed |
| A14 | OG image generation via `opengraph-image.tsx` dynamic; fallback to static if too complex | NFR-S4 | Pending |
| A15 | CSP headers can be a launch-day add; defer until day before deploy | NFR-SE4 | Confirmed |
| A16 | husky / git-hook tooling added in Phase 7; not yet installed | NFR-O3 | Pending |
| A17 | Audience traffic shape: P1 dominant, P2 substantial, P3 long-tail (ordinal, not numeric) | §3 | Confirmed |
| A18 | 6 case studies in v1: Dark Atlas, MasheedGate, Tamincom Refactor, Zrealtors, Commutrics, Eazy.to | §7.3 | Pending (Hossam confirms at start of Phase 4) |
| A19 | `meta.mock: true` projects ship with placeholder case-study content during build; CI gate blocks launch if any v1-featured slug still has `mock: true` | §7.4 | Confirmed |
| A20 | Build calendar: ~3 weeks, ~64 hours evening/weekend time | §8 | Pending (Hossam confirms based on real availability) |
| A21 | Dark-only is total: even `/recruiter` stays dark; print stylesheet handles paper output | FR-103, NFR-A6 | Confirmed |
| A22 | Tamincom (refactor/PUT) and Zrealtors (architecture-leadership bullets) carry a stronger senior-FE signal than Buguard Dashboards | §7.3 | Pending (Hossam confirms) |
| A23 | EN-only in v1; AR fonts already loaded but no language toggle UI | §10 | Confirmed |
| A24 | Custom 404 / 500 are v1.1; Next.js defaults acceptable for v1 | §5.0, §10 | Confirmed |
| A25 | Custom domain owned/registered by Hossam; choice deferred to Phase 7 | §10 + OQ1 | Pending |
| A26 | Profile photo on `/recruiter`: yes/no deferred to OQ5 | OQ5 | Pending |
| A27 | "Years of experience" framing (round to 10? precise from FE switch?) deferred to OQ7 | OQ7 | Pending |
| A28 | Vercel project rename happens in Vercel dashboard, not in `package.json` | addendum §8 | Confirmed |

**Status legend:** *Confirmed* = decided by Hossam or by external evidence; *Pending* = needs explicit confirmation before downstream work depends on it.

---

## Appendix A — Decision log highlights

(Full log: `.decision-log.md` in this folder.)

- Dark-only palette (Obsidian + Signal Lime), per `docs/design-system.md`.
- `localStorage`-only persistence; Dexie dropped 2026-05-25.
- Contact stub v1, Resend v1.1.
- Recruiter Mode dual-toggle (chrome + ⌘K).
- Vercel deployment, zero-config.

## Appendix B — Referenced source documents

- `_bmad-output/project-context.md` — 142-rule AI-agent ruleset (2026-05-25).
- `docs/design-system.md` — CANONICAL visual spec.
- `docs/plan.md` — original IA + features doc (pending Next.js rewrite).
- `docs/tech-equirements.md` — DEPRECATED (template-legacy NFRs).
- `lib/data/index.ts` — DEPRECATED (migrating to `lib/content/projects.ts`).
- `_bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md` — content migration mapping + technical depth that didn't fit the PRD body.
