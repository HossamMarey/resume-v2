---
project_name: 'web (devtools://hossam — Hossam Marey portfolio)'
user_name: 'Hossam'
date: '2026-05-25'
sections_completed:
  ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'quality_rules', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 142
optimized_for_llm: true
---

# Project Context for AI Agents

_This file contains critical rules and patterns that AI agents must follow when implementing code in this project. Focus on unobvious details that agents might otherwise miss._

---

## Project Identity

- **Owner:** Hossam Marey, Senior Front-End Developer
- **Goal:** Personal resume + portfolio website
- **Concept:** `devtools://hossam` — a browser DevTools panel metaphor. Tabs = navigation (Elements, Network, Console, Performance, Sources). See `docs/plan.md` for full IA.
- **Audience:** Engineering recruiters and engineering managers. A "Recruiter mode" toggle collapses gamification into a flat editorial resume.

---

## Technology Stack & Versions

_Locked versions from `package.json` (2026-05-25). Do not bump majors without a migration note._

**Runtime / framework**
- Next.js `16.1.7` — **App Router only**, dev runs with `--turbopack`
- React `19.2.4` / react-dom `19.2.4`
- TypeScript `5.9.3` (`strict: true`, `moduleResolution: bundler`, `target: ES2017`, `jsx: react-jsx`)
- Node types `^25.5.0`

**Styling / UI**
- Tailwind CSS `4.2.1` via `@tailwindcss/postcss` — **v4: tokens live in `app/globals.css`, NO `tailwind.config.*`**
- shadcn CLI `4.8.0`, style preset `radix-nova`, baseColor `neutral`, RSC enabled
- `radix-ui` `1.4.3`, `class-variance-authority` `0.7.1`, `clsx` `2.1.1`, `tailwind-merge` `3.6.0`
- `tw-animate-css` `1.4.0`, `lucide-react` `1.16.0` (icons)
- `next-themes` `0.4.6` (`class` attribute strategy)

**Motion / interaction**
- `framer-motion` `12.40.0` — **import as `motion/react`**, NOT `framer-motion`
- `cmdk` `1.1.1`, `sonner` `2.0.7`

**Data / forms**
- ~~`dexie` `4.4.2` + `dexie-react-hooks` `4.4.0`~~ — **DROPPED (2026-05-25).** Pending removal: `yarn remove dexie dexie-react-hooks fake-indexeddb`. All persistence is `localStorage`.
- `react-hook-form` `7.76.1` + `@hookform/resolvers` `5.4.0` + `zod` `4.4.3`
- `date-fns` `4.3.0`, `react-day-picker` `10.0.1`

**Tooling**
- ESLint `9.39.4` flat config (`eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`)
- Prettier `3.8.1` + `prettier-plugin-tailwindcss` `0.7.2`
- Vitest `4.1.7` + `@vitejs/plugin-react` `6.0.2` + jsdom `29.1.1`
- Testing Library React `16.3.2`, jest-dom `6.9.1`, user-event `14.6.1`
- ~~`fake-indexeddb` `6.2.5`~~ (pending removal — Dexie is out), `fast-check` `4.8.0`
- **Package manager: `yarn`** (yarn.lock is authoritative)

---

## Critical Implementation Rules

### Language-Specific Rules (TypeScript)

- **Strict mode is on.** No `as any` / non-null `!` without a justification comment.
- **`isolatedModules: true`** — type-only imports MUST use `import type { Foo } from "..."`.
- **Path alias `@/*` maps to PROJECT ROOT** (not `src/`). Keep `tsconfig.json` paths, `components.json` aliases, and `vitest.config.ts` alias in sync if it changes.
- **Zod schemas are the source of truth** for runtime-validated data. Derive TS types via `z.infer<typeof Schema>` — never hand-write parallel interfaces.
- **No `import React`** — JSX runtime is `react-jsx`.
- **Named exports only** for regular components. Exception: `page.tsx` / `layout.tsx` MUST default-export (Next.js requirement).
- **`interface` for extensible object shapes; `type` for unions, intersections, mapped types.**

### Framework-Specific Rules

#### Next.js 16 App Router

