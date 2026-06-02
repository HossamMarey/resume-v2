import { describe, expect, it } from "vitest"

import {
  clampLength,
  firstSentence,
  siteUrl,
  SITE_DESCRIPTION_DEFAULT,
  absoluteTitleForProject,
  titleForSegment,
} from "./site"

describe("site helpers", () => {
  it("siteUrl joins without double slashes", () => {
    expect(siteUrl("/work/x")).toBe("https://hossammarey.com/work/x")
    expect(siteUrl("work/x")).toBe("https://hossammarey.com/work/x")
    expect(siteUrl("/")).toBe("https://hossammarey.com/")
  })

  it("SITE_DESCRIPTION_DEFAULT is ≤160 chars", () => {
    expect(SITE_DESCRIPTION_DEFAULT.length).toBeLessThanOrEqual(160)
  })

  it("firstSentence extracts the first sentence", () => {
    expect(firstSentence("Hello world. This is more.")).toBe("Hello world.")
    expect(firstSentence("No period here")).toBe("No period here")
  })

  it("firstSentence clamps to 160", () => {
    const long = "A".repeat(200)
    expect(firstSentence(long).length).toBeLessThanOrEqual(160)
  })

  it("clampLength trims and clamps", () => {
    expect(clampLength("short", 10)).toBe("short")
    expect(clampLength("A".repeat(200), 50).length).toBeLessThanOrEqual(50)
  })

  it("titleForSegment stays ≤60 with template", () => {
    const seg = titleForSegment("Elements")
    expect(`${seg} — devtools://hossam`.length).toBeLessThanOrEqual(60)
  })

  it("absoluteTitleForProject clamps long names", () => {
    const title = absoluteTitleForProject(
      "Very Long Project Name That Exceeds Limits"
    )
    expect(title.length).toBeLessThanOrEqual(60)
    expect(title).toContain(" — devtools://hossam")
  })

  it("absoluteTitleForProject keeps short names intact", () => {
    const title = absoluteTitleForProject("Buguard")
    expect(title).toBe("Buguard — devtools://hossam")
    expect(title.length).toBeLessThanOrEqual(60)
  })
})
