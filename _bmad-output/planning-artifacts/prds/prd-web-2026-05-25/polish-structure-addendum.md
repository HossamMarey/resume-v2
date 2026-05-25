## Document Summary
- **Purpose:** PRD depth-doc — content-migration spec, design tokens, rejected alternatives, technical patterns consumed by downstream AI agents (architecture, implementation).
- **Audience:** AI implementation agents (primary); Hossam (secondary).
- **Reader type:** llm
- **Structure model:** Reference/Database (random-access depth-doc; sections are MECE depth pockets the PRD body links into).
- **Current length:** ~3,526 words across 9 top-level sections (§0, §1, §2, §3, §4, §5, §6, §7, §8a, §9 — note: §8 is skipped; §8a stands alone).

## Recommendations

### 1. QUESTION — §8a numbering ("8a" with no §8)
**Rationale:** The "a" suffix implies a sibling §8 that does not exist in this file; for an LLM doing random-access reads, the missing anchor is a small but real ambiguity ("is §8 elsewhere?"). Either renumber to §8, or add a one-line note explaining why "8a" (e.g., "§8 reserved for future XYZ; departures landed first as 8a").
**Impact:** ~0 words (rename) or +10 words (footnote).
**Comprehension note:** Removes a referential hiccup for downstream agents resolving cross-doc anchors.

### 2. MOVE — §0 Design Tokens placement is correct; PRESERVE before §1
**Rationale:** User flagged ordering. For a Reference/Database depth-doc consumed by LLMs, dependency-first ordering applies: §1's `meta.mock`, the aesthetic mention of "Computed-styles cell idiom," and §6's print stylesheet all reference token names (`--lime`, `--hairline`, `--background`, `--surface`). Defining the token vocabulary first is correct. Keep §0 → §1 order.
**Impact:** 0 words (no change recommended; explicit PRESERVE).
**Comprehension note:** Reordering would create forward references for the implementation agent.

