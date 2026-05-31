import { render, screen } from "@testing-library/react"

import { PrinciplesPanel } from "@/components/principles-panel"
import { profile } from "@/lib/content/profile"

describe("PrinciplesPanel", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders a level-2 heading", () => {
    render(<PrinciplesPanel principles={profile.principles} />)
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
  })

  it("does not introduce a level-1 heading", () => {
    render(<PrinciplesPanel principles={profile.principles} />)
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })

  it("renders all 4 principle titles and bodies", () => {
    render(<PrinciplesPanel principles={profile.principles} />)

    for (const principle of profile.principles) {
      expect(screen.getByText(principle.title)).toBeInTheDocument()
      expect(screen.getByText(principle.body)).toBeInTheDocument()
    }
  })

  it("renders principle titles as level-3 headings", () => {
    render(<PrinciplesPanel principles={profile.principles} />)

    const headings = screen.getAllByRole("heading", { level: 3 })
    expect(headings).toHaveLength(profile.principles.length)

    for (let i = 0; i < profile.principles.length; i++) {
      expect(headings[i]).toHaveTextContent(profile.principles[i].title)
    }
  })
})
