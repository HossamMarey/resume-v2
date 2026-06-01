import { act, renderHook } from "@testing-library/react"

import { useUnlocks } from "@/hooks/use-unlocks"
import { addUnlock, UNLOCK_EVENT } from "@/lib/unlocks/bus"

async function flushMount() {
  await act(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  })
}

function mountUnlocks() {
  return renderHook(() => useUnlocks())
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("useUnlocks", () => {
  it("defaults to [] on first mount", async () => {
    const { result } = mountUnlocks()
    await flushMount()
    expect(result.current.unlocks).toEqual([])
    expect(result.current.isUnlocked("konami")).toBe(false)
  })

  it("reads persisted unlocks from localStorage on mount", async () => {
    localStorage.setItem("hm_unlocks_v1", JSON.stringify(["konami"]))
    const { result } = mountUnlocks()
    await flushMount()
    expect(result.current.unlocks).toEqual(["konami"])
    expect(result.current.isUnlocked("konami")).toBe(true)
  })

  it("updates when hm:unlock event fires", async () => {
    const { result } = mountUnlocks()
    await flushMount()

    act(() => addUnlock("konami"))

    expect(result.current.unlocks).toEqual(["konami"])
    expect(result.current.isUnlocked("konami")).toBe(true)
  })

  it("removes its event listener on unmount", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener")
    const { unmount } = mountUnlocks()
    await flushMount()

    unmount()

    expect(removeSpy).toHaveBeenCalledWith(UNLOCK_EVENT, expect.any(Function))
  })
})
