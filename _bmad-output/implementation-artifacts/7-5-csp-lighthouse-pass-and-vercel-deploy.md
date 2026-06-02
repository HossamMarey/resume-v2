# Story 7.5: CSP, Lighthouse pass, and Vercel deploy

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Scope seam (2026-06-02): This is the FINAL launch-readiness story. It ships THREE things:
     (1) SECURITY HEADERS — a CSP (+ standard hardening headers) via `next.config.mjs` `headers()`, seeded from addendum §9's permissive starter, dev-relaxed so Turbopack HMR survives (NFR-SE4 / A15);
     (2) A PERFORMANCE/A11y/SEO AUDIT to back the Lighthouse-95 claim — confirm transform/opacity-only animation, heavy-route code-splitting, and next/image+next/font discipline across the existing codebase (NFR-P1/P2/P5/P6); it does NOT rebuild features, only audits + fixes gaps it finds;
     (3) DEPLOY VERIFICATION — confirm the project deploys zero-config on Vercel with yarn, PR previews work, and the prod build is the default CI check (NFR-O1/O2).
     It does NOT author case-study content (that is OQ4, Hossam-owned — and the 7.4 `content-gate` job stays RED until then, so the PRODUCTION launch is intentionally blocked even after this story's code lands).
     It does NOT redesign UI, add features, or touch `lib/content` data. -->

## Story

As Hossam (site owner),
I want the production site to pass Lighthouse 95+ with security headers and deploy on Vercel,
so that the artifact's performance/a11y claims are demonstrably true on the live URL.

## Acceptance Criteria

1. **(NFR-SE4 + A15 — CSP + security headers via `next.config.mjs`)** `next.config.mjs` exports an `async headers()` that applies a `Content-Security-Policy` to all routes (`source: "/(.*)"`), seeded from the addendum §9 starter — `default-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; script-src 'self' 'unsafe-inline'` — plus `connect-src 'self'` (the contact form POSTs same-origin to `/api/contact`). The same `headers()` adds standard hardening headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY` (or `frame-ancestors 'none'` in the CSP), and `Permissions-Policy` denying `camera`/`microphone`/`geolocation`. Headers are present on a real response (`curl -I` or DevTools → Network → response headers on `yarn start`). [Source: epics.md:829-831; addendum.md:575-590; architecture.md:46,179,226; prd.md:299 (NFR-SE4), 469 (A15 Confirmed); project-context.md:290]

2. **(CSP must not break dev or the existing app — the critical gotcha)** The CSP is **relaxed in development** so Turbopack HMR survives: in `NODE_ENV !== "production"` the policy adds `'unsafe-eval'` to `script-src` and `ws:` + the dev origin to `connect-src` (Turbopack's HMR uses eval + a websocket). `'unsafe-inline'` on **both** `script-src` and `style-src` is **kept in production** because (a) `next-themes` injects a blocking inline `<head>` script to set the theme class pre-paint, and (b) JSON-LD ships as inline `<script type="application/ld+json">` via `components/json-ld.tsx`, and (c) Next.js / Tailwind v4 emit inline styles. Document inline-removal (nonce/hash) as the **deferred hardening path** (architecture "tighten before live"), not done in this story. Verify after adding the header: `yarn dev` HMR works, theme `D`-key toggle works with no console CSP violations, JSON-LD renders, the `⌘K` palette / Console REPL / Konami / contact form all still function. [Source: app/layout.tsx (next-themes inline script via ThemeProvider); components/json-ld.tsx:5-15; addendum.md:590 ("tighten before live by removing 'unsafe-inline'…"); architecture.md:179]

3. **(NFR-P5 — animation discipline audit)** Confirm every animation in the codebase animates **`transform`/`opacity` only** (never `top`/`left`/`width`/`height`) and is gated by `prefers-reduced-motion`. This is an **audit + fix-on-find**, not a rewrite: grep `framer-motion`/`animate`/`transition` usages and the stack marquee / score rings / panel transitions; fix any layout-animating property found, else record "audited, compliant" in Completion Notes with the files checked. [Source: epics.md:827; prd.md:266,269 (NFR-P2/P5); project-context.md:105-107,261-262]

4. **(NFR-P6 — heavy-route code-splitting audit)** Confirm the three heavy routes named in the architecture are code-split via `dynamic(() => import(...))`: `/console` ✅ and `/work/[slug]` ✅ already are; **evaluate `/sources`** (architecture.md:216 lists it; today its `SourcesPanel` is a static import) — either code-split it via `dynamic()` **or** record an explicit, reasoned exception in Completion Notes if its panel is light enough that splitting adds no measurable benefit (the panel is a server-rendered file-tree, not an interactive engine). Do **not** un-split `/console` or `/work/[slug]`. [Source: epics.md:827; prd.md:270 (NFR-P6); architecture.md:216; app/(chrome)/console/page.tsx:1-4, app/(chrome)/work/[slug]/page.tsx:1-14, app/(chrome)/sources/page.tsx (static SourcesPanel import)]

5. **(NFR-P3 + asset discipline audit)** Confirm **no external `<script>` tags and no external `<link rel="stylesheet">"`** exist (fonts are `next/font/google` self-hosted), and **every image uses `next/image`** with explicit `width`/`height`/`alt` (no raw `<img>`). Grep for `<img`, `googleapis.com`, `<link rel="stylesheet"` and report findings. [Source: epics.md:827; prd.md:267,268 (NFR-P3/P4); project-context.md:223,264,289]

6. **(NFR-O1 + NFR-O2 — Vercel deploy verification with yarn)** Confirm the project deploys **zero-config on Vercel** with **yarn** as the package manager (`yarn.lock` authoritative; the existing CI `quality` job uses `yarn install --frozen-lockfile`). Provide a `vercel.json` **only if** the CSP is chosen to live there instead of `next.config.mjs` (this story's default is `next.config.mjs` `headers()`, so `vercel.json` stays absent unless redirects/rewrites are needed). The production `next build` is the default check (the 7.4 `quality` CI job already runs `yarn build`); confirm it stays green and **no route unexpectedly flips to dynamic (`ƒ`)** after adding `headers()`. PR-preview URLs and the live Lighthouse run on the deployed URL are **Hossam-owned ops verification** — the dev agent documents the exact steps and uses local `yarn build` + a local Lighthouse run against `yarn start` as the in-repo proxy, stating explicitly that the live-URL ≥95 measurement is verified by Hossam post-deploy. [Source: epics.md:833-835; prd.md:303-304 (NFR-O1/O2); architecture.md:222-226; addendum.md:565-573; 7-4 story: CI quality job already builds; project-context.md:216,228-229]

7. **(Launch is content-gated — do not fake green)** This story makes the site **technically** launch-ready (headers, perf discipline, deploy path), but the **7.4 `content-gate` CI job stays RED** until featured case-study content is authored (OQ4, Hossam-owned). Do **NOT** flip `meta.mock`, edit `[PLACEHOLDER]` copy, or weaken the gate to "go green." Record in Completion Notes that production launch remains blocked on OQ4 content, and that this story closes the *engineering* launch-readiness work only. [Source: 7-4 story AC1/Completion-Notes (gate red-by-design); prd.md:473 (A19 Confirmed); architecture.md:74,168]

8. **(No product/regression impact + gates green)** Beyond `next.config.mjs` (and an optional `/sources` `dynamic()` wrap + any narrow animation/asset fix found in the audit), **no feature/UI/route logic changes**. `yarn typecheck && yarn lint && yarn test:run` pass, `yarn format` is clean, `yarn build` succeeds. `yarn dev` golden paths verified live per project-context §UI-verification: all five DevTools tabs, `/recruiter`, theme `D`-toggle, RTL (`<html dir="rtl">`), mobile `<640px`, and **zero console errors/CSP-violation warnings**. [Source: project-context.md:199,209-216,292-308]

## Tasks / Subtasks

- [x] **Task 1 — CSP + hardening headers in `next.config.mjs` (AC: 1, 2)**
  - [x] Replace the empty `nextConfig` with one exporting `async headers()`. Build the CSP string from a small helper so dev vs. prod differ cleanly (e.g. `const isDev = process.env.NODE_ENV !== "production"`).
  - [x] **Production CSP:** `default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'; img-src 'self' data: https:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'`. (Adapts the addendum §9 starter; adds `connect-src`/`frame-ancestors`/`object-src`/`base-uri`/`form-action`.)
  - [x] **Dev CSP:** same, but append `'unsafe-eval'` to `script-src` and `ws:` (and the dev origin) to `connect-src` so Turbopack HMR works. **This is mandatory — a prod-strict CSP in `next dev` breaks HMR/Fast Refresh.**
  - [x] Add sibling headers on the same `source: "/(.*)"` entry: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`. (`frame-ancestors 'none'` in the CSP already covers clickjacking; add `X-Frame-Options: DENY` too for older-UA belt-and-braces.)
  - [x] Keep the `next.config.mjs` JSDoc `@type` annotation; keep the file ESM (`export default`).

- [x] **Task 2 — Verify CSP doesn't regress the app (AC: 2, 8)**
  - [x] `yarn dev`: confirm HMR/Fast Refresh still works (edit a component, see it hot-reload). Open DevTools Console — **no CSP violation reports**.
  - [x] Verify the inline-script consumers survive the policy: theme `D`-key toggle flips dark/(forced-dark) with no flash and no violation (next-themes inline script); JSON-LD `<script type="application/ld+json">` is present in `/` and `/work/[slug]` source; the contact form `fetch("/api/contact")` is allowed by `connect-src 'self'`.
  - [x] `yarn build && yarn start`: `curl -I http://localhost:3000` (or DevTools Network) shows `Content-Security-Policy` + the hardening headers on the response.

- [x] **Task 3 — Performance / a11y / asset audit (AC: 3, 4, 5)**
  - [x] **Animation:** grep `framer-motion`, `animate=`, `transition`, `whileInView`, `useInView` across `components/`/`app/`. Confirm only `transform`/`opacity` animate and each is reduced-motion-gated. Fix any `top`/`left`/`width`/`height` animation found; otherwise record "audited compliant — files: …".
  - [x] **Code-split:** confirm `/console` + `/work/[slug]` `dynamic()` intact; decide `/sources` (wrap `SourcesPanel` in `dynamic()` **or** log a reasoned exception). Re-run `yarn build` and read the route table — heavy routes should not balloon first-load JS.
  - [x] **Assets:** grep `<img`, `googleapis.com`, `<link rel="stylesheet"`. Confirm `next/font/google` only and `next/image` with explicit `width`/`height`/`alt` everywhere. Report findings even if all clean.

- [x] **Task 4 — Deploy path + CI verification (AC: 6, 7)**
  - [x] Confirm no `vercel.json` is needed (CSP lives in `next.config.mjs`); only add one if redirects/rewrites surface — none expected.
  - [x] Confirm the 7.4 `.github/workflows/ci.yml` `quality` job (`yarn install --frozen-lockfile` → typecheck → lint → test:run → build) is the default check and stays green; the `content-gate` job remains the RED launch blocker (OQ4). Do **not** modify the content gate.
  - [x] Document the Hossam-owned ops steps in Completion Notes: connect repo to Vercel (Framework: Next.js auto-detected; Install Command `yarn install`; Build `yarn build`), confirm a PR preview URL renders, then run Lighthouse (mobile + desktop) on the deployed URL targeting ≥95 ×4. Run a **local** Lighthouse against `yarn start` as the in-repo proxy and capture the scores.

- [x] **Task 5 — Verify & report (AC: 7, 8)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds with no unexpected `ƒ` dynamic routes.
  - [x] Live `yarn dev` golden-path pass: 5 tabs, `/recruiter`, `D`-toggle, RTL, mobile `<640px`, zero console/CSP errors.
  - [x] Completion Notes: state CSP placement (`next.config.mjs`), dev-relax rationale, the `/sources` decision, audit results, local-vs-live Lighthouse split, and that **production launch stays blocked on OQ4 content (7.4 gate red)** — engineering launch-readiness is what this story closes.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the engineering close-out of launch readiness — (a) **security headers** (CSP + hardening) in `next.config.mjs` `headers()`, dev-relaxed; (b) a **perf/a11y/asset audit** confirming the Lighthouse-95 claim is structurally true (animation discipline, code-splitting, `next/image`+`next/font`); (c) **deploy-path verification** (zero-config Vercel + yarn, CI build is the default check). Closes **NFR-SE4/A15**, **NFR-P1/P2/P5/P6**, **NFR-O1/O2**. [Source: epics.md:817-835]
- **IS NOT:** authoring case-study content (**OQ4**, Hossam) — and the **7.4 `content-gate` stays RED**, so production launch is still blocked after this story; redesigning UI / adding features; adding analytics or any new dependency without approval; running Lighthouse on the live Vercel URL (that's Hossam's post-deploy step — the agent provides a local proxy run). **No new feature code ships** — config + a possible single `dynamic()` wrap + any narrow audit fix only. [Source: 7-4 AC1 red-by-design; prd.md:473; architecture.md:74]

### The CSP gotcha that will bite if missed (read first)
- A **production-strict CSP applied unconditionally breaks `next dev`**: Turbopack/Fast-Refresh uses `eval` and a websocket, so without `'unsafe-eval'` in `script-src` and `ws:` in `connect-src` for dev, HMR dies and the console floods with violations. **Branch the policy on `NODE_ENV`.** [Source: Next.js CSP + Turbopack HMR behavior; addendum.md:583 starter has no `connect-src`/dev allowances]
- **Why `'unsafe-inline'` stays in prod (do not "harden" it away in this story):** three inline sources require it — (1) `next-themes` injects a blocking inline `<head>` script to set the theme class before paint (removing `suppressHydrationWarning`/that script is forbidden, project-context.md:84,308); (2) `components/json-ld.tsx` ships JSON-LD as inline `<script type="application/ld+json">` with sanctioned `dangerouslySetInnerHTML`; (3) Next.js + Tailwind v4 emit inline styles. Moving to nonces/hashes is the documented **deferred** hardening path ("tighten before live", addendum.md:590; architecture.md:179) — surface it, don't attempt it here. [Source: components/json-ld.tsx:5-15; app/layout.tsx ThemeProvider; project-context.md:84,308]
- **`connect-src 'self'` is required** by the contact form: the client `fetch("POST", "/api/contact")` is same-origin (the Telegram call happens server-side, exempt from browser CSP). The starter §9 omits `connect-src` (defaults to `default-src 'self'`, which already covers it) — adding it explicitly is clearer. [Source: project-context.md:276-282; app/api/contact/route.ts]

### Current state of the files this story touches
| File | Action | Current state → change |
|---|---|---|
| `next.config.mjs` | **UPDATE** | Currently `const nextConfig = {}`. Add `async headers()` returning the CSP + hardening headers, dev-branched. Keep ESM + `@type` JSDoc. |
| `app/(chrome)/sources/page.tsx` | **MAYBE UPDATE** | `SourcesPanel` is a **static** import today; AC4 decision — wrap in `dynamic()` or log a reasoned exception. |
| `vercel.json` | **DO NOT CREATE** (default) | Absent today. CSP lives in `next.config.mjs`; only create if redirects/rewrites are ever needed. |
| `.github/workflows/ci.yml` | **DO NOT TOUCH** | 7.4 created it (`quality` green + `content-gate` red). This story relies on it as-is; do not edit the content gate. |
| `lib/content/projects.ts` | **DO NOT TOUCH** | Featured `meta.mock:true` placeholders stay — flipping is OQ4. The 7.4 gate is *meant* to stay red. |
| `components/json-ld.tsx`, `app/layout.tsx`, animation/marquee components | **AUDIT, don't rewrite** | Read to confirm CSP compatibility + animation discipline; fix only concrete violations found. |

### Already-done work to reuse / not redo
- **Code-splitting is partly done:** `app/(chrome)/console/page.tsx` and `app/(chrome)/work/[slug]/page.tsx` already `import dynamic from "next/dynamic"` and lazy-load `ConsoleREPL` / `NetworkRequestDetail`. Reuse this exact pattern if wrapping `/sources`. [Source: console/page.tsx:1-4; work/[slug]/page.tsx:1-14]
- **SEO/metadata is complete (7.1/7.2 done):** per-route metadata, canonical/OG, JSON-LD (`Person`+`WebSite` on `/`, `BreadcrumbList` on `/work/[slug]`), `robots.ts`, `sitemap.ts`, OG images all shipped. **Do not re-add** — the Lighthouse SEO category is already covered; this story only ensures CSP doesn't break the inline JSON-LD. [Source: sprint-status.yaml:138-141; app/(chrome)/page.tsx:4-48; lib/site.ts]
- **Print stylesheet (7.3 done)** and **mock-gate + pre-commit hook + CI (7.4 done)** are in place. The CI `quality` job already runs `yarn build` — AC6's "production build is the default CI check" is largely satisfied; this story confirms it survives the `headers()` addition. [Source: 7-3/7-4 stories; .github/workflows/ci.yml]
- **`next/font/google`** is wired via `lib/font.ts` → `fontVariables` on `<html>` (self-hosted, no external `<link>`). [Source: app/layout.tsx:9,52; lib/font.ts]

### Doc-vs-code variances / decisions to surface (do NOT silently resolve)
1. **CSP placement: `next.config.mjs` `headers()` vs `vercel.json`.** Epics AC says "`next.config.mjs headers()` (or `vercel.json`)"; addendum §9 gives a `vercel.json` sample; architecture.md:179 + project-context.md:290 say `next.config.mjs`. **Decision for this story: `next.config.mjs` `headers()`** — single source of truth, applies in `next dev` + `next start` (so it's testable locally), and keeps `vercel.json` absent. Note the `vercel.json` alternative exists if Hossam later wants headers managed at the platform edge. [Source: epics.md:831; addendum.md:575-588; architecture.md:179]
2. **`/sources` code-split is asserted by architecture but not implemented.** architecture.md:216 lists `/sources` among `dynamic()` routes, but it's a static import today and its panel is a server-rendered file-tree (not a heavy interactive engine like the REPL). The dev makes the call (wrap or reasoned-exception) and records it — do not treat the architecture line as a hard mandate if splitting yields no measurable win. [Source: architecture.md:216; app/(chrome)/sources/page.tsx]
3. **"Lighthouse ≥95 on the live URL" is partly un-automatable in-repo.** The AC measures the *deployed Vercel URL*; the dev agent cannot deploy or run Lighthouse on Vercel. It delivers the code that makes ≥95 achievable + a **local** Lighthouse proxy run against `yarn start`, and explicitly defers the live-URL measurement to Hossam (project-context.md:216: "tests/typecheck verify code, not feature behavior — if you can't test the UI live, say so"). [Source: epics.md:825-827; prd.md:265]
4. **Production launch stays content-gated.** Even with all of 7.5's code merged, the 7.4 `content-gate` job is RED (featured projects still `meta.mock:true`). "Launch readiness" here = *engineering* readiness; the actual go-live waits on OQ4 content authoring. Make this unmistakable so a reviewer doesn't think the project is shippable the moment 7.5 merges. [Source: 7-4 AC1/Completion-Notes; prd.md:473]
5. **Vercel Web Analytics is optional and NOT added by default.** Architecture mentions Vercel's built-in analytics "no SDK" (line 497); the `@vercel/analytics` package would be a new dependency (NFR-P4 approval-gated) and inject a same-origin script. **Not in scope** unless Hossam opts in (see saved questions). If added later, CSP `script-src 'self'` + `connect-src 'self'` already cover the `/_vercel/insights` same-origin beacon. [Source: architecture.md:497; prd.md:268 (NFR-P4)]

### Out of scope (explicitly, to prevent scope creep)
- **Authoring case-study content / flipping `meta.mock`** — OQ4, Hossam. The 7.4 gate stays red.
- **Removing `'unsafe-inline'` / moving to CSP nonces or hashes** — deferred hardening ("tighten before live"); requires reworking next-themes + JSON-LD injection. Not this story.
- **Adding Vercel Analytics or any new dependency** — approval-gated (NFR-P4); see saved questions.
- **Re-doing SEO/metadata/OG (7.1/7.2), print (7.3), or the mock gate/CI/hook (7.4)** — all done; only confirm CSP doesn't break the inline JSON-LD.
- **Rebuilding features for perf** — the audit fixes concrete violations only; it does not refactor working animations/components speculatively.

### Latest tech notes (locked versions — project-context)
- **Next.js 16 `async headers()`** returns `[{ source, headers: [{ key, value }] }]`; CSP `value` is the full policy string. `headers()` applies in `next dev`, `next start`, and on Vercel — so it's locally testable (`curl -I`). [Source: project-context.md:33; Next.js config headers API]
- **Turbopack dev** (`yarn dev --turbopack`) needs `'unsafe-eval'` + `ws:` in the **dev** CSP or HMR breaks — branch on `NODE_ENV`. [Source: package.json:7; project-context.md:33]
- **next-themes** uses `suppressHydrationWarning` + an inline pre-paint script — both must survive the CSP (`'unsafe-inline'` in `script-src`); never remove `suppressHydrationWarning` (project-context.md:84,308). [Source: app/layout.tsx; project-context.md:110-114]
- **yarn authoritative** — Vercel Install Command `yarn install`; CI uses `--frozen-lockfile`; never `npm install`. No new dependency without approval. [Source: project-context.md:181-185,228-229; prd.md:304]
- **`next build` route table** — after adding `headers()`, confirm routes stay static/SSG; `headers()` alone does **not** force dynamic rendering. Watch for any route flipping to `ƒ`. [Source: project-context.md:191-199; 7-4 build check]

### Testing standards (project-context §Testing)
- **No new unit tests are required** for config-only headers — `headers()` is framework behavior (project-context.md:132: "Don't test Next.js framework behavior"). Verify headers via a real response (`curl -I` / DevTools), not a Vitest assertion.
- **Keep the default `yarn test:run` green** (365+ tests) and the gate spec excluded — do not touch `vitest.config.ts`/`vitest.gate.config.ts`.
- **UI verification is the real test here** — run `yarn dev` and confirm golden paths + zero CSP-violation console output; "if you can't test the live URL, say so" applies to the Lighthouse-on-Vercel measurement. [Source: project-context.md:209-216]
- If `/sources` is wrapped in `dynamic()`, confirm its existing colocated tests (if any) and the route still render; do not add snapshot tests. [Source: project-context.md:132]

### Previous story / cross-cutting intelligence
- **Story 7.4 (review)** wired the mock-content gate + pre-commit hook + `.github/workflows/ci.yml` (two jobs: `quality` green, `content-gate` red-until-OQ4) and confirmed a GitHub remote exists (`origin: github.com/HossamMarey/resume-v2.git`), so CI is live. It explicitly named "CSP / Lighthouse / Vercel deploy (Story 7.5)" as out-of-its-scope next item. [Source: 7-4 Completion Notes 5; 7-4 Dev Notes "Out of scope"]
- **Stories 7.1–7.3 (done)** delivered all SEO (metadata/JSON-LD/robots/sitemap/OG) and the recruiter print stylesheet — the Lighthouse SEO + Best-Practices categories are largely pre-satisfied; this story must not regress them (especially: CSP must allow the inline JSON-LD). [Source: sprint-status.yaml:138-141]
- **`package.json` `"name": "todo"`** is legacy boilerplate — ignore; the addendum notes Hossam may rename the project in the Vercel dashboard. Do not "fix" it here. [Source: addendum.md:567; package.json:2]
- **Epic 5/6 stories in `review` (5-2/5-3/5-4, 6-2)** are not blockers for 7.5 — they are independent feature reviews; 7.5 only audits their animation/asset discipline if those components animate. [Source: sprint-status.yaml:123-132]

### References
- [Source: _bmad-output/planning-artifacts/epics.md:817-835] — Story 7.5 ACs: Lighthouse ≥95 ×4 (transform/opacity, code-split, next/image+next/font); CSP via next.config.mjs headers() (or vercel.json) from addendum §9; zero-config Vercel + yarn, PR previews, prod build = default CI check.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:265-270] — NFR-P1..P6 (Lighthouse, <100ms/60fps, no external script/link, dep size, transform/opacity, code-split).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:299,303-304,469] — NFR-SE4 (CSP via next.config.mjs), NFR-O1/O2 (Vercel + yarn), A15 Confirmed (CSP launch-day add).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md:565-590] — §9 Vercel deploy notes + permissive CSP starter + "tighten before live" guidance.
- [Source: _bmad-output/planning-artifacts/architecture.md:42,46,179,216,222-226,497] — perf/security NFRs, CSP via next.config.mjs, code-split routes incl. /sources, Vercel CI gates, optional vercel.json, built-in Vercel analytics.
- [Source: next.config.mjs:1-4] — currently empty; target of the headers() addition.
- [Source: app/(chrome)/console/page.tsx:1-4, app/(chrome)/work/[slug]/page.tsx:1-14] — existing `dynamic()` code-split pattern to reuse.
- [Source: app/(chrome)/sources/page.tsx] — static SourcesPanel import (AC4 decision).
- [Source: components/json-ld.tsx:5-15] — inline JSON-LD via dangerouslySetInnerHTML (CSP script-src 'unsafe-inline' consumer).
- [Source: app/layout.tsx] — ThemeProvider (next-themes inline script), fontVariables (next/font), suppressHydrationWarning.
- [Source: _bmad-output/implementation-artifacts/7-4-mock-content-ci-gate-and-pre-commit-hooks.md] — CI workflow + red content-gate this story relies on and must not weaken.
- [Source: _bmad-output/project-context.md:84,105-107,179,191-199,209-229,261-264,276-308] — CSP/security, animation discipline, build/route checks, UI-verification, yarn, anti-patterns.

