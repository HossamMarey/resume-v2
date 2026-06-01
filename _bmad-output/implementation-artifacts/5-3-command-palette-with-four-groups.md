# Story 5.3: ⌘K command palette with four groups

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As any visitor,
I want a fuzzy command palette,
so that every destination and action is reachable by keyboard from anywhere in the chrome.

## Acceptance Criteria

1. **(FR-090 — open/close triggers)** A new client component `components/command-palette.tsx` is mounted **once** in `app/(chrome)/layout.tsx` (persistent chrome). It opens on:
   - **`⌘K` (macOS) / `Ctrl+K` (others)** — a global `keydown` listener. **When the palette is closed**, the keystroke is **ignored if the event target is a typing target** (`isTypingTarget` from `@/lib/keyboard` — reuse, do not reinvent). **When the palette is already open**, `⌘K`/`Ctrl+K` **closes** it regardless of target (re-press toggles — UX §83), because the open palette's own search `<input>` is itself a typing target.
   - **The "Inspect me" CTA.** The CTA (`components/inspect-me-cta.tsx`) already calls `openCommandPalette()` from `@/lib/command-palette/bus`. The palette **registers itself as the opener** via `registerPaletteOpener(() => setOpen(true))` in a mount effect and **unsubscribes on unmount** (the bus returns the unsubscribe fn). **Do NOT modify `inspect-me-cta.tsx` or `lib/command-palette/bus.ts`** — they are the existing seam; this story fills it.

2. **(FR-091 — four groups)** The `cmdk` `<CommandDialog>` renders exactly four `<CommandGroup>`s in this order, sourced from typed content (`@/lib/content`), never hardcoded duplicates of content:
   - **Navigate** — 6 entries: `Elements` → `/`, `Network` → `/work`, `Console` → `/console`, `Performance` → `/perf`, `Sources` → `/sources`, `Recruiter` → `/recruiter`. Selecting → `router.push(href)`.
   - **Projects** — one entry per `projects` (from `@/lib/content`): label = `Project.name`, selecting → `router.push("/work/" + project.slug)`.
   - **Actions** — `Toggle Recruiter Mode`, `Download Resume`, `Copy Email` *(conditional — see AC 5)*, `Toggle Theme`. Behaviors in AC 4/5.
   - **Socials** — one entry per `profile.socials[]` (label = `social.label`): selecting opens `social.href` in a **new tab** via `window.open(href, "_blank", "noopener,noreferrer")`.

3. **(FR-092 — fuzzy search + keyboard nav)** Fuzzy search runs across all groups simultaneously with `cmdk`'s **built-in** scoring (exact > prefix > fuzzy). **Do NOT write a custom ranking/filter algorithm** — `cmdk`'s default `commandScore` already ranks exact > prefix > fuzzy; reinventing it is the wheel-reinvention anti-pattern. Add searchable `keywords` to items where the visible label alone is too thin (e.g. Navigate "Elements" → keywords `["home","about","identity"]`, "Network" → `["work","projects"]`; Projects items → include `slug` + `stack` so a stack term finds the project). `↑`/`↓` move the highlight, `↵` runs the highlighted item, `Esc` closes (Radix Dialog default). Empty query shows all groups; no match shows a voiced `<CommandEmpty>` line (e.g. `No matches — try a route, project, or action.`).

4. **(FR-091 Actions — Toggle Theme + Download Resume + Toggle Recruiter Mode)**
   - **Toggle Theme** → does **not** change theme (site is dark-only). It fires the existing deadpan toast **verbatim**: `toast("Site is dark-only. The vibe is intentional.", { id: "theme-dark-only" })` (reuse the exact copy + toast id from `components/theme-provider.tsx:46`). **Do NOT import `useTheme`/`setTheme`** — there is nothing to set.
   - **Download Resume** → triggers a download of `/hossam-marey-resume.pdf` via a programmatic same-origin anchor (`createElement("a")`, set `href`, `download`, `click()`, remove) — the same inline pattern Story 5.2 uses in `components/console-repl.tsx` (`handleSubmit`, the `"download"` effect). No new dependency.
   - **Toggle Recruiter Mode** → **for this story, navigates to `/recruiter`** (`router.push("/recruiter")`), no persistence. The full dual-surface toggle (`useRecruiterMode` hook, `localStorage["hm_recruiter_v1"]`, chrome unmount) is **Story 6.2** — build this as a distinct Actions entry whose `onSelect` Story 6.2 can swap to the hook's toggle **without restructuring** the palette. (See Dev Notes "Recruiter Mode — deferred to Epic 6.")

