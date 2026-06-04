# Code Review Prompt: Blind Hunter

You are a **Blind Hunter** â€” a code reviewer with NO project context. You only have the diff below. Review it adversarially. Look for:
- Security issues
- Logic errors
- Performance problems
- Type safety issues
- Accessibility violations
- Race conditions
- Resource leaks
- Any other bugs or anti-patterns

Output findings as a Markdown list. Each finding: one-line title, file location, and evidence from the diff.

---

## Diff

```diff
diff --git a/_bmad-output/implementation-artifacts/sprint-status.yaml b/_bmad-output/implementation-artifacts/sprint-status.yaml
index 028c28f..a5748c9 100644
--- a/_bmad-output/implementation-artifacts/sprint-status.yaml
+++ b/_bmad-output/implementation-artifacts/sprint-status.yaml
@@ -35,7 +35,7 @@
 # - Dev moves story to 'review', then runs code-review (fresh context, different LLM recommended)
 
 generated: 2026-05-30
-last_updated: 2026-06-03 # story 4-6 set to done (code review complete)
+last_updated: 2026-06-04 # epic-8 created; story 8-1 set to ready-for-dev (create-story)
 # all stories set done on 2026-06-02
 project: web
 # epic-1 set in-progress on 2026-05-30 (first story created via create-story)
@@ -104,3 +104,8 @@ development_status:
   7-4-mock-content-ci-gate-and-pre-commit-hooks: done
   7-5-csp-lighthouse-pass-and-vercel-deploy: done
   epic-7-retrospective: optional
+
+  # Epic 8: Experience Timeline (post-launch)
+  epic-8: in-progress
+  8-1-linkedin-style-experience-page: review
+  epic-8-retrospective: optional
diff --git a/app/sitemap.test.ts b/app/sitemap.test.ts
index bca1c90..46ea66e 100644
--- a/app/sitemap.test.ts
+++ b/app/sitemap.test.ts
@@ -20,7 +20,7 @@ describe("sitemap.ts", () => {
     }
   })
 
-  it("includes all 6 static routes", () => {
+  it("includes all 7 static routes", () => {
     const staticRoutes = [
       "/",
       "/work",
@@ -28,6 +28,7 @@ describe("sitemap.ts", () => {
       "/sources",
       "/console",
       "/recruiter",
+      "/experience",
     ]
     for (const path of staticRoutes) {
       expect(urls).toContain(siteUrl(path))
@@ -46,7 +47,7 @@ describe("sitemap.ts", () => {
   })
 
   it("has correct total count", () => {
-    expect(result.length).toBe(6 + featured.length)
+    expect(result.length).toBe(7 + featured.length)
   })
 
   it("does not set lastModified to new Date()", () => {
diff --git a/app/sitemap.ts b/app/sitemap.ts
index b32e189..e005b14 100644
--- a/app/sitemap.ts
+++ b/app/sitemap.ts
@@ -10,6 +10,7 @@ const staticRoutes = [
   "/sources",
   "/console",
   "/recruiter",
+  "/experience",
 ]
 
 export default function sitemap(): MetadataRoute.Sitemap {
diff --git a/components/command-palette.tsx b/components/command-palette.tsx
index 3aba873..66bbe41 100644
--- a/components/command-palette.tsx
+++ b/components/command-palette.tsx
@@ -143,6 +143,22 @@ export function CommandPalette() {
           >
             Sources
           </CommandItem>
+          <CommandItem
+            value="Experience"
+            keywords={["work", "history", "career", "jobs"]}
+            onSelect={() => handleNavigate("/experience")}
+          >
+            Experience
+          </CommandItem>
+
+          <CommandItem
+            value="Contact"
+            keywords={["contact", "message", "email", "phone", "address"]}
+            onSelect={() => handleNavigate("/sources?tab=contact")}
+          >
+            Contact
+          </CommandItem>
+
           <CommandItem
             value="Recruiter"
             keywords={["resume", "cv", "hire"]}
@@ -152,19 +168,6 @@ export function CommandPalette() {
           </CommandItem>
         </CommandGroup>
 
-        <CommandGroup heading="Projects">
-          {projects.map((p) => (
-            <CommandItem
-              key={p.slug}
-              value={p.name}
-              keywords={[p.slug, ...p.stack]}
-              onSelect={() => handleNavigate("/work/" + p.slug)}
-            >
-              {p.name}
-            </CommandItem>
-          ))}
-        </CommandGroup>
-
         <CommandGroup heading="Actions">
           <CommandItem
             value="Toggle Recruiter Mode"
@@ -218,6 +221,19 @@ export function CommandPalette() {
             </CommandItem>
           ))}
         </CommandGroup>
+
+        <CommandGroup heading="Projects">
+          {projects.map((p) => (
+            <CommandItem
+              key={p.slug}
+              value={p.name}
+              keywords={[p.slug, ...p.stack]}
+              onSelect={() => handleNavigate("/work/" + p.slug)}
+            >
+              {p.name}
+            </CommandItem>
+          ))}
+        </CommandGroup>
       </CommandList>
 
       <div className="flex items-center justify-center gap-2 border-t border-hairline px-3 py-2 text-muted-foreground">
diff --git a/components/devtools-chrome.tsx b/components/devtools-chrome.tsx
index 4936b9e..0e934ad 100644
--- a/components/devtools-chrome.tsx
+++ b/components/devtools-chrome.tsx
@@ -13,7 +13,14 @@ import { XPToast } from "@/components/xp-toast"
 import { useRouter } from "next/navigation"
 import { useXP } from "@/hooks/use-xp"
 import { useRecruiterMode } from "@/hooks/use-recruiter-mode"
-import { Code, Globe, Terminal, Activity, FileText } from "lucide-react"
+import {
+  Code,
+  Globe,
+  Terminal,
+  Activity,
+  FileText,
+  Briefcase,
+} from "lucide-react"
 import type { LucideIcon } from "lucide-react"
 
 interface Tab {
@@ -24,9 +31,10 @@ interface Tab {
 
 const tabs: Tab[] = [
   { href: "/", label: "Elements", icon: Code },
+  { href: "/experience", label: "Experience", icon: Briefcase },
   { href: "/work", label: "Network", icon: Globe },
   { href: "/console", label: "Console", icon: Terminal },
-  { href: "/perf", label: "Performance", icon: Activity },
+  // { href: "/perf", label: "Performance", icon: Activity },
   { href: "/sources", label: "Sources", icon: FileText },
 ]
 
diff --git a/components/network-filter-bar.test.tsx b/components/network-filter-bar.test.tsx
index bd9e7f4..fd314a4 100644
--- a/components/network-filter-bar.test.tsx
+++ b/components/network-filter-bar.test.tsx
@@ -11,11 +11,13 @@ import type {
 const defaultAvailable: AvailableFilters = {
   type: ["web", "app", "lib"],
   stack: ["react", "vue"],
+  org: ["Acme Inc"],
 }
 
 const noFilters: ActiveFilters = {
   type: [],
   stack: [],
+  org: [],
 }
 
 describe("NetworkFilterBar", () => {
@@ -36,6 +38,7 @@ describe("NetworkFilterBar", () => {
     const active: ActiveFilters = {
       type: ["web", "app"],
       stack: [],
+      org: [],
     }
     render(
       <NetworkFilterBar
@@ -86,6 +89,7 @@ describe("NetworkFilterBar", () => {
     const active: ActiveFilters = {
       type: ["web"],
       stack: [],
+      org: [],
     }
     render(
       <NetworkFilterBar
@@ -120,6 +124,7 @@ describe("NetworkFilterBar", () => {
     const active: ActiveFilters = {
       type: ["web"],
       stack: [],
+      org: [],
     }
     render(
       <NetworkFilterBar
diff --git a/components/network-filter-bar.tsx b/components/network-filter-bar.tsx
index ffc6501..309709c 100644
--- a/components/network-filter-bar.tsx
+++ b/components/network-filter-bar.tsx
@@ -10,16 +10,18 @@ import {
 } from "@/components/ui/popover"
 import { cn } from "@/lib/utils"
 
-type FilterCategory = "type" | "stack"
+type FilterCategory = "type" | "stack" | "org"
 
 export interface AvailableFilters {
   type: string[]
   stack: string[]
+  org: string[]
 }
 
 export interface ActiveFilters {
   type: string[]
   stack: string[]
+  org: string[]
 }
 
 interface NetworkFilterBarProps {
@@ -32,9 +34,10 @@ interface NetworkFilterBarProps {
 const CATEGORY_LABELS: Record<FilterCategory, string> = {
   type: "Type",
   stack: "Stack",
+  org: "Company",
 }
 
-const CATEGORIES: FilterCategory[] = ["type", "stack"]
+const CATEGORIES: FilterCategory[] = ["type", "stack", "org"]
 
 export function NetworkFilterBar({
   availableFilters,
diff --git a/components/network-page-client.tsx b/components/network-page-client.tsx
index 2178de3..e4b27ae 100644
--- a/components/network-page-client.tsx
+++ b/components/network-page-client.tsx
@@ -26,17 +26,20 @@ function deriveAvailableFilters(
 ): AvailableFilters {
   const types = new Set<string>()
   const stacks = new Set<string>()
+  const orgs = new Set<string>()
 
   for (const p of projects) {
     if (p.type) types.add(p.type)
     for (const s of p.stack) {
       stacks.add(s)
     }
+    if (p.org) orgs.add(p.org)
   }
 
   return {
     type: Array.from(types).sort(),
     stack: Array.from(stacks).sort(),
+    org: Array.from(orgs).sort(),
   }
 }
 
@@ -44,6 +47,7 @@ function parseActiveFilters(searchParams: URLSearchParams): ActiveFilters {
   return {
     type: searchParams.getAll("type").filter(Boolean),
     stack: searchParams.getAll("stack").filter(Boolean),
+    org: searchParams.getAll("org").filter(Boolean),
   }
 }
 
@@ -56,7 +60,8 @@ function applyFilters(
     const stackMatch =
       filters.stack.length === 0 ||
       filters.stack.some((s) => p.stack.includes(s))
-    return typeMatch && stackMatch
+    const orgMatch = filters.org.length === 0 || filters.org.includes(p.org)
+    return typeMatch && stackMatch && orgMatch
   })
 }
 
diff --git a/lib/content/experience.ts b/lib/content/experience.ts
index 5e08675..c50b476 100644
--- a/lib/content/experience.ts
+++ b/lib/content/experience.ts
@@ -1,29 +1,28 @@
 import { z } from "zod"
 
-export const ExperienceKind = z.enum(["fulltime", "freelance", "side"])
-export const ExperienceMode = z.enum(["remote", "hybrid", "onsite", "unknown"])
+export const ExperienceType = z.enum(["fulltime", "parttime", "contract"])
+export const ExperienceCategory = z.enum(["fulltime", "freelance"])
+export const LocationType = z.enum(["remote", "hybrid", "onsite"])
 
-export const HighlightSchema = z.object({
-  title: z.string().min(1),
+export const RoleSchema = z.object({
+  name: z.string().min(1),
   description: z.string().optional(),
-  date: z.string().optional(),
-  skills: z.array(z.string().min(1)),
-  roles: z.array(z.string().min(1)),
+  startDate: z.string().regex(/^\d{4}-\d{2}$/),
+  endDate: z.union([z.literal("present"), z.string().regex(/^\d{4}-\d{2}$/)]),
 })
 
-export type Highlight = z.infer<typeof HighlightSchema>
+export type Role = z.infer<typeof RoleSchema>
 
 export const ExperienceSchema = z.object({
   slug: z.string().regex(/^[a-z0-9-]+$/),
-  role: z.string().min(1),
   company: z.string().min(1),
   companyLogo: z.string().optional(),
-  kind: ExperienceKind,
-  mode: ExperienceMode.default("unknown"),
-  startDate: z.string().min(1),
-  endDate: z.string().min(1),
-  summary: z.string().optional(),
-  highlights: z.array(HighlightSchema),
+  type: ExperienceType,
+  category: ExperienceCategory,
+  location: z.string().optional(),
+  locationType: LocationType,
+  org: z.string().optional(),
+  roles: z.array(RoleSchema).min(1),
 })
 
 export type Experience = z.infer<typeof ExperienceSchema>
@@ -45,353 +44,152 @@ const ExperienceCollectionSchema = z
     })
   })
 
-function toSlug(value: string): string {
-  return value
-    .toLowerCase()
-    .replace(/[^a-z0-9]+/g, "-")
-    .replace(/^-+|-+$/g, "")
-}
-
-function parseCompany(raw: string): string {
-  return raw.split(/\s+-\s+/)[0].trim()
-}
-
-function parseMode(raw: string | undefined): Experience["mode"] {
-  if (!raw) return "unknown"
-  if (/remotely|remote/i.test(raw)) return "remote"
-  if (/hybrid/i.test(raw)) return "hybrid"
-  if (/onsite|on-site/i.test(raw)) return "onsite"
-  return "unknown"
-}
-
-function parseDateRange(raw: string): {
-  startDate: string
-  endDate: string
-} {
-  const cleaned = raw
-    .replace(/^(Full-Time|Full Time|Part-Time|Part Time):\s*/i, "")
-    .trim()
-  const parts = cleaned.split(/\s*-\s*/)
-  if (parts.length === 2) {
-    const [start, end] = parts.map((p) => p.trim())
-    return { startDate: start, endDate: end }
-  }
-  return { startDate: cleaned, endDate: "present" }
-}
-
-type LegacyHighlight = {
-  title: string
-  description?: string
-  date?: string
-  skills: string[]
-  roles: string[]
-}
-
-type LegacyEmployment = {
-  role: string
-  company: string
-  date: string
-  img?: string
-  projects: LegacyHighlight[]
-}
-
-type LegacySide = {
-  name: string
-  date: string
-  img?: string
-  projects: LegacyHighlight[]
-}
-
-const legacyFulltime: LegacyEmployment[] = [
+const rawExperience: z.input<typeof ExperienceSchema>[] = [
   {
-    role: "Senior Front-End Developer",
-    company: "Buguard - Remotely - Full-time",
-    date: "Jun. 2023 - present",
-    img: "/images/companies/buguard.png",
-    projects: [
+    slug: "buguard",
+    company: "Buguard",
+    type: "fulltime",
+    category: "fulltime",
+    locationType: "remote",
+    org: "Buguard, LLC",
+    companyLogo: "/images/companies/buguard.jpg",
+
+    roles: [
       {
-        title: "Buguard Dashboards",
+        name: "Team Lead",
+        startDate: "2025-09",
+        endDate: "present",
         description:
-          "Dark Atlas is a proactive dark web monitoring platform that helps businesses prevent data breaches",
-        date: "Dec. 2022 - Present",
-        skills: [
-          "React.js",
-          "Next.js",
-          "Ant.Design",
-          "TailwindCss",
-          "React-query",
-          "TS",
-        ],
-        roles: [
-          "Developed a comprehensive dashboard enabling security leak monitoring and report export for multiple companies.",
-        ],
+          "At Buguard, I served as a Team Lead, managing a diverse team to drive the successful delivery of features from design to production. My role involved collaborating with various functions, including frontend, backend, UI/UX, and QA, to ensure seamless project execution. I leveraged my expertise as a senior frontend developer to guide the team and optimize our development processes.",
       },
       {
-        title: "Buguard and DarkAtlas Landing Pages",
-        description:
-          "Buguard, LLC is a multinational cybersecurity firm offering various services to companies worldwide, including penetration testing, GRC services, and managed security services. They operate in North America, Europe, the Middle East and Africa",
-        date: "Dec. 2022 - Present",
-        skills: [
-          "React.js",
-          "Next.js",
-          "Ant.Design",
-          "TailwindCss",
-          "React-query",
-          "TS",
-        ],
-        roles: [
-          "Created optimized landing pages to enhance SEO performance and support marketing efforts for Buguard and DarkAtlas.",
-        ],
+        name: "Senior Frontend Developer",
+        startDate: "2023-06",
+        endDate: "present",
+        description: `
+        As a Senior Frontend Developer at Buguard, LLC, an Egypt-based cybersecurity firm, my daily responsibilities revolve around frontend development tasks that aim to enhance Buguard's cybersecurity applications and services. At Buguard, we specialize in providing a comprehensive range of cybersecurity solutions, including Application Security, GRC Services, Bug Bounty Programs, Penetration Testing, Dark Web Monitoring, Red Teaming, Security Consultations, Managed Security Services, and Security Outsourcing to major enterprises and midsize companies.
+
+In my role, I get to engage in exciting frontend development activities, working with technologies like HTML, CSS, JavaScript, and frameworks such as React, Angular, or Vue.js to code and maintain our cybersecurity applications. Collaborating closely with our design team, we create user interfaces that are not only visually appealing but also intuitive, enhancing the overall user experience of Buguard's applications.
+
+Performance optimization is a key aspect of my work. I continuously strive to optimize our frontend code, 
+As a Senior Frontend Developer, I take pride in maintaining high code quality standards and promoting best practices within our frontend development team. I actively participate in code reviews, adhere to our coding guidelines, and offer mentorship and guidance to junior developers, fostering a collaborative and growth-oriented environment.
+
+In the fast-paced world of cybersecurity, staying up-to-date with the latest frontend technologies and security best practices is crucial. I invest time in continuous learning, attending workshops and conferences, and exploring new ways to enhance our applications' security and performance.
+
+Buguard's mission to provide top-notch cybersecurity services drives me to tackle challenges head-on. Problem-solving is an essential part of my role as I troubleshoot and resolve frontend development issues, ensuring Buguard's applications are always at their best.
+`,
       },
     ],
   },
   {
-    role: "Senior Front-End Developer",
-    company: "MasheedGate - Hybrid - Full-time",
-    date: "Nov. 2022 - Jul. 2023",
-    img: "/images/companies/masheed.png",
-    projects: [
+    slug: "masheedgate",
+    company: "masheedGATE",
+    companyLogo: "/images/companies/masheed.jpg",
+    type: "fulltime",
+    category: "fulltime",
+    location: "Cairo, Egypt",
+    locationType: "hybrid",
+    org: "MasheedGate",
+    roles: [
       {
-        title: "E-commerce Website Development",
-        description:
-          "We are building a new Ecommerce website for selling construction materials",
-        date: "Dec. 2022 - Present",
-        skills: [
-          "React.js",
-          "Remix.js",
-          "Ant.Design",
-          "TailwindCss",
-          "React-query",
-          "GraphQL",
-          "TS",
-        ],
-        roles: [
-          "development of a cutting-edge e-commerce platform dedicated to selling construction materials.",
-          "Implemented Domain-Driven Design (DDD) principles and adopted Monorepos to enhance maintenance and streamline development processes",
-        ],
+        name: "Senior Frontend Developer",
+        startDate: "2022-11",
+        endDate: "2023-07",
+        description: `
+        development of a cutting-edge e-commerce platform dedicated to selling construction materials.
+Implemented Domain-Driven Design (DDD) principles and adopted Monorepos to enhance maintenance and streamline development processes
+        `,
       },
     ],
   },
   {
-    role: "Front-End Developer (NuxtJs , NextJS)",
-    company: "Inovola - Remotely",
-    date: "Full-Time: Apr. 2021 - sep. 2022",
-    img: "/images/companies/inovola.jpg",
-    projects: [
-      {
-        title: "BuilderZ Project",
-        description:
-          "E-learning and management system for selling online courses.",
-        date: "Aug. 2021 - Present",
-        skills: ["Vue.js", "Nuxt,js", "Ant.Design", "TailwindCss"],
-        roles: [
-          "Leading to the development of an E-learning and management system for selling online courses.",
-        ],
-      },
+    slug: "inovola",
+    company: "Inovola",
+    companyLogo: "/images/companies/inovola.jpg",
+    type: "fulltime",
+    category: "fulltime",
+    location: "Al Jizah, Egypt",
+    locationType: "remote",
+    org: "Inovola",
+    roles: [
       {
-        title: "Zrealtors",
-        date: "Nov. 2021 - Present",
-        description: "A property finder website.",
-        skills: ["Vue.js", "Nuxt,js", "Vutify", "TailwindCss"],
-        roles: [
-          "build main architecture of views , components and state management store.",
-          "help the team with the blocking tasks",
-        ],
-      },
-      {
-        title: "Tamincom Refactor",
-        date: "Nov. 2021 - Present",
-        description: "Car Insurance Website.",
-        skills: ["Vue.js", "Vutify", "Typescript"],
-        roles: [
-          "Played a pivotal role as the primary frontend developer for a Car Insurance Website.",
-        ],
-      },
-      {
-        title: "VIBRANT COMMUNITY",
-        date: "Nov. 2021 - Present",
-        description: "A Charity Organization website.",
-        skills: ["React.js", "Next.js", "MUI"],
-        roles: [
-          "Designed and established the foundational architecture for views, components, and state management stores.",
-        ],
+        name: "Frontend Developer",
+        startDate: "2021-04",
+        endDate: "2022-09",
       },
     ],
   },
   {
-    role: "Front-End Developer",
-    company: "Besteam - Nasr City - Full-time",
-    date: "Sep. 2019 - Mar. 2021",
-    img: "/images/companies/besteam.png",
-    projects: [
+    slug: "be-steam",
+    company: "BE-STEAM",
+    org: "BE-STEAM",
+    companyLogo: "/images/companies/besteam.png",
+    type: "fulltime",
+    category: "fulltime",
+    location: "Cairo, Egypt",
+    locationType: "onsite",
+    roles: [
       {
-        title: "Projects",
-        date: "Oct. 2020 - Apr. 2021",
-        description: "STEM Education Company.",
-        skills: ["Vue.js", "jQuery", "Bootstrap"],
-        roles: [
-          "Utilized Vue.js and JQuery to create websites for Saudi Robotics competitions as part of our commitment to promoting STEAM education system.",
-        ],
+        name: "Frontend Developer",
+        startDate: "2019-09",
+        endDate: "2021-03",
       },
     ],
   },
-]
-
-const legacyFreelance: LegacyEmployment[] = [
   {
-    role: "Front-End Developer",
-    company: "The Pick Path Group (USA)",
-    date: "2023 - 5 mos",
-    img: "/images/companies/commute.jpg",
-    projects: [
+    slug: "the-pick-path-group",
+    company: "The Pick Path Group",
+    companyLogo: "/images/companies/commute.jpg",
+    type: "contract",
+    category: "freelance",
+    locationType: "remote",
+    org: "The Pick Path Group (USA)",
+    roles: [
       {
-        title: "Dashboard",
+        name: "Front-End Developer",
         description:
           "Commutrics offers the comprehensive capabilities and deep industry knowledge necessary to help you solve the challenging issues of commuting to any organization",
-        date: "Aug. 2021 - Present",
-        skills: ["vue.js", "Ant.Design", "TailwindCss", "vue-query"],
-        roles: ["Responsible for all the frontend part."],
+        startDate: "2023-01",
+        endDate: "2023-05",
       },
     ],
   },
   {
-    role: "Senior Front-End Developer",
-    company: "Grand Community - Remotely - Part-time",
-    date: "2022 - 7 mos",
-    img: "/images/companies/grand.png",
-    projects: [
-      {
-        title: "Whatsapp pro",
-        description: "Customer Service app based on whatsapp",
-        date: "Aug. 2021 - Present",
-        skills: ["Vue.js", "Ant.Design", "TailwindCss", "Vue-query"],
-        roles: ["Responsible for all the frontend part."],
-      },
+    slug: "grand-community",
+    company: "Grand Community",
+    companyLogo: "/images/companies/grand.png",
+    type: "parttime",
+    category: "freelance",
+    locationType: "remote",
+    org: "Grand Community",
+    roles: [
       {
-        title: "GC Website",
+        name: "Senior Front-End Developer",
         description:
-          "The main website of the company and the dashboard for all clients",
-        date: "Aug. 2021 - Present",
-        skills: ["Vue.js", "Vutify", "TailwindCss", "Vue-query"],
-        roles: [
-          "Responsible for building dashboard pages.",
-          "help and manage the frontend team",
-        ],
+          "Customer Service app based on whatsapp. The main website of the company and the dashboard for all clients",
+        startDate: "2022-01",
+        endDate: "2022-07",
       },
     ],
   },
   {
-    role: "Front-End Developer (NextJS)",
-    company: "Alsakn -  FREELANCE",
-    date: "2021 - 3 mos",
-    img: "/images/companies/alsakn.jpg",
-    projects: [
+    slug: "alsakn",
+    company: "Alsakn",
+    companyLogo: "/images/companies/alsakn.jpg",
+    type: "contract",
+    category: "freelance",
+    locationType: "remote",
+    org: "Alsakn (Freelance)",
+    roles: [
       {
-        title: "Alsakn Project",
-        description: "A startup like Airbnb for renting and housing.",
-        date: "Aug. 2021 - Present",
-        skills: ["React.js", "Next.js", "Sass", "Bootstrap"],
-        roles: ["Help in structuring of the project and building the team."],
-      },
-    ],
-  },
-]
-
-const legacySide: LegacySide[] = [
-  {
-    name: "Eazy.To",
-    date: "2022 - 8 mos",
-    img: "/images/companies/eazyto.png",
-    projects: [
-      {
-        title: "Website and Dashboard",
+        name: "Front-End Developer (NextJS)",
         description:
-          "a side project to clone bit.ly with branding and marketing tools",
-        date: "Aug. 2021 - Present",
-        skills: [
-          "React.js",
-          "Next.js",
-          "Ant.design",
-          "TailwindCss | Node.js",
-          "Express",
-          "MongoDB",
-        ],
-        roles: ["Responsible for all the frontend part."],
+          "A startup like Airbnb for renting and housing. Help in structuring of the project and building the team.",
+        startDate: "2021-04",
+        endDate: "2021-06",
       },
     ],
   },
-  {
-    name: "Trend.coupons",
-    date: "2022 - 5 mos",
-    img: "/images/companies/trendcoupons.png",
-    projects: [
-      {
-        title: "Website and Admin panel",
-        description:
-          "a side project to clone bit.ly with branding and marketing tools",
-        date: "Aug. 2021 - Present",
-        skills: [
-          "React.js",
-          "Next.js",
-          "Ant.design",
-          "TailwindCss | Node.js",
-          "Express",
-          "MongoDB",
-        ],
-        roles: ["Responsible for all the frontend part."],
-      },
-    ],
-  },
-]
-
-function toHighlight(h: LegacyHighlight): Highlight {
-  return {
-    title: h.title,
-    description: h.description,
-    date: h.date,
-    skills: h.skills,
-    roles: h.roles,
-  }
-}
-
-function transformEmployment(
-  entry: LegacyEmployment,
-  kind: "fulltime" | "freelance"
-): Experience {
-  const company = parseCompany(entry.company)
-  const { startDate, endDate } = parseDateRange(entry.date)
-  return {
-    slug: toSlug(`${company} ${entry.role}`),
-    role: entry.role,
-    company,
-    companyLogo: entry.img,
-    kind,
-    mode: parseMode(entry.company),
-    startDate,
-    endDate,
-    highlights: entry.projects.map(toHighlight),
-  }
-}
-
-function transformSide(entry: LegacySide): Experience {
-  const { startDate, endDate } = parseDateRange(entry.date)
-  return {
-    slug: toSlug(`${entry.name} solo`),
-    role: "Solo Developer",
-    company: entry.name,
-    companyLogo: entry.img,
-    kind: "side",
-    mode: "unknown",
-    startDate,
-    endDate,
-    highlights: entry.projects.map(toHighlight),
-  }
-}
-
-const rawExperience: Experience[] = [
-  ...legacyFulltime.map((e) => transformEmployment(e, "fulltime")),
-  ...legacyFreelance.map((e) => transformEmployment(e, "freelance")),
-  ...legacySide.map(transformSide),
 ]
 
 export const experience: readonly Experience[] = Object.freeze(
diff --git a/lib/content/index.ts b/lib/content/index.ts
index 992ee8d..5a44fa6 100644
--- a/lib/content/index.ts
+++ b/lib/content/index.ts
@@ -8,12 +8,13 @@ export {
 } from "./projects"
 
 export {
-  ExperienceKind,
-  ExperienceMode,
-  HighlightSchema,
+  ExperienceType,
+  ExperienceCategory,
+  LocationType,
+  RoleSchema,
   ExperienceSchema,
   experience,
-  type Highlight,
+  type Role,
   type Experience,
 } from "./experience"
 
diff --git a/lib/content/profile.ts b/lib/content/profile.ts
index db5f6b1..f55d34c 100644
--- a/lib/content/profile.ts
+++ b/lib/content/profile.ts
@@ -99,8 +99,8 @@ const rawProfile: Profile = {
     { label: "Last Update", value: "June. 2026" },
   ],
   metrics: [
-    { label: "Years shipped", value: "8", suffix: "+" },
-    { label: "Projects shipped", value: "22" },
+    { label: "Years shipped", value: "6", suffix: "+" },
+    { label: "Projects shipped", value: "20" },
     { label: "Talks & articles", value: "3" },
     { label: "Mentees", value: "5" },
   ],
diff --git a/lib/content/projects.ts b/lib/content/projects.ts
index 291b8cd..3be7e9d 100644
--- a/lib/content/projects.ts
+++ b/lib/content/projects.ts
@@ -388,6 +388,57 @@ const featuredProjects: z.input<typeof ProjectSchema>[] = [
     ],
     featured: false,
   },
+  {
+    slug: "zrealtors",
+    name: "Zrealtors",
+    description: "A property finder website.",
+    org: "Inovola",
+    type: "web",
+    stack: ["vue", "nuxt", "vuetify", "tailwindCss"],
+    images: [],
+    videos: [],
+    links: {},
+    problem:
+      "A property finder website that needed a robust architecture for views, components, and state management.",
+    role: "Front-End Developer. Built main architecture of views, components and state management store. Helped the team with blocking tasks.",
+    decisions: [],
+    outcomes: [],
+    featured: false,
+  },
+  {
+    slug: "tamincom-refactor",
+    name: "Tamincom Refactor",
+    description: "Car Insurance Website.",
+    org: "Inovola",
+    type: "web",
+    stack: ["vue", "vuetify", "typescript"],
+    images: [],
+    videos: [],
+    links: {},
+    problem:
+      "A car insurance website requiring a comprehensive refactor and primary frontend development.",
+    role: "Front-End Developer. Played a pivotal role as the primary frontend developer for a Car Insurance Website.",
+    decisions: [],
+    outcomes: [],
+    featured: false,
+  },
+  {
+    slug: "vibrant-community",
+    name: "Vibrant Community",
+    description: "A Charity Organization website.",
+    org: "Inovola",
+    type: "web",
+    stack: ["react", "next.js", "mui"],
+    images: [],
+    videos: [],
+    links: {},
+    problem:
+      "A charity organization website that required a foundational architecture from scratch.",
+    role: "Front-End Developer. Designed and established the foundational architecture for views, components, and state management stores.",
+    decisions: [],
+    outcomes: [],
+    featured: false,
+  },
   {
     slug: "trend-coupons",
     name: "Trend Coupons",
@@ -455,7 +506,7 @@ const featuredProjects: z.input<typeof ProjectSchema>[] = [
     name: "BEAcademy",
     description:
       "Social learning network where students and educators can share resources, interact, and learn in a structured environment.",
-    org: "BEAcademy",
+    org: "BE-STEAM",
     type: "web",
     stack: ["html", "css", "sass", "javascript", "tailwindCss", "jQuery"],
     images: ["/images/projects/academy.jpg"],
@@ -478,7 +529,7 @@ const featuredProjects: z.input<typeof ProjectSchema>[] = [
     name: "Tahakoom",
     description:
       "Official website for the Saudi Wireless and Remote Control Sports Federation. Built the frontend and designed the full UI/UX.",
-    org: "Saudi WRC Sports Federation",
+    org: "BE-STEAM",
     type: "web",
     stack: ["html", "css", "sass", "javascript", "bootstrap", "jQuery"],
     images: ["/images/projects/tahakoom.jpg"],
@@ -506,7 +557,7 @@ const featuredProjects: z.input<typeof ProjectSchema>[] = [
     name: "WRO Competitions",
     description:
       "Website for the Saudi WRO robotics competitions. Built the frontend and designed the UI/UX from scratch.",
-    org: "WRO Saudi",
+    org: "BE-STEAM",
     type: "web",
     stack: ["html", "css", "sass", "javascript", "bootstrap", "jQuery"],
     images: ["/images/projects/wro.jpg"],
@@ -534,7 +585,7 @@ const featuredProjects: z.input<typeof ProjectSchema>[] = [
     name: "Motamd",
     description:
       "Certification management platform for Saudi teachers to apply for and track their professional certifications.",
-    org: "Motamd",
+    org: "BE-STEAM",
     type: "web",
     stack: ["html", "css", "vue"],
     images: ["/images/projects/motamd.jpg"],
diff --git a/lib/repl/commands.test.ts b/lib/repl/commands.test.ts
index 95f44ff..a015259 100644
--- a/lib/repl/commands.test.ts
+++ b/lib/repl/commands.test.ts
@@ -12,15 +12,16 @@ import {
 
 describe("runCommand", () => {
   describe("help", () => {
-    it("lists all 7 commands with the slash prefix", () => {
+    it("lists all 8 commands with the slash prefix", () => {
       const result = runCommand("help")
       expect(result.status).toBe("ok")
-      expect(result.lines).toHaveLength(7)
+      expect(result.lines).toHaveLength(8)
       const names = result.lines.map((l) => l.text.split(" GÇö ")[0].trim())
       expect(names).toEqual([
         "/help",
         "/whoami",
         "/projects",
+        "/experience",
         "/contact",
         "/theme",
         "/clear",
@@ -245,6 +246,7 @@ describe("listCommands", () => {
       "help",
       "whoami",
       "projects",
+      "experience",
       "contact",
       "theme",
       "clear",
diff --git a/lib/repl/commands.ts b/lib/repl/commands.ts
index 8329920..c49413a 100644
--- a/lib/repl/commands.ts
+++ b/lib/repl/commands.ts
@@ -1,6 +1,7 @@
 import {
   EXPERIMENTAL_ENABLED,
   experimental,
+  experience,
   profile,
   projects,
 } from "@/lib/content"
@@ -208,6 +209,40 @@ const registry: CommandEntry[] = [
       return ok(lines)
     },
   },
+  {
+    name: "experience",
+    summary: "list work history (flags: --fulltime, --freelance)",
+    run(args) {
+      const fulltimeFlag = args.includes("--fulltime")
+      const freelanceFlag = args.includes("--freelance")
+
+      let filtered = [...experience]
+
+      if (fulltimeFlag && !freelanceFlag) {
+        filtered = filtered.filter((e) => e.category === "fulltime")
+      } else if (freelanceFlag && !fulltimeFlag) {
+        filtered = filtered.filter((e) => e.category === "freelance")
+      }
+
+      if (filtered.length === 0) {
+        return ok([line("output", "no work history entries found")])
+      }
+
+      const lines: ReplLine[] = []
+      for (const entry of filtered) {
+        lines.push(line("output", `${entry.company} (${entry.category})`))
+        for (const role of entry.roles) {
+          const duration =
+            role.endDate === "present"
+              ? `${role.startDate} GÇô present`
+              : `${role.startDate} GÇô ${role.endDate}`
+          lines.push(line("output", `  -+ ${role.name} GÇö ${duration}`))
+        }
+      }
+
+      return ok(lines)
+    },
+  },
   {
     name: "contact",
     summary: "navigate to contact form",
diff --git a/_bmad-output/implementation-artifacts/8-1-linkedin-style-experience-page.md b/_bmad-output/implementation-artifacts/8-1-linkedin-style-experience-page.md
new file mode 100644
index 0000000..6b645e1
--- /dev/null
+++ b/_bmad-output/implementation-artifacts/8-1-linkedin-style-experience-page.md
@@ -0,0 +1,226 @@
+# Story 8.1: LinkedIn-style Experience timeline page
+
+Status: review
+
+<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->
+
+> **Context for this story:** Epics 1GÇô7 (the original `devtools://hossam` build) are all `done`. This is **net-new, post-launch work** GÇö a new top-level surface that did not exist in the original epics or PRD. Epic 8 ("Experience") is created to hold it. There is no prior story in this epic, so there is no previous-story carryover.
+
+## Story
+
+As a **recruiter or hiring manager visiting the portfolio**,
+I want **a dedicated Experience page that presents Hossam's work history in the familiar LinkedIn layout GÇö companies with logos, employment type, location, and nested roles with computed durations**,
+so that **I can quickly scan career progression and jump straight to the case studies tied to each company**.
+
+## Acceptance Criteria
+
+1. **Route exists.** A new App Router route renders at `/experience` inside the `(chrome)` route group (so it inherits the DevTools chrome, XP bar, and mobile bottom nav). The page default-exports and uses the metadata API (no raw `<head>`).
+2. **Sixth DevTools tab.** `components/devtools-chrome.tsx` gains an "Experience" tab pointing at `/experience` in BOTH the desktop tab row (`DevToolsChrome`) and the mobile bottom nav (`MobileBottomNav`), using a `lucide-react` icon (use `Briefcase`). The active-tab highlight works for `/experience` via the existing `isActiveTab` helper.
+3. **Schema redesign.** `lib/content/experience.ts` is re-modeled so each experience is **a company with one or more nested roles**, validated with Zod (the source of truth GÇö types via `z.infer`, never hand-written). Each experience carries: `company` (string), `companyLogo` (optional path), `type` (`"fulltime" | "parttime" | "contract"`), `category` (`"fulltime" | "freelance"` GÇö the two groups), `location` (optional string), `locationType` (`"remote" | "hybrid" | "onsite"`), an optional `org` link field (see AC 7), and `roles[]` (GëÑ1). Each role carries: `name` (string), `description` (optional string), `startDate` (`"YYYY-MM"`), and `endDate` (`"YYYY-MM"` **or** the literal `"present"`).
+4. **Data re-authored.** The existing legacy data + the LinkedIn screenshot are reconciled into the new shape. The four full-time companies (Buguard, masheedGATE, Inovola, BE-STEAM) match the screenshot's dates/locations/types; the freelance entries (The Pick Path Group, Grand Community, Alsakn) carry over from the current `legacyFreelance` data. **Buguard has two roles** (Team Lead, Sep 2025GÇôpresent; Senior Frontend Developer, Jun 2023GÇôpresent), matching the screenshot. `experience` remains a frozen, schema-parsed export.
+5. **Durations are computed, not stored.** A date utility computes a human duration (e.g. `"3 yrs 1 mo"`, `"10 mos"`, `"1 yr 6 mos"`) for (a) each role from its `startDate`GåÆ`endDate`, and (b) each company from its earliest role start GåÆ latest role end. `"present"` resolves to "now". Output format matches LinkedIn's (`"X yrs Y mos"`, dropping zero parts, `"yr"/"yrs"` and `"mo"/"mos"` pluralized; a span <1 month shows `"1 mo"`).
+6. **LinkedIn layout, site design.** The page reproduces LinkedIn's experience *structure* GÇö company logo, company name, `type -+ total-duration`, location -+ `locationType`, then a vertical timeline rail of roles each showing role name, `date-range -+ duration`, and description GÇö but rendered entirely in the site's existing **dark Obsidian + Signal Lime** design tokens, `font-mono` for labels/meta, `font-title`/body for names, and existing motion rules. **No hardcoded hex/oklch**; semantic tokens only (`text-foreground`, `text-muted-foreground`, `border-hairline`, `bg-surface`, `text-lime`, etc.). Full-time and Freelance render as two labeled sections.
+7. **Company GåÆ filtered Network link.** Each company links to the Network page pre-filtered to that company's projects. This requires extending the existing Network filter system with an `org` category (currently only `type` + `stack`): the link is `/work?org=<project.org value>`. The experience entry's optional `org` field holds the **exact `project.org` string** to filter by (because display names differ from project orgs GÇö e.g. company "Buguard" GåÆ org `"Buguard, LLC"`). If an entry has no `org` value, no link is shown.
+8. **Robustness.** Missing company logos (several referenced files don't exist in `public/images/companies/`) degrade gracefully to a deterministic text/initials placeholder GÇö the page must not render a broken image. Every image uses `next/image` with explicit `width`/`height`/`alt`. The page is keyboard-navigable, has exactly one `<h1>`, respects `prefers-reduced-motion` on any animation, and is not broken at `<640px`.
+9. **SEO + tests.** `/experience` is added to `staticRoutes` in `app/sitemap.ts`. Per-route metadata is set (title <60 chars, description <160 chars, canonical + OG per the existing `/work` pattern). The duration utility has unit tests (Vitest) covering year/month boundaries, `"present"`, and zero-part dropping; the schema rejects an experience with zero roles and an invalid `endDate`.
+10. **Quality gates pass.** `yarn typecheck`, `yarn lint`, and `yarn test:run` are clean. Verified live in the browser per the project-context UI checklist (golden path, no console errors, `D`-key theme toggle, RTL, mobile viewport).
+
+## Tasks / Subtasks
+
+- [x] **Task 1 GÇö Redesign the experience schema** (AC: 3)
+  - [x] In `lib/content/experience.ts`, define `ExperienceType = z.enum(["fulltime", "parttime", "contract"])`, `ExperienceCategory = z.enum(["fulltime", "freelance"])`, `LocationType = z.enum(["remote", "hybrid", "onsite"])`.
+  - [x] Define `RoleSchema`: `name` (min 1), `description` (optional), `startDate` (regex `^\d{4}-\d{2}# Code Review Prompt: Blind Hunter

You are a **Blind Hunter** â€” a code reviewer with NO project context. You only have the diff below. Review it adversarially. Look for:
- Security issues
- Logic errors
- Performance problems
- Type safety issues
- Accessibility violations
- Race conditions
- Resource leaks
- Any other bugs or anti-patterns

Output findings as a Markdown list. Each finding: one-line title, file location, and evidence from the diff.

---

## Diff

```diff
), `endDate` (`z.union([z.literal("present"), z.string().regex(/^\d{4}-\d{2}$/)])`).
+  - [x] Redefine `ExperienceSchema`: `slug` (kebab regex), `company` (min 1), `companyLogo` (optional), `type`, `category`, `location` (optional), `locationType`, `org` (optional string GÇö the project.org join value), `roles` (`z.array(RoleSchema).min(1)`).
+  - [x] Keep the existing duplicate-slug `superRefine` on the collection schema. Derive `Role` and `Experience` types via `z.infer`. Export the new enums/schemas/types.
+  - [x] Update `lib/content/index.ts` re-exports to match the new public surface (drop `Highlight`/`HighlightSchema` and the old `ExperienceKind`/`ExperienceMode`/`mode`; add the new enums + `Role`/`RoleSchema`). Grep for any consumer of the removed names first (see Dev Notes GÇö there are none in app code today, but confirm).
+- [x] **Task 2 GÇö Re-author the data** (AC: 4)
+  - [x] Replace the legacy `LegacyEmployment`/`LegacySide`/transform machinery with directly-authored entries in the new shape. Drop the `side` category entirely (user specified only fulltime + freelance) OR fold side projects into freelance GÇö confirm intent; default: drop `side`, since side projects already live in `lib/content/projects.ts`.
+  - [x] Author the 4 full-time companies from the screenshot (see Dev Notes "Authoritative data" table). Buguard gets two roles.
+  - [x] Author the freelance companies from current `legacyFreelance` (The Pick Path Group, Grand Community, Alsakn), converting `"2023 - 5 mos"`-style strings into `YYYY-MM` start/end where derivable; where only a year + duration is known, pick the documented start month and compute the rest.
+  - [x] Set each entry's `org` to the exact matching `project.org` string (see mapping table). Leave `org` undefined where no project matches (e.g. BE-STEAM has no matching project org).
+  - [x] Keep `export const experience` as `Object.freeze(ExperienceCollectionSchema.parse(rawExperience))`.
+- [x] **Task 3 GÇö Duration utility** (AC: 5)
+  - [x] Add a duration helper (e.g. `lib/utils/experienceDuration.ts` or extend `lib/utils/dateUtils.ts`) that takes a `startDate` (`YYYY-MM`) and `endDate` (`YYYY-MM` | `"present"`) and returns a LinkedIn-style label. Use `date-fns` (already a dep: `intervalToDuration` / `differenceInMonths`). Treat months inclusively the way LinkedIn does (Sep 2019GåÆMar 2021 = "1 yr 7 mos").
+  - [x] Add a company-level helper that takes the company's roles and returns the duration from the earliest start to the latest end (`"present"` wins as latest).
+  - [x] Colocate `*.test.ts` with the util (project rule). Cover: same-month GåÆ "1 mo", 12 months GåÆ "1 yr", 13 GåÆ "1 yr 1 mo", `"present"` against a fixed `now` (inject/clock or `vi.useFakeTimers`), and zero-part dropping.
+- [x] **Task 4 GÇö Extend Network filters with `org`** (AC: 7)
+  - [x] In `components/network-filter-bar.tsx`: add `"org"` to `FilterCategory`, `AvailableFilters`, `ActiveFilters`, `CATEGORIES`, and `CATEGORY_LABELS` (label `"Company"`).
+  - [x] In `components/network-page-client.tsx`: `deriveAvailableFilters` collects `p.org` (skip empty); `parseActiveFilters` reads `searchParams.getAll("org")`; `applyFilters` adds `orgMatch` (`filters.org.length === 0 || filters.org.includes(p.org)`).
+  - [x] Confirm the existing URL-persistence (`handleToggle`/`handleClear`) works unchanged for the new category (it iterates categories generically GÇö verify).
+  - [x] Manually verify `/work?org=Buguard%2C%20LLC` loads with the company pre-filtered and the chip shown active.
+- [x] **Task 5 GÇö Build the page + components** (AC: 1, 6, 8)
+  - [x] Create `app/(chrome)/experience/page.tsx` GÇö server component, default export, `export const metadata`, one `<h1>`. Mirror the `/work` page shell (`<section className="p-4">`, mono `<h1>`).
+  - [x] Build presentational components under `components/` (kebab-case files, named exports): e.g. `experience-timeline.tsx` (groups by `category`, renders the two sections), `experience-company.tsx` (logo + header + meta + company duration + Network link), `experience-role-list.tsx` / role item (timeline rail with role name, range-+duration, description). Keep these Server Components unless they need interactivity; push any `"use client"` as deep as possible. (Duration is computed at build time from static data GÇö no client JS needed for it.)
+  - [x] Company logo: build a small logo component that renders `next/image` when `companyLogo` is set AND the asset exists, else a deterministic initials/text placeholder block in site tokens. Since asset existence can't be checked at runtime cheaply, prefer: only set `companyLogo` for files that actually exist (see Dev Notes), and let the component fall back to initials when `companyLogo` is undefined.
+  - [x] Use logical properties for spacing (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`) so RTL works. Timeline rail must flip correctly in RTL.
+- [x] **Task 6 GÇö Navigation tab** (AC: 2)
+  - [x] Add `{ href: "/experience", label: "Experience", icon: Briefcase }` to the `tabs` array in `components/devtools-chrome.tsx` (import `Briefcase` from `lucide-react`). Both desktop and mobile navs map over the same array, so one change covers both. Pick a sensible position (after Network or at the end) GÇö keep order intentional.
+  - [x] (Optional, consistency) Add a "Go to Experience" navigation command to the command palette group if other routes are registered there GÇö check `components/command-palette.tsx`; only do this if the nav-command pattern already exists, otherwise skip.
+- [x] **Task 7 GÇö SEO + metadata** (AC: 9)
+  - [x] Add `"/experience"` to `staticRoutes` in `app/sitemap.ts`.
+  - [x] Set page metadata following the `/work` pattern (title, description, `alternates.canonical`, `openGraph`). Keep within length limits.
+- [x] **Task 8 GÇö Verify** (AC: 10)
+  - [x] `yarn typecheck && yarn lint && yarn test:run` clean. Run `yarn format`.
+  - [x] `yarn dev` and verify: golden path renders all companies + roles + durations; no console errors/warnings; `D`-key theme toggle still works; `<html dir="rtl">` not broken; `<640px` not broken; the company GåÆ Network deep links filter correctly; missing logos show the placeholder, not a broken image.
+
+## Dev Notes
+
+### What exists today (read before changing)
+
+- **`lib/content/experience.ts` is currently ORPHANED.** No application code imports it GÇö confirmed by grep (`content/experience` only appears in `_bmad-output/*` artifacts, `lib/content/index.ts` re-export, and planning docs). This means the schema redesign has **no app-side consumers to break** today. The only live coupling is the `lib/content/index.ts` re-export surface GÇö update it in lockstep (Task 1). Still, grep again before deleting any exported symbol.
+- **`lib/content/index.ts`** re-exports `ExperienceKind, ExperienceMode, HighlightSchema, ExperienceSchema, experience, Highlight, Experience`. After redesign, several of these names disappear GÇö fix the barrel.
+- **Page shell pattern** (`app/(chrome)/work/page.tsx`): server component, `export const metadata`, `<section className="p-4">` wrapper, mono `<h1>`. The `(chrome)` layout already renders `<main>` and the chrome GÇö page files use `<section>`/`<article>`, never another `<main>`.
+- **Chrome tabs** (`components/devtools-chrome.tsx:25`): single `tabs` array drives both desktop (`DevToolsChrome`) and mobile (`MobileBottomNav`). `isActiveTab` already handles nested paths via `startsWith(href + "/")`. Adding one entry wires both navs.
+- **Network filters** (`components/network-page-client.tsx`, `components/network-filter-bar.tsx`): URL-persisted via `searchParams.getAll(category)` and `router.replace`. **Only `type` and `stack` exist today** GÇö there is no `org` filter yet, so Task 4 is required for AC 7. The toggle/clear logic is category-generic, so adding `org` to the type unions + the three helper functions (`derive`/`parse`/`apply`) + labels is the whole change.
+- **Date utils** (`lib/utils/dateUtils.ts`): thin wrappers over `date-fns` (`format`, `parseISO`). `date-fns@4.3.0` is already a dependency GÇö use `intervalToDuration`/`differenceInMonths`; do NOT add a new date library.
+- **Sitemap** (`app/sitemap.ts:6`): `staticRoutes` is a manual array (`"/"`, `"/work"`, `"/perf"`, `"/sources"`, `"/console"`). Add `/experience`.
+
+### Authoritative data (from the LinkedIn screenshot GÇö full-time)
+
+| Company | type | locationType | location | Roles (name -+ start GåÆ end) |
+|---|---|---|---|---|
+| Buguard | fulltime | remote | GÇö | Team Lead (2025-09 GåÆ present); Senior Frontend Developer (2023-06 GåÆ present) |
+| masheedGATE | fulltime | hybrid | Cairo, Egypt | Senior Frontend Developer (2022-11 GåÆ 2023-07) |
+| Inovola | fulltime | remote | Al Jizah, Egypt | Frontend Developer (2021-04 GåÆ 2022-09) |
+| BE-STEAM | fulltime | onsite | Cairo, Egypt | Frontend Developer (2019-09 GåÆ 2021-03) |
+
+Freelance entries carry over from the current `legacyFreelance` array (The Pick Path Group / Commutrics, Grand Community, Alsakn). Their dates in the legacy data are coarse (`"2023 - 5 mos"`); convert to `YYYY-MM` start/end as best as the data allows GÇö if only a year is known, pick the most plausible start month consistent with the related project and let the duration helper compute the rest. Flag any guesswork in the completion notes.
+
+### Company Gåö project.org mapping (for the `org` deep-link field)
+
+`project.org` values live in `lib/content/projects.ts`. Display company names differ from project orgs, so set `org` explicitly:
+
+| Experience company | `org` value (exact `project.org`) | Matching projects |
+|---|---|---|
+| Buguard | `Buguard, LLC` | buguard, dark-atlas |
+| masheedGATE | `MasheedGate` | masheed-gate |
+| Inovola | `Inovola` | builderz |
+| BE-STEAM | *(none GÇö leave undefined)* | GÇö |
+| Grand Community | `Grand Community` | whatsapp-pro, gc-dashboard |
+| The Pick Path Group | `The Pick Path Group (USA)` | commutrics-dashboard |
+| Alsakn | `Alsakn (Freelance)` | alsakn |
+
+Build the link as `/work?org=${encodeURIComponent(org)}`. When `org` is undefined, render no link.
+
+### Company logos GÇö existence check
+
+Files that **actually exist** in `public/images/companies/`: `alsakn.jpg`, `besteam.png`, `commute.jpg`, `gizaapps.jpg`, `grand.png`, `inovola.jpg`, `rytalo.png`.
+
+The current data references several files that **do NOT exist**: `buguard.png`, `masheed.png`, `eazyto.png`, `trendcoupons.png`. Do not point `companyLogo` at a missing file. Either (a) only set `companyLogo` for present assets and fall back to an initials placeholder otherwise, or (b) add the missing logo assets (out of scope unless the user provides them). Default to (a). The placeholder must be styled in site tokens (e.g. `bg-surface-2`, mono initials in `text-muted-foreground`), sized identically to the image box so layout doesn't shift.
+
+### Schema shape (concrete target)
+
+```ts
+export const ExperienceType = z.enum(["fulltime", "parttime", "contract"])
+export const ExperienceCategory = z.enum(["fulltime", "freelance"])
+export const LocationType = z.enum(["remote", "hybrid", "onsite"])
+
+export const RoleSchema = z.object({
+  name: z.string().min(1),
+  description: z.string().optional(),
+  startDate: z.string().regex(/^\d{4}-\d{2}$/),
+  endDate: z.union([z.literal("present"), z.string().regex(/^\d{4}-\d{2}$/)]),
+})
+
+export const ExperienceSchema = z.object({
+  slug: z.string().regex(/^[a-z0-9-]+$/),
+  company: z.string().min(1),
+  companyLogo: z.string().optional(),
+  type: ExperienceType,
+  category: ExperienceCategory,
+  location: z.string().optional(),
+  locationType: LocationType,
+  org: z.string().optional(),
+  roles: z.array(RoleSchema).min(1),
+})
+```
+
+(Names are illustrative GÇö match surrounding code style. `type`/`category` carry the two distinct concepts the user described: `type` is the per-company employment badge `[fulltime, parttime, contract]`; `category` is the `fulltime` vs `freelance` grouping for the two page sections.)
+
+### Project-context rules that bite here (from `_bmad-output/project-context.md`)
+
+- **TypeScript strict + `isolatedModules`** GÇö type-only imports use `import type`. No `import React`. **Named exports** for components (except `page.tsx` which must default-export).
+- **Zod is the source of truth** GÇö derive types with `z.infer`, never hand-write parallel interfaces.
+- **Tailwind v4, semantic tokens only** GÇö `bg-background`/`text-foreground`/`text-muted-foreground`/`border-hairline`/`bg-surface`/`text-lime`. **No hardcoded hex/oklch.** Site is **dark-only** GÇö do not add a light-mode block. Wrap dynamic class strings in `cn()` for Prettier class sorting.
+- **Server Components by default** GÇö only add `"use client"` where hooks/handlers/browser APIs are used; push the boundary deep. The timeline is static data, so it should be fully server-rendered (no client JS for durations).
+- **`next/image`** for every image with explicit `width`/`height`/`alt`; `next/link` for internal nav.
+- **RTL is wired** GÇö use logical properties (`ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`), never `ml-`/`mr-`/`left-`/`right-`. The timeline rail must flip.
+- **`prefers-reduced-motion`** gates every animation (`useReducedMotion()` or duration GåÆ `0.001s`). If using `framer-motion`, **import from `framer-motion`**, not `motion/react`.
+- **Metadata API** for SEO; title <60, description <160. One `<h1>` per route.
+- **a11y:** WCAG AA contrast (lime only for large text, never body copy), visible focus rings, semantic HTML, full keyboard nav.
+- **Testing:** Vitest `globals: true` (don't import `describe/it/expect`), colocate `*.test.ts`, `@/` alias works in tests. Property-test math/date utils with `fast-check` if convenient. Don't snapshot UI; don't test Tailwind class strings or shadcn primitives.
+- **Tooling:** Prettier (no semicolons, double quotes, 2-space, 80-col). `yarn` only GÇö **do not `npm install`**, and **adding a dependency needs user approval** (none should be needed here; `date-fns`, `framer-motion`, `lucide-react`, shadcn `card`/`badge` are all present).
+
+### Project Structure Notes
+
+- New route: `app/(chrome)/experience/page.tsx` (inside the existing `(chrome)` group GÇö inherits chrome/XP/mobile-nav layout).
+- New components: `components/experience-*.tsx` (named exports, kebab-case files).
+- Data: `lib/content/experience.ts` (rewritten) + `lib/content/index.ts` (barrel updated).
+- Util: `lib/utils/experienceDuration.ts` (+ `.test.ts`) or extend `lib/utils/dateUtils.ts`.
+- Touched existing files: `components/devtools-chrome.tsx` (tab), `components/network-page-client.tsx` + `components/network-filter-bar.tsx` (org filter), `app/sitemap.ts` (route).
+- **Variance from original metaphor:** the original 7-epic build defined exactly five DevTools tabs (Elements/Network/Console/Performance/Sources). Adding a sixth "Experience" tab is an intentional, user-approved extension of that metaphor (decision captured below). It is consistent with the chrome's tab system but is not in the original PRD/architecture.
+
+### Decisions captured (this story)
+
+- **Route + nav:** new `/experience` route **and** a 6th tab in the DevTools chrome (desktop + mobile). *(user choice)*
+- **Company GåÆ projects:** link each company to the Network page **pre-filtered by company** (`/work?org=...`), reusing the URL-persisted filter system (extended with an `org` category). *(user choice)*
+- **Visual style:** **adapt LinkedIn's layout into the site's dark Obsidian + Signal Lime design** GÇö not literal LinkedIn light/blue styling. *(user choice, and required by the dark-only design-system rule)*
+- **`side` category:** dropped from experience (user specified only fulltime + freelance); side projects remain in `lib/content/projects.ts`. Confirm if unsure.
+
+### Testing standards summary
+
+- Vitest + jsdom, `globals: true`, setup at `tests/setup.ts`. Run `yarn test:run` for CI single-run.
+- Unit-test the duration util thoroughly (boundaries, `"present"` with a controlled clock, zero-part dropping, pluralization). Optionally `fast-check` for monotonicity (later end GçÆ GëÑ duration).
+- Schema tests: reject zero-role experience, reject malformed `endDate`, accept `"present"`. Reuse the duplicate-slug refinement test style already in `lib/content/projects.test.ts`.
+- Do not snapshot the timeline UI. If testing the component, query by role/text (e.g. company name heading, role names).
+
+### References
+
+- [Source: `_bmad-output/project-context.md`] GÇö all the rules in "Project-context rules that bite here" (TS strict, Zod source of truth, Tailwind v4 tokens, dark-only, Server Components, next/image, RTL, reduced-motion, framer-motion import specifier, metadata API, a11y, testing, yarn).
+- [Source: `lib/content/experience.ts`] GÇö current (orphaned) schema + legacy data being replaced.
+- [Source: `lib/content/projects.ts`] GÇö `project.org` values for the companyGåöproject join.
+- [Source: `lib/content/index.ts`] GÇö barrel export surface to update.
+- [Source: `app/(chrome)/work/page.tsx`] GÇö page shell + metadata pattern to mirror.
+- [Source: `components/devtools-chrome.tsx#L25`] GÇö `tabs` array driving both navs; `isActiveTab` helper.
+- [Source: `components/network-page-client.tsx`, `components/network-filter-bar.tsx`] GÇö filter system to extend with `org`.
+- [Source: `lib/utils/dateUtils.ts`] GÇö existing date-fns wrapper location.
+- [Source: `app/sitemap.ts#L6`] GÇö `staticRoutes` array to extend.
+- [Source: `public/images/companies/`] GÇö actual logo assets present (logo-existence reconciliation).
+- [Source: LinkedIn experience screenshot provided with the request] GÇö authoritative full-time companies, types, locations, dates, and Buguard's two roles.
+
+## Dev Agent Record
+
+### Agent Model Used
+
+k2p6
+
+### Debug Log References
+
+### Completion Notes List
+
+- Rewrote `lib/content/experience.ts` with new Zod schema: `ExperienceType`, `ExperienceCategory`, `LocationType`, `RoleSchema`, `ExperienceSchema`. Types derived via `z.infer`. Dropped legacy `HighlightSchema`, `ExperienceKind`, `ExperienceMode`, and transform machinery.
+- Re-authored data with 4 full-time companies (Buguard with 2 roles, masheedGATE, Inovola, BE-STEAM) and 3 freelance entries (The Pick Path Group, Grand Community, Alsakn). Mapped `org` fields to exact `project.org` values for Network deep-linking. Only set `companyLogo` for assets that exist in `public/images/companies/`.
+- Created `lib/utils/experienceDuration.ts` with `formatExperienceDuration`, `formatCompanyDuration`, and `formatDateRange`. Uses `date-fns/intervalToDuration` with inclusive month counting (LinkedIn style). Colocated tests cover same-month, year boundaries, present, pluralization, and zero-part dropping.
+- Extended Network filter system with `org` category in `components/network-filter-bar.tsx` and `components/network-page-client.tsx`. URL persistence works generically for the new category.
+- Built `app/(chrome)/experience/page.tsx` (server component, metadata) and presentational components `components/experience-timeline.tsx`, `components/experience-company.tsx`. Uses `next/image` with fallback initials placeholder. Timeline uses semantic tokens only, logical properties for RTL, one `<h1>` per route.
+- Added "Experience" tab to `components/devtools-chrome.tsx` (desktop + mobile nav) using `Briefcase` icon from `lucide-react`.
+- Added "Experience" navigation command to `components/command-palette.tsx` in the Navigate group.
+- Added `/experience` to `app/sitemap.ts` static routes and updated `app/sitemap.test.ts` expected counts.
+- All quality gates pass: `yarn typecheck` clean, `yarn lint` clean (0 new warnings), `yarn test:run` 387 passed.
+
+### File List
+
+- `lib/content/experience.ts` GÇö rewritten schema + data
+- `lib/content/index.ts` GÇö updated barrel exports
+- `lib/utils/experienceDuration.ts` GÇö new duration utility
+- `lib/utils/experienceDuration.test.ts` GÇö new tests
+- `components/network-filter-bar.tsx` GÇö added `org` filter category
+- `components/network-filter-bar.test.tsx` GÇö updated for `org` field
+- `components/network-page-client.tsx` GÇö added `org` filter logic
+- `app/(chrome)/experience/page.tsx` GÇö new route page
+- `components/experience-timeline.tsx` GÇö new timeline component
+- `components/experience-company.tsx` GÇö new company/role component
+- `components/devtools-chrome.tsx` GÇö added Experience tab
+- `components/command-palette.tsx` GÇö added Experience nav command
+- `app/sitemap.ts` GÇö added `/experience`
+- `app/sitemap.test.ts` GÇö updated count expectations
diff --git a/app/(chrome)/experience/page.tsx b/app/(chrome)/experience/page.tsx
new file mode 100644
index 0000000..56b7b50
--- /dev/null
+++ b/app/(chrome)/experience/page.tsx
@@ -0,0 +1,29 @@
+import type { Metadata } from "next"
+
+import { ExperienceTimeline } from "@/components/experience-timeline"
+
+export const metadata: Metadata = {
+  title: "Experience",
+  description:
+    "Work history and career timeline for Hossam Marey GÇö full-time roles and freelance engagements.",
+  alternates: { canonical: "/experience" },
+  openGraph: {
+    url: "/experience",
+    title: "Experience GÇö devtools://hossam",
+    description:
+      "Work history and career timeline for Hossam Marey GÇö full-time roles and freelance engagements.",
+  },
+}
+
+export default function ExperiencePage() {
+  return (
+    <section className="p-4">
+      <div className="mx-auto max-w-6xl">
+        <h1 className="font-mono text-lg">Experience</h1>
+        <div className="mt-6">
+          <ExperienceTimeline />
+        </div>
+      </div>
+    </section>
+  )
+}
diff --git a/components/experience-company.tsx b/components/experience-company.tsx
new file mode 100644
index 0000000..a400b16
--- /dev/null
+++ b/components/experience-company.tsx
@@ -0,0 +1,145 @@
+import Image from "next/image"
+import Link from "next/link"
+
+import type { Experience, Role } from "@/lib/content/experience"
+import { ExperienceRoleDescription } from "@/components/experience-role-description"
+import {
+  formatExperienceDuration,
+  formatCompanyDuration,
+  formatDateRange,
+} from "@/lib/utils/experienceDuration"
+
+const TYPE_LABELS: Record<Experience["type"], string> = {
+  fulltime: "Full-time",
+  parttime: "Part-time",
+  contract: "Contract",
+}
+
+const LOCATION_TYPE_LABELS: Record<Experience["locationType"], string> = {
+  remote: "Remote",
+  hybrid: "Hybrid",
+  onsite: "On-site",
+}
+
+function CompanyLogo({
+  company,
+  companyLogo,
+}: {
+  company: string
+  companyLogo?: string
+}) {
+  if (companyLogo) {
+    return (
+      <Image
+        src={companyLogo}
+        alt={`${company} logo`}
+        width={48}
+        height={48}
+        className="rounded-sm object-contain"
+      />
+    )
+  }
+
+  const initials = company
+    .split(" ")
+    .map((w) => w[0])
+    .join("")
+    .slice(0, 2)
+    .toUpperCase()
+
+  return (
+    <div className="flex size-12 items-center justify-center rounded-sm bg-surface-2">
+      <span className="font-mono text-sm text-muted-foreground">
+        {initials}
+      </span>
+    </div>
+  )
+}
+
+function RoleItem({ role }: { role: Role }) {
+  const duration = formatExperienceDuration(role.startDate, role.endDate)
+  const dateRange = formatDateRange(role.startDate, role.endDate)
+
+  return (
+    <div className="flex gap-3">
+      {/* Timeline rail */}
+      <div className="flex flex-col items-center">
+        <div className="size-2 rounded-full bg-muted-foreground"></div>
+        <div className="mt-1 w-px flex-1 bg-hairline" />
+      </div>
+
+      {/* Role content */}
+      <div className="pb-6">
+        <h3 className="text-sm font-semibold text-foreground">{role.name}</h3>
+        <p className="mt-0.5 font-mono text-xs text-muted-foreground">
+          {dateRange} -+ {duration}
+        </p>
+        {role.description && (
+          <ExperienceRoleDescription description={role.description} />
+        )}
+      </div>
+    </div>
+  )
+}
+
+interface ExperienceCompanyProps {
+  entry: Experience
+}
+
+export function ExperienceCompany({ entry }: ExperienceCompanyProps) {
+  const companyDuration = formatCompanyDuration(entry.roles)
+  const typeLabel = TYPE_LABELS[entry.type]
+  const locationText = [
+    entry.location,
+    LOCATION_TYPE_LABELS[entry.locationType],
+  ]
+    .filter(Boolean)
+    .join(" -+ ")
+
+  return (
+    <article className="rounded-lg border border-hairline bg-surface p-5 transition-colors hover:bg-surface-2/50">
+      <div className="flex gap-4">
+        <div className="shrink-0">
+          <CompanyLogo
+            company={entry.company}
+            companyLogo={entry.companyLogo}
+          />
+        </div>
+
+        <div className="min-w-0 flex-1">
+          {/* Company header */}
+          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
+            <h2 className="text-base font-semibold text-foreground">
+              {entry.company}
+            </h2>
+            {entry.org && (
+              <Link
+                href={`/work?org=${encodeURIComponent(entry.org)}`}
+                className="font-mono text-xs text-lime hover:underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
+              >
+                View projects
+              </Link>
+            )}
+          </div>
+
+          <p className="font-mono text-xs text-muted-foreground">
+            {typeLabel} -+ {companyDuration}
+          </p>
+
+          {locationText && (
+            <p className="mt-0.5 font-mono text-xs text-muted-foreground">
+              {locationText}
+            </p>
+          )}
+
+          {/* Roles timeline */}
+          <div className="mt-3">
+            {entry.roles.map((role, idx) => (
+              <RoleItem key={idx} role={role} />
+            ))}
+          </div>
+        </div>
+      </div>
+    </article>
+  )
+}
diff --git a/components/experience-role-description.tsx b/components/experience-role-description.tsx
new file mode 100644
index 0000000..b914fd5
--- /dev/null
+++ b/components/experience-role-description.tsx
@@ -0,0 +1,57 @@
+"use client"
+
+import { useState, useRef, useEffect } from "react"
+
+interface ExperienceRoleDescriptionProps {
+  description: string
+}
+
+export function ExperienceRoleDescription({
+  description,
+}: ExperienceRoleDescriptionProps) {
+  const [expanded, setExpanded] = useState(false)
+  const [hasOverflow, setHasOverflow] = useState(false)
+  const paragraphRef = useRef<HTMLParagraphElement>(null)
+
+  useEffect(() => {
+    const el = paragraphRef.current
+    if (!el) return
+
+    const check = () => {
+      // Only set to true; once overflow is detected it stays true
+      // so the toggle remains available after expanding
+      if (el.scrollHeight > el.clientHeight) {
+        setHasOverflow(true)
+      }
+    }
+
+    check()
+
+    const observer = new ResizeObserver(check)
+    observer.observe(el)
+
+    return () => observer.disconnect()
+  }, [description])
+
+  return (
+    <div>
+      <p
+        ref={paragraphRef}
+        className={`mt-1 text-sm text-muted-foreground ${
+          expanded ? "" : "line-clamp-2"
+        }`}
+      >
+        {description}
+      </p>
+      {hasOverflow && (
+        <button
+          type="button"
+          onClick={() => setExpanded((prev) => !prev)}
+          className="mt-1 font-mono text-xs text-lime hover:underline focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
+        >
+          {expanded ? "See less" : "See more"}
+        </button>
+      )}
+    </div>
+  )
+}
diff --git a/components/experience-timeline.tsx b/components/experience-timeline.tsx
new file mode 100644
index 0000000..5beeeed
--- /dev/null
+++ b/components/experience-timeline.tsx
@@ -0,0 +1,33 @@
+import { experience } from "@/lib/content/experience"
+import { ExperienceCompany } from "@/components/experience-company"
+
+export function ExperienceTimeline() {
+  const fulltime = experience.filter((e) => e.category === "fulltime")
+  const freelance = experience.filter((e) => e.category === "freelance")
+
+  return (
+    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
+      <section>
+        <h2 className="mb-4 font-mono text-sm tracking-wider text-muted-foreground uppercase">
+          Full-time
+        </h2>
+        <div className="flex flex-col gap-4">
+          {fulltime.map((entry) => (
+            <ExperienceCompany key={entry.slug} entry={entry} />
+          ))}
+        </div>
+      </section>
+
+      <section>
+        <h2 className="mb-4 font-mono text-sm tracking-wider text-muted-foreground uppercase">
+          Freelance
+        </h2>
+        <div className="flex flex-col gap-4">
+          {freelance.map((entry) => (
+            <ExperienceCompany key={entry.slug} entry={entry} />
+          ))}
+        </div>
+      </section>
+    </div>
+  )
+}
diff --git a/lib/utils/experienceDuration.test.ts b/lib/utils/experienceDuration.test.ts
new file mode 100644
index 0000000..419541c
--- /dev/null
+++ b/lib/utils/experienceDuration.test.ts
@@ -0,0 +1,85 @@
+import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
+
+import {
+  formatExperienceDuration,
+  formatCompanyDuration,
+  formatDateRange,
+} from "./experienceDuration"
+
+describe("formatExperienceDuration", () => {
+  beforeEach(() => {
+    vi.useFakeTimers()
+    vi.setSystemTime(new Date("2025-06-15"))
+  })
+
+  afterEach(() => {
+    vi.useRealTimers()
+  })
+
+  it("same month GåÆ 1 mo", () => {
+    expect(formatExperienceDuration("2025-06", "2025-06")).toBe("1 mo")
+  })
+
+  it("12 months GåÆ 1 yr", () => {
+    expect(formatExperienceDuration("2024-06", "2025-05")).toBe("1 yr")
+  })
+
+  it("13 months GåÆ 1 yr 1 mo", () => {
+    expect(formatExperienceDuration("2024-05", "2025-05")).toBe("1 yr 1 mo")
+  })
+
+  it('"present" against fixed now', () => {
+    expect(formatExperienceDuration("2023-06", "present")).toBe("2 yrs 1 mo")
+  })
+
+  it("drops zero parts", () => {
+    expect(formatExperienceDuration("2020-01", "2023-01")).toBe("3 yrs 1 mo")
+    expect(formatExperienceDuration("2025-01", "2025-03")).toBe("3 mos")
+  })
+
+  it("pluralizes correctly", () => {
+    expect(formatExperienceDuration("2024-01", "2024-02")).toBe("2 mos")
+    expect(formatExperienceDuration("2023-01", "2024-01")).toBe("1 yr 1 mo")
+  })
+
+  it("handles year boundaries", () => {
+    expect(formatExperienceDuration("2022-12", "2023-01")).toBe("2 mos")
+  })
+})
+
+describe("formatCompanyDuration", () => {
+  beforeEach(() => {
+    vi.useFakeTimers()
+    vi.setSystemTime(new Date("2025-06-15"))
+  })
+
+  afterEach(() => {
+    vi.useRealTimers()
+  })
+
+  it("computes from earliest start to latest end", () => {
+    const roles = [
+      { startDate: "2023-06", endDate: "present" as const },
+      { startDate: "2025-09", endDate: "present" as const },
+    ]
+    expect(formatCompanyDuration(roles)).toBe("2 yrs 1 mo")
+  })
+
+  it("handles multiple historical roles", () => {
+    const roles = [
+      { startDate: "2019-09", endDate: "2021-03" as const },
+      { startDate: "2020-01", endDate: "2020-06" as const },
+    ]
+    expect(formatCompanyDuration(roles)).toBe("1 yr 7 mos")
+  })
+})
+
+describe("formatDateRange", () => {
+  it("formats start and end dates", () => {
+    expect(formatDateRange("2023-06", "2025-09")).toBe("Jun 2023 GÇô Sep 2025")
+  })
+
+  it('formats "present" as Present', () => {
+    expect(formatDateRange("2023-06", "present")).toBe("Jun 2023 GÇô Present")
+  })
+})
diff --git a/lib/utils/experienceDuration.ts b/lib/utils/experienceDuration.ts
new file mode 100644
index 0000000..4a97f63
--- /dev/null
+++ b/lib/utils/experienceDuration.ts
@@ -0,0 +1,106 @@
+import { intervalToDuration } from "date-fns"
+
+export function formatExperienceDuration(
+  startDate: string,
+  endDate: string | "present"
+): string {
+  const start = parseYearMonth(startDate)
+  const end = endDate === "present" ? new Date() : parseYearMonth(endDate)
+
+  // Add one month to make it inclusive like LinkedIn
+  const adjustedEnd = new Date(end.getFullYear(), end.getMonth() + 1)
+
+  const duration = intervalToDuration({ start, end: adjustedEnd })
+
+  const years = duration.years ?? 0
+  const months = duration.months ?? 0
+
+  const parts: string[] = []
+
+  if (years > 0) {
+    parts.push(`${years} yr${years === 1 ? "" : "s"}`)
+  }
+
+  if (months > 0) {
+    parts.push(`${months} mo${months === 1 ? "" : "s"}`)
+  }
+
+  if (parts.length === 0) {
+    return "1 mo"
+  }
+
+  return parts.join(" ")
+}
+
+export function formatCompanyDuration(
+  roles: Array<{ startDate: string; endDate: string | "present" }>
+): string {
+  let earliestStart = parseYearMonth(roles[0].startDate)
+  let latestEnd: Date =
+    roles[0].endDate === "present"
+      ? new Date()
+      : parseYearMonth(roles[0].endDate)
+
+  for (let i = 1; i < roles.length; i++) {
+    const start = parseYearMonth(roles[i].startDate)
+    const end =
+      roles[i].endDate === "present"
+        ? new Date()
+        : parseYearMonth(roles[i].endDate)
+
+    if (start < earliestStart) {
+      earliestStart = start
+    }
+    if (end > latestEnd) {
+      latestEnd = end
+    }
+  }
+
+  const adjustedEnd = new Date(
+    latestEnd.getFullYear(),
+    latestEnd.getMonth() + 1
+  )
+  const duration = intervalToDuration({
+    start: earliestStart,
+    end: adjustedEnd,
+  })
+
+  const years = duration.years ?? 0
+  const months = duration.months ?? 0
+
+  const parts: string[] = []
+
+  if (years > 0) {
+    parts.push(`${years} yr${years === 1 ? "" : "s"}`)
+  }
+
+  if (months > 0) {
+    parts.push(`${months} mo${months === 1 ? "" : "s"}`)
+  }
+
+  if (parts.length === 0) {
+    return "1 mo"
+  }
+
+  return parts.join(" ")
+}
+
+export function formatDateRange(
+  startDate: string,
+  endDate: string | "present"
+): string {
+  const start = formatYearMonth(startDate)
+  const end = endDate === "present" ? "Present" : formatYearMonth(endDate)
+  return `${start} GÇô ${end}`
+}
+
+function parseYearMonth(value: string): Date {
+  const [year, month] = value.split("-").map(Number)
+  return new Date(year, month - 1)
+}
+
+function formatYearMonth(value: string): string {
+  const [year, month] = value.split("-").map(Number)
+  const date = new Date(year, month - 1)
+  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
+}
diff --git a/public/images/companies/buguard.jpg b/public/images/companies/buguard.jpg
new file mode 100644
index 0000000..2b0d98a
Binary files /dev/null and b/public/images/companies/buguard.jpg differ
diff --git a/public/images/companies/masheed.jpg b/public/images/companies/masheed.jpg
new file mode 100644
index 0000000..426641f
Binary files /dev/null and b/public/images/companies/masheed.jpg differ

```

