---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
workflowType: 'architecture'
status: 'complete'
project_name: 'web (devtools://hossam — Hossam Marey portfolio)'
user_name: 'Hossam'
date: '2026-05-30'
completedAt: '2026-05-30'
inputDocuments:
  - _bmad-output/project-context.md
  - _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md
  - _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md
  - _bmad-output/planning-artifacts/ux-design-specification.md
  - docs/design-system.md
authority_order: 'docs/design-system.md (canonical visual) > ux-design-specification.md (interaction & flow) > prd.md §5.0 voice rules > prd.md FRs > addendum.md (depth) > docs/plan.md (intent only)'
---

# Architecture Decision Document

_devtools://hossam — Resume + Portfolio Site for Hossam Marey._

_This document is the single source of truth for technical decisions. AI agents implementing this project follow it exactly; when it conflicts with a downstream spec, this document and `_bmad-output/project-context.md` win (see Authority Order in frontmatter). It was produced collaboratively through the BMad architecture workflow, run in "do all phases, select recommended" mode — every A/P/C gate resolved to **Continue with the recommended option**._

> **Decision-mode note.** This is a static-first, frontend-only, single-author portfolio with **no backend in v1**. Whole categories of conventional architecture (database engine, ORM, auth provider, API gateway, service mesh) are **Not Applicable**. The genuine architecture lives in five places: routing topology (persistent-chrome vs. no-chrome split), client state (localStorage mode bus + CustomEvent XP bus, no state library), the typed content layer (Zod-validated TS modules), component composition (vendored shadcn primitives + custom metaphor components), and motion/accessibility discipline. Those are where this document spends its attention.

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements.** The PRD defines **13 features (F1–F13)** spanning **~80 functional requirements (FR-001 … FR-112)**, organized into these architectural clusters:

- **Shell & navigation (F1, F13)** — a persistent DevTools "chrome" (identity strip + tab row / mobile bottom bar + XP bar) that wraps every route except `/recruiter`, plus theme/hotkey infrastructure. *Architectural implication:* a route-group split so the chrome layout mounts once and survives client-side route transitions without re-rendering.
- **Content surfaces (F2, F3, F4, F6, F7)** — Elements hero, Network project waterfall, case-study detail pages, Performance stats, Sources file-tree. *Implication:* a typed, build-time content layer; static generation (`generateStaticParams`) for case-study slugs; no client fetching.
- **Interactive showcases (F5, F8, F10, F11)** — Console REPL, boss-level contact form, Konami easter egg, ⌘K command palette. *Implication:* client components with their own command/validation registries; a shared "typing-target skip" helper for global hotkeys; code-splitting for heavy panels.
- **Cross-cutting client state (F9, F12)** — XP/gamification and Recruiter Mode. *Implication:* a `localStorage`/`sessionStorage` persistence bus and a `CustomEvent` cross-component bus, deliberately **without** a state-management library.

**Non-Functional Requirements.** The NFRs are unusually load-bearing for a portfolio because the artifact *is* the credibility argument:

- **Performance (NFR-P1–P6):** Lighthouse ≥95 across all four categories on the live URL (a real CI gate, not aspirational); <100ms interaction; 60fps; `transform`/`opacity`-only animation; code-split heavy routes; no dependency >50KB gzipped without approval; no external `<script>`/`<link>`.
- **Accessibility (NFR-A1–A6):** WCAG 2.1 AA; full keyboard parity; `prefers-reduced-motion` gates **every** animation; semantic HTML; lime-on-obsidian only for large text; `/recruiter` must print clean via `@media print`.
- **Responsiveness (NFR-R1–R3):** usable below 360px; dedicated mobile card layout for the waterfall; mobile-usable REPL.
- **SEO (NFR-S1–S4):** per-route metadata, JSON-LD (`Person`, `WebSite`, `BreadcrumbList`), `robots.txt`/`sitemap.xml` via Next metadata APIs, per-slug OG images.
- **Security (NFR-SE1–SE4):** no client-side secrets (contact stubbed in v1); Zod validation on submit; no `dangerouslySetInnerHTML`; CSP via `next.config.mjs` at launch.
- **Operational (NFR-O1–O5):** Vercel zero-config deploy; `yarn` authoritative; pre-commit gate; `localStorage`-only persistence with graceful degradation; shadcn-on-Tailwind-v4 as the only component system.

### Scale & Complexity

- **Primary domain:** Web frontend (Next.js 16 App Router, static-first).
- **Complexity level:** **Medium.** Low on the conventional axes (no backend, no DB, no auth, no multi-tenancy, single author, ~28 projects of bounded content). High on two unconventional axes: (1) **interaction-craft density** — REPL, palette, Konami, layout-shared transitions, boss-level form, all gated by reduced-motion; and (2) **consistency surface** — 30+ UI surfaces that must share one visual language (Computed-styles cell idiom, hairline borders, lime-as-punctuation) without drift.
- **Estimated architectural components:** ~12 custom components (`DevToolsChrome`, `NetworkWaterfallTable`/`Row`, `NetworkRequestDetail`, `ConsoleREPL`, `ScoreRing`, `PageWeightBudget`, `FileTree`/`FilePreviewPane`, `BossLevelContactForm`, `XPBar`/`XPToast`, `KonamiListener`, `CommandPalette`, `ComputedStylesPanel`) composing ~22 vendored shadcn primitives, backed by 4 typed content modules and ~4 client hooks.

### Technical Constraints & Dependencies

Hard constraints (from `_bmad-output/project-context.md` and PRD NFRs — these override agent defaults):

