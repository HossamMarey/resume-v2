"use client"

import { useEffect, useState } from "react"

import { applyDelta, clampXp, emitXP, XP_EVENT } from "@/lib/xp/bus"
import type { XPEventDetail } from "@/lib/xp/bus"

const STORAGE_KEY = "hm_xp_v1"

function readXp(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? clampXp(Number(raw)) : 0
  } catch {
    return 0
  }
}

function writeXp(xp: number): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(xp))
  } catch {
    // Private mode / quota exceeded: degrade to in-memory, no persistence.
  }
}

export function useXP() {
  const [xp, setXp] = useState(0)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Attach the listener synchronously on mount so the (chrome) layout's
    // first synchronous visit:* emit — which fires before any deferred frame —
    // is not missed. Derive the next value from the persisted base rather than
    // React state so an event arriving before the rAF read can't clobber it.
    function onXp(event: Event) {
      const { delta } = (event as CustomEvent<XPEventDetail>).detail
      const next = applyDelta(readXp(), delta)
      writeXp(next)
      setXp(next)
    }

    window.addEventListener(XP_EVENT, onXp)

    // Defer the initial read out of the effect body to avoid a synchronous
    // setState (react-hooks/set-state-in-effect) and any hydration mismatch.
    const raf = requestAnimationFrame(() => {
      setXp(readXp())
      setMounted(true)
    })

    return () => {
      window.removeEventListener(XP_EVENT, onXp)
      cancelAnimationFrame(raf)
    }
  }, [])

  return { xp: mounted ? xp : 0, emitXP }
}
