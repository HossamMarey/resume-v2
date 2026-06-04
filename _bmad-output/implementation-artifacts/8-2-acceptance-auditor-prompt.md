# Acceptance Auditor Review Prompt

You are an **Acceptance Auditor**. Review this diff against the spec and context docs. Check for: violations of acceptance criteria, deviations from spec intent, missing implementation of specified behavior, contradictions between spec constraints and actual code.

## Spec File

```markdown
# Story 8.2: Reconcile Recruiter Mode, Console & Command Palette with the Experience / Network / Performance changes

## Acceptance Criteria

1. **Recruiter Mode shows work history.** `components/recruiter-resume.tsx` gains an **Experience** section sourced from `lib/content/experience.ts` (`experience`), rendered editorially (NOT the DevTools timeline visual). For each company it shows: company name, employment `type` + computed company-level duration, `location` · `locationType` (when present), and the nested `roles[]` each with role name and `date-range · duration`. Durations reuse the existing `lib/utils/experienceDuration.ts` helpers (`formatCompanyDuration`, `formatDateRange` / `formatExperienceDuration`) — **do not** re-implement date math. Full-time and Freelance render as two labeled subsections (group by `experience[].category`), in the same declaration order as the data.

2. **Recruiter Experience section fits the editorial layout.** It uses the same `max-w-3xl`, `font-title` headings, semantic-token styling, and section rhythm as the existing Recruiter sections (Featured work / Skills). It is **print-clean** — visible (not `print:hidden`) and degrades to single-column black-on-white under `app/recruiter/print.css` like the other resume sections. No DevTools chrome, no XP, no `lime`-on-body-text (AA: lime only for large text/labels). One `<h1>` on the page is preserved (the section uses `<h2>`/`<h3>`).

3. **Palette Navigate group matches the live nav.** In `components/command-palette.tsx`, the **Navigate** group is reconciled with the chrome tab set and order. The chrome tabs are now: **Elements, Experience, Network, Console, Sources** (`components/devtools-chrome.tsx:32-39`). The palette's Navigate entries are reordered to match that order, with **Experience** sitting where the chrome puts it (right after Elements), followed by the non-tab destinations (Contact, Recruiter) at the end.

4. **Performance is treated consistently everywhere.** Performance is hidden from the chrome nav. Per the decision in Dev Notes ("Performance: soft-hide"), the **"Performance" entry is removed from the palette Navigate group** and **`/perf` is removed from `app/sitemap.ts` `staticRoutes`** — but the `/perf` route, its page, and its components are **left intact** (hidden, not deleted). After this story, no user-facing navigation or discovery surface (chrome tabs, palette, sitemap) advertises Performance, and there is no longer a palette entry pointing at an un-navigable tab.

5. **Console REPL is consistent with the routes and content.** `lib/repl/commands.ts`:
   - The existing **`experience`** command (with `--fulltime` / `--freelance` flags) is verified to still run against the current `experience` data shape and is listed in `/help`. _(It already exists — confirm it works, don't duplicate.)_
   - The **`contact`** command's `navigate` target is reconciled with the palette's Contact target. The palette navigates to `/sources?tab=contact`; the REPL navigates to `/sources`. Make them point at the **same** destination (prefer `/sources?tab=contact` if the Sources page reads that param — verify in `app/(chrome)/sources/page.tsx` / its client; if the tab param is not honored, fall back to `/sources` in BOTH surfaces so they still agree).
   - There is **no stale `perf`/`performance` command** to remove (none exists today) — confirm none is added, and `/help` lists only commands whose effects still work.

6. **No dead links anywhere.** Every route referenced by the palette Navigate group and by REPL `navigate` effects resolves to an existing route. Specifically: `/`, `/experience`, `/work`, `/console`, `/sources`, `/recruiter`, and the contact target all exist; `/perf` is no longer referenced by palette or sitemap (route file may remain).

7. **Behavior preserved (regression guard).** The reconciliation must not break existing behavior:
   - Palette still opens on ⌘K/Ctrl+K and from "Inspect me"; the Projects/Actions/Socials groups are unchanged; the konami-gated **Experimental** action still only appears when `isUnlocked("konami") && EXPERIMENTAL_ENABLED`.
   - REPL history (↑/↓), `clear`, `download resume`, `theme`, `whoami`, `projects [--featured|--tag]`, unknown-command `did you mean`, and the konami-locked `experimental` command all still behave as before.
   - Recruiter Mode still mounts outside the `(chrome)` group (no XP/palette/konami), the **exit** control still works, and the Download Resume CTA + contact links are unchanged.

8. **Tests updated and green.** Existing tests that assert palette/REPL/recruiter/sitemap content are updated to match (do not delete coverage):
   - `app/sitemap.test.ts` — expected route count/contents updated for the removed `/perf` (and the already-present `/experience`).
   - `components/command-palette.test.tsx` — Navigate group contents/order; absence of a Performance entry.
   - `lib/repl/commands.test.ts` — `contact` target; `experience` command still covered.
   - `components/recruiter-resume.test.tsx` — asserts the new Experience section renders companies + roles. Query by role/text (company name heading, a role name), **not** snapshots.

9. **Quality gates pass.** `yarn typecheck`, `yarn lint`, `yarn test:run` clean, `yarn format` run. Verified live per the project-context UI checklist: golden path (open palette → Navigate lists the right tabs in the right order, no Performance; `/recruiter` shows the Experience section; console `experience` + `contact` work), no console errors/warnings, `D`-key theme toggle still works, `<html dir="rtl">` not broken (logical properties in the new Recruiter section), `<640px` not broken.
```

## Context Docs

```markdown
# Project Context Rules Relevant to This Review

- TS strict + isolatedModules — no import React; named exports for components
- Tailwind v4, semantic tokens only — text-foreground, text-muted-foreground, bg-surface, border-hairline. No hardcoded hex. Dark-only.
- Server Components by default — Recruiter Experience section is static; no "use client"
- RTL — logical properties only (ms-/me-/ps-/pe-), never ml-/left-
- a11y — one <h1> per route; WCAG AA (lime only for large text/labels); visible focus rings
- Testing — Vitest globals: true, colocate *.test.tsx, query by role/text, no snapshots, don't test Tailwind classes
- Zod is source of truth — read experience/projects as-is
- No new dependency without user approval
```

## Diff to Review

```diff
[Same diff as blind-hunter prompt]
```

## Output Format

Produce a Markdown list of findings. Each finding:
- **Title**: one-line description of the violation
- **AC Violated**: which acceptance criterion number(s)
- **Evidence**: quote from the diff that contradicts the spec
- **Severity**: Must Fix / Should Fix / Question

If all ACs are satisfied, say "All acceptance criteria satisfied."
