import { describe, expect, it } from "vitest"

import { OG_CONTENT_TYPE, OG_SIZE, renderOgImage } from "./og"

describe("lib/og.tsx", () => {
  it("OG_SIZE is 1200x630", () => {
    expect(OG_SIZE).toEqual({ width: 1200, height: 630 })
  })

  it("OG_CONTENT_TYPE is image/png", () => {
    expect(OG_CONTENT_TYPE).toBe("image/png")
  })

  it("renderOgImage returns a defined element", () => {
    const el = renderOgImage({ title: "Test" })
    expect(el).toBeDefined()
    expect(el.props).toBeDefined()
  })

  it("renderOgImage includes title", () => {
    const el = renderOgImage({ title: "Hello" })
    const json = JSON.stringify(el)
    expect(json).toContain("Hello")
  })

  it("renderOgImage includes subtitle when provided", () => {
    const el = renderOgImage({ title: "Hello", subtitle: "World" })
    const json = JSON.stringify(el)
    expect(json).toContain("World")
  })
})
