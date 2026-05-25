---
title: "Migrate lib/data → lib/content with Zod-validated typed models"
type: "refactor"
created: "2026-05-25"
status: "done"
baseline_commit: "d58a15faeee0ff6449139f0c7545d76c33f49773"
context:
  - "{project-root}/_bmad-output/project-context.md"
  - "{project-root}/docs/design-system.md"
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `lib/data/index.ts` (764 lines) is a single untyped default-exported object aggregating 5 heterogeneous arrays (`experience`, `freelance`, `sideprojects`, `projects`, `skills`). It has zero consumers yet, but every future route (Elements/Network/Sources/Recruiter) needs typed, validated content. Design-system.md §13 defines canonical Profile and Project shapes; resolved decision #3 mandates Zod schemas for Profile/Project/Experience/Skill and deletion of `lib/data/index.ts`.

**Approach:** Create `lib/content/{profile,projects,experience,skills,index}.ts`. Each entity file colocates its Zod schema, a `z.infer<>`'d TS type, and a validated data export. Project schema matches design-system §13 verbatim; legacy projects are transformed into the full shape with default-filled rich fields (real authoring deferred to a follow-up content spec). Experience consolidates legacy `experience + freelance + sideprojects` into one collection via a `kind` discriminator. Skills preserve the legacy grouped structure. Profile is authored fresh from user-role memory + design-system §1 tagline. Delete `lib/data/index.ts` once `lib/content` is parse-clean (safe: no consumers).

## Boundaries & Constraints

**Always:**

- All schemas Zod-defined; TS types derive via `z.infer<typeof Schema>`. No hand-written parallel interfaces (project-context Language Rules).
- Each entity file exports: `<Entity>Schema` (zod), `<Entity>` (z.infer type), `<entityCollection>` (validated data).
- Project schema fields match design-system.md §13 verbatim — all rich fields present, none omitted.
- All data is `Schema.parse(rawData)`-validated at module load — fail fast on schema drift, fail the build.
- Experience uses kind discriminator `'fulltime' | 'freelance' | 'side'`.
- `lib/content/index.ts` re-exports schemas + types + data so consumers import from one place: `import { projects, type Project } from '@/lib/content'`.

**Ask First:**

- Profile field values (location, exact socials, principles wording, metric numbers) — drafted from memory; you sign off at CHECKPOINT 1.
- Authoring rich project content (real `decisions`/`outcomes`/`problem` narratives, per-project `method` mapping, real `year`/`sizeWeight`/`timeWeight` numbers) — explicitly OUT of scope; follow-up spec.
- Removing `lib/utils/validation.ts formatZodError` — keep; useful for parse-error formatting if a future schema fails.

**Never:**

- Don't touch `lib/repository/`, `lib/schemas/`, `lib/types/`, `lib/utils/` (empty/unrelated; separate cleanup spec covers them).
- Don't introduce a content fetching library or runtime loader — content is static typed files imported directly.
- Don't add IndexedDB / Dexie persistence — `localStorage`-only per resolved decision #4.
- Don't keep `lib/data/index.ts` after migration.
- Don't hand-write a TypeScript interface that parallels a Zod schema.
- Don't add new dependencies (zod already installed).
- Don't author the commented-out legacy entries (BeStore, Maham, Codv Academy, the 4-year freelance graphic-design entry) — they were intentionally hidden.

</frozen-after-approval>

## Code Map

- `lib/content/profile.ts` (NEW) -- ProfileSchema + Profile type + `profile` data; authored from user_role memory + design-system §1.
- `lib/content/projects.ts` (NEW) -- ProjectSchema per design-system §13 + Project type + `projects` data; transforms legacy `projects[]` with default-filled rich fields.
- `lib/content/experience.ts` (NEW) -- ExperienceSchema + HighlightSchema (nested) + types + `experience` data; consolidates legacy experience/freelance/sideprojects via `kind`.
- `lib/content/skills.ts` (NEW) -- SkillSchema + SkillGroupSchema + types + `skillGroups` data; preserves legacy grouped structure.
- `lib/content/index.ts` (NEW) -- Single re-export surface for all four entities (schemas, types, data).
- `lib/data/index.ts` (DELETE) -- Legacy default-exported object; no consumers; safe to remove.
- `lib/utils/validation.ts` -- Untouched; `formatZodError` may be useful later.

## Tasks & Acceptance

**Execution:**

