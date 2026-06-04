---
title: 'Recruiter skills as chip-tags + full-stack marquee'
type: 'feature'
created: '2026-06-04'
status: 'done'
baseline_commit: 'f3cd666007c2ba3142edec2d7960344fc50b1657'
context: ['{project-root}/_bmad-output/project-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `skills.ts` now has an `AI Tools` group, but the recruiter Skills
section renders every group as a flat vertical text list (cramped 3-col grid),
and the home-page `StackMarquee` is fed only `primarySkills`, so AI Tools and all
secondary-tier skills never appear there.

**Approach:** Redesign the recruiter Skills section to render each group's
skills as wrapping chip-tags (`Badge` outline, flex auto-flow), full-width so
they reflow naturally — AI Tools included. Add an `allSkills` selector and feed
it to `StackMarquee` so the marquee shows the complete stack.

## Boundaries & Constraints

**Always:**
- Reuse the existing `Badge` primitive (`variant="outline"`) — it is already
  used for chips in this same component's Featured-work cards.
- Preserve `<ul>`/`<li>` semantics and the per-group `<h3>` headings (recruiter
  tests query group headings by role).
- Use semantic Tailwind tokens only; let `cn`/`cva` sort classes.
- `allSkills` mirrors the `primarySkills` pattern: derived from `skillGroups`,
  `Object.freeze`d, typed `readonly Skill[]`, exported from both `skills.ts`
  and the `lib/content/index.ts` barrel.

**Ask First:**
- Adding any new dependency (none expected).
- Changing the `StackMarquee` component's internal markup/animation.

**Never:**
- Editing the skills *content/data* in `skills.ts` (the `legacy` array is the
  user's authored data — AI Tools already added).
- Introducing progress bars or percentage text in the recruiter Skills section
  (an existing test forbids it).
- Adding a state lib, changing routing, or touching unrelated sections.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Full stack | `skillGroups` (4 groups) | `allSkills` = every skill across all groups, in group order | N/A |
| Marquee feed | `allSkills` passed to `StackMarquee` | All skill names render (animated dup + reduced-motion single) | N/A |
| Unique keys | flattened skills | No duplicate `skill.name` → stable React keys | names are unique across groups today |

</frozen-after-approval>

## Code Map

- `lib/content/skills.ts` -- add `allSkills` selector beside `primarySkills`.
- `lib/content/index.ts` -- re-export `allSkills` from the barrel.
- `app/(chrome)/page.tsx` -- import & pass `allSkills` to `StackMarquee` instead of `primarySkills`.
- `components/recruiter-resume.tsx` -- Skills section (lines ~146-167): chip-tag redesign.
- `lib/content/skills.test.ts` -- add `allSkills` selector coverage.
- `components/recruiter-resume.tsx` (tests) -- existing group-heading test stays green; no change required.

## Tasks & Acceptance

**Execution:**
- [x] `lib/content/skills.ts` -- export `allSkills: readonly Skill[]` = `Object.freeze(skillGroups.flatMap((g) => g.skills))`, mirroring `primarySkills`.
- [x] `lib/content/index.ts` -- add `allSkills` to the existing `./skills` re-export block.
- [x] `app/(chrome)/page.tsx` -- swap the import and `<StackMarquee skills={...} />` arg from `primarySkills` to `allSkills`.
- [x] `components/recruiter-resume.tsx` -- change the Skills `<div>` from `grid ... sm:grid-cols-3` to a full-width vertical stack of groups; render each group's skills as a `flex flex-wrap gap-2` `<ul>` whose `<li>` wraps a `<Badge variant="outline">{skill.name}</Badge>`. Keep the group `<h3>` headings.
- [x] `lib/content/skills.test.ts` -- add: `allSkills` is non-empty and its length equals the sum of all `skillGroups` skills (no drops/dupes).

**Acceptance Criteria:**
- Given the recruiter page, when it renders, then each skill group (including "AI Tools") shows its skills as pill/chip badges that wrap in a flex auto-flow row, with no progress bars or `%` text.
- Given the home page marquee, when it renders, then every skill from every group appears (not just primary-tier), in both the animated and reduced-motion branches.
- Given `yarn typecheck && yarn lint && yarn test:run`, when run, then all pass.

## Design Notes

Chip example (matches the Featured-work badge idiom already in this file):

```tsx
<ul className="flex flex-wrap gap-2" role="list">
  {group.skills.map((skill) => (
    <li key={skill.name}>
      <Badge variant="outline">{skill.name}</Badge>
    </li>
  ))}
</ul>
```

Groups stack full-width (`flex flex-col gap-8`) so long groups (Main skills has
20 items) reflow instead of being squeezed into a 1/3 column. `Badge` is already
imported in `recruiter-resume.tsx`.

## Verification

**Commands:**
- `yarn typecheck` -- expected: no errors.
- `yarn lint` -- expected: clean.
- `yarn test:run` -- expected: all green (recruiter + skills + marquee suites).

**Manual checks:**
- `yarn dev` → `/recruiter`: Skills groups render as wrapping chip rows, AI Tools present, no bars/%. Print preview still legible.
- `/` (home): marquee scrolls the full stack incl. AI Tools; reduced-motion shows the static wrap with each name once.

## Suggested Review Order

**Data layer — the new selector (entry point)**

- The whole change hinges on this: every skill, frozen, mirroring `primarySkills`.
  [`skills.ts:153`](../../lib/content/skills.ts#L153)

- Barrel re-export so consumers can import from `@/lib/content`.
  [`index.ts:29`](../../lib/content/index.ts#L29)

**UI binding — what now consumes it**

- Home marquee swapped to the full stack (was `primarySkills`).
  [`page.tsx:81`](<../../app/(chrome)/page.tsx#L81>)

- Recruiter skills become wrapping chip-tags; `flex flex-wrap` of `Badge` outline.
  [`recruiter-resume.tsx:157`](../../components/recruiter-resume.tsx#L157)

**Tests — invariant guards**

- New coverage: count-complete, name-unique (React-key contract), superset of primary.
  [`skills.test.ts:20`](../../lib/content/skills.test.ts#L20)
