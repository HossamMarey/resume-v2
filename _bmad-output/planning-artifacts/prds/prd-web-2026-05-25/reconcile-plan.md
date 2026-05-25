# Reconciliation: docs/plan.md vs PRD

## Verdict
High-fidelity capture of mechanics and IA, but the PRD's FR-table format silently flattened several signature qualitative phrasings (boss-level form feel, "computed styles" reveal, scan-friendly recruiter framing) that gave the original plan its character — important-but-fixable gaps.

## Gaps (2-5 items)

- **Item:** Contact form as a "boss level" — terminal-prompt typing, validation framed as **test cases passing**. The plan's whole point is that the form *feels like fighting a terminal boss*: typed-out prompts, sequential field reveal, success/fail as test output.
  - **Where in plan.md:** Line 16, "G10 — Contact form as a 'boss level': typed-out terminal prompts, validation framed as test cases passing" and Line 45, "Contact = G10 boss-level form."
  - **PRD coverage:** partial — FR-070 captures the test-pass mechanic (`✓ email format`) but the framing as a *boss fight* (climactic, sequential, dramatic) is gone. There's no language about pacing, drama, typed-out animation, or "the form is the showcase" payoff. The PRD reads like a normal multi-step form with cute validation labels.
  - **Risk if dropped:** medium-to-high — this is one of two named "signature" interactions (alongside the Console REPL). If the dev implements FR-070 as written, they'll build a polite form with checkmarks, not a boss fight. The "Hossam-ness" of the artifact deflates.
  - **Suggested fix:** Add a UX-intent paragraph under F8 (before FR-070) along the lines of: *"This is the showcase interaction of the site. Treat it like a terminal boss fight: fields reveal one at a time with a typewriter animation on the prompt label; validation runs as you type and renders as Jest-style passing/failing test output; the final submit feels like 'all tests green, ship it.' Pacing matters more than speed — let each step land."* Then reference it from FR-070.

- **Item:** "Inspect me" CTA + **scroll-triggered "computed styles" panel** revealing principles. The plan describes the Elements page as having a *scroll-revealed inspector pane* showing principles as if they were computed CSS — a small but on-metaphor flourish.
  - **Where in plan.md:** Line 37, "scroll-triggered 'computed styles' panel revealing principles (performance, a11y, DX, mentorship)."
  - **PRD coverage:** partial — FR-011 captures the principles content as a "marquee of cards" but loses the *computed-styles panel* metaphor. A marquee of cards is generic; a computed-styles inspector panel is the DevTools metaphor doing actual work.
  - **Risk if dropped:** medium — the Elements tab is the landing page and the metaphor's first impression. A generic card marquee weakens the "the site behaves like DevTools" thesis immediately.
  - **Suggested fix:** Rewrite FR-011 so principles render as a styled-like-DevTools "Computed" panel (property: value rows, e.g., `performance: feature;`, `accessibility: non-negotiable;`), scroll-revealed below hero. Marquee can stay for the *stack* (FR-012) where it makes sense.

- **Item:** Recruiter-mode tone — "**scan in 30 seconds**" + "**clean editorial single-scroll resume**." The plan is explicit that Recruiter Mode is editorial in feel, not just "chrome removed." It's a tonal pivot, not a CSS toggle.
  - **Where in plan.md:** Line 17, "so recruiters can scan in 30 seconds" and Line 47, "No gamification, no chrome. Just: photo, headline, 3 bullets…"
  - **PRD coverage:** partial — FR-102 lists the *structural* elements but the editorial *feel* (calm, typographic, scan-optimized, almost a Substack-essay vs. an app screen) is not articulated. P1 persona has a "30–90 second" scan but the route spec doesn't carry that tonal brief.
  - **Risk if dropped:** medium — without the editorial direction, FR-102 reads as "same components, fewer of them" and could end up looking like a stripped-down dashboard, not a magazine-style resume.
  - **Suggested fix:** Add a one-line tonal directive at the top of F12: *"Recruiter Mode is editorial, not utilitarian — think a long-form profile on a magazine site (Stratechery, The Verge feature). Generous line-height, single-column, restful. The DevTools metaphor does not appear; this is the calm room."*

