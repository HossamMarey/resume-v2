import { render, screen } from "@testing-library/react"

import { NetworkRequestDetail } from "@/components/network-request-detail"

import type { Project } from "@/lib/content/projects"

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
  decisions: ["Chose Next.js for SSR", "Used React Query for state"],
  outcomes: ["Improved load time by 40%"],
  links: [
    { label: "Preview", href: "https://example.com" },
    { label: "Code", href: "https://github.com/example" },
  ],
  featured: true,
  meta: { mock: false },
}

describe("NetworkRequestDetail", () => {
  it("renders sections in order: Problem, Role, Stack, Decisions, Outcomes, Links", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    const h2s = screen
      .getAllByRole("heading", { level: 2 })
      .map((el) => el.textContent)
    expect(h2s).toEqual([
      "Problem",
      "Role",
      "Stack",
      "Decisions",
      "Outcomes",
      "Links",
    ])
  })

  it("does not contain an h1 heading", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })

  it("does not contain a breadcrumb navigation", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    expect(
      screen.queryByRole("navigation", { name: "Breadcrumb" })
    ).not.toBeInTheDocument()
  })

  it("renders stack entries as badges", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    expect(screen.getByText("react")).toBeInTheDocument()
    expect(screen.getByText("typescript")).toBeInTheDocument()
  })

  it("renders decisions and outcomes in computed-styles panels", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    expect(screen.getByText("Chose Next.js for SSR")).toBeInTheDocument()
    expect(screen.getByText("Improved load time by 40%")).toBeInTheDocument()
  })

  it("renders external links with correct attributes", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    const previewLink = screen.getByRole("link", { name: /Preview/i })
    expect(previewLink).toHaveAttribute("target", "_blank")
    expect(previewLink).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("filters out null/empty links", () => {
    const projectWithEmptyLink: Project = {
      ...featuredProject,
      links: [
        { label: "Preview", href: "https://example.com" },
        { label: "Empty", href: "" },
        { label: "Valid", href: "https://github.com/example" },
      ],
    }
    render(<NetworkRequestDetail project={projectWithEmptyLink} />)
    expect(
      screen.queryByRole("link", { name: /Empty/i })
    ).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Preview/i })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Valid/i })).toBeInTheDocument()
  })
})
