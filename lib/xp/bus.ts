export const XP_EVENT = "hm:xp"
export const XP_MIN = 0
export const XP_MAX = 100

// Granted reasons persist in localStorage so each reason grants once ever
// (not once per browser session) — otherwise the persisted hm_xp_v1 total
// re-inflates every new session as visit:* reasons are re-granted.
const GRANTED_KEY = "hm_xp_granted"

export interface XPEventDetail {
  delta: number
  reason: string
  timestamp: number
}

export function clampXp(xp: number): number {
  if (Number.isNaN(xp)) return XP_MIN
  return Math.max(XP_MIN, Math.min(XP_MAX, xp))
}

export function applyDelta(current: number, delta: number): number {
  return clampXp(current + delta)
}

// Pure model of a session's grant pipeline: dedupes reasons then clamps.
// Exists so property tests can assert clamp + idempotence over arbitrary input.
export function reduceGrants(
  grants: ReadonlyArray<{ delta: number; reason: string }>,
  initial = 0
): number {
  const granted = new Set<string>()
  let xp = clampXp(initial)
  for (const { delta, reason } of grants) {
    if (granted.has(reason)) continue
    granted.add(reason)
    xp = applyDelta(xp, delta)
  }
  return xp
}

function getGrantedReasons(): string[] {
  try {
    const raw = localStorage.getItem(GRANTED_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as string[]) : []
  } catch {
    return []
  }
}

function markReasonGranted(reason: string): void {
  try {
    const reasons = getGrantedReasons()
    reasons.push(reason)
    localStorage.setItem(GRANTED_KEY, JSON.stringify(reasons))
  } catch {
    // Private mode / quota exceeded: degrade to in-memory, no persistence.
  }
}

export function emitXP(delta: number, reason: string): void {
  if (typeof window === "undefined") return

  if (getGrantedReasons().includes(reason)) return
  markReasonGranted(reason)

  window.dispatchEvent(
    new CustomEvent<XPEventDetail>(XP_EVENT, {
      detail: { delta, reason, timestamp: Date.now() },
    })
  )
}
