# Story 4.5: Grant project-open XP

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a curious visitor,
I want opening a case study to grant XP,
so that exploring the work is rewarded.

## Acceptance Criteria

1. **(FR-074 project +15 — the grant)** Opening a `/work/[slug]` **featured** case-study detail page fires `emitXP(15, "open:<slug>")` exactly once per slug (e.g. `open:buguard`, `open:dark-atlas`, `open:masheed-gate`). The grant is emitted from a **client** effect that runs on route entry — the page itself is an RSC and cannot emit directly.

2. **(FR-074 + FR-075 — idempotent, capped, no re-invention)** The grant inherits idempotency and the `[0,100]` cap from the **existing** `emitXP`/`hm_xp_granted` pipeline in `lib/xp/bus.ts`. Re-opening the same slug grants nothing (the bus dedupes the reason); the XP total never exceeds 100. **Do NOT** add a second dedup mechanism (no new `sessionStorage`/`useRef` guard, no edits to `emitXP`, the bus, `hm_xp_granted`, or `useXP`).

3. **(FR-076 — bar reflects the grant)** After the grant fires, the chrome XP bar updates automatically because `useXP` (consumed by `components/xp-bar.tsx`) is already subscribed to the `hm:xp` event. No XP-bar code is touched in this story.

4. **(Per-slug correctness via pager)** Navigating between case studies with the 4.4 prev/next pager (which changes `pathname`, remounting the page subtree under the chrome `AnimatePresence`) fires the grant for **each newly-opened slug**, while any slug already opened grants nothing on return.

5. **(SSR-safe, effect-only)** The emit runs inside a `useEffect` (post-mount, client-only), never during render. The emitting component returns no visible UI (or is folded into an existing client island) — it must not alter the case-study layout, the single `<h1>`, the breadcrumb, the `[MOCK]` badge, or the 4.4 `layoutId="project-<slug>"` shared-element transition.

6. **(Regression — Epic 4 surfaces intact)** The `/work/[slug]` page keeps everything from Stories 4.3/4.4 end-to-end: eager `<CaseStudyHeader>` (one `<h1>`, breadcrumb, dev-only `[MOCK]` badge, shared `layoutId`), dynamic `<NetworkRequestDetail>` body (Problem → Role → Stack → Decisions → Outcomes → Links), `<CaseStudyPager>` footer, `generateStaticParams` (featured-only), `notFound()` for missing/non-featured, the one-time dev `console.warn`, and `generateMetadata`. The existing `/work` list grant (`visit:network`, +10) is untouched and does not conflict (the detail pathname `/work/<slug>` is not in `tabReasons`).

7. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` still statically renders only the three featured slugs. Live verification (Task 4) confirms the bar increments by 15 on first open of each featured project and does not increment on re-open.

## Tasks / Subtasks

- [x] **Task 1 — Add the project-open grant as a client effect (AC: 1, 2, 5)**
  - [x] Create `components/project-open-xp.tsx` — **`"use client"`**, **named export** `ProjectOpenXp`. Props: `{ slug: string }`.
  - [x] Body: `useEffect(() => { emitXP(15, \`open:${slug}\`) }, [slug])`. Return `null` (render-less side-effect island). Import `emitXP` from `@/lib/xp/bus`.
  - [x] Do **not** wrap in a mount/`requestAnimationFrame` gate. The `useXP` listener in the chrome is attached **synchronously** on mount (see Dev Notes "Why no rAF gate"); a `useEffect` emit fires after that listener exists. Do not re-introduce the rAF-gated-emit bug from Story 2.5.
  - [x] Do **not** call `emitXP` during render, in `useState` initializers, or at module scope — client effect only (SSR-safe; `emitXP` also guards `typeof window === "undefined"`).

- [x] **Task 2 — Mount the grant on the case-study page (AC: 1, 4, 6)**
  - [x] In `app/(chrome)/work/[slug]/page.tsx`, after `notFound()`/mock-warn guards, render `<ProjectOpenXp slug={project.slug} />` inside the existing `<section className="p-4">` (position is irrelevant — it renders null). Static import (NOT `dynamic()`), alongside `CaseStudyHeader`/`CaseStudyPager`.
  - [x] Preserve everything else verbatim: `generateStaticParams`, `generateMetadata`, the `warnedSlugs` one-time `console.warn`, the eager `<CaseStudyHeader>`, the `dynamic()` `<NetworkRequestDetail>` body + loading skeleton, and `<CaseStudyPager>`.
  - [x] Confirm the page stays a Server Component (no `"use client"` added to `page.tsx`); only the new `ProjectOpenXp` island is client.

- [x] **Task 3 — Test the call site (AC: 1, 2)**
  - [x] `components/project-open-xp.test.tsx` (**NEW**): mock the bus — `vi.mock("@/lib/xp/bus", () => ({ emitXP: vi.fn() }))`. Render `<ProjectOpenXp slug="buguard" />`; assert `emitXP` was called once with `(15, "open:buguard")`. Render with a different slug and assert the reason string follows the slug.
  - [x] Assert the component renders nothing visible (e.g. `const { container } = render(...)` → `container` has no element children, or the render produces no role/text).
  - [x] **Do NOT** re-test idempotency, the `[0,100]` clamp, `hm_xp_granted` persistence, or the `hm:xp` dispatch — those are already covered by `lib/xp/bus.test.ts` (incl. fast-check property tests) and `hooks/use-xp.test.ts`. Testing them here would duplicate and couple to bus internals.

- [x] **Task 4 — Live verification (AC: 3, 7)**
  - [x] `yarn dev`. Clear state first (`localStorage.clear()` in console, reload) so grants are fresh. Open `/work`, click a featured row → on `/work/<slug>` confirm the XP bar increments by **+15** (and the `visit:network` +10 already fired when the list loaded).
  - [x] Navigate via the pager to the other two featured slugs → confirm **+15 each** on first open. Go **back** to an already-opened slug → confirm **no** increment.
  - [x] Reload the page on an already-opened slug → confirm **no** re-grant (the bus persists `hm_xp_granted`). Confirm no console errors and the `D` theme hotkey still works.
  - [x] Spot-check reduced-motion ON: XP still increments silently (bar fill may be hidden per NFR-A3 — that is existing behavior, not this story's concern).

- [x] **Task 5 — Gate (AC: 7)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean.
  - [x] `yarn build` → confirm only the three featured slugs are statically generated and the build succeeds.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** a single new **call site** for the existing XP bus — emit `emitXP(15, "open:<slug>")` when a featured case-study detail mounts (FR-074 "project +15"). That's the whole feature. The bus already does the hard parts (dedup, clamp, dispatch, persistence).
- **IS NOT:**
  - **Any change to the XP engine** — `lib/xp/bus.ts`, `hooks/use-xp.ts`, `components/xp-bar.tsx`, the `hm_xp_v1` / `hm_xp_granted` keys are all **read-only context** here. Don't touch them.
  - **REPL +5 (FR-043, Story 5.2)**, **Konami +20 (Story 5.4)**, **contact +50 (FR-072, Story 6.4)** — other emitters, other stories.
  - **Toast/visual feedback rework** — the toast surface (`components/devtools-chrome.tsx`) is out of scope (see "Deferred item #16" below).
  - **Recruiter Mode handling** — Recruiter Mode is a complete UI swap built in **Epic 6** (not yet implemented). No conditional logic for it here.

### ⚠️ The one subtlety: AC says "per session", the code is "once ever" (intentional)
The epic AC text reads *"idempotent per session via `hm_xp_granted`"* — but the **shipped** `emitXP` dedupes a reason **once ever**, persisted across browser sessions, not per-session. This is deliberate and documented at `lib/xp/bus.ts:6-8`:

> _"Granted reasons persist in localStorage so each reason grants once ever (not once per browser session) — otherwise the persisted `hm_xp_v1` total re-inflates every new session as `visit:*` reasons are re-granted."_

…and locked by the test *"emits a given reason only once, persisted across sessions"* (`lib/xp/bus.test.ts:37-46`). **Once-ever is a strict superset of per-session**, so it fully satisfies this AC's observable requirement ("re-opening the same slug in the session grants nothing"). **Action for the dev:** just call `emitXP` and inherit its dedup — do **not** try to "fix" it to be per-session (that would re-introduce the cross-session re-inflation bug Story 2.5 deliberately closed). This is the project's standing "surface doc-vs-code conflicts, don't silently resolve" rule — it's surfaced here and the resolution is: **code wins, AC wording is looser than the implementation.**

### Why no rAF/mount gate (don't repeat the 2.5 bug)
`hooks/use-xp.ts` attaches its `hm:xp` listener **synchronously** in the effect body (before its own deferred rAF read) precisely so a synchronous mount-time emit isn't dropped. Your emit runs inside a `useEffect`, which fires **after** the bar's listener is attached, so the bar will always see it. Do **not** gate the emit behind `requestAnimationFrame`/a `mounted` flag — that pattern dropped synchronous emits in Story 2.5 (memory: `feedback_raf_mount_gate_drops_sync_emits`). A plain `useEffect(..., [slug])` is correct.

### Where to emit — recommended approach
The page is an **async RSC** (`app/(chrome)/work/[slug]/page.tsx`) and can't run hooks, so the emit must live in a client component. Two viable options:

- **✅ Recommended — dedicated render-less island `components/project-open-xp.tsx`.** Returns `null`, single responsibility (fire the grant), trivially unit-testable by mocking the bus, and keeps the side-effect **out of** `CaseStudyHeader` (which carries the 4.4 `layoutId` shared element — lower regression risk on the transition). Mirrors the established "side-effect in a small client component" pattern (the chrome layout's `visit:*` grant lives in a client `useEffect`).
- **Alternative — fold the effect into `components/case-study-header.tsx`** (already `"use client"`, already receives `project`, mounts eagerly on route entry). Fewer files, but conflates a presentational header with a side-effect and entangles the grant test with the header test. Only choose this if you have a reason to avoid a new file.

Pick the dedicated island unless you decide otherwise; either way the behavior (one effect, keyed on slug, calling `emitXP`) is identical.

### Precedent to mirror (the tab-visit grant, Story 2.5)
`app/(chrome)/layout.tsx:45-48` already does exactly this shape for tab visits:
```tsx
useEffect(() => {
  const reason = pathname ? tabReasons[pathname] : undefined
  if (reason) emitXP(10, reason)
}, [pathname])
```
Your version is the per-slug analogue: `useEffect(() => { emitXP(15, \`open:${slug}\`) }, [slug])`. Note `/work/<slug>` is **not** in `tabReasons`, so the layout's visit grant never double-fires for detail pages — the two grants are independent and additive (open a project after first visiting `/work` ⇒ +10 then +15).

### Reuse — do NOT reinvent
- **`emitXP`** (`@/lib/xp/bus`) — the only emit entry point. It owns dedup (`hm_xp_granted`), clamp (`clampXp` → `[0,100]`), `CustomEvent("hm:xp")` dispatch, and SSR guard. Call it; don't reimplement any of it.
- **The `verb:target` reason convention** (architecture.md:267) — `open:<slug>` matches the documented `open:project` form. Use the literal slug (`open:buguard`), not a generic `open:project`, so each project dedupes independently (the bus test already exercises `open:project-x` as the project-open shape).
- **`Project` type / `project.slug`** — already typed and passed into the page; pass `project.slug` as a `string`. `import type` for any type-only import (`isolatedModules: true`).

### Architecture / project-context guardrails (must follow)
- **RSC by default; push `"use client"` deep.** `page.tsx` stays an RSC; only the tiny `ProjectOpenXp` island is client. **Named export** for the component (`page.tsx` keeps its default export — Next requirement).
- **No new dependencies, no state library.** The `hm:xp` `CustomEvent` bus is the intentional lightweight cross-component mechanism — do not add Redux/Zustand/Context for XP.
- **Import order:** external → internal aliases (`@/lib/*`, `@/components/*`) → relative → side-effects; blank line between groups, alpha within. No `import React` (jsx runtime).
- **No comments-as-narration.** A render-less effect component is self-explanatory; only comment a non-obvious WHY if any.
- **Semantic tokens / logical props** — N/A here (component renders nothing), but if you fold into the header, don't disturb its existing tokens/markup.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`. Colocate `project-open-xp.test.tsx` next to source.
- **Mock the bus boundary** (`vi.mock("@/lib/xp/bus")`) and assert the call `(15, "open:<slug>")`. This tests *this story's* contribution (the call site) without re-testing the bus.
- Query for "renders nothing" via `container.firstChild` being `null` / empty — there is no role/label to query (intentional).
- **Don't test:** idempotency/clamp/persistence/dispatch (owned by `lib/xp/bus.test.ts` + `hooks/use-xp.test.ts`), the live bar increment (verify in Task 4), `generateStaticParams`/`notFound()` (verified by `yarn build` + 4.3/4.4 tests), or framer-motion behavior.

### Deferred item #16 — be aware, do NOT fix here
`_bmad-output/implementation-artifacts/deferred-work.md:141-147` (toast `id`/`key` collides on same-millisecond emits; single-slot toast drops rapid grants) names **4.5** as one of the stories that makes that latent bug *triggerable* once multiple emitters exist. In practice a project-open grant is separated from the `visit:network` grant by a **user navigation**, so two emits in the **same millisecond** still won't occur from this story alone — #16 stays latent. **Do not pull the toast-queue/monotonic-key fix into this story** (it's deferred and out of scope); just don't make it worse (don't batch-fire multiple `emitXP` calls synchronously).

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/project-open-xp.tsx` | **NEW** | `"use client"`, named export `ProjectOpenXp`, props `{ slug: string }`. `useEffect(() => emitXP(15, \`open:${slug}\`), [slug])`; returns `null`. |
| `app/(chrome)/work/[slug]/page.tsx` | **UPDATE** | Render `<ProjectOpenXp slug={project.slug} />` (static import) inside the existing `<section>`. Preserve all 4.3/4.4 structure + metadata + static params + mock warn. |
| `components/project-open-xp.test.tsx` | **NEW** | Mock `@/lib/xp/bus`; assert `emitXP(15, "open:<slug>")` called once; assert renders nothing. |
| `lib/xp/bus.ts` | **DO NOT TOUCH** | Owns dedup/clamp/dispatch. Read-only context. |
| `hooks/use-xp.ts`, `components/xp-bar.tsx` | **DO NOT TOUCH** | The bar already reflects grants via the `hm:xp` subscription. |

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router.** `params` is a Promise — the page already `await params`; preserve it. The new island is a normal static client import, not `dynamic()`. No `{ ssr: false }` (illegal from an RSC and unnecessary).
- **React 19.2.4** — effects fire twice in dev Strict Mode. That's fine: `emitXP` dedupes by reason, so a double-fired effect still grants once. (Don't add a `useRef` guard to "fix" the double-fire — the bus already makes it idempotent.)
- **Tailwind v4 / framer-motion 12.40.0** — not exercised by this story (render-less island), but unchanged elsewhere.

### Previous story intelligence
- **Story 4.4** lifted the case-study title/breadcrumb/`[MOCK]` badge into the eager **client** `CaseStudyHeader` (carrying `layoutId="project-<slug>"`) and added `CaseStudyPager`; the body stays RSC + `dynamic()`. Your grant must not disturb the header's shared-element transition — the dedicated `ProjectOpenXp` island keeps the two concerns separate. The pager remounts the page subtree on slug change, which is exactly what makes the per-slug grant fire (AC4).
- **Story 4.3** restricted `generateStaticParams`/`notFound()` to **featured** slugs — only featured projects have a detail route, so `open:<slug>` only ever fires for featured slugs (the page `notFound()`s before rendering for anything else).
- **Story 2.5** built the bus/hook/bar and the `hm_xp_granted` once-ever dedup (review applied 3 patches). The rAF mount-gate lesson (memory `feedback_raf_mount_gate_drops_sync_emits`): the bar listener is attached synchronously; a `useEffect` emit is safely seen. The `emitXP` signature, `verb:target` reasons, and the +10 tab-visit precedent all come from here.

### Git intelligence (recent commits)
- `7f8eee0 feat(work): layout-shared row->detail transition and prev/next pager (story 4.4)`, `fb9e5f4 …case-study detail (4.3)`, `474fd31 …url-persisted filters (4.2)`, `9fdec10 …network waterfall (4.1)`. Pattern: Conventional Commits, **one story per commit**, RSC page + deep client island, colocated tests. Match it: **`feat(work): grant project-open XP (story 4.5)`** (use ASCII `->` if a shell mangles arrows; none needed here).

### Project Structure Notes
- `components/project-open-xp.tsx` follows kebab-case + named-export and sits beside the other `case-study-*` / `network-*` components.
- A render-less client island for a side-effect is consistent with the codebase's "side-effect lives in a small client component" approach (chrome layout's visit grant). No new dependency, no `tailwind.config.*`, no state library, no router/i18n change.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:579-589] — Story 4.5 AC (open `/work/[slug]` ⇒ `emitXP(15, "open:<slug>")` once, idempotent via `hm_xp_granted`, bar updates, re-open grants nothing).
- [Source: _bmad-output/planning-artifacts/epics.md:83-84] — FR-074 (project detail +15) + FR-075 (cap 100, per-action-per-session idempotent, fast-check).
- [Source: _bmad-output/planning-artifacts/epics.md:204] — Epic 4 covers FR-074 (project-open grant).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:219-224] — FR-074 amounts (+15 project open) + FR-075 idempotence/cap.
- [Source: _bmad-output/planning-artifacts/architecture.md:267] — XP reason convention `verb:target` (`open:project`).
- [Source: _bmad-output/planning-artifacts/architecture.md:484] — F9 XP system file map (`lib/xp/bus.ts`, `hooks/use-xp.ts`, `components/xp-bar.tsx`).
- [Source: lib/xp/bus.ts:5-8,62-73] — `emitXP` owns dedup (`hm_xp_granted`), clamp, dispatch; once-ever (not per-session) by design.
- [Source: lib/xp/bus.test.ts:37-57] — "emits a reason only once, persisted across sessions" + distinct-reason (`open:project-x`) cases — do not duplicate.
- [Source: hooks/use-xp.ts:31-56] — bar listener attached synchronously on mount; effect-time emits are safely seen (no rAF gate).
- [Source: app/(chrome)/layout.tsx:45-48] — tab-visit grant precedent: `useEffect` keyed on `pathname` calling `emitXP(10, reason)`; `/work/<slug>` not in `tabReasons`.
- [Source: app/(chrome)/work/[slug]/page.tsx] — current RSC page (generateStaticParams featured-only, notFound, dev warn, eager header, dynamic body, pager) — the mount point.
- [Source: components/case-study-header.tsx] — eager client island carrying the 4.4 `layoutId` (alternative emit host; keep it presentational by default).
- [Source: _bmad-output/implementation-artifacts/deferred-work.md:141-147] — deferred item #16 (toast same-ms collision) named for 4.5; do not fix here.
- [Source: _bmad-output/project-context.md] — RSC-by-default, named exports, `localStorage`-only persistence, versioned keys (`hm_xp_v1`/`hm_xp_granted`), `CustomEvent("hm:xp")` bus / no state library, XP cap `[0,100]`, testing rules (mock external boundaries only), import order, framer-motion import rule.

## Dev Agent Record

### Agent Model Used

k2p6

### Debug Log References

### Completion Notes List

- Created `components/project-open-xp.tsx` — a render-less client island that calls `emitXP(15, \`open:${slug}\`)` inside a `useEffect` keyed on `slug`. Returns `null` so it adds no visible DOM.
- Updated `app/(chrome)/work/[slug]/page.tsx` — added static import of `ProjectOpenXp` and rendered it inside the existing `<section>` alongside `CaseStudyHeader`, `NetworkRequestDetail`, and `CaseStudyPager`. Page remains an RSC; only the new island is client.
- Created `components/project-open-xp.test.tsx` — mocks the XP bus boundary, asserts `emitXP(15, "open:<slug>")` is called once on mount, and verifies the component renders nothing visible. Does not re-test bus internals (dedup, clamp, persistence) — those are covered by existing `lib/xp/bus.test.ts` and `hooks/use-xp.test.ts`.
- Gates: `yarn typecheck` ✅, `yarn lint` ✅, `yarn test:run` ✅ (143 tests passed), `yarn format` ✅ (clean), `yarn build` ✅ (only 3 featured slugs statically generated).

### File List

- `components/project-open-xp.tsx` — NEW: render-less client island that emits project-open XP
- `components/project-open-xp.test.tsx` — NEW: unit tests for the call site
- `app/(chrome)/work/[slug]/page.tsx` — UPDATED: mounts `<ProjectOpenXp slug={project.slug} />`
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — UPDATED: status `ready-for-dev` → `in-progress` → `review`

### Change Log

- 2026-06-01: Story implemented; all tasks complete; gates green. Status set to `review`.
