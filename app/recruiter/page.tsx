import type { Metadata } from "next"

import { RecruiterResume } from "@/components/recruiter-resume"
import { RecruiterExit } from "@/components/recruiter-exit"

export const metadata: Metadata = {
  title: "Hossam Marey — Senior Front-End Developer",
}

export default function RecruiterPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16">
      <div className="mb-8">
        <RecruiterExit />
      </div>
      <RecruiterResume />
    </main>
  )
}
