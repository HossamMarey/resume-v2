import React from "react"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { NetworkPageClient } from "@/components/network-page-client"

import type { Project } from "@/lib/content/projects"

const mockReplace = vi.fn()
const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

const mockUseSearchParams = vi.mocked(useSearchParams)
const mockUseRouter = vi.mocked(useRouter)
const mockUsePathname = vi.mocked(usePathname)

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
  {
    slug: "gamma",
    name: "Gamma",
    description: "Gamma project",
    org: "",
    type: "lib",
    stack: ["typescript"],
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

function createSearchParams(
  params: Record<string, string[]> = {}
): URLSearchParams {
  const sp = new URLSearchParams()
  for (const [key, values] of Object.entries(params)) {
    for (const v of values) {
      sp.append(key, v)
    }
  }
  return sp
}

function setupNavigationMocks(params: Record<string, string[]> = {}) {
  const searchParams = createSearchParams(params)
  mockUseSearchParams.mockReturnValue(
    searchParams as unknown as ReturnType<typeof useSearchParams>
  )
  mockUseRouter.mockReturnValue({
    replace: mockReplace,
    push: mockPush,
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  } as unknown as ReturnType<typeof useRouter>)
  mockUsePathname.mockReturnValue("/work")
}

describe("NetworkPageClient", () => {
  beforeEach(() => {
    setupNavigationMocks()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders all projects when no filters are active", () => {
    render(<NetworkPageClient projects={mockProjects} />)
    const links = screen.getAllByRole("link")
    expect(links.length).toBeGreaterThanOrEqual(mockProjects.length)
  })

  it("filters projects by type", () => {
    setupNavigationMocks({ type: ["app"] })
    render(<NetworkPageClient projects={mockProjects} />)
    expect(
      screen.getAllByRole("link", { name: "Beta" }).length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.queryAllByRole("link", { name: "Alpha" })).toHaveLength(0)
    expect(screen.queryAllByRole("link", { name: "Gamma" })).toHaveLength(0)
  })

  it("shows empty state when no projects match", () => {
    setupNavigationMocks({
      type: ["nonexistent"],
    })
    render(<NetworkPageClient projects={mockProjects} />)
    expect(
      screen.getByText("No requests match your filter")
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: /clear filters/i })
    ).toBeInTheDocument()
  })

  it("restores all rows when Clear filters is clicked", async () => {
    const user = userEvent.setup()
    setupNavigationMocks({ type: ["nonexistent"] })
    render(<NetworkPageClient projects={mockProjects} />)

    expect(
      screen.getByText("No requests match your filter")
    ).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /clear filters/i }))
    expect(mockReplace).toHaveBeenCalledWith("/work")
  })

  it("updates URL params when a filter is toggled", async () => {
    const user = userEvent.setup()
    setupNavigationMocks()
    render(<NetworkPageClient projects={mockProjects} />)

    await user.click(screen.getByRole("button", { name: /type/i }))
    await user.click(screen.getByLabelText("app"))

    expect(mockReplace).toHaveBeenCalledWith("/work?type=app")
  })

  it("supports multi-select within a category", () => {
    setupNavigationMocks({ type: ["web", "app"] })
    render(<NetworkPageClient projects={mockProjects} />)
    expect(
      screen.getAllByRole("link", { name: "Alpha" }).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByRole("link", { name: "Beta" }).length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.queryAllByRole("link", { name: "Gamma" })).toHaveLength(0)
  })

  it("applies AND across categories", () => {
    setupNavigationMocks({ type: ["web"], stack: ["react"] })
    render(<NetworkPageClient projects={mockProjects} />)
    expect(
      screen.getAllByRole("link", { name: "Alpha" }).length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.queryAllByRole("link", { name: "Beta" })).toHaveLength(0)
    expect(screen.queryAllByRole("link", { name: "Gamma" })).toHaveLength(0)
  })
})