- **App Router only** — `app/` folder, no `pages/`. Folder-based routes.
- **Server Components by default.** Add `"use client"` ONLY when the file uses hooks, browser APIs, event handlers, or client-only libs. Push the boundary as deep as possible.
- **Layouts wrap `<main>`** — `app/layout.tsx` already renders it. Page files use `<section>` / `<article>`, NOT another `<main>`.
- **Metadata via the metadata API** (`export const metadata` or `generateMetadata`), not raw `<head>`. Title <60 chars, description <160 chars.
- **Static-first** — use `generateStaticParams` for dynamic case-study slugs. No backend in v1.
- **`suppressHydrationWarning` on `<html>` is required** for `next-themes` — do not remove.

#### React 19

- **Refs are now props** — no `forwardRef` boilerplate.
- **`useActionState` / `useFormStatus`** for form transitions over manual `isSubmitting`.
- **Strict Mode on in dev** — effects fire twice; don't rely on render-order side effects.

#### Tailwind v4 + shadcn

- **Tokens in `app/globals.css`** via `@theme inline { ... }`. NO `tailwind.config.*`.
- **Semantic tokens only** — `bg-background`, `text-foreground`, `border-border`, `text-muted-foreground`, `bg-primary`, `bg-card`. Never hardcode hex/oklch in components.
- **`cn()` from `@/lib/utils`** — Prettier sorts classes inside `cn` and `cva` calls. Use them or lose auto-sort.
- **Dark mode via `@custom-variant dark (&:is(.dark *))`** — `dark:` variant works as expected.
- **shadcn primitives in `@/components/ui/*`** — 22 installed (button, card, dialog, dropdown-menu, input, textarea, label, popover, select, separator, switch, tabs, sonner, tooltip, badge, sheet, input-group, command, calendar, …). Reuse first.
- **`cva` for component variants** — define once, consumers pass `variant` prop.
- **RTL is wired** — use logical properties (`ms-`, `me-`, `ps-`, `pe-`, `start-0`, `end-0`), NOT `ml-`/`mr-`/`left-`/`right-`.

#### framer-motion / motion

- **Import path is `motion/react`** (v12 entry), never `framer-motion`.
- **Every animation gated by `prefers-reduced-motion`** via `useReducedMotion()` or duration collapse to `0.001s`. No exceptions.
- **`AnimatePresence mode="wait"`** for route/panel swaps.
- **`useInView({ once: true })`** for scroll-triggered reveals.

#### next-themes

- `ThemeProvider` at root. `attribute="class"`, `defaultTheme="system"`, `enableSystem`, `disableTransitionOnChange`.
- **`D` key (no modifiers, not while typing) toggles theme** — implemented in `components/theme-provider.tsx` `ThemeHotkey`. Don't duplicate.
- **Use `resolvedTheme`** from `useTheme()`, not `theme` (handles `"system"` case).

#### i18n

- Three font stacks loaded: Inter + Fraunces (English), Tajawal + Almarai (Arabic), Geist Mono. CSS vars swap on `[dir="rtl"]`.
- **No i18n routing library** — if multi-language URLs are needed, that's a new dependency decision.

### Testing Rules

