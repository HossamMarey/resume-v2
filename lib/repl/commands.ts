import {
  EXPERIMENTAL_ENABLED,
  experimental,
  profile,
  projects,
} from "@/lib/content"

export type ReplLineKind = "output" | "notice" | "error"

export type ReplEffect =
  | { type: "clear" }
  | { type: "download"; href: string }
  | { type: "navigate"; to: string }

export interface ReplLine {
  kind: ReplLineKind
  text: string
}

export interface ReplResult {
  lines: ReplLine[]
  status: "ok" | "not-found"
  effect?: ReplEffect
}

// Slash commands are the canonical surface (Claude-Code style). Registry keys
// stay bare; every display surface prefixes with "/" and runCommand accepts an
// optional leading slash.
const PREFIX = "/"

function display(name: string): string {
  return PREFIX + name
}

function line(kind: ReplLineKind, text: string): ReplLine {
  return { kind, text }
}

function ok(lines: ReplLine[], effect?: ReplEffect): ReplResult {
  return { lines, status: "ok", effect }
}

function notFound(input: string, suggestion?: string): ReplResult {
  const lines: ReplLine[] = [
    line(
      "error",
      `command not found: ${input}. Type '/help' for available commands.`
    ),
  ]
  if (suggestion) {
    lines.push(line("error", `did you mean: ${suggestion}?`))
  }
  return { lines, status: "not-found" }
}

export function levenshtein(a: string, b: string): number {
  const s = a.toLowerCase()
  const t = b.toLowerCase()
  const m = s.length
  const n = t.length

  if (m === 0) return n
  if (n === 0) return m

  let prev = new Array(n + 1)
  let curr = new Array(n + 1)

  for (let j = 0; j <= n; j++) {
    prev[j] = j
  }

  for (let i = 1; i <= m; i++) {
    curr[0] = i
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost)
    }
    ;[prev, curr] = [curr, prev]
  }

  return prev[n]
}

interface CommandEntry {
  name: string
  summary: string
  locked?: boolean
  run(args: string[], unlocks: string[]): ReplResult
}

function isVisible(entry: CommandEntry, unlocks: string[]): boolean {
  if (!entry.locked) return true
  return EXPERIMENTAL_ENABLED && unlocks.includes("konami")
}

function suggest(
  input: string,
  registry: CommandEntry[],
  unlocks: string[]
): string | undefined {
  let best: string | undefined
  let bestDist = Infinity

  for (const entry of registry) {
    if (!isVisible(entry, unlocks)) continue
    const dist = levenshtein(input, entry.name)
    if (dist < 3 && dist < bestDist) {
      bestDist = dist
      best = entry.name
    }
  }

  return best ? display(best) : undefined
}

