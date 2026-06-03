import fc from "fast-check"

import {
  ProjectSchema,
  ProjectsCollectionSchema,
  projectLinkList,
} from "./projects"

describe("ProjectSchema", () => {
  it("parses minimal {slug, name, description} and applies defaults", () => {
    const result = ProjectSchema.parse({
      slug: "test-project",
      name: "Test Project",
      description: "A test project",
    })
    expect(result).toMatchObject({
      slug: "test-project",
      name: "Test Project",
      description: "A test project",
      org: "",
      type: "web",
      stack: [],
      images: [],
      videos: [],
      links: {},
      problem: "",
      role: "",
      decisions: [],
      outcomes: [],
      featured: false,
    })
  })

  it("rejects missing slug", () => {
    expect(() => ProjectSchema.parse({ name: "X", description: "Y" })).toThrow()
  })

  it("rejects missing name", () => {
    expect(() => ProjectSchema.parse({ slug: "x", description: "Y" })).toThrow()
  })

  it("rejects missing description", () => {
    expect(() => ProjectSchema.parse({ slug: "x", name: "X" })).toThrow()
  })

  it("rejects bad slug format", () => {
    expect(() =>
      ProjectSchema.parse({
        slug: "Bad Slug!",
        name: "X",
        description: "Y",
      })
    ).toThrow()
  })

  it("rejects duplicate slugs in collection", () => {
    const items = [
      { slug: "dup", name: "A", description: "A desc" },
      { slug: "dup", name: "B", description: "B desc" },
    ]
    const result = ProjectsCollectionSchema.safeParse(items)
    expect(result.success).toBe(false)
  })

  it("rejects non-URL links", () => {
    expect(() =>
      ProjectSchema.parse({
        slug: "x",
        name: "X",
        description: "Y",
        links: { preview: "not-a-url" },
      })
    ).toThrow()
  })

  it("accepts valid links object", () => {
    const result = ProjectSchema.parse({
      slug: "x",
      name: "X",
      description: "Y",
      links: {
        preview: "https://example.com",
        code: "https://github.com/example",
      },
    })
    expect(result.links.preview).toBe("https://example.com")
    expect(result.links.code).toBe("https://github.com/example")
  })

  it("accepts local image/video paths", () => {
    const result = ProjectSchema.parse({
      slug: "x",
      name: "X",
      description: "Y",
      images: ["/images/projects/test.jpg"],
      videos: ["/videos/demo.mp4"],
    })
    expect(result.images).toEqual(["/images/projects/test.jpg"])
    expect(result.videos).toEqual(["/videos/demo.mp4"])
  })

  it("accepts remote image/video URLs", () => {
    const result = ProjectSchema.parse({
      slug: "x",
      name: "X",
      description: "Y",
      images: ["https://images.unsplash.com/photo-123"],
      videos: ["https://www.pexels.com/download/video/31289616/"],
    })
    expect(result.images).toHaveLength(1)
    expect(result.videos).toHaveLength(1)
  })
})

describe("ProjectSchema fast-check fuzz", () => {
  it("any valid minimal object never throws and yields all defaulted fields", () => {
    fc.assert(
      fc.property(
        fc.record({
          slug: fc.stringMatching(/^[a-z0-9-]+$/).filter((s) => s.length > 0),
          name: fc.string({ minLength: 1 }),
          description: fc.string({ minLength: 1 }),
        }),
        (input) => {
          const result = ProjectSchema.parse(input)
          expect(result.type).toBe("web")
          expect(result.links).toEqual({})
          expect(result.images).toEqual([])
          expect(result.videos).toEqual([])
          expect(result.featured).toBe(false)
          expect(result.stack).toEqual([])
        }
      )
    )
  })
})

describe("projectLinkList", () => {
  it("returns stable order: preview, code, design, repo, docs", () => {
    const links = {
      docs: "https://docs.example.com",
      preview: "https://example.com",
      code: "https://github.com/example",
      design: "https://figma.com/example",
      repo: "https://gitlab.com/example",
    }
    const result = projectLinkList(links)
    expect(result.map((l) => l.kind)).toEqual([
      "preview",
      "code",
      "design",
      "repo",
      "docs",
    ])
  })

  it("omits absent keys", () => {
    const result = projectLinkList({ preview: "https://example.com" })
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      label: "Live Preview",
      href: "https://example.com",
      kind: "preview",
    })
  })

  it("returns empty array for empty links", () => {
    expect(projectLinkList({})).toEqual([])
  })

  it("has correct human labels", () => {
    const links = {
      preview: "https://a.com",
      code: "https://b.com",
      design: "https://c.com",
      repo: "https://d.com",
      docs: "https://e.com",
    }
    const result = projectLinkList(links)
    expect(result.map((l) => l.label)).toEqual([
      "Live Preview",
      "Source Code",
      "Design",
      "Repository",
      "Documentation",
    ])
  })
})