- **Vitest config:** `environment: jsdom`, setup at `tests/setup.ts`, `globals: true` (do NOT import `describe`/`it`/`expect`).
- **Path alias `@/` works in tests** via `vitest.config.ts` `resolve.alias` — keep in sync with `tsconfig.json`.
- **Colocate** `*.test.ts(x)` next to source. Use `tests/` only for setup + cross-cutting integration.
- **Testing Library queries by role/label/text.** Avoid `getByTestId` unless no accessible label exists.
- **`user-event` with `userEvent.setup()`** — not `fireEvent` (except for keyboard cases user-event doesn't model).
- **No snapshot tests for UI** — they rot.
- ~~`fake-indexeddb/auto`~~ — REMOVED with Dexie. `tests/setup.ts` no longer needs IndexedDB mocking.
- **`fast-check` for property-based testing** — REPL command parsing, XP math (cap at 100, idempotent unlocks), date utils, zod fuzz.
- **Mock external boundaries only.** Test real `lib/` modules. Common AI failure: over-mocking.
- **`vi.useFakeTimers()`** for animations / debounces; `vi.useRealTimers()` in `afterEach`.
- **Don't test:** Tailwind class strings (Prettier sorts them), shadcn primitives (vendored), Next.js framework behavior.
- **Scripts:** `yarn test` (watch), `yarn test:run` (CI single-run).

### Code Quality & Style Rules

#### Prettier (`.prettierrc`)
- No semicolons, double quotes, 2-space indent, `trailingComma: es5`, 80-col print width, `endOfLine: lf`.
- `prettier-plugin-tailwindcss` configured for `cn` and `cva` — wrap dynamic class strings in `cn(...)` to get sorting.
- Run `yarn format` before commits.

#### ESLint
- Flat config extending `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript`.
- `next/image` over `<img>`, `next/link` over `<a href="/...">` — enforced by core-web-vitals.
- No `// eslint-disable-next-line` without a justification comment.

#### Naming
- **Files:** kebab-case for components/hooks (`theme-provider.tsx`, `use-xp.ts`), camelCase for utility modules (`dateUtils.ts` — match surrounding folder).
- **Symbols:** PascalCase for components, camelCase for functions/vars, SCREAMING_SNAKE_CASE for true constants only.
- **Booleans:** `is`, `has`, `should`, `can` prefix.
- **Handlers:** `onClick` (prop), `handleClick` (impl).

#### Comments
- **Default: none.** Identifier names carry meaning.
- **Comment WHY, never WHAT.** Allowed reasons: browser quirk, library bug workaround (link the issue), perf constraint.
- **No "added for X" / "used by Y"** comments — they rot.

#### Import ordering (blank lines between groups, alpha within)
1. External (`react`, `next/*`, `motion/react`, …)
2. Internal aliases (`@/lib/*`, `@/components/*`, `@/hooks/*`)
3. Relative (`./`, `../`)
4. Side-effect/style last (`import "./globals.css"`)

#### Folder structure
```
app/                  # Routes + layouts; globals.css is the design-token source
components/ui/        # shadcn primitives (kebab-case, named exports)
components/           # Other shared components
hooks/                # One hook per file, named export
lib/utils.ts          # cn() lives here
lib/font.ts           # next/font setup
lib/{repository,schemas,types,utils,data,content}/
tests/                # Setup + cross-cutting integration
public/               # Static assets via "/path"
docs/                 # Spec docs (plan, design-system, tech requirements)
_bmad/, _bmad-output/ # BMad workflow — do not hand-edit
```

### Development Workflow Rules

#### Package manager

- **Use `yarn`.** `yarn.lock` is authoritative. `package-lock.json` is stale legacy noise.
- **Never `npm install`** — silently diverges from yarn's resolver.
- **Adding a dependency requires user approval.** "No heavy libs" (per `docs/plan.md`) is a hard constraint.

#### Scripts

| Command | Purpose |
| --- | --- |
| `yarn dev` | Next.js dev (Turbopack) |
| `yarn build` | Production build |
| `yarn start` | Run the built app |
| `yarn lint` | ESLint |
| `yarn format` | Prettier write |
| `yarn typecheck` | `tsc --noEmit` |
| `yarn test` / `yarn test:run` | Vitest watch / single-run |

**Pre-commit:** `yarn typecheck && yarn lint && yarn test:run && yarn format`.

#### Git

- Repo exists; no commit convention documented. **Use Conventional Commits**: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`, `perf:`, `a11y:` (custom). Subject ≤72 chars.
- **Branch naming:** `feat/<short>`, `fix/<short>`, `chore/<short>`.
- **Never destructive ops** (`reset --hard`, `push --force`, `branch -D`, `clean -fdx`) without explicit user approval.
- **Never `--no-verify`** to skip hooks. Fix the underlying issue.

#### UI verification

- For any UI change, run `yarn dev` and verify in a browser:
  1. Golden path of the feature
  2. No console errors / warnings
  3. Theme toggle (`D` key) still works
  4. RTL still works (`<html dir="rtl">`)
  5. Mobile viewport (`<640px`) not broken
- **Tests/typecheck verify code, not feature behavior.** If you can't test the UI live, say so explicitly.

#### Performance budgets

- **Lighthouse 95+** across all categories. Real budget, not aspirational.
- **<100ms interaction, 60fps animations.**
- **No Three.js, no heavy libs.** Adding any package >50KB gzipped requires approval.
- **`next/image` for every image** with explicit `width`, `height`, `alt`.
- **No client-side fetching for v1** — content in typed files.

#### Deployment / CI

- **Target: Vercel.** Zero-config Next.js deploy, automatic branch previews. Add `vercel.json` only if custom headers (CSP), redirects, or rewrites are needed.
- **CI gates: Vercel's build is the default check.** Add GitHub Actions only when pre-deploy linting/tests become valuable (`yarn typecheck && yarn lint && yarn test:run`).
- **Preview branches:** every PR gets a unique URL — useful for the visual changes that dominate this project.

#### Env vars

- No `.env*` in scope (no backend in v1). When added: `NEXT_PUBLIC_*` for client-readable; never commit `.env*` except `.env.example`.

### Critical Don't-Miss Rules

#### 🎯 Spec-vs-code reconciliation (resolved 2026-05-25)

The 4 known conflicts are RESOLVED. See "Resolved Decisions" above for full context. Quick rules for agents:

1. **`docs/tech-equirements.md`** is template-legacy content. Offline-first / Time Engine / Dexie NFRs are OUT OF SCOPE. Treat the file as historical — do NOT use its NFRs to justify implementation choices. The portfolio's NFRs are: Lighthouse 95+, <100ms interaction, 60fps, WCAG AA, `prefers-reduced-motion` respect, mobile-responsive.

2. **`docs/plan.md`** is being archived to `docs/archive/plan-tanstack-original.md` and rewritten Next.js-native. Until the rewrite lands, treat the existing file as intent only and translate TanStack notation to App Router (`__root.tsx` → `app/layout.tsx`, `/$slug` → `[slug]`, `src/styles.css` → `app/globals.css`).

3. **`docs/design-system.md` is canonical.** The current `app/globals.css` (warm cream/terracotta) is wrong and will be rewritten to Obsidian + Signal Lime, dark-only. When making styling decisions, follow the design-system.md spec, NOT the current globals.css values.

4. **`lib/data/index.ts` is legacy.** Migrate to `lib/content/projects.ts` (Zod-validated, typed `Project` model per design-system.md §13). New code imports ONLY from `lib/content/*`. Once migrated, delete `lib/data/index.ts`.

#### Accessibility (non-negotiable)

- **WCAG AA contrast.** Lime-on-obsidian only passes for large text (≥18pt or 14pt bold) — never body copy.
- **`prefers-reduced-motion` gates every animation.** No exceptions.
- **Full keyboard navigation.** Tabs via `Tab`, palette via `⌘K`/`Ctrl+K`, REPL is a real `<input>`. Test mouseless.
- **Semantic HTML.** One `<h1>` per route, real `<nav>`, `<article>` for case studies. No `<div onClick>` — use `<button>`.
- **Visible focus rings** (`focus-visible:ring-1 focus-visible:ring-ring`) on every interactive element.
- **`alt` on every image.** Empty `alt=""` only for decorative.

#### Performance gotchas

- **Animate `transform` / `opacity` only** — never `top` / `left` / `width` / `height`.
- **`useInView({ once: true })`** for scroll reveals — don't re-run on backscroll.
- **Code-split heavy panels** (case studies, REPL, palette) via `dynamic(() => import(...))`.
- **`next/font/google` only** — never raw `<link rel="stylesheet" href="https://fonts.googleapis.com/...">` (blocks render).

#### Gamification edge cases

- **XP capped `[0, 100]`** — property-test with `fast-check`.
- **Versioned `localStorage` keys:** `hm_xp_v1`, `hm_unlocks_v1`, `hm_visits_v1`, `hm_recruiter_v1`. **This is the ONLY persistence layer** — no Dexie, no IndexedDB.
- **Recruiter mode is a complete UI swap**, not CSS hide — XP bar, palette, Konami, REPL hints all gone.
- **Recruiter mode toggle exposed in TWO places** (per resolved decision): a chrome button (right of identity, always visible on `≥sm` breakpoints) AND a `⌘K` palette action under the Actions group. Both read/write `localStorage["hm_recruiter_v1"]`.
- **Reduced-motion ALSO hides XP toasts and bar fill** — XP still increments silently.
- **Konami `↑↑↓↓←→←→BA`** via `keydown` sequence buffer with timeout. Skip when target is `<input>` / `<textarea>` / `contenteditable` (match `theme-provider.tsx` pattern).
- **Custom event `CustomEvent("hm:xp")`** is the cross-component bus. **Do NOT add a state library** — design is intentionally lightweight.

#### Contact form (v1 scope)

- **UI-only stub.** Submit returns a faked success after a short delay; show a sonner toast confirming "message queued."
- Build the "boss-level" UX per `plan.md`: typed terminal prompts, validation rendered as test-case results (`✓ email format`, `✓ message length`, …), keyboard-first.
- **No backend, no Resend, no env vars in v1.** Wire real email as a v1.1 follow-up.
- Form schema lives in `lib/schemas/contact.ts` (Zod). Same schema validates client-side and would validate server-side if a backend is added later.

#### Security

- **No backend means no client-side secrets.** Contact form is stubbed (above). If/when real email is wired, use a Next.js server action with `RESEND_API_KEY` server-only env var.
- **Zod validation on submit** — never trust HTML5 validation alone.
- **`dangerouslySetInnerHTML` forbidden** except for owned MDX with sanitization.
- **No external `<script>` tags.** All deps via npm.
- **CSP via `next.config.mjs` `headers()`** when going live.

#### Anti-patterns specific to this project

- ❌ Adding `tailwind.config.*` — Tailwind v4 doesn't use it.
- ❌ Importing `framer-motion` — it's `motion/react` in v12.
- ❌ Importing from `lib/data/index.ts` in new code — migrate to `lib/content/projects.ts` instead. Legacy file is scheduled for deletion.
- ❌ Adding Dexie / IndexedDB usage — it's dropped. `localStorage` is the only persistence.
- ❌ Adding a light-mode color block to `app/globals.css` — site is dark-only per resolved decision.
- ❌ Using `tech-equirements.md` NFRs to justify implementation — that file is template-legacy, out of scope.
- ❌ Hardcoding hex colors in JSX — use semantic tokens.
- ❌ Adding state-management libs (Redux/Zustand/Jotai).
- ❌ Adding a router or i18n library.
- ❌ Skipping `prefers-reduced-motion`.
- ❌ Default-exporting regular components.
- ❌ Adding heavy deps (Three.js, Lottie, large icon packs).
- ❌ Snapshot tests for JSX.
- ❌ `npm install` — yarn only.
- ❌ Removing `suppressHydrationWarning` from `<html>`.

#### Edge cases agents must handle

- **SSR/hydration mismatch on theme** — `next-themes` handled via `suppressHydrationWarning`. Don't read `localStorage` in render; use `useEffect` + mounted gate.
- **`localStorage` quota / disabled** — wrap in try/catch; XP degrades to in-memory.
- **First visit:** XP = 0, unlocks = `[]`. Don't crash on `null`.
- **Hotkey detection** must skip typing targets (input/textarea/contenteditable).
- **Browser back/forward across DevTools tabs** — each tab is a real route; panel-transition animations must not double-run.
- **RTL math for waterfall bars** — percentages must flip with `dir="rtl"`-aware calc or logical properties.
- **iOS safe-area** for mobile bottom tab bar — use `env(safe-area-inset-bottom)`.

---

## Resolved Decisions (2026-05-25)

The 7 spec-vs-code questions are resolved. Agents follow these answers as ground truth.

1. **Palette: Obsidian + Signal Lime (per `docs/design-system.md`), dark-only.**
   - Action item: rewrite `app/globals.css` tokens to match. Replace cream `#fbf6ef` / terracotta `#c64a2b` with Obsidian `#0B0D10` base + Signal Lime `#C6F24E` accent.
   - Swap fonts: Geist Mono → **IBM Plex Mono**; Inter + Fraunces → **Inter Tight** (and a serif title font per spec; if a separate title font is needed, propose before adding).
   - Remove the `:root` light-mode variables. Site is dark-only — the light/dark CSS swap goes away.
   - The `next-themes` provider stays for the `D` key hotkey infrastructure, but `defaultTheme="dark"` with no system option.

2. **`docs/plan.md`: archive and rewrite from scratch.**
   - Move existing `docs/plan.md` to `docs/archive/plan-tanstack-original.md` (preserve for reference).
   - Write a fresh `docs/plan.md` that is Next.js 16 App Router native: `app/layout.tsx`, `app/work/[slug]/page.tsx`, `app/globals.css`, etc.
   - Carry forward the IA, gamification mechanics, and build phases; drop TanStack-specific notation.
   - This is the natural job of the next BMad step (`/bmad-prd` or `/bmad-create-architecture`).

3. **Content: migrate `lib/data/index.ts` now to typed `lib/content/projects.ts`.**
   - Build Zod schemas for `Project`, `Experience`, `Skill`, `Profile` per the typed content model in `docs/design-system.md` §13.
   - Transform existing legacy data into the new shape (fill `slug`, `method`, `status`, `statusCode`, etc.; some fields will need new authoring).
   - Delete `lib/data/index.ts` after migration. New code imports ONLY from `lib/content/*`.

4. **Dexie: dropped entirely.** All persistence is `localStorage`.
   - Action item: run `yarn remove dexie dexie-react-hooks fake-indexeddb`. Update `tests/setup.ts` to remove the fake-indexeddb import.
   - `lib/repository/` folder is no longer needed for a Dexie wrapper — remove if empty.
   - The "offline-first" NFR in `docs/tech-equirements.md` is dropped from scope. The XP / unlocks / visits / recruiter-mode state fits in `localStorage` (small bounded data).

5. **Contact form: UI-only stub in v1.**
   - Build the "boss-level" typed-prompts UX per `plan.md` (validation-as-tests visual, terminal cadence).
   - Submit returns a faked success after a brief delay; show a sonner toast.
   - No backend, no secrets, no third-party dependency. Wire real email (Resend) as a v1.1 follow-up if/when needed.

6. **Recruiter Mode toggle: both chrome button AND command palette.**
   - Visible toggle in the top chrome (right-aligned, near identity name).
   - "Toggle Recruiter Mode" command in `⌘K` palette under the **Actions** group.
   - State stored in `localStorage["hm_recruiter_v1"]`. Single source of truth; both UI surfaces read/write the same key.

7. **Deployment: Vercel.**
   - Zero-config deploy. Branch previews automatic.
   - Add a `vercel.json` only if non-default headers (CSP), redirects, or rewrites are required.
   - CI: rely on Vercel's build for typecheck + build verification. Add GitHub Actions only when the project grows enough to need pre-deploy gates (`yarn typecheck && yarn lint && yarn test:run`).

---

## Source Documents

- `docs/design-system.md` — **CANONICAL.** Visual system spec (Obsidian + Lime, dark-only, IBM Plex Mono + Inter Tight).
- `docs/plan.md` — **Pending rewrite.** Treat as intent; will be archived to `docs/archive/plan-tanstack-original.md` and rewritten Next.js-native.
- `docs/tech-equirements.md` — **DEPRECATED.** Template-legacy NFRs from a todo app — do not use to justify implementation.
- `lib/data/index.ts` — **DEPRECATED.** Legacy resume content; migrate to `lib/content/projects.ts` (Zod-validated typed model).
- Live config: `package.json`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.ts`, `.prettierrc`, `components.json`, `app/globals.css` (the last one is currently wrong-palette — will be rewritten).

---

## Usage Guidelines

**For AI Agents:**
- Read this file before implementing any code.
- Follow ALL rules exactly. When rules and `docs/` specs conflict, the rule in this file wins.
- When in doubt, prefer the more restrictive option.
- The 4 "document conflicts" (above) MUST be surfaced to the user — never silently resolved.

**For Humans:**
- Keep this file lean and focused on agent needs.
- Update when the technology stack or design system changes.
- Review quarterly; remove rules that have become obvious or obsolete.
- Re-run `bmad-generate-project-context` to refresh from current state.

_Last Updated: 2026-05-25 (7 spec-vs-code questions resolved)_
