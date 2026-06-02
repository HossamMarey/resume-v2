"use client"

import { useRouter } from "next/navigation"

import { useRecruiterMode } from "@/hooks/use-recruiter-mode"

export function RecruiterExit() {
  const router = useRouter()
  const { setRecruiterMode } = useRecruiterMode()

  const handleClick = () => {
    setRecruiterMode(false)
    router.push("/")
  }

  return (
    <button
      onClick={handleClick}
      className="font-mono text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      aria-label="Exit Recruiter Mode"
    >
      Exit Recruiter Mode
    </button>
  )
}
