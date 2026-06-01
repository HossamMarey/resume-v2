"use client"

import type { FormEvent, KeyboardEvent } from "react"

import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

import { ArrowDown, ArrowUp } from "lucide-react"

import { runCommand } from "@/lib/repl/commands"
import type { ReplLine } from "@/lib/repl/commands"
import { useUnlocks } from "@/hooks/use-unlocks"
import { emitXP } from "@/lib/xp/bus"

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
  const inputRef = useRef<HTMLInputElement>(null)
  const transcriptRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)

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

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      const command = input.trim()
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
    [input, scrollToBottom, router, unlocks]
  )

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "ArrowUp") {
        e.preventDefault()
        stepHistory("prev")
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        stepHistory("next")
      }
    },
    [stepHistory]
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
      <div
        ref={transcriptRef}
        aria-live="polite"
        className="flex-1 overflow-y-auto font-mono text-sm"
        role="log"
      >
        {transcript.map((line) => (
          <div key={line.id} className={lineClass(line.kind)}>
            {line.kind === "input" && <span className="me-1 text-lime">$</span>}
            {line.text}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="mt-2 flex items-center gap-2">
        <span className="font-mono text-sm text-lime" aria-hidden="true">
          $
        </span>
        <input
          ref={inputRef}
          aria-label="Console input"
          className="flex-1 bg-transparent font-mono text-sm text-foreground outline-none focus-visible:ring-1 focus-visible:ring-ring"
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          type="text"
          value={input}
        />
      </form>

      <div className="mt-2 flex gap-2 sm:hidden">
        <button
          aria-label="Previous command"
          className="focus-visible:ring-1 focus-visible:ring-ring"
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
          className="focus-visible:ring-1 focus-visible:ring-ring"
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