- **Locked stack, no major bumps without a migration note.** Versions are pinned in `package.json` as of 2026-05-25 (see Core Decisions → Locked Technology Stack). This supersedes any "use the latest version" default.
- **Tailwind v4 — no `tailwind.config.*`.** Tokens live in `app/globals.css` via `@theme inline`.
- **`motion/react`, never `framer-motion`** (v12 entry point).
- **Path alias `@/*` maps to the project root**, not `src/` (there is no `src/`).
- **Dark-only.** No light-mode `:root` block; print stylesheet is the only light surface.
- **No new dependencies without explicit approval** ("no heavy libs" is a hard product constraint); no Dexie/IndexedDB (dropped 2026-05-25); no state-management or router/i18n libraries.
- **`yarn` only**; `yarn.lock` authoritative; `package-lock.json` is stale legacy noise.

### Cross-Cutting Concerns Identified

1. **Reduced-motion gating** — touches every animated component; must be a single shared helper, not per-component re-implementation.
2. **Client-state buses** — `localStorage` mode keys + `CustomEvent("hm:xp")`; every consumer reads through a single hook per key.
3. **Global hotkey hygiene** — `D` (theme), Konami sequence, ⌘K must all skip typing targets via one shared helper (matching the existing `ThemeHotkey` pattern).
4. **Server/Client boundary discipline** — RSC by default; `"use client"` pushed as deep as possible; the chrome layout and interactive showcases are the client islands.
5. **Token-only styling** — semantic Tailwind utilities backed by `globals.css` tokens; zero hardcoded hex/oklch in JSX.
6. **Mock-content launch gate** — CI must block launch if any featured slug still carries `meta.mock: true`.

---

## Starter Template Evaluation

### Primary Technology Domain

**Web application (frontend-only, static-first)** — Next.js 16 App Router.

### Starter Options Considered

This is a **brownfield** project: the foundation already exists and is partially built. Evaluating greenfield starters (T3, `create-next-app` variants, Vite+React, RedwoodJS, etc.) would be re-litigating a settled, working setup. The relevant evaluation is therefore *"is the existing foundation the right one, or should it be replaced?"* — and the answer is **keep and extend it**.

| Option | Verdict | Rationale |
|---|---|---|
| **Existing in-repo foundation** (Next.js 16 + shadcn `radix-nova` + Tailwind v4, already installed) | **SELECTED** | Foundation is installed, configured, and ratified by PRD NFR-O5. 22 shadcn primitives vendored; fonts already migrated; `lib/content/*` already Zod-typed. Replacing it would discard working, reviewed work. |
| `create-next-app` (fresh) | Rejected | Would regenerate what already exists and lose the vendored shadcn primitives, the OKLCH token work, and the content migration. |
| T3 Stack (`create-t3-app`) | Rejected | Bundles tRPC/Prisma/NextAuth — all irrelevant to a backend-less static portfolio. Adds surface area the project explicitly excludes. |
| Vite + React SPA | Rejected | Loses SSG/metadata APIs/`next/image`/`next/font` that the SEO + performance budgets depend on. |

### Selected Starter: Existing In-Repo Next.js 16 Foundation

**Rationale for Selection.** The codebase already encodes the correct decisions. The architecture's job is to document and constrain them, not re-pick them. The "first implementation story" is therefore **not** a project-init command — it is the Phase-1 foundation work (token rewrite + Dexie removal + plan archive), most of which has already begun.

**Initialization (already executed; documented for reproducibility).** A fresh equivalent of this foundation would be:

```bash
# Reference only — the repo already exists. Do NOT re-run against the live repo.
yarn create next-app@16 web --typescript --app --eslint --no-src-dir --import-alias "@/*"
npx shadcn@4.8.0 init   # style: radix-nova, baseColor: neutral, RSC: yes
# then vendor primitives as needed: npx shadcn@4.8.0 add button card dialog ...
```

**Architectural Decisions Provided by the Foundation:**

- **Language & Runtime:** TypeScript 5.9.3 (`strict`, `isolatedModules`, `moduleResolution: bundler`, `jsx: react-jsx`); Next.js 16.1.7 (App Router, Turbopack dev); React 19.2.4.
- **Styling Solution:** Tailwind CSS 4.2.1 via `@tailwindcss/postcss`; tokens in `app/globals.css` `@theme inline` (no config file); shadcn `radix-nova` preset, `neutral` base, RSC enabled.
- **Build Tooling:** Next.js + Turbopack (dev), Vercel build (prod); ESLint 9 flat config; Prettier 3 with `prettier-plugin-tailwindcss`.
- **Testing Framework:** Vitest 4 + jsdom + Testing Library + `fast-check` (property tests). Setup at `tests/setup.ts`, `globals: true`.
- **Code Organization:** Project-root `app/`, `components/ui/` (vendored shadcn), `components/` (custom), `hooks/`, `lib/{content,schemas,types,utils}`; `@/*` → root.
- **Development Experience:** `yarn dev` (Turbopack), `yarn typecheck`, `yarn lint`, `yarn format`, `yarn test`/`test:run`.

**Note:** The first implementation priority is the Phase-1 foundation work (see Implementation Handoff), **not** a scaffolding command — the scaffold is already present.

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (block implementation):** routing topology; content layer; client-state architecture; persistence model; component composition strategy.

**Important Decisions (shape architecture):** motion system; metadata/SEO approach; mock-content gating; code-splitting boundaries; deployment.

**Deferred Decisions (post-v1):** real contact backend (Resend via server action — v1.1); analytics beyond Vercel (Plausible — v1.1); custom 404/500 shells (v1.1); per-slug dynamic OG image generation (fall back to static if too complex); CSP header tightening (launch-day); axe/Playwright automation (v1.1); AR language routing (deferred until traffic signal).

### Locked Technology Stack

Versions pinned per `package.json` (2026-05-25). **Do not bump majors without a migration note.** This is the explicit project constraint and supersedes any "use latest" default; no live version-bump search is performed.

