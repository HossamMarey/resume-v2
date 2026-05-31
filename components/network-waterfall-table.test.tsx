import React from "react"

import { render, screen, within } from "@testing-library/react"

import { NetworkWaterfallTable } from "@/components/network-waterfall-table"
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

const mockProjects: Project[] = [
  {
    slug: "alpha",
    name: "Alpha",
    org: "",
    method: "GET",
    status: "shipped",
    statusCode: 200,
    type: "web",
    size: "10 MB",
    sizeWeight: 0.4,
    time: "6 mo",
    timeWeight: 0.25,
    startOffset: 0,
    year: 2024,
    stack: ["react"],
    problem: "",
    role: "",
    decisions: [],
    outcomes: [],
    links: [],
  },
  {
    slug: "beta",
    name: "Beta",
    org: "",
    method: "POST",
    status: "ongoing",
    statusCode: 201,
    type: "app",
    size: "5 MB",
    sizeWeight: 0.2,
    time: "3 mo",
    timeWeight: 0.15,
    startOffset: 0.1,
    year: 2025,
    stack: ["vue"],
    problem: "",
    role: "",
    decisions: [],
    outcomes: [],
    links: [],
  },
]

describe("NetworkWaterfallTable", () => {
  beforeEach(() => {
    mockUseShouldAnimate.mockReturnValue(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders a semantic table element", () => {
    render(<NetworkWaterfallTable projects={mockProjects} />)
    expect(screen.getByRole("table")).toBeInTheDocument()
  })

  it("renders all projects as rows", () => {
    render(<NetworkWaterfallTable projects={mockProjects} />)
    const table = screen.getByRole("table")
    const rows = within(table).getAllByRole("row")
    expect(rows).toHaveLength(mockProjects.length + 1)
  })

  it("renders header row with correct labels", () => {
    render(<NetworkWaterfallTable projects={mockProjects} />)
    const table = screen.getByRole("table")
    const gridCells = within(table).getAllByRole("columnheader")
    const labels = gridCells.map((cell) => cell.textContent)
    expect(labels).toEqual([
      "METHOD",
      "NAME",
      "TYPE",
      "STATUS",
      "SIZE",
      "TIME",
      "WATERFALL",
    ])
  })

  it("renders project names as links", () => {
    render(<NetworkWaterfallTable projects={mockProjects} />)
    const alphaLinks = screen.getAllByRole("link", { name: "Alpha" })
    expect(alphaLinks[0]).toHaveAttribute("href", "/work/alpha")
    const betaLinks = screen.getAllByRole("link", { name: "Beta" })
    expect(betaLinks[0]).toHaveAttribute("href", "/work/beta")
  })

  it("does not introduce an h1 heading", () => {
    render(<NetworkWaterfallTable projects={mockProjects} />)
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })
})