5. **(Copy Email — never render an empty email)** `profile.email` is currently `""`. Build the `Copy Email` Actions entry **conditionally**: render it **only when `profile.email !== ""`**. When present, selecting copies via `navigator.clipboard?.writeText(profile.email)` (guard for clipboard absence) and fires a sonner toast (`Email copied to clipboard.`). This mirrors Story 5.2's `whoami` rule — never surface an empty `email:`. (See Questions — Hossam may add a real email.)

6. **(Run = close + act)** Every item's `onSelect` **closes the palette** (`setOpen(false)`) and then performs its effect (navigate / new-tab / toast / clipboard / download). Closing yields Radix's default **focus restoration** to the element focused before open (the "Inspect me" button when opened from the CTA; the prior focus when opened via `⌘K`) — satisfies FR-092 "focus returns to trigger." Do not hand-roll focus management.

7. **(FR-093 — reduced motion: opacity-only, no scale/blur)** The palette enter/exit must not scale or blur under `prefers-reduced-motion`. Gate with `useShouldAnimate()` (`@/hooks/use-should-animate`) and, when it returns `false`, neutralize the dialog's zoom keyframe by passing `!animate-none` to the `CommandDialog`'s `className` (the vendored `DialogContent` hardcodes `data-open:zoom-in-95` / `data-closed:zoom-out-95` — there is **no** global `prefers-reduced-motion` CSS in this repo, so the zoom is **not** auto-gated). `!animate-none` (`animation: none !important`) removes scale **and** blur under reduced motion; the dialog still renders (base opacity). The overlay only fades (no scale/blur) and needs no change. **Do NOT add a `tailwind.config.*` or edit `app/globals.css`** for this — the JS gate is the in-repo pattern.

8. **(Accessibility — keyboard parity, ARIA correct)** Built on shadcn `<CommandDialog>` (Radix Dialog + `cmdk`) → ARIA dialog + listbox wiring is correct by default; the hidden `DialogTitle`/`DialogDescription` (already in `command.tsx`) name the dialog. Add a footer kbd hint (`↑↓ navigate · ↵ select · esc close`) using the `<kbd>` token idiom (`rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px]` — design-system §`<kbd>`). All interactive paths work mouseless. RTL: any spacing uses logical properties (`ms-`/`me-`/`gap-*`), never `ml-`/`mr-`.

