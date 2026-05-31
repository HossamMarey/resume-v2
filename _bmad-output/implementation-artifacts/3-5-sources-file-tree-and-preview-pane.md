# Story 3.5: Sources file tree and preview pane

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a recruiter,
I want a file tree where the resume is one click away,
so that I can grab the PDF without learning the metaphor.

## Acceptance Criteria

1. **(FR-060 — two-pane file tree, desktop ≥md)** `/sources` renders a **two-pane layout** on desktop (`≥md`): a **220px wide tree sidebar** (`<nav aria-label="Sources file tree">`) + a **flexible content preview pane**. The tree lists four items: `resume.pdf`, `articles/`, `talks/`, `contact.ts`. `articles/` and `talks/` are **folders** (visually indicated) that show **"Coming soon"** placeholders when selected. `resume.pdf` and `contact.ts` are **files**. Tree items are `<ul>/<li>` with `aria-selected` reflecting the active selection. **Keyboard navigation:** ↑/↓ arrows move selection; ↵ selects the focused item.

2. **(FR-061 — preview pane content)** When `resume.pdf` is selected, the preview pane shows: (a) an **embed** of `/hossam-marey-resume.pdf` (use `<embed>` or `<iframe>` with `type="application/pdf"`), and (b) a **Download button** linking to `/hossam-marey-resume.pdf` (`target="_blank"`). When `contact.ts` is selected, the preview shows a **stub placeholder** (the full boss-level contact form lands in Epic 6) — render it inside `<ComputedStylesPanel>` with a heading "Contact" and body text "Boss-level contact form coming in Epic 6." in DevTools voice.

3. **(FR-062 + NFR-R1 — mobile single-pane stack)** When viewport is **<md**, the layout becomes a **single-pane vertical stack**: the tree renders full-width above, the preview renders full-width below. No horizontal scrolling. Tree touch targets ≥44×44px.

4. **(Accessibility — keyboard + screen reader)** The tree is fully keyboard-navigable (↑/↓/↵). Each tree item has `role="treeitem"` (or native `<a>`/`<button>` with arrow key handling). The preview pane has `aria-live="polite"` so screen readers announce content changes. Focus rings visible on every interactive element.

5. **(State management — client-side selection)** Selection state lives in the client component (`file-tree.tsx` uses `useState`). Default selection on mount: `resume.pdf`. The selected item is passed to the preview pane as a prop (or lifted to the page level). **No URL state** for selection — this is intra-panel navigation, not a route change.

6. **(Reuse, no fork, RSC boundary)** `app/(chrome)/sources/page.tsx` stays a **Server Component**; `components/file-tree.tsx` and `components/file-preview-pane.tsx` are `"use client"`. Selection state is lifted to the page via a minimal wrapper or the tree component owns state and the preview reads it via props. Data (the tree items array) is defined as a static const and passed as a serializable prop.

7. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean; `/sources` shows no console errors/warnings; the `D` hotkey still toasts dark-only; `<html dir="rtl">` does not break layout; mobile (`<640px`) renders as single-pane stack with no horizontal overflow; keyboard ↑/↓/↵ works in the tree.

## Tasks / Subtasks

- [x] **Task 1 — Define tree data structure (AC: 1, 6)**
  - [x] Create a static `sourcesTree` array in `app/(chrome)/sources/page.tsx` (or a separate `lib/content/sources.ts` if preferred — but keep it simple, this is UI metadata, not authored content). Each item: `{ id: string, label: string, type: "file" | "folder", icon?: string, href?: string, comingSoon?: boolean }`. Entries:
    - `{ id: "resume", label: "resume.pdf", type: "file" }`
    - `{ id: "articles", label: "articles/", type: "folder", comingSoon: true }`
    - `{ id: "talks", label: "talks/", type: "folder", comingSoon: true }`
    - `{ id: "contact", label: "contact.ts", type: "file" }`
  - [x] Pass this array as a prop to `<FileTree>`.

