export const PALETTE_OPEN_EVENT = "hm:open-palette"

let opener: (() => void) | null = null

export function registerPaletteOpener(fn: () => void): () => void {
  opener = fn
  return () => {
    if (opener === fn) opener = null
  }
}

export function openCommandPalette(fallback?: () => void): boolean {
  if (typeof window === "undefined") return false
  if (opener) {
    try {
      opener()
      return true
    } catch {
      fallback?.()
      return false
    }
  }
  fallback?.()
  return false
}
