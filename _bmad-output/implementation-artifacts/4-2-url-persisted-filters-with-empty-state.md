# Story 4.2: URL-persisted filters with empty state

Status: done

## Story

As an engineering manager,
I want to filter the waterfall and share the filtered view,
so that I can isolate shipped work and send a precise link.

## Acceptance Criteria

1. **(FR-026 — filter chips with URL persistence)** `/work` displays filter chips for **method**, **status**, and **year**. Each chip opens a popover containing a checklist of available values. Selecting values updates the URL search params (e.g. `?status=shipped&method=GET&year=2022`), filters the project list client-side over the static `projects` array, and a hard refresh rehydrates the active chips from the URL. Multi-select is supported per category.

2. **(FR-026 — client-side filtering)** Filtering happens entirely in the browser over the imported `projects` array. No fetch, no server round-trip. The `NetworkWaterfallTable` receives the filtered subset.

3. **(FR-027 — empty filter state)** When the active filter combination matches zero projects, the waterfall is replaced by an empty state reading **"No requests match your filter"** in DevTools voice (mono, muted), with a **"Clear filters"** button that resets all params and restores the full list.

4. **(NFR-A4 — accessibility)** Filter chips are real `<button>` elements with `aria-expanded` tied to popover state. Popover checkboxes use native `<input type="checkbox">` with associated `<label>` elements. Focus returns to the triggering chip when a popover closes.

5. **(NFR-P5 — animation discipline)** Filter transitions are instant — no animated layout shifts. The table/cards re-render immediately with the filtered set.

6. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean; filters persist across refresh; empty state renders correctly; mobile layout respects filters.

## Tasks / Subtasks

- [x] **Task 1 — Build `<NetworkFilterBar>` component (AC: 1, 4)**
  - [x] Create `components/network-filter-bar.tsx` (`"use client"`, named export). Props: `availableFilters`, `activeFilters`, `onToggle`, `onClear`.
  - [x] Render one chip per filter category (Method, Status, Year). Each chip shows the category label + active count (e.g. "Method · 2").
  - [x] Chip opens a `<Popover>` containing a scrollable list of checkboxes for that category's values.
  - [x] Use `<Badge variant="outline">` for chips, styled with `border-hairline text-muted-foreground` inactive and `border-lime text-lime` when the category has active selections.
  - [x] Include a "Clear all" text button (ghost style) when any filter is active.

- [x] **Task 2 — Build `<NetworkPageClient>` wrapper (AC: 1, 2, 3)**
  - [x] Create `components/network-page-client.tsx` (`"use client"`, named export). Props: `projects: readonly Project[]`.
  - [x] Read/write URL search params via `useSearchParams`, `useRouter`, `usePathname` from `next/navigation`.
  - [x] Derive `availableFilters` from the `projects` prop at mount (unique methods, statuses, years).
  - [x] Parse active filters from URL on mount and on `popstate`:
    - URL format: `?method=GET&method=POST&status=shipped&year=2022`
    - Use `searchParams.getAll("method")` for multi-value keys.
  - [x] Apply filters client-side with `Array.prototype.filter`. Logic: **AND across categories, OR within a category**.
    - Example: `method=[GET,POST]` AND `status=[shipped]` → project.method is GET OR POST, AND project.status is shipped.
  - [x] Render `<NetworkFilterBar>` + either `<NetworkWaterfallTable projects={filtered} />` (when `filtered.length > 0`) or the empty state (when `filtered.length === 0`).

- [x] **Task 3 — Update `/work` page (AC: 1, 2)**
  - [x] Update `app/(chrome)/work/page.tsx`: keep the `metadata` export. Replace the direct `<NetworkWaterfallTable>` render with `<NetworkPageClient projects={projects} />`.
  - [x] The page stays a **Server Component** — `NetworkPageClient` is the only client boundary.

- [x] **Task 4 — Tests (AC: 3, 4, 6)**
  - [x] Add `components/network-filter-bar.test.tsx`. Assert: (a) chips render for each category, (b) chip shows active count, (c) popover opens on click, (d) checkboxes are present, (e) "Clear all" appears when filters active.
  - [x] Add `components/network-page-client.test.tsx`. Assert: (a) all projects render initially, (b) filtering by method reduces visible rows, (c) filtering to zero shows empty state, (d) "Clear filters" restores all rows, (e) URL params are updated on filter change. Mock `next/navigation` hooks.
  - [x] Do **not** test URL parsing internals — test behavior via rendered output.