- [x] **Task 2 — Build `<FileTree>` component (AC: 1, 3, 4, 5, 6)**
  - [x] Create `components/file-tree.tsx` (`"use client"`, named export `FileTree`). Props: `items: SourceTreeItem[]`, `selectedId: string`, `onSelect: (id: string) => void`.
  - [x] Render `<nav aria-label="Sources file tree">` containing a `<ul role="tree">` (or plain `<ul>` with arrow-key handling).
  - [x] Each item renders as `<li>` with: `role="treeitem"` (or `<button>`), `aria-selected={selectedId === item.id}`, `tabIndex={selectedId === item.id ? 0 : -1}` (roving tabindex pattern for arrow-key nav).
  - [x] **Keyboard handling:** on `keydown`, handle `ArrowUp`/`ArrowDown` to move selection (cycle or clamp), `Enter`/`Space` to select. Focus management: the selected item gets `tabIndex={0}`, others `-1` (roving tabindex). This mirrors standard tree widget behavior.
  - [x] **Visual states:** selected item gets `bg-surface` + left border `border-l-2 border-lime`; unselected items are `text-muted-foreground` with `hover:bg-surface/50`. Folders show a folder icon (Lucide `FolderOpen` or `Folder`); files show a file icon (`FileText`). Use `lucide-react` icons.
  - [x] **Styling:** tree width `w-full md:w-[220px]` (full-width on mobile, fixed 220px on desktop). Item padding `px-3 py-2`. Font `font-mono text-sm`. Border right on desktop: `md:border-r md:border-hairline`.

- [x] **Task 3 — Build `<FilePreviewPane>` component (AC: 2, 3, 4, 6)**
  - [x] Create `components/file-preview-pane.tsx` (`"use client"`, named export `FilePreviewPane`). Props: `item: SourceTreeItem | null`.
  - [x] Branch on `item.id`:
    - `"resume"` → render `<embed src="/hossam-marey-resume.pdf" type="application/pdf" className="w-full h-[60vh] rounded border border-hairline" />` + a download button (`<a href="/hossam-marey-resume.pdf" download className="...">Download resume.pdf</a>`).
    - `"contact"` → render `<ComputedStylesPanel>` with a single cell containing: `<h2 className="font-mono text-sm tracking-wider text-muted-foreground uppercase">Contact</h2>` + `<p className="text-muted-foreground">Boss-level contact form coming in Epic 6.</p>`.
    - `"articles"` / `"talks"` → render a "Coming soon" placeholder inside `<ComputedStylesPanel>`: `<p className="text-muted-foreground">{item.label} — Coming soon</p>`.
    - `null` / default → empty state or select-a-file hint.
  - [x] Wrap the preview in `<section aria-live="polite" aria-label="File preview">` so screen readers announce changes.
  - [x] Preview pane is `flex-1` on desktop, full-width on mobile.

- [x] **Task 4 — Build `/sources` page (AC: 1, 2, 3, 6)**
  - [x] Update `app/(chrome)/sources/page.tsx`: keep `metadata` export (`title: "Sources — devtools://hossam"`). Import `FileTree` and `FilePreviewPane`.
  - [x] Lift selection state: `const [selectedId, setSelectedId] = useState("resume")` (or keep state in a thin `"use client"` wrapper if you want the page to stay RSC). **Decision:** since both children are `"use client"`, the simplest approach is to make the page `"use client"` OR create a thin wrapper component. **Recommended:** make the page `"use client"` — the `(chrome)` layout already handles the RSC boundary, and this is a leaf page with no server data needs. Keep it simple.
  - [x] Render layout: `<div className="flex flex-col md:flex-row h-full">` containing `<FileTree ... />` + `<FilePreviewPane ... />`.
  - [x] Ensure the page has exactly one `<h1>` (`<h1 className="font-mono text-lg">Sources</h1>`) before the two-pane layout.

- [x] **Task 5 — Tests (AC: 4, 5, 7)**
  - [x] Add `components/file-tree.test.tsx` (colocated). Assert: (a) all 4 items render by label, (b) clicking an item calls `onSelect`, (c) selected item has `aria-selected="true"`, (d) ↑/↓ keyboard navigation works (fire `ArrowDown` keydown, assert `onSelect` called with next item), (e) no `<h1>` introduced by the component.
  - [x] Add `components/file-preview-pane.test.tsx`. Assert: (a) `resume` item renders an `<embed>` with correct `src`, (b) `contact` item renders `<ComputedStylesPanel>` with "Coming soon" text, (c) `articles`/`talks` render "Coming soon" text, (d) no `<h1>` introduced.
  - [x] Do **not** test PDF rendering internals, Lucide icon internals, or Tailwind class strings.

