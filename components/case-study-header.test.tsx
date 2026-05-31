import React from "react"

import { render, screen } from "@testing-library/react"

import { CaseStudyHeader } from "@/components/case-study-header"
import { useShouldAnimate } from "@/hooks/use-should-animate"

import type { Project } from "@/lib/content/projects"

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: vi.fn(),
}))

vi.mock("framer-motion", () => ({
  motion: {
    span: (props: React.ComponentPropsWithoutRef<"span"> & {
      children?: React.ReactNode
      layout?: boolean | string
      layoutId?: string
    }) => {
      const { children, layout: _l, layoutId: _lid, ...rest } = props
      void _l; void _lid
      return <span {...rest}>{children}</span>
    },
  },
}))

const mockUseShouldAnimate = vi.mocked(useShouldAnimate)

const featuredProject: Project = {
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
  problem: "A cybersecurity platform challenge.",
  role: "Lead front-end developer.",
  decisions: ["Chose Next.js for SSR"],
  outcomes: ["Improved load time by 40%"],
  links: [{ label: "Preview", href: "https://example.com" }],
  featured: true,
  meta: { mock: false },
}

describe("CaseStudyHeader", () => {
  beforeEach(() => {
    mockUseShouldAnimate.mockReturnValue(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.unstubAllEnvs()
  })

  it("renders one h1 with the project name", () => {
    render(<CaseStudyHeader project={featuredProject} />)
    const headings = screen.getAllByRole("heading", { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent("Buguard")
  })

  it("renders a breadcrumb link to /work", () => {
    render(<CaseStudyHeader project={featuredProject} />)
    const breadcrumb = screen.getByRole("navigation", {
      name: "Breadcrumb",
    })
    const link = screen.getByRole("link", { name: "Network" })
    expect(breadcrumb).toContainElement(link)
    expect(link).toHaveAttribute("href", "/work")
  })

  it("does not show [MOCK] badge when meta.mock is false", () => {
    vi.stubEnv("NODE_ENV", "development")
    render(<CaseStudyHeader project={featuredProject} />)
    expect(screen.queryByText("[MOCK]")).not.toBeInTheDocument()
  })

  it("shows [MOCK] badge when meta.mock is true and not in production", () => {
    vi.stubEnv("NODE_ENV", "development")
    const mockProject = { ...featuredProject, meta: { mock: true } }
    render(<CaseStudyHeader project={mockProject} />)
    expect(screen.getByText("[MOCK]")).toBeInTheDocument()
  })

  it("hides [MOCK] badge when meta.mock is true but in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    const mockProject = { ...featuredProject, meta: { mock: true } }
    render(<CaseStudyHeader project={mockProject} />)
    expect(screen.queryByText("[MOCK]")).not.toBeInTheDocument()
  })
})