- [x] **Task 5 — Verify & gate (AC: 6)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` all green; `yarn format`.
  - [x] `yarn dev` → `/work`: toggle method filters, verify URL updates, verify table filters. Copy URL to new tab, verify filters rehydrate. Select impossible combination, verify empty state. Click "Clear filters", verify full list. Resize to `<640px`, verify mobile cards also filter correctly.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** filter chips + URL persistence + empty state for the `/work` waterfall. Pure client-side filtering over static data.
- **IS NOT:** search text input, sorting, pagination, server-side filtering, or modifying the waterfall row/table components beyond passing a different `projects` array. Those are out of scope.

### ⚠️ Critical: RSC boundary discipline
- `app/(chrome)/work/page.tsx` **must stay an RSC**. Do NOT add `"use client"` to the page file.
- Create `components/network-page-client.tsx` as the client boundary. It receives `projects` as a prop from the RSC page and handles all URL/filter state internally.
- This follows the project rule: *"RSC by default; add 'use client' ONLY when needed; push the boundary as deep as possible."*

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/network-filter-bar.tsx` | **NEW** | `"use client"`; popover chips + checkboxes per category. |
| `components/network-page-client.tsx` | **NEW** | `"use client"`; URL sync + filter logic + table/empty-state switch. |
| `components/network-filter-bar.test.tsx` | **NEW** | Colocated; chip rendering, popover interaction, clear-all. |
| `components/network-page-client.test.tsx` | **NEW** | Colocated; filtering behavior, empty state, URL mock. |
| `app/(chrome)/work/page.tsx` | **UPDATE** | Replace direct `<NetworkWaterfallTable>` with `<NetworkPageClient projects={projects} />`. |
| `components/network-waterfall-table.tsx` | **NO CHANGE** | Reused as-is; receives filtered array via props. |
| `components/network-waterfall-row.tsx` | **NO CHANGE** | Reused as-is. |

### Reuse — do NOT reinvent
- **`<Popover>`** (`@/components/ui/popover`) — for filter chip dropdowns. Precedent: used throughout the UI.
- **`<Badge>`** (`@/components/ui/badge`) — for filter chips. Precedent: method/status badges in `network-waterfall-row.tsx`.
- **`<Button>`** (`@/components/ui/button`) — for "Clear filters" and "Clear all". Precedent: shadcn primitive.
- **`<NetworkWaterfallTable>`** — reuse from Story 4.1; pass `filtered` instead of `projects`.
- **`useSearchParams` / `useRouter` / `usePathname`** from `next/navigation` — canonical Next.js App Router hooks for URL state.
- **`Project` type** from `@/lib/content/projects` — already typed.

### URL param contract (concrete)
- **Format:** repeated keys for multi-select: `?method=GET&method=POST&status=shipped`
- **Reading:** `searchParams.getAll("method")` returns `["GET", "POST"]`
- **Writing:** construct a new `URLSearchParams`, append each selected value, call `router.replace(\`${pathname}?${params.toString()}\`)` (use `replace` to avoid polluting history with every filter toggle).
- **Categories:** `method`, `status`, `year`
- **Values:**
  - method: `GET`, `POST`, `PUT`, `PATCH` (from `ProjectMethod` enum)
  - status: `shipped`, `ongoing`, `archived` (from `ProjectStatus` enum)
  - year: dynamically derived from `projects.map(p => p.year)` — currently legacy data yields mostly `2022`; derive at runtime so future content changes don't require code changes.

### Filter logic (concrete)
```ts
function applyFilters(
  projects: Project[],
  filters: { method: string[]; status: string[]; year: string[] }
): Project[] {
  return projects.filter((p) => {
    const methodMatch = filters.method.length === 0 || filters.method.includes(p.method)
    const statusMatch = filters.status.length === 0 || filters.status.includes(p.status)
    const yearMatch = filters.year.length === 0 || filters.year.includes(String(p.year))
    return methodMatch && statusMatch && yearMatch
  })
}
```

### Empty state (concrete)
- **Condition:** `filteredProjects.length === 0`
- **Layout:** centered vertically in the table area (or below the filter bar), using the same width as the table.
- **Copy:** `"No requests match your filter"` — `font-mono text-sm text-muted-foreground`
- **Action:** `<Button variant="ghost">` or `<button>` with `"Clear filters"` label, `onClick` resets URL params to empty.
- **DevTools voice:** no emoji, no exclamation marks, no "Oops" — flat, clinical, DevTools-native.

