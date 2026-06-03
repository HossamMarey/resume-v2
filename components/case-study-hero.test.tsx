import React from "react"

import { render, screen } from "@testing-library/react"

import { CaseStudyHero } from "@/components/case-study-hero"

import type { Project } from "@/lib/content/projects"

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"div"> & {
      children?: React.ReactNode
    }) => <div {...props}>{children}</div>,
  },
}))

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _f, sizes: _s, priority: _p, onError: _e, ...rest } = props
    void _f
    void _s
    void _p
    void _e
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...rest} alt={(rest.alt as string) || ""} />
  },
}))

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: () => true,
}))

const project: Project = {
  slug: "buguard",
  name: "Buguard",
  description: "A cybersecurity platform.",
  org: "Buguard, LLC",
  type: "web",
  stack: [],
  images: ["https://example.com/a.png"],
  videos: [],
  links: {},
  problem: "",
  role: "",
  decisions: [],
  outcomes: [],
  featured: true,
}

describe("CaseStudyHero", () => {
  it("renders one h1 with the project name", () => {
    render(<CaseStudyHero project={project} image={project.images[0]} />)
    const headings = screen.getAllByRole("heading", { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent("Buguard")
  })

  it("renders the description as a lede", () => {
    render(<CaseStudyHero project={project} image={project.images[0]} />)
    expect(screen.getByText("A cybersecurity platform.")).toBeInTheDocument()
  })

  it("renders the featured image with alt text when provided", () => {
    render(<CaseStudyHero project={project} image={project.images[0]} />)
    expect(
      screen.getByAltText("Buguard featured screenshot")
    ).toBeInTheDocument()
  })

  it("renders a typographic fallback when no image is provided", () => {
    render(<CaseStudyHero project={project} />)
    expect(screen.queryByRole("img")).not.toBeInTheDocument()
    expect(screen.getByText("no preview")).toBeInTheDocument()
  })

  it("marks the marquee band as decorative (aria-hidden)", () => {
    const { container } = render(
      <CaseStudyHero project={project} image={project.images[0]} />
    )
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument()
  })
})
