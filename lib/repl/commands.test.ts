import fc from "fast-check"

import {
  levenshtein,
  runCommand,
  type ReplEffect,
  type ReplResult,
} from "./commands"

describe("runCommand", () => {
  describe("help", () => {
    it("lists all 7 commands", () => {
      const result = runCommand("help")
      expect(result.status).toBe("ok")
      expect(result.lines).toHaveLength(7)
      const names = result.lines.map((l) => l.text.split(" — ")[0].trim())
      expect(names).toEqual([
        "help",
        "whoami",
        "projects",
        "contact",
        "theme",
        "clear",
        "download resume",
      ])
    })

    it("does not list experimental when locked", () => {
      const result = runCommand("help")
      const text = result.lines.map((l) => l.text).join("\n")
      expect(text).not.toContain("experimental")
    })

    it("still hides experimental when unlocked but content is disabled", () => {
      const result = runCommand("help", ["konami"])
      const text = result.lines.map((l) => l.text).join("\n")
      expect(text).not.toContain("experimental")
    })
  })

  describe("whoami", () => {
    it("includes name, role, years, location, and tagline", () => {
      const result = runCommand("whoami")
      expect(result.status).toBe("ok")
      const text = result.lines.map((l) => l.text).join("\n")
      expect(text).toContain("Hossam Marey")
      expect(text).toContain("Senior Front-End Developer")
      expect(text).toContain("8+")
      expect(text).toContain("Egypt")
      expect(text).toContain("I build fast, accessible interfaces")
    })

    it("never renders an empty email line", () => {
      const result = runCommand("whoami")
      const text = result.lines.map((l) => l.text).join("\n")
      expect(text).not.toContain("email:")
    })
  })

  describe("projects", () => {
    it("returns numbered list with method, name, status, year", () => {
      const result = runCommand("projects")
      expect(result.status).toBe("ok")
      expect(result.lines.length).toBeGreaterThan(0)
      expect(result.lines[0].text).toMatch(/^\d+\. \[\w+\] .+ \(\w+\) — \d{4}$/)
    })

    it("filters to shipped with --shipped", () => {
      const result = runCommand("projects --shipped")
      expect(result.status).toBe("ok")
      const text = result.lines.map((l) => l.text).join("\n")
      expect(text).not.toContain("(archived)")
      expect(text).not.toContain("(ongoing)")
    })

    it("filters by tag case-insensitively", () => {
      const result = runCommand("projects --tag ReAcT")
      expect(result.status).toBe("ok")
      expect(result.lines.length).toBeGreaterThan(0)
    })

    it("returns voiced empty line for unknown tag", () => {
      const result = runCommand("projects --tag xyzzy")
      expect(result.status).toBe("ok")
      expect(result.lines).toHaveLength(1)
      expect(result.lines[0].text).toContain("no requests match")
    })

    it("returns usage for unknown flag", () => {
      const result = runCommand("projects --unknown")
      expect(result.status).toBe("ok")
      const text = result.lines.map((l) => l.text).join("\n")
      expect(text).toContain("unknown flag")
      expect(text).toContain("usage:")
    })
  })

  describe("contact", () => {
    it("returns navigate effect to /sources", () => {
      const result = runCommand("contact")
      expect(result.status).toBe("ok")
      expect(result.effect).toEqual({
        type: "navigate",
        to: "/sources",
      } satisfies ReplEffect)
      expect(result.lines[0].text).toContain("contact")
    })
  })

  describe("theme", () => {
    it("acknowledges dark", () => {
      const result = runCommand("theme dark")
      expect(result.status).toBe("ok")
      expect(result.lines[0].text).toContain("already dark")
    })

    it("refuses light with exact copy", () => {
      const result = runCommand("theme light")
      expect(result.status).toBe("ok")
      expect(result.lines[0].text).toBe(
        "Site is dark-only. The vibe is intentional."
      )
    })

    it("refuses any non-dark arg with same copy", () => {
      const result = runCommand("theme neon")
      expect(result.status).toBe("ok")
      expect(result.lines[0].text).toBe(
        "Site is dark-only. The vibe is intentional."
      )
    })

    it("shows current + usage when bare", () => {
      const result = runCommand("theme")
      expect(result.status).toBe("ok")
      const text = result.lines.map((l) => l.text).join("\n")
      expect(text).toContain("current theme: dark")
      expect(text).toContain("usage:")
    })
  })

  describe("clear", () => {
    it("returns clear effect and no lines", () => {
      const result = runCommand("clear")
      expect(result.status).toBe("ok")
      expect(result.lines).toHaveLength(0)
      expect(result.effect).toEqual({ type: "clear" } satisfies ReplEffect)
    })
  })

  describe("download resume", () => {
    it("returns download effect with correct href", () => {
      const result = runCommand("download resume")
      expect(result.status).toBe("ok")
      expect(result.effect).toEqual({
        type: "download",
        href: "/hossam-marey-resume.pdf",
      } satisfies ReplEffect)
      expect(result.lines[0].text).toContain("descent")
    })
  })

  describe("unknown command", () => {
    it("returns not-found status with exact wording", () => {
      const result = runCommand("xyzzy")
      expect(result.status).toBe("not-found")
      expect(result.lines[0].text).toBe(
        "command not found: xyzzy. Type 'help' for available commands."
      )
    })

    it("does not suggest for far strings", () => {
      const result = runCommand("xyzzy")
      expect(result.lines).toHaveLength(1)
    })

    it("suggests for near miss", () => {
      const result = runCommand("whoam")
      expect(result.status).toBe("not-found")
      expect(result.lines).toHaveLength(2)
      expect(result.lines[1].text).toBe("did you mean: whoami?")
    })

    it("does not suggest download resume for download cv (distance >= 3)", () => {
      const result = runCommand("download cv")
      expect(result.status).toBe("not-found")
      expect(result.lines).toHaveLength(1)
    })

    it("handles empty input defensively", () => {
      const result = runCommand("")
      expect(result.status).toBe("ok")
      expect(result.lines[0].text).toContain("help")
    })

    it("handles whitespace-only input defensively", () => {
      const result = runCommand("   ")
      expect(result.status).toBe("ok")
      expect(result.lines[0].text).toContain("help")
    })
  })

  describe("experimental", () => {
    it("returns not-found when locked", () => {
      const result = runCommand("experimental")
      expect(result.status).toBe("not-found")
      expect(result.lines[0].text).toContain("command not found")
    })

    it("does not suggest experimental while locked", () => {
      const result = runCommand("experimen")
      expect(result.status).toBe("not-found")
      // No "did you mean" suggestion for locked commands
      expect(result.lines).toHaveLength(1)
    })
  })

  describe("case insensitivity", () => {
    it("matches commands case-insensitively", () => {
      expect(runCommand("HELP").status).toBe("ok")
      expect(runCommand("WhoAmI").status).toBe("ok")
      expect(runCommand("Download Resume").status).toBe("ok")
    })
  })
})

