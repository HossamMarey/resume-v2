import { projects, experience } from "@/lib/content"
import { hasPlaceholder } from "@/lib/content/has-placeholder"

test("no featured project has placeholder content", () => {
  const offenders = projects
    .filter((p) => p.featured && hasPlaceholder(p))
    .map((p) => p.slug)

  expect(
    offenders,
    `featured projects still have placeholders: ${offenders.join(", ")}`
  ).toEqual([])
})

test("referential integrity of project slug references", () => {
  const slugs = new Set(projects.map((p) => p.slug))

  for (const e of experience) {
    const refs = (e as { projectSlugs?: string[] }).projectSlugs ?? []
    for (const ref of refs) {
      expect(
        slugs.has(ref),
        `experience entry references unknown slug: ${ref}`
      ).toBe(true)
    }
  }
})
