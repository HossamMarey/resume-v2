interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitOptions {
  limit?: number
  windowMs?: number
}

interface RateLimitResult {
  ok: boolean
  remaining: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

function pruneExpired(now: number): void {
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) {
      store.delete(key)
    }
  }
}

export function rateLimit(
  key: string,
  { limit = 5, windowMs = 600_000 }: RateLimitOptions = {}
): RateLimitResult {
  const now = Date.now()

  pruneExpired(now)

  const existing = store.get(key)

  if (!existing || existing.resetAt <= now) {
    // New or expired bucket
    const resetAt = now + windowMs
    store.set(key, { count: 1, resetAt })
    return { ok: true, remaining: limit - 1, resetAt }
  }

  if (existing.count >= limit) {
    // At limit
    return { ok: false, remaining: 0, resetAt: existing.resetAt }
  }

  // Increment
  existing.count += 1
  return {
    ok: true,
    remaining: limit - existing.count,
    resetAt: existing.resetAt,
  }
}

/**
 * Exposed for testing only.
 */
export function _resetRateLimitStore(): void {
  store.clear()
}
