import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { RecruiterExit } from "./recruiter-exit"

const push = vi.hoisted(() => vi.fn())
const mockSetRecruiterMode = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: push }),
}))

vi.mock("@/hooks/use-recruiter-mode", () => ({
  useRecruiterMode: () => ({
    isRecruiterMode: true,
    mounted: true,
    setRecruiterMode: mockSetRecruiterMode,
  }),
}))

describe("RecruiterExit", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders with accessible name", () => {
    render(<RecruiterExit />)
    expect(
      screen.getByRole("button", { name: /exit recruiter mode/i })
    ).toBeInTheDocument()
  })

  it("calls setRecruiterMode(false) and navigates home on click", async () => {
    const user = userEvent.setup()
    render(<RecruiterExit />)

    const button = screen.getByRole("button", { name: /exit recruiter mode/i })
    await user.click(button)

    expect(mockSetRecruiterMode).toHaveBeenCalledWith(false)
    expect(push).toHaveBeenCalledWith("/")
  })
})
