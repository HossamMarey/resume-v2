"use client"

import { useEffect, useState } from "react"

import { useShouldAnimate } from "@/hooks/use-should-animate"

interface UseTypewriterOptions {
  enabled?: boolean
  speedMs?: number
}

interface UseTypewriterResult {
  text: string
  done: boolean
}

export function useTypewriter(
  fullText: string,
  { enabled = true, speedMs = 40 }: UseTypewriterOptions = {}
): UseTypewriterResult {
  const shouldAnimate = useShouldAnimate()
  const active = enabled && shouldAnimate

  const [charIndex, setCharIndex] = useState(0)

  useEffect(() => {
    if (!active) {
      const id = setTimeout(() => setCharIndex(fullText.length), 0)
      return () => clearTimeout(id)
    }

    let index = 0
    let timerId: ReturnType<typeof setTimeout>

    const resetId = setTimeout(() => {
      setCharIndex(0)

      const tick = () => {
        index += 1
        setCharIndex(index)
        if (index < fullText.length) {
          timerId = setTimeout(tick, speedMs)
        }
      }

      timerId = setTimeout(tick, speedMs)
    }, 0)

    return () => {
      clearTimeout(resetId)
      clearTimeout(timerId)
    }
  }, [fullText, active, speedMs])

  const done = !active || charIndex >= fullText.length
  const text = active ? fullText.slice(0, charIndex) : fullText

  return { text, done }
}
