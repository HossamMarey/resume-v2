---
title: 'Network table ImageTrail hover effect'
type: 'feature'
created: '2026-06-03'
status: 'done'
baseline_commit: '5dcb871c09d670f8c6e0445e3e0eb1bbc7bc2f6f'
context: ['{project-root}/_bmad-output/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Network projects table is static on hover. We want a tactile, on-brand flourish: hovering a project row spawns that project's screenshots, which follow the cursor and fade out — a Framer-Motion port of reactbits.dev's ImageTrail (no GSAP).

**Approach:** Add an opt-in, variant-selectable ImageTrail layer to the existing project-driven `NetworkWaterfallTable`. Each desktop `<tr>` whose project has `images[]` spawns trail images on cursor travel, clipped to the table. Pure `transform`/`opacity`/`filter` animation via Framer Motion; fully gated off under `prefers-reduced-motion` and on the mobile card layout.

## Boundaries & Constraints

**Always:**
- Keep the current `NetworkWaterfallTable` contract (`projects: readonly Project[]`); add only an optional `variant?: 1..8` prop (default `1`). Trail images come per-row from `project.images` (the intent's `items`); `columns`=HEADERS, `rows`=projects already exist.
- Import motion from `framer-motion`. Gate ALL motion behind `useShouldAnimate()` (`@/hooks/use-should-animate`) — when false, spawn nothing.
- Implement all easing/interpolation with Framer Motion (`motion`, `AnimatePresence`, keyframe `animate`, motion values) — NO GSAP, no new deps.
- `useRef` for cursor tracking + image-cycle index + last-spawn point; `useState` ONLY for the live trail array.
- Spawn only after ≥80px cursor travel since the last spawn; cycle through the row's images.
- Wrap the table in a `relative overflow-hidden` container; trail images are `absolute`, centered on the cursor at spawn, `pointer-events-none`, clipped to that container.
- Animate `transform`/`opacity`/`filter` only — never `top`/`left`/`width`/`height`. Static `left`/`top` for placement is fine (set once, never animated).
- `next/image` for trail images (fill + `sizes`, decorative `alt=""`, `onError` hide) — matches `project-media-gallery.tsx`.
- Existing `network-waterfall-table.test.tsx` must still pass unchanged.

**Ask First:**
- Adding any dependency, or changing the public `Project`/table prop shape beyond the additive `variant`.

**Never:**
- GSAP or any animation lib; client-side data fetching; touching the Telegram/contact, XP, or other unrelated systems.
- Running the effect under reduced-motion or on the `<640px` card layout.
- Refactoring to the generic `columns/rows/items` reactbits API (explicitly rejected — stay project-driven).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Hover row, travel ≥80px | project with images, motion allowed | New trail image spawns at cursor, cycles to next image, scale 0→1 then fades | N/A |
| Hover row, travel <80px | continuous small moves | No new spawn until cumulative threshold crossed | N/A |
| Row has no images | `images: []` | No spawn; row behaves as today | N/A |
| Mouse leaves row | active trail present | Stop spawning; in-flight images finish their own fade/exit | N/A |
| `prefers-reduced-motion` | reduce | Effect fully disabled; table unchanged | N/A |
| Mobile card layout | `<640px` | No handlers, no overlay, no spawn | N/A |
| Broken image URL | bad `src` | `onError` hides that image; no layout break | hide element |

</frozen-after-approval>

## Code Map

- `components/network-waterfall-table.tsx` -- EDIT: add `variant` prop; wrap `<table>` in the trail container/provider.
- `components/network-waterfall-row.tsx` -- EDIT: `<tr>` consumes trail handlers via context; attach `onMouseEnter/Move/Leave` passing `project.images`.
- `components/network-image-trail.tsx` -- NEW: `NetworkImageTrail` container (relative/overflow-hidden + absolute overlay + `AnimatePresence`), `ImageTrailContext`/`useImageTrailHandlers`, per-variant `ImageTrailItem` renderer, `ImageTrailVariant` type.
- `hooks/use-image-trail.ts` -- NEW: tracking engine — refs (last-spawn point, index, pointer velocity), trail `useState`, 80px-threshold spawn, row enter/move/leave handlers, reduced-motion no-op.
- `components/network-page-client.tsx` -- EDIT: pass a chosen `variant` (module const) to the table.
- `hooks/use-should-animate.ts`, `components/project-media-gallery.tsx` -- REFERENCE patterns.

## Tasks & Acceptance

**Execution:**
- [x] `hooks/use-image-trail.ts` -- build the engine hook: `containerRef`, trail state, refs for index/last-spawn/velocity; `onRowEnter(images)` resets spawn baseline, `onRowMove(images, e)` spawns past 80px computing rel-coords from `containerRef.getBoundingClientRect()` + velocity/angle/speed, `onRowLeave()` stops spawning; `removeItem(id)`; all handlers no-op when `!useShouldAnimate()`. Trail item carries `{ id, src, x, y, vx, vy, angle, speed }`.
- [x] `components/network-image-trail.tsx` -- container with `relative overflow-hidden` + absolute `pointer-events-none` overlay; provide handlers via context; render `<AnimatePresence>` over `trail`; `ImageTrailItem` maps `variant`→motion props (see Design Notes); static placement wrapper centers via Tailwind `-translate-x-1/2 -translate-y-1/2`, inner `motion.div` owns animated transform/opacity/filter; `onAnimationComplete`→`removeItem` (except queue variant). Export `ImageTrailVariant`.
- [x] `components/network-waterfall-row.tsx` -- consume `useImageTrailHandlers()` (no-op if absent); wire `<tr>` mouse handlers with `project.images`; leave card untouched.
- [x] `components/network-waterfall-table.tsx` -- add `variant?: ImageTrailVariant` (default 1); wrap `<table>` (and overlay) in `<NetworkImageTrail variant>`.
- [x] `components/network-page-client.tsx` -- pass `variant` (module-level const, default 1) to the table.
- [x] `hooks/use-image-trail.test.ts` (or `components/network-image-trail.test.tsx`) -- cover the I/O matrix: ≥80px spawns, <80px doesn't, image cycling, empty-images no-op, reduced-motion no-op (mock `useReducedMotion`→true), leave stops spawning.

**Acceptance Criteria:**
- Given a desktop user with motion enabled, when they sweep across a row whose project has images, then trail images spawn at the cursor, cycle through that project's images, animate per the active variant, and fade out — all clipped to the table.
- Given `prefers-reduced-motion` or a `<640px` viewport, when hovering/tapping rows, then no trail images appear and the table works exactly as before.
- Given the unchanged `network-waterfall-table.test.tsx`, when the suite runs, then it passes; `yarn typecheck`, `yarn lint`, `yarn test:run` are green.

## Design Notes

8 variants, all Framer-Motion keyframes/motion-values (port reactbits behaviors, no GSAP):
1. **Scale + fade:** `scale:[0,1,1]`, `opacity:[1,1,0]`.
2. **Brightness flash:** as 1 + inner image `filter: brightness(2→1)`.
3. **Float up on exit:** as 1 + `y:[y,y,y-48]` on the fade leg.
4. **Momentum drift:** spawn velocity `vx/vy`; `x/y` drift in pointer direction with decay, then fade.
5. **Rotation by direction:** `rotate = angle` (atan2 of movement); scale-in then fade.
6. **Speed blur/grayscale:** `filter: blur(speed)px grayscale(speed)` easing to 0 over the life.
7. **Queue persistence:** no auto-fade; cap trail length (~5), FIFO; removed item plays `AnimatePresence` exit (scale/opacity → 0).
8. **3D tilt:** container `perspective`; `rotateX/rotateY` from movement direction; scale-in then fade.

Two-element placement avoids the framer-overwrites-`transform` trap: outer static `<div style={{left,top}}>` with Tailwind translate centering; inner `motion.div` animates. Trail box ~128×80 (16:9). Coordinates use physical `left` from `clientX - rect.left` (correct in LTR & RTL).

## Verification

**Commands:**
- `yarn typecheck` -- expected: no errors.
- `yarn lint` -- expected: clean (no raw `<img>`, logical-property compliant).
- `yarn test:run` -- expected: all pass incl. new trail tests + untouched table test.

**Manual checks:**
- `yarn dev` → Network tab: sweep a row with images (e.g. Buguard) → images trail the cursor and fade; try `variant` 1–8 via the const. Leave row → spawning stops, trail finishes. OS reduce-motion on → nothing spawns. Resize <640px → cards, no effect. `D` theme toggle + `dir="rtl"` still fine.

## Suggested Review Order

**Trail engine (start here)**

- Entry point — the spawn decision: rel-coords, 80px threshold, velocity/angle, image cycling.
  [`use-image-trail.ts:65`](../../hooks/use-image-trail.ts#L65)
- `useState` only for the live trail; refs for index/last-spawn/velocity; reduced-motion no-op gate.
  [`use-image-trail.ts:37`](../../hooks/use-image-trail.ts#L37)
- Per-variant vs global hard cap (`MAX_TRAIL`/`QUEUE_LIMIT`) — bounds DOM under fast sweeps.
  [`use-image-trail.ts:109`](../../hooks/use-image-trail.ts#L109)
- Leave: stop spawning; clear queue variant so it exits instead of freezing.
  [`use-image-trail.ts:119`](../../hooks/use-image-trail.ts#L119)

**Rendering & the 8 variants**

- Variant→motion-props map (scale/fade → momentum → rotation → blur → queue → 3D tilt).
  [`network-image-trail.tsx:73`](../../components/network-image-trail.tsx#L73)
- Two-element placement (static `left/top` + animated `motion.div`); error hides whole box.
  [`network-image-trail.tsx:180`](../../components/network-image-trail.tsx#L180)
- Container is `relative`; only the overlay clips (`overflow-hidden`) so focus rings aren't cut.
  [`network-image-trail.tsx:29`](../../components/network-image-trail.tsx#L29)

**Wiring into the table**

- Context-fed row handlers; no-op when no images / no provider (keeps cards & SSR untouched).
  [`network-waterfall-row.tsx:66`](../../components/network-waterfall-row.tsx#L66)
- Additive `variant?` prop (default 1); wraps the table in the trail provider.
  [`network-waterfall-table.tsx:22`](../../components/network-waterfall-table.tsx#L22)
- Live page selects the variant via a single module const.
  [`network-page-client.tsx:18`](../../components/network-page-client.tsx#L18)

**Tests (peripheral)**

- I/O matrix coverage: threshold, cycling, empty/reduced-motion no-ops, leave, queue cap & clear.
  [`use-image-trail.test.ts:1`](../../hooks/use-image-trail.test.ts#L1)