| Concern | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.1.7 | Turbopack dev; static-first |
| UI runtime | React / react-dom | 19.2.4 | Refs-as-props; no `forwardRef` |
| Language | TypeScript | 5.9.3 | strict, isolatedModules, bundler |
| Styling | Tailwind CSS | 4.2.1 | `@theme inline`; no config file |
| Components | shadcn (radix-nova) / radix-ui | 4.8.0 / 1.4.3 | vendored into `components/ui/*` |
| Variants | class-variance-authority | 0.7.1 | with `clsx` 2.1.1 + `tailwind-merge` 3.6.0 |
| Motion | framer-motion (import `motion/react`) | 12.40.0 | gated by reduced-motion |
| Palette | cmdk | 1.1.1 | via shadcn `CommandDialog` |
| Toasts | sonner | 2.0.7 | single provider at root |
| Forms | react-hook-form + @hookform/resolvers + zod | 7.76.1 / 5.4.0 / 4.4.3 | Zod is source of truth |
| Theme | next-themes | 0.4.6 | `class` strategy, dark-only |
| Icons | lucide-react | 1.16.0 | tree-shaken imports |
| Fonts | next/font/google | — | IBM Plex Mono, Inter, Fraunces, Tajawal, Almarai |
| Testing | Vitest / Testing Library / fast-check | 4.1.7 / 16.3.2 / 4.8.0 | jsdom env |
| Package mgr | yarn | — | `yarn.lock` authoritative |
| Hosting | Vercel | — | zero-config; branch previews |

### Data Architecture

**No database. No ORM. No API.** All content is **typed, build-time TypeScript modules validated by Zod**, living in `lib/content/*`:

- `lib/content/profile.ts` — `Profile` (name, role, location, email, tagline, years, socials, principles, metrics).
- `lib/content/projects.ts` — `Project[]` (the canonical waterfall + case-study source; `slug`, `method`, `status`, `statusCode`, `size`/`sizeWeight`, `time`/`timeWeight`/`startOffset`, `stack`, `problem`/`role`/`decisions`/`outcomes`/`links`, `featured`, `meta.mock`).
- `lib/content/experience.ts` — `Experience[]` (refs projects by slug).
- `lib/content/skills.ts` — `Skill[]` grouped (main/basics/tooling) and tiered (primary/secondary).

**Decisions:**

1. **Zod schemas are the single source of truth.** Types are derived via `z.infer<typeof Schema>`; never hand-write parallel interfaces. *(This is already implemented — `lib/content/index.ts` re-exports schemas + inferred types.)*
2. **Validation runs at module load** (parse the exported data through its schema once) so malformed content fails the build/tests, not at runtime in the browser.
3. **Migration is done.** `lib/data/index.ts` → `lib/content/*` already landed (commit `cd5dd09`). The legacy `lib/data` and any empty `lib/repository` Dexie wrapper are removed. New code imports **only** from `lib/content/*`.
4. **Mock gating.** `Project.meta.mock` flags placeholder case studies; a CI grep (`"mock":\s*true` against featured slugs in `lib/content/projects.ts`) fails the build at launch.
5. **No caching layer** — content is inlined at build; pages are statically rendered.

**Affects:** F2–F7, F12; the `/work/[slug]` static generation; the Recruiter Mode skills matrix.

### Authentication & Security

- **No authentication / authorization** — public read-only site, single author, content edited via PR.
- **No client-side secrets** (NFR-SE1). Contact form is a **UI-only stub** in v1: faked success after a randomized 600–1200ms delay + sonner toast; **no env vars**. v1.1 wires Resend via a Next.js **server action** with a server-only `RESEND_API_KEY`. The Zod schema in `lib/schemas/contact.ts` is authored now so the same schema validates client-side in v1 and server-side in v1.1.
- **Input validation:** Zod on submit (and on-type, debounced) — never trust HTML5 validation alone (NFR-SE2).
- **No `dangerouslySetInnerHTML`** (no MDX in v1) (NFR-SE3); **no external `<script>`** tags (NFR-P3).
- **CSP** via `next.config.mjs` `headers()` added the day before launch; starter policy in addendum §9, tightened before going live.

### API & Communication Patterns

- **No HTTP API in v1.** The only cross-component "communication" is in-browser:
  - **Custom-event XP bus:** `window.dispatchEvent(new CustomEvent("hm:xp", { detail: { delta, reason, timestamp } }))`. Consumers subscribe via `addEventListener("hm:xp")`. **No state-management library** (FR-078) — this is a deliberate lightweight design.
  - **localStorage mode bus:** three versioned keys (`hm_xp_v1`, `hm_unlocks_v1`, `hm_recruiter_v1`) plus a session-scoped `hm_xp_granted` set in `sessionStorage` for idempotent per-session visit grants. (The legacy `hm_visits_v1` key is subsumed by the session-scoped granted-reasons set per addendum §4.1.)
- **Error/empty handling as "DevTools voice":** REPL unknown commands print `command not found: <x>. Type 'help'...` + `did you mean: <suggestion>?`; filter-empty states show "No requests match your filter" + Clear; form errors render as failing tests (`✗ email_format — …`). No red modals.
- **v1.1 server action** (contact) will return `{ ok: boolean }`; the client treats any non-`ok` as a voiced failure line, not an exception.

### Frontend Architecture

This is the heart of the design.

**1. Routing topology — route-group chrome split.** Two layouts under one root:

