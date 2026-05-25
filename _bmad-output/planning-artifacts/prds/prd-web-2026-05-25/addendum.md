---
title: "devtools://hossam PRD — Addendum"
project: web
status: draft
created: 2026-05-25
updated: 2026-05-25
---

# devtools://hossam — PRD Addendum

> Depth that earned its place but doesn't fit the PRD body. Consume alongside `prd.md`. Architecture, content sourcing, rejected alternatives, and migration mechanics live here.

---

## 0. Design Tokens

> The PRD references token names (`background`, `lime`, `hairline`, etc.) without inlining values. This section is the authoritative list. Copy these into `app/globals.css` under `@theme inline { ... }`. Values are OKLCH per `docs/design-system.md`.

### 0.1 Color tokens

```css
/* app/globals.css — @theme inline body */

/* Surfaces */
--background:        oklch(0.155 0.012 260);   /* Obsidian base */
--foreground:        oklch(0.96  0.005 260);
--surface:           oklch(0.19  0.012 260);
--surface-2:         oklch(0.225 0.014 260);
--hairline:          oklch(1 0 0 / 8%);

/* Accent (Signal Lime) */
--lime:              oklch(0.92  0.21  125);
--lime-foreground:   oklch(0.18  0.02  260);
--primary:           var(--lime);
--primary-foreground: var(--lime-foreground);

/* Text / muted */
--muted-foreground:  oklch(0.7   0.02  260);

/* Status */
--status-ok:         oklch(0.85  0.18  145);   /* 200-range */
--status-warn:       oklch(0.85  0.16  85);    /* 201-range */
--status-err:        oklch(0.7   0.22  25);    /* 4xx/5xx */
--destructive:       oklch(0.62  0.22  25);
--destructive-foreground: var(--foreground);

/* Charts (used in /perf rings and waterfall coloring) */
--chart-1:           var(--lime);
--chart-2:           oklch(0.75  0.15  200);   /* GET cyan */
--chart-3:           oklch(0.78  0.16  60);    /* POST / PUT orange */
--chart-4:           oklch(0.7   0.22  25);    /* error red */
--chart-5:           oklch(0.6   0.18  300);   /* PATCH purple */

/* Geometry */
--radius:            0.375rem;                  /* 6px — max radius */

/* Borders / inputs / rings */
--border:            var(--hairline);
--input:             oklch(0.13  0.012 260);    /* slightly darker than surface */
--ring:              var(--lime);
```

**Selection style** (outside `@theme`, in `@layer base`):

```css
::selection { background: var(--lime); color: var(--lime-foreground); }
```

**Background utilities** (in `@layer utilities`):

```css
.bg-grid {
  background-image:
    linear-gradient(to right, rgb(255 255 255 / 4%) 1px, transparent 1px),
    linear-gradient(to bottom, rgb(255 255 255 / 4%) 1px, transparent 1px);
  background-size: 48px 48px;
}
.bg-scan {
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent 3px,
    rgb(255 255 255 / 2%) 3px,
    rgb(255 255 255 / 2%) 4px
  );
}
```

### 0.2 Typography tokens

```css
--font-sans:  "Inter Variable", "Inter", ui-sans-serif, system-ui, sans-serif;
--font-title: "Fraunces Variable", "Fraunces", "Inter Variable", serif;
--font-mono:  "IBM Plex Mono", ui-monospace, "Geist Mono", monospace;
```

Font features on `html`/`body`:

```css
html, body { font-feature-settings: "ss01" on, "cv11" on; }
```

**Type scale** (Tailwind utilities, not tokens):

- Hero H1: `clamp(2rem, 10vw, 6rem)` `font-semibold` `leading-[0.95]` `tracking-tight` — font-family `--font-title` (Fraunces).
- Section H2: `text-2xl sm:text-3xl` — `--font-sans` (Inter).
- Body: `text-sm sm:text-base` at 85–90% foreground opacity — `--font-sans`.
- Mono labels: `text-[10px] sm:text-[11px] uppercase tracking-wider` — `--font-mono` (IBM Plex Mono).
- Tabs: `text-xs` — `--font-sans`.

