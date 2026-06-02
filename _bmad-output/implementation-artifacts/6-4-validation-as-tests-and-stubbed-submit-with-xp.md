# Story 6.4: Validation-as-tests and live submit with XP

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Reconciliation (2026-06-02): epics.md 6.4 still says "stubbed submit … no backend, env vars, or secrets in v1". That language is SUPERSEDED. Story 6.3 already shipped the REAL Telegram route (app/api/contact) with honeypot + time-trap + rate-limit. 6.4 wires the form to that REAL route — there is NO stub, NO faked 600–1200ms delay. The randomized-delay/faked-success wording in epics.md:743-745 and ux-design-specification.md:645 is void. See "Doc-vs-code variances". The +50 XP and the system-log toast survive unchanged. -->

## Story

As a curious peer,
I want validation rendered as passing/failing tests and a dramatic submit that actually reaches Hossam,
so that the showcase interaction reads as "all tests green," not a polite form — and the message is really delivered.

## Acceptance Criteria

1. **(FR-070 + FR-073 + NFR-SE2 + UX-DR5 — validation-as-tests output)** As I type into a revealed field, the **Zod schema** `lib/schemas/contact.ts` validates that field on a **~150ms debounce** and renders a test-line **below the input**:
   - valid → `✓ <rule_name>` in **`text-lime`**, mono, e.g. `✓ email`, `✓ message_length`
   - invalid (and the field has been touched / has content) → `✗ <rule_name> — <short reason>` in **`text-status-err`**, mono, e.g. `✗ message_length — 12 < 20`
   The reason text comes from the schema's messages (already authored in test-reason style — see `lib/schemas/contact.ts`). The **optional `subject`** field shows `✓ subject` when empty or ≤120, `✗` only when >120. Test-lines render only for **revealed** fields and update on the debounce, not on every keystroke synchronously.

2. **(NFR-A2 + UX-DR5 — submit gating + a11y summary)** The submit button is **enabled only when `contactSchema.safeParse(values).success` is true** (whole form valid); otherwise **disabled**. A validation **summary region** (the stack of `✓`/`✗` lines, or a dedicated summary node) is wrapped in `aria-live="polite"`, and the submit button carries **`aria-describedby`** pointing at that summary so AT users hear why submit is blocked. (The form already has `aria-live="polite"` on the field stack from 6.3 — reuse/extend it; do not double-announce.)

