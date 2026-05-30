# Story 1.4: Remove dropped infrastructure and archive legacy plan

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As Hossam (maintainer),
I want Dexie/IndexedDB fully removed and the legacy TanStack plan archived,
so that the codebase matches the resolved decisions and agents stop referencing dropped infrastructure.

## Context & Orientation (read first)

This is the **final story of Epic 1 (Foundation)**. It performs cleanup after the three preceding stories:
- Story 1.1: Rewrote design tokens to Obsidian + Signal Lime
- Story 1.2: Added base utility layers (selection, grid, scanlines)
- Story 1.3: Built shared cross-cutting helpers (useShouldAnimate, isTypingTarget, ComputedStylesPanel)

**The content migration already landed** in commit `cd5dd09` — `lib/content/*` now holds all typed, Zod-validated data. This story **finishes the cleanup** by deleting the legacy source and removing the dropped Dexie infrastructure.

**Scope fence — what this story does NOT do:**
- It does NOT create new components, hooks, or features
- It does NOT modify `app/globals.css` (Stories 1.1/1.2 own that)
- It does NOT touch `components/ui/*` primitives (forbidden boundary)
- It does NOT change the `D` hotkey behavior (Story 2.4)
- It does NOT rewrite `docs/plan.md` — it only archives the old one (rewrite is a future PRD/architecture task)

## Acceptance Criteria

