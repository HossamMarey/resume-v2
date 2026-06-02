import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

let mockShouldAnimate = true

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: () => mockShouldAnimate,
}))

import { useTypewriter } from "@/hooks/use-typewriter"

describe("useTypewriter", () => {
  afterEach(() => {
    vi.useRealTimers()
    mockShouldAnimate = true
  })

  it("reveals text character-by-character", () => {
    vi.useFakeTimers()
    const { result } = renderHook(() => useTypewriter("hello", { speedMs: 10 }))

    // Run the reset timeout
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current.text).toBe("")
    expect(result.current.done).toBe(false)

    // First tick
    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(result.current.text).toBe("h")

    // Three more ticks
    act(() => {
      vi.advanceTimersByTime(30)
    })
    expect(result.current.text).toBe("hell")

    // Final tick
    act(() => {
      vi.advanceTimersByTime(10)
    })
    expect(result.current.text).toBe("hello")
    expect(result.current.done).toBe(true)
  })

  it("returns full text instantly when enabled=false", () => {
    vi.useFakeTimers()
    const { result } = renderHook(() =>
      useTypewriter("hello", { enabled: false, speedMs: 10 })
    )

    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current.text).toBe("hello")
    expect(result.current.done).toBe(true)
  })

  it("resets when text changes", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ text }: { text: string }) => useTypewriter(text, { speedMs: 10 }),
      { initialProps: { text: "abc" } }
    )

    // Complete first text
    act(() => {
      vi.advanceTimersByTime(0)
    })
    act(() => {
      vi.advanceTimersByTime(30)
    })
    expect(result.current.text).toBe("abc")
    expect(result.current.done).toBe(true)

    // Change text
    act(() => {
      rerender({ text: "xy" })
    })

    // After reset
    act(() => {
      vi.advanceTimersByTime(0)
    })
    expect(result.current.text).toBe("")
    expect(result.current.done).toBe(false)

    // Complete second text
    act(() => {
      vi.advanceTimersByTime(20)
    })
    expect(result.current.text).toBe("xy")
    expect(result.current.done).toBe(true)
  })

  it("returns full text instantly when prefers-reduced-motion", () => {
    mockShouldAnimate = false
    const { result } = renderHook(() => useTypewriter("hello"))

    expect(result.current.text).toBe("hello")
    expect(result.current.done).toBe(true)
  })
})