3. **(FR-072 + NFR-SE1 — live submit lifecycle wired to the REAL route)** On submit of a valid form:
   - `preventDefault()`, set submitting state → button label becomes **"running tests…"** and the button is disabled while in flight.
   - `fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, subject, message, company /* honeypot */, renderedAt /* mount timestamp */ }) })`.
   - The body **MUST include the honeypot `company` value and the `renderedAt` mount timestamp** so the route's bot-defense (6.3) works. Read the honeypot from the form (ref or `FormData`), and `renderedAt` from a `useRef(Date.now())` captured at mount.
   - On **`res.ok` and `{ ok: true }`** → a **sonner success toast** in system-log voice: `hm@portfolio: message queued. response window: 2 business days.` and **`emitXP(50, "contact:submit")`** fires (imported from `@/lib/xp/bus`, the same way `project-open-xp.tsx`/`konami-listener.tsx` do). Button reverts to its idle label; on success, leave the form readable (a reset is optional — see Open Decision #2).
   - On **non-ok** (400/500/502) → a **sonner error toast**, system-log voice, e.g. `hm@portfolio: delivery failed. retry, or email hosmarey@gmail.com directly.` No XP.
   - On **429** (rate limited) → a distinct error toast, e.g. `hm@portfolio: too many attempts. cool down and retry shortly.` No XP. (Read `res.status === 429`.)
   - On **network throw** (`fetch` rejects) → same voiced failure path as non-ok. No XP.

4. **(XP fires once, no backend secrets in the client)** `emitXP(50, "contact:submit")` fires **only on confirmed success**. Note: `emitXP` **self-dedupes by reason** (persists `hm_xp_granted`), so the +50 grant lands once-ever per browser regardless of resubmits — this satisfies "fires once". The **toast still fires on every successful submit** (it is not gated by the XP dedup). **No `TELEGRAM_*` env var, token, or secret is read or referenced in any client component** — the client only `fetch`es the route; secrets stay server-only in `app/api/contact/route.ts`.

5. **(Reduced motion)** Any submit-button "pulse" / in-flight motion is gated by `useShouldAnimate()` (collapses to no animation). The `✓`/`✗` lines are **content, not animation** — they render the same under reduced motion. Toasts still appear (sonner is content-level; reduced-motion suppresses XP *bar/toast* animation elsewhere but the contact success toast is the explicit user feedback for the action and must show).

6. **(Scope — extend, do not rebuild)** This story edits **only** `components/boss-level-contact-form.tsx` (+ its test) and adds an optional small debounce hook. It does **NOT** touch `app/api/contact/route.ts`, `lib/rate-limit.ts`, `lib/schemas/contact.ts`, `hooks/use-typewriter.ts`, `components/file-preview-pane.tsx`, or `/sources` — all built/hardened in 6.3/3.5. It does **NOT** add a captcha, a new persistence store, or any dependency.

7. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds; `/sources` stays static; `/api/contact` stays dynamic. Manual (`yarn dev`): typing shows debounced `✓`/`✗` lines; submit disabled until the whole form is valid; a valid submit shows "running tests…" then a success toast and the XP bar increments by 50 (first time); a forced failure (e.g. unset env locally, or block the network) shows the voiced error toast and **no** XP; reduced-motion shows no pulse but still toasts; `D` hotkey + `<html dir="rtl">` + mobile single-pane still work on `/sources`; no console errors.

## Tasks / Subtasks

- [x] **Task 1 — Debounced validation values (AC: 1)**
  - [x] Add a small reusable hook `hooks/use-debounced-value.ts` (`"use client"`, named export `useDebouncedValue<T>(value, delayMs): T`) — `setTimeout` to update, clear on change/unmount. (Inline debounce is acceptable, but a tested hook matches the one-hook-per-file convention and is reused by the per-field test-lines.)
  - [x] Colocate `hooks/use-debounced-value.test.ts` (fake timers): value updates only after `delayMs`; rapid changes coalesce to the latest; `vi.useRealTimers()` in `afterEach`.
  - [x] (Optional) `export * from "./use-debounced-value"` in `hooks/index.ts`.

- [x] **Task 2 — Per-field test-line output (AC: 1, 2)**
  - [x] In `FieldRow` (or a new `<TestLine>` child), compute the debounced value and render the `✓`/`✗` line **below** the input. Valid → `✓ <rule>` (`text-lime`); invalid+touched → `✗ <rule> — <reason>` (`text-status-err`). Mono, `text-xs`. Map a stable `rule_name` per field (e.g. `name`, `email`, `subject`, `message_length`). Pull the reason from `contactSchema.shape[name].safeParse(value).error` message (already test-reason styled).
  - [x] Only show the `✗` line once the field is **touched or non-empty** (don't scream at an untouched optional field). `subject` empty → `✓ subject`.
  - [x] Keep the existing `aria-invalid` wiring on the input.

- [x] **Task 3 — Submit gating + a11y summary (AC: 2)**
  - [x] Replace the always-`disabled` submit button (6.3 inert shell) with `disabled={!isFormValid || isSubmitting}` where `isFormValid = contactSchema.safeParse(values).success`.
  - [x] Give the validation region (field stack already wrapped in `aria-live="polite"` — reuse it, or add a dedicated summary node with an `id`) an `id`, and add `aria-describedby={summaryId}` to the submit button. Do not introduce a second redundant live region.

- [x] **Task 4 — Live submit lifecycle (AC: 3, 4, 5)**
  - [x] Capture `renderedAt = useRef(Date.now())` at mount. Add a ref (or read via `FormData(e.currentTarget)`) to obtain the honeypot `company` value at submit time (the honeypot is uncontrolled `defaultValue=""` in 6.3).
  - [x] Change `<form onSubmit>` from the inert `e.preventDefault()` to an async handler: `preventDefault()` → guard `isFormValid` → `setSubmitting(true)` → `fetch("/api/contact", …)` with body `{ name, email, subject, message, company, renderedAt: renderedAt.current }`.
  - [x] On `res.ok` + `{ ok: true }` → `toast.success("hm@portfolio: message queued. response window: 2 business days.")`, `emitXP(50, "contact:submit")`, **clear all form inputs**, and **show a thank you message** (`// transmission received. thank you for reaching out.`). On `res.status === 429` → distinct rate-limited error toast. On other non-ok or thrown → voiced `toast.error(...)`. Always `setSubmitting(false)` in `finally`.
  - [x] Button label: idle `send →`, in-flight `running tests…`. Gate any pulse animation on `useShouldAnimate()`.
  - [x] Import `toast` from `"sonner"` and `emitXP` from `@/lib/xp/bus`. The `<Toaster />` is already mounted in `app/layout.tsx` — do not add another.

- [x] **Task 5 — Tests (AC: all)**
  - [x] Extend `components/boss-level-contact-form.test.tsx`. Stub `global.fetch` (`vi.stubGlobal`) and mock `emitXP` + `toast` (`vi.mock("@/lib/xp/bus", …)`, `vi.mock("sonner", …)`). Reveal all fields by typing valid values + Enter (mirror existing tests). Use `vi.useFakeTimers()` for the debounce and advance timers; `vi.useRealTimers()` in `afterEach`.
  - [x] Assert: invalid field shows `✗ …` line and submit is **disabled**; whole-form-valid enables submit; clicking submit calls `fetch("/api/contact", …)` with a body containing `company` + `renderedAt`; on `{ ok: true }` `toast.success` fires once **and** `emitXP` called with `(50, "contact:submit")`; on non-ok/429 the error toast fires and `emitXP` is **not** called; button shows "running tests…" while in flight.
  - [x] Keep all existing 6.3 tests green (reveal/keyboard/honeypot/Escape/textarea-newline). The honeypot a11y test must still pass.

- [x] **Task 6 — Verify & gate (AC: 7)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds (`/sources` static, `/api/contact` dynamic).
  - [ ] `yarn dev` manual per project-context "UI verification": debounced ✓/✗ lines; submit gating; live success toast + XP +50 (first time); forced-failure voiced toast + no XP; reduced-motion no pulse but still toasts; `D` hotkey + RTL + mobile single-pane intact; no console errors. (To force a local failure: temporarily unset `TELEGRAM_BOT_TOKEN` in `.env.local` → route 500 → error toast.)

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the **visible validation-as-tests output** (debounced ~150ms `✓`/`✗` lines), **submit gating** + `aria-describedby` summary, and the **live submit lifecycle** wired to the **real** `/api/contact` route — "running tests…" → `fetch` (with honeypot + `renderedAt`) → sonner system-log toast → `emitXP(50, "contact:submit")` once on success.
- **IS NOT:** rebuilding the form shell, the route, the rate limiter, the schema, the typewriter, or the honeypot (all done in 6.3/3.5). **Not** a stub/faked delay (superseded). **Not** a captcha or new dependency. **Not** any change to `/recruiter`, Recruiter Mode, or `/sources` tree.

### ⚠️ The "stubbed submit" in the epic is SUPERSEDED — wire the REAL route
- epics.md:743-745 and ux-design-specification.md:645 describe a **stub** ("randomized 600–1200ms delay returns a faked success … no backend, env vars, or secrets in v1"). **That is no longer true.** Project-context decision #5 (updated 2026-06-02) and Story 6.3 (done/review) shipped a **real Telegram route**. There is **no faked delay** — the real `fetch` round-trip IS the delay; the network provides the dramatic beat. Do **not** add `setTimeout` to fake success. [Source: project-context.md decision #5; 6-3 story AC6; epics.md:745 (void)]

### The route contract you are wiring to (already built in 6.3 — do NOT change it)
`POST /api/contact` (`app/api/contact/route.ts`) returns `{ ok: boolean }` and these statuses, in this order of checks:
1. invalid JSON → **400** `{ ok:false, error:"invalid json" }`
2. honeypot `company` non-empty → **200** `{ ok:true }` (silent no-send — bots think they won)
3. `renderedAt` present and `Date.now() - renderedAt < 1500` → **200** `{ ok:true }` (silent no-send, time-trap)
4. rate limit exceeded (5 req / 10 min per IP) → **429** `{ ok:false, error:"rate limited" }` + `Retry-After` header
5. `contactSchema.safeParse` fails → **400** `{ ok:false, issues }`
6. missing `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` → **500** `{ ok:false, error:"server misconfigured" }`
7. Telegram non-ok / throw → **502** `{ ok:false, error:"delivery failed" }`
8. success → **200** `{ ok:true }`

**Implications for the client:**
- **Always send `company` and `renderedAt`** in the body or the bot-defense is bypassed. `company` comes from the uncontrolled honeypot input (`name="company"`); `renderedAt` is the mount timestamp.
- The **time-trap is real:** if the user somehow submits within 1500ms of mount, the route returns `{ ok:true }` **without sending** — the toast/XP will fire on a message that never arrived. In practice the progressive reveal + ≥20-char message make this far exceed 1500ms, so it's a non-issue for humans; just don't artificially shorten or skip `renderedAt`.
- Treat **any** `{ ok:true }` (200) as success for the toast + XP. Branch `429` for its distinct message; everything else non-ok/thrown is the generic voiced failure. [Source: app/api/contact/route.ts:39-121]

### XP semantics (subtle — read this)
- `emitXP(delta, reason)` from `@/lib/xp/bus` **dedupes globally by `reason`** and persists granted reasons in `localStorage["hm_xp_granted"]`. So `emitXP(50, "contact:submit")` grants **once ever** per browser — exactly the "fires once" the AC wants. Resubmits won't re-grant (and that's correct). [Source: lib/xp/bus.ts:62-73]
- The **toast is independent** of XP dedup — call `toast.success(...)` on every successful submit; call `emitXP(50, "contact:submit")` unconditionally on success and let the bus dedupe.
- Emit **directly** like `project-open-xp.tsx` / `konami-listener.tsx` (`import { emitXP } from "@/lib/xp/bus"`), not via the `useXP()` hook (that hook is for *reading* xp in the chrome bar). Do **not** gate `contact:submit` on `EXPERIMENTAL_ENABLED` (only the konami unlock is gated). [Source: components/project-open-xp.tsx:5-12; components/konami-listener.tsx:66-72]
- The chrome `<XPBar>` (Story 2.5) listens for `CustomEvent("hm:xp")` on `window` and will animate the +50 automatically — you do **not** wire the bar. [Source: hooks/use-xp.ts:43; ux-design-specification.md:654]

### Architecture / project-context guardrails (must follow)
- **Zod schema is the single source of truth.** Read `contactSchema` for both per-field test-lines (`contactSchema.shape[name].safeParse`) and whole-form gating (`contactSchema.safeParse(values)`). Never hand-roll parallel validation. [Source: project-context.md:70; architecture.md:165,176]
- **No client-side secrets.** The client only `fetch`es `/api/contact`. **Never** reference `TELEGRAM_*` or any `process.env` in a client component; never `NEXT_PUBLIC_` the token. [Source: project-context.md "Security" / decision #5]
- **Reduced motion gates every animation** via `useShouldAnimate()` (not `useReducedMotion` directly). Only the submit pulse is animated here. [Source: project-context.md:105,253,302; hooks/use-should-animate.ts]
- **Semantic tokens + logical properties only.** `text-lime` for ✓, `text-status-err` for ✗ (both exist in `app/globals.css` via `--color-lime` / `--color-status-err`). No hardcoded hex/oklch; `ps-`/`pe-`/`ms-`/`me-`, never `pl-`/`pr-`/`ml-`/`mr-`. [Source: project-context.md:95,100; app/globals.css:41-48,113-114]
- **TypeScript:** `strict`; `import type` for type-only imports (`isolatedModules`); **no `import React`**; **named exports** for the hook/component. Import order external → `@/` → relative → side-effect. [Source: project-context.md:67-72,158-162]
- **Accessibility (non-negotiable):** the `✓`/`✗` summary in an `aria-live="polite"` region; submit `aria-describedby` → summary; visible focus rings (shadcn primitives already provide them); keyboard parity preserved (don't break 6.3's ↵/↑/Esc handlers). [Source: project-context.md:250-257; ux-design-specification.md:643]

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `components/boss-level-contact-form.tsx` | **UPDATE** | Add debounced test-lines, submit gating + `aria-describedby`, live `fetch` submit, toast, `emitXP`. Change the inert `onSubmit`/disabled button. |
| `components/boss-level-contact-form.test.tsx` | **UPDATE** | Add validation-line, gating, submit-fetch, toast, XP cases; keep 6.3 tests green. Stub `fetch`, mock `sonner` + `@/lib/xp/bus`. |
| `hooks/use-debounced-value.ts` | **NEW (recommended)** | Reusable `useDebouncedValue<T>`; or inline debounce (then no new file). |
| `hooks/use-debounced-value.test.ts` | **NEW** | Fake-timer coalescing test (only if the hook is created). |
| `hooks/index.ts` | **UPDATE (optional)** | Barrel `export * from "./use-debounced-value"`. |
| `app/api/contact/route.ts` | **DO NOT TOUCH** | Built + hardened in 6.3. |
| `lib/schemas/contact.ts`, `lib/rate-limit.ts`, `hooks/use-typewriter.ts` | **DO NOT TOUCH** | Reuse only. |
| `components/file-preview-pane.tsx` | **DO NOT TOUCH** | Already mounts `<BossLevelContactForm />` (6.3). |

### Reuse — do NOT reinvent
- **`contactSchema` + `contactSchema.shape[field]`** — already authored with test-reason messages (`"message must be ≥20 chars"` etc.). Reuse those strings for `✗` lines. [Source: lib/schemas/contact.ts:3-11]
- **`isFieldValid` helper** already exists in `boss-level-contact-form.tsx:47-51` — reuse for line state; add a whole-form `contactSchema.safeParse(values).success` for gating.
- **`@/components/ui/input` / `textarea` / `label`** — keep; they carry focus rings + `aria-invalid`. [Source: components/ui/input.tsx]
- **`useShouldAnimate()`** — the only reduced-motion gate. [Source: hooks/use-should-animate.ts]
- **`toast` from `"sonner"`**, `<Toaster />` already mounted at `app/layout.tsx:34` with success/error icons + dark theme tokens — just call `toast.success/.error`. [Source: app/layout.tsx:8,34; components/ui/sonner.tsx]
- **`emitXP` from `@/lib/xp/bus`** — direct import precedent in `project-open-xp.tsx` / `konami-listener.tsx`. [Source: components/project-open-xp.tsx; components/konami-listener.tsx]
- **6.3's form structure** (controlled `values`, `revealed` Set, `fieldRefs`, `FieldRow`) — extend it; do not restructure the reveal/keyboard logic. [Source: components/boss-level-contact-form.tsx:121-261]

### Doc-vs-code variances / decisions to surface (do NOT silently resolve)
1. **Stub → real submit (RESOLVED by precedent, flagged for record).** epics.md:743-745 + ux-design-specification.md:645 say "stubbed / faked 600–1200ms success / no backend." This is **superseded** by project-context decision #5 + Story 6.3's real Telegram route. **Wire the real route.** Surfaced because the epic text still reads "stubbed" — implementing the stub would regress 6.3.
2. **Post-success behavior — keep vs reset the form.** UX §641 says "submitted (toast → button reverts)" — implies the form stays. Default: revert the button to `send →`, **leave field values intact** (user can see what they sent / resend). A full reset (clear values, collapse reveal to just `name`) is an alternative — pick **keep** unless Hossam wants a reset. Either way the XP only grants once (bus dedup).
3. **Debounce constant + rule_name labels.** ~150ms is from the spec; the exact `rule_name` strings (`message_length` vs `message`) are cosmetic — match the UX example (`✗ message_length: 12 < 20`) loosely; reason text comes from the schema. Editable.
4. **Min dramatic delay.** With a real network call, no artificial delay is added. If the local network is instant in dev, "running tests…" may flash; a tiny optional `Promise.all([fetch, sleep(400)])` floor is acceptable but **must** be reduced-motion-neutral and is **not required**. Default: no artificial floor.
5. **429 / time-trap user messaging.** The 429 gets its own toast. The time-trap (route returns `{ok:true}` silently) will read as success to the client — acceptable for v1 (only triggers on sub-1500ms bot-speed submits). Surfaced so it's a known, intentional edge.

### Previous story / cross-cutting intelligence
- **Story 6.3 (review/done)** built `boss-level-contact-form.tsx` (reveal, typewriter, keyboard, honeypot, **inert** submit shell), `hooks/use-typewriter.ts`, `lib/rate-limit.ts`, and **hardened the route** (honeypot + time-trap + 429). It explicitly **deferred to 6.4**: the debounced ✓/✗ test-lines, the submit lifecycle, the toast, `aria-describedby`, and `emitXP(50,"contact:submit")`. The route already accepts `{ company, renderedAt }`. [Source: 6-3 story AC9; app/api/contact/route.ts:50-60]
- **Story 6.3 review patch** noted the submit button must use logical props (`ps-/pe-`, already fixed) and the textarea ArrowUp guard — preserve both. [Source: 6-3 Review Findings]
- **Story 2.5 (done)** built the XP bus + chrome `<XPBar>` listening on `window` for `hm:xp`; reason `contact:submit` reserved. [Source: lib/xp/bus.ts; hooks/use-xp.ts]
- **Story 5.1 `console-repl.tsx`** is the precedent for client-form keyboard/focus (already mirrored by 6.3). No change needed. [Source: components/console-repl.tsx]
- **`emitXP` self-dedupe** means re-running the dev server / re-submitting won't re-grant; to re-test the +50 visually, clear `localStorage["hm_xp_granted"]` (and `hm_xp_v1`) in devtools.

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`. Colocate. Query by role/label (`getByRole("textbox"|"button")`, `getByText(/✓ email/)`), avoid `getByTestId`. `userEvent.setup()`; `userEvent.keyboard("{Enter}")`.
- **Debounce/typewriter tests:** `vi.useFakeTimers()`; advance with `vi.advanceTimersByTime(150)`; `vi.useRealTimers()` in `afterEach`. Note `userEvent` + fake timers needs `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })` or interleave `act` — mirror the working pattern in `hooks/use-typewriter.test.ts` / existing form test (which mocks `use-should-animate` → instant).
- **Submit tests:** `vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })))`; `vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))`; `vi.mock("@/lib/xp/bus", () => ({ emitXP: vi.fn() }))`. Assert the request URL/body, toast calls, and `emitXP(50, "contact:submit")`. Restore in `afterEach` (`vi.unstubAllGlobals()`, `vi.clearAllMocks()`).
- **Don't test:** Tailwind class strings, shadcn primitives, the route internals (covered by `route.test.ts`), exact debounce constant, Next framework internals. No snapshots.

### Latest tech notes (locked versions — project-context)
- **Zod 4.4.3:** `contactSchema.shape.<field>.safeParse(value)` for per-field state; `.error.issues[0]?.message` (or `flatten()`) for the reason string. Object schema strips unknown keys, so the client may send `company`/`renderedAt` freely — the server reads them off the raw body, not the parsed object. [Source: lib/schemas/contact.ts]
- **sonner 2.0.7:** `import { toast } from "sonner"`; `toast.success(msg)` / `toast.error(msg)`. `<Toaster />` already rendered once at root. [Source: app/layout.tsx:34]
- **React 19.2.4:** refs are props; `useRef(Date.now())` for `renderedAt`; Strict Mode double-invokes effects (the debounce effect must clean up its timer each run).
- **Next.js 16.1.7:** client `fetch` to a same-origin route handler needs no base URL (`fetch("/api/contact", …)`). The route is dynamic; `/sources` stays static.
- **No new dependencies.**

### References
- [Source: _bmad-output/planning-artifacts/epics.md:731-745] — Story 6.4 AC (debounced ✓/✗, submit-disabled-while-invalid, `aria-describedby`/`aria-live`, "running tests…", +50 XP). **Note:** the "stubbed/faked-delay/no-backend" clause is superseded (see variance #1).
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:637-645,654] — `<BossLevelContactForm>` anatomy/states (validation-as-test-output, submit toast system-log voice, "running tests…"), `<XPBar>` listens for `hm:xp`. Submit-stub clause superseded.
- [Source: _bmad-output/project-context.md "Contact form" + decision #5 (updated 2026-06-02)] — real Telegram delivery via `app/api/contact`, server-only env, no `NEXT_PUBLIC_`.
- [Source: _bmad-output/implementation-artifacts/6-3-boss-level-contact-form-ui.md AC9 + Dev Notes] — the explicit 6.3↔6.4 seam: 6.4 owns ✓/✗ lines + submit lifecycle + toast + XP + `aria-describedby`.
- [Source: app/api/contact/route.ts:39-121] — the live route contract (status codes, honeypot/time-trap/429 order, `{ ok }` shape) this story wires to.
- [Source: lib/schemas/contact.ts:3-13] — `contactSchema`, per-field `.shape`, test-reason messages, `ContactForm` type.
- [Source: lib/xp/bus.ts:62-73] — `emitXP` dedupe-by-reason + persist; reason `contact:submit`.
- [Source: components/boss-level-contact-form.tsx:47-51,121-261] — existing form: `isFieldValid`, controlled `values`, honeypot (`company`, uncontrolled), inert submit shell to wire.
- [Source: components/project-open-xp.tsx; components/konami-listener.tsx:66-72] — direct `emitXP` precedent; konami's `EXPERIMENTAL_ENABLED` gate is unlock-only (do NOT copy that gate for contact).
- [Source: app/layout.tsx:8,34; components/ui/sonner.tsx] — `<Toaster />` mounted at root; sonner config.
- [Source: hooks/use-should-animate.ts] — reduced-motion gate for the submit pulse.
- [Source: app/globals.css:41-48,113-114] — `--color-lime` / `--color-status-err` tokens for ✓/✗.
- [Source: hooks/use-typewriter.test.ts] — fake-timer test pattern to mirror for the debounce.

### Project Structure Notes
- All work stays in `components/boss-level-contact-form.tsx` (+ test) plus an optional `hooks/use-debounced-value.ts` (+ test) — flat hook file, kebab-case, named export, matching `hooks/use-typewriter.ts`.
- No route, schema, rate-limit, or `/sources` changes — those are owned by 6.3/3.5. No dependency added. `/sources` stays static; `/api/contact` stays dynamic.
- The epic's "stubbed submit" wording is intentionally not implemented (superseded by the real Telegram route) — documented in variance #1 so it isn't read as a missed AC.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Implemented debounced validation-as-tests output using `useDebouncedValue` hook (150ms delay) with per-field `✓`/`✗` test lines below each input.
- Added `TestLine` component that renders validation state from `contactSchema.shape[field].safeParse()` with test-reason messages from the schema.
- Subject field (optional) shows `✓ subject` when empty — handled by showing validation line for all optional fields regardless of touch state.
- Replaced inert submit button with live gating: `disabled={!isFormValid || isSubmitting}` where `isFormValid = contactSchema.safeParse(values).success`.
- Wrapped field stack in `<div id={summaryId}>` with `aria-live="polite"` and added `aria-describedby={summaryId}` to submit button for a11y.
- Implemented live submit lifecycle: async `handleSubmit` captures `renderedAt` via `useRef` + `useEffect`, reads honeypot `company` from `FormData`, `fetch`es `/api/contact` with full body including bot-defense fields.
- Handle all route response paths: 200+`{ok:true}` → success toast + `emitXP(50, "contact:submit")`; 429 → distinct rate-limited toast; other non-ok/thrown → generic failure toast.
- Button label switches between `send →` (idle) and `running tests…` (in-flight).
- No submit pulse animation added (reduced-motion gate not needed for this story — no animation introduced).
- XP emits only on confirmed success; bus dedupes by reason so +50 grants once-ever per browser.
- Extended test suite: 19 tests total (7 original 6.3 tests + 12 new tests for validation, gating, submit lifecycle).
- All gates green: `yarn typecheck`, `yarn lint`, `yarn test:run` (326 tests), `yarn format`, `yarn build`.
- Fixed React 19 purity rule: `renderedAt` initialized via `useRef(0)` + `useEffect` instead of `useRef(Date.now())`.
- Fixed TypeScript strictness: typed fetch mock with explicit parameters.
- **Post-success UX (user request):** on confirmed success, form inputs are cleared (`setValues` to empty strings), `touched` state is reset, and a thank you message (`// transmission received. thank you for reaching out.`) renders below the submit button in lime mono text. This replaces the earlier "keep values intact" default from the story's Open Decision #2.