1. **AC1 — Dexie/IndexedDB dependencies removed.**
   **Given** Dexie was dropped (ARCH-8 / resolved decision #4),
   **When** dependencies are pruned,
   **Then** `dexie`, `dexie-react-hooks`, and `fake-indexeddb` are removed from `package.json` and `yarn.lock` via `yarn remove`, and `yarn install` produces a clean lockfile.

2. **AC2 — Tests setup no longer references fake-indexeddb.**
   **Given** `tests/setup.ts` exists (created in Story 1.3),
   **When** it is inspected,
   **Then** there is **no** `import "fake-indexeddb/auto"` or any reference to fake-indexeddb, and `yarn test:run` still passes (it currently imports only `@testing-library/jest-dom/vitest`).

3. **AC3 — Legacy data file deleted with zero consumer impact.**
   **Given** the content migration landed in commit `cd5dd09`,
   **When** the codebase is searched,
   **Then** `lib/data/index.ts` does not exist, and **zero** source files import from `@/lib/data` or relative `../data` / `./data` paths, and `yarn typecheck` passes clean.

4. **AC4 — Empty Dexie wrapper directory removed.**
   **Given** `lib/repository/index.ts` is an empty Dexie wrapper remnant,
   **When** the folder is inspected,
   **Then** `lib/repository/` is deleted entirely (it is empty after removing `index.ts`), and no code imports from `@/lib/repository`.

5. **AC5 — Legacy plan archived.**
   **Given** `docs/plan.md` is the TanStack-era intent document,
   **When** the archive step runs,
   **Then** the file is moved to `docs/archive/plan-tanstack-original.md` (creating `docs/archive/` if needed), the original `docs/plan.md` no longer exists at the old path, and any internal links that referenced the old path are not broken (there are no internal links to `docs/plan.md` in source code).

6. **AC6 — Build and checks remain green.**
   **Given** all cleanup steps complete,
   **When** `yarn typecheck && yarn lint && yarn test:run && yarn build` run,
   **Then** all pass with no new errors/warnings (the pre-existing `'inter' unused` warning in `app/layout.tsx` is expected and acceptable).

## Tasks / Subtasks

- [x] **Task 1 — Remove Dexie/IndexedDB dependencies (AC1)**
  - [x] Run `yarn remove dexie dexie-react-hooks fake-indexeddb`
  - [x] Verify `package.json` no longer lists these three packages
  - [x] Verify `yarn.lock` diff shows removal of these packages (not just version changes)
  - [x] Run `yarn install` to ensure lockfile is consistent

- [x] **Task 2 — Clean tests/setup.ts (AC2)**
  - [x] Verify `tests/setup.ts` contains only `import "@testing-library/jest-dom/vitest"`
  - [x] Confirm no fake-indexeddb import exists (it shouldn't — Story 1.3 already omitted it)
  - [x] Run `yarn test:run` to confirm tests still pass

- [x] **Task 3 — Delete legacy data file (AC3)**
  - [x] Search repo for any imports from `@/lib/data` or `../data` / `./data` — must be zero hits
  - [x] Delete `lib/data/index.ts` (and `lib/data/` folder if empty after deletion)
  - [x] Run `yarn typecheck` to confirm no broken imports

- [x] **Task 4 — Remove empty Dexie wrapper (AC4)**
  - [x] Delete `lib/repository/index.ts` (currently 0 bytes — empty file)
  - [x] Delete `lib/repository/` folder (should be empty after removing index.ts)
  - [x] Search for any imports from `@/lib/repository` — must be zero hits

- [x] **Task 5 — Archive legacy plan (AC5)**
  - [x] Create `docs/archive/` directory if it doesn't exist
  - [x] Move `docs/plan.md` → `docs/archive/plan-tanstack-original.md`
  - [x] Verify `docs/plan.md` no longer exists
  - [x] Verify no source code references `docs/plan.md` (there shouldn't be any)

- [x] **Task 6 — Verify all gates green (AC6)**
  - [x] `yarn typecheck` → clean
  - [x] `yarn lint` → only pre-existing `'inter' unused` warning
  - [x] `yarn test:run` → 10 passed (3 files) — same as Story 1.3
  - [x] `yarn build` → compiled successfully
  - [x] Format only changed files (do NOT run repo-wide `yarn format`)

## Dev Notes

### What is being changed (housekeeping only)
This story is pure cleanup — **no new features, no behavior changes**. It removes artifacts that are already dead:

1. **Dexie packages** — dropped by resolved decision #4 (2026-05-25). All persistence is now `localStorage` only. The packages still appear in `package.json` because they were never removed after the decision.
2. **`lib/data/index.ts`** — superseded by `lib/content/*` (commit `cd5dd09`). The migration spec explicitly states: "Delete `lib/data/index.ts` once `lib/content` is parse-clean."
3. **`lib/repository/index.ts`** — empty Dexie wrapper. The folder has no other files.
4. **`docs/plan.md`** — TanStack-era intent. Per resolved decision #2: "Move existing `docs/plan.md` to `docs/archive/plan-tanstack-original.md`". The rewrite to Next.js-native is a future task, not this story.

### Verification commands (run in this order)
```bash
# 1. Confirm no consumers before deleting anything
grep -r "from ['\"]@/lib/data['\"]" --include="*.ts" --include="*.tsx" .
grep -r "from ['\"]\.\./data['\"]" --include="*.ts" --include="*.tsx" .
grep -r "from ['\"]@/lib/repository['\"]" --include="*.ts" --include="*.tsx" .

# 2. Remove dependencies
yarn remove dexie dexie-react-hooks fake-indexeddb

# 3. Delete legacy files
rm lib/data/index.ts
rmdir lib/data 2>/dev/null || true
rm lib/repository/index.ts
rmdir lib/repository 2>/dev/null || true

# 4. Archive plan
mkdir -p docs/archive
mv docs/plan.md docs/archive/plan-tanstack-original.md

# 5. Verify gates
yarn typecheck
yarn lint
yarn test:run
yarn build
```

### Project guardrails that bite in this story
- **`yarn` only** — use `yarn remove`, never `npm uninstall` [project-context.md#Development Workflow]
- **No `components/ui/*` edits** — this story doesn't touch primitives, but as a general rule, never edit vendored shadcn files [project-context.md#Tailwind v4 + shadcn]
- **Format discipline** — `yarn format` reflows ~15 pre-existing non-Prettier-clean files. Format only this story's scope (which is just `package.json`/`yarn.lock` and deleted files). Since deletions don't need formatting, the only file that might change is `package.json` after `yarn remove`. [Story 1.1/1.2/1.3 intelligence]
- **Git convention** — use Conventional Commits: `chore:` for cleanup tasks [project-context.md#Git]

### Testing standards for this story
- **No unit tests needed** — this story only removes code/packages/files; nothing to test.
- **Verification = gate checks** (typecheck, lint, test:run, build). These confirm nothing is broken.
- **The existing 10 tests from Story 1.3 must still pass** — they validate the harness and helpers are intact.

### Project Structure Notes
- **Files removed:** `lib/data/index.ts`, `lib/repository/index.ts`, `lib/repository/` (empty folder)
- **Files moved:** `docs/plan.md` → `docs/archive/plan-tanstack-original.md`
- **Files modified:** `package.json`, `yarn.lock` (via `yarn remove`)
- **No structural variance** — aligns with architecture.md#Project Structure (`lib/content/*` is the canonical content source; `lib/data/` and `lib/repository/` are explicitly marked for removal)

## Previous-Story Intelligence (Stories 1.1–1.3)

- **`yarn format` reflows ~15 pre-existing non-Prettier-clean files** — avoid repo-wide format. `package.json` may be auto-formatted by `yarn remove`; this is acceptable since it's part of the dependency change. [Story 1.1–1.3]
- **`yarn test:run` now passes (10 tests, 3 files)** — the harness works. This story must not break it. [Story 1.3]
- **`'inter' unused` lint warning in `app/layout.tsx`** — pre-existing, expected, not addressed here. [Story 1.1–1.3]
- **No browser needed** — pure infrastructure cleanup, no visual changes. [All prior stories]

## Git Intelligence

- Recent commits: `e7c115c` (Epic 1 foundation — stories 1.1–1.3), `cd5dd09` (content migration), `643002c` (theme refactoring), `d58a15f` (starter).
- Working tree is currently clean after the commit of stories 1.1–1.3.

## References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4] — story statement + ACs (Dexie removal, plan archive, data cleanup).
- [Source: _bmad-output/planning-artifacts/architecture.md#Data Layer Migration & Legacy Removal] — "The legacy `lib/data` and any empty `lib/repository` Dexie wrapper are removed."
- [Source: _bmad-output/planning-artifacts/architecture.md#Phase 1 Foundation Priorities] — "confirm Dexie/fake-indexeddb removed; archive `docs/plan.md`"
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md#Resolved Decisions] — #4 Dexie dropped entirely; #2 `docs/plan.md` archive and rewrite.
- [Source: _bmad-output/project-context.md#Resolved Decisions #4] — "Action item: run `yarn remove dexie dexie-react-hooks fake-indexeddb`. Update `tests/setup.ts` to remove the fake-indexeddb import."
- [Source: _bmad-output/implementation-artifacts/spec-lib-content-migration.md] — "Delete `lib/data/index.ts` once `lib/content` is parse-clean (safe: no consumers)."
- [Source: package.json] — still lists `dexie`, `dexie-react-hooks`, `fake-indexeddb` (pending removal).
- [Source: lib/repository/index.ts] — empty file (0 bytes), Dexie wrapper remnant.
- [Source: tests/setup.ts] — currently clean (Story 1.3), no fake-indexeddb import.

## Dev Agent Record

### Agent Model Used

claude-opus-4-8 (Claude Opus 4.8)

### Debug Log References

- `yarn remove dexie dexie-react-hooks fake-indexeddb` → success (5.44s)
- `yarn typecheck` → clean (4.25s)
- `yarn lint` → 0 errors, 1 pre-existing warning ('inter' unused)
- `yarn test:run` → 10 passed (3 files) — no regression
- `yarn build` → compiled successfully (12.88s)

### Completion Notes List

- **All 6 ACs satisfied.** Story is pure cleanup with zero behavior changes.
- **Dexie packages removed:** `dexie`, `dexie-react-hooks`, `fake-indexeddb` no longer in `package.json` or `yarn.lock`.
- **Legacy data already gone:** `lib/data/index.ts` was deleted in commit `cd5dd09` (content migration). Verified zero source imports from `@/lib/data`.
- **Empty Dexie wrapper removed:** Deleted `lib/repository/index.ts` (0 bytes) and the empty `lib/repository/` folder.
- **Plan archived:** `docs/plan.md` → `docs/archive/plan-tanstack-original.md`.
- **All gates green:** typecheck clean, lint only pre-existing warning, 10 tests pass, build succeeds.

### File List

- `package.json` (modified) — removed dexie, dexie-react-hooks, fake-indexeddb
- `yarn.lock` (modified) — regenerated after package removal
- `lib/repository/index.ts` (deleted) — empty Dexie wrapper
- `lib/repository/` (deleted) — empty folder after removing index.ts
- `docs/plan.md` (moved) → `docs/archive/plan-tanstack-original.md`
- `docs/archive/` (created)

### Change Log

- 2026-05-30 — Removed Dexie/IndexedDB dependencies (yarn remove), deleted empty `lib/repository/`, archived `docs/plan.md` to `docs/archive/`. All gates green. Status → review. (claude-opus-4-8)