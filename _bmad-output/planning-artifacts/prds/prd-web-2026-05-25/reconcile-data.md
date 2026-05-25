---
title: "devtools://hossam PRD — Data Reconciliation Report"
project: web
status: review
created: 2026-05-25
updated: 2026-05-25
reviewer: data-reconciliation pass
sources:
  - file:lib/data/index.ts
  - file:_bmad-output/planning-artifacts/prds/prd-web-2026-05-25/prd.md
  - file:_bmad-output/planning-artifacts/prds/prd-web-2026-05-25/addendum.md
---

# devtools://hossam — PRD Data Reconciliation

> Sanity check of PRD §7 + Addendum §1 against the actual `lib/data/index.ts` source. Verifies counts, schema coverage, dedup logic, case-study picks, mock-risk, and any missed content categories.

---

## 1. Inventory Verification (PRD §7.1)

Recounted every entry in `lib/data/index.ts` (excluding commented-out blocks):

| Claim in PRD §7.1 | Actual count | Verdict |
|---|---|---|
| 4 companies, 8 nested projects | Buguard (2), MasheedGate (1), Inovola (4), Besteam (1) = **4 / 8** | ✓ correct |
| 3 freelance, 4 projects | PickPath/Commute (1), Grand Community (2), Alsakn (1) = **3 / 4** | ✓ correct |
| 2 side-project groups | Eazy.To (1), Trend.coupons (1) = **2 / 2** | ✓ correct |
| 22 flat projects | Uncommented entries in `const projects` = **22** | ✓ correct |
| 28 skills across 3 tiers | Main=20, Basics=3 (Node, MongoDb, React-Native), Tools=5 = **28** | ✓ correct |

**Verdict: §7.1 inventory is accurate.** No discrepancies. Commented-out entries (Graphic Designer / Codv Academy / Maham / BeStore / Angular / Anime.js / Strapi CMS) correctly excluded.

One nuance the PRD glosses over: skills are tagged with a numeric `level` (1 or 2). All 20 Main skills are level=1 except `GraphQl` and `Firebase` which are level=2 (despite living in the "Main skills" group). The addendum's tier mapping (`level=1 → primary`, `level=2 → secondary`) is sound, but **GraphQl and Firebase need their group overridden** — they should land in `secondary` even though the legacy file groups them under "Main." Without an override, the migration script will produce `tier: "primary"` based on group and contradict the level signal. **Action: migration should key off `level`, not `group`.**

---

## 2. Schema Coverage vs. Legacy Field Types (Addendum §1)

Cross-checked every field present in `lib/data/index.ts` against the proposed Zod schemas.

### 2.1 Fields that map cleanly

| Legacy | Schema target | Status |
|---|---|---|
| `experience[].title` / `.company` / `.date` / `.img` | `ExperienceSchema.{title, company, start/end, (drop img)}` | OK — `date` parse documented |
| `experience[].projects[].{title, description, date, skills, roles}` | flattened into `ProjectSchema.{name, problem, year, stack, (role)}` | OK |
| `projects[].{title, description, image, tags, links.{preview, code, design}}` | `ProjectSchema.{name, problem, (drop image), stack, links[]}` | OK |
| `skills[].{title, img}` per group/data | `SkillSchema.{name, tier}` | OK (with §1 caveat above) |

### 2.2 Legacy fields the schema does NOT represent (gaps)

1. **`experience[].img` (company logo path).** Schema drops it. But Recruiter Mode (FR-102) shows experience entries — a company logo strip would be natural. **Risk: low.** Recommend adding optional `Experience.logo: z.string().optional()` for future-proofing without blocking v1.

2. **`experience[].projects[].roles[]` (array of bullet strings).** The mapping table lumps `description` into `problem` + `role` but says nothing about the existing `roles[]` array. This is the most concrete real-content the legacy data has — losing it means losing actual role-summary bullets that are migration-ready. **Risk: medium.** The migration mapping table (Addendum §1.2) misses this field entirely. **Action: add a row `experience[].projects[].roles[]` → `Project.outcomes[]` OR a new `Project.responsibilities[]` field.** Even if it lands in `outcomes[]` as a stop-gap, do not drop it silently.

