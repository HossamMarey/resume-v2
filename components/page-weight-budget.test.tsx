import { render, screen } from "@testing-library/react"

import { PageWeightBudget } from "@/components/page-weight-budget"
import { useShouldAnimate } from "@/hooks/use-should-animate"
import { pageWeightBudget } from "@/lib/content/page-weight"

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

describe("PageWeightBudget", () => {
  beforeEach(() => {
    mockUseShouldAnimate.mockReturnValue(false)
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it("renders all category names", () => {
    render(<PageWeightBudget items={pageWeightBudget} />)

    for (const item of pageWeightBudget) {
      expect(
        screen.getAllByText(new RegExp(item.category)).length
      ).toBeGreaterThanOrEqual(1)
    }
  })

  it("renders a dl element", () => {
    const { container } = render(<PageWeightBudget items={pageWeightBudget} />)
    expect(container.querySelector("dl")).toBeInTheDocument()
  })

  it("renders the total line with computed total and budget", () => {
    const budget = 500_000
    render(<PageWeightBudget items={pageWeightBudget} budgetBytes={budget} />)

    const total = pageWeightBudget.reduce((s, i) => s + i.bytes, 0)
    const totalKB = (total / 1024).toFixed(1)
    const budgetKB = (budget / 1024).toFixed(1)
    expect(screen.getByText(/Total:/)).toHaveTextContent(
      `Total: ${totalKB} KB / ${budgetKB} KB`
    )
  })

  it("does not introduce a level-1 heading", () => {
    render(<PageWeightBudget items={pageWeightBudget} />)
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument()
  })
})
