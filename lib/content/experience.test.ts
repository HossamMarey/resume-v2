import {
  ExperienceSchema,
  ExperienceCollectionSchema,
  RoleSchema,
  experience,
} from "./experience"

describe("RoleSchema", () => {
  it("accepts a valid role with present endDate", () => {
    const result = RoleSchema.safeParse({
      name: "Developer",
      startDate: "2023-01",
      endDate: "present",
    })
    expect(result.success).toBe(true)
  })

  it("accepts a valid role with YYYY-MM endDate", () => {
    const result = RoleSchema.safeParse({
      name: "Developer",
      startDate: "2023-01",
      endDate: "2024-06",
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty name", () => {
    const result = RoleSchema.safeParse({
      name: "",
      startDate: "2023-01",
      endDate: "present",
    })
    expect(result.success).toBe(false)
  })

  it("rejects a whitespace-only name", () => {
    const result = RoleSchema.safeParse({
      name: "   ",
      startDate: "2023-01",
      endDate: "present",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid startDate format", () => {
    const result = RoleSchema.safeParse({
      name: "Developer",
      startDate: "2023-1",
      endDate: "present",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid month in startDate", () => {
    const result = RoleSchema.safeParse({
      name: "Developer",
      startDate: "2023-13",
      endDate: "present",
    })
    expect(result.success).toBe(false)
  })

  it("rejects an invalid endDate format", () => {
    const result = RoleSchema.safeParse({
      name: "Developer",
      startDate: "2023-01",
      endDate: "2024-6",
    })
    expect(result.success).toBe(false)
  })

  it("rejects endDate before startDate", () => {
    const result = RoleSchema.safeParse({
      name: "Developer",
      startDate: "2024-06",
      endDate: "2023-01",
    })
    expect(result.success).toBe(false)
  })

  it("accepts endDate equal to startDate", () => {
    const result = RoleSchema.safeParse({
      name: "Developer",
      startDate: "2023-06",
      endDate: "2023-06",
    })
    expect(result.success).toBe(true)
  })
})

describe("ExperienceSchema", () => {
  it("accepts a valid experience entry", () => {
    const result = ExperienceSchema.safeParse({
      slug: "acme",
      company: "Acme",
      type: "fulltime",
      category: "fulltime",
      locationType: "remote",
      roles: [
        {
          name: "Developer",
          startDate: "2023-01",
          endDate: "present",
        },
      ],
    })
    expect(result.success).toBe(true)
  })

  it("rejects an empty roles array", () => {
    const result = ExperienceSchema.safeParse({
      slug: "acme",
      company: "Acme",
      type: "fulltime",
      category: "fulltime",
      locationType: "remote",
      roles: [],
    })
    expect(result.success).toBe(false)
  })

  it("rejects a slug with leading hyphen", () => {
    const result = ExperienceSchema.safeParse({
      slug: "-acme",
      company: "Acme",
      type: "fulltime",
      category: "fulltime",
      locationType: "remote",
      roles: [
        {
          name: "Developer",
          startDate: "2023-01",
          endDate: "present",
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("rejects a whitespace-only company name", () => {
    const result = ExperienceSchema.safeParse({
      slug: "acme",
      company: "   ",
      type: "fulltime",
      category: "fulltime",
      locationType: "remote",
      roles: [
        {
          name: "Developer",
          startDate: "2023-01",
          endDate: "present",
        },
      ],
    })
    expect(result.success).toBe(false)
  })

  it("trims whitespace from company name", () => {
    const result = ExperienceSchema.safeParse({
      slug: "acme",
      company: "  Acme  ",
      type: "fulltime",
      category: "fulltime",
      locationType: "remote",
      roles: [
        {
          name: "Developer",
          startDate: "2023-01",
          endDate: "present",
        },
      ],
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.company).toBe("Acme")
    }
  })
})

describe("ExperienceCollectionSchema", () => {
  it("rejects duplicate slugs", () => {
    const result = ExperienceCollectionSchema.safeParse([
      {
        slug: "acme",
        company: "Acme",
        type: "fulltime",
        category: "fulltime",
        locationType: "remote",
        roles: [{ name: "Dev", startDate: "2023-01", endDate: "present" }],
      },
      {
        slug: "acme",
        company: "Acme 2",
        type: "fulltime",
        category: "fulltime",
        locationType: "remote",
        roles: [{ name: "Dev", startDate: "2023-01", endDate: "present" }],
      },
    ])
    expect(result.success).toBe(false)
  })
})

describe("experience data", () => {
  it("has at least one entry", () => {
    expect(experience.length).toBeGreaterThan(0)
  })

  it("has no duplicate slugs", () => {
    const slugs = experience.map((e) => e.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it("every entry has at least one role", () => {
    for (const entry of experience) {
      expect(entry.roles.length).toBeGreaterThan(0)
    }
  })
})
