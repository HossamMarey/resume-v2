export const RECRUITER_EVENT = "hm:recruiter"
export const RECRUITER_KEY = "hm_recruiter_v1"

export function readRecruiterMode(): boolean {
  if (typeof window === "undefined") return false

  try {
    return localStorage.getItem(RECRUITER_KEY) === "true"
  } catch {
    return false
  }
}

export function writeRecruiterMode(on: boolean): void {
  if (typeof window === "undefined") return

  let persisted = false
  try {
    localStorage.setItem(RECRUITER_KEY, on ? "true" : "false")
    persisted = true
  } catch {
    // Private mode / quota exceeded: degrade to in-memory, no persistence.
  }

  if (persisted) {
    window.dispatchEvent(new CustomEvent(RECRUITER_EVENT))
  }
}