- [x] **Task 6 — Verify & gate (AC: 7)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` all green; `yarn format`.
  - [x] `yarn dev` → navigate to `/sources`: confirm tree shows 4 items, `resume.pdf` is selected by default, preview shows PDF embed + download button. Click `contact.ts` → preview switches to stub. Click `articles/` → "Coming soon". Keyboard: Tab into tree, ↑/↓ moves selection, ↵ selects. Resize to `<768px` → single-pane stack. Toggle `<html dir="rtl">` → layout intact (tree on right in RTL is acceptable for v1). No console errors.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the `/sources` page (Sources tab) — a two-pane file tree + preview pane. Static, no client fetching. Resume embed + download, contact stub, coming-soon folders.
- **IS NOT:** the boss-level contact form (Epic 6), the Network waterfall (Epic 4), the Performance rings (Story 3.4), or the Elements hero (Story 3.1). No API calls, no dynamic data.

### ⚠️ Critical gap: resume PDF may not exist
`public/hossam-marey-resume.pdf` is the expected path for the resume download. If this file does **not** exist, the embed will show a broken PDF viewer and the download link will 404. **Check:** `ls public/hossam-marey-resume.pdf`. If missing, the embed/download will fail — note this in the Dev Agent Record but do not block the story (the file can be added later; the UI must still render correctly).

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/file-tree.tsx` | **NEW** | `"use client"`, named export `FileTree`; roving tabindex; arrow-key nav; aria-selected; Lucide icons. |
| `components/file-preview-pane.tsx` | **NEW** | `"use client"`, named export `FilePreviewPane`; branches on item type; `<embed>` for PDF; `<ComputedStylesPanel>` for stub. |
| `components/file-tree.test.tsx` | **NEW** | Colocated; item render, click, keyboard nav, aria-selected, no h1. |
| `components/file-preview-pane.test.tsx` | **NEW** | Colocated; embed render, stub render, coming-soon render, no h1. |
| `app/(chrome)/sources/page.tsx` | **UPDATE** | `"use client"` (or thin wrapper); lift `selectedId` state; render `<h1>` + two-pane layout. |

### Reuse — do NOT reinvent (mirror Story 3.1/3.2/3.3/3.4 patterns)
- **`<ComputedStylesPanel>`** (`@/components/computed-styles-panel`) — use for the contact stub and coming-soon placeholders. Precedent: `principles-panel.tsx`, `page-weight-budget.tsx`.
- **`useShouldAnimate()`** — not needed for this story (no animations in tree/preview), but if you add any motion (e.g., fade on preview switch), gate it through `useShouldAnimate()`.
- **Lucide icons** — `lucide-react` is installed. Use `FileText`, `Folder`, `FolderOpen`, `Download`. Tree-shaken imports: `import { FileText, Folder } from "lucide-react"`.
- **Heading register** — copy the `<h1>` treatment from other pages: `font-mono text-lg` for the page title. Sub-headings in preview: `font-mono text-sm tracking-wider text-muted-foreground uppercase`.
- **Semantic tokens** — `bg-surface`, `text-muted-foreground`, `border-hairline`, `font-mono`. No hardcoded hex.
- **`cn()`** from `@/lib/utils` — wrap dynamic class strings.

### File tree mechanics (concrete)
- **Roving tabindex pattern:** Only the selected/focused treeitem has `tabIndex={0}`; all others have `tabIndex={-1}`. This is the standard accessible tree pattern. On `ArrowDown`, move focus and selection to the next item; on `ArrowUp`, move to the previous. On `Enter`/`Space`, select the focused item.
- **Selection visual:** `border-l-2 border-lime bg-surface` for selected; `hover:bg-surface/50` for unselected hover. Keep it minimal — DevTools Sources panel style.
- **Icons:** Use `FileText` for files, `Folder` (or `FolderOpen` for selected folders) for folders. Icon size `16px` (`w-4 h-4`). Color `text-muted-foreground`.
- **Layout:** The two-pane container uses `flex flex-col md:flex-row`. Tree is `w-full md:w-[220px] md:border-r md:border-hairline`. Preview is `flex-1`. Both panes should have `min-h-0` to prevent flex overflow issues.