const registry: CommandEntry[] = [
  {
    name: "help",
    summary: "list available commands",
    run(_args, _unlocks: string[]) {
      const visible = registry.filter((c) => isVisible(c, _unlocks))
      const maxLen = Math.max(...visible.map((c) => display(c.name).length))
      const lines = visible.map((c) =>
        line("output", `${display(c.name).padEnd(maxLen)} — ${c.summary}`)
      )
      return ok(lines)
    },
  },
  {
    name: "whoami",
    summary: "who is Hossam",
    run() {
      const lines: ReplLine[] = [
        line(
          "output",
          `${profile.name} — ${profile.role} · ${profile.years}+ yrs · ${profile.location}`
        ),
        line("output", `> ${profile.tagline}`),
        line(
          "output",
          "> Right now I'm making a DevTools panel pretend to be a résumé. You're standing inside it."
        ),
      ]
      return ok(lines)
    },
  },
  {
    name: "experimental",
    summary: "what I'm building next",
    locked: true,
    run() {
      if (!EXPERIMENTAL_ENABLED) {
        return notFound("experimental")
      }
      const lines: ReplLine[] = [
        line("output", experimental.title),
        ...experimental.lines.map((l) => line("output", l)),
      ]
      return ok(lines)
    },
  },
  {
    name: "projects",
    summary: "list projects (flags: --featured, --tag <x>)",
    run(args) {
      const featuredFlag = args.includes("--featured")
      const tagIdx = args.indexOf("--tag")
      const tagValue = tagIdx !== -1 ? args[tagIdx + 1] : undefined
      const tagFilter =
        tagValue && !tagValue.startsWith("--")
          ? tagValue.toLowerCase()
          : undefined

      if (tagIdx !== -1 && !tagFilter) {
        return ok([
          line("output", "flag --tag requires a value"),
          line("output", "usage: projects [--featured] [--tag <stack-item>]"),
        ])
      }

      let filtered = [...projects]

      if (featuredFlag) {
        filtered = filtered.filter((p) => p.featured)
      }

      if (tagFilter) {
        filtered = filtered.filter((p) =>
          p.stack.some((s) => s.toLowerCase().includes(tagFilter))
        )
      }

      if (filtered.length === 0) {
        const filterDesc = tagFilter
          ? `--tag ${args[tagIdx + 1]}`
          : featuredFlag
            ? "--featured"
            : ""
        return ok([line("output", `no requests match: ${filterDesc}`)])
      }

      const lines = filtered.map((p, i) =>
        line(
          "output",
          `${i + 1}. ${p.name} — ${p.type}${p.stack.length ? ` · ${p.stack.slice(0, 3).join(", ")}` : ""}`
        )
      )
      return ok(lines)
    },
  },
  {
    name: "contact",
    summary: "navigate to contact form",
    run() {
      return ok([line("output", "Opening the contact channel…")], {
        type: "navigate",
        to: "/sources",
      })
    },
  },
  {
    name: "theme",
    summary: "show current theme (dark-only)",
    run(args) {
      if (args.length === 0) {
        return ok([
          line("output", "current theme: dark"),
          line("output", "usage: theme <dark|light>"),
        ])
      }

      const sub = args[0].toLowerCase()
      if (sub === "dark") {
        return ok([line("output", "theme is already dark.")])
      }

      return ok([line("output", "Site is dark-only. The vibe is intentional.")])
    },
  },
  {
    name: "clear",
    summary: "clear the transcript",
    run() {
      return ok([], { type: "clear" })
    },
  },
  {
    name: "download resume",
    summary: "download résumé PDF",
    run() {
      return ok([line("output", "Initiating résumé descent…")], {
        type: "download",
        href: "/hossam-marey-resume.pdf",
      })
    },
  },
]

// Visible commands for the autocomplete menu — bare names + summaries; the
// consumer prefixes "/" for display and completion.
export function listCommands(
  unlocks: string[] = []
): { name: string; summary: string }[] {
  return registry
    .filter((c) => isVisible(c, unlocks))
    .map((c) => ({ name: c.name, summary: c.summary }))
}

export function runCommand(raw: string, unlocks: string[] = []): ReplResult {
  const trimmed = raw.trim()
  // Accept an optional single leading "/" so both /help and help resolve.
  const normalized = (
    trimmed.startsWith(PREFIX) ? trimmed.slice(PREFIX.length) : trimmed
  ).trim()
  if (!normalized) {
    return ok([line("output", "Type '/help' for available commands.")])
  }

  const tokens = normalized.split(/\s+/)
  const firstTwo = tokens.slice(0, 2).join(" ").toLowerCase()
  const firstOne = tokens[0].toLowerCase()

  let entry = registry.find((c) => c.name.toLowerCase() === firstTwo)
  let args = tokens.slice(2)

  if (!entry) {
    entry = registry.find((c) => c.name.toLowerCase() === firstOne)
    args = tokens.slice(1)
  }

  if (!entry) {
    return notFound(trimmed, suggest(firstOne, registry, unlocks))
  }

  // Locked commands stay hidden — return not-found so the user gets no hint
  // that the command exists before it is unlocked.
  if (entry.locked && !isVisible(entry, unlocks)) {
    return notFound(trimmed, suggest(firstOne, registry, unlocks))
  }

  if (entry.name === "projects") {
    const knownFlags = new Set(["--featured", "--tag"])
    const unknownFlag = args.find(
      (a) => a.startsWith("--") && !knownFlags.has(a)
    )
    if (unknownFlag) {
      return ok([
        line("output", `unknown flag: ${unknownFlag}`),
        line("output", "usage: projects [--featured] [--tag <stack-item>]"),
      ])
    }
  }

  return entry.run(args, unlocks)
}