3. **`projects[].image` (gallery thumbnail path).** Addendum says "drop, replaced by per-slug OG generated at build." That's defensible for OG meta, but the `/work` waterfall and the `/recruiter` 6-card layout (FR-102) will likely want a thumbnail. Pre-existing `/images/projects/*.{png,jpg}` assets are valuable. **Risk: low–medium.** Recommend keeping `Project.thumbnail: z.string().optional()` even if OG is generated separately. Dropping all 22 thumbnails to regenerate OG-only is wasteful.

4. **`projects[].links.design` (Behance / design URL).** Schema's `ProjectLinkSchema.label` enum is `["live", "code", "design", "case-study"]` — `design` is included, good. ✓ No gap.

5. **`skills[].img` (logo path per skill).** Addendum says "drop, replaced by Iconify-style refs." Reasonable, but worth confirming Iconify covers all 28 (notably `Vue Query`, `SWR`, `Vuetify`, `Adobe XD`, `Postman` — most should exist but `Vue Query` may not). **Risk: low.** Validate during P1.

6. **`experience[].date` "Full-Time: Apr. 2021 - sep. 2022" (Inovola has a prefix label).** The parsing rule "Jun. 2023 - present → 2023-06 / null" doesn't account for the "Full-Time: " prefix on Inovola's entry. Migration parser must strip leading labels before regex matching. **Risk: low (one-line fix), but easy to miss.**

7. **Top-level grouping: `experience` vs `freelance` vs `sideprojects`.** The legacy data has three distinct lists with different semantics. The schema's `Experience.employmentType` enum `["full-time", "contract", "freelance"]` covers `experience` and `freelance`, but `sideprojects` doesn't fit. **Action: extend enum to `["full-time", "contract", "freelance", "side-project"]`** OR introduce `Experience.kind: "employment" | "side"`. The Addendum's enum is too narrow.

### 2.3 Schema features the legacy data doesn't justify

- `Project.featured: boolean` — sensible for v1 6-pick logic, no legacy equivalent. OK.
- `Project.meta.mock: boolean` — author intent, no legacy equivalent. OK.
- `Project.statusCode` (200/201/410) — pure metaphor authoring, no legacy field. OK.
- `Project.method`, `size`, `sizeWeight`, `timeWeight`, `startOffset` — all metaphor authoring. OK.

**Net: schema is fundamentally adequate. Three real gaps (`roles[]`, `image`, `sideprojects` enum), plus one minor (`experience.img`).**

---

## 3. Dedup Approach (Addendum §1.3)

Stated algorithm:
1. Collect every unique project name across both sources.
2. Prefer experience-nested entry (has dates + role context).
3. Merge tags/stack, links, image from flat entry.
4. Assign kebab-case slug.

### 3.1 What's sound

Name-based union + nested-preferred + merge tags-from-flat is the right approach. Good.

### 3.2 Cases the algorithm misses or risks

1. **Name normalization is non-trivial.** Examples that should dedup but won't if you string-equality match:
   - `"Eazy.To"` (sideprojects parent) vs `"Website and Dashboard"` (its nested project title) vs `"Eazy.to"` (flat projects). **Three different strings, one project.** The dedup will collect three separate slugs (`eazy-to`, `website-and-dashboard`, `eazy-to`) unless the algorithm matches on the **parent company/group name** for sideprojects/freelance, not the nested project title.
   - `"Buguard Dashboards"` (nested) vs `"Buguard"` (flat) — different names. The flat entry is actually the Buguard *landing page* (URL: buguard.io), not the dashboards (which are internal). These are **two distinct projects** that the dedup would correctly *not* merge, but the addendum's logic implies it might try.
   - `"Buguard and DarkAtlas Landing Pages"` (nested, one entry) covers what flat has as `"Buguard"` + `"Dark Atlas"` (two entries). One legacy entry → two final entries. **The dedup doesn't handle 1→N splits.**
   - `"E-commerce Website Development "` (note trailing space) vs `"Masheed Gate"` — same project, totally different names. Pure string match fails.
   - `"Dashboard"` (PickPath freelance nested) vs `"Commutrics Dashboard"` (flat) — different names, same project. Needs human judgment.
   - `"Whatsapp pro"` (Grand Community nested, lowercase p) vs `"Whatsapp Pro"` (flat) — case differs.
   - `"GC Website"` (nested) vs `"GC Dashboard"` (flat) — descriptions hint these may be distinct ("main website" vs "Dashboard app") but they're both Grand Community. Likely two projects, not a dedup.
   - `"BuilderZ Project"` vs `"BuilderZ"` — trailing word.
   - `"Alsakn Project"` vs `"Alsakn"` — same.

   **Action: the dedup algorithm needs a manual lookup table, not pure name matching.** Recommend authoring a `mergeMap.ts` file: `{ legacyKey: canonicalSlug }` that the migration script consumes. Mechanical name-match alone will produce wrong results in 6+ of 22 cases.

