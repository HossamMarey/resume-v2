Let me explore the codebase to compile the full design system for you.

Here's the complete design system for `devtools://hossam` based on the current build:

---

devtools://hossam — Design System

1. Concept & Brand

Metaphor: The entire portfolio is framed as a browser DevTools panel. Navigation tabs are named after DevTools panels (Elements, Network, Console, Performance, Sources). The chrome persists across routes, creating a "single app" feel.

Tagline: "I build fast, accessible interfaces for data-heavy products — then teach how it was done."

Mood: Dark, technical, premium, playful but not toy-like. Senior engineer energy.

---

2. Color Palette

All colors defined in OKLCH in `src/styles.css`.

| Token                | OKLCH Value              | Usage                                     |
| -------------------- | ------------------------ | ----------------------------------------- |
| `--background`       | `oklch(0.155 0.012 260)` | Page background, deepest layer            |
| `--foreground`       | `oklch(0.96 0.005 260)`  | Primary text                              |
| `--surface`          | `oklch(0.19 0.012 260)`  | Cards, panels, table rows                 |
| `--surface-2`        | `oklch(0.225 0.014 260)` | Elevated surfaces, inputs, progress track |
| `--hairline`         | `oklch(1 0 0 / 8%)`      | 1px borders, dividers, grid lines         |
| `--lime`             | `oklch(0.92 0.21 125)`   | Primary accent — Signal Lime              |
| `--lime-foreground`  | `oklch(0.18 0.02 260)`   | Text on lime backgrounds                  |
| `--primary`          | same as `--lime`         | shadcn primary mapping                    |
| `--muted-foreground` | `oklch(0.7 0.02 260)`    | Secondary text, labels, timestamps        |
| `--status-ok`        | `oklch(0.85 0.18 145)`   | Shipped, success, passing tests           |
| `--status-warn`      | `oklch(0.85 0.16 85)`    | Ongoing, warning                          |
| `--status-err`       | `oklch(0.7 0.22 25)`     | Error, archived, failing tests            |
| `--destructive`      | `oklch(0.62 0.22 25)`    | Delete/danger actions                     |

Semantic palette for charts/metrics:

- `--chart-1` = lime
- `--chart-2` = `oklch(0.75 0.15 200)` (cyan-ish, for GET methods)
- `--chart-3` = `oklch(0.78 0.16 60)` (amber, for POST/PUT)
- `--chart-4` = `oklch(0.7 0.22 25)` (red, for errors)
- `--chart-5` = `oklch(0.6 0.18 300)` (purple, for PATCH)

Traffic lights (top chrome): red = `oklch(0.7 0.22 25)`, yellow = `oklch(0.85 0.16 85)`, green = `oklch(0.85 0.18 145)`

---

3. Typography

| Role          | Font          | Weight  | Usage                                                                  |
| ------------- | ------------- | ------- | ---------------------------------------------------------------------- |
| Sans (body)   | Inter         | 400–600 | prose, UI labels                                                       |
| Sans (titles) | Fraunces      | 400–600 | headlines                                                              |
| Mono (code)   | IBM Plex Mono | 400–500 | Tab labels, data tables, console, command palette, all DevTools chrome |

Scale:

- Hero H1: `text-[clamp(2rem,10vw,6rem)]` with `font-semibold`, `leading-[0.95]`, `tracking-tight`
- Section H2: `text-2xl font-semibold` (mobile) / `sm:text-3xl` (desktop)
- Body: `text-sm` to `text-base`, `text-foreground/85` or `text-foreground/90`
- Mono labels: `text-[10px]` to `text-[11px]`, `uppercase tracking-wider` for headers
- Tab text: `text-xs`

Special treatments:

- Code comments: `text-muted-foreground` with `//` prefix
- CSS variable names: `font-mono text-[11px] text-lime` with `--` prefix
- Keyboard keys: `<kbd className="rounded border border-hairline px-1.5 py-0.5">`

Font features: `font-feature-settings: "ss01", "cv11"` enabled globally on `html, body`

---

4. Spacing & Layout

Container: `max-w-6xl` centered with `mx-auto`, `px-4` on mobile

