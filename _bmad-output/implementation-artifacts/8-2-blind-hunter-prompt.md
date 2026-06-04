# Blind Hunter Review Prompt

You are a **Blind Hunter** — a cynical, adversarial code reviewer. You receive ONLY a diff, with ZERO project context, spec, or domain knowledge. Your job is to find bugs, mistakes, and suspicious patterns purely from the code itself.

## Rules

- Be ruthless. Assume the author is wrong until the code proves otherwise.
- Do not guess intent. If something looks odd, flag it.
- Focus on: bugs, logic errors, race conditions, off-by-one errors, stale data, inconsistent state, missing error handling, suspicious fallthroughs, unreachable code, typos in strings/URLs, incorrect conditionals.
- Ignore: naming preferences, style nits, architectural suggestions (you have no context).

## Diff to Review

```diff
diff --git a/app/sitemap.test.ts b/app/sitemap.test.ts
index 46ea66e..31a0292 100644
--- a/app/sitemap.test.ts
+++ b/app/sitemap.test.ts
@@ -20,11 +20,10 @@ describe("sitemap.ts", () => {
     }
   })
 
-  it("includes all 7 static routes", () => {
+  it("includes all 6 static routes", () => {
     const staticRoutes = [
       "/",
       "/work",
-      "/perf",
       "/sources",
       "/console",
       "/recruiter",
@@ -47,7 +46,7 @@ describe("sitemap.ts", () => {
   })
 
   it("has correct total count", () => {
-    expect(result.length).toBe(7 + featured.length)
+    expect(result.length).toBe(6 + featured.length)
   })
 
   it("does not set lastModified to new Date()", () => {
diff --git a/app/sitemap.ts b/app/sitemap.ts
index e005b14..4a2c979 100644
--- a/app/sitemap.ts
+++ b/app/sitemap.ts
@@ -6,7 +6,6 @@ import { siteUrl } from "@/lib/site"
 const staticRoutes = [
   "/",
   "/work",
-  "/perf",
   "/sources",
   "/console",
   "/recruiter",
diff --git a/components/command-palette.test.tsx b/components/command-palette.test.tsx
index 215fe8c..b9659e3 100644
--- a/components/command-palette.test.tsx
+++ b/components/command-palette.test.tsx
@@ -202,15 +202,17 @@ describe("CommandPalette", () => {
     expect(screen.getByText("Socials")).toBeInTheDocument()
   })
 
-  it("shows Navigate items", () => {
+  it("shows Navigate items in chrome tab order", () => {
     render(<CommandPalette />)
     fireEvent.keyDown(window, { key: "k", metaKey: true })
     expect(screen.getByText("Elements")).toBeInTheDocument()
+    expect(screen.getByText("Experience")).toBeInTheDocument()
     expect(screen.getByText("Network")).toBeInTheDocument()
     expect(screen.getByText("Console")).toBeInTheDocument()
-    expect(screen.getByText("Performance")).toBeInTheDocument()
     expect(screen.getByText("Sources")).toBeInTheDocument()
+    expect(screen.getByText("Contact")).toBeInTheDocument()
     expect(screen.getByText("Recruiter")).toBeInTheDocument()
+    expect(screen.queryByText("Performance")).not.toBeInTheDocument()
   })
 
   it("navigates to Console", async () => {
diff --git a/components/command-palette.tsx b/components/command-palette.tsx
index 66bbe41..80f562d 100644
--- a/components/command-palette.tsx
+++ b/components/command-palette.tsx
@@ -115,6 +115,21 @@ export function CommandPalette() {
           >
             Elements
           </CommandItem>
+          <CommandItem
+            value="Experience"
+            keywords={[
+              "work",
+              "history",
+              "career",
+              "jobs",
+              "timeline",
+              "linkedin",
+              "resume",
+            ]}
+            onSelect={() => handleNavigate("/experience")}
+          >
+            Experience
+          </CommandItem>
           <CommandItem
             value="Network"
             keywords={["work", "projects"]}
@@ -129,13 +144,6 @@ export function CommandPalette() {
           >
             Console
           </CommandItem>
-          <CommandItem
-            value="Performance"
-            keywords={["perf", "metrics", "speed"]}
-            onSelect={() => handleNavigate("/perf")}
-          >
-            Performance
-          </CommandItem>
           <CommandItem
             value="Sources"
             keywords={["files", "code", "tree"]}
@@ -143,18 +151,11 @@ export function CommandPalette() {
           >
             Sources
           </CommandItem>
-          <CommandItem
-            value="Experience"
-            keywords={["work", "history", "career", "jobs"]}
-            onSelect={() => handleNavigate("/experience")}
-          >
-            Experience
-          </CommandItem>
 
           <CommandItem
             value="Contact"
             keywords={["contact", "message", "email", "phone", "address"]}
-            onSelect={() => handleNavigate("/sources?tab=contact")}
+            onSelect={() => handleNavigate("/sources")}
           >
             Contact
           </CommandItem>
diff --git a/components/recruiter-resume.test.tsx b/components/recruiter-resume.test.tsx
index 5e757c7..665224e 100644
--- a/components/recruiter-resume.test.tsx
+++ b/components/recruiter-resume.test.tsx
@@ -1,7 +1,7 @@
 import { render, screen } from "@testing-library/react"
 
 import { RecruiterResume } from "@/components/recruiter-resume"
-import { profile, projects, skillGroups } from "@/lib/content"
+import { experience, profile, projects, skillGroups } from "@/lib/content"
 
 const featuredProjects = projects.filter((p) => p.featured)
 
@@ -84,4 +84,33 @@ describe("RecruiterResume", () => {
     expect(mailtoLinks).toHaveLength(1)
     expect(mailtoLinks[0]).toHaveAttribute("href", emailSocial!.href)
   })
+
+  it("renders Experience section with at least one company and role", () => {
+    render(<RecruiterResume />)
+    expect(
+      screen.getByRole("heading", { name: "Experience" })
+    ).toBeInTheDocument()
+    expect(
+      screen.getAllByText(experience[0].company).length
+    ).toBeGreaterThanOrEqual(1)
+    expect(
+      screen.getByText(new RegExp(experience[0].roles[0].name))
+    ).toBeInTheDocument()
+  })
+
+  it("renders Full-time and Freelance subsection headings when data exists", () => {
+    render(<RecruiterResume />)
+    const hasFulltime = experience.some((e) => e.category === "fulltime")
+    const hasFreelance = experience.some((e) => e.category === "freelance")
+    if (hasFulltime) {
+      expect(
+        screen.getByRole("heading", { name: "Full-time" })
+      ).toBeInTheDocument()
+    }
+    if (hasFreelance) {
+      expect(
+        screen.getByRole("heading", { name: "Freelance" })
+      ).toBeInTheDocument()
+    }
+  })
 })
diff --git a/components/recruiter-resume.tsx b/components/recruiter-resume.tsx
index 4e036b7..d1f4a53 100644
--- a/components/recruiter-resume.tsx
+++ b/components/recruiter-resume.tsx
@@ -7,7 +7,12 @@ import {
   CardHeader,
   CardTitle,
 } from "@/components/ui/card"
-import { profile, projects, skillGroups } from "@/lib/content"
+import { experience, profile, projects, skillGroups } from "@/lib/content"
+import {
+  formatCompanyDuration,
+  formatDateRange,
+  formatExperienceDuration,
+} from "@/lib/utils/experienceDuration"
 
 export function RecruiterResume() {
   const featuredProjects = projects.filter((p) => p.featured)
@@ -73,6 +78,71 @@ export function RecruiterResume() {
         </div>
       </section>
 
+      {/* Experience */}
+      <section className="flex flex-col gap-6">
+        <h2 className="font-title text-2xl font-semibold tracking-tight text-foreground">
+          Experience
+        </h2>
+        <div className="flex flex-col gap-8">
+          {(
+            [
+              { key: "fulltime", label: "Full-time" },
+              { key: "freelance", label: "Freelance" },
+            ] as const
+          ).map(({ key, label }) => {
+            const items = experience.filter((e) => e.category === key)
+            if (items.length === 0) return null
+            return (
+              <div key={key} className="flex flex-col gap-4">
+                <h3 className="text-sm font-medium tracking-wider text-muted-foreground uppercase">
+                  {label}
+                </h3>
+                <div className="flex flex-col gap-6">
+                  {items.map((entry) => (
+                    <div key={entry.slug} className="flex flex-col gap-2">
+                      <div className="flex flex-col gap-1">
+                        <span className="font-medium text-foreground">
+                          {entry.company}
+                        </span>
+                        <span className="font-mono text-xs text-muted-foreground">
+                          {entry.type}
+                          {" · "}
+                          {formatCompanyDuration(entry.roles)}
+                          {entry.location && entry.locationType
+                            ? ` · ${entry.location} · ${entry.locationType}`
+                            : entry.location
+                              ? ` · ${entry.location}`
+                              : entry.locationType
+                                ? ` · ${entry.locationType}`
+                                : ""}
+                        </span>
+                      </div>
+                      <ul className="flex flex-col gap-1">
+                        {entry.roles.map((role) => (
+                          <li
+                            key={role.name}
+                            className="text-sm text-foreground"
+                          >
+                            {role.name}
+                            {" · "}
+                            {formatDateRange(role.startDate, role.endDate)}
+                            {" · "}
+                            {formatExperienceDuration(
+                              role.startDate,
+                              role.endDate
+                            )}
+                          </li>
+                        ))}
+                      </ul>
+                    </div>
+                  ))}
+                </div>
+              </div>
+            )
+          })}
+        </div>
+      </section>
+
       {/* Skills matrix */}
       <section className="flex flex-col gap-6">
         <h2 className="font-title text-2xl font-semibold tracking-tight text-foreground">
diff --git a/lib/repl/commands.test.ts b/lib/repl/commands.test.ts
index a015259..63dd5ca 100644
--- a/lib/repl/commands.test.ts
+++ b/lib/repl/commands.test.ts
@@ -58,7 +58,7 @@ describe("runCommand", () => {
       const text = result.lines.map((l) => l.text).join("\n")
       expect(text).toContain("Hossam Marey")
       expect(text).toContain("Senior Front-End Developer")
-      expect(text).toContain("8+")
+      expect(text).toMatch(/\d+\+/)
       expect(text).toContain("Egypt")
       expect(text).toContain(profile.tagline)
     })
@@ -70,6 +70,58 @@ describe("runCommand", () => {
     })
   })
 
+  describe("experience", () => {
+    it("returns a list of work history entries", () => {
+      const result = runCommand("experience")
+      expect(result.status).toBe("ok")
+      expect(result.lines.length).toBeGreaterThan(0)
+      expect(result.lines[0].text).toContain("(")
+    })
+
+    it("filters to fulltime with --fulltime", () => {
+      const result = runCommand("experience --fulltime")
+      expect(result.status).toBe("ok")
+      expect(result.lines.length).toBeGreaterThan(0)
+      for (const line of result.lines) {
+        expect(line.text).not.toContain("freelance")
+      }
+    })
+
+    it("filters to freelance with --freelance", () => {
+      const result = runCommand("experience --freelance")
+      expect(result.status).toBe("ok")
+      expect(result.lines.length).toBeGreaterThan(0)
+      for (const line of result.lines) {
+        expect(line.text).not.toContain("freelance")
+    })
+
+    it("returns error for conflicting flags", () => {
+      const result = runCommand("experience --fulltime --freelance")
+      expect(result.status).toBe("ok")
+      const text = result.lines.map((l) => l.text).join("\n")
+      expect(text).toContain("cannot use both")
+    })
+
+    it("returns error for unknown flag", () => {
+      const result = runCommand("experience --unknown")
+      expect(result.status).toBe("ok")
+      const text = result.lines.map((l) => l.text).join("\n")
+      expect(text).toContain("unknown flag")
+      expect(text).toContain("usage:")
+    })
+
+    it("formats durations using the duration utility", () => {
+      const result = runCommand("experience")
+      expect(result.status).toBe("ok")
+      // At least one line should contain a duration like "yr" or "mo"
+      const hasDuration = result.lines.some(
+        (l) => l.text.includes("yr") || l.text.includes("mo")
+      )
+      expect(hasDuration).toBe(true)
+    })
+  })
+
   describe("projects", () => {
     it("returns numbered list with name, type, and optional stack", () => {
       const result = runCommand("projects")
diff --git a/lib/repl/commands.ts b/lib/repl/commands.ts
index c49413a..906859f 100644
--- a/lib/repl/commands.ts
+++ b/lib/repl/commands.ts
@@ -5,6 +5,10 @@ import {
   profile,
   projects,
 } from "@/lib/content"
+import {
+  formatExperienceDuration,
+  formatDateRange,
+} from "@/lib/utils/experienceDuration"
 
 export type ReplLineKind = "output" | "notice" | "error"
 
@@ -213,14 +217,32 @@ const registry: CommandEntry[] = [
     name: "experience",
     summary: "list work history (flags: --fulltime, --freelance)",
     run(args) {
+      const knownFlags = new Set(["--fulltime", "--freelance"])
+      const unknownFlag = args.find(
+        (a) => a.startsWith("--") && !knownFlags.has(a)
+      )
+      if (unknownFlag) {
+        return ok([
+          line("output", `unknown flag: ${unknownFlag}`),
+          line("output", "usage: experience [--fulltime] [--freelance]"),
+        ])
+      }
+
       const fulltimeFlag = args.includes("--fulltime")
       const freelanceFlag = args.includes("--freelance")
 
+      if (fulltimeFlag && freelanceFlag) {
+        return ok([
+          line("output", "cannot use both --fulltime and --freelance"),
+          line("output", "usage: experience [--fulltime] [--freelance]"),
+        ])
+      }
+
       let filtered = [...experience]
 
-      if (fulltimeFlag && !freelanceFlag) {
+      if (fulltimeFlag) {
         filtered = filtered.filter((e) => e.category === "fulltime")
-      } else if (freelanceFlag && !fulltimeFlag) {
+      } else if (freelanceFlag) {
         filtered = filtered.filter((e) => e.category === "freelance")
       }
 
@@ -232,11 +254,14 @@ const registry: CommandEntry[] = [
       for (const entry of filtered) {
         lines.push(line("output", `${entry.company} (${entry.category})`))
         for (const role of entry.roles) {
-          const duration =
-            role.endDate === "present"
-              ? `${role.startDate} – present`
-              : `${role.startDate} – ${role.endDate}`
-          lines.push(line("output", `  · ${role.name} — ${duration}`))
+          const duration = formatExperienceDuration(
+            role.startDate,
+            role.endDate
+          )
+          const dateRange = formatDateRange(role.startDate, role.endDate)
+          lines.push(
+            line("output", `  · ${role.name} — ${dateRange} · ${duration}`)
+          )
         }
       }
 
```

## Output Format

Produce a Markdown list of findings. Each finding:
- **Title**: one-line description of the issue
- **Evidence**: which file(s) and line(s) from the diff
- **Severity**: Must Fix / Should Fix / Question

If you find nothing, say "No findings."
