import {
  SkillSchema,
  allSkills,
  primarySkills,
  skillGroups,
} from "@/lib/content/skills"

describe("primarySkills selector", () => {
  it("is non-empty", () => {
    expect(primarySkills.length).toBeGreaterThan(0)
  })

  it("contains only primary-tier skills", () => {
    for (const skill of primarySkills) {
      expect(skill.tier).toBe("primary")
    }
  })
})

describe("allSkills selector", () => {
  it("is non-empty", () => {
    expect(allSkills.length).toBeGreaterThan(0)
  })

  it("includes every skill from every group with no drops", () => {
    const total = skillGroups.reduce((sum, g) => sum + g.skills.length, 0)
    expect(allSkills).toHaveLength(total)
  })

  it("has unique skill names (names are used as React keys)", () => {
    const names = allSkills.map((s) => s.name)
    expect(new Set(names).size).toBe(names.length)
  })

  it("is a superset of primarySkills", () => {
    expect(allSkills.length).toBeGreaterThanOrEqual(primarySkills.length)
    for (const skill of primarySkills) {
      expect(allSkills).toContain(skill)
    }
  })
})

describe("SkillSchema", () => {
  it("accepts a valid skill with tier", () => {
    const result = SkillSchema.safeParse({
      name: "Test Skill",
      level: 1,
      tier: "primary",
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.tier).toBe("primary")
    }
  })

  it("rejects an invalid tier value", () => {
    const result = SkillSchema.safeParse({
      name: "Test Skill",
      level: 1,
      tier: "invalid",
    })
    expect(result.success).toBe(false)
  })
})
