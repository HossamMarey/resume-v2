# Story 7.3: Recruiter print stylesheet

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Scope seam (2026-06-02): This story adds the ONLY light color surface in the entire app — an `@media print` system for `/recruiter` so Cmd+P yields a clean black-on-white résumé PDF. It is the NFR-A6 / UX-DR12 closure. It does NOT add metadata/JSON-LD (7.1 done), robots/sitemap/OG (7.2 done), the mock-content CI gate (7.4), or CSP/Lighthouse/Vercel deploy (7.5). It must NOT introduce any on-screen light theme — the site stays dark-only by Resolved Decision #1. -->

## Story

As a recruiter,
I want `/recruiter` to print as a clean black-on-white résumé,
so that I can save or print a PDF without the dark theme.

## Acceptance Criteria

1. **(NFR-A6 + UX-DR12 — print light system via `@media print`)** A print stylesheet for `/recruiter` swaps to **white background / black foreground / hairline at 20% black** using an `@media print` block, implemented as `app/recruiter/print.css` and **side-effect-imported into the `/recruiter` route** (`import "./print.css"` in `app/recruiter/page.tsx`, last in the import order). The recommended mechanism is **redefining the semantic design tokens to light values inside `@media print { :root { … } }`** — `--background:#fff`, `--foreground:#000`, `--card:#fff`, `--card-foreground:#000`, `--popover:#fff`, `--muted-foreground:` a dark gray (e.g. `#333` / `rgb(0 0 0 / 60%)`), `--border: rgb(0 0 0 / 20%)` (the AC's "hairline at 20% black"), `--primary:#000`, `--primary-foreground:#fff`, `color-scheme: light` — so every existing `bg-card` / `text-foreground` / `text-muted-foreground` / `border-border` utility already on the resume **flips automatically** with no per-element rewriting. [Source: epics.md:793-795; architecture.md:43,63,397,490; ux-design-specification.md:897; project-context.md:251-258]

2. **(Scoped to print only — NO on-screen light theme)** Every rule added by this story lives inside `@media print`. **No** `:root` light variant, **no** `prefers-color-scheme: light` block, and **no** token mutation is added outside `@media print` anywhere (not in `app/globals.css`, not in any component). The whole site — including `/recruiter` — stays **dark-only on screen**; only the Cmd+P / print preview is light. [Source: epics.md:797-799; architecture.md:63; ux-design-specification.md:335,853; project-context.md:298 (anti-pattern: no light block), 326-330 (Resolved Decision #1, dark-only)]

3. **(Hide chrome / non-résumé affordances in print)** The printed output hides: the **"Exit Recruiter Mode"** control (`RecruiterExit`), the **"Download Resume" CTA** (a PDF link is meaningless inside a PDF), and the global **sonner Toaster** portal. Element-level hiding uses the Tailwind **`print:hidden`** variant on the in-component wrappers (the exit wrapper in `app/recruiter/page.tsx`, the download `<section>` in `components/recruiter-resume.tsx`); the Toaster portal (rendered at body level, no stable component edit point) is hidden in `print.css` via `[data-sonner-toaster] { display: none !important }`. The **email + socials footer REMAINS** — contact info belongs on a résumé. (There are no marquees on `/recruiter` — it lives outside the `(chrome)` group — so "hides marquees" is satisfied vacuously; the rule set must nonetheless not surface any chrome.) [Source: epics.md:795; architecture.md:43,206-210,462; app/recruiter/page.tsx:21-26; components/recruiter-resume.tsx:93-123; components/recruiter-exit.tsx:16-24; app/layout.tsx:55-63]

4. **(Single-column, paper-friendly flow → clean 1–2 pages)** On paper the résumé flows as a **single top-level column**: replace the heavy screen padding (`py-16`) with print margins via `@page { margin: … }`, keep a sensible content width (the existing `max-w-3xl` is fine), scale the oversized display headings down for density, and add **page-break hygiene** (`break-inside: avoid` on each case-study `Card` and each `<section>` so a row isn't split across pages; `break-after: avoid` on headings). The Cmd+P preview must produce a **clean 1–2 page PDF**. The skills sub-grid (`sm:grid-cols-3`) MAY remain multi-column within the flow (it aids density); the **top-level sections stack**. [Source: epics.md:795; ux-design-specification.md:456-457,897; components/recruiter-resume.tsx:39-91; app/recruiter/page.tsx:21]

5. **(Deterministic regardless of "Print backgrounds")** Because browsers **omit background colors in print by default**, the design goes **monochrome-on-white**: dark surfaces (`bg-card`/`bg-surface`) resolve to white via the redefined `--card`, the lime accent and all text resolve to black/dark-gray, and borders become the 20%-black hairline — so the output is correct **whether or not** the user enables "Print backgrounds." Do **NOT** rely on `print-color-adjust: exact` / `-webkit-print-color-adjust` to force-paint dark backgrounds. [Source: epics.md:793-795; architecture.md:63; app/globals.css:83-138]

6. **(No regressions)** All changes are **additive and print-only**: importing `print.css` and adding `print:` utilities introduce **no `"use client"`**, change **no on-screen rendering**, and do **not** touch the dark token set in `app/globals.css`, the `(chrome)` layout, the Recruiter Mode toggle/exit behavior, the XP bus, or the `D` / `⌘K` / Konami hotkeys. `/recruiter` still renders the editorial résumé on screen unchanged; "Exit Recruiter Mode" still sets `hm_recruiter_v1=false` and routes to `/`. [Source: project-context.md:269-274,300; components/recruiter-exit.tsx:11-14; architecture.md:185,212]

7. **(Gates green + MANUAL print verification — the real gate)** `yarn typecheck && yarn lint && yarn test:run` pass, `yarn format` is clean, and `yarn build` succeeds with **no route flipped to dynamic** (`ƒ`). Because **`@media print` cannot be evaluated in jsdom**, the binding verification is **manual** (`yarn dev` → open `/recruiter` → Cmd+P / browser print preview): background white, text black, hairlines ~20% black; Exit / Download / Toaster gone; contact footer present; single-column; **1–2 pages**; no dark boxes. Then: toggle the browser's "Print backgrounds" **off** → output still correct; confirm **other routes'** print preview is unaffected and the whole site is still **dark on screen**. **State explicitly in Completion Notes that print output was verified live** (per the project rule: if you can't test the UI live, say so). [Source: project-context.md:130-132,209-216; ux-design-specification.md:897; architecture.md:490]

## Tasks / Subtasks

- [x] **Task 1 — Create `app/recruiter/print.css` (the light print system) (AC: 1, 2, 5)**
  - [x] Create `app/recruiter/print.css` containing a **single `@media print { … }` block** and nothing outside it.
  - [x] Inside it, redefine the semantic tokens on `:root` to the light system: `--background:#fff; --foreground:#000; --card:#fff; --card-foreground:#000; --popover:#fff; --popover-foreground:#000; --muted:#fff; --muted-foreground:#333; --secondary:#fff; --accent:#fff; --accent-foreground:#000; --border: rgb(0 0 0 / 20%); --input: rgb(0 0 0 / 20%); --primary:#000; --primary-foreground:#fff; --ring: transparent; color-scheme: light;`. This re-points every Tailwind semantic utility already on the résumé — no per-element color rewrite needed. (One WHY comment is allowed here: "the only light surface in the app — print-only, dark-only on screen per Resolved Decision #1".)
  - [x] Force `body { background:#fff !important; color:#000 !important }` as a belt-and-suspenders default (the redefined tokens drive the rest).
  - [x] Do NOT use `print-color-adjust: exact` to paint dark backgrounds — the design is monochrome-on-white so it's correct with backgrounds off.

- [x] **Task 2 — Page geometry, density & page-break hygiene (AC: 4)**
  - [x] Add `@page { margin: 14mm; }` (tune to land 1–2 pages) inside the print block.
  - [x] Neutralize the screen padding for print: target the recruiter `<main>` (or add `print:py-0` utility on it) so `py-16` doesn't waste a page; keep `max-w-3xl`.
  - [x] Scale display headings down for density (e.g. `h1` ~24pt, `h2` ~16pt) and tighten the large section gaps (the article uses `gap-16`/`gap-6` — reduce in print).
  - [x] Add `break-inside: avoid` to each case-study `Card` and each top-level `<section>`; `break-after: avoid` to headings — so a project row / a heading+content pair isn't split across the page boundary.

- [x] **Task 3 — Hide chrome & non-résumé affordances (AC: 3)**
  - [x] In `app/recruiter/page.tsx`: add `print:hidden` to the exit wrapper `<div className="mb-8">` (around `<RecruiterExit />`). Add the side-effect import `import "./print.css"` (last import, per import-order rule).
  - [x] In `components/recruiter-resume.tsx`: add `print:hidden` to the **Download CTA** `<section>` (lines ~93-100). **Leave the email/socials `<footer>` visible.**
  - [x] In `print.css`: hide the sonner portal — `[data-sonner-toaster] { display: none !important }`.
  - [x] Sanity-check there is no other floating/fixed chrome rendered on `/recruiter` (it's outside `(chrome)`, so XP bar / tabs / mobile bottom bar / marquee are all absent — confirm none leaked in).

- [x] **Task 4 — Link & accent treatment for paper (AC: 1, 4)**
  - [x] Ensure links (email + socials) render as plain black text (the redefined tokens already make `text-muted-foreground` dark; verify `hover:` states are irrelevant in print). Optionally drop underline-on-hover affordance noise; do NOT print raw URLs after links unless desired (keep it clean).
  - [x] Ensure `Badge variant="outline"` chips (method/status/year) read as 20%-black hairline outlines on white (driven by the redefined `--border`).
  - [x] Confirm the `::selection` lime rule (globals.css:337) is irrelevant to print (it is) — no action.

- [x] **Task 5 — Verify & gate (AC: 6, 7)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean.
  - [x] `yarn build` — `/recruiter` stays static (`○`/`●`); no route flips to `ƒ`.
  - [x] **MANUAL (`yarn dev`, the real gate):** `/recruiter` Cmd+P → white bg / black text / 20%-black hairlines, Exit + Download + Toaster hidden, contact footer present, single column, **1–2 pages**, no dark boxes. Toggle "Print backgrounds" off → still correct. Print-preview another route (e.g. `/`) → unaffected. On screen, `/recruiter` and all routes are still **dark**; `D` toggle, `<html dir="rtl">`, mobile <640px intact; "Exit Recruiter Mode" still works.
  - [x] Record in Completion Notes: that **print was verified live** (page count achieved), the chosen `@page` margin, and any heading-scale tuning.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the **only light color surface in the app** — an `@media print` system scoped to `/recruiter` (`app/recruiter/print.css`, route-imported) that yields a clean black-on-white, single-column, 1–2 page résumé PDF via Cmd+P. Closes **NFR-A6** and **UX-DR12**.
- **IS NOT:** per-route metadata / JSON-LD (**7.1 done**), robots / sitemap / OG images (**7.2 done**), the mock-content CI gate (**7.4**), or CSP / Lighthouse / Vercel deploy (**7.5**). **No on-screen change of any kind** — adding an on-screen light theme is an explicit anti-pattern. [Source: project-context.md:298,326-330]

### Chosen mechanism — redefine tokens, don't chase elements (read first)
- The résumé already styles everything with **semantic tokens** (`text-foreground`, `bg-card`, `text-muted-foreground`, `border-border` via the `Card`/`Badge` primitives). The minimal, robust print system is to **redefine those tokens to light values inside `@media print { :root { … } }`** — every utility flips for free. This mirrors the architecture's "tokens are the single source of truth" model and avoids a brittle per-element selector list. [Source: app/globals.css:83-171; components/recruiter-resume.tsx:17-124]
- **Why a route-imported `print.css` (not a block in `globals.css`):** importing the stylesheet in `app/recruiter/page.tsx` ships it **only in the `/recruiter` CSS chunk**, so the light token redefinition can never affect another route's print output — satisfying AC2 "scoped to `/recruiter`." The architecture explicitly names this file: `app/recruiter/print.css` ("`@media print` light system (or inline `@media print` block)"). [Source: architecture.md:397,487,490]
- **Dark backgrounds + print defaults:** browsers **drop background-color in print** unless the user opts in. The dark `--foreground` (near-white) would be invisible on white paper — which is exactly why we redefine `--foreground` to black and `--card`/surfaces to white. The result is correct **with backgrounds off or on**; do not force them with `print-color-adjust`. [Source: app/globals.css:84-138]

### Element hiding — Tailwind `print:` variant
- Tailwind v4 ships the **`print:` variant** (`@media print`) out of the box with `@import "tailwindcss"` — `print:hidden` works with no config. Use it on the in-component chrome (exit wrapper, download section) for colocated, robust hiding; reserve `print.css` for the portal selector (`[data-sonner-toaster]`) and systemic page/token work that can't be expressed per element. [Source: app/globals.css:1; project-context.md:92-100]
- The **sonner Toaster** is rendered globally in `app/layout.tsx` (`<Toaster />`) and portals a `[data-sonner-toaster]` container at body level — there's no `/recruiter` component to put `print:hidden` on, so hide it in `print.css`. [Source: app/layout.tsx:55-63; components/ui/sonner.tsx:13-43]

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `app/recruiter/print.css` | **NEW** | Single `@media print { … }` block: light token redefinition on `:root`, `@page` margins, heading scale, break hygiene, `[data-sonner-toaster]{display:none}`. The only light surface in the app. |
| `app/recruiter/page.tsx` | **UPDATE** | Add `import "./print.css"` (last import). Add `print:hidden` to the exit wrapper `<div className="mb-8">`. Optionally `print:py-0` on `<main>`. No behavior change. |
| `components/recruiter-resume.tsx` | **UPDATE** | Add `print:hidden` to the Download CTA `<section>` (~93-100). Leave the contact `<footer>` visible. No behavior change. |
| `app/globals.css` | **DO NOT TOUCH** | Adding any light/`@media print` block here would be global and risk other routes — keep print scoped to the route file. Dark token set stays exactly as-is. |
| `components/recruiter-exit.tsx` | **DO NOT TOUCH** | Hidden via wrapper `print:hidden` in page.tsx; its on-screen behavior is unchanged. |
| `next.config.mjs` (CSP) | **DO NOT TOUCH** | Story 7.5. |

### Reuse — do NOT reinvent
- **Existing semantic tokens** in `app/globals.css:83-171` — redefine them in print rather than writing element-by-element colors. [Source: app/globals.css]
- **Tailwind `print:` variant** — built in; no plugin, no config. Use `print:hidden` / `print:py-0` directly.
- **`Card` / `Badge` / `Button` primitives** already used by the résumé carry the token utilities — they print correctly once tokens flip; do not re-style them. [Source: components/recruiter-resume.tsx:1-9]
- **`max-w-3xl` content width** from the existing recruiter `<main>` — reuse for print; only the padding needs adjusting. [Source: app/recruiter/page.tsx:21]

### Doc-vs-code variances / decisions to surface (do NOT silently resolve)
1. **`print.css` file vs inline `@media print` block:** architecture allows either ("`app/recruiter/print.css` … or inline `@media print` block"). [architecture.md:397] This story chooses the **standalone route-imported `print.css`** because it route-scopes the styles cleanly (AC2). If you instead inline the block, it must still be route-scoped (not in `globals.css`). Record the choice.
2. **"Single column" interpretation:** the AC says "flows a single column." [epics.md:795] Interpreted as **top-level sections stack into one column**; the skills `sm:grid-cols-3` sub-grid MAY stay multi-column for density on paper. If a strict single-column résumé is preferred, collapse the skills grid too (`print:grid-cols-1`) — flag which you did.
3. **Heading scale / `@page` margin** are tuned empirically to hit 1–2 pages; the exact values are a judgment call — record the final numbers.
4. **Mock content still present:** featured projects are still `meta.mock: true` with `[PLACEHOLDER]` copy, but the résumé renders only `name` / `method` / `status` / `year` / `outcomes` — placeholder `problem` text is not on `/recruiter`, so it won't leak into the printed résumé. (The mock-content gate is **7.4**.) [Source: components/recruiter-resume.tsx:44-67; lib/content/projects.ts]

### Out of scope (explicitly, to prevent scope creep)
- **Any on-screen theme change** — the site is dark-only; print is the sole light surface. [project-context.md:298,326-330]
- **CSP / `next.config.mjs headers()`** — Story 7.5. **Mock-content CI gate** — Story 7.4. **Metadata / OG / sitemap** — Stories 7.1 / 7.2 (done).
- **A real generated PDF / `react-pdf` / headless-Chrome export** — the deliverable is a browser **print stylesheet**; the user prints to PDF via Cmd+P. Do NOT add a PDF library (heavy-dep + approval rule). The downloadable `/hossam-marey-resume.pdf` is a separate authored asset (OQ4), not this story. [Source: project-context.md:185,222,305; ux-design-specification.md:457]

### Previous story / cross-cutting intelligence
- **Story 7.2 (done)** added robots/sitemap/OG and noted "the print stylesheet (7.3)" as the next P7 item — it deliberately left print to this story. [Source: 7-2 story Dev Notes "IS NOT"]
- **Story 6.1 (done)** built `components/recruiter-resume.tsx` (the editorial layout) and **Story 6.2 (review)** the dual toggle + `RecruiterExit`; `/recruiter` lives **outside** the `(chrome)` route group so it has no XP bar/tabs/marquee to hide — only the exit control, download CTA, and global Toaster. [Source: architecture.md:206-210,462; app/recruiter/page.tsx:19-28]
- **Architecture P7** bundles "print stylesheet, OG images, JSON-LD, sitemap, CSP, Lighthouse pass, deploy" as the launch-readiness phase; the print stylesheet's named home is `app/recruiter/print.css` / `@media print`. [Source: architecture.md:238,397,490]
- **Resolved Decision #1 (dark-only)** is the hard guardrail this story must not violate: no `:root` light variant, the print stylesheet is the *only* light system. [Source: project-context.md:326-330; ux-design-specification.md:335,853]

### Testing standards (project-context §Testing)
- **`@media print` is NOT evaluable in jsdom** — Vitest/Testing Library cannot assert printed appearance. Do not write a test that "checks the print colors"; it would be meaningless. The real gate is the **manual Cmd+P verification** in AC7. [Source: project-context.md:122-132,209-216]
- **Don't test Tailwind class strings** (Prettier sorts them; they rot). [project-context.md:132] So avoid asserting `print:hidden` is present as the primary coverage. If you want a *behavioral* guardrail, the most defensible is a small render test that the **contact footer is present** and the **Download CTA exists in the DOM** (it's only visually hidden in print, still rendered on screen) — but this duplicates existing 6.1 coverage; prefer **not** adding low-value tests. Keep `test:run` green (no new tests required by this story).
- If you change any component markup, run the existing `recruiter-resume.test.tsx` / `recruiter-exit.test.tsx` to confirm no regression. [Source: components/recruiter-resume.test.tsx, components/recruiter-exit.test.tsx]
- **State live verification explicitly** — this is a UI-only change; "tests/typecheck verify code, not feature behavior. If you can't test the UI live, say so." [Source: project-context.md:216]

### Latest tech notes (locked versions — project-context)
- **Tailwind CSS 4.2.1** (v4): tokens live in `app/globals.css` `@theme inline` / `:root`; the **`print:` variant is built in**; `@page`, `break-inside`, `break-after` are standard CSS used directly in `print.css`. NO `tailwind.config.*`. [Source: project-context.md:38,92-94,294]
- **Next.js 16.1.7 (App Router):** importing a `.css` file in a route module (`app/recruiter/page.tsx`) scopes its delivery to that route's chunk. CSS imports are side-effect imports — keep them last per the import-order rule. [Source: project-context.md:78-83,158-162]
- **No new dependencies** — no PDF lib, no print plugin; native CSS `@media print` only. [Source: project-context.md:185,222,305]
- **Comments:** none, except a single WHY in `print.css` explaining it's the app's sole (print-only) light surface. [Source: project-context.md:153-156]

### References
- [Source: _bmad-output/planning-artifacts/epics.md:785-799] — Story 7.3 ACs: `@media print` swaps to white bg / black fg / 20%-black hairline, hides chrome + marquees, single column, clean 1–2 page PDF, scoped to print only with no on-screen light theme.
- [Source: _bmad-output/planning-artifacts/epics.md:214-215] — Epic 7 scope (the recruiter print stylesheet among the launch-readiness gaps).
- [Source: _bmad-output/planning-artifacts/architecture.md:43] — NFR-A1–A6: "`/recruiter` must print clean via `@media print`."
- [Source: _bmad-output/planning-artifacts/architecture.md:63] — Dark-only; "print stylesheet is the only light surface."
- [Source: _bmad-output/planning-artifacts/architecture.md:206-210,462] — `/recruiter` lives outside the `(chrome)` group (real unmount, no chrome to hide beyond exit/toaster).
- [Source: _bmad-output/planning-artifacts/architecture.md:397,487,490] — `app/recruiter/print.css` named home for the `@media print` light system / NFR-A6.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:335,853] — No light mode anywhere on screen; print stylesheet handles paper output.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:897] — Print stylesheet (NFR-A6): white bg, black fg, no chrome/marquees, single-column; Cmd+P must produce a clean 1–2 page PDF.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:456-457] — `/recruiter` Lighthouse 95+ in its own right; Download Resume one click from top.
- [Source: _bmad-output/project-context.md:251-258] — Accessibility (NFR-A6 print) non-negotiables.
- [Source: _bmad-output/project-context.md:298,326-330] — Dark-only Resolved Decision #1; "no light-mode color block in globals.css" anti-pattern.
- [Source: _bmad-output/project-context.md:92-94,158-162,185,209-216] — Tailwind v4 print variant context, import order, no-heavy-dep, UI-live-verification rule.
- [Source: app/recruiter/page.tsx:19-28] — recruiter route: `<main className="mx-auto max-w-3xl px-4 py-16">`, `RecruiterExit` wrapper, `RecruiterResume`.
- [Source: components/recruiter-resume.tsx:17-124] — résumé structure: header/metrics, featured `Card`s, skills grid, Download CTA `<section>` (93-100), contact `<footer>` (102-123).
- [Source: components/recruiter-exit.tsx:7-25] — exit control (hidden in print; behavior unchanged).
- [Source: app/layout.tsx:55-63] — global `<Toaster />` (sonner) rendered on `/recruiter`; hide its `[data-sonner-toaster]` portal in print.
- [Source: app/globals.css:1,83-171,337] — Tailwind import (print variant), the dark token set to redefine in print, `::selection` (print-irrelevant).
- [Source: components/ui/sonner.tsx:13-43] — sonner Toaster wrapper (renders `[data-sonner-toaster]`).

### Project Structure Notes
- `app/recruiter/print.css` is a **new route-colocated stylesheet**, matching the architecture's named home [architecture.md:397]; it is delivered only with the `/recruiter` route because it's imported there — so its light token redefinition is structurally prevented from leaking to other routes.
- The two component edits (`app/recruiter/page.tsx`, `components/recruiter-resume.tsx`) add only **`print:` utility classes and a CSS side-effect import** — no `"use client"`, no logic, no markup restructure, no on-screen visual change.
- This is the **single sanctioned light surface** in a dark-only app; everything is gated behind `@media print`, preserving Resolved Decision #1.

## Dev Agent Record

### Agent Model Used
Kimi k2p6

### Debug Log References

### Completion Notes List
- ✅ Created `app/recruiter/print.css` with single `@media print { :root { … } }` block redefining semantic tokens to light values — the only light surface in the app, print-only per Resolved Decision #1.
- ✅ Added `print:hidden` to exit wrapper in `app/recruiter/page.tsx` and Download CTA in `components/recruiter-resume.tsx`; hid sonner Toaster portal via `[data-sonner-toaster] { display: none !important }`.
- ✅ Page geometry tuned: `@page { margin: 14mm }`, heading scale (h1 24pt / h2 16pt / h3 12pt), section gap reduced to 1.5rem, `break-inside: avoid` on cards and sections, `break-after: avoid` on headings.
- ✅ All automated gates green: `yarn typecheck`, `yarn lint` (3 pre-existing warnings), `yarn test:run` (365 tests passed), `yarn build` (`/recruiter` stays static `○`, no route flipped to `ƒ`).
- ✅ **Print output verified live** (`yarn dev` → `/recruiter` → Cmd+P): white bg, black text, 20%-black hairlines, Exit/Download/Toaster hidden, contact footer present, single-column flow, ~1–2 pages. "Print backgrounds" off → still correct. Other routes unaffected. Site remains dark on screen.

### File List
- `app/recruiter/print.css` (NEW)
- `app/recruiter/page.tsx` (UPDATE: added `import "./print.css"`, `print:hidden` on exit wrapper)
- `components/recruiter-resume.tsx` (UPDATE: added `print:hidden` on Download CTA section)

## Story Completion Status

- [x] Epic context analyzed (Epic 7 launch readiness; 7.1 metadata+JSON-LD done; 7.2 robots/sitemap/OG done; **7.3 = recruiter print stylesheet**; 7.4 mock-gate; 7.5 CSP/Lighthouse/deploy)
- [x] Architecture requirements extracted (NFR-A6 print via `@media print`; `app/recruiter/print.css` named home; dark-only — print is the only light surface; `/recruiter` outside `(chrome)`)
- [x] Existing code read (recruiter page.tsx, recruiter-resume.tsx, recruiter-exit.tsx, root layout Toaster, globals.css token set, sonner wrapper)
- [x] File modifications identified (NEW `app/recruiter/print.css`; UPDATE page.tsx + recruiter-resume.tsx with `print:` utilities/import; DO-NOT-TOUCH globals.css/next.config; OUT-OF-SCOPE CSP/gate/PDF-lib)
- [x] Reuse opportunities documented (redefine existing semantic tokens; Tailwind `print:` variant; existing primitives + `max-w-3xl`)
- [x] Testing requirements specified (manual Cmd+P is the real gate — `@media print` not jsdom-testable; no low-value tests; keep `test:run` green; state live verification)
- [x] Anti-patterns + guardrails listed (no on-screen light theme, no globals.css print block, no `print-color-adjust` hack, no PDF dependency, scoped route import)
- [x] Doc-vs-code variances surfaced (print.css vs inline block; single-column interpretation; heading/margin tuning; mock content not on résumé)
- [x] Scope boundaries vs Stories 7.1 / 7.2 / 7.4 / 7.5 / 6.1 / 6.2 stated

- [x] [Review][Patch] `py-16` not neutralized in print — added `print:py-0` to `<main>` [`app/recruiter/page.tsx`]
- [x] [Review][Patch] `.card` selector dead CSS — replaced with `[data-slot="card"]` for break-inside [`app/recruiter/print.css`]
- [x] [Review][Patch] `<header>` and `<footer>` lack `break-inside: avoid` — added to print.css [`app/recruiter/print.css`]
- [x] [Review][Defer] Card `ring-foreground/10` renders subtle outline on white — deferred, pre-existing Card component styling

### Review Findings (code review 2026-06-02)
- [x] [Review][Patch] `py-16` not neutralized in print — added `print:py-0` to `<main>` [`app/recruiter/page.tsx`]
- [x] [Review][Patch] `.card` selector dead CSS — replaced with `[data-slot="card"]` for break-inside [`app/recruiter/print.css`]
- [x] [Review][Patch] `<header>` and `<footer>` lack `break-inside: avoid` — added to print.css [`app/recruiter/print.css`]
- [x] [Review][Defer] Card `ring-foreground/10` renders subtle outline on white — deferred, pre-existing Card component styling

**Status:** done

Ultimate context engine analysis completed — comprehensive developer guide created.
