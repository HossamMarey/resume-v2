import { projects, experience } from "@/lib/content"

test("no featured project is still mock", () => {
  const offenders = projects
    .filter((p) => p.featured && p.meta.mock)
    .map((p) => p.slug)

  expect(
    offenders,
    `featured projects still mock: ${offenders.join(", ")}`
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
