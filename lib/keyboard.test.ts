import fc from "fast-check"

import {
  advanceKonami,
  isKonamiComplete,
  isTypingTarget,
  KONAMI_KEYS,
  normalizeKonamiKey,
} from "@/lib/keyboard"

describe("isTypingTarget", () => {
  it("returns true for input, textarea, and select elements", () => {
    for (const tag of ["input", "textarea", "select"]) {
      expect(isTypingTarget(document.createElement(tag))).toBe(true)
    }
  })

  it("returns true when the element is content-editable", () => {
    const el = document.createElement("div")
    // jsdom does not derive isContentEditable from the attribute, so set the
    // property directly to exercise the branch the function actually reads.
    Object.defineProperty(el, "isContentEditable", {
      value: true,
      configurable: true,
    })
    expect(isTypingTarget(el)).toBe(true)
  })

  it("returns false for non-typing elements", () => {
    expect(isTypingTarget(document.createElement("div"))).toBe(false)
    expect(isTypingTarget(document.createElement("button"))).toBe(false)
  })

  it("returns false for null or non-element targets", () => {
    expect(isTypingTarget(null)).toBe(false)
    expect(isTypingTarget(new EventTarget())).toBe(false)
  })
})

describe("normalizeKonamiKey", () => {
  it("lowercases arrow keys", () => {
    expect(normalizeKonamiKey("ArrowUp")).toBe("arrowup")
    expect(normalizeKonamiKey("ArrowDown")).toBe("arrowdown")
  })

  it("lowercases letters", () => {
    expect(normalizeKonamiKey("B")).toBe("b")
    expect(normalizeKonamiKey("A")).toBe("a")
  })
})

describe("advanceKonami", () => {
  it("advances on correct key", () => {
    expect(advanceKonami(0, "ArrowUp")).toBe(1)
    expect(advanceKonami(1, "ArrowUp")).toBe(2)
    expect(advanceKonami(2, "ArrowDown")).toBe(3)
  })

  it("resets to 0 on wrong key that is not the first key", () => {
    expect(advanceKonami(1, "ArrowDown")).toBe(0)
  })

  it("restarts at 1 on wrong key that matches the first key", () => {
    // ↑↑↓... typed as ↑↑↑↓ should restart at progress 1 after the third ↑
    expect(advanceKonami(2, "ArrowUp")).toBe(1)
  })

  it("is case-insensitive on letters", () => {
    // Progress 8 expects "b"
    expect(advanceKonami(8, "B")).toBe(9)
    expect(advanceKonami(8, "b")).toBe(9)
    // Progress 9 expects "a"
    expect(advanceKonami(9, "A")).toBe(10)
    expect(advanceKonami(9, "a")).toBe(10)
  })

  it("returns complete progress when already complete", () => {
    expect(advanceKonami(10, "ArrowUp")).toBe(10)
  })
})

describe("isKonamiComplete", () => {
  it("returns false for incomplete progress", () => {
    expect(isKonamiComplete(0)).toBe(false)
    expect(isKonamiComplete(5)).toBe(false)
    expect(isKonamiComplete(9)).toBe(false)
  })

  it("returns true for complete progress", () => {
    expect(isKonamiComplete(10)).toBe(true)
    expect(isKonamiComplete(11)).toBe(true)
  })
})

describe("fast-check: Konami buffer properties", () => {
  it("noise never completes unless the exact ordered subsequence occurs", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.constantFrom(
            "ArrowUp",
            "ArrowDown",
            "ArrowLeft",
            "ArrowRight",
            "a",
            "A",
            "b",
            "B",
            "x",
            "y",
            "z",
            "Enter",
            "Escape"
          )
        ),
        (keys) => {
          let progress = 0
          for (const key of keys) {
            progress = advanceKonami(progress, key)
          }
          // If the exact sequence wasn't present in order, progress should be < 10
          const exactSequence = keys.map((k) => normalizeKonamiKey(k)).join(",")
          const targetSequence = KONAMI_KEYS.join(",")
          if (!exactSequence.includes(targetSequence)) {
            return !isKonamiComplete(progress)
          }
          return true
        }
      )
    )
  })

  it("a completing run reports complete", () => {
    fc.assert(
      fc.property(fc.array(fc.string()), (prefix) => {
        let progress = 0
        // Feed prefix noise
        for (const key of prefix) {
          progress = advanceKonami(progress, key)
        }
        // Then feed the exact sequence
        for (const key of KONAMI_KEYS) {
          progress = advanceKonami(progress, key)
        }
        return isKonamiComplete(progress)
      })
    )
  })

  it("overlap restart: ↑↑↑↓ restarts at 1 after the third ↑, then ↓ resets to 0", () => {
    let progress = 0
    progress = advanceKonami(progress, "ArrowUp") // 1
    progress = advanceKonami(progress, "ArrowUp") // 2
    progress = advanceKonami(progress, "ArrowUp") // wrong at pos 2, but is ArrowUp → restart at 1
    expect(progress).toBe(1)
    progress = advanceKonami(progress, "ArrowDown") // pos 1 expects ↑, ↓ is wrong and not ↑ → 0
    expect(progress).toBe(0)
  })
})
