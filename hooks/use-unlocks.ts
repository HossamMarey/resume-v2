"use client"

import { useEffect, useState } from "react"

import { readUnlocks, UNLOCK_EVENT } from "@/lib/unlocks/bus"

export function useUnlocks() {
  const [unlocks, setUnlocks] = useState<string[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Attach the listener synchronously on mount so a same-tick unlock
    // (e.g. from the Konami listener) is not missed.
    function onUnlock() {
      setUnlocks(readUnlocks())
    }

    window.addEventListener(UNLOCK_EVENT, onUnlock)

    // Defer the initial read out of the effect body to avoid a synchronous
    // setState and any hydration mismatch.
    const raf = requestAnimationFrame(() => {
      setUnlocks(readUnlocks())
      setMounted(true)
    })

    return () => {
      window.removeEventListener(UNLOCK_EVENT, onUnlock)
      cancelAnimationFrame(raf)
    }
  }, [])

  const activeUnlocks = mounted ? unlocks : []

  return {
    unlocks: activeUnlocks,
    isUnlocked: (name: string) => activeUnlocks.includes(name),
  }
}
