import {
  pageWeightBudget,
  PageWeightItemSchema,
} from "@/lib/content/page-weight"

describe("page-weight data", () => {
  it("is non-empty", () => {
    expect(pageWeightBudget.length).toBeGreaterThan(0)
  })

  it("has valid items per schema", () => {
    for (const item of pageWeightBudget) {
      const result = PageWeightItemSchema.safeParse(item)
      expect(result.success).toBe(true)
    }
  })

  it("every item has bytes >= 0", () => {
    for (const item of pageWeightBudget) {
      expect(item.bytes).toBeGreaterThanOrEqual(0)
    }
  })

  it("every colorToken starts with chart-", () => {
    for (const item of pageWeightBudget) {
      expect(item.colorToken).toMatch(/^chart-/)
    }
  })
})
