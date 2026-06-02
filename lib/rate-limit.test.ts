import { afterEach, describe, expect, it, vi } from "vitest"

import { _resetRateLimitStore, rateLimit } from "@/lib/rate-limit"

describe("rateLimit", () => {
  afterEach(() => {
    vi.useRealTimers()
    _resetRateLimitStore()
  })

  it("allows up to limit requests within window", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))

    for (let i = 0; i < 5; i++) {
      const result = rateLimit("client-a", { limit: 5, windowMs: 600_000 })
      expect(result.ok).toBe(true)
    }
  })

  it("blocks the request after limit", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))

    for (let i = 0; i < 5; i++) {
      rateLimit("client-a", { limit: 5, windowMs: 600_000 })
    }

    const result = rateLimit("client-a", { limit: 5, windowMs: 600_000 })
    expect(result.ok).toBe(false)
    expect(result.remaining).toBe(0)
  })

  it("resets after windowMs", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))

    for (let i = 0; i < 5; i++) {
      rateLimit("client-a", { limit: 5, windowMs: 600_000 })
    }

    expect(rateLimit("client-a", { limit: 5, windowMs: 600_000 }).ok).toBe(
      false
    )

    // Advance past the window
    vi.advanceTimersByTime(600_001)

    const result = rateLimit("client-a", { limit: 5, windowMs: 600_000 })
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("tracks independent keys independently", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))

    for (let i = 0; i < 5; i++) {
      rateLimit("client-a", { limit: 5, windowMs: 600_000 })
    }

    expect(rateLimit("client-a", { limit: 5, windowMs: 600_000 }).ok).toBe(
      false
    )

    // client-b should still be allowed
    const result = rateLimit("client-b", { limit: 5, windowMs: 600_000 })
    expect(result.ok).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it("returns correct remaining count", () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"))

    const r1 = rateLimit("client-c", { limit: 3, windowMs: 60_000 })
    expect(r1.remaining).toBe(2)

    const r2 = rateLimit("client-c", { limit: 3, windowMs: 60_000 })
    expect(r2.remaining).toBe(1)

    const r3 = rateLimit("client-c", { limit: 3, windowMs: 60_000 })
    expect(r3.remaining).toBe(0)
  })
})
