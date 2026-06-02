"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"

import { ChromePulse } from "@/components/chrome-pulse"
import { advanceKonami, isKonamiComplete, isTypingTarget } from "@/lib/keyboard"
import { EXPERIMENTAL_ENABLED } from "@/lib/content"
import { addUnlock } from "@/lib/unlocks/bus"
import { emitXP } from "@/lib/xp/bus"

const KEY_TIMEOUT_MS = 2000

export function KonamiListener() {
  const [pulse, setPulse] = useState(false)
  const progressRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const pathnameRef = useRef(pathname)

  useEffect(() => {
    pathnameRef.current = pathname
  })

  useEffect(() => {
    function resetTimer() {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
      timerRef.current = setTimeout(() => {
        progressRef.current = 0
      }, KEY_TIMEOUT_MS)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (pathnameRef.current === "/recruiter") {
        return
      }

      if (event.defaultPrevented || event.repeat) {
        return
      }

      if (event.metaKey || event.ctrlKey || event.altKey) {
        return
      }

      if (isTypingTarget(event.target)) {
        return
      }

      const next = advanceKonami(progressRef.current, event.key)
      progressRef.current = next

      if (next > 0) {
        resetTimer()
      }

      if (isKonamiComplete(next)) {
        progressRef.current = 0
        if (timerRef.current) {
          clearTimeout(timerRef.current)
          timerRef.current = null
        }

        if (!EXPERIMENTAL_ENABLED) {
          return
        }

        addUnlock("konami")
        emitXP(20, "konami")
        setPulse(true)
      }
    }

    window.addEventListener("keydown", onKeyDown)

    return () => {
      window.removeEventListener("keydown", onKeyDown)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [])

  return <ChromePulse active={pulse} onDone={() => setPulse(false)} />
}
