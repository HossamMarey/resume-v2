import { fireEvent, render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { KonamiListener } from "./konami-listener"

const mockAddUnlock = vi.hoisted(() => vi.fn())
const mockEmitXP = vi.hoisted(() => vi.fn())
const mockUseShouldAnimate = vi.hoisted(() => vi.fn(() => true))
const mockExperimentalEnabled = vi.hoisted(() => ({ value: true }))
const mockPathname = vi.hoisted(() => vi.fn(() => "/"))

vi.mock("@/lib/unlocks/bus", () => ({
  addUnlock: mockAddUnlock,
}))

vi.mock("@/lib/xp/bus", () => ({
  emitXP: mockEmitXP,
}))

vi.mock("@/hooks/use-should-animate", () => ({
  useShouldAnimate: mockUseShouldAnimate,
}))

vi.mock("@/lib/content", () => ({
  get EXPERIMENTAL_ENABLED() {
    return mockExperimentalEnabled.value
  },
}))

vi.mock("next/navigation", () => ({
  usePathname: mockPathname,
}))

function fireSequence(keys: string[]) {
  for (const key of keys) {
    fireEvent.keyDown(window, { key })
  }
}

const KONAMI_SEQUENCE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a",
]

afterEach(() => {
  vi.clearAllMocks()
  mockUseShouldAnimate.mockReturnValue(true)
  mockExperimentalEnabled.value = true
  mockPathname.mockReturnValue("/")
})

describe("KonamiListener", () => {
  it("unlocks after the full sequence", () => {
    render(<KonamiListener />)
    fireSequence(KONAMI_SEQUENCE)

    expect(mockAddUnlock).toHaveBeenCalledTimes(1)
    expect(mockAddUnlock).toHaveBeenCalledWith("konami")
    expect(mockEmitXP).toHaveBeenCalledTimes(1)
    expect(mockEmitXP).toHaveBeenCalledWith(20, "konami")
  })

  it("skips when typing target is focused", () => {
    render(
      <>
        <input data-testid="input" />
        <KonamiListener />
      </>
    )
    const input = screen.getByTestId("input")

    for (const key of KONAMI_SEQUENCE) {
      fireEvent.keyDown(input, { key })
    }

    expect(mockAddUnlock).not.toHaveBeenCalled()
    expect(mockEmitXP).not.toHaveBeenCalled()
  })

  it("resets on wrong key mid-sequence", () => {
    render(<KonamiListener />)
    const wrongSequence = [
      "ArrowUp",
      "ArrowUp",
      "ArrowDown",
      "x",
      ...KONAMI_SEQUENCE.slice(3),
    ]
    fireSequence(wrongSequence)

    expect(mockAddUnlock).not.toHaveBeenCalled()
    expect(mockEmitXP).not.toHaveBeenCalled()
  })

  it("times out after >2s between keys", () => {
    vi.useFakeTimers()
    render(<KonamiListener />)

    fireEvent.keyDown(window, { key: "ArrowUp" })
    fireEvent.keyDown(window, { key: "ArrowUp" })

    vi.advanceTimersByTime(2500)

    fireSequence(KONAMI_SEQUENCE.slice(2))

    expect(mockAddUnlock).not.toHaveBeenCalled()
    expect(mockEmitXP).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it("still grants XP + unlock under reduced motion (no pulse)", () => {
    mockUseShouldAnimate.mockReturnValue(false)
    render(<KonamiListener />)
    fireSequence(KONAMI_SEQUENCE)

    expect(mockAddUnlock).toHaveBeenCalledWith("konami")
    expect(mockEmitXP).toHaveBeenCalledWith(20, "konami")
    // No pulse rendered because useShouldAnimate returns false
  })

  it("does nothing when content is disabled", () => {
    mockExperimentalEnabled.value = false
    render(<KonamiListener />)
    fireSequence(KONAMI_SEQUENCE)

    expect(mockAddUnlock).not.toHaveBeenCalled()
    expect(mockEmitXP).not.toHaveBeenCalled()
  })

  it("is inert on /recruiter", () => {
    mockPathname.mockReturnValue("/recruiter")
    render(<KonamiListener />)
    fireSequence(KONAMI_SEQUENCE)

    expect(mockAddUnlock).not.toHaveBeenCalled()
    expect(mockEmitXP).not.toHaveBeenCalled()
  })
})
