import { render, screen } from "@testing-library/react"

import { StackMarquee } from "@/components/stack-marquee"
import { useShouldAnimate } from "@/hooks/use-should-animate"
import { primarySkills } from "@/lib/content/skills"

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: vi.fn(),
}))

const mockUseShouldAnimate = vi.mocked(useShouldAnimate)

describe("StackMarquee", () => {
  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders a level-2 heading", () => {
    mockUseShouldAnimate.mockReturnValue(true)
    render(<StackMarquee skills={primarySkills} />)
    expect(screen.getByRole("heading", { level: 2 })).toBeInTheDocument()
  })

  it("does not introduce a level-1 heading", () => {
    mockUseShouldAnimate.mockReturnValue(true)
    render(<StackMarquee skills={primarySkills} />)
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })

  it("renders each primary skill name at least once in animated branch", () => {
    mockUseShouldAnimate.mockReturnValue(true)
    render(<StackMarquee skills={primarySkills} />)

    for (const skill of primarySkills) {
      expect(screen.getAllByText(skill.name).length).toBeGreaterThanOrEqual(1)
    }
  })

  it("renders static grid with each skill exactly once when reduced motion is preferred", () => {
    mockUseShouldAnimate.mockReturnValue(false)
    render(<StackMarquee skills={primarySkills} />)

    for (const skill of primarySkills) {
      expect(screen.getAllByText(skill.name)).toHaveLength(1)
    }
  })

  it("has an aria-hidden duplicate track in the animated branch", () => {
    mockUseShouldAnimate.mockReturnValue(true)
    const { container } = render(<StackMarquee skills={primarySkills} />)

    const hiddenLists = container.querySelectorAll('ul[aria-hidden="true"]')
    expect(hiddenLists.length).toBeGreaterThanOrEqual(1)
  })

  it("has no aria-hidden duplicate track in the reduced-motion branch", () => {
    mockUseShouldAnimate.mockReturnValue(false)
    const { container } = render(<StackMarquee skills={primarySkills} />)

    const hiddenLists = container.querySelectorAll('ul[aria-hidden="true"]')
    expect(hiddenLists.length).toBe(0)
  })
})
