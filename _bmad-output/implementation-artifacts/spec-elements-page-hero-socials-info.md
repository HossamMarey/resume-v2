---
title: 'Elements page: cap hero, add social icons, drop Principles, add personal-info block'
type: 'feature'
created: '2026-06-03'
status: 'done'
baseline_commit: 'd7fe83b7d4feca6c8aab70092a546b69e41e09bc'
context: ['{project-root}/_bmad-output/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The Elements front page (`app/(chrome)/page.tsx`) has an oversized full-viewport hero with no social links, shows a Principles section Hossam no longer wants, and lacks an at-a-glance "about me" facts block.

**Approach:** Cap the hero at `max-height: 500px` and add a row of icon-only social links sourced from the typed profile (single source of truth, so the `⌘K` palette + recruiter footer enrich automatically). Remove the Principles section and its now-orphaned component/data. Add a "General Info" facts block under the Stack section built from the reusable `ComputedStylesPanel` idiom.

## Boundaries & Constraints

**Always:**
- Semantic tokens only (no hardcoded hex/oklch); use `lucide-react` `Mail` where applicable, inline brand SVGs for github/linkedin/behance/youtube/whatsapp (lucide has no brand icons).
- No new dependencies. Social/info data stays typed in `lib/content/profile.ts`, validated by Zod.
- Icon links: accessible name via `aria-label`, SVG `aria-hidden`, visible focus ring; external links `target="_blank" rel="noopener noreferrer"`; `mailto:` link has no `target`.
- Respect `prefers-reduced-motion` for any motion (reuse `useShouldAnimate`).

**Ask First:**
- Removing `profile.principles` data + deleting `principles-panel.tsx`/`.test.tsx` (fully dropping Principles, not just hiding it on the page).

**Never:**
- Do not add a brand-icon npm package or change the contact/Telegram route.
- Do not touch the recruiter resume layout beyond the data it already derives from `profile.socials`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Render social row | `profile.socials` (6 entries) | One icon link per social, accessible label = social label | N/A |
| `mailto:` social | href `mailto:hosmarey@gmail.com` | Renders Mail icon, opens mail client, no `target="_blank"` | N/A |
| Zod parse of socials | href = `mailto:...` | Schema accepts `mailto:`/`https:` hrefs | parse throws at module load if invalid |
| Tall viewport | hero | Section height clamped to `max-h-[500px]` | N/A |

</frozen-after-approval>

## Code Map

- `lib/content/profile.ts` -- ProfileSchema + data; extend `socials` (add `icon`, broaden href to allow `mailto:`), add typed `personalInfo` array, REMOVE `principles`.
- `app/(chrome)/page.tsx` -- hero section (cap height, mount social row), drop `<PrinciplesPanel>`, mount `<GeneralInfo>` after `<StackMarquee>`; drop `personJsonLd.sameAs`? keep — still valid.
- `components/brand-icons.tsx` -- NEW: inline-SVG `BrandIcon` (github/linkedin/behance/youtube/whatsapp); presentational.
- `components/social-links.tsx` -- NEW: icon-link row from `profile.socials`; server component.
- `components/general-info.tsx` -- NEW: facts block via `ComputedStylesPanel`/`Cell`.
- `components/principles-panel.tsx` + `components/principles-panel.test.tsx` -- DELETE (orphaned after removal).
- `components/command-palette.tsx`, `components/recruiter-resume.tsx` -- read `profile.socials`; verify they still render with new entries (no code change expected).

## Tasks & Acceptance

**Execution:**
- [x] `lib/content/profile.ts` -- add `icon` enum to social shape, broaden `href` to accept `mailto:`/`https:` (refine, since zod url() may reject `mailto:`), replace `socials` with the 6 entries (github, linkedin, behance, youtube, whatsapp, email→`mailto:hosmarey@gmail.com`); clean stray quote in wa.me URL; add typed `personalInfo: {label, value}[]` with the 6 facts; REMOVE the `principles` field + data.
- [x] `components/brand-icons.tsx` -- NEW inline-SVG brand icon component keyed by icon name, `aria-hidden`, size via `className`.
- [x] `components/social-links.tsx` -- NEW row of icon links from `profile.socials`; `aria-label`, focus ring, external `target`/`rel`, `mailto` handled.
- [x] `components/general-info.tsx` -- NEW facts block (`ComputedStylesPanel` + `Cell`, mono labels, `text-lime` keys) from `profile.personalInfo`, heading "General Info".
- [x] `app/(chrome)/page.tsx` -- cap hero (`max-h-[500px]`, replace `min-h-[calc(100vh-4rem)]`, reduce vertical padding so content fits), render `<SocialLinks>` in hero content, remove `<PrinciplesPanel>` + import, add `<GeneralInfo>` after `<StackMarquee>`.
- [x] DELETE `components/principles-panel.tsx` + `components/principles-panel.test.tsx`.
- [x] `components/social-links.test.tsx` (or extend existing) -- unit-test the I/O matrix: renders one accessible link per social, `mailto` entry has no `target`, external entries have `rel="noopener noreferrer"`.

**Acceptance Criteria:**
- Given the Elements page, when rendered on a tall viewport, then the hero section height does not exceed 500px.
- Given the hero, when shown, then six social icon links render, each keyboard-focusable with a visible ring and an accessible name.
- Given the page, when scanned, then no Principles section appears and a "General Info" facts block appears under Stack with all six facts.
- Given `yarn typecheck && yarn test:run`, when run, then they pass with no reference to the deleted Principles module.

## Design Notes

`max-h-[500px]` is a hard cap: on small screens the stacked hero content (name clamp + role + tagline + CTA + icons) could approach that height. Keep hero padding modest (e.g. `py-10`) and do NOT set `overflow-hidden`, so nothing is clipped if content is tall. Hossam asked for the literal cap — flagging the small-viewport tradeoff for his call at review.

Note: `Last Update: Aug. 2023` is included verbatim per the request, though it predates today (2026-06-03) — likely stale; left as-authored.

`personalInfo` facts (verbatim):
Nationality: Egyptian · DOB: 11/1992 · Address: Mansoura (ready to relocate) · Freelance: Not Available · Status: Buguard (full time) · Last Update: Aug. 2023

## Verification

**Commands:**
- `yarn typecheck` -- expected: no errors (no dangling `principles`/`PrinciplesPanel` refs).
- `yarn test:run` -- expected: pass; new social-links test green; deleted principles test no longer collected.
- `yarn lint` -- expected: clean (next/link, next/image rules; no a11y regressions).

**Manual checks:**
- `yarn dev` → Elements page: hero ≤500px, six focusable social icons (tab through), no Principles section, General Info block under Stack; `⌘K` Socials group lists all six; `D` theme toggle still works; mobile <640px not clipping.

## Suggested Review Order

**Composition (start here)**

- Entry point: the page now renders SocialLinks in the hero and GeneralInfo after Stack; Principles gone.
  [`page.tsx:77`](../../app/%28chrome%29/page.tsx#L77)

**Typed content (single source of truth)**

- Socials list drives hero icons, ⌘K Socials group, and recruiter footer alike.
  [`profile.ts:61`](../../lib/content/profile.ts#L61)

- Schema: `icon` enum added; href broadened via `new URL()` refine to accept `mailto:`.
  [`profile.ts:3`](../../lib/content/profile.ts#L3)

- New `personalInfo` facts feeding the General Info block.
  [`profile.ts:93`](../../lib/content/profile.ts#L93)

**Social links UI (boundary-crossing: external links + a11y)**

- `mailto:` links omit `target`; external links get `target=_blank rel=noopener noreferrer`; icon `aria-label`.
  [`social-links.tsx:11`](../../components/social-links.tsx#L11)

- Inline brand SVGs (lucide has no brand icons); `email` falls back to lucide `Mail`.
  [`brand-icons.tsx:5`](../../components/brand-icons.tsx#L5)

**General Info UI**

- Reuses the ComputedStylesPanel idiom; label→value facts grid.
  [`general-info.tsx:7`](../../components/general-info.tsx#L7)

**Peripherals (tests)**

- New: asserts per-social link + mailto/external attribute behavior.
  [`social-links.test.tsx:7`](../../components/social-links.test.tsx#L7)

- Updated: email now arrives via socials, so assert exactly one mailto (no duplicate from empty `profile.email`).
  [`recruiter-resume.test.tsx:72`](../../components/recruiter-resume.test.tsx#L72)

- Updated: `whoami` tagline assertion now derives from `profile.tagline` (was a hardcoded literal).
  [`commands.test.ts:62`](../../lib/repl/commands.test.ts#L62)
