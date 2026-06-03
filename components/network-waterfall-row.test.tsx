import React from "react"

import { render, screen } from "@testing-library/react"

import {
  NetworkWaterfallRow,
  NetworkWaterfallCard,
} from "@/components/network-waterfall-row"

import type { Project } from "@/lib/content/projects"

const mockProject: Project = {
  slug: "test-project",
  name: "Test Project",
  description: "A test project description",
  org: "TestOrg",
  type: "web",
  stack: ["react"],
  images: [],
  videos: [],
  links: { preview: "https://example.com" },
  problem: "test",
  role: "dev",
  decisions: [],
  outcomes: [],
  featured: true,
}

const nonFeaturedWithLink: Project = {
  slug: "legacy-project",
  name: "Legacy Project",
  description: "A legacy project",
  org: "",
  type: "web",
  stack: ["html"],
  images: [],
  videos: [],
  links: { preview: "https://example.com" },
  problem: "",
  role: "",
  decisions: [],
  outcomes: [],
  featured: false,
}

const nonFeaturedNoLink: Project = {
  slug: "no-link-project",
  name: "No Link Project",
  description: "No link project",
  org: "",
  type: "web",
  stack: ["css"],
  images: [],
  videos: [],
  links: {},
  problem: "",
  role: "",
  decisions: [],
  outcomes: [],
  featured: false,
}

describe("NetworkWaterfallRow", () => {
  it("renders the project name", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByText("Test Project")).toBeInTheDocument()
  })

  it("renders a link to the project detail page", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByRole("link", { name: "Test Project" })).toHaveAttribute(
      "href",
      "/work/test-project"
    )
  })

  it("renders the type column", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByText("web")).toBeInTheDocument()
  })

  it("renders stack as badges", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByText("react")).toBeInTheDocument()
  })

  it("renders stack with +N overflow badge", () => {
    const manyStackProject: Project = {
      ...mockProject,
      stack: ["react", "typescript", "next.js", "tailwind"],
    }
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={manyStackProject} />
        </tbody>
      </table>
    )
    expect(screen.getByText("+1")).toBeInTheDocument()
  })

  it("does not introduce an h1 heading", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })
})

describe("NetworkWaterfallCard", () => {
  it("renders the project name as a link", () => {
    render(<NetworkWaterfallCard project={mockProject} />)
    expect(screen.getByRole("link", { name: "Test Project" })).toHaveAttribute(
      "href",
      "/work/test-project"
    )
  })

  it("renders type and stack badges", () => {
    render(<NetworkWaterfallCard project={mockProject} />)
    expect(screen.getByText("web")).toBeInTheDocument()
    expect(screen.getByText("react")).toBeInTheDocument()
  })
})

describe("Featured vs non-featured linking (Row)", () => {
  it("featured project links internally to /work/[slug]", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByRole("link", { name: "Test Project" })).toHaveAttribute(
      "href",
      "/work/test-project"
    )
  })

  it("non-featured project with link opens external URL", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={nonFeaturedWithLink} />
        </tbody>
      </table>
    )
    const link = screen.getByRole("link", { name: /Legacy Project/i })
    expect(link).toHaveAttribute("href", "https://example.com")
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
  })

  it("non-featured project without link renders plain text", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={nonFeaturedNoLink} />
        </tbody>
      </table>
    )
    expect(screen.getByText("No Link Project")).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /No Link Project/i })
    ).not.toBeInTheDocument()
  })
})

describe("Featured vs non-featured linking (Card)", () => {
  it("featured project card links internally", () => {
    render(<NetworkWaterfallCard project={mockProject} />)
    expect(screen.getByRole("link", { name: "Test Project" })).toHaveAttribute(
      "href",
      "/work/test-project"
    )
  })

  it("non-featured project card with link renders link labels", () => {
    render(<NetworkWaterfallCard project={nonFeaturedWithLink} />)
    const link = screen.getByRole("link", { name: /Live Preview/i })
    expect(link).toHaveAttribute("href", "https://example.com")
    expect(link).toHaveAttribute("target", "_blank")
  })

  it("non-featured project card without link renders plain text", () => {
    render(<NetworkWaterfallCard project={nonFeaturedNoLink} />)
    expect(screen.getByText("No Link Project")).toBeInTheDocument()
    expect(
      screen.queryByRole("link", { name: /No Link Project/i })
    ).not.toBeInTheDocument()
  })
})
