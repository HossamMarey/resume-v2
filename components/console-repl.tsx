"use client"

import type { FormEvent, KeyboardEvent } from "react"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react"

import { ArrowDown, ArrowUp } from "lucide-react"

import { listCommands, runCommand } from "@/lib/repl/commands"
import type { ReplLine } from "@/lib/repl/commands"
import { useUnlocks } from "@/hooks/use-unlocks"
import { emitXP } from "@/lib/xp/bus"
import { cn } from "@/lib/utils"

type ConsoleLine = {
  id: number
  kind: "input" | "notice" | "output" | "error"
  text: string
}

function mapReplLine(id: number, line: ReplLine): ConsoleLine {
  return {
    id,
    kind: line.kind,
    text: line.text,
  }
}

export function ConsoleREPL() {
  const router = useRouter()
  const { unlocks } = useUnlocks()
  const [transcript, setTranscript] = useState<ConsoleLine[]>([])
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [input, setInput] = useState("")
  const [draft, setDraft] = useState("")
  const [menuIndex, setMenuIndex] = useState(0)
  const [menuDismissed, setMenuDismissed] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const listboxId = useId()

  // Autocomplete is a Claude-Code-style slash menu: open while the input is a
  // bare "/command" token (no space yet) and at least one visible command
  // matches. Dismissed by Esc until the input changes.
  const suggestions = useMemo(() => {
    const token = input.trimStart()
    const open = token.startsWith("/") && !token.slice(1).includes(" ")
    if (!open || menuDismissed) return []
    const query = token.slice(1).toLowerCase()
    return listCommands(unlocks).filter((c) =>
      c.name.toLowerCase().startsWith(query)
    )
  }, [input, menuDismissed, unlocks])
  const menuOpen = suggestions.length > 0
  const activeIndex = menuIndex < suggestions.length ? menuIndex : 0
  const optionId = (i: number) => `${listboxId}-opt-${i}`

  useEffect(() => {
    inputRef.current?.focus({ preventScroll: true })
  }, [])

  const scrollToBottom = useCallback(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight
    }
  }, [])

  const stepHistory = useCallback(
    (direction: "prev" | "next") => {
      if (history.length === 0) return

      if (direction === "prev") {
        if (historyIndex === -1) {
          setDraft(input)
          setHistoryIndex(history.length - 1)
          setInput(history[history.length - 1])
        } else {
          const nextIndex = Math.max(0, historyIndex - 1)
          setHistoryIndex(nextIndex)
          setInput(history[nextIndex])
        }
      } else {
        if (historyIndex === -1) return
        const nextIndex = historyIndex + 1
        if (nextIndex >= history.length) {
          setHistoryIndex(-1)
          setInput(draft)
        } else {
          setHistoryIndex(nextIndex)
          setInput(history[nextIndex])
        }
      }
    },
    [history, historyIndex, input, draft]
  )

  const execute = useCallback(
    (raw: string) => {
      const command = raw.trim()
      if (!command) return

      const lineId = idRef.current++
      const inputLine: ConsoleLine = {
        id: lineId,
        kind: "input",
        text: command,
      }

      const result = runCommand(command, unlocks)

      setTranscript((prev) => {
        if (result.effect?.type === "clear") return []
        const outputLines = result.lines.map((l) =>
          mapReplLine(idRef.current++, l)
        )
        return [...prev, inputLine, ...outputLines]
      })
      setHistory((prev) => [...prev, command])
      setHistoryIndex(-1)
      setDraft("")
      setInput("")
      setMenuDismissed(false)
      setMenuIndex(0)

      if (result.status === "ok") {
        emitXP(5, "repl:command")

        if (result.effect) {
          switch (result.effect.type) {
            case "download": {
              if (!result.effect.href.startsWith("/")) break
              const a = document.createElement("a")
              a.href = result.effect.href
              a.download = ""
              document.body.appendChild(a)
              a.click()
              document.body.removeChild(a)
              break
            }
            case "navigate": {
              router.push(result.effect.to)
              break
            }
          }
        }
      }

      requestAnimationFrame(() => {
        scrollToBottom()
      })
    },
    [scrollToBottom, router, unlocks]
  )

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      execute(input)
    },
    [execute, input]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      // Menu-open branch takes precedence over history navigation.
      if (menuOpen) {
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault()
            setMenuIndex((activeIndex + 1) % suggestions.length)
            return
          case "ArrowUp":
            e.preventDefault()
            setMenuIndex(
              (activeIndex - 1 + suggestions.length) % suggestions.length
            )
            return
          case "Tab":
            e.preventDefault()
            setInput(`/${suggestions[activeIndex].name} `)
            setMenuDismissed(true)
            setMenuIndex(0)
            return
          case "Enter":
            e.preventDefault()
            execute(`/${suggestions[activeIndex].name}`)
            return
          case "Escape":
            e.preventDefault()
            setMenuDismissed(true)
            return
        }
      }

      if (e.key === "ArrowUp") {
        e.preventDefault()
        stepHistory("prev")
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        stepHistory("next")
      }
    },
    [menuOpen, suggestions, activeIndex, execute, stepHistory]
  )

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      const text = e.clipboardData.getData("text")
      const lines = text.split(/\r?\n/)
      if (lines.length > 1) {
        e.preventDefault()
        const firstLine = lines[0]
        setHistoryIndex(-1)
        setDraft("")
        setInput(firstLine)
        const noticeId = idRef.current++
        const noticeLine: ConsoleLine = {
          id: noticeId,
          kind: "notice",
          text: `note: pasted ${lines.length - 1} additional line(s) ignored — one command per line`,
        }
        setTranscript((prev) => [...prev, noticeLine])
        requestAnimationFrame(() => {
          scrollToBottom()
        })
      }
    },
    [scrollToBottom]
  )

  const lineClass = (kind: ConsoleLine["kind"]): string => {
    switch (kind) {
      case "notice":
        return "text-muted-foreground"
      case "error":
        return "text-status-err"
      case "output":
      case "input":
      default:
        return "text-foreground"
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 rounded-lg border border-hairline bg-surface-2 px-3 py-2 font-mono text-sm text-muted-foreground">
        <p className="text-foreground">devtools://hossam — console</p>
        <p>
          Real shell, not a prop. Type <span className="text-lime">/help</span>{" "}
          to see what it does.
        </p>
      </div>

      <div
        ref={transcriptRef}
        aria-live="polite"
        className="flex-1 space-y-1 overflow-y-auto font-mono text-sm"
        role="log"
      >
        {transcript.map((line) => (
          <div key={line.id} className={lineClass(line.kind)}>
            {line.kind === "input" && <span className="me-1 text-lime">▸</span>}
            {line.text}
          </div>
        ))}
      </div>

      <div className="relative mt-2">
        {menuOpen && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="Command suggestions"
            className="absolute bottom-full mb-2 max-h-60 w-full overflow-y-auto rounded-lg border border-hairline bg-popover p-1 shadow-lg"
          >
            {suggestions.map((c, i) => (
              <li
                key={c.name}
                id={optionId(i)}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => {
                  // Run before the input blurs (mousedown, not click).
                  e.preventDefault()
                  execute(`/${c.name}`)
                }}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-4 rounded px-2 py-1.5 font-mono text-sm",
                  i === activeIndex
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <span className="text-lime">/{c.name}</span>
                <span className="truncate text-xs text-muted-foreground">
                  {c.summary}
                </span>
              </li>
            ))}
          </ul>
        )}

        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3 py-2 focus-within:ring-1 focus-within:ring-ring"
        >
          <span className="font-mono text-sm text-lime" aria-hidden="true">
            ▸
          </span>
          <input
            ref={inputRef}
            aria-label="Console input"
            aria-autocomplete="list"
            aria-expanded={menuOpen}
            aria-controls={menuOpen ? listboxId : undefined}
            aria-activedescendant={menuOpen ? optionId(activeIndex) : undefined}
            autoComplete="off"
            className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none"
            onChange={(e) => {
              setInput(e.target.value)
              setMenuIndex(0)
              setMenuDismissed(false)
            }}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            role="combobox"
            type="text"
            value={input}
          />
        </form>
      </div>

      <div className="mt-2 flex items-center gap-2 font-mono text-xs text-muted-foreground">
        <span>
          type <span className="text-lime">/</span> for commands
        </span>
        <span aria-hidden="true">·</span>
        <span>↑↓ history</span>
        <span aria-hidden="true">·</span>
        <span>⇥ complete</span>
        <span aria-hidden="true">·</span>
        <span>↵ run</span>
      </div>

      <div className="mt-2 flex gap-2 sm:hidden">
        <button
          aria-label="Previous command"
          className="rounded border border-hairline p-1.5 text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          onClick={() => {
            stepHistory("prev")
            inputRef.current?.focus()
          }}
          type="button"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
        <button
          aria-label="Next command"
          className="rounded border border-hairline p-1.5 text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring"
          onClick={() => {
            stepHistory("next")
            inputRef.current?.focus()
          }}
          type="button"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
