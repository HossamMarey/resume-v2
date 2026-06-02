import type { Metadata } from "next"

import { RecruiterResume } from "@/components/recruiter-resume"
import { RecruiterExit } from "@/components/recruiter-exit"

import "./print.css"

export const metadata: Metadata = {
  title: { absolute: "Hossam Marey — Senior Front-End Developer" },
  description:
    "Senior Front-End Developer building fast, accessible interfaces for data-heavy products. Read the editorial resume.",
  alternates: { canonical: "/recruiter" },
  openGraph: {
    url: "/recruiter",
    title: "Hossam Marey — Senior Front-End Developer",
    description:
      "Senior Front-End Developer building fast, accessible interfaces for data-heavy products. Read the editorial resume.",
  },
}

export default function RecruiterPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-16 print:py-0">
      <div className="mb-8 print:hidden">
        <RecruiterExit />
      </div>
      <RecruiterResume />
    </main>
  )
}
