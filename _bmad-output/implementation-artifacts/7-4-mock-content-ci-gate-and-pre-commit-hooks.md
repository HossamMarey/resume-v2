# Story 7.4: Mock-content CI gate and pre-commit hooks

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Scope seam (2026-06-02): This story wires two LAUNCH-READINESS GUARDRAILS and ships NO product/UI code:
     (1) a mock-content gate (ARCH-6 / A19) that fails when any FEATURED project still carries meta.mock:true, run as a SEPARATE CI job + `yarn gate:content` — deliberately RED today (all 3 featured projects are still mock) and turning green only once Hossam authors real case-study content (OQ4);
     (2) a pre-commit hook (NFR-O3 / A16) via simple-git-hooks running `yarn typecheck && yarn lint && yarn test:run && yarn format`.
     It does NOT author case-study content (separate OQ4 authoring task), and does NOT do CSP / Lighthouse / Vercel deploy (Story 7.5). It must NOT add the mock gate to pre-commit or `test:run` (that would block every local commit while content is still mock). -->

## Story

As Hossam (maintainer),
I want the build to fail if placeholder content or broken quality gates slip through,
so that the launch never ships mock case studies.

## Acceptance Criteria

1. **(ARCH-6 + A19 — mock-content gate detects featured placeholders)** A content gate fails when **any `featured: true` project in `lib/content/projects.ts` still has `meta.mock === true`**, and reports which slug(s) are offending. The gate is invokable as **`yarn gate:content`** and exits non-zero on violation, zero when clean. Because all three featured projects (`buguard`, `dark-atlas`, `masheed-gate`) are **currently `meta.mock: true`**, the gate **MUST fail today** — that red state is the intended launch blocker for Story 7.5, signalling that real content (OQ4) is still owed. Do **NOT** make it pass by editing `meta.mock`/placeholder copy (content authoring is out of scope). [Source: epics.md:809-811; architecture.md:74,168,246; prd.md:473 (A19 Confirmed); lib/content/projects.ts:118-228,448-455]

2. **(ARCH-6 — referential integrity of project links)** The same gate verifies that **every project-slug reference resolves to an existing `Project.slug`**. NOTE the doc-vs-code variance: the current `ExperienceSchema` has **no `projectSlugs` field** (it links via `highlights[]`, not slugs) — see Dev Notes variance #3. The check MUST therefore be written **defensively**: collect the set of `projects[].slug`, and for any experience entry that *does* expose a `projectSlugs: string[]` (none today), assert each value is in that set. With zero such references today this sub-check **passes vacuously** and must not crash. [Source: epics.md:811; lib/content/experience.ts:16-29; lib/content/projects.ts:6-35]

3. **(Gate isolation — never blocks local dev / pre-commit)** The mock-content gate runs **only** via `yarn gate:content` and its dedicated **CI job** — it is **NOT** part of `yarn test:run`, **NOT** part of the pre-commit hook, and **NOT** prefixed onto `yarn build`. The default `yarn test:run` (which the pre-commit hook calls) must stay **green** and must **not** discover/execute the gate spec. [Source: architecture.md:223 (GH Action "may run … plus the mock-content grep"); project-context.md:122-133,199; user decision 2026-06-02 — separate CI job, red-until-authored]

4. **(NFR-O3 + A16 — pre-commit hook via simple-git-hooks)** A pre-commit hook runs **`yarn typecheck && yarn lint && yarn test:run && yarn format`** using **`simple-git-hooks`** (added as a devDependency — user-approved 2026-06-02). Config lives in the `package.json` `"simple-git-hooks"` key; a `package.json` script installs the hook on `yarn install`; the hook is verified to fire on a real commit. **`--no-verify` must never be used to bypass it.** [Source: epics.md:813-815; architecture.md:224; prd.md:305,470 (A16); project-context.md:199,206; user decision 2026-06-02 — simple-git-hooks]

