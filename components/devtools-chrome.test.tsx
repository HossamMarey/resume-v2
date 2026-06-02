import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { DevToolsChrome } from "./devtools-chrome"

const push = vi.hoisted(() => vi.fn())
const mockSetRecruiterMode = vi.hoisted(() => vi.fn())

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ push: push }),
}))

vi.mock("@/hooks/use-xp", () => ({
  useXP: () => ({ xp: 0 }),
}))

vi.mock("@/hooks/use-recruiter-mode", () => ({
  useRecruiterMode: () => ({
    isRecruiterMode: false,
    mounted: true,
    setRecruiterMode: mockSetRecruiterMode,
  }),
}))

describe("DevToolsChrome", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("renders the Recruiter Mode button with accessible name", () => {
    render(<DevToolsChrome />)
    expect(
      screen.getByRole("button", { name: /toggle recruiter mode/i })
    ).toBeInTheDocument()
  })

  it("calls setRecruiterMode(true) and navigates on click", async () => {
    const user = userEvent.setup()
    render(<DevToolsChrome />)

    const button = screen.getByRole("button", {
      name: /toggle recruiter mode/i,
    })
    await user.click(button)

    expect(mockSetRecruiterMode).toHaveBeenCalledWith(true)
    expect(push).toHaveBeenCalledWith("/recruiter")
  })
})
