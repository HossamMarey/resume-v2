import { act, renderHook } from "@testing-library/react"

import { useImageTrail } from "@/hooks/use-image-trail"

import type { UseImageTrailResult } from "@/hooks/use-image-trail"

const motionState = vi.hoisted(() => ({ reduced: false }))

vi.mock("framer-motion", () => ({
  useReducedMotion: () => motionState.reduced,
}))

function move(clientX: number, clientY: number): React.MouseEvent {
  return { clientX, clientY } as React.MouseEvent
}

function attachContainer(result: { current: UseImageTrailResult }) {
  result.current.containerRef.current = {
    getBoundingClientRect: () => ({ left: 0, top: 0 }),
  } as unknown as HTMLDivElement
}

const IMAGES = ["/a.jpg", "/b.jpg"]

describe("useImageTrail", () => {
  afterEach(() => {
    motionState.reduced = false
  })

  it("spawns a trail image once the cursor travels >=80px", () => {
    const { result } = renderHook(() => useImageTrail(1))
    attachContainer(result)

    act(() => {
      result.current.onRowEnter(IMAGES)
      result.current.onRowMove(IMAGES, move(0, 0))
    })
    expect(result.current.trail).toHaveLength(1)

    act(() => result.current.onRowMove(IMAGES, move(100, 0)))
    expect(result.current.trail).toHaveLength(2)
  })

  it("does not spawn again before 80px of travel", () => {
    const { result } = renderHook(() => useImageTrail(1))
    attachContainer(result)

    act(() => {
      result.current.onRowEnter(IMAGES)
      result.current.onRowMove(IMAGES, move(0, 0))
    })
    act(() => result.current.onRowMove(IMAGES, move(40, 0)))

    expect(result.current.trail).toHaveLength(1)
  })

  it("cycles through the provided images in order", () => {
    const { result } = renderHook(() => useImageTrail(1))
    attachContainer(result)

    act(() => {
      result.current.onRowEnter(IMAGES)
      result.current.onRowMove(IMAGES, move(0, 0))
    })
    act(() => result.current.onRowMove(IMAGES, move(100, 0)))
    act(() => result.current.onRowMove(IMAGES, move(200, 0)))

    expect(result.current.trail.map((t) => t.src)).toEqual([
      "/a.jpg",
      "/b.jpg",
      "/a.jpg",
    ])
  })

  it("never spawns when the project has no images", () => {
    const { result } = renderHook(() => useImageTrail(1))
    attachContainer(result)

    act(() => {
      result.current.onRowEnter([])
      result.current.onRowMove([], move(0, 0))
      result.current.onRowMove([], move(300, 0))
    })

    expect(result.current.trail).toHaveLength(0)
  })

  it("is fully disabled under prefers-reduced-motion", () => {
    motionState.reduced = true
    const { result } = renderHook(() => useImageTrail(1))
    attachContainer(result)

    act(() => {
      result.current.onRowEnter(IMAGES)
      result.current.onRowMove(IMAGES, move(0, 0))
      result.current.onRowMove(IMAGES, move(300, 0))
    })

    expect(result.current.trail).toHaveLength(0)
  })

  it("keeps in-flight trail items when the cursor leaves the row", () => {
    const { result } = renderHook(() => useImageTrail(1))
    attachContainer(result)

    act(() => {
      result.current.onRowEnter(IMAGES)
      result.current.onRowMove(IMAGES, move(0, 0))
    })
    expect(result.current.trail).toHaveLength(1)

    act(() => result.current.onRowLeave())
    expect(result.current.trail).toHaveLength(1)
  })

  it("clears the queue variant on leave so its images can exit", () => {
    const { result } = renderHook(() => useImageTrail(7))
    attachContainer(result)

    act(() => result.current.onRowEnter(IMAGES))
    act(() => result.current.onRowMove(IMAGES, move(0, 0)))
    act(() => result.current.onRowMove(IMAGES, move(100, 0)))
    expect(result.current.trail.length).toBeGreaterThan(0)

    act(() => result.current.onRowLeave())
    expect(result.current.trail).toHaveLength(0)
  })

  it("caps the trail to a fixed queue for the persistence variant", () => {
    const { result } = renderHook(() => useImageTrail(7))
    attachContainer(result)

    act(() => result.current.onRowEnter(IMAGES))
    for (let i = 0; i < 10; i++) {
      act(() => result.current.onRowMove(IMAGES, move(i * 100, 0)))
    }

    expect(result.current.trail).toHaveLength(5)
  })
})