Grid system:

- Default: single column, stacked
- `sm:` (640px+): 2-column grids for principles, metrics
- `md:` (768px+): multi-column data tables, sidebar layouts (220px sidebar + 1fr content)
- `lg:` (1024px+): 4-column metric rings

Gap scale:

- Between major sections: `mt-10` to `mt-12`
- Between related items: `gap-2` to `gap-3`
- Inside cards: `p-6` standard, `sm:p-8` on desktop

Hairline borders: `border-hairline` (1px at 8% opacity white) is the default border treatment. No heavy borders, no drop shadows on cards.

---

5. Surface Language

Border radius:

- `--radius: 0.375rem` (6px) maximum
- Small UI: `rounded-sm` (~2px)
- Buttons: `rounded` (~6px)
- No large rounded corners — this is a technical/dev tool aesthetic

Backgrounds:

- `.bg-grid` — 48px CSS grid lines at 4% opacity white
- `.bg-scan` — 4px horizontal scanlines at 2% opacity (CRT subtle effect)
- Combined on hero: `bg-grid` + `bg-scan` with `opacity-40` and `opacity-60`

Selection: `::selection` uses lime background with dark foreground (inverted)

---

6. Component Patterns

Buttons

| Variant        | Classes                                                                                                 | Usage               |
| -------------- | ------------------------------------------------------------------------------------------------------- | ------------------- |
| Primary (lime) | `rounded border border-lime/50 bg-lime/10 px-4 py-2 text-lime hover:bg-lime hover:text-lime-foreground` | CTAs, "inspect me"  |
| Outline        | `rounded border border-hairline px-4 py-2 hover:border-lime hover:text-lime`                            | Secondary nav       |
| Tab active     | `border-b-2 border-lime text-foreground`                                                                | Active DevTools tab |
| Tab inactive   | `border-b-2 border-transparent text-muted-foreground hover:text-foreground`                             | Inactive tab        |
| Chip/tag       | `rounded border border-hairline px-2 py-1 font-mono text-[11px]`                                        | Stack labels        |

Data Table (Network/Work)

Desktop: `grid-cols-[60px_1.4fr_0.9fr_90px_90px_90px_1.4fr]` with `gap-2`
Mobile: card-based `flex flex-col gap-2` with waterfall bar below meta row

Panels

All content panels use:

- `rounded border border-hairline` outer shell
- `bg-hairline` with `gap-px` for internal grid lines (like Computed styles panel)
- Children use `bg-surface` to create the "separated cells" effect

Inputs

- Background: `bg-[oklch(0.13_0.012_260)]` (slightly darker than surface)
- Border: `border-hairline`
- Focus: `focus:border-lime`
- Font: `font-mono text-sm`

---

7. Animation & Motion

Library: `motion/react` (Framer Motion)

Patterns:

| Animation        | Trigger                       | Duration                           | Easing                                    |
| ---------------- | ----------------------------- | ---------------------------------- | ----------------------------------------- |
| Page entrance    | Route mount                   | 0.5s                               | `easeOut`                                 |
| Staggered list   | Mount                         | 0.25s each, `i * 0.04` delay       | `easeOut`                                 |
| Score ring draw  | `useInView` once              | 1.1s                               | `easeOut`                                 |
| Number count-up  | `requestAnimationFrame`       | 1100ms                             | `1 - Math.pow(1 - p, 3)` (cubic ease out) |
| XP bar fill      | State change                  | Spring (stiffness 120, damping 20) | Spring physics                            |
| Panel switch     | `AnimatePresence mode="wait"` | 0.2s in, 0.15s out                 | `easeOut`                                 |
| XP toast         | `AnimatePresence`             | 0.15s                              | `easeOut`                                 |
| Page weight bars | `whileInView`                 | 0.7s                               | `easeOut`                                 |

Reduced motion: All animations gated by `prefers-reduced-motion` — durations collapsed to `0.001ms`

---

8. Gamification System

XP Engine (`src/lib/xp.ts`):

