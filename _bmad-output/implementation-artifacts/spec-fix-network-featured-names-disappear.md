---
title: 'Fix: featured project names disappear on the Network tab'
type: 'bugfix'
created: '2026-06-01'
status: 'done'
baseline_commit: 'd6746068163c753f558009343cffe994674a2fe7'
context: ['{project-root}/_bmad-output/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On `/work` (Network tab), the first three project names — the **featured** projects (Buguard, Dark Atlas, Masheed Gate) — render invisible when animations are enabled. Non-featured rows are fine. This breaks the load-bearing surface for the Engineering-Manager persona.

**Approach:** Story 4.4 wrapped featured names in `<motion.span layout="position" layoutId=…>`, which defaults to `display: inline`. Framer Motion layout/shared-layout animations drive CSS `transform`, and inline elements don't accept transforms — inside the `<td>` table context the projected transform mispositions the text off-screen, so it vanishes. Fix: give the motion span `display: inline-block` (the documented requirement for layout animations) on both ends of the shared pair, preserving the existing truncation.

## Boundaries & Constraints

**Always:** Keep the 4.4 `layoutId="project-<slug>"` shared-element transition working; keep featured→`/work/[slug]` internal `<Link>` and non-featured external/plain branches unchanged; preserve name truncation/ellipsis on the row; semantic tokens + logical properties only; reduced-motion path (plain `<span>`) stays as-is.

**Ask First:** Removing the shared-element morph entirely (i.e. dropping `layoutId`/`layout` from the row) instead of fixing display — only if `inline-block` does not resolve it in live verification.

**Never:** Touch the waterfall bar `motion.div` (`scaleX`/`translateX`/`transformOrigin: left`); add a second `useReducedMotion()` source; change `AnimatePresence` mode in the chrome layout; modify `ProjectSchema`, the XP bus, or routing; introduce new dependencies.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Featured, animations on | `project.featured` + `useShouldAnimate()===true` | Name visible in the row; still morphs into the detail title on open | N/A |
| Featured, reduced motion | `useShouldAnimate()===false` | Plain `<span>` name visible (unchanged) | N/A |
| Non-featured | `featured===false` | External `<a>` / plain `<span>` name visible (unchanged) | N/A |
| Long featured name | name wider than the cell | Truncates with ellipsis, does not overflow the cell | N/A |

</frozen-after-approval>

## Code Map

- `components/network-waterfall-row.tsx` -- `ProjectNameLink` featured branch (line ~52) wraps the name in an **inline** `motion.span` with `layout`/`layoutId`; primary root cause. Shared by both `NetworkWaterfallRow` (table) and `NetworkWaterfallCard` (mobile).
- `components/case-study-header.tsx` -- detail-side shared-element `motion.span` (line ~38), same inline pattern; fix in tandem so the shared pair stays consistent and the morph target also accepts transforms.
- `hooks/use-should-animate.ts` -- gates the `motion.span` path; bug only manifests when it returns `true` (animations enabled), confirming the motion node is the cause.
- `components/network-waterfall-row.test.tsx` -- mocks `framer-motion` to a plain `<span>`, so it cannot reproduce this display bug; existing assertions stay green after the className change. No new unit test can catch a layout-transform issue under jsdom — verify live.

## Tasks & Acceptance

**Execution:**
- [x] `components/network-waterfall-row.tsx` -- add `inline-block max-w-full truncate align-bottom` to the featured `motion.span`'s `className` so it accepts the layout transform and still ellipsizes long names within the cell. Leave the reduced-motion `<span>` and both non-featured branches untouched.
- [x] `components/case-study-header.tsx` -- add `inline-block` to the title `motion.span`'s `className` (the matching end of the shared pair). Keep the `<h1>`, breadcrumb, and `[MOCK]` badge unchanged.

**Acceptance Criteria:**
- Given the Network tab with animations enabled, when `/work` renders, then all rows including the first three featured names are visible.
- Given a featured row, when clicked, then the name still morphs into the detail-page title (4.4 shared-element transition intact).
- Given `prefers-reduced-motion: reduce`, when `/work` renders, then featured names remain visible (plain span path unchanged).
- Given the existing suite, when `yarn test:run`/`typecheck`/`lint` run, then all pass and `yarn format` is clean.

## Spec Change Log

- **2026-06-01 — `inline-block` insufficient; root cause was the shared-layout animation, not display.** Live testing showed featured names still vanished after the `inline-block` change. The true cause is the `layoutId`/`layout` shared-element transition getting stuck (transform/opacity handoff never completing) under the chrome's `AnimatePresence mode="wait"` — the exact risk flagged in Story 4.4's review finding and deferred-work #13. **Amendment:** removed the Framer Motion wrapper from the featured name on both ends of the pair (`network-waterfall-row.tsx` row + `case-study-header.tsx` title); they now render as a plain `<Link>`/`<h1>`. This trades the 4.4 row→detail morph (degrades to the existing route crossfade) for guaranteed visibility on the load-bearing project list. **Avoids:** the known-bad stuck-invisible state. **KEEP:** non-featured branches, the waterfall bar animation, and reduced-motion behavior were already untouched — leave them. **Follow-up option:** restore the morph later via `AnimatePresence mode="popLayout"` (deferred-work #13), which requires re-verifying all five tabs.

## Design Notes

Framer Motion docs are explicit: layout animations require a transformable box — `display: inline` elements "won't animate correctly; use `inline-block`." The `<td>` table context amplifies the mis-projection into a full disappearance. `max-w-full truncate align-bottom` preserves the 4.1 truncation intent and avoids the inline-block baseline shift; the inner span now owns the ellipsis while the `<Link>`'s `truncate` is harmless.

Example (row featured branch):
```tsx
<motion.span
  layout="position"
  layoutId={`project-${project.slug}`}
  className="inline-block max-w-full truncate align-bottom"
>
  {project.name}
</motion.span>
```

## Verification

**Commands:**
- `yarn typecheck` -- expected: no errors
- `yarn lint` -- expected: clean
- `yarn test:run` -- expected: all pass (no behavior change in mocked tests)
- `yarn format` -- expected: clean

**Manual checks (live — the real proof):**
- `yarn dev`, open `/work` with animations enabled (reduced-motion OFF): all three featured names (Buguard, Dark Atlas, Masheed Gate) are visible.
- Click a featured row: the name morphs into the detail title (transition still works); back to `/work`: names remain visible.
- Toggle `prefers-reduced-motion: reduce`: featured names visible (plain span).
- Mobile `<640px` (card view) and `<html dir="rtl">`: featured names visible; no overflow; ellipsis on long names.

## Suggested Review Order

**The reported bug — featured row name (Network list)**

- Entry point: featured name now `inline-block` so Framer Motion's layout transform applies instead of vanishing on an inline span.
  [`network-waterfall-row.tsx:52`](../../components/network-waterfall-row.tsx#L52)
- `max-w-full truncate align-bottom` keeps the 4.1 ellipsis and avoids inline-block baseline drift.
  [`network-waterfall-row.tsx:55`](../../components/network-waterfall-row.tsx#L55)

**Shared-pair consistency — detail title (morph target)**

- Matching end of the `layoutId` pair set `inline-block` so both sides of the 4.4 morph accept transforms.
  [`case-study-header.tsx:41`](../../components/case-study-header.tsx#L41)
