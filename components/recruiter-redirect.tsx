"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

import { useRecruiterMode } from "@/hooks/use-recruiter-mode"

export function RecruiterRedirect() {
  const router = useRouter()
  const { mounted, isRecruiterMode } = useRecruiterMode()

  useEffect(() => {
    if (mounted && isRecruiterMode) {
      router.replace("/recruiter")
    }
  }, [mounted, isRecruiterMode, router])

  return null
}
