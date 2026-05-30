import { renderHook } from "@testing-library/react"
import { useReducedMotion } from "framer-motion"

import { useShouldAnimate } from "@/hooks/use-should-animate"

// Mock the external motion boundary rather than jsdom matchMedia: framer-motion
// caches its reduced-motion listener at module level, which leaks across tests.
vi.mock("framer-motion", () => ({
  useReducedMotion: vi.fn(),
}))

const mockUseReducedMotion = vi.mocked(useReducedMotion)

afterEach(() => {
  vi.clearAllMocks()
})

describe("useShouldAnimate", () => {
  it("returns true when reduced motion is not preferred", () => {
    mockUseReducedMotion.mockReturnValue(false)
    const { result } = renderHook(() => useShouldAnimate())
    expect(result.current).toBe(true)
  })

  it("returns false when reduced motion is preferred", () => {
    mockUseReducedMotion.mockReturnValue(true)
    const { result } = renderHook(() => useShouldAnimate())
    expect(result.current).toBe(false)
  })

  it("animates by default when the preference is unknown (null)", () => {
    mockUseReducedMotion.mockReturnValue(null)
    const { result } = renderHook(() => useShouldAnimate())
    expect(result.current).toBe(true)
  })
})
