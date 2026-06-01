import { render, screen } from "@testing-library/react"

import { RecruiterResume } from "@/components/recruiter-resume"
import { profile, projects, skillGroups } from "@/lib/content"

const featuredProjects = projects.filter((p) => p.featured)

describe("RecruiterResume", () => {
  it("renders exactly one h1 with profile.name", () => {
    render(<RecruiterResume />)
    const h1 = screen.getByRole("heading", { level: 1 })
    expect(h1).toHaveTextContent(profile.name)
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("renders the headline (profile.tagline)", () => {
    render(<RecruiterResume />)
    expect(screen.getByText(profile.tagline)).toBeInTheDocument()
  })

  it("renders one card per featured project with name and at least one outcome", () => {
    render(<RecruiterResume />)

    for (const project of featuredProjects) {
      expect(screen.getByText(project.name)).toBeInTheDocument()
    }

    // Each featured project should render at least one outcome
    for (const project of featuredProjects) {
      if (project.outcomes.length > 0) {
        expect(
          screen.getAllByText(project.outcomes[0]).length
        ).toBeGreaterThanOrEqual(1)
      }
    }
  })

  it("renders three skills-matrix columns with group names", () => {
    render(<RecruiterResume />)

    for (const group of skillGroups) {
      expect(
        screen.getByRole("heading", { name: group.name })
      ).toBeInTheDocument()
    }
  })

  it("does not render any progress bars or percentage text in skills", () => {
    render(<RecruiterResume />)
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument()
    expect(screen.queryByText(/%|percent/i)).not.toBeInTheDocument()
  })

  it("renders Download Resume anchor pointing to /hossam-marey-resume.pdf", () => {
    render(<RecruiterResume />)
    const link = screen.getByRole("link", { name: /download resume/i })
    expect(link).toHaveAttribute("href", "/hossam-marey-resume.pdf")
  })

  it("renders GitHub social link as external anchor with noopener noreferrer", () => {
    render(<RecruiterResume />)

    const githubLink = profile.socials.find((s) => s.label === "GitHub")
    if (githubLink) {
      const link = screen.getByRole("link", { name: "GitHub" })
      expect(link).toHaveAttribute("href", githubLink.href)
      expect(link).toHaveAttribute("target", "_blank")
      expect(link).toHaveAttribute("rel", "noopener noreferrer")
    }
  })

  it("does not render a mailto link when profile.email is empty", () => {
    render(<RecruiterResume />)
    expect(profile.email).toBe("")
    expect(
      screen.queryByRole("link", { name: /email|mail/i })
    ).not.toBeInTheDocument()
  })
})
