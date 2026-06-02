import { act, renderHook } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { useDebouncedValue } from "@/hooks/use-debounced-value"

describe("useDebouncedValue", () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it("returns initial value immediately", () => {
    const { result } = renderHook(() => useDebouncedValue("hello", 150))
    expect(result.current).toBe("hello")
  })

  it("updates only after delay", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 150),
      { initialProps: { value: "a" } }
    )

    expect(result.current).toBe("a")

    rerender({ value: "b" })
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(149)
    })
    expect(result.current).toBe("a")

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(result.current).toBe("b")
  })

  it("coalesces rapid changes to the latest", () => {
    vi.useFakeTimers()
    const { result, rerender } = renderHook(
      ({ value }: { value: string }) => useDebouncedValue(value, 150),
      { initialProps: { value: "a" } }
    )

    rerender({ value: "b" })
    act(() => {
      vi.advanceTimersByTime(50)
    })

    rerender({ value: "c" })
    act(() => {
      vi.advanceTimersByTime(50)
    })

    rerender({ value: "d" })
    act(() => {
      vi.advanceTimersByTime(150)
    })

    expect(result.current).toBe("d")
  })
})
