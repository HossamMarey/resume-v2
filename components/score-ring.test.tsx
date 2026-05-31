import { render, screen } from "@testing-library/react"

import { ScoreRing } from "@/components/score-ring"
import { useShouldAnimate } from "@/hooks/use-should-animate"

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: vi.fn(),
}))

vi.mock("framer-motion", () => ({
  motion: {
    circle: ({
      children,
      ...props
    }: React.ComponentPropsWithoutRef<"circle"> & {
      children?: React.ReactNode
    }) => <circle {...props}>{children}</circle>,
  },
  useInView: () => true,
}))

const mockUseShouldAnimate = vi.mocked(useShouldAnimate)

describe("ScoreRing", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {}
        disconnect() {}
        unobserve() {}
      }
    )
    mockUseShouldAnimate.mockReturnValue(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
    vi.unstubAllGlobals()
  })

  it("renders nothing when value is 0", () => {
    const { container } = render(<ScoreRing label="Zero" value="0" />)
    expect(container.innerHTML).toBe("")
  })

  it("renders nothing when value is non-numeric zero-ish", () => {
    const { container } = render(<ScoreRing label="Nothing" value="abc" />)
    expect(container.innerHTML).toBe("")
  })

  it("renders the label for a non-zero value", () => {
    render(<ScoreRing label="Projects" value="22" />)
    expect(screen.getAllByText("Projects").length).toBeGreaterThanOrEqual(1)
  })

  it("renders the final numeric value when reduced motion is on", () => {
    mockUseShouldAnimate.mockReturnValue(false)
    render(<ScoreRing label="Years" value="8" suffix="+" />)
    expect(screen.getByText("8+")).toBeInTheDocument()
  })

  it("has an aria-label with label, value and suffix", () => {
    render(<ScoreRing label="Years shipped" value="8" suffix="+" />)
    expect(
      screen.getByRole("figure", { name: "Years shipped: 8+" })
    ).toBeInTheDocument()
  })

  it("has an aria-label with label and value when no suffix", () => {
    render(<ScoreRing label="Projects" value="22" />)
    expect(
      screen.getByRole("figure", { name: "Projects: 22" })
    ).toBeInTheDocument()
  })

  it("does not introduce a level-1 heading", () => {
    render(<ScoreRing label="Test" value="5" />)
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })
})