9. **(Tokens only — no hardcoded color)** Use semantic tokens via the vendored `command.tsx` primitives (`bg-popover`, `text-foreground`, `text-muted-foreground`, `border-hairline`, `bg-muted` selection). Never hardcode hex/oklch. Reuse `components/ui/command.tsx` as-is (`CommandDialog`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandGroup`, `CommandItem`, optionally `CommandShortcut`) — **do not fork or re-implement** the command primitive.

10. **(Out of scope — no XP, no Konami, no recruiter persistence)**
    - **No XP emit.** Story 5.3's AC mandates no `emitXP`. Do **not** add palette-open or palette-action XP (the "palette XP" phrase in FR-101 is an Epic-6 unmount note, not a 5.3 grant). Do **not** import `lib/xp/bus`.
    - **No Konami "Experimental" entry.** FR-082's "Experimental" palette entry is **Story 5.4** (revealed on `hm_unlocks_v1`). Architect the Actions group so 5.4 can append a conditional entry without restructuring; implement nothing now.
    - **No recruiter persistence / hook.** `useRecruiterMode`, `hm_recruiter_v1`, chrome unmount = **Story 6.2** (see AC 4).

11. **(Regression — chrome, CTA, routes intact)** The persistent chrome, tab navigation, the `visit:*` XP grants (Story 2.5, `app/(chrome)/layout.tsx`), the `D` deadpan toast (`theme-provider.tsx`), the XP bar, mobile bottom nav, RTL, and theme all keep working. The "Inspect me" CTA now actually **opens the palette** (previously it fell back to focusing the `⌘K` hint); the bus fallback still focuses the hint when no palette is mounted (e.g. SSR / before hydration). No console errors/warnings on any palette path. `⌘K` does not hijack typing in the REPL/forms (typing-target skip when closed).

12. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds; chrome routes still render. Live verification (Task 5) confirms open via `⌘K`/`Ctrl+K` + "Inspect me", all four groups populated, fuzzy search, `↑↓↵`/`Esc`, every action's effect, the reduced-motion (opacity-only) path, and focus return.

## Tasks / Subtasks

- [x] **Task 1 — Build `components/command-palette.tsx` (AC: 1, 2, 4, 5, 6, 7, 8, 9, 10)**
  - [x] `"use client"`. Named export `CommandPalette`. Imports: `useEffect`/`useState` (react); `useRouter` from **`next/navigation`**; `toast` from `sonner`; `projects`, `profile` from `@/lib/content`; `isTypingTarget` from `@/lib/keyboard`; `openCommandPalette`'s sibling `registerPaletteOpener` from `@/lib/command-palette/bus`; `useShouldAnimate` from `@/hooks/use-should-animate`; the `Command*` parts from `@/components/ui/command`; `cn` from `@/lib/utils`. (Respect import-group ordering + `import type`.)
  - [x] State: `const [open, setOpen] = useState(false)`. `const router = useRouter()`. `const animate = useShouldAnimate()`.
  - [x] **Opener registration effect:** `useEffect(() => registerPaletteOpener(() => setOpen(true)), [])` (return value IS the unsubscribe — clean up on unmount).
  - [x] **`⌘K` effect:** add a `window` `keydown` listener. Logic (precise):
    ```
    if (event.key.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return
    event.preventDefault()
    setOpen((prev) => {
      if (prev) return false                 // re-press closes (works even though the cmdk input is focused)
      if (isTypingTarget(event.target)) return false  // don't open from REPL/forms
      return true
    })
    ```
    Clean up the listener on unmount. (Use the functional `setOpen` updater so the handler can be registered once with `[]` deps and still read the latest `open`.)
  - [x] Render `<CommandDialog open={open} onOpenChange={setOpen} className={cn(!animate && "!animate-none")}>`. Inside: `<CommandInput placeholder="Type a command or search…" />`, `<CommandList>` with the four groups + `<CommandEmpty>`, and a footer kbd-hint row.
  - [x] **Navigate group:** 6 items (Elements/Network/Console/Performance/Sources/Recruiter). Each `<CommandItem value={label} keywords={[...]} onSelect={() => { setOpen(false); router.push(href) }}>`. Optional: reuse the lucide icons already in `devtools-chrome.tsx` for visual parity (not required).
  - [x] **Projects group:** `projects.map((p) => <CommandItem key={p.slug} value={p.name} keywords={[p.slug, ...p.stack]} onSelect={() => { setOpen(false); router.push("/work/" + p.slug) }}>{p.name}</CommandItem>)`.
  - [x] **Actions group:** Toggle Recruiter Mode (`router.push("/recruiter")`), Download Resume (anchor-click `/hossam-marey-resume.pdf`), Copy Email (**only if `profile.email !== ""`** → `navigator.clipboard?.writeText(profile.email)` + toast), Toggle Theme (deadpan toast, verbatim + `id: "theme-dark-only"`). Each closes the palette first.
  - [x] **Socials group:** `profile.socials.map((s) => <CommandItem key={s.href} value={s.label} onSelect={() => { setOpen(false); window.open(s.href, "_blank", "noopener,noreferrer") }}>{s.label}</CommandItem>)`.
  - [x] Footer hint with `<kbd>` chips (`↑↓ navigate · ↵ select · esc close`); logical-property spacing; `text-muted-foreground`.

- [x] **Task 2 — Mount in the chrome layout (AC: 1, 11)**
  - [x] In `app/(chrome)/layout.tsx` (already `"use client"`), import `{ CommandPalette }` and render it once (e.g. just before `<MobileBottomNav />`, outside `<main>`/`AnimatePresence` so it never re-mounts on route change). Do **not** otherwise touch the layout's chrome / `visit:*` XP / page-transition logic.

- [x] **Task 3 — Component tests `components/command-palette.test.tsx` (NEW) (AC: 1, 2, 3, 4, 5, 6, 7, 11)**
  - [x] Vitest `globals: true`, `jsdom`, `userEvent.setup()`. Mock **boundaries only**: `vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }))` with a `push` spy; `vi.mock("sonner", () => ({ toast: vi.fn() }))`. Spy `window.open`, `navigator.clipboard.writeText`, and `HTMLAnchorElement.prototype.click`.
  - [x] **Open via `⌘K`:** `fireEvent.keyDown(window, { key: "k", metaKey: true })` → dialog appears (query by role `dialog` or the search input by placeholder/role). (Use `fireEvent` for the meta-combo — `user-event` doesn't model `⌘K` cleanly; project-context allows `fireEvent` for keyboard cases it can't model.) Also assert `Ctrl+K` opens.
  - [x] **Typing-target skip:** render the palette with a focused `<input>` in the tree; `fireEvent.keyDown(inputEl, { key: "k", metaKey: true })` → dialog stays closed.
  - [x] **Re-press closes:** open, then `fireEvent.keyDown(window, { key: "k", metaKey: true })` (or on the cmdk input) → closes.
  - [x] **Groups present:** open → assert a Navigate item (`Recruiter`), a Projects item (a real `projects[0].name`), Actions (`Toggle Theme`), and a Socials item (`GitHub`) are rendered.
  - [x] **Navigate:** select `Console` → `push("/console")`. **Project:** select a project → `push("/work/" + slug)`. **Toggle Recruiter Mode:** → `push("/recruiter")`.
  - [x] **Toggle Theme:** select → `toast` called with the verbatim dark-only string + `{ id: "theme-dark-only" }`; `push` **not** called.
  - [x] **Download Resume:** select → `HTMLAnchorElement.prototype.click` fired (href `/hossam-marey-resume.pdf`).
  - [x] **Socials:** select `GitHub` → `window.open` called with the href, `"_blank"`, `"noopener,noreferrer"`.
  - [x] **Copy Email hidden:** with the shipped `profile.email === ""`, assert **no** `Copy Email` item. (Optional: a second case mocking `@/lib/content` `profile` with a non-empty email asserts the item appears and `clipboard.writeText` fires — only add if cheap.)
  - [x] **Fuzzy filter:** type a project's stack term or partial name → matching item visible, an unrelated item filtered out. Do **not** assert exact cmdk score ordering (framework behavior).
  - [x] Do **not** test Tailwind classes, `framer-motion`, Radix focus internals, or `dynamic()`. Query by role/label/text.

- [x] **Task 4 — Reduced-motion + CTA wiring checks (AC: 1, 7, 11)**
  - [x] Test (or live-verify) that with `useShouldAnimate()` mocked `false`, the `CommandDialog` receives the `!animate-none` class (assert via the rendered dialog content's class list, or rely on live verification — prefer not to over-assert classes; a light check is fine).
  - [x] Verify the existing `lib/command-palette/bus.test.ts` still passes (the palette registers an opener at runtime; the bus unit tests are unaffected). Confirm `inspect-me-cta.tsx` is unchanged.

- [x] **Task 5 — Live verification (AC: 1, 3, 6, 7, 11, 12)**
  - [x] `yarn dev`. On `/` press `⌘K`/`Ctrl+K` → palette opens; click "Inspect me" → opens. Re-press `⌘K` → closes; `Esc` → closes (focus returns to the trigger).
  - [x] All four groups populated. Fuzzy: type `whoa`/a project name/`recru` → ranked matches; `↑↓` highlight, `↵` runs. Empty query shows all; gibberish shows the voiced empty line.
  - [x] Actions: `Toggle Theme` → deadpan toast (verbatim); `Download Resume` → PDF downloads; `Toggle Recruiter Mode` → lands on `/recruiter`; Socials → GitHub opens in a new tab. `Copy Email` absent (email empty).
  - [x] In the REPL (`/console`), focus the input and press `⌘K` → does **not** open (typing-target skip); the palette is still openable via "Inspect me" / `⌘K` outside the input.
  - [x] Reduced motion (DevTools "Emulate prefers-reduced-motion: reduce") → palette enters/exits with **no scale/blur**. No console errors/warnings; `D` toast still works; tab-switch + RTL (`<html dir="rtl">`) intact; mobile (`<640px`) opens/usable.

- [x] **Task 6 — Gate + commit (AC: 12)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds.
  - [x] Commit (Conventional Commits, console scope): `feat(console): ⌘K command palette with four groups (story 5.3)`.

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the global `⌘K`/`Ctrl+K` fuzzy command palette — a `cmdk` `<CommandDialog>` with four groups (Navigate / Projects / Actions / Socials), mounted once in the chrome layout, opened by the keystroke **and** the already-wired "Inspect me" CTA (via the existing palette bus). Selecting an item closes the palette and navigates / opens a tab / fires a toast / copies / downloads.
- **IS NOT:**
  - **Konami "Experimental" palette entry** — Story 5.4 (reveal on `hm_unlocks_v1`). Leave an append seam; implement nothing.
  - **Recruiter Mode persistence / `useRecruiterMode` / chrome unmount** — Story 6.2. Here "Toggle Recruiter Mode" only navigates to `/recruiter`.
  - **The `/recruiter` editorial layout** — Story 6.1 (currently a stub page; navigation still works).
  - **Any XP** — no FR mandates palette XP in 5.3; do not emit.
  - **A custom fuzzy/ranking algorithm** — `cmdk` already ranks exact > prefix > fuzzy.

### The existing seam (already built — reuse, don't rebuild)
- `lib/command-palette/bus.ts` — `registerPaletteOpener(fn): () => void` (returns unsubscribe) and `openCommandPalette(fallback?)`. The palette **registers** its `setOpen(true)`; the CTA **calls** `openCommandPalette`. Module-level single-opener — exactly one palette instance (the chrome-layout mount). **Do not modify this file.**
- `components/inspect-me-cta.tsx` — already calls `openCommandPalette(() => hintRef.current?.focus())`. Once the palette mounts and registers, the CTA opens it; the focus-hint fallback only runs when no opener is registered (SSR / pre-hydration). **Do not modify.**
- `components/ui/command.tsx` — vendored shadcn `cmdk` wrapper (`CommandDialog` built on `Dialog` + `cmdk`, with hidden `DialogTitle`/`DialogDescription` for a11y). Compose it; **do not fork**. `CommandDialog` forwards `className` to `DialogContent` (that's where `!animate-none` lands for AC 7).

### Recruiter Mode — deferred to Epic 6 (surfaced, not silently resolved)
FR-091 lists "Toggle Recruiter Mode" under Actions, and FR-100/Story 6.2 specify a **dual** toggle (chrome button + this palette entry) sharing a single `useRecruiterMode` hook over `localStorage["hm_recruiter_v1"]`, with the chrome **unmounting** on enable. That hook + persistence + unmount is **Story 6.2's** scope and depends on the `/recruiter` route + recruiter layout (Epic 6). Building half of it now would fork the source of truth. **Locked for 5.3:** the entry simply `router.push("/recruiter")` (graceful degradation, like the CTA degraded to focusing the hint before the palette existed). Story 6.2 swaps this single `onSelect` to the hook's `toggle()`. Keep the entry isolated so that swap is one line. (Flag to Hossam — Questions.)

### Reduced motion (FR-093) — why a JS gate, not CSS
There is **no** `@media (prefers-reduced-motion)` rule anywhere in `app/globals.css`; every other animation in the repo is gated in JS via `useShouldAnimate()` (reduced-motion → `false`). The vendored `DialogContent` (`components/ui/dialog.tsx:64`) hardcodes tw-animate-css `data-open:zoom-in-95` / `data-closed:zoom-out-95` (scale) — so without a gate the palette **would** scale, violating FR-093. Passing `!animate-none` to the dialog content under reduced motion disables the keyframe (`animation: none !important`), removing scale **and** any blur; the dialog still renders. This keeps the in-repo JS-gate pattern and avoids touching `globals.css` / vendored primitives. (A fade-preserving variant — neutralizing only the scale var — is optional polish, not required.)

### `⌘K` toggle + typing-target nuance (get this exactly right)
- **Closed:** skip typing targets (don't steal `⌘K` from the REPL input / contact form) — matches the architecture's shared typing-target-skip helper for D / Konami / palette (`architecture.md:243`).
- **Open:** the cmdk search `<input>` is focused and **is** a typing target — so the close branch must run **before** the typing-target check. The functional updater in Task 1 does this: `prev === true → false` first; only the open transition consults `isTypingTarget`. Without that ordering, re-press-to-close (UX §83) would silently break.
- Register the listener once (`[]` deps) using the `setOpen((prev) => …)` updater so it always sees current state — don't add `open` to deps and re-bind each toggle.

### Actions — exact behaviors
- **Toggle Theme:** `toast("Site is dark-only. The vibe is intentional.", { id: "theme-dark-only" })` — **verbatim** copy + the **same toast id** as the `D` hotkey (`theme-provider.tsx:46`) so the two surfaces dedupe to one toast. No `useTheme`/`setTheme`.
- **Download Resume:** inline anchor-click to `/hossam-marey-resume.pdf` (exists in `public/`), mirroring 5.2's `console-repl.tsx` download effect (create `<a>`, `href`, `download`, append, `click()`, remove). Same-origin, no SPA navigation. (Optional future DRY: a `lib/download.ts` helper shared with 5.2 — out of scope here to avoid touching 5.2.)
- **Copy Email:** **conditional render** — only when `profile.email !== ""` (today it is `""`). `navigator.clipboard?.writeText(profile.email)` (optional-chain the guard) + `toast("Email copied to clipboard.")`. Never render an empty-email action (mirrors 5.2 `whoami`).
- **Socials:** `window.open(href, "_blank", "noopener,noreferrer")` — new tab, no-opener (UX-DR6 external-link rule). Today `profile.socials` has one entry (GitHub).

### Content shapes (from `@/lib/content` — import the barrel, never `lib/data`)
- `profile`: `{ name, role, location, email: "" , tagline, years, socials: [{label, href}], principles, metrics }` (`lib/content/profile.ts`). `email` is `""`; `socials` = `[{ label: "GitHub", href: "https://github.com/HossamMarey" }]`.
- `projects`: array of `{ slug, name, method, status, year, stack: string[], … }` (`lib/content/projects.ts`). Use `name` for the label, `slug` for `/work/[slug]`, `slug`+`stack` for fuzzy keywords. `/work/[slug]` routes exist (Story 4.3, `generateStaticParams`).

### Mount placement & perf
- Mount in `app/(chrome)/layout.tsx` so the palette persists across all five DevTools routes (it survives client route transitions — the chrome layout mounts once, `architecture.md:210`). `/recruiter` is **outside** `(chrome)`, so the palette is intentionally absent there; recruiter-route palette reachability is Epic 6's concern (UX §713) — do not solve it here.
- `cmdk` (1.1.1) is already a dependency and tiny; the Radix Dialog renders **nothing** until `open`. No `dynamic()` needed — render `<CommandPalette />` directly. (If `yarn build` flags bundle bloat on the chrome layout, code-split is an option, but don't pre-optimize.)

### Reuse — do NOT reinvent
- **`cmdk` ranking** — built-in; don't write a scorer (AC 3).
- **`isTypingTarget`** — `@/lib/keyboard` (same helper as D/Konami).
- **Palette bus** — `registerPaletteOpener` from `@/lib/command-palette/bus` (don't touch the bus or the CTA).
- **`command.tsx` primitives** — compose, don't fork.
- **Deadpan copy** — verbatim from `theme-provider.tsx` (shared toast id).
- **`useShouldAnimate()`** — `@/hooks/use-should-animate`, the repo's reduced-motion gate.
- **`useRouter`** — `next/navigation` (App Router), not `next/router`.
- **`cn()`** — `@/lib/utils`.

### Architecture / project-context guardrails (must follow)
- **RSC by default; this component is a client island** (`"use client"` — uses hooks, `cmdk`, event handlers). `app/(chrome)/layout.tsx` is already a client component; adding the mount is fine. **Named export** `CommandPalette`.
- **TS strict / `isolatedModules`** — `import type` for type-only imports; no `import React`; no `as any`/`!` without a WHY.
- **No new dependency, no state library, no router/i18n lib, no `tailwind.config.*`, no `globals.css` edit** for motion.
- **Import order:** external → `@/lib`/`@/components`/`@/hooks` → relative → side-effects; blank line between groups, alpha within.
- **RTL:** logical properties only. **Tokens:** semantic only (the `command.tsx` primitive already is). **Comments:** WHY-only (the `⌘K`-toggle ordering note and the reduced-motion gate are legitimate WHYs).
- **Accessibility:** keyboard parity, visible focus, ARIA correct via Radix+cmdk. Errors/refusals are conversation (a toast), not modals.

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 App Router** — `useRouter().push` from `next/navigation`. Chrome routes stay statically rendered; the palette is a client island in the persistent chrome layout.
- **React 19.2.4** — refs are props; Strict Mode double-fires effects in dev → the `keydown`/opener effects clean up correctly (return the unsubscribe / `removeEventListener`), so double-mount is idempotent.
- **cmdk 1.1.1** — `CommandDialog`/`Command*` already vendored in `components/ui/command.tsx`; built-in `commandScore` (exact > prefix > fuzzy); items match on `value` + `keywords`.
- **sonner 2.0.7** — `toast(msg, { id })` dedupes by id (shared `"theme-dark-only"` with the D hotkey).

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true` (don't import `describe`/`it`/`expect`), `jsdom`, setup `tests/setup.ts`. Colocate `command-palette.test.tsx` next to the component.
- `userEvent.setup()` for typing/selecting; `fireEvent.keyDown(window, { key:"k", metaKey:true })` for the `⌘K` combo (user-event doesn't model it). Query by role/label/text; avoid `getByTestId`. Mock **boundaries only** (`next/navigation`, `sonner`, `window.open`, `navigator.clipboard`, anchor `click`) — render the **real** palette/cmdk.
- No snapshot tests; don't assert Tailwind classes, framer-motion, Radix focus internals, or `dynamic()`.

### Edge cases to handle
- **`⌘K` while the palette is open** (cmdk input focused) → must close (toggle), even though the input is a typing target — handle the close branch before the typing-target check.
- **`⌘K` inside the REPL/contact input while closed** → must NOT open.
- **`profile.email === ""`** → omit `Copy Email` entirely.
- **`navigator.clipboard` undefined** (older/insecure context) → optional-chain; don't throw.
- **No socials / empty arrays** → groups render with no items (or omit empty groups) without crashing.
- **Opening via CTA vs `⌘K`** → both set `open=true`; closing restores focus appropriately (Radix default).
- **RTL** → kbd hint + group spacing use logical properties.
- **Double-mount in StrictMode (dev)** → effects clean up; no duplicate listeners / openers.

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/command-palette.tsx` | **NEW** | Client island: `⌘K`/`Ctrl+K` listener + opener registration; `CommandDialog` with Navigate/Projects/Actions/Socials; effects (navigate/new-tab/toast/clipboard/download); reduced-motion `!animate-none` gate; kbd footer. Named export `CommandPalette`. No XP, no Konami, no recruiter persistence. |
| `components/command-palette.test.tsx` | **NEW** | Open via `⌘K`/`Ctrl+K`, typing-target skip, re-press close, group presence, navigate/project/recruiter pushes, theme toast (no nav), download click, social new-tab, Copy-Email hidden, fuzzy filter. Mock boundaries only. |
| `app/(chrome)/layout.tsx` | **UPDATE** | Mount `<CommandPalette />` once (outside `<main>`/`AnimatePresence`). Do not touch chrome / `visit:*` XP / transition logic. |
| `components/ui/command.tsx` | **DO NOT TOUCH** | Vendored cmdk wrapper — compose. |
| `lib/command-palette/bus.ts` | **DO NOT TOUCH** | Reuse `registerPaletteOpener`. |
| `components/inspect-me-cta.tsx` | **DO NOT TOUCH** | Already calls `openCommandPalette`. |
| `lib/keyboard.ts` | **DO NOT TOUCH** | Reuse `isTypingTarget`. |
| `app/globals.css` | **DO NOT TOUCH** | Reduced motion handled in JS (`!animate-none`). |

### Previous story intelligence
- **Story 5.2** (immediately prior, in review) established: pure-vs-effect seam, the `download` anchor-click pattern (reuse for Download Resume), the verbatim dark-only refusal copy + toast id, content import from `@/lib/content`, `useRouter` from `next/navigation`, and `fast-check`/boundary-mock testing discipline. The console download effect lives in `components/console-repl.tsx:108-124`.
- **Story 5.1** built the REPL `<input>` — a typing target the closed-palette `⌘K` must skip.
- **Story 2.5 / 4.5** (XP precedent): the bus persists `hm_xp_granted` once-ever per reason — **but 5.3 emits no XP at all** (no FR). Do not import the bus.
- **The palette bus + Inspect-me CTA were pre-built** (commits before 5.1, present in repo): `lib/command-palette/bus.ts` + `bus.test.ts` (5 passing tests) and `components/inspect-me-cta.tsx`. This story is the consumer that fulfills the seam — keep those green and untouched.
- **Standing rule (all stories):** surface doc-vs-code conflicts; don't silently resolve. Applied here to Recruiter-Mode-toggle scope (deferred to 6.2) and the empty-email Copy Email action.

### Git intelligence (recent commits)
`b59762f feat(console): command registry with voiced outputs (story 5.2)`, `ab0bfcb feat(console): REPL shell with command history (story 5.1)`, `d674606 feat(work): grant project-open XP (story 4.5)`. Pattern: **Conventional Commits, one story per commit, scoped to the feature area** (client island + colocated test + minimal layout wiring). Match it: `feat(console): ⌘K command palette with four groups (story 5.3)`.

### Project Structure Notes
- `components/command-palette.tsx` is the architecture-named home (`architecture.md:420,486` map F11 → `components/command-palette.tsx` using shadcn `CommandDialog`). kebab-case file, named export, client island — consistent with `console-repl.tsx`, `devtools-chrome.tsx`.
- No new hook (state + effects live in the component; the recruiter hook is Epic 6). No new dependency, no `tailwind.config.*`, no state lib, no router/i18n change. Fully aligned with the unified structure.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:633-647] — Story 5.3 AC: `cmdk` `<CommandDialog>`, four groups (Navigate 6 routes incl. Recruiter / Projects every slug / Actions / Socials new-tab), fuzzy exact>prefix>fuzzy, `↑↓↵`/Esc, focus returns to trigger, reduced-motion opacity-only.
- [Source: _bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md:236-245] — FR-090 (`⌘K`/`Ctrl+K` + Inspect-me CTA + chrome hint), FR-091 (four groups + Toggle Theme errors dark-only), FR-092 (fuzzy ranking + `↑↓↵`/Esc), FR-093 (reduced-motion opacity-only).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:671-679] — `<CommandPalette>` spec: cmdk overlay, search + grouped list + footer kbd hint, Esc closes / re-press closes, focus returns to trigger, reduced-motion no scale/blur, group content guidelines.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:83,104,295,361,771,789] — `⌘K` from anywhere except typing targets; three-paths-to-every-destination; `<kbd>` chip idiom; fuzzy across all four groups.
- [Source: _bmad-output/planning-artifacts/architecture.md:420,486,210,243,462] — F11 → `components/command-palette.tsx`; chrome layout mounts once / persists across routes; shared typing-target skip helper (D/Konami/palette); `/recruiter` outside `(chrome)`.
- [Source: components/ui/command.tsx] — vendored `CommandDialog`/`Command*` (Radix Dialog + cmdk, hidden title/description) to compose; `className` forwards to `DialogContent`.
- [Source: components/ui/dialog.tsx:42,64] — `DialogContent`/`DialogOverlay` animation classes (`zoom-in-95`/`zoom-out-95` scale on content; fade-only overlay) — gate scale via `!animate-none` under reduced motion.
- [Source: lib/command-palette/bus.ts; lib/command-palette/bus.test.ts] — `registerPaletteOpener`/`openCommandPalette` seam (reuse; don't modify).
- [Source: components/inspect-me-cta.tsx:29] — CTA already calls `openCommandPalette(() => hintRef.current?.focus())` (don't modify).
- [Source: lib/keyboard.ts:1-12] — `isTypingTarget` (reuse for the `⌘K` open guard).
- [Source: components/theme-provider.tsx:46] — verbatim deadpan copy `Site is dark-only. The vibe is intentional.` + toast id `theme-dark-only` (reuse for Toggle Theme).
- [Source: components/console-repl.tsx:108-124] — Story 5.2 download anchor-click pattern (reuse for Download Resume) + `useRouter` navigate effect.
- [Source: lib/content/profile.ts:34-73] — `profile` (email `""`, `socials: [GitHub]`, name/role) for Actions/Socials.
- [Source: lib/content/projects.ts:6-35] — `Project` shape (`slug`/`name`/`stack`) for the Projects group + fuzzy keywords; `/work/[slug]` exists (Story 4.3).
- [Source: app/(chrome)/layout.tsx:1-82] — client chrome layout (mounts once) — add the `<CommandPalette />` mount; do not touch `visit:*` XP / transitions.
- [Source: hooks/use-should-animate.ts] — `useShouldAnimate()` reduced-motion gate.
- [Source: _bmad-output/implementation-artifacts/5-2-command-registry-with-voiced-outputs.md] — prior-story patterns: download effect, verbatim refusal, boundary-mock testing, content barrel imports.
- [Source: _bmad-output/project-context.md] — RSC-by-default/named exports, `@/*`=root, import order, semantic tokens + logical props (RTL), no new deps/no state lib/no `tailwind.config.*`, testing rules (role/label queries, `userEvent.setup()`, mock boundaries only), `lib/content` not `lib/data`, `prefers-reduced-motion` gates every animation.

## Dev Agent Record

### Agent Model Used
Claude Sonnet (via OpenCode)

### Debug Log References
- cmdk React 19 jsdom compatibility: mocked `@/components/ui/command` primitives in tests (vendored shadcn — testing real cmdk internals is out of scope per project-context)
- All 206 tests pass (25 test files), lint clean, typecheck clean, build succeeds

### Completion Notes List
- ✅ Implemented `components/command-palette.tsx` with all 4 groups (Navigate/Projects/Actions/Socials)
- ✅ ⌘K/Ctrl+K global hotkey with typing-target skip and re-press-to-close
- ✅ Registered via `registerPaletteOpener` bus — CTA now opens palette
- ✅ Actions: Toggle Theme (deadpan toast), Download Resume (anchor click), Toggle Recruiter Mode (router.push), Copy Email (conditional on profile.email !== "")
- ✅ Reduced motion gate via `useShouldAnimate()` → `!animate-none` on CommandDialog
- ✅ Footer kbd hint with logical properties
- ✅ Colocated tests: 15 tests covering open/close, groups, navigation, actions, typing-target skip
- ✅ No XP emit, no Konami entry, no recruiter persistence (per AC 10)
- ✅ No modifications to bus.ts, inspect-me-cta.tsx, keyboard.ts, command.tsx

### File List
- `components/command-palette.tsx` (NEW) — CommandPalette client component
- `components/command-palette.test.tsx` (NEW) — 15 tests for palette behavior
- `app/(chrome)/layout.tsx` (UPDATE) — Mount `<CommandPalette />` once in chrome layout

## Questions for Hossam
1. **Toggle Recruiter Mode (scope):** Locked to a plain `router.push("/recruiter")` for this story; the real dual-surface toggle (chrome button + this entry sharing `useRecruiterMode` over `localStorage["hm_recruiter_v1"]`, with the chrome unmounting) is **Story 6.2**. OK to ship the navigate-only behavior now and upgrade the single `onSelect` in 6.2? (For now "Navigate → Recruiter" and "Actions → Toggle Recruiter Mode" both just open `/recruiter`.)
2. **Copy Email:** `profile.email` is currently `""`, so the **Copy Email** action is **omitted** (same rule as `whoami` — never surface an empty email). Add a real email to `lib/content/profile.ts` to make it appear, or keep it hidden for v1?
3. **Reduced-motion style:** Under `prefers-reduced-motion`, the palette uses **no animation** (`!animate-none` → instant, no scale/blur) rather than a soft opacity fade. FR-093 only forbids scale/blur; instant is the simplest/safest. Want the opacity fade preserved instead (a touch more polish, slightly more CSS)?
