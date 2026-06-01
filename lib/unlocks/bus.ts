export const UNLOCK_EVENT = "hm:unlock"
export const UNLOCKS_KEY = "hm_unlocks_v1"

export function readUnlocks(): string[] {
  if (typeof window === "undefined") return []

  try {
    const raw = localStorage.getItem(UNLOCKS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed)
      ? parsed.filter((x: unknown): x is string => typeof x === "string")
      : []
  } catch {
    return []
  }
}

export function hasUnlock(name: string, unlocks = readUnlocks()): boolean {
  return unlocks.includes(name)
}

export function addUnlock(name: string): void {
  if (typeof window === "undefined") return

  const current = readUnlocks()
  if (current.includes(name)) return

  const next = [...current, name]

  let persisted = false
  try {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(next))
    persisted = true
  } catch {
    // Private mode / quota exceeded: degrade to in-memory, no persistence.
  }

  if (persisted) {
    window.dispatchEvent(new CustomEvent(UNLOCK_EVENT))
  }
}
