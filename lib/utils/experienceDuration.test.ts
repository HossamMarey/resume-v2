import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

import {
  formatExperienceDuration,
  formatCompanyDuration,
  formatDateRange,
} from "./experienceDuration"

describe("formatExperienceDuration", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-06-15"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("same month → 1 mo", () => {
    expect(formatExperienceDuration("2025-06", "2025-06")).toBe("1 mo")
  })

  it("12 months → 1 yr", () => {
    expect(formatExperienceDuration("2024-06", "2025-05")).toBe("1 yr")
  })

  it("13 months → 1 yr 1 mo", () => {
    expect(formatExperienceDuration("2024-05", "2025-05")).toBe("1 yr 1 mo")
  })

  it('"present" against fixed now', () => {
    expect(formatExperienceDuration("2023-06", "present")).toBe("2 yrs 1 mo")
  })

  it("drops zero parts", () => {
    expect(formatExperienceDuration("2020-01", "2023-01")).toBe("3 yrs 1 mo")
    expect(formatExperienceDuration("2025-01", "2025-03")).toBe("3 mos")
  })

  it("pluralizes correctly", () => {
    expect(formatExperienceDuration("2024-01", "2024-02")).toBe("2 mos")
    expect(formatExperienceDuration("2023-01", "2024-01")).toBe("1 yr 1 mo")
  })

  it("handles year boundaries", () => {
    expect(formatExperienceDuration("2022-12", "2023-01")).toBe("2 mos")
  })
})

describe("formatCompanyDuration", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2025-06-15"))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("computes from earliest start to latest end", () => {
    const roles = [
      { startDate: "2023-06", endDate: "present" as const },
      { startDate: "2025-09", endDate: "present" as const },
    ]
    expect(formatCompanyDuration(roles)).toBe("2 yrs 1 mo")
  })

  it("handles multiple historical roles", () => {
    const roles = [
      { startDate: "2019-09", endDate: "2021-03" as const },
      { startDate: "2020-01", endDate: "2020-06" as const },
    ]
    expect(formatCompanyDuration(roles)).toBe("1 yr 7 mos")
  })
})

describe("formatDateRange", () => {
  it("formats start and end dates", () => {
    expect(formatDateRange("2023-06", "2025-09")).toBe("Jun 2023 – Sep 2025")
  })

  it('formats "present" as Present', () => {
    expect(formatDateRange("2023-06", "present")).toBe("Jun 2023 – Present")
  })
})