```
app/
├── layout.tsx              # Root: <html>, ThemeProvider, fonts, Sonner, KonamiListener, global hotkeys. NO chrome.
├── (chrome)/
│   ├── layout.tsx          # <DevToolsChrome> wrapping <main>; mounts ONCE, persists across the 6 chrome'd routes
│   ├── page.tsx            # /          Elements
│   ├── work/page.tsx       # /work      Network waterfall
│   ├── work/[slug]/page.tsx# /work/[slug] case study (generateStaticParams)
│   ├── console/page.tsx    # /console   REPL
│   ├── perf/page.tsx       # /perf      stats
│   └── sources/page.tsx    # /sources   file tree + contact
└── recruiter/
    └── page.tsx            # /recruiter  flat editorial resume — OUTSIDE (chrome), chrome literally unmounts
```

*Rationale:* the route group gives the persistent-chrome thesis structurally — the chrome layout is not re-mounted on tab switch, only the page slot changes (wrapped in `AnimatePresence mode="wait"`). `/recruiter` lives outside the group so Recruiter Mode is a real unmount, not a CSS hide (FR-101).

**2. State management — no library.** `localStorage` mode bus + `CustomEvent` XP bus, each consumed through exactly one hook (`useXP`, `useUnlocks`, `useRecruiterMode`). Direct per-component `localStorage` reads are forbidden. SSR-safe: never read storage during render; use `useEffect` + a mounted gate (mirrors the `next-themes` `suppressHydrationWarning` pattern already in place).

**3. Component architecture — compose, don't fork.** Custom metaphor components compose vendored shadcn primitives (e.g., `NetworkWaterfallRow` uses `<Badge>`; the palette uses shadcn `<CommandDialog>`). `cva` defines each component's variants once. React 19 → refs are props (no `forwardRef`). RSC by default; `"use client"` only where hooks/handlers/`motion`/`cmdk` are used, pushed as deep as possible.

**4. Performance optimization.** Code-split `/console`, `/work/[slug]`, `/sources` via `dynamic(() => import(...))` (NFR-P6); `transform`/`opacity`-only animation; `useInView({ once: true })` for scroll reveals; `next/image` everywhere with explicit dimensions; `next/font/google` only.

**5. Theme.** `next-themes` at root: `attribute="class"`, `defaultTheme="dark"`, `enableSystem={false}`, `disableTransitionOnChange`. `D` hotkey kept as infrastructure but emits a dark-only sonner toast in v1. `suppressHydrationWarning` on `<html>` stays.

### Infrastructure & Deployment

- **Hosting:** Vercel, zero-config Next.js deploy. Every PR gets a preview URL (high-value for a visual-dominant project).
- **CI gates:** Vercel's production build is the default check. A lightweight GitHub Action may run `yarn typecheck && yarn lint && yarn test:run` plus the **mock-content grep** when pre-deploy gating becomes valuable.
- **Pre-commit:** `yarn typecheck && yarn lint && yarn test:run && yarn format` via husky/simple-git-hooks (added in Phase 7).
- **Env vars:** none in v1. v1.1 adds server-only `RESEND_API_KEY`.
- **`vercel.json`:** optional; added only for CSP headers/redirects/rewrites (CSP at launch).

### Decision Impact Analysis

**Implementation sequence (aligned with PRD §8 phases):**

1. **P1 Foundation** — `globals.css` token rewrite (Obsidian + Lime, OKLCH per addendum §0); confirm Dexie/fake-indexeddb removed; archive `docs/plan.md`; (content migration ✅ done; fonts ✅ done).
2. **P2 Chrome + routing** — `(chrome)` route group, `DevToolsChrome`, mobile bottom bar, theme provider wiring, global hotkey + Konami listener mounts.
3. **P3 Elements + Sources + Perf** — hero/principles (`ComputedStylesPanel`), `ScoreRing`, `PageWeightBudget`, `FileTree`/`FilePreviewPane` (contact preview stubbed until P6).
4. **P4 Network + case studies** — waterfall table/row, filter chips (URL-persisted), `NetworkRequestDetail`, `layoutId` shared transitions, `generateStaticParams`.
5. **P5 Console + Palette + Konami** — `ConsoleREPL` + command registry, `CommandPalette`, Konami unlock + chrome pulse.
6. **P6 XP + Recruiter + Contact** — XP hooks/`XPBar`/`XPToast`, `/recruiter` + toggle (two surfaces), `BossLevelContactForm`.
7. **P7 A11y + perf + SEO + launch** — print stylesheet, OG images, JSON-LD, sitemap, CSP, Lighthouse pass, deploy.

**Cross-component dependencies:**

- The **XP bus** (P5/P6 plumbing) is consumed by chrome (`XPBar`), REPL, project-detail opens, and the contact form → define `lib/xp/bus.ts` + `useXP` early.
- The **typing-target skip helper** is shared by `D` hotkey, Konami, and palette → one helper in `lib/utils` (or `hooks`).
- The **`useShouldAnimate()`** reduced-motion helper is imported by every animated component → define before P2.
- **`(chrome)` route group** must exist before any tab page is built (P2 precedes P3–P6).
- **Content schemas** (✅) gate every content surface; the **mock gate** must be wired before featured-slug authoring in P4.

---

## Implementation Patterns & Consistency Rules

> These exist to prevent two AI agents from making divergent-but-individually-reasonable choices. They restate and tighten `_bmad-output/project-context.md`; where this section and project-context agree, project-context is the canonical long-form reference.

### Naming Patterns

**Files**

