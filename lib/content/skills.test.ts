import { SkillSchema, primarySkills } from "@/lib/content/skills"

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