- Persisted in `localStorage` (`hm_xp_v1`, `hm_unlocks_v1`, `hm_visits_v1`)
- Capped at 100 XP
- Events dispatched via `CustomEvent("hm:xp")`

Rewards:

- Visit tab: +10 XP
- Open project: +15 XP
- Run console command: +5 XP
- Submit contact form: +50 XP
- Konami code unlock: +20 XP

Unlocked features:

- `experimental` — Konami code (↑↑↓↓←→←→BA) reveals an "Experimental" tab in the nav

Chrome XP bar:

- Height: `h-1`, width: `w-16` mobile / `w-32` desktop
- Fill color: `bg-lime`
- Spring animation on width change

---

9. Command Palette (`⌘K`)

- Trigger: `metaKey + k` or `ctrlKey + k`
- Uses `cmdk` via shadcn `CommandDialog`
- Groups: Navigate (tabs), Projects (all 6), Actions (recruiter toggle, reset XP), Socials

---

10. Responsive Strategy

| Breakpoint          | Behavior                                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Mobile (<640px)     | Single column, stacked cards, hidden tab descriptions, visible XP bar, horizontal-scrolling file tree, console at `h-[65vh]` |
| Tablet (640–1024px) | 2-column grids, data tables still card-based, sidebar layouts active                                                         |
| Desktop (>1024px)   | Full data tables, 4-column metrics, 2-column case studies with sticky sidebar, all metadata visible                          |

Mobile chrome adjustments:

- Tab nav: `overflow-x-auto` with hidden descriptions
- Profile name: `hidden sm:inline` in title bar
- "Recruiter mode" button: hidden on mobile, visible `sm:inline-block`
- XP bar: always visible, narrower on mobile

---

11. Accessibility

- `prefers-reduced-motion`: All animations instant, no XP toasts
- Keyboard: Tabs reachable via `Tab`, palette via `⌘K`, console input is real `<input>`
- Semantic HTML: `<article>` per route, `<nav>` for tabs, `<main>` wrapper, `<h1>` per page
- ARIA: `aria-label` on palette button, console input
- Focus rings: `focus-visible:ring-1 focus-visible:ring-ring` on shadcn components
- Color contrast: Lime on obsidian meets WCAG AA for large text; muted-foreground at `oklch(0.7)` for body

---

12. Route Architecture

| URL           | DevTools Tab   | Content                                                        |
| ------------- | -------------- | -------------------------------------------------------------- |
| `/`           | Elements       | Hero, identity, principles marquee, stack marquee              |
| `/work`       | Network        | Project waterfall table                                        |
| `/work/$slug` | Network detail | Case study: problem, role, decisions, outcomes                 |
| `/console`    | Console        | Functional REPL with command history                           |
| `/perf`       | Performance    | Score rings, page-weight budget                                |
| `/sources`    | Sources        | File tree: resume, talks, articles, courses, contact boss-form |
| `/recruiter`  | —              | Flat, gamification-free resume view                            |

Each route sets its own `<title>` (<60 chars), `description`, `og:title`, `og:description`.

---

13. Content Model

Profile (`src/content/projects.ts`):

- `name`, `role`, `location`, `email`, `tagline`, `years`
- `socials[]`: `{ label, href }`
- `principles[]`: `{ key, title, body }`
- `metrics[]`: `{ label, value, suffix }`

Project:

- `slug`, `name`, `org`, `method` (GET/POST/PUT/PATCH), `status` (shipped/ongoing/archived)
- `statusCode` (HTTP metaphor: 200, 201)
- `type`, `size` (impact label), `sizeWeight` (0–1), `time`, `timeWeight`, `startOffset`
- `year`, `stack[]`, `problem`, `role`, `decisions[]`, `outcomes[]`, `links[]`

---

14. Recruiter Mode

- Toggle in chrome or via command palette
- Stored in `localStorage` (`hm_recruiter_v1`)
- Hides: XP bar, gamification, command palette, tab chrome
- Shows: Flat editorial resume at `/recruiter`

---

Want me to create this as a persistent `.md` file in the repo? I can write it to `/mnt/documents/design-system.md` for reference, or keep it in the project. Let me know.
