import { act, renderHook } from "@testing-library/react"

import { useXP } from "@/hooks/use-xp"

function dispatchXp(delta: number) {
  window.dispatchEvent(
    new CustomEvent("hm:xp", {
      detail: { delta, reason: "visit:network", timestamp: Date.now() },
    })
  )
}

// The hook defers its mount read to requestAnimationFrame to avoid a
// synchronous setState in the effect body; flush that frame before asserting.
async function flushMount() {
  await act(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  })
}

function mountXp() {
  return renderHook(() => useXP())
}

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe("useXP", () => {
  it("defaults to 0 on first visit", async () => {
    const { result } = mountXp()
    await flushMount()
    expect(result.current.xp).toBe(0)
  })

  it("reads persisted XP from localStorage on mount", async () => {
    localStorage.setItem("hm_xp_v1", "42")
    const { result } = mountXp()
    await flushMount()
    expect(result.current.xp).toBe(42)
  })

  it("updates and persists XP when a hm:xp event fires", async () => {
    const { result } = mountXp()
    await flushMount()

    act(() => dispatchXp(10))

    expect(result.current.xp).toBe(10)
    expect(localStorage.getItem("hm_xp_v1")).toBe("10")
  })

  it("clamps XP to a maximum of 100", async () => {
    const { result } = mountXp()
    await flushMount()

    act(() => dispatchXp(200))

    expect(result.current.xp).toBe(100)
  })

  it("exposes emitXP that increments XP", async () => {
    const { result } = mountXp()
    await flushMount()

    act(() => result.current.emitXP(10, "visit:network"))

    expect(result.current.xp).toBe(10)
  })

  it("degrades to 0 when localStorage is unavailable", async () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied")
    })
    const { result } = mountXp()
    await flushMount()
    expect(result.current.xp).toBe(0)
  })

  it("removes its event listener on unmount", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener")
    const { unmount } = mountXp()
    await flushMount()

    unmount()

    expect(removeSpy).toHaveBeenCalledWith("hm:xp", expect.any(Function))
  })
})