### 0.3 Aesthetic non-negotiables

These are not preferences. They are project identity. Violating them produces something that looks like a generic dashboard, not devtools://hossam.

1. **No drop shadows on cards / panels / modals.** Hairline borders only. Depth comes from background-color steps (`background` → `surface` → `surface-2`), never from `box-shadow`.
2. **Maximum border radius is `--radius` (6px).** Tailwind `rounded-sm`, `rounded`, occasionally `rounded-md`. Never `rounded-lg`, `rounded-xl`, or `rounded-full` except for the chrome XP bar pill.
3. **Computed-styles cell idiom is the default for panel layouts** (referenced from §5.0 of the PRD). Implementation:
   ```html
   <div class="rounded border border-hairline bg-hairline grid gap-px">
     <div class="bg-surface p-4"> ... </div>
     <div class="bg-surface p-4"> ... </div>
   </div>
   ```
   The `bg-hairline` parent with `gap-px` between `bg-surface` children produces the inset-hairline grid effect of Chrome DevTools' Computed tab. Use this for: principles panel on `/`, case-study Decisions/Outcomes sections, sources file-tree right pane, REPL output blocks.
4. **Inputs sit on a background *darker* than `--surface`** (`oklch(0.13 0.012 260)` / `--input`), not lighter. Focus state is a 1px lime border (`focus:border-lime`), not a glow ring.
5. **`::selection` is lime-on-obsidian-inverted** (lime background, dark foreground). Highlighting text should feel like the site is selecting *you*.
6. **No gradient fills** anywhere except where the spec explicitly calls them out (the `.bg-grid` + `.bg-scan` hero, where they're rgba-grayscale not chromatic).
7. **Lime is a punctuation color, not a paint color.** Used for: primary CTAs, active tab underline, XP bar fill, focus rings, palette highlight, brand accent. **Never** used for body copy, large filled surfaces, or anything that turns the site into a Doritos ad. If a section reads "too green," it is too green.
8. **All animations gated by `prefers-reduced-motion`** — restated here because it's an aesthetic decision, not just an a11y one. The site should feel quiet, not busy.

---

## 1. Content Migration — `lib/data/index.ts` → `lib/content/projects.ts`

### 1.1 Schema target (Zod, per `docs/design-system.md` §13)

```ts
// lib/content/schemas.ts (proposed)
import { z } from "zod"

export const SocialSchema = z.object({
  label: z.string(),
  href: z.string().url(),
})

export const PrincipleSchema = z.object({
  key: z.string(),                // stable, used as React key
  title: z.string(),
  body: z.string(),
})

export const MetricSchema = z.object({
  label: z.string(),
  value: z.number(),
  suffix: z.string().optional(),  // "+", "%", "yrs"
})

export const ProfileSchema = z.object({
  name: z.string(),
  role: z.string(),
  location: z.string(),
  email: z.string().email(),
  tagline: z.string(),
  years: z.number(),
  socials: z.array(SocialSchema),
  principles: z.array(PrincipleSchema),
  metrics: z.array(MetricSchema),
})

export const ProjectMethod = z.enum(["GET", "POST", "PUT", "PATCH"])
export const ProjectStatus = z.enum(["shipped", "ongoing", "archived"])

export const ProjectLinkSchema = z.object({
  label: z.enum(["live", "code", "design", "case-study"]),
  href: z.string().url(),
})

export const ProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string(),
  org: z.string(),                       // "Buguard", "Freelance — PickPath", "Side"
  method: ProjectMethod,
  status: ProjectStatus,
  statusCode: z.number().int(),          // 200, 201, 410
  type: z.string(),                      // free text label
  size: z.string(),                      // display label "12.4 MB"
  sizeWeight: z.number().min(0).max(1),
  time: z.string(),                      // "8 mo"
  timeWeight: z.number().min(0).max(1),
  startOffset: z.number().min(0).max(1), // waterfall bar position 0..1
  year: z.number().int(),
  stack: z.array(z.string()),
  problem: z.string().optional(),        // optional in waterfall, required for case study
  role: z.string().optional(),
  roleBullets: z.array(z.string()).default([]),  // pre-authored role responsibilities (legacy `experience[].projects[].roles[]`)
  decisions: z.array(z.string()).optional(),
  outcomes: z.array(z.string()).optional(),
  links: z.array(ProjectLinkSchema).default([]),
  featured: z.boolean().default(false),
  meta: z.object({
    mock: z.boolean().default(false),
  }).default({ mock: false }),
})
```

Experience and Skill schemas live in `lib/content/experience.ts` and `lib/content/skills.ts` respectively. Design-system.md §13 only explicitly types `Profile` and `Project`; Experience/Skill are inferred from `lib/data/index.ts` shape:

```ts
export const ExperienceSchema = z.object({
  company: z.string(),
  companyUrl: z.string().url().optional(),
  title: z.string(),
  start: z.string(),                     // ISO YYYY-MM
  end: z.string().nullable(),            // null = present
  location: z.string(),
  employmentType: z.enum(["full-time", "contract", "freelance", "side-project"]),
  projectSlugs: z.array(z.string()),     // refs ProjectSchema.slug
})

export const SkillSchema = z.object({
  name: z.string(),
  group: z.enum(["main", "basics", "tooling"]),   // grouping for UI columns (Recruiter Mode skills matrix)
  tier: z.enum(["primary", "secondary"]),         // derived from legacy `level`: 1 → primary, 2 → secondary
})
// NOTE: tier and group are independent. GraphQL/Firebase are group="main" but tier="secondary"
// (level=2 in legacy data). The Recruiter Mode skills matrix groups by `group`; the
// hero stack marquee filters by `tier === "primary"`.
```

### 1.2 Field-mapping table (legacy → typed)

| Legacy field (lib/data/index.ts) | Typed field (lib/content) | Notes |
|---|---|---|
| `experience[].company` | `Experience.company` | Direct |
| `experience[].title` | `Experience.title` | Direct |
| `experience[].date` (free string) | `Experience.start`, `.end` | **Parse + normalize.** "Jun. 2023 - present" → start: "2023-06", end: null |
| `experience[].location` | `Experience.location` | Direct |
| `experience[].type` | `Experience.employmentType` | "Full-time" → "full-time" |
| `experience[].projects[]` | `Experience.projectSlugs[]` | **Resolve to slug refs**, deduplicate against flat `projects[]` (see §1.3 mapping table) |
| `experience[].projects[].roles[]` | `Project.roleBullets[]` | **Carry through.** This is the *only* pre-authored role-bullet content in the dataset; the migration **must not drop it**. Each bullet survives as one entry in `roleBullets`. Case studies render these directly under the **Role** section unless an authored `decisions[]` overrides. |
| `projects[].title` | `Project.name` | Direct |
| `projects[].description` | `Project.problem` (1st sentence) + `Project.role` | **Manual split** during migration |
| `projects[].image` | drop | Replaced by per-slug OG generated at build |
| `projects[].tags[]` | `Project.stack[]` | **Normalize casing** ("react" → "React", "tailwindCss" → "Tailwind CSS") |
| `projects[].links.preview` | `Project.links[{label:"live"}]` | |
| `projects[].links.code` | `Project.links[{label:"code"}]` | Filter out nulls |
| `projects[].links.design` | `Project.links[{label:"design"}]` | Filter out nulls |
| _(missing)_ | `Project.slug` | **Author** — derive from name, kebab-case |
| _(missing)_ | `Project.method` | **Author** per mapping in PRD FR-021 |
| _(missing)_ | `Project.status`, `statusCode` | **Author** — shipped/200, ongoing/201, archived/410 |
| _(missing)_ | `Project.size`, `sizeWeight` | **Author** — relative impact metaphor |
| _(missing)_ | `Project.time`, `timeWeight`, `startOffset` | **Compute** from experience dates |
| _(missing)_ | `Project.year` | **Author** — pull from experience nesting |
| _(missing)_ | `Project.decisions[]`, `outcomes[]` | **Author** — case study fields only |
| `skills[].title` | `Skill.name` | |
| `skills[].level` (1 or 2) | `Skill.tier` | level=1 → `"primary"`; level=2 → `"secondary"` — **derived from `level`, NOT from the group it sits in.** GraphQL/Firebase live in the `main` group but are tier=`secondary`. |
| group containment (`skills[]` vs `basics[]` vs `tools[]`) | `Skill.group` | `main` / `basics` / `tooling`. Drives the 3-column layout in Recruiter Mode skills matrix. |
| `skills[].img` | drop | Replaced by Iconify-style refs at component level |

### 1.3 Dedup pass

Same project appears in both `experience[].projects[]` and the flat `projects[]`. Naive name-matching FAILS for at least 6 known cases — the legacy data has casing variance, parent-child splits, and one→many situations:

| Issue type | Example | Resolution |
|---|---|---|
| Casing variance | `"Whatsapp pro"` (nested) vs `"Whatsapp Pro"` (flat) | Normalize to one slug |
| Title variance | `"E-commerce Website Development "` (nested, with trailing space) vs `"Masheed Gate"` (flat) | Merge into one project, slug = `masheed-gate` |
| Parent-child split | `"Eazy.To"` (nested) vs `"Website and Dashboard"` (nested as project under Eazy.To) vs `"Eazy.to"` (flat) | One project, slug = `eazy-to`. The "Website and Dashboard" detail becomes content inside it. |
| Title suffix variance | `"BuilderZ Project"` (nested) vs `"BuilderZ"` (flat) | Normalize to slug `builderz` |
| One legacy → N final | `"Buguard and DarkAtlas Landing Pages"` (one nested entry) | Split into two projects: slug `buguard-landing` and slug `dark-atlas-landing`. |
| Distinct projects with same name | (none observed but possible) | If encountered, append disambiguator: `slug-2023`, `slug-2024` |

**The dedup is therefore not algorithmic. It is a hand-authored mapping table** committed alongside the migration script at `scripts/migrate-content/legacy-mapping.ts`:

```ts
// scripts/migrate-content/legacy-mapping.ts
// Maps every legacy source location to its target Project slug.
// Hand-authored; CI verifies every legacy entry is referenced exactly once OR explicitly marked `drop: true`.

export const legacyMapping = [
  // Buguard
  { source: "experience[0].projects[0]", slug: "buguard-dashboards" },         // legacy: "Buguard Dashboards"
  { source: "experience[0].projects[1]", split: ["buguard-landing", "dark-atlas-landing"] }, // legacy: "Buguard and DarkAtlas Landing Pages"
  { source: "projects[0]", slug: "buguard-dashboards" },                       // legacy flat: "Buguard"
  { source: "projects[1]", slug: "dark-atlas" },                               // legacy flat: "Dark Atlas"

  // MasheedGate
  { source: "experience[1].projects[0]", slug: "masheed-gate" },               // legacy: "E-commerce Website Development "
  { source: "projects[2]", slug: "masheed-gate" },                             // legacy flat: "Masheed Gate"

  // Eazy.to (parent-child)
  { source: "sideprojects[0]", slug: "eazy-to" },                              // legacy: "Eazy.To"
  { source: "sideprojects[0].projects[0]", slug: "eazy-to", merge: "detail" }, // legacy: "Website and Dashboard"
  { source: "projects[3]", slug: "eazy-to" },                                  // legacy flat: "Eazy.to"

  // ... (one row per legacy location, ~30 rows total)

  { source: "experience[?].projects[N]", drop: true, reason: "duplicate of slug-X" }, // for any entry we deliberately skip
]
```

**Migration script flow:**

1. Read `lib/data/index.ts`, walk every nested+flat location, collect into a flat `[(sourcePath, legacyEntry)]` list.
2. Join with `legacyMapping` by `source` path. Fail if any legacy location is unmapped — forces explicit decision on every entry.
3. Build the unified `Project` records, merging fields where multiple sources point at the same slug (last-write-wins by mapping order, with `drop` skipped).
4. Author the case-study-specific fields (`problem`, `decisions`, `outcomes`) for the 6 featured slugs.
5. Emit `lib/content/projects.ts`, `lib/content/experience.ts`, `lib/content/profile.ts`, `lib/content/skills.ts` as typed exports.
6. CI gate: every entry in `legacyMapping` resolves; every `Project.slug` is unique; every `Experience.projectSlugs[]` reference exists; no v1-featured slug has `meta.mock: true`.

Output: a single `projects: Project[]` array in `lib/content/projects.ts`, no duplicates, referenced by slug from `Experience.projectSlugs[]`. The mapping table is small (~30 rows) and auditable; a name-similarity heuristic would silently mismerge entries and is rejected for that reason.

### 1.4 Mocking strategy

For any project missing case-study fields (problem/role/decisions/outcomes), set `meta.mock: true` and populate with lorem-ipsum-style placeholder. Render path emits `console.warn` in dev (FR §7.4). Pre-launch CI check:

```bash
yarn build && grep -r '"mock":\s*true' lib/content/ && exit 1 || exit 0
```

(or programmatic — check `Project.meta.mock === false` for all entries in the v1 case-study list of 6.)

---

## 2. Routing — App Router translation from plan.md

Original TanStack notation → Next.js 16 App Router:

| `docs/plan.md` (TanStack) | Next.js 16 (App Router) |
|---|---|
| `__root.tsx` (root layout + chrome + font tags) | `app/layout.tsx` |
| `src/styles.css` | `app/globals.css` |
| `routes/index.tsx` | `app/page.tsx` |
| `routes/work/index.tsx` | `app/work/page.tsx` |
| `routes/work/$slug.tsx` | `app/work/[slug]/page.tsx` |
| `routes/console.tsx` | `app/console/page.tsx` |
| `routes/perf.tsx` | `app/perf/page.tsx` |
| `routes/sources.tsx` | `app/sources/page.tsx` |
| `routes/recruiter.tsx` | `app/recruiter/page.tsx` |
| `head()` per route | `export const metadata` or `generateMetadata` |
| Static prerender | `generateStaticParams` for `/work/[slug]` |
| Stubbed server function | Next.js server action (when v1.1 wires contact) |

Recruiter Mode special handling: route is `/recruiter` but the chrome (rendered in `app/layout.tsx`) must conditionally skip when `pathname === "/recruiter"`. Pattern:

```tsx
// app/layout.tsx
const hideChrome = pathname.startsWith("/recruiter") // client check via usePathname
```

Or alternatively: use a Route Group `(chrome)` for the 6 chrome'd routes and put `/recruiter` outside it. Cleaner. Recommended.

```
app/
├── (chrome)/
│   ├── layout.tsx       # DevTools chrome wrapping <main>
│   ├── page.tsx         # /
│   ├── work/page.tsx
│   ├── work/[slug]/page.tsx
│   ├── console/page.tsx
│   ├── perf/page.tsx
│   └── sources/page.tsx
├── recruiter/
│   └── page.tsx
└── layout.tsx           # Root (theme provider, fonts, no chrome)
```

---

## 3. Rejected alternatives (recorded for future reference)

### 3.1 SPA route transitions via View Transitions API (instead of `motion/react` AnimatePresence)

Considered for chrome-persistent tab swaps. Rejected because:
- Browser support gaps for Firefox at time of PRD.
- `motion/react` already a dep; adding View Transitions API on top doubles the animation system.
- AnimatePresence + layoutId gives equivalent visual quality with full reduced-motion control.

Revisit when Firefox ships View Transitions on stable.

### 3.2 MDX-based case studies (instead of typed TS objects)

Considered for richer case-study content authoring (code blocks, embedded charts). Rejected because:
- MDX pipeline adds 2 deps (`@next/mdx`, `remark-*`) — ~80KB to bundle.
- Case studies only need text + chips + bullets + links — typed structure suffices.
- Bypasses Zod validation that catches schema drift.

Revisit when a case study genuinely needs an embedded chart/diagram and the typed schema can't express it.

### 3.3 Sanity / Contentful CMS

Considered for content-without-deploy editability. Rejected because:
- Adds API surface, auth, environment variables, build-time fetching complexity.
- Personal portfolio with ~28 projects is not a CMS-scale content problem.
- Hossam edits content via PR — version-controlled, reviewable, ships with the codebase.

Hard "no" for v1 and v1.1.

### 3.4 Three.js / WebGL hero

Common in senior FE portfolios. Rejected because:
- Direct contradiction with the "no heavy libs / Lighthouse 95+" performance budget.
- Conceptually off-brand — the DevTools metaphor doesn't want a hero that screams "look at my shader," it wants quiet competence.
- The `.bg-grid` + `.bg-scan` background already carries visual weight.

Hard "no" for v1.

### 3.5 Multi-language EN/AR routing

Fonts are already loaded for Arabic (Tajawal, Almarai). Rejected for v1 because:
- Existing resume content is EN-only — needs full translation pass to ship AR.
- i18n routing library adds dep + complexity.
- Audience (EM/recruiter in target markets) is mostly EN-comfortable.

Defer; revisit if Arabic-speaking recruiter traffic shows up in analytics.

---

## 4. Technical depth: XP system

### 4.1 Cross-component event bus and idempotence (FR-075)

"Per-action-per-session" means: visiting the Network tab grants +10 XP only once per browser-tab session, regardless of how many times the user re-navigates back.

Track granted visit-reasons in `sessionStorage["hm_xp_granted"]` (NOT `localStorage` — a fresh browser tab is a fresh exploration session and re-grants visit XP). The XP value itself persists in `localStorage["hm_xp_v1"]`.

```ts
// lib/xp/bus.ts
type XPEvent = { delta: number; reason: string; timestamp: number }

const VISIT_REASONS = new Set([
  "visit:elements", "visit:network", "visit:console", "visit:performance", "visit:sources"
])

export function emitXP(delta: number, reason: string) {
  if (VISIT_REASONS.has(reason)) {
    const granted = JSON.parse(sessionStorage.getItem("hm_xp_granted") ?? "[]") as string[]
    if (granted.includes(reason)) return // already granted this session
    granted.push(reason)
    sessionStorage.setItem("hm_xp_granted", JSON.stringify(granted))
  }
  window.dispatchEvent(
    new CustomEvent("hm:xp", { detail: { delta, reason, timestamp: Date.now() } })
  )
}

// hooks/use-xp.ts (consumer)
export function useXP() {
  const [xp, setXp] = useState(() => loadXP())
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<XPEvent>
      setXp(prev => {
        const next = Math.min(100, Math.max(0, prev + ce.detail.delta))
        saveXP(next)
        return next
      })
    }
    window.addEventListener("hm:xp", handler)
    return () => window.removeEventListener("hm:xp", handler)
  }, [])
  return xp
}
```

### 4.2 Property tests (`fast-check`)

```ts
// hooks/use-xp.test.ts
import fc from "fast-check"

test("xp stays in [0, 100] regardless of input sequence", () => {
  fc.assert(
    fc.property(fc.array(fc.integer({ min: -100, max: 100 })), deltas => {
      const result = deltas.reduce((acc, d) => Math.min(100, Math.max(0, acc + d)), 0)
      expect(result).toBeGreaterThanOrEqual(0)
      expect(result).toBeLessThanOrEqual(100)
    })
  )
})
```

---

## 5. Mock content templates (for the 16 non-case-study projects)

Use this template when authoring `Project` entries that won't have full case studies. Each field gets a reasonable mock value derived from the legacy data:

```ts
{
  slug: kebabCase(name),
  name,
  org: company || "Side",
  method: inferMethod(type),   // see PRD FR-021
  status: inferStatus(date),   // ongoing if active, shipped if completed, archived if explicit
  statusCode: { shipped: 200, ongoing: 201, archived: 410 }[status],
  type: company ? "product" : "side-project",
  size: estimateSize(scope),   // "12.4 MB" feel — relative impact label
  sizeWeight: 0.3 + Math.random() * 0.6, // [ASSUMPTION] author manually
  time: monthsBetween(start, end) + " mo",
  timeWeight: clamp01(months / 24),
  startOffset: monthsSince(referenceDate) / 36,
  year: end ?? new Date().getFullYear(),
  stack: legacy.tags.map(normalizeStackLabel),
  links: [
    legacy.links.preview && { label: "live", href: legacy.links.preview },
    legacy.links.code && { label: "code", href: legacy.links.code },
  ].filter(Boolean),
  featured: false,
  meta: { mock: false }, // these aren't mocks — they're real, just no case study
}
```

For the 6 featured projects:
- `meta.mock: true` initially, with `problem`, `role`, `decisions`, `outcomes` populated as `[ASSUMPTION] …` strings.
- Hossam fills real content in PRs as he writes them. Each PR flips `meta.mock: false`.
- Launch gate: all 6 featured projects have `meta.mock: false`.

---

## 6. Print stylesheet for `/recruiter`

NFR-A6: Recruiter Mode prints clean. CSS targets:

```css
@media print {
  /* In app/recruiter/print.css */
  :root {
    --background: white;
    --foreground: black;
    --lime: black;
    --hairline: rgba(0,0,0,0.2);
  }
  .no-print { display: none; }
  body { font-family: "Inter Tight", system-ui, sans-serif; }
  /* Single-column flow, no card backgrounds, no marquees */
}
```

Test: macOS Cmd+P preview should produce a clean 1–2-page PDF equivalent of the resume.

---

## 7. Resume PDF generation

[ASSUMPTION] v1: ship the existing PDF as `/public/hossam-marey-resume.pdf`. Hossam re-designs in matching Obsidian/Lime style as a v1.1 task (PDF authoring is outside the scope of the web build).

Alternative considered: render `/recruiter` → PDF via Puppeteer at build time. Rejected: adds Puppeteer dep (~250MB), requires Vercel function execution time, and the print stylesheet (§6) gives users a free local PDF via Cmd+P anyway.

---

## 8. Spec departures (intentional)

These are places where the PRD/build differs from `docs/design-system.md`. Each is a deliberate choice with rationale, not an oversight.

| Departure | Spec says | PRD/build does | Rationale |
|---|---|---|---|
| **Mobile chrome** | Scrollable top tab row | Bottom tab bar with `env(safe-area-inset-bottom)` (FR-004) | Bottom-bar is the dominant mobile-app pattern in 2026; thumb-reachable, conventional. Top scrollable tabs work on desktop where horizontal scroll is expected; on mobile they create discoverability problems (off-screen tabs invisible) and feel like a desktop layout that wasn't adapted. |
| **Site is dark-only** | Implied dark-first but not explicit | Explicit dark-only — `next-themes` `defaultTheme="dark"`, `enableSystem={false}`, no `:root` light variables | Resolved decision 2026-05-25 (see project-context.md). Print stylesheet handles paper output (addendum §6). |
| **Recruiter Mode toggle exposed in 2 places** | Spec doesn't address discovery | Chrome button + ⌘K palette action (FR-100) | UJ-1 requires the toggle reachable in ≤2 clicks; redundant exposure is cheap and serves both keyboard-first and mouse-first reviewers. |
| **`docs/plan.md` archived + rewritten** | (n/a — plan.md is concept doc, not spec) | Archived to `docs/archive/plan-tanstack-original.md`; new plan reflects Next.js 16 App Router | TanStack notation in original would mislead AI agents. Mechanical rewrite, no scope change. |

Any future departure from `docs/design-system.md` should add a row here with the same shape.

## 9. Vercel deployment notes

- Project name: `web` (matches `package.json`). [ASSUMPTION: Hossam will rename to `hossam-marey-portfolio` or similar in the Vercel dashboard]
- Custom domain: TBD (OQ1).
- Environment variables: none in v1. v1.1 adds `RESEND_API_KEY`.
- Build command: `yarn build` (Vercel default for Next.js).
- Output: `.next/` (Vercel default).
- Region: auto.
- Preview deployments: every PR.

`vercel.json` is optional. Only add if/when CSP headers, redirects, or rewrites become necessary. Sample for the CSP case:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Content-Security-Policy", "value": "default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; script-src 'self' 'unsafe-inline'" }
      ]
    }
  ]
}
```

(CSP above is permissive starter — tighten before live by removing `'unsafe-inline'` once specific inline scripts/styles are identified or moved to nonces.)
