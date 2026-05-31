import React from "react"

import { render, screen } from "@testing-library/react"

import {
  NetworkWaterfallRow,
  NetworkWaterfallCard,
  methodColor,
  statusColor,
} from "@/components/network-waterfall-row"
import { useShouldAnimate } from "@/hooks/use-should-animate"

import type { Project } from "@/lib/content/projects"

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: vi.fn(),
}))

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

const mockUseShouldAnimate = vi.mocked(useShouldAnimate)

const mockProject: Project = {
  slug: "test-project",
  name: "Test Project",
  org: "TestOrg",
  method: "GET",
  status: "shipped",
  statusCode: 200,
  type: "web",
  size: "12.4 MB",
  sizeWeight: 0.5,
  time: "8 mo",
  timeWeight: 0.3,
  startOffset: 0,
  year: 2024,
  stack: ["react"],
  problem: "test",
  role: "dev",
  decisions: [],
  outcomes: [],
  links: [],
}

describe("NetworkWaterfallRow", () => {
  beforeEach(() => {
    mockUseShouldAnimate.mockReturnValue(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

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

  it("renders the method badge with correct text", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByText("GET")).toBeInTheDocument()
  })

  it("renders the status pill with correct text", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByText("200")).toBeInTheDocument()
  })

  it("status pill has correct aria-label", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByLabelText("Status: shipped, 200")).toBeInTheDocument()
  })

  it("renders the waterfall bar with transform-origin left", () => {
    const { container } = render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    const bar = container.querySelector("[style*='transform-origin: left']")
    expect(bar).toBeInTheDocument()
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

  it("renders size and time columns", () => {
    render(
      <table>
        <tbody>
          <NetworkWaterfallRow project={mockProject} />
        </tbody>
      </table>
    )
    expect(screen.getByText("12.4 MB")).toBeInTheDocument()
    expect(screen.getByText("8 mo")).toBeInTheDocument()
  })
})

describe("NetworkWaterfallCard", () => {
  beforeEach(() => {
    mockUseShouldAnimate.mockReturnValue(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders the project name as a link", () => {
    render(<NetworkWaterfallCard project={mockProject} />)
    expect(screen.getByRole("link", { name: "Test Project" })).toHaveAttribute(
      "href",
      "/work/test-project"
    )
  })

  it("renders method badge and status pill", () => {
    render(<NetworkWaterfallCard project={mockProject} />)
    expect(screen.getByText("GET")).toBeInTheDocument()
    expect(screen.getByText("200")).toBeInTheDocument()
  })
})

describe("methodColor", () => {
  it("returns chart-2 for GET", () => {
    expect(methodColor("GET")).toContain("chart-2")
  })

  it("returns chart-3 for POST", () => {
    expect(methodColor("POST")).toContain("chart-3")
  })

  it("returns chart-3 for PUT", () => {
    expect(methodColor("PUT")).toContain("chart-3")
  })

  it("returns chart-5 for PATCH", () => {
    expect(methodColor("PATCH")).toContain("chart-5")
  })
})

describe("statusColor", () => {
  it("returns status-ok for 200", () => {
    expect(statusColor(200)).toContain("status-ok")
  })

  it("returns status-warn for 201", () => {
    expect(statusColor(201)).toContain("status-warn")
  })

  it("returns status-err for 410", () => {
    expect(statusColor(410)).toContain("status-err")
  })
})
