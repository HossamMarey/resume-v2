"use client"

import { useEffect, useState } from "react"

import {
  readRecruiterMode,
  RECRUITER_EVENT,
  writeRecruiterMode,
} from "@/lib/recruiter/bus"

export function useRecruiterMode() {
  const [mode, setMode] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Attach the listener synchronously on mount so a same-tick write
    // is not missed.
    function onChange() {
      setMode(readRecruiterMode())
    }

    window.addEventListener(RECRUITER_EVENT, onChange)

    // Defer the initial read out of the effect body to avoid a synchronous
    // setState and any hydration mismatch.
    const raf = requestAnimationFrame(() => {
      setMode(readRecruiterMode())
      setMounted(true)
    })

    return () => {
      window.removeEventListener(RECRUITER_EVENT, onChange)
      cancelAnimationFrame(raf)
    }
  }, [])

  return {
    isRecruiterMode: mounted ? mode : false,
    mounted,
    setRecruiterMode: writeRecruiterMode,
  }
}
