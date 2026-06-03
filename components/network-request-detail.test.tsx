import { render, screen } from "@testing-library/react"

import { NetworkRequestDetail } from "@/components/network-request-detail"

import type { Project } from "@/lib/content/projects"

const featuredProject: Project = {
  slug: "buguard",
  name: "Buguard",
  description: "A cybersecurity platform description.",
  org: "Buguard, LLC",
  type: "web",
  stack: ["react", "typescript"],
  images: [],
  videos: [],
  links: {
    preview: "https://example.com",
    code: "https://github.com/example",
  },
  problem: "A cybersecurity platform challenge.",
  role: "Lead front-end developer.",
  decisions: ["Chose Next.js for SSR", "Used React Query for state"],
  outcomes: ["Improved load time by 40%"],
  featured: true,
}

describe("NetworkRequestDetail", () => {
  it("renders description, problem, role, stack, decisions, outcomes, links sections", () => {
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

  it("renders the description as a lead paragraph", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    expect(
      screen.getByText("A cybersecurity platform description.")
    ).toBeInTheDocument()
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

  it("renders links as buttons with correct attributes", () => {
    render(<NetworkRequestDetail project={featuredProject} />)
    const previewLink = screen.getByRole("link", { name: /Live Preview/i })
    expect(previewLink).toHaveAttribute("target", "_blank")
    expect(previewLink).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("omits absent link keys", () => {
    const projectWithPartialLinks: Project = {
      ...featuredProject,
      links: { preview: "https://example.com" },
    }
    render(<NetworkRequestDetail project={projectWithPartialLinks} />)
    expect(
      screen.getByRole("link", { name: /Live Preview/i })
    ).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /Source Code/i })
    ).not.toBeInTheDocument()
  })

  it("shows empty state when no links", () => {
    const projectNoLinks: Project = {
      ...featuredProject,
      links: {},
    }
    render(<NetworkRequestDetail project={projectNoLinks} />)
    expect(screen.getByText("No links provided.")).toBeInTheDocument()
  })
})
