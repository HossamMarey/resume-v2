
# Hossam Marey Portfolio — Build Plan

**Concept:** `devtools://hossam` (Concept #1) — the site is framed as a browser DevTools panel. The top-level tabs ARE the navigation: Elements, Network, Console, Performance, Sources. Familiar to every engineer recruiter-of-engineers and instantly signals "senior front-end."

**Information Architecture:** IA-C (persistent shell). A thin DevTools-style chrome stays mounted across routes; tab switches are animated panel changes, not full page reloads. Each tab is still a real route with its own URL, title, and meta so it's shareable and SEO-friendly.

**Visual Direction:** V1 — Obsidian (#0B0D10) base, Signal Lime (#C6F24E) single accent, IBM Plex Mono for code/labels, Inter Tight for prose. Hairline 1px borders, no rounded corners above 6px, generous monospace gutters. Dark-only (with a subtle light "inspect" mode toggle later if wanted).

**Gamification (all skippable, all keyboard-friendly):**
- G1 — XP bar in the top chrome that fills as you scroll/explore tabs
- G2 — Konami code unlocks a hidden "Experimental" panel
- G4 — `⌘K` command palette (jump to any project, tab, social, resume PDF)
- G6 — Console tab with a real mini-REPL (`help`, `whoami`, `projects`, `contact`, `theme`, `download resume`)
- G10 — Contact form as a "boss level": typed-out terminal prompts, validation framed as test cases passing

A **"Recruiter mode"** toggle in the chrome collapses all gamification and shows a clean editorial single-scroll resume — so recruiters can scan in 30 seconds.

---

## Routes & tab mapping

```text
/                → Elements     (hero, identity, who/what/why)
/work            → Network      (projects as request waterfall)
/work/$slug      → Network → request detail (case study)
/console         → Console      (REPL + easter eggs)
/perf            → Performance  (metrics: years, projects, students, talks)
/sources         → Sources      (resume, writing, teaching, contact)
/recruiter       → Recruiter mode (flat scrollable resume)
```

Each route file sets its own `head()` (title, description, og:title, og:description, canonical). Root sets defaults only.

## Sections per tab

**Elements (/)** — Name + role, one-line positioning, "Inspect me" CTA that opens command palette, marquee of companies/stacks, scroll-triggered "computed styles" panel revealing principles (performance, a11y, DX, mentorship).

**Network (/work)** — Project list rendered as a DevTools request waterfall: method (`GET`/`POST` mapped to project type), name, status (shipped/archived/ongoing), size (impact), time (duration), waterfall bar. Click → case study panel with problem, role, stack chips, key decisions, before/after metrics, links.

**Console (/console)** — Real REPL backed by a small command registry. `help` lists commands. History with ↑/↓. Konami code unlocks `experimental`.

**Performance (/perf)** — Lighthouse-style score circles for live metrics (years shipped, projects, students taught, talks given), plus a real "page weight" budget visualization comparing his stack choices.

**Sources (/sources)** — File tree on the left (`resume.pdf`, `talks/`, `articles/`, `courses/`, `contact.ts`); preview pane on the right. Contact = G10 boss-level form.

**Recruiter (/recruiter)** — No gamification, no chrome. Just: photo, headline, 3 bullets, 6 highlighted projects with metrics, skills matrix, download resume, contact links.

## Gamification mechanics

- XP increases on: visiting each tab (+10), opening a project (+15), running a console command (+5), submitting contact (+50). Persisted in `localStorage` (`hm_xp`, `hm_unlocks`). Capped at 100. Hidden entirely in Recruiter mode and when `prefers-reduced-motion`.
- Command palette: `cmdk` (already in shadcn) with groups: Navigate, Projects, Socials, Actions.
- Konami: `↑↑↓↓←→←→BA` → unlocks `/console` command `experimental` + a lime glow on the chrome.

## Accessibility & performance

- All animations gated by `prefers-reduced-motion`; reduced-motion users get instant tab swaps and no XP toasts.
- Full keyboard nav: tabs reachable via `Tab`, palette via `⌘K`/`Ctrl+K`, REPL is a real `<input>`, Konami also exposed as a button in Recruiter mode footer.
- Semantic HTML: one `<h1>` per route, real `<nav>`, `<main>`, `<article>` for case studies.
- Mobile: chrome collapses to a bottom tab bar; waterfall switches to stacked cards; REPL remains usable.
- Lighthouse target: 95+ across the board. No heavy libs (no Three.js). Motion via `motion/react`, sparse and purposeful.

## SEO

- Unique `<title>` <60 chars and meta description <160 chars per route.
- JSON-LD `Person` on `/` and `BreadcrumbList` on case studies.
- og:image generated per case study from project hero; root has a default OG.
- Canonical tags, sitemap, robots.

## Tech & libraries

- TanStack Start (already set up), TanStack Router file-based routes
- Tailwind v4 tokens in `src/styles.css` (Obsidian + Signal Lime palette, IBM Plex Mono + Inter Tight via `<link>` in `__root.tsx` head)
- `motion/react` for transitions (install)
- `cmdk` (already via shadcn `command.tsx`) for palette
- shadcn primitives reused for dialog, tabs (custom-skinned), tooltip
- No backend in this phase — projects in a typed `src/content/projects.ts`. Contact form posts to a stubbed server function returning success (real email wiring can come later via Lovable Cloud + Resend).

## Build phases

1. **Foundation** — design tokens in `src/styles.css`, fonts, base layout, persistent DevTools chrome in `__root.tsx`, route shells for all 6 tabs, replace placeholder `index.tsx`.
2. **Elements + Performance + Sources** — static content tabs with motion polish.
3. **Network** — projects content file + waterfall list + case study route + shared layout transitions.
4. **Console + Command Palette + Konami** — REPL, command registry, palette wiring, easter egg.
5. **XP system + Recruiter mode** — XP store (`localStorage`), chrome XP bar, recruiter-mode route + toggle.
6. **Contact boss-level form** — typed prompts, validation-as-tests UI, stub submit.
7. **SEO + a11y pass + reduced-motion + mobile chrome** — head meta per route, JSON-LD, keyboard audit, mobile bottom tab bar.

Content (project list, metrics, resume bullets, links) will use sensible placeholders pulled from the current portfolio analysis; you'll be able to edit one typed content file to swap in final copy.

## Open question (non-blocking, can answer after seeing v1)

Do you want me to wire the contact form to actually send email via Lovable Cloud + Resend in this build, or keep it as a UI-only stub for now?