2. **Side-project parent vs child naming.** Sideprojects and freelance entries have a *company-style* parent (`"Eazy.To"`, `"Grand Community"`, `"The Pick Path Group (USA)"`) and a *project-style* child (`"Website and Dashboard"`, `"GC Website"`, `"Dashboard"`). The flat `projects[]` uses the parent's name (`"Eazy.to"`, `"GC Dashboard"`, `"Commutrics Dashboard"`). The dedup pass needs to know **which level is the project** — for sideprojects, it's the parent; for `experience`, it's the child. This is a semantic inversion the addendum doesn't acknowledge.

3. **Projects in flat list with no experience anchor** (the 12 "early-career" entries: BEAcademy, Tahakoom, Genwin app, WRO Competions, Shortly, Foodery Mobile view, Slacky, Alakeel, Motamd, TVFLIX, Discord Clone, AwnBank). These exist only in the flat list. The dedup's step 2 ("prefer nested") doesn't apply — they have no nested counterpart. The migration must assign these to a synthetic experience (likely Besteam, or "Pre-Besteam / Self-taught") or accept that `Experience.projectSlugs[]` will not reference them. **Action: clarify whether `Project` entries can exist without an `Experience.projectSlugs[]` reference.** Recommend yes (add to `Project.org: "Self / Learning"` or similar).

4. **`experience[].projects[]` with `title: "Projects"` (Besteam entry, line 86)** — generic placeholder name, not a real project name. The dedup will create a `projects` slug. **Action: rename during migration to `"Saudi Robotics / STEAM Competitions"` (from its description) or treat as the Besteam role summary rather than a project entry.**

5. **The `roles[]` array on nested projects gets lost in dedup.** Step 3 says "merge tags/links/image from flat" but doesn't say "preserve roles[] from nested." Since flat has no `roles[]`, the merge is a no-op for that field — but the dedup logic should explicitly state "nested fields like `roles[]` and `date` survive untouched."

**Net: the dedup approach is directionally right but underspecified for 6+ real cases. Strongly recommend a manual mapping file rather than algorithmic name-matching.**

---

## 4. Case-Study Picks (PRD §7.3, OQ2)

Proposed default v1 six: **Buguard Dashboards, Dark Atlas, MasheedGate, Commutrics, BuilderZ, Eazy.to.**

### 4.1 Strength of existing data per candidate

For each legacy candidate, I measured: (a) presence of `description` text, (b) presence of `roles[]` bullets, (c) presence of tech stack, (d) presence of a live `links.preview` URL, (e) presence of a stable image asset.

