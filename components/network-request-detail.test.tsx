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
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("renders one h1 with the project name", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    const headings = screen.getAllByRole("heading", { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent("Buguard")
  })

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

  it("renders a breadcrumb link to /work", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    const breadcrumb = screen.getByRole("navigation", {
      name: "Breadcrumb",
    })
    const link = screen.getByRole("link", { name: "Network" })
    expect(breadcrumb).toContainElement(link)
    expect(link).toHaveAttribute("href", "/work")
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

  it("does not show [MOCK] badge when meta.mock is false", () => {
    vi.stubEnv("NODE_ENV", "development")
    render(<NetworkRequestDetail project={featuredProject} />)
    expect(screen.queryByText("[MOCK]")).not.toBeInTheDocument()
  })

  it("shows [MOCK] badge when meta.mock is true and not in production", () => {
    vi.stubEnv("NODE_ENV", "development")
    const mockProject = { ...featuredProject, meta: { mock: true } }
    render(<NetworkRequestDetail project={mockProject} />)
    expect(screen.getByText("[MOCK]")).toBeInTheDocument()
  })

  it("hides [MOCK] badge when meta.mock is true but in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    const mockProject = { ...featuredProject, meta: { mock: true } }
    render(<NetworkRequestDetail project={mockProject} />)
    expect(screen.queryByText("[MOCK]")).not.toBeInTheDocument()
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
    expect(
      screen.getByRole("link", { name: /Preview/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole("link", { name: /Valid/i })
    ).toBeInTheDocument()
  })
})
