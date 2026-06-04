import { describe, expect, it } from "vitest"

import sitemap from "./sitemap"
import { projects } from "@/lib/content/projects"
import { siteUrl, SITE_URL } from "@/lib/site"

describe("sitemap.ts", () => {
  const result = sitemap()
  const urls = result.map((entry) => entry.url)
  const featured = projects.filter((p) => p.featured)

  it("returns an array", () => {
    expect(Array.isArray(result)).toBe(true)
  })

  it("every url is absolute", () => {
    for (const entry of result) {
      expect(entry.url).toMatch(/^https?:\/\//)
      expect(entry.url.startsWith(SITE_URL)).toBe(true)
    }
  })

  it("includes all 6 static routes", () => {
    const staticRoutes = [
      "/",
      "/work",
      "/sources",
      "/console",
      "/recruiter",
      "/experience",
    ]
    for (const path of staticRoutes) {
      expect(urls).toContain(siteUrl(path))
    }
  })

  it("includes every featured project slug", () => {
    for (const project of featured) {
      expect(urls).toContain(siteUrl(`/work/${project.slug}`))
    }
  })

  it("has no duplicate URLs", () => {
    const unique = new Set(urls)
    expect(unique.size).toBe(urls.length)
  })

  it("has correct total count", () => {
    expect(result.length).toBe(6 + featured.length)
  })

  it("does not set lastModified to new Date()", () => {
    for (const entry of result) {
      expect(entry.lastModified).not.toBeInstanceOf(Date)
    }
  })
})
