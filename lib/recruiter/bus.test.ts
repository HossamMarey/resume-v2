import {
  readRecruiterMode,
  RECRUITER_EVENT,
  RECRUITER_KEY,
  writeRecruiterMode,
} from "./bus"

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("readRecruiterMode", () => {
  it("defaults to false when localStorage is empty", () => {
    expect(readRecruiterMode()).toBe(false)
  })

  it("returns true when key is 'true'", () => {
    localStorage.setItem(RECRUITER_KEY, "true")
    expect(readRecruiterMode()).toBe(true)
  })

  it("returns false when key is 'false'", () => {
    localStorage.setItem(RECRUITER_KEY, "false")
    expect(readRecruiterMode()).toBe(false)
  })

  it("degrades to false when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied")
    })
    expect(readRecruiterMode()).toBe(false)
  })
})

describe("writeRecruiterMode", () => {
  it("persists 'true' and dispatches hm:recruiter", () => {
    const listener = vi.fn()
    window.addEventListener(RECRUITER_EVENT, listener)

    writeRecruiterMode(true)

    expect(localStorage.getItem(RECRUITER_KEY)).toBe("true")
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(RECRUITER_EVENT, listener)
  })

  it("persists 'false' and dispatches hm:recruiter", () => {
    const listener = vi.fn()
    window.addEventListener(RECRUITER_EVENT, listener)

    writeRecruiterMode(false)

    expect(localStorage.getItem(RECRUITER_KEY)).toBe("false")
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(RECRUITER_EVENT, listener)
  })

  it("does not throw when localStorage is unavailable", () => {
    const listener = vi.fn()
    window.addEventListener(RECRUITER_EVENT, listener)

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded")
    })
    expect(() => writeRecruiterMode(true)).not.toThrow()
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener(RECRUITER_EVENT, listener)
  })
})
