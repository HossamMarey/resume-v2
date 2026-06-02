# Story 6.3: Boss-level contact form UI

Status: review

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
<!-- Updated 2026-06-02: contact now delivers to Telegram via app/api/contact (real, not stubbed); added rate-limiting + bot prevention. See "Telegram delivery & hardening". -->

## Story

As a curious peer,
I want the contact form to feel like fighting a terminal boss **and actually reach Hossam**,
so that the "this person codes" signal lands harder than any project list — without the inbox getting flooded by bots.

## Acceptance Criteria

1. **(FR-070 + FR-071 + UX-DR11 — real form replaces the stub)** A new client component `components/boss-level-contact-form.tsx` (named export `BossLevelContactForm`) is a **real `<form>`** with real `<label>` + `<input>`/`<textarea>` for four fields, and it **replaces** the current `contact.ts` placeholder ("Boss-level contact form coming in Epic 6.") in `components/file-preview-pane.tsx` (the `item.id === "contact"` branch). Fields and bounds:
   - **name** — `<input>`, required, **≥2 chars**
   - **email** — `<input type="email">`, required, **RFC-valid email**
   - **subject** — `<input>`, **optional**, **≤120 chars**
   - **message** — `<textarea>`, required, **≥20 and ≤2000 chars**
   Plus a **hidden honeypot field** (AC8). Each visible field has an associated `<label>` (`htmlFor`/`id`, not placeholder-as-label). The form lives only in the `/sources` preview when `contact.ts` is selected; nothing else on `/sources` changes.

2. **(FR-070 — typewriter prompts)** Each field's prompt label is **typewriter-revealed** (character-by-character) when its field becomes active/visible, via a new `hooks/use-typewriter.ts`. Under `prefers-reduced-motion` the full prompt renders **instantly** (no per-char animation) — gate on `useShouldAnimate` (do not call `useReducedMotion` directly). Timers only — **no `framer-motion`** needed.

3. **(FR-070 — progressive field reveal gated on validity)** Only the **name** field shows initially. The **next** field is revealed **only after the current field is valid** per the **Zod schema** `lib/schemas/contact.ts` (AC5). Reveal is **monotonic** (a shown field never hides). When `message` is revealed, the submit button shell (AC9) appears below it. Newly revealed fields are announced to AT (reveal region `aria-live="polite"`, or focus moves into the new field on advance — AC4).

4. **(FR-073 + NFR-A2 — keyboard interaction)** On the **single-line inputs** (name, email, subject): **↵** on a **valid** field reveals + **focuses** the next (and never submits mid-sequence — `preventDefault`); on an invalid field ↵ does nothing. **↑** moves focus to the previous field (`preventDefault`). **Esc** clears the current field. **Tab** is the conventional fallback (no focus trap). The **`message` textarea is terminal**: native Enter=newline, ArrowUp=caret (the ↵-advance/↑-back handlers apply to inputs only); Esc still clears it. Every interactive element has a visible focus ring.

5. **(FR-071 — Zod schema is the single source of truth — ALREADY CREATED)** `lib/schemas/contact.ts` exports `contactSchema` (name `.min(2)`, `z.email()`, subject `.max(120).optional()`, message `.min(20).max(2000)`) and `export type ContactForm = z.infer<typeof contactSchema>`. **This file already exists** (created 2026-06-02 alongside the route) — verify it matches the bounds above, do **not** duplicate it. The progressive-reveal validity gate (AC3) reads it **per-field** (`contactSchema.shape.<field>.safeParse(value)`). The **same schema validates server-side** in the route (AC6). The honeypot is **not** part of this schema.

6. **(Telegram delivery via server route — ALREADY CREATED, supersedes the v1 stub)** Submitting a valid form **actually delivers** the message to a Telegram channel through the server route `app/api/contact/route.ts` (POST): it `safeParse`s the body with `contactSchema`, then POSTs to the Telegram Bot API (`https://api.telegram.org/bot<token>/sendMessage`). **Secrets are server-only — `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` (NEVER `NEXT_PUBLIC_*`)**, read via `process.env` in the route only; templated in `.env.example`. The route returns `{ ok: boolean }` (200 ok; 400 invalid body; 500 env missing; 502 delivery failed; **429 rate-limited — AC7**). The route + a colocated `route.test.ts` already exist — this story **hardens** them per AC7/AC8, it does not rebuild Telegram delivery. All earlier "stubbed / faked 600–1200ms success" language is void.

