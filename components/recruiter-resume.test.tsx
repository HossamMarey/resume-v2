import { render, screen } from "@testing-library/react"

import { RecruiterResume } from "@/components/recruiter-resume"
import { experience, profile, projects, skillGroups } from "@/lib/content"

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
      expect(screen.getAllByText(project.name).length).toBeGreaterThanOrEqual(1)
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

  it("renders email from socials only, not a duplicate from empty profile.email", () => {
    render(<RecruiterResume />)
    expect(profile.email).toBe("")

    const emailSocial = profile.socials.find((s) =>
      s.href.startsWith("mailto:")
    )
    expect(emailSocial).toBeDefined()

    const mailtoLinks = screen
      .getAllByRole("link")
      .filter((el) => el.getAttribute("href")?.startsWith("mailto:"))
    expect(mailtoLinks).toHaveLength(1)
    expect(mailtoLinks[0]).toHaveAttribute("href", emailSocial!.href)
  })

  it("renders Experience section with at least one company and role", () => {
    render(<RecruiterResume />)
    expect(
      screen.getByRole("heading", { name: "Experience" })
    ).toBeInTheDocument()
    expect(
      screen.getAllByText(experience[0].company).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getByText(new RegExp(experience[0].roles[0].name))
    ).toBeInTheDocument()
  })

  it("renders Full-time and Freelance subsection headings when data exists", () => {
    render(<RecruiterResume />)
    const hasFulltime = experience.some((e) => e.category === "fulltime")
    const hasFreelance = experience.some((e) => e.category === "freelance")
    if (hasFulltime) {
      expect(
        screen.getByRole("heading", { name: "Full-time" })
      ).toBeInTheDocument()
    }
    if (hasFreelance) {
      expect(
        screen.getByRole("heading", { name: "Freelance" })
      ).toBeInTheDocument()
    }
  })
})