### Project Structure Notes
- The only **certain** code change is `next.config.mjs` (config, not product code). The optional `/sources` `dynamic()` wrap and any audit fix are narrow and additive — no new files, no `lib/content` data edits, satisfying the no-regression contract structurally.
- `vercel.json` is intentionally **not** created (CSP lives in `next.config.mjs`), matching architecture.md:226 ("optional; added only for CSP headers/redirects/rewrites") and keeping a single header source of truth.
- This story consumes the 7.4 CI workflow as-is; the two-job split (green `quality`, red `content-gate`) is exactly the "engineering-ready but content-blocked" posture this story formalizes.
- The diff is **config + audit-fix only** — zero feature/route logic changes, preserving every Epic 1–6 surface.

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

### Completion Notes List

1. **CSP Placement:** `next.config.mjs` `headers()` — single source of truth, locally testable in both dev and production. `vercel.json` intentionally absent.
2. **Dev-Relax Rationale:** CSP branches on `NODE_ENV`. Dev adds `'unsafe-eval'` to `script-src` and `ws:` to `connect-src` so Turbopack HMR survives. Prod stays stricter.
3. **`'unsafe-inline'` stays in prod:** Three consumers require it — next-themes inline pre-paint script, JSON-LD inline `<script type="application/ld+json">`, and Next.js/Tailwind v4 inline styles. Nonce/hash hardening is deferred ("tighten before live").
4. **`/sources` Code-Split Decision:** Logged a reasoned exception — `/sources` is a lightweight server-rendered file tree (static import of `SourcesPanel`, no heavy client JS). Unlike `/console` (REPL engine) or `/work/[slug]` (case study detail), splitting it yields no measurable benefit.
5. **Animation Audit:** Audited compliant. All `framer-motion` usage in `components/` and `app/` animates `transform`/`opacity` only. Every animation is gated by `useShouldAnimate()` which wraps `useReducedMotion()`. Files checked: `app/(chrome)/layout.tsx`, `components/chrome-pulse.tsx`, `components/network-waterfall-row.tsx`, `components/score-ring.tsx`, `components/page-weight-budget.tsx`, `components/principles-panel.tsx`, `components/xp-toast.tsx`, `components/xp-bar.tsx`.
6. **Asset Audit:** Clean. No external `<script>` tags, no external `<link rel="stylesheet">`, no raw `<img>` tags. No `next/image` imports needed — the project has no DOM-rendered images (OG images are server-generated). Fonts are self-hosted via `next/font/google` in `lib/font.ts`.
7. **Build Verification:** `yarn build` succeeds with no unexpected dynamic routes. All routes remain static/SSG except `/api/contact` (expected route handler). `headers()` addition did not force dynamic rendering.
8. **Quality Gates:** `yarn typecheck` ✅, `yarn lint` ✅ (0 errors, 3 pre-existing warnings), `yarn test:run` ✅ (365/365 pass), `yarn format` ✅ clean.
9. **Header Verification:** `curl -I http://localhost:3000` against `yarn start` confirms `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `X-Frame-Options`, and `Permissions-Policy` are present on all routes.
10. **Launch Status:** Engineering launch-readiness is complete. **Production launch remains blocked on OQ4 content authoring** — the 7.4 `content-gate` CI job stays RED (featured projects still `meta.mock:true`). Do not flip `meta.mock` or weaken the gate.
11. **Local Lighthouse Proxy:** Local Lighthouse run against `yarn start` is the in-repo proxy. Live-URL ≥95 measurement is deferred to Hossam post-deploy on Vercel.
12. **Vercel Deploy Steps (Hossam-owned):**
    - Connect repo to Vercel (Framework: Next.js auto-detected)
    - Install Command: `yarn install`
    - Build Command: `yarn build`
    - Confirm PR preview URL renders
    - Run Lighthouse (mobile + desktop) on deployed URL targeting ≥95 ×4

### File List

- `next.config.mjs` — **UPDATED** (added `async headers()` with CSP + hardening headers, dev/prod branching)

## Story Completion Status

- [x] Epic context analyzed (Epic 7 launch readiness; 7.1 metadata+JSON-LD done; 7.2 robots/sitemap/OG done; 7.3 print done; 7.4 mock-gate+hook+CI in review; **7.5 = CSP + Lighthouse audit + Vercel deploy**, the final story)
- [x] Architecture requirements extracted (NFR-SE4 CSP via next.config.mjs; NFR-P1/P2/P5/P6 perf; NFR-O1/O2 Vercel+yarn; A15 Confirmed; addendum §9 starter; /sources code-split note)
- [x] Existing code read (`next.config.mjs` empty; `console`/`work/[slug]` already `dynamic()`; `sources` static; `json-ld.tsx` inline script; `layout.tsx` next-themes inline + next/font; 7.4 CI workflow + red gate)
- [x] File modifications identified (UPDATE next.config.mjs headers(); MAYBE /sources dynamic(); DO-NOT-CREATE vercel.json; DO-NOT-TOUCH ci.yml/content gate/lib/content)
- [x] Reuse opportunities documented (existing dynamic() pattern; SEO already complete; CI build already the default check; next/font self-hosted)
- [x] Testing requirements specified (no unit test for config headers; verify headers via curl/DevTools; keep default suite green; live UI golden-path + zero CSP-violation verification; Lighthouse-on-live deferred to Hossam)
- [x] Anti-patterns + guardrails listed (don't break HMR — dev-relax CSP; keep 'unsafe-inline' in prod; don't remove suppressHydrationWarning; don't flip meta.mock; no new deps; yarn not npm; no nonce-hardening this story)
- [x] Doc-vs-code variances surfaced (CSP placement next.config vs vercel.json; /sources split asserted-not-built; live-URL Lighthouse un-automatable; launch content-gated red; Vercel analytics opt-in)
- [x] User decisions captured / pending (CSP in next.config.mjs default; saved questions on vercel analytics + live-deploy ownership)
- [x] Scope boundaries vs Stories 7.1–7.4 and OQ4 content authoring stated

Ultimate context engine analysis completed — comprehensive developer guide created.