7. **(Rate limiting — NEW)** The route **throttles abusive bursts per client** before calling Telegram. Create `lib/rate-limit.ts` (a small in-memory fixed-window limiter, no new dependency) and apply it in the route keyed by client IP (from `x-forwarded-for` first hop, falling back to `x-real-ip`, then a constant when unknown). Default budget: **5 requests / 10 min per IP** (tune via options). On exceed → respond **429** with a `Retry-After` header and `{ ok: false, error: "rate limited" }`, **without** calling Telegram. The limiter degrades safely (unknown IP still bounded by the fallback key) and prunes expired buckets. **Documented caveat:** in-memory state is per-serverless-instance/best-effort on Vercel — for hard guarantees see Open Decision #1 (Upstash).

8. **(Bot prevention — NEW)** Defense-in-depth, **dependency-free by default**:
   - **Honeypot field:** the form renders a hidden input (e.g. `name="company"`) that real users never see/fill — visually hidden **off-screen** (`sr-only`/absolute off-screen, **not** `display:none`), `tabIndex={-1}`, `autoComplete="off"`, `aria-hidden="true"`. The route, **before** validating/sending, checks this field on the raw body; if non-empty it **silently succeeds** (`{ ok: true }`, HTTP 200) **without** sending to Telegram (don't tip off bots).
   - **(Recommended) submit-time trap:** the form includes a render timestamp; the route silently drops (same `{ ok: true }` no-send) submissions faster than a small threshold (e.g. <1500ms) — bots submit instantly.
   - **Captcha is an opt-in upgrade, not the default** (Open Decision #2) — a Turnstile/hCaptcha widget adds a dependency, a public+secret env pair, CSP allowances, and a visible widget that clashes with the terminal aesthetic; honeypot + time-trap + rate-limit is the recommended v1 defense.

9. **(Scope boundary — visible submit lifecycle + XP stay in 6.4)** This story renders the submit **button shell** ("send →") and the honeypot, and **hardens the route**. It does **NOT** implement (these remain **Story 6.4**): the debounced (~150ms) visible `✓ rule_name` / `✗ rule_name — reason` **test-line output**, the submit **lifecycle** ("running tests…" → `fetch("POST", "/api/contact", JSON incl. honeypot + timestamp)` → sonner toast on `{ ok: true }` / voiced failure on non-ok or 429 → **`emitXP(50, "contact:submit")` once**), and `aria-describedby` invalid-summary wiring. Do **not** import `emitXP`/`sonner` in 6.3. (6.4 wires the form to the route this story hardens.)

10. **(Gates green)** `yarn typecheck && yarn lint && yarn test:run` pass and `yarn format` is clean. `yarn build` succeeds, `/sources` still renders, and `/api/contact` builds as a dynamic route. Manual: `contact.ts` shows the typewriter form; the honeypot is invisible + not tabbable; reduced-motion shows prompts instantly; `D` hotkey + `<html dir="rtl">` still work on `/sources`. Route units cover ok / 400 / 429 / honeypot-silent-drop.

## Tasks / Subtasks

- [x] **Task 1 — Zod schema (ALREADY EXISTS — verify only) (AC: 1, 5)**
  - [x] Confirm `lib/schemas/contact.ts` exists and matches AC1 bounds (`z.email()`, name ≥2, subject `.max(120).optional()`, message 20–2000) and exports `contactSchema` + `ContactForm`. Do **not** recreate or duplicate it. Keep the honeypot OUT of this schema.
  - [x] Confirm `lib/schemas/contact.test.ts` passes. (Optional: add the barrel `export * from "./contact"` to the empty `lib/schemas/index.ts`.)

- [x] **Task 2 — Typewriter hook `hooks/use-typewriter.ts` (AC: 2)**
  - [x] Create `hooks/use-typewriter.ts` (`"use client"`, named export `useTypewriter`). `useTypewriter(text, { enabled?, speedMs? }): { text, done }`. Reveal char-by-char with `setTimeout`/`setInterval`; clean up timers on unmount and when `text`/`enabled` change.
  - [x] Gate on `useShouldAnimate()`: when `false` (reduced motion) **or** `enabled === false`, return full `text` + `done: true` immediately (no timers).
  - [x] Colocate `hooks/use-typewriter.test.ts`: fake-timer growth → `done`; reduced-motion (mock `@/hooks/use-should-animate` → `false`) returns full text instantly. `vi.useRealTimers()` in `afterEach`.
  - [x] (Optional) `export * from "./use-typewriter"` in `hooks/index.ts`.

- [x] **Task 3 — `components/boss-level-contact-form.tsx` incl. honeypot (AC: 1, 2, 3, 4, 8, 9)**
  - [x] Client component (`"use client"`, named export `BossLevelContactForm`). State: field values, revealed-count/Set (monotonic), current index. Order `name → email → subject → message`. `useId()` for label/field pairing (mirror `console-repl.tsx`).
  - [x] `<form onSubmit={(e) => e.preventDefault()}>`; each **revealed** field row = typewriter `<label htmlFor>` + `Input`/`Textarea`/`Label` from `@/components/ui/*`. Reveal field N+1 once field N is valid via `contactSchema.shape.<field>.safeParse`. Wrap the field stack in `aria-live="polite"`.
  - [x] **Honeypot (AC8):** render a hidden `<input name="company" tabIndex={-1} autoComplete="off" aria-hidden="true">` with an associated visually-hidden label (e.g. "Leave this field empty"), positioned **off-screen** (`sr-only` or absolute off-screen — **not** `display:none`/`hidden`). It is excluded from the typewriter/reveal flow and from validity gating. (6.4 includes its value + a render timestamp in the POST body.)
  - [x] **Keyboard (AC4):** `onKeyDown` on single-line inputs — Enter (advance+focus next iff valid; `preventDefault`), ArrowUp (focus previous; `preventDefault`), Escape (clear current). Manage focus via a ref array (mirror `console-repl.tsx`). Textarea gets only Escape-clears. Don't trap Tab.
  - [x] **Submit shell (AC9):** once `message` is revealed render `<button type="submit">send →</button>`, **disabled/inert** in this story. Quiet voice styling, **semantic tokens + logical properties only** (`me-`/`ms-`, no `ml-`/`mr-`, no hardcoded hex/oklch).
  - [x] Hossam-voice prompt copy (cosmetic — Open Decision #3). Suggested: name `// who's asking?`, email `// where do I reply?`, subject `// re: (optional)`, message `// your move.`.
  - [x] Colocate `components/boss-level-contact-form.test.tsx`: form + name label render; `<2`-char name does **not** reveal email; valid name + Enter reveals email **and** moves focus; ArrowUp returns; Esc clears; textarea takes a newline (Enter no-advance); `send →` present + disabled after message revealed; **honeypot input is present, `aria-hidden`, and `tabIndex=-1`** (assert it's not in the tab order). Query by role/label; `userEvent.setup()`.

- [x] **Task 4 — Mount in `components/file-preview-pane.tsx` (AC: 1, 10)**
  - [x] Replace the `item.id === "contact"` `ComputedStylesPanel` stub with `<BossLevelContactForm />` (leave `resume`/folder/`null` branches untouched). `file-preview-pane.tsx` is already `"use client"`. **Optional perf:** lazy-load via `next/dynamic` (architecture.md:394) — flag if skipped.
  - [x] Update `components/file-preview-pane.test.tsx`: the contact branch now renders the form (assert the name field/first prompt; the old stub text is gone). Keep other preview-pane tests intact.

- [x] **Task 5 — Rate limiter `lib/rate-limit.ts` (AC: 7)**
  - [x] Create `lib/rate-limit.ts` (no new dep): module-level `Map<string, { count: number; resetAt: number }>` + `rateLimit(key, { limit = 5, windowMs = 600_000 }): { ok, remaining, resetAt }`. Fixed window: new/expired bucket → reset; at-limit → `{ ok: false }`; else increment. Prune expired buckets to bound memory.
  - [x] Colocate `lib/rate-limit.test.ts` (fake timers): allows up to `limit` within window, blocks the next, resets after `windowMs`, independent keys are independent. `vi.useRealTimers()` in `afterEach`.

- [x] **Task 6 — Harden the existing route `app/api/contact/route.ts` (AC: 6, 7, 8)**
  - [x] **Client IP:** read `x-forwarded-for` (first comma-split hop, trimmed) → `x-real-ip` → fallback constant (e.g. `"unknown"`). Helper kept local or in `lib/rate-limit.ts`.
  - [x] **Honeypot (before validation/send):** read the honeypot field (`company`) from the raw parsed body; if a non-empty string → return `NextResponse.json({ ok: true })` (200) **without** sending. (Optional time-trap: if the body carries a render timestamp and `Date.now() - ts < 1500` → same silent `{ ok: true }`.) Honeypot is read from the raw body, NOT via `contactSchema` (which strips unknown keys).
  - [x] **Rate limit:** call `rateLimit(ip)` after the body is parsed (so malformed JSON still 400s first, or before — your call, but bound by IP); on `!ok` → `NextResponse.json({ ok: false, error: "rate limited" }, { status: 429, headers: { "Retry-After": String(Math.ceil((resetAt - Date.now())/1000)) } })`, no Telegram call.
  - [x] Preserve existing behavior: 400 on invalid JSON/`safeParse`, 500 on missing env, 502 on delivery failure, 200 `{ ok: true }` on success. Don't log secrets.
  - [x] Update `app/api/contact/route.test.ts`: add cases — honeypot filled → 200 `{ ok: true }` **and** `fetch` NOT called; over-limit (call POST `limit+1` times, or stub the limiter) → 429 and no `fetch`; (if time-trap added) too-fast → silent 200 no-send. Keep existing ok/400/500/502 cases green (they set the env + stub `fetch`).

- [x] **Task 7 — Verify & gate (AC: 10)**
  - [x] `yarn typecheck && yarn lint && yarn test:run` green; `yarn format` clean; `yarn build` succeeds (`/sources` static; `/api/contact` dynamic).
  - [x] `yarn dev` manual (project-context "UI verification"): contact form reveals/typewriter/keyboard per AC2-4; **honeypot is invisible and not reachable by Tab** (inspect: off-screen, `tabIndex=-1`, `aria-hidden`); reduced-motion → instant prompts; no console errors; `D` hotkey + RTL + mobile single-pane stack (Story 3.5) all intact. (End-to-end Telegram send + toast + XP is exercised in 6.4; route hardening is covered by units here.)

## Dev Notes

### What this story IS (and is NOT)
- **IS:** the boss-level contact form **UI + interaction shell** on `/sources` `contact.ts` (real `<form>`, typewriter prompts, validity-gated reveal, keyboard model), a **hidden honeypot field**, and the **server-side hardening** of the already-built Telegram route — a **rate limiter** (`lib/rate-limit.ts`) and **honeypot rejection** (+ optional time-trap) in `app/api/contact/route.ts`. The Zod schema and the Telegram-sending route **already exist** (built 2026-06-02); this story verifies + hardens them and builds the form.
- **IS NOT:**
  - **The visible validation-as-tests output** (debounced ~150ms, `✓`/`✗` lines, `aria-describedby` summary) → **Story 6.4**.
  - **The submit lifecycle + XP** ("running tests…" → POST `/api/contact` → sonner toast → `emitXP(50, "contact:submit")`) → **Story 6.4** (it wires the form to the route hardened here). 6.3's submit shell is inert.
  - **A captcha widget / new dependency** → not in the default; opt-in only (Open Decision #2).
  - **A distributed/persistent rate-limit store (Upstash/KV)** → not in the default; opt-in only (Open Decision #1).
  - **The `/recruiter` route, Recruiter Mode, or the `/sources` tree itself** → Stories 6.1/6.2/3.5. Only the `contact.ts` preview branch changes here.

### Telegram delivery & hardening (current state of the already-built backend)
- **`app/api/contact/route.ts` (EXISTS):** `POST` handler — `await request.json()` (400 on parse error) → `contactSchema.safeParse` (400 + `flatten().fieldErrors` on fail) → reads `process.env.TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID` (500 if missing) → `fetch` Telegram `sendMessage` with a plain-text body (502 on non-ok/throw) → `{ ok: true }`. **This story inserts honeypot + rate-limit checks ahead of the Telegram call** and adds a 429 path. Keep the `{ ok: boolean }` contract (architecture.md:187).
- **`lib/schemas/contact.ts` (EXISTS):** the single source of truth (client reveal-gate + server validate). Zod 4 `z.email()`. Object schema **strips unknown keys**, so the honeypot must be read from the **raw** body, not from `safeParse` output.
- **`.env.example` (EXISTS):** documents the two **server-only** vars. Hossam must add real values to `.env.local` (gitignored) and to Vercel env. **`NEXT_PUBLIC_` on these would inline the bot token into the client bundle — forbidden.** [Source: [[project_contact_telegram]]; project-context.md decision #5 (updated 2026-06-02)]

### Architecture / project-context guardrails (must follow)
- **Zod schema is the single source of truth; derive types via `z.infer`.** Never a parallel interface. Same schema validates client + server. [Source: project-context.md:70; architecture.md:165,176]
- **Server-only secrets.** Contact secrets live only in the route via `process.env`, never `NEXT_PUBLIC_*`, never logged. [Source: project-context.md "Security" (updated); project-context.md decision #5]
- **No new dependency without approval.** The default rate-limiter and bot defense are **dependency-free** (in-memory Map + honeypot). Upstash/Turnstile = explicit dep approval (Open Decisions). [Source: project-context.md:185,222]
- **Reduced motion gates every animation** — typewriter collapses to instant via `useShouldAnimate()` (not `useReducedMotion` directly). [Source: project-context.md:105,253,302; hooks/use-should-animate.ts]
- **Semantic tokens + logical properties only**; **type-only imports** (`import type`); **no `import React`**; **named exports** (route/`page`/`layout` excepted); import order external → `@/` → relative → side-effects. [Source: project-context.md:68,71-72,95,100,158-162,299]
- **Accessibility (non-negotiable):** real `<form>`+`<label>` per visible field; visible focus rings; reveal region `aria-live`; keyboard parity + Tab fallback (no trap). **The honeypot must NOT harm a11y** — it's `aria-hidden` + `tabIndex=-1` and off-screen, so screen-reader and keyboard users skip it entirely; never present it as a real field. [Source: project-context.md:250-257; ux-design-specification.md:643,892]
- **`D` theme hotkey already skips typing targets** via `isTypingTarget` (`lib/keyboard.ts`) — the form's inputs are excluded automatically; the form's ↑/↵/Esc are **local** `onKeyDown`, not global listeners. [Source: lib/keyboard.ts:1-12]

### Files to create / touch
| File | Action | Notes |
|---|---|---|
| `lib/schemas/contact.ts` | **EXISTS (verify)** | Single source of truth; matches AC1 bounds; honeypot excluded. |
| `lib/schemas/contact.test.ts` | **EXISTS (verify)** | Per-field valid/invalid. |
| `app/api/contact/route.ts` | **UPDATE** | Add IP extraction + honeypot silent-drop + rate-limit 429 ahead of the Telegram call. |
| `app/api/contact/route.test.ts` | **UPDATE** | Add honeypot/429 (+ optional time-trap) cases; keep ok/400/500/502. |
| `.env.example` | **EXISTS** | Server-only `TELEGRAM_BOT_TOKEN`/`TELEGRAM_CHAT_ID`. |
| `lib/rate-limit.ts` | **NEW** | In-memory fixed-window limiter; no dep. |
| `lib/rate-limit.test.ts` | **NEW** | Allow/block/reset/independent-keys with fake timers. |
| `hooks/use-typewriter.ts` | **NEW** | Timer reveal; reduced-motion instant. |
| `hooks/use-typewriter.test.ts` | **NEW** | Growth + reduced-motion-instant. |
| `hooks/index.ts` | **UPDATE (optional)** | Barrel `export * from "./use-typewriter"`. |
| `components/boss-level-contact-form.tsx` | **NEW** | Form: fields + typewriter + reveal + keyboard + honeypot + inert submit shell. |
| `components/boss-level-contact-form.test.tsx` | **NEW** | Reveal/keyboard/honeypot/disabled-submit. |
| `components/file-preview-pane.tsx` | **UPDATE** | Contact branch → `<BossLevelContactForm />`. |
| `components/file-preview-pane.test.tsx` | **UPDATE** | Contact branch renders the form. |

### Reuse — do NOT reinvent
- **`@/components/ui/input` / `textarea` / `label`** — built-in focus rings + `aria-invalid`. Don't hand-roll inputs. [Source: components/ui/input.tsx; project-context.md:98]
- **`components/console-repl.tsx`** — canonical client-form pattern: `useId`, ref-driven focus, `preventDefault` ArrowUp/Enter/Escape. Mirror its keyboard handler shape. [Source: components/console-repl.tsx:61-207]
- **`hooks/use-should-animate.ts`** — the only reduced-motion gate (the typewriter consumes it). [Source: hooks/use-should-animate.ts]
- **`lib/keyboard.ts` `isTypingTarget`** — already excludes the form's inputs from global hotkeys; don't re-implement. [Source: lib/keyboard.ts]
- **The existing `route.ts` + `route.test.ts`** — extend, don't rewrite; the test already stubs `fetch` + sets env, the template to copy for honeypot/429 cases. [Source: app/api/contact/route.ts; app/api/contact/route.test.ts]
- **Existing semantic tokens** (`text-lime`, `bg-surface`, `border-hairline`, `border-input`, `text-muted-foreground`, `focus-visible:ring-ring`, CTA recipe `bg-lime/10 border-lime/50 text-lime`). No new tokens. [Source: ux-design-specification.md:722]

### Doc-vs-code variances / decisions to surface (do NOT silently resolve)
1. **Rate-limit storage — in-memory (default) vs Upstash (robust).** Default: dependency-free in-memory fixed-window in `lib/rate-limit.ts`. **Caveat:** Vercel runs serverless — memory is per-instance and resets on cold start, so the limit is **best-effort**, not a hard global guarantee. For real guarantees use `@upstash/ratelimit` + Upstash Redis (adds a dependency + `UPSTASH_REDIS_REST_URL`/`_TOKEN` env). For a low-traffic personal portfolio the in-memory limiter + honeypot is a reasonable v1; **flag if Hossam wants the Upstash upgrade** (needs dep approval per project-context).
2. **Bot prevention mechanism — honeypot + time-trap (default) vs captcha.** Default: honeypot (silent drop) + optional submit-time trap + the rate limiter — **zero deps, zero UX friction, no a11y cost.** Captcha (Cloudflare **Turnstile** recommended if chosen: free, privacy-friendly) would add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (public) + `TURNSTILE_SECRET_KEY` (server, verified via `challenges.cloudflare.com/turnstile/v0/siteverify`), a CSP allowance, a client dependency/script, and a **visible widget that fights the editorial/terminal aesthetic** and the "calm, no-friction" UX. **Recommendation: ship honeypot + time-trap + rate-limit for v1; add Turnstile only if real spam appears.** Hossam explicitly invited "captcha or any other mechanism" — this is the "any other mechanism" choice; confirm if he specifically wants the captcha widget instead.
3. **Field/prompt copy (Hossam-voice).** UX §644 fixes none of the strings; defaults in Task 3 are cosmetic and editable.
4. **6.3↔6.4 submit seam.** The form's submit **shell is inert in 6.3**; 6.4 wires the actual `fetch("POST","/api/contact", { name, email, subject, message, company /*honeypot*/, renderedAt })`, the toast, and `+50` XP. The route hardened here already accepts those fields. If Hossam prefers the live submit wired now (so bot defense is testable end-to-end in 6.3), that's a small additive change — but it overlaps 6.4's "submit lifecycle + XP" scope; kept split here.
5. **Dynamic import of the form** (architecture.md:394 "contact (dynamic import)") — optional `next/dynamic`; plain import acceptable for 6.3.

### Previous story / cross-cutting intelligence
- **Story 3.5 (done)** built `file-preview-pane.tsx` with the `contact.ts` **stub** branch this story replaces; `SourcesPanel` owns selection + the mobile single-pane stack — don't touch it. [Source: components/file-preview-pane.tsx:41-51]
- **Story 5.1 (done) `console-repl.tsx`** is the closest interaction precedent (client form, `useId`, ref focus, `preventDefault` keys). [Source: components/console-repl.tsx]
- **Already built 2026-06-02 (this session):** `lib/schemas/contact.ts` (+test), `app/api/contact/route.ts` (+test), `.env.example`. Project-context decision #5 + Security § were updated to Telegram. This story consumes/hardens them. [Source: [[project_contact_telegram]]]
- **Story 6.4 (backlog, next)** depends on everything here: it imports `contactSchema` for the debounced ✓/✗ display and wires the submit (incl. honeypot + timestamp) to `/api/contact`, then `emitXP(50, "contact:submit")` on `{ ok: true }`. Author the schema error messages in test-reason style (done) so 6.4 reuses them. [Source: epics.md:731-745]
- **XP bus exists** (`lib/xp/bus.ts`, reason `contact:submit`) from Story 2.5 — **not** wired here. [Source: architecture.md:267]

### Testing standards (project-context §Testing)
- Vitest + Testing Library, `globals: true`, `jsdom`. Colocate tests. Query by role/label (`getByLabelText`, `getByRole("button"/"textbox")`); avoid `getByTestId`. `userEvent.setup()`; `userEvent.keyboard("{Enter}"/"{ArrowUp}"/"{Escape}")` for keys.
- **Test the real schema and the real rate-limiter** (no mocks). **Route test:** stub `global.fetch` (`vi.stubGlobal`) + set `process.env` in `beforeEach`, restore in `afterEach` (the existing test already does this) — assert Telegram is/ isn't called per case (ok / 400 / 429 / honeypot / 500 / 502).
- **Rate-limit + typewriter tests:** `vi.useFakeTimers()`; `vi.useRealTimers()` in `afterEach`.
- **Honeypot test:** assert the input is `aria-hidden`, `tabIndex=-1`, and not returned by `getByRole`/tab order — i.e., invisible to AT and keyboard.
- **Don't test:** Tailwind class strings, shadcn primitives, Next framework internals, exact timer constants. No snapshots.

### Latest tech notes (locked versions — project-context)
- **Next.js 16.1.7 route handlers:** no built-in request IP — derive from `x-forwarded-for` (Vercel sets it; take the first hop) / `x-real-ip`. `NextResponse.json(body, { status, headers })` for 429 + `Retry-After`. The route is dynamic (POST) — fine; `/sources` stays static.
- **In-memory rate limiting on serverless:** per-instance, resets on cold start — best-effort (Open Decision #1). Prune expired buckets to avoid unbounded growth on a long-lived instance.
- **Honeypot a11y:** hide **off-screen** (`sr-only`/absolute), not `display:none`/`hidden` (some bots skip non-rendered fields, and it must remain in the DOM/form payload). `aria-hidden` + `tabIndex=-1` keep humans/AT away.
- **Zod 4.4.3:** `z.email()` (top-level), `contactSchema.shape.<field>` for per-field gating, object schema strips unknowns (honeypot read raw).
- **React 19.2.4:** refs are props; ref array for field focus; Strict Mode double-invokes effects (typewriter must clean up timers each run). `useId()` for ids.
- **No new dependencies** in the default path.

### References
- [Source: _bmad-output/planning-artifacts/epics.md:715-729] — Story 6.3 AC (real form, four fields + bounds, typewriter, reveal-after-valid, ↵/↑/Esc/Tab).
- [Source: _bmad-output/planning-artifacts/epics.md:76-81,731-745] — F8 FR-070..073; Story 6.4 (debounced ✓/✗ + submit + +50 XP) — NOT this story.
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md:637-645] — `<BossLevelContactForm>` anatomy/states/a11y/interaction.
- [Source: _bmad-output/planning-artifacts/architecture.md:165,176,187,285,394,415-416,436,483] — Zod single source of truth; contact route returns `{ ok }`; schemas in `lib/schemas/*`; `boss-level-contact-form.tsx`; `lib/schemas/contact.ts`; sources "contact (dynamic import)".
- [Source: _bmad-output/project-context.md decision #5 + "Contact form" + "Security" (updated 2026-06-02)] — Telegram delivery, server-only env, no `NEXT_PUBLIC_`, "still no rate-limit/spam protection — add honeypot/Vercel limiting".
- [Source: app/api/contact/route.ts; app/api/contact/route.test.ts] — existing route + test to harden/extend.
- [Source: lib/schemas/contact.ts; lib/schemas/contact.test.ts] — existing schema + test to verify.
- [Source: .env.example] — server-only env template.
- [Source: components/file-preview-pane.tsx:41-51; components/file-preview-pane.test.tsx:38-50] — stub branch + test to replace.
- [Source: components/console-repl.tsx:61-207] — client-form + `useId` + ref focus + `preventDefault` keyboard pattern.
- [Source: components/ui/input.tsx; components/ui/textarea.tsx] — shadcn field primitives.
- [Source: hooks/use-should-animate.ts; lib/keyboard.ts] — reduced-motion gate; typing-target helper.

### Project Structure Notes
- `components/boss-level-contact-form.tsx`, `lib/schemas/contact.ts`, `hooks/use-typewriter.ts`, `lib/rate-limit.ts` (flat, like `lib/keyboard.ts`) match architecture naming + kebab-case + named exports.
- Real backend (Telegram route) is now **in v1** (supersedes the v1.1-Resend plan). Print stylesheet (7.3) and the visible submit lifecycle + XP (6.4) are intentionally **not** here.
- Default path adds **no dependency**; Upstash + Turnstile are surfaced as approval-gated upgrades. `/sources` stays static; `/api/contact` is dynamic.

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

- Verified existing `lib/schemas/contact.ts` matches AC1 bounds (name ≥2, z.email(), subject ≤120 optional, message 20–2000)
- Created `hooks/use-typewriter.ts` with setTimeout-based char-by-char reveal, gated on `useShouldAnimate()`
- Created `components/boss-level-contact-form.tsx` with progressive reveal, keyboard navigation (Enter/ArrowUp/Escape), honeypot, and inert submit shell
- Replaced contact stub in `components/file-preview-pane.tsx` with `<BossLevelContactForm />`
- Created `lib/rate-limit.ts` — in-memory fixed-window limiter (5 req / 10 min per IP), prunes expired buckets
- Hardened `app/api/contact/route.ts` with IP extraction, honeypot silent-drop, optional time-trap, and 429 rate-limit response
- All tests pass (312 tests across 39 files)
- `yarn typecheck`, `yarn lint`, `yarn test:run`, `yarn format`, `yarn build` all green
- No new dependencies added

### File List

- `lib/schemas/contact.ts` — EXISTING (verified)
- `lib/schemas/contact.test.ts` — EXISTING (verified)
- `app/api/contact/route.ts` — UPDATED (IP + honeypot + rate-limit + time-trap)
- `app/api/contact/route.test.ts` — UPDATED (honeypot / 429 / time-trap cases)
- `lib/rate-limit.ts` — NEW (in-memory fixed-window rate limiter)
- `lib/rate-limit.test.ts` — NEW (allow/block/reset/independent keys)
- `hooks/use-typewriter.ts` — NEW (timer-based typewriter reveal)
- `hooks/use-typewriter.test.ts` — NEW (growth + reduced-motion instant)
- `hooks/index.ts` — UPDATED (barrel export)
- `components/boss-level-contact-form.tsx` — NEW (form + typewriter + reveal + keyboard + honeypot)
- `components/boss-level-contact-form.test.tsx` — NEW (reveal/keyboard/honeypot/disabled-submit)
- `components/file-preview-pane.tsx` — UPDATED (contact branch → BossLevelContactForm)
- `components/file-preview-pane.test.tsx` — UPDATED (contact branch renders form)

## Story Completion Status

- [x] Epic context analyzed (Epic 6 boss-level contact; 6.3 = form UI + bot defense + route hardening, 6.4 = validation-as-tests + submit lifecycle + XP)
- [x] Architecture requirements extracted (Zod single source of truth, server-only secrets, route `{ ok }` contract, schemas-not-content boundary, reduced-motion gate)
- [x] Existing code read (file-preview-pane contact stub, sources-panel, console-repl keyboard/focus, ui input/textarea, use-should-animate, keyboard helper, the already-built route+schema+.env.example)
- [x] File modifications identified (EXISTS/verify vs UPDATE vs NEW)
- [x] Reuse opportunities documented (shadcn fields, console-repl pattern, use-should-animate, existing route/test, isTypingTarget)
- [x] Testing requirements specified (real schema + limiter, fake-timer typewriter, route honeypot/429 cases, honeypot a11y assertions)
- [x] Anti-patterns + guardrails listed (no NEXT_PUBLIC_ secrets, no XP/toast/submit in 6.3, no new dep by default, honeypot must not harm a11y, no hardcoded colors, reduced-motion gate)
- [x] Doc-vs-code variances surfaced (in-memory vs Upstash, honeypot/time-trap vs captcha/Turnstile, prompt copy, 6.3↔6.4 submit seam, dynamic import)
- [x] Scope boundaries vs Stories 3.5 / 6.1 / 6.2 / 6.4 / 7.3 stated

**Status:** done

### Review Findings

- [x] [Review][Patch] ArrowUp intercepted on message textarea — AC4 says "textarea is terminal: ArrowUp=caret" but handleKeyDown had no textarea guard. Added `if (field.type === "textarea") return` before `e.preventDefault()` in ArrowUp handler. `components/boss-level-contact-form.tsx:180`
- [x] [Review][Patch] Submit button used physical `px-4` instead of logical `ps-4 pe-4`. AC9 requires logical properties. `components/boss-level-contact-form.tsx:252`
- [x] [Review][Patch] useTypewriter wrapped reset in gratuitous setTimeout(0), causing one-frame stale text flash on text change. Reset state synchronously in effect body instead. `hooks/use-typewriter.ts:36-63`
- [x] [Review][Defer] In-memory rate limiter resets on serverless cold starts — documented as Open Decision #1 (Upstash upgrade). `lib/rate-limit.ts` — deferred, pre-existing (known caveat)
- [x] [Review][Defer] All headerless clients share "unknown" rate-limit bucket; X-Forwarded-For spoofable without trusted proxy — Vercel-managed. `app/api/contact/route.ts:9-19` — deferred, pre-existing (Vercel networking)
- [x] [Review][Defer] pruneExpired is O(n) per request — acceptable for low-traffic personal portfolio. `lib/rate-limit.ts:22-27` — deferred, pre-existing

**Ultimate context engine analysis completed — comprehensive developer guide created (updated for Telegram delivery + rate-limiting + bot prevention)**
