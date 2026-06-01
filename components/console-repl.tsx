"use client"

import type { FormEvent, KeyboardEvent } from "react"

import { useCallback, useEffect, useRef, useState } from "react"

import { ArrowDown, ArrowUp } from "lucide-react"

type ConsoleLine = {
  id: number
  kind: "input" | "notice"
  text: string
}

// Story 5.2 seam: replace this stub with lib/repl/commands.ts
// The registry returns response lines (including "command not found")
// and fires emitXP(5, "repl:command") on success.
// Stub seam for Story 5.2 command registry
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function runCommand(_command: string): ConsoleLine[] {
  return []
}

export function ConsoleREPL() {
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

      const outputLines = runCommand(command)
      setTranscript((prev) => [...prev, inputLine, ...outputLines])
      setHistory((prev) => [...prev, command])
      setHistoryIndex(-1)
      setDraft("")
      setInput("")

      requestAnimationFrame(() => {
        scrollToBottom()
      })
    },
    [input, scrollToBottom]
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

  return (
    <div className="flex h-full flex-col">
      <div
        ref={transcriptRef}
        aria-live="polite"
        className="flex-1 overflow-y-auto font-mono text-sm"
        role="log"
      >
        {transcript.map((line) => (
          <div
            key={line.id}
            className={
              line.kind === "notice"
                ? "text-muted-foreground"
                : "text-foreground"
            }
          >
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