- **Item:** Console REPL **personality** — the plan implies the REPL has voice (e.g., the `theme light` rejection. The PRD captured that one line literally — *"Site is dark-only. The vibe is intentional."*) but does not establish that the REPL *generally* has voice/personality across its responses.
  - **Where in plan.md:** Line 14, command set framed as a "real mini-REPL" — the plan's broader gamification framing implies the REPL has character, not just function.
  - **PRD coverage:** partial — FR-042 captures commands as data transforms; only the `theme light` response has voice. `whoami`, `projects`, `help`, `experimental` outputs aren't characterized.
  - **Risk if dropped:** low-to-medium — easy to recover later, but if the dev implements FR-042 deadpan, the REPL becomes a directory listing, not a conversation.
  - **Suggested fix:** Add a sentence under F5: *"REPL outputs have voice — terse, slightly dry, occasionally self-aware (see `theme light` for the register). Hossam-authored copy on every command output; no Lorem placeholders ship."*

- **Item:** **"Generous monospace gutters"** + **"hairline 1px borders, no rounded corners above 6px"** — the plan's visual-feel directives are specific and load-bearing for the aesthetic.
  - **Where in plan.md:** Line 8, "Hairline 1px borders, no rounded corners above 6px, generous monospace gutters."
  - **PRD coverage:** missing in PRD body — pushed entirely to `docs/design-system.md` (referenced but not quoted). The PRD inherits the design system by reference but never re-asserts these specific shape rules where a reader would see them.
  - **Risk if dropped:** low — design-system.md exists and is marked CANONICAL, so this is more a redundancy/visibility concern than a true gap. A dev reading only the PRD might use `rounded-lg` or `border-2` and not notice.
  - **Suggested fix:** Fine to omit from PRD body if design-system.md is enforced via pre-commit/review. Otherwise, add a brief "Visual non-negotiables" callout near §5 referencing: hairline borders, ≤6px radius, monospace gutters, dark-only.

## Notes (anything not a gap but worth flagging)

- **Stack mismatch is intentional but jarring on first read.** plan.md specifies TanStack Start + TanStack Router + Tailwind v4 + `motion/react`. The PRD specifies Next.js 16 App Router + `next/font` + Vercel zero-config. The addendum §2 documents the translation cleanly, but the PRD body itself never flags "we changed framework from the plan." A one-line note in PRD Appendix A decision log ("Migrated from TanStack to Next.js App Router on 2026-05-25 — see addendum §2") would close the loop for any reviewer reading the PRD cold.
- **Plan's "Open question" about contact-form wiring** (line 93) is correctly resolved in PRD as stubbed-v1 / Resend-v1.1 — good capture, no gap.
- **Build phases reorganized.** Plan has 7 phases in a specific order (Foundation → Elements/Perf/Sources → Network → Console+Palette+Konami → XP+Recruiter → Contact → SEO/A11y). PRD §8 collapses these into 7 phases over 3 weeks with effort estimates — equivalent coverage, slightly different grouping. No gap.
- **Konami unlock visual feedback** — plan says "a lime glow on the chrome" (line 54). PRD FR-082 captures this as "lime glow pulse on chrome" — verbatim. Good.
- **XP cap at 100** — captured (FR-075). Idempotence captured (FR-075 + addendum §4.2). Property tests captured. This is the most thoroughly upgraded section in the PRD vs. the plan.
- **`prefers-reduced-motion`** — captured exhaustively (NFR-A3, FR-076, FR-077, FR-093). Stronger than the plan.
- **Mobile chrome (bottom tab bar)** — captured (FR-004, NFR-R2). Good.
- **The "feel" budget is what's at risk, not the feature budget.** Every mechanical feature from plan.md is present somewhere in PRD+addendum. What's at risk is the *tone* — a dev could ship every FR and still produce something that doesn't feel like the plan's vision. The gaps above all cluster around that single concern.
