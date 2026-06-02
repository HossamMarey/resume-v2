import { describe, expect, it } from "vitest"

import robots from "./robots"
import { SITE_URL } from "@/lib/site"

describe("robots.ts", () => {
  const result = robots()

  it("allows crawling of all public content", () => {
    expect(result.rules).toMatchObject({
      userAgent: "*",
      allow: "/",
    })
  })

  it("disallows /api/", () => {
    expect(result.rules).toMatchObject({
      disallow: "/api/",
    })
  })

  it("declares absolute sitemap URL", () => {
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`)
    expect(result.sitemap).toMatch(/^https?:\/\//)
  })

  it("declares host", () => {
    expect(result.host).toBe(SITE_URL)
    expect(result.host).toMatch(/^https?:\/\//)
  })
})