### 3. CONDENSE — §0.3 aesthetic non-negotiables item #3 (Computed-styles cell idiom)
**Rationale:** The HTML snippet (lines 118–123) re-states an implementation pattern that PRD body line 443 already names (`bg-hairline` outer + `gap-px` + `bg-surface` children) and that PRD §5.0 anchors. Keep the snippet (LLM grounding per skill's "STILL PROVIDE EXAMPLES" rule) but cut the prose enumeration of use sites ("Use this for: principles panel on `/`, case-study Decisions/Outcomes sections, sources file-tree right pane, REPL output blocks") — those targets live in the PRD body's FRs and risk drifting out of sync. Replace with one line: "Use sites enumerated in PRD §5."
**Impact:** ~35 words.
**Comprehension note:** Eliminates a second source-of-truth for which surfaces use the idiom.

### 4. CONDENSE — §1.3 dedup-pass narrative around `legacyMapping`
**Rationale:** The 25-line code block (lines 275–300) is exemplary, not exhaustive; the trailing comment `// ... (~30 rows total)` already signals the shape. The "**Why hand-authored:**" paragraph (lines 312–313) restates the rationale already given at lines 273–274 ("**The dedup is therefore not algorithmic. It is a hand-authored mapping table**"). Cut the "Why hand-authored" paragraph — it's a recap, and for an LLM reader the first statement is sufficient.
**Impact:** ~55 words.
**Comprehension note:** True redundancy per skill principles; the rationale is identical, not reinforcement.

### 5. CONDENSE — §4.1 XPEvent code block + §4.2 idempotence code block overlap
**Rationale:** Both blocks define `emitXP`; §4.2 redefines it with an early-return guard. Downstream agents reading sequentially will see two competing signatures. Merge: show the §4.1 bus skeleton once, then §4.2 shows only the **delta** that adds the VISIT_REASONS guard (e.g., "Extend `emitXP` in §4.1 with:" + the if-block only). Saves ~15 lines.
**Impact:** ~80 words.
**Comprehension note:** Eliminates a divergent reference implementation; reduces LLM hallucination risk on which version is canonical.

### 6. CUT — §0.2 type-scale prose list (lines 105–108)
**Rationale:** The five-bullet type scale is Tailwind utilities, not CSS tokens — the §0.2 heading is "Typography tokens" but the bullets are usage. Either (a) move the bullets to a new sub-section §0.2.1 "Type-scale utilities" to keep §0.2 strictly token-defining, or (b) cut and let component implementations pick utilities case-by-case (the PRD body already specifies hero/section/body typography intent at a higher level). Recommend (a) — move, don't cut, because the `clamp()` value for Hero H1 is load-bearing.
**Impact:** 0 net words; cleaner section-purpose boundary.
**Comprehension note:** Sharper MECE separation between tokens (defined once) and utility recipes (applied per surface).

### 7. PRESERVE — §3 Rejected alternatives
**Rationale:** Five rejection records (View Transitions, MDX, CMS, WebGL, i18n) — none are redundant with the PRD body, which only references decisions, not their alternatives. This is the right home for decision-record content; downstream architecture agents need it when scoping v1.1.
**Impact:** 0 words.

### 8. PRESERVE — §8a spec departures table
**Rationale:** Tabular format is ideal for LLM consumption; each row is MECE; the closing line ("Any future departure from `docs/design-system.md` should add a row here with the same shape") gives the section a clear ownership rule. Keep as-is aside from the numbering question (rec #1).
**Impact:** 0 words.

### 9. QUESTION — §7 Resume PDF generation single-paragraph section
**Rationale:** §7 is two short paragraphs (~75 words) and could either (a) merge into §6 Print stylesheet (both concern paper output), or (b) remain standalone. For an LLM Reference/Database doc, standalone is defensible because the section answers a discrete question ("how does the resume PDF ship?"). Author decision.
**Impact:** ~0 words if kept; saves one section header if merged.

### 10. CONDENSE — §9 Vercel deployment notes
**Rationale:** The CSP `vercel.json` block (lines 587–598) plus the closing caveat ("CSP above is permissive starter — tighten before live…") is forward-looking guidance that may not be needed for v1. The user-flagged concern about overly-long code blocks applies here: the JSON is illustrative, not load-bearing for any v1 FR. Consider reducing to a one-sentence pointer ("If/when CSP becomes necessary, add `vercel.json` with a `Content-Security-Policy` header source-wide") and dropping the literal example until needed.
**Impact:** ~60 words.
**Comprehension note:** The CSP string itself is a working example for an LLM — cutting it removes grounding. Soft recommend; keep if v1.1 will reference it.

## Summary
- **Total recommendations:** 10 (2 PRESERVE, 3 CONDENSE, 2 QUESTION, 1 CUT-or-MOVE, 2 with mixed disposition).
- **Estimated reduction if all CONDENSE/CUT accepted:** ~230 words (~6.5% of original).
- **Meets length target:** No target specified; addendum is reference depth-doc and the user signaled "no limit," so density rather than reduction is the goal. Recommendations are about *cleanliness* (numbering, single-source-of-truth, MECE section purpose), not shrinkage.
- **Ordering verdict (user question):** §0 before §1 is correct — keep. §0 defines the token vocabulary §1, §3, §6, §8a all reference.
- **Redundancy verdict (user question):** No material redundancy between addendum and PRD body — PRD body consistently *delegates* to addendum (§0, §1, §6) rather than re-stating. Internal redundancy exists in two spots: §1.3 "Why hand-authored" recap and §4.1↔§4.2 dual `emitXP` definitions (recs #4 and #5).
- **Overly-long code blocks (user question):** §1.3 `legacyMapping` example and §9 CSP `vercel.json` are the two candidates. Both are illustrative and serve LLM grounding; reference-only treatment is defensible only for §9 (rec #10).
- **Comprehension trade-offs:** None of the recommendations sacrifice LLM precision; recs #3, #4, #5 actively *improve* precision by collapsing competing references.