- [x] `lib/content/profile.ts` -- Define `ProfileSchema` per Design Notes Profile table. Author the `profile` constant from user_role memory + design-system §1 tagline (Design Notes Authoring section for field values). Validate via `ProfileSchema.parse(profile)` at module load.
- [x] `lib/content/projects.ts` -- Define `ProjectSchema` per Design Notes Project table (matches design-system §13 verbatim). Transform every uncommented legacy entry in `lib/data/index.ts:203-586` into the full shape using the Default-Fill Rules in Design Notes. Validate via parse.
- [x] `lib/content/experience.ts` -- Define `HighlightSchema` and `ExperienceSchema` per Design Notes Experience table. Consolidate legacy `experience[]`/`freelance[]`/`sideprojects[]` into one `experience` array via the `kind` discriminator. Map nested legacy `projects[]` → `highlights[]`. Validate via parse.
- [x] `lib/content/skills.ts` -- Define `SkillSchema` + `SkillGroupSchema` per Design Notes Skill table. Transform legacy `skills[]` (title→name, img→icon, level preserved, group→SkillGroup). Validate via parse.
- [x] `lib/content/index.ts` -- Re-export schema, type, and data from each of the four entity files using `export { ... } from './<entity>'` form (preserves named exports per project-context rules).
- [x] `lib/data/index.ts` -- DELETE the file entirely (no rm-rf, single-file delete).

**Acceptance Criteria:**

- Given `yarn build`, when every entity file is imported via `lib/content/index`, then all four `Schema.parse(data)` calls execute without throwing (Zod failure would fail the build).
- Given a consumer imports `{ projects, type Project } from '@/lib/content'`, when accessing `projects[0].slug`, then TypeScript infers `slug` as `string` and the field is non-empty at runtime.
- Given every migrated project, when validated against `ProjectSchema`, then `slug` matches `/^[a-z0-9-]+$/` and every required design-system §13 field is present.
- Given every migrated experience entry, when its `kind` is read, then it is exactly one of `'fulltime' | 'freelance' | 'side'` and matches its legacy collection origin.
- Given `lib/data/index.ts`, when the repo is searched, then the file does not exist and no `from '@/lib/data'` / `from '../data'` import resolves anywhere.
- Given `yarn typecheck && yarn lint && yarn build`, then all three pass with zero new errors.

## Spec Change Log

### Loop 2 — 2026-05-25 — bad_spec: parseDateRange masks past freelance/side roles