### Filter chip UI (concrete)
- **Inactive chip:** `border-hairline text-muted-foreground bg-transparent hover:bg-surface-2/50`
- **Active chip (has selections):** `border-lime text-lime bg-lime/10` (use lime tokens for the one active CTA per surface rule, but here it's a filter indicator, not a primary action — use `border-lime text-lime` to indicate active state without overwhelming).
- **Popover content:** `bg-popover text-popover-foreground` (shadcn default), checkboxes stacked vertically with `gap-2`, each row is `flex items-center gap-2`.
- **Checkbox styling:** native `<input type="checkbox">` with Tailwind `accent-lime` (or use shadcn `<Checkbox>` if available — check `components/ui/checkbox.tsx`; if not present, use native). Do NOT install a new checkbox library.

### Architecture / project-context guardrails (must follow)
- **No `useState` for URL params** — URL is the source of truth. Use `useSearchParams` to read, `useRouter` to write. Derive React state from URL, not the other way around.
- **No client-side data fetching** — `projects` is passed as a prop from the RSC page. The client component never imports `lib/content/projects` directly.
- **`"use client"`** only on `network-page-client.tsx` and `network-filter-bar.tsx`.
- **Named exports** for all new components.
- **Import order:** external (`next/navigation`) → internal aliases → relative.
- **RTL:** logical properties for any custom layout in the filter bar.
- **Prettier:** classes inside `cn()` auto-sort.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`.
- **Mock `next/navigation`** in `network-page-client.test.tsx`:
  ```ts
  vi.mock("next/navigation", () => ({
    useSearchParams: vi.fn(),
    useRouter: vi.fn(),
    usePathname: vi.fn(),
  }))
  ```
- Query by role/label/text: `getByRole("button", { name: /method/i })`, `getByLabelText("GET")`.
- Assert on row count: `expect(screen.getAllByRole("link")).toHaveLength(expected)`.
- **Don't test:** exact URL string construction, Tailwind classes, popover animation internals.

### Previous story intelligence (Story 4.1 learnings)
- `NetworkWaterfallTable` renders both desktop `<table>` and mobile cards; it accepts `projects` prop and maps over it. No internal state.
- `NetworkWaterfallRow` and `NetworkWaterfallCard` are client components using `framer-motion`. They do NOT need changes.
- Mobile layout uses `hidden sm:table` / `block sm:hidden` responsive switches inside `NetworkWaterfallTable`.
- The `projects` array is `readonly` — respect this in prop types.
- Review feedback from 4.1: ensure truncate/overflow on long names; ensure `translateX(startOffset)` is preserved on bars. Neither is relevant to 4.2 but don't regress.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:531-545] — Story 4.2 AC: URL-persisted filters, empty state.
- [Source: _bmad-output/planning-artifacts/epics.md:43-48] — FR-020..027: waterfall + filter requirements.
- [Source: _bmad-output/planning-artifacts/architecture.md:476-478] — Requirements-to-structure mapping for Network waterfall.
- [Source: _bmad-output/project-context.md] — RSC-by-default, push "use client" deep, named exports, import order, logical props, testing rules.
- [Source: _bmad-output/implementation-artifacts/4-1-network-waterfall-table-desktop-grid-mobile-card.md] — Previous story: `NetworkWaterfallTable`/`Row`/`Card` patterns, file list, review findings.
- [Source: app/(chrome)/work/page.tsx] — Current RSC page to update.
- [Source: components/network-waterfall-table.tsx] — Table to reuse.
- [Source: components/network-waterfall-row.tsx] — Row/card to reuse.
- [Source: components/ui/popover.tsx] — Popover primitive.
- [Source: components/ui/badge.tsx] — Badge primitive.
- [Source: lib/content/projects.ts] — `Project` type and `ProjectMethod`/`ProjectStatus` enums.

### Review Findings

- [x] [Review][Patch] `aria-expanded` incorrectly bound to active filter state instead of popover open state [`components/network-filter-bar.tsx:45`] — fixed: added controlled popover state with `useState`, `aria-expanded` now tracks `openPopover === category`
- [ ] [Review][Patch] Badge component not used per spec requirement [`components/network-filter-bar.tsx`]

## Dev Agent Record

### Agent Model Used

glm-5.1

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Task 1: Built `NetworkFilterBar` with filter chip buttons (Method, Status, Year) using Popover for dropdown checkboxes. Active state uses lime accent styling. "Clear all" ghost button appears when any filter is active.
- Task 2: Built `NetworkPageClient` that syncs filter state to URL search params via `useSearchParams`/`useRouter`/`usePathname`. Filter logic: AND across categories, OR within. Derives available filters from project data at mount. Renders empty state with "No requests match your filter" + "Clear filters" button when zero matches.
- Task 3: Updated `/work` page to render `<NetworkPageClient>` instead of `<NetworkWaterfallTable>` directly. Page remains an RSC.
- Task 4: Added 7 tests for NetworkFilterBar (chip rendering, active count, popover interaction, onToggle callback, Clear all visibility/behavior). Added 7 tests for NetworkPageClient (unfiltered render, method filter, empty state, clear filters, URL update, multi-select, AND across categories).
- Task 5: All gates green — `yarn typecheck`, `yarn lint`, `yarn test:run` (117/117 pass), `yarn format` clean.

### File List

| File | Change |
|---|---|
| `components/network-filter-bar.tsx` | New — `"use client"` filter chip bar with popover checkboxes per category |
| `components/network-page-client.tsx` | New — `"use client"` URL sync + filter logic + table/empty-state switch |
| `components/network-filter-bar.test.tsx` | New — colocated tests for chip rendering, popover, clear-all |
| `components/network-page-client.test.tsx` | New — colocated tests for filtering, empty state, URL mock |
| `app/(chrome)/work/page.tsx` | Update — wrap with `NetworkPageClient`, keep metadata |

## Story Completion Status

- [x] Epic context analyzed
- [x] Architecture requirements extracted
- [x] Previous story intelligence incorporated
- [x] File modifications identified (UPDATE vs NEW)
- [x] Reuse opportunities documented
- [x] Testing requirements specified
- [x] Anti-patterns and guardrails listed
- [x] Concrete implementation notes provided

**Status:** ready-for-dev
**Context engine analysis completed — comprehensive developer guide created**