- Components & hooks: **kebab-case** — `devtools-chrome.tsx`, `network-waterfall-row.tsx`, `use-xp.ts`, `use-recruiter-mode.ts`.
- Utility modules: match the surrounding folder convention (existing `lib/utils/dateUtils.ts` uses camelCase — follow the folder, don't fight it).
- Route files: Next.js reserved names exactly — `page.tsx`, `layout.tsx`, `loading.tsx`, `not-found.tsx`, `opengraph-image.tsx`.
- Tests: colocated `*.test.ts(x)` next to source; cross-cutting only under `tests/`.

**Symbols**

- Components: `PascalCase`. Functions/vars: `camelCase`. True constants: `SCREAMING_SNAKE_CASE` only.
- Booleans: `is`/`has`/`should`/`can` prefix. Handlers: `onClick` (prop) / `handleClick` (impl).
- Hooks: `useX`. Custom-event names: namespaced colon form — `hm:xp`. XP reasons: `verb:target` — `visit:network`, `open:project`, `repl:command`, `contact:submit`.

**Exports**

- **Named exports only** for regular components. Exception: `page.tsx`/`layout.tsx` **must** default-export (Next.js requirement).
- Type-only imports use `import type { … }` (`isolatedModules` is on).
- No `import React` (jsx runtime is `react-jsx`).

**Storage keys (frozen contract)**

- `localStorage`: `hm_xp_v1`, `hm_unlocks_v1`, `hm_recruiter_v1`. `sessionStorage`: `hm_xp_granted`.
- New persisted state gets a `hm_<name>_v1` key; bump the `_vN` suffix on a breaking shape change.

### Structure Patterns

- **Tests colocated** with source; `tests/` holds only `setup.ts` + cross-cutting integration.
- **Components by role, not feature** at this scale: `components/ui/*` (vendored primitives, never hand-edit structure beyond restyle), `components/*` (custom shared). No per-route `components/` folders for a site this size.
- **One hook per file** in `hooks/`, named export, re-exported from `hooks/index.ts`.
- **Content** lives only in `lib/content/*`; **schemas** that aren't content-owned live in `lib/schemas/*` (e.g., `contact.ts`); shared types in `lib/types/*`; `cn()` in `lib/utils.ts`.
- **Static assets** in `public/`, referenced as `/path` (resume at `/public/hossam-marey-resume.pdf`).

### Format Patterns

- **Dates:** store ISO `YYYY-MM` strings in content; format for display with `date-fns`. `null` end date = "present".
- **Status contract:** `status` enum ↔ `statusCode` ↔ token is fixed — `shipped`/`200`/`--status-ok`, `ongoing`/`201`/`--status-warn`, `archived`/`410`/`--status-err`. Enforced by the typed schema; never render an ad-hoc mapping.
- **Method badge:** `GET`/`POST`/`PUT`/`PATCH` is **decorative metaphor, not semantic typing** (FR-021) — colors via chart tokens (`--chart-2` cyan GET, `--chart-3` orange POST/PUT, `--chart-5` purple PATCH).
- **Weights:** all `*Weight`/`startOffset` are `0..1` floats (Zod-clamped); waterfall bars use `transform: scaleX(weight)` + `translateX(startOffset)`, **never** `width`/`left`.
- **Booleans in content:** real `true`/`false`. **Null links filtered out** before render.

### Communication Patterns

- **XP events:** always via `emitXP(delta, reason)` in `lib/xp/bus.ts` — never dispatch the raw `CustomEvent` inline. `emitXP` enforces per-session idempotence for `visit:*` reasons against `sessionStorage["hm_xp_granted"]`.
- **XP value mutation:** clamp to `[0,100]` in the `useXP` reducer on every update (property-tested with `fast-check`).
- **Mode reads/writes:** only through `useRecruiterMode`/`useUnlocks`/`useXP`. These hooks own the storage I/O, the try/catch degradation, and the mounted gate.
- **No global mutable singletons** beyond the event bus; state lives in React + storage.

### Process Patterns

- **Reduced motion:** every animation imports `useShouldAnimate()` (returns `false` under `prefers-reduced-motion`); when false, collapse duration to `0.001s` / render final state at mount / hide XP toasts (XP still increments). No per-component re-derivation.
- **Global hotkeys:** every keydown handler (`D`, Konami, ⌘K) first calls the shared `isTypingTarget(el)` guard (`<input>`/`<textarea>`/`[contenteditable="true"]`) — reuse the existing `ThemeHotkey` pattern, do not duplicate.
- **Loading states:** **none.** Site is static-first; pages render with content immediately. No skeletons, no spinners. The only async UI is the contact submit (button text changes "send →" → "running tests…" → revert).
- **Error handling:** errors are conversation in DevTools voice (failing-test lines, `did you mean:`, empty-filter copy). No error modals. `localStorage`/`sessionStorage` access wrapped in try/catch → in-memory fallback, never crash.
- **Hydration:** never read storage in render; mounted gate + `useEffect`. Keep `suppressHydrationWarning` on `<html>`.

### Enforcement Guidelines

**All AI agents MUST:**

- Use semantic tokens (`bg-background`, `text-foreground`, `border-border`/`border-hairline`, `bg-primary`/lime) — **zero** hardcoded hex/oklch in JSX. Palette changes happen only in `globals.css`.
- Wrap dynamic class strings in `cn(...)`/`cva(...)` so Prettier sorts them and `tailwind-merge` dedupes.
- Use logical properties for RTL (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`), never `ml-`/`mr-`/`left-`/`right-`.
- Import `motion/react` (never `framer-motion`); gate every animation through `useShouldAnimate()`.
- Keep components RSC unless they need client features; default-export only route files.
- Add no dependency without explicit approval.

**Verification:** `yarn typecheck && yarn lint && yarn test:run && yarn format` pre-commit; Vitest property tests for XP cap, Konami buffer, command parsing, date utils, schema fuzz; CI mock-content grep; manual Lighthouse/keyboard/reduced-motion/RTL audit per PRD UI-verification checklist.

### Pattern Examples

**Good — token + cn + logical props + reduced-motion:**

```tsx
"use client"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useShouldAnimate } from "@/hooks"

export function WaterfallBar({ timeWeight, startOffset, method }: WaterfallBarProps) {
  const animate = useShouldAnimate()
  return (
    <motion.span
      className={cn("block h-1.5 origin-left rounded-sm", methodToken(method))}
      style={{ transform: `translateX(${startOffset * 100}%)` }}
      initial={animate ? { scaleX: 0 } : false}
      animate={{ scaleX: timeWeight }}
      transition={{ duration: animate ? 0.6 : 0.001, ease: "easeOut" }}
    />
  )
}
```

**Anti-patterns (forbidden):**

```tsx
import { motion } from "framer-motion"          // ❌ must be motion/react
<div style={{ width: `${pct}%`, marginLeft: 8, color: "#C6F24E" }} onClick={…}/>
// ❌ width animation, hardcoded hex, physical margin, div-as-button
localStorage.getItem("hm_xp_v1")                 // ❌ read XP only via useXP()
export default function NetworkRow() {}          // ❌ regular components are named exports
```

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
web/
├── README.md
├── package.json                 # yarn authoritative; scripts: dev/build/start/lint/format/typecheck/test
├── yarn.lock
├── next.config.mjs              # metadata defaults; headers() for CSP at launch
├── postcss.config.mjs           # @tailwindcss/postcss
├── tsconfig.json                # strict; @/* -> project root
├── eslint.config.mjs            # flat config: next core-web-vitals + typescript
├── .prettierrc                  # no semis, double quotes, prettier-plugin-tailwindcss
├── vitest.config.ts             # jsdom; resolve.alias @/ in sync with tsconfig
├── components.json              # shadcn radix-nova / neutral / aliases
├── vercel.json                  # OPTIONAL — only when CSP/redirects needed
│
├── app/
│   ├── layout.tsx               # ROOT (default export): <html dir> + ThemeProvider + fonts + <Toaster/> + KonamiListener + global hotkeys. No chrome.
│   ├── globals.css              # @theme inline tokens (OKLCH), @layer base/utilities, ::selection, .bg-grid/.bg-scan
│   ├── favicon.ico
│   ├── robots.ts                # metadata API
│   ├── sitemap.ts               # metadata API
│   ├── (chrome)/
│   │   ├── layout.tsx           # <DevToolsChrome> wraps <main>; persists across routes
│   │   ├── page.tsx             # / Elements: hero + principles + stack marquee
│   │   ├── work/
│   │   │   ├── page.tsx         # /work waterfall + filter chips (URL search params)
│   │   │   └── [slug]/
│   │   │       ├── page.tsx     # case study; generateStaticParams + generateMetadata
│   │   │       └── opengraph-image.tsx  # per-slug OG (fallback static if too complex)
│   │   ├── console/page.tsx     # REPL (dynamic import)
│   │   ├── perf/page.tsx        # score rings + page-weight budget
│   │   └── sources/page.tsx     # file tree + contact (dynamic import)
│   └── recruiter/
│       ├── page.tsx             # flat editorial resume — OUTSIDE (chrome)
│       └── print.css            # @media print light system (or inline @media print block)
│
├── components/
│   ├── theme-provider.tsx       # next-themes provider + ThemeHotkey (EXISTS)
│   ├── ui/                      # vendored shadcn primitives (kebab-case, named exports) — EXIST
│   │   ├── badge.tsx button.tsx calendar.tsx card.tsx command.tsx dialog.tsx
│   │   ├── dropdown-menu.tsx input-group.tsx input.tsx label.tsx popover.tsx
│   │   ├── select.tsx separator.tsx sheet.tsx sonner.tsx switch.tsx tabs.tsx
│   │   └── textarea.tsx tooltip.tsx
│   ├── devtools-chrome.tsx      # identity strip + tab row + mobile bottom bar + XP bar slot
│   ├── computed-styles-panel.tsx# universal hairline-grid panel wrapper
│   ├── network-waterfall-table.tsx
│   ├── network-waterfall-row.tsx
│   ├── network-request-detail.tsx
│   ├── console-repl.tsx
│   ├── score-ring.tsx
│   ├── page-weight-budget.tsx
│   ├── file-tree.tsx
│   ├── file-preview-pane.tsx
│   ├── boss-level-contact-form.tsx
│   ├── xp-bar.tsx
│   ├── xp-toast.tsx
│   ├── konami-listener.tsx
│   ├── command-palette.tsx
│   └── recruiter-resume.tsx     # editorial layout used by /recruiter
│
├── hooks/
│   ├── index.ts                 # re-exports (EXISTS)
│   ├── use-xp.ts                # subscribes hm:xp; clamps [0,100]; persists hm_xp_v1
│   ├── use-unlocks.ts           # hm_unlocks_v1 array
│   ├── use-recruiter-mode.ts    # hm_recruiter_v1 boolean
│   └── use-should-animate.ts    # prefers-reduced-motion single source of truth
│
├── lib/
│   ├── utils.ts                 # cn() (EXISTS)
│   ├── font.ts                  # next/font setup (EXISTS — IBM Plex Mono/Inter/Fraunces/Tajawal/Almarai)
│   ├── content/                 # typed, Zod-validated content (EXISTS, migrated)
│   │   ├── index.ts profile.ts projects.ts experience.ts skills.ts
│   ├── schemas/
│   │   └── contact.ts           # contact form Zod schema (client v1, server v1.1)
│   ├── xp/
│   │   └── bus.ts               # emitXP(delta, reason) + session idempotence
│   ├── repl/
│   │   └── commands.ts          # command registry (help/whoami/projects/contact/theme/clear/download/experimental)
│   ├── keyboard.ts              # isTypingTarget() shared guard
│   ├── types/                   # shared types (EXISTS)
│   └── utils/                   # dateUtils.ts, validation.ts (EXIST)
│
├── tests/
│   └── setup.ts                 # jest-dom; NO fake-indexeddb (Dexie dropped)
│
├── public/
│   ├── hossam-marey-resume.pdf  # one-click download target (CI verifies presence)
│   └── og/                      # static OG fallbacks if dynamic generation deferred
│
├── docs/
│   ├── design-system.md         # CANONICAL visual spec
│   ├── plan.md                  # to be archived + rewritten Next.js-native
│   └── archive/plan-tanstack-original.md
│
└── _bmad/  _bmad-output/         # BMad workflow artifacts — do not hand-edit
```

### Architectural Boundaries

**Layout boundary (the central one).** `app/(chrome)/layout.tsx` owns the persistent chrome and mounts once; `app/recruiter/page.tsx` is deliberately outside it so toggling Recruiter Mode unmounts the chrome rather than hiding it. The root `app/layout.tsx` owns truly global concerns (theme, fonts, toaster, Konami listener, global hotkeys) that must exist on `/recruiter` too — except gamification, which Recruiter Mode suppresses.

**Content boundary.** `lib/content/*` is the only content source. Pages import typed data and validated types from it; they never inline content or reach into `lib/data` (removed). Schemas validate at module load.

**State boundary.** Storage I/O is confined to the `hooks/use-*` files and `lib/xp/bus.ts`. UI components consume hooks; they do not touch `localStorage`/`sessionStorage` directly. The `CustomEvent("hm:xp")` bus is the only cross-component channel.

**Component boundary.** `components/ui/*` are vendored primitives (restyle via tokens, don't restructure). `components/*` custom components compose primitives. Pages compose custom components. No primitive imports a custom component (dependency points one way).

**Data boundary.** No external data at runtime. The only "external" surface is the v1.1 contact server action (`RESEND_API_KEY`, server-only) — explicitly out of v1 scope.

### Requirements-to-Structure Mapping

| Feature / FRs | Lives in |
|---|---|
| F1 Persistent chrome (FR-001–004) | `app/(chrome)/layout.tsx`, `components/devtools-chrome.tsx` |
| F2 Elements hero (FR-010–013) | `app/(chrome)/page.tsx`, `components/computed-styles-panel.tsx`, `app/globals.css` (`.bg-grid`/`.bg-scan`) |
| F3 Network waterfall (FR-020–027) | `app/(chrome)/work/page.tsx`, `components/network-waterfall-{table,row}.tsx`, `lib/content/projects.ts` |
| F4 Case study (FR-030–034) | `app/(chrome)/work/[slug]/page.tsx`, `components/network-request-detail.tsx`, `opengraph-image.tsx` |
| F5 Console REPL (FR-040–044) | `app/(chrome)/console/page.tsx`, `components/console-repl.tsx`, `lib/repl/commands.ts` |
| F6 Performance (FR-050–052) | `app/(chrome)/perf/page.tsx`, `components/score-ring.tsx`, `components/page-weight-budget.tsx` |
| F7 Sources (FR-060–062) | `app/(chrome)/sources/page.tsx`, `components/file-tree.tsx`, `components/file-preview-pane.tsx` |
| F8 Boss-level form (FR-070–073) | `components/boss-level-contact-form.tsx`, `lib/schemas/contact.ts` |
| F9 XP system (FR-074–078) | `lib/xp/bus.ts`, `hooks/use-xp.ts`, `components/xp-bar.tsx`, `components/xp-toast.tsx` |
| F10 Konami (FR-080–083) | `components/konami-listener.tsx`, `hooks/use-unlocks.ts`, `lib/keyboard.ts` |
| F11 ⌘K palette (FR-090–093) | `components/command-palette.tsx` (shadcn `CommandDialog`) |
| F12 Recruiter Mode (FR-100–104) | `app/recruiter/page.tsx`, `components/recruiter-resume.tsx`, `hooks/use-recruiter-mode.ts`, `app/recruiter/print.css` |
| F13 Theme & hotkeys (FR-110–112) | `components/theme-provider.tsx` (exists), `lib/keyboard.ts` |
| NFR-S SEO | per-route `generateMetadata`, `app/robots.ts`, `app/sitemap.ts`, JSON-LD in pages |
| NFR-A6 print | `app/recruiter/print.css` / `@media print` |

**Cross-cutting concerns:** reduced-motion → `hooks/use-should-animate.ts`; hotkey hygiene → `lib/keyboard.ts`; tokens → `app/globals.css`; mock gate → CI grep on `lib/content/projects.ts`.

### Integration Points

- **Internal communication:** props (RSC → client islands), the `hm:xp` CustomEvent bus, and storage-backed hooks. URL search params carry `/work` filter state (shareable, hard-refresh-safe). The active tab is derived from `usePathname()`.
- **External integrations:** Vercel build/host + Vercel Web Analytics (built-in, no SDK). v1.1: Resend (server action), Plausible (analytics).
- **Data flow:** `lib/content/*` (build-time, Zod-validated) → RSC pages → client islands for interactivity → user actions emit `hm:xp` / write mode keys → hooks re-render chrome (`XPBar`) / route to `/recruiter`.

---

## Architecture Validation Results

### Coherence Validation ✅

- **Decision compatibility:** The stack is internally consistent and already installed/working — Next.js 16 App Router + React 19 + Tailwind v4 + shadcn `radix-nova` + `motion/react` + Zod content are a coherent, mutually compatible set (versions co-pinned 2026-05-25). No contradictory choices: "no backend" is consistent across data/auth/API/security sections; "no state library" is consistent with the documented event/storage buses.
- **Pattern consistency:** Naming, token-only styling, reduced-motion gating, and hotkey hygiene all reinforce the same constraints stated in the decisions and in `project-context.md`. No pattern contradicts a decision.
- **Structure alignment:** The `(chrome)` route group structurally delivers the persistent-chrome decision; the `lib/content` + `hooks/use-*` + `lib/xp/bus` layout delivers the data and state boundaries. The tree maps 1:1 to features.

### Requirements Coverage Validation ✅

- **Functional:** All 13 features (F1–F13) map to concrete files in the Requirements-to-Structure table; no FR cluster is unhoused.
- **Non-functional:** Performance (route-group persistence, code-splitting, transform/opacity, `next/image`/`next/font`), accessibility (single reduced-motion helper, semantic HTML, keyboard parity, print stylesheet), responsiveness (mobile bottom bar + waterfall card layout), SEO (metadata APIs + JSON-LD + sitemap + OG), and security (stubbed contact, Zod, CSP) each have an explicit architectural home.

### Implementation Readiness Validation ✅

- **Decision completeness:** Stack versions are pinned; the genuinely-architectural choices (routing, state, content, composition, persistence) are decided with rationale; deferred items are explicitly labeled v1.1.
- **Structure completeness:** A specific, complete tree exists (not placeholders), distinguishing files that already exist from files to author.
- **Pattern completeness:** Conflict points (naming, format/status contract, storage keys, event/hotkey/motion hygiene, RSC boundary) are addressed with good/anti-pattern examples.

### Gap Analysis Results

**Critical gaps:** None blocking implementation.

**Important (content/decision, not architectural — already tracked as PRD Open Questions / Assumptions):**

- Featured case-study set (OQ2/A18/A22), `experimental` command content (OQ3 — must be real at launch, not placeholder), resume PDF source (OQ4), profile photo on `/recruiter` (OQ5/A26), years-of-experience framing (OQ7). These are content decisions Hossam resolves per phase; none changes the architecture.
- Per-slug **dynamic OG** vs. static fallback (NFR-S4/A14) — architecture supports both; pick during P4/P7.
- Mobile Recruiter-Mode reachability — UX spec chooses palette-only for v1 (no hamburger); acceptable, revisit if mobile P1 traffic shows alienation.

**Nice-to-have (v1.1):** axe-in-CI, Playwright E2E for UJ-1/2/3, visual regression, custom 404/500 DevTools shells, real contact backend, Plausible analytics, AR language routing.

### Validation Issues Addressed

- **Typography contradiction (PRD "Inter Tight" vs. spec "Inter")** — resolved in favor of **Inter** (UX spec authority; already implemented in `lib/font.ts`). Fraunces restored for titles. No action needed.
- **Mobile chrome departure (top scroll vs. bottom bar)** — resolved to **bottom bar** (PRD FR-004 + UX spec endorsement); logged as an intentional spec departure (addendum §8).
- **Legacy `hm_visits_v1` key** — superseded by `sessionStorage["hm_xp_granted"]` for per-session visit idempotence; documented so agents don't reintroduce the old key.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed
- [x] Scale and complexity assessed
- [x] Technical constraints identified
- [x] Cross-cutting concerns mapped

**Architectural Decisions**

- [x] Critical decisions documented with versions
- [x] Technology stack fully specified
- [x] Integration patterns defined
- [x] Performance considerations addressed

**Implementation Patterns**

- [x] Naming conventions established
- [x] Structure patterns defined
- [x] Communication patterns specified
- [x] Process patterns documented

**Project Structure**

- [x] Complete directory structure defined
- [x] Component boundaries established
- [x] Integration points mapped
- [x] Requirements to structure mapping complete

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION (all 16 checklist items confirmed; no Critical Gaps open).

**Confidence Level:** High — the foundation is already installed and partially built, the inputs (PRD + addendum + UX spec + canonical design system + 142-rule project context) are unusually complete and mutually reconciled, and the architecture mostly formalizes constraints the codebase already encodes.

**Key Strengths:**

- The hardest decision (persistent chrome) has a clean structural answer (route group).
- "No backend, no state library" keeps the system small and fast — directly serving the Lighthouse-95 budget.
- Strong existing guardrails (project-context 142 rules) mean low risk of agent drift.
- Content layer is already typed and migrated; component primitives already vendored.

**Areas for Future Enhancement:** real contact backend; richer analytics; automated a11y/E2E; dynamic OG at scale; custom error shells; AR localization.

### Implementation Handoff

**AI Agent Guidelines:**

- Follow this document and `_bmad-output/project-context.md` exactly; on conflict, those win over downstream specs (per Authority Order).
- Use the implementation patterns consistently; consume state only through `hooks/use-*` and `lib/xp/bus.ts`; gate every animation through `useShouldAnimate()`.
- Respect the `(chrome)` route group boundary and the content/state/component boundaries.
- Add no dependency without explicit approval.

**First Implementation Priority:** Phase 1 — Foundation. The scaffold already exists, so the first story is **the `app/globals.css` token rewrite to Obsidian + Signal Lime (OKLCH per addendum §0)**, confirming Dexie/fake-indexeddb removal and archiving `docs/plan.md`. (Content migration and font swap are already complete.) Then proceed P2 → P7 per the Decision Impact sequence.

---

## Completion Summary

Architecture for **devtools://hossam** is complete and validated — **READY FOR IMPLEMENTATION**. The document defines the routing topology (`(chrome)` route group + standalone `/recruiter`), the library-free client-state design (localStorage mode bus + `hm:xp` CustomEvent bus), the typed Zod content layer, the compose-don't-fork component strategy over vendored shadcn primitives, and the motion/accessibility discipline that the Lighthouse-95 and WCAG-AA budgets demand — all grounded in a foundation that is already installed and partially built.

_Workflow executed in "do all phases, select recommended" mode: every A/P/C gate resolved to Continue with the recommended option; no Advanced Elicitation or Party Mode branches were taken._