**Trigger:** Edge-case review (finding #1) flagged that 5 of 9 experiences carry legacy dates in the "year + duration" format (`"2023 - 5 mos"`, `"2022 - 7 mos"`, `"2021 - 3 mos"`, `"2022 - 8 mos"`, `"2022 - 5 mos"`). The spec's Experience-transformation Design Note said "preserve raw in startDate, leave endDate='present'" only as a parse-failure fallback. The implementation treated this format as a fallback case, producing `startDate: "2023 - 5 mos"` (whole string) and `endDate: "present"` — both wrong: startDate carries the duration string, and endDate "present" makes clearly-past roles look ongoing.

**Amendment:** Replace the parse-failure fallback for the year+duration format with explicit handling: when the second segment matches `/^\d+\s*(mo|mos|month|months|year|years|yr|yrs)/i`, set `startDate = parts[0].trim()` and `endDate = parts[1].trim()` (keep the duration literal — UI/downstream interprets). The "raw in startDate, endDate='present'" fallback now ONLY fires when the input does not split into two parts at all.

**Known-bad state avoided:** Past freelance/side roles displayed as currently-ongoing in any UI sorting by `endDate`; downstream code parsing `startDate` as a year would fail on the malformed "2023 - 5 mos" string.

**KEEP (must survive re-derivation):**

- All Zod schemas as defined.
- Project schema mapped per design-system §13 verbatim.
- Project default-fill rules.
- Experience kind discriminator + slug derivation.
- Skill group transformation.
- Profile values authored from memory.
- `Object.freeze` on collections (shallow but flagged as deferred for future hardening).
- `superRefine` uniqueness checks.
- The `lib/data/index.ts` deletion.

### Loop 2 — patches (no full re-derivation needed)

- Reverted highlight title renames per spec's "1:1 rename only" rule: `experience.ts` Besteam highlight back to `"Projects"`, Pick Path highlight back to `"Dashboard"`. Trailing-space trims and whitespace cleanup kept (parser hygiene).
- Added `{ label: "Email", href: "mailto:HosMarey@gmail.com" }` to `profile.socials` per spec baseline. Verified `z.string().url()` accepts `mailto:` (URL constructor parses it).

### Post-checkpoint user direction — 2026-05-25 — strip memory-sourced Profile values

**Trigger:** After spec marked `done`, user instructed: "use original data, don't use any data in claude memory." The Profile authoring step had pulled values from Claude's memory files (`user_role.md`: name "Hossam Marey", years 10), from system context (`userEmail: HosMarey@gmail.com`), and from fabrication (3 principles, 4 metric values). The user re-scoped: Profile values must come from `lib/data/index.ts` (legacy data being migrated) or from `docs/design-system.md` (canonical project doc), not from memory or session context.

**Amendment:**

- Relaxed `ProfileSchema`: `name`/`location` drop `.min(1)`; `email` becomes `z.union([z.literal(""), z.string().email()])`; `years` becomes `z.number().int().min(0)`. Shape contract preserved (every §13 field still present on the type), but empty/zero values now parse.
- `rawProfile` now contains ONLY: `role: "Senior Front-End Developer"` (from legacy: 3 fulltime experience entries carry this title), `tagline` (from `docs/design-system.md` §1), and `socials: [{ label: "GitHub", href: "https://github.com/HossamMarey" }]` (derived from legacy project github URLs like `https://github.com/HossamMarey/css-course-projects`). `name`, `location`, `email` are empty strings; `years` is 0; `principles` and `metrics` are empty arrays.
- Removed `{ label: "Email", href: "mailto:..." }` from socials (sourced from system context, not legacy data).

**Known-bad state avoided:** Shipping fabricated Profile content that misrepresents Hossam's actual identity/principles/metrics; muddy provenance (was this data Hossam authored or Claude invented?).

**Authoring follow-up:** Profile fields (`name`, `location`, `email`, `years`, `principles`, `metrics`) need to be authored by Hossam directly. Either inline-edit `lib/content/profile.ts` or address via a future quick-dev spec.

**KEEP from prior loops:** all schema/code from Loop 2 (parseDateRange fix, highlight title reverts) remain.

## Design Notes

### Schema derivation

Schemas live in their respective entity files. Derive fields directly:

- **Profile / Project** — fields exactly per design-system.md §13. Use `z.string().min(1)` for required text, `z.string().email()` for email, `z.string().url()` for hrefs, `z.number().int()` for years/statusCode, `z.number().min(0).max(1)` for sizeWeight/timeWeight/startOffset, `z.enum([…])` for method (`GET|POST|PUT|PATCH`) and status (`shipped|ongoing|archived`).
- **Project `slug`** — `z.string().regex(/^[a-z0-9-]+$/)`. Uniqueness checked at parse via `z.array(ProjectSchema).superRefine` on the collection.
- **Experience** — fields: `slug` (kebab regex), `role`, `company`, `companyLogo?`, `kind: z.enum(['fulltime','freelance','side'])`, `mode: z.enum(['remote','hybrid','onsite','unknown']).default('unknown')`, `startDate` (free-form string), `endDate` (free-form, allows `'present'`), `summary?`, `highlights: z.array(HighlightSchema)`.
- **Highlight** (nested) — `title`, `description?`, `date?`, `skills: z.array(string)`, `roles: z.array(string)`. Maps 1:1 from legacy nested `projects[]`.
- **Skill / SkillGroup** — `Skill { name, icon?, level: z.union([z.literal(1), z.literal(2), z.literal(3)]) }`; `SkillGroup { name, skills: z.array(SkillSchema) }`.

All types derive via `z.infer<typeof Schema>` — never hand-write parallel `interface` declarations.

### Project default-fill rules (legacy → new)

- **Direct maps:** `name`←`title`, `problem`←`description`, `stack`←`tags`. `slug`←kebab(`title`), unique-checked via `.superRefine` on the collection.
- **Placeholder defaults** (real values authored in follow-up spec): `org=''`, `method='GET'`, `status='archived'`, `statusCode=200`, `type='web'`, `size='Side Project'`, `sizeWeight=0.3`, `time='1 mo'`, `timeWeight=0.1`, `startOffset=0`, `year=2022`, `role=''`, `decisions=[]`, `outcomes=[]`.
- **Links:** build `[{label:'Preview', href:preview}, {label:'Code', href:code}, {label:'Design', href:design}].filter(l => l.href?.startsWith('http'))` — drops legacy `null` values and the `/videos` placeholders that aren't URLs.

### Experience transformation

- Legacy `experience[]` → `kind: 'fulltime'`; legacy `freelance[]` → `kind: 'freelance'`; legacy `sideprojects[]` → `kind: 'side'`.
- `slug` = kebab(`company`-`role`); uniqueness checked at parse.
- `mode` inferred from substrings in legacy `company` field: `/Remotely/i` → `'remote'`, `/Hybrid/i` → `'hybrid'`, otherwise `'unknown'`. Onsite isn't reliably detectable from legacy data — default unknown.
- `startDate` / `endDate` parsed from legacy `date` string with a permissive splitter (`'Jun. 2023 - present'` → `start='Jun. 2023'`, `end='present'`). On parse failure, preserve raw in `startDate`, leave `endDate='present'`.
- Nested legacy `projects[]` → `highlights[]` 1:1 (rename only).

### Profile authoring (CHECKPOINT 1 review required)

Drafted from user_role memory + design-system §1 + email from currentDate context:

- `name`: `'Hossam Marey'`
- `role`: `'Senior Front-End Developer'`
- `location`: `'Cairo, Egypt'` ← **PLEASE CONFIRM**
- `email`: `'HosMarey@gmail.com'`
- `tagline`: `'I build fast, accessible interfaces for data-heavy products — then teach how it was done.'` (design-system §1)
- `years`: `10`
- `socials`: `[{label:'GitHub', href:'https://github.com/HossamMarey'}, {label:'Email', href:'mailto:HosMarey@gmail.com'}]` ← **CONFIRM/ADD** LinkedIn, X, Behance (legacy data references Behance projects)
- `principles`: 3 placeholder principles (`{key:'perf', title:'Performance is a feature', body:'…'}`, `{key:'a11y', title:'Accessibility is non-negotiable', body:'…'}`, `{key:'teach', title:'Teach what you build', body:'…'}`) ← **REVIEW WORDING**
- `metrics`: 4 placeholders (`{label:'Years shipping', value:'10', suffix:'+'}`, `{label:'Production apps', value:'20', suffix:'+'}`, `{label:'Stacks lived in', value:'3', suffix:''}` (React/Vue/jQuery), `{label:'Teams led', value:'2', suffix:''}`) ← **REPLACE WITH REAL NUMBERS** if you have them

### Why colocate schemas with data

Zod source-of-truth rule (project-context Language Rules) + design-system mandate for typed content means schema and data evolve together. Single-file-per-entity keeps "rename a field" a single-file diff.

## Verification

**Commands:**

- `yarn typecheck` — expected: 0 errors
- `yarn lint` — expected: 0 new errors
- `yarn build` — expected: success. Parse-on-import calls run during static eval; any schema failure surfaces here.

**Manual checks:**

- `git ls-files lib/data` (or `dir lib/data`) — expected: no output / not-found.
- Open `lib/content/projects.ts` in an editor; hover `projects[0]` — TS shows the inferred `Project` type with all design-system §13 fields.
- Search the repo for `from '@/lib/data'` and `from '../data'` — zero hits.

## Suggested Review Order

**Schemas (the type contracts)**

- Project schema — every design-system §13 field, regex on slug, enums for method/status.
  [`projects.ts:6`](../../lib/content/projects.ts#L6)

- Experience + nested Highlight schemas — kind discriminator (`fulltime | freelance | side`) is the consolidation pivot.
  [`experience.ts:16`](../../lib/content/experience.ts#L16)

- Profile schema (authored values worth eyeballing) and Skill/SkillGroup schemas.
  [`profile.ts:3`](../../lib/content/profile.ts#L3)
  [`skills.ts:5`](../../lib/content/skills.ts#L5)

**Transformations (legacy → typed)**

- `parseDateRange` (loop 2 fix) — year+duration format now splits into proper start/end instead of falsely "present" for past freelance/side roles.
  [`experience.ts:67`](../../lib/content/experience.ts#L67)

- `transformEmployment` — applies parseCompany/parseMode/parseDateRange + slug derivation.
  [`experience.ts:356`](../../lib/content/experience.ts#L356)

- Project default-fill transform — thin legacy records → full §13 shape with placeholder defaults.
  [`projects.ts:90`](../../lib/content/projects.ts#L90)

**Profile values (review the authored content)**

- `rawProfile` — name/role/location/email/tagline/years/socials/principles/metrics. Replace placeholders as needed.
  [`profile.ts:34`](../../lib/content/profile.ts#L34)

**Collection-level checks**

- `superRefine` uniqueness on projects, experience, skill groups — duplicate-slug detection at parse time.
  [`projects.ts:34`](../../lib/content/projects.ts#L34)
  [`experience.ts:37`](../../lib/content/experience.ts#L37)
  [`skills.ts:25`](../../lib/content/skills.ts#L25)

**Public surface**

- Aggregator: single import surface so consumers write `import { projects, type Project } from "@/lib/content"`.
  [`index.ts:1`](../../lib/content/index.ts#L1)
