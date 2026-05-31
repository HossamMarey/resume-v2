import { render, screen } from "@testing-library/react"

import { CaseStudyPager } from "@/components/case-study-pager"

vi.mock("@/lib/content/projects", () => ({
  projects: [
    {
      slug: "buguard",
      name: "Buguard",
      org: "Buguard, LLC",
      method: "GET",
      status: "shipped",
      statusCode: 200,
      type: "web",
      size: "Enterprise",
      sizeWeight: 0.9,
      time: "12 mo",
      timeWeight: 0.8,
      startOffset: 0,
      year: 2022,
      stack: ["react", "typescript"],
      problem: "test",
      role: "dev",
      decisions: [],
      outcomes: [],
      links: [],
      featured: true,
      meta: { mock: false },
    },
    {
      slug: "dark-atlas",
      name: "Dark Atlas",
      org: "Dark Atlas, Inc",
      method: "GET",
      status: "shipped",
      statusCode: 200,
      type: "web",
      size: "Large",
      sizeWeight: 0.7,
      time: "10 mo",
      timeWeight: 0.6,
      startOffset: 0.1,
      year: 2023,
      stack: ["react", "typescript"],
      problem: "test",
      role: "dev",
      decisions: [],
      outcomes: [],
      links: [],
      featured: true,
      meta: { mock: false },
    },
    {
      slug: "masheed-gate",
      name: "Masheed Gate",
      org: "Masheed",
      method: "GET",
      status: "shipped",
      statusCode: 200,
      type: "web",
      size: "Large",
      sizeWeight: 0.8,
      time: "8 mo",
      timeWeight: 0.6,
      startOffset: 0.15,
      year: 2023,
      stack: ["react", "typescript"],
      problem: "test",
      role: "dev",
      decisions: [],
      outcomes: [],
      links: [],
      featured: true,
      meta: { mock: true },
    },
    {
      slug: "legacy-project",
      name: "Legacy Project",
      org: "",
      method: "GET",
      status: "archived",
      statusCode: 200,
      type: "web",
      size: "5 MB",
      sizeWeight: 0.3,
      time: "3 mo",
      timeWeight: 0.15,
      startOffset: 0,
      year: 2021,
      stack: ["html"],
      problem: "",
      role: "",
      decisions: [],
      outcomes: [],
      links: [],
      featured: false,
      meta: { mock: false },
    },
  ],
}))

describe("CaseStudyPager", () => {
  it("renders nav with correct aria-label", () => {
    render(<CaseStudyPager slug="dark-atlas" />)
    expect(
      screen.getByRole("navigation", { name: "Case study pager" })
    ).toBeInTheDocument()
  })

  it("middle item links prev to first and next to last by declaration order", () => {
    render(<CaseStudyPager slug="dark-atlas" />)
    const prevLink = screen.getByRole("link", {
      name: "Previous case study: Buguard",
    })
    const nextLink = screen.getByRole("link", {
      name: "Next case study: Masheed Gate",
    })
    expect(prevLink).toHaveAttribute("href", "/work/buguard")
    expect(nextLink).toHaveAttribute("href", "/work/masheed-gate")
  })

  it("first item's prev wraps to last featured", () => {
    render(<CaseStudyPager slug="buguard" />)
    const prevLink = screen.getByRole("link", {
      name: "Previous case study: Masheed Gate",
    })
    expect(prevLink).toHaveAttribute("href", "/work/masheed-gate")
  })

  it("last item's next wraps to first featured", () => {
    render(<CaseStudyPager slug="masheed-gate" />)
    const nextLink = screen.getByRole("link", {
      name: "Next case study: Buguard",
    })
    expect(nextLink).toHaveAttribute("href", "/work/buguard")
  })

  it("renders null when fewer than 2 featured projects exist", () => {
    const { container } = render(<CaseStudyPager slug="non-featured" />)
    expect(container.firstChild).toBeNull()
  })
})
