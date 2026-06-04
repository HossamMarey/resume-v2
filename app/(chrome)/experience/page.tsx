import type { Metadata } from "next"

import { ExperienceTimeline } from "@/components/experience-timeline"

export const metadata: Metadata = {
  title: "Experience",
  description:
    "Work history and career timeline for Hossam Marey — full-time roles and freelance engagements.",
  alternates: { canonical: "/experience" },
  openGraph: {
    url: "/experience",
    title: "Experience — devtools://hossam",
    description:
      "Work history and career timeline for Hossam Marey — full-time roles and freelance engagements.",
  },
}

export default function ExperiencePage() {
  return (
    <section className="p-4">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-mono text-lg">Experience</h1>
        <div className="mt-6">
          <ExperienceTimeline />
        </div>
      </div>
    </section>
  )
}
