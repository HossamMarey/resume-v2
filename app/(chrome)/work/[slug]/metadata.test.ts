import { describe, expect, it } from "vitest"

import { generateMetadata } from "./page"

describe("generateMetadata", () => {
  it("returns featured project metadata with ≤60 title and ≤160 description", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "buguard" }),
    })

    expect(meta.title).toEqual({ absolute: expect.any(String) })
    const title = (meta.title as { absolute: string }).absolute
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title).toContain("Buguard")

    expect(meta.description).toBeTruthy()
    expect(String(meta.description).length).toBeLessThanOrEqual(160)

    expect(meta.alternates).toEqual({ canonical: "/work/buguard" })
    expect(meta.openGraph).toMatchObject({
      type: "article",
      url: "/work/buguard",
      title,
      description: meta.description,
    })
  })

  it("returns fallback for non-featured slug", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "not-a-project" }),
    })

    expect(meta.title).toEqual({
      absolute: "Project Detail — devtools://hossam",
    })
    const title = (meta.title as { absolute: string }).absolute
    expect(title.length).toBeLessThanOrEqual(60)
    expect(meta.alternates).toEqual({ canonical: "/work/not-a-project" })
    expect(meta.description).toBeTruthy()
  })

  it("returns fallback for legacy (non-featured) slug", async () => {
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: "eazy-to" }),
    })

    expect(meta.title).toEqual({
      absolute: "Project Detail — devtools://hossam",
    })
  })
})
