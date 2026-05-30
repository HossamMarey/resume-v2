import { isTypingTarget } from "@/lib/keyboard"

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