5. **(CI workflow — quality green, content-gate red)** A GitHub Actions workflow (`.github/workflows/ci.yml`) runs on push/PR with **two jobs**: a **`quality`** job (`yarn install --frozen-lockfile` then `yarn typecheck && yarn lint && yarn test:run && yarn build`) that must pass, and a **separate `content-gate`** job (`yarn gate:content`) that is the visible **launch blocker** (red until OQ4 content is authored). If the repo has no GitHub remote yet, the workflow is **dormant** but committed; `yarn gate:content` still works as the manual gate. [Source: architecture.md:222-223; user decision 2026-06-02; gitStatus — local `master`, no remote]

6. **(No product/regression impact)** This story adds **only** tooling/config (`scripts`/test-config/CI/hook) — **no** `app/`, `components/`, `hooks/`, or `lib/content/*` data changes, **no** `"use client"`, **no** route or UI change. `yarn dev`, all five DevTools tabs, `/recruiter`, the XP bus, and the `D`/`⌘K`/Konami hotkeys behave exactly as before. The Zod content collections and their existing colocated tests are untouched. [Source: project-context.md:164-177,292-308; lib/content/*]

7. **(Gates green where they should be + hook verified live)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean (the gate spec is excluded from `test:run`, so the suite stays green). `yarn gate:content` **fails today** with a clear message naming the mock featured slugs (this is correct — record it explicitly in Completion Notes). The pre-commit hook is **verified to actually run** on a trial commit (and to block a commit that fails a gate). State in Completion Notes that the hook was verified live. [Source: project-context.md:199,209-216; AC1 red-by-design]

## Tasks / Subtasks

- [x] **Task 1 — Mock-content gate logic as a Vitest spec (AC: 1, 2)**
  - [x] Create `tests/gate/mock-content.test.ts` that imports `{ projects, experience } from "@/lib/content"` (test real lib modules per project-context §Testing — do NOT re-implement parsing).
  - [x] Assert **no featured project is mock**: `projects.filter((p) => p.featured && p.meta.mock)` is empty; on failure the assertion message must list the offending `slug`s (e.g. `expect(offenders, \`featured projects still mock: ${offenders.join(", ")}\`).toEqual([])`).
  - [x] Assert **referential integrity defensively**: build `const slugs = new Set(projects.map((p) => p.slug))`; for each `experience` entry, read `projectSlugs` via a guarded accessor (`const refs = (e as { projectSlugs?: string[] }).projectSlugs ?? []`) and assert every ref is in `slugs`. (Zero refs today → vacuously passes; keeps typecheck happy without inventing a schema field.)
  - [x] Do NOT edit `lib/content/projects.ts` content to make this pass — it is supposed to be RED now (AC1).

- [x] **Task 2 — Wire the gate as `yarn gate:content`, isolated from the default suite (AC: 1, 3)**
  - [x] Add `vitest.gate.config.ts` that extends the base config but **includes only** `tests/gate/**` (e.g. `test.include: ["tests/gate/**/*.test.ts"]`, reuse the `@` alias + jsdom setup).
  - [x] In `vitest.config.ts`, **exclude** the gate dir from the default run: `test.exclude: [...configDefaults.exclude, "tests/gate/**"]` (import `configDefaults` from `vitest/config`). Verify `yarn test:run` no longer picks up the gate spec.
  - [x] Add script `"gate:content": "vitest run --config vitest.gate.config.ts"` to `package.json`.
  - [x] Confirm `yarn gate:content` runs ONLY the gate spec and exits non-zero today (mock featured projects).

- [x] **Task 3 — Pre-commit hook via simple-git-hooks (AC: 4)**
  - [x] `yarn add -D simple-git-hooks` (user-approved). Record the resolved pinned version in Completion Notes.
  - [x] Add to `package.json`:
        `"simple-git-hooks": { "pre-commit": "yarn typecheck && yarn lint && yarn test:run && yarn format" }`
        and a `"postinstall": "simple-git-hooks"` script (installs the git hook on `yarn install`; simple-git-hooks no-ops gracefully when `.git` is absent).
  - [x] Run `npx simple-git-hooks` once to install the hook into **this** clone's `.git/hooks/pre-commit`; confirm the file exists and contains the command.
  - [x] See Dev Notes variance #1 re: `yarn format` (writes, doesn't re-stage) — keep the spec string for AC fidelity unless the user opts for the `--check` alternative; record the choice.

- [x] **Task 4 — GitHub Actions CI workflow (AC: 5)**
  - [x] Create `.github/workflows/ci.yml` with `on: [push, pull_request]` and two jobs:
        - `quality`: checkout → setup Node (corepack/yarn) → `yarn install --frozen-lockfile` → `yarn typecheck` → `yarn lint` → `yarn test:run` → `yarn build`.
        - `content-gate`: checkout → install → `yarn gate:content` (this job is the launch blocker and will be RED until OQ4 content lands).
  - [x] Use yarn (NOT npm) consistent with project-context §Package manager; cache yarn if convenient.
  - [x] Note in Completion Notes whether a GitHub remote exists yet (workflow is dormant-but-committed if not).

- [x] **Task 5 — Verify & report (AC: 6, 7)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds (no route flips to `ƒ`).
  - [x] `yarn gate:content` → **fails** naming `buguard`, `dark-atlas`, `masheed-gate` as still-mock. Capture the output in Completion Notes (red-by-design).
  - [x] **Verify the hook live:** stage a trivial change and `git commit` → confirm the four gates run; then deliberately break one (e.g. a type error) and confirm the commit is **blocked**; revert. State explicitly that the hook was verified live.
  - [x] Confirm no `app/`/`components/`/`hooks/`/`lib/content` data changed (tooling-only diff).

## Dev Notes

### What this story IS (and is NOT)
- **IS:** two launch-readiness **guardrails** — (a) the **mock-content gate** (`yarn gate:content` + a dedicated CI job) that blocks launch while any featured project is `meta.mock:true`; (b) the **pre-commit hook** (`simple-git-hooks`) running the four quality gates. Closes **ARCH-6**, **A19**, **NFR-O3**, **A16**. [Source: epics.md:801-815]
- **IS NOT:** authoring real case-study content (that's **OQ4** — Hossam owns the `[PLACEHOLDER]` copy + flipping `meta.mock`), CSP / Lighthouse / Vercel deploy (**Story 7.5**), or any UI/route work. **No product code ships in this story** — it is tooling + config only. [Source: lib/content/projects.ts:144-153 placeholders; epics.md:817-835 (7.5)]

### Confirmed decisions (2026-06-02) — do not relitigate
1. **Hook tool = `simple-git-hooks`** (not husky): lighter, single `package.json` config key, no `.husky/` dir — matches the "no heavy libs" ethos. User-approved as a devDependency. [project-context.md:185 dependency-approval rule]
2. **Mock-gate posture = separate CI job, red-until-content-authored.** Not in pre-commit, not in `test:run`, not prefixed onto `build`. The red `content-gate` job is the intended visible blocker for the 7.5 deploy. [Source: user decision; architecture.md:223]

### Chosen gate mechanism — Vitest spec, not a text grep (read first)
- The architecture phrases the gate as "a CI **grep** `"mock":\s*true` against featured slugs" [architecture.md:168,esp.246; epics.md:151]. We **improve on the literal grep** with a **Vitest spec that imports the real `projects`/`experience` data** because: (a) the literal pattern **does not even match the source** — the TS literal is `meta: { mock: true }` (no quotes), so `"mock":\s*true` finds nothing (variance #2); (b) a grep can't cleanly scope to **featured** entries (legacy projects are generated with `mock:true` via `transform()` and are *expected* to stay mock) ; (c) a spec also does the **referential-integrity** check in one place. This is idiomatic to the project ("**Test real `lib/` modules**", Vitest everywhere) and dep-free (Vitest already installed). [Source: project-context.md:120-133; lib/content/projects.ts:92-116,448-455]
- **Why a dedicated `vitest.gate.config.ts` + `exclude` in the base config:** the gate spec must be **RED now** (mock content) but the pre-commit `yarn test:run` must stay **GREEN**. Isolating the gate into its own config/dir and excluding it from the default run is what keeps local commits unblocked while still giving CI a hard launch gate. [Source: AC3; project-context.md:122-133]
- *(Alternative the dev MAY choose instead, if a literal grep is preferred: a zero-dep `scripts/check-content.mjs` that text-scans the `featuredProjects` array region of `projects.ts` for `/meta:\s*\{\s*mock:\s*true/`. It's faithful to the architecture's wording but brittle to reformatting and weaker at featured-scoping + referential integrity. If chosen, wire it as `"gate:content": "node scripts/check-content.mjs"` and skip the vitest-config changes. Record which mechanism you shipped.)*

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `tests/gate/mock-content.test.ts` | **NEW** | The gate logic: featured-not-mock + defensive referential integrity. Imports real `@/lib/content`. RED today by design. |
| `vitest.gate.config.ts` | **NEW** | Includes only `tests/gate/**`; reuses `@` alias + jsdom setup. Target of `yarn gate:content`. |
| `vitest.config.ts` | **UPDATE** | Add `test.exclude: [...configDefaults.exclude, "tests/gate/**"]` so the default suite/pre-commit skip the gate. Keep `react()`, alias, setup, `globals`. |
| `package.json` | **UPDATE** | Add `"gate:content"` script; add `"simple-git-hooks"` config key + `"postinstall": "simple-git-hooks"`; add `simple-git-hooks` to `devDependencies` (via `yarn add -D`). |
| `.github/workflows/ci.yml` | **NEW** | `quality` job (green) + `content-gate` job (red-until-authored). yarn, `--frozen-lockfile`. |
| `lib/content/projects.ts` | **DO NOT TOUCH** | Featured `meta.mock:true` + `[PLACEHOLDER]` copy stays — flipping it is OQ4 authoring, not this story. The gate is *meant* to fail on it. |
| `lib/content/experience.ts` | **DO NOT TOUCH** | No `projectSlugs` field is added here (variance #3). |
| `next.config.mjs` (CSP) / Lighthouse / Vercel | **DO NOT TOUCH** | Story 7.5. |

### Reuse — do NOT reinvent
- **Existing Zod-parsed collections** `projects` / `experience` from `@/lib/content` — import and assert; do not re-parse or re-read files. [Source: lib/content/index.ts:1-44]
- **Existing Vitest setup** (`tests/setup.ts`, `@` alias, jsdom, `globals:true`) — the gate config reuses it; no `describe/it/expect` imports (globals). [Source: vitest.config.ts:1-17; project-context.md:122-124]
- **The four-gate command string** is already the documented pre-commit gate — copy it verbatim into the hook. [Source: project-context.md:199]
- **`package.json` scripts** already define `typecheck`/`lint`/`test:run`/`format`/`build` — the hook and CI call these, not raw tools. [Source: package.json:6-15]

### Doc-vs-code variances / decisions to surface (do NOT silently resolve)
1. **`yarn format` in a pre-commit hook writes but does not re-stage.** `format` = `prettier --write`; it mutates files mid-commit, and those edits are **not added to the commit** unless re-staged. The spec [epics.md:815] literally lists `yarn format`. This story keeps the spec string for AC fidelity, but the more-correct hook step is **`prettier --check "**/*.{ts,tsx}"`** (fails loudly if anything is unformatted, dev runs `yarn format` then re-commits). Flag which you shipped; if unsure, keep the spec string and note the gotcha. [Source: package.json:11; project-context.md:140]
2. **The architecture's grep pattern `"mock":\s*true` does not match the source.** The TS literal serializes as `meta: { mock: true }` (unquoted key). The Vitest gate sidesteps this by asserting on parsed data; if a literal grep is used instead, the pattern must be `/mock:\s*true/` (and featured-scoped). [Source: architecture.md:168; lib/content/projects.ts:32,153]
3. **`Experience.projectSlugs` does not exist.** Epics/architecture (ARCH-6, epics.md:811) assume `Experience.projectSlugs` references to validate, but the implemented `ExperienceSchema` links via `highlights[]` (title/skills/roles), with **no slug linkage**. The referential-integrity check is therefore **vacuous today** and is written defensively (guarded optional accessor) — it must compile and pass without inventing a schema field. **Do NOT add `projectSlugs` to the Experience model in this story** (schema change = scope creep; would also need data + UI). Surface to the user that the linkage was never built. [Source: lib/content/experience.ts:16-29; epics.md:811]
4. **The gate is intentionally RED at story completion.** Unlike every prior story (which ends all-green), `yarn gate:content` **fails** here — that is the deliverable working correctly (A19 "Confirmed"). Make this unmistakable in Completion Notes so a reviewer doesn't "fix" it by faking content. [Source: prd.md:473; AC1]

### Out of scope (explicitly, to prevent scope creep)
- **Authoring real case-study content / flipping `meta.mock`** — OQ4, Hossam owns it. The gate exists to *force* that work before 7.5.
- **Adding `projectSlugs` to `Experience`** — not built; not this story (variance #3).
- **CSP `next.config.mjs headers()`, Lighthouse 95 pass, Vercel deploy** — **Story 7.5**. [Source: epics.md:817-835]
- **husky** — rejected in favour of simple-git-hooks (decision 1).
- **Putting the mock gate into `test:run`, pre-commit, or `build`** — explicitly forbidden (AC3); it would block local dev while content is mock.

### Previous story / cross-cutting intelligence
- **Story 7.3 (done)** added `app/recruiter/print.css` and explicitly named "the mock-content CI gate (7.4)" as out-of-its-scope next P7 item — confirming this story is the gate's home. It also noted "**Mock content still present:** featured projects are still `meta.mock: true` with `[PLACEHOLDER]` copy … (the mock-content gate is **7.4**)." [Source: 7-3 story Dev Notes variance #4]
- **Stories 7.1 / 7.2 (done)** delivered metadata/JSON-LD and robots/sitemap/OG — all P7 SEO is complete; 7.4 (this) + 7.5 close the launch phase. [Source: sprint-status.yaml:136-141]
- **Content migration (commit `cd5dd09`, Story-era)** authored `lib/content/projects.ts` with three featured placeholders flagged `meta.mock:true` precisely so this gate can catch them. Deferred-work items #5/#6/#11 touch these files but none flip `meta.mock`. [Source: deferred-work.md:59-99]
- **`package.json` `"name": "todo"`** is legacy boilerplate (not renamed) — ignore; do not "fix" it in this story.

### Testing standards (project-context §Testing)
- **Test real `lib/` modules** — the gate imports `projects`/`experience`, it does not mock them. [project-context.md:130]
- **`globals: true`** — no `describe/it/expect` imports in the gate spec. [project-context.md:122]
- **`@` alias works in tests** via `vitest.config.ts` resolve.alias — the gate config must carry the same alias. [project-context.md:123]
- **Don't add low-value tests** — the gate spec is the only new test; it is high-value (a launch guard). No snapshot/class-string tests. [project-context.md:132]
- **The hook itself cannot be unit-tested** — verify it **live** with a trial commit (AC7); "tests/typecheck verify code, not behaviour — if you can't test it live, say so." [project-context.md:209-216]
- Keep the **default** `yarn test:run` green (365+ existing tests) and confirm it does **not** run the gate spec after the `exclude` change.

### Latest tech notes (locked versions — project-context)
- **Vitest 4.1.7** — `configDefaults` is exported from `vitest/config`; spread it when overriding `exclude` so you don't drop Vitest's defaults (`node_modules`, `dist`, etc.). A second config via `--config` is the standard way to run an isolated suite. [Source: project-context.md:56; vitest.config.ts]
- **`simple-git-hooks` (add latest stable `^2.x`)** — config under the `package.json` `"simple-git-hooks"` key; `npx simple-git-hooks` writes `.git/hooks/pre-commit`. Git runs hooks via sh (Git Bash on Windows), so `yarn a && yarn b` works cross-platform. The `postinstall` hook-installer no-ops when `.git` is absent (safe in CI/Docker). Pin the resolved version in Completion Notes; adding it was **user-approved**. [Source: project-context.md:181-185; user decision 2026-06-02]
- **yarn is authoritative** — CI uses `yarn install --frozen-lockfile`; never `npm install`. `yarn.lock` must update when `simple-git-hooks` is added. [Source: project-context.md:181-184,228-229]
- **Next.js 16 `yarn build`** — the CI `quality` job builds to catch type/route regressions Vercel would otherwise catch; no route should flip to dynamic (`ƒ`). [Source: project-context.md:191-199]
- **No `--no-verify`, ever** — document the prohibition; fix the underlying gate failure instead. [Source: project-context.md:206]

### References
- [Source: _bmad-output/planning-artifacts/epics.md:801-815] — Story 7.4 ACs: mock-content gate (grep `"mock":\s*true` on featured slugs fails build; `Experience.projectSlugs` resolve) + pre-commit hook (husky/simple-git-hooks runs the four gates; never `--no-verify`).
- [Source: _bmad-output/planning-artifacts/epics.md:140,151] — NFR-O3 (pre-commit gate string) and ARCH-6 (mock-content launch gate) definitions.
- [Source: _bmad-output/planning-artifacts/architecture.md:74,168,246] — Mock-content launch gate: CI must block launch if any featured slug is `meta.mock:true`; "must be wired before featured-slug authoring."
- [Source: _bmad-output/planning-artifacts/architecture.md:222-224] — CI gates: Vercel build is default; a GH Action may run the four gates plus the mock grep; pre-commit via husky/simple-git-hooks (Phase 7).
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:305,470,473] — NFR-O3 husky/simple-git-hooks; A16 (hook tooling pending); A19 Confirmed (mock gate blocks launch).
- [Source: lib/content/projects.ts:118-228] — three featured projects (`buguard`, `dark-atlas`, `masheed-gate`), all `featured:true`, `meta.mock:true`, `[PLACEHOLDER]` copy.
- [Source: lib/content/projects.ts:6-35,92-116,448-455] — `ProjectSchema` (`featured`, `meta.mock`); `transform()` stamps legacy entries `mock:true`/`featured:false`; frozen `projects` export.
- [Source: lib/content/experience.ts:16-29] — `ExperienceSchema` (no `projectSlugs`; links via `highlights[]`).
- [Source: lib/content/index.ts:1-44] — barrel exports `projects` / `experience` for the gate to import.
- [Source: vitest.config.ts:1-17] — base Vitest config to extend/exclude from.
- [Source: package.json:6-15,37-58] — scripts + devDependencies to extend.
- [Source: _bmad-output/project-context.md:181-216] — package-manager, scripts, pre-commit, git, UI-verification rules.
- [Source: _bmad-output/implementation-artifacts/7-3-recruiter-print-stylesheet.md] — prior story confirming 7.4 = the mock gate, and that content is still mock.

### Project Structure Notes
- `tests/gate/` is a **new** cross-cutting test dir (the project already uses `tests/` for setup + cross-cutting concerns, colocating feature tests next to source) — the gate is a repo-wide launch guard, so `tests/gate/` is the right home, not a colocated `*.test.ts`. [Source: project-context.md:124,164-177]
- `vitest.gate.config.ts` + the base-config `exclude` are the structural mechanism that lets one spec be **red on demand** (`yarn gate:content`) yet **invisible** to the everyday `yarn test:run` — preserving the project's all-green pre-commit invariant.
- `.github/workflows/` is **new** (no CI existed). The two-job split mirrors the architecture's "Vercel build is default; GH Action adds gates" model, with the content gate cleanly separable as the launch blocker.
- This story's diff is **tooling/config only** — zero `app/`/`components/`/`hooks/` files and zero `lib/content` *data* edits, satisfying the no-regression contract structurally.

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

1. **Gate mechanism shipped:** Vitest spec (`tests/gate/mock-content.test.ts`) importing real `@/lib/content` collections, not a brittle text grep. Two assertions: (a) no `featured: true` project has `meta.mock === true` — **FAILS today** listing `buguard, dark-atlas, masheed-gate` (red-by-design, AC1); (b) referential integrity of `projectSlugs` on experience entries — passes vacuously (zero refs today, AC2).
2. **Gate isolation verified:** `vitest.gate.config.ts` includes only `tests/gate/**`; base `vitest.config.ts` excludes `tests/gate/**` via `configDefaults`. `yarn test:run` runs 48 files / 365 tests and does **not** discover the gate spec. `yarn gate:content` runs only the gate spec and exits non-zero (1) as intended.
3. **Pre-commit hook installed and verified live:** `simple-git-hooks@2.13.1` (devDependency). Config in `package.json`: `"simple-git-hooks": { "pre-commit": "yarn typecheck && yarn lint && yarn test:run && yarn format" }` + `"postinstall": "simple-git-hooks"`. Hook file exists at `.git/hooks/pre-commit` and contains the four-gate command. Verified live:
   - Clean commit (2186e17): hook ran typecheck → lint (0 errors, 3 warnings) → test:run (365 pass) → format, then committed successfully.
   - Deliberate type error in `tests/setup.ts`: hook blocked commit with `error TS2322` and exit code 2. Reverted immediately.
4. **`yarn format` choice:** Kept the spec string (`prettier --write`) per AC fidelity. Noted gotcha: writes unstaged files mid-commit. The more-correct alternative (`prettier --check`) was not swapped in to preserve AC4 verbatim.
5. **CI workflow committed:** `.github/workflows/ci.yml` with two jobs — `quality` (typecheck + lint + test:run + build, green) and `content-gate` (yarn gate:content, red-until-OQ4). GitHub remote exists (`origin: https://github.com/HossamMarey/resume-v2.git`), so workflow is active on push/PR.
6. **All quality gates green:** `yarn typecheck` (3.11s), `yarn lint` (0 errors, 3 pre-existing warnings), `yarn test:run` (365 pass), `yarn format` (clean), `yarn build` (static + SSG, no unexpected dynamic routes). Zero `app/` / `components/` / `hooks/` / `lib/content` data changes — tooling-only diff.
7. **Doc-vs-code variances surfaced:**
   - `yarn format` writes but does not re-stage (gotcha documented).
   - Architecture's grep pattern `"mock":\s*true` does not match source (`meta: { mock: true }` unquoted key) — sidestepped by Vitest spec.
   - `Experience.projectSlugs` does not exist in the schema — referential check is vacuous today; do NOT add the field in this story.
   - Gate is intentionally RED at completion — do not "fix" by editing `meta.mock` or placeholder copy (that's OQ4).

### File List

- `tests/gate/mock-content.test.ts` (NEW)
- `vitest.gate.config.ts` (NEW)
- `.github/workflows/ci.yml` (NEW)
- `vitest.config.ts` (UPDATE — added `test.exclude` for gate dir)
- `package.json` (UPDATE — added `gate:content` script, `simple-git-hooks` config, `postinstall` script, `simple-git-hooks@2.13.1` devDependency)
- `yarn.lock` (UPDATE — simple-git-hooks dependency)

## Story Completion Status

- [x] Epic context analyzed (Epic 7 launch readiness; 7.1 metadata+JSON-LD done; 7.2 robots/sitemap/OG done; 7.3 print stylesheet done; **7.4 = mock gate + pre-commit hook**; 7.5 CSP/Lighthouse/deploy)
- [x] Architecture requirements extracted (ARCH-6 mock launch gate; NFR-O3/A16 pre-commit; A19 Confirmed red-until-authored; CI = Vercel default + optional GH Action)
- [x] Existing code read (`lib/content/projects.ts` featured mock placeholders, `experience.ts` no-projectSlugs, `index.ts` barrel, `vitest.config.ts`, `package.json`; no scripts/.husky/.github exist)
- [x] File modifications identified (NEW gate spec + gate config + CI workflow; UPDATE vitest.config exclude + package.json scripts/hook/devDep; DO-NOT-TOUCH content data / next.config)
- [x] Reuse opportunities documented (import real `@/lib/content`; reuse Vitest setup/alias; copy the four-gate command string; call existing package scripts)
- [x] Testing requirements specified (gate spec is the only new test, red-by-design and excluded from `test:run`; hook verified live; default suite stays green)
- [x] Anti-patterns + guardrails listed (gate NOT in pre-commit/test:run/build; no content edits; no `projectSlugs` schema add; no husky; no `--no-verify`; yarn not npm)
- [x] Doc-vs-code variances surfaced (format-writes-unstaged; grep pattern mismatch; missing `Experience.projectSlugs`; gate intentionally red)
- [x] User decisions captured (simple-git-hooks; separate CI job red-until-authored)
- [x] Scope boundaries vs Stories 7.1 / 7.2 / 7.3 / 7.5 and OQ4 content authoring stated

Ultimate context engine analysis completed — comprehensive developer guide created.
