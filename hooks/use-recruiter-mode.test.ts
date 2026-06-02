import { act, renderHook } from "@testing-library/react"

import { useRecruiterMode } from "./use-recruiter-mode"
import { RECRUITER_EVENT, writeRecruiterMode } from "@/lib/recruiter/bus"

async function flushMount() {
  await act(async () => {
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  })
}

function mountRecruiterMode() {
  return renderHook(() => useRecruiterMode())
}

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("useRecruiterMode", () => {
  it("defaults to false on first mount", async () => {
    const { result } = mountRecruiterMode()
    expect(result.current.isRecruiterMode).toBe(false)
    expect(result.current.mounted).toBe(false)

    await flushMount()
    expect(result.current.isRecruiterMode).toBe(false)
    expect(result.current.mounted).toBe(true)
  })

  it("reads persisted mode from localStorage on mount", async () => {
    localStorage.setItem("hm_recruiter_v1", "true")
    const { result } = mountRecruiterMode()
    expect(result.current.isRecruiterMode).toBe(false)

    await flushMount()
    expect(result.current.isRecruiterMode).toBe(true)
  })

  it("updates when hm:recruiter event fires", async () => {
    const { result } = mountRecruiterMode()
    await flushMount()

    act(() => writeRecruiterMode(true))

    expect(result.current.isRecruiterMode).toBe(true)
  })

  it("removes its event listener on unmount", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener")
    const { unmount } = mountRecruiterMode()
    await flushMount()

    unmount()

    expect(removeSpy).toHaveBeenCalledWith(
      RECRUITER_EVENT,
      expect.any(Function)
    )
  })
})
