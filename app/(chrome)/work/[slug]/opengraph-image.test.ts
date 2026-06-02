import { describe, expect, it } from "vitest"

import OpenGraphImage, {
  alt,
  contentType,
  generateStaticParams,
  size,
} from "./opengraph-image"
import { projects } from "@/lib/content/projects"

describe("app/(chrome)/work/[slug]/opengraph-image.tsx", () => {
  it("exports correct size", () => {
    expect(size).toEqual({ width: 1200, height: 630 })
  })

  it("exports correct contentType", () => {
    expect(contentType).toBe("image/png")
  })

  it("exports non-empty alt", () => {
    expect(typeof alt).toBe("string")
    expect(alt.length).toBeGreaterThan(0)
  })

  it("generateStaticParams returns featured slugs only", () => {
    const params = generateStaticParams()
    const featured = projects.filter((p) => p.featured)

    expect(params.length).toBe(featured.length)

    for (const project of featured) {
      expect(params).toContainEqual({ slug: project.slug })
    }
  })

  it("default export is a function", () => {
    expect(typeof OpenGraphImage).toBe("function")
  })
})
