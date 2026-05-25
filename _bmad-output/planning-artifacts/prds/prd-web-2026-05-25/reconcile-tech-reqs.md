---
title: "Reconcile — docs/tech-equirements.md vs PRD"
project: web
status: review
created: 2026-05-25
updated: 2026-05-25
verdict: deprecated-call-mostly-defensible-one-minor-gap
---

# Reconcile — `docs/tech-equirements.md` vs PRD

> Pass: confirm DEPRECATED call is defensible. Source: `docs/tech-equirements.md`. Targets: `prd.md`, `addendum.md`.

## TL;DR

The DEPRECATED label is **defensible**. The doc's universally-applicable NFRs (perf, a11y, responsive, no real-time, no push, no-backend) all survived into the PRD with stronger framing. Template-legacy items (Time Engine, Offline-First/Dexie, browser-local-timezone countdowns) were correctly dropped. **One minor gap:** `shadcn/ui + Tailwind CSS` is treated as an implicit assumption in the PRD body — not explicitly enumerated as a stack constraint. Worth a one-line capture.

## Line-by-line check

| tech-equirements.md item | Verdict | Where it lands (or why dropped) |
|---|---|---|
| Performance: <100ms interaction, 60fps | **Carried** | `prd.md` NFR-P2 ("Interaction response <100ms… Animations sustain 60fps"). Verbatim. |
| Offline-First / Dexie.js / IndexedDB | **Correctly dropped** | Template-legacy (todo-app needed local persistence; portfolio doesn't). PRD §10 "Out of Scope" lists "PWA / offline-first — explicitly dropped with Dexie." Appendix A logs the decision. P1 phase explicitly "Remove Dexie + fake-indexeddb." |
| WCAG AA, keyboard nav, screen-reader, `prefers-reduced-motion` | **Carried** | NFR-A1 (WCAG 2.1 AA), NFR-A2 (full kbd nav), NFR-A3 (`prefers-reduced-motion` gates every animation). Stronger than source — adds focus-ring spec, semantic-HTML rule, `<img>` policy. |
| Time Handling: browser-local TZ; countdowns resume | **Correctly dropped** | Template-legacy (countdowns are a todo-app primitive). Portfolio has no time-dependent behavior. |
| Data Ownership: no server, no cloud, no external deps | **Carried (with calibrated exception)** | NFR-SE1 + Appendix A ("`localStorage`-only persistence"). PRD §10 confirms no CMS/analytics-SDK/Three.js. v1 contact form is stubbed; v1.1 wires Resend (acknowledged server-side, scoped). Spirit preserved. |
| No Background Processing / Time Engine | **Correctly dropped** | "Time Engine" is template-specific. No analogue in PRD; XP increments only on user actions (FR-074), which is the spiritual equivalent and is already covered. |
| Next.js (already initialized) | **Carried** | Pervasive in PRD (App Router, `generateStaticParams`, `next/font`, server actions). Addendum §2 documents App Router translation. |
| **shadcn/ui + Tailwind CSS** | **Gap (minor)** | Tailwind is implicit throughout PRD (`focus-visible:ring-1`, `text-muted-foreground`, `border-b-2 border-lime` — all Tailwind utility classes). shadcn/ui is implied by `cmdk` + `sonner` usage. Neither is explicitly named in §6 NFRs or §10. **Recommend:** add a one-line operational constraint, e.g., NFR-O5: "UI primitives via shadcn/ui on Tailwind CSS; no parallel component library." |
| Dexie.js | **Correctly dropped** | Per Appendix A decision log. |
| No real-time backend | **Carried** | NFR-SE1 ("No client-side secrets… contact stubbed in v1"). PRD §10 excludes analytics/CMS/backend. Vercel deploy is static + server-action (v1.1). |
| No push notifications | **Carried (by absence)** | PRD has no push-notification feature surface. XP toasts via `sonner` are in-page only. Implicit but safe — no contradiction. **Optional:** could add to §10 for explicitness; low value since nothing in the PRD suggests them. |
| Browser primary + responsive (mobile/tablet/desktop) | **Carried** | NFR-R1 (mobile-first; sm/md/lg breakpoints; usable <360px). FR-004 (mobile bottom tab bar). FR-020 (mobile waterfall card layout). FR-062 (mobile Sources stack). Stronger than source. |

## Items worth carrying forward that PRD missed

1. **shadcn/ui + Tailwind CSS stack constraint** — see gap above. Single line in §6 (Operational) or §10 negative-form ("No parallel UI library").

## Items the PRD added that source didn't have (sanity check — all defensible)

- Lighthouse ≥95 across all four categories (NFR-P1) — concrete CI gate, source had no such measurable threshold.
- 50KB-gzipped dep approval rule (NFR-P4).
- `transform`/`opacity`-only animation rule (NFR-P5).
- SEO regime (NFR-S1–S4) — entirely absent from source, appropriate for public portfolio.
- Print stylesheet for `/recruiter` (NFR-A6, addendum §6).
- `localStorage` versioned-key scheme (NFR-O4) — replaces Dexie's persistence role at the right scale.

## Verdict

**DEPRECATED label is defensible** with one minor adjustment recommended:

- Add a one-line stack constraint capturing `shadcn/ui + Tailwind CSS` (currently load-bearing but un-stated). Suggested home: §6 Operational as **NFR-O5**, or §10 as a negative ("No parallel UI library beyond shadcn/ui + Tailwind").

All Time-Engine / Offline-First / Dexie / countdown-resume content was template-legacy and is correctly excluded. Performance, a11y, responsive, no-real-time-backend, and no-push are all carried into the PRD with equal or stronger framing.

No architectural changes required. One-line edit at most.
