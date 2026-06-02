import { describe, it, expect, vi } from "vitest"
import { render } from "@testing-library/react"
import { RecruiterRedirect } from "./recruiter-redirect"

const replace = vi.hoisted(() => vi.fn())
const mockUseRecruiterMode = vi.hoisted(() =>
  vi.fn(() => ({
    isRecruiterMode: false,
    mounted: false,
    setRecruiterMode: vi.fn(),
  }))
)

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replace }),
}))

vi.mock("@/hooks/use-recruiter-mode", () => ({
  useRecruiterMode: mockUseRecruiterMode,
}))

describe("RecruiterRedirect", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRecruiterMode.mockReturnValue({
      isRecruiterMode: false,
      mounted: false,
      setRecruiterMode: vi.fn(),
    })
  })

  it("does not redirect when not mounted", () => {
    render(<RecruiterRedirect />)
    expect(replace).not.toHaveBeenCalled()
  })

  it("does not redirect when mounted but not in recruiter mode", () => {
    mockUseRecruiterMode.mockReturnValue({
      isRecruiterMode: false,
      mounted: true,
      setRecruiterMode: vi.fn(),
    })

    render(<RecruiterRedirect />)
    expect(replace).not.toHaveBeenCalled()
  })

  it("redirects when mounted and in recruiter mode", () => {
    mockUseRecruiterMode.mockReturnValue({
      isRecruiterMode: true,
      mounted: true,
      setRecruiterMode: vi.fn(),
    })

    render(<RecruiterRedirect />)
    expect(replace).toHaveBeenCalledWith("/recruiter")
  })
})
