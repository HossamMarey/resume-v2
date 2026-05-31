import fc from "fast-check"

import {
  applyDelta,
  clampXp,
  emitXP,
  reduceGrants,
  XP_EVENT,
  XP_MAX,
  XP_MIN,
} from "@/lib/xp/bus"
import type { XPEventDetail } from "@/lib/xp/bus"

afterEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  vi.restoreAllMocks()
})

describe("emitXP", () => {
  it("dispatches a hm:xp CustomEvent with delta, reason, and timestamp", () => {
    const handler = vi.fn()
    window.addEventListener(XP_EVENT, handler)

    emitXP(10, "visit:network")

    expect(handler).toHaveBeenCalledOnce()
    const detail = (handler.mock.calls[0][0] as CustomEvent<XPEventDetail>)
      .detail
    expect(detail.delta).toBe(10)
    expect(detail.reason).toBe("visit:network")
    expect(typeof detail.timestamp).toBe("number")

    window.removeEventListener(XP_EVENT, handler)
  })

  it("emits a given reason only once, persisted across sessions", () => {
    const handler = vi.fn()
    window.addEventListener(XP_EVENT, handler)

    emitXP(10, "visit:network")
    emitXP(10, "visit:network")

    expect(handler).toHaveBeenCalledOnce()
    window.removeEventListener(XP_EVENT, handler)
  })

  it("emits independently for distinct reasons", () => {
    const handler = vi.fn()
    window.addEventListener(XP_EVENT, handler)

    emitXP(10, "visit:network")
    emitXP(15, "open:project-x")

    expect(handler).toHaveBeenCalledTimes(2)
    window.removeEventListener(XP_EVENT, handler)
  })

  it("persists granted reasons across calls via localStorage", () => {
    emitXP(10, "visit:network")
    expect(JSON.parse(localStorage.getItem("hm_xp_granted") ?? "[]")).toContain(
      "visit:network"
    )
  })

  it("ignores a non-array hm_xp_granted value without throwing", () => {
    localStorage.setItem("hm_xp_granted", JSON.stringify({}))
    const handler = vi.fn()
    window.addEventListener(XP_EVENT, handler)

    expect(() => emitXP(10, "visit:network")).not.toThrow()
    expect(handler).toHaveBeenCalledOnce()

    window.removeEventListener(XP_EVENT, handler)
  })

  it("degrades silently and still emits when storage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied")
    })
    const handler = vi.fn()
    window.addEventListener(XP_EVENT, handler)

    expect(() => emitXP(10, "visit:network")).not.toThrow()
    expect(handler).toHaveBeenCalledOnce()

    window.removeEventListener(XP_EVENT, handler)
  })
})

describe("clampXp / applyDelta", () => {
  it("clamps below the floor and above the ceiling", () => {
    expect(clampXp(-5)).toBe(XP_MIN)
    expect(clampXp(150)).toBe(XP_MAX)
    expect(clampXp(42)).toBe(42)
  })

  it("treats NaN as the floor", () => {
    expect(clampXp(Number.NaN)).toBe(XP_MIN)
  })

  it("applies a delta then clamps", () => {
    expect(applyDelta(95, 10)).toBe(XP_MAX)
    expect(applyDelta(5, -10)).toBe(XP_MIN)
  })
})

describe("XP reducer properties", () => {
  it("keeps XP within [0,100] for any sequence of deltas", () => {
    fc.assert(
      fc.property(fc.array(fc.integer({ min: -1000, max: 1000 })), (deltas) => {
        const xp = deltas.reduce((acc, delta) => applyDelta(acc, delta), 0)
        return xp >= XP_MIN && xp <= XP_MAX
      })
    )
  })

  it("is idempotent per reason — repeating the same grants changes nothing", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            delta: fc.integer({ min: -1000, max: 1000 }),
            reason: fc.string(),
          })
        ),
        (grants) => {
          const once = reduceGrants(grants)
          const twice = reduceGrants([...grants, ...grants])
          return once === twice
        }
      )
    )
  })

  it("reduceGrants result is always within [0,100]", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            delta: fc.integer({ min: -1000, max: 1000 }),
            reason: fc.string(),
          })
        ),
        (grants) => {
          const xp = reduceGrants(grants)
          return xp >= XP_MIN && xp <= XP_MAX
        }
      )
    )
  })
})
