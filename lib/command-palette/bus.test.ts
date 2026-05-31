import { openCommandPalette, registerPaletteOpener } from "./bus"

describe("command-palette bus", () => {
  beforeEach(() => {
    // Reset opener state between tests
    // Since opener is module-level state, we need to unsubscribe after each test
  })

  it("returns false on SSR (window undefined)", () => {
    const originalWindow = globalThis.window
    try {
      // @ts-expect-error — simulate SSR
      globalThis.window = undefined
      expect(openCommandPalette()).toBe(false)
    } finally {
      globalThis.window = originalWindow
    }
  })

  it("calls the opener and returns true when registered", () => {
    const opener = vi.fn()
    const unsubscribe = registerPaletteOpener(opener)

    expect(openCommandPalette()).toBe(true)
    expect(opener).toHaveBeenCalledTimes(1)

    unsubscribe()
  })

  it("calls fallback and returns false when no opener is registered", () => {
    const fallback = vi.fn()
    expect(openCommandPalette(fallback)).toBe(false)
    expect(fallback).toHaveBeenCalledTimes(1)
  })

  it("calls fallback and returns false after unsubscribe", () => {
    const opener = vi.fn()
    const fallback = vi.fn()
    const unsubscribe = registerPaletteOpener(opener)

    unsubscribe()

    expect(openCommandPalette(fallback)).toBe(false)
    expect(opener).not.toHaveBeenCalled()
    expect(fallback).toHaveBeenCalledTimes(1)
  })

  it("supports re-registration after unsubscribe", () => {
    const opener1 = vi.fn()
    const opener2 = vi.fn()
    const unsubscribe1 = registerPaletteOpener(opener1)

    unsubscribe1()
    registerPaletteOpener(opener2)

    expect(openCommandPalette()).toBe(true)
    expect(opener1).not.toHaveBeenCalled()
    expect(opener2).toHaveBeenCalledTimes(1)
  })
})