### File List

- `components/boss-level-contact-form.tsx` — UPDATED: added TestLine, useDebouncedValue, submit gating, live fetch submit, toast, emitXP, aria-describedby, **post-success clear + thank you message**
- `components/boss-level-contact-form.test.tsx` — UPDATED: 12 new tests for validation-as-tests, submit gating, live submit lifecycle (fetch stub, toast/XP mocks), **asserts cleared inputs + thank you message on success**
- `hooks/use-debounced-value.ts` — NEW: reusable `useDebouncedValue<T>` hook with setTimeout/cleanup
- `hooks/use-debounced-value.test.ts` — NEW: fake-timer tests for debounce coalescing
- `hooks/index.ts` — UPDATED: barrel export for use-debounced-value

### Review Findings

- [x] [Review][Patch] `showThankYou` never resets — persists permanently after success [`components/boss-level-contact-form.tsx`]
- [x] [Review][Patch] Import order violation: `sonner` placed after `@/` imports [`components/boss-level-contact-form.tsx`:12]
- [x] [Review][Patch] Reset `revealed` to just `name` on success — progressive reveal UX one-shot [`components/boss-level-contact-form.tsx`]
- [x] [Review][Patch] Escape clears value but keeps `touched` — spurious validation errors [`components/boss-level-contact-form.tsx`]
- [x] [Review][Patch] Redundant `aria-live="polite"` on thank-you `<p>` (form already has it) [`components/boss-level-contact-form.tsx`]
- [x] [Review][Defer] Toast messages expose personal email `hosmarey@gmail.com` — pre-existing, intentional fallback [`components/boss-level-contact-form.tsx`] — deferred, pre-existing
- [x] [Review][Defer] `new Set()` on every `handleChange` — correct React pattern, negligible perf impact [`components/boss-level-contact-form.tsx`] — deferred, pre-existing

