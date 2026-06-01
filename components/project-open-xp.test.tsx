import { render } from "@testing-library/react"

import { ProjectOpenXp } from "@/components/project-open-xp"
import { emitXP } from "@/lib/xp/bus"

vi.mock("@/lib/xp/bus", () => ({
  emitXP: vi.fn(),
}))

describe("ProjectOpenXp", () => {
  beforeEach(() => {
    vi.mocked(emitXP).mockClear()
  })

  it("calls emitXP with 15 and the open:slug reason on mount", () => {
    render(<ProjectOpenXp slug="buguard" />)
    expect(emitXP).toHaveBeenCalledTimes(1)
    expect(emitXP).toHaveBeenCalledWith(15, "open:buguard")
  })

  it("uses the provided slug in the reason string", () => {
    render(<ProjectOpenXp slug="dark-atlas" />)
    expect(emitXP).toHaveBeenCalledWith(15, "open:dark-atlas")
  })

  it("renders nothing visible", () => {
    const { container } = render(<ProjectOpenXp slug="buguard" />)
    expect(container.firstChild).toBeNull()
  })
})
