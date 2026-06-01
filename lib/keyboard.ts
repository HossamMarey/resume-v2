export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  return (
    target.isContentEditable ||
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.tagName === "SELECT"
  )
}

export const KONAMI_KEYS = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
] as const

export function normalizeKonamiKey(key: string): string {
  return key.toLowerCase()
}

export function advanceKonami(progress: number, key: string): number {
  const normalized = normalizeKonamiKey(key)
  const nextIndex = progress

  if (nextIndex >= KONAMI_KEYS.length) {
    return progress
  }

  if (normalized === KONAMI_KEYS[nextIndex]) {
    return progress + 1
  }

  // Wrong key — restart at 1 if the wrong key is the first key of the
  // sequence (so a fresh ↑↑… start isn't dropped). Classic Konami edge.
  if (normalized === KONAMI_KEYS[0]) {
    return 1
  }

  return 0
}

export function isKonamiComplete(progress: number): boolean {
  return progress >= KONAMI_KEYS.length
}