### Architecture / project-context guardrails (must follow)
- **RSC by default; push `"use client"` deep** — This page has no server data needs, so making it `"use client"` is acceptable. If you prefer to keep it RSC, create a thin wrapper component inside the page file that holds state and renders the two client children. Either approach is fine; consistency with other pages is not critical since `/sources` is unique.
- **Named exports** for `FileTree` and `FilePreviewPane`; `page.tsx` keeps its **default export**.
- **`import type`** for types (`isolatedModules: true`); **no `import React`**.
- **Import order:** external → internal aliases → relative; blank lines between groups.
- **RTL:** logical properties (`ms-`, `me-`, `border-s`, `border-e`). The tree's left border on selected item should use `border-s-2` (logical start) instead of `border-l-2` for RTL correctness.
- **A11y:** one `<h1>` per route (the page title); tree has `aria-label`; treeitems have `aria-selected`; preview has `aria-live="polite"`.
- **Prettier:** no semicolons, double quotes, 2-space, classes inside `cn()` auto-sort.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`, `@/` alias works.
- **Colocate** tests next to source.
- Query by role/label/text: `getByRole("tree")`, `getByText("resume.pdf")`, `queryByRole("heading", { level: 1 })` (null in component tests).
- **Keyboard testing:** use `userEvent.keyboard("{ArrowDown}")` or `fireEvent.keyDown(element, { key: "ArrowDown" })`.
- **Don't test:** PDF rendering, Lucide icon internals, Tailwind class strings.

### Project Structure Notes
- Routes under `app/(chrome)/`; `/sources` = `app/(chrome)/sources/page.tsx`. The `(chrome)` layout renders `<main id="main-content">`, skip link, chrome, `AnimatePresence`, and `MobileBottomNav` — do not add another `<main>`.
- New shared components → `components/file-tree.tsx` and `components/file-preview-pane.tsx` (siblings of `stack-marquee.tsx`, `score-ring.tsx`, etc.).

### References
- [Source: _bmad-output/planning-artifacts/epics.md:485-504] — Story 3.5 AC: two-pane file tree (220px tree + content), resume embed + download, contact stub in ComputedStylesPanel, mobile single-pane stack.
- [Source: _bmad-output/planning-artifacts/epics.md:71-75] — FR-060..062: file tree entries, preview pane, mobile single-pane.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:165] — UX-DR1: `<ComputedStylesPanel>` universal panel treatment.
- [Source: components/computed-styles-panel.tsx] — The panel wrapper and cell components to reuse.
- [Source: app/(chrome)/sources/page.tsx] — Current stub page to replace.
- [Source: _bmad-output/implementation-artifacts/3-4-performance-score-rings-and-page-weight-budget.md] — Prior story: RSC/page split, test style, `useShouldAnimate` discipline.
- [Source: _bmad-output/project-context.md] — `framer-motion` not `motion/react`; semantic tokens; named exports / `page.tsx` default export; RSC-deep-boundary; `import type`; Zod source-of-truth; Tailwind v4 no config; RTL logical props; testing rules.

## Dev Agent Record

### Agent Model Used

glm-5.1

### Debug Log References

### Completion Notes List

- Task 1: Defined `SourceTreeItem` interface and `sourcesTree` static array in `app/(chrome)/sources/page.tsx` with 4 items (resume.pdf, articles/, talks/, contact.ts).
- Task 2: Built `FileTree` component with roving tabindex, ArrowUp/ArrowDown/Enter/Space keyboard navigation, `aria-selected`, Lucide icons (FileText, Folder, FolderOpen), responsive width, 44px min-height touch targets on mobile.
- Task 3: Built `FilePreviewPane` with branches for resume (embed + download link), contact (ComputedStylesPanel stub), articles/talks ("Coming soon"), and null (empty). `aria-live="polite"` on preview section.
- Task 4: Created `SourcesPanel` thin client wrapper (owns `selectedId` state, default "resume"). Kept `page.tsx` as RSC with metadata export. Two-pane layout `flex-col md:flex-row`.
- Task 5: 10 FileTree tests (render, click, aria-selected, ArrowDown, ArrowUp, boundary clamp, no h1, aria-label, tabindex) + 8 FilePreviewPane tests (embed src, download link, contact stub, articles/talks coming soon, null, no h1, aria-live). All 18 new tests pass.
- Task 6: `yarn typecheck && yarn lint && yarn test:run` all green (81 tests pass). `yarn format` clean.
- Note: `public/hossam-marey-resume.pdf` does NOT exist. The embed/download UI renders correctly but will show a broken PDF viewer until the file is added. This is expected per Dev Notes.
- Used `border-s-2` (logical start) instead of `border-l-2` for RTL correctness per project-context rules.
- Used `border-e` instead of `border-r` for the tree/content separator.

### File List

| File | Change |
|---|---|
| `components/file-tree.tsx` | New — `"use client"` file tree with roving tabindex, keyboard nav, aria-selected, Lucide icons |
| `components/file-tree.test.tsx` | New — 10 colocated tests for render, selection, keyboard nav, a11y |
| `components/file-preview-pane.tsx` | New — `"use client"` preview pane with PDF embed, contact stub, coming-soon |
| `components/file-preview-pane.test.tsx` | New — 8 colocated tests for preview branches, a11y |
| `components/sources-panel.tsx` | New — `"use client"` thin wrapper lifting selectedId state |
| `app/(chrome)/sources/page.tsx` | Update — replaced stub with RSC page + metadata + SourcesPanel |

### Review Findings

#### Decision Needed

- [x] [Review][Decision] **Sources tree item order deviates from spec** — RESOLVED: Keep current order (option 1). contact.ts before articles/talks prioritizes actionable files over placeholders. `app/(chrome)/sources/page.tsx:11-16`

#### Patch

- [x] [Review][Patch] **Double `onSelect` on Enter/Space** — Fixed: removed `onKeyDown` from `<li>`; Enter/Space handled only by `<ul>` handler. `components/file-tree.tsx:75-80`
- [x] [Review][Patch] **Focus does not follow mouse clicks** — Fixed: added `.focus()` call on clicked element in `onClick` handler. `components/file-tree.tsx:68`
- [x] [Review][Patch] **Redundant `aria-label` on nav+ul** — Fixed: removed `aria-label` from `<ul>`; kept on `<nav>` only. `components/file-tree.tsx:65`
- [x] [Review][Patch] **Unlabeled `<embed>` element** — Fixed: added `title="Hossam Marey resume PDF"` to `<embed>`. `components/file-preview-pane.tsx:25`
- [x] [Review][Patch] **`selectedId` stale when `items` prop changes** — Reverted: ESLint rule `react-hooks/set-state-in-effect` prohibits the fix. Acceptable to show blank preview if items change dynamically. `components/sources-panel.tsx:15`
- [x] [Review][Patch] **`embed` min-height overflow on short viewports** — Fixed: reduced `min-h` from `[550px]` to `[300px]`. `components/file-preview-pane.tsx:36`
- [x] [Review][Patch] **Enter/Space calls `onSelect` when items empty** — Fixed: added `items.length > 0` guard before calling `onSelect`. `components/file-tree.tsx:35-37`
- [x] [Review][Patch] **Download link lacks new-window warning** — Fixed: added `<span className="sr-only"> (opens in new tab)</span>` inside download link. `components/file-preview-pane.tsx:24-32`

#### Defer

- [x] [Review][Defer] **Hardcoded ID coupling in preview pane** — Magic strings `"resume"` and `"contact"` tightly couple preview to specific tree IDs. Design choice for static preview content. `components/file-preview-pane.tsx:14,22`
- [x] [Review][Defer] **PDF embed has no load-error fallback** — If PDF 404s or fails to load, `<embed>` shows browser's broken-plugin UI with no graceful fallback. Out of scope. `components/file-preview-pane.tsx:33-37`
- [x] [Review][Defer] **Missing `aria-expanded` on folders** — Folders carry `role="treeitem"` but lack `aria-expanded`. Folders are flat/non-expandable in current design. `components/file-tree.tsx:79`
- [x] [Review][Defer] **Missing Home/End keyboard support** — ARIA tree pattern expects Home/End to jump to first/last item. Not specified in AC. `components/file-tree.tsx:24-56`
- [x] [Review][Defer] **`aria-live` lacks `aria-busy` during transitions** — Without `aria-busy="true"` during content swap, screen readers may announce intermediate content. Over-engineering for static content. `components/file-preview-pane.tsx:18`

#### Dismissed

- [x] ~~Legitimate zero values hidden~~ — By design per spec AC1c: "omit the ring entirely if metric value is 0".
- [x] ~~`formatBytes` precision loss for sub-byte~~ — Bytes are integers; no sub-byte data exists.

### Change Log

- 2026-05-31: Story 3.5 context created — comprehensive developer guide for Sources file tree + preview pane.
- 2026-05-31: Story 3.5 implementation complete — all 6 tasks done, 18 new tests (81 total pass), all gates green. Status set to review.