## Story Completion Status

- [x] Epic context analyzed (Epic 6 boss-level contact; 6.3 = form shell + bot defense + route hardening, 6.4 = validation-as-tests + live submit + XP)
- [x] Architecture requirements extracted (Zod single source of truth, server-only secrets, route `{ ok }` contract + status order, reduced-motion gate, semantic tokens/logical props)
- [x] Existing code read (form component, route, schema, xp bus, use-xp, sonner, layout Toaster, project-open-xp/konami emit precedent, existing tests)
- [x] File modifications identified (UPDATE form + test; NEW optional debounce hook; DO-NOT-TOUCH route/schema/rate-limit/preview-pane)
- [x] Reuse opportunities documented (contactSchema + isFieldValid, sonner toast, emitXP direct import, useShouldAnimate, 6.3 form structure)
- [x] Testing requirements specified (debounce fake timers, stub fetch, mock sonner + xp bus, keep 6.3 tests green)
- [x] Anti-patterns + guardrails listed (no stub/faked delay, no client secrets, no new dep, no EXPERIMENTAL gate on contact XP, send company+renderedAt, no second live region)
- [x] Doc-vs-code variances surfaced (stub→real submit, keep-vs-reset, debounce/rule labels, min-delay, 429/time-trap messaging)
- [x] Scope boundaries vs Stories 6.3 / 3.5 / 2.5 stated

**Status:** ready-for-dev

Ultimate context engine analysis completed — comprehensive developer guide created (reconciled to real Telegram delivery; stub superseded).
