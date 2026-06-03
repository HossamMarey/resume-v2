import { hasPlaceholder } from "./has-placeholder"

import type { Project } from "./projects"

function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    slug: "test",
    name: "Test",
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
    ...overrides,
  }
}

describe("hasPlaceholder", () => {
  it("returns false for clean project", () => {
    expect(hasPlaceholder(makeProject())).toBe(false)
  })

  it("flags [PLACEHOLDER in description", () => {
    expect(
      hasPlaceholder(makeProject({ description: "[PLACEHOLDER — todo]" }))
    ).toBe(true)
  })

  it("flags [PLACEHOLDER in problem", () => {
    expect(
      hasPlaceholder(makeProject({ problem: "[PLACEHOLDER — todo]" }))
    ).toBe(true)
  })

  it("flags [PLACEHOLDER in role", () => {
    expect(hasPlaceholder(makeProject({ role: "[PLACEHOLDER — todo]" }))).toBe(
      true
    )
  })

  it("flags [PLACEHOLDER in decisions", () => {
    expect(
      hasPlaceholder(makeProject({ decisions: ["[PLACEHOLDER] decision"] }))
    ).toBe(true)
  })

  it("flags [MOCK] in outcomes", () => {
    expect(hasPlaceholder(makeProject({ outcomes: ["[MOCK] outcome"] }))).toBe(
      true
    )
  })

  it("does not flag partial word 'placeholder'", () => {
    expect(
      hasPlaceholder(makeProject({ description: "This is a placeholder" }))
    ).toBe(false)
  })

  it("does not flag lowercase [mock]", () => {
    expect(
      hasPlaceholder(makeProject({ description: "[mock] lowercase" }))
    ).toBe(false)
  })
})
