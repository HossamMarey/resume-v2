import React from "react"

import { render, screen, within } from "@testing-library/react"

import { NetworkWaterfallTable } from "@/components/network-waterfall-table"

import type { Project } from "@/lib/content/projects"

const mockProjects: Project[] = [
  {
    slug: "alpha",
    name: "Alpha",
    description: "Alpha project",
    org: "",
    type: "web",
    stack: ["react"],
    images: [],
    videos: [],
    links: {},
    problem: "",
    role: "",
    decisions: [],
    outcomes: [],
    featured: true,
  },
  {
    slug: "beta",
    name: "Beta",
    description: "Beta project",
    org: "",
    type: "app",
    stack: ["vue"],
    images: [],
    videos: [],
    links: {},
    problem: "",
    role: "",
    decisions: [],
    outcomes: [],
    featured: true,
  },
]

describe("NetworkWaterfallTable", () => {
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
    expect(labels).toEqual(["NAME", "TYPE", "STACK", "LINKS"])
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
