import React from "react"

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

import { NetworkPageClient } from "@/components/network-page-client"
import { useShouldAnimate } from "@/hooks/use-should-animate"

import type { Project } from "@/lib/content/projects"

const mockReplace = vi.fn()
const mockPush = vi.fn()

vi.mock("next/navigation", () => ({
  useSearchParams: vi.fn(),
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

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

const mockUseSearchParams = vi.mocked(useSearchParams)
const mockUseRouter = vi.mocked(useRouter)
const mockUsePathname = vi.mocked(usePathname)

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
  {
    slug: "gamma",
    name: "Gamma",
    org: "",
    method: "GET",
    status: "ongoing",
    statusCode: 200,
    type: "lib",
    size: "2 MB",
    sizeWeight: 0.1,
    time: "1 mo",
    timeWeight: 0.05,
    startOffset: 0.2,
    year: 2024,
    stack: ["typescript"],
    problem: "",
    role: "",
    decisions: [],
    outcomes: [],
    links: [],
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
    vi.mocked(useShouldAnimate).mockReturnValue(false)
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

  it("filters projects by method", () => {
    setupNavigationMocks({ method: ["POST"] })
    render(<NetworkPageClient projects={mockProjects} />)
    expect(
      screen.getAllByRole("link", { name: "Beta" }).length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.queryAllByRole("link", { name: "Alpha" })).toHaveLength(0)
    expect(screen.queryAllByRole("link", { name: "Gamma" })).toHaveLength(0)
  })

  it("shows empty state when no projects match", () => {
    setupNavigationMocks({
      method: ["PATCH"],
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
    setupNavigationMocks({ method: ["PATCH"] })
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

    await user.click(screen.getByRole("button", { name: /method/i }))
    await user.click(screen.getByLabelText("POST"))

    expect(mockReplace).toHaveBeenCalledWith("/work?method=POST")
  })

  it("supports multi-select within a category", () => {
    setupNavigationMocks({ method: ["GET", "POST"] })
    render(<NetworkPageClient projects={mockProjects} />)
    expect(
      screen.getAllByRole("link", { name: "Alpha" }).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByRole("link", { name: "Beta" }).length
    ).toBeGreaterThanOrEqual(1)
    expect(
      screen.getAllByRole("link", { name: "Gamma" }).length
    ).toBeGreaterThanOrEqual(1)
  })

  it("applies AND across categories", () => {
    setupNavigationMocks({ method: ["GET"], status: ["ongoing"] })
    render(<NetworkPageClient projects={mockProjects} />)
    expect(
      screen.getAllByRole("link", { name: "Gamma" }).length
    ).toBeGreaterThanOrEqual(1)
    expect(screen.queryAllByRole("link", { name: "Alpha" })).toHaveLength(0)
    expect(screen.queryAllByRole("link", { name: "Beta" })).toHaveLength(0)
  })
})