| Candidate | desc | roles[] | stack | live URL | image | Real-content density | Mock % needed |
|---|---|---|---|---|---|---|---|
| Buguard Dashboards | ✓ (1 sentence, recycled from Dark Atlas) | ✓ (1 bullet, generic) | ✓ 6 items | ⚠ no separate URL (internal) | ✓ | **Low** (description is wrong — it's Dark Atlas copy) | ~80% mock |
| Dark Atlas | ✓ (1 sentence, accurate) | none directly (the experience entry covers "Buguard and DarkAtlas Landing Pages") | ✓ 9 tags | ✓ darkatlas.io | ✓ | **Medium** | ~70% mock |
| MasheedGate (E-commerce) | ✓ (1 sentence) | ✓ 2 bullets (DDD + Monorepos — concrete!) | ✓ 7 items + GraphQL | ✓ masheedgate.com | ✓ | **High** for nested; **High** for flat. Combined = best-stocked entry in the dataset. | ~50% mock |
| Commutrics (PickPath) | ✓ (1 sentence) | ✓ 1 bullet (generic "all the frontend") | ✓ 4 items | ⚠ `/videos` placeholder, no real URL | ✓ | **Low–Medium** | ~75% mock |
| BuilderZ | ✓ (1 sentence) | ✓ 1 bullet (generic "leading development") | ✓ 4 items | ✓ brz-test.herokuapp.com (likely dead) | ✓ | **Low** | ~80% mock |
| Eazy.to | ✓ (1 sentence, self-described as bit.ly clone) | ✓ 1 bullet (generic) | ✓ 5+items incl. Node/Express/Mongo (full-stack!) | ✓ eazy.to | ✓ | **Medium** (full-stack story is a real differentiator) | ~70% mock |

### 4.2 Alternative candidates the PRD doesn't list

Stronger or comparable candidates that PRD missed:

- **Zrealtors** (Inovola nested). Has 2 concrete `roles[]` bullets ("build main architecture", "help the team with blocking tasks") — that's senior-level scope language already authored. Live URL not in data but the project name suggests one exists. **Worth a swap consideration vs. BuilderZ.**
- **Tamincom Refactor** (Inovola nested). Has a concrete `roles[]` bullet ("Played a pivotal role as the primary frontend developer for a Car Insurance Website") and was a Vue→Vuetify→TS migration — a *refactor* case study is rare and credible. **Strong PUT (refactor) method candidate.** PRD's method mapping (FR-021) literally lists PUT = refactor/rewrite — Tamincom is the cleanest fit for the entire dataset, and the PRD misses it.
- **Tahakoom / WRO Competions** (flat only). Both have `links.design` to Behance — the only entries in the entire dataset with design portfolio links. Recruiters/EMs interested in design-savvy seniors would value this. They're old (pre-2019), but as **archived/410** entries they could ship the "I also do UI/UX" signal without case-study writing pressure.
- **Whatsapp Pro** (Grand Community). Has a unique angle (internal chat tool over WhatsApp) and a real story. But marked `links.preview: "/videos"` — no live URL. **Skip for case study, keep in waterfall.**

### 4.3 Recommended v1 six (revised)

Sorted by real-content density first, novelty/diversity second:

1. **MasheedGate** — highest density, DDD/monorepo concrete decision, live URL, GraphQL. **Keep.**
2. **Eazy.to** — full-stack solo project, Node+Mongo, real differentiator. **Keep.**
3. **Dark Atlas** — flagship Buguard product, current employer, live URL. **Keep** (over "Buguard Dashboards" — better data).
4. **Tamincom Refactor** — *replaces BuilderZ*. PUT/refactor method gives waterfall variety; concrete senior-IC framing. The dataset's strongest "refactor case study" candidate.
5. **Zrealtors** — *replaces Commutrics*. Has architecture-leadership roles bullets already authored; Vue/Nuxt diversity (most other picks are React).
6. **Buguard Dashboards** OR **Commutrics**. Both are weak on data. Pick Buguard Dashboards if current-employer signaling matters (it does for OQ2 reasoning). Otherwise Commutrics for SaaS-dashboard variety.

**If keeping the PRD's original six** for the existing-data-strongest argument, that's defensible — but rank order by density should be: MasheedGate (strongest) → Eazy.to → Dark Atlas → Buguard Dashboards → Commutrics → BuilderZ (weakest). PRD's text orders them by company prominence, which is a different optimization.

---

## 5. Mock-Risk Flags (PRD §7.4)

Projects where >75% of the case study would be `[ASSUMPTION]` mock content if shipped today:

| Project | Risk | Reason |
|---|---|---|
| **Buguard Dashboards** | HIGH | Description is *literally a copy-paste of Dark Atlas's description* (line 10). `roles[]` has one generic bullet. No public URL (internal dashboard). Case study would need ~80% authored decisions/outcomes from Hossam's memory. |
| **BuilderZ** | HIGH | One generic `roles[]` bullet ("leading development"). Live URL is a herokuapp.com link likely dead. Stack is 4 items. No retained metrics. ~80% authoring required. |
| **Commutrics** | HIGH | One generic bullet ("Responsible for all the frontend part"). `links.preview: "/videos"` (no real live URL — videos in `/public` per data). Description is generic SaaS copy. ~75% mock. |
| **Dark Atlas** | MEDIUM-HIGH | Description is one accurate sentence. No `roles[]` for the standalone product (the nested entry conflates DarkAtlas with Buguard landing). Live URL exists. ~70% mock. |
| **Eazy.to** | MEDIUM | One generic role bullet, but full-stack scope makes the story write itself — Hossam knows this project cold (it's a side project he owns end-to-end). ~60–70% mock but easiest to fill. |
| **MasheedGate** | LOW-MEDIUM | Has 2 concrete `roles[]` bullets (DDD, monorepos) — that's the most pre-written decision rationale in the dataset. ~50% mock. |

**Flagged as risky v1 picks: Buguard Dashboards, BuilderZ, Commutrics.** Three of the six proposed defaults are >75% mock. That means ~30 hours of writing in P4 (PRD says 12 hr for the whole phase). **The Week-2 P4 estimate (12 hr) is materially underbaked.**

**Recommendations:**

1. Swap **BuilderZ → Tamincom Refactor** (already has a credible refactor bullet + has Vue/Vuetify/TS stack — adds language diversity).
2. Swap **Commutrics → Zrealtors** (has architecture-leadership bullets already authored, reducing mock %).
3. Keep Buguard Dashboards only if Hossam can author from memory inside Week 2 — otherwise demote to waterfall-only and promote **Whatsapp Pro** (has a unique tool-on-top-of-WhatsApp angle) OR keep at 5 case studies for v1.
4. Alternative: drop the count to **4 case studies for v1** (MasheedGate, Eazy.to, Dark Atlas, Tamincom) and add 2 more in v1.1. This is consistent with PRD's "ship fast, iterate" principle and prevents the launch from blocking on writing.

---

## 6. Missed Content Categories (PRD §7)

Reread `lib/data/index.ts` end-to-end for anything the PRD's content strategy didn't account for.

### 6.1 Categories the PRD correctly identifies

- Experience ✓
- Freelance ✓
- Side projects ✓
- Flat projects gallery ✓
- Skills (tiered) ✓

### 6.2 Categories that are NOT in the legacy data (PRD correctly notes as "must be authored")

- Profile (name, email, location, tagline, socials, principles, metrics) — **not in legacy.** PRD §7.2 correctly flags. ✓
- Per-project case study fields (problem/role/decisions/outcomes) — **not in legacy.** ✓
- Resume PDF — not in source. ✓

### 6.3 Categories I checked but confirmed absent (so PRD did NOT miss them)

- **Education / degree / university.** Not in `lib/data/index.ts`. The commented-out `Graphic Designer / Freelance / 2015 - Sep 2019` (line 95) hints at a pre-FE career, but no education record exists. PRD silent on education — fine, but worth a Profile addition (`Profile.education: string` or skip per OQ7 framing).
- **Certifications.** Not in the data. PRD silent — fine.
- **Languages spoken.** Not in the data. PRD silent — fine for v1, but Recruiter Mode (FR-102) typically expects this for international roles. **Recommend adding `Profile.languages?: Array<{name, level}>` to schema as optional.**
- **Awards / recognitions.** Not in the data.
- **Talks / publications.** Not in the data. PRD §FR-060 mentions `articles/` and `talks/` as "Coming soon" placeholders, so this is acknowledged. ✓
- **Testimonials / references.** Not in the data. Common in senior portfolios — worth noting as v1.1 candidate.
- **Photo.** Not in `lib/data/index.ts` (the `/images/companies/*.{png,jpg}` and `/images/projects/*.{png,jpg}` are company/project logos, not a profile photo). OQ5 correctly flags. ✓

### 6.4 Categories lurking that I almost missed

- **Company logos** (`/images/companies/buguard.png`, `masheed.png`, `inovola.jpg`, `besteam.png`, `commute.jpg`, `grand.png`, `alsakn.jpg`, `eazyto.png`, `trendcoupons.png`). **Eight company-logo assets exist.** The migration mapping table doesn't preserve them (`experience[].img` not in the mapping). For Recruiter Mode (FR-102), a logo strip across experience cards is conventional and the assets are already there. **Action: preserve as `Experience.logo: string` (optional).**
- **Project images** (`/images/projects/*.{jpg,png}`) — 22 of them. Already noted in §2.2 above.

### 6.5 Net

PRD §7 content strategy did not miss any major category. Two minor preservation oversights (company logos, project thumbnails), one schema-narrowness gap (employmentType doesn't cover side-projects), one lost field (`roles[]`). All correctable in the migration script; none architectural.

---

## 7. Summary of Required Changes

Ranked by priority. Block launch on items 1–4; address items 5–8 during Phase 1 migration.

### Block-launch (must fix in PRD / addendum before P1)

1. **Add `roles[]` mapping row** to Addendum §1.2 — preserve concrete role bullets, don't drop them silently.
2. **Extend `Experience.employmentType` enum** to include `"side-project"` (or add a `kind` field) — current schema can't represent the `sideprojects[]` legacy bucket.
3. **Replace the dedup algorithm with a manual mapping file** (`migrationMergeMap.ts`). Pure name-matching fails for 6+ real cases (MasheedGate vs "E-commerce Website Development", Eazy.To parent vs "Website and Dashboard" child, Whatsapp Pro casing, BuilderZ vs "BuilderZ Project", etc.).
4. **Acknowledge the 1→N split** for "Buguard and DarkAtlas Landing Pages" (one legacy nested entry → two final Project entries) in Addendum §1.3.

### High-priority (do during P1, not architectural)

5. **Re-evaluate case-study six** per §4. Swap at least BuilderZ→Tamincom Refactor and consider Commutrics→Zrealtors to reduce mock burden. Or drop count to 4 for v1.
6. **Skills tier mapping should key off `level`, not `group`** — GraphQl and Firebase are Main-grouped but level=2.
7. **Preserve `experience[].img`** (company logos) as optional `Experience.logo`.
8. **Preserve `projects[].image`** (project thumbnails) as optional `Project.thumbnail`. Even if OG images are dynamically generated, in-page thumbnails for waterfall/Recruiter cards are valuable.

### Nice-to-have (defer to v1.1)

9. Optional `Profile.languages[]` for Recruiter Mode internationalization signal.
10. Optional `Profile.education` for completeness (OQ7 already partially covers this).
11. The Inovola "Full-Time: Apr. 2021 - sep. 2022" date-string prefix needs a parsing accommodation — note as a one-line fix in the migration script.

---

## 8. Final Verdict

- **§7 inventory (PRD):** Accurate. No count errors. ✓
- **§1 schema (Addendum):** Adequate but has **3 real gaps** (`roles[]`, `sideprojects` enum, company logos) and **1 minor** (skill tier source-of-truth). ⚠
- **§1.3 dedup:** Directionally right, **mechanically wrong** for ~6 cases. Needs a manual mapping file, not pure name-match. ⚠
- **Case-study six:** Picked by company prominence, not by data density. **3 of 6 are >75% mock** — that's a hidden cost the Week-2 estimate doesn't budget. ⚠
- **Mock-tag approach:** Sound in concept. The CI grep gate is fine but the *content authoring* burden is underestimated. ⚠
- **Missed content categories:** None major. Minor asset-preservation oversights only. ✓

Net: the PRD is structurally sound and the addendum's migration plan is mostly complete. The most impactful corrections are (a) preserve `roles[]`, (b) hand-author the dedup mapping, (c) re-rank the case-study six against actual data density. Everything else is sub-hour fixes during P1.