describe("levenshtein", () => {
  it("returns 0 for identical strings", () => {
    expect(levenshtein("abc", "abc")).toBe(0)
  })

  it("is symmetric", () => {
    expect(levenshtein("kitten", "sitting")).toBe(
      levenshtein("sitting", "kitten")
    )
  })

  it("is non-negative", () => {
    expect(levenshtein("a", "b")).toBeGreaterThanOrEqual(0)
  })

  it("returns string length when comparing to empty", () => {
    expect(levenshtein("hello", "")).toBe(5)
    expect(levenshtein("", "hello")).toBe(5)
  })
})

describe("fast-check properties", () => {
  it("levenshtein is non-negative for any strings", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        return levenshtein(a, b) >= 0
      })
    )
  })

  it("levenshtein identity: d(a,a) = 0", () => {
    fc.assert(
      fc.property(fc.string(), (a) => {
        return levenshtein(a, a) === 0
      })
    )
  })

  it("levenshtein symmetry: d(a,b) = d(b,a)", () => {
    fc.assert(
      fc.property(fc.string(), fc.string(), (a, b) => {
        return levenshtein(a, b) === levenshtein(b, a)
      })
    )
  })

  it("runCommand never throws and always returns a valid status", () => {
    fc.assert(
      fc.property(fc.string(), (raw) => {
        let result: ReplResult
        try {
          result = runCommand(raw)
        } catch {
          return false
        }
        return result.status === "ok" || result.status === "not-found"
      })
    )
  })
})
