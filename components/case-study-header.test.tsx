import { render, screen } from "@testing-library/react"

import { CaseStudyHeader } from "@/components/case-study-header"

import type { Project } from "@/lib/content/projects"

const cleanProject: Project = {
  slug: "buguard",
  name: "Buguard",
  description: "A cybersecurity platform.",
  org: "Buguard, LLC",
  type: "web",
  stack: ["react", "typescript"],
  images: [],
  videos: [],
  links: {},
  problem: "A cybersecurity platform challenge.",
  role: "Lead front-end developer.",
  decisions: ["Chose Next.js for SSR"],
  outcomes: ["Improved load time by 40%"],
  featured: true,
}

const placeholderProject: Project = {
  ...cleanProject,
  problem: "[PLACEHOLDER — awaiting authored content] Something.",
}

describe("CaseStudyHeader", () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it("renders one h1 with the project name", () => {
    render(<CaseStudyHeader project={cleanProject} />)
    const headings = screen.getAllByRole("heading", { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent("Buguard")
  })

  it("renders a breadcrumb link to /work", () => {
    render(<CaseStudyHeader project={cleanProject} />)
    const breadcrumb = screen.getByRole("navigation", {
      name: "Breadcrumb",
    })
    const link = screen.getByRole("link", { name: "Network" })
    expect(breadcrumb).toContainElement(link)
    expect(link).toHaveAttribute("href", "/work")
  })

  it("does not show [MOCK] badge when project has no placeholders", () => {
    vi.stubEnv("NODE_ENV", "development")
    render(<CaseStudyHeader project={cleanProject} />)
    expect(screen.queryByText("[MOCK]")).not.toBeInTheDocument()
  })

  it("shows [MOCK] badge when project has placeholders and not in production", () => {
    vi.stubEnv("NODE_ENV", "development")
    render(<CaseStudyHeader project={placeholderProject} />)
    expect(screen.getByText("[MOCK]")).toBeInTheDocument()
  })

  it("hides [MOCK] badge when project has placeholders but in production", () => {
    vi.stubEnv("NODE_ENV", "production")
    render(<CaseStudyHeader project={placeholderProject} />)
    expect(screen.queryByText("[MOCK]")).not.toBeInTheDocument()
  })
})
