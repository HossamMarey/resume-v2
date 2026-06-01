import { addUnlock, readUnlocks, UNLOCK_EVENT, UNLOCKS_KEY } from "./bus"

afterEach(() => {
  localStorage.clear()
  vi.restoreAllMocks()
})

describe("readUnlocks", () => {
  it("returns empty array when localStorage is empty", () => {
    expect(readUnlocks()).toEqual([])
  })

  it("returns empty array for garbage / non-JSON", () => {
    localStorage.setItem(UNLOCKS_KEY, "not-json")
    expect(readUnlocks()).toEqual([])
  })

  it("returns empty array for non-array JSON", () => {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify({ foo: "bar" }))
    expect(readUnlocks()).toEqual([])
  })

  it("filters out non-string items", () => {
    localStorage.setItem(UNLOCKS_KEY, JSON.stringify(["konami", 123, null]))
    expect(readUnlocks()).toEqual(["konami"])
  })

  it("degrades to [] when localStorage throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("storage denied")
    })
    expect(readUnlocks()).toEqual([])
  })
})

describe("addUnlock", () => {
  it("persists the unlock and dispatches hm:unlock", () => {
    const listener = vi.fn()
    window.addEventListener(UNLOCK_EVENT, listener)

    addUnlock("konami")

    expect(readUnlocks()).toEqual(["konami"])
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(UNLOCK_EVENT, listener)
  })

  it("is idempotent — no duplicate, no event on second call", () => {
    const listener = vi.fn()
    window.addEventListener(UNLOCK_EVENT, listener)

    addUnlock("konami")
    addUnlock("konami")

    expect(readUnlocks()).toEqual(["konami"])
    expect(listener).toHaveBeenCalledTimes(1)

    window.removeEventListener(UNLOCK_EVENT, listener)
  })

  it("does not throw when localStorage is unavailable", () => {
    const listener = vi.fn()
    window.addEventListener(UNLOCK_EVENT, listener)

    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota exceeded")
    })
    expect(() => addUnlock("konami")).not.toThrow()
    expect(listener).not.toHaveBeenCalled()

    window.removeEventListener(UNLOCK_EVENT, listener)
  })
})
