import { describe, expect, it } from "vitest"

import OpenGraphImage, { alt, contentType, size } from "./opengraph-image"

describe("app/opengraph-image.tsx", () => {
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

  it("default export is a function", () => {
    expect(typeof OpenGraphImage).toBe("function")
  })
})
